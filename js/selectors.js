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
 * @property {{annualSalary:number, age:number}} userProfile
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
      detail: q.description, basis: q.basis, talkScript: q.talkScript, disclaimer: q.disclaimer,
      completeLabel: q.completeLabel };
  }
  const nf = C.NEW_FIXED_QUESTS[category];
  return { id: nf.id, mainTitle: nf.mainTitle, subTitle: nf.subTitle,
    detail: nf.detail, basis: nf.basis, talkScript: nf.talkScript, disclaimer: nf.disclaimer,
    completeLabel: nf.completeLabel };
}

/**
 * クレジットカードクエストの表示メタ情報を引く。
 * @param {'A'|'B'|'C'|'D'} pattern
 * @param {{card?:object, cards?:object[]}} extra evaluateCreditCardQuests() の1件分
 * @returns {{id:string, mainTitle:string, subTitle:string, detail?:string, completeLabel?:string}}
 */
function cardQuestMeta(pattern, extra){
  const t = C.CARD_QUEST_TEXT[pattern];
  if (pattern === 'B'){
    const names = (extra.cards ?? []).map(c => c.name).join('・');
    const fee = (extra.cards ?? []).reduce((sum, c) => sum + Number(c.annualFee || 0), 0);
    return { id: t.id, mainTitle: t.mainTitle,
      subTitle: `対象：${names}（年会費合計 ¥${fee.toLocaleString('ja-JP')}）`,
      detail: t.detail, completeLabel: t.completeLabel };
  }
  const cardName = extra.card?.name ?? '';
  return { id: t.id, mainTitle: t.mainTitle,
    subTitle: cardName ? `対象カード：${cardName}` : t.subTitle,
    detail: t.detail, completeLabel: t.completeLabel };
}

/**
 * サブスク新クエスト（重複の呪縛／幽霊ギルドの退会／スマホの深淵）の表示メタ情報を引く。
 * @param {'duplicate'|'ghostGuild'|'phoneAbyss'} kind calc.evaluateSubscriptionQuests() が返すid
 * @returns {{id:string, mainTitle:string, subTitle:string, detail?:string, basis?:string,
 *   talkScript?:string[], disclaimer?:string, completeLabel?:string}}
 */
function subscriptionQuestMeta(kind){
  const t = C.SUBSCRIPTION_QUEST_TEXT[kind];
  return { id: t.id, mainTitle: t.mainTitle, subTitle: t.subTitle,
    detail: t.detail, basis: t.basis, talkScript: t.talkScript, disclaimer: t.disclaimer,
    completeLabel: t.completeLabel };
}

/**
 * EXクエスト（クレジットカード装備確認）の表示メタ情報を引く（EXクエスト フェーズ2）。
 * ★通常クエストと区別するため isExtra:true を必ず付与する。
 * @param {'A'|'B'|'C'|'D'} pattern calc.evaluateExCreditQuests() が返すpattern
 * @returns {{id:string, mainTitle:string, subTitle:string, detail?:string, completeLabel?:string, isExtra:true}}
 */
function exCreditQuestMeta(pattern){
  const t = C.CARD_QUEST_TEXT[pattern];
  return { id: t.id, mainTitle: t.mainTitle, subTitle: t.subTitle ?? '',
    detail: t.detail, completeLabel: t.completeLabel, isExtra: true };
}

/**
 * クエストID単体から表示メタ情報を復元する（完了済みだが現在のギャップ計算では
 * 再生成されなくなったクエストを一覧から消さないためのフォールバック）。
 * @param {string} id
 * @returns {{id:string, mainTitle:string, subTitle:string, detail?:string, completeLabel?:string, isExtra?:true}|null}
 */
function orphanQuestMeta(id){
  const reused = C.QUEST_CATALOG.find(q => q.id === id);
  if (reused) return { id, mainTitle: reused.questTitle, subTitle: reused.summary,
    detail: reused.description, basis: reused.basis, talkScript: reused.talkScript,
    disclaimer: reused.disclaimer, completeLabel: reused.completeLabel };
  const nf = Object.values(C.NEW_FIXED_QUESTS).find(q => q.id === id);
  if (nf) return { id, mainTitle: nf.mainTitle, subTitle: nf.subTitle,
    detail: nf.detail, basis: nf.basis, talkScript: nf.talkScript, disclaimer: nf.disclaimer,
    completeLabel: nf.completeLabel };
  const cq = Object.values(C.CARD_QUEST_TEXT).find(q => q.id === id);
  if (cq) return { id, mainTitle: cq.mainTitle, subTitle: cq.subTitle ?? '', detail: cq.detail,
    completeLabel: cq.completeLabel, isExtra: true };   // ★EXクエスト フェーズ2：CARD_QUEST_TEXT由来は必ずEX扱い
  const sq = Object.values(C.SUBSCRIPTION_QUEST_TEXT).find(q => q.id === id);
  if (sq) return { id, mainTitle: sq.mainTitle, subTitle: sq.subTitle, detail: sq.detail,
    basis: sq.basis, talkScript: sq.talkScript, disclaimer: sq.disclaimer, completeLabel: sq.completeLabel };
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
      yearsOfService: C.DEFAULT_YEARS_OF_SERVICE   // ★勤続年数の入力欄は廃止済み（固定値で計算）
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
   * （Phase2.1）。
   * @param {State} state
   * @returns {number}
   */
  fixedCostsTotal(state){
    const fc = state?.fixedCosts ?? {};
    const internet = Math.max(0, Number(fc.internetMonthly) || 0);
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
   * レベル計算専用の疑似EXP合計を算出する（ゲーミフィケーション改修v2）。
   * ★実際の節約額（円）ではなく、解呪済みクエストの件数×C.QUEST_EXP_PER_COMPLETIONで
   *   算出する。マイカルテの金額表示・Xシェア文面等は引き続き completedSavingTotal
   *   （実額）を使うため、この値はレベル・ヘッダーゲージの算出にのみ使用する。
   * @param {State} state
   * @returns {number}
   */
  questExpTotal(state){
    const completed = state?.quests?.completed ?? {};
    return Object.keys(completed).length * C.QUEST_EXP_PER_COMPLETION;
  },

  /**
   * 「伝説の勇者」状態（＝足切りルールによりクエストが1件も生成されない、
   * 見直す余地のない完璧な家計）かどうかを判定する。
   * ★fixedCostsTotal>0 を条件に加えるのは、固定費を何も入力していない初期状態
   *   （当然クエストも0件になる）を誤って「伝説の勇者」と判定しないため。
   *   画面3の伝説の勇者カード表示条件（toggle:hasFixedCostInput と quests.length===0 の組み合わせ）
   *   と同じ判定基準に揃えてある。
   * @param {State} state
   * @returns {boolean}
   */
  isLegendaryHero(state){
    return selectors.fixedCostsTotal(state) > 0 && selectors.buildQuestList(state).length === 0;
  },

  /**
   * クエストが確定済み（＝STEP2「クエストへ行く」を押し、state.meta.currentLevel が
   * 一度でも確定した）かどうかを判定する。
   * ★致命的バグ修正（2026-08-08）：伝説の勇者判定（isLegendaryHero）は、STEP2の入力欄の
   *   うち1項目だけ埋めた瞬間（他の項目はまだ0円）にも「クエスト0件」を満たしてしまい、
   *   ボタンを押す前から一時的にLv.99が暴発するバグがあった。
   *   伝説の勇者判定は「ボタンで確定した後」にのみ適用し、画面2で入力中の暫定値には
   *   適用しないようにするためのゲートとして使う。
   * @param {State} state
   * @returns {boolean}
   */
  hasConfirmedQuests(state){
    return Number.isFinite(state?.meta?.currentLevel);
  },

  /**
   * 現在レベル（初期レベル＋クエスト解呪による加算分＋開発協力ボーナス）を算出する。
   * ★クリティカル抽選の乱数結果は state.meta.currentLevel に確定値として保存される
   *   （app.js のクエスト解呪ハンドラ参照）。未解呪時は initialLevel と同じ値を返す。
   * ★フィードバック送信ボーナス（生涯1回・+1Lv）は今回の改修対象外の既存機能のため、
   *   新レベル方式にもそのまま引き継ぐ。
   * ★伝説の勇者状態の場合は、通常の算出結果によらず Lv.99（カンスト）で固定する
   *   （ユーザーテストフィードバック改修・2026-08-08）。ただし hasConfirmedQuests()が
   *   falseの間（STEP2「クエストへ行く」を押す前）は判定しない（致命的バグ修正・2026-08-08）。
   * ★画面上のレベル表示は「STEP1→2」「STEP2→3」のボタン押下時のみ動く仕様
   *   （ゲーミフィケーション改修・2026-08-08）。state.meta.initialLevel が未確定
   *   （＝まだ一度もボタンを押していない）間は、固定費や年収の入力に反応して
   *   レベルがリアルタイムに動かないよう、常に基準レベルを返す。
   * @param {State} state
   * @returns {number}
   */
  currentLevel(state){
    if (!Number.isFinite(state?.meta?.initialLevel)) return C.INITIAL_LEVEL_BASE;
    if (!selectors.hasConfirmedQuests(state)) return state.meta.initialLevel;
    if (selectors.isLegendaryHero(state)) return C.LEGENDARY_LEVEL;
    return state.meta.currentLevel + (state?.meta?.feedbackBonusGranted ? C.BONUS_LEVEL_MAX : 0);
  },

  /**
   * 現在レベルに対応する役職を引く（新レベル方式・Phase3.3）。
   * ★伝説の勇者状態の場合は通常の役職テーブルによらず専用の役職名を返す
   *   （ユーザーテストフィードバック改修・2026-08-08）。
   * ★致命的バグ修正（2026-08-08）：hasConfirmedQuests()がfalseの間は判定しない
   *   （currentLevel()と同じゲート。理由はそちらのコメント参照）。
   * @param {State} state
   * @returns {{min:number, max:number, title:string}}
   */
  rankV2(state){
    if (selectors.hasConfirmedQuests(state) && selectors.isLegendaryHero(state)){
      return { min: C.LEGENDARY_LEVEL, max: C.LEGENDARY_LEVEL, title: C.LEGENDARY_RANK_TITLE };
    }
    const lv = selectors.currentLevel(state);
    return C.RANK_TABLE_V2.find(r => lv >= r.min && lv <= r.max) ?? C.RANK_TABLE_V2[0];
  },

  /**
   * ヘッダーの常時プログレスバー用：次のレベルアップ単位に対する到達率（%）。
   * ★ゲーミフィケーション改修v2：実額（円）ではなく questExpTotal（疑似EXP）を
   *   C.LEVELUP_UNITで割った端数を使う。
   * ★伝説の勇者状態（Lv.99カンスト）の場合はゲージも常にMAX（100%）で固定する。
   * ★致命的バグ修正（2026-08-08）：hasConfirmedQuests()がfalseの間は判定しない
   *   （currentLevel()と同じゲート。理由はそちらのコメント参照）。
   * @param {State} state
   * @returns {number}
   */
  headerProgressPct(state){
    if (selectors.hasConfirmedQuests(state) && selectors.isLegendaryHero(state)) return 100;
    const total = selectors.questExpTotal(state);
    return Math.round((total % C.LEVELUP_UNIT) / C.LEVELUP_UNIT * 100);
  },

  /**
   * 固定費クエスト・クレジットカードクエストを算出し、足切り（月額500円未満は除外）・
   * 節約可能額の降順ソートを行った表示用クエスト一覧を返す（Phase2〜3）。
   * ★解呪済みだが現在の入力では再生成されなくなったクエストも、確定済みの節約額のまま
   *   一覧から消えないよう合成する。
   * @param {State} state
   * @returns {{id:string, mainTitle:string, subTitle:string, detail?:string,
   *   monthlySaving:number, isExtra?:true}[]}
   */
  buildQuestList(state){
    const s = state ?? {};
    const fc = s.fixedCosts ?? {};
    const costs = {
      smartphone: fc.smartphone,
      internetMonthly: fc.internetMonthly,
      medicalInsurance: fc.medicalInsurance,
      fireInsurance: fc.fireInsurance,
      nhkMonthly: (C.NHK_PLANS.find(p => p.value === fc.nhkPlan) ?? C.NHK_PLANS[0]).monthly,
      hasCar: fc.hasCar,
      carInsurance: fc.carInsurance
    };
    const fixedResults = calc.evaluateFixedCostQuests(costs);
    const subscriptionResults = calc.evaluateSubscriptionQuests(s.selections);
    const exCreditResults = calc.evaluateExCreditQuests(
      s.selections?.exCredit, selectors.fixedCostsTotal(s), selectors.netIncome(s));

    // ★クレジットカード機能（実カード選択による診断）は一時凍結中（非表示。2026-08-08）。
    //   入力UIを隠しただけでなく、クエスト判定からも除外する。
    //   ロジック自体（calc.evaluateCreditCardQuests等）は将来の再開に備えて削除せず残してある。
    //   ★EXクエスト（フェーズ2）はこれとは別枠。state.selections.exCreditの簡易回答から
    //     evaluateExCreditQuestsで判定し、常に生成する（下記exCreditResultsを参照）。
    // const cards = selectors.resolvedCards(s);
    // const { annual } = calc.estimateCardSpend(selectors.fixedCostsTotal(s), selectors.netIncome(s));
    // const cardResults = calc.evaluateCreditCardQuests(cards, annual);

    const active = [];
    fixedResults.forEach(r => {
      if (r.monthlySaving < C.QUEST_MIN_SAVING) return;
      active.push({ ...fixedQuestMeta(r.category), monthlySaving: r.monthlySaving });
    });
    subscriptionResults.forEach(r => {
      if (r.monthlySaving < C.QUEST_MIN_SAVING) return;
      active.push({ ...subscriptionQuestMeta(r.id), monthlySaving: r.monthlySaving });
    });
    // ★EXクエストには足切り（QUEST_MIN_SAVING）を適用しない。条件を満たせば常に表示する
    //   （非表示・アンロックのギミックはフェーズ3で実装するため、今回は対象外）。
    exCreditResults.forEach(r => {
      active.push({ ...exCreditQuestMeta(r.pattern), monthlySaving: r.monthlySaving });
    });
    // cardResults.forEach(r => {
    //   if (r.monthlySaving < C.QUEST_MIN_SAVING) return;
    //   active.push({ ...cardQuestMeta(r.pattern, r), monthlySaving: r.monthlySaving });
    // });

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
   * 通常クエスト（isExtraでないもの）の件数を数える（EXクエスト フェーズ3）。
   * @param {State} state
   * @returns {number}
   */
  normalQuestCount(state){
    return selectors.buildQuestList(state).filter(q => !q.isExtra).length;
  },

  /**
   * 解呪済み（state.quests.completed）の通常クエストの件数を数える
   * （EXクエスト フェーズ3：アンロック判定の「累計2つ」に使う）。
   * @param {State} state
   * @returns {number}
   */
  completedNormalQuestCount(state){
    const s = state ?? {};
    const completed = s.quests?.completed ?? {};
    return selectors.buildQuestList(s)
      .filter(q => !q.isExtra && Object.prototype.hasOwnProperty.call(completed, q.id))
      .length;
  },

  /**
   * EXクエスト一覧（#ex-quest-list）を表示してよいかどうかを判定する（EXクエスト フェーズ3）。
   * ・通常クエストが0〜2件（優秀な勇者）の場合は常に解放する
   * ・3件以上（通常の冒険者）の場合は、通常クエストを累計2件解呪するまでロックする
   * ・固定費が未入力（クエスト自体が算出されていない初期状態）では常にロックする
   * @param {State} state
   * @returns {boolean}
   */
  exQuestUnlocked(state){
    if (selectors.fixedCostsTotal(state) <= 0) return false;
    const normalTotal = selectors.normalQuestCount(state);
    if (normalTotal <= 2) return true;
    return selectors.completedNormalQuestCount(state) >= 2;
  },

  /**
   * Xシェア用の文面を生成する（Phase3.3／Phase4.1）。
   * ★金額は一切含めず、レベル・役職・最大の成果のクエスト名（中立的な subTitle）のみを含める
   *   （CLAUDE.md 制約8の精神を踏襲）。伝説の勇者（Lv.99カンスト）の場合は専用文面で統一する
   *   （ユーザーテストフィードバック改修・2026-08-08）。
   * @param {State} state
   * @returns {string}
   */
  shareTextV2(state){
    const lv   = selectors.currentLevel(state);
    const rank = selectors.rankV2(state).title;
    if (selectors.isLegendaryHero(state)){
      return `【てどりクエスト】Lv.${lv} の ${rank} に到達！${C.LEGENDARY_HERO.mainTitle}`
           + ` #てどりクエスト #手取り最大化`;
    }
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
