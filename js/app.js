// app.js — イベント結線（§6.7）。DOM操作は ui.js に委譲し、ここではイベントと
// ACTIONS の対応付けのみを担う。
import { state, subscribe, setPersistErrorHandler, parseYen,
         encodeSpell, restoreFromSpell, INITIAL_STATE } from './store.js';
import { scheduleRender, showToast, enqueueToast, syncNotifiedLevel, maybeNotifyLevelUp,
         openSheet, closeSheet, flashButton,
         getByPath, setByPath, formatNumber, copyToClipboard,
         captureCard, saveCard, resetQuestListCache, populateAnnualSalarySelect,
         triggerLevelUpEffect, updateExpGauge, showLevelReveal, hideLevelReveal } from './ui.js';
import { selectors } from './selectors.js';
import * as calc from './calc.js';
import * as C from './config.js';
import { sendFeedback } from './feedback.js';

let isCapturingKarte = false;      // ★saveKarte の重畳連打防止（第一防波堤はボタンのdisabled）
let isSubmittingFeedback = false;  // ★submitFeedback の重畳連打防止（feedback.js自身のisSubmittingに加えた第二防波堤）
let pendingScreenAfterReveal = null;   // ★レベル公開演出（dismissLevelReveal）後に遷移する画面番号

/**
 * ウィザードの画面を切り替える（ウィザードUI改修・2026-08-08）。
 * ★画面1・2に入るときはEXPゲージを現在の入力値に追いつかせる。
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
  if (n === 1 || n === 2) hydrateExpGauge(n);
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
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
    const el = e.target.closest('[data-model]');
    if (!el || el.dataset.composing === '1') return;
    if (el.type === 'checkbox' || el.tagName === 'SELECT') return;   // これらは change で処理する
    setByPath(state, el.dataset.model, parseYen(el.value));
    markExpTouched(el.dataset.model);
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

  // ★フォーカス時に全選択：既に値が入っている欄（アシスト補完値等）を
  //   ワンタップ（1クリック）で上書きできるようにする（改善要望対応）。
  //   focus はバブリングしないため capture フェーズで拾う。
  document.addEventListener('focus', e => {
    const el = e.target.closest('[data-model]');
    if (el && el.type !== 'checkbox' && el.tagName !== 'SELECT') el.select();
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

    const emo = e.target.closest('[data-feedback-emotion]');
    if (emo) selectSingle(emo, '[data-feedback-emotion]');

    const chip = e.target.closest('[data-feedback-category]');
    if (chip) chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') !== 'true');
  });

  document.addEventListener('change', e => {
    const questCb = e.target.closest('[data-quest-toggle]');
    if (questCb){ onQuestToggle(questCb); return; }

    const otherCardCb = e.target.closest('[data-card-other-toggle]');
    if (otherCardCb){ onCardOtherToggle(otherCardCb); return; }

    const planRadio = e.target.closest('[data-plan-group]');
    if (planRadio){ onPlanGroupChange(planRadio); markExpTouched('__subscriptions'); return; }

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
    markExpTouched(el.dataset.model);
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
 * ★毎回、解呪済みクエストの月間節約可能額の合計から再計算する（累積方式）。
 * ★クエストを1件解呪するたびに、レベルが変わったかどうかによらず
 *   ヘッダーのレベル表示・ゲージを光らせる演出を必ず発生させる
 *   （ユーザーテストフィードバック改修・2026-08-08）。
 * @returns {void}
 */
function handleQuestLevelUp(){
  const before = Number.isFinite(state.meta.currentLevel)
    ? state.meta.currentLevel : selectors.initialLevel(state);
  const totalSaving = selectors.completedSavingTotal(state);
  const { finalLevel } = calc.calcCurrentLevel(state.meta.initialLevel ?? 0, totalSaving);
  state.meta.currentLevel = finalLevel;
  if (finalLevel !== before){
    enqueueToast(`現状 Lv.${before} ➔ Lv.${finalLevel} にUP！`, 'levelup');
  }
  syncNotifiedLevel();   // ★maybeNotifyLevelUp の遅延判定による重複通知を防ぐ
  triggerLevelUpEffect();
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

/** グループ内の他要素の aria-pressed を外し、対象だけ true にする（感情ボタン用）。 */
function selectSingle(target, selector){
  document.querySelectorAll(selector).forEach(el => el.setAttribute('aria-pressed', String(el === target)));
}

// ---------------------------------------------------------------------------
// EXPゲージ（入力アクション連動の演出。ウィザードUI改修・2026-08-08）
//   ★state（永続化対象）には持たせない一時的なUI状態のため、モジュール内の
//     プレーンなSetで管理する（画面をまたいでも0%に戻らないよう、画面遷移時に
//     現在値からの「追いつき」を行う＝hydrateExpGauge）。
// ---------------------------------------------------------------------------
const EXP_FIELDS = {
  1: ['userProfile.annualSalary', 'userProfile.age', 'userProfile.insuranceType',
      'userProfile.isUnderOneYear', 'userProfile.isResidentTaxExempt', 'userProfile.area'],
  2: ['fixedCosts.smartphone', 'fixedCosts.internetMonthly', 'fixedCosts.medicalInsurance',
      'fixedCosts.fireInsurance', 'fixedCosts.nhkPlan', 'fixedCosts.rent',
      'fixedCosts.hasCar', '__subscriptions']
};
const touchedFields = { 1: new Set(), 2: new Set() };

/**
 * 入力・選択のたびにEXPゲージを伸ばす。追跡対象外のフィールドは無視する。
 * @param {string} path data-model のパス（サブスクは特別に '__subscriptions'）
 * @returns {void}
 */
function markExpTouched(path){
  for (const screen of [1, 2]){
    if (!EXP_FIELDS[screen].includes(path)) continue;
    touchedFields[screen].add(path);
    updateExpGauge(screen, (touchedFields[screen].size / EXP_FIELDS[screen].length) * 100);
  }
}

/**
 * 画面に入った時点で、既に値が入っているフィールド分をEXPゲージへ「追いつかせる」。
 * 呪文復元・ページ再読込・「戻る」での再訪問時に0%へ戻って見えるのを防ぐ。
 * @param {1|2} screen
 * @returns {void}
 */
function hydrateExpGauge(screen){
  const isChanged = path => {
    if (path === '__subscriptions') return selectors.subscriptionTotal(state) > 0;
    // ★「値が入っているか」ではなく「初期値から変更されているか」で判定する。
    //   insuranceType等は既定値自体が空でないため、真偽値ベースの判定だと
    //   触れる前から達成扱いになってしまう。
    return getByPath(state, path) !== getByPath(INITIAL_STATE, path);
  };
  EXP_FIELDS[screen].forEach(path => { if (isChanged(path)) touchedFields[screen].add(path); });
  updateExpGauge(screen, (touchedFields[screen].size / EXP_FIELDS[screen].length) * 100);
}

// ---------------------------------------------------------------------------
// アクション（§4.1b data-action 契約表）
// ★表に無いアクション名を追加しない。ここに無いボタンは Phase 5/6 側の担当。
// ---------------------------------------------------------------------------
const ACTIONS = {
  /**
   * 画面1（STEP1）完了：収入ベースの初期レベルをレベル公開演出で見せてから画面2へ進む
   * （ウィザードUI改修・2026-08-08）。
   */
  startDiagnosis(){
    state.meta.createdAt = state.meta.createdAt ?? new Date().toISOString();
    state.meta.lastOpenedAt = new Date().toISOString();
    const level = selectors.initialLevel(state);   // この時点では固定費未入力のため収入のみ反映
    pendingScreenAfterReveal = 2;
    showLevelReveal({
      label: 'あなたの初期レベルは…',
      level,
      sub: '収入から算出した概算レベルです。次は固定費を入力してさらに詳しく診断します。'
    });
  },

  /**
   * 画面2（STEP2）完了：固定費の圧迫度まで反映した「本当のレベル」を確定・公開してから
   * 画面3（クエスト一覧）へ進む。★初期レベルはここで一度だけ確定し、以後不変。
   */
  generateQuests(){
    state.meta.initialLevel = selectors.initialLevel(state);
    state.meta.currentLevel = state.meta.initialLevel;
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
      const maskAmount = document.getElementById('in-mask-amount-on-save')?.checked ?? false;
      const canvas = await captureCard(target, { maskAmount });
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
    // 「わからない」時の相場補完値（config.js FIRE_INSURANCE.assistMonthly）。
    state.fixedCosts.fireInsurance = C.FIRE_INSURANCE_ASSIST_MONTHLY;
  },

  /**
   * 冒険を最初から始める（Phase3.4）。全Stateを初期値に戻し、STEP1の先頭へ戻る。
   * ★localStorage の永続化もState変更に連動して自動的に上書きされる（store.jsのsubscribe経由）。
   */
  resetAdventure(){
    if (!window.confirm('ここまでの入力内容をすべて消去して、最初からやり直します。よろしいですか？')) return;
    const fresh = structuredClone(INITIAL_STATE);
    applyRestoredState(fresh);   // ★touchedFieldsのクリア・EXPゲージの0%表示もここで行われる
    resetQuestListCache();
    syncNotifiedLevel();   // ★リセット直後に誤ったレベル差分演出が出ないよう基準を同期する
    showToast('冒険をはじめから始めます');
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
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
  state.finance = restored.finance;
  state.creditCards = restored.creditCards;
  state.quests = restored.quests;
  state.selections = restored.selections;
  state.betaFeedback = restored.betaFeedback;
  touchedFields[1].clear();
  touchedFields[2].clear();
  hydrateExpGauge(1);
  hydrateExpGauge(2);
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
populateAnnualSalarySelect();
loadSpellFromUrlIfPresent();
hydrateExpGauge(1);
hydrateExpGauge(2);
scheduleRender();            // 初期描画
