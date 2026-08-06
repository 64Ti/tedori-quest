// tests/feedback.test.js
// ★harness.js のみを import すること。runner.js / node:test を直接使わない
import { describe, test, assert } from './harness.js';
import * as C from '../js/config.js';
import * as feedback from '../js/feedback.js';

// このフェーズ（Phase 6）の対象: TEST-31〜41, 46〜50
// feedback.js は localStorage/fetch/navigator に触れるため純粋関数モジュールではない
// （calc.js/selectors.js/config.js のみが対象の CLAUDE.md 制約6の対象外）。

const RATE_KEY = 'tq_submit_log';   // ★feedback.js 内の同名定数と一致させること（非export）

function resetRateLimit(){
  try{ localStorage.removeItem(RATE_KEY); }catch{ /* noop */ }
}

function freshState(){
  return { meta: { feedbackBonusGranted: false } };
}

/**
 * globalThis.fetch を一時的に差し替える。fetch は feedback.js 内で毎回グローバルを
 * 参照して呼ばれるため、モジュール読み込み後でも差し替えが効く。
 * @param {(url:string, opts:object) => Promise<Response>} impl
 * @returns {() => void} 元に戻す関数
 */
function mockFetch(impl){
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return () => { globalThis.fetch = original; };
}

/**
 * navigator.onLine を一時的に差し替える（読み取り専用プロパティのため defineProperty を使う）。
 * @param {boolean} value
 * @returns {() => void} 元に戻す関数
 */
function mockOnline(value){
  const original = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine')
    ?? Object.getOwnPropertyDescriptor(navigator, 'onLine');
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
  return () => {
    if (original) Object.defineProperty(navigator, 'onLine', original);
  };
}

// ★runner.js の test() は node:test と同じく、非同期テストの完了を待たずに
//   次の test() 呼び出しへ進む（= describe 内の非同期テストは並行実行される）。
//   feedback.js の isSubmitting はモジュール共有の可変状態であり、複数テストが
//   同時に sendFeedback() を呼ぶと衝突する。そのためテストファイル側で直列化する。
let chain = Promise.resolve();
function sequential(fn){
  const result = chain.then(fn);
  chain = result.catch(() => {});   // 前のテストが失敗しても後続は実行する
  return result;
}

describe('8.5 フィードバック・ボーナス', () => {
  test('TEST-31: ボーナス初回 → levelBonus:1', () => sequential(async () => {
    resetRateLimit();
    const restore = mockFetch(async () => new Response(JSON.stringify({ success:true }), { status:200 }));
    const state = freshState();
    const result = await feedback.sendFeedback({ comment:'テスト' }, state);
    restore();
    assert.equal(result.success, true);
    assert.equal(result.levelBonus, 1);
    assert.equal(state.meta.feedbackBonusGranted, true);
  }));

  test('TEST-32: ボーナス2回目（生涯1回）→ levelBonus:0', () => sequential(async () => {
    resetRateLimit();
    const restore = mockFetch(async () => new Response(JSON.stringify({ success:true }), { status:200 }));
    const state = { meta: { feedbackBonusGranted: true } };   // 既に初回で付与済みの状態を模擬
    const result = await feedback.sendFeedback({ comment:'テスト' }, state);
    restore();
    assert.equal(result.success, true);
    assert.equal(result.levelBonus, 0);
  }));

  test('TEST-33: 送信失敗時は非付与（HTTP200かつsuccess:false）', () => sequential(async () => {
    resetRateLimit();
    const restore = mockFetch(async () => new Response(JSON.stringify({ success:false }), { status:200 }));
    const state = freshState();
    const result = await feedback.sendFeedback({ comment:'テスト' }, state);
    restore();
    assert.equal(result.success, false);
    assert.equal(result.levelBonus, 0);
    assert.equal(state.meta.feedbackBonusGranted, false);
  }));

  test('TEST-34: タイムアウト（10秒無応答）→ reason:timeout', () => sequential(async () => {
    resetRateLimit();
    const restore = mockFetch((url, opts) => new Promise((resolve, reject) => {
      opts.signal.addEventListener('abort', () => {
        const err = new Error('aborted'); err.name = 'AbortError'; reject(err);
      });
    }));
    const state = freshState();
    const result = await feedback.sendFeedback({ comment:'テスト' }, state);
    restore();
    assert.equal(result.reason, 'timeout');
    assert.equal(result.levelBonus, 0);
  }));

  test('TEST-35: 二重送信ガード（同時に2回）→ 2回目はin_flight', () => sequential(async () => {
    resetRateLimit();
    const restore = mockFetch(async () => {
      await new Promise(r => setTimeout(r, 50));
      return new Response(JSON.stringify({ success:true }), { status:200 });
    });
    const state = freshState();
    const p1 = feedback.sendFeedback({ comment:'a' }, state);
    const p2 = feedback.sendFeedback({ comment:'b' }, state);   // 1回目の同期部分の直後に呼ぶ
    const [r1, r2] = await Promise.all([p1, p2]);
    restore();
    assert.equal(r2.reason, 'in_flight');
    assert.equal(r2.levelBonus, 0);
    assert.equal(r1.success, true);
  }));

  test('TEST-36: Honeypot → success:true・levelBonus:0・fetchを呼ばない', () => sequential(async () => {
    resetRateLimit();
    let called = false;
    const restore = mockFetch(async () => { called = true; return new Response('{}', { status:200 }); });
    const state = freshState();
    const result = await feedback.sendFeedback({ botcheck:'bot', comment:'x' }, state);
    restore();
    assert.equal(result.success, true);
    assert.equal(result.levelBonus, 0);
    assert.equal(called, false);
  }));

  test('TEST-37: クライアントレート制限（4回目）→ reason:rate_limited', () => sequential(async () => {
    const now = Date.now();
    // 24時間以内に既に3回送信済み（＝上限）という状態を直接作る
    localStorage.setItem(RATE_KEY, JSON.stringify([now - 300000, now - 200000, now - 100000]));
    const restore = mockFetch(async () => { throw new Error('rate_limited時はfetchが呼ばれてはならない'); });
    const state = freshState();
    const result = await feedback.sendFeedback({ comment:'x' }, state);
    restore();
    resetRateLimit();
    assert.equal(result.reason, 'rate_limited');
    assert.equal(result.levelBonus, 0);
  }));

  test('TEST-38: クールダウン（送信後10秒以内の再送信）→ reason:cooldown, waitSec', () => sequential(async () => {
    const now = Date.now();
    localStorage.setItem(RATE_KEY, JSON.stringify([now - 1000]));   // 1秒前に1回送信済み
    const state = freshState();
    const result = await feedback.sendFeedback({ comment:'x' }, state);
    resetRateLimit();
    assert.equal(result.reason, 'cooldown');
    assert.ok(Number.isFinite(result.waitSec) && result.waitSec > 0 && result.waitSec <= 9);
  }));

  test('TEST-39: サーバースロットリング（HTTP429）→ reason:throttled', () => sequential(async () => {
    resetRateLimit();
    const restore = mockFetch(async () => new Response(JSON.stringify({ success:false }), { status:429 }));
    const state = freshState();
    const result = await feedback.sendFeedback({ comment:'x' }, state);
    restore();
    assert.equal(result.reason, 'throttled');
  }));

  test('TEST-40: オフライン → reason:offline・fetchを呼ばない', () => sequential(async () => {
    resetRateLimit();
    let called = false;
    const restore = mockFetch(async () => { called = true; return new Response('{}', { status:200 }); });
    const restoreOnline = mockOnline(false);
    const state = freshState();
    const result = await feedback.sendFeedback({ comment:'x' }, state);
    restoreOnline();
    restore();
    assert.equal(result.reason, 'offline');
    assert.equal(called, false);
  }));

  test('TEST-41: ENDPOINTの同一オリジン（/api/feedback で始まる。Web3Forms直叩き禁止）', () => sequential(async () => {
    assert.ok(C.ENDPOINT.startsWith('/api/feedback'));
  }));
});

describe('8.6 永続化・サニタイズ（フィードバックのマスク処理）', () => {
  test('TEST-46: 全角メールのマスク', () => {
    const result = feedback.sanitizePayload({ comment: 'ｔｅｓｔ＠ｅｘａｍｐｌｅ．ｃｏｍ' });
    assert.equal(result.comment, '***@***');
  });

  test('TEST-47: ハイフン無し電話のマスク', () => {
    const result = feedback.sanitizePayload({ comment: '09012345678' });
    assert.equal(result.comment, '***-****-****');
  });

  test('TEST-48: ハイフン付き電話のマスク', () => {
    const result = feedback.sanitizePayload({ comment: '090-1234-5678' });
    assert.equal(result.comment, '***-****-****');
  });

  test('TEST-49: 絵文字の温存（ZWJ結合絵文字が分断されない）', () => {
    const original = '👨‍👩‍👧 テスト';
    const result = feedback.sanitizePayload({ comment: original });
    assert.equal(result.comment, original);
  });

  test('TEST-50: 文字数上限（2,000字→1,000字に切り詰め）', () => {
    const result = feedback.sanitizePayload({ comment: 'あ'.repeat(2000) });
    assert.equal(result.comment.length, C.COMMENT_MAX_LENGTH);
  });
});
