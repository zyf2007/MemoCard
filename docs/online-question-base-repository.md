# 在线题库仓库规范

本文档定义 MemoCard 在线题库仓库的目录结构、索引结构，以及题库导入导出 JSON 标准。

## 1. 仓库目录结构

推荐结构如下（GitHub 仓库或普通 Web 目录都可）：

```text
<repo-root>/
  index.json
  question-bases/
    algebra-basic.json
    geometry-basic.json
```

- `index.json`：仓库索引，列出所有在线题库的元信息。
- `question-bases/*.json`：单个题库文件，格式遵循本文第 3 节。

## 2. 索引文件 `index.json` 结构

顶层字段：

- `formatVersion`: `number`，索引版本号，当前建议 `1`。
- `updatedAt`: `string`（可选），ISO 时间。
- `questionBases`: `array`，题库列表。兼容别名字段 `bases`。

题库条目字段：

- `id`: `string`（可选，建议唯一）。
- `baseName`: `string`，题库名。
- `description`: `string`（可选），简介。
- `author`: `string`（可选），作者名。
- `questionCount`: `number`，题目数量（非负整数）。
- `filePath`: `string`（可选），相对仓库根目录的 JSON 路径。
- `downloadUrl`: `string`（可选），题库 JSON 绝对下载地址。
- `tags`: `string[]`（可选），标签。
- `updatedAt`: `string`（可选），题库更新时间。

`filePath` 与 `downloadUrl` 至少提供一个。

## 2.1 仓库地址配置规则

应用支持以下仓库地址写法：

- GitHub 仓库地址：`https://github.com/<owner>/<repo>`
  应用会自动映射到 `raw.githubusercontent.com` 拉取 JSON 文件。
- 普通 Web 目录地址：`https://example.com/memocards/`
  应用会按 `<仓库地址>/<indexPath>` 拉取索引，并按 `filePath` 拼接题库文件地址。
- 直接索引地址：`https://example.com/memocards/index.json`
  应用会直接拉取该索引，并以其所在目录作为 `filePath` 的基地址。

示例：

```json
{
  "formatVersion": 1,
  "updatedAt": "2026-03-18T00:00:00.000Z",
  "questionBases": [
    {
      "id": "algebra-basic",
      "baseName": "代数基础",
      "description": "中学代数入门题库",
      "author": "Alice",
      "questionCount": 120,
      "filePath": "question-bases/algebra-basic.json",
      "tags": ["数学", "代数"]
    }
  ]
}
```

## 3. 题库导入导出 JSON 标准

顶层字段：

- `formatVersion`: `number`，当前导出为 `2`。
- `baseName`: `string`，题库名称。
- `meta`: `object`（可选）。
- `questions`: `array`，题目列表。

注意：题目项禁止包含 `id` 字段，`id` 由应用内规则生成。

`meta` 字段：

- `author`: `string`（可选）。
- `questionCount`: `number`（可选，建议与 `questions.length` 一致）。

### 3.1 选择题

```json
{
  "text": "2 + 2 = ?",
  "type": "choice",
  "choices": ["1", "2", "3", "4"],
  "correctChoiceIndex": 4
}
```

### 3.2 填空题

```json
{
  "text": "地球是第___颗行星",
  "type": "filling",
  "correctAnswer": "3"
}
```

### 3.3 完整示例

```json
{
  "formatVersion": 2,
  "baseName": "代数基础",
  "meta": {
    "author": "Alice",
    "questionCount": 2
  },
  "questions": [
    {
      "text": "2 + 2 = ?",
      "type": "choice",
      "choices": ["1", "2", "3", "4"],
      "correctChoiceIndex": 4
    },
    {
      "text": "x^2 在 x=3 时等于 ___",
      "type": "filling",
      "correctAnswer": "9"
    }
  ]
}
```

## 4. 兼容说明

- 导出不包含每道题的 `id`。
