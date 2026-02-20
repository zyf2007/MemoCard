
import FadeInTab from '@/components/ui/FadeInTab';
import type { RenderResult } from '@/scripts/mathjax/useMathJax';
import { useMathJax } from '@/scripts/mathjax/useMathJax';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { WebView } from 'react-native-webview';
export default function TabTwoScreen() {
  const [latex, setLatex] = useState('$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$');
  const [svg, setSvg] = useState<RenderResult | null>(null);
  const { ready, generateHTML } = useMathJax();

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.success) {
        setSvg({
          svg: data.svg,
          width: data.w,
          height: data.h,
          viewBox: null
        });
      }
    } catch (e) {
      console.error(e);
    }
  };
  console.log(svg);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FadeInTab>
        return (
        <View style={styles.container}>
          <TextInput
            value={latex}
            onChangeText={setLatex}
            style={styles.input}
            multiline
          />

          {!ready ? (
            <View style={styles.loading}><ActivityIndicator /></View>
          ) : (
            <View style={styles.hidden}>
              <WebView
                source={{ html: generateHTML(latex) }}
                onMessage={handleMessage}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                style={{ width: 1, height: 1, opacity: 0 }}
              />
            </View>
          )}

          <ScrollView style={styles.preview}>
            {svg && (
              <SvgXml
                xml={svg.svg}
                width={'200'}
                height={'60'}

              />
            )}

          </ScrollView>
        </View>
        );

      </FadeInTab>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { height: 100, borderWidth: 1, marginBottom: 10, padding: 10 },
  hidden: { width: 0, height: 0, overflow: 'hidden' },
  preview: { flex: 1, borderWidth: 1, marginTop: 10 },
  loading: { padding: 20 }
});

