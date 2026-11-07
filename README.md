# リサイクルマークよみ

ペットボトル・缶・お菓子の箱・キャップなど、身近な容器や包装に、法律（資源有効利用促進法）で表示するリサイクルのマーク（識別表示）はどれかを当てる学習ゲーム。だれでも同じ1日5問。

- 遊ぶ: <https://satou-aaaaa.github.io/recycle-mark/>
- 品物（例：「しょうゆのペットボトル」「ツナの缶詰」）が出ます。付けるマークを札から選びます（PETボトル・プラ・紙・スチール缶・アルミ缶・表示の義務はない・任意の紙パック/段ボール/ガラスびん）。
- 正しく選ぶと「なぜそのマークか」と出典が出て、マーク帳に集まります（8種類）。
- ★はまちがい＋ヒントの数で決まります（0で★3）。時間の制限はありません。
- 今日の5問と上級（3問・ヒントなし・札4枚）は1日1回。とことんは何度でも、「ここでやめる」まで続きます。遊べなかった日は7日前まで、カレンダーから「あとから」遊べます。
- 答えと説明は、次の資料に沿っています（2026年11月に確かめた内容）。
  - 経済産業省「リサイクル関連マーク」<https://www.meti.go.jp/policy/recycle/main/data/mark/index.html>
  - 経済産業省「識別表示 Q&A」（総論・マークから探す・キーワードから探す。特定調味料・7リットル以上の缶・重さで決める複合素材・キャップシール・非売品など）<https://www.meti.go.jp/policy/recycle/main/admin_info/law/02/faq/faq1.html>・<https://www.meti.go.jp/policy/recycle/main/admin_info/law/02/faq/faq2.html>・<https://www.meti.go.jp/policy/recycle/main/admin_info/law/02/faq/faq3.html>
  - 環境省「環境ラベル等データベース」（紙パック・段ボール・ガラスびんの任意のマーク）<https://www.env.go.jp/policy/hozen/green/ecolabel/c01_03.html>
- マークの絵は出さず、名前で答えます。品物は例です。ごみの分け方・出し方は市町村ごとにちがうので、住んでいる市町村の決まりに従ってください。
- 記録は遊ぶ人のブラウザにだけ残り、ゲームから自動で外へ送ることはありません。例外は2つ：文字（Google Fonts）を読み込むとき、Google に IP アドレスが届きます。「X」「LINE」「コピー」を押したときだけ、結果の四角が選んだ先に渡ります（答えは入りません）。

## 開発

```bash
bash scripts/setup.sh   # 最初に一度
node qa/run.mjs         # 検査（CI と同じ）
node tools/make-icons.cjs && node tools/make-og.cjs   # アイコンと SNS 用の絵を作り直すとき
```

感想は [Issue のフォーム](https://github.com/satou-aaaaa/recycle-mark/issues/new?template=feedback.yml) からどうぞ。
