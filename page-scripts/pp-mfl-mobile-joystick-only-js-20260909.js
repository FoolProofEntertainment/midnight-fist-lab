(function () {
		  if (!document.body || !(document.body.classList.contains("pp-lab-bleed") || document.body.classList.contains("page-id-6720"))) return;
		function isMobile() {
			    return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
		}
		function fightLive() {
			    var w = document.getElementById("game-window");
			    if (!w || w.getAttribute("data-mode") !== "fight" || !w.classList.contains("is-fighting")) return false;
			    // Countdown still showing "3"/"2"/"1"/"Fight" in #message  not live yet
			    var msg = document.getElementById("message");
			if (msg && !msg.hidden) {
				      var t = (msg.textContent || "").trim().toLowerCase();
				      if (/^(3|2|1|fight|get ready|guard high|meter starts)/.test(t) || t.indexOf("fight") === 0) {
						          // "Fight" flash is the last beat  still not live until message hides
						          return false;
				}
			}
			    // Prefer explicit flag from countdown gate if present    if (window.__ppMflFightLive === false) return false;
			    if (window.__ppMflFightLive === true) return true;
			    // Fallback: message hidden + fighting classes
					    return !(msg && !msg.hidden);
		}
		function sync() {
			    var live = fightLive();
			    document.body.classList.toggle("mfl-fight-live", live);
			    document.querySelectorAll("#game-controls, .attack-btn, .guard-btn, .move-stick, .move-knob, .touch-pad, .attack-zone").forEach(function (n) {
					      if (n.classList && n.classList.contains("move-btn")) return;
					if (!live) {
						        n.hidden = true;
						        n.style.setProperty("display", "none", "important");
						        n.style.setProperty("pointer-events", "none", "important");
						        n.style.setProperty("opacity", "0", "important");
					} else {
						        n.hidden = false;
						["display", "visibility", "pointer-events", "opacity"].forEach(function (p) { n.style.removeProperty(p); });
						        if (n.id === "game-controls") n.classList.add("is-fight-controls");
					}
			});
		}
		  setInterval(sync, 100);
		  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sync);
		  else sync();
	})();
</style>script>
					}
					}
			})
			    if (!isMobile()) return;
			    document.querySelectorAll("#game-controls .move-btn, .game-controls .move-btn, .move-up, .move-left, .move-right, .move-down").forEach(function (n) {
					      n.hidden = true;
					      n.style.setProperty("display", "none", "important");
					      n.style.setProperty("pointer-events", "none", "important");
					      n.style.setProperty("opacity", "0", "important");
			});
			})
		}
				}
			}
		}
		}
	})
  body.mfl-fight-live #game-controls.is-fight-controls .move-stick,
  body.mfl-fight-live #game-controls.is-fight-controls .move-knob {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
	}
  body.mfl-fight-live #game-controls.is-fight-controls .attack-btn,
  body.mfl-fight-live #game-controls.is-fight-controls .guard-btn {
    display: inline-flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
	}
	}
</style>style></style><!-- pp-mfl-countdown-fight-gate-20260909 -->
<script id="pp-mfl-countdown-fight-gate-20260909">
/* Gameplay + pads only AFTER countdown shows Fight and clears.
 *    Sets window.__ppMflFightLive for other control scripts. */
(function () {
  if (!document.body || !(document.body.classList.contains("pp-lab-bleed") || document.body.classList.contains("page-id-6720"))) return;
  window.__ppMflFightLive = false;
  var sawFightWord = false;

  function messageText() {
    var msg = document.getElementById("message");
    if (!msg || msg.hidden) return "";
    return (msg.textContent || "").replace(/\s+/g, " ").trim();
  }

  function tick() {
	        sawFightWord = false;
	        window.__ppMflFightLive = false;
	        document.body.classList.remove("mfl-fight-live");
	        return;
  }
	
	    // Live only after Fight word appeared AND overlay cleared
	    var live = sawFightWord && !msgVisible;
	    window.__ppMflFightLive = live;
	    document.body.classList.toggle("mfl-fight-live", live);
	
	    // Soft-block stray keydowns during countdown (capture)
}
 
   // Block combat keys until live
   window.addEventListener("keydown", function (event) {
	    if (window.__ppMflFightLive) return;
	    var k = (event.key || "").toLowerCase();
	    if (["j", "k", "i", "l", "o", "f", "a", "d", "w", "s", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(k)) {
			      // Allow nothing combat-related during countdown / menus when gate active in fight UI
			      var w = document.getElementById("game-window");
			      if (w && w.getAttribute("data-mode") === "fight") {
					          event.stopPropagation();
					          // don't preventDefault on everything  just stop game handlers if possible
				  }
		}
}, true);
	
	  setInterval(tick, 50);
	  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
	  else tick();
	})();
