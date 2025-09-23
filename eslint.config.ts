import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react: pluginReact, "react-hooks": reactHooks },
    rules: {
      // React 规则
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // TypeScript 规则
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],

      // 代码格式化规则
      indent: ["error", 2], // 2 空格缩进
      quotes: ["error", "double"], // 使用双引号
      semi: ["error", "always"], // 总是使用分号
      "comma-dangle": ["error", "always-multiline"], // 多行时使用尾随逗号
      "object-curly-spacing": ["error", "always"], // 对象大括号内空格
      "array-bracket-spacing": ["error", "never"], // 数组方括号内无空格
      "comma-spacing": ["error", { before: false, after: true }], // 逗号后空格
      "key-spacing": ["error", { beforeColon: false, afterColon: true }], // 对象键值冒号后空格
      "space-before-blocks": ["error", "always"], // 块前空格
      "space-before-function-paren": ["error", "never"], // 函数括号前无空格
      "space-in-parens": ["error", "never"], // 括号内无空格
      "space-infix-ops": "error", // 操作符周围空格
      "keyword-spacing": "error", // 关键字周围空格
      "brace-style": ["error", "1tbs"], // 大括号风格
      "eol-last": ["error", "always"], // 文件末尾换行
      "no-trailing-spaces": "error", // 无尾随空格
      "no-multiple-empty-lines": ["error", { max: 1 }], // 最多一个空行
      "object-property-newline": [
        "error",
        { allowAllPropertiesOnSameLine: false },
      ], // 对象属性每行一个
      "object-curly-newline": [
        "error",
        {
          ObjectExpression: { multiline: true, minProperties: 1 },
          ObjectPattern: { multiline: true, minProperties: 1 },
          ImportDeclaration: { multiline: true, minProperties: 1 },
          ExportDeclaration: { multiline: true, minProperties: 1 },
        },
      ], // 对象大括号换行

      // JSX 格式化规则
      "react/jsx-indent": ["error", 2], // JSX 缩进
      "react/jsx-indent-props": ["error", 2], // JSX 属性缩进
      "react/jsx-closing-bracket-location": ["error", "line-aligned"], // JSX 闭合标签位置
      "react/jsx-curly-spacing": ["error", "never"], // JSX 大括号内无空格
      "react/jsx-equals-spacing": ["error", "never"], // JSX 等号周围无空格
      "react/jsx-max-props-per-line": [
        "error",
        { maximum: 1, when: "multiline" },
      ], // 多行时每行一个属性

      // 通用规则
      "no-console": "warn",
    },
    settings: { react: { version: "detect" } },
  },
  {
    ignores: [
      "node_modules/",
      "dist/",
      "transformed-files/",
      "tracking-data/",
      "plugins/",
      "public/",
    ],
  },
]);
