// This block must also parse on older Safari versions.
(function () {
  if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren=function () {
      while(this.firstChild)this.removeChild(this.firstChild);
      for(var i=0;i<arguments.length;i++) {
        var node=arguments[i];
        this.appendChild(node instanceof Node?node:document.createTextNode(String(node)));
      }
    };
  }
  if(window.crypto && !window.crypto.randomUUID && window.crypto.getRandomValues) {
    window.crypto.randomUUID=function () {
      var bytes=window.crypto.getRandomValues(new Uint8Array(16));
      bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
      var hex='';
      for(var i=0;i<bytes.length;i++)hex+=(i===4||i===6||i===8||i===10?'-':'')+('0'+bytes[i].toString(16)).slice(-2);
      return hex;
    };
  }
  document.addEventListener('click',function (event) {
    var target=event.target;
    if(!target.closest)return;
    var button=target.closest('.v26Login button');
    if(!button)return;
    var handler=button.getAttribute('onclick').split('(')[0];
    if(typeof window[handler]==='function')return;
    event.preventDefault();event.stopImmediatePropagation();
    var message=document.getElementById('portalCompatibility475');
    if(!message){message=document.createElement('p');message.id='portalCompatibility475';message.setAttribute('role','alert');button.parentNode.appendChild(message);}
    message.textContent=document.readyState==='complete'?'लॉगिन प्रोग्राम लोड नहीं हुआ। पेज दोबारा खोलें और Safari का संस्करण जाँचें।':'लॉगिन लोड हो रहा है। थोड़ी देर में फिर दबाएँ।';
  },true);
})();
