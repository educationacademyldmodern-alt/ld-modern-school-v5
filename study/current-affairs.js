(function(){
  window.SKY_CURRENT_AFFAIRS = {
    date:(()=>{const d=new Date(),z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)})(),
    status:'NEEDS REVIEW',
    lastVerified:'',
    items:[],
    note:'Daily Current Affairs must be imported/verified from official or high-authority sources before teaching. The app will not invent live news.'
  };
})();
