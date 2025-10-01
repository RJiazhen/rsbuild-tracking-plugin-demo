import type { RsbuildPlugin } from '@rsbuild/core';
import path from 'path';

export interface AutoTrackingOptions {
  outputTransformedFiles?: boolean;
}

export const pluginAutoTracking = (
  options: AutoTrackingOptions = {},
): RsbuildPlugin => {
  return {
    name: 'plugin-auto-tracking',
    setup(build) {
      // 配置 rspack 的 module rules
      build.modifyRspackConfig((config) => {
        if (!config.module) {
          config.module = {};
        }
        if (!config.module.rules) {
          config.module.rules = [];
        }

        // 添加 auto-tracking loader 规则
        config.module.rules.push({
          test: /\.(tsx|jsx)$/,
          use: [
            {
              loader: path.resolve(__dirname, 'loader.js'),
              options: {
                outputTransformedFiles:
                  options.outputTransformedFiles !== false,
              },
            },
          ],
          exclude: /node_modules/,
        });

        return config;
      });
    },
  };
};
