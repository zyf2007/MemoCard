import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface LatexSvgProps {
  content: string;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
}

const LatexSvgRenderer: React.FC<LatexSvgProps> = ({
  content,
  textColor = '#ffffff',
  backgroundColor = '#000000',
  fontSize = 16,
}) => {
  // 这里的路径对应你存放文件的位置：android/app/src/main/assets/mathjax/tex-svg.js
  const mathJaxPath = Platform.OS === 'android' 
    ? 'file:///android_asset/mathjax/tex-svg.js' 
    : 'MathJax/tex-svg.js'; // iOS 需将文件夹拖入项目并选 "Create folder references"

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body {
            font-family: -apple-system, "Helvetica Neue", "Segoe UI", sans-serif;
            font-size: ${fontSize}px;
            color: ${textColor};
            background-color: ${backgroundColor};
            padding: 15px;
            margin: 0;
            line-height: 1.6;
            word-wrap: break-word;
          }
          /* 强制 SVG 公式颜色跟随文本颜色 */
          mjx-container {
            color: ${textColor} !important;
            fill: currentColor;
          }
          /* 块级公式间距优化 */
          mjx-container[display="true"] {
            margin: 1em 0 !important;
          }
        </style>
        <script>
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
              displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
              processEscapes: true
            },
            svg: {
              fontCache: 'global', // 提高渲染效率
              scale: 1.0
            },
            options: {
              enableMenu: false
            }
          };
        </script>
        <script id="MathJax-script" src="${mathJaxPath}"></script>
      </head>
      <body>
        ${content.replace(/\n/g, '<br/>')}
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlTemplate }}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        // 性能与交互优化
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // 确保容器充满可用空间
  },
});

export default LatexSvgRenderer;