import type { PropsWithChildren, ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

// 定义两个高度常量：完整头部高度 和 无头部时的预留空白高度
const HEADER_FULL_HEIGHT = 250;
const HEADER_EMPTY_SPACING = 40; // 无头部时的预留空白，可根据设计调整

type Props = PropsWithChildren<{
  headerImage?: ReactElement;
  headerBackgroundColor?: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme() ?? 'light';
  
  // 判断是否需要渲染完整头部
  const shouldRenderFullHeader = !!headerImage || !!headerBackgroundColor;
  
  // 根据是否有头部，动态计算头部高度
  const getHeaderHeight = () => {
    return shouldRenderFullHeader ? HEADER_FULL_HEIGHT : HEADER_EMPTY_SPACING;
  };



  return (
    <ScrollView
      style={{ backgroundColor, flex: 1 }}>
      <View
        style={[
          styles.headerContainer,
          { 
            height: getHeaderHeight(),
            // 有背景色则用传入的，无则用页面背景色（视觉上和页面融为一体）
            backgroundColor: headerBackgroundColor 
              ? headerBackgroundColor[colorScheme] 
              : backgroundColor 
          }
        ]}>
        {shouldRenderFullHeader && headerImage && headerImage}
      </View>{children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // 重构头部样式，抽离通用样式
  headerContainer: {
    overflow: 'hidden',
    // 移除固定高度，改为动态计算
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});