// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の問題（答え）は入れず、見本の品物だけ。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
let pw; try { pw = require(path.join(__dirname, "..", "qa", "node_modules", "playwright")); } catch (e) { pw = require("playwright"); }
(async () => {
  const b = await pw.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:70px 80px;background:#151a2e;color:#f3f4f8;position:relative;overflow:hidden">
    <div style="position:absolute;right:90px;top:90px;width:360px;background:#2c3456;border:2px solid #ffffff26;border-radius:28px;padding:24px;display:flex;flex-direction:column;gap:16px">
      <div style="font-size:22px;color:#b9bfd6;font-weight:800">🧴 ペットボトル</div>
      <div style="font-size:26px;line-height:1.5">🍶 しょうゆの<br>ペットボトル</div>
      <div style="background:#3a2f12;border:3px solid #ffc857;border-radius:16px;padding:12px 16px;font-size:26px;font-weight:800">PETボトルのマーク？<br>プラのマーク？</div>
      <div style="border:2px solid #ffffff26;border-radius:14px;padding:12px 16px;font-size:24px;font-weight:800;background:#222944">法律で表示するマークは？</div>
    </div>
    <div style="position:relative;font-size:34px;color:#ffc857;letter-spacing:.1em">容器のマークを当てる・1日5問</div>
    <div style="position:relative;font-size:96px;font-weight:900;margin-top:18px;letter-spacing:.06em;text-shadow:0 0 30px #ffc85755">リサイクル<br>マークよみ</div>
    <div style="position:relative;font-size:38px;margin-top:18px;line-height:1.5">しょうゆはPET、<br>ソースはプラ。</div>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
