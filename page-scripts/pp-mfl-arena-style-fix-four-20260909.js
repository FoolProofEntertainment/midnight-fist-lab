/* Replace flat vector title-card arenas with painted cinematic BGs+floors. */
(function () {
  var FOUR = [{"id":"music-festival","name":"Music Festival","image":"https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-music-festival-bg.jpg","floorImage":"https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-music-festival-floor.jpg","fx":"music","parallax":0.9},{"id":"rooftop-arcade","name":"Rooftop Arcade","image":"https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-rooftop-arcade-bg.jpg","floorImage":"https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-rooftop-arcade-floor.jpg","fx":"arcade","parallax":1.05,"spaceFinisher":true},{"id":"raven-hollow-relay","name":"Raven's Hollow Relay","image":"https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-raven-hollow-relay-bg.jpg","floorImage":"https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-raven-hollow-relay-floor.jpg","fx":"signal","parallax":0.92},{"id":"haunted-stadium","name":"Haunted Stadium","image":"https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-haunted-stadium-bg.jpg","floorImage":"https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-haunted-stadium-floor.jpg","fx":"haunt","parallax":0.86}];
  function apply() {
    var p = window.MIDNIGHT_FIST_PROJECT;
    if (!p) return false;
    if (!Array.isArray(p.arenas)) p.arenas = [];
    var by = {};
    p.arenas.forEach(function (a) { if (a && a.id) by[a.id] = a; });
    FOUR.forEach(function (arena) {
      if (by[arena.id]) {
        by[arena.id].name = arena.name;
        by[arena.id].image = arena.image;
        by[arena.id].floorImage = arena.floorImage;
        by[arena.id].fx = arena.fx;
        by[arena.id].parallax = arena.parallax;
        if (arena.spaceFinisher) by[arena.id].spaceFinisher = true;
      } else {
        p.arenas.push(arena);
      }
      if (window.MIDNIGHT_FIST_MANIFEST) {
        var m = window.MIDNIGHT_FIST_MANIFEST;
        m["assets/arenas/" + arena.id + ".jpg"] = arena.image;
        m["assets/arenas/" + arena.id + "-bg.jpg"] = arena.image;
        m["assets/arenas/" + arena.id + "-floor.jpg"] = arena.floorImage;
        if (arena.id === "haunted-stadium") {
          m["assets/arenas/haunted-stadium-football.jpg"] = arena.image;
          m["assets/arenas/haunted-stadium.jpg"] = arena.floorImage;
        }
        if (arena.id === "music-festival") m["assets/arenas/music-festival.jpg"] = arena.image;
        if (arena.id === "rooftop-arcade") m["assets/arenas/rooftop-arcade.jpg"] = arena.image;
        if (arena.id === "raven-hollow-relay") m["assets/arenas/raven-hollow-relay.jpg"] = arena.image;
      }
    });
    return true;
  }
  if (!apply()) {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
    setTimeout(apply, 0);
    setTimeout(apply, 50);
    setTimeout(apply, 250);
  }
})();
