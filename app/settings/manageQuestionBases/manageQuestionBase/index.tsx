import { Material3ThemeProvider, useAppTheme } from '@/components/Material3ThemeProvider';
import { ChoiceQuestionListItem } from '@/components/QuestionManage/QuestionBaseManage/ChoiceQuestionListItem';
import { CreateChoiceQuestionDialog } from '@/components/QuestionManage/QuestionBaseManage/CreateChoiceQuestionDialog';
import { ChoiceQuestion, Question, QuestionBaseManager } from '@/scripts/questions';
import { QuestionBase } from '@/scripts/questions/QuestionBase';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { AnimatedFAB } from 'react-native-paper';

// 选择题列表项目组件（保留memo优化）
const MemoizedChoiceQuestionItem = React.memo(ChoiceQuestionListItem);

export default function ImportQuestionBase() {
  const theme = useAppTheme();
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [isExtended, setIsExtended] = React.useState(true);
  const params = useLocalSearchParams();
  const { baseName } = params;
  const [questions, setQuestions] = React.useState<Question[]>([]);
  // 创建FlatList的ref（若后续需要调用滚动方法可使用）
  const flatListRef = React.useRef<FlatList<Question>>(null);

  // 获取题库实例
  const getQuestionBase = React.useCallback(() => {
    const name = Array.isArray(baseName) ? baseName[0] : baseName;
    return QuestionBaseManager.getInstance<QuestionBaseManager>().getQuestionBaseByName(name);
  }, [baseName]);

  // 刷新题目列表
  const refreshQuestionList = React.useCallback(() => {
    const questionBase = getQuestionBase();
    if (questionBase) {
      setQuestions([...questionBase.questions]);
    }
  }, [getQuestionBase]);

  // 初始化和订阅事件
  React.useEffect(() => {
    const questionBase = getQuestionBase();
    refreshQuestionList();
    const unsubscribe = questionBase?.onQuestionListUpdated.subscribe(refreshQuestionList);
    return () => {
      console.log("unsubscribe");
      unsubscribe?.();
    };
  }, [getQuestionBase, refreshQuestionList]);

  // 处理滚动时右下角按钮的折叠（适配FlatList的滚动事件）
  const onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { nativeEvent } = event;
    const currentScrollY = nativeEvent.contentOffset.y;
    const isScrollingUp = (nativeEvent.velocity?.y ?? 0) <= 0;
    const isTop = currentScrollY <= 0;
    const isBottom = currentScrollY >= (nativeEvent.contentSize?.height ?? 0) - (nativeEvent.layoutMeasurement?.height ?? 0);
    setIsExtended(isScrollingUp || isTop || isBottom);
  }, []);

  // 处理创建题目
  const handleCreateQuestion = React.useCallback((questionText: string, choices: string[], answer: string,id:string) => {
    const questionBase = getQuestionBase();
    if (!questionBase) return;
    questionBase.addQuestion(
      new ChoiceQuestion(questionText, choices, Number.parseInt(answer),id)
    );
  }, [getQuestionBase]);

  // 封装删除题目逻辑（避免重复代码）
  const handleDeleteQuestion = React.useCallback((questionId: string) => {
    console.log(questionId + " deleted");
    const questionBase = getQuestionBase();
    questionBase?.removeQuestionById(questionId);
  }, [getQuestionBase]);

  // 获取当前题库实例
  const questionBase = getQuestionBase() as QuestionBase;

  return (
    <Material3ThemeProvider>
      <View style={styles.container}>
        {/* FlatList核心列表 */}
        <FlatList
          ref={flatListRef}
          data={questions}
          // 渲染单个列表项（简洁写法）
          renderItem={({ item }) => (
            <MemoizedChoiceQuestionItem
              question={item}
              theme={theme}
              onDeletePress={() => handleDeleteQuestion(item.id)}
            />
          )}
          // 唯一key（必须）
          keyExtractor={(item) => item.id}
          // 滚动监听
          onScroll={onScroll}
          // 性能优化配置
          initialNumToRender={10}
          maxToRenderPerBatch={1}
          windowSize={5}
          // 背景样式适配
          contentContainerStyle={styles.flatListContent}
          style={[styles.flatList, { backgroundColor: theme.colors.surfaceContainer }]}
        />

        {/* 右下角FAB按钮 */}
        <AnimatedFAB
          icon={'plus'}
          label={'Label      '}
          extended={isExtended}
          onPress={() => setDialogVisible(true)}
          animateFrom={'right'}
          iconMode={"dynamic"}
          style={styles.fab}
        />
      </View>

      {/* 选择题创建弹窗 */}
      <CreateChoiceQuestionDialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        onConfirm={handleCreateQuestion}
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