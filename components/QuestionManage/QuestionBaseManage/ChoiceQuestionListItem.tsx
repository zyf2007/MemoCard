import { Question } from '@/scripts/questions';
import React from 'react';
import { View } from 'react-native';
import { IconButton, List } from 'react-native-paper';

// 定义组件的属性类型
interface ChoiceQuestionItemProps {
  question: Question;
  theme: any;
  onEditPress: () => void;
  onDeletePress: () => void; 
}

export const ChoiceQuestionListItem: React.FC<ChoiceQuestionItemProps> =
  ({ question, theme, onEditPress, onDeletePress }) => {
    return (
      <List.Item
        key={question.id}
        title={question.text}
        titleStyle={theme.fonts.titleLarge}
        style={{ marginBottom: -10 }}
        left={props => (
          <List.Icon
            {...props}
            icon="playlist-check"
            style={{ transform: [{ scale: 1.5 }], marginLeft: 22 }}
          />
        )}
        right={() => (
          <View style={{ flexDirection: 'row', marginRight: -10 }}>
            <IconButton
              icon="file-document-edit"
              mode="contained"
              onPress={onEditPress}
            />
            <IconButton
              icon="file-remove"
              mode="contained"
              onPress={onDeletePress}
            />
          </View>
        )}
      />
    );
  };