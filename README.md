# Face Metrics

A real-time facial analysis web application that uses face-api.js to detect and analyze facial features and expressions.

[![Deploy to GitHub Pages](https://github.com/robrito/facemetrics/actions/workflows/deploy.yml/badge.svg)](https://github.com/robrito/facemetrics/actions/workflows/deploy.yml)

## Features

- Real-time face detection using webcam
- Facial landmark detection
- Expression analysis
- Mouth openness measurement
- Modern and responsive UI

## Technologies Used

- React
- TypeScript
- face-api.js
- Emotion (styled components)
- Vite

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Download face-api.js models:
   ```bash
   npm run download-models
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Building

To build the project for production:

```bash
npm run build
```

## Deployment

The project is automatically deployed to GitHub Pages when changes are pushed to the main branch.
You can access the live version at: https://robrito.github.io/facemetrics/

## License

MIT
