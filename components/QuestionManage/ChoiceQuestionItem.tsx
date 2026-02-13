import React from 'react';
import { View } from 'react-native';
import { IconButton, List } from 'react-native-paper';

// 定义组件的属性类型
interface ChoiceQuestionItemProps {
  name: string;          // 题目名称
  theme: any;            // 主题对象
  onDeletePress: () => void; // 删除按钮点击回调
}

export const ChoiceQuestionItem: React.FC<ChoiceQuestionItemProps> = ({
  name,
  theme,
  onDeletePress
}) => {
  return (
    <List.Item
      key={name} 
      title={name}
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
            onPress={() => console.log('Edit pressed')} 
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