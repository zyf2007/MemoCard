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
    const [selectedBase, setSelectedBase] = React.useState<{ id: string; name: string } | null>(null);
    const [questionBaseList, setQuestionBaseList] = React.useState<Array<{ id: string; name: string; meta: { author?: string; importedFrom?: string; subscriptionLabel?: string } }>>([]);
    const questionBaseManager = QuestionBaseManager.getInstance<QuestionBaseManager>();

    React.useEffect(() => {
        const updateList = async () => {
            await questionBaseManager.ready();
            console.log("[QuestionBasesManage] QuestionBaseListUpdated");
            setSelectedBase(null);
            setQuestionBaseList(questionBaseManager.getQuestionBaseList());
        };

        void updateList();
        return questionBaseManager.onQuestionBaseListUpdated.on(() => {
            void updateList();
        });
    }, [questionBaseManager]);

    const handleDeleteConfirm = () => {
        setDeleteDialogVisible(false);
        if (selectedBase) {
            void questionBaseManager.deleteQuestionBase(selectedBase.id);
        }
    };

    const handleItemDeletePress = (base: { id: string; name: string }) => {
        setSelectedBase(base);
        setDeleteDialogVisible(true);
    };

    const buildMetaText = (base: { meta: { author?: string; importedFrom?: string; subscriptionLabel?: string } }) => {
        const metaParts: string[] = [];
        if (base.meta.author) {
            metaParts.push(`作者：${base.meta.author}`);
        }
        if (base.meta.importedFrom) {
            metaParts.push(`来源：${base.meta.importedFrom}`);
        }
        if (base.meta.subscriptionLabel) {
            metaParts.push(`订阅：${base.meta.subscriptionLabel}`);
        }
        return metaParts.length > 0 ? metaParts.join(" · ") : undefined;
    };

    return (
        <Material3ThemeProvider>
            <View style={{ backgroundColor: theme.colors.surfaceContainer, flex: 1 }}>
                <ScrollView >
                    {Array.isArray(questionBaseList) &&
                        (questionBaseList.length === 0 ?
                            (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={theme.fonts.bodyLarge}>暂无题库</Text>
                                </View>
                            )
                            : questionBaseList.map((base) => (
                                <QuestionBaseItem
                                    key={base.id}
                                    id={base.id}
                                    name={base.name}
                                    metaText={buildMetaText(base)}
                                    theme={theme}
                                    onDeletePress={() => handleItemDeletePress(base)}
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
                    <Dialog.Title>即将删除题库「{selectedBase?.name ?? ""}」</Dialog.Title>
                    <Dialog.Content>
                        <Text>确认删除题库「{selectedBase?.name ?? ""}」吗？</Text>
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
