import { Material3ThemeProvider, useAppTheme } from '@/components/Material3ThemeProvider';
import { QuestionBaseManager } from '@/scripts/questions';
import * as React from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { IconButton, List } from 'react-native-paper';



export default function TabViewExample() {
    const theme = useAppTheme();



    return (
        <Material3ThemeProvider>
            <View style={{backgroundColor:theme.colors.surfaceContainer,flex:1}}>
                <ScrollView >

                    {QuestionBaseManager.getInstance<QuestionBaseManager>().getQuestionBaseNames().map((name, index) => {
                        return (
                            <List.Item
                                key={index}
                                title={name}
                                titleStyle={theme.fonts.titleLarge}
                                style={{marginBottom:-10}}
                                left={props => <List.Icon {...props} icon="playlist-check" style={{ transform: [{ scale: 1.5 }], marginLeft:22 }} />}
                                right={() => (<View style={{ flexDirection: 'row',marginRight:-10 }}>
                                    <IconButton icon="file-document-edit" mode="contained" onPress={() => console.log('Pressed')} />
                                    <IconButton icon="file-remove" mode="contained" onPress={() => console.log('Pressed')} />
                                </View>)
                                }
                            />
                        )
                    })}



                </ScrollView>
                </View>
        </Material3ThemeProvider>
    );
}

