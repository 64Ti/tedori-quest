// tests/calc.test.js
// ★harness.js のみを import すること。runner.js / node:test を直接使わない
import { describe, test, assert } from './harness.js';
import * as C from '../js/config.js';
import * as calc from '../js/calc.js';
import { selectors } from '../js/selectors.js';

// このフェーズ（Phase 1b）の対象: TEST-01〜30, 52〜54, 56, 70〜78, 81〜83
// 対象外: TEST-31〜51（feedback.js / store.js 側。Phase 2・6 で実装）

// selectors 系テスト用のヘルパ。IMMEDIATE の smartphone だけに差額を持たせ、
// 他の5項目とサブスクは差額ゼロにすることで、任意の annualGain を持つ State を作る。
function buildGainState({ annualGain = 0, initialLevel = C.LEVEL_MIN, bonus = false } = {}){
  const monthlyGain = annualGain / 12;
  return {
    userProfile: { grossSalary: 0, age: 0, yearsOfService: 0 },
    fixedCosts: {
      smartphone: monthlyGain, subscriptions: 0, fireInsurance: 0,
      medicalInsurance: 0, bankFee: 0, cardReward: 0, rent: 0
    },
    optimized: {
      smartphone: 0, subscriptions: 0, fireInsurance: 0,
      medicalInsurance: 0, bankFee: 0, cardReward: 0
    },
    selections: { subscriptionPlanIds: [], otherSubscriptions: [] },
    meta: { initialLevel, feedbackBonusGranted: bonus }
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

describe('8.4 レベル・称号', () => {
  test('TEST-22: 空入力（全項目null）→ Lv.1（NaNを返さない）', () => {
    const nullState = {
      userProfile: { grossSalary: null, age: null, yearsOfService: null },
      fixedCosts: {
        smartphone: null, subscriptions: null, fireInsurance: null,
        medicalInsurance: null, bankFee: null, cardReward: null, rent: null
      },
      optimized: {
        smartphone: null, subscriptions: null, fireInsurance: null,
        medicalInsurance: null, bankFee: null, cardReward: null
      },
      selections: { subscriptionPlanIds: [], otherSubscriptions: [] },
      meta: { initialLevel: null, feedbackBonusGranted: null }
    };
    assert.equal(selectors.moneyLevel(nullState), C.LEVEL_MIN);
  });

  test('TEST-23: 負の増額でも下限クランプでLv.1を下回らない', () => {
    // ★monthlyGain は各項目を Math.max(0, delta) でクランプするため、
    //   State 経由では annualGain が負値になることは無い。
    //   見直し後の額が見直し前より高い（改悪）状態を与え、
    //   moneyLevel() の下限クランプ（Math.max(LEVEL_MIN, ...)）が
    //   機能することを確認する。
    const state = buildGainState({ annualGain: 0 });
    state.optimized.smartphone = 50000;   // 見直し前(0)より高くする
    assert.equal(selectors.moneyLevel(state), 1);
  });

  test('TEST-24: 5,000円境界（4,999→Lv.1／5,000→Lv.2）', () => {
    assert.equal(selectors.moneyLevel(buildGainState({ annualGain: 4999 })), 1);
    assert.equal(selectors.moneyLevel(buildGainState({ annualGain: 5000 })), 2);
  });

  test('TEST-25: 上限クランプ（年間増額99,999,999円→Lv.999）', () => {
    assert.equal(selectors.moneyLevel(buildGainState({ annualGain: 99999999 })), 999);
  });

  test('TEST-26: 称号境界（Lv.5/6, 15/16, 30/31, 49/50）', () => {
    const titleAt = lv => selectors.rank(buildGainState({ annualGain: (lv - 1) * C.LEVEL_UNIT })).title;
    assert.equal(titleAt(5),  '手取り見習い市民');
    assert.equal(titleAt(6),  '駆け出し節約剣士');
    assert.equal(titleAt(15), '駆け出し節約剣士');
    assert.equal(titleAt(16), '公的保障の騎士');
    assert.equal(titleAt(30), '公的保障の騎士');
    assert.equal(titleAt(31), '手取り防衛の大魔導士');
    assert.equal(titleAt(49), '手取り防衛の大魔導士');
    assert.equal(titleAt(50), '伝説の手取り勇者');
  });

  test('TEST-27: 家賃のレベル除外（家賃超過のみ→annualGain=0／Lv.1）', () => {
    const state = buildGainState({ annualGain: 0 });
    state.fixedCosts.rent = 90000;   // rent は IMMEDIATE に含まれないため無関係
    assert.equal(selectors.annualGain(state), 0);
    assert.equal(selectors.moneyLevel(state), 1);
  });

  test('TEST-28: レベル遷移差分（前Lv.12／後Lv.15→差分+3）', () => {
    const state = buildGainState({ annualGain: 70000, initialLevel: 12 });
    assert.equal(selectors.moneyLevel(state), 15);
    assert.equal(selectors.levelDelta(state), 3);
  });

  test('TEST-29: 3層の分離（moneyLevel:25 かつ displayLevel:26）', () => {
    const state = buildGainState({ annualGain: 120000, bonus: true });
    assert.equal(selectors.moneyLevel(state), 25);
    assert.equal(selectors.bonusLevel(state), 1);
    assert.equal(selectors.displayLevel(state), 26);
  });

  test('TEST-56: シェア文面に金額を含めない（moneyLevelのみ使用）', () => {
    const state = buildGainState({ annualGain: 600000 });
    const text = selectors.shareText(state);
    assert.ok(!text.includes('600,000'));
    assert.ok(!text.includes('600000'));
    assert.ok(!text.includes('円'));
    assert.match(text, /Lv\.121/);
    assert.match(text, /伝説の手取り勇者/);
  });

  test('TEST-30: 次レベルまでの残額（年間増額12,300円→2,700円）', () => {
    assert.equal(selectors.nextLevelGap(buildGainState({ annualGain: 12300 })), 2700);
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
    const state = buildGainState({ annualGain: 0 });
    state.selections.subscriptionPlanIds = ['netflix_standard', 'primevideo_general'];
    state.selections.otherSubscriptions  = [{ label: 'x', monthly: 8000 }];
    assert.equal(selectors.subscriptionTotal(state), 10190);
  });
});
