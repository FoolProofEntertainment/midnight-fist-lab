/* Temple/Warehouse: CDN filenames are swapped vs content.
 *    temple-ruins.jpg = warehouse art; warehouse.jpg = temple art.
 *    Assign by CONTENT so labels match what players see. */
(function () {
  var CDN = {
    temple: "https://plot-pulse.com/wp-content/uploads/2026/06/midnight-fist-assets-arenas-warehouse.jpg",
    warehouse: "https://plot-pulse.com/wp-content/uploads/2026/06/midnight-fist-assets-arenas-temple-ruins.jpg",
    neon: "https://plot-pulse.com/wp-content/uploads/2026/06/midnight-fist-assets-arenas-neon-docks.jpg",
    orbital: "https://plot-pulse.com/wp-content/uploads/2026/09/orbital-graveyard-bg.jpg",
    orbitalFloor: "https://plot-pulse.com/wp-content/uploads/2026/09/orbital-graveyard-floor.jpg"
  };
  function apply() {
    var p = window.MIDNIGHT_FIST_PROJECT;
    if (!p || !Array.isArray(p.arenas)) return false;
    var by = {};
    p.arenas.forEach(function (a) { if (a && a.id) by[a.id] = a; });
    if (by.temple) { by.temple.name = "Temple Ruins"; by.temple.image = CDN.temple; by.temple.fx = "embers"; by.temple.parallax = 0.8; }
    if (by.warehouse) { by.warehouse.name = "Warehouse"; by.warehouse.image = CDN.warehouse; by.warehouse.fx = "sparks"; by.warehouse.parallax = 1; }
    if (by["neon-docks"]) { by["neon-docks"].name = "Neon Docks"; by["neon-docks"].image = CDN.neon; by["neon-docks"].fx = "rain"; by["neon-docks"].parallax = 1.2; }
    if (!by["orbital-graveyard"]) {
      p.arenas.splice(2, 0, { id: "orbital-graveyard", name: "Orbital Graveyard", image: CDN.orbital, floorImage: CDN.orbitalFloor, fx: "space", parallax: 0.35 });
	} else {
      by["orbital-graveyard"].name = "Orbital Graveyard";
      by["orbital-graveyard"].image = CDN.orbital;
      by["orbital-graveyard"].floorImage = CDN.orbitalFloor;
	}
    if (window.MIDNIGHT_FIST_MANIFEST) {
      var m = window.MIDNIGHT_FIST_MANIFEST;
      m["assets/arenas/temple-ruins.jpg"] = CDN.temple;
      m["assets/arenas/warehouse.jpg"] = CDN.warehouse;
      m["assets/arenas/neon-docks.jpg"] = CDN.neon;
      m["assets/arenas/orbital-graveyard.jpg"] = CDN.orbital;
      m["assets/arenas/orbital-graveyard-bg.jpg"] = CDN.orbital;
      m["assets/arenas/orbital-graveyard-floor.jpg"] = CDN.orbitalFloor;
	}
    return true;
  }
  if (!apply()) {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
    setTimeout(apply, 0);
    setTimeout(apply, 50);
    setTimeout(apply, 250);
  }
})();
