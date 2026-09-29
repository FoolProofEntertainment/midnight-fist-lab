/* Harden player strikes: longer buffer, wake from light stun, fight-start grace, debug hook. */
(function () {
  if (!document.body || !(document.body.classList.contains("pp-lab-bleed") || document.body.classList.contains("page-id-6720"))) return;

  function install() {
    // Synthetic key helper for QA: window.__ppMflTap('light'|'heavy'|'j'|'k')
    window.__ppMflTap = function (which) {
      var map = { j: "j", light: "j", punch: "j", k: "k", heavy: "k", kick: "k", i: "i", upper: "i", l: "l", special: "l" };
      var key = map[String(which || "j").toLowerCase()] || "j";
      var ev = new KeyboardEvent("keydown", { key: key, bubbles: true, cancelable: true });
      window.dispatchEvent(ev);
      setTimeout(function () {
        window.dispatchEvent(new KeyboardEvent("keyup", { key: key, bubbles: true, cancelable: true }));
      }, 40);
      return key;
    };

    // If focus is trapped in a sidebar input, blur it when user presses fight keys.
    window.addEventListener("keydown", function (event) {
      var k = (event.key || "").toLowerCase();
      if (!["j", "k", "i", "l", "o", "f", "a", "d", "w", "s"].includes(k)) return;
      var t = event.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.closest && t.closest(".pp-midnight-fist-lab, #game-window, #game-controls")) return;
      // Sidebar / WP chrome stole focus — pull it back so Lab keys work.
      if (typeof t.blur === "function") t.blur();
      if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) {
        try { document.activeElement.blur(); } catch (e) {}
      }
      var canvas = document.getElementById("game");
      if (canvas && canvas.focus) try { canvas.focus(); } catch (e2) {}
    }, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
})();
