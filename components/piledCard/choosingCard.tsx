import { ChoiceQuestion } from "@/scripts/questions/ChoiceQuestion";
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAppTheme } from '../../hooks/Material3ThemeProvider';
import MathText from "../MathSystem/TextWithMath";

export interface ChoosingCardProps {
  question: ChoiceQuestion;
  onAnswerSubmit?: (isCorrect: boolean, questionId: string, selectedIndex: number) => void;
  onRenderComplete?: () => void;
};

const ChoosingCard = forwardRef((props: Readonly<ChoosingCardProps>, ref) => {
  const theme = useAppTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // 用户选择的选项索引
  const [showResult, setShowResult] = useState<boolean>(false); // 是否显示答题结果

  const Reset = () => {
    setSelectedIndex(null);
    setShowResult(false);
  };
  useImperativeHandle(ref, () => ({
    Reset,
  }));

  useEffect(() => Reset(), [props.question]);

  // 选项点击事件：记录选择并显示结果
  const handleOptionPress = (index: number) => {
    setSelectedIndex(index);
    setShowResult(true);
    if (props.onAnswerSubmit) {
      const isCorrect = index === props.question.correctChoiceIndex;
      props.onAnswerSubmit(isCorrect, props.question.id, index);
    }
  };


  const getOptionBgColor = (index: number): string => {
    if (!showResult) {
      return theme.colors.primary;
    }

    // 正确选项
    if (index === props.question.correctChoiceIndex) {
      return theme.colors.primary;
    }

    // 用户选错的选项
    if (index === selectedIndex && index !== props.question.correctChoiceIndex) {
      return theme.colors.errorContainer;
    }

    // 其他选项（未选中/非正确）
    return theme.colors.surfaceDisabled;
  };

  const getOptionButtonStyle = (index: number) => {
    // 根据[选项索引]和[答题结果]获取背景颜色
    const bgColor = getOptionBgColor(index);
    return [
      styleSheet.option,
      { backgroundColor: bgColor }
    ];
  };


  const renderOptionContent = (text: string, optionIndex: number) => {
    return (

      <MathText
        content={text}
        textColor={theme.dark ? theme.colors.background : theme.colors.onSurfaceVariant}
        baseMathSize={9}
      />

    );
  };

  // 判断是否需要单列显示（任意选项文本长度超过5个字符）
  const isSingleColumn = props.question.choices.some(choice => choice.length > 5);

  const styleSheet = StyleSheet.create({
    option: {
      flex: 1,
      margin: 4,
      justifyContent: 'center',
      borderRadius: 14,
      minHeight: 40,
    },
    resultText: {
      marginTop: 10,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 'bold',
      paddingBottom: -10,
    },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 1
    },
    optionColumn: {
      flexDirection: 'column',
      gap: 4,
      justifyContent: 'flex-end',
    }
  });

  // 选项列表（A/B/C/D对应索引1/2/3/4）
  const options = [
    { label: 'A', index: 1, text: props.question.choices[0] },
    { label: 'B', index: 2, text: props.question.choices[1] },
    { label: 'C', index: 3, text: props.question.choices[2] },
    { label: 'D', index: 4, text: props.question.choices[3] },
  ];

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View>
        {/* 题型标题 */}
        <View style={{ margin: 20, marginBottom: 0, flexDirection: "row", justifyContent: "space-between" }} >
          <Text variant='titleMedium' style={{ color: theme.colors.primary }} >单选题</Text>
        </View>

        {/* 题目文本 */}
        <View style={{ margin: 20, marginTop: 15, justifyContent: "space-between" }} >

                <MathText
        content={props.question.text}
        textColor={theme.colors.onSurface}
        baseMathSize={9}
      />
        </View>
      </View>
      {/* 选项按钮 */}
      <View style={{ margin: 16, flex: 1, justifyContent: 'flex-end' }}>
        {isSingleColumn ? (
          // 单列显示：一行一个按钮
          <View style={styleSheet.optionColumn}>
            {options.map(option => (
              <Button
                key={`option-${option.index}`}
                mode="contained"
                style={[getOptionButtonStyle(option.index)]}
                labelStyle={{ fontSize: 23 }}
                onPress={() => handleOptionPress(option.index)}
                disabled={showResult}
                aria-label={`option${option.label}`}
              >
                {renderOptionContent(option.text, option.index)}
              </Button>
            ))}
          </View>
        ) : (
          // 双列显示：2行2列
          <>
            {[0, 1].map(rowIndex => (
              <View key={`row-${rowIndex}`} style={styleSheet.optionRow}>
                {[0, 1].map(colIndex => {
                  const optionIdx = rowIndex * 2 + colIndex;
                  const option = options[optionIdx];
                  return (
                    <Button
                      key={`option-${option.index}`}
                      mode="contained"
                      style={getOptionButtonStyle(option.index)}
                      labelStyle={{ fontSize: 23 }}
                      onPress={() => handleOptionPress(option.index)}
                      disabled={showResult}
                      aria-label={`option${option.label}`}
                    >
                      {renderOptionContent(option.text, option.index)}
                    </Button>
                  );
                })}
              </View>
            ))}
          </>
        )}

        {/* 答题结果显示 */}
        {showResult && (
          <Text
            style={[
              styleSheet.resultText,
              { color: selectedIndex === props.question.correctChoiceIndex ? theme.dark ? '#90EE90' : '#228B22' : theme.dark ? '#FF6347' : '#B22222' }
            ]}
          >
            {selectedIndex === props.question.correctChoiceIndex ? '回答正确！' : '回答错误！'}
          </Text>
        )}
      </View>

    </View>
  );
})
export interface ChoosingCardRef {
  Reset: () => void;
}
ChoosingCard.displayName = 'ChoosingCard';
export default ChoosingCard;