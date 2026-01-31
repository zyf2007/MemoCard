import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const THRESHOLD = 120;
interface SwipeAwayCardProps {
  children: React.ReactNode;
  onPositionChange?: (x: number, y: number) => void;
};
export default function SwipeAwayCard({ children, onPositionChange }: Readonly<SwipeAwayCardProps>) {

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const verticalSwiping = useSharedValue(false);
  const onSwipeComplete = (dir: 'left' | 'right' | 'up' | 'down') => {
    console.log('Swiped direction:', dir);
  };
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      verticalSwiping.value = Math.abs(e.translationY) > Math.abs(e.translationX);

      if (verticalSwiping.value) {
        translateX.value = 0;
        translateY.value = e.translationY;
      } else {
        translateY.value = 0;
        translateX.value = e.translationX;
      }
      if (onPositionChange) {
        runOnJS(onPositionChange)(translateX.value, translateY.value);
      }
    })
    .onEnd((e) => {
      // 获取速度（像素/秒）
      const { velocityX, velocityY } = e;
      const absX = Math.abs(translateX.value);
      const absY = Math.abs(translateY.value);

      // 计算“投影位移”：当前位置 + 速度的一定比例（例如 20% 的惯性影响）
      const projectedX = absX + Math.abs(velocityX) * 0.2;
      const projectedY = absY + Math.abs(velocityY) * 0.2;


      // 投影位移小于阈值 或 速度方向与位置方向不同时，回弹
      if ((projectedX < THRESHOLD || translateX.value > 0 !== velocityX > 0)
        && (projectedY < THRESHOLD || translateY.value > 0 !== velocityY > 0)) {
        // 回弹逻辑
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        return;
      }

      // 执行甩出
      if (projectedX > projectedY) {
        // 甩出方向以速度方向为准
        const direction = velocityX > 0 ? 'right' : 'left';
        translateX.value = withTiming(direction === 'right' ? width : -width, { duration: 200 }, (finished) => {
          if (finished) runOnJS(onSwipeComplete)(direction);
          // 等待1秒
          setTimeout(() => {
            translateX.value = 0;
          }, 500);
        });
      } else {
        const direction = velocityY > 0 ? 'down' : 'up';
        translateY.value = withTiming(direction === 'down' ? height : -height, { duration: 200 }, (finished) => {
          if (finished) runOnJS(onSwipeComplete)(direction);
          // 等待1秒
          setTimeout(() => {
            translateY.value = 0;
          }, 500);
        });
      }
    });




  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            borderRadius: 20,
            backgroundColor: '#fff',
            elevation: 5,
            justifyContent: 'center',
            alignItems: 'center',
            left: width * 0.07,
            right: width * 0.07,
            bottom: 120,
            top: 100,
          },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>

  )
}



