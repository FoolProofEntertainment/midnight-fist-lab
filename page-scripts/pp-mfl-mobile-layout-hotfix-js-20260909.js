(function () {
  if (!document.body || !(document.body.classList.contains("pp-lab-bleed") || document.body.classList.contains("page-id-6720"))) return;
  var MQ = window.matchMedia("(max-width: 760px)");

  function unlockScroll() {
    if (!MQ.matches) return;
    var html = document.documentElement;
    var body = document.body;
    ["height", "max-height", "overflow", "overflow-y", "overflow-x"].forEach(function (p) {
      html.style.removeProperty(p);
      body.style.removeProperty(p);
    });
    // Prefer CSS rules; only force if something re-locks inline
    if (getComputedStyle(body).overflow === "hidden" || getComputedStyle(html).overflow === "hidden") {
      html.style.setProperty("overflow-y", "auto", "important");
      html.style.setProperty("height", "auto", "important");
      body.style.setProperty("overflow-y", "auto", "important");
      body.style.setProperty("height", "auto", "important");
      body.style.setProperty("max-height", "none", "important");
    }
    var stage = document.getElementById("pp-lab-stage");
    if (stage) {
      stage.style.setProperty("height", "auto", "important");
      stage.style.setProperty("max-height", "none", "important");
      stage.style.setProperty("overflow", "visible", "important");
    }
    document.querySelectorAll(".select-layer").forEach(function (el) {
      el.style.setProperty("overflow-y", "auto", "important");
      el.style.setProperty("height", "auto", "important");
      el.style.setProperty("max-height", "none", "important");
    });
  }

  function syncFightMirror() {
    var w = document.getElementById("game-window") || document.querySelector(".game-window");
    var fighting = !!(w && w.getAttribute("data-mode") === "fight" && w.classList.contains("is-fighting"));
    var stage = document.getElementById("pp-lab-stage");
    var lab = document.querySelector(".pp-midnight-fist-lab");
    if (stage) stage.classList.toggle("is-fighting", fighting);
    if (lab) lab.classList.toggle("is-fighting", fighting);
  }

  function tick() {
    unlockScroll();
    syncFightMirror();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tick);
  } else {
    tick();
  }
  setInterval(tick, 400);
  if (MQ.addEventListener) MQ.addEventListener("change", tick);
  else if (MQ.addListener) MQ.addListener(tick);
})();
