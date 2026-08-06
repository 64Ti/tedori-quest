// 依存ゼロの最小テストランナー。
// ★API は node:test / node:assert/strict と互換にすること（N-3）
//   describe(name, fn) / test(name, fn) / assert.equal(actual, expected)
const results = [];
const pending = [];   // ★非同期テストの完了待ち用。report() がこれを待ってから描画する
let currentSuite = '';

/**
 * テストをグループ化する。node:test の describe と同じシグネチャ。
 * ネストした場合は「親 > 子」の形で分類名を連結する。
 * @param {string} name グループ名
 * @param {() => void} fn グループ本体（この中で test() を呼ぶ）
 * @returns {void}
 */
export function describe(name, fn){
  const prev = currentSuite;
  currentSuite = prev ? `${prev} > ${name}` : name;
  fn();
  currentSuite = prev;
}

/**
 * テスト1件を実行し、結果を蓄積する。node:test の test と同じシグネチャ。
 * テストIDは名前の先頭に `TEST-NN: ` の形式で埋め込む（node:test の
 * test() は ID 用の引数を持たないため）。
 * @param {string} name テスト名
 * @param {() => (void|Promise<void>)} fn テスト本体。throw で失敗とみなす
 * @returns {void|Promise<void>} 非同期テストの場合のみ Promise を返す
 */
export function test(name, fn){
  const suite = currentSuite;
  try{
    const r = fn();
    if (r instanceof Promise){            // node:test と同じく async をサポート
      const tracked = r.then(
        () => results.push({ suite, name, pass:true }),
        e  => results.push({ suite, name, pass:false, message:e.message }));
      pending.push(tracked);              // report() が待つ対象に登録する
      return tracked;
    }
    results.push({ suite, name, pass:true });
  }catch(e){
    results.push({ suite, name, pass:false, message:e.message });
  }
}

// --- node:assert/strict と同じ名前・同じ引数順のみを定義する ---------------
// ★notOk / notIncludes のような独自メソッドを足さないこと。
//   Node へ移行した瞬間に動かなくなる。否定は assert.ok(!x) で表現する。
export const assert = {
  equal(actual, expected, msg){
    if (!Object.is(actual, expected))
      throw new Error(msg ?? `期待値 ${expected} / 実際 ${actual}`);
  },
  notEqual(actual, expected, msg){
    if (Object.is(actual, expected)) throw new Error(msg ?? `${actual} であってはならない`);
  },
  deepEqual(actual, expected, msg){
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    if (a !== b) throw new Error(msg ?? `期待値 ${b} / 実際 ${a}`);
  },
  ok(value, msg){ if (!value) throw new Error(msg ?? `真であるべき値が ${value}`); },
  match(str, re, msg){
    if (!re.test(String(str))) throw new Error(msg ?? `${str} が ${re} に一致しない`);
  },
  throws(fn, msg){
    try{ fn(); }catch{ return; }
    throw new Error(msg ?? '例外が投げられなかった');
  }
};

// --- 結果描画（ブラウザ専用。Node 側では使わない） --------------------------
/**
 * 蓄積した結果を DOM に描画し、集計を返す。
 * ★非同期テスト（test() が Promise を返したもの）の完了を待ってから描画する。
 *   これを待たずに描画すると、まだ結果が push されていないテストが
 *   一覧から丸ごと欠落した状態で「全テスト通過」と表示されてしまう。
 * ここは本番UIではなくテスト結果表示のため、innerHTML の全置換で構わない
 * （制約5の差分描画は index.html 側の要件）。
 * @param {HTMLElement} el 描画先の要素
 * @returns {Promise<{pass:number, fail:number, total:number}>} 集計結果
 */
export async function report(el){
  await Promise.allSettled(pending);

  const pass = results.filter(r => r.pass).length;
  const fail = results.length - pass;

  el.innerHTML = `
    <h1 class="${fail ? 'fail' : 'pass'}">
      ${fail ? `❌ ${fail} 件失敗` : '✅ 全テスト通過'}（${pass}/${results.length}）
    </h1>
    <table>
      <thead><tr><th></th><th>検証内容</th><th>分類</th><th>詳細</th></tr></thead>
      <tbody>${results.map(r => `
        <tr class="${r.pass ? 'pass' : 'fail'}">
          <td>${r.pass ? '✅' : '❌'}</td>
          <td>${r.name}</td>
          <td>${r.suite}</td>
          <td>${r.message ?? ''}</td>
        </tr>`).join('')}</tbody>
    </table>`;

  console.log(`${pass}/${results.length} passed`);
  results.filter(r => !r.pass).forEach(r => console.error(`❌ ${r.name}: ${r.message}`));
  return { pass, fail, total: results.length };
}
