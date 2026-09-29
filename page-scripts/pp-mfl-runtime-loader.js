(function () {
  var urls = {"storage":"https://plot-pulse.com/wp-content/uploads/2026/08/midnight-fist-scripts-midnight-fist-storage-12.js?v=2026-08-10T20%3A56%3A12Z","audio":"https://plot-pulse.com/wp-content/uploads/2026/08/midnight-fist-scripts-midnight-fist-audio-12.js?v=2026-08-10T20%3A56%3A12Z","game":"https://plot-pulse.com/wp-content/uploads/2026/09/midnight-fist-game-18-maps-v4-window-finisher-feelpack-v02.js?v=20260911v02"};
  var started = false;
  function setLoadProgress(percent) {
    var root = document.querySelector(".pp-midnight-fist-lab, .shell") || document;
    var loading = root.querySelector("#asset-loading-screen") || document.getElementById("asset-loading-screen");
    var bar = loading ? loading.querySelector(".asset-loading-bar span") : null;
    if (bar) bar.style.setProperty("--load-progress", Math.max(0, Math.min(100, percent)) + "%");
  }
  function setStudioLoading(visible) {
    var root = document.querySelector(".pp-midnight-fist-lab, .shell") || document;
    var gameWindow = root.querySelector("#game-window") || document.getElementById("game-window");
    var loading = root.querySelector("#asset-loading-screen") || document.getElementById("asset-loading-screen");
    if (gameWindow) {
      if (visible) gameWindow.dataset.loading = "assets";
      else delete gameWindow.dataset.loading;
    }
    if (loading) loading.hidden = !visible;
    setLoadProgress(visible ? 0 : 100);
  }
  function setStartupVisible(visible) {
    var root = document.querySelector(".pp-midnight-fist-lab, .shell") || document;
    var gameWindow = root.querySelector("#game-window") || document.getElementById("game-window");
    var startup = root.querySelector("#startup-screen") || document.getElementById("startup-screen");
    if (startup) startup.hidden = !visible;
    if (gameWindow) {
      if (visible) gameWindow.dataset.startup = "loading";
      else gameWindow.dataset.startup = "ready";
    }
  }
  function loadScript(src) {
    if (!src) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = function () { resolve(true); };
      script.onerror = function () {
        console.error("[MFL] failed to load", src);
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  function startRuntime() {
    if (started) return;
    started = true;
    setStartupVisible(false);
    setStudioLoading(true);
    setLoadProgress(8);
    Promise.all([loadScript(urls.storage), loadScript(urls.audio)]).then(function () {
      setLoadProgress(62);
      return loadScript(urls.game);
    }).then(function () {
      setLoadProgress(100);
      if (typeof window.midnightFistBoot !== "function") {
        console.error("[MFL] game loaded but midnightFistBoot missing");
      }
      window.setTimeout(function () { setStudioLoading(false); }, 260);
    });
  }
  window.__ppMflStartRuntime = startRuntime;
  function wireAcceptGate() {
    var root = document.querySelector(".pp-midnight-fist-lab, .shell") || document;
    var accept = root.querySelector("#startup-continue") || document.getElementById("startup-continue");
    setStartupVisible(true);
    setStudioLoading(false);
    if (accept) {
      accept.addEventListener("click", function (event) {
        event.preventDefault();
        window.requestAnimationFrame(function () { startRuntime(); });
      }, { once: true });
      return;
    }
    window.setTimeout(startRuntime, 450);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireAcceptGate, { once: true });
  else wireAcceptGate();
})();
