import { transform } from '@babel/core';
import * as t from '@babel/types';

/**
 * Rspack Loader for auto-tracking
 * 处理 TSX 文件，移除 data-track 属性并添加埋点事件
 */
function autoTrackingLoader(source) {
  const options = this.getOptions() || {};

  try {
    const result = transform(source, {
      filename: this.resourcePath,
      presets: [
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      plugins: [[trackingPlugin, options]],
    });

    return result.code;
  } catch (error) {
    this.emitError(new Error(`Auto tracking loader error: ${error.message}`));
    return source;
  }
}

/**
 * Babel plugin for tracking transformation
 */
function trackingPlugin({ types: t }) {
  return {
    visitor: {
      JSXElement(path) {
        const { node } = path;

        // 检查是否有 data-track-show 或 data-track-click 属性
        const hasTrackShow = hasAttribute(node, 'data-track-show');
        const hasTrackClick = hasAttribute(node, 'data-track-click');

        if (hasTrackShow || hasTrackClick) {
          // 移除 data-track 属性
          removeTrackAttributes(node);

          // 添加埋点事件处理
          addTrackingEvents(path, hasTrackShow, hasTrackClick);
        }
      },
    },
  };
}

/**
 * 检查 JSX 元素是否有指定属性
 */
function hasAttribute(jsxElement, attributeName) {
  return jsxElement.openingElement.attributes.some(
    (attr) =>
      t.isJSXAttribute(attr) &&
      t.isJSXIdentifier(attr.name) &&
      attr.name.name === attributeName,
  );
}

/**
 * 移除 data-track 属性
 */
function removeTrackAttributes(jsxElement) {
  jsxElement.openingElement.attributes =
    jsxElement.openingElement.attributes.filter(
      (attr) =>
        !(
          t.isJSXAttribute(attr) &&
          t.isJSXIdentifier(attr.name) &&
          (attr.name.name === 'data-track-show' ||
            attr.name.name === 'data-track-click')
        ),
    );
}

/**
 * 添加埋点脚本导入
 */
function addTrackingImport(path, t) {
  // 检查是否已经导入了 tracking.js
  const hasImport = path.node.body.some(
    (node) =>
      t.isImportDeclaration(node) &&
      node.source.value === 'http://localhost:3000/tracking.js',
  );

  if (!hasImport) {
    // 在文件顶部添加 import 语句
    const importStatement = t.importDeclaration(
      [],
      t.stringLiteral('http://localhost:3000/tracking.js'),
    );

    // 找到第一个 import 语句的位置
    const firstImportIndex = path.node.body.findIndex((node) =>
      t.isImportDeclaration(node),
    );

    if (firstImportIndex >= 0) {
      // 在第一个 import 语句后插入
      path.node.body.splice(firstImportIndex + 1, 0, importStatement);
    } else {
      // 如果没有 import 语句，在文件开头插入
      path.node.body.unshift(importStatement);
    }
  }
}

/**
 * 添加埋点事件处理
 */
function addTrackingEvents(path, hasTrackShow, hasTrackClick) {
  const { node } = path;
  const attributes = node.openingElement.attributes;

  // 添加 onLoad 事件处理（用于 data-track-show）
  if (hasTrackShow) {
    const onLoadAttr = t.jsxAttribute(
      t.jsxIdentifier('onLoad'),
      t.jsxExpressionContainer(
        t.arrowFunctionExpression(
          [],
          t.blockStatement([
            t.ifStatement(
              t.memberExpression(
                t.identifier('window'),
                t.identifier('tracking'),
              ),
              t.blockStatement([
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.memberExpression(
                        t.identifier('window'),
                        t.identifier('tracking'),
                      ),
                      t.identifier('show'),
                    ),
                    [t.stringLiteral('ad')],
                  ),
                ),
              ]),
            ),
          ]),
        ),
      ),
    );
    attributes.push(onLoadAttr);
  }

  // 添加 onClick 事件处理（用于 data-track-click）
  if (hasTrackClick) {
    const onClickAttr = t.jsxAttribute(
      t.jsxIdentifier('onClick'),
      t.jsxExpressionContainer(
        t.arrowFunctionExpression(
          [t.identifier('e')],
          t.blockStatement([
            t.ifStatement(
              t.memberExpression(
                t.identifier('window'),
                t.identifier('tracking'),
              ),
              t.blockStatement([
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.memberExpression(
                        t.identifier('window'),
                        t.identifier('tracking'),
                      ),
                      t.identifier('click'),
                    ),
                    [t.stringLiteral('ad')],
                  ),
                ),
              ]),
            ),
          ]),
        ),
      ),
    );
    attributes.push(onClickAttr);
  }
}

export default autoTrackingLoader;
