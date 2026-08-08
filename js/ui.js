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
  li.dataset.questId = q.id;

  const head = document.createElement('div');
  head.className = 'quest-item__head';
  const title = document.createElement('h3');
  title.className = 'quest-item__title';
  title.textContent = q.mainTitle;
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
 * クエスト一覧を再描画する。クエストの構成（id・節約可能額）が変わっていない場合は
 * チェック状態の同期のみ行い、DOMの作り直しはしない。
 * @param {object} s state
 * @returns {void}
 */
function renderQuestList(s){
  const container = document.querySelector('[data-quest-list]');
  const legendary  = document.querySelector('[data-legendary-hero]');
  if (!container) return;

  const quests = selectors.buildQuestList(s);
  const signature = JSON.stringify(quests.map(q => [q.id, q.monthlySaving]));
  if (signature === lastQuestSignature){
    syncQuestCheckboxes(s);
  } else {
    lastQuestSignature = signature;
    container.querySelectorAll('.quest-item').forEach(el => el.remove());
    quests.forEach(q => container.appendChild(createQuestItem(q, s)));
  }

  if (legendary){
    const showLegendary = quests.length === 0;
    if (legendary.hidden !== !showLegendary) legendary.hidden = !showLegendary;
    if (showLegendary) renderLegendaryCard(legendary);
  }
}

// ---------------------------------------------------------------------------
// その他のサブスク（自由入力）。ゲーミフィケーション改修（2026-08-08）で凍結解除に伴い再実装。
//   ★行の追加・削除でのみDOMを作り直し、通常の入力中はvalueの差分同期のみ行う
//     （フォーカス中・IME変換中の入力欄には書き戻さない＝CLAUDE.md 制約5）。
// ---------------------------------------------------------------------------

/**
 * その他サブスク1行分のDOMを組み立てる。
 * @param {{id:string, label:string, monthly:number|null}} row
 * @returns {HTMLDivElement}
 */
function createOtherSubRow(row){
  const el = document.createElement('div');
  el.className = 'other-sub-row';
  el.dataset.otherSubId = row.id;

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'input input--label';
  labelInput.maxLength = C.OTHER_SUBSCRIPTION.labelMaxLength;
  labelInput.placeholder = C.OTHER_SUBSCRIPTION.placeholders[0] ?? 'ジム';
  labelInput.autocomplete = 'off';
  labelInput.enterKeyHint = 'done';
  labelInput.setAttribute('aria-label', 'サービス名');
  labelInput.dataset.otherSubField = 'label';
  labelInput.dataset.composing = '0';
  labelInput.value = row.label ?? '';

  const monthlyInput = document.createElement('input');
  monthlyInput.type = 'text';
  monthlyInput.inputMode = 'numeric';
  monthlyInput.pattern = '[0-9,]*';
  monthlyInput.className = 'input';
  monthlyInput.placeholder = '8,000';
  monthlyInput.autocomplete = 'off';
  monthlyInput.enterKeyHint = 'done';
  monthlyInput.setAttribute('aria-label', '月額（円）');
  monthlyInput.dataset.otherSubField = 'monthly';
  monthlyInput.dataset.composing = '0';
  monthlyInput.value = formatNumber(row.monthly);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-icon';
  removeBtn.dataset.action = 'removeOtherSubscription';
  removeBtn.setAttribute('aria-label', 'このサブスクを削除');
  removeBtn.textContent = '✕';

  el.append(labelInput, monthlyInput, removeBtn);
  return el;
}

let lastOtherSubIds = null;

/** その他サブスクの再描画キャッシュを破棄する（全リセット・呪文復元直後などに呼ぶ）。 */
export function resetOtherSubscriptionsCache(){ lastOtherSubIds = null; }

/**
 * その他サブスク（自由入力）の行一覧を再描画する。行の追加・削除があった時だけDOMを作り直し、
 * それ以外は値の同期のみ行う。上限到達時は追加ボタンを非活性にする。
 * @param {object} s state
 * @returns {void}
 */
function renderOtherSubscriptions(s){
  const container = document.querySelector('[data-other-sub-list]');
  if (!container) return;

  const rows = s.selections.otherSubscriptions ?? [];
  const idsKey = rows.map(r => r.id).join(',');
  if (idsKey !== lastOtherSubIds){
    lastOtherSubIds = idsKey;
    container.querySelectorAll('.other-sub-row').forEach(el => el.remove());
    rows.forEach(r => container.appendChild(createOtherSubRow(r)));
  }

  rows.forEach(r => {
    const rowEl = container.querySelector(`[data-other-sub-id="${r.id}"]`);
    if (!rowEl) return;
    const labelEl = rowEl.querySelector('[data-other-sub-field="label"]');
    const monthlyEl = rowEl.querySelector('[data-other-sub-field="monthly"]');
    if (labelEl && labelEl !== document.activeElement && labelEl.dataset.composing !== '1'){
      const next = r.label ?? '';
      if (labelEl.value !== next) labelEl.value = next;
    }
    if (monthlyEl && monthlyEl !== document.activeElement){
      const next = formatNumber(r.monthly);
      if (monthlyEl.value !== next) monthlyEl.value = next;
    }
  });

  const addBtn = document.querySelector('[data-action="addOtherSubscription"]');
  if (addBtn){
    const atMax = rows.length >= C.OTHER_SUBSCRIPTION.maxRows;
    if (addBtn.disabled !== atMax) addBtn.disabled = atMax;
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
    renderOtherSubscriptions(state);

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

    // ★サブスクのラジオボタンは data-model を持たないため、上のループでは同期されない。
    //   選択直後は見た目上正しく見えるが、他の入力による再描画やページ再読込（永続化からの
    //   復元）のたびに「契約なし」（HTML静的既定値）へ視覚上戻ってしまうバグがあった。
    //   選択状態は state.selections.subscriptionPlanIds を唯一の正とし、
    //   再描画のたびにラジオの checked をそこから引き直す。
    syncSubscriptionRadios(state);
    syncSubscriptionBadges(state);
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

function syncSubscriptionRadios(s){
  const selected = new Set(s.selections.subscriptionPlanIds ?? []);
  const groups = new Set();
  document.querySelectorAll('[data-plan-group]').forEach(el => groups.add(el.dataset.planGroup));

  groups.forEach(group => {
    const idsInGroup = getPlanIdsForGroup(group);
    const selectedId = [...selected].find(id => idsInGroup.has(id)) ?? '';   // 無ければ「契約なし」
    document.querySelectorAll(`[data-plan-group="${group}"]`).forEach(radio => {
      const shouldCheck = radio.value === selectedId;
      if (radio.checked !== shouldCheck) radio.checked = shouldCheck;
    });
  });
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
// PDF出力（§4.4追加・2026-08-08）
// ★html2pdf.js は vendor.js 経由（Node-Ready N-1）。CDN URLをここに直書きしない。
// ---------------------------------------------------------------------------

/**
 * STEP1・STEP2・クエスト一覧・結果画面のすべての内容を1つのPDFとして出力する。
 * ★通常は state.meta.screen に応じて1画面ずつしか表示しない（[hidden]属性）ため、
 *   PDF生成中だけ一時的にすべての .screen の hidden を解除して縦に並べてキャプチャし、
 *   完了後に元のhidden状態へ戻す（restoreで必ず戻す。例外時もfinallyで保証する）。
 *   sticky/fixedのヘッダー・ボトムナビや画面遷移アニメーションも、キャプチャ中だけ
 *   body.pdf-export-mode（style.css）で無効化する。
 * @returns {Promise<void>}
 */
export async function exportFullReportPdf(){
  const target = document.querySelector('main');
  if (!target) return;

  const screens = [...document.querySelectorAll('.screen[data-screen]')];
  const originalHidden = screens.map(el => el.hidden);
  document.body.classList.add('pdf-export-mode');
  screens.forEach(el => { el.hidden = false; });

  try{
    const html2pdf = await loadHtml2Pdf();
    await document.fonts.ready;   // フォント未ロードによる文字化け防止（captureCardと同様の理由）

    await html2pdf().set({
      margin: 10,
      filename: 'tedori-quest-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2, backgroundColor: '#000000', useCORS: true, logging: false,
        windowWidth: document.documentElement.clientWidth
      },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    }).from(target).save();
  } finally {
    document.body.classList.remove('pdf-export-mode');
    screens.forEach((el, i) => { el.hidden = originalHidden[i]; });
  }
}
