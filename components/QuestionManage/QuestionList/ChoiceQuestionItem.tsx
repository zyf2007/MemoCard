import TextWithMath from '@/components/ui/TextWithLatex';
import { ChoiceQuestion, Question } from '@/scripts/questions';
import { hasMathFormula } from '@/scripts/utils/utils';
import { Material3Scheme } from '@pchmn/expo-material3-theme';
import React from 'react';
import { View } from 'react-native';
import { Divider, Icon, IconButton, MD3Theme, Text } from 'react-native-paper';

interface ChoiceQuestionItemProps {
  question: Question;
  theme: MD3Theme & { colors: Material3Scheme };
  onEditPress: () => void;
  onDeletePress: () => void;
}

export const ChoiceQuestionItem: React.FC<ChoiceQuestionItemProps> = ({
  question,
  theme,
  onEditPress,
  onDeletePress
}) => {
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
        {hasMathFormula(choice) ? (
          // 包含公式：使用TextWithMath组件
          <TextWithMath
            content={choice || '无此选项'}
            textColor={theme.colors.onSurface}
            backgroundColor={"transparent"}
            style={{ width: '95%' }}
          />
        ) : (
          // 不包含公式：使用普通Text组件
          <Text style={{
            fontSize: 14,
            flex: 1,
            color: isCorrect ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant
          }}>
            {choice || '无此选项'}
          </Text>
        )}
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
        {hasMathFormula(question.text) ? (
          // 包含公式：使用TextWithMath组件
          <TextWithMath
            content={question.text}
            textColor={theme.colors.onSurface}
            backgroundColor={"transparent"}
            style={{ paddingHorizontal: 16 }}
          />
        ) : (
          // 不包含公式：使用普通Text组件
          <Text
            style={{
              ...theme.fonts.labelLarge,
              marginLeft: 8,
              flex: 1,
              color: theme.colors.onSurface,
            }}
          >
            {question.text}
          </Text>
        )}
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
};