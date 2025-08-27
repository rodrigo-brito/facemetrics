import { useState } from 'react'
import { FaceDetection } from './components/FaceDetection'
import styled from '@emotion/styled'

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f0f2f5;
`;

const Header = styled.header`
  background-color: #ffffff;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const GameSelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 15px 0;
`;

const GameButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? '#4CAF50' : '#f0f0f0'};
  color: ${props => props.active ? 'white' : '#333'};
  border: 2px solid ${props => props.active ? '#4CAF50' : '#ddd'};
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.active ? '#45a049' : '#e0e0e0'};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  
  &:disabled {
    background: #ccc;
    color: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const GameIcon = styled.span`
  font-size: 1.3em;
`;

const Instructions = styled.p<{ game: string }>`
  color: #666;
  font-size: 0.9rem;
  margin-top: 10px;
  margin-bottom: 0;
`;

type GameType = 'fish' | 'bird' | 'airplane';

function App() {
  const [selectedGame, setSelectedGame] = useState<GameType>('fish');
  
  const getInstructions = (game: GameType) => {
    switch (game) {
      case 'fish':
        return '🐠 Abra a boca para fazer o peixe subir e feche para fazê-lo afundar!';
      case 'bird':
        return '🐦 Abra a boca para fazer o pássaro voar e feche para fazê-lo descer!';
      case 'airplane':
        return '✈️ Abra a boca para fazer o avião subir e desviar dos pássaros!';
      default:
        return '';
    }
  };

  return (
    <AppContainer>
      <Header>
        <h1>Face Metrics</h1>
        <GameSelector>
          <GameButton 
            active={selectedGame === 'fish'}
            onClick={() => setSelectedGame('fish')}
          >
            <GameIcon>🐠</GameIcon>
            Peixe
          </GameButton>
          <GameButton 
            active={selectedGame === 'bird'}
            onClick={() => setSelectedGame('bird')}
          >
            <GameIcon>🐦</GameIcon>
            Pássaro
          </GameButton>
          <GameButton 
            active={selectedGame === 'airplane'}
            onClick={() => setSelectedGame('airplane')}
          >
            <GameIcon>✈️</GameIcon>
            Avião
          </GameButton>
        </GameSelector>
        <Instructions game={selectedGame}>
          {getInstructions(selectedGame)}
        </Instructions>
      </Header>
      <FaceDetection selectedGame={selectedGame} />
    </AppContainer>
  )
}

export default App
