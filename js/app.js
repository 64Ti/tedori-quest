// app.js — イベント結線（§6.7）。DOM操作は ui.js に委譲し、ここではイベントと
// ACTIONS の対応付けのみを担う。
import { state, subscribe, setPersistErrorHandler, parseYen,
         encodeSpell, restoreFromSpell } from './store.js';
import { scheduleRender, showToast, enqueueToast, syncNotifiedLevel, maybeNotifyLevelUp,
         openSheet, closeSheet, flashButton,
         getByPath, setByPath, formatNumber, copyToClipboard,
         captureCard, saveCard } from './ui.js';
import { selectors } from './selectors.js';
import * as C from './config.js';
import { sendFeedback } from './feedback.js';

let isCapturingKarte = false;      // ★saveKarte の重畳連打防止（第一防波堤はボタンのdisabled）
let isSubmittingFeedback = false;  // ★submitFeedback の重畳連打防止（feedback.js自身のisSubmittingに加えた第二防波堤）

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
  document.addEventListener('input', e => {
    const otherLabel = e.target.closest('[data-other-label]');
    if (otherLabel){ upsertOtherSub(otherLabel.dataset.otherLabel, { label: otherLabel.value }); return; }

    const otherMonthly = e.target.closest('[data-other-monthly]');
    if (otherMonthly){
      upsertOtherSub(otherMonthly.dataset.otherMonthly, { monthly: parseYen(otherMonthly.value) });
      return;
    }

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
  }, true);

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (btn) ACTIONS[btn.dataset.action]?.(btn, e);

    const emo = e.target.closest('[data-feedback-emotion]');
    if (emo) selectSingle(emo, '[data-feedback-emotion]');

    const chip = e.target.closest('[data-feedback-category]');
    if (chip) chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') !== 'true');
  });

  document.addEventListener('change', e => {
    const questCb = e.target.closest('[data-quest-toggle]');
    if (questCb){ state.todoStatus[questCb.dataset.questToggle] = questCb.checked; return; }

    const planRadio = e.target.closest('[data-plan-group]');
    if (planRadio){ onPlanGroupChange(planRadio); return; }

    const el = e.target.closest('[data-model]');
    if (!el) return;
    if (el.type === 'checkbox') setByPath(state, el.dataset.model, el.checked);
    else if (el.tagName === 'SELECT') setByPath(state, el.dataset.model, el.value);
  });
}

/**
 * ラジオグループの状態変化を selections.subscriptionPlanIds に反映する（§3.9）。
 * 同一サービスの他プランを除去してから、選択されたものだけ入れる。
 * @param {HTMLInputElement} el
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
 * その他サブスクの行データを更新する。存在しない rowId なら新規追加する。
 * @param {string} rowId
 * @param {{label?:string, monthly?:number|null}} patch
 * @returns {void}
 */
function upsertOtherSub(rowId, patch){
  const rows = state.selections.otherSubscriptions;
  const row = rows.find(r => r.id === rowId);
  if (row){
    Object.assign(row, patch);
  } else {
    state.selections.otherSubscriptions = [
      ...rows,
      { id: rowId, label: '', monthly: null, ...patch }
    ];
  }
}

/** グループ内の他要素の aria-pressed を外し、対象だけ true にする（感情ボタン用）。 */
function selectSingle(target, selector){
  document.querySelectorAll(selector).forEach(el => el.setAttribute('aria-pressed', String(el === target)));
}

// ---------------------------------------------------------------------------
// その他サブスク行の追加・削除（DOM操作は createElement のみ。innerHTML不使用＝制約5）
// ---------------------------------------------------------------------------
function nextOtherSubRowId(container){
  const used = [...container.querySelectorAll('.other-sub-row')]
    .map(r => Number(r.dataset.rowId.replace('o', '')) || 0);
  return `o${(used.length ? Math.max(...used) : 0) + 1}`;
}

function createOtherSubRow(id){
  const idx = Number(id.replace('o', '')) || 1;
  const placeholder = C.OTHER_SUBSCRIPTION.placeholders[(idx - 1) % C.OTHER_SUBSCRIPTION.placeholders.length];

  const row = document.createElement('div');
  row.className = 'other-sub-row';
  row.dataset.rowId = id;

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'input input--label';
  labelInput.maxLength = C.OTHER_SUBSCRIPTION.labelMaxLength;
  labelInput.placeholder = placeholder;
  labelInput.autocomplete = 'off';
  labelInput.setAttribute('aria-label', 'サービス名');
  labelInput.dataset.otherLabel = id;
  labelInput.dataset.composing = '0';

  const monthlyInput = document.createElement('input');
  monthlyInput.type = 'text';
  monthlyInput.inputMode = 'numeric';
  monthlyInput.pattern = '[0-9,]*';
  monthlyInput.className = 'input';
  monthlyInput.placeholder = '8,000';
  monthlyInput.autocomplete = 'off';
  monthlyInput.setAttribute('aria-label', '月額（円）');
  monthlyInput.dataset.otherMonthly = id;
  monthlyInput.dataset.composing = '0';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-icon';
  removeBtn.dataset.action = 'removeOtherSub';
  removeBtn.dataset.rowId = id;
  removeBtn.setAttribute('aria-label', 'この行を削除');
  removeBtn.textContent = '✕';

  row.append(labelInput, monthlyInput, removeBtn);
  return row;
}

function refreshAddOtherSubButton(container){
  const addBtn = document.querySelector('[data-action="addOtherSub"]');
  if (!addBtn) return;
  const count = container.querySelectorAll('.other-sub-row').length;
  addBtn.disabled = count >= C.OTHER_SUBSCRIPTION.maxRows;
}

// ---------------------------------------------------------------------------
// アクション（§4.1b data-action 契約表）
// ★表に無いアクション名を追加しない。ここに無いボタンは Phase 5/6 側の担当。
// ---------------------------------------------------------------------------
const ACTIONS = {
  startDiagnosis(){
    if (!state.meta.hasCompletedStep1){
      // ★initialLevel は「STEP1完了時に一度だけ確定・以後不変」（§6.5）。
      //   この時点では feedbackBonusGranted は必ず false のため moneyLevel と
      //   displayLevel は一致する。shareText 側と単位を揃えるため moneyLevel を使う。
      state.meta.initialLevel = selectors.moneyLevel(state);
      state.meta.createdAt = state.meta.createdAt ?? new Date().toISOString();
    }
    state.meta.lastOpenedAt = new Date().toISOString();
    state.meta.hasCompletedStep1 = true;
    const target = document.getElementById('sec-result');
    target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  },

  shareX(){
    const text = selectors.shareText(state);
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

  async copySpellLink(btn){
    // ★共有リンク：?s=<呪文> を付けたURL。app.js起動時の loadSpellFromUrlIfPresent が
    //   このURLを開いたときに自動で復元する。
    const url = `${C.SITE_URL}/?s=${encodeURIComponent(encodeSpell(state))}`;
    const ok = await copyToClipboard(url);
    if (ok) flashButton(btn, 'リンクをコピーしました！');
    else showToast('コピーできませんでした。しばらくしてからもう一度お試しください', 'warn');
  },

  restoreSpell(){
    const input = document.getElementById('in-spell-code');
    const code = input?.value ?? '';
    try{
      const restored = restoreFromSpell(code);
      applyRestoredState(restored);
      if (input) input.value = '';
      showToast('呪文から復元しました');
    }catch{
      // ★復元成功が確定するまで localStorage に書き込まない（§4.5）。
      //   applyRestoredState を呼ばないため、失敗時に既存Stateは一切変更されない。
      showToast('呪文が正しくないようです。もう一度コピーし直してください', 'warn');
    }
  },

  assistFireInsurance(){
    // 「わからない」時の相場補完値。config.js の算出根拠：2年17,500円の中央値÷24。
    state.fixedCosts.fireInsurance = C.FIRE_INSURANCE_ASSIST_MONTHLY;
  },

  addOtherSub(){
    const container = document.querySelector('[data-other-rows]');
    if (!container) return;
    if (container.querySelectorAll('.other-sub-row').length >= C.OTHER_SUBSCRIPTION.maxRows) return;
    const id = nextOtherSubRowId(container);
    container.appendChild(createOtherSubRow(id));
    refreshAddOtherSubButton(container);
  },

  removeOtherSub(btn){
    const rowId = btn.dataset.rowId;
    const container = document.querySelector('[data-other-rows]');
    document.querySelector(`.other-sub-row[data-row-id="${rowId}"]`)?.remove();
    state.selections.otherSubscriptions = state.selections.otherSubscriptions.filter(r => r.id !== rowId);
    if (container) refreshAddOtherSubButton(container);
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
  state.optimized = restored.optimized;
  state.finance = restored.finance;
  state.todoStatus = restored.todoStatus;
  state.selections = restored.selections;
  state.betaFeedback = restored.betaFeedback;
  rebuildOtherSubRows();
}

/**
 * 復元後、その他サブスクの行DOMを selections.otherSubscriptions に合わせて作り直す。
 * ★innerHTML は使わず、既存行を削除してから createElement で作り直す（制約5）。
 * @returns {void}
 */
function rebuildOtherSubRows(){
  const container = document.querySelector('[data-other-rows]');
  if (!container) return;
  container.querySelectorAll('.other-sub-row').forEach(row => row.remove());
  const rows = state.selections.otherSubscriptions.length
    ? state.selections.otherSubscriptions
    : [{ id: 'o1', label: '', monthly: null }];
  rows.forEach(r => container.appendChild(createOtherSubRow(r.id)));
  refreshAddOtherSubButton(container);
}

// ---------------------------------------------------------------------------
// 起動時の呪文自動ロード（?s=... クエリパラメータ）
// ---------------------------------------------------------------------------
function loadSpellFromUrlIfPresent(){
  const code = new URLSearchParams(location.search).get('s');
  if (!code) return;
  try{
    applyRestoredState(restoreFromSpell(code));
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
loadSpellFromUrlIfPresent();
rebuildOtherSubRows();
scheduleRender();            // 初期描画
