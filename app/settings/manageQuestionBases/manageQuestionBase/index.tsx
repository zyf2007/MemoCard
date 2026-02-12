import { Material3ThemeProvider, useAppTheme } from '@/components/Material3ThemeProvider';
import { QuestionBaseManager } from '@/scripts/questions';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { List } from 'react-native-paper';



export default function ManageQuestionBase() {
    const theme = useAppTheme();
    const params = useLocalSearchParams();
    const { baseName } = params;
    const questionBase = QuestionBaseManager.getInstance<QuestionBaseManager>().getQuestionBaseByName(Array.isArray(baseName) ? baseName[0] : baseName);
    

    return (
        <Material3ThemeProvider>
            <View style={{backgroundColor:theme.colors.surfaceContainer,flex:1}}>
                <ScrollView >

                    {questionBase?.questions.map((question, index) => {
                        return (
                            <List.Item
                                key={index}
                                title={question.text}
                                titleStyle={theme.fonts.titleLarge}
                                style={{marginBottom:-10}}
                                left={props => <List.Icon {...props} icon="playlist-check" style={{ transform: [{ scale: 1.5 }], marginLeft:22 }} />}
                                // right={() => (<View style={{ flexDirection: 'row',marginRight:-10 }}>
                                //     <IconButton icon="file-document-edit" mode="contained" onPress={() => console.log('Pressed')} />
                                //     <IconButton icon="file-remove" mode="contained" onPress={() => console.log('Pressed')} />
                                // </View>)
                                // }
                            />
                        )
                    })}



                </ScrollView>
                </View>
        </Material3ThemeProvider>
    );
}

