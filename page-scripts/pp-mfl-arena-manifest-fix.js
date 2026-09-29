(function () {
  if (!/midnight-fist-lab/.test(location.pathname)) return;
  var U = "https://plot-pulse.com/wp-content/uploads";
  var fixes = {
    "assets/arenas/neon-docks.jpg": U + "/2026/06/midnight-fist-assets-arenas-neon-docks.jpg",
    "assets/arenas/warehouse.jpg": U + "/2026/06/midnight-fist-assets-arenas-warehouse.jpg",
    "assets/arenas/temple-ruins.jpg": U + "/2026/06/midnight-fist-assets-arenas-temple-ruins.jpg",
    "assets/arenas/orbital-graveyard.jpg": U + "/2026/09/orbital-graveyard-bg.jpg",
    "assets/arenas/orbital-graveyard-floor.jpg": U + "/2026/09/orbital-graveyard-floor.jpg",
    "assets/arenas/orbital-graveyard-bg.jpg": U + "/2026/09/orbital-graveyard-bg.jpg"
  };
  function apply() {
    var m = window.MIDNIGHT_FIST_MANIFEST;
    if (!m || typeof m !== "object") return false;
    m["game.js"] = "https://plot-pulse.com/wp-content/uploads/2026/09/midnight-fist-game-18-maps-v4-window-finisher.js?v=20260909reel2";
    Object.keys(fixes).forEach(function (k) { m[k] = fixes[k]; });
    return true;
  }
  if (!apply()) {
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (apply() || n > 40) clearInterval(t);
    }, 100);
  }
})();
