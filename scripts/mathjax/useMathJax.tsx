// MathJaxRenderer.tsx
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import RNFS from 'react-native-fs';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface RenderResult {
  svg: string;
  width: number;
  height: number;
  viewBox: string | null;
}

export interface MathJaxRendererRef {
  render: (latex: string, onComplete: (result: RenderResult) => void) => void;
  clearCache: (latex?: string) => void;
  getCacheSize: () => number;
  isReady: () => boolean;
}

interface MathJaxRendererProps {
  initialCache?: string[];
  maxCacheSize?: number;
  onRenderComplete?: (result: RenderResult, latex: string) => void;
  onRenderError?: (error: string, latex: string) => void;
  onReady?: () => void;
}

interface QueueItem {
  latex: string;
  onComplete: (result: RenderResult) => void;
}

export const MathJaxRenderer = forwardRef<MathJaxRendererRef, MathJaxRendererProps>(
  (
    {
      initialCache = [],
      maxCacheSize = 100,
      onRenderComplete,
      onRenderError,
      onReady,
    },
    ref
  ) => {
    const [ready, setReady] = useState(false);
    const scriptRef = useRef<string | null>(null);
    const webViewRef = useRef<WebView>(null);
    
    // SVG 缓存 Map: key = latex string, value = RenderResult
    const cacheRef = useRef<Map<string, RenderResult>>(new Map());
    
    // 渲染队列
    const queueRef = useRef<QueueItem[]>([]);
    
    // 当前正在渲染的项
    const currentRef = useRef<QueueItem | null>(null);

    // 预加载 MathJax 脚本
    useEffect(() => {
      const load = async () => {
        try {
          let content: string;

          if (Platform.OS === 'android') {
            content = await RNFS.readFileAssets('mathjax/tex-svg.js');
          } else if (Platform.OS === 'ios') {
            const path = `${RNFS.MainBundlePath}/mathjax/tex-svg.js`;
            content = await RNFS.readFile(path, 'utf8');
          } else {
            throw new Error('Unsupported platform');
          }

          scriptRef.current = content;
          setReady(true);
          onReady?.();
          console.log('MathJax Ready')
        } catch (err) {
          console.error('Failed to load MathJax:', err);
        }
      };
      load();
    }, [onReady]);

    // 预渲染 initialCache
    useEffect(() => {
      if (ready && initialCache.length > 0) {
        initialCache.forEach((latex) => {
          if (!cacheRef.current.has(latex)) {
            // 使用 setTimeout 避免阻塞
            setTimeout(() => {
              render(latex, () => {});
            }, 0);
          }
        });
      }
    }, [ready, initialCache]);

    // 生成 HTML
    const generateHTML = useCallback((): string => {
      if (!scriptRef.current) throw new Error('MathJax not loaded');

      return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
window.MathJax = {
  svg: { fontCache: 'none', scale: 1.2 },
  tex: { inlineMath: [['$','$'], ['\\\\(','\\\\)']] },
  startup: {
    pageReady: () => MathJax.startup.defaultPageReady().then(() => {
      window.render = async (latex) => {
        try {
          const svg = await MathJax.tex2svgPromise(latex, {display: true});
          const el = svg.querySelector('svg');
          let html = el.outerHTML.replace(/currentColor/g, 'black');
          if (!html.includes('xmlns=')) html = html.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
          return { 
            success: true, 
            svg: html, 
            w: el.getAttribute('width'), 
            h: el.getAttribute('height'),
            vb: el.getAttribute('viewBox')
          };
        } catch(e) {
          return { success: false, error: e.message };
        }
      };
      window.onMathJaxReady && window.onMathJaxReady();
    })
  }
};
</script>
<script>${scriptRef.current}</script>
</head>
<body style="margin:0;padding:0">
<div id="out"></div>
<script>
window.onMathJaxReady = () => {
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
};

window.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'render') {
    render(data.latex).then(r => {
      document.getElementById('out').innerHTML = r.svg || '';
      window.ReactNativeWebView.postMessage(JSON.stringify({ 
        type: 'result', 
        ...r 
      }));
    });
  }
});
</script>
</body>
</html>`;
    }, []);

    // 处理队列：发送下一个渲染请求
    const processQueue = useCallback(() => {
      console.log('Process queue:', queueRef.current,"currentRef.current",currentRef.current);
      if (queueRef.current.length === 0) {
        console.log('Queue empty, no more items to process.');
        return;
      }
      

      const next = queueRef.current.shift()!;
      currentRef.current = next;
      console.log('Injecting:', next.latex);
      webViewRef.current?.injectJavaScript(`
        window.postMessage(JSON.stringify({
          type: 'render',
          latex: ${JSON.stringify(next.latex)}
        }));
        true;
      `);
    }, []);

    // 渲染方法（加入队列）
    const render = useCallback((latex: string, onComplete: (result: RenderResult) => void) => {
      // 检查缓存
      console.log('Cache check:', latex);
      
      if (cacheRef.current.has(latex)) {
        console.log('Cache hit:', latex, cacheRef.current.get(latex)?.svg.slice(0, 50),'...');

        const cached = cacheRef.current.get(latex);
        onComplete(cached as RenderResult);
        onRenderComplete?.(cached as RenderResult, latex);
        return;
      }
      console.log('Cache miss:', latex);

      // 加入队列
      queueRef.current.push({ latex, onComplete });
      console.log('Queue pushed:', latex);
      // 尝试处理队列
      processQueue();
    }, [onRenderComplete, processQueue]);

    // 处理 WebView 消息
    const handleMessage = useCallback((event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'ready') {
          return;
        }

        if (data.type === 'result') {
          const current = currentRef.current;
          if (!current) return;

          // 清空当前
          currentRef.current = null;

          if (data.success) {
            const result: RenderResult = {
              svg: data.svg,
              width: Number(data.w.replace('ex', '')),
              height: Number(data.h.replace('ex', '')),
              viewBox: data.vb || null,
            };

            // 存入缓存，控制缓存大小
            if (cacheRef.current.size >= maxCacheSize) {
              const firstKey = cacheRef.current.keys().next().value;
              cacheRef.current.delete(firstKey as string);
            }
            cacheRef.current.set(current.latex, result);

            // 先调用当前项的回调
            current.onComplete(result);
            // 再调用全局回调
            onRenderComplete?.(result, current.latex);
          } else {
            onRenderError?.(data.error, current.latex);
          }

          // 继续处理队列中的下一个
          processQueue();
        }
      } catch (e) {
        console.error('Failed to handle message:', e);
        currentRef.current = null;
        processQueue();
      }
    }, [maxCacheSize, onRenderComplete, onRenderError, processQueue]);

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      render,
      clearCache: (latex?: string) => {
        if (latex) {
          cacheRef.current.delete(latex);
        } else {
          cacheRef.current.clear();
        }
      },
      getCacheSize: () => cacheRef.current.size,
      isReady: () => ready,
    }), [render, ready]);

    if (!ready) {
      return null;
    }

    return (
      <View style={styles.hidden}>
        <WebView
          ref={webViewRef}
          source={{ html: generateHTML() }}
          onMessage={handleMessage}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          style={{ width: 1, height: 1, opacity: 0 }}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'hidden',
    opacity: 0,
  },
});

MathJaxRenderer.displayName = 'MathJaxRenderer';

export default MathJaxRenderer;