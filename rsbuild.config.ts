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
              },
            ],
            exclude: /node_modules/,
          },
        ],
      },
    },
  },
});
