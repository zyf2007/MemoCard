import { Material3Switch } from '@/components/materialSwitch';
import { OverflowMarqueeText } from '@/components/ui/OverflowMarqueeText';
import { QuestionGenerator } from '@/scripts/questionGenerator/questionGenerator';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { IconButton, List } from 'react-native-paper';

// 定义组件的属性类型
export interface QuestionBaseItemProps {
  id: string;
  name: string;          // 题库名称
  metaText?: string;
  theme: any;            // 主题对象
  onDeletePress: () => void; // 删除按钮点击回调
}

// 独立的题库列表项组件
export const QuestionBaseItem: React.FC<QuestionBaseItemProps> = ({
  id,
  name,
  metaText,
  theme,
  onDeletePress
}) => {
  const [isSwitchOn, setIsSwitchOn] = React.useState(QuestionGenerator.getInstance().isQuestionBaseEnabled(id));
  const onToggleSwitch = () => {

    setIsSwitchOn((prevIsSwitchOn) => !prevIsSwitchOn);

  };
  useEffect(() => {
    if (isSwitchOn) {
      void QuestionGenerator.getInstance().enableQuestionBase(id);
    } else {
      void QuestionGenerator.getInstance().disableQuestionBase(id);
    }
  }, [id, isSwitchOn]);
  return (
    <List.Item
      key={name}
      title={() => (
        <OverflowMarqueeText
          text={name}
          style={[theme.fonts.titleLarge, { color: theme.colors.onSurface }]}
        />
      )}
      description={metaText}
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
              params: { baseId: id }
            })}
          />
          <IconButton
            icon="file-remove"
            mode="contained"
            onPress={onDeletePress}
            
          />
          <Material3Switch switchOn={isSwitchOn} onPress={onToggleSwitch} switchOnIcon="check"  />
        </View>
      )}
    />
  );
};
