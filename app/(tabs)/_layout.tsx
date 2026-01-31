import { Material3ThemeProvider } from '@/components/Material3ThemeProvider';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function TabLayout({ children }: { children: React.ReactNode }) {
  return (
    <Material3ThemeProvider>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon src={require('../../assets/images/react-logo.png')} />
          <Label>Home</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="explore">
          <Icon src={require('../../assets/images/react-logo.png')} />
          <Label>Explore</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="e2">
          <Icon src={require('../../assets/images/react-logo.png')} />
          <Label>Explore2</Label>
        </NativeTabs.Trigger>

      </NativeTabs>
      {children}
    </Material3ThemeProvider>

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
