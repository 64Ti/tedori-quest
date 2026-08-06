// selectors.js — 派生値の純粋関数のみ。DOM / window / localStorage / fetch に一切触れない（CLAUDE.md 制約6）。
// ★State には currentLevel / moneyLevel / displayLevel / title / avatarKey を保存しない。
//   すべてここで都度算出する（CLAUDE.md 制約4）。
import * as C from './config.js';
import * as calc from './calc.js';

/**
 * @typedef {Object} State
 * @property {{grossSalary:number, age:number, yearsOfService:number}} userProfile
 * @property {Object<string,number>} fixedCosts   見直し前の固定費（IMMEDIATE のキー＋rent）
 * @property {Object<string,number>} optimized    見直し後の固定費（IMMEDIATE のキーのみ）
 * @property {{subscriptionPlanIds:string[], otherSubscriptions:{label:string,monthly:number}[]}} selections
 * @property {{initialLevel:number, feedbackBonusGranted:boolean}} meta
 */

export const selectors = {
  /**
   * 手取り月額を算出する。
   * @param {State} state
   * @returns {number}
   */
  netIncome(state){
    const p = state?.userProfile ?? {};
    return calc.calcNetIncome({
      reward: p.grossSalary,
      age: p.age,
      yearsOfService: p.yearsOfService
    }).net;
  },

  /**
   * 固定費見直しによる月間の増額を算出する。★IMMEDIATE のみ。rent は含めない（制約3）。
   * @param {State} state
   * @returns {number}
   */
  monthlyGain(state){
    const fixedCosts = state?.fixedCosts ?? {};
    const optimized  = state?.optimized  ?? {};
    return C.IMMEDIATE.reduce((sum, key) => {
      // subscriptions のみ選択IDから算出する（§3.9）
      const before = key === 'subscriptions'
        ? selectors.subscriptionTotal(state)
        : Number(fixedCosts[key]) || 0;
      const after  = Number(optimized[key]);
      const delta  = Number.isFinite(after) ? (before - after) : 0;
      return sum + Math.max(0, delta);
    }, 0);
  },

  /**
   * 固定費見直しによる年間の増額を算出する。
   * @param {State} state
   * @returns {number}
   */
  annualGain(state){
    const g = selectors.monthlyGain(state) * 12;
    return Number.isFinite(g) ? Math.max(0, Math.round(g)) : 0;
  },

  /**
   * 金額由来のレベル（3層構造のうち最下層）を算出する。
   * @param {State} state
   * @returns {number}
   */
  moneyLevel(state){
    const gain = selectors.annualGain(state);
    if (!Number.isFinite(gain)) return C.LEVEL_MIN;                   // NaN ガード
    return Math.min(C.LEVEL_MAX,
           Math.max(C.LEVEL_MIN, Math.floor(gain / C.LEVEL_UNIT) + 1));
  },

  /**
   * フィードバック送信ボーナスレベルを算出する（生涯1回のみ）。
   * @param {State} state
   * @returns {number}
   */
  bonusLevel(state){
    return state?.meta?.feedbackBonusGranted ? C.BONUS_LEVEL_MAX : 0;
  },

  /**
   * 画面表示用レベル（moneyLevel + bonusLevel）。
   * @param {State} state
   * @returns {number}
   */
  displayLevel(state){
    return selectors.moneyLevel(state) + selectors.bonusLevel(state);
  },

  /**
   * 初期レベルからの遷移差分を算出する。
   * @param {State} state
   * @returns {number}
   */
  levelDelta(state){
    return selectors.displayLevel(state) - (state?.meta?.initialLevel ?? C.LEVEL_MIN);
  },

  /**
   * 表示レベルに対応する称号・アバターキーを引く。
   * @param {State} state
   * @returns {{min:number, max:number, title:string, avatarKey:string}}
   */
  rank(state){
    const lv = selectors.displayLevel(state);
    return C.RANK_TABLE.find(r => lv >= r.min && lv <= r.max) ?? C.RANK_TABLE[0];
  },

  /**
   * 次のレベルまでの到達率（%）を算出する。
   * @param {State} state
   * @returns {number}
   */
  progressPct(state){
    const gain = selectors.annualGain(state);
    return Math.round((gain % C.LEVEL_UNIT) / C.LEVEL_UNIT * 100);
  },

  /**
   * 次のレベルまでの残額（円）を算出する。
   * @param {State} state
   * @returns {number}
   */
  nextLevelGap(state){
    const gain = selectors.annualGain(state);
    return C.LEVEL_UNIT - (gain % C.LEVEL_UNIT);
  },

  /**
   * サブスク月額合計を算出する。★fixedCosts.subscriptions は保存せず、
   * 選択IDから都度算出する（§3.9）。
   * @param {State} state
   * @returns {number}
   */
  subscriptionTotal(state){
    const sel = state?.selections ?? {};
    return C.sumSubscriptions(sel.subscriptionPlanIds ?? [])
         + C.sumOtherSubscriptions(sel.otherSubscriptions ?? []);
  },

  /**
   * サブスクのカテゴリ別サマリ文言（アコーディオンの summary 用）を生成する。
   * @param {State} state
   * @param {string} categoryId SUBSCRIPTION_PLANS のカテゴリID
   * @returns {string} 例:「2件・2,190円」。未選択時は「未選択」
   */
  subscriptionSummary(state, categoryId){
    const cat = C.SUBSCRIPTION_PLANS.find(g => g.id === categoryId);
    if (!cat) return '';
    const selectedIds = state?.selections?.subscriptionPlanIds ?? [];
    const ids = cat.services.flatMap(sv => sv.plans.map(p => p.id))
                  .filter(id => selectedIds.includes(id));
    if (!ids.length) return '未選択';
    return `${ids.length}件・${C.sumSubscriptions(ids).toLocaleString('ja-JP')}円`;
  },

  /**
   * マイカルテ内表示用の年間増額（カンマ区切り＋円なし文字列）。
   * @param {State} state
   * @returns {string}
   */
  annualGainFormatted(state){
    const gain = selectors.annualGain(state);
    return gain.toLocaleString('ja-JP');
  },

  /**
   * Xシェア用の文面を生成する（§4.2）。
   * ★displayLevel ではなく moneyLevel を使用し、金額は一切含めない（CLAUDE.md 制約8）。
   *   URL化（encodeURIComponent・SITE_URL付与）は DOM/window に触れるため app.js 側の責務とする。
   * @param {State} state
   * @returns {string}
   */
  shareText(state){
    const lv   = selectors.moneyLevel(state);
    const rank = selectors.rank(state).title;
    const init = state?.meta?.initialLevel ?? C.LEVEL_MIN;
    return `【てどりクエスト】手取り防衛レベルが Lv.${init} から`
         + `【Lv.${lv} ${rank}】にアップした！`
         + ` #てどりクエスト #手取り最大化`;
  }
};
