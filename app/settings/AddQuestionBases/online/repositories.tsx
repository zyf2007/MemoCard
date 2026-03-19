import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { OnlineQuestionBaseRepositoryManager } from '@/scripts/onlineQuestionBases';
import { isHttpOrHttpsUrl } from '@/scripts/utils/url';
import { router } from 'expo-router';
import * as React from 'react';
import { OverflowMarqueeText } from '@/components/ui/OverflowMarqueeText';
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
  const [inputVersion, setInputVersion] = React.useState(0);

  const refreshRepositories = React.useCallback(async () => {
    await manager.ready();
    setRepositories(manager.getRepositories());
  }, [manager]);

  React.useEffect(() => {
    void refreshRepositories();
  }, [refreshRepositories]);

  const handleAddRepository = React.useCallback(async () => {
    if (!isHttpOrHttpsUrl(newRepoUrl)) {
      setErrorMessage('仓库地址必须是 http/https');
      return;
    }

    try {
      await manager.addRepository({
        repoUrl: newRepoUrl,
        name: newRepoName || undefined,
      });
      setNewRepoUrl('');
      setNewRepoName('');
      setInputVersion((prev) => prev + 1);
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
          <Appbar.Content
            title={(<View style={{ flexShrink: 1, minWidth: 0 }}><OverflowMarqueeText text="管理在线仓库" style={[theme.fonts.titleLarge, { color: theme.colors.onSurface }]} /></View>)}
          />
          <Appbar.Action
            icon="plus"
            onPress={() => {
              setErrorMessage(null);
              setAddDialogVisible(true);
            }}
          />
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
          <Dialog
            visible={addDialogVisible}
            onDismiss={() => {
              setErrorMessage(null);
              setAddDialogVisible(false);
            }}
          >
            <Dialog.Title>添加在线仓库</Dialog.Title>
            <Dialog.Content>
              <TextInput
                key={`repo-name-${inputVersion}`}
                label="显示名称（可选）"
                defaultValue={newRepoName}
                onChangeText={(text) => {
                  setNewRepoName(text);
                  if (errorMessage) {
                    setErrorMessage(null);
                  }
                }}
                style={{ marginBottom: 12 }}
              />
              <TextInput
                key={`repo-url-${inputVersion}`}
                label="仓库 URL"
                defaultValue={newRepoUrl}
                onChangeText={(text) => {
                  setNewRepoUrl(text);
                  if (errorMessage) {
                    setErrorMessage(null);
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errorMessage ? (
                <Text style={{ color: theme.colors.error, marginTop: 8 }}>{errorMessage}</Text>
              ) : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setErrorMessage(null);
                  setAddDialogVisible(false);
                }}
              >
                取消
              </Button>
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
