import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [pluginReact()],
  tools: {
    rspack: {
      module: {
        rules: [
          {
            test: /\.(tsx|jsx)$/,
            use: [
              {
                loader: path.resolve(
                  __dirname,
                  'plugins/rsbuild-plugin-auto-tracking/loader.js',
                ),
                options: {
                  outputTransformedFiles: true, // 可以设置为 false 来禁用文件输出
                },
              },
            ],
            exclude: /node_modules/,
          },
        ],
      },
    },
  },
});
