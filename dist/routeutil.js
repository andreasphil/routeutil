function f(n){return n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function l(n,...t){let e=[];for(let r=0;r<n.length;r++){e.push(f(n[r]));let s=t[r];typeof s=="string"?e.push(f(s)):s instanceof RegExp&&e.push(s.source)}if(!e[0].startsWith("#/"))throw new Error(`Routes must start with "#/"; route is ${e.join("")}`);return new RegExp(`^${e.join("")}$`)}function u(n){return new RegExp(`(?<${n}>\\w+)`)}var a=class{#t=new Map;#r=void 0;#s=void 0;#e=void 0;#n=new AbortController;constructor(t){this.#e=t?.startAt}connect(){return addEventListener("popstate",()=>{this.#i()},{signal:this.#n.signal}),this.#e&&!location.hash?location.hash=this.#e:this.#i(),this}disconnect(){this.#n.abort()}on(t,e){return(Array.isArray(t)?t:[t]).forEach(s=>this.#t.set(s,e)),this}off(t){return(Array.isArray(t)?t:[t]).forEach(r=>this.#t.delete(r)),this}fallback(t){return this.#r=t,this}afterEach(t){return this.#s=t,this}#i(t=location.hash){let e,r,s,o;for(let[i,c]of this.#t.entries())if(typeof i=="string"&&t===i?r=c:i instanceof RegExp&&(s=t.match(i))&&(o={...s.groups},r=c),r){e=i;break}let h={url:t,params:o??{},route:e};(r??this.#r)?.(h),this.#s?.(h)}};export{a as default,u as param,l as route};
//# sourceMappingURL=routeutil.js.map