import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/', // Use root path for Vercel (GitHub Pages can override if needed)
    plugins: [react()],
    define: {
      // Polyfill process.env.OPENAIAPI to support existing App.tsx logic
      // This replaces the string 'process.env.OPENAIAPI' with the actual key value during build
      'process.env.OPENAIAPI': JSON.stringify(env.OPENAIAPI || env.VITE_OPENAI_API_KEY || ''),
    },
  };
});