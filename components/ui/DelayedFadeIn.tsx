// StatisticsScreen.tsx 顶部导入部分新增
import React from 'react';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';

// 独立的延迟渐入组件
export const DelayedFadeIn: React.FC<{
  children: React.ReactNode;
  delay: number; // 延迟时间(ms)
}> = ({ children, delay }) => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);

  React.useEffect(() => {
    // 重置动画状态
    fadeAnim.value = 0;
    scaleAnim.value = 0.8;
    
    // 延迟执行动画
    fadeAnim.value = withDelay(
      delay,
      withTiming(1, {
        duration: 200,
        easing: Easing.linear,
      })
    );
    
    scaleAnim.value = withDelay(
      delay,
      withTiming(1, {
        duration: 330,
        easing: Easing.out(Easing.exp),
      })
    );
  }, [delay, fadeAnim, scaleAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View style={[{ flex: 1, width: '100%' }, animatedStyle]}>
      {children}
    </Animated.View>
  );
};
