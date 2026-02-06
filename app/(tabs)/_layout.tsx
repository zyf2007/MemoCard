import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
export default function TabLayout({ children }: { children: React.ReactNode }) {

  return (
    <View style={{flex:1}}>
      <NativeTabs labelVisibilityMode='selected'>
        <NativeTabs.Trigger name="index">
          {Platform.OS === 'web' || <Icon src={<VectorIcon family={MaterialCommunityIcons} name="brain" />} />}
          <Label>记忆</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="explore">
          {Platform.OS === 'web'|| <Icon src={<VectorIcon family={MaterialCommunityIcons} name="chart-box" />} />}
          <Label>统计</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="manage">
          {Platform.OS === 'web' || <Icon src={<VectorIcon family={MaterialCommunityIcons} name="database-edit" />} />}
          <Label>管理</Label>
        </NativeTabs.Trigger>

      </NativeTabs>
      {children}
    </View>

  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,              // ✅ 这就是“tab 以上的完整可用高度”
    alignItems: 'center',
    justifyContent: 'center',
  },
});
