import { Material3ThemeProvider, useAppTheme } from '@/components/Material3ThemeProvider';
import { QuestionBaseManager } from '@/scripts/questions';
import { router } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { Button, Dialog, IconButton, List, Portal, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function AddQuestionBases() {
    const theme = useAppTheme();
    const [CreateBaseVisible, setCreateBaseVisible] = React.useState(false);
    const [importBaseVisible, setImportBaseVisible] = React.useState(false);
    const [dialogText, setDialogText] = React.useState("");

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

                <Text
                    variant="titleMedium"
                    style={{ marginTop: 30, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}
                >
                    手动
                </Text>

                <List.Item
                    title="使用题库创建向导"
                    description="使用图形化界面创建题库"
                    left={
                        props => <List.Icon
                        {...props}
                        icon="application-import"
                        style={{ transform: [{ scale: 0.85 }], marginLeft: 17 }}
                        />
                    }
                    onPress={() => setCreateBaseVisible(true)}
                />

                <Text
                    variant="titleMedium"
                    style={{ marginTop: 16, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}
                >
                    批量导入
                </Text>

                <List.Item
                    title="从Json导入"
                    description="将Json格式的题库文本导入到软件题库中"
                    left={props => <List.Icon {...props} icon="database-edit" />}
                    onPress={() => setImportBaseVisible(true)}
                />

                <Portal>
                    <Dialog
                        visible={CreateBaseVisible}
                        onDismiss={() => { setCreateBaseVisible(false); console.log("dismiss") }}
                        style={{ marginTop: -10 }}
                    >
                        <Dialog.Icon icon="file-document-edit" />
                        <Dialog.Title >创建题库</Dialog.Title>

                        <Dialog.Content>
                            <TextInput
                                label="输入题库名称"
                                onChangeText={text => setDialogText(text)}
                            />
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setCreateBaseVisible(false)}>Cancel</Button>
                            <Button onPress={() => { setCreateBaseVisible(false); createQuestionBase(dialogText) }}>Ok</Button>
                        </Dialog.Actions>
                    </Dialog>
                    <Dialog
                        visible={importBaseVisible}
                        onDismiss={() => { setImportBaseVisible(false);  setDialogText("") }}
                        style={{ marginTop: -10 }}
                    >
                        <Dialog.Icon icon="file-document-edit" />
                        <Dialog.Title >导入题库</Dialog.Title>

                        <Dialog.Content>
                            <TextInput
                                label="输入 Json 文本"
                                onChangeText={text => setDialogText(text)}
                            />
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => { setImportBaseVisible(false); setDialogText("") } }>Cancel</Button>
                            <Button onPress={() => { setImportBaseVisible(false); importQuestionBase(dialogText) }}>Ok</Button>
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
function importQuestionBase(jsonText: string) {
    QuestionBaseManager.getInstance().importQuestionBaseFromJson(jsonText);
}
