import { QuestionBaseItem } from '@/components/QuestionManage/QuestionBaseManage/QuestionBaseListItem';
import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { QuestionBaseManager } from '@/scripts/questions';
import * as React from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Dialog, Portal, Text } from 'react-native-paper';


export default function ManageQuestionBases() {
    const theme = useAppTheme();
    const [deleteDialogVisible, setDeleteDialogVisible] = React.useState(false);
    const [QuestionBaseName, setQuestionBaseName] = React.useState("");
    const [questionBaseList, setQuestionBaseList] = React.useState<string[]>([]);
    const questionBaseManager = QuestionBaseManager.getInstance<QuestionBaseManager>();
    React.useEffect(() => {
        const updateList = () => {
            console.log("QuestionBaseListUpdated");
            setQuestionBaseName("");
            const newList = questionBaseManager.getQuestionBaseNames() || [];
            setQuestionBaseList(Array.isArray(newList) ? newList : []);
        };
        updateList();
        return questionBaseManager.onQuestionBaseListUpdated.subscribe(updateList);
    }, [questionBaseManager]);

    const handleDeleteConfirm = () => {
        setDeleteDialogVisible(false);
        questionBaseManager.deleteQuestionBase(QuestionBaseName);
    };

    const handleItemDeletePress = (name: string) => {
        setQuestionBaseName(name);
        setDeleteDialogVisible(true);
    };

    return (
        <Material3ThemeProvider>
            <View style={{ backgroundColor: theme.colors.surfaceContainer, flex: 1 }}>
                <ScrollView>
                    {Array.isArray(questionBaseList) &&
                        (questionBaseList.length === 0 ?
                            (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={theme.fonts.bodyLarge}>暂无题库</Text>
                                </View>
                            )
                            : questionBaseList.map((name) => (
                                <QuestionBaseItem
                                    key={name}
                                    name={name}
                                    theme={theme}
                                    onDeletePress={() => handleItemDeletePress(name)}
                                />
                            ))
                        )
                    }


                </ScrollView>
            </View>
            <Portal>
                <Dialog
                    visible={deleteDialogVisible}
                    onDismiss={() => {
                        setDeleteDialogVisible(false);
                        console.log("dismiss");
                    }}
                    style={{ marginTop: -60 }}
                >
                    <Dialog.Icon icon="file-document-edit" />
                    <Dialog.Title>即将删除题库「{QuestionBaseName}」</Dialog.Title>
                    <Dialog.Content>
                        <Text>确认删除题库「{QuestionBaseName}」吗？</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
                        <Button onPress={handleDeleteConfirm}>Ok</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </Material3ThemeProvider>
    );
}