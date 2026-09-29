(function () {
  function apply() {
    var p = window.MIDNIGHT_FIST_PROJECT;
    if (!p || !Array.isArray(p.arenas)) return false;
    p.arenas.forEach(function (a) {
      if (a && a.id === "archive-bay-6") a.windowFinisher = true;
    });
    return true;
  }
  if (!apply()) {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
    setTimeout(apply, 0);
    setTimeout(apply, 100);
    setTimeout(apply, 500);
  }
})();
