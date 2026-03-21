import { useAppTheme } from '@/hooks/Material3ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import PiledCard from '@/components/piledCard/piledCard';
import FadeInTab from '@/components/ui/FadeInTab';
import QuestionProgressBar from '@/components/ui/QuestionProgressBar';

const ONBOARDING_COMPLETED_KEY = '@memocard/onboarding_completed';

export default function HomeScreen() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const theme = useAppTheme();

  useEffect(() => {
    let mounted = true;
    const checkOnboarding = async () => {
      const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (!mounted) {
        return;
      }
      if (completed !== '1') {
        router.replace('/onboarding');
        return;
      }
      setReady(true);
    };
    void checkOnboarding();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [ready]);

  if (!ready) {
    return <View style={[styles.container, { backgroundColor: theme.colors.background }]} />;
  }

  return (
    <FadeInTab>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <QuestionProgressBar currentIndex={currentIndex} total={total} />

        <View style={styles.content}>
          {visible && (
            <PiledCard
              onProgressChange={({ currentIndex: nextCurrentIndex, total: nextTotal }) => {
                setCurrentIndex(nextCurrentIndex);
                setTotal(nextTotal);
              }}
            />
          )}
        </View>
      </View>
    </FadeInTab>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
  },
});
