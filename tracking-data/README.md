# 埋点信息文件

这个目录包含了自动生成的埋点信息文件，用于记录项目中所有的埋点数据。

## 文件结构

### 单个文件埋点信息
- `{文件名}-tracking.json`: 每个包含埋点属性的 TSX 文件都会生成对应的埋点信息文件
- 包含该文件中所有的埋点信息，包括埋点类型、名称和引用名称

### 汇总文件
- `tracking-summary.json`: 包含所有文件的埋点信息汇总
- 包含总埋点数量、最后更新时间等统计信息

## 文件格式

### 单个文件格式
```json
{
  "file": "src/AutoTrackedPage.tsx",
  "timestamp": "2025-09-23T00:10:48.161Z",
  "tracking": [
    {
      "type": "show",
      "name": "ad",
      "elementName": "div"
    },
    {
      "type": "click",
      "name": "ad",
      "elementName": "div"
    }
  ]
}
```

### 汇总文件格式
```json
{
  "files": [
    {
      "file": "src/AutoTrackedPage.tsx",
      "timestamp": "2025-09-23T00:08:38.732Z",
      "tracking": [...]
    }
  ],
  "totalTracking": 3,
  "lastUpdated": "2025-09-23T00:08:38.734Z"
}
```

## 字段说明

- `file`: 文件在项目中的相对路径
- `timestamp`: 文件生成时间
- `tracking`: 埋点信息数组
  - `type`: 埋点类型 (`show` 或 `click`)
  - `name`: 埋点名称（来自 `data-track-show` 或 `data-track-click` 属性值）
  - `elementName`: JSX 元素名称（如 `div`, `button`, `MyComponent` 等）
- `totalTracking`: 总埋点数量
- `lastUpdated`: 汇总文件最后更新时间

## 注意事项

- 这些文件是自动生成的，请不要手动修改
- 文件会在每次构建时更新
- 建议将 `tracking-data/` 目录添加到 `.gitignore` 中
