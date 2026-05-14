import{t as e}from"./arc-Dx7aGE6o.js";import{$t as t,Ct as n,Dn as r,Dt as i,Kn as a,Mn as o,Ot as s,P as c,Rt as l,Tt as u,Vt as d,en as f,k as p,mt as m,qn as h,vt as g,wt as _,xt as v,zt as y}from"./index-lX0Lntsx.js";import{t as b}from"./mermaid-parser.core-QBHTzV-x.js";import{t as x}from"./chunk-4BX2VUAB-BI_uMoof.js";function S(e,t){return t<e?-1:t>e?1:t>=e?0:NaN}function C(e){return e}function w(){var e=C,t=S,n=null,r=h(0),i=h(a),s=h(0);function c(c){var l,u=(c=o(c)).length,d,f,p=0,m=Array(u),h=Array(u),g=+r.apply(this,arguments),_=Math.min(a,Math.max(-a,i.apply(this,arguments)-g)),v,y=Math.min(Math.abs(_)/u,s.apply(this,arguments)),b=y*(_<0?-1:1),x;for(l=0;l<u;++l)(x=h[m[l]=l]=+e(c[l],l,c))>0&&(p+=x);for(t==null?n!=null&&m.sort(function(e,t){return n(c[e],c[t])}):m.sort(function(e,n){return t(h[e],h[n])}),l=0,f=p?(_-u*b)/p:0;l<u;++l,g=v)d=m[l],x=h[d],v=g+(x>0?x*f:0)+b,h[d]={data:c[d],index:l,value:x,startAngle:g,endAngle:v,padAngle:y};return h}return c.value=function(t){return arguments.length?(e=typeof t==`function`?t:h(+t),c):e},c.sortValues=function(e){return arguments.length?(t=e,n=null,c):t},c.sort=function(e){return arguments.length?(n=e,t=null,c):n},c.startAngle=function(e){return arguments.length?(r=typeof e==`function`?e:h(+e),c):r},c.endAngle=function(e){return arguments.length?(i=typeof e==`function`?e:h(+e),c):i},c.padAngle=function(e){return arguments.length?(s=typeof e==`function`?e:h(+e),c):s},c}var T=n.pie,E={sections:new Map,showData:!1,config:T},D=E.sections,O=E.showData,k=structuredClone(T),A={getConfig:t(()=>structuredClone(k),`getConfig`),clear:t(()=>{D=new Map,O=E.showData,g()},`clear`),setDiagramTitle:d,getDiagramTitle:s,setAccTitle:y,getAccTitle:u,setAccDescription:l,getAccDescription:_,addSection:t(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);D.has(e)||(D.set(e,t),f.debug(`added new section: ${e}, with value: ${t}`))},`addSection`),getSections:t(()=>D,`getSections`),setShowData:t(e=>{O=e},`setShowData`),getShowData:t(()=>O,`getShowData`)},j=t((e,t)=>{x(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},`populateDb`),M={parse:t(async e=>{let t=await b(`pie`,e);f.debug(t),j(t,A)},`parse`)},N=t(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,`getStyles`),P=t(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),n=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1);return w().value(e=>e.value).sort(null)(n)},`createPieArcs`),F={parser:M,db:A,renderer:{draw:t((t,n,a,o)=>{f.debug(`rendering pie chart
`+t);let s=o.db,l=i(),u=p(s.getConfig(),l.pie),d=m(n),h=d.append(`g`);h.attr(`transform`,`translate(225,225)`);let{themeVariables:g}=l,[_]=c(g.pieOuterStrokeWidth);_??=2;let y=u.textPosition,b=e().innerRadius(0).outerRadius(185),x=e().innerRadius(185*y).outerRadius(185*y);h.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,185+_/2).attr(`class`,`pieOuterCircle`);let S=s.getSections(),C=P(S),w=[g.pie1,g.pie2,g.pie3,g.pie4,g.pie5,g.pie6,g.pie7,g.pie8,g.pie9,g.pie10,g.pie11,g.pie12],T=0;S.forEach(e=>{T+=e});let E=C.filter(e=>(e.data.value/T*100).toFixed(0)!==`0`),D=r(w).domain([...S.keys()]);h.selectAll(`mySlices`).data(E).enter().append(`path`).attr(`d`,b).attr(`fill`,e=>D(e.data.label)).attr(`class`,`pieCircle`),h.selectAll(`mySlices`).data(E).enter().append(`text`).text(e=>(e.data.value/T*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+x.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`);let O=h.append(`text`).text(s.getDiagramTitle()).attr(`x`,0).attr(`y`,-400/2).attr(`class`,`pieTitleText`),k=[...S.entries()].map(([e,t])=>({label:e,value:t})),A=h.selectAll(`.legend`).data(k).enter().append(`g`).attr(`class`,`legend`).attr(`transform`,(e,t)=>{let n=22*k.length/2;return`translate(216,`+(t*22-n)+`)`});A.append(`rect`).attr(`width`,18).attr(`height`,18).style(`fill`,e=>D(e.label)).style(`stroke`,e=>D(e.label)),A.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>s.getShowData()?`${e.label} [${e.value}]`:e.label);let j=512+Math.max(...A.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0)),M=O.node()?.getBoundingClientRect().width??0,N=450/2-M/2,F=450/2+M/2,I=Math.min(0,N),L=Math.max(j,F)-I;d.attr(`viewBox`,`${I} 0 ${L} 450`),v(d,450,L,u.useMaxWidth)},`draw`)},styles:N};export{F as diagram};