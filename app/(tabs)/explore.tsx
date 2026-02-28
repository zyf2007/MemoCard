// StatisticsScreen.tsx
import FadeInTab from '@/components/ui/FadeInTab';
import { Statistics } from '@/scripts/statistics/statistics';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  View
} from 'react-native';
import {
  LineChart,
  PieChart
} from 'react-native-chart-kit';
import {
  Avatar,
  Card,
  Chip,
  Paragraph,
  Surface,
  Text,
  Title,
  useTheme
} from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 50;

export default function StatisticsScreen() {
  const theme = useTheme();
  const [selectedBase, setSelectedBase] = useState<string | 'all'>('all');
  const [availableBases, setAvailableBases] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const [menuVisible, setMenuVisible] = useState(false);
  
  const [achievements, setAchievements] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [improvedBases, setImprovedBases] = useState<any[]>([]);
  const [baseDistribution, setBaseDistribution] = useState<any[]>([]);

  const stats = Statistics.getInstance();

  const loadData = useCallback(async () => {
    try {
      const [
        ach,
        trend7,
        trend30,
        improved,
        distribution,
        bases,
      ] = await Promise.all([
        stats.getOverallAchievements(),
        stats.getRecentDailyStats(7),
        stats.getRecentDailyStats(30),
        stats.getMostImprovedBases(7),
        stats.getTotalStatsByBase(),
        stats.getAllQuestionBases(),
      ]);

      setAchievements(ach);
      setTrendData(timeRange === 7 ? trend7 : trend30);
      setImprovedBases(improved);
      setAvailableBases(bases);

      const pieData = Object.entries(distribution).map(([name, data]: [string, any], index) => ({
        name: name.length > 10 ? name.substring(0, 10) + '...' : name,
        population: data.total,
        color: [
          theme.colors.primary,
          theme.colors.secondary,
          theme.colors.tertiary,
          theme.colors.error,
          theme.colors.primaryContainer,
          theme.colors.secondaryContainer,
        ][index % 6],
        legendFontColor: theme.colors.onSurfaceVariant,
        legendFontSize: 12,
      })).filter(item => item.population > 0);
      
      setBaseDistribution(pieData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }, [timeRange, stats, theme.colors]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
    propsForLabels: { fontSize: 10 },
  };

  const accuracyChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => theme.colors.secondary,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.secondary,
    },
  };

  if (!achievements) return null;

  return (
    <FadeInTab>
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Text variant="displaySmall" style={{ marginTop: 100, marginLeft: 25 }}>统计</Text>
      {/* 顶部成就概览 - 使用主题色，非彩色 */}
      <Surface style={{ margin: 16, padding: 16, borderRadius: 16, backgroundColor: theme.colors.surface }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <Avatar.Icon 
              size={48} 
              icon="trophy" 
              style={{ backgroundColor: theme.colors.primaryContainer }} 
              color={theme.colors.onPrimaryContainer}
            />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.onSurface, marginTop: 8 }}>
              {achievements.totalQuestions}
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 }}>总答题</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Avatar.Icon 
              size={48} 
              icon="check-circle" 
              style={{ backgroundColor: theme.colors.secondaryContainer }} 
              color={theme.colors.onSecondaryContainer}
            />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.onSurface, marginTop: 8 }}>
              {achievements.overallAccuracy}%
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 }}>正确率</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Avatar.Icon 
              size={48} 
              icon="calendar-check" 
              style={{ backgroundColor: theme.colors.tertiaryContainer }} 
              color={theme.colors.onTertiaryContainer}
            />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.onSurface, marginTop: 8 }}>
              {achievements.activeDays}
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 }}>活跃天数</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Avatar.Icon 
              size={48} 
              icon="book-open" 
              style={{ backgroundColor: theme.colors.surfaceVariant }} 
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.onSurface, marginTop: 8 }}>
              {achievements.totalBases}
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 }}>题库数</Text>
          </View>
        </View>
        
        {achievements.favoriteBase && (
          <Chip 
            icon="heart" 
            style={{ alignSelf: 'center', backgroundColor: theme.colors.primaryContainer }}
            textStyle={{ color: theme.colors.onPrimaryContainer }}
          >
            最常刷到: {achievements.favoriteBase}
          </Chip>
        )}
      </Surface>

      {/* 正确率趋势图 */}
      <Card style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: theme.colors.surface }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Title style={{ color: theme.colors.onSurface }}>📈 正确率趋势</Title>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip
                selected={timeRange === 7}
                onPress={() => setTimeRange(7)}
                style={{ backgroundColor: timeRange === 7 ? theme.colors.primaryContainer : theme.colors.surfaceVariant }}
                textStyle={{ color: timeRange === 7 ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
              >
                7天
              </Chip>
              <Chip
                selected={timeRange === 30}
                onPress={() => setTimeRange(30)}
                style={{ backgroundColor: timeRange === 30 ? theme.colors.primaryContainer : theme.colors.surfaceVariant }}
                textStyle={{ color: timeRange === 30 ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
              >
                30天
              </Chip>
            </View>
          </View>
          
          {trendData && trendData.length > 0 && (
            <LineChart
              data={{
                labels: trendData.map((d: any) => d.date.slice(5)),
                datasets: [
                  {
                    data: trendData.map((d: any) => d.accuracy),
                    color: (opacity = 1) => theme.colors.secondary,
                    strokeWidth: 3,
                  },
                ],
                legend: ['正确率 (%)'],
              }}
              width={chartWidth}
              height={220}
              chartConfig={accuracyChartConfig}
              bezier
              style={{ marginLeft: -25, borderRadius: 16 }}
              yAxisSuffix="%"
              yAxisInterval={20}
              fromZero
            />
          )}
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, padding: 12, backgroundColor: theme.colors.background, borderRadius: 12 }}>
            {trendData && trendData.length >= 2 && (
              <>
                <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>
                  首周正确率: <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{trendData[0].accuracy}%</Text>
                </Text>
                <Text style={{ marginHorizontal: 8, color: theme.colors.outline }}>→</Text>
                <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>
                  最近: <Text style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>{trendData[trendData.length - 1].accuracy}%</Text>
                </Text>
                <Chip 
                  style={{ 
                    marginLeft: 8, 
                    height: 28, 
                    backgroundColor: trendData[trendData.length - 1].accuracy >= trendData[0].accuracy 
                      ? theme.colors.secondaryContainer 
                      : theme.colors.errorContainer 
                  }}
                  textStyle={{ 
                    color: trendData[trendData.length - 1].accuracy >= trendData[0].accuracy 
                      ? theme.colors.onSecondaryContainer 
                      : theme.colors.onErrorContainer 
                  }}
                >
                  {trendData[trendData.length - 1].accuracy >= trendData[0].accuracy ? '+' : ''}
                  {(trendData[trendData.length - 1].accuracy - trendData[0].accuracy).toFixed(1)}%
                </Chip>
              </>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* 答题数量趋势图 */}
<Card style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: theme.colors.surface }}>
  <Card.Content>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <Title style={{ color: theme.colors.onSurface }}>📝 答题数量趋势</Title>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip
          selected={timeRange === 7}
          onPress={() => setTimeRange(7)}
          style={{ backgroundColor: timeRange === 7 ? theme.colors.primaryContainer : theme.colors.surfaceVariant }}
          textStyle={{ color: timeRange === 7 ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
        >
          7天
        </Chip>
        <Chip
          selected={timeRange === 30}
          onPress={() => setTimeRange(30)}
          style={{ backgroundColor: timeRange === 30 ? theme.colors.primaryContainer : theme.colors.surfaceVariant }}
          textStyle={{ color: timeRange === 30 ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
        >
          30天
        </Chip>
      </View>
    </View>
    
    {trendData && trendData.length > 0 && (
      <LineChart
        data={{
          labels: trendData.map((d: any) => d.date.slice(5)),
          datasets: [
            {
              data: trendData.map((d: any) => d.total),
              color: (opacity = 1) => theme.colors.primary,
              strokeWidth: 3,
            },
          ],
          legend: ['答题数量'],
        }}
        width={chartWidth}
        height={220}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1) => theme.colors.primary,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: theme.colors.primary,
          },
        }}
        bezier
        style={{ marginLeft: -28, borderRadius: 16 }}
        yAxisInterval={Math.ceil(Math.max(...trendData.map((d: any) => d.total)) / 5)}
        fromZero
      />
    )}
    
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, padding: 12, backgroundColor: theme.colors.background, borderRadius: 12 }}>
      {trendData && trendData.length > 0 && (
        <>
          <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>
            日均答题: <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
              {Math.round(trendData.reduce((sum: number, d: any) => sum + d.total, 0) / trendData.length)}
            </Text> 题
          </Text>
          <Text style={{ marginHorizontal: 8, color: theme.colors.outline }}>|</Text>
          <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>
            总计: <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
              {trendData.reduce((sum: number, d: any) => sum + d.total, 0)}
            </Text> 题
          </Text>
        </>
      )}
    </View>
  </Card.Content>
</Card>

      {/* 进步最快题库排行榜 */}
      <Card style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: theme.colors.surface }}>
        <Card.Content>
          <Title style={{ color: theme.colors.onSurface }}>🚀 正确率提升</Title>
          <Paragraph style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16, fontSize: 14 }}>
            最近7天正确率提升最快的题库
          </Paragraph>
          
          {improvedBases.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.onSurfaceDisabled }}>继续答题，见证进步！</Text>
            </View>
          ) : (
            improvedBases.slice(0, 3).map((item, index) => (
              <Surface 
                key={item.frombase} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 12, 
                  marginVertical: 6, 
                  borderRadius: 12, 
                  backgroundColor: theme.colors.background 
                }}
              >
                <View style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: 14, 
                  backgroundColor: index === 0 ? theme.colors.primary : index === 1 ? theme.colors.secondary : theme.colors.tertiary, 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: 12 
                }}>
                  <Text style={{ color: theme.colors.surface, fontWeight: 'bold', fontSize: 14 }}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 6 }} numberOfLines={1}>
                    {item.frombase}
                  </Text>
                  <View style={{ height: 6, backgroundColor: theme.colors.surfaceVariant, borderRadius: 3, marginBottom: 8, overflow: 'hidden', width: '92%' }}>
                    <View style={{ 
                      height: '100%',
                      borderRadius: 3, 
                      width: `${Math.min(item.newAccuracy, 100)}%`,
                      backgroundColor: index === 0 ? theme.colors.primary : index === 1 ? theme.colors.secondary : theme.colors.tertiary 
                    }} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: theme.colors.onSurfaceDisabled, width: 40 }}>{item.oldAccuracy}%</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 }}>
                      <Text style={{ color: theme.colors.outline, marginRight: 4 }}>→</Text>
                      <Text style={{ fontWeight: 'bold', fontSize: 12, color: item.improvement > 0 ? theme.colors.secondary : theme.colors.error }}>
                        {item.improvement > 0 ? '+' : ''}{item.improvement}%
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.colors.secondary, fontWeight: '600', marginLeft: 'auto' }}>{item.newAccuracy}%</Text>
                  </View>
                </View>
                <Avatar.Icon 
                  size={40} 
                  icon={index === 0 ? 'trophy' : index === 1 ? 'medal' : 'award'} 
                  style={{ backgroundColor: index === 0 ? theme.colors.primaryContainer : index === 1 ? theme.colors.secondaryContainer : theme.colors.tertiaryContainer }}
                  color={index === 0 ? theme.colors.onPrimaryContainer : index === 1 ? theme.colors.onSecondaryContainer : theme.colors.onTertiaryContainer}
                />
              </Surface>
            ))
          )}
        </Card.Content>
      </Card>

      {/* 题库分布饼图 */}
      <Card style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: theme.colors.surface }}>
        <Card.Content>
          <Title style={{ color: theme.colors.onSurface }}>🎯 题库分布</Title>
          <Paragraph style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16, fontSize: 14 }}>
            各题库做题数量占比
          </Paragraph>
          
          {baseDistribution.length > 0 ? (
            <PieChart
              data={baseDistribution}
              width={chartWidth}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={{ marginHorizontal: -10, borderRadius: 16 }}
            />
          ) : (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.onSurfaceDisabled }}>暂无数据，开始你的第一题吧！</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <View style={{ height: 100 }} />
      </ScrollView>
      </FadeInTab>
  );
}