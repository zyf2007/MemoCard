import { AutoMathText } from '@/components/ui/AutoMathText';
import { FillingQuestion, Question } from '@/scripts/questions';
import { Material3Scheme } from '@pchmn/expo-material3-theme';
import React from 'react';
import { View } from 'react-native';
import { Divider, Icon, IconButton, MD3Theme, Text } from 'react-native-paper';

interface FillingQuestionItemProps {
  question: Question;
  theme: MD3Theme & { colors: Material3Scheme };
  onEditPress: () => void;
  onDeletePress: () => void;
}

export const FillingQuestionItem: React.FC<FillingQuestionItemProps> = ({
  question,
  theme,
  onEditPress,
  onDeletePress
}) => {
  const q = question as FillingQuestion;

  return (
    <View style={{ padding: 16 }}>
      {/* 题目标题行 */}
      <View style={{
        flexDirection: 'row',
        alignItems: "center",
        marginBottom: 12
      }}>
        <Icon source="text-box" size={22} color={theme.colors.primary} />
        <AutoMathText
          content={question.text}
          textColor={theme.colors.onSurface}
          backgroundColor={"transparent"}
          style={{ paddingHorizontal: 16 }}
        />
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
};