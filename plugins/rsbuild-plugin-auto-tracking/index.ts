import type { RspackPluginInstance } from '@rspack/core';
import path from 'path';

const PLUGIN_NAME = 'AutoTrackingRspackPlugin';

class AutoTrackingRspackPlugin implements RspackPluginInstance {
  name = PLUGIN_NAME;

  apply(compiler: any) {
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (factory: any) => {
      factory.hooks.beforeResolve.tapAsync(
        PLUGIN_NAME,
        (resolveData: any, callback: any) => {
          // 只处理 .tsx 和 .jsx 文件
          if (resolveData.request && /\.(tsx|jsx)$/.test(resolveData.request)) {
            console.log('Adding loader to:', resolveData.request);
            resolveData.request = `${path.resolve(__dirname, 'loader.js')}!${
              resolveData.request
            }`;
          }
          callback();
        },
      );
    });
  }
}

export const pluginAutoTracking = () => new AutoTrackingRspackPlugin();
