import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { AppDataTransferManager } from '@/scripts/appDataTransfer/AppDataTransferManager';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as React from 'react';
import { Platform, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator, Button, IconButton, List, Snackbar, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DataTransferPage() {
  const theme = useAppTheme();
  const dataTransferManager = React.useMemo(
    () => AppDataTransferManager.getInstance<AppDataTransferManager>(),
    []
  );
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState('可用于设备迁移：导出当前数据，或导入备份覆盖当前数据。');
  const [pastedJson, setPastedJson] = React.useState('');
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  const buildExportFileName = React.useCallback(() => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `MemoCard-backup-${timestamp}.json`;
  }, []);

  const withBusy = React.useCallback(async (action: () => Promise<void>) => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setStatus(`失败：${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const exportToClipboard = React.useCallback(() => {
    return withBusy(async () => {
      const jsonContent = await dataTransferManager.exportToJson();
      await Clipboard.setStringAsync(jsonContent);
      setStatus('导出成功：备份 JSON 已复制到剪贴板。');
      setSnackbarMessage('已复制到剪贴板');
      setSnackbarVisible(true);
    });
  }, [dataTransferManager, withBusy]);

  const exportToFile = React.useCallback(() => {
    return withBusy(async () => {
      const jsonContent = await dataTransferManager.exportToJson();
      const fileName = buildExportFileName();

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          setStatus('已取消：未授予目录权限。');
          return;
        }
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'application/json'
        );
        await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        setStatus(`导出成功：${fileName}`);
        return;
      }

      if (!FileSystem.documentDirectory) {
        throw new Error('当前设备不支持文件导出目录');
      }
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      setStatus(`导出成功：${fileUri}`);
    });
  }, [buildExportFileName, dataTransferManager, withBusy]);

  const importJson = React.useCallback((jsonText: string) => {
    return withBusy(async () => {
      const text = jsonText.trim();
      if (!text) {
        throw new Error('导入内容为空');
      }
      const summary = await dataTransferManager.importFromJson(text);
      setStatus(
        `导入成功：已覆盖 ${summary.importedKeyCount} 项数据。请完全退出并重新打开应用。`
      );
    });
  }, [dataTransferManager, withBusy]);

  const importFromClipboard = React.useCallback(() => {
    return withBusy(async () => {
      const text = await Clipboard.getStringAsync();
      if (!text.trim()) {
        throw new Error('剪贴板内容为空');
      }
      const summary = await dataTransferManager.importFromJson(text);
      setStatus(
        `导入成功：已覆盖 ${summary.importedKeyCount} 项数据。请完全退出并重新打开应用。`
      );
    });
  }, [dataTransferManager, withBusy]);

  const importFromFile = React.useCallback(() => {
    return withBusy(async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || result.assets.length === 0) {
        setStatus('已取消：未选择文件。');
        return;
      }

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const summary = await dataTransferManager.importFromJson(content);
      setStatus(
        `导入成功：已覆盖 ${summary.importedKeyCount} 项数据。请完全退出并重新打开应用。`
      );
    });
  }, [dataTransferManager, withBusy]);

  return (
    <Material3ThemeProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ marginTop: 100, marginLeft: 5, flexDirection: 'row', alignItems: 'center' }}>
            <IconButton icon="arrow-left" onPress={() => router.back()} />
            <Text variant="headlineMedium">导入/导出信息</Text>
          </View>

          <Text variant="titleMedium" style={{ marginTop: 30, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>
            导出
          </Text>
          <List.Item
            title="导出到文件"
            description="将当前题库、统计和配置导出为 JSON 文件"
            left={(props) => <List.Icon {...props} icon="file-export-outline" />}
            onPress={() => {
              void exportToFile();
            }}
            disabled={busy}
          />
          <List.Item
            title="复制导出 JSON"
            description="将备份 JSON 复制到剪贴板"
            left={(props) => <List.Icon {...props} icon="content-copy" />}
            onPress={() => {
              void exportToClipboard();
            }}
            disabled={busy}
          />

          <Text variant="titleMedium" style={{ marginTop: 16, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}>
            导入（覆盖）
          </Text>
          <List.Item
            title="从文件导入"
            description="选择备份 JSON 并覆盖当前数据"
            left={(props) => <List.Icon {...props} icon="file-import-outline" />}
            onPress={() => {
              void importFromFile();
            }}
            disabled={busy}
          />
          <List.Item
            title="从剪贴板导入"
            description="读取剪贴板 JSON 并覆盖当前数据"
            left={(props) => <List.Icon {...props} icon="clipboard-arrow-down-outline" />}
            onPress={() => {
              void importFromClipboard();
            }}
            disabled={busy}
          />

          <View style={{ marginTop: 10, marginHorizontal: 16 }}>
            <TextInput
              mode="outlined"
              label="粘贴备份 JSON 后导入（覆盖）"
              value={pastedJson}
              onChangeText={setPastedJson}
              multiline
              style={{ minHeight: 120, maxHeight: 220 }}
              disabled={busy}
            />
            <Button
              mode="contained"
              icon="database-import"
              style={{ marginTop: 10, alignSelf: 'flex-start' }}
              onPress={() => {
                void importJson(pastedJson);
              }}
              disabled={busy || !pastedJson.trim()}
            >
              导入粘贴内容
            </Button>
          </View>

          <View style={{ marginTop: 20, marginHorizontal: 16, padding: 12, borderRadius: 10, backgroundColor: theme.colors.surfaceVariant }}>
            {busy ? <ActivityIndicator /> : null}
            <Text style={{ marginTop: busy ? 10 : 0, color: theme.colors.onSurfaceVariant }}>
              {status}
            </Text>
          </View>
        </ScrollView>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={1800}
        >
          {snackbarMessage}
        </Snackbar>
      </SafeAreaView>
    </Material3ThemeProvider>
  );
}
