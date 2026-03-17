import * as React from 'react';
import { GestureResponderEvent, LayoutChangeEvent, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type PresetOption = {
  title: string;
  description: string;
};

type PresetSliderProps = {
  options: PresetOption[];
  value: number;
  onChange: (nextIndex: number) => void;
  onCommit?: (nextIndex: number) => void;
  leftLabel?: string;
  rightLabel?: string;
  style?: { marginTop?: number; marginHorizontal?: number };
  trackColor: string;
  trackActiveColor: string;
  tickColor: string;
  textColor: string;
};

const clampIndex = (value: number, max: number) => Math.max(0, Math.min(max, value));

export default function PresetSlider({
  options,
  value,
  onChange,
  leftLabel,
  rightLabel,
  style,
  trackColor,
  trackActiveColor,
  tickColor,
  textColor,
  onCommit,
}: PresetSliderProps) {
  const trackRef = React.useRef<View>(null);
  const [trackWidth, setTrackWidth] = React.useState(0);
  const [trackLeft, setTrackLeft] = React.useState(0);

  // Reanimated shared values
  const thumbPosition = useSharedValue(value);
  const thumbScale = useSharedValue(1);

  const lastIndexRef = React.useRef(value);

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTrackWidth(width);

    if (trackRef.current) {
      trackRef.current.measure((x, y, w, h, pageX, pageY) => {
        setTrackLeft(pageX);
      });
    }
  }, []);

  const updateThumbPosition = React.useCallback(
    (nextIndex: number) => {
      if (trackWidth <= 0 || options.length < 2) return;
      const step = trackWidth / (options.length - 1);
      thumbPosition.value = withTiming(nextIndex, {
        duration: 120,
        easing: Easing.inOut(Easing.ease),
        reduceMotion: ReduceMotion.System,
      });
    },
    [options.length, trackWidth]
  );

  const handleTouch = React.useCallback(
    (pageX: number) => {
      if (trackWidth <= 0 || options.length < 2) {
        return;
      }
      const step = trackWidth / (options.length - 1);
      const localX = pageX - trackLeft;
      const clampedX = Math.max(0, Math.min(trackWidth, localX));
      const nextIndex = clampIndex(Math.round(clampedX / step), options.length - 1);

      lastIndexRef.current = nextIndex;

      if (nextIndex !== value) {
        onChange(nextIndex);
        // Trigger Reanimated update via JS callback
        updateThumbPosition(nextIndex);
      }
    },
    [onChange, options.length, trackLeft, trackWidth, value, updateThumbPosition]
  );

  React.useEffect(() => {
    lastIndexRef.current = value;
    // Sync external `value` prop to animated position
    updateThumbPosition(value);
  }, [value, updateThumbPosition]);

  const step = trackWidth > 0 && options.length > 1 ? trackWidth / (options.length - 1) : 0;

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const left = step * thumbPosition.value;
    return {
      transform: [{ translateX: left - 12 }, { scale: thumbScale.value }],
    };
  });

  const activeTrackStyle = useAnimatedStyle(() => {
    const width = step * thumbPosition.value;
    return {
      width: Math.max(0, width),
    };
  });

  const handleResponderGrant = (event: GestureResponderEvent) => {
    thumbScale.value = withTiming(1.2, { duration: 100 });
    handleTouch(event.nativeEvent.pageX);
  };

  const handleResponderMove = (event: GestureResponderEvent) => {
    handleTouch(event.nativeEvent.pageX);
  };

  const handleResponderRelease = () => {
    thumbScale.value = withTiming(1, { duration: 100 });
    if (onCommit) {
      runOnJS(onCommit)(lastIndexRef.current);
    }
  };

  return (
    <View style={style}>
      <View
        ref={trackRef}
        style={{ height: 36, justifyContent: 'center' }}
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponderCapture={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={handleResponderGrant}
        onResponderMove={handleResponderMove}
        onResponderRelease={handleResponderRelease}
      >
        {/* Inactive Track */}
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: trackColor,
          }}
        />

        {/* Active Track - Animated */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              height: 6,
              borderRadius: 3,
              backgroundColor: trackActiveColor,
            },
            activeTrackStyle,
          ]}
        />

        {/* Ticks */}
        {options.map((_, index) => (
          <View
            key={`tick-${index}`}
            style={{
              position: 'absolute',
              left: step * index - 3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: index <= value ? trackActiveColor : tickColor,
            }}
          />
        ))}

        {/* Thumb - Animated */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: trackActiveColor,
            },
            thumbAnimatedStyle,
          ]}
        />
      </View>

      {(leftLabel || rightLabel) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text variant="labelMedium" style={{ color: textColor }}>
            {leftLabel || ''}
          </Text>
          <Text variant="labelMedium" style={{ color: textColor }}>
            {rightLabel || ''}
          </Text>
        </View>
      )}
    </View>
  );
}