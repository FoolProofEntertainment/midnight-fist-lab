(function () {
  var root = document.querySelector(".pp-midnight-fist-lab, .shell") || document;

  function byId(id) {
    return root.querySelector("#" + id) || document.getElementById(id);
  }

  function ensureRuntimeStarted() {
    // Game JS only loads after flash-warning accept (loader gate).
    var accept = byId("startup-continue");
    var startup = byId("startup-screen");
    if (startup && !startup.hidden && accept) {
      try { accept.click(); } catch (e) {}
    }
    if (typeof window.__ppMflStartRuntime === "function") {
      try { window.__ppMflStartRuntime(); } catch (e2) {}
    }
  }

  function whenBootReady(mode, cb) {
    ensureRuntimeStarted();
    if (typeof window.midnightFistBoot === "function") {
      cb(mode);
      return;
    }
    window.__midnightFistBootMode = mode;
    window.__midnightFistBootQueue = window.__midnightFistBootQueue || [];
    if (window.__midnightFistBootQueue.indexOf(mode) === -1) {
      window.__midnightFistBootQueue.push(mode);
    }
    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      ensureRuntimeStarted();
      if (typeof window.midnightFistBoot === "function") {
        window.clearInterval(timer);
        var pending = window.__midnightFistBootMode || mode;
        delete window.__midnightFistBootMode;
        var queue = window.__midnightFistBootQueue || [];
        delete window.__midnightFistBootQueue;
        window.midnightFistBoot(pending);
        queue.forEach(function (m) {
          if (m && m !== pending) window.midnightFistBoot(m);
        });
        if (cb) cb(pending);
      } else if (tries > 200) {
        window.clearInterval(timer);
        console.error("[MFL] midnightFistBoot never registered — game script did not load");
      }
    }, 50);
  }

  function callGame(mode) {
    whenBootReady(mode, function (m) {
      if (typeof window.midnightFistBoot === "function") window.midnightFistBoot(m || mode);
    });
  }

  function openRoster() { callGame("roster"); }
  function openCreate() { callGame("create"); }

  function wireSplashButtons() {
    var selectBtn = byId("select-fighter-button");
    var createBtn = byId("create-fighter-button");
    var backBtn = byId("back-to-splash");
    var continueBtn = byId("continue-button");
    var startBtn = byId("start-button");

    function wire(btn, fn) {
      if (!btn || btn.dataset.ppBootWired) return;
      btn.dataset.ppBootWired = "1";
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        fn();
      });
    }

    wire(selectBtn, openRoster);
    wire(createBtn, openCreate);
    wire(backBtn, function () { callGame("back"); });
    wire(continueBtn, function () { callGame("arena"); });
    wire(startBtn, function () { callGame("start"); });
  }

  function wireSelectDelegation() {
    if (root.dataset.ppSelectDelegated) return;
    root.dataset.ppSelectDelegated = "1";
    root.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      var fighterCard = target.closest(".fighter-card[data-character]");
      if (fighterCard && root.contains(fighterCard)) {
        event.preventDefault();
        callGame("pick:" + fighterCard.dataset.character);
        return;
      }
      var arenaCard = target.closest(".arena-card[data-arena]");
      if (arenaCard && root.contains(arenaCard)) {
        event.preventDefault();
        callGame("arena-pick:" + arenaCard.dataset.arena);
      }
    });
  }

  function wireAll() {
    wireSelectDelegation();
    wireSplashButtons();
  }

  document.addEventListener(
    "click",
    function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("#select-fighter-button")) {
        event.preventDefault();
        openRoster();
      } else if (target.closest("#create-fighter-button")) {
        event.preventDefault();
        openCreate();
      }
    },
    true
  );

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireAll);
  else wireAll();
  window.setTimeout(wireAll, 500);
  window.setTimeout(wireAll, 2000);
})();
