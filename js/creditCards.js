// creditCards.js — クレジットカードの初期データベース。
// ★credit_card_logic_definition.md §3 の内容をそのまま転記する（独自解釈で数値・属性を補わない）。
// calc.js と同様、DOM / window / localStorage / fetch には一切触れない純粋データモジュール。

/**
 * @typedef {Object} CreditCard
 * @property {string} id 一意なID
 * @property {string} name カード名
 * @property {number} basePointRate 基本還元率（％）
 * @property {number} annualFee 年会費（円）
 * @property {'standard'|'high_reward'|'specialty'} category
 *   'standard'：基本還元率0.5%前後・特化強みなし（メイン設定時にパターンA発生）
 *   'high_reward'：基本還元率1.0%以上（現状維持でよい）
 *   'specialty'：特典・目的特化（現状維持でよい・条件あり）
 * @property {boolean} [is1M_Challenge] 100万円修行フラグ。年間100万円決済で年会費無料化＋還元率1.5%相当
 * @property {number} [breakEvenAmount] 損益分岐点（円）。年会費の元が取れる、または強力な特典が付与される決済額
 * @property {number} [pointValueMultiplier] 価値乗数。1pt=1円以上の価値がある場合の補正値
 * @property {boolean} [isStatusCard] 聖域フラグ。true の場合、無条件でクエスト判定から除外する
 */

/** @type {CreditCard[]} */
export const CREDIT_CARDS = [
  // 1. 100万円修行カード（決済額に応じて還元率と年会費が変動）
  {
    id: "smcc_gold_nl",
    name: "三井住友カード ゴールド（NL）",
    basePointRate: 0.5,
    annualFee: 5500,
    category: "specialty",
    is1M_Challenge: true,
    breakEvenAmount: 1000000
  },
  {
    id: "epos_gold",
    name: "エポスゴールドカード",
    basePointRate: 0.5,
    annualFee: 5000,
    category: "specialty",
    is1M_Challenge: true,
    breakEvenAmount: 1000000
  },

  // 2. マイル系カード（価値乗数で実質還元率を補正）
  {
    id: "ana_visa_suica",
    name: "ANA VISA Suicaカード",
    basePointRate: 0.5,
    pointValueMultiplier: 2.0, // 実質1.0%とみなす
    annualFee: 2200,
    category: "specialty",
    isStatusCard: false
  },

  // 3. ホテル系カード（特定の決済額で元が取れる）
  {
    id: "hilton_amex",
    name: "ヒルトン・オナーズ アメリカン・エキスプレス・カード",
    basePointRate: 1.0,
    pointValueMultiplier: 1.0,
    annualFee: 16500,
    category: "specialty",
    breakEvenAmount: 1500000 // 無料宿泊特典の条件
  },

  // 4. ステータス・聖域カード（判定から完全に除外）
  {
    id: "ana_sfc_gold",
    name: "ANA SFC ゴールドカード",
    basePointRate: 1.0,
    pointValueMultiplier: 2.0, // マイル還元率等に応じた補正
    annualFee: 16500,
    category: "specialty",
    isStatusCard: true // クエスト対象外
  },

  // 5. 一般・低還元カード（換装対象）
  {
    id: "mufg_viaso",
    name: "三菱UFJカード VIASOカード",
    basePointRate: 0.5,
    pointValueMultiplier: 1.0,
    annualFee: 0,
    category: "standard",
    isStatusCard: false
  },

  // 6. 高還元カード（合格ライン）
  {
    id: "rakuten",
    name: "楽天カード",
    basePointRate: 1.0,
    pointValueMultiplier: 1.0,
    annualFee: 0,
    category: "high_reward",
    isStatusCard: false
  }
];

/**
 * カードIDからカードオブジェクトを引く。
 * @param {string|null|undefined} id
 * @returns {CreditCard|null}
 */
export function findCardById(id){
  if (!id) return null;
  return CREDIT_CARDS.find(c => c.id === id) ?? null;
}

/**
 * 保有率順（初期データベースの記載順をそのまま保有率順として扱う）のカード一覧を返す。
 * メインカードのドロップダウン生成に使う。
 * @returns {CreditCard[]}
 */
export function listCardsByPopularity(){
  return CREDIT_CARDS;
}
