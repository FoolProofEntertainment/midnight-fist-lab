(function(){
  if (!/midnight-fist-lab/.test(location.pathname)) return;
  var CARD = "<div class=\"pp-lab-ad-card\" data-pp-ad=\"scrambly-std\" style=\"position:relative;width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;background:#0a0809;border:1px solid rgba(200,160,170,0.35);border-radius:0.5rem;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.7);\">\n  <a href=\"https://go.scrambly.io/lOxbCW\" target=\"_blank\" rel=\"noopener noreferrer sponsored\" style=\"text-decoration:none;color:inherit;display:flex;flex-direction:column;height:100%;\">\n    <div style=\"position:relative;width:100%;height:88px;overflow:hidden;background:linear-gradient(150deg,#1a1014,#050509 55%,#120c0e);display:flex;align-items:center;justify-content:center;\">\n      <div style=\"font-size:1.55rem;letter-spacing:0.03em;color:#e8a0b0;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;\">SCRAMBLY</div>\n      <div style=\"position:absolute;top:4px;left:4px;background:#c47888;color:#000;font-size:0.55rem;font-weight:bold;padding:1px 5px;border-radius:3px;\">AFFILIATE</div>\n    </div>\n    <div style=\"padding:0.4rem 0.45rem 0.5rem;display:flex;flex-direction:column;gap:3px;flex:1;\">\n      <strong style=\"display:block;font-size:0.7rem;color:#f3ead8;line-height:1.2;font-family:'Fraunces',Georgia,serif;\">Scrambly</strong>\n      <p style=\"font-size:0.58rem;color:#a89884;line-height:1.3;margin:0;\">Join via Plot-Pulse \u2014 friends get the standard signup path.</p>\n      <ul style=\"margin:2px 0 0;padding-left:0.85rem;font-size:0.54rem;color:#c4b4a4;line-height:1.35;\">\n        <li>Them: <strong style=\"color:#f3ead8;\">$5</strong> after earning their first $5</li>\n        <li>Plus 600 coins as a sign-up bonus</li>\n      </ul>\n      <div style=\"width:100%;padding:5px 0;background:#c47888;color:#000;font-size:0.62rem;font-weight:bold;border-radius:3px;text-align:center;margin-top:4px;\">Join Scrambly \u2192</div>\n    </div>\n  </a>\n</div>";
  function run(){
    var rail = document.querySelector('.pp-lab-ad-rail-left');
    if (!rail) return;
    // remove any hot cards from both rails
    document.querySelectorAll('[data-pp-ad="scrambly-hot"]').forEach(function(el){ el.remove(); });
    var hide = document.getElementById('pp-mfl-scrambly-only-hide');
    if (hide) hide.remove();
    if (rail.querySelector('[data-pp-ad="scrambly-std"]')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = CARD;
    var neu = wrap.firstElementChild;
    if (!neu) return;
    var amazon = rail.querySelector('[data-pp-ad="amazon-plotpulse"]');
    var cards = rail.querySelectorAll(':scope > .pp-lab-ad-card');
    if (amazon) amazon.replaceWith(neu);
    else if (cards[1]) cards[1].replaceWith(neu);
    else rail.appendChild(neu);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  setTimeout(run, 600);
})();
