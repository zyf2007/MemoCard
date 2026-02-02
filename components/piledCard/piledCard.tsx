import React, { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useAppTheme } from '../Material3ThemeProvider';

const { width, height } = Dimensions.get('window');
const THRESHOLD = width * 0.3;
export default function PiledCard({ getData }: Readonly<{ getData: (index: number) => string }>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // 提前告诉临时覆盖的卡片下一个索引，确保数据不被setCurrentIndex更新
  const [nextIndex, setNextIndex] = useState(0);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const updateIndex = (step: number) => {
    setCurrentIndex((prev) => prev + step);
    translateX.value = 0;
    translateY.value = 0;
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const isVertical = Math.abs(e.translationY) > Math.abs(e.translationX) * 2;

      if (isVertical) {
        translateY.value = e.translationY;
        translateX.value = e.translationX * 0.3;
      } else {
        translateX.value = e.translationX;
        translateY.value = e.translationY * 0.3;
      }
    })
    .onEnd((e) => {
      const { velocityX, velocityY } = e;
      const absX = Math.abs(translateX.value);
      const absY = Math.abs(translateY.value);

      const projectedX = absX + Math.abs(velocityX) * 0.2;
      const projectedY = absY + Math.abs(velocityY) * 0.2;

      // 1. 判断是否需要回弹 (阈值检查 + 方向一致性检查)
      const shouldResetX = projectedX < THRESHOLD || (translateX.value > 0 !== velocityX > 0 && velocityX !== 0);
      const shouldResetY = projectedY < THRESHOLD || (translateY.value > 0 !== velocityY > 0 && velocityY !== 0);

      // 如果水平和垂直都没达到甩出条件，则回弹
      if (shouldResetX && shouldResetY) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        return;
      }

      // 2. 判定主轴方向：水平甩出 vs 垂直甩出
      if (projectedX > projectedY) {
        // 水平滑动
        const isRight = velocityX > 0;
        const targetX = isRight ? width : -width;
        // 在动画完成前先记录当前索引，确保临时遮挡数据不被updateIndex影响
        runOnJS(setNextIndex)(isRight ? currentIndex - 1 : currentIndex + 1);
        translateX.value = withTiming(targetX, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(updateIndex)(isRight ? -1 : 1);
          }
        });
        translateY.value = withTiming(0, { duration: 200 });
      } else {
        // 垂直滑动
        const isDown = velocityY > 0;
        const targetY = isDown ? height : -height;

        translateY.value = withTiming(targetY, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(updateIndex)(1); // 垂直滑暂时视为“下一张”
          }
        });
      }
    });

  // 1. 下一张 (Next) - 底层
  const nextStyle = useAnimatedStyle(() => {
    // 仅在左滑时放大
    const scale = interpolate(translateX.value, [-width, 0], [1, 0.85], Extrapolation.CLAMP);
    const opacity = interpolate(translateX.value, [-width, 0], [1, 0.4], Extrapolation.CLAMP);
    return {
      transform: [{ scale }],
      opacity: translateX.value < 0 ? opacity : 0,
      zIndex: 1,
    };
  });

  // 2. 当前张 (Current) - 中间层
  const currentStyle = useAnimatedStyle(() => {
    // 右滑时透明度变化：从 1 降到 0.7
    const opacity = interpolate(translateX.value, [0, width], [1, 0.4], Extrapolation.CLAMP);

    // 右滑时缩小：从 1 缩到 0.85
    const scale = interpolate(translateX.value, [0, width], [1, 0.85], Extrapolation.CLAMP);

    // 轨道锁定逻辑：右滑时当前卡片 X 轴不动，左滑时跟随
    const x = Math.min(translateX.value, 0);
    const y = translateX.value < 0 ? translateY.value : 0;
    return {
      transform: [{ translateX: x }, { translateY: y }, { scale: scale }],
      opacity: opacity,
      zIndex: 2,
    };
  });

  // 3. 前一张 (Prev) - 最顶层
  const prevStyle = useAnimatedStyle(() => {
    // 从左侧 -width 处飞入覆盖
    const x = interpolate(translateX.value, [0, width], [-width, 0], Extrapolation.CLAMP);
    const y = translateX.value > 0 ? translateY.value : 0;
    return {
      transform: [{ translateX: x }, { translateY: y }],
      opacity: translateX.value > 0 ? 1 : 0,
      zIndex: 3,
    };
  });
  // 4. 加载遮挡层 (Shelter) - 临时层
  const shelterOpacity = useSharedValue(0);
  useAnimatedReaction(
    // 监听current
    () => ({ trigger: Math.abs(translateX.value) > width - 5, }),
    (current, previous) => {
      // 当 translateX 超过阈值时，立即将 opacity 设为 1
      if (current.trigger && !previous?.trigger) {
        shelterOpacity.value = 1;
        // 延迟 150ms 后再设为 0，确保当前卡片完全隐藏
        shelterOpacity.value = withDelay(150, withTiming(0, { duration: 0 }));
      }
    }
  );

  const sheltStyle = useAnimatedStyle(() => {
    return {
      opacity: shelterOpacity.value,
      zIndex: 4,
    };
  });
  const theme = useAppTheme();
  const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    alignItems: 'center',
    bottom: 120,
    backgroundColor: theme.colors.surfaceBright,
  }
});
  return (
    <View style={{ backgroundColor: theme.colors.background, flex: 1}}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.wrapper}>

          {/* 下一张 (Next) */}
          <Animated.View style={[styles.card, nextStyle]}>
            <Text variant="headlineMedium">{getData(currentIndex + 1) || "End"}</Text>
          </Animated.View>

          {/* 当前张 (Current) */}
          <Animated.View style={[styles.card, currentStyle]}>
            <Text variant="headlineMedium">{getData(currentIndex)}</Text>
          </Animated.View>

          {/* 前一张 (Prev) */}
          <Animated.View style={[styles.card, prevStyle]}>
            <Text variant="headlineMedium">{getData(currentIndex - 1) || "Start"}</Text>
          </Animated.View>

          {/* 加载遮挡层 (Shelter) */}
          <Animated.View style={[styles.card, sheltStyle, { elevation: 0 }]} pointerEvents={'none'}>
            <Text variant="headlineMedium">{getData(nextIndex)}</Text>
          </Animated.View>

        </View>
      </GestureDetector>
    </View>
  );
}

