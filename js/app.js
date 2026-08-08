// app.js — イベント結線（§6.7）。DOM操作は ui.js に委譲し、ここではイベントと
// ACTIONS の対応付けのみを担う。
import { state, subscribe, setPersistErrorHandler, parseYen,
         encodeSpell, restoreFromSpell, INITIAL_STATE } from './store.js';
import { scheduleRender, showToast, enqueueToast, syncNotifiedLevel, maybeNotifyLevelUp,
         openSheet, closeSheet, flashButton,
         getByPath, setByPath, formatNumber, copyToClipboard,
         captureCard, saveCard, resetQuestListCache, resetExQuestUnlockState, populateAnnualSalarySelect,
         populateSubscriptionAccordion, populateRealChargeAccordion,
         triggerLevelUpEffect, showLevelReveal, hideLevelReveal, exportFullReportPdf } from './ui.js';
import { selectors } from './selectors.js';
import * as calc from './calc.js';
import * as C from './config.js';
import { sendFeedback } from './feedback.js';

let isCapturingKarte = false;      // ★saveKarte の重畳連打防止（第一防波堤はボタンのdisabled）
let isSubmittingFeedback = false;  // ★submitFeedback の重畳連打防止（feedback.js自身のisSubmittingに加えた第二防波堤）
let isExportingPdf = false;        // ★exportPdf の重畳連打防止（第一防波堤はボタンのdisabled）
let pendingScreenAfterReveal = null;   // ★レベル公開演出（dismissLevelReveal）後に遷移する画面番号

/**
 * ウィザードの画面を切り替える（ウィザードUI改修・2026-08-08）。
 * ★ナビゲーションバグ修正（2026-08-08）：state.meta.screen（今表示中の画面）とは別に
 *   state.meta.maxScreen（これまでに到達した最大の画面）を単調増加でのみ更新する。
 *   これにより、一度結果画面まで進んだ後に任意のタブで前の画面へ戻っても、
 *   ボトムナビの他タブが再びロックされず自由に行き来できる。
 * @param {1|2|3|4} n
 * @returns {void}
 */
function goToScreen(n){
  state.meta.screen = n;
  state.meta.maxScreen = Math.max(Number(state.meta.maxScreen) || 1, n);
  // ★致命的バグ修正（画面が一番下から始まるバグ）：ここで即座にscrollTo(top:0)を呼ぶと、
  //   まだ旧画面が表示されたまま（＝旧画面の高さ基準）でスクロールが始まってしまう。
  //   直後のrequestAnimationFrameでrender()が画面のhidden切替（DOM差し替え）を行うと、
  //   新しい画面の方が短い場合にブラウザがscrollYを新しい最大値へクランプし、
  //   結果的に新画面の下端に着地して見えることがあった。
  //   state.meta.screen の代入（→subscribe(scheduleRender)）で render() 用の
  //   requestAnimationFrame が既に登録されているため、ここでもう1つ登録すれば
  //   同じフレーム内で render() の後に実行され、DOM差し替え後の正しい高さを基準に
  //   スクロールできる。
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}

/**
 * Tips用backdropの表示・非表示を、いずれかのTipsが開いているかどうかに同期する。
 * 各 details.tip の 'toggle' イベント（開閉が確定した後に発火する）に紐づけて呼ぶ。
 * @returns {void}
 */
function syncTipBackdrop(){
  const backdrop = document.querySelector('[data-tip-backdrop]');
  if (!backdrop) return;
  const anyOpen = document.querySelectorAll('details.tip[open]').length > 0;
  if (backdrop.hidden === anyOpen) backdrop.hidden = !anyOpen;
}

// §6.10 エラー文言（確定版）。in_flight・honeypot は表示しない。
const FEEDBACK_MESSAGES = {
  rate_limited: ['本日の送信上限に達しました。また明日お聞かせください', 'warn'],
  throttled:    ['混み合っています。しばらくしてからお試しください', 'warn'],
  api_error:    ['送信できませんでした。時間をおいてお試しください', 'warn'],
  timeout:      ['通信がタイムアウトしました。接続状態をご確認ください', 'warn'],
  offline:      ['送信に失敗しました。接続状態をご確認ください', 'warn'],
  network:      ['送信に失敗しました。接続状態をご確認ください', 'warn']
};

// ---------------------------------------------------------------------------
// イベント委譲（§6.7）。個別 addEventListener を撒かない（動的追加時の付け忘れ防止）。
// ---------------------------------------------------------------------------
function bindEvents(){
  // ★Tips（？アイコン）はすべて静的マークアップのため、起動時に一度だけ 'toggle' を
  //   個別配線する（'toggle' イベントはバブリングしないため委譲できない）。
  document.querySelectorAll('details.tip').forEach(tip => {
    tip.addEventListener('toggle', syncTipBackdrop);
  });

  document.addEventListener('input', e => {
    const otherField = e.target.closest('[data-other-sub-field]');
    if (otherField){ onOtherSubscriptionFieldInput(otherField); return; }

    const el = e.target.closest('[data-model]');
    if (!el || el.dataset.composing === '1') return;
    if (el.type === 'checkbox' || el.tagName === 'SELECT') return;   // これらは change で処理する
    setByPath(state, el.dataset.model, parseYen(el.value));
  });

  // IME（日本語入力の中間状態で発火するのを抑止）
  document.addEventListener('compositionstart', e => { if (e.target.dataset) e.target.dataset.composing = '1'; });
  document.addEventListener('compositionend', e => {
    if (!e.target.dataset) return;
    e.target.dataset.composing = '0';
    e.target.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // blur時にのみカンマ整形（入力中に整形するとキャレットが飛ぶ）
  document.addEventListener('focusout', e => {
    const el = e.target.closest('[data-model]');
    if (el && el.type !== 'checkbox' && el.tagName !== 'SELECT'){
      el.value = formatNumber(getByPath(state, el.dataset.model));
    }
    const otherMonthly = e.target.closest('[data-other-sub-field="monthly"]');
    if (otherMonthly){
      const id = otherMonthly.closest('[data-other-sub-id]')?.dataset.otherSubId;
      const row = state.selections.otherSubscriptions.find(r => r.id === id);
      otherMonthly.value = formatNumber(row?.monthly);
    }
    // ★隠しボーナスEXP③：自由記述欄に数文字以上入力してフォーカスが外れた時（生涯1回のみ抽選。
    //   レベルへの反映は「送信する」ボタン押下時＝applyPendingFeedbackBonus）
    if (e.target.id === 'in-feedback-comment' && e.target.value.trim().length >= 2){
      queueHiddenFeedbackBonus('feedbackCommentBonusGranted', 'feedbackCommentBonusAmount', 5, 10);
    }
  }, true);

  // ★フォーカス時に全選択：既に値が入っている欄（アシスト補完値等）を
  //   ワンタップ（1クリック）で上書きできるようにする（改善要望対応）。
  //   focus はバブリングしないため capture フェーズで拾う。
  document.addEventListener('focus', e => {
    const el = e.target.closest('[data-model]');
    if (el && el.type !== 'checkbox' && el.tagName !== 'SELECT') el.select();
    const otherField = e.target.closest('[data-other-sub-field]');
    if (otherField) otherField.select();
  }, true);

  document.addEventListener('click', e => {
    // ★Tips（？アイコン）はバックドロップ方式で確実に閉じる（ユーザーテストフィードバック改修・
    //   2026-08-08）。以前は「クリックしたTips自身だけを対象外にする」方式だったが、
    //   CSSの:hover/:focus-withinが[open]属性と独立して表示を維持してしまい、
    //   「閉じたはずが裏に隠れているだけ」に見えるバグがあった。
    //   全画面の透明backdropを開いている間だけ重ね、backdropへのクリック（＝tip外側への
    //   タップ）でdetailsの[open]属性を外し、要約要素からフォーカスも外す。
    //   ★backdropの表示/非表示自体は、各tipのnative 'toggle' イベント（syncTipBackdrop）に
    //     一本化する。'click' はバブリング中に発火するがネイティブのdetails開閉は
    //     ブラウザによってその後に適用されることがあり、ここで[open]を読んでも
    //     タイミングが信頼できないため（実機検証で発覚）。
    const backdrop = document.querySelector('[data-tip-backdrop]');
    const insideTip = e.target.closest('details.tip');
    const clickedBackdrop = e.target === backdrop;
    if (clickedBackdrop || !insideTip){
      document.querySelectorAll('details.tip[open]').forEach(tip => {
        tip.open = false;
        tip.querySelector('summary')?.blur();
      });
    }
    if (clickedBackdrop) return;   // ★backdrop自身のクリックはTipsを閉じるだけで完結させる

    const btn = e.target.closest('[data-action]');
    if (btn) ACTIONS[btn.dataset.action]?.(btn, e);

    // ★隠しボーナスEXP①：「使ってみてどうでしたか？」タップ時（生涯1回のみ抽選。
    //   レベルへの反映は「送信する」ボタン押下時＝applyPendingFeedbackBonus）
    const emo = e.target.closest('[data-feedback-emotion]');
    if (emo){
      selectSingle(emo, '[data-feedback-emotion]');
      queueHiddenFeedbackBonus('feedbackEmotionBonusGranted', 'feedbackEmotionBonusAmount', 1, 3);
    }

    // ★隠しボーナスEXP②：「気になった点はありますか」タップ時（生涯1回のみ抽選。
    //   レベルへの反映は「送信する」ボタン押下時＝applyPendingFeedbackBonus）
    const chip = e.target.closest('[data-feedback-category]');
    if (chip){
      chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') !== 'true');
      queueHiddenFeedbackBonus('feedbackCategoryBonusGranted', 'feedbackCategoryBonusAmount', 1, 3);
    }
  });

  document.addEventListener('change', e => {
    const questCb = e.target.closest('[data-quest-toggle]');
    if (questCb){ onQuestToggle(questCb); return; }

    const otherCardCb = e.target.closest('[data-card-other-toggle]');
    if (otherCardCb){ onCardOtherToggle(otherCardCb); return; }

    const subServiceCb = e.target.closest('[data-sub-service-toggle]');
    if (subServiceCb){ onSubServiceToggle(subServiceCb); return; }

    const realChargeCb = e.target.closest('[data-real-charge-toggle]');
    if (realChargeCb){ onRealChargeToggle(realChargeCb); return; }

    const planRadio = e.target.closest('[data-plan-group]');
    if (planRadio){ onPlanGroupChange(planRadio); return; }

    const el = e.target.closest('[data-model]');
    if (!el) return;
    if (el.type === 'checkbox') setByPath(state, el.dataset.model, el.checked);
    else if (el.tagName === 'SELECT'){
      // ★年収セレクトは数値として扱う（他のセレクトは文字列の列挙値のためそのまま）
      const value = el.dataset.model === 'userProfile.annualSalary' ? parseYen(el.value) : el.value;
      setByPath(state, el.dataset.model, value);
      if (el.dataset.model === 'creditCards.main' || el.dataset.model === 'creditCards.sub'){
        onCreditCardSelectChange(el.dataset.model);
      }
    }
  });
}

/**
 * クエスト解呪チェックボックスの変更を反映し、レベルを再計算する（Phase2〜3）。
 * ★初期レベルは画面2「クエストを生成する」ボタン押下時点（ACTIONS.generateQuests）で
 *   既に確定済みのため、ここでは確定処理を行わない（ウィザードUI改修・2026-08-08）。
 * @param {HTMLInputElement} cb
 * @returns {void}
 */
function onQuestToggle(cb){
  const id = cb.dataset.questToggle;
  const saving = Number(cb.dataset.questSaving) || 0;
  if (cb.checked) state.quests.completed[id] = saving;
  else delete state.quests.completed[id];
  handleQuestLevelUp();
}

/**
 * レベルを再計算し、上昇時のみ演出トーストを出す（確定的な計算・抽選要素なし）。
 * ★ゲーミフィケーション改修v2（2026-08-08）：毎回、解呪済みクエストの「件数」から
 *   算出した疑似EXP（selectors.questExpTotal）で再計算する（累積方式）。実際の
 *   節約額（円）はマイカルテ・Xシェア側でのみ使い続けるため、ここでは使わない。
 * ★致命的バグ修正（2026-08-08）：チェックを外してレベルが下がった（または変化しない）
 *   場合にも「レベルアップ！」のトーストや光る演出が出てしまうバグがあった。
 *   レベルが実際に上昇した場合（after > before）のみ演出を発生させる。
 * @returns {void}
 */
function handleQuestLevelUp(){
  const before = selectors.currentLevel(state);
  const expTotal = selectors.questExpTotal(state);
  const { finalLevel } = calc.calcCurrentLevel(state.meta.initialLevel ?? 0, expTotal);
  state.meta.currentLevel = finalLevel;
  const after = selectors.currentLevel(state);
  syncNotifiedLevel();   // ★maybeNotifyLevelUp の遅延判定による重複通知を防ぐ
  if (after > before){
    enqueueToast(`現状 Lv.${before} ➔ Lv.${after} にUP！`, 'levelup');
    triggerLevelUpEffect();
  }
}

/**
 * その他保有カードのチェック状態を state.creditCards.others に反映する。
 * @param {HTMLInputElement} cb
 * @returns {void}
 */
function onCardOtherToggle(cb){
  const id = cb.dataset.cardOtherToggle;
  const set = new Set(state.creditCards.others);
  if (cb.checked) set.add(id); else set.delete(id);
  state.creditCards.others = [...set];
}

/**
 * メイン／サブカードの選択が重複した場合に整理する（Phase1.5：重複選択の除外）。
 * @param {'creditCards.main'|'creditCards.sub'} changedPath
 * @returns {void}
 */
function onCreditCardSelectChange(changedPath){
  const { main, sub, others } = state.creditCards;
  if (changedPath === 'creditCards.main' && main && sub === main){
    state.creditCards.sub = null;
  }
  if (main && others.includes(main)) state.creditCards.others = others.filter(id => id !== main);
  if (sub && state.creditCards.others.includes(sub)){
    state.creditCards.others = state.creditCards.others.filter(id => id !== sub);
  }
}

/**
 * その他サブスク（自由入力）の1フィールド分の入力を state.selections.otherSubscriptions に反映する。
 * ★ゲーミフィケーション改修（2026-08-08）：凍結解除に伴い再実装。
 * @param {HTMLInputElement} el data-other-sub-field を持つ入力要素
 * @returns {void}
 */
function onOtherSubscriptionFieldInput(el){
  if (el.dataset.composing === '1') return;
  const id = el.closest('[data-other-sub-id]')?.dataset.otherSubId;
  if (!id) return;
  const field = el.dataset.otherSubField;   // 'label' | 'monthly'
  state.selections.otherSubscriptions = state.selections.otherSubscriptions.map(r => {
    if (r.id !== id) return r;
    if (field === 'label') return { ...r, label: el.value.slice(0, C.OTHER_SUBSCRIPTION.labelMaxLength) };
    if (field === 'monthly') return { ...r, monthly: parseYen(el.value) };
    return r;
  });
}

/**
 * サービスのプラン選択（<select data-plan-group>）の変化を selections.subscriptionPlanIds に
 * 反映する（§3.9）。同一サービスの他プランを除去してから、選択されたものだけ入れる。
 * @param {HTMLSelectElement} el
 * @returns {void}
 */
function onPlanGroupChange(el){
  const group = el.dataset.planGroup;
  const all = C.SUBSCRIPTION_PLANS.flatMap(g => g.services)
                .find(s => s.id === group)?.plans.map(p => p.id) ?? [];
  const next = state.selections.subscriptionPlanIds.filter(id => !all.includes(id));
  if (el.value) next.push(el.value);
  state.selections.subscriptionPlanIds = next;
  // fixedCosts.subscriptions は selectors 側で sumSubscriptions() により算出する（直接書き込まない）
}

/**
 * デジタルサブスクのサービス単位チェックボックス（[ ]/[*]）の変化を
 * selections.subscriptionPlanIds に反映する（UI刷新・ゲーミフィケーション改修v3）。
 * チェックONで初期状態のオーディエンス（C.DEFAULT_PLAN_AUDIENCE）の先頭プランを自動選択し、
 * チェックOFFでそのサービスの選択を解除する。個別プランの変更は onPlanGroupChange が担う。
 * @param {HTMLInputElement} cb
 * @returns {void}
 */
function onSubServiceToggle(cb){
  const group = cb.dataset.subServiceToggle;
  const service = C.SUBSCRIPTION_PLANS.flatMap(g => g.services).find(s => s.id === group);
  if (!service) return;
  const allIds = service.plans.map(p => p.id);
  const next = state.selections.subscriptionPlanIds.filter(id => !allIds.includes(id));
  if (cb.checked){
    const first = service.plans.find(p => p.audience === C.DEFAULT_PLAN_AUDIENCE) ?? service.plans[0];
    if (first) next.push(first.id);
  }
  state.selections.subscriptionPlanIds = next;
}

/**
 * リアル課金（手動入力）のプリセット／「その他」チェックボックスの変化を
 * selections.otherSubscriptions に反映する（UI刷新・ゲーミフィケーション改修v3）。
 * チェックONで行を追加（プリセットは固定ラベル、customは空ラベルでユーザー入力を待つ）、
 * チェックOFFで該当行を削除する。金額・ラベルの入力自体は onOtherSubscriptionFieldInput が担う。
 * @param {HTMLInputElement} cb
 * @returns {void}
 */
function onRealChargeToggle(cb){
  const id = cb.dataset.realChargeToggle;
  const preset = C.OTHER_SUBSCRIPTION_PRESETS.find(p => p.id === id);
  const rows = state.selections.otherSubscriptions.filter(r => r.id !== id);
  if (cb.checked) rows.push({ id, label: preset?.label ?? '', monthly: null });
  state.selections.otherSubscriptions = rows;
}

/** グループ内の他要素の aria-pressed を外し、対象だけ true にする（感情ボタン用）。 */
function selectSingle(target, selector){
  document.querySelectorAll(selector).forEach(el => el.setAttribute('aria-pressed', String(el === target)));
}

// ---------------------------------------------------------------------------
// フィードバック隠しボーナスEXP（ゲーミフィケーション改修・2026-08-08）
//   ★感情選択・気になった点選択・自由記述入力の各操作に連動する隠し要素。各トリガーは
//     生涯1回のみ抽選される。★致命的バグ修正（2026-08-08）：以前はタップ・入力の瞬間に
//     即座にレベルへ反映していたが、「送信する」ボタンを押すまではレベルを変動させず、
//     送信ボタン押下時に合計を一括反映する方式に変更した（queueHiddenFeedbackBonus／
//     applyPendingFeedbackBonus）。抽選結果（加算量）はフィードバックシートを閉じても
//     消えないよう state.meta に保持し、送信時にまとめて適用してから0に戻す。
//   ★既存の「送信完了ボーナス」（feedbackBonusGranted・+1Lv固定・サーバー確認必須）とは別枠。
// ---------------------------------------------------------------------------

/**
 * フィードバック操作に連動した隠しボーナスEXPを抽選し、加算量をキューに積む（即座には反映しない）。
 * 実際にレベルへ反映するのは applyPendingFeedbackBonus()（送信ボタン押下時）。
 * @param {'feedbackEmotionBonusGranted'|'feedbackCategoryBonusGranted'|'feedbackCommentBonusGranted'} flagKey
 * @param {'feedbackEmotionBonusAmount'|'feedbackCategoryBonusAmount'|'feedbackCommentBonusAmount'} amountKey
 * @param {number} minDelta 加算量の下限（両端含む）
 * @param {number} maxDelta 加算量の上限（両端含む）
 * @returns {void}
 */
function queueHiddenFeedbackBonus(flagKey, amountKey, minDelta, maxDelta){
  if (state.meta[flagKey]) return;                     // ★同じトリガーの抽選は生涯1回のみ
  state.meta[flagKey] = true;
  state.meta[amountKey] = minDelta + Math.floor(Math.random() * (maxDelta - minDelta + 1));
}

/**
 * キューに積まれたフィードバック隠しボーナスEXPの合計を一括でレベルへ反映する。
 * 「送信する」ボタン押下時に呼ぶ（通信の成否によらず、ボタンを押した時点で反映する）。
 * 反映後はキューを0に戻す（*Granted の抽選済みフラグは生涯1回のまま維持する）。
 * @returns {void}
 */
function applyPendingFeedbackBonus(){
  const total = (state.meta.feedbackEmotionBonusAmount || 0)
    + (state.meta.feedbackCategoryBonusAmount || 0)
    + (state.meta.feedbackCommentBonusAmount || 0);
  if (total <= 0) return;
  const before = selectors.currentLevel(state);
  if (!Number.isFinite(state.meta.initialLevel)) state.meta.initialLevel = C.INITIAL_LEVEL_BASE;
  state.meta.currentLevel = before + total;
  state.meta.feedbackEmotionBonusAmount = 0;
  state.meta.feedbackCategoryBonusAmount = 0;
  state.meta.feedbackCommentBonusAmount = 0;
  syncNotifiedLevel();   // ★maybeNotifyLevelUp の遅延判定による重複通知を防ぐ
  enqueueToast(`✨ Lv.${before} ➔ Lv.${selectors.currentLevel(state)} にUP！`, 'levelup');
  triggerLevelUpEffect();
}

// ---------------------------------------------------------------------------
// アクション（§4.1b data-action 契約表）
// ★表に無いアクション名を追加しない。ここに無いボタンは Phase 5/6 側の担当。
// ---------------------------------------------------------------------------
const ACTIONS = {
  /**
   * 画面1（STEP1）完了：収入ベースの初期レベルをレベル公開演出で見せてから画面2へ進む
   * （ウィザードUI改修・2026-08-08）。
   * ★ゲーミフィケーション改修（2026-08-08）：画面上のレベル・ゲージは
   *   「STEP1→2」「STEP2→3」のボタン押下時のみ動く仕様にした（入力中はリアルタイムに動かさない）。
   *   ここで state.meta.initialLevel を確定（フリーズ）することで、
   *   selectors.currentLevel() が画面2の入力に反応しなくなる。
   *   ★同じ年収でも初期レベルが毎回同じにならないよう、-3〜+3のランダムな端数を加える。
   * ★致命的バグ修正（2026-08-08）：初期レベルが確定済み（＝このボタンを一度でも押したことがある）
   *   場合は、再度押しても計算・ランダム端数の再抽選もレベル公開演出の再表示も行わない。
   *   以前はボタンを押すたびに毎回再計算・再ポップアップしてしまい、STEP1に戻って
   *   もう一度押すとレベルが変わって見える不具合があった。
   */
  startDiagnosis(){
    state.meta.createdAt = state.meta.createdAt ?? new Date().toISOString();
    state.meta.lastOpenedAt = new Date().toISOString();
    if (Number.isFinite(state.meta.initialLevel)){
      goToScreen(2);
      return;
    }
    // ★固定費はこの時点で未入力のため収入のみ反映される（selectors.initialLevel()と等価）
    const base = calc.calcInitialLevel(selectors.netIncome(state), selectors.fixedCostsTotal(state));
    const jitter = Math.floor(Math.random() * (C.INITIAL_LEVEL_JITTER * 2 + 1)) - C.INITIAL_LEVEL_JITTER;
    const level = Math.max(C.INITIAL_LEVEL_BASE, base + jitter);
    state.meta.initialLevel = level;
    syncNotifiedLevel();
    pendingScreenAfterReveal = 2;
    showLevelReveal({
      label: 'あなたの初期レベルは…',
      level,
      sub: '収入から算出した概算レベルです。次は固定費を入力してさらに詳しく診断します。'
    });
  },

  /**
   * 画面2（STEP2）完了：固定費の圧迫度まで反映した「本当のレベル」を確定・公開してから
   * 画面3（クエスト一覧）へ進む。★ここでは画面1のランダム端数は加えない（年収からの
   *   概算＝初期レベルのバラつきという位置づけのため、固定費反映後の再計算は決定的に行う）。
   */
  generateQuests(){
    const trueLevel = calc.calcInitialLevel(selectors.netIncome(state), selectors.fixedCostsTotal(state));
    state.meta.initialLevel = trueLevel;
    state.meta.currentLevel = trueLevel;
    syncNotifiedLevel();
    pendingScreenAfterReveal = 3;
    // ★表示は selectors.currentLevel() 経由にする。これにより、この時点で既に
    //   クエストが0件（伝説の勇者）であれば、確定演出でもLv.99が正しく表示される。
    showLevelReveal({
      label: '固定費を反映した本当のレベルは…',
      level: selectors.currentLevel(state),
      sub: 'ここからクエストを解呪するたびにレベルが上がっていきます。'
    });
  },

  /** レベル公開演出を閉じ、予約しておいた次の画面へ進む。 */
  dismissLevelReveal(){
    hideLevelReveal();
    if (pendingScreenAfterReveal){
      goToScreen(pendingScreenAfterReveal);
      pendingScreenAfterReveal = null;
    }
  },

  goToScreen1(){ goToScreen(1); },
  goToScreen2(){ goToScreen(2); },
  goToScreen3(){ goToScreen(3); },
  goToScreen4(){ goToScreen(4); },
  // ★画面3→4はクエストの解呪状況を都度確認しながら進める運用のため、演出なしで即遷移する
  //   （公開演出は画面1→2・画面2→3の2箇所のみ、というユーザー指示に準拠）。
  goToFinalResult(){ goToScreen(4); },

  // ★シェアは最終確認画面（画面4／マイカルテ）専用（Phase3.4）。
  shareX(){
    const text = selectors.shareTextV2(state);
    const url = `https://x.com/intent/post`
      + `?text=${encodeURIComponent(text)}`
      + `&url=${encodeURIComponent(C.SITE_URL)}`;
    window.open(url, '_blank', 'noopener');
  },

  async saveKarte(btn){
    // ★連打防止：処理中は isCapturing で弾き、ボタンをローディング状態にする
    if (isCapturingKarte) return;
    isCapturingKarte = true;
    btn.disabled = true;
    btn.classList.add('is-loading');
    showToast('画像を作成しています…');
    try{
      const target = document.getElementById('karte-capture-target');
      if (!target) return;
      const canvas = await captureCard(target);
      if (canvas) await saveCard(canvas);
    } finally {
      isCapturingKarte = false;
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  },

  async copySpell(btn){
    const text = encodeSpell(state);   // ★await を挟まず同期で用意
    const ok = await copyToClipboard(text);
    if (ok) flashButton(btn, 'コピーしました！');
    else showToast('コピーできませんでした。呪文欄を長押しして手動でコピーしてください', 'warn');
  },

  async exportPdf(btn){
    if (isExportingPdf) return;
    isExportingPdf = true;
    btn.disabled = true;
    btn.classList.add('is-loading');
    showToast('PDFを作成しています…');
    try{
      await exportFullReportPdf();
    } catch {
      showToast('PDFを作成できませんでした。時間をおいてお試しください', 'warn');
    } finally {
      isExportingPdf = false;
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  },

  restoreSpell(){
    const input = document.getElementById('in-spell-code');
    const code = input?.value ?? '';
    try{
      const restored = restoreFromSpell(code);
      applyRestoredState(restored);
      unlockAllScreensAfterRestore();
      resetQuestListCache();
      resetExQuestUnlockState();
      syncNotifiedLevel();   // ★復元直後に基準レベルとの差分で誤った「LEVEL UP!」通知が出るのを防ぐ
      if (input) input.value = '';
      showToast('呪文から復元しました');
    }catch{
      // ★復元成功が確定するまで localStorage に書き込まない（§4.5）。
      //   applyRestoredState を呼ばないため、失敗時に既存Stateは一切変更されない。
      showToast('呪文が正しくないようです。もう一度コピーし直してください', 'warn');
    }
  },

  assistFireInsurance(){
    // 「わからない」時の相場補完値（config.js FIRE_INSURANCE.assistMonthly）。
    state.fixedCosts.fireInsurance = C.FIRE_INSURANCE_ASSIST_MONTHLY;
  },

  /**
   * 「冒険を最初から始める」の確認モーダルを開く。
   * ★ブラウザ標準の window.confirm は、URLバー付近に表示され「今後表示しない」チェックが
   *   出ることがあり体験を損なうため、自作のカスタムモーダル（#sheet-reset-confirm）に置き換えた
   *   （ユーザーテストフィードバック改修・2026-08-08）。
   */
  resetAdventure(){
    const sheet = document.getElementById('sheet-reset-confirm');
    if (sheet) openSheet(sheet);
  },

  /**
   * リセット確認モーダルの「はい」。全Stateを初期値に戻し、STEP1の先頭へ戻る。
   * ★localStorage の永続化もState変更に連動して自動的に上書きされる（store.jsのsubscribe経由）。
   */
  confirmResetAdventure(){
    const sheet = document.getElementById('sheet-reset-confirm');
    if (sheet) closeSheet(sheet);
    const fresh = structuredClone(INITIAL_STATE);
    applyRestoredState(fresh);
    resetQuestListCache();
    resetExQuestUnlockState();
    syncNotifiedLevel();   // ★リセット直後に誤ったレベル差分演出が出ないよう基準を同期する
    showToast('冒険をはじめから始めます');
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  },

  /** リセット確認モーダルの「キャンセル」。何もせず閉じる。 */
  closeResetConfirm(){
    const sheet = document.getElementById('sheet-reset-confirm');
    if (sheet) closeSheet(sheet);
  },

  openFeedback(){
    const sheet = document.getElementById('sheet-feedback');
    if (sheet) openSheet(sheet);
  },

  closeFeedback(){
    const sheet = document.getElementById('sheet-feedback');
    if (sheet) closeSheet(sheet);
  },

  closeImageModal(){
    // ★§4.4③（iOS長押し保存の案内）用モーダル。openSheet/closeSheetの汎用実装を流用する。
    const modal = document.getElementById('image-modal');
    if (modal) closeSheet(modal);
  },

  async submitFeedback(btn){
    if (isSubmittingFeedback) return;                    // ★UI層での連打防止（第一防波堤）
    isSubmittingFeedback = true;
    btn.disabled = true;
    btn.classList.add('is-loading');
    // ★「送信する」を押した段階で、キューに積まれた隠しボーナスEXPを一括反映する
    //   （通信の成否は問わない。致命的バグ修正・2026-08-08：以前はタップ・入力の瞬間に
    //   即座に反映していた）。
    applyPendingFeedbackBonus();
    try{
      const result = await sendFeedback(collectFeedbackData(), state);
      handleFeedbackResult(result);
    } finally {
      isSubmittingFeedback = false;
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  }
};

/**
 * フィードバックのボトムシートからフォーム値を集める。
 * @returns {{emotion:string|null, categories:string[], comment:string,
 *   wantsComparisonInfo:boolean, botcheck:string}}
 */
function collectFeedbackData(){
  const emotionBtn = document.querySelector('[data-feedback-emotion][aria-pressed="true"]');
  const categories = [...document.querySelectorAll('[data-feedback-category][aria-pressed="true"]')]
    .map(el => el.dataset.feedbackCategory);
  const comment = document.getElementById('in-feedback-comment')?.value ?? '';
  const wantsComparisonInfo = document.getElementById('in-feedback-demand')?.checked ?? false;
  // ★Honeypot。正規ユーザーには visually-hidden で見えず、ボットのみ埋めてしまう想定
  const botcheck = document.querySelector('[name="botcheck"]')?.value ?? '';

  return {
    emotion: emotionBtn?.dataset.feedbackEmotion ?? null,
    categories, comment, wantsComparisonInfo, botcheck
  };
}

/** 送信済みフォームを次回用にリセットする（ボタンの押下状態・自由記述欄）。 */
function resetFeedbackForm(){
  document.querySelectorAll('[data-feedback-emotion], [data-feedback-category]')
    .forEach(el => el.setAttribute('aria-pressed', 'false'));
  const comment = document.getElementById('in-feedback-comment');
  if (comment) comment.value = '';
  const demand = document.getElementById('in-feedback-demand');
  if (demand) demand.checked = false;
}

/**
 * sendFeedback() の結果を §6.10 の確定文言に従って通知する。
 * @param {{success:boolean, reason?:string, waitSec?:number, levelBonus:number}} result
 * @returns {void}
 */
function handleFeedbackResult(result){
  if (result.success && result.levelBonus > 0){
    // ★ボーナス演出に一本化する（§3.6）。maybeNotifyLevelUp の遅延判定による
    //   「LEVEL UP!」の二重表示を防ぐため、先に基準レベルを現在値へ同期する。
    syncNotifiedLevel();
    enqueueToast('🎉 開発協力ボーナス獲得 ➔ ＋1 Level UP!', 'levelup');
    resetFeedbackForm();
    const sheet = document.getElementById('sheet-feedback');
    if (sheet) closeSheet(sheet);
    return;
  }
  if (result.success){                                  // 2回目以降 or Honeypot
    if (result.reason !== 'honeypot') showToast('ご意見ありがとうございます！');
    resetFeedbackForm();
    const sheet = document.getElementById('sheet-feedback');
    if (sheet) closeSheet(sheet);
    return;
  }
  if (result.reason === 'in_flight') return;             // 表示しない（§6.10）
  if (result.reason === 'cooldown'){
    showToast(`送信間隔が短すぎます。あと${result.waitSec}秒お待ちください`, 'warn');
    return;
  }
  const [msg, tone] = FEEDBACK_MESSAGES[result.reason]
    ?? ['送信できませんでした。時間をおいてお試しください', 'warn'];
  showToast(msg, tone);
}

function prefersReducedMotion(){
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * state（Proxy）へ復元結果を反映する。export const のため再代入はできないので、
 * トップレベルキーを個別に代入する（各代入が deepReactive で再帰的に包み直される）。
 * @param {object} restored migrate() が返す完全な State
 * @returns {void}
 */
function applyRestoredState(restored){
  state.schemaVersion = restored.schemaVersion;
  state.meta = restored.meta;
  state.userProfile = restored.userProfile;
  state.fixedCosts = restored.fixedCosts;
  state.finance = restored.finance;
  state.creditCards = restored.creditCards;
  state.quests = restored.quests;
  state.selections = restored.selections;
  state.betaFeedback = restored.betaFeedback;
}

/**
 * 「復活の呪文」で復元した直後、進行度に関わらず全タブへ自由に移動できるようロックを解除する。
 * ★致命的バグ修正（2026-08-08）：「呪文」には state.meta.screen / maxScreen を含めていないため
 *   （encodeSpell参照）、復元直後は常に INITIAL_STATE の既定値（screen:1, maxScreen:1）のままとなり、
 *   STEP2・クエスト・結果タブが復元後もロックされ続けるバグがあった。
 *   呪文は「これまでの入力を一通り終えたセッション」の完全なスナップショットである前提のため、
 *   復元成功時は無条件で maxScreen を最大にし、全タブへ自由に遷移できるようにする。
 * ★resetAdventure（フルリセット）ではこの関数を呼ばない。まっさらな状態から再スタートする際は
 *   タブが再びロックされているのが正しい挙動のため。
 * @returns {void}
 */
function unlockAllScreensAfterRestore(){
  state.meta.maxScreen = 4;
}

// ---------------------------------------------------------------------------
// 起動時の呪文自動ロード（?s=... クエリパラメータ）
// ---------------------------------------------------------------------------
function loadSpellFromUrlIfPresent(){
  const code = new URLSearchParams(location.search).get('s');
  if (!code) return;
  try{
    applyRestoredState(restoreFromSpell(code));
    unlockAllScreensAfterRestore();
    resetQuestListCache();
    resetExQuestUnlockState();
    syncNotifiedLevel();   // ★復元直後に基準レベルとの差分で誤った「LEVEL UP!」通知が出るのを防ぐ
    showToast('呪文から復元しました');
  }catch{
    showToast('URLの呪文が正しくないようです。もう一度リンクを確認してください', 'warn');
  }
}

// ---------------------------------------------------------------------------
// 起動
// ---------------------------------------------------------------------------
setPersistErrorHandler(() => {
  showToast('この環境では保存できません。「魔法の呪文」で控えを取ってください', 'warn');
});

subscribe(scheduleRender);       // ★State変更のたびに requestAnimationFrame で再描画を予約する
subscribe(maybeNotifyLevelUp);   // ★State変更のたびにレベル上昇を判定する（§4.3・600msデバウンス）

bindEvents();
populateAnnualSalarySelect();
populateSubscriptionAccordion();
populateRealChargeAccordion();
loadSpellFromUrlIfPresent();
scheduleRender();            // 初期描画
