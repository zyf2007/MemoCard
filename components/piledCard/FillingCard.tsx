import { FillingQuestion } from "@/scripts/questions/FillingQuestion";
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MathText } from "react-native-latex-text";
import { Button, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../hooks/Material3ThemeProvider';

export interface FillingCardProps {
  question: FillingQuestion;
  onAnswerSubmit?: (isCorrect: boolean, questionId: string, answer: string) => void;
};

const FillingCard = forwardRef((props: Readonly<FillingCardProps>, ref) => {
  const theme = useAppTheme();
  const [userAnswer, setUserAnswer] = useState<string>(''); // 用户输入的答案
  const [showResult, setShowResult] = useState<boolean>(false); // 是否显示答题结果

  const Reset = () => {
    setUserAnswer('');
    setShowResult(false);
  };
  
  useImperativeHandle(ref, () => ({
    Reset,
  }));

  useEffect(() => Reset(), [props.question]);

  // 提交答案
  const handleSubmit = () => {
    if (!userAnswer.trim()) return; // 空答案不提交
    
    setShowResult(true);
    if (props.onAnswerSubmit) {
      const isCorrect = userAnswer.trim().toLowerCase() === props.question.correctAnswer.toLowerCase();
      props.onAnswerSubmit(isCorrect, props.question.id, userAnswer.trim());
    }
  };

  // 获取输入框边框颜色
  const getInputBorderColor = (): string => {
    if (!showResult) {
      return theme.colors.primary;
    }
    return userAnswer.trim().toLowerCase() === props.question.correctAnswer.toLowerCase() 
      ? '#228B22' 
      : theme.colors.error;
  };

  // 获取输入框背景色
  const getInputBgColor = (): string => {
    if (!showResult) {
      return theme.colors.surface;
    }
    return userAnswer.trim().toLowerCase() === props.question.correctAnswer.toLowerCase()
      ? theme.dark ? 'rgba(144, 238, 144, 0.2)' : 'rgba(34, 139, 34, 0.1)'
      : theme.dark ? 'rgba(255, 99, 71, 0.2)' : 'rgba(178, 34, 34, 0.1)';
  };

  const styleSheet = StyleSheet.create({
    inputContainer: {
      marginHorizontal: 20,
      marginTop: 20,
    },
    input: {
      fontSize: 18,
      backgroundColor: getInputBgColor(),
    },
    submitButton: {
      marginHorizontal: 20,
      marginTop: 16,
      borderRadius: 14,
      paddingVertical: 6,
    },
    resultText: {
      marginTop: 16,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 'bold',
    },
    hintText: {
      marginTop: 12,
      textAlign: 'center',
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    }
  });

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View>
        {/* 题型标题 */}
        <View style={{ margin: 20, marginBottom: 0, flexDirection: "row", justifyContent: "space-between" }} >
          <Text variant='titleMedium' style={{ color: theme.colors.primary }} >填空题</Text>
        </View>

        {/* 题目文本 */}
        <View style={{ margin: 20, marginTop: 15, justifyContent: "space-between" }} >
          <MathText
            content={props.question.text}
            textColor={theme.colors.onSurface}
            baseMathSize={9}
          />
        </View>

        {/* 答案输入区域 */}
        <View style={styleSheet.inputContainer}>
          <TextInput
            mode="outlined"
            label="请输入答案"
            value={userAnswer}
            onChangeText={setUserAnswer}
            style={styleSheet.input}
            outlineColor={getInputBorderColor()}
            activeOutlineColor={getInputBorderColor()}
            disabled={showResult}
            autoCapitalize="none"
            autoCorrect={false}
            right={showResult ? (
              userAnswer.trim().toLowerCase() === props.question.correctAnswer.toLowerCase() ? (
                <TextInput.Icon icon="check-circle" color="#228B22" />
              ) : (
                <TextInput.Icon icon="close-circle" color={theme.colors.error} />
              )
            ) : undefined}
          />
        </View>
      </View>

      {/* 底部区域：提交按钮和结果 */}
      <View style={{ margin: 16, flex: 1, justifyContent: 'flex-end' }}>
        {!showResult ? (
          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={!userAnswer.trim()}
            style={styleSheet.submitButton}
            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
          >
            提交答案
          </Button>
        ) : (
          <>
            <Text
              style={[
                styleSheet.resultText,
                { 
                  color: userAnswer.trim().toLowerCase() === props.question.correctAnswer.toLowerCase() 
                    ? theme.dark ? '#90EE90' : '#228B22' 
                    : theme.dark ? '#FF6347' : '#B22222' 
                }
              ]}
            >
              {userAnswer.trim().toLowerCase() === props.question.correctAnswer.toLowerCase() ? '回答正确！' : '回答错误！'}
            </Text>
            
            {userAnswer.trim().toLowerCase() !== props.question.correctAnswer.toLowerCase() && (
              <Text style={styleSheet.hintText}>
                正确答案：{props.question.correctAnswer}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
});

export interface FillingCardRef {
  Reset: () => void;
}

FillingCard.displayName = 'FillingCard';
export default FillingCard;