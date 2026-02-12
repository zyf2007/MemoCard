import { Material3ThemeProvider, useAppTheme } from '@/components/Material3ThemeProvider';
import { QuestionBaseManager } from '@/scripts/questions';
import { router } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, Dialog, IconButton, List, Portal, Text } from 'react-native-paper';

export default function ManageQuestionBases() {
    const theme = useAppTheme();
    const [visible, setVisible] = React.useState(false);
    const [QuestionBaseName, setQuestionBaseName] = React.useState("");
    
    const [questionBaseList, setQuestionBaseList] = React.useState<string[]>([]);

    React.useEffect(() => {
        const manager = QuestionBaseManager.getInstance<QuestionBaseManager>();
        
        const updateList = () => {
            console.log("QuestionBaseListUpdated");
            setQuestionBaseName("");
            const newList = manager.getQuestionBaseNames() || [];
            setQuestionBaseList(Array.isArray(newList) ? newList : []);
        };

        updateList();

        const unsubscribe = manager.onQuestionBaseListUpdated.subscribe(updateList);

        // 页面卸载时取消订阅
        return () => {
            console.log("ManageQuestionBases: 取消订阅");
            unsubscribe();
        };
    }, []); 

    // 封装删除逻辑
    const handleDeleteConfirm = () => {
        setVisible(false);
        QuestionBaseManager.getInstance().deleteQuestionBase(QuestionBaseName);
    };

    return (
        <Material3ThemeProvider>
            <View style={{ backgroundColor: theme.colors.surfaceContainer, flex: 1 }}>
                <ScrollView>
                    {Array.isArray(questionBaseList) && questionBaseList.map((name, index) => {
                        return (
                            <List.Item
                                key={index} 
                                title={name}
                                titleStyle={theme.fonts.titleLarge}
                                style={{ marginBottom: -10 }}
                                left={props => (
                                    <List.Icon 
                                        {...props} 
                                        icon="playlist-check" 
                                        style={{ transform: [{ scale: 1.5 }], marginLeft: 22 }} 
                                    />
                                )}
                                right={() => (
                                    <View style={{ flexDirection: 'row', marginRight: -10 }}>
                                        <IconButton 
                                            icon="file-document-edit" 
                                            mode="contained" 
                                            onPress={() => router.push({
                                                pathname: '/settings/manageQuestionBases/manageQuestionBase',
                                                params: { baseName: name }
                                            })} 
                                        />
                                        <IconButton 
                                            icon="file-remove" 
                                            mode="contained" 
                                            onPress={() => {
                                                setQuestionBaseName(name);
                                                setVisible(true);
                                            }} 
                                        />
                                    </View>
                                )}
                            />
                        );
                    })}
                    
                    {Array.isArray(questionBaseList) && questionBaseList.length === 0 && (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={theme.fonts.bodyLarge}>暂无题库</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
            <Portal>
                <Dialog 
                    visible={visible} 
                    onDismiss={() => { 
                        setVisible(false); 
                        console.log("dismiss");
                    }}
                >
                    <Dialog.Icon icon="file-document-edit" />
                    <Dialog.Title>即将删除题库「{QuestionBaseName}」</Dialog.Title>
                    <Dialog.Content>
                        <Text>确认删除题库「{QuestionBaseName}」吗？</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setVisible(false)}>Cancel</Button>
                        <Button onPress={handleDeleteConfirm}>Ok</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </Material3ThemeProvider>
    );
}