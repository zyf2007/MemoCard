import React from 'react';

import { Material3ThemeProvider } from '@/components/Material3ThemeProvider';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
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
    </Material3ThemeProvider>

  );
}
