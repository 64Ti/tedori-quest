// js/vendor.js
// ★外部依存の唯一の入り口。CDN URL をここ以外に書かないこと（Node-Ready N-1）。
//   将来 npm + バンドラを導入する場合、本ファイルだけを差し替えれば移行が完了する。

/** html2canvas のバージョン。★latest 指定は破壊的変更で壊れるため固定する */
const HTML2CANVAS_VERSION = '1.4.1';

let _html2canvas = null;

/**
 * html2canvas を遅延ロードして返す。2回目以降はキャッシュを返す。
 * @returns {Promise<Function>}
 */
export async function loadHtml2Canvas(){
  if (_html2canvas) return _html2canvas;

  // === ビルドレス構成（現行）===
  const mod = await import(
    `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/${HTML2CANVAS_VERSION}/html2canvas.esm.js`);

  // === npm + バンドラ導入時は上記2行を下記に差し替えるだけでよい ===
  // const mod = await import('html2canvas');

  _html2canvas = mod.default ?? mod;
  return _html2canvas;
}

/** html2pdf.js のバージョン。★latest 指定は破壊的変更で壊れるため固定する */
const HTML2PDF_VERSION = '0.14.0';

let _html2pdfPromise = null;

/**
 * html2pdf.js を遅延ロードして返す（PDF出力機能・2026-08-08）。
 * ★html2pdf.js はUMDバンドルのみ配布されておりESM importが使えないため、
 *   <script>タグを動的に挿入してグローバル window.html2pdf を待つ方式にする。
 *   CDN URLはこのファイル以外に書かない（Node-Ready N-1）。2回目以降はキャッシュを返す。
 * @returns {Promise<Function>}
 */
export function loadHtml2Pdf(){
  if (_html2pdfPromise) return _html2pdfPromise;
  _html2pdfPromise = new Promise((resolve, reject) => {
    if (window.html2pdf){ resolve(window.html2pdf); return; }

    // === ビルドレス構成（現行）===
    const script = document.createElement('script');
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/${HTML2PDF_VERSION}/html2pdf.bundle.min.js`;

    // === npm + バンドラ導入時は上記2行を下記に差し替えるだけでよい ===
    // resolve((await import('html2pdf.js')).default); return;

    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => reject(new Error('html2pdf load failed'));
    document.head.appendChild(script);
  });
  return _html2pdfPromise;
}
