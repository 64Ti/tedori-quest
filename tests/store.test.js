// tests/store.test.js
// ★harness.js のみを import すること。runner.js / node:test を直接使わない
import { describe, test, assert } from './harness.js';
import * as store from '../js/store.js';

// このフェーズ（Phase 2）の対象: TEST-42〜45, 51
// 対象外: TEST-46〜50（feedback.js 側の sanitizePayload。Phase 6 で実装）

describe('8.6 永続化・サニタイズ（呪文・移行）', () => {
  test('TEST-42: 呪文 日本語往復（エンコード→デコードで完全一致・btoa例外なし）', () => {
    const original = structuredClone(store.INITIAL_STATE);
    original.userProfile.grossSalary = 300000;
    original.selections.otherSubscriptions = [
      { id: 'o1', label: 'ジム月謝＆スポーツクラブ', monthly: 8000 }
    ];

    const spell = store.encodeSpell(original);       // 例外を投げれば test() が自動で失敗にする
    const { data } = store.decodeSpell(spell);

    assert.deepEqual(data.u, original.userProfile);
    assert.deepEqual(data.s, original.selections);   // 日本語ラベルが完全一致
  });

  test('TEST-43: 呪文 ボーナス保持（復元後も feedbackBonusGranted: true）', () => {
    const original = structuredClone(store.INITIAL_STATE);
    original.meta.feedbackBonusGranted = true;

    const spell    = store.encodeSpell(original);
    const restored = store.restoreFromSpell(spell);

    assert.equal(restored.meta.feedbackBonusGranted, true);
  });

  test('TEST-44: 破損呪文（例外を捕捉し、既存Stateを破壊しない）', () => {
    const before = JSON.stringify(store.INITIAL_STATE);

    assert.throws(() => store.restoreFromSpell('TQ1-INVALID!!'));

    assert.equal(JSON.stringify(store.INITIAL_STATE), before);   // 例外後もINITIAL_STATEは不変
  });

  test('TEST-45: スキーマ移行（schemaVersion無しの旧データ→初期値で補完・例外なし）', () => {
    const legacyRaw = {
      userProfile: { grossSalary: 300000 },      // schemaVersion キー自体が無い
      fixedCosts:  { rent: 70000 }
    };

    const migrated = store.migrate(legacyRaw);

    assert.equal(migrated.schemaVersion, store.INITIAL_STATE.schemaVersion);
    assert.equal(migrated.userProfile.grossSalary, 300000);
    assert.equal(migrated.userProfile.age, null);           // 未指定項目は初期値で補完
    assert.equal(migrated.userProfile.prefecture, 'osaka'); // 未指定項目は初期値で補完
    assert.equal(migrated.fixedCosts.rent, 70000);
    assert.equal(migrated.fixedCosts.smartphone, null);     // 未指定項目は初期値で補完
    assert.deepEqual(migrated.selections, store.INITIAL_STATE.selections);
  });

  test('TEST-51: 全角数字の半角化（入力 ６５０００ → State に 65000）', () => {
    assert.equal(store.parseYen('６５０００'), 65000);
  });
});

// ---------------------------------------------------------------------------
// 以下は §6.5「特に注意する点」の実装要件を直接確認する補助テスト。
// 公式のテストIDは割り当てられていないが、再帰的Proxy・同値判定・
// structuredClone(proxy)回避はすべて店舗運用の事故に直結するため明示的に検証する。
// ---------------------------------------------------------------------------
describe('6.5 実装要件の確認（補助テスト・公式IDなし）', () => {
  test('deepReactive: ネストされた変更を検知する（再帰的Proxy）', () => {
    const changed = [];
    const obj = store.deepReactive({ fixedCosts: { rent: 1000 } }, p => changed.push(p));

    obj.fixedCosts.rent = 2000;   // トップレベルではなくネストした代入

    assert.equal(obj.fixedCosts.rent, 2000);
    assert.deepEqual(changed, ['rent']);
  });

  test('deepReactive: 同値代入では onChange が発火しない（Object.is判定）', () => {
    let count = 0;
    const obj = store.deepReactive({ fixedCosts: { rent: 1000 } }, () => { count += 1; });

    obj.fixedCosts.rent = 1000;   // 同値。何もしない
    assert.equal(count, 0);

    obj.fixedCosts.rent = 1001;   // 異なる値
    assert.equal(count, 1);
  });

  test('deepReactive でラップした値は JSON化でプレーンオブジェクトに戻せる（structuredClone(proxy)回避）', () => {
    const obj   = store.deepReactive({ a: { b: 1 } }, () => {});
    const plain = JSON.parse(JSON.stringify(obj));   // persist() 内の stripProxy と同じ手法

    assert.equal(plain.a.b, 1);
    assert.equal(Object.getPrototypeOf(plain), Object.prototype);   // Proxyではなく素のオブジェクト
  });
});
