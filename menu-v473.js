(() => {
  const leadingIcon = /^\s*((?:\p{Extended_Pictographic}|[₹✅✓☎→←])(?:\uFE0F|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic})*)\s*/u;
  function iconFor(label) {
    if (/class|student|विद्यार्थी/i.test(label)) return '🎓';
    if (/fee|salary|फीस/i.test(label)) return '💰';
    if (/profile|teacher/i.test(label)) return '👤';
    if (/mark|exam|अंक/i.test(label)) return '📊';
    if (/time|bell/i.test(label)) return '🔔';
    if (/attendance/i.test(label)) return '📅';
    if (/logout/i.test(label)) return '🚪';
    return '📋';
  }
  function decorate(item) {
    if(item.dataset.menu473 || item.hidden || item.style.display==='none') return;
    const walker=document.createTreeWalker(item,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode()) && !node.nodeValue.trim()) {}
    if(!node) return;
    const match=node.nodeValue.match(leadingIcon);
    item.dataset.menu473=match ? match[1] : iconFor(item.textContent);
    if(match)node.nodeValue=node.nodeValue.slice(match[0].length);
  }
  function start() {
    const nav=document.getElementById('erpNav');if(!nav)return;
    const scan=node=>{
      if(node.nodeType!==1)return;
      if(node.matches('button,summary'))decorate(node);
      node.querySelectorAll('button,summary').forEach(decorate);
    };
    scan(nav);
    new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)scan(node);}).observe(nav,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
