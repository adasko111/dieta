import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Ścieżki względne — działa zarówno lokalnie, jak i na GitHub Pages
  // pod adresem https://<user>.github.io/dieta/
  base: './',
});
