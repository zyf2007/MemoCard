import React, { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from 'react-native-paper';
import Animated, {
  Extrapolate,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const THRESHOLD = width * 0.3;

export default function PiledCard({ getData }: Readonly<{ getData: (index: number) => string }>) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const updateIndex = (step: number) => {
    setCurrentIndex((prev) => prev + step);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // 1. 完全锁定轨道：只允许单一方向位移
      const isVertical = Math.abs(e.translationY) > Math.abs(e.translationX);
      if (isVertical) {
        translateX.value = 0;
        translateY.value = e.translationY;
      } else {
        translateY.value = 0;
        translateX.value = e.translationX;
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

        translateX.value = withTiming(targetX, { duration: 200 }, (finished) => {
          if (finished) {
            // 重要：如果是右滑(isRight)，意味着压入前一张，index 应该 -1
            // 如果是左滑(!isRight)，意味着飞走当前张，index 应该 +1
            runOnJS(updateIndex)(isRight ? -1 : 1);

            translateX.value = 0;
            translateY.value = 0;
          }
        });
      } else {
        // 垂直滑动 (你可以保留原来的上下甩出逻辑，或者仅做回弹)
        const isDown = velocityY > 0;
        const targetY = isDown ? height : -height;

        translateY.value = withTiming(targetY, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(updateIndex)(1); // 垂直滑通常视为“下一张”

            translateX.value = 0;
            translateY.value = 0;
          }
        });
      }
    });

  // 1. 下一张 (Next) - 底层
  const nextStyle = useAnimatedStyle(() => {
    // 仅在左滑时放大
    const scale = interpolate(translateX.value, [-width, 0], [1, 0.85], Extrapolation.CLAMP);
    const opacity = interpolate(translateX.value, [-width, 0], [1, 0], Extrapolation.CLAMP);
    return {
      transform: [{ scale }],
      opacity: translateX.value < 0 ? opacity : 0,
      zIndex: 1,
    };
  });

  // 2. 当前张 (Current) - 中间层
  const currentStyle = useAnimatedStyle(() => {
    // 【新增】右滑时透明度变化：从 1 降到 0.7
    const opacity = interpolate(translateX.value, [0, width], [1, 0.7], Extrapolation.CLAMP);

    // 右滑时缩小：从 1 缩到 0.85
    const scale = interpolate(translateX.value, [0, width], [1, 0.85], Extrapolation.CLAMP);

    // 轨道锁定逻辑：右滑时当前卡片 X 轴不动，左滑时跟随
    const x = translateX.value < 0 ? translateX.value : 0;

    return {
      transform: [
        { translateX: x },
        { translateY: translateY.value },
        { scale: scale }
      ],
      opacity: opacity, // 应用透明度
      zIndex: 2,
    };
  });

  // 3. 前一张 (Prev) - 最顶层
  const prevStyle = useAnimatedStyle(() => {
    // 从左侧 -width 处飞入覆盖
    const x = interpolate(translateX.value, [0, width], [-width, 0], Extrapolate.CLAMP);
    return {
      transform: [{ translateX: x }],
      opacity: translateX.value > 0 ? 1 : 0,
      zIndex: 3,
    };
  });

  return (
    <View style={styles.container}>
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
          <Animated.View style={[styles.card, prevStyle, styles.topShadow]}>
            <Text variant="headlineMedium">{getData(currentIndex - 1) || "Start"}</Text>
          </Animated.View>

        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0e0e0' },
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
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topShadow: {
    elevation: 12,
    shadowOpacity: 0.25,
  }
});