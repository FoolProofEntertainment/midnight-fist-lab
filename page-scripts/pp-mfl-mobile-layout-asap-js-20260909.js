(function () {
			    if (!document.body || !(document.body.classList.contains("pp-lab-bleed") || document.body.classList.contains("page-id-6720"))) return;
			  function fighting() {
				      var w = document.getElementById("game-window");
				      return !!(w && w.getAttribute("data-mode") === "fight" && w.classList.contains("is-fighting"));
			  }
			  function syncPads() {
				      var ok = fighting();
				      document.body.classList.toggle("mfl-is-fighting", ok);
				      document.querySelectorAll("#game-controls, .game-controls, .attack-btn, .move-btn, .guard-btn, .touch-pad, .move-stick, .attack-zone").forEach(function (n) {
						  if (!ok) {
							          n.hidden = true;
							          n.style.setProperty("display", "none", "important");
							          n.style.setProperty("visibility", "hidden", "important");
							          n.style.setProperty("pointer-events", "none", "important");
							          n.style.setProperty("opacity", "0", "important");
						  } else {
							          n.hidden = false;
							  ["display", "visibility", "pointer-events", "opacity"].forEach(function (p) { n.style.removeProperty(p); });
						  }
				  });
			  }
			    setInterval(syncPads, 200);
			    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", syncPads);
			    else syncPads();
		  })();
</style>script>
						  }
						  }
				  })
			  }
			  }
		  })
		      pointer-events: none !important;
		      opacity: 0 !important;
	  }
	}
</style>style>

	  }
	  }
    max-width: 100% !important;
	}
  body.pp-lab-bleed .pp-midnight-fist-lab,
  body.page-id-6720 .pp-midnight-fist-lab,
  body.pp-lab-bleed #game-window,
  body.page-id-6720 #game-window {
    width: 100% !important;
    max-width: 100% !important;
    flex: 1 1 auto !important;
    min-width: 0 !important;
	}
</style><!-- pp-mfl-fight-controls-desktop-restore-20260909 -->
<style id="pp-mfl-fight-controls-desktop-restore-20260909">
@media (min-width: 761px) {
/* Show fight pads when #game-window is in fight — do NOT require #pp-lab-stage.is-fighting
   (stage class often missing → old-controls-kill + mobile-start-fix leave attack-btn display:none). */
#game-window[data-mode="fight"].is-fighting #game-controls,
#game-window[data-mode="fight"].is-fighting .game-controls,
.game-window[data-mode="fight"].is-fighting #game-controls,
.game-window[data-mode="fight"].is-fighting .game-controls {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: none !important;
}
#game-window[data-mode="fight"].is-fighting .touch-pad,
.game-window[data-mode="fight"].is-fighting .touch-pad {
  display: grid !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: none !important;
}
#game-window[data-mode="fight"].is-fighting .attack-zone,
.game-window[data-mode="fight"].is-fighting .attack-zone {
  display: grid !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: none !important;
}
#game-window[data-mode="fight"].is-fighting .move-stick,
#game-window[data-mode="fight"].is-fighting .movement-actions,
.game-window[data-mode="fight"].is-fighting .move-stick,
.game-window[data-mode="fight"].is-fighting .movement-actions {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
#game-window[data-mode="fight"].is-fighting .attack-btn,
#game-window[data-mode="fight"].is-fighting .guard-btn,
#game-window[data-mode="fight"].is-fighting .riftality-btn,
#game-window[data-mode="fight"].is-fighting .touch-pad button,
.game-window[data-mode="fight"].is-fighting .attack-btn,
.game-window[data-mode="fight"].is-fighting .guard-btn,
.game-window[data-mode="fight"].is-fighting .riftality-btn,
.game-window[data-mode="fight"].is-fighting .touch-pad button {
  display: revert !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
}
</style>
<script id="pp-mfl-fight-controls-desktop-restore-js-20260909">
(function () {
  if (!document.body || !(document.body.classList.contains("pp-lab-bleed") || document.body.classList.contains("page-id-6720"))) return;
  function mirrorFightClass() {
    var w = document.getElementById("game-window") || document.querySelector(".game-window");
    var fighting = !!(w && w.getAttribute("data-mode") === "fight" && w.classList.contains("is-fighting"));
    var stage = document.getElementById("pp-lab-stage");
    var lab = document.querySelector(".pp-midnight-fist-lab");
    if (stage) stage.classList.toggle("is-fighting", fighting);
    if (lab) lab.classList.toggle("is-fighting", fighting);
    // Soften the aggressive js-mobile-layout sync: if fighting, clear inline kills on pads
    if (fighting) {
      document.querySelectorAll("#game-controls,.touch-pad,.attack-zone,.attack-btn,.guard-btn,.move-stick,.movement-actions").forEach(function (n) {
        n.hidden = false;
        ["display", "visibility", "pointer-events", "opacity"].forEach(function (p) {
          if (n.style && n.style.getPropertyPriority && n.style.getPropertyPriority(p) === "important") {
            // only clear if we set hide values
            var v = (n.style.getPropertyValue(p) || "").toLowerCase();
            if (p === "display" && v === "none") n.style.removeProperty(p);
            if (p === "visibility" && v === "hidden") n.style.removeProperty(p);
            if (p === "pointer-events" && v === "none" && n.classList.contains("attack-btn")) n.style.removeProperty(p);
            if (p === "opacity" && v === "0" && (n.classList.contains("attack-btn") || n.classList.contains("attack-zone") || n.id === "game-controls" || n.classList.contains("touch-pad"))) n.style.removeProperty(p);
          }
        });
      });
    }
  }
  mirrorFightClass();
  setInterval(mirrorFightClass, 200);
  var obs = new MutationObserver(mirrorFightClass);
  var w = document.getElementById("game-window");
  if (w) obs.observe(w, { attributes: true, attributeFilter: ["data-mode", "class"] });
})();
