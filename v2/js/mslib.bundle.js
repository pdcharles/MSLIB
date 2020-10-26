(function () {
  'use strict';

  /*
  (The MIT License)

  Copyright (C) 2014-2017 by Vitaly Puzrin and Andrei Tuputcyn

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  */

  let zlib = function _SOURCE() {
   let window = {};
   !function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else {("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).pako=t();}}(function(){return function r(s,o,l){function h(e,t){if(!o[e]){if(!s[e]){var a="function"==typeof require&&require;if(!t&&a)return a(e,!0);if(d)return d(e,!0);var i=new Error("Cannot find module '"+e+"'");throw i.code="MODULE_NOT_FOUND",i}var n=o[e]={exports:{}};s[e][0].call(n.exports,function(t){return h(s[e][1][t]||t)},n,n.exports,r,s,o,l);}return o[e].exports}for(var d="function"==typeof require&&require,t=0;t<l.length;t++)h(l[t]);return h}({1:[function(t,e,a){var s=t("./zlib/deflate"),o=t("./utils/common"),l=t("./utils/strings"),n=t("./zlib/messages"),r=t("./zlib/zstream"),h=Object.prototype.toString,d=0,f=-1,_=0,u=8;function c(t){if(!(this instanceof c))return new c(t);this.options=o.assign({level:f,method:u,chunkSize:16384,windowBits:15,memLevel:8,strategy:_,to:""},t||{});var e=this.options;e.raw&&0<e.windowBits?e.windowBits=-e.windowBits:e.gzip&&0<e.windowBits&&e.windowBits<16&&(e.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new r,this.strm.avail_out=0;var a=s.deflateInit2(this.strm,e.level,e.method,e.windowBits,e.memLevel,e.strategy);if(a!==d)throw new Error(n[a]);if(e.header&&s.deflateSetHeader(this.strm,e.header),e.dictionary){var i;if(i="string"==typeof e.dictionary?l.string2buf(e.dictionary):"[object ArrayBuffer]"===h.call(e.dictionary)?new Uint8Array(e.dictionary):e.dictionary,(a=s.deflateSetDictionary(this.strm,i))!==d)throw new Error(n[a]);this._dict_set=!0;}}function i(t,e){var a=new c(e);if(a.push(t,!0),a.err)throw a.msg||n[a.err];return a.result}c.prototype.push=function(t,e){var a,i,n=this.strm,r=this.options.chunkSize;if(this.ended)return !1;i=e===~~e?e:!0===e?4:0,"string"==typeof t?n.input=l.string2buf(t):"[object ArrayBuffer]"===h.call(t)?n.input=new Uint8Array(t):n.input=t,n.next_in=0,n.avail_in=n.input.length;do{if(0===n.avail_out&&(n.output=new o.Buf8(r),n.next_out=0,n.avail_out=r),1!==(a=s.deflate(n,i))&&a!==d)return this.onEnd(a),!(this.ended=!0);0!==n.avail_out&&(0!==n.avail_in||4!==i&&2!==i)||("string"===this.options.to?this.onData(l.buf2binstring(o.shrinkBuf(n.output,n.next_out))):this.onData(o.shrinkBuf(n.output,n.next_out)));}while((0<n.avail_in||0===n.avail_out)&&1!==a);return 4===i?(a=s.deflateEnd(this.strm),this.onEnd(a),this.ended=!0,a===d):2!==i||(this.onEnd(d),!(n.avail_out=0))},c.prototype.onData=function(t){this.chunks.push(t);},c.prototype.onEnd=function(t){t===d&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg;},a.Deflate=c,a.deflate=i,a.deflateRaw=function(t,e){return (e=e||{}).raw=!0,i(t,e)},a.gzip=function(t,e){return (e=e||{}).gzip=!0,i(t,e)};},{"./utils/common":3,"./utils/strings":4,"./zlib/deflate":8,"./zlib/messages":13,"./zlib/zstream":15}],2:[function(t,e,a){var f=t("./zlib/inflate"),_=t("./utils/common"),u=t("./utils/strings"),c=t("./zlib/constants"),i=t("./zlib/messages"),n=t("./zlib/zstream"),r=t("./zlib/gzheader"),b=Object.prototype.toString;function s(t){if(!(this instanceof s))return new s(t);this.options=_.assign({chunkSize:16384,windowBits:0,to:""},t||{});var e=this.options;e.raw&&0<=e.windowBits&&e.windowBits<16&&(e.windowBits=-e.windowBits,0===e.windowBits&&(e.windowBits=-15)),!(0<=e.windowBits&&e.windowBits<16)||t&&t.windowBits||(e.windowBits+=32),15<e.windowBits&&e.windowBits<48&&0==(15&e.windowBits)&&(e.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new n,this.strm.avail_out=0;var a=f.inflateInit2(this.strm,e.windowBits);if(a!==c.Z_OK)throw new Error(i[a]);if(this.header=new r,f.inflateGetHeader(this.strm,this.header),e.dictionary&&("string"==typeof e.dictionary?e.dictionary=u.string2buf(e.dictionary):"[object ArrayBuffer]"===b.call(e.dictionary)&&(e.dictionary=new Uint8Array(e.dictionary)),e.raw&&(a=f.inflateSetDictionary(this.strm,e.dictionary))!==c.Z_OK))throw new Error(i[a])}function o(t,e){var a=new s(e);if(a.push(t,!0),a.err)throw a.msg||i[a.err];return a.result}s.prototype.push=function(t,e){var a,i,n,r,s,o=this.strm,l=this.options.chunkSize,h=this.options.dictionary,d=!1;if(this.ended)return !1;i=e===~~e?e:!0===e?c.Z_FINISH:c.Z_NO_FLUSH,"string"==typeof t?o.input=u.binstring2buf(t):"[object ArrayBuffer]"===b.call(t)?o.input=new Uint8Array(t):o.input=t,o.next_in=0,o.avail_in=o.input.length;do{if(0===o.avail_out&&(o.output=new _.Buf8(l),o.next_out=0,o.avail_out=l),(a=f.inflate(o,c.Z_NO_FLUSH))===c.Z_NEED_DICT&&h&&(a=f.inflateSetDictionary(this.strm,h)),a===c.Z_BUF_ERROR&&!0===d&&(a=c.Z_OK,d=!1),a!==c.Z_STREAM_END&&a!==c.Z_OK)return this.onEnd(a),!(this.ended=!0);o.next_out&&(0!==o.avail_out&&a!==c.Z_STREAM_END&&(0!==o.avail_in||i!==c.Z_FINISH&&i!==c.Z_SYNC_FLUSH)||("string"===this.options.to?(n=u.utf8border(o.output,o.next_out),r=o.next_out-n,s=u.buf2string(o.output,n),o.next_out=r,o.avail_out=l-r,r&&_.arraySet(o.output,o.output,n,r,0),this.onData(s)):this.onData(_.shrinkBuf(o.output,o.next_out)))),0===o.avail_in&&0===o.avail_out&&(d=!0);}while((0<o.avail_in||0===o.avail_out)&&a!==c.Z_STREAM_END);return a===c.Z_STREAM_END&&(i=c.Z_FINISH),i===c.Z_FINISH?(a=f.inflateEnd(this.strm),this.onEnd(a),this.ended=!0,a===c.Z_OK):i!==c.Z_SYNC_FLUSH||(this.onEnd(c.Z_OK),!(o.avail_out=0))},s.prototype.onData=function(t){this.chunks.push(t);},s.prototype.onEnd=function(t){t===c.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=_.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg;},a.Inflate=s,a.inflate=o,a.inflateRaw=function(t,e){return (e=e||{}).raw=!0,o(t,e)},a.ungzip=o;},{"./utils/common":3,"./utils/strings":4,"./zlib/constants":6,"./zlib/gzheader":9,"./zlib/inflate":11,"./zlib/messages":13,"./zlib/zstream":15}],3:[function(t,e,a){var i="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;a.assign=function(t){for(var e,a,i=Array.prototype.slice.call(arguments,1);i.length;){var n=i.shift();if(n){if("object"!=typeof n)throw new TypeError(n+"must be non-object");for(var r in n)e=n,a=r,Object.prototype.hasOwnProperty.call(e,a)&&(t[r]=n[r]);}}return t},a.shrinkBuf=function(t,e){return t.length===e?t:t.subarray?t.subarray(0,e):(t.length=e,t)};var n={arraySet:function(t,e,a,i,n){if(e.subarray&&t.subarray)t.set(e.subarray(a,a+i),n);else for(var r=0;r<i;r++)t[n+r]=e[a+r];},flattenChunks:function(t){var e,a,i,n,r,s;for(e=i=0,a=t.length;e<a;e++)i+=t[e].length;for(s=new Uint8Array(i),e=n=0,a=t.length;e<a;e++)r=t[e],s.set(r,n),n+=r.length;return s}},r={arraySet:function(t,e,a,i,n){for(var r=0;r<i;r++)t[n+r]=e[a+r];},flattenChunks:function(t){return [].concat.apply([],t)}};a.setTyped=function(t){t?(a.Buf8=Uint8Array,a.Buf16=Uint16Array,a.Buf32=Int32Array,a.assign(a,n)):(a.Buf8=Array,a.Buf16=Array,a.Buf32=Array,a.assign(a,r));},a.setTyped(i);},{}],4:[function(t,e,a){var l=t("./common"),n=!0,r=!0;try{String.fromCharCode.apply(null,[0]);}catch(t){n=!1;}try{String.fromCharCode.apply(null,new Uint8Array(1));}catch(t){r=!1;}for(var h=new l.Buf8(256),i=0;i<256;i++)h[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;function d(t,e){if(e<65534&&(t.subarray&&r||!t.subarray&&n))return String.fromCharCode.apply(null,l.shrinkBuf(t,e));for(var a="",i=0;i<e;i++)a+=String.fromCharCode(t[i]);return a}h[254]=h[254]=1,a.string2buf=function(t){var e,a,i,n,r,s=t.length,o=0;for(n=0;n<s;n++)55296==(64512&(a=t.charCodeAt(n)))&&n+1<s&&56320==(64512&(i=t.charCodeAt(n+1)))&&(a=65536+(a-55296<<10)+(i-56320),n++),o+=a<128?1:a<2048?2:a<65536?3:4;for(e=new l.Buf8(o),n=r=0;r<o;n++)55296==(64512&(a=t.charCodeAt(n)))&&n+1<s&&56320==(64512&(i=t.charCodeAt(n+1)))&&(a=65536+(a-55296<<10)+(i-56320),n++),a<128?e[r++]=a:(a<2048?e[r++]=192|a>>>6:(a<65536?e[r++]=224|a>>>12:(e[r++]=240|a>>>18,e[r++]=128|a>>>12&63),e[r++]=128|a>>>6&63),e[r++]=128|63&a);return e},a.buf2binstring=function(t){return d(t,t.length)},a.binstring2buf=function(t){for(var e=new l.Buf8(t.length),a=0,i=e.length;a<i;a++)e[a]=t.charCodeAt(a);return e},a.buf2string=function(t,e){var a,i,n,r,s=e||t.length,o=new Array(2*s);for(a=i=0;a<s;)if((n=t[a++])<128)o[i++]=n;else if(4<(r=h[n]))o[i++]=65533,a+=r-1;else {for(n&=2===r?31:3===r?15:7;1<r&&a<s;)n=n<<6|63&t[a++],r--;1<r?o[i++]=65533:n<65536?o[i++]=n:(n-=65536,o[i++]=55296|n>>10&1023,o[i++]=56320|1023&n);}return d(o,i)},a.utf8border=function(t,e){var a;for((e=e||t.length)>t.length&&(e=t.length),a=e-1;0<=a&&128==(192&t[a]);)a--;return a<0?e:0===a?e:a+h[t[a]]>e?a:e};},{"./common":3}],5:[function(t,e,a){e.exports=function(t,e,a,i){for(var n=65535&t|0,r=t>>>16&65535|0,s=0;0!==a;){for(a-=s=2e3<a?2e3:a;r=r+(n=n+e[i++]|0)|0,--s;);n%=65521,r%=65521;}return n|r<<16|0};},{}],6:[function(t,e,a){e.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8};},{}],7:[function(t,e,a){var o=function(){for(var t,e=[],a=0;a<256;a++){t=a;for(var i=0;i<8;i++)t=1&t?3988292384^t>>>1:t>>>1;e[a]=t;}return e}();e.exports=function(t,e,a,i){var n=o,r=i+a;t^=-1;for(var s=i;s<r;s++)t=t>>>8^n[255&(t^e[s])];return -1^t};},{}],8:[function(t,e,a){var l,_=t("../utils/common"),h=t("./trees"),u=t("./adler32"),c=t("./crc32"),i=t("./messages"),d=0,f=4,b=0,g=-2,m=-1,w=4,n=2,p=8,v=9,r=286,s=30,o=19,k=2*r+1,y=15,x=3,z=258,B=z+x+1,S=42,E=113,A=1,Z=2,R=3,C=4;function N(t,e){return t.msg=i[e],e}function O(t){return (t<<1)-(4<t?9:0)}function D(t){for(var e=t.length;0<=--e;)t[e]=0;}function I(t){var e=t.state,a=e.pending;a>t.avail_out&&(a=t.avail_out),0!==a&&(_.arraySet(t.output,e.pending_buf,e.pending_out,a,t.next_out),t.next_out+=a,e.pending_out+=a,t.total_out+=a,t.avail_out-=a,e.pending-=a,0===e.pending&&(e.pending_out=0));}function U(t,e){h._tr_flush_block(t,0<=t.block_start?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,I(t.strm);}function T(t,e){t.pending_buf[t.pending++]=e;}function F(t,e){t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e;}function L(t,e){var a,i,n=t.max_chain_length,r=t.strstart,s=t.prev_length,o=t.nice_match,l=t.strstart>t.w_size-B?t.strstart-(t.w_size-B):0,h=t.window,d=t.w_mask,f=t.prev,_=t.strstart+z,u=h[r+s-1],c=h[r+s];t.prev_length>=t.good_match&&(n>>=2),o>t.lookahead&&(o=t.lookahead);do{if(h[(a=e)+s]===c&&h[a+s-1]===u&&h[a]===h[r]&&h[++a]===h[r+1]){r+=2,a++;do{}while(h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&h[++r]===h[++a]&&r<_);if(i=z-(_-r),r=_-z,s<i){if(t.match_start=e,o<=(s=i))break;u=h[r+s-1],c=h[r+s];}}}while((e=f[e&d])>l&&0!=--n);return s<=t.lookahead?s:t.lookahead}function H(t){var e,a,i,n,r,s,o,l,h,d,f=t.w_size;do{if(n=t.window_size-t.lookahead-t.strstart,t.strstart>=f+(f-B)){for(_.arraySet(t.window,t.window,f,f,0),t.match_start-=f,t.strstart-=f,t.block_start-=f,e=a=t.hash_size;i=t.head[--e],t.head[e]=f<=i?i-f:0,--a;);for(e=a=f;i=t.prev[--e],t.prev[e]=f<=i?i-f:0,--a;);n+=f;}if(0===t.strm.avail_in)break;if(s=t.strm,o=t.window,l=t.strstart+t.lookahead,h=n,d=void 0,d=s.avail_in,h<d&&(d=h),a=0===d?0:(s.avail_in-=d,_.arraySet(o,s.input,s.next_in,d,l),1===s.state.wrap?s.adler=u(s.adler,o,d,l):2===s.state.wrap&&(s.adler=c(s.adler,o,d,l)),s.next_in+=d,s.total_in+=d,d),t.lookahead+=a,t.lookahead+t.insert>=x)for(r=t.strstart-t.insert,t.ins_h=t.window[r],t.ins_h=(t.ins_h<<t.hash_shift^t.window[r+1])&t.hash_mask;t.insert&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[r+x-1])&t.hash_mask,t.prev[r&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=r,r++,t.insert--,!(t.lookahead+t.insert<x)););}while(t.lookahead<B&&0!==t.strm.avail_in)}function j(t,e){for(var a,i;;){if(t.lookahead<B){if(H(t),t.lookahead<B&&e===d)return A;if(0===t.lookahead)break}if(a=0,t.lookahead>=x&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==a&&t.strstart-a<=t.w_size-B&&(t.match_length=L(t,a)),t.match_length>=x)if(i=h._tr_tally(t,t.strstart-t.match_start,t.match_length-x),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=x){for(t.match_length--;t.strstart++,t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart,0!=--t.match_length;);t.strstart++;}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+1])&t.hash_mask;else i=h._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(i&&(U(t,!1),0===t.strm.avail_out))return A}return t.insert=t.strstart<x-1?t.strstart:x-1,e===f?(U(t,!0),0===t.strm.avail_out?R:C):t.last_lit&&(U(t,!1),0===t.strm.avail_out)?A:Z}function K(t,e){for(var a,i,n;;){if(t.lookahead<B){if(H(t),t.lookahead<B&&e===d)return A;if(0===t.lookahead)break}if(a=0,t.lookahead>=x&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=x-1,0!==a&&t.prev_length<t.max_lazy_match&&t.strstart-a<=t.w_size-B&&(t.match_length=L(t,a),t.match_length<=5&&(1===t.strategy||t.match_length===x&&4096<t.strstart-t.match_start)&&(t.match_length=x-1)),t.prev_length>=x&&t.match_length<=t.prev_length){for(n=t.strstart+t.lookahead-x,i=h._tr_tally(t,t.strstart-1-t.prev_match,t.prev_length-x),t.lookahead-=t.prev_length-1,t.prev_length-=2;++t.strstart<=n&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!=--t.prev_length;);if(t.match_available=0,t.match_length=x-1,t.strstart++,i&&(U(t,!1),0===t.strm.avail_out))return A}else if(t.match_available){if((i=h._tr_tally(t,0,t.window[t.strstart-1]))&&U(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return A}else t.match_available=1,t.strstart++,t.lookahead--;}return t.match_available&&(i=h._tr_tally(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<x-1?t.strstart:x-1,e===f?(U(t,!0),0===t.strm.avail_out?R:C):t.last_lit&&(U(t,!1),0===t.strm.avail_out)?A:Z}function M(t,e,a,i,n){this.good_length=t,this.max_lazy=e,this.nice_length=a,this.max_chain=i,this.func=n;}function P(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=p,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new _.Buf16(2*k),this.dyn_dtree=new _.Buf16(2*(2*s+1)),this.bl_tree=new _.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new _.Buf16(y+1),this.heap=new _.Buf16(2*r+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new _.Buf16(2*r+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0;}function Y(t){var e;return t&&t.state?(t.total_in=t.total_out=0,t.data_type=n,(e=t.state).pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=e.wrap?S:E,t.adler=2===e.wrap?0:1,e.last_flush=d,h._tr_init(e),b):N(t,g)}function q(t){var e,a=Y(t);return a===b&&((e=t.state).window_size=2*e.w_size,D(e.head),e.max_lazy_match=l[e.level].max_lazy,e.good_match=l[e.level].good_length,e.nice_match=l[e.level].nice_length,e.max_chain_length=l[e.level].max_chain,e.strstart=0,e.block_start=0,e.lookahead=0,e.insert=0,e.match_length=e.prev_length=x-1,e.match_available=0,e.ins_h=0),a}function G(t,e,a,i,n,r){if(!t)return g;var s=1;if(e===m&&(e=6),i<0?(s=0,i=-i):15<i&&(s=2,i-=16),n<1||v<n||a!==p||i<8||15<i||e<0||9<e||r<0||w<r)return N(t,g);8===i&&(i=9);var o=new P;return (t.state=o).strm=t,o.wrap=s,o.gzhead=null,o.w_bits=i,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=n+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new _.Buf8(2*o.w_size),o.head=new _.Buf16(o.hash_size),o.prev=new _.Buf16(o.w_size),o.lit_bufsize=1<<n+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new _.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=e,o.strategy=r,o.method=a,q(t)}l=[new M(0,0,0,0,function(t,e){var a=65535;for(a>t.pending_buf_size-5&&(a=t.pending_buf_size-5);;){if(t.lookahead<=1){if(H(t),0===t.lookahead&&e===d)return A;if(0===t.lookahead)break}t.strstart+=t.lookahead,t.lookahead=0;var i=t.block_start+a;if((0===t.strstart||t.strstart>=i)&&(t.lookahead=t.strstart-i,t.strstart=i,U(t,!1),0===t.strm.avail_out))return A;if(t.strstart-t.block_start>=t.w_size-B&&(U(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(U(t,!0),0===t.strm.avail_out?R:C):(t.strstart>t.block_start&&(U(t,!1),t.strm.avail_out),A)}),new M(4,4,8,4,j),new M(4,5,16,8,j),new M(4,6,32,32,j),new M(4,4,16,16,K),new M(8,16,32,32,K),new M(8,16,128,128,K),new M(8,32,128,256,K),new M(32,128,258,1024,K),new M(32,258,258,4096,K)],a.deflateInit=function(t,e){return G(t,e,p,15,8,0)},a.deflateInit2=G,a.deflateReset=q,a.deflateResetKeep=Y,a.deflateSetHeader=function(t,e){return t&&t.state?2!==t.state.wrap?g:(t.state.gzhead=e,b):g},a.deflate=function(t,e){var a,i,n,r;if(!t||!t.state||5<e||e<0)return t?N(t,g):g;if(i=t.state,!t.output||!t.input&&0!==t.avail_in||666===i.status&&e!==f)return N(t,0===t.avail_out?-5:g);if(i.strm=t,a=i.last_flush,i.last_flush=e,i.status===S)if(2===i.wrap)t.adler=0,T(i,31),T(i,139),T(i,8),i.gzhead?(T(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),T(i,255&i.gzhead.time),T(i,i.gzhead.time>>8&255),T(i,i.gzhead.time>>16&255),T(i,i.gzhead.time>>24&255),T(i,9===i.level?2:2<=i.strategy||i.level<2?4:0),T(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(T(i,255&i.gzhead.extra.length),T(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(t.adler=c(t.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=69):(T(i,0),T(i,0),T(i,0),T(i,0),T(i,0),T(i,9===i.level?2:2<=i.strategy||i.level<2?4:0),T(i,3),i.status=E);else {var s=p+(i.w_bits-8<<4)<<8;s|=(2<=i.strategy||i.level<2?0:i.level<6?1:6===i.level?2:3)<<6,0!==i.strstart&&(s|=32),s+=31-s%31,i.status=E,F(i,s),0!==i.strstart&&(F(i,t.adler>>>16),F(i,65535&t.adler)),t.adler=1;}if(69===i.status)if(i.gzhead.extra){for(n=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),I(t),n=i.pending,i.pending!==i.pending_buf_size));)T(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=73);}else i.status=73;if(73===i.status)if(i.gzhead.name){n=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),I(t),n=i.pending,i.pending===i.pending_buf_size)){r=1;break}T(i,r=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0);}while(0!==r);i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),0===r&&(i.gzindex=0,i.status=91);}else i.status=91;if(91===i.status)if(i.gzhead.comment){n=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),I(t),n=i.pending,i.pending===i.pending_buf_size)){r=1;break}T(i,r=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0);}while(0!==r);i.gzhead.hcrc&&i.pending>n&&(t.adler=c(t.adler,i.pending_buf,i.pending-n,n)),0===r&&(i.status=103);}else i.status=103;if(103===i.status&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&I(t),i.pending+2<=i.pending_buf_size&&(T(i,255&t.adler),T(i,t.adler>>8&255),t.adler=0,i.status=E)):i.status=E),0!==i.pending){if(I(t),0===t.avail_out)return i.last_flush=-1,b}else if(0===t.avail_in&&O(e)<=O(a)&&e!==f)return N(t,-5);if(666===i.status&&0!==t.avail_in)return N(t,-5);if(0!==t.avail_in||0!==i.lookahead||e!==d&&666!==i.status){var o=2===i.strategy?function(t,e){for(var a;;){if(0===t.lookahead&&(H(t),0===t.lookahead)){if(e===d)return A;break}if(t.match_length=0,a=h._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,a&&(U(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(U(t,!0),0===t.strm.avail_out?R:C):t.last_lit&&(U(t,!1),0===t.strm.avail_out)?A:Z}(i,e):3===i.strategy?function(t,e){for(var a,i,n,r,s=t.window;;){if(t.lookahead<=z){if(H(t),t.lookahead<=z&&e===d)return A;if(0===t.lookahead)break}if(t.match_length=0,t.lookahead>=x&&0<t.strstart&&(i=s[n=t.strstart-1])===s[++n]&&i===s[++n]&&i===s[++n]){r=t.strstart+z;do{}while(i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&i===s[++n]&&n<r);t.match_length=z-(r-n),t.match_length>t.lookahead&&(t.match_length=t.lookahead);}if(t.match_length>=x?(a=h._tr_tally(t,1,t.match_length-x),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(a=h._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),a&&(U(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(U(t,!0),0===t.strm.avail_out?R:C):t.last_lit&&(U(t,!1),0===t.strm.avail_out)?A:Z}(i,e):l[i.level].func(i,e);if(o!==R&&o!==C||(i.status=666),o===A||o===R)return 0===t.avail_out&&(i.last_flush=-1),b;if(o===Z&&(1===e?h._tr_align(i):5!==e&&(h._tr_stored_block(i,0,0,!1),3===e&&(D(i.head),0===i.lookahead&&(i.strstart=0,i.block_start=0,i.insert=0))),I(t),0===t.avail_out))return i.last_flush=-1,b}return e!==f?b:i.wrap<=0?1:(2===i.wrap?(T(i,255&t.adler),T(i,t.adler>>8&255),T(i,t.adler>>16&255),T(i,t.adler>>24&255),T(i,255&t.total_in),T(i,t.total_in>>8&255),T(i,t.total_in>>16&255),T(i,t.total_in>>24&255)):(F(i,t.adler>>>16),F(i,65535&t.adler)),I(t),0<i.wrap&&(i.wrap=-i.wrap),0!==i.pending?b:1)},a.deflateEnd=function(t){var e;return t&&t.state?(e=t.state.status)!==S&&69!==e&&73!==e&&91!==e&&103!==e&&e!==E&&666!==e?N(t,g):(t.state=null,e===E?N(t,-3):b):g},a.deflateSetDictionary=function(t,e){var a,i,n,r,s,o,l,h,d=e.length;if(!t||!t.state)return g;if(2===(r=(a=t.state).wrap)||1===r&&a.status!==S||a.lookahead)return g;for(1===r&&(t.adler=u(t.adler,e,d,0)),a.wrap=0,d>=a.w_size&&(0===r&&(D(a.head),a.strstart=0,a.block_start=0,a.insert=0),h=new _.Buf8(a.w_size),_.arraySet(h,e,d-a.w_size,a.w_size,0),e=h,d=a.w_size),s=t.avail_in,o=t.next_in,l=t.input,t.avail_in=d,t.next_in=0,t.input=e,H(a);a.lookahead>=x;){for(i=a.strstart,n=a.lookahead-(x-1);a.ins_h=(a.ins_h<<a.hash_shift^a.window[i+x-1])&a.hash_mask,a.prev[i&a.w_mask]=a.head[a.ins_h],a.head[a.ins_h]=i,i++,--n;);a.strstart=i,a.lookahead=x-1,H(a);}return a.strstart+=a.lookahead,a.block_start=a.strstart,a.insert=a.lookahead,a.lookahead=0,a.match_length=a.prev_length=x-1,a.match_available=0,t.next_in=o,t.input=l,t.avail_in=s,a.wrap=r,b},a.deflateInfo="pako deflate (from Nodeca project)";},{"../utils/common":3,"./adler32":5,"./crc32":7,"./messages":13,"./trees":14}],9:[function(t,e,a){e.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1;};},{}],10:[function(t,e,a){e.exports=function(t,e){var a,i,n,r,s,o,l,h,d,f,_,u,c,b,g,m,w,p,v,k,y,x,z,B,S;a=t.state,i=t.next_in,B=t.input,n=i+(t.avail_in-5),r=t.next_out,S=t.output,s=r-(e-t.avail_out),o=r+(t.avail_out-257),l=a.dmax,h=a.wsize,d=a.whave,f=a.wnext,_=a.window,u=a.hold,c=a.bits,b=a.lencode,g=a.distcode,m=(1<<a.lenbits)-1,w=(1<<a.distbits)-1;t:do{c<15&&(u+=B[i++]<<c,c+=8,u+=B[i++]<<c,c+=8),p=b[u&m];e:for(;;){if(u>>>=v=p>>>24,c-=v,0===(v=p>>>16&255))S[r++]=65535&p;else {if(!(16&v)){if(0==(64&v)){p=b[(65535&p)+(u&(1<<v)-1)];continue e}if(32&v){a.mode=12;break t}t.msg="invalid literal/length code",a.mode=30;break t}k=65535&p,(v&=15)&&(c<v&&(u+=B[i++]<<c,c+=8),k+=u&(1<<v)-1,u>>>=v,c-=v),c<15&&(u+=B[i++]<<c,c+=8,u+=B[i++]<<c,c+=8),p=g[u&w];a:for(;;){if(u>>>=v=p>>>24,c-=v,!(16&(v=p>>>16&255))){if(0==(64&v)){p=g[(65535&p)+(u&(1<<v)-1)];continue a}t.msg="invalid distance code",a.mode=30;break t}if(y=65535&p,c<(v&=15)&&(u+=B[i++]<<c,(c+=8)<v&&(u+=B[i++]<<c,c+=8)),l<(y+=u&(1<<v)-1)){t.msg="invalid distance too far back",a.mode=30;break t}if(u>>>=v,c-=v,(v=r-s)<y){if(d<(v=y-v)&&a.sane){t.msg="invalid distance too far back",a.mode=30;break t}if(z=_,(x=0)===f){if(x+=h-v,v<k){for(k-=v;S[r++]=_[x++],--v;);x=r-y,z=S;}}else if(f<v){if(x+=h+f-v,(v-=f)<k){for(k-=v;S[r++]=_[x++],--v;);if(x=0,f<k){for(k-=v=f;S[r++]=_[x++],--v;);x=r-y,z=S;}}}else if(x+=f-v,v<k){for(k-=v;S[r++]=_[x++],--v;);x=r-y,z=S;}for(;2<k;)S[r++]=z[x++],S[r++]=z[x++],S[r++]=z[x++],k-=3;k&&(S[r++]=z[x++],1<k&&(S[r++]=z[x++]));}else {for(x=r-y;S[r++]=S[x++],S[r++]=S[x++],S[r++]=S[x++],2<(k-=3););k&&(S[r++]=S[x++],1<k&&(S[r++]=S[x++]));}break}}break}}while(i<n&&r<o);i-=k=c>>3,u&=(1<<(c-=k<<3))-1,t.next_in=i,t.next_out=r,t.avail_in=i<n?n-i+5:5-(i-n),t.avail_out=r<o?o-r+257:257-(r-o),a.hold=u,a.bits=c;};},{}],11:[function(t,e,a){var Z=t("../utils/common"),R=t("./adler32"),C=t("./crc32"),N=t("./inffast"),O=t("./inftrees"),D=1,I=2,U=0,T=-2,F=1,i=852,n=592;function L(t){return (t>>>24&255)+(t>>>8&65280)+((65280&t)<<8)+((255&t)<<24)}function r(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new Z.Buf16(320),this.work=new Z.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0;}function s(t){var e;return t&&t.state?(e=t.state,t.total_in=t.total_out=e.total=0,t.msg="",e.wrap&&(t.adler=1&e.wrap),e.mode=F,e.last=0,e.havedict=0,e.dmax=32768,e.head=null,e.hold=0,e.bits=0,e.lencode=e.lendyn=new Z.Buf32(i),e.distcode=e.distdyn=new Z.Buf32(n),e.sane=1,e.back=-1,U):T}function o(t){var e;return t&&t.state?((e=t.state).wsize=0,e.whave=0,e.wnext=0,s(t)):T}function l(t,e){var a,i;return t&&t.state?(i=t.state,e<0?(a=0,e=-e):(a=1+(e>>4),e<48&&(e&=15)),e&&(e<8||15<e)?T:(null!==i.window&&i.wbits!==e&&(i.window=null),i.wrap=a,i.wbits=e,o(t))):T}function h(t,e){var a,i;return t?(i=new r,(t.state=i).window=null,(a=l(t,e))!==U&&(t.state=null),a):T}var d,f,_=!0;function H(t){if(_){var e;for(d=new Z.Buf32(512),f=new Z.Buf32(32),e=0;e<144;)t.lens[e++]=8;for(;e<256;)t.lens[e++]=9;for(;e<280;)t.lens[e++]=7;for(;e<288;)t.lens[e++]=8;for(O(D,t.lens,0,288,d,0,t.work,{bits:9}),e=0;e<32;)t.lens[e++]=5;O(I,t.lens,0,32,f,0,t.work,{bits:5}),_=!1;}t.lencode=d,t.lenbits=9,t.distcode=f,t.distbits=5;}function j(t,e,a,i){var n,r=t.state;return null===r.window&&(r.wsize=1<<r.wbits,r.wnext=0,r.whave=0,r.window=new Z.Buf8(r.wsize)),i>=r.wsize?(Z.arraySet(r.window,e,a-r.wsize,r.wsize,0),r.wnext=0,r.whave=r.wsize):(i<(n=r.wsize-r.wnext)&&(n=i),Z.arraySet(r.window,e,a-i,n,r.wnext),(i-=n)?(Z.arraySet(r.window,e,a-i,i,0),r.wnext=i,r.whave=r.wsize):(r.wnext+=n,r.wnext===r.wsize&&(r.wnext=0),r.whave<r.wsize&&(r.whave+=n))),0}a.inflateReset=o,a.inflateReset2=l,a.inflateResetKeep=s,a.inflateInit=function(t){return h(t,15)},a.inflateInit2=h,a.inflate=function(t,e){var a,i,n,r,s,o,l,h,d,f,_,u,c,b,g,m,w,p,v,k,y,x,z,B,S=0,E=new Z.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!t||!t.state||!t.output||!t.input&&0!==t.avail_in)return T;12===(a=t.state).mode&&(a.mode=13),s=t.next_out,n=t.output,l=t.avail_out,r=t.next_in,i=t.input,o=t.avail_in,h=a.hold,d=a.bits,f=o,_=l,x=U;t:for(;;)switch(a.mode){case F:if(0===a.wrap){a.mode=13;break}for(;d<16;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}if(2&a.wrap&&35615===h){E[a.check=0]=255&h,E[1]=h>>>8&255,a.check=C(a.check,E,2,0),d=h=0,a.mode=2;break}if(a.flags=0,a.head&&(a.head.done=!1),!(1&a.wrap)||(((255&h)<<8)+(h>>8))%31){t.msg="incorrect header check",a.mode=30;break}if(8!=(15&h)){t.msg="unknown compression method",a.mode=30;break}if(d-=4,y=8+(15&(h>>>=4)),0===a.wbits)a.wbits=y;else if(y>a.wbits){t.msg="invalid window size",a.mode=30;break}a.dmax=1<<y,t.adler=a.check=1,a.mode=512&h?10:12,d=h=0;break;case 2:for(;d<16;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}if(a.flags=h,8!=(255&a.flags)){t.msg="unknown compression method",a.mode=30;break}if(57344&a.flags){t.msg="unknown header flags set",a.mode=30;break}a.head&&(a.head.text=h>>8&1),512&a.flags&&(E[0]=255&h,E[1]=h>>>8&255,a.check=C(a.check,E,2,0)),d=h=0,a.mode=3;case 3:for(;d<32;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}a.head&&(a.head.time=h),512&a.flags&&(E[0]=255&h,E[1]=h>>>8&255,E[2]=h>>>16&255,E[3]=h>>>24&255,a.check=C(a.check,E,4,0)),d=h=0,a.mode=4;case 4:for(;d<16;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}a.head&&(a.head.xflags=255&h,a.head.os=h>>8),512&a.flags&&(E[0]=255&h,E[1]=h>>>8&255,a.check=C(a.check,E,2,0)),d=h=0,a.mode=5;case 5:if(1024&a.flags){for(;d<16;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}a.length=h,a.head&&(a.head.extra_len=h),512&a.flags&&(E[0]=255&h,E[1]=h>>>8&255,a.check=C(a.check,E,2,0)),d=h=0;}else a.head&&(a.head.extra=null);a.mode=6;case 6:if(1024&a.flags&&(o<(u=a.length)&&(u=o),u&&(a.head&&(y=a.head.extra_len-a.length,a.head.extra||(a.head.extra=new Array(a.head.extra_len)),Z.arraySet(a.head.extra,i,r,u,y)),512&a.flags&&(a.check=C(a.check,i,u,r)),o-=u,r+=u,a.length-=u),a.length))break t;a.length=0,a.mode=7;case 7:if(2048&a.flags){if(0===o)break t;for(u=0;y=i[r+u++],a.head&&y&&a.length<65536&&(a.head.name+=String.fromCharCode(y)),y&&u<o;);if(512&a.flags&&(a.check=C(a.check,i,u,r)),o-=u,r+=u,y)break t}else a.head&&(a.head.name=null);a.length=0,a.mode=8;case 8:if(4096&a.flags){if(0===o)break t;for(u=0;y=i[r+u++],a.head&&y&&a.length<65536&&(a.head.comment+=String.fromCharCode(y)),y&&u<o;);if(512&a.flags&&(a.check=C(a.check,i,u,r)),o-=u,r+=u,y)break t}else a.head&&(a.head.comment=null);a.mode=9;case 9:if(512&a.flags){for(;d<16;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}if(h!==(65535&a.check)){t.msg="header crc mismatch",a.mode=30;break}d=h=0;}a.head&&(a.head.hcrc=a.flags>>9&1,a.head.done=!0),t.adler=a.check=0,a.mode=12;break;case 10:for(;d<32;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}t.adler=a.check=L(h),d=h=0,a.mode=11;case 11:if(0===a.havedict)return t.next_out=s,t.avail_out=l,t.next_in=r,t.avail_in=o,a.hold=h,a.bits=d,2;t.adler=a.check=1,a.mode=12;case 12:if(5===e||6===e)break t;case 13:if(a.last){h>>>=7&d,d-=7&d,a.mode=27;break}for(;d<3;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}switch(a.last=1&h,d-=1,3&(h>>>=1)){case 0:a.mode=14;break;case 1:if(H(a),a.mode=20,6!==e)break;h>>>=2,d-=2;break t;case 2:a.mode=17;break;case 3:t.msg="invalid block type",a.mode=30;}h>>>=2,d-=2;break;case 14:for(h>>>=7&d,d-=7&d;d<32;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}if((65535&h)!=(h>>>16^65535)){t.msg="invalid stored block lengths",a.mode=30;break}if(a.length=65535&h,d=h=0,a.mode=15,6===e)break t;case 15:a.mode=16;case 16:if(u=a.length){if(o<u&&(u=o),l<u&&(u=l),0===u)break t;Z.arraySet(n,i,r,u,s),o-=u,r+=u,l-=u,s+=u,a.length-=u;break}a.mode=12;break;case 17:for(;d<14;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}if(a.nlen=257+(31&h),h>>>=5,d-=5,a.ndist=1+(31&h),h>>>=5,d-=5,a.ncode=4+(15&h),h>>>=4,d-=4,286<a.nlen||30<a.ndist){t.msg="too many length or distance symbols",a.mode=30;break}a.have=0,a.mode=18;case 18:for(;a.have<a.ncode;){for(;d<3;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}a.lens[A[a.have++]]=7&h,h>>>=3,d-=3;}for(;a.have<19;)a.lens[A[a.have++]]=0;if(a.lencode=a.lendyn,a.lenbits=7,z={bits:a.lenbits},x=O(0,a.lens,0,19,a.lencode,0,a.work,z),a.lenbits=z.bits,x){t.msg="invalid code lengths set",a.mode=30;break}a.have=0,a.mode=19;case 19:for(;a.have<a.nlen+a.ndist;){for(;m=(S=a.lencode[h&(1<<a.lenbits)-1])>>>16&255,w=65535&S,!((g=S>>>24)<=d);){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}if(w<16)h>>>=g,d-=g,a.lens[a.have++]=w;else {if(16===w){for(B=g+2;d<B;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}if(h>>>=g,d-=g,0===a.have){t.msg="invalid bit length repeat",a.mode=30;break}y=a.lens[a.have-1],u=3+(3&h),h>>>=2,d-=2;}else if(17===w){for(B=g+3;d<B;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}d-=g,y=0,u=3+(7&(h>>>=g)),h>>>=3,d-=3;}else {for(B=g+7;d<B;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}d-=g,y=0,u=11+(127&(h>>>=g)),h>>>=7,d-=7;}if(a.have+u>a.nlen+a.ndist){t.msg="invalid bit length repeat",a.mode=30;break}for(;u--;)a.lens[a.have++]=y;}}if(30===a.mode)break;if(0===a.lens[256]){t.msg="invalid code -- missing end-of-block",a.mode=30;break}if(a.lenbits=9,z={bits:a.lenbits},x=O(D,a.lens,0,a.nlen,a.lencode,0,a.work,z),a.lenbits=z.bits,x){t.msg="invalid literal/lengths set",a.mode=30;break}if(a.distbits=6,a.distcode=a.distdyn,z={bits:a.distbits},x=O(I,a.lens,a.nlen,a.ndist,a.distcode,0,a.work,z),a.distbits=z.bits,x){t.msg="invalid distances set",a.mode=30;break}if(a.mode=20,6===e)break t;case 20:a.mode=21;case 21:if(6<=o&&258<=l){t.next_out=s,t.avail_out=l,t.next_in=r,t.avail_in=o,a.hold=h,a.bits=d,N(t,_),s=t.next_out,n=t.output,l=t.avail_out,r=t.next_in,i=t.input,o=t.avail_in,h=a.hold,d=a.bits,12===a.mode&&(a.back=-1);break}for(a.back=0;m=(S=a.lencode[h&(1<<a.lenbits)-1])>>>16&255,w=65535&S,!((g=S>>>24)<=d);){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}if(m&&0==(240&m)){for(p=g,v=m,k=w;m=(S=a.lencode[k+((h&(1<<p+v)-1)>>p)])>>>16&255,w=65535&S,!(p+(g=S>>>24)<=d);){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}h>>>=p,d-=p,a.back+=p;}if(h>>>=g,d-=g,a.back+=g,a.length=w,0===m){a.mode=26;break}if(32&m){a.back=-1,a.mode=12;break}if(64&m){t.msg="invalid literal/length code",a.mode=30;break}a.extra=15&m,a.mode=22;case 22:if(a.extra){for(B=a.extra;d<B;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}a.length+=h&(1<<a.extra)-1,h>>>=a.extra,d-=a.extra,a.back+=a.extra;}a.was=a.length,a.mode=23;case 23:for(;m=(S=a.distcode[h&(1<<a.distbits)-1])>>>16&255,w=65535&S,!((g=S>>>24)<=d);){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}if(0==(240&m)){for(p=g,v=m,k=w;m=(S=a.distcode[k+((h&(1<<p+v)-1)>>p)])>>>16&255,w=65535&S,!(p+(g=S>>>24)<=d);){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}h>>>=p,d-=p,a.back+=p;}if(h>>>=g,d-=g,a.back+=g,64&m){t.msg="invalid distance code",a.mode=30;break}a.offset=w,a.extra=15&m,a.mode=24;case 24:if(a.extra){for(B=a.extra;d<B;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}a.offset+=h&(1<<a.extra)-1,h>>>=a.extra,d-=a.extra,a.back+=a.extra;}if(a.offset>a.dmax){t.msg="invalid distance too far back",a.mode=30;break}a.mode=25;case 25:if(0===l)break t;if(u=_-l,a.offset>u){if((u=a.offset-u)>a.whave&&a.sane){t.msg="invalid distance too far back",a.mode=30;break}u>a.wnext?(u-=a.wnext,c=a.wsize-u):c=a.wnext-u,u>a.length&&(u=a.length),b=a.window;}else b=n,c=s-a.offset,u=a.length;for(l<u&&(u=l),l-=u,a.length-=u;n[s++]=b[c++],--u;);0===a.length&&(a.mode=21);break;case 26:if(0===l)break t;n[s++]=a.length,l--,a.mode=21;break;case 27:if(a.wrap){for(;d<32;){if(0===o)break t;o--,h|=i[r++]<<d,d+=8;}if(_-=l,t.total_out+=_,a.total+=_,_&&(t.adler=a.check=a.flags?C(a.check,n,_,s-_):R(a.check,n,_,s-_)),_=l,(a.flags?h:L(h))!==a.check){t.msg="incorrect data check",a.mode=30;break}d=h=0;}a.mode=28;case 28:if(a.wrap&&a.flags){for(;d<32;){if(0===o)break t;o--,h+=i[r++]<<d,d+=8;}if(h!==(4294967295&a.total)){t.msg="incorrect length check",a.mode=30;break}d=h=0;}a.mode=29;case 29:x=1;break t;case 30:x=-3;break t;case 31:return -4;case 32:default:return T}return t.next_out=s,t.avail_out=l,t.next_in=r,t.avail_in=o,a.hold=h,a.bits=d,(a.wsize||_!==t.avail_out&&a.mode<30&&(a.mode<27||4!==e))&&j(t,t.output,t.next_out,_-t.avail_out)?(a.mode=31,-4):(f-=t.avail_in,_-=t.avail_out,t.total_in+=f,t.total_out+=_,a.total+=_,a.wrap&&_&&(t.adler=a.check=a.flags?C(a.check,n,_,t.next_out-_):R(a.check,n,_,t.next_out-_)),t.data_type=a.bits+(a.last?64:0)+(12===a.mode?128:0)+(20===a.mode||15===a.mode?256:0),(0===f&&0===_||4===e)&&x===U&&(x=-5),x)},a.inflateEnd=function(t){if(!t||!t.state)return T;var e=t.state;return e.window&&(e.window=null),t.state=null,U},a.inflateGetHeader=function(t,e){var a;return t&&t.state?0==(2&(a=t.state).wrap)?T:((a.head=e).done=!1,U):T},a.inflateSetDictionary=function(t,e){var a,i=e.length;return t&&t.state?0!==(a=t.state).wrap&&11!==a.mode?T:11===a.mode&&R(1,e,i,0)!==a.check?-3:j(t,e,i,i)?(a.mode=31,-4):(a.havedict=1,U):T},a.inflateInfo="pako inflate (from Nodeca project)";},{"../utils/common":3,"./adler32":5,"./crc32":7,"./inffast":10,"./inftrees":12}],12:[function(t,e,a){var D=t("../utils/common"),I=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],U=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],T=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],F=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];e.exports=function(t,e,a,i,n,r,s,o){var l,h,d,f,_,u,c,b,g,m=o.bits,w=0,p=0,v=0,k=0,y=0,x=0,z=0,B=0,S=0,E=0,A=null,Z=0,R=new D.Buf16(16),C=new D.Buf16(16),N=null,O=0;for(w=0;w<=15;w++)R[w]=0;for(p=0;p<i;p++)R[e[a+p]]++;for(y=m,k=15;1<=k&&0===R[k];k--);if(k<y&&(y=k),0===k)return n[r++]=20971520,n[r++]=20971520,o.bits=1,0;for(v=1;v<k&&0===R[v];v++);for(y<v&&(y=v),w=B=1;w<=15;w++)if(B<<=1,(B-=R[w])<0)return -1;if(0<B&&(0===t||1!==k))return -1;for(C[1]=0,w=1;w<15;w++)C[w+1]=C[w]+R[w];for(p=0;p<i;p++)0!==e[a+p]&&(s[C[e[a+p]]++]=p);if(0===t?(A=N=s,u=19):1===t?(A=I,Z-=257,N=U,O-=257,u=256):(A=T,N=F,u=-1),w=v,_=r,z=p=E=0,d=-1,f=(S=1<<(x=y))-1,1===t&&852<S||2===t&&592<S)return 1;for(;;){for(c=w-z,s[p]<u?(b=0,g=s[p]):s[p]>u?(b=N[O+s[p]],g=A[Z+s[p]]):(b=96,g=0),l=1<<w-z,v=h=1<<x;n[_+(E>>z)+(h-=l)]=c<<24|b<<16|g|0,0!==h;);for(l=1<<w-1;E&l;)l>>=1;if(0!==l?(E&=l-1,E+=l):E=0,p++,0==--R[w]){if(w===k)break;w=e[a+s[p]];}if(y<w&&(E&f)!==d){for(0===z&&(z=y),_+=v,B=1<<(x=w-z);x+z<k&&!((B-=R[x+z])<=0);)x++,B<<=1;if(S+=1<<x,1===t&&852<S||2===t&&592<S)return 1;n[d=E&f]=y<<24|x<<16|_-r|0;}}return 0!==E&&(n[_+E]=w-z<<24|64<<16|0),o.bits=y,0};},{"../utils/common":3}],13:[function(t,e,a){e.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"};},{}],14:[function(t,e,a){var l=t("../utils/common"),o=0,h=1;function i(t){for(var e=t.length;0<=--e;)t[e]=0;}var d=0,s=29,f=256,_=f+1+s,u=30,c=19,g=2*_+1,m=15,n=16,b=7,w=256,p=16,v=17,k=18,y=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],x=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],z=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],B=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],S=new Array(2*(_+2));i(S);var E=new Array(2*u);i(E);var A=new Array(512);i(A);var Z=new Array(256);i(Z);var R=new Array(s);i(R);var C,N,O,D=new Array(u);function I(t,e,a,i,n){this.static_tree=t,this.extra_bits=e,this.extra_base=a,this.elems=i,this.max_length=n,this.has_stree=t&&t.length;}function r(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e;}function U(t){return t<256?A[t]:A[256+(t>>>7)]}function T(t,e){t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255;}function F(t,e,a){t.bi_valid>n-a?(t.bi_buf|=e<<t.bi_valid&65535,T(t,t.bi_buf),t.bi_buf=e>>n-t.bi_valid,t.bi_valid+=a-n):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=a);}function L(t,e,a){F(t,a[2*e],a[2*e+1]);}function H(t,e){for(var a=0;a|=1&t,t>>>=1,a<<=1,0<--e;);return a>>>1}function j(t,e,a){var i,n,r=new Array(m+1),s=0;for(i=1;i<=m;i++)r[i]=s=s+a[i-1]<<1;for(n=0;n<=e;n++){var o=t[2*n+1];0!==o&&(t[2*n]=H(r[o]++,o));}}function K(t){var e;for(e=0;e<_;e++)t.dyn_ltree[2*e]=0;for(e=0;e<u;e++)t.dyn_dtree[2*e]=0;for(e=0;e<c;e++)t.bl_tree[2*e]=0;t.dyn_ltree[2*w]=1,t.opt_len=t.static_len=0,t.last_lit=t.matches=0;}function M(t){8<t.bi_valid?T(t,t.bi_buf):0<t.bi_valid&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0;}function P(t,e,a,i){var n=2*e,r=2*a;return t[n]<t[r]||t[n]===t[r]&&i[e]<=i[a]}function Y(t,e,a){for(var i=t.heap[a],n=a<<1;n<=t.heap_len&&(n<t.heap_len&&P(e,t.heap[n+1],t.heap[n],t.depth)&&n++,!P(e,i,t.heap[n],t.depth));)t.heap[a]=t.heap[n],a=n,n<<=1;t.heap[a]=i;}function q(t,e,a){var i,n,r,s,o=0;if(0!==t.last_lit)for(;i=t.pending_buf[t.d_buf+2*o]<<8|t.pending_buf[t.d_buf+2*o+1],n=t.pending_buf[t.l_buf+o],o++,0===i?L(t,n,e):(L(t,(r=Z[n])+f+1,e),0!==(s=y[r])&&F(t,n-=R[r],s),L(t,r=U(--i),a),0!==(s=x[r])&&F(t,i-=D[r],s)),o<t.last_lit;);L(t,w,e);}function G(t,e){var a,i,n,r=e.dyn_tree,s=e.stat_desc.static_tree,o=e.stat_desc.has_stree,l=e.stat_desc.elems,h=-1;for(t.heap_len=0,t.heap_max=g,a=0;a<l;a++)0!==r[2*a]?(t.heap[++t.heap_len]=h=a,t.depth[a]=0):r[2*a+1]=0;for(;t.heap_len<2;)r[2*(n=t.heap[++t.heap_len]=h<2?++h:0)]=1,t.depth[n]=0,t.opt_len--,o&&(t.static_len-=s[2*n+1]);for(e.max_code=h,a=t.heap_len>>1;1<=a;a--)Y(t,r,a);for(n=l;a=t.heap[1],t.heap[1]=t.heap[t.heap_len--],Y(t,r,1),i=t.heap[1],t.heap[--t.heap_max]=a,t.heap[--t.heap_max]=i,r[2*n]=r[2*a]+r[2*i],t.depth[n]=(t.depth[a]>=t.depth[i]?t.depth[a]:t.depth[i])+1,r[2*a+1]=r[2*i+1]=n,t.heap[1]=n++,Y(t,r,1),2<=t.heap_len;);t.heap[--t.heap_max]=t.heap[1],function(t,e){var a,i,n,r,s,o,l=e.dyn_tree,h=e.max_code,d=e.stat_desc.static_tree,f=e.stat_desc.has_stree,_=e.stat_desc.extra_bits,u=e.stat_desc.extra_base,c=e.stat_desc.max_length,b=0;for(r=0;r<=m;r++)t.bl_count[r]=0;for(l[2*t.heap[t.heap_max]+1]=0,a=t.heap_max+1;a<g;a++)c<(r=l[2*l[2*(i=t.heap[a])+1]+1]+1)&&(r=c,b++),l[2*i+1]=r,h<i||(t.bl_count[r]++,s=0,u<=i&&(s=_[i-u]),o=l[2*i],t.opt_len+=o*(r+s),f&&(t.static_len+=o*(d[2*i+1]+s)));if(0!==b){do{for(r=c-1;0===t.bl_count[r];)r--;t.bl_count[r]--,t.bl_count[r+1]+=2,t.bl_count[c]--,b-=2;}while(0<b);for(r=c;0!==r;r--)for(i=t.bl_count[r];0!==i;)h<(n=t.heap[--a])||(l[2*n+1]!==r&&(t.opt_len+=(r-l[2*n+1])*l[2*n],l[2*n+1]=r),i--);}}(t,e),j(r,h,t.bl_count);}function X(t,e,a){var i,n,r=-1,s=e[1],o=0,l=7,h=4;for(0===s&&(l=138,h=3),e[2*(a+1)+1]=65535,i=0;i<=a;i++)n=s,s=e[2*(i+1)+1],++o<l&&n===s||(o<h?t.bl_tree[2*n]+=o:0!==n?(n!==r&&t.bl_tree[2*n]++,t.bl_tree[2*p]++):o<=10?t.bl_tree[2*v]++:t.bl_tree[2*k]++,r=n,(o=0)===s?(l=138,h=3):n===s?(l=6,h=3):(l=7,h=4));}function W(t,e,a){var i,n,r=-1,s=e[1],o=0,l=7,h=4;for(0===s&&(l=138,h=3),i=0;i<=a;i++)if(n=s,s=e[2*(i+1)+1],!(++o<l&&n===s)){if(o<h)for(;L(t,n,t.bl_tree),0!=--o;);else 0!==n?(n!==r&&(L(t,n,t.bl_tree),o--),L(t,p,t.bl_tree),F(t,o-3,2)):o<=10?(L(t,v,t.bl_tree),F(t,o-3,3)):(L(t,k,t.bl_tree),F(t,o-11,7));r=n,(o=0)===s?(l=138,h=3):n===s?(l=6,h=3):(l=7,h=4);}}i(D);var J=!1;function Q(t,e,a,i){var n,r,s,o;F(t,(d<<1)+(i?1:0),3),r=e,s=a,o=!0,M(n=t),o&&(T(n,s),T(n,~s)),l.arraySet(n.pending_buf,n.window,r,s,n.pending),n.pending+=s;}a._tr_init=function(t){J||(function(){var t,e,a,i,n,r=new Array(m+1);for(i=a=0;i<s-1;i++)for(R[i]=a,t=0;t<1<<y[i];t++)Z[a++]=i;for(Z[a-1]=i,i=n=0;i<16;i++)for(D[i]=n,t=0;t<1<<x[i];t++)A[n++]=i;for(n>>=7;i<u;i++)for(D[i]=n<<7,t=0;t<1<<x[i]-7;t++)A[256+n++]=i;for(e=0;e<=m;e++)r[e]=0;for(t=0;t<=143;)S[2*t+1]=8,t++,r[8]++;for(;t<=255;)S[2*t+1]=9,t++,r[9]++;for(;t<=279;)S[2*t+1]=7,t++,r[7]++;for(;t<=287;)S[2*t+1]=8,t++,r[8]++;for(j(S,_+1,r),t=0;t<u;t++)E[2*t+1]=5,E[2*t]=H(t,5);C=new I(S,y,f+1,_,m),N=new I(E,x,0,u,m),O=new I(new Array(0),z,0,c,b);}(),J=!0),t.l_desc=new r(t.dyn_ltree,C),t.d_desc=new r(t.dyn_dtree,N),t.bl_desc=new r(t.bl_tree,O),t.bi_buf=0,t.bi_valid=0,K(t);},a._tr_stored_block=Q,a._tr_flush_block=function(t,e,a,i){var n,r,s=0;0<t.level?(2===t.strm.data_type&&(t.strm.data_type=function(t){var e,a=4093624447;for(e=0;e<=31;e++,a>>>=1)if(1&a&&0!==t.dyn_ltree[2*e])return o;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return h;for(e=32;e<f;e++)if(0!==t.dyn_ltree[2*e])return h;return o}(t)),G(t,t.l_desc),G(t,t.d_desc),s=function(t){var e;for(X(t,t.dyn_ltree,t.l_desc.max_code),X(t,t.dyn_dtree,t.d_desc.max_code),G(t,t.bl_desc),e=c-1;3<=e&&0===t.bl_tree[2*B[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e}(t),n=t.opt_len+3+7>>>3,(r=t.static_len+3+7>>>3)<=n&&(n=r)):n=r=a+5,a+4<=n&&-1!==e?Q(t,e,a,i):4===t.strategy||r===n?(F(t,2+(i?1:0),3),q(t,S,E)):(F(t,4+(i?1:0),3),function(t,e,a,i){var n;for(F(t,e-257,5),F(t,a-1,5),F(t,i-4,4),n=0;n<i;n++)F(t,t.bl_tree[2*B[n]+1],3);W(t,t.dyn_ltree,e-1),W(t,t.dyn_dtree,a-1);}(t,t.l_desc.max_code+1,t.d_desc.max_code+1,s+1),q(t,t.dyn_ltree,t.dyn_dtree)),K(t),i&&M(t);},a._tr_tally=function(t,e,a){return t.pending_buf[t.d_buf+2*t.last_lit]=e>>>8&255,t.pending_buf[t.d_buf+2*t.last_lit+1]=255&e,t.pending_buf[t.l_buf+t.last_lit]=255&a,t.last_lit++,0===e?t.dyn_ltree[2*a]++:(t.matches++,e--,t.dyn_ltree[2*(Z[a]+f+1)]++,t.dyn_dtree[2*U(e)]++),t.last_lit===t.lit_bufsize-1},a._tr_align=function(t){var e;F(t,2,3),L(t,w,S),16===(e=t).bi_valid?(T(e,e.bi_buf),e.bi_buf=0,e.bi_valid=0):8<=e.bi_valid&&(e.pending_buf[e.pending++]=255&e.bi_buf,e.bi_buf>>=8,e.bi_valid-=8);};},{"../utils/common":3}],15:[function(t,e,a){e.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0;};},{}],"/":[function(t,e,a){var i={};(0, t("./lib/utils/common").assign)(i,t("./lib/deflate"),t("./lib/inflate"),t("./lib/zlib/constants")),e.exports=i;},{"./lib/deflate":1,"./lib/inflate":2,"./lib/utils/common":3,"./lib/zlib/constants":6}]},{},[])("/")});
   window._SOURCE = _SOURCE;
   let ret = window.pako;
   ret._SOURCE = _SOURCE;
   return ret;
  }();

  var _index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    zlib: zlib
  });

  /* 
   Masses from www.CIAAW.org, abundances from https://doi.org/10.1515/pac-2015-0503. 
   All values given at a precision of 1 fewer sf than the fewest given by CIAAW for that element
  */

  let constants = function _SOURCE() {
   let _constants = {
    ELEMENTS:
    { 
     C:
     {
      caption: 'Carbon',
      token: 'C',
      symbol: {
       text: 'C',
       display: 'text'
      },
      isotopes: [
                 [ 12.00000000,  0.98892 ],  //NBS 19 (TS-Limestone)
                 [ 13.00335484,  0.01108 ]
                ]              
     },
     '13C':
     {
      caption: 'Carbon-13',
      token: '13C',
      symbol: {
       text: '13C',
       display: 'text'
      },
      isotopes: [
                 [ 12.00000000,  0.005 ],    //SILAC Carbon-13 incorporation typically ~99.5% (Thermo & Sigma reagents)
                 [ 13.00335484,  0.995 ]
                ]              
     },
     H:
     {
      caption: 'Hydrogen',
      token: 'H',
      symbol: {
       text: 'H',
       display: 'text'
      },
      isotopes: [
                 [ 1.007825032,  0.9998443 ], //VSMOW (Vienna Standard Mean Ocean Water)
                 [ 2.014101778,  0.0001557 ]
                ]
     },
     N:
     {
      caption: 'Nitrogen',
      token: 'N',
      symbol: {
       text: 'N',
       display: 'text'
      },
      isotopes: [
                 [ 14.00307400, 0.99634 ],   //Air
                 [ 15.00010890, 0.00366 ] 
                ]
     },
     '15N':
     {
      caption: 'Nitrogen-15',
      token: '15N',
      symbol: {
       text: '15N',
       display: 'text'
      },
      isotopes: [
                 [ 14.00307400, 0.005 ],     //SILAC Nitrogen-15 incorporation typically ~99.5% (Thermo & Sigma reagents)
                 [ 15.00010890, 0.995 ] 
                ]
     },
     O:
     {
      caption: 'Oxygen',
      token: 'O',
      symbol: {
       text: 'O',
       display: 'text'
      },
      isotopes: [
                 [ 15.99491462,  0.997621 ],  //VSMOW (Vienna Standard Mean Ocean Water)
                 [ 16.99913176,  0.000379 ],
                 [ 17.99915961,  0.002000 ]
                ]
     },
     P:
     {
      caption: 'Phosphorus',
      token: 'P',
      symbol: {
       text: 'P',
       display: 'text'
      },
      isotopes: [
                 [ 30.97376200, 1 ]           //N/A
                ]
     },
     S:
     {
      caption: 'Sulphur',
      token: 'S',
      symbol: {
       text: 'S',
       display: 'text'
      },
      isotopes: [
                 [ 31.97207117,  0.9504074 ],    //IAEA-S-1
                 [ 32.9714590,   0.0074869 ],
                 [ 33.967867,    0.0419599 ],
                 [ 35.96708,     0.0001458 ]
                ]
     },
     Br:
     {
      caption: 'Bromine',
      token: 'Br',
      symbol: {
       text: 'Br',
       display: 'text'
      },
      isotopes: [
                 [ 78.91834,  0.50686 ],    //NIST SRM 977
                 [ 80.91629,  0.49314 ]
                ]
     },
     Se:
     {
      caption: 'Selenium',
      token: 'Se',
      symbol: {
       text: 'Se',
       display: 'text'
      },
      isotopes: [
                 [ 73.922476,  0.0086 ],
                 [ 75.919214,  0.0923 ],
                 [ 76.919914,  0.0760 ],
                 [ 77.91731,   0.2369 ],
                 [ 79.91652,   0.4980 ],
                 [ 81.91670,   0.0882 ],
                ]
     }
    },
    RESIDUES:
    {
     AMINOACIDS:
     {
      ALANINE:
      {
       token: 'A',
       symbol: {
        text: 'A',
        display: 'text'
       },
       atoms: {
        C: 3,
        H: 5,
        N: 1,
        O: 1
       },
       caption: 'Alanine'
      },
      ARGININE:
      {
       token: 'R',
       symbol: {
        text: 'R',
        display: 'text'
       },
       atoms: {
        C: 6,
        H:12,
        N: 4,
        O: 1
       },
       caption: 'Arginine'
      },
      ASPARAGINE: 
      {
       token: 'N',
       symbol: {
        text: 'N',
        display: 'text'
       },
       atoms: {
        C: 4,
        H: 6,
        N: 2,
        O: 2
       },
       caption: 'Asparagine'
      },
      ASPARTATE:  
      {
       token: 'D',
       symbol: {
        text: 'D',
        display: 'text'
       },
       atoms: {
        C: 4,
        H: 5,
        N: 1,
        O: 3
       },
       caption: 'Aspartate'
      },
      CYSTEINE:  
      {
       token: 'C',
       symbol: {
        text: 'C',
        display: 'text'
       },
       atoms: {
        C: 3,
        H: 5,
        N: 1,
        O: 1,
        S: 1
       },
       caption: 'Cysteine'
      },
      GLUTAMATE:
      {
       token: 'E',
       symbol: {
        text: 'E',
        display: 'text'
       },
       atoms: {
        C: 5,
        H: 7,
        N: 1,
        O: 3
       },
       caption: 'Glutamate'
      },
      GLUTAMINE:
      {
       token: 'Q',
       symbol: {
        text: 'Q',
        display: 'text'
       },
       atoms: {
        C: 5,
        H: 8,
        N: 2,
        O: 2
       },
       caption: 'Glutamine'
      },
      GLYCINE:
      {
       token: 'G',
       symbol: {
        text: 'G',
        display: 'text'
       },
       atoms: {
        C: 2,
        H: 3,
        N: 1,
        O: 1
       },
       caption: 'Glycine'
      },
      HISTIDINE:
      {
       token: 'H',
       symbol: {
        text: 'H',
        display: 'text'
       },
       atoms: {
        C: 6,
        H: 7,
        N: 3,
        O: 1
       },
       caption: 'Histidine'
      },
      ISOLEUCINE:
      {
       token: 'I',
       symbol: {
        text: 'I',
        display: 'text'
       },
       atoms: {
        C: 6,
        H:11,
        N: 1,
        O: 1
       },
       caption: 'Isoleucine'
      },
      LEUCINE:
      {
       token: 'L',
       symbol: {
        text: 'L',
        display: 'text'
       },
       atoms: {
        C: 6,
        H:11,
        N: 1,
        O: 1
       },
       caption: 'Leucine'
      },
      LYSINE:
      {
       token: 'K',
       symbol: {
        text: 'K',
        display: 'text'
       },
       atoms: {
        C: 6,
        H:12,
        N: 2,
        O: 1
       },
       caption: 'Lysine'
      },
      METHIONINE:
      {
       token: 'M',
       symbol: {
        text: 'M',
        display: 'text'
       },
       atoms: {
        C: 5,
        H: 9,
        N: 1,
        O: 1,
        S: 1
       },
       caption: 'Methionine'
      },
      PHENYLALANINE:
      {
       token: 'F',
       symbol: {
        text: 'F',
        display: 'text'
       },
       atoms: {
        C: 9,
        H: 9,
        N: 1,
        O: 1
       },
       caption: 'Phenylalanine'
      },
      PROLINE:
      {
       token: 'P',
       symbol: {
        text: 'P',
        display: 'text'
       },
       atoms: {
        C: 5,
        H: 7,
        N: 1,
        O: 1
       },
       caption: 'Proline'
      },
      SERINE:
      {
       token: 'S',
       symbol: {
        text: 'S',
        display: 'text'
       },
       atoms: {
        C: 3,
        H: 5,
        N: 1,
        O: 2
       },
       caption: 'Serine'
      },
      THREONINE:
      {
       token: 'T',
       symbol: {
        text: 'T',
        display: 'text'
       },
       atoms: {
        C: 4,
        H: 7,
        N: 1,
        O: 2
       },
       caption: 'Threonine'
      },
      TRYPTOPHAN:
      {
       token: 'W',
       symbol: {
        text: 'W',
        display: 'text'
       },
       atoms: {
        C:11,
        H:10,
        N: 2,
        O: 1
       },
       caption: 'Tryptophan'
      },
      TYROSINE:
      {
       token: 'Y',
       symbol: {
        text: 'Y',
        display: 'text'
       },
       atoms: {
        C: 9,
        H: 9,
        N: 1,
        O: 2
       },
       caption: 'Tyrosine'
      },
      VALINE:
      {
       token: 'V',
       symbol: {
        text: 'V',
        display: 'text'
       },
       atoms: {
        C: 5,
        H: 9,
        N: 1,
        O: 1
       },
       caption: 'Valine'
      },
      SELENOCYSTEINE:
      {
       token: 'U',
       symbol: {
        text: 'U',
        display: 'text'
       },
       atoms: {
        C: 3,
        H: 5,
        N: 1,
        O: 1,
        Se: 1
       },
       caption: 'Selenocysteine'
      },
      PYRROLYSINE:
      {
       token: 'O',
       symbol: {
        text: 'O',
        display: 'text'
       },
       atoms: {
        C: 12,
        H: 19,
        N: 3,
        O: 2,
       },
       caption: 'Pyrrolysine'
      }
     },

  //White	255/255/255
  //Blue	0/144/188
  //Green	0/166/81
  //Yellow	255/212/0
  //Light blue	143/204/233
  //Pink	246/158/161
  //Purple	165/67/153
  //Brown	161/122/77
  //Orange	244/121/32
  //Red	237/28/36

     MONOSACCHARIDES:
     {
      SIALICACID:
      {
       token: 'Sia',
       symbol: {
        text: 'Sia',
        icon: 'diamond',
        colour: 'rgb(237,28,36)', //red
        display: 'icon'
       },
       atoms: {
        C: 11,
        H: 17,
        N: 1,
        O: 8
       },
       caption: 'Unspecified Sialic Acid'
      },
      GALACTOSE:
      {
       token: 'Gal',
       symbol: {
        text: 'Gal',
        icon: 'circle',
        colour: 'rgb(255,212,0)', //yellow
        display: 'icon'
       },
       atoms: {
        C: 6,
        H: 10,
        O: 5
       },
       caption: 'D-Galactose'
      },
      MANNOSE:
      {
       token: 'Man',
       symbol: {
        text: 'Man',
        icon: 'circle',
        colour: 'rgb(0,166,81)', //green
        display: 'icon'
       },
       atoms: {
        C: 6,
        H: 10,
        O: 5
       },
       caption: 'D-Mannose'
      },
      NACETYLGLUCOSAMINE:
      {
       token: 'GlcNAc',
       symbol: {
        text: 'GlcNAc',
        icon: 'square',
        colour: 'rgb(0,144,188)', //blue
        display: 'icon'
       },
       atoms: {
        C: 11,
        H: 17,
        N: 1,
        O: 8
       },
       caption: 'N-Acetyl-D-Glucosamine'
      },
      FUCOSE:
      {
       token: 'Fuc',
       symbol: {
        text: 'Fuc',
        icon: 'triangle',
        colour: 'rgb(237,28,36)', //red
        display: 'icon'
       },
       atoms: {
        C: 6,
        H: 10,
        O: 4
       },
       caption: 'Fucose'
      }
     }
    },
    MOIETIES:
    {
     NTERM:
     {
      symbol: {
       text: '[N-term.]',
       display: 'text'
      },
      atoms: {
       H:1
      },
      caption: 'Peptide N-terminus'
     },
     CTERM:
     {
      symbol: {
       text: '[C-term.]',
       display: 'text'
      },
      atoms: {
       H:1,
       O:  1
      },
      caption: 'Peptide C-terminus'
     },
     REDUCINGEND:
     {
      symbol: {
       text: '[Red.]',
       display: 'text'
      },
      atoms: {
       H:1
      },
      caption: 'Oligosaccharide Reducing End'
     },
     NONREDUCINGEND:
     {
      symbol: {
       text: '[Non-red.]',
       display: 'text'
      },
      atoms: {
       H:1,
       O:  1
      },
      caption: 'Oligosaccharide Non-reducing End'
     },
     NH2:
     {
      symbol: {
       text: '[NH2]',
       display: 'text'
      },
      atoms: {
       H:2,
       N:1
      },
      caption: 'Amino group'
     },
     CHO:
     {
      symbol: {
       text: '[CHO]',
       display: 'text'
      },
      atoms: {
       C:1,
       H:1,
       O:  1
      },
      caption: 'Aldehyde (formyl) group'
     },
     H:
     {
      symbol: {
       text: '[H]',
       display: 'text'
      },
      atoms: {
       H:1
      },
      caption: 'Hydrogen'
     },
     CO:
     {
      symbol: {
       text: '[CO]',
       display: 'text'
      },
      atoms: {
       C:  1,
       O:  1
      },
      caption: 'Carbonyl group'
     },
     AMMONIA:
     {
      symbol: {
       text: '[NH3]',
       display: 'text'
      },
      atoms: {
       H:3,
       N:1
      },
      caption: 'Ammonia'
     },
     WATER:
     {
      symbol: {
       text: '[H2O]',
       display: 'text'
      },
      atoms: {
       H:2,
       O:1
      },
      caption: 'Water'
     }
    },
    MODIFICATIONS:
    {
     OXIDATION:  {
      token: 'ox',
      symbol: {
       text: 'ox',
       display: 'text'
      },
      allowedResidues: ['M'],
      atoms: {
              O: 1
             },
      caption: 'Oxidation'
     },
     CARBAMIDOMETHYLATION: {
      token: 'cam',
      symbol: {
       text: 'cam',
       display: 'text'
      },
      allowedResidues: ['C'],
      atoms: {
              C: 2,
              H: 3,
              N: 1,
              O: 1
             },
      caption: 'Carbamidomethylation'
     },
     DEAMIDATION: {
      token: 'd',
      symbol: {
       text: 'd',
       display: 'text'
      },
      allowedResidues: ['N','Q'],
      atoms: {
              H: -1,
              N: -1,
              O: 1
             },
      caption: 'Deamidation'
     },
     PHOSPHORYLATION: {
      token: 'p',
      symbol: {
       text: 'p',
       display: 'text'
      },
      allowedResidues: ['N','Q'],
      atoms: {
              H: 1,
              O: 3,
              P: 1
             },
      caption: 'Phosphorylation'
     },
     SILAC_LYS8: {
      token: 'sk8',
      symbol: {
       text: 'sk8',
       display: 'text'
      },
      allowedResidues: ['K'],
      atoms: {
              C: -6,
              '13C': 6,
              N: -2,
              '15N': 2
             },
      caption: '13C(6)15N(2) Lysine'
     },
     SILAC_ARG10: {
      token: 'sr10',
      symbol: {
       text: 'sr10',
       display: 'text'
      },
      allowedResidues: ['R'],
      atoms: {
              C: -6,
              '13C': 6,
              N: -4,
              '15N': 4
             },
      caption: '13C(6)15N(4) Arginine'
     }
    }
   };

    _constants._SOURCE=_SOURCE;
   return _constants;
  }();

  let common = function _SOURCE() {

   let workerPool = [];
   let taskQueue = [];
   globalThis.wp = workerPool; //for monitoring
   globalThis.tq = taskQueue; //for monitoring

   let initWorker = function(coreModuleFilter,extraModules,extraModuleNamespaces,extraModuleFilters) {
    let w = new Worker(getMslibWorkerURI(e => globalThis.postMessage(eval(e.data.shift())(...e.data)),...arguments));
    w.addEventListener("message", (e) => {
     if (e.data) w.resolve(e.data);
     else w.reject(e);
     if (taskQueue.length) {
      let [payload,resolve,reject] = taskQueue.shift();
      w.resolve = resolve;
      w.reject = reject;
      w.postMessage(payload);     
     }
     else w.ready = true; 
    },false);
    w.ready = true;
    workerPool.push(w);
   };

   let initWorkers = function(n) {
    let len;
    do {
     len = workerPool.length;
     initWorker();
    } while( len < workerPool.length && len < n);
    return len;
   };

   let killWorker = function(i) {
    i = i || 0;
    workerPool[i].terminate();
    workerPool.splice(i,1);
   };

   let performTask = function(payload) {
    return new Promise((resolve,reject) => {
     if (workerPool.length) {
      let freeWorker = workerPool.find(w => w.ready);
      if (freeWorker) {
       freeWorker.ready = false;
       freeWorker.resolve = resolve;
       freeWorker.reject = reject;
       freeWorker.postMessage(payload);
      }
      else {
       taskQueue.push([payload,resolve,reject]);
      }
     }
     else {
      resolve(eval(payload.shift())(...payload));
     } 
    })
   };

   let getMslibWorkerURI = function(onMessage,coreModuleFilter,extraModules,extraModuleNamespaces,extraModuleFilters) {
    return URL.createObjectURL(new Blob([
     getRecursiveSOURCE([mslib],["mslib"],[coreModuleFilter]).concat(getRecursiveSOURCE(extraModules,extraModuleNamespaces,extraModuleFilters),
      "globalThis.addEventListener(\"message\","+onMessage.toString()+");"
     ).join(";\n")
    ]));
   };

   let getRecursiveSOURCE = function(objects,namespaces,filter) {
    if (!objects) return [];
    else return [].concat.apply([],objects.map((o,i) => {
     if (!o) return [];
     let namespace = (namespaces && namespaces[i]);
     if (!namespace) return [];
     let declaration = (namespace.includes(".") ? "let " : "")+namespace+"=";
     if (o._SOURCE) return declaration+o._SOURCE.toString()+"()";
     else return [].concat.apply([declaration+"{}"],
                                 Object.keys(o)
                                 .sort()
                                 .sort((a,b) => {
                                  if (typeof(o[a]._SOURCE) == typeof(o[b]._SOURCE)) return 0;
                                  else if (o[a]._SOURCE) return 1;
                                  else return -1;
                                 })
                                 .map((k) => (filter[i] && filter[i].length && !filter[i].find(e=>(e==k))) ? [] : getRecursiveSOURCE([o[k]],[namespace+"."+k],[filter[i]])));
    }));
   };

   let callAsync = function(func) {  //To be removed when everything works as a Promise
    Promise.resolve().then(func);
   };
   
   let Reader = function(file,parent) {

    let _reader = function(file,parent) {
     if (!(globalThis.File && globalThis.FileReader && globalThis.Blob)) throw new Error("Reader requires full File API support");
     if ((typeof(file) == 'object') && file.constructor === File) this.file = file;
     else throw new Error("ReaderInvalidFileObject");
     initialise(this);
     this.parent = parent;
     this.position = 0;
     this.fileReader = new fileReaderWithEventHandles(this);
    };
    _reader.prototype.readBinary = function(pos,len) {
     return readAs.call(this,this.fileReader.readAsArrayBuffer,pos,len);
    };
    _reader.prototype.readText = function(pos,len) {
     return readAs.call(this,this.fileReader.readAsText,pos,len);
    };

    let fileReaderWithEventHandles = function(reader) {
     let fr = new FileReader();
     fr.onprogress = (function(e) { progress(this,(e.lengthComputable ? (e.loaded/e.total)*100 : -1 )); }).bind(reader);
     fr.onerror = function(e) { throw new Error("ReaderError") };
     if (reader.report) fr.onloadstart = (function(e) { console.log("Reader ("+this.file.name+"): Reading from file"); }).bind(reader);
     return fr;
    };

    let getFileSlice = function(pos,len) {
     if (pos >= this.file.size) {
      console.log("Error: Last valid file offset ("+(this.file.size-1)+") is before offset " + pos);
      throw new Error("ReaderInvalidFileOffset");
     }
     else {
      let fs,newPos;
      if (len && (len < (this.file.size - pos))) {
       fs = this.file.slice(pos, pos + len);
       newPos = pos + len;
      }
      else {
       fs = this.file.slice(pos);
       newPos = this.file.size;
      }
      return([fs,newPos]);
     }
    };

    let readAs = function(method,pos,len) {
     return new Promise((resolve) => {
      if (this.fileReader.readyState == FileReader.LOADING) throw new Error("ReaderNotReady");
      pos = pos > 0 ? pos: 0;
      if (len <= 0) throw new Error("ReaderZeroLengthFileSlice");
      if (this.report) {
       console.log("Reader ("+this.file.name+"): Requested offsets "+pos+" to "+(len ? (pos+len) : this.file.size));
       if (this.lastReadStart) console.log("Reader ("+this.file.name+"): Current buffer is offsets "+this.lastReadStart+" to "+(this.lastReadEnd));
      }
      if (this.lastReadStart && (pos >= this.lastReadStart) && ((pos+len) <= (this.lastReadEnd))) {
       let cachepos = pos - this.lastReadStart;
       if (this.report) console.log("Reader ("+this.file.name+"): Returning cache-offsets "+cachepos+" to "+(cachepos+len));
       if (!this.cache) {
        if (this.fileReader.result !== null) this.cache = this.fileReader.result.slice(0); //speed up repeated access (fileReader.result is slow to access)
        else throw new Error("ReaderResultIsNull")
       }
       this.position = pos + len;
       resolve(this.cache.slice(cachepos, cachepos + len));
      }
      else {
       if (this.lastReadStart) {
        delete this.lastReadStart;
        delete this.lastReadEnd;
        delete this.cache;
       }
       let [fs,newPos] = getFileSlice.call(this,pos,len);
       if (fs) {
        this.lastReadStart = pos;
        this.position = this.lastReadEnd = newPos;
        if (this.report) console.log("Reader ("+this.file.name+"): New read of offsets "+this.lastReadStart+" to "+this.lastReadEnd);
        if (this.report) console.log("Reader ("+this.file.name+"): Calling "+method.name);
        this.fileReader.onload = (r) => resolve(this.fileReader.result);
        method.call(this.fileReader,fs);
       }
       else {
        throw new Error("ReaderInvalidFileSlice");
       }
      }
     });
    };
    return _reader;
   }();

   let initialise = function(obj) {
    obj.ready = true;
    obj.progress = 100;
    obj.report = false;
   };

   let start = function(obj) {
    obj.ready = false;
    obj.progress = 0;
   };

   let progress = function(obj,p) {
    obj.progress = p;
   };

   let finish = function(obj) {
    obj.ready = true;
    obj.progress = 100;
    if (obj.onReady) { 
     let func = obj.onReady; 
     delete(obj.onReady);
     func();
    }
   };

   let whenReady = function(obj,func) {
    if (obj.onReady) throw new Error("OnReadyFunctionExists");
    if (obj.ready) func();
    else obj.onReady = func;
   };

   return {
    performTask : performTask,
    initWorker : initWorker,
    initWorkers : initWorkers,
    killWorker : killWorker,
    callAsync: callAsync,
    Reader: Reader,
    initialise: initialise,
    start: start,
    progress: progress,
    finish: finish,
    whenReady: whenReady,
    getMslibWorkerURI : getMslibWorkerURI,
    _SOURCE: _SOURCE
   }

  }();

  let math = function _SOURCE() {
   
   var log2 = function(x) {
    return Math.log(x)/Math.log(2);
   };

   var getNonSparseNumericArray = function(arr) {
    if (!Array.isArray(arr)) throw new Error("MathArgumentIsNotArray");
    return arr.map(ele => parseFloat(ele)).filter(ele => (ele !== null) && !isNaN(ele)).sort((a,b) => (a-b));
   };

   var mean = function(arr) {
    var safeArr = getNonSparseNumericArray(arr);
    if (!safeArr.length) return null;
    else return safeArr.reduce((a,b) => (a+b),0)/safeArr.length;
   };

   var median = function(arr) {
    var safeArr = getNonSparseNumericArray(arr);
    switch (safeArr.length) {
     case 0 : return null;
     case 1 : return safeArr[0];
     default : {
      var halfIndex = Math.floor(safeArr.length/2);
      return safeArr.length % 2 ? safeArr[halfIndex] : mean(safeArr.slice(halfIndex-1,halfIndex+1));
     }
    }
   };

   var mad = function(arr) {
    var safeArr = getNonSparseNumericArray(arr);
    if (!safeArr.length) return null;
    var arrMedian = median(safeArr);
    if (arrMedian === null) return null;
    else return median(safeArr.map(ele => Math.abs(ele-arrMedian)))*1.4826;
   };
   
   var percentile = function(arr,p) {
    var safeArr = getNonSparseNumericArray(arr);
    var r = (p * (safeArr.length/100));
    var v;
    if (r < 1) {
     v = safeArr[0];
    }
    else if (r > safeArr.length) {
     v = safeArr[safeArr.length-1];
    }
    else if(!(r % 1)) {
     v = safeArr[r-1];
    }
    else {
     var k = Math.floor(r);
     var k1 = Math.ceil(r);
     var pk = k * (100/safeArr.length);
     v = safeArr[k-1] + (p-pk)*(safeArr.length/100)*(safeArr[k1-1]-safeArr[k-1]);
    }
    return v;
   };
   
   var erfc = function(x) {
    var z = Math.abs(x);
    var t = 2.0/(2.0+z);
    var ans = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (1.48851587 + (t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0.0 ? ans : 2.0-ans;
   };
   
   var ppmDiff = function(a,b) {
    return Math.abs(a-b)/Math.max(a,b) * 1e6;
   };

   var ppmError = function(mass,ppm) {
    return (mass/1e6) * ppm;
   };

   var movingAverageSmooth = function(arr,mar) {
    if (!Array.isArray(arr)) throw new Error("MathArgumentIsNotArray");
    if (!arr.length) return null;
    if (arr.length <= (2*mar + 1)) return arr;
    mar = Math.round(mar);
    var padding = Array(mar).fill(0);
    var smth = padding.concat(arr,padding).map(function(ele,i,paddedarr) {
     if ((i >= mar) && ((i+mar) < paddedarr.length)) {
      return paddedarr.slice(i-mar,i+mar+1).reduce((a,b) => (a+b))/(2*mar + 1);
     }
     else {
      return 0;
     }
    });
    return smth.slice(mar,smth.length-mar);
   };

   var maxima = function(arr,allowEnds) { //returns a binary vector of the same length where local maxima are indicated by trues
    if (!Array.isArray(arr)) throw new Error("MathArgumentIsNotArray");
    if (!arr.length) return null;
    if (arr.length == 1) return [true];
    var plateauStart = -1;
    var difference = [0].concat(arr.slice(1).map((ele,i) => (ele - arr[i])));
    if (allowEnds) { //don't report the ends of the array as maxima unless allowEnds set
     difference.unshift(1);
     difference.push(-1);
     plateauStart = 0;
    }
    var isMaxList = difference.map(() => false); 
    difference.slice(1).forEach(function(diff,i) { //difference[i] is the *previous* difference for the current diff
     if (diff < 0) {
      if ((difference[i]) >= 0 && (plateauStart > -1)) {
       isMaxList[Math.floor((i+plateauStart)/2)+1] = true;
       plateauStart = -1; //end of a plateau
      } 
     }
     else if (diff > 0) {
      plateauStart = i;
     }
    });
    if (allowEnds) {
     isMaxList.shift();
     isMaxList.pop();
    }
    return isMaxList;
   };

   return {
    log2          : log2,
    mean          : mean,
    median        : median,
    mad           : mad,
    percentile    : percentile,
    erfc          : erfc,
    ppmDiff       : ppmDiff,
    ppmError      : ppmError,
    movingAverageSmooth : movingAverageSmooth,
    maxima        : maxima,
    _SOURCE : _SOURCE
   }

  }();

  let moietymath = function _SOURCE() {
   let blank = function() {
    return {
     atoms: {},
     symbol: { text : '', display: null},
     token: null,
     caption: null
    }
   };

   let check = function(m) {
    if (!m) throw new Error('moietymathInvalidInput');
    //todo
   };

   let distribution = function(m,charge,elements) {
    check(m);
    // console.log(m);
    // console.log(charge);
    let newDistribution;
    if (typeof(elements) === 'undefined') elements = mslib.constants.ELEMENTS;
    if (charge > 0) {
     newDistribution = new mslib.data.Distribution(elements.H.isotopes).normalise();
     for (let i = 1; i < charge; i++) {
      newDistribution = newDistribution.convolute(new mslib.data.Distribution(elements.H.isotopes).normalise());
     }
    }
    else {
     newDistribution = new mslib.data.Distribution([[0,1]]);
    }
    Object.keys(m.atoms).forEach(ele => {
     if (m.atoms[ele]) {
      if (m.atoms[ele] < 0) throw new Error('moietymathDistributionWithNegativeAtomNumber');
      let binaryMask = m.atoms[ele].toString(2).split("").reverse().map((i) => parseInt(i));
      let doublingsRequired = binaryMask.length-1;
      let intermediateDistributions = [];
      // console.log(ele + ' REQUIRE '+m.atoms[ele]);
      // console.log(ele + ' ' + 1);
      intermediateDistributions[0] = new mslib.data.Distribution(elements[ele].isotopes).normalise();
      for (var i = 0; i < doublingsRequired; i++) {
       // console.log(ele + ' ' + Math.pow(2,i+1));
       intermediateDistributions[i+1] = intermediateDistributions[i].convolute(intermediateDistributions[i]).normalise();
      }
      let eleDistribution = intermediateDistributions[doublingsRequired];
      for (var i = 0; i < doublingsRequired; i++) {
       if (binaryMask[i]) {
        // console.log(ele + ' ' + (n+=Math.pow(2,i)));
        eleDistribution = eleDistribution.convolute(intermediateDistributions[i]).normalise();
       }
      }
      // console.log('ADDING TO TOTAL');
      newDistribution = newDistribution.convolute(eleDistribution).normalise();
     }
    });
    if (charge) {
     newDistribution = newDistribution.overZ(charge);
    }
    return newDistribution;
   };

   let monoisotopeIndex = function(isotopes) {
    let maxAb = Math.max(...isotopes.map(e => e[1]));
    return isotopes.findIndex(e => e[1]==maxAb);
   };

   let monoisotopicMass = function(m,elements) {
    check(m);
    if (typeof(elements) === 'undefined') elements = mslib.constants.ELEMENTS;
    return (Object.entries(m.atoms).reduce((acc,[atom,n]) => {
     acc += elements[atom].isotopes[monoisotopeIndex(elements[atom].isotopes)][0]*n;
     return acc;
    },m.massDelta ? m.massDelta : 0));
   };

   let monoisotopicMz = function(m,charge,elements) {
    check(m);
    charge = (charge ? +charge : 1);
    if (typeof(elements) === 'undefined') elements = mslib.constants.ELEMENTS;
    return (monoisotopicMass(m,elements) + elements.H.isotopes[0][0]*charge)/charge;
   };

   let monoAndPlusOneMz = function(m,charge,elements) {
    check(m);
    if (typeof(elements) === 'undefined') elements = mslib.constants.ELEMENTS;
    let monoMz = monoisotopicMz(m,charge,elements);
    let totalInt = 0;
    let massDiff = 0;
    Object.entries(m.atoms).forEach(([k,v]) => {
     let mi = monoisotopeIndex(elements[k].isotopes);
     if (mi < elements[k].isotopes.length-1) {
      let contributedInt = v * elements[k].isotopes[mi+1][1]; 
      totalInt += contributedInt;
      massDiff += (elements[k].isotopes[mi+1][0] - elements[k].isotopes[mi][0]) * contributedInt;
     }
    });
    massDiff /= totalInt;
    return [monoMz,monoMz+massDiff/charge];
   };

   let topNMz = function(n,m,charge,elements,ppmGap) {
    check(m);
    if (!n) n = 1;
    if (!charge) charge = 1;
    if (typeof(ppmGap) == 'undefined') ppmGap = 5;
    let mzs = distribution(m,charge,elements).centroidToMaximas(ppmGap).normalise().values.sort((a,b) => b[1] - a[1]);
    return mzs.slice(0,Math.min(n,mzs.length)).map(e => e[0]);
   };

   let clone = function(m) {
    return JSON.parse(JSON.stringify(m));
   };

   let add = function(m1,m2,newSymbol) {
    check(m1);
    check(m2);
    let r = clone(m1);
    r.caption = null;
    if (newSymbol) r.symbol = newSymbol;
    else if (m1.symbol && m2.symbol) r.symbol = { text : `${m1.symbol.text}${m1.symbol.text.length && m2.symbol.text.length && (m2.symbol.text.charAt(0) != '-') ? '+' : ''}${m2.symbol.text}` , display : 'text' };
    Object.entries(m2.atoms).forEach(([k,v]) => r.atoms[k] = (r.atoms[k] ? r.atoms[k] : 0) + v);
    if (m2.massDelta) {
     if (r.massDelta) { r.massDelta += m2.massDelta; } else r.massDelta = m2.massDelta;
    }
    Object.entries(m2).filter(([k,v]) => !Object.keys(r).includes(k)).forEach(([k,v]) => r[k] = v);
    return r;
   };

   let addMassDelta = function(m1,delta) {
    check(m1);
    let r = clone(m1);
    r.caption = null;
    if (!r.massDelta) r.massDelta = delta;
    else r.massDelta += delta;
    return r;
   };

   let subtract = function(m1,m2,newSymbol) {
    check(m1);
    check(m2);
    let r = clone(m1);
    r.caption = null;
    if (newSymbol) r.symbol = newSymbol;
    else if (m1.symbol && m2.symbol) r.symbol = { text : `${m1.symbol.text}-${m2.symbol.text}` , display : 'text' };
    Object.entries(m2.atoms).forEach(([k,v]) => r.atoms[k] = (r.atoms[k] ? r.atoms[k] : 0) - v);
    if (m2.massDelta) {
     if (r.massDelta) { r.massDelta -= m2.massDelta; } else r.massDelta = -m2.massDelta;
    }
    return r;
   };

   let multiply = function(m1,n,newSymbol) {
    check(m1);
    let r = clone(m1);
    r.caption = null;
    if (newSymbol) r.symbol = newSymbol;
    else if (m1.symbol) r.symbol = { text : `${m1.symbol.value}(${n})` , display : 'text' };
    Object.entries(r.atoms).forEach(([k,v]) => r.atoms[k] = v*n);
    if (r.massDelta) r.massDelta =  r.massDelta * n;
    return r;
   };

   let equalComposition = function(m1,m2) {
    check(m1);
    check(m2);
    return (Object.keys(m1.atoms).length == Object.keys(m2.atoms).length
            && Object.entries(m1.atoms).every(([k,v]) => ((k in m2.atoms) && v == m2.atoms[k])));
   };

   return {
    blank: blank,
    distribution: distribution,
    monoisotopicMass: monoisotopicMass,
    monoisotopicMz: monoisotopicMz,
    monoAndPlusOneMz: monoAndPlusOneMz,
    topNMz: topNMz,
    clone: clone,
    add: add,
    addMassDelta: addMassDelta,
    subtract: subtract,
    multiply: multiply,
    equalComposition: equalComposition,
    _SOURCE: _SOURCE
   }
  }();

  let ResidueChain = function _SOURCE() {

   const multiplierRegex = new RegExp(/^\(([1-9]\d*)\)/);

   let _ResidueChain = function(residueData,baseResidues) {
    this.args = arguments;

    this.type = 'unknown';
    this.notationSingular = '?';
    this.notationPlural = ['?','?','?','?','?','?','?','?','?','?'];

    if (typeof(residueData) === 'string') residueData = { sequenceString : residueData };

    let modificationNotationStyles = 'modificationNotationStyles' in residueData ? residueData.modificationNotationStyles : { 'modX' : true, 'X(mod)' : true, 'X[mod]' : true };

    let possibleResidueTokens = Object.entries(baseResidues).reduce((obj,[key,residue]) => { 
     obj[residue.token] = residue;
     obj[residue.token].label = key;
     return obj;
    },{});

    if ('residueDefinitions' in residueData) {
     possibleResidueTokens = Object.entries(residueData.residueDefinitions).reduce((obj,[key,residue]) => { 
      obj[residue.token] = residue;
      obj[residue.token].label = key;
      return obj;
     },possibleResidueTokens);
    }

    if ('modificationDefinitions' in residueData) {
     Object.values(residueData.modificationDefinitions).forEach(mod => {
      if (Number.isInteger(+mod.token)) throw new Error('ResidueChainIllegalModification \''+mod.token+'\'');
      if ('allowedResidues' in mod) Object.values(possibleResidueTokens)
                                    .filter(r => mod.allowedResidues.includes(r.token))
                                    .forEach(residue => {
       let modifiedResidue = mslib.moietymath.add(residue,mod,{ text: residue.symbol.text, note: mod.symbol.text, display: 'text' });
       if (modificationNotationStyles['modX']) possibleResidueTokens[mod.token.toLowerCase()+residue.token] = modifiedResidue;
       if (modificationNotationStyles['X(mod)']) {
        possibleResidueTokens[residue.token+'\('+mod.token+'\)'] = modifiedResidue;
        possibleResidueTokens[residue.token+'\('+mod.token.toLowerCase()+'\)'] = modifiedResidue;
       }
       if (modificationNotationStyles['X[mod]']) {
        possibleResidueTokens[residue.token+'\['+mod.token+'\]'] = modifiedResidue;
        possibleResidueTokens[residue.token+'\['+mod.token.toLowerCase()+'\]'] = modifiedResidue;
       }
      });
     });
    }

    let [ tokens, massDeltas ] = getTokensAndMassDeltas(residueData.sequenceString,possibleResidueTokens);
    this.residues = tokens.map((t,i) => {
     let residue;
     if (t in possibleResidueTokens) {
      residue = mslib.moietymath.clone(possibleResidueTokens[t]);
      if (massDeltas[i]) residue = mslib.moietymath.addMassDelta(residue,massDeltas[i],{ text: residue.symbol.text, note: (massDeltas[i] > 0 ? '+' : '')+massDeltas[i], display: 'text' });
      return residue;
     }
     else throw new Error('ResidueChainUnknownToken \''+t+'\'');
    });

    if ('fixedModifications' in residueData) {
     Object.entries(residueData.fixedModifications).forEach(([key,v]) => {
      let [ tokens, undefined$1 ] = getTokensAndMassDeltas(key,possibleResidueTokens);
      if (!Number.isNaN(+v)) {
       this.residues.forEach((residue,pos) => { 
        if (tokens.some(t => t==residue.token)) {
         this.residues[pos] = mslib.moietymath.addMassDelta(residue,+v,{ text: residue.symbol.text, note: (v > 0 ? '+' : '')+v, display: 'text' });
         this.residues[pos].token = `${residue.token}(${+v})`;
        }
       });
      }
      else {
       if (typeof(v) === 'string') {
        if (v in residueData.modificationDefinitions) v = residueData.modificationDefinitions[v];
        else throw new Error('ResidueChainUndefinedFixedModification');
       }
       else if (typeof(v) !== 'object' || !v.atoms) throw new Error('ResidueChainMalformedFixedModicationDefinition');
       this.residues.forEach((residue,pos) => { 
        if (tokens.some(t => t==residue.token)) {
         this.residues[pos] = mslib.moietymath.add(residue,v,{ text: residue.symbol.text, note: v.symbol.text, display: 'text' });
         this.residues[pos].token = `${residue.token}(${v.token})`;
        }
       });
      }
     });
    }

    if ('variableModifications' in residueData) {
     Object.entries(residueData.variableModifications).forEach(([key,v]) => {
      if (Number.isInteger(+key)) {
       let pos = +key-1;
       if (!Number.isNaN(+v)) {
        this.residues[pos] = mslib.moietymath.addMassDelta(this.residues[pos],+v,{ text: this.residues[pos].symbol.text, note: v.symbol.text, display: 'text' });
        this.residues[pos].token = `${residue.token}(${+v})`;
       }
       else {
        if (typeof(v) === 'string') {
         if (v in residueData.modificationDefinitions) v = residueData.modificationDefinitions[v];
         else throw new Error('ResidueChainUndefinedVariableModification');
        }
        else if (typeof(v) !== 'object' || !v.atoms) throw new Error('ResidueChainMalformedVariableModicationDefinition');
        this.residues[pos] = mslib.moietymath.add(this.residues[pos],v,{ text: this.residues[pos].symbol.text, note: v.symbol.text, display: 'text' });
        this.residues[pos].token = `${residue.token}(${v.token})`;
       }    
      }
      else throw new Error('ResidueChainCannotParseVariableModificationPosition');
     });
    }
   };

   let getTokensAndMassDeltas = function(seqString,possibleResidueTokens) {
    if (!seqString.length) throw new Error('ResidueChainTokenParsingZeroLengthSeqString');

    let residueTokenString = Object.keys(possibleResidueTokens).sort((a,b) => b.length - a.length).join('|').replace(/(\(|\)|\[|\])/g,m => '\\'+m);

    let tokens = [];
    let massDeltas = [];
    let pos = 0;

    let tokenRegex = new RegExp(`^(${residueTokenString})(?:\\(([+-](?:\\d+|\\d+\\.\\d+|\\.\\d+))\\))?`);
    let tokenRegexCaseInsensitive = new RegExp(tokenRegex,'i');

    do {
     let s = seqString.substring(pos);
     let match;
     if (tokens.length && ( match = s.match(multiplierRegex) )) {
      let multiplier = +match[1];
      if (!Number.isInteger(multiplier)) throw new Error('ResidueChainTokenMultiplierParseError');
      if (multiplier > 1) {
       tokens = tokens.concat(Array(multiplier-1).fill(tokens[tokens.length-1]));
       massDeltas = massDeltas.concat(Array(multiplier-1).fill(massDeltas[massDeltas.length-1]));
      }
     }
     else {
      let token;
      if (match = s.match(tokenRegex)) token = match[1];
      else if (match = s.match(tokenRegexCaseInsensitive)) {
       token = Object.keys(possibleResidueTokens).find(t => t.toUpperCase() == match[1].toUpperCase());
      }
      if (match) {
       tokens.push(token);
       massDeltas.push(match[2] ? parseFloat(match[2]) : 0);
      }
     }
     if (!match) throw new Error('ResidueChainTokenParseError');
     pos += match[0].length;
    } while(pos < seqString.length);
  //  console.log([tokens,massDeltas]);
    return [ tokens , massDeltas ];
   };

   _ResidueChain.prototype.toJSON = function() {
    return [this.args[0],this.type];
   };

   _ResidueChain._SOURCE = _SOURCE;
   return _ResidueChain;
  }();

  var _index$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ResidueChain: ResidueChain
  });

  let Chromatogram = function _SOURCE() {

   let _Chromatogram = function(rts,ints,modulus) {
    if ([rts,ints].some((v) => !((typeof(v) == "object") && Array.isArray(v)))) {
     console.log("the first two arguments to mslib.Chromatogram must be an array");
     return {};
    }
    if (rts.length != ints.length) {
     console.log("the first two arguments to mslib.Chromatogram must be of equal length");
     return {};
    }
    this.rts = rts.map((v) => parseFloat(v));
    this.ints = ints.map((v) => parseFloat(v));
    if (modulus) { //2D chromatograms!
     this.modulus = modulus;
    }
   };

   _Chromatogram.prototype.getIntegratedArea = function() {
    if (this.rts.length < 2) { return 0 }  return this.rts.reduce((function(area,rt,i) {
     if (i >= this.rts.length-1) {
      return area
     }
     else {
      var w = this.rts[i+1] - rt;
      var h = (this.ints[i] + this.ints[i+1])/2;
      return (area + (w * h));
     }
    }).bind(this));
   };

   _Chromatogram.prototype.getMinRT = function() {
    if(!this.rts.length) {
     return 0;
    }
    else {
     return Math.min.apply(null,this.rts);
    }
   };

   _Chromatogram.prototype.getMaxRT = function() {
    if(!this.rts.length) {
     return 0;
    }
    else {
     return Math.max.apply(null,this.rts);
    }
   };

   _Chromatogram.prototype.getMaxIntensity = function() {
    if(!this.ints.length) {
     return 0;
    }
    else {
     return Math.max.apply(null,this.ints);
    }
   };

   _Chromatogram._SOURCE = _SOURCE;

   return _Chromatogram;

  }();

  let Scan = function _SOURCE() {
   var _Scan = function(scan) {
    if (!scan) scan = {};
    this.bytes                = scan.bytes || null;
    this.next                 = scan.next || null;
    this.previous             = scan.previous || null;
    this.headerParsed         = scan.headerParsed || false;
    this.msLevel              = scan.msLevel || null;
    this.retentionTime        = scan.retentionTime || null;
    this.centroided           = scan.centroided || null;
    this.lowMz                = scan.lowMz || null;
    this.highMz               = scan.highMz || null;
    this.collisionEnergy      = scan.collisionEnergy || null;
    this.totalCurrent         = scan.totalCurrent || null;
    this.basePeakMz           = scan.basePeakMz || null;
    this.basePeakIntensity    = scan.basePeakIntensity || null;
    this.analyser             = scan.analyser || null;
    this.precursorMzs         = scan.precursorMzs || [];
    this.precursorIntensities = scan.precursorIntensities || [];
    this.precursorCharges     = scan.precursorCharges || [];
    this.activationMethods    = scan.activationMethods || [];
    this.internal             = scan.internal || {};
   };

   _Scan.clone = function(scan) { //does not duplicate spectral data as not stored in scan
    return JSON.parse(JSON.stringify(scan));
   };

   _Scan._SOURCE = _SOURCE;

   return _Scan;
  }();

  let Spectrum = function _SOURCE() {

   var _Spectrum = function(mzs,ints) {
    if ([mzs,ints].some((v) => !((typeof(v) == "object") && Array.isArray(v)))) throw new Error("SpectrumArgumentNotArray");
    if (mzs.length != ints.length) throw new Error("SpectrumArgumentsUnequalLength");
    this.mzs = mzs.map((v) => parseFloat(v));
    if (!this.mzs.every((e,i,a) => i == 0 || a[i-1] <= e)) throw new Error("SpectrumMzsNotOrderedAscending");
    this.ints = ints.map((v) => parseFloat(v));
   };

   _Spectrum.prototype.clone = function() {
    return new _Spectrum(this.mzs,this.ints);
   };

   _Spectrum.prototype.getCroppedSpectrum = function(mz_min,mz_max) {
    var mask = this.mzs.map((ele,i) => ((ele >= mz_min) && (ele <= mz_max)));
    var start = mask.indexOf(true);
    var end = mask.lastIndexOf(true);
    return new _Spectrum(
     this.mzs.slice(start,end+1),
     this.ints.slice(start,end+1)
    )
   };

   _Spectrum.prototype.getMinMz = function() {
    if(!this.mzs.length) {
     return 0;
    }
    else {
     return Math.min.apply(null,this.mzs);
    }
   };

   _Spectrum.prototype.getMaxMz = function() {
    if(!this.mzs.length) {
     return 0;
    }
    else {
     return Math.max.apply(null,this.mzs);
    }
   };

   _Spectrum.prototype.getMaxIntensity = function() {
    if(!this.ints.length) {
     return 0;
    }
    else {
     return Math.max.apply(null,this.ints);
    }
   };

   _Spectrum.prototype.getTotalIntensity = function() {
    if(!this.ints.length) {
     return 0;
    }
    else {
     return(this.ints.reduce((a,b) => a+b));
    }
   };

   _Spectrum.prototype.getBasePeakIndex = function() {
    var maxIndex = 0;
    var maxInt = 0;
    for (var i in this.ints) {
     if (this.ints[i] > maxInt) {
      maxIndex = i;
      maxInt = this.ints[i];
     }
    }
    return(maxIndex);
   };

   _Spectrum.prototype.getBasePeakMz = function() {
    return(this.mzs[this.getBasePeakIndex()]);
   };

   _Spectrum.prototype.getBasePeakIntensity = function() {
    return(this.ints[this.getBasePeakIndex()]);
   };

   _Spectrum.prototype.getMatchedSpectra = function(comparator,mzPPMError) {
    if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
     console.log("can only getMatchedSpectra against another Spectrum (or object with mzs and int)");
     return Number.NaN;
    } 
    if (typeof(mzPPMError) == "undefined") {
     console.log("mzPPMError must be specified");
     return Number.NaN;
    }
   
    var diffs = [];
    for (var i in this.mzs) {
     for (var j in comparator.mzs) {
      diffs.push([i,j,mslib.Math.avgPpmDiff(this.mzs[i],comparator.mzs[j])]);
     }
    }
    diffs.sort((a,b) => a[2] - b[2]);
   
    var this_matched = [];
    for (var i in this.mzs) {
     this_matched[i] = 0;
    }
    var comp_matched = [];
    for (var j in comparator.mzs) {
     comp_matched[j] = 0;
    }
   
    var this_matchlist = [];
    var comp_matchlist = [];
    for (var d in diffs) {
     if (diffs[d][2] > mzPPMError) {
      break;
     }
     if (this_matched[diffs[d][0]] || comp_matched[diffs[d][1]]) {
      continue;
     }
     else {
      this_matchlist.push([this.mzs[diffs[d][0]],this.ints[diffs[d][0]]]);
      comp_matchlist.push([comparator.mzs[diffs[d][1]],comparator.ints[diffs[d][1]]]);
      this_matched[diffs[d][0]] = 1;
      comp_matched[diffs[d][1]] = 1;
     }
    }
   
    for (var i in this.mzs) {
     if (!this_matched[i]) {
      this_matchlist.push([this.mzs[i],this.ints[i]]);
      comp_matchlist.push([this.mzs[i],0]);
     }
    }
    for (var j in comparator.mzs) {
     if (!comp_matched[j]) {
      this_matchlist.push([comparator.mzs[j],0]);
      comp_matchlist.push([comparator.mzs[j],comparator.ints[j]]);
     }
    }
   
    this_matchlist.sort((a,b) => a[0] - b[0]);
    comp_matchlist.sort((a,b) => a[0] - b[0]);
   
    return ([
             [this_matchlist.map((a) => a[0]),this_matchlist.map((a) => a[1])],
             [comp_matchlist.map((a) => a[0]),comp_matchlist.map((a) => a[1])]
            ]);
   };

   //Based on code from Skyline statistics library
   var dotProduct = function(vector_a,vector_b) {
    if ([vector_a,vector_b].some((v) => !((typeof(v) == "object") && Array.isArray(v)))) {
     console.log("both arguments to dotProduct must be an array");
     return Number.NaN;
    }
    if (vector_a.length != vector_b.length) {
     console.log("arguments to dotProduct must be of equal length");
     return Number.NaN;
    }
    var sumCross = 0;
    var sumLeft  = 0;
    var sumRight = 0;
    for (var i = 0, len = vector_a.length; i < len; i++) {
     var left = vector_a[i];
     var right = vector_b[i];
     sumCross += left*right;
     sumLeft += left*left;
     sumRight += right*right;
    }
    if (sumLeft == 0 || sumRight == 0) {
     return (sumLeft == 0 && sumRight == 0 ? 1.0 : 0);
    }
    else {
     return Math.min(1.0, sumCross/Math.sqrt(sumLeft*sumRight));
    }
   };
   
   var normalisedSpectralContrastAngle = function(dp) {
    return (1 - Math.acos(dp)*2/Math.PI);
   };
   
   var unitLengthVector = function(arr) {
    var total = arr.reduce((a,b) => (a+b));
    return (total ? arr.map((a) => (a/total)) : arr);
   };
   
   var sqrtVector = function(arr) {
    return arr.map((a) => Math.sqrt(a));
   };
   
   var sqrtUnitNormalisedSpectralContrastAngle = function(vector_a,vector_b) {
    return normalisedSpectralContrastAngle(
            dotProduct(
             unitLengthVector(sqrtVector(vector_a)),
             unitLengthVector(sqrtVector(vector_b))
            )
           );
   };

   _Spectrum.prototype.getNormalisedSpectralContrastAngleTo = function(comparator,mzPPMError) {
    if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
     console.log("can only getNormalisedSpectralContrastAngleTo another Spectrum (or object with mzs and int)");
     return Number.NaN;
    }
    if (typeof(mzPPMError) == "undefined") {
     mzPPMError = 5.0;
    }
    var matchedSpectra = _Spectrum.prototype.getMatchedSpectra.call(this,comparator,mzPPMError);
    return sqrtUnitNormalisedSpectralContrastAngle(matchedSpectra[0][1],matchedSpectra[1][1]);
   };

   _Spectrum.prototype.getNormalisedWeightedEuclideanDistanceFrom = function(comparator,mzPPMError) {
    if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
     console.log("can only getWeightedEuclideanDistanceFrom another Spectrum (or object with mzs and int)");
     return Number.NaN;
    }
    if (typeof(mzPPMError) == "undefined") {
     mzPPMError = 5.0;
    }
    var matchedSpectra = _Spectrum.prototype.getMatchedSpectra.call(this,comparator,mzPPMError);
    var sumP = matchedSpectra[0][1].reduce((a,b)=>a+b,0);
    var sumQ = matchedSpectra[1][1].reduce((a,b)=>a+b,0);
    var proportionsP = matchedSpectra[0][1].map(inten=>inten/sumP);
    var proportionsQ = matchedSpectra[1][1].map(inten=>inten/sumQ);
    var squaredDiffsWeighted = proportionsP.map((propP,i)=>propP*Math.pow(propP-proportionsQ[i],2));
    return 1-Math.sqrt(squaredDiffsWeighted.reduce((a,b)=>a+b));
   };

   _Spectrum.prototype.getNormalisedEuclideanDistanceFrom = function(comparator,mzPPMError) {
    if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
     console.log("can only getEuclideanDistanceFrom another Spectrum (or object with mzs and int)");
     return Number.NaN;
    }
    if (typeof(mzPPMError) == "undefined") {
     mzPPMError = 5.0;
    }
    var matchedSpectra = _Spectrum.prototype.getMatchedSpectra.call(this,comparator,mzPPMError);
    var sumP = matchedSpectra[0][1].reduce((a,b)=>a+b,0);
    var sumQ = matchedSpectra[1][1].reduce((a,b)=>a+b,0);
    var proportionsP = matchedSpectra[0][1].map(inten=>inten/sumP);
    var proportionsQ = matchedSpectra[1][1].map(inten=>inten/sumQ);
    var squaredDiffs = proportionsP.map((propP,i)=>Math.pow(propP-proportionsQ[i],2));
    return 1-Math.sqrt(squaredDiffs.reduce((a,b)=>a+b));
   };

   _Spectrum.prototype.getNormalisedKullbackLeiblerDivergenceFrom = function(comparator,mzPPMError) {
    if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
     console.log("can only getKullbackLeiblerDivergenceFrom another Spectrum (or object with mzs and int)");
     return Number.NaN;
    }
    if (typeof(mzPPMError) == "undefined") {
     mzPPMError = 5.0;
    }
    var matchedSpectra = _Spectrum.prototype.getMatchedSpectra.call(this,comparator,mzPPMError);
    matchedSpectra[0][1] = matchedSpectra[0][1].map((inten,i) => matchedSpectra[1][1][i] ? inten : 0);
    var sumP = matchedSpectra[0][1].reduce((a,b)=>a+b,0);
    var sumQ = matchedSpectra[1][1].reduce((a,b)=>a+b,0);
    var proportionsP = matchedSpectra[0][1].map(inten=>inten/sumP);
    var proportionsQ = matchedSpectra[1][1].map(inten=>inten/sumQ);
    var kld = proportionsP.map((propP,i)=> propP ? propP*Math.log(propP/proportionsQ[i]) : 0).reduce((a,b)=>a+b);
    return(2-2/(1+Math.exp(-kld)));
   };

   _Spectrum._SOURCE = _SOURCE;

   return _Spectrum;

  }();

  let AminoAcidChain = function _SOURCE() {
   
   let _AminoAcidChain = function(residueData) {
    mslib.data.base.ResidueChain.call(this, residueData, mslib.constants.RESIDUES.AMINOACIDS);
    this.type = 'AminoAcidChain';
    this.notationSingular = '';
    this.notationPlural = ['α','β','γ','δ']; //Assuming 4 crosslink limit!
   };
   _AminoAcidChain.prototype = Object.create((typeof ResidueChain !== 'undefined') ? ResidueChain.prototype : mslib.data.base.ResidueChain.prototype);

   let nterm = M => mslib.moietymath.add(mslib.constants.MOIETIES.NTERM,M);
   let cterm = M => mslib.moietymath.add(M,mslib.constants.MOIETIES.CTERM);

   let products = {
    nonfragment : {
     'p'  : M => cterm(nterm(M)),
     'p*' : M => mslib.moietymath.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.AMMONIA),
     'p°' : M => mslib.moietymath.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.WATER)
    },

    immonium : R => mslib.moietymath.subtract(R,mslib.constants.MOIETIES.CO),

    ascending : {
     'a'  : M => mslib.moietymath.subtract(nterm(M),mslib.constants.MOIETIES.CHO),
     'a*' : M => mslib.moietymath.subtract(products.ascending.a(M),mslib.constants.MOIETIES.AMMONIA),
     'a°' 	: M => mslib.moietymath.subtract(products.ascending.a(M),mslib.constants.MOIETIES.WATER),

     'b'  : M => mslib.moietymath.subtract(nterm(M),mslib.constants.MOIETIES.H),
     'b*' : M => mslib.moietymath.subtract(products.ascending.b(M),mslib.constants.MOIETIES.AMMONIA),
     'b°' : M => mslib.moietymath.subtract(products.ascending.b(M),mslib.constants.MOIETIES.WATER),

     'c'  : M => mslib.moietymath.add(nterm(M),mslib.constants.MOIETIES.NH2)
    },

    descending : {
     'x'  : M => mslib.moietymath.subtract(mslib.moietymath.add(cterm(M),mslib.constants.MOIETIES.CO),mslib.constants.MOIETIES.H),

     'y'  : M => mslib.moietymath.add(cterm(M),mslib.constants.MOIETIES.H),
     'y*' : M => mslib.moietymath.subtract(products.descending.y(M),mslib.constants.MOIETIES.AMMONIA),
     'y°' : M => mslib.moietymath.subtract(products.descending.y(M),mslib.constants.MOIETIES.WATER),

     'z'  : M => mslib.moietymath.subtract(cterm(M),mslib.constants.MOIETIES.NH2)
    }
   };

   _AminoAcidChain.products = products;

   _AminoAcidChain._SOURCE = _SOURCE;

   return _AminoAcidChain;

  }();

  let MonosaccharideChain = function _SOURCE() {
   
   let _MonosaccharideChain = function(residueData) {
    mslib.data.base.ResidueChain.call(this, residueData, mslib.constants.RESIDUES.MONOSACCHARIDES);
    this.type = 'MonosaccharideChain';
    this.notationSingular = 'G';
    this.notationPlural = ['G1','G2','G3','G4','G5','G6','G7','G8'];
   };
   _MonosaccharideChain.prototype = Object.create((typeof ResidueChain !== 'undefined') ? ResidueChain.prototype : mslib.data.base.ResidueChain.prototype);

   let re = M => mslib.moietymath.add(M,mslib.constants.MOIETIES.REDUCINGEND);
   let nre = M => mslib.moietymath.add(mslib.constants.MOIETIES.NONREDUCINGEND,M);

   let products = {
    nonfragment : {
     'p'  : M => nre(re(M)),
  //   'p*' : M => mslib.moietymath.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.AMMONIA),
  //   'p°' : M => mslib.moietymath.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.WATER)
    },

  //  immonium : R => mslib.moietymath.subtract(R,mslib.constants.MOIETIES.CO),

    ascending : {
     'b'  : M => mslib.moietymath.subtract(nre(M),mslib.constants.MOIETIES.H),
  //   'b*' : M => mslib.moietymath.subtract(products.ascending.b(M),mslib.constants.MOIETIES.AMMONIA),
  //   'b°' : M => mslib.moietymath.subtract(products.ascending.b(M),mslib.constants.MOIETIES.WATER),

     'c'  : M => mslib.moietymath.add(nre(M),mslib.constants.MOIETIES.NH2)
    },

    descending : {
     'y'  : M => mslib.moietymath.add(re(M),mslib.constants.MOIETIES.H),
  //   'y*' : M => mslib.moietymath.subtract(products.descending.y(M),mslib.constants.MOIETIES.AMMONIA),
  //   'y°' : M => mslib.moietymath.subtract(products.descending.y(M),mslib.constants.MOIETIES.WATER),

     'z'  : M => mslib.moietymath.subtract(re(M),mslib.constants.MOIETIES.NH2)
    }
   };

   _MonosaccharideChain.products = products;

   _MonosaccharideChain._SOURCE = _SOURCE;

   return _MonosaccharideChain;

  }();

  let Peptide = function _SOURCE() {
   
   let _Peptide = function(data) {
   // alt call  : function(sequence, charge, modifications)

    if (typeof(data) === 'string') {
     if(arguments.length > 1 && typeof(arguments[1]) === 'number') {
      let mods = arguments.length > 2 && typeof(arguments[2]) === 'object' ? arguments[2] : mslib.constants.MODIFICATIONS;
      data = { 
       charge: arguments[1],
       chains: [
        new mslib.data.AminoAcidChain({
         sequenceString: data,
         residueDefinitions: {},
         modificationDefinitions: mods,
         fixedModifications: {},
         variableModifications: {}
        })
       ]
      };
     } else throw new Error ('missing arguments: Peptide(sequence, charge, modifications)');
    }

    this.args = data;

    if (!('charge' in data)) throw new Error ('no precursor charge');
    this.charge = +data.charge;

    if (!('chains' in data) || data.chains.length < 1) throw new Error ('no primary');
    this.chains = data.chains;

    if ('branches' in data) {
     this.branches = data.branches;
     Object.entries(data.branches).forEach(([chainIdx,positions]) => {
      Object.entries(positions).forEach(([p,branch]) => {
       let [branchChainIdx,branchChainPosition,branchNetAdjust] = branch;
       if (!(branchChainIdx in this.branches)) this.branches[branchChainIdx] = {};
       this.branches[branchChainIdx][branchChainPosition] = [+chainIdx,+p,branchNetAdjust];
      });
     });
    }
    else this.branches = {};

    if ('elements' in data) {
     this.elements = data.elements;
    }
    else this.elements = mslib.constants.ELEMENTS;

    if ('quickCalculateMzs' in data) {
     this.quickCalculateMzs = data.quickCalculateMzs;
    }
    else this.quickCalculateMzs = true;
   };

   let Accumulator = function(chainIdx,descending) {
    let acc = mslib.moietymath.blank();
    acc.chainIdx = chainIdx;
    acc.descending = descending;
    acc.nResiduesThisChain = 0;
    acc.nResiduesAllChains = 0;
    acc.nBranches = 0;
    acc.complete = false;
    return acc;
   };

   _Peptide.prototype.calculate = function() {
    return new Promise((resolve,reject) => {
     this.traversals = {};
     this.uniqueResidues = {};
     this.products = {};
     this.productIons = {};
     this.chainPrefix = new Array(this.chains.length);

     let numChainsOfType = this.chains.reduce((a,v) => { a[v.type] = (v.type in a ? a[v.type]+1 : 1); return a},{});

     for (let i = 0; i < this.chains.length; i++) {
      this.chains[i].nOfType = numChainsOfType[this.chains[i].type];
      if (this.chains[i].nOfType == 1) {
       this.chainPrefix[i] = this.chains[i].notationSingular;
      }
      else {
       let ithChainOfType = this.chains.slice(0,i+1).filter(v => v.type==this.chains[i].type).length-1;
       this.chainPrefix[i] = this.chains[i].notationPlural[ithChainOfType];
      }
      traverseChain.call(this,
                         i,0,false,true,
                         new Accumulator(i,false),JSON.parse(JSON.stringify(this.branches)));
      traverseChain.call(this,
                         i,this.chains[i].residues.length-1,true,true,
                         new Accumulator(i,true),JSON.parse(JSON.stringify(this.branches)));
     }

     Object.entries(this.traversals).forEach(([k,v]) => {
      let prefix = this.chainPrefix[v.chainIdx];
      if (v.complete) {
       Object.entries(mslib.data[this.chains[v.chainIdx].type].products.nonfragment)
       .forEach(([notation,func]) => {
        let id = `${prefix}${notation}`;
        if (id in this.products) {
         this.products[id].traversal += (';'+k);
        }
        else {
         this.products[id] = func(v);
         delete(this.products[id]).descending;
         delete(this.products[id]).unitGained;
         this.products[id].traversal = k;
         this.products[id].id = id;
         this.products[id].group = 'nonfragment';
         this.products[id].type = notation;
        }
       });
      }
      else {
       Object.entries(mslib.data[this.chains[v.chainIdx].type].products[v.descending ? 'descending' : 'ascending'])
       .forEach(([notation,func]) => {
        let id = `${prefix}${notation}${v.nResiduesThisChain}`;
        this.products[id] = func(v);
        this.products[id].traversal = k;
        this.products[id].id = id;
        this.products[id].group = 'series';
        this.products[id].type = notation;
       });
      }
     });
     Object.entries(this.uniqueResidues).forEach(([k,v]) => {
      let id = `i${k}`;
      this.products[id] = mslib.data[v.type].products.immonium(v);
      this.products[id].id = id;
      this.products[id].group = 'immonium';
      this.products[id].type = 'i';
     });

     let getTop2Mzs = this.quickCalculateMzs ?
      (v,charge) => mslib.moietymath.monoAndPlusOneMz(v,charge,this.elements) :
      (v,charge) => mslib.moietymath.topNMz(2,v,charge,this.elements);

     Object.entries(this.products).filter(([k,v]) => v.group == 'nonfragment').forEach(([k,v]) => {
      let similar = Object.values(this.products).filter(v2 => v2.type == v.type);
      if ((k == similar[0].id) && similar.every(vs => mslib.moietymath.equalComposition(vs,v))) {
       this.productIons[`${v.type}${'+'.repeat(this.charge)}`] = {
        mzs: getTop2Mzs(v,this.charge),
        charge: this.charge,
        products: similar
       };
      }
      else {
       this.productIons[`${k}${'+'.repeat(this.charge)}`] = {
        mzs: getTop2Mzs(v,this.charge),
        charge: this.charge,
        products: [v]
       };
      }
     });

     Object.entries(this.products).filter(([k,v]) => v.group == 'series').forEach(([k,v]) => {
      this.productIons[`${k}+`] = {
       mzs: getTop2Mzs(v,1),
       charge: 1,
       products: [v]
      };
      this.productIons[`${k}++`] = {
       mzs: getTop2Mzs(v,2),
       charge: 2,
       products: [v]
      };
     });

     Object.entries(this.products).filter(([k,v]) => v.group == 'immonium').forEach(([k,v]) => {
      this.productIons[`${k}+`] = {
       mzs: getTop2Mzs(v,1),
       charge: 1,
       products: [v]
      };
     });
    });

   };

   let traverseChain = function(chainIdx,position,descending,storeTraversal,chainAccumulator,branchesToDo) {

    let residue = this.chains[chainIdx].residues[position];
    let unit = { atoms: residue.atoms, symbol: { text: residue.token} }; 

    let unitHasBranch = false;

    if ((chainIdx in branchesToDo) && (position in branchesToDo[chainIdx])) {
     let [branchChainIdx,branchChainPosition,branchNetAdjust] = branchesToDo[chainIdx][position];
     if (typeof(branchNetAdjust) != 'object'
         || !('atoms' in branchNetAdjust) 
        ) {
      console.log('Not following');
      //Do not follow branches of unknown type (or include branch residue)
      return(chainAccumulator);
     }
     delete(branchesToDo[chainIdx][position]);
     delete(branchesToDo[branchChainIdx][branchChainPosition]);
     let branchAccumulatorAsc = new Accumulator(branchChainIdx,false);
     let branch = mslib.data[this.chains[branchChainIdx].type].products.nonfragment.p(traverseChain.call(this,branchChainIdx,0,false,false,branchAccumulatorAsc,branchesToDo));
     unit = mslib.moietymath.add(unit, { atoms:branch.atoms, nResiduesAllChains: branch.nResiduesAllChains, symbol:{ text:`(${branch.symbol.text})`} });
     unitHasBranch = true;
     if (typeof(branchNetAdjust) == 'object' && 'atoms' in branchNetAdjust) {
      unit = mslib.moietymath.add(unit, branchNetAdjust);
     }
    }
    else {
     //Assume no immonium ion if a branch node
     if (!(residue.token in this.uniqueResidues)) {
      this.uniqueResidues[residue.token] = residue;
      this.uniqueResidues[residue.token].type = this.chains[chainIdx].type;
     }
    }

    if (descending) chainAccumulator = mslib.moietymath.add(unit,chainAccumulator);
    else chainAccumulator = mslib.moietymath.add(chainAccumulator,unit);
    chainAccumulator.nResiduesThisChain++;
    chainAccumulator.nResiduesAllChains++;
    chainAccumulator.unitGained = unit;
    if (unitHasBranch) {
     chainAccumulator.nBranches++;
     chainAccumulator.nResiduesAllChains+=unit.nResiduesAllChains;
    }
    
    if (storeTraversal) {
     if ((descending && position == 0) || (!descending && position == this.chains[chainIdx].residues.length-1)) {
      chainAccumulator.complete = true;
     }
     let key = (descending ? '←' : '→')+chainIdx+'_'+position+'_'+residue.token+'['+chainAccumulator.nResiduesThisChain+']'+'¥'.repeat(chainAccumulator.nBranches);
     if (!(key in this.traversals)) {
      this.traversals[key] = chainAccumulator;
      this.traversals[key].traversal = key;
     }
    }

    if (descending) {
     if (position > 0) {
      return(traverseChain.call(this,chainIdx,position-1,true,storeTraversal,chainAccumulator,branchesToDo));
     }
    }
    else {
     if (position < (this.chains[chainIdx].residues.length-1)) {
      return(traverseChain.call(this,chainIdx,position+1,false,storeTraversal,chainAccumulator,branchesToDo));
     }
    }
  //  console.log('endchain');
    return(chainAccumulator);
   };

   _Peptide.prototype.toJSON = function() {
    return this.args;
   };

   _Peptide._SOURCE = _SOURCE;
   return _Peptide;
  }();

  let Distribution = function _SOURCE() {

   const FRACTION_LIMIT = 0.000001;

   let _Distribution = function(values) {
    // console.log(values);
    if (!(typeof(values) == "object" && 
       Array.isArray(values) && 
       values.length > 0 &&
       values.every(entry => 
        entry.length==2 &&
        typeof(entry[0]) == "number" &&
        typeof(entry[1]) == "number"
       ) 
    )) throw new Error('DistributionInvalidArgument');
    this.values = values;
   };

   _Distribution.prototype.normalise = function() {
    let totalAbundance = 0;
    for (let i = 0; i < this.values.length; i++) totalAbundance += this.values[i][1];
    return new _Distribution(this.values.map(entry => [entry[0],entry[1]/totalAbundance]));
   };

   const DPRE = /\d*$/;
   
   _Distribution.prototype.convolute = function(dist) {
    if ((typeof(dist) != "object") || (dist.constructor !== Distribution)) throw new Error('DistributionCanOnlyConvoluteWithDistribution');
    let convolutionResult = Array.prototype.concat.apply([],
     this.values.map((i) => dist.values.map((j) => [i[0]+j[0],i[1]*j[1]]))
    );
    // console.log(convolutionResult);
    let newValues = {};
    for (let i = 0; i < convolutionResult.length; i++){
     let resultKey = convolutionResult[i][0];
     let resultKeyDigits = DPRE.exec(resultKey)[0].length-1;
     let match;
     
     if (match = Object.keys(newValues)
                    .find(key => {
                      let n = Math.min(resultKeyDigits,DPRE.exec(key)[0].length-1);
                      return (+key).toFixed(n) == resultKey.toFixed(n)
                    })) {
      newValues[match] += convolutionResult[i][1];
     }
     else {
      newValues[convolutionResult[i][0]] = convolutionResult[i][1];
     }
    }
    // console.log(newValues);
    return new _Distribution(Object.entries(newValues)
                             .map(e => [+e[0],e[1]]) //Ensure numeric
                             .filter(e => (e[1] > FRACTION_LIMIT))
                             .sort((a,b) => (a[0]-b[0])));
   };

   _Distribution.prototype.overZ = function(z) {
    return new _Distribution(this.values.map(e => [e[0]/z,e[1]]));
   };

   _Distribution.prototype.asSpectrum = function() {
    return new mslib.data.Spectrum(this.values.map(e => e[0]),this.values.map(e => e[1]));
   };

   _Distribution.prototype.centroid = function() {
    let weightedMeanMass = 0;
    let totalAbundance = 0;
    let weights = this.normalise().values;
    for (let i = 0; i < this.values.length; i++){
     weightedMeanMass += (this.values[i][0]*weights[i][1]);
     totalAbundance += this.values[i][1];
    }
    return new _Distribution([[weightedMeanMass,totalAbundance]]);
   };

   _Distribution.prototype.centroidToMaximas = function(ppmGap) {
    let maxGapRatio = (ppmGap / 1e6);

    // Find maxima
    let isMax = mslib.math.maxima(this.values.map(value => value[1]),true);
    let nIsMax = 0;
    var maxima = [];
     
    // Add any peaks separated from all others by more than maxGap as maxima
    for (let i = 0; i < this.values.length; i++) {
     if (
         (
          (i == 0) || 
          (((this.values[i][0] - this.values[i-1][0])/this.values[i][0]) > maxGapRatio) ||
          (this.values[i][1] > this.values[i-1][1])
         ) && (
          (i == (this.values.length-1)) || 
          (((this.values[i+1][0] - this.values[i][0])/this.values[i][0]) > maxGapRatio) || 
          (this.values[i][1] > this.values[i+1][1])
         )
        ) {
      isMax[i] = true;
      nIsMax += 1;
      maxima.push(i);
     }
    }

    maxima.sort((a,b) => a-b);

  //  console.log(isMax.map(m => (m ? 1 : 0)));
    
    // Early finish if only one maxima
    if (nIsMax == 1) {
     return this.centroid();
    }

    // Then group to closest maxima
    var groups = [[]];

   // console.log(maxima.map(i => this.values[i]));

    for (let i = 0; i < this.values.length; i++) {
     if (i < maxima[0]) {
      groups[0].push(this.values[i]);
     }
     else if (i > maxima[maxima.length-1]) {
      groups[maxima.length-1].push(this.values[i]);
     }
     else if (isMax[i]) {
      groups[groups.length-1].push(this.values[i]);
      if (groups.length < maxima.length) groups.push([]);
     }
     else {
      groups[groups.length-1-((this.values[i][0]-this.values[maxima[groups.length-2]][0]) <= (this.values[maxima[groups.length-1]][0]-this.values[i][0]))].push(this.values[i]);
     }
    }

   // console.log(groups);

    let centroidedGroups = groups.map((g) => new mslib.data.Distribution(g).centroid().values[0]);
    let previousLength;

   // console.log(centroidedGroups);
   
    //Then, group maxima closer than ppmGap

    // console.log(maxGapRatio);
    do {
     let groupedCentroidedGroups = [[centroidedGroups[0]]];
     for (let i = 1; i < centroidedGroups.length; i++) {
      if ((centroidedGroups[i][0] - centroidedGroups[i-1][0])/centroidedGroups[i][0] <= maxGapRatio) {
       // console.log((centroidedGroups[i][0] - centroidedGroups[i-1][0])/centroidedGroups[i][0]);
       groupedCentroidedGroups[groupedCentroidedGroups.length-1].push(centroidedGroups[i]);
      }
      else {
       groupedCentroidedGroups.push([centroidedGroups[i]]);
      }
     }
     previousLength = centroidedGroups.length;
     // console.log(centroidedGroups);
     // console.log(groupedCentroidedGroups);
     centroidedGroups = groupedCentroidedGroups.map((g) => new mslib.data.Distribution(g).centroid().values[0]);
    } while (centroidedGroups.length < previousLength);

    //Finally, remove any peaks representing less than FRACTION_LIMIT total intensity
    return new mslib.data.Distribution(centroidedGroups.filter(i => i[1] > FRACTION_LIMIT));
   };

   _Distribution._SOURCE = _SOURCE;

   return _Distribution;
  }();

  var _index$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    base: _index$1,
    Chromatogram: Chromatogram,
    Scan: Scan,
    Spectrum: Spectrum,
    AminoAcidChain: AminoAcidChain,
    MonosaccharideChain: MonosaccharideChain,
    Peptide: Peptide,
    Distribution: Distribution
  });

  let MsDataFile = function _SOURCE() {

   let _MsDataFile = function(file) {
    if (file) {
     this.reader     = new mslib.common.Reader(file,this);
    }
    else {
     this.reader     = null;
    }
    mslib.common.initialise(this);
    this.fileType    = null;
    this.scans       = [];
    this.internal    = { offsets : {}, minutes : [], firstScan : null, lastScan : null };
    this.currentScanNumber = null;
    this.currentScanSpectrum = null;
   };

   _MsDataFile.prototype.setCurrentScanNumber = function(sNum) {
    if (this.currentScanNumber != sNum) {
     this.currentScanSpectrum = null;
     if (this.scans[sNum]) this.currentScanNumber = sNum;
    }
   };

   _MsDataFile.prototype.getFirstScanNumber = function() {
    if (this.internal.firstScan) return this.internal.firstScan;
    if (!this.scans.length) throw new Error("MsDataFileNoScans");
    let s = this.scans.findIndex((scan) => (typeof(scan) != 'undefined'));
    s = (s >= 0 ? s : null);
    return this.internal.firstScan = s;
   };
   
   _MsDataFile.prototype.getLastScanNumber = function() {
    if (this.internal.lastScan) return this.internal.lastScan;
    if (!this.scans.length) throw new Error("MsDataFileNoScans");
    let s = (this.scans.length-1) - [...this.scans].reverse().findIndex((scan) => (typeof(scan) != 'undefined'));
    s = (s >= 0 ? s : null);
    return this.internal.lastScan = s;
   };
   
   _MsDataFile.prototype.getPreviousScanNumber = function(sNum,msLevel) {
    if (!this.scans.length) throw new Error("MsDataFileNoScans");
    if ((typeof(sNum) === 'undefined')) sNum = this.currentScanNumber;
    let firstScan = this.getFirstScanNumber();
    if (!firstScan || (sNum <= firstScan)) return null;
    if ((typeof(msLevel) === 'undefined') || isNaN(msLevel) || !Number.isInteger(msLevel) || (msLevel < 1)) {
     if (this.scans[sNum]) return(this.scans[sNum].previous || null);
     else return(null);
    }
    else {
     do { sNum = this.getPreviousScanNumber(sNum); } while ((this.scans[sNum].msLevel != msLevel) && (sNum > firstScan));
     if (this.scans[sNum].msLevel == msLevel) return(sNum);
     else return(null);
    }
   };
   
   _MsDataFile.prototype.getNextScanNumber = function(sNum,msLevel) {
    if (!this.scans.length) throw new Error("MsDataFileNoScans");
    if ((typeof(s) === 'undefined')) sNum =  this.currentScanNumber;
    let lastScan = this.getLastScanNumber();
    if (!lastScan || sNum >= lastScan) return(null);
    if ((typeof(msLevel) === 'undefined') || isNaN(msLevel) || !Number.isInteger(msLevel) || (msLevel < 1)) {
     if (this.scans[sNum]) return(this.scans[sNum].next || null);
     else return(null);
    }
    else {
     do { sNum = this.getNextScanNumber(sNum); } while ((this.scans[sNum].msLevel != msLevel) && (sNum < lastScan));
     if (this.scans[sNum].msLevel == msLevel) return(sNum);
     else return(null);
    }
   };

   let populateMinutes = function() {
    this.scans.forEach(function(scan,sNum) {
     if (scan.msLevel) {
      let minute = Math.round(scan.retentionTime);
      if (!this.internal.minutes[minute]) {
       this.internal.minutes[minute] = [];
      }
      this.internal.minutes[minute].push(sNum);
     }
    },this);
   };

   _MsDataFile.prototype.getAllMSXScans = function(msLevel) {
    return this.scans.reduce((acc,scan,i) => { if (scan.msLevel == msLevel) acc.push(i); return acc },[])
   };

   _MsDataFile.prototype.getNearestMSXScanNumberfromRT = function(msLevel,retentionTime,matchLow) {
    if (!this.scans.length) throw new Error("MsDataFileNoScans");
    if (!this.internal.minutes.length) populateMinutes.call(this);
  //  let S = this.scans; // can't use thisArg in sorts
    let ms1ScanNumbers = this.scans.getAllMSXScans(1);
    let firstMSXRT = this.scans[ms1ScanNumbers[0]].retentionTime;
    let lastMSXRT = this.scans[ms1ScanNumbers[ms1ScanNumbers.length-1]].retentionTime;
    if (retentionTime <= firstMSXRT) { return ms1ScanNumbers[0] }  if (retentionTime >= lastMSXRT) { return ms1ScanNumbers[ms1ScanNumbers.length-1] }  let minute = Math.round(retentionTime);
    if (!this.internal.minutes[minute]) {
     console.log("Cannot localise RT "+retentionTime);
     throw new Error("MsDataFileCannotLocaliseRT");
    }
    let possibles = this.internal.minutes[minute].filter((p) => (this.scans[p].msLevel == msLevel));
    //check for exact match
    let exactMatch = possibles.find((p) => (this.scans[p].retentionTime == retentionTime));
    if (exactMatch) { return exactMatch }
    else {
     //Otherwise find closest match
     let firstRTMinute = Math.round(firstMSXRT);
     let lastRTMinute = Math.round(lastMSXRT);
     let range = 0;
     do {
      range++;
      let minuteToAdd = minute + (matchLow ? -range : range);
      if ((minuteToAdd < firstRTMinute) || (minuteToAdd > lastRTMinute)) {
       return null;
      }
      possibles = possibles.concat(this.internal.minutes[minuteToAdd].filter((p) => (this.scans[p].msLevel == msLevel)) || []);
     } while (possibles.length < 1);
     let m;
     if (matchLow) {
      possibles.sort((a,b) => (this.scans[b].retentionTime-this.scans[a].retentionTime));
      m = possibles.find((p) => (this.scans[p].retentionTime < retentionTime));
     }
     else {
      possibles.sort((a,b) => (this.scans[a].retentionTime-this.scans[b].retentionTime));
      m = possibles.find((p) => (this.scans[p].retentionTime > retentionTime));
     }
     return typeof(m) != "undefined" ? m : null;
    }
   };

   _MsDataFile.prototype.getNearestMSXRTfromRT = function(msLevel,retentionTime,matchLow) {
    if (!this.scans.length) throw new Error("MsDataFileNoScans");
    let sNum = this.getNearestMSXScanNumberfromRT(msLevel,retentionTime,matchLow);
    return(sNum != null ? this.scans[sNum].retentionTime : null);
   };
   
   _MsDataFile.prototype.getNearestMSXScanNumberfromScanNumber = function(msLevel,sNum,matchLow) {
    if (!this.scans.length) throw new Error("MsDataFileNoScans");
    let firstScan = this.getFirstScanNumber();
    if (!this.scans[sNum]) { //e.g. Might be an MS2+ and the mzFile only has MS1
     while(--sNum >= firstScan) { if (this.scans[sNum]) break }  }  if (!this.scans[sNum]) return(null); //Still couldn't find the scan
    if (this.scans[sNum].msLevel == msLevel) return(sNum);
    if (matchLow) return(this.getPreviousScanNumber(sNum,msLevel));
    else return(this.getNextScanNumber(sNum,msLevel));
   };

   _MsDataFile.prototype.getNearestMSXRTfromScanNumber = function(msLevel,sNum,matchLow) {
    if (!this.scans.length) throw new Error("MsDataFileNoScans");
    sNum = this.getNearestMSXScanNumberfromScanNumber(msLevel,sNum,matchLow);
    return(sNum != null ? this.scans[sNum].retentionTime : null);
   };

   //Async PlaceHolders

   _MsDataFile.prototype.fetchScanOffsets = function(prefetchScanHeaders) {
    return new Promise((resolve,reject) => reject(new Error("MsDataFileFunctionNotImplemented")));
   };

   _MsDataFile.prototype.fetchScanHeader = function(scan,prefetchSpectrumData) {
    return new Promise((resolve,reject) => reject(new Error("MsDataFileFunctionNotImplemented")));
   };

   _MsDataFile.prototype.fetchAllScanHeaders = function() {
    return new Promise((resolve,reject) => reject(new Error("MsDataFileFunctionNotImplemented")));
   };

   _MsDataFile.prototype.fetchSpectrum = function() {
    return new Promise((resolve,reject) => reject(new Error("MsDataFileFunctionNotImplemented")));
   };

   _MsDataFile._SOURCE = _SOURCE;

   return _MsDataFile;

  }();

  //export { SqliteFile } from "./SqliteFile.js";

  var _index$3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    MsDataFile: MsDataFile
  });

  let FastaFile = function _SOURCE() {

   var _FastaFile = function(f) {
    this.reader            = new mslib.common.Reader(f,this);
    mslib.common.initialise(this);
    this.fileType               = "fasta";
    this.accessionParse         = new RegExp(/>(\S+)/);
    this.descriptionParse       = new RegExp(/\s(.+)$/);
    this.entries = {};
   };
   
   _FastaFile.prototype.setParseRules = function(a,d) {
    this.accessionParse         = new RegExp(a);
    this.descriptionParse       = new RegExp(d);
   };

   _FastaFile.prototype.load = function() {
    if (!(this.accessionParse && this.descriptionParse)) return ("FastaFileNoParseRules");
    mslib.common.start(this);
    this.reader.readText(
     function() {
      var text = this.result.replace(/\r\n?/gm,"\n");
      text = text.replace(/^>/gm,"__START__");
      var entries = text.split("__START__");
      entries.forEach(function(entry,i) {
       mslib.common.progress(this.parent,((i/entries.length)*100).toFixed(2));
       if (entry.length) {
        var firstNewLine = entry.indexOf("\n");
        var entryheader = ">"+entry.substr(0,firstNewLine);
        var entryacc = this.parent.accessionParse.exec(entryheader)[1];
        var entrydesc = this.parent.descriptionParse.exec(entryheader)[1];
        if (!entryacc || !entrydesc) {
         console.log("Failed to parse "+entryheader);
         return;
        }
        var entrybody = entry.substr(firstNewLine);
        entrybody = entrybody.replace(/\n/gm,"");
        this.parent.entries[entryacc]=[entrydesc,entrybody];
       }
      },this);
      mslib.common.finish(this.parent);
     }
    );
   };

   _FastaFile._SOURCE = _SOURCE;

   return _FastaFile;

  }();

  let MgfFile = function _SOURCE() {

   var _MgfFile = function(f) {
    mslib.format.MsDataFile.call(this, f);
    this.reader.onprogress      = function(data) {
     if (data.lengthComputable) {                                            
      mslib.common.progress(this,parseInt(((data.loaded/data.total)*100).toFixed(2)));
     }
    };
    this.fileType               = "mgf";
   };

   var headerParse = /^([^=]+)=(.+)$/;
   var pepmassParse = /^(\S+)(?:\s+(\S+))?/;
   var chargeParse = /^(\d+)\+?/;
   var mzIntPairParse = /^(\S+)\s+(\S+)$/;

   _MgfFile.prototype.load = function() {
    mslib.common.start(this);
    this.Reader.readText(
     function() {
      var text = this.result.replace(/\r\n?/gm,"\n");
      var entries = text.split("END IONS");
      while (entries[entries.length-1].match(/^\s*$/)) entries.pop(); // remove trailing blank lines
      var previousScan = null;
      entries.forEach(function(entry,i) {
       var mgfEntryLines = entry.substr(entry.indexOf("BEGIN IONS")+10).split("\n");
       var headers = {};
       var startIndex = 0;
       for (var j = startIndex; j < mgfEntryLines.length; j++) {
        if (!mgfEntryLines[j].length) continue;
        if (mgfEntryLines[j].includes('=')) {
         startIndex = j;
         break;
        }
        var hdr = headerParse.exec(mgfEntryLines[j]);
        if (hdr) {
         headers[hdr[1]] = hdr[2];
        }
        else {
         console.log(mgfEntryLines[j]);
        }
       }
       if (headers.TITLE && ("PEPMASS" in headers)) {
        var mzs = [];
        var ints = [];
        for (var j = startIndex; j < mgfEntryLines.length; j++) {
         if (!mgfEntryLines[j].length) continue;
         var mzIntPair = mzIntPairParse.exec(mgfEntryLines[j]);
         if (mzIntPair) {
          mzs.push(+mzIntPair[1]);
          ints.push(+mzIntPair[2]);
         }
         else {
          console.log(mgfEntryLines[j]);
         }
        }
        var scan = new mslib.data.Scan();
        scan.scanNumber = i;
        var pmMatch = pepmassParse.exec(headers.PEPMASS);
        if (pmMatch[1]) {
         scan.precursorMzs = [+pmMatch[1]];
         if (pmMatch[2]) {
          scan.precursorIntensities = [+pmMatch[2]];
         }
         if (headers.CHARGE) {
          scan.precursorCharges = [+chargeParse.exec(headers.CHARGE)[1]];
         }
         if (headers.RTINSECONDS) {
          scan.retentionTime = [headers.RTINSECONDS/60];
         }
         scan.spectrum = new mslib.data.Spectrum(mzs, ints);
         scan.basePeakMz = scan.spectrum.getBasePeakMz();
         scan.basePeakIntensity = scan.spectrum.getBasePeakIntensity(); 
         scan.totalCurrent = scan.spectrum.getTotalIntensity();
         scan.internal.headers = headers;
         this.Parent.scans[i] = {};
         this.Parent.scans[i].scanData = scan.toArray(true);
         this.Parent.scans[i].length = entry.length;
         if (previousScan) {
          this.Parent.scans[previousScan].next = i;
          this.Parent.scans[i].previous = previousScan;
         }
         previousScan = scan.scanNumber;
        }
        else {
         console.log("Failed to parse Precursor mass from PEPMASS in "+i+":"+entry);
        }
       }
       else {
        console.log("Failed to parse TITLE and PEPMASS from entry "+i+":"+entry);
       }
      },this);
      mslib.common.finish(this.Parent);
     }
    );
   };

   _MgfFile.prototype.export = function() {
    var out = "";
    this.scans.forEach(function(s) {
     var scan = new mslib.Scan(s.scanData);
     out += "BEGIN IONS\n";
     out += ("TITLE=" + scan.internal.headers.TITLE + "\n");
     out += ("PEPMASS=" + scan.precursorMzs[0]);
     if (scan.precursorIntensities.length) out += (" " + scan.precursorIntensities[0]);
     out += "\n";
     Object.keys(scan.internal.headers).forEach(function(key) {
      if ((key != "TITLE") && (key != "PEPMASS")) {
       out += (key + "=" + scan.internal.headers[key])+"\n";
      }
     });
     scan.spectrum.mzs.forEach(function(mz,i) {
      out += (mz + " " + scan.spectrum.ints[i] + "\n");
     });
     out += "END IONS\n";  
    });
    return out;
   };

   _MgfFile._SOURCE = _SOURCE;

   return _MgfFile;

  }();

  let MzFile = function _SOURCE() {

   //try to optimise buffer size in bytes for various tasks
   //for indexoffset and header, want to grab entire header in one read most of the time, but not too much of the spectrum
   //however if offsets are not indexed, need to slurp huge chucks of the file and locate scan tags by regex
   //for spectrum (if can't calculate length), want to grab a large chunk but not too large or inefficient for the very numerous low-data spectra

   const INDEXOFFSET_SLICE_SIZE = 1000;
   const UNINDEXED_OFFSET_SLICE_SIZE = 5000000;

   const CID = 1;
   const HCD = 2;
   const ETD = 3;
   const PQD = 4;
   const ZLIB = 1;
   const NO_COMPRESSION = 0;
   const MZ_INT = true;
   const INT_MZ = false;
   const MZ = true;
   const INT = false;
   
   let _MzFile = function(f) {
    mslib.format.base.MsDataFile.call(this, f);
    if (f) {
     if (f.name.match(/\.mzML$/i)) {
      this.fileType = "mzML";
     }
     else if (f.name.match(/\.mzXML$/i)) {
      this.fileType = "mzXML";
     }
     else {
      throw new Error("MzFileInvalidFileType");
     }
    }
   };
   _MzFile.prototype = Object.create((typeof MsDataFile !== 'undefined') ? MsDataFile.prototype : mslib.format.base.MsDataFile.prototype);

   //------------------------------------------------------------------------------
   //MzFile ASync methods
   //------------------------------------------------------------------------------

   _MzFile.prototype.fetchScanOffsets = function(prefetchingScanHeaders) {
    return new Promise((resolve,reject) => {
     if (!this.ready) reject(new Error("MzFileNotReady"));
     else {
      mslib.common.start(this);
      this.resolve = resolve;
      fetchScanOffsetsInternal.call(this);
     }
    });
   };

   let fetchScanOffsetsInternal = function(prefetchingScanHeaders) {
    this.scans = [];
    this.reader.readText(
     this.reader.file.size-INDEXOFFSET_SLICE_SIZE
    ).then((r) => processScanOffsetStart.call(this,r,prefetchingScanHeaders));
   };

   _MzFile.prototype.fetchScanHeader = function(sNum,prefetchingSpectralData) {
    return new Promise((resolve,reject) => {
     if (!this.ready) reject(new Error("MzFileNotReady"));
     else if (!this.scans.length) reject(new Error("MzFileNoScanOffsets"));
     else {
      if (!sNum && this.currentScanNumber) sNum = this.currentScanNumber;
      if (!this.scans[sNum]) reject(new Error("MzFileScanUnknown"));
      else {
       mslib.common.start(this);
       this.resolve = resolve;
       fetchScanHeaderInternal.call(this,sNum,false,prefetchingSpectralData);
      }
     }
    });
   };

   let fetchScanHeaderInternal = function(sNum,prefetchingScanHeaders,prefetchingSpectralData) {
    this.setCurrentScanNumber(sNum);
    if (this.scans[sNum].headerParsed) {
     if (prefetchingScanHeaders) fetchNextScanHeaderInternal.call(this,sNum);
     else if (prefetchingSpectralData) fetchSpectrumInternal.call(this);
     else { 
      mslib.common.finish(this);
      this.resolve();
     }
    }
    else {
     let nextScanNumber = this.getNextScanNumber(sNum);
     this.reader.readText(
      this.scans[sNum].offset,
      (nextScanNumber ? this.scans[nextScanNumber].offset : this.internal.offsets.scanListEnd) - this.scans[sNum].offset,
     ).then((r) => processScanHeader.call(this,r,prefetchingScanHeaders,prefetchingSpectralData));
    } 
   };

   let fetchNextScanHeaderInternal = function(sNum) {
    let nextScanNumber = this.getNextScanNumber(sNum);
    if (nextScanNumber) {
     mslib.common.progress(this,(sNum/this.getLastScanNumber())*100);
     fetchScanHeaderInternal.call(this,nextScanNumber,true);
    }
    else {
     mslib.common.finish(this);
     this.resolve();
    }
   };

   _MzFile.prototype.fetchAllScanHeaders = function() {
    return new Promise((resolve,reject) => {
     if (!this.ready) reject(new Error("MzFileNotReady")); 
     else {
      mslib.common.start(this);
      this.resolve = resolve;
      fetchAllScanHeadersInternal.call(this);
     }
    });
   };

   let fetchAllScanHeadersInternal = function() {
    if (!this.scans.length) fetchScanOffsetsInternal.call(this,true);
    else fetchScanHeaderInternal.call(this,this.getFirstScanNumber(),true);
   };
   
   _MzFile.prototype.fetchSpectrum = function(sNum) {
    if (typeof(sNum) !== 'undefined') return this.fetchScanHeader(sNum,true)
    else return new Promise((resolve,reject) => {
     if (!this.ready) reject(new Error("MzFileNotReady"));
     else if (!this.scans.length) reject(new Error("MzFileNoScanOffsets"));
     else if (!this.scans[this.currentScanNumber]) reject(new Error("MzFileScanUnknown"));
     else {
      mslib.common.start(this);
      this.resolve = resolve;
      fetchSpectrumInternal.call(this);
     }
    });
   };

   let fetchSpectrumInternal = function() {
    this.currentScanSpectrum = null;
    this.internal.textBuffer = "";
    let nextScanNumber = this.getNextScanNumber(this.currentScanNumber);
    this.reader.readText(
     this.scans[this.currentScanNumber].internal.binaryDataOffset[0],
     (nextScanNumber ? this.scans[nextScanNumber].offset : this.internal.offsets.scanListEnd) - this.scans[this.currentScanNumber].internal.binaryDataOffset[0],
    ).then((r) => processSpectrum.call(this,r));
   };

   //Post-read callback functions

   let processScanOffsetStart = function(result,prefetchingScanHeaders) {
    let regexmatch = regex[this.fileType].index.exec(result);
    this.internal.previousScanNumber = null;
    if (regexmatch) {
     this.internal.offsets.scanListEnd = +regexmatch[1] - 1;
     this.reader.readText(+regexmatch[1]).then((r) => processScanOffsetList.call(this,r,prefetchingScanHeaders));
    }
    else {
     if (this.fileType == "mzXML") {
      console.log("Warning: Index offset is undefined - will parse scan offsets line-by-line");
      this.internal.offsets.scanListEnd = this.reader.file.size;
      this.internal.textBuffer = "";
      this.reader.readText(0,UNINDEXED_OFFSET_SLICE_SIZE).then((r) => processUnindexedScanOffsets.call(this,r,prefetchingScanHeaders,null));
     }
     else throw new Error("MzFileCannotParseIndexOffset");
    }
   };

   let processScanOffsetList = function(result,prefetchingScanHeaders) {
    mslib.common.performTask(['mslib.format.MzFile.parsers.scanOffsetList',result,regex[this.fileType].scanOffsetList,this.scans])
    .then((r) => {
     this.scans = r;
     if (prefetchingScanHeaders) fetchAllScanHeadersInternal.call(this);
     else {
      mslib.common.finish(this);
      this.resolve();
     }
    });
   };

   let processUnindexedScanOffsets = function(result,prefetchingScanHeaders,prevScanNumber) {
    mslib.common.performTask(['mslib.format.MzFile.parsers.unindexedScanOffsets',this.internal.textBuffer,result,this.reader.position,regex['mzXML'].scanNumber,this.scans,this.internal.prevScanNumber])
    .then((r) => {
     this.scans = r.scans;
     this.reader.position = r.position;
     if (r.isIncomplete) {
      this.internal.textBuffer = r.remaining;
      this.internal.prevScanNumber = r.prevScanNumber;
      this.reader.readText(
       this.reader.position,
       UNINDEXED_OFFSET_SLICE_SIZE
      ).then((r) => processUnindexedScanOffsets.call(this,r,prevScanNumber));
     }
     else {
      if (prefetchingScanHeaders) fetchAllScanHeadersInternal.call(this);
      else {
       mslib.common.finish(this);
       this.resolve();
      }
     }
    });
   };

   let processScanHeader = function(result,prefetchingScanHeaders,prefetchingSpectralData) {
    this.scans[this.currentScanNumber].internal.compressionType      = [];
    this.scans[this.currentScanNumber].internal.binaryDataPrecision  = [];
    if (this.fileType == "mzML") this.scans[this.currentScanNumber].internal.binaryDataLength = [];
    this.scans[this.currentScanNumber].internal.binaryDataOffset     = [];
    this.scans[this.currentScanNumber].internal.binaryDataOrder      = [];
    mslib.common.performTask(['mslib.format.MzFile.parsers.scanHeader',result,this.reader.position,regex[this.fileType],this.scans[this.currentScanNumber],this.fileType])
    .then((r) => {
     this.scans[this.currentScanNumber] = r;
     this.scans[this.currentScanNumber].headerParsed = true;
     if (prefetchingScanHeaders) fetchNextScanHeaderInternal.call(this,this.currentScanNumber);
     else if (prefetchingSpectralData) fetchSpectrumInternal.call(this);
     else {
      mslib.common.finish(this);
      this.resolve();
     }
    });
   };

   let processSpectrum = function(result) {
    mslib.common.performTask(['mslib.format.MzFile.parsers.spectrum',result,this.scans[this.currentScanNumber],this.fileType])
    .then((r) => {
     this.currentScanSpectrum = new mslib.data.Spectrum(...r);
     mslib.common.finish(this);
     this.resolve();
    });
   };

   let linkPrevious = function(scans,scanNumber,prevScanNumber) {
    if (prevScanNumber) {
     if (scans[scanNumber].offset < scans[prevScanNumber].offset) throw new Error("MzFileInvalidUnindexedOffset");
     scans[prevScanNumber].bytes = scans[scanNumber].offset - scans[prevScanNumber].offset;
     scans[prevScanNumber].next = scanNumber;
     scans[scanNumber].previous = prevScanNumber;
    }
   };

   _MzFile.parsers = {};

   _MzFile.parsers.scanOffsetList = function(data,scanOffsetRegex,scans) {
    let prevScanNumber = null;
    let endOffsetIndex = data.lastIndexOf("</offset>");
    if (endOffsetIndex != -1) {
     let offsets = data.substr(0,endOffsetIndex).split("</offset>");
     for (let i = 0; i < offsets.length; i++) {
      let regexMatch = scanOffsetRegex.exec(offsets[i]);
      if (regexMatch) {
       let scanNumber = +regexMatch[1];
       scans[scanNumber] = new mslib.data.Scan();
       scans[scanNumber].offset = +regexMatch[2];
       linkPrevious(scans,scanNumber,prevScanNumber);
       prevScanNumber = scanNumber;
      }
     }          
    }
    else {
     throw new Error("MzFileCannotParseIndexOffsetEntries");
    }
    return scans;
   };


   _MzFile.parsers.unindexedScanOffsets = function(buffer,newText,position,scanNumberRegex,scans,prevScanNumber) {
    let data = buffer + newText;
    let dataOffset = position - data.length;
    let regexMatch;
    while ((regexMatch = scanNumberRegex.exec(data)) !== null) {
     let scanNumber = +regexmatch[1];
     if (scanNumber in scans) throw new Error("MzFileNonUniqueScanNumber");
     scans[scanNumber] = new mslib.data.Scan();
     scans[scanNumber].offset = dataOffset + scanNumberRegex.lastIndex - regexMatch[0].length;
     linkPrevious(scans,scanNumber,prevScanNumber);
     prevScanNumber = scanNumber;
    }
    if (data.match(/<\/mzXML>/)) {
     scans[scanNumber].bytes = data.length-8; //ensure last scan also has a length property
     return { isIncomplete : false, scans : scans };
    }
    else {
     data = data.substr(scanNumberRegex.lastIndex);
     return { isIncomplete : true, scans : scans, remaining : data, prevScanNumber : prevScanNumber};
    } 
   };

   _MzFile.parsers.scanHeader = function(data,position,regex,scan,fileType) {
    let endEleIndex = data.lastIndexOf(">") + 1;
    let eles = data.substr(0,endEleIndex).split(">").slice(0,-1);
    for (let i = 0; i < eles.length; i++) {
     if ((fileType == "mzML" && /<\/spectrum$/.exec(eles[i])) ||
         (fileType == "mzXML" && /<\/scan$/.exec(eles[i]))) {
      if (i < eles.length-1) console.log('MzFileWarning:ReadOvershoot');
      break;
     }
     else if (fileType == "mzML" && /<binary$/.exec(eles[i])) {
      if (scan.internal.binaryDataListCount != 2) {
       throw new Error("MzFileInvalidNumberOfBinaryDataArrays");
      }
      //current binary element offset is start position of the data + length of this and all previous eles + i + 1(correct for missing >)
      scan.internal.binaryDataOffset.push(position - data.length + eles.slice(0,i+1).join("").length + i + 1);
      if (scan.internal.binaryDataOffset.length > 2) throw new Error("MzFileMzMLMoreThanTwoBinaryDataArrays");
      i+=1;
     }
     else regex.scanKeys.forEach(key => {
      let regexmatch = regex.scan[key].exec(eles[i].replace(/\n|\r/gm,' '));
      if (regexmatch) {
       let scope = scan;
       let value = (isNaN(regexmatch[1]) ? regexmatch[1] : (+regexmatch[1]));
       if (typeof(scope[key]) == "undefined") scope = scan.internal;
       if (Array.isArray(scope[key])) scope[key].push(value);
       else scope[key] = value;
      }
     });
     if (fileType == "mzXML" && /<peaks\s/.exec(eles[i])) {
      scan.internal.binaryDataOffset.push(position - data.length + eles.slice(0,i+1).join("").length + i + 1);
      if (scan.internal.binaryDataOffset.length > 1) throw new Error("MzMLFileMzXMLMoreThanOneBinaryDataArray");
      i+=1;
     }
    }
    if (scan.internal.binaryDataOffset.length < (fileType == "mzML" ? 2 : 1)) throw new Error('MzFileInsufficientBinaryDataArrays');
    //Standardise values
    if (fileType == "mzXML" || scan.internal.rtUnits=="second") {
     scan.retentionTime /= 60;
    }
    scan.centroided = scan.centroided ? true : false; //standardise null, 0 etc
    scan.activationMethods = scan.activationMethods.map(function(value) {
     switch(value) {
      case 1000133 : 
      case "CID"   : return CID;
      case 1000422 : 
      case "HCD"   : return HCD;
      case 1000598 : 
      case "ETD"   : return ETD;
      case 1000599 : 
      case "PQD"   : return PQD;
      default : return value;
     }
    });
    scan.internal.compressionType = scan.internal.compressionType.map(function(value) {
     switch(value) {
      case "zlib" : return ZLIB;
      default : return NO_COMPRESSION;
     }
    });
    scan.internal.binaryDataOrder = scan.internal.binaryDataOrder.map(function(value) {
     switch(value) {
      case "-int" : return MZ_INT;
      case "int-" : return INT_MZ;
      case 1000514 : return MZ;
      case 1000515 : return INT;
      default : return value;
     }
    });
    if (scan.internal.binaryDataEndianness) {
     if (scan.internal.binaryDataEndianness == "network") delete(scan.internal.binaryDataEndianness);
     else throw new Error("MzFileUnrecognisedByteOrder");
    }
    return scan;
   };

   _MzFile.parsers.spectrum = function(data,scan,fileType) {
    if (fileType == 'mzML') {
     let binaryIndex1 = data.indexOf("</binary>");
     if (binaryIndex1 < 0) throw new Error("MzFileMzMLMissingFirstSpectrumBinaryTag");
     let firstBinaryArray = data.substr(0,binaryIndex1).replace(/\n|\r/gm,'');
     let secondArrayStart = scan.internal.binaryDataOffset[1]-scan.internal.binaryDataOffset[0];
     let binaryIndex2 = data.indexOf('</binary>',secondArrayStart);
     if (binaryIndex2 < 0) throw new Error("MzFileMzMLMissingSecondSpectrumBinaryTag");
     let secondBinaryArray = data.substr(secondArrayStart,binaryIndex2-secondArrayStart).replace(/\n|\r/gm,'');
     let first = decodeByteArray(firstBinaryArray,scan.internal.compressionType[0],scan.internal.binaryDataPrecision[0],true);
     let second = decodeByteArray(secondBinaryArray,scan.internal.compressionType[1],scan.internal.binaryDataPrecision[1],true);
     let a = [];
     let b = [];
     if (scan.internal.binaryDataOrder[0] && !scan.internal.binaryDataOrder[1]) {
      a = first;
      b = second;
     }
     else if (!scan.internal.binaryDataOrder[0] && scan.internal.binaryDataOrder[1]) {
      b = first;
      a = second;
     }
     else {
      throw new Error('MzFileUnrecognisedBinaryDataOrder: '+scan.internal.binaryDataOrder);
     }
     return [a.filter((mz,i) => b[i]),b.filter(inten => inten)];
    }
    else if (fileType == 'mzXML') {
     let endPeaksIndex = data.indexOf('</peaks>');
     if (endPeaksIndex < 0) return { isIncomplete : true, remaining : data }
     else {
      data = data.substr(0,endPeaksIndex);
      let values = decodeByteArray(data,scan.internal.compressionType[0],scan.internal.binaryDataPrecision[0],false);
      let a = [];
      let b = [];
      if (scan.internal.binaryDataOrder[0] == INT_MZ) {
       for (let i = 0; i < values.length; i = i+2) { 
        b.push(values[i]);
        a.push(values[i+1]);
       }
      }
      else {
       for (let i = 0; i < values.length; i = i+2) { 
        a.push(values[i]); 
        b.push(values[i+1]);
       }
      }
      return [a.filter((mz,i) => b[i]),b.filter(inten => inten)];
     }
    }
   };

   //------------------------------------------------------------------------------
   //Format-specific regexes for data extraction
   //------------------------------------------------------------------------------

   //The pattern [^] is a multiline single character wildcard (since . will not match \n)

   let regex = {};
   regex.mzML = {
    index : /<indexListOffset>(\d+)<\/indexListOffset>/,
    scanOffsetList : /<offset\sidRef=".*?scan=(\d+)".*?>(\d+)$/,
    scanNumber : /<spectrum\s(?:.+\s)?id=".*?scan=(\d+)"/,
    scan : {
     msLevel : /<cvParam\s(?:.+\s)?accession="MS:1000511" name="ms level" value="(\d+)"/,
     centroided : /<cvParam\s(?:.+\s)?accession="MS:(1)000127" name="centroid spectrum"/,
     retentionTime : /<cvParam\s(?:.+\s)?accession="MS:1000016" name="scan start time" value="(.+?)"/,
     rtUnits : /<cvParam\s(?:.+\s)?accession="MS:1000016" name="scan start time"\s(?:[^]+\s)?unitName="(.+?)"/,
     lowMz : /<cvParam\s(?:.+\s)?accession="MS:1000501" name="scan window lower limit" value="(.+?)"/,
     highMz : /<cvParam\s(?:.+\s)?accession="MS:1000500" name="scan window upper limit" value="(.+?)"/,
     basePeakMz : /<cvParam\s(?:.+\s)?accession="MS:1000504" name="base peak m\/z" value="(.+?)"/,
     basePeakIntensity : /<cvParam\s(?:.+\s)?accession="MS:1000505" name="base peak intensity" value="(.+?)"/,
     totalCurrent : /<cvParam\s(?:.+\s)?accession="MS:1000285" name="total ion current" value="(.+?)"/,
     precursorMzs : /<cvParam\s(?:.+\s)?accession="MS:1000744" name="selected ion m\/z" value="(.+?)"/,
     precursorCharges : /<cvParam\s(?:.+\s)?accession="MS:1000041" name="charge state" value="(.+?)"/,
     precursorIntensities : /<cvParam\s(?:.+\s)?accession="MS:1000042" name="peak intensity" value="(.+?)"/,
     activationMethods : /<cvParam\s(?:.+\s)?accession="MS:(1000133|1000422|1000598|1000599)"/,
     binaryDataListCount : /<binaryDataArrayList\s(?:.+\s)?count="(\d+)"/,
     binaryDataLength : /<binaryDataArray\s(?:.+\s)?encodedLength="(\d+)"/,
     compressionType : /<cvParam\s(?:.+\s)?accession="MS:1000574" name="(zlib) compression"/,
     binaryDataPrecision : /<cvParam\s(?:.+\s)?accession="(?:MS:1000521|MS:1000523)" name="(32|64)-bit float"/,
     binaryDataOrder : /<cvParam\s(?:.+\s)?accession="MS:(1000514|1000515)"/
    }
   };
   regex.mzML.scanKeys = Object.keys(regex.mzML.scan);

   regex.mzXML = {
    index : /<indexOffset>(\d+)<\/indexOffset>/,
    scanOffsetList : /<offset\sid="(\d+)".*?>(\d+)$/,
    scanNumber : /<scan\s(?:.+\s)?num="(\d+?)"/,
    scan : {
     msLevel : /<scan\s(?:.+\s)?msLevel="(\d+?)"/,
     centroided : /<scan\s(?:.+\s)?centroided="([01])"/,
     retentionTime : /<scan\s(?:.+\s)?retentionTime="PT(\d+\.?\d+)S"/,
     lowMz : /<scan\s(?:.+\s)?(?:lowMz|startMz)="(.+?)"/,
     highMz : /<scan\s(?:.+\s)?(?:highMz|endMz)="(.+?)"/,
     basePeakMz : /<scan\s(?:.+\s)?basePeakMz="(.+?)"/,
     basePeakIntensity : /<scan\s(?:.+\s)?basePeakIntensity="(.+?)"/,
     collisionEnergy : /<scan\s(?:.+\s)?collisionEnergy="(.+?)"/,
     totalCurrent : /<scan\s(?:.+\s)?totIonCurrent="(.+?)"/,
     precursorMzs : /^(.+?)<\/precursorMz/,
     precursorCharges : /<precursorMz\s(?:.+\s)?precursorCharge="(.+?)"/,
     precursorIntensities : /<precursorMz\s(?:.+\s)?precursorIntensity="(.+?)"/,
     activationMethods : /<precursorMz\s(?:.+\s)?activationMethod="(.+?)"/,
     compressionType : /<peaks\s(?:.+\s)?compressionType="(.+?)"/,
     binaryDataPrecision : /<peaks\s(?:.+\s)?precision="(32|64)"/,  
     binaryDataOrder : /<peaks\s(?:.+\s)?(?:contentType|pairOrder)=".*(-int|int-).*"/,
     binaryDataEndianness : /<peaks\s(?:.+\s)?byteOrder="(.+?)"/
    }
   };
   regex.mzXML.scanKeys = Object.keys(regex.mzXML.scan);

   //------------------------------------------------------------------------------
   //Data array decoding
   //------------------------------------------------------------------------------
   
   let decodeByteArray = function(t,c,p,e) {
    if (!t.length) {
     return [];
    }
    let s = globalThis.atob(t); //decode base64
    let bytes;
    if (c && (c == ZLIB)) {
     try {
      bytes = mslib.dist.zlib.inflate(s); //inflate zlib
     }
     catch (err) {
      console.log("Error: zpipe threw error (" + err + ") for compressed text:" + t);
      throw new Error('MzFileZLibDecompressionFailure:'+err);
     }
    }
    else if (c) {
     throw new Error("MzFileUnknownCompressionType");
    }
    else {
     bytes = new Uint8Array(s.length);
     for (let i = 0; i < s.length; i++) { 
      bytes[i] = s.charCodeAt(i);
     }
    }
    let dV = new DataView(bytes.buffer);  //Have to use DataView to access in Big-Endian format
    let values = [];
    if (p == 32) {
     if (bytes.length % 4) {
      throw new Error('MzFileInvalidByteArrayLength:'+bytes.length);
     }
     for (let i = 0; i < dV.byteLength; i = i+4) { 
      values.push(dV.getFloat32(i,e)); 
     }
    }
    else if (p == 64) {
     if (bytes.length % 8) {
      throw new Error('MzFileInvalidByteArrayLength:'+bytes.length);
     }
     for (let i = 0; i < dV.byteLength-1; i = i+8) { 
      values.push(dV.getFloat64(i,e)); 
     }
    }
    else {
     throw new Error("MzFileInvalidPrecision");
    }
    return values;
   };

   _MzFile._SOURCE = _SOURCE;

   return _MzFile;

  }();

  let TextTableFile = function _SOURCE() {
   
   var _TextTableFile = function(f) {
    this.reader                 = new mslib.common.Reader(f,this);
    mslib.common.initialise(this);
    this.fileType               = "text_table";
    if (f.name.match(/\.csv$/i)) {
     this.delimiter = ",";
    }
    else if (f.name.match(/\.tsv$/i) || f.name.match(/\.txt$/i)) {
     this.delimiter = "\t";
    }
    else {
     this.delimiter = "";
    }
    this.useFirstLineAsHeaders  = false;
    this.headers                = [];
    this.lines                  = [];
   };
   
   _TextTableFile.prototype.load = function() {
    mslib.common.start(this);
    this.reader.readText(
     function() {
      var lines = this.result.replace(/\r\n?/gm,"\n").split("\n");
      while (!lines[lines.length-1].length) lines.pop(); // remove trailing blank lines
      lines.forEach(function(line,i) {
       mslib.common.progress(this.parent,((i/lines.length)*100).toFixed(2));
       if (this.parent.delimiter) {
        var splitarr = line.split(this.parent.delimiter);
        var fields = [];
        while (splitarr.length) {
         var field = splitarr.shift();
         if (field.match(/^"/)) { //handle quoted fields
          while (!field.match(/"$/) && splitarr.length) {
           field += splitarr.shift();
          }
          field = field.substring(1,field.length-1);
         }
         fields.push(field);
        }
        this.parent.lines.push(fields);
       }
       else {
        this.parent.lines.push([line]);
       }
      },this);
      if (this.parent.useFirstLineAsHeaders && this.parent.lines.length && !this.parent.headers.length) {
       this.parent.headers = this.parent.lines.shift();
      }
      mslib.common.finish(this.parent);
     }
    );
   };

   _TextTableFile._SOURCE = _SOURCE;

   return _TextTableFile;

  }();

  let XmlFile = function _SOURCE() {
   
   var _XmlFile = function(f) {
    this.reader                 = new mslib.common.Reader(f,this);
    mslib.common.initialise(this);
    this.fileType               = "xml";
    this.docRoot                = null;
   };
   
   _XmlFile.prototype.load = function() {
    mslib.common.start(this);
    this.reader.readText(
     function() {
      this.Parent.docRoot = (new DOMParser()).parseFromString(this.result, "text/xml");
      mslib.common.finish(this.parent);
     }
    );
   };

   _XmlFile._SOURCE = _SOURCE;

   return _XmlFile;

  }();

  var _index$4 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    base: _index$3,
    FastaFile: FastaFile,
    MgfFile: MgfFile,
    MzFile: MzFile,
    TextTableFile: TextTableFile,
    XmlFile: XmlFile
  });

  var mslib$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    dist: _index,
    data: _index$2,
    format: _index$4,
    constants: constants,
    common: common,
    math: math,
    moietymath: moietymath
  });

  globalThis.mslib = mslib$1;

}());
