import { useEffect, useRef, useState } from 'react';
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

export const FishGame: React.FC<GameProps> = ({ mouthOpenness }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [missedBubbles, setMissedBubbles] = useState(0);
  
  // Game state ref to avoid closure issues in animation loop
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
    missedBubbles: 0,
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
      missedBubbles: 0,
      gameOver: false,
    };
    setScore(0);
    setMissedBubbles(0);
    setGameOver(false);
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
          return false;
        }

        // Remove bubbles that go off screen
        if (bubble.x + bubble.width < 0) {
          gameStateRef.current.missedBubbles += 1;
          setMissedBubbles(gameStateRef.current.missedBubbles);
          
          if (gameStateRef.current.missedBubbles >= 5) {
            gameStateRef.current.gameOver = true;
            setGameOver(true);
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
    };
  }, [mouthOpenness]);

  return (
    <GameContainer>
      <GameWrapper>
        <GameCanvas ref={canvasRef} />
        <Score>Score: {score}</Score>
        <GameOverlay visible={gameOver}>
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <RestartButton onClick={resetGame}>Play Again</RestartButton>
        </GameOverlay>
      </GameWrapper>
    </GameContainer>
  );
}; 