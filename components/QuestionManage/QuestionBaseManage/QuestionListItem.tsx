// QuestionListItem.tsx
import { ChoiceQuestion, FillingQuestion, Question } from '@/scripts/questions';
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

    // ==================== 选择题渲染 ====================
    if (question.type === "choice") {
      const q = question as ChoiceQuestion;

      // 渲染单个选项
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
            {/* 选项字母 */}
            <Text style={{
              fontWeight: 'bold',
              marginRight: 6,
              fontSize: 14,
              color: isCorrect ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant
            }}>
              {String.fromCodePoint(65 + index)}
            </Text>
            {/* 选项本体 */}
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

      // 获取 4 个选项，不足则补空字符串
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
              单项选择题
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
    
    // ==================== 填空题渲染 ====================
    if (question.type === "filling") {
      const q = question as FillingQuestion;

      return (
        <View style={{ padding: 16 }}>
          {/* 题目标题行 */}
          <View style={{
            flexDirection: 'row',
            alignItems: "center",
            marginBottom: 12
          }}>
            <Icon source="text-box" size={24} color={theme.colors.secondary} />
            <Text style={{
              ...theme.fonts.labelLarge,
              marginLeft: 8,
              flex: 1,
              color: theme.colors.onSurface
            }}>
              {question.text}
            </Text>
          </View>

          {/* 答案区域 */}
          <View style={{
            marginVertical: 8,
            padding: 12,
            borderRadius: 6,
            borderWidth: 1,
            backgroundColor: theme.colors.secondaryContainer,
            borderColor: theme.colors.secondary
          }}>
            <Text style={{
              fontSize: 12,
              color: theme.colors.onSecondaryContainer,
              marginBottom: 4,
              fontWeight: '500'
            }}>
              正确答案：
            </Text>
            <Text style={{
              fontSize: 16,
              color: theme.colors.onSecondaryContainer,
              fontWeight: 'bold'
            }}>
              {q.correctAnswer || '无答案'}
            </Text>
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
              填空题
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

    // ==================== 未知题型 fallback ====================
    return (
      <View style={{ padding: 16 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: "center",
          marginBottom: 12
        }}>
          <Icon source="alert-circle" size={24} color={theme.colors.error} />
          <Text style={{
            ...theme.fonts.labelLarge,
            marginLeft: 8,
            flex: 1,
            color: theme.colors.onSurface
          }}>
            {question.text}
          </Text>
        </View>
        <Text style={{
          fontSize: 12,
          color: theme.colors.error,
          marginBottom: 8
        }}>
          未知题型：{question.type}
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <Text style={{
            ...theme.fonts.labelMedium,
            color: theme.colors.error,
          }}>
            暂不支持
          </Text>
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
  };