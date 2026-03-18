import { QuestionListItem } from '@/components/QuestionManage/QuestionList/QuestionListItem';
import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { QuestionFactory } from '@/scripts/QuestionFactory/questionFactory';
import { OnlineQuestionBaseRepositoryManager } from '@/scripts/onlineQuestionBases';
import { parseQuestionBaseTransferJson, Question, QuestionBaseManager } from '@/scripts/questions';
import { router, useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { OverflowMarqueeText } from '@/components/ui/OverflowMarqueeText';
import { Alert, FlatList, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Appbar.Header mode="small">
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content
            title={(<View style={{ flexShrink: 1, minWidth: 0 }}><OverflowMarqueeText text="预览在线题库" style={[theme.fonts.titleLarge, { color: theme.colors.onSurface }]} /></View>)}
          />
          <Appbar.Action icon="refresh" onPress={() => void loadPreview()} />
        </Appbar.Header>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        ) : errorMessage ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
            <Text style={{ color: theme.colors.error, textAlign: 'center' }}>{errorMessage}</Text>
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
              <Text variant="titleMedium">{baseName}</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                {author ? `作者：${author} · ` : ''}题目数：{questionCount}
              </Text>
            </View>

            <FlatList
              data={questions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MemoizedQuestionItem
                  question={item}
                  theme={theme}
                  onEditPress={() => {}}
                  onDeletePress={() => {}}
                />
              )}
              contentContainerStyle={{ paddingBottom: 92 }}
              ListEmptyComponent={() => (
                <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>该题库暂无题目</Text>
                </View>
              )}
            />

            <Button
              mode="contained"
              style={{ marginHorizontal: 16, marginBottom: 16 }}
              onPress={() => void importQuestionBase()}
              loading={importing}
              disabled={importing}
            >
              导入此题库
            </Button>
          </>
        )}
      </SafeAreaView>
    </Material3ThemeProvider>
  );
}
