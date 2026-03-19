import { QuestionGenerator } from '@/scripts/questionGenerator/questionGenerator';
import { QuestionLoader } from '@/scripts/QuestionLoader/QuestionLoader';
import { ChoiceQuestion, FillingQuestion, Question } from '@/scripts/questions';
import { Statistics } from '@/scripts/statistics/statistics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Button } from 'react-native-paper';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
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
}: {
  index: number,
  currentIndexSv: SharedValue<number>,
  currentIndex: number,
  translateX: SharedValue<number>,
  translateY: SharedValue<number>,
  question: Question,
  onAnswerSubmit: ((isCorrect: boolean, questionId: string) => void),
  theme:any
})
{
  const cardRef = useRef<ChoosingCardRef>(null);
  useEffect(() => {
    if (index - currentIndex === 1) {
      cardRef.current?.Reset();
    }
  }, [index, currentIndex, question.id]);

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
        <ChoosingCard ref={cardRef} question={question as ChoiceQuestion} onAnswerSubmit={onAnswerSubmit} />
      ) : question.type === 'filling'?
        (
          <FillingCard question={question as FillingQuestion} onAnswerSubmit={onAnswerSubmit} />
        ):(<></>)
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
  const [maxIndex, setMaxIndex] = useState(QuestionGenerator.getInstance().getAvailableQuestionCount());
  const [displayQuestions, setDisplayQuestions] = useState<Record<number, Question>>({});
  const displayQuestionCacheRef = useRef<Map<string, Question>>(new Map());
  const loadTokenRef = useRef(0);
  useEffect(() => {
    const generator = QuestionGenerator.getInstance();
    void generator.ready().then(() => {
      setMaxIndex(generator.getAvailableQuestionCount());
    });

    return generator.onQuestionCountChanged.on((count) => {
      setMaxIndex(count);
      currentIndexSv.value = 0;
      setCurrentIndex(0);
      setDisplayQuestions({});
      displayQuestionCacheRef.current.clear();
    });
  }, [currentIndexSv]);
  const updateIndex = useCallback((step: number) => {
    currentIndexSv.value = currentIndexSv.value + step;
    translateX.value = 0;
    translateY.value = 0;
    setCurrentIndex((prev) => prev + step);
  }, [currentIndexSv, translateX, translateY]);

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
        if (currentIndex < maxIndex) {
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
        if (currentIndex > 0) {
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
    }).simultaneousWithExternalGesture();

  const questionIndex = [currentIndex - 1, currentIndex, currentIndex + 1];
  const [dialogId, setDialogId] = useState(0);

  useEffect(() => {
    const loadVisibleQuestions = async () => {
      const currentLoadToken = ++loadTokenRef.current;
      const nextQuestions: Record<number, Question> = {};
      const visibleQuestionIndex = [currentIndex - 1, currentIndex, currentIndex + 1];

      for (const qIndex of visibleQuestionIndex) {
        if (qIndex < 0 || qIndex >= maxIndex) {
          continue;
        }

        const questionId = QuestionGenerator.getInstance().getQuestionId(qIndex);
        if (!questionId) {
          continue;
        }

        const cachedQuestion = displayQuestionCacheRef.current.get(questionId);
        if (cachedQuestion) {
          nextQuestions[qIndex] = cachedQuestion;
          continue;
        }

        const question = await QuestionLoader.getInstance().GetQuestionById(questionId);
        if (!question) {
          continue;
        }

        const processedQuestion = question.postProcessForDisplay();

        displayQuestionCacheRef.current.set(questionId, processedQuestion);
        nextQuestions[qIndex] = processedQuestion;
      }

      if (currentLoadToken !== loadTokenRef.current) {
        return;
      }
      setDisplayQuestions(nextQuestions);
    };

    void loadVisibleQuestions();
  }, [currentIndex, dialogId, maxIndex]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.wrapper}>
            {questionIndex.map((qIndex) => {
              if (qIndex < 0 || qIndex >= maxIndex) {
                return (
                <View key={qIndex} style={{position: 'absolute',}}>
                    <Button onPress={() => { void QuestionGenerator.getInstance().updateAvailableQuestionList(); setDialogId((prev) => prev + 1); }}>
                      {maxIndex>0? '重做今日错题' : '今日已完成所有题！'}
                    </Button>
                </View>);
              }
              const q = displayQuestions[qIndex];
              if (!q) {
                return null;
              }

              return (
                <IndividualCard
                  key={q.id + dialogId}
                  index={qIndex}
                  currentIndexSv={currentIndexSv}
                  currentIndex={currentIndex}
                  translateX={translateX}
                  translateY={translateY}
                  question={q as ChoiceQuestion}
                  onAnswerSubmit={(isCorrect) => {
                    void QuestionGenerator.getInstance().finishQuestion(qIndex, isCorrect);
                    void Statistics.getInstance().finishQuestion(q, isCorrect);
                   }}
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
