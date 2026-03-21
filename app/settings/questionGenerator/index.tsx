import { Material3ThemeProvider, useAppTheme } from '@/hooks/Material3ThemeProvider';
import { Material3Switch } from '@/components/materialSwitch';
import PresetSlider, { PresetOption } from '@/components/ui/PresetSlider';
import { QuestionGenerator } from '@/scripts/questionGenerator/questionGenerator';
import { router } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type Preset = PresetOption & {
  randomFactor: number;
};

const PRESETS: Preset[] = [
  {
    title: '最随机',
    description: '几乎忽略正确率，出题顺序更接近纯随机。',
    randomFactor: 2.2,
  },
  {
    title: '偏随机',
    description: '随机性更强，但仍能感受到正确率的影响。',
    randomFactor: 1.6,
  },
  {
    title: '均衡',
    description: '随机性与正确率影响相对均衡。',
    randomFactor: 1.1,
  },
  {
    title: '偏正确率',
    description: '正确率影响更明显，随机性较弱。',
    randomFactor: 0.7,
  },
  {
    title: '最受正确率影响',
    description: '几乎按正确率权重排序，随机性极弱。',
    randomFactor: 0.3,
  },
];

const clampIndex = (value: number) => Math.max(0, Math.min(PRESETS.length - 1, value));
const clampRoundQuestionCount = (value: number) => Math.max(1, Math.min(500, Math.floor(value)));

export default function QuestionGeneratorSettings() {
  return (
    <Material3ThemeProvider>
      <QuestionGeneratorSettingsContent />
    </Material3ThemeProvider>
  );
}

function QuestionGeneratorSettingsContent() {
  const theme = useAppTheme();
  const [presetIndex, setPresetIndex] = React.useState(2);
  const [roundQuestionCount, setRoundQuestionCount] = React.useState(20);
  const [hideQuestionAfterSingleCorrectPerDay, setHideQuestionAfterSingleCorrectPerDay] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const generator = QuestionGenerator.getInstance();
    void generator.ready().then(() => {
      if (!mounted) {
        return;
      }
      const snapshot = generator.getConfigSnapshot();
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      PRESETS.forEach((preset, index) => {
        const distance = Math.abs(snapshot.randomFactor - preset.randomFactor);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      setPresetIndex(nearestIndex);
      setRoundQuestionCount(clampRoundQuestionCount(snapshot.roundQuestionCount));
      setHideQuestionAfterSingleCorrectPerDay(snapshot.hideQuestionAfterSingleCorrectPerDay);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const applyPreset = React.useCallback(async (index: number) => {
    const nextIndex = clampIndex(index);
    setPresetIndex(nextIndex);
    const generator = QuestionGenerator.getInstance();
    await generator.updateGeneratorConfig({ randomFactor: PRESETS[nextIndex].randomFactor });
  }, []);

  const applyRoundQuestionCount = React.useCallback(async (nextCount: number) => {
    const clampedCount = clampRoundQuestionCount(nextCount);
    setRoundQuestionCount(clampedCount);
    await QuestionGenerator.getInstance().updateGeneratorConfig({ roundQuestionCount: clampedCount });
  }, []);

  const toggleHideQuestionAfterSingleCorrectPerDay = React.useCallback(async () => {
    const nextValue = !hideQuestionAfterSingleCorrectPerDay;
    setHideQuestionAfterSingleCorrectPerDay(nextValue);
    await QuestionGenerator.getInstance().updateGeneratorConfig({
      hideQuestionAfterSingleCorrectPerDay: nextValue,
    });
  }, [hideQuestionAfterSingleCorrectPerDay]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1 }}>
        <View style={{ marginTop: 100, marginLeft: 5, flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text variant="headlineMedium">出题设置</Text>
        </View>

        <Text
          variant="titleMedium"
          style={{ marginTop: 30, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}
        >
          排序方式
        </Text>

        <PresetSlider
          options={PRESETS}
          value={presetIndex}
          onChange={(index) => setPresetIndex(clampIndex(index))}
          onCommit={(index) => void applyPreset(index)}
          leftLabel="最随机"
          rightLabel="最受正确率影响"
          style={{ marginHorizontal: 24, marginTop: 12 }}
          trackColor={theme.colors.surfaceVariant}
          trackActiveColor={theme.colors.primary}
          tickColor={theme.colors.outline}
          textColor={theme.colors.onSurfaceVariant}
        />

        <View style={{ marginHorizontal: 24, marginTop: 10 }}>
          <Text variant="titleSmall">{PRESETS[presetIndex].title}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {PRESETS[presetIndex].description}
          </Text>
        </View>

        <Text
          variant="titleMedium"
          style={{ marginTop: 24, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}
        >
          单回合抽题数量
        </Text>

        <View
          style={{
            marginHorizontal: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.surfaceVariant,
            paddingHorizontal: 8,
            paddingVertical: 6,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <IconButton
            icon="minus"
            onPress={() => {
              void applyRoundQuestionCount(roundQuestionCount - 1);
            }}
          />
          <View style={{ alignItems: 'center' }}>
            <Text variant="headlineSmall">{roundQuestionCount}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              每轮最多抽取题目数
            </Text>
          </View>
          <IconButton
            icon="plus"
            onPress={() => {
              void applyRoundQuestionCount(roundQuestionCount + 1);
            }}
          />
        </View>

        <Text
          variant="titleMedium"
          style={{ marginTop: 24, marginLeft: 16, marginBottom: 12, color: theme.colors.primary }}
        >
          每题每天做对一次就不再出现
        </Text>
        <View
          style={{
            marginHorizontal: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.surfaceVariant,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text variant="bodyLarge" style={{ flex: 1, color: theme.colors.onSurface }}>
            {hideQuestionAfterSingleCorrectPerDay ? '已开启' : '已关闭'}
          </Text>
          <Material3Switch
            switchOn={hideQuestionAfterSingleCorrectPerDay}
            onPress={() => {
              void toggleHideQuestionAfterSingleCorrectPerDay();
            }}
            switchOnIcon="check"
          />
        </View>

        <View style={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  );
}
