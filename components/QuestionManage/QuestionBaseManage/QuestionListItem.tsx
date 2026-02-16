import { ChoiceQuestion, Question } from '@/scripts/questions';
import React from 'react';
import { View } from 'react-native';
import { Divider, Icon, IconButton, MD3Theme, Text } from 'react-native-paper';

// 定义组件的属性类型
interface QuestionItemProps {
  question: Question;
  theme: MD3Theme;
  onEditPress: () => void;
  onDeletePress: () => void;
}

export const QuestionListItem: React.FC<QuestionItemProps> =
  ({ question, theme, onEditPress, onDeletePress }) => {
    if (question.type === "choice") {
      const q = question as ChoiceQuestion;

      // 生成选项显示的辅助函数，标记正确答案
      const renderChoiceItem = (choice: string, index: number) => {
        const isCorrect = index === q.correctChoiceIndex - 1;
        return (
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 8,
            borderRadius: 6,
            borderWidth: 1,
            marginHorizontal: 4,
            minHeight: 40,
            backgroundColor: isCorrect
              ? theme.colors.primaryContainer
              : theme.colors.surfaceVariant,
            borderColor: isCorrect ? theme.colors.primary : theme.colors.outline
          }}>
            <Text style={{
              fontWeight: 'bold',
              marginRight: 6,
              fontSize: 14,
              color: isCorrect ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant
            }}>
              {/* 选项字母（A、B、C、D） */}
              {String.fromCodePoint(65 + index)}
            </Text>
            <Text style={{
              fontSize: 14,
              flex: 1,
              color: isCorrect ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant
            }}>
              {choice || '无此选项'}
            </Text>
          </View>
        );
      };

      // 获取4个选项，不足则补空字符串
      const choice0 = q.choices?.[0] || '';
      const choice1 = q.choices?.[1] || '';
      const choice2 = q.choices?.[2] || '';
      const choice3 = q.choices?.[3] || '';

      return (
        <View style={{ padding: 16 }}>


          {/* 题目标题行 */}
          <View style={{
            flexDirection: 'row',
            alignItems: "center",
            marginBottom: 12
          }}>
            <Icon source="playlist-check" size={24} color={theme.colors.primary} />
            <Text style={{
              ...theme.fonts.labelLarge,
              marginLeft: 8,
              flex: 1,
              color: theme.colors.onSurface
            }}>
              {question.text}
            </Text>
          </View>

          {/* 选项 */}
          <View style={{ marginVertical: 8 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8
            }}>
              {renderChoiceItem(choice0, 0)}
              {renderChoiceItem(choice1, 1)}
            </View>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}>
              {renderChoiceItem(choice2, 2)}
              {renderChoiceItem(choice3, 3)}
            </View>
          </View>

          {/* 底部 */}
          <View style={{
            flexDirection: 'row',
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 5
          }}>
            {/* 题目类型 */}
            <Text style={{
              ...theme.fonts.labelMedium,
              marginBottom: 8,
              color: theme.colors.primary,
              fontWeight: 'bold',
            }}>
              {q.type === 'choice' ? '单项选择题' : '填空题'}
            </Text>
            {/* 按钮容器 */}
            <View style={{ flexDirection: 'row' }}>
              <IconButton
                icon="pencil"
                size={24}
                onPress={onEditPress}
              />
              <IconButton
                icon="delete"
                size={24}
                onPress={onDeletePress}
              />
            </View>
          </View>

          <Divider horizontalInset={true} style={{ marginTop: 12 }} />
        </View>
      );
    }
    return null;
  };