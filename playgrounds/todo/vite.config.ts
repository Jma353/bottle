import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      bottle: path.resolve(__dirname, '../../packages/bottle/src/index.ts'),
    },
  },
});
