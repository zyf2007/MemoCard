import { OverflowMarqueeText } from '@/components/ui/OverflowMarqueeText';
import { useAppTheme } from '@/hooks/Material3ThemeProvider';
import * as React from 'react';
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { Appbar, Searchbar, Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

type SearchableListPageProps<T> = {
  title: string;
  data: readonly T[];
  filterItem?: (item: T, normalizedQuery: string) => boolean;
  filterData?: (data: readonly T[], normalizedQuery: string) => readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  onBackPress?: () => void;
  actions?: React.ReactNode;
  showSearchAction?: boolean;
  searchActionFirst?: boolean;
  searchPlaceholder?: string;
  searchLayoutMode?: 'push' | 'overlay';
  emptyText?: string;
  emptySearchText?: string;
  listRef?: React.RefObject<FlatList<T> | null>;
  containerStyle?: StyleProp<ViewStyle>;
  listContainerStyle?: StyleProp<ViewStyle>;
  listContentContainerStyle?: StyleProp<ViewStyle>;
  footerSpacerHeight?: number;
  listHeaderComponent?: React.ReactElement | null;
  listFooterComponent?: React.ReactElement | null;
  extraFlatListProps?: Omit<
    FlatListProps<T>,
    'data' | 'renderItem' | 'keyExtractor' | 'ListEmptyComponent' | 'contentContainerStyle'
  >;
  onSearchQueryChange?: (query: string) => void;
};

export function SearchableListPage<T>({
  title,
  data,
  filterItem,
  filterData,
  renderItem,
  keyExtractor,
  onBackPress,
  actions,
  showSearchAction = true,
  searchActionFirst = true,
  searchPlaceholder = '搜索...',
  searchLayoutMode = 'push',
  emptyText = '暂无数据',
  emptySearchText = '未找到匹配结果',
  listRef,
  containerStyle,
  listContainerStyle,
  listContentContainerStyle,
  footerSpacerHeight = 0,
  listHeaderComponent,
  listFooterComponent,
  extraFlatListProps,
  onSearchQueryChange,
}: SearchableListPageProps<T>) {
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const searchHeight = useSharedValue(0);
  const searchOpacity = useSharedValue(0);
  const searchTranslateY = useSharedValue(-12);

  const normalizedQuery = React.useMemo(() => searchQuery.toLowerCase().trim(), [searchQuery]);
  const filteredData = React.useMemo(() => {
    if (!normalizedQuery) {
      return data;
    }
    if (filterData) {
      return filterData(data, normalizedQuery);
    }
    if (filterItem) {
      return data.filter((item) => filterItem(item, normalizedQuery));
    }
    return data;
  }, [data, filterData, filterItem, normalizedQuery]);

  const clearSearch = React.useCallback(() => {
    setSearchQuery('');
    onSearchQueryChange?.('');
  }, [onSearchQueryChange]);

  const handleSearchPressed = React.useCallback(() => {
    setIsSearchExpanded((prev) => {
      if (prev) {
        clearSearch();
      }
      return !prev;
    });
  }, [clearSearch]);

  React.useEffect(() => {
    if (isSearchExpanded) {
      searchHeight.value = withTiming(56, { duration: 200 });
      searchTranslateY.value = withTiming(0, { duration: 220 });
      searchOpacity.value = withDelay(140, withTiming(1, { duration: 150 }));
      return;
    }

    searchOpacity.value = withTiming(0, { duration: 120 });
    searchTranslateY.value = withTiming(-12, { duration: 160 });
    searchHeight.value = withDelay(80, withTiming(0, { duration: 180 }));
  }, [isSearchExpanded, searchHeight, searchOpacity, searchTranslateY]);

  const animatedSearchContainerStyle = useAnimatedStyle(() => ({
    height: searchHeight.value,
    opacity: searchOpacity.value,
    transform: [{ translateY: searchTranslateY.value }],
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  }));

  const searchAction = showSearchAction ? (
    <Appbar.Action
      key="search-action"
      icon="magnify"
      onPress={handleSearchPressed}
      color={theme.colors.onSurface}
    />
  ) : null;

  return (
    <View style={[{ flex: 1, backgroundColor: theme.colors.background }, containerStyle]}>
      <Appbar.Header mode="small">
        {onBackPress ? <Appbar.BackAction onPress={onBackPress} /> : null}
        <Appbar.Content
          title={(
            <View style={{ flexShrink: 1, minWidth: 0 }}>
              <OverflowMarqueeText
                text={title}
                style={[theme.fonts.titleLarge, { color: theme.colors.onSurface }]}
              />
            </View>
          )}
        />
        {searchActionFirst ? searchAction : null}
        {actions}
        {!searchActionFirst ? searchAction : null}
      </Appbar.Header>

      <Animated.View
        pointerEvents={isSearchExpanded ? 'auto' : 'none'}
        style={[
          animatedSearchContainerStyle,
          searchLayoutMode === 'overlay'
            ? {
                position: 'absolute',
                top: 64,
                left: 0,
                right: 0,
                zIndex: 20,
              }
            : null,
        ]}
      >
        <Searchbar
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChangeText={(query) => {
            setSearchQuery(query);
            onSearchQueryChange?.(query);
          }}
          onClearIconPress={clearSearch}
          style={{ backgroundColor: 'transparent' }}
          inputStyle={{ color: theme.colors.onSurface }}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          iconColor={theme.colors.onSurfaceVariant}
          elevation={0}
          mode="bar"
          autoFocus={isSearchExpanded}
        />
      </Animated.View>

      <View style={[{ flex: 1, backgroundColor: theme.colors.surfaceContainer }, listContainerStyle]}>
        <FlatList
          ref={listRef}
          data={filteredData as T[]}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[{ flexGrow: 1 }, listContentContainerStyle]}
          ListEmptyComponent={(
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 16, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {normalizedQuery ? emptySearchText : emptyText}
              </Text>
            </View>
          )}
          ListHeaderComponent={listHeaderComponent}
          ListFooterComponent={(
            <>
              {listFooterComponent}
              {footerSpacerHeight > 0 ? <View style={{ height: footerSpacerHeight }} /> : null}
            </>
          )}
          {...extraFlatListProps}
        />
      </View>
    </View>
  );
}
