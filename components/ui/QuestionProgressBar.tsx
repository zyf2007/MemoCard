import { useAppTheme } from '@/hooks/Material3ThemeProvider';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type QuestionProgressBarProps = {
  currentIndex: number;
  total: number;
};

export default function QuestionProgressBar({ currentIndex, total }: QuestionProgressBarProps) {
  const theme = useAppTheme();
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const progressSv = useSharedValue(0);

  const currentQuestion = useMemo(() => {
    if (total <= 0) {
      return 0;
    }
    return Math.min(currentIndex + 1, total);
  }, [currentIndex, total]);

  const remainingQuestions = useMemo(() => {
    if (total <= 0) {
      return 0;
    }
    return Math.max(total - currentQuestion, 0);
  }, [currentQuestion, total]);

  useEffect(() => {
    progressSv.value = total > 0 ? currentQuestion / total : 0;
  }, [currentQuestion, progressSv, total]);

  const animatedProgress = useDerivedValue(() =>
    withTiming(progressSv.value, {
      duration: 390,
      easing: Easing.out(Easing.back(2)),
      reduceMotion: ReduceMotion.System,
    })
  );

  const fillAnimatedStyle = useAnimatedStyle(() => ({
    width: progressTrackWidth * animatedProgress.value,
  }));

  const onProgressTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setProgressTrackWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.topSafeArea}>
      <View style={styles.content}>
        <View style={styles.progressTextRow}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            当前第 {currentQuestion} / {total} 题
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            本回合剩余 {remainingQuestions} 题
          </Text>
        </View>
        <View
          style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceDisabled }]}
          onLayout={onProgressTrackLayout}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.primary },
              fillAnimatedStyle,
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topSafeArea: {
    width: '100%',
    alignItems: 'center',
  },
  content: {
    width: '84%',
    marginTop: 32,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
