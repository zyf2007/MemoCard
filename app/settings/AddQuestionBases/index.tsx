import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import DismissKeyboardView from '@/components/ui/DismissKeyboardView';
import { QuestionBaseManager } from '@/scripts/questions';
import { isHttpOrHttpsUrl } from '@/scripts/utils/url';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as React from 'react';
import { Alert, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, IconButton, List, Portal, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- 新增：创建题库函数 ---
async function createQuestionBase(name: string) {
  const questionBase = await QuestionBaseManager.getInstance().createQuestionBase(name);
  if (!questionBase) {
    Alert.alert('创建失败', '题库名称可能已存在或无效');
    return;
  }

  router.push({
    pathname: "/settings/manageQuestionBases/manageQuestionBase",
    params: { baseId: questionBase.baseId },
  });
}

export default function ImportQuestionBase() {
    const theme = useAppTheme();
    const [pasteDialogVisible, setPasteDialogVisible] = React.useState(false);
    const [urlDialogVisible, setUrlDialogVisible] = React.useState(false);
    const [createDialogVisible, setCreateDialogVisible] = React.useState(false); // 新增
    const [jsonText, setJsonText] = React.useState('');
    const [importUrl, setImportUrl] = React.useState('');
    const [newBaseName, setNewBaseName] = React.useState(''); // 新增
    const [importing, setImporting] = React.useState(false);

    const importByJsonText = React.useCallback(async (rawText: string) => {
        const text = rawText.trim();
        if (!text) {
            Alert.alert('导入失败', '请输入 JSON 文本');
            return;
        }

        setImporting(true);
        try {
            await QuestionBaseManager.getInstance().importQuestionBaseFromJson(text, {
                importedFrom: '剪贴板',
            });
        } finally {
            setImporting(false);
        }
    }, []);

    const importByLocalFile = React.useCallback(async () => {
        setImporting(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/json', 'text/json', 'text/plain'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled || !result.assets.length) {
                return;
            }

            const fileUri = result.assets[0].uri;
            const jsonContent = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.UTF8,
            });
            await QuestionBaseManager.getInstance().importQuestionBaseFromJson(jsonContent, {
                importedFrom: '本地文件',
            });
        } catch (error) {
            Alert.alert('导入失败', `读取文件失败：${(error as Error).message}`);
        } finally {
            setImporting(false);
        }
    }, []);

    const importByUrl = React.useCallback(async (rawUrl: string) => {
        const url = rawUrl.trim();
        if (!url) {
            Alert.alert('导入失败', '请输入链接');
            return;
        }
        if (!isHttpOrHttpsUrl(url)) {
            Alert.alert('导入失败', '仅支持 http 或 https 链接');
            return;
        }

        setImporting(true);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`请求失败（${response.status}）`);
            }
            const jsonContent = await response.text();
            await QuestionBaseManager.getInstance().importQuestionBaseFromJson(jsonContent, {
                importedFrom: '链接导入',
                subscriptionUrl: url,
                subscriptionLabel: url,
            });
        } catch (error) {
            Alert.alert('导入失败', `链接导入失败：${(error as Error).message}`);
        } finally {
            setImporting(false);
        }
    }, []);

    return (
        <Material3ThemeProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <View style={{ marginTop: 100, marginLeft: 5, flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton
                        icon="arrow-left"
                        onPress={() => router.back()}
                    />
                    <Text variant="headlineMedium">选择添加题库的方式</Text>
                </View>

                {/* 手动部分：替换为“使用题库创建向导” */}
                <Text variant="titleMedium" style={{ marginTop: 30, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>
                    手动
                </Text>
                <List.Item
                    title="使用题库创建向导"
                    description="使用图形化界面创建题库"
                    left={props => <List.Icon {...props} icon="application-import" style={{ transform: [{ scale: 0.85 }], marginLeft: 17 }} />}
                    onPress={() => setCreateDialogVisible(true)}
                />

                {/* 批量导入部分保持不变 */}
                <Text variant="titleMedium" style={{ marginTop: 16, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>
                    批量导入
                </Text>
                <List.Item
                    title="粘贴文本导入"
                    description="将Json格式的题库文本导入到软件题库中"
                    left={props => <List.Icon {...props} icon="database-edit" />}
                    onPress={() => setPasteDialogVisible(true)}
                />
                <List.Item
                    title="从本地 JSON 文件导入"
                    description="从设备中选择 JSON 文件进行导入"
                    left={props => <List.Icon {...props} icon="file-document-outline" />}
                    onPress={() => void importByLocalFile()}
                />
                <List.Item
                    title="从链接导入"
                    description="通过 http/https 链接下载 JSON 并导入"
                    left={props => <List.Icon {...props} icon="link-variant" />}
                    onPress={() => setUrlDialogVisible(true)}
                />

                <Text variant="titleMedium" style={{ marginTop: 16, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>
                    在线导入
                </Text>
                <List.Item
                    title="浏览在线题库"
                    description="从在线仓库浏览、预览并导入题库"
                    left={props => <List.Icon {...props} icon="cloud-search-outline" />}
                    onPress={() => router.push('/settings/AddQuestionBases/online')}
                />

                {/* 创建题库对话框 */}
                <Portal>
                    <Dialog
                        visible={createDialogVisible}
                        onDismiss={() => {
                            if (importing) return;
                            setCreateDialogVisible(false);
                            setNewBaseName('');
                        }}
                    >
                        <Dialog.Icon icon="file-document-edit" />
                        <Dialog.Title>创建题库</Dialog.Title>
                        <Dialog.Content>
                            <DismissKeyboardView>
                                <TextInput
                                    label="输入题库名称"
                                    value={newBaseName}
                                    onChangeText={setNewBaseName}
                                />
                            </DismissKeyboardView>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button
                                onPress={() => {
                                    setCreateDialogVisible(false);
                                    setNewBaseName('');
                                }}
                                disabled={importing}
                            >
                                取消
                            </Button>
                            <Button
                                onPress={() => {
                                    void createQuestionBase(newBaseName);
                                    setCreateDialogVisible(false);
                                    setNewBaseName('');
                                }}
                                disabled={importing || !newBaseName.trim()}
                            >
                                创建
                            </Button>
                        </Dialog.Actions>
                    </Dialog>

                    {/* 粘贴导入对话框 */}
                    <Dialog
                        visible={pasteDialogVisible}
                        onDismiss={() => {
                            if (importing) return;
                            setPasteDialogVisible(false);
                            setJsonText('');
                        }}
                    >
                        <Dialog.Icon icon="database-edit" />
                        <Dialog.Title>粘贴 JSON 文本</Dialog.Title>
                        <Dialog.Content>
                            <DismissKeyboardView>
                                <TextInput
                                    label="JSON 文本"
                                    value={jsonText}
                                    onChangeText={setJsonText}
                                    multiline
                                    style={{ maxHeight: 360 }}
                                />
                            </DismissKeyboardView>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button
                                onPress={() => {
                                    setPasteDialogVisible(false);
                                    setJsonText('');
                                }}
                                disabled={importing}
                            >
                                取消
                            </Button>
                            <Button
                                onPress={() => {
                                    void importByJsonText(jsonText);
                                    setPasteDialogVisible(false);
                                    setJsonText('');
                                }}
                                disabled={importing}
                            >
                                导入
                            </Button>
                        </Dialog.Actions>
                    </Dialog>

                    {/* 链接导入对话框 */}
                    <Dialog
                        visible={urlDialogVisible}
                        onDismiss={() => {
                            if (importing) return;
                            setUrlDialogVisible(false);
                            setImportUrl('');
                        }}
                    >
                        <Dialog.Icon icon="link-variant" />
                        <Dialog.Title>从链接导入 JSON</Dialog.Title>
                        <Dialog.Content>
                            <DismissKeyboardView>
                                <TextInput
                                    label="JSON 链接（http/https）"
                                    value={importUrl}
                                    onChangeText={setImportUrl}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </DismissKeyboardView>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button
                                onPress={() => {
                                    setUrlDialogVisible(false);
                                    setImportUrl('');
                                }}
                                disabled={importing}
                            >
                                取消
                            </Button>
                            <Button
                                onPress={() => {
                                    void importByUrl(importUrl);
                                    setUrlDialogVisible(false);
                                    setImportUrl('');
                                }}
                                disabled={importing}
                            >
                                导入
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

                {importing ? (
                    <View style={{ marginTop: 16, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator />
                        <Text style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>导入中，请稍候...</Text>
                    </View>
                ) : null}
            </SafeAreaView>
        </Material3ThemeProvider>
    );
}
