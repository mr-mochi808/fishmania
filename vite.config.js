import { defineConfig } from 'vite';

// GitHub Pages serves the game from /fishmania/, so built files need that prefix.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/fishmania/' : '/',
}));
