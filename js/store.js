// store.js — State・永続化・リアクティブ層。
// ★DOM操作そのもの（描画・トースト表示）は ui.js（Phase 4）側の責務。
//   ここでは onChange / エラー時の通知先を差し替え可能なフックとして持ち、
//   ui.js が未実装の現段階でも本ファイル単体で読み込み・テストできるようにする。
import * as C from './config.js';

export const INITIAL_STATE = {
  schemaVersion: 4,                       // ★必須。無いと次回更新で全ユーザーのデータが飛ぶ
                                          //   Phase1〜4改修（2026-08-07）でv1→v2。
                                          //   ユーザーテストフィードバック改修（2026-08-07）でv2→v3
                                          //   （grossSalary→annualSalaryへ変更）。
                                          //   ウィザードUI改修（2026-08-08）でv3→v4
                                          //   （hasCompletedStep1→screen、hourlyWage/internetProvider廃止）。
                                          //   deepMerge が旧キー（optimized・cardReward・todoStatus・
                                          //   grossSalary・hourlyWage・internetProvider・hasCompletedStep1等）を
                                          //   自動的に無視し、新キーは初期値で補完するため
                                          //   専用の MIGRATIONS 関数は不要（構造的に安全に移行できる）

  meta: {
    initialLevel: null,                   // 固定費入力を終えSTEP1完了時に一度だけ確定。以後不変
    currentLevel: null,                   // クエスト解呪ごとに再算出される現在レベル（未解呪時はnull＝initialLevelと同値扱い）
    feedbackBonusGranted: false,          // ★生涯1回。呪文にも含める
    createdAt: null, lastOpenedAt: null,
    screen: 1,                            // ★ウィザードUI改修（2026-08-08）：表示中の画面（1〜4）。
                                          //   旧hasCompletedStep1（真偽値）を置き換えた
    maxScreen: 1                          // ★ナビゲーションバグ修正（2026-08-08）：これまでに到達した
                                          //   最大の画面番号。ボトムナビの活性判定はこちらを使う。
                                          //   screen（今表示中の画面）と分離することで、戻った後も
                                          //   タブから自由に前後へ移動できるようにする
  },

  userProfile: {
    annualSalary: null,                   // 年収（額面・円）。ドロップダウン選択式
    age: null,                            // 介護保険料の年齢判定用
    prefecture: 'osaka',
    insuranceType: 'association',         // 'association' | 'kumiai'
    isUnderOneYear: false,                // 健保加入12ヶ月未満
    isResidentTaxExempt: false,           // 高額療養費 区分オ 判定
    area: 'urban'                         // 家賃市場平均のエリア
    // ★勤続年数はユーザーテストフィードバック改修（2026-08-07）で入力欄を廃止した。
    //   住民税の勤続1年目非課税判定は C.DEFAULT_YEARS_OF_SERVICE（selectors.netIncome参照）で
    //   「非課税ではない」側に固定して計算する
    // ★時給（hourlyWage）はウィザードUI改修（2026-08-08）で入力欄・関連ロジックごと廃止した
  },

  fixedCosts: {                           // 現状（Phase1.3改修：「見直し後」欄は廃止）
    rent:null, fireInsurance:null, smartphone:null, medicalInsurance:null,
    internetMonthly:null,                                         // 光回線・通信費（月額）
                                          // ★ウィザードUI改修（2026-08-08）：プロバイダ選択式を廃止し、
                                          //   スマホ通信費と同様の単純な数値入力に変更した
    nhkPlan: C.NHK_DEFAULT,                                       // NHK受信料プラン
    hasCar:false, carInsurance:null, parking:null,                // 自動車保険・駐車場代（車ありの時のみ）
    bankFee:null                          // ★Phase1.4：入力欄は非表示（保留）。新方式では算入しない
  },

  // ★§4.1b の data-model 契約表には finance.atmCountOffHours / finance.transferCount が
  //   定義されているが、§6.5 の INITIAL_STATE 例には finance 名前空間が無かった（Phase 3 で
  //   報告済みの齟齬）。Phase1.4により銀行手数料カードは非表示（保留）となったため現在は未使用。
  finance: {
    atmCountOffHours: null,               // 時間外・土日祝のATM利用回数（月）
    transferCount: null                   // 他行宛ネット振込の回数（月）
  },

  // クレジットカード（Phase1.5：メイン1枚必須・サブ1枚任意・その他複数任意）
  creditCards: {
    main: null, sub: null, others: []     // js/creditCards.js の CreditCard.id
  },

  // クエスト解呪状態（Phase2〜3）。key=クエストid、value=解呪した瞬間の月間節約可能額（円）。
  // ★金額を固定して保存することで、解呪後に入力を変更してもレベル計算が遡って変わらないようにする
  quests: {
    completed: {}
  },

  selections: {
    subscriptionPlanIds: [],              // ★選択されたサブスクのプランID配列（§3.9）
                                          //   合計額は保存しない。sumSubscriptions() で都度算出する
    otherSubscriptions: []                // ★その他サブスク（自由入力）
                                          //   [{ id:'o1', label:'ジム', monthly:8000 }] 最大5件
  },

  betaFeedback: { ratingSubmitted:false, lastRating:null }

  // ★以下は絶対に保存しない（selectors.js で都度算出）
  //   currentLevel / rank / fixedCostsTotal 等の派生値
  //   fixedCosts.subscriptions の合計額（選択IDのみを保持し、金額は都度算出する）
};

// ---------------------------------------------------------------------------
// 全角数字の半角化（入力パース）
//   ★§10.2 の完了条件（TEST-51）が store.js に割り当てられているため、
//     §6.7 のインライン例ではなくここに置く。app.js（Phase 4）はここから import する。
// ---------------------------------------------------------------------------

/**
 * 入力文字列を数値化する。全角数字・カンマ・空白・「円」を除去してから変換する。
 * @param {string|number} v 入力値
 * @returns {number|null} 数値化できない場合は null
 */
export function parseYen(v){
  const half = String(v).replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0)-0xFEE0));
  const n = Number(half.replace(/[,\s円]/g,''));
  return Number.isFinite(n) ? n : null;
}

// --- マイグレーション -------------------------------------------------------
const MIGRATIONS = { /* 1: (s)=>{...}  ← v2 リリース時にここへ追記 */ };

/**
 * base の構造を保ったまま override の値で上書きする。
 * ★配列はマージせず丸ごと置き換える（要素単位でマージすると順序・件数の意味が壊れる）。
 * ★override に無いキーは base の初期値を保持する（旧データの欠損項目を初期値で補完する）。
 * @param {object} base 変更される側（構造の基準）
 * @param {object} override 上書きする値
 * @param {object} [forced] マージ後に強制的に上書きする値（schemaVersion 等）
 * @returns {object} base（破壊的に変更して返す）
 */
function deepMerge(base, override, forced = {}){
  if (override && typeof override === 'object' && !Array.isArray(override)){
    for (const key of Object.keys(base)){
      if (!(key in override)) continue;
      const b = base[key], o = override[key];
      base[key] = (b && typeof b === 'object' && !Array.isArray(b))
        ? deepMerge(b, o)
        : o;
    }
  }
  return Object.assign(base, forced);
}

/**
 * 保存済みデータを最新スキーマへ移行する。
 * ★不正値・旧スキーマ・空データのいずれでも例外を投げず、初期値で補完する。
 * @param {object|null} raw localStorage から読み込んだ生データ（未パースはNG）
 * @returns {object} 最新スキーマの State（プレーンオブジェクト。Proxyではない）
 */
export function migrate(raw){
  if (!raw || typeof raw !== 'object') return structuredClone(INITIAL_STATE);
  let s = raw, v = s.schemaVersion ?? 0;
  while (MIGRATIONS[v]){ s = MIGRATIONS[v](s); v += 1; }
  return deepMerge(structuredClone(INITIAL_STATE), s, { schemaVersion: INITIAL_STATE.schemaVersion });
}

// --- 再帰的 Proxy -----------------------------------------------------------

/**
 * オブジェクトを再帰的に Proxy 化し、変更を onChange で通知する。
 * ★new Proxy はトップレベルしか捕捉しないため、state.fixedCosts.rent = X のような
 *   ネストした代入も検知できるよう子オブジェクトごと Proxy 化する。
 * @param {*} target 対象（オブジェクト以外はそのまま返す）
 * @param {(prop:string, value?:*) => void} onChange 変更時に呼ばれるコールバック
 * @returns {*}
 */
export function deepReactive(target, onChange){
  if (target === null || typeof target !== 'object') return target;
  for (const key of Object.keys(target)) target[key] = deepReactive(target[key], onChange);

  return new Proxy(target, {
    get(o, p, r){ return Reflect.get(o, p, r); },
    set(o, p, v, r){
      if (Object.is(o[p], v)) return true;              // 同値なら何もしない（第一防波堤）
      const ok = Reflect.set(o, p, deepReactive(v, onChange), r);
      if (ok) onChange(p, v);
      return ok;                                        // strict mode では true 必須
    },
    deleteProperty(o, p){
      const ok = Reflect.deleteProperty(o, p);
      if (ok) onChange(p);
      return ok;
    }
  });
}

// ★structuredClone(proxy) は DataCloneError を投げ得るため使用禁止。
//   JSON化は get トラップ経由でプレーンな値を読み出すだけなので Proxy でも安全に剥がせる。
function stripProxy(o){ return JSON.parse(JSON.stringify(o)); }

// --- 変更通知（ui.js からの購読） -------------------------------------------
// ★store.js は ui.js の描画関数を直接呼ばない（Phase 4未実装でも読み込み可能にするため）。
//   ui.js は subscribe(scheduleRender) のように後から登録する。
const listeners = new Set();

/**
 * State の変更を購読する。
 * @param {() => void} fn 変更のたびに呼ばれる関数
 * @returns {() => void} 購読解除関数
 */
export function subscribe(fn){
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify(){ for (const fn of listeners) fn(); }

// --- 永続化失敗時の通知先（ui.js からの差し替え） ---------------------------
let onPersistError = () => {};

/**
 * persist() が失敗した場合（iOSプライベートブラウズの QuotaExceededError 等）の
 * 通知先を差し替える。既定は no-op。
 * @param {(error:unknown) => void} fn
 */
export function setPersistErrorHandler(fn){
  onPersistError = typeof fn === 'function' ? fn : () => {};
}

// --- 永続化（デバウンス＋例外処理） -----------------------------------------
let persistTimer = null;
function persist(){
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try{
      localStorage.setItem(C.STORAGE_KEY, JSON.stringify(stripProxy(state)));
    }catch(e){   // iOSプライベートブラウズは QuotaExceededError を投げる
      onPersistError(e);
    }
  }, 400);
}

function loadRaw(){
  try{
    const raw = localStorage.getItem(C.STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch{
    return null;   // localStorage 不可・JSON破損はいずれも初期値へフォールバック
  }
}

export const state = deepReactive(migrate(loadRaw()), (p, v) => { notify(p, v); persist(); });

// ---------------------------------------------------------------------------
// 「魔法の呪文」バックアップ（§4.5）
//   ★入力値のみを含める。派生値（レベル・称号等）は復元時に selectors.js で再計算する。
//   ★btoa は日本語（サブスクの自由入力ラベル等）で InvalidCharacterError を投げるため、
//     TextEncoder 経由でバイト列化してから Base64URL 化する。
// ---------------------------------------------------------------------------

/**
 * State（相当のオブジェクト）を「呪文」文字列にエンコードする。
 * @param {object} s state 相当のオブジェクト（Proxyでも素のオブジェクトでも可）
 * @returns {string} `TQ<schemaVersion>-<base64url>` 形式の呪文
 */
export function encodeSpell(s){
  const payload = {
    v: s.schemaVersion,
    m: { il: s.meta.initialLevel, cl: s.meta.currentLevel, fb: s.meta.feedbackBonusGranted },
    u: s.userProfile, f: s.fixedCosts, cc: s.creditCards, q: s.quests,
    s: s.selections,                   // ★サブスク選択も復元対象（§3.9）
    fn: s.finance                      // ATM・振込回数も復元対象に含める
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const bin   = Array.from(bytes, b => String.fromCharCode(b)).join('');
  const b64   = btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return `TQ${payload.v}-${b64}`;
}

/**
 * 「呪文」文字列を復号する。形式不正・Base64破損・JSON破損はすべて例外を投げる
 * （呼び出し側で try/catch し、既存Stateを書き換える前に成否を確認すること）。
 * @param {string} code `TQ<version>-<base64url>` 形式の呪文
 * @returns {{version:number, data:object}}
 */
export function decodeSpell(code){
  const m = /^TQ(\d+)-([A-Za-z0-9\-_]+)$/.exec(String(code).trim());
  if (!m) throw new Error('形式が正しくありません');
  const b64   = m[2].replace(/-/g,'+').replace(/_/g,'/');
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return { version:Number(m[1]), data: JSON.parse(new TextDecoder().decode(bytes)) };
}

/**
 * 呪文から復元した State を、現行スキーマの完全な State に組み立てる。
 * ★localStorage には一切書き込まない。復元成功が確定するまで書き込まないのは
 *   呼び出し側（app.js）の責務（§4.5）。ここでは純粋にデータ変換のみ行う。
 * @param {string} code 呪文文字列
 * @returns {object} 復元された State（プレーンオブジェクト。Proxyではない）
 */
export function restoreFromSpell(code){
  const { data } = decodeSpell(code);   // 形式不正等はここで例外を投げる
  const raw = {
    schemaVersion: data.v,
    meta: { initialLevel: data.m?.il ?? null, currentLevel: data.m?.cl ?? null,
            feedbackBonusGranted: Boolean(data.m?.fb) },
    userProfile: data.u, fixedCosts: data.f, creditCards: data.cc, quests: data.q,
    selections: data.s, finance: data.fn
  };
  return migrate(raw);                  // 呪文に無い項目（betaFeedback等）は初期値で補完される
}
