import { useFocusEffect } from 'expo-router';
import React, { useEffect, useRef, type PropsWithChildren } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Material3ThemeProvider, useAppTheme } from '../Material3ThemeProvider';
const FadeInView: React.FC<PropsWithChildren<object>> = props => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;


    const playFadeIn = () => {
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 330,
            useNativeDriver: true,
            easing: Easing.out(Easing.exp),
        }).start();
    }

    useFocusEffect(
        React.useCallback(() => {
            console.log(`Tab Activated`);
            playFadeIn();
            return () => {
                console.log(`Tab Deactivated`);
            };
        }, [])
    );
    useEffect(() => {
        playFadeIn();
    }, [fadeAnim]);

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                flex: 1,
                width: '100%',
                transform: [
                    { scale: scaleAnim },
                ],
            }}>
            {props.children}
        </Animated.View>
    );
};

export default function FadeInTab({ children }: any) {
    const theme = useAppTheme();
    return (
        <Material3ThemeProvider><View
            style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surfaceContainer,
            }}>
            <FadeInView>
                {children}
            </FadeInView>
        </View></Material3ThemeProvider>

    );
};