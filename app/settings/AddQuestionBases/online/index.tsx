import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { OnlineQuestionBaseCatalogItem, OnlineQuestionBaseRepositoryManager } from '@/scripts/onlineQuestionBases';
import { router } from 'expo-router';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Dialog, IconButton, List, Portal, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnlineQuestionBaseCatalogPage() {
  const theme = useAppTheme();
  const manager = React.useMemo(() => OnlineQuestionBaseRepositoryManager.getInstance(), []);
  const [items, setItems] = React.useState<OnlineQuestionBaseCatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [addDialogVisible, setAddDialogVisible] = React.useState(false);
  const [newRepoUrl, setNewRepoUrl] = React.useState('');
  const [newRepoName, setNewRepoName] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [repositories, setRepositories] = React.useState(manager.getRepositories());

  const refreshRepositories = React.useCallback(() => {
    setRepositories(manager.getRepositories());
  }, [manager]);

  const loadCatalog = React.useCallback(async (force: boolean) => {
    if (force) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      await manager.ready();
      const cached = manager.getCatalogFromCache();
      if (!force && cached.length > 0) {
        setItems(cached);
        setErrorMessage(null);
        return;
      }

      const result = await manager.fetchCatalog({ force });
      setItems(result.items);
      setErrorMessage(result.errors.length > 0 ? result.errors.join('\n') : null);
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      refreshRepositories();
    }
  }, [manager, refreshRepositories]);

  React.useEffect(() => {
    void loadCatalog(false);
  }, [loadCatalog]);

  const groupedItems = React.useMemo(() => {
    const map = new Map<string, OnlineQuestionBaseCatalogItem[]>();
    for (const item of items) {
      const current = map.get(item.repoId) || [];
      current.push(item);
      map.set(item.repoId, current);
    }
    return map;
  }, [items]);

  const handleAddRepository = React.useCallback(async () => {
    try {
      await manager.addRepository({
        repoUrl: newRepoUrl,
        name: newRepoName || undefined,
      });
      setNewRepoUrl('');
      setNewRepoName('');
      setAddDialogVisible(false);
      refreshRepositories();
      await loadCatalog(true);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  }, [loadCatalog, manager, newRepoName, newRepoUrl, refreshRepositories]);

  const handleRemoveRepository = React.useCallback(async (repoId: string) => {
    await manager.removeRepository(repoId);
    refreshRepositories();
    const cached = manager.getCatalogFromCache();
    setItems(cached);
  }, [manager, refreshRepositories]);

  return (
    <Material3ThemeProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Appbar.Header mode="small">
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="浏览在线题库" />
          <Appbar.Action icon="refresh" onPress={() => void loadCatalog(true)} />
          <Appbar.Action icon="plus" onPress={() => setAddDialogVisible(true)} />
        </Appbar.Header>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text variant="titleSmall" style={{ marginTop: 12, marginHorizontal: 16, color: theme.colors.primary }}>
              仓库
            </Text>
            {repositories.map((repo) => (
              <List.Item
                key={repo.id}
                title={repo.name}
                description={`${repo.repoUrl} (${repo.branch})`}
                left={(props) => <List.Icon {...props} icon="source-repository" />}
                right={() =>
                  repositories.length > 1 ? (
                    <IconButton
                      icon="delete-outline"
                      onPress={() => void handleRemoveRepository(repo.id)}
                    />
                  ) : null
                }
              />
            ))}

            <Text variant="titleSmall" style={{ marginTop: 12, marginHorizontal: 16, color: theme.colors.primary }}>
              在线题库
            </Text>
            {items.length === 0 ? (
              <Text style={{ marginHorizontal: 16, marginTop: 8, color: theme.colors.onSurfaceVariant }}>
                暂无可用在线题库，请先刷新或添加仓库
              </Text>
            ) : (
              repositories.map((repo) => {
                const repoItems = groupedItems.get(repo.id) || [];
                if (repoItems.length === 0) {
                  return null;
                }
                return (
                  <View key={repo.id} style={{ marginTop: 4 }}>
                    <Text variant="labelLarge" style={{ marginHorizontal: 16, color: theme.colors.secondary }}>
                      {repo.name}
                    </Text>
                    {repoItems.map((item) => (
                      <List.Item
                        key={`${item.repoId}-${item.id}`}
                        title={item.baseName}
                        description={`${item.author ? `作者：${item.author} · ` : ''}题目数：${item.questionCount}${item.description ? `\n${item.description}` : ''}`}
                        left={(props) => <List.Icon {...props} icon="database-eye" />}
                        onPress={() =>
                          router.push({
                            pathname: '/settings/AddQuestionBases/online/preview',
                            params: {
                              repoId: item.repoId,
                              itemId: item.id,
                            },
                          })
                        }
                      />
                    ))}
                  </View>
                );
              })
            )}

            {refreshing ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
            {errorMessage ? (
              <Text style={{ marginHorizontal: 16, marginTop: 12, color: theme.colors.error }}>
                {errorMessage}
              </Text>
            ) : null}
          </ScrollView>
        )}

        <Portal>
          <Dialog visible={addDialogVisible} onDismiss={() => setAddDialogVisible(false)}>
            <Dialog.Title>添加在线仓库</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="仓库 URL（GitHub）"
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
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setAddDialogVisible(false)}>取消</Button>
              <Button
                onPress={() => void handleAddRepository()}
                disabled={!newRepoUrl.trim()}
              >
                添加
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </Material3ThemeProvider>
  );
}
