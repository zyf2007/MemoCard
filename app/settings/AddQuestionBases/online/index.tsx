import { SearchableListPage } from '@/components/ui/SearchableListPage';
import { OverflowMarqueeText } from '@/components/ui/OverflowMarqueeText';
import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { OnlineQuestionBaseCatalogItem, OnlineQuestionBaseRepositoryManager } from '@/scripts/onlineQuestionBases';
import { router } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { ActivityIndicator, Appbar, List, Text } from 'react-native-paper';

type CatalogRow =
  | {
      type: 'repo';
      repoId: string;
      repoName: string;
    }
  | {
      type: 'item';
      repoId: string;
      repoName: string;
      item: OnlineQuestionBaseCatalogItem;
    };

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

  const loadCatalog = React.useCallback(
    async (force: boolean) => {
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
    },
    [manager, refreshRepositories]
  );

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

  const rows = React.useMemo<CatalogRow[]>(() => {
    const nextRows: CatalogRow[] = [];
    for (const repo of repositories) {
      const repoItems = groupedItems.get(repo.id) || [];
      if (repoItems.length === 0) {
        continue;
      }
      nextRows.push({ type: 'repo', repoId: repo.id, repoName: repo.name });
      for (const item of repoItems) {
        nextRows.push({ type: 'item', repoId: repo.id, repoName: repo.name, item });
      }
    }
    return nextRows;
  }, [groupedItems, repositories]);

  const filterRows = React.useCallback((sourceRows: readonly CatalogRow[], query: string): readonly CatalogRow[] => {
    const repoOrder: string[] = [];
    const repoSections = new Map<string, { header: CatalogRow; items: CatalogRow[] }>();

    for (const row of sourceRows) {
      if (row.type === 'repo') {
        repoOrder.push(row.repoId);
        repoSections.set(row.repoId, { header: row, items: [] });
        continue;
      }

      const section = repoSections.get(row.repoId);
      if (section) {
        section.items.push(row);
      }
    }

    const result: CatalogRow[] = [];

    for (const repoId of repoOrder) {
      const section = repoSections.get(repoId);
      if (!section) {
        continue;
      }

      const matchedItems = section.items.filter((row) => {
        if (row.type !== 'item') {
          return false;
        }

        const { item, repoName } = row;
        return (
          item.baseName.toLowerCase().includes(query) ||
          (item.author || '').toLowerCase().includes(query) ||
          (item.description || '').toLowerCase().includes(query) ||
          repoName.toLowerCase().includes(query)
        );
      });

      if (matchedItems.length > 0) {
        result.push(section.header, ...matchedItems);
      }
    }

    return result;
  }, []);

  return (
    <Material3ThemeProvider>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SearchableListPage
          title="浏览在线题库"
          onBackPress={() => router.back()}
          data={rows}
          filterData={filterRows}
          searchPlaceholder="搜索题库名称、作者、描述..."
          searchLayoutMode="push"
          emptyText={loading ? '加载中...' : '暂无可用在线题库，请先刷新或在右上角管理仓库'}
          emptySearchText="未找到匹配的在线题库"
          actions={(
            <>
              <Appbar.Action icon="refresh" onPress={() => void loadCatalog(true)} />
              <Appbar.Action icon="cog" onPress={() => router.push('/settings/AddQuestionBases/online/repositories')} />
            </>
          )}
          renderItem={({ item: row }) => {
            if (row.type === 'repo') {
              return (
                <Text variant="labelLarge" style={{ marginTop: 4, marginHorizontal: 16, color: theme.colors.secondary }}>
                  {row.repoName}
                </Text>
              );
            }

            return (
              <List.Item
                title={row.item.baseName}
                description={() => {
                  const metadataText = `${row.item.author ? `作者：${row.item.author} · ` : ''}题目数：${row.item.questionCount}`;
                  return (
                    <View style={{ marginTop: 2, gap: 2 }}>
                      <View style={{ flexShrink: 1, minWidth: 0 }}>
                        <OverflowMarqueeText
                          text={metadataText}
                          style={[theme.fonts.bodyMedium, { color: theme.colors.onSurfaceVariant }]}
                          speed={36}
                          pauseDuration={900}
                        />
                      </View>
                      {row.item.description ? (
                        <View style={{ flexShrink: 1, minWidth: 0 }}>
                          <OverflowMarqueeText
                            text={row.item.description}
                            style={[theme.fonts.bodyMedium, { color: theme.colors.onSurfaceVariant }]}
                            speed={34}
                            pauseDuration={900}
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                }}
                left={(props) => <List.Icon {...props} icon="database-eye" />}
                onPress={() =>
                  router.push({
                    pathname: '/settings/AddQuestionBases/online/preview',
                    params: {
                      repoId: row.item.repoId,
                      itemId: row.item.id,
                    },
                  })
                }
              />
            );
          }}
          keyExtractor={(row) => {
            if (row.type === 'repo') {
              return `repo-${row.repoId}`;
            }
            return `${row.item.repoId}-${row.item.id}`;
          }}
          listHeaderComponent={
            <Text variant="titleSmall" style={{ marginTop: 12, marginHorizontal: 16, color: theme.colors.primary }}>
              在线题库
            </Text>
          }
          listFooterComponent={
            <View>
              {refreshing ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
              {errorMessage ? (
                <Text style={{ marginHorizontal: 16, marginTop: 12, color: theme.colors.error }}>
                  {errorMessage}
                </Text>
              ) : null}
            </View>
          }
          footerSpacerHeight={24}
        />
      </View>
    </Material3ThemeProvider>
  );
}
