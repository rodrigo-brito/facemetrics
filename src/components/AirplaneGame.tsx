import { useEffect, useRef, useState, useCallback } from 'react';
import styled from '@emotion/styled';

const GameContainer = styled.div`
  position: relative;
  width: 100%;
  height: 480px;
  background: linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #87CEEB 100%);
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

interface Bird {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  wingPhase: number;
  type: 'seagull' | 'eagle' | 'pigeon';
}

interface GameProps {
  mouthOpenness: number;
}

// Threshold for mouth openness to make the airplane climb
const MOUTH_THRESHOLD = 1;
// Time between bird spawns in milliseconds (2.5 seconds)
const BIRD_INTERVAL = 2500;
// Maximum number of birds allowed on screen at once
const MAX_BIRDS = 4;
// Number of lives the airplane starts with (in half-hearts)
const MAX_LIVES = 6; // 3 full hearts = 6 half hearts

export const AirplaneGame: React.FC<GameProps> = ({ mouthOpenness }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  
  // Audio refs
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const dodgeSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = useRef<HTMLAudioElement | null>(null);
  const lifeLostRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio
  useEffect(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Background music - aviation theme
    const createBackgroundMusic = () => {
      const audio = new Audio();
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
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples * 2, true);
      
      // Generate aviation-themed background music
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const wave1 = Math.sin(2 * Math.PI * 440 * t) * 0.1; // Main melody
        const wave2 = Math.sin(2 * Math.PI * 220 * t) * 0.08; // Harmony
        const engine = Math.sin(2 * Math.PI * 60 * t) * 0.05; // Engine drone
        const envelope = Math.sin(2 * Math.PI * t / duration) * 0.5 + 0.5;
        const sample = (wave1 + wave2 + engine) * envelope;
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
    dodgeSoundRef.current = { play: createSoundEffect(600, 0.1) } as any;
    gameOverSoundRef.current = { play: createSoundEffect(150, 1.5, 'sawtooth') } as any;
    lifeLostRef.current = { play: createSoundEffect(250, 0.8, 'triangle') } as any;
    
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
  const playDodgeSound = useCallback(() => {
    if (dodgeSoundRef.current && sfxEnabled) {
      (dodgeSoundRef.current as any).play();
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
    airplane: {
      x: 80,
      y: 240,
      width: 50,
      height: 25,
      velocity: 0,
      rotation: 0
    },
    birds: [] as Bird[],
    clouds: [] as GameObject[],
    score: 0,
    lives: MAX_LIVES,
    gameOver: false,
    distanceTraveled: 0
  });

  const resetGame = () => {
    gameStateRef.current = {
      airplane: {
        x: 80,
        y: 240,
        width: 50,
        height: 25,
        velocity: 0,
        rotation: 0
      },
      birds: [],
      clouds: [],
      score: 0,
      lives: MAX_LIVES,
      gameOver: false,
      distanceTraveled: 0
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
    let lastBirdTime = 0;
    let lastCloudTime = 0;

    const createBird = (): Bird => {
      const birdTypes: Bird['type'][] = ['seagull', 'eagle', 'pigeon'];
      const type = birdTypes[Math.floor(Math.random() * birdTypes.length)];
      
      return {
        x: canvas.width + 20,
        y: Math.random() * (canvas.height - 100) + 50,
        width: type === 'eagle' ? 35 : type === 'seagull' ? 25 : 20,
        height: type === 'eagle' ? 20 : type === 'seagull' ? 15 : 12,
        speed: type === 'eagle' ? 1.8 : type === 'seagull' ? 2.2 : 2.5,
        wingPhase: Math.random() * Math.PI * 2,
        type
      };
    };

    const createCloud = (): GameObject => {
      return {
        x: canvas.width + 50,
        y: Math.random() * (canvas.height - 150) + 50,
        width: 60 + Math.random() * 40,
        height: 30 + Math.random() * 20,
        speed: 0.5 + Math.random() * 0.3
      };
    };

    const drawAirplane = (x: number, y: number, velocity: number, rotation: number) => {
      ctx.save();
      ctx.translate(x + 25, y + 12.5);
      ctx.rotate(rotation);
      ctx.translate(-25, -12.5);

      // Fuselage
      ctx.fillStyle = '#C0C0C0';
      ctx.beginPath();
      ctx.ellipse(25, 12.5, 25, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Wings
      ctx.fillStyle = '#B0B0B0';
      ctx.fillRect(15, 8, 20, 3);
      ctx.fillRect(15, 14, 20, 3);
      
      // Cockpit
      ctx.fillStyle = '#4A90E2';
      ctx.beginPath();
      ctx.ellipse(35, 12.5, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Propeller (when climbing)
      if (velocity < -1) {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(50, 12.5, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Engine exhaust when climbing
      if (velocity < -2) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(
            5 - Math.random() * 10,
            12.5 + (Math.random() - 0.5) * 8,
            2,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
          ctx.fill();
        }
      }
      
      ctx.restore();
    };

    const drawBird = (bird: Bird, time: number) => {
      ctx.save();
      ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
      
      // Wing animation
      bird.wingPhase += 0.3;
      const wingOffset = Math.sin(bird.wingPhase) * 3;
      
      // Bird body
      const colors = {
        seagull: '#FFFFFF',
        eagle: '#8B4513',
        pigeon: '#808080'
      };
      
      ctx.fillStyle = colors[bird.type];
      ctx.beginPath();
      ctx.ellipse(0, 0, bird.width/2, bird.height/2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Wings
      ctx.fillStyle = bird.type === 'seagull' ? '#E0E0E0' : bird.type === 'eagle' ? '#654321' : '#696969';
      ctx.beginPath();
      ctx.ellipse(-bird.width/3, wingOffset, bird.width/2, bird.height/3, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-bird.width/3, -wingOffset, bird.width/2, bird.height/3, 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Beak
      ctx.fillStyle = bird.type === 'eagle' ? '#FFA500' : '#FFD700';
      ctx.beginPath();
      ctx.moveTo(bird.width/2, 0);
      ctx.lineTo(bird.width/2 + 5, -2);
      ctx.lineTo(bird.width/2 + 5, 2);
      ctx.fill();
      
      ctx.restore();
    };

    const drawCloud = (cloud: GameObject) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      
      // Draw multiple circles to create cloud shape
      const circles = 5;
      for (let i = 0; i < circles; i++) {
        const offsetX = (i / circles) * cloud.width;
        const offsetY = Math.sin(i) * (cloud.height * 0.2);
        const radius = cloud.height / 2 + Math.sin(i * 2) * (cloud.height * 0.3);
        
        ctx.arc(cloud.x + offsetX, cloud.y + cloud.height/2 + offsetY, radius, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    const drawSky = (offset: number) => {
      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.5, '#E0F6FF');
      gradient.addColorStop(1, '#87CEEB');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const animate = (timestamp: number) => {
      if (gameStateRef.current.gameOver) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update airplane movement
      const airplane = gameStateRef.current.airplane;
      const isClimbing = mouthOpenness > MOUTH_THRESHOLD;
      
      // Apply physics
      const lift = isClimbing ? -0.6 : 0.4; // Upward force when mouth open, gravity otherwise
      airplane.velocity += lift;
      airplane.velocity = Math.max(-6, Math.min(6, airplane.velocity)); // Limit velocity
      airplane.y += airplane.velocity;
      
      // Update rotation based on velocity
      airplane.rotation = Math.max(-0.3, Math.min(0.3, airplane.velocity * 0.05));
      
      // Bounce off boundaries
      if (airplane.y < 20) {
        airplane.y = 20;
        airplane.velocity = Math.abs(airplane.velocity) * 0.3;
      } else if (airplane.y > canvas.height - 40) {
        airplane.y = canvas.height - 40;
        airplane.velocity = -Math.abs(airplane.velocity) * 0.3;
      }

      // Update distance traveled and score
      gameStateRef.current.distanceTraveled += 2;
      if (gameStateRef.current.distanceTraveled % 100 === 0) {
        gameStateRef.current.score += 1;
        setScore(gameStateRef.current.score);
        playDodgeSound();
      }

      // Create new birds
      if (timestamp - lastBirdTime > BIRD_INTERVAL && 
          gameStateRef.current.birds.length < MAX_BIRDS) {
        gameStateRef.current.birds.push(createBird());
        lastBirdTime = timestamp;
      }

      // Create new clouds occasionally
      if (timestamp - lastCloudTime > 8000) { // Every 8 seconds
        gameStateRef.current.clouds.push(createCloud());
        lastCloudTime = timestamp;
      }

      // Draw background
      drawSky(timestamp / 50);

      // Update and draw clouds
      gameStateRef.current.clouds = gameStateRef.current.clouds.filter(cloud => {
        cloud.x -= cloud.speed || 1;
        
        if (cloud.x + cloud.width < 0) {
          return false;
        }
        
        drawCloud(cloud);
        return true;
      });

      // Update and draw birds
      gameStateRef.current.birds = gameStateRef.current.birds.filter(bird => {
        bird.x -= bird.speed;

        // Check collision with airplane
        const airplaneHitbox = {
          x: airplane.x + 5,
          y: airplane.y + 2,
          width: 40,
          height: 21,
        };

        if (
          bird.x < airplaneHitbox.x + airplaneHitbox.width &&
          bird.x + bird.width > airplaneHitbox.x &&
          bird.y < airplaneHitbox.y + airplaneHitbox.height &&
          bird.y + bird.height > airplaneHitbox.y
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
          return false; // Remove bird after collision
        }

        // Remove birds that go off screen
        if (bird.x + bird.width < 0) {
          return false;
        }

        drawBird(bird, timestamp);
        return true;
      });

      // Draw airplane
      drawAirplane(airplane.x, airplane.y, airplane.velocity, airplane.rotation);

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
  }, [mouthOpenness, playDodgeSound, playLifeLost, playGameOver, musicEnabled]);

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
          <h2>Crash Landing!</h2>
          <p>Final Score: {score}</p>
          <RestartButton onClick={resetGame}>Take Off Again</RestartButton>
        </GameOverlay>
      </GameWrapper>
    </GameContainer>
  );
};