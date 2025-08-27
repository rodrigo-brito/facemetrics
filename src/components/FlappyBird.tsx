import { useEffect, useRef, useState, useCallback } from 'react';
import styled from '@emotion/styled';

const GameContainer = styled.div`
  position: relative;
  width: 100%;
  height: 480px;
  background: linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%);
  border-radius: 8px;
  overflow: hidden;
  
  &:before {
    content: "";
    display: block;
    padding-top: 120%;
  }
  
  @media (min-width: 1024px) {
    &:before {
      padding-top: 120%;
    }
  }
`;

const GameWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const GameCanvas = styled.canvas`
  width: 100%;
  height: 100%;
`;

const GameOverlay = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: ${props => props.visible ? 1 : 0};
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
  transition: opacity 0.3s;
`;

const Score = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 1.2em;
`;

const Lives = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 1.2em;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const HeartContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Heart = styled.span<{ type: 'full' | 'half' | 'empty' }>`
  color: ${props => {
    switch (props.type) {
      case 'full': return '#ff4757';
      case 'half': return '#ff4757';
      case 'empty': return '#ddd';
    }
  }};
  font-size: 1.3em;
  position: relative;
  
  ${props => props.type === 'half' && `
    &::after {
      content: '♡';
      position: absolute;
      left: 0;
      color: #ddd;
      clip-path: inset(0 50% 0 0);
    }
  `}
`;

const AudioControls = styled.div`
  position: absolute;
  top: 50px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const AudioButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(76, 175, 80, 0.8)' : 'rgba(0, 0, 0, 0.5)'};
  color: white;
  border: none;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background: ${props => props.active ? 'rgba(76, 175, 80, 1)' : 'rgba(0, 0, 0, 0.7)'};
  }
`;

const RestartButton = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 1.2em;
  cursor: pointer;
  margin-top: 20px;
  
  &:hover {
    background: #45a049;
  }
`;

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed?: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  passed: boolean;
}

interface GameProps {
  mouthOpenness: number;
}

// Threshold for mouth openness to make the bird fly
const MOUTH_THRESHOLD = 0.7; // Reduced from 1cm for easier control
// Pipe settings
const PIPE_WIDTH = 50;
const PIPE_GAP = 220; // Increased gap for even easier gameplay
const PIPE_SPEED = 1.2; // Slower pipe speed for easier navigation
const PIPE_INTERVAL = 4000; // 4 seconds between pipes (more time to react)
// Number of lives the bird starts with (in half-hearts)
const MAX_LIVES = 6; // 3 full hearts = 6 half hearts

export const FlappyBird: React.FC<GameProps> = ({ mouthOpenness }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  
  // Audio refs
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const pointSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);
  const lifeLostRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio
  useEffect(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Background music - upbeat flying theme
    const createBackgroundMusic = () => {
      const audio = new Audio();
      const sampleRate = 44100;
      const duration = 3; // 3 seconds loop
      const samples = sampleRate * duration;
      const buffer = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(buffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples * 2, true);
      
      // Generate upbeat melody
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const melody1 = Math.sin(2 * Math.PI * 440 * t) * 0.1; // A note
        const melody2 = Math.sin(2 * Math.PI * 554 * t) * 0.05; // C# note
        const beat = Math.sin(2 * Math.PI * t * 2) * 0.03; // Rhythm
        const envelope = Math.sin(2 * Math.PI * t / duration) * 0.5 + 0.5;
        const sample = (melody1 + melody2 + beat) * envelope;
        view.setInt16(44 + i * 2, sample * 0x7FFF, true);
      }
      
      const blob = new Blob([buffer], { type: 'audio/wav' });
      audio.src = URL.createObjectURL(blob);
      audio.loop = true;
      audio.volume = 0.2;
      return audio;
    };
    
    // Sound effects
    const createSoundEffect = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      return () => {
        if (!sfxEnabled) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      };
    };
    
    backgroundMusicRef.current = createBackgroundMusic();
    pointSoundRef.current = { play: createSoundEffect(1000, 0.2) } as any;
    gameOverSoundRef.current = { play: createSoundEffect(150, 1.5, 'sawtooth') } as any;
    lifeLostRef.current = { play: createSoundEffect(250, 0.7, 'square') } as any;
    
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        URL.revokeObjectURL(backgroundMusicRef.current.src);
      }
    };
  }, [sfxEnabled]);
  
  // Audio control functions
  const toggleMusic = useCallback(() => {
    if (backgroundMusicRef.current) {
      if (musicEnabled) {
        backgroundMusicRef.current.pause();
      } else {
        backgroundMusicRef.current.play().catch(console.log);
      }
    }
    setMusicEnabled(!musicEnabled);
  }, [musicEnabled]);
  
  const toggleSFX = useCallback(() => {
    setSfxEnabled(!sfxEnabled);
  }, [sfxEnabled]);
  
  const playPointSound = useCallback(() => {
    if (pointSoundRef.current && sfxEnabled) {
      (pointSoundRef.current as any).play();
    }
  }, [sfxEnabled]);
  
  const playGameOver = useCallback(() => {
    if (gameOverSoundRef.current && sfxEnabled) {
      (gameOverSoundRef.current as any).play();
    }
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
    }
  }, [sfxEnabled]);
  
  const playLifeLost = useCallback(() => {
    if (lifeLostRef.current && sfxEnabled) {
      (lifeLostRef.current as any).play();
    }
  }, [sfxEnabled]);
  
  // Helper function to render hearts
  const renderHearts = () => {
    const hearts = [];
    const fullHearts = Math.floor(lives / 2);
    const hasHalfHeart = lives % 2 === 1;
    const totalHeartSlots = MAX_LIVES / 2; // 3 heart slots
    
    for (let i = 0; i < totalHeartSlots; i++) {
      if (i < fullHearts) {
        hearts.push(<Heart key={i} type="full">♥</Heart>);
      } else if (i === fullHearts && hasHalfHeart) {
        hearts.push(<Heart key={i} type="half">♥</Heart>);
      } else {
        hearts.push(<Heart key={i} type="empty">♡</Heart>);
      }
    }
    
    return hearts;
  };
  
  // Game state ref
  const gameStateRef = useRef({
    bird: {
      x: 100,
      y: 240,
      width: 30,
      height: 25,
      velocity: 0,
      rotation: 0,
      groundTime: undefined as number | undefined
    },
    pipes: [] as Pipe[],
    score: 0,
    lives: MAX_LIVES,
    gameOver: false,
  });

  const resetGame = () => {
    gameStateRef.current = {
      bird: {
        x: 100,
        y: 240,
        width: 30,
        height: 25,
        velocity: 0,
        rotation: 0,
        groundTime: undefined
      },
      pipes: [],
      score: 0,
      lives: MAX_LIVES,
      gameOver: false,
    };
    setScore(0);
    setLives(MAX_LIVES);
    setGameOver(false);
    
    // Restart background music if enabled
    if (musicEnabled && backgroundMusicRef.current) {
      backgroundMusicRef.current.currentTime = 0;
      backgroundMusicRef.current.play().catch(console.log);
    }
  };

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastPipeTime = 0;

    const createPipe = () => {
      const minHeight = 80; // Increased minimum height for better spacing
      const maxHeight = canvas.height - PIPE_GAP - 80; // More balanced pipe heights
      const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
      
      return {
        x: canvas.width,
        topHeight,
        bottomY: topHeight + PIPE_GAP,
        width: PIPE_WIDTH,
        passed: false
      };
    };

    const drawBird = (x: number, y: number, rotation: number) => {
      ctx.save();
      ctx.translate(x + 15, y + 12);
      ctx.rotate(rotation);
      ctx.translate(-15, -12);

      // Bird body
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(15, 12, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Wing
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.ellipse(8, 12, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(18, 8, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Beak
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.moveTo(25, 12);
      ctx.lineTo(30, 10);
      ctx.lineTo(30, 14);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const drawPipe = (pipe: Pipe) => {
      ctx.fillStyle = '#228B22';
      
      // Top pipe
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      // Top pipe cap
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipe.width + 10, 20);
      
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, canvas.height - pipe.bottomY);
      // Bottom pipe cap
      ctx.fillRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 20);
    };

    const drawBackground = () => {
      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 3; i++) {
        const x = (i * 150) + 50;
        const y = 50 + (i * 30);
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const checkCollision = (bird: any, pipe: Pipe) => {
      return (
        bird.x < pipe.x + pipe.width &&
        bird.x + bird.width > pipe.x &&
        (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)
      );
    };

    const animate = (timestamp: number) => {
      if (gameStateRef.current.gameOver) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground();
      
      const bird = gameStateRef.current.bird;
      const isWideOpen = mouthOpenness > MOUTH_THRESHOLD;
      
      // Bird physics - much slower acceleration for easier control
      const lift = isWideOpen ? -0.4 : 0; // Much gentler lift acceleration
      const gravity = 0.15; // Very slow gravity for gradual falling
      bird.velocity += gravity + lift;
      bird.velocity = Math.max(-5, Math.min(4, bird.velocity)); // Lower velocity limits for slower movement
      bird.y += bird.velocity;
      
      // Bird rotation based on velocity
      bird.rotation = Math.max(-0.5, Math.min(0.5, bird.velocity * 0.05));
      
      // Boundary check - gentler handling
      if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = Math.max(0, bird.velocity * 0.3); // Softer bounce
      } else if (bird.y > canvas.height - bird.height) {
        // Hit ground - more forgiving
        bird.y = canvas.height - bird.height;
        bird.velocity = 0;
        
        // Only lose life if bird stays on ground for too long
        if (!bird.groundTime) bird.groundTime = timestamp;
        if (timestamp - bird.groundTime > 1000) { // 1 second grace period
          gameStateRef.current.lives -= 1;
          setLives(gameStateRef.current.lives);
          playLifeLost();
          
          if (gameStateRef.current.lives <= 0) {
            gameStateRef.current.gameOver = true;
            setGameOver(true);
            playGameOver();
            return;
          }
          
          // Reset bird position after life lost
          bird.y = canvas.height / 2;
          bird.velocity = 0;
          bird.groundTime = undefined;
        }
      } else {
        bird.groundTime = undefined; // Reset ground timer when not on ground
      }

      // Create pipes - ensure consistent spacing
      if (timestamp - lastPipeTime > PIPE_INTERVAL && 
          (gameStateRef.current.pipes.length === 0 || 
           gameStateRef.current.pipes[gameStateRef.current.pipes.length - 1].x < canvas.width - 250)) {
        gameStateRef.current.pipes.push(createPipe());
        lastPipeTime = timestamp;
      }

      // Update and draw pipes
      gameStateRef.current.pipes = gameStateRef.current.pipes.filter(pipe => {
        pipe.x -= PIPE_SPEED;

        // Check collision - more forgiving collision detection
        const birdHitbox = {
          x: bird.x + 3, // Smaller hitbox for easier gameplay
          y: bird.y + 3,
          width: bird.width - 6,
          height: bird.height - 6
        };
        
        if (
          birdHitbox.x < pipe.x + pipe.width &&
          birdHitbox.x + birdHitbox.width > pipe.x &&
          (birdHitbox.y < pipe.topHeight || birdHitbox.y + birdHitbox.height > pipe.bottomY)
        ) {
          gameStateRef.current.lives -= 1;
          setLives(gameStateRef.current.lives);
          playLifeLost();
          
          if (gameStateRef.current.lives <= 0) {
            gameStateRef.current.gameOver = true;
            setGameOver(true);
            playGameOver();
            return false;
          }
          
          // Reset bird position after collision with grace period
          bird.y = canvas.height / 2;
          bird.velocity = 0;
          return false;
        }

        // Score point
        if (!pipe.passed && pipe.x + pipe.width < bird.x) {
          pipe.passed = true;
          gameStateRef.current.score += 1;
          setScore(gameStateRef.current.score);
          playPointSound();
        }

        drawPipe(pipe);
        return pipe.x + pipe.width > 0;
      });

      drawBird(bird.x, bird.y, bird.rotation);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateCanvasSize);
      
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
    };
  }, [mouthOpenness, playPointSound, playLifeLost, playGameOver]);

  return (
    <GameContainer>
      <GameWrapper>
        <GameCanvas ref={canvasRef} />
        <Lives>
          Lives: 
          <HeartContainer>
            {renderHearts()}
          </HeartContainer>
        </Lives>
        <Score>Score: {score}</Score>
        <AudioControls>
          <AudioButton active={musicEnabled} onClick={toggleMusic}>
            {musicEnabled ? '🎵' : '🔇'}
          </AudioButton>
          <AudioButton active={sfxEnabled} onClick={toggleSFX}>
            {sfxEnabled ? '🔊' : '🔇'}
          </AudioButton>
        </AudioControls>
        <GameOverlay visible={gameOver}>
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <RestartButton onClick={resetGame}>Play Again</RestartButton>
        </GameOverlay>
      </GameWrapper>
    </GameContainer>
  );
};