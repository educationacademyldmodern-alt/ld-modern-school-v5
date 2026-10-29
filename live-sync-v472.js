/* V481: passive sync is intentionally disabled. Data reads happen only after a user action. */
(()=>{'use strict';const W=window;let started=false;const empty=()=>({channels:0,probes:0,coalesced:0,applied:0,deferred:0,queued:0,active:false,retryDelayMs:0,flushing:false});
function stop(){started=false;return true}function start(){started=false;return false}function notify(){return false}async function probe(){return false}async function flush(){return false}
W.LDM_LIVE472={start,stop,notify,flush,probe,stats:empty,version:482};})();
