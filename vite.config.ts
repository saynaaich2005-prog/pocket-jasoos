import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function copyStaticAssetsPlugin(): Plugin {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      const files = fs.readdirSync(__dirname);
      let count = 0;
      files.forEach((file) => {
        if (
          file.startsWith('ezgif-frame-') ||
          file === 'logo.jpg' ||
          file === 'detective.jpg' ||
          file === 'auth.js' ||
          file === 'firebase-config.js'
        ) {
          const src = path.resolve(__dirname, file);
          const dest = path.resolve(distDir, file);
          fs.copyFileSync(src, dest);
          count++;
        }
      });
      console.log(`[Vite Build] Successfully copied ${count} static assets & animation frames into dist/`);
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [tailwindcss(), copyStaticAssetsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          signup: path.resolve(__dirname, 'signup.html'),
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
