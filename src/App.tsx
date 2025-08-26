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

const Instructions = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin-top: 10px;
  margin-bottom: 0;
`;

function App() {
  return (
    <AppContainer>
      <Header>
        <h1>Face Metrics</h1>
        <Instructions>
          🐠 Abra a boca para fazer o peixe subir e feche para fazê-lo afundar!
        </Instructions>
      </Header>
      <FaceDetection />
    </AppContainer>
  )
}

export default App
