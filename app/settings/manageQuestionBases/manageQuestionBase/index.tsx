// index.tsx
import { EditQuestionDialog } from '@/components/QuestionManage/QuestionBaseManage/EditChoiceQuestionDialog';
import { QuestionListItem } from '@/components/QuestionManage/QuestionList/QuestionListItem';
import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { ChoiceQuestion, FillingQuestion, Question, QuestionBaseManager } from '@/scripts/questions';
import { useScrollToTop } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { AnimatedFAB, Appbar, Searchbar, Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
// 选择题列表项目组件（保留 memo 优化）
const MemoizedQuestionItem = React.memo(QuestionListItem);

export default function ImportQuestionBase() {
  const theme = useAppTheme();
  // 编辑题目弹窗状态
  const [dialogVisible, setDialogVisible] = React.useState(false);
  // 选中的题目 用来传给编辑题目的弹窗
  const [selectedQuestion, setSelectedQuestion] = React.useState<Question | null>(null);
  // 右下角按钮折叠
  const [fabExtended, setFabExtended] = React.useState(true);
  const params = useLocalSearchParams();
  const { baseName } = params;
  
  // 原始题目列表
  const [allQuestions, setAllQuestions] = React.useState<Question[]>([]);
  // 筛选后的题目列表（用于渲染）
  const [filteredQuestions, setFilteredQuestions] = React.useState<Question[]>([]);
  // 搜索关键词
  const [searchQuery, setSearchQuery] = React.useState('');
  // 搜索框展开/收起状态
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);

  const searchHeight = useSharedValue(0);

  const flatListRef = React.useRef<FlatList<Question>>(null);
  useScrollToTop(flatListRef);

  const questionBase = React.useMemo(() => {
    if (!baseName) return null;
    const name = Array.isArray(baseName) ? baseName[0] : baseName;
    return QuestionBaseManager.getInstance<QuestionBaseManager>().getQuestionBaseByName(name);
  }, [baseName]);

  // 刷新题目列表
  const refreshQuestionList = React.useCallback(() => {
    if (questionBase) {
      const questions = [...questionBase.questions];
      setAllQuestions(questions);
      setFilteredQuestions(questions);
    }
  }, [questionBase]);

  // 初始化和订阅 [题库更新→刷新列表] 事件
  React.useEffect(() => {
    refreshQuestionList();
    const unsubscribe = questionBase?.onQuestionListUpdated.subscribe(refreshQuestionList);
    return () => {
      console.log('[QuestionBaseManage] Backend unsubscribed');
      unsubscribe?.();
    };
  }, [questionBase, refreshQuestionList]);

  // 搜索筛选逻辑
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredQuestions(allQuestions);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    const filtered = allQuestions.filter(question => {
      // 搜索题目文本
      if (question.text.toLowerCase().includes(lowerCaseQuery)) {
        return true;
      }
      // 搜索选择题选项内容
      if (question instanceof ChoiceQuestion) {
        return question.choices.some(choice =>
          choice.toLowerCase().includes(lowerCaseQuery)
        );
      }
      // 搜索填空题答案
      if (question instanceof FillingQuestion) {
        return question.correctAnswer.toLowerCase().includes(lowerCaseQuery);
      }
      return false;
    });

    setFilteredQuestions(filtered);
  }, [searchQuery, allQuestions]);

  // 搜索框高度动画
  React.useEffect(() => {
    const toValue = isSearchExpanded ? -8 : -56; // 搜索框高度
    searchHeight.value = withTiming(toValue, { duration: 200 });
  }, [isSearchExpanded, searchHeight]);

  // 处理滚动时右下角按钮的折叠
  const onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { nativeEvent } = event;
    const currentScrollY = nativeEvent.contentOffset.y;
    const isScrollingUp = (nativeEvent.velocity?.y ?? 0) <= 0;
    const isTop = currentScrollY <= 0;
    const isBottom = currentScrollY >= (nativeEvent.contentSize?.height ?? 0) - (nativeEvent.layoutMeasurement?.height ?? 0);
    setFabExtended(isScrollingUp || isTop || isBottom);
  }, []);

  // 处理创建/编辑题目
  const handleCreateConfirm = React.useCallback(async (question: Question) => {
    if (!questionBase) return;

    if (question instanceof ChoiceQuestion || question instanceof FillingQuestion) {

      await questionBase.addQuestion(question);
    }
  }, [questionBase, selectedQuestion]);

  // 封装删除题目逻辑
  const handleDeleteConfirm = React.useCallback((questionId: string) => {
    console.log(questionId + " deleted");
    questionBase?.removeQuestionById(questionId);
  }, [questionBase]);

  const handleEditPress = React.useCallback((question: Question) => {

    setSelectedQuestion((prev) => {
      setDialogVisible(true);
      return question;
    });

  }, []);

  // 清空搜索框
  const clearSearch = () => {
    setSearchQuery('');
  };

  // 处理搜索图标点击事件
  const handleSearchPressed = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      clearSearch();
    }
  };

  // 创建搜索框折叠动画样式
  const animatedSearchContainerStyle = useAnimatedStyle(() => {
    return {
      marginTop: searchHeight.value,
      height: 56,
      backgroundColor: theme.colors.surfaceContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      overflow: 'hidden',
    };
  });



  return (
    <Material3ThemeProvider>
      <Appbar.Header mode="small">
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={"编辑题库 - " + baseName} />
        <Appbar.Action
          icon="magnify"
          onPress={handleSearchPressed}
          color={theme.colors.onSurface}
        />
      </Appbar.Header>

      {/* 搜索框 */}
      <Animated.View style={[animatedSearchContainerStyle, { zIndex: -1 }]}>
        <Searchbar
          placeholder="搜索题目内容..."
          value={searchQuery}
          onChangeText={setSearchQuery}
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
        
      <View style={{ flex: 1, backgroundColor: theme.colors.surfaceContainer }}>
        {/* 筛选后的列表 */}
        <FlatList
          ref={flatListRef}
          data={filteredQuestions}
          renderItem={({ item: question }) => (
            <MemoizedQuestionItem
              question={question}
              theme={theme}
              onEditPress={() => handleEditPress(question)}
              onDeletePress={() => handleDeleteConfirm(question.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={5}
          contentContainerStyle={{ flexGrow: 1 }}
          // 空数据提示
          ListEmptyComponent={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 16, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {searchQuery ? '未找到匹配的题目' : '该题库暂无题目'}
              </Text>
            </View>
          )}
          // 底部添加空白占位，让最后一项能滚到屏幕中间
          ListFooterComponent={() => (
            <View style={{ height: 100 }} />
          )}
        />
      </View>

      {/* 右下角 FAB 按钮 */}
      <AnimatedFAB
        icon={'plus'}
        label={'添加题目'}
        extended={fabExtended}
        onPress={() => {
          setSelectedQuestion(null);
          setDialogVisible(true);
        }}
        animateFrom={'right'}
        iconMode={"dynamic"}
        style={{ bottom: 20, right: 20, position: 'absolute' }}
      />

      {/* 题目编辑弹窗 */}
      <EditQuestionDialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        onConfirm={async (question: Question) => {
          await handleCreateConfirm(question);
        }}
        question={selectedQuestion}
      />
    </Material3ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  textContainer: {
    gap: 8, // 文本和公式之间的间距
  },
  mathStyle: {
    marginVertical: 4, // 公式上下间距
    alignSelf: 'flex-start', // 公式左对齐（默认居中）
    color: '#FFFF00',
  },
});