import { Material3ThemeProvider, useAppTheme } from '@/components/Material3ThemeProvider';
import { EditQuestionDialog } from '@/components/QuestionManage/QuestionBaseManage/EditChoiceQuestionDialog';
import { QuestionListItem } from '@/components/QuestionManage/QuestionBaseManage/QuestionListItem';
import { ChoiceQuestion, Question, QuestionBaseManager } from '@/scripts/questions';
import { useScrollToTop } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { AnimatedFAB, Appbar } from 'react-native-paper';

// 选择题列表项目组件（保留memo优化）
const MemoizedQuestionItem = React.memo(QuestionListItem);

export default function ImportQuestionBase() {
  const theme = useAppTheme();
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [selectedQuestion,setSelectedQuestion] = React.useState<Question | null>(null);
  const [fabExtended, setFabExtended] = React.useState(true);
  const params = useLocalSearchParams();
  const { baseName } = params;
  const [questions, setQuestions] = React.useState<Question[]>([]);
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
      setQuestions([...questionBase.questions]);
    }
  }, [questionBase]);

  // 初始化和订阅事件
  React.useEffect(() => {
    refreshQuestionList();
    const unsubscribe = questionBase?.onQuestionListUpdated.subscribe(refreshQuestionList);
    return () => {
      console.log("unsubscribe");
      unsubscribe?.();
    };
  }, [questionBase, refreshQuestionList]);

  // 处理滚动时右下角按钮的折叠
  const onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { nativeEvent } = event;
    const currentScrollY = nativeEvent.contentOffset.y;
    const isScrollingUp = (nativeEvent.velocity?.y ?? 0) <= 0;
    const isTop = currentScrollY <= 0;
    const isBottom = currentScrollY >= (nativeEvent.contentSize?.height ?? 0) - (nativeEvent.layoutMeasurement?.height ?? 0);
    setFabExtended(isScrollingUp || isTop || isBottom);
  }, []);

  // 处理创建题目
  const handleCreateConfirm = React.useCallback(async (questionText: string, choices: string[], answer: string, id: string) => {
    if (!questionBase) return;
    await questionBase.addQuestion(
      new ChoiceQuestion(questionText, choices, Number.parseInt(answer), id)
    );
  }, [questionBase]);

  // 封装删除题目逻辑
  const handleDeleteConfirm = React.useCallback((questionId: string) => {
    console.log(questionId + " deleted");
    questionBase?.removeQuestionById(questionId);
  }, [questionBase]);

const handleEditPress = React.useCallback((question: Question) => {
  console.log('开始执行 handleEditPress，当前 selectedQuestion：', selectedQuestion?.id);
  
  setSelectedQuestion((prev) => {
    console.log('回调内执行，prev（旧值）：', prev?.id);
    setDialogVisible(true);
    console.log('回调内打开弹窗');
    return question;
  });
  
  console.log('handleEditPress 执行完毕');
}, []);

  return (
    <Material3ThemeProvider>
      <Appbar.Header mode="small">
        <Appbar.BackAction onPress={()=>router.back()} />
        <Appbar.Content title={"编辑题库 - "+baseName} />
        {/* <Appbar.Action icon="magnify" onPress={_handleSearch} />
        <Appbar.Action icon="dots-vertical" onPress={_handleMore} /> */}
      </Appbar.Header>
      <View style={styles.container}>
        {/* FlatList核心列表 */}
        <FlatList
          ref={flatListRef}
          data={questions}
          renderItem={({ item: Question }) => (
            <MemoizedQuestionItem
              question={Question}
              theme={theme}
              onEditPress={() => handleEditPress(Question)}
              onDeletePress={() => handleDeleteConfirm(Question.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={3}
          contentContainerStyle={styles.flatListContent}
          style={[styles.flatList, { backgroundColor: theme.colors.surfaceContainer }]}
        />

        {/* 右下角FAB按钮 */}
        <AnimatedFAB
          icon={'plus'}
          label={'Label      '}
          extended={fabExtended}
          onPress={() => {
            setSelectedQuestion(null);
            setDialogVisible(true);
          }}
          animateFrom={'right'}
          iconMode={"dynamic"}
          style={styles.fab}
        />
      </View>

      {/* 选择题创建弹窗 */}
      <EditQuestionDialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        onConfirm={async (questionText: string, choices: string[], answer: string, id: string) => {
          await handleCreateConfirm(questionText, choices, answer, id);
        }}
        question={selectedQuestion}
      />
    </Material3ThemeProvider>
  );
}

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
  },
  fab: {
    bottom: 20,
    right: 20,
    position: 'absolute',
  },
});