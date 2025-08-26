import { useEffect, useRef, useState, useCallback } from 'react';
import styled from '@emotion/styled';

const GameContainer = styled.div`
  position: relative;
  width: 100%;
  height: 480px;
  background: #e3f2fd;
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

interface GameProps {
  mouthOpenness: number;
}

// Threshold for mouth openness to make the fish swim up
const MOUTH_THRESHOLD = 1;
// Minimum time between bubbles in milliseconds (3 seconds)
const BUBBLE_INTERVAL = 3000;
// Maximum number of bubbles allowed on screen at once
const MAX_BUBBLES = 3;
// Number of lives the fish starts with (in half-hearts)
const MAX_LIVES = 6; // 3 full hearts = 6 half hearts

export const FishGame: React.FC<GameProps> = ({ mouthOpenness }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  
  // Audio refs
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const bubbleCollectRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);
  const lifeLostRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio
  useEffect(() => {
    // Create audio elements using Web Audio API with synthesized sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Background music - simple ambient tone
    const createBackgroundMusic = () => {
      const audio = new Audio();
      // Create a data URL for a simple ambient sound
      const sampleRate = 44100;
      const duration = 4; // 4 seconds loop
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
      view.setUint32(16, 16, true); // PCM format
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples * 2, true);
      
      // Generate ambient underwater sound
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const wave1 = Math.sin(2 * Math.PI * 220 * t) * 0.1; // Low frequency
        const wave2 = Math.sin(2 * Math.PI * 110 * t) * 0.05; // Even lower
        const noise = (Math.random() - 0.5) * 0.02; // Gentle noise
        const envelope = Math.sin(2 * Math.PI * t / duration) * 0.5 + 0.5; // Fade in/out
        const sample = (wave1 + wave2 + noise) * envelope;
        view.setInt16(44 + i * 2, sample * 0x7FFF, true);
      }
      
      const blob = new Blob([buffer], { type: 'audio/wav' });
      audio.src = URL.createObjectURL(blob);
      audio.loop = true;
      audio.volume = 0.3;
      return audio;
    };
    
    // Sound effects using oscillators
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
    bubbleCollectRef.current = { play: createSoundEffect(800, 0.2) } as any;
    gameOverSoundRef.current = { play: createSoundEffect(200, 1, 'sawtooth') } as any;
    lifeLostRef.current = { play: createSoundEffect(300, 0.5, 'square') } as any;
    
    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        URL.revokeObjectURL(backgroundMusicRef.current.src);
      }
    };
  }, [sfxEnabled]);
  
  // Handle music toggle
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
  
  // Handle SFX toggle
  const toggleSFX = useCallback(() => {
    setSfxEnabled(!sfxEnabled);
  }, [sfxEnabled]);
  
  // Play sound effects
  const playBubbleCollect = useCallback(() => {
    if (bubbleCollectRef.current && sfxEnabled) {
      (bubbleCollectRef.current as any).play();
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
  
  // Helper function to render hearts based on remaining lives
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
  const gameStateRef = useRef({
    fish: {
      x: 50,
      y: 240,
      width: 40,
      height: 30,
      targetY: 240,
      velocity: 0
    },
    bubbles: [] as GameObject[],
    score: 0,
    lives: MAX_LIVES,
    gameOver: false,
  });

  const resetGame = () => {
    gameStateRef.current = {
      fish: {
        x: 50,
        y: 240,
        width: 40,
        height: 30,
        targetY: 240,
        velocity: 0
      },
      bubbles: [],
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

    // Set canvas size based on container size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    // Initial size setup
    updateCanvasSize();

    // Update size on window resize
    window.addEventListener('resize', updateCanvasSize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game loop
    let animationFrameId: number;
    let lastBubbleTime = 0;

    const createBubble = () => {
      return {
        x: canvas.width,
        y: Math.random() * (canvas.height - 60) + 30, // Keep bubbles away from the very top and bottom
        width: 15,
        height: 15,
        speed: 1.5 + Math.random(), // Slightly slower bubbles
      };
    };

    const drawFish = (x: number, y: number, velocity: number) => {
      ctx.save();
      ctx.translate(x + 20, y);
      
      // Rotate fish based on velocity
      const rotation = Math.max(-0.3, Math.min(0.3, velocity * 0.02));
      ctx.rotate(rotation);
      ctx.translate(-20, 0);

      // Body
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(30, -15, 40, 0);
      ctx.quadraticCurveTo(30, 15, 0, 0);
      ctx.fill();
      
      // Tail
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-10, 0);
      ctx.lineTo(0, 10);
      ctx.fillStyle = '#FF8888';
      ctx.fill();
      
      // Eye
      ctx.beginPath();
      ctx.arc(30, -5, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'black';
      ctx.fill();

      // Bubbles from mouth when swimming up
      if (velocity < -1) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(
            40 + Math.random() * 10,
            Math.random() * 10 - 5,
            2,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fill();
        }
      }
      
      ctx.restore();
    };

    const drawBubble = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x + 7.5, y + 7.5, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.stroke();

      // Add shine effect
      ctx.beginPath();
      ctx.arc(x + 5, y + 5, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    };

    const drawWater = (offset: number) => {
      // Deep water gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#2196F3');
      gradient.addColorStop(1, '#1565C0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Waves
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 100 + i * 80);
        for (let x = 0; x < canvas.width; x += 50) {
          ctx.quadraticCurveTo(
            x + 25 + offset % 50,
            100 + i * 80 + Math.sin((x + offset) / 50) * 10,
            x + 50,
            100 + i * 80
          );
        }
        ctx.stroke();
      }
    };

    const animate = (timestamp: number) => {
      if (gameStateRef.current.gameOver) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update fish movement
      const fish = gameStateRef.current.fish;
      const isWideOpen = mouthOpenness > MOUTH_THRESHOLD;
      
      // Target position based on mouth openness
      const targetY = isWideOpen ? 120 : canvas.height - 80;
      
      // Apply physics
      const gravity = isWideOpen ? -0.5 : 0.5;
      fish.velocity += gravity;
      fish.velocity = Math.max(-8, Math.min(8, fish.velocity)); // Limit velocity
      fish.y += fish.velocity;
      
      // Bounce off boundaries
      if (fish.y < 40) {
        fish.y = 40;
        fish.velocity = Math.abs(fish.velocity) * 0.5;
      } else if (fish.y > canvas.height - 40) {
        fish.y = canvas.height - 40;
        fish.velocity = -Math.abs(fish.velocity) * 0.5;
      }

      // Create new bubbles
      if (timestamp - lastBubbleTime > BUBBLE_INTERVAL && 
          gameStateRef.current.bubbles.length < MAX_BUBBLES) {
        gameStateRef.current.bubbles.push(createBubble());
        lastBubbleTime = timestamp;
      }

      // Draw background
      drawWater(timestamp / 20);

      // Update and draw bubbles
      gameStateRef.current.bubbles = gameStateRef.current.bubbles.filter(bubble => {
        bubble.x -= bubble.speed || 2;

        // Check collision with fish
        const fishHitbox = {
          x: fish.x + 10,
          y: fish.y - 10,
          width: 30,
          height: 20,
        };

        if (
          bubble.x < fishHitbox.x + fishHitbox.width &&
          bubble.x + bubble.width > fishHitbox.x &&
          bubble.y < fishHitbox.y + fishHitbox.height &&
          bubble.y + bubble.height > fishHitbox.y
        ) {
          gameStateRef.current.score += 1;
          setScore(gameStateRef.current.score);
          playBubbleCollect();
          return false;
        }

        // Remove bubbles that go off screen
        if (bubble.x + bubble.width < 0) {
          gameStateRef.current.lives -= 1; // Lose half a heart (1 half-heart unit)
          setLives(gameStateRef.current.lives);
          playLifeLost();
          
          if (gameStateRef.current.lives <= 0) {
            gameStateRef.current.gameOver = true;
            setGameOver(true);
            playGameOver();
            return false;
          }
          return false;
        }

        drawBubble(bubble.x, bubble.y);
        return true;
      });

      // Draw fish
      drawFish(fish.x, fish.y, fish.velocity);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', updateCanvasSize);
      
      // Stop all audio when component unmounts
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
      }
    };
  }, [mouthOpenness, playBubbleCollect, playLifeLost, playGameOver]);

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