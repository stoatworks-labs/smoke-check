// Serve a built static site, load it in headless Chromium, fail on any runtime error
// or an empty app root. This is the check a green build cannot give you: a React
// major mismatch builds fine and throws on first render (RFutils, 2026-08-11 → 09-02).
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
import { chromium } from "playwright";
const dir = path.resolve(process.argv[2] || process.env.SMOKE_DIR || "dist");
const urlPath = process.env.SMOKE_PATH || "/";
const rootSel = process.env.SMOKE_ROOT || "#root, #app, main";
const minText = Number(process.env.SMOKE_MIN_TEXT || 20);
const types = {".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".png":"image/png",".wasm":"application/wasm",".woff2":"font/woff2",".woff":"font/woff",".ico":"image/x-icon"};
const srv = http.createServer((req,res)=>{
  let p=decodeURIComponent(new URL(req.url,"http://x").pathname); if(p.endsWith("/"))p+="index.html";
  let f=path.join(dir,p); if(!f.startsWith(dir)||!fs.existsSync(f)||fs.statSync(f).isDirectory()) f=path.join(dir,"index.html");
  res.writeHead(200,{"content-type":types[path.extname(f)]||"application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
await new Promise(r=>srv.listen(0,"127.0.0.1",r)); const port=srv.address().port;
const browser=await chromium.launch(); const page=await browser.newPage();
const errors=[];
page.on("pageerror",e=>errors.push(`pageerror: ${e.message}`));
page.on("console",m=>{ if(m.type()==="error") errors.push(`console.error: ${m.text()}`); });
page.on("requestfailed",r=>errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
let text=""; let ok=true;
try {
  await page.goto(`http://127.0.0.1:${port}${urlPath}`,{waitUntil:"networkidle",timeout:30000});
  await page.waitForTimeout(500);
  text=(await page.locator(rootSel).first().innerText().catch(()=>""))||"";
} catch(e){ errors.push(`navigation: ${e.message}`); }
await browser.close(); srv.close();
if(errors.length){ ok=false; console.error("✗ runtime errors:"); for(const e of errors) console.error("   "+e); }
if(text.replace(/\s+/g," ").trim().length<minText){ ok=false; console.error(`✗ app root (${rootSel}) rendered ${text.trim().length} chars of text (< ${minText}) — the page is empty`); }
if(ok) console.log(`✓ ${dir}${urlPath}: no runtime errors, root rendered ${text.trim().length} chars`);
process.exit(ok?0:1);
