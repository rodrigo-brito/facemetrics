# Face Metrics 🐠

A real-time facial analysis web application that combines computer vision with an interactive fish game. Using face-api.js, it detects facial features and expressions, allowing users to control a fish by opening and closing their mouth.

[![Deploy to GitHub Pages](https://github.com/robrito/facemetrics/actions/workflows/deploy.yml/badge.svg)](https://github.com/robrito/facemetrics/actions/workflows/deploy.yml)

## ✨ Features

### Face Analysis
- **Real-time face detection** using webcam input
- **Facial landmark detection** with 68-point mapping
- **Expression analysis** (happy, sad, angry, surprised, etc.)
- **Precise mouth measurements** in both pixels and centimeters
  - Vertical mouth opening
  - Horizontal mouth width
  - Mouth area calculation
- **Eye distance calibration** for real-world measurements
- **Visual overlay** showing detected landmarks

### Interactive Fish Game
- **Mouth-controlled gameplay** - open mouth to make fish swim up
- **Bubble collection** scoring system
- **Physics-based movement** with gravity and velocity
- **Responsive game mechanics** with collision detection
- **Game over conditions** (miss 5 bubbles)

### User Experience
- **Modern responsive design** that works on desktop and mobile
- **Real-time metrics display** with live measurements
- **Smooth animations** and visual feedback
- **Portuguese/English interface** support

## 🛠️ Technologies Used

### Core Stack
- **React 18** - Component-based UI framework
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **face-api.js 0.22.2** - TensorFlow.js-based face detection

### Styling & UI
- **Emotion** - CSS-in-JS styled components
- **Responsive design** - Mobile-first approach

### Build & Deployment
- **Docker** - Containerized deployment with Nginx
- **GitHub Pages** - Automated CI/CD deployment
- **ESLint** - Code quality and consistency

## 🚀 Quick Start

### Prerequisites
- Node.js (compatible with Vite 5+)
- Modern web browser with webcam support
- Webcam access permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/robrito/facemetrics.git
   cd facemetrics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Download face-api.js models** (automatic on first run)
   ```bash
   npm run download-models
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173`
   - Grant webcam permissions when prompted

## 📁 Project Structure

```
facemetrics/
├── src/
│   ├── components/
│   │   ├── FaceDetection.tsx    # Main face analysis component
│   │   └── FishGame.tsx         # Interactive fish game
│   ├── App.tsx                  # Root application component
│   └── main.tsx                 # Application entry point
├── scripts/
│   ├── download-models.js       # Downloads face-api.js models
│   └── setup-dev.js            # Development setup automation
├── public/
│   └── models/                  # Face-api.js model files (auto-downloaded)
├── Dockerfile                   # Container configuration
├── nginx.conf                   # Nginx server configuration
└── package.json                 # Dependencies and scripts
```

## 🎮 How to Use

1. **Allow webcam access** when prompted by your browser
2. **Position your face** in the camera view for detection
3. **Play the fish game** by opening and closing your mouth:
   - 🐟 **Open mouth wide** → Fish swims up
   - 🐟 **Close mouth** → Fish sinks down
   - 💎 **Collect bubbles** to increase your score
   - ❌ **Avoid missing bubbles** (game ends after 5 misses)
4. **Monitor real-time metrics** displayed in the side panel (desktop only)

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production-ready application
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code quality checks
- `npm run download-models` - Download face-api.js model files

## 🏗️ Building for Production

```bash
# Build the application
npm run build

# Preview the build locally
npm run preview
```

## 🐋 Docker Deployment

```bash
# Build Docker image
docker build -t facemetrics .

# Run container
docker run -p 8080:8080 facemetrics
```

## 🚀 Deployment

### GitHub Pages (Automatic)
The project automatically deploys to GitHub Pages when changes are pushed to the main branch.

**Live Demo**: [https://robrito.github.io/facemetrics/](https://robrito.github.io/facemetrics/)

### Manual Deployment
The application can be deployed to any static hosting service:
1. Run `npm run build`
2. Upload the `dist/` folder contents
3. Ensure proper MIME types for model files

## ⚙️ Technical Details

### Face Detection Models
The application uses three pre-trained models from face-api.js:
- **Tiny Face Detector** - Lightweight face detection
- **Face Landmark 68 Net** - 68-point facial landmark detection
- **Face Expression Net** - Expression classification

### Measurement Calibration
- Uses interpupillary distance (average 6.3cm) for pixel-to-centimeter conversion
- Real-time calculation of mouth metrics in both pixel and metric units
- Physics-based game mechanics with configurable sensitivity

### Browser Compatibility
- Modern browsers with WebRTC support
- WebGL acceleration recommended for optimal performance
- Responsive design for mobile and desktop devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) for the excellent face detection library
- [TensorFlow.js](https://www.tensorflow.org/js) for enabling machine learning in the browser
- The open-source community for inspiration and tools
