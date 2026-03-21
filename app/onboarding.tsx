import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const ONBOARDING_COMPLETED_KEY = '@memocard/onboarding_completed';
const ONBOARDING_FLOW_STARTED_KEY = '@memocard/onboarding_flow_started';

export default function OnboardingPage() {
  const theme = useAppTheme();
  const [redirecting, setRedirecting] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  const goToCreateBase = React.useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_FLOW_STARTED_KEY, '1');
    router.push('/settings/AddQuestionBases');
  }, []);

  const goToDataTransfer = React.useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_FLOW_STARTED_KEY, '1');
    router.push('/settings/dataTransfer');
  }, []);

  const goToHome = React.useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      const checkState = async () => {
        const [completed, started] = await AsyncStorage.multiGet([
          ONBOARDING_COMPLETED_KEY,
          ONBOARDING_FLOW_STARTED_KEY,
        ]);
        if (!mounted) {
          return;
        }

        const completedValue = completed[1];
        const startedValue = started[1];

        if (completedValue === '1') {
          router.replace('/(tabs)');
          return;
        }

        if (startedValue === '1') {
          await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, '1');
          await AsyncStorage.removeItem(ONBOARDING_FLOW_STARTED_KEY);
          if (!mounted) {
            return;
          }
          setRedirecting(true);
          return;
        }

        setChecked(true);
      };

      void checkState();

      return () => {
        mounted = false;
      };
    }, [])
  );

  if (!checked && !redirecting) {
    return (
      <Material3ThemeProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} />
      </Material3ThemeProvider>
    );
  }

  return (
    <Material3ThemeProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 16,paddingTop: 10 }}>
          <Text variant="displayLarge" style={{marginBottom: -7, color: theme.colors.onBackground,marginHorizontal: 3 }}>欢迎使用</Text>
          <Text variant="titleMedium" style={{ marginBottom: 3, color: theme.colors.onBackground,marginHorizontal: 3 }}>这是一款能辅助你记忆的题库 App，请选择下面的任一选项开始使用...</Text>
          {redirecting ? (
            <>
              <Text variant="headlineMedium" style={{ marginBottom: 16, color: theme.colors.onBackground }}>🎉恭喜完成配置</Text>
              <Button mode="contained" onPress={goToHome}>
                开始使用
              </Button>
            </>
          ) : (
            <>
              <Card style={{padding: 6, borderRadius: 27 }}>
                <Card.Title title="新用户？" titleStyle={{ fontSize: 20 }} />
                <Card.Content>
                  <Text>创建你的第一个题库</Text>
                </Card.Content>
                <Card.Actions>
                  <Button mode="contained" onPress={() => void goToCreateBase()}>
                    去创建题库
                  </Button>
                </Card.Actions>
              </Card>
              <Card style={{padding: 6, borderRadius: 27 }}>
                <Card.Title title="老用户？" titleStyle={{ fontSize: 20 }} />
                <Card.Content>
                  <Text>剪贴板导入 / 从文件导入</Text>
                </Card.Content>
                <Card.Actions>
                  <Button mode="contained-tonal" onPress={() => void goToDataTransfer()}>
                    去导入导出
                  </Button>
                </Card.Actions>
              </Card>
            </>
          )}
        </View>
      </SafeAreaView>
    </Material3ThemeProvider>
  );
}
