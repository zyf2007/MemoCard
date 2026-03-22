import FadeInTab from '@/components/ui/FadeInTab';
import { useAppTheme } from '@/hooks/Material3ThemeProvider';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as React from 'react';
import { Linking } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Dialog, List, Portal, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const APP_NAME = 'MemoCard';
const REPOSITORY_URL = 'https://github.com/zyf2007/MemoCard';
const APP_VERSION = Constants.expoConfig?.extra?.buildVersion || Constants.expoConfig?.version || '未知版本';

export default function TabViewExample() {
  const theme = useAppTheme();
  const [aboutDialogVisible, setAboutDialogVisible] = React.useState(false);

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
            onPress={() => router.push('/settings/AddQuestionBases')}
          />

          <List.Item
            title="管理题库"
            description="查看，修改和清理导入过的题库"
            left={props => <List.Icon {...props} icon="database-edit" />}
            onPress={() => router.push('/settings/manageQuestionBases')}
          />
          <Text variant="titleMedium" style={{ marginTop: 16, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>通用</Text>
          <List.Item
            title="出题设置"
            description="管理出题规则等"
            left={props => <List.Icon {...props} icon="file-question" />}
            onPress={() => router.push('/settings/questionGenerator')}
          />
          <List.Item
            title="导入/导出信息"
            description="迁移当前题库、统计、在线仓库和出题设置"
            left={props => <List.Icon {...props} icon="database-sync" />}
            onPress={() => router.push('/settings/dataTransfer')}
          />
          <List.Item
            title="关于应用"
            description="本应用的版本信息等"
            left={props => <List.Icon {...props} icon="information" />}
            onPress={() => setAboutDialogVisible(true)}
            style={{ marginBottom: 120 }}
          />
        </ScrollView>

        <Portal>
          <Dialog visible={aboutDialogVisible} onDismiss={() => setAboutDialogVisible(false)}>
            <Dialog.Title>关于应用</Dialog.Title>
            <Dialog.Content>
              <Text variant="titleMedium">应用名称</Text>
              <Text style={{ marginTop: 4, marginBottom: 12 }}>{APP_NAME}</Text>

              <Text variant="titleMedium">GitHub 仓库</Text>
              <Text
                style={{ marginTop: 4, marginBottom: 12, color: theme.colors.primary }}
                onPress={() => Linking.openURL(REPOSITORY_URL)}
              >
                {REPOSITORY_URL}
              </Text>

              <Text variant="titleMedium">版本号</Text>
              <Text style={{ marginTop: 4 }}>{APP_VERSION}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setAboutDialogVisible(false)}>关闭</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </FadeInTab>
  );
}
