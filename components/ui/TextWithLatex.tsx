import React, { useState } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface TextWithLatexProps {
  content: string;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  style?: ViewStyle;
  centered?: boolean;
  // 新增：渲染完成的回调函数
  onRenderComplete?: () => void;
}

const TextWithLatex: React.FC<TextWithLatexProps> = ({
  content,
  textColor = '#000000',
  backgroundColor = 'transparent',
  fontSize = 16,
  style = {},
  centered = false,
  onRenderComplete, // 解构出回调函数
}) => {
  // 状态：存储计算出的高度，初始给一个较小值
  const [webViewHeight, setWebViewHeight] = useState(fontSize * 2);

  const mathJaxPath = Platform.OS === 'android' 
    ? 'file:///android_asset/mathjax/tex-svg.js' 
    : 'MathJax/tex-svg.js';


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
            ${backgroundColor==="transparent" ? '' : 'background-color:'+backgroundColor+';'}
            margin: 0;
            line-height: 1.2;
            overflow: hidden; /* 禁用 body 滚动，由原生容器控制 */
            ${centered ? 'text-align: center;' : ''} /* 应用文本对齐样式 */
          }
          #content-wrapper {
            display: inline-block;
            width: 100%;
            box-sizing: border-box;
            ${centered ? 'text-align: center;' : 'text-align: left;'} 
          }
          mjx-container { 
            color: ${textColor} !important; 
            fill: currentColor;
            ${centered ? 'margin: 0 auto;' : ''} /* 确保LaTeX公式也居中 */
          }
        </style>
        <script>
          window.MathJax = {
            tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] },
            svg: { fontCache: 'global' },
            startup: {
              pageReady: () => {
                return MathJax.startup.defaultPageReady().then(() => {
                  // 公式渲染完成后通知RN
                  window.ReactNativeWebView.postMessage('render_complete');
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

  // 重构消息处理逻辑，区分渲染完成和高度更新
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;
    
    // 处理渲染完成的消息
    if (data === 'render_complete') {
      // 确保回调函数存在且是函数类型
      typeof onRenderComplete === 'function' && onRenderComplete();
      return;
    }

    // 处理高度更新的消息
    const height = Number(data);
    if (!isNaN(height) && height > 0) {
      setWebViewHeight(height);
    }
  };

  return (
    <View style={[styles.container, { height: webViewHeight }, style,{ backgroundColor: 'transparent' }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlTemplate }}
        onMessage={handleWebViewMessage} // 使用重构后的消息处理函数
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