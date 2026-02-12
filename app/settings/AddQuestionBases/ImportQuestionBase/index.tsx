import { Material3ThemeProvider, useAppTheme } from '@/components/Material3ThemeProvider';
import { router } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { IconButton, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function ImportQuestionBase() {
    const theme = useAppTheme();



    return (
        <Material3ThemeProvider>
            <SafeAreaView>
                <View style={{ marginTop: 100, marginLeft: 5 , flexDirection: 'row',alignItems: 'center'}} >
                    <IconButton
                        icon="arrow-left"
                        onPress={() => router.back()}
                    />
                    <Text variant="headlineMedium" >选择添加题库的方式</Text>
                </View>

                <Text variant="titleMedium" style={{ marginTop: 30, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>手动</Text>
                <List.Item
                    title="使用题库创建向导"
                    description="使用图形化界面创建题库"
                    left={props => <List.Icon {...props} icon="application-import" style={{ transform: [{ scale: 0.85 }], marginLeft: 17 }} />}
                    onPress={() => router.push("/settings/AddQuestionBases/BuildQuestionBase")}
                />
                <Text variant="titleMedium" style={{ marginTop: 16, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>批量导入</Text>
                <List.Item
                    title="从Json导入"
                    description="将Json格式的题库文本导入到软件题库中"
                    left={props => <List.Icon {...props} icon="database-edit" />}
                />


            </SafeAreaView>
        </Material3ThemeProvider>
    );
}

