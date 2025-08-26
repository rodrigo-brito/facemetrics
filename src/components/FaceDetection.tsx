import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import styled from '@emotion/styled';
import { FishGame } from './FishGame';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const MainSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  
  &:before {
    content: "";
    display: block;
    padding-top: 100%;
  }
  
  @media (min-width: 768px) {
    margin: 0;
  }
`;

const VideoWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const MetricsPanel = styled.div`
  display: none;
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  height: 480px;
  overflow-y: auto;
  
  @media (min-width: 768px) {
    display: block;
  }
`;

const GameSection = styled.div`
  width: 100%;
  max-width: 480px;
  height: 480px;
  margin: 0 auto;
  
  @media (min-width: 1024px) {
    width: 400px;
    margin: 0;
  }
`;

const MetricItem = styled.div`
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const MetricValue = styled.p`
  font-size: 1.1em;
  margin: 5px 0;
  color: #2c3e50;
`;

const MetricSubValue = styled.p`
  font-size: 0.9em;
  margin: 2px 0;
  color: #7f8c8d;
`;

interface FaceMetrics {
  verticalMouthOpening: {
    pixels: number;
    cm: number;
  };
  horizontalMouthWidth: {
    pixels: number;
    cm: number;
  };
  mouthArea: {
    pixels: number;
    cm: number;
  };
  eyeDistance: {
    pixels: number;
    cm: number;
  };
  expression: string;
}

// Average interpupillary distance (IPD) in centimeters
const AVERAGE_EYE_DISTANCE_CM = 6.3;

export const FaceDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metrics, setMetrics] = useState<FaceMetrics>({
    verticalMouthOpening: { pixels: 0, cm: 0 },
    horizontalMouthWidth: { pixels: 0, cm: 0 },
    mouthArea: { pixels: 0, cm: 0 },
    eyeDistance: { pixels: 0, cm: AVERAGE_EYE_DISTANCE_CM },
    expression: 'neutral'
  });

  useEffect(() => {
    const loadModels = async () => {
      const baseUrl = import.meta.env.BASE_URL;
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(`${baseUrl}models`),
          faceapi.nets.faceLandmark68Net.loadFromUri(`${baseUrl}models`),
          faceapi.nets.faceExpressionNet.loadFromUri(`${baseUrl}models`)
        ]);
        startVideo();
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 640 },
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  const calculatePixelsToCm = (pixels: number, eyeDistancePixels: number): number => {
    const cmPerPixel = AVERAGE_EYE_DISTANCE_CM / eyeDistancePixels;
    return pixels * cmPerPixel;
  };

  const calculateMouthMetrics = (landmarks: faceapi.FaceLandmarks68) => {
    // Calculate eye distance (interpupillary distance)
    const leftEye = landmarks.positions[36]; // Outer corner of left eye
    const rightEye = landmarks.positions[45]; // Outer corner of right eye
    const eyeDistancePixels = Math.abs(rightEye.x - leftEye.x);

    // Points for vertical measurement (upper and lower lip middle points)
    const upperLipTop = landmarks.positions[62];
    const lowerLipBottom = landmarks.positions[66];
    const verticalOpeningPixels = Math.abs(upperLipTop.y - lowerLipBottom.y);

    // Points for horizontal measurement (mouth corners)
    const leftCorner = landmarks.positions[48];
    const rightCorner = landmarks.positions[54];
    const horizontalWidthPixels = Math.abs(rightCorner.x - leftCorner.x);

    // Convert measurements to centimeters
    const verticalOpeningCm = calculatePixelsToCm(verticalOpeningPixels, eyeDistancePixels);
    const horizontalWidthCm = calculatePixelsToCm(horizontalWidthPixels, eyeDistancePixels);

    // Calculate areas
    const mouthAreaPixels = Math.PI * (horizontalWidthPixels / 2) * (verticalOpeningPixels / 2);
    const mouthAreaCm = Math.PI * (horizontalWidthCm / 2) * (verticalOpeningCm / 2);

    return {
      verticalOpening: { pixels: verticalOpeningPixels, cm: verticalOpeningCm },
      horizontalWidth: { pixels: horizontalWidthPixels, cm: horizontalWidthCm },
      mouthArea: { pixels: mouthAreaPixels, cm: mouthAreaCm },
      eyeDistance: { pixels: eyeDistancePixels, cm: AVERAGE_EYE_DISTANCE_CM }
    };
  };

  const determineExpression = (expressions: faceapi.FaceExpressions) => {
    const sortedExpressions = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
    return sortedExpressions[0][0];
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    video.addEventListener('play', async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      
      const updateCanvasSize = () => {
        const displaySize = {
          width: canvas.clientWidth,
          height: canvas.clientHeight
        };
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;
        faceapi.matchDimensions(canvas, displaySize);
        return displaySize;
      };

      // Initial size setup
      let displaySize = updateCanvasSize();

      // Update size on resize
      const resizeObserver = new ResizeObserver(() => {
        displaySize = updateCanvasSize();
      });
      resizeObserver.observe(canvas);

      const detectFace = async () => {
        if (!video.videoWidth || !video.videoHeight) return;

        // Get the actual video dimensions
        const videoSize = {
          width: video.videoWidth,
          height: video.videoHeight
        };

        // Calculate scaling factors
        const scaleX = displaySize.width / videoSize.width;
        const scaleY = displaySize.height / videoSize.height;

        const detections = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detections) {
          // Clear previous drawings
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);

          // Scale detection results to match display size
          const resizedDetections = faceapi.resizeResults(detections, {
            width: displaySize.width,
            height: displaySize.height
          });

          // Draw the detections
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

          // Calculate metrics using the scaled landmarks
          const mouthMetrics = calculateMouthMetrics(resizedDetections.landmarks);
          const expression = determineExpression(resizedDetections.expressions);

          // Update metrics state
          setMetrics({
            verticalMouthOpening: {
              pixels: Math.round(mouthMetrics.verticalOpening.pixels),
              cm: Number(mouthMetrics.verticalOpening.cm.toFixed(1))
            },
            horizontalMouthWidth: {
              pixels: Math.round(mouthMetrics.horizontalWidth.pixels),
              cm: Number(mouthMetrics.horizontalWidth.cm.toFixed(1))
            },
            mouthArea: {
              pixels: Math.round(mouthMetrics.mouthArea.pixels),
              cm: Number(mouthMetrics.mouthArea.cm.toFixed(1))
            },
            eyeDistance: {
              pixels: Math.round(mouthMetrics.eyeDistance.pixels * scaleX),
              cm: AVERAGE_EYE_DISTANCE_CM
            },
            expression
          });
        }

        requestAnimationFrame(detectFace);
      };

      detectFace();

      return () => {
        resizeObserver.disconnect();
      };
    });
  }, []);

  return (
    <Container>
      <MainSection>
        <VideoContainer>
          <VideoWrapper>
            <Video ref={videoRef} autoPlay muted playsInline />
            <Canvas ref={canvasRef} />
          </VideoWrapper>
        </VideoContainer>
        <MetricsPanel>
          <MetricItem>
            <MetricValue>Eye Distance: {metrics.eyeDistance.pixels.toFixed(1)} px</MetricValue>
          </MetricItem>
          <MetricItem>
            <h3>Vertical Mouth Opening</h3>
            <MetricValue>{metrics.verticalMouthOpening.cm.toFixed(1)} cm</MetricValue>
            <MetricSubValue>{metrics.verticalMouthOpening.pixels.toFixed(1)} pixels</MetricSubValue>
          </MetricItem>
          <MetricItem>
            <h3>Horizontal Mouth Width</h3>
            <MetricValue>{metrics.horizontalMouthWidth.cm.toFixed(1)} cm</MetricValue>
            <MetricSubValue>{metrics.horizontalMouthWidth.pixels.toFixed(1)} pixels</MetricSubValue>
          </MetricItem>
          <MetricItem>
            <h3>Mouth Area</h3>
            <MetricValue>{metrics.mouthArea.cm.toFixed(1)} cm²</MetricValue>
            <MetricSubValue>{metrics.mouthArea.pixels.toFixed(1)} pixels²</MetricSubValue>
          </MetricItem>
          <MetricItem>
            <h3>Expression</h3>
            <MetricValue>{metrics.expression}</MetricValue>
          </MetricItem>
        </MetricsPanel>
      </MainSection>
      <GameSection>
        <FishGame mouthOpenness={metrics.verticalMouthOpening.cm} />
      </GameSection>
    </Container>
  );
}; 