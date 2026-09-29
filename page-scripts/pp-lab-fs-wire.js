(function(){
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn(); }
  ready(function(){
    var btn=document.getElementById('pp-lab-fs');
    var stage=document.getElementById('pp-lab-stage');
    if(!btn||!stage||btn.dataset.fsBound==='1') return;
    btn.dataset.fsBound='1';
    function isFs(){
      return document.fullscreenElement===stage || document.webkitFullscreenElement===stage || stage.classList.contains('is-fs') || stage.classList.contains('is-pseudo-fs');
    }
    function setLabel(){
      var on=isFs();
      btn.setAttribute('aria-pressed', on?'true':'false');
      btn.textContent = on ? 'Exit Fullscreen' : 'Fullscreen';
    }
    function enter(){
      var canvas = stage.querySelector('canvas#game') || stage.querySelector('canvas');
      var req = stage.requestFullscreen || stage.webkitRequestFullscreen || stage.msRequestFullscreen;
      var runPseudo = function(){
        stage.classList.add('is-pseudo-fs','is-fs');
        document.documentElement.classList.add('pp-lab-pseudo-fs');
        document.body && document.body.classList.add('pp-lab-pseudo-fs');
        if (window.matchMedia && window.matchMedia('(orientation: landscape) and (max-width: 900px)').matches) {
          stage.classList.add('is-mobile-landscape');
        }
        setLabel();
      };
      try {
        if (req) {
          Promise.resolve(req.call(stage)).then(setLabel).catch(runPseudo);
          return;
        }
        if (canvas && typeof canvas.webkitEnterFullscreen === 'function') {
          try { canvas.webkitEnterFullscreen(); setLabel(); return; } catch (e) {}
        }
        runPseudo();
      } catch (e) { runPseudo(); }
    }
    function exit(){
      try {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
      } catch (e) {}
      stage.classList.remove('is-pseudo-fs','is-fs','is-mobile-landscape');
      document.documentElement.classList.remove('pp-lab-pseudo-fs');
      document.body && document.body.classList.remove('pp-lab-pseudo-fs');
      setLabel();
    }
    btn.addEventListener('click', function(ev){ ev.preventDefault(); if(isFs()) exit(); else enter(); });
    document.addEventListener('fullscreenchange', setLabel);
    document.addEventListener('webkitfullscreenchange', setLabel);
    setLabel();
  });
})();
