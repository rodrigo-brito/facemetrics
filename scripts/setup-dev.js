import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '../public/models');
const modelsExist = fs.existsSync(modelsDir) && fs.readdirSync(modelsDir).length > 0;

if (!modelsExist) {
  console.log('Models not found. Running download-models script...');
  import('./download-models.js');
} else {
  console.log('Models already exist in public/models directory.');
} 