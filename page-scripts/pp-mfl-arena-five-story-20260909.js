/* Add five story arenas to live Lab catalog (after identity fix). */
(function () {
  var FIVE = [{"id": "archive-bay-6", "name": "Archive Bay 6", "image": "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-archive-bay-6-bg.jpg", "floorImage": "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-archive-bay-6-floor.jpg", "fx": "signal", "parallax": 0.9}, {"id": "hermes-dead-letter", "name": "Dead-Letter Loft", "image": "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-hermes-dead-letter-bg.jpg", "floorImage": "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-hermes-dead-letter-floor.jpg", "fx": "signal", "parallax": 0.9}, {"id": "redvale-channel-eight", "name": "Redvale Channel Eight", "image": "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-redvale-channel-eight-bg.jpg", "floorImage": "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-redvale-channel-eight-floor.jpg", "fx": "arcade", "parallax": 0.9}, {"id": "unaired-puppet-loft", "name": "Unaired Loft", "image": "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-unaired-puppet-loft-bg.jpg", "floorImage": "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-unaired-puppet-loft-floor.jpg", "fx": "haunt", "parallax": 0.88}, {"id": "intake-4b", "name": "Intake 4B", "image": "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-intake-4b-bg.jpg", "floorImage": "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-intake-4b-floor.jpg", "fx": "signal", "parallax": 0.92}];
  function apply() {
    var p = window.MIDNIGHT_FIST_PROJECT;
    if (!p) return false;
    if (!Array.isArray(p.arenas)) p.arenas = [];
    var by = {};
    p.arenas.forEach(function (a) { if (a && a.id) by[a.id] = a; });
    FIVE.forEach(function (arena) {
      if (by[arena.id]) {
        Object.assign(by[arena.id], arena);
      } else {
        p.arenas.push(arena);
      }
      if (window.MIDNIGHT_FIST_MANIFEST) {
        var key = "assets/arenas/" + arena.id + ".jpg";
        var floorKey = "assets/arenas/" + arena.id + "-floor.jpg";
        window.MIDNIGHT_FIST_MANIFEST[key] = arena.image;
        window.MIDNIGHT_FIST_MANIFEST[floorKey] = arena.floorImage;
      }
    });
    return true;
  }
  if (!apply()) {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
    setTimeout(apply, 0);
    setTimeout(apply, 50);
  }
})();
