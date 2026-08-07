// selectors.js — 派生値の純粋関数のみ。DOM / window / localStorage / fetch に一切触れない（CLAUDE.md 制約6）。
// ★State には currentLevel / moneyLevel / displayLevel / title / avatarKey を保存しない。
//   すべてここで都度算出する（CLAUDE.md 制約4）。
//   ★Phase 1〜4改修（2026-08-07）：レベル計算式・クエスト生成方式を全面的に置き換えた。
//     旧方式（moneyLevel/annualGain/RANK_TABLE/shareText）は廃止し、
//     initialLevel/currentLevel/rankV2/buildQuestList/shareTextV2 に置き換える。
import * as C from './config.js';
import * as calc from './calc.js';
import { CREDIT_CARDS } from './creditCards.js';

/**
 * @typedef {Object} State
 * @property {{grossSalary:number, age:number, yearsOfService:number}} userProfile
 * @property {Object<string,*>} fixedCosts
 * @property {{subscriptionPlanIds:string[], otherSubscriptions:{label:string,monthly:number}[]}} selections
 * @property {{main:string|null, sub:string|null, others:string[]}} creditCards
 * @property {{completed:Object<string,number>}} quests
 * @property {{initialLevel:number|null, currentLevel:number|null, feedbackBonusGranted:boolean}} meta
 */

/**
 * 固定費クエストの表示メタ情報（タイトル・小見出し・詳細）を引く。
 * ★既存カテゴリ（通信費・医療保険・火災保険・サブスク）は既存 QUEST_CATALOG の
 *   RPGテキストをそのまま再利用する（独自に書き換えない）。
 * @param {string} category FIXED_COST_TARGETS のキー
 * @returns {{id:string, mainTitle:string, subTitle:string, detail?:string,
 *   basis?:string, talkScript?:string[], disclaimer?:string}}
 */
function fixedQuestMeta(category){
  const reusedId = C.REUSED_QUEST_MAP[category];
  if (reusedId){
    const q = C.QUEST_CATALOG.find(x => x.id === reusedId);
    return { id: reusedId, mainTitle: q.questTitle, subTitle: q.summary,
      detail: q.description, basis: q.basis, talkScript: q.talkScript, disclaimer: q.disclaimer };
  }
  const nf = C.NEW_FIXED_QUESTS[category];
  return { id: nf.id, mainTitle: nf.mainTitle, subTitle: nf.subTitle };
}

/**
 * クレジットカードクエストの表示メタ情報を引く。
 * @param {'A'|'B'|'C'|'D'} pattern
 * @param {{card?:object, cards?:object[]}} extra evaluateCreditCardQuests() の1件分
 * @returns {{id:string, mainTitle:string, subTitle:string, detail?:string}}
 */
function cardQuestMeta(pattern, extra){
  const t = C.CARD_QUEST_TEXT[pattern];
  if (pattern === 'B'){
    const names = (extra.cards ?? []).map(c => c.name).join('・');
    const fee = (extra.cards ?? []).reduce((sum, c) => sum + Number(c.annualFee || 0), 0);
    return { id: t.id, mainTitle: t.mainTitle,
      subTitle: `対象：${names}（年会費合計 ¥${fee.toLocaleString('ja-JP')}）`,
      detail: t.detail };
  }
  const cardName = extra.card?.name ?? '';
  return { id: t.id, mainTitle: t.mainTitle, subTitle: t.subTitle,
    detail: cardName ? `対象カード：${cardName}` : undefined };
}

/**
 * クエストID単体から表示メタ情報を復元する（完了済みだが現在のギャップ計算では
 * 再生成されなくなったクエストを一覧から消さないためのフォールバック）。
 * @param {string} id
 * @returns {{id:string, mainTitle:string, subTitle:string, detail?:string}|null}
 */
function orphanQuestMeta(id){
  const reused = C.QUEST_CATALOG.find(q => q.id === id);
  if (reused) return { id, mainTitle: reused.questTitle, subTitle: reused.summary, detail: reused.description };
  const nf = Object.values(C.NEW_FIXED_QUESTS).find(q => q.id === id);
  if (nf) return { id, mainTitle: nf.mainTitle, subTitle: nf.subTitle };
  const cq = Object.values(C.CARD_QUEST_TEXT).find(q => q.id === id);
  if (cq) return { id, mainTitle: cq.mainTitle, subTitle: cq.subTitle, detail: cq.detail };
  return null;
}

export const selectors = {
  /**
   * 年収（ドロップダウン選択値）から月額報酬（額面）を算出する。
   * ★ユーザーテストフィードバック改修（2026-08-07）：Step1の入力を年収選択式に変更した。
   * @param {State} state
   * @returns {number}
   */
  monthlyGrossSalary(state){
    const annual = Math.max(0, Number(state?.userProfile?.annualSalary) || 0);
    return Math.round(annual / 12);
  },

  /**
   * 手取り月額を算出する。
   * @param {State} state
   * @returns {number}
   */
  netIncome(state){
    const p = state?.userProfile ?? {};
    return calc.calcNetIncome({
      reward: selectors.monthlyGrossSalary(state),
      age: p.age,
      yearsOfService: p.yearsOfService
    }).net;
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
   * プランから選択したサブスクのみの月額合計（自由入力の手動サブスクを含まない）。
   * ★ユーザーテストフィードバック改修（2026-08-07）：手動入力サブスク（ジム・ファンクラブ等）は
   *   固定費合計（家計圧迫度）には算入するが、システムが「ムダ」と自動判定する対象からは
   *   除外する（＝理想の目標値＝現状の価格として扱う）ため、クエスト判定にはこちらを使う。
   * @param {State} state
   * @returns {number}
   */
  planSubscriptionTotal(state){
    const sel = state?.selections ?? {};
    return C.sumSubscriptions(sel.subscriptionPlanIds ?? []);
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
   * 現状の固定費合計を算出する。駐車場代・自動車保険料・NHK受信料・光回線料金を含む
   * （Phase2.1）。契約なし選択時は0として扱う。
   * @param {State} state
   * @returns {number}
   */
  fixedCostsTotal(state){
    const fc = state?.fixedCosts ?? {};
    const internet = fc.internetProvider && fc.internetProvider !== 'none'
      ? Math.max(0, Number(fc.internetMonthly) || 0) : 0;
    const nhk = (C.NHK_PLANS.find(p => p.value === fc.nhkPlan) ?? C.NHK_PLANS[0]).monthly;
    const car = fc.hasCar
      ? Math.max(0, Number(fc.carInsurance) || 0) + Math.max(0, Number(fc.parking) || 0)
      : 0;
    return Math.max(0, Number(fc.smartphone) || 0) + internet
         + Math.max(0, Number(fc.medicalInsurance) || 0)
         + Math.max(0, Number(fc.fireInsurance) || 0)
         + selectors.subscriptionTotal(state)
         + nhk + car;
  },

  /**
   * 解決済みのクレジットカードオブジェクト（メイン・サブ・その他）を返す。
   * @param {State} state
   * @returns {{main:object|null, sub:object|null, others:object[]}}
   */
  resolvedCards(state){
    const cc = state?.creditCards ?? {};
    const findCard = id => CREDIT_CARDS.find(c => c.id === id) ?? null;
    return {
      main: findCard(cc.main),
      sub: findCard(cc.sub),
      others: (cc.others ?? []).map(findCard).filter(Boolean)
    };
  },

  /**
   * 初期レベルを算出する。STEP1完了時に state.meta.initialLevel として一度だけ確定される。
   * 確定前（固定費入力中）はライブに算出した値を返す。
   * @param {State} state
   * @returns {number}
   */
  initialLevel(state){
    if (Number.isFinite(state?.meta?.initialLevel)) return state.meta.initialLevel;
    return calc.calcInitialLevel(selectors.netIncome(state), selectors.fixedCostsTotal(state));
  },

  /**
   * 解呪済みクエストの月間節約可能額の合計を算出する。
   * @param {State} state
   * @returns {number}
   */
  completedSavingTotal(state){
    const completed = state?.quests?.completed ?? {};
    return Object.values(completed).reduce((sum, v) => sum + (Number(v) || 0), 0);
  },

  /**
   * 現在レベル（初期レベル＋クエスト解呪による加算分＋開発協力ボーナス）を算出する。
   * ★クリティカル抽選の乱数結果は state.meta.currentLevel に確定値として保存される
   *   （app.js のクエスト解呪ハンドラ参照）。未解呪時は initialLevel と同じ値を返す。
   * ★フィードバック送信ボーナス（生涯1回・+1Lv）は今回の改修対象外の既存機能のため、
   *   新レベル方式にもそのまま引き継ぐ。
   * @param {State} state
   * @returns {number}
   */
  currentLevel(state){
    const base = Number.isFinite(state?.meta?.currentLevel)
      ? state.meta.currentLevel
      : selectors.initialLevel(state);
    return base + (state?.meta?.feedbackBonusGranted ? C.BONUS_LEVEL_MAX : 0);
  },

  /**
   * 現在レベルに対応する役職を引く（新レベル方式・Phase3.3）。
   * @param {State} state
   * @returns {{min:number, max:number, title:string}}
   */
  rankV2(state){
    const lv = selectors.currentLevel(state);
    return C.RANK_TABLE_V2.find(r => lv >= r.min && lv <= r.max) ?? C.RANK_TABLE_V2[0];
  },

  /**
   * ヘッダーの常時プログレスバー用：次のレベルアップ単位（5,000円）に対する到達率（%）。
   * @param {State} state
   * @returns {number}
   */
  headerProgressPct(state){
    const total = selectors.completedSavingTotal(state);
    return Math.round((total % C.LEVELUP_UNIT) / C.LEVELUP_UNIT * 100);
  },

  /**
   * 固定費クエスト・クレジットカードクエストを算出し、足切り（月額500円未満は除外）・
   * 節約可能額の降順ソートを行った表示用クエスト一覧を返す（Phase2〜3）。
   * ★解呪済みだが現在の入力では再生成されなくなったクエストも、確定済みの節約額のまま
   *   一覧から消えないよう合成する。
   * @param {State} state
   * @returns {{id:string, mainTitle:string, subTitle:string, detail?:string,
   *   monthlySaving:number}[]}
   */
  buildQuestList(state){
    const s = state ?? {};
    const fc = s.fixedCosts ?? {};
    const costs = {
      smartphone: fc.smartphone,
      internetMonthly: fc.internetProvider && fc.internetProvider !== 'none' ? fc.internetMonthly : 0,
      medicalInsurance: fc.medicalInsurance,
      fireInsurance: fc.fireInsurance,
      subscriptions: selectors.planSubscriptionTotal(s),
      nhkMonthly: (C.NHK_PLANS.find(p => p.value === fc.nhkPlan) ?? C.NHK_PLANS[0]).monthly,
      hasCar: fc.hasCar,
      carInsurance: fc.carInsurance
    };
    const fixedResults = calc.evaluateFixedCostQuests(costs);

    const cards = selectors.resolvedCards(s);
    const { annual } = calc.estimateCardSpend(selectors.fixedCostsTotal(s), selectors.netIncome(s));
    const cardResults = calc.evaluateCreditCardQuests(cards, annual);

    const active = [];
    fixedResults.forEach(r => {
      if (r.monthlySaving < C.QUEST_MIN_SAVING) return;
      active.push({ ...fixedQuestMeta(r.category), monthlySaving: r.monthlySaving });
    });
    cardResults.forEach(r => {
      if (r.monthlySaving < C.QUEST_MIN_SAVING) return;
      active.push({ ...cardQuestMeta(r.pattern, r), monthlySaving: r.monthlySaving });
    });

    const completed = s.quests?.completed ?? {};
    const activeIds = new Set(active.map(q => q.id));
    Object.keys(completed).forEach(id => {
      if (activeIds.has(id)) return;
      const meta = orphanQuestMeta(id);
      if (meta) active.push({ ...meta, monthlySaving: completed[id] });
    });

    active.sort((a, b) => b.monthlySaving - a.monthlySaving);
    return active;
  },

  /**
   * Xシェア用の文面を生成する（Phase3.3／Phase4.1）。
   * ★金額は一切含めず、レベル・役職・最大の成果のクエスト名（中立的な subTitle）のみを含める
   *   （CLAUDE.md 制約8の精神を踏襲）。クエストが0件（伝説の勇者）の場合は専用文面を返す。
   * @param {State} state
   * @returns {string}
   */
  shareTextV2(state){
    const lv   = selectors.currentLevel(state);
    const rank = selectors.rankV2(state).title;
    const quests = selectors.buildQuestList(state);
    if (!quests.length){
      return `【てどりクエスト】${C.LEGENDARY_HERO.mainTitle} Lv.${lv}【${rank}】に到達！`
           + ` #てどりクエスト #手取り最大化`;
    }
    const top = quests[0];
    const plain = top.subTitle || top.mainTitle;
    return `【てどりクエスト】Lv.${lv}【${rank}】に到達！最大の成果は「${plain}」だった。`
         + ` #てどりクエスト #手取り最大化`;
  }
};
