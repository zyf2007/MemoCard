import { Material3ThemeProvider, useAppTheme } from '@/components/Material3ThemeProvider';
import * as React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import { AnimatedFAB, Text } from 'react-native-paper';



export default function ImportQuestionBase() {
    const theme = useAppTheme();

    const [isExtended, setIsExtended] = React.useState(true);


    const onScroll: ScrollViewProps['onScroll'] = ({ nativeEvent }) => {
        const isScrollingUp = (nativeEvent.velocity?.y ?? 0) <= 0;
        const isTop = (nativeEvent.contentOffset?.y ?? 0) <= 0;
        const isBottom = (nativeEvent.contentOffset?.y ?? 0) >= (nativeEvent.contentSize?.height ?? 0) - (nativeEvent.layoutMeasurement?.height ?? 0);
        setIsExtended(isScrollingUp||isTop||isBottom);
    };

    // const fabStyle = { [animateFrom]: 16 };


    return (
        <Material3ThemeProvider>
            <View style={{ backgroundColor: theme.colors.surfaceContainer, flex: 1 }}>
                <ScrollView onScroll={onScroll}>
                    {[...new Array(100).keys()].map((_, i) => (
                        <Text key={i}>{i}</Text>
                    ))}
                </ScrollView>
                <AnimatedFAB
                    icon={'plus'}
                    label={'Label      '}
                    extended={isExtended}
                    onPress={() => console.log('Pressed')}
                    animateFrom={'right'}
                    iconMode={"dynamic"}
                    style={[styles.fabStyle]}

                />
            </View>
        </Material3ThemeProvider>
    );
}
const styles = StyleSheet.create({
    fabStyle: {
        bottom: 20,
        right: 20 ,
        position: 'absolute',
    },
});
