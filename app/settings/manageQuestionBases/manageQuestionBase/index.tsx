// index.tsx
import { EditQuestionDialog } from '@/components/QuestionManage/QuestionBaseManage/EditQuestionDialog';
import { QuestionListItem } from '@/components/QuestionManage/QuestionList/QuestionListItem';
import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { buildQuestionBaseTransferPayload, ChoiceQuestion, FillingQuestion, Question, QuestionBaseManager } from '@/scripts/questions';
import { useScrollToTop } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Alert, FlatList, NativeScrollEvent, NativeSyntheticEvent, Platform, View } from 'react-native';
import { AnimatedFAB, Appbar, Searchbar, Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
// 选择题列表项目组件（保留 memo 优化）
const MemoizedQuestionItem = React.memo(QuestionListItem);

export default function ImportQuestionBase() {
  const theme = useAppTheme();
  const questionBaseManager = QuestionBaseManager.getInstance<QuestionBaseManager>();
  // 编辑题目弹窗状态
  const [dialogVisible, setDialogVisible] = React.useState(false);
  // 选中的题目 用来传给编辑题目的弹窗
  const [selectedQuestion, setSelectedQuestion] = React.useState<Question | null>(null);
  // 右下角按钮折叠
  const [fabExtended, setFabExtended] = React.useState(true);
  const params = useLocalSearchParams();
  const { baseId } = params;
  
  const [baseName, setBaseName] = React.useState('');
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
  const [questionBase, setQuestionBase] = React.useState<ReturnType<typeof questionBaseManager.getQuestionBaseById> | null>(null);

  React.useEffect(() => {
    const loadQuestionBase = async () => {
      await questionBaseManager.ready();
      if (!baseId) {
        setQuestionBase(null);
        return;
      }

      const id = Array.isArray(baseId) ? baseId[0] : baseId;
      setQuestionBase(questionBaseManager.getQuestionBaseById(id) || null);
    };

    void loadQuestionBase();
  }, [baseId, questionBaseManager]);

  // 刷新题目列表
  const refreshQuestionList = React.useCallback(async () => {
    if (questionBase) {
      const questions = await questionBase.ensureQuestionsLoaded(true);
      setBaseName(questionBase.baseName);
      setAllQuestions(questions);
      setFilteredQuestions(questions);
    } else {
      setBaseName('');
      setAllQuestions([]);
      setFilteredQuestions([]);
    }
  }, [questionBase]);

  // 初始化和订阅 [题库更新→刷新列表] 事件
  React.useEffect(() => {
    void refreshQuestionList();
    const unsubscribe = questionBase?.onUpdate.on(() => {
      void refreshQuestionList();
    });
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

  const buildExportJson = React.useCallback(() => {
    if (!questionBase) {
      return null;
    }

    return JSON.stringify(
      buildQuestionBaseTransferPayload(questionBase.baseName, allQuestions),
      null,
      2
    );
  }, [allQuestions, questionBase]);

  const buildExportFileName = React.useCallback(() => {
    const safeBaseName = (baseName || 'question-base').replace(/[\\/:*?"<>|]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${safeBaseName}-${timestamp}.json`;
  }, [baseName]);

  const exportToClipboard = React.useCallback(async () => {
    const jsonContent = buildExportJson();
    if (!jsonContent) {
      Alert.alert('导出失败', '当前题库不存在，无法导出');
      return;
    }

    await Clipboard.setStringAsync(jsonContent);
    Alert.alert('导出成功', '题库 JSON 已复制到剪贴板');
  }, [buildExportJson]);

  const exportToFile = React.useCallback(async () => {
    const jsonContent = buildExportJson();
    if (!jsonContent) {
      Alert.alert('导出失败', '当前题库不存在，无法导出');
      return;
    }

    const fileName = buildExportFileName();

    try {
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          return;
        }

        const targetFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'application/json'
        );

        await FileSystem.writeAsStringAsync(targetFileUri, jsonContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        Alert.alert('导出成功', `已导出到文件：${fileName}`);
        return;
      }

      if (!FileSystem.documentDirectory) {
        Alert.alert('导出失败', '当前设备不支持文件导出目录');
        return;
      }

      const targetFileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(targetFileUri, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      Alert.alert('导出成功', `已导出到：${targetFileUri}`);
    } catch (error) {
      Alert.alert('导出失败', `写入文件失败：${(error as Error).message}`);
    }
  }, [buildExportFileName, buildExportJson]);

  const handleExportPressed = React.useCallback(() => {
    Alert.alert('导出题库 JSON', '请选择导出方式', [
      {
        text: '导出到文件',
        onPress: () => {
          void exportToFile();
        },
      },
      {
        text: '复制到剪贴板',
        onPress: () => {
          void exportToClipboard();
        },
      },
      {
        text: '取消',
        style: 'cancel',
      },
    ]);
  }, [exportToClipboard, exportToFile]);

  const handleSubscriptionRefresh = React.useCallback(async () => {
    if (!questionBase) {
      Alert.alert('更新失败', '当前题库不存在');
      return;
    }
    await questionBaseManager.refreshSubscribedQuestionBase(questionBase.baseId);
    await refreshQuestionList();
  }, [questionBase, questionBaseManager, refreshQuestionList]);

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
        <Appbar.Action
          icon="export-variant"
          onPress={handleExportPressed}
          color={theme.colors.onSurface}
        />
        {questionBase?.meta.subscriptionUrl ? (
          <Appbar.Action
            icon="sync"
            onPress={() => void handleSubscriptionRefresh()}
            color={theme.colors.onSurface}
          />
        ) : null}
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
        baseName={baseName}
        baseId={questionBase?.baseId || ''}
      />
    </Material3ThemeProvider>
  );
}
