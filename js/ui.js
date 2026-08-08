// ui.js — 差分描画（§6.6）。DOM操作の唯一の窓口。
// ★innerHTML による全再構築を禁止する（CLAUDE.md 制約5）。入力中の <input> がDOMごと
//   破棄され、1文字ごとにフォーカスが飛ぶ（iOSではソフトキーボードが閉じ実質入力不能になる）。
import { state } from './store.js';
import * as C from './config.js';
import * as calc from './calc.js';
import { selectors } from './selectors.js';
import { CREDIT_CARDS } from './creditCards.js';
import { loadHtml2Canvas, loadHtml2Pdf } from './vendor.js';

const YEN = n => Number(n ?? 0).toLocaleString('ja-JP');

// 医療費100万円のケースを目安として表示する。calcFinalSelfPay の totalMedicalCost に
// 対応する data-model が §4.1b に存在しないため、QUEST_CATALOG の cancelMedicalInsurance
// クエスト本文（§6.2.11）と同じ「医療費100万円」の例を UI 側でも代表値として採用する。
const ILLUSTRATIVE_MEDICAL_COST = 1000000;

/**
 * サブスク通信費の判定を文言化する。§12.6 の方針どおり、improvable では
 * 「まだ高い」等の否定的な表現を避け、選択肢の提示にとどめる。
 * @param {{level:string, gapToAverage:number, gapToOptimized:number}} judge
 * @returns {string}
 */
function smartphoneJudgeText(judge){
  if (judge.level === 'over_average'){
    return `平均（${YEN(C.MARKET_AVERAGE_SMARTPHONE.monthly)}円）を上回っています。`
         + `見直しで月${YEN(judge.gapToAverage)}円ほど下げられる余地があります。`;
  }
  if (judge.level === 'improvable'){
    return '平均は下回っていますが、オンライン専用プランなら'
         + `月${YEN(C.MARKET_AVERAGE_SMARTPHONE.optimizedMax)}円台という選択肢もあります。`;
  }
  return 'すでに十分に最適化された水準です。';
}

/**
 * 家賃の常時判定（多め／適正／控えめ）を算出する。閾値超過時のみ表示するのではなく、
 * 常に3段階のいずれかを返す（改善要望対応：一見して高い/適正/低いが分かるように）。
 * @param {ReturnType<typeof calc.calcRentGap>} rentGap
 * @param {number} rent
 * @returns {{level:'unset'|'appropriate'|'over_average'|'over_limit', text:string}}
 */
function rentJudge(rentGap, rent){
  const r = Math.max(0, Number(rent) || 0);
  if (r === 0) return { level:'unset', text:'エリアと家賃を入力すると判定が表示されます' };
  if (r > rentGap.limit){
    return { level:'over_limit',
      text:`📕 手取りに対してやや高めです（上限目安の${YEN(rentGap.limit)}円を${YEN(r - rentGap.limit)}円超えています）` };
  }
  if (rentGap.overMarket > 0){
    return { level:'over_average',
      text:`📙 地域平均（${YEN(rentGap.marketAverage)}円）よりやや高めですが、上限目安の範囲内です` };
  }
  return { level:'appropriate', text:'📗 地域平均・上限目安のいずれの範囲内でもあり、適正な水準です' };
}

/**
 * State から表示用の値をまとめて算出する（§4.1b バインディング契約表の text/progress/toggle 分）。
 * ★calc.js / selectors.js は DOM に触れないため、DOM 反映用の書式変換はここで行う。
 * ★Phase 1〜4改修（2026-08-07）：レベル表示・固定費モデルの変更に合わせて全面更新。
 * @param {object} s state（Proxyでも可）
 * @returns {Record<string, *>}
 */
function buildViewModel(s){
  const rank       = selectors.rankV2(s);
  const netIncome  = selectors.netIncome(s);
  const monthlyGross = selectors.monthlyGrossSalary(s);
  const grossHealth = calc.lookupStandardMonthly(monthlyGross);
  const avgStandardMonthly = grossHealth ? grossHealth.standard : 0;
  const isKumiai = s.userProfile.insuranceType === 'kumiai';

  // ★ユーザーテストフィードバック改修（2026-08-07）：健保組合の付加給付上限（固定値2.5万円）で
  //   自己負担額を一律に上書きする方式を廃止した。付加給付は勤務先ごとに金額が異なり、
  //   一律の金額を断定できないため、高額療養費の自己負担限度額は保険の種類によらず
  //   年収（標準報酬月額）から動的に判定した所得区分（ア〜オ）の金額をそのまま表示する。
  //   健保組合の場合はさらに自己負担が下がる可能性がある旨をTipsで案内するにとどめる。
  const selfPay = calc.calcFinalSelfPay({
    grossSalary: monthlyGross,
    isResidentTaxExempt: s.userProfile.isResidentTaxExempt,
    insuranceType: s.userProfile.insuranceType,
    fukaKyufuCap: null
  }, ILLUSTRATIVE_MEDICAL_COST);

  const injuryDaily = calc.calcInjuryAllowanceDaily(avgStandardMonthly, {
    isUnderOneYear: s.userProfile.isUnderOneYear,
    insuranceType: s.userProfile.insuranceType,
    kumiaiAverage: isKumiai ? C.KUMIAI_FIXED_VALUES.averageStandardMonthly : null
  });

  const rentGap  = calc.calcRentGap(netIncome, s.fixedCosts.rent, s.userProfile.area);
  const rentValue = Math.max(0, Number(s.fixedCosts.rent) || 0);
  const rentJudgeInfo = rentJudge(rentGap, rentValue);
  // ★メーターの表示レンジは「上限目安の1.2倍」を基準にし、家賃がそれを超える場合だけ伸ばす。
  //   これにより通常時は上限目安がバーの中央よりやや右あたりに来て視認しやすい。
  const rentScale = Math.max(rentGap.limit * 1.2, rentValue, rentGap.marketAverage, 1);
  const rentMeterPct = Math.min(100, Math.round((rentValue / rentScale) * 100));
  const rentAveragePct = Math.min(100, Math.round((rentGap.marketAverage / rentScale) * 100));
  const rentLimitPct = Math.min(100, Math.round((rentGap.limit / rentScale) * 100));

  const judge = C.judgeSmartphoneCost(Number(s.fixedCosts.smartphone) || 0);

  const hasSubscription = (s.selections.subscriptionPlanIds ?? []).length > 0
    || (s.selections.otherSubscriptions ?? []).length > 0;

  const questList = selectors.buildQuestList(s);
  const questTotalSaving = questList.reduce((sum, q) => sum + q.monthlySaving, 0);

  return {
    displayLevel: selectors.currentLevel(s),
    // ★「あなたの称号」の成長可視化（ユーザーテストフィードバック改修）：STEP2完了時点
    //   （クエスト開始前）に確定したレベル。state.meta.initialLevelはSTEP2「クエストへ行く」
    //   （ACTIONS.generateQuests）でのみ再計算され、以降クエストの解呪では変化しないため、
    //   そのまま「開始時レベル」として使える（未確定時は現在レベルにフォールバック）。
    startLevel: Number.isFinite(s.meta.initialLevel) ? s.meta.initialLevel : selectors.currentLevel(s),
    rankTitle: rank.title,
    completedSavingFormatted: YEN(selectors.completedSavingTotal(s)),
    questTotalSaving: YEN(questTotalSaving),
    netIncome: YEN(netIncome),
    hasFixedCostInput: selectors.fixedCostsTotal(s) > 0,
    selfPayCap: YEN(selfPay.amount),
    injuryDaily: YEN(injuryDaily),
    rentOverMarket: YEN(rentGap.overMarket),
    rentAreaAverage: YEN(rentGap.marketAverage),
    rentPaybackYears: rentGap.paybackYears === null ? '—' : rentGap.paybackYears.toFixed(1),
    rentJudgeText: rentJudgeInfo.text,
    rentJudgeLevel: rentJudgeInfo.level,
    rentMeterPct,
    rentAveragePct,
    rentLimitPct,
    smartphoneJudge: smartphoneJudgeText(judge),
    hasSubscription
  };
}

/**
 * 固定費カテゴリの現状値を取得する（Phase2.1の2段階目標バー用）。
 * @param {object} s state
 * @param {string} category FIXED_COST_TARGETS のキー
 * @returns {number}
 */
function getCostCategoryValue(s, category){
  const fc = s.fixedCosts ?? {};
  switch (category){
    case 'smartphone':       return Math.max(0, Number(fc.smartphone) || 0);
    case 'internet':         return Math.max(0, Number(fc.internetMonthly) || 0);
    case 'medicalInsurance': return Math.max(0, Number(fc.medicalInsurance) || 0);
    case 'fireInsurance':    return Math.max(0, Number(fc.fireInsurance) || 0);
    case 'subscriptions':    return selectors.subscriptionTotal(s);
    case 'nhk':               return (C.NHK_PLANS.find(p => p.value === fc.nhkPlan) ?? C.NHK_PLANS[0]).monthly;
    case 'carInsurance':     return Math.max(0, Number(fc.carInsurance) || 0);
    case 'parking':          return Math.max(0, Number(fc.parking) || 0);
    default: return 0;
  }
}

/**
 * カテゴリの「全国平均」に相当する基準値を取得する。駐車場代はエリアによって
 * 相場が大きく異なるため、選択中のエリア（userProfile.area）に応じた値を返す
 * （ユーザーテストフィードバック改修・2026-08-07）。それ以外は固定の全国平均値のまま。
 * @param {object} s state
 * @param {string} category FIXED_COST_TARGETS のキー
 * @param {{average:number}} target FIXED_COST_TARGETS[category]
 * @returns {number}
 */
function getCategoryAverage(s, category, target){
  if (category === 'parking'){
    const area = s.userProfile?.area;
    return C.MARKET_AVERAGE_PARKING[area] ?? C.MARKET_AVERAGE_PARKING[C.MARKET_AVERAGE_PARKING._default];
  }
  return target.average;
}

/**
 * 固定費の2段階目標バー（全国平均・理想の目標値マーカー付き）を更新する。
 * @param {object} s state
 * @returns {void}
 */
function syncCostBars(s){
  document.querySelectorAll('[data-cost-bar]').forEach(bar => {
    const category = bar.dataset.costBar;
    const target = C.FIXED_COST_TARGETS[category];
    if (!target) return;
    const value = getCostCategoryValue(s, category);
    const average = getCategoryAverage(s, category, target);
    const scale = Math.max(average * 1.2, value, target.ideal ?? 0, 1);
    const fillPct = Math.min(100, Math.round((value / scale) * 100));
    const avgPct  = Math.min(100, Math.round((average / scale) * 100));

    const fill = bar.querySelector('.cost-bar__fill');
    if (fill){
      const next = `${fillPct}%`;
      if (fill.style.width !== next) fill.style.width = next;
    }
    const avgMarker = bar.querySelector('[data-cost-marker="average"]');
    if (avgMarker){
      const next = `${avgPct}%`;
      if (avgMarker.style.left !== next) avgMarker.style.left = next;
    }
    const avgLabel = bar.querySelector('[data-cost-average-label]');
    if (avgLabel){
      const next = `エリア平均 ¥${YEN(average)}`;
      if (avgLabel.textContent !== next) avgLabel.textContent = next;
    }
    if (target.ideal !== null && target.ideal !== undefined){
      const idealPct = Math.min(100, Math.round((target.ideal / scale) * 100));
      const idealMarker = bar.querySelector('[data-cost-marker="ideal"]');
      if (idealMarker){
        const next = `${idealPct}%`;
        if (idealMarker.style.left !== next) idealMarker.style.left = next;
      }
    }
  });
}

/**
 * 条件付き表示欄（自動車保険/駐車場代の入力群）の開閉を同期する。
 * ★光回線はウィザードUI改修（2026-08-08）でプロバイダ選択式を廃止し常時表示の
 *   単純な数値入力に変更したため、条件付き表示の対象から外れた。
 * @param {object} s state
 * @returns {void}
 */
function syncConditionalFields(s){
  const carField = document.querySelector('[data-conditional-field="hasCar"]');
  if (carField){
    const next = !s.fixedCosts.hasCar;
    if (carField.hidden !== next) carField.hidden = next;
  }
}

/**
 * カードの <option> 一覧を、対象カード配列が変わった時だけ作り直す。
 * @param {HTMLSelectElement} select
 * @param {import('./creditCards.js').CreditCard[]} cards
 * @param {string|null} selectedId
 * @returns {void}
 */
function rebuildCardOptions(select, cards, selectedId){
  const signature = cards.map(c => c.id).join(',');
  if (select.dataset.signature !== signature){
    select.dataset.signature = signature;
    select.querySelectorAll('option:not([data-placeholder])').forEach(o => o.remove());
    cards.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  }
  const next = selectedId ?? '';
  if (select.value !== next && [...select.options].some(o => o.value === next)) select.value = next;
}

/**
 * クレジットカードの選択UI（メイン・サブ・その他）を同期する。
 * メイン／サブに選ばれたカードは、サブ／その他の選択肢から自動的に除外する。
 * @param {object} s state
 * @returns {void}
 */
function syncCreditCardUI(s){
  const mainSel = document.getElementById('in-cardMain');
  const subSel  = document.getElementById('in-cardSub');
  const othersBox = document.querySelector('[data-card-others]');
  if (!mainSel || !subSel || !othersBox) return;

  const cc = s.creditCards ?? {};
  rebuildCardOptions(mainSel, CREDIT_CARDS, cc.main);
  const subCandidates = CREDIT_CARDS.filter(c => c.id !== cc.main);
  rebuildCardOptions(subSel, subCandidates, cc.sub);

  const otherCandidates = CREDIT_CARDS.filter(c => c.id !== cc.main && c.id !== cc.sub);
  const signature = otherCandidates.map(c => c.id).join(',');
  if (othersBox.dataset.signature !== signature){
    othersBox.dataset.signature = signature;
    othersBox.querySelectorAll('label').forEach(l => l.remove());
    otherCandidates.forEach(c => {
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.cardOtherToggle = c.id;
      cb.checked = (cc.others ?? []).includes(c.id);
      const span = document.createElement('span');
      span.textContent = c.name;
      label.append(cb, span);
      othersBox.appendChild(label);
    });
  } else {
    othersBox.querySelectorAll('[data-card-other-toggle]').forEach(cb => {
      const next = (cc.others ?? []).includes(cb.dataset.cardOtherToggle);
      if (cb.checked !== next) cb.checked = next;
    });
  }
}

// ---------------------------------------------------------------------------
// ウィザードUI改修（2026-08-08）：画面切替（1〜4）とボトムナビの同期
// ---------------------------------------------------------------------------

/**
 * 現在の画面（state.meta.screen）に応じて .screen の表示・非表示と
 * ボトムナビの活性状態／aria-current を同期する。
 * ★ナビゲーションバグ修正（2026-08-08）：ボトムナビの活性判定は「今表示中の画面」
 *   （state.meta.screen）ではなく「これまでに到達した最大の画面」（state.meta.maxScreen）で行う。
 *   前者を使うと、一度結果画面まで進んでからSTEP1へ戻った瞬間に他タブが再びロックされ、
 *   タブでの行き来ができなくなるバグがあった。
 * @param {object} s state
 * @returns {void}
 */
function syncScreens(s){
  const current = Number(s.meta.screen) || 1;
  const maxReached = Math.max(Number(s.meta.maxScreen) || 1, current);
  document.querySelectorAll('.screen[data-screen]').forEach(el => {
    const n = Number(el.dataset.screen);
    const next = n !== current;
    if (el.hidden !== next) el.hidden = next;
  });
  document.querySelectorAll('[data-nav-screen]').forEach(btn => {
    const n = Number(btn.dataset.navScreen);
    const reachable = n <= maxReached;
    if (btn.disabled !== !reachable) btn.disabled = !reachable;
    const isCurrent = n === current;
    if (btn.getAttribute('aria-current') !== (isCurrent ? 'page' : null)){
      if (isCurrent) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    }
  });
}

/**
 * STEP1（画面1）の必須項目が揃っているかを判定する（「次へ」ボタンの活性制御用）。
 * @param {object} s state
 * @returns {boolean}
 */
function canStartDiagnosis(s){
  return Number(s.userProfile.annualSalary) > 0 && Number(s.userProfile.age) > 0;
}

// ---------------------------------------------------------------------------
// クエスト一覧の動的描画（Phase2〜3改修）
//   ★QUEST_CATALOG の静的転記ではなく、selectors.buildQuestList() の結果を
//     createElement で組み立てる（innerHTML 不使用＝制約5）。
// ---------------------------------------------------------------------------

/**
 * 1件分のクエストカード（アコーディオン）のDOMを組み立てる。
 * @param {ReturnType<typeof selectors.buildQuestList>[number]} q
 * @param {object} s state
 * @returns {HTMLLIElement}
 */
function createQuestItem(q, s){
  const li = document.createElement('li');
  li.className = 'quest-item';
  if (q.isExtra) li.classList.add('quest-item--ex');   // ★EXクエスト フェーズ2：金枠の特別デザイン
  li.dataset.questId = q.id;

  const head = document.createElement('div');
  head.className = 'quest-item__head';
  const title = document.createElement('h3');
  title.className = 'quest-item__title';
  if (q.isExtra){
    const badge = document.createElement('span');
    badge.className = 'quest-item__ex-badge';
    badge.textContent = '[EX]';
    title.append(badge, ` ${q.mainTitle}`);
  } else {
    title.textContent = q.mainTitle;
  }
  const saving = document.createElement('span');
  saving.className = 'quest-item__saving';
  saving.textContent = `¥${YEN(q.monthlySaving)}/月`;
  head.append(title, saving);

  const summary = document.createElement('p');
  summary.className = 'quest-item__summary';
  summary.textContent = q.subTitle ?? '';

  const details = document.createElement('details');
  details.className = 'quest-item__basis';
  const sum = document.createElement('summary');
  sum.textContent = '⚔️ 詳細を見る';
  details.appendChild(sum);

  if (q.detail){
    const p = document.createElement('p');
    p.textContent = q.detail;
    details.appendChild(p);
  }
  if (q.basis){
    const p = document.createElement('p');
    p.textContent = q.basis;
    details.appendChild(p);
  }
  if (q.talkScript?.length){
    const ul = document.createElement('ul');
    ul.className = 'quest-item__talkscript';
    q.talkScript.forEach(t => {
      const item = document.createElement('li');
      item.textContent = t;
      ul.appendChild(item);
    });
    details.appendChild(ul);
  }
  if (q.disclaimer){
    const p = document.createElement('p');
    p.className = 'quest-item__disclaimer';
    p.textContent = q.disclaimer;
    details.appendChild(p);
  }

  const label = document.createElement('label');
  label.className = 'quest-item__toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.dataset.questToggle = q.id;
  checkbox.dataset.questSaving = String(q.monthlySaving);
  checkbox.setAttribute('aria-label', q.subTitle || q.mainTitle);
  checkbox.checked = s.quests.completed[q.id] !== undefined;
  const span = document.createElement('span');
  // ★クエストごとの具体的な行動完了文言を表示する（例：「格安SIMに乗り換えた！」）。
  //   個別の文言が無いクエストのみ汎用文言にフォールバックする。
  span.textContent = q.completeLabel ?? '🎉 解呪完了';
  label.append(checkbox, span);
  details.appendChild(label);

  li.append(head, summary, details);
  return li;
}

/** チェックボックスの checked 状態だけを最新化する（クエスト一覧が変わっていない場合用）。 */
function syncQuestCheckboxes(s){
  document.querySelectorAll('[data-quest-toggle]').forEach(cb => {
    const id = cb.dataset.questToggle;
    const next = s.quests.completed[id] !== undefined;
    if (cb.checked !== next) cb.checked = next;
  });
}

/** 「伝説の勇者」カードの中身を（初回のみ）組み立てる。 */
function renderLegendaryCard(el){
  if (el.childElementCount) return;                    // 静的文言のため一度作れば十分
  const title = document.createElement('p');
  title.className = 'card--legendary__title';
  title.textContent = C.LEGENDARY_HERO.mainTitle;
  const subtitle = document.createElement('p');
  subtitle.className = 'card--legendary__subtitle';
  subtitle.textContent = C.LEGENDARY_HERO.subTitle;
  el.append(title, subtitle);
}

let lastQuestSignature = null;

/** クエスト一覧の再描画キャッシュを破棄する（全リセット直後など、強制再構築したい時に呼ぶ）。 */
export function resetQuestListCache(){ lastQuestSignature = null; }

/**
 * クエスト一覧を再描画する。クエストの構成（id・節約可能額・isExtra）が変わっていない場合は
 * チェック状態の同期のみ行い、DOMの作り直しはしない。
 * ★EXクエスト（フェーズ2〜3）：isExtra:true のクエストは通常の一覧（data-quest-list）ではなく
 *   専用コンテナ（[data-ex-quest-items]）に振り分けて描画する。表示・非表示とアンロック演出は
 *   別関数 syncExQuestUnlock() が担当する（構成が変わっていない再描画でも毎回判定が必要なため）。
 * @param {object} s state
 * @returns {void}
 */
function renderQuestList(s){
  const container = document.querySelector('[data-quest-list]');
  const exContainer = document.querySelector('[data-ex-quest-items]');
  const legendary  = document.querySelector('[data-legendary-hero]');
  if (!container) return;

  const allQuests = selectors.buildQuestList(s);
  const quests = allQuests.filter(q => !q.isExtra);
  const exQuests = allQuests.filter(q => q.isExtra);
  const signature = JSON.stringify(allQuests.map(q => [q.id, q.monthlySaving, Boolean(q.isExtra)]));
  if (signature === lastQuestSignature){
    syncQuestCheckboxes(s);
  } else {
    lastQuestSignature = signature;
    container.querySelectorAll('.quest-item').forEach(el => el.remove());
    quests.forEach(q => container.appendChild(createQuestItem(q, s)));
    if (exContainer){
      exContainer.querySelectorAll('.quest-item').forEach(el => el.remove());
      exQuests.forEach(q => exContainer.appendChild(createQuestItem(q, s)));
    }
  }

  if (legendary){
    const showLegendary = allQuests.length === 0;
    if (legendary.hidden !== !showLegendary) legendary.hidden = !showLegendary;
    if (showLegendary) renderLegendaryCard(legendary);
  }

  syncExQuestUnlock(s);
}

// ---------------------------------------------------------------------------
// EXクエスト アンロック演出（エクストラクエスト フェーズ3・2026-08-08）
//   ★通常クエストが0〜2件（優秀な勇者）の場合は最初から解放し、専用メッセージを表示する。
//     3件以上（通常の冒険者）の場合は初期状態でロックし、通常クエストを累計2件解呪した
//     「瞬間」にのみメッセージ挿入＋アニメーションを発生させる（以後の再描画では再生しない）。
// ---------------------------------------------------------------------------
let exQuestWasUnlocked = null;   // null=未初期化（初回描画）。true/false=直近の同期時点の解放状態

/** EXクエストのアンロック演出の追跡状態をリセットする（全リセット・呪文復元直後に呼ぶ）。 */
export function resetExQuestUnlockState(){ exQuestWasUnlocked = null; }

const EX_UNLOCK_MESSAGES = {
  elite:  '【特例開放】あなたの家計はすでに高い防御力を誇っています。さらなる高みを目指すための特別な試練を用意しました！',
  normal: '見事2つの魔道障壁を浄化した！その行動力を称え、新たな試練（EXクエスト）を開放する！'
};

/**
 * アンロックメッセージ（<p class="ex-unlock-msg">）をコンテナの先頭に挿入する。
 * 既に挿入済みの場合は何もしない（再描画のたびに重複挿入しないためのガード）。
 * @param {HTMLElement} container #ex-quest-list（外側div）
 * @param {'elite'|'normal'} kind
 * @param {boolean} animate trueの場合のみ出現アニメーションを付与する
 * @returns {void}
 */
function insertExUnlockMessage(container, kind, animate){
  if (container.querySelector('.ex-unlock-msg')) return;
  const p = document.createElement('p');
  p.className = `ex-unlock-msg ${kind}-msg`;
  if (animate) p.classList.add('is-animating');
  p.textContent = EX_UNLOCK_MESSAGES[kind];
  container.insertBefore(p, container.firstChild);
}

/**
 * EXクエスト一覧（#ex-quest-list）の表示・非表示と、ロック解除の瞬間の演出を同期する。
 * @param {object} s state
 * @returns {void}
 */
function syncExQuestUnlock(s){
  const container = document.getElementById('ex-quest-list');
  if (!container) return;

  const unlocked = selectors.exQuestUnlocked(s);
  const isElite = selectors.normalQuestCount(s) <= 2;

  if (!unlocked){
    container.style.display = 'none';
    exQuestWasUnlocked = false;
    return;
  }

  // ★演出（アニメーション）を出すのは「通常の冒険者（isElite=false）」が
  //   ロック（exQuestWasUnlocked===false）からアンロックへ切り替わった、まさにその瞬間のみ。
  //   優秀な勇者（isElite=true）は常に静的表示（何度renderが走っても演出しない）。
  //   ★render()は入力のたびに何度も走るため、画面1・2の入力中に固定費が0円→1円以上に
  //   変わっただけの初回遷移（isElite）まで演出扱いにしないよう、isEliteを最優先で除外する。
  const justUnlocked = !isElite && exQuestWasUnlocked === false;
  container.style.display = 'block';
  insertExUnlockMessage(container, isElite ? 'elite' : 'normal', justUnlocked);
  exQuestWasUnlocked = true;
}

// ---------------------------------------------------------------------------
// サブスク階層UI（ゲーミフィケーション改修v3・2026-08-08）
//   ★アコーディオン＋チェックボックス＋プログレッシブディスクロージャー方式に全面刷新。
//     デジタルサブスク（カテゴリ→サービス→プラン）・リアル課金（手動入力）とも、
//     静的データ（SUBSCRIPTION_PLANS / OTHER_SUBSCRIPTION_PRESETS）から起動時に一度だけ
//     DOMを組み立てる（populateSubscriptionAccordion / populateRealChargeAccordion）。
//     構造そのものは実行中に変化しないため、以後は checked / select値 / バッジ文言のみを
//     render() のたびに syncSubscriptionAccordion で同期する（差分描画の対象外）。
// ---------------------------------------------------------------------------

const SUB_CATEGORY_ICON = { video:'🎬', music:'🎵', books:'📚', cloud:'☁️', game:'🎮' };

/**
 * RPG風チェックボックス（[ ]/[*]表示。CSSの:checked擬似クラスで見た目を切り替える）の
 * 1行分のDOMを組み立てる。
 * @param {string} labelText 表示テキスト
 * @param {string} datasetKey input.dataset に設定するキー（camelCase）
 * @param {string} datasetValue 上記キーの値
 * @returns {{row:HTMLLabelElement, input:HTMLInputElement}}
 */
function buildRpgCheckboxRow(labelText, datasetKey, datasetValue){
  const row = document.createElement('label');
  row.className = 'rpg-checkbox';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.dataset[datasetKey] = datasetValue;
  input.setAttribute('aria-label', labelText);
  const box = document.createElement('span');
  box.className = 'rpg-checkbox__box';
  box.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span');
  text.className = 'rpg-checkbox__label';
  text.textContent = labelText;
  row.append(input, box, text);
  return { row, input };
}

/**
 * プログレッシブディスクロージャー用の折りたたみラッパーを組み立てる（CSSの
 * grid-template-rows 0fr→1fr でスムーズに開閉する。開閉自体はis-openクラスで制御する）。
 * @returns {{wrap:HTMLDivElement, inner:HTMLDivElement}}
 */
function buildRevealWrap(){
  const wrap = document.createElement('div');
  wrap.className = 'sub-reveal';
  const inner = document.createElement('div');
  inner.className = 'sub-reveal__inner';
  wrap.appendChild(inner);
  return { wrap, inner };
}

/**
 * デジタルサブスクのアコーディオンUI（カテゴリ→サービス→プラン選択）を、
 * SUBSCRIPTION_PLANS から起動時に一度だけ組み立てる。
 * ★プランの選択肢は初期状態のオーディエンス（C.DEFAULT_PLAN_AUDIENCE='single'）のみ表示する。
 * ★サービスのチェックボックスは data-sub-service-toggle、プランのselectは既存の
 *   data-plan-group（app.js onPlanGroupChangeがラジオ/select問わず同じロジックで処理する）を使う。
 * @returns {void}
 */
export function populateSubscriptionAccordion(){
  const container = document.querySelector('[data-sub-categories]');
  if (!container || container.childElementCount) return;   // 二重初期化を防ぐ

  C.SUBSCRIPTION_PLANS.forEach(category => {
    const details = document.createElement('details');
    details.className = 'sub-category';
    details.dataset.subCategory = category.id;

    const summary = document.createElement('summary');
    const labelSpan = document.createElement('span');
    labelSpan.textContent = `${SUB_CATEGORY_ICON[category.id] ?? ''} ${category.label}`.trim();
    const badge = document.createElement('span');
    badge.className = 'sub-badge';
    badge.textContent = '未選択';
    summary.append(labelSpan, badge);
    details.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'sub-category__body';

    category.services.forEach(service => {
      const singlePlans = service.plans.filter(p => p.audience === C.DEFAULT_PLAN_AUDIENCE);
      const { row } = buildRpgCheckboxRow(service.name, 'subServiceToggle', service.id);
      body.appendChild(row);

      const { wrap, inner } = buildRevealWrap();
      wrap.dataset.subServiceReveal = service.id;
      const select = document.createElement('select');
      select.className = 'input input--select';
      select.dataset.planGroup = service.id;
      select.setAttribute('aria-label', `${service.name}のプラン`);
      singlePlans.forEach(plan => {
        const opt = document.createElement('option');
        opt.value = plan.id;
        opt.textContent = `${plan.label}（${C.resolvePlanMonthly(plan).toLocaleString('ja-JP')}円）`;
        select.appendChild(opt);
      });
      inner.appendChild(select);
      body.appendChild(wrap);
    });

    details.appendChild(body);
    container.appendChild(details);
  });
}

/**
 * リアル課金（手動入力）のアコーディオンUIを起動時に一度だけ組み立てる。
 * config.js の OTHER_SUBSCRIPTION_PRESETS（固定5項目）に「その他（自由入力）」の1行を
 * 加えて並べる。入力欄自体は既存の data-other-sub-id/data-other-sub-field デリゲーション
 * （app.js onOtherSubscriptionFieldInput）をそのまま流用する。
 * @returns {void}
 */
export function populateRealChargeAccordion(){
  const container = document.querySelector('[data-real-charge-list]');
  if (!container || container.childElementCount) return;   // 二重初期化を防ぐ

  C.OTHER_SUBSCRIPTION_PRESETS.forEach(preset => {
    const { row } = buildRpgCheckboxRow(preset.label, 'realChargeToggle', preset.id);
    container.appendChild(row);

    const { wrap, inner } = buildRevealWrap();
    wrap.dataset.realChargeReveal = preset.id;
    inner.dataset.otherSubId = preset.id;
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.inputMode = 'numeric';
    amountInput.pattern = '[0-9,]*';
    amountInput.className = 'input';
    amountInput.placeholder = '8,000';
    amountInput.autocomplete = 'off';
    amountInput.enterKeyHint = 'done';
    amountInput.dataset.otherSubField = 'monthly';
    amountInput.dataset.composing = '0';
    amountInput.setAttribute('aria-label', `${preset.label}の月額（円）`);
    inner.appendChild(amountInput);
    container.appendChild(wrap);
  });

  // 「その他（自由入力）」：サービス名（テキスト）＋月額（数値）の両方を入力する
  const { row: customRow } = buildRpgCheckboxRow('その他（自由入力）', 'realChargeToggle', 'custom');
  container.appendChild(customRow);

  const { wrap: customWrap, inner: customInner } = buildRevealWrap();
  customWrap.dataset.realChargeReveal = 'custom';
  customInner.classList.add('other-sub-row');
  customInner.dataset.otherSubId = 'custom';

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'input input--label';
  labelInput.maxLength = C.OTHER_SUBSCRIPTION.labelMaxLength;
  labelInput.placeholder = '習い事';
  labelInput.autocomplete = 'off';
  labelInput.enterKeyHint = 'done';
  labelInput.dataset.otherSubField = 'label';
  labelInput.dataset.composing = '0';
  labelInput.setAttribute('aria-label', 'サービス名');

  const customAmount = document.createElement('input');
  customAmount.type = 'text';
  customAmount.inputMode = 'numeric';
  customAmount.pattern = '[0-9,]*';
  customAmount.className = 'input';
  customAmount.placeholder = '8,000';
  customAmount.autocomplete = 'off';
  customAmount.enterKeyHint = 'done';
  customAmount.dataset.otherSubField = 'monthly';
  customAmount.dataset.composing = '0';
  customAmount.setAttribute('aria-label', '月額（円）');

  customInner.append(labelInput, customAmount);
  container.appendChild(customWrap);
}

/**
 * リアル課金アコーディオンの見出しバッジ（件数・合計額）を組み立てる。
 * @param {object} s state
 * @returns {string} 例:「2件・9,000円」。未選択時は「未選択」
 */
function realChargeSummary(s){
  const rows = s?.selections?.otherSubscriptions ?? [];
  if (!rows.length) return '未選択';
  return `${rows.length}件・${C.sumOtherSubscriptions(rows).toLocaleString('ja-JP')}円`;
}

/**
 * サブスクアコーディオンUI（デジタル・リアル課金とも）の checked / select値 / バッジ文言を
 * state から同期する（render()のたびに呼ぶ。DOM構造は起動時に固定済みのため作り直しはしない）。
 * @param {object} s state
 * @returns {void}
 */
function syncSubscriptionAccordion(s){
  const selectedPlans = new Set(s.selections.subscriptionPlanIds ?? []);

  document.querySelectorAll('[data-sub-service-toggle]').forEach(cb => {
    const group = cb.dataset.subServiceToggle;
    const idsInGroup = getPlanIdsForGroup(group);
    const selectedId = [...selectedPlans].find(id => idsInGroup.has(id)) ?? '';
    const isChecked = selectedId !== '';
    if (cb.checked !== isChecked) cb.checked = isChecked;

    const reveal = document.querySelector(`[data-sub-service-reveal="${group}"]`);
    if (!reveal) return;
    reveal.classList.toggle('is-open', isChecked);
    const select = reveal.querySelector('select');
    if (select && select !== document.activeElement && selectedId && select.value !== selectedId){
      select.value = selectedId;
    }
  });

  syncSubscriptionBadges(s);

  const otherRows = s.selections.otherSubscriptions ?? [];
  const otherById = new Map(otherRows.map(r => [r.id, r]));
  document.querySelectorAll('[data-real-charge-toggle]').forEach(cb => {
    const id = cb.dataset.realChargeToggle;
    const row = otherById.get(id);
    const isChecked = Boolean(row);
    if (cb.checked !== isChecked) cb.checked = isChecked;

    const reveal = document.querySelector(`[data-real-charge-reveal="${id}"]`);
    if (!reveal) return;
    reveal.classList.toggle('is-open', isChecked);

    const labelEl = reveal.querySelector('[data-other-sub-field="label"]');
    const monthlyEl = reveal.querySelector('[data-other-sub-field="monthly"]');
    if (labelEl && labelEl !== document.activeElement && labelEl.dataset.composing !== '1'){
      const next = row?.label ?? '';
      if (labelEl.value !== next) labelEl.value = next;
    }
    if (monthlyEl && monthlyEl !== document.activeElement){
      const next = formatNumber(row?.monthly);
      if (monthlyEl.value !== next) monthlyEl.value = next;
    }
  });

  const realChargeBadge = document.querySelector('[data-real-charge-badge]');
  if (realChargeBadge){
    const next = realChargeSummary(s);
    if (realChargeBadge.textContent !== next) realChargeBadge.textContent = next;
  }
}

/**
 * "a.b.c" 形式のパスで値を読む。
 * @param {object} obj
 * @param {string} path
 * @returns {*}
 */
export function getByPath(obj, path){
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

/**
 * "a.b.c" 形式のパスで値を書く（途中のオブジェクトは存在している前提）。
 * @param {object} obj
 * @param {string} path
 * @param {*} value
 * @returns {void}
 */
export function setByPath(obj, path, value){
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}

/**
 * 数値をカンマ区切り文字列にする（入力欄の再表示用）。null/undefined/NaNは空文字。
 * @param {*} v
 * @returns {string}
 */
export function formatNumber(v){
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('ja-JP') : '';
}

/**
 * 年収ドロップダウンの選択肢を組み立てる（起動時に一度だけ呼ぶ静的な一覧のため）。
 * @returns {void}
 */
export function populateAnnualSalarySelect(){
  const select = document.querySelector('[data-annual-salary-select]');
  if (!select || select.options.length) return;   // 二重初期化を防ぐ
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '選択してください';
  select.appendChild(placeholder);
  C.ANNUAL_SALARY_OPTIONS.forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = String(value);
    opt.textContent = label;
    select.appendChild(opt);
  });
}

let rafId = null, isRendering = false;

/** 次フレームでの再描画を予約する（1フレーム1回に集約）。 */
export function scheduleRender(){
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => { rafId = null; render(); });
}

function render(){
  if (isRendering) return;                              // 再入ガード（第二防波堤）
  isRendering = true;
  try{
    const view = buildViewModel(state);

    document.querySelectorAll('[data-bind]').forEach(el => {
      const [type, key] = el.dataset.bind.split(':');
      const val = view[key];
      if (type === 'text'){
        if (el.textContent !== String(val)) el.textContent = val;   // 差分時のみ触る
      } else if (type === 'progress'){
        const next = `${Math.max(0, Math.min(100, Number(val) || 0))}%`;
        if (el.style.getPropertyValue('--progress') !== next)
          el.style.setProperty('--progress', next);
      } else if (type === 'toggle'){
        const next = !val;
        if (el.hidden !== next) el.hidden = next;
      }
    });

    syncRentMeter(view);
    syncCostBars(state);
    syncConditionalFields(state);
    syncCreditCardUI(state);
    syncScreens(state);
    syncHeaderGauge(state);
    renderQuestList(state);

    const step1Btn = document.querySelector('[data-requires-step1]');
    if (step1Btn){
      const next = !canStartDiagnosis(state);
      if (step1Btn.disabled !== next) step1Btn.disabled = next;
    }

    // ★フォーカス中・IME変換中の入力欄には絶対に書き戻さない（CLAUDE.md 制約5）
    document.querySelectorAll('[data-model]').forEach(el => {
      if (el === document.activeElement) return;
      if (el.dataset.composing === '1') return;

      const raw = getByPath(state, el.dataset.model);
      if (el.type === 'checkbox'){
        const next = Boolean(raw);
        if (el.checked !== next) el.checked = next;
      } else if (el.tagName === 'SELECT'){
        const next = raw ?? '';
        if (el.value !== String(next)) el.value = String(next);
      } else {
        const next = formatNumber(raw);
        if (el.value !== next) el.value = next;
      }
    });

    // ★サブスクのチェックボックス・selectは data-model を持たないため、上のループでは
    //   同期されない。選択状態は state.selections.subscriptionPlanIds / otherSubscriptions を
    //   唯一の正とし、再描画のたびにDOMをそこから引き直す（CLAUDE.md 制約4）。
    syncSubscriptionAccordion(state);
  } finally { isRendering = false; }
}

/**
 * 家賃の常時比較メーターを更新する。マーカーの left%・バーと判定文の色（data-level）は
 * data-bind の汎用ループ（text/progress/toggleのみ対応）では表現できないため専用で行う。
 * @param {Record<string,*>} view buildViewModel() の戻り値
 * @returns {void}
 */
function syncRentMeter(view){
  const verdict = document.querySelector('.rent-meter__verdict');
  if (verdict && verdict.dataset.level !== view.rentJudgeLevel) verdict.dataset.level = view.rentJudgeLevel;

  const bar = document.querySelector('.rent-meter__bar');
  if (bar && bar.dataset.level !== view.rentJudgeLevel) bar.dataset.level = view.rentJudgeLevel;

  const avgMarker = document.querySelector('[data-rent-marker="average"]');
  if (avgMarker){
    const next = `${view.rentAveragePct}%`;
    if (avgMarker.style.left !== next) avgMarker.style.left = next;
  }
  const limitMarker = document.querySelector('[data-rent-marker="limit"]');
  if (limitMarker){
    const next = `${view.rentLimitPct}%`;
    if (limitMarker.style.left !== next) limitMarker.style.left = next;
  }
}

const planGroupCache = new Map();   // groupId(サービスID) → Set(そのサービスのプランID)

function getPlanIdsForGroup(group){
  if (planGroupCache.has(group)) return planGroupCache.get(group);
  const service = C.SUBSCRIPTION_PLANS.flatMap(cat => cat.services).find(s => s.id === group);
  const ids = new Set(service ? service.plans.map(p => p.id) : []);
  planGroupCache.set(group, ids);
  return ids;
}

function syncSubscriptionBadges(s){
  document.querySelectorAll('[data-sub-category]').forEach(details => {
    const badge = details.querySelector('.sub-badge');
    if (!badge) return;
    const next = selectors.subscriptionSummary(s, details.dataset.subCategory) || '未選択';
    if (badge.textContent !== next) badge.textContent = next;
  });
}

// ---------------------------------------------------------------------------
// トースト通知（§3.6・§4.5・§6.5 が参照するが定義のない showToast をここに実装する）
// ---------------------------------------------------------------------------
let toastTimer = null;

/**
 * 画面下部にトーストを表示する（即時・上書き）。
 * @param {string} message
 * @param {'info'|'warn'|'levelup'} [tone]
 * @returns {void}
 */
export function showToast(message, tone = 'info'){
  const el = document.getElementById('toast');
  if (!el) return;                                        // トースト要素が無い環境でも落ちない
  clearTimeout(toastTimer);
  el.textContent = message;
  el.classList.toggle('toast--warn', tone === 'warn');
  el.classList.toggle('toast--levelup', tone === 'levelup');
  el.hidden = false;
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

// ---------------------------------------------------------------------------
// レベル通知（§4.3。連射防止のためキュー管理＋デバウンスする）
// ---------------------------------------------------------------------------
const toastQueue = [];
let toastQueueBusy = false;

/**
 * トーストをキューに積む。同時表示は最大1件、待機は最大3件（超過分は破棄）。
 * ★エラー通知など即時性が要る showToast とは別枠（レベルアップ演出用）。
 * @param {string} message
 * @param {'info'|'warn'|'levelup'} [tone]
 * @returns {void}
 */
export function enqueueToast(message, tone = 'info'){
  if (toastQueue.length >= 3) return;                     // 待機3件超過分は破棄
  toastQueue.push({ message, tone });
  drainToastQueue();
}

function drainToastQueue(){
  if (toastQueueBusy || !toastQueue.length) return;
  toastQueueBusy = true;
  const { message, tone } = toastQueue.shift();
  showToast(message, tone);
  setTimeout(() => { toastQueueBusy = false; drainToastQueue(); }, 3200);   // showToastの表示時間と揃える
}

let lastNotifiedLevel = null, levelNotifyTimer = null;

/**
 * displayLevel の変化を検知し、上昇時のみ「LEVEL UP!」をキューへ積む。
 * 600ms のデバウンスで、State の連続変更中に何度も通知しないようにする。
 * ★store.subscribe(maybeNotifyLevelUp) のように状態変化のたびに呼ぶ想定。
 * @returns {void}
 */
export function maybeNotifyLevelUp(){
  clearTimeout(levelNotifyTimer);
  levelNotifyTimer = setTimeout(() => {
    const lv = selectors.currentLevel(state);
    if (lastNotifiedLevel === null){ lastNotifiedLevel = lv; return; }   // 初回は基準を記録するのみ
    const diff = lv - lastNotifiedLevel;
    if (diff > 0) enqueueToast(`LEVEL UP! +${diff} Lv`, 'levelup');
    lastNotifiedLevel = lv;                                 // 下降時は通知せず基準のみ更新
  }, 600);
}

/**
 * 基準レベルを即座に現在値へ同期する。フィードバックボーナス演出など、
 * 別の場所で既に専用のレベルアップ通知を出した直後に呼び、
 * maybeNotifyLevelUp() の遅延判定による重複通知を防ぐ（§3.6 トースト重複防止）。
 * @returns {void}
 */
export function syncNotifiedLevel(){
  clearTimeout(levelNotifyTimer);
  lastNotifiedLevel = selectors.currentLevel(state);
}

// ---------------------------------------------------------------------------
// ゲーミフィケーション演出（ウィザードUI改修・2026-08-08）
// ---------------------------------------------------------------------------

/**
 * ヘッダーのレベル数字・ゲージに「光る」演出クラスを一時的に付与する。
 * クエストを1件解呪するたびに必ず呼ぶ想定（レベルを跨いだかどうかによらない）。
 * @returns {void}
 */
export function triggerLevelUpEffect(){
  const levelEl = document.querySelector('[data-level-display]');
  const gaugeEl = document.querySelector('[data-level-gauge]');
  [levelEl, gaugeEl].forEach(el => {
    if (!el) return;
    el.classList.remove('is-leveling');
    // ★同じクラスを連続で付け直してもアニメーションが再生されないため、
    //   一度リフローを挟んでから再付与する
    void el.offsetWidth;
    el.classList.add('is-leveling');
  });
  setTimeout(() => {
    levelEl?.classList.remove('is-leveling');
    gaugeEl?.classList.remove('is-leveling');
  }, 600);
}

// ★ゲーミフィケーション改修（2026-08-08）：STEP1・STEP2で入力するたびにゲージが動く
//   EXPゲージ演出は廃止した。画面上のレベル・ゲージは「STEP1→2」「STEP2→3」の
//   ボタン押下時（レベル公開演出）のみ動く仕様のため、ヘッダーのゲージは
//   画面3・4のレベル進捗表示専用とし、画面1・2では非表示にする。
let lastLevelGaugePct = null;   // レベル進捗ゲージの巻き戻り（レベルアップ）検知用
let gaugeAnimToken = 0;         // ★短時間に連続でレベルが変化した場合、古い巻き戻りアニメーションの
                                //   完了処理（finish）が後から表示を巻き戻して上書きしてしまわないよう、
                                //   同期のたびにトークンを更新し、自分のトークンが古くなっていたら何もしない

/**
 * ヘッダー統合ゲージの幅を設定する。animated:false の場合は一時的にtransitionを
 * 無効化する（レベルアップ時の「右から左へ縮んで見える」バグ対策で使う）。
 * @param {HTMLElement} fill
 * @param {number} pct
 * @param {boolean} animated
 * @returns {void}
 */
function setGaugeWidth(fill, pct, animated){
  fill.classList.toggle('no-transition', !animated);
  fill.style.setProperty('--progress', `${pct}%`);
}

/**
 * ヘッダーのレベル進捗ゲージ（画面3・4専用）を同期する。画面1・2では非表示にする。
 * ★5,000円単位でレベルが上がり端数が0%へ巻き戻る瞬間、CSSのtransitionがそのまま
 *   適用されると「バーが右から左へ縮む」ように見えてしまう不具合があった
 *   （ユーザーテストフィードバック改修・2026-08-08）。
 *   巻き戻り（新しい値が前回より小さい）を検知した場合のみ「100%まで伸ばす→
 *   transitionを切って0%へ瞬間リセット→再度transitionを有効にして新しい端数まで伸ばす」
 *   の3段階処理を行い、常に左から右へ伸びる動きだけが見えるようにする。
 * @param {object} s state
 * @returns {void}
 */
function syncHeaderGauge(s){
  const screen = Number(s.meta.screen) || 1;
  const gauge = document.querySelector('[data-level-gauge]');
  const fill = gauge?.querySelector('.progress__fill');
  if (!gauge || !fill) return;

  if (screen <= 2){
    if (!gauge.hidden) gauge.hidden = true;   // ★入力中はゲージ自体を隠す（レベルはボタン押下時のみ動く）
    lastLevelGaugePct = null;                 // ★次に画面3以降へ入った時の基準をリセットしておく
    return;
  }
  if (gauge.hidden) gauge.hidden = false;

  const pct = selectors.headerProgressPct(s);
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  if (lastLevelGaugePct !== null && pct < lastLevelGaugePct && !prefersReduced){
    const myToken = ++gaugeAnimToken;
    setGaugeWidth(fill, 100, true);
    let done = false;
    const finish = () => {
      if (done || myToken !== gaugeAnimToken) return;   // ★このアニメーションより後に別の同期が走っていたら何もしない
      done = true;
      fill.removeEventListener('transitionend', finish);
      setGaugeWidth(fill, 0, false);
      void fill.offsetWidth;        // リフローを挟んでから再度アニメーションさせる
      setGaugeWidth(fill, pct, true);
    };
    fill.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 500);        // ★transitionendが発火しない環境（reduced-motion等）向けの保険
  } else {
    gaugeAnimToken++;               // ★進行中の巻き戻りアニメーションがあれば無効化する
    setGaugeWidth(fill, pct, true);
  }
  lastLevelGaugePct = pct;
}

/**
 * レベル公開演出オーバーレイを表示する（画面1→2・画面2→3の遷移前に使う）。
 * @param {{label:string, level:number, sub?:string}} opts
 * @returns {void}
 */
export function showLevelReveal({ label, level, sub = '' }){
  const overlay = document.getElementById('level-reveal');
  if (!overlay) return;
  overlay.querySelector('[data-level-reveal-label]').textContent = label;
  overlay.querySelector('[data-level-reveal-value]').textContent = String(level);
  overlay.querySelector('[data-level-reveal-sub]').textContent = sub;
  overlay.hidden = false;
}

/** レベル公開演出オーバーレイを閉じる。 */
export function hideLevelReveal(){
  const overlay = document.getElementById('level-reveal');
  if (overlay) overlay.hidden = true;
}

// ---------------------------------------------------------------------------
// ボトムシート（§3.5。iOS Safari の背面スクロール貫通・位置飛び対策）
// ---------------------------------------------------------------------------
let savedScrollY = 0;
let releaseFocusTrap = null;

function trapFocus(sheet){
  const focusables = sheet.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  first.focus();

  function onKeydown(e){
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
  sheet.addEventListener('keydown', onKeydown);
  releaseFocusTrap = () => sheet.removeEventListener('keydown', onKeydown);
}

function onEscape(e){
  if (e.key !== 'Escape') return;
  const sheet = document.querySelector('.bottom-sheet:not([hidden])');
  if (sheet) closeSheet(sheet);
}

/**
 * ボトムシートを開く（背面スクロール固定・フォーカストラップ・Escapeクローズ）。
 * @param {HTMLElement} sheet
 * @returns {void}
 */
export function openSheet(sheet){
  savedScrollY = window.scrollY;
  document.body.style.cssText =
    `position:fixed; top:${-savedScrollY}px; left:0; right:0; width:100%; overflow:hidden;`;
  sheet.hidden = false;
  trapFocus(sheet);
  document.addEventListener('keydown', onEscape);
}

/**
 * ボトムシートを閉じる（開く前のスクロール位置へ復帰）。
 * @param {HTMLElement} sheet
 * @returns {void}
 */
export function closeSheet(sheet){
  document.body.style.cssText = '';
  window.scrollTo(0, savedScrollY);   // ★これが無いとページ先頭へ飛ぶ
  sheet.hidden = true;
  releaseFocusTrap?.();
  releaseFocusTrap = null;
  document.removeEventListener('keydown', onEscape);
}

// ---------------------------------------------------------------------------
// コピーボタンの一時ラベル切替（§4.6）
// ---------------------------------------------------------------------------

/**
 * ボタンのラベルを一定時間だけ差し替える（コピー完了表示など）。
 * @param {HTMLButtonElement} btn
 * @param {string} tempLabel
 * @param {number} [ms]
 * @returns {void}
 */
export function flashButton(btn, tempLabel, ms = 2000){
  if (!btn.dataset.originalLabel) btn.dataset.originalLabel = btn.textContent;   // 初回のみ退避
  clearTimeout(Number(btn.dataset.flashTimer));                                  // 既存タイマー破棄
  btn.textContent = tempLabel;
  btn.classList.add('is-copied');
  btn.setAttribute('aria-live', 'polite');
  const id = setTimeout(() => {
    btn.textContent = btn.dataset.originalLabel;
    btn.classList.remove('is-copied');
    delete btn.dataset.flashTimer;
  }, ms);
  btn.dataset.flashTimer = String(id);
}

// ---------------------------------------------------------------------------
// クリップボードコピー（§4.6・非同期。失敗時は execCommand フォールバック）
// ---------------------------------------------------------------------------

/**
 * 旧式のクリップボードコピー（iOS Safari 等、Clipboard API が使えない環境向け）。
 * @param {string} text
 * @returns {boolean} コピーに成功したか
 */
function legacyCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text; ta.readOnly = true; ta.contentEditable = 'true';   // readOnly でキーボード抑止
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;';
  document.body.appendChild(ta);
  const range = document.createRange(); range.selectNodeContents(ta);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try{ ok = document.execCommand('copy'); }catch{ ok = false; }
  document.body.removeChild(ta);
  return ok;
}

/**
 * クリップボードへ文字列をコピーする。Clipboard API を優先し、失敗時のみ
 * execCommand へフォールバックする（非同期・失敗時は false を返し呼び出し側が通知する）。
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text){
  if (navigator.clipboard && window.isSecureContext){
    try{ await navigator.clipboard.writeText(text); return true; }
    catch{ /* 権限拒否等。フォールバックへ */ }
  }
  return legacyCopy(text);
}

// ---------------------------------------------------------------------------
// マイカルテ画像出力（§4.4）
// ★html2canvas は vendor.js 経由（Node-Ready N-1）。CDN URL をここに直書きしない。
// ---------------------------------------------------------------------------

function isIOS(){
  return /iP(hone|od|ad)/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);   // iPadOS 13+ 対策
}

/**
 * Canvas が実質空白（全ピクセルが同一色）でないかを判定する。
 * html2canvas はフォント未ロード等で「例外を投げず真っ白な画像」を返すことがあるため、
 * 無音で失敗させないよう明示的に検査する。
 * @param {HTMLCanvasElement} canvas
 * @returns {boolean}
 */
function hasVisiblePixels(canvas){
  if (!canvas.width || !canvas.height) return false;
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  const [r0, g0, b0, a0] = data;
  for (let i = 4; i < data.length; i += 4){
    if (data[i] !== r0 || data[i+1] !== g0 || data[i+2] !== b0 || data[i+3] !== a0) return true;
  }
  return false;
}

/**
 * マイカルテ要素をキャプチャして Canvas を返す。失敗時は印刷機能へフォールバックし null を返す。
 * @param {HTMLElement} el
 * @returns {Promise<HTMLCanvasElement|null>}
 */
export async function captureCard(el){
  el.classList.add('capture-safe');                     // oklch()等キャプチャ非対応プロパティを無効化
  try{
    // ★CDNへの到達失敗（オフライン・ブロック等）も「キャプチャできない」の一種として
    //   同じフォールバックに合流させるため、動的import自体も try に含める。
    const html2canvas = await loadHtml2Canvas();
    await document.fonts.ready;                          // フォント未ロードによる文字化け防止

    const rect = el.getBoundingClientRect();
    const MAX_AREA = 4 * 1024 * 1024;                     // iOS の Canvas 面積上限に対し保守的に設定
    let scale = 2;
    while (rect.width*scale * rect.height*scale > MAX_AREA && scale > 1) scale -= 0.25;

    const canvas = await html2canvas(el, {
      scale, backgroundColor:'#000000', useCORS:true, logging:false,
      windowWidth: document.documentElement.clientWidth,
      scrollX:0, scrollY:-window.scrollY                // 無いとスクロール量分ずれる
    });
    if (!hasVisiblePixels(canvas)) throw new Error('blank canvas');   // 無音で壊れさせない
    return canvas;
  }catch{
    showToast('画像を作成できませんでした。印刷機能で保存できます', 'warn');
    window.print();
    return null;
  } finally {
    el.classList.remove('capture-safe');
  }
}

/**
 * Canvas を画像として保存する。iOS Safari は `<a download>` を無視するため
 * 共有シート→通常ダウンロード→長押し保存案内の順に段階的フォールバックする。
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<void>}
 */
export async function saveCard(canvas){
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  const file = new File([blob], 'tedori-quest-karte.png', { type:'image/png' });

  if (navigator.canShare?.({ files:[file] })){          // ① 共有シート（iOS/Android）
    try{ await navigator.share({ files:[file], title:'てどりクエスト あなたの称号' }); return; }
    catch(e){ if (e.name === 'AbortError') return; }
  }
  if (!isIOS()){                                        // ② 通常ダウンロード（デスクトップ）
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href:url, download:'tedori-quest-karte.png' }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  showImageModal(canvas.toDataURL('image/png'),          // ③ 長押し保存を案内
    '画像を長押しして「写真に追加」を選んでください');
}

// ---------------------------------------------------------------------------
// 画像モーダル（iOS長押し保存の案内。§4.4③のフォールバック先）
// ---------------------------------------------------------------------------

/**
 * 画像を全画面モーダルで表示する（iOSの長押し保存を案内するため）。
 * @param {string} dataUrl
 * @param {string} message
 * @returns {void}
 */
export function showImageModal(dataUrl, message){
  const modal = document.getElementById('image-modal');
  if (!modal) return;
  const img = modal.querySelector('img');
  const msg = modal.querySelector('.image-modal__message');
  img.src = dataUrl;
  if (msg) msg.textContent = message;
  openSheet(modal);
}

// ---------------------------------------------------------------------------
// PDF家計診断レポート（FP提出用フォーマル書式）
// ★html2pdf.js は vendor.js 経由（Node-Ready N-1）。CDN URLをここに直書きしない。
// ★RPG画面（黒背景・二重枠）をそのままキャプチャする方式は廃止した。pdf-template.html
//   （デザイン原本。プロジェクトルート）のHTML構造・CSSをこのファイルとstyle.cssに移植し、
//   FPがそのまま家計診断に使える白背景・sans-serifのA4レポート（#pdf-report-template）を
//   state から動的に組み立てて出力する。通常のUI（.card等）とは完全に独立した別ドキュメント
//   のため、インタラクティブな入力要素を持たない＝毎回まるごと作り直してもフォーカス等の
//   問題が起きない（CLAUDE.md 制約5はユーザー入力欄の保護が趣旨のため対象外）。
// ---------------------------------------------------------------------------

const REPORT_AREA_LABELS = { tokyo:'東京都', osaka:'大阪府', urban:'地方主要都市', other:'その他地域' };
const REPORT_INSURANCE_TYPE_LABELS = { association:'協会けんぽ', kumiai:'健康保険組合' };

/**
 * ISO日付文字列（YYYY-MM-DD）を「YYYY年M月D日」表記に変換する。
 * @param {string} iso
 * @returns {string}
 */
function formatJaDate(iso){
  const [y, m, d] = String(iso).split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

/**
 * レポートの表題（h1）。左にレポート名、右にアプリ名・出力日を並べる
 * （pdf-template.html の h1 構造をそのまま踏襲）。
 * @returns {HTMLHeadingElement}
 */
function buildReportH1(){
  const h1 = document.createElement('h1');
  const title = document.createElement('span');
  title.textContent = '家計・固定費 診断レポート';
  const appName = document.createElement('span');
  appName.className = 'app-name';
  appName.textContent = `てどりクエスト / 出力日: ${formatJaDate(new Date().toISOString().slice(0, 10))}`;
  h1.append(title, appName);
  return h1;
}

/**
 * レポート内の見出し要素（h2）を組み立てる。
 * @param {string} text
 * @returns {HTMLHeadingElement}
 */
function buildReportH2(text){
  const el = document.createElement('h2');
  el.textContent = text;
  return el;
}

/**
 * 「1. プロフィール・基本情報」テーブル：1行にth/td/th/tdを2組並べる2カラム構成。
 * @param {[string,string,string,string][]} rows
 * @returns {HTMLTableElement}
 */
function buildProfileTable(rows){
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  rows.forEach(([th1, td1, th2, td2]) => {
    const tr = document.createElement('tr');
    [['th', th1], ['td', td1], ['th', th2], ['td', td2]].forEach(([tag, text]) => {
      const cell = document.createElement(tag);
      cell.textContent = text;
      tr.appendChild(cell);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

/**
 * 「2. 公的保障の状況」テーブルの1行を組み立てる（th＋強調数値＋説明文の3カラム）。
 * @param {string} label 項目名
 * @param {string} boldText 強調表示する数値（カンマ区切り済み）
 * @param {string} unitText 数値の後に続く単位表記（例：'/ 月'）
 * @param {string} description 説明文
 * @returns {HTMLTableRowElement}
 */
function buildProtectionRow(label, boldText, unitText, description){
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.textContent = label;
  const amountCell = document.createElement('td');
  amountCell.className = 'num-align';
  amountCell.append('約 ');
  const strong = document.createElement('strong');
  strong.textContent = boldText;
  amountCell.append(strong, ` 円 ${unitText}`);
  const descCell = document.createElement('td');
  descCell.textContent = description;
  tr.append(th, amountCell, descCell);
  return tr;
}

/**
 * 「3. 固定費の現状と改善余地」テーブルを組み立てる（項目／現状／理想／評価の4カラム）。
 * @param {[string,string,string,string][]} rows
 * @returns {HTMLTableElement}
 */
function buildCostTable(rows){
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headTr = document.createElement('tr');
  [['項目', false], ['現状（入力値）', true], ['理想・適正水準', true], ['評価', false]].forEach(([text, center]) => {
    const th = document.createElement('th');
    th.textContent = text;
    th.style.width = '25%';
    if (center) th.style.textAlign = 'center';
    headTr.appendChild(th);
  });
  thead.appendChild(headTr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach(([label, current, ideal, verdict]) => {
    const tr = document.createElement('tr');
    const tdLabel = document.createElement('td');
    tdLabel.textContent = label;
    const tdCurrent = document.createElement('td');
    tdCurrent.className = 'num-align';
    tdCurrent.textContent = current;
    const tdIdeal = document.createElement('td');
    tdIdeal.className = 'num-align';
    tdIdeal.textContent = ideal;
    const tdVerdict = document.createElement('td');
    tdVerdict.textContent = verdict;
    tr.append(tdLabel, tdCurrent, tdIdeal, tdVerdict);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

/**
 * 「4. アクションプラン」の箇条書きリストを組み立てる。
 * @param {ReturnType<typeof selectors.buildQuestList>} quests
 * @returns {HTMLUListElement}
 */
function buildActionList(quests){
  const ul = document.createElement('ul');
  ul.className = 'action-list';
  quests.forEach(q => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = q.mainTitle;
    li.appendChild(strong);
    li.append(q.detail ?? q.subTitle ?? '');
    ul.appendChild(li);
  });
  return ul;
}

/**
 * 合計節約可能額のハイライトボックスを組み立てる。
 * @param {string} monthlyText 月額（カンマ区切り済み）
 * @param {string} annualText 年額（カンマ区切り済み）
 * @returns {HTMLDivElement}
 */
function buildHighlightBox(monthlyText, annualText){
  const box = document.createElement('div');
  box.className = 'highlight-box';
  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = 'すべてのアクションを実行した場合の合計節約可能額';
  const amount = document.createElement('div');
  amount.className = 'amount';
  amount.textContent = `¥ ${monthlyText} / 月`;
  const sub = document.createElement('div');
  sub.className = 'sub';
  sub.textContent = `（年間で ¥ ${annualText} の手取りアップ効果）`;
  box.append(title, amount, sub);
  return box;
}

/** 免責事項ブロックを組み立てる（pdf-template.html の文言をそのまま使用する）。 */
function buildDisclaimer(){
  const div = document.createElement('div');
  div.className = 'disclaimer';
  div.append(
    '※本レポートは「てどりクエスト」の入力データおよび'
      + `${formatJaDate(C.SYSTEM_BASE_DATE)}時点の制度に基づき自動算出された試算値です。`
      + '実際の給付額・控除額とは異なる可能性があります。',
    document.createElement('br'),
    '※保険の見直しや解約を行う際は、無保険期間が生じないよう、また健康状態等による'
      + '再加入リスクを十分にご確認の上、ご自身の判断で実施してください。'
  );
  return div;
}

/**
 * PDF家計診断レポート（#pdf-report-template）の中身を state から組み立て直す。
 * @param {object} s state
 * @returns {void}
 */
function populatePdfReportTemplate(s){
  const root = document.getElementById('pdf-report-template');
  if (!root) return;
  root.textContent = '';   // 前回分を消してから作り直す（インタラクティブ要素が無いため丸ごと再構築で問題ない）

  const view = buildViewModel(s);
  const p = s.userProfile ?? {};
  const fc = s.fixedCosts ?? {};

  root.appendChild(buildReportH1());

  root.appendChild(buildReportH2('1. プロフィール・基本情報'));
  const insuranceLabel = (REPORT_INSURANCE_TYPE_LABELS[p.insuranceType] ?? '未選択')
    + (p.isUnderOneYear ? '（加入12ヶ月未満）' : '');
  root.appendChild(buildProfileTable([
    ['年収（額面）', `${YEN(p.annualSalary)} 円`, 'お住まいのエリア', REPORT_AREA_LABELS[p.area] ?? '未選択'],
    ['健康保険の種類', insuranceLabel, '現在の称号', `Lv.${view.displayLevel} / ${view.rankTitle}`]
  ]));

  root.appendChild(buildReportH2('2. 公的保障の状況（備わっているバリア）'));
  const protectionTable = document.createElement('table');
  const protectionBody = document.createElement('tbody');
  protectionBody.appendChild(buildProtectionRow('高額療養費 自己負担上限', view.selfPayCap, '/ 月',
    '医療費が高額になった場合でも、この金額以上は免除されます。'));
  protectionBody.appendChild(buildProtectionRow('傷病手当金', view.injuryDaily, '/ 日',
    '病気やケガで働けない期間、通算1年6ヶ月まで支給されます。'));
  protectionTable.appendChild(protectionBody);
  root.appendChild(protectionTable);

  root.appendChild(buildReportH2('3. 固定費の現状と改善余地'));
  const costCategories = ['smartphone', 'internet', 'medicalInsurance', 'fireInsurance', 'subscriptions', 'nhk'];
  if (fc.hasCar) costCategories.push('carInsurance', 'parking');
  const costRows = costCategories.map(category => {
    const target = C.FIXED_COST_TARGETS[category];
    const value = getCostCategoryValue(s, category);
    const hasIdeal = target.ideal !== null && target.ideal !== undefined;
    const idealText = hasIdeal ? `${YEN(target.ideal)} 円以下` : '—';
    const verdict = !hasIdeal ? '— 参考情報' : (value > target.ideal ? '⚠️ 見直し余地あり' : '◎ 適正範囲内');
    return [target.label, `${YEN(value)} 円`, idealText, verdict];
  });
  root.appendChild(buildCostTable(costRows));

  root.appendChild(buildReportH2('4. アクションプラン（解呪対象の魔道障壁）'));
  const quests = selectors.buildQuestList(s);
  if (quests.length){
    const lead = document.createElement('p');
    lead.textContent = '以下の項目を見直すことで、毎月の手取り（自由に使えるお金）を増やすことができます。';
    root.appendChild(lead);
    root.appendChild(buildActionList(quests));
  } else {
    const none = document.createElement('p');
    none.textContent = '現時点で見直しの余地がある固定費は見つかりませんでした。すでに最適化された家計です！';
    root.appendChild(none);
  }

  const questTotal = quests.reduce((sum, q) => sum + q.monthlySaving, 0);
  root.appendChild(buildHighlightBox(YEN(questTotal), YEN(questTotal * 12)));

  root.appendChild(buildDisclaimer());
}

/**
 * PDF家計診断レポートを出力する。
 * ★致命的バグ修正：以前は #pdf-report-template を position:fixed/absolute; left:-9999px で
 *   画面外に飛ばしたまま display:block にしてhtml2canvasへ渡していたが、実機検証で
 *   「html2canvasは負の座標に配置された要素の高さを正しく計測できず、高さ0のcanvas
 *   （＝空白または壊れたPDF。RPG画面がそのまま写り込んで見えることもある）になる」
 *   不具合を確認した。そのため画面外オフセットには一切頼らず、
 *   ①レポート以外の <body> 直下の要素（RPGのヘッダー・main・ボトムナビ等）をすべて
 *     一時的に display:none にし、②レポートだけを通常のドキュメントフロー内に表示する
 *   方式に変更した。ヘッダー等の非表示とレポートの表示は同じ同期処理内で行うため、
 *   ブラウザが「何も表示されていない」フレームを描画することはない（一瞬でRPG画面から
 *   レポート表示へ切り替わる）。完了後（例外時も）必ず元の状態へ戻す。
 * @returns {Promise<void>}
 */
export async function exportFullReportPdf(){
  const target = document.getElementById('pdf-report-template');
  if (!target) return;

  populatePdfReportTemplate(state);

  const siblings = [...document.body.children].filter(el => el !== target);
  const originalDisplay = siblings.map(el => el.style.display);
  siblings.forEach(el => { el.style.display = 'none'; });
  target.style.display = 'block';

  try{
    const html2pdf = await loadHtml2Pdf();
    await document.fonts.ready;   // フォント未ロードによる文字化け防止（captureCardと同様の理由）

    await html2pdf().set({
      margin: 10,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }).from(target).save('てどりクエスト-家計診断レポート.pdf');
  } finally {
    target.style.display = 'none';
    siblings.forEach((el, i) => { el.style.display = originalDisplay[i]; });
  }
}
