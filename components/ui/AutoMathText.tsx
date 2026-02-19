import { hasMathFormula } from '@/scripts/utils/utils';
import React from "react";
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import TextWithLatex, { TextWithLatexProps } from "./TextWithLatex";
export const AutoMathText: React.FC<TextWithLatexProps> = ({
  content,
  textColor = '#000000',
  backgroundColor = 'transparent',
  fontSize = 16,
  containerStyle: style = {},
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
      containerStyle={style}
      centered={centered}
      onRenderComplete={onRenderComplete}
    />
  ) : (
      // 不包含公式：使用普通Text组件
      <View style ={style}>
    <Text style={[{
      fontSize: fontSize,
      color: textColor
    }]}>
      {content}
        </Text>
        </View>
  )
}
