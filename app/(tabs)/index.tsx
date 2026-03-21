import { useAppTheme } from '@/hooks/Material3ThemeProvider';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import PiledCard from '@/components/piledCard/piledCard';
import FadeInTab from '@/components/ui/FadeInTab';
import QuestionProgressBar from '@/components/ui/QuestionProgressBar';

export default function HomeScreen() {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const theme = useAppTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
