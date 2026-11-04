(function(){
  var f=document.getElementById('wl');if(!f)return;
  var msg=document.getElementById('wl-msg'),btn=f.querySelector('button[type=submit]');
  var src=(new URLSearchParams(location.search).get('src')||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,32);
  f.src.value=src;
  function say(t,ok){msg.textContent=t;msg.className='wl-msg '+(ok?'ok':'err');}
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var g=function(n){return (f[n].value||'').trim();};
    var sports=[].slice.call(f.querySelectorAll('input[name=sport]:checked')).map(function(x){return x.value;});
    var email=g('email'),mob=g('mobile').replace(/[\s-]/g,'');
    if(f.website.value){say('Salamat! Nasa listahan ka na.',true);f.reset();return;} // honeypot
    if(!g('name')||g('name').length>80)return say('Pakilagay ang pangalan mo (max 80 characters).');
    if(!g('city')||g('city').length>60)return say('Pakilagay ang city mo (max 60 characters).');
    if(!sports.length)return say('Pumili ng kahit isang sport.');
    if(!f.querySelector('input[name=role]:checked'))return say('Player ka ba o organizer?');
    if(!email&&!mob)return say('Kailangan ng email o mobile number, kahit isa lang.');
    if(email&&(email.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return say('Mukhang mali ang email.');
    if(mob&&!/^9\d{9}$/.test(mob))return say('Mobile: 10 digits na nagsisimula sa 9 (hal. 9171234567), walang 0 sa unahan.');
    if(!g('heard'))return say('Saan mo nalaman ang SanLaro?');
    var other=g('heard_other').slice(0,80);
    var data={name:g('name'),city:g('city'),sports:sports.join(', '),role:f.querySelector('input[name=role]:checked').value,
      contact:[email,mob?'+63'+mob:''].filter(Boolean).join(' / '),
      heard_from:g('heard')+(g('heard')==='Other'&&other?': '+other:''),src:src,website:''};
    var ep=window.WAITLIST_ENDPOINT;
    if(!ep){console.info('[waitlist] WAITLIST_ENDPOINT not configured; would send',data);
      return say('Preview lang ito: hindi pa naka-connect ang waitlist, kaya walang na-save. Email us muna sa hello@sanlaro.com.');}
    btn.disabled=true;say('Sending…',true);
    fetch(ep,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)})
      .then(function(r){return r.json();})
      .then(function(j){if(!j||!j.ok)throw 0;f.reset();f.src.value=src;
        say('Salamat, '+data.name.split(' ')[0]+'! Nasa waitlist ka na. Ime-message ka namin pag ready na ang SanLaro. Ano, Tara? 🏸',true);})
      .catch(function(){say('Ay, may error. Subukan ulit, o email us sa hello@sanlaro.com.');})
      .finally(function(){btn.disabled=false;});
  });
  f.heard.addEventListener('change',function(){f.heard_other.hidden=f.heard.value!=='Other';});
})();
