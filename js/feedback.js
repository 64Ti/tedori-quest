// feedback.js — フィードバック送信（§6.8）。DOM/localStorage/fetch/navigator に触れるため
// calc.js/selectors.js/config.js とは異なり純粋関数モジュールではない（CLAUDE.md 制約6の対象外）。
import { ENDPOINT, RATE_LIMIT, FETCH_TIMEOUT_MS, COMMENT_MAX_LENGTH } from './config.js';

let isSubmitting = false;

/**
 * フィードバックを送信する。二重送信・Honeypot・クライアントレート制限・オフライン・
 * タイムアウトをすべてガードし、成功時のみ生涯1回のレベルボーナスを付与する。
 * @param {{botcheck?:string, comment?:string, [key:string]:*}} feedbackData
 * @param {{meta:{feedbackBonusGranted:boolean}}} state store.js の state（Proxyでも可）
 * @returns {Promise<{success:boolean, reason?:string, waitSec?:number, levelBonus:number}>}
 */
export async function sendFeedback(feedbackData, state){
  // ── ガード群（すべて await の前に置く）
  if (isSubmitting) return { success:false, reason:'in_flight', levelBonus:0 };

  if (feedbackData.botcheck){                                  // Honeypot：成功したフリで握り潰す
    return { success:true, reason:'honeypot', levelBonus:0 };
  }

  const rate = checkRateLimit();
  if (!rate.ok){
    return { success:false, reason:rate.reason, waitSec:rate.waitSec, levelBonus:0 };
  }

  if (!navigator.onLine) return { success:false, reason:'offline', levelBonus:0 };

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);   // fetch に既定のタイムアウトは無い
  isSubmitting = true;

  try{
    const res = await fetch(ENDPOINT, {                        // ★同一オリジンのプロキシ
      method:'POST',
      headers:{ 'Content-Type':'application/json', Accept:'application/json' },
      body: JSON.stringify(sanitizePayload(feedbackData)),
      signal: ctrl.signal
    });

    let json = {};
    try{ json = await res.json(); }catch{ /* HTMLエラーページ等 */ }

    if (res.status === 429) return { success:false, reason:'throttled', levelBonus:0 };
    // ★res.ok だけでは Web3Forms の success:false を見逃す（CLAUDE.md 制約2）
    if (!res.ok || json.success !== true) return { success:false, reason:'api_error', levelBonus:0 };

    rate.commit();
    return { success:true, levelBonus: grantFeedbackBonus(state) };

  }catch(e){
    return { success:false, reason: e.name === 'AbortError' ? 'timeout' : 'network', levelBonus:0 };
  }finally{
    clearTimeout(timeout);
    isSubmitting = false;
  }
}

/**
 * フィードバックボーナス（生涯1回のみ）を付与する。
 * @param {{meta:{feedbackBonusGranted:boolean}}} state
 * @returns {number} 付与した場合 1、既に付与済みなら 0
 */
function grantFeedbackBonus(state){
  if (state.meta.feedbackBonusGranted) return 0;               // ★生涯1回のみ
  state.meta.feedbackBonusGranted = true;
  return 1;
}

// --- レート制限（sessionStorage はタブ単位でリセットされるため localStorage を使う） ---
const RATE_KEY = 'tq_submit_log';

/**
 * クライアント側のレート制限（1日の上限・送信間隔）を判定する。
 * @returns {{ok:true, commit:() => void} | {ok:false, reason:string, waitSec?:number}}
 */
export function checkRateLimit(){
  let log = [];
  try{ log = JSON.parse(localStorage.getItem(RATE_KEY) || '[]'); }catch{ log = []; }
  const now = Date.now();
  log = log.filter(t => now - t < RATE_LIMIT.windowMs);        // 24時間で自動失効

  if (log.length >= RATE_LIMIT.maxPerDay) return { ok:false, reason:'rate_limited' };
  if (log.length && now - log.at(-1) < RATE_LIMIT.cooldownMs){
    return { ok:false, reason:'cooldown',
             waitSec: Math.ceil((RATE_LIMIT.cooldownMs - (now - log.at(-1))) / 1000) };
  }
  return { ok:true, commit(){
    log.push(Date.now());
    try{ localStorage.setItem(RATE_KEY, JSON.stringify(log)); }catch{}
  }};
}

// --- サニタイズ -------------------------------------------------------------

/**
 * 自由記述欄をサニタイズする。文字数上限・制御文字除去・全角の半角化のうえで
 * メールアドレス・電話番号をマスクする。絵文字（結合文字・ZWJ・異体字セレクタ）は温存する。
 * @param {{comment?:string, [key:string]:*}} data
 * @returns {object} comment 以外のフィールドはそのまま複製される
 */
export function sanitizePayload(data){
  const clean = { ...data };
  if (clean.comment){
    let s = String(clean.comment).slice(0, COMMENT_MAX_LENGTH);

    // ① 制御文字のみ除去。\p{S}（記号・絵文字）と \p{M}（結合文字）を許可し、
    //    ZWJ(U+200D)・異体字セレクタ(U+FE0F) を温存して絵文字の分断を防ぐ
    // ★正規表現リテラルに ‍ 等を直書きすると、エディタ・コピー&ペースト経由で
    //   不可視文字そのものに化けて事故る恐れがあるため、文字列＋RegExpコンストラクタで
    //   エスケープシーケンスの文字列表現のまま保持する。
    const KEEP_PATTERN = new RegExp('[^\\p{L}\\p{N}\\p{P}\\p{S}\\p{M}\\p{Z}\\u200D\\uFE0F\\n]', 'gu');
    s = s.replace(KEEP_PATTERN, '');

    // ② 全角英数字・記号を半角化してからマスク（全角による回避を封じる）
    s = s.replace(/[Ａ-Ｚａ-ｚ０-９＠．＋＿－]/g,
          c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

    s = s.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '***@***');                    // メール

    // ③ ハイフン・空白を任意化し、国際表記にも対応
    s = s.replace(/(?:\+81[-\s]?|0)\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/g, '***-****-****');

    clean.comment = s.replace(/\r\n?/g, '\n').trim();
  }
  return clean;
}
