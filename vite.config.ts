import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
    return {
      define: {
        // API Key is now provided by the user in the app settings,
        // so we no longer define it from environment variables here.
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});