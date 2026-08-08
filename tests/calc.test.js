// tests/calc.test.js
// ★harness.js のみを import すること。runner.js / node:test を直接使わない
import { describe, test, assert } from './harness.js';
import * as C from '../js/config.js';
import * as calc from '../js/calc.js';
import { selectors } from '../js/selectors.js';

// このフェーズ（Phase 1b）の対象: TEST-01〜30, 52〜54, 56, 70〜78, 81〜83
// 対象外: TEST-31〜51（feedback.js / store.js 側。Phase 2・6 で実装）

// selectors 系テスト用のヘルパ（Phase1〜4改修・2026-08-07：新Stateスキーマに対応）。
function buildState(overrides = {}){
  return {
    userProfile: { annualSalary: 0, age: 0 },
    fixedCosts: {
      smartphone: 0, internetMonthly: null,
      medicalInsurance: 0, fireInsurance: 0,
      nhkPlan: 'none', hasCar: false, carInsurance: 0, parking: 0, rent: 0
    },
    creditCards: { main: null, sub: null, others: [] },
    quests: { completed: {} },
    selections: { subscriptionPlanIds: [], otherSubscriptions: [] },
    meta: { initialLevel: null, currentLevel: null, feedbackBonusGranted: false },
    ...overrides
  };
}

describe('8.1 標準報酬月額・テーブル整合性', () => {
  test('TEST-01: 境界値（下）209,999円 → 等級17', () => {
    assert.equal(calc.lookupStandardMonthly(209999).grade, 17);
    assert.equal(calc.lookupStandardMonthly(209999).standard, 200000);
  });

  test('TEST-02: 境界値（上）210,000円 → 等級18', () => {
    assert.equal(calc.lookupStandardMonthly(210000).grade, 18);
    assert.equal(calc.lookupStandardMonthly(210000).standard, 220000);
  });

  test('TEST-03: 上限等級 額面1,500,000円 → 等級50', () => {
    assert.equal(calc.lookupStandardMonthly(1500000).grade, 50);
    assert.equal(calc.lookupStandardMonthly(1500000).standard, 1390000);
  });

  test('TEST-04: 厚生年金の上限クランプ 額面800,000円', () => {
    assert.equal(calc.lookupStandardMonthly(800000).standard, 790000);
    assert.equal(calc.lookupPensionStandard(800000), 650000);
  });

  test('TEST-05: 不正入力（null/-1/文字列）は例外を投げず null', () => {
    assert.equal(calc.lookupStandardMonthly(null), null);
    assert.equal(calc.lookupStandardMonthly(-1), null);
    assert.equal(calc.lookupStandardMonthly('abc'), null);
  });
});

describe('8.2 高額療養費・公的保障', () => {
  test('TEST-06: 区分エ（境界）標準報酬260,000円・医療費1M → 61,500円', () => {
    assert.equal(calc.calcSelfPayCap(260000, 1000000), 61500);
  });

  test('TEST-07: 区分ウ（境界）標準報酬280,000円・医療費1M → 92,940円', () => {
    assert.equal(calc.calcSelfPayCap(280000, 1000000), 92940);
  });

  test('TEST-08: 区分イ 標準報酬530,000円・医療費1M → 183,130円', () => {
    assert.equal(calc.calcSelfPayCap(530000, 1000000), 183130);
  });

  test('TEST-09: 区分オ 住民税非課税 → 36,900円', () => {
    assert.equal(calc.calcSelfPayCap(0, 1000000, { isResidentTaxExempt: true }), 36900);
  });

  test('TEST-10: 多数回該当（区分ウ・4回目）→ 44,400円（据え置き）', () => {
    assert.equal(calc.calcSelfPayCap(280000, 1000000, { isMultipleHit: true }), 44400);
  });

  test('TEST-11: 付加給付 非適用（協会けんぽ）', () => {
    const result = calc.calcFinalSelfPay(
      { grossSalary: 300000, insuranceType: 'association', fukaKyufuCap: 25000 },
      1000000);
    assert.equal(result.amount, 92940);   // 標準報酬300,000は区分ウ
    assert.equal(result.hasFuka, false);
  });

  test('TEST-12: 付加給付 適用（健保組合）→ min(上限, 25,000) = 25,000円', () => {
    const result = calc.calcFinalSelfPay(
      { grossSalary: 300000, insuranceType: 'kumiai', fukaKyufuCap: 25000 },
      1000000);
    assert.equal(result.amount, 25000);
    assert.equal(result.hasFuka, true);
  });

  test('TEST-13: 傷病手当金 端数処理（平均標準報酬170,000円）→ 日額3,780円', () => {
    assert.equal(calc.calcInjuryAllowanceDaily(170000), 3780);
  });

  test('TEST-14: 傷病手当金 12ヶ月未満（個人平均350,000・協会けんぽ）→ 日額7,113円', () => {
    const daily = calc.calcInjuryAllowanceDaily(350000, {
      isUnderOneYear: true, insuranceType: 'association', startDate: new Date('2026-08-06')
    });
    assert.equal(daily, 7113);   // 個人平均より低い協会けんぽ平均320,000が採用される
  });

  test('TEST-15: 傷病手当金 組合（組合平均280,000・12ヶ月未満）→ 32万円を使わない', () => {
    const daily = calc.calcInjuryAllowanceDaily(350000, {
      isUnderOneYear: true, insuranceType: 'kumiai', kumiaiAverage: 280000
    });
    // 協会けんぽの320,000が使われた場合は7,113円になるため、それとの不一致で確認する
    assert.notEqual(daily, 7113);
    assert.equal(daily, 6220);
  });

  test('TEST-16: 傷病手当金 12ヶ月以上は低額採用が発動しない', () => {
    const daily = calc.calcInjuryAllowanceDaily(350000, { isUnderOneYear: false });
    assert.equal(daily, 7780);   // 基礎額350,000がそのまま使われる
  });
});

describe('8.3 手取り・社会保険料', () => {
  const AT = new Date('2026-08-06');

  test('TEST-17: 介護保険 年齢境界（39歳/40歳）', () => {
    const under = calc.calcSocialInsurance(220000, 39, AT);
    const over  = calc.calcSocialInsurance(220000, 40, AT);
    assert.equal(under.isNursing, false);
    assert.equal(over.isNursing, true);
    // 40歳のみ介護保険1.62%（本人負担分）が上乗せされる
    assert.equal(over.breakdown.health - under.breakdown.health, 1782);
  });

  test('TEST-18: 子ども・子育て支援金 0.23% が健保料率に加算されている', () => {
    const before = calc.calcSocialInsurance(220000, 30, new Date('2026-03-31'));
    const after  = calc.calcSocialInsurance(220000, 30, new Date('2026-04-01'));
    assert.equal(before.breakdown.health, 11143);
    assert.equal(after.breakdown.health, 11396);
    assert.equal(after.breakdown.health - before.breakdown.health, 253);
  });

  test('TEST-19: 住民税 勤続境界（1年目=0円／2年目=課税）', () => {
    const y1 = calc.calcNetIncome({ reward: 300000, age: 30, yearsOfService: 1 }, AT);
    const y2 = calc.calcNetIncome({ reward: 300000, age: 30, yearsOfService: 2 }, AT);
    assert.equal(y1.residentTaxMonthly, 0);
    assert.ok(y2.residentTaxMonthly > 0);
  });

  test('TEST-20: 厚生年金 本人負担（標準報酬220,000円）→ 20,130円', () => {
    assert.equal(calc.calcSocialInsurance(220000, 30, AT).breakdown.pension, 20130);
  });

  test('TEST-21: 手取り非負（額面0円でも負値を返さない）', () => {
    const result = calc.calcNetIncome({ reward: 0, age: 30, yearsOfService: 1 }, AT);
    assert.equal(result.net, 0);
  });
});

describe('8.4 レベル・称号（Phase1〜4改修・2026-08-07：新方式）', () => {
  test('PHASE2-01: 初期レベル算出式 floor((手取り+固定費合計)/20000)+10', () => {
    // ★ユーザーテストフィードバック改修（2026-08-08）：未入力状態でLv.1になるよう基準値を1に変更
    assert.equal(calc.calcInitialLevel(0, 0), 1);
    assert.equal(calc.calcInitialLevel(220000, 20000), Math.floor(240000/20000)+1);
    assert.equal(calc.calcInitialLevel(19999, 0), 1);   // 端数は切り捨て
    assert.equal(calc.calcInitialLevel(20000, 0), 2);
  });

  test('PHASE2-02: 初期レベルは負値入力でも下限1を下回らない', () => {
    assert.equal(calc.calcInitialLevel(-100, -100), 1);
  });

  test('PHASE2-03: 役職テーブルの境界（Lv.10/11, 20/21, 30/31）', () => {
    const titleAt = lv => C.RANK_TABLE_V2.find(r => lv >= r.min && lv <= r.max).title;
    assert.equal(titleAt(1),  '見習い冒険者');
    assert.equal(titleAt(10), '見習い冒険者');
    assert.equal(titleAt(11), '駆け出しの騎士');
    assert.equal(titleAt(20), '駆け出しの騎士');
    assert.equal(titleAt(21), '中堅の魔導士');
    assert.equal(titleAt(30), '中堅の魔導士');
    assert.equal(titleAt(31), 'ベテラン大賢者');
    assert.equal(titleAt(999), 'ベテラン大賢者');
  });

  test('PHASE2-04: 現在レベルの確定的な算出（5,000円ちょうど→+3）', () => {
    const r = calc.calcCurrentLevel(10, 15000);
    assert.equal(r.baseUp, 3);
    assert.equal(r.remainder, 0);
    assert.equal(r.finalLevel, 13);
  });

  test('FEEDBACK-04: 現在レベルの確定的な算出（端数ありでも抽選なしで確実に加算される）', () => {
    // ★以前はここで乱数抽選に外れると+0のままになり「レベルが上がらないバグ」の原因になっていた。
    //   抽選要素を排したため、5,000円未満の端数分は次のレベルまでの進捗として残るのみで、
    //   baseUp分の加算は常に確実に反映される。
    const r1 = calc.calcCurrentLevel(10, 12000);
    assert.equal(r1.baseUp, 2);
    assert.equal(r1.remainder, 2000);
    assert.equal(r1.finalLevel, 12);

    const r2 = calc.calcCurrentLevel(10, 4999);   // 5,000円未満はレベルアップしない（抽選による偶然の+1もない）
    assert.equal(r2.finalLevel, 10);
  });

  test('PHASE2-07: シェア文面に金額を含めない（クエスト名のみ使用）', () => {
    const state = buildState({
      userProfile: { annualSalary: 3600000, age: 30 },
      fixedCosts: { ...buildState().fixedCosts, smartphone: 8000 },
      meta: { initialLevel: 10, currentLevel: 10, feedbackBonusGranted: false }
    });
    const text = selectors.shareTextV2(state);
    assert.ok(!/[0-9],[0-9]{3}/.test(text));   // 3桁区切りの金額表記が含まれない
    assert.ok(!text.includes('円'));
    assert.match(text, /Lv\.10/);
    assert.match(text, /見習い冒険者/);
  });

  test('PHASE2-08: クエスト0件時は伝説の勇者用のシェア文面になる', () => {
    const state = buildState({ meta: { initialLevel: 10, currentLevel: 10, feedbackBonusGranted: false } });
    const text = selectors.shareTextV2(state);
    assert.ok(text.includes(C.LEGENDARY_HERO.mainTitle));
  });

  // ★固定費入力済み（fixedCostsTotal>0）かつクエスト0件＝「見直す余地のない完璧な家計」を作るための
  //   ヘルパ。全項目を理想の目標値ちょうどに設定し、ギャップ（節約可能額）を0にする。
  function buildLegendaryState(overrides = {}){
    return buildState({
      userProfile: { annualSalary: 3600000, age: 30 },
      fixedCosts: {
        smartphone: 2000, internetMonthly: 0,
        medicalInsurance: 0, fireInsurance: 400,
        nhkPlan: 'none', hasCar: false, carInsurance: 0, parking: 0, rent: 0
      },
      meta: { initialLevel: 10, currentLevel: 10, feedbackBonusGranted: false },
      ...overrides
    });
  }

  // ★ゲーミフィケーション改修（2026-08-08）：画面上のレベルは「STEP1→2」「STEP2→3」の
  //   ボタン押下時（state.meta.initialLevel確定）のみ動く。それまでは年収・固定費の
  //   入力内容によらず常に基準レベルを返すことを確認する。
  test('LEVEL-FREEZE-01: state.meta.initialLevel確定前は入力内容によらずレベル表示が基準値に固定される', () => {
    const state = buildState({
      userProfile: { annualSalary: 12000000, age: 30 },
      fixedCosts: { ...buildState().fixedCosts, smartphone: 50000 }
    });
    assert.equal(selectors.currentLevel(state), C.INITIAL_LEVEL_BASE);
  });

  test('LEGENDARY-01: 固定費入力済みでクエスト0件はisLegendaryHeroがtrueになる', () => {
    const state = buildLegendaryState();
    assert.equal(selectors.buildQuestList(state).length, 0);
    assert.ok(selectors.isLegendaryHero(state));
  });

  test('LEGENDARY-02: 何も入力していない初期状態（fixedCostsTotal=0）はisLegendaryHeroがfalseのまま', () => {
    const state = buildState({ meta: { initialLevel: 10, currentLevel: 10, feedbackBonusGranted: false } });
    assert.equal(selectors.buildQuestList(state).length, 0);
    assert.ok(!selectors.isLegendaryHero(state));
  });

  // ★致命的バグ修正（2026-08-08）：STEP2で最初の1項目だけ入力した瞬間（他は0円のまま）は
  //   買QuestListがたまたま0件になり得るが、まだ「クエストへ行く」ボタン（state.meta.currentLevel
  //   確定）を押していないため、Lv.99（伝説の勇者）が暴発してはならない。
  test('LEGENDARY-BUGFIX-01: STEP2確定前（currentLevel未確定）は1項目入力だけでLv.99が暴発しない', () => {
    const state = buildState({
      // ideal通りの1項目だけ入力＝一見「クエスト0件」に見える状態
      fixedCosts: { ...buildState().fixedCosts, smartphone: 2000 },
      meta: { initialLevel: 15, currentLevel: null, feedbackBonusGranted: false }
    });
    assert.equal(selectors.buildQuestList(state).length, 0);      // クエストは確かに0件
    assert.ok(!selectors.hasConfirmedQuests(state));               // だが未確定
    assert.equal(selectors.currentLevel(state), 15);               // Lv.99にならず、確定済みの初期レベルのまま
    assert.notEqual(selectors.rankV2(state).title, C.LEGENDARY_RANK_TITLE);
    assert.notEqual(selectors.headerProgressPct(state), 100);
  });

  test('LEGENDARY-03: 伝説の勇者状態ではcurrentLevelが通常の計算式によらずLv.99に固定される', () => {
    const state = buildLegendaryState({ meta: { initialLevel: 10, currentLevel: 10, feedbackBonusGranted: false } });
    assert.equal(selectors.currentLevel(state), C.LEGENDARY_LEVEL);
    assert.equal(C.LEGENDARY_LEVEL, 99);
  });

  test('LEGENDARY-04: 伝説の勇者状態では役職が「伝説の勇者」に上書きされる', () => {
    const state = buildLegendaryState();
    assert.equal(selectors.rankV2(state).title, C.LEGENDARY_RANK_TITLE);
    assert.equal(C.LEGENDARY_RANK_TITLE, '伝説の勇者');
  });

  test('LEGENDARY-05: 伝説の勇者状態ではヘッダーゲージが常にMAX（100%）になる', () => {
    const state = buildLegendaryState();
    assert.equal(selectors.headerProgressPct(state), 100);
  });

  test('LEGENDARY-06: 伝説の勇者状態のシェア文面は「Lv.99 の 伝説の勇者」で統一される', () => {
    const state = buildLegendaryState();
    const text = selectors.shareTextV2(state);
    assert.ok(text.includes('Lv.99'));
    assert.ok(text.includes('伝説の勇者'));
  });

  test('FEEDBACK-01: 年収セレクトから月額報酬を算出する（monthlyGrossSalary）', () => {
    const state = buildState({ userProfile: { annualSalary: 4800000, age: 30 } });
    assert.equal(selectors.monthlyGrossSalary(state), 400000);
    assert.equal(selectors.monthlyGrossSalary(buildState()), 0);   // 未選択（0）でも例外を投げない
  });
});

describe('Phase2 固定費クエスト・クレジットカードクエストの自動判定', () => {
  test('PHASE2-09: 固定費クエスト（現状価格－理想の目標値、正のみ採用）', () => {
    const results = calc.evaluateFixedCostQuests({
      smartphone: 8000,          // 理想2,000 → 差6,000
      internetMonthly: 0,        // 契約なし扱い → 差0（採用されない）
      medicalInsurance: 0,       // 理想0 → 差0
      fireInsurance: 833,        // 理想400 → 差433
      subscriptions: 0,
      nhkMonthly: 1100,          // 理想0 → 差1,100
      hasCar: false, carInsurance: 0
    });
    const byCat = Object.fromEntries(results.map(r => [r.category, r.monthlySaving]));
    assert.equal(byCat.smartphone, 6000);
    assert.equal(byCat.fireInsurance, 433);
    assert.equal(byCat.nhk, 1100);
    assert.equal(byCat.internet, undefined);
    assert.equal(byCat.parking, undefined);   // 駐車場代は判定対象外
  });

  test('PHASE2-10: 自動車保険は hasCar=false の場合クエスト化されない', () => {
    const results = calc.evaluateFixedCostQuests({
      smartphone: 0, internetMonthly: 0, medicalInsurance: 0, fireInsurance: 0,
      subscriptions: 0, nhkMonthly: 0, hasCar: false, carInsurance: 9000
    });
    assert.equal(results.find(r => r.category === 'carInsurance'), undefined);
  });

  test('PHASE2-11: 推定カード決済額（固定費合計＋(手取り-固定費)×0.6）', () => {
    const r = calc.estimateCardSpend(50000, 200000);
    assert.equal(r.monthly, 50000 + Math.floor((200000-50000)*0.6));
    assert.equal(r.annual, r.monthly * 12);
  });

  test('PHASE2-12: パターンA（メインがstandard）→ 節約可能額 = floor(floor(年間決済額×0.01)/12)', () => {
    const main = { id:'x', category:'standard' };
    const results = calc.evaluateCreditCardQuests({ main, sub:null, others:[] }, 1200000);
    const a = results.find(r => r.pattern === 'A');
    assert.equal(a.monthlySaving, Math.floor(Math.floor(1200000*0.01)/12));
  });

  test('PHASE2-13: パターンB（その他保有カードの年会費合計）', () => {
    const others = [{ id:'a', annualFee:5000 }, { id:'b', annualFee:0 }, { id:'c', annualFee:3000 }];
    const results = calc.evaluateCreditCardQuests({ main:null, sub:null, others }, 0);
    const b = results.find(r => r.pattern === 'B');
    assert.equal(b.monthlySaving, Math.floor(8000/12));
    assert.equal(b.cards.length, 2);   // 年会費0円のカードは対象外
  });

  test('PHASE2-14: パターンC（100万円未達）→ 節約可能額 = floor((年会費+年間決済額×0.005)/12)', () => {
    const main = { id:'x', category:'specialty', is1M_Challenge:true, annualFee:5500, breakEvenAmount:1000000 };
    const results = calc.evaluateCreditCardQuests({ main, sub:null, others:[] }, 800000);
    const c = results.find(r => r.pattern === 'C');
    assert.equal(c.monthlySaving, Math.floor((5500 + 800000*0.005)/12));
  });

  test('PHASE2-15: パターンC不発（100万円以上決済済み）', () => {
    const main = { id:'x', category:'specialty', is1M_Challenge:true, annualFee:5500, breakEvenAmount:1000000 };
    const results = calc.evaluateCreditCardQuests({ main, sub:null, others:[] }, 1000000);
    assert.equal(results.find(r => r.pattern === 'C'), undefined);
  });

  test('PHASE2-16: パターンD（損益分岐点未達）→ 節約可能額 = floor(年会費/12)', () => {
    const sub = { id:'y', category:'specialty', annualFee:16500, breakEvenAmount:1500000, isStatusCard:false };
    const results = calc.evaluateCreditCardQuests({ main:null, sub, others:[] }, 1000000);
    const d = results.find(r => r.pattern === 'D');
    assert.equal(d.monthlySaving, Math.floor(16500/12));
  });

  test('PHASE2-17: パターンD不発（聖域カード isStatusCard:true は除外）', () => {
    const sub = { id:'z', category:'specialty', annualFee:16500, breakEvenAmount:1000000, isStatusCard:true };
    const results = calc.evaluateCreditCardQuests({ main:null, sub, others:[] }, 0);
    assert.equal(results.find(r => r.pattern === 'D'), undefined);
  });

  test('PHASE2-18: 足切りルール（500円未満のクエストはbuildQuestListから除外）', () => {
    const state = buildState({
      fixedCosts: { ...buildState().fixedCosts, medicalInsurance: 4300 } // 理想0→差4,300円は採用
    });
    const withSmall = buildState({
      fixedCosts: { ...buildState().fixedCosts, medicalInsurance: 400 } // 差400円は足切り対象
    });
    assert.ok(selectors.buildQuestList(state).some(q => q.monthlySaving === 4300));
    assert.equal(selectors.buildQuestList(withSmall).length, 0);
  });

  test('PHASE2-19: buildQuestListは節約可能額の降順でソートされる', () => {
    const state = buildState({
      fixedCosts: { ...buildState().fixedCosts, smartphone: 8000, fireInsurance: 5000 }
    });
    const list = selectors.buildQuestList(state);
    for (let i = 1; i < list.length; i++){
      assert.ok(list[i-1].monthlySaving >= list[i].monthlySaving);
    }
  });

  test('FEEDBACK-02: 手動入力サブスクは固定費合計に加算されるがクエスト判定からは除外される', () => {
    const state = buildState({
      selections: {
        subscriptionPlanIds: [],
        otherSubscriptions: [{ id:'o1', label:'ジム', monthly: 8000 }]   // プラン選択は0円、手動入力のみ8,000円
      }
    });
    // 固定費合計（家計圧迫度）には手動入力分が含まれる
    assert.equal(selectors.fixedCostsTotal(state), 8000);
    // クエスト判定（ムダの自動判定）には手動入力分を使わないため、サブスクのクエストは発生しない
    assert.equal(selectors.buildQuestList(state).some(q => q.id === 'cancelSubscription'), false);
  });

  // ★ゲーミフィケーション改修（2026-08-08）：サブスクリプション機能は一時凍結（非表示）した。
  //   選択済みプランがあっても、fixedCostsTotal（家計圧迫度）には引き続き算入されるが、
  //   クエスト判定からは除外される（FEEDBACK-02と同じ扱いに統一）。
  test('FEEDBACK-03: サブスク機能凍結中はプラン選択分があってもクエスト判定の対象にならない', () => {
    const state = buildState({
      selections: { subscriptionPlanIds: ['netflix_premium'], otherSubscriptions: [] }   // 2,290円（理想1,000円との差1,290円）
    });
    assert.equal(selectors.fixedCostsTotal(state), 2290);
    const quest = selectors.buildQuestList(state).find(q => q.id === 'cancelSubscription');
    assert.equal(quest, undefined);
  });
});

describe('8.7 追加ロジック', () => {
  test('TEST-52: 銀行手数料（ATM3回・振込2回→月770円/年9,240円。0入力は0円）', () => {
    const loss = calc.calcBankFeeLoss(3, 2);
    assert.equal(loss.monthlyLoss, 770);
    assert.equal(loss.annualLoss, 9240);
    assert.equal(calc.calcBankFeeLoss(0, 0).monthlyLoss, 0);
  });

  test('TEST-53: クレカ還元率の単位（％表記）→ 損失7,500円', () => {
    const loss = calc.calcCreditCardLoss(1500000, 0.5);
    assert.equal(loss.annualLoss, 7500);
  });

  test('TEST-54: 還元率が最適済み（1.5%）→ 損失0円（負の損失を出さない）', () => {
    const loss = calc.calcCreditCardLoss(1500000, 1.5);
    assert.equal(loss.annualLoss, 0);
  });

  test('TEST-70: 子ども・子育て支援金の適用開始（2026-04-01から）', () => {
    assert.equal(calc.pickEffective(C.CHILDCARE_SUPPORT_RATES, new Date('2026-03-31')), undefined);
    assert.equal(calc.pickEffective(C.CHILDCARE_SUPPORT_RATES, new Date('2026-04-01')).rate, 0.0023);
  });

  test('TEST-71: 雇用保険料率の年度切替（0.55%→0.50%）', () => {
    assert.equal(calc.pickEffective(C.EMPLOYMENT_INSURANCE_RATES, new Date('2026-03-31')).employee, 0.0055);
    assert.equal(calc.pickEffective(C.EMPLOYMENT_INSURANCE_RATES, new Date('2026-04-01')).employee, 0.0050);
  });

  test('TEST-72: 給与所得控除の段階式', () => {
    const tax = C.TAX_CONSTANTS[0];
    assert.equal(calc.calcSalaryDeduction(1900000, tax), 740000);
    assert.equal(calc.calcSalaryDeduction(3600000, tax), 1160000);
    assert.equal(calc.calcSalaryDeduction(6600000, tax), 1760000);
  });

  test('TEST-73: 所得税の基礎控除（合計所得4,890,000/4,890,001の境界）', () => {
    const table = C.TAX_CONSTANTS[0].basicDeductionTable;
    assert.equal(table.find(r => 4890000 <= r.maxTotalIncome).amount, 1040000);
    assert.equal(table.find(r => 4890001 <= r.maxTotalIncome).amount, 670000);
  });

  test('TEST-74: 住民税の基礎控除は据え置き（所得税テーブルを流用していない）', () => {
    const tax = C.TAX_CONSTANTS[0];
    const incomeTaxBasic   = tax.basicDeductionTable.find(r => 3000000 <= r.maxTotalIncome).amount;
    const residentTaxBasic = tax.residentBasicDeductionTable.find(r => 3000000 <= r.maxTotalIncome).amount;
    assert.equal(incomeTaxBasic, 1040000);
    assert.equal(residentTaxBasic, 430000);
    assert.notEqual(incomeTaxBasic, residentTaxBasic);
  });

  test('TEST-75: 労使折半の端数処理（50銭ちょうどは切り捨て）', () => {
    assert.equal(calc.roundInsuranceShare(100.5), 100);
    assert.equal(calc.roundInsuranceShare(100.51), 101);
  });

  test('TEST-76: 高額療養費 年間上限（区分ア/イ/オ）', () => {
    assert.equal(calc.resolveHighMedicalBracket(900000, false).annualCap, 1680000);
    assert.equal(calc.resolveHighMedicalBracket(600000, false).annualCap, 1110000);
    assert.equal(calc.resolveHighMedicalBracket(null, true).annualCap, 290000);
  });

  test('TEST-77: 通信費の2段階判定', () => {
    assert.equal(C.judgeSmartphoneCost(8000).level, 'over_average');
    assert.equal(C.judgeSmartphoneCost(5000).level, 'improvable');
    assert.equal(C.judgeSmartphoneCost(2500).level, 'optimized');
  });

  test('TEST-78: 通信費の差額算出（平均以下でも最適化余地は出る）', () => {
    const r = C.judgeSmartphoneCost(5000);
    assert.equal(r.gapToAverage, 0);
    assert.equal(r.gapToOptimized, 1001);
  });

  test('TEST-81: その他サブスクの合算（ラベル空でも算入される）', () => {
    const total = C.sumOtherSubscriptions([
      { label: 'ジム', monthly: 8000 },
      { label: '',     monthly: 3000 }
    ]);
    assert.equal(total, 11000);
  });

  test('TEST-82: その他サブスクの異常値ガード', () => {
    const total = C.sumOtherSubscriptions([
      { label: 'a', monthly: -500 },
      { label: 'b', monthly: 999999 },
      { label: 'c', monthly: 'abc' },
      { label: 'd', monthly: null }
    ]);
    assert.equal(total, 0);
  });

  test('TEST-83: サブスク総額の統合（プラン2件＋その他1件）', () => {
    const state = buildState();
    state.selections.subscriptionPlanIds = ['netflix_standard', 'primevideo_general'];
    state.selections.otherSubscriptions  = [{ label: 'x', monthly: 8000 }];
    assert.equal(selectors.subscriptionTotal(state), 10190);
  });
});
