import { hasMathFormula } from '@/scripts/utils/utils';
import React from "react";
import { Text } from 'react-native-paper';
import TextWithLatex, { TextWithLatexProps } from "./TextWithLatex";
export const AutoMathText: React.FC<TextWithLatexProps> = ({
  content,
  textColor = '#000000',
  backgroundColor = 'transparent',
  fontSize = 16,
  style = {},
  centered = false, // 设置默认值为false
  onRenderComplete,
}) => {
  const hasMath = hasMathFormula(content);
  if (!hasMath) { onRenderComplete?.(); }
  return hasMath ? (
    // 包含公式：使用TextWithMath组件
    <TextWithLatex
      content={content}
      textColor={textColor}
      backgroundColor={backgroundColor}
      fontSize={fontSize}
      style={style}
      centered={centered}
      onRenderComplete={onRenderComplete}
    />
  ) : (
    // 不包含公式：使用普通Text组件
    <Text style={{
      fontSize: 14,
      flex: 1,
      color: textColor
    }}>
      {content}
    </Text>
  )
}
