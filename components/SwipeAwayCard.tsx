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

const THRESHOLD = 120; // 判定滑出阈值

export default function SwipeAwayCard({ children }: Readonly<{ children: React.ReactNode }>) {

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
  })
  .onEnd(() => {
    const absX = Math.abs(translateX.value);
    const absY = Math.abs(translateY.value);

    if (absX < THRESHOLD && absY < THRESHOLD) {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      return;
    }

    const config = { duration: 200 };

    if (absX > absY) {
      // 左右
      translateX.value = withTiming(
        translateX.value > 0 ? width : -width,
          config,
          (finished) => {
            if (finished) {
              runOnJS(onSwipeComplete)(translateX.value > 0 ? 'right' : 'left');
            }
          }
      );
    } else {
      // 上下
      translateY.value = withTiming(
        translateY.value > 0 ? height : -height,
          config,
          (finished) => {
            if (finished) {
              runOnJS(onSwipeComplete)(translateY.value > 0 ? 'down' : 'up');
            }
          }
      );
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
                        width: width * 0.85,
                        height: height * 0.75,
                        borderRadius: 20,
                        backgroundColor: '#fff',
                        alignSelf: 'center',
                        marginTop: height * 0.1,
                        elevation: 5,
                    },
                    animatedStyle,
                ]}
            >
                {children}
            </Animated.View>
        </GestureDetector>

    )
}



