export const hasMathFormula = (text:string) => {
  if (!text || typeof text !== 'string') return false;
  // 正则匹配规则：
  // 1. $...$ 行内公式
  // 2. \(...\) 行内公式
  // 3. \[...\] 块级公式
  const mathRegex = /(\$[^$]+\$)|(\\\([\s\S]+?\\\))|(\\\[[\s\S]+?\\\])/;
  return mathRegex.test(text);
};