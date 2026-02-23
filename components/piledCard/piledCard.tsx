import { QuestionGenerator } from '@/scripts/questionGenerator/questionGenerator';
import { ChoiceQuestion } from '@/scripts/questions';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../hooks/Material3ThemeProvider';
import ChoosingCard, { ChoosingCardRef } from './choosingCard';
import FillingCard from './FillingCard';

const { width, height } = Dimensions.get('window');
const THRESHOLD = width * 0.3;
const SWIPE_OUT_DURATION = 200;



/**
 * 单个卡片组件：根据相对索引计算动画
 */
function IndividualCard({
  index,
  currentIndexSv,
  currentIndex,
  translateX,
  translateY,
  question,
  onAnswerSubmit,
  theme
}: any) {
  const cardRef = useRef<ChoosingCardRef>(null);
      if(index - currentIndex === 1) {
      cardRef.current?.Reset();
    }
  const style = useAnimatedStyle(() => {
    const relIndex = index - currentIndexSv.value;

    // 当前卡片
    if (relIndex === 0) {
      return {
        zIndex: 2,
        transform: [
          { translateX: Math.min(translateX.value, 0) },
          { translateY: translateX.value < 0 ? translateY.value : 0 },
          { scale: interpolate(translateX.value, [0, width], [1, 0.95], Extrapolation.CLAMP) }
        ],
        opacity: interpolate(translateX.value, [0, width], [1, 0.8], Extrapolation.CLAMP),
      };
    }
    // 下一张卡片
    if (relIndex === 1) {
      return {
        zIndex: 1,
        transform: [
          { scale: interpolate(translateX.value, [-width, 0], [1, 0.85], Extrapolation.CLAMP) }
        ],
        opacity: translateX.value < 0
          ? interpolate(translateX.value, [-width, 0], [1, 0.4], Extrapolation.CLAMP)
          : 0,
      };
    }
    // 上一张卡片
    if (relIndex === -1) {
      return {
        zIndex: 3,
        transform: [
          { translateX: interpolate(translateX.value, [0, width], [-width, 0], Extrapolation.CLAMP) },
          { translateY: translateX.value > 0 ? translateY.value : 0 }
        ],
        opacity: translateX.value > 0 ? 1 : 0,
      };
    }

    return { opacity: 0 };
  });

  const cardStyles = StyleSheet.create({
    card: {
      position: 'absolute',
      width: width * 0.86,
      height: height * 0.6,
      borderRadius: 24,
      elevation: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      justifyContent: 'center',
      bottom: 120,
      backgroundColor: theme.colors.surfaceBright,
    }
  });

  return (
    <Animated.View style={[cardStyles.card, style]}>
      {question.type === 'choice' ? (
        <ChoosingCard ref={cardRef} question={question} onAnswerSubmit={onAnswerSubmit} />
      ) :
      (
        <FillingCard question={question} onAnswerSubmit={onAnswerSubmit} />
      )
      }
    </Animated.View>
  );

}

export default function PiledCard() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const theme = useAppTheme();
  const currentIndexSv = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const maxIndex = useSharedValue(QuestionGenerator.getInstance().getAvailableQuestionCount() - 1);
  useEffect(() => {
    return QuestionGenerator.getInstance().onQuestionCountChanged.subscribe((count) => {
      maxIndex.value = count - 1;
      currentIndexSv.value = 0;
      setCurrentIndex(0);
    });
  }, []);
  const updateIndex = useCallback((step: number) => {
    currentIndexSv.value = currentIndexSv.value + step;
    translateX.value = 0;
    translateY.value = 0;
    setCurrentIndex((prev) => prev + step);
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // const isVertical = Math.abs(e.translationY) > Math.abs(e.translationX) * 2;
      const isVertical = false;
      if (isVertical) {
        translateY.value = e.translationY;
        translateX.value = e.translationX * 0.35;
      } else {
        translateX.value = e.translationX;
        translateY.value = e.translationY * 0.35;
      }
    })
    .onEnd((e) => {
      const { velocityX, translationX } = e;
      const projectedX = translationX + velocityX * 0.2;
      // ←
      if (projectedX < -THRESHOLD && projectedX > 0 === velocityX > 0) {
        if (currentIndex < maxIndex.value) {
          translateX.value = withTiming(-width, { duration: SWIPE_OUT_DURATION }, (finished) => {
          if (finished) runOnJS(updateIndex)(1);
        });
        }
        // 到达最右侧
        else {
          translateX.value = withSpring(0);
        }
      }
      // →
      else if (projectedX > THRESHOLD && projectedX > 0 === velocityX > 0) {
        if (currentIndex > 0 ) {
          translateX.value = withTiming(width, { duration: SWIPE_OUT_DURATION }, (finished) => {
            if (finished) runOnJS(updateIndex)(-1);
          });
          translateY.value = withTiming(0, { duration: SWIPE_OUT_DURATION });
        }
        // 到达最左侧
        else {
          translateX.value = withSpring(0);
        }
      }
      // 每达到阈值
      else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const questionIndex = [currentIndex - 1, currentIndex, currentIndex + 1];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.wrapper}>
            {questionIndex.map((qIndex) => {
              if(qIndex<0 || qIndex>=QuestionGenerator.getInstance().getAvailableQuestionCount()) return null;
              const q = QuestionGenerator.getInstance().getQuestion(qIndex);

              return (
                <IndividualCard
                  key={q.id}
                  index={qIndex}
                  currentIndexSv={currentIndexSv}
                  currentIndex={currentIndex}
                  translateX={translateX}
                  translateY={translateY}
                  question={q as ChoiceQuestion}
                  onAnswerSubmit={() => { console.log('answerSubmit', qIndex); }}
                  theme={theme}
                />
              );
            })}
          </View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});