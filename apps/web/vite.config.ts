import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path';
const projectRoot = __dirname;

// This can be replaced with `find-yarn-workspace-root`
const monorepoRoot = path.resolve(projectRoot, '../..');
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@web': path.resolve(__dirname),
      '.prisma/client/index-browser': path.resolve(monorepoRoot, 'node_modules/@prisma/client/index-browser.js')
    }
  }
})