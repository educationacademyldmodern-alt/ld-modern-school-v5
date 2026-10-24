/* One frame at a time; never sends images or QR data over the network. */
'use strict';
importScripts('vendor/jsQR-1.4.0.js');
self.onmessage=({data:m})=>{try{const r=jsQR(new Uint8ClampedArray(m.buffer),m.width,m.height,{inversionAttempts:'attemptBoth'});self.postMessage({id:m.id,raw:r?.data||''});}catch(e){self.postMessage({id:m.id,error:e.message});}};
