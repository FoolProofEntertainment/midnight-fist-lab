(function () {
  var GAME = "https://plot-pulse.com/wp-content/uploads/2026/09/midnight-fist-game-19-costumes-gear-cosmetics-1.js?v=2026-09-12T08%3A10%3A18.646Z";
  function patch(obj) {
    if (!obj || typeof obj !== "object") return;
    if (typeof obj.game === "string" && /midnight-fist-game-/.test(obj.game)) obj.game = GAME;
    if (obj.assets && typeof obj.assets.game === "string") obj.assets.game = GAME;
  }
  try {
    if (window.MIDNIGHT_FIST_MANIFEST) patch(window.MIDNIGHT_FIST_MANIFEST);
    if (window.MIDNIGHT_FIST_BOOT) patch(window.MIDNIGHT_FIST_BOOT);
    if (window.PP_MIDNIGHT_FIST) patch(window.PP_MIDNIGHT_FIST);
  } catch (e) {}
  var desc = Object.getOwnPropertyDescriptor(window, "MIDNIGHT_FIST_MANIFEST");
  if (!desc || desc.configurable) {
    var current = window.MIDNIGHT_FIST_MANIFEST;
    Object.defineProperty(window, "MIDNIGHT_FIST_MANIFEST", {
      configurable: true,
      enumerable: true,
      get: function () { return current; },
      set: function (v) { current = v; patch(current); }
    });
    if (current) patch(current);
  }
  document.addEventListener("DOMContentLoaded", function () {
    try {
      patch(window.MIDNIGHT_FIST_MANIFEST);
      document.querySelectorAll("script[src*='midnight-fist-game-']").forEach(function (s) {
        if (s.src && s.src.indexOf("game-19") === -1) {
          var n = document.createElement("script");
          n.src = GAME;
          n.async = false;
          s.replaceWith(n);
        }
      });
    } catch (e) {}
  });
})();
