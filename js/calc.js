// calc.js — 純粋関数のみ。DOM / window / localStorage / fetch に一切触れない（CLAUDE.md 制約6）。
// 法令数値はすべて config.js から import する（CLAUDE.md 制約7）。
import * as C from './config.js';

// --- 汎用ヘルパ -------------------------------------------------------------

/**
 * 施行日付きレコード配列から、基準日時点で有効な最新の行を取得する。
 * @param {{effectiveFrom:string}[]} list 施行日を持つレコード配列
 * @param {Date} [at] 基準日
 * @returns {object|undefined} 該当レコード。空配列や基準日より未来のみの場合は undefined
 */
export function pickEffective(list, at = new Date()){
  if (!Array.isArray(list) || list.length === 0) return undefined;   // 空・非配列ガード
  const t = new Date(at).getTime();
  return list.filter(r => new Date(r.effectiveFrom).getTime() <= t)
             .sort((a,b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom))[0];
}

// --- 標準報酬月額 -----------------------------------------------------------

/**
 * 報酬月額から健康保険の標準報酬月額（等級）を引く。
 * @param {number} reward 報酬月額（円）
 * @returns {{grade:number, standard:number, lower:number, upper:number}|null}
 *   不正入力（null/undefined/NaN/負値）は null
 */
export function lookupStandardMonthly(reward){
  // ★ Number(null) は 0 になり NaN 判定をすり抜けるため、null/undefined は先に弾く
  if (reward === null || reward === undefined) return null;
  const r = Number(reward);
  if (!Number.isFinite(r) || r < 0) return null;                     // NaN / 負値ガード
  const row = C.HEALTH_INSURANCE_TABLE.find(t => r >= t.lower && r < t.upper);
  return row ?? C.HEALTH_INSURANCE_TABLE.at(-1);                     // 上限超過は最高等級
}

/**
 * 報酬月額から厚生年金の標準報酬月額を引く（上下限でクランプ）。
 * @param {number} reward 報酬月額（円）
 * @returns {number|null} 不正入力は null
 */
export function lookupPensionStandard(reward){
  const health = lookupStandardMonthly(reward);
  if (!health) return null;
  return Math.min(C.PENSION_MAX_STANDARD, Math.max(C.PENSION_MIN_STANDARD, health.standard));
}

// --- 社会保険料（本人負担） -------------------------------------------------

/**
 * 社会保険料の折半額を丸める。
 * ★通貨の丸めは「50銭以下は切り捨て、50銭を超える場合は切り上げ」と規定されている。
 *   JS の Math.round は 0.5 を切り上げてしまうため使用してはならない（§12.3 T-10）。
 * @param {number} v 丸め前の金額
 * @returns {number}
 */
export function roundInsuranceShare(v){
  if (!Number.isFinite(v)) return 0;                                 // NaN ガード
  const floor = Math.floor(v);
  return (v - floor) > 0.5 ? floor + 1 : floor;
}

/**
 * 健康保険・介護保険・厚生年金・雇用保険の本人負担額を計算する。
 * @param {number} reward 報酬月額（円）
 * @param {number} age 年齢
 * @param {Date} [at] 基準日
 * @returns {{total:number, breakdown:object, isNursing?:boolean}}
 */
export function calcSocialInsurance(reward, age, at = new Date()){
  const rates     = pickEffective(C.INSURANCE_RATES, at);
  const childCare = pickEffective(C.CHILDCARE_SUPPORT_RATES, at);     // ★適用開始が1ヶ月遅い
  const empIns    = pickEffective(C.EMPLOYMENT_INSURANCE_RATES, at);
  const health    = lookupStandardMonthly(reward);
  if (!health || !rates) return { total:0, breakdown:{} };            // 不正入力・料率未定義ガード

  const std        = health.standard;
  const pensionStd = lookupPensionStandard(reward);
  const isNursing  = Number(age) >= C.NURSING_CARE_MIN_AGE;           // ★40歳未満は課さない（NaNなら false）

  let healthRate = rates.healthTotal;
  if (childCare) healthRate += childCare.rate;                        // 子ども・子育て支援金
  if (isNursing) healthRate += rates.nursingCareTotal;

  const b = {
    health:     roundInsuranceShare(std * healthRate * rates.employeeShare),
    pension:    roundInsuranceShare((pensionStd ?? 0) * rates.pensionTotal * rates.employeeShare),
    // ★雇用保険は労使折半ではない。標準報酬ではなく実際の報酬額に料率を掛ける
    employment: roundInsuranceShare(Math.max(0, Number(reward) || 0) * (empIns?.employee ?? 0))
  };
  return { total: b.health + b.pension + b.employment, breakdown: b, isNursing };
}

// --- 手取り -----------------------------------------------------------------

/**
 * 月額の手取りを年税額ベースで試算する（§6.3a 参照。月次源泉とは一致しない）。
 * @param {{reward:number, age:number, yearsOfService:number}} profile
 * @param {Date} [at] 基準日
 * @returns {{net:number, gross:number, social:object, totalIncome:number,
 *   salaryDeduct:number, incomeTaxMonthly:number, residentTaxMonthly:number,
 *   incomeTaxYear:number, residentTaxYear:number}}
 */
export function calcNetIncome(profile, at = new Date()){
  const { reward, age, yearsOfService } = profile ?? {};              // null/undefined ガード
  const gross  = Math.max(0, Number(reward) || 0);
  const social = calcSocialInsurance(gross, age, at);
  const tax    = C.TAX_CONSTANTS.find(t => t.appliedYear === Number(C.APPLIED_FISCAL_YEAR))
               ?? C.TAX_CONSTANTS.at(-1);
  if (!tax) return { net:0, gross, social, totalIncome:0, salaryDeduct:0,
                      incomeTaxMonthly:0, residentTaxMonthly:0, incomeTaxYear:0, residentTaxYear:0 };

  const annualGross   = gross * 12;
  const salaryDeduct  = calcSalaryDeduction(annualGross, tax);
  const totalIncome   = Math.max(0, annualGross - salaryDeduct);      // 合計所得金額
  const socialAnnual  = social.total * 12;

  // ---- 所得税（基礎控除は令和8年分の特例適用後）----
  const basicDeduct   = tax.basicDeductionTable.find(r => totalIncome <= r.maxTotalIncome)?.amount ?? 0;
  const taxableIncome = Math.max(0, totalIncome - basicDeduct - socialAnnual);
  const br            = tax.incomeTaxBrackets.find(r => taxableIncome <= r.max);
  const incomeTaxYear = br ? Math.max(0, Math.floor(
    (taxableIncome * br.rate - br.deduction) * (1 + tax.reconstructionSurtaxRate))) : 0;

  // ---- 住民税（★基礎控除は43万円に据え置き。所得税とは別テーブル）----
  //     社会人1年目は前年所得が無いため課税されない
  let residentTaxYear = 0;
  if (Number(yearsOfService) > C.RESIDENT_TAX_EXEMPT_YEARS
      && totalIncome > tax.residentTaxNonTaxableTotalIncome){         // 非課税限度額の判定
    const rBasic   = tax.residentBasicDeductionTable.find(r => totalIncome <= r.maxTotalIncome)?.amount ?? 0;
    const rTaxable = Math.max(0, totalIncome - rBasic - socialAnnual);
    residentTaxYear = Math.floor(rTaxable * tax.residentTaxRate) + tax.residentTaxPerCapita;
  }

  const net = gross - social.total
            - Math.floor(incomeTaxYear / 12)
            - Math.floor(residentTaxYear / 12);

  return { net: Math.max(0, net), gross, social,                      // ★手取りは非負にクランプ
           totalIncome, salaryDeduct,
           incomeTaxMonthly:   Math.floor(incomeTaxYear / 12),
           residentTaxMonthly: Math.floor(residentTaxYear / 12),
           incomeTaxYear, residentTaxYear };
}

/**
 * 給与所得控除を段階表から算出する（令和8年分〜。§12.3 T-01）。
 * @param {number} annualGross 年間の給与収入
 * @param {{salaryDeductionTable:object[]}} tax TAX_CONSTANTS の該当年分
 * @returns {number}
 */
export function calcSalaryDeduction(annualGross, tax){
  if (!tax || !Array.isArray(tax.salaryDeductionTable) || tax.salaryDeductionTable.length === 0) return 0;
  const g = Math.max(0, Number(annualGross) || 0);
  const row = tax.salaryDeductionTable.find(r => g <= r.maxIncome);
  if (!row) return 0;
  if (Number.isFinite(row.fixed)) return row.fixed;
  // ★最低保障額（74万円）を下回らないようにする
  return Math.max(tax.salaryDeductionTable[0].fixed, Math.floor(g * row.rate + row.add));
}

// --- 高額療養費 -------------------------------------------------------------

/**
 * 標準報酬月額から高額療養費の所得区分を判定する。
 * @param {number} standardMonthly 標準報酬月額
 * @param {boolean} [isResidentTaxExempt] 住民税非課税か
 * @returns {object} HIGH_MEDICAL_LIMITS の該当行（常に非 null。不正入力は最低区分にフォールバック）
 */
export function resolveHighMedicalBracket(standardMonthly, isResidentTaxExempt){
  if (isResidentTaxExempt) return C.HIGH_MEDICAL_LIMITS.find(b => b.id === 'e');
  const n = Number(standardMonthly);
  const s = Number.isFinite(n) ? Math.max(0, n) : 0;                  // NaN / 負値は区分エにフォールバック
  // 配列は降順。先頭一致で最上位区分が取れる
  return C.HIGH_MEDICAL_LIMITS.find(b => b.minStandardMonthly !== null && s >= b.minStandardMonthly);
}

/**
 * 高額療養費の自己負担限度額を計算する。
 * @param {number} standardMonthly 標準報酬月額
 * @param {number} totalMedicalCost 総医療費
 * @param {{isResidentTaxExempt?:boolean, isMultipleHit?:boolean}} [opts]
 * @returns {number} 自己負担限度額（円）
 */
export function calcSelfPayCap(standardMonthly, totalMedicalCost, opts = {}){
  const b = resolveHighMedicalBracket(standardMonthly, opts.isResidentTaxExempt);
  if (opts.isMultipleHit) return b.multiple;                          // 直近12ヶ月で3回以上該当
  if (b.deductionBase === null) return b.base;                        // 定額区分（エ・オ）
  const cost = Math.max(0, Number(totalMedicalCost) || 0);            // NaN / 負値ガード
  return Math.round(b.base + Math.max(0, cost - b.deductionBase) * b.rate);
}

// --- 付加給付（健保組合のみ） -----------------------------------------------

/**
 * 付加給付を考慮した最終的な自己負担額を計算する。
 * @param {{grossSalary:number, isResidentTaxExempt?:boolean, insuranceType?:string, fukaKyufuCap?:number}} profile
 * @param {number} totalMedicalCost 総医療費
 * @returns {{amount:number, hasFuka:boolean, note?:string}}
 */
export function calcFinalSelfPay(profile, totalMedicalCost){
  const p = profile ?? {};
  const health   = lookupStandardMonthly(p.grossSalary);
  const standard = health ? health.standard : 0;                      // 不正入力は最低区分側で扱う
  const cap = calcSelfPayCap(standard, totalMedicalCost, { isResidentTaxExempt: p.isResidentTaxExempt });

  if (p.insuranceType !== 'kumiai'){
    return { amount:cap, hasFuka:false, note:'協会けんぽには付加給付制度はありません' };
  }
  const fuka = p.fukaKyufuCap;
  if (!Number.isFinite(fuka) || fuka <= 0){
    return { amount:cap, hasFuka:false,
             note:'お勤め先の健保組合に付加給付があるか確認してみましょう' };
  }
  return { amount: Math.min(cap, fuka), hasFuka:true };
}

// --- 傷病手当金（二段階端数処理 ＋ 12ヶ月未満の低額採用） -------------------

/**
 * 傷病手当金の日額を計算する（§12.1 M-11・M-12）。
 * @param {number} avgStandardMonthly 平均標準報酬月額
 * @param {{isUnderOneYear?:boolean, insuranceType?:string, kumiaiAverage?:number, startDate?:Date}} [opts]
 * @returns {number} 日額（円）
 */
export function calcInjuryAllowanceDaily(avgStandardMonthly, opts = {}){
  const { isUnderOneYear = false, insuranceType = 'association',
          kumiaiAverage = null, startDate = new Date() } = opts ?? {};

  let base = Math.max(0, Number(avgStandardMonthly) || 0);

  if (isUnderOneYear){
    // 「上限」ではなく「いずれか低い額」を採用する
    const insurerAvg = (insuranceType === 'kumiai')
      ? kumiaiAverage                                                 // 組合は自組合の平均額
      : pickEffective(C.SICKPAY_AVG_STD_MONTHLY, startDate)?.amount;  // 協会けんぽ
    if (Number.isFinite(insurerAvg) && insurerAvg > 0) base = Math.min(base, insurerAvg);
  }

  const step1 = Math.round(base / 30 / 10) * 10;                      // ① 10円未満四捨五入
  return Math.round(step1 * (2 / 3));                                 // ② 1円未満四捨五入
}

// --- 銀行手数料 -------------------------------------------------------------

/**
 * 時間外ATM・他行振込の手数料損失を計算する。
 * @param {number} atmCount 月間の時間外・土日祝ATM利用回数
 * @param {number} transferCount 月間の他行宛ネット振込回数
 * @returns {{monthlyLoss:number, annualLoss:number}}
 */
export function calcBankFeeLoss(atmCount, transferCount){
  const monthlyLoss = Math.max(0, Number(atmCount)      || 0) * C.BANK_FEE.atm
                    + Math.max(0, Number(transferCount) || 0) * C.BANK_FEE.transfer;
  return { monthlyLoss, annualLoss: monthlyLoss * 12 };
}

// --- クレジットカード -------------------------------------------------------

/**
 * クレジットカードの還元率差・年会費による機会損失を計算する。
 * ★引数はパーセント単位（0.5 = 0.5%）。小数（0.005）を渡してはならない。
 * @param {number} annualSpend 年間利用額
 * @param {number} currentRatePercent 現在の還元率（％）
 * @param {number} [annualFee] 年会費
 * @param {boolean} [isRevolving] リボ払い設定の有無
 * @returns {{annualLoss:number, isRevolvingAlert:boolean}}
 */
export function calcCreditCardLoss(annualSpend, currentRatePercent, annualFee = 0, isRevolving = false){
  const spend = Math.max(0, Number(annualSpend) || 0);
  const pct   = Math.max(0, Number(currentRatePercent) || 0);
  const rateLoss = pct < C.CARD_TARGET_RATE_PERCENT
    ? spend * (C.CARD_TARGET_RATE_PERCENT - pct) / 100
    : 0;                                                              // 負の損失を出さない
  return {
    annualLoss: Math.floor(rateLoss + Math.max(0, Number(annualFee) || 0)),
    isRevolvingAlert: Boolean(isRevolving)
  };
}

// --- 家賃（レベル非算入・参考枠） -------------------------------------------

/**
 * 家賃の黄金比・市場平均との差分を計算する。★レベル非算入（constraint 3）。
 * @param {number} netIncome 手取り月額
 * @param {number} rent 家賃
 * @param {string} area MARKET_AVERAGE_RENT のキー
 * @returns {{limit:number, overGolden:number, marketAverage:number, overMarket:number,
 *   paybackYears:number|null, includedInLevel:false}}
 */
export function calcRentGap(netIncome, rent, area){
  const avg   = C.MARKET_AVERAGE_RENT[area] ?? C.MARKET_AVERAGE_RENT[C.MARKET_AVERAGE_RENT._default];
  const limit = Math.floor(Math.max(0, Number(netIncome)||0) * C.GOLDEN_RATIO.rent.ratio);
  const r     = Math.max(0, Number(rent) || 0);
  const overGolden = Math.max(0, r - limit);
  const overMarket = Math.max(0, r - avg);
  const monthlySaving = overMarket;
  const paybackYears = monthlySaving > 0
    ? Math.ceil((r * C.MOVING_COST_MONTHS) / (monthlySaving * 12) * 10) / 10
    : null;
  return { limit, overGolden, marketAverage:avg, overMarket, paybackYears,
           includedInLevel: false };                                  // ★常に false
}

// --- その他 -----------------------------------------------------------------

/**
 * 固定費を見直さず放置した場合の単利損失を計算する。
 * @param {number} monthlyWaste 月間の無駄額
 * @param {number} [years] 放置年数
 * @returns {number}
 */
export function calcNeglectLoss(monthlyWaste, years = C.NEGLECT_YEARS){
  const y = Number.isFinite(years) && years >= 0 ? years : C.NEGLECT_YEARS;
  return Math.max(0, Number(monthlyWaste)||0) * 12 * y;
}

/**
 * 節約額を時給換算した労働時間（タイパ換算）を返す。
 * @param {number} savingAmount 節約額
 * @param {number} hourlyWage 時給
 * @returns {number} 時間（時給0の場合は0。ゼロ除算しない）
 */
export function calcOvertimeEquivalent(savingAmount, hourlyWage){
  const w = Number(hourlyWage) || 0;
  return w > 0 ? Math.round((Math.max(0,Number(savingAmount)||0) / w) * 10) / 10 : 0;
}

/**
 * 積立の複利試算を行う（NISA想定・非保証）。
 * @param {number} monthly 月間積立額
 * @param {number} [annualRate] 年利
 * @param {number} [years] 積立年数
 * @returns {number} 将来価値の概算（円）
 */
export function calcCompound(monthly, annualRate = C.NISA_ANNUAL_RETURN, years = C.NEGLECT_YEARS){
  const m = Math.max(0, Number(monthly)||0);
  const r = (Number.isFinite(annualRate) ? annualRate : C.NISA_ANNUAL_RETURN) / 12;
  const y = Number.isFinite(years) && years >= 0 ? years : C.NEGLECT_YEARS;
  const n = y * 12;
  return r === 0 ? Math.round(m*n) : Math.round(m * ((Math.pow(1+r,n)-1)/r));
}

// ---------------------------------------------------------------------------
// Phase 2〜3 改修（2026-08-07）：初期レベル・固定費クエスト・クレジットカードクエスト
// ---------------------------------------------------------------------------

/**
 * 初期レベルを算出する。
 * 初期レベル = Math.floor((月額手取り + 現状の固定費合計) / 20000) + 10
 * @param {number} netIncome 月額手取り
 * @param {number} fixedCostsTotal 現状の固定費合計（駐車場代・自動車保険料・NHK受信料・光回線料金を含む）
 * @returns {number}
 */
export function calcInitialLevel(netIncome, fixedCostsTotal){
  const net = Math.max(0, Number(netIncome) || 0);
  const fc  = Math.max(0, Number(fixedCostsTotal) || 0);
  return Math.floor((net + fc) / C.INITIAL_LEVEL_DIVISOR) + C.INITIAL_LEVEL_BASE;
}

/**
 * クレジットカードの推定月間・年間決済額を計算する。
 * 推定月間決済額 = 現状の固定費合計 + Math.floor((月額手取り - 現状の固定費合計) * 0.6)
 * @param {number} fixedCostsTotal 現状の固定費合計
 * @param {number} netIncome 月額手取り
 * @returns {{monthly:number, annual:number}}
 */
export function estimateCardSpend(fixedCostsTotal, netIncome){
  const fc  = Math.max(0, Number(fixedCostsTotal) || 0);
  const net = Math.max(0, Number(netIncome) || 0);
  const monthly = fc + Math.floor(Math.max(0, net - fc) * C.CARD_SPEND_DISPOSABLE_RATIO);
  return { monthly, annual: monthly * 12 };
}

/**
 * 解呪済みクエストの累計節約額から現在レベルを確定的に算出する。5,000円ごとにレベル+1。
 * ★ユーザーテストフィードバック改修（2026-08-07）：以前はクリティカル抽選（確率的な+1）を
 *   実装していたが、端数が5,000円未満のクエストを解呪しても抽選に外れると画面上
 *   何も変化が起きず「レベルが上がらないバグ」として報告された。抽選要素を排し、
 *   クエストを解呪すれば必ず進捗（バーの伸び、いずれレベルアップ）が確認できる
 *   確定的な計算に変更した。
 * @param {number} initialLevel 初期レベル
 * @param {number} totalSaving 解呪済みクエストの月間節約可能額の合計
 * @returns {{baseUp:number, remainder:number, finalLevel:number}}
 */
export function calcCurrentLevel(initialLevel, totalSaving){
  const base   = Math.max(0, Number(initialLevel) || 0);
  const saving = Math.max(0, Number(totalSaving) || 0);
  const baseUp = Math.floor(saving / C.LEVELUP_UNIT);
  const remainder = saving % C.LEVELUP_UNIT;
  const finalLevel = base + baseUp;
  return { baseUp, remainder, finalLevel };
}

/**
 * 固定費クエスト（節約可能額）を判定する。節約可能額 = 現状の価格 − 理想の目標値。
 * 理想の目標値が null のカテゴリ（駐車場代）は判定対象外とする。
 * @param {{smartphone:number, internetMonthly:number, medicalInsurance:number,
 *   fireInsurance:number, subscriptions:number, nhkMonthly:number,
 *   hasCar:boolean, carInsurance:number}} costs 現状の各カテゴリ金額
 * @returns {{category:string, monthlySaving:number}[]} 足切り前の全件（節約可能額が正のもの）
 */
export function evaluateFixedCostQuests(costs){
  const c = costs ?? {};
  const targets = C.FIXED_COST_TARGETS;
  const results = [];
  const push = (category, current) => {
    const ideal = targets[category]?.ideal;
    if (ideal === null || ideal === undefined) return;                 // クエスト判定対象外（駐車場代）
    const cur = Math.max(0, Number(current) || 0);
    const saving = Math.floor(cur - ideal);
    if (saving > 0) results.push({ category, monthlySaving: saving });
  };
  push('smartphone', c.smartphone);
  push('internet', c.internetMonthly);
  push('medicalInsurance', c.medicalInsurance);
  push('fireInsurance', c.fireInsurance);
  push('subscriptions', c.subscriptions);
  push('nhk', c.nhkMonthly);
  if (c.hasCar) push('carInsurance', c.carInsurance);
  return results;
}

/**
 * クレジットカードのクエスト（パターンA〜D）を判定する。
 * @param {{main:import('./creditCards.js').CreditCard|null,
 *   sub:import('./creditCards.js').CreditCard|null,
 *   others:import('./creditCards.js').CreditCard[]}} cards 解決済みのカードオブジェクト
 * @param {number} estimatedAnnualSpend 推定年間決済額
 * @returns {{pattern:'A'|'B'|'C'|'D', monthlySaving:number,
 *   card?:object, cards?:object[]}[]} 足切り前の全件（節約可能額が正のもの）
 */
export function evaluateCreditCardQuests(cards, estimatedAnnualSpend){
  const spend = Math.max(0, Number(estimatedAnnualSpend) || 0);
  const { main = null, sub = null, others = [] } = cards ?? {};
  const results = [];

  // パターンA：メインカードが standard（基本還元率0.5%程度で特化強みなし）
  if (main?.category === 'standard'){
    const monthlySaving = Math.floor(Math.floor(spend * 0.01) / 12);
    if (monthlySaving > 0) results.push({ pattern:'A', monthlySaving, card: main });
  }

  // パターンB：その他保有カードのうち、年会費が発生する休眠カード
  const feeCards = others.filter(card => Number(card?.annualFee) > 0);
  if (feeCards.length){
    const totalFee = feeCards.reduce((sum, card) => sum + Number(card.annualFee), 0);
    const monthlySaving = Math.floor(totalFee / 12);
    if (monthlySaving > 0) results.push({ pattern:'B', monthlySaving, cards: feeCards });
  }

  const allHeld = [main, sub, ...others].filter(Boolean);

  // パターンC：100万円修行カードを保有し、推定年間決済額が100万円未満
  const challengeCard = allHeld.find(card => card.is1M_Challenge === true);
  if (challengeCard && spend < 1000000){
    const monthlySaving = Math.floor(
      (Number(challengeCard.annualFee || 0) + spend * 0.005) / 12);
    if (monthlySaving > 0) results.push({ pattern:'C', monthlySaving, card: challengeCard });
  }

  // パターンD：損益分岐点のある特化カード（聖域カードを除く）を保有し、決済額が未達
  const breakEvenCard = allHeld.find(card =>
    Number.isFinite(card.breakEvenAmount) && card.isStatusCard !== true
    && spend < card.breakEvenAmount);
  if (breakEvenCard){
    const monthlySaving = Math.floor(Number(breakEvenCard.annualFee || 0) / 12);
    if (monthlySaving > 0) results.push({ pattern:'D', monthlySaving, card: breakEvenCard });
  }

  return results;
}
