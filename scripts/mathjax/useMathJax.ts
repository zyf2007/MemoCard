// useMathJax.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

export interface RenderResult {
  svg: string;
  width: string | null;
  height: string | null;
  viewBox: string | null;
}
export function useMathJax() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const scriptRef = useRef<string | null>(null);

  // 预加载 MathJax 脚本
// 预加载 MathJax 脚本
useEffect(() => {
  const load = async () => {
    try {
      let content: string;
      
      if (Platform.OS === 'android') {
        // Android: 使用 readFileAssets 读取 assets 目录
        content = await RNFS.readFileAssets('mathjax/tex-svg.js');
      } else if (Platform.OS === 'ios') {
        // iOS: 使用完整路径
        const path = `${RNFS.MainBundlePath}/mathjax/tex-svg.js`;
        content = await RNFS.readFile(path, 'utf8');
      } else {
        throw new Error('Unsupported platform');
      }
      
      scriptRef.current = content;
      setReady(true);
    } catch (err) {
      console.error('Failed to load MathJax:', err);
    }
  };
  load();
}, []);

  /**
   * 生成渲染用的 HTML 字符串
   */
  const generateHTML = useCallback((latex: string): string => {
    if (!scriptRef.current) throw new Error('MathJax not loaded');

    const escaped = latex
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

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
          return { success: true, svg: html, w: el.getAttribute('width'), h: el.getAttribute('height') };
        } catch(e) {
          return { success: false, error: e.message };
        }
      };
      window.onMathJaxReady();
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
  render(\`${escaped}\`).then(r => {
    document.getElementById('out').innerHTML = r.svg;
    window.ReactNativeWebView.postMessage(JSON.stringify(r));
  });
};
</script>
</body>
</html>`;
  }, []);

  return {
    ready,
    loading,
    generateHTML
  };
}