// usage: node overlay.js "<hebrew text>" out.png   (1080x1920 transparent PNG)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
const t=process.argv[2].replace(/</g,'&lt;');
await p.setContent(`<html><body style="margin:0;width:1080px;height:1920px;background:transparent;direction:rtl;font-family:'Noto Sans Hebrew','Heebo',Arial,sans-serif">
<div style="position:absolute;left:70px;right:70px;bottom:330px;text-align:center"><span style="display:inline-block;background:#050505;color:#fff;border:4px solid #FF00A8;border-radius:50px;font-weight:900;font-size:62px;line-height:1.25;padding:20px 48px;text-wrap:balance">${t}</span></div></body></html>`);
await p.waitForTimeout(300);await p.screenshot({path:process.argv[3],omitBackground:true});await b.close();})();
