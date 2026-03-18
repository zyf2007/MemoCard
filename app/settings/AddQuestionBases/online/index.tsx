import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { OnlineQuestionBaseCatalogItem, OnlineQuestionBaseRepositoryManager } from '@/scripts/onlineQuestionBases';
import { router } from 'expo-router';
import * as React from 'react';
import { OverflowMarqueeText } from '@/components/ui/OverflowMarqueeText';
import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Appbar, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnlineQuestionBaseCatalogPage() {
  const theme = useAppTheme();
  const manager = React.useMemo(() => OnlineQuestionBaseRepositoryManager.getInstance(), []);
  const [items, setItems] = React.useState<OnlineQuestionBaseCatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
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

  return (
    <Material3ThemeProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Appbar.Header mode="small">
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content
            title={(<View style={{ flexShrink: 1, minWidth: 0 }}><OverflowMarqueeText text="浏览在线题库" style={[theme.fonts.titleLarge, { color: theme.colors.onSurface }]} /></View>)}
          />
          <Appbar.Action icon="refresh" onPress={() => void loadCatalog(true)} />
          <Appbar.Action icon="cog" onPress={() => router.push('/settings/AddQuestionBases/online/repositories')} />
        </Appbar.Header>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
            <Text variant="titleSmall" style={{ marginTop: 12, marginHorizontal: 16, color: theme.colors.primary }}>
              在线题库
            </Text>
            {items.length === 0 ? (
              <Text style={{ marginHorizontal: 16, marginTop: 8, color: theme.colors.onSurfaceVariant }}>
                暂无可用在线题库，请先刷新或在右上角管理仓库
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
      </SafeAreaView>
    </Material3ThemeProvider>
  );
}
