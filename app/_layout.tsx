import { Material3ThemeProvider } from '@/hooks/Material3ThemeProvider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QuestionGenerator } from '@/scripts/questionGenerator/questionGenerator';
import { QuestionBaseLoader } from '@/scripts/QuestionLoader/QuestionLoader';
import { QuestionBaseManager } from '@/scripts/questions';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MathJaxRenderer, MathJaxRendererRef, MathRenderer } from 'react-native-latex-text';
import { install as installCtyptoJs } from 'react-native-quick-crypto';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

enableScreens();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  installCtyptoJs();
  const colorScheme = useColorScheme();
  QuestionBaseManager.getInstance();
  QuestionGenerator.getInstance();
  const mathJaxRef = useRef<MathJaxRendererRef>(null);
  MathRenderer.Init(mathJaxRef);
  QuestionBaseLoader.getInstance();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MathJaxRenderer
        ref={mathJaxRef}
        initialCache={[]}
        maxCacheSize={50}
        onRenderError={(error, sourceLatex) => {
          console.error('Render error:', error, 'for:', sourceLatex);
        }}
      />
      <GestureHandlerRootView style={{ flex: 1 }} >
        <SafeAreaProvider>
          <Material3ThemeProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="settings/manageQuestionBases/index" options={{ headerShown: true, title: '管理题库' }} />
              <Stack.Screen name="settings/manageQuestionBases/manageQuestionBase/index" options={{ headerShown: false, title: '编辑题库' }} />
              <Stack.Screen name="settings/AddQuestionBases/ImportQuestionBase/index" options={{ headerShown: true, title: '导入题库' }} />
              <Stack.Screen name="settings/AddQuestionBases/index" options={{ headerShown: false, title: '选择添加题库的方式' }} />

            </Stack>
          </Material3ThemeProvider>
        </SafeAreaProvider>
        <StatusBar style="auto" />

      </GestureHandlerRootView>

    </ThemeProvider>
  );
}



