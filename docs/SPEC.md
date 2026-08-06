# 📋 システム要件定義・基本仕様書（単一完全版）

## 📄 ドキュメント管理情報

| 項目 | 内容 |
| :--- | :--- |
| **システム・サービス名** | 手取り最大化シミュレーター『てどりクエスト』（β版） |
| **ドキュメント種別** | システム要件定義・基本仕様書（実装用・単一完全版） |
| **ドキュメントVer** | **Ver 4.7.0**（その他サブスク自由入力枠 追加版） |
| **作成日 / 最終更新日** | 2026年8月5日 |
| **管轄者 / 監修** | チーフプロダクトオフィサー（CPO） 兼 主席システムアーキテクト |
| **対象開発環境** | HTML5 / 素のCSS / Vanilla JS (ES Modules) ／ **既定はビルドレス（Node.js 不要）。必要時に段階導入可能（§17）** |

---

### 履歴情報（Revision History）

| バージョン | 更新日 | 変更内容概要 |
| :---: | :---: | :--- |
| v1.0〜v1.1.0 | 2026/08/05 | 初期設計。第1次技術監査（72点）反映：高額療養費2026年8月改定、標準報酬月額表収録、State構造改訂、差分描画、呪文UTF-8化 |
| v2.0〜v2.8.0 | 2026/08/05 | 行動経済学強化、階層サブスク、金融インフラ診断、透明性PR分離、無記名フィードバックUI、送信ボーナス |
| v2.8.1 | 2026/08/05 | 第2次レビュー（68点）反映：レベル3層分離、家賃除外、WCAG点滅対策、CSP、html2canvas遅延 |
| v3.0.0 | 2026/08/05 | 第3次再監査（78点）の残存4欠陥＋新規7欠陥を全解消。①Web3Formsプロキシ方式の確立 ②サニタイズ正規表現3バグ修正 ③レート制限復活 ④v1.1.0全要件の完全統合 ⑤子ども・子育て支援金0.23%の新設反映 ⑥高額療養費5区分＋年間上限の完全定義 ⑦テスト重複解消＋TEST-55まで拡張 |
| **v3.1.0** | **2026/08/05** | **保守性の抜本強化：§12「制度・法令トレーサビリティ・レジストリ」、§13「意図的スコープ外リスト」、§14「年次メンテナンス・カレンダー」、§15「抜け漏れ再発防止レジストリ」、§16「変更管理ルール（SOP）」を新設。何がいつの法令に基づいて反映済みで、何が意図的に未実装かを、以後のアップデートで追跡可能にした** |
| v3.2.0 | 2026/08/05 | シェア・プライバシー設計の確定：Xシェア文面から金額を除外し、レベル・称号のみとする。マイカルテ（内部表示）には年間増額を引き続き表示 |
| **v4.7.0** | **2026/08/05** | **「その他サブスク」自由入力枠を追加。ジム・習い事など店舗ごとに価格が異なり定額プランとして持てないものを受ける。`selections.otherSubscriptions`（最大5件・ラベル＋月額）を State に追加し、呪文・合計算出・サニタイズに統合。TEST-81〜83を追加し全83件に確定** |
| v4.6.0 | 2026/08/05 | **RPG演出のクエスト文言7件を反映。`QUEST_CATALOG` に `questTitle`／`plainTitle`／`summary`／`description`／`actionLabel`／`completeLabel`／`clearMessage` を追加。演出用タイトルと中立表記を分離し、シェア文面・aria-label には `plainTitle` を使用する設計とした。あわせて §3.7a との不整合4件を修正（通信費8,000円の断定→家計調査値、リボ年利15%の断定→「15%前後」、手数料無料回数のプレースホルダー確定、「不要サブスク」→「使っていないサブスク」）。TEST-79〜80を追加し全80件に確定** |
| v4.5.0 | 2026/08/05 | **⚠️要照合をゼロにし、全定数を確定。①標準報酬月額表 全50等級の突合完了 ②手取り表示を年税額ベース＋注記で確定（§6.3a） ③振込手数料を220円固定に確定 ④火災保険の補完値を中央値729円で確定 ⑤通信費の判定を**2段階しきい値**に変更（平均超＝見直し案内／平均以下でもオンライン専用プラン水準との差を提示） ⑥ATM入力欄を「時間外・土日祝の回数」に明確化 ⑦TEST-77〜78を追加し全78件に確定** |
| v4.4.0 | 2026/08/05 | **調査報告書に基づき法令定数・市場データを一次資料ベースで確定。🔴重大な誤りを4件修正：①基礎控除（令和8年分）を全面差し替え（489万以下は104万円。旧記載の95万/88万/68万は誤り） ②給与所得控除の段階式を全面差し替え ③雇用保険料率を0.55%→**0.5%**（令和8年度引き下げ） ④高額療養費の年間上限を全5区分で確定（ア168万/イ111万/ウ・エ53万/オ29万）。さらに ⑤子ども・子育て支援金の適用開始を4月分（5月納付）に分離 ⑥労使折半の端数処理を「50銭以下切捨・50銭超切上」に修正 ⑦市場データ4件を確定（通信費6,379円／家賃を実勢値に修正／火災保険／銀行手数料） ⑧2027年8月の区分ア細分化を§14.1に具体値で登録** |
| v4.3.1 | 2026/08/05 | **`changeSim` の根拠を「総務省 家計調査（単身世帯）の移動電話通信料 平均」との比較に確定。※内外価格差調査は「中容量プランで日本は国際的に安価」という結論のため、割高さの根拠には使用しない。`MARKET_AVERAGE_SMARTPHONE` を config に追加し、§12.6 に市場データレジストリを新設** |
| v4.3.0 | 2026/08/05 | **①§3.9 サブスク階層選択UI（`<details>` による2階層アコーディオン＋サービス内ラジオ）を新設。年額プランは月額換算して合算 ②State に `selections.subscriptionPlanIds` を追加し呪文にも収録 ③§6.2.11 `QUEST_CATALOG` の全7クエストについて `basis`（根拠）と `talkScript`（確認事項リスト）の草案を記入 ④TEST-67〜69 を追加し「全69件」に確定** |
| v4.2.0 | 2026/08/05 | **Phase 3 の未定義領域を解消：①§4.1a セクション構成表・§4.1b バインディング契約表を新設（HTML全文は書かず属性契約のみを確定させる方式） ②§6.2.11 `QUEST_CATALOG` 構造と §3.7a 禁止語・推奨言い換え表を新設 ③§6.2.12 `SUBSCRIPTION_PLANS` に実データ66プランを収録（施行日付き価格・年額換算・audienceタグに対応） ④SVGアイコンをβ版では非実装と決定（§6.2.13） ⑤progress の21クラス分割を CSS変数方式へ簡素化（`style-src-attr` が既に許可済みのため不要だった） ⑥無番号テストに採番し「全66件」に確定 ⑦§12.5 にサブスク価格レジストリ、§14 に四半期メンテナンスを追加** |
| v4.1.0 | 2026/08/05 | **Node.js 段階導入パスの搭載：§17 を新設し、Level 0〜4 の5段階で「必要になった時だけ」Node を足せる設計に変更。あわせて将来の導入を阻害していた2点を是正（①CDN の bare URL 直書き → `js/vendor.js` ラッパーへ集約 ②テストランナーのシグネチャを `node:test` / `node:assert` 互換に変更し、`tests/harness.js` によるブラウザ／Node の自動切替を導入）。JSDoc 規約を §6.0 に新設し、後から `tsc --checkJs` を無改修で適用可能にした** |

---

## 📌 本書の完全性宣言と、その前提

本書は Ver 1.1.0 以降のすべての監査要件を統合した**単一の完全仕様書**である。Claude Code CLI へ本書のみを投入して実装可能である。

**Ver 4.5.0 をもって `⚠️要照合` タグはゼロになった。**すべての法令定数・市場データは一次資料で確定済みであり、
実装者による事前確認なしに Phase 1 へ着手できる。

| 確定した根拠 | 出典 |
| :--- | :--- |
| 標準報酬月額 全50等級・保険料率 | 協会けんぽ大阪支部「令和8年度保険料額表」 |
| 高額療養費（区分ア〜オ・年間上限） | 厚生労働省 保険局「高額療養費制度の見直しのポイント」 |
| 雇用保険料率 | 厚生労働省「令和8年度の雇用保険料率について」 |
| 給与所得控除・基礎控除 | 財務省「令和8年度税制改正の大綱」／国税庁 |
| 市場データ4件 | 総務省統計局・全国賃貸管理ビジネス協会・各行手数料表 |

**ただし §14 の年次カレンダーに従い、定期的な更新は必要である。**特にサブスク価格は四半期ごとに見直すこと。

### 🛠 ビルドレス構成の原則（Ver 4.0.0 の中核方針）

本アプリは **Node.js・npm・ビルドツールを一切必要としない**。ファイルをそのままサーバーに置けば動作する。

| 一般的な構成 | 本アプリの選択 | 理由 |
| :--- | :--- | :--- |
| Tailwind CSS（要ビルド） | **素のCSS ＋ CSSカスタムプロパティ** | ビルド工程を消し、`oklch()` 混入の事故も同時に根絶できる |
| npm パッケージ | **なし（依存ゼロ）** | `node_modules` も `package.json` も存在しない |
| バンドラ（Vite / webpack） | **ネイティブ ES Modules** | 全モダンブラウザが `import` を直接解釈できる |
| `node --test` | **`tests.html`（ブラウザ実行）** | テストランナーを自作し、ブラウザで開くだけで結果が見える |
| ローカルサーバ | **`python3 -m http.server`** | macOS に標準搭載。追加インストール不要 |
| html2canvas（要ダウンロード） | **CDN からの動的 `import()`** | ファイル同梱もバージョン管理も不要 |

**唯一の例外**: `functions/api/feedback.js`（Cloudflare Pages Functions）は Cloudflare のエッジ上で動作する。**手元に Node.js は不要**であり、ビルドも発生しない。フォルダごとデプロイするだけでよい（§6.9）。

#### この制約が生む利点

* **環境構築ゼロ** — クローンして `python3 -m http.server` を叩けば即開発できる
* **依存脆弱性ゼロ** — `npm audit` に怯えることがない
* **ビルド事故ゼロ** — 「ローカルでは動くのに本番で壊れる」という最大の事故要因が消える
* **Lighthouse に有利** — 未使用CSSが1バイトも混入しない
* **長期保守性** — 5年後も同じ手順で動く（ビルドツールは陳腐化するが、HTML/CSS/JSは陳腐化しない）

#### 代償（受け入れる不便）

* CSSのユーティリティクラスが使えないため、**CSSを自分で書く必要がある**（§3.1a に設計済み）
* CSSの記述量が増える（ただし本アプリの規模では2万行に達しない）
* TypeScript による型チェックが使えない（**JSDoc コメントで代替**する。§6.0）

#### 🔓 Node-Ready 原則（将来の導入を塞がないための5つの約束）

本アプリは**既定ではビルドレス**だが、「Node を永久に使わない」とは決めていない。CI・型チェック・最小化などが必要になった時点で、**コードを書き換えずに**段階導入できるよう、以下5点を今のうちに守る（守るコストはいずれもゼロに近い）。

| # | 約束 | 守らないと何が起きるか |
| :---: | :--- | :--- |
| **N-1** | **外部CDNの URL を各ファイルに直書きせず、`js/vendor.js` に集約する** | バンドラは `https://...` の specifier を解決できない。直書きすると導入時に全ファイル修正が必要になる |
| **N-2** | **`import` は必ず相対パス＋拡張子 `.js` を書く**（`./calc.js`） | 拡張子を省くとブラウザで動かず、逆に bare specifier（`calc`）を使うと Node で解決できない。**両対応する唯一の書き方**がこれ |
| **N-3** | **テストは `node:test` / `node:assert` 互換のAPIで書く** | 独自シグネチャで書くと、CI で Node 実行したくなった時に全テストの書き換えが発生する |
| **N-4** | **`calc.js` / `selectors.js` はブラウザAPIに触れない**（制約6で既定） | Node から `import` できなくなり、CI・型チェックの対象外になる |
| **N-5** | **ソースは `js/` に置き、`src/` → `dist/` の移動を前提にしない** | ビルド導入時にディレクトリ移動が発生すると、Git履歴が分断され差分が追えなくなる。**ビルド成果物だけを `dist/` に出す**構成にすれば移動は不要 |

**導入手順は §17 に段階別（Level 0〜4）でまとめてある。**

---

### 📍 保守担当者へ — まずここを読むこと

制度改定・仕様更新の際は、**必ず §12〜§16 を起点に作業すること**。本書のどこに何が反映済みで、何が意図的に外してあるかは、以下に集約されている。

| 節 | 内容 | こんなときに見る |
| :--- | :--- | :--- |
| **§12** | 制度・法令トレーサビリティ・レジストリ | 「この数値は何法の何年版か？」「出典は？」 |
| **§13** | 意図的スコープ外リスト | 「賞与は？iDeCoは？入れ忘れ？」 |
| **§14** | 年次メンテナンス・カレンダー | 「今月は何を見直すべきか？」 |
| **§15** | 抜け漏れ再発防止レジストリ | 「過去にどこでバグったか？」 |
| **§16** | 変更管理ルール（SOP） | 「制度が変わった。どの手順で直すか？」 |
| **§17** | **Node.js 段階導入パス** | **「CI を入れたい」「型チェックしたい」「最小化したい」** |

**§13 は特に重要である。**「未実装」と「意図的な非実装」を区別できないと、将来のレビューで同じ議論を何度も繰り返すことになる。

---

## 1. システム概要

### 1.1 目的

家計最適化の思考プロセスに【FP2級の専門知識 ＆ 社会保険制度】を融合させた、完全無料・Web完結型・スマホネイティブ仕様の手取り最大化RPG風Webアプリケーションの**β版**である。

社会人1〜10年目付近の**「20代〜30代の単身会社員（独身）」**が抱える「手取りを増やしたい」「無駄な保険・手数料で損をしたくない」という課題に対し、公的保障や合理的根拠に基づいた最適化の**情報提供**を行う。

### 1.2 戦略的ポジショニング（引き算の美学）

既存PFMアプリや金融機関シミュレーターの巨大機能における「負け」を戦略的に受け入れ、一切追従しない。「1分で自らの手取りを減らしている固定費・過剰保険・金融無駄を発見し、自力で削減するための即効型アクション・トリガー」としてのポジショニングを確立する。

### 1.3 独自価値

* **多面的なモチベーション喚起**: 手取り黄金比・市場平均比較、タイパ換算、10年放置損失、社会的証明バッジ、エンディング体験、レベル遷移可視化、項目別リアルタイム昇格レベル、フィードバック送信ボーナス
* **入力負荷ゼロ**: エリア別家賃動的平均、サブスク階層式UI、火災保険アシスト、銀行・クレカ最適化、氏名連絡先不要のタップ完結型フィードバック
* **透明性と信頼**: 完全中立サービスをメイン表示し、PR枠をサブに分離

### 1.4 ターゲット・想定報酬帯

* **ペルソナ**: 社会人1〜10年目、20代〜30代の単身会社員（独身）
* **想定報酬帯**: 月額報酬 **18万〜35万円**
  * 高額療養費の**区分エ（26万円以下）と区分ウ（28万円以上）にまたがる**ため、区分の決め打ちを禁止する
  * **40歳未満のため介護保険料は課さない**（ただし年齢判定は必ず実装する）
  * **社会人1年目は住民税ゼロ**（前年所得なし）
  * **2026年4月から子ども・子育て支援金 0.23% が新設**され、健康保険料に上乗せされる

### 1.5 本サービスの法的位置づけ（免責の前提）

本サービスは**一般的な情報提供**であり、以下には該当しない。

* 税務代理・税務相談（税理士法）
* 保険募集・保険商品の推奨または解約勧奨（保険業法）
* 投資助言（金融商品取引法）
* 個別の社会保険手続きの代理（社会保険労務士法）

**表示必須**: 試算は概算であり実際の給付額・税額を保証しない旨を、**数値の直下**（フッターではなく）に表示する。

---

## 2. UXユーザーストーリー

### 🎬 Scene 1：出会いと期待値の調整（STEP 1）
Xから流入。登録障壁ゼロで即座に入力画面。上部に「単身者向け」免責を表示。額面入力時に「4〜6月の残業代で社会保険料が決まる（定時決定の罠）」の豆知識を表示し信頼感を醸成。

### 🎬 Scene 2：ポテンシャルの可視化（STEP 2）
「診断開始」で一瞬で切替。現在の手取りレベルと「固定費を見直せば年間で最大〇〇万円増える可能性」を提示。焦りと「レベルを上げたい」欲求を喚起。

### 🎬 Scene 3：入力負荷ゼロのダッシュボード（STEP 3）
* **家賃**: エリア選択で動的平均との差分警告。※引っ越し初期費用が高いため**参考枠として別表示し、レベル計算からは除外**
* **サブスク**: 系統別アコーディオンからプラン選択で自動加算
* **火災保険**: 「金額がわからない」ボタンで相場（月833円）を自動補完
* 各カードに「【年間＋〇〇円】➔ Lv.〇 UP!」をリアルタイム表示

### 🎬 Scene 4：解約クエスト完遂
「💡 FPの多くが推奨する裏ワザ」バッジ。解約トークスクリプトを提供。チェック時に「Lv.12 ➔ Lv.15（＋月額3,000円）」の遷移アニメーション。

### 🎬 Scene 5：エンディング・FB送信・バイラル
全クエスト完了後、ボトムシートから1タップ送信。紙吹雪と「🎉 開発協力ボーナス獲得 ➔ ＋1 Level UP!」。シェアボタンでは**「Lv.25 達成」というレベル・称号のみ**の簡潔な文面を自動生成。一方、マイカルテ内には「年間600,000円増える潜在能力」という詳細な金額情報を表示。

---

## 3. UI/UX・デザイン要件

### 3.1 カラーパレット

| 用途 | 値 |
| :--- | :--- |
| ベース背景 | `#0F172A` (Slate-900) |
| カード背景 / ボーダー | `#1E293B` / `#334155` |
| メインブランド | `#10B981` (Emerald-500) |
| アクセント | `#F59E0B` (Amber-500) |
| β版バッジ | `#8B5CF6` (Violet-500) |
| 警告 | `#EF4444` (Red-500) |

**⚠️ 実装制約**: すべて**HEX表記**で定義する。`oklch()` / `lab()` / `color-mix()` は**使用禁止**（html2canvas が解釈できず、キャプチャ画像が全崩壊するため）。`rgb()` / `rgba()` は可。

### 3.1a CSS設計（ビルドレス・素のCSS）

CSSフレームワークを使わないため、以下の構造を `style.css` 1ファイルに実装する。

```css
/* ===== ① デザイントークン（すべてここで一元管理） ===== */
:root{
  /* 色：必ず HEX。oklch()/lab()/color-mix() 禁止（html2canvas 非対応） */
  --c-bg:        #0F172A;
  --c-surface:   #1E293B;
  --c-border:    #334155;
  --c-text:      #E2E8F0;
  --c-text-mute: #94A3B8;
  --c-brand:     #10B981;
  --c-accent:    #F59E0B;
  --c-beta:      #8B5CF6;
  --c-danger:    #EF4444;

  /* 間隔：4px グリッド */
  --sp-1:.25rem; --sp-2:.5rem;  --sp-3:.75rem;
  --sp-4:1rem;   --sp-6:1.5rem; --sp-8:2rem;

  /* 文字：clamp でモバイル〜デスクトップを1指定でカバー */
  --fs-xs:  clamp(.7rem, 2.6vw, .78rem);
  --fs-sm:  clamp(.8rem, 3vw,   .88rem);
  --fs-base:clamp(.9rem, 3.4vw, 1rem);
  --fs-lg:  clamp(1.05rem, 4vw, 1.25rem);
  --fs-xl:  clamp(1.3rem, 5.5vw, 1.75rem);
  --fs-2xl: clamp(1.8rem, 8vw,   2.5rem);

  --radius:12px; --radius-full:999px;
  --dur:180ms; --ease:cubic-bezier(.4,0,.2,1);
}

/* ===== ② リセット（最小限） ===== */
*,*::before,*::after{box-sizing:border-box;}
body,h1,h2,h3,p,figure,ul{margin:0;padding:0;}
ul{list-style:none;}
img,svg{display:block;max-width:100%;}
button,input,select,textarea{font:inherit;color:inherit;}

/* ===== ③ ベース ===== */
body{
  background:var(--c-bg); color:var(--c-text);
  font-family:"Noto Sans JP",system-ui,-apple-system,"Hiragino Sans",sans-serif;
  font-size:var(--fs-base); line-height:1.7;
  -webkit-text-size-adjust:100%;
}

/* ===== ④ コンポーネント（BEM風の命名。ユーティリティを乱造しない） ===== */
.card{
  background:var(--c-surface); border:1px solid var(--c-border);
  border-radius:var(--radius); padding:var(--sp-4);
}
.btn{
  display:inline-flex; align-items:center; justify-content:center; gap:var(--sp-2);
  min-height:44px; padding:var(--sp-3) var(--sp-4);   /* ★タップ領域 44px 確保 */
  border:none; border-radius:var(--radius);
  background:var(--c-brand); color:var(--c-bg); font-weight:700;
  cursor:pointer; transition:opacity var(--dur) var(--ease);
}
.btn:disabled{opacity:.5; cursor:not-allowed;}
.btn.is-loading{position:relative; color:transparent;}
.btn.is-loading::after{
  content:''; position:absolute; width:1.1em; height:1.1em;
  border:2px solid var(--c-bg); border-top-color:transparent;
  border-radius:50%; animation:spin .7s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg);}}

.input{
  width:100%; min-height:44px; padding:var(--sp-3);
  background:var(--c-bg); border:1px solid var(--c-border);
  border-radius:var(--radius); color:var(--c-text);
  font-size:16px;                                     /* ★iOS の自動ズーム防止。16px 未満にしない */
  text-align:right; font-variant-numeric:tabular-nums;
}
.input:focus-visible{outline:2px solid var(--c-brand); outline-offset:2px;}

/* ===== ⑤ プログレスバー ===== */
/* ★CSS変数方式。§7.2 で style-src-attr 'unsafe-inline' を既に許可しているため、
   クラス分割（progress-0〜100の21クラス）は不要である。
   ⚠️ キャプチャ機能を廃止して style-src-attr を外す場合は、
      クラス切替方式へ戻すこと（§7.2 の注記を参照） */
.progress{height:8px; background:var(--c-border); border-radius:var(--radius-full); overflow:hidden;}
.progress__fill{
  height:100%; background:var(--c-brand);
  width:var(--progress, 0%);
  transition:width var(--dur) var(--ease);
}

/* ===== ⑥ モーション配慮 ===== */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation:none !important; transition:none !important;}
}
```

**CSS記述の原則**
1. **色・間隔・文字サイズは必ず `var(--*)` を経由する**。生の HEX をコンポーネント側に書かない（テーマ変更時に全箇所を探すことになる）
2. **ユーティリティクラスを乱造しない**。`.mt-4` のような小片を増やすとフレームワークの劣化版になる。意味のある単位（`.card` `.btn` `.quest-item`）で命名する
3. **可変値は CSS変数（`--progress` 等）で受け渡す**。`style-src-attr 'unsafe-inline'` を許可済みのため属性スタイルは使えるが、**個別プロパティを直接書かず必ず変数を経由する**（テーマ変更やキャプチャ時の一括制御が効くため）
4. **`@media (max-width)` ではなく `clamp()` を優先する**。ブレークポイントの管理コストを減らせる

### 3.2 レベル計算の3層構造定義

ゲーム内体験と、SNSシェア時の数値整合性を両立するため、レベルを3層に分離する。

| 層 | 算式 | 用途 |
| :--- | :--- | :--- |
| **`moneyLevel`** | `min(999, max(1, floor(annualGain / 5000) + 1))` | **Xシェア文面で必ず使用**（ボーナス込みの `displayLevel` を外部に出すと、内部のレベル体系と食い違うため）。金額そのものはシェア文面に含めない（§4.2） |
| **`bonusLevel`** | フィードバック送信で生涯1回のみ `+1`（上限1） | 貢献由来。`meta.feedbackBonusGranted` で永続化し、呪文にも含める |
| **`displayLevel`** | `moneyLevel + bonusLevel` | アプリ内ヘッダー・マイカルテ。内訳を `Lv.25 ＋ 開発協力ボーナス +1 = Lv.26` と透明に明示 |

`annualGain` は**即時実行可能な `IMMEDIATE` 項目のみ**で構成する（§3.3）。

### 3.3 家賃超過分の二階層分離（レベル算入除外）

家賃の超過分は、回収に数年を要する引っ越し初期費用（敷金・礼金・仲介手数料・引越費用で家賃4〜6ヶ月分）が発生するため、**即時レベルアップの源泉から除外する**。

* **`IMMEDIATE`（レベル算入）**: `smartphone` / `subscriptions` / `fireInsurance` / `medicalInsurance` / `bankFee` / `cardReward`
* **`HIGH_COST`（参考枠・レベル非算入）**: `rent`
* **表示**: 「参考：住まいの見直し余地 月〇〇円（※引っ越し初期費用の回収に約〇年）」と別枠提示

### 3.4 アクセシビリティ要件

* **リボ払いアラート（WCAG 2.3.1 準拠）**: **1秒間に3回を超える点滅を全面禁止**。色（`#EF4444`）＋警告アイコン（`⚠`）＋明確なテキスト（「最優先・危険」）で表現。アニメーションは `prefers-reduced-motion` に配慮し、**減衰パルス2回で停止**（`infinite` 禁止）
* **タップ領域**: 最小 44×44px
* **ボトムナビ**: `padding-bottom: env(safe-area-inset-bottom)` 必須。現在地に `aria-current="page"`
* **入力欄**: `font-size: 16px` 以上（iOSの自動ズーム防止）
* **コピーボタン**: `aria-live="polite"` を付与
* **モーション**: `@media (prefers-reduced-motion: reduce)` で全アニメーション無効化

### 3.5 ボトムシートUI（iOS対応）

```javascript
// ui.js — iOS Safari の背面スクロール貫通・位置飛び対策
let savedScrollY = 0;

export function openSheet(sheet){
  savedScrollY = window.scrollY;
  document.body.style.cssText =
    `position:fixed; top:${-savedScrollY}px; left:0; right:0; width:100%; overflow:hidden;`;
  sheet.hidden = false;
  trapFocus(sheet);                                  // フォーカストラップ
  document.addEventListener('keydown', onEscape);    // Escapeクローズ
}

export function closeSheet(sheet){
  document.body.style.cssText = '';
  window.scrollTo(0, savedScrollY);                  // ★これが無いとページ先頭へ飛ぶ
  sheet.hidden = true;
  releaseFocus();
  document.removeEventListener('keydown', onEscape);
}
```

```css
.bottom-sheet{
  height: auto; max-height: 90dvh;      /* vh ではなく dvh（キーボード出現時のズレ防止） */
  overscroll-behavior: contain;
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 3.6 フィードバックUI

* **ボトムシート形式**: 外部サイトに飛ばさず内部で完結
* **氏名・連絡先不要**: 任意入力の自由記述欄を1つのみ設置
* **感情ボタン**: `[👍 最高だった]` `[😐 普通]` `[👎 イマイチ]`
* **カテゴリチップ**: `[数値や計算の間違いがある]` `[操作がわかりにくい]` `[機能の要望]` `[見やすくて良い]`
* **需要調査トグル**: `[ ] 比較情報やおすすめサービスの情報も見たいですか？`
* **必須の注記**: 自由記述欄の直下に「**※メールアドレス・電話番号は自動的にマスクされます。返信をご希望の場合はXのDMへ**」を表示
* **自動起動**: カルテ保存時／クエスト100%完了時に1.5秒ディレイ（1セッション最大1回）
* **トースト重複防止**: 送信成功時は**ボーナス演出に一本化**。2回目以降（`levelBonus: 0`）は簡易トースト「ご意見ありがとうございます！」のみ。エラー時のみトーストを使用

### 3.7a 文言ガイドライン（禁止語・推奨言い換え表）

> **なぜ必要か**: §3.7 の「断定的な解約勧奨表現を禁止」だけでは抽象的すぎ、実装者（人間・AIを問わず）が個別に判断できない。
> **本表に列挙された語を成果物に含めてはならない。**レビュー時は `grep` で機械的に検査する。

| ❌ 禁止表現 | ✅ 推奨表現 | 理由 |
| :--- | :--- | :--- |
| 解約すべき／解約しましょう | 見直しの余地があるか確認してみましょう | 保険業法上の解約勧奨と解される余地を排除 |
| 不要な保険／無駄な保険 | 公的保障と重複している可能性がある保険 | 個別事情を知らずに不要と断定できない |
| 損しています／損します | 差額が生じています／年間◯◯円の差があります | 事実の提示に留める |
| 絶対に／必ず／確実に | 多くの場合／一般的には | 断定的判断の提供を回避 |
| おすすめしません／やめるべき | 優先度は低いと考えられます | 同上 |
| 最適／ベストな選択 | 選択肢のひとつ／コストパフォーマンスが高い | 個別最適の断定を回避 |
| 儲かる／増やせる（投資文脈） | 非課税で運用できる制度です | 金商法上の投資助言を回避 |
| ◯◯円もらえます（給付文脈） | 制度上の上限額は◯◯円です（概算） | 受給を保証しない |
| 節税になります | 所得控除の対象となります | 税理士法上の税務相談を回避 |

**演出文言（RPG表現）の扱い**

本アプリはRPG風の演出を用いるため、クエストには**演出タイトル（`questTitle`）と中立表記（`plainTitle`）の両方**を持たせる。

| 用途 | 使うフィールド | 理由 |
| :--- | :--- | :--- |
| 画面上のクエストカード | `questTitle` | 世界観の演出 |
| **Xシェア文面** | **`plainTitle`** | 文脈のない場所で演出表現だけが独り歩きするのを防ぐ |
| **`aria-label` / スクリーンリーダー** | **`plainTitle`** | 絵文字と装飾語は読み上げの妨げになる |
| 印刷版（マイカルテ） | `plainTitle` | 記録として残る形では中立表記が適切 |

**演出表現に許されること・許されないこと**

* ✅ 「解呪」「浄化」「討伐」などの比喩 — 対象は契約であり人ではないため問題ない
* ✅ 「過剰な火災保険を解呪せよ」— **説明文が疑問形（「〜かも？」）で受けている**限り、断定にはあたらない
* ❌ 演出の勢いで**具体的な金額・利率を断定する**こと（例：「毎月8,000円削られている」）。数値は必ず `basis` の出典付きの値と一致させる
* ❌ 「不要な」「無駄な」を**契約の属性として断定する**こと。「使っていない」「利用していない」に言い換える（利用実態は本人にしか判断できない）

**追加ルール**

1. **金額を示す箇所には必ず「概算」「試算」の語を併記する**（§1.5 の免責と整合させる）
2. **クエストの動詞は「検討する」「確認する」を基本形とする**（「解約する」「乗り換える」を命令形で使わない）
3. **比較対象を示す場合は出典を併記する**（「市場平均」とだけ書かない）
4. **医療保険については §6.2.8 の `GOLDEN_RATIO.medicalInsurance.note` を必ず併記する**（3%は適正水準ではなく赤ラインである旨）

**機械的検査**

```bash
# リリース前に実行する。ヒットしたら文言を修正すること
grep -rnE "解約すべき|解約しましょう|不要な保険|無駄な保険|不要サブスク|損しています|損します|必ず|絶対に|おすすめしません|やめるべき|儲かる|節税になります" \
  index.html privacy.html js/config.js
```

### 3.7b 透明性を担保するメイン／サブ案内構造（景表法ステマ規制対応）

* **メイン案内**: アフィリエイト報酬の有無に関わらずコスパ最高のサービスを最優先表示。外部リンクは `target="_blank" rel="noopener noreferrer"`
* **サブ案内**: トグルを**閉じた状態でも** `その他の選択肢を見る［広告を含みます］` と明記。開いた内部に `[PR]` バッジ付きで配置
* **運用不可侵原則**: メイン表示に指定した中立サービスは将来にわたりアフィリエイト化しない
* **用語区別**: 共済（保険業法の適用外）と保険を混同して表記しない
* **文言制約**: §3.7a の禁止語・推奨言い換え表に従うこと

### 3.9 サブスクリプション階層選択UI

> **結論**: アコーディオンを採用する。ただし**2階層まで**とし、プラン選択は第3のアコーディオンにしない。

#### なぜ3階層にしないか

「カテゴリ → サービス → プラン」をすべてアコーディオンにすると、**1つの金額に到達するまでに3タップ**必要になる。サブスクは平均3〜5個契約しているため、15タップ前後を要し「入力負荷ゼロ」という中核価値が崩れる。

| 階層 | 実装 | 理由 |
| :---: | :--- | :--- |
| **1. カテゴリ**（6件） | `<details>` アコーディオン | 一度に1カテゴリだけ開けば視界に収まる |
| **2. サービス**（各3〜7件） | 展開後に**カード一覧として常時表示** | 開閉操作を挟まない |
| **3. プラン**（各1〜4件） | **サービスカード内のラジオボタン**（横並びチップ） | プランは1〜4個しかなく、その場で収まる |

**プラン選択をラジオにする理由**は、意味論が正しいためでもある。Netflix のスタンダードとプレミアムを同時契約することはあり得ず、チェックボックスだと矛盾した選択が可能になってしまう。

#### `<details>` を使う理由（ビルドレス構成との親和性）

* **JavaScript ゼロで開閉が動く**。JS読込前でも操作できる
* キーボード操作・スクリーンリーダー対応が**ブラウザ標準で担保**される
* `open` 属性の有無だけで状態が表現でき、`data-bind` と干渉しない

```html
<details class="sub-category" name="sub-accordion">
  <!-- ★name 属性で排他制御（他を開くと自動で閉じる）。Chrome 120+ / Safari 17.2+ -->
  <summary>
    <span>動画配信</span>
    <!-- ★閉じていても選択状況が見える（これが無いと選び忘れ・二重選択が起きる） -->
    <span class="sub-badge" data-bind="text:videoSummary">2件・2,190円</span>
  </summary>

  <div class="sub-service">
    <h4>Netflix</h4>
    <div class="plan-chips" role="radiogroup" aria-label="Netflixのプラン">
      <label><input type="radio" name="svc-netflix" data-plan-group="netflix" value=""
                    checked><span>契約なし</span></label>
      <label><input type="radio" name="svc-netflix" data-plan-group="netflix"
                    value="netflix_ad"><span>広告つき<br>890円</span></label>
      <label><input type="radio" name="svc-netflix" data-plan-group="netflix"
                    value="netflix_standard"><span>スタンダード<br>1,590円</span></label>
      <label><input type="radio" name="svc-netflix" data-plan-group="netflix"
                    value="netflix_premium"><span>プレミアム<br>2,290円</span></label>
    </div>
  </div>
  <!-- 以下、Amazon Prime Video / U-NEXT … と続く -->
</details>
```

**必須の設計要件**

1. **各サービスの先頭に「契約なし」ラジオを置く**。ラジオは一度選ぶと解除できないため、これが無いと選択の取り消しができない
2. **`<summary>` に選択件数と小計を表示する**（`sub-badge`）。閉じた状態でも選択状況が把握できる
3. **年額のみのプランは「年額のみ／月額換算◯◯円」と併記する**（§6.2.12 `resolvePlanMonthly`）
4. **既定では `audience:'single'` のプランのみ表示**。「ファミリー・学生プランも表示」トグルで切り替える
5. **`<details name="...">` の排他制御は比較的新しい機能**のため、非対応ブラウザでは複数開くだけで壊れない（プログレッシブ・エンハンスメント）

```css
.sub-category > summary{
  display:flex; justify-content:space-between; align-items:center;
  min-height:44px; padding:var(--sp-3); cursor:pointer;
  list-style:none;                          /* デフォルトの三角を消す */
}
.sub-category > summary::-webkit-details-marker{display:none;}
.sub-category > summary::after{content:'▼'; transition:transform var(--dur) var(--ease);}
.sub-category[open] > summary::after{transform:rotate(180deg);}

.sub-badge{font-size:var(--fs-xs); color:var(--c-brand); font-weight:700;}

.plan-chips{display:flex; flex-wrap:wrap; gap:var(--sp-2);}
.plan-chips label{position:relative;}
.plan-chips input{position:absolute; opacity:0; width:0; height:0;}
.plan-chips span{
  display:inline-flex; align-items:center; justify-content:center; text-align:center;
  min-height:44px; padding:var(--sp-2) var(--sp-3);
  border:1px solid var(--c-border); border-radius:var(--radius);
  font-size:var(--fs-xs); line-height:1.3;
}
/* ★キーボード操作でも選択位置が分かるようにする */
.plan-chips input:focus-visible + span{outline:2px solid var(--c-brand); outline-offset:2px;}
.plan-chips input:checked + span{
  background:var(--c-brand); color:var(--c-bg); border-color:var(--c-brand); font-weight:700;
}
```

#### その他サブスク（自由入力枠）

ジム・習い事・コンタクトの定期便など、**店舗や契約ごとに価格が大きく異なるもの**は、プルダウンで持つと実態と合わず誤った試算になる。最後のカテゴリとして自由入力枠を置く。

```html
<details class="sub-category" name="sub-accordion">
  <summary>
    <span>その他</span>
    <span class="sub-badge" data-bind="text:otherSummary">未入力</span>
  </summary>

  <div class="other-sub-rows" data-other-rows>
    <!-- 1行 = ラベル ＋ 月額。JS で最大5行まで追加する -->
    <div class="other-sub-row" data-row-id="o1">
      <input type="text" class="input input--label" maxlength="30"
             placeholder="ジム" aria-label="サービス名"
             data-other-label="o1">
      <input type="text" inputmode="numeric" pattern="[0-9,]*" class="input"
             placeholder="8,000" aria-label="月額（円）"
             data-other-monthly="o1">
      <button type="button" class="btn-icon" data-action="removeOtherSub"
              data-row-id="o1" aria-label="この行を削除">✕</button>
    </div>
  </div>

  <button type="button" class="btn btn--ghost" data-action="addOtherSub">
    ＋ 行を追加（最大5件）
  </button>
</details>
```

**要件**

1. **上限5行**（`OTHER_SUBSCRIPTION.maxRows`）。到達したら「＋ 行を追加」を `disabled` にする
2. **ラベルは任意**。空でも月額が入っていれば合計に算入する
3. **プレースホルダーで例示する**（ジム／習い事／コンタクトの定期便／新聞／ソフトウェア）。何を入れる枠か伝わらないと使われない
4. **月額の異常値ガード**: 0未満・20万円超・非数値は合計に算入しない（`sumOtherSubscriptions`）
5. **行の削除ボタンには `aria-label` を付ける**（✕だけでは読み上げで意味が伝わらない）
6. ラベルは**マイカルテのキャプチャに含まれる**ため、`sanitizePayload` と同等の個人情報マスクを通すこと

#### 状態管理

選択されたプランIDは State に保持し、合計額は**都度算出する**（派生値をStateに保存しない原則に従う）。

```javascript
// store.js — INITIAL_STATE に追加
selections: {
  subscriptionPlanIds: []          // ★選択されたプランIDの配列。呪文にも含める
}

// app.js — ラジオ変更時の処理
document.addEventListener('change', e => {
  const el = e.target.closest('[data-plan-group]');
  if (!el) return;
  const group = el.dataset.planGroup;
  const all   = C.SUBSCRIPTION_PLANS.flatMap(g => g.services)
                 .find(s => s.id === group)?.plans.map(p => p.id) ?? [];
  // 同一サービスの他プランを除去してから、選択されたものだけ入れる
  const next = state.selections.subscriptionPlanIds.filter(id => !all.includes(id));
  if (el.value) next.push(el.value);
  state.selections.subscriptionPlanIds = next;
  // fixedCosts.subscriptions は selectors 側で sumSubscriptions() により算出する
});
```

**⚠️ 注意**: `fixedCosts.subscriptions` に合計額を書き込んではならない。**選択IDが唯一の入力値**であり、金額は `sumSubscriptions()` の戻り値として都度求める。価格改定があった際に、保存済みの古い合計額が残ると計算が狂うためである。

### 3.10 グラフィック・プレースホルダー設計

素材差し替え時に**DOM構造とJSを一切変更しない**。CSSカスタムプロパティと `data-*` 属性のみで完結させる。

```html
<div class="avatar-frame" data-avatar-key="rank-knight" data-emoji="🛡">
  <!-- ★β版ではSVGアイコンを使用しない（§6.2.13）。
       枠と背景のみで成立させ、将来 --avatar-* に url() を入れるだけで画像化できる -->
  <div class="avatar-placeholder" aria-hidden="true"></div>
</div>
<span class="badge-placeholder" data-bind="text:rankTitle"></span>
```

```css
.avatar-frame{
  position:relative; width:clamp(72px,22vw,128px); aspect-ratio:1/1;
  border-radius:12px; background:#1E293B; border:2px solid #334155;
  overflow:hidden; flex-shrink:0;
}
@supports not (aspect-ratio:1/1){ .avatar-frame::before{content:'';display:block;padding-top:100%;} }

/* SVGもimgも同一の絶対配置ボックスに収める＝差し替えてもレイアウトが動かない */
.avatar-placeholder{position:absolute;inset:0;display:grid;place-items:center;
  background-size:contain;background-position:center;background-repeat:no-repeat;}
/* β版: 画像もSVGも無い状態の見た目を決めておく（枠が空洞に見えないように） */
.avatar-placeholder::after{
  content:attr(data-emoji); font-size:clamp(1.8rem,7vw,3rem); line-height:1;
}
.avatar-img{width:100%;height:100%;object-fit:contain;display:block;}

/* 素材完成後は変数を url() に差し替えるだけ */
:root{
  --avatar-rank-citizen:none; --avatar-rank-swordsman:none; --avatar-rank-knight:none;
  --avatar-rank-mage:none;    --avatar-rank-hero:none;
}
.avatar-frame[data-avatar-key="rank-knight"] .avatar-placeholder{ background-image:var(--avatar-rank-knight); }

/* 称号テキスト長の変動でレイアウトが揺れないよう幅を確保 */
.badge-placeholder{
  display:inline-block; min-width:10em; text-align:center; white-space:nowrap;
  padding:.25rem .75rem; border-radius:999px; font-weight:700;
  font-size:clamp(.7rem,3vw,.85rem);
  background:linear-gradient(90deg,#F59E0B,#FBBF24); color:#0F172A;
}
```

**将来の画像配置時**: html2canvas は別オリジンの画像を描画できない。素材は必ず `/assets/images/` に置き、キャプチャ前に `await Promise.all([...imgs].map(i => i.decode()))` を実行すること。

---

## 4. 機能要件

### 4.1 画面フロー

1. **[STEP 1] クイック診断** — `meta.initialLevel` を確定（以後不変）
2. **[STEP 2] 概算結果 ＆ Xシェア**
3. **[STEP 3] 詳細ダッシュボード** — 公的保障判定、固定費入力、クエスト、マイカルテ、フィードバック

### 4.1a セクション構成（`index.html` の骨格）

> **設計方針**: 本仕様書は **HTML全文を規定しない**。レイアウトの微調整で仕様書が陳腐化するためである。
> 代わりに **①セクションのID・役割・表示条件** と **②`data-bind` / `data-model` の属性契約**（§4.1b）を確定させる。
> §6.6 の `render()` は属性を走査する設計のため、**属性契約さえ守られていれば見た目が多少異なっても壊れない。**

| # | セクションID | STEP | 役割 | 表示条件 |
| :---: | :--- | :---: | :--- | :--- |
| 1 | `sec-quick` | 1 | 額面・年齢・勤続年数・保険者の入力 | 常時 |
| 2 | `sec-result` | 2 | 概算手取り・初期レベル・Xシェア | `meta.hasCompletedStep1` |
| 3 | `sec-hoshou` | 3 | 公的保障の判定カード（高額療養費・傷病手当金） | 同上 |
| 4 | `sec-fixed` | 3 | 固定費入力（通信・保険・サブスク・火災保険） | 同上 |
| 5 | `sec-rent` | 3 | **家賃（参考枠・レベル非算入）** | 同上 |
| 6 | `sec-finance` | 3 | 金融インフラ診断（銀行手数料・クレカ） | 同上 |
| 7 | `sec-quest` | 3 | クエスト一覧（`QUEST_CATALOG` から生成） | 同上 |
| 8 | `sec-karte` | 3 | マイカルテ・画像保存・魔法の呪文 | 同上 |
| 9 | `sheet-feedback` | — | フィードバックのボトムシート | 手動／自動起動時 |

**🔴 セクション5（`sec-rent`）を4と分離する理由**: 家賃はレベル算入対象外（§3.3）である。同じカード群に混ぜると、ユーザーが「家賃を下げればレベルが上がる」と誤認する。**視覚的にも別ブロックとして配置し、見出しに「参考」と明記すること。**

**DOM構造の最小要件**

```html
<main>
  <header class="app-header">
    <!-- レベル・称号は常時可視。position:sticky で追従させる -->
    <span data-bind="text:displayLevel"></span>
    <span data-bind="text:rankTitle"></span>
    <div class="progress"><div class="progress__fill" data-bind="progress:progressPct"></div></div>
  </header>

  <section id="sec-quick">…</section>
  <section id="sec-result" data-bind="toggle:hasCompletedStep1">…</section>
  <!-- 以下 sec-hoshou 〜 sec-karte -->
</main>
<nav class="bottom-nav">…</nav>
<div id="sheet-feedback" class="bottom-sheet" hidden>…</div>
```

### 4.1b バインディング契約表

**この表がHTMLとJSの唯一の契約である。**表に無い属性を実装してはならず、表にある属性を欠いてもならない。

#### 表示バインド（`data-bind`）

| 属性値 | 参照先 | 配置セクション | 書式 |
| :--- | :--- | :--- | :--- |
| `text:displayLevel` | `selectors.displayLevel` | header | 整数 |
| `text:moneyLevel` | `selectors.moneyLevel` | `sec-karte` | 整数（内訳表示用） |
| `text:bonusLevel` | `selectors.bonusLevel` | `sec-karte` | 整数（0 or 1） |
| `text:rankTitle` | `selectors.rank(state).title` | header / `sec-karte` | 文字列 |
| `text:annualGainFormatted` | `selectors.annualGainFormatted` | `sec-karte` | カンマ区切り |
| `text:monthlyGain` | `selectors.monthlyGain` | `sec-quest` | カンマ区切り |
| `text:netIncome` | `selectors.netIncome` | `sec-result` | カンマ区切り |
| `text:nextLevelGap` | `selectors.nextLevelGap` | header | カンマ区切り |
| `text:selfPayCap` | `calc.calcFinalSelfPay` | `sec-hoshou` | カンマ区切り |
| `text:injuryDaily` | `calc.calcInjuryAllowanceDaily` | `sec-hoshou` | カンマ区切り |
| `text:rentOverMarket` | `calc.calcRentGap().overMarket` | `sec-rent` | カンマ区切り |
| `text:rentPaybackYears` | `calc.calcRentGap().paybackYears` | `sec-rent` | 小数第1位 |
| `text:bankFeeAnnual` | `calc.calcBankFeeLoss().annualLoss` | `sec-finance` | カンマ区切り |
| `text:cardLossAnnual` | `calc.calcCreditCardLoss().annualLoss` | `sec-finance` | カンマ区切り |
| `progress:progressPct` | `selectors.progressPct` | header | 0〜100（`--progress` に `%` 付きで設定） |
| `toggle:hasCompletedStep1` | `state.meta.hasCompletedStep1` | `sec-result` 以降 | 真偽（`hidden` を制御） |
| `toggle:isKumiai` | `userProfile.insuranceType === 'kumiai'` | `sec-hoshou` | 付加給付欄の出し分け |
| `toggle:isRevolvingAlert` | `calc.calcCreditCardLoss().isRevolvingAlert` | `sec-finance` | リボ警告の表示 |
| `text:otherSummary` | その他サブスクの件数と小計 | `sec-fixed` | 「2件・11,000円」形式 |
| `text:smartphoneJudge` | `judgeSmartphoneCost().level` に対応する文言 | `sec-fixed` | 3段階（§12.6 K-02） |
| `toggle:hasSubscription` | サブスク選択が1件以上あるか | `sec-fixed` | Empty State の出し分け |

#### 入力バインド（`data-model`）

| 属性値 | State パス | セクション | 入力型 |
| :--- | :--- | :--- | :--- |
| `userProfile.grossSalary` | 月額報酬（額面・円） | `sec-quick` | 数値 |
| `userProfile.age` | 年齢 | `sec-quick` | 数値 |
| `userProfile.yearsOfService` | 勤続年数 | `sec-quick` | 数値 |
| `userProfile.insuranceType` | `'association'` / `'kumiai'` | `sec-quick` | select |
| `userProfile.isUnderOneYear` | 健保加入12ヶ月未満 | `sec-quick` | checkbox |
| `userProfile.isResidentTaxExempt` | 住民税非課税 | `sec-quick` | checkbox |
| `userProfile.kumiaiAverage` | 組合の平均標準報酬月額 | `sec-hoshou` | 数値（組合選択時のみ） |
| `userProfile.fukaKyufuCap` | 付加給付の上限 | `sec-hoshou` | 数値（組合選択時のみ） |
| `userProfile.area` | 家賃平均のエリア | `sec-rent` | select |
| `userProfile.hourlyWage` | 時給（タイパ換算用） | `sec-quest` | 数値 |
| `fixedCosts.rent` | 家賃 | `sec-rent` | 数値 |
| `fixedCosts.smartphone` | 通信費 | `sec-fixed` | 数値 |
| `fixedCosts.medicalInsurance` | 医療保険 | `sec-fixed` | 数値 |
| `fixedCosts.fireInsurance` | 火災保険 | `sec-fixed` | 数値 |
| `fixedCosts.subscriptions` | サブスク合計 | `sec-fixed` | **プラン選択から自動算出（直接入力させない）** |
| `fixedCosts.bankFee` | 銀行手数料 | `sec-finance` | 数値 |
| `finance.atmCountOffHours` | **時間外・土日祝**のATM利用回数（ラベルに必ず明記） | `sec-finance` | 数値 |
| `finance.transferCount` | 他行宛ネット振込の回数（220円固定で算出） | `sec-finance` | 数値 |
| `fixedCosts.cardReward` | カード還元の機会損失 | `sec-finance` | 数値 |
| `optimized.*` | 各項目の見直し後の額 | 各カード内 | 数値 |

#### アクション（`data-action`）

| 属性値 | 処理 | 配置 |
| :--- | :--- | :--- |
| `startDiagnosis` | STEP1確定・`meta.initialLevel` 設定 | `sec-quick` |
| `shareX` | Xシェア（**`moneyLevel` のみ・金額なし**） | `sec-result` / `sec-karte` |
| `saveKarte` | キャプチャ→保存（§4.4） | `sec-karte` |
| `copySpell` | 呪文をクリップボードへ | `sec-karte` |
| `restoreSpell` | 呪文から復元 | `sec-karte` |
| `assistFireInsurance` | 相場（月833円）を自動補完 | `sec-fixed` |
| `addOtherSub` / `removeOtherSub` | その他サブスクの行を追加・削除（最大5行） | `sec-fixed` |
| `openFeedback` / `closeFeedback` | ボトムシートの開閉 | 全体 |
| `submitFeedback` | フィードバック送信（§6.8） | `sheet-feedback` |

#### その他の属性

| 属性 | 用途 |
| :--- | :--- |
| `data-quest-toggle="{questId}"` | クエストのチェックボックス（`todoStatus` を更新）。`aria-label` には **`plainTitle`** を設定する |
| `data-plan-group="{groupId}"` | サブスクのプラン選択グループ（§6.2.12） |
| `data-other-label="{rowId}"` | その他サブスクのサービス名（任意入力・最大30字） |
| `data-other-monthly="{rowId}"` | その他サブスクの月額 |
| `data-composing="0\|1"` | IME変換中フラグ（§6.7 が管理） |

**⚠️ 実装時の禁止事項**: 上表に無いセレクタを `render()` 内で `querySelector` してはならない。**DOM構造への依存を属性契約のみに閉じ込める**ことで、HTMLの改修がJSを壊さない状態を保つ。

### 4.2 Xシェア機能（**レベル・称号のみ。金額はマイカルテのみ表示**）

> **設計の意図**
> - **マイカルテ（内部・プライベート）**: 「Lv.25 ／ 年間 600,000 円増える潜在能力」と**金額付きで、ユーザー自身の達成感を実感**
> - **Xシェア（外部公開）**: 「Lv.25 達成」と**相対的な成長だけを共有**。個人の金額情報を保護しながら、シェアのハードルを下げる

```javascript
// 称号・レベルはすべて selectors から動的生成。文字列直書きを禁止する
const lv   = selectors.moneyLevel(state);          // ★displayLevel ではない
const rank = selectors.rank(state).title;          // ★RANK_TABLE から取得
const init = state.meta.initialLevel ?? 1;

// ★金額は含めない（プライバシー配慮 ＋ シェア率向上）
const text =
  `【てどりクエスト】手取り防衛レベルが Lv.${init} から`
  + `【Lv.${lv} ${rank}】にアップした！`
  + ` #てどりクエスト #手取り最大化`;

// ★encodeURIComponent を通さないと "#" 以降が切れて投稿文が壊れる
const url = `https://x.com/intent/post`
  + `?text=${encodeURIComponent(text)}`
  + `&url=${encodeURIComponent(SITE_URL)}`;
```

### 4.2.1 マイカルテ内での金額表示（内部向け・プライベート）

自分で見るマイカルテ画面では、年間増額の詳細を表示する。

```html
<section class="karte-detail">
  <h2 class="karte-title" data-bind="text:rankTitle"></h2>
  <p class="karte-level">
    <span class="level-display" data-bind="text:displayLevel"></span>
  </p>
  <p class="karte-amount">
    年間で手取りが 
    <strong class="amount-emphasis" data-bind="text:annualGainFormatted"></strong> 円
    増える潜在能力があります
    <small class="disclaimer">
      （試算値です。実際の給付額・控除額とは異なる可能性があります）
    </small>
  </p>
</section>
```

```css
.karte-amount{font-size:1.1rem; font-weight:500; color:#10B981;}
.amount-emphasis{font-size:1.3rem; font-weight:700;}
.disclaimer{display:block; font-size:0.75rem; color:#94A3B8; margin-top:0.5rem;}
```

### 4.3 レベル通知（連射防止）

```javascript
let lastNotifiedLevel = null, toastTimer = null;

function maybeNotifyLevelUp(){
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    const lv = selectors.displayLevel(state);
    if (lastNotifiedLevel === null){ lastNotifiedLevel = lv; return; }
    const diff = lv - lastNotifiedLevel;
    if (diff > 0) enqueueToast(`LEVEL UP! +${diff} Lv`, 'levelup');
    lastNotifiedLevel = lv;                        // 下降時は通知せず基準のみ更新
  }, 600);
}
```

トーストはキュー管理し、同時表示は最大1件・待機は最大3件（超過分は破棄）。

### 4.4 マイカルテ画像出力

```javascript
export async function captureCard(el){
  // ★外部ライブラリは js/vendor.js 経由で取得する（N-1）
  //   CDNのURLを直書きしないことで、将来 npm + バンドラを導入する際に
  //   vendor.js の1ファイルを差し替えるだけで済む
  const html2canvas = await loadHtml2Canvas();
  await document.fonts.ready;                        // フォント未ロードによる文字化け防止

  const rect = el.getBoundingClientRect();
  const MAX_AREA = 4 * 1024 * 1024;                  // iOS の Canvas 面積上限に対し保守的に設定
  let scale = 2;
  while (rect.width*scale * rect.height*scale > MAX_AREA && scale > 1) scale -= 0.25;

  try{
    const canvas = await html2canvas(el, {
      scale, backgroundColor:'#0F172A', useCORS:true, logging:false,
      windowWidth: document.documentElement.clientWidth,
      scrollX:0, scrollY:-window.scrollY              // 無いとスクロール量分ずれる
    });
    if (!hasVisiblePixels(canvas)) throw new Error('blank canvas');  // 無音で壊れさせない
    return canvas;
  }catch(e){
    showToast('画像を作成できませんでした。印刷機能で保存できます','warn');
    window.print();
    return null;
  }
}

// iOS Safari は <a download> を無視するため段階的フォールバックが必須
export async function saveCard(canvas){
  const blob = await new Promise(r => canvas.toBlob(r,'image/png'));
  const file = new File([blob],'tedori-quest-karte.png',{type:'image/png'});

  if (navigator.canShare?.({files:[file]})){         // ① 共有シート（iOS/Android）
    try{ await navigator.share({files:[file],title:'てどりクエスト マイカルテ'}); return; }
    catch(e){ if (e.name === 'AbortError') return; }
  }
  if (!isIOS()){                                     // ② 通常ダウンロード（デスクトップ）
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'),{href:url,download:'tedori-quest-karte.png'}).click();
    setTimeout(()=>URL.revokeObjectURL(url),1000); return;
  }
  showImageModal(canvas.toDataURL('image/png'),      // ③ 長押し保存を案内
    '画像を長押しして「写真に追加」を選んでください');
}
```

```css
/* キャプチャ安全CSS：html2canvas 非対応プロパティを無効化 */
.capture-safe, .capture-safe *{
  backdrop-filter:none !important; filter:none !important; box-shadow:none !important;
}
.capture-safe{ background-color:#0F172A !important; color:#E2E8F0 !important; }
.capture-safe .card{ background-color:#1E293B !important; border-color:#334155 !important; }
.capture-safe .accent{ color:#10B981 !important; }
.capture-safe .gold{ color:#F59E0B !important; }

/* プリントCSSフォールバック：Dark Mode のまま印刷すると判読不能になるため反転させる */
@media print{
  *{-webkit-print-color-adjust:exact !important; print-color-adjust:exact !important;}
  body{background:#fff !important; color:#0F172A !important;}
  .karte-card{background:#fff !important; border:2px solid #0F172A !important;
              break-inside:avoid; page-break-inside:avoid;}
  .karte-card .accent{color:#047857 !important;}
  .karte-card .gold{color:#B45309 !important;}
  .bottom-nav,.btn,.toast,.beta-badge{display:none !important;}
  @page{margin:12mm;}
}
```

### 4.5 「魔法の呪文」バックアップ

```javascript
// store.js — btoa は日本語で InvalidCharacterError を投げるため TextEncoder 経由が必須
export function encodeSpell(state){
  // ★入力値のみを含める。派生値は復元時に再計算する
  const payload = {
    v: state.schemaVersion,
    m: { il: state.meta.initialLevel, fb: state.meta.feedbackBonusGranted },
    u: state.userProfile, f: state.fixedCosts, o: state.optimized, t: state.todoStatus,
    s: state.selections                    // ★サブスク選択も復元対象（§3.9）
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const bin   = Array.from(bytes, b => String.fromCharCode(b)).join('');
  const b64   = btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return `TQ1-${b64}`;
}

export function decodeSpell(code){
  const m = /^TQ(\d+)-([A-Za-z0-9\-_]+)$/.exec(String(code).trim());
  if (!m) throw new Error('形式が正しくありません');
  const b64   = m[2].replace(/-/g,'+').replace(/_/g,'/');
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return { version:Number(m[1]), data: JSON.parse(new TextDecoder().decode(bytes)) };
}
```

**復元時の必須要件**: 必ず `try/catch` し、失敗時は「呪文が正しくないようです。もう一度コピーし直してください」と表示。**復元成功が確定するまで `localStorage` に書き込まない**（既存データを破壊しない）。

### 4.6 クリップボードコピー（iOS対応）

```javascript
async function copySpell(btn){
  const text = encodeSpell(state);                   // ★await を挟まず同期で用意
  try{
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else legacyCopy(text);
  }catch{ legacyCopy(text); }
  flashButton(btn,'コピーしました！');
}

function legacyCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text; ta.readOnly = true; ta.contentEditable = 'true';  // readOnly でキーボード抑止
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;';
  document.body.appendChild(ta);
  const range = document.createRange(); range.selectNodeContents(ta);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
  ta.setSelectionRange(0, text.length);
  document.execCommand('copy');
  document.body.removeChild(ta);
}

function flashButton(btn, tempLabel, ms = 2000){
  if (!btn.dataset.originalLabel) btn.dataset.originalLabel = btn.textContent;  // 初回のみ退避
  clearTimeout(Number(btn.dataset.flashTimer));                                 // 既存タイマー破棄
  btn.textContent = tempLabel;
  btn.classList.add('is-copied');
  btn.setAttribute('aria-live','polite');
  const id = setTimeout(() => {
    btn.textContent = btn.dataset.originalLabel;
    btn.classList.remove('is-copied');
    delete btn.dataset.flashTimer;
  }, ms);
  btn.dataset.flashTimer = String(id);
}
```

```css
.btn-copy-spell{min-width:14rem; justify-content:center;}  /* ラベル長変化での伸縮を防ぐ */
.btn-copy-spell.is-copied{background-color:#10B981;}
```

### 4.7 将来検討機能

* **iPhoneカレンダー（.ics）連携**: iOS Safari のダウンロード制限を考慮し、data URI または `navigator.share` 経由で `.ics`（`TZID=Asia/Tokyo`, `TRIGGER:-PT15M`）を渡す

---

## 5. 戦略的「No-Go」要件

以下は**一切導入しない**。

1. 金融機関・クレジットカード自動連携機能
2. 扶養家族・配偶者・共働き等の世帯向け汎用計算機能
3. 100年長期ライフプランシミュレーション
4. 専門家（FP等）への個別チャット・対面相談誘導
5. カテゴリ別予算管理・過年度履歴データの蓄積
6. SE再生機能（Web Audio API等）

---

## 6. データ仕様 ＆ 法令アルゴリズム

### 6.1 ファイル構成

```
tedori-quest/
├── index.html
├── privacy.html              # プライバシーポリシー・免責事項
├── tests.html                # ★ブラウザで開くだけで動くテストランナー
├── style.css                 # ★素のCSS（ビルド出力ではない。直接編集する）
├── _headers                  # CSP等のセキュリティヘッダー
├── js/
│   ├── config.js             # 【定数のみ】ロジック記述を禁止
│   ├── vendor.js             # ★外部ライブラリの唯一の入り口（N-1）
│   ├── calc.js               # 純粋関数。DOM/window/localStorage に触れない
│   ├── selectors.js          # 派生値。純粋関数のみ
│   ├── store.js              # deepReactive / persist / migrate / 呪文
│   ├── feedback.js           # 送信・レート制限・サニタイズ
│   ├── ui.js                 # render / toast / sheet / capture / clipboard
│   └── app.js                # 初期化・イベント委譲
├── tests/
│   ├── runner.js             # ★ブラウザ用の最小ランナー（依存ゼロ）
│   ├── harness.js            # ★ブラウザ／Node の自動切替層（N-3）
│   ├── calc.test.js          # TEST-01〜30, 52〜54, 56
│   ├── store.test.js         # TEST-42〜45, 51
│   └── feedback.test.js      # TEST-31〜41, 46〜50
├── functions/api/feedback.js # Cloudflare Pages Functions（キー隠蔽プロキシ）
└── assets/images/            # 【空でOK】将来のドット絵置き場
                              #  ※ icons.svg は β版では作成しない（§6.2.13）

★ 既定では存在しないもの: package.json / node_modules / dist/ / ビルド設定ファイル
   （§17 の Level 1 以降で必要になった時点で「追加」する。既存ファイルの移動は発生しない）
```

**分割の鉄則**
1. `calc.js` / `selectors.js` は DOM・`window`・`localStorage` に一切触れない（テスト可能性を保つ）
2. `config.js` はデータのみ。「法令が変わったら config.js だけ見ればよい」状態を維持する
3. ES Modules は `file://` では動作しない（CORSエラーになる）。必ずHTTPサーバー経由で開く

### 6.1a ローカル開発の起動手順（Node 不要）

```bash
cd tedori-quest
python3 -m http.server 8000       # macOS には python3 が標準搭載されている
```

ブラウザで以下を開く。

| URL | 用途 |
| :--- | :--- |
| `http://localhost:8000/` | アプリ本体 |
| `http://localhost:8000/tests.html` | **テストランナー（全83件の結果が表示される）** |

**注意**: `functions/api/feedback.js` は `python3 -m http.server` では動作しない（Cloudflare 上でのみ動く）。ローカルでフィードバック送信を試す場合は、`js/config.js` の `ENDPOINT` を一時的にモックへ向けるか、Cloudflare のプレビューデプロイで確認する（§6.9a）。

### 6.1b HTMLからの読み込み方（バンドラ不要）

```html
<!-- ★type="module" があれば import が使える。バンドラは不要 -->
<script type="module" src="js/app.js"></script>
```

`app.js` の中で `import { state } from './store.js'` と書けば、ブラウザが依存関係を自動で解決する。**拡張子 `.js` を省略しないこと**（ブラウザは Node と違い拡張子を補完しない。これは Node-Ready 原則 N-2 でもある）。

### 6.1c 外部ライブラリの取得口（`js/vendor.js`）— N-1 対応

**外部CDNの URL を各ファイルに直書きしてはならない。**必ず本ファイルに集約する。

```javascript
// js/vendor.js
// ★外部依存の唯一の入り口。CDN URL をここ以外に書かないこと。
//   将来 npm + バンドラを導入する場合、本ファイルだけを差し替えれば移行が完了する。

/** html2canvas のバージョン。★latest 指定は破壊的変更で壊れるため固定する */
const HTML2CANVAS_VERSION = '1.4.1';

let _html2canvas = null;

/**
 * html2canvas を遅延ロードして返す。2回目以降はキャッシュを返す。
 * @returns {Promise<Function>}
 */
export async function loadHtml2Canvas(){
  if (_html2canvas) return _html2canvas;

  // === ビルドレス構成（現行）===
  const mod = await import(
    `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/${HTML2CANVAS_VERSION}/html2canvas.esm.js`);

  // === npm + バンドラ導入時は上記2行を下記に差し替えるだけでよい ===
  // const mod = await import('html2canvas');

  _html2canvas = mod.default ?? mod;
  return _html2canvas;
}
```

**この1ファイルを挟むだけで、Level 4（バンドル導入）の作業が「1ファイルの2行差し替え」に縮小する。**直書きした場合は全利用箇所の修正が必要になる。

### 6.1d JSDoc 規約（型チェックの前倒し）

TypeScript はビルドを要するため採用しないが、**JSDoc で型を書いておけば、後から `tsc --checkJs` を無改修で適用できる**（§17 Level 2）。以下を最低限のルールとする。

```javascript
/**
 * 報酬月額から健康保険の標準報酬月額の行を引く。
 * @param {number|null} reward 月額報酬（額面・円）
 * @returns {{grade:number, standard:number, lower:number, upper:number}|null}
 *          不正な入力の場合は null
 */
export function lookupStandardMonthly(reward){ /* … */ }

/**
 * @typedef {Object} SocialInsuranceResult
 * @property {number} total 本人負担の合計額（月額・円）
 * @property {{health:number, pension:number, employment:number}} breakdown 内訳
 * @property {boolean} isNursing 介護保険料が課されているか
 */
```

**適用範囲**
* `calc.js` / `selectors.js` の **export された全関数**（必須）
* `store.js` の `State` 構造（`@typedef` で1回定義すれば足りる）
* `ui.js` / `app.js` は任意（DOM操作が主で型の恩恵が小さい）

**書かないこと**: 「何をしているか」の説明。それはコードが語る。JSDoc には**引数の単位・境界・null の扱い**など、コードから読み取れない契約を書く。

### 6.2 定数定義（`js/config.js`）

```javascript
// ===========================================================================
// 適用年度: 2026年度（令和8年度）
// 更新周期: 年1回（毎年3月・8月に見直すこと）
// ===========================================================================

export const APPLIED_FISCAL_YEAR = '2026';
export const SYSTEM_BASE_DATE    = '2026-08-01';   // UI に「本試算は2026年8月1日時点の制度に基づきます」と表示

// ---------------------------------------------------------------------------
// 6.2.1 標準報酬月額テーブル（健康保険 全50等級）
//   ✅ 全50等級を協会けんぽ「令和8年度保険料額表（大阪府）」と突合済み（2026-08-05）
//      https://www.kyoukaikenpo.or.jp/assets/R8_27osaka.pdf
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
export const PENSION_GRADE_OFFSET = 3;
export const PENSION_MIN_STANDARD =  88000;   // 厚年 第1級
export const PENSION_MAX_STANDARD = 650000;   // 厚年 第32級

// ---------------------------------------------------------------------------
// 6.2.2 社会保険料率（令和8年度・大阪府）
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
// ★健保とは適用開始月が1ヶ月ずれるため別テーブルにする
export const CHILDCARE_SUPPORT_RATES = [
  { effectiveFrom: '2026-04-01', rate: 0.0023 }   // 4月分（5月納付分）から
];

// 雇用保険料率（労働者負担分・一般の事業）
// 出典: 厚生労働省「令和8年度の雇用保険料率について」
//       https://www.mhlw.go.jp/content/001692566.pdf
// ★労使折半ではない（令和8年度の事業主負担は 8.5/1000）
// ★「給与の締日」ではなく「支払日」を基準に適用料率を判定する
export const EMPLOYMENT_INSURANCE_RATES = [
  { effectiveFrom: '2025-04-01', employee: 0.0055 },   // 令和7年度 5.5/1000
  { effectiveFrom: '2026-04-01', employee: 0.0050 }    // 令和8年度 5.0/1000（引き下げ）
];

export const NURSING_CARE_MIN_AGE = 40;   // 介護保険第2号被保険者は40歳から

// ---------------------------------------------------------------------------
// 6.2.3 高額療養費 自己負担限度額（70歳未満）
//   ★2026年8月診療分から改定。多数回該当は据え置き。年間上限が新設
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

export const RESIDENT_TAX_EXEMPT_YEARS = 1;   // 勤続1年目は住民税ゼロ

// ---------------------------------------------------------------------------
// 6.2.6 レベル・称号
// ---------------------------------------------------------------------------
export const LEVEL_UNIT   = 5000;
export const LEVEL_MIN    = 1;
export const LEVEL_MAX    = 999;
export const BONUS_LEVEL_MAX = 1;

export const RANK_TABLE = [
  { min:  1, max:  5, title:'手取り見習い市民',     avatarKey:'rank-citizen'   },
  { min:  6, max: 15, title:'駆け出し節約剣士',     avatarKey:'rank-swordsman' },
  { min: 16, max: 30, title:'公的保障の騎士',       avatarKey:'rank-knight'    },
  { min: 31, max: 49, title:'手取り防衛の大魔導士', avatarKey:'rank-mage'      },
  { min: 50, max: Infinity, title:'伝説の手取り勇者', avatarKey:'rank-hero'    }
];

// ---------------------------------------------------------------------------
// 6.2.7 レベル算入対象（家賃はレベル非算入）
// ---------------------------------------------------------------------------
export const IMMEDIATE = ['smartphone','subscriptions','fireInsurance',
                          'medicalInsurance','bankFee','cardReward'];
export const HIGH_COST = ['rent'];   // 引っ越し初期費用が高いため参考枠のみ
export const MOVING_COST_MONTHS = 5; // 初期費用の目安（家賃の5ヶ月分）※回収年数の算出に使用

// ---------------------------------------------------------------------------
// 6.2.8 黄金比（手取りに対する割合の目安）
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
// ★単身向け（1R/1K/1DK等）の平均賃料。ファミリー物件を含まない
export const MARKET_AVERAGE_RENT = {
  tokyo:    76000,   // 東京都
  osaka:    59000,   // 大阪府
  urban:    52000,   // 地方主要都市（愛知・福岡等）
  other:    42800,   // その他地域
  nation:   53000,   // 全国平均（参考表示用）
  _default: 'urban'
};

// 出典: 総務省統計局「家計調査（家計収支編）」2024年平均・単身世帯の移動電話通信料
//       https://www.stat.go.jp/data/kakei/sokuhou/tsuki/pdf/fies_gaikyo2024.pdf
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
// 出典: 各少額短期保険業者の標準提供相場／日本損害保険協会
// ★不動産会社経由の大手損保プランと、ネット型少額短期保険で約2倍の開きがある
export const FIRE_INSURANCE = {
  agencyTwoYear:  { min:15000, max:20000 },   // 不動産会社経由（大手損保）2年契約
  onlineTwoYear:  { min: 8000, max:12000 },   // ネット型少額短期保険 2年契約
  assistMonthly:  729,                        // 「わからない」時の補完値（2年17,500円の中央値÷24）
  reviewThreshold:15000                       // 2年でこの額を超える場合に見直しを案内する
};
export const FIRE_INSURANCE_ASSIST_MONTHLY = FIRE_INSURANCE.assistMonthly;

// 銀行手数料
// 出典: みずほ銀行・三菱UFJ銀行・三井住友銀行 各行の手数料表（2026年基準）
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

export const NEGLECT_YEARS = 10;
export const NISA_ANNUAL_RETURN = 0.05;
export const NISA_DISCLAIMER =
  '過去の市場平均に基づく仮定値であり、将来の運用成果を保証するものではありません。';

// ---------------------------------------------------------------------------
// 6.2.10 通信・永続化
// ---------------------------------------------------------------------------
export const ENDPOINT   = '/api/feedback';   // ★同一オリジンのプロキシ。Web3Forms を直接叩かない
export const SITE_URL   = 'https://tedori-quest.com';
export const STORAGE_KEY = 'tq_state_v1';
export const RATE_LIMIT = { maxPerDay:3, cooldownMs:10000, windowMs:86400000 };
export const FETCH_TIMEOUT_MS = 10000;
export const COMMENT_MAX_LENGTH = 1000;

// ---------------------------------------------------------------------------
// 6.2.11 クエストカタログ
//   ★文言をHTML/JSに直書きしないこと。表現の修正が1箇所で済む状態を保つ
//   ★talkScript は「解約させる台本」ではなく「手続きを円滑に進める確認事項リスト」
//     として書くこと（§3.7a 参照）
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Quest
 * @property {string}   id          todoStatus のキーと一致させること
 * @property {string}   title       動詞は「検討する」「確認する」を基本形とする
 * @property {string}   target      fixedCosts のキー（IMMEDIATE のいずれか）
 * @property {string}   basis       なぜ見直せるかの根拠。出典を含めること
 * @property {'easy'|'medium'|'hard'} difficulty  実行難易度
 * @property {string[]} talkScript  問い合わせ時の確認事項リスト
 * @property {string}   disclaimer  個別事情により最適解が異なる旨
 */

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
    completeLabel: '🎉 解呪完了（装備変更）',
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
    completeLabel: '🎉 呪縛解除（ジョブチェンジ）',
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
    completeLabel: '🎉 点検完了（バリア発動）',
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
    completeLabel: '🎉 浄化完了（カード錬金）',
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

  {
    id: 'cancelSubscription',
    questTitle:  '【潜む吸血魔素の追放】使っていないサブスクを断ち切れ！',
    plainTitle:  '利用していないサブスクがないか確認する',
    summary:     '未利用サブスク（動画・音楽配信等）の整理',
    description: '月に数回しか使っていない動画・音楽配信は、手取りをじわじわ奪う吸血魔素！'
               + 'カード明細から幽霊サブスクを発見し、'
               + '今の自分に必要なものだけを残して契約を整理しよう！',
    actionLabel:   '⚔️ サブスク一覧を洗い出す',
    completeLabel: '🎉 追放完了（契約整理）',
    clearMessage:  '🗡️ 討伐完了！『隠れた毎月の手取り漏れ』を遮断した！',
    target: 'subscriptions',
    difficulty: 'easy',
    basis: '選択されたプランの月額合計（§6.2.12 の価格データに基づく概算）。'
         + '同じカテゴリで複数契約している場合や、'
         + 'Amazon プライムと Prime Video のように会費が重複している場合は特に確認の余地があります。',
    talkScript: [
      '最後に利用した日はいつか（各サービスの視聴履歴で確認できます）',
      '年額プランの場合、次回更新日と中途解約時の返金の可否',
      'App Store / Google Play 経由の課金か（その場合は各ストアから手続きが必要です）',
      '無料体験中でないか。体験終了日はいつか',
      '解約後、ダウンロード済みのコンテンツが視聴できなくなるか',
      '通信キャリアのセット割やポイント還元の対象になっていないか'
    ],
    disclaimer: '年額プランの場合、解約時期により返金の扱いが異なります。'
  },

  {
    id: 'changeBank',
    questTitle:  '【手数料毒の無効化】ゼロフリーバンクを開放せよ！',
    plainTitle:  '銀行の手数料無料条件を確認する',
    summary:     'ATM・他行振込手数料が無料になる銀行への切り替え',
    description: '時間外ATM利用や他行振込で毎月払っている手数料は、手取りを蝕む毒ダメージ！'
               + '残高や給与振込の条件に応じて一定回数まで手数料が無料になる銀行へ'
               + '給与・引き落とし口座を紐付け、無駄な出費を抑えよう！',
    actionLabel:   '⚔️ 手数料発生状況を見る',
    completeLabel: '🎉 毒無効化（エリア解放）',
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
    completeLabel: '🎉 宝箱解放（内容を確認）',
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
//   ★出典: 国内主要サブスクリプション価格調査（2026年8月時点）
//   ★更新周期: 四半期ごと（§14 の年次カレンダー参照）
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
  ]},

  { id:'life', label:'ライフ・配送', services:[
    { id:'amazonprime', name:'Amazon プライム', plans:[
      { id:'amazonprime_general', label:'一般',          monthly:600, audience:'single',
        note:'Prime Video を選択済みの場合は重複しません（同一会費）' },
      { id:'amazonprime_student', label:'Prime Student', monthly:300, audience:'student' }
    ]},
    { id:'uberone', name:'Uber One', plans:[
      { id:'uberone_standard', label:'標準プラン', monthly:698, audience:'single' },
      { id:'uberone_student',  label:'学生プラン', monthly:298, audience:'student' }
    ]},
    { id:'timescar', name:'タイムズカー', plans:[
      { id:'timescar_individual', label:'個人プラン', monthly:880, audience:'single',
        note:'基本料金。利用料金へ充当可能' }
    ]}
  ]}
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
  maxRows: 5,                       // 入力欄の上限。増やしすぎると入力負荷ゼロが崩れる
  labelMaxLength: 30,
  monthlyMax: 200000,               // 異常値ガード
  placeholders: ['ジム', '習い事', 'コンタクトの定期便', '新聞', 'ソフトウェア']
};

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
// 6.2.13 アイコン定義 — 【β版では実装しない】
//   ★初期リリースではアイコンを使用せず、テキストと絵文字のみで構成する。
//     assets/icons.svg は作成しない。<use href="..."> を書かないこと。
//   ★将来導入する場合は §13.3 の記載を更新し、ライセンス表記の要否を
//     §12.4 に L-09 として登録すること。
// ---------------------------------------------------------------------------
export const USE_SVG_ICONS = false;
```

### 6.3 純粋関数（`js/calc.js`）

```javascript
import * as C from './config.js';

// --- 汎用ヘルパ -------------------------------------------------------------
export function pickEffective(list, at = new Date()){
  const t = new Date(at).getTime();
  return list.filter(r => new Date(r.effectiveFrom).getTime() <= t)
             .sort((a,b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom))[0];
}

// --- 標準報酬月額 -----------------------------------------------------------
export function lookupStandardMonthly(reward){
  const r = Number(reward);
  if (!Number.isFinite(r) || r < 0) return null;                    // NaN / 負値ガード
  const row = C.HEALTH_INSURANCE_TABLE.find(t => r >= t.lower && r < t.upper);
  return row ?? C.HEALTH_INSURANCE_TABLE.at(-1);                    // 上限超過は最高等級
}

export function lookupPensionStandard(reward){
  const health = lookupStandardMonthly(reward);
  if (!health) return null;
  return Math.min(C.PENSION_MAX_STANDARD, Math.max(C.PENSION_MIN_STANDARD, health.standard));
}

// --- 社会保険料（本人負担） -------------------------------------------------
/**
 * 社会保険料の折半額を丸める。
 * ★通貨の丸めは「50銭以下は切り捨て、50銭を超える場合は切り上げ」と規定されている。
 *   JS の Math.round は 0.5 を切り上げてしまうため使用してはならない。
 * @param {number} v
 * @returns {number}
 */
export function roundInsuranceShare(v){
  const floor = Math.floor(v);
  return (v - floor) > 0.5 ? floor + 1 : floor;
}

export function calcSocialInsurance(reward, age, at = new Date()){
  const rates   = pickEffective(C.INSURANCE_RATES, at);
  const childCare = pickEffective(C.CHILDCARE_SUPPORT_RATES, at);   // ★適用開始が1ヶ月遅い
  const empIns    = pickEffective(C.EMPLOYMENT_INSURANCE_RATES, at);
  const health  = lookupStandardMonthly(reward);
  if (!health) return { total:0, breakdown:{} };

  const std        = health.standard;
  const pensionStd = lookupPensionStandard(reward);
  const isNursing  = Number(age) >= C.NURSING_CARE_MIN_AGE;         // ★40歳未満は課さない

  let healthRate = rates.healthTotal;
  if (childCare) healthRate += childCare.rate;                      // 子ども・子育て支援金
  if (isNursing) healthRate += rates.nursingCareTotal;

  const b = {
    health:     roundInsuranceShare(std * healthRate * rates.employeeShare),
    pension:    roundInsuranceShare(pensionStd * rates.pensionTotal * rates.employeeShare),
    // ★雇用保険は労使折半ではない。標準報酬ではなく実際の報酬額に料率を掛ける
    employment: roundInsuranceShare(Math.max(0, Number(reward) || 0) * (empIns?.employee ?? 0))
  };
  return { total: b.health + b.pension + b.employment, breakdown: b, isNursing };
}

// --- 手取り -----------------------------------------------------------------
export function calcNetIncome({ reward, age, yearsOfService }, at = new Date()){
  const gross  = Math.max(0, Number(reward) || 0);
  const social = calcSocialInsurance(gross, age, at);
  const tax    = C.TAX_CONSTANTS.find(t => t.appliedYear === Number(C.APPLIED_FISCAL_YEAR))
               ?? C.TAX_CONSTANTS.at(-1);

  const annualGross   = gross * 12;
  const salaryDeduct  = calcSalaryDeduction(annualGross, tax);
  const totalIncome   = Math.max(0, annualGross - salaryDeduct);   // 合計所得金額
  const socialAnnual  = social.total * 12;

  // ---- 所得税（基礎控除は令和8年分の特例適用後）----
  const basicDeduct   = tax.basicDeductionTable.find(r => totalIncome <= r.maxTotalIncome).amount;
  const taxableIncome = Math.max(0, totalIncome - basicDeduct - socialAnnual);
  const br            = tax.incomeTaxBrackets.find(r => taxableIncome <= r.max);
  const incomeTaxYear = Math.max(0, Math.floor(
    (taxableIncome * br.rate - br.deduction) * (1 + tax.reconstructionSurtaxRate)));

  // ---- 住民税（★基礎控除は43万円に据え置き。所得税とは別テーブル）----
  //     社会人1年目は前年所得が無いため課税されない
  let residentTaxYear = 0;
  if (Number(yearsOfService) > C.RESIDENT_TAX_EXEMPT_YEARS
      && totalIncome > tax.residentTaxNonTaxableTotalIncome){       // 非課税限度額の判定
    const rBasic = tax.residentBasicDeductionTable.find(r => totalIncome <= r.maxTotalIncome).amount;
    const rTaxable = Math.max(0, totalIncome - rBasic - socialAnnual);
    residentTaxYear = Math.floor(rTaxable * tax.residentTaxRate) + tax.residentTaxPerCapita;
  }

  const net = gross - social.total
            - Math.floor(incomeTaxYear / 12)
            - Math.floor(residentTaxYear / 12);

  return { net: Math.max(0, net), gross, social,
           totalIncome, salaryDeduct,
           incomeTaxMonthly:   Math.floor(incomeTaxYear / 12),
           residentTaxMonthly: Math.floor(residentTaxYear / 12),
           incomeTaxYear, residentTaxYear };
}

/**
 * 給与所得控除を段階表から算出する（令和8年分〜）。
 * @param {number} annualGross 年間の給与収入
 * @param {object} tax TAX_CONSTANTS の該当年分
 * @returns {number}
 */
export function calcSalaryDeduction(annualGross, tax){
  const g = Math.max(0, Number(annualGross) || 0);
  const row = tax.salaryDeductionTable.find(r => g <= r.maxIncome);
  if (!row) return 0;
  if (Number.isFinite(row.fixed)) return row.fixed;
  // ★最低保障額（74万円）を下回らないようにする
  return Math.max(tax.salaryDeductionTable[0].fixed, Math.floor(g * row.rate + row.add));
}

// --- 高額療養費 -------------------------------------------------------------
export function resolveHighMedicalBracket(standardMonthly, isResidentTaxExempt){
  if (isResidentTaxExempt) return C.HIGH_MEDICAL_LIMITS.find(b => b.id === 'e');
  // 配列は降順。先頭一致で最上位区分が取れる
  return C.HIGH_MEDICAL_LIMITS.find(
    b => b.minStandardMonthly !== null && standardMonthly >= b.minStandardMonthly);
}

export function calcSelfPayCap(standardMonthly, totalMedicalCost, opts = {}){
  const b = resolveHighMedicalBracket(standardMonthly, opts.isResidentTaxExempt);
  if (opts.isMultipleHit) return b.multiple;                        // 直近12ヶ月で3回以上該当
  if (b.deductionBase === null) return b.base;                      // 定額区分（エ・オ）
  return Math.round(b.base + Math.max(0, totalMedicalCost - b.deductionBase) * b.rate);
}

// --- 付加給付（健保組合のみ） -----------------------------------------------
export function calcFinalSelfPay(profile, totalMedicalCost){
  const health = lookupStandardMonthly(profile.grossSalary);
  const cap = calcSelfPayCap(health.standard, totalMedicalCost,
                             { isResidentTaxExempt: profile.isResidentTaxExempt });

  if (profile.insuranceType !== 'kumiai'){
    return { amount:cap, hasFuka:false, note:'協会けんぽには付加給付制度はありません' };
  }
  const fuka = profile.fukaKyufuCap;
  if (!Number.isFinite(fuka) || fuka <= 0){
    return { amount:cap, hasFuka:false,
             note:'お勤め先の健保組合に付加給付があるか確認してみましょう' };
  }
  return { amount: Math.min(cap, fuka), hasFuka:true };
}

// --- 傷病手当金（二段階端数処理 ＋ 12ヶ月未満の低額採用） -------------------
export function calcInjuryAllowanceDaily(avgStandardMonthly, opts = {}){
  const { isUnderOneYear = false, insuranceType = 'association',
          kumiaiAverage = null, startDate = new Date() } = opts;

  let base = Math.max(0, Number(avgStandardMonthly) || 0);

  if (isUnderOneYear){
    // 「上限」ではなく「いずれか低い額」を採用する
    const insurerAvg = (insuranceType === 'kumiai')
      ? kumiaiAverage                                               // 組合は自組合の平均額
      : pickEffective(C.SICKPAY_AVG_STD_MONTHLY, startDate).amount; // 協会けんぽ
    if (Number.isFinite(insurerAvg) && insurerAvg > 0) base = Math.min(base, insurerAvg);
  }

  const step1 = Math.round(base / 30 / 10) * 10;                    // ① 10円未満四捨五入
  return Math.round(step1 * (2 / 3));                               // ② 1円未満四捨五入
}

// --- 銀行手数料 -------------------------------------------------------------
export function calcBankFeeLoss(atmCount, transferCount){
  const monthlyLoss = Math.max(0, Number(atmCount)      || 0) * C.BANK_FEE.atm
                    + Math.max(0, Number(transferCount) || 0) * C.BANK_FEE.transfer;
  return { monthlyLoss, annualLoss: monthlyLoss * 12 };
}

// --- クレジットカード -------------------------------------------------------
// ★引数はパーセント単位（0.5 = 0.5%）。小数（0.005）を渡してはならない
export function calcCreditCardLoss(annualSpend, currentRatePercent, annualFee = 0, isRevolving = false){
  const spend = Math.max(0, Number(annualSpend) || 0);
  const pct   = Math.max(0, Number(currentRatePercent) || 0);
  const rateLoss = pct < C.CARD_TARGET_RATE_PERCENT
    ? spend * (C.CARD_TARGET_RATE_PERCENT - pct) / 100
    : 0;                                                            // 負の損失を出さない
  return {
    annualLoss: Math.floor(rateLoss + Math.max(0, Number(annualFee) || 0)),
    isRevolvingAlert: Boolean(isRevolving)
  };
}

// --- 家賃（レベル非算入・参考枠） -------------------------------------------
export function calcRentGap(netIncome, rent, area){
  const avg   = C.MARKET_AVERAGE_RENT[area] ?? C.MARKET_AVERAGE_RENT[C.MARKET_AVERAGE_RENT._default];
  const limit = Math.floor(Math.max(0, Number(netIncome)||0) * C.GOLDEN_RATIO.rent.ratio);
  const r     = Math.max(0, Number(rent) || 0);
  const overGolden = Math.max(0, r - limit);
  const overMarket = Math.max(0, r - avg);
  const monthlySaving = overMarket;
  const paybackYears = monthlySaving > 0
    ? Math.ceil((r * C.MOVING_COST_MONTHS) / (monthlySaving * 12) * 10) / 10
    : null;
  return { limit, overGolden, marketAverage:avg, overMarket, paybackYears,
           includedInLevel: false };                                // ★常に false
}

// --- その他 -----------------------------------------------------------------
export function calcNeglectLoss(monthlyWaste, years = C.NEGLECT_YEARS){
  return Math.max(0, Number(monthlyWaste)||0) * 12 * years;
}
export function calcOvertimeEquivalent(savingAmount, hourlyWage){
  const w = Number(hourlyWage) || 0;
  return w > 0 ? Math.round((Math.max(0,Number(savingAmount)||0) / w) * 10) / 10 : 0;
}
export function calcCompound(monthly, annualRate = C.NISA_ANNUAL_RETURN, years = C.NEGLECT_YEARS){
  const m = Math.max(0, Number(monthly)||0), r = annualRate/12, n = years*12;
  return r === 0 ? Math.round(m*n) : Math.round(m * ((Math.pow(1+r,n)-1)/r));
}
```

### 6.3a 🔴 手取り表示の基準（月次源泉 vs 年税額）

> **本アプリの試算値は、令和8年中の実際の給与明細とは一致しない。**この差の扱いを誤ると
> 「計算が間違っている」というフィードバックが多発するため、必ず対応すること。

#### 何が起きているか

令和8年度税制改正では、企業の実務負担軽減を理由に、**月次の源泉徴収と年末調整で異なるルールが適用される**。

| 時期 | 適用されるルール | 結果 |
| :--- | :--- | :--- |
| 令和8年1月〜11月の毎月の給与 | **旧ルール（令和7年分の源泉徴収税額表）** | 所得税が多めに天引きされる |
| 令和8年12月の年末調整 | **新ルール（基礎控除104万円等）** | 1年分の差額がまとめて還付される |
| 令和9年1月以降の毎月の給与 | 新ルール | 月次と年税額が一致する |

#### 本アプリの方針（✅ 2026-08-05 確定）

**年税額ベースで試算する。**理由は、本アプリの目的が「1年を通じた手取りの最大化」であり、
月次の源泉徴収額は年末調整で精算される一時的な数値にすぎないためである。

**ただし以下の注記を、手取り額の直下に必ず表示すること。**

```html
<p class="disclaimer">
  ※ 令和8年分の所得税は、毎月の給与では改正前の税額表で天引きされ、
  12月の年末調整でまとめて精算されます。そのため本試算の月額は、
  実際の給与明細の手取りより多めに表示される場合があります。
</p>
```

#### 住民税の「ねじれ」にも注意

令和8年度は**所得税の基礎控除が104万円に引き上げられた一方、住民税は43万円に据え置かれた**。
このため「所得税は0円だが住民税は課税される」層が生じる。

**`calcNetIncome()` は所得税用と住民税用で別の控除テーブルを参照する**（`basicDeductionTable` と
`residentBasicDeductionTable`）。片方を流用してはならない。

### 6.4 派生値（`js/selectors.js`）

```javascript
import * as C from './config.js';
import * as calc from './calc.js';

// ★State には currentLevel / title / avatarKey を保存しない。すべてここで都度算出する
export const selectors = {
  netIncome(state){
    return calc.calcNetIncome({
      reward: state.userProfile.grossSalary,
      age: state.userProfile.age,
      yearsOfService: state.userProfile.yearsOfService
    }).net;
  },

  monthlyGain(state){
    // ★IMMEDIATE のみ。rent は含めない
    return C.IMMEDIATE.reduce((sum, key) => {
      // subscriptions のみ選択IDから算出する（§3.9）
      const before = key === 'subscriptions'
        ? selectors.subscriptionTotal(state)
        : Number(state.fixedCosts[key]) || 0;
      const after  = Number(state.optimized[key]);
      const delta  = Number.isFinite(after) ? (before - after) : 0;
      return sum + Math.max(0, delta);
    }, 0);
  },

  annualGain(state){
    const g = selectors.monthlyGain(state) * 12;
    return Number.isFinite(g) ? Math.max(0, Math.round(g)) : 0;
  },

  moneyLevel(state){
    const gain = selectors.annualGain(state);
    if (!Number.isFinite(gain)) return C.LEVEL_MIN;                 // NaN ガード
    return Math.min(C.LEVEL_MAX,
           Math.max(C.LEVEL_MIN, Math.floor(gain / C.LEVEL_UNIT) + 1));
  },

  bonusLevel(state){
    return state.meta.feedbackBonusGranted ? C.BONUS_LEVEL_MAX : 0;
  },

  displayLevel(state){
    return selectors.moneyLevel(state) + selectors.bonusLevel(state);
  },

  levelDelta(state){
    return selectors.displayLevel(state) - (state.meta.initialLevel ?? C.LEVEL_MIN);
  },

  rank(state){
    const lv = selectors.displayLevel(state);
    return C.RANK_TABLE.find(r => lv >= r.min && lv <= r.max) ?? C.RANK_TABLE[0];
  },

  progressPct(state){
    const gain = selectors.annualGain(state);
    return Math.round((gain % C.LEVEL_UNIT) / C.LEVEL_UNIT * 100);
  },

  nextLevelGap(state){
    const gain = selectors.annualGain(state);
    return C.LEVEL_UNIT - (gain % C.LEVEL_UNIT);
  },

  subscriptionTotal(state){
    // ★fixedCosts.subscriptions は保存せず、選択IDから都度算出する（§3.9）
    return C.sumSubscriptions(state.selections.subscriptionPlanIds)
         + C.sumOtherSubscriptions(state.selections.otherSubscriptions);
  },

  subscriptionSummary(state, categoryId){
    // アコーディオンの <summary> に出す「N件・◯◯円」を生成する
    const cat = C.SUBSCRIPTION_PLANS.find(g => g.id === categoryId);
    if (!cat) return '';
    const ids = cat.services.flatMap(sv => sv.plans.map(p => p.id))
                  .filter(id => state.selections.subscriptionPlanIds.includes(id));
    if (!ids.length) return '未選択';
    return `${ids.length}件・${C.sumSubscriptions(ids).toLocaleString('ja-JP')}円`;
  },

  annualGainFormatted(state){
    // ★マイカルテ内での表示用。カンマ区切り＋「円」付き
    const gain = selectors.annualGain(state);
    return gain.toLocaleString('ja-JP');
  }
};
```

### 6.5 State・永続化・リアクティブ（`js/store.js`）

```javascript
import * as C from './config.js';

export const INITIAL_STATE = {
  schemaVersion: 1,                       // ★必須。無いと次回更新で全ユーザーのデータが飛ぶ

  meta: {
    initialLevel: null,                   // STEP1完了時に一度だけ確定。以後不変
    feedbackBonusGranted: false,          // ★生涯1回。呪文にも含める
    createdAt: null, lastOpenedAt: null, hasCompletedStep1: false
  },

  userProfile: {
    grossSalary: null,                    // 月額報酬（額面・円）
    age: null,                            // 介護保険料の年齢判定用
    prefecture: 'osaka',
    insuranceType: 'association',         // 'association' | 'kumiai'
    kumiaiAverage: null,                  // 組合の平均標準報酬月額（傷病手当金用）
    fukaKyufuCap: null,                   // 付加給付。組合かつユーザー入力時のみ有効
    yearsOfService: 1,                    // 住民税1年目非課税の判定
    isUnderOneYear: false,                // 健保加入12ヶ月未満
    isResidentTaxExempt: false,           // 高額療養費 区分オ 判定
    area: 'urban',                        // 家賃市場平均のエリア
    hourlyWage: null                      // タイパ換算用
  },

  fixedCosts: {                           // 現状（Before）
    rent:null, fireInsurance:null, smartphone:null,
    medicalInsurance:null, subscriptions:null, bankFee:null, cardReward:null
  },

  optimized: {                            // 見直し後（After）
    fireInsurance:null, smartphone:null,
    medicalInsurance:null, subscriptions:null, bankFee:null, cardReward:null
  },

  todoStatus: {
    changeFireInsurance:false, changeSim:false, cancelMedicalInsurance:false,
    consolidateCard:false, cancelSubscription:false, startNisa:false, changeBank:false
  },

  selections: {
    subscriptionPlanIds: [],              // ★選択されたサブスクのプランID配列（§3.9）
                                          //   合計額は保存しない。sumSubscriptions() で都度算出する
    otherSubscriptions: []                // ★その他サブスク（自由入力）
                                          //   [{ id:'o1', label:'ジム', monthly:8000 }] 最大5件
  },

  betaFeedback: { ratingSubmitted:false, lastRating:null }

  // ★以下は絶対に保存しない（selectors.js で都度算出）
  //   currentLevel / moneyLevel / displayLevel / title / avatarKey / annualGain
  //   fixedCosts.subscriptions の合計額（選択IDのみを保持し、金額は都度算出する）
};

// --- マイグレーション -------------------------------------------------------
const MIGRATIONS = { /* 1: (s)=>{...}  ← v2 リリース時にここへ追記 */ };

export function migrate(raw){
  if (!raw || typeof raw !== 'object') return structuredClone(INITIAL_STATE);
  let s = raw, v = s.schemaVersion ?? 0;
  while (MIGRATIONS[v]){ s = MIGRATIONS[v](s); v += 1; }
  return deepMerge(structuredClone(INITIAL_STATE), s, { schemaVersion: INITIAL_STATE.schemaVersion });
}

// --- 再帰的 Proxy -----------------------------------------------------------
// new Proxy はトップレベルしか捕捉しない。state.fixedCosts.rent = X を検知するため再帰化する
function deepReactive(target, onChange){
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

export const state = deepReactive(migrate(loadRaw()), () => { scheduleRender(); persist(); });

// ★structuredClone(proxy) は DataCloneError を投げ得るため使用禁止。素のオブジェクトに剥がす
function stripProxy(o){ return JSON.parse(JSON.stringify(o)); }

// --- 永続化（デバウンス＋例外処理） -----------------------------------------
let persistTimer = null;
function persist(){
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try{ localStorage.setItem(C.STORAGE_KEY, JSON.stringify(stripProxy(state))); }
    catch(e){   // iOSプライベートブラウズは QuotaExceededError を投げる
      showToast('この環境では保存できません。「魔法の呪文」で控えを取ってください','warn');
    }
  }, 400);
}
```

### 6.6 差分描画（`js/ui.js`）

```javascript
// ★innerHTML による全再構築を禁止する。入力中の <input> がDOMごと破棄され、
//   1文字ごとにフォーカスが飛ぶ（iOS ではソフトキーボードが閉じ実質入力不能になる）
let rafId = null, isRendering = false;

export function scheduleRender(){
  if (rafId !== null) return;                          // 1フレーム1回に集約
  rafId = requestAnimationFrame(() => { rafId = null; render(); });
}

function render(){
  if (isRendering) return;                             // 再入ガード（第二防波堤）
  isRendering = true;
  try{
    const view = buildViewModel(state);                // セレクタ経由で派生値を一括算出

    document.querySelectorAll('[data-bind]').forEach(el => {
      const [type, key] = el.dataset.bind.split(':');
      const val = view[key];
      if (type === 'text'){
        if (el.textContent !== String(val)) el.textContent = val;   // 差分時のみ触る
      } else if (type === 'progress'){
        // ★CSS変数で受け渡す（§7.2 で style-src-attr を許可済み）
        const next = `${Math.max(0, Math.min(100, Number(val) || 0))}%`;
        if (el.style.getPropertyValue('--progress') !== next)
          el.style.setProperty('--progress', next);
      } else if (type === 'toggle'){
        el.hidden = !val;
      }
    });

    // ★フォーカス中・IME変換中の入力欄には絶対に書き戻さない
    document.querySelectorAll('[data-model]').forEach(el => {
      if (el === document.activeElement) return;
      if (el.dataset.composing === '1') return;
      const next = formatNumber(getByPath(state, el.dataset.model));
      if (el.value !== next) el.value = next;
    });
  } finally { isRendering = false; }
}
```

### 6.7 イベント設計（`js/app.js`）

```javascript
// イベント委譲を徹底し、個別 addEventListener を撒かない（動的追加時の付け忘れ防止）
function bindEvents(){
  document.addEventListener('input', e => {
    const el = e.target.closest('[data-model]');
    if (!el || el.dataset.composing === '1') return;
    setByPath(state, el.dataset.model, parseYen(el.value));
  });

  // IME（日本語入力の中間状態で発火するのを抑止）
  document.addEventListener('compositionstart', e => { if (e.target.dataset) e.target.dataset.composing='1'; });
  document.addEventListener('compositionend', e => {
    if (!e.target.dataset) return;
    e.target.dataset.composing='0';
    e.target.dispatchEvent(new Event('input',{bubbles:true}));
  });

  // blur時にのみカンマ整形（入力中に整形するとキャレットが飛ぶ）
  document.addEventListener('focusout', e => {
    const el = e.target.closest('[data-model]');
    if (el) el.value = formatNumber(getByPath(state, el.dataset.model));
  }, true);

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (btn) ACTIONS[btn.dataset.action]?.(btn, e);
  });

  document.addEventListener('change', e => {
    const cb = e.target.closest('[data-quest-toggle]');
    if (cb) state.todoStatus[cb.dataset.questToggle] = cb.checked;
  });
}

// ★全角数字を半角化してから数値化する
export function parseYen(v){
  const half = String(v).replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0)-0xFEE0));
  const n = Number(half.replace(/[,\s円]/g,''));
  return Number.isFinite(n) ? n : null;
}
```

```html
<!-- ★type="number" を使わない（ホイールで値が変わる／カンマ表示不可／iOSで想定外の文字） -->
<input type="text" inputmode="numeric" pattern="[0-9,]*"
       data-model="fixedCosts.rent" autocomplete="off" enterkeyhint="done">
```

### 6.8 フィードバック送信（`js/feedback.js`）

```javascript
import { ENDPOINT, RATE_LIMIT, FETCH_TIMEOUT_MS, COMMENT_MAX_LENGTH } from './config.js';

let isSubmitting = false;

export async function sendFeedback(feedbackData, state){
  // ── ガード群（すべて await の前に置く）
  if (isSubmitting) return { success:false, reason:'in_flight', levelBonus:0 };

  if (feedbackData.botcheck){                                  // Honeypot：成功したフリで握り潰す
    return { success:true, reason:'honeypot', levelBonus:0 };
  }

  const rate = checkRateLimit();
  if (!rate.ok){
    return { success:false, reason:rate.reason, waitSec:rate.waitSec, levelBonus:0 };
  }

  if (!navigator.onLine) return { success:false, reason:'offline', levelBonus:0 };

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);   // fetch に既定のタイムアウトは無い
  isSubmitting = true;

  try{
    const res = await fetch(ENDPOINT, {                        // ★同一オリジンのプロキシ
      method:'POST',
      headers:{ 'Content-Type':'application/json', Accept:'application/json' },
      body: JSON.stringify(sanitizePayload(feedbackData)),
      signal: ctrl.signal
    });

    let json = {};
    try{ json = await res.json(); }catch{ /* HTMLエラーページ等 */ }

    if (res.status === 429) return { success:false, reason:'throttled', levelBonus:0 };
    // ★res.ok だけでは Web3Forms の success:false を見逃す
    if (!res.ok || json.success !== true) return { success:false, reason:'api_error', levelBonus:0 };

    rate.commit();
    return { success:true, levelBonus: grantFeedbackBonus(state) };

  }catch(e){
    return { success:false, reason: e.name === 'AbortError' ? 'timeout' : 'network', levelBonus:0 };
  }finally{
    clearTimeout(timeout);
    isSubmitting = false;
  }
}

function grantFeedbackBonus(state){
  if (state.meta.feedbackBonusGranted) return 0;               // ★生涯1回のみ
  state.meta.feedbackBonusGranted = true;
  return 1;
}

// --- レート制限（sessionStorage はタブ単位でリセットされるため localStorage を使う） ---
const RATE_KEY = 'tq_submit_log';

export function checkRateLimit(){
  let log = [];
  try{ log = JSON.parse(localStorage.getItem(RATE_KEY) || '[]'); }catch{ log = []; }
  const now = Date.now();
  log = log.filter(t => now - t < RATE_LIMIT.windowMs);        // 24時間で自動失効

  if (log.length >= RATE_LIMIT.maxPerDay) return { ok:false, reason:'rate_limited' };
  if (log.length && now - log.at(-1) < RATE_LIMIT.cooldownMs){
    return { ok:false, reason:'cooldown',
             waitSec: Math.ceil((RATE_LIMIT.cooldownMs - (now - log.at(-1))) / 1000) };
  }
  return { ok:true, commit(){
    log.push(Date.now());
    try{ localStorage.setItem(RATE_KEY, JSON.stringify(log)); }catch{}
  }};
}

// --- サニタイズ -------------------------------------------------------------
export function sanitizePayload(data){
  const clean = { ...data };
  if (clean.comment){
    let s = String(clean.comment).slice(0, COMMENT_MAX_LENGTH);

    // ① 制御文字のみ除去。\p{S}（記号・絵文字）と \p{M}（結合文字）を許可し、
    //    ZWJ(U+200D)・異体字セレクタ(U+FE0F) を温存して絵文字の分断を防ぐ
    s = s.replace(/[^\p{L}\p{N}\p{P}\p{S}\p{M}\p{Z}\u200D\uFE0F\n]/gu, '');

    // ② 全角英数字・記号を半角化してからマスク（全角による回避を封じる）
    s = s.replace(/[Ａ-Ｚａ-ｚ０-９＠．＋＿－]/g,
          c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

    s = s.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '***@***');                    // メール

    // ③ ハイフン・空白を任意化し、国際表記にも対応
    s = s.replace(/(?:\+81[-\s]?|0)\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/g, '***-****-****');

    clean.comment = s.replace(/\r\n?/g, '\n').trim();
  }
  return clean;
}
```

### 6.9 キー隠蔽プロキシ（`functions/api/feedback.js`）

**Web3Forms API は `access_key` をリクエストボディに必須とする。**キーをフロントから完全に排除するため、Cloudflare Pages Functions を経由させる。

```javascript
export async function onRequestPost({ request, env }){
  let body;
  try{ body = await request.json(); }
  catch{ return json({ success:false, message:'invalid body' }, 400); }

  if (body.botcheck) return json({ success:true }, 200);       // Honeypot：静かに握り潰す

  const res = await fetch('https://api.web3forms.com/submit', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({
      ...body,
      access_key: env.WEB3FORMS_KEY,                           // ★サーバ側環境変数のみに存在
      subject: '【てどりクエスト】β版フィードバック'
    })
  });
  return new Response(await res.text(), {
    status: res.status, headers:{ 'Content-Type':'application/json' }
  });
}

function json(obj, status){
  return new Response(JSON.stringify(obj), { status, headers:{ 'Content-Type':'application/json' } });
}
```

**設定手順（実装者が手動で行う）**
1. Cloudflare Pages → Settings → Environment variables に `WEB3FORMS_KEY` を **Secret** として登録
2. Web3Forms 管理画面で**ドメイン制限（Referer制限）**を `tedori-quest.com` に設定
3. `.env` や `config.js` にキーを書かない。GitHub にコミットしない

### 6.9a デプロイ手順（ビルドなし）

Pages Functions は Cloudflare のエッジで動作するため、**手元に Node.js は不要**であり、ビルドも発生しない。

```
Cloudflare Pages → Create a project → Direct Upload（またはGit連携）

ビルド設定:
  Framework preset  : None
  Build command     : （空欄のまま）★ここに何も入れない
  Build output dir  : /            ★リポジトリ直下をそのまま公開する
```

`functions/` ディレクトリは Cloudflare が自動的に検出し、`/api/feedback` として公開する。**設定ファイルを書く必要はない。**

### 6.9b 【代替案】完全静的構成（Pages Functions を使わない場合）

Cloudflare Pages 以外の純粋な静的ホスティング（GitHub Pages 等）を選ぶ場合、サーバー側処理が存在しないため**プロキシを置けない**。その場合は以下に切り替える。

```javascript
// config.js
export const ENDPOINT   = 'https://api.web3forms.com/submit';
export const ACCESS_KEY  = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
// ★これは「秘匿」ではなく「管理上の分離」である。ブラウザから閲覧可能であることを
//   前提に、下記の代替防御を必ず併用すること
```

```javascript
// feedback.js の body に access_key を含める
body: JSON.stringify({ access_key: ACCESS_KEY, ...sanitizePayload(feedbackData) })
```

**この構成を選ぶ場合、以下は「推奨」ではなく「必須」に格上げされる。**

| # | 対策 | 理由 |
| :---: | :--- | :--- |
| 1 | Web3Forms **ドメイン制限**（Referer制限） | 他サイトからのキー流用を遮断する唯一の手段 |
| 2 | **Cloudflare Turnstile** の導入 | キーが露出している以上、Bot対策は必須 |
| 3 | CSP に `connect-src https://api.web3forms.com` を追加 | 直接通信するため |
| 4 | 定期的なキーのローテーション | 露出前提の運用 |

**方式の比較**

| 観点 | Pages Functions（推奨） | 完全静的（代替） |
| :--- | :---: | :---: |
| 手元の Node.js | 不要 | 不要 |
| ビルド | なし | なし |
| キーの露出 | **ゼロ** | あり（防御で補う） |
| ホスティングの制約 | Cloudflare Pages 限定 | どこでも可 |
| 設定の手間 | 環境変数を1つ登録するだけ | ドメイン制限＋Turnstile |

**「Node 不要」という要件は両案とも満たす。**判断軸は「キーを露出させない構成を取れるか」であり、可能なら Pages Functions 方式を選ぶこと。

### 6.10 エラー文言（確定版）

| `reason` | 文言 | トースト種別 |
| :--- | :--- | :--- |
| （成功・初回） | 🎉 開発協力ボーナス獲得 ➔ ＋1 Level UP! | ボーナス演出 |
| （成功・2回目以降） | ご意見ありがとうございます！ | success |
| `rate_limited` | 本日の送信上限に達しました。また明日お聞かせください | warn |
| `cooldown` | 送信間隔が短すぎます。あと○秒お待ちください | warn |
| `throttled` | 混み合っています。しばらくしてからお試しください | warn |
| `api_error` | 送信できませんでした。時間をおいてお試しください | error |
| `timeout` | 通信がタイムアウトしました。接続状態をご確認ください | error |
| `offline` / `network` | 送信に失敗しました。接続状態をご確認ください | error |
| `in_flight` / `honeypot` | （表示しない） | — |

**文言原則**: エラーは謝らない。何が起きて次に何をすればよいかだけを述べる。

---

## 7. 非機能要件

### 7.1 パフォーマンス

* **Lighthouse**: 全4項目で 95点以上
* **FCP 1.0秒以内 / LCP 1.5秒以内**
* **html2canvas（150KB超）はトップレベル読み込み禁止**。キャプチャボタン押下時に `await import()` で動的ロード
* **Noto Sans JP はサブセット化**するか `&display=swap` ＋ `unicode-range` を指定（日本語グリフはLCPを押し上げる）
* **β版ではSVGアイコンを使用しない**（§6.2.13）。絵文字とテキストで構成し、リクエスト数とファイルサイズを削減する
* 画像には `decoding="async"` と `width`/`height` を付与（CLS防止）

**ビルドレス構成における注意点**

* **CSS は手書きのため、未使用スタイルが混入しない**。パージ工程が不要になる分、Tailwind 構成より有利
* **JS はバンドルされないため、モジュール数だけHTTPリクエストが発生する**。ただし HTTP/2 以降では多重化されるため、7ファイル程度なら実測上の問題はない。**10ファイルを超える場合のみ**、`app.js` への統合を検討する
* **`<link rel="modulepreload">` で依存モジュールを先読みさせる**（ウォーターフォールの直列化を防ぐ）

```html
<link rel="modulepreload" href="js/config.js">
<link rel="modulepreload" href="js/calc.js">
<link rel="modulepreload" href="js/selectors.js">
<link rel="modulepreload" href="js/store.js">
```

* **html2canvas は CDN からの動的 import** のため初期ロードに影響しない。ただし CSP の `script-src` に CDN の許可が必要（§7.2）

### 7.2 セキュリティヘッダー（`_headers`）

```text
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://static.cloudflareinsights.com https://challenges.cloudflare.com; style-src 'self' https://fonts.googleapis.com; style-src-attr 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://cdnjs.cloudflare.com https://cloudflareinsights.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**注意点**
* Cloudflare Pages では `<meta http-equiv>` ではなく **`_headers` ファイル**で配信する（`frame-ancestors` は meta では機能しない）
* `connect-src` に `api.web3forms.com` は**不要**（プロキシ経由で同一オリジン完結のため）。ただし §6.9b の完全静的構成を採る場合は**追加が必要**
* `style-src-attr 'unsafe-inline'` は **html2canvas が大量のインラインスタイルを生成するため必須**。**この許可に progress の CSS変数方式（§3.1a）が依存している**。キャプチャ機能を廃止して本ディレクティブを外す場合は、`--progress` をクラス切替方式（`progress-0`〜`progress-100` の5%刻み21クラス）へ戻すこと
* Turnstile を導入する場合は `challenges.cloudflare.com` を使用（CSPは対応済み）
* **`cdnjs.cloudflare.com` は `script-src` と `connect-src` の両方に必要**。動的 `import()` はスクリプト取得と見なされるが、実装によってはフェッチ扱いにもなるため両方を許可する（html2canvas の遅延ロード用）
* **`tests.html` は本番にデプロイしない**か、デプロイする場合も CSP の制約下で動作することを確認する（テストランナーは `import()` を多用する）

### 7.3 スパム防御の多層構成

| 層 | 手段 | 目的 |
| :---: | :--- | :--- |
| 1 | Web3Forms **ドメイン制限**（管理画面設定） | キー悪用の防止 |
| 2 | Pages Functions プロキシ | キーのフロント露出をゼロにする |
| 3 | Honeypot（`botcheck`） | 単純Botの排除 |
| 4 | `localStorage` レート制限（3回/日・10秒クールダウン） | うっかり連投の抑止 |
| 5 | Cloudflare Turnstile（**推奨**） | 高度なBotの排除 |

**重要**: 層4はクライアント側であり悪意ある攻撃者には効かない。**本質的な防御は層1・2・5である。**混同しないこと。

```html
<!-- Honeypot：type="hidden" は多くのBotが検知して回避する。required も付けない -->
<input type="text" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true"
       style="position:absolute;left:-9999px;opacity:0;height:0;width:0">
```

### 7.4 法定表示（`privacy.html`）— 全ページのフッターからリンク

* **個人情報の取扱い**: 利用目的（サービス改善のみ）／メール・電話番号は送信前に自動マスクされること／サーバーに個人情報を保存しないこと
* **免責事項**: 試算は概算であり実際の給付額・税額を保証しないこと／制度改定により内容が変わり得ること／最終判断は各自の責任で行うこと
* **本サービスの位置づけ**: 税務相談・保険募集・投資助言・社会保険手続き代理のいずれにも該当しない旨
* **運営者情報**: 運営者名・連絡手段（Xアカウント等）
* **制度基準日**: 「本サービスの試算は **2026年8月1日時点**の制度に基づきます」

### 7.5 SEO・OGP

* **Title**: `【β版】FP2級監修｜手取り最大化シミュレーター てどりクエスト`
* **Description**: `【自分の手取りレベルがわかる！】公的保障を自動判定！無駄な固定費を削ってレベルを上げる完全無料Webアプリ。`
* **OGP**: `og:image` / `og:url` は本番絶対パス。**`og:image` は 1200×630px**、**`twitter:card` は `summary_large_image`**
* `favicon` / `manifest.json` を設置

### 7.6 アナリティクス（KPI測定手段）

* **Cloudflare Web Analytics**（Cookieレス・無料・同意バナー不要）
* **カスタムイベント**: `share_click` / `karte_save` / `feedback_open` / `feedback_submit` / `spell_copy` / `quest_check`
* **算出**: シェア率 = `share_click` ÷ STEP2到達数、回収率 = `feedback_submit` ÷ STEP3到達数

---

## 8. テスト仕様マトリクス（`tests/calc.test.js` — ブラウザ実行）

全**83件**（TEST-01〜83）。AI自動生成時に本マトリクスをすべて通過させること。前版の重複（旧TEST-05≡19、04≒18、03≒17）は統合し、空いた枠に未カバー領域を充当した。

### 8.0 テスト実行環境（ブラウザ完結・Node 不要）

`node:test` は**既定では使用しない**が、**API互換のシグネチャを採用する**（Node-Ready 原則 N-3）。これにより、後から CI で Node 実行したくなった際に**テストコードを1行も書き換えずに済む**。

#### `tests/runner.js`（ブラウザ用・依存ゼロ）

```javascript
// 依存ゼロの最小テストランナー。
// ★API は node:test / node:assert/strict と互換にすること（N-3）
//   describe(name, fn) / test(name, fn) / assert.equal(actual, expected)
const results = [];
let currentSuite = '';

export function describe(name, fn){
  const prev = currentSuite;
  currentSuite = prev ? `${prev} > ${name}` : name;
  fn();
  currentSuite = prev;
}

export function test(name, fn){
  const suite = currentSuite;
  try{
    const r = fn();
    if (r instanceof Promise){            // node:test と同じく async をサポート
      return r.then(
        () => results.push({ suite, name, pass:true }),
        e  => results.push({ suite, name, pass:false, message:e.message }));
    }
    results.push({ suite, name, pass:true });
  }catch(e){
    results.push({ suite, name, pass:false, message:e.message });
  }
}

// --- node:assert/strict と同じ名前・同じ引数順のみを定義する ---------------
// ★notOk / notIncludes のような独自メソッドを足さないこと。
//   Node へ移行した瞬間に動かなくなる。否定は assert.ok(!x) で表現する。
export const assert = {
  equal(actual, expected, msg){
    if (!Object.is(actual, expected))
      throw new Error(msg ?? `期待値 ${expected} / 実際 ${actual}`);
  },
  notEqual(actual, expected, msg){
    if (Object.is(actual, expected)) throw new Error(msg ?? `${actual} であってはならない`);
  },
  deepEqual(actual, expected, msg){
    const a = JSON.stringify(actual), b = JSON.stringify(expected);
    if (a !== b) throw new Error(msg ?? `期待値 ${b} / 実際 ${a}`);
  },
  ok(value, msg){ if (!value) throw new Error(msg ?? `真であるべき値が ${value}`); },
  match(str, re, msg){
    if (!re.test(String(str))) throw new Error(msg ?? `${str} が ${re} に一致しない`);
  },
  throws(fn, msg){
    try{ fn(); }catch{ return; }
    throw new Error(msg ?? '例外が投げられなかった');
  }
};

// --- 結果描画（ブラウザ専用。Node 側では使わない） --------------------------
export function report(el){
  const pass = results.filter(r => r.pass).length;
  const fail = results.length - pass;

  el.innerHTML = `
    <h1 class="${fail ? 'fail' : 'pass'}">
      ${fail ? `❌ ${fail} 件失敗` : '✅ 全テスト通過'}（${pass}/${results.length}）
    </h1>
    <table>
      <thead><tr><th></th><th>検証内容</th><th>分類</th><th>詳細</th></tr></thead>
      <tbody>${results.map(r => `
        <tr class="${r.pass ? 'pass' : 'fail'}">
          <td>${r.pass ? '✅' : '❌'}</td>
          <td>${r.name}</td>
          <td>${r.suite}</td>
          <td>${r.message ?? ''}</td>
        </tr>`).join('')}</tbody>
    </table>`;

  console.log(`${pass}/${results.length} passed`);
  results.filter(r => !r.pass).forEach(r => console.error(`❌ ${r.name}: ${r.message}`));
  return { pass, fail, total: results.length };
}
```

#### `tests/harness.js`（ブラウザ／Node の自動切替）

**テストファイルはこのハーネスだけを import する。**実行環境の判定はここに閉じ込める。

```javascript
// tests/harness.js
// ★実行環境の差異を吸収する唯一の層。
//   テストファイルは runner.js / node:test を直接 import しないこと。
const isNode = typeof process !== 'undefined' && process.versions?.node;

let _describe, _test, _assert;

if (isNode){
  const nt = await import('node:test');
  const na = await import('node:assert/strict');
  _describe = nt.describe;
  _test     = nt.test;
  _assert   = na.default;
}else{
  const r = await import('./runner.js');
  _describe = r.describe;
  _test     = r.test;
  _assert   = r.assert;
}

export const describe = _describe;
export const test     = _test;
export const assert   = _assert;
```

#### `tests.html`

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>てどりクエスト テスト結果</title>
  <style>
    body{font-family:system-ui,sans-serif; padding:1rem; background:#0F172A; color:#E2E8F0;}
    h1{font-size:1.25rem;} h1.pass{color:#10B981;} h1.fail{color:#EF4444;}
    table{width:100%; border-collapse:collapse; font-size:.85rem; margin-top:1rem;}
    th,td{border-bottom:1px solid #334155; padding:.5rem; text-align:left; vertical-align:top;}
    tr.fail{background:rgba(239,68,68,.12);}
    tr.fail td{color:#FCA5A5;}
  </style>
</head>
<body>
  <div id="output">実行中…</div>
  <script type="module">
    import { report } from './tests/runner.js';
    await import('./tests/calc.test.js');       // import と同時にテストが実行される
    await import('./tests/store.test.js');
    await import('./tests/feedback.test.js');
    report(document.getElementById('output'));
  </script>
</body>
</html>
```

#### 使い方

```bash
# 既定（Node 不要）
python3 -m http.server 8000
# → http://localhost:8000/tests.html を開く

# Node を導入済みの場合（§17 Level 1）— テストコードの変更は不要
node --test tests/
```

**利点**: ブラウザ実行では `TextEncoder` / `localStorage` / `Intl` の挙動が本番と完全に一致するため、「テストは通るのに実機で壊れる」が起こらない。同じコードが Node でも動くため、CI 導入時の書き換えコストがゼロになる。

#### テストの書き方（例）

```javascript
// tests/calc.test.js
// ★harness.js のみを import すること。runner.js / node:test を直接使わない
import { describe, test, assert } from './harness.js';
import * as calc from '../js/calc.js';

describe('標準報酬月額', () => {
  test('TEST-01: 境界値（下）209,999円 → 等級17', () => {
    assert.equal(calc.lookupStandardMonthly(209999).grade, 17);
    assert.equal(calc.lookupStandardMonthly(209999).standard, 200000);
  });

  test('TEST-02: 境界値（上）210,000円 → 等級18', () => {
    assert.equal(calc.lookupStandardMonthly(210000).grade, 18);
  });
});
```

**テストIDは名前の先頭に `TEST-NN: ` の形式で埋め込む**（`node:test` の `test()` は第1引数が名前のみで、ID用の引数を持たないため）。

**注意**: `localStorage` を使うテスト（TEST-37, 38 等）は実行前後に `localStorage.clear()` を呼び、テスト間の汚染を防ぐこと。Node 実行時は `localStorage` が存在しないため、当該テストは `typeof localStorage === 'undefined'` でスキップする。

### 8.1 標準報酬月額・テーブル整合性

| ID | 検証対象 | 入力 | 期待出力 |
| :--- | :--- | :--- | :--- |
| **TEST-01** | 境界値（下） | 額面 `209,999` | 等級17 / 標準報酬 `200,000` |
| **TEST-02** | 境界値（上） | 額面 `210,000` | 等級18 / 標準報酬 `220,000` |
| **TEST-03** | 上限等級 | 額面 `1,500,000` | 等級50 / 標準報酬 `1,390,000` |
| **TEST-04** | 厚生年金の上限クランプ | 額面 `800,000` | 厚年標準報酬 `650,000`（健保は `790,000`） |
| **TEST-05** | 不正入力 | 額面 `null` / `-1` / `'abc'` | `null` を返す（例外を投げない） |
| **TEST-55** | **テーブル整合性** | `HEALTH_INSURANCE_TABLE` 全行 | 等級が1〜50で連番／`lower < upper`／隣接行で `前.upper === 次.lower`／末尾が `Infinity`（**転記ミス自動検出**） |

### 8.2 高額療養費・公的保障

| ID | 検証対象 | 入力 | 期待出力 |
| :--- | :--- | :--- | :--- |
| **TEST-06** | 区分エ（境界） | 標準報酬 `260,000` / 医療費 `1M` | **`61,500円`** |
| **TEST-07** | 区分ウ（境界） | 標準報酬 `280,000` / 医療費 `1M` | **`92,940円`**（`85,800 + (1,000,000−286,000)×1%`） |
| **TEST-08** | 区分イ | 標準報酬 `530,000` / 医療費 `1M` | `179,100 + (1,000,000−597,000)×1% = 183,130円` |
| **TEST-09** | 区分オ | 住民税非課税 | **`36,900円`** |
| **TEST-10** | 多数回該当 | 区分ウ / 4回目 | **`44,400円`**（据え置き） |
| **TEST-11** | 付加給付 非適用 | `insuranceType:'association'` ＋ 付加給付25,000入力 | 付加給付が**適用されない** |
| **TEST-12** | 付加給付 適用 | `insuranceType:'kumiai'` / 付加給付25,000 | `min(上限, 25,000) = 25,000円` |
| **TEST-13** | 傷病手当金 端数 | 平均標準報酬 `170,000` | 日額 **`3,780円`**（`5,670×2/3`） |
| **TEST-14** | 傷病手当金 12ヶ月未満 | 個人平均 `350,000` / 協会けんぽ / 2026-08 | 基礎額 **`320,000`** → 日額 `7,113円` |
| **TEST-15** | 傷病手当金 組合 | `kumiai` / 組合平均 `280,000` / 12ヶ月未満 | 基礎額 **`280,000`**（32万を使わない） |
| **TEST-16** | 傷病手当金 12ヶ月以上 | 個人平均 `350,000` / `isUnderOneYear:false` | 低額採用が**発動しない**（基礎額 `350,000`） |

### 8.3 手取り・社会保険料

| ID | 検証対象 | 入力 | 期待出力 |
| :--- | :--- | :--- | :--- |
| **TEST-17** | 介護保険 年齢境界 | 年齢 `39` / `40` | 39歳＝加算なし／40歳＝`1.62%` 加算 |
| **TEST-18** | **子ども・子育て支援金** | 額面 `220,000` / 大阪 | 健保料率に **`0.23%` が加算**されている |
| **TEST-19** | 住民税 勤続境界 | 勤続 `1年` / `2年` | 1年目＝`0円`／2年目＝課税 |
| **TEST-20** | 厚生年金 本人負担 | 標準報酬 `220,000` | `220,000 × 18.3% × 0.5 = 20,130円` |
| **TEST-21** | 手取り非負 | 額面 `0` | 手取り `0円`（負値を返さない） |

### 8.4 レベル・称号

| ID | 検証対象 | 入力 | 期待出力 |
| :--- | :--- | :--- | :--- |
| **TEST-22** | 空入力 | 全項目 `null` | `Lv.1`（`NaN` を返さない） |
| **TEST-23** | 負の増額 | 年間増額 `-3,000` | `Lv.1`（下限クランプ） |
| **TEST-24** | 5,000円境界 | `4,999` / `5,000` | `Lv.1` / `Lv.2` |
| **TEST-25** | 上限クランプ | 年間増額 `99,999,999` | `Lv.999` |
| **TEST-26** | 称号境界 | Lv.5/6, 15/16, 30/31, 49/50 | 各境界で称号が切り替わる |
| **TEST-27** | **家賃のレベル除外** | 家賃超過 `5,000/月` のみ | `annualGain = 0` / `Lv.1`（F-5） |
| **TEST-28** | レベル遷移差分 | 前 `Lv.12` / 後 `Lv.15` | 差分 `+3` |
| **TEST-29** | **3層の分離** | `moneyLevel:25` / ボーナス取得済 | `displayLevel:26` かつ **シェア文面は `Lv.25`** |
| **TEST-56** | **シェア文面に金額を含めない** | 年間増額 `600,000` の State | 生成文面に `600,000` / `600000` / `円` が**含まれない**。`Lv.` と称号のみ（§4.2） |
| **TEST-30** | 次レベルまでの残額 | 年間増額 `12,300` | `nextLevelGap = 2,700` |

### 8.5 フィードバック・ボーナス

| ID | 検証対象 | 入力 | 期待出力 |
| :--- | :--- | :--- | :--- |
| **TEST-31** | ボーナス初回 | 送信成功（1回目） | `levelBonus: 1` |
| **TEST-32** | ボーナス2回目 | 送信成功（2回目） | `levelBonus: 0`（生涯1回） |
| **TEST-33** | **送信失敗時は非付与** | HTTP 200 かつ `success:false` | `success:false` / `levelBonus:0` |
| **TEST-34** | タイムアウト | 10秒無応答 | `reason:'timeout'` / bonus `0` |
| **TEST-35** | 二重送信ガード | 同時に2回呼ぶ | 2回目 `reason:'in_flight'` |
| **TEST-36** | Honeypot | `botcheck:'bot'` | `success:true` / bonus `0` / **fetch を呼ばない** |
| **TEST-37** | **クライアントレート制限** | 4回目の送信 | `reason:'rate_limited'` |
| **TEST-38** | クールダウン | 送信後10秒以内に再送信 | `reason:'cooldown'` ＋ `waitSec` |
| **TEST-39** | **サーバースロットリング** | HTTP 429 | `reason:'throttled'`（TEST-37と別物） |
| **TEST-40** | オフライン | `navigator.onLine = false` | `reason:'offline'` / fetch を呼ばない |
| **TEST-41** | ENDPOINT の同一オリジン | `ENDPOINT` の値 | `/api/feedback` で始まる（**Web3Forms直叩き禁止**） |

### 8.6 永続化・サニタイズ

| ID | 検証対象 | 入力 | 期待出力 |
| :--- | :--- | :--- | :--- |
| **TEST-42** | 呪文 日本語往復 | 日本語を含むState | エンコード→デコードで完全一致（`btoa` 例外なし） |
| **TEST-43** | 呪文 ボーナス保持 | ボーナス取得後に復元 | `feedbackBonusGranted: true` が保持される |
| **TEST-44** | 破損呪文 | `TQ1-INVALID!!` | 例外を捕捉し**既存Stateを破壊しない** |
| **TEST-45** | スキーマ移行 | `schemaVersion` 無しの旧データ | 初期値で補完・例外なし |
| **TEST-46** | 全角メールのマスク | `ｔｅｓｔ＠ｅｘａｍｐｌｅ．ｃｏｍ` | `***@***` |
| **TEST-47** | ハイフン無し電話 | `09012345678` | `***-****-****` |
| **TEST-48** | ハイフン付き電話 | `090-1234-5678` | `***-****-****` |
| **TEST-49** | **絵文字の温存** | `👨‍👩‍👧 テスト` | 削除・分断されず原文のまま残る |
| **TEST-50** | 文字数上限 | 2,000字の自由記述 | 1,000字に切り詰められる |
| **TEST-51** | 全角数字の半角化 | 入力 `６５０００` | State に `65000` |

### 8.7 追加ロジック

| ID | 検証対象 | 入力（前提定数） | 期待出力 |
| :--- | :--- | :--- | :--- |
| **TEST-52** | 銀行手数料 | ATM 3回(`BANK_FEE.atm=110`) / 振込 2回(`=220`) | 月 `770円` / 年 `9,240円`。0入力時は `0円` |
| **TEST-53** | **クレカ還元率の単位** | 年間 `1,500,000` / 現在 `0.5`（**％表記**） / 目標 `CARD_TARGET_RATE_PERCENT=1.0` | 損失 **`7,500円`** |
| **TEST-54** | 還元率が最適済み | 現在 `1.5`（％） | 損失 **`0円`**（負の損失を出さない） |
| **TEST-57** | エリア別家賃 | エリア `tokyo`（`MARKET_AVERAGE_RENT.tokyo=85,000`） / 家賃 `90,000` | 超過 `5,000` / `includedInLevel:false` |
| **TEST-58** | エリア未選択 | `area: null` | `_default`（`urban=65,000`）にフォールバック |
| **TEST-59** | サブスク合算 | `sumSubscriptions(['netflix_standard','primevideo_general'])` | `1,590 + 600 = 2,190円`。未選択時は `0円` ＋ Empty State |
| **TEST-60** | 火災保険アシスト | 「わからない」タップ | `FIRE_INSURANCE_ASSIST_MONTHLY = 833円` |
| **TEST-61** | 放置損失（単利） | 月 `5,000` × 10年 | `600,000円` |
| **TEST-62** | 複利試算 | 月 `5,000` / 年利5% / 10年 | 算出値 ＋ `NISA_DISCLAIMER` の併記 |
| **TEST-63** | タイパ換算 | 節約 `6,000` / 時給 `1,500` | `4.0時間`。時給0で `0`（ゼロ除算なし） |
| **TEST-64** | **サブスクの価格改定** | `resolvePlanMonthly(hulu_single, '2026-09-30')` / `'2026-10-01'` | `1,026円` / `1,320円`（施行日で切替） |
| **TEST-65** | **年額のみプランの月額換算** | `resolvePlanMonthly(nso_family)`（`annual:5,800`） | `483円`（`5800/12` を四捨五入） |
| **TEST-66** | 未知のプランID | `sumSubscriptions(['no_such_plan'])` | `0円`（例外を投げない） |
| **TEST-67** | **サービス内プランの排他** | Netflix スタンダード選択後にプレミアムを選択 | `subscriptionPlanIds` に Netflix のプランが**1件のみ**（重複しない） |
| **TEST-68** | **サブスク選択の呪文往復** | プラン3件選択 → 呪文化 → 復元 | `selections.subscriptionPlanIds` が完全一致 |
| **TEST-69** | **クエスト文言の禁止語** | `QUEST_CATALOG` 全件の title / basis / talkScript / disclaimer | §3.7a の禁止語がいずれも含まれない |
| **TEST-70** | **子ども・子育て支援金の適用開始** | `2026-03-31` / `2026-04-01` | 3月は加算**なし**、4月から `0.23%` 加算（健保料率と1ヶ月ずれる） |
| **TEST-71** | **雇用保険料率の年度切替** | `2026-03-31` / `2026-04-01` | `0.55%` / **`0.50%`**（令和8年度は引き下げ） |
| **TEST-72** | **給与所得控除の段階式** | 年収 `1,900,000` / `3,600,000` / `6,600,000` | `740,000` / `1,160,000` / `1,760,000` |
| **TEST-73** | **所得税の基礎控除** | 合計所得 `4,890,000` / `4,890,001` | `1,040,000` / `670,000` |
| **TEST-74** | **住民税の基礎控除は据え置き** | 合計所得 `3,000,000` | 所得税 `1,040,000` に対し住民税は **`430,000`**（流用していない） |
| **TEST-75** | **労使折半の端数処理** | `roundInsuranceShare(100.5)` / `(100.51)` | `100` / `101`（50銭ちょうどは切り捨て。`Math.round` は不可） |
| **TEST-76** | 高額療養費 年間上限 | 区分ア / イ / オ | `1,680,000` / `1,110,000` / `290,000` |
| **TEST-77** | **通信費の2段階判定** | `judgeSmartphoneCost(8000)` / `(5000)` / `(2500)` | `over_average` / **`improvable`** / `optimized` |
| **TEST-78** | 通信費の差額算出 | `judgeSmartphoneCost(5000)` | `gapToAverage:0` / `gapToOptimized:1001`（平均以下でも最適化余地は出る） |
| **TEST-79** | **クエストの必須フィールド** | `QUEST_CATALOG` 全7件 | `questTitle`／`plainTitle`／`summary`／`description`／`actionLabel`／`completeLabel`／`clearMessage`／`basis`／`talkScript`／`disclaimer` がすべて非空 |
| **TEST-80** | **演出文言の禁止語** | 全7件の `questTitle`／`description`／`clearMessage` | §3.7a の禁止語がいずれも含まれない。かつ `description` 内の金額が `config.js` の定数と一致する |
| **TEST-81** | **その他サブスクの合算** | `otherSubscriptions:[{label:'ジム',monthly:8000},{label:'',monthly:3000}]` | `11,000円`（ラベル空でも算入される） |
| **TEST-82** | **その他サブスクの異常値ガード** | `monthly` に `-500` / `999999` / `'abc'` / `null` | いずれも `0` として扱い、合計を壊さない |
| **TEST-83** | **サブスク総額の統合** | プラン2件（2,190円）＋ その他1件（8,000円） | `subscriptionTotal = 10,190円` |

> **TEST-57〜83 は独立したテストとして実装すること。**他テストへの統合や省略を認めない（v4.1.0 までの「統合してよい」という記述は削除した）。

---

## 9. 事業運用評価・製品版移行基準

* **β版KPI（リリース1ヶ月）**: 累計ユーザー100名以上／シェア率8%以上／フィードバック回収率10%以上
* **製品版移行判定**: **フィードバック回収数が30件以上**に達した時点で、「需要調査トグル」の肯定率が60%を超えている場合、アフィリエイト（PRカード）を非侵入型UI（サブ案内枠）として正式解放する
  * ※30件未満での判定は統計的に無意味なため、期間を延長して待つこと

---

## 10. Claude Code 実装指示

### 10.1 絶対制約プロンプト 11箇条

本仕様書を投入する際、必ず以下を先頭に付与すること。

```markdown
# 🚨 Claude Code 実装時 絶対制約プロンプト（11箇条）

1. Web3Forms の access_key を JS・config.js・HTML のいずれにも記述しないこと。
   フロントは同一オリジンの /api/feedback のみを呼び、キーは
   functions/api/feedback.js 内で env.WEB3FORMS_KEY から読むこと。

2. fetch の成否判定は必ず `res.ok && json.success === true` の二重検査とすること。
   res.ok のみでの成功判定を禁止する。

3. レベル計算の源泉（IMMEDIATE）に家賃（rent）を含めないこと。
   家賃は必ず参考枠として分離し、includedInLevel: false を返すこと。

4. State に currentLevel / moneyLevel / displayLevel / title / avatarKey を保存しないこと。
   これらは selectors.js の純粋関数で都度算出すること。
   State に保存してよい派生的な値は meta.initialLevel と
   meta.feedbackBonusGranted の2つのみである。

5. innerHTML による丸ごと再描画を禁止する。data-bind による差分更新のみとし、
   document.activeElement および IME 変換中（data-composing="1"）の入力欄には
   書き戻さないこと。

6. calc.js と selectors.js は DOM / window / localStorage / fetch に一切触れない
   純粋関数モジュールとすること。tests.html から import するだけで実行できること。

7. 法令数値（保険料率・限度額・等級表・控除額）を推測や記憶で埋めないこと。
   仕様書および config.js に存在しない数値が必要になった場合は、
   TODO コメントを残して実装を停止し、人間に確認を求めること。

8. Xシェア文面には displayLevel ではなく moneyLevel を使用すること。
   シェア文面に金額（年間増額）を含めてはならない。金額はマイカルテ内の
   内部表示のみとする。
   称号は必ず RANK_TABLE から取得し、文字列を直書きしないこと。
   シェアURLは必ず encodeURIComponent を通すこと。

9. 指示がない限り、CSSフレームワーク・プリプロセッサ・バンドラ・ビルドツールを
   導入しないこと。Tailwind / Sass / Vite / webpack / PostCSS を使わない。
   package.json と node_modules を勝手に作らない。npm install を実行しない。
   style.css は素のCSSとして直接編集すること。
   ※将来の Node 導入は §17 の Level 制で行う。人間から Level 指定があった場合のみ従う。

10. 色は必ず HEX または rgb()/rgba() で記述すること。
    oklch() / lab() / color-mix() を禁止する
    （html2canvas が解釈できず、キャプチャ画像が全崩壊するため）。
    色・間隔・文字サイズは :root のCSSカスタムプロパティを経由し、
    コンポーネント側に生の値を直書きしないこと。

11. Node-Ready 原則を守ること（将来の Node 導入を塞がないため）。
    ・外部CDNのURLを js/vendor.js 以外に書かない
    ・import は必ず相対パス＋拡張子 .js（bare specifier も拡張子省略も禁止）
    ・テストは node:test / node:assert 互換のAPIで書く。
      テストファイルは tests/harness.js のみを import し、
      runner.js や node:test を直接 import しない
    ・ソースは js/ に置く。src/ → dist/ の移動を前提にしない
    ・calc.js / selectors.js / config.js の export 関数には JSDoc で型を書く
```

### 10.2 実装フェーズ（この順序を厳守）

| Phase | 内容 | 完了条件 |
| :---: | :--- | :--- |
| **0** | ~~`config.js` の要照合項目を確定~~ | **✅ 完了（v4.5.0 で全定数確定済み）** |
| **1a** | `tests/runner.js` + `tests/harness.js` + `tests.html`（テスト基盤） | `python3 -m http.server` → `tests.html` が「0/0 passed」で表示される（テスト未実装の状態で基盤だけが動く） |
| 1b | `calc.js` + `selectors.js` | **TEST-01〜30, 52〜54, 56 が全通過** |
| 2 | `store.js`（Proxy / 永続化 / 移行 / 呪文） | TEST-42〜45, 51 が全通過 |
| 3 | `index.html` + `style.css`（静的マークアップ） | 全画面が静止状態で表示できる |
| 4 | `ui.js` → `app.js` で結線 | 入力してもフォーカスが飛ばない（iOS実機） |
| 5 | キャプチャ + クリップボード | **iOS実機で画像が写真アプリに保存できる** |
| 6 | `functions/api/feedback.js` + `feedback.js` | TEST-31〜41, 46〜50 が全通過 |
| 7 | `privacy.html` / OGP / アナリティクス | — |
| 8 | `_headers`（CSP）を適用 | **最後に締める**（先に入れると原因切り分けが困難） |

**Phase 0 を飛ばさないこと。**定数が未確定のまま実装すると、モデルが記憶ベースで数値を埋め、後から全箇所を探すことになる。

**Phase 1a を最初に置く理由**: テスト基盤を先に作ることで、Phase 1b 以降は常に「`tests.html` を開けば正否がわかる」状態になる。ビルドレス構成ではテストランナー自体が自作物のため、これを後回しにすると検証手段のないまま実装が進む。

---

## 11. リリース前チェックリスト

### ビルドレス構成の検証（Ver 4.0.0 で新設）
- [ ] リポジトリに `package.json` / `node_modules` / `dist` が**存在しない**（§17 Level 0 の場合）
- [ ] `grep -rn "https://cdn" js/` の結果が `vendor.js` のみ（Node-Ready N-1）
- [ ] テストファイルが `harness.js` 以外を import していない（Node-Ready N-3）
- [ ] `calc.js` / `selectors.js` の export 関数に JSDoc が付いている（Node-Ready N-5）
- [ ] `python3 -m http.server 8000` だけでアプリが起動する
- [ ] `tests.html` をブラウザで開くと全83件が緑になる
- [ ] `style.css` に `oklch(` / `lab(` / `color-mix(` が**含まれていない**
- [ ] CSSの色・間隔・文字サイズが `var(--*)` を経由している（生の値の直書きが無い）
- [ ] `import` 文の拡張子 `.js` が省略されていない
- [ ] Cloudflare Pages のビルドコマンドが**空欄**である
- [ ] html2canvas の CDN URL がバージョン固定されている（`latest` でない）
- [ ] `tests.html` を本番から除外した（またはCSP下で動作を確認した）

### 法令・計算精度
- [ ] `HEALTH_INSURANCE_TABLE` 全50等級を協会けんぽ「令和8年度保険料額表（大阪府）」と突合した
- [ ] TEST-55（テーブル整合性）が通過する
- [ ] 高額療養費 区分ア の `base` / `deductionBase` を厚生労働省資料で確認した
- [ ] 高額療養費 年間上限を全区分について確認した
- [ ] 雇用保険料率（労働者負担）を当年度の値で確認した
- [ ] 令和8年分の給与所得控除・基礎控除を国税庁資料で確認した
- [ ] 額面 `220,000` → 区分エ・`61,500円` が出る
- [ ] 額面 `280,000` → 区分ウ・`92,940円` が出る
- [ ] 額面 `209,999` と `210,000` で等級が正しく分かれる
- [ ] 健康保険料に**子ども・子育て支援金 0.23% が加算**されている
- [ ] 39歳に介護保険料が**加算されていない**
- [ ] 社会人1年目の住民税が `0円` になる
- [ ] 協会けんぽ選択時に付加給付が**適用されない**
- [ ] 傷病手当金の丸め（10円未満→1円未満）が公式試算と一致する
- [ ] 傷病手当金の注記（社会保険料は免除されない旨）が表示される

### フロントエンド挙動
- [ ] 入力欄に連続入力してもフォーカスが外れない（**iOS実機**）
- [ ] 日本語IME変換中に値が壊れない
- [ ] レベルアップトーストが連射されない
- [ ] 入力を空にしても「Lv.NaN」が出ない
- [ ] `localStorage` 無効環境（iOSプライベートブラウズ）でクラッシュしない
- [ ] ボトムシートを閉じてもスクロール位置が飛ばない
- [ ] リボ払いアラートが**点滅していない**
- [ ] `prefers-reduced-motion` で全アニメーションが停止する

### 出力・共有
- [ ] 呪文に日本語が含まれてもエラーが出ない／復元して全値が一致する
- [ ] 壊れた呪文を貼っても既存データが破壊されない
- [ ] マイカルテのキャプチャが iOS Safari で真っ黒／真っ白にならない
- [ ] **iOS Safari で画像が実際に写真アプリへ保存できる**
- [ ] 印刷プレビューで文字が読める
- [ ] シェアURLで `#` 以降が欠落しない
- [ ] **シェア文面のレベルが `moneyLevel`**（`displayLevel` ではない）
- [ ] **シェア文面に金額が含まれていない**（レベル・称号のみ）
- [ ] マイカルテ内には年間増額が金額付きで表示される

### セキュリティ・コンプライアンス
- [ ] `access_key` がフロントのどこにも存在しない（`grep -r "access_key" js/ index.html` が空）
- [ ] Cloudflare の環境変数に `WEB3FORMS_KEY` を Secret として登録した
- [ ] Web3Forms 管理画面でドメイン制限を有効化した
- [ ] Turnstile を導入した（推奨）
- [ ] 送信ボタン連打で多重送信されない
- [ ] 4回目の送信で `rate_limited` になる
- [ ] Honeypot が `required` になっていない
- [ ] 全角メール・ハイフン無し電話がマスクされる
- [ ] **絵文字が削除・分断されない**
- [ ] `privacy.html` を設置し全ページからリンクした
- [ ] 制度基準日「2026年8月1日時点」を明記した
- [ ] クエスト文言に断定的な解約勧奨表現が無い
- [ ] NISA試算の直下に非保証の注記がある
- [ ] PRアコーディオンが閉じた状態でも「［広告を含みます］」が見える
- [ ] Cloudflare Web Analytics のカスタムイベントが発火する
- [ ] CSP適用後もキャプチャ・フォント・フォーム送信が動作する

---


## 12. 制度・法令トレーサビリティ・レジストリ

> **目的**: 本アプリが使用するすべての法令・制度定数について、「**根拠 / 適用値 / 施行日 / 出典 / config.jsのキー / 検証テスト / 最終確認日**」を一元管理する。制度改定時はこの表を起点に作業する。
>
> **反映状況の凡例**
> `✅ 反映済` = 確定値を実装済み ／ `⚠️ 要照合` = 構造は実装済みだが数値の一次資料確認が未了 ／ `🔜 予定` = 施行日が確定している将来の改定 ／ `❌ 未実装` = §13 のスコープ外リストを参照

### 12.1 公的医療保険

| # | 制度・項目 | 根拠 | 適用値 | 施行日 | config.js キー | テストID | 反映状況 | 最終確認日 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| M-01 | 標準報酬月額（健康保険） | 健康保険法40条 | 第1級58,000円〜第50級1,390,000円。**全50等級 突合済み** | 平成28年4月〜（等級区分） | `HEALTH_INSURANCE_TABLE` | TEST-01〜03, 55 | ✅ 反映済 | 2026-08-05 |
| M-02 | 標準報酬月額（厚生年金） | 厚生年金保険法20条 | 第1級88,000円〜第32級650,000円 | 令和2年9月〜 | `PENSION_MIN/MAX_STANDARD` | TEST-04 | ✅ 反映済 | 2026-08-05 |
| M-03 | 健康保険料率（大阪府） | 健康保険法160条 | **10.13%**（労使折半） | 令和8年3月分〜 | `INSURANCE_RATES.healthTotal` | TEST-18 | ✅ 反映済 | 2026-08-05 |
| M-04 | **子ども・子育て支援金率** | 子ども・子育て支援法 | **0.23%**（全国一律・**2026年新設**） | **令和8年4月分（5月納付分）〜**。健保料率（3月分〜）と1ヶ月ずれる | `CHILDCARE_SUPPORT_RATES` | TEST-18, 70 | ✅ 反映済 | 2026-08-05 |
| M-05 | 介護保険料率 | 介護保険法 | **1.62%**（全国一律・**40〜64歳のみ**） | 令和8年3月分〜 | `nursingCareTotal` | TEST-17 | ✅ 反映済 | 2026-08-05 |
| M-06 | 高額療養費 自己負担限度額 | 健康保険法115条 | 区分ア〜オ（**2026年8月改定後**）。区分ア = 270,300円＋(医療費−901,000)×1% | **令和8年8月診療分〜** | `HIGH_MEDICAL_LIMITS` | TEST-06〜09 | ✅ 反映済 | 2026-08-05 |
| M-07 | 高額療養費 多数回該当 | 同上 | 区分ウ・エ 44,400円（**据え置き**） | 令和8年8月〜も据置 | `.multiple` | TEST-10 | ✅ 反映済 | 2026-08-05 |
| M-08 | 高額療養費 **年間上限（新設）** | 同上 | ア168万／イ111万／ウ53万／エ53万／オ29万。算定期間は**8月1日〜翌年7月31日のローリング12ヶ月** | **令和8年8月〜** | `.annualCap` | — | ✅ 反映済 | 2026-08-05 |
| M-09 | 高額療養費 対象外費用 | 同上 | 差額ベッド・食事療養費・先進医療・自由診療 | — | `HIGH_MEDICAL_EXCLUSIONS` | — | ✅ 反映済 | 2026-08-05 |
| M-10 | 付加給付 | 健保組合規約 | **健保組合のみ。協会けんぽには存在しない** | — | `profile.fukaKyufuCap` | TEST-11, 12 | ✅ 反映済 | 2026-08-05 |
| M-11 | 傷病手当金 日額 | **健康保険法99条** | 平均標準報酬月額÷30×2/3（二段階端数処理） | — | `calcInjuryAllowanceDaily` | TEST-13 | ✅ 反映済 | 2026-08-05 |
| M-12 | 傷病手当金 12ヶ月未満の特例 | 同上 | 個人平均と保険者平均の**いずれか低い額**／協会けんぽ **32万円** | **令和7年4月1日〜**（それ以前は30万円） | `SICKPAY_AVG_STD_MONTHLY` | TEST-14〜16 | ✅ 反映済 | 2026-08-05 |
| M-13 | 傷病手当金 待期期間 | 同上 | **連続3日**。支給は4日目から | — | `SICKPAY_WAITING_DAYS` | — | ✅ 反映済 | 2026-08-05 |
| M-14 | 傷病手当金 支給期間 | 同上 | **通算1年6ヶ月** | 令和4年1月1日〜通算化 | `SICKPAY_MAX_MONTHS` | — | ✅ 反映済 | 2026-08-05 |
| M-15 | 傷病手当金 受給中の社会保険料 | — | **免除されない**（産休・育休と異なる） | — | `SICKPAY_NOTE` | — | ✅ 反映済（注記） | 2026-08-05 |

**出典**: 協会けんぽ 令和8年度保険料額表（大阪府）／協会けんぽ 傷病手当金ページ／厚生労働省 高額療養費制度の見直しについて（令和8年8月診療分から）

### 12.2 年金・労働保険

| # | 制度・項目 | 根拠 | 適用値 | 施行日 | config.js キー | テストID | 反映状況 | 最終確認日 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| P-01 | 厚生年金保険料率 | 厚生年金保険法81条 | **18.3%**（労使折半＝本人9.15%）**固定** | 平成29年9月〜（引上げ完了） | `pensionTotal` | TEST-20 | ✅ 反映済 | 2026-08-05 |
| P-02 | 雇用保険料率（労働者負担） | 雇用保険法 | 一般の事業 **5.0/1000（0.5%）**。令和7年度の5.5/1000から引き下げ | 令和8年4月1日**以降に支払われる給与**から | `EMPLOYMENT_INSURANCE_RATES` | TEST-71 | ✅ 反映済 | 2026-08-05 |
| P-03 | 介護保険 第2号被保険者 | 介護保険法9条 | **40歳以上64歳以下** | — | `NURSING_CARE_MIN_AGE` | TEST-17 | ✅ 反映済 | 2026-08-05 |
| P-04 | 労使折半の例外 | — | **雇用保険は労使折半ではない**（事業主負担が大きい） | — | `calcSocialInsurance` | — | ✅ 反映済 | 2026-08-05 |

### 12.3 税制

| # | 制度・項目 | 根拠 | 適用値 | 適用年分 | config.js キー | テストID | 反映状況 | 最終確認日 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| T-01 | 給与所得控除 | 所得税法28条 | 最低保障 **74万円**（本則69万＋特例5万）。以降 190万超30%+8万／360万超20%+44万／660万超10%+110万／850万超は195万で頭打ち | 令和8年分〜 | `salaryDeductionTable` | TEST-72 | ✅ 反映済 | 2026-08-05 |
| T-02 | 基礎控除（**所得税**） | 所得税法86条＋租特 | 合計所得489万以下 **104万円**（本則62万＋特例42万）／489〜655万 67万／655〜2,350万 62万 | 令和8・9年分の特例 | `basicDeductionTable` | TEST-73 | ✅ 反映済 | 2026-08-05 |
| T-03 | 基礎控除（**住民税**）**据え置き** | 地方税法 | **43万円**（所得税と異なり引き上げなし）。単身者の非課税ラインは合計所得45万円 | 令和8年度〜 | `residentBasicDeductionTable` | TEST-74 | ✅ 反映済 | 2026-08-05 |
| T-04 | 所得税 速算表 | 所得税法89条 | 5%〜45%の7区分 | — | `incomeTaxBrackets` | — | ✅ 反映済 | 2026-08-05 |
| T-05 | 復興特別所得税 | 復興財源確保法 | 所得税額の **2.1%** | 平成25年〜令和19年 | `reconstructionSurtaxRate` | — | ✅ 反映済 | 2026-08-05 |
| T-06 | 住民税 所得割 | 地方税法 | **10%**（市町村6%＋道府県4%） | — | `residentTaxRate` | — | ✅ 反映済 | 2026-08-05 |
| T-07 | 住民税 均等割＋森林環境税 | 地方税法／森林環境税法 | 5,000円（均等割4,000円＋森林環境税1,000円） | 令和6年度〜 | `residentTaxPerCapita` | — | ✅ 反映済 | 2026-08-05 |
| T-08 | **住民税の前年所得課税** | 地方税法 | **社会人1年目は課税なし**（2年目6月から） | — | `RESIDENT_TAX_EXEMPT_YEARS` | TEST-19 | ✅ 反映済 | 2026-08-05 |
| T-10 | **労使折半の端数処理** | 健康保険法／厚生年金保険法 | **50銭以下は切り捨て、50銭を超える場合は切り上げ**（`Math.round` では不正確） | — | `roundInsuranceShare()` | TEST-75 | ✅ 反映済 | 2026-08-05 |
| T-09 | 社会保険料控除 | 所得税法74条 | 支払額の全額を所得控除 | — | `calcNetIncome` | — | ✅ 反映済 | 2026-08-05 |

**出典**: 国税庁「令和7年度税制改正による所得税の基礎控除の見直し等について（源泉所得税関係）」／総務省 地方税制度

### 12.4 その他の法令・規制（UI・文言に影響するもの）

| # | 規制 | 根拠 | 本アプリでの対応 | 該当箇所 | 反映状況 |
| :---: | :--- | :--- | :--- | :--- | :---: |
| L-01 | ステルスマーケティング規制 | 景品表示法5条3号（令和5年10月〜） | PRアコーディオンは**閉じた状態でも「［広告を含みます］」を明示** | §3.7b | ✅ 反映済 |
| L-02 | 保険募集の定義 | 保険業法275条 | 断定的な解約勧奨表現を禁止。**禁止語・推奨言い換え表で機械的に検査**（§3.7a） | §3.7a | ✅ 反映済 |
| L-03 | 共済と保険の区別 | 保険業法（共済は適用外） | 用語を混同して表記しない | §3.7b | ✅ 反映済 |
| L-04 | 投資助言の定義 | 金融商品取引法2条8項11号 | NISA試算の直下に非保証注記を表示 | `NISA_DISCLAIMER` | ✅ 反映済 |
| L-05 | 税務相談の定義 | 税理士法52条 | 一般的情報提供に限定する旨を免責に明記 | §1.5, §7.4 | ✅ 反映済 |
| L-06 | 社労士業務の独占 | 社会保険労務士法27条 | 手続き代理は行わない旨を明記 | §1.5 | ✅ 反映済 |
| L-07 | 個人情報の利用目的明示 | 個人情報保護法21条 | `privacy.html` に記載＋フォーム内に自動マスクを明示 | §3.6, §7.4 | ✅ 反映済 |
| L-08 | 光過敏性発作の防止 | WCAG 2.3.1（法令ではないが準拠） | 1秒3回超の点滅を全面禁止 | §3.4 | ✅ 反映済 |
| L-09 | SVGアイコンのライセンス表記 | 各アイコンセットの利用規約 | **β版ではアイコン未使用のため対応不要**。導入時に本行を更新すること | §6.2.13 | ⏸ 該当なし |

### 12.5 サブスクリプション価格データ

> **法令ではないが、変動が最も激しいデータのため本レジストリで管理する。**
> 価格が古いと「見直しの余地」の算出そのものが誤りになる。

| 種別 | 内容 | 反映状況 | 次回確認 |
| :--- | :--- | :---: | :--- |
| 収録件数 | 6カテゴリ / 19サービス / 66プラン | ✅ 反映済 | — |
| UI方式 | 2階層アコーディオン＋サービス内ラジオ（§3.9） | ✅ 反映済 | — |
| 基準日 | 2026年8月時点の公表価格 | ✅ 反映済 | 2026年11月 |
| **施行日付きで登録済みの改定** | Hulu 単体プラン（2026-10-01 に 1,026→1,320円）<br>Google One AI Pro（2026-10-01 に 1,760→2,420円） | ✅ 反映済 | 施行後に旧行の削除可否を判断 |
| 為替変動を受けるもの | Claude Pro（ドル建て $20） | ⚠️ 変動あり | 四半期ごと |
| 意図的に未収録 | Prime Video の広告なしオプション（+390円）、キャリア割引、期間限定キャンペーン | — | — |
| 自由入力枠 | **ジム・習い事・コンタクトの定期便など、店舗ごとに価格が異なるものは「その他」枠で受ける**（最大5件・§3.9） | ✅ 反映済 | — |

### 12.6 市場平均・相場データ

> 法令ではないが、**「見直しの余地」の算出根拠そのもの**であるため本レジストリで管理する。
> 数値が古い、または出典が不適切だと、ユーザーに誤った判断材料を与えることになる。

| # | 項目 | config.js キー | 確定値 | 出典 | 該当期 | 反映状況 |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| K-01 | エリア別の単身向け家賃平均 | `MARKET_AVERAGE_RENT` | 東京76,000／大阪59,000／地方主要都市52,000／その他42,800（全国平均53,000） | 全国賃貸管理ビジネス協会「全国家賃動向」 | 2025年2〜10月度 | ✅ 反映済 |
| K-02 | 単身世帯の移動電話通信料 平均 | `MARKET_AVERAGE_SMARTPHONE` | **6,379円/月** | 総務省統計局「家計調査（家計収支編）」 | 2024年平均 | ✅ 反映済 |
| K-03 | 賃貸の火災保険 相場 | `FIRE_INSURANCE` | 不動産会社経由 2年15,000〜20,000円／ネット型少短 2年8,000〜12,000円 | 各少額短期保険業者・日本損害保険協会 | 2024〜2026年 | ✅ 反映済 |
| K-04 | 銀行手数料 | `BANK_FEE` | ATM時間外110〜220円／他行ネット振込 みずほ一律110円・MUFG/SMBC 154円(3万未満)・220円(3万以上)／窓口990円 | みずほ・三菱UFJ・三井住友 各行手数料表 | 2026年基準 | ✅ 反映済 |
| K-05 | クレジットカードの基準還元率 | `CARD_TARGET_RATE_PERCENT` | 1.0% | 高還元カードの一般的水準 | — | ✅ 反映済 |
| K-06 | NISA の想定利回り | `NISA_ANNUAL_RETURN` | 年5%（仮定値・非保証） | — | — | ✅ 反映済（注記あり） |

**💡 K-02 の活用方針（2段階しきい値）**: 6,379円は「大手キャリアのメインブランド利用層（7,000〜10,000円）」と「オンライン専用プラン・MVNO利用層（2,000〜3,000円台）」が混在した平均値である。**平均以下の利用者にも改善余地を提示する**ため、`judgeSmartphoneCost()` で3段階に判定する。

| 判定 | 条件 | 表示メッセージの方針 |
| :--- | :--- | :--- |
| `over_average` | 6,379円 超 | 平均を上回っている旨と、平均・最適化水準の両方との差額を提示 |
| `improvable` | 3,999円 超 6,379円 以下 | **平均は下回っているが、オンライン専用プランなら月2,000〜3,000円台という選択肢もある**旨を提示 |
| `optimized` | 3,999円 以下 | 十分に最適化されている旨を伝え、見直しを促さない |

**⚠️ 文言上の注意（§3.7a）**: `improvable` の場合に「まだ高い」「損している」と書かないこと。「〜という選択肢もあります」という**情報提示に留める**。平均を下回っている人を否定する表現は、プロダクトへの信頼を損なう。

**💡 K-04 の実装方針**:
1. ATMは平日日中が原則無料であるため、入力欄は「**時間外・土日祝のATM利用回数**」と明示すること。単に「ATM利用回数」と聞くと、無料の利用まで損失として計上され過大な試算になる
2. 振込手数料は **220円で固定**する（決定事項）。家賃等の3万円以上の振込が中心と想定されるため、金額別に聞き分けず入力負荷を抑える
3. ただし「みずほ銀行は他行宛でも一律110円」という事実は、見直し先の候補として案内に含めてよい

#### ⚠️ 使用してはならない出典

| 出典 | 理由 |
| :--- | :--- |
| **総務省「電気通信サービスに係る内外価格差調査」** | 同調査は**中容量（5GB〜20GB）プランについて日本を国際的に安価な水準**と結論している。「大手キャリアは割高」の根拠として引用すると、**出典の趣旨と逆の主張**になり、事実誤認の指摘を受ける |
| 各社のアフィリエイト記事・比較サイト | 中立性が担保されず、§3.7b の透明性方針と矛盾する |

**更新手順**: §6.2.12 の該当プランに `prices[]` を追加する（**既存行を書き換えず、新しい `effectiveFrom` 行を追加する**）。これにより過去日付での再現性が保たれ、古い「魔法の呪文」から復元した場合も当時の金額で再計算できる。

---

## 13. 意図的スコープ外リスト（＝「入れ忘れ」ではないもの）

> **本節の役割**: 以下は**検討したうえで意図的に実装していない**項目である。将来のレビューで「抜けている」と指摘された際は、まず本節を確認すること。判断を覆す場合は、理由とともに本表を更新する。

### 13.1 公的保障・社会保険

| 項目 | 除外理由 | 再検討の条件 |
| :--- | :--- | :--- |
| **賞与（標準賞与額）** | 月額報酬ベースの簡易試算に絞るため。賞与を入れると健康保険（年573万円上限）・厚生年金（1回150万円上限）の別ロジックが必要になる | 製品版で年収ベース試算を導入する場合 |
| **世帯合算・21,000円ルール** | 単身者に限定したプロダクトのため（§5 No-Go #2） | No-Go方針を変更する場合のみ |
| **高額介護合算療養費** | 20〜30代のペルソナでは発生確率が極めて低い | ターゲット年齢を拡大する場合 |
| **出産手当金・育児休業給付** | 単身・独身ペルソナのスコープ外 | ターゲット拡大時 |
| **労災保険給付** | 業務外の傷病（傷病手当金）に論点を絞るため | — |
| **障害年金・遺族年金** | 「手取り最大化」という即効型トリガーの主題から外れる | — |
| **国民健康保険・任意継続被保険者** | 在職中の会社員に限定（被用者保険のみ） | 退職者向け機能を追加する場合 |
| **社会保険の適用拡大（106万・130万の壁）** | 正社員・単身前提のため無関係 | パート層へ拡大する場合 |
| **定時決定・随時改定の実判定** | **解説のみ実装**。実際の4〜6月平均からの等級改定計算は未実装 | 精緻化フェーズ |
| **退職金・企業年金（DB/DC）** | 長期ライフプランは No-Go #3 | — |

### 13.2 税制

| 項目 | 除外理由 | 再検討の条件 |
| :--- | :--- | :--- |
| **扶養控除・配偶者控除・特定親族特別控除** | 単身・独身ペルソナのため（No-Go #2） | — |
| **iDeCo（小規模企業共済等掛金控除）** | β版のスコープ。NISAに論点を絞る | 製品版で検討 |
| **ふるさと納税（寄附金控除）** | 同上。手取り「増額」ではなく返礼品価値の話になり主題がぶれる | 製品版で検討 |
| **住宅ローン控除** | 賃貸単身者が主ターゲットのため | — |
| **医療費控除・生命保険料控除** | 生保料控除は「保険を解約すると控除も減る」という逆方向の論点を生み、β版では複雑化を招く | 製品版で注記として追加を検討 |
| **源泉徴収税額表（甲欄）との厳密一致** | 月次の源泉徴収は概算であり年末調整で精算されるため、**年税額ベースの試算で近似**している | 実額との乖離クレームが出た場合 |
| **住民税の調整控除・所得割の自治体差** | 全国一律10%で近似 | — |

### 13.3 機能・UI

| 項目 | 除外理由 |
| :--- | :--- |
| 金融機関・カードの自動連携 | No-Go #1（個人情報を持たない設計を維持） |
| 100年ライフプラン | No-Go #3 |
| FPへの個別相談誘導 | No-Go #4 |
| 予算管理・履歴蓄積 | No-Go #5 |
| 効果音（Web Audio API） | No-Go #6 |
| ユーザー登録・ログイン | 登録障壁ゼロという中核価値を守るため |
| サーバー側でのデータ保存 | 個人情報保護法上の保有個人データを持たない設計を維持するため |
| ドット絵アバター画像 | 素材未完成。**プレースホルダー構造は実装済み**（§3.8） |
| `.ics` カレンダー連携 | 将来検討（§4.7） |
| **Xシェア時の金額表示** | **意図的に非実装**。マイカルテ（内部）には年間増額の詳細を表示し、ユーザーの個人的な達成感は損なわない。一方、Xシェア（外部公開）はレベル・称号のみとし、個人の金額情報を保護しながらシェアのハードルを低くする（§4.2） |
| **Tailwind CSS / CSSフレームワーク** | **意図的に非採用**（v4.0.0）。ビルド工程を消すことで、環境構築・依存脆弱性・「ローカルでは動くのに本番で壊れる」事故を根絶する。副次的に `oklch()` 混入による html2canvas 破綻（過去欠陥 A-06）も構造的に不可能になる。CSS は §3.1a の設計で手書きする |
| **バンドラ（Vite / webpack / Rollup）** | **現時点で非採用**。ネイティブ ES Modules で足りる。HTTP/2 環境では8ファイル程度の分割はパフォーマンス上の問題にならない。**必要になれば §17 Level 4 で導入可能**（`vendor.js` の2行差し替えのみ） |
| **npm パッケージ全般** | **既定でゼロ依存**。`package.json` を作らない。html2canvas のみ `js/vendor.js` 経由で CDN から動的 import する。**§17 の Level 制で必要分のみ追加可能** |
| **Node.js ベースのテストランナー** | **既定ではブラウザ実行**（`tests.html`）。実ブラウザ環境で検証するため `TextEncoder` / `localStorage` の挙動が本番と一致する。ただし **API を `node:test` 互換にしてあるため、§17 Level 1 で `node --test` を無改修で併用できる** |
| **SVGアイコン（`icons.svg`）** | **β版では非実装**。絵文字とテキストで構成し、リクエスト数とファイルサイズを削減する。§3.10 のプレースホルダー構造は実装済みのため、将来 `--avatar-*` に `url()` を入れるだけで画像化できる。導入時は §12.4 L-09 にライセンス表記の要否を登録すること |
| **ファミリー／学生向けサブスクプラン** | **データは収録済みだが既定UIでは非表示**（`DEFAULT_PLAN_AUDIENCE='single'`）。単身会社員というペルソナに無関係なプランを並べると「入力負荷ゼロ」が壊れるため。トグルで表示可能にする |
| **TypeScript（.ts への書き換え）** | **非採用**（ビルドが必要になるため）。型の意図は JSDoc（§6.1d）で表現し、**§17 Level 2 で `tsc --checkJs` による型検査だけを無改修で追加できる** |

---

## 14. 年次メンテナンス・カレンダー

> **運用ルール**: 各時期に該当する `config.js` のキーのみを更新し、更新後は §12 の該当行の「適用値」と「最終確認日」を必ず書き換える。

| 時期 | 見直し対象 | 更新するキー | 出典 | 影響するテスト |
| :--- | :--- | :--- | :--- | :--- |
| **12月中旬** | 翌年度税制改正大綱の確認（**確定ではない**） | — （情報収集のみ） | 与党税制改正大綱 | — |
| **1月下旬〜2月** | 協会けんぽ 翌年度保険料率の発表 | `INSURANCE_RATES` | 協会けんぽ 都道府県毎の保険料率 | TEST-18, 20 |
| **3月** | 協会けんぽ料率の適用開始（**3月分＝4月納付分から**） | `INSURANCE_RATES.effectiveFrom` | 同上 | TEST-17, 18 |
| **3月下旬** | 税制改正法の成立 | `TAX_CONSTANTS` | 国税庁 | TEST-19 |
| **4月** | 雇用保険料率の年度改定 | `employmentInsuranceEmployee` | 厚生労働省 | — |
| **4月** | 標準報酬月額の等級追加の有無 | `HEALTH_INSURANCE_TABLE` | 協会けんぽ 保険料額表 | TEST-01〜03, 55 |
| **6月** | 住民税の新年度課税開始 | — （ロジック変更なし） | — | TEST-19 |
| **8月** | **高額療養費の改定**（近年は8月施行が定着） | `HIGH_MEDICAL_LIMITS` | 厚生労働省 | TEST-06〜10 |
| **9月** | 定時決定の反映／厚生年金料率（現在は固定） | `pensionTotal` | 日本年金機構 | TEST-20 |
| **随時** | 傷病手当金の保険者平均額 | `SICKPAY_AVG_STD_MONTHLY` | 協会けんぽ | TEST-14 |
| **四半期ごと**<br>（2・5・8・11月） | **サブスクリプション価格**（変動が最も激しい） | `SUBSCRIPTION_PLANS` | 各サービス公式サイト | TEST-59, 64, 65 |
| **2月上旬** | 家計調査の前年平均が公表される | `MARKET_AVERAGE_SMARTPHONE` | 総務省統計局 家計調査 | — |

### 14.1 確定済みの将来改定（要対応リスト）

| 施行時期 | 改定内容 | 対応の要否 | 想定作業量 |
| :--- | :--- | :---: | :--- |
| **2027年8月** | **高額療養費の所得区分が細分化**。区分アは3分割されることが確定済み：年収約1,650万円以上=**342,000円**／約1,410万円以上=**303,000円**／約1,160万円以上=270,300円 | 🔴 **必須** | `HIGH_MEDICAL_LIMITS` に行を追加する。判定ロジックは配列 `find` のままで対応可能（**そのために配列構造にしてある**）。テストを区分数だけ追加 |
| **令和9年分（2027年分）** | 基礎控除の**特例加算（42万円／5万円）が終了**し本則62万円へ戻る見込み | 🟠 必要 | `TAX_CONSTANTS` に `appliedYear: 2027` の行を**追加**（既存行は削除しない） |
| **令和9年1月〜** | 月次源泉徴収に新税額表が適用される（令和8年中は旧ルール） | 🟠 必要 | §6.3a の表示方針を見直す |
| **毎年3月** | 協会けんぽ料率 | 🟠 必要 | `INSURANCE_RATES` に新しい `effectiveFrom` 行を**追加**（既存行は削除しない＝過去日付での再現性を保つ） |

---

## 15. 抜け漏れ再発防止レジストリ

> **本節の役割**: 過去3回の監査で**実際に発生した欠陥**を類型化して残す。新機能を追加する際は、本節を「セルフレビュー用チェックリスト」として使用すること。
>
> **最大の教訓**: 過去の欠陥の多くは「新機能を足す過程で、既存の防御が剥がれた」ことによる。**新しい記述が古い決定を無効化していないか、逆方向のチェックを毎回行うこと。**

### 15.1 過去監査の指摘トレーサビリティ

| ID | 指摘内容（発見時期） | 解消した箇所 | 再発を防ぐテスト |
| :--- | :--- | :--- | :--- |
| A-01 | 高額療養費が改定前の数値だった（第1次） | §6.2.3 / §12.1 M-06 | TEST-06〜09 |
| A-02 | 標準報酬月額テーブル本体が仕様書に無かった（第1次） | §6.2.1 | TEST-01〜03, **55** |
| A-03 | 派生値（レベル・称号）をStateに保存していた（第1次） | §6.4 / §6.5 | TEST-22〜30 |
| A-04 | `innerHTML` 全再描画でフォーカスが飛ぶ（第1次） | §6.6 | 手動: iOS実機 |
| A-05 | `btoa` が日本語で例外を投げる（第1次） | §4.5 | TEST-42 |
| A-06 | Tailwind v4 の `oklch()` で html2canvas が破綻（第1次） | §3.1 / 制約10（v4.0.0でTailwind自体を廃止し根絶） | 手動: キャプチャ確認 |
| D-01 | CDN URL の直書きがバンドラ導入を阻害（第4次・予防的） | §6.1c `vendor.js` / 制約11 | 手動: `grep -rn "https://cdn" js/` が vendor.js のみ |
| D-02 | 独自シグネチャのテストが Node 移行を阻害（第4次・予防的） | §8.0 `harness.js` / 制約11 | `node --test tests/` が通ること |
| A-07 | `sessionStorage` の3回制限がタブ単位で無効（第1次） | §6.8 `checkRateLimit` | TEST-37 |
| A-08 | `config.js` へのキー分離が防御にならない（第1次） | §6.9 プロキシ | TEST-41 |
| B-01 | コードサンプルに `access_key` 直書き（第2次） | §6.9 | TEST-41 ＋ `grep` チェック |
| B-02 | `res.ok` のみで成功判定（第2次） | §6.8 | TEST-33 |
| B-03 | 送信ボーナスがレベルの意味論を破壊（第2次） | §3.2 3層分離 | TEST-29, 31, 32 |
| B-04 | 家賃超過分がレベルに混入（第2次） | §3.3 / §6.2.7 | TEST-27 |
| B-05 | PRがアコーディオン内で不可視（第2次） | §3.7 | 手動: 目視 |
| C-01 | キーを消した結果、機能が動作しなくなった（第3次） | §6.9 プロキシ | TEST-41 |
| C-02 | サニタイズ正規表現が全角・ハイフン無し・絵文字に非対応（第3次） | §6.8 `sanitizePayload` | TEST-46〜49 |
| C-03 | レート制限が脱落（第3次） | §6.8 | TEST-37, 38 |
| C-04 | 「単一完全版」宣言と内容の乖離（第3次） | 本書全体 ＋ §12〜16 | — |
| C-05 | 子ども・子育て支援金 0.23% の新設が未反映（第3次） | §6.2.2 / §12.1 M-04 | TEST-18 |
| C-06 | クレカ還元率の単位（％ vs 小数）が曖昧（第3次） | §6.3 引数名 | TEST-53, 54 |
| C-07 | 高額療養費がオブジェクトで区分判定できない（第3次） | §6.2.3 配列化 | TEST-06〜09 |

### 15.2 頻出の落とし穴カタログ

新しい計算・UIを追加するときは、**必ず以下の全項目を自問すること**。

#### 数値・計算

| # | 落とし穴 | 確認事項 |
| :---: | :--- | :--- |
| 1 | **境界値（以上／未満）** | `>=` と `>` を取り違えていないか。等級表・料率表は必ず「以上〜未満」 |
| 2 | **単位の混在** | ％か小数か／月額か年額か／円か千円か。**引数名に単位を含めること**（例: `currentRatePercent`） |
| 3 | **端数処理の段階と桁** | 四捨五入・切捨・切上のどれか。何桁で。**傷病手当金は10円未満→1円未満の二段階** |
| 4 | **`NaN` / `null` / 負値** | 空入力・不正入力で `NaN` が伝播しないか。負の損失・負のレベルを出さないか |
| 5 | **ゼロ除算** | 時給0での割り算など |
| 6 | **上限・下限のクランプ** | レベル・等級・料率で範囲外の値を返さないか |
| 7 | **「上限」と「いずれか低い方」の混同** | 傷病手当金の32万円は上限ではなく**低い方を採用**する条件 |
| 8 | **別テーブルの混同** | 健康保険と厚生年金は**別の等級表**。オフセットは3 |
| 9 | **労使折半の例外** | 雇用保険は折半ではない |

#### 制度・分岐

| # | 落とし穴 | 確認事項 |
| :---: | :--- | :--- |
| 10 | **施行日による分岐** | 定数は必ず `effectiveFrom` を持つ配列にし、`pickEffective` で選ぶ |
| 11 | **年齢の境界** | 介護保険は40歳から。39歳と40歳で挙動が変わるか |
| 12 | **勤続年数の境界** | 住民税は1年目ゼロ。1年目と2年目で変わるか |
| 13 | **保険者の分岐** | 協会けんぽ／健保組合。付加給付・傷病手当金の平均額が違う |
| 14 | **都道府県の分岐** | 健康保険料率は都道府県別。厚生年金・介護は全国一律 |
| 15 | **決め打ちの禁止** | 所得区分・等級は必ず入力値から自動判定する |
| 16 | **新設された項目** | 子ども・子育て支援金のように**新しい負担が増える**ことがある |

#### フロントエンド実装

| # | 落とし穴 | 確認事項 |
| :---: | :--- | :--- |
| 17 | `fetch` は 4xx/5xx で reject しない | `res.ok && json.success === true` の二重検査 |
| 18 | `fetch` にタイムアウトが無い | `AbortController` 必須 |
| 19 | 二重送信 | `isSubmitting` ガードを `await` の**前**に置く |
| 20 | `Proxy` はトップレベルのみ捕捉 | ネストは再帰的にProxy化 |
| 21 | 派生値のState保存 | 無限ループの原因。セレクタで都度算出 |
| 22 | `btoa` と非ASCII | `TextEncoder` 経由 |
| 23 | `structuredClone(proxy)` | `DataCloneError`。素のオブジェクトに剥がす |
| 24 | `sessionStorage` はタブ独立 | ユーザー単位の制限には `localStorage` |
| 25 | タイマーの多重起動 | `clearTimeout` してから再設定。元ラベルは初回のみ退避 |
| 26 | `encodeURIComponent` の忘れ | シェアURLの `#` 以降が消える |
| 27 | 正規表現の全角・区切り記号 | 全角を半角化してからマッチ。ハイフンは任意化 |
| 28 | 正規表現の Unicode カテゴリ | 絵文字は `\p{S}`。ZWJ(U+200D)・VS16(U+FE0F)を除去すると分断される |

#### モバイル・iOS

| # | 落とし穴 | 確認事項 |
| :---: | :--- | :--- |
| 29 | `<a download>` が効かない | Web Share API → ダウンロード → 長押し案内の3段フォールバック |
| 30 | `navigator.clipboard` のジェスチャ失効 | `await` を挟む前にテキストを同期で用意 |
| 31 | Canvas の面積上限 | `scale` を面積に応じて動的に落とす |
| 32 | `100vh` のズレ | `100dvh` を使う |
| 33 | 背面スクロールの貫通 | `position:fixed` ＋ 閉じる時の `window.scrollTo` 復帰 |
| 34 | 入力時の自動ズーム | `font-size: 16px` 以上 |
| 35 | `type="number"` の副作用 | `inputmode="numeric"` ＋ `type="text"` |
| 36 | IME変換中の値の破壊 | `compositionstart/end` で `data-composing` を管理 |
| 37 | `localStorage` の例外 | プライベートブラウズは `QuotaExceededError` |

#### セキュリティ・配信

| # | 落とし穴 | 確認事項 |
| :---: | :--- | :--- |
| 38 | 静的サイトに秘密は置けない | `config.js` はブラウザに配信される。プロキシか、鍵前提の多層防御か |
| 39 | クライアント制限は防御ではない | レート制限は「うっかり抑止」。本質は層1・2・5（§7.3） |
| 40 | CSPと inline style | `el.style.x = ...` は `style-src-attr` に抵触。html2canvasも同様 |
| 41 | CSP は `_headers` で配信 | `<meta>` では `frame-ancestors` が効かない |
| 42 | Honeypot は `type="hidden"` にしない | Botに検知される。`required` も付けない |
| 43 | 依存の初期ロード | 150KB超のライブラリは動的 `import()` |

#### 文書・プロセス

| # | 落とし穴 | 確認事項 |
| :---: | :--- | :--- |
| 44 | **コードブロックは散文より強い** | 仕様書に載せるコードは本番に出せる完成形のみ。説明用の簡略コードを置かない |
| 45 | **削除は半分** | 危険なものを消したら、安全な代替を実装するまでが1セット |
| 46 | **新記述が古い決定を上書きする** | 更新のたびに逆方向のチェックを行う |
| 47 | **テストだけ先に増える** | 対応する実装仕様が本書に存在するか確認する |
| 48 | 「完全版」の自称 | 宣言する前に §12・§13 との突合を行う |

---

## 16. 変更管理ルール（SOP）

### 16.1 制度・法令が変わったとき

```
① §14 のカレンダーで、該当時期の対象キーを特定する
② 一次資料（協会けんぽ／厚労省／国税庁）で新しい値を確認する
③ config.js を更新する
   ★既存行は削除せず、新しい effectiveFrom 行を「追加」する
     （過去日付での再現性と、呪文で復元された古いデータの整合性を保つため）
④ §12 の該当行を更新する
   ・適用値 ・施行日 ・反映状況 ・最終確認日
⑤ 対応するテストの期待値を更新する（§12 の「テストID」列で特定できる）
⑥ UI の「制度基準日」表示を更新する（SYSTEM_BASE_DATE）
⑦ 改訂履歴に1行追加する
```

### 16.2 新機能を追加するとき

```
① §13（意図的スコープ外リスト）に該当しないか確認する
   → 該当する場合、除外理由が今も有効か検討し、覆すなら §13 を更新する
② §15.2（落とし穴カタログ）の全項目を自問する
③ 計算を追加する場合：
   ・純粋関数として calc.js / selectors.js に置く
   ・定数は config.js に切り出す
   ・レベルに算入するか判断し、§6.2.7 の IMMEDIATE / HIGH_COST を更新する
④ テストを追加し、§8 のマトリクスに行を追加する
⑤ 法令に関わる場合、§12 のレジストリに行を追加する
⑥ 既存の防御（§10.1 制約11箇条）を無効化していないか逆方向に確認する
```

### 16.3 仕様書を更新するとき

```
① 改訂履歴に必ず1行追加する（何を・なぜ）
② コードブロックを追加・変更した場合、それが本番に出せる完成形か確認する
   → 説明目的の簡略コードは載せない。載せるなら「❌ 使用禁止」と明記する
③ §12 / §13 / §14 に影響がないか確認する
④ §10.1 の制約11箇条に追加すべき項目がないか検討する
⑤ §11 のリリース前チェックリストに項目を追加する
```

### 16.4 レビュー時の確認順序（推奨）

```
1. §12 レジストリ  → 法令数値が古くないか（最終確認日を見る）
2. §13 スコープ外  → 「抜けている」指摘が実は意図的除外でないか
3. §14.1 将来改定  → 対応期限が近づいていないか
4. §15.1 過去指摘  → 解消済みの欠陥が再発していないか
5. §8 テスト       → 実装仕様が存在しないテストがないか
6. §10.1 制約      → コードブロックが制約に違反していないか
```

### 16.5 シェア機能・プライバシー設計の更新時

シェア機能（Xシェア・LINE・カレンダー共有等）を追加・変更する際は、必ず以下を確認する：

```
① 「何を公開し、何を非公開にするか」の設計意図を §13 に明記する
② 外部拡散（SNS）では個人の金額情報を含めない（§4.2 参照）
③ 内部・プライベート表示（マイカルテ等）では詳細な金額を表示し、
   ユーザーの達成感・満足度を損なわない
④ ユーザーが「詳細を含める / 含めない」を選択できる設計か確認する
   （強制開示は §13 に明記がない限り禁止）
⑤ privacy.html の個人情報利用目的とシェア範囲が矛盾していないか確認する
```

---

## 17. Node.js 段階導入パス（オプショナル）

> **原則**: Node は「入れる／入れない」の二択ではなく、**必要になった機能の分だけ足す**。
> 各 Level は独立しており、**Level 1 だけ入れて止まる**運用も正しい。
> どの Level でも、**アプリ本体のコード（`js/` 配下）は1行も変更されない**。

### 17.1 Level 一覧

| Level | 得られるもの | 追加するファイル | `js/` の変更 | 所要 |
| :---: | :--- | :--- | :---: | :---: |
| **0** | ビルドレス（**現行・既定**） | — | — | — |
| **1** | CI で自動テスト | `package.json` | **なし** | 15分 |
| **2** | 型チェック（`tsc --checkJs`） | `jsconfig.json` | **なし**（JSDoc は §6.1d で記述済み） | 30分 |
| **3** | Lint / Format の統一 | `eslint.config.js` | 自動整形のみ | 30分 |
| **4** | バンドル・最小化 | `vite.config.js` | **`vendor.js` の2行のみ** | 1時間 |

**Level は飛ばしてよいが、順番は守ること。**Level 4 を先に入れると、テストが無い状態でビルド結果を検証することになる。

### 17.2 導入トリガー（いつ入れるか）

| こうなったら | 導入すべき Level |
| :--- | :---: |
| 複数人で開発する／PR ごとにテストを回したい | **Level 1** |
| `undefined` 由来のバグが増えてきた／リファクタが怖い | **Level 2** |
| コードスタイルの指摘がレビューの主題になってきた | **Level 3** |
| Lighthouse の Performance が 95 を割った／JSが 100KB を超えた | **Level 4** |

**入れるべきでない場合**

* 「なんとなく現代的だから」— ビルド工程は**それ自体が障害の発生源**になる
* 個人開発でレビュアーがいない段階での Level 3
* JS の総量が小さいうちの Level 4（**本アプリの規模では当面不要**）

### 17.3 Level 1：CI で自動テスト

`tests/harness.js` が環境を自動判別するため、**テストコードの書き換えは発生しない**。

```bash
npm init -y
npm pkg set type=module
npm pkg set scripts.test="node --test tests/"
```

```json
// package.json（これだけ。dependencies は空のまま）
{
  "name": "tedori-quest",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test tests/",
    "serve": "python3 -m http.server 8000"
  }
}
```

```yaml
# .github/workflows/test.yml
name: test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: node --test tests/          # ★npm install すら不要（依存ゼロのため）
```

**注意**: `localStorage` / `TextEncoder` に依存するテスト（TEST-37, 38, 42 等）は、Node 側ではスキップまたはモックする。

```javascript
// tests/store.test.js の冒頭に置く
const hasStorage = typeof localStorage !== 'undefined';

test('TEST-37: 4回目の送信で rate_limited になる', { skip: !hasStorage }, () => { /* … */ });
```

**ブラウザ実行（`tests.html`）は引き続き使う。**両方を回すことで、環境差分に起因するバグを検出できる。

### 17.4 Level 2：型チェック

TypeScript への書き換えは行わない。**JSDoc のまま型検査だけを走らせる。**

```bash
npm i -D typescript
```

```json
// jsconfig.json
{
  "compilerOptions": {
    "checkJs": true,
    "noEmit": true,                    // ★出力を作らない。検査のみ
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": false,                   // ★最初は false。段階的に上げる
    "noImplicitAny": false
  },
  "include": ["js/**/*.js", "tests/**/*.js"]
}
```

```bash
npx tsc --noEmit        # エラーが出ても本番には一切影響しない
```

**段階的な厳格化**: まず `js/calc.js` と `js/selectors.js` だけを `include` に入れ、エラーゼロにしてから範囲を広げる。最初から全ファイルを対象にすると、数百件のエラーに埋もれて放置される。

### 17.5 Level 3：Lint / Format

```bash
npm i -D eslint @eslint/js
```

```javascript
// eslint.config.js
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'no-restricted-syntax': [
        'error',
        // ★制約5：innerHTML による再描画の禁止を機械的に検出する
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: '制約5違反: innerHTML による再描画は禁止。data-bind の差分更新を使うこと'
        }
      ],
      'no-restricted-globals': [
        'error',
        // ★制約6：純粋関数モジュールの汚染を防ぐ（calc/selectors には別途 overrides を当てる）
        { name: 'localStorage', message: 'calc.js / selectors.js からは参照しないこと' }
      ]
    }
  },
  {
    // 純粋関数モジュールにはブラウザAPIを一切許可しない
    files: ['js/calc.js', 'js/selectors.js', 'js/config.js'],
    languageOptions: { globals: {} },
    rules: {
      'no-undef': 'error'      // document / window / fetch を使うと即エラーになる
    }
  }
];
```

**これが Level 3 の真価**である。仕様書に散文で書いた制約（innerHTML 禁止、純粋関数の汚染禁止）が、**機械的に検出可能になる**。人間のレビューに頼らずに済む。

### 17.6 Level 4：バンドル・最小化

**`js/` は移動しない。**ビルド成果物だけを `dist/` に出す。

```bash
npm i -D vite
npm i html2canvas          # ★CDN から npm へ切り替える
```

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',                          // ★src/ を作らない（N-5）
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: { main: 'index.html', privacy: 'privacy.html' }
    }
  }
});
```

**コード変更は `js/vendor.js` の2行のみ**（§6.1c で設計済み）。

```javascript
// js/vendor.js — Level 4 での差分はこれだけ
// - const mod = await import(`https://cdnjs.cloudflare.com/.../html2canvas.esm.js`);
+ const mod = await import('html2canvas');
```

**あわせて更新が必要なもの**

| 対象 | 変更内容 |
| :--- | :--- |
| `_headers` の CSP | `script-src` / `connect-src` から `cdnjs.cloudflare.com` を**削除** |
| Cloudflare Pages 設定 | Build command: `npm run build` ／ Output dir: `dist` |
| `.gitignore` | `dist/` と `node_modules/` を追加 |
| §11 チェックリスト | 「`package.json` が存在しない」の項目を無効化する |

**Level 4 導入後も `tests.html` は動作する**（ソースが `js/` に残るため）。開発中はビルドを介さず確認でき、本番のみ最適化されるという理想形になる。

### 17.7 導入時に更新すべき仕様書の箇所

Level を上げた場合、**必ず以下を書き換えること**。放置すると仕様書と実態が乖離する。

| 箇所 | 更新内容 |
| :--- | :--- |
| 改訂履歴 | どの Level をなぜ導入したか |
| §0 ビルドレス構成の原則 | 「既定はビルドレス」から現行 Level の記述へ |
| §6.1 ファイル構成 | 追加されたファイルを反映 |
| §10.1 制約9 | 「導入しないこと」の文言を現行 Level に合わせる |
| §11 チェックリスト | ビルドレス検証項目の要否を見直す |
| §13.3 スコープ外リスト | 導入したものを表から削除し、理由を履歴に残す |
| **§17（本節）** | 現行 Level を明記する |

### 17.8 現行 Level

```
🟢 Level 0（ビルドレス）— 2026年8月5日時点
```

**Level を上げた際は、この行を必ず書き換えること。**仕様書を開いた人が最初に知りたいのは「今どの構成なのか」である。


---

*本仕様書に記載の法令数値は 2026年8月5日時点で一次資料により確定済みです（`⚠️要照合` タグはゼロ）。ただし制度は改定されるため、§14 の年次メンテナンス・カレンダーに従い、§12 のレジストリで「最終確認日」が古くなった項目は再確認してください。*
