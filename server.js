import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Determine static root: dist if built, otherwise current workspace
const distPath = path.join(__dirname, 'dist');
const staticPath = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))
    ? distPath
    : __dirname;

app.use(express.static(staticPath));

// Ensure HTML pages route cleanly
app.get('/login', (req, res) => {
    res.sendFile(path.join(staticPath, 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(staticPath, 'signup.html'));
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
    if (path.extname(req.path)) {
        return res.status(404).send('File Not Found');
    }
    res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🕵️ Pocket Jasoos server active on: http://localhost:${PORT}`);
    console.log(`📁 Serving assets from: ${staticPath}`);
});
