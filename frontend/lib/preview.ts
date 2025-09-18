// Helpers that inject small scripts into generated HTML rendered in sandboxed iframes.

const inject = (html: string, script: string) =>
  /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${script}</body>`) : html + script;

// Forwards Ctrl/⌘+wheel (and trackpad pinch) and Ctrl/⌘ +/-/0 from inside the preview to the studio.
const ZOOM_BRIDGE = `<style>*{scrollbar-width:thin;scrollbar-color:rgba(100,116,139,.45) transparent}::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:transparent}::-webkit-scrollbar-button{display:none}::-webkit-scrollbar-thumb{background:rgba(100,116,139,.4);border:3px solid transparent;border-radius:999px;background-clip:padding-box}::-webkit-scrollbar-thumb:hover{background-color:rgba(66,185,187,.85)}</style><script>(function(){
addEventListener('wheel',function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();parent.postMessage({p2c:'zoom-wheel',dy:e.deltaY},'*')}},{passive:false});
addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&['=','+','-','0'].indexOf(e.key)>-1){e.preventDefault();parent.postMessage({p2c:'zoom-key',key:e.key},'*')}});
})();</script>`;

export const withZoomBridge = (html: string) => inject(html, ZOOM_BRIDGE);

export type CaptureOptions = { id: string; width: number; height: number | "full"; scale: number; type: "image/png" | "image/jpeg"; quality: number };

// Renders the page with html-to-image (SVG foreignObject) inside the sandboxed iframe and posts back a
// data URL. Unlike html2canvas it doesn't clone into a nested iframe, so it works without allow-same-origin
// (which we never grant: generated code must not reach the app's origin/session).
export const withCapture = (html: string, o: CaptureOptions) =>
  inject(
    html,
    `<script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js"></script>
<script>(function(){
function send(m){parent.postMessage(Object.assign({p2c:'capture',id:${JSON.stringify(o.id)}},m),'*')}
function go(){
  var d=document.documentElement, b=document.body||d;
  var w=${o.width};
  var h=${o.height === "full" ? "Math.max(d.scrollHeight,b.scrollHeight)" : o.height};
  var bg=getComputedStyle(b).backgroundColor;
  if(!bg||bg==='rgba(0, 0, 0, 0)'||bg==='transparent'){bg=getComputedStyle(d).backgroundColor}
  if(!bg||bg==='rgba(0, 0, 0, 0)'||bg==='transparent'){bg='#ffffff'}
  htmlToImage.toCanvas(d,{width:w,height:h,canvasWidth:w,canvasHeight:h,pixelRatio:${o.scale},backgroundColor:bg,
      style:{margin:'0',overflow:'hidden'},cacheBust:true,imagePlaceholder:'data:image/gif;base64,R0lGODlhAQABAAAAACw='})
    .then(function(c){
      var out=c;
      ${o.type === "image/jpeg" ? "out=document.createElement('canvas');out.width=c.width;out.height=c.height;var x=out.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,out.width,out.height);x.drawImage(c,0,0);" : ""}
      send({ok:true,url:out.toDataURL(${JSON.stringify(o.type)},${o.quality}),w:out.width,h:out.height});
    })
    .catch(function(e){send({ok:false,error:String(e&&e.message||e)})});
}
function wait(){ if(window.htmlToImage){ setTimeout(go,900) } else setTimeout(wait,100) }
if(document.readyState==='complete')wait(); else addEventListener('load',wait);
setTimeout(function(){ if(!window.htmlToImage) send({ok:false,error:'Could not load the renderer (offline?)'}) },15000);
})();</script>`,
  );
