import { EditQuestionDialog } from '@/components/QuestionManage/QuestionBaseManage/EditQuestionDialog';
import { QuestionListItem } from '@/components/QuestionManage/QuestionList/QuestionListItem';
import { SearchableListPage } from '@/components/ui/SearchableListPage';
import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import {
  buildQuestionBaseTransferPayload,
  ChoiceQuestion,
  FillingQuestion,
  Question,
  QuestionBaseManager,
} from '@/scripts/questions';
import { useScrollToTop } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Alert, FlatList, NativeScrollEvent, NativeSyntheticEvent, Platform } from 'react-native';
import { AnimatedFAB, Appbar, Text } from 'react-native-paper';

const MemoizedQuestionItem = React.memo(QuestionListItem);

export default function ImportQuestionBase() {
  const theme = useAppTheme();
  const questionBaseManager = QuestionBaseManager.getInstance<QuestionBaseManager>();
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [selectedQuestion, setSelectedQuestion] = React.useState<Question | null>(null);
  const [fabExtended, setFabExtended] = React.useState(true);
  const params = useLocalSearchParams();
  const { baseId } = params;

  const [baseName, setBaseName] = React.useState('');
  const [allQuestions, setAllQuestions] = React.useState<Question[]>([]);

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

  const refreshQuestionList = React.useCallback(async () => {
    if (questionBase) {
      const questions = await questionBase.ensureQuestionsLoaded(true);
      setBaseName(questionBase.baseName);
      setAllQuestions(questions);
    } else {
      setBaseName('');
      setAllQuestions([]);
    }
  }, [questionBase]);

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

  const onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { nativeEvent } = event;
    const currentScrollY = nativeEvent.contentOffset.y;
    const isScrollingUp = (nativeEvent.velocity?.y ?? 0) <= 0;
    const isTop = currentScrollY <= 0;
    const isBottom =
      currentScrollY >=
      (nativeEvent.contentSize?.height ?? 0) - (nativeEvent.layoutMeasurement?.height ?? 0);
    setFabExtended(isScrollingUp || isTop || isBottom);
  }, []);

  const handleCreateConfirm = React.useCallback(
    async (question: Question) => {
      if (!questionBase) return;
      if (question instanceof ChoiceQuestion || question instanceof FillingQuestion) {
        await questionBase.addQuestion(question);
      }
    },
    [questionBase]
  );

  const handleDeleteConfirm = React.useCallback(
    (questionId: string) => {
      console.log(questionId + ' deleted');
      questionBase?.removeQuestionById(questionId);
    },
    [questionBase]
  );

  const handleEditPress = React.useCallback((question: Question) => {
    setSelectedQuestion(() => {
      setDialogVisible(true);
      return question;
    });
  }, []);

  const buildExportJson = React.useCallback(() => {
    if (!questionBase) {
      return null;
    }

    return JSON.stringify(buildQuestionBaseTransferPayload(questionBase.baseName, allQuestions), null, 2);
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

  return (
    <Material3ThemeProvider>
      <SearchableListPage
        title={`编辑题库 - ${baseName}`}
        onBackPress={() => router.back()}
        data={allQuestions}
        filterItem={(question, lowerCaseQuery) => {
          if (question.text.toLowerCase().includes(lowerCaseQuery)) {
            return true;
          }
          if (question instanceof ChoiceQuestion) {
            return question.choices.some((choice) => choice.toLowerCase().includes(lowerCaseQuery));
          }
          if (question instanceof FillingQuestion) {
            return question.correctAnswer.toLowerCase().includes(lowerCaseQuery);
          }
          return false;
        }}
        searchPlaceholder="搜索题目内容..."
        actions={(
          <>
            <Appbar.Action icon="export-variant" onPress={handleExportPressed} color={theme.colors.onSurface} />
            {questionBase?.meta.subscriptionUrl ? (
              <Appbar.Action
                icon="sync"
                onPress={() => void handleSubscriptionRefresh()}
                color={theme.colors.onSurface}
              />
            ) : null}
          </>
        )}
        renderItem={({ item: question }) => (
          <MemoizedQuestionItem
            question={question}
            theme={theme}
            onEditPress={() => handleEditPress(question)}
            onDeletePress={() => handleDeleteConfirm(question.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        listRef={flatListRef}
        emptyText="该题库暂无题目"
        emptySearchText="未找到匹配的题目"
        listFooterComponent={
          <Text
            variant="bodyMedium"
            style={{
              marginTop: 12,
              alignSelf: 'center',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: theme.colors.surfaceContainerHigh,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            共{allQuestions.length}题
          </Text>
        }
        footerSpacerHeight={100}
        extraFlatListProps={{
          onScroll,
          initialNumToRender: 3,
          maxToRenderPerBatch: 5,
          windowSize: 5,
        }}
      />

      <AnimatedFAB
        icon={'plus'}
        label={'添加题目'}
        extended={fabExtended}
        onPress={() => {
          setSelectedQuestion(null);
          setDialogVisible(true);
        }}
        animateFrom={'right'}
        iconMode={'dynamic'}
        style={{ bottom: 20, right: 20, position: 'absolute' }}
      />

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
