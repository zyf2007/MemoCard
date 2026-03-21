import { useFocusEffect } from 'expo-router';
import React, { useCallback, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { Material3ThemeProvider, useAppTheme } from '../../hooks/Material3ThemeProvider';

const FadeInView: React.FC<PropsWithChildren<object>> = props => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);

  const playFadeIn = useCallback(() => {
    fadeAnim.value = 0;
    scaleAnim.value = 0.8;
    
    fadeAnim.value = withTiming(1, {
      duration: 200,
      easing: Easing.linear,
    });
    
    scaleAnim.value = withTiming(1, {
      duration: 330,
      easing: Easing.out(Easing.exp),
    });
  }, [fadeAnim, scaleAnim]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{ scale: scaleAnim.value }],
    };
  });

  useFocusEffect(
    React.useCallback(() => {
      // console.log(`Tab Activated`);
      playFadeIn();
      return () => {
        // console.log(`Tab Deactivated`);
      };
    }, [playFadeIn])
  );

  React.useEffect(() => {
    playFadeIn();
  }, [playFadeIn]);

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          width: '100%',
        },
        animatedStyle,
      ]}>
      {props.children}
    </Animated.View>
  );
};

const FadeInTab: React.FC<PropsWithChildren<object>> = props => {
  const theme = useAppTheme();
  return (
    <Material3ThemeProvider>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surfaceContainer,
        }}>
        <FadeInView>{props.children}</FadeInView>
      </View>
    </Material3ThemeProvider>
  );
}

export default FadeInTab;