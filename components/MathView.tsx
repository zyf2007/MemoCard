import React, { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface LatexSvgProps {
  content: string;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
}

const TextWithLatex: React.FC<LatexSvgProps> = ({
  content,
  textColor = '#000000',
  backgroundColor = '#ffffff',
  fontSize = 16,
}) => {
  // 状态：存储计算出的高度，初始给一个较小值
  const [webViewHeight, setWebViewHeight] = useState(fontSize * 2);

  const mathJaxPath = Platform.OS === 'android' 
    ? 'file:///android_asset/mathjax/tex-svg.js' 
    : 'MathJax/tex-svg.js';

  // 接收来自 WebView 的高度数据
  const onMessage = (event: WebViewMessageEvent) => {
    const height = Number(event.nativeEvent.data);
    if (height) {
      setWebViewHeight(height);
    }
  };

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body {
            font-family: -apple-system, sans-serif;
            font-size: ${fontSize}px;
            color: ${textColor};
            background-color: ${backgroundColor};
            padding: 0;
            margin: 0;
            line-height: 1.6;
            overflow: hidden; /* 禁用 body 滚动，由原生容器控制 */
          }
          #content-wrapper {
            padding: 10px;
            display: inline-block;
            width: 100%;
            box-sizing: border-box;
          }
          mjx-container { color: ${textColor} !important; fill: currentColor; }
        </style>
        <script>
          window.MathJax = {
            tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] },
            svg: { fontCache: 'global' },
            startup: {
              pageReady: () => {
                return MathJax.startup.defaultPageReady().then(() => {
                  // 公式渲染完成后，计算实际高度并发送给 RN
                  setTimeout(sendHeight, 100);
                });
              }
            }
          };

          function sendHeight() {
            const height = document.getElementById('content-wrapper').scrollHeight;
            window.ReactNativeWebView.postMessage(height.toString());
          }

          // 窗口尺寸变化时重新计算
          window.addEventListener('resize', sendHeight);
        </script>
        <script id="MathJax-script" src="${mathJaxPath}"></script>
      </head>
      <body>
        <div id="content-wrapper">
          ${content.replace(/\n/g, '<br/>')}
        </div>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height: webViewHeight }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlTemplate }}
        onMessage={onMessage}
        scrollEnabled={false} 
        allowFileAccess={true}
        javaScriptEnabled={true}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
});

export default TextWithLatex;