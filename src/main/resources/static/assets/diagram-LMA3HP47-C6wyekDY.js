import{$t as e,Ct as t,Et as n,Ot as r,Rt as i,Tt as a,Vt as o,en as s,k as c,mt as l,vt as u,wt as d,xt as f,zt as p}from"./index-lX0Lntsx.js";import{t as m}from"./mermaid-parser.core-QBHTzV-x.js";import{t as h}from"./chunk-4BX2VUAB-BI_uMoof.js";var g=t.packet,_=class{constructor(){this.packet=[],this.setAccTitle=p,this.getAccTitle=a,this.setDiagramTitle=o,this.getDiagramTitle=r,this.getAccDescription=d,this.setAccDescription=i}static{e(this,`PacketDB`)}getConfig(){let e=c({...g,...n().packet});return e.showBits&&(e.paddingY+=10),e}getPacket(){return this.packet}pushWord(e){e.length>0&&this.packet.push(e)}clear(){u(),this.packet=[]}},v=1e4,y=e((e,t)=>{h(e,t);let n=-1,r=[],i=1,{bitsPerRow:a}=t.getConfig();for(let{start:o,end:c,bits:l,label:u}of e.blocks){if(o!==void 0&&c!==void 0&&c<o)throw Error(`Packet block ${o} - ${c} is invalid. End must be greater than start.`);if(o??=n+1,o!==n+1)throw Error(`Packet block ${o} - ${c??o} is not contiguous. It should start from ${n+1}.`);if(l===0)throw Error(`Packet block ${o} is invalid. Cannot have a zero bit field.`);for(c??=o+(l??1)-1,l??=c-o+1,n=c,s.debug(`Packet block ${o} - ${n} with label ${u}`);r.length<=a+1&&t.getPacket().length<v;){let[e,n]=b({start:o,end:c,bits:l,label:u},i,a);if(r.push(e),e.end+1===i*a&&(t.pushWord(r),r=[],i++),!n)break;({start:o,end:c,bits:l,label:u}=n)}}t.pushWord(r)},`populate`),b=e((e,t,n)=>{if(e.start===void 0)throw Error(`start should have been set during first phase`);if(e.end===void 0)throw Error(`end should have been set during first phase`);if(e.start>e.end)throw Error(`Block start ${e.start} is greater than block end ${e.end}.`);if(e.end+1<=t*n)return[e,void 0];let r=t*n-1,i=t*n;return[{start:e.start,end:r,label:e.label,bits:r-e.start},{start:i,end:e.end,label:e.label,bits:e.end-i}]},`getNextFittingBlock`),x={parser:{yy:void 0},parse:e(async e=>{let t=await m(`packet`,e),n=x.parser?.yy;if(!(n instanceof _))throw Error(`parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.`);s.debug(t),y(t,n)},`parse`)},S=e((e,t,n,r)=>{let i=r.db,a=i.getConfig(),{rowHeight:o,paddingY:s,bitWidth:c,bitsPerRow:u}=a,d=i.getPacket(),p=i.getDiagramTitle(),m=o+s,h=m*(d.length+1)-(p?0:o),g=c*u+2,_=l(t);_.attr(`viewBox`,`0 0 ${g} ${h}`),f(_,h,g,a.useMaxWidth);for(let[e,t]of d.entries())C(_,t,e,a);_.append(`text`).text(p).attr(`x`,g/2).attr(`y`,h-m/2).attr(`dominant-baseline`,`middle`).attr(`text-anchor`,`middle`).attr(`class`,`packetTitle`)},`draw`),C=e((e,t,n,{rowHeight:r,paddingX:i,paddingY:a,bitWidth:o,bitsPerRow:s,showBits:c})=>{let l=e.append(`g`),u=n*(r+a)+a;for(let e of t){let t=e.start%s*o+1,n=(e.end-e.start+1)*o-i;if(l.append(`rect`).attr(`x`,t).attr(`y`,u).attr(`width`,n).attr(`height`,r).attr(`class`,`packetBlock`),l.append(`text`).attr(`x`,t+n/2).attr(`y`,u+r/2).attr(`class`,`packetLabel`).attr(`dominant-baseline`,`middle`).attr(`text-anchor`,`middle`).text(e.label),!c)continue;let a=e.end===e.start,d=u-2;l.append(`text`).attr(`x`,t+(a?n/2:0)).attr(`y`,d).attr(`class`,`packetByte start`).attr(`dominant-baseline`,`auto`).attr(`text-anchor`,a?`middle`:`start`).text(e.start),a||l.append(`text`).attr(`x`,t+n).attr(`y`,d).attr(`class`,`packetByte end`).attr(`dominant-baseline`,`auto`).attr(`text-anchor`,`end`).text(e.end)}},`drawWord`),w={draw:S},T={byteFontSize:`10px`,startByteColor:`black`,endByteColor:`black`,labelColor:`black`,labelFontSize:`12px`,titleColor:`black`,titleFontSize:`14px`,blockStrokeColor:`black`,blockStrokeWidth:`1`,blockFillColor:`#efefef`},E={parser:x,get db(){return new _},renderer:w,styles:e(({packet:e}={})=>{let t=c(T,e);return`
	.packetByte {
		font-size: ${t.byteFontSize};
	}
	.packetByte.start {
		fill: ${t.startByteColor};
	}
	.packetByte.end {
		fill: ${t.endByteColor};
	}
	.packetLabel {
		fill: ${t.labelColor};
		font-size: ${t.labelFontSize};
	}
	.packetTitle {
		fill: ${t.titleColor};
		font-size: ${t.titleFontSize};
	}
	.packetBlock {
		stroke: ${t.blockStrokeColor};
		stroke-width: ${t.blockStrokeWidth};
		fill: ${t.blockFillColor};
	}
	`},`styles`)};export{E as diagram};