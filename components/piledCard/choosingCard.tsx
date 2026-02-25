import { ChoiceQuestion } from "@/scripts/questions/ChoiceQuestion";
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MathText } from "react-native-latex-text";
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../hooks/Material3ThemeProvider';
import FullQuestionDialog from "./fullQuestionDialog";

export interface ChoosingCardProps {
  question: ChoiceQuestion;
  onAnswerSubmit?: (isCorrect: boolean, questionId: string) => void;
};

const ChoosingCard = forwardRef((props: Readonly<ChoosingCardProps>, ref) => {
  const theme = useAppTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // 用户选择的选项索引
  const [showResult, setShowResult] = useState<boolean>(false); // 是否显示答题结果
  const [fullQuestionDialogVisible, setFullQuestionDialogVisible] = useState<boolean>(false);
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
      props.onAnswerSubmit(isCorrect, props.question.id);
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




  // 判断是否需要单列显示（任意选项文本长度超过5个字符）
  const isSingleColumn = props.question.choices.some(choice => choice.length > 5);

  const styleSheet = StyleSheet.create({
    option: {
      margin: 4,
      justifyContent: 'center',
      borderRadius: 14,
      minHeight: 40,
      width: '100%',
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
    <View style={{ flex: 1 }}>
      <View>
        {/* 题型标题 */}
        <View style={{ margin: 20, marginBottom: 0, flexDirection: "row" }} >
          <Text variant='titleMedium' style={{ color: theme.colors.primary }} >单选题</Text>
        </View>
      </View>

      {/* 题目文本 */}
      <Pressable
        style={{ margin: 20, marginTop: 15, flex: 1 ,minHeight:0,overflow:'hidden'}}
        onPress={() => setFullQuestionDialogVisible(true)}
      >
        <MathText
          content={props.question.text}
          textColor={theme.colors.onSurface}
          baseMathSize={9}
        />
      </Pressable>
      {/* 选项按钮 */}
      <View style={{ margin: 16, marginTop: 0  }}>
        {isSingleColumn ? (
          // 单列显示：一行一个按钮
          <View style={styleSheet.optionColumn}>
            {options.map(option => (
              <Pressable
                key={`option-${option.index}`}
                style={[getOptionButtonStyle(option.index),{right:4}]}
                onPress={() => handleOptionPress(option.index)}
                disabled={showResult}
              >
                <MathText
                  content={option.text}
                  textColor={theme.colors.background}
                  baseMathSize={9}
                  viewStyle={{ width: '100%' }}
                  lineStyle={{ justifyContent: 'center' }}
                />
              </Pressable>
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

                    <Pressable
                      key={`option-${option.index}`}
                      style={[getOptionButtonStyle(option.index), {flex:1}]}
                      onPress={() => handleOptionPress(option.index)}
                      disabled={showResult}
                    >
                      <MathText
                        content={option.text}
                        textColor={theme.colors.background}
                        baseMathSize={9}
                        viewStyle={{ width: '100%' }}
                        lineStyle={{ justifyContent: 'center' }}
                      />
                    </Pressable>
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
        <FullQuestionDialog
          question={props.question}
          theme={theme}
          visible={fullQuestionDialogVisible}
          onDismiss={() => setFullQuestionDialogVisible(false)}
        />
    </View>
  );
})
export interface ChoosingCardRef {
  Reset: () => void;
}
ChoosingCard.displayName = 'ChoosingCard';
export default ChoosingCard;