// TabTwoScreen.tsx
import FadeInTab from '@/components/ui/FadeInTab';
import { MathRenderer } from '@/scripts/mathjax/GlobalMathRenderer';
import {
  RenderResult
} from '@/scripts/mathjax/useMathJax';
import React, { useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

export default function TabTwoScreen() {
  const [latex, setLatex] = useState('$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$');
  const [svg, setSvg] = useState<RenderResult | null>(null);

  const handleRenderDirect = () => {
    MathRenderer.Render(latex, (svg) => {  setSvg(svg);});
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
              title="直接渲染 (await)"
              onPress={handleRenderDirect}
            />

            <Button title="清除缓存" onPress={handleClearCache} />
          </View>



          <ScrollView style={styles.preview}>
            {svg && (
              <View style={styles.svgContainer}>
                <SvgXml
                  xml={svg.svg}
                  width={svg.width*10}
                  height={svg.height*10}
                />
              </View>
            )}
          </ScrollView>

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