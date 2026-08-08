// ===========================================================================
// 適用年度: 2026年度（令和8年度）
// 更新周期: 年1回（毎年3月・8月に見直すこと）
//
// 本ファイルは docs/SPEC.md §6.2 の転記である。
// 法令数値を推測で埋めてはならない（CLAUDE.md 制約7）。
// 数値の根拠は §12 トレーサビリティ・レジストリの管理番号で辿れるようにしてある。
// ===========================================================================

export const APPLIED_FISCAL_YEAR = '2026';
export const SYSTEM_BASE_DATE    = '2026-08-01';   // UI に「本試算は2026年8月1日時点の制度に基づきます」と表示

// ---------------------------------------------------------------------------
// 6.2.1 標準報酬月額テーブル（健康保険 全50等級）
//   根拠法令: 健康保険法40条（標準報酬月額の等級区分）／§12.1 M-01
//   施行日  : 平成28年4月〜（等級区分）
//   出典    : 協会けんぽ「令和8年度保険料額表（大阪府）」
//             https://www.kyoukaikenpo.or.jp/assets/R8_27osaka.pdf
//   ✅ 全50等級を突合済み（2026-08-05）
//   境界規則: lower <= 報酬月額 < upper（「以上〜未満」）
//   厚生年金は別テーブル（第1級88,000円〜第32級650,000円）。健保等級4 = 厚年等級1
// ---------------------------------------------------------------------------
export const HEALTH_INSURANCE_TABLE = [
  { grade: 1, standard:   58000, lower:       0, upper:   63000 },
  { grade: 2, standard:   68000, lower:   63000, upper:   73000 },
  { grade: 3, standard:   78000, lower:   73000, upper:   83000 },
  { grade: 4, standard:   88000, lower:   83000, upper:   93000 },
  { grade: 5, standard:   98000, lower:   93000, upper:  101000 },
  { grade: 6, standard:  104000, lower:  101000, upper:  107000 },
  { grade: 7, standard:  110000, lower:  107000, upper:  114000 },
  { grade: 8, standard:  118000, lower:  114000, upper:  122000 },
  { grade: 9, standard:  126000, lower:  122000, upper:  130000 },
  { grade:10, standard:  134000, lower:  130000, upper:  138000 },
  { grade:11, standard:  142000, lower:  138000, upper:  146000 },
  { grade:12, standard:  150000, lower:  146000, upper:  155000 },
  { grade:13, standard:  160000, lower:  155000, upper:  165000 },
  { grade:14, standard:  170000, lower:  165000, upper:  175000 },
  { grade:15, standard:  180000, lower:  175000, upper:  185000 },
  { grade:16, standard:  190000, lower:  185000, upper:  195000 },
  { grade:17, standard:  200000, lower:  195000, upper:  210000 },
  { grade:18, standard:  220000, lower:  210000, upper:  230000 },   // ペルソナ中心帯
  { grade:19, standard:  240000, lower:  230000, upper:  250000 },
  { grade:20, standard:  260000, lower:  250000, upper:  270000 },   // 高額療養費 区分エ 上限
  { grade:21, standard:  280000, lower:  270000, upper:  290000 },   // 高額療養費 区分ウ 開始
  { grade:22, standard:  300000, lower:  290000, upper:  310000 },
  { grade:23, standard:  320000, lower:  310000, upper:  330000 },
  { grade:24, standard:  340000, lower:  330000, upper:  350000 },
  { grade:25, standard:  360000, lower:  350000, upper:  370000 },
  { grade:26, standard:  380000, lower:  370000, upper:  395000 },
  { grade:27, standard:  410000, lower:  395000, upper:  425000 },
  { grade:28, standard:  440000, lower:  425000, upper:  455000 },
  { grade:29, standard:  470000, lower:  455000, upper:  485000 },
  { grade:30, standard:  500000, lower:  485000, upper:  515000 },
  { grade:31, standard:  530000, lower:  515000, upper:  545000 },   // 高額療養費 区分イ 開始
  { grade:32, standard:  560000, lower:  545000, upper:  575000 },
  { grade:33, standard:  590000, lower:  575000, upper:  605000 },
  { grade:34, standard:  620000, lower:  605000, upper:  635000 },
  { grade:35, standard:  650000, lower:  635000, upper:  665000 },   // 厚生年金の上限等級（第32級）
  { grade:36, standard:  680000, lower:  665000, upper:  695000 },
  { grade:37, standard:  710000, lower:  695000, upper:  730000 },
  { grade:38, standard:  750000, lower:  730000, upper:  770000 },
  { grade:39, standard:  790000, lower:  770000, upper:  810000 },
  { grade:40, standard:  830000, lower:  810000, upper:  855000 },   // 高額療養費 区分ア 開始
  { grade:41, standard:  880000, lower:  855000, upper:  905000 },
  { grade:42, standard:  930000, lower:  905000, upper:  955000 },
  { grade:43, standard:  980000, lower:  955000, upper: 1005000 },
  { grade:44, standard: 1030000, lower: 1005000, upper: 1055000 },
  { grade:45, standard: 1090000, lower: 1055000, upper: 1115000 },
  { grade:46, standard: 1150000, lower: 1115000, upper: 1175000 },
  { grade:47, standard: 1210000, lower: 1175000, upper: 1235000 },
  { grade:48, standard: 1270000, lower: 1235000, upper: 1295000 },
  { grade:49, standard: 1330000, lower: 1295000, upper: 1355000 },
  { grade:50, standard: 1390000, lower: 1355000, upper: Infinity }
];

// 厚生年金：健保等級から3を引いた値が厚年等級。範囲外はクランプ
//   根拠法令: 厚生年金保険法20条（標準報酬月額）／§12.1 M-02
//   施行日  : 令和2年9月〜（第32級 650,000円の追加）
export const PENSION_GRADE_OFFSET = 3;
export const PENSION_MIN_STANDARD =  88000;   // 厚年 第1級
export const PENSION_MAX_STANDARD = 650000;   // 厚年 第32級

// ---------------------------------------------------------------------------
// 6.2.2 社会保険料率（令和8年度・大阪府）
//   根拠法令: 健康保険法160条（保険料率）／介護保険法／厚生年金保険法81条
//             §12.1 M-03・M-05、§12.2 P-01
//   施行日  : 令和8年3月分（4月納付分）〜
//   ★2026年4月から「子ども・子育て支援金」0.23% が新設され健康保険料に上乗せされる
//   ★保険料率は労使折半。本人負担は下記の 1/2
// ---------------------------------------------------------------------------
// 出典: 協会けんぽ大阪支部「令和8年3月分（4月納付分）からの保険料額表」
//       https://www.kyoukaikenpo.or.jp/assets/R8_27osaka.pdf
// ★適用開始月にズレがある。健保・介護・厚年は「3月分（4月納付分）」から、
//   子ども・子育て支援金だけは「4月分（5月納付分）」から適用される
export const INSURANCE_RATES = [
  {
    effectiveFrom: '2026-03-01',
    prefecture: 'osaka',
    healthTotal:            0.1013,   // 健康保険料率（大阪支部・令和8年度）
    nursingCareTotal:       0.0162,   // 介護保険料率（全国一律・40〜64歳のみ）
    pensionTotal:           0.183,    // 厚生年金保険料率（平成29年9月〜固定）
    employeeShare:          0.5       // 労使折半（健保・介護・厚年のみ）
  }
];

// 子ども・子育て支援金率（子ども・子育て支援法・2026年新設）
//   根拠法令: 子ども・子育て支援法／§12.1 M-04
//   施行日  : 令和8年4月分（5月納付分）〜
// ★健保とは適用開始月が1ヶ月ずれるため別テーブルにする
export const CHILDCARE_SUPPORT_RATES = [
  { effectiveFrom: '2026-04-01', rate: 0.0023 }   // 4月分（5月納付分）から
];

// 雇用保険料率（労働者負担分・一般の事業）
//   根拠法令: 雇用保険法／§12.2 P-02
//   施行日  : 令和8年4月1日以降に支払われる給与から
// 出典: 厚生労働省「令和8年度の雇用保険料率について」
//       https://www.mhlw.go.jp/content/001692566.pdf
// ★労使折半ではない（令和8年度の事業主負担は 8.5/1000）
// ★「給与の締日」ではなく「支払日」を基準に適用料率を判定する
export const EMPLOYMENT_INSURANCE_RATES = [
  { effectiveFrom: '2025-04-01', employee: 0.0055 },   // 令和7年度 5.5/1000
  { effectiveFrom: '2026-04-01', employee: 0.0050 }    // 令和8年度 5.0/1000（引き下げ）
];

// 根拠法令: 介護保険法9条（第2号被保険者は40歳以上64歳以下）／§12.2 P-03
export const NURSING_CARE_MIN_AGE = 40;   // 介護保険第2号被保険者は40歳から

// ---------------------------------------------------------------------------
// 6.2.3 高額療養費 自己負担限度額（70歳未満）
//   根拠法令: 健康保険法115条（高額療養費）／§12.1 M-06〜M-09
//   施行日  : 令和8年8月診療分〜（年間上限は同日新設。多数回該当は据え置き）
//   判定は「標準報酬月額」で行う。区分は必ず自動判定し決め打ちしない
//   ✅ 区分ア・年間上限とも厚生労働省資料で確定済み（2026-08-05）
// ---------------------------------------------------------------------------
// 出典: 厚生労働省 保険局「高額療養費制度の見直しのポイント」
//       https://www.mhlw.go.jp/content/001726232.pdf
// ★年間上限の算定期間は暦年でも年度でもなく「8月1日〜翌年7月31日」のローリング12ヶ月
export const HIGH_MEDICAL_LIMITS = [
  { id:'a', minStandardMonthly:830000, base:270300, deductionBase:901000, rate:0.01,
    multiple:140100, annualCap:1680000 },
  { id:'b', minStandardMonthly:530000, base:179100, deductionBase:597000, rate:0.01,
    multiple: 93000, annualCap:1110000 },
  { id:'c', minStandardMonthly:280000, base: 85800, deductionBase:286000, rate:0.01,
    multiple: 44400, annualCap: 530000 },
  { id:'d', minStandardMonthly:     0, base: 61500, deductionBase:null,   rate:0,
    multiple: 44400, annualCap: 530000 },
  { id:'e', minStandardMonthly:  null, base: 36900, deductionBase:null,   rate:0,
    multiple: 24600, annualCap: 290000, taxExemptOnly:true }
];

// 年間上限の算定期間の起算月（8月）
export const HIGH_MEDICAL_ANNUAL_START_MONTH = 8;

export const HIGH_MEDICAL_EXCLUSIONS =
  '差額ベッド代・入院中の食事療養費・先進医療の技術料・自由診療は上限の対象外です。';

// ---------------------------------------------------------------------------
// 6.2.4 傷病手当金
//   根拠法令: 健康保険法99条（傷病手当金）／§12.1 M-11〜M-15
//   施行日  : 平均標準報酬月額32万円は令和7年4月1日以降の支給開始日から
//             （それ以前は30万円）。通算1年6ヶ月は令和4年1月1日から
//   12ヶ月未満は「個人平均」と「保険者の平均額」の"低い方"を採用（上限ではない）
// ---------------------------------------------------------------------------
export const SICKPAY_AVG_STD_MONTHLY = [
  { effectiveFrom: '2019-04-01', amount: 300000 },
  { effectiveFrom: '2025-04-01', amount: 320000 }   // 支給開始日が令和7年4月1日以降（協会けんぽ）
];
export const SICKPAY_WAITING_DAYS   = 3;    // 連続3日の待期。支給は4日目から
export const SICKPAY_MAX_MONTHS     = 18;   // 通算1年6ヶ月（令和4年1月1日から通算化）
export const SICKPAY_NOTE =
  '受給中も健康保険料・厚生年金保険料は免除されません。住民税も前年所得に基づき課税されます。';

// ---------------------------------------------------------------------------
// 6.2.5 所得税・住民税
//   根拠法令: 所得税法28条（給与所得控除）／86条＋租税特別措置法（基礎控除）／
//             89条（税率）／地方税法（住民税）／復興財源確保法（復興特別所得税）／
//             森林環境税法／§12.3 T-01〜T-09
//   施行日  : 令和8年分〜（基礎控除の特例は令和8・9年分）。
//             復興特別所得税は平成25年〜令和19年。均等割＋森林環境税は令和6年度〜
//   ✅ 令和8年分の給与所得控除・基礎控除は財務省大綱／国税庁資料で確定済み（2026-08-05）
//   ★社会人1年目は住民税ゼロ（前年所得なし）
// ---------------------------------------------------------------------------
// 出典: 財務省「令和8年度税制改正の大綱」／国税庁「令和8年度税制改正による
//       所得税の基礎控除の引上げ等について」 https://www.nta.go.jp/publication/pamph/gensen/2026kaisei.pdf
//
// 🔴 実装上の最重要注意（§6.3a を必ず読むこと）
//    令和8年中の「月次源泉徴収」は旧ルール（令和7年分の税額表）で行われ、
//    新しい控除額は令和8年12月の年末調整で初めて精算される。
//    本アプリは年税額ベースで試算するため、実際の毎月の給与明細とは一致しない。
//
// 🔴 所得税と住民税で基礎控除が大きく異なる（住民税は43万円に据え置き）。
//    「所得税は0円だが住民税は課税される」状態が発生するため、必ず別テーブルで計算する。
export const TAX_CONSTANTS = [
  {
    appliedYear: 2026,                        // 令和8年分

    // 給与所得控除（令和8年分〜。最低保障額は本則69万＋特例5万＝74万円）
    salaryDeductionTable: [
      { maxIncome:  1900000, fixed: 740000                      },
      { maxIncome:  3600000, rate: 0.30, add:   80000           },
      { maxIncome:  6600000, rate: 0.20, add:  440000           },
      { maxIncome:  8500000, rate: 0.10, add: 1100000           },
      { maxIncome: Infinity, fixed:1950000                      }   // 上限
    ],

    // 所得税の基礎控除（令和8・9年分の特例適用後）
    basicDeductionTable: [
      { maxTotalIncome:  4890000, amount:1040000 },   // 本則62万＋特例42万
      { maxTotalIncome:  6550000, amount: 670000 },   // 本則62万＋特例 5万
      { maxTotalIncome: 23500000, amount: 620000 },   // 本則62万
      { maxTotalIncome: 24000000, amount: 480000 },
      { maxTotalIncome: 24500000, amount: 320000 },
      { maxTotalIncome: 25000000, amount: 160000 },
      { maxTotalIncome: Infinity, amount:      0 }
    ],

    // 住民税の基礎控除（★令和8年度も据え置き。所得税とは別物）
    residentBasicDeductionTable: [
      { maxTotalIncome: 23500000, amount: 430000 },
      { maxTotalIncome: 24000000, amount: 290000 },
      { maxTotalIncome: 24500000, amount: 150000 },
      { maxTotalIncome: Infinity, amount:      0 }
    ],

    incomeTaxBrackets: [                      // 所得税の速算表
      { max:  1950000, rate:0.05, deduction:      0 },
      { max:  3300000, rate:0.10, deduction:  97500 },
      { max:  6950000, rate:0.20, deduction: 427500 },
      { max:  9000000, rate:0.23, deduction: 636000 },
      { max: 18000000, rate:0.33, deduction:1536000 },
      { max: 40000000, rate:0.40, deduction:2796000 },
      { max: Infinity, rate:0.45, deduction:4796000 }
    ],
    reconstructionSurtaxRate: 0.021,          // 復興特別所得税 2.1%
    residentTaxRate: 0.10,                    // 住民税 所得割（市町村6% + 道府県4%）
    residentTaxPerCapita: 5000,               // 均等割4,000円＋森林環境税1,000円
    residentTaxNonTaxableTotalIncome: 450000  // 単身者の住民税非課税ライン（合計所得）
  }
];

// 根拠法令: 地方税法（住民税は前年所得課税）／§12.3 T-08
export const RESIDENT_TAX_EXEMPT_YEARS = 1;   // 勤続1年目は住民税ゼロ

// ---------------------------------------------------------------------------
// 6.2.6 レベル・称号
//   ★法令ではなくプロダクト設計上の定義。
//   ★Phase1〜4改修（2026-08-07）：旧レベル方式（LEVEL_UNIT/LEVEL_MIN/LEVEL_MAX/RANK_TABLE/
//     IMMEDIATE）は廃止し、INITIAL_LEVEL_DIVISOR/INITIAL_LEVEL_BASE/RANK_TABLE_V2に置き換えた
//     （本ファイル末尾のPhase1〜4改修セクション参照）。
// ---------------------------------------------------------------------------
export const BONUS_LEVEL_MAX = 1;   // フィードバック送信ボーナス（生涯1回・+1Lv）。新方式でも継続使用

export const HIGH_COST = ['rent'];   // 引っ越し初期費用が高いため参考枠のみ
export const MOVING_COST_MONTHS = 5; // 初期費用の目安（家賃の5ヶ月分）※回収年数の算出に使用

// ---------------------------------------------------------------------------
// 6.2.8 黄金比（手取りに対する割合の目安）
//   ★法令ではなく §3.2／§3.7a に基づくプロダクト設計上の目安
//   ★medicalInsurance は「適正水準」ではなく「これ以上は明確に払いすぎ」の赤ライン
// ---------------------------------------------------------------------------
export const GOLDEN_RATIO = {
  rent:              { ratio:0.30, label:'上限目安', type:'guideline' },
  smartphone:        { ratio:0.03, label:'上限目安', type:'guideline' },
  medicalInsurance:  { ratio:0.03, label:'⚠ 赤ライン', type:'red_line',
                       note:'公的保障（高額療養費・傷病手当金）で多くがカバーされます。'
                          + '推奨は「緊急予備資金の確保を優先」であり、3%は適正水準ではありません。' }
};

// ---------------------------------------------------------------------------
// 6.2.9 市場平均・単価
// ---------------------------------------------------------------------------
// 出典: 全国賃貸管理ビジネス協会「全国家賃動向」（2025年2〜10月度） https://www.pbn.jp/yachin/
//       §12.6 K-01。法令ではなく市場データのため、四半期〜年次で見直すこと
// ★単身向け（1R/1K/1DK等）の平均賃料。ファミリー物件を含まない
export const MARKET_AVERAGE_RENT = {
  tokyo:    76000,   // 東京都
  osaka:    59000,   // 大阪府
  urban:    52000,   // 地方主要都市（愛知・福岡等）
  other:    42800,   // その他地域
  nation:   53000,   // 全国平均（参考表示用）
  _default: 'urban'
};

// 月極駐車場代の地域別相場目安（一般的な市場水準。法令ではなく、家賃と同じエリア区分に揃えた目安値）
// ★ユーザーテストフィードバック改修（2026-08-07）：エリア連動の目安バー表示のために追加
export const MARKET_AVERAGE_PARKING = {
  tokyo:    35000,   // 東京都（都心部は月3〜5万円台が一般的）
  osaka:    18000,   // 大阪府
  urban:    10000,   // 地方主要都市
  other:     6000,   // その他地域
  nation:    8000,   // 全国平均（参考表示用）
  _default: 'urban'
};

// 出典: 総務省統計局「家計調査（家計収支編）」2024年平均・単身世帯の移動電話通信料
//       https://www.stat.go.jp/data/kakei/sokuhou/tsuki/pdf/fies_gaikyo2024.pdf
//       §12.6 K-02
// ★「電気通信サービスに係る内外価格差調査」を根拠に使わないこと（§12.6 参照）
export const MARKET_AVERAGE_SMARTPHONE = {
  monthly: 6379,
  source: '総務省統計局「家計調査（家計収支編）」単身世帯・移動電話通信料',
  sourceUrl: 'https://www.stat.go.jp/data/kakei/sokuhou/tsuki/pdf/fies_gaikyo2024.pdf',
  asOf: '2024年平均',
  // ★平均値は「大手キャリア継続層」と「オンライン専用プラン・MVNO層」が混在した数値。
  //   平均以下の人にも改善余地を示すため、最適化水準を2段目のしきい値として持つ
  optimizedMax: 3999        // オンライン専用プラン・MVNO の一般的な上限水準（月2,000〜3,000円台）
};

/**
 * 通信費の判定。★平均以下でも「さらに下げられる余地」を提示する2段階判定。
 * @param {number} monthly 現在の月額
 * @returns {{level:'over_average'|'improvable'|'optimized', gapToAverage:number, gapToOptimized:number}}
 */
export function judgeSmartphoneCost(monthly){
  const m = Math.max(0, Number(monthly) || 0);
  const avg = MARKET_AVERAGE_SMARTPHONE.monthly;
  const opt = MARKET_AVERAGE_SMARTPHONE.optimizedMax;
  return {
    level: m > avg ? 'over_average' : (m > opt ? 'improvable' : 'optimized'),
    gapToAverage:   Math.max(0, m - avg),
    gapToOptimized: Math.max(0, m - opt)
  };
}

// 賃貸の火災保険（家財保険）
// 出典: 各少額短期保険業者の標準提供相場／日本損害保険協会（2024〜2026年）／§12.6 K-03
// ★不動産会社経由の大手損保プランと、ネット型少額短期保険で約2倍の開きがある
export const FIRE_INSURANCE = {
  agencyTwoYear:  { min:15000, max:20000 },   // 不動産会社経由（大手損保）2年契約
  onlineTwoYear:  { min: 8000, max:12000 },   // ネット型少額短期保険 2年契約
  // 「わからない」時の補完値。2年20,000円の目安値÷24（運用判断により833円に統一。2026-08-06）
  assistMonthly:  833,
  reviewThreshold:15000                       // 2年でこの額を超える場合に見直しを案内する
};
export const FIRE_INSURANCE_ASSIST_MONTHLY = FIRE_INSURANCE.assistMonthly;

// 銀行手数料
// 出典: みずほ銀行・三菱UFJ銀行・三井住友銀行 各行の手数料表（2026年基準）／§12.6 K-04
// ★ATMは平日日中は原則無料。時間外・土日祝のみ課金される
// ★他行宛のネット振込はメガバンクで差がある（みずほ一律110円／MUFG・SMBCは金額別）
export const BANK_FEE = {
  atm: 110,                 // ATM 時間外・土日祝（110〜220円のうち下限を採用）
  atmMax: 220,
  // ★220円で固定する（決定事項）。家賃等の3万円以上の振込が中心と想定されるため、
  //   金額別に聞き分けず入力負荷を抑える。みずほは一律110円のため差が出る点は注記で補う
  transfer: 220,            // 他行宛ネット振込（三菱UFJ・三井住友の3万円以上）
  transferCounter: 990,     // 窓口・現金での他行宛振込（参考表示用）
  note: '平日日中のATM利用は原則無料です。時間外・土日祝の利用回数を入力してください。'
};

// クレジットカードの基準還元率（％単位）
// 出典: §12.6 K-05「高還元カードの一般的水準」。法令ではなく市場水準
// ★§6.2 のコードブロックには記載がないが、§12.6 K-05 で config.js キーとして
//   確定値 1.0% が定義されており、§6.3 calcCreditCardLoss と TEST-53 が参照する。
// ★単位はパーセント（1.0 = 1.0%）。小数（0.01）にしないこと（§15.1 C-06）
export const CARD_TARGET_RATE_PERCENT = 1.0;

// 根拠: §6.2.9。法令ではなくプロダクト設計上の仮定値
export const NEGLECT_YEARS = 10;
// 出典: §12.6 K-06。年5%は仮定値であり運用成果を保証しない
export const NISA_ANNUAL_RETURN = 0.05;
// 根拠法令: 金融商品取引法2条8項11号（投資助言の定義）／§12.4 L-04
export const NISA_DISCLAIMER =
  '過去の市場平均に基づく仮定値であり、将来の運用成果を保証するものではありません。';

// ---------------------------------------------------------------------------
// 6.2.10 通信・永続化
//   ★ENDPOINT は同一オリジンのプロキシ。Web3Forms の access_key を
//     このファイルに書いてはならない（CLAUDE.md 制約1）
// ---------------------------------------------------------------------------
export const ENDPOINT   = '/api/feedback';   // ★同一オリジンのプロキシ。Web3Forms を直接叩かない
export const SITE_URL   = 'https://tedori-quest.com';   // ★独自ドメイン取得・Cloudflareへの紐づけ完了済み（2026-08-08）。
                                                          //   Xシェア・共有リンク（呪文URL）はすべてこの値を経由する
export const STORAGE_KEY = 'tq_state_v1';
export const RATE_LIMIT = { maxPerDay:3, cooldownMs:10000, windowMs:86400000 };
export const FETCH_TIMEOUT_MS = 10000;
export const COMMENT_MAX_LENGTH = 1000;

// ---------------------------------------------------------------------------
// 6.2.11 クエストカタログ
//   根拠法令: 保険業法275条（保険募集の定義）／§12.4 L-02。
//             断定的な解約勧奨表現を禁止するため、talkScript は「解約させる台本」
//             ではなく「手続きを円滑に進める確認事項リスト」として書く（§3.7a）
//   ★文言をHTML/JSに直書きしないこと。表現の修正が1箇所で済む状態を保つ
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Quest
 * @property {string}   id           todoStatus のキーと一致させること
 * @property {string}   questTitle   RPG演出用のタイトル（画面表示用）
 * @property {string}   plainTitle   中立表記。★シェア文面・aria-label・印刷版で使用する
 * @property {string}   summary      「要するに」の1行要約
 * @property {string}   description  説明文（演出込み）
 * @property {string}   actionLabel  アクションボタンの文言
 * @property {string}   completeLabel 完了ボタンの文言
 * @property {string}   clearMessage クリア時のトースト文言
 * @property {string}   target       fixedCosts のキー（IMMEDIATE のいずれか）。NISAは null
 * @property {string}   basis        なぜ見直せるかの根拠。数値と時点を含めること
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {string[]} talkScript   問い合わせ時の確認事項リスト
 * @property {string}   disclaimer   個別事情により最適解が異なる旨
 */

/**
 * ★演出タイトル（questTitle）と中立表記（plainTitle）を必ず両方持つこと。
 *   §3.7a の「動詞は検討する・確認するを基本形とする」原則は plainTitle 側で担保し、
 *   questTitle は画面上の演出に限定する。
 *   Xシェア文面・スクリーンリーダー・印刷版では plainTitle を使用する。
 * @type {Quest[]}
 */
export const QUEST_CATALOG = [
  {
    id: 'changeFireInsurance',
    questTitle:  '【魔導障壁の最適化】過剰な火災保険を解呪せよ！',
    plainTitle:  '火災保険（借家人賠償）の内容を確認する',
    summary:     'ネット型火災保険への切り替え・相場比較',
    description: '指定されるがまま入った火災保険は、実は必要以上の高額装備かも？'
               + '同等の防御力を持つネット型保険（2年で約8,000円〜）へ変更できるか確認し、'
               + '年数千円のゴールドを守り抜こう！',
    actionLabel:   '⚔️ 契約内容を確認する',
    completeLabel: '🎉 ネット型保険に変えた！',
    clearMessage:  '🛡️ 装備変更完了！『格安の魔法シールド』を装着した！',
    target: 'fireInsurance',
    difficulty: 'medium',
    basis: '賃貸契約時に不動産会社を通じて加入する火災保険は、2年で'
         + `${FIRE_INSURANCE.agencyTwoYear.min.toLocaleString('ja-JP')}〜`
         + `${FIRE_INSURANCE.agencyTwoYear.max.toLocaleString('ja-JP')}円が一般的です。`
         + 'ネット型の少額短期保険では2年で'
         + `${FIRE_INSURANCE.onlineTwoYear.min.toLocaleString('ja-JP')}〜`
         + `${FIRE_INSURANCE.onlineTwoYear.max.toLocaleString('ja-JP')}円という水準もあります。`
         + '賃貸借契約書の多くは「加入義務」を定めるものであり、'
         + '「保険会社の指定」までは求めていない場合があります。',
    talkScript: [
      '賃貸借契約書に保険会社の指定条項があるか（加入義務と会社指定は別です）',
      '大家・管理会社が求める借家人賠償責任の補償額はいくらか',
      '個人賠償責任特約が、自動車保険やクレジットカードの付帯保険と重複していないか',
      '現在の契約の満期日と、中途解約した場合の返戻金の有無',
      '家財の補償額が実態に見合っているか（単身世帯では過大な場合があります）'
    ],
    disclaimer: '賃貸契約上、加入が条件となっている場合があります。'
              + '切り替える場合も無保険期間が生じないようご注意ください。'
  },

  {
    id: 'changeSim',
    questTitle:  '【通信の呪縛を解除】ギガ浪費の幻術を打ち破れ！',
    plainTitle:  '格安SIM・オンライン専用プランを検討する',
    summary:     '格安SIM・セット割プランへの変更',
    description: '通信コストの呪縛を解放！単身世帯の平均は月6,379円だが、'
               + 'オンライン専用プランやMVNOで月2,000〜3,000円台に抑えている冒険者もいる。'
               + '自分の使用データ量に合ったプランへの乗り換え余地を調査し、'
               + '月々の手取りゲージを回復させよう！',
    actionLabel:   '⚔️ プラン比較を開始する',
    completeLabel: '🎉 格安SIMに乗り換えた！',
    clearMessage:  '⚡ ジョブチェンジ完了！『軽量化の俊足ブーツ』を手に入れた！',
    target: 'smartphone',
    difficulty: 'easy',
    basis: '総務省「家計調査」によると、単身世帯の移動電話通信料の月平均は'
         + `${MARKET_AVERAGE_SMARTPHONE.monthly.toLocaleString('ja-JP')}円です`
         + `（${MARKET_AVERAGE_SMARTPHONE.asOf}）。`
         + 'ただしこの平均値には、大手キャリアのプランを利用している層と、'
         + 'オンライン専用プランやMVNOで月2,000〜3,000円台に抑えている層の両方が含まれています。'
         + '平均を下回っている場合でも、データ使用量によっては選択肢が残っていることがあります。',
    talkScript: [
      '契約期間の縛りと、解約時の違約金の有無',
      '端末の分割残債。乗り換え後も支払いが続くか',
      '家族割・光回線セット割が外れた場合、他の回線の料金がいくら上がるか',
      '直近3ヶ月の月間データ使用量（マイページで確認できます）',
      'MNP予約番号の有効期限（一般に発行から15日間）',
      'キャリアメールを使い続ける場合の持ち運びサービスの料金'
    ],
    disclaimer: '通信品質・家族割・端末の残債状況により最適解は異なります。'
  },

  {
    id: 'cancelMedicalInsurance',
    questTitle:  '【真の聖なるバリア】公的保障のチカラを見極めよ！',
    plainTitle:  '医療保険と公的保障の重複を確認する',
    summary:     '公的保障（高額療養費等）の確認と保障内容の点検',
    description: '日本には「高額療養費」や「傷病手当金」という強力な公的バリアが最初から備わっている！'
               + '民間の医療保険や共済に重複した特約がないか点検し、手取りの攻撃力を最適化しよう！'
               + '（※公的保障は医療費や収入低下を補うものですが、'
               + '差額ベッド代・食事療養費・先進医療の技術料は対象外です）',
    actionLabel:   '⚔️ 保障内容を点検する',
    completeLabel: '🎉 医療保険を見直した！',
    clearMessage:  '✨ 魔法詠唱完了！『公的保障の聖なるバリア』を発動した！',
    target: 'medicalInsurance',
    difficulty: 'medium',
    basis: '高額療養費制度により、標準報酬月額28万〜50万円の方（区分ウ）は、'
         + '医療費が100万円かかった場合でも自己負担の上限は約92,940円です（2026年8月診療分から）。'
         + 'また傷病手当金により、療養で働けない期間は標準報酬月額の約3分の2が'
         + '通算1年6ヶ月まで支給されます。'
         + 'これらの公的保障でカバーされる範囲を把握したうえでご判断ください。',
    talkScript: [
      '解約返戻金の有無と金額',
      '契約から何年経過しているか（短期解約控除の対象となる場合があります）',
      '同等の保障に再加入する場合の保険料（年齢とともに上がります）',
      '払済保険への変更や、保障額の減額が可能か',
      '先進医療特約だけを残せるか',
      '直近の健康状態や通院歴（再加入できない可能性があります）',
      '差額ベッド代・食事療養費は高額療養費の対象外であることを理解しているか',
      '医療費の一時的な立替えに耐えられる預貯金（生活費の3〜6ヶ月分）があるか'
    ],
    disclaimer: '健康状態により再加入できない場合があります。'
              + '公的保障（高額療養費・傷病手当金）の内容を確認したうえでご判断ください。'
  },

  {
    id: 'consolidateCard',
    questTitle:  '【リボ払いの呪い浄化】高還元カードへ錬金せよ！',
    plainTitle:  'クレジットカードの還元率と年会費を確認する',
    summary:     'リボ払いの確認・使っていないカードの整理・メインカード集約',
    description: '知らずに損しがちなリボ払い（手数料は年15%前後になることが多い呪い）や、'
               + '使っていない年会費有料カードを浄化！'
               + `還元率${CARD_TARGET_RATE_PERCENT}%以上のカードに集約し、`
               + '日常の買い物を効率的なゴールド錬金に変えよう！',
    actionLabel:   '⚔️ 利用明細を点検する',
    completeLabel: '🎉 カードを整理した！',
    clearMessage:  '🪙 錬金成功！『高還元率の黄金カード』をメイン装備にした！',
    target: 'cardReward',
    difficulty: 'easy',
    basis: `年間150万円の利用で還元率が0.5%の場合、還元率${CARD_TARGET_RATE_PERCENT}%のカードとの差額は`
         + '年間7,500円になります。'
         + 'これに使っていないカードの年会費が加わると、差はさらに広がります。'
         + 'なおリボ払いは手数料が年15%前後になることが多く、還元率の差より影響が大きくなります。',
    talkScript: [
      'リボ払い（自動リボ設定を含む）になっていないか ※最優先で確認してください',
      '年会費と、その無料条件（年1回の利用など）',
      '貯まっているポイントの有効期限と、使い道があるか',
      '公共料金・サブスクの引落先に指定していないか',
      '解約する場合、ポイントを使い切ってから手続きしているか',
      '長く保有しているカードを解約すると信用情報に影響する可能性があること'
    ],
    disclaimer: '年会費・付帯保険・ポイントの使い道により総合的な優劣は変わります。'
  },

  // ★ゲーミフィケーション改修（2026-08-08）：旧「cancelSubscription」（サブスク合計額－理想値の
  //   単調なギャップ判定で発生する単一クエスト）は廃止した。代わりに §6.2.12a の
  //   SUBSCRIPTION_QUEST_TEXT（重複の呪縛／幽霊ギルドの退会／スマホの深淵の3クエスト）に置き換える。

  {
    id: 'changeBank',
    questTitle:  '【手数料毒の無効化】ゼロフリーバンクを開放せよ！',
    plainTitle:  '銀行の手数料無料条件を確認する',
    summary:     'ATM・他行振込手数料が無料になる銀行への切り替え',
    description: '時間外ATM利用や他行振込で毎月払っている手数料は、手取りを蝕む毒ダメージ！'
               + '残高や給与振込の条件に応じて一定回数まで手数料が無料になる銀行へ'
               + '給与・引き落とし口座を紐付け、無駄な出費を抑えよう！',
    actionLabel:   '⚔️ 手数料発生状況を見る',
    completeLabel: '🎉 手数料無料の銀行に切り替えた！',
    clearMessage:  '🏦 エリア解放！『手数料完全無効の安全地帯』に到達した！',
    target: 'bankFee',
    difficulty: 'easy',
    basis: `時間外・土日祝のATM利用が1回${BANK_FEE.atm}〜${BANK_FEE.atmMax}円、`
         + `他行宛のネット振込が1回${BANK_FEE.transfer}円の場合、`
         + '月にATM3回・振込2回で月額770円、年間では9,240円になります。'
         + '多くのネット銀行は、残高や給与振込の有無に応じて一定回数まで無料としています。'
         + 'なおメガバンクでも他行宛のネット振込が一律110円の銀行があります。',
    talkScript: [
      '勤務先に給与振込口座の金融機関指定があるか',
      '現在利用中の銀行の無料回数と、その条件（ステージ制の判定基準）',
      '家賃・クレジットカード・公共料金の引落口座を変更する手続きの手間',
      '移行先の無料回数の条件（残高いくら以上か、給与振込が必要か）',
      'ATMの利用時間帯による手数料の差（平日日中は原則無料の銀行が多い）'
    ],
    disclaimer: '給与振込口座の指定がある場合は勤務先の規定をご確認ください。'
  },

  {
    id: 'startNisa',
    questTitle:  '【未来の金貨を育てる魔法】NISAの宝箱を解放せよ！',
    plainTitle:  'NISA口座の開設を検討する',
    summary:     '見直しで生まれた資金の置き場としてNISAを検討する',
    description: '固定費の見直しで回収した手取りゴールドの置き場として、'
               + '運用益が非課税になる「NISA」という宝箱がある！'
               + '制度の内容と準備手順を確認しよう。'
               + '（※まずは生活防衛資金の確保が最優先。元本は保証されず、'
               + '損失が出る可能性もあります）',
    actionLabel:   '⚔️ 制度と準備手順を見る',
    completeLabel: '🎉 NISA口座を確認した！',
    clearMessage:  '🌱 確認完了！『未来の金貨を育てる知識』を手に入れた！',
    target: null,                  // ★支出削減ではないためレベル算入対象外
    difficulty: 'medium',
    basis: '通常、投資で得た利益には20.315%が課税されますが、'
         + 'NISA口座での運用益は非課税となります（2026年8月時点）。'
         + 'ただし元本は保証されず、損失が出た場合に他の口座の利益と'
         + '損益通算することもできません。',
    talkScript: [
      '生活防衛資金（生活費の3〜6ヶ月分）を預貯金で確保できているか ※最優先',
      '既にNISA口座を持っていないか（1人1口座のため重複開設はできません）',
      '勤務先に金融機関等の届出義務がないか（金融機関等にお勤めの場合）',
      '毎月の積立額が家計を圧迫しない範囲か',
      '当面使う予定のない資金かどうか',
      '元本保証ではないことを理解しているか'
    ],
    disclaimer: NISA_DISCLAIMER
  }
];

// ---------------------------------------------------------------------------
// 6.2.12 サブスクリプション・プラン定義
//   ★階層式UI（カテゴリ → サービス → プラン）のデータ源
//   ★fixedCosts.subscriptions は選択結果から自動算出する。直接入力させない
//   ★出典: 国内主要サブスクリプション価格調査（2026年8月時点）。法令ではない
//   ★更新周期: 四半期ごと（§14 の年次カレンダー参照）
//   ★更新時は既存行を書き換えず、新しい effectiveFrom を prices[] に追加する
//     （§12.6 更新手順。過去日付での再現性を保つため）
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} PlanPrice
 * @property {string} effectiveFrom 適用開始日（YYYY-MM-DD）
 * @property {number} monthly       月額（円・税込）
 */

/**
 * @typedef {Object} SubscriptionPlan
 * @property {string}  id        `サービス略称_プラン名` 形式（例: 'netflix_standard'）
 * @property {string}  label     UI表示名
 * @property {number}  [monthly] 月額（円・税込）。価格改定予定がある場合は prices を使う
 * @property {PlanPrice[]} [prices] 施行日付きの価格履歴。monthly より優先される
 * @property {number}  [annual]  年額のみのプランで使用。月額換算して扱う
 * @property {'single'|'family'|'student'} audience 対象。既定UIは single のみ表示
 * @property {string}  [note]    備考
 */

/** @type {{id:string, label:string, services:{id:string,name:string,plans:SubscriptionPlan[]}[]}[]} */
export const SUBSCRIPTION_PLANS = [
  { id:'video', label:'動画配信', services:[
    { id:'netflix', name:'Netflix', plans:[
      { id:'netflix_ad',       label:'広告つきスタンダード', monthly: 890, audience:'single' },
      { id:'netflix_standard', label:'スタンダード',         monthly:1590, audience:'single' },
      { id:'netflix_premium',  label:'プレミアム',           monthly:2290, audience:'single' }
    ]},
    { id:'primevideo', name:'Amazon Prime Video', plans:[
      { id:'primevideo_general', label:'一般（プライム会員）', monthly:600, audience:'single',
        note:'プライム会費に内包。広告なし視聴は別途月額390円' },
      { id:'primevideo_student', label:'Prime Student',       monthly:300, audience:'student' }
    ]},
    { id:'unext', name:'U-NEXT', plans:[
      { id:'unext_monthly', label:'月額プラン', monthly:2189, audience:'single',
        note:'毎月1,200ポイント付与。アプリ決済は2,400円' }
    ]},
    { id:'disney', name:'Disney+', plans:[
      { id:'disney_standard', label:'スタンダード', monthly:1250, audience:'single' },
      { id:'disney_premium',  label:'プレミアム',   monthly:1670, audience:'single' }
    ]},
    { id:'hulu', name:'Hulu', plans:[
      { id:'hulu_single', label:'単体プラン', audience:'single',
        // ★2026年10月1日から値上げ。施行日で自動切替する
        prices:[ { effectiveFrom:'2020-01-01', monthly:1026 },
                 { effectiveFrom:'2026-10-01', monthly:1320 } ] },
      { id:'hulu_disney_standard', label:'Hulu | Disney+ スタンダード', monthly:1890, audience:'single' },
      { id:'hulu_disney_premium',  label:'Hulu | Disney+ プレミアム',   monthly:2150, audience:'single' }
    ]},
    { id:'abema', name:'ABEMA', plans:[
      { id:'abema_ad',      label:'広告つきABEMAプレミアム', monthly: 680, audience:'single' },
      { id:'abema_premium', label:'ABEMAプレミアム',         monthly:1180, audience:'single' }
    ]},
    { id:'ytpremium', name:'YouTube Premium', plans:[
      { id:'ytpremium_lite',     label:'Premium Lite', monthly: 780, audience:'single',
        note:'広告なし動画視聴のみ。YouTube Music特典なし' },
      { id:'ytpremium_personal', label:'個人',         monthly:1280, audience:'single' },
      { id:'ytpremium_student',  label:'学生',         monthly: 780, audience:'student' },
      { id:'ytpremium_family',   label:'ファミリー',   monthly:2280, audience:'family'  }
    ]}
  ]},

  { id:'music', label:'音楽配信', services:[
    { id:'spotify', name:'Spotify', plans:[
      { id:'spotify_standard', label:'Standard', monthly:1080, audience:'single' },
      { id:'spotify_student',  label:'Student',  monthly: 580, audience:'student' },
      { id:'spotify_duo',      label:'Duo（2名）', monthly:1480, audience:'family' },
      { id:'spotify_family',   label:'Family',   monthly:1880, audience:'family'  }
    ]},
    { id:'applemusic', name:'Apple Music', plans:[
      { id:'applemusic_personal', label:'個人',       monthly:1180, audience:'single' },
      { id:'applemusic_student',  label:'学生',       monthly: 680, audience:'student' },
      { id:'applemusic_family',   label:'ファミリー', monthly:1980, audience:'family'  }
    ]},
    { id:'amazonmusic', name:'Amazon Music Unlimited', plans:[
      { id:'amazonmusic_prime',    label:'個人（プライム会員）',   monthly:1080, audience:'single' },
      { id:'amazonmusic_nonprime', label:'個人（非プライム会員）', monthly:1180, audience:'single' },
      { id:'amazonmusic_echo',     label:'Echo（ワンデバイス）',   monthly: 680, audience:'single' },
      { id:'amazonmusic_student',  label:'学生',                   monthly: 580, audience:'student' },
      { id:'amazonmusic_family',   label:'ファミリー',             monthly:1980, audience:'family'  }
    ]},
    { id:'linemusic', name:'LINE MUSIC', plans:[
      { id:'linemusic_general', label:'一般',       monthly: 980, audience:'single' },
      { id:'linemusic_student', label:'学生',       monthly: 480, audience:'student',
        note:'Web経由登録価格。アプリ経由は580円' },
      { id:'linemusic_family',  label:'ファミリー', monthly:1680, audience:'family'  }
    ]}
  ]},

  { id:'books', label:'電子書籍・オーディオ', services:[
    { id:'kindleunlimited', name:'Kindle Unlimited', plans:[
      { id:'kindleunlimited_general', label:'一般', monthly:980, audience:'single' }
    ]},
    { id:'rakutenmagazine', name:'楽天マガジン', plans:[
      { id:'rakutenmagazine_general', label:'月額プラン（一般）',       monthly:597, audience:'single' },
      { id:'rakutenmagazine_mobile',  label:'月額プラン（楽天モバイル）', monthly:537, audience:'single' }
    ]},
    { id:'dmagazine', name:'dマガジン', plans:[
      { id:'dmagazine_monthly', label:'月額プラン', monthly:580, audience:'single' }
    ]},
    { id:'audible', name:'Audible', plans:[
      { id:'audible_standard', label:'スタンダード', monthly: 880, audience:'single' },
      { id:'audible_premium',  label:'プレミアム',   monthly:1500, audience:'single' }
    ]}
  ]},

  { id:'cloud', label:'クラウド・AI', services:[
    { id:'icloud', name:'iCloud+', plans:[
      { id:'icloud_50gb',  label:'50GB',  monthly: 180, audience:'single' },
      { id:'icloud_200gb', label:'200GB', monthly: 540, audience:'single' },
      { id:'icloud_2tb',   label:'2TB',   monthly:1800, audience:'single' }
    ]},
    { id:'googleone', name:'Google One', plans:[
      { id:'googleone_basic',    label:'ベーシック (100GB)',  monthly: 290, audience:'single' },
      { id:'googleone_standard', label:'スタンダード (200GB)', monthly: 440, audience:'single' },
      { id:'googleone_aiplus',   label:'AI Plus (2TB)',       monthly:1450, audience:'single' },
      { id:'googleone_aipro',    label:'AI Pro (5TB)', audience:'single',
        // ★2026年10月から通常価格へ移行（9月まではキャンペーン価格）
        prices:[ { effectiveFrom:'2026-01-01', monthly:1760 },
                 { effectiveFrom:'2026-10-01', monthly:2420 } ] }
    ]},
    { id:'geminiadvanced', name:'Gemini Advanced', plans:[
      { id:'geminiadvanced_general', label:'一般（Google One AI プレミアム）', monthly:2900, audience:'single',
        note:'ストレージ2TBとのバンドルプラン。為替・改定により変動する場合があります' }
    ]},
    { id:'ms365', name:'Microsoft 365', plans:[
      { id:'ms365_personal', label:'Personal', monthly:2130, audience:'single' },
      { id:'ms365_family',   label:'Family',   monthly:2740, audience:'family' }
    ]},
    { id:'chatgpt', name:'ChatGPT', plans:[
      { id:'chatgpt_go',     label:'Go',      monthly: 1400, audience:'single' },
      { id:'chatgpt_plus',   label:'Plus',    monthly: 3000, audience:'single' },
      { id:'chatgpt_pro5x',  label:'Pro 5x',  monthly:16800, audience:'single' },
      { id:'chatgpt_pro20x', label:'Pro 20x', monthly:30000, audience:'single' }
    ]},
    { id:'claude', name:'Claude', plans:[
      { id:'claude_pro', label:'Pro', monthly:3300, audience:'single',
        note:'ドル建て（月額$20）のため為替により変動します' }
    ]}
  ]},

  { id:'game', label:'ゲーム', services:[
    { id:'psplus', name:'PlayStation Plus', plans:[
      { id:'psplus_essential', label:'エッセンシャル', monthly: 850, audience:'single' },
      { id:'psplus_extra',     label:'エクストラ',     monthly:1300, audience:'single' },
      { id:'psplus_premium',   label:'プレミアム',     monthly:1550, audience:'single' }
    ]},
    { id:'nso', name:'Nintendo Switch Online', plans:[
      { id:'nso_individual',      label:'個人',                 monthly:400,  audience:'single' },
      { id:'nso_individual_plus', label:'個人＋追加パック',      annual:5900,  audience:'single' },
      { id:'nso_family',          label:'ファミリー',            annual:5800,  audience:'family' },
      { id:'nso_family_plus',     label:'ファミリー＋追加パック', annual:9900,  audience:'family' }
    ]},
    { id:'xboxgamepass', name:'Xbox Game Pass', plans:[
      { id:'xboxgamepass_ultimate', label:'Ultimate',      monthly:1550, audience:'single' },
      { id:'xboxgamepass_pc',       label:'PC Game Pass',  monthly:1300, audience:'single' }
    ]}
  ]}
  // ★ユーザーテストフィードバック改修（2026-08-08）：「ライフ・配送」カテゴリ
  //   （Amazonプライム一般会員・Uber One・タイムズカー）を削除した。
  //   デジタルサブスク（動画/音楽/書籍/クラウドAI/ゲーム）のみに絞り込むため
];

/** UI の既定表示対象。トグルで family / student も表示できるようにする */
export const DEFAULT_PLAN_AUDIENCE = 'single';

// ---------------------------------------------------------------------------
// その他サブスク（自由入力枠）
//   ★ジム・習い事・コンタクトの定期便など、店舗や契約ごとに価格が大きく異なり
//     定額プランとして持てないものを受けるための枠。
//   ★プルダウンで持とうとすると価格が実態と合わず、かえって誤った試算になる
// ---------------------------------------------------------------------------
export const OTHER_SUBSCRIPTION = {
  labelMaxLength: 30,
  monthlyMax: 200000,               // 異常値ガード
  placeholders: ['ジム', '習い事', 'コンタクトの定期便', '新聞', 'ソフトウェア']
};

// ★UI刷新（ゲーミフィケーション改修v3・2026-08-08）：「＋追加」ボタンで自由に行を増やす方式を廃止し、
//   placeholdersをそのままRPG風チェックボックスの固定プリセットとして並べる方式に変更した。
//   id は placeholders の並び順に紐づく固定値（`preset0`〜）。これに加えて「その他（自由入力）」
//   用の1行（id:'custom'。ラベルもユーザー入力）をUI側（js/ui.js）で追加する。
export const OTHER_SUBSCRIPTION_PRESETS = OTHER_SUBSCRIPTION.placeholders.map((label, i) => ({
  id: `preset${i}`, label
}));

/**
 * プランの月額を解決する。価格改定・年額のみプランを吸収する。
 * @param {SubscriptionPlan} plan
 * @param {Date} [at] 基準日
 * @returns {number} 月額（円）
 */
export function resolvePlanMonthly(plan, at = new Date()){
  if (Array.isArray(plan.prices) && plan.prices.length){
    const t = new Date(at).getTime();
    const row = plan.prices
      .filter(p => new Date(p.effectiveFrom).getTime() <= t)
      .sort((a,b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom))[0];
    if (row) return row.monthly;
  }
  if (Number.isFinite(plan.monthly)) return plan.monthly;
  if (Number.isFinite(plan.annual))  return Math.round(plan.annual / 12);  // 年額のみ→月額換算
  return 0;
}

/**
 * 選択されたプランIDの月額合計を返す（定義済みプランのみ）。
 * @param {string[]} selectedIds
 * @param {Date} [at]
 * @returns {number}
 */
export function sumSubscriptions(selectedIds, at = new Date()){
  const all = SUBSCRIPTION_PLANS.flatMap(g => g.services.flatMap(s => s.plans));
  return (selectedIds ?? []).reduce((sum, id) => {
    const plan = all.find(p => p.id === id);
    return sum + (plan ? resolvePlanMonthly(plan, at) : 0);
  }, 0);
}

/**
 * その他サブスク（自由入力）の月額合計を返す。
 * @param {{label:string, monthly:number}[]} rows
 * @returns {number}
 */
export function sumOtherSubscriptions(rows){
  return (rows ?? []).reduce((sum, r) => {
    const m = Number(r?.monthly);
    // 不正値・負値・異常値は 0 として扱い、合計を壊さない
    if (!Number.isFinite(m) || m < 0 || m > OTHER_SUBSCRIPTION.monthlyMax) return sum;
    return sum + Math.floor(m);
  }, 0);
}

// ---------------------------------------------------------------------------
// 6.2.12a サブスクリプション新クエスト（ゲーミフィケーション改修・2026-08-08）
//   ★旧「合計額－理想値」の単調なギャップ判定（cancelSubscription）を廃止し、
//     独立して発生しうる3つのクエストに置き換えた。判定ロジックは calc.evaluateSubscriptionQuests、
//     発生条件はそちらのJSDoc参照。ここには表示文言・しきい値のみを定義する。
// ---------------------------------------------------------------------------

// ②「幽霊ギルドの退会」：手動入力サブスク合計がこの額以上で発生する
export const SUBSCRIPTION_GHOST_GUILD_MIN = 5000;
// ③「スマホの深淵」：サブスクを1円でも契約していれば発生する固定の節約可能額
//   ★実額に基づく値ではなく、確認を促すための一律のゲーム上のボーナスとして扱う
export const SUBSCRIPTION_AUDIT_SAVING = 500;

export const SUBSCRIPTION_QUEST_TEXT = {
  duplicate: {
    id: 'subscriptionDuplicate',
    mainTitle: '【重複の呪縛】重なりしサブスクの契約を解除せよ！',
    subTitle: '同じカテゴリで複数契約しているサブスクを整理する',
    detail: '「動画見放題」や「音楽聴き放題」の魔法も、複数重なれば手取りを蝕む呪いとなる！'
           + '同じ用途のサービスを複数契約していないか？今は使っていない方のサブスクを解約し、'
           + '重複の呪縛を解き放とう！',
    basis: '同じカテゴリ内で2つ以上のサービスを契約している場合、片方を解約しても'
         + '視聴・視聴体験の大部分は変わらないことが多く、重複分がそのまま無駄な出費になっている'
         + '可能性があります。',
    talkScript: [
      '同じカテゴリ内で実際に両方使っているか（片方は「入っているだけ」になっていないか）',
      '作品・楽曲のラインナップに明確な違いがあり、両方必要な理由があるか',
      '解約するなら年額プランの更新日はいつか（中途解約の返金可否も確認）',
      '家族・友人とのシェア機能を使えば1契約で足りないか'
    ],
    disclaimer: '独占配信作品の有無など、複数契約に合理的な理由がある場合もあります。',
    completeLabel: '🎉 重複していたサブスクを1つに絞った！'
  },
  ghostGuild: {
    id: 'subscriptionGhostGuild',
    mainTitle: '【幽霊ギルドの退会】利用していない高額施設を断捨離せよ！',
    subTitle: '利用頻度の低い高額な手動入力サブスクを見直す',
    detail: '高額な会費を払いながら、もう半年も通っていないスポーツジムやオンラインサロンはないか？'
           + 'それはもはや、あなたの手取りを吸い取る幽霊ギルドだ！'
           + '「いつか行くかも」という未練を断ち切り、今すぐ退会手続きのコマンドを入力せよ！',
    basis: '自由入力欄（その他サブスク）の合計が月5,000円以上の場合、年間では6万円を超える'
         + '出費になります。直近1〜2ヶ月の利用実績を振り返り、本当に必要か確認しましょう。',
    talkScript: [
      '直近1〜2ヶ月で実際に利用した回数',
      '休会制度の有無（解約より休会の方が有利な場合があります）',
      '解約の手続き窓口（Web完結か、電話・来店が必要か）',
      '違約金・入会金の再発生条件（再入会時に同じ条件で戻れるか）'
    ],
    disclaimer: '休会制度がある施設は、解約より休会の方が有利な場合があります。',
    completeLabel: '🎉 行っていないジム・サロンを退会した！'
  },
  phoneAbyss: {
    id: 'subscriptionPhoneAbyss',
    mainTitle: '【スマホの深淵】App Store / Google Playの定期購読を確認せよ！',
    subTitle: 'スマホの定期購読（App Store/Google Play）を確認する',
    detail: '無料体験のまま消し忘れたアプリ課金や、月に数百円だけ引かれている謎のサービス……。'
           + 'スマホの深淵には、自覚のない吸血魔素が潜んでいる！'
           + '今すぐスマホの設定画面から「サブスクリプション（定期購読）」の項目を開き、'
           + '見覚えのない契約をすべて破棄せよ！',
    basis: 'App Store・Google Playでの契約は、このアプリで入力した内容とは別に、'
         + '端末の設定画面からしか一覧・解約ができません。年に一度は棚卸しすることをおすすめします。',
    talkScript: [
      'iPhoneの場合：設定 → 自分の名前 → サブスクリプション',
      'Androidの場合：Google Playアプリ → お支払いと定期購入 → 定期購入',
      '無料体験期間中のまま忘れているものがないか',
      'キャリア決済経由で見えにくくなっている契約がないか'
    ],
    disclaimer: 'OS・アプリのバージョンにより設定画面の場所は異なる場合があります。',
    completeLabel: '🎉 スマホの課金一覧をチェック・整理した！'
  }
};

// ---------------------------------------------------------------------------
// 6.2.13 アイコン定義 — 【β版では実装しない】
//   ★初期リリースではアイコンを使用せず、テキストと絵文字のみで構成する。
//     assets/icons.svg は作成しない。<use href="..."> を書かないこと。
//   ★将来導入する場合は §13.3 の記載を更新し、ライセンス表記の要否を
//     §12.4 に L-09 として登録すること。
// ---------------------------------------------------------------------------
export const USE_SVG_ICONS = false;

// ===========================================================================
// Phase 1〜4 改修（2026-08-07）
//   固定費モデルの再設計・クレジットカードクエスト化・レベル計算式の全面変更。
//   ★ここに定義する数値・文言はユーザー提示の【究極完全版プロンプト】および
//     credit_card_logic_definition.md の記載をそのまま転記したものであり、
//     §6.2.9 等の既存の統計出典（総務省統計局等）とは別枠として扱う。
//     例：smartphone.average(6,000円) は §6.2.9 MARKET_AVERAGE_SMARTPHONE(6,379円)
//     と値が異なるが、今回のバー表示・クエスト判定にはユーザー指定値を使う。
// ===========================================================================

// ---------------------------------------------------------------------------
// Phase1.2 公的保障の簡素化：組合の入力欄を廃止し固定値化
//   ★ユーザーテストフィードバック改修（2026-08-07）：高額療養費の自己負担限度額は
//     保険の種類によらず年収から動的に算出する方式に変更したため、fukaKyufuCap
//     （付加給付の上限）はここでは使わなくなった。averageStandardMonthly は
//     傷病手当金（健保加入12ヶ月未満・組合）の算出にのみ引き続き使用する
// ---------------------------------------------------------------------------
export const KUMIAI_FIXED_VALUES = {
  averageStandardMonthly: 380000
};

// ---------------------------------------------------------------------------
// Phase1.3 新規固定費入力：NHK受信料・光回線
// ---------------------------------------------------------------------------
export const NHK_PLANS = [
  { value:'none',        label:'支払いなし', monthly:0 },
  { value:'terrestrial', label:'地上契約',   monthly:1100 },
  { value:'satellite',   label:'衛星契約',   monthly:1950 }
];
export const NHK_DEFAULT = 'none';

// ---------------------------------------------------------------------------
// Phase2.1〜2.3 固定費カテゴリの目安（全国平均・理想の目標値）
//   ideal:null のカテゴリ（駐車場代）はバーは表示するがクエスト判定には含めない
// ---------------------------------------------------------------------------
export const FIXED_COST_TARGETS = {
  smartphone:       { label:'通信費（スマホ）', average:6000, ideal:2000 },
  internet:         { label:'光回線',           average:5500, ideal:3800 },
  medicalInsurance: { label:'医療保険',         average:4000, ideal:0 },
  fireInsurance:    { label:'火災保険',         average: 833, ideal:400 },
  subscriptions:    { label:'サブスク',         average:2500, ideal:1000 },
  nhk:              { label:'NHK受信料',        average:1950, ideal:0 },
  carInsurance:     { label:'自動車保険',       average:7000, ideal:4000 },
  parking:          { label:'駐車場代',         average:8000, ideal:null }
};

// 節約可能額の足切りライン（月額）。これ未満はクエストを発生させない
export const QUEST_MIN_SAVING = 500;

// ---------------------------------------------------------------------------
// Phase2.4 クレジットカード推定決済額・レベルアップ抽選の定数
// ---------------------------------------------------------------------------
export const CARD_SPEND_DISPOSABLE_RATIO = 0.6;
export const LEVELUP_UNIT = 5000;

// ---------------------------------------------------------------------------
// ゲーミフィケーション改修 v2（2026-08-08）：クエスト解呪1件あたりの疑似EXP
//   ★ユーザーテストフィードバック改修：「1クエスト解呪しただけでレベルがゴリゴリ上がる快感」
//     を出すため、レベル計算だけは実際の節約額（円）ではなく、クエストの種類・金額によらず
//     解呪した件数×この固定値を使う（マイカルテの金額表示・Xシェア等、実額を扱う箇所は
//     従来どおり selectors.completedSavingTotal を使い続けるため影響しない）。
//   ★LEVELUP_UNIT(5,000)に対して21,000を採用：1件解呪するたびに基本+4レベル
//     （端数4,000＝80%はゲージの伸びる演出に使う）。累積の端数が5,000円台をまたぐ
//     タイミングでは+5レベルになる。抽選要素は持ち込まない（確定的な計算のまま）。
export const QUEST_EXP_PER_COMPLETION = 21000;

// ---------------------------------------------------------------------------
// Phase2.1 初期レベル算出式の定数
//   初期レベル = Math.floor((月額手取り + 現状の固定費合計) / 20000) + 1
//   ★ユーザーテストフィードバック改修（2026-08-08）：未入力の初期状態でLv.1になるよう
//     基準値を10→1に変更した（旧基準は10だったため、未入力でもLv.10と表示されていた）
// ---------------------------------------------------------------------------
export const INITIAL_LEVEL_DIVISOR = 20000;
export const INITIAL_LEVEL_BASE = 1;

// ★ゲーミフィケーション改修（2026-08-08）：同じ年収でも初期レベルが毎回同じにならないよう、
//   STEP1「冒険を始める」時に -3〜+3 のランダムな端数を加減する。
//   Math.random() は非決定的なため calc.js（純粋関数）には持ち込まず、
//   app.js（イベントハンドラ層）でのみ使用する。
export const INITIAL_LEVEL_JITTER = 3;

// ---------------------------------------------------------------------------
// Phase3.3 役職テーブル（新仕様）。旧 RANK_TABLE とは別の新レベル方式専用
//   ★INITIAL_LEVEL_BASE変更（2026-08-08）に伴い、各帯の幅（10Lvごと）を保ったまま
//     Lv.1起点にシフトした
// ---------------------------------------------------------------------------
export const RANK_TABLE_V2 = [
  { min:1,  max:10, title:'見習い冒険者' },
  { min:11, max:20, title:'駆け出しの騎士' },
  { min:21, max:30, title:'中堅の魔導士' },
  { min:31, max:Infinity, title:'ベテラン大賢者' }
];

// ---------------------------------------------------------------------------
// Phase2.2 固定費クエスト：既存 QUEST_CATALOG のRPGテキストを再利用するカテゴリ
//   ★既存の演出テキスト（questTitle/summary/description等）は変更しない。
//     トリガー条件・節約可能額の算出方法のみ新方式（現状価格－理想の目標値）に差し替える
// ---------------------------------------------------------------------------
export const REUSED_QUEST_MAP = {
  smartphone:       'changeSim',
  medicalInsurance: 'cancelMedicalInsurance',
  fireInsurance:    'changeFireInsurance'
  // ★subscriptions は廃止（ゲーミフィケーション改修・2026-08-08）。
  //   サブスクは SUBSCRIPTION_QUEST_TEXT の3クエストとして独立に判定する（REUSED_QUEST_MAPを経由しない）
};

// ---------------------------------------------------------------------------
// Phase2.2 新規固定費クエストの文言（光回線・NHK・自動車保険）
//   ★指定文言をそのまま使用する（独自解釈をしない）
// ---------------------------------------------------------------------------
export const NEW_FIXED_QUESTS = {
  internet: {
    id: 'reviewInternet',
    mainTitle: '【回線の魔道結界】格安光回線（GMOとくとくBB光・enひかり等）やセット割へ乗り換えよ',
    subTitle: '光回線の月額料金を見直す',
    detail: '毎月なんとなく払い続けている光回線料金は、実は他社に乗り換えるだけで下がることがあります。'
           + '格安光回線やスマホとのセット割を確認し、無駄な出費を解呪しよう！',
    basis: '光回線の全国平均は月5,500円ですが、格安光回線やセット割を活用すれば'
         + '月3,800円程度まで下げられるケースが一般的です。',
    talkScript: [
      '契約期間の縛りと、解約時の違約金（撤去工事費含む）の有無',
      '現在契約中のスマホとのセット割が外れた場合、スマホ料金がいくら上がるか',
      '開通工事の要否と、乗り換え中にネットが使えない期間が発生しないか',
      'キャッシュバックキャンペーンの受け取り条件（受け取り忘れに注意）'
    ],
    disclaimer: '提供エリア・建物の設備状況により選べる回線は異なります。',
    completeLabel: '🎉 光回線を乗り換えた！'
  },
  nhk: {
    id: 'sealNhk',
    mainTitle: '【NHKの封印】テレビを手放すかチューナーレスTVへ換装し、NHK受信料を完全解呪せよ',
    subTitle: 'NHK受信料の見直し・完全ゼロ化を検討する',
    detail: 'テレビを持たない、またはチューナー非搭載のディスプレイ（ゲーム機・ネット動画専用機器）に'
           + '切り替えることで、NHK受信契約そのものが不要になる場合があります。',
    basis: 'NHK受信料は地上契約で月1,100円、衛星契約で月1,950円です。'
         + 'チューナーを搭載しない機器のみを設置する場合、受信契約の対象外となります。',
    talkScript: [
      '自宅のテレビ・レコーダー・カーナビ等にチューナーが内蔵されていないか',
      'チューナーレステレビへの買い替えで受信契約を解約できるか（NHKへの確認が必要）',
      '衛星契約から地上契約への変更で下げられないか（パラボラアンテナを使わない場合）',
      '解約手続きに必要な書類・立会いの要否'
    ],
    disclaimer: 'チューナー搭載機器を1台でも設置している場合は契約義務が生じます。',
    completeLabel: '🎉 NHK受信料を解約した！'
  },
  carInsurance: {
    id: 'switchCarInsurance',
    mainTitle: '【代理店型の罠】自動車保険をネット型に切り替えよ',
    subTitle: '自動車保険をネット型へ切り替える',
    detail: '代理店を通して契約した自動車保険は、営業コストが上乗せされ割高になりがちです。'
           + 'ダイレクト型（ネット型）の自動車保険に切り替えることで、'
           + '同等の補償内容のまま保険料を抑えられる場合があります。',
    basis: '自動車保険の全国平均は月7,000円ですが、ネット型（ダイレクト型）に切り替えることで'
         + '月4,000円程度まで下げられるケースが一般的です。',
    talkScript: [
      '現在の等級（無事故割引）が引き継げるか',
      '車両保険・対人対物の補償額が現状より下がっていないか',
      '現在の契約の満期日と、中途解約時の返戻金の有無',
      'ロードサービス等の付帯サービスに差がないか'
    ],
    disclaimer: '等級・補償内容により保険料は変動します。必ず現在と同等の補償で見積もりを取ってください。',
    completeLabel: '🎉 ネット型の自動車保険に切り替えた！'
  }
};

// ---------------------------------------------------------------------------
// 新クエスト【都市部のマイカー（過剰装備）】
//   ★発生条件：fixedCosts.hasCar かつ userProfile.isUrbanAreaCar（東京23区・大阪市内在住の
//     自己申告）がともにtrueの場合。節約可能額はcalc.evaluateUrbanCarQuest参照。
// ---------------------------------------------------------------------------
export const URBAN_CAR_QUEST_DEFAULT_SAVING = 30000;   // 駐車場代・自動車保険がともに未入力（0円）の場合の固定値

export const URBAN_CAR_QUEST_TEXT = {
  id: 'urbanCarQuest',
  mainTitle: '【鉄の馬の維持費】都市部における過剰装備（マイカー）を手放せ！',
  subTitle: '都市部でのマイカー保有を見直す',
  detail: '東京23区や大阪市内など、公共交通機関が発達したエリアでのマイカー保有は、'
        + '家計に大ダメージを与える過剰装備です。カーシェアやレンタカー、タクシーの活用に'
        + '切り替えることで、駐車場代や保険料を含め年間数十万円のゴールド（手取り）を確保できます。'
        + '本当に車が必要か、維持費と利用頻度を天秤にかけてみましょう。',
  difficulty: 'hard',
  completeLabel: '🎉 マイカーを手放した（またはカーシェア等に切り替えた）！'
};

// ---------------------------------------------------------------------------
// Phase2.4 クレジットカードクエストの文言（パターンA〜D）
//   ★パターンBの detail は【究極完全版プロンプト】Phase3.1 の指定文言をそのまま使用する。
//     A/C/D の subTitle は credit_card_logic_definition.md §1「考え方」の文をそのまま使用する
// ---------------------------------------------------------------------------
export const CARD_QUEST_TEXT = {
  A: {
    id:'cardPatternA',
    mainTitle: '【低効率装備の換装】',
    subTitle: '基本還元率の低いカードから、高還元カードへの乗り換えを促す。',
    detail: '普段使いのメインカードが、還元率0.5%前後の標準的なカードのままかもしれません。'
      + '年間の決済額次第では、還元率1.0%以上の高還元カードに乗り換えるだけで、'
      + '同じ買い物でも受け取れるポイントが単純に倍増します。',
    completeLabel: '🎉 還元率の高いカードに乗り換えた！'
  },
  B: {
    id:'cardPatternB',
    mainTitle: '【呪いの装備の解除（休眠カード）】',
    detail: '【クエスト発生】呪いの装備を外してHPの漏れを塞げ！\n'
      + 'あなたの装備袋から、不穏な気配がします。現在保有している対象カードは、'
      + '十分な活躍をしていないにもかかわらず、毎年『年会費』というスリップダメージを'
      + 'あなたのHP（手取り）に与え続けています。なんとなく持っているだけの「呪いの装備」は、'
      + '思い切って手放すのが冒険の鉄則です。今すぐカード会社のマイページや窓口に向かい、'
      + '装備を解呪（解約・ダウングレード）して、奪われていた手取りを取り戻しましょう！',
    completeLabel: '🎉 休眠カードを解約した！'
  },
  C: {
    id:'cardPatternC',
    mainTitle: '【100万円未達の罠】',
    subTitle: '100万円決済に届いていないため、年会費が発生し還元率も0.5%に留まっている状態を警告。',
    detail: '「年間100万円決済で年会費無料・還元率アップ」という強力な特典を持つカードを保有していますが、'
      + '現在の推定決済額では100万円のラインに届いていません。届かない場合は年会費という'
      + 'コストだけが残ってしまいます。決済を集約するか、届きそうにない場合は保有の見直しを検討しましょう。',
    completeLabel: '🎉 カードの使い方を見直した！'
  },
  D: {
    id:'cardPatternD',
    mainTitle: '【コスト割れ特化装備】',
    subTitle: '無料宿泊特典などのメリットを享受できる決済ラインに届いておらず、年会費が隠れ負債になっている状態を警告。',
    detail: '無料宿泊特典など、一定の決済額に到達すると強力な特典が得られる特化カードを保有していますが、'
      + '現在の推定決済額ではその損益分岐点に届いていません。年会費だけが負担になっている'
      + '可能性があるため、決済の集約や保有の見直しを検討しましょう。',
    completeLabel: '🎉 カードの使い方を見直した！'
  }
};

// ---------------------------------------------------------------------------
// Phase4.1「伝説の勇者」専用UI（クエストが1件も発生しない場合）
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ユーザーテストフィードバック改修（2026-08-07）：年収ドロップダウン化
//   ★法令ではなくUI設計上の選択肢（200万円〜1500万円・50万円刻み）
// ---------------------------------------------------------------------------
export const ANNUAL_SALARY_MIN  = 2000000;
export const ANNUAL_SALARY_MAX  = 15000000;
export const ANNUAL_SALARY_STEP =  500000;

/**
 * 年収ドロップダウンの選択肢を生成する（200万円〜1500万円・50万円刻み）。
 * @returns {{value:number, label:string}[]}
 */
export function buildAnnualSalaryOptions(){
  const options = [];
  for (let v = ANNUAL_SALARY_MIN; v <= ANNUAL_SALARY_MAX; v += ANNUAL_SALARY_STEP){
    options.push({ value: v, label: `年収${Math.round(v / 10000)}万円` });
  }
  return options;
}
export const ANNUAL_SALARY_OPTIONS = buildAnnualSalaryOptions();

// ★勤続年数の入力欄は廃止（2026-08-07）。住民税の勤続1年目非課税判定は「非課税ではない」
//   （＝勤続2年目以上）側に固定して計算する。単身社会人向けアプリの主要層は
//   入社1年目のみに限らないため、より一般的なケースを既定値とする
export const DEFAULT_YEARS_OF_SERVICE = 2;

export const LEGENDARY_HERO = {
  mainTitle: '【見直す余地なし】あなたは既に伝説の勇者です',
  subTitle: '魔道障壁（固定費のムダ）は一切見当たりません。あなたの家計はすでに完璧な結界で守られています！'
};

// ---------------------------------------------------------------------------
// 【特別仕様】伝説の勇者（Lv.99カンスト）
//   ★足切りルールによりクエストが0件（＝見直す余地のない完璧な家計）の場合、
//     通常の算出ロジックによらずレベル・役職・ゲージ表示を一律で上書きする
//     （ユーザーテストフィードバック改修・2026-08-08）。selectors.isLegendaryHero() が判定する。
// ---------------------------------------------------------------------------
export const LEGENDARY_LEVEL = 99;
export const LEGENDARY_RANK_TITLE = '伝説の勇者';
