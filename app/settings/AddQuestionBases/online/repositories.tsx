import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { OnlineQuestionBaseRepositoryManager } from '@/scripts/onlineQuestionBases';
import { router } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { Appbar, Button, Dialog, IconButton, List, Portal, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnlineRepositoryManagePage() {
  const theme = useAppTheme();
  const manager = React.useMemo(() => OnlineQuestionBaseRepositoryManager.getInstance(), []);
  const [repositories, setRepositories] = React.useState(manager.getRepositories());
  const [addDialogVisible, setAddDialogVisible] = React.useState(false);
  const [newRepoUrl, setNewRepoUrl] = React.useState('');
  const [newRepoName, setNewRepoName] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const refreshRepositories = React.useCallback(async () => {
    await manager.ready();
    setRepositories(manager.getRepositories());
  }, [manager]);

  React.useEffect(() => {
    void refreshRepositories();
  }, [refreshRepositories]);

  const handleAddRepository = React.useCallback(async () => {
    try {
      await manager.addRepository({
        repoUrl: newRepoUrl,
        name: newRepoName || undefined,
      });
      setNewRepoUrl('');
      setNewRepoName('');
      setAddDialogVisible(false);
      setErrorMessage(null);
      await refreshRepositories();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }, [manager, newRepoName, newRepoUrl, refreshRepositories]);

  const handleRemoveRepository = React.useCallback(async (repoId: string) => {
    await manager.removeRepository(repoId);
    await refreshRepositories();
  }, [manager, refreshRepositories]);

  return (
    <Material3ThemeProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Appbar.Header mode="small">
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="管理在线仓库" />
          <Appbar.Action icon="plus" onPress={() => setAddDialogVisible(true)} />
        </Appbar.Header>
        <View style={{ flex: 1 }}>
          {repositories.map((repo) => (
            <List.Item
              key={repo.id}
              title={repo.name}
              description={`${repo.repoUrl} (${repo.branch})`}
              left={(props) => <List.Icon {...props} icon="source-repository" />}
              right={() => (
                <IconButton
                  icon="delete-outline"
                  onPress={() => void handleRemoveRepository(repo.id)}
                />
              )}
            />
          ))}
        </View>

        <Portal>
          <Dialog visible={addDialogVisible} onDismiss={() => setAddDialogVisible(false)}>
            <Dialog.Title>添加在线仓库</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="仓库 URL"
                value={newRepoUrl}
                onChangeText={setNewRepoUrl}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ marginBottom: 12 }}
              />
              <TextInput
                label="显示名称（可选）"
                value={newRepoName}
                onChangeText={setNewRepoName}
              />
              {errorMessage ? (
                <Text style={{ color: theme.colors.error, marginTop: 8 }}>{errorMessage}</Text>
              ) : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setAddDialogVisible(false)}>取消</Button>
              <Button onPress={() => void handleAddRepository()} disabled={!newRepoUrl.trim()}>
                添加
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </Material3ThemeProvider>
  );
}
