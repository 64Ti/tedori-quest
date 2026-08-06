cat > CLAUDE.md << 'EOF'
# てどりクエスト 開発ガイド

## プロジェクト概要
20〜30代単身会社員向けの手取り最大化シミュレーター。
HTML5 + 素のCSS + Vanilla JS (ES Modules)。
★ビルドツール・Node.js を使わないビルドレス構成。

## 仕様書
完全な仕様は `docs/SPEC.md`（3,901行）にある。
指示されたセクションを読んでから実装すること。憶測で補完しない。
全体を毎回読む必要はない。

## 開発サーバ
python3 -m http.server 8000
- アプリ  : http://localhost:8000/
- テスト  : http://localhost:8000/tests.html （全83件）

## 🚨 絶対制約（11箇条）— 例外なく守ること

1. Web3Forms の access_key を JS・config.js・HTML のいずれにも記述しない。
   フロントは同一オリジンの /api/feedback のみを呼び、キーは
   functions/api/feedback.js 内で env.WEB3FORMS_KEY から読む。

2. fetch の成否判定は必ず `res.ok && json.success === true` の二重検査。
   res.ok のみでの成功判定を禁止する。

3. レベル計算の源泉（IMMEDIATE）に家賃（rent）を含めない。
   家賃は参考枠として分離し、includedInLevel: false を返す。

4. State に currentLevel / moneyLevel / displayLevel / title / avatarKey を
   保存しない。selectors.js の純粋関数で都度算出する。
   State に保存してよい派生的な値は meta.initialLevel と
   meta.feedbackBonusGranted の2つのみ。

5. innerHTML による丸ごと再描画を禁止。data-bind による差分更新のみ。
   document.activeElement および IME変換中（data-composing="1"）の
   入力欄には書き戻さない。

6. calc.js と selectors.js は DOM / window / localStorage / fetch に
   一切触れない純粋関数モジュールとする。
   tests.html から import するだけで実行できること。

7. 法令数値（保険料率・限度額・等級表・控除額）を推測や記憶で埋めない。
   docs/SPEC.md および config.js に存在しない数値が必要になった場合は、
   TODO コメントを残して実装を停止し、人間に確認を求める。

8. Xシェア文面には displayLevel ではなく moneyLevel を使用する。
   シェア文面に金額（年間増額）を含めてはならない。
   金額はマイカルテ内の内部表示のみ。
   クエスト名は questTitle ではなく plainTitle を使用する。
   シェアURLは必ず encodeURIComponent 通す。

9. 指示がない限り、CSSフレームワーク・プリプロセッサ・バンドラ・
   ビルドツールを導入しない。Tailwind / Sass / Vite / webpack / PostCSS を
   使わない。package.json と node_modules を勝手に作らない。
   npm install を実行しない。style.css は素のCSSとして直接編集する。

10. 色は必ず HEX または rgb()/rgba() で記述する。
    oklch() / lab() / color-mix() を禁止する
    （html2canvas が解釈できずキャプチャが破綻するため）。
    色・間隔・文字サイズは :root のCSSカスタムプロパティを経由し、
    コンポーネント側に生の値を直書きしない。

11. Node-Ready 原則を守る（将来の Node 導入を塞がないため）。
    ・外部CDNのURLを js/vendor.js 以外に書かない
    ・import は必ず相対パス＋拡張子 .js
    ・テストは node:test / node:assert 互換のAPIで書く。
      テストファイルは tests/harness.js のみを import する
    ・ソースは js/ に置く。src/ → dist/ の移動を前提にしない
    ・calc.js / selectors.js / config.js の export 関数には JSDoc を書く

## 作業の進め方
- 1フェーズずつ実装する。指示されていないフェーズに勝手に進まない。
- テストがあるフェーズは、tests.html で全通過させてから完了を報告する。
- テストを通すために仕様書の期待値を書き換えてはならない。
- 既存ファイルを書き換える前に、影響範囲を報告する。

## コーディング規約
- ES Modules。CommonJS は使わない。
- コメントは日本語。「なぜそうするか」を書く（「何をしているか」は不要）。
- 文言は §3.7a の禁止語・推奨言い換え表に従う。
EOF