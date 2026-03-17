import FadeInTab from '@/components/ui/FadeInTab';
import { useAppTheme } from '@/hooks/Material3ThemeProvider';
import { router } from 'expo-router';
import * as React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function TabViewExample() {
  const theme = useAppTheme();



  return (
    <FadeInTab>
      <SafeAreaView>
        <ScrollView >
          <Text variant="displaySmall" style={{ marginTop: 100, marginLeft: 15 }}>管理</Text>
          <Text variant="titleMedium" style={{ marginTop: 30, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>题库</Text>
          <List.Item
            title="添加题库"
            description="将Json格式的题库文本导入到软件题库中"
            left={props => <List.Icon {...props} icon="application-import" style={{ transform: [{ scale: 0.85 }], marginLeft: 17 }} />}
            onPress={() => router.push("/settings/AddQuestionBases")}
          />

          <List.Item
            title="管理题库"
            description="查看，修改和清理导入过的题库"
            left={props => <List.Icon {...props} icon="database-edit" />}
            onPress={() => router.push("/settings/manageQuestionBases")}
          />
          <Text variant="titleMedium" style={{ marginTop: 16, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>通用</Text>
          <List.Item
            title="出题设置"
            description="管理出题规则等"
            left={props => <List.Icon {...props} icon="file-question" />}
            onPress={() => router.push("/settings/questionGenerator")}
          />
          <List.Item
            title="关于应用"
            description="本应用的版本信息等"
            left={props => <List.Icon {...props} icon="information" />}
            onPress={() => console.log('Pressed4')}
            style={{ marginBottom: 120, }}
          />


        </ScrollView>
      </SafeAreaView>
    </FadeInTab>
  );
}
