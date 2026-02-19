import { Question } from '@/scripts/questions';
import { Material3Scheme } from '@pchmn/expo-material3-theme';
import React from 'react';
import { View } from 'react-native';
import { Divider, Icon, IconButton, MD3Theme, Text } from 'react-native-paper';

interface UnknownQuestionItemProps {
  question: Question;
  theme: MD3Theme & { colors: Material3Scheme };
  onEditPress: () => void;
  onDeletePress: () => void;
}

export const UnknownQuestionItem: React.FC<UnknownQuestionItemProps> = ({
  question,
  theme,
  onEditPress,
  onDeletePress
}) => {
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