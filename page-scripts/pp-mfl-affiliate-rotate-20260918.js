(function () {
  if (!document.body || !(document.body.classList.contains("pp-lab-bleed") || document.body.classList.contains("page-id-6720"))) return;
  var MARKER = "pp-mfl-affiliate-rotate-20260918";

  var ADS = [
    { id: "axiom", accent: "#4adf62", badge: "TRADE", title: "Axiom Trade", blurb: "One of the best trading platforms â€” referred traders get 10% off fees.", cta: "Trade on Axiom", href: "https://axiom.trade/@itzninja" },
    { id: "seedance", accent: "#a78bfa", badge: "VIDEO", title: "Seedance 2.0", blurb: "Multi-modal AI video â€” images, clips, audio. Plot-Pulse affiliate via Seevio.", cta: "Try Seedance", href: "https://tolt.link/plot-pulse-website" },
    { id: "sofi", accent: "#00c8a7", badge: "INVEST", title: "SoFi Invest", blurb: "Open Active Investing with $25+ and get $25 in stock.", cta: "Claim $25 stock", href: "https://www.sofi.com/invite/invest?gcp=f3d4da09-d5e7-4399-b239-a0ccd75f30b7&isAliasGcp=false&siid=095c3965-f4aa-46c7-9112-25ef05c83bb0" },
    { id: "sofi-crypto", accent: "#7cf0d8", badge: "CRYPTO", title: "SoFi Crypto", blurb: "Buy, sell, hold crypto on SoFi. New accounts: $25 SOFID for them / $50 for Plot-Pulse after open + $25+ purchase in 30 days. Terms apply.", cta: "Open SoFi Crypto", href: "https://www.sofi.com/invite/crypto?gcp=8a977251-26b0-4b9f-893d-a92914a4b6cd&isAliasGcp=false&siid=d62e9500-1c95-4842-a998-ba741afae431" },
    { id: "uphold", accent: "#7ec8ff", badge: "WALLET", title: "Uphold", blurb: "Easy, low-cost trading â€” open an account with this referral.", cta: "Create Uphold account", href: "https://wallet.uphold.com/signup?referral=4af5b089e9&campaign=uw_p_d_w_acq_raf&utm_source=raf&utm_medium=referafriend" },
    { id: "amazon", accent: "#ff9900", badge: "SHOP", title: "Amazon picks", blurb: "Gear that fits the Pulse â€” tag plotpulsewe00-20 supports the archive.", cta: "Shop Amazon", href: "https://www.amazon.com/?tag=plotpulsewe00-20" },
    { id: "prime", accent: "#ff9900", badge: "PRIME", title: "Amazon Prime", blurb: "Fast shipping and more â€” affiliate link supports Plot-Pulse.", cta: "Get Prime", href: "https://amzn.to/4A3VRjR" },
    { id: "audible", accent: "#ff9900", badge: "LISTEN", title: "Audible", blurb: "Books & Originals for the dark hours.", cta: "Browse Audible", href: "https://amzn.to/4iStHSz" },
    { id: "splinter", accent: "#e0b15a", badge: "PLAY", title: "Splinterlands", blurb: "Free-to-play card battles. 500 Credits when you buy a Spellbook via this link.", cta: "Play Splinterlands", href: "https://splinterlands.com/register?ref=itzninjafool" },
    { id: "scrambly", accent: "#ff3355", badge: "EARN", title: "Scrambly", blurb: "Referrals when friends withdraw $1. Promo I26KTJ8J74BR.", cta: "Open Scrambly", href: "https://go.scrambly.io/lOxbCW" },
    { id: "shop", accent: "#e06a28", badge: "MERCH", title: "Plot-Pulse Shop", blurb: "Official apparel â€” Dead Internet hoodie and more.", cta: "Open Shop", href: "https://plot-pulse.com/shop/" }
  ];

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function cardHtml(ad) {
    return (
      '<div class="pp-lab-ad-card pp-aff-card" data-pp-ad="' + ad.id + '" data-pp-aff="1">' +
      '<a href="' + ad.href + '" target="_blank" rel="noopener noreferrer sponsored">' +
      '<div style="position:relative;width:100%;height:72px;overflow:hidden;background:#0c0806;display:flex;align-items:center;justify-content:center;">' +
      '<div style="width:100%;height:100%;background:linear-gradient(135deg,' + ad.accent + '33,transparent 60%),#0c0806;"></div>' +
      '<div style="position:absolute;top:4px;left:4px;background:' + ad.accent + ';color:#000;font-size:0.55rem;font-weight:700;padding:1px 5px;border-radius:3px;letter-spacing:0.06em;">' + escapeHtml(ad.badge) + "</div>" +
      "</div>" +
      '<div style="padding:0.45rem;display:flex;flex-direction:column;gap:3px;flex:1;justify-content:space-between;">' +
      "<div><strong style=\"display:block;font-size:0.7rem;color:#f3ead8;\">" + escapeHtml(ad.title) + "</strong>" +
      '<p style="font-size:0.58rem;color:#a89884;margin:2px 0 0;line-height:1.3;">' + escapeHtml(ad.blurb) + "</p></div>" +
      '<div style="width:100%;padding:4px 0;background:' + ad.accent + ';color:#000;font-size:0.62rem;font-weight:700;border-radius:3px;text-align:center;">' + escapeHtml(ad.cta) + "</div>" +
      "</div></a></div>"
    );
  }

  function tiltCardHtml() {
    return (
      '<div class="pp-lab-ad-card pp-packrip-card" data-pp-ad="tilt-rips" data-pp-packrip="1">' +
      '<a href="https://tiltrips.com/r/MFL-PLOTPULSE/" target="_blank" rel="noopener noreferrer sponsored" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;height:100%;">' +
      '<div style="position:relative;width:100%;height:110px;overflow:hidden;background:#0c0806;">' +
      '<img src="https://plot-pulse.com/wp-content/themes/plot-pulse/assets/ads/tilt-rips-mfl.jpg" alt="Tilt Rips pack break" style="width:100%;height:100%;object-fit:cover;">' +
      '<div style="position:absolute;top:4px;left:4px;background:#00d2ff;color:#000;font-size:0.55rem;font-weight:700;padding:1px 5px;border-radius:3px;">PROMO PACK FREE</div>' +
      '<div style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.75);color:#00d2ff;font-size:0.55rem;font-family:monospace;padding:1px 4px;border-radius:3px;">TILT</div>' +
      "</div>" +
      '<div style="padding:0.45rem;display:flex;flex-direction:column;gap:3px;flex:1;justify-content:space-between;">' +
      '<div><div style="font-size:0.62rem;font-weight:700;color:#e06a28;margin-bottom:2px;">TILT RIPS // MFL-PLOTPULSE</div>' +
      '<strong style="display:block;font-size:0.72rem;color:#f3ead8;font-family:Fraunces,Georgia,serif;line-height:1.2;">Rip real cards. Feel the chase.</strong>' +
      '<p style="font-size:0.56rem;color:#a89884;margin:2px 0 0;line-height:1.3;">Physical cards inside digital packs. Sell back ~90%, vault, or ship. 18+.</p></div>' +
      '<div style="width:100%;padding:4px 0;background:#00d2ff;color:#000;font-size:0.65rem;font-weight:700;border-radius:3px;text-align:center;">Claim Your Free Pack</div>' +
      '<div style="font-size:0.5rem;color:#8a7a68;margin-top:2px;">18+. Affiliate link. Plot-Pulse may earn if you sign up.</div>' +
      "</div></a></div>"
    );
  }

  function gotyaCardHtml() {
    return (
      '<div class="pp-lab-ad-card pp-packrip-card" data-pp-ad="gotya" data-pp-packrip="1">' +
      '<a href="https://gotya.com/free-pack?ref=15201CAD" target="_blank" rel="noopener noreferrer sponsored" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;height:100%;">' +
      '<div style="position:relative;width:100%;height:110px;overflow:hidden;background:linear-gradient(155deg,#1a0e08,#080604 55%,#120c08);display:flex;align-items:center;justify-content:center;">' +
      '<div style="font-size:1.7rem;letter-spacing:0.08em;color:#e06a28;font-weight:800;font-family:Fraunces,Georgia,serif;">GOTYA</div>' +
      '<div style="position:absolute;top:4px;left:4px;background:#e06a28;color:#000;font-size:0.55rem;font-weight:700;padding:1px 5px;border-radius:3px;">PROMO PACK FREE</div>' +
      '<div style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.75);color:#e06a28;font-size:0.55rem;font-family:monospace;padding:1px 4px;border-radius:3px;">GOTYA</div>' +
      "</div>" +
      '<div style="padding:0.45rem;display:flex;flex-direction:column;gap:3px;flex:1;justify-content:space-between;">' +
      '<div><strong style="display:block;font-size:0.72rem;color:#f3ead8;font-family:Fraunces,Georgia,serif;line-height:1.2;">Rip a free $10 pack. Keep what you pull.</strong>' +
      '<p style="font-size:0.56rem;color:#a89884;margin:2px 0 0;line-height:1.3;">Real vaulted cards. No deposit to rip the first pack.</p>' +
      '<p style="font-size:0.5rem;color:#8a7a68;margin:3px 0 0;line-height:1.3;">Shipping a free pull home unlocks after first deposit; cash-out starts at $25.</p></div>' +
      '<div style="width:100%;padding:4px 0;background:#e06a28;color:#000;font-size:0.65rem;font-weight:700;border-radius:3px;text-align:center;">Rip a free pack</div>' +
      '<div style="font-size:0.5rem;color:#8a7a68;margin-top:2px;">18+. Affiliate link. Plot-Pulse may earn if you sign up.</div>' +
      "</div></a></div>"
    );
  }

  function ensureDisclose(rail) {
    if (!rail || rail.querySelector(".pp-aff-disclose")) return;
    var d = document.createElement("div");
    d.className = "pp-aff-disclose";
    d.textContent = "Some links are affiliates. We may earn a commission. 18+ where noted.";
    rail.insertBefore(d, rail.firstChild);
  }

  function stripJunk(rail) {
    if (!rail) return;
    rail.querySelectorAll(".pp-lab-ad-card").forEach(function (el) {
      if (el.getAttribute("data-pp-aff") === "1") return;
      if (el.getAttribute("data-pp-packrip") === "1") return;
      if (el.closest && el.closest(".pp-packrip-slot")) return;
      var html = el.innerHTML || "";
      if (/orbital-lab|Orbital Graveyard|vault-alpha/i.test(html) || el.getAttribute("data-pp-ad") === "orbital-lab") {
        el.remove();
        return;
      }
      // remove legacy static tilt (replaced by pack-rip slot)
      if (/tiltrips|tilt-rips/i.test(html) && !el.getAttribute("data-pp-packrip")) {
        el.remove();
      }
    });
    rail.querySelectorAll(".pp-lab-ad-card:not([data-pp-aff='1']):not([data-pp-packrip]):not(.pp-packrip-slot)").forEach(function (el) {
      if (el.classList.contains("pp-packrip-slot")) return;
      el.style.display = "none";
    });
  }

  function mountPackRip(rail) {
    if (!rail) return;
    if (rail.querySelector(".pp-packrip-slot")) return;
    ensureDisclose(rail);
    var slot = document.createElement("div");
    slot.className = "pp-lab-ad-card pp-packrip-slot";
    slot.setAttribute("data-pp-ad", "packrip-rotate");
    slot.setAttribute("data-pp-packrip", "1");
    slot.innerHTML = tiltCardHtml() + gotyaCardHtml();
    rail.insertBefore(slot, rail.firstChild.nextSibling && rail.firstChild.classList.contains("pp-aff-disclose") ? rail.firstChild.nextSibling : rail.firstChild);
    var cards = slot.querySelectorAll(".pp-packrip-card");
    var i = 0;
    function paint() {
      cards.forEach(function (c, idx) { c.classList.toggle("is-on", idx === i); });
      i = (i + 1) % cards.length;
    }
    paint();
    setInterval(paint, 7000);
  }

  function mountRail(rail, slice) {
    if (!rail) return [];
    stripJunk(rail);
    rail.querySelectorAll('[data-pp-aff="1"]').forEach(function (el) { el.remove(); });
    var nodes = [];
    slice.forEach(function (ad) {
      var wrap = document.createElement("div");
      wrap.innerHTML = cardHtml(ad);
      var node = wrap.firstElementChild;
      rail.appendChild(node);
      nodes.push(node);
    });
    return nodes;
  }

  function rotate(nodes, showCount) {
    if (!nodes.length) return;
    var i = 0;
    function paint() {
      nodes.forEach(function (n, idx) {
        var on = false;
        for (var k = 0; k < showCount; k++) {
          if ((i + k) % nodes.length === idx) on = true;
        }
        n.classList.toggle("is-on", on);
      });
      i = (i + 1) % nodes.length;
    }
    paint();
    setInterval(paint, 7000);
  }

  function run() {
    document.querySelectorAll('[data-pp-ad="orbital-lab"]').forEach(function (el) { el.remove(); });
    var left = document.querySelector(".pp-lab-ad-rail-left");
    var right = document.querySelector(".pp-lab-ad-rail-right");
    mountPackRip(left || right);
    var leftAds = ADS.filter(function (_, i) { return i % 2 === 0; });
    var rightAds = ADS.filter(function (_, i) { return i % 2 === 1; });
    if (leftAds.length < 3) leftAds = ADS.slice(0, 5);
    if (rightAds.length < 3) rightAds = ADS.slice(4);
    var L = mountRail(left, leftAds);
    var R = mountRail(right, rightAds);
    rotate(L, 2);
    rotate(R, 2);
    document.documentElement.setAttribute("data-" + MARKER, "1");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
  setTimeout(run, 500);
  setTimeout(run, 1500);
  setTimeout(function () {
    document.querySelectorAll('[data-pp-ad="orbital-lab"]').forEach(function (el) { el.remove(); });
  }, 2000);
})();
