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

### 2.2 严格校验规则（运行时）

应用在解析索引时会执行以下严格校验：

- 顶层必须是 JSON 对象。
- `questionBases`（或兼容字段 `bases`）必须为数组。
- 每个条目的 `baseName` 必须是非空字符串（会先 `trim`）。
- `questionCount` 必须是非负整数。
- `filePath` 与 `downloadUrl` 至少提供一个，且若提供必须是非空字符串。
- `id` 可省略；省略时会由应用自动生成。
- `tags` 若提供，只有非空字符串标签会被保留（会自动 `trim`）。

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
  "updatedAt": "2026-03-18T15:00:00.000Z",
  "questionBases": [
    {
      "id": "touhou-characters",
      "baseName": "东方角色大全",
      "description": "涵盖东方Project系列中主要角色的背景、能力和符卡等知识的题库",
      "author": "幻想乡考察队",
      "questionCount": 5,
      "filePath": "question-bases/touhou-characters.json",
      "tags": [
        "东方Project",
        "角色",
        "设定"
      ]
    },
    {
      "id": "touhou-music",
      "baseName": "东方音乐鉴赏",
      "description": "包含东方Project各作品经典BGM的出处、曲名和相关角色的题库",
      "author": "骚灵乐团",
      "questionCount": 5,
      "filePath": "question-bases/touhou-music.json",
      "tags": [
        "东方Project",
        "音乐",
        "BGM"
      ]
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

### 3.0 严格校验规则（运行时）

应用在导入题库 JSON 时会执行以下严格校验：

- 顶层必须是 JSON 对象。
- `baseName` 必须是非空字符串（会先 `trim`）。
- `questions` 必须是数组，且不能为空。
- 每道题必须是对象，并且 `text` 必须是非空字符串。
- 每道题不允许包含 `id` 字段（由应用内部生成）。
- `type` 仅允许 `"choice"` 或 `"filling"`。
- 选择题必须满足：
  `choices` 长度必须是 4，且每个选项必须为非空字符串。
  `correctChoiceIndex` 必须是 1-4 的整数（1-based）。
- 填空题必须满足：
  `correctAnswer` 必须是非空字符串。
- `meta` 若提供必须是对象；其中：
  `meta.author` 若提供，必须是非空字符串。
  `meta.questionCount` 若提供，必须是非负整数。

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
  "baseName": "东方音乐鉴赏",
  "meta": {
    "author": "豆包-骚灵乐团",
    "questionCount": 5
  },
  "questions": [
    {
      "text": "《东方红魔乡》的最终BOSS蕾米莉亚·斯卡雷特的主题曲是？",
      "type": "choice",
      "choices": [
        "U.N.オーエンは彼女なのか？",
        "紅楼夢",
        "亡き王女の為のセプテット",
        "月時計 ～ ルナ・ダイアル"
      ],
      "correctChoiceIndex": 3
    },
    {
      "text": "《东方妖妖梦》中幽幽子的主题曲是《___》",
      "type": "filling",
      "correctAnswer": "幽雅に咲かせ、墨染の桜 ～ Border of Life"
    },
    {
      "text": "以下哪首曲子是《东方永夜抄》的主题曲？",
      "type": "choice",
      "choices": [
        "竹取飛翔 ～ Lunatic Princess",
        "千年幻想郷 ～ History of the Moon",
        "永夜の報い ～ Imperishable Night",
        "結界は厳しく恋は緩やか"
      ],
      "correctChoiceIndex": 3
    },
    {
      "text": "《东方萃梦想》的主题曲是《___》",
      "type": "filling",
      "correctAnswer": "碎月"
    },
    {
      "text": "《东方风神录》中射命丸文的主题曲是？",
      "type": "choice",
      "choices": [
        "神々が恋した幻想郷",
        "妖怪の山 ～ Mysterious Mountain",
        "風神少女",
        "信仰は儚き人間の為に"
      ],
      "correctChoiceIndex": 3
    }
  ]
}

```

## 4. 兼容说明

- 导出不包含每道题的 `id`。

### LaTeX 公式支持说明
题库中的题目文本（`text`）、选项文本（`choices` 数组项）、填空题答案（`correctAnswer`）均**全面支持 LaTeX 公式语法**，可用于编写数学、物理、化学等学科的公式表达式。

#### 4.1 语法规则
- **行内公式**：使用 `\( 公式内容 \)` 包裹，会嵌入文本行内显示（如：`\(v_0 = 2m/s\)`）。
- **块级公式**：使用 `\[ 公式内容 \]` 包裹，会单独成行居中显示（如：`\[x = v_0 t + \frac{1}{2} a t^2\]`）。
- 支持常见 LaTeX 公式语法：上下标（`_`/`^`）、分式（`\frac{}{}`）、矢量（`\vec{}`）、希腊字母（`\alpha`/`\beta` 等）、运算符（`\times`/`\div` 等）。

#### 4.2 完整示例
```json
{
  "formatVersion": 2,
  "baseName": "物理公式专项练习",
  "meta": {
    "author": "物理教研组",
    "questionCount": 3
  },
  "questions": [
    {
      "text": "已知质点做匀变速直线运动，位移公式为\\[x = v_0 t + \\frac{1}{2} a t^2\\]，若\\(v_0 = 2m/s\\)，\\(a = 3m/s^2\\)，\\(t = 4s\\)，则位移x的大小为？",
      "type": "choice",
      "choices": [
        "\\(28m\\)",
        "\\(32m\\)",
        "\\(36m\\)",
        "\\(40m\\)"
      ],
      "correctChoiceIndex": 2
    },
    {
      "text": "根据牛顿万有引力定律\\(F = G \\frac{Mm}{r^2}\\)，其中G为引力常量，其数值约为______ N·m²/kg²（保留两位小数）",
      "type": "filling",
      "correctAnswer": "6.67"
    },
    {
      "text": "计算电场强度\\(\\vec{E} = \\frac{\\vec{F}}{q}\\)，若试探电荷\\(q = 2×10^{-6}C\\)，受到的电场力\\(\\vec{F} = 4×10^{-3}N\\)，则电场强度的大小为？",
      "type": "choice",
      "choices": [
        "\\(2×10^3 N/C\\)",
        "\\(2×10^2 N/C\\)",
        "\\(2×10^4 N/C\\)",
        "\\(2×10^5 N/C\\)"
      ],
      "correctChoiceIndex": 1
    }
  ]
}
```

#### 4.3 注意事项
1. JSON 中反斜杠 `\` 需要转义为 `\\`，因此 LaTeX 语法中的单个 `\` 需写作 `\\`（如：`\(x\)` 需写为 `\\(x\\)`）。
2. 公式内容需符合标准 LaTeX 数学公式语法，应用会自动渲染，无需额外引入包。
3. 填空题的 `correctAnswer` 中若包含 LaTeX 公式，需保证答案文本与公式语法完全匹配（如答案为 `6.67` 而非 `\\(6.67\\)`，仅数值类答案无需包裹公式标记）。
