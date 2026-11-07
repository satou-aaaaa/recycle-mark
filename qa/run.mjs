// リサイクルマークよみの検査。問題の作り方（全部の種類×形×300の種）・マークの決まり（経済産業省の識別表示 Q&A）・札・今日の5問と上級の組み方（3年分）・とことんの並び（500回）・
// 通しで遊ぶ（まちがい・ヒント）・続きから・上級・とことん（並びを使い切っても続く・やめる）・あとから・カレンダー・実績・マーク帳・Ko-fi・シェア・古いタブ・
// 記録の読み合わせ・スマホ幅・押せる大きさ・外へ通信しない・好きなだけ遊べる・PWA・引き継ぎ・見やすさ。
// 使い方: node qa/run.mjs   失敗があれば終了コード 1。結果は qa-report/report.md。
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { checkTransfer } from "./transfer-check.mjs";
import { checkSwStall } from "./sw-check.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = pathToFileURL(path.join(root, "index.html")).href;
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail });
createRequire(import.meta.url)(path.join(root, "gen.js"));
const W = globalThis.RMARK;
const html = readFileSync(path.join(root, "index.html"), "utf8"), gen = readFileSync(path.join(root, "gen.js"), "utf8");
const KEY = "recycle-mark-v1"; // gitleaks:allow 記録の名前（鍵ではない）

// 1. 問題の作り方（ブラウザを使わない）
{
  check("品物の種類は8で、名前は重ならず、どれにも考えどころ（40字以内）がある", W.TYPES.length === 8 && new Set(W.TYPES.map((t) => t.name)).size === 8 && W.TYPES.every((t) => t.look && t.look.length <= 40));
  check("どの種類にも形が4つ以上ある", W.FORMN.every((n) => n >= 4), W.FORMN.join(","));
  const bad = [], keys = new Set(), MV = Object.values(W.M), VOL = [W.M.PACK, W.M.DAN, W.M.BIN], okSeen = new Set(), mk = [];
  for (let t = 0; t < W.TYPES.length; t++) for (let v = 0; v < W.FORMN[t]; v++) for (let s = 0; s < 300; s++) {
    const it = { t, v, s: W.seedOf(`qa:${t}:${v}:${s}`) }, q = W.make(it), q2 = W.make(it), id = `${t}/${v}`;
    if (JSON.stringify(q) !== JSON.stringify(q2)) bad.push(id + ":同じ種で別の問題");
    if (!q.scene || q.scene.length > 40) bad.push(id + ":品物の文 " + q.scene.length);
    if (q.wrong.length < 3 || q.wrong.includes(q.ok) || new Set(q.wrong).size !== q.wrong.length) bad.push(id + ":札");
    for (const x of [q.ok, ...q.wrong]) if (!MV.includes(x)) bad.push(id + ":知らない札 " + x);
    if (!q.why || q.why.length > 80) bad.push(id + ":説明 " + (q.why || "").length);
    if (!q.src.length || q.src.some(([n, u]) => !n || !/^https:\/\/www\.(meti|env)\.go\.jp\//.test(u))) bad.push(id + ":出典");
    if (/undefined|NaN|\$\{/.test(q.scene + q.ok + q.wrong.join() + q.why)) bad.push(id + ":値が入っていない");
    keys.add(q.scene); okSeen.add(q.ok);
    // マークの決まり（経済産業省 識別表示 Q&A）
    if (q.ok === W.M.PET && !/お茶|炭酸|スポーツ|しょうゆ|食酢|みりん/.test(q.scene)) mk.push(id + ":PET は飲み物・酒・特定調味料だけ");
    if (/(ソース|たれ|ドレッシング|シャンプー|洗剤|化粧水|卵).*(ペットボトル|パック)/.test(q.scene) && q.ok !== W.M.PLA) mk.push(id + ":PET でない中身はプラ");
    if (/缶詰|おかずケース|10リットル/.test(q.scene) && !/ラベル/.test(q.scene) && q.ok !== W.M.NONE) mk.push(id + ":飲み物でない缶は義務なし");
    if (VOL.includes(q.ok) && (q.wrong.includes(W.M.NONE) || !q.wrong.some((w) => VOL.includes(w)) || !/付いている/.test(q.ask))) mk.push(id + ":任意のマークの問い");
    if (q.ok === W.M.NONE && q.wrong.some((w) => VOL.includes(w) && /段ボール|びん|紙パック/.test(q.scene))) mk.push(id + ":義務なしと任意が両方正しい");
  }
  check("全部の種類×形×300の種で、問題がいつも同じに作れ、札はまちがい3枚以上・文は短く、出典は国（経済産業省・環境省）の資料", bad.length === 0, [...new Set(bad)].slice(0, 6).join(" / "));
  check("ちがう品物が60以上ある（好きなだけ遊んでも同じ問題が続かない）", keys.size >= 60, String(keys.size));
  check("マークの決まりどおり（PET は飲み物・酒・特定調味料だけ・ソースや洗剤はプラ・食べ物の缶詰は義務なし・任意のマークには「付いている」と問い、義務なしと並べない）", mk.length === 0, [...new Set(mk)].slice(0, 4).join(" / "));
  check("9枚の札（法律の5つ・義務なし・任意の3つ）が、どれも答えになる", MV.every((m) => okSeen.has(m)), MV.filter((m) => !okSeen.has(m)).join(","));
  const NT = W.TYPES.length, cb = [];
  for (let s = 0; s < 2000; s++) for (const n of [3, 4]) { const t = s % NT, it = { t, v: s % W.FORMN[t], s: W.seedOf("c" + s) }, q = W.make(it), c = W.choices(it, n), c2 = W.choices(it, n); if (c.length !== n || new Set(c).size !== n || !c.includes(q.ok) || c.join() !== c2.join()) cb.push(s); }
  check("札：正しいマークを含み、重ならず、同じ問題ならいつも同じ（3枚・上級4枚、2000回）", cb.length === 0, cb.slice(0, 5).join(","));
  const pos = [0, 0, 0, 0]; for (let s = 0; s < 4000; s++) { const t = s % NT, it = { t, v: s % W.FORMN[t], s: W.seedOf("p" + s) }; pos[W.choices(it, 4).indexOf(W.make(it).ok)]++; }
  check("正しい札の位置がかたよらない（4000回で各位置18〜32%）", pos.every((n) => n / 4000 > 0.18 && n / 4000 < 0.32), pos.join(","));
  const okLen = []; for (let s = 0; s < 3000; s++) { const t = s % NT, it = { t, v: s % W.FORMN[t], s }, q = W.make(it), c = W.choices(it, 3); if (Math.max(...c.map((x) => x.length)) === q.ok.length && c.filter((x) => x.length === q.ok.length).length === 1) okLen.push(1); }
  check("正しい札が、いつもいちばん長い札にならない（長さで当てられない。3000回で6割未満）", okLen.length / 3000 < 0.6, String(okLen.length));
  const okShort = []; for (let s = 0; s < 3000; s++) { const t = s % NT, it = { t, v: s % W.FORMN[t], s }, q = W.make(it), c = W.choices(it, 3); if (Math.min(...c.map((x) => x.length)) === q.ok.length && c.filter((x) => x.length === q.ok.length).length === 1) okShort.push(1); }
  check("正しい札が、いつもいちばん短い札にもならない（3000回で6割未満）", okShort.length / 3000 < 0.6, String(okShort.length));
  const allText = gen;
  check("言い切りすぎない（マークがあれば必ずリサイクルされる、などと書かない）", !/必ずリサイクル|絶対に|これで安心/.test(allText + html));
  check("ごみの出し方は市町村の決まりに従うよう、遊び方と「このゲームについて」に書く", (html.match(/市町村の/g) || []).length >= 2);
  check("マークの絵を出さない（形を一次資料で確かめていないので、名前で答える）", !/<svg|<img/.test(gen));
  const FUNNY = ["（うそ）", "爆笑", "ツッコミ", "草生え", "ｗｗ"];
  check("お笑いの言葉を入れない（本物っぽさ優先）", !FUNNY.some((w) => (allText + html).includes(w)));
  check("gen.js は Math.random を使わない（同じ日はだれでも同じ問題）", !/Math\.random/.test(gen));
  check("index.html の Math.random はとことんの並び・回の名札だけ（3か所）", (html.match(/Math\.random/g) || []).length === 3, String((html.match(/Math\.random/g) || []).length));
  // 比較の関数の引数（(a, b)）を読み飛ばしてから、同じ文の中の乱数を探す（[^)]* だと最初の ) で止まり、ふつうの書き方を見逃した。2026-11-07 CodeRabbit）
  const sortRand = (html + gen).match(/\.sort\(\s*(?:function\s*)?\([^)]*\)\s*(?:=>)?[^;]{0,200}?(Math\.random|\bR\(\)|\brng\(|\br\(\))/g) || [];
  check("乱数を sort の比較の中で引かない", sortRand.length === 0, sortRand.slice(0, 3).join(" / "));
  check("sort の乱数の検査は、ふつうの書き方を見つける", [".sort(() => Math.random() - 0.5)", ".sort((a, b) => R() - .5)", ".sort(function (a, b) { return rng() - 0.5; })"].every((t) => /\.sort\(\s*(?:function\s*)?\([^)]*\)\s*(?:=>)?[^;]{0,200}?(Math\.random|\bR\(\)|\brng\(|\br\(\))/.test(t)));
  check("画面の文字に ${ が出る書き方をしていない（'…' の中の ${）", !/'[^'\n]*\$\{[^'\n]*'/.test(html.replace(/`[^`]*`/gs, "")));
}

// 2. PWA・好きなだけ遊べる・外へ通信しない（ファイルを読む）
{
  const sw = readFileSync(path.join(root, "sw.js"), "utf8"), man = JSON.parse(readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  const shell = JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  check("sw.js の SHELL のファイルが全部ある（transfer.js も入っている）", shell.every((f) => f === "./" || existsSync(path.join(root, f))) && shell.includes("./transfer.js") && shell.includes("./gen.js"));
  check("sw.js は取り直して保存する（cache: reload。game-dev.md の PWA）", /cache: "reload"/.test(sw));
  { const st = await checkSwStall(sw); check("PWA：本文の途中で通信が止まっても4秒で保存したものを返す・ふつうはネットの返事", st.ok, JSON.stringify(st)); }
  check("manifest のアイコンが全部ある", man.icons.every((i) => existsSync(path.join(root, i.src))) && existsSync(path.join(root, "og.png")));
  check("チケット・回数制限・🔒で開くモードを入れない（game-dev.md F1・F2）", !/🎫|すると開く|チケット|スタミナ|ライフ/.test(html));
  check("CSP の connect-src は 'self' のまま", /connect-src 'self';/.test(html));
  check("見やすさの設定は shared-workflows template/a11y/a11y.html の写し（a11y:begin〜end）", /<!-- a11y:begin[\s\S]*<!-- a11y:end -->/.test(html));
  check("引き継ぎの部品を読む（data-keys は記録のキーだけ）", /<script src="transfer.js" data-game="recycle-mark" data-keys="recycle-mark-v1"><\/script>/.test(html));
}

// 3. ブラウザで遊ぶ
let browser = null;
const errors = [], outside = [];
const newPage = async (w = 390, h = 800, init) => {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await p.route(/^https?:/, (r) => { const u = r.request().url(); if (!/fonts\.(googleapis|gstatic)\.com/.test(u)) outside.push(u); r.abort(); });
  if (init) await p.addInitScript(init);
  await p.goto(url);
  return p;
};
const closeHow = (p) => p.evaluate(() => { const d = document.getElementById("howto"); if (d.open) document.getElementById("howto-ok").click(); });
const curOf = (p) => p.evaluate(() => { const c = window.__gw.cur(); return { okJ: c.ch.indexOf(c.q.ok), n: c.ch.length, t: c.q.t, tip: c.q.tip, ok: c.q.ok, ph: c.ph, m: c.m, hints: c.hints, mode: c.mode, i: c.i, bad: c.bad, out: c.out }; });
const wrongJ = (c) => [...Array(c.n).keys()].find((j) => j !== c.okJ && !c.bad.includes(j) && !c.out.includes(j));
async function answer(p) { const c = await curOf(p); await p.click(`[data-j="${c.okJ}"]`); return c; }
const setDate = (d) => `(() => { const real = Date.now; const off = Date.parse("${d}T03:00:00Z") - real(); Date.now = () => real() + off; })();`;
try {
  browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  { // 今日の5問と上級の組み方（3年分）・とことんの並び
    const p = await newPage();
    const r = await p.evaluate(() => {
      const g = window.__gw, B = window.RMARK, bad = [], N = B.TYPES.length, T = B.FORMN.reduce((a, b) => a + b, 0); let d = Date.parse("2026-11-07");
      for (let i = 0; i < 1096; i++, d += 864e5) {
        const k = new Date(d).toISOString().slice(0, 10), a = g.dailyList(k), b = g.dailyList(k), h = g.hardList(k);
        if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(k + ":同じ日で変わる");
        if (a.length !== 5 || new Set(a.map((x) => x.t)).size !== 5) bad.push(k + ":今日の5問");
        if (h.length !== 3 || new Set(h.map((x) => x.t)).size !== 3 || h.some((x) => a.some((y) => y.t === x.t))) bad.push(k + ":上級");
        for (const x of [...a, ...h]) if (!g.qOf(x) || !g.qOf(x).ok) bad.push(k + ":問題");
      }
      const eb = []; let first = 0;
      for (let n = 0; n < 500; n++) {
        const last = n % N, L = g.endlessList(last), ids = L.map((x) => x.t + ":" + x.v);
        if (new Set(ids).size !== ids.length || ids.length !== T) eb.push("重なり");
        for (let i = 1; i < L.length; i++) if (L[i].t === L[i - 1].t) eb.push("続けて同じ種類");
        if (L[0].t === last) first++;
      }
      return { bad: bad.slice(0, 5), eb: [...new Set(eb)], first, T };
    });
    check("今日の5問・上級の3問（3年分）：同じ日はいつも同じ・種類は重ならない・上級は今日と別の種類", r.bad.length === 0, r.bad.join(" / "));
    check(`とことんの並び（500回）：1つの並びの中で同じ種類×形は出ず（${r.T}問）、続けて同じ種類も出さず、前の並びの最後の種類から始めない`, r.eb.length === 0 && r.first === 0, r.eb.join(",") + " 始め:" + r.first);
    await p.close();
  }
  { // 通しで遊ぶ：今日の5問
    const p = await newPage(390, 800, setDate("2026-11-10"));
    check("はじめて開くと遊び方が出る", await p.evaluate(() => document.getElementById("howto").open));
    await closeHow(p);
    check("はじめての人も、今日・とことん・上級・マーク帳・実績・カレンダーを全部押せる（鍵なし）", await p.evaluate(() => ["go-d", "go-e", "go-h", "go-dex", "go-ach", "go-cal"].every((id) => { const b = document.getElementById(id); return b && !b.disabled; })));
    await p.click("#go-d");
    let c = await curOf(p);
    check("品物の札（種類・品物）と、答えの札が3枚出る", (await p.locator(".card .scene").count()) === 1 && (await p.locator(".cho").count()) === 3);
    // 1問目：まちがい1回・ヒント2回
    const wrong = wrongJ(c);
    await p.click(`[data-j="${wrong}"]`); await p.waitForTimeout(100);
    check("まちがいの札を押すと ✕ と破線になり、知らせが出る（色だけにしない）", await p.evaluate((j) => { const b = document.querySelector(`[data-j="${j}"]`); return b.classList.contains("bad") && getComputedStyle(b, "::before").content.includes("✕") && getComputedStyle(b).borderStyle === "dashed"; }, wrong) && /✕/.test(await p.textContent("#live")));
    await p.click(`[data-j="${wrong}"]`, { force: true });
    check("まちがえた札をもう一度押しても数えない", (await curOf(p)).m === 1);
    await p.click("#hint");
    check("ヒント1回目は「考えどころ」だけ（正しい札の言葉を言わない）", (await p.locator(".tipbox").count()) === 1 && !(await p.textContent(".tipbox")).includes(c.ok));
    await p.click("#hint");
    c = await curOf(p);
    const left = await p.evaluate(() => document.querySelectorAll(".cho:not(.out):not(.bad)").length);
    check("ヒント2回目はまちがいの札を1枚外し、正しい札は残す", c.hints === 2 && left === 1 && c.out.length === 1 && !c.out.includes(c.okJ) && (await p.locator("#hint").isDisabled()));
    await p.reload(); await closeHow(p); await p.click("#go-d");
    check("答える途中で開き直しても、まちがえた札・外した札・ヒントのまま", (await p.locator(".cho.bad").count()) === 1 && (await p.locator(".cho.out").count()) === 1 && (await p.locator(".tipbox").count()) === 1);
    await p.click(`[data-j="${c.okJ}"]`);
    check("正しい札を押すと ✓ と太い枠になり、なぜ・出典（国の資料へのリンク）が出る", (await p.locator("#verdict").count()) === 1 && (await p.textContent("#verdict")).includes("なぜ") && (await p.locator('#verdict .srcs a[href^="https://www."]').count()) >= 1 && await p.evaluate((j) => document.querySelector(`[data-j="${j}"]`).classList.contains("hit"), c.okJ));
    await p.click("#next");
    await answer(p); await p.click("#next");
    c = await curOf(p);
    await p.click(`[data-j="${wrongJ(c)}"]`);
    await p.reload(); await closeHow(p);
    check("途中で閉じても、ホームに「続きから（3問目）」が出る", (await p.textContent("#go-d")).includes("3問目"));
    await p.click("#go-d");
    const c3 = await curOf(p);
    check("続きからは同じ問題・押したまちがいのまま", c3.i === 2 && c3.m === 1 && (await p.locator(".cho.bad").count()) === 1);
    for (let i = 2; i < 5; i++) { await answer(p); await p.click("#next"); }
    const s = await p.evaluate(() => window.__gw.load());
    const rec = s.days["2026-11-10"];
    check("5問を終えると今日の記録が残り、★はまちがい＋ヒントで決まる（1問目は★1）", rec && rec.r.length === 5 && rec.r[0].m + rec.r[0].h >= 2 && (await p.locator(".res > div").count()) === 5);
    const share = await p.textContent("#share");
    check("シェアの文に答え（品物・札の言葉）を出さない", !/[ぁ-んァ-ヶ一-龠]{3,}/.test(share.replace("リサイクルマークよみ", "").replace("上級", "")) && /#4/.test(share), share);
    check("結果の画面に「続けて遊ぶ：とことん」の大きなボタン", (await p.locator("#go-e.main").count()) === 1);
    check("まちがい・ヒントがあった日は Ko-fi の1行を出さない", (await p.locator('.note a[href*="ko-fi"]').count()) === 0);
    check("マーク帳に正しく選んだ種類が載る", s.total === 5 && Object.keys(s.dex).length === 5);
    await p.click("#home");
    check("ホームの Ko-fi は下の1行（フッター）だけ", (await p.locator('a[href*="ko-fi"]').count()) === 1 && (await p.locator('footer a[href*="ko-fi"]').count()) === 1);
    check("終えた日はホームに今日の結果（四角）が出る", (await p.textContent(".share")).includes("今日の結果"));
    // 上級
    await p.click("#go-h");
    check("上級はヒントのボタンが無く、札は4枚", (await p.locator("#hint").count()) === 0 && (await p.locator(".cho").count()) === 4);
    for (let i = 0; i < 3; i++) { await answer(p); await p.click("#next"); }
    const s2 = await p.evaluate(() => window.__gw.load());
    check("上級を全部★3で終えると記録が残り、Ko-fi の1行が結果の画面に出る（初めてのときだけ）", s2.hdays["2026-11-10"] && (await p.locator('.note a[href*="ko-fi"]').count()) === 1);
    check("上級の結果に新しい実績（🏅）が出る", (await p.locator(".newach").count()) === 1);
    await p.click("#home"); await p.click("#go-h");
    check("もう一度開いても Ko-fi の1行は出さない", (await p.locator('.note a[href*="ko-fi"]').count()) === 0);
    await p.close();
  }
  { // とことん：並びを使い切っても続く・まちがえても続く・やめると結果
    const p = await newPage(390, 800, setDate("2026-11-10"));
    await closeHow(p); await p.click("#go-e");
    const seen = [], N = await p.evaluate(() => window.RMARK.FORMN.reduce((a, b) => a + b, 0));
    for (let i = 0; i < N + 4; i++) {
      const c = await curOf(p); seen.push(c.t);
      if (i === 1) await p.click(`[data-j="${wrongJ(c)}"]`);
      await answer(p); await p.click("#next");
    }
    const r = await p.evaluate(() => window.__gw.load().runs.e);
    check(`とことんは並び（${N}問）を使い切っても次の並びを足して続き、まちがえても終わらない`, r && r.res.length === N + 4 && r.list.length >= N * 2);
    check("とことんで続けて同じ種類が出ない（つなぎ目も）", seen.every((t, i) => i === 0 || t !== seen[i - 1]));
    await p.reload(); await closeHow(p);
    check("とことんは閉じても続きから", (await p.textContent("#go-e")).includes(`続きから（${N + 4}問）`));
    await p.click("#go-e"); await p.click("#quit");
    const s = await p.evaluate(() => window.__gw.load());
    check("「ここでやめる」で結果が出て、一度で正しく選んだ数が自己ベストに残る", (await p.textContent("body")).includes(`${N + 4}問を解いた`) && s.ebest === r.res.filter((x) => !x.m && !x.h).length && s.ebest >= N + 3 && !s.runs.e);
    check("とことんは今日の記録・連続には数えない", Object.keys(s.days).length === 0);
    await p.close();
  }
  { // あとから・カレンダー・実績
    const p = await newPage(390, 800, setDate("2026-11-12"));
    await p.evaluate((K) => { localStorage.setItem(K, JSON.stringify({ v: 1, tut: true, days: { "2026-11-07": { r: [{ m: 0, h: 0, t: 1 }] }, "2026-11-11": { r: [{ m: 0, h: 0, t: 2 }] } }, hdays: {}, adays: {}, dex: { 1: 1, 2: 1 }, total: 2, ebest: 0, runs: {}, kofi: {}, ach: {}, t: 1 })); }, KEY);
    await p.reload();
    check("ホームに「あとから遊べる日」の数が出る（11/8〜11/10の3日）", (await p.textContent("#go-cal")).includes("あとから遊べる日 3"));
    check("連続の日は1以上のときだけ出す（1日続けて）", (await p.textContent("body")).includes("1日続けて"));
    await p.click("#go-cal");
    check("カレンダー：遊んだ日は★、あとから遊べる日は▶のボタン（点線）、EPOCH より前の月へは戻れない", (await p.locator("[data-late]").count()) === 3 && (await p.locator(".cal .d i", { hasText: "★" }).count()) === 2 && (await p.locator("#pm").isDisabled()));
    await p.click('[data-late="2026-11-09"]');
    const want = await p.evaluate(() => JSON.stringify(window.__gw.dailyList("2026-11-09")));
    check("あとからは、その日の今日の5問と同じ問題", (await p.evaluate(() => JSON.stringify(window.__gw.load().runs["a:2026-11-09"].list))) === want);
    for (let i = 0; i < 5; i++) { await answer(p); await p.click("#next"); }
    const s = await p.evaluate(() => window.__gw.load());
    check("あとから遊んだ日は adays に入り、今日の記録（days）・シェア・Ko-fi には入らない", s.adays["2026-11-09"] && !s.days["2026-11-09"] && (await p.locator("#share").count()) === 0 && (await p.locator('.note a[href*="ko-fi"]').count()) === 0);
    await p.click("#home"); await p.click("#go-cal");
    check("あとから遊んだ日は ↺ になり、もう ▶ にならない", (await p.locator("[data-late]").count()) === 2 && (await p.locator(".cal .d i", { hasText: "↺" }).count()) === 1);
    await p.click("#back"); await p.click("#go-ach");
    const n = await p.locator(".achs > div").count();
    check("実績は10〜14個で、まだのものは「いま/目標」を出す", n >= 10 && n <= 14 && (await p.textContent(".achs")).includes("いま "));
    await p.click("#back"); await p.click("#go-dex");
    check("マーク帳：まだの種類は名前を出さず「？？？」", (await p.locator(".dex .no").count()) > 0 && (await p.textContent(".dex .no")).includes("？？？"));
    await p.close();
  }
  { // 古いタブ・記録の読み合わせ
    const p = await newPage(390, 800, setDate("2026-11-10"));
    await closeHow(p); await p.click("#go-d");
    await p.evaluate((K) => { const s = JSON.parse(localStorage.getItem(K)); s.runs.d.id = "other-tab"; s.runs.d.res = [{ m: 0, h: 0, t: 0 }]; localStorage.setItem(K, JSON.stringify(s)); }, KEY);
    { const c = await curOf(p); await p.click(`[data-j="${c.okJ}"]`); await p.waitForTimeout(100); }
    const s = await p.evaluate(() => window.__gw.load());
    check("別のタブで回が変わっていたら、古いタブの答えで書き込まない（二重に数えない）", s.runs.d.id === "other-tab" && s.runs.d.res.length === 1 && s.total === 0);
    const m = await p.evaluate(() => { const g = window.__gw, f = g.fresh(); const a = Object.assign(f, { t: 5, days: { "2026-11-01": { r: [] } }, dex: { 3: 4 }, total: 9 }); const b = Object.assign(g.fresh(), { t: 9, days: { "2026-11-02": { r: [] } }, dex: { 3: 1, 5: 2 }, total: 3, ebest: 4 }); return g.merge(a, b); });
    check("2つの記録を合わせると、日ごとの記録は両方・図鑑と数は多いほうを残す", m.days["2026-11-01"] && m.days["2026-11-02"] && m.dex[3] === 4 && m.dex[5] === 2 && m.total === 9 && m.ebest === 4);
    const m2 = await p.evaluate(() => { const g = window.__gw, base = { mode: "d", date: "2026-11-10", id: "x", list: [1, 2, 3, 4, 5] }; const a = Object.assign(g.fresh(), { t: 9, runs: { d: Object.assign({}, base, { res: [] }) } }), b = Object.assign(g.fresh(), { t: 5, runs: { d: Object.assign({}, base, { res: [{ m: 0, h: 0 }, { m: 1, h: 0 }] }) } }); return g.merge(a, b).runs.d.res.length; });
    check("同じ回の途中経過は、新しく保存したほうでなく進んだほうを残す", m2 === 2);
    const m3 = await p.evaluate(() => { const g = window.__gw, base = { mode: "d", id: "x", list: [1, 2, 3, 4, 5], res: [1, 2, 3, 4, 5].map(() => ({ m: 0, h: 0, t: 0 })) }; const a = Object.assign(g.fresh(), { t: 9, runs: { d: Object.assign({}, base, { date: "2026-11-11", res: [] }) } }), b = Object.assign(g.fresh(), { t: 5, runs: { d: Object.assign({}, base, { date: "2026-11-10" }) } }); const r = g.merge(a, b); return !!r.days["2026-11-10"] && r.runs.d.date === "2026-11-11"; });
    check("結果を見る前に別のタブが次の日を始めても、終えた日の記録を残す", m3);
    await p.evaluate((K) => localStorage.setItem(K, JSON.stringify({ v: 1, tut: true, days: "x", dex: { 0: "a" }, total: "zz", runs: [] })), KEY);
    await p.reload();
    check("壊れた記録（形のちがう値）でも画面が出る", (await p.locator("#go-d").count()) === 1);
    await p.close();
  }
  { // スマホ幅・押せる大きさ
    const p = await newPage(320, 640, setDate("2026-11-10"));
    await closeHow(p);
    const wide = async (name) => { const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, small: [...document.querySelectorAll("button, a")].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height < 44 && !b.closest(".a11y-dlg") && !b.closest("dialog:not([open])"); }).map((b) => b.textContent.trim().slice(0, 12)) })); check(`幅320px・${name}：横にはみ出さず、押せる所は高さ44px以上`, r.sw <= 320 && r.small.length === 0, `${r.sw} ${r.small.join(",")}`); };
    await wide("ホーム");
    await p.click("#go-d"); await wide("遊ぶ画面");
    const c = await curOf(p); await p.click(`[data-j="${c.okJ}"]`); await wide("答えの説明の画面");
    await p.goto(url); await closeHow(p); await p.click("#go-cal"); await wide("カレンダー");
    await p.close();
  }
  { // 引き継ぎコード（shared-workflows template/qa/transfer-check.mjs）
    const sample = { [KEY]: JSON.stringify({ v: 1, tut: true, days: { "2026-11-07": { r: [{ m: 0, h: 0, t: 3 }] } }, hdays: {}, adays: {}, dex: { 3: 1 }, total: 1, ebest: 2, runs: {}, kofi: {}, ach: {}, t: 1 }) };
    await checkTransfer({ browser, url, game: "recycle-mark", sample, check, open: async (page) => { await page.evaluate(() => { const d = document.getElementById("howto"); if (d.open) d.close(); }); } });
  }
} catch (e) {
  check("QA の操作が最後まで完了する", false, e.message.split("\n")[0] + " " + ((e.stack || "").match(/run\.mjs:\d+/) || [""])[0]);
} finally {
  if (browser) await browser.close();
}
check("画面のエラーが無い", errors.length === 0, errors.slice(0, 3).join(" | "));
check("外へ通信しない（Google Fonts の文字だけ）", outside.length === 0, outside.slice(0, 3).join(" "));
{ // 見やすさ・読みやすさ・偏り（shared-workflows template/qa/a11y.mjs の写し。routines/game-dev.md「だれでも遊べるように」）
  const a = spawnSync(process.execPath, [path.join(root, "qa", "a11y.mjs")], { encoding: "utf8", env: process.env });
  check("見やすさ・読みやすさの検査（qa/a11y.mjs。中身は qa-report/a11y.md）", a.status === 0, (a.stdout.match(/^- ❌.*$/gm) || []).join(" / ") || (a.status ? a.stderr.slice(-300) : ""));
}

const ng = results.filter((r) => !r.ok);
const md = `# リサイクルマークよみ QA\n\n${results.map((r) => `- ${r.ok ? "✅" : "❌"} ${r.name}${r.detail ? `（${r.detail}）` : ""}`).join("\n")}\n\n${ng.length ? `❌ ${ng.length}件` : `✅ ${results.length}項目すべて通過`}\n`;
mkdirSync(path.join(root, "qa-report"), { recursive: true });
writeFileSync(path.join(root, "qa-report/report.md"), md);
console.log(md);
process.exit(ng.length ? 1 : 0);
