import { Material3ThemeProvider, useAppTheme } from '@/components/Material3ThemeProvider';
import { QuestionBaseManager } from '@/scripts/questions';
import { router } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { Button, Dialog, IconButton, List, Portal, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function AddQuestionBases() {
    const theme = useAppTheme();
    const [visible, setVisible] = React.useState(false);
    let createQuestionBaseName = "";

    return (
        <Material3ThemeProvider>
            <SafeAreaView>
                <View style={{ marginTop: 100, marginLeft: 5, flexDirection: 'row', alignItems: 'center' }} >
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
                    onPress={() => setVisible(true)}
                />
                <Text variant="titleMedium" style={{ marginTop: 16, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>批量导入</Text>
                <List.Item
                    title="从Json导入"
                    description="将Json格式的题库文本导入到软件题库中"
                    left={props => <List.Icon {...props} icon="database-edit" />}
                    onPress={() => router.push("/settings/AddQuestionBases/ImportQuestionBase")}
                />



                <Portal>
                    <Dialog visible={visible} onDismiss={() => { setVisible(false); console.log("dismiss") }}>
                        <Dialog.Icon icon="file-document-edit" />
                        <Dialog.Title >创建题库</Dialog.Title>

                        <Dialog.Content>
                            {/* <Text variant="bodyMedium">This is simple dialog</Text> */}
                            <TextInput
                                label="输入题库名称"
                                onChangeText={text => createQuestionBaseName = text}
                            />
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setVisible(false)}>Cancel</Button>
                            <Button onPress={() => { setVisible(false); createQuestionBase(createQuestionBaseName) }}>Ok</Button>
                        </Dialog.Actions>
                    </Dialog>

                </Portal>

            </SafeAreaView>
        </Material3ThemeProvider>
    );
}


function createQuestionBase(name: string) {
    QuestionBaseManager.getInstance().createQuestionBase(name);
    router.push({
        pathname: "/settings/manageQuestionBases/manageQuestionBase",
        params: { baseName: name },
    });
}
