(function () {
  if (!document.body || !(document.body.classList.contains("pp-lab-bleed") || document.body.classList.contains("page-id-6720"))) return;
  function showIfFight() {
    var w = document.getElementById("game-window");
    if (!w || w.getAttribute("data-mode") !== "fight" || !w.classList.contains("is-fighting")) return;
    var gc = document.getElementById("game-controls");
    if (gc) {
      gc.hidden = false;
      gc.classList.add("is-fight-controls");
      ["display", "visibility", "opacity", "pointer-events"].forEach(function (p) { gc.style.removeProperty(p); });
    }
    document.querySelectorAll(".attack-btn, .guard-btn").forEach(function (n) {
      n.hidden = false;
      ["display", "visibility", "opacity", "pointer-events"].forEach(function (p) { n.style.removeProperty(p); });
    });
  }
  setInterval(showIfFight, 200);
  document.addEventListener("DOMContentLoaded", showIfFight);
})();
