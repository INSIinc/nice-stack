import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import path from 'path';
import fs from 'fs';
function generateIconTypes() {
  const iconsDir = path.resolve('src/icons');
  const outputPath = path.resolve('src/generated/icon-names.ts');

  return {
    name: 'generate-icon-types',
    buildStart() {
      // Check if the icons directory exists
      if (!fs.existsSync(iconsDir)) {
        console.log(`Directory ${iconsDir} does not exist. Skipping icon type generation.`);
        return;
      }

      // Read the icons directory
      const files = fs.readdirSync(iconsDir);

      // Filter out non-SVG files and get just the base names without extension
      const iconNames = files
        .filter(file => file.endsWith('.svg'))
        .map(file => path.basename(file, '.svg'));

      // Create type definition string
      const typeDefinitions = `export type IconName = ${iconNames.map(name => `'${name}'`).join(' | ')}
    `;

      // Write the type definitions to the output file
      fs.writeFileSync(outputPath, typeDefinitions);
    }
  };
}


// 在 UMD 构建模式下为外部依赖提供一个全局变量
export const GLOBALS = {
  react: 'React',
  'react-dom': 'ReactDOM',
};
// 处理类库使用到的外部依赖
// 确保外部化处理那些你不想打包进库的依赖
export const EXTERNAL = [
  'react',
  'react-dom',
];
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), generateIconTypes()],
  build: {
    rollupOptions: {
      external: EXTERNAL,
      output: { globals: GLOBALS },
    },
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'iconer',
      fileName: (format) => `index.${format}.js`,
    }
  },
})
