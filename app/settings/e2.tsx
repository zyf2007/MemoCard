
import { useAppTheme } from '@/components/Material3ThemeProvider';
import * as React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Appbar, Button } from 'react-native-paper';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';



// 定义标签页路由
const routes = [
  { key: 'first', title: 'First' },
  { key: 'second', title: 'Second' },
];

export default function TabViewExample() {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);
  const theme = useAppTheme();

// 定义场景内容
const renderScene = SceneMap({
  first: (props: { jumpTo: (key: string) => void }) => (
    <View style={{ flex: 1, backgroundColor: theme.colors.primaryContainer }}>
      <Button onPress={() => props.jumpTo('second')}>Jump to Second</Button>
    </View>
  ),
  second: () => <View style={{ flex: 1, backgroundColor: theme.colors.secondaryContainer }} />,
});

  return (
    <View style={{ flex:1}}>
      <Appbar.Header>
        <Appbar.Content title="管理" />
      </Appbar.Header>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: theme.colors.primary }}
            style={{ backgroundColor: theme.colors.background }}
            pressColor={theme.colors.primaryContainer}
            activeColor={theme.colors.primary}
            inactiveColor={theme.colors.onSurfaceVariant}
            
          />
        )}
      />
    </View>
  );
}

 