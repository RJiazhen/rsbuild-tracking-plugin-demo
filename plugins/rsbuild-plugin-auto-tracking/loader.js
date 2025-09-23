import { transform } from '@babel/core';
import * as t from '@babel/types';
import fs from 'fs';
import path from 'path';

// 全局埋点数据存储
const globalTrackingData = new Map();

/**
 * 检查全局重复埋点并打印警告
 */
function checkGlobalDuplicateTracking(newTrackingData, filePath) {
  const key = `${newTrackingData.type}:${newTrackingData.name}`;

  if (globalTrackingData.has(key)) {
    const existingData = globalTrackingData.get(key);
    const currentRelativePath = path.relative(process.cwd(), filePath);
    const existingRelativePath = path.relative(
      process.cwd(),
      existingData.filePath,
    );

    console.warn(
      `⚠️ 检测到全局重复埋点:\n` +
        `   类型: ${newTrackingData.type}\n` +
        `   名称: ${newTrackingData.name}\n` +
        `   已存在: ${existingRelativePath} (${existingData.elementName})\n` +
        `   重复位置: ${currentRelativePath} (${newTrackingData.elementName})\n` +
        `   建议: 请使用不同的埋点名称或检查是否应该合并这些埋点`,
    );
  } else {
    // 存储新的埋点数据
    globalTrackingData.set(key, {
      ...newTrackingData,
      filePath,
    });
  }
}

/**
 * Rspack Loader for auto-tracking
 * 处理 TSX 文件，移除 data-track 属性并添加埋点事件
 */
function autoTrackingLoader(source) {
  const options = this.getOptions() || {};
  const resourcePath = this.resourcePath;

  try {
    const result = transform(source, {
      filename: resourcePath,
      presets: [
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      plugins: [[trackingPlugin, { ...options, resourcePath }]],
    });

    // 检查是否需要输出转换后的文件
    if (options.outputTransformedFiles !== false) {
      outputTransformedFile(resourcePath, result.code);
    }

    return result.code;
  } catch (error) {
    this.emitError(new Error(`Auto tracking loader error: ${error.message}`));
    return source;
  }
}

/**
 * 输出转换后的文件
 */
function outputTransformedFile(originalPath, transformedCode) {
  try {
    // 创建输出目录
    const outputDir = path.join(process.cwd(), 'transformed-files');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 生成输出文件路径
    const relativePath = path.relative(process.cwd(), originalPath);
    const outputPath = path.join(outputDir, relativePath);

    // 确保输出目录存在
    const outputDirPath = path.dirname(outputPath);
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath, { recursive: true });
    }

    // 写入转换后的代码
    fs.writeFileSync(outputPath, transformedCode, 'utf8');

    console.log(`✅ 转换后的文件已输出: ${outputPath}`);
  } catch (error) {
    console.warn(`⚠️ 输出转换文件失败: ${error.message}`);
  }
}

/**
 * 生成埋点信息文件
 */
function generateTrackingDataFile(trackingData, resourcePath) {
  if (trackingData.length === 0) return;

  try {
    // 创建埋点信息目录
    const trackingDir = path.join(process.cwd(), 'tracking-data');
    if (!fs.existsSync(trackingDir)) {
      fs.mkdirSync(trackingDir, { recursive: true });
    }

    // 生成相对路径
    const relativePath = resourcePath
      ? path.relative(process.cwd(), resourcePath)
      : 'unknown-file';

    // 为每个文件生成单独的埋点信息文件
    const fileName = path.basename(relativePath, path.extname(relativePath));
    const outputPath = path.join(trackingDir, `${fileName}-tracking.json`);

    // 生成埋点信息
    const trackingInfo = {
      file: relativePath,
      timestamp: new Date().toISOString(),
      tracking: trackingData.map((item) => ({
        type: item.type,
        name: item.name,
        elementName: item.elementName,
      })),
    };

    // 写入埋点信息文件
    fs.writeFileSync(outputPath, JSON.stringify(trackingInfo, null, 2), 'utf8');

    // 更新汇总文件
    updateTrackingSummary(trackingInfo);

    console.log(`📊 埋点信息已输出: ${outputPath}`);
  } catch (error) {
    console.warn(`⚠️ 输出埋点信息失败: ${error.message}`);
  }
}

/**
 * 更新埋点汇总文件
 */
function updateTrackingSummary(trackingInfo) {
  try {
    const trackingDir = path.join(process.cwd(), 'tracking-data');
    const summaryPath = path.join(trackingDir, 'tracking-summary.json');

    let summary = {
      files: [],
      totalTracking: 0,
      lastUpdated: new Date().toISOString(),
    };

    // 如果汇总文件存在，读取现有数据
    if (fs.existsSync(summaryPath)) {
      const existingData = fs.readFileSync(summaryPath, 'utf8');
      summary = JSON.parse(existingData);
    }

    // 更新或添加文件信息
    const existingFileIndex = summary.files.findIndex(
      (f) => f.file === trackingInfo.file,
    );
    if (existingFileIndex >= 0) {
      summary.files[existingFileIndex] = trackingInfo;
    } else {
      summary.files.push(trackingInfo);
    }

    // 重新计算总数
    summary.totalTracking = summary.files.reduce(
      (total, file) => total + file.tracking.length,
      0,
    );
    summary.lastUpdated = new Date().toISOString();

    // 写入汇总文件
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

    console.log(`📋 埋点汇总已更新: ${summaryPath}`);
  } catch (error) {
    console.warn(`⚠️ 更新埋点汇总失败: ${error.message}`);
  }
}

/**
 * Babel plugin for tracking transformation
 */
function trackingPlugin({ types: t, resourcePath }) {
  let hasTrackingAttributes = false;
  let trackingElements = [];
  let showElements = []; // Stores { refName, trackValue } for show events
  let trackingData = []; // Stores tracking information for file generation

  return {
    visitor: {
      Program: {
        enter(path, state) {
          hasTrackingAttributes = false;
          trackingElements = [];
          showElements = [];
          trackingData = [];
          // 从 state 中获取文件路径
          const filePath = state.filename || resourcePath || 'unknown-file';
          state.trackingData = trackingData;
          state.filePath = filePath;
        },
        exit(path, state) {
          // 如果检测到埋点属性，添加 import 语句和 useEffect
          if (hasTrackingAttributes) {
            const filePath = state.filePath || resourcePath || 'unknown-file';
            addTrackingImport(path, t);
            addTrackingUseEffect(path, t, trackingElements);
            addShowTrackingUseEffect(path, t, showElements);
            // 生成埋点信息文件
            generateTrackingDataFile(trackingData, filePath);
          }
        },
      },
      JSXElement(path) {
        const { node } = path;

        // 检查是否有 data-track-show 或 data-track-click 属性
        const trackShowValue = getAttributeValue(node, 'data-track-show');
        const trackClickValue = getAttributeValue(node, 'data-track-click');

        if (trackShowValue || trackClickValue) {
          hasTrackingAttributes = true;

          // 移除 data-track 属性
          removeTrackAttributes(node);

          // 添加 ref 和埋点事件处理
          addTrackingRefAndEvents(
            path,
            trackShowValue,
            trackClickValue,
            trackingElements,
            showElements,
            trackingData,
            resourcePath || 'unknown',
          );
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
 * 获取 JSX 元素的属性值
 */
function getAttributeValue(jsxElement, attributeName) {
  const attr = jsxElement.openingElement.attributes.find(
    (attr) =>
      t.isJSXAttribute(attr) &&
      t.isJSXIdentifier(attr.name) &&
      attr.name.name === attributeName,
  );

  if (attr && attr.value) {
    if (t.isStringLiteral(attr.value)) {
      return attr.value.value;
    } else if (t.isJSXExpressionContainer(attr.value)) {
      // 如果是表达式，返回表达式本身
      return attr.value.expression;
    }
  }

  return null;
}

/**
 * 获取元素名称
 */
function getElementName(node) {
  const elementName = node.openingElement.name;

  if (t.isJSXIdentifier(elementName)) {
    return elementName.name;
  } else if (t.isJSXMemberExpression(elementName)) {
    return `${elementName.object.name}.${elementName.property.name}`;
  } else if (t.isJSXNamespacedName(elementName)) {
    return `${elementName.namespace.name}:${elementName.name.name}`;
  }

  return 'unknown';
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
 * 添加 ref 和埋点事件处理
 */
function addTrackingRefAndEvents(
  path,
  trackShowValue,
  trackClickValue,
  trackingElements,
  showElements,
  trackingData,
  filePath,
) {
  const { node } = path;
  const attributes = node.openingElement.attributes;

  // 生成唯一的 ref 名称
  const refName = `trackingRef${trackingElements.length}`;

  // 添加 ref 属性
  const refAttr = t.jsxAttribute(
    t.jsxIdentifier('ref'),
    t.jsxExpressionContainer(t.identifier(refName)),
  );
  attributes.push(refAttr);

  // 记录需要添加点击事件的元素
  if (trackClickValue) {
    trackingElements.push({
      refName,
      trackValue: trackClickValue,
    });
  }

  // 记录需要添加显示事件的元素
  if (trackShowValue) {
    showElements.push({
      refName,
      trackValue: trackShowValue,
    });

    // 收集埋点信息
    const showTrackingData = {
      type: 'show',
      name: typeof trackShowValue === 'string' ? trackShowValue : 'dynamic',
      filePath: filePath,
      elementName: getElementName(node),
    };

    // 检查全局重复埋点
    checkGlobalDuplicateTracking(showTrackingData, filePath);
    trackingData.push(showTrackingData);
  }

  // 记录需要添加点击事件的元素
  if (trackClickValue) {
    // 收集埋点信息
    const clickTrackingData = {
      type: 'click',
      name: typeof trackClickValue === 'string' ? trackClickValue : 'dynamic',
      filePath: filePath,
      elementName: getElementName(node),
    };

    // 检查全局重复埋点
    checkGlobalDuplicateTracking(clickTrackingData, filePath);
    trackingData.push(clickTrackingData);
  }
}

/**
 * 添加 useEffect 来处理显示事件（使用 IntersectionObserver）
 */
function addShowTrackingUseEffect(path, t, showElements) {
  if (showElements.length === 0) return;

  // 生成 observer ref 声明
  const observerRefDeclarations = showElements.map(({ refName }, index) => {
    const observerRefName = `observerRef${index}`;
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(observerRefName),
        t.callExpression(t.identifier('useRef'), [t.nullLiteral()]),
      ),
    ]);
  });

  // 生成 useEffect 代码
  const useEffectStatements = [];
  const cleanupStatements = [];

  showElements.forEach(({ refName, trackValue }, index) => {
    const observerRefName = `observerRef${index}`;
    const trackValueExpr =
      typeof trackValue === 'string' ? t.stringLiteral(trackValue) : trackValue;

    // 添加 IntersectionObserver 代码
    useEffectStatements.push(
      t.ifStatement(
        t.memberExpression(t.identifier(refName), t.identifier('current')),
        t.blockStatement([
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('element'),
              t.memberExpression(
                t.identifier(refName),
                t.identifier('current'),
              ),
            ),
          ]),
          // 检查是否已经有 observer，如果有则先断开
          t.ifStatement(
            t.memberExpression(
              t.identifier(observerRefName),
              t.identifier('current'),
            ),
            t.blockStatement([
              t.expressionStatement(
                t.callExpression(
                  t.memberExpression(
                    t.memberExpression(
                      t.identifier(observerRefName),
                      t.identifier('current'),
                    ),
                    t.identifier('disconnect'),
                  ),
                  [],
                ),
              ),
            ]),
          ),
          // 创建新的 observer
          t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.memberExpression(
                t.identifier(observerRefName),
                t.identifier('current'),
              ),
              t.newExpression(t.identifier('IntersectionObserver'), [
                t.arrowFunctionExpression(
                  [t.arrayPattern([t.identifier('entry')])],
                  t.blockStatement([
                    t.ifStatement(
                      t.memberExpression(
                        t.identifier('entry'),
                        t.identifier('isIntersecting'),
                      ),
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
                                [trackValueExpr],
                              ),
                            ),
                          ]),
                        ),
                        t.expressionStatement(
                          t.callExpression(
                            t.memberExpression(
                              t.memberExpression(
                                t.identifier(observerRefName),
                                t.identifier('current'),
                              ),
                              t.identifier('disconnect'),
                            ),
                            [],
                          ),
                        ),
                      ]),
                    ),
                  ]),
                ),
                t.objectExpression([
                  t.objectProperty(
                    t.identifier('threshold'),
                    t.numericLiteral(0.1),
                  ),
                ]),
              ]),
            ),
          ),
          // 开始观察元素
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.memberExpression(
                  t.identifier(observerRefName),
                  t.identifier('current'),
                ),
                t.identifier('observe'),
              ),
              [t.identifier('element')],
            ),
          ),
        ]),
      ),
    );

    // 添加清理代码
    cleanupStatements.push(
      t.ifStatement(
        t.memberExpression(
          t.identifier(observerRefName),
          t.identifier('current'),
        ),
        t.blockStatement([
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.memberExpression(
                  t.identifier(observerRefName),
                  t.identifier('current'),
                ),
                t.identifier('disconnect'),
              ),
              [],
            ),
          ),
        ]),
      ),
    );
  });

  // 添加清理函数
  if (cleanupStatements.length > 0) {
    useEffectStatements.push(
      t.returnStatement(
        t.arrowFunctionExpression([], t.blockStatement(cleanupStatements)),
      ),
    );
  }

  const useEffectCall = t.expressionStatement(
    t.callExpression(t.identifier('useEffect'), [
      t.arrowFunctionExpression([], t.blockStatement(useEffectStatements)),
      t.arrayExpression([]),
    ]),
  );

  // 合并 observer ref 声明和 useEffect
  const allStatements = [...observerRefDeclarations, useEffectCall];

  // 找到组件的开始位置，在 return 语句前添加 useEffect
  const componentBody = path.node.body.find(
    (node) => t.isFunctionDeclaration(node) || t.isVariableDeclaration(node),
  );

  if (componentBody) {
    if (t.isFunctionDeclaration(componentBody)) {
      const returnStatement = componentBody.body.body.find((stmt) =>
        t.isReturnStatement(stmt),
      );
      if (returnStatement) {
        const returnIndex = componentBody.body.body.indexOf(returnStatement);
        componentBody.body.body.splice(returnIndex, 0, ...allStatements);
      }
    } else if (t.isVariableDeclaration(componentBody)) {
      // 处理 const Component = () => {} 的情况
      const declarator = componentBody.declarations[0];
      if (
        t.isVariableDeclarator(declarator) &&
        t.isArrowFunctionExpression(declarator.init)
      ) {
        const returnStatement = declarator.init.body.body.find((stmt) =>
          t.isReturnStatement(stmt),
        );
        if (returnStatement) {
          const returnIndex =
            declarator.init.body.body.indexOf(returnStatement);
          declarator.init.body.body.splice(returnIndex, 0, ...allStatements);
        }
      }
    }
  }
}

/**
 * 添加 useEffect 来处理点击事件
 */
function addTrackingUseEffect(path, t, trackingElements) {
  if (trackingElements.length === 0) return;

  // 检查是否已经导入了 useEffect 和 useRef
  const hasUseEffect = path.node.body.some(
    (node) =>
      t.isImportDeclaration(node) &&
      t.isStringLiteral(node.source, { value: 'react' }) &&
      node.specifiers.some(
        (spec) =>
          t.isImportSpecifier(spec) &&
          t.isIdentifier(spec.imported, { name: 'useEffect' }),
      ),
  );

  const hasUseRef = path.node.body.some(
    (node) =>
      t.isImportDeclaration(node) &&
      t.isStringLiteral(node.source, { value: 'react' }) &&
      node.specifiers.some(
        (spec) =>
          t.isImportSpecifier(spec) &&
          t.isIdentifier(spec.imported, { name: 'useRef' }),
      ),
  );

  const hasUseCallback = path.node.body.some(
    (node) =>
      t.isImportDeclaration(node) &&
      t.isStringLiteral(node.source, { value: 'react' }) &&
      node.specifiers.some(
        (spec) =>
          t.isImportSpecifier(spec) &&
          t.isIdentifier(spec.imported, { name: 'useCallback' }),
      ),
  );

  // 添加 useEffect 和 useRef 到 React 导入
  const reactImport = path.node.body.find(
    (node) =>
      t.isImportDeclaration(node) &&
      t.isStringLiteral(node.source, { value: 'react' }),
  );

  if (reactImport) {
    const specifiers = reactImport.specifiers || [];

    if (!hasUseEffect) {
      specifiers.push(
        t.importSpecifier(t.identifier('useEffect'), t.identifier('useEffect')),
      );
    }

    if (!hasUseRef) {
      specifiers.push(
        t.importSpecifier(t.identifier('useRef'), t.identifier('useRef')),
      );
    }

    if (!hasUseCallback) {
      specifiers.push(
        t.importSpecifier(
          t.identifier('useCallback'),
          t.identifier('useCallback'),
        ),
      );
    }
  }

  // 生成 useRef 声明
  const useRefDeclarations = trackingElements.map(({ refName }) => {
    return t.variableDeclaration('const', [
      t.variableDeclarator(
        t.identifier(refName),
        t.callExpression(t.identifier('useRef'), [t.nullLiteral()]),
      ),
    ]);
  });

  // 生成 useCallback 声明
  const useCallbackDeclarations = trackingElements.map(
    ({ refName, trackValue }, index) => {
      const callbackName = `trackingCallback${index}`;
      const trackValueExpr =
        typeof trackValue === 'string'
          ? t.stringLiteral(trackValue)
          : trackValue;

      return t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(callbackName),
          t.callExpression(t.identifier('useCallback'), [
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
                          t.identifier('click'),
                        ),
                        [trackValueExpr],
                      ),
                    ),
                  ]),
                ),
              ]),
            ),
            t.arrayExpression([]),
          ]),
        ),
      ]);
    },
  );

  // 生成 useEffect 代码
  const useEffectStatements = [];
  const cleanupStatements = [];

  trackingElements.forEach(({ refName, trackValue }, index) => {
    const callbackName = `trackingCallback${index}`;
    const trackValueExpr =
      typeof trackValue === 'string' ? t.stringLiteral(trackValue) : trackValue;

    // 添加事件监听器的代码
    useEffectStatements.push(
      t.ifStatement(
        t.memberExpression(t.identifier(refName), t.identifier('current')),
        t.blockStatement([
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('element'),
              t.memberExpression(
                t.identifier(refName),
                t.identifier('current'),
              ),
            ),
          ]),
          // 先移除可能已存在的事件监听器，避免重复添加
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier('element'),
                t.identifier('removeEventListener'),
              ),
              [t.stringLiteral('click'), t.identifier(callbackName)],
            ),
          ),
          // 然后添加事件监听器
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier('element'),
                t.identifier('addEventListener'),
              ),
              [t.stringLiteral('click'), t.identifier(callbackName)],
            ),
          ),
        ]),
      ),
    );

    // 添加清理代码
    cleanupStatements.push(
      t.ifStatement(
        t.memberExpression(t.identifier(refName), t.identifier('current')),
        t.blockStatement([
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier('element'),
              t.memberExpression(
                t.identifier(refName),
                t.identifier('current'),
              ),
            ),
          ]),
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier('element'),
                t.identifier('removeEventListener'),
              ),
              [t.stringLiteral('click'), t.identifier(callbackName)],
            ),
          ),
        ]),
      ),
    );
  });

  // 添加清理函数
  if (cleanupStatements.length > 0) {
    useEffectStatements.push(
      t.returnStatement(
        t.arrowFunctionExpression([], t.blockStatement(cleanupStatements)),
      ),
    );
  }

  const useEffectCall = t.expressionStatement(
    t.callExpression(t.identifier('useEffect'), [
      t.arrowFunctionExpression([], t.blockStatement(useEffectStatements)),
      t.arrayExpression([]),
    ]),
  );

  // 合并 useRef 声明和 useEffect
  const allStatements = [
    ...useRefDeclarations,
    ...useCallbackDeclarations,
    useEffectCall,
  ];

  // 找到组件的开始位置，在 return 语句前添加 useEffect
  const componentBody = path.node.body.find(
    (node) => t.isFunctionDeclaration(node) || t.isVariableDeclaration(node),
  );

  if (componentBody) {
    if (t.isFunctionDeclaration(componentBody)) {
      const returnStatement = componentBody.body.body.find((stmt) =>
        t.isReturnStatement(stmt),
      );
      if (returnStatement) {
        const returnIndex = componentBody.body.body.indexOf(returnStatement);
        componentBody.body.body.splice(returnIndex, 0, ...allStatements);
      }
    } else if (t.isVariableDeclaration(componentBody)) {
      // 处理 const Component = () => {} 的情况
      const declarator = componentBody.declarations[0];
      if (
        t.isVariableDeclarator(declarator) &&
        t.isArrowFunctionExpression(declarator.init)
      ) {
        const returnStatement = declarator.init.body.body.find((stmt) =>
          t.isReturnStatement(stmt),
        );
        if (returnStatement) {
          const returnIndex =
            declarator.init.body.body.indexOf(returnStatement);
          declarator.init.body.body.splice(returnIndex, 0, ...allStatements);
        }
      }
    }
  }
}

export default autoTrackingLoader;
