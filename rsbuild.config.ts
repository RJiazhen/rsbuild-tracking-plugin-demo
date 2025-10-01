import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginAutoTracking } from './plugins/rsbuild-plugin-auto-tracking';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginAutoTracking({
      outputTransformedFiles: true, // 可以设置为 false 来禁用文件输出
    }),
  ],
});
