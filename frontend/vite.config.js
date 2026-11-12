import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    // Permite volver desde un túnel HTTPS de ngrok durante pruebas locales.
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev'],
    proxy: { '/api': 'http://localhost:3001' },
  },
});
