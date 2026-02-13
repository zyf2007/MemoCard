import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { IconButton, List } from 'react-native-paper';

// 定义组件的属性类型
interface QuestionBaseItemProps {
  name: string;          // 题库名称
  theme: any;            // 主题对象
  onDeletePress: () => void; // 删除按钮点击回调
}

// 独立的题库列表项组件
export const QuestionBaseItem: React.FC<QuestionBaseItemProps> = ({
  name,
  theme,
  onDeletePress
}) => {
  return (
    <List.Item
      key={name}  // 改用name作为key，比index更稳定
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
            onPress={() => router.push({
              pathname: '/settings/manageQuestionBases/manageQuestionBase',
              params: { baseName: name }
            })} 
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