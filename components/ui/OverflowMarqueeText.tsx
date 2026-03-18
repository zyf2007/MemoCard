import * as React from 'react';
import { NativeSyntheticEvent, StyleProp, TextLayoutEventData, TextStyle, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type LoopMarqueeTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  pauseDuration?: number; // 回到起点后的停顿时间（毫秒）
  speed?: number; // 滚动速度（像素/秒）
  gapWidth?: number; // 两段文本之间的空隙宽度（像素），默认16
};

export function OverflowMarqueeText({
  text,
  style,
  containerStyle,
  pauseDuration = 1000,
  speed = 42,
  gapWidth = 20, // 新增：空隙宽度，默认16像素
}: LoopMarqueeTextProps) {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [textWidth, setTextWidth] = React.useState(0);
  const [isMeasured, setIsMeasured] = React.useState(false);
  const translateX = useSharedValue(0);

  const shouldMarquee = isMeasured && textWidth > containerWidth;
  // 关键改动：滚动距离 = 单个文本宽度 + 空隙宽度（适配新增的空隙）
  const scrollDistance = textWidth + gapWidth;

  // 测量文本真实宽度
  const handleTextMeasure = React.useCallback((event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = event.nativeEvent;
    if (lines && lines.length > 0) {
      const measured = Math.ceil(lines[0].width);
      if (measured > 0 && measured !== textWidth) {
        setTextWidth(measured);
      }
    }
  }, [textWidth]);

  // 容器+文本宽度测量完成
  React.useEffect(() => {
    if (containerWidth > 0 && textWidth > 0) {
      setIsMeasured(true);
    }
  }, [containerWidth, textWidth]);

  // 循环滚动动画逻辑
  React.useEffect(() => {
    if (!isMeasured || !shouldMarquee) {
      cancelAnimation(translateX);
      translateX.value = 0;
      return;
    }

    // 滚动时长适配新的滚动距离
    const scrollDuration = Math.max(1200, Math.round((scrollDistance / speed) * 1000));

    translateX.value = withRepeat(
      withSequence(
        withDelay(pauseDuration, withTiming(-scrollDistance, {
          duration: scrollDuration,
          easing: Easing.linear,
        })),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    return () => cancelAnimation(translateX);
  }, [scrollDistance, pauseDuration, speed, shouldMarquee, isMeasured]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // 空白间隔组件
  const Gap = React.useMemo(() => (
    <View style={{ width: gapWidth }} />
  ), [gapWidth]);

  return (
    <View
      style={[{ 
        overflow: 'hidden', 
        justifyContent: 'center', 
        flexShrink: 1, 
        minWidth: 0 
      }, containerStyle]}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      {/* 测量用文本 */}
      <View
        pointerEvents="none"
        style={{ 
          position: 'absolute', 
          opacity: 0, 
          left: 0, 
          top: 0, 
          width: '1000%', 
          overflow: 'visible' 
        }}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={style}
          onTextLayout={handleTextMeasure}
        >
          {text}
        </Text>
      </View>

      {/* 显示区域 */}
      {isMeasured ? (
        shouldMarquee ? (
          <Animated.View
            style={[
              animatedContainerStyle,
              { flexDirection: 'row', alignItems: 'center' }
            ]}
          >
            {/* 第一个文本 */}
            <Text
              numberOfLines={1}
              ellipsizeMode="clip"
              style={[style, { width: textWidth }]}
            >
              {text}
            </Text>
            {/* 新增：两段文本之间的空隙 */}
            {Gap}
            {/* 第二个文本 */}
            <Text
              numberOfLines={1}
              ellipsizeMode="clip"
              style={[style, { width: textWidth }]}
            >
              {text}
            </Text>
          </Animated.View>
        ) : (
          <Text numberOfLines={1} ellipsizeMode="tail" style={style}>
            {text}
          </Text>
        )
      ) : null}
    </View>
  );
}