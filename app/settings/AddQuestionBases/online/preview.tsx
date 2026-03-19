import { QuestionListItem } from '@/components/QuestionManage/QuestionList/QuestionListItem';
import { SearchableListPage } from '@/components/ui/SearchableListPage';
import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { QuestionFactory } from '@/scripts/QuestionFactory/questionFactory';
import { OnlineQuestionBaseRepositoryManager } from '@/scripts/onlineQuestionBases';
import {
  ChoiceQuestion,
  FillingQuestion,
  parseQuestionBaseTransferJson,
  Question,
  QuestionBaseManager,
} from '@/scripts/questions';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { Alert, View } from 'react-native';
import { ActivityIndicator, Appbar, Text } from 'react-native-paper';

const MemoizedQuestionItem = React.memo(QuestionListItem);

export default function OnlineQuestionBasePreviewPage() {
  const theme = useAppTheme();
  const params = useLocalSearchParams();
  const repoId = Array.isArray(params.repoId) ? params.repoId[0] : params.repoId;
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;

  const manager = React.useMemo(() => OnlineQuestionBaseRepositoryManager.getInstance(), []);
  const [loading, setLoading] = React.useState(true);
  const [importing, setImporting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [baseName, setBaseName] = React.useState('');
  const [author, setAuthor] = React.useState<string | undefined>(undefined);
  const [questionCount, setQuestionCount] = React.useState<number>(0);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [rawJson, setRawJson] = React.useState('');

  const loadPreview = React.useCallback(async () => {
    if (!repoId || !itemId) {
      setErrorMessage('参数错误：缺少 repoId 或 itemId');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await manager.ready();
      const catalogItem = manager.getCatalogItem(repoId, itemId);
      if (!catalogItem) {
        throw new Error('未找到在线题库索引，请先返回刷新在线列表');
      }

      const content = await manager.fetchQuestionBaseJson(repoId, itemId);
      const payload = parseQuestionBaseTransferJson(content);
      const previewBaseName = payload.baseName;
      const previewBaseId = 'preview00';
      const previewQuestions = payload.questions.map((question) => {
        if (question.type === 'choice') {
          return QuestionFactory.createChoiceQuestion({
            baseId: previewBaseId,
            baseName: previewBaseName,
            text: question.text,
            choices: question.choices,
            correctChoiceIndex: question.correctChoiceIndex,
          });
        }
        return QuestionFactory.createFillingQuestion({
          baseId: previewBaseId,
          baseName: previewBaseName,
          text: question.text,
          correctAnswer: question.correctAnswer,
        });
      });

      setBaseName(previewBaseName);
      setAuthor(payload.meta.author || catalogItem.author);
      setQuestionCount(previewQuestions.length);
      setQuestions(previewQuestions);
      setRawJson(content);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage((error as Error).message);
      setQuestions([]);
      setQuestionCount(0);
      setRawJson('');
    } finally {
      setLoading(false);
    }
  }, [itemId, manager, repoId]);

  React.useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const importQuestionBase = React.useCallback(async () => {
    if (!rawJson) {
      Alert.alert('导入失败', '题库内容为空，请先刷新');
      return;
    }

    setImporting(true);
    try {
      const subscriptionUrl = repoId && itemId ? manager.getQuestionBaseDownloadUrl(repoId, itemId) : null;
      const catalogItem = repoId && itemId ? manager.getCatalogItem(repoId, itemId) : null;
      const imported = await QuestionBaseManager.getInstance().importQuestionBaseFromJson(rawJson, {
        importedFrom: catalogItem ? `在线仓库：${catalogItem.repoName}` : '在线仓库',
        subscriptionUrl: subscriptionUrl || undefined,
        subscriptionLabel: catalogItem?.baseName || undefined,
      });
      if (imported) {
        router.back();
      }
    } finally {
      setImporting(false);
    }
  }, [itemId, manager, rawJson, repoId]);

  return (
    <Material3ThemeProvider>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SearchableListPage
          title="预览在线题库"
          onBackPress={() => router.back()}
          data={questions}
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
          emptyText={loading ? '加载中...' : errorMessage ? '预览加载失败' : '该题库暂无题目'}
          emptySearchText="未找到匹配的题目"
          actions={(
            <>
              <Appbar.Action icon="refresh" onPress={() => void loadPreview()} disabled={loading || importing} />
              <Appbar.Action
                icon="download"
                onPress={() => void importQuestionBase()}
                disabled={loading || importing || !!errorMessage || !rawJson}
              />
            </>
          )}
          renderItem={({ item }) => (
            <MemoizedQuestionItem
              question={item}
              theme={theme}
              onEditPress={() => {}}
              onDeletePress={() => {}}
            />
          )}
          keyExtractor={(item) => item.id}
          listHeaderComponent={
            !loading && !errorMessage ? (
              <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
                <Text variant="titleMedium">{baseName}</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                  {author ? `作者：${author} · ` : ''}题目数：{questionCount}
                </Text>
              </View>
            ) : null
          }
          listFooterComponent={
            <View>
              {loading ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
              {!loading && errorMessage ? (
                <Text style={{ marginHorizontal: 16, marginTop: 12, color: theme.colors.error, textAlign: 'center' }}>
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
