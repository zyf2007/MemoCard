// TabTwoScreen.tsx
import FadeInTab from '@/components/ui/FadeInTab';
import React, { useState } from 'react';
import {
  Button,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import {
  MathRenderer,
  MathText,
  RenderResult
} from 'react-native-latex-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

export default function TabTwoScreen() {
  const [latex, setLatex] = useState('\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}');
  const [svg, setSvg] = useState<RenderResult | null>(null);

  const handleRenderDirect = () => {
    MathRenderer.Render(latex, (svg) => {  setSvg(svg);},{color: '#FFFF00'});
  };



  const handleClearCache = () => {
    MathRenderer.ClearCache();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>


      <FadeInTab>
        <View style={styles.container}>
          <TextInput
            value={latex}
            onChangeText={setLatex}
            style={styles.input}
            multiline
          />

          <View style={styles.buttonRow}>
            <Button
              title="渲染"
              onPress={handleRenderDirect}
            />

            <Button title="清除缓存" onPress={handleClearCache} />
          </View>

            {svg && (
                <SvgXml
                  xml={svg.svg}
                  width={svg.width*10}
                  height={svg.height*10}
                />
            )}
          <MathText
          content='计算电场强度\(\vec{E} = \frac{\vec{F}}{q}\)，若试探电荷\( q = 2×10^{-6} C\)，受到的电场力\(\vec{F} = 4×10^{-3}N\)，则电场强度的大小为？'
            textColor='#FFFFFF'
          />
          <View style={styles.cacheInfo}>

          </View>
        </View>
      </FadeInTab>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    gap: 10,
  },
  hidden: { width: 0, height: 0, overflow: 'hidden' },
  preview: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 10,
    borderRadius: 8,
    padding: 10,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  loading: { padding: 20 },
  cacheInfo: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});