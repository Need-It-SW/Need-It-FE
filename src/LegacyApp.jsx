import { useEffect } from 'react';
import markup from './legacy-markup.html?raw';

/**
 * Compatibility layer: React mounts the original NEED IT markup once.
 * The existing imperative JavaScript continues to own this DOM subtree.
 * Migrate each feature to native React components before introducing React state here.
 */
export default function LegacyApp() {
  useEffect(() => {
    const urls = ['/legacy/js/config.js', '/legacy/js/api-client.js', '/legacy/js/app.js'];
    let cancelled = false;
    const appended = [];
    (async () => {
      for (const url of urls) {
        if (cancelled) break;
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.onload = resolve;
          script.onerror = () => reject(new Error(`스크립트 로드 실패: ${url}`));
          document.body.appendChild(script);
          appended.push(script);
        });
      }
    })().catch(console.error);
    return () => { cancelled = true; /* Legacy listeners have no cleanup; avoid remounting. */ };
  }, []);
  return <div id="legacy-app" dangerouslySetInnerHTML={{ __html: markup }} />;
}
