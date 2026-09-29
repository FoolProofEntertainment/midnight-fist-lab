(() => {
  "use strict";

  window.midnightFistBoot = function (mode) {
    window.__midnightFistBootQueue = window.__midnightFistBootQueue || [];
    window.__midnightFistBootQueue.push(mode);
  };

  const root = document.querySelector(".pp-midnight-fist-lab, .shell") || document;
  const query = (selector) => root.querySelector(selector);
  const canvas = query("#game") || document.querySelector("#game");
  if (!canvas) {
    console.error("Midnight Fist: #game canvas not found.");
    return;
  }
  const ctx = canvas.getContext("2d");
  const startButton = query("#start-button");
  const continueButton = query("#continue-button");
  const selectFighterButton = query("#select-fighter-button");
  const createFighterButton = query("#create-fighter-button");
  const backToSplashButton = query("#back-to-splash");
  const fighterStepLayout = query("#fighter-step-layout");
  const arenaStepLayout = query("#arena-step-layout");
  const sessionNotice = query("#session-notice");
  const selectScreenTitle = query("#select-screen-title");
  const message = query("#message");
  const matchActions = query("#match-actions");
  const matchContinueButton = query("#match-continue");
  const matchRetryButton = query("#match-retry");
  const matchMenuButton = query("#match-menu");
  const gameWindow = query("#game-window");
  const startupScreen = query("#startup-screen");
  const startupContinueButton = query("#startup-continue");
  const assetLoadingScreen = query("#asset-loading-screen");
  const splashScreen = query("#splash-screen");
  const selectScreen = query("#select-screen");
  const gameHud = query("#game-hud");
  const gameControls = query("#game-controls");
  const riftalityButton = query("#riftality-button");
  const arenaPicker = query("#arena-picker");
  const arenaWalkTest = query("#arena-walk-test");
  const arenaLocationStatus = query("#arena-location-status");
  const arenaLocateButton = query("#arena-locate-button");
  const arenaSimulateButton = query("#arena-simulate-button");
  const arenaRadar = query("#arena-radar");
  const nearbyArenaButton = query("#nearby-arena-button");
  const nearbyArenaDistance = query("#nearby-arena-distance");

  const ui = {
    playerName: query("#player-name"),
    enemyName: query("#enemy-name"),
    playerHealth: query("#player-health"),
    enemyHealth: query("#enemy-health"),
    playerMeter: query("#player-meter"),
    enemyMeter: query("#enemy-meter"),
    playerCombo: query("#player-combo"),
    enemyCombo: query("#enemy-combo"),
    roundState: query("#round-state"),
    timer: query("#timer"),
    rosterGrid: query("#roster-grid"),
    rosterMatchup: query("#roster-matchup"),
    builderPanel: query("#fighter-builder"),
    builderName: query("#builder-name"),
    builderBody: query("#builder-body"),
    builderHair: query("#builder-hair"),
    builderFacialHair: query("#builder-facial-hair"),
    builderShirt: query("#builder-shirt"),
    builderPants: query("#builder-pants"),
    builderFace: query("#builder-face"),
    builderMask: query("#builder-mask"),
    builderRiftality: query("#builder-riftality"),
    builderSkin: query("#builder-skin"),
    builderHairColor: query("#builder-hair-color"),
    builderGloves: query("#builder-gloves"),
    builderTrunks: query("#builder-trunks"),
    builderAccent: query("#builder-accent"),
    builderBoots: query("#builder-boots"),
    builderMeter: query("#builder-meter"),
    builderStyle: query("#builder-style"),
    builderPreview: query("#builder-preview"),
    builderPreviewCanvas: query("#builder-preview-canvas"),
    builderPreviewName: query("#builder-preview-name"),
    builderPreviewMeta: query("#builder-preview-meta"),
    builderRiftalityMeta: query("#builder-riftality-meta"),
    builderRiftalityCanvas: query("#builder-riftality-canvas"),
    builderRiftalityColors: query("#builder-riftality-colors"),
    builderRiftalityMap: query("#builder-riftality-map"),
    rosterPreview: query("#roster-preview"),
    rosterPreviewCanvas: query("#roster-preview-canvas"),
    rosterPreviewImg: query("#roster-preview-img"),
    rosterPreviewName: query("#roster-preview-name"),
    rosterPreviewMeta: query("#roster-preview-meta"),
    builderPreviewImg: query("#builder-preview-img"),
    builderRandom: query("#builder-random"),
    builderReset: query("#builder-reset"),
  };

  const W = canvas.width;
  const H = canvas.height;
  const PREVIEW_BASE_W = 180;
  const PREVIEW_BASE_H = 210;
  const BUILDER_PREVIEW_W = 240;
  const BUILDER_PREVIEW_H = 280;

  function preparePreviewCanvas(targetCanvas, size) {
    if (!targetCanvas) return null;
    const stage = targetCanvas.parentElement;
    const stageBox = stage?.getBoundingClientRect();
    const width = size?.width || Math.max(PREVIEW_BASE_W, Math.round(stageBox?.width || PREVIEW_BASE_W));
    const height = size?.height || Math.max(PREVIEW_BASE_H, Math.round(width * (7 / 6)));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    targetCanvas.width = Math.round(width * dpr);
    targetCanvas.height = Math.round(height * dpr);
    targetCanvas.style.width = `${width}px`;
    targetCanvas.style.height = `${height}px`;
    const c = targetCanvas.getContext("2d");
    if (!c) return null;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: c, width, height };
  }

  function syncPreviewDisplay(targetCanvas, imgEl, previewEl, usedGraphic, canvasOnly) {
    if (!targetCanvas) return;
    if (previewEl) previewEl.classList.toggle("is-graphic", Boolean(usedGraphic));
    if (canvasOnly || !imgEl) {
      targetCanvas.hidden = false;
      if (imgEl) imgEl.hidden = true;
      return;
    }
    try {
      imgEl.src = targetCanvas.toDataURL("image/png");
      imgEl.hidden = false;
      targetCanvas.hidden = true;
    } catch (_) {
      imgEl.hidden = true;
      targetCanvas.hidden = false;
    }
  }

  let previewRedrawFrame = 0;
  function schedulePreviewRedraw() {
    if (previewRedrawFrame) cancelAnimationFrame(previewRedrawFrame);
    previewRedrawFrame = requestAnimationFrame(() => {
      previewRedrawFrame = 0;
      if (selectScreen?.hidden) return;
      if (selectMode === "create") renderBuilderPreview();
      else renderRosterPreview();
    });
  }

  let builderUpdateFrame = 0;
  let pendingBuilderFullSync = false;
  let pendingBuilderColorOnly = false;
  function scheduleBuilderUpdate(options = {}) {
    pendingBuilderFullSync = pendingBuilderFullSync || Boolean(options.full);
    pendingBuilderColorOnly = pendingBuilderColorOnly || Boolean(options.colorOnly);
    if (builderUpdateFrame) return;
    builderUpdateFrame = requestAnimationFrame(() => {
      builderUpdateFrame = 0;
      const fullSync = pendingBuilderFullSync;
      const colorOnly = pendingBuilderColorOnly && !fullSync;
      pendingBuilderFullSync = false;
      pendingBuilderColorOnly = false;
      updateCustomFromBuilder(fullSync, { skipClothingThumbs: colorOnly });
    });
  }
  const FLOOR = 438;
  const LEFT_WALL = 48;
  const RIGHT_WALL = W - 48;

  function gameAudio() {
    return window.MidnightFistAudio || null;
  }

  function uiClick() {
    gameAudio()?.playClick?.();
    gameAudio()?.unlock?.();
  }

  function setAudioMode(mode) {
    gameAudio()?.setMode?.(mode);
  }

  function softAudioUnlock() {
    try {
      gameAudio()?.unlock?.();
    } catch (_) {
      // Mute / missing audio module must never throw.
    }
  }
  // Impact VFX atlas (feelpack) — image optional; missing asset never breaks fight.
  const IMPACT_VFX_ATLAS_URL = (typeof window !== "undefined" && window.MIDNIGHT_FIST_MANIFEST?.vfxAtlas)
    || "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-impact-vfx-atlas-v02.png";
  const IMPACT_VFX_STRIPS = {"fx_hit":{"frameCount":6,"loop":false,"anchor":"center","frames":[{"x":2,"y":2,"w":64,"h":64,"anchorX":32,"anchorY":32},{"x":66,"y":2,"w":64,"h":64,"anchorX":32,"anchorY":32},{"x":130,"y":2,"w":64,"h":64,"anchorX":32,"anchorY":32},{"x":194,"y":2,"w":64,"h":64,"anchorX":32,"anchorY":32},{"x":258,"y":2,"w":64,"h":64,"anchorX":32,"anchorY":32},{"x":322,"y":2,"w":64,"h":64,"anchorX":32,"anchorY":32}]},"fx_guard":{"frameCount":4,"loop":false,"anchor":"center","frames":[{"x":2,"y":68,"w":64,"h":64,"anchorX":32,"anchorY":32},{"x":66,"y":68,"w":64,"h":64,"anchorX":32,"anchorY":32},{"x":130,"y":68,"w":64,"h":64,"anchorX":32,"anchorY":32},{"x":194,"y":68,"w":64,"h":64,"anchorX":32,"anchorY":32}]},"fx_riftality":{"frameCount":8,"loop":false,"anchor":"center","frames":[{"x":2,"y":134,"w":128,"h":128,"anchorX":64,"anchorY":64},{"x":130,"y":134,"w":128,"h":128,"anchorX":64,"anchorY":64},{"x":258,"y":134,"w":128,"h":128,"anchorX":64,"anchorY":64},{"x":386,"y":134,"w":128,"h":128,"anchorX":64,"anchorY":64},{"x":514,"y":134,"w":128,"h":128,"anchorX":64,"anchorY":64},{"x":642,"y":134,"w":128,"h":128,"anchorX":64,"anchorY":64},{"x":770,"y":134,"w":128,"h":128,"anchorX":64,"anchorY":64},{"x":898,"y":134,"w":128,"h":128,"anchorX":64,"anchorY":64}]},"fx_ko":{"frameCount":6,"loop":false,"anchor":"center-low","frames":[{"x":2,"y":264,"w":96,"h":96,"anchorX":48,"anchorY":56},{"x":98,"y":264,"w":96,"h":96,"anchorX":48,"anchorY":56},{"x":194,"y":264,"w":96,"h":96,"anchorX":48,"anchorY":56},{"x":290,"y":264,"w":96,"h":96,"anchorX":48,"anchorY":56},{"x":386,"y":264,"w":96,"h":96,"anchorX":48,"anchorY":56},{"x":482,"y":264,"w":96,"h":96,"anchorX":48,"anchorY":56}]}};
  const impactVfxAtlas = { image: null, ready: false, failed: false, src: IMPACT_VFX_ATLAS_URL };
  (function loadImpactVfxAtlas() {
    try {
      if (typeof Image === "undefined") { impactVfxAtlas.failed = true; return; }
      const image = new Image();
      image.onload = () => { impactVfxAtlas.ready = true; };
      image.onerror = () => { impactVfxAtlas.failed = true; };
      image.src = IMPACT_VFX_ATLAS_URL;
      impactVfxAtlas.image = image;
    } catch (_) {
      impactVfxAtlas.failed = true;
    }
  })();

  function spawnImpactVfx(stripName, x, y, opts = {}) {
    try {
      const strip = IMPACT_VFX_STRIPS[stripName];
      if (!strip || !strip.frames || !strip.frames.length) return;
      const life = opts.life != null ? opts.life : (stripName === "fx_guard" ? 50 : stripName === "fx_hit" ? 110 : stripName === "fx_riftality" ? 520 : 420);
      const scale = opts.scale != null ? opts.scale : (stripName === "fx_riftality" ? 1.75 : stripName === "fx_ko" ? 1.35 : 1);
      impactVfx.push({
        strip: stripName,
        frame: 0,
        x,
        y,
        t: 0,
        life,
        scale,
      });
      if (impactVfx.length > 24) impactVfx.shift();
    } catch (_) {
      // VFX optional; never break combat.
    }
  }

  function spawnHitImpactVfx(attacker, defender, data, sourceX, guarded) {
    try {
      const cx = sourceX != null ? sourceX : defender.x;
      const cy = (defender.y - (data?.centerY || (defender.h || 112) * 0.55));
      spawnImpactVfx(guarded ? "fx_guard" : "fx_hit", cx, cy, {
        life: guarded ? 50 : 110,
        scale: guarded ? 0.95 : (data?.damage >= 10 ? 1.2 : 1),
      });
      if (!guarded) {
        const attackType = attacker?.action?.type || "";
        const heavy =
          attackType === "heavy" ||
          attackType === "crouchKick" ||
          attackType === "crush" ||
          attackType === "beam" ||
          attackType === "upper" ||
          (data?.damage || 0) >= 10;
        if (heavy) spawnSweatStarJuice(cx, cy, true);
      }
    } catch (_) {}
  }

  function spawnKoImpactVfx(fighter) {
    try {
      if (!fighter) return;
      // center-low: slightly below feet / near FLOOR
      spawnImpactVfx("fx_ko", fighter.x, (fighter.y || FLOOR) + 6, { life: 420, scale: 1.35 });
      spawnScreenFlashJuice();
    } catch (_) {}
  }

  function spawnRiftalityImpactVfx() {
    try {
      const victim = enemy;
      if (!victim) return;
      spawnImpactVfx("fx_riftality", victim.x, victim.y - (victim.h || 112) * 0.45, { life: 520, scale: 1.75 });
      spawnScreenFlashJuice();
    } catch (_) {}
  }

  function updateImpactVfx(dt) {
    try {
      for (const fx of impactVfx) {
        fx.t += dt;
        const strip = IMPACT_VFX_STRIPS[fx.strip];
        const n = strip?.frames?.length || 1;
        const progress = Math.min(0.999, fx.t / Math.max(1, fx.life));
        fx.frame = Math.min(n - 1, Math.floor(progress * n));
      }
      impactVfx = impactVfx.filter((fx) => fx.t < fx.life);
    } catch (_) {
      impactVfx = [];
    }
  }

  function drawImpactVfx() {
    try {
      if (!impactVfxAtlas.ready || !impactVfxAtlas.image || impactVfxAtlas.failed) return;
      const img = impactVfxAtlas.image;
      for (const fx of impactVfx) {
        const strip = IMPACT_VFX_STRIPS[fx.strip];
        const fr = strip?.frames?.[fx.frame];
        if (!fr) continue;
        const fade = fx.t > fx.life * 0.7 ? 1 - (fx.t - fx.life * 0.7) / (fx.life * 0.3) : 1;
        const dw = fr.w * fx.scale;
        const dh = fr.h * fx.scale;
        const dx = fx.x - fr.anchorX * fx.scale;
        const dy = fx.y - fr.anchorY * fx.scale;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, fade));
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, fr.x, fr.y, fr.w, fr.h, dx, dy, dw, dh);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    } catch (_) {
      // never break render
    }
  }

  // --- Combat juice strips (v02) — soft-fail if CDN images missing ---
  const JUICE_CDN_BASE = (typeof window !== "undefined" && window.MIDNIGHT_FIST_MANIFEST?.juiceCdnBase)
    || "https://plot-pulse.com/wp-content/uploads/2026/09/";
  const JUICE_STRIPS = {
    fx_dust: {
      url: JUICE_CDN_BASE + "mfl-juice-dust-strip.png",
      frameCount: 4, cellW: 48, cellH: 48, life: 180,
      anchorX: 24, anchorY: 30, blend: "source-over", opacity: 0.9,
    },
    fx_sweat_star: {
      url: JUICE_CDN_BASE + "mfl-juice-sweat-star-strip.png",
      frameCount: 3, cellW: 32, cellH: 32, life: 140,
      anchorX: 16, anchorY: 16, blend: "lighter", opacity: 0.95,
    },
    fx_screen_flash: {
      url: JUICE_CDN_BASE + "mfl-juice-screen-flash-strip.png",
      frameCount: 8, cellW: 96, cellH: 54, life: 160,
      anchorX: 48, anchorY: 27, blend: "screen", opacity: 0.55, fullCanvas: true,
    },
  };
  const juiceAssets = {};
  let juiceSprites = [];
  (function loadJuiceAssets() {
    try {
      if (typeof Image === "undefined") return;
      for (const [id, def] of Object.entries(JUICE_STRIPS)) {
        const slot = { image: null, ready: false, failed: false, src: def.url };
        juiceAssets[id] = slot;
        try {
          const image = new Image();
          image.onload = () => { slot.ready = true; };
          image.onerror = () => { slot.failed = true; };
          image.src = def.url;
          slot.image = image;
        } catch (_) {
          slot.failed = true;
        }
      }
    } catch (_) {}
  })();

  function spawnJuice(stripName, x, y, opts = {}) {
    try {
      const def = JUICE_STRIPS[stripName];
      if (!def) return;
      const life = opts.life != null ? opts.life : def.life;
      const scale = opts.scale != null ? opts.scale : 1;
      juiceSprites.push({
        strip: stripName,
        frame: 0,
        x, y,
        t: 0,
        life,
        scale,
        fullCanvas: !!def.fullCanvas,
        opacity: opts.opacity != null ? opts.opacity : def.opacity,
        blend: opts.blend || def.blend,
      });
      if (juiceSprites.length > 32) juiceSprites.shift();
    } catch (_) {}
  }

  function spawnDustJuice(fighter, scale = 1) {
    try {
      if (!fighter) return;
      spawnJuice("fx_dust", fighter.x, (fighter.y || FLOOR) + 4, { life: 180, scale });
    } catch (_) {}
  }

  function spawnSweatStarJuice(x, y, heavy) {
    try {
      const n = heavy ? 2 : 1;
      for (let i = 0; i < n; i += 1) {
        spawnJuice("fx_sweat_star", x + (Math.random() - 0.5) * 28, y + (Math.random() - 0.5) * 18, {
          life: 120 + Math.random() * 40,
          scale: heavy ? 1.15 : 0.9,
        });
      }
    } catch (_) {}
  }

  function spawnScreenFlashJuice() {
    try {
      spawnJuice("fx_screen_flash", W / 2, H / 2, { life: 160, scale: 1, opacity: 0.55, blend: "screen" });
    } catch (_) {}
  }

  function updateJuiceSprites(dt) {
    try {
      for (const fx of juiceSprites) {
        fx.t += dt;
        const def = JUICE_STRIPS[fx.strip];
        const n = def?.frameCount || 1;
        const progress = Math.min(0.999, fx.t / Math.max(1, fx.life));
        fx.frame = Math.min(n - 1, Math.floor(progress * n));
      }
      juiceSprites = juiceSprites.filter((fx) => fx.t < fx.life);
    } catch (_) {
      juiceSprites = [];
    }
  }

  function drawJuiceSprites() {
    try {
      for (const fx of juiceSprites) {
        const def = JUICE_STRIPS[fx.strip];
        const slot = juiceAssets[fx.strip];
        if (!def || !slot || !slot.ready || slot.failed || !slot.image) continue;
        const fade = fx.t > fx.life * 0.65 ? 1 - (fx.t - fx.life * 0.65) / (fx.life * 0.35) : 1;
        ctx.save();
        ctx.globalCompositeOperation = fx.blend || def.blend || "source-over";
        ctx.globalAlpha = Math.max(0, Math.min(1, (fx.opacity != null ? fx.opacity : def.opacity) * fade));
        ctx.imageSmoothingEnabled = false;
        const sx = fx.frame * def.cellW;
        if (fx.fullCanvas || def.fullCanvas) {
          ctx.drawImage(slot.image, sx, 0, def.cellW, def.cellH, 0, 0, W, H);
        } else {
          const dw = def.cellW * fx.scale;
          const dh = def.cellH * fx.scale;
          const dx = fx.x - def.anchorX * fx.scale;
          const dy = fx.y - def.anchorY * fx.scale;
          ctx.drawImage(slot.image, sx, 0, def.cellW, def.cellH, dx, dy, dw, dh);
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    } catch (_) {}
  }

  // --- Arena lighting overlays (v02) — soft-fail ---
  const ARENA_LIGHT_CDN_BASE = (typeof window !== "undefined" && window.MIDNIGHT_FIST_MANIFEST?.arenaLightCdnBase)
    || "https://plot-pulse.com/wp-content/uploads/2026/09/";
  const ARENA_LIGHT_FILES = {
    vignette: "mfl-arena-vignette-soft.png",
    rimCyan: "mfl-arena-rim-cyan.png",
    rimAmber: "mfl-arena-rim-amber.png",
    groundShadow: "mfl-arena-ground-contact-shadow.png",
    motes: "mfl-arena-dust-motes-sheet.png",
    crt: "mfl-arena-flicker-crt-soft.png",
    lutArchiveBay6: "mfl-arena-lut-archive-bay-6.png",
    lutHauntedStadium: "mfl-arena-lut-haunted-stadium.png",
    lutMusicFestival: "mfl-arena-lut-music-festival.png",
    lutRooftopArcade: "mfl-arena-lut-rooftop-arcade.png",
  };
  // Amber rim for warm / outdoor / festival arenas; cyan for cool / neon / archive.
  const ARENA_RIM_AMBER = new Set([
    "haunted-stadium", "music-festival", "temple", "warehouse", "creeping-antler-woods", "metro",
  ]);
  const ARENA_LUT_KEY = {
    "archive-bay-6": "lutArchiveBay6",
    "haunted-stadium": "lutHauntedStadium",
    "music-festival": "lutMusicFestival",
    "rooftop-arcade": "lutRooftopArcade",
  };
  const arenaLightAssets = {};
  (function loadArenaLightAssets() {
    try {
      if (typeof Image === "undefined") return;
      for (const [key, file] of Object.entries(ARENA_LIGHT_FILES)) {
        const url = ARENA_LIGHT_CDN_BASE + file;
        const slot = { image: null, ready: false, failed: false, src: url };
        arenaLightAssets[key] = slot;
        try {
          const image = new Image();
          image.onload = () => { slot.ready = true; };
          image.onerror = () => { slot.failed = true; };
          image.src = url;
          slot.image = image;
        } catch (_) {
          slot.failed = true;
        }
      }
    } catch (_) {}
  })();

  function drawArenaLightLayer(slot, blend, opacity) {
    try {
      if (!slot || !slot.ready || slot.failed || !slot.image) return;
      ctx.save();
      ctx.globalCompositeOperation = blend || "source-over";
      ctx.globalAlpha = opacity;
      ctx.drawImage(slot.image, 0, 0, W, H);
      ctx.restore();
    } catch (_) {}
  }

  function drawArenaLightingPre() {
    // Z: after BG, before fighters — LUT → vignette → rim → (ground shadows drawn separately)
    try {
      const arena = typeof getArena === "function" ? getArena() : null;
      const arenaId = arena?.id || selectedArenaId || "";
      const lutKey = ARENA_LUT_KEY[arenaId];
      if (lutKey) drawArenaLightLayer(arenaLightAssets[lutKey], "multiply", 1);
      drawArenaLightLayer(arenaLightAssets.vignette, "multiply", 0.85);
      const amber = ARENA_RIM_AMBER.has(arenaId);
      drawArenaLightLayer(
        amber ? arenaLightAssets.rimAmber : arenaLightAssets.rimCyan,
        "screen",
        amber ? 0.3 : 0.35,
      );
    } catch (_) {}
  }

  function drawArenaGroundShadows() {
    try {
      const slot = arenaLightAssets.groundShadow;
      if (!slot || !slot.ready || slot.failed || !slot.image) return;
      const drawOne = (f) => {
        if (!f) return;
        const sw = 128, sh = 48;
        const scaleX = 1.05 + Math.min(0.35, Math.abs(f.vx || 0) / 900);
        const dw = sw * scaleX;
        const dh = sh;
        const dx = f.x - dw / 2;
        const dy = (f.grounded ? (f.y || FLOOR) : FLOOR) - dh * 0.35;
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.globalAlpha = f.grounded ? 0.55 : 0.28;
        ctx.drawImage(slot.image, 0, 0, sw, sh, dx, dy, dw, dh);
        ctx.restore();
      };
      drawOne(player);
      drawOne(enemy);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    } catch (_) {}
  }

  function drawArenaLightingPost() {
    // Z: after fighters/VFX — motes → CRT
    try {
      const motes = arenaLightAssets.motes;
      if (motes && motes.ready && !motes.failed && motes.image) {
        const fw = 480, fh = 270, frames = 4;
        const frame = Math.floor((game.time || 0) * 6) % frames;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.4;
        ctx.drawImage(motes.image, frame * fw, 0, fw, fh, 0, 0, W, H);
        ctx.restore();
      }
      drawArenaLightLayer(arenaLightAssets.crt, "overlay", 0.2);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    } catch (_) {}
  }

  const GRAVITY = 2300;
  const SPRITE_COLS = 9;
  const SPRITE_ROWS = 4;

  const held = new Set();
  const inputBuffer = [];
  let attackBuffer = null;
  let attackBufferTime = 0;
  const ATTACK_BUFFER_MS = 117; // feelpack: ~7 frames @ 60Hz (was 650)
  let builderPreviewRivalId = "";
  let cachedBuilderPreviewKey = "";
  let cachedBuilderPreviewCharacter = null;
  let menuRenderAccum = 0;
  const virtual = {
    left: false,
    right: false,
    down: false,
    block: false,
  };

  const editorProject = readEditorProject();
  const plotPulseRoster = [
    fighter("pp-mara", "Mara", "QA Lead", "lean", "bob", "tank", "QA Clear", {
      skin: "#d4a07a", skinDark: "#8f5a3d", hair: "#1a2228", accent: "#5ce0ff", gloves: "#c92e32", trunks: "#1e3a5f", trunksDark: "#0f2238", boots: "#2a2f36", white: "#e8edf2", meter: "#5ce0ff",
    }),
    fighter("noah", "Noah", "Bug Hunter", "athlete", "crop", "jeans", "Won't Fix", {
      skin: "#c9926a", skinDark: "#7f5238", hair: "#2a2018", accent: "#8de6ff", gloves: "#b92a25", trunks: "#3d4f63", trunksDark: "#243040", boots: "#4a3826", white: "#eef2f6", meter: "#8de6ff",
    }),
    fighter("claire", "Claire", "Creature Artist", "lean", "sidepony", "arena", "Hollow Frame", {
      skin: "#e0a882", skinDark: "#a06245", hair: "#4a2858", accent: "#c8b0ff", gloves: "#a92527", trunks: "#4a2d6e", trunksDark: "#2b1844", boots: "#3a2a22", white: "#f2ebf8", meter: "#b47aff",
    }),
    fighter("eli-dev", "Eli", "Dev Crunch", "lean", "spike", "jeans", "Build Crash", {
      skin: "#c88f62", skinDark: "#855538", hair: "#1c2830", accent: "#3dff90", gloves: "#c22627", trunks: "#2f4a38", trunksDark: "#1a2b20", boots: "#2a241e", white: "#e6f5ec", meter: "#3dff90",
    }),
    fighter("eli-ransom", "Eli Ransom", "Watcher Seed", "lean", "beard", "jeans", "Spiral Seed", {
      skin: "#b87a52", skinDark: "#6f4428", hair: "#2a2218", accent: "#f0c632", gloves: "#8e3222", trunks: "#3a4a5a", trunksDark: "#1f2a36", boots: "#3a2e22", white: "#f4ead2", meter: "#f0c632",
    }),
    fighter("elena-voss", "Elena Voss", "Flood Analyst", "lean", "long", "arena", "Flood Whisper", {
      skin: "#d9a07a", skinDark: "#8f5a42", hair: "#1a2838", accent: "#6ec8ff", gloves: "#b92a25", trunks: "#1a3048", trunksDark: "#0c1a2a", boots: "#2a3440", white: "#e8f4ff", meter: "#4aa8ff",
    }),
    fighter("elias-crowe", "Elias Crowe", "Homesteader", "heavy", "beard", "jeans", "First Skin", {
      skin: "#b8845c", skinDark: "#6f4a2e", hair: "#3a2818", accent: "#6b8f4a", gloves: "#8e3222", trunks: "#3d4a32", trunksDark: "#243018", boots: "#4a3826", white: "#e8e2d4", meter: "#7bc45a",
    }),
    fighter("the-mother", "The Mother", "Entity", "skeletal", "long", "shorts", "Lights Out, Sweetheart", {
      skin: "#d8cfc0", skinDark: "#ece9e9", hair: "#e8e8e8", accent: "#e6e6e6", gloves: "#dfdddd", trunks: "#ededed", trunksDark: "#f5f5f5", boots: "#f0f0f0", white: "#0d0d0d",
    }),
    fighter("wendigo", "Wendigo", "Antler Horror", "skeletal", "spike", "bones", "Antler Peel", {
      skin: "#d8d6c9", hair: "#6b5a48", skinDark: "#7a8f68", accent: "#8fd46a", gloves: "#d8d6c9", trunks: "#11160f", trunksDark: "#050805", boots: "#0d0d0d", white: "#f5f1e6", meter: "#8fd46a",
    }),
  ];

  const permanentRosterAdditions = [
    fighter("jenny-night-signal", "Jenny // Night Signal", "Counter Glitch", "swift", "wild", "arena", "Recovered Voice", {
      skin: "#d7a98f", skinDark: "#815f58", hair: "#17191f", accent: "#78b7d8", gloves: "#f0f5f8", trunks: "#252a33", trunksDark: "#10131a", boots: "#161a22", white: "#dfe8ef", meter: "#c7f7ff",
    }),
    fighter("spar7an", "Spar7an", "Roman Spartan", "athlete", "helmet", "armor", "Legion Breaker", {
      skin: "#c98f65", skinDark: "#7d4c36", hair: "#c48b32", accent: "#8b1016", gloves: "#b47a2c", trunks: "#9f1519", trunksDark: "#4e0b0e", boots: "#5b2f1e", white: "#f4d879", meter: "#ffcf4d",
    }),
    fighter("control", "Control", "Bass Producer", "lean", "helmet", "armor", "Bass Drop Override", {
      skin: "#b7a7a0", skinDark: "#5c525a", hair: "#090b12", accent: "#b84cff", gloves: "#11131b", trunks: "#18101f", trunksDark: "#050308", boots: "#090a0f", white: "#e9fbff", meter: "#35f2ff",
    }),
    fighter("jake", "Jake", "Sports Beat", "athlete", "crop", "arena", "Fourth Down", {
      skin: "#c99068", skinDark: "#724a33", hair: "#241a14", accent: "#d6b047", gloves: "#10151d", trunks: "#12372f", trunksDark: "#071310", boots: "#15191c", white: "#f3ead2", meter: "#7df0d4",
    }),
    fighter("anthony-e1", "Anthony", "E-1 Soldier", "athlete", "crop", "fatigues", "Air Strike", {
      skin: "#b9825f", skinDark: "#6f4632", hair: "#17130f", accent: "#667a42", gloves: "#171b13", trunks: "#4d5f35", trunksDark: "#26301f", boots: "#171b16", white: "#d9d5b8", meter: "#ffb42e",
    }),
    fighter("plot-pulse-theam", "Plot-Pulse Team", "Alien Visitor", "lean", "crop", "armor", "Fleet Abduction", {
      skin: "#72e6a0", skinDark: "#247855", hair: "#10182a", accent: "#7b5cff", gloves: "#13233b", trunks: "#202a49", trunksDark: "#090d1d", boots: "#11192c", white: "#d8fff1", meter: "#5ff6ff",
    }),
    fighter("dragon-born", "Wyrm", "Draconic Warrior", "heavy", "spike", "armor", "Storm Breath", {
      skin: "#3f8d68", skinDark: "#173f34", hair: "#e5d7a5", accent: "#2172bb", gloves: "#172d3f", trunks: "#263d55", trunksDark: "#091521", boots: "#101d29", white: "#effaff", meter: "#69dfff",
    }),
  ];

  const defaultRoster = [
    ...plotPulseRoster,
    ...permanentRosterAdditions,
    fighter("rift", "Rift", "Kickboxer", "athlete", "martial", "trunks", "Rift Split", {
      skin: "#fbd0a7", skinDark: "#050505", hair: "#6b6b6b", accent: "#390cdf", gloves: "#2c07e4", trunks: "#230ae6", trunksDark: "#c5afaf", boots: "#3764cd", white: "#787878",
    }),
    fighter("tank", "Tank", "Brawler", "heavy", "bob", "jeans", "Tank Breaker", {
      skin: "#69452b", skinDark: "#613f23", hair: "#050505", accent: "#6b492e", gloves: "#ed0707", boots: "#ec0909", trunksDark: "#d0cdcd", trunks: "#0b24e5", white: "#c2c2c2", meter: "#c81919",
    }),
    fighter("marauder", "Marauder", "Street Queen", "lean", "bob", "trunks", "Five Shot Riftality", {
      skin: "#e4a06f", hair: "#1f1e1e", accent: "#0ea018", gloves: "#62500e", trunks: "#4d8118", boots: "#5f4611", white: "#ede9e9", trunksDark: "#544007",
    }),
    fighter("blitz", "Blitz", "Ponytail", "heavy", "helmet", "robe", "Blonde Bomb", {
      skin: "#eba97b", skinDark: "#55eaec", hair: "#1ab8e0", accent: "#15e55e", gloves: "#7bd3e5", trunks: "#69ecea", trunksDark: "#52e9f4", white: "#09ec82", boots: "#4ae3f7", meter: "#f4f5f5",
    }),
    fighter("ember", "Ember", "Skirmisher", "athlete", "ponytail", "armor", "Ember Snap", {
      skin: "#ecb589", hair: "#f4d22a", accent: "#fb2828", trunks: "#f71d1d", trunksDark: "#f47e10", gloves: "#e41b1b", white: "#f69309", boots: "#f41010", meter: "#e05d06",
    }),
    fighter("nyx", "Nyx", "Assassin", "lean", "sidepony", "arena", "Night Bloom", {
      skin: "#ebb89a", skinDark: "#a9378b", hair: "#f4f9a9", accent: "#631360", gloves: "#94299e", trunks: "#af55a3", white: "#f50ab6", trunksDark: "#c436aa", boots: "#db89e1",
    }),
    fighter("chrome", "Chrome", "Armored", "heavy", "helmet", "bones", "System Crash", {
      skin: "#cfcfcf", skinDark: "#d4d4d4", hair: "#d6d6d6", gloves: "#949494", trunksDark: "#b0b0b0", white: "#aebfd5", accent: "#545454", trunks: "#d1d1d1", boots: "#919191", meter: "#696969",
    }),
    fighter("king", "King", "Slugger", "heavy", "mohawk", "tank", "Crown Drop", {
      skin: "#f4d9c8", hair: "#eff312", skinDark: "#f5b2c6", accent: "#d22014", gloves: "#e04410", trunks: "#850900", trunksDark: "#0a0a0a", white: "#f9f6f6", boots: "#ba1212", meter: "#eed117",
    }),
    fighter("dragon", "Dragon", "Mythical Creature", "athlete", "martial", "gi", "Sky Feast", {
      skin: "#2ba16a", skinDark: "#60110b", hair: "#dedede", accent: "#2ba16a", gloves: "#034668", trunks: "#af1d1d", trunksDark: "#3caa7a", boots: "#33a346", white: "#f20202",
    }),
    fighter("bone", "Bone", "Undead", "skeletal", "skull", "bones", "Bone Rattle", {
      skin: "#f3f1ed", skinDark: "#f3ecec", hair: "#fafafa", accent: "#ddcfcf", gloves: "#fbf9f9", trunks: "#f6efef", trunksDark: "#f3ecec", boots: "#e9d8d8", white: "#f5f5f5", meter: "#fcfcfc",
    }),
    fighter("warden", "Warden", "Masked Ninja", "athlete", "spike", "robe", "Shadow Court", {
      skin: "#e2b28b", skinDark: "#e8c9da", hair: "#08441d", trunksDark: "#f0f4f3", gloves: "#035e26", trunks: "#075007", boots: "#353602", white: "#48391e", meter: "#f20707", accent: "#5a4220",
    }),
    fighter("valor", "Valor", "Commando", "lean", "pixie", "fatigues", "Field Order", {
      skin: "#f4852a", skinDark: "#745b25", hair: "#f4ec10", gloves: "#241e76", accent: "#e90707", trunks: "#ef0101", trunksDark: "#f2f2f8", boots: "#f00000", meter: "#ff0000", white: "#f4f1f1",
    }),
    fighter("rose", "Rose", "Rushdown", "swift", "ponytail", "armor", "Rose Rush", {
      skin: "#edae89", hair: "#644717", skinDark: "#941e90", trunks: "#ec08fd", accent: "#c328be", trunksDark: "#c115aa", gloves: "#f609ee", boots: "#750b67", white: "#410542", meter: "#c10dce",
    }),
    fighter("grit", "Grit", "Outlaw", "athlete", "wild", "fatigues", "Nuclear Option", {
      skin: "#f7b76e", hair: "#236c3c", skinDark: "#985d5d", accent: "#136c2e", gloves: "#165f22", trunks: "#34cb46", trunksDark: "#3f3608", boots: "#88704e", white: "#4c3515", meter: "#ed0202",
    }),
    fighter("john", "John", "Werewolf", "athlete", "bob", "jeans", "Moon Claw Riftality", {
      skin: "#94703d", hair: "#9f8650", skinDark: "#350303", accent: "#f4ab67", trunks: "#9a9898", trunksDark: "#5d4b4b", gloves: "#080808", white: "#f5f0f0", meter: "#f20202",
    }),
    fighter("alex", "Alex", "Detective", "swift", "mohawk", "fatigues", "Case Closed", {
      skin: "#cca985", hair: "#61450a", accent: "#44405e", gloves: "#000000", trunksDark: "#a9a7a7", trunks: "#2c2d54", boots: "#3e3c3c", skinDark: "#874040", white: "#4e422c",
    })
  ];

  const roster = mergePermanentRoster(loadEditorRoster(editorProject) || defaultRoster);

  const defaultHiddenRivals = [
    fighter("lazy", "Lazy", "Masked Drummer", "heavy", "helmet", "fatigues", "Primal Drum Solo", {
      skin: "#f08a68", skinDark: "#a8483f", hair: "#0b0710", accent: "#6b1a8f", gloves: "#c51d32", trunks: "#161018", trunksDark: "#060407", boots: "#12070b", white: "#d7b7ff", meter: "#e02746",
    }),
    fighter("ninja", "Ninja", "Ronin Samurai", "swift", "helmet", "robe", "Seven Quiet Cuts", {
      skin: "#c98d67", skinDark: "#5b241f", hair: "#050505", accent: "#b5121b", gloves: "#08080a", trunks: "#0b0b0d", trunksDark: "#030304", boots: "#050507", white: "#f2c230", meter: "#ffd43b",
    }),
    fighter("sable", "Sable", "Shadow Rival", "swift", "bob", "arena", "Sable Wins", {
      skin: "#b88a68", skinDark: "#6b4333", hair: "#111018", accent: "#7e1f32", gloves: "#15151b", trunks: "#211822", trunksDark: "#09080d", boots: "#0d0d12", white: "#d8c1a3", meter: "#d33a54",
    }),
    fighter("the-mother", "The Mother", "Entity", "skeletal", "long", "shorts", "Lights Out, Sweetheart", {
      skin: "#d8cfc0", skinDark: "#ece9e9", hair: "#e8e8e8", accent: "#e6e6e6", gloves: "#dfdddd", trunks: "#ededed", trunksDark: "#f5f5f5", boots: "#f0f0f0", white: "#0d0d0d",
    }),
    fighter("wendigo", "Wendigo", "Antler Horror", "skeletal", "spike", "bones", "Antler Peel", {
      skin: "#d8d6c9", hair: "#6b5a48", skinDark: "#7a8f68", accent: "#8fd46a", gloves: "#d8d6c9", trunks: "#11160f", trunksDark: "#050805", boots: "#0d0d0d", white: "#f5f1e6", meter: "#8fd46a",
    }),
    fighter("ice-golem", "Ice Golem", "Frozen Titan", "heavy", "spike", "bones", "Glacier Crush", {
      skin: "#b9f2ff", skinDark: "#5a94a8", hair: "#eaffff", accent: "#7fdcff", gloves: "#dffbff", trunks: "#12354a", trunksDark: "#071824", boots: "#23465a", white: "#f6ffff", meter: "#8ff4ff",
    }),
    fighter("bigfoot", "Bigfoot", "Forest Giant", "heavy", "wild", "shorts", "Timber Stomp", {
      skin: "#6b4328", skinDark: "#2d1a12", hair: "#3a2418", accent: "#7a5a2e", gloves: "#4a2c1d", trunks: "#2f3a1e", trunksDark: "#151d0e", boots: "#2b1a12", white: "#d8c6a4", meter: "#8fd46a",
    })
  ];

  const hiddenRivals = loadEditorHiddenRivals(editorProject) || defaultHiddenRivals;

  const plotPulseIds = new Set([
    "pp-mara", "noah", "claire", "eli-dev", "eli-ransom", "elena-voss", "elias-crowe", "the-mother", "wendigo",
  ]);

  const customDefaultDraft = {
    name: "Nova",
    body: "athlete",
    hairStyle: "spike",
    facialHair: "none",
    outfit: "trunks",
    shirt: "tee",
    pants: "trunks",
    faceExpression: "neutral",
    faceMask: "none",
    accessory: "none",
    riftalityId: "personal",
    riftalityLocked: false,
    progression: {
      version: 1,
      level: 1,
      xp: 0,
      upgradePoints: 0,
      stats: { punch: 0, kick: 0, rift: 0, defense: 0 },
    },
    economy: {
      version: 1,
      credits: 600,
      owned: ["starter-wraps", "starter-boots"],
      equipped: { gloves: "starter-wraps", boots: "starter-boots", core: null, accessory: null, shirt: null },
    },
    palette: {
      skin: "#d6925d",
      hair: "#101828",
      accent: "#31d7ff",
      gloves: "#e84435",
      trunks: "#2f65b3",
      boots: "#1b8c4b",
      meter: "#53ecff",
    },
  };

  const customDraftStorageKey = "midnight-fist-custom-fighter";
  const progressionStatCap = 10;
  // Training upgrades cost Rift Credits (no free live/terminal stat edits).
  const STAT_UPGRADE_RC_COST = 175;
  const FREE_SHIRTS = ["bare", "tee", "tank", "crop", "hoodie", "jacket", "arena", "armor", "gi", "bones", "robe"];
  const FREE_ACCESSORIES = ["none"];
  const fighterWinsStorageKey = "midnight-fist-fighter-wins";
  const fighterCostumesStorageKey = "midnight-fist-fighter-costumes";
  let previewGearId = null;
  const fighterGearCatalog = [
    { id: "starter-wraps", name: "Training Wraps", slot: "gloves", price: 0, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "Standard issue. No modifiers.", color: null, modifiers: {} },
    { id: "starter-boots", name: "Ring Boots", slot: "boots", price: 0, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "Reliable arena footwear.", color: null, modifiers: {} },
    { id: "box-gloves", name: "Box Gloves", slot: "gloves", price: 320, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "Bigger read. +2% Punch", color: "#e84435", modifiers: { punch: 0.02 } },
    { id: "block-boots", name: "Block Boots", slot: "boots", price: 320, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "Stance volume. +2% Kick, +1% Defense", color: "#1b8c4b", modifiers: { kick: 0.02, defense: 0.01 } },
    { id: "metro-knuckles", name: "Metro Knuckles", slot: "gloves", price: 250, bodies: ["athlete", "lean", "swift", "heavy"], description: "+3% Punch, -1% Defense", color: "#27d9ff", modifiers: { punch: 0.03, defense: -0.01 } },
    { id: "titan-gauntlets", name: "Titan Gauntlets", slot: "gloves", price: 450, bodies: ["athlete", "heavy"], description: "+5% Punch, -2% Defense", color: "#9ba8b4", modifiers: { punch: 0.05, defense: -0.02 } },
    { id: "phantom-wraps", name: "Phantom Wraps", slot: "gloves", price: 400, bodies: ["lean", "swift"], description: "+3% Kick, +2% Rift, -1% Punch", color: "#a46bff", modifiers: { kick: 0.03, rift: 0.02, punch: -0.01 } },
    { id: "bone-grips", name: "Bone Grips", slot: "gloves", price: 400, bodies: ["skeletal"], description: "+5% Rift, -2% Defense", color: "#efe4cf", modifiers: { rift: 0.05, defense: -0.02 } },
    { id: "street-runners", name: "Street Runners", slot: "boots", price: 300, bodies: ["athlete", "lean", "swift"], description: "+3% Kick, -1% Defense", color: "#ff5d86", modifiers: { kick: 0.03, defense: -0.01 } },
    { id: "iron-treads", name: "Iron Treads", slot: "boots", price: 450, bodies: ["athlete", "heavy"], description: "+4% Defense, -1% Kick", color: "#667580", modifiers: { defense: 0.04, kick: -0.01 } },
    { id: "grave-walkers", name: "Grave Walkers", slot: "boots", price: 350, bodies: ["skeletal"], description: "+3% Defense, +2% Rift", color: "#d8d0b9", modifiers: { defense: 0.03, rift: 0.02 } },
    { id: "rift-capacitor", name: "Rift Capacitor", slot: "core", price: 550, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "+6% Rift, -2% Defense", color: "#53ecff", modifiers: { rift: 0.06, defense: -0.02 } },
    { id: "bruiser-plate", name: "Bruiser Plate", slot: "core", price: 550, bodies: ["athlete", "heavy"], description: "+6% Defense, -2% Rift", color: "#f1c632", modifiers: { defense: 0.06, rift: -0.02 } },
    { id: "tempo-core", name: "Tempo Core", slot: "core", price: 500, bodies: ["lean", "swift"], description: "+3% Punch, +3% Kick, -2% Defense", color: "#ff5d86", modifiers: { punch: 0.03, kick: 0.03, defense: -0.02 } },
    { id: "wendigo-head", name: "Wendigo Antlers", slot: "accessory", price: 800, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "Antler crown. +3% Rift · Unlocks Appearance", color: "#8fd46a", modifiers: { rift: 0.03 }, appearance: { accessory: "wendigo-head" }, cosmetic: true },
    { id: "signal-collar", name: "Signal Collar", slot: "accessory", price: 280, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "+1% Defense · Unlocks Collar in Appearance", color: "#31d7ff", modifiers: { defense: 0.01 }, appearance: { accessory: "collar" }, cosmetic: true },
    { id: "rift-visor", name: "Rift Visor", slot: "accessory", price: 360, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "+2% Rift · Unlocks Visor in Appearance", color: "#53ecff", modifiers: { rift: 0.02 }, appearance: { accessory: "visor" }, cosmetic: true },
    { id: "street-cap", name: "Street Cap", slot: "accessory", price: 300, bodies: ["athlete", "lean", "swift", "heavy"], description: "+1% Kick · Unlocks Cap in Appearance", color: "#ff5d86", modifiers: { kick: 0.01 }, appearance: { accessory: "cap" }, cosmetic: true },
    { id: "pulse-goggles", name: "Pulse Goggles", slot: "accessory", price: 420, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "+3% Rift · Unlocks Goggles in Appearance", color: "#b064ff", modifiers: { rift: 0.03 }, appearance: { accessory: "goggles" }, cosmetic: true },
    { id: "comm-headset", name: "Comm Headset", slot: "accessory", price: 340, bodies: ["athlete", "lean", "swift", "heavy"], description: "+2% Punch · Unlocks Headset in Appearance", color: "#f1c632", modifiers: { punch: 0.02 }, appearance: { accessory: "headset" }, cosmetic: true },
    { id: "raid-bandana", name: "Raid Bandana", slot: "accessory", price: 260, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "+1% Punch, +1% Kick · Unlocks Bandana", color: "#e84435", modifiers: { punch: 0.01, kick: 0.01 }, appearance: { accessory: "bandana" }, cosmetic: true },
    { id: "void-vest", name: "Void Vest", slot: "shirt", price: 350, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "+2% Defense · Unlocks Vest top in Appearance", color: "#56617d", modifiers: { defense: 0.02 }, appearance: { shirt: "vest" }, cosmetic: true },
    { id: "metro-polo", name: "Metro Polo", slot: "shirt", price: 300, bodies: ["athlete", "lean", "swift", "heavy"], description: "+2% Punch · Unlocks Polo in Appearance", color: "#2f65b3", modifiers: { punch: 0.02 }, appearance: { shirt: "polo" }, cosmetic: true },
    { id: "cross-strap", name: "Cross Strap", slot: "shirt", price: 380, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "+2% Kick, +1% Rift · Unlocks Strap harness", color: "#ff5d86", modifiers: { kick: 0.02, rift: 0.01 }, appearance: { shirt: "strap" }, cosmetic: true },
    { id: "cut-sleeveless", name: "Cut Sleeveless", slot: "shirt", price: 280, bodies: ["athlete", "lean", "swift", "heavy"], description: "+1% Punch, +1% Kick · Unlocks Sleeveless", color: "#e06a28", modifiers: { punch: 0.01, kick: 0.01 }, appearance: { shirt: "sleeveless" }, cosmetic: true },
    { id: "shadow-cloak", name: "Shadow Cloak", slot: "shirt", price: 520, bodies: ["athlete", "lean", "swift", "heavy", "skeletal"], description: "+3% Defense, +1% Rift · Unlocks Cloak", color: "#522096", modifiers: { defense: 0.03, rift: 0.01 }, appearance: { shirt: "cloak" }, cosmetic: true },
  ];

  const fighterCostumeCatalog = {
    rift: [
      { id: "default", label: "Classic" },
      { id: "neon", label: "Neon Split", unlock: { kind: "wins", count: 1 }, palette: { trunks: "#12a6b8", accent: "#31d7ff", meter: "#53ecff", gloves: "#e84435" }, outfit: "arena" },
    ],
    tank: [
      { id: "default", label: "Classic" },
      { id: "iron", label: "Iron Hide", unlock: { kind: "wins", count: 1 }, palette: { trunks: "#667580", accent: "#9ba8b4", meter: "#f1c632", gloves: "#c22627" }, outfit: "armor" },
    ],
    marauder: [
      { id: "default", label: "Street Queen" },
      { id: "gold", label: "Gold Rush", unlock: { kind: "wins", count: 1 }, palette: { trunks: "#e6c826", accent: "#f1c632", meter: "#ffe65d", gloves: "#e84435" }, outfit: "crop" },
    ],
    ember: [
      { id: "default", label: "Classic" },
      { id: "ash", label: "Ashflare", unlock: { kind: "wins", count: 1 }, palette: { trunks: "#8e3222", accent: "#ff6b39", meter: "#ffb14a", gloves: "#c22627" }, outfit: "fatigues" },
    ],
    nyx: [
      { id: "default", label: "Classic" },
      { id: "violet", label: "Night Bloom", unlock: { kind: "wins", count: 1 }, palette: { trunks: "#522096", accent: "#b064ff", meter: "#ff5d86", gloves: "#7b3ef0" }, outfit: "arena" },
    ],
    chrome: [
      { id: "default", label: "Classic" },
      { id: "cobalt", label: "Cobalt Shell", unlock: { kind: "wins", count: 1 }, palette: { trunks: "#2f65b3", accent: "#9ba8b4", meter: "#53ecff", gloves: "#667580" }, outfit: "armor" },
    ],
    king: [
      { id: "default", label: "Classic" },
      { id: "crown", label: "Crown Riot", unlock: { kind: "wins", count: 1 }, palette: { trunks: "#e6c826", accent: "#f1c632", meter: "#ffe65d", gloves: "#e84435" }, outfit: "tank" },
    ],
    bone: [
      { id: "default", label: "Classic" },
      { id: "grave", label: "Grave Cloth", unlock: { kind: "wins", count: 1 }, palette: { trunks: "#111111", accent: "#efe4cf", meter: "#d8d0b9", gloves: "#efe4cf" }, outfit: "bones" },
    ],
    "jenny-night-signal": [
      { id: "default", label: "Classic" },
      { id: "recover", label: "Recovered Signal", unlock: { kind: "wins", count: 1 }, palette: { trunks: "#1d2128", accent: "#53ecff", meter: "#c7f7ff", gloves: "#e6293f" }, outfit: "crop" },
    ],
    spar7an: [
      { id: "default", label: "Classic" },
      { id: "legion", label: "Legion Brass", unlock: { kind: "wins", count: 1 }, palette: { trunks: "#8a6a2b", accent: "#f1c632", meter: "#ffe65d", hair: "#d8b05a" }, outfit: "armor" },
    ],
  };

  function gearItem(id) {
    return fighterGearCatalog.find((item) => item.id === id) || null;
  }

  // --- Hybrid Create-Fighter part catalog (P0 full pack) ---
  // Loads grayscale+alpha masks from CDN / MIDNIGHT_FIST_MANIFEST.partCatalog.
  // authoringScale:2 densified cells drawn at cell/authoringScale in fight space.
  // Soft-fail: missing/broken images fall back to procedural rects. No dual loader.
  const PART_CDN_BASE = "https://plot-pulse.com/wp-content/uploads/2026/09/";
  const PART_BODY_KEYS = ["athlete", "lean", "swift", "heavy", "skeletal"];
  const DEFAULT_PART_CATALOG = {
    "gloves-box": {
      id: "gloves-box", slot: "gloves", shopItem: "box-gloves", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "forearm-end-center",
      bodies: {
        heavy: { cell: [80, 72], scale: 1.15 },
        athlete: { cell: [68, 64], scale: 1.0 },
        lean: { cell: [64, 60], scale: 0.95 },
        swift: { cell: [60, 56], scale: 0.9 },
        skeletal: { cell: [56, 52], scale: 0.85 },
      },
    },
    "boots-block": {
      id: "boots-block", slot: "boots", shopItem: "block-boots", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "foot-bottom-center",
      bodies: {
        heavy: { cell: [44, 28], scale: 1.15 },
        athlete: { cell: [36, 24], scale: 1.0 },
        lean: { cell: [34, 22], scale: 0.95 },
        swift: { cell: [32, 22], scale: 0.9 },
        skeletal: { cell: [30, 20], scale: 0.85 },
      },
    },
    "shirt-tee": {
      id: "shirt-tee", slot: "shirt", shopItem: null, builderId: "tee",
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: false, anchor: "torso-center",
      bodies: {
        heavy: { cell: [140, 122], scale: 1.15 },
        athlete: { cell: [108, 118], scale: 1.0 },
        lean: { cell: [100, 114], scale: 0.95 },
        swift: { cell: [92, 110], scale: 0.9 },
        skeletal: { cell: [92, 110], scale: 0.85 },
      },
    },
    "shirt-collar": {
      id: "shirt-collar", slot: "accessory", shopItem: null, builderId: "collar",
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: false, anchor: "neck-top",
      bodies: {
        heavy: { cell: [78, 26], scale: 1.15 },
        athlete: { cell: [62, 26], scale: 1.0 },
        lean: { cell: [58, 26], scale: 0.95 },
        swift: { cell: [54, 26], scale: 0.9 },
        skeletal: { cell: [54, 26], scale: 0.85 },
      },
    },
    "jacket-open": {
      id: "jacket-open", slot: "shirt", shopItem: null, builderId: "jacket",
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: false, anchor: "torso-center",
      bodies: {
        heavy: { cell: [152, 126], scale: 1.15 },
        athlete: { cell: [120, 122], scale: 1.0 },
        lean: { cell: [112, 118], scale: 0.95 },
        swift: { cell: [104, 114], scale: 0.9 },
        skeletal: { cell: [104, 114], scale: 0.85 },
      },
    },
    "shorts-baggy": {
      id: "shorts-baggy", slot: "pants", shopItem: null, builderId: "shorts",
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: false, anchor: "hip-band-center",
      bodies: {
        heavy: { cell: [164, 78], scale: 1.15 },
        athlete: { cell: [128, 70], scale: 1.0 },
        lean: { cell: [120, 68], scale: 0.95 },
        swift: { cell: [112, 66], scale: 0.9 },
        skeletal: { cell: [112, 66], scale: 0.85 },
      },
    },
    "visor": {
      id: "visor", slot: "accessory", shopItem: null, builderId: "visor",
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: false, anchor: "eye-line",
      bodies: {
        heavy: { cell: [68, 30], scale: 1.15 },
        athlete: { cell: [60, 28], scale: 1.0 },
        lean: { cell: [56, 26], scale: 0.95 },
        swift: { cell: [52, 26], scale: 0.9 },
        skeletal: { cell: [52, 24], scale: 0.85 },
      },
    },
    "hair-spike": {
      id: "hair-spike", slot: "hair", shopItem: null, builderId: "spike",
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: false, anchor: "head-top",
      bodies: {
        heavy: { cell: [64, 56], scale: 1.15 },
        athlete: { cell: [56, 52], scale: 1.0 },
        lean: { cell: [52, 48], scale: 0.95 },
        swift: { cell: [48, 44], scale: 0.9 },
        skeletal: { cell: [48, 44], scale: 0.85 },
      },
    },
    // --- Shop-unique gear (STOCK_CLOTHING_LOCK: never auto-apply shirt/jacket/shorts on stock) ---
    "gloves-starter-wraps": {
      id: "gloves-starter-wraps", slot: "gloves", shopItem: "starter-wraps", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "forearm-end-center",
      bodies: {
        heavy: { cell: [80, 72], scale: 1.15 }, athlete: { cell: [68, 64], scale: 1.0 },
        lean: { cell: [64, 60], scale: 0.95 }, swift: { cell: [60, 56], scale: 0.9 }, skeletal: { cell: [56, 52], scale: 0.85 },
      },
    },
    "gloves-metro-knuckles": {
      id: "gloves-metro-knuckles", slot: "gloves", shopItem: "metro-knuckles", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "forearm-end-center",
      bodies: {
        heavy: { cell: [80, 72], scale: 1.15 }, athlete: { cell: [68, 64], scale: 1.0 },
        lean: { cell: [64, 60], scale: 0.95 }, swift: { cell: [60, 56], scale: 0.9 }, skeletal: { cell: [56, 52], scale: 0.85 },
      },
    },
    "gloves-titan-gauntlets": {
      id: "gloves-titan-gauntlets", slot: "gloves", shopItem: "titan-gauntlets", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "forearm-end-center",
      bodies: {
        heavy: { cell: [80, 72], scale: 1.15 }, athlete: { cell: [68, 64], scale: 1.0 },
        lean: { cell: [64, 60], scale: 0.95 }, swift: { cell: [60, 56], scale: 0.9 }, skeletal: { cell: [56, 52], scale: 0.85 },
      },
    },
    "gloves-phantom-wraps": {
      id: "gloves-phantom-wraps", slot: "gloves", shopItem: "phantom-wraps", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "forearm-end-center",
      bodies: {
        heavy: { cell: [80, 72], scale: 1.15 }, athlete: { cell: [68, 64], scale: 1.0 },
        lean: { cell: [64, 60], scale: 0.95 }, swift: { cell: [60, 56], scale: 0.9 }, skeletal: { cell: [56, 52], scale: 0.85 },
      },
    },
    "gloves-bone-grips": {
      id: "gloves-bone-grips", slot: "gloves", shopItem: "bone-grips", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "forearm-end-center",
      bodies: {
        heavy: { cell: [80, 72], scale: 1.15 }, athlete: { cell: [68, 64], scale: 1.0 },
        lean: { cell: [64, 60], scale: 0.95 }, swift: { cell: [60, 56], scale: 0.9 }, skeletal: { cell: [56, 52], scale: 0.85 },
      },
    },
    "boots-starter": {
      id: "boots-starter", slot: "boots", shopItem: "starter-boots", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "foot-bottom-center",
      bodies: {
        heavy: { cell: [44, 28], scale: 1.15 }, athlete: { cell: [36, 24], scale: 1.0 },
        lean: { cell: [34, 22], scale: 0.95 }, swift: { cell: [32, 22], scale: 0.9 }, skeletal: { cell: [30, 20], scale: 0.85 },
      },
    },
    "boots-street-runners": {
      id: "boots-street-runners", slot: "boots", shopItem: "street-runners", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "foot-bottom-center",
      bodies: {
        heavy: { cell: [44, 28], scale: 1.15 }, athlete: { cell: [36, 24], scale: 1.0 },
        lean: { cell: [34, 22], scale: 0.95 }, swift: { cell: [32, 22], scale: 0.9 }, skeletal: { cell: [30, 20], scale: 0.85 },
      },
    },
    "boots-iron-treads": {
      id: "boots-iron-treads", slot: "boots", shopItem: "iron-treads", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "foot-bottom-center",
      bodies: {
        heavy: { cell: [44, 28], scale: 1.15 }, athlete: { cell: [36, 24], scale: 1.0 },
        lean: { cell: [34, 22], scale: 0.95 }, swift: { cell: [32, 22], scale: 0.9 }, skeletal: { cell: [30, 20], scale: 0.85 },
      },
    },
    "boots-grave-walkers": {
      id: "boots-grave-walkers", slot: "boots", shopItem: "grave-walkers", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: true, anchor: "foot-bottom-center",
      bodies: {
        heavy: { cell: [44, 28], scale: 1.15 }, athlete: { cell: [36, 24], scale: 1.0 },
        lean: { cell: [34, 22], scale: 0.95 }, swift: { cell: [32, 22], scale: 0.9 }, skeletal: { cell: [30, 20], scale: 0.85 },
      },
    },
    "core-rift-capacitor": {
      id: "core-rift-capacitor", slot: "core", shopItem: "rift-capacitor", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: false, anchor: "torso-center",
      bodies: {
        heavy: { cell: [63, 64], scale: 1.15 }, athlete: { cell: [48, 56], scale: 1.0 },
        lean: { cell: [44, 53], scale: 0.95 }, swift: { cell: [39, 50], scale: 0.9 }, skeletal: { cell: [39, 47], scale: 0.85 },
      },
    },
    "core-bruiser-plate": {
      id: "core-bruiser-plate", slot: "core", shopItem: "bruiser-plate", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: false, anchor: "torso-center",
      bodies: {
        heavy: { cell: [63, 64], scale: 1.15 }, athlete: { cell: [48, 56], scale: 1.0 },
        lean: { cell: [44, 53], scale: 0.95 }, swift: { cell: [39, 50], scale: 0.9 }, skeletal: { cell: [39, 47], scale: 0.85 },
      },
    },
    "core-tempo-core": {
      id: "core-tempo-core", slot: "core", shopItem: "tempo-core", builderId: null,
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: false, anchor: "torso-center",
      bodies: {
        heavy: { cell: [63, 64], scale: 1.15 }, athlete: { cell: [48, 56], scale: 1.0 },
        lean: { cell: [44, 53], scale: 0.95 }, swift: { cell: [39, 50], scale: 0.9 }, skeletal: { cell: [39, 47], scale: 0.85 },
      },
    },
    "wendigo-head": {
      id: "wendigo-head", slot: "hair", shopItem: "wendigo-head", builderId: "wendigo-head",
      tintMode: "multiply-value-alpha", authoringScale: 2, sided: false, anchor: "head-top",
      bodies: {
        heavy: { cell: [72, 80], scale: 1.15 }, athlete: { cell: [64, 80], scale: 1.0 },
        lean: { cell: [56, 80], scale: 0.95 }, swift: { cell: [56, 72], scale: 0.9 }, skeletal: { cell: [56, 80], scale: 0.85 },
      },
    },
  };

  const partImageCache = Object.create(null);
  let partScratchCanvas = null;
  let partScratchCtx = null;

  function resolvePartBodyKey(ch) {
    const body = ch && ch.body;
    return PART_BODY_KEYS.includes(body) ? body : "athlete";
  }

  function getMergedPartCatalog() {
    const baked = DEFAULT_PART_CATALOG;
    const external = (typeof window !== "undefined" && window.MIDNIGHT_FIST_MANIFEST && window.MIDNIGHT_FIST_MANIFEST.partCatalog) || null;
    if (!external || typeof external !== "object") return baked;
    const merged = { ...baked };
    for (const [id, entry] of Object.entries(external)) {
      if (!entry || typeof entry !== "object") continue;
      if (typeof entry === "string") {
        // Allow flat id -> base URL prefix overrides later via urls
        merged[id] = { ...(merged[id] || { id, sided: false, authoringScale: 2, bodies: {} }), urlBase: entry };
        continue;
      }
      merged[id] = { ...(merged[id] || { id }), ...entry, bodies: { ...((merged[id] && merged[id].bodies) || {}), ...(entry.bodies || {}) } };
    }
    return merged;
  }

  function defaultPartAssetUrl(partId, body, side) {
    if (side) return `${PART_CDN_BASE}mfl-part-${partId}_${body}_${side}.png`;
    return `${PART_CDN_BASE}mfl-part-${partId}_${body}.png`;
  }

  function resolvePartAssetUrl(part, body, side) {
    const manifest = (typeof window !== "undefined" && window.MIDNIGHT_FIST_MANIFEST && window.MIDNIGHT_FIST_MANIFEST.partCatalog) || null;
    const override = manifest && manifest[part.id];
    if (override) {
      if (typeof override === "string") {
        const base = override.replace(/\/$/, "");
        return side ? `${base}/${part.id}_${body}_${side}.png` : `${base}/${part.id}_${body}.png`;
      }
      const bodyOver = override.bodies && override.bodies[body];
      if (bodyOver) {
        if (side && bodyOver[side === "L" ? "left" : "right"]) return bodyOver[side === "L" ? "left" : "right"];
        if (side && bodyOver[side]) return bodyOver[side];
        if (!side && (bodyOver.path || bodyOver.url)) return bodyOver.path || bodyOver.url;
      }
      if (side && override[`${body}_${side}`]) return override[`${body}_${side}`];
      if (!side && override[body]) return override[body];
      if (override.urls) {
        const key = side ? `${body}_${side}` : body;
        if (override.urls[key]) return override.urls[key];
      }
    }
    if (part.urlBase) {
      const base = String(part.urlBase).replace(/\/$/, "");
      return side ? `${base}/mfl-part-${part.id}_${body}_${side}.png` : `${base}/mfl-part-${part.id}_${body}.png`;
    }
    const bodyDef = part.bodies && part.bodies[body];
    // Never use local /workspace paths at runtime — CDN only (Studio uploads).
    return defaultPartAssetUrl(part.id, body, side || null);
  }

  function loadPartImage(url) {
    if (!url) return null;
    const hit = partImageCache[url];
    if (hit) return hit;
    const entry = { image: null, ready: false, failed: false, url };
    partImageCache[url] = entry;
    try {
      if (typeof Image === "undefined") { entry.failed = true; return entry; }
      const image = new Image();
      image.onload = () => { entry.ready = true; };
      image.onerror = () => { entry.failed = true; };
      image.src = url;
      entry.image = image;
    } catch (_) {
      entry.failed = true;
    }
    return entry;
  }

  function ensurePartScratch(w, h) {
    const tw = Math.max(1, Math.ceil(w));
    const th = Math.max(1, Math.ceil(h));
    if (!partScratchCanvas) {
      partScratchCanvas = document.createElement("canvas");
      partScratchCtx = partScratchCanvas.getContext("2d");
    }
    if (partScratchCanvas.width < tw || partScratchCanvas.height < th) {
      partScratchCanvas.width = Math.max(tw, partScratchCanvas.width);
      partScratchCanvas.height = Math.max(th, partScratchCanvas.height);
      partScratchCtx = partScratchCanvas.getContext("2d");
    }
    return { canvas: partScratchCanvas, ctx: partScratchCtx, w: tw, h: th };
  }

  function drawMultiplyValueAlpha(targetCtx, img, dx, dy, dw, dh, hexColor) {
    if (!targetCtx || !img || !(img.width > 0) || !(dw > 0) || !(dh > 0)) return false;
    try {
      const scratch = ensurePartScratch(dw, dh);
      const s = scratch.ctx;
      s.clearRect(0, 0, scratch.w, scratch.h);
      s.globalCompositeOperation = "source-over";
      s.drawImage(img, 0, 0, dw, dh);
      s.globalCompositeOperation = "multiply";
      s.fillStyle = hexColor || "#ffffff";
      s.fillRect(0, 0, dw, dh);
      s.globalCompositeOperation = "destination-in";
      s.drawImage(img, 0, 0, dw, dh);
      s.globalCompositeOperation = "source-over";
      targetCtx.drawImage(scratch.canvas, 0, 0, dw, dh, dx, dy, dw, dh);
      return true;
    } catch (_) {
      return false;
    }
  }

  function findPartByShopItem(shopItemId) {
    if (!shopItemId) return null;
    const catalog = getMergedPartCatalog();
    for (const part of Object.values(catalog)) {
      if (part && part.shopItem === shopItemId) return part;
    }
    return null;
  }

  function findPartByBuilder(slot, builderId) {
    if (!builderId) return null;
    const catalog = getMergedPartCatalog();
    for (const part of Object.values(catalog)) {
      if (part && part.slot === slot && part.builderId === builderId) return part;
    }
    return null;
  }

  function equippedShopId(ch, slot) {
    const eco = ch && ch.economy && ch.economy.equipped;
    if (eco && eco[slot]) return eco[slot];
    const draft = ch && ch.customDraft && ch.customDraft.economy && ch.customDraft.economy.equipped;
    if (draft && draft[slot]) return draft[slot];
    return null;
  }

  function partDrawSize(part, bodyKey) {
    const bodyDef = (part.bodies && (part.bodies[bodyKey] || part.bodies.athlete)) || { cell: [32, 32] };
    const scale = Math.max(1, Number(part.authoringScale) || 2);
    const cell = bodyDef.cell || [32, 32];
    return {
      w: Math.max(1, Math.round(cell[0] / scale)),
      h: Math.max(1, Math.round(cell[1] / scale)),
      bodyScale: bodyDef.scale || 1,
    };
  }

  function tryDrawSidedPart(targetCtx, part, ch, side, cx, cy, tint, opts = {}) {
    if (!part || !targetCtx) return false;
    const bodyKey = resolvePartBodyKey(ch);
    const url = resolvePartAssetUrl(part, bodyKey, side);
    const entry = loadPartImage(url);
    if (!entry || entry.failed || !entry.ready || !entry.image) return false;
    const size = partDrawSize(part, bodyKey);
    let dw = size.w;
    let dh = size.h;
    if (opts.fitW) { dw = opts.fitW; dh = opts.fitH || Math.round(opts.fitW * (size.h / size.w)); }
    const dx = Math.round(cx - dw / 2);
    const dy = Math.round(cy - (opts.anchorY === "bottom" ? dh : dh / 2));
    return drawMultiplyValueAlpha(targetCtx, entry.image, dx, dy, dw, dh, tint);
  }

  function tryDrawMonoPart(targetCtx, part, ch, cx, cy, tint, opts = {}) {
    if (!part || !targetCtx) return false;
    const bodyKey = resolvePartBodyKey(ch);
    const url = resolvePartAssetUrl(part, bodyKey, null);
    const entry = loadPartImage(url);
    if (!entry || entry.failed || !entry.ready || !entry.image) return false;
    const size = partDrawSize(part, bodyKey);
    let dw = size.w;
    let dh = size.h;
    if (opts.fitW) { dw = opts.fitW; dh = opts.fitH || Math.round(opts.fitW * (size.h / size.w)); }
    const dx = Math.round(cx - dw / 2);
    const dy = Math.round(cy - (opts.anchorY === "bottom" ? dh : opts.anchorY === "top" ? 0 : dh / 2));
    return drawMultiplyValueAlpha(targetCtx, entry.image, dx, dy, dw, dh, tint);
  }

  function drawGlovePartOrRect(targetCtx, ch, p, gx, gy, gw, gh, side /* 'L'|'R' */) {
    const shopId = equippedShopId(ch, "gloves");
    const part = findPartByShopItem(shopId);
    if (part && tryDrawSidedPart(targetCtx, part, ch, side, gx + gw / 2, gy + gh / 2, p.gloves || "#e84435")) {
      return true;
    }
    return false;
  }

  function drawBootPartOrRect(targetCtx, ch, p, bx, by, bw, bh, side) {
    const shopId = equippedShopId(ch, "boots");
    const part = findPartByShopItem(shopId);
    if (part && tryDrawSidedPart(targetCtx, part, ch, side, bx + bw / 2, by + bh, p.boots || "#1b8c4b", { anchorY: "bottom" })) {
      return true;
    }
    return false;
  }

  function drawBuilderPartLayer(targetCtx, ch, p, slot, builderId, cx, cy, tint, opts) {
    const part = findPartByBuilder(slot, builderId);
    if (!part) return false;
    return tryDrawMonoPart(targetCtx, part, ch, cx, cy, tint, opts || {});
  }

  function paintFightRect(x, y, w, h, color) {
    rect(x, y, w, h, color);
  }

  function paintShopGloveShape(paint, ch, p, x, y, w, h, side) {
    const shopId = equippedShopId(ch, "gloves") || "starter-wraps";
    const tint = p.gloves || "#e84435";
    const dir = side === "L" ? -1 : 1;
    if (shopId === "metro-knuckles") {
      paint(x + 2, y + 4, Math.max(8, w - 6), Math.max(8, h - 8), tint);
      paint(x + (dir > 0 ? w - 5 : 1), y + 2, 4, Math.max(6, h - 6), "#27d9ff");
      paint(x + 3, y + 1, Math.max(4, w - 8), 3, "#9ff0ff");
      return;
    }
    if (shopId === "titan-gauntlets" || shopId === "box-gloves") {
      const pad = shopId === "titan-gauntlets" ? 4 : 2;
      paint(x - pad, y - pad, w + pad * 2, h + pad * 2, tint);
      paint(x + 2, y + 3, w - 4, 4, shadeHex(tint, 0.65));
      return;
    }
    if (shopId === "phantom-wraps") {
      paint(x + 1, y + 2, w - 2, Math.max(6, Math.floor(h * 0.35)), "rgba(164,107,255,0.55)");
      paint(x + 2, y + Math.floor(h * 0.4), w - 4, Math.max(5, Math.floor(h * 0.28)), "rgba(164,107,255,0.4)");
      paint(x + 3, y + Math.floor(h * 0.7), w - 6, Math.max(4, Math.floor(h * 0.22)), tint);
      return;
    }
    if (shopId === "bone-grips") {
      paint(x + 1, y + 3, w - 2, h - 5, tint);
      paint(x + (dir > 0 ? w - 3 : 0), y, 3, 5, "#efe4cf");
      paint(x + (dir > 0 ? w - 5 : 1), y + 4, 3, 4, "#efe4cf");
      paint(x + (dir > 0 ? w - 4 : 0), y + 8, 3, 4, "#d8d0b9");
      return;
    }
    // starter-wraps / unknown — simple procedural
    paint(x, y, w, h, tint);
  }

  function paintShopBootShape(paint, ch, p, x, y, w, h, side) {
    const shopId = equippedShopId(ch, "boots") || "starter-boots";
    const tint = p.boots || "#1b8c4b";
    const dir = side === "L" ? -1 : 1;
    if (shopId === "street-runners") {
      paint(x, y + 2, w - 2, h - 2, tint);
      paint(x + (dir > 0 ? w - 6 : 0), y, 6, h, "#ff5d86");
      paint(x + 1, y + h - 3, w - 2, 3, "#ff9eb8");
      return;
    }
    if (shopId === "iron-treads" || shopId === "block-boots") {
      const thick = shopId === "iron-treads" ? 3 : 1;
      paint(x - 1, y, w + 2, h, tint);
      paint(x - 2, y + h - 2 - thick, w + 4, 2 + thick, "#667580");
      return;
    }
    if (shopId === "grave-walkers") {
      paint(x, y + 1, w, h - 1, tint);
      paint(x + (dir > 0 ? w - 7 : 0), y, 7, h, "#d8d0b9");
      paint(x + 2, y + h - 3, w - 4, 3, "#efe4cf");
      return;
    }
    paint(x, y, w, h, tint);
  }

  function drawCoreEmblem(targetCtx, ch, p, lean, y, paintFn) {
    if (!ch || ch.id !== "custom") return;
    const shopId = equippedShopId(ch, "core");
    if (!shopId) return;
    const part = findPartByShopItem(shopId);
    const cx = lean;
    const cy = -100 + y;
    if (part && tryDrawMonoPart(targetCtx, part, ch, cx, cy, gearItem(shopId)?.color || p.meter || "#53ecff", {})) return;
    const paint = paintFn || ((x, yy, w, h, color) => {
      if (targetCtx === ctx) rect(x, yy, w, h, color);
      else previewRect(targetCtx, x, yy, w, h, color);
    });
    if (shopId === "rift-capacitor") {
      paint(-6 + lean, -108 + y, 12, 12, "#53ecff");
      paint(-3 + lean, -105 + y, 6, 6, "#c7f7ff");
    } else if (shopId === "bruiser-plate") {
      paint(-8 + lean, -110 + y, 16, 14, "#f1c632");
      paint(-5 + lean, -107 + y, 10, 8, shadeHex("#f1c632", 0.7));
    } else if (shopId === "tempo-core") {
      paint(-7 + lean, -109 + y, 14, 10, "#ff5d86");
      paint(-4 + lean, -106 + y, 8, 4, "#ff9eb8");
    }
  }

  function gloveRect(ch, p, x, y, w, h, side) {
    if (drawGlovePartOrRect(ctx, ch, p, x, y, w, h, side)) return;
    paintShopGloveShape(rect, ch, p, x, y, w, h, side);
  }

  function bootRect(ch, p, x, y, w, h, side) {
    if (drawBootPartOrRect(ctx, ch, p, x, y, w, h, side)) return;
    paintShopBootShape(rect, ch, p, x, y, w, h, side);
  }

  function previewGloveRect(c, ch, p, x, y, w, h, side) {
    if (drawGlovePartOrRect(c, ch, p, x, y, w, h, side)) return;
    paintShopGloveShape((x2, y2, w2, h2, color) => previewRect(c, x2, y2, w2, h2, color), ch, p, x, y, w, h, side);
  }

  function previewBootRect(c, ch, p, x, y, w, h, side) {
    if (drawBootPartOrRect(c, ch, p, x, y, w, h, side)) return;
    paintShopBootShape((x2, y2, w2, h2, color) => previewRect(c, x2, y2, w2, h2, color), ch, p, x, y, w, h, side);
  }

  function drawShirtPartLayer(targetCtx, ch, p, builderId, cx, cy, fitW, fitH) {
    // STOCK_CLOTHING_LOCK: shirt-tee / jacket-open never auto-apply on stock roster.
    if (!ch || ch.id !== "custom") return false;
    const part = findPartByBuilder("shirt", builderId);
    if (!part) return false;
    return tryDrawMonoPart(targetCtx, part, ch, cx, cy, p.accent || "#31d7ff", { fitW, fitH });
  }

  function drawPantsPartLayer(targetCtx, ch, p, builderId, cx, cy, fitW, fitH) {
    // STOCK_CLOTHING_LOCK: shorts-baggy never auto-apply on stock roster.
    if (!ch || ch.id !== "custom") return false;
    const part = findPartByBuilder("pants", builderId);
    if (!part) return false;
    return tryDrawMonoPart(targetCtx, part, ch, cx, cy, p.trunks || "#2f65b3", { fitW, fitH });
  }

  function drawHairPartLayer(targetCtx, ch, p, builderId, cx, cy) {
    const part = findPartByBuilder("hair", builderId);
    if (!part) return false;
    return tryDrawMonoPart(targetCtx, part, ch, cx, cy, p.hair || "#101828", {});
  }

  function drawAccessoryPartLayer(targetCtx, ch, p, builderId, cx, cy, tint) {
    const part = findPartByBuilder("accessory", builderId);
    if (!part) return false;
    return tryDrawMonoPart(targetCtx, part, ch, cx, cy, tint || p.accent || "#31d7ff", {});
  }

  function drawWendigoAntlersProcedural(targetCtx, lean, y, color) {
    const paint = (x, yy, w, h, c) => {
      if (targetCtx === ctx) rect(x, yy, w, h, c);
      else previewRect(targetCtx, x, yy, w, h, c);
    };
    const bone = color || "#efe4cf";
    const dark = "#c8b896";
    // Left fork
    paint(-18 + lean, -178 + y, 5, 22, bone);
    paint(-26 + lean, -188 + y, 5, 14, bone);
    paint(-14 + lean, -186 + y, 4, 12, bone);
    paint(-28 + lean, -190 + y, 3, 5, dark);
    // Right fork
    paint(13 + lean, -178 + y, 5, 22, bone);
    paint(21 + lean, -188 + y, 5, 14, bone);
    paint(10 + lean, -186 + y, 4, 12, bone);
    paint(23 + lean, -190 + y, 3, 5, dark);
  }

  function paintAccessoryRect(targetCtx, x, yy, w, h, color) {
    if (targetCtx === ctx) rect(x, yy, w, h, color);
    else previewRect(targetCtx, x, yy, w, h, color);
  }

  function drawAccessoryProcedural(targetCtx, acc, lean, y, p) {
    const paint = (x, yy, w, h, color) => paintAccessoryRect(targetCtx, x, yy, w, h, color);
    const accent = p?.accent || "#31d7ff";
    const meter = p?.meter || "#53ecff";
    const dark = shadeHex(accent, 0.45);
    if (acc === "collar") {
      paint(-14 + lean, -118 + y, 28, 6, accent);
      paint(-12 + lean, -114 + y, 24, 3, dark);
      paint(-3 + lean, -119 + y, 6, 4, meter);
    } else if (acc === "visor") {
      paint(-16 + lean, -146 + y, 32, 8, shadeHex(meter, 0.55));
      paint(-14 + lean, -144 + y, 28, 4, meter);
      paint(-16 + lean, -147 + y, 4, 10, dark);
      paint(12 + lean, -147 + y, 4, 10, dark);
    } else if (acc === "cap") {
      paint(-16 + lean, -168 + y, 32, 8, accent);
      paint(-18 + lean, -162 + y, 36, 6, dark);
      paint(2 + lean, -160 + y, 18, 5, accent);
    } else if (acc === "goggles") {
      paint(-16 + lean, -146 + y, 12, 8, shadeHex(meter, 0.7));
      paint(4 + lean, -146 + y, 12, 8, shadeHex(meter, 0.7));
      paint(-4 + lean, -144 + y, 8, 4, dark);
      paint(-17 + lean, -147 + y, 34, 2, accent);
    } else if (acc === "headset") {
      paint(-22 + lean, -152 + y, 6, 14, dark);
      paint(16 + lean, -152 + y, 6, 14, dark);
      paint(-20 + lean, -158 + y, 40, 4, accent);
      paint(18 + lean, -148 + y, 8, 10, meter);
    } else if (acc === "bandana") {
      paint(-18 + lean, -158 + y, 36, 8, accent);
      paint(-6 + lean, -152 + y, 12, 5, dark);
      paint(14 + lean, -156 + y, 10, 4, accent);
      paint(18 + lean, -152 + y, 8, 10, shadeHex(accent, 0.75));
    }
  }

  function drawCharacterAccessories(targetCtx, ch, p, lean, y) {
    if (!ch) return;
    // Do not alter roster Wendigo body outfit — head accessory is Create-Fighter / shop only.
    const shopAcc = equippedShopId(ch, "accessory");
    const acc = shopAcc || ch.accessory || (ch.customDraft && ch.customDraft.accessory) || "none";
    if (!acc || acc === "none") return;
    if (acc === "collar") {
      if (!drawAccessoryPartLayer(targetCtx, ch, p, "collar", lean, -120 + y + 4, p.accent || p.white)) {
        drawAccessoryProcedural(targetCtx, "collar", lean, y, p);
      }
    } else if (acc === "visor") {
      if (!drawAccessoryPartLayer(targetCtx, ch, p, "visor", lean, -142 + y, p.meter || p.accent || "#53ecff")) {
        drawAccessoryProcedural(targetCtx, "visor", lean, y, p);
      }
    } else if (acc === "wendigo-head") {
      const part = findPartByShopItem("wendigo-head") || findPartByBuilder("hair", "wendigo-head");
      const tint = (gearItem("wendigo-head") && gearItem("wendigo-head").color) || "#8fd46a";
      if (!(part && tryDrawMonoPart(targetCtx, part, ch, lean, -168 + y, tint, { anchorY: "bottom" }))) {
        drawWendigoAntlersProcedural(targetCtx, lean, y, "#efe4cf");
      }
    } else if (acc === "cap" || acc === "goggles" || acc === "headset" || acc === "bandana") {
      drawAccessoryProcedural(targetCtx, acc, lean, y, p);
    }
  }


  function loadDeviceCustomDraft() {
    try {
      const raw = window.localStorage?.getItem(customDraftStorageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveCustomDraftToDevice(draft) {
    try {
      window.localStorage?.setItem(customDraftStorageKey, JSON.stringify(normalizeCustomDraft(draft)));
      return true;
    } catch {
      return false;
    }
  }

  // Selectable fatality styles for Create Fighter (colors + arena map previews).
  const builderRiftalityCatalog = [
    { id: "personal", label: "Personal Riftality", blurb: "Your name, generic rush finisher.", primary: "#53ecff", secondary: "#f04c3d", mapId: "metro", family: "rift" },
    { id: "pp-mara", label: "QA Clear", blurb: "Freeze shell, FAIL stamps, delete limbs.", primary: "#5ce0ff", secondary: "#1e3a5f", mapId: "rooftop-arcade", family: "rush" },
    { id: "noah", label: "Won't Fix", blurb: "Issue tracker slam and bug confetti.", primary: "#8de6ff", secondary: "#3d4f63", mapId: "metro", family: "rush" },
    { id: "claire", label: "Hollow Frame", blurb: "Peel layers down to wireframe.", primary: "#b47aff", secondary: "#4a2d6e", mapId: "raven-hollow-relay", family: "rush" },
    { id: "eli-dev", label: "Build Crash", blurb: "Terminal stack dump and code blocks.", primary: "#3dff90", secondary: "#1a2b20", mapId: "rooftop-arcade", family: "beam" },
    { id: "alex", label: "Case Closed", blurb: "Evidence tags and flash cuts.", primary: "#dcb848", secondary: "#303644", mapId: "warehouse", family: "rift" },
    { id: "sable", label: "Marked For Rewrite", blurb: "Dash marks and rewrite ghosts.", primary: "#d33a54", secondary: "#7e1f32", mapId: "neon-docks", family: "rush" },
    { id: "control", label: "Bass Drop Override", blurb: "Dubstep rings and bass drop.", primary: "#35f2ff", secondary: "#b84cff", mapId: "music-festival", family: "beam" },
    { id: "chrome", label: "System Crash", blurb: "Twin eye lasers and shatter.", primary: "#ff2f2f", secondary: "#c7f3ff", mapId: "warehouse", family: "beam" },
    { id: "tank", label: "Tank Breaker", blurb: "Far-edge cannon shell.", primary: "#ffb14a", secondary: "#9b5b27", mapId: "haunted-stadium", family: "quake" },
    { id: "king", label: "Landslide King", blurb: "Ground-wave collapse.", primary: "#4f9dff", secondary: "#f8dd94", mapId: "temple", family: "quake" },
    { id: "grit", label: "Nuclear Option", blurb: "Calls in a nuke that whites out the arena on impact.", primary: "#48dd9b", secondary: "#d99a71", mapId: "haunted-stadium", family: "quake" },
    { id: "plot-pulse-theam", label: "Fleet Abduction", blurb: "A UFO fleet beams the opponent off the planet.", primary: "#5ff6ff", secondary: "#7b5cff", mapId: "neon-docks", family: "beam" },
    { id: "dragon-born", label: "Storm Breath", blurb: "Mouth lightning tears the opponent's head away.", primary: "#69dfff", secondary: "#effaff", mapId: "temple", family: "beam" },
    { id: "bone", label: "Head Case", blurb: "Skull swap riftality.", primary: "#efe4cf", secondary: "#d12929", mapId: "creeping-antler-woods", family: "bone" },
    { id: "ninja", label: "After The Cut", blurb: "Katana collapse sequence.", primary: "#d9b45f", secondary: "#8b1016", mapId: "temple", family: "shadow" },
    { id: "lazy", label: "Primal Drum Solo", blurb: "Controller smash finisher.", primary: "#e02746", secondary: "#6b1a8f", mapId: "music-festival", family: "quake" },
    { id: "rift", label: "Rift Split", blurb: "Portal split the rival.", primary: "#53ecff", secondary: "#f04c3d", mapId: "neon-docks", family: "rift" },
    { id: "the-mother", label: "Lights Out", blurb: "Shadow smother, lights out.", primary: "#c8a0ff", secondary: "#2a1838", mapId: "raven-hollow-relay", family: "shadow" },
    { id: "wendigo", label: "Antler Peel", blurb: "Antler cage and peel.", primary: "#8fd46a", secondary: "#1a2820", mapId: "creeping-antler-woods", family: "bone" },
    { id: "marauder", label: "Five Shot", blurb: "Point-blank five-shot gun.", primary: "#ff5d86", secondary: "#fff0e6", mapId: "neon-docks", family: "rush" },
    { id: "spar7an", label: "Legion Broken", blurb: "Spear pin and break.", primary: "#f4d879", secondary: "#8b1016", mapId: "temple", family: "quake" },
    { id: "jake", label: "Fourth Down", blurb: "Miracle play slam.", primary: "#7df0d4", secondary: "#d6b047", mapId: "haunted-stadium", family: "quake" },
    { id: "jenny-night-signal", label: "3:33 Replay", blurb: "Ghost replay echo.", primary: "#c7f7ff", secondary: "#e6293f", mapId: "raven-hollow-relay", family: "beam" },
    { id: "ice-golem", label: "Glacier Crush", blurb: "Ice crush shatter.", primary: "#8ff4ff", secondary: "#5a94a8", mapId: "warehouse", family: "beam" },
    { id: "bigfoot", label: "Timber Stomp", blurb: "Woods stomp finisher.", primary: "#8fd46a", secondary: "#4a2c1d", mapId: "creeping-antler-woods", family: "quake" },
  ];
  const RIFTALITY_REBIND_COST = 10000;

  const builderPools = {
    name: ["Nova", "Vex", "Onyx", "Jett", "Kira", "Volt", "Hex", "Rook", "Ash", "Knox"],
    body: ["athlete", "lean", "swift", "heavy", "skeletal"],
    hairStyle: ["spike", "crop", "bob", "ponytail", "sidepony", "long", "mohawk", "wild", "fluffy", "helmet", "skull", "martial"],
    facialHair: ["none", "stubble", "goatee", "full"],
    outfit: ["trunks", "jeans", "crop", "shorts", "arena", "armor", "tank", "gi", "bones", "robe", "fatigues"],
    shirt: ["bare", "tee", "tank", "crop", "hoodie", "jacket", "arena", "armor", "gi", "bones", "robe", "vest", "polo", "strap", "sleeveless", "cloak"],
    pants: ["trunks", "jeans", "shorts", "joggers", "cargos", "leggings", "greaves", "gi", "bones"],
    faceExpression: ["neutral", "focused", "angry", "smirk"],
    faceMask: ["none", "tactical", "oni", "skull"],
    accessory: ["none", "collar", "visor", "wendigo-head", "cap", "goggles", "headset", "bandana"],
    riftalityId: builderRiftalityCatalog.map((entry) => entry.id),
    skin: ["#d6925d", "#c98242", "#e4a06f", "#8f4b24", "#edae89", "#e7dcc6"],
    hair: ["#101828", "#13245e", "#6732b4", "#9f422b", "#e8c35b", "#1a1b18"],
    accent: ["#31d7ff", "#f1c632", "#b064ff", "#f4f1e5", "#3f542e", "#d6aa32"],
    gloves: ["#e84435", "#c22627", "#a92527", "#7b3ef0", "#8e3222", "#c83429"],
    trunks: ["#2f65b3", "#12a6b8", "#56617d", "#522096", "#526838", "#e6c826"],
    boots: ["#1b8c4b", "#5a3920", "#2a241e", "#202021", "#191b15", "#dad0bd"],
    meter: ["#53ecff", "#ffb14a", "#ff5d86", "#ffe65d", "#b064ff", "#9fe36d"],
  };

  function getBuilderRiftality(id) {
    return builderRiftalityCatalog.find((entry) => entry.id === id) || builderRiftalityCatalog[0];
  }

  function activeFinisherStyle(character = player?.character) {
    if (!character) return "";
    if (character.riftalityId && character.riftalityId !== "personal") return character.riftalityId;
    return character.id;
  }

  const kingDefeatStorageKey = "midnight-fist-king-defeats";
  const kingUnlockMilestones = [
    { count: 1, id: "lazy" },
    { count: 3, id: "ninja" },
    { count: 6, id: "sable" },
    { count: 9, id: "the-mother" },
    { count: 12, id: "wendigo" },
    { count: 15, id: "ice-golem" },
    { count: 18, id: "bigfoot" },
  ];
  const kingDefeats = loadKingDefeats();
  let customDraft = normalizeCustomDraft(loadDeviceCustomDraft() || customDefaultDraft);
  let customCharacter = createCustomCharacter(customDraft);
  const characterById = new Map([...roster, customCharacter, ...hiddenRivals].map((item) => [item.id, item]));
  const rivalIds = ["lazy", "ninja", "sable", "jake", "the-mother", "wendigo", "ice-golem", "bigfoot", "pp-mara", "eli-ransom", "jenny-night-signal", "chrome", "nyx", "king", "warden", "bone", "grit"];
  const lastFighterStorageKey = "midnight-fist-last-fighter";
  const lastArenaStorageKey = "midnight-fist-last-arena";
  function readLocalPreference(key, fallback) {
    try {
      return window.localStorage?.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }
  function writeLocalPreference(key, value) {
    try {
      window.localStorage?.setItem(key, value);
    } catch {
      // The game remains fully usable when browser storage is blocked.
    }
  }
  const restoredFighterId = readLocalPreference(lastFighterStorageKey, "pp-mara");
  let selectedCharacterId = characterById.has(restoredFighterId) ? restoredFighterId : "pp-mara";
  let enemyCharacterId = "chrome";
  let selectMode = "roster";
  let selectStep = "fighter";

  function resolveHostedAsset(relativePath) {
    if (/^https?:\/\//i.test(String(relativePath))) return String(relativePath);
    const manifest = window.MIDNIGHT_FIST_MANIFEST;
    if (manifest && manifest[relativePath]) return manifest[relativePath];
    const base = window.MIDNIGHT_FIST_CONFIG?.assetBase || window.MIDNIGHT_FIST_ASSET_BASE;
    if (base) return `${String(base).replace(/\/$/, "")}/${String(relativePath).replace(/^\//, "")}`;
    return relativePath;
  }

    const defaultArenaCatalog = [
    { id: "metro", name: "Metro Ring", image: "https://plot-pulse.com/wp-content/uploads/2026/06/midnight-fist-assets-fal-arena.png", fx: "metro", parallax: 1 },
    { id: "neon-docks", name: "Neon Docks", image: "https://plot-pulse.com/wp-content/uploads/2026/06/midnight-fist-assets-arenas-neon-docks.jpg", fx: "rain", parallax: 1.2 },
    { id: "temple", name: "Temple Ruins", image: "https://plot-pulse.com/wp-content/uploads/2026/06/midnight-fist-assets-arenas-warehouse.jpg", fx: "embers", parallax: 0.8 },
    { id: "warehouse", name: "Warehouse", image: "https://plot-pulse.com/wp-content/uploads/2026/06/midnight-fist-assets-arenas-temple-ruins.jpg", fx: "sparks", parallax: 1 },
    { id: "music-festival", name: "Music Festival", image: "https://plot-pulse.com/wp-content/uploads/2026/07/midnight-fist-assets-arenas-music-festival.jpg", fx: "music", parallax: 0.9 },
    { id: "rooftop-arcade", name: "Rooftop Arcade", image: "https://plot-pulse.com/wp-content/uploads/2026/07/midnight-fist-assets-arenas-rooftop-arcade.jpg", fx: "arcade", parallax: 1.05, spaceFinisher: true },
    { id: "raven-hollow-relay", name: "Raven's Hollow Relay", image: "https://plot-pulse.com/wp-content/uploads/2026/07/midnight-fist-assets-arenas-raven-hollow-relay.jpg", fx: "signal", parallax: 0.92 },
    { id: "creeping-antler-woods", name: "Creeping Antler Woods", image: "https://plot-pulse.com/wp-content/uploads/2026/07/midnight-fist-assets-arenas-creeping-antler-woods.jpg", fx: "haunt", parallax: 0.88 },
    { id: "haunted-stadium", name: "Haunted Stadium", image: "https://plot-pulse.com/wp-content/uploads/2026/07/midnight-fist-assets-arenas-haunted-stadium-football.jpg", floorImage: "https://plot-pulse.com/wp-content/uploads/2026/07/midnight-fist-assets-arenas-haunted-stadium.jpg", fx: "haunt", parallax: 0.86 },
    { id: "orbital-graveyard", name: "Orbital Graveyard", image: "https://plot-pulse.com/wp-content/uploads/2026/09/orbital-graveyard-bg.jpg", floorImage: "https://plot-pulse.com/wp-content/uploads/2026/09/orbital-graveyard-floor.jpg", fx: "space", parallax: 0.35, spaceFinisher: true },
    { id: "archive-bay-6", name: "Archive Bay 6", image: "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-archive-bay-6-bg.jpg", floorImage: "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-archive-bay-6-floor.jpg", fx: "signal", parallax: 0.9, windowFinisher: true },
    { id: "hermes-dead-letter", name: "Dead-Letter Loft", image: "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-hermes-dead-letter-bg.jpg", floorImage: "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-hermes-dead-letter-floor.jpg", fx: "signal", parallax: 0.9 },
    { id: "redvale-channel-eight", name: "Redvale Channel Eight", image: "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-redvale-channel-eight-bg.jpg", floorImage: "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-redvale-channel-eight-floor.jpg", fx: "arcade", parallax: 0.9 },
    { id: "unaired-puppet-loft", name: "Unaired Loft", image: "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-unaired-puppet-loft-bg.jpg", floorImage: "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-unaired-puppet-loft-floor.jpg", fx: "haunt", parallax: 0.88 },
    { id: "intake-4b", name: "Intake 4B", image: "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-intake-4b-bg.jpg", floorImage: "https://plot-pulse.com/wp-content/uploads/2026/09/mfl-arena-intake-4b-floor.jpg", fx: "signal", parallax: 0.92 }
  ];

  function mergePermanentArenas(baseArenas = []) {
    const additions = defaultArenaCatalog.filter((arena) => arena.id === "music-festival" || arena.id === "rooftop-arcade" || arena.id === "raven-hollow-relay" || arena.id === "creeping-antler-woods" || arena.id === "haunted-stadium" || arena.id === "orbital-graveyard" || arena.id === "archive-bay-6" || arena.id === "hermes-dead-letter" || arena.id === "redvale-channel-eight" || arena.id === "unaired-puppet-loft" || arena.id === "intake-4b");
    const merged = [...baseArenas];
    for (const arena of additions) {
      const existing = merged.find((item) => item.id === arena.id);
      if (!existing) merged.push({ ...arena });
      else {
        if (arena.image) existing.image = arena.image;
        if (arena.floorImage) existing.floorImage = arena.floorImage;
        if (arena.name) existing.name = arena.name;
        if (arena.fx) existing.fx = arena.fx;
        if (typeof arena.parallax === "number") existing.parallax = arena.parallax;
        if (arena.spaceFinisher) existing.spaceFinisher = arena.spaceFinisher;
        if (arena.spaceFinisher) existing.spaceFinisher = true;
        if (arena.windowFinisher) existing.windowFinisher = true;
      }
    }
    return merged;
  }

  const arenaCatalog = mergePermanentArenas(loadEditorArenas(editorProject) || defaultArenaCatalog);
  const restoredArenaId = readLocalPreference(lastArenaStorageKey, "metro");
  let selectedArenaId = arenaCatalog.some((arena) => arena.id === restoredArenaId) ? restoredArenaId : "metro";

  function loadArenaAsset(arena) {
    return arena.image ? loadImageAsset(resolveHostedAsset(arena.image)) : null;
  }

  const arenaAssets = new Map();
  const arenaFloorAssets = new Map();
  const watchedArenaAssets = new WeakSet();

  function watchArenaAssetForPicker(asset) {
    if (!asset?.image || watchedArenaAssets.has(asset.image)) return;
    watchedArenaAssets.add(asset.image);
    const refreshPicker = () => renderArenaPicker();
    asset.image.addEventListener("load", refreshPicker);
    asset.image.addEventListener("error", refreshPicker);
  }

  function getArenaAsset(arena, load = false) {
    if (!arena?.image) return null;
    let asset = arenaAssets.get(arena.id);
    if (!asset && load) {
      asset = loadArenaAsset(arena);
      arenaAssets.set(arena.id, asset);
      watchArenaAssetForPicker(asset);
    }
    return asset;
  }

  function getArenaFloorAsset(arena, load = false) {
    if (!arena?.floorImage) return null;
    let asset = arenaFloorAssets.get(arena.id);
    if (!asset && load) {
      asset = loadImageAsset(resolveHostedAsset(arena.floorImage));
      arenaFloorAssets.set(arena.id, asset);
    }
    return asset;
  }

  function ensureArenaAssets() {
    const liveArenaIds = new Set(arenaCatalog.map((arena) => arena.id));
    for (const arenaId of [...arenaAssets.keys()]) {
      if (!liveArenaIds.has(arenaId)) arenaAssets.delete(arenaId);
    }
    for (const arenaId of [...arenaFloorAssets.keys()]) {
      if (!liveArenaIds.has(arenaId)) arenaFloorAssets.delete(arenaId);
    }
  }
  const generatedAssets = {
    fighters: new Map(),
    moveSheets: new Map(),
  };
  const generatedSpriteFrames = {};
  const assetNameAliases = {
    dragon: ["Dragon Fist"],
    sable: ["Sable", "Rast", "Wasp"],
    marauder: ["Mara"],
    "pp-mara": ["Mara", "pp-mara"],
    "eli-dev": ["Eli"],
    "eli-ransom": ["Eli Ransom", "Eli"],
    "elena-voss": ["Elena Voss", "Elena"],
    "elias-crowe": ["Elias Crowe", "Elias"],
    "the-mother": ["The Mother", "Mother"],
    wendigo: ["Wendigo"],
    "ice-golem": ["Ice Golem", "Frost Golem"],
    bigfoot: ["Bigfoot", "Sasquatch"],
    john: ["John"],
    alex: ["Alex"],
  };

  function fighterAssetPaths(character) {
    const names = [
      character.name,
      character.id,
      ...(assetNameAliases[character.id] || []),
      `${character.id}-sheet`,
    ];
    const uniqueNames = [...new Set(names)];
    const plotPulsePaths = plotPulseIds.has(character.id)
      ? uniqueNames.flatMap((name) => [
          `assets/fighters/plot-pulse/${name}.png`,
          `assets/fighters/plot-pulse/${name}.jpg`,
          `assets/fighters/plot-pulse/${name}.jpeg`,
          `assets/fighters/plot-pulse/${name}.webp`,
        ])
      : [];
    const paths = [
      ...plotPulsePaths,
      ...uniqueNames.flatMap((name) => [
        `assets/fighters/fal-clean/${name}.png`,
        `assets/fighters/fal-edits/${name}.png`,
        `assets/fighters/working-hd/${name}.png`,
        `assets/fighters/working/${name}.png`,
        `assets/fighters/${name}.png`,
        `assets/fighters/${name}.jpg`,
        `assets/fighters/${name}.jpeg`,
        `assets/fighters/${name}.webp`,
      ]),
    ];
    return [...new Set(paths.map((assetPath) => resolveHostedAsset(assetPath)))];
  }

  function fighterMoveSheetPaths(character) {
    const names = [
      character.name,
      character.id,
      ...(assetNameAliases[character.id] || []),
    ];
    const uniqueNames = [...new Set(names)];
    return uniqueNames.map((name) => resolveHostedAsset(`assets/fighters/move-sheets/${name}.png`));
  }

  function ensureFighterVisualAssets(characterId) {
    if (characterId === "custom") return;
    const character = characterById.get(characterId) || [...roster, ...hiddenRivals].find((item) => item.id === characterId);
    if (!character) return;
    let fighterAsset = generatedAssets.fighters.get(character.id);
    let moveAsset = generatedAssets.moveSheets.get(character.id);
    if (!fighterAsset) {
      fighterAsset = loadFirstAvailableImage(fighterAssetPaths(character));
      generatedAssets.fighters.set(character.id, fighterAsset);
      queueBuilderPreviewRefreshOnAssetLoad(character.id, fighterAsset);
    }
    if (!moveAsset) {
      moveAsset = loadFirstAvailableMoveSheet(fighterMoveSheetPaths(character));
      generatedAssets.moveSheets.set(character.id, moveAsset);
      queueBuilderPreviewRefreshOnAssetLoad(character.id, moveAsset);
    }
  }

  function warmCurrentMatchAssets() {
    ensureFighterVisualAssets(selectedCharacterId);
    ensureFighterVisualAssets(enemyCharacterId);
  }

  // Snappier strikes: shorter startup/recovery so button presses connect quickly.
  const attacks = {
    light: {
      label: "Jab",
      duration: 275,
      activeStart: 68,
      activeEnd: 160,
      damage: 4,
      stun: 240,
      knockback: 155,
      meterGain: 8,
      boxW: 58,
      boxH: 34,
      centerY: 82,
      cooldown: 125,
      spark: "#f8dd94",
    },
    heavy: {
      label: "Roundhouse",
      duration: 510,
      activeStart: 150,
      activeEnd: 310,
      damage: 8,
      stun: 450,
      knockback: 320,
      meterGain: 12,
      boxW: 74,
      boxH: 42,
      centerY: 56,
      cooldown: 220,
      spark: "#ff6b39",
    },
    upper: {
      label: "Rising Cut",
      duration: 540,
      activeStart: 120,
      activeEnd: 265,
      damage: 7,
      stun: 530,
      knockback: 170,
      launch: 600,
      meterGain: 11,
      boxW: 50,
      boxH: 80,
      centerY: 96,
      cooldown: 235,
      spark: "#9ef3ff",
    },
    crouchLight: {
      label: "Low Jab",
      duration: 260,
      activeStart: 64,
      activeEnd: 150,
      damage: 3,
      stun: 210,
      knockback: 140,
      meterGain: 7,
      boxW: 56,
      boxH: 28,
      centerY: 42,
      cooldown: 120,
      crouch: true,
      spark: "#f8dd94",
    },
    crouchKick: {
      label: "Low Kick",
      duration: 395,
      activeStart: 108,
      activeEnd: 245,
      damage: 6,
      stun: 360,
      knockback: 280,
      meterGain: 10,
      boxW: 72,
      boxH: 30,
      centerY: 34,
      cooldown: 185,
      crouch: true,
      spark: "#ff8f4a",
    },
    special: {
      label: "Arc Bolt",
      duration: 510,
      spawnTime: 160,
      cost: 24,
      cooldown: 255,
    },
    beam: {
      label: "Line Breaker",
      duration: 640,
      spawnTime: 190,
      cost: 38,
      cooldown: 410,
    },
    surge: {
      label: "Surge Cross",
      duration: 560,
      spawnTime: 150,
      cost: 30,
      cooldown: 340,
    },
    crush: {
      label: "Crush Drive",
      duration: 525,
      activeStart: 135,
      activeEnd: 345,
      damage: 12,
      stun: 640,
      knockback: 440,
      meterGain: 6,
      boxW: 92,
      boxH: 78,
      centerY: 74,
      cost: 32,
      cooldown: 425,
      dashSpeed: 520,
      spark: "#f8dd94",
    },
    dash: {
      label: "Shadow Step",
      duration: 445,
      activeStart: 105,
      activeEnd: 270,
      damage: 10,
      stun: 510,
      knockback: 380,
      meterGain: 7,
      boxW: 76,
      boxH: 76,
      centerY: 72,
      cost: 34,
      cooldown: 320,
      dashSpeed: 680,
      spark: "#69f4ff",
    },
  };

  let player;
  let enemy;
  let lastTime = 0;
  let projectiles = [];
  let particles = [];
  let blood = [];
  let stains = [];
  let afterImages = [];
  let limbs = [];
  let goreChunks = [];
  let comboFloats = [];
  let impactVfx = [];

  const game = {
    phase: "splash",
    time: 0,
    roundTime: 99,
    timerAcc: 0,
    countdown: 0,
    finishTimer: 0,
    finisherTime: 0,
    finisher: null,
    overTimer: 0,
    arenaTheme: 0,
    arenaPulse: 0,
    signalBufferTimer: 0,
    signalBufferNext: 3800,
    shake: 0,
    flash: 0,
    hitStop: 0,
    toast: "",
    toastTime: 0,
    bgFx: [],
    progressionAwarded: false,
    matchStats: null,
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function toward(from, to) {
    return to.x >= from.x ? 1 : -1;
  }

  function loadImageAsset(src) {
    const asset = { src, image: null, keyedImage: null, ready: false, failed: false };
    if (typeof Image === "undefined") return asset;
    const image = new Image();
    image.onload = () => {
      asset.keyedImage = safelyKeyBlackBackground(image);
      asset.frames = buildGeneratedFrameRects(asset.keyedImage || image);
      asset.baseFrameH = asset.frames && asset.frames[0] ? asset.frames[0].h : null;
      asset.ready = true;
    };
    image.onerror = () => {
      asset.failed = true;
    };
    image.src = src;
    asset.image = image;
    return asset;
  }

  function loadFirstAvailableImage(sources) {
    const asset = { src: sources[0], image: null, keyedImage: null, ready: false, failed: false };
    if (typeof Image === "undefined") return asset;
    let index = 0;
    const image = new Image();
    image.onload = () => {
      asset.src = sources[index];
      asset.loadedSrc = sources[index];
      asset.keyedImage = safelyKeyBlackBackground(image);
      asset.frames = buildGeneratedFrameRects(asset.keyedImage || image);
      asset.baseFrameH = asset.frames && asset.frames[0] ? asset.frames[0].h : null;
      asset.ready = true;
      asset.failed = false;
    };
    image.onerror = () => {
      index += 1;
      if (index >= sources.length) {
        asset.failed = true;
        return;
      }
      image.src = sources[index];
    };
    image.src = sources[index];
    asset.image = image;
    return asset;
  }

  function loadFirstAvailableMoveSheet(sources) {
    const asset = { src: sources[0], image: null, keyedImage: null, ready: false, failed: false };
    if (typeof Image === "undefined") return asset;
    let index = 0;
    const image = new Image();
    image.onload = () => {
      asset.src = sources[index];
      asset.loadedSrc = sources[index];
      asset.keyedImage = safelyKeyBlackBackground(image);
      asset.frames = buildMoveSheetFrameRects(asset.keyedImage || image);
      asset.baseFrameH = asset.frames && asset.frames[0] ? asset.frames[0].h : null;
      asset.ready = true;
      asset.failed = false;
    };
    image.onerror = () => {
      index += 1;
      if (index >= sources.length) {
        asset.failed = true;
        return;
      }
      image.src = sources[index];
    };
    image.src = sources[index];
    asset.image = image;
    return asset;
  }

  function safelyKeyBlackBackground(image) {
    try {
      return makeBlackKeyedImage(image);
    } catch (error) {
      return image;
    }
  }

  function makeBlackKeyedImage(image) {
    if (!document.createElement) return image;
    const c = document.createElement("canvas");
    const keyCtx = c.getContext && c.getContext("2d");
    if (!keyCtx || !keyCtx.getImageData) return image;
    c.width = image.width;
    c.height = image.height;
    keyCtx.drawImage(image, 0, 0);
    const img = keyCtx.getImageData(0, 0, c.width, c.height);
    const data = img.data;
    let hasExistingTransparency = false;
    for (let i = 3; i < data.length; i += 64) {
      if (data[i] < 250) {
        hasExistingTransparency = true;
        break;
      }
    }
    if (hasExistingTransparency) return c;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max < 32 || (max < 54 && max - min < 12)) data[i + 3] = 0;
    }
    keyCtx.putImageData(img, 0, 0);
    return c;
  }

  function sheetGridMap(image) {
    const cols = image.width / image.height < 1.62 ? 10 : SPRITE_COLS;
    const nineColMap = [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 2],
      [7, 2],
      [8, 3],
    ];
    const tenColMap = [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [3, 1],
      [7, 0],
      [5, 1],
      [7, 2],
      [1, 3],
    ];
    return { cols, rows: SPRITE_ROWS, map: cols === 10 ? tenColMap : nineColMap };
  }

  function buildGeneratedFrameRects(image) {
    if (!document.createElement) return null;
    const c = document.createElement("canvas");
    const frameCtx = c.getContext && c.getContext("2d", { willReadFrequently: true });
    if (!frameCtx || !frameCtx.getImageData) return null;
    c.width = image.width;
    c.height = image.height;
    try {
      frameCtx.drawImage(image, 0, 0);
      const pixels = frameCtx.getImageData(0, 0, c.width, c.height).data;
      const { cols, rows, map } = sheetGridMap(image);
      const cellW = image.width / cols;
      const cellH = image.height / rows;
      return map.map(([col, row]) => trimFrameToAlpha(pixels, image.width, image.height, col * cellW, row * cellH, cellW, cellH));
    } catch (error) {
      return null;
    }
  }

  function buildMoveSheetFrameRects(image) {
    if (!document.createElement) return null;
    const c = document.createElement("canvas");
    const frameCtx = c.getContext && c.getContext("2d", { willReadFrequently: true });
    if (!frameCtx || !frameCtx.getImageData) return null;
    c.width = image.width;
    c.height = image.height;
    try {
      frameCtx.drawImage(image, 0, 0);
      const pixels = frameCtx.getImageData(0, 0, c.width, c.height).data;
      const frames = 9;
      const cellW = image.width / frames;
      return Array.from({ length: frames }, (_, frame) => trimFrameToAlpha(pixels, image.width, image.height, frame * cellW, 0, cellW, image.height));
    } catch (error) {
      return null;
    }
  }

  function trimFrameToAlpha(pixels, imageW, imageH, x, y, w, h) {
    const minX = Math.max(0, Math.floor(x));
    const minY = Math.max(0, Math.floor(y));
    const maxX = Math.min(imageW, Math.ceil(x + w));
    const maxY = Math.min(imageH, Math.ceil(y + h));
    const cellW = maxX - minX;
    const cellH = maxY - minY;
    const visited = new Uint8Array(cellW * cellH);
    const components = [];

    function localIndex(px, py) {
      return (py - minY) * cellW + (px - minX);
    }

    function isVisible(px, py) {
      return pixels[(py * imageW + px) * 4 + 3] >= 18;
    }

    for (let py = minY; py < maxY; py += 1) {
      for (let px = minX; px < maxX; px += 1) {
        const start = localIndex(px, py);
        if (visited[start] || !isVisible(px, py)) continue;

        const stack = [start];
        visited[start] = 1;
        let count = 0;
        let left = px;
        let right = px;
        let top = py;
        let bottom = py;

        while (stack.length) {
          const current = stack.pop();
          const cx = minX + (current % cellW);
          const cy = minY + Math.floor(current / cellW);
          count += 1;
          left = Math.min(left, cx);
          right = Math.max(right, cx);
          top = Math.min(top, cy);
          bottom = Math.max(bottom, cy);

          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];
          for (const [nx, ny] of neighbors) {
            if (nx < minX || nx >= maxX || ny < minY || ny >= maxY) continue;
            const next = localIndex(nx, ny);
            if (visited[next] || !isVisible(nx, ny)) continue;
            visited[next] = 1;
            stack.push(next);
          }
        }

        components.push({ count, left, right, top, bottom });
      }
    }

    if (!components.length) return { x, y, w, h };
    const largest = components.reduce((best, component) => (component.count > best.count ? component : best), components[0]);
    const keepThreshold = Math.max(16, largest.count * 0.035);
    const largestCenterX = (largest.left + largest.right) / 2;
    const kept = components.filter((component) => {
      const touchesTop = component.top <= minY + 2;
      const touchesBottom = component.bottom >= maxY - 3;
      const centerX = (component.left + component.right) / 2;
      const alignedWithBody = Math.abs(centerX - largestCenterX) < cellW * 0.38;
      const nearBody = component.bottom >= largest.top - cellH * 0.18 && component.top <= largest.bottom + cellH * 0.18;
      const smallEdgeFragment = component.count < largest.count * 0.12 && (touchesTop || touchesBottom) && !(alignedWithBody && nearBody);
      return component.count >= keepThreshold && !smallEdgeFragment;
    });
    const selected = kept.length ? kept : [largest];
    let left = Math.min(...selected.map((component) => component.left));
    let right = Math.max(...selected.map((component) => component.right));
    let top = Math.min(...selected.map((component) => component.top));
    let bottom = Math.max(...selected.map((component) => component.bottom));

    const pad = 3;
    left = Math.max(minX, left - pad);
    right = Math.min(maxX - 1, right + pad);
    top = Math.max(minY, top - pad);
    bottom = Math.min(maxY - 1, bottom + pad);
    return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
  }

  function nowMs() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  function fighter(id, name, style, body, hairStyle, outfit, finisher, palette) {
    return { id, name, style, body, hairStyle, outfit, finisher, palette };
  }

  function fighterFromData(data) {
    return fighter(
      data.id,
      data.name,
      data.style,
      data.body,
      data.hairStyle,
      data.outfit,
      data.finisher,
      data.palette,
    );
  }

  function cleanPaletteOverrides(palette) {
    const clean = {};
    if (!palette || typeof palette !== "object") return clean;
    for (const [key, value] of Object.entries(palette)) {
      if (typeof value === "string" && value.trim() && value !== "undefined") clean[key] = value;
    }
    return clean;
  }

  function applyStockRosterOverrides(character) {
    const stock = defaultRoster.find((item) => item.id === character.id);
    if (!stock) return character;
    return {
      ...stock,
      ...character,
      palette: {
        ...stock.palette,
        ...cleanPaletteOverrides(character.palette),
      },
    };
  }

  function readEditorProject() {
    if (window.MIDNIGHT_FIST_EDITOR_PROJECT) return window.MIDNIGHT_FIST_EDITOR_PROJECT;
    if (window.MIDNIGHT_FIST_PROJECT) return window.MIDNIGHT_FIST_PROJECT;
    if (!document.documentElement.hasAttribute("data-midnight-fist-editor-preview")) return null;
    try {
      const cached = window.sessionStorage?.getItem("mf-editor-project");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  function loadEditorRoster(project) {
    if (!project?.roster?.length) return null;
    return project.roster.map(fighterFromData).map(applyStockRosterOverrides);
  }

  function mergePermanentRoster(baseRoster) {
    const merged = [...baseRoster];
    for (const character of permanentRosterAdditions) {
      if (!merged.some((item) => item.id === character.id)) merged.push(character);
    }
    return merged;
  }

  function mergeStockHiddenRivals(baseRivals) {
    const merged = [...(baseRivals || [])];
    for (const character of defaultHiddenRivals) {
      if (!merged.some((item) => item.id === character.id)) merged.push(character);
    }
    return merged;
  }

  function applyStockHiddenOverrides(character) {
    if (!["lazy", "ninja", "sable", "the-mother", "wendigo", "ice-golem", "bigfoot"].includes(character.id)) return character;
    const stock = defaultHiddenRivals.find((item) => item.id === character.id);
    if (!stock) return character;
    return {
      ...character,
      name: stock.name,
      style: stock.style,
      body: stock.body,
      hairStyle: stock.hairStyle,
      outfit: stock.outfit,
      finisher: stock.finisher,
      palette: { ...stock.palette },
    };
  }

  function loadEditorHiddenRivals(project) {
    if (!project?.hiddenRivals?.length) return null;
    return mergeStockHiddenRivals(project.hiddenRivals.map(fighterFromData).map(applyStockHiddenOverrides));
  }

  function loadEditorArenas(project) {
    if (!project?.arenas?.length) return null;
    return project.arenas;
  }

  function riftalityForFighter(id, project = readEditorProject()) {
    const list = project?.riftalities?.riftalities;
    if (!Array.isArray(list)) return null;
    return list.find((entry) => entry.assignedFighterIds?.includes(id) || entry.id === id) || null;
  }

  function powerFamilyStyle(family, project = readEditorProject()) {
    return project?.powerStyles?.families?.[family] || null;
  }

  function isEditorPreview() {
    return document.documentElement.hasAttribute("data-midnight-fist-editor-preview");
  }

  function isEditorFighterFocus() {
    return isEditorPreview() && document.body.classList.contains("editor-fighter-focus");
  }

  function setEditorFighterFocus(active) {
    document.body.classList.toggle("editor-fighter-focus", Boolean(active));
    if (selectScreen) {
      if (active) selectScreen.dataset.editorFocus = "fighter";
      else delete selectScreen.dataset.editorFocus;
    }
  }

  function applyEditorRosterData(project) {
    if (!project) return;
    if (project.roster?.length) {
      const fighters = mergePermanentRoster(project.roster.map(fighterFromData).map(applyStockRosterOverrides));
      roster.splice(0, roster.length, ...fighters);
      for (const character of fighters) characterById.set(character.id, character);
    }
    if (project.hiddenRivals?.length) {
      const rivals = mergeStockHiddenRivals(project.hiddenRivals.map(fighterFromData).map(applyStockHiddenOverrides));
      hiddenRivals.splice(0, hiddenRivals.length, ...rivals);
      for (const character of rivals) characterById.set(character.id, character);
    }
    if (project.arenas?.length) {
      arenaCatalog.splice(0, arenaCatalog.length, ...mergePermanentArenas(project.arenas));
      ensureArenaAssets();
      renderArenaPicker();
    }
  }

  function enterEditorFighterPreview(fighterId) {
    const id = characterById.has(fighterId) ? fighterId : selectedCharacterId;
    selectedCharacterId = id;
    selectMode = "roster";
    selectStep = "fighter";
    game.phase = "select";
    game.overTimer = 0;
    enemyCharacterId = chooseRivalId(id);
    player = createFighter(true, id);
    enemy = createFighter(false, enemyCharacterId);
    setScreen("select");
    setEditorFighterFocus(true);
    if (selectScreen) {
      selectScreen.dataset.selectMode = "roster";
      selectScreen.dataset.selectStep = "fighter";
    }
    const character = getCharacter(id);
    if (selectScreenTitle) selectScreenTitle.textContent = character.name;
    clearSelectMatchup();
    applySelectLayout();
    syncBuilderFromCharacter(id);
    renderRosterPreview();
    hideMessage();
    schedulePreviewRedraw();
  }

  function restoreEditorPreviewScene(project = readEditorProject()) {
    if (!project) return;
    const scene = project.scene || "splash";
    const selection = project.selection;

    if (scene === "fighter" && selection?.kind === "fighter" && selection.ref) {
      enterEditorFighterPreview(selection.ref);
      return;
    }

    setEditorFighterFocus(false);

    if (scene === "select") {
      enterSelectRoster();
      if (selection?.ref && characterById.has(selection.ref)) {
        selectedCharacterId = selection.ref;
        enemyCharacterId = chooseRivalId(selectedCharacterId);
        player = createFighter(true, selectedCharacterId);
        enemy = createFighter(false, enemyCharacterId);
        renderRoster();
        renderRosterPreview();
      }
      return;
    }

    if (scene === "arena") {
      enterSelectRoster();
      if (selection?.ref && characterById.has(selection.ref)) selectedCharacterId = selection.ref;
      selectStep = "arena";
      applySelectLayout();
      renderArenaPicker();
      return;
    }

    if (scene === "fight") {
      if (selection?.ref && characterById.has(selection.ref)) selectedCharacterId = selection.ref;
      enemyCharacterId = chooseRivalId(selectedCharacterId);
      player = createFighter(true, selectedCharacterId);
      enemy = createFighter(false, enemyCharacterId);
      game.phase = "fight";
      game.roundTime = 99;
      game.roundStartWall = performance.now();
      game.countdown = 0;
      setScreen("fight");
      updateHud();
      return;
    }

    enterSplash();
  }

  function applyEditorProjectUpdate(project) {
    if (!project) return;
    window.MIDNIGHT_FIST_EDITOR_PROJECT = project;
    applyEditorRosterData(project);
    applyUiLayout(project);
    restoreEditorPreviewScene(project);
  }

  function applyEditorPreviewBoot(project = readEditorProject()) {
    if (!isEditorPreview() || !project) return false;
    applyEditorRosterData(project);
    restoreEditorPreviewScene(project);
    return true;
  }

  function applyUiLayout(project = readEditorProject()) {
    const layout = project?.uiLayout;
    if (!layout) return;
    const splash = layout.splash || {};
    const theme = layout.theme || {};
    const select = layout.select || {};
    const rootStyle = document.documentElement.style;
    if (theme.accent) rootStyle.setProperty("--mf-accent", theme.accent);
    if (theme.accentAlt) rootStyle.setProperty("--mf-accent-alt", theme.accentAlt);
    if (theme.panel) rootStyle.setProperty("--mf-panel", theme.panel);
    if (theme.buttonRadius) rootStyle.setProperty("--mf-button-radius", `${theme.buttonRadius}px`);

    const splashLayer = query("#splash-screen");
    if (splashLayer) {
      splashLayer.style.backgroundColor = "";
      splashLayer.style.backgroundImage = "";
      splashLayer.style.backgroundSize = "";
      splashLayer.style.backgroundPosition = "";
      splashLayer.style.boxShadow = "";
    }

    const taglineEl = query(".splash-build");
    if (taglineEl && splash.tagline) taglineEl.textContent = splash.tagline;

    const splashMenu = query(".splash-menu");
    if (splashMenu) {
      if (splash.menuGap) splashMenu.style.gap = `${splash.menuGap}px`;
      if (splash.menuAlign) splashMenu.style.alignItems = splash.menuAlign;
    }

    (splash.buttons || []).forEach((buttonDef) => {
      const button = query(`#${buttonDef.id}`);
      if (!button) return;
      if (buttonDef.label) button.textContent = buttonDef.label;
      if (buttonDef.order != null) button.style.order = String(buttonDef.order);
      if (buttonDef.variant === "primary" && theme.buttonPrimaryBg) button.style.background = theme.buttonPrimaryBg;
      if (buttonDef.variant === "secondary" && theme.buttonSecondaryBg) button.style.background = theme.buttonSecondaryBg;
      if (theme.buttonRadius) button.style.borderRadius = `${theme.buttonRadius}px`;
    });

    if (selectScreenTitle) {
      if (selectMode === "create" && select.createTitle) selectScreenTitle.textContent = select.createTitle;
      else if (select.title) selectScreenTitle.textContent = select.title;
    }
    if (continueButton && select.continueLabel) continueButton.textContent = select.continueLabel;
    if (startButton && select.startLabel) startButton.textContent = select.startLabel;
    if (backToSplashButton && select.backLabel) backToSplashButton.textContent = select.backLabel;
  }

  function normalizeCustomDraft(raw) {
    const base = customDefaultDraft;
    const palette = { ...base.palette, ...(raw && raw.palette ? raw.palette : {}) };
    const riftalityId = builderPools.riftalityId.includes(raw && raw.riftalityId) ? raw.riftalityId : base.riftalityId;
    const legacyBeard = raw && raw.hairStyle === "beard";
    const legacyWardrobe = {
      trunks: ["bare", "trunks"],
      jeans: ["tee", "jeans"],
      crop: ["crop", "leggings"],
      shorts: ["tee", "shorts"],
      arena: ["arena", "trunks"],
      armor: ["armor", "greaves"],
      tank: ["tank", "jeans"],
      gi: ["gi", "gi"],
      bones: ["bones", "bones"],
      robe: ["robe", "leggings"],
      fatigues: ["jacket", "cargos"],
    };
    const legacyOutfit = builderPools.outfit.includes(raw && raw.outfit) ? raw.outfit : base.outfit;
    const migratedWardrobe = legacyWardrobe[legacyOutfit] || [base.shirt, base.pants];
    const progression = normalizeFighterProgression(raw && raw.progression);
    const body = builderPools.body.includes(raw && raw.body) ? raw.body : base.body;
    const economy = normalizeFighterEconomy(raw && raw.economy, body);
    // Cosmetics stay Gear-tab-only until RC unlock; locked values fall back to free defaults.
    let shirt = builderPools.shirt.includes(raw && raw.shirt) ? raw.shirt : migratedWardrobe[0];
    if (!isAppearanceUnlocked(economy, "shirt", shirt)) shirt = FREE_SHIRTS.includes(migratedWardrobe[0]) ? migratedWardrobe[0] : "tee";
    let accessory = (builderPools.accessory || ["none"]).includes(raw && raw.accessory) ? raw.accessory : (base.accessory || "none");
    if (!isAppearanceUnlocked(economy, "accessory", accessory)) accessory = "none";
    return {
      name: cleanFighterName(raw && raw.name ? raw.name : base.name),
      body,
      hairStyle: legacyBeard ? "crop" : builderPools.hairStyle.includes(raw && raw.hairStyle) ? raw.hairStyle : base.hairStyle,
      facialHair: builderPools.facialHair.includes(raw && raw.facialHair) ? raw.facialHair : legacyBeard ? "full" : base.facialHair,
      outfit: legacyOutfit,
      shirt,
      pants: builderPools.pants.includes(raw && raw.pants) ? raw.pants : migratedWardrobe[1],
      faceExpression: builderPools.faceExpression.includes(raw && raw.faceExpression) ? raw.faceExpression : base.faceExpression,
      faceMask: builderPools.faceMask.includes(raw && raw.faceMask) ? raw.faceMask : base.faceMask,
      accessory,
      riftalityId,
      riftalityLocked: Boolean(raw?.riftalityLocked),
      progression,
      economy,
      palette: {
        skin: cleanHex(palette.skin, base.palette.skin),
        hair: cleanHex(palette.hair, base.palette.hair),
        accent: cleanHex(palette.accent, base.palette.accent),
        gloves: cleanHex(palette.gloves, base.palette.gloves),
        trunks: cleanHex(palette.trunks, base.palette.trunks),
        boots: cleanHex(palette.boots, base.palette.boots),
        meter: cleanHex(palette.meter, base.palette.meter),
      },
    };
  }

  function normalizeFighterProgression(raw) {
    const base = customDefaultDraft.progression;
    const stats = raw && raw.stats ? raw.stats : {};
    return {
      version: 1,
      level: clamp(Math.round(Number(raw?.level) || base.level), 1, 100),
      xp: Math.max(0, Math.round(Number(raw?.xp) || 0)),
      // Free upgrade points disabled — Training spends Rift Credits only.
      upgradePoints: 0,
      stats: {
        punch: clamp(Math.round(Number(stats.punch) || 0), 0, progressionStatCap),
        kick: clamp(Math.round(Number(stats.kick) || 0), 0, progressionStatCap),
        rift: clamp(Math.round(Number(stats.rift) || 0), 0, progressionStatCap),
        defense: clamp(Math.round(Number(stats.defense) || 0), 0, progressionStatCap),
      },
    };
  }

  function xpForNextFighterLevel(level) {
    return 100 + Math.max(0, level - 1) * 50;
  }

  function normalizeFighterEconomy(raw, body) {
    const base = customDefaultDraft.economy;
    const owned = [...new Set(Array.isArray(raw?.owned) ? raw.owned.filter((id) => gearItem(id)) : base.owned)];
    for (const starterId of base.owned) if (!owned.includes(starterId)) owned.push(starterId);
    const equippedRaw = raw?.equipped && typeof raw.equipped === "object" ? raw.equipped : base.equipped;
    const equipped = { gloves: null, boots: null, core: null, accessory: null, shirt: null };
    for (const slot of Object.keys(equipped)) {
      const item = gearItem(equippedRaw?.[slot]);
      if (item && item.slot === slot && owned.includes(item.id) && item.bodies.includes(body)) equipped[slot] = item.id;
    }
    if (!equipped.gloves) equipped.gloves = "starter-wraps";
    if (!equipped.boots) equipped.boots = "starter-boots";
    return {
      version: 1,
      credits: Math.max(0, Math.round(Number(raw?.credits) || (raw ? 0 : base.credits))),
      owned,
      equipped,
    };
  }

  function ownedAppearanceValues(economy, field) {
    const owned = new Set(FREE_SHIRTS.concat(FREE_ACCESSORIES));
    for (const id of economy?.owned || []) {
      const item = gearItem(id);
      const value = item?.appearance?.[field];
      if (value) owned.add(value);
    }
    return owned;
  }

  function isAppearanceUnlocked(economy, field, value) {
    if (field === "shirt" && FREE_SHIRTS.includes(value)) return true;
    if (field === "accessory" && FREE_ACCESSORIES.includes(value)) return true;
    return ownedAppearanceValues(economy, field).has(value);
  }

  function loadFighterWins() {
    try {
      const raw = window.localStorage?.getItem(fighterWinsStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveFighterWins(map) {
    try {
      window.localStorage?.setItem(fighterWinsStorageKey, JSON.stringify(map || {}));
    } catch {
      // ignore
    }
  }

  function loadFighterCostumes() {
    try {
      const raw = window.localStorage?.getItem(fighterCostumesStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveFighterCostumes(map) {
    try {
      window.localStorage?.setItem(fighterCostumesStorageKey, JSON.stringify(map || {}));
    } catch {
      // ignore
    }
  }

  let fighterWins = loadFighterWins();
  let fighterCostumes = loadFighterCostumes();

  function getFighterCostumes(fighterId) {
    return fighterCostumeCatalog[fighterId] || [{ id: "default", label: "Classic" }];
  }

  function isCostumeUnlocked(fighterId, costume) {
    if (!costume || costume.id === "default" || !costume.unlock) return true;
    if (costume.unlock.kind === "wins") return (Number(fighterWins[fighterId]) || 0) >= (costume.unlock.count || 1);
    return false;
  }

  function getSelectedCostumeId(fighterId) {
    const selected = fighterCostumes[fighterId] || "default";
    const entry = getFighterCostumes(fighterId).find((item) => item.id === selected);
    if (entry && isCostumeUnlocked(fighterId, entry)) return selected;
    return "default";
  }

  function applyCostumeToCharacter(character) {
    if (!character || character.id === "custom") return character;
    const costumeId = getSelectedCostumeId(character.id);
    const costume = getFighterCostumes(character.id).find((item) => item.id === costumeId) || getFighterCostumes(character.id)[0];
    const next = { ...character, costumeId: costume.id, palette: { ...character.palette } };
    if (costume.palette) Object.assign(next.palette, costume.palette);
    if (costume.outfit) next.outfit = costume.outfit;
    if (costume.shirt) next.shirt = costume.shirt;
    return next;
  }

  function recordFighterWin(characterId) {
    if (!characterId || characterId === "custom") return "";
    const before = Number(fighterWins[characterId]) || 0;
    fighterWins[characterId] = before + 1;
    saveFighterWins(fighterWins);
    const unlocked = getFighterCostumes(characterId).filter((costume) => {
      if (costume.id === "default" || !costume.unlock) return false;
      const need = costume.unlock.count || 1;
      return before < need && fighterWins[characterId] >= need;
    });
    if (!unlocked.length) return "";
    return `Unlocked ${unlocked.map((item) => item.label).join(", ")} for ${getCharacter(characterId)?.name || characterId}`;
  }

  const fighterLedgerStorageKey = "midnight-fist-fighter-ledger";
  let fighterLedgerEvents = [];

  function loadFighterLedger() {
    try {
      const raw = window.localStorage?.getItem(fighterLedgerStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(-200) : [];
    } catch {
      return [];
    }
  }

  function saveFighterLedger(events) {
    fighterLedgerEvents = Array.isArray(events) ? events.slice(-200) : [];
    try {
      window.localStorage?.setItem(fighterLedgerStorageKey, JSON.stringify(fighterLedgerEvents));
    } catch {
      // ignore
    }
  }

  function pushFighterLedgerEvent(event) {
    if (!event || !event.type) return;
    fighterLedgerEvents = loadFighterLedger();
    fighterLedgerEvents.push({ ...event, at: event.at || new Date().toISOString() });
    saveFighterLedger(fighterLedgerEvents);
  }

  function consumeFighterLedgerEvents() {
    const events = loadFighterLedger();
    saveFighterLedger([]);
    return events;
  }

  fighterLedgerEvents = loadFighterLedger();

  function sanitizeFighterForTerminalSave(fighter) {
    // Block live Terminal / archive edits from granting free upgrade points or free power.
    const draft = normalizeCustomDraft(fighter?.customDraft || fighter || {});
    draft.progression = normalizeFighterProgression({
      ...draft.progression,
      upgradePoints: 0,
    });
    // Soft client clamp: never ship upgradePoints; server ledger is authoritative when online.
    return {
      ...fighter,
      progression: draft.progression,
      economy: draft.economy,
      customDraft: draft,
      shirt: draft.shirt,
      pants: draft.pants,
      accessory: draft.accessory,
      palette: draft.palette,
      events: loadFighterLedger(),
    };
  }

  function equippedGearModifiers(economy) {
    const totals = { punch: 0, kick: 0, rift: 0, defense: 0 };
    for (const id of Object.values(economy?.equipped || {})) {
      const item = gearItem(id);
      if (!item) continue;
      for (const stat of Object.keys(totals)) totals[stat] += Number(item.modifiers?.[stat]) || 0;
    }
    return totals;
  }

  function cleanFighterName(value) {
    const cleaned = String(value || "").replace(/[^\w .'-]/g, "").trim().slice(0, 18);
    return cleaned || "Nova";
  }

  function cleanHex(value, fallback) {
    const text = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(text) ? text : fallback;
  }

  function shadeHex(hex, amount) {
    const value = parseInt(hex.slice(1), 16);
    const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
      return Math.max(0, Math.min(255, Math.round(channel * amount)));
    });
    return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }

  function smoothStep(value) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function mix(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
  }

  function createCustomCharacter(draft) {
    const data = normalizeCustomDraft(draft);
    const riftality = getBuilderRiftality(data.riftalityId);
    const gloveGear = gearItem(data.economy.equipped.gloves);
    const bootGear = gearItem(data.economy.equipped.boots);
    const coreGear = gearItem(data.economy.equipped.core);
    // Prefer explicit Colors-tab palette. Gear only tints gloves/boots/core when the
    // draft has not set those slots yet — wardrobe edits must not jump shirt colors.
    const palette = {
      skin: data.palette.skin,
      skinDark: shadeHex(data.palette.skin, 0.63),
      hair: data.palette.hair,
      accent: data.palette.accent || coreGear?.color || "#e06a28",
      gloves: data.palette.gloves || gloveGear?.color || "#f7f4e6",
      trunks: data.palette.trunks,
      trunksDark: shadeHex(data.palette.trunks, 0.56),
      boots: data.palette.boots || bootGear?.color || "#1b1f28",
      white: "#f7f4e6",
      meter: data.palette.meter,
    };
    const finisherName = data.riftalityId === "personal"
      ? `${data.name} Riftality`
      : riftality.label;
    const character = fighter("custom", data.name, "Built Fighter", data.body, data.hairStyle, data.outfit, finisherName, palette);
    character.shirt = data.shirt;
    character.pants = data.pants;
    character.riftalityId = data.riftalityId;
    character.faceExpression = data.faceExpression;
    character.faceMask = data.faceMask;
    character.accessory = data.accessory || "none";
    character.facialHair = data.facialHair;
    character.riftalityMapId = riftality.mapId;
    character.riftalityColors = { primary: riftality.primary, secondary: riftality.secondary };
    character.progression = data.progression;
    character.economy = data.economy;
    character.gearModifiers = equippedGearModifiers(data.economy);
    character.customDraft = data;
    return character;
  }

  function playableRoster() {
    return [...roster, ...hiddenRivals];
  }

  function loadKingDefeats() {
    try {
      const stored = window.localStorage?.getItem(kingDefeatStorageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
    } catch {
      return new Set();
    }
  }

  function saveKingDefeats() {
    try {
      window.localStorage?.setItem(kingDefeatStorageKey, JSON.stringify([...kingDefeats]));
    } catch {
      // Unlocks are optional progression; storage can be unavailable in privacy modes.
    }
  }

  function unlockedHiddenIds() {
    return new Set(kingUnlockMilestones.filter((item) => kingDefeats.size >= item.count).map((item) => item.id));
  }

  function isHiddenUnlocked(characterId) {
    return unlockedHiddenIds().has(characterId);
  }

  function recordKingDefeat() {
    if (player?.character?.id !== "king" || !enemy?.character?.id || enemy.character.id === "king") return "";
    const before = unlockedHiddenIds();
    kingDefeats.add(enemy.character.id);
    saveKingDefeats();
    const unlockedNow = hiddenRivals.filter((character) => isHiddenUnlocked(character.id) && !before.has(character.id));
    if (!unlockedNow.length) return "";
    renderRoster();
    return `Unlocked ${unlockedNow.map((character) => character.name).join(", ")}`;
  }

  function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function getCharacter(id) {
    return characterById.get(id) || characterById.get("rift");
  }

  function chooseRivalId(playerId) {
    const pool = rivalIds.filter((id) => id !== playerId);
    return pool[Math.floor(Math.random() * pool.length)] || "sable";
  }

  function nextRivalId(currentId, playerId) {
    const pool = rivalIds.filter((id) => id !== playerId);
    if (!pool.length) return chooseRivalId(playerId);
    const index = pool.indexOf(currentId);
    return pool[(index + 1 + pool.length) % pool.length];
  }


  function clearSelectMatchup() {
    if (!ui.rosterMatchup) return;
    ui.rosterMatchup.textContent = "";
    ui.rosterMatchup.hidden = true;
    ui.rosterMatchup.setAttribute("aria-hidden", "true");
  }

  function syncRosterMatchupForPhase() {
    if (!ui.rosterMatchup) return;
    // Never show X VS Y on Select / Create Fighter — it reflows the title bar.
    if (game.phase === "select" || (selectScreen && !selectScreen.hidden)) {
      clearSelectMatchup();
      return;
    }
    ui.rosterMatchup.hidden = true;
  }

  let opponentReelRunning = false;

  function playOpponentSlotReel(pool, finalId) {
    return new Promise((resolve) => {
      const host = document.body;
      let overlay = host.querySelector("#pp-opponent-reel");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "pp-opponent-reel";
        overlay.innerHTML = `
          <div class="pp-opponent-reel-card">
            <div class="pp-opponent-reel-label">Opponent</div>
            <div class="pp-opponent-reel-slot" aria-live="polite"><span></span></div>
          </div>`;
        if (!document.getElementById("pp-opponent-reel-style")) {
          const style = document.createElement("style");
          style.id = "pp-opponent-reel-style";
          style.textContent = `#pp-opponent-reel{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:rgba(4,6,12,.88);backdrop-filter:blur(4px);pointer-events:all}
#pp-opponent-reel[hidden]{display:none!important}
.pp-opponent-reel-card{width:min(440px,90vw);padding:26px 20px;border:1px solid #3a4b66;border-radius:14px;background:linear-gradient(180deg,#121826,#0a0e16);box-shadow:0 18px 50px rgba(0,0,0,.55);text-align:center}
.pp-opponent-reel-label{font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;color:#8ea0bd;font-weight:800;margin-bottom:12px}
.pp-opponent-reel-slot{height:72px;display:grid;place-items:center;overflow:hidden;border-radius:10px;border:1px solid #2b3a52;background:#070b12}
.pp-opponent-reel-slot span{font-size:1.7rem;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#f4d27a;text-shadow:0 0 18px rgba(244,210,122,.35)}
.pp-opponent-reel-slot.is-lock span{color:#fff;transform:scale(1.08)}
`;
          document.head.appendChild(style);
        }
        host.appendChild(overlay);
      }
      const slot = overlay.querySelector(".pp-opponent-reel-slot");
      const label = slot.querySelector("span");
      overlay.hidden = false;
      slot.classList.remove("is-lock");
      const names = (pool.length ? pool : [finalId]).map((id) => getCharacter(id).name);
      const finalName = getCharacter(finalId).name;
      let i = 0;
      let delay = 40;
      const started = performance.now();
      const spinMs = 3200;
      function tick() {
        const elapsed = performance.now() - started;
        if (elapsed >= spinMs) {
          label.textContent = finalName;
          slot.classList.add("is-lock");
          window.setTimeout(() => {
            overlay.hidden = true;
            resolve();
          }, 650);
          return;
        }
        label.textContent = names[i % names.length];
        i += 1;
        delay = Math.min(160, 40 + elapsed / 28);
        window.setTimeout(tick, delay);
      }
      tick();
    });
  }

  async function beginMatchWithOpponentReel() {
    if (opponentReelRunning) return;
    opponentReelRunning = true;
    try {
      if (selectMode === "create") updateCustomFromBuilder(true);
      const playerId = selectedCharacterId;
      const pool = rivalIds.filter((id) => id !== playerId);
      const finalId = chooseRivalId(playerId);
      enemyCharacterId = finalId;
      builderPreviewRivalId = finalId;
      player = createFighter(true, selectedCharacterId);
      enemy = createFighter(false, enemyCharacterId);
      clearSelectMatchup();
      if (selectScreen) selectScreen.style.visibility = "hidden";
      flashToast("Rolling opponent…", 1200);
      await playOpponentSlotReel(pool, finalId);
      if (selectScreen) selectScreen.style.visibility = "";
      resetRound({ preserveEnemy: true });
    } catch (err) {
      console.error("Midnight Fist opponent reel failed", err);
      if (selectScreen) selectScreen.style.visibility = "";
      resetRound({ preserveEnemy: true });
    } finally {
      opponentReelRunning = false;
    }
  }


  function createFighter(isPlayer, characterId = isPlayer ? selectedCharacterId : enemyCharacterId) {
    const character = applyCostumeToCharacter(getCharacter(characterId));
    const heavy = character.body === "heavy";
    const swift = character.body === "swift";
    const skeletal = character.body === "skeletal";
    return {
      name: character.name,
      character,
      isPlayer,
      palette: character.palette,
      x: isPlayer ? 255 : 705,
      y: FLOOR,
      vx: 0,
      vy: 0,
      w: heavy ? 66 : swift || skeletal ? 46 : 54,
      h: skeletal ? 104 : 112,
      facing: isPlayer ? 1 : -1,
      health: 100,
      meter: isPlayer ? 24 : 20,
      grounded: true,
      crouch: false,
      block: false,
      stun: 0,
      invuln: 0,
      cooldown: 0,
      action: null,
      combo: 0,
      comboTimer: 0,
      aiTimer: 0,
      aiBlockTimer: 0,
      aiMood: "press",
      afterTimer: 0,
      finishAnchorX: null,
      state: "idle",
    };
  }

  function getArena() {
    return arenaCatalog.find((arena) => arena.id === selectedArenaId) || arenaCatalog[0];
  }

  function syncFightControlsVisibility(fighting) {
    // Nuclear gate: attribute + inline styles so FOUC / cascade cannot resurrect the old pad.
    if (gameControls) {
      gameControls.hidden = !fighting;
      gameControls.classList.toggle("is-fight-controls", fighting);
      gameControls.setAttribute("aria-hidden", fighting ? "false" : "true");
      if (fighting) {
        gameControls.style.removeProperty("display");
        gameControls.style.removeProperty("visibility");
        gameControls.style.removeProperty("opacity");
        gameControls.style.removeProperty("pointer-events");
        if ("inert" in gameControls) gameControls.inert = false;
      } else {
        gameControls.style.setProperty("display", "none", "important");
        gameControls.style.setProperty("visibility", "hidden", "important");
        gameControls.style.setProperty("opacity", "0", "important");
        gameControls.style.setProperty("pointer-events", "none", "important");
        if ("inert" in gameControls) gameControls.inert = true;
      }
    }
    // Old square arrow chrome is superseded by the virtual joystick — keep dead always.
    document.querySelectorAll(".move-stick .move-btn").forEach((btn) => {
      btn.style.setProperty("opacity", "0", "important");
      btn.style.setProperty("pointer-events", "none", "important");
      btn.tabIndex = -1;
      btn.setAttribute("aria-hidden", "true");
    });
  }

  function setScreen(screen) {
    if (gameWindow) gameWindow.dataset.mode = screen;
    if (splashScreen) splashScreen.hidden = screen !== "splash";
    if (selectScreen) selectScreen.hidden = screen !== "select";
    if (sessionNotice) sessionNotice.hidden = true;
    if (gameHud) gameHud.hidden = screen !== "fight";
    // Touch joystick + attack pad: only while fighting (not select/roster/arena/splash/warning).
    const fighting = screen === "fight";
    syncFightControlsVisibility(fighting);
    const stage = document.getElementById("pp-lab-stage");
    const labRoot = document.querySelector(".pp-midnight-fist-lab");
    if (stage) stage.classList.toggle("is-fighting", fighting);
    if (gameWindow) gameWindow.classList.toggle("is-fighting", fighting);
    if (labRoot) labRoot.classList.toggle("is-fighting", fighting);
    if (!fighting) {
      virtual.left = false;
      virtual.right = false;
      virtual.down = false;
      virtual.block = false;
      const stick = document.querySelector(".move-stick");
      if (stick) stick.classList.remove("is-active");
      const knob = stick && stick.querySelector(".move-knob");
      if (knob) knob.style.transform = "translate(-50%, -50%)";
    }
    if (screen === "select" || screen === "splash") hideMessage();
  }

  function syncSelectModeFromDom() {
    if (!selectScreen) return;
    const mode = selectScreen.dataset.selectMode;
    if (mode === "create" || mode === "roster") selectMode = mode;
  }

  function syncSelectStepFromDom() {
    if (!selectScreen) return;
    const step = selectScreen.dataset.selectStep;
    if (step === "arena" || step === "fighter") selectStep = step;
  }

  function ensureSelectPhase() {
    if (!selectScreen || selectScreen.hidden) return false;
    syncSelectModeFromDom();
    syncSelectStepFromDom();
    if (game.phase === "select") return true;

    game.phase = "select";
    game.overTimer = 0;
    if (selectStep !== "arena") selectStep = "fighter";
    if (selectMode === "create") {
      customDraft = readBuilderDraft();
      customCharacter = createCustomCharacter(customDraft);
      characterById.set("custom", customCharacter);
      selectedCharacterId = "custom";
      updateCustomFromBuilder(true);
    } else {
      if (selectedCharacterId === "custom") selectedCharacterId = "pp-mara";
      enemyCharacterId = chooseRivalId(selectedCharacterId);
      player = createFighter(true, selectedCharacterId);
      enemy = createFighter(false, enemyCharacterId);
    }
    setScreen("select");
    applySelectLayout();
    renderRoster();
    updateHud();
    return true;
  }

  function applySelectLayout() {
    if (!selectScreen) return;
    selectScreen.dataset.selectMode = selectMode;
    selectScreen.dataset.selectStep = selectStep;
    if (selectScreenTitle) {
      if (selectStep === "arena") {
        selectScreenTitle.textContent = "Choose Arena";
      } else {
        selectScreenTitle.textContent = selectMode === "create" ? "Create Fighter" : "Select Fighter";
      }
    }
    clearSelectMatchup();
    if (fighterStepLayout) fighterStepLayout.hidden = selectStep !== "fighter";
    if (arenaStepLayout) arenaStepLayout.hidden = selectStep !== "arena";
    if (continueButton) {
      continueButton.hidden = selectStep !== "fighter";
      if (selectStep === "fighter") {
        continueButton.textContent = selectMode === "create" ? "Use Fighter · Choose Arena" : "Choose Arena";
      }
    }
    if (startButton) startButton.hidden = selectStep !== "arena";
    schedulePreviewRedraw();
  }

  function goToArenaStep() {
    if (!ensureSelectPhase()) return;
    if (selectStep === "arena") {
      applySelectLayout();
      renderArenaPicker();
      return;
    }
    if (selectStep !== "fighter") return;
    if (selectMode === "create") {
      updateCustomFromBuilder(true);
      customDraft = normalizeCustomDraft({ ...customDraft, riftalityLocked: true });
      saveCustomDraftToDevice(customDraft);
      customCharacter = createCustomCharacter(customDraft);
      characterById.set("custom", customCharacter);
      writeDraftToBuilder(customDraft);
      writeLocalPreference(lastFighterStorageKey, "custom");
    }
    selectStep = "arena";
    applySelectLayout();
    renderArenaPicker();
    flashToast("Choose your arena", 1100);
  }

  function backFromSelect() {
    if (game.phase !== "select") {
      enterSplash();
      return;
    }
    if (selectStep === "arena") {
      selectStep = "fighter";
      applySelectLayout();
      return;
    }
    enterSplash();
  }

  function enterSplash() {
    game.phase = "splash";
    selectMode = "roster";
    selectStep = "fighter";
    setEditorFighterFocus(false);
    hideMatchActions();
    setScreen("splash");
    hideMessage();
    setAudioMode("menu");
  }

  function setAssetLoadingVisible(visible) {
    if (assetLoadingScreen) assetLoadingScreen.hidden = !visible;
    if (gameWindow) {
      if (visible) gameWindow.dataset.loading = "assets";
      else delete gameWindow.dataset.loading;
    }
    setAssetLoadingProgress(visible ? 0 : 100);
  }

  function setAssetLoadingProgress(percent) {
    if (!assetLoadingScreen) return;
    const bar = assetLoadingScreen.querySelector(".asset-loading-bar span");
    if (bar) bar.style.setProperty("--load-progress", `${clamp(percent, 0, 100)}%`);
  }

  function waitForAssetImage(asset, onDone = null) {
    const image = asset?.image;
    if (!image || asset.ready || asset.failed || image.complete) {
      if (onDone) onDone();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const done = () => {
        if (onDone) onDone();
        resolve();
      };
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });
    });
  }

  async function preloadSelectEntryAssets(mode) {
    const minimumMs = 420;
    const maximumMs = 1050;
    const started = performance.now();
    if (mode === "create") {
      customDraft = normalizeCustomDraft(storageApi()?.getDefaultFighter?.() || loadDeviceCustomDraft() || customDefaultDraft);
      customCharacter = createCustomCharacter(customDraft);
      characterById.set("custom", customCharacter);
      selectedCharacterId = "custom";
    } else if (selectedCharacterId === "custom") {
      selectedCharacterId = "pp-mara";
    }
    enemyCharacterId = chooseRivalId(selectedCharacterId);
    warmCurrentMatchAssets();
    const assets = [
      generatedAssets.fighters.get(selectedCharacterId),
      generatedAssets.moveSheets.get(selectedCharacterId),
      generatedAssets.fighters.get(enemyCharacterId),
      generatedAssets.moveSheets.get(enemyCharacterId),
      getArenaAsset(getArena(), true),
    ].filter(Boolean);
    let settled = 0;
    const total = Math.max(assets.length, 1);
    const markSettled = () => {
      settled += 1;
      setAssetLoadingProgress(12 + (settled / total) * 82);
    };
    await Promise.race([
      Promise.allSettled(assets.map((asset) => waitForAssetImage(asset, markSettled))),
      new Promise((resolve) => setTimeout(resolve, maximumMs)),
    ]);
    setAssetLoadingProgress(100);
    const elapsed = performance.now() - started;
    if (elapsed < minimumMs) await new Promise((resolve) => setTimeout(resolve, minimumMs - elapsed));
  }

  async function enterSelectWithLoading(mode) {
    setAssetLoadingVisible(true);
    try {
      await preloadSelectEntryAssets(mode);
      if (mode === "create") enterSelectCreate();
      else enterSelectRoster();
    } finally {
      setAssetLoadingVisible(false);
    }
  }

  function enterSelectRoster() {
    selectMode = "roster";
    if (selectedCharacterId === "custom") selectedCharacterId = "pp-mara";
    if (selectScreen) selectScreen.dataset.selectMode = "roster";
    enterSelect();
  }

  function enterSelectCreate() {
    selectMode = "create";
    if (selectScreen) selectScreen.dataset.selectMode = "create";
    customDraft = normalizeCustomDraft(storageApi()?.getDefaultFighter?.() || loadDeviceCustomDraft() || customDefaultDraft);
    customCharacter = createCustomCharacter(customDraft);
    characterById.set("custom", customCharacter);
    writeDraftToBuilder(customDraft);
    selectedCharacterId = "custom";
    enterSelect();
  }

  function enterSelect() {
    game.phase = "select";
    game.overTimer = 0;
    hideMatchActions();
    selectStep = "fighter";
    if (!isEditorFighterFocus()) setEditorFighterFocus(false);
    syncSelectModeFromDom();
    enemyCharacterId = chooseRivalId(selectedCharacterId);
    player = createFighter(true, selectedCharacterId);
    enemy = createFighter(false, enemyCharacterId);
    setScreen("select");
    hideMessage();
    applySelectLayout();
    if (selectMode === "create") {
      updateCustomFromBuilder(true);
      renderBuilderPreview();
    } else {
      syncBuilderFromCharacter(selectedCharacterId);
      renderRosterPreview();
    }
    renderRoster();
    updateHud();
    schedulePreviewRedraw();
    setAudioMode("menu");
  }

  function enterFight() {
    setScreen("fight");
  }

  function returnToSplash() {
    limbs = [];
    goreChunks = [];
    if (enemy) enemy.detachedParts = null;
    game.finisher = null;
    enterSplash();
  }

  function resetRound(options = {}) {
    if (!options.preserveEnemy) enemyCharacterId = chooseRivalId(selectedCharacterId);
    player = createFighter(true, selectedCharacterId);
    enemy = createFighter(false, enemyCharacterId);
    warmCurrentMatchAssets();
    getArenaAsset(getArena(), true);
    projectiles = [];
    particles = [];
    blood = [];
    stains = [];
    afterImages = [];
    limbs = [];
    goreChunks = [];
    comboFloats = [];
    impactVfx = [];
    game.bgFx = [];
    game.phase = "countdown";
    game.roundTime = 99;
    game.timerAcc = 0;
    game.countdown = 3.4;
    game.finishTimer = 0;
    game.finisherTime = 0;
    game.finisher = null;
    game.overTimer = 0;
    game.arenaTheme = arenaCatalog.findIndex((arena) => arena.id === selectedArenaId);
    game.arenaPulse = 0;
    game.shake = 0;
    game.flash = 0;
    game.hitStop = 0;
    game.progressionAwarded = false;
    game.matchStats = {
      player: { attacks: 0, hits: 0, damage: 0, blockedHits: 0, maxCombo: 0, powers: 0 },
      enemy: { attacks: 0, hits: 0, damage: 0, blockedHits: 0, maxCombo: 0, powers: 0 },
      finisher: "None",
    };
    attackBuffer = null;
    attackBufferTime = 0;
    hideMatchActions();
    setAudioMode("fight");
    enterFight();
    showMessage("3", "Get ready");
    if (selectedArenaId === "raven-hollow-relay") flashToast("Flash warning: strobe/glitch effects", 3000);
    renderRoster();
  }


  const LAB_AFFILIATE_ADS = [
    {
      id: "scrambly",
      name: "Scrambly",
      url: "https://go.scrambly.io/lOxbCW",
      accent: "#ff3355",
      blurb: "Boosted invite window — referrals earn more when friends withdraw $1. Promo I26KTJ8J74BR.",
      cta: "Open Scrambly",
    },
    {
      id: "sofi",
      name: "SoFi Invest",
      url: "https://www.sofi.com/invite/invest?gcp=f3d4da09-d5e7-4399-b239-a0ccd75f30b7&isAliasGcp=false&siid=095c3965-f4aa-46c7-9112-25ef05c83bb0",
      accent: "#00c8a7",
      blurb: "Open Active Investing with $25+ and get $25 in stock.",
      cta: "Claim $25 stock",
    },
    {
      id: "axiom",
      name: "Axiom Trade",
      url: "https://axiom.trade/@itzninja",
      accent: "#7ec8ff",
      blurb: "One of the best trading platforms — referred traders get 10% off fees (Axiom docs).",
      cta: "Trade on Axiom",
    },
    {
      id: "uphold",
      name: "Uphold",
      url: "https://wallet.uphold.com/signup?referral=4af5b089e9&campaign=uw_p_d_w_acq_raf&utm_source=raf&utm_medium=referafriend",
      accent: "#4adf62",
      blurb: "Easy, low-cost trading — open an account with Plot-Pulse's referral.",
      cta: "Create Uphold account",
    },
    {
      id: "amazon-prime",
      name: "Amazon Prime",
      url: "https://amzn.to/4A3VRjR",
      accent: "#ff9900",
      blurb: "Amazon Prime — fast shipping and more. Affiliate link supports Plot-Pulse.",
      cta: "Get Prime",
    },
    {
      id: "audible",
      name: "Audible",
      url: "https://amzn.to/4iStHSz",
      accent: "#ff9900",
      blurb: "Audible Books & Originals — listen in the dark. Affiliate link supports the archive.",
      cta: "Browse Audible",
    },
    {
      id: "amazon",
      name: "Amazon picks",
      url: "https://www.amazon.com/s?k=plot-pulse+dead+internet&tag=plotpulse-20",
      accent: "#ff9900",
      blurb: "Gear that fits the Pulse — shop with tag plotpulse-20 and support the archive.",
      cta: "Shop Amazon",
    },
    {
      id: "splinterlands",
      name: "Splinterlands",
      url: "https://splinterlands.com/register?ref=itzninjafool",
      accent: "#e0b15a",
      blurb: "Free-to-play card battles. 500 Credits when you buy a Spellbook via this link.",
      cta: "Play Splinterlands",
    },
    {
      id: "tiltrips",
      name: "Tilt Rips",
      url: "https://tiltrips.com/r/MFL-PLOTPULSE/",
      accent: "#ff5a7a",
      blurb: "Rip real cards. Feel the chase — Midnight Fist Lab affiliate lane.",
      cta: "Open Tilt Rips",
    },
  ];

  function pickRandomAffiliateAd() {
    const list = LAB_AFFILIATE_ADS;
    return list[Math.floor(Math.random() * list.length)] || list[0];
  }

  function getLabAdConfig() {
    const cfg = window.MIDNIGHT_FIST_ADS || window.MIDNIGHT_FIST_PROJECT?.ads || {};
    return {
      enabled: cfg.enabled !== false,
      rewardedUnitPath: cfg.rewardedUnitPath || cfg.rewarded || "",
      fallbackSeconds: clamp(Number(cfg.fallbackSeconds) || 5, 3, 15),
    };
  }

  function ensureLabAdOverlay() {
    let overlay = query("#lab-ad-overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "lab-ad-overlay";
    overlay.className = "lab-ad-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="lab-ad-card" role="dialog" aria-modal="true" aria-labelledby="lab-ad-title">
        <div id="lab-ad-badge" class="lab-ad-badge">SPONSORED</div>
        <strong id="lab-ad-title">Watch ad to continue</strong>
        <p id="lab-ad-copy">A short video unlocks your next fight.</p>
        <div id="lab-ad-progress" hidden></div>
        <a id="lab-ad-offer" class="lab-ad-offer" href="#" target="_blank" rel="noopener noreferrer sponsored" hidden>Open offer</a>
        <button type="button" id="lab-ad-watch">Watch Video Ad</button>
        <button type="button" id="lab-ad-continue" hidden>Continue to next fight</button>
        <button type="button" id="lab-ad-cancel">Return to Menu</button>
      </div>
    `;
    if (!document.getElementById("lab-ad-affiliate-style")) {
      const style = document.createElement("style");
      style.id = "lab-ad-affiliate-style";
      style.textContent = `
        .lab-ad-overlay{position:absolute;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(4,6,10,.86);backdrop-filter:blur(6px)}
        .lab-ad-overlay[hidden]{display:none!important}
        .lab-ad-card{width:min(420px,92%);padding:1rem 1.1rem;border-radius:.65rem;background:#0c1016;border:1px solid rgba(243,234,216,.2);color:#f3ead8;display:flex;flex-direction:column;gap:.55rem;box-shadow:0 12px 40px rgba(0,0,0,.55)}
        .lab-ad-badge{align-self:flex-start;font-size:.58rem;font-weight:700;letter-spacing:.08em;padding:2px 7px;border-radius:3px;background:#243041;color:#9eb6d4}
        .lab-ad-card strong{font-size:1.05rem;line-height:1.2}
        .lab-ad-card p{margin:0;font-size:.78rem;line-height:1.35;color:#b9aa98}
        .lab-ad-offer{display:block;text-align:center;text-decoration:none;font-weight:700;font-size:.78rem;padding:.55rem .7rem;border-radius:.4rem;color:#000}
        #lab-ad-watch,#lab-ad-continue,#lab-ad-cancel{appearance:none;border:0;border-radius:.4rem;padding:.55rem .7rem;font-weight:700;font-size:.78rem;cursor:pointer}
        #lab-ad-watch,#lab-ad-continue{background:#4cc9ff;color:#041018}
        #lab-ad-cancel{background:#1a222e;color:#d4c4b0}
        #lab-ad-progress{font-size:.72rem;color:#9eb6d4}
      `;
      document.head.appendChild(style);
    }
    (gameWindow || document.body).appendChild(overlay);
    return overlay;
  }

  function loadGptScript() {
    if (window.googletag?.apiReady) return Promise.resolve(window.googletag);
    if (window.__mfGptPromise) return window.__mfGptPromise;
    window.__mfGptPromise = new Promise((resolve) => {
      window.googletag = window.googletag || { cmd: [] };
      const existing = document.querySelector('script[src*="securepubads.g.doubleclick.net/tag/js/gpt.js"]');
      if (!existing) {
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
        document.head.appendChild(script);
      }
      window.googletag.cmd.push(() => resolve(window.googletag));
      setTimeout(() => resolve(window.googletag), 4000);
    });
    return window.__mfGptPromise;
  }

  function playFallbackSponsorGate() {
    const cfg = getLabAdConfig();
    const ad = pickRandomAffiliateAd();
    const overlay = ensureLabAdOverlay();
    const title = overlay.querySelector("#lab-ad-title");
    const copy = overlay.querySelector("#lab-ad-copy");
    const progress = overlay.querySelector("#lab-ad-progress");
    const badge = overlay.querySelector("#lab-ad-badge");
    const offer = overlay.querySelector("#lab-ad-offer");
    const watch = overlay.querySelector("#lab-ad-watch");
    const cont = overlay.querySelector("#lab-ad-continue");
    const cancel = overlay.querySelector("#lab-ad-cancel");
    const card = overlay.querySelector(".lab-ad-card");
    return new Promise((resolve) => {
      let remaining = Math.max(2, Math.min(6, cfg.fallbackSeconds || 4));
      let timer = 0;
      const finish = (ok) => {
        clearInterval(timer);
        overlay.hidden = true;
        resolve(ok);
      };
      overlay.hidden = false;
      if (card) card.style.borderColor = ad.accent || "rgba(243,234,216,.2)";
      if (badge) {
        badge.textContent = "AFFILIATE";
        badge.style.background = ad.accent || "#243041";
        badge.style.color = "#000";
      }
      if (title) title.textContent = ad.name;
      if (copy) copy.textContent = ad.blurb;
      if (offer) {
        offer.hidden = false;
        offer.href = ad.url;
        offer.textContent = ad.cta || "Open offer";
        offer.style.background = ad.accent || "#4cc9ff";
      }
      if (watch) watch.hidden = true;
      if (cont) {
        cont.hidden = false;
        cont.disabled = true;
        cont.textContent = `Continue in ${remaining}s…`;
        cont.onclick = () => finish(true);
      }
      if (progress) {
        progress.hidden = false;
        progress.textContent = "Random Plot-Pulse partner offer — thanks for supporting the Lab.";
      }
      if (cancel) cancel.onclick = () => finish(false);
      timer = setInterval(() => {
        remaining -= 1;
        if (cont) {
          if (remaining > 0) {
            cont.disabled = true;
            cont.textContent = `Continue in ${remaining}s…`;
          } else {
            cont.disabled = false;
            cont.textContent = "Continue to next fight";
          }
        }
        if (remaining <= 0) clearInterval(timer);
      }, 1000);
    });
  }

  async function playRewardedContinueAd() {
    const cfg = getLabAdConfig();
    if (!cfg.enabled) return true;
    const overlay = ensureLabAdOverlay();
    const copy = overlay.querySelector("#lab-ad-copy");
    const progress = overlay.querySelector("#lab-ad-progress");
    const watch = overlay.querySelector("#lab-ad-watch");
    const cancel = overlay.querySelector("#lab-ad-cancel");
    if (!cfg.rewardedUnitPath) {
      // Prefer rotating Plot-Pulse affiliate creatives when no rewarded video unit is wired.
      return playFallbackSponsorGate();
    }

    return new Promise(async (resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        overlay.hidden = true;
        resolve(ok);
      };
      overlay.hidden = false;
      if (progress) progress.hidden = true;
      if (copy) copy.textContent = "Watch the video ad to unlock your next match.";
      if (watch) {
        watch.disabled = false;
        watch.textContent = "Watch Video Ad";
      }
      if (cancel) cancel.onclick = () => finish(false);

      try {
        const googletag = await loadGptScript();
        if (!googletag?.defineOutOfPageSlot) {
          finish(await playFallbackSponsorGate());
          return;
        }
        googletag.cmd.push(() => {
          const slot = googletag.defineOutOfPageSlot(
            cfg.rewardedUnitPath,
            googletag.enums.OutOfPageFormat.REWARDED,
          );
          if (!slot) {
            playFallbackSponsorGate().then(finish);
            return;
          }
          slot.addService(googletag.pubads());
          googletag.pubads().addEventListener("rewardedSlotReady", (evt) => {
            if (watch) {
              watch.disabled = false;
              watch.textContent = "Watch Video Ad";
              watch.onclick = () => {
                watch.disabled = true;
                watch.textContent = "Playing…";
                evt.makeRewardedVisible();
              };
            }
          });
          googletag.pubads().addEventListener("rewardedSlotGranted", () => finish(true));
          googletag.pubads().addEventListener("rewardedSlotClosed", () => {
            if (!settled) playFallbackSponsorGate().then(finish);
          });
          googletag.enableServices();
          googletag.display(slot);
        });
      } catch {
        finish(await playFallbackSponsorGate());
      }
    });
  }

  async function continueToNextMatch() {
    if (game.phase !== "over") return;
    if (matchContinueButton) matchContinueButton.disabled = true;
    const unlocked = await playRewardedContinueAd();
    if (matchContinueButton) matchContinueButton.disabled = false;
    if (!unlocked) {
      returnToSplash();
      return;
    }
    enemyCharacterId = nextRivalId(enemyCharacterId, selectedCharacterId);
    builderPreviewRivalId = enemyCharacterId;
    resetRound({ preserveEnemy: true });
  }

  function retryCurrentMatch() {
    if (game.phase !== "over") return;
    resetRound({ preserveEnemy: true });
  }

  function showMatchActions(outcome = "win") {
    if (!matchActions) return;
    matchActions.hidden = false;
    matchActions.dataset.outcome = outcome === "loss" ? "loss" : "win";
    if (matchContinueButton) {
      matchContinueButton.hidden = outcome === "loss";
      matchContinueButton.textContent = outcome === "win" ? "Continue · Partner Ad" : "Continue";
    }
    if (matchRetryButton) matchRetryButton.hidden = outcome === "win";
    if (matchMenuButton) matchMenuButton.hidden = false;
  }

  function hideMatchActions() {
    if (!matchActions) return;
    matchActions.hidden = true;
    delete matchActions.dataset.outcome;
  }

  function paintProceduralRosterPortrait(character) {
    try {
      const canvas = document.createElement("canvas");
      const width = 96;
      const height = 128;
      canvas.width = width;
      canvas.height = height;
      const c = canvas.getContext("2d");
      if (!c || typeof drawPreviewBody !== "function") return "";
      c.fillStyle = "#08101a";
      c.fillRect(0, 0, width, height);
      c.fillStyle = "rgba(141, 230, 255, 0.08)";
      for (let x = 0; x < width; x += 12) c.fillRect(x, 0, 1, height);
      c.fillStyle = "rgba(0, 0, 0, 0.45)";
      c.beginPath();
      c.ellipse(width / 2, height - 8, width * 0.28, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.save();
      c.translate(width / 2, height - 10);
      c.scale(0.62, 0.62);
      drawPreviewBody(c, character, character.palette || {}, null);
      c.restore();
      return canvas.toDataURL("image/png");
    } catch (_) {
      return "";
    }
  }

  function attachRosterPortrait(swatch, character) {
    if (!swatch || !character || character.id === "custom") return;
    ensureFighterVisualAssets(character.id);
    let img = swatch.querySelector("img");
    if (!img) {
      img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.loading = "eager";
      img.referrerPolicy = "no-referrer";
      swatch.appendChild(img);
    }
    const mark = (src) => {
      if (!src) return false;
      swatch.classList.add("has-portrait");
      img.src = src;
      return true;
    };
    const tryAsset = (asset) => {
      if (!asset) return false;
      const image = asset.keyedImage || asset.image;
      const src = asset.loadedSrc || asset.src;
      const usable = src && /^https?:\/\//i.test(src) && (asset.ready || (image && image.complete && image.naturalWidth > 0));
      if (usable) return mark(src);
      if (image && !image.dataset.rosterBound) {
        image.dataset.rosterBound = "1";
        image.addEventListener("load", () => {
          const next = asset.loadedSrc || asset.src || image.src;
          if (next && /^https?:\/\//i.test(next) && image.naturalWidth > 0) mark(next);
        }, { once: true });
      }
      return false;
    };
    const direct = fighterPortraitSource(character.id);
    if (direct) {
      mark(direct);
      return;
    }
    if (tryAsset(fighterGraphicAsset(character.id))) return;
    if (tryAsset(generatedAssets.fighters.get(character.id))) return;
    if (tryAsset(generatedAssets.moveSheets.get(character.id))) return;
    // Direct path probe from the hosted asset list (mobile-friendly, no canvas).
    const paths = fighterAssetPaths(character);
    let pathIndex = 0;
    const probe = () => {
      if (pathIndex >= paths.length || swatch.classList.contains("has-portrait")) {
        if (!swatch.classList.contains("has-portrait")) {
          const baked = paintProceduralRosterPortrait(character);
          if (baked) mark(baked);
        }
        return;
      }
      const src = paths[pathIndex++];
      if (!src || src.startsWith("assets/")) {
        probe();
        return;
      }
      const probeImg = new Image();
      probeImg.decoding = "async";
      probeImg.onload = () => mark(src);
      probeImg.onerror = probe;
      probeImg.src = src;
    };
    probe();
  }

  function renderRoster() {
    if (!ui.rosterGrid) return;
    ui.rosterGrid.innerHTML = "";
    for (const character of playableRoster()) {
      const display = applyCostumeToCharacter(character);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `fighter-card${character.id === selectedCharacterId ? " is-selected" : ""}`;
      button.dataset.character = character.id;
      button.style.setProperty("--skin", display.palette.skin);
      button.style.setProperty("--hair", display.palette.hair);
      button.style.setProperty("--outfit", display.palette.trunks);
      button.style.setProperty("--accent", display.palette.accent);
      if (character.id === "wendigo") {
        button.classList.add("is-wendigo");
        button.style.setProperty("--skin", display.palette.white);
        button.style.setProperty("--hair", display.palette.hair);
        button.style.setProperty("--outfit", display.palette.trunksDark || display.palette.trunks);
        button.style.setProperty("--accent", display.palette.meter || display.palette.accent);
      }
      const swatch = document.createElement("span");
      swatch.className = "fighter-swatch";
      swatch.setAttribute("aria-hidden", "true");
      attachRosterPortrait(swatch, display);
      const label = document.createElement("span");
      const name = document.createElement("strong");
      const style = document.createElement("span");
      name.textContent = character.name;
      const selectedCostume = getFighterCostumes(character.id).find((item) => item.id === getSelectedCostumeId(character.id));
      const wins = Number(fighterWins[character.id]) || 0;
      style.textContent = selectedCostume && selectedCostume.id !== "default"
        ? `${character.style} · ${selectedCostume.label}`
        : character.style;
      label.append(name, style);
      button.append(swatch, label);
      const costumes = getFighterCostumes(character.id);
      if (costumes.length > 1) {
        const costumeRow = document.createElement("div");
        costumeRow.className = "fighter-costume-row";
        costumeRow.setAttribute("role", "group");
        costumeRow.setAttribute("aria-label", `${character.name} costumes`);
        for (const costume of costumes) {
          const unlocked = isCostumeUnlocked(character.id, costume);
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = `fighter-costume-chip${getSelectedCostumeId(character.id) === costume.id ? " is-selected" : ""}${unlocked ? "" : " is-locked"}`;
          chip.dataset.costumeId = costume.id;
          chip.disabled = !unlocked;
          chip.textContent = unlocked ? costume.label : `Locked`;
          chip.title = unlocked
            ? `${costume.label}`
            : (() => { const __wc = costume.unlock?.count || 1; return `Win ${__wc} fight${__wc === 1 ? "" : "s"} as ${character.name} (${wins}/${__wc})`; })();
          chip.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!unlocked) {
              flashToast(`Win as ${character.name} to unlock ${costume.label}`, 1400);
              return;
            }
            fighterCostumes[character.id] = costume.id;
            saveFighterCostumes(fighterCostumes);
            selectCharacter(character.id);
            renderRoster();
            flashToast(`${character.name} · ${costume.label}`, 900);
          });
          costumeRow.appendChild(chip);
        }
        const winNote = document.createElement("em");
        winNote.className = "fighter-win-count";
        winNote.textContent = wins ? `${wins} win${wins === 1 ? "" : "s"}` : "Win to unlock alts";
        costumeRow.appendChild(winNote);
        button.append(costumeRow);
      }
      ui.rosterGrid.appendChild(button);
    }
    clearSelectMatchup();
  }

  function updateRosterSelection() {
    if (!ui.rosterGrid) return;
    for (const card of ui.rosterGrid.querySelectorAll(".fighter-card[data-character]")) {
      card.classList.toggle("is-selected", card.dataset.character === selectedCharacterId);
    }
    clearSelectMatchup();
  }

  function onBuilderControlChange(event) {
    syncSelectModeFromDom();
    if (selectScreen && !selectScreen.hidden) selectMode = "create";
    if (game.phase !== "select") ensureSelectPhase();
    const colorOnly = event?.target instanceof HTMLInputElement && event.target.type === "color";
    // Invalidate preview cache so color/item edits redraw with the new draft.
    cachedBuilderPreviewKey = "";
    scheduleBuilderUpdate({ full: !colorOnly && game.phase === "select", colorOnly });
  }

  function handleBuilderInput(event) {
    if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)) return;
    if (!event.target.closest("#fighter-builder")) return;
    onBuilderControlChange(event);
  }

  function setupSelectDelegation() {
    root.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("a[href]")) return;
      if (target.closest("button, .fighter-card, .arena-card, .account-chip, .session-notice-login")) {
        uiClick();
      }

      const fighterCard = target.closest(".fighter-card[data-character]");
      if (fighterCard && root.contains(fighterCard)) {
        event.preventDefault();
        selectCharacter(fighterCard.dataset.character);
        return;
      }

      const arenaCard = target.closest(".arena-card[data-arena]");
      if (arenaCard && root.contains(arenaCard)) {
        event.preventDefault();
        selectArena(arenaCard.dataset.arena);
      }
    });
  }

  function setupBuilder() {
    const panel = ui.builderPanel || query("#fighter-builder");
    if (!panel) return;
    ensureAaaCharacterUi(panel);
    populateRiftalitySelect(customDraft.riftalityId || "personal");
    writeDraftToBuilder(customDraft);

    panel.addEventListener("input", handleBuilderInput);
    panel.addEventListener("change", handleBuilderInput);
    if (selectScreen) {
      selectScreen.addEventListener("input", handleBuilderInput);
      selectScreen.addEventListener("change", handleBuilderInput);
    }

    const randomBtn = ui.builderRandom || query("#builder-random");
    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        const draft = randomCustomDraft();
        writeDraftToBuilder(draft);
        updateCustomFromBuilder(true);
      });
    }

    const resetBtn = ui.builderReset || query("#builder-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        customDraft = normalizeCustomDraft({
          ...customDefaultDraft,
          progression: customDraft?.progression,
          economy: customDraft?.economy,
        });
        saveCustomDraftToDevice(customDraft);
        writeDraftToBuilder(customDraft);
        updateCustomFromBuilder(true);
        flashToast("Nova restored", 900);
      });
    }

  }

  function choiceLabel(value) {
    const labels = {
      athlete: "Balanced",
      sidepony: "Side Pony",
      crop: "Crop Top",
      "wendigo-head": "Wendigo Antlers",
      vest: "Vest",
      polo: "Polo",
      strap: "Cross Strap",
      sleeveless: "Sleeveless",
      cloak: "Cloak",
      collar: "Collar",
      visor: "Visor",
      cap: "Cap",
      goggles: "Goggles",
      headset: "Headset",
      bandana: "Bandana",
      neutral: "Neutral",
      focused: "Focused",
      angry: "Angry",
      smirk: "Smirk",
      none: "None",
      tactical: "Tactical Mask",
      oni: "Oni Mask",
      skull: "Skull Mask",
      stubble: "Stubble",
      goatee: "Goatee",
      full: "Full Beard",
    };
    return labels[value] || value.replace(/(^|-)([a-z])/g, (_, lead, letter) => `${lead ? " " : ""}${letter.toUpperCase()}`);
  }

  function unlockedAppearanceValues(field) {
    const economy = normalizeFighterEconomy(customDraft?.economy, customDraft?.body || "athlete");
    return (builderPools[field] || []).filter((value) => isAppearanceUnlocked(economy, field, value));
  }

  function refreshAppearanceUnlockUi(panel = ui.builderPanel) {
    if (!panel) return;
    const economy = normalizeFighterEconomy(customDraft?.economy, customDraft?.body || "athlete");
    const shirtSelect = ui.builderShirt || panel.querySelector("#builder-shirt");
    const accessorySelect = ui.builderAccessory || panel.querySelector("#builder-accessory");
    const syncSelectOptions = (select, field) => {
      if (!select) return;
      const unlocked = new Set(unlockedAppearanceValues(field));
      const current = select.value;
      for (const option of Array.from(select.options)) {
        const keep = unlocked.has(option.value);
        option.hidden = !keep;
        option.disabled = !keep;
      }
      if (!unlocked.has(current)) {
        select.value = field === "shirt" ? "tee" : "none";
        if (!unlocked.has(select.value) && unlocked.size) select.value = [...unlocked][0];
      }
    };
    syncSelectOptions(shirtSelect, "shirt");
    syncSelectOptions(accessorySelect, "accessory");
    panel.querySelectorAll(".aaa-choice-group[data-choice-for='builder-shirt'] [data-choice-value]").forEach((button) => {
      const unlocked = isAppearanceUnlocked(economy, "shirt", button.dataset.choiceValue);
      button.hidden = !unlocked;
      button.disabled = !unlocked;
      button.classList.toggle("is-locked-cosmetic", !unlocked);
    });
    panel.querySelectorAll(".aaa-choice-group[data-choice-for='builder-accessory'] [data-choice-value]").forEach((button) => {
      const unlocked = isAppearanceUnlocked(economy, "accessory", button.dataset.choiceValue);
      button.hidden = !unlocked;
      button.disabled = !unlocked;
      button.classList.toggle("is-locked-cosmetic", !unlocked);
    });
    syncAaaChoiceStates(panel);
    renderAaaClothingChoicePreviews(panel);
  }

  function rebuildGearStoreGrid(panel = ui.builderPanel) {
    if (!panel) return;
    let gearGrid = panel.querySelector(".fighter-gear-grid");
    if (!gearGrid) {
      const gearPanel = panel.querySelector("[data-builder-panel='gear']") || panel;
      gearGrid = document.createElement("div");
      gearGrid.className = "fighter-gear-grid";
      gearGrid.setAttribute("aria-label", "Fighter gear store");
      gearPanel.appendChild(gearGrid);
    }
    const existing = new Set(
      [...gearGrid.querySelectorAll("[data-gear-item]")].map((card) => card.dataset.gearItem),
    );
    for (const item of fighterGearCatalog) {
      if (existing.has(item.id)) continue;
      const card = document.createElement("article");
      card.className = "fighter-gear-card";
      card.dataset.gearItem = item.id;
      card.innerHTML = `
        <div class="fighter-gear-swatch" style="--gear-color:${item.color || "#667788"}" aria-hidden="true"></div>
        <div class="fighter-gear-details"><small>${choiceLabel(item.slot)}${item.cosmetic ? " · Cosmetic" : ""}</small><strong>${item.name}</strong><span>${item.description}</span><em data-gear-compatibility></em></div>
        <div class="fighter-gear-actions">
          ${item.cosmetic ? `<button type="button" data-gear-preview="${item.id}">Preview</button>` : ""}
          <button type="button" data-gear-action="${item.id}">Equip</button>
        </div>
      `;
      gearGrid.appendChild(card);
    }
    if (!gearGrid.dataset.gearBound) {
      gearGrid.dataset.gearBound = "1";
      gearGrid.addEventListener("click", (event) => {
        const preview = event.target.closest("button[data-gear-preview]");
        if (preview) {
          purchaseOrEquipGear(preview.dataset.gearPreview, { previewOnly: true });
          return;
        }
        const button = event.target.closest("button[data-gear-action]");
        if (!button) return;
        purchaseOrEquipGear(button.dataset.gearAction);
      });
    }
    renderGearUi(panel);
  }

  function upgradeAaaCharacterUi(panel) {
    // Cached Lab shells may already include tabs from older markup — still inject new cosmetics.
    rebuildGearStoreGrid(panel);
    if (!ui.builderShirt) ui.builderShirt = panel.querySelector("#builder-shirt");
    if (!ui.builderPants) ui.builderPants = panel.querySelector("#builder-pants");
    if (!ui.builderAccessory) ui.builderAccessory = panel.querySelector("#builder-accessory");
    const economyForUi = normalizeFighterEconomy(customDraft?.economy, customDraft?.body || "athlete");
    if (ui.builderShirt) {
      const existing = new Set(Array.from(ui.builderShirt.options).map((option) => option.value));
      for (const value of builderPools.shirt) {
        if (existing.has(value)) continue;
        const option = document.createElement("option");
        option.value = value;
        option.textContent = choiceLabel(value);
        option.hidden = !isAppearanceUnlocked(economyForUi, "shirt", value);
        option.disabled = option.hidden;
        ui.builderShirt.appendChild(option);
      }
    }
    const shirtRow = panel.querySelector(".aaa-choice-group[data-choice-for='builder-shirt'] .aaa-choice-row");
    if (shirtRow) {
      const present = new Set([...shirtRow.querySelectorAll("[data-choice-value]")].map((b) => b.dataset.choiceValue));
      for (const value of builderPools.shirt) {
        if (present.has(value)) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.choiceValue = value;
        const locked = !isAppearanceUnlocked(economyForUi, "shirt", value);
        button.hidden = locked;
        button.disabled = locked;
        if (locked) button.classList.add("is-locked-cosmetic");
        button.innerHTML = `<canvas class="aaa-gear-choice-preview" data-clothing-preview="${value}" data-clothing-layer="shirt" width="168" height="96" aria-hidden="true"></canvas><span>${choiceLabel(value)}</span><b aria-hidden="true">✓</b>`;
        button.addEventListener("click", () => {
          if (!isAppearanceUnlocked(normalizeFighterEconomy(customDraft?.economy, customDraft?.body || "athlete"), "shirt", value)) {
            flashToast("Buy this in the Gear tab first", 1200);
            return;
          }
          if (ui.builderShirt) {
            ui.builderShirt.value = value;
            ui.builderShirt.dispatchEvent(new Event("change", { bubbles: true }));
          }
          syncAaaChoiceStates(panel);
        });
        shirtRow.appendChild(button);
      }
    }
    refreshAppearanceUnlockUi(panel);
  }

  function ensureAaaCharacterUi(panel) {
    if (!selectScreen) return;
    if (panel.querySelector(".aaa-builder-tabs")) {
      upgradeAaaCharacterUi(panel);
      return;
    }
    selectScreen.classList.add("aaa-character-ui");

    const tabs = document.createElement("nav");
    tabs.className = "aaa-builder-tabs";
    tabs.setAttribute("aria-label", "Fighter customization");
    tabs.innerHTML = `
      <button type="button" class="is-active" data-builder-section="appearance" aria-selected="true" role="tab">Appearance</button>
      <button type="button" data-builder-section="colors" aria-selected="false" role="tab">Colors</button>
      <button type="button" data-builder-section="training" aria-selected="false" role="tab">Training</button>
      <button type="button" data-builder-section="gear" aria-selected="false" role="tab">Gear</button>
      <button type="button" data-builder-section="riftality" aria-selected="false" role="tab">Riftality</button>
    `;
    tabs.setAttribute("role", "tablist");
    const economyBar = document.createElement("div");
    economyBar.className = "aaa-builder-economy";
    economyBar.setAttribute("aria-label", "Fighter wallet");
    economyBar.innerHTML = `
      <span>Fighter wallet</span>
      <strong><b data-rift-credits>600</b> Rift Credits</strong>
    `;
    panel.prepend(tabs);
    panel.prepend(economyBar);

    const fields = panel.querySelector(".builder-fields");
    if (fields) {
      fields.classList.add("aaa-legacy-fields");
      // Migrate legacy outfit select into shirt/pants data selects used by Appearance.
      if (!ui.builderShirt) {
        const shirtSelect = document.createElement("select");
        shirtSelect.id = "builder-shirt";
        shirtSelect.className = "aaa-data-select";
        shirtSelect.setAttribute("aria-label", "Shirt");
        shirtSelect.innerHTML = builderPools.shirt.map((value) => `<option value="${value}">${choiceLabel(value)}</option>`).join("");
        shirtSelect.value = customDraft?.shirt || "tee";
        fields.appendChild(shirtSelect);
        ui.builderShirt = shirtSelect;
      }
      if (!ui.builderPants) {
        const pantsSelect = document.createElement("select");
        pantsSelect.id = "builder-pants";
        pantsSelect.className = "aaa-data-select";
        pantsSelect.setAttribute("aria-label", "Pants");
        pantsSelect.innerHTML = builderPools.pants.map((value) => `<option value="${value}">${choiceLabel(value)}</option>`).join("");
        pantsSelect.value = customDraft?.pants || "trunks";
        fields.appendChild(pantsSelect);
        ui.builderPants = pantsSelect;
      }
      const legacyOutfit = panel.querySelector("#builder-outfit");
      if (legacyOutfit) {
        const legacyLabel = legacyOutfit.closest("label");
        if (legacyLabel) legacyLabel.classList.add("aaa-native-field");
        legacyOutfit.classList.add("aaa-native-field");
      }
      for (const select of [ui.builderBody, ui.builderHair, ui.builderShirt, ui.builderPants]) {
        if (!select) continue;
        const legacyLabel = select.closest("label");
        if (legacyLabel) legacyLabel.classList.add("aaa-native-field");
        else select.classList.add("aaa-native-field");
      }
    }
    if (ui.builderHair) {
      const legacyBeardOption = ui.builderHair.querySelector('option[value="beard"]');
      if (legacyBeardOption) legacyBeardOption.remove();
      if (ui.builderHair.value === "beard") ui.builderHair.value = "crop";
    }

    const visualChoices = document.createElement("section");
    visualChoices.className = "aaa-visual-choices";
    visualChoices.setAttribute("aria-label", "Appearance choices");
    const economyForUi = normalizeFighterEconomy(customDraft?.economy, customDraft?.body || "athlete");
    // Ensure shirt select lists every pool value (locked ones stay hidden until Gear unlock).
    if (ui.builderShirt) {
      const existing = new Set(Array.from(ui.builderShirt.options).map((option) => option.value));
      for (const value of builderPools.shirt) {
        if (existing.has(value)) continue;
        const option = document.createElement("option");
        option.value = value;
        option.textContent = choiceLabel(value);
        ui.builderShirt.appendChild(option);
      }
    }
    const definitions = [
      { title: "Body", select: ui.builderBody, values: builderPools.body },
      { title: "Hair", select: ui.builderHair, values: builderPools.hairStyle.filter((value) => value !== "beard") },
      // All shirts exist in the pool; locked cosmetics stay hidden until Gear unlock.
      { title: "Shirts", select: ui.builderShirt, values: builderPools.shirt, unlockField: "shirt" },
      { title: "Pants", select: ui.builderPants, values: builderPools.pants },
    ];
    for (const definition of definitions) {
      if (!definition.select) continue;
      const group = document.createElement("div");
      group.className = "aaa-choice-group";
      group.dataset.choiceFor = definition.select.id;
      group.innerHTML = `<strong>${definition.title}</strong><div class="aaa-choice-row" role="group" aria-label="${definition.title}"></div>`;
      const row = group.querySelector(".aaa-choice-row");
      for (const value of definition.values) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.choiceValue = value;
        button.setAttribute("aria-pressed", String(definition.select.value === value));
        const locked = definition.unlockField ? !isAppearanceUnlocked(economyForUi, definition.unlockField, value) : false;
        button.hidden = locked;
        button.disabled = locked;
        if (locked) button.classList.add("is-locked-cosmetic");
        const clothingLayer = definition.select === ui.builderShirt ? "shirt" : definition.select === ui.builderPants ? "pants" : "";
        const choicePreview = clothingLayer
          ? `<canvas class="aaa-gear-choice-preview" data-clothing-preview="${value}" data-clothing-layer="${clothingLayer}" width="168" height="96" aria-hidden="true"></canvas>`
          : `<i aria-hidden="true" data-choice-icon="${value}"></i>`;
        button.innerHTML = `${choicePreview}<span>${labelForValue(definition.select, value)}</span><b aria-hidden="true">✓</b>`;
        button.addEventListener("click", () => {
          if (definition.unlockField && !isAppearanceUnlocked(normalizeFighterEconomy(customDraft?.economy, customDraft?.body || "athlete"), definition.unlockField, value)) {
            flashToast("Buy this in the Gear tab first", 1200);
            return;
          }
          definition.select.value = value;
          definition.select.dispatchEvent(new Event("change", { bubbles: true }));
          syncAaaChoiceStates(panel);
        });
        row.appendChild(button);
      }
      visualChoices.appendChild(group);
    }

    const faceMask = document.createElement("section");
    faceMask.className = "aaa-face-mask";
    faceMask.innerHTML = `
      <strong>Face &amp; Mask</strong>
      <div class="aaa-face-mask-columns">
        <div class="aaa-choice-group" data-choice-for="builder-facial-hair">
          <span>Facial hair</span>
          <div class="aaa-choice-row aaa-facial-hair-row" role="group" aria-label="Facial hair"></div>
        </div>
        <div class="aaa-choice-group" data-choice-for="builder-face">
          <span>Expression</span>
          <div class="aaa-choice-row aaa-face-row" role="group" aria-label="Facial expression"></div>
        </div>
        <div class="aaa-choice-group" data-choice-for="builder-mask">
          <span>Mask equipment</span>
          <div class="aaa-choice-row aaa-mask-row" role="group" aria-label="Face mask"></div>
        </div>
      </div>
    `;
    const faceSelect = document.createElement("select");
    faceSelect.id = "builder-face";
    faceSelect.className = "aaa-data-select";
    faceSelect.setAttribute("aria-label", "Facial expression");
    faceSelect.innerHTML = builderPools.faceExpression.map((value) => `<option value="${value}">${choiceLabel(value)}</option>`).join("");
    const facialHairSelect = document.createElement("select");
    facialHairSelect.id = "builder-facial-hair";
    facialHairSelect.className = "aaa-data-select";
    facialHairSelect.setAttribute("aria-label", "Facial hair");
    facialHairSelect.innerHTML = builderPools.facialHair.map((value) => `<option value="${value}">${choiceLabel(value)}</option>`).join("");
    const maskSelect = document.createElement("select");
    maskSelect.id = "builder-mask";
    maskSelect.className = "aaa-data-select";
    maskSelect.setAttribute("aria-label", "Face mask");
    maskSelect.innerHTML = builderPools.faceMask.map((value) => `<option value="${value}">${choiceLabel(value)}</option>`).join("");
    const accessorySelect = document.createElement("select");
    accessorySelect.id = "builder-accessory";
    accessorySelect.className = "aaa-accessory-select aaa-data-select";
    accessorySelect.setAttribute("aria-label", "Accessory");
    accessorySelect.innerHTML = (builderPools.accessory || ["none"]).map((value) => {
      const unlocked = isAppearanceUnlocked(economyForUi, "accessory", value);
      return `<option value="${value}"${unlocked ? "" : " hidden disabled"}>${choiceLabel(value)}</option>`;
    }).join("");
    const accessoryGroup = document.createElement("div");
    accessoryGroup.className = "aaa-choice-group";
    accessoryGroup.dataset.choiceFor = "builder-accessory";
    accessoryGroup.innerHTML = `<strong>Accessories</strong><div class="aaa-choice-row aaa-accessory-row" role="group" aria-label="Accessories"></div><p class="aaa-unlock-hint">Locked looks stay in Gear until purchased — then they replace clothing here.</p>`;
    faceMask.append(facialHairSelect, faceSelect, maskSelect, accessorySelect, accessoryGroup);
    ui.builderFacialHair = facialHairSelect;
    ui.builderFace = faceSelect;
    ui.builderMask = maskSelect;
    ui.builderAccessory = accessorySelect;

    const addFaceButtons = (row, values, select, unlockField = null) => {
      for (const value of values) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.choiceValue = value;
        button.setAttribute("aria-pressed", String(select.value === value));
        const locked = unlockField ? !isAppearanceUnlocked(economyForUi, unlockField, value) : false;
        button.hidden = locked;
        button.disabled = locked;
        if (locked) button.classList.add("is-locked-cosmetic");
        button.innerHTML = `<i aria-hidden="true" data-choice-icon="${value}"></i><span>${choiceLabel(value)}</span><b aria-hidden="true">✓</b>`;
        button.addEventListener("click", () => {
          if (unlockField && !isAppearanceUnlocked(normalizeFighterEconomy(customDraft?.economy, customDraft?.body || "athlete"), unlockField, value)) {
            flashToast("Buy this in the Gear tab first", 1200);
            return;
          }
          select.value = value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          syncAaaChoiceStates(panel);
        });
        row.appendChild(button);
      }
    };
    addFaceButtons(faceMask.querySelector(".aaa-facial-hair-row"), builderPools.facialHair, facialHairSelect);
    addFaceButtons(faceMask.querySelector(".aaa-face-row"), builderPools.faceExpression, faceSelect);
    addFaceButtons(faceMask.querySelector(".aaa-mask-row"), builderPools.faceMask, maskSelect);
    addFaceButtons(accessoryGroup.querySelector(".aaa-accessory-row"), builderPools.accessory || ["none"], accessorySelect, "accessory");

    const insertBefore = panel.querySelector(".builder-riftality-preview, .builder-colors, .builder-actions, .builder-storage");
    panel.insertBefore(visualChoices, insertBefore);
    panel.insertBefore(faceMask, insertBefore);

    const appearancePanel = document.createElement("section");
    appearancePanel.className = "aaa-builder-section is-active";
    appearancePanel.dataset.builderPanel = "appearance";
    appearancePanel.setAttribute("role", "tabpanel");
    const colorsPanel = document.createElement("section");
    colorsPanel.className = "aaa-builder-section";
    colorsPanel.dataset.builderPanel = "colors";
    colorsPanel.setAttribute("role", "tabpanel");
    colorsPanel.hidden = true;
    const riftalityPanel = document.createElement("section");
    riftalityPanel.className = "aaa-builder-section aaa-riftality-panel";
    riftalityPanel.dataset.builderPanel = "riftality";
    riftalityPanel.setAttribute("role", "tabpanel");
    riftalityPanel.hidden = true;
    const trainingPanel = document.createElement("section");
    trainingPanel.className = "aaa-builder-section aaa-training-panel";
    trainingPanel.dataset.builderPanel = "training";
    trainingPanel.setAttribute("role", "tabpanel");
    trainingPanel.hidden = true;
    trainingPanel.innerHTML = `
      <div class="fighter-progression-head">
        <div><span>Fighter level</span><strong data-progression-level>1</strong></div>
        <div><span>Rift Credits</span><strong data-progression-points>600 RC</strong></div>
      </div>
      <div class="fighter-xp-track" role="progressbar" aria-label="Fighter experience" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <i data-progression-xp-fill></i>
      </div>
      <p class="fighter-xp-copy" data-progression-xp-copy>0 / 100 XP</p>
      <div class="fighter-stat-grid" aria-label="Upgradeable fighter skills"></div>
      <small>Earn XP and RC from fights. Stat upgrades cost ${STAT_UPGRADE_RC_COST} RC each — Terminal live edits are disabled.</small>
    `;
    const statDefinitions = [
      ["punch", "Punch Power", "Jabs, rising cuts and close strikes"],
      ["kick", "Kick Power", "Roundhouse and low-kick damage"],
      ["rift", "Rift Power", "Arc Bolt and other projectile damage"],
      ["defense", "Defense", "Reduces incoming damage"],
    ];
    const statGrid = trainingPanel.querySelector(".fighter-stat-grid");
    for (const [stat, label, description] of statDefinitions) {
      const row = document.createElement("div");
      row.className = "fighter-stat-row";
      row.dataset.progressionStat = stat;
      row.innerHTML = `
        <div><strong>${label}</strong><span>${description}</span></div>
        <div class="fighter-stat-pips" aria-hidden="true"></div>
        <b data-stat-value>0/${progressionStatCap}</b>
        <button type="button" data-upgrade-stat="${stat}" aria-label="Upgrade ${label}">+</button>
      `;
      statGrid.appendChild(row);
    }
    trainingPanel.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-upgrade-stat]");
      if (!button) return;
      upgradeFighterStat(button.dataset.upgradeStat);
    });
    const gearPanel = document.createElement("section");
    gearPanel.className = "aaa-builder-section aaa-gear-panel";
    gearPanel.dataset.builderPanel = "gear";
    gearPanel.setAttribute("role", "tabpanel");
    gearPanel.hidden = true;
    gearPanel.innerHTML = `
      <div class="fighter-gear-head">
        <div><span>Rift Credits</span><strong data-rift-credits>600</strong></div>
        <p>Earned through fights. Gear is permanently owned on this device and limited by fighter body type.</p>
      </div>
      <div class="fighter-gear-grid" aria-label="Fighter gear store"></div>
    `;
    const gearGrid = gearPanel.querySelector(".fighter-gear-grid");
    for (const item of fighterGearCatalog) {
      const card = document.createElement("article");
      card.className = "fighter-gear-card";
      card.dataset.gearItem = item.id;
      card.innerHTML = `
        <div class="fighter-gear-swatch" style="--gear-color:${item.color || "#667788"}" aria-hidden="true"></div>
        <div class="fighter-gear-details"><small>${choiceLabel(item.slot)}${item.cosmetic ? " · Cosmetic" : ""}</small><strong>${item.name}</strong><span>${item.description}</span><em data-gear-compatibility></em></div>
        <div class="fighter-gear-actions">
          ${item.cosmetic ? `<button type="button" data-gear-preview="${item.id}">Preview</button>` : ""}
          <button type="button" data-gear-action="${item.id}">Equip</button>
        </div>
      `;
      gearGrid.appendChild(card);
    }
    gearPanel.addEventListener("click", (event) => {
      const preview = event.target.closest("button[data-gear-preview]");
      if (preview) {
        purchaseOrEquipGear(preview.dataset.gearPreview, { previewOnly: true });
        return;
      }
      const button = event.target.closest("button[data-gear-action]");
      if (!button) return;
      purchaseOrEquipGear(button.dataset.gearAction);
    });

    const builderHead = panel.querySelector(".builder-head");
    const nameField = ui.builderName?.closest("label");
    const legacyFields = panel.querySelector(".builder-fields");
    const colorFields = panel.querySelector(".builder-colors");
    const riftalityField = panel.querySelector(".builder-riftality-field");
    const riftalityPreview = panel.querySelector(".builder-riftality-preview");
    if (builderHead) appearancePanel.appendChild(builderHead);
    if (nameField) appearancePanel.appendChild(nameField);
    if (legacyFields) appearancePanel.appendChild(legacyFields);
    appearancePanel.append(visualChoices, faceMask);
    if (colorFields) colorsPanel.appendChild(colorFields);
    if (riftalityField) riftalityPanel.appendChild(riftalityField);
    if (riftalityPreview) riftalityPanel.appendChild(riftalityPreview);
    tabs.after(appearancePanel, colorsPanel, trainingPanel, gearPanel, riftalityPanel);

    const previewBox = ui.builderPreview || query("#builder-preview");
    if (previewBox && !previewBox.querySelector(".aaa-preview-controls")) {
      const controls = document.createElement("div");
      controls.className = "aaa-preview-controls";
      controls.setAttribute("aria-label", "Preview animation");
      controls.innerHTML = `
        <button type="button" class="is-active" data-preview-mode="idle" aria-pressed="true">Idle</button>
        <button type="button" data-preview-mode="attack" aria-pressed="false">Attack</button>
        <button type="button" data-preview-mode="victory" aria-pressed="false">Victory</button>
      `;
      const actionHint = document.createElement("div");
      actionHint.className = "aaa-preview-action-hint";
      actionHint.setAttribute("aria-live", "polite");
      actionHint.textContent = "Idle stance";
      previewBox.appendChild(actionHint);
      controls.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        controls.querySelectorAll("button").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        builderPreviewMode = button.dataset.previewMode || "idle";
        if (builderPreviewMode === "attack") playBuilderPreviewAttack(false);
        else if (builderPreviewMode === "victory") playBuilderRiftalityPreview();
        else {
          stopBuilderPreviewAnimation();
          syncBuilderPreviewHint();
          schedulePreviewRedraw();
        }
      });
      previewBox.appendChild(controls);

      const previewCanvas = ui.builderPreviewCanvas || query("#builder-preview-canvas");
      if (previewCanvas && !previewCanvas.dataset.attackPreviewBound) {
        previewCanvas.dataset.attackPreviewBound = "true";
        previewCanvas.tabIndex = 0;
        previewCanvas.setAttribute("role", "button");
        previewCanvas.setAttribute("aria-label", "Fighter preview. Choose Attack, then press here to play the next attack.");
        const advanceAttack = () => {
          if (builderPreviewMode !== "attack") return;
          playBuilderPreviewAttack(true);
        };
        previewCanvas.addEventListener("click", advanceAttack);
        previewCanvas.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          advanceAttack();
        });
      }
    }

    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const targetSection = button.dataset.builderSection || "appearance";
      tabs.querySelectorAll("button").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      panel.querySelectorAll(".aaa-builder-section").forEach((section) => {
        const active = section.dataset.builderPanel === targetSection;
        section.classList.toggle("is-active", active);
        section.hidden = !active;
      });
      panel.scrollTo({ top: 0, behavior: "smooth" });
    });
    syncAaaChoiceStates(panel);
    refreshAppearanceUnlockUi(panel);
    renderProgressionUi(panel);
    renderGearUi(panel);
  }

  function renderGearUi(panel = ui.builderPanel) {
    if (!panel) return;
    const draft = normalizeCustomDraft(customDraft);
    const economy = draft.economy;
    panel.querySelectorAll("[data-rift-credits]").forEach((creditsEl) => {
      creditsEl.textContent = economy.credits.toLocaleString();
    });
    panel.querySelectorAll("[data-gear-item]").forEach((card) => {
      const item = gearItem(card.dataset.gearItem);
      if (!item) return;
      const owned = economy.owned.includes(item.id);
      const equipped = economy.equipped[item.slot] === item.id;
      const compatible = item.bodies.includes(draft.body);
      const button = card.querySelector("button[data-gear-action]");
      const compatibility = card.querySelector("[data-gear-compatibility]");
      card.classList.toggle("is-owned", owned);
      card.classList.toggle("is-equipped", equipped);
      card.classList.toggle("is-locked", !compatible);
      if (compatibility) compatibility.textContent = compatible ? `Compatible · ${item.bodies.map(choiceLabel).join(", ")}` : `Requires ${item.bodies.map(choiceLabel).join(" or ")}`;
      if (!button) return;
      button.disabled = !compatible || (!owned && economy.credits < item.price) || (equipped && item.price === 0);
      button.textContent = equipped ? (item.price ? "Unequip" : "Equipped") : owned ? "Equip" : item.price ? `Buy · ${item.price}` : "Owned";
    });
    renderRiftalityBindingUi(draft);
  }

  function purchaseOrEquipGear(itemId, options = {}) {
    const item = gearItem(itemId);
    if (!item) return;
    const draft = readBuilderDraft();
    const economy = normalizeFighterEconomy(draft.economy, draft.body);
    if (!item.bodies.includes(draft.body)) return;
    const owned = economy.owned.includes(item.id);
    const equipped = economy.equipped[item.slot] === item.id;

    // Preview-only: show on canvas without buying.
    if (options.previewOnly) {
      previewGearId = itemId;
      renderBuilderPreview();
      flashToast(`Preview · ${item.name}`, 900);
      return;
    }

    if (equipped && item.price) {
      economy.equipped[item.slot] = item.slot === "gloves" ? "starter-wraps" : item.slot === "boots" ? "starter-boots" : null;
      if (item.appearance?.shirt) draft.shirt = "tee";
      if (item.appearance?.accessory) draft.accessory = "none";
    } else {
      if (!owned) {
        if (economy.credits < item.price) {
          flashToast(`Need ${item.price - economy.credits} more RC`, 1200);
          return;
        }
        economy.credits -= item.price;
        economy.owned.push(item.id);
        if (item.price > 0) {
          pushFighterLedgerEvent({ type: "buy_gear", itemId: item.id, costRc: item.price, slot: item.slot });
        }
      }
      economy.equipped[item.slot] = item.id;
      pushFighterLedgerEvent({ type: "equip_gear", itemId: item.id, slot: item.slot });
      // Cosmetic gear replaces Appearance clothing/accessories once owned+equipped.
      if (item.appearance?.shirt) draft.shirt = item.appearance.shirt;
      if (item.appearance?.accessory) draft.accessory = item.appearance.accessory;
    }
    previewGearId = null;
    customDraft = normalizeCustomDraft({ ...draft, economy });
    saveCustomDraftToDevice(customDraft);
    customCharacter = createCustomCharacter(customDraft);
    characterById.set("custom", customCharacter);
    writeDraftToBuilder(customDraft);
    refreshAppearanceUnlockUi();
    syncAaaChoiceStates();
    renderGearUi();
    renderBuilderPreview();
    const newlyBought = !owned;
    flashToast(
      equipped
        ? `${item.name} unequipped`
        : newlyBought
          ? `Unlocked ${item.name} — now replaces clothing in Appearance`
          : `${item.name} equipped`,
      1400,
    );
  }

  function renderProgressionUi(panel = ui.builderPanel) {
    if (!panel) return;
    const progression = normalizeFighterProgression(customDraft?.progression);
    const needed = xpForNextFighterLevel(progression.level);
    const levelEl = panel.querySelector("[data-progression-level]");
    const pointsEl = panel.querySelector("[data-progression-points]");
    const copyEl = panel.querySelector("[data-progression-xp-copy]");
    const trackEl = panel.querySelector(".fighter-xp-track");
    const fillEl = panel.querySelector("[data-progression-xp-fill]");
    const economy = normalizeFighterEconomy(customDraft?.economy, customDraft?.body || "athlete");
    if (levelEl) levelEl.textContent = String(progression.level);
    if (pointsEl) pointsEl.textContent = `${economy.credits.toLocaleString()} RC`;
    if (copyEl) copyEl.textContent = `${progression.xp} / ${needed} XP · Stat upgrade ${STAT_UPGRADE_RC_COST} RC`;
    if (trackEl) {
      trackEl.setAttribute("aria-valuemax", String(needed));
      trackEl.setAttribute("aria-valuenow", String(progression.xp));
    }
    if (fillEl) fillEl.style.width = `${clamp(progression.xp / needed * 100, 0, 100)}%`;
    panel.querySelectorAll("[data-progression-stat]").forEach((row) => {
      const stat = row.dataset.progressionStat;
      const value = progression.stats[stat] || 0;
      const valueEl = row.querySelector("[data-stat-value]");
      const pipsEl = row.querySelector(".fighter-stat-pips");
      const button = row.querySelector("button[data-upgrade-stat]");
      if (valueEl) valueEl.textContent = `${value}/${progressionStatCap}`;
      if (pipsEl) pipsEl.innerHTML = Array.from({ length: progressionStatCap }, (_, index) => `<i class="${index < value ? "is-filled" : ""}"></i>`).join("");
      if (button) {
        button.disabled = economy.credits < STAT_UPGRADE_RC_COST || value >= progressionStatCap;
        button.textContent = `+${STAT_UPGRADE_RC_COST} RC`;
        button.setAttribute("aria-label", `Spend ${STAT_UPGRADE_RC_COST} Rift Credits to upgrade`);
      }
    });
  }

  function upgradeFighterStat(stat) {
    if (!["punch", "kick", "rift", "defense"].includes(stat)) return;
    const draft = readBuilderDraft();
    const progression = normalizeFighterProgression(draft.progression);
    const economy = normalizeFighterEconomy(draft.economy, draft.body);
    if (progression.stats[stat] >= progressionStatCap) return;
    if (economy.credits < STAT_UPGRADE_RC_COST) {
      flashToast(`Need ${STAT_UPGRADE_RC_COST - economy.credits} more RC`, 1200);
      return;
    }
    economy.credits -= STAT_UPGRADE_RC_COST;
    progression.stats[stat] += 1;
    progression.upgradePoints = 0;
    pushFighterLedgerEvent({ type: "train_stat", stat, costRc: STAT_UPGRADE_RC_COST });
    customDraft = normalizeCustomDraft({ ...draft, progression, economy });
    saveCustomDraftToDevice(customDraft);
    customCharacter = createCustomCharacter(customDraft);
    characterById.set("custom", customCharacter);
    renderProgressionUi();
    renderGearUi();
    renderBuilderPreview();
    flashToast(`${choiceLabel(stat)} +1 · -${STAT_UPGRADE_RC_COST} RC`, 1100);
  }

  function syncAaaChoiceStates(panel = ui.builderPanel) {
    if (!panel) return;
    const values = {
      "builder-body": ui.builderBody?.value,
      "builder-hair": ui.builderHair?.value,
      "builder-facial-hair": ui.builderFacialHair?.value,
      "builder-shirt": ui.builderShirt?.value,
      "builder-pants": ui.builderPants?.value,
      "builder-face": ui.builderFace?.value,
      "builder-mask": ui.builderMask?.value,
      "builder-accessory": (ui.builderAccessory || query("#builder-accessory"))?.value,
    };
    panel.querySelectorAll("[data-choice-for]").forEach((group) => {
      const selected = values[group.dataset.choiceFor];
      group.querySelectorAll("[data-choice-value]").forEach((button) => {
        const active = button.dataset.choiceValue === selected;
        button.classList.toggle("is-selected", active);
        button.setAttribute("aria-pressed", String(active));
      });
    });
    renderAaaClothingChoicePreviews(panel);
  }

  function renderAaaClothingChoicePreviews(panel = ui.builderPanel) {
    if (!panel) return;
    const canvases = panel.querySelectorAll("canvas[data-clothing-preview]");
    if (!canvases.length) return;
    const draft = readBuilderDraft();
    canvases.forEach((canvas) => {
      const value = canvas.dataset.clothingPreview;
      const layer = canvas.dataset.clothingLayer;
      if (!value || !layer) return;
      const character = createCustomCharacter({
        ...draft,
        [layer]: value,
        faceExpression: "neutral",
        faceMask: "none",
      });
      drawFighterPreviewToCanvas(canvas, character, null, null, {
        allowGraphic: false,
        canvasOnly: true,
        width: 84,
        height: 48,
        scaleBoost: 0.68,
        centerBody: true,
      });
    });
  }

  function populateRiftalitySelect(selectedId = "personal") {
    const select = ui.builderRiftality || query("#builder-riftality");
    if (!select) return;
    const current = selectedId || select.value || "personal";
    select.innerHTML = builderRiftalityCatalog
      .map((entry) => `<option value="${entry.id}" ${entry.id === current ? "selected" : ""}>${entry.label}</option>`)
      .join("");
    select.value = builderPools.riftalityId.includes(current) ? current : "personal";
  }

  function renderRiftalityBindingUi(draft = customDraft) {
    const data = normalizeCustomDraft(draft);
    const select = ui.builderRiftality || query("#builder-riftality");
    const field = select?.closest(".builder-riftality-field");
    if (!select || !field) return;
    select.disabled = data.riftalityLocked;
    select.setAttribute("aria-describedby", data.riftalityLocked ? "builder-riftality-lock-note" : "builder-riftality-meta");
    field.classList.toggle("is-bound", data.riftalityLocked);
    let note = field.querySelector("#builder-riftality-lock-note");
    if (!data.riftalityLocked) {
      note?.remove();
      return;
    }
    if (!note || !note.querySelector("[data-riftality-rebind]")) {
      note?.remove();
      note = document.createElement("div");
      note.id = "builder-riftality-lock-note";
      note.className = "riftality-lock-note";
      const copy = document.createElement("span");
      copy.textContent = "Bound to this fighter";
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.riftalityRebind = "true";
      button.addEventListener("click", purchaseRiftalityRebind);
      note.append(copy, button);
      field.appendChild(note);
    }
    const button = note.querySelector("[data-riftality-rebind]");
    if (button) {
      const affordable = data.economy.credits >= RIFTALITY_REBIND_COST;
      button.disabled = !affordable;
      button.textContent = `Unlock change · ${RIFTALITY_REBIND_COST.toLocaleString()} RC`;
      button.title = affordable ? "Pay once to choose a different Riftality" : `Need ${(RIFTALITY_REBIND_COST - data.economy.credits).toLocaleString()} more Rift Credits`;
    }
  }

  function purchaseRiftalityRebind() {
    const draft = normalizeCustomDraft(customDraft || readBuilderDraft());
    if (!draft.riftalityLocked) return;
    if (draft.economy.credits < RIFTALITY_REBIND_COST) {
      flashToast(`Need ${(RIFTALITY_REBIND_COST - draft.economy.credits).toLocaleString()} more Rift Credits`, 1600);
      return;
    }
    const economy = normalizeFighterEconomy(draft.economy, draft.body);
    economy.credits -= RIFTALITY_REBIND_COST;
    customDraft = normalizeCustomDraft({ ...draft, economy, riftalityLocked: false });
    saveCustomDraftToDevice(customDraft);
    customCharacter = createCustomCharacter(customDraft);
    characterById.set("custom", customCharacter);
    writeDraftToBuilder(customDraft);
    renderBuilderPreview();
    ui.builderRiftality?.focus();
    flashToast("Riftality selection unlocked", 1400);
  }

  function writeDraftToBuilder(draft) {
    const data = normalizeCustomDraft(draft);
    if (ui.builderName) ui.builderName.value = data.name;
    if (ui.builderBody) ui.builderBody.value = data.body;
    if (ui.builderHair) ui.builderHair.value = data.hairStyle;
    if (ui.builderFacialHair) ui.builderFacialHair.value = data.facialHair;
    if (ui.builderShirt) ui.builderShirt.value = data.shirt;
    if (ui.builderPants) ui.builderPants.value = data.pants;
    if (ui.builderFace) ui.builderFace.value = data.faceExpression;
    if (ui.builderMask) ui.builderMask.value = data.faceMask;
    if (ui.builderAccessory) ui.builderAccessory.value = data.accessory || "none";
    const accessoryDom = query("#builder-accessory");
    if (accessoryDom) accessoryDom.value = data.accessory || "none";
    populateRiftalitySelect(data.riftalityId);
    if (ui.builderRiftality) {
      ui.builderRiftality.disabled = data.riftalityLocked;
      ui.builderRiftality.setAttribute("aria-describedby", data.riftalityLocked ? "builder-riftality-lock-note" : "builder-riftality-meta");
    }
    const riftalityField = ui.builderRiftality?.closest(".builder-riftality-field");
    if (riftalityField) {
      riftalityField.classList.toggle("is-bound", data.riftalityLocked);
      let lockNote = riftalityField.querySelector("#builder-riftality-lock-note");
      if (data.riftalityLocked && !lockNote) {
        lockNote = document.createElement("small");
        lockNote.id = "builder-riftality-lock-note";
        lockNote.className = "riftality-lock-note";
        lockNote.textContent = "Bound to this fighter · Reset to choose a new Riftality";
        riftalityField.appendChild(lockNote);
      } else if (!data.riftalityLocked && lockNote) {
        lockNote.remove();
      }
    }
    renderRiftalityBindingUi(data);
    if (ui.builderSkin) ui.builderSkin.value = data.palette.skin;
    if (ui.builderHairColor) ui.builderHairColor.value = data.palette.hair;
    if (ui.builderGloves) ui.builderGloves.value = data.palette.gloves;
    if (ui.builderTrunks) ui.builderTrunks.value = data.palette.trunks;
    if (ui.builderAccent) ui.builderAccent.value = data.palette.accent;
    if (ui.builderBoots) ui.builderBoots.value = data.palette.boots;
    if (ui.builderMeter) ui.builderMeter.value = data.palette.meter;
    syncAaaChoiceStates();
    renderRiftalityPreview(data.riftalityId);
    renderProgressionUi();
    renderGearUi();
  }

  function readBuilderDraft() {
    const nameEl = ui.builderName || query("#builder-name");
    const bodyEl = ui.builderBody || query("#builder-body");
    const hairEl = ui.builderHair || query("#builder-hair");
    const facialHairEl = ui.builderFacialHair || query("#builder-facial-hair");
    const shirtEl = ui.builderShirt || query("#builder-shirt");
    const pantsEl = ui.builderPants || query("#builder-pants");
    const faceEl = ui.builderFace || query("#builder-face");
    const maskEl = ui.builderMask || query("#builder-mask");
    const riftalityEl = ui.builderRiftality || query("#builder-riftality");
    const skinEl = ui.builderSkin || query("#builder-skin");
    const hairColorEl = ui.builderHairColor || query("#builder-hair-color");
    const glovesEl = ui.builderGloves || query("#builder-gloves");
    const trunksEl = ui.builderTrunks || query("#builder-trunks");
    const accentEl = ui.builderAccent || query("#builder-accent");
    const bootsEl = ui.builderBoots || query("#builder-boots");
    const meterEl = ui.builderMeter || query("#builder-meter");
    const shirt = shirtEl?.value;
    const accessory = (ui.builderAccessory || query("#builder-accessory"))?.value || "none";
    // Appearance swaps replace equipped cosmetic gear when the player picks a different look.
    const economy = normalizeFighterEconomy(customDraft?.economy, bodyEl?.value || customDraft?.body || "athlete");
    const equippedShirt = gearItem(economy.equipped?.shirt);
    if (equippedShirt?.appearance?.shirt && equippedShirt.appearance.shirt !== shirt) economy.equipped.shirt = null;
    const equippedAcc = gearItem(economy.equipped?.accessory);
    if (equippedAcc?.appearance?.accessory && equippedAcc.appearance.accessory !== accessory) economy.equipped.accessory = null;
    return normalizeCustomDraft({
      name: nameEl?.value,
      body: bodyEl?.value,
      hairStyle: hairEl?.value,
      facialHair: facialHairEl?.value,
      shirt,
      pants: pantsEl?.value,
      faceExpression: faceEl?.value,
      faceMask: maskEl?.value,
      accessory,
      riftalityId: customDraft?.riftalityLocked ? customDraft.riftalityId : riftalityEl?.value,
      riftalityLocked: Boolean(customDraft?.riftalityLocked),
      progression: customDraft?.progression,
      economy,
      palette: {
        skin: skinEl?.value,
        hair: hairColorEl?.value,
        gloves: glovesEl?.value,
        trunks: trunksEl?.value,
        accent: accentEl?.value,
        boots: bootsEl?.value,
        meter: meterEl?.value,
      },
    });
  }

  function randomCustomDraft() {
    const skinSource = randomChoice([...roster, ...hiddenRivals]);
    const shapeSource = randomChoice(roster);
    const palette = skinSource.palette;
    return normalizeCustomDraft({
      name: `${skinSource.name} ${randomChoice(builderPools.name)}`,
      body: shapeSource.body,
      hairStyle: shapeSource.hairStyle,
      facialHair: randomChoice(builderPools.facialHair),
      outfit: shapeSource.outfit,
      shirt: randomChoice(FREE_SHIRTS.filter((s) => s !== "crop" && s !== "bare")),
      pants: randomChoice(builderPools.pants),
      faceExpression: randomChoice(builderPools.faceExpression),
      faceMask: randomChoice(builderPools.faceMask),
      accessory: "none",
      riftalityId: randomChoice(builderPools.riftalityId),
      progression: customDraft?.progression,
      economy: customDraft?.economy,
      palette: {
        skin: palette.skin,
        hair: palette.hair,
        gloves: palette.gloves,
        trunks: palette.trunks,
        accent: palette.accent,
        boots: palette.boots,
        meter: palette.meter,
      },
    });
  }

  function updateCustomFromBuilder(selectAfterUpdate, options = {}) {
    syncSelectModeFromDom();
    if (selectMode !== "create") selectMode = "create";
    customDraft = readBuilderDraft();
    customCharacter = createCustomCharacter(customDraft);
    cachedBuilderPreviewKey = builderDraftFingerprint(customDraft);
    cachedBuilderPreviewCharacter = customCharacter;
    saveCustomDraftToDevice(customDraft);
    if (!options.skipClothingThumbs) renderGearUi();
    characterById.set("custom", customCharacter);
    const switchingToCustom = selectedCharacterId !== "custom";
    if (game.phase === "select" && selectMode === "create" && (selectAfterUpdate || switchingToCustom)) {
      selectedCharacterId = "custom";
      // Keep Attack/Victory preview rival stable while editing — never re-roll for the title bar.
      if (switchingToCustom || !characterById.has(enemyCharacterId) || enemyCharacterId === "custom") {
        if (!builderPreviewRivalId || builderPreviewRivalId === "custom" || !characterById.has(builderPreviewRivalId)) {
          builderPreviewRivalId = chooseRivalId(selectedCharacterId);
        }
        enemyCharacterId = builderPreviewRivalId;
      }
      player = createFighter(true, selectedCharacterId);
      enemy = createFighter(false, enemyCharacterId);
      updateHud();
    }
    clearSelectMatchup();
    renderBuilderPreview();
    if (!options.skipClothingThumbs) {
      const panel = ui.builderPanel || query("#fighter-builder");
      if (panel) renderAaaClothingChoicePreviews(panel);
    }
    // Full roster rebuild is expensive; only rebuild when first selecting custom.
    if (switchingToCustom) renderRoster();
    else updateRosterSelection();
  }

  function previewCharacter() {
    return selectedCharacterId === "custom" ? customCharacter : getCharacter(selectedCharacterId);
  }

  function isUsableFighterSheet(image) {
    if (!image || !image.width || !image.height) return false;
    const aspect = image.width / image.height;
    // Move strips (~9 frames wide) or multi-column grids only — not story portraits.
    return aspect >= 4 || (aspect >= 1.2 && image.width >= 400);
  }

  function isPlotPulsePortraitAsset(characterId, asset) {
    if (!plotPulseIds.has(characterId) || !asset) return false;
    const source = String(asset.loadedSrc || asset.src || "");
    return source.includes("assets/fighters/plot-pulse/") || source.includes("midnight-fist-assets-fighters-plot-pulse");
  }

  function fighterGraphicAsset(characterId) {
    if (characterId === "sable") return null;
    ensureFighterVisualAssets(characterId);
    const moveAsset = generatedAssets.moveSheets.get(characterId);
    if (moveAsset?.ready) {
      const image = moveAsset.keyedImage || moveAsset.image;
      if (isUsableFighterSheet(image)) return moveAsset;
    }
    const sheetAsset = generatedAssets.fighters.get(characterId);
    if (sheetAsset?.ready) {
      const image = sheetAsset.keyedImage || sheetAsset.image;
      // Plot-Pulse portrait stills must never become combat/select sprites.
      if (isPlotPulsePortraitAsset(characterId, sheetAsset)) return null;
      if (plotPulseIds.has(characterId) && !isUsableFighterSheet(image)) return null;
      if (isUsableFighterSheet(image)) return sheetAsset;
    }
    return null;
  }

  function fighterPortraitSource(characterId) {
    const character = characterById.get(characterId);
    if (!character || characterId === "custom") return null;
    for (const path of fighterAssetPaths(character)) {
      if (/^https?:\/\//i.test(path)) return path;
    }
    return null;
  }

  function fighterPreviewFrame(character, asset) {
    const image = asset.keyedImage || asset.image;
    const customFrames = generatedSpriteFrames[character.id];
    if (customFrames?.[0]) return customFrames[0];
    if (asset.frames?.[0]) return asset.frames[0];
    return generatedGridFrame(image, 0);
  }

  function queueBuilderPreviewRefreshOnAssetLoad(characterId, asset) {
    if (!asset?.image) return;
    const refresh = () => {
      if (game.phase !== "select") return;
      if (selectedCharacterId === characterId) {
        if (selectMode === "create") renderBuilderPreview();
        else renderRosterPreview();
      }
      updateRosterSelection();
    };
    asset.image.addEventListener("load", refresh);
    asset.image.addEventListener("error", refresh);
  }

  function syncBuilderFromCharacter(characterId) {
    if (characterId === "custom") return;
    const character = getCharacter(characterId);
    writeDraftToBuilder({
      name: character.name,
      body: character.body,
      hairStyle: character.hairStyle,
      facialHair: character.facialHair || "none",
      outfit: character.outfit,
      shirt: character.shirt,
      pants: character.pants,
      faceExpression: character.faceExpression || "neutral",
      faceMask: character.faceMask || "none",
      palette: { ...character.palette },
    });
  }

  function renderRiftalityPreview(riftalityId) {
    const entry = getBuilderRiftality(riftalityId || readBuilderDraft().riftalityId);
    const metaEl = ui.builderRiftalityMeta || query("#builder-riftality-meta");
    const colorsEl = ui.builderRiftalityColors || query("#builder-riftality-colors");
    const mapEl = ui.builderRiftalityMap || query("#builder-riftality-map");
    const canvas = ui.builderRiftalityCanvas || query("#builder-riftality-canvas");
    const arena = arenaCatalog.find((item) => item.id === entry.mapId) || arenaCatalog[0];
    const mapName = arena?.name || entry.mapId;
    if (metaEl) {
      metaEl.innerHTML = `<strong>${entry.label}</strong><span>${entry.blurb}</span><em>Map vibe: ${mapName}</em>`;
    }
    if (colorsEl) {
      colorsEl.innerHTML = `
        <span class="riftality-swatch" style="--swatch:${entry.primary}" title="Primary"><i></i>Primary</span>
        <span class="riftality-swatch" style="--swatch:${entry.secondary}" title="Secondary"><i></i>Secondary</span>
        <span class="riftality-family">${entry.family} family</span>
      `;
    }
    if (mapEl) mapEl.textContent = mapName;

    if (!canvas) return;
    const width = 320;
    const height = 150;
    const prepared = preparePreviewCanvas(canvas, { width, height });
    if (!prepared) return;
    const { ctx: c } = prepared;
    c.clearRect(0, 0, width, height);

    // Arena map plate
    const mapAsset = getArenaAsset(arena, true);
    const mapImage = mapAsset?.keyedImage || mapAsset?.image;
    if (mapImage && mapAsset?.ready && mapImage.complete && mapImage.naturalWidth) {
      c.drawImage(mapImage, 0, 0, width, height);
      c.fillStyle = "rgba(4, 8, 14, 0.55)";
      c.fillRect(0, 0, width, height);
    } else {
      const bg = c.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, entry.secondary);
      bg.addColorStop(1, "#05080f");
      c.fillStyle = bg;
      c.fillRect(0, 0, width, height);
      if (mapAsset?.image && !mapAsset.ready) {
        mapAsset.image.addEventListener("load", () => renderRiftalityPreview(entry.id), { once: true });
      }
    }

    // Color map ribbons
    c.fillStyle = entry.primary;
    c.globalAlpha = 0.85;
    c.fillRect(0, height - 18, width * 0.62, 8);
    c.fillStyle = entry.secondary;
    c.fillRect(width * 0.38, height - 10, width * 0.62, 8);
    c.globalAlpha = 1;

    // Mini fighter silhouettes + finisher flare
    const t = (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000;
    const px = width * 0.32;
    const ex = width * 0.68;
    const baseY = height - 28;
    c.fillStyle = "rgba(0,0,0,0.45)";
    c.beginPath();
    c.ellipse(px, baseY + 4, 18, 5, 0, 0, Math.PI * 2);
    c.ellipse(ex, baseY + 4, 18, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = customDraft?.palette?.skin || "#d6925d";
    c.fillRect(px - 10, baseY - 52, 20, 52);
    c.beginPath();
    c.arc(px, baseY - 60, 9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#c9a07a";
    c.fillRect(ex - 10, baseY - 52, 20, 52);
    c.beginPath();
    c.arc(ex, baseY - 60, 9, 0, Math.PI * 2);
    c.fill();

    // Style-specific preview effects
    c.save();
    c.globalCompositeOperation = "lighter";
    if (entry.family === "beam" || entry.id === "chrome" || entry.id === "eli-dev") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 3 + Math.sin(t * 8) * 1.2;
      c.beginPath();
      c.moveTo(px + 12, baseY - 54);
      c.lineTo(ex - 8, baseY - 48);
      c.stroke();
      c.fillStyle = entry.primary;
      c.globalAlpha = 0.35;
      c.fillRect(0, baseY - 56, width, 8);
    } else if (entry.family === "quake" || entry.id === "tank" || entry.id === "king") {
      c.fillStyle = entry.primary;
      for (let i = 0; i < 7; i += 1) {
        const h = 8 + Math.sin(t * 10 + i) * 6;
        c.fillRect(ex - 70 + i * 20, baseY - h, 14, h);
      }
    } else if (entry.family === "shadow" || entry.id === "the-mother" || entry.id === "claire") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 2;
      c.strokeRect(ex - 16, baseY - 70, 32, 70);
      c.beginPath();
      c.arc(ex, baseY - 80, 10, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 0.25 + Math.sin(t * 6) * 0.1;
      c.fillStyle = entry.secondary;
      c.fillRect(ex - 40, 10, 80, height - 40);
    } else if (entry.id === "pp-mara") {
      c.fillStyle = "#e84435";
      c.fillRect(ex - 24, baseY - 78, 48, 18);
      c.fillStyle = "#fff";
      c.font = "900 10px ui-sans-serif, system-ui, sans-serif";
      c.textAlign = "center";
      c.fillText("FAIL", ex, baseY - 66);
    } else if (entry.id === "noah") {
      c.fillStyle = "#1a2430";
      c.fillRect(ex - 36, baseY - 96, 72, 28);
      c.strokeStyle = entry.primary;
      c.strokeRect(ex - 36, baseY - 96, 72, 28);
      c.fillStyle = entry.primary;
      c.font = "800 9px ui-sans-serif, system-ui, sans-serif";
      c.textAlign = "center";
      c.fillText("WONTFIX", ex, baseY - 78);
    } else {
      c.strokeStyle = entry.primary;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(ex, baseY - 48, 22 + Math.sin(t * 7) * 4, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = entry.primary;
      c.globalAlpha = 0.35;
      c.beginPath();
      c.arc(ex, baseY - 48, 10, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // Tagline plate
    c.fillStyle = "rgba(0,0,0,0.55)";
    c.fillRect(8, 8, width - 16, 28);
    c.strokeStyle = entry.primary;
    c.strokeRect(8, 8, width - 16, 28);
    c.fillStyle = entry.primary;
    c.font = "900 13px ui-sans-serif, system-ui, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(entry.label.toUpperCase(), width / 2, 22);
  }

  let lastBuilderRiftalityPreviewId = "array_unset";
  const builderPreviewAttacks = [
    { id: "jab", label: "Jab", duration: 430 },
    { id: "cross", label: "Cross", duration: 500 },
    { id: "uppercut", label: "Uppercut", duration: 560 },
    { id: "lowKick", label: "Low Kick", duration: 540 },
    { id: "roundhouse", label: "Roundhouse", duration: 620 },
    { id: "special", label: "Rift Burst", duration: 720 },
  ];
  let builderPreviewMode = "idle";
  let builderPreviewAttackIndex = 0;
  let builderPreviewAttackStartedAt = 0;
  let builderPreviewRiftalityStartedAt = 0;
  let builderPreviewRiftalityId = "";
  let builderPreviewAnimationFrame = 0;

  function builderPreviewHint() {
    return query(".aaa-preview-action-hint");
  }

  function syncBuilderPreviewHint() {
    const hint = builderPreviewHint();
    if (!hint) return;
    if (builderPreviewMode === "attack") {
      const attack = builderPreviewAttacks[builderPreviewAttackIndex];
      hint.textContent = `${attack.label} · Press fighter for next attack`;
    } else if (builderPreviewMode === "victory") {
      const riftality = getBuilderRiftality(builderPreviewRiftalityId || customDraft?.riftalityId);
      hint.textContent = `${riftality.label} · Riftality preview`;
    } else {
      hint.textContent = "Idle stance";
    }
  }

  function stopBuilderPreviewAnimation() {
    if (builderPreviewAnimationFrame) cancelAnimationFrame(builderPreviewAnimationFrame);
    builderPreviewAnimationFrame = 0;
    builderPreviewAttackStartedAt = 0;
    builderPreviewRiftalityStartedAt = 0;
  }

  function ensureBuilderPreviewRival() {
    if (!builderPreviewRivalId || !characterById.has(builderPreviewRivalId) || builderPreviewRivalId === "custom") {
      builderPreviewRivalId = characterById.has(enemyCharacterId) && enemyCharacterId !== "custom"
        ? enemyCharacterId
        : chooseRivalId("custom");
    }
    return builderPreviewRivalId;
  }

  function playBuilderPreviewAttack(advance = false) {
    builderPreviewMode = "attack";
    ensureBuilderPreviewRival();
    if (advance) builderPreviewAttackIndex = (builderPreviewAttackIndex + 1) % builderPreviewAttacks.length;
    builderPreviewAttackStartedAt = performance.now();
    syncBuilderPreviewHint();
    if (!builderPreviewAnimationFrame) {
      builderPreviewAnimationFrame = requestAnimationFrame(() => {
        builderPreviewAnimationFrame = 0;
        renderBuilderPreview();
      });
    }
  }

  function playBuilderRiftalityPreview() {
    builderPreviewMode = "victory";
    ensureBuilderPreviewRival();
    builderPreviewRiftalityId = customDraft?.riftalityId || readBuilderDraft().riftalityId;
    builderPreviewRiftalityStartedAt = performance.now();
    builderPreviewAttackStartedAt = 0;
    syncBuilderPreviewHint();
    if (!builderPreviewAnimationFrame) {
      builderPreviewAnimationFrame = requestAnimationFrame(() => {
        builderPreviewAnimationFrame = 0;
        renderBuilderPreview();
      });
    }
  }

  function currentBuilderPreviewMotion() {
    if (builderPreviewMode === "victory") {
      const entry = getBuilderRiftality(builderPreviewRiftalityId || customDraft?.riftalityId);
      const elapsed = Math.max(0, performance.now() - builderPreviewRiftalityStartedAt);
      const duration = 3600;
      const progress = builderPreviewRiftalityStartedAt ? Math.min(1, elapsed / duration) : 1;
      return { type: "riftality", amount: progress, progress, active: progress < 1, label: entry.label, entry };
    }
    if (builderPreviewMode !== "attack") return { type: "idle", amount: 0, active: false, label: "Idle" };
    const attack = builderPreviewAttacks[builderPreviewAttackIndex];
    const elapsed = Math.max(0, performance.now() - builderPreviewAttackStartedAt);
    const progress = builderPreviewAttackStartedAt ? Math.min(1, elapsed / attack.duration) : 1;
    const amount = progress < 0.42 ? progress / 0.42 : Math.max(0, 1 - (progress - 0.42) / 0.58);
    return { type: attack.id, label: attack.label, amount, progress, active: progress < 1 };
  }

  function builderDraftFingerprint(draft) {
    const p = draft?.palette || {};
    return [
      draft?.name, draft?.body, draft?.hairStyle, draft?.facialHair, draft?.shirt, draft?.pants,
      draft?.faceExpression, draft?.faceMask, draft?.accessory, draft?.riftalityId,
      p.skin, p.hair, p.gloves, p.trunks, p.accent, p.boots, p.meter,
      draft?.economy?.equipped?.gloves, draft?.economy?.equipped?.boots, draft?.economy?.equipped?.core,
      draft?.economy?.equipped?.accessory, draft?.economy?.equipped?.shirt, previewGearId || "",
    ].join("|");
  }

  function applyPreviewGearOverlay(character) {
    if (!previewGearId || !character) return character;
    const item = gearItem(previewGearId);
    if (!item?.appearance) return character;
    return {
      ...character,
      shirt: item.appearance.shirt || character.shirt,
      accessory: item.appearance.accessory || character.accessory,
      economy: {
        ...character.economy,
        equipped: {
          ...(character.economy?.equipped || {}),
          ...(item.slot ? { [item.slot]: item.id } : {}),
        },
      },
    };
  }

  function renderBuilderPreview() {
    const previewCanvas = ui.builderPreviewCanvas || query("#builder-preview-canvas");
    const previewBox = ui.builderPreview || query("#builder-preview");
    const previewImg = ui.builderPreviewImg || query("#builder-preview-img");
    if (!previewCanvas) return;
    customDraft = readBuilderDraft();
    if (builderPreviewMode === "victory" && builderPreviewRiftalityId !== customDraft.riftalityId) {
      builderPreviewRiftalityId = customDraft.riftalityId;
      builderPreviewRiftalityStartedAt = performance.now();
    }
    const draftKey = builderDraftFingerprint(customDraft);
    if (draftKey !== cachedBuilderPreviewKey || !cachedBuilderPreviewCharacter) {
      cachedBuilderPreviewKey = draftKey;
      cachedBuilderPreviewCharacter = applyPreviewGearOverlay(createCustomCharacter(customDraft));
    }
    customCharacter = cachedBuilderPreviewCharacter;
    characterById.set("custom", customCharacter);
    const character = customCharacter;
    if (ui.builderStyle) ui.builderStyle.textContent = character.style;
    if (ui.builderPreviewName) ui.builderPreviewName.textContent = character.name;
    if (ui.builderPreviewMeta) {
      const riftality = getBuilderRiftality(customDraft.riftalityId);
      ui.builderPreviewMeta.textContent = `LV ${character.progression?.level || 1} · ${labelForValue(ui.builderBody, character.body)} / ${labelForValue(ui.builderShirt, character.shirt)} + ${labelForValue(ui.builderPants, character.pants)} · ${riftality.label}`;
    }
    const motion = currentBuilderPreviewMotion();
    drawFighterPreviewToCanvas(
      previewCanvas,
      character,
      previewBox,
      previewImg,
      { allowGraphic: false, canvasOnly: true, width: BUILDER_PREVIEW_W, height: BUILDER_PREVIEW_H, scaleBoost: 1.18, centerBody: true, motion },
    );
    syncBuilderPreviewHint();
    if (motion.active && !builderPreviewAnimationFrame) {
      builderPreviewAnimationFrame = requestAnimationFrame(() => {
        builderPreviewAnimationFrame = 0;
        if (!selectScreen?.hidden && selectMode === "create") renderBuilderPreview();
      });
    }
    if (customDraft.riftalityId !== lastBuilderRiftalityPreviewId) {
      lastBuilderRiftalityPreviewId = customDraft.riftalityId;
      renderRiftalityPreview(customDraft.riftalityId);
    }
  }

  function renderRosterPreview() {
    const character = getCharacter(selectedCharacterId);
    if (ui.rosterPreviewName) ui.rosterPreviewName.textContent = character.name;
    if (ui.rosterPreviewMeta) ui.rosterPreviewMeta.textContent = `${character.style} · ${character.finisher}`;
    const focus = isEditorFighterFocus();
    if (focus && selectScreenTitle) selectScreenTitle.textContent = character.name;
    if (focus) clearSelectMatchup();
    drawFighterPreviewToCanvas(
      ui.rosterPreviewCanvas,
      character,
      ui.rosterPreview,
      ui.rosterPreviewImg,
      focus
        ? { allowGraphic: true, canvasOnly: true, width: 360, height: 420, scaleBoost: 1.45, centerBody: true }
        : { allowGraphic: true, canvasOnly: true, centerBody: true, scaleBoost: 1.12 },
    );
  }

  function drawFighterPreviewGraphic(character, c, width, height) {
    const asset = fighterGraphicAsset(character.id);
    if (!asset) return false;
    const image = asset.keyedImage || asset.image;
    if (!image || !image.complete || !image.naturalWidth) return false;
    const source = fighterPreviewFrame(character, asset);
    if (!source?.w || !source?.h) return false;
    const baseDrawH = character.body === "heavy" ? height * 0.72 : character.body === "swift" ? height * 0.64 : height * 0.68;
    const drawH = asset.baseFrameH ? baseDrawH * (source.h / asset.baseFrameH) : baseDrawH;
    const drawW = drawH * (source.w / source.h);
    if (!Number.isFinite(drawW) || !Number.isFinite(drawH) || drawW <= 0 || drawH <= 0) return false;
    const x = (width - drawW) / 2;
    const y = height - drawH - 6;
    c.imageSmoothingEnabled = true;
    c.drawImage(image, source.x, source.y, source.w, source.h, x, y, drawW, drawH);
    return true;
  }

  function drawFighterPreviewToCanvas(canvas, character, previewEl, imgEl, options = {}) {
    if (!canvas) return;
    const prepared = preparePreviewCanvas(canvas, {
      width: options.width,
      height: options.height,
    });
    if (!prepared) return;
    const { ctx: c, width, height } = prepared;
    const p = character.palette;
    const allowGraphic = options.allowGraphic !== false;
    const scaleBoost = options.scaleBoost || 1;

    c.clearRect(0, 0, width, height);
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#08101a";
    c.fillRect(0, 0, width, height);
    c.fillStyle = "rgba(141, 230, 255, 0.08)";
    for (let x = 0; x < width; x += 14) c.fillRect(x, 0, 1, height);
    for (let y = 0; y < height; y += 14) c.fillRect(0, y, width, 1);
    const scale = Math.max(0.72, Math.min(width / 260, height / 190) * 1.08) * scaleBoost;
    const originX = width / 2;
    const originY = options.centerBody ? height / 2 + 78 * scale : height - 10;
    const shadowY = options.centerBody ? Math.min(height - 6, originY + 9 * scale) : height - 6;
    if (options.motion?.type === "riftality") {
      drawBuilderRiftalityViewport(c, width, height, character, options.motion, scale, originY);
    } else if (options.motion?.type && options.motion.type !== "idle" && options.motion.type !== "victory") {
      drawBuilderAttackViewport(c, width, height, character, options.motion, scale, originY);
    } else {
      c.fillStyle = "rgba(0, 0, 0, 0.48)";
      c.beginPath();
      c.ellipse(originX, shadowY, character.body === "heavy" ? width * 0.22 : width * 0.18, 4, 0, 0, Math.PI * 2);
      c.fill();

      c.save();
      c.translate(originX, originY);
      c.scale(scale, scale);
      drawPreviewBody(c, character, p, options.motion);
      c.restore();
    }

    if (options.motion?.type === "special" && options.motion.amount > 0.05) {
      c.save();
      c.globalAlpha = Math.min(0.9, options.motion.amount);
      c.strokeStyle = p.meter;
      c.lineWidth = 3;
      const radius = 24 + options.motion.amount * 42;
      c.beginPath();
      c.arc(originX, originY - 90 * scale, radius, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = p.accent;
      c.beginPath();
      c.arc(originX, originY - 90 * scale, radius * 0.62, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    const usedGraphic = allowGraphic && drawFighterPreviewGraphic(character, c, width, height);
    syncPreviewDisplay(canvas, imgEl, previewEl, usedGraphic, options.canvasOnly === true);

    const pendingAsset = generatedAssets.fighters.get(character.id);
    if (pendingAsset && !pendingAsset.ready && !pendingAsset.failed && pendingAsset.image) {
      pendingAsset.image.addEventListener("load", () => {
        if (selectScreen?.hidden) return;
        if (character.id === "custom" && selectMode === "create") renderBuilderPreview();
        else if (character.id === selectedCharacterId) renderRosterPreview();
      }, { once: true });
    }
  }

  function drawBuilderAttackViewport(c, width, height, character, motion, scale, originY) {
    const progress = motion.progress || 0;
    const impact = clamp((progress - 0.32) / 0.22, 0, 1);
    const recover = clamp((progress - 0.62) / 0.38, 0, 1);
    const attackerX = width * 0.32 + Math.sin(Math.min(1, progress / 0.45) * Math.PI) * width * 0.055;
    const defenderX = width * 0.72 + impact * width * 0.035;
    const previewScale = scale * 0.72;
    const rival = getCharacter(ensureBuilderPreviewRival());

    c.fillStyle = "rgba(3, 10, 17, 0.74)";
    c.fillRect(6, 6, width - 12, 18);
    c.fillStyle = character.palette.meter;
    c.fillRect(12, 11, Math.max(10, width * 0.34), 5);
    c.fillStyle = rival.palette?.meter || "#ef4b4b";
    c.fillRect(width - 12 - Math.max(8, width * (0.34 - impact * 0.12)), 11, Math.max(8, width * (0.34 - impact * 0.12)), 5);
    c.fillStyle = "rgba(0, 0, 0, 0.5)";
    c.beginPath();
    c.ellipse(attackerX, height - 8, width * 0.105, 4, 0, 0, Math.PI * 2);
    c.ellipse(defenderX, height - 8, width * 0.105, 4, 0, 0, Math.PI * 2);
    c.fill();

    c.save();
    c.translate(attackerX, originY);
    c.scale(previewScale, previewScale);
    drawPreviewBody(c, character, character.palette, motion);
    c.restore();

    c.save();
    c.translate(defenderX, originY - (motion.type === "uppercut" ? impact * 24 : 0));
    c.rotate(impact * 0.18 * (1 - recover));
    c.scale(-previewScale, previewScale);
    drawPreviewBody(c, rival, rival.palette, { type: "hurt", amount: impact * (1 - recover) });
    c.restore();

    if (motion.type === "special") {
      const travel = clamp((progress - 0.18) / 0.48, 0, 1);
      const orbX = attackerX + 26 + (defenderX - attackerX - 28) * travel;
      c.save();
      c.globalCompositeOperation = "lighter";
      c.fillStyle = character.palette.meter;
      c.beginPath();
      c.arc(orbX, height * 0.48, 7 + travel * 5, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = character.palette.accent;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(attackerX + 18, height * 0.48);
      c.lineTo(orbX, height * 0.48);
      c.stroke();
      c.restore();
    }

    if (impact > 0 && recover < 0.9) {
      c.save();
      c.globalCompositeOperation = "lighter";
      c.fillStyle = character.palette.accent;
      for (let i = 0; i < 9; i += 1) {
        const angle = (i / 9) * Math.PI * 2;
        const radius = 8 + impact * 24;
        c.fillRect(defenderX + Math.cos(angle) * radius - 2, height * 0.48 + Math.sin(angle) * radius - 2, 4, 4);
      }
      c.restore();
    }

    c.fillStyle = "rgba(2, 8, 14, 0.82)";
    c.fillRect(6, height - 22, width - 12, 16);
    c.fillStyle = impact > 0.15 ? "#f8dd94" : character.palette.meter;
    c.font = "900 8px Arial";
    c.textAlign = "center";
    c.fillText(impact > 0.15 ? `${motion.label.toUpperCase()} · HIT` : `${motion.label.toUpperCase()} · ENGAGE`, width / 2, height - 11);
  }

  function drawBuilderRiftalityViewport(c, width, height, character, motion, scale, originY) {
    const entry = motion.entry || getBuilderRiftality(customDraft?.riftalityId);
    const progress = motion.progress || 0;
    const impact = clamp((progress - 0.2) / 0.28, 0, 1);
    const finish = clamp((progress - 0.5) / 0.32, 0, 1);
    const aftermath = clamp((progress - 0.78) / 0.22, 0, 1);
    const strikePulse = Math.sin(Math.min(1, impact) * Math.PI);
    const previewScale = scale * 0.78;
    const playerX = width * 0.28 + impact * width * 0.16;
    const enemyX = width * 0.72 - impact * width * 0.04;
    const enemyCharacter = getCharacter(ensureBuilderPreviewRival());
    const aerialFinish = entry.id === "plot-pulse-theam" || entry.id === "dragon";
    const quakeFinish = entry.id === "king" || entry.id === "bigfoot" || entry.id === "jake";
    const enemyLift = aerialFinish ? finish * height * 0.46 : quakeFinish ? Math.sin(finish * Math.PI) * height * 0.16 : 0;

    c.fillStyle = "rgba(0, 0, 0, 0.55)";
    c.beginPath();
    c.ellipse(playerX, height - 8, width * 0.12, 4, 0, 0, Math.PI * 2);
    c.ellipse(enemyX, height - 8, width * 0.12, 4, 0, 0, Math.PI * 2);
    c.fill();

    c.save();
    c.globalAlpha = 1 - aftermath * 0.2;
    c.translate(playerX, originY);
    c.scale(previewScale, previewScale);
    drawPreviewBody(c, character, character.palette, { type: "special", amount: strikePulse });
    c.restore();

    c.save();
    c.globalAlpha = 1 - aftermath * 0.82;
    c.translate(enemyX, originY - enemyLift);
    c.rotate(aerialFinish ? finish * 0.25 : finish * 0.92);
    c.scale(previewScale * (1 - finish * 0.08), previewScale * (1 - finish * 0.08));
    drawPreviewBody(c, enemyCharacter, enemyCharacter.palette, { type: "idle", amount: 0 });
    c.restore();

    c.save();
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = Math.max(0, finish * (1 - aftermath * 0.55));
    if (entry.family === "beam") {
      const beamY = height * 0.43;
      c.fillStyle = entry.primary;
      c.fillRect(playerX + 18, beamY - 5, Math.max(0, enemyX - playerX + 20), 10 + finish * 12);
      c.fillStyle = entry.secondary;
      c.fillRect(playerX + 18, beamY, Math.max(0, enemyX - playerX + 20), 4);
    } else if (entry.family === "quake") {
      c.fillStyle = entry.primary;
      for (let i = 0; i < 8; i += 1) {
        const shardH = 8 + finish * (18 + (i % 3) * 11);
        c.fillRect(enemyX - 58 + i * 16, height - 12 - shardH, 9, shardH);
      }
    } else if (entry.family === "shadow") {
      c.fillStyle = entry.secondary;
      c.globalAlpha *= 0.65;
      c.fillRect(enemyX - 46, 18, 92, height - 28);
      c.strokeStyle = entry.primary;
      c.lineWidth = 3;
      c.strokeRect(enemyX - 38, 25, 76, height - 45);
    } else if (entry.family === "bone") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 4;
      for (let i = 0; i < 5; i += 1) {
        c.beginPath();
        c.moveTo(enemyX - 42 + i * 20, height - 16);
        c.lineTo(enemyX - 30 + i * 15, height * 0.34 - finish * 18);
        c.stroke();
      }
    } else if (entry.family === "rift") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 5;
      c.beginPath();
      c.ellipse(enemyX, height * 0.48, 14 + finish * 38, 46 + finish * 20, 0, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = entry.secondary;
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(enemyX, height * 0.48, 7 + finish * 22, 36 + finish * 12, 0, 0, Math.PI * 2);
      c.stroke();
    } else {
      c.fillStyle = entry.primary;
      for (let i = 0; i < 10; i += 1) {
        const angle = (i / 10) * Math.PI * 2;
        const radius = 18 + finish * 62;
        c.fillRect(enemyX + Math.cos(angle) * radius - 3, height * 0.46 + Math.sin(angle) * radius - 3, 7, 7);
      }
    }
    c.restore();

    drawBuilderRiftalitySignature(c, width, height, entry, progress, playerX, enemyX, originY);

  }

  function drawBuilderRiftalitySignature(c, width, height, entry, progress, playerX, enemyX, originY) {
    const charge = clamp(progress / 0.3, 0, 1);
    const impact = clamp((progress - 0.28) / 0.34, 0, 1);
    const finish = clamp((progress - 0.62) / 0.3, 0, 1);
    const pulse = 0.55 + Math.sin(progress * Math.PI * 18) * 0.28;
    const id = entry.id;
    c.save();
    c.globalCompositeOperation = "lighter";
    c.lineCap = "square";

    if (id === "tank") {
      c.fillStyle = "#303945";
      c.fillRect(playerX - 38, originY - 35, 76, 30);
      c.fillStyle = entry.primary;
      c.fillRect(playerX - 15, originY - 48, 45, 15);
      c.fillRect(playerX + 24, originY - 42, Math.max(5, enemyX - playerX - 28), 7);
      if (impact > 0.3) drawPreviewBlast(c, enemyX, height * 0.47, 16 + finish * 48, entry.primary, entry.secondary);
    } else if (id === "marauder") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 3;
      for (let i = 0; i < 5; i += 1) {
        const shot = clamp((impact * 6) - i, 0, 1);
        if (!shot) continue;
        c.beginPath();
        c.moveTo(playerX + 16, height * 0.48 + i * 4);
        c.lineTo(enemyX, height * 0.38 + i * 12);
        c.stroke();
      }
    } else if (id === "pp-mara") {
      c.font = "900 10px Arial";
      c.textAlign = "center";
      for (let i = 0; i < 4; i += 1) {
        if (impact < i * 0.18) continue;
        c.fillStyle = i % 2 ? entry.primary : "#ff4455";
        c.fillText(i % 2 ? "CLEAR" : "FAIL", enemyX + (i % 2 ? 22 : -22), 32 + i * 22);
      }
    } else if (id === "noah") {
      c.font = "800 8px Arial";
      c.textAlign = "center";
      for (let i = 0; i < 5; i += 1) {
        if (impact < i * 0.15) continue;
        c.fillStyle = i % 2 ? entry.secondary : entry.primary;
        c.fillRect(enemyX - 42 + (i % 2) * 30, 30 + i * 18, 54, 13);
        c.fillStyle = "#fff";
        c.fillText(i % 2 ? "BUG" : "WON'T FIX", enemyX - 15 + (i % 2) * 30, 40 + i * 18);
      }
    } else if (id === "claire") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 2;
      for (let i = 0; i < 6; i += 1) {
        const spread = i * 7 * impact;
        c.strokeRect(enemyX - 24 - spread, height * 0.26 - spread, 48 + spread * 2, 92 + spread * 2);
      }
    } else if (id === "eli-dev") {
      c.font = "800 8px monospace";
      for (let i = 0; i < 8; i += 1) {
        c.fillStyle = i % 2 ? entry.primary : entry.secondary;
        c.fillText(i % 2 ? "STACK" : "CRASH", enemyX - 28 + (i % 3) * 20, 22 + ((i * 17 + impact * 70) % (height - 40)));
      }
    } else if (id === "alex") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 3;
      c.strokeRect(enemyX - 44, 30, 88, height - 52);
      c.font = "900 9px Arial";
      c.fillStyle = entry.secondary;
      c.textAlign = "center";
      c.fillText(finish > 0.3 ? "CASE CLOSED" : "EVIDENCE", enemyX, 25);
    } else if (id === "king" || id === "bigfoot" || id === "jake" || id === "spar7an") {
      c.strokeStyle = entry.primary;
      c.lineWidth = id === "spar7an" ? 5 : 3;
      if (id === "spar7an") {
        c.beginPath();
        c.moveTo(playerX, height * 0.48);
        c.lineTo(enemyX + finish * 36, height * 0.42);
        c.stroke();
      } else {
        for (let i = 0; i < 4; i += 1) {
          c.beginPath();
          c.ellipse(enemyX, height - 10, 20 + impact * (i + 1) * 18, 5 + impact * i * 2, 0, 0, Math.PI * 2);
          c.stroke();
        }
        if (id === "jake") {
          c.fillStyle = entry.secondary;
          c.beginPath();
          c.arc(enemyX - 34 + impact * 68, height * 0.35, 7, 0, Math.PI * 2);
          c.fill();
        }
      }
    } else if (id === "sable") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 3;
      for (let i = 0; i < 5; i += 1) {
        const offset = (i - 2) * 11 * impact;
        c.globalAlpha = 0.22 + i * 0.12;
        c.strokeRect(enemyX - 28 + offset, height * 0.3, 56, 86);
        c.beginPath();
        c.moveTo(playerX + offset, height * 0.65);
        c.lineTo(enemyX + 34 + offset, height * 0.25);
        c.stroke();
      }
    } else if (id === "chrome") {
      c.strokeStyle = "#ff2f2f";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(playerX + 8, height * 0.35);
      c.lineTo(enemyX, height * 0.38);
      c.moveTo(playerX + 14, height * 0.37);
      c.lineTo(enemyX, height * 0.55);
      c.stroke();
      if (finish > 0.1) drawPreviewBlast(c, enemyX, height * 0.46, 16 + finish * 42, "#ff2f2f", entry.secondary);
    } else if (id === "control") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 3;
      for (let i = 0; i < 5; i += 1) {
        c.beginPath();
        c.arc(enemyX, height * 0.48, 14 + impact * i * 16, 0, Math.PI * 2);
        c.stroke();
      }
      c.font = "900 13px Arial";
      c.fillStyle = entry.secondary;
      c.fillText("♪", enemyX + 38, height * 0.28);
    } else if (id === "grit" || id === "anthony-e1-soldier") {
      const bombY = -14 + impact * height * 0.62;
      c.fillStyle = id === "grit" ? "#8899a8" : "#d9c477";
      c.fillRect(enemyX - 5, bombY, 10, 24);
      if (finish > 0.08) drawPreviewBlast(c, enemyX, height * 0.62, 24 + finish * width * 0.38, entry.primary, entry.secondary);
    } else if (id === "plot-pulse-theam") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(enemyX, 25, 54, 14, 0, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = `rgba(95,246,255,${0.18 + impact * 0.35})`;
      c.beginPath();
      c.moveTo(enemyX - 38, 34);
      c.lineTo(enemyX + 38, 34);
      c.lineTo(enemyX + 16, originY);
      c.lineTo(enemyX - 16, originY);
      c.fill();
    } else if (id === "dragon") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 5;
      c.beginPath();
      c.arc(enemyX, 42, 28 + charge * 10, Math.PI * 0.1, Math.PI * 1.9);
      c.stroke();
      c.fillStyle = entry.secondary;
      c.fillRect(enemyX - 8, 34, 16, 9);
    } else if (id === "dragon-born") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(playerX + 14, height * 0.38);
      for (let i = 1; i < 7; i += 1) c.lineTo(playerX + (enemyX - playerX) * i / 7, height * 0.38 + (i % 2 ? -15 : 15));
      c.lineTo(enemyX, height * 0.36);
      c.stroke();
    } else if (id === "bone" || id === "wendigo" || id === "ice-golem") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 4;
      if (id === "bone") {
        c.beginPath();
        c.arc(enemyX + finish * 32, height * 0.28 - finish * 18, 11, 0, Math.PI * 2);
        c.stroke();
      } else {
        for (let i = 0; i < 6; i += 1) {
          c.beginPath();
          c.moveTo(enemyX - 38 + i * 15, height - 12);
          c.lineTo(enemyX - 24 + i * 10, height * 0.28 - impact * 20);
          c.stroke();
        }
      }
    } else if (id === "ninja") {
      c.strokeStyle = entry.primary;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(playerX - 10, height * 0.7);
      c.lineTo(enemyX + 28, height * 0.24);
      c.stroke();
      if (finish > 0.25) {
        c.strokeStyle = entry.secondary;
        c.beginPath();
        c.moveTo(enemyX - 35, height * 0.35);
        c.lineTo(enemyX + 35, height * 0.58);
        c.stroke();
      }
    } else if (id === "lazy") {
      c.fillStyle = entry.primary;
      c.fillRect(playerX + 12, height * 0.35, 34, 22);
      c.fillStyle = "#111";
      c.fillRect(playerX + 18, height * 0.39, 8, 4);
      c.fillRect(playerX + 32, height * 0.38, 5, 5);
    } else if (id === "the-mother") {
      c.fillStyle = `rgba(20,5,30,${0.25 + impact * 0.65})`;
      c.fillRect(enemyX - 52, 12, 104, height - 20);
      c.strokeStyle = entry.primary;
      c.lineWidth = 2;
      c.strokeRect(enemyX - 44, 20, 88, height - 36);
    } else if (id === "jenny-night-signal") {
      c.globalAlpha = 0.3 + impact * 0.4;
      for (let i = 0; i < 4; i += 1) {
        c.strokeStyle = i % 2 ? entry.primary : entry.secondary;
        c.strokeRect(enemyX - 30 + i * 5, 28 + i * 7, 60, 94);
      }
      c.font = "900 10px monospace";
      c.fillStyle = entry.primary;
      c.fillText("3:33", enemyX - 12, 22);
    } else {
      c.strokeStyle = entry.primary;
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(enemyX, height * 0.48, 16 + impact * 38, 46 + impact * 18, 0, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = entry.secondary;
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(enemyX, height * 0.48, 8 + impact * 20, 34 + impact * 12, 0, 0, Math.PI * 2);
      c.stroke();
    }

    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 0.86;
    c.fillStyle = "rgba(2, 8, 14, 0.82)";
    c.fillRect(6, height - 22, width - 12, 16);
    c.fillStyle = finish > 0.55 ? entry.secondary : entry.primary;
    c.font = "900 8px Arial";
    c.textAlign = "center";
    c.fillText(finish > 0.55 ? "RIFTALITY" : impact > 0.08 ? "IMPACT" : "CHARGE", width / 2, height - 11);
    c.restore();
  }

  function drawPreviewBlast(c, x, y, radius, primary, secondary) {
    c.save();
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = 0.72;
    c.fillStyle = primary;
    c.beginPath();
    c.arc(x, y, radius, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = secondary;
    c.beginPath();
    c.arc(x, y, radius * 0.46, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function previewRect(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawPreviewJohnClaws(c, ch, x, y, dir) {
    if (ch.id !== "john") return;
    c.save();
    c.lineJoin = "round";
    for (let i = 0; i < 4; i += 1) {
      const offset = (i - 1.5) * 7;
      c.fillStyle = "#101014";
      c.beginPath();
      c.moveTo(x - dir * 2, y + offset - 3);
      c.lineTo(x + dir * 29, y + offset - 8);
      c.lineTo(x + dir * 5, y + offset + 6);
      c.closePath();
      c.fill();
      c.fillStyle = "#f7f1e7";
      c.beginPath();
      c.moveTo(x, y + offset - 1);
      c.lineTo(x + dir * 25, y + offset - 6);
      c.lineTo(x + dir * 4, y + offset + 4);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(190, 18, 24, 0.74)";
      c.fillRect(Math.round(x + dir * 3), Math.round(y + offset + 2), Math.round(dir * 13), 3);
    }
    c.restore();
  }

  function drawSableSelectPreview(c, ch, p) {
    const sp = {
      ...p,
      skin: "#b88a68",
      skinDark: "#6b4333",
      hair: "#111018",
      accent: "#7e1f32",
      gloves: "#15151b",
      trunks: "#211822",
      trunksDark: "#09080d",
      boots: "#0d0d12",
      white: "#d8c1a3",
      meter: "#d33a54",
    };
    previewRect(c, -31, -49, 14, 45, sp.skin);
    previewRect(c, 14, -49, 14, 45, sp.skin);
    previewRect(c, -34, -6, 20, 12, sp.boots);
    previewRect(c, 11, -6, 20, 12, sp.boots);
    previewRect(c, -31, -74, 62, 12, sp.accent);
    previewRect(c, -27, -65, 54, 22, sp.trunksDark);
    previewRect(c, -7, -65, 14, 22, sp.meter);
    previewRect(c, -23, -61, 46, 5, sp.white);

    previewRect(c, -26, -119, 52, 53, sp.trunksDark);
    previewRect(c, -21, -111, 42, 15, sp.trunks);
    previewRect(c, -18, -91, 36, 10, sp.accent);
    previewRect(c, -6, -116, 12, 47, sp.white);
    previewRect(c, -30, -113, 16, 45, sp.meter);
    previewRect(c, -22, -105, 54, 9, sp.meter);
    previewRect(c, 5, -94, 25, 8, sp.white);
    previewRect(c, -48, -107, 16, 42, sp.trunks);
    previewRect(c, 32, -107, 16, 42, sp.trunks);
    previewRect(c, -52, -112, 22, 13, sp.meter);
    previewRect(c, 30, -112, 22, 13, sp.meter);

    previewRect(c, -55, -101, 24, 13, sp.skin);
    previewRect(c, -67, -97, 27, 28, sp.gloves);
    previewRect(c, -66, -102, 28, 8, sp.meter);
    previewRect(c, 31, -101, 24, 13, sp.skin);
    previewRect(c, 42, -97, 27, 28, sp.gloves);
    previewRect(c, 40, -102, 28, 8, sp.meter);

    previewRect(c, -21, -153, 42, 32, sp.skin);
    previewRect(c, -26, -166, 52, 18, sp.hair);
    previewRect(c, -31, -151, 15, 35, sp.hair);
    previewRect(c, 16, -152, 15, 29, sp.hair);
    previewRect(c, -23, -146, 46, 12, sp.accent);
    previewRect(c, 3, -150, 19, 16, sp.meter);
    previewRect(c, 8, -146, 12, 4, sp.white);
    previewRect(c, -12, -140, 6, 6, "#0b1018");
    previewRect(c, 7, -140, 6, 6, sp.meter);
    previewRect(c, -7, -130, 18, 4, sp.skinDark);
    previewRect(c, 15, -159, 9, 3, sp.white);
    previewRect(c, -27, -134, 9, 4, sp.meter);
  }

  function drawPreviewBody(c, ch, p, motion = null) {
    if (ch.id === "sable") {
      drawSableSelectPreview(c, ch, p);
      return;
    }
    const heavy = ch.body === "heavy";
    const swift = ch.body === "swift";
    const skeletal = ch.body === "skeletal";
    const legW = heavy ? 20 : swift || skeletal ? 12 : 16;
    const torsoW = heavy ? 58 : swift || skeletal ? 36 : 44;
    const torsoX = -torsoW / 2;
    const legColor = skeletal ? p.white : p.skin;

    const move = motion?.type || "idle";
    const amount = motion?.amount || 0;
    previewRect(c, -27, -48, legW, 43, legColor);
    if (move === "lowKick" || move === "roundhouse") {
      c.save();
      c.translate(10, -48);
      c.rotate((move === "roundhouse" ? -1.34 : -1.05) * amount);
      previewRect(c, 0, 0, legW, 43, legColor);
      previewRect(c, -2, 39, legW + 4, 10, p.white);
      previewBootRect(c, ch, p, -4, 47, legW + 10, 11, "R");
      c.restore();
    } else {
      previewRect(c, 10, -48, legW, 43, legColor);
    }
    previewRect(c, -29, -9, legW + 4, 10, p.white);
    previewBootRect(c, ch, p, -32, -1, legW + 10, 11, "L");
    if (move !== "lowKick" && move !== "roundhouse") {
      previewRect(c, 8, -9, legW + 4, 10, p.white);
      previewBootRect(c, ch, p, 6, -1, legW + 10, 11, "R");
    }
    if (ch.id === "custom" && ch.pants) drawPreviewCustomPantsMotion(c, ch, p, motion);
    else {
      previewRect(c, -27, -70, 55, 27, p.trunks);
      previewRect(c, 10, -70, 13, 27, p.trunksDark);
      previewRect(c, -29, -74, 58, 7, p.white);
      previewRect(c, -20, -75, 18, 8, "#c92d26");
    }

    if (ch.id === "dragon") {
      c.save();
      c.fillStyle = p.trunksDark || "#153c29";
      for (const side of [-1, 1]) {
        c.save();
        c.scale(side, 1);
        c.beginPath();
        c.moveTo(8, -115);
        c.lineTo(78, -171);
        c.lineTo(63, -103);
        c.lineTo(28, -78);
        c.closePath();
        c.fill();
        c.fillStyle = p.accent || "#2ba16a";
        c.beginPath();
        c.moveTo(15, -111);
        c.lineTo(66, -153);
        c.lineTo(53, -108);
        c.lineTo(29, -91);
        c.closePath();
        c.fill();
        c.restore();
      }
      c.restore();
    }

    previewRect(c, torsoX, -120, torsoW, 53, skeletal ? "#111111" : p.skin);
    previewRect(c, torsoX + 2, -108, torsoW - 4, 8, skeletal ? p.white : p.skinDark);
    // Sternum highlight is bare-skin only. Crops keep a short midriff strip.
    const shirt = ch.id === "custom" ? (ch.shirt || "tee") : "";
    const bareTorso = ch.id === "custom"
      ? shirt === "bare"
      : !ch.outfit || ch.outfit === "trunks" || ch.outfit === "shorts";
    const cropTop = shirt === "crop" || ch.outfit === "crop";
    if (bareTorso) {
      previewRect(c, -6, -118, 12, 47, skeletal ? p.white : "#e0a15f");
    } else if (cropTop) {
      previewRect(c, -6, -95, 12, 24, skeletal ? p.white : "#e0a15f");
    }
    drawPreviewOutfit(c, ch, p, torsoX, torsoW, 53);
    drawCoreEmblem(c, ch, p, 0, 0, (x, yy, w, h, color) => previewRect(c, x, yy, w, h, color));
    drawPreviewArms(c, ch, p, motion);
    drawPreviewHead(c, ch, p);
    drawCharacterAccessories(c, ch, p, 0, 0);
    if (ch.hairStyle === "spike") drawHairPartLayer(c, ch, p, "spike", 0, -160);
  }

  function drawPreviewOutfit(c, ch, p, torsoX, torsoW, torsoH) {
    const top = -120;
    if (ch.id === "custom" && ch.shirt && ch.pants) {
      drawCustomWardrobe((x, y, w, h, color) => previewRect(c, x, y, w, h, color), ch, p, 0, 0, torsoX, torsoW, torsoH, { drawPants: false, drawSleeves: false, ctx: c });
      return;
    }
    if (ch.id === "sable") {
      previewRect(c, torsoX - 4, top + 2, torsoW + 8, torsoH - 2, p.trunksDark);
      previewRect(c, torsoX + 3, top + 8, torsoW - 6, 16, p.trunks);
      previewRect(c, torsoX + 7, top + 27, torsoW - 14, 9, p.accent);
      previewRect(c, -6, top + 6, 12, torsoH - 8, p.white);
      previewRect(c, -24, top + 7, 13, 47, p.meter);
      previewRect(c, -18, top + 14, 46, 9, p.meter);
      previewRect(c, 5, top + 22, 22, 8, p.white);
      previewRect(c, -32, -74, 64, 9, p.accent);
      previewRect(c, -27, -65, 54, 20, p.trunksDark);
      previewRect(c, -44, top + 12, 12, 38, p.trunks);
      previewRect(c, 32, top + 12, 12, 38, p.trunks);
      previewRect(c, -49, top + 7, 17, 12, p.meter);
      previewRect(c, 32, top + 7, 17, 12, p.meter);
      return;
    }
    if (ch.id === "jenny-night-signal") {
      previewRect(c, torsoX - 5, top + 3, torsoW + 10, torsoH + 4, p.trunks);
      previewRect(c, torsoX - 8, top + 1, 14, torsoH + 7, p.trunksDark);
      previewRect(c, 12, top + 1, 14, torsoH + 7, p.trunksDark);
      previewRect(c, torsoX + 5, top + 10, torsoW - 10, 9, p.accent);
      previewRect(c, -8, top + 17, 16, 11, p.trunksDark);
      previewRect(c, -5, top + 20, 10, 3, p.meter);
      previewRect(c, -33, -73, 66, 8, p.white);
      previewRect(c, -27, -65, 54, 19, p.trunksDark);
      previewRect(c, 29, -103, 10, 31, "#1d2128");
      previewRect(c, 33, -99, 4, 19, p.meter);
      previewRect(c, -32, -109, 8, 7, p.white);
      previewRect(c, 24, -111, 8, 7, p.white);
      return;
    }
    if (ch.id === "lazy") {
      previewRect(c, torsoX - 4, top + 3, torsoW + 8, torsoH - 2, p.trunks);
      previewRect(c, torsoX + 4, top + 9, torsoW - 8, 12, p.accent);
      previewRect(c, torsoX + 8, top + 27, torsoW - 16, 8, p.meter);
      previewRect(c, -29, -74, 58, 9, p.white);
      previewRect(c, -25, -64, 50, 20, p.trunksDark);
      previewRect(c, -42, top + 8, 13, 42, p.accent);
      previewRect(c, 29, top + 8, 13, 42, p.accent);
      previewRect(c, -52, -107, 5, 44, p.white);
      previewRect(c, 48, -107, 5, 44, p.white);
      previewRect(c, -18, top + 14, 5, 5, p.white);
      previewRect(c, 13, top + 14, 5, 5, p.white);
      previewRect(c, -4, top + 34, 8, 8, p.white);
      return;
    }
    if (ch.id === "ninja") {
      previewRect(c, torsoX - 6, top, torsoW + 12, torsoH + 38, p.trunks);
      previewRect(c, torsoX - 2, top + 4, 10, torsoH + 40, p.accent);
      previewRect(c, 10, top + 4, 10, torsoH + 40, p.accent);
      previewRect(c, -31, -75, 62, 8, p.white);
      previewRect(c, -26, -66, 52, 18, p.trunksDark);
      previewRect(c, 35, -111, 7, 74, "#d8d0bd");
      previewRect(c, 37, -112, 3, 62, p.meter);
      previewRect(c, 31, -50, 14, 8, p.accent);
      return;
    }
    if (ch.id === "control") {
      previewRect(c, torsoX - 6, top + 2, torsoW + 12, torsoH - 4, p.trunksDark);
      previewRect(c, torsoX + 4, top + 9, torsoW - 8, 12, p.accent);
      previewRect(c, torsoX + 8, top + 25, torsoW - 16, 8, p.meter);
      previewRect(c, -5, top + 5, 10, torsoH - 8, p.white);
      previewRect(c, -31, -73, 62, 9, p.meter);
      previewRect(c, -25, -63, 50, 16, p.trunks);
      previewRect(c, -54, -108, 35, 46, "rgba(53, 242, 255, 0.86)");
      previewRect(c, -49, -103, 25, 36, p.trunksDark);
      previewRect(c, -47, -93, 21, 4, p.accent);
      previewRect(c, -47, -82, 21, 4, p.meter);
      previewRect(c, 32, -106, 28, 21, p.trunksDark);
      previewRect(c, 36, -101, 20, 5, p.meter);
      return;
    }
    if (ch.id === "spar7an") {
      previewRect(c, torsoX - 5, top + 1, torsoW + 10, torsoH - 5, p.hair);
      previewRect(c, torsoX, top + 6, torsoW, 10, p.white);
      previewRect(c, torsoX + 6, top + 19, torsoW - 12, 19, p.accent);
      previewRect(c, -6, top + 4, 12, torsoH - 7, p.white);
      previewRect(c, -34, -75, 68, 9, p.white);
      previewRect(c, -32, -66, 64, 22, p.trunks);
      previewRect(c, -44, top + 7, 13, 56, p.accent);
      previewRect(c, 31, top + 5, 13, 54, p.accent);
      previewRect(c, -52, -102, 31, 41, p.hair);
      previewRect(c, -47, -96, 21, 30, p.accent);
      previewRect(c, -42, -88, 11, 14, p.white);
      return;
    }
    if (ch.id === "anthony-e1") {
      previewRect(c, torsoX - 6, top + 1, torsoW + 12, torsoH + 3, p.trunks);
      previewRect(c, torsoX - 1, top + 7, torsoW + 2, 12, p.accent);
      previewRect(c, torsoX + 7, top + 26, torsoW - 14, 9, p.trunksDark);
      previewRect(c, -31, -74, 62, 10, p.trunksDark);
      previewRect(c, -29, -64, 58, 19, p.trunks);
      previewRect(c, -42, top + 8, 12, 44, p.accent);
      previewRect(c, 30, top + 8, 12, 44, p.accent);
      previewRect(c, -35, top + 13, 8, 8, p.trunksDark);
      previewRect(c, 27, top + 13, 8, 8, p.trunksDark);
      previewRect(c, torsoX + 4, top + 9, 8, 8, p.white);
      previewRect(c, torsoX + 6, top + 11, 4, 4, p.trunksDark);
      previewRect(c, torsoX + torsoW - 17, top + 9, 11, 5, "#1b2517");
      return;
    }
    if (ch.id === "jake") {
      previewRect(c, torsoX - 7, top + 3, torsoW + 14, torsoH - 3, p.trunks);
      previewRect(c, torsoX - 12, top + 8, 16, 16, p.accent);
      previewRect(c, torsoX + torsoW - 4, top + 8, 16, 16, p.accent);
      previewRect(c, torsoX + 5, top + 9, torsoW - 10, 11, p.white);
      previewRect(c, -11, top + 24, 22, 14, p.accent);
      previewRect(c, -7, top + 27, 14, 4, p.trunksDark);
      previewRect(c, -29, -74, 58, 9, p.white);
      previewRect(c, -27, -65, 54, 20, p.trunksDark);
      previewRect(c, -20, -60, 40, 5, p.accent);
      previewRect(c, 30, -102, 10, 34, p.white);
      previewRect(c, 33, -99, 4, 27, p.accent);
      return;
    }
    if (ch.id === "ice-golem") {
      previewRect(c, torsoX - 9, top - 4, torsoW + 18, torsoH + 4, p.skin);
      previewRect(c, torsoX - 2, top + 8, torsoW + 4, 12, p.white);
      previewRect(c, torsoX + 9, top + 27, torsoW - 18, 9, p.meter);
      previewRect(c, -31, -75, 62, 10, p.white);
      previewRect(c, -27, -65, 54, 20, p.trunksDark);
      previewRect(c, -44, top + 9, 14, 44, p.skinDark);
      previewRect(c, 30, top + 8, 14, 45, p.skinDark);
      previewRect(c, -37, top + 2, 12, 10, p.white);
      previewRect(c, 25, top + 1, 12, 10, p.white);
      return;
    }
    if (ch.id === "bigfoot") {
      previewRect(c, torsoX - 11, top - 1, torsoW + 22, torsoH + 10, p.hair);
      previewRect(c, torsoX - 3, top + 10, torsoW + 6, 16, p.skin);
      previewRect(c, torsoX + 7, top + 31, torsoW - 14, 8, p.accent);
      previewRect(c, -34, -76, 68, 9, p.trunksDark);
      previewRect(c, -31, -66, 62, 22, p.trunks);
      previewRect(c, -47, top + 5, 18, 50, p.hair);
      previewRect(c, 29, top + 5, 18, 50, p.hair);
      previewRect(c, -49, top + 47, 24, 11, p.gloves);
      previewRect(c, 25, top + 47, 24, 11, p.gloves);
      return;
    }
    if (ch.outfit === "jeans") {
      previewRect(c, torsoX + 5, top + 6, torsoW - 10, 17, p.accent);
      previewRect(c, -29, -70, 58, 8, "#6e4c27");
      previewRect(c, -24, -50, 8, 8, "#d48b67");
      return;
    }
    if (ch.outfit === "crop" || ch.outfit === "shorts") {
      previewRect(c, torsoX + 4, top + 8, torsoW - 8, 17, p.accent);
      previewRect(c, torsoX + 8, top + 31, torsoW - 16, 8, p.skin);
      if (ch.outfit === "shorts") previewRect(c, -29, -70, 58, 18, p.trunks);
      return;
    }
    if (ch.outfit === "arena") {
      previewRect(c, torsoX + 5, top + 6, torsoW - 10, torsoH - 8, p.accent);
      previewRect(c, torsoX + 8, top + 21, torsoW - 16, 6, p.skin);
      previewRect(c, -20, -68, 40, 16, p.accent);
      return;
    }
    if (ch.outfit === "armor") {
      previewRect(c, torsoX - 3, top + 3, torsoW + 6, torsoH - 6, p.accent);
      previewRect(c, torsoX + 5, top + 12, torsoW - 10, 9, "#6f7c85");
      previewRect(c, torsoX + 8, top + 31, torsoW - 16, 8, "#111821");
      previewRect(c, -31, -72, 62, 12, "#7d8a92");
      return;
    }
    if (ch.outfit === "tank") {
      previewRect(c, torsoX - 2, top + 2, torsoW + 4, 12, p.accent);
      previewRect(c, torsoX + 4, top + 10, torsoW - 8, torsoH - 10, p.accent);
      return;
    }
    if (ch.outfit === "gi") {
      previewRect(c, torsoX - 4, top, torsoW + 8, torsoH + 10, p.accent);
      previewRect(c, torsoX + 6, top + 4, 9, torsoH + 4, p.white);
      previewRect(c, -5, top + 10, 10, torsoH + 2, p.trunksDark);
      previewRect(c, -31, -74, 62, 8, p.trunksDark);
      return;
    }
    if (ch.outfit === "bones") {
      previewRect(c, -20, top + 7, 40, 8, p.white);
      previewRect(c, -15, top + 20, 30, 7, p.white);
      previewRect(c, -4, top + 8, 8, 42, p.white);
      return;
    }
    if (ch.outfit === "robe") {
      previewRect(c, torsoX - 6, top, torsoW + 12, torsoH + 38, p.trunks);
      previewRect(c, torsoX - 2, top + 4, 10, torsoH + 40, p.accent);
      previewRect(c, 10, top + 4, 10, torsoH + 40, p.accent);
      return;
    }
    if (ch.outfit === "fatigues") {
      previewRect(c, torsoX + 2, top + 4, torsoW - 4, torsoH - 4, p.accent);
      previewRect(c, torsoX + 8, top + 12, 9, 8, p.trunksDark);
      previewRect(c, torsoX + 24, top + 28, 11, 7, p.trunksDark);
    }
  }

  function wardrobeBodyFit(ch, torsoW = 44) {
    const body = ch?.body || "athlete";
    const heavy = body === "heavy";
    const narrow = body === "swift" || body === "skeletal";
    const lean = body === "lean";
    // Overhang past the skin torso so fabric sits over the shoulder joint.
    const shoulderOut = heavy ? 11 : narrow ? 6 : lean ? 7 : 8;
    const coverPad = heavy ? 5 : narrow ? 2 : lean ? 3 : 4;
    const sleeveW = heavy ? 15 : narrow ? 9 : 12;
    const shortSleeveH = heavy ? 20 : narrow ? 15 : 17;
    const longSleeveH = heavy ? 38 : narrow ? 30 : 34;
    const armhole = Math.max(2, Math.round(torsoW * (heavy ? 0.08 : narrow ? 0.11 : 0.1)));
    const yokeH = heavy ? 14 : narrow ? 10 : 12;
    const hipPad = heavy ? 6 : narrow ? 3 : 4;
    return { body, heavy, narrow, lean, shoulderOut, coverPad, sleeveW, shortSleeveH, longSleeveH, armhole, yokeH, hipPad };
  }

  function drawPreviewCustomPantsMotion(c, ch, p, motion = null) {
    const heavy = ch.body === "heavy";
    const narrow = ch.body === "swift" || ch.body === "skeletal";
    const legW = heavy ? 20 : narrow ? 12 : 16;
    const torsoW = heavy ? 58 : narrow ? 36 : 44;
    const fit = wardrobeBodyFit(ch, torsoW);
    const pants = ch.pants || "trunks";
    if (pants === "shorts") {
      const hipPad = fit.hipPad;
      const hipLeft = Math.min(-27 - hipPad, -torsoW / 2 - hipPad);
      const hipRight = Math.max(10 + legW + hipPad, torsoW / 2 + hipPad);
      const hipW = hipRight - hipLeft;
      if (drawPantsPartLayer(c, ch, p, "shorts", hipLeft + hipW / 2, -57, hipW + 8, 34)) return;
    }
    const kick = motion?.type === "lowKick" || motion?.type === "roundhouse";
    const kickTurn = (motion?.type === "roundhouse" ? -1.34 : -1.05) * (motion?.amount || 0);
    const longPants = !["trunks", "shorts"].includes(pants);
    const legLength = longPants ? 58 : pants === "shorts" ? 22 : 20;
    const leftLegX = -27;
    const rightLegX = 10;
    const hipLeft = Math.min(leftLegX - fit.hipPad, -torsoW / 2 - fit.hipPad);
    const hipRight = Math.max(rightLegX + legW + fit.hipPad, torsoW / 2 + fit.hipPad);
    const hipWidth = hipRight - hipLeft;
    const primary = pants === "bones" ? "#111111" : pants === "gi" ? p.white : pants === "greaves" ? "#6f7c85" : p.trunks;
    const secondary = pants === "bones" ? "#111111" : pants === "gi" ? p.white : pants === "greaves" ? "#7d8a92" : p.trunksDark;

    previewRect(c, hipLeft, -74, hipWidth, 12, primary);
    previewRect(c, hipLeft, -75, hipWidth, 5, pants === "jeans" ? "#6e4c27" : pants === "gi" ? p.accent : p.white);

    const drawLeg = (right, rotated = false) => {
      const x = right ? 10 : -27;
      c.save();
      if (rotated) {
        c.translate(x, -48);
        c.rotate(kickTurn);
        c.translate(-x, 48);
      }
      previewRect(c, x, -64, legW, legLength, right ? secondary : primary);
      if (pants === "joggers" || pants === "leggings") {
        const stripeW = Math.max(2, Math.round(legW * 0.22));
        previewRect(c, right ? x : x + legW - stripeW, -61, stripeW, Math.max(15, legLength - 5), p.accent);
      } else if (pants === "cargos") {
        previewRect(c, x + 1, -49, Math.max(6, legW - 2), 12, p.accent);
      } else if (pants === "greaves") {
        previewRect(c, x + 1, -48, Math.max(5, legW - 2), 13, "#a7b3ba");
      } else if (pants === "bones") {
        const boneW = Math.max(3, Math.round(legW * 0.34));
        previewRect(c, x + Math.floor((legW - boneW) / 2), -55, boneW, Math.max(12, legLength - 10), p.white);
      } else if (pants === "shorts") {
        previewRect(c, x, -47, legW, 4, p.accent);
      }
      c.restore();
    };

    drawLeg(false, false);
    drawLeg(true, kick);
  }

  function drawCustomWardrobe(paint, ch, p, lean, y, torsoX, torsoW, torsoH, options = {}) {
    const partCtx = options.ctx || ctx;
    const top = -120 + y;
    const left = torsoX + lean;
    const pants = ch.pants || "trunks";
    const fit = wardrobeBodyFit(ch, torsoW);
    const { heavy, narrow, shoulderOut, coverPad, sleeveW, shortSleeveH, longSleeveH, armhole, yokeH, hipPad } = fit;
    const legW = heavy ? 20 : narrow ? 12 : 16;
    const leftLegX = -27 + lean;
    const rightLegX = 10 + lean;
    const legTop = -70 + y;
    const legBottom = -5 + y;
    const hipX = Math.min(leftLegX - hipPad, torsoX + lean - hipPad);
    const hipRight = Math.max(rightLegX + legW + hipPad, torsoX + lean + torsoW + hipPad);
    const hipW = hipRight - hipX;
    const shirtLeft = left - coverPad;
    const shirtW = torsoW + coverPad * 2;
    const shoulderLeft = left - shoulderOut;
    const shoulderW = torsoW + shoulderOut * 2;
    const paintLegs = (colorLeft, colorRight = colorLeft, inset = 0, topY = legTop, bottomY = legBottom) => {
      const width = Math.max(5, legW - inset * 2);
      paint(leftLegX + inset, topY, width, bottomY - topY, colorLeft);
      paint(rightLegX + inset, topY, width, bottomY - topY, colorRight);
    };
    const paintShoulderSleeves = (color, height, width = sleeveW) => {
      if (options.drawSleeves === false) return;
      paint(shoulderLeft - Math.max(2, Math.round(width * 0.15)), top + 6, width, height, color);
      paint(shoulderLeft + shoulderW - width + Math.max(2, Math.round(width * 0.15)), top + 6, width, height, color);
    };
    // Full-torso base panel used by most tops so skin never peeks at the ribs/shoulders.
    const paintFullTorso = (color, pad = coverPad, height = torsoH - 2, yOff = 1) => {
      paint(left - pad, top + yOff, torsoW + pad * 2, height, color);
    };

    if (options.drawPants !== false && pants === "jeans") {
      paint(hipX, -74 + y, hipW, 12, p.trunks);
      paintLegs(p.trunks, p.trunksDark, 0, -64 + y);
      paint(hipX, -75 + y, hipW, 7, "#6e4c27");
      paint(leftLegX + Math.max(2, legW - 7), -55 + y, 5, 7, p.accent);
      paint(rightLegX + 2, -55 + y, 5, 7, p.accent);
    } else if (options.drawPants !== false && pants === "shorts") {
      if (!drawPantsPartLayer(partCtx, ch, p, "shorts", hipX + hipW / 2, -57 + y, hipW + 8, 34)) {
        paint(hipX, -74 + y, hipW, 13, p.trunks);
        paint(leftLegX, -63 + y, legW, 19, p.trunks);
        paint(rightLegX, -63 + y, legW, 19, p.trunksDark);
        paint(leftLegX, -47 + y, legW, 4, p.accent);
        paint(rightLegX, -47 + y, legW, 4, p.accent);
      }
    } else if (options.drawPants !== false && pants === "joggers") {
      paint(hipX, -74 + y, hipW, 12, p.trunksDark);
      paintLegs(p.trunks, p.trunks, narrow ? 0 : 1, -63 + y);
      const stripeW = Math.max(3, Math.round(legW * 0.24));
      paint(leftLegX + Math.max(1, legW - stripeW - 1), -38 + y, stripeW, 31, p.accent);
      paint(rightLegX + 1, -38 + y, stripeW, 31, p.accent);
    } else if (options.drawPants !== false && pants === "cargos") {
      paint(hipX, -74 + y, hipW, 11, p.trunksDark);
      paintLegs(p.trunks, p.trunks, 0, -64 + y);
      const pocketW = Math.max(7, legW - 3);
      paint(leftLegX - 1, -49 + y, pocketW, 14, p.accent);
      paint(rightLegX + legW - pocketW + 1, -49 + y, pocketW, 14, p.accent);
    } else if (options.drawPants !== false && pants === "leggings") {
      paint(hipX, -74 + y, hipW, 12, p.trunksDark);
      paintLegs(p.trunksDark, p.trunksDark, 0, -63 + y);
      const innerStripeW = Math.max(2, Math.round(legW * 0.2));
      paint(leftLegX + legW - innerStripeW, -63 + y, innerStripeW, 58, p.accent);
      paint(rightLegX, -63 + y, innerStripeW, 58, p.accent);
    } else if (options.drawPants !== false && pants === "greaves") {
      paint(hipX, -74 + y, hipW, 14, "#6f7c85");
      paintLegs(p.trunksDark, p.trunksDark, 0, -60 + y);
      paint(leftLegX + 1, -49 + y, Math.max(5, legW - 2), 11, "#9ca8b0");
      paint(rightLegX + 1, -49 + y, Math.max(5, legW - 2), 11, "#9ca8b0");
    } else if (options.drawPants !== false && pants === "gi") {
      paint(hipX, -74 + y, hipW, 9, p.trunksDark);
      paintLegs(p.white, p.white, 0, -65 + y);
      paint(hipX + Math.floor(hipW / 2) - 4, -68 + y, 8, 18, p.accent);
    } else if (options.drawPants !== false && pants === "bones") {
      paint(hipX, -74 + y, hipW, 12, "#111111");
      paintLegs("#111111", "#111111", 0, -62 + y);
      const boneW = Math.max(3, Math.round(legW * 0.36));
      paint(leftLegX + Math.floor((legW - boneW) / 2), -55 + y, boneW, 43, p.white);
      paint(rightLegX + Math.floor((legW - boneW) / 2), -55 + y, boneW, 43, p.white);
    } else if (options.drawPants !== false) {
      paint(hipX, -74 + y, hipW, 12, p.trunks);
      paint(leftLegX, -64 + y, legW, 20, p.trunks);
      paint(rightLegX, -64 + y, legW, 20, p.trunksDark);
      paint(hipX, -75 + y, hipW, 7, p.white);
    }

    const shirt = ch.shirt || "tee";
    if (shirt === "bare") return;
    if (shirt === "tee") {
      if (!drawShirtPartLayer(partCtx, ch, p, "tee", left + torsoW / 2, top + torsoH / 2, shoulderW, torsoH + 2)) {
        paintFullTorso(p.accent, coverPad, torsoH - 4, 2);
        paint(shoulderLeft, top + 2, shoulderW, yokeH, p.accent);
        paintShoulderSleeves(p.accent, shortSleeveH);
      }
    } else if (shirt === "tank") {
      // Solid tank: full torso fabric first so no sternum/skin peeks through the chest.
      paintFullTorso(p.accent, coverPad, torsoH - 2, 2);
      paint(shoulderLeft, top + 2, shoulderW, yokeH, p.accent);
    } else if (shirt === "crop") {
      paint(shoulderLeft, top + 3, shoulderW, yokeH, p.accent);
      paint(shirtLeft, top + 4, shirtW, Math.max(18, Math.round(torsoH * 0.48)), p.accent);
    } else if (shirt === "hoodie") {
      // Keep accent as the shirt color so Colors-tab stays stable across item swaps.
      paintFullTorso(p.accent, coverPad + 1, torsoH - 2, 1);
      paint(shoulderLeft, top + 1, shoulderW, yokeH + 2, p.accent);
      paint(left + Math.max(3, coverPad), top + 12, torsoW - Math.max(6, coverPad * 2), 7, p.trunks);
      paint(-Math.round(8 + coverPad) + lean, top + 4, Math.max(14, sleeveW + 2), 13, shadeHex(p.accent, 0.7));
      paint(-Math.round(9 + coverPad) + lean, top + 35, Math.max(16, sleeveW + 4), 11, shadeHex(p.accent, 0.7));
      paintShoulderSleeves(p.accent, longSleeveH, sleeveW + 1);
    } else if (shirt === "jacket") {
      if (!drawShirtPartLayer(partCtx, ch, p, "jacket", left + torsoW / 2, top + torsoH / 2, shoulderW + 8, torsoH + 6)) {
        paintFullTorso(shadeHex(p.accent, 0.62), coverPad + 1, torsoH - 2, 2);
        paint(shoulderLeft, top + 2, shoulderW, yokeH, shadeHex(p.accent, 0.62));
        paint(left + Math.max(2, coverPad - 1), top + 8, torsoW - Math.max(4, coverPad * 2 - 2), 13, p.accent);
        paint(-5 + lean, top + 5, 10, torsoH - 7, p.white);
        paintShoulderSleeves(shadeHex(p.accent, 0.62), longSleeveH, sleeveW + 1);
      }
    } else if (shirt === "arena") {
      paint(shoulderLeft, top + 2, shoulderW, yokeH, p.accent);
      paintFullTorso(p.accent, coverPad, torsoH - 6, 4);
      paint(-Math.round(torsoW * 0.45) + lean, -68 + y, Math.round(torsoW * 0.9), 16, p.accent);
    } else if (shirt === "armor") {
      paintFullTorso(p.accent, coverPad + 1, torsoH - 2, 1);
      paint(shoulderLeft, top + 1, shoulderW, yokeH + 1, p.accent);
      paint(left + Math.max(3, coverPad), top + 12, torsoW - Math.max(6, coverPad * 2), 9, shadeHex(p.accent, 0.78));
      paint(left + Math.max(5, coverPad + 2), top + 31, torsoW - Math.max(10, coverPad * 2 + 4), 8, shadeHex(p.accent, 0.35));
      paintShoulderSleeves(shadeHex(p.accent, 0.7), Math.round(longSleeveH * 0.72), sleeveW);
    } else if (shirt === "gi") {
      paintFullTorso(p.accent, coverPad + 2, torsoH + 8, 0);
      paint(shoulderLeft, top, shoulderW, yokeH + 2, p.accent);
      paint(left + Math.max(4, coverPad), top + 4, 9, torsoH + 2, p.white);
      paint(-5 + lean, top + 10, 10, torsoH, p.trunksDark);
      paintShoulderSleeves(p.accent, longSleeveH, sleeveW);
    } else if (shirt === "bones") {
      paintFullTorso(shadeHex(p.accent, 0.28), coverPad, torsoH - 2, 2);
      paint(shoulderLeft, top + 2, shoulderW, yokeH, shadeHex(p.accent, 0.28));
      paint(-Math.round(torsoW * 0.45) + lean, top + 7, Math.round(torsoW * 0.9), 8, p.white);
      paint(-Math.round(torsoW * 0.34) + lean, top + 20, Math.round(torsoW * 0.68), 7, p.white);
      paint(-4 + lean, top + 8, 8, 42, p.white);
      paintShoulderSleeves(shadeHex(p.accent, 0.28), Math.round(longSleeveH * 0.8), sleeveW);
    } else if (shirt === "robe") {
      paint(left - coverPad - 2, top, torsoW + (coverPad + 2) * 2, torsoH + 35, p.accent);
      paint(shoulderLeft, top, shoulderW, yokeH + 2, p.accent);
      paint(left - 2, top + 4, 10, torsoH + 35, p.trunks);
      paint(10 + lean, top + 4, 10, torsoH + 35, p.trunks);
      paintShoulderSleeves(p.accent, longSleeveH + 2, sleeveW + 1);
    } else if (shirt === "vest") {
      paintFullTorso(shadeHex(p.accent, 0.55), coverPad, torsoH - 2, 2);
      paint(shoulderLeft, top + 2, shoulderW, yokeH, shadeHex(p.accent, 0.55));
      paint(left + Math.max(4, coverPad), top + 8, Math.max(5, Math.round(torsoW * 0.18)), torsoH - 10, p.trunksDark);
      paint(left + torsoW - Math.max(4, coverPad) - Math.max(5, Math.round(torsoW * 0.18)), top + 8, Math.max(5, Math.round(torsoW * 0.18)), torsoH - 10, p.trunksDark);
      paint(left + Math.floor(torsoW / 2) - 2, top + 10, 4, torsoH - 14, p.meter || p.white);
    } else if (shirt === "polo") {
      paintFullTorso(p.accent, coverPad, torsoH - 4, 2);
      paint(shoulderLeft, top + 2, shoulderW, yokeH, p.accent);
      paint(left + Math.floor(torsoW / 2) - 4, top + 4, 8, 10, shadeHex(p.accent, 0.7));
      paint(left + Math.floor(torsoW / 2) - 2, top + 5, 4, 12, p.trunksDark);
      paintShoulderSleeves(p.accent, shortSleeveH);
    } else if (shirt === "strap") {
      paint(left + Math.max(2, coverPad - 1), top + 4, Math.max(6, Math.round(torsoW * 0.22)), torsoH - 6, p.accent);
      paint(left + torsoW - Math.max(2, coverPad - 1) - Math.max(6, Math.round(torsoW * 0.22)), top + 4, Math.max(6, Math.round(torsoW * 0.22)), torsoH - 6, p.accent);
      paint(shoulderLeft + 2, top + 8, shoulderW - 4, 5, shadeHex(p.accent, 0.75));
      paint(left + 2, top + Math.round(torsoH * 0.45), torsoW - 4, 5, shadeHex(p.accent, 0.75));
      paint(-Math.round(torsoW * 0.35) + lean, top + 10, Math.round(torsoW * 0.7), 4, p.meter || p.white);
    } else if (shirt === "sleeveless") {
      paintFullTorso(p.accent, Math.max(1, coverPad - 1), torsoH - 2, 2);
      paint(left + Math.max(3, coverPad), top + 2, Math.max(5, Math.round(torsoW * 0.16)), yokeH + 4, shadeHex(p.accent, 0.7));
      paint(left + torsoW - Math.max(3, coverPad) - Math.max(5, Math.round(torsoW * 0.16)), top + 2, Math.max(5, Math.round(torsoW * 0.16)), yokeH + 4, shadeHex(p.accent, 0.7));
      paint(shirtLeft, top + torsoH - 8, shirtW, 6, p.trunksDark);
    } else if (shirt === "cloak") {
      paint(left - coverPad - 4, top + 2, torsoW + (coverPad + 4) * 2, torsoH + 28, shadeHex(p.accent, 0.55));
      paint(shoulderLeft - 2, top, shoulderW + 4, yokeH + 3, shadeHex(p.accent, 0.55));
      paintFullTorso(p.accent, coverPad, Math.round(torsoH * 0.72), 4);
      paint(left + Math.floor(torsoW / 2) - 3, top + 6, 6, torsoH + 20, p.trunksDark);
      paintShoulderSleeves(shadeHex(p.accent, 0.55), Math.round(longSleeveH * 0.55), sleeveW + 2);
    }
  }

  function drawPreviewHead(c, ch, p) {
    if (ch.id === "sable") {
      previewRect(c, -20, -152, 40, 31, p.skin);
      previewRect(c, -24, -164, 48, 17, p.hair);
      previewRect(c, -28, -150, 14, 33, p.hair);
      previewRect(c, 14, -151, 14, 27, p.hair);
      previewRect(c, -21, -145, 42, 11, p.accent);
      previewRect(c, 4, -148, 17, 15, p.meter);
      previewRect(c, 8, -145, 12, 4, p.white);
      previewRect(c, -12, -140, 6, 6, "#0b1018");
      previewRect(c, 7, -140, 6, 6, p.meter);
      previewRect(c, -7, -130, 18, 4, p.skinDark);
      previewRect(c, 15, -158, 9, 3, p.white);
      previewRect(c, -26, -134, 8, 4, p.meter);
      return;
    }
    if (ch.id === "jenny-night-signal") {
      previewRect(c, -18, -151, 36, 29, p.skin);
      previewRect(c, -23, -164, 46, 16, p.hair);
      previewRect(c, -27, -153, 13, 33, p.hair);
      previewRect(c, 13, -155, 15, 24, p.hair);
      previewRect(c, -2, -168, 8, 31, p.meter);
      previewRect(c, -30, -145, 9, 16, p.trunksDark);
      previewRect(c, 21, -145, 9, 16, p.trunksDark);
      previewRect(c, -28, -138, 56, 4, p.white);
      previewRect(c, -10, -139, 5, 5, "#0b1018");
      previewRect(c, 6, -140, 8, 7, p.meter);
      previewRect(c, 8, -139, 4, 3, "#ffffff");
      previewRect(c, -8, -130, 21, 4, p.skinDark);
      previewRect(c, 17, -147, 16, 3, "#dfe8ef");
      previewRect(c, -18, -157, 11, 2, "#e6293f");
      return;
    }
    if (ch.id === "lazy") {
      previewRect(c, -24, -161, 48, 42, p.hair);
      previewRect(c, -19, -153, 38, 30, p.skin);
      previewRect(c, -26, -146, 10, 18, p.skin);
      previewRect(c, 16, -146, 10, 18, p.skin);
      previewRect(c, -14, -141, 7, 7, "#0b1018");
      previewRect(c, 7, -141, 7, 7, "#0b1018");
      previewRect(c, -5, -135, 10, 12, p.skinDark);
      previewRect(c, -13, -126, 26, 5, p.meter);
      previewRect(c, -18, -158, 4, 10, p.white);
      previewRect(c, -6, -162, 4, 12, p.white);
      previewRect(c, 8, -158, 4, 10, p.white);
      previewRect(c, 18, -151, 4, 12, p.white);
      return;
    }
    if (ch.id === "ninja") {
      previewRect(c, -22, -158, 44, 35, p.hair);
      previewRect(c, -19, -146, 38, 10, p.accent);
      previewRect(c, -18, -143, 36, 5, p.white);
      previewRect(c, -14, -134, 28, 9, p.skinDark);
      previewRect(c, 2, -141, 5, 5, "#0b1018");
      previewRect(c, 13, -141, 5, 5, "#0b1018");
      return;
    }
    if (ch.id === "jake") {
      previewRect(c, -18, -151, 36, 30, p.skin);
      previewRect(c, -22, -162, 44, 16, p.hair);
      previewRect(c, -21, -162, 42, 6, p.trunksDark);
      previewRect(c, -16, -159, 32, 5, p.accent);
      previewRect(c, -9, -140, 5, 5, "#0b1018");
      previewRect(c, 8, -140, 5, 5, "#0b1018");
      previewRect(c, -7, -130, 18, 4, p.skinDark);
      previewRect(c, 16, -147, 14, 4, p.white);
      return;
    }
    if (ch.id === "anthony-e1") {
      previewRect(c, -18, -151, 36, 30, p.skin);
      previewRect(c, -22, -161, 44, 12, p.hair);
      previewRect(c, -24, -164, 48, 8, p.trunks);
      previewRect(c, -18, -168, 36, 7, p.accent);
      previewRect(c, -9, -140, 5, 5, "#0b1018");
      previewRect(c, 8, -140, 5, 5, "#0b1018");
      previewRect(c, -7, -130, 18, 4, p.skinDark);
      previewRect(c, -23, -157, 46, 3, p.trunksDark);
      return;
    }
    if (ch.id === "dragon-born") {
      previewRect(c, -23, -157, 46, 35, p.skin);
      previewRect(c, 10, -145, 24, 18, p.skin);
      previewRect(c, 26, -139, 15, 9, p.skinDark);
      previewRect(c, -25, -166, 9, 22, p.hair);
      previewRect(c, 16, -166, 9, 22, p.hair);
      previewRect(c, -33, -174, 10, 19, p.white);
      previewRect(c, 23, -174, 10, 19, p.white);
      previewRect(c, 8, -145, 7, 7, p.meter);
      previewRect(c, 30, -136, 5, 4, "#07101d");
      previewRect(c, 21, -128, 17, 4, p.white);
      return;
    }
    if (ch.id === "plot-pulse-theam") {
      previewRect(c, -24, -158, 48, 38, p.skin);
      previewRect(c, -20, -166, 40, 12, p.skin);
      previewRect(c, -17, -146, 13, 11, "#07101d");
      previewRect(c, 5, -146, 13, 11, "#07101d");
      previewRect(c, -14, -143, 8, 5, p.meter);
      previewRect(c, 7, -143, 8, 5, p.meter);
      previewRect(c, -6, -127, 12, 3, p.skinDark);
      previewRect(c, -26, -151, 5, 17, p.accent);
      previewRect(c, 21, -151, 5, 17, p.accent);
      return;
    }
    if (ch.id === "control") {
      previewRect(c, -19, -151, 38, 29, p.skin);
      previewRect(c, -23, -162, 46, 18, p.hair);
      previewRect(c, -27, -148, 10, 24, p.trunksDark);
      previewRect(c, 17, -148, 10, 24, p.trunksDark);
      previewRect(c, -30, -143, 8, 18, p.meter);
      previewRect(c, 22, -143, 8, 18, p.meter);
      previewRect(c, -21, -154, 42, 5, p.accent);
      previewRect(c, -10, -139, 5, 5, "#0b1018");
      previewRect(c, 7, -139, 5, 5, "#0b1018");
      previewRect(c, -13, -130, 26, 4, p.skinDark);
      previewRect(c, 13, -166, 9, 7, p.meter);
      return;
    }
    if (ch.id === "spar7an") {
      previewRect(c, -23, -158, 46, 35, p.hair);
      previewRect(c, -18, -164, 36, 10, p.accent);
      previewRect(c, -8, -178, 16, 18, p.accent);
      previewRect(c, -15, -148, 30, 22, p.skin);
      previewRect(c, -20, -146, 40, 7, p.hair);
      previewRect(c, -4, -148, 8, 29, p.hair);
      previewRect(c, 3, -139, 5, 5, "#0b1018");
      previewRect(c, 13, -139, 5, 5, "#0b1018");
      previewRect(c, -4, -130, 20, 4, p.skinDark);
      return;
    }
    if (ch.id === "wendigo") {
      const antler = p.hair || "#6b5a48";
      previewRect(c, -19, -154, 38, 34, p.skin);
      previewRect(c, -14, -149, 28, 9, p.skinDark);
      previewRect(c, -10, -140, 6, 6, "#0b1018");
      previewRect(c, 8, -140, 6, 6, "#0b1018");
      previewRect(c, -9, -130, 22, 5, p.white);
      previewRect(c, -42, -177, 7, 34, antler);
      previewRect(c, 36, -177, 7, 34, antler);
      previewRect(c, -52, -176, 19, 6, antler);
      previewRect(c, 34, -176, 19, 6, antler);
      previewRect(c, -50, -162, 16, 6, antler);
      previewRect(c, 35, -162, 16, 6, antler);
      previewRect(c, -45, -191, 6, 18, antler);
      previewRect(c, 39, -191, 6, 18, antler);
      previewRect(c, -31, -159, 14, 8, p.white);
      previewRect(c, 17, -159, 14, 8, p.white);
      return;
    }
    if (ch.id === "ice-golem") {
      previewRect(c, -23, -158, 46, 36, p.skin);
      previewRect(c, -17, -171, 12, 20, p.white);
      previewRect(c, -3, -177, 12, 25, p.white);
      previewRect(c, 13, -168, 11, 18, p.white);
      previewRect(c, -19, -150, 38, 12, p.skinDark);
      previewRect(c, -10, -140, 6, 6, "#071824");
      previewRect(c, 8, -140, 6, 6, "#071824");
      previewRect(c, -13, -128, 28, 5, p.meter);
      previewRect(c, -28, -136, 9, 14, p.white);
      previewRect(c, 20, -135, 9, 14, p.white);
      return;
    }
    if (ch.id === "bigfoot") {
      previewRect(c, -25, -162, 50, 43, p.hair);
      previewRect(c, -18, -151, 36, 30, p.skin);
      previewRect(c, -30, -153, 13, 24, p.hair);
      previewRect(c, 17, -153, 13, 24, p.hair);
      previewRect(c, -14, -140, 7, 7, "#0b1018");
      previewRect(c, 7, -140, 7, 7, "#0b1018");
      previewRect(c, -8, -132, 20, 7, p.hair);
      previewRect(c, -13, -125, 28, 6, p.skinDark);
      previewRect(c, -21, -162, 42, 8, p.accent);
      return;
    }
    if (ch.faceExpression || ch.faceMask || ch.facialHair) {
      drawCompatiblePixelHead(ch, p, (x, y, w, h, color) => previewRect(c, x, y, w, h, color));
      return;
    }
    if (ch.hairStyle === "skull") {
      previewRect(c, -18, -154, 36, 34, p.hair);
      previewRect(c, -14, -126, 28, 10, p.hair);
      previewRect(c, 1, -140, 5, 5, "#b51f1f");
      previewRect(c, 12, -140, 5, 5, "#b51f1f");
      previewRect(c, -8, -130, 19, 4, "#0b1018");
      drawPreviewFaceAndMask(c, ch, p);
      return;
    }
    if (ch.hairStyle === "helmet") {
      previewRect(c, -20, -157, 40, 36, p.hair);
      previewRect(c, -16, -145, 32, 9, "#121820");
      previewRect(c, 1, -142, 21, 4, p.meter);
      drawPreviewFaceAndMask(c, ch, p);
      return;
    }

    previewRect(c, -16, -150, 32, 30, p.skin);
    previewRect(c, -18, -152, 36, 8, p.accent);
    if (ch.hairStyle === "ponytail" || ch.hairStyle === "sidepony") {
      previewRect(c, -19, -162, 38, 16, p.hair);
      previewRect(c, -32, -154, 15, 42, p.hair);
      previewRect(c, -38, -122, 11, 19, p.hair);
    } else if (ch.hairStyle === "long") {
      previewRect(c, -22, -162, 44, 18, p.hair);
      previewRect(c, -25, -148, 12, 48, p.hair);
      previewRect(c, 15, -148, 12, 42, p.hair);
    } else if (ch.hairStyle === "mohawk") {
      previewRect(c, -7, -170, 18, 29, p.hair);
      previewRect(c, -20, -154, 40, 10, p.hair);
    } else if (ch.hairStyle === "martial") {
      previewRect(c, -19, -160, 40, 15, p.hair);
      previewRect(c, 10, -158, 20, 8, p.hair);
    } else if (ch.hairStyle === "wild" || ch.hairStyle === "fluffy" || ch.hairStyle === "beard") {
      previewRect(c, -24, -164, 48, 18, p.hair);
      previewRect(c, -28, -156, 13, 16, p.hair);
      previewRect(c, 15, -158, 15, 16, p.hair);
    } else if (ch.hairStyle === "bob" || ch.hairStyle === "pixie") {
      previewRect(c, -22, -160, 42, 18, p.hair);
      previewRect(c, -24, -145, 11, 28, p.hair);
    } else {
      previewRect(c, -20, -160, 42, 15, p.hair);
      previewRect(c, 4, -164, 27, 12, p.hair);
    }
    if (ch.hairStyle === "beard") previewRect(c, -13, -130, 31, 15, p.hair);
    if (ch.outfit === "robe" || ch.outfit === "arena" || ch.shirt === "robe" || ch.shirt === "arena") previewRect(c, -17, -140, 37, 8, p.accent);
    previewRect(c, 2, -139, 5, 5, "#0b1018");
    previewRect(c, 14, -139, 5, 5, "#0b1018");
    previewRect(c, -3, -130, 20, 4, p.skinDark);
    drawPreviewFaceAndMask(c, ch, p);
  }

  function drawCompatiblePixelHead(ch, p, paint) {
    const hairStyle = ch.hairStyle === "beard" ? "crop" : ch.hairStyle || "crop";
    const expression = ch.faceExpression || "neutral";
    const mask = ch.faceMask || "none";
    const facialHair = mask === "none" ? ch.facialHair || "none" : "none";
    const eye = "#071018";
    const hair = p.hair || "#101828";
    const shadow = p.skinDark || shadeHex(p.skin, 0.72);

    // Rear hair always stays behind the shared 34 x 32 face box.
    if (hairStyle === "ponytail" || hairStyle === "sidepony") {
      paint(-28, -157, 12, 39, hair);
      paint(-34, -123, 10, 18, hair);
    } else if (hairStyle === "long") {
      paint(-24, -157, 10, 50, hair);
      paint(14, -157, 10, 50, hair);
    } else if (hairStyle === "bob") {
      paint(-23, -155, 10, 37, hair);
      paint(14, -155, 9, 34, hair);
    } else if (hairStyle === "wild" || hairStyle === "fluffy") {
      paint(-25, -158, 11, 31, hair);
      paint(14, -158, 11, 31, hair);
    }

    // One canonical face silhouette for every adjustable combination.
    paint(-17, -152, 34, 32, p.skin);
    paint(-20, -144, 4, 15, p.skin);
    paint(17, -144, 4, 15, p.skin);
    paint(-13, -122, 26, 4, shadow);

    if (hairStyle === "helmet") {
      paint(-22, -163, 44, 17, hair);
      paint(-22, -151, 7, 22, hair);
      paint(15, -151, 7, 22, hair);
      paint(-15, -158, 30, 5, p.accent);
      paint(-13, -151, 26, 4, "#121820");
    } else if (hairStyle === "skull") {
      // "Skull" is a close bone-pattern cap; it no longer replaces the face.
      paint(-18, -160, 36, 10, p.white || "#e8e3d7");
      paint(-14, -163, 9, 5, p.white || "#e8e3d7");
      paint(6, -163, 9, 5, p.white || "#e8e3d7");
      paint(-3, -159, 6, 5, hair);
    } else if (hairStyle === "mohawk") {
      paint(-6, -174, 12, 24, hair);
      paint(-17, -157, 34, 8, hair);
    } else if (hairStyle === "martial") {
      paint(-18, -160, 36, 11, hair);
      paint(8, -168, 13, 12, hair);
      paint(18, -164, 10, 7, hair);
    } else if (hairStyle === "wild") {
      paint(-22, -164, 44, 15, hair);
      paint(-18, -169, 12, 9, hair);
      paint(-2, -171, 13, 11, hair);
      paint(12, -166, 13, 10, hair);
    } else if (hairStyle === "fluffy") {
      paint(-23, -165, 46, 16, hair);
      paint(-17, -170, 14, 9, hair);
      paint(2, -171, 16, 10, hair);
    } else if (hairStyle === "long" || hairStyle === "bob" || hairStyle === "ponytail" || hairStyle === "sidepony") {
      paint(-20, -162, 40, 13, hair);
    } else if (hairStyle === "spike") {
      paint(-19, -160, 38, 11, hair);
      paint(-16, -166, 9, 9, hair);
      paint(-4, -170, 10, 13, hair);
      paint(9, -166, 10, 10, hair);
    } else {
      paint(-18, -158, 36, 9, hair);
      paint(8, -161, 12, 7, hair);
    }

    const browY = -144;
    const eyeY = -139;
    if (expression === "focused") {
      paint(-12, browY, 9, 3, hair);
      paint(4, browY, 9, 3, hair);
      paint(-10, eyeY, 5, 4, eye);
      paint(7, eyeY, 5, 4, eye);
    } else if (expression === "angry") {
      paint(-12, browY, 9, 3, hair);
      paint(5, browY, 9, 3, hair);
      paint(-9, eyeY, 5, 4, eye);
      paint(6, eyeY, 5, 4, eye);
    } else if (expression === "smirk") {
      paint(-10, eyeY, 5, 4, eye);
      paint(7, eyeY, 5, 3, eye);
    } else {
      paint(-10, eyeY, 5, 5, eye);
      paint(7, eyeY, 5, 5, eye);
    }
    paint(-2, -135, 5, 4, shadow);

    if (facialHair === "stubble") {
      paint(-11, -131, 22, 3, shadeHex(hair, 0.72));
      paint(-8, -126, 16, 3, shadeHex(hair, 0.72));
    } else if (facialHair === "goatee") {
      paint(-5, -131, 10, 4, hair);
      paint(-3, -127, 6, 8, hair);
    } else if (facialHair === "full") {
      paint(-12, -132, 8, 5, hair);
      paint(4, -132, 8, 5, hair);
      paint(-13, -128, 6, 7, hair);
      paint(7, -128, 6, 7, hair);
      paint(-9, -123, 18, 4, hair);
      paint(-5, -128, 10, 3, shadow);
    } else if (expression === "smirk") {
      paint(-5, -128, 13, 3, shadow);
      paint(5, -130, 4, 3, shadow);
    } else {
      paint(-6, -128, 12, 3, shadow);
    }

    // Masks own the lower-face layer, so beard and mouth geometry cannot collide.
    if (mask === "tactical") {
      paint(-15, -134, 30, 14, "#111820");
      paint(-12, -132, 24, 3, p.accent);
      paint(-7, -125, 14, 3, p.meter);
    } else if (mask === "oni") {
      paint(-16, -135, 32, 15, "#9e1f27");
      paint(-12, -133, 24, 4, "#d8b05a");
      paint(-10, -125, 5, 7, p.white || "#f7f4e6");
      paint(6, -125, 5, 7, p.white || "#f7f4e6");
      paint(-19, -134, 4, 8, "#d8b05a");
      paint(15, -134, 4, 8, "#d8b05a");
    } else if (mask === "skull") {
      paint(-15, -135, 30, 15, "#e8e3d7");
      paint(-3, -133, 6, 6, "#151820");
      for (let x = -10; x <= 8; x += 6) paint(x, -124, 3, 4, "#151820");
    }
  }

  function drawPreviewFaceAndMask(c, ch, p) {
    if (!ch.faceExpression && !ch.faceMask) return;
    const expression = ch.faceExpression || "neutral";
    const mask = ch.faceMask || "none";
    const eye = "#071018";
    const brow = p.hair || "#101828";
    const leftEyeX = -10;
    const rightEyeX = 7;

    if (ch.hairStyle === "helmet") {
      previewRect(c, -15, -145, 30, 12, p.skin);
    }

    if (expression === "focused") {
      previewRect(c, leftEyeX - 2, -143, 9, 3, brow);
      previewRect(c, rightEyeX, -143, 9, 3, brow);
      previewRect(c, leftEyeX, -139, 5, 4, eye);
      previewRect(c, rightEyeX + 2, -139, 5, 4, eye);
    } else if (expression === "angry") {
      c.fillStyle = brow;
      c.beginPath();
      c.moveTo(-14, -145);
      c.lineTo(-3, -141);
      c.lineTo(-4, -137);
      c.lineTo(-14, -141);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(14, -145);
      c.lineTo(3, -141);
      c.lineTo(4, -137);
      c.lineTo(14, -141);
      c.closePath();
      c.fill();
      previewRect(c, leftEyeX, -139, 5, 4, eye);
      previewRect(c, rightEyeX + 2, -139, 5, 4, eye);
    } else if (expression === "smirk") {
      previewRect(c, leftEyeX, -139, 5, 4, eye);
      previewRect(c, rightEyeX + 2, -139, 5, 3, eye);
      previewRect(c, -2, -130, 15, 3, p.skinDark);
      previewRect(c, 9, -133, 5, 3, p.skinDark);
    } else {
      previewRect(c, leftEyeX, -139, 5, 5, eye);
      previewRect(c, rightEyeX + 2, -139, 5, 5, eye);
    }

    const facialHair = ch.facialHair || "none";
    if (facialHair === "stubble") {
      previewRect(c, -10, -130, 24, 3, shadeHex(p.hair, 0.72));
      previewRect(c, -7, -126, 18, 3, shadeHex(p.hair, 0.72));
    } else if (facialHair === "goatee") {
      previewRect(c, -4, -131, 12, 5, p.hair);
      previewRect(c, -1, -126, 7, 10, p.hair);
    } else if (facialHair === "full") {
      previewRect(c, -14, -134, 30, 8, p.hair);
      previewRect(c, -11, -127, 25, 12, p.hair);
      previewRect(c, -6, -116, 15, 5, p.hair);
    }

    if (mask === "tactical") {
      previewRect(c, -16, -136, 32, 15, "#111820");
      previewRect(c, -13, -133, 26, 3, p.accent);
      previewRect(c, -8, -126, 16, 3, p.meter);
    } else if (mask === "oni") {
      previewRect(c, -18, -138, 36, 18, "#9e1f27");
      previewRect(c, -14, -134, 28, 5, "#d8b05a");
      previewRect(c, -11, -126, 5, 8, "#f7f4e6");
      previewRect(c, 7, -126, 5, 8, "#f7f4e6");
      previewRect(c, -21, -137, 6, 10, "#d8b05a");
      previewRect(c, 15, -137, 6, 10, "#d8b05a");
    } else if (mask === "skull") {
      previewRect(c, -17, -139, 34, 19, "#e8e3d7");
      previewRect(c, -12, -136, 7, 6, "#151820");
      previewRect(c, 6, -136, 7, 6, "#151820");
      previewRect(c, -3, -130, 6, 7, "#151820");
      for (let x = -12; x <= 8; x += 5) previewRect(c, x, -123, 3, 5, "#151820");
    }
  }

  function drawPreviewArms(c, ch, p, motion = null) {
    const armW = ch.body === "heavy" ? 22 : ch.body === "skeletal" ? 12 : 18;
    const armColor = ch.body === "skeletal" ? p.white : p.skin;
    const move = motion?.type || "idle";
    const amount = motion?.amount || 0;
    const leftTurn = move === "cross" ? Math.PI * 0.5 * amount : move === "victory" || move === "special" ? Math.PI * 0.82 * amount : 0;
    const rightTurn = move === "jab" ? -Math.PI * 0.5 * amount : move === "uppercut" ? Math.PI * amount : move === "victory" || move === "special" ? -Math.PI * 0.82 * amount : 0;

    c.save();
    c.translate(-18, -102);
    c.rotate(leftTurn);
    previewRect(c, -armW, 0, armW, 34, armColor);
    drawPreviewArmClothing(c, ch, p, armW, true);
    previewGloveRect(c, ch, p, -armW - 8, 26, 25, 24, "L");
    previewRect(c, -armW - 13, 21, 15, 6, p.white);
    c.restore();

    c.save();
    c.translate(18, -102);
    c.rotate(rightTurn);
    previewRect(c, 0, 0, armW - 1, 31, armColor);
    drawPreviewArmClothing(c, ch, p, armW - 1, false);
    previewGloveRect(c, ch, p, 7, 19, 25, 24, "R");
    previewRect(c, 7, 16, 16, 6, p.white);
    c.restore();
    if (ch.id === "spar7an") {
      previewRect(c, -55, -99, 33, 40, p.hair);
      previewRect(c, -49, -93, 21, 28, p.accent);
      previewRect(c, -42, -83, 8, 10, p.white);
    }
    if (ch.id === "control") {
      previewRect(c, -57, -111, 38, 50, "rgba(88, 240, 255, 0.88)");
      previewRect(c, -52, -106, 28, 40, p.trunksDark);
      previewRect(c, -49, -91, 22, 4, p.meter);
      previewRect(c, -41, -104, 4, 36, p.accent);
    }
    if (ch.id === "jenny-night-signal") {
      previewRect(c, -53, -119, 55, 39, "rgba(199, 247, 255, 0.22)");
      previewRect(c, -50, -116, 49, 5, p.meter);
      previewRect(c, -46, -105, 32, 3, p.white);
      previewRect(c, -46, -95, 39, 3, p.accent);
      previewRect(c, -43, -77, 11, 5, p.meter);
      previewRect(c, 35, -74, 9, 4, "#e6293f");
    }
    if (ch.id === "sable") {
      previewRect(c, -47, -80, 28, 26, p.gloves);
      previewRect(c, 24, -86, 28, 26, p.gloves);
      previewRect(c, -51, -86, 24, 8, p.meter);
      previewRect(c, 30, -92, 24, 8, p.meter);
      previewRect(c, -61, -69, 30, 5, p.white);
      previewRect(c, 43, -76, 30, 5, p.white);
      previewRect(c, -43, -74, 11, 18, p.accent);
      previewRect(c, 34, -80, 11, 18, p.accent);
    }
    if (ch.id === "john") {
      previewRect(c, -46, -79, 28, 26, p.gloves);
      previewRect(c, 24, -86, 28, 26, p.gloves);
      previewRect(c, -48, -82, 16, 8, p.skinDark);
      previewRect(c, 36, -88, 16, 8, p.skinDark);
      drawPreviewJohnClaws(c, ch, -45, -67, -1);
      drawPreviewJohnClaws(c, ch, 50, -74, 1);
    }
  }

  function drawPreviewArmClothing(c, ch, p, armW, left) {
    if (ch.id !== "custom") return;
    const shirt = ch.shirt || "tee";
    if (shirt === "bare" || shirt === "tank" || shirt === "crop" || shirt === "vest" || shirt === "strap" || shirt === "sleeveless") return;
    const fit = wardrobeBodyFit(ch);
    let color = p.accent;
    let length = fit.shortSleeveH + 2;
    if (shirt === "hoodie") {
      color = p.accent;
      length = fit.longSleeveH - 2;
    } else if (shirt === "jacket") {
      color = shadeHex(p.accent, 0.62);
      length = fit.longSleeveH - 2;
    } else if (shirt === "armor") {
      color = shadeHex(p.accent, 0.7);
      length = Math.round(fit.longSleeveH * 0.7);
    } else if (shirt === "gi") {
      color = p.accent;
      length = fit.longSleeveH - 4;
    } else if (shirt === "bones") {
      color = shadeHex(p.accent, 0.28);
      length = Math.round(fit.longSleeveH * 0.78);
    } else if (shirt === "robe") {
      color = p.accent;
      length = fit.longSleeveH;
    } else if (shirt === "arena" || shirt === "polo") {
      color = p.accent;
      length = fit.shortSleeveH;
    } else if (shirt === "cloak") {
      color = shadeHex(p.accent, 0.55);
      length = Math.round(fit.longSleeveH * 0.55);
    }
    // Extend a couple px past the arm width so fabric wraps the shoulder joint.
    const wrap = Math.max(2, Math.round(fit.shoulderOut * 0.35));
    const x = left ? -armW - wrap : -wrap;
    const w = armW + wrap * 2;
    previewRect(c, x, -1, w, length + 1, color);
    if (shirt === "jacket" || shirt === "armor" || shirt === "gi") {
      previewRect(c, x, Math.max(5, length - 7), w, 5, p.accent);
    }
  }

  function drawFightArmClothing(ch, p, lean, y, armW, isLeft) {
    if (ch.id !== "custom") return;
    const shirt = ch.shirt || "tee";
    if (shirt === "bare" || shirt === "tank" || shirt === "crop" || shirt === "vest" || shirt === "strap" || shirt === "sleeveless") return;
    const fit = wardrobeBodyFit(ch);
    let color = p.accent;
    let length = fit.shortSleeveH + 2;
    if (shirt === "hoodie") {
      color = p.accent;
      length = fit.longSleeveH - 2;
    } else if (shirt === "jacket") {
      color = shadeHex(p.accent, 0.62);
      length = fit.longSleeveH - 2;
    } else if (shirt === "armor") {
      color = shadeHex(p.accent, 0.7);
      length = Math.round(fit.longSleeveH * 0.7);
    } else if (shirt === "gi") {
      color = p.accent;
      length = fit.longSleeveH - 4;
    } else if (shirt === "bones") {
      color = shadeHex(p.accent, 0.28);
      length = Math.round(fit.longSleeveH * 0.78);
    } else if (shirt === "robe") {
      color = p.accent;
      length = fit.longSleeveH;
    } else if (shirt === "arena" || shirt === "polo") {
      color = p.accent;
      length = fit.shortSleeveH;
    } else if (shirt === "cloak") {
      color = shadeHex(p.accent, 0.55);
      length = Math.round(fit.longSleeveH * 0.55);
    }
    const wrap = Math.max(2, Math.round(fit.shoulderOut * 0.35));
    if (isLeft) {
      rect(-35 - wrap + lean, -103 + y, armW + wrap * 2, length + 1, color);
      if (shirt === "jacket" || shirt === "armor" || shirt === "gi") {
        rect(-35 - wrap + lean, -103 + y + Math.max(5, length - 7), armW + wrap * 2, 5, p.accent);
      }
    } else {
      rect(18 - wrap + lean, -103 + y, armW - 1 + wrap * 2, length + 1, color);
      if (shirt === "jacket" || shirt === "armor" || shirt === "gi") {
        rect(18 - wrap + lean, -103 + y + Math.max(5, length - 7), armW - 1 + wrap * 2, 5, p.accent);
      }
    }
  }

  function labelForSelect(select) {
    return select.options[select.selectedIndex] ? select.options[select.selectedIndex].textContent : "";
  }

  function labelForValue(select, value) {
    if (!select) return value;
    return [...select.options].find((option) => option.value === value)?.textContent || value;
  }

  function selectCharacter(characterId) {
    if (!characterById.has(characterId)) return;
    if (!ensureSelectPhase()) return;
    if (selectStep !== "fighter") return;
    selectMode = "roster";
    selectedCharacterId = characterId;
    writeLocalPreference(lastFighterStorageKey, characterId);
    // Rival locked at Start Fight via opponent reel — do not re-roll here.
    player = createFighter(true, selectedCharacterId);
    // keep existing enemyCharacterId for preview stability
    if (!characterById.has(enemyCharacterId) || enemyCharacterId === selectedCharacterId) {
      enemyCharacterId = chooseRivalId(selectedCharacterId);
    }
    enemy = createFighter(false, enemyCharacterId);
    warmCurrentMatchAssets();
    syncBuilderFromCharacter(characterId);
    applySelectLayout();
    renderRosterPreview();
    updateRosterSelection();
    updateHud();
    // Mobile: highlight only — user presses Continue/Choose Arena to proceed.
  }

  function selectArena(arenaId) {
    if (!ensureSelectPhase()) return;
    if (selectStep !== "arena") {
      goToArenaStep();
      if (selectStep !== "arena") return;
    }
    selectedArenaId = arenaId;
    writeLocalPreference(lastArenaStorageKey, arenaId);
    getArenaAsset(getArena(), true);
    renderArenaPicker();
    if (arenaId === "raven-hollow-relay") flashToast("Flash warning: strobe/glitch effects", 2600);
    else flashToast(`${getArena().name} arena`);
    // Mobile: highlight arena only — user presses Start Fight to begin.
  }

  function renderArenaPicker() {
    const picker = arenaPicker || query("#arena-picker");
    if (!picker) return;
    const shouldLoadImages = selectStep === "arena" && !arenaStepLayout?.hidden;
    picker.innerHTML = "";
    for (const arena of arenaCatalog) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `arena-card${arena.id === selectedArenaId ? " is-selected" : ""}`;
      button.dataset.arena = arena.id;
      const asset = getArenaAsset(arena, shouldLoadImages);
      if (asset?.ready) {
        const img = document.createElement("img");
        img.src = asset.src;
        img.alt = "";
        button.appendChild(img);
      }
      const label = document.createElement("span");
      label.textContent = arena.name;
      button.append(label);
      if (arena.id === "raven-hollow-relay") {
        button.setAttribute("aria-label", `${arena.name}. Flashing lights and stutter effects warning.`);
        const warning = document.createElement("small");
        warning.className = "arena-warning";
        warning.textContent = "Flash / seizure warning";
        button.append(warning);
      }
      if (arena.spaceFinisher) {
        const launchBadge = document.createElement("small");
        launchBadge.className = "arena-launch-badge";
        launchBadge.textContent = "Space uppercut";
        button.append(launchBadge);
      }
      if (arena.windowFinisher) {
        const winBadge = document.createElement("small");
        winBadge.className = "arena-launch-badge";
        winBadge.textContent = "Window uppercut";
        button.append(winBadge);
      }
      picker.appendChild(button);
    }
  }

  const arenaWalkState = {
    mode: "off",
    player: null,
    arena: null,
    distanceMeters: null,
  };

  function distanceInMeters(a, b) {
    const radians = (degrees) => (degrees * Math.PI) / 180;
    const earthRadius = 6371000;
    const latitudeDelta = radians(b.latitude - a.latitude);
    const longitudeDelta = radians(b.longitude - a.longitude);
    const latitudeA = radians(a.latitude);
    const latitudeB = radians(b.latitude);
    const haversine = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  function createNearbyTestArena(playerLocation) {
    return {
      id: "signal-point-alpha",
      name: "Signal Point Alpha",
      latitude: playerLocation.latitude + 0.00055,
      longitude: playerLocation.longitude + 0.00018,
      radiusMeters: 100,
      mapId: "metro",
      rotationGroup: "walk-test-2026",
    };
  }

  function renderArenaWalkTest() {
    if (!arenaWalkTest || !arenaLocationStatus) return;
    const active = Boolean(arenaWalkState.player && arenaWalkState.arena);
    if (arenaRadar) arenaRadar.hidden = !active;
    arenaWalkTest.dataset.locationMode = arenaWalkState.mode;
    arenaWalkTest.classList.toggle("is-in-range", active && arenaWalkState.distanceMeters <= arenaWalkState.arena.radiusMeters);
    if (!active) return;
    const distance = Math.max(0, Math.round(arenaWalkState.distanceMeters));
    const inRange = distance <= arenaWalkState.arena.radiusMeters;
    if (nearbyArenaDistance) nearbyArenaDistance.textContent = `${distance} m away · ${inRange ? "in range" : "move closer"}`;
    if (nearbyArenaButton) nearbyArenaButton.disabled = !inRange;
    arenaLocationStatus.textContent = arenaWalkState.mode === "simulated"
      ? `Desktop simulation active. ${arenaWalkState.arena.name} is ${distance} meters away.`
      : `${arenaWalkState.arena.name} found ${distance} meters away. Location is not stored.`;
  }

  function activateArenaWalkLocation(location, mode) {
    arenaWalkState.mode = mode;
    arenaWalkState.player = location;
    arenaWalkState.arena = createNearbyTestArena(location);
    arenaWalkState.distanceMeters = distanceInMeters(location, arenaWalkState.arena);
    renderArenaWalkTest();
  }

  function requestArenaWalkLocation() {
    if (!navigator.geolocation) {
      arenaWalkState.mode = "unavailable";
      if (arenaLocationStatus) arenaLocationStatus.textContent = "Location is unavailable in this browser. Use Desktop Test or select a regular arena.";
      return;
    }
    arenaWalkState.mode = "requesting";
    if (arenaLocationStatus) arenaLocationStatus.textContent = "Requesting your location…";
    if (arenaLocateButton) arenaLocateButton.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (arenaLocateButton) arenaLocateButton.disabled = false;
        activateArenaWalkLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }, "device");
      },
      (error) => {
        if (arenaLocateButton) arenaLocateButton.disabled = false;
        arenaWalkState.mode = "denied";
        if (arenaLocationStatus) {
          arenaLocationStatus.textContent = error.code === 1
            ? "Location permission was not granted. Use Desktop Test or select a regular arena."
            : "Your location could not be read. Use Desktop Test or select a regular arena.";
        }
        renderArenaWalkTest();
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 30000 },
    );
  }

  function setupArenaWalkTest() {
    if (!arenaWalkTest) return;
    arenaLocateButton?.addEventListener("click", requestArenaWalkLocation);
    arenaSimulateButton?.addEventListener("click", () => {
      activateArenaWalkLocation({ latitude: 39.7392, longitude: -104.9903, accuracy: 5 }, "simulated");
    });
    nearbyArenaButton?.addEventListener("click", () => {
      if (!arenaWalkState.arena || arenaWalkState.distanceMeters > arenaWalkState.arena.radiusMeters) return;
      selectArena(arenaWalkState.arena.mapId);
      if (arenaLocationStatus) arenaLocationStatus.textContent = `${arenaWalkState.arena.name} checked in · ${getArena().name} loaded.`;
      flashToast("Arena check-in complete", 1400);
    });
    renderArenaWalkTest();
  }

  function showMessage(title, subtitle = "") {
    if (!message || game.phase === "select" || game.phase === "splash") return;
    message.classList.remove("is-results");
    message.classList.remove("is-hidden");
    message.style.display = "";
    message.innerHTML = `<strong>${title}</strong><span>${subtitle}</span>`;
  }

  function showMatchSummary(title, subtitle, creditReward = 0, xpReward = 0) {
    if (!message) return;
    const stats = game.matchStats?.player || {};
    const elapsed = Math.max(0, 99 - game.roundTime);
    const accuracy = stats.attacks ? Math.round((stats.hits / stats.attacks) * 100) : 0;
    message.classList.remove("is-hidden");
    message.classList.add("is-results");
    message.style.display = "";
    message.replaceChildren();
    const heading = document.createElement("strong");
    heading.textContent = title;
    const subheading = document.createElement("span");
    subheading.textContent = subtitle;
    const grid = document.createElement("div");
    grid.className = "match-result-grid";
    const rows = [
      ["Damage", stats.damage || 0],
      ["Hits", `${stats.hits || 0} / ${stats.attacks || 0}`],
      ["Accuracy", `${accuracy}%`],
      ["Best combo", stats.maxCombo || 0],
      ["Power attacks", stats.powers || 0],
      ["Fight time", `${elapsed}s`],
      ["Finisher", game.matchStats?.finisher || "None"],
      ["Rewards", `+${xpReward} XP · +${creditReward} RC`],
    ];
    for (const [label, value] of rows) {
      const item = document.createElement("div");
      const key = document.createElement("small");
      const output = document.createElement("b");
      key.textContent = label;
      output.textContent = String(value);
      item.append(key, output);
      grid.appendChild(item);
    }
    message.append(heading, subheading, grid);
  }

  function hideMessage() {
    message.classList.add("is-hidden");
  }

  function flashToast(text, ms = 900) {
    game.toast = text;
    game.toastTime = ms;
  }

  function normalizeKey(key) {
    const k = key.toLowerCase();
    if (k === "arrowleft") return "left";
    if (k === "arrowright") return "right";
    if (k === "arrowup") return "up";
    if (k === "arrowdown") return "down";
    if (k === " ") return "space";
    if (k === "shift") return "shift";
    return k;
  }

  function wants(code) {
    if (code === "left") return held.has("a") || held.has("left") || virtual.left;
    if (code === "right") return held.has("d") || held.has("right") || virtual.right;
    if (code === "down") return held.has("s") || held.has("down") || virtual.down;
    if (code === "block") return held.has("shift") || held.has("space") || virtual.block;
    return held.has(code);
  }

  function controlKey(key) {
    return ["a", "d", "w", "s", "left", "right", "up", "down", "shift", "space", "j", "k", "i", "l", "o", "f", "enter", "r"].includes(key);
  }

  function isTypingTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
    if (!(target instanceof HTMLInputElement)) return false;
    return !["button", "checkbox", "color", "file", "radio", "range", "reset", "submit"].includes(target.type);
  }

  window.addEventListener("keydown", (event) => {
    softAudioUnlock();
    if (isTypingTarget(event.target)) return;
    const key = normalizeKey(event.key);
    if (controlKey(key)) event.preventDefault();
    if (!event.repeat) {
      if (key === "enter") startOrRestart();
      if (key === "a" || key === "left") recordInput("left");
      if (key === "d" || key === "right") recordInput("right");
      if (key === "s" || key === "down") recordInput("down");
      if (key === "w" || key === "up") command("jump");
      if (key === "j") command("light");
      if (key === "k") command("heavy");
      if (key === "i") command("upper");
      if (key === "l") command("special");
      if (key === "o") command("dash");
      if (key === "f") command("finisher");
    }
    held.add(key);
  });

  window.addEventListener("keyup", (event) => {
    if (isTypingTarget(event.target)) return;
    held.delete(normalizeKey(event.key));
  });

  if (startButton) startButton.addEventListener("click", () => { softAudioUnlock(); startOrRestart(); });
  if (continueButton) continueButton.addEventListener("click", () => { softAudioUnlock(); goToArenaStep(); });
  if (backToSplashButton) backToSplashButton.addEventListener("click", backFromSelect);
  if (matchContinueButton) matchContinueButton.addEventListener("click", () => { void continueToNextMatch(); });
  if (matchRetryButton) matchRetryButton.addEventListener("click", retryCurrentMatch);
  if (matchMenuButton) matchMenuButton.addEventListener("click", returnToSplash);

  document.querySelectorAll("[data-hold]").forEach((button) => {
    const code = button.dataset.hold;
    const set = (value) => {
      if (code === "left") virtual.left = value;
      if (code === "right") virtual.right = value;
      if (code === "down") virtual.down = value;
      if (code === "block") virtual.block = value;
    };
    const release = () => {
      set(false);
      button.classList.remove("is-pressed");
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
      button.classList.add("is-pressed");
      set(true);
      recordInput(code);
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("lostpointercapture", release);
  });

  function setupVirtualJoystick() {
    const stick = document.querySelector(".move-stick");
    if (!stick || stick.dataset.joystickBound === "1") return;
    stick.dataset.joystickBound = "1";
    stick.classList.add("is-virtual-joystick");
    let knob = stick.querySelector(".move-knob");
    if (!knob) {
      knob = document.createElement("span");
      knob.className = "move-knob";
      knob.setAttribute("aria-hidden", "true");
      stick.appendChild(knob);
    }
    const buttons = stick.querySelectorAll(".move-btn");
    buttons.forEach((btn) => {
      btn.style.setProperty("opacity", "0", "important");
      btn.style.setProperty("pointer-events", "none", "important");
      btn.tabIndex = -1;
      btn.setAttribute("aria-hidden", "true");
    });
    const center = stick.querySelector(".move-center");
    if (center) center.style.opacity = "0.35";

    let activePointer = null;
    const dead = 0.28;
    const maxRadius = () => Math.min(stick.clientWidth, stick.clientHeight) * 0.38;

    const clearVirtualMove = () => {
      virtual.left = false;
      virtual.right = false;
      virtual.down = false;
      held.delete("up");
      held.delete("w");
    };

    const applyVector = (nx, ny) => {
      clearVirtualMove();
      const mag = Math.hypot(nx, ny);
      if (mag < dead) {
        knob.style.transform = "translate(-50%, -50%)";
        return;
      }
      const capped = Math.min(1, mag);
      const angleX = nx / mag;
      const angleY = ny / mag;
      const radius = maxRadius() * capped;
      knob.style.transform = `translate(calc(-50% + ${angleX * radius}px), calc(-50% + ${angleY * radius}px))`;
      if (angleX <= -0.35) {
        virtual.left = true;
        recordInput("left");
      } else if (angleX >= 0.35) {
        virtual.right = true;
        recordInput("right");
      }
      if (angleY >= 0.45) {
        virtual.down = true;
        recordInput("down");
      } else if (angleY <= -0.55) {
        held.add("up");
        held.add("w");
        command("jump");
      }
    };

    const readLocal = (event) => {
      const rect = stick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const radius = Math.max(1, maxRadius());
      return { nx: dx / radius, ny: dy / radius };
    };

    const onDown = (event) => {
      if (activePointer !== null) return;
      activePointer = event.pointerId;
      event.preventDefault();
      event.stopPropagation();
      try { stick.setPointerCapture(event.pointerId); } catch (_) {}
      stick.classList.add("is-active");
      const v = readLocal(event);
      applyVector(v.nx, v.ny);
    };
    const onMove = (event) => {
      if (event.pointerId !== activePointer) return;
      event.preventDefault();
      const v = readLocal(event);
      applyVector(v.nx, v.ny);
    };
    const onUp = (event) => {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      stick.classList.remove("is-active");
      clearVirtualMove();
      knob.style.transform = "translate(-50%, -50%)";
    };

    stick.addEventListener("pointerdown", onDown);
    stick.addEventListener("pointermove", onMove);
    stick.addEventListener("pointerup", onUp);
    stick.addEventListener("pointercancel", onUp);
    stick.addEventListener("lostpointercapture", onUp);
  }

  function bindTouchCommand(button, input) {
    let lastActivation = 0;
    const press = (event) => {
      const now = performance.now();
      if (now - lastActivation < 85) return;
      lastActivation = now;
      event.preventDefault();
      event.stopPropagation();
      if (event.pointerId !== undefined && button.setPointerCapture) button.setPointerCapture(event.pointerId);
      button.classList.add("is-pressed");
      command(input);
    };
    const release = () => button.classList.remove("is-pressed");
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("click", (event) => {
      if (performance.now() - lastActivation < 180) return;
      press(event);
      release();
    });
  }

    syncFightControlsVisibility(false);
  setupVirtualJoystick();

  document.querySelectorAll("[data-tap]").forEach((button) => bindTouchCommand(button, button.dataset.tap));
  document.querySelectorAll("[data-combo]").forEach((button) => bindTouchCommand(button, button.dataset.combo));

  function startOrRestart() {
    if (game.phase !== "select" && selectScreen && !selectScreen.hidden) {
      ensureSelectPhase();
    }
    if (game.phase === "select") {
      if (selectStep === "fighter") {
        goToArenaStep();
        return;
      }
      beginMatchWithOpponentReel();
      return;
    }
    if (game.phase === "over") return;
  }

  function queueAttack(type, label = null) {
    if (startAttack(player, type)) {
      attackBuffer = null;
      attackBufferTime = 0;
      if (label) flashToast(label, 650);
      return true;
    }
    if (game.phase === "fight" && player.health > 0) {
      attackBuffer = { type, label };
      attackBufferTime = ATTACK_BUFFER_MS;
    }
    return false;
  }

  function flushAttackBuffer() {
    if (!attackBuffer || game.phase !== "fight") return;
    if (startAttack(player, attackBuffer.type)) {
      if (attackBuffer.label) flashToast(attackBuffer.label, 650);
      attackBuffer = null;
      attackBufferTime = 0;
    }
  }

  function command(input) {
    recordInput(input);
    if (game.phase === "splash" || game.phase === "select") return;
    if (game.phase === "over") return;

    if (input === "jump") {
      if ((game.phase === "fight" || game.phase === "finishPrompt") && player.grounded && !player.action && player.stun <= 0 && !player.block) {
        player.vy = -820;
        player.grounded = false;
      }
      return;
    }

    if (input === "finisher") {
      tryFinisher();
      return;
    }

    if (game.phase === "finishPrompt" && input === "special") {
      tryFinisher("power");
      return;
    }

    if (game.phase === "finishPrompt" && input === "upper") {
      const arena = getArena();
      if (arena?.windowFinisher) tryFinisher("uppercut");
      else if (arena?.spaceFinisher) tryFinisher("uppercut");
      else flashToast("Uppercut finisher needs Archive Bay 6 or a launch arena", 1400);
      return;
    }

    if (game.phase !== "fight") return;
    const combo = resolveCombo(input);
    if (combo) {
      queueAttack(combo.type, combo.label);
      return;
    }
    if (input === "beam" || input === "surge" || input === "crush") {
      queueAttack(input);
      return;
    }
    if (input === "special") queueAttack("special");
    if (input === "dash") queueAttack("dash");
    if (input === "light" || input === "heavy" || input === "upper") {
      queueAttack(resolveStrikeType(input));
    }
  }

  function resolveStrikeType(input) {
    const crouching = player.crouch || wants("down");
    if (input === "light" && crouching) return "crouchLight";
    if (input === "heavy" && crouching) return "crouchKick";
    return input;
  }

  function recordInput(input) {
    const map = {
      left: "left",
      right: "right",
      down: "down",
      special: "l",
      dash: "o",
      heavy: "k",
      upper: "i",
      light: "j",
      beam: "beam",
      surge: "surge",
      crush: "crush",
    };
    const code = map[input] || input;
    if (!["left", "right", "down", "l", "o", "k", "i", "j", "beam", "surge", "crush"].includes(code)) return;
    inputBuffer.push({ code, time: nowMs() });
    while (inputBuffer.length > 10) inputBuffer.shift();
  }

  function resolveCombo(input) {
    const direct = {
      beam: { type: "beam", label: `${player.name} Beam` },
      surge: { type: "surge", label: `${player.name} Surge` },
      crush: { type: "crush", label: `${player.name} Crush` },
    };
    if (direct[input]) return direct[input];

    const commands = [
      { sequence: ["left", "down", "o"], type: "beam", label: `${player.name} Beam` },
      { sequence: ["down", "right", "l"], type: "surge", label: `${player.name} Surge` },
      { sequence: ["right", "down", "k"], type: "crush", label: `${player.name} Crush` },
    ];
    for (const commandDef of commands) {
      if (inputMatches(commandDef.sequence)) return commandDef;
    }
    return null;
  }

  function inputMatches(sequence) {
    const now = nowMs();
    let index = sequence.length - 1;
    for (let i = inputBuffer.length - 1; i >= 0; i -= 1) {
      const item = inputBuffer[i];
      if (now - item.time > 900) break;
      if (item.code === sequence[index]) index -= 1;
      if (index < 0) return true;
    }
    return false;
  }

  function attackRecovered(f) {
    if (!f.action) return true;
    const data = attacks[f.action.type];
    if (!data) return f.action.elapsed >= f.action.duration;
    // Feel pack: full recovery by default. On-hit cancels are gated in canCancelOnHit.
    return f.action.elapsed >= f.action.duration;
  }

  // Cancel graph v0: light / crouchLight → heavy | upper | special (onHit only).
  function canCancelOnHit(f, nextType) {
    if (!f?.action?.hasHit) return false;
    const from = f.action.type;
    if (from !== "light" && from !== "crouchLight") return false;
    const allowed =
      nextType === "heavy" ||
      nextType === "upper" ||
      nextType === "special" ||
      nextType === "beam" ||
      nextType === "surge" ||
      nextType === "crush";
    if (!allowed) return false;
    const data = attacks[from];
    const cancelAt = data?.activeEnd ?? Math.max(0, f.action.duration * 0.55);
    return f.action.elapsed >= cancelAt;
  }

  function canAct(f, nextType) {
    if (f.health <= 0 || f.stun > 0) return false;
    if (!f.action) return true;
    if (nextType && canCancelOnHit(f, nextType)) return true;
    return attackRecovered(f);
  }

  function startAttack(f, type) {
    if (!canAct(f, type) || game.phase !== "fight") return false;
    const data = attacks[type];
    if (!data) return false;
    const canceling = !!(f.action && canCancelOnHit(f, type));
    if (f.cooldown > 0 && !canceling) return false;
    if (data.cost && f.meter < data.cost) {
      if (f.isPlayer) flashToast("Need meter");
      return false;
    }
    if (data.cost) f.meter = clamp(f.meter - data.cost, 0, 100);
    const statBucket = f.isPlayer ? game.matchStats?.player : game.matchStats?.enemy;
    if (statBucket) {
      statBucket.attacks += 1;
      if (type === "special" || type === "beam" || type === "surge" || type === "crush") statBucket.powers += 1;
    }
    f.action = {
      type,
      elapsed: 0,
      duration: data.duration,
      hasHit: false,
      spawned: false,
    };
    f.block = false;
    f.crouch = Boolean(data.crouch);
    f.cooldown = data.cooldown;
    f.state = "attack";
    return true;
  }

  function isChromeEyeFatality(character = player.character) {
    return activeFinisherStyle(character) === "chrome";
  }

  function isTankCannonFatality(character = player.character) {
    return activeFinisherStyle(character) === "tank";
  }

  function isKingGroundWaveFatality(character = player.character) {
    return activeFinisherStyle(character) === "king";
  }

  function isSpar7anSpearFatality(character = player.character) {
    return activeFinisherStyle(character) === "spar7an";
  }

  function isLazyControllerFatality(character = player.character) {
    return activeFinisherStyle(character) === "lazy";
  }

  function isNinjaKatanaFatality(character = player.character) {
    return activeFinisherStyle(character) === "ninja";
  }

  function isGritAirstrikeFatality(character = player.character) {
    return activeFinisherStyle(character) === "anthony-e1";
  }

  function isAnthonyNukeFatality(character = player.character) {
    const style = activeFinisherStyle(character);
    return style === "grit";
  }

  function isPlotPulseUfoFatality(character = player.character) {
    return activeFinisherStyle(character) === "plot-pulse-theam";
  }

  function isDragonSkyFeastFatality(character = player.character) {
    return activeFinisherStyle(character) === "dragon";
  }

  function isDragonBornStormBreathFatality(character = player.character) {
    return activeFinisherStyle(character) === "dragon-born";
  }

  function isBoneHeadSwapFatality(character = player.character) {
    return activeFinisherStyle(character) === "bone";
  }

  function isJennyReplayFatality(character = player.character) {
    return activeFinisherStyle(character) === "jenny-night-signal";
  }

  function isSableRewriteFatality(character = player.character) {
    return activeFinisherStyle(character) === "sable";
  }

  function isJakeFourthDownFatality(character = player.character) {
    return activeFinisherStyle(character) === "jake";
  }

  function isControlDubstepFatality(character = player.character) {
    return activeFinisherStyle(character) === "control";
  }

  function isMotherShadowFatality(character = player.character) {
    return activeFinisherStyle(character) === "the-mother";
  }

  function isWendigoAntlerFatality(character = player.character) {
    return activeFinisherStyle(character) === "wendigo";
  }

  function isIceGolemCrushFatality(character = player.character) {
    return activeFinisherStyle(character) === "ice-golem";
  }

  function isBigfootStompFatality(character = player.character) {
    return activeFinisherStyle(character) === "bigfoot";
  }

  function isRiftSplitFatality(character = player.character) {
    return activeFinisherStyle(character) === "rift";
  }

  function isAlexCaseClosedFatality(character = player.character) {
    return activeFinisherStyle(character) === "alex";
  }

  function isMaraQaClearFatality(character = player.character) {
    return activeFinisherStyle(character) === "pp-mara";
  }

  function isNoahWontFixFatality(character = player.character) {
    return activeFinisherStyle(character) === "noah";
  }

  function isClaireHollowFrameFatality(character = player.character) {
    return activeFinisherStyle(character) === "claire";
  }

  function isEliDevBuildCrashFatality(character = player.character) {
    return activeFinisherStyle(character) === "eli-dev";
  }

  function isMarauderGunFatality(character = player.character) {
    return activeFinisherStyle(character) === "marauder";
  }

  function tankFarEdgeX(dir) {
    return dir > 0 ? RIGHT_WALL - 34 : LEFT_WALL + 34;
  }

  function chromeEyeWorldPoints(f) {
    const dir = f.facing;
    const ch = f.character || getCharacter("chrome");
    ensureFighterVisualAssets(ch.id);
    const moveAsset = generatedAssets.moveSheets.get(ch.id);
    const sheetAsset = generatedAssets.fighters.get(ch.id);
    const usesSprite = Boolean((moveAsset?.ready || sheetAsset?.ready) && ch.id === "chrome");
    if (usesSprite) {
      const drawH = ch.body === "heavy" ? 150 : 140;
      const eyeY = f.y - drawH * 0.82;
      return {
        left: { x: f.x + dir * 6, y: eyeY },
        right: { x: f.x + dir * 14, y: eyeY },
        center: { x: f.x + dir * 10, y: eyeY },
      };
    }
    const eyeY = f.y - 140;
    return {
      left: { x: f.x + dir * 8, y: eyeY },
      right: { x: f.x + dir * 18, y: eyeY },
      center: { x: f.x + dir * 13, y: eyeY },
    };
  }

  function tryFinisher(trigger = "riftality") {
    if (game.phase !== "finishPrompt") return;
    const powerBlast = trigger === "power";
    const arenaNow = getArena();
    const windowUppercut = trigger === "uppercut" && Boolean(arenaNow?.windowFinisher);
    const spaceUppercut = trigger === "uppercut" && Boolean(arenaNow?.spaceFinisher) && !windowUppercut;
    const chromeEyes = isChromeEyeFatality();
    const tankCannon = isTankCannonFatality();
    const marauderGun = isMarauderGunFatality();
    const kingGroundWave = isKingGroundWaveFatality();
    const spar7anSpear = isSpar7anSpearFatality();
    const lazyController = isLazyControllerFatality();
    const ninjaKatana = isNinjaKatanaFatality();
    const gritAirstrike = isGritAirstrikeFatality();
    const anthonyNuke = isAnthonyNukeFatality();
    const plotPulseUfo = isPlotPulseUfoFatality();
    const dragonSkyFeast = isDragonSkyFeastFatality();
    const dragonBornStormBreath = isDragonBornStormBreathFatality();
    const boneHeadSwap = isBoneHeadSwapFatality();
    const jennyReplay = isJennyReplayFatality();
    const sableRewrite = isSableRewriteFatality();
    const jakeFourthDown = isJakeFourthDownFatality();
    const controlDubstep = isControlDubstepFatality();
    const motherShadow = isMotherShadowFatality();
    const wendigoAntler = isWendigoAntlerFatality();
    const iceGolemCrush = isIceGolemCrushFatality();
    const bigfootStomp = isBigfootStompFatality();
    const riftSplit = isRiftSplitFatality();
    const alexCaseClosed = isAlexCaseClosedFatality();
    const maraQaClear = isMaraQaClearFatality();
    const noahWontFix = isNoahWontFixFatality();
    const claireHollowFrame = isClaireHollowFrameFatality();
    const eliDevBuildCrash = isEliDevBuildCrashFatality();
    const dist = Math.abs(player.x - enemy.x);
    if (!powerBlast && !spaceUppercut && !windowUppercut && !chromeEyes && !tankCannon && !marauderGun && !kingGroundWave && !spar7anSpear && !lazyController && !ninjaKatana && !gritAirstrike && !anthonyNuke && !plotPulseUfo && !dragonSkyFeast && !dragonBornStormBreath && !boneHeadSwap && !jennyReplay && !sableRewrite && !jakeFourthDown && !controlDubstep && !motherShadow && !wendigoAntler && !iceGolemCrush && !bigfootStomp && !riftSplit && !alexCaseClosed && !maraQaClear && !noahWontFix && !claireHollowFrame && !eliDevBuildCrash && dist > 132) {
      flashToast("Get closer");
      return;
    }

    const dir = toward(player, enemy);
    player.facing = dir;
    enemy.facing = -dir;
    if (powerBlast) {
      enemy.x = clamp(enemy.x, W * 0.5, W * 0.68);
      player.x = clamp(enemy.x - dir * 220, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (spaceUppercut || windowUppercut) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.62);
      player.x = clamp(enemy.x - dir * 62, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (tankCannon) {
      const farX = tankFarEdgeX(dir);
      player.x = farX;
      enemy.x = clamp(enemy.x, W * 0.34, W * 0.66);
    } else if (marauderGun) {
      enemy.x = clamp(enemy.x, W * 0.38, W * 0.68);
      player.x = clamp(enemy.x - dir * 158, LEFT_WALL + 40, RIGHT_WALL - 40);
    } else if (kingGroundWave) {
      enemy.x = clamp(enemy.x, W * 0.42, W * 0.68);
      player.x = clamp(enemy.x - dir * 104, LEFT_WALL + 40, RIGHT_WALL - 40);
    } else if (spar7anSpear) {
      enemy.x = clamp(enemy.x, W * 0.42, W * 0.68);
      player.x = clamp(enemy.x - dir * 184, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (lazyController) {
      enemy.x = clamp(enemy.x, W * 0.45, W * 0.68);
      player.x = clamp(enemy.x - dir * 138, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (ninjaKatana) {
      enemy.x = clamp(enemy.x, W * 0.44, W * 0.66);
      player.x = clamp(enemy.x - dir * 86, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (gritAirstrike) {
      enemy.x = clamp(enemy.x, W * 0.46, W * 0.66);
      player.x = clamp(enemy.x - dir * 118, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (anthonyNuke) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.62);
      player.x = clamp(enemy.x - dir * 250, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (plotPulseUfo) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.62);
      player.x = clamp(enemy.x - dir * 190, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (dragonSkyFeast) {
      enemy.x = clamp(enemy.x, W * 0.5, W * 0.62);
      player.x = clamp(enemy.x - dir * 150, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (dragonBornStormBreath) {
      enemy.x = clamp(enemy.x, W * 0.5, W * 0.66);
      player.x = clamp(enemy.x - dir * 230, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (boneHeadSwap) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.66);
      player.x = clamp(enemy.x - dir * 118, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (jennyReplay) {
      enemy.x = clamp(enemy.x, W * 0.46, W * 0.66);
      player.x = clamp(enemy.x - dir * 152, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (sableRewrite) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.68);
      player.x = clamp(enemy.x - dir * 124, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (jakeFourthDown) {
      enemy.x = clamp(enemy.x, W * 0.5, W * 0.68);
      player.x = clamp(enemy.x - dir * 230, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (controlDubstep) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.68);
      player.x = clamp(enemy.x - dir * 178, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (motherShadow) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.68);
      player.x = clamp(enemy.x - dir * 124, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (wendigoAntler) {
      enemy.x = clamp(enemy.x, W * 0.5, W * 0.68);
      player.x = clamp(enemy.x - dir * 250, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (iceGolemCrush) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.68);
      player.x = clamp(enemy.x - dir * 148, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (bigfootStomp) {
      enemy.x = clamp(enemy.x, W * 0.5, W * 0.68);
      player.x = clamp(enemy.x - dir * 168, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (riftSplit) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.66);
      player.x = clamp(enemy.x - dir * 112, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (alexCaseClosed) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.68);
      player.x = clamp(enemy.x - dir * 138, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (maraQaClear) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.68);
      player.x = clamp(enemy.x - dir * 126, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (noahWontFix) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.68);
      player.x = clamp(enemy.x - dir * 132, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (claireHollowFrame) {
      enemy.x = clamp(enemy.x, W * 0.48, W * 0.66);
      player.x = clamp(enemy.x - dir * 118, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (eliDevBuildCrash) {
      enemy.x = clamp(enemy.x, W * 0.5, W * 0.68);
      player.x = clamp(enemy.x - dir * 156, LEFT_WALL + 42, RIGHT_WALL - 42);
    } else if (!chromeEyes) {
      player.x = clamp(enemy.x - dir * 92, LEFT_WALL, RIGHT_WALL);
    }
    player.vx = 0;
    enemy.vx = 0;
    player.action = null;
    enemy.action = null;
    game.phase = "finisher";
    game.finisherTime = 0;
    try { spawnRiftalityImpactVfx(); } catch (_) {}
    enemy.detachedParts = new Set();
    limbs = [];
    goreChunks = [];
    const farX = tankCannon ? tankFarEdgeX(dir) : player.x;
    game.finisher = {
      dir,
      powerBlast,
      spaceUppercut,
      windowUppercut,
      playerStartX: player.x,
      enemyStartX: enemy.x,
      chromeEyes,
      tankCannon,
      marauderGun,
      kingGroundWave,
      spar7anSpear,
      lazyController,
      ninjaKatana,
      gritAirstrike,
      anthonyNuke,
      plotPulseUfo,
      dragonSkyFeast,
      dragonBornStormBreath,
      boneHeadSwap,
      jennyReplay,
      sableRewrite,
      jakeFourthDown,
      controlDubstep,
      motherShadow,
      wendigoAntler,
      iceGolemCrush,
      bigfootStomp,
      riftSplit,
      alexCaseClosed,
      maraQaClear,
      noahWontFix,
      claireHollowFrame,
      eliDevBuildCrash,
      qaStamps: [],
      ticketTags: [],
      wireFrames: [],
      crashLines: [],
      codeBlocks: [],
      tankX: tankCannon ? farX + (dir > 0 ? -140 : 140) : null,
      playerInTank: false,
      shellFired: false,
      shellHit: false,
      waveImpact: false,
      spearImpact: false,
      controllerImpact: false,
      katanaCollapse: false,
      airstrikeCalled: false,
      bombDropped: false,
      bombImpact: false,
      abductionStarted: false,
      ufoPulse: 0,
      dragonGrabbed: false,
      dragonBitHead: false,
      stormBreathImpact: false,
      skullThrown: false,
      enemyHeadLoose: false,
      enemyHeadPicked: false,
      boneWearsEnemyHead: false,
      skullX: player.x,
      skullY: player.y - 142,
      enemyHeadX: enemy.x,
      enemyHeadY: enemy.y - 142,
      jetX: dir > 0 ? -160 : W + 160,
      jetY: 92,
      bombX: null,
      bombY: null,
      replayGhosts: [],
      replayMaskAlpha: 0,
      replayEchoAlpha: 0,
      replaySignalBoost: isSignalCorruptedArena(),
      rewriteMarks: [],
      rewriteGhosts: [],
      bassRings: [],
      bassNotes: [],
      drumShockwaves: [],
      drumNotes: [],
      drumBeatIndex: 0,
      drumImpact: false,
      shadowImpact: false,
      antlerImpact: false,
      iceImpact: false,
      stompImpact: false,
      riftImpact: false,
      riftSplitImpact: false,
      caseFlash: false,
      caseImpact: false,
      evidenceTags: [],
      riftCenterX: enemy.x + dir * 96,
      riftCenterY: enemy.y - 102,
      spearTipX: player.x + dir * 58,
      spearTipY: player.y - 98,
      controllerX: player.x + dir * 34,
      controllerY: player.y - 96,
      shotIndex: 0,
      lastShotTime: -999,
      lastShotTargetY: enemy.y - 90,
      announced: false,
      bursts: fatalityBursts(activeFinisherStyle(player.character)),
      burstIndex: 0,
      tagline: tankCannon ? `${player.name} Wins · Riftality` : fatalityTagline(activeFinisherStyle(player.character), player.character),
    };
    if (powerBlast) game.finisher.tagline = "RIFT OVERLOAD";
    if (spaceUppercut) game.finisher.tagline = "ORBITAL UPPERCUT";
    if (windowUppercut) game.finisher.tagline = "TWENTY-STORY EXIT";
    if (kingGroundWave) game.finisher.tagline = "LANDSLIDE KING";
    if (gritAirstrike) game.finisher.tagline = "AIR STRIKE";
    if (anthonyNuke) game.finisher.tagline = "NUCLEAR OPTION";
    if (plotPulseUfo) game.finisher.tagline = "FLEET ABDUCTION";
    if (dragonSkyFeast) game.finisher.tagline = "SKY FEAST";
    if (dragonBornStormBreath) game.finisher.tagline = "STORM BREATH";
    if (boneHeadSwap) game.finisher.tagline = "HEAD CASE";
    if (jennyReplay) game.finisher.tagline = "THE 3:33 REPLAY";
    if (sableRewrite) game.finisher.tagline = "MARKED FOR REWRITE";
    if (jakeFourthDown) game.finisher.tagline = "FOURTH DOWN MIRACLE";
    if (controlDubstep) game.finisher.tagline = "BASS DROP OVERRIDE";
    if (motherShadow) game.finisher.tagline = "LIGHTS OUT, SWEETHEART";
    if (wendigoAntler) game.finisher.tagline = "ANTLER PEEL";
    if (iceGolemCrush) game.finisher.tagline = "GLACIER CRUSH";
    if (bigfootStomp) game.finisher.tagline = "TIMBER STOMP";
    if (riftSplit) game.finisher.tagline = "RIFT SPLIT";
    if (alexCaseClosed) game.finisher.tagline = "CASE CLOSED";
    if (maraQaClear) game.finisher.tagline = "QA CLEAR";
    if (noahWontFix) game.finisher.tagline = "WON'T FIX";
    if (claireHollowFrame) game.finisher.tagline = "HOLLOW FRAME";
    if (eliDevBuildCrash) game.finisher.tagline = "BUILD CRASH";
    game.flash = 0.6;
    game.shake = 20;
    hideMessage();
    setAudioMode("fight");
  }

  function bodyBox(f) {
    const h = f.crouch ? 78 : f.h;
    const w = f.crouch ? 60 : f.w;
    return {
      x: f.x - w / 2,
      y: f.y - h,
      w,
      h,
    };
  }

  function attackBox(f, data) {
    return {
      x: f.x + f.facing * (f.w / 2 + data.boxW / 2 - 6) - data.boxW / 2,
      y: f.y - data.centerY - data.boxH / 2,
      w: data.boxW,
      h: data.boxH,
    };
  }

  function isGuarding(defender, attacker) {
    return defender.block && defender.grounded && defender.facing === -toward(attacker, defender);
  }

  function addHitParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 330;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 260 + Math.random() * 260,
        maxLife: 520,
        size: 3 + Math.random() * 7,
        color,
      });
    }
  }

  function addGore(x, y, dir, amount = 16, heavy = false) {
    const palette = ["#7a0508", "#b40d12", "#e02a22", "#4b0305"];
    for (let i = 0; i < amount; i += 1) {
      const spray = (Math.random() - 0.5) * 1.25 - dir * (heavy ? 0.55 : 0.25);
      const speed = (heavy ? 230 : 130) + Math.random() * (heavy ? 470 : 260);
      blood.push({
        x,
        y,
        vx: Math.cos(spray) * speed,
        vy: -120 - Math.random() * (heavy ? 460 : 260),
        life: 480 + Math.random() * (heavy ? 720 : 420),
        maxLife: heavy ? 1200 : 850,
        size: (heavy ? 3 : 2) + Math.random() * (heavy ? 8 : 5),
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }
    if (heavy) {
      addStain(x + dir * 12, FLOOR + 3, 20 + Math.random() * 24, "#5b0306");
    }
  }

  function addStain(x, y, size, color = "#650306") {
    stains.push({
      x: clamp(x, 0, W),
      y: clamp(y, FLOOR - 6, H),
      w: size * (1.2 + Math.random() * 1.4),
      h: size * (0.28 + Math.random() * 0.22),
      color,
      alpha: 0.66,
      life: 24000,
    });
    if (stains.length > 46) stains.shift();
  }

  function spawnComboFloat(defender, count, color = "#ffd86b") {
    if (!count || count < 1) return;
    const label = count >= 3 ? `x${count}+` : `x${count}`;
    comboFloats.push({
      x: defender.x + (Math.random() - 0.5) * 10,
      y: defender.y - (defender.h || 112) - 18,
      text: label,
      life: 780,
      maxLife: 780,
      vy: -52 - Math.min(18, count * 2),
      scale: 1 + Math.min(0.55, (count - 1) * 0.08),
      color,
    });
    if (comboFloats.length > 18) comboFloats.shift();
  }

  // Damage numbers: same float pipeline as combo counters, so no new render path.
  function spawnDamageFloat(defender, damage, guarded) {
    if (!damage || damage < 1) return;
    comboFloats.push({
      x: defender.x + (Math.random() - 0.5) * 44,
      y: defender.y - (defender.h || 112) - 36,
      text: guarded ? `${damage}` : `-${damage}`,
      life: 700,
      maxLife: 700,
      vy: -64,
      scale: 0.8,
      color: guarded ? "#9fb4c7" : damage >= 18 ? "#ff5d5d" : "#ffffff",
    });
    if (comboFloats.length > 18) comboFloats.shift();
  }

  function updateComboFloats(dt) {
    for (const float of comboFloats) {
      float.life -= dt;
      float.y += float.vy * dt / 1000;
      float.vy *= Math.pow(0.35, dt / 1000);
    }
    comboFloats = comboFloats.filter((float) => float.life > 0);
  }

  function drawComboFloats() {
    for (const float of comboFloats) {
      const t = clamp(float.life / float.maxLife, 0, 1);
      const alpha = t > 0.2 ? 1 : t / 0.2;
      const size = 16 * float.scale * (0.92 + (1 - t) * 0.18);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${size}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillStyle = float.color || "#ffd86b";
      ctx.strokeText(float.text, float.x, float.y);
      ctx.fillText(float.text, float.x, float.y);
      ctx.restore();
    }
  }

  function applyHit(attacker, defender, data, sourceX) {
    if (defender.invuln > 0 || defender.health <= 0 || game.phase !== "fight") return;
    const guarded = isGuarding(defender, attacker);
    const attackType = attacker.action?.type || "";
    const attackStat = data.kind
      ? "rift"
      : attackType === "heavy" || attackType === "crouchKick"
        ? "kick"
        : "punch";
    const powerRank = attacker.character?.progression?.stats?.[attackStat] || 0;
    const defenseRank = defender.character?.progression?.stats?.defense || 0;
    const gearPower = attacker.character?.gearModifiers?.[attackStat] || 0;
    const gearDefense = defender.character?.gearModifiers?.defense || 0;
    const scaledDamage = Math.max(1, Math.round(data.damage * (1 + powerRank * 0.02 + gearPower) * (1 - defenseRank * 0.015 - gearDefense)));
    const damage = guarded ? Math.max(1, Math.round(scaledDamage * 0.25)) : scaledDamage;
    const statBucket = attacker.isPlayer ? game.matchStats?.player : game.matchStats?.enemy;
    if (statBucket) {
      statBucket.hits += 1;
      statBucket.damage += damage;
      if (guarded) statBucket.blockedHits += 1;
    }
    defender.health = clamp(defender.health - damage, 0, 100);
    defender.stun = guarded ? 110 : data.stun;
    defender.state = guarded ? "block" : "hurt";
    defender.vx = attacker.facing * data.knockback * (guarded ? 0.26 : 1);
    if (data.launch && !guarded) {
      defender.vy = -data.launch;
      defender.grounded = false;
    }

    attacker.meter = clamp(attacker.meter + data.meterGain + (guarded ? 2 : 5), 0, 100);
    defender.meter = clamp(defender.meter + (guarded ? 12 : 5), 0, 100);
    attacker.combo = attacker.comboTimer > 0 ? attacker.combo + 1 : 1;
    attacker.comboTimer = 1450;
    if (statBucket) statBucket.maxCombo = Math.max(statBucket.maxCombo, attacker.combo);
    defender.combo = 0;
    defender.comboTimer = 0;
    if (!guarded) spawnComboFloat(defender, attacker.combo, attacker.palette?.meter || data.spark || "#ffd86b");
    spawnDamageFloat(defender, damage, guarded);

    const juiceScale = guarded ? 0.45 : 1;
    if (data.juice) {
      applyJuiceFx(data, juiceScale);
      // Feel pack floor: readable hitstop even when juice profile is soft.
      game.hitStop = Math.max(game.hitStop, guarded ? 40 : 100);
      game.shake = Math.max(game.shake, guarded ? 6 : 14);
    } else {
      // Screen punch + hitstop (~6f guard / ~6f+ unguarded @ 60Hz; cap elsewhere ≤180).
      game.shake = guarded ? 6 : 14;
      game.hitStop = guarded ? 40 : 100;
    }
    try {
      const audio = gameAudio();
      if (audio) {
        if (guarded) audio.playBlock?.();
        else {
          const heavyHit =
            attackType === "heavy" ||
            attackType === "crouchKick" ||
            attackType === "crush" ||
            attackType === "beam" ||
            (data.damage || 0) >= 7;
          audio.playHit?.({ heavy: heavyHit });
        }
      }
    } catch (_) {
      // Audio optional; never break combat.
    }
    try { spawnHitImpactVfx(attacker, defender, data, sourceX, guarded); } catch (_) {}
    {
      const arenaNow = getArena();
      const hotFx = arenaNow && ["rain", "metro", "signal", "sparks", "music", "arcade"].includes(arenaNow.fx);
      const bump = hotFx ? (guarded ? 0.04 : 0.08) : (guarded ? 0.12 : 0.28);
      game.arenaPulse = Math.min(hotFx ? 0.45 : 1, game.arenaPulse + bump);
    }
    const hitParticles = guarded ? 8 : particleCountForProfile(data, 16);
    addHitParticles(sourceX, defender.y - data.centerY, guarded ? "#76ddff" : data.spark, hitParticles);
    if (!guarded && data.pixelfx?.glitch) {
      addHitParticles(sourceX + (Math.random() - 0.5) * 14, defender.y - data.centerY + 6, data.trail || data.spark, Math.round(data.pixelfx.glitch * 28));
    }
    if (!guarded) {
      const brutal = data.damage >= 14 || data.kind || attacker.action?.type === "crush" || attacker.action?.type === "beam";
      addGore(sourceX, defender.y - data.centerY + 12, attacker.facing, brutal ? 34 : 16, brutal);
    }

    if (defender.health <= 0) finishHealthCheck(attacker, defender);
  }

  function finishHealthCheck(attacker, defender) {
    try { spawnKoImpactVfx(defender); } catch (_) {}
    if (defender === enemy && attacker === player) {
      enemy.health = 0;
      enemy.stun = 9999;
      enemy.action = null;
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.grounded = true;
      enemy.y = FLOOR;
      enemy.finishAnchorX = enemy.x;
      enemy.state = "dizzy";
      addGore(enemy.x, enemy.y - 82, player.facing, 48, true);
      player.meter = clamp(player.meter + 28, 0, 100);
      game.phase = "finishPrompt";
      game.finishTimer = 7.2;
      showMessage("Finish Them", "Riftality · Power overload · Uppercut on launch maps");
      return;
    }

    if (defender === player) {
      startBotRiftality();
    }
  }

  function startBotRiftality() {
    if (!player || !enemy || game.phase === "finisher" || game.phase === "over") return;
    const humanLoser = player;
    const botWinner = enemy;
    const dir = toward(botWinner, humanLoser);

    humanLoser.health = 0;
    humanLoser.stun = 9999;
    humanLoser.action = null;
    humanLoser.vx = 0;
    humanLoser.vy = 0;
    humanLoser.grounded = true;
    humanLoser.y = FLOOR;
    humanLoser.finishAnchorX = humanLoser.x;
    humanLoser.state = "dizzy";
    addGore(humanLoser.x, humanLoser.y - 82, botWinner.facing, 46, true);

    botWinner.health = Math.max(1, botWinner.health);
    botWinner.stun = 0;
    botWinner.action = null;
    botWinner.vx = 0;
    botWinner.vy = 0;
    botWinner.grounded = true;
    botWinner.y = FLOOR;
    botWinner.facing = dir;
    humanLoser.facing = -dir;
    botWinner.x = clamp(humanLoser.x - dir * 104, LEFT_WALL + 42, RIGHT_WALL - 42);

    // Finisher rendering is authored around player = winner and enemy = victim.
    // Swap combat references for the cinematic, then restore them in endMatch.
    player = botWinner;
    enemy = humanLoser;
    game.phase = "finishPrompt";
    game.finishTimer = 0;
    tryFinisher();
    if (game.finisher) game.finisher.botPerformed = true;
  }

  function endMatch(title, subtitle = "Returning to character select...") {
    const botPerformed = Boolean(game.finisher?.botPerformed);
    const humanFighter = botPerformed ? enemy : player;
    const xpReward = botPerformed ? 25 : 65;
    const creditReward = botPerformed ? 10 : 30;
    if (!game.progressionAwarded && humanFighter?.isPlayer && humanFighter.character?.progression) {
      awardCustomFighterXp(humanFighter.character, xpReward, creditReward);
      game.progressionAwarded = true;
    }
    if (botPerformed) {
      const botWinner = player;
      const humanLoser = enemy;
      player = humanLoser;
      enemy = botWinner;
      player.health = 0;
      player.state = "ko";
      player.y = FLOOR;
      enemy.health = Math.max(1, enemy.health);
      enemy.state = "idle";
      enemy.y = FLOOR;
      title = `${enemy.name} · Riftality`;
      subtitle = `${enemy.name} finished the fight. Returning to character select...`;
    }
    if (enemy?.health <= 0 && player?.health > 0) {
      const unlockMessage = recordKingDefeat();
      const costumeMessage = recordFighterWin(player.character?.id);
      if (costumeMessage) subtitle = `${costumeMessage}. Choose your next fight.`;
      else if (unlockMessage) subtitle = `${unlockMessage}. Choose your next fight.`;
      else if (player.character?.id === "jenny-night-signal") subtitle = "That was not me. Not all of it.";
    }
    game.phase = "over";
    game.overTimer = 0;
    if (game.matchStats) game.matchStats.finisher = game.finisher ? (game.finisher.tagline || "Riftality") : "None";
    showMatchSummary(title, subtitle, humanFighter?.character?.progression ? creditReward : 0, humanFighter?.character?.progression ? xpReward : 0);
    const lost = !(enemy?.health <= 0 && player?.health > 0) || Boolean(botPerformed);
    showMatchActions(lost ? "loss" : "win");
  }

  function awardCustomFighterXp(sourceCharacter, amount, creditReward) {
    const draft = normalizeCustomDraft(sourceCharacter?.customDraft || readBuilderDraft());
    const progression = normalizeFighterProgression(draft.progression);
    const economy = normalizeFighterEconomy(draft.economy, draft.body);
    const xpGain = Math.max(0, Math.round(amount));
    const creditGain = Math.max(0, Math.round(creditReward));
    progression.xp += xpGain;
    economy.credits += creditGain;
    let levelsEarned = 0;
    let levelBonusRc = 0;
    while (progression.level < 100 && progression.xp >= xpForNextFighterLevel(progression.level)) {
      progression.xp -= xpForNextFighterLevel(progression.level);
      progression.level += 1;
      // Level-ups grant RC instead of free upgrade points (Terminal/live free edits disabled).
      economy.credits += 50;
      levelBonusRc += 50;
      levelsEarned += 1;
    }
    progression.upgradePoints = 0;
    pushFighterLedgerEvent({
      type: "fight_reward",
      xp: xpGain,
      rc: creditGain + levelBonusRc,
      levels: levelsEarned,
    });
    customDraft = normalizeCustomDraft({ ...draft, progression, economy });
    saveCustomDraftToDevice(customDraft);
    customCharacter = createCustomCharacter(customDraft);
    characterById.set("custom", customCharacter);
    renderProgressionUi();
    renderGearUi();
    flashToast(levelsEarned
      ? `Level ${progression.level} · +${levelsEarned * 50} RC bonus · +${creditReward} credits`
      : `+${amount} XP · +${creditReward} Rift Credits`, 1900);
  }

  function updatePlayerInput(dt) {
    if (game.phase !== "fight" && game.phase !== "finishPrompt") return;
    if (player.stun > 0 || (player.action && !attackRecovered(player))) {
      player.block = false;
      return;
    }

    const left = wants("left");
    const right = wants("right");
    const blocking = wants("block") && player.grounded && game.phase === "fight";
    player.crouch = wants("down") && player.grounded && !blocking;
    player.block = blocking;

    if (blocking || player.crouch) {
      player.vx *= 0.72;
      return;
    }

    const speed = player.grounded ? 360 : 210;
    if (left && !right) player.vx = -speed;
    if (right && !left) player.vx = speed;
    if (!left && !right && player.grounded) player.vx *= Math.pow(0.001, dt / 1000);
  }

  function updateAI(dt) {
    if (game.phase !== "fight") {
      enemy.block = false;
      return;
    }
    if (enemy.health <= 0 || enemy.action || enemy.stun > 0) return;

    const defensive = enemy.character?.id === "control";
    enemy.aiTimer -= dt;
    enemy.aiBlockTimer -= dt;
    enemy.block = enemy.aiBlockTimer > 0;

    const dist = Math.abs(player.x - enemy.x);
    const playerThreat = player.action && dist < (defensive ? 170 : 125) && Math.random() < (defensive ? 0.18 : 0.08);
    if (playerThreat && enemy.grounded) {
      enemy.aiBlockTimer = (defensive ? 520 : 260) + Math.random() * (defensive ? 380 : 240);
      enemy.block = true;
    }

    if (enemy.block) {
      enemy.vx *= 0.75;
      if (defensive && dist < 118) enemy.vx = -enemy.facing * 95;
      return;
    }

    if (enemy.aiTimer > 0) {
      if (dist > (defensive ? 210 : 150)) enemy.vx = enemy.facing * (defensive ? 120 : 190);
      else if (defensive && dist < 96) enemy.vx = -enemy.facing * 120;
      return;
    }

    enemy.aiTimer = (defensive ? 360 : 260) + Math.random() * (defensive ? 420 : 330);

    if (dist > 250) {
      if (defensive && Math.random() < 0.28) {
        enemy.aiBlockTimer = 380 + Math.random() * 280;
      } else if (enemy.meter >= 38 && Math.random() < (defensive ? 0.34 : 0.22)) {
        startAttack(enemy, "beam");
      } else if (enemy.meter >= 24 && Math.random() < (defensive ? 0.56 : 0.46)) {
        startAttack(enemy, "special");
      } else {
        enemy.vx = enemy.facing * (defensive ? 130 : 240);
      }
      return;
    }

    if (dist > 115) {
      if (defensive && Math.random() < 0.24) {
        enemy.aiBlockTimer = 420 + Math.random() * 260;
      } else if (enemy.meter >= 30 && Math.random() < (defensive ? 0.28 : 0.18)) {
        startAttack(enemy, "surge");
      } else if (enemy.meter >= 34 && Math.random() < (defensive ? 0.2 : 0.32)) {
        startAttack(enemy, "dash");
      } else if (Math.random() < (defensive ? 0.18 : 0.28)) {
        startAttack(enemy, "heavy");
      } else {
        enemy.vx = enemy.facing * (defensive ? 80 : 150);
      }
      return;
    }

    const roll = Math.random();
    if (defensive && roll < 0.34) enemy.aiBlockTimer = 520 + Math.random() * 320;
    else if (roll < (defensive ? 0.5 : 0.38)) startAttack(enemy, "light");
    else if (roll < (defensive ? 0.58 : 0.48)) startAttack(enemy, "crouchLight");
    else if (roll < (defensive ? 0.7 : 0.66)) startAttack(enemy, "heavy");
    else if (roll < (defensive ? 0.78 : 0.76)) startAttack(enemy, "crouchKick");
    else if (roll < (defensive ? 0.88 : 0.9)) startAttack(enemy, "upper");
    else if (enemy.meter >= 32 && roll < (defensive ? 0.95 : 0.96)) startAttack(enemy, "crush");
    else enemy.aiBlockTimer = defensive ? 620 : 420;
  }

  function updateAction(f, opponent, dt) {
    if (!f.action) return;
    const data = attacks[f.action.type];
    f.action.elapsed += dt;

    if (["special", "beam", "surge"].includes(f.action.type) && !f.action.spawned && f.action.elapsed >= data.spawnTime) {
      f.action.spawned = true;
      spawnProjectile(f, f.action.type);
    }

    if (f.action.type === "dash" || f.action.type === "crush") {
      if (f.action.elapsed <= data.activeEnd + 30) {
        f.vx = f.facing * data.dashSpeed;
        f.invuln = Math.max(f.invuln, f.action.type === "crush" ? 50 : 90);
        if (!f.action._dustSpawned && f.action.elapsed < 40) {
          f.action._dustSpawned = true;
          try { spawnDustJuice(f, f.action.type === "crush" ? 1.25 : 0.95); } catch (_) {}
        }
        f.afterTimer -= dt;
        if (f.afterTimer <= 0) {
          f.afterTimer = 38;
          afterImages.push({
            fighter: f,
            x: f.x,
            y: f.y,
            facing: f.facing,
            life: 180,
          });
        }
      }
    }

    const active = f.action.elapsed >= data.activeStart && f.action.elapsed <= data.activeEnd;
    if (data.damage && active && !f.action.hasHit) {
      const box = attackBox(f, data);
      if (rectsOverlap(box, bodyBox(opponent))) {
        f.action.hasHit = true;
        applyHit(f, opponent, data, box.x + box.w / 2);
      }
    }

    if (f.action.elapsed >= f.action.duration) {
      f.action = null;
      f.state = "idle";
    }
  }

  function specialProfile(f, type) {
    const id = f.character.id;
    const family = finisherFamily(id);
    const fx = finisherFx(id, f.palette);
    const familyStyle = powerFamilyStyle(family);
    const tuned = familyStyle?.[type] || familyStyle?.special || {};
    if (type === "beam") {
      return {
        kind: tuned.kind || (family === "flame" ? "flameBeam" : family === "bone" ? "boneBeam" : family === "shadow" ? "shadowBeam" : "beam"),
        color: fx.primary,
        trail: fx.secondary,
        radius: tuned.radius ?? (family === "quake" ? 20 : 14),
        speed: tuned.speed ?? (family === "beam" ? 860 : 740),
        damage: tuned.damage ?? (family === "beam" ? 13 : 11),
        stun: 500,
        knockback: family === "quake" ? 400 : 290,
        meterGain: tuned.meterGain ?? 5,
        centerY: 82,
        juice: familyStyle?.juicefx || null,
        pixelfx: familyStyle?.pixelfx || null,
        spritemancer: familyStyle?.spritemancer || null,
      };
    }
    if (type === "surge") {
      return {
        kind: tuned.kind || (family === "rush" ? "fan" : "surge"),
        color: fx.primary,
        trail: fx.secondary,
        radius: tuned.radius ?? 12,
        speed: tuned.speed ?? (family === "rush" ? 690 : 610),
        damage: tuned.damage ?? 7,
        stun: 330,
        knockback: 180,
        meterGain: tuned.meterGain ?? 4,
        centerY: 82,
        juice: familyStyle?.juicefx || null,
        pixelfx: familyStyle?.pixelfx || null,
        spritemancer: familyStyle?.spritemancer || null,
      };
    }
    return {
      kind: tuned.kind || "bolt",
      color: f.isPlayer ? f.palette.meter : "#bb68ff",
      trail: f.palette.accent,
      radius: tuned.radius ?? 15,
      speed: tuned.speed ?? 620,
      damage: tuned.damage ?? 9,
      stun: 380,
      knockback: 250,
      meterGain: tuned.meterGain ?? 6,
      centerY: 82,
      juice: familyStyle?.juicefx || null,
      pixelfx: familyStyle?.pixelfx || null,
      spritemancer: familyStyle?.spritemancer || null,
    };
  }

  function applyJuiceFx(profile, scale = 1) {
    if (!profile?.juice) return;
    const juice = profile.juice;
    if (juice.shake) game.shake = Math.max(game.shake, juice.shake * 100 * scale);
    if (juice.flash) game.flash = Math.max(game.flash, juice.flash * scale);
    if (juice.hitstopMs) game.hitStop = Math.max(game.hitStop, Math.min(180, juice.hitstopMs * scale));
  }

  function particleCountForProfile(profile, baseCount) {
    const px = profile?.pixelfx;
    if (!px?.particles) return baseCount;
    return Math.max(4, Math.round(px.particles * (baseCount / 16)));
  }

  function spawnProjectile(f, type = "special") {
    const profile = specialProfile(f, type);
    const baseParticles = type === "beam" ? 16 : 8;
    projectiles.push({
      owner: f,
      x: f.x + f.facing * 48,
      y: f.y - 82,
      vx: f.facing * profile.speed,
      radius: profile.radius,
      life: type === "beam" ? 900 : 1300,
      damage: profile.damage,
      stun: profile.stun,
      knockback: profile.knockback,
      meterGain: profile.meterGain,
      centerY: profile.centerY,
      spark: profile.color,
      color: profile.color,
      trail: profile.trail,
      kind: profile.kind,
      juice: profile.juice,
      pixelfx: profile.pixelfx,
      spritemancer: profile.spritemancer,
    });
    applyJuiceFx(profile, 0.65);
    addHitParticles(f.x + f.facing * 42, f.y - 82, profile.color, particleCountForProfile(profile, baseParticles));
    if (profile.pixelfx?.glitch) {
      addHitParticles(f.x + f.facing * 36 + (Math.random() - 0.5) * 10, f.y - 78, profile.trail, Math.round(profile.pixelfx.glitch * 24));
    }
  }

  function updateProjectiles(dt) {
    for (const p of projectiles) {
      p.x += p.vx * dt / 1000;
      p.life -= dt;
      const target = p.owner === player ? enemy : player;
      const box = { x: p.x - p.radius, y: p.y - p.radius, w: p.radius * 2, h: p.radius * 2 };
      if (rectsOverlap(box, bodyBox(target)) && game.phase === "fight") {
        p.life = 0;
        applyHit(p.owner, target, p, p.x);
      }
    }
    projectiles = projectiles.filter((p) => p.life > 0 && p.x > -60 && p.x < W + 60);
  }

  function updateFighter(f, opponent, dt) {
    if (f.health > 0 && game.phase !== "finisher" && !f.action) f.facing = toward(f, opponent);
    if (f.cooldown > 0) f.cooldown -= dt;
    if (f.stun > 0) f.stun -= dt;
    if (f.invuln > 0) f.invuln -= dt;
    if (f.comboTimer > 0) f.comboTimer -= dt;
    if (f.comboTimer <= 0) f.combo = 0;

    updateAction(f, opponent, dt);

    if (game.phase === "finishPrompt" && f.health <= 0) {
      if (f.finishAnchorX !== null) f.x = f.finishAnchorX;
      f.vx = 0;
      f.vy = 0;
      f.y = FLOOR;
      f.grounded = true;
      f.state = "dizzy";
      return;
    }

    if (!f.grounded) f.vy += GRAVITY * dt / 1000;
    f.x += f.vx * dt / 1000;
    f.y += f.vy * dt / 1000;

    if (f.y >= FLOOR) {
      const wasAirborne = !f.grounded;
      f.y = FLOOR;
      f.vy = 0;
      f.grounded = true;
      if (wasAirborne) {
        try { spawnDustJuice(f, 1); } catch (_) {}
      }
    }

    if (f.grounded && !f.action && f.stun <= 0) f.vx *= Math.pow(0.0008, dt / 1000);
    f.x = clamp(f.x, LEFT_WALL, RIGHT_WALL);

    if (f.health > 0 && f.stun <= 0 && !f.action) {
      if (f.block) f.state = "block";
      else if (f.crouch) f.state = "crouch";
      else if (!f.grounded) f.state = "jump";
      else if (Math.abs(f.vx) > 25) f.state = "walk";
      else f.state = "idle";
    }
  }

  function separateFighters() {
    if (game.phase === "finisher" || game.phase === "finishPrompt" || player.health <= 0 || enemy.health <= 0) return;
    const minDist = 54;
    const dx = enemy.x - player.x;
    const overlap = minDist - Math.abs(dx);
    if (overlap <= 0) return;
    // When one fighter is pinned against a wall, push only the other one;
    // the old 50/50 split clamped into the wall and let bodies overlap.
    const playerAtLeft = player.x <= LEFT_WALL + 1;
    const playerAtRight = player.x >= RIGHT_WALL - 1;
    const enemyAtLeft = enemy.x <= LEFT_WALL + 1;
    const enemyAtRight = enemy.x >= RIGHT_WALL - 1;
    const pushBoth = (a, b, dir) => {
      const aNew = clamp(a.x + dir * overlap / 2, LEFT_WALL, RIGHT_WALL);
      const aMoved = Math.abs(aNew - a.x);
      a.x = aNew;
      // If a hit the wall, hand the unmoved remainder to b.
      b.x = clamp(b.x - dir * (overlap - aMoved), LEFT_WALL, RIGHT_WALL);
    };
    if (dx >= 0) {
      if (enemyAtRight && !playerAtLeft) player.x = clamp(player.x - overlap, LEFT_WALL, RIGHT_WALL);
      else if (playerAtLeft && !enemyAtRight) enemy.x = clamp(enemy.x + overlap, LEFT_WALL, RIGHT_WALL);
      else pushBoth(enemy, player, 1);
    } else {
      if (playerAtRight && !enemyAtLeft) enemy.x = clamp(enemy.x - overlap, LEFT_WALL, RIGHT_WALL);
      else if (enemyAtLeft && !playerAtRight) player.x = clamp(player.x + overlap, LEFT_WALL, RIGHT_WALL);
      else pushBoth(player, enemy, 1);
    }
  }

  function updateParticles(dt) {
    updateImpactVfx(dt);
    updateJuiceSprites(dt);
    for (const p of particles) {
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.vy += 920 * dt / 1000;
      p.life -= dt;
    }
    particles = particles.filter((p) => p.life > 0);

    for (const drop of blood) {
      drop.x += drop.vx * dt / 1000;
      drop.y += drop.vy * dt / 1000;
      drop.vy += 1180 * dt / 1000;
      drop.vx *= Math.pow(0.12, dt / 1000);
      drop.life -= dt;
      if (drop.y >= FLOOR + 4 && drop.life > 0) {
        addStain(drop.x, FLOOR + 4, drop.size * (1.7 + Math.random() * 1.6), drop.color);
        drop.life = 0;
      }
    }
    blood = blood.filter((drop) => drop.life > 0 && drop.x > -80 && drop.x < W + 80 && drop.y < H + 30);

    for (const stain of stains) stain.life -= dt;
    stains = stains.filter((stain) => stain.life > 0);

    for (const image of afterImages) image.life -= dt;
    afterImages = afterImages.filter((image) => image.life > 0);
  }

  function updateCountdown(dt) {
    game.countdown -= dt / 1000;
    if (game.countdown > 2.35) showMessage("3", "Get ready");
    else if (game.countdown > 1.35) showMessage("2", "Guard high");
    else if (game.countdown > 0.35) showMessage("1", "Meter starts live");
    else if (game.countdown > 0) showMessage("Fight", "");
    else {
      hideMessage();
      game.phase = "fight";
      game.roundStartWall = performance.now();
    }
  }

  function updateFightClock(dt) {
    // Wall-clock timer: the old dt-accumulator ran slow whenever frames
    // ran long (dt is capped at 34ms), so 99s rounds dragged past 3 minutes.
    if (game.roundStartWall != null) {
      game.roundTime = Math.max(0, 99 - Math.floor((performance.now() - game.roundStartWall) / 1000));
    } else {
      game.timerAcc += dt;
      while (game.timerAcc >= 1000) {
        game.timerAcc -= 1000;
        game.roundTime = Math.max(0, game.roundTime - 1);
      }
    }
    if (game.roundTime <= 0) {
      if (player.health >= enemy.health) {
        enemy.health = 0;
        enemy.state = "dizzy";
        try { spawnKoImpactVfx(enemy); } catch (_) {}
        game.phase = "finishPrompt";
        game.finishTimer = 5.5;
        showMessage("Finish Them", "Riftality · Power overload · Uppercut on launch maps");
      } else {
        try { spawnKoImpactVfx(player); } catch (_) {}
        startBotRiftality();
      }
    }
  }

  function updateFinishPrompt(dt) {
    enemy.state = "dizzy";
    enemy.stun = 9999;
    game.finishTimer -= dt / 1000;
    if (game.finishTimer <= 0) {
      enemy.state = "ko";
      endMatch(`${player.name} Wins`);
    }
  }

  function updateTankFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const farX = tankFarEdgeX(dir);
    const audio = gameAudio();

    player.facing = dir;
    enemy.facing = -dir;
    player.state = "finisher";
    enemy.state = t < 1880 ? "dizzy" : "finisherHit";

    if (!game.finisher.tankAudioRoll && t > 120 && t < 700) {
      game.finisher.tankAudioRoll = true;
      audio?.playTankRoll?.();
    }

    if (t < 520) {
      player.x = farX;
      player.y = FLOOR;
      game.finisher.tankX = farX + (dir > 0 ? -140 : 140);
      game.finisher.playerInTank = false;
    } else if (t < 980) {
      const p = (t - 520) / 460;
      game.finisher.tankX = farX + (dir > 0 ? -140 + p * 120 : 140 - p * 120);
      player.x = farX;
      player.y = FLOOR;
    } else if (t < 1260) {
      game.finisher.tankX = farX + (dir > 0 ? -20 : 20);
      const jp = (t - 980) / 280;
      player.x = farX + (dir > 0 ? -8 : 8);
      player.y = FLOOR - Math.sin(jp * Math.PI) * 42;
      game.finisher.playerInTank = jp > 0.72;
    } else if (t < 1500) {
      game.finisher.tankX = farX + (dir > 0 ? -20 : 20);
      player.x = game.finisher.tankX;
      player.y = FLOOR - 18;
      game.finisher.playerInTank = true;
    } else if (t < 1660) {
      if (!game.finisher.shellFired) {
        game.finisher.shellFired = true;
        audio?.playTankFire?.();
        game.finisher.shellX = game.finisher.tankX + dir * 34;
        game.shake = 14;
      }
      player.x = game.finisher.tankX;
      player.y = FLOOR - 18;
    } else if (t < 1880) {
      const sp = (t - 1660) / 220;
      const travel = Math.abs(enemy.x - game.finisher.tankX) - 20;
      game.finisher.shellX = game.finisher.tankX + dir * (34 + sp * travel);
      player.x = game.finisher.tankX;
      player.y = FLOOR - 18;
    } else if (t < 2600) {
      if (!game.finisher.shellHit) {
        game.finisher.shellHit = true;
        audio?.playExplosion?.();
        game.shake = 28;
        game.flash = 0.75;
      }
      processFatalityBursts(t);
      enemy.health = 0;
      enemy.y = FLOOR + 8;
      if (t % 55 < 18) addGore(enemy.x, enemy.y - 70, dir, 16, true);
    } else if (t < 3400) {
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 2680) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
      enemy.state = "ko";
      player.state = "idle";
      enemy.y = FLOOR;
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch(`${player.name} Wins · Riftality`);
      game.flash = 0.35;
    }
  }

  function updateKingGroundWaveFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const startX = game.finisher.playerStartX;
    const farX = clamp(game.finisher.enemyStartX - dir * 330, LEFT_WALL + 42, RIGHT_WALL - 42);
    const slamX = clamp(farX + dir * 72, LEFT_WALL + 42, RIGHT_WALL - 42);
    const audio = gameAudio();

    player.facing = dir;
    enemy.facing = -dir;
    player.state = "finisher";
    enemy.state = t < 2860 ? "dizzy" : "finisherHit";
    enemy.x = clamp(game.finisher.enemyStartX + (t > 2860 ? Math.sin(t / 28) * 5 : 0), LEFT_WALL, RIGHT_WALL);
    enemy.y = FLOOR;

    if (t < 460) {
      const p = smoothStep(t / 460);
      player.x = mix(startX, farX, p);
      player.y = FLOOR - Math.sin(p * Math.PI) * 118;
      player.state = "jump";
    } else if (t < 1560) {
      player.x = farX;
      player.y = FLOOR;
      player.state = "idle";
      if (t % 95 < 24) addHitParticles(player.x + dir * 16, player.y - 136, player.palette.meter, 1);
    } else if (t < 2240) {
      const p = (t - 1560) / 680;
      player.x = mix(farX, slamX, p);
      player.y = FLOOR - Math.sin(p * Math.PI) * 168;
      player.state = "jump";
    } else if (t < 2540) {
      const p = smoothStep((t - 2240) / 300);
      player.x = slamX;
      player.y = FLOOR - (1 - p) * 44;
      player.state = "heavy";
      if (!game.finisher.slamAudio && t > 2360) {
        game.finisher.slamAudio = true;
        game.finisher.waveStartX = player.x + dir * 42;
        audio?.playExplosion?.();
        game.shake = Math.max(game.shake, 30);
        game.flash = Math.max(game.flash, 0.42);
        addStain(player.x + dir * 48, FLOOR + 4, 58, "#4a3020");
      }
    } else if (t < 3320) {
      player.x = slamX;
      player.y = FLOOR;
      player.state = "heavy";
      game.shake = Math.max(game.shake, t < 3050 ? 24 : 12);
      processFatalityBursts(t);
      if (t > 2840 && !game.finisher.waveImpact) {
        game.finisher.waveImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.65);
        game.shake = Math.max(game.shake, 38);
        addGore(enemy.x, enemy.y - 88, dir, 86, true);
        spawnGoreChunks(enemy.x, enemy.y - 88, dir, 54, "heavy");
      }
      if (t > 2860) {
        enemy.health = 0;
        enemy.y = FLOOR + Math.sin(t / 40) * 5;
      }
    } else if (t < 4200) {
      processFatalityBursts(t);
      player.state = "idle";
      player.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      enemy.y += (FLOOR - enemy.y) * 0.08;
      if (!game.finisher.announced && t > 3420) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch(player.character.finisher);
      game.flash = 0.35;
    }
  }

  function updateSpar7anSpearFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();
    const aimX = enemy.x - dir * 16;
    const aimY = enemy.y - 96;

    player.facing = dir;
    enemy.facing = -dir;
    player.state = t < 760 ? "idle" : t < 1720 ? "special" : "finisher";
    enemy.state = t < 1380 ? "dizzy" : "finisherHit";
    player.x = clamp(game.finisher.enemyStartX - dir * 184, LEFT_WALL + 42, RIGHT_WALL - 42);
    player.y = FLOOR;
    enemy.x = clamp(game.finisher.enemyStartX + (t > 1380 ? Math.sin(t / 30) * 4 : 0), LEFT_WALL, RIGHT_WALL);
    enemy.y = FLOOR;
    const spearBaseX = player.x + dir * 30;
    const spearBaseY = player.y - 102;

    if (t < 760) {
      const p = smoothStep(t / 760);
      game.finisher.spearTipX = spearBaseX + dir * mix(18, 82, p);
      game.finisher.spearTipY = spearBaseY - 18 + Math.sin(p * Math.PI) * -16;
      if (t % 95 < 22) addHitParticles(player.x + dir * 42, player.y - 112, player.palette.meter, 1);
    } else if (t < 1380) {
      const p = smoothStep((t - 760) / 620);
      player.x = clamp(game.finisher.enemyStartX - dir * mix(184, 150, p), LEFT_WALL + 42, RIGHT_WALL - 42);
      game.finisher.spearTipX = mix(spearBaseX + dir * 86, aimX, p);
      game.finisher.spearTipY = mix(spearBaseY - 10, aimY, p);
      game.shake = Math.max(game.shake, 5 + p * 8);
    } else if (t < 2260) {
      if (!game.finisher.spearImpact) {
        game.finisher.spearImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.45);
        game.shake = Math.max(game.shake, 26);
        addGore(enemy.x, aimY, dir, 46, true);
        spawnGoreChunks(enemy.x, aimY, dir, 28, "heavy");
      }
      game.finisher.spearTipX = aimX + Math.sin(t / 24) * 6;
      game.finisher.spearTipY = aimY + Math.sin(t / 30) * 4;
      processFatalityBursts(t);
      enemy.health = 0;
      enemy.y = FLOOR + Math.sin(t / 38) * 4;
      if (t % 72 < 20) addGore(enemy.x + (Math.random() - 0.5) * 34, enemy.y - 92, dir, 8, true);
    } else if (t < 3160) {
      processFatalityBursts(t);
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      enemy.y += (FLOOR - enemy.y) * 0.08;
      if (!game.finisher.announced && t > 2440) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch(player.character.finisher);
      game.flash = 0.35;
    }
  }

  function updateLazyControllerFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();
    const kitX = player.x + dir * 34;
    const kitY = FLOOR - 54;
    const beatTimes = [360, 520, 660, 780, 900, 1010, 1120, 1230, 1330, 1420, 1510, 1600, 1690, 1780, 1880, 1980, 2080, 2180, 2280, 2380];
    const symbols = ["♪", "♫", "♬", "♩"];
    const spawnDrumNote = (x, y, count = 1) => {
      for (let i = 0; i < count; i += 1) {
        game.finisher.drumNotes.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 26,
          vx: dir * (70 + Math.random() * 160) + (Math.random() - 0.5) * 70,
          vy: -160 - Math.random() * 190,
          rot: (Math.random() - 0.5) * 0.7,
          spin: (Math.random() - 0.5) * 4.4,
          size: 16 + Math.random() * 18,
          life: 720 + Math.random() * 460,
          maxLife: 1180,
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          color: Math.random() > 0.45 ? player.palette.meter : player.palette.accent,
        });
      }
    };

    player.facing = dir;
    enemy.facing = -dir;
    player.x = clamp(game.finisher.enemyStartX - dir * 168, LEFT_WALL + 42, RIGHT_WALL - 42);
    player.y = FLOOR;
    enemy.x = clamp(game.finisher.enemyStartX + (t > 1780 ? Math.sin(t / 18) * 8 : 0), LEFT_WALL, RIGHT_WALL);
    enemy.y = FLOOR;

    while (game.finisher.drumBeatIndex < beatTimes.length && t >= beatTimes[game.finisher.drumBeatIndex]) {
      const beat = game.finisher.drumBeatIndex;
      const hard = beat > 11;
      const target = hard ? enemy : player;
      game.finisher.drumShockwaves.push({
        x: hard ? enemy.x : kitX + Math.sin(beat) * 18,
        y: hard ? enemy.y - 88 : kitY,
        life: hard ? 520 : 420,
        maxLife: hard ? 520 : 420,
        color: beat % 2 ? player.palette.accent : player.palette.meter,
      });
      spawnDrumNote(target.x, hard ? target.y - 104 : kitY - 18, hard ? 4 : 2);
      addHitParticles(hard ? enemy.x : kitX, hard ? enemy.y - 94 : kitY - 18, beat % 2 ? player.palette.accent : player.palette.meter, hard ? 5 : 2);
      game.shake = Math.max(game.shake, hard ? 18 : 6 + beat * 0.3);
      game.finisher.drumBeatIndex += 1;
    }

    if (t < 620) {
      player.state = "idle";
      enemy.state = "dizzy";
      if (t % 150 < 24) spawnDrumNote(kitX, kitY - 18, 1);
    } else if (t < 1780) {
      player.state = "special";
      enemy.state = "dizzy";
      game.shake = Math.max(game.shake, 3 + Math.sin(t / 26) * 3);
    } else if (t < 2720) {
      player.state = "special";
      enemy.state = "finisherHit";
      if (!game.finisher.drumImpact) {
        game.finisher.drumImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.48);
        game.shake = Math.max(game.shake, 24);
        spawnDrumNote(enemy.x, enemy.y - 118, 12);
      }
      processFatalityBursts(t);
      enemy.health = 0;
      if (t % 62 < 22) addGore(enemy.x, enemy.y - 116, dir, 7, true);
    } else if (t < 3560) {
      processFatalityBursts(t);
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "finisherHit";
      if (t % 130 < 22) spawnDrumNote(enemy.x, enemy.y - 110, 2);
      if (!game.finisher.announced && t > 2860) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch(player.character.finisher);
      game.flash = 0.35;
    }

    for (const wave of game.finisher.drumShockwaves) wave.life -= dt;
    game.finisher.drumShockwaves = game.finisher.drumShockwaves.filter((wave) => wave.life > 0);
    for (const note of game.finisher.drumNotes) {
      const step = dt / 1000;
      note.life -= dt;
      note.x += note.vx * step;
      note.y += note.vy * step;
      note.vy += 180 * step;
      note.rot += note.spin * step;
    }
    game.finisher.drumNotes = game.finisher.drumNotes.filter((note) => note.life > 0 && note.y < H + 40);
  }

  function updateNinjaKatanaFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();
    const startX = game.finisher.enemyStartX - dir * 86;
    const passX = game.finisher.enemyStartX + dir * 88;
    const walkX = clamp(game.finisher.enemyStartX + dir * 190, LEFT_WALL + 42, RIGHT_WALL - 42);

    player.facing = dir;
    enemy.facing = -dir;
    player.state = t < 1820 ? "dash" : "walk";
    enemy.state = t < 2680 ? "dizzy" : "finisherHit";
    enemy.x = game.finisher.enemyStartX;
    enemy.y = FLOOR;

    if (t < 560) {
      player.x = startX;
      player.y = FLOOR;
      if (t % 95 < 22) addHitParticles(player.x + dir * 48, player.y - 98, player.palette.meter, 1);
    } else if (t < 1820) {
      const p = smoothStep((t - 560) / 1260);
      player.x = mix(startX, passX, p);
      player.y = FLOOR;
      game.shake = Math.max(game.shake, 5);
      if (t % 170 < 22) {
        addHitParticles(enemy.x + (Math.random() - 0.5) * 44, enemy.y - 102 + (Math.random() - 0.5) * 48, player.palette.meter, 10);
      }
    } else if (t < 2680) {
      const p = smoothStep((t - 1820) / 860);
      player.x = mix(passX, walkX, p);
      player.y = FLOOR;
      player.facing = dir;
      enemy.state = "dizzy";
    } else if (t < 3500) {
      player.x = walkX;
      player.y = FLOOR;
      player.facing = dir;
      player.state = "idle";
      if (!game.finisher.katanaCollapse) {
        game.finisher.katanaCollapse = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.55);
        game.shake = Math.max(game.shake, 30);
      }
      processFatalityBursts(t);
      enemy.health = 0;
      enemy.state = "finisherHit";
    } else {
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch(player.character.finisher);
      game.flash = 0.35;
    }
  }

  function updateGritAirstrikeFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();
    const startX = game.finisher.playerStartX;
    const farX = clamp(game.finisher.enemyStartX - dir * 336, LEFT_WALL + 44, RIGHT_WALL - 44);

    player.facing = dir;
    enemy.facing = -dir;
    player.state = t < 700 ? "dash" : t < 1900 ? "block" : "idle";
    enemy.state = t < 2720 ? "dizzy" : "finisherHit";
    enemy.x = clamp(game.finisher.enemyStartX + (t > 2700 ? Math.sin(t / 24) * 7 : 0), LEFT_WALL, RIGHT_WALL);
    enemy.y = FLOOR;

    if (t < 700) {
      const p = smoothStep(t / 700);
      player.x = mix(startX, farX, p);
      player.y = FLOOR;
      if (t % 80 < 22) {
        afterImages.push({ fighter: player, x: player.x, y: player.y, facing: player.facing, life: 180 });
      }
    } else if (t < 1900) {
      player.x = farX;
      player.y = FLOOR;
      if (!game.finisher.airstrikeCalled && t > 960) {
        game.finisher.airstrikeCalled = true;
        audio?.playClick?.();
      }
      if (t % 130 < 24) addHitParticles(player.x + dir * 28, player.y - 128, player.palette.meter, 1);
    } else if (t < 2380) {
      player.x = farX;
      player.y = FLOOR;
      game.finisher.jetX = mix(dir > 0 ? -170 : W + 170, enemy.x - dir * 160, smoothStep((t - 1900) / 480));
      game.finisher.jetY = 96 + Math.sin(t / 80) * 8;
      game.shake = Math.max(game.shake, 4);
    } else if (t < 2720) {
      const p = smoothStep((t - 2380) / 340);
      player.x = farX;
      player.y = FLOOR;
      game.finisher.jetX = mix(enemy.x - dir * 160, enemy.x + dir * 260, p);
      game.finisher.jetY = 96 + Math.sin(t / 70) * 6;
      if (!game.finisher.bombDropped) {
        game.finisher.bombDropped = true;
        game.finisher.bombX = game.finisher.jetX;
        game.finisher.bombY = game.finisher.jetY + 28;
      }
      game.finisher.bombX = mix(game.finisher.jetX, enemy.x, p);
      game.finisher.bombY = mix(game.finisher.jetY + 28, enemy.y - 72, p);
      game.shake = Math.max(game.shake, 7);
    } else if (t < 3480) {
      player.x = farX;
      player.y = FLOOR;
      game.finisher.jetX += dir * 0.55 * dt;
      if (!game.finisher.bombImpact) {
        game.finisher.bombImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.85);
        game.shake = Math.max(game.shake, 42);
        addGore(enemy.x, enemy.y - 88, dir, 92, true);
        spawnGoreChunks(enemy.x, enemy.y - 88, dir, 68, "heavy");
      }
      processFatalityBursts(t);
      enemy.health = 0;
      enemy.y = FLOOR + Math.sin(t / 26) * 7;
      if (t % 52 < 18) addGore(enemy.x + (Math.random() - 0.5) * 54, enemy.y - 86 + (Math.random() - 0.5) * 66, dir, 16, true);
    } else if (t < 4300) {
      processFatalityBursts(t);
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      enemy.y += (FLOOR - enemy.y) * 0.1;
      if (!game.finisher.announced && t > 3660) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch(player.character.finisher);
      game.flash = 0.35;
    }
  }

  function updateAnthonyNukeFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();
    const commandX = clamp(game.finisher.enemyStartX - dir * 300, LEFT_WALL + 44, RIGHT_WALL - 44);

    player.facing = dir;
    enemy.facing = -dir;
    player.x = commandX;
    player.y = FLOOR;
    player.state = t < 1180 ? "block" : "idle";
    enemy.x = game.finisher.enemyStartX;
    enemy.y = FLOOR;
    enemy.state = t < 2860 ? "dizzy" : "finisherHit";

    if (t < 1180) {
      if (!game.finisher.nukeCalled && t > 420) {
        game.finisher.nukeCalled = true;
        audio?.playClick?.();
      }
      if (t % 110 < 24) addHitParticles(player.x + dir * 28, player.y - 130, "#9cff6b", 1);
    } else if (t < 2240) {
      const p = smoothStep((t - 1180) / 1060);
      game.finisher.warheadX = mix(enemy.x - dir * 280, enemy.x, p);
      game.finisher.warheadY = mix(-120, enemy.y - 90, p);
      game.shake = Math.max(game.shake, 2 + p * 7);
    } else if (t < 2860) {
      const p = smoothStep((t - 2240) / 620);
      game.finisher.warheadX = enemy.x;
      game.finisher.warheadY = mix(enemy.y - 90, FLOOR - 18, p);
      game.shake = Math.max(game.shake, 8 + p * 18);
    } else if (t < 4760) {
      if (!game.finisher.nukeImpact) {
        game.finisher.nukeImpact = true;
        audio?.playExplosion?.();
        game.flash = 1;
        game.shake = Math.max(game.shake, 72);
        game.hitStop = Math.max(game.hitStop, 120);
        processFatalityBursts(t);
        spawnGoreChunks(enemy.x, enemy.y - 72, dir, 36, "heavy");
      }
      enemy.health = 0;
      enemy.state = "finisherHit";
      game.shake = Math.max(game.shake, Math.max(0, 44 - (t - 2860) * 0.025));
      if (t % 60 < 20) {
        addHitParticles(enemy.x + (Math.random() - 0.5) * 260, FLOOR - 80 - Math.random() * 220, "#ffb42e", 5);
      }
      if (!game.finisher.announced && t > 4080) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Nuclear Option");
      game.flash = 0.35;
    }
  }

  function updatePlotPulseUfoFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();
    const summonX = clamp(game.finisher.enemyStartX - dir * 190, LEFT_WALL + 42, RIGHT_WALL - 42);

    player.x = summonX;
    player.y = FLOOR;
    player.facing = dir;
    player.state = t < 900 ? "special" : "idle";
    enemy.x = game.finisher.enemyStartX + Math.sin(t / 90) * (t > 1200 ? 3 : 1);
    enemy.facing = -dir;
    enemy.state = t < 1500 ? "dizzy" : "finisherHit";

    if (t < 1450) {
      enemy.y = FLOOR;
      if (t > 420 && t % 170 < 26) {
        addHitParticles(player.x + dir * 28, player.y - 130, player.palette.meter, 2);
      }
    } else if (t < 3150) {
      const lift = smoothStep((t - 1450) / 1700);
      enemy.y = mix(FLOOR, -170, lift);
      game.finisher.ufoPulse = lift;
      game.shake = Math.max(game.shake, 4 + lift * 7);
      if (!game.finisher.abductionStarted) {
        game.finisher.abductionStarted = true;
        audio?.playSpecial?.();
        game.flash = Math.max(game.flash, 0.42);
      }
      if (t % 90 < 22) {
        addHitParticles(enemy.x + (Math.random() - 0.5) * 42, enemy.y - 80 + (Math.random() - 0.5) * 82, player.palette.meter, 3);
      }
    } else if (t < 3900) {
      enemy.y = -170;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      if (!game.finisher.announced && t > 3350) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = -170;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Fleet Abduction");
      game.flash = 0.28;
    }
  }

  function updateDragonSkyFeastFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const audio = gameAudio();
    const startX = game.finisher.playerStartX;
    const targetX = game.finisher.enemyStartX;

    player.facing = 1;
    player.state = "jump";
    enemy.facing = -1;

    if (t < 760) {
      const p = smoothStep(t / 760);
      player.x = mix(startX, -150, p);
      player.y = mix(FLOOR, -190, p);
      enemy.x = targetX;
      enemy.y = FLOOR;
      enemy.state = "dizzy";
    } else if (t < 1540) {
      const p = smoothStep((t - 760) / 780);
      player.x = mix(-150, targetX - 54, p);
      player.y = mix(210, FLOOR - 72, p);
      enemy.x = targetX;
      enemy.y = FLOOR;
      enemy.state = "dizzy";
      game.shake = Math.max(game.shake, 3 + p * 5);
    } else if (t < 2820) {
      const p = smoothStep((t - 1540) / 1280);
      if (!game.finisher.dragonGrabbed) {
        game.finisher.dragonGrabbed = true;
        audio?.playHit?.();
        game.flash = Math.max(game.flash, 0.3);
        game.shake = Math.max(game.shake, 18);
      }
      player.x = mix(targetX - 54, W * 0.5 - 50, p);
      player.y = mix(FLOOR - 72, 154, p);
      enemy.x = player.x + 56;
      enemy.y = player.y + 86;
      enemy.state = "finisherHit";
      game.shake = Math.max(game.shake, 5);
    } else if (t < 3300) {
      player.x = W * 0.5 - 50;
      player.y = 154 + Math.sin(t / 90) * 5;
      enemy.x = player.x + 56;
      enemy.y = player.y + 86;
      enemy.state = "finisherHit";
      if (!game.finisher.dragonBitHead && t > 2920) {
        game.finisher.dragonBitHead = true;
        enemy.detachedParts.add("head");
        enemy.health = 0;
        audio?.playHit?.();
        game.flash = Math.max(game.flash, 0.72);
        game.shake = Math.max(game.shake, 30);
        addGore(enemy.x, enemy.y - 136, -1, 42, true);
        spawnGoreChunks(enemy.x, enemy.y - 136, -1, 18, "heavy");
      }
    } else if (t < 4140) {
      const p = smoothStep((t - 3300) / 840);
      player.x = W * 0.5 - 50;
      player.y = 154 + Math.sin(t / 90) * 5;
      player.state = "idle";
      enemy.x = mix(player.x + 56, targetX, p);
      enemy.y = mix(player.y + 86, FLOOR, p);
      enemy.health = 0;
      enemy.state = "ko";
      if (p > 0.82) game.shake = Math.max(game.shake, 12);
    } else if (t < 4720) {
      player.x = W * 0.5 - 50;
      player.y = mix(154, FLOOR, smoothStep((t - 4140) / 580));
      player.state = "jump";
      enemy.x = targetX;
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      if (!game.finisher.announced && t > 4380) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      player.y = FLOOR;
      player.state = "idle";
      enemy.x = targetX;
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      endMatch("Sky Feast");
      game.flash = 0.32;
    }
  }

  function updateDragonBornStormBreathFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();

    player.x = game.finisher.playerStartX;
    player.y = FLOOR;
    player.facing = dir;
    player.state = t < 1050 ? "special" : "heavy";
    enemy.x = game.finisher.enemyStartX;
    enemy.y = FLOOR;
    enemy.facing = -dir;
    enemy.state = t < 1450 ? "dizzy" : t < 2600 ? "finisherHit" : "ko";

    if (t < 1050) {
      const charge = clamp(t / 1050, 0, 1);
      game.shake = Math.max(game.shake, charge * 5);
      if (t % 90 < 22) {
        addHitParticles(player.x + dir * 38, player.y - 132, player.palette.meter, 3);
      }
    } else if (t < 2380) {
      game.shake = Math.max(game.shake, 11);
      if (!game.finisher.stormBreathImpact && t > 1450) {
        game.finisher.stormBreathImpact = true;
        detachFatalityParts(enemy, { parts: ["head"], gore: 58, force: 3.2, spray: "heavy" }, dir);
        enemy.health = 0;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.86);
        game.shake = Math.max(game.shake, 38);
      }
      if (t % 65 < 20) {
        addHitParticles(enemy.x + (Math.random() - 0.5) * 34, enemy.y - 138 + (Math.random() - 0.5) * 24, player.palette.meter, 4);
      }
    } else if (t < 3300) {
      enemy.health = 0;
      enemy.state = "ko";
      enemy.y = FLOOR;
      player.state = "idle";
      if (!game.finisher.announced && t > 2700) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.health = 0;
      enemy.state = "ko";
      enemy.y = FLOOR;
      player.state = "idle";
      endMatch("Storm Breath");
      game.flash = 0.3;
    }
  }

  function updateBoneHeadSwapFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();
    const startX = game.finisher.playerStartX;
    const enemyHeadStartX = game.finisher.enemyStartX;
    const throwStartX = startX + dir * 26;
    const throwStartY = FLOOR - 142;
    const enemyHeadY = FLOOR - 142;
    const groundY = FLOOR - 24;
    const pickupX = clamp(enemy.x - dir * 28, LEFT_WALL + 42, RIGHT_WALL - 42);

    player.facing = dir;
    enemy.facing = -dir;
    player.y = FLOOR;
    enemy.y = FLOOR;
    enemy.x = game.finisher.enemyStartX;
    player.state = t < 620 ? "block" : t < 1280 ? "special" : t < 2220 ? "walk" : "idle";
    enemy.state = t < 980 ? "dizzy" : "finisherHit";

    if (t > 260) {
      if (!player.detachedParts) player.detachedParts = new Set();
      player.detachedParts.add("head");
    }

    if (t < 520) {
      const p = smoothStep(t / 520);
      player.x = startX;
      game.finisher.skullX = player.x + dir * mix(0, 30, p);
      game.finisher.skullY = FLOOR - mix(142, 104, p);
      if (t % 100 < 24) addHitParticles(player.x + dir * 22, FLOOR - 132, player.palette.white, 1);
    } else if (t < 1040) {
      const p = smoothStep((t - 520) / 520);
      player.x = startX;
      game.finisher.skullX = mix(throwStartX, enemyHeadStartX, p);
      game.finisher.skullY = mix(throwStartY, enemyHeadY, p) - Math.sin(p * Math.PI) * 78;
      if (!game.finisher.skullThrown) {
        game.finisher.skullThrown = true;
        audio?.playWhoosh?.();
      }
    } else if (t < 1500) {
      player.x = startX;
      game.finisher.skullX = enemyHeadStartX + dir * 26 + Math.sin(t / 26) * 4;
      game.finisher.skullY = enemyHeadY + Math.sin(t / 32) * 4;
      if (!game.finisher.enemyHeadLoose) {
        game.finisher.enemyHeadLoose = true;
        enemy.detachedParts.add("head");
        audio?.playHit?.();
        game.flash = Math.max(game.flash, 0.35);
        game.shake = Math.max(game.shake, 24);
        addGore(enemy.x, enemy.y - 140, dir, 46, true);
        spawnGoreChunks(enemy.x, enemy.y - 140, dir, 22, "bone");
      }
      const fall = smoothStep((t - 1040) / 460);
      game.finisher.enemyHeadX = enemyHeadStartX + dir * mix(0, 44, fall);
      game.finisher.enemyHeadY = mix(enemyHeadY, groundY, fall);
    } else if (t < 2180) {
      const p = smoothStep((t - 1500) / 680);
      player.x = mix(startX, pickupX, p);
      game.finisher.enemyHeadX = enemyHeadStartX + dir * 44;
      game.finisher.enemyHeadY = groundY;
      game.finisher.skullY = groundY;
      game.finisher.skullX = enemyHeadStartX + dir * 82;
    } else if (t < 2820) {
      player.x = pickupX;
      const p = smoothStep((t - 2180) / 640);
      if (!game.finisher.enemyHeadPicked && t > 2260) {
        game.finisher.enemyHeadPicked = true;
        audio?.playClick?.();
      }
      game.finisher.enemyHeadX = mix(enemyHeadStartX + dir * 44, player.x + dir * 8, p);
      game.finisher.enemyHeadY = mix(groundY, FLOOR - 145, p);
      game.finisher.skullX = enemyHeadStartX + dir * 82;
      game.finisher.skullY = groundY;
    } else if (t < 3860) {
      player.x = pickupX;
      game.finisher.boneWearsEnemyHead = true;
      game.finisher.enemyHeadX = player.x;
      game.finisher.enemyHeadY = FLOOR - 145;
      enemy.health = 0;
      enemy.state = "ko";
      enemy.y = FLOOR;
      if (!game.finisher.announced && t > 3160) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch(player.character.finisher);
      game.flash = 0.35;
    }
  }

  function updateJennyReplayFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("jenny-night-signal", player.palette);
    player.facing = dir;
    enemy.facing = -dir;
    player.vx = 0;
    enemy.vx = 0;
    enemy.y = FLOOR;
    if (game.finisher.replaySignalBoost) game.signalBufferTimer = Math.max(game.signalBufferTimer, t < 2360 ? 220 : 0);

    if (t < 620) {
      player.state = "walk";
      enemy.state = "dizzy";
      player.x = clamp(game.finisher.enemyStartX - dir * (120 + t * 0.05), LEFT_WALL + 42, RIGHT_WALL - 42);
      if (t % 95 < 24) addHitParticles(player.x + dir * 12, player.y - 136, fx.primary, 2);
    } else if (t < 1450) {
      player.state = "block";
      enemy.state = Math.floor(t / 170) % 2 ? "heavy" : "light";
      enemy.x = game.finisher.enemyStartX + Math.sin(t / 32) * 4;
      game.shake = Math.max(game.shake, 7);
      if (t % 110 < 28) {
        afterImages.push({ fighter: enemy, x: enemy.x - dir * (18 + Math.random() * 42), y: enemy.y, facing: enemy.facing, life: 260 });
        addHitParticles(enemy.x + (Math.random() - 0.5) * 55, enemy.y - 92 + (Math.random() - 0.5) * 55, Math.random() > 0.5 ? fx.primary : fx.secondary, 3);
      }
    } else if (t < 2480) {
      player.state = "special";
      enemy.state = Math.floor(t / 130) % 2 ? "upper" : "heavy";
      enemy.x = game.finisher.enemyStartX + Math.sin(t / 24) * 7;
      game.finisher.replayMaskAlpha = clamp((t - 1450) / 760, 0, 1);
      if (t % 85 < 22) {
        game.finisher.replayGhosts.push({
          x: enemy.x + (Math.random() - 0.5) * 80,
          y: enemy.y - 120 + (Math.random() - 0.5) * 35,
          life: 520,
          maxLife: 520,
        });
      }
    } else if (t < 3420) {
      player.state = "idle";
      enemy.state = "dizzy";
      game.finisher.replayMaskAlpha = 1;
      game.finisher.replayEchoAlpha = clamp((t - 2480) / 620, 0, 1);
      enemy.x += dir * 0.05 * dt;
      enemy.y = FLOOR - Math.sin((t - 2480) / 940 * Math.PI) * 24;
      game.flash = Math.max(game.flash, 0.05);
      if (!game.finisher.announced && t > 2940) {
        game.finisher.announced = true;
        gameAudio()?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("The 3:33 Replay", "That was not me. Not all of it.");
      game.flash = 0.25;
    }

    for (const ghost of game.finisher.replayGhosts) ghost.life -= dt;
    game.finisher.replayGhosts = game.finisher.replayGhosts.filter((ghost) => ghost.life > 0);
  }

  function updateSableRewriteFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("sable", player.palette);
    const audio = gameAudio();
    player.facing = dir;
    enemy.facing = -dir;
    player.vx = 0;
    enemy.vx = 0;
    enemy.y = FLOOR;

    if (t < 620) {
      player.state = "block";
      enemy.state = "dizzy";
      player.x = clamp(game.finisher.enemyStartX - dir * 132, LEFT_WALL + 42, RIGHT_WALL - 42);
      if (t % 100 < 26) addHitParticles(player.x + dir * 12, player.y - 142, fx.secondary, 2);
    } else if (t < 1760) {
      player.state = "dash";
      enemy.state = "dizzy";
      const markTimes = [680, 910, 1140, 1370, 1600];
      const index = Math.min(markTimes.length - 1, Math.max(0, markTimes.findIndex((mark) => t < mark + 190)));
      const side = index % 2 === 0 ? -1 : 1;
      player.x = clamp(enemy.x + dir * side * (82 + Math.sin(t / 45) * 20), LEFT_WALL + 42, RIGHT_WALL - 42);
      if (t % 82 < 24) {
        afterImages.push({ fighter: player, x: player.x - dir * side * 32, y: player.y, facing: player.facing, life: 180 });
        addHitParticles(enemy.x + (Math.random() - 0.5) * 62, enemy.y - 105 + (Math.random() - 0.5) * 70, fx.primary, 4);
      }
      game.shake = Math.max(game.shake, 5);
    } else if (t < 2620) {
      player.state = "special";
      enemy.state = Math.floor(t / 120) % 2 ? "heavy" : "upper";
      enemy.x = game.finisher.enemyStartX + Math.sin(t / 22) * 8;
      enemy.y = FLOOR - Math.sin((t - 1760) / 860 * Math.PI) * 22;
      if (t % 95 < 24) {
        game.finisher.rewriteGhosts.push({ x: enemy.x + (Math.random() - 0.5) * 80, y: enemy.y - 112 + (Math.random() - 0.5) * 50, life: 420, maxLife: 420 });
      }
      if (t > 2140 && !game.finisher.rewriteImpact) {
        game.finisher.rewriteImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.42);
        game.shake = Math.max(game.shake, 25);
      }
      processFatalityBursts(t);
    } else if (t < 3440) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "finisherHit";
      enemy.y += (FLOOR - enemy.y) * 0.12;
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 2860) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Marked For Rewrite");
      game.flash = 0.35;
    }

    for (const ghost of game.finisher.rewriteGhosts) ghost.life -= dt;
    game.finisher.rewriteGhosts = game.finisher.rewriteGhosts.filter((ghost) => ghost.life > 0);
  }

  function updateJakeFourthDownFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("jake", player.palette);
    const audio = gameAudio();
    const startX = game.finisher.playerStartX;
    const batterBoxX = clamp(game.finisher.enemyStartX - dir * 118, LEFT_WALL + 42, RIGHT_WALL - 42);
    const impactX = game.finisher.enemyStartX - dir * 36;

    player.facing = dir;
    enemy.facing = -dir;
    player.y = FLOOR;
    enemy.x = game.finisher.enemyStartX;

    if (t < 560) {
      player.state = "dash";
      enemy.state = "dizzy";
      enemy.y = FLOOR;
      const p = smoothStep(t / 560);
      player.x = mix(startX, batterBoxX, p);
      if (t % 80 < 22) afterImages.push({ fighter: player, x: player.x - dir * 26, y: player.y, facing: player.facing, life: 170 });
    } else if (t < 1180) {
      player.state = "heavy";
      enemy.state = "dizzy";
      enemy.y = FLOOR;
      player.x = batterBoxX;
      if (t % 120 < 26) addHitParticles(player.x + dir * 34, player.y - 112, fx.primary, 2);
    } else if (t < 1580) {
      const p = smoothStep((t - 1180) / 400);
      player.state = "heavy";
      player.x = impactX;
      enemy.state = "finisherHit";
      enemy.y = FLOOR;
      game.shake = Math.max(game.shake, 8 + p * 16);
      enemy.state = "finisherHit";
      if (!game.finisher.batImpact) {
        game.finisher.batImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.7);
        game.shake = Math.max(game.shake, 42);
        addHitParticles(enemy.x, enemy.y - 96, fx.secondary, 28);
        addGore(enemy.x, enemy.y - 92, dir, 12, true);
      }
    } else if (t < 2140) {
      const p = smoothStep((t - 1580) / 560);
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "finisherHit";
      enemy.x = game.finisher.enemyStartX + dir * 46 * p;
      enemy.y = FLOOR + Math.sin(p * Math.PI) * 18;
      if (!game.finisher.bodyImpact && p > 0.72) {
        game.finisher.bodyImpact = true;
        audio?.playHit?.();
        game.shake = Math.max(game.shake, 18);
        addHitParticles(enemy.x, enemy.y - 44, fx.secondary, 8);
      }
    } else if (t < 2740) {
      const p = smoothStep((t - 2140) / 600);
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      enemy.y = FLOOR + p * 34;
      if (!game.finisher.bodyCollapsed && t > 2340) {
        game.finisher.bodyCollapsed = true;
        audio?.playHit?.();
      }
    } else if (t < 4700) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      enemy.y = FLOOR + 34;
      const rise = smoothStep((t - 2740) / 1760);
      game.finisher.ghostAlpha = Math.sin(rise * Math.PI) * 0.95;
      game.finisher.ghostX = enemy.x + Math.sin(t / 210) * (5 + rise * 9);
      game.finisher.ghostY = mix(FLOOR - 70, 34, rise);
      if (!game.finisher.announced && t > 3740) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR + 34;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Fourth Down Miracle");
      game.flash = 0.35;
    }
  }

  function updateControlDubstepFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("control", player.palette);
    const audio = gameAudio();
    player.facing = dir;
    enemy.facing = -dir;
    player.y = FLOOR;
    enemy.y = FLOOR;
    player.x = clamp(game.finisher.enemyStartX - dir * 178, LEFT_WALL + 42, RIGHT_WALL - 42);
    enemy.x = clamp(game.finisher.enemyStartX + (t > 1900 ? Math.sin(t / 18) * 12 : 0), LEFT_WALL, RIGHT_WALL);

    const spawnBassNote = (x, y, burst = 1) => {
      const symbols = ["♪", "♫", "♬", "♩"];
      for (let i = 0; i < burst; i += 1) {
        game.finisher.bassNotes.push({
          x: x + (Math.random() - 0.5) * 54,
          y: y + (Math.random() - 0.5) * 32,
          vx: dir * (42 + Math.random() * 110) + (Math.random() - 0.5) * 70,
          vy: -120 - Math.random() * 170,
          spin: (Math.random() - 0.5) * 4,
          rot: (Math.random() - 0.5) * 0.7,
          size: 18 + Math.random() * 22,
          life: 760 + Math.random() * 520,
          maxLife: 1280,
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          color: Math.random() > 0.45 ? fx.primary : fx.secondary,
        });
      }
    };

    if (t < 880) {
      player.state = "block";
      enemy.state = "dizzy";
      if (t % 95 < 26) addHitParticles(player.x + dir * 24, player.y - 118, fx.primary, 2);
      if (t % 120 < 26) spawnBassNote(player.x + dir * 28, player.y - 128, 1);
    } else if (t < 1900) {
      player.state = "special";
      enemy.state = "dizzy";
      game.shake = Math.max(game.shake, 4 + Math.sin(t / 40) * 4);
      if (t % 150 < 28) game.finisher.bassRings.push({ x: player.x + dir * 36, y: player.y - 94, life: 620, maxLife: 620 });
      if (t % 70 < 24) spawnBassNote(player.x + dir * 42, player.y - 112, 2);
    } else if (t < 2860) {
      player.state = "special";
      enemy.state = "finisherHit";
      game.shake = Math.max(game.shake, 22);
      if (!game.finisher.bassDropped) {
        game.finisher.bassDropped = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.6);
        spawnBassNote(enemy.x, enemy.y - 118, 18);
      }
      processFatalityBursts(t);
      enemy.health = 0;
      enemy.y = FLOOR - Math.abs(Math.sin(t / 74)) * 36;
      if (t % 58 < 18) addHitParticles(enemy.x + (Math.random() - 0.5) * 70, enemy.y - 92 + (Math.random() - 0.5) * 70, Math.random() > 0.5 ? fx.primary : fx.secondary, 5);
      if (t % 42 < 20) spawnBassNote(enemy.x, enemy.y - 96, 4);
    } else if (t < 3820) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      if (t % 110 < 22) spawnBassNote(enemy.x + (Math.random() - 0.5) * 120, enemy.y - 110, 2);
      if (!game.finisher.announced && t > 3140) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Bass Drop Override");
      game.flash = 0.35;
    }

    for (const ring of game.finisher.bassRings) ring.life -= dt;
    game.finisher.bassRings = game.finisher.bassRings.filter((ring) => ring.life > 0);
    for (const note of game.finisher.bassNotes) {
      const step = dt / 1000;
      note.life -= dt;
      note.x += note.vx * step;
      note.y += note.vy * step;
      note.vy += 160 * step;
      note.rot += note.spin * step;
    }
    game.finisher.bassNotes = game.finisher.bassNotes.filter((note) => note.life > 0 && note.y < H + 40);
  }

  function updateMotherShadowFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("the-mother", player.palette);
    const audio = gameAudio();
    player.facing = dir;
    enemy.facing = -dir;
    player.y = FLOOR;
    enemy.y = FLOOR;
    player.x = clamp(game.finisher.enemyStartX - dir * 124, LEFT_WALL + 42, RIGHT_WALL - 42);
    enemy.x = game.finisher.enemyStartX + (t > 1500 ? Math.sin(t / 28) * 7 : 0);

    if (t < 720) {
      player.state = "walk";
      enemy.state = "dizzy";
      if (t % 110 < 28) addHitParticles(player.x + dir * 18, player.y - 130, fx.primary, 2);
    } else if (t < 1660) {
      player.state = "block";
      enemy.state = "dizzy";
      game.shake = Math.max(game.shake, 4 + Math.sin(t / 44) * 3);
      if (t % 86 < 24) addHitParticles(enemy.x - dir * 22, enemy.y - 92, fx.secondary, 3);
    } else if (t < 2700) {
      player.state = "special";
      enemy.state = "finisherHit";
      if (!game.finisher.shadowImpact) {
        game.finisher.shadowImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.42);
        game.shake = Math.max(game.shake, 22);
      }
      processFatalityBursts(t);
      enemy.health = 0;
      enemy.x += dir * 0.12 * dt;
      enemy.y = FLOOR - Math.sin((t - 1660) / 1040 * Math.PI) * 42;
      if (t % 62 < 20) addGore(enemy.x, enemy.y - 88, dir, 6, true);
    } else if (t < 3540) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 2920) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Lights Out, Sweetheart");
      game.flash = 0.3;
    }
  }

  function updateWendigoAntlerFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("wendigo", player.palette);
    const audio = gameAudio();
    const startX = game.finisher.playerStartX;
    const impactX = game.finisher.enemyStartX - dir * 34;
    player.facing = dir;
    enemy.facing = -dir;
    enemy.y = FLOOR;

    if (t < 620) {
      player.state = "block";
      enemy.state = "dizzy";
      player.x = startX;
      if (t % 96 < 24) addHitParticles(player.x + dir * 28, player.y - 150, fx.primary, 2);
    } else if (t < 1360) {
      const p = smoothStep((t - 620) / 740);
      player.state = "dash";
      enemy.state = "dizzy";
      player.x = mix(startX, impactX, p);
      player.y = FLOOR - Math.sin(p * Math.PI) * 18;
      game.shake = Math.max(game.shake, 5 + p * 12);
      if (t % 62 < 20) afterImages.push({ fighter: player, x: player.x - dir * 46, y: player.y, facing: player.facing, life: 160 });
    } else if (t < 2580) {
      player.state = "heavy";
      player.x = impactX;
      enemy.state = "finisherHit";
      enemy.health = 0;
      enemy.x = game.finisher.enemyStartX + dir * Math.sin((t - 1360) / 160) * 36;
      enemy.y = FLOOR - Math.abs(Math.sin((t - 1360) / 360 * Math.PI)) * 54;
      if (!game.finisher.antlerImpact) {
        game.finisher.antlerImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.5);
        game.shake = Math.max(game.shake, 30);
      }
      processFatalityBursts(t);
      if (t % 58 < 20) addGore(enemy.x, enemy.y - 102, dir, 8, true);
    } else if (t < 3500) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 2860) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Antler Peel");
      game.flash = 0.32;
    }
  }

  function updateIceGolemCrushFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("ice-golem", player.palette);
    const audio = gameAudio();
    player.facing = dir;
    enemy.facing = -dir;
    player.x = clamp(game.finisher.enemyStartX - dir * 148, LEFT_WALL + 42, RIGHT_WALL - 42);
    player.y = FLOOR;
    enemy.x = game.finisher.enemyStartX + (t > 1880 ? Math.sin(t / 20) * 7 : 0);
    enemy.y = FLOOR;

    if (t < 760) {
      player.state = "special";
      enemy.state = "dizzy";
      if (t % 80 < 26) addHitParticles(enemy.x + (Math.random() - 0.5) * 44, enemy.y - 90 - Math.random() * 46, fx.primary, 2);
    } else if (t < 1760) {
      player.state = "block";
      enemy.state = "dizzy";
      game.shake = Math.max(game.shake, 5);
      if (t % 70 < 22) addHitParticles(enemy.x + (Math.random() - 0.5) * 62, enemy.y - 115 + (Math.random() - 0.5) * 50, fx.secondary, 3);
    } else if (t < 2840) {
      player.state = t < 2180 ? "heavy" : "upper";
      enemy.state = "finisherHit";
      enemy.health = 0;
      if (!game.finisher.iceImpact) {
        game.finisher.iceImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.7);
        game.shake = Math.max(game.shake, 34);
        spawnGoreChunks(enemy.x, enemy.y - 100, dir, 34, "shatter");
      }
      processFatalityBursts(t);
      if (t % 46 < 20) addHitParticles(enemy.x + (Math.random() - 0.5) * 86, enemy.y - 95 + (Math.random() - 0.5) * 75, Math.random() > 0.5 ? fx.primary : fx.secondary, 4);
    } else if (t < 3660) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 3040) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Glacier Crush");
      game.flash = 0.35;
    }
  }

  function updateBigfootStompFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("bigfoot", player.palette);
    const audio = gameAudio();
    player.facing = dir;
    enemy.facing = -dir;
    player.x = clamp(game.finisher.enemyStartX - dir * 168, LEFT_WALL + 42, RIGHT_WALL - 42);
    player.y = FLOOR;
    enemy.x = game.finisher.enemyStartX + (t > 1900 ? Math.sin(t / 24) * 10 : 0);
    enemy.y = FLOOR;

    if (t < 720) {
      player.state = "block";
      enemy.state = "dizzy";
      if (t % 120 < 28) addHitParticles(player.x + dir * 24, player.y - 60, fx.primary, 2);
    } else if (t < 1620) {
      player.state = "heavy";
      enemy.state = "dizzy";
      game.shake = Math.max(game.shake, 8 + Math.sin(t / 36) * 5);
      if (t % 130 < 32) {
        addHitParticles(enemy.x + (Math.random() - 0.5) * 85, FLOOR - 24, fx.primary, 4);
        spawnGoreChunks(enemy.x, FLOOR - 26, dir, 5, "bone");
      }
    } else if (t < 2700) {
      player.state = "upper";
      enemy.state = "finisherHit";
      enemy.health = 0;
      if (!game.finisher.stompImpact) {
        game.finisher.stompImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.62);
        game.shake = Math.max(game.shake, 44);
        addGore(enemy.x, enemy.y - 78, dir, 70, true);
      }
      processFatalityBursts(t);
      enemy.y = FLOOR + Math.sin(t / 18) * 8;
      if (t % 54 < 22) addGore(enemy.x, enemy.y - 86, dir, 9, true);
    } else if (t < 3600) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 2940) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Timber Stomp");
      game.flash = 0.35;
    }
  }

  function updateRiftSplitFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("rift", player.palette);
    const audio = gameAudio();
    const portalX = game.finisher.riftCenterX;
    const portalY = game.finisher.riftCenterY;
    player.facing = dir;
    enemy.facing = -dir;
    player.y = FLOOR;

    if (t < 620) {
      player.state = "dash";
      enemy.state = "dizzy";
      player.x = clamp(game.finisher.enemyStartX - dir * 112, LEFT_WALL + 42, RIGHT_WALL - 42);
      enemy.x = game.finisher.enemyStartX;
      enemy.y = FLOOR;
      if (t % 80 < 22) addHitParticles(player.x + dir * 42, player.y - 92, fx.primary, 2);
    } else if (t < 1120) {
      const p = smoothStep((t - 620) / 500);
      player.state = "heavy";
      enemy.state = "finisherHit";
      enemy.x = mix(game.finisher.enemyStartX, portalX - dir * 28, p);
      enemy.y = FLOOR - Math.sin(p * Math.PI) * 38;
      game.shake = Math.max(game.shake, 7 + p * 10);
      if (!game.finisher.riftImpact) {
        game.finisher.riftImpact = true;
        game.flash = Math.max(game.flash, 0.35);
        audio?.playHit?.();
      }
      if (t % 48 < 18) addHitParticles(enemy.x, enemy.y - 92, fx.primary, 3);
    } else if (t < 2180) {
      const p = smoothStep((t - 1120) / 1060);
      player.state = "special";
      enemy.state = "dizzy";
      enemy.x = mix(portalX - dir * 28, portalX + dir * 6, p) + Math.sin(t / 22) * 5;
      enemy.y = mix(FLOOR - 20, portalY + 24, p) + Math.sin(t / 30) * 8;
      game.shake = Math.max(game.shake, 10 + p * 12);
      if (t % 54 < 22) addHitParticles(portalX + (Math.random() - 0.5) * 64, portalY + (Math.random() - 0.5) * 92, Math.random() > 0.5 ? fx.primary : fx.secondary, 3);
    } else if (t < 3060) {
      player.state = "special";
      enemy.state = "finisherHit";
      enemy.health = 0;
      enemy.x = portalX + Math.sin(t / 18) * 8;
      enemy.y = portalY + 28 + Math.sin(t / 24) * 12;
      if (!game.finisher.riftSplitImpact) {
        game.finisher.riftSplitImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.72);
        game.shake = Math.max(game.shake, 38);
        addGore(enemy.x, enemy.y - 20, dir, 72, true);
        spawnGoreChunks(enemy.x, enemy.y - 18, dir, 46, "glitch");
      }
      processFatalityBursts(t);
      if (t % 52 < 20) addGore(enemy.x, enemy.y - 24, dir, 8, true);
    } else if (t < 3920) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      enemy.y += (FLOOR - enemy.y) * 0.06;
      if (!game.finisher.announced && t > 3280) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Rift Split");
      game.flash = 0.35;
    }
  }

  function updateAlexCaseClosedFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("alex", player.palette);
    const audio = gameAudio();
    const tagTimes = [720, 960, 1200, 1440, 1680];
    player.facing = dir;
    enemy.facing = -dir;
    player.y = FLOOR;
    enemy.y = FLOOR;
    enemy.x = game.finisher.enemyStartX + (t > 1880 ? Math.sin(t / 24) * 6 : 0);

    while (game.finisher.evidenceTags.length < tagTimes.length && t >= tagTimes[game.finisher.evidenceTags.length]) {
      const i = game.finisher.evidenceTags.length;
      game.finisher.evidenceTags.push({
        x: enemy.x + (i - 2) * 17,
        y: enemy.y - 142 + i * 22,
        life: 1900,
        maxLife: 1900,
        n: i + 1,
      });
      addHitParticles(enemy.x + (i - 2) * 17, enemy.y - 142 + i * 22, fx.primary, 3);
    }

    if (t < 620) {
      player.state = "walk";
      enemy.state = "dizzy";
      player.x = clamp(game.finisher.enemyStartX - dir * 138, LEFT_WALL + 42, RIGHT_WALL - 42);
      if (t % 110 < 26) addHitParticles(player.x + dir * 24, player.y - 112, fx.secondary, 1);
    } else if (t < 1780) {
      player.state = Math.floor(t / 180) % 2 ? "block" : "special";
      enemy.state = "dizzy";
      player.x = clamp(enemy.x - dir * (120 + Math.sin(t / 60) * 18), LEFT_WALL + 42, RIGHT_WALL - 42);
      game.shake = Math.max(game.shake, 3);
    } else if (t < 2420) {
      player.state = "special";
      enemy.state = "dizzy";
      if (!game.finisher.caseFlash) {
        game.finisher.caseFlash = true;
        game.flash = Math.max(game.flash, 0.88);
        audio?.playHit?.();
      }
      game.shake = Math.max(game.shake, 9);
      if (t % 70 < 24) addHitParticles(enemy.x + (Math.random() - 0.5) * 75, enemy.y - 108 + (Math.random() - 0.5) * 75, fx.primary, 3);
    } else if (t < 3260) {
      player.state = "heavy";
      enemy.state = "finisherHit";
      enemy.health = 0;
      if (!game.finisher.caseImpact) {
        game.finisher.caseImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.58);
        game.shake = Math.max(game.shake, 26);
        spawnGoreChunks(enemy.x, enemy.y - 96, dir, 36, "shatter");
      }
      processFatalityBursts(t);
      if (t % 56 < 22) addGore(enemy.x, enemy.y - 96, dir, 7, true);
    } else if (t < 4100) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 3460) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Case Closed");
      game.flash = 0.35;
    }

    for (const tag of game.finisher.evidenceTags) tag.life -= dt;
    game.finisher.evidenceTags = game.finisher.evidenceTags.filter((tag) => tag.life > 0);
  }

  function updateMaraQaClearFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("pp-mara", player.palette);
    const audio = gameAudio();
    const stampTimes = [640, 880, 1120, 1360, 1600];
    player.facing = dir;
    enemy.facing = -dir;
    player.y = FLOOR;
    enemy.x = game.finisher.enemyStartX + (t > 1720 ? Math.sin(t / 22) * 5 : 0);
    enemy.y = FLOOR;
    player.x = clamp(enemy.x - dir * (126 + Math.sin(t / 70) * 10), LEFT_WALL + 42, RIGHT_WALL - 42);

    while (game.finisher.qaStamps.length < stampTimes.length && t >= stampTimes[game.finisher.qaStamps.length]) {
      const i = game.finisher.qaStamps.length;
      const labels = ["FAIL", "FAIL", "NULL", "FAIL", "DELETE"];
      game.finisher.qaStamps.push({
        x: enemy.x + (i - 2) * 18,
        y: enemy.y - 150 + i * 24,
        text: labels[i] || "FAIL",
        life: 2200,
        maxLife: 2200,
        rot: (Math.random() - 0.5) * 0.5,
      });
      addHitParticles(enemy.x + (i - 2) * 18, enemy.y - 150 + i * 24, fx.primary, 4);
      game.shake = Math.max(game.shake, 6);
      game.flash = Math.max(game.flash, 0.08);
    }

    if (t < 560) {
      player.state = "special";
      enemy.state = "dizzy";
      if (t % 90 < 24) addHitParticles(enemy.x + (Math.random() - 0.5) * 40, enemy.y - 96, fx.secondary, 2);
    } else if (t < 1680) {
      player.state = Math.floor(t / 160) % 2 ? "block" : "special";
      enemy.state = "dizzy";
      // Freeze-lock visual: enemy jitter freezes
      if (t % 70 < 20) addHitParticles(enemy.x, enemy.y - 88, fx.primary, 2);
    } else if (t < 2680) {
      player.state = "heavy";
      enemy.state = "finisherHit";
      enemy.health = 0;
      if (!game.finisher.qaImpact) {
        game.finisher.qaImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.55);
        game.shake = Math.max(game.shake, 28);
        spawnGoreChunks(enemy.x, enemy.y - 96, dir, 30, "glitch");
      }
      processFatalityBursts(t);
      if (t % 50 < 20) addGore(enemy.x, enemy.y - 90, dir, 8, true);
    } else if (t < 3480) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 2920) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("QA Clear", "All tests red. Subject deleted.");
      game.flash = 0.35;
    }

    for (const stamp of game.finisher.qaStamps) stamp.life -= dt;
    game.finisher.qaStamps = game.finisher.qaStamps.filter((stamp) => stamp.life > 0);
  }

  function updateNoahWontFixFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("noah", player.palette);
    const audio = gameAudio();
    const ticketTimes = [700, 980, 1260, 1540];
    player.facing = dir;
    enemy.facing = -dir;
    player.y = FLOOR;
    enemy.y = FLOOR;
    enemy.x = game.finisher.enemyStartX + (t > 1800 ? Math.sin(t / 26) * 7 : 0);
    player.x = clamp(enemy.x - dir * (132 + Math.sin(t / 55) * 12), LEFT_WALL + 42, RIGHT_WALL - 42);

    while (game.finisher.ticketTags.length < ticketTimes.length && t >= ticketTimes[game.finisher.ticketTags.length]) {
      const i = game.finisher.ticketTags.length;
      const labels = ["BUG-01", "BUG-02", "WONTFIX", "CLOSED"];
      game.finisher.ticketTags.push({
        x: enemy.x + (i - 1.5) * 22,
        y: enemy.y - 168 + i * 16,
        text: labels[i] || "BUG",
        life: 2100,
        maxLife: 2100,
      });
      addHitParticles(enemy.x, enemy.y - 120, fx.primary, 5);
    }

    if (t < 620) {
      player.state = "walk";
      enemy.state = "dizzy";
    } else if (t < 1620) {
      player.state = "special";
      enemy.state = "dizzy";
      if (t % 80 < 24) {
        // Bug confetti
        for (let i = 0; i < 3; i += 1) {
          particles.push({
            x: enemy.x + (Math.random() - 0.5) * 70,
            y: enemy.y - 90 - Math.random() * 60,
            vx: (Math.random() - 0.5) * 220,
            vy: -80 - Math.random() * 180,
            life: 420 + Math.random() * 280,
            maxLife: 700,
            size: 3 + Math.random() * 5,
            color: Math.random() > 0.5 ? fx.primary : "#ff5d86",
          });
        }
      }
      game.shake = Math.max(game.shake, 5);
    } else if (t < 2520) {
      player.state = "heavy";
      enemy.state = "finisherHit";
      enemy.health = 0;
      if (!game.finisher.ticketImpact) {
        game.finisher.ticketImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.5);
        game.shake = Math.max(game.shake, 26);
        spawnGoreChunks(enemy.x, enemy.y - 100, dir, 34, "glitch");
      }
      processFatalityBursts(t);
      if (t % 48 < 20) addGore(enemy.x, enemy.y - 88, dir, 9, true);
    } else if (t < 3340) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 2780) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Won't Fix", "Ticket closed. Reality unresolved.");
      game.flash = 0.32;
    }

    for (const tag of game.finisher.ticketTags) tag.life -= dt;
    game.finisher.ticketTags = game.finisher.ticketTags.filter((tag) => tag.life > 0);
  }

  function updateClaireHollowFrameFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("claire", player.palette);
    const audio = gameAudio();
    player.facing = dir;
    enemy.facing = -dir;
    player.y = FLOOR;
    enemy.y = FLOOR;
    enemy.x = game.finisher.enemyStartX;
    player.x = clamp(enemy.x - dir * (118 + Math.sin(t / 65) * 14), LEFT_WALL + 42, RIGHT_WALL - 42);
    game.finisher.wireAlpha = clamp((t - 480) / 900, 0, 1);

    if (t > 700 && t % 140 < 28 && game.finisher.wireFrames.length < 8) {
      game.finisher.wireFrames.push({
        x: enemy.x + (Math.random() - 0.5) * 36,
        y: enemy.y - 40 - Math.random() * 120,
        life: 900,
        maxLife: 900,
        w: 20 + Math.random() * 40,
        h: 8 + Math.random() * 18,
      });
    }

    if (t < 700) {
      player.state = "special";
      enemy.state = "dizzy";
      if (t % 100 < 24) addHitParticles(enemy.x + (Math.random() - 0.5) * 50, enemy.y - 100, fx.primary, 2);
    } else if (t < 1680) {
      player.state = "block";
      enemy.state = "dizzy";
      game.shake = Math.max(game.shake, 4);
      if (t % 75 < 22) addHitParticles(enemy.x, enemy.y - 90, fx.secondary, 3);
    } else if (t < 2680) {
      player.state = "upper";
      enemy.state = "finisherHit";
      enemy.health = 0;
      if (!game.finisher.hollowImpact) {
        game.finisher.hollowImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.48);
        game.shake = Math.max(game.shake, 24);
        spawnGoreChunks(enemy.x, enemy.y - 100, dir, 28, "peel");
      }
      processFatalityBursts(t);
      if (t % 54 < 20) addGore(enemy.x, enemy.y - 92, dir, 7, true);
    } else if (t < 3480) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 2920) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Hollow Frame", "Only the wire remained.");
      game.flash = 0.3;
    }

    for (const layer of game.finisher.wireFrames) layer.life -= dt;
    game.finisher.wireFrames = game.finisher.wireFrames.filter((layer) => layer.life > 0);
  }

  function updateEliDevBuildCrashFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("eli-dev", player.palette);
    const audio = gameAudio();
    const lines = [
      "FATAL: exception in thread main",
      "at Reality.loop(World.java:333)",
      "at Signal.feed(Archive.js:48)",
      "Caused by: NullSubjectError",
      "BUILD FAILED in 3.33s",
      "Process exited with code 1",
    ];
    player.facing = dir;
    enemy.facing = -dir;
    player.y = FLOOR;
    enemy.y = FLOOR;
    enemy.x = game.finisher.enemyStartX + (t > 1700 ? Math.sin(t / 20) * 6 : 0);
    player.x = clamp(enemy.x - dir * 156, LEFT_WALL + 42, RIGHT_WALL - 42);

    while (game.finisher.crashLines.length < lines.length && t >= 520 + game.finisher.crashLines.length * 160) {
      const i = game.finisher.crashLines.length;
      game.finisher.crashLines.push({
        text: lines[i],
        life: 2400,
        maxLife: 2400,
        y: 74 + i * 22,
      });
      addHitParticles(W * 0.5, 80 + i * 20, fx.primary, 2);
    }

    if (t > 900 && t % 70 < 22 && game.finisher.codeBlocks.length < 24) {
      game.finisher.codeBlocks.push({
        x: enemy.x + (Math.random() - 0.5) * 90,
        y: enemy.y - 40 - Math.random() * 130,
        vx: (Math.random() - 0.5) * 180,
        vy: -60 - Math.random() * 160,
        life: 700 + Math.random() * 400,
        maxLife: 1100,
        w: 10 + Math.random() * 22,
        h: 6 + Math.random() * 10,
        color: Math.random() > 0.45 ? fx.primary : "#b0ffd0",
      });
    }

    if (t < 700) {
      player.state = "special";
      enemy.state = "dizzy";
    } else if (t < 1680) {
      player.state = Math.floor(t / 140) % 2 ? "beam" : "special";
      enemy.state = "dizzy";
      game.shake = Math.max(game.shake, 5);
    } else if (t < 2640) {
      player.state = "crush";
      enemy.state = "finisherHit";
      enemy.health = 0;
      if (!game.finisher.crashImpact) {
        game.finisher.crashImpact = true;
        audio?.playExplosion?.();
        game.flash = Math.max(game.flash, 0.62);
        game.shake = Math.max(game.shake, 32);
        spawnGoreChunks(enemy.x, enemy.y - 98, dir, 40, "code");
      }
      processFatalityBursts(t);
      if (t % 46 < 18) addGore(enemy.x, enemy.y - 90, dir, 10, true);
    } else if (t < 3480) {
      player.state = "idle";
      enemy.health = 0;
      enemy.state = "ko";
      processFatalityBursts(t);
      if (!game.finisher.announced && t > 2920) {
        game.finisher.announced = true;
        audio?.announceWin?.(player.name);
      }
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch("Build Crash", "Stack overflow in the archive.");
      game.flash = 0.34;
    }

    for (const line of game.finisher.crashLines) line.life -= dt;
    game.finisher.crashLines = game.finisher.crashLines.filter((line) => line.life > 0);
    for (const block of game.finisher.codeBlocks) {
      block.life -= dt;
      block.x += block.vx * dt / 1000;
      block.y += block.vy * dt / 1000;
      block.vy += 900 * dt / 1000;
    }
    game.finisher.codeBlocks = game.finisher.codeBlocks.filter((block) => block.life > 0);
  }

  function updatePowerBlastFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();
    player.state = "finisher";
    player.facing = dir;
    enemy.facing = -dir;
    enemy.state = t < 2450 ? "dizzy" : "finisherHit";
    player.x = clamp(game.finisher.playerStartX, LEFT_WALL + 42, RIGHT_WALL - 42);
    enemy.x = clamp(game.finisher.enemyStartX + (t > 1050 ? Math.sin(t / 22) * 7 : 0), LEFT_WALL, RIGHT_WALL);
    enemy.y = FLOOR;
    if (t < 850) {
      player.meter = 100;
      if (t % 70 < 22) addHitParticles(player.x + dir * 38, player.y - 88, player.palette.meter, 3);
    } else if (t < 2450) {
      const volley = Math.floor((t - 850) / 260);
      if (volley > (game.finisher.powerVolley || -1)) {
        game.finisher.powerVolley = volley;
        game.shake = 10 + volley;
        game.flash = 0.18;
        audio?.playExplosion?.();
        addHitParticles(enemy.x, enemy.y - 82, volley % 2 ? player.palette.accent : player.palette.meter, 24);
        addGore(enemy.x, enemy.y - 72, dir, 12, volley >= 4);
      }
    } else if (t < 3400) {
      if (!game.finisher.powerImpact) {
        game.finisher.powerImpact = true;
        game.shake = 30;
        game.flash = 0.9;
        audio?.playExplosion?.();
        detachFatalityParts(enemy, { parts: ["head", "armL", "armR", "legL", "legR"], gore: 54, force: 2.8, spray: "heavy" }, dir);
      }
      enemy.health = 0;
      processFatalityBursts(t);
    } else {
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch(`${player.name} Wins · Riftality`);
    }
  }


  function spawnWindowGlassShards(cx, cy, dir) {
    for (let i = 0; i < 28; i += 1) {
      particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 50,
        vx: dir * (120 + Math.random() * 420) + (Math.random() - 0.5) * 180,
        vy: -220 - Math.random() * 520,
        life: 520 + Math.random() * 700,
        max: 900,
        size: 2 + Math.random() * 5,
        color: i % 3 === 0 ? "#d7f3ff" : i % 3 === 1 ? "#9ad6ff" : "#ffffff",
        gravity: 1600,
      });
    }
  }

  function updateWindowBayUppercutFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();
    player.state = t < 1300 ? "finisher" : "victory";
    player.facing = dir;
    enemy.facing = -dir;
    enemy.state = "finisherHit";
    if (t < 700) {
      const p = smoothStep(t / 700);
      player.x = mix(game.finisher.playerStartX, game.finisher.enemyStartX - dir * 26, p);
      player.y = FLOOR;
      enemy.x = game.finisher.enemyStartX;
      enemy.y = FLOOR;
    } else if (t < 1180) {
      if (!game.finisher.uppercutImpact) {
        game.finisher.uppercutImpact = true;
        game.shake = 24;
        game.flash = 0.55;
        audio?.playHeavyPunch?.() || audio?.playExplosion?.();
      }
      const p = (t - 700) / 480;
      // Launch toward the bay window (up + toward far wall)
      enemy.y = FLOOR - p * 210;
      enemy.x = game.finisher.enemyStartX + dir * p * 210;
      player.y = FLOOR - Math.sin(Math.min(1, p * 1.35) * Math.PI) * 48;
    } else if (t < 1480) {
      if (!game.finisher.windowShatter) {
        game.finisher.windowShatter = true;
        game.shake = 32;
        game.flash = 0.85;
        audio?.playExplosion?.();
        const shatterX = clamp(enemy.x + dir * 18, 80, W - 80);
        const shatterY = enemy.y - 40;
        game.finisher.shatterX = shatterX;
        game.finisher.shatterY = shatterY;
        spawnWindowGlassShards(shatterX, shatterY, dir);
        addHitParticles(shatterX, shatterY, "#cfefff", 30);
      }
      const p = (t - 1180) / 300;
      enemy.x = mix(game.finisher.enemyStartX + dir * 210, W * 0.72, p);
      enemy.y = mix(FLOOR - 210, -40, p);
      player.y = FLOOR;
    } else if (t < 4200) {
      // Exterior fall — twenty stories
      player.y = FLOOR;
      if (!game.finisher.exteriorFall) {
        game.finisher.exteriorFall = true;
        game.finisher.fallStart = t;
      }
      const fall = (t - 1480) / 2720;
      enemy.x = W * 0.52 + Math.sin(t / 180) * 10;
      enemy.y = -80 + fall * (H + 220);
      enemy.facing = dir;
      if (Math.floor(t / 90) !== game.finisher.lastFloorFlash) {
        game.finisher.lastFloorFlash = Math.floor(t / 90);
        addHitParticles(enemy.x, Math.max(40, enemy.y), "#6cf0ff", 2);
      }
    } else if (t < 5100) {
      if (!game.finisher.groundSplat) {
        game.finisher.groundSplat = true;
        game.shake = 34;
        game.flash = 1;
        audio?.playExplosion?.();
        enemy.y = FLOOR + 8;
        enemy.x = W * 0.52;
        detachFatalityParts(enemy, { parts: ["head", "armL", "armR", "legL", "legR"], gore: 62, force: 3.1, spray: "heavy" }, dir);
        addGore(enemy.x, enemy.y - 20, dir, 22, true);
      }
      enemy.health = 0;
      enemy.y = FLOOR + 10;
    } else {
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      player.y = FLOOR;
      endMatch(`${player.name} Wins · Twenty-Story Exit`, "Through the glass. Twenty floors. No bounce-back.");
    }
  }

  function drawWindowBayUppercutFinisher(t, fx) {
    if (t < 1480) {
      // In-bay: glass burst ring near shatter moment
      if (game.finisher.windowShatter) {
        const age = t - 1180;
        const cx = game.finisher.shatterX || W * 0.7;
        const cy = game.finisher.shatterY || H * 0.35;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(200, 240, 255, ${clamp(1 - age / 500, 0, 0.9)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 18 + age * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        // cracked pane silhouette
        ctx.globalAlpha = clamp(1 - age / 420, 0, 0.75);
        ctx.strokeStyle = "#e8f7ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - 54, cy - 70, 108, 120);
        ctx.beginPath();
        ctx.moveTo(cx - 40, cy - 60);
        ctx.lineTo(cx + 10, cy);
        ctx.lineTo(cx - 20, cy + 50);
        ctx.moveTo(cx + 30, cy - 50);
        ctx.lineTo(cx - 5, cy + 10);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    // Exterior night fall past archive windows
    const fall = clamp((t - 1480) / 2720, 0, 1);
    ctx.save();
    ctx.fillStyle = "rgba(2, 4, 14, 0.94)";
    ctx.fillRect(0, 0, W, H);
    // building face scrolling upward
    const scroll = fall * 2400;
    for (let row = -2; row < 14; row += 1) {
      const y = ((row * 110 - scroll) % (H + 220)) - 80;
      ctx.fillStyle = "#0c121c";
      ctx.fillRect(W * 0.18, y, W * 0.64, 96);
      ctx.fillStyle = row % 3 === 0 ? "rgba(80, 200, 255, 0.35)" : "rgba(255, 90, 70, 0.18)";
      for (let col = 0; col < 6; col += 1) {
        ctx.fillRect(W * 0.22 + col * 70, y + 18, 36, 28);
      }
      ctx.fillStyle = "rgba(180, 220, 255, 0.08)";
      ctx.fillRect(W * 0.18, y + 94, W * 0.64, 2);
    }
    // falling victim
    if (!game.finisher.groundSplat) {
      const vx = W * 0.52 + Math.sin(t / 180) * 10;
      const vy = -80 + fall * (H + 220);
      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(Math.sin(t / 160) * 0.9 + fall * 2.2);
      ctx.fillStyle = enemy.palette?.skin || "#d6925d";
      ctx.fillRect(-8, -50, 16, 18);
      ctx.fillStyle = enemy.palette?.trunks || "#345fa8";
      ctx.fillRect(-12, -31, 24, 34);
      ctx.fillStyle = enemy.palette?.accent || "#53ecff";
      ctx.fillRect(-18, -28, 6, 32);
      ctx.fillRect(12, -28, 6, 32);
      ctx.restore();
      // speed lines
      ctx.strokeStyle = "rgba(180,230,255,0.35)";
      for (let i = 0; i < 8; i += 1) {
        const lx = vx + (i - 4) * 12;
        ctx.beginPath();
        ctx.moveTo(lx, vy - 70);
        ctx.lineTo(lx, vy - 140 - (i % 3) * 20);
        ctx.stroke();
      }
      // story counter
      ctx.fillStyle = "#f4d27a";
      ctx.font = "900 18px sans-serif";
      ctx.textAlign = "center";
      const stories = Math.min(20, 1 + Math.floor(fall * 20));
      ctx.fillText(`FALLING · FLOOR ${21 - stories}`, W * 0.5, 36);
    } else {
      const blast = clamp((t - 4200) / 500, 0, 1);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1 - blast * 0.6;
      ctx.fillStyle = fx.primary || "#ff3355";
      ctx.beginPath();
      ctx.arc(W * 0.52, FLOOR - 20, 30 + blast * 160, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function updateSpaceUppercutFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const audio = gameAudio();
    player.state = t < 1150 ? "finisher" : "victory";
    player.facing = dir;
    enemy.facing = -dir;
    enemy.state = "finisherHit";
    if (t < 720) {
      const p = smoothStep(t / 720);
      player.x = mix(game.finisher.playerStartX, game.finisher.enemyStartX - dir * 24, p);
      player.y = FLOOR;
      enemy.x = game.finisher.enemyStartX;
      enemy.y = FLOOR;
    } else if (t < 1450) {
      if (!game.finisher.uppercutImpact) {
        game.finisher.uppercutImpact = true;
        game.shake = 26;
        game.flash = 0.7;
        audio?.playExplosion?.();
      }
      const p = (t - 720) / 730;
      enemy.y = FLOOR - p * (H + 220);
      enemy.x = game.finisher.enemyStartX + dir * p * 80;
      player.y = FLOOR - Math.sin(Math.min(1, p * 1.4) * Math.PI) * 54;
    } else if (t < 4300) {
      player.y = FLOOR;
      enemy.x = W * 0.58 + Math.sin(t / 320) * 20;
      enemy.y = H * 0.46 + Math.cos(t / 280) * 12;
      if (t > 3150) game.finisher.spaceSuffocation = clamp((t - 3150) / 850, 0, 1);
    } else if (t < 5150) {
      if (!game.finisher.spaceExplosion) {
        game.finisher.spaceExplosion = true;
        game.shake = 28;
        game.flash = 0.95;
        audio?.playExplosion?.();
        detachFatalityParts(enemy, { parts: ["head", "armL", "armR", "legL", "legR"], gore: 50, force: 2.6, spray: "heavy" }, dir);
      }
      enemy.health = 0;
    } else {
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      player.y = FLOOR;
      endMatch(`${player.name} Wins · Riftality`);
    }
  }

  function updateFinisher(dt) {
    if (game.finisher?.powerBlast) {
      updatePowerBlastFinisher(dt);
      return;
    }
    if (game.finisher?.windowUppercut) {
      updateWindowBayUppercutFinisher(dt);
      return;
    }
    if (game.finisher?.spaceUppercut) {
      updateSpaceUppercutFinisher(dt);
      return;
    }
    if (game.finisher?.tankCannon) {
      updateTankFinisher(dt);
      return;
    }
    if (game.finisher?.marauderGun) {
      updateMarauderGunFinisher(dt);
      return;
    }
    if (game.finisher?.kingGroundWave) {
      updateKingGroundWaveFinisher(dt);
      return;
    }
    if (game.finisher?.spar7anSpear) {
      updateSpar7anSpearFinisher(dt);
      return;
    }
    if (game.finisher?.lazyController) {
      updateLazyControllerFinisher(dt);
      return;
    }
    if (game.finisher?.ninjaKatana) {
      updateNinjaKatanaFinisher(dt);
      return;
    }
    if (game.finisher?.gritAirstrike) {
      updateGritAirstrikeFinisher(dt);
      return;
    }
    if (game.finisher?.anthonyNuke) {
      updateAnthonyNukeFinisher(dt);
      return;
    }
    if (game.finisher?.plotPulseUfo) {
      updatePlotPulseUfoFinisher(dt);
      return;
    }
    if (game.finisher?.dragonSkyFeast) {
      updateDragonSkyFeastFinisher(dt);
      return;
    }
    if (game.finisher?.dragonBornStormBreath) {
      updateDragonBornStormBreathFinisher(dt);
      return;
    }
    if (game.finisher?.boneHeadSwap) {
      updateBoneHeadSwapFinisher(dt);
      return;
    }
    if (game.finisher?.jennyReplay) {
      updateJennyReplayFinisher(dt);
      return;
    }
    if (game.finisher?.sableRewrite) {
      updateSableRewriteFinisher(dt);
      return;
    }
    if (game.finisher?.jakeFourthDown) {
      updateJakeFourthDownFinisher(dt);
      return;
    }
    if (game.finisher?.controlDubstep) {
      updateControlDubstepFinisher(dt);
      return;
    }
    if (game.finisher?.motherShadow) {
      updateMotherShadowFinisher(dt);
      return;
    }
    if (game.finisher?.wendigoAntler) {
      updateWendigoAntlerFinisher(dt);
      return;
    }
    if (game.finisher?.iceGolemCrush) {
      updateIceGolemCrushFinisher(dt);
      return;
    }
    if (game.finisher?.bigfootStomp) {
      updateBigfootStompFinisher(dt);
      return;
    }
    if (game.finisher?.riftSplit) {
      updateRiftSplitFinisher(dt);
      return;
    }
    if (game.finisher?.alexCaseClosed) {
      updateAlexCaseClosedFinisher(dt);
      return;
    }
    if (game.finisher?.maraQaClear) {
      updateMaraQaClearFinisher(dt);
      return;
    }
    if (game.finisher?.noahWontFix) {
      updateNoahWontFixFinisher(dt);
      return;
    }
    if (game.finisher?.claireHollowFrame) {
      updateClaireHollowFrameFinisher(dt);
      return;
    }
    if (game.finisher?.eliDevBuildCrash) {
      updateEliDevBuildCrashFinisher(dt);
      return;
    }
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const style = finisherStyle(player.character);
    const family = finisherFamily(style);
    const fx = finisherFx(style, player.palette);
    player.state = "finisher";
    enemy.state = t < 1550 ? "dizzy" : "finisherHit";
    player.facing = dir;
    enemy.facing = -dir;
    if (game.finisher.chromeEyes) {
      player.x = clamp(game.finisher.playerStartX, LEFT_WALL, RIGHT_WALL);
    } else {
      player.x = clamp(game.finisher.enemyStartX - dir * (family === "shadow" ? 64 + Math.sin(t / 70) * 46 : 92), LEFT_WALL, RIGHT_WALL);
    }

    if (t < 760) {
      player.meter = clamp(player.meter + 0.08 * dt, 0, 100);
      if (game.finisher.chromeEyes && t > 280 && t % 48 < 18) {
        const eyes = chromeEyeWorldPoints(player);
        addHitParticles(eyes.left.x, eyes.left.y, fx.secondary, 1);
        addHitParticles(eyes.right.x, eyes.right.y, fx.primary, 1);
      } else if (t % 80 < 22) {
        addHitParticles(player.x + dir * 34, player.y - 88, fx.primary, family === "bone" ? 2 : 1);
      }
    } else if (t < 1580) {
      game.shake = Math.max(game.shake, family === "quake" ? 15 : 8);
      processFatalityBursts(t);
      if (t % 45 < 18) {
        const hitX = enemy.x + (Math.random() - 0.5) * (family === "beam" ? 84 : 60);
        const hitY = enemy.y - 72 - Math.random() * 55;
        addHitParticles(hitX, hitY, Math.random() > 0.5 ? fx.primary : fx.secondary, family === "quake" ? 4 : 2);
        addGore(hitX, hitY + 16, dir, family === "bone" ? 7 : 4, family === "quake");
      }
    } else if (t < 2500) {
      processFatalityBursts(t);
      if (family === "quake") {
        enemy.x += Math.sin(t / 38) * 0.45 * dt;
        enemy.y = FLOOR - Math.abs(Math.sin((t - 1580) / 280 * Math.PI)) * 42;
      } else if (family === "beam") {
        enemy.x += dir * 0.1 * dt;
        enemy.y = FLOOR - Math.sin((t - 1580) / 920 * Math.PI) * 55;
      } else if (family === "bone") {
        enemy.x += dir * 0.18 * dt;
        enemy.y = FLOOR - Math.sin((t - 1580) / 920 * Math.PI) * 110;
      } else {
        enemy.x += dir * 0.25 * dt;
        enemy.y = FLOOR - Math.sin((t - 1580) / 920 * Math.PI) * (family === "flame" ? 125 : 92);
      }
      enemy.facing = -dir;
      game.shake = Math.max(game.shake, family === "quake" ? 18 : 13);
      if (t % 70 < 20) addGore(enemy.x, enemy.y - 82, dir, family === "flame" ? 14 : 9, true);
    } else if (t < 3300) {
      processFatalityBursts(t);
      enemy.y += (FLOOR - enemy.y) * 0.08;
      enemy.x = clamp(enemy.x, LEFT_WALL, RIGHT_WALL);
    } else {
      enemy.y = FLOOR;
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch(player.character.finisher);
      game.flash = 0.35;
    }
  }

  function updateMarauderGunFinisher(dt) {
    game.finisherTime += dt;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const fx = finisherFx("marauder", player.palette);
    player.state = "finisher";
    enemy.state = t < 2350 ? "finisherHit" : "ko";
    player.facing = dir;
    enemy.facing = -dir;
    player.x = clamp(game.finisher.enemyStartX - dir * 158, LEFT_WALL + 40, RIGHT_WALL - 40);
    enemy.x = clamp(game.finisher.enemyStartX + Math.sin(t / 45) * (t < 2300 ? 3 : 0), LEFT_WALL, RIGHT_WALL);
    enemy.y = FLOOR;

    while (game.finisher.shotIndex < game.finisher.bursts.length && t >= game.finisher.bursts[game.finisher.shotIndex].at) {
      const burst = game.finisher.bursts[game.finisher.shotIndex];
      const targetY = enemy.y - (burst.targetY || 88);
      game.finisher.lastShotTime = t;
      game.finisher.lastShotTargetY = targetY;
      detachFatalityParts(enemy, burst, dir);
      addHitParticles(player.x + dir * 53, player.y - 96, "#fff2bd", 12);
      addHitParticles(enemy.x + dir * 8, targetY, fx.primary, 24);
      addGore(enemy.x + dir * 10, targetY + 8, dir, burst.gore || 42, true);
      game.shake = Math.max(game.shake, 26);
      game.flash = Math.max(game.flash, 0.2);
      game.hitStop = Math.max(game.hitStop, 78);
      game.finisher.shotIndex += 1;
    }

    if (t > 850 && t < 2360 && t % 85 < 24) {
      addHitParticles(enemy.x + (Math.random() - 0.5) * 54, enemy.y - 92 + (Math.random() - 0.5) * 70, fx.secondary, 2);
    }

    if (t > 2860) {
      enemy.health = 0;
      enemy.state = "ko";
      player.state = "idle";
      endMatch(player.character.finisher);
      game.flash = 0.35;
    }
  }

  function finisherStyle(character) {
    return activeFinisherStyle(character);
  }

  function drawChromeEyeBeam(t, fx, dir) {
    const eyes = chromeEyeWorldPoints(player);
    const targetY = enemy.y - 88;
    const beamEndX = enemy.x + dir * 28;
    const pulse = 0.72 + Math.sin(game.time * 28) * 0.28;
    const width = 5 + pulse * 4;

    function drawEyeBeam(origin, intensity) {
      const gradient = ctx.createLinearGradient(origin.x, origin.y, beamEndX, targetY);
      gradient.addColorStop(0, fx.secondary);
      gradient.addColorStop(0.18, fx.primary);
      gradient.addColorStop(0.72, fx.primary);
      gradient.addColorStop(1, "rgba(255, 47, 47, 0.08)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = width * intensity;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(beamEndX, targetY);
      ctx.stroke();

      ctx.fillStyle = fx.secondary;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, 4 + pulse * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fx.primary;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, 2 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = fx.primary;
    ctx.shadowBlur = 18;
    drawEyeBeam(eyes.left, 0.92);
    drawEyeBeam(eyes.right, 0.92);
    ctx.shadowBlur = 28;
    ctx.strokeStyle = `rgba(255, 47, 47, ${0.22 + pulse * 0.18})`;
    ctx.lineWidth = width * 2.4;
    ctx.beginPath();
    ctx.moveTo(eyes.center.x, eyes.center.y);
    ctx.lineTo(beamEndX, targetY);
    ctx.stroke();
    ctx.restore();

    if (t > 1180) {
      ctx.save();
      ctx.globalAlpha = clamp((t - 1180) / 420, 0, 0.55);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(
        Math.min(eyes.center.x, beamEndX) - 8,
        targetY - 10,
        Math.abs(beamEndX - eyes.center.x) + 16,
        20,
      );
      ctx.restore();
    }
  }

  function finisherFamily(style) {
    const riftality = riftalityForFighter(style);
    if (riftality?.family) return riftality.family;
    if (["tank", "king", "grit", "anthony-e1", "elias-crowe", "spar7an", "jake", "bigfoot"].includes(style)) return "quake";
    if (["chrome", "valor", "eli-dev", "control", "jenny-night-signal", "ice-golem"].includes(style)) return "beam";
    if (["bone", "wendigo", "john"].includes(style)) return "bone";
    if (["dragon", "ember"].includes(style)) return "flame";
    if (["nyx", "warden", "eli-ransom", "the-mother"].includes(style)) return "shadow";
    if (["marauder", "blitz", "rose", "pp-mara", "noah", "claire", "elena-voss"].includes(style)) return "rush";
    return "rift";
  }

  function finisherFx(style, palette) {
    const effects = {
      rift: { primary: "#53ecff", secondary: "#f04c3d" },
      tank: { primary: "#ffb14a", secondary: "#9b5b27" },
      marauder: { primary: "#ff5d86", secondary: "#fff0e6" },
      "pp-mara": { primary: "#5ce0ff", secondary: "#1e3a5f" },
      noah: { primary: "#8de6ff", secondary: "#3d4f63" },
      claire: { primary: "#b47aff", secondary: "#4a2d6e" },
      "eli-dev": { primary: "#3dff90", secondary: "#1a2b20" },
      "eli-ransom": { primary: "#f0c632", secondary: "#3a4a5a" },
      "elena-voss": { primary: "#4aa8ff", secondary: "#0c1a2a" },
      "elias-crowe": { primary: "#7bc45a", secondary: "#3d4a32" },
      "the-mother": { primary: "#c8a0ff", secondary: "#2a1838" },
      wendigo: { primary: "#8fd46a", secondary: "#1a2820" },
      "ice-golem": { primary: "#8ff4ff", secondary: "#5a94a8" },
      bigfoot: { primary: "#8fd46a", secondary: "#4a2c1d" },
      john: { primary: "#8fd46a", secondary: "#2a2018" },
      alex: { primary: "#dcb848", secondary: "#303644" },
      blitz: { primary: "#ffe65d", secondary: "#ff4c7a" },
      ember: { primary: "#ff7746", secondary: "#ffe65d" },
      nyx: { primary: "#b064ff", secondary: "#15131f" },
      chrome: { primary: "#ff2f2f", secondary: "#c7f3ff" },
      king: { primary: "#4f9dff", secondary: "#f8dd94" },
      spar7an: { primary: "#f4d879", secondary: "#8b1016" },
      control: { primary: "#35f2ff", secondary: "#b84cff" },
      jake: { primary: "#7df0d4", secondary: "#d6b047" },
      sable: { primary: "#d33a54", secondary: "#7e1f32" },
      "jenny-night-signal": { primary: "#c7f7ff", secondary: "#e6293f" },
      lazy: { primary: "#e02746", secondary: "#6b1a8f" },
      ninja: { primary: "#d9b45f", secondary: "#8b1016" },
      dragon: { primary: "#ff7838", secondary: "#ffe03c" },
      bone: { primary: "#efe4cf", secondary: "#d12929" },
      warden: { primary: "#9d58ff", secondary: "#d6aa32" },
      valor: { primary: "#9fe36d", secondary: "#ff2f2f" },
      rose: { primary: "#ff7b8e", secondary: "#f4eee2" },
      grit: { primary: "#48dd9b", secondary: "#d99a71" },
      "anthony-e1": { primary: "#ffb42e", secondary: "#fff4cf" },
      "plot-pulse-theam": { primary: "#5ff6ff", secondary: "#7b5cff" },
      "dragon-born": { primary: "#69dfff", secondary: "#effaff" },
    };
    const riftality = riftalityForFighter(style);
    if (riftality?.fx) return riftality.fx;
    return effects[style] || { primary: palette.meter, secondary: "#f04c3d" };
  }

  const fatalityBurstTable = {
    "pp-mara": [
      { at: 860, parts: ["armR"], gore: 28, force: 1.35, spray: "glitch" },
      { at: 1240, parts: ["head"], gore: 42, force: 1.9, spray: "glitch" },
      { at: 1880, parts: ["armL", "legL", "legR"], gore: 56, force: 2.3, spray: "heavy" },
    ],
    "jenny-night-signal": [
      { at: 780, parts: ["armR"], gore: 26, force: 1.2, spray: "glitch" },
      { at: 1260, parts: ["legL"], gore: 34, force: 1.6, spray: "glitch" },
      { at: 1780, parts: ["armL", "head"], gore: 48, force: 2.0, spray: "code" },
      { at: 2320, parts: ["torso", "legR"], gore: 58, force: 2.5, spray: "heavy" },
    ],
    noah: [
      { at: 900, parts: ["armL", "armR"], gore: 34, force: 1.5 },
      { at: 1460, parts: ["torso"], gore: 48, force: 2.0, spray: "heavy" },
      { at: 2040, parts: ["legL", "legR", "head"], gore: 62, force: 2.5, spray: "heavy" },
    ],
    claire: [
      { at: 820, parts: ["armR"], gore: 30, force: 1.2, spray: "peel" },
      { at: 1180, parts: ["armL"], gore: 36, force: 1.5, spray: "peel" },
      { at: 1760, parts: ["legL", "legR"], gore: 44, force: 1.8, spray: "peel" },
      { at: 2280, parts: ["head", "torso"], gore: 58, force: 2.4, spray: "heavy" },
    ],
    "eli-dev": [
      { at: 780, parts: ["armL"], gore: 26, force: 1.6, spray: "code" },
      { at: 1120, parts: ["armR", "legL"], gore: 38, force: 2.0, spray: "code" },
      { at: 1680, parts: ["legR", "head"], gore: 52, force: 2.5, spray: "code" },
      { at: 2200, parts: ["torso"], gore: 64, force: 2.8, spray: "heavy" },
    ],
    "eli-ransom": [
      { at: 940, parts: ["head"], gore: 36, force: 1.7, spray: "spiral" },
      { at: 1420, parts: ["armL", "armR"], gore: 46, force: 2.1, spray: "spiral" },
      { at: 1980, parts: ["legL", "legR", "torso"], gore: 60, force: 2.6, spray: "heavy" },
    ],
    "elena-voss": [
      { at: 880, parts: ["armR"], gore: 30, force: 1.1, spray: "flood" },
      { at: 1320, parts: ["armL", "head"], gore: 40, force: 1.4, spray: "flood" },
      { at: 1860, parts: ["legL", "legR"], gore: 50, force: 1.6, spray: "flood" },
      { at: 2360, parts: ["torso"], gore: 58, force: 2.0, spray: "heavy" },
    ],
    "elias-crowe": [
      { at: 920, parts: ["armL"], gore: 32, force: 1.4, spray: "peel" },
      { at: 1380, parts: ["armR", "legL"], gore: 44, force: 1.9, spray: "peel" },
      { at: 1920, parts: ["legR", "head"], gore: 54, force: 2.3, spray: "heavy" },
      { at: 2440, parts: ["torso"], gore: 66, force: 2.7, spray: "heavy" },
    ],
    rift: [
      { at: 2320, parts: ["armL", "legL"], gore: 44, force: 2.2, spray: "glitch" },
      { at: 2500, parts: ["armR", "legR"], gore: 48, force: 2.4, spray: "glitch" },
      { at: 2720, parts: ["head", "torso"], gore: 72, force: 3.1, spray: "heavy" },
    ],
    tank: [
      { at: 1880, parts: ["armL", "armR", "legL", "legR", "head", "torso"], gore: 82, force: 3.3, spray: "heavy" },
      { at: 2140, parts: ["torso"], gore: 48, force: 2.4, spray: "heavy" },
    ],
    spar7an: [
      { at: 1420, parts: ["armR"], gore: 38, force: 2.0, spray: "heavy" },
      { at: 1620, parts: ["armL", "head"], gore: 54, force: 2.5, spray: "heavy" },
      { at: 1880, parts: ["legL", "legR", "torso"], gore: 74, force: 3.1, spray: "heavy" },
    ],
    control: [
      { at: 860, parts: ["armL"], gore: 24, force: 1.5, spray: "shatter" },
      { at: 1360, parts: ["armR", "legL"], gore: 38, force: 2.0, spray: "shatter" },
      { at: 2040, parts: ["head", "torso", "legR"], gore: 58, force: 2.5, spray: "heavy" },
    ],
    jake: [
      { at: 880, parts: ["armR"], gore: 32, force: 1.7, spray: "heavy" },
      { at: 1460, parts: ["legL", "legR"], gore: 46, force: 2.2, spray: "heavy" },
      { at: 2140, parts: ["head", "torso"], gore: 62, force: 2.8, spray: "heavy" },
    ],
    lazy: [
      { at: 1780, parts: ["armL", "armR"], gore: 42, force: 2.0, spray: "spiral" },
      { at: 2080, parts: ["legL", "legR"], gore: 48, force: 2.3, spray: "spiral" },
      { at: 2380, parts: ["head", "torso"], gore: 70, force: 3.0, spray: "heavy" },
    ],
    ninja: [
      { at: 2680, parts: ["armL", "armR", "legL", "legR", "head", "torso"], gore: 76, force: 2.7, spray: "heavy" },
    ],
    marauder: [
      { at: 720, parts: ["armR"], gore: 42, force: 2.0, spray: "heavy", targetY: 102 },
      { at: 1050, parts: ["armL"], gore: 46, force: 2.1, spray: "heavy", targetY: 108 },
      { at: 1380, parts: ["legR"], gore: 48, force: 2.15, spray: "heavy", targetY: 50 },
      { at: 1710, parts: ["legL"], gore: 50, force: 2.25, spray: "heavy", targetY: 52 },
      { at: 2040, parts: ["head", "torso"], gore: 74, force: 3.0, spray: "heavy", targetY: 132 },
    ],
    blitz: [
      { at: 840, parts: ["head"], gore: 40, force: 2.0 },
      { at: 1360, parts: ["armL", "armR"], gore: 46, force: 2.2 },
      { at: 1940, parts: ["legL", "legR"], gore: 54, force: 2.4 },
    ],
    ember: [
      { at: 880, parts: ["legL", "legR"], gore: 36, force: 1.6, spray: "flame" },
      { at: 1420, parts: ["armL", "armR"], gore: 46, force: 2.0, spray: "flame" },
      { at: 2040, parts: ["head", "torso"], gore: 60, force: 2.6, spray: "heavy" },
    ],
    nyx: [
      { at: 820, parts: ["armL"], gore: 28, force: 1.5, spray: "shadow" },
      { at: 1080, parts: ["armR"], gore: 28, force: 1.5, spray: "shadow" },
      { at: 1340, parts: ["legL"], gore: 30, force: 1.5, spray: "shadow" },
      { at: 1600, parts: ["legR"], gore: 30, force: 1.5, spray: "shadow" },
      { at: 2100, parts: ["head", "torso"], gore: 54, force: 2.4, spray: "heavy" },
    ],
    chrome: [
      { at: 900, parts: ["armL", "armR"], gore: 40, force: 2.0, spray: "shatter" },
      { at: 1500, parts: ["legL", "legR"], gore: 48, force: 2.2, spray: "shatter" },
      { at: 2080, parts: ["head", "torso"], gore: 62, force: 2.7, spray: "heavy" },
    ],
    king: [
      { at: 2860, parts: ["legL", "legR"], gore: 56, force: 2.7, spray: "heavy" },
      { at: 2940, parts: ["armL", "armR", "head"], gore: 72, force: 3.1, spray: "heavy" },
      { at: 3020, parts: ["torso"], gore: 86, force: 3.4, spray: "heavy" },
    ],
    dragon: [
      { at: 880, parts: ["torso"], gore: 42, force: 2.1, spray: "heavy" },
      { at: 1380, parts: ["armL", "armR", "head"], gore: 52, force: 2.4 },
      { at: 1980, parts: ["legL", "legR"], gore: 56, force: 2.5 },
    ],
    bone: [
      { at: 760, parts: ["armL", "armR"], gore: 24, force: 1.4, spray: "bone" },
      { at: 1120, parts: ["legL", "legR"], gore: 28, force: 1.5, spray: "bone" },
      { at: 1540, parts: ["head"], gore: 34, force: 1.7, spray: "bone" },
      { at: 2060, parts: ["torso"], gore: 48, force: 2.2, spray: "bone" },
    ],
    warden: [
      { at: 900, parts: ["armL", "armR"], gore: 32, force: 1.3, spray: "shadow" },
      { at: 1460, parts: ["legL", "legR"], gore: 38, force: 1.4, spray: "shadow" },
      { at: 2020, parts: ["head", "torso"], gore: 54, force: 2.2, spray: "heavy" },
    ],
    valor: [
      { at: 920, parts: ["head"], gore: 44, force: 2.0, spray: "heavy" },
      { at: 1520, parts: ["armL", "armR"], gore: 48, force: 2.2 },
      { at: 2100, parts: ["legL", "legR", "torso"], gore: 58, force: 2.5 },
    ],
    rose: [
      { at: 860, parts: ["armL", "armR"], gore: 38, force: 1.9 },
      { at: 1420, parts: ["legL"], gore: 34, force: 1.7 },
      { at: 1760, parts: ["legR", "head"], gore: 48, force: 2.2 },
      { at: 2240, parts: ["torso"], gore: 54, force: 2.4 },
    ],
    grit: [
      { at: 2760, parts: ["armL", "armR", "legL", "legR", "head", "torso"], gore: 96, force: 3.5, spray: "heavy" },
    ],
    "anthony-e1": [
      { at: 2860, parts: ["armL", "armR", "legL", "legR", "head", "torso"], gore: 84, force: 3.6, spray: "heavy" },
    ],
    sable: [
      { at: 800, parts: ["armL"], gore: 30, force: 1.6 },
      { at: 1040, parts: ["armR"], gore: 30, force: 1.6 },
      { at: 1280, parts: ["legL"], gore: 32, force: 1.7 },
      { at: 1520, parts: ["legR"], gore: 32, force: 1.7 },
      { at: 1840, parts: ["head"], gore: 44, force: 2.2, spray: "heavy" },
      { at: 2280, parts: ["torso"], gore: 58, force: 2.8, spray: "heavy" },
    ],
    "the-mother": [
      { at: 880, parts: ["armL", "armR"], gore: 36, force: 1.2, spray: "shadow" },
      { at: 1480, parts: ["legL", "legR"], gore: 42, force: 1.4, spray: "shadow" },
      { at: 2060, parts: ["head", "torso"], gore: 56, force: 2.0, spray: "heavy" },
    ],
    wendigo: [
      { at: 860, parts: ["antler"], gore: 28, force: 1.5, spray: "bone" },
      { at: 1180, parts: ["armL", "armR"], gore: 44, force: 2.0, spray: "peel" },
      { at: 1720, parts: ["legL", "legR"], gore: 50, force: 2.2, spray: "peel" },
      { at: 2260, parts: ["head", "torso"], gore: 66, force: 2.8, spray: "heavy" },
    ],
    "ice-golem": [
      { at: 820, parts: ["armL"], gore: 26, force: 1.6, spray: "shatter" },
      { at: 1240, parts: ["armR", "legL"], gore: 38, force: 2.0, spray: "shatter" },
      { at: 1740, parts: ["legR"], gore: 42, force: 2.2, spray: "shatter" },
      { at: 2240, parts: ["head", "torso"], gore: 64, force: 2.9, spray: "shatter" },
    ],
    bigfoot: [
      { at: 760, parts: ["legL"], gore: 32, force: 1.8, spray: "heavy" },
      { at: 1180, parts: ["legR", "armR"], gore: 44, force: 2.2, spray: "heavy" },
      { at: 1680, parts: ["armL"], gore: 46, force: 2.4, spray: "heavy" },
      { at: 2180, parts: ["head", "torso"], gore: 68, force: 3.2, spray: "heavy" },
    ],
    john: [
      { at: 640, parts: ["armR"], gore: 34, force: 1.8, spray: "peel" },
      { at: 880, parts: ["armL"], gore: 38, force: 1.9, spray: "peel" },
      { at: 1120, parts: ["legR"], gore: 42, force: 2.0, spray: "heavy" },
      { at: 1360, parts: ["legL"], gore: 44, force: 2.1, spray: "heavy" },
      { at: 1660, parts: ["head"], gore: 54, force: 2.4, spray: "peel" },
      { at: 2040, parts: ["torso"], gore: 72, force: 3.0, spray: "heavy" },
      { at: 2320, parts: ["armL", "armR", "legL", "legR", "head", "torso"], gore: 58, force: 2.8, spray: "heavy" },
    ],
    alex: [
      { at: 2440, parts: ["armR"], gore: 34, force: 1.7, spray: "shatter" },
      { at: 2660, parts: ["armL", "legL"], gore: 44, force: 2.0, spray: "shatter" },
      { at: 2920, parts: ["legR", "torso"], gore: 56, force: 2.5, spray: "heavy" },
      { at: 3160, parts: ["head"], gore: 62, force: 2.8, spray: "code" },
    ],
    custom: [
      { at: 900, parts: ["armL", "armR"], gore: 36, force: 1.8 },
      { at: 1500, parts: ["legL", "legR"], gore: 42, force: 2.0 },
      { at: 2100, parts: ["head", "torso"], gore: 54, force: 2.4 },
    ],
  };

  const fatalityTaglines = {
    "pp-mara": "QA CLEAR",
    "jenny-night-signal": "NOT ALL OF IT",
    noah: "WON'T FIX",
    claire: "HOLLOW FRAME",
    "eli-dev": "BUILD CRASH",
    "eli-ransom": "SPIRAL SEED",
    "elena-voss": "THE DOOR STAYS OPEN",
    "elias-crowe": "FIRST SKIN",
    rift: "RIFT SPLIT",
    wendigo: "ANSWER THE VOICES",
    "ice-golem": "FROZEN SOLID",
    bigfoot: "TREE LINE BREAKER",
    john: "CLAWED APART",
    alex: "CASE CLOSED",
    "the-mother": "LIGHTS OUT, SWEETHEART",
    spar7an: "LEGION BROKEN",
    control: "BASS DROP OVERRIDE",
    jake: "FOURTH DOWN",
    sable: "MARKED FOR REWRITE",
    lazy: "PRIMAL DRUM SOLO",
    ninja: "AFTER THE CUT",
    "anthony-e1": "AIR STRIKE",
    "plot-pulse-theam": "FLEET ABDUCTION",
    dragon: "SKY FEAST",
    "dragon-born": "STORM BREATH",
  };

  function fatalityBursts(id) {
    const riftality = riftalityForFighter(id);
    if (riftality?.bursts?.length) return riftality.bursts.map((burst) => ({ ...burst }));
    if (fatalityBurstTable[id]) return fatalityBurstTable[id].map((burst) => ({ ...burst }));
    const family = finisherFamily(id);
    const defaults = {
      quake: [
        { at: 900, parts: ["armL", "armR"], gore: 38, force: 2.1, spray: "heavy" },
        { at: 1560, parts: ["legL", "legR", "head"], gore: 52, force: 2.5, spray: "heavy" },
        { at: 2140, parts: ["torso"], gore: 58, force: 2.6, spray: "heavy" },
      ],
      beam: [
        { at: 880, parts: ["armR"], gore: 32, force: 1.7 },
        { at: 1380, parts: ["armL", "head"], gore: 44, force: 2.1 },
        { at: 1980, parts: ["legL", "legR", "torso"], gore: 56, force: 2.5, spray: "heavy" },
      ],
      bone: [
        { at: 820, parts: ["armL", "armR", "legL"], gore: 34, force: 1.6, spray: "bone" },
        { at: 1420, parts: ["legR", "head"], gore: 46, force: 2.0, spray: "bone" },
        { at: 2040, parts: ["torso"], gore: 54, force: 2.3, spray: "bone" },
      ],
      flame: [
        { at: 900, parts: ["legL", "legR"], gore: 36, force: 1.7, spray: "flame" },
        { at: 1520, parts: ["armL", "armR", "head"], gore: 50, force: 2.2, spray: "flame" },
        { at: 2120, parts: ["torso"], gore: 58, force: 2.5, spray: "heavy" },
      ],
      shadow: [
        { at: 860, parts: ["armL", "armR"], gore: 30, force: 1.4, spray: "shadow" },
        { at: 1440, parts: ["legL", "legR"], gore: 38, force: 1.6, spray: "shadow" },
        { at: 2060, parts: ["head", "torso"], gore: 52, force: 2.2, spray: "heavy" },
      ],
      rush: [
        { at: 880, parts: ["head"], gore: 40, force: 1.9 },
        { at: 1460, parts: ["armL", "armR"], gore: 46, force: 2.1 },
        { at: 2080, parts: ["legL", "legR", "torso"], gore: 56, force: 2.4 },
      ],
      rift: [
        { at: 900, parts: ["head"], gore: 38, force: 1.8 },
        { at: 1540, parts: ["armL", "armR", "legL", "legR"], gore: 54, force: 2.4 },
        { at: 2140, parts: ["torso"], gore: 58, force: 2.5 },
      ],
    };
    return (defaults[family] || defaults.rift).map((burst) => ({ ...burst }));
  }

  function fatalityTagline(id, character = null) {
    const styleId = id || activeFinisherStyle(character);
    const riftality = riftalityForFighter(styleId);
    if (riftality?.tagline) return riftality.tagline;
    if (fatalityTaglines[styleId]) return fatalityTaglines[styleId];
    if (character?.finisher) return character.finisher;
    const catalog = getBuilderRiftality(styleId);
    if (catalog && catalog.id !== "personal") return catalog.label.toUpperCase();
    return getCharacter(styleId)?.finisher || "RIFTALITY";
  }

  function isPartDetached(f, part) {
    return Boolean(f.detachedParts && f.detachedParts.has(part));
  }

  function limbPartConfig(victim, part, dir, forceMul) {
    const p = victim.palette;
    const ch = victim.character;
    const heavy = ch.body === "heavy";
    const skeletal = ch.body === "skeletal";
    const skin = skeletal ? p.white : p.skin;
    const base = { x: victim.x, y: victim.y, rot: (Math.random() - 0.5) * 0.8, spin: (Math.random() - 0.5) * 0.014 * forceMul, life: 9000, maxLife: 9000, part };
    const push = (vx, vy, w, h, colors, extra = {}) => ({
      ...base,
      vx: vx * forceMul,
      vy: vy * forceMul,
      w,
      h,
      colors,
      ...extra,
    });

    if (part === "head") {
      return push(dir * (160 + Math.random() * 180), -300 - Math.random() * 220, 28, 28, [skin, p.hair, p.accent, "#5b0306"], { kind: "head", bob: true });
    }
    if (part === "armL") {
      return push(-dir * (120 + Math.random() * 160), -180 - Math.random() * 180, heavy ? 22 : 18, heavy ? 38 : 32, [skin, p.gloves, "#7a0508"]);
    }
    if (part === "armR") {
      return push(dir * (180 + Math.random() * 220), -160 - Math.random() * 200, heavy ? 24 : 20, heavy ? 40 : 34, [skin, p.gloves, "#8b0a0d"]);
    }
    if (part === "legL") {
      return push(-dir * (90 + Math.random() * 140), -90 - Math.random() * 120, heavy ? 20 : 16, heavy ? 44 : 38, [skin, p.boots, p.white, "#6d0406"]);
    }
    if (part === "legR") {
      return push(dir * (130 + Math.random() * 170), -80 - Math.random() * 130, heavy ? 20 : 16, heavy ? 44 : 38, [skin, p.boots, p.white, "#6d0406"]);
    }
    if (part === "torso") {
      return push(dir * (60 + Math.random() * 90), -240 - Math.random() * 160, heavy ? 58 : 44, heavy ? 52 : 42, [skin, p.trunks, p.trunksDark, "#4b0305"], { kind: "torso" });
    }
    if (part === "antler") {
      return push(dir * (100 + Math.random() * 120), -320 - Math.random() * 180, 46, 18, ["#6b5a48", "#8fd46a", "#3a3028"], { kind: "antler", spin: 0.02 });
    }
    return push(dir * 120, -200, 14, 14, [skin, "#7a0508"]);
  }

  function spawnGoreChunks(x, y, dir, count, spray = "heavy") {
    const palettes = {
      heavy: ["#7a0508", "#b40d12", "#e02a22", "#4b0305", "#efe4cf"],
      bone: ["#efe4cf", "#d8cfc0", "#7a0508", "#b40d12"],
      flame: ["#ff7746", "#ffe65d", "#b40d12", "#7a0508"],
      shadow: ["#1a1418", "#6732b4", "#7a0508", "#b40d12"],
      glitch: ["#5ce0ff", "#7a0508", "#b40d12", "#1e3a5f"],
      code: ["#3dff90", "#7a0508", "#1a2b20", "#b40d12"],
      spiral: ["#f0c632", "#7a0508", "#3a4a5a", "#b40d12"],
      flood: ["#4aa8ff", "#0c1a2a", "#7a0508", "#6ec8ff"],
      peel: ["#e02a22", "#7a0508", "#d8cfc0", "#4b0305"],
      shatter: ["#c7f3ff", "#7a0508", "#aeb8bd", "#b40d12"],
    };
    const colors = palettes[spray] || palettes.heavy;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.random() - 0.5) * Math.PI * 1.2 - dir * 0.35;
      const speed = 180 + Math.random() * (spray === "heavy" ? 520 : 380);
      goreChunks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: -140 - Math.random() * (spray === "flood" ? 420 : 280),
        w: 4 + Math.random() * (spray === "bone" ? 10 : 14),
        h: 3 + Math.random() * 10,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.02,
        life: 1200 + Math.random() * 1800,
        maxLife: 3000,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: spray === "flood" ? 420 : 2100,
      });
    }
  }

  function detachFatalityParts(victim, burst, dir) {
    if (!victim.detachedParts) victim.detachedParts = new Set();
    const force = burst.force || 1.5;
    const anchorX = victim.x;
    const anchorY = victim.y - 82;
    for (const part of burst.parts) {
      if (victim.detachedParts.has(part)) continue;
      victim.detachedParts.add(part);
      const limb = limbPartConfig(victim, part, dir, force);
      limb.x = anchorX + (part === "armL" ? -18 : part === "armR" ? 18 : 0);
      limb.y = anchorY + (part === "head" ? -52 : part === "legL" || part === "legR" ? 34 : part === "torso" ? -8 : 0);
      limbs.push(limb);
      addGore(limb.x, limb.y, dir, burst.gore || 24, true);
      spawnGoreChunks(limb.x, limb.y, dir, Math.round((burst.gore || 24) * 0.55), burst.spray || "heavy");
      addStain(limb.x, FLOOR + 2, 18 + Math.random() * 22, "#5b0306");
      game.shake = Math.max(game.shake, 18 + force * 6);
      game.hitStop = Math.max(game.hitStop, 48 + force * 12);
      game.flash = Math.max(game.flash, 0.12 + force * 0.04);
    }
  }

  function processFatalityBursts(t) {
    if (!game.finisher || !game.finisher.bursts) return;
    while (game.finisher.burstIndex < game.finisher.bursts.length && t >= game.finisher.bursts[game.finisher.burstIndex].at) {
      detachFatalityParts(enemy, game.finisher.bursts[game.finisher.burstIndex], game.finisher.dir);
      game.finisher.burstIndex += 1;
    }
  }

  function updateLimbs(dt) {
    const step = dt / 1000;
    for (const limb of limbs) {
      limb.life -= dt;
      limb.vy += 2100 * step;
      limb.x += limb.vx * step;
      limb.y += limb.vy * step;
      limb.rot += limb.spin;
      if (limb.y >= FLOOR - 4) {
        limb.y = FLOOR - 4;
        limb.vy *= -0.22;
        limb.vx *= 0.72;
        if (Math.abs(limb.vy) < 80) limb.vy = 0;
      }
      limb.x = clamp(limb.x, -40, W + 40);
    }
    limbs = limbs.filter((limb) => limb.life > 0 && limb.y < H + 80);
  }

  function updateGoreChunks(dt) {
    const step = dt / 1000;
    for (const chunk of goreChunks) {
      chunk.life -= dt;
      chunk.vy += (chunk.gravity || 2100) * step;
      chunk.x += chunk.vx * step;
      chunk.y += chunk.vy * step;
      chunk.rot += chunk.spin;
      if (chunk.y >= FLOOR - 2) {
        chunk.y = FLOOR - 2;
        chunk.vy *= -0.18;
        chunk.vx *= 0.6;
      }
    }
    goreChunks = goreChunks.filter((chunk) => chunk.life > 0);
  }

  function drawLimbStump(f, part, lean, crouch) {
    const p = f.palette;
    const y = crouch ? 16 : 0;
    ctx.fillStyle = "#7a0508";
    if (part === "head") rect(-10 + lean, -128 + y, 20, 10, "#7a0508");
    if (part === "armL") rect(-34 + lean, -104 + y, 12, 16, "#7a0508");
    if (part === "armR") rect(20 + lean, -104 + y, 12, 16, "#7a0508");
    if (part === "legL") rect(-24 + lean, -48, 10, 14, "#7a0508");
    if (part === "legR") rect(12 + lean, -48, 10, 14, "#7a0508");
    if (part === "torso") rect(-18 + lean, -108 + y, 36, 22, "#5b0306");
    if (part === "antler") rect(-8 + lean, -156 + y, 16, 8, "#6b5a48");
    ctx.fillStyle = p.skin;
  }

  function drawLimbs() {
    for (const limb of limbs) {
      ctx.save();
      ctx.translate(Math.round(limb.x), Math.round(limb.y));
      ctx.rotate(limb.rot);
      const alpha = clamp(limb.life / limb.maxLife, 0.35, 1);
      ctx.globalAlpha = alpha;
      const [c1, c2, c3, c4] = limb.colors;
      if (limb.kind === "head") {
        rect(-limb.w / 2, -limb.h, limb.w, limb.h, c1);
        rect(-limb.w / 2 - 2, -limb.h - 6, limb.w + 4, 8, c2);
        rect(-4, -limb.h + 10, 8, 8, "#0b1018");
        rect(4, -limb.h + 10, 8, 8, "#0b1018");
        rect(-8, -limb.h + 18, 16, 5, c4 || "#7a0508");
      } else if (limb.kind === "torso") {
        rect(-limb.w / 2, -limb.h, limb.w, limb.h, c1);
        rect(-limb.w / 2 + 4, -limb.h + 8, limb.w - 8, 12, c2);
        rect(-limb.w / 2 + 2, -limb.h + 24, limb.w - 4, 8, c3);
        rect(-6, -limb.h + 2, 12, 10, c4 || "#7a0508");
      } else if (limb.kind === "antler") {
        rect(-limb.w / 2, -limb.h, limb.w, 8, c1);
        rect(-8, -limb.h - 10, 6, 18, c2);
        rect(10, -limb.h - 8, 5, 16, c2);
        rect(-limb.w / 2 + 6, -limb.h + 4, limb.w - 12, 6, c3);
      } else if (limb.part === "armL" || limb.part === "armR") {
        rect(-limb.w / 2, -limb.h, limb.w, limb.h - 10, c1);
        rect(-limb.w / 2 - 2, -12, limb.w + 4, 14, c2);
        rect(-4, -limb.h + 4, 8, 10, c3 || "#7a0508");
      } else {
        rect(-limb.w / 2, -limb.h, limb.w, limb.h - 8, c1);
        rect(-limb.w / 2 - 2, -10, limb.w + 4, 10, c3 || c2);
        rect(-limb.w / 2, -limb.h + 6, limb.w, 6, c4 || "#7a0508");
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawGoreChunks() {
    for (const chunk of goreChunks) {
      ctx.save();
      ctx.globalAlpha = clamp(chunk.life / chunk.maxLife, 0, 1);
      ctx.translate(chunk.x, chunk.y);
      ctx.rotate(chunk.rot);
      rect(-chunk.w / 2, -chunk.h / 2, chunk.w, chunk.h, chunk.color);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function updateBgFx(dt) {
    const arena = getArena();
    if (game.phase !== "fight" && game.phase !== "countdown" && game.phase !== "finishPrompt" && game.phase !== "finisher") return;

    if (game.bgFx.length < 48 && Math.random() < 0.16) {
      const kind = arena.fx;
      if (kind === "rain") {
        game.bgFx.push({ kind, x: Math.random() * W, y: -8, vy: 420 + Math.random() * 180, len: 10 + Math.random() * 16, life: 900 });
      } else if (kind === "embers") {
        game.bgFx.push({ kind, x: Math.random() * W, y: FLOOR - 40 - Math.random() * 180, vy: -30 - Math.random() * 50, vx: (Math.random() - 0.5) * 24, life: 1200 + Math.random() * 900, hue: 250 + Math.random() * 60 });
      } else if (kind === "sparks") {
        game.bgFx.push({ kind, x: 80 + Math.random() * (W - 160), y: 70 + Math.random() * 120, vy: 12 + Math.random() * 18, vx: (Math.random() - 0.5) * 30, life: 500 + Math.random() * 500 });
      } else if (kind === "metro") {
        game.bgFx.push({ kind, x: Math.random() * W, y: 120 + Math.random() * 90, life: 700 + Math.random() * 900, pulse: Math.random() });
      } else if (kind === "music") {
        game.bgFx.push({ kind, x: 110 + Math.random() * (W - 220), y: 72 + Math.random() * 130, vy: 10 + Math.random() * 16, life: 700 + Math.random() * 700, color: Math.random() > 0.5 ? "#ff3bd5" : "#42f5ff" });
      } else if (kind === "arcade") {
        game.bgFx.push({ kind, x: 40 + Math.random() * (W - 80), y: 70 + Math.random() * 210, vy: 8 + Math.random() * 18, vx: (Math.random() - 0.5) * 34, life: 700 + Math.random() * 800, color: Math.random() > 0.5 ? "#62ff7a" : "#ffdd3d" });
      } else if (kind === "signal") {
        game.bgFx.push({ kind, x: 40 + Math.random() * (W - 80), y: 58 + Math.random() * 210, vx: (Math.random() - 0.5) * 18, life: 460 + Math.random() * 680, color: Math.random() > 0.72 ? "#e6293f" : "#c7f7ff" });
      } else if (kind === "haunt") {
        game.bgFx.push({ kind, x: 40 + Math.random() * (W - 80), y: 94 + Math.random() * 220, vx: -14 + Math.random() * 28, vy: -8 - Math.random() * 18, life: 1300 + Math.random() * 1200, size: 18 + Math.random() * 26 });
      }
    }

    game.bgFx = game.bgFx.filter((fx) => {
      fx.life -= dt;
      if (fx.kind === "rain") fx.y += fx.vy * (dt / 1000);
      if (fx.kind === "embers") {
        fx.y += fx.vy * (dt / 1000);
        fx.x += fx.vx * (dt / 1000);
      }
      if (fx.kind === "sparks") {
        fx.y += fx.vy * (dt / 1000);
        fx.x += fx.vx * (dt / 1000);
      }
      if (fx.kind === "music" || fx.kind === "arcade") {
        fx.y += fx.vy * (dt / 1000);
        fx.x += (fx.vx || Math.sin(game.time + fx.x) * 8) * (dt / 1000);
      }
      if (fx.kind === "signal") fx.x += fx.vx * (dt / 1000);
      if (fx.kind === "haunt") {
        fx.x += fx.vx * (dt / 1000);
        fx.y += fx.vy * (dt / 1000);
      }
      return fx.life > 0 && fx.y < H + 20;
    });
  }

  function update(dt) {
    game.time += dt / 1000;
    if (game.shake > 0) game.shake -= dt * 0.06;
    if (game.flash > 0) game.flash -= dt / 1000;
    if (game.toastTime > 0) game.toastTime -= dt;
    if (game.arenaPulse > 0) game.arenaPulse = Math.max(0, game.arenaPulse - dt / 1400);
    updateSignalBuffer(dt);

    if (game.phase === "splash" || game.phase === "select") {
      updateParticles(dt);
      return;
    }

    if (game.phase === "over") {
      updateParticles(dt);
      updateLimbs(dt);
      updateGoreChunks(dt);
      return;
    }

    updateBgFx(dt);

    if (game.phase === "countdown") updateCountdown(dt);
    if (game.phase === "fight") updateFightClock(dt);

    updatePlayerInput(dt);
    updateAI(dt);
    updateFighter(player, enemy, dt);
    updateFighter(enemy, player, dt);
    if (attackBuffer) {
      attackBufferTime -= dt;
      if (attackBufferTime <= 0) {
        attackBuffer = null;
        attackBufferTime = 0;
      } else {
        flushAttackBuffer();
      }
    }
    separateFighters();
    updateProjectiles(dt);
    updateParticles(dt);
    updateComboFloats(dt);

    if (game.phase === "finishPrompt") updateFinishPrompt(dt);
    if (game.phase === "finisher") {
      updateFinisher(dt);
      updateLimbs(dt);
      updateGoreChunks(dt);
    }

    player.meter = clamp(player.meter + 0.0025 * dt, 0, 100);
    enemy.meter = clamp(enemy.meter + 0.002 * dt, 0, 100);
  }

  function isSignalCorruptedArena(arena = getArena()) {
    return arena?.id === "raven-hollow-relay" || arena?.fx === "signal";
  }

  function updateSignalBuffer(dt) {
    if (!isSignalCorruptedArena() || game.phase === "splash" || game.phase === "select") {
      game.signalBufferTimer = 0;
      game.signalBufferNext = 3800;
      return;
    }
    if (game.signalBufferTimer > 0) {
      game.signalBufferTimer = Math.max(0, game.signalBufferTimer - dt);
      if (game.signalBufferTimer > 0 && game.phase === "fight" && Math.floor(game.signalBufferTimer / 95) % 2 === 0) {
        afterImages.push({ fighter: player, x: player.x, y: player.y, facing: player.facing, life: 180 });
        afterImages.push({ fighter: enemy, x: enemy.x, y: enemy.y, facing: enemy.facing, life: 180 });
      }
      return;
    }
    game.signalBufferNext -= dt;
    if (game.signalBufferNext <= 0) {
      game.signalBufferTimer = 700;
      game.signalBufferNext = 9000 + Math.random() * 8000;
      game.arenaPulse = Math.min(1, game.arenaPulse + 0.25);
      game.shake = Math.max(game.shake, 3);
    }
  }

  function drawInteractiveArenaFx(arena) {
    for (const fx of game.bgFx) {
      if (fx.kind === "rain") {
        ctx.strokeStyle = "rgba(141, 230, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx.x, fx.y);
        ctx.lineTo(fx.x - 4, fx.y + fx.len);
        ctx.stroke();
      } else if (fx.kind === "embers") {
        ctx.fillStyle = `hsla(${fx.hue}, 80%, 68%, ${clamp(fx.life / 1200, 0, 0.8)})`;
        ctx.fillRect(fx.x, fx.y, 3, 3);
      } else if (fx.kind === "sparks") {
        ctx.fillStyle = `rgba(255, 170, 70, ${clamp(fx.life / 700, 0, 0.9)})`;
        ctx.fillRect(fx.x, fx.y, 2, 2);
      } else if (fx.kind === "metro") {
        const alpha = (0.18 + fx.pulse * 0.22) * clamp(fx.life / 900, 0, 1) * (0.7 + game.arenaPulse * 0.8);
        ctx.fillStyle = `rgba(255, 196, 84, ${alpha})`;
        ctx.fillRect(fx.x, fx.y, 10, 4);
      } else if (fx.kind === "music") {
        ctx.fillStyle = fx.color;
        ctx.globalAlpha = clamp(fx.life / 900, 0, 0.75);
        ctx.fillRect(fx.x, fx.y, 4, 16);
        ctx.fillRect(fx.x - 5, fx.y + 12, 14, 4);
        ctx.globalAlpha = 1;
      } else if (fx.kind === "arcade") {
        ctx.fillStyle = fx.color;
        ctx.globalAlpha = clamp(fx.life / 900, 0, 0.7);
        ctx.fillRect(fx.x, fx.y, 6, 6);
        ctx.globalAlpha = 1;
      } else if (fx.kind === "signal") {
        ctx.fillStyle = fx.color;
        ctx.globalAlpha = clamp(fx.life / 700, 0, 0.55);
        ctx.fillRect(fx.x, fx.y, 18 + Math.sin(game.time * 3) * 3, 2);
        ctx.fillRect(fx.x + 6, fx.y + 9, 11, 2);
        ctx.globalAlpha = 1;
      } else if (fx.kind === "haunt") {
        const alpha = clamp(fx.life / 1600, 0, 0.46);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "rgba(210, 245, 255, 0.72)";
        ctx.beginPath();
        ctx.ellipse(fx.x, fx.y, fx.size * 0.55, fx.size, Math.sin(game.time + fx.x) * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(10, 20, 28, 0.55)";
        ctx.beginPath();
        ctx.arc(fx.x - fx.size * 0.16, fx.y - fx.size * 0.18, 2.5, 0, Math.PI * 2);
        ctx.arc(fx.x + fx.size * 0.16, fx.y - fx.size * 0.18, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    if (arena.fx === "rain") {
      ctx.fillStyle = `rgba(90, 220, 255, ${0.03 + Math.min(0.04, game.arenaPulse * 0.03)})`;
      ctx.fillRect(0, FLOOR, W, 10);
    }

    if (arena.fx === "embers") {
      const glow = ctx.createRadialGradient(W * 0.5, 120, 20, W * 0.5, 120, 220);
      glow.addColorStop(0, `rgba(176, 100, 255, ${0.08 + Math.sin(game.time * 2) * 0.03})`);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, 260);
    }

    if (arena.fx === "sparks") {
      ctx.fillStyle = `rgba(255, 140, 60, ${0.025 + Math.min(0.04, game.arenaPulse * 0.03)})`;
      ctx.fillRect(0, 0, W, 36);
      for (let i = 0; i < 3; i += 1) {
        const x = 120 + i * 280 + Math.sin(game.time * 1.2 + i) * 8;
        ctx.fillStyle = `rgba(255, 196, 84, ${0.1 + Math.min(0.08, game.arenaPulse * 0.06)})`;
        ctx.fillRect(x, 40, 18, 4);
      }
    }

    if (arena.fx === "metro" || arena.fx === "rain") {
      // Soft rim only — never full-frame strobe with hit pulses (Neon Docks / Metro).
      const pulse = 0.035 + Math.min(0.05, game.arenaPulse * 0.04);
      ctx.fillStyle = `rgba(120, 200, 255, ${pulse})`;
      ctx.fillRect(0, 0, W, 10);
    }

    if (arena.fx === "music") {
      const pulse = 0.04 + Math.sin(game.time * 1.5) * 0.015 + Math.min(0.05, game.arenaPulse * 0.04);
      ctx.fillStyle = `rgba(255, 46, 196, ${pulse})`;
      ctx.fillRect(0, 0, W, 18);
      ctx.fillStyle = `rgba(66, 245, 255, ${0.04 + Math.min(0.05, game.arenaPulse * 0.04)})`;
      ctx.fillRect(0, FLOOR - 14, W, 10);
    }

    if (arena.fx === "arcade") {
      ctx.fillStyle = `rgba(98, 255, 122, ${0.03 + Math.min(0.04, game.arenaPulse * 0.03)})`;
      for (let y = 42; y < FLOOR - 20; y += 36) ctx.fillRect(0, y, W, 1);
      ctx.fillStyle = `rgba(255, 221, 61, ${0.04 + Math.min(0.05, game.arenaPulse * 0.04)})`;
      ctx.fillRect(0, FLOOR - 10, W, 6);
    }

    if (arena.fx === "signal") {
      // Soft CRT lines only — no seizure-rate scan / full-frame flicker.
      const buffering = game.signalBufferTimer > 0;
      ctx.save();
      ctx.fillStyle = `rgba(199, 247, 255, ${0.03 + Math.min(0.04, game.arenaPulse * 0.03)})`;
      for (let y = 26; y < FLOOR; y += buffering ? 28 : 40) ctx.fillRect(0, y, W, 1);
      if (buffering) {
        ctx.fillStyle = "rgba(230, 41, 63, 0.06)";
        ctx.fillRect(0, 110 + Math.sin(game.time * 2.2) * 6, W, 4);
      }
      ctx.restore();
    }

    if (arena.fx === "haunt") {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const fog = 0.08 + Math.sin(game.time * 1.4) * 0.025 + game.arenaPulse * 0.08;
      ctx.fillStyle = `rgba(190, 235, 240, ${fog})`;
      for (let y = FLOOR - 130; y < FLOOR + 30; y += 28) {
        ctx.fillRect(Math.sin(game.time * 0.7 + y) * 28, y, W, 10);
      }
      ctx.fillStyle = `rgba(155, 220, 255, ${0.05 + game.arenaPulse * 0.12})`;
      ctx.fillRect(0, 0, W, 72);
      ctx.restore();
    }
  }

  function drawGeneratedArena(arena, parallax) {
    if (arena.id === "orbital-graveyard") {
      drawOrbitalGraveyardArena(parallax);
      return true;
    }
    if (arena.id === "music-festival") {
      drawMusicFestivalArena(parallax);
      return true;
    }
    if (arena.id === "rooftop-arcade") {
      drawRooftopArcadeArena(parallax);
      return true;
    }
    if (arena.id === "raven-hollow-relay") {
      drawRavenHollowRelayArena(parallax);
      return true;
    }
    if (arena.id === "haunted-stadium") {
      drawHauntedStadiumArena(parallax);
      return true;
    }
    return false;
  }

  function drawOrbitalGraveyardProceduralArena(parallax) {
    ctx.fillStyle = "#02050d";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-parallax, 0);
    for (let i = 0; i < 96; i += 1) {
      const x = (i * 97 + 41) % W;
      const y = (i * 53 + 19) % Math.round(FLOOR - 70);
      const pulse = 0.45 + Math.sin(game.time * 2 + i) * 0.22;
      ctx.fillStyle = `rgba(220, 242, 255, ${pulse})`;
      ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
    }
    ctx.fillStyle = "#10233d";
    ctx.beginPath();
    ctx.arc(W * 0.18, H * 0.2, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(64, 179, 255, 0.32)";
    ctx.beginPath();
    ctx.arc(W * 0.15, H * 0.17, 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#151d29";
    ctx.fillRect(0, FLOOR - 42, W, H - FLOOR + 42);
    ctx.strokeStyle = "rgba(83, 236, 255, 0.45)";
    ctx.lineWidth = 3;
    ctx.strokeRect(24, FLOOR - 34, W - 48, 44);
    ctx.fillStyle = "rgba(255, 214, 72, 0.42)";
    for (let x = 50; x < W - 40; x += 84) ctx.fillRect(x, FLOOR - 20, 42, 5);
    ctx.restore();
  }

  function drawOrbitalGraveyardArena(parallax, backgroundAsset, floorAsset) {
    if (!backgroundAsset?.ready || !floorAsset?.ready) {
      drawOrbitalGraveyardProceduralArena(parallax);
      return;
    }
    ctx.fillStyle = "#02050d";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    const bgShift = parallax * 0.42;
    ctx.translate(-bgShift, 0);
    ctx.drawImage(backgroundAsset.image, bgShift, 0, W, FLOOR + 2);
    ctx.restore();
    ctx.save();
    const floorShift = parallax;
    ctx.translate(-floorShift, 0);
    ctx.drawImage(floorAsset.image, floorShift, FLOOR - 46, W, H - FLOOR + 46);
    ctx.restore();
    ctx.fillStyle = "rgba(0, 0, 8, 0.12)";
    ctx.fillRect(0, 0, W, H);
  }

  function drawHauntedStadiumArena(parallax) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#07121b");
    sky.addColorStop(0.46, "#080a12");
    sky.addColorStop(1, "#030405");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-parallax * 0.4, 0);
    ctx.fillStyle = "#0e151c";
    ctx.fillRect(38, 118, W - 76, 218);
    ctx.fillStyle = "#18212a";
    for (let row = 0; row < 8; row += 1) {
      ctx.fillRect(58, 137 + row * 22, W - 116, 8);
    }
    ctx.fillStyle = "rgba(200, 245, 255, 0.18)";
    for (let i = 0; i < 34; i += 1) {
      ctx.fillRect(70 + i * 27, 151 + (i % 6) * 22, 12, 6);
    }
    ctx.fillStyle = "rgba(126, 240, 212, 0.12)";
    for (let i = 0; i < 11; i += 1) {
      ctx.beginPath();
      ctx.arc(112 + i * 78, 171 + (i % 3) * 38, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#080a0d";
    ctx.fillRect(W * 0.5 - 166, 72, 332, 70);
    ctx.strokeStyle = "#7df0d4";
    ctx.lineWidth = 3;
    ctx.strokeRect(W * 0.5 - 166, 72, 332, 70);
    ctx.fillStyle = "#d8fbef";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "#7df0d4";
    ctx.shadowBlur = 14;
    ctx.fillText("HAUNTED STADIUM", W * 0.5, 101);
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = "#d6b047";
    ctx.fillText("PLOT PULSE 33  VISITOR 0", W * 0.5, 125);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(216, 251, 239, 0.86)";
    ctx.lineWidth = 5;
    const goalLeft = 96 - parallax * 0.2;
    const goalRight = W - 96 - parallax * 0.2;
    for (const gx of [goalLeft, goalRight]) {
      ctx.beginPath();
      ctx.moveTo(gx, FLOOR - 44);
      ctx.lineTo(gx, 250);
      ctx.moveTo(gx - 42, 250);
      ctx.lineTo(gx + 42, 250);
      ctx.moveTo(gx - 42, 250);
      ctx.lineTo(gx - 42, 202);
      ctx.moveTo(gx + 42, 250);
      ctx.lineTo(gx + 42, 202);
      ctx.stroke();
    }
    ctx.restore();

    const turf = ctx.createLinearGradient(0, FLOOR - 96, 0, H);
    turf.addColorStop(0, "#143c31");
    turf.addColorStop(0.56, "#0d241e");
    turf.addColorStop(1, "#07100d");
    ctx.fillStyle = turf;
    ctx.fillRect(0, FLOOR - 96, W, H - FLOOR + 96);
    ctx.fillStyle = "rgba(4, 12, 10, 0.32)";
    for (let stripe = 0; stripe < 12; stripe += 1) {
      ctx.fillRect(stripe * 92, FLOOR - 96, 46, H - FLOOR + 96);
    }
    ctx.strokeStyle = "rgba(242, 234, 210, 0.74)";
    ctx.lineWidth = 3;
    for (let x = 64; x < W; x += 74) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR - 92);
      ctx.lineTo(x + 24, H);
      ctx.stroke();
      for (let y = FLOOR - 78; y < H - 12; y += 24) {
        ctx.fillStyle = "rgba(242, 234, 210, 0.72)";
        ctx.fillRect(x - 9, y, 18, 3);
      }
    }
    ctx.fillStyle = "rgba(216, 176, 71, 0.22)";
    ctx.fillRect(0, FLOOR - 96, 104, H - FLOOR + 96);
    ctx.fillRect(W - 104, FLOOR - 96, 104, H - FLOOR + 96);
    ctx.strokeStyle = "rgba(125, 240, 212, 0.42)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(W * 0.5, FLOOR - 42, 86, 24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(196, 248, 255, 0.11)";
    for (let x = -80; x < W + 80; x += 84) {
      ctx.beginPath();
      ctx.moveTo(x, H + 8);
      ctx.lineTo(x + 124, FLOOR - 96);
      ctx.lineTo(x + 140, FLOOR - 96);
      ctx.lineTo(x + 18, H + 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(220, 245, 255, 0.16)";
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.ellipse(120 + i * 150 + Math.sin(game.time + i) * 10, FLOOR - 74 + (i % 2) * 22, 34, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRavenHollowRelayArena(parallax) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#07101b");
    sky.addColorStop(0.42, "#090b14");
    sky.addColorStop(1, "#020305");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-parallax * 0.35, 0);
    ctx.fillStyle = "#d8eef5";
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.arc(W * 0.74, 82, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(W * 0.74, 82, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "#262b31";
    ctx.lineWidth = 5;
    const towerX = W * 0.5 + 34;
    ctx.beginPath();
    ctx.moveTo(towerX - 46, FLOOR - 28);
    ctx.lineTo(towerX, 106);
    ctx.lineTo(towerX + 48, FLOOR - 28);
    ctx.moveTo(towerX - 30, 176);
    ctx.lineTo(towerX + 31, 176);
    ctx.moveTo(towerX - 36, 246);
    ctx.lineTo(towerX + 38, 246);
    ctx.moveTo(towerX - 42, 320);
    ctx.lineTo(towerX + 44, 320);
    for (let y = 132; y < FLOOR - 34; y += 38) {
      ctx.moveTo(towerX - 38 + (y % 76) * 0.18, y);
      ctx.lineTo(towerX + 38 - (y % 76) * 0.18, y + 28);
      ctx.moveTo(towerX + 38 - (y % 76) * 0.18, y);
      ctx.lineTo(towerX - 38 + (y % 76) * 0.18, y + 28);
    }
    ctx.stroke();
    ctx.fillStyle = "#c7f7ff";
    ctx.globalAlpha = 0.55 + Math.sin(game.time * 5) * 0.25;
    ctx.fillRect(towerX - 8, 96, 16, 16);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.translate(-parallax * 0.65, 0);
    for (let i = 0; i < 18; i += 1) {
      const x = -40 + i * 66;
      const bend = Math.sin(i * 1.7) * 18;
      ctx.strokeStyle = i % 2 ? "#07090c" : "#0b0d12";
      ctx.lineWidth = 13 + (i % 3) * 4;
      ctx.beginPath();
      ctx.moveTo(x, FLOOR - 18);
      ctx.quadraticCurveTo(x + bend, 250, x + bend * 0.55, 128 + (i % 4) * 18);
      ctx.stroke();
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + bend * 0.32, 252);
      ctx.lineTo(x + bend * 0.32 - 48, 190 + (i % 2) * 30);
      ctx.moveTo(x + bend * 0.24, 220);
      ctx.lineTo(x + bend * 0.24 + 52, 176 + (i % 3) * 22);
      ctx.stroke();
    }
    ctx.restore();

    const screens = [
      [124, 170, -0.16],
      [264, 112, 0.12],
      [704, 146, -0.08],
      [842, 214, 0.14],
      [406, 210, 0.06],
    ];
    for (let i = 0; i < screens.length; i += 1) {
      const [x, y, rot] = screens[i];
      drawHangingCrt(x - parallax * 0.18, y, rot, i);
    }

    ctx.fillStyle = "#08090d";
    ctx.fillRect(0, FLOOR - 38, W, H - FLOOR + 38);
    ctx.fillStyle = "#111823";
    ctx.fillRect(0, FLOOR - 38, W, 8);
    ctx.fillStyle = "rgba(199, 247, 255, 0.08)";
    for (let x = -70; x < W + 80; x += 88) {
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + 132, FLOOR - 38);
      ctx.lineTo(x + 146, FLOOR - 38);
      ctx.lineTo(x + 18, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(230, 41, 63, 0.13)";
    ctx.fillRect(0, FLOOR - 8, W, 4);
  }

  function drawHangingCrt(x, y, rot, index) {
    const flashJenny = Math.floor(game.time * 2 + index) % 7 === 0 || game.signalBufferTimer > 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = "#1b242d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.lineTo(0, -7);
    ctx.stroke();
    ctx.fillStyle = "#161a20";
    ctx.fillRect(-29, -7, 58, 42);
    ctx.fillStyle = "#050608";
    ctx.fillRect(-23, -1, 46, 28);
    ctx.fillStyle = flashJenny ? "rgba(199, 247, 255, 0.82)" : "rgba(120, 183, 216, 0.25)";
    ctx.fillRect(-19, 3, 38, 20);
    if (flashJenny) {
      ctx.fillStyle = "#17191f";
      ctx.fillRect(-10, 2, 20, 8);
      ctx.fillStyle = "#e6293f";
      ctx.fillRect(5, 11, 7, 3);
      ctx.fillStyle = "#07101b";
      ctx.fillRect(-8, 11, 5, 5);
    } else {
      ctx.fillStyle = "rgba(230, 41, 63, 0.45)";
      ctx.fillRect(-16, 11, 31, 2);
    }
    ctx.fillStyle = "#28323c";
    ctx.fillRect(-19, 29, 38, 3);
    ctx.restore();
  }

  function drawMusicFestivalArena(parallax) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#130817");
    sky.addColorStop(0.45, "#170d24");
    sky.addColorStop(1, "#07070a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-parallax * 0.55, 0);
    ctx.fillStyle = "#050608";
    ctx.fillRect(88, 98, W - 176, 250);
    ctx.fillStyle = "#17101f";
    ctx.fillRect(126, 128, W - 252, 182);
    ctx.strokeStyle = "#3b244b";
    ctx.lineWidth = 8;
    ctx.strokeRect(106, 108, W - 212, 218);
    ctx.fillStyle = "#25222c";
    for (let x = 120; x < W - 90; x += 68) {
      ctx.fillRect(x, 86, 12, 262);
      ctx.fillRect(x - 24, 104, 60, 8);
    }

    const leftBeam = ctx.createLinearGradient(180, 94, 360, FLOOR - 70);
    leftBeam.addColorStop(0, "rgba(255, 44, 188, 0.34)");
    leftBeam.addColorStop(1, "rgba(255, 44, 188, 0)");
    ctx.fillStyle = leftBeam;
    ctx.beginPath();
    ctx.moveTo(178, 102);
    ctx.lineTo(408 + Math.sin(game.time * 2) * 30, FLOOR - 58);
    ctx.lineTo(322 + Math.sin(game.time * 2) * 20, FLOOR - 58);
    ctx.closePath();
    ctx.fill();

    const rightBeam = ctx.createLinearGradient(W - 180, 94, W - 360, FLOOR - 70);
    rightBeam.addColorStop(0, "rgba(64, 245, 255, 0.3)");
    rightBeam.addColorStop(1, "rgba(64, 245, 255, 0)");
    ctx.fillStyle = rightBeam;
    ctx.beginPath();
    ctx.moveTo(W - 178, 102);
    ctx.lineTo(W - 408 + Math.cos(game.time * 2.2) * 28, FLOOR - 58);
    ctx.lineTo(W - 322 + Math.cos(game.time * 2.2) * 18, FLOOR - 58);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fb2bd0";
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "#fb2bd0";
    ctx.shadowBlur = 18;
    ctx.fillText("MIDNIGHT FEST", W * 0.5, 168);
    ctx.shadowBlur = 0;

    for (let i = 0; i < 20; i += 1) {
      const h = 12 + ((i * 17 + Math.floor(game.time * 18)) % 74);
      const x = W * 0.5 - 190 + i * 20;
      ctx.fillStyle = i % 2 ? "#42f5ff" : "#ff2fc6";
      ctx.globalAlpha = 0.58;
      ctx.fillRect(x, 242 - h, 12, h);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#08090c";
    ctx.fillRect(104, 264, 78, 100);
    ctx.fillRect(W - 182, 264, 78, 100);
    ctx.fillStyle = "#1f1727";
    for (const x of [124, 146, W - 160, W - 138]) {
      ctx.beginPath();
      ctx.arc(x, 294, 15, 0, Math.PI * 2);
      ctx.arc(x, 334, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#d7e8ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 238);
    ctx.lineTo(W * 0.5, 314);
    ctx.moveTo(W * 0.5 - 38, 284);
    ctx.lineTo(W * 0.5 + 38, 284);
    ctx.stroke();
    ctx.fillStyle = "#101018";
    ctx.beginPath();
    ctx.arc(W * 0.5 - 44, 306, 22, 0, Math.PI * 2);
    ctx.arc(W * 0.5 + 44, 306, 22, 0, Math.PI * 2);
    ctx.arc(W * 0.5, 330, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff2fc6";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = "#050507";
    for (let i = 0; i < 34; i += 1) {
      const x = i * 30 + Math.sin(game.time * 3 + i) * 3;
      const h = 28 + (i % 5) * 8;
      ctx.fillRect(x, FLOOR - 54 - h, 18, h);
      ctx.fillRect(x + 5, FLOOR - 66 - h, 8, 14);
    }

    ctx.fillStyle = "#111015";
    ctx.fillRect(0, FLOOR - 42, W, H - FLOOR + 42);
    ctx.fillStyle = "#201b28";
    ctx.fillRect(0, FLOOR - 42, W, 10);
    ctx.fillStyle = "rgba(255, 47, 198, 0.18)";
    for (let x = -40; x < W + 40; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + 110, FLOOR - 42);
      ctx.lineTo(x + 126, FLOOR - 42);
      ctx.lineTo(x + 18, H);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawRooftopArcadeArena(parallax) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#07121c");
    sky.addColorStop(0.52, "#090b18");
    sky.addColorStop(1, "#030407");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-parallax * 0.45, 0);
    for (let i = 0; i < 13; i += 1) {
      const x = 24 + i * 78;
      const h = 90 + ((i * 29) % 130);
      ctx.fillStyle = i % 2 ? "#101d2b" : "#0b1520";
      ctx.fillRect(x, FLOOR - 160 - h, 48, h);
      ctx.fillStyle = i % 3 ? "#1eff9b" : "#ffdd3d";
      ctx.globalAlpha = 0.22;
      for (let y = FLOOR - 140 - h; y < FLOOR - 172; y += 26) ctx.fillRect(x + 9, y, 8, 8);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-parallax * 0.25, 0);
    ctx.fillStyle = "#14131e";
    ctx.fillRect(90, 250, 118, 118);
    ctx.fillRect(W - 226, 244, 126, 124);
    ctx.fillStyle = "#22263a";
    ctx.fillRect(108, 268, 82, 56);
    ctx.fillRect(W - 206, 262, 90, 58);
    ctx.fillStyle = "#62ff7a";
    ctx.fillRect(118, 278, 62, 30);
    ctx.fillStyle = "#ffdd3d";
    ctx.fillRect(W - 194, 272, 68, 30);
    ctx.fillStyle = "#ff4268";
    ctx.beginPath();
    ctx.arc(142, 342, 8, 0, Math.PI * 2);
    ctx.arc(W - 172, 338, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#49d7ff";
    ctx.fillRect(156, 336, 26, 8);
    ctx.fillRect(W - 158, 332, 28, 8);

    ctx.fillStyle = "#050609";
    ctx.fillRect(W * 0.5 - 150, 126, 300, 72);
    ctx.strokeStyle = "#62ff7a";
    ctx.lineWidth = 4;
    ctx.strokeRect(W * 0.5 - 150, 126, 300, 72);
    ctx.fillStyle = "#ffdd3d";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "#62ff7a";
    ctx.shadowBlur = 16;
    ctx.fillText("ROOFTOP ARCADE", W * 0.5, 172);
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.fillStyle = "#151820";
    ctx.fillRect(0, FLOOR - 38, W, H - FLOOR + 38);
    ctx.fillStyle = "#252b36";
    ctx.fillRect(0, FLOOR - 38, W, 10);
    ctx.fillStyle = "rgba(98, 255, 122, 0.16)";
    for (let x = -70; x < W + 90; x += 92) ctx.fillRect(x, FLOOR - 30, 54, H - FLOOR + 30);
    ctx.strokeStyle = "rgba(73, 215, 255, 0.18)";
    ctx.lineWidth = 2;
    for (let y = FLOOR - 14; y < H; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }


  function drawLayeredArenaArt(parallax, backgroundAsset, floorAsset) {
    ctx.fillStyle = "#050609";
    ctx.fillRect(0, 0, W, H);
    if (backgroundAsset?.ready && backgroundAsset.image) {
      ctx.save();
      const bgShift = parallax * 0.42;
      ctx.translate(-bgShift, 0);
      ctx.drawImage(backgroundAsset.image, bgShift, 0, W, FLOOR + 2);
      ctx.restore();
    }
    if (floorAsset?.ready && floorAsset.image) {
      ctx.save();
      const floorShift = parallax;
      ctx.translate(-floorShift, 0);
      ctx.drawImage(floorAsset.image, floorShift, FLOOR - 46, W, H - FLOOR + 46);
      ctx.restore();
    } else if (backgroundAsset?.ready && backgroundAsset.image) {
      // Single-image maps: crop lower band as fight floor so horizon matches FLOOR.
      const img = backgroundAsset.image;
      const srcH = img.naturalHeight || img.height || 1;
      const srcW = img.naturalWidth || img.width || 1;
      const cropY = Math.floor(srcH * 0.55);
      const cropH = Math.max(1, srcH - cropY);
      ctx.save();
      const floorShift = parallax;
      ctx.translate(-floorShift, 0);
      ctx.drawImage(img, 0, cropY, srcW, cropH, floorShift, FLOOR - 46, W, H - FLOOR + 46);
      ctx.restore();
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.fillRect(0, FLOOR, W, H - FLOOR);
    }
    ctx.fillStyle = "rgba(0, 0, 8, 0.12)";
    ctx.fillRect(0, 0, W, H);
  }

  function drawStage() {
    const arena = getArena();
    const asset = getArenaAsset(arena, true);
    const floorAsset = getArenaFloorAsset(arena, true);
    const centerX = player && enemy ? (player.x + enemy.x) * 0.5 : W * 0.5;
    const parallax = ((centerX - W * 0.5) / W) * 22 * (arena.parallax || 1);

    // Prefer level-packed art (image / floorImage) with Orbital-style layout for every map.
    if (asset?.ready) {
      if (arena.id === "orbital-graveyard") {
        drawOrbitalGraveyardArena(parallax, asset, floorAsset);
      } else {
        drawLayeredArenaArt(parallax, asset, floorAsset);
      }
      drawInteractiveArenaFx(arena);
      return;
    }

    if (drawGeneratedArena(arena, parallax)) {
      drawInteractiveArenaFx(arena);
      return;
    }

    const themes = [
      { top: "#101421", mid: "#080a10", bottom: "#09080a", tower: "#29203b", towerDark: "#161321", neon: "#ff5a32", glow: "rgba(246, 168, 60, 0.75)", floor: "#171317", rail: "#2b303a", stripe: "#3c2931" },
      { top: "#111820", mid: "#071014", bottom: "#05090d", tower: "#172c36", towerDark: "#0d1d25", neon: "#70f0ff", glow: "rgba(112, 240, 255, 0.62)", floor: "#0f1719", rail: "#263942", stripe: "#1f4a55" },
      { top: "#17120e", mid: "#0b0807", bottom: "#090605", tower: "#33221b", towerDark: "#1b100c", neon: "#ff7746", glow: "rgba(255, 119, 70, 0.58)", floor: "#1a100c", rail: "#3a2b22", stripe: "#5a2c24" },
      { top: "#120f1f", mid: "#080812", bottom: "#05050b", tower: "#2c2142", towerDark: "#181326", neon: "#b064ff", glow: "rgba(176, 100, 255, 0.55)", floor: "#130f1d", rail: "#2d2940", stripe: "#4b2a59" },
    ];
    const theme = themes[game.arenaTheme] || themes[0];
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, theme.top);
    sky.addColorStop(0.46, theme.mid);
    sky.addColorStop(1, theme.bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = theme.tower;
    ctx.fillRect(68, 80, 84, 290);
    ctx.fillRect(804, 78, 88, 292);
    ctx.fillStyle = theme.towerDark;
    for (let y = 102; y < 352; y += 34) {
      ctx.fillRect(68, y, 84, 8);
      ctx.fillRect(804, y, 88, 8);
    }

    ctx.fillStyle = "#192636";
    for (let i = 0; i < 9; i += 1) {
      const x = 180 + i * 78;
      const h = 90 + (i % 3) * 32;
      ctx.fillRect(x, FLOOR - 220 - h, 42, h);
      ctx.fillStyle = i % 2 ? "#26324a" : "#192636";
    }

    ctx.fillStyle = theme.glow;
    ctx.fillRect(108, 214, 28, 52);
    ctx.fillRect(830, 212, 28, 52);
    ctx.fillStyle = theme.neon;
    ctx.fillRect(112, 196 + Math.sin(game.time * 9) * 3, 20, 28);
    ctx.fillRect(834, 196 + Math.cos(game.time * 8) * 3, 20, 28);

    ctx.fillStyle = "#11131a";
    for (let i = 0; i < 22; i += 1) {
      const x = 24 + i * 44;
      const h = 20 + (i % 4) * 7;
      ctx.fillRect(x, FLOOR - 54 - h, 28, h);
      ctx.fillRect(x + 8, FLOOR - 66 - h, 12, 14);
    }

    ctx.fillStyle = theme.floor;
    ctx.fillRect(0, FLOOR - 30, W, H - FLOOR + 30);
    ctx.fillStyle = theme.rail;
    ctx.fillRect(0, FLOOR, W, 12);
    ctx.fillStyle = theme.stripe;
    for (let x = -80; x < W + 80; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + 160, FLOOR);
      ctx.lineTo(x + 174, FLOOR);
      ctx.lineTo(x + 16, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    for (let y = FLOOR + 22; y < H; y += 27) ctx.fillRect(0, y, W, 2);
  }

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawMusicNoteBurst(x, y, primary, secondary, scale = 1) {
    const notes = ["♪", "♫", "♬"];
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.round(17 * scale)}px Arial, sans-serif`;
    for (let i = 0; i < 7; i += 1) {
      const orbit = game.time * (4.6 + i * 0.25) + i * 0.95;
      const radius = (13 + (i % 3) * 8 + Math.sin(game.time * 8 + i) * 3) * scale;
      const nx = x + Math.cos(orbit) * radius + (i - 3) * 3 * scale;
      const ny = y + Math.sin(orbit * 0.8) * radius - i * 1.3 * scale;
      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(Math.sin(game.time * 5 + i) * 0.35);
      ctx.globalAlpha = 0.74 + Math.sin(game.time * 9 + i) * 0.18;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
      ctx.strokeText(notes[i % notes.length], 0, 0);
      ctx.fillStyle = i % 2 ? secondary : primary;
      ctx.fillText(notes[i % notes.length], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawFighter(f, ghostAlpha = 1) {
    const p = f.palette;
    const ch = f.character || getCharacter("rift");
    const action = f.action ? f.action.type : f.state;
    if (drawGeneratedFighter(f, ch, action, ghostAlpha)) return;
    const crouch = action === "crouch" || action === "crouchLight" || action === "crouchKick" || f.crouch;
    const hurt = f.stun > 0 && action !== "block" && action !== "dizzy";
    const bob = action === "idle" ? Math.sin(game.time * 8) * 2 : action === "walk" ? Math.sin(game.time * 15) * 3 : 0;
    const baseY = f.y + (crouch ? 18 : 0) + bob;
    const heavy = ch.body === "heavy";
    const swift = ch.body === "swift";
    const skeletal = ch.body === "skeletal";
    const legW = heavy ? 20 : swift || skeletal ? 12 : 16;
    const torsoW = heavy ? 58 : swift || skeletal ? 36 : 44;
    const torsoX = -torsoW / 2;
    const shadowW = heavy ? 44 : swift ? 30 : 36;

    ctx.save();
    ctx.globalAlpha = ghostAlpha;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(f.x, FLOOR + 5, shadowW, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (action === "ko") {
      drawKnockedOut(f, p, ghostAlpha);
      ctx.restore();
      return;
    }

    ctx.translate(Math.round(f.x), Math.round(baseY));
    ctx.scale(f.facing, 1);
    if (ch.id === "jenny-night-signal") {
      const correcting = action === "walk" || action === "dash" || action === "hurt" || action === "special" || action === "block";
      if (correcting && Math.floor(game.time * 18) % 5 === 0) {
        ctx.translate(Math.sin(game.time * 73) * 3, Math.cos(game.time * 61) * 1.5);
      }
    }

    const lean = hurt ? -8 : action === "heavy" ? -9 : action === "dash" ? 8 : 0;
    const walk = action === "walk" ? Math.sin(game.time * 16) * 7 : 0;

    const detached = f.detachedParts;
    drawLegs(ch, p, action, walk, legW, skeletal, detached);
    drawCustomFightPants(ch, p, action, walk, legW, lean, detached);
    if (detached) {
      for (const part of detached) drawLimbStump(f, part, lean, crouch);
    }

    if (ch.id !== "custom" && !isPartDetached(f, "torso") && !isPartDetached(f, "legL") && !isPartDetached(f, "legR")) {
    rect(-27 + lean, -70, 55, 27, p.trunks);
    rect(10 + lean, -70, 13, 27, p.trunksDark);
    rect(-29 + lean, -74, 58, 7, p.white);
    rect(-20 + lean, -75, 18, 8, "#c92d26");
    }

    const torsoH = crouch ? 38 : 53;
    if (!isPartDetached(f, "torso")) {
      drawDragonWings(ch, p, action, lean, crouch);
      rect(torsoX + lean, -120 + (crouch ? 16 : 0), torsoW, torsoH, skeletal ? "#111111" : p.skin);
      rect(torsoX + 2 + lean, -108 + (crouch ? 16 : 0), torsoW - 4, 8, skeletal ? p.white : p.skinDark);
      const shirt = ch.id === "custom" ? (ch.shirt || "tee") : "";
      const bareTorso = ch.id === "custom"
        ? shirt === "bare"
        : !ch.outfit || ch.outfit === "trunks" || ch.outfit === "shorts";
      const cropTop = shirt === "crop" || ch.outfit === "crop";
      const sternumY = -118 + (crouch ? 16 : 0);
      if (bareTorso) {
        rect(-6 + lean, sternumY, 12, torsoH - 6, skeletal ? p.white : "#e0a15f");
      } else if (cropTop) {
        rect(-6 + lean, sternumY + 23, 12, Math.max(10, torsoH - 29), skeletal ? p.white : "#e0a15f");
      }
      drawOutfit(ch, p, lean, crouch, torsoX, torsoW, torsoH);
      drawCoreEmblem(ctx, ch, p, lean, crouch ? 16 : 0);
    }

    drawArms(action, p, lean, crouch, ch, detached);

    if (!isPartDetached(f, "head")) {
      drawHead(ch, p, lean, crouch);
      drawCharacterAccessories(ctx, ch, p, lean, crouch ? 16 : 0);
    } else if (ch.id === "bone" && game.finisher?.boneWearsEnemyHead && f === player) {
      drawHead(enemy.character || getCharacter(enemyCharacterId), enemy.palette, lean, crouch);
    }

    if (action === "special" || action === "beam" || action === "surge") {
      const chargeColor = action === "beam" ? finisherFx(ch.id, p).primary : action === "surge" ? finisherFx(ch.id, p).secondary : p.meter;
      if (ch.id === "control") {
        const musicFx = finisherFx("control", p);
        drawMusicNoteBurst(58, -91, musicFx.primary, musicFx.secondary, action === "beam" ? 1.25 : 1);
      } else {
        drawEnergyOrb(58, -91, chargeColor, (action === "beam" ? 22 : 17) + Math.sin(game.time * 16) * 3);
      }
    }

    if (action === "dash" || action === "crush") {
      rect(-36, -125, 92, 6, p.accent);
      rect(-31, -102, action === "crush" ? 105 : 82, 5, action === "crush" ? "#f8dd94" : p.meter);
    }

    if (action === "dizzy") {
      drawDizzyStars(lean);
    }

    ctx.restore();
  }

  function drawDragonWings(ch, p, action, lean, crouch) {
    if (ch.id !== "dragon") return;
    const y = crouch ? 16 : 0;
    const flying = action === "jump" || (game.phase === "finisher" && game.finisher?.dragonSkyFeast);
    const idleFlap = flying ? Math.sin(game.time * 12) * 1.35 : action === "idle" ? Math.sin(game.time * 7.2) : Math.sin(game.time * 4.8) * 0.45;
    const walkLift = action === "walk" ? Math.sin(game.time * 15) * 2 : 0;
    const wingLift = idleFlap * 8 + walkLift;
    const wingDark = p.trunksDark || "#153c29";
    const wingMid = p.trunks || p.accent || "#2ba16a";
    const membrane = p.accent || "#2ba16a";
    ctx.save();
    ctx.globalAlpha *= 0.92;
    ctx.translate(lean * 0.45, y);

    function wing(side) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.beginPath();
      ctx.moveTo(8, -114);
      ctx.lineTo(78, -168 - wingLift);
      ctx.lineTo(65, -104 + wingLift * 0.25);
      ctx.lineTo(28, -79 + wingLift * 0.12);
      ctx.closePath();
      ctx.fillStyle = wingDark;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(14, -110);
      ctx.lineTo(68, -153 - wingLift * 0.72);
      ctx.lineTo(55, -108 + wingLift * 0.18);
      ctx.lineTo(29, -91 + wingLift * 0.08);
      ctx.closePath();
      ctx.fillStyle = membrane;
      ctx.fill();

      rect(9, -116, 9, 44, wingDark);
      rect(45, -145 - wingLift * 0.45, 8, 52, wingMid);
      rect(72, -168 - wingLift, 9, 20, p.white || "#f2f2f2");
      rect(57, -112 + wingLift * 0.18, 8, 16, p.white || "#f2f2f2");
      ctx.restore();
    }

    wing(-1);
    wing(1);
    ctx.restore();
  }
  function drawGeneratedFighter(f, ch, action, ghostAlpha) {
    if (ch.id === "sable" || ch.id === "dragon") return false;
    // Non-default costumes fall back to procedural draw so palette/outfit overrides show.
    if (ch.costumeId && ch.costumeId !== "default") return false;
    const frame = spriteFrameForAction(action);
    const moveAsset = generatedAssets.moveSheets.get(ch.id);
    const sheetAsset = generatedAssets.fighters.get(ch.id);
    const asset = moveAsset && moveAsset.ready ? moveAsset : sheetAsset;
    if (!asset || !asset.ready) return false;
    const image = asset.keyedImage || asset.image;
    if (!image || !image.width || !image.height) return false;
    const customFrames = generatedSpriteFrames[ch.id];
    // Prefer real move strips / multi-frame sheets; skip single portraits / story stills.
    if (isPlotPulsePortraitAsset(ch.id, asset)) return false;
    if (!customFrames && !isUsableFighterSheet(image)) return false;
    const source = customFrames
      ? customFrames[frame] || customFrames[0]
      : asset.frames
        ? asset.frames[frame] || asset.frames[0]
        : generatedGridFrame(image, frame);
    if (!source || !source.w || !source.h) return false;
    const frameW = source.w;
    const frameH = source.h;
    const baseDrawH = ch.body === "heavy" ? 150 : ch.body === "swift" ? 132 : 140;
    const drawH = asset.baseFrameH ? baseDrawH * (frameH / asset.baseFrameH) : baseDrawH;
    const drawW = drawH * (frameW / frameH);

    ctx.save();
    ctx.globalAlpha = ghostAlpha;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(f.x, FLOOR + 5, drawW * 0.28, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(Math.round(f.x), Math.round(f.y));
    ctx.scale(f.facing, 1);
    if (action === "dizzy" || (game.phase === "finishPrompt" && f.health <= 0)) {
      ctx.translate(Math.sin(game.time * 18) * 4, Math.sin(game.time * 24) * 2);
      ctx.rotate(Math.sin(game.time * 14) * 0.045);
    }
    ctx.drawImage(image, source.x, source.y, source.w, source.h, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
    return true;
  }

  function drawCustomFightPants(ch, p, action, walk, legW, lean, detached) {
    if (ch.id !== "custom" || !ch.pants || detached?.has("torso")) return;
    const pants = ch.pants;
    const hideLeft = detached && (detached.has("legL") || detached.has("legs"));
    const hideRight = detached && (detached.has("legR") || detached.has("legs"));
    const leftX = -27 - walk * 0.2;
    const rightX = 10 + walk * 0.25;
    const fit = wardrobeBodyFit(ch);
    const torsoHalf = ch.body === "heavy" ? 29 : ch.body === "swift" || ch.body === "skeletal" ? 18 : 22;
    const hipX = Math.min(-torsoHalf - fit.hipPad + lean, -27 - fit.hipPad + lean);
    const hipRight = Math.max(torsoHalf + fit.hipPad + lean, 10 + legW + fit.hipPad + lean);
    const hipW = hipRight - hipX;
    const kicking = action === "heavy" || action === "crouchKick";
    const dashing = action === "dash";

    const hipColor = pants === "gi"
      ? p.trunksDark
      : pants === "leggings" || pants === "bones"
        ? "#111111"
        : pants === "greaves"
          ? "#6f7c85"
          : p.trunks;
    rect(hipX, -74, hipW, pants === "shorts" ? 14 : 12, hipColor);

    if (pants === "trunks") {
      if (!hideLeft) rect(-27 + lean, -64, legW, 20, p.trunks);
      if (!hideRight) rect(10 + lean, -64, legW, 20, p.trunksDark);
      rect(hipX, -75, hipW, 7, p.white);
      return;
    }
    if (pants === "shorts") {
      if (!drawPantsPartLayer(ctx, ch, p, "shorts", lean, -57, hipW + 10, 34)) {
        if (!hideLeft) {
          rect(-27 + lean, -63, legW, 19, p.trunks);
          rect(-27 + lean, -47, legW, 4, p.accent);
        }
        if (!hideRight) {
          rect(10 + lean, -63, legW, 19, p.trunksDark);
          rect(10 + lean, -47, legW, 4, p.accent);
        }
      }
      return;
    }

    // Full-length fabric colors are painted as part of each animated leg in
    // drawLegs. These details sit on top only while the leg is locally vertical;
    // kicks and dashes retain the clothing color through their limb transforms.
    if (kicking || dashing) return;
    if (pants === "jeans") {
      rect(hipX, -75, hipW, 7, "#6e4c27");
      if (!hideLeft) rect(leftX + Math.max(2, legW - 7), -55, 5, 7, p.accent);
      if (!hideRight) rect(rightX + 2, -55, 5, 7, p.accent);
    } else if (pants === "joggers") {
      const stripeW = Math.max(3, Math.round(legW * 0.24));
      if (!hideLeft) rect(leftX + Math.max(1, legW - stripeW - 1), -38, stripeW, 31, p.accent);
      if (!hideRight) rect(rightX + 1, -38, stripeW, 31, p.accent);
    } else if (pants === "cargos") {
      const pocketW = Math.max(7, legW - 3);
      if (!hideLeft) rect(leftX - 1, -49, pocketW, 14, p.accent);
      if (!hideRight) rect(rightX + legW - pocketW + 1, -49, pocketW, 14, p.accent);
    } else if (pants === "leggings") {
      const stripeW = Math.max(2, Math.round(legW * 0.2));
      if (!hideLeft) rect(leftX + legW - stripeW, -48, stripeW, 43, p.accent);
      if (!hideRight) rect(rightX, -48, stripeW, 43, p.accent);
    } else if (pants === "greaves") {
      if (!hideLeft) rect(leftX + 1, -49, Math.max(5, legW - 2), 11, "#9ca8b0");
      if (!hideRight) rect(rightX + 1, -49, Math.max(5, legW - 2), 11, "#9ca8b0");
    } else if (pants === "gi") {
      rect(hipX + Math.floor(hipW / 2) - 4, -68, 8, 18, p.accent);
    } else if (pants === "bones") {
      const boneW = Math.max(3, Math.round(legW * 0.36));
      if (!hideLeft) rect(leftX + Math.floor((legW - boneW) / 2), -48, boneW, 36, p.white);
      if (!hideRight) rect(rightX + Math.floor((legW - boneW) / 2), -48, boneW, 36, p.white);
    }
  }

  function generatedGridFrame(image, frame) {
    const { cols, map } = sheetGridMap(image);
    const colW = image.width / cols;
    const [col, row] = map[frame] || map[0];
    const rowH = image.height / SPRITE_ROWS;
    return { x: col * colW, y: row * rowH, w: colW, h: rowH };
  }

  function spriteFrameForAction(action) {
    if (action === "walk") return Math.floor(game.time * 8) % 2 ? 1 : 2;
    if (action === "jump") return 2;
    if (action === "light" || action === "crouchLight" || action === "special" || action === "beam" || action === "surge") return 3;
    if (action === "heavy" || action === "crouchKick" || action === "crush") return 4;
    if (action === "upper" || action === "dash" || action === "finisher") return 5;
    if (action === "block" || action === "crouch") return 6;
    if (action === "hurt" || action === "dizzy" || action === "finisherHit") return 7;
    if (action === "ko") return 8;
    return 0;
  }

  function limbRect(x, y, w, h, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    rect(0, 0, w, h, color);
    ctx.restore();
  }

  function drawLegs(ch, p, action, walk, legW, skeletal, detached) {
    const legColor = skeletal ? p.white : p.skin;
    const customPants = ch.id === "custom" ? ch.pants || "trunks" : "";
    const fullLengthPants = ["jeans", "joggers", "cargos", "leggings", "greaves", "gi", "bones"].includes(customPants);
    const customLegColor = customPants === "gi"
      ? p.white
      : customPants === "leggings" || customPants === "bones"
        ? p.trunksDark
        : customPants === "greaves"
          ? "#59636c"
          : p.trunks;
    const leftLegColor = fullLengthPants ? customLegColor : legColor;
    const rightLegColor = fullLengthPants && customPants === "jeans" ? p.trunksDark : leftLegColor;
    const hideLeft = detached && (detached.has("legL") || detached.has("legs"));
    const hideRight = detached && (detached.has("legR") || detached.has("legs"));
    if (action === "heavy" || action === "crouchKick") {
      const supportX = ch.body === "heavy" ? -31 : -27;
      const lift = ch.body === "swift" ? -7 : 0;
      const low = action === "crouchKick";
      if (!hideLeft) {
        limbRect(supportX, low ? -36 : -48, legW, low ? 38 : 46, -0.14, leftLegColor);
        rect(supportX - 7, low ? -4 : -9, legW + 7, 10, p.white);
        bootRect(ch, p, supportX - 14, low ? 3 : -1, legW + 16, 11, "L");
      }
      if (!hideRight) {
        limbRect(10, (low ? -42 : -63) + lift, low ? 54 : 48, 16, low ? 0.02 : -0.1, rightLegColor);
        limbRect(low ? 58 : 52, (low ? -40 : -66) + lift, low ? 38 : 42, 15, low ? 0.12 : 0.06, rightLegColor);
        bootRect(ch, p, low ? 88 : 82, (low ? -42 : -69) + lift, 31, 18, "R");
        rect(low ? 84 : 78, (low ? -40 : -67) + lift, 10, 16, p.white);
      }
      if (!hideLeft || !hideRight) {
        rect(-34, low ? -48 : -61, 17, 15, p.trunksDark);
        rect(5, (low ? -48 : -66) + lift, 20, 18, p.trunks);
      }
      return;
    }

    if (action === "dash") {
      if (!hideLeft) limbRect(-31 - walk * 0.2, -49, legW, 43, 0.2, leftLegColor);
      if (!hideRight) limbRect(8 + walk * 0.25, -48, legW, 43, -0.28, rightLegColor);
    } else {
      if (!hideLeft) rect(-27 - walk * 0.2, -48, legW, 43, leftLegColor);
      if (!hideRight) rect(10 + walk * 0.25, -48, legW, 43, rightLegColor);
    }

    if (!hideLeft) {
      rect(-29 - walk * 0.2, -9, legW + 4, 10, p.white);
      bootRect(ch, p, -32 - walk * 0.2, -1, legW + 10, 11, "L");
    }
    if (!hideRight) {
      rect(8 + walk * 0.25, -9, legW + 4, 10, p.white);
      bootRect(ch, p, 6 + walk * 0.25, -1, legW + 10, 11, "R");
    }
  }

  function drawOutfit(ch, p, lean, crouch, torsoX, torsoW, torsoH) {
    const y = crouch ? 16 : 0;
    const top = -120 + y;
    if (ch.id === "custom" && ch.shirt && ch.pants) {
      drawCustomWardrobe((x, drawY, w, h, color) => rect(x, drawY, w, h, color), ch, p, lean, y, torsoX, torsoW, torsoH, { drawPants: false, ctx });
      return;
    }
    if (ch.id === "anthony-e1") {
      rect(torsoX + lean - 6, top + 1, torsoW + 12, torsoH + 3, p.trunks);
      rect(torsoX + lean - 1, top + 7, torsoW + 2, 12, p.accent);
      rect(torsoX + lean + 7, top + 26, torsoW - 14, 9, p.trunksDark);
      rect(-31 + lean, -74 + y, 62, 10, p.trunksDark);
      rect(-29 + lean, -64 + y, 58, 19, p.trunks);
      rect(-42 + lean, top + 8, 12, 44, p.accent);
      rect(30 + lean, top + 8, 12, 44, p.accent);
      rect(-35 + lean, top + 13, 8, 8, p.trunksDark);
      rect(27 + lean, top + 13, 8, 8, p.trunksDark);
      rect(torsoX + lean + 4, top + 9, 8, 8, p.white);
      rect(torsoX + lean + 6, top + 11, 4, 4, p.trunksDark);
      rect(torsoX + lean + torsoW - 17, top + 9, 11, 5, "#1b2517");
      return;
    }
    if (ch.id === "sable") {
      rect(torsoX + lean - 4, top + 2, torsoW + 8, torsoH - 2, p.trunksDark);
      rect(torsoX + lean + 3, top + 8, torsoW - 6, 16, p.trunks);
      rect(torsoX + lean + 7, top + 27, torsoW - 14, 9, p.accent);
      rect(-6 + lean, top + 6, 12, torsoH - 8, p.white);
      rect(-24 + lean, top + 7, 13, 47, p.meter);
      rect(-18 + lean, top + 14, 46, 9, p.meter);
      rect(5 + lean, top + 22, 22, 8, p.white);
      rect(-32 + lean, -74 + y, 64, 9, p.accent);
      rect(-27 + lean, -65 + y, 54, 20, p.trunksDark);
      rect(-44 + lean, top + 12, 12, 38, p.trunks);
      rect(32 + lean, top + 12, 12, 38, p.trunks);
      rect(-49 + lean, top + 7, 17, 12, p.meter);
      rect(32 + lean, top + 7, 17, 12, p.meter);
      return;
    }
    if (ch.id === "jenny-night-signal") {
      rect(torsoX + lean - 5, top + 3, torsoW + 10, torsoH + 4, p.trunks);
      rect(torsoX + lean - 8, top + 1, 14, torsoH + 7, p.trunksDark);
      rect(12 + lean, top + 1, 14, torsoH + 7, p.trunksDark);
      rect(torsoX + lean + 5, top + 10, torsoW - 10, 9, p.accent);
      rect(-8 + lean, top + 17, 16, 11, p.trunksDark);
      rect(-5 + lean, top + 20, 10, 3, p.meter);
      rect(-33 + lean, -73 + y, 66, 8, p.white);
      rect(-27 + lean, -65 + y, 54, 19, p.trunksDark);
      rect(29 + lean, -103 + y, 10, 31, "#1d2128");
      rect(33 + lean, -99 + y, 4, 19, p.meter);
      rect(-32 + lean, -109 + y, 8, 7, p.white);
      rect(24 + lean, -111 + y, 8, 7, p.white);
      return;
    }
    if (ch.id === "lazy") {
      rect(torsoX + lean - 4, top + 3, torsoW + 8, torsoH - 2, p.trunks);
      rect(torsoX + lean + 4, top + 9, torsoW - 8, 12, p.accent);
      rect(torsoX + lean + 8, top + 27, torsoW - 16, 8, p.meter);
      rect(-29 + lean, -74 + y, 58, 9, p.white);
      rect(-25 + lean, -64 + y, 50, 20, p.trunksDark);
      rect(-42 + lean, top + 8, 13, 42, p.accent);
      rect(29 + lean, top + 8, 13, 42, p.accent);
      rect(-52 + lean, -107 + y, 5, 44, p.white);
      rect(48 + lean, -107 + y, 5, 44, p.white);
      rect(-18 + lean, top + 14, 5, 5, p.white);
      rect(13 + lean, top + 14, 5, 5, p.white);
      rect(-4 + lean, top + 34, 8, 8, p.white);
      return;
    }
    if (ch.id === "ninja") {
      rect(torsoX + lean - 6, top, torsoW + 12, torsoH + 38, p.trunks);
      rect(torsoX + lean - 2, top + 4, 10, torsoH + 40, p.accent);
      rect(10 + lean, top + 4, 10, torsoH + 40, p.accent);
      rect(-31 + lean, -75 + y, 62, 8, p.white);
      rect(-26 + lean, -66 + y, 52, 18, p.trunksDark);
      rect(35 + lean, -111 + y, 7, 74, "#d8d0bd");
      rect(37 + lean, -112 + y, 3, 62, p.meter);
      rect(31 + lean, -50 + y, 14, 8, p.accent);
      return;
    }
    if (ch.id === "control") {
      rect(torsoX + lean - 6, top + 2, torsoW + 12, torsoH - 4, p.trunksDark);
      rect(torsoX + lean + 4, top + 9, torsoW - 8, 12, p.accent);
      rect(torsoX + lean + 8, top + 25, torsoW - 16, 8, p.meter);
      rect(-5 + lean, top + 5, 10, torsoH - 8, p.white);
      rect(-31 + lean, -73 + y, 62, 9, p.meter);
      rect(-25 + lean, -63 + y, 50, 16, p.trunks);
      rect(32 + lean, -106 + y, 28, 21, p.trunksDark);
      rect(36 + lean, -101 + y, 20, 5, p.meter);
      return;
    }
    if (ch.id === "spar7an") {
      rect(torsoX + lean - 5, top + 1, torsoW + 10, torsoH - 5, p.hair);
      rect(torsoX + lean, top + 6, torsoW, 10, p.white);
      rect(torsoX + lean + 6, top + 19, torsoW - 12, 19, p.accent);
      rect(-6 + lean, top + 4, 12, torsoH - 7, p.white);
      rect(-34 + lean, -75 + y, 68, 9, p.white);
      rect(-32 + lean, -66 + y, 64, 22, p.trunks);
      rect(-44 + lean, top + 7, 13, 56, p.accent);
      rect(31 + lean, top + 5, 13, 54, p.accent);
      return;
    }
    if (ch.id === "jake") {
      rect(torsoX + lean - 7, top + 3, torsoW + 14, torsoH - 3, p.trunks);
      rect(torsoX + lean - 12, top + 8, 16, 16, p.accent);
      rect(torsoX + lean + torsoW - 4, top + 8, 16, 16, p.accent);
      rect(torsoX + lean + 5, top + 9, torsoW - 10, 11, p.white);
      rect(-11 + lean, top + 24, 22, 14, p.accent);
      rect(-7 + lean, top + 27, 14, 4, p.trunksDark);
      rect(-29 + lean, -74 + y, 58, 9, p.white);
      rect(-27 + lean, -65 + y, 54, 20, p.trunksDark);
      rect(-20 + lean, -60 + y, 40, 5, p.accent);
      rect(30 + lean, -102 + y, 10, 34, p.white);
      rect(33 + lean, -99 + y, 4, 27, p.accent);
      return;
    }
    if (ch.id === "ice-golem") {
      rect(torsoX + lean - 9, top - 4, torsoW + 18, torsoH + 4, p.skin);
      rect(torsoX + lean - 2, top + 8, torsoW + 4, 12, p.white);
      rect(torsoX + lean + 9, top + 27, torsoW - 18, 9, p.meter);
      rect(-31 + lean, -75 + y, 62, 10, p.white);
      rect(-27 + lean, -65 + y, 54, 20, p.trunksDark);
      rect(-44 + lean, top + 9, 14, 44, p.skinDark);
      rect(30 + lean, top + 8, 14, 45, p.skinDark);
      rect(-37 + lean, top + 2, 12, 10, p.white);
      rect(25 + lean, top + 1, 12, 10, p.white);
      return;
    }
    if (ch.id === "bigfoot") {
      rect(torsoX + lean - 11, top - 1, torsoW + 22, torsoH + 10, p.hair);
      rect(torsoX + lean - 3, top + 10, torsoW + 6, 16, p.skin);
      rect(torsoX + lean + 7, top + 31, torsoW - 14, 8, p.accent);
      rect(-34 + lean, -76 + y, 68, 9, p.trunksDark);
      rect(-31 + lean, -66 + y, 62, 22, p.trunks);
      rect(-47 + lean, top + 5, 18, 50, p.hair);
      rect(29 + lean, top + 5, 18, 50, p.hair);
      rect(-49 + lean, top + 47, 24, 11, p.gloves);
      rect(25 + lean, top + 47, 24, 11, p.gloves);
      return;
    }
    if (ch.outfit === "jeans") {
      rect(torsoX + lean + 5, top + 6, torsoW - 10, 17, p.accent);
      rect(-29 + lean, -70, 58, 8, "#6e4c27");
      rect(-24 + lean, -50, 8, 8, "#d48b67");
      return;
    }
    if (ch.outfit === "crop" || ch.outfit === "shorts") {
      rect(torsoX + lean + 4, top + 8, torsoW - 8, 17, p.accent);
      rect(torsoX + lean + 8, top + 31, torsoW - 16, 8, p.skin);
      if (ch.outfit === "shorts") {
        rect(-29 + lean, -70, 58, 18, p.trunks);
      }
      return;
    }
    if (ch.outfit === "arena") {
      rect(torsoX + lean + 5, top + 6, torsoW - 10, torsoH - 8, p.accent);
      rect(torsoX + lean + 8, top + 21, torsoW - 16, 6, p.skin);
      rect(-20 + lean, -68, 40, 16, p.accent);
      return;
    }
    if (ch.outfit === "armor") {
      rect(torsoX + lean - 3, top + 3, torsoW + 6, torsoH - 6, p.accent);
      rect(torsoX + lean + 5, top + 12, torsoW - 10, 9, "#6f7c85");
      rect(torsoX + lean + 8, top + 31, torsoW - 16, 8, "#111821");
      rect(-31 + lean, -72, 62, 12, "#7d8a92");
      return;
    }
    if (ch.outfit === "tank") {
      rect(torsoX + lean + 7, top + 4, torsoW - 14, torsoH - 4, p.accent);
      rect(-10 + lean, top + 5, 20, torsoH - 8, p.skin);
      return;
    }
    if (ch.outfit === "gi") {
      rect(torsoX + lean - 4, top, torsoW + 8, torsoH + 10, p.accent);
      rect(torsoX + lean + 6, top + 4, 9, torsoH + 4, p.white);
      rect(-5 + lean, top + 10, 10, torsoH + 2, p.trunksDark);
      rect(-31 + lean, -74, 62, 8, p.trunksDark);
      return;
    }
    if (ch.outfit === "bones") {
      rect(-20 + lean, top + 7, 40, 8, p.white);
      rect(-15 + lean, top + 20, 30, 7, p.white);
      rect(-4 + lean, top + 8, 8, 42, p.white);
      return;
    }
    if (ch.outfit === "robe") {
      rect(torsoX + lean - 6, top, torsoW + 12, torsoH + 38, p.trunks);
      rect(torsoX + lean - 2, top + 4, 10, torsoH + 40, p.accent);
      rect(10 + lean, top + 4, 10, torsoH + 40, p.accent);
      return;
    }
    if (ch.outfit === "fatigues") {
      rect(torsoX + lean + 2, top + 4, torsoW - 4, torsoH - 4, p.accent);
      rect(torsoX + lean + 8, top + 12, 9, 8, p.trunksDark);
      rect(torsoX + lean + 24, top + 28, 11, 7, p.trunksDark);
      return;
    }
  }

  function drawHead(ch, p, lean, crouch) {
    const y = crouch ? 16 : 0;
    if (ch.id === "dragon-born") {
      rect(-23 + lean, -157 + y, 46, 35, p.skin);
      rect(10 + lean, -145 + y, 24, 18, p.skin);
      rect(26 + lean, -139 + y, 15, 9, p.skinDark);
      rect(-25 + lean, -166 + y, 9, 22, p.hair);
      rect(16 + lean, -166 + y, 9, 22, p.hair);
      rect(-33 + lean, -174 + y, 10, 19, p.white);
      rect(23 + lean, -174 + y, 10, 19, p.white);
      rect(8 + lean, -145 + y, 7, 7, p.meter);
      rect(30 + lean, -136 + y, 5, 4, "#07101d");
      rect(21 + lean, -128 + y, 17, 4, p.white);
      return;
    }
    if (ch.id === "plot-pulse-theam") {
      rect(-24 + lean, -158 + y, 48, 38, p.skin);
      rect(-20 + lean, -166 + y, 40, 12, p.skin);
      rect(-17 + lean, -146 + y, 13, 11, "#07101d");
      rect(5 + lean, -146 + y, 13, 11, "#07101d");
      rect(-14 + lean, -143 + y, 8, 5, p.meter);
      rect(7 + lean, -143 + y, 8, 5, p.meter);
      rect(-6 + lean, -127 + y, 12, 3, p.skinDark);
      rect(-26 + lean, -151 + y, 5, 17, p.accent);
      rect(21 + lean, -151 + y, 5, 17, p.accent);
      return;
    }
    if (ch.id === "anthony-e1") {
      rect(-18 + lean, -151 + y, 36, 30, p.skin);
      rect(-22 + lean, -161 + y, 44, 12, p.hair);
      rect(-24 + lean, -164 + y, 48, 8, p.trunks);
      rect(-18 + lean, -168 + y, 36, 7, p.accent);
      rect(-9 + lean, -140 + y, 5, 5, "#0b1018");
      rect(8 + lean, -140 + y, 5, 5, "#0b1018");
      rect(-7 + lean, -130 + y, 18, 4, p.skinDark);
      rect(-23 + lean, -157 + y, 46, 3, p.trunksDark);
      return;
    }
    if (ch.id === "sable") {
      rect(-20 + lean, -152 + y, 40, 31, p.skin);
      rect(-24 + lean, -164 + y, 48, 17, p.hair);
      rect(-28 + lean, -150 + y, 14, 33, p.hair);
      rect(14 + lean, -151 + y, 14, 27, p.hair);
      rect(-21 + lean, -145 + y, 42, 11, p.accent);
      rect(4 + lean, -148 + y, 17, 15, p.meter);
      rect(8 + lean, -145 + y, 12, 4, p.white);
      rect(-12 + lean, -140 + y, 6, 6, "#0b1018");
      rect(7 + lean, -140 + y, 6, 6, p.meter);
      rect(-7 + lean, -130 + y, 18, 4, p.skinDark);
      rect(15 + lean, -158 + y, 9, 3, p.white);
      rect(-26 + lean, -134 + y, 8, 4, p.meter);
      return;
    }
    if (ch.id === "jenny-night-signal") {
      const staticOn = Math.floor(game.time * 12) % 3 === 0;
      rect(-18 + lean, -151 + y, 36, 29, p.skin);
      rect(-23 + lean, -164 + y, 46, 16, p.hair);
      rect(-27 + lean, -153 + y, 13, 33, p.hair);
      rect(13 + lean, -155 + y, 15, 24, p.hair);
      rect(-2 + lean, -168 + y, 8, 31, staticOn ? p.meter : p.accent);
      rect(-30 + lean, -145 + y, 9, 16, p.trunksDark);
      rect(21 + lean, -145 + y, 9, 16, p.trunksDark);
      rect(-28 + lean, -138 + y, 56, 4, p.white);
      rect(-10 + lean, -139 + y, 5, 5, "#0b1018");
      rect(6 + lean, -140 + y, 8, 7, staticOn ? p.meter : p.white);
      rect(8 + lean, -139 + y, 4, 3, "#ffffff");
      rect(-8 + lean, -130 + y, 21, 4, p.skinDark);
      if (staticOn) {
        rect(17 + lean, -147 + y, 16, 3, "#dfe8ef");
        rect(-18 + lean, -157 + y, 11, 2, "#e6293f");
        rect(3 + lean, -126 + y, 18, 2, "#e6293f");
      }
      return;
    }
    if (ch.id === "jake") {
      rect(-18 + lean, -151 + y, 36, 30, p.skin);
      rect(-22 + lean, -162 + y, 44, 16, p.hair);
      rect(-21 + lean, -162 + y, 42, 6, p.trunksDark);
      rect(-16 + lean, -159 + y, 32, 5, p.accent);
      rect(-9 + lean, -140 + y, 5, 5, "#0b1018");
      rect(8 + lean, -140 + y, 5, 5, "#0b1018");
      rect(-7 + lean, -130 + y, 18, 4, p.skinDark);
      rect(16 + lean, -147 + y, 14, 4, p.white);
      return;
    }
    if (ch.id === "lazy") {
      rect(-24 + lean, -161 + y, 48, 42, p.hair);
      rect(-19 + lean, -153 + y, 38, 30, p.skin);
      rect(-26 + lean, -146 + y, 10, 18, p.skin);
      rect(16 + lean, -146 + y, 10, 18, p.skin);
      rect(-14 + lean, -141 + y, 7, 7, "#0b1018");
      rect(7 + lean, -141 + y, 7, 7, "#0b1018");
      rect(-5 + lean, -135 + y, 10, 12, p.skinDark);
      rect(-13 + lean, -126 + y, 26, 5, p.meter);
      rect(-18 + lean, -158 + y, 4, 10, p.white);
      rect(-6 + lean, -162 + y, 4, 12, p.white);
      rect(8 + lean, -158 + y, 4, 10, p.white);
      rect(18 + lean, -151 + y, 4, 12, p.white);
      return;
    }
    if (ch.id === "ninja") {
      rect(-22 + lean, -158 + y, 44, 35, p.hair);
      rect(-19 + lean, -146 + y, 38, 10, p.accent);
      rect(-18 + lean, -143 + y, 36, 5, p.white);
      rect(-14 + lean, -134 + y, 28, 9, p.skinDark);
      rect(2 + lean, -141 + y, 5, 5, "#0b1018");
      rect(13 + lean, -141 + y, 5, 5, "#0b1018");
      return;
    }
    if (ch.id === "control") {
      rect(-19 + lean, -151 + y, 38, 29, p.skin);
      rect(-23 + lean, -162 + y, 46, 18, p.hair);
      rect(-27 + lean, -148 + y, 10, 24, p.trunksDark);
      rect(17 + lean, -148 + y, 10, 24, p.trunksDark);
      rect(-30 + lean, -143 + y, 8, 18, p.meter);
      rect(22 + lean, -143 + y, 8, 18, p.meter);
      rect(-21 + lean, -154 + y, 42, 5, p.accent);
      rect(-10 + lean, -139 + y, 5, 5, "#0b1018");
      rect(7 + lean, -139 + y, 5, 5, "#0b1018");
      rect(-13 + lean, -130 + y, 26, 4, p.skinDark);
      rect(13 + lean, -166 + y, 9, 7, p.meter);
      return;
    }
    if (ch.id === "spar7an") {
      rect(-23 + lean, -158 + y, 46, 35, p.hair);
      rect(-18 + lean, -164 + y, 36, 10, p.accent);
      rect(-8 + lean, -178 + y, 16, 18, p.accent);
      rect(-15 + lean, -148 + y, 30, 22, p.skin);
      rect(-20 + lean, -146 + y, 40, 7, p.hair);
      rect(-4 + lean, -148 + y, 8, 29, p.hair);
      rect(3 + lean, -139 + y, 5, 5, "#0b1018");
      rect(13 + lean, -139 + y, 5, 5, "#0b1018");
      rect(-4 + lean, -130 + y, 20, 4, p.skinDark);
      return;
    }
    if (ch.id === "wendigo") {
      const antler = p.hair || "#6b5a48";
      rect(-19 + lean, -154 + y, 38, 34, p.skin);
      rect(-14 + lean, -149 + y, 28, 9, p.skinDark);
      rect(-10 + lean, -140 + y, 6, 6, "#0b1018");
      rect(8 + lean, -140 + y, 6, 6, "#0b1018");
      rect(-9 + lean, -130 + y, 22, 5, p.white);
      rect(-42 + lean, -177 + y, 7, 34, antler);
      rect(36 + lean, -177 + y, 7, 34, antler);
      rect(-52 + lean, -176 + y, 19, 6, antler);
      rect(34 + lean, -176 + y, 19, 6, antler);
      rect(-50 + lean, -162 + y, 16, 6, antler);
      rect(35 + lean, -162 + y, 16, 6, antler);
      rect(-45 + lean, -191 + y, 6, 18, antler);
      rect(39 + lean, -191 + y, 6, 18, antler);
      rect(-31 + lean, -159 + y, 14, 8, p.white);
      rect(17 + lean, -159 + y, 14, 8, p.white);
      return;
    }
    if (ch.id === "ice-golem") {
      rect(-23 + lean, -158 + y, 46, 36, p.skin);
      rect(-17 + lean, -171 + y, 12, 20, p.white);
      rect(-3 + lean, -177 + y, 12, 25, p.white);
      rect(13 + lean, -168 + y, 11, 18, p.white);
      rect(-19 + lean, -150 + y, 38, 12, p.skinDark);
      rect(-10 + lean, -140 + y, 6, 6, "#071824");
      rect(8 + lean, -140 + y, 6, 6, "#071824");
      rect(-13 + lean, -128 + y, 28, 5, p.meter);
      rect(-28 + lean, -136 + y, 9, 14, p.white);
      rect(20 + lean, -135 + y, 9, 14, p.white);
      return;
    }
    if (ch.id === "bigfoot") {
      rect(-25 + lean, -162 + y, 50, 43, p.hair);
      rect(-18 + lean, -151 + y, 36, 30, p.skin);
      rect(-30 + lean, -153 + y, 13, 24, p.hair);
      rect(17 + lean, -153 + y, 13, 24, p.hair);
      rect(-14 + lean, -140 + y, 7, 7, "#0b1018");
      rect(7 + lean, -140 + y, 7, 7, "#0b1018");
      rect(-8 + lean, -132 + y, 20, 7, p.hair);
      rect(-13 + lean, -125 + y, 28, 6, p.skinDark);
      rect(-21 + lean, -162 + y, 42, 8, p.accent);
      return;
    }
    if (ch.faceExpression || ch.faceMask || ch.facialHair) {
      drawCompatiblePixelHead(ch, p, (x, headY, w, h, color) => rect(x + lean, headY + y, w, h, color));
      return;
    }
    if (ch.hairStyle === "skull") {
      rect(-18 + lean, -154 + y, 36, 34, p.hair);
      rect(-14 + lean, -126 + y, 28, 10, p.hair);
      rect(1 + lean, -140 + y, 5, 5, "#b51f1f");
      rect(12 + lean, -140 + y, 5, 5, "#b51f1f");
      rect(-8 + lean, -130 + y, 19, 4, "#0b1018");
      drawFightFaceAndMask(ch, p, lean, y);
      return;
    }
    if (ch.hairStyle === "helmet") {
      rect(-20 + lean, -157 + y, 40, 36, p.hair);
      rect(-16 + lean, -145 + y, 32, 9, "#121820");
      rect(1 + lean, -142 + y, 21, 4, p.meter);
      drawFightFaceAndMask(ch, p, lean, y);
      return;
    }

    rect(-16 + lean, -150 + y, 32, 30, p.skin);
    rect(-18 + lean, -152 + y, 36, 8, p.accent);

    if (ch.hairStyle === "ponytail" || ch.hairStyle === "sidepony") {
      rect(-19 + lean, -162 + y, 38, 16, p.hair);
      rect(-32 + lean, -154 + y, 15, 42, p.hair);
      rect(-38 + lean, -122 + y, 11, 19, p.hair);
    } else if (ch.hairStyle === "long") {
      rect(-22 + lean, -162 + y, 44, 18, p.hair);
      rect(-25 + lean, -148 + y, 12, 48, p.hair);
      rect(15 + lean, -148 + y, 12, 42, p.hair);
    } else if (ch.hairStyle === "mohawk") {
      rect(-7 + lean, -170 + y, 18, 29, p.hair);
      rect(-20 + lean, -154 + y, 40, 10, p.hair);
    } else if (ch.hairStyle === "martial") {
      rect(-19 + lean, -160 + y, 40, 15, p.hair);
      rect(10 + lean, -158 + y, 20, 8, p.hair);
    } else if (ch.hairStyle === "wild" || ch.hairStyle === "fluffy" || ch.hairStyle === "beard") {
      rect(-24 + lean, -164 + y, 48, 18, p.hair);
      rect(-28 + lean, -156 + y, 13, 16, p.hair);
      rect(15 + lean, -158 + y, 15, 16, p.hair);
    } else if (ch.hairStyle === "bob" || ch.hairStyle === "pixie") {
      rect(-22 + lean, -160 + y, 42, 18, p.hair);
      rect(-24 + lean, -145 + y, 11, 28, p.hair);
    } else if (ch.hairStyle === "spike" && drawHairPartLayer(ctx, ch, p, "spike", lean, -160 + y)) {
      // hybrid hair-spike mask
    } else {
      if (ch.hairStyle === "spike") {
        rect(-19 + lean, -160 + y, 38, 11, p.hair);
        rect(-16 + lean, -166 + y, 9, 9, p.hair);
        rect(-4 + lean, -170 + y, 10, 13, p.hair);
        rect(9 + lean, -166 + y, 10, 10, p.hair);
      } else {
        rect(-20 + lean, -160 + y, 42, 15, p.hair);
        rect(4 + lean, -164 + y, 27, 12, p.hair);
      }
    }

    if (ch.hairStyle === "beard") {
      rect(-13 + lean, -130 + y, 31, 15, p.hair);
    }
    if (ch.outfit === "robe" || ch.outfit === "arena" || ch.shirt === "robe" || ch.shirt === "arena") {
      rect(-17 + lean, -140 + y, 37, 8, p.accent);
    }

    rect(2 + lean, -139 + y, 5, 5, "#0b1018");
    rect(14 + lean, -139 + y, 5, 5, "#0b1018");
    if (ch.id === "king" && game.phase === "finisher" && game.finisher?.kingGroundWave && game.finisherTime > 520 && game.finisherTime < 1560) {
      rect(-7 + lean, -132 + y, 28, 8, "#0b1018");
      rect(-5 + lean, -131 + y, 24, 3, "#f8f3df");
      rect(-2 + lean, -127 + y, 18, 2, "#f8f3df");
    } else {
      rect(-3 + lean, -130 + y, 20, 4, p.skinDark);
    }
    drawFightFaceAndMask(ch, p, lean, y);
  }

  function drawFightFaceAndMask(ch, p, lean, y) {
    if (!ch.faceExpression && !ch.faceMask) return;
    const expression = ch.faceExpression || "neutral";
    const mask = ch.faceMask || "none";
    const offset = (x) => x + lean;
    if (ch.hairStyle === "helmet") rect(offset(-15), -145 + y, 30, 12, p.skin);

    if (expression === "focused") {
      rect(offset(-12), -143 + y, 9, 3, p.hair);
      rect(offset(7), -143 + y, 9, 3, p.hair);
      rect(offset(-10), -139 + y, 5, 4, "#071018");
      rect(offset(9), -139 + y, 5, 4, "#071018");
    } else if (expression === "angry") {
      rect(offset(-13), -144 + y, 10, 4, p.hair);
      rect(offset(5), -144 + y, 10, 4, p.hair);
      rect(offset(-10), -139 + y, 5, 4, "#071018");
      rect(offset(9), -139 + y, 5, 4, "#071018");
    } else if (expression === "smirk") {
      rect(offset(-10), -139 + y, 5, 4, "#071018");
      rect(offset(9), -139 + y, 5, 3, "#071018");
      rect(offset(-2), -130 + y, 15, 3, p.skinDark);
      rect(offset(9), -133 + y, 5, 3, p.skinDark);
    } else {
      rect(offset(-10), -139 + y, 5, 5, "#071018");
      rect(offset(9), -139 + y, 5, 5, "#071018");
    }

    const facialHair = ch.facialHair || "none";
    if (facialHair === "stubble") {
      rect(offset(-10), -130 + y, 24, 3, shadeHex(p.hair, 0.72));
      rect(offset(-7), -126 + y, 18, 3, shadeHex(p.hair, 0.72));
    } else if (facialHair === "goatee") {
      rect(offset(-4), -131 + y, 12, 5, p.hair);
      rect(offset(-1), -126 + y, 7, 10, p.hair);
    } else if (facialHair === "full") {
      rect(offset(-14), -134 + y, 30, 8, p.hair);
      rect(offset(-11), -127 + y, 25, 12, p.hair);
      rect(offset(-6), -116 + y, 15, 5, p.hair);
    }

    if (mask === "tactical") {
      rect(offset(-16), -136 + y, 32, 15, "#111820");
      rect(offset(-13), -133 + y, 26, 3, p.accent);
      rect(offset(-8), -126 + y, 16, 3, p.meter);
    } else if (mask === "oni") {
      rect(offset(-18), -138 + y, 36, 18, "#9e1f27");
      rect(offset(-14), -134 + y, 28, 5, "#d8b05a");
      rect(offset(-11), -126 + y, 5, 8, p.white);
      rect(offset(7), -126 + y, 5, 8, p.white);
    } else if (mask === "skull") {
      rect(offset(-17), -139 + y, 34, 19, "#e8e3d7");
      rect(offset(-12), -136 + y, 7, 6, "#151820");
      rect(offset(6), -136 + y, 7, 6, "#151820");
      rect(offset(-3), -130 + y, 6, 7, "#151820");
      for (let x = -12; x <= 8; x += 5) rect(offset(x), -123 + y, 3, 5, "#151820");
    }
  }

  function drawJohnClaws(ch, x, y, dir) {
    if (ch.id !== "john") return;
    ctx.save();
    ctx.fillStyle = "#f5f0f0";
    for (let i = 0; i < 4; i += 1) {
      const offset = (i - 1.5) * 5;
      ctx.beginPath();
      ctx.moveTo(x, y + offset);
      ctx.lineTo(x + dir * 17, y + offset - 3);
      ctx.lineTo(x + dir * 3, y + offset + 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSpar7anShield(ch, x, y) {
    if (ch.id !== "spar7an") return;
    rect(x, y, 34, 42, ch.palette?.hair || "#b47a2c");
    rect(x + 5, y + 6, 24, 30, ch.palette?.accent || "#8b1016");
    rect(x + 12, y + 16, 10, 12, ch.palette?.white || "#f4d879");
  }

  function drawControlShield(ch, x, y) {
    if (ch.id !== "control") return;
    const p = ch.palette || {};
    rect(x, y, 38, 50, "rgba(88, 240, 255, 0.88)");
    rect(x + 5, y + 5, 28, 40, p.trunksDark || "#071017");
    rect(x + 8, y + 17, 22, 4, p.meter || "#58f0ff");
    rect(x + 17, y + 8, 4, 34, p.accent || "#31d7ff");
  }

  function drawJennySignalGear(ch, x, y, action) {
    if (ch.id !== "jenny-night-signal") return;
    const p = ch.palette || {};
    if (action === "block") {
      ctx.save();
      ctx.globalAlpha = 0.68;
      rect(x - 46, y - 48, 58, 42, "rgba(199, 247, 255, 0.24)");
      rect(x - 43, y - 45, 52, 5, p.meter || "#c7f7ff");
      rect(x - 38, y - 35, 34, 3, p.white || "#dfe8ef");
      rect(x - 38, y - 25, 42, 3, p.accent || "#78b7d8");
      rect(x - 38, y - 15, 22, 3, "#e6293f");
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55 + Math.sin(game.time * 16) * 0.18;
    rect(x - 7, y - 3, 5, 5, p.meter || "#c7f7ff");
    rect(x + 5, y + 6, 4, 4, "#e6293f");
    rect(x - 15, y + 12, 9, 2, p.white || "#dfe8ef");
    ctx.restore();
  }

  function drawSableGloveDetails(ch, x, y, dir) {
    if (ch.id !== "sable") return;
    const p = ch.palette || {};
    rect(x - 2, y - 5, 22, 8, p.meter || "#d33a54");
    rect(x + dir * 13, y + 7, 18, 5, p.white || "#d8c1a3");
    rect(x + dir * 3, y + 11, 10, 14, p.accent || "#7e1f32");
  }

  function isJohnRiftalityArmPhase(ch) {
    return ch.id === "john" && game.phase === "finisher" && player?.character?.id === "john" && game.finisherTime > 500 && game.finisherTime < 2520;
  }

  function drawJohnRiftalityBaseArms(p, lean, y, armW, hideLeft, hideRight) {
    const t = game.finisherTime || 0;
    const reach = clamp((t - 500) / 240, 0, 1) * clamp((2520 - t) / 260, 0, 1);
    const pulse = Math.floor(t / 56);
    const armColor = p.skin || "#94703d";
    const gloveColor = p.gloves || "#080808";
    const clawColor = p.white || "#f5f0f0";

    function drawSwing(side) {
      const isLeft = side < 0;
      if ((isLeft && hideLeft) || (!isLeft && hideRight)) return;
      const phase = pulse + (isLeft ? 0 : 1);
      const forward = phase % 2 === 0;
      const shoulderX = (isLeft ? -25 : 17) + lean;
      const shoulderY = (isLeft ? -105 : -101) + y;
      const swing = Math.sin(t / 30 + (isLeft ? 0 : Math.PI));
      const handX = lean + (forward ? 86 + reach * 26 : 35 + Math.max(0, swing) * 20);
      const handY = shoulderY + (isLeft ? -12 : 14) + swing * 18;
      const elbowX = mix(shoulderX, handX, 0.48);
      const elbowY = shoulderY + (isLeft ? -4 : 6) - swing * 15;

      for (let ghost = 2; ghost >= 0; ghost -= 1) {
        const lag = ghost * 12;
        const gx = handX - lag;
        const gy = handY + (ghost - 1) * 7;
        ctx.save();
        ctx.globalAlpha = ghost === 0 ? 1 : 0.26 / ghost;
        ctx.strokeStyle = ghost === 0 ? armColor : p.meter || "#8fd46a";
        ctx.lineWidth = ghost === 0 ? armW : Math.max(6, armW - 5);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.quadraticCurveTo(elbowX - lag * 0.25, elbowY, gx - 13, gy);
        ctx.stroke();
        ctx.fillStyle = ghost === 0 ? gloveColor : p.skinDark || "#350303";
        ctx.fillRect(gx - 14, gy - 12, 28, 24);
        ctx.fillStyle = clawColor;
        for (let claw = 0; claw < 4; claw += 1) {
          const offset = (claw - 1.5) * 6;
          ctx.beginPath();
          ctx.moveTo(gx + 10, gy + offset);
          ctx.lineTo(gx + 33 + reach * 12, gy + offset - 3);
          ctx.lineTo(gx + 13, gy + offset + 4);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }

    drawSwing(-1);
    drawSwing(1);
  }

  function drawArms(action, p, lean, crouch, ch, detached) {
    const y = crouch ? 16 : 0;
    const armW = ch.body === "heavy" ? 22 : ch.body === "skeletal" ? 12 : 18;
    const hideLeft = detached && (detached.has("armL") || detached.has("arms"));
    const hideRight = detached && (detached.has("armR") || detached.has("arms"));
    if (isJohnRiftalityArmPhase(ch)) {
      drawJohnRiftalityBaseArms(p, lean, y, armW, hideLeft, hideRight);
      return;
    }
    if (action === "light" || action === "crouchLight") {
      if (!hideLeft) {
        rect(-35 + lean, -104 + y, armW, 38, ch.body === "skeletal" ? p.white : p.skin);
        gloveRect(ch, p, -43 + lean, -75 + y, 24, 24, "L");
        drawJohnClaws(ch, -43 + lean, -64 + y, -1);
        drawSpar7anShield(ch, -54 + lean, -102 + y);
        drawControlShield(ch, -57 + lean, -111 + y);
        drawJennySignalGear(ch, -29 + lean, -79 + y, action);
        drawSableGloveDetails(ch, -43 + lean, -75 + y, -1);
      }
      if (!hideRight) {
        const punchY = action === "crouchLight" ? -78 + y : -104 + y;
        const gloveY = action === "crouchLight" ? -86 + y : -112 + y;
        rect(14 + lean, punchY, action === "crouchLight" ? 52 : 60, 13, ch.body === "skeletal" ? p.white : p.skin);
        gloveRect(ch, p, action === "crouchLight" ? 58 + lean : 66 + lean, gloveY, 28, 25, "R");
        drawJohnClaws(ch, (action === "crouchLight" ? 84 : 92) + lean, gloveY + 12, 1);
        drawJennySignalGear(ch, (action === "crouchLight" ? 65 : 73) + lean, gloveY + 11, action);
        drawSableGloveDetails(ch, (action === "crouchLight" ? 58 : 66) + lean, gloveY + 4, 1);
      }
      return;
    }

    if (action === "crouchKick") {
      if (!hideLeft) {
        rect(-34 + lean, -96 + y, armW, 30, ch.body === "skeletal" ? p.white : p.skin);
        gloveRect(ch, p, -42 + lean, -72 + y, 24, 22, "L");
      }
      if (!hideRight) {
        rect(12 + lean, -92 + y, armW, 28, ch.body === "skeletal" ? p.white : p.skin);
        gloveRect(ch, p, 8 + lean, -70 + y, 22, 20, "R");
      }
      return;
    }

    if (action === "upper") {
      if (!hideLeft) {
        rect(-36 + lean, -98 + y, armW + 4, 34, ch.body === "skeletal" ? p.white : p.skin);
        gloveRect(ch, p, -43 + lean, -73 + y, 25, 24, "L");
        drawJohnClaws(ch, -43 + lean, -62 + y, -1);
        drawSpar7anShield(ch, -54 + lean, -100 + y);
        drawControlShield(ch, -56 + lean, -108 + y);
        drawJennySignalGear(ch, -28 + lean, -77 + y, action);
        drawSableGloveDetails(ch, -43 + lean, -73 + y, -1);
      }
      if (!hideRight) {
        rect(15 + lean, -124 + y, armW, 58, ch.body === "skeletal" ? p.white : p.skin);
        gloveRect(ch, p, 8 + lean, -150 + y, 28, 28, "R");
        drawJohnClaws(ch, 35 + lean, -138 + y, 1);
        drawJennySignalGear(ch, 23 + lean, -137 + y, action);
        drawSableGloveDetails(ch, 8 + lean, -146 + y, 1);
      }
      return;
    }

    if (action === "special" || action === "dash" || action === "beam" || action === "surge" || action === "crush") {
      if (!hideLeft) {
        rect(-37 + lean, -101 + y, armW + 6, 15, ch.body === "skeletal" ? p.white : p.skin);
        gloveRect(ch, p, -52 + lean, -108 + y, 24, 24, "L");
        drawJohnClaws(ch, -52 + lean, -96 + y, -1);
        drawSpar7anShield(ch, -61 + lean, -118 + y);
        drawControlShield(ch, -66 + lean, -124 + y);
        drawJennySignalGear(ch, -39 + lean, -100 + y, action);
        drawSableGloveDetails(ch, -52 + lean, -104 + y, -1);
      }
      if (!hideRight) {
        rect(15 + lean, -102 + y, 44, 14, ch.body === "skeletal" ? p.white : p.skin);
        gloveRect(ch, p, 50 + lean, -111 + y, 27, 25, "R");
        drawJohnClaws(ch, 76 + lean, -99 + y, 1);
        drawJennySignalGear(ch, 63 + lean, -99 + y, action);
        drawSableGloveDetails(ch, 50 + lean, -107 + y, 1);
      }
      return;
    }

    if (action === "block") {
      if (!hideLeft) {
        gloveRect(ch, p, -38 + lean, -111 + y, 23, 23, "L");
        rect(-25 + lean, -100 + y, 16, 31, ch.body === "skeletal" ? p.white : p.skin);
        drawJohnClaws(ch, -38 + lean, -99 + y, -1);
        drawSpar7anShield(ch, -47 + lean, -116 + y);
        drawControlShield(ch, -55 + lean, -124 + y);
        drawJennySignalGear(ch, -37 + lean, -92 + y, action);
        drawSableGloveDetails(ch, -38 + lean, -107 + y, -1);
      }
      if (!hideRight) {
        gloveRect(ch, p, 14 + lean, -113 + y, 23, 25, "R");
        rect(8 + lean, -101 + y, 17, 33, ch.body === "skeletal" ? p.white : p.skin);
        drawJohnClaws(ch, 36 + lean, -101 + y, 1);
        drawJennySignalGear(ch, 24 + lean, -101 + y, action);
        drawSableGloveDetails(ch, 14 + lean, -109 + y, 1);
      }
      return;
    }

    if (!hideLeft) {
      rect(-35 + lean, -102 + y, armW, 34, ch.body === "skeletal" ? p.white : p.skin);
      drawFightArmClothing(ch, p, lean, y, armW, true);
      gloveRect(ch, p, -43 + lean, -76 + y, 25, 24, "L");
      drawJohnClaws(ch, -43 + lean, -64 + y, -1);
      drawSpar7anShield(ch, -55 + lean, -101 + y);
      drawControlShield(ch, -58 + lean, -111 + y);
      drawJennySignalGear(ch, -31 + lean, -74 + y, action);
      drawSableGloveDetails(ch, -43 + lean, -76 + y, -1);
    }
    if (!hideRight) {
      rect(18 + lean, -102 + y, armW - 1, 31, ch.body === "skeletal" ? p.white : p.skin);
      drawFightArmClothing(ch, p, lean, y, armW, false);
      gloveRect(ch, p, 25 + lean, -83 + y, 25, 24, "R");
      drawJohnClaws(ch, 49 + lean, -71 + y, 1);
      drawJennySignalGear(ch, 38 + lean, -72 + y, action);
      drawSableGloveDetails(ch, 25 + lean, -83 + y, 1);
    }
  }

  function drawKnockedOut(f, p, alpha) {
    const ch = f.character || getCharacter("rift");
    const customPants = ch.id === "custom" ? ch.pants || "trunks" : "";
    const customShirt = ch.id === "custom" ? ch.shirt || "tee" : "";
    const fullLengthPants = ["jeans", "joggers", "cargos", "leggings", "greaves", "gi", "bones"].includes(customPants);
    const legColor = !fullLengthPants
      ? p.skin
      : customPants === "gi"
        ? p.white
        : customPants === "leggings" || customPants === "bones"
          ? p.trunksDark
          : customPants === "greaves"
            ? "#59636c"
            : p.trunks;
    const torsoColor = !customShirt || customShirt === "bare"
      ? p.skin
      : ["hoodie", "jacket", "robe"].includes(customShirt)
        ? p.trunks
        : customShirt === "gi"
          ? p.white
          : customShirt === "bones"
            ? "#111111"
            : p.accent;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(f.x, FLOOR - 2);
    ctx.scale(f.facing, 1);
    rect(-70, -25, 78, 25, legColor);
    rect(-48, -31, 54, 19, customPants === "gi" ? p.trunksDark : p.trunks);
    rect(4, -32, 36, 26, torsoColor);
    if (customShirt === "bones") {
      rect(12, -30, 7, 22, p.white);
      rect(5, -24, 32, 5, p.white);
    } else if (customShirt === "jacket" || customShirt === "robe") {
      rect(20, -30, 5, 23, p.accent);
    }
    if (customPants === "jeans") rect(-65, -23, 7, 20, p.accent);
    if (customPants === "bones") rect(-50, -22, 8, 18, p.white);
    rect(34, -33, 24, 20, p.gloves);
    rect(-92, -22, 34, 19, p.boots);
    rect(-101, -24, 15, 16, p.white);
    rect(39, -54, 32, 27, p.skin);
    rect(38, -62, 40, 12, p.hair);
    rect(35, -50, 33, 7, p.accent);
    ctx.restore();
  }

  function drawDizzyStars(lean) {
    const top = -178 + Math.sin(game.time * 5) * 3;
    for (let i = 0; i < 5; i += 1) {
      const angle = game.time * 3 + i * 1.25;
      const x = lean + Math.cos(angle) * 30;
      const y = top + Math.sin(angle) * 9;
      rect(x - 4, y - 4, 8, 8, "#f8dd94");
      rect(x - 1, y - 9, 2, 18, "#fff4a7");
      rect(x - 9, y - 1, 18, 2, "#fff4a7");
    }
  }

  function drawEnergyOrb(x, y, color, r) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(x, y, r + 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMarauderGunFinisher(t, fx, dir) {
    const muzzleX = player.x + dir * 54;
    const muzzleY = player.y - 96;
    const aimY = game.finisher?.lastShotTargetY || enemy.y - 92;
    const sinceShot = t - (game.finisher?.lastShotTime || -999);
    const flash = clamp(1 - sinceShot / 150, 0, 1);

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${clamp(t / 600, 0, 0.48)})`;
    ctx.fillRect(0, 0, W, H);

    ctx.translate(player.x, player.y);
    ctx.scale(dir, 1);
    rect(18, -111, 48, 14, "#11131a");
    rect(53, -118, 18, 8, "#2e3440");
    rect(21, -98, 12, 22, "#302316");
    rect(10, -103, 22, 18, player.palette.skin);
    rect(2, -96, 16, 17, player.palette.gloves);
    ctx.restore();

    if (flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = flash;
      ctx.strokeStyle = "#fff2bd";
      ctx.lineWidth = 4 + flash * 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(muzzleX, muzzleY);
      ctx.lineTo(enemy.x + dir * 8, aimY);
      ctx.stroke();
      ctx.fillStyle = fx.primary;
      ctx.beginPath();
      ctx.arc(muzzleX + dir * 11, muzzleY, 12 + flash * 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(muzzleX + dir * 7, muzzleY, 5 + flash * 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (t > 620 && t < 2280) {
      ctx.save();
      ctx.globalAlpha = 0.36 + Math.sin(t / 35) * 0.12;
      ctx.fillStyle = fx.primary;
      ctx.fillRect(enemy.x - 34, enemy.y - 145, 68, 5);
      ctx.fillRect(enemy.x - 22, enemy.y - 72, 44, 4);
      ctx.restore();
    }
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.kind === "beam" || p.kind === "flameBeam" || p.kind === "boneBeam" || p.kind === "shadowBeam") {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = p.trail;
        ctx.fillRect(-85, -p.radius, 110, p.radius * 2);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = p.color;
        ctx.fillRect(-66, -6, 92, 12);
        ctx.fillStyle = "#fff";
        ctx.fillRect(18, -3, 20, 6);
        if (p.kind === "flameBeam") {
          ctx.fillStyle = p.trail;
          ctx.fillRect(-25, -24, 18, 48);
          ctx.fillRect(-55, -16, 14, 32);
        }
        if (p.kind === "boneBeam") {
          ctx.fillStyle = p.trail;
          for (let i = 0; i < 4; i += 1) rect(-64 + i * 25, -18 + (i % 2) * 24, 15, 8, p.trail);
        }
      } else if (p.kind === "fan") {
        ctx.fillStyle = p.color;
        ctx.fillRect(-18, -23, 52, 8);
        ctx.fillRect(-25, -3, 59, 8);
        ctx.fillRect(-18, 17, 52, 8);
        ctx.fillStyle = p.trail;
        ctx.fillRect(-42, -4, 28, 10);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = p.trail || p.color;
        ctx.fillRect(-36, -5, 44, 10);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff";
        ctx.fillRect(-5, -5, 10, 10);
      }
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, p.color);
    }
    ctx.globalAlpha = 1;
  }
  // impact atlas sprites drawn via drawImpactVfx() from render()

  function drawStains() {
    ctx.save();
    for (const stain of stains) {
      ctx.globalAlpha = stain.alpha * clamp(stain.life / 24000, 0.25, 1);
      ctx.fillStyle = stain.color;
      ctx.beginPath();
      ctx.ellipse(stain.x, stain.y, stain.w, stain.h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha *= 0.55;
      ctx.fillRect(stain.x - stain.w * 0.45, stain.y - 2, stain.w * 0.9, 3);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawBlood() {
    ctx.save();
    for (const drop of blood) {
      ctx.globalAlpha = clamp(drop.life / drop.maxLife, 0, 1);
      rect(drop.x - drop.size / 2, drop.y - drop.size / 2, drop.size, drop.size, drop.color);
      if (drop.size > 5) rect(drop.x - drop.size, drop.y + 2, drop.size * 1.8, 2, "#3b0204");
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawAfterImages() {
    for (const image of afterImages) {
      const alpha = image.life / 180 * 0.26;
      const snapshot = {
        ...image.fighter,
        x: image.x,
        y: image.y,
        facing: image.facing,
        action: { type: "dash" },
        state: "dash",
      };
      drawFighter(snapshot, alpha);
    }
  }

  function drawPixelTank(x, y, dir, fx) {
    const px = (dx, dy, w, h, color) => rect(x + dx * dir, y + dy, w, h, color);
    px(0, -10, 52, 14, "#4a5d23");
    px(-4, -18, 60, 10, "#6f7f3f");
    px(8, -24, 18, 8, fx.secondary);
    px(24, -22, 28, 5, fx.primary);
    px(50, -21, 16, 4, "#2f2f2f");
    for (let i = -2; i <= 3; i += 1) {
      px(i * 10, -2, 8, 6, "#2d2d2d");
      px(i * 10 + 2, 2, 6, 4, "#1a1a1a");
    }
    px(14, -30, 10, 8, fx.primary);
    if (game.finisher?.playerInTank) {
      px(18, -28, 6, 5, player.palette.skin);
    }
  }

  function drawJohnClawFinisher(t, fx, dir) {
    const slashTimes = [620, 860, 1100, 1340, 1660, 2040, 2320];
    ctx.save();
    drawJohnRiftalityArmFlurry(t, fx, dir);
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < slashTimes.length; i += 1) {
      const age = t - slashTimes[i];
      if (age < 0 || age > 210) continue;
      const alpha = clamp(1 - age / 210, 0, 1);
      const centerX = enemy.x + Math.sin(i * 1.7) * 28;
      const centerY = enemy.y - 118 + i * 11;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = i % 2 ? fx.primary : "#f5f0f0";
      ctx.lineWidth = 5 + alpha * 5;
      ctx.lineCap = "round";
      for (let claw = 0; claw < 4; claw += 1) {
        const offset = (claw - 1.5) * 13;
        ctx.beginPath();
        ctx.moveTo(centerX - dir * 86, centerY + offset - 28);
        ctx.lineTo(centerX + dir * 82, centerY + offset + 30);
        ctx.stroke();
      }
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = "#7a0508";
      ctx.fillRect(centerX - 46, centerY - 4, 92, 8);
    }
    ctx.restore();
  }

  function drawJohnRiftalityArmFlurry(t, fx, dir) {
    if (t < 520 || t > 2460) return;
    const p = player.palette || {};
    const pulse = Math.floor(t / 72);
    const reach = clamp((t - 520) / 260, 0, 1) * clamp((2460 - t) / 240, 0, 1);
    const targetX = (enemy.x - player.x) * dir - 20;
    const maxReach = clamp(targetX, 70, 164);
    const armColor = p.skin || "#94703d";
    const gloveColor = p.gloves || "#080808";
    const clawColor = p.white || "#f5f0f0";

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.scale(dir, 1);
    ctx.globalCompositeOperation = "source-over";

    for (let side = 0; side < 2; side += 1) {
      const shoulderY = side === 0 ? -108 : -94;
      const phase = pulse + side;
      const forward = phase % 2 === 0;
      const swing = Math.sin(t / 38 + side * Math.PI);
      const handX = (forward ? maxReach : 56) * reach + Math.max(0, swing) * 28;
      const handY = shoulderY + (side === 0 ? -18 : 16) + swing * 18;
      const elbowX = handX * 0.46;
      const elbowY = shoulderY + (side === 0 ? -8 : 8) - swing * 12;

      for (let ghost = 2; ghost >= 0; ghost -= 1) {
        const lag = ghost * 18;
        const gx = handX - lag;
        const gy = handY + (ghost - 1) * 9;
        ctx.globalAlpha = ghost === 0 ? 1 : 0.24 / ghost;
        ctx.strokeStyle = ghost === 0 ? armColor : fx.primary;
        ctx.lineWidth = ghost === 0 ? 13 : 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-18, shoulderY);
        ctx.quadraticCurveTo(elbowX - lag * 0.45, elbowY, gx - 16, gy);
        ctx.stroke();
        ctx.fillStyle = ghost === 0 ? gloveColor : fx.secondary;
        ctx.fillRect(gx - 15, gy - 13, 30, 26);
        ctx.fillStyle = clawColor;
        for (let claw = 0; claw < 4; claw += 1) {
          const offset = (claw - 1.5) * 6;
          ctx.beginPath();
          ctx.moveTo(gx + 10, gy + offset);
          ctx.lineTo(gx + 33 + reach * 12, gy + offset - 3);
          ctx.lineTo(gx + 13, gy + offset + 4);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.38 + Math.sin(t / 35) * 0.12;
    ctx.strokeStyle = fx.primary;
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i += 1) {
      const y = -116 + i * 12 + Math.sin(t / 30 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(maxReach + 54, y + Math.sin(t / 24 + i) * 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawKingGroundWaveFinisher(t, fx, dir) {
    ctx.save();
    if (t > 420 && t < 1720) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.24 + clamp((t - 420) / 520, 0, 1) * 0.34})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.5 + Math.sin(game.time * 12) * 0.18;
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(player.x - 24, player.y - 164, 48, 4);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(player.x - 18, player.y - 149, 36, 3);
      ctx.globalCompositeOperation = "source-over";
    }

    if (t > 2180 && t < 3360) {
      const startX = game.finisher?.waveStartX || (player.x + dir * 42);
      const waveP = clamp((t - 2360) / 560, 0, 1);
      const frontX = mix(startX, enemy.x + dir * 30, smoothStep(waveP));
      const backX = frontX - dir * (120 + waveP * 80);
      const minX = Math.min(backX, frontX);
      const width = Math.abs(frontX - backX);
      const swell = Math.sin(clamp((t - 2360) / 560, 0, 1) * Math.PI);

      ctx.fillStyle = "rgba(68, 45, 28, 0.72)";
      ctx.beginPath();
      ctx.moveTo(backX, FLOOR + 6);
      for (let i = 0; i <= 10; i += 1) {
        const p = i / 10;
        const x = mix(backX, frontX, p);
        const crest = Math.sin(p * Math.PI) * (34 + swell * 54);
        const jag = Math.sin(game.time * 18 + i * 1.7) * 8;
        ctx.lineTo(x, FLOOR - crest + jag);
      }
      ctx.lineTo(frontX + dir * 42, FLOOR + 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = fx.secondary;
      for (let i = 0; i < 12; i += 1) {
        const p = i / 11;
        const x = minX + width * p + Math.sin(game.time * 10 + i) * 6;
        const h = 14 + Math.sin(game.time * 17 + i) * 8 + swell * 24;
        ctx.fillRect(x - 6, FLOOR - h, 12 + (i % 3) * 5, h);
      }

      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.34 + swell * 0.28;
      ctx.fillStyle = fx.primary;
      ctx.fillRect(minX, FLOOR - 10, width + 48, 8);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      if (t > 2820 && t < 3160) {
        const blast = clamp((t - 2820) / 190, 0, 1);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.72 * (1 - blast * 0.45);
        ctx.fillStyle = fx.secondary;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 86, 36 + blast * 116, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff4cf";
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 86, 16 + blast * 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }
    }
    ctx.restore();
  }

  function drawSpar7anSpearFinisher(t, fx, dir) {
    const baseX = player.x + dir * 28;
    const baseY = player.y - 102;
    const tipX = game.finisher?.spearTipX || (baseX + dir * 90);
    const tipY = game.finisher?.spearTipY || (baseY - 8);
    const glow = t > 760 && t < 1700 ? clamp((t - 760) / 520, 0, 1) : 0;

    ctx.save();
    if (t > 360 && t < 2060) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.18 + glow * 0.36})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.lineCap = "round";
    ctx.strokeStyle = "#5b3420";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(baseX - dir * 52, baseY + 13);
    ctx.lineTo(tipX - dir * 10, tipY + 1);
    ctx.stroke();

    ctx.strokeStyle = fx.primary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(baseX - dir * 42, baseY + 10);
    ctx.lineTo(tipX - dir * 14, tipY);
    ctx.stroke();

    ctx.fillStyle = "#d9dde5";
    ctx.beginPath();
    ctx.moveTo(tipX + dir * 30, tipY);
    ctx.lineTo(tipX - dir * 12, tipY - 16);
    ctx.lineTo(tipX - dir * 5, tipY);
    ctx.lineTo(tipX - dir * 12, tipY + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(tipX - dir * 8, tipY - 3, dir * 28, 6);

    if (glow > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.2 + glow * 0.4;
      ctx.strokeStyle = fx.secondary;
      ctx.lineWidth = 16 + glow * 12;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(tipX + dir * 28, tipY);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = fx.primary;
      ctx.beginPath();
      ctx.arc(tipX + dir * 18, tipY, 8 + glow * 18, 0, Math.PI * 2);
      ctx.fill();
    }

    if (t > 1320 && t < 2060) {
      const blast = clamp((t - 1320) / 180, 0, 1);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.72 * (1 - blast * 0.5);
      ctx.fillStyle = fx.secondary;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 96, 24 + blast * 78, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff4cf";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 96, 8 + blast * 32, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLazyControllerFinisher(t, fx, dir) {
    const kitX = player.x + dir * 34;
    const kitY = FLOOR - 54;
    const frenzy = clamp((t - 620) / 1560, 0, 1);
    const finalPulse = t > 1780 && t < 2580 ? clamp((t - 1780) / 280, 0, 1) : 0;

    ctx.save();
    if (t > 520 && t < 2860) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.16 + frenzy * 0.34})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.globalCompositeOperation = "lighter";
    for (const wave of game.finisher.drumShockwaves || []) {
      const a = clamp(wave.life / wave.maxLife, 0, 1);
      ctx.globalAlpha = a * 0.72;
      ctx.strokeStyle = wave.color || fx.primary;
      ctx.lineWidth = 4 + (1 - a) * 14;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, 18 + (1 - a) * 165, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const note of game.finisher.drumNotes || []) {
      const a = clamp(note.life / note.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.translate(note.x, note.y);
      ctx.rotate(note.rot);
      ctx.font = `900 ${note.size}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.58)";
      ctx.strokeText(note.symbol, 0, 0);
      ctx.fillStyle = note.color || fx.primary;
      ctx.fillText(note.symbol, 0, 0);
      ctx.restore();
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(kitX, kitY);
    const pulse = Math.sin(t / 34) * (4 + frenzy * 8);
    const cymbalTilt = Math.sin(t / 42) * 0.18;

    ctx.strokeStyle = "#0b0710";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-44, 10);
    ctx.lineTo(-68, 52);
    ctx.moveTo(44, 10);
    ctx.lineTo(68, 52);
    ctx.moveTo(0, 4);
    ctx.lineTo(0, 54);
    ctx.stroke();

    ctx.fillStyle = "#08060b";
    ctx.beginPath();
    ctx.ellipse(0, 18, 42 + pulse * 0.3, 34 + pulse * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = player.palette.trunks;
    ctx.beginPath();
    ctx.ellipse(0, 18, 32 + pulse * 0.18, 24 + pulse * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = player.palette.meter;
    ctx.fillRect(-18, 8, 36, 7);

    ctx.fillStyle = player.palette.accent;
    ctx.beginPath();
    ctx.ellipse(-38, -18, 24 + pulse * 0.18, 15 + pulse * 0.1, -0.2, 0, Math.PI * 2);
    ctx.ellipse(38, -18, 24 + pulse * 0.18, 15 + pulse * 0.1, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f1d766";
    ctx.save();
    ctx.rotate(cymbalTilt);
    ctx.beginPath();
    ctx.ellipse(-72, -38, 30, 8, -0.16, 0, Math.PI * 2);
    ctx.ellipse(72, -40, 30, 8, 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "#f4ead8";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    const stickLift = 22 + Math.abs(Math.sin(t / 42)) * (20 + frenzy * 18);
    ctx.beginPath();
    ctx.moveTo(-18, -60);
    ctx.lineTo(-58, -24 - stickLift);
    ctx.moveTo(18, -58);
    ctx.lineTo(58, -26 - stickLift * 0.85);
    ctx.stroke();
    ctx.restore();

    if (finalPulse > 0) {
      const blast = clamp((t - 1780) / 360, 0, 1);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.8 * (1 - blast * 0.35);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(0, enemy.y - 106, W, 14 + blast * 24);
      ctx.fillStyle = fx.secondary;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 104, 22 + blast * 106, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawNinjaKatanaFinisher(t, fx, dir) {
    ctx.save();
    const handX = player.x + dir * 36;
    const handY = player.y - 98;
    ctx.strokeStyle = "#d8d0bd";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(handX - dir * 22, handY + 18);
    ctx.lineTo(handX + dir * 74, handY - 34);
    ctx.stroke();
    ctx.strokeStyle = fx.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(handX - dir * 14, handY + 14);
    ctx.lineTo(handX + dir * 68, handY - 31);
    ctx.stroke();

    if (t > 560 && t < 1880) {
      ctx.globalCompositeOperation = "lighter";
      const slashTimes = [620, 790, 960, 1130, 1310, 1510, 1710];
      for (let i = 0; i < slashTimes.length; i += 1) {
        const age = t - slashTimes[i];
        if (age < 0 || age > 190) continue;
        const alpha = 1 - age / 190;
        const cy = enemy.y - 132 + i * 13;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = i % 2 ? fx.primary : "#fff6dd";
        ctx.lineWidth = 4 + alpha * 5;
        ctx.beginPath();
        ctx.moveTo(enemy.x - dir * 90, cy - 30);
        ctx.lineTo(enemy.x + dir * 88, cy + 30);
        ctx.stroke();
      }
    }

    if (t > 2640 && t < 3100) {
      const pulse = clamp((t - 2640) / 180, 0, 1);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.5 * (1 - pulse * 0.4);
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(enemy.x - 52, enemy.y - 145, 104, 7);
      ctx.fillRect(enemy.x - 46, enemy.y - 105, 92, 6);
      ctx.fillRect(enemy.x - 38, enemy.y - 66, 76, 5);
    }
    ctx.restore();
  }

  function drawGritAirstrikeFinisher(t, fx, dir) {
    ctx.save();
    if (t > 720 && t < 3060) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.18 + clamp((t - 720) / 520, 0, 0.42)})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (t > 760 && t < 1900) {
      const handX = player.x + dir * 34;
      const handY = player.y - 126;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#111820";
      ctx.fillRect(handX - dir * 8, handY - 18, dir * 26, 36);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(handX + dir * 2, handY - 12, dir * 12, 6);
      ctx.fillStyle = "#0b0d0f";
      ctx.fillRect(handX + dir * 8, handY - 26, dir * 5, 12);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.45 + Math.sin(game.time * 18) * 0.18;
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(handX + dir * (20 + i * 9), handY - 16, 8 + i * 8, -0.9, 0.9);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    if (t > 1880 && t < 3180) {
      const jetX = game.finisher?.jetX ?? (dir > 0 ? -140 : W + 140);
      const jetY = game.finisher?.jetY ?? 96;
      ctx.fillStyle = "#1b2028";
      ctx.beginPath();
      ctx.moveTo(jetX + dir * 74, jetY);
      ctx.lineTo(jetX - dir * 50, jetY - 20);
      ctx.lineTo(jetX - dir * 72, jetY);
      ctx.lineTo(jetX - dir * 50, jetY + 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#55616f";
      ctx.fillRect(jetX - dir * 34, jetY - 6, dir * 72, 12);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(jetX + dir * 10, jetY - 4, dir * 16, 8);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "#ffcf62";
      ctx.fillRect(jetX - dir * 82, jetY - 4, dir * 28, 8);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    if (game.finisher?.bombDropped && t < 2760) {
      const x = game.finisher.bombX ?? enemy.x;
      const y = game.finisher.bombY ?? enemy.y - 150;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.24 * dir);
      ctx.fillStyle = "#23262b";
      ctx.fillRect(-8, -16, 16, 32);
      ctx.fillStyle = "#111";
      ctx.fillRect(-12, -13, 24, 7);
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(-5, 10, 10, 9);
      ctx.restore();
    }

    if (t > 2680 && t < 3380) {
      const blast = clamp((t - 2680) / 240, 0, 1);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.8 * (1 - blast * 0.42);
      ctx.fillStyle = "#fff2bd";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 84, 20 + blast * 78, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8c38";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 74, 44 + blast * 136, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fx.primary;
      ctx.fillRect(enemy.x - 160 - blast * 80, FLOOR - 24, 320 + blast * 160, 22);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawAnthonyNukeFinisher(t, fx, dir) {
    ctx.save();

    if (t > 260 && t < 2860) {
      const warning = 0.12 + clamp((t - 260) / 1400, 0, 0.34);
      ctx.fillStyle = `rgba(78, 16, 8, ${warning})`;
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.font = "900 27px Trebuchet MS, Arial";
      ctx.fillStyle = t % 420 < 210 ? "#ffb42e" : "#fff4cf";
      ctx.strokeStyle = "#160a04";
      ctx.lineWidth = 6;
      ctx.strokeText("E-1 ANTHONY // NUCLEAR AUTHORIZATION", W * 0.5, 92);
      ctx.fillText("E-1 ANTHONY // NUCLEAR AUTHORIZATION", W * 0.5, 92);
    }

    if (t > 320 && t < 1320) {
      const handX = player.x + dir * 32;
      const handY = player.y - 126;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#151b14";
      ctx.fillRect(handX - 12, handY - 20, 30, 40);
      ctx.fillStyle = "#85a55d";
      ctx.fillRect(handX - 7, handY - 14, 20, 8);
      ctx.fillStyle = "#9cff6b";
      ctx.fillRect(handX - 3, handY - 11, 12, 3);
      ctx.strokeStyle = "#20261d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(handX + 11, handY - 18);
      ctx.lineTo(handX + 18, handY - 40);
      ctx.stroke();
    }

    if (game.finisher?.warheadX != null && t < 2880) {
      const x = game.finisher.warheadX;
      const y = game.finisher.warheadY;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.42 * dir);
      ctx.fillStyle = "#343a32";
      ctx.fillRect(-12, -32, 24, 64);
      ctx.fillStyle = "#191d19";
      ctx.beginPath();
      ctx.moveTo(-12, -32);
      ctx.lineTo(0, -50);
      ctx.lineTo(12, -32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#d2d6bd";
      ctx.fillRect(-12, -8, 24, 11);
      ctx.fillStyle = "#ffb42e";
      ctx.fillRect(-7, 10, 14, 7);
      ctx.restore();
    }

    if (t > 2820) {
      const age = t - 2820;
      const flash = clamp(1 - age / 720, 0, 1);
      const grow = smoothStep(clamp(age / 1180, 0, 1));
      const cloudX = enemy.x;
      const cloudY = FLOOR - 20 - grow * 168;

      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = flash;
      ctx.fillStyle = "#fffef0";
      ctx.fillRect(0, 0, W, H);

      ctx.globalAlpha = clamp(0.95 - age / 2500, 0.22, 0.95);
      ctx.fillStyle = "#ffb42e";
      ctx.beginPath();
      ctx.arc(cloudX, FLOOR - 24, 38 + grow * 190, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff0a8";
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 34 + grow * 94, 0, Math.PI * 2);
      ctx.arc(cloudX - 58 * grow, cloudY + 18, 24 + grow * 48, 0, Math.PI * 2);
      ctx.arc(cloudX + 58 * grow, cloudY + 18, 24 + grow * 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f06a24";
      ctx.fillRect(cloudX - 18 - grow * 16, cloudY + 34, 36 + grow * 32, 172 * grow);

      ctx.globalAlpha = clamp(0.72 - age / 3200, 0.12, 0.72);
      ctx.strokeStyle = fx.secondary;
      ctx.lineWidth = 7;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(cloudX, FLOOR - 28, 90 + grow * (120 + i * 60), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawMiniHead(x, y, palette, scale = 1, options = {}) {
    const w = 28 * scale;
    const h = 30 * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(options.rot || 0);
    rect(-w / 2, -h / 2, w, h, palette.skin || "#efe4cf");
    rect(-w / 2 - 2 * scale, -h / 2 - 6 * scale, w + 4 * scale, 8 * scale, palette.hair || palette.white || "#d8cfc0");
    rect(-6 * scale, -3 * scale, 5 * scale, 5 * scale, "#0b1018");
    rect(5 * scale, -3 * scale, 5 * scale, 5 * scale, "#0b1018");
    rect(-8 * scale, 8 * scale, 16 * scale, 5 * scale, palette.skinDark || "#7a0508");
    if (options.bone) {
      rect(-10 * scale, -h / 2 + 4 * scale, 20 * scale, 5 * scale, palette.white || "#f5f5f5");
      rect(-4 * scale, 3 * scale, 3 * scale, 3 * scale, "#0b1018");
      rect(5 * scale, 3 * scale, 3 * scale, 3 * scale, "#0b1018");
    }
    ctx.restore();
  }

  function drawPlotPulseUfoFinisher(t, fx, dir) {
    ctx.save();
    const arrival = smoothStep((t - 180) / 900);
    const beamOn = clamp((t - 1050) / 420, 0, 1) * (1 - clamp((t - 3200) / 420, 0, 1));

    ctx.fillStyle = `rgba(2, 4, 18, ${0.16 + arrival * 0.58})`;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 42; i += 1) {
      const sx = (i * 173 + 41) % W;
      const sy = (i * 67 + 19) % 230;
      const twinkle = 0.35 + (Math.sin(t / 180 + i * 1.7) + 1) * 0.3;
      ctx.globalAlpha = arrival * twinkle;
      ctx.fillStyle = i % 3 === 0 ? fx.primary : "#eefcff";
      ctx.fillRect(sx, sy, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2);
    }
    ctx.globalAlpha = 1;

    function drawUfo(x, y, scale, phase) {
      const hover = Math.sin(t / 130 + phase) * 5;
      ctx.save();
      ctx.translate(x, y + hover);
      ctx.scale(scale, scale);
      ctx.fillStyle = "rgba(95, 246, 255, 0.34)";
      ctx.beginPath();
      ctx.ellipse(0, 15, 56, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#17233f";
      ctx.beginPath();
      ctx.ellipse(0, 4, 52, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fx.secondary;
      ctx.beginPath();
      ctx.ellipse(0, 0, 31, 20, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(216, 255, 241, 0.72)";
      ctx.beginPath();
      ctx.ellipse(0, -1, 20, 12, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      for (let lamp = -2; lamp <= 2; lamp += 1) {
        ctx.fillStyle = (Math.floor(t / 110 + lamp + phase) % 2 === 0) ? fx.primary : "#fff";
        ctx.fillRect(lamp * 17 - 3, 8, 6, 5);
      }
      ctx.restore();
    }

    const fleet = [
      { x: enemy.x, y: 72, s: 1.2, p: 0 },
      { x: enemy.x - 230, y: 118, s: 0.72, p: 1.4 },
      { x: enemy.x + 225, y: 110, s: 0.78, p: 2.8 },
      { x: enemy.x - 120, y: 165, s: 0.52, p: 4.2 },
      { x: enemy.x + 132, y: 158, s: 0.56, p: 5.6 },
    ];
    for (const ship of fleet) {
      const startY = -120 - ship.p * 14;
      drawUfo(ship.x, mix(startY, ship.y, arrival), ship.s, ship.p);
    }

    if (beamOn > 0) {
      const topY = 88;
      const bottomY = Math.min(FLOOR + 12, enemy.y + 18);
      const pulse = 0.78 + Math.sin(t / 70) * 0.16;
      const gradient = ctx.createLinearGradient(enemy.x, topY, enemy.x, bottomY);
      gradient.addColorStop(0, `rgba(95, 246, 255, ${0.66 * beamOn})`);
      gradient.addColorStop(0.55, `rgba(123, 92, 255, ${0.3 * beamOn})`);
      gradient.addColorStop(1, "rgba(216, 255, 241, 0)");
      ctx.globalAlpha = pulse;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(enemy.x - 36, topY);
      ctx.lineTo(enemy.x - 92, bottomY);
      ctx.lineTo(enemy.x + 92, bottomY);
      ctx.lineTo(enemy.x + 36, topY);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = beamOn;
      ctx.strokeStyle = "#d8fff1";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(enemy.x, bottomY - 4, 72 + Math.sin(t / 80) * 9, 17, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (t > 1250 && t < 3150) {
      ctx.font = "900 18px Trebuchet MS, Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = fx.primary;
      ctx.strokeStyle = "#050714";
      ctx.lineWidth = 5;
      ctx.strokeText("ABDUCTION LOCKED", W / 2, 238);
      ctx.fillText("ABDUCTION LOCKED", W / 2, 238);
    }
    ctx.restore();
  }

  function drawDragonSkyFeastFinisher(t, fx, dir) {
    ctx.save();
    const space = clamp((t - 1660) / 760, 0, 1) * (1 - clamp((t - 4050) / 620, 0, 1));
    const flight = t < 3300;

    if (space > 0) {
      ctx.globalAlpha = space * 0.9;
      ctx.fillStyle = "#01030c";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i += 1) {
        const x = (i * 137 + 29) % W;
        const y = (i * 71 + 17) % H;
        const glow = 0.45 + (Math.sin(t / 150 + i) + 1) * 0.25;
        ctx.globalAlpha = space * glow;
        ctx.fillStyle = i % 6 === 0 ? fx.secondary : "#ffffff";
        ctx.fillRect(x, y, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
      }
      ctx.globalAlpha = space * 0.85;
      ctx.fillStyle = "#2455a4";
      ctx.beginPath();
      ctx.arc(W - 80, H + 58, 168, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3ba96c";
      ctx.beginPath();
      ctx.ellipse(W - 135, H - 15, 55, 24, -0.25, 0, Math.PI * 2);
      ctx.ellipse(W - 32, H - 34, 48, 19, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (t > 180 && t < 1700) {
      ctx.fillStyle = `rgba(4, 12, 18, ${0.14 + clamp(t / 1300, 0, 0.34)})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (flight) {
      const trailAlpha = t < 760 ? 1 - t / 900 : t < 1540 ? (t - 760) / 780 : 1 - clamp((t - 1540) / 900, 0, 0.75);
      ctx.globalAlpha = Math.max(0, trailAlpha) * 0.65;
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(player.x - 20, player.y - 92);
      ctx.lineTo(player.x - 115, player.y - 55);
      ctx.stroke();
      ctx.strokeStyle = fx.secondary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(player.x - 28, player.y - 110);
      ctx.lineTo(player.x - 145, player.y - 82);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (t > 1480 && t < 2820) {
      ctx.strokeStyle = "rgba(255, 224, 60, 0.75)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x + 30, player.y - 42, 30 + Math.sin(t / 70) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (t > 2740 && t < 3260) {
      const headX = enemy.x;
      const headY = enemy.y - 136;
      const bite = clamp((t - 2740) / 180, 0, 1);
      ctx.save();
      ctx.translate(headX - 18, headY);
      ctx.fillStyle = "#143d2c";
      ctx.beginPath();
      ctx.moveTo(-34, -26 - bite * 8);
      ctx.lineTo(18, -17);
      ctx.lineTo(2, -2);
      ctx.lineTo(-30, -6);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-32, 27 + bite * 8);
      ctx.lineTo(18, 17);
      ctx.lineTo(2, 2);
      ctx.lineTo(-30, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff4cf";
      for (let tooth = 0; tooth < 5; tooth += 1) {
        const tx = -22 + tooth * 9;
        ctx.beginPath();
        ctx.moveTo(tx, -8);
        ctx.lineTo(tx + 5, 2);
        ctx.lineTo(tx + 9, -8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tx, 8);
        ctx.lineTo(tx + 5, -2);
        ctx.lineTo(tx + 9, 8);
        ctx.fill();
      }
      ctx.restore();
    }

    if (t > 2920 && t < 3500) {
      const fade = 1 - clamp((t - 3160) / 340, 0, 1);
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#f04c3d";
      ctx.beginPath();
      ctx.arc(player.x + 5, player.y - 116, 10 + Math.sin(t / 45) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (t > 1750 && t < 4050) {
      ctx.font = "900 18px Trebuchet MS, Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = fx.secondary;
      ctx.strokeStyle = "#02030a";
      ctx.lineWidth = 5;
      const caption = t < 2820 ? "LEAVING THE ATMOSPHERE" : t < 3300 ? "SKY FEAST" : "IMPACT INCOMING";
      ctx.strokeText(caption, W / 2, 72);
      ctx.fillText(caption, W / 2, 72);
    }
    ctx.restore();
  }

  function drawDragonBornStormBreathFinisher(t, fx, dir) {
    ctx.save();
    const mouthX = player.x + dir * 39;
    const mouthY = player.y - 132;
    const targetX = enemy.x;
    const targetY = enemy.y - 138;
    const charge = clamp(t / 1050, 0, 1);
    const firing = t > 1050 && t < 2380;

    ctx.fillStyle = `rgba(2, 8, 18, ${0.14 + charge * 0.38})`;
    ctx.fillRect(0, 0, W, H);

    if (t < 1180) {
      for (let ring = 0; ring < 4; ring += 1) {
        const radius = 12 + ((t / 7 + ring * 23) % 88);
        ctx.globalAlpha = charge * (1 - radius / 108) * 0.8;
        ctx.strokeStyle = ring % 2 ? fx.secondary : fx.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(mouthX, mouthY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#effaff";
      ctx.beginPath();
      ctx.arc(mouthX, mouthY, 5 + charge * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    if (firing) {
      const fireAge = t - 1050;
      const fade = 1 - clamp((t - 2200) / 180, 0, 1);
      const segments = 12;
      for (let layer = 0; layer < 4; layer += 1) {
        ctx.beginPath();
        ctx.moveTo(mouthX, mouthY);
        for (let i = 1; i < segments; i += 1) {
          const p = i / segments;
          const x = mix(mouthX, targetX, p);
          const jitter = Math.sin(i * 8.7 + fireAge / (35 + layer * 9)) * (24 - layer * 5);
          const y = mix(mouthY, targetY, p) + jitter;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(targetX, targetY);
        ctx.globalAlpha = fade * (0.35 + layer * 0.16);
        ctx.strokeStyle = layer < 2 ? fx.primary : fx.secondary;
        ctx.lineWidth = 16 - layer * 4;
        ctx.lineJoin = "round";
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(mouthX, mouthY, 14 + Math.sin(t / 35) * 3, 0, Math.PI * 2);
      ctx.fill();

      if (t > 1380) {
        const impact = 30 + Math.sin(t / 42) * 10;
        ctx.globalAlpha = fade * 0.82;
        ctx.fillStyle = fx.primary;
        ctx.beginPath();
        ctx.arc(targetX, targetY, impact, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        for (let spoke = 0; spoke < 8; spoke += 1) {
          const angle = spoke * Math.PI / 4 + t / 180;
          ctx.beginPath();
          ctx.moveTo(targetX + Math.cos(angle) * 18, targetY + Math.sin(angle) * 18);
          ctx.lineTo(targetX + Math.cos(angle) * 58, targetY + Math.sin(angle) * 58);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }

    if (t > 520 && t < 2600) {
      ctx.font = "900 18px Trebuchet MS, Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = t < 1050 ? fx.primary : "#ffffff";
      ctx.strokeStyle = "#020711";
      ctx.lineWidth = 5;
      const caption = t < 1050 ? "STORM CHARGE" : "STORM BREATH";
      ctx.strokeText(caption, W / 2, 76);
      ctx.fillText(caption, W / 2, 76);
    }
    ctx.restore();
  }

  function drawBoneHeadSwapFinisher(t, fx, dir) {
    ctx.save();
    if (t > 320 && t < 3100) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.16 + clamp((t - 320) / 520, 0, 0.38)})`;
      ctx.fillRect(0, 0, W, H);
    }

    const skullX = game.finisher?.skullX;
    const skullY = game.finisher?.skullY;
    if (skullX != null && skullY != null && t < 3200) {
      drawMiniHead(skullX, skullY, player.palette, 0.9, { bone: true, rot: Math.sin(t / 90) * 0.9 });
      if (t > 520 && t < 1040) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.38;
        ctx.strokeStyle = fx.primary;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(player.x + dir * 28, FLOOR - 126);
        ctx.lineTo(skullX, skullY);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
    }

    if (game.finisher?.enemyHeadLoose && !game.finisher?.boneWearsEnemyHead) {
      drawMiniHead(game.finisher.enemyHeadX, game.finisher.enemyHeadY, enemy.palette, 0.95, { rot: Math.sin(t / 100) * 0.4 });
    }

    if (game.finisher?.boneWearsEnemyHead) {
      drawMiniHead(player.x, FLOOR - 145, enemy.palette, 1.05, { rot: Math.sin(t / 180) * 0.08 });
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.34 + Math.sin(game.time * 10) * 0.08;
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, FLOOR - 145, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    if (t > 1020 && t < 1560) {
      const p = clamp((t - 1020) / 220, 0, 1);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.72 * (1 - p * 0.45);
      ctx.fillStyle = fx.primary;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 140, 24 + p * 54, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawJennyReplayFinisher(t, fx, dir) {
    ctx.save();
    const lock = clamp((t - 220) / 420, 0, 1);
    ctx.fillStyle = `rgba(2, 4, 8, ${0.22 + lock * 0.38})`;
    ctx.fillRect(0, 0, W, H);

    if (t > 260 && t < 1680) {
      ctx.textAlign = "center";
      ctx.font = "900 46px Trebuchet MS, Arial";
      ctx.lineWidth = 7;
      const flicker = Math.floor(t / 120) % 2;
      for (let i = 0; i < 3; i += 1) {
        const y = 108 + i * 48;
        ctx.strokeStyle = "#020305";
        ctx.fillStyle = i === flicker ? fx.secondary : fx.primary;
        ctx.globalAlpha = 0.88 - i * 0.18;
        ctx.strokeText("03:33 AM", W * 0.5 + Math.sin(game.time * 30 + i) * 5, y);
        ctx.fillText("03:33 AM", W * 0.5 + Math.sin(game.time * 30 + i) * 5, y);
      }
      ctx.globalAlpha = 1;
    }

    if (t > 680 && t < 2750) {
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 9; i += 1) {
        const y = 70 + i * 36 + Math.sin(game.time * 17 + i) * 8;
        ctx.fillStyle = i % 3 === 0 ? "rgba(230, 41, 63, 0.24)" : "rgba(199, 247, 255, 0.18)";
        ctx.fillRect(0, y, W, i % 2 ? 3 : 2);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    for (const ghost of game.finisher.replayGhosts || []) {
      const a = clamp(ghost.life / ghost.maxLife, 0, 1);
      ctx.globalAlpha = a * 0.55;
      ctx.fillStyle = fx.primary;
      ctx.fillRect(ghost.x - 22, ghost.y - 22, 44, 44);
      ctx.fillStyle = "#07101b";
      ctx.fillRect(ghost.x - 11, ghost.y - 8, 7, 7);
      ctx.fillRect(ghost.x + 7, ghost.y - 8, 7, 7);
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(ghost.x - 16, ghost.y + 9, 32, 3);
    }
    ctx.globalAlpha = 1;

    if (game.finisher.replayMaskAlpha > 0) {
      const a = clamp(game.finisher.replayMaskAlpha, 0, 1);
      const x = enemy.x + Math.sin(game.time * 36) * 4;
      const y = enemy.y - 142;
      ctx.globalAlpha = 0.22 + a * 0.72;
      ctx.fillStyle = fx.primary;
      ctx.fillRect(x - 25, y - 24, 50, 42);
      ctx.fillStyle = "#020305";
      ctx.fillRect(x - 14, y - 8, 8, 8);
      ctx.fillRect(x + 7, y - 8, 8, 8);
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(x - 17, y + 10, 34, 4);
      ctx.globalAlpha = 1;
    }

    if (game.finisher.replayEchoAlpha > 0) {
      const a = clamp(game.finisher.replayEchoAlpha, 0, 1);
      const x = enemy.x + Math.sin(game.time * 20) * 3;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.2 + a * 0.62;
      ctx.fillStyle = fx.primary;
      ctx.fillRect(x - 23, enemy.y - 154, 46, 37);
      ctx.fillRect(x - 18, enemy.y - 118, 36, 72);
      ctx.fillRect(x - 38, enemy.y - 108, 18, 58);
      ctx.fillRect(x + 20, enemy.y - 108, 18, 58);
      ctx.fillRect(x - 24, enemy.y - 48, 14, 49);
      ctx.fillRect(x + 10, enemy.y - 48, 14, 49);
      ctx.fillStyle = "#07101b";
      ctx.fillRect(x - 12, enemy.y - 140, 8, 8);
      ctx.fillRect(x + 5, enemy.y - 140, 8, 8);
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(x - 20, enemy.y - 124, 40, 4);
      ctx.globalAlpha = 0.25 + a * 0.35;
      for (let i = 0; i < 8; i += 1) {
        const yy = enemy.y - 156 + i * 19 + Math.sin(game.time * 18 + i) * 3;
        ctx.fillRect(x - 48 + i * 5, yy, 96 - i * 7, 2);
      }
      ctx.restore();
    }

    if (t > 2360 && t < 3400) {
      const p = smoothStep((t - 2360) / 700);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.65 * (1 - p * 0.25);
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 4 + p * 12;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 96, 34 + p * 92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = fx.secondary;
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(enemy.x - 110 + i * 48, enemy.y - 174);
        ctx.lineTo(enemy.x - 64 + i * 38, enemy.y - 22);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    ctx.restore();
  }

  function drawSableRewriteFinisher(t, fx, dir) {
    ctx.save();
    const dim = clamp((t - 180) / 520, 0, 0.62);
    ctx.fillStyle = `rgba(2, 3, 6, ${dim})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    const markTimes = [680, 910, 1140, 1370, 1600, 2020, 2260];
    for (let i = 0; i < markTimes.length; i += 1) {
      const age = t - markTimes[i];
      if (age < -160 || age > 620) continue;
      const a = age < 0 ? clamp((160 + age) / 160, 0, 1) : clamp(1 - age / 620, 0, 1);
      const x = enemy.x + (i - 3) * 12 + Math.sin(i * 2.1) * 24;
      const y = enemy.y - 132 + i * 17;
      ctx.globalAlpha = a;
      ctx.strokeStyle = i % 2 ? fx.primary : fx.secondary;
      ctx.lineWidth = 5 + a * 5;
      ctx.beginPath();
      ctx.moveTo(x - dir * 92, y - 28);
      ctx.lineTo(x + dir * 92, y + 28);
      ctx.stroke();
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(x - 42, y - 5, 84, 4);
    }
    for (const ghost of game.finisher.rewriteGhosts || []) {
      const a = clamp(ghost.life / ghost.maxLife, 0, 1);
      ctx.globalAlpha = a * 0.54;
      ctx.fillStyle = fx.primary;
      ctx.fillRect(ghost.x - 20, ghost.y - 28, 40, 56);
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(ghost.x - 26, ghost.y - 8, 52, 4);
      ctx.fillStyle = "#050308";
      ctx.fillRect(ghost.x - 10, ghost.y - 15, 6, 6);
      ctx.fillRect(ghost.x + 6, ghost.y - 15, 6, 6);
    }
    if (t > 2040 && t < 2860) {
      const p = smoothStep((t - 2040) / 640);
      ctx.globalAlpha = 0.22 + p * 0.42;
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(enemy.x - 52, enemy.y - 156, 104, 120);
      ctx.fillStyle = "#050308";
      ctx.fillRect(enemy.x - 22, enemy.y - 137, 44, 12);
      ctx.fillRect(enemy.x - 28, enemy.y - 84, 56, 8);
    }
    ctx.restore();
  }

  function drawJakeFourthDownFinisher(t, fx, dir) {
    ctx.save();
    if (t > 420 && t < 4100) {
      ctx.fillStyle = `rgba(2, 5, 4, ${0.16 + clamp((t - 420) / 620, 0, 0.38)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = "lighter";
    if (t > 500 && t < 1600) {
      ctx.textAlign = "center";
      ctx.font = "900 30px Trebuchet MS, Arial";
      ctx.fillStyle = fx.secondary;
      ctx.strokeStyle = "#010301";
      ctx.lineWidth = 6;
      ctx.strokeText("BOTTOM OF THE 9TH", W * 0.5, 105);
      ctx.fillText("BOTTOM OF THE 9TH", W * 0.5, 105);
      for (let i = 0; i < 6; i += 1) {
        const x = player.x + dir * (64 + i * 38);
        const y = FLOOR - 100 + Math.sin(game.time * 8 + i) * 6;
        ctx.globalAlpha = 0.25 + (i % 2) * 0.18;
        ctx.fillStyle = i % 2 ? fx.primary : fx.secondary;
        ctx.fillRect(x - 14, y - 36, 28, 36);
        ctx.fillRect(x - 20, y - 16, 40, 12);
        ctx.fillRect(x - 9, y, 8, 40);
        ctx.fillRect(x + 3, y, 8, 40);
      }
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 4;
      for (let x = 80; x < W; x += 88) {
        ctx.beginPath();
        ctx.moveTo(x, FLOOR - 78);
        ctx.lineTo(x + 20, H);
        ctx.stroke();
      }
    }

    if (t > 520 && t < 1680) {
      const swing = t < 1180 ? -0.9 + Math.sin(game.time * 16) * 0.04 : mix(-0.9, 0.72, smoothStep((t - 1180) / 400));
      const bx = player.x + dir * 18;
      const by = player.y - 112;
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.translate(bx, by);
      ctx.scale(dir, 1);
      ctx.rotate(swing);
      ctx.fillStyle = "#2a1710";
      ctx.fillRect(0, -5, 88, 10);
      ctx.fillStyle = "#d7b16a";
      ctx.fillRect(60, -7, 38, 14);
      ctx.fillStyle = "#f4e5b0";
      ctx.fillRect(90, -5, 12, 10);
      ctx.restore();
      if (t % 90 < 24) addHitParticles(player.x + dir * 54, player.y - 110, fx.secondary, 1);
    }

    if (t > 1180 && t < 1880) {
      const p = clamp((t - 1180) / 220, 0, 1);
      ctx.globalAlpha = 0.72 * (1 - p * 0.35);
      ctx.fillStyle = fx.primary;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 96, 20 + p * 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff4cf";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 96, 8 + p * 36, 0, Math.PI * 2);
      ctx.fill();
    }

    if (t > 1560 && t < 2260) {
      const p = clamp((t - 1560) / 700, 0, 1);
      ctx.globalAlpha = 0.62 * (1 - p);
      ctx.strokeStyle = fx.secondary;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 92, 28 + p * 120, -0.8, 0.8);
      ctx.stroke();
    }

    if (game.finisher?.ghostAlpha > 0) {
      const a = clamp(game.finisher.ghostAlpha, 0, 1);
      const gx = game.finisher.ghostX ?? enemy.x;
      const gy = game.finisher.ghostY ?? (enemy.y - 100);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = a * 0.72;
      ctx.fillStyle = fx.primary;
      ctx.beginPath();
      ctx.ellipse(gx, gy, 22, 34, Math.sin(game.time * 3) * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#061018";
      ctx.fillRect(gx - 9, gy - 8, 6, 7);
      ctx.fillRect(gx + 4, gy - 8, 6, 7);
      ctx.globalAlpha = a * 0.38;
      ctx.strokeStyle = fx.secondary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx - 18, gy + 20);
      ctx.quadraticCurveTo(gx, gy + 46 + Math.sin(game.time * 8) * 8, gx + 18, gy + 20);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawControlDubstepFinisher(t, fx, dir) {
    ctx.save();
    ctx.fillStyle = `rgba(2, 2, 6, ${t > 760 && t < 3000 ? 0.34 : 0.12})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    if (t > 620 && t < 2260) {
      const deckX = player.x + dir * 36;
      const deckY = player.y - 92;
      ctx.fillStyle = "#090a10";
      ctx.fillRect(deckX - 46, deckY - 16, 92, 32);
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(deckX - 38, deckY - 10, 76, 6);
      ctx.fillStyle = fx.primary;
      for (let i = 0; i < 5; i += 1) ctx.fillRect(deckX - 33 + i * 16, deckY + 4, 8, 8 + Math.sin(game.time * 14 + i) * 6);
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i += 1) {
        ctx.globalAlpha = 0.32 + i * 0.11;
        ctx.beginPath();
        ctx.arc(deckX, deckY, 28 + i * 22 + Math.sin(game.time * 18) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    for (const note of game.finisher.bassNotes || []) {
      const a = clamp(note.life / note.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.92;
      ctx.translate(note.x, note.y);
      ctx.rotate(note.rot);
      ctx.font = `900 ${note.size}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
      ctx.strokeText(note.symbol, 0, 0);
      ctx.fillStyle = note.color;
      ctx.fillText(note.symbol, 0, 0);
      ctx.restore();
    }
    for (const ring of game.finisher.bassRings || []) {
      const a = clamp(ring.life / ring.maxLife, 0, 1);
      ctx.globalAlpha = a * 0.72;
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 5 + (1 - a) * 14;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 20 + (1 - a) * 190, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (t > 1880 && t < 2960) {
      const p = clamp((t - 1880) / 280, 0, 1);
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = fx.primary;
      for (let i = 0; i < 9; i += 1) {
        const h = 34 + Math.sin(game.time * 30 + i) * 28 + p * 66;
        ctx.fillRect(enemy.x - 108 + i * 27, FLOOR - h, 16, h);
      }
      ctx.globalAlpha = 0.62 * (1 - p * 0.2);
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(0, enemy.y - 96, W, 16 + p * 20);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, enemy.y - 91, W, 4 + p * 8);
    }
    ctx.restore();
  }

  function drawMotherShadowFinisher(t, fx, dir) {
    ctx.save();
    const dim = clamp(t / 900, 0, 0.72);
    ctx.fillStyle = `rgba(0, 0, 0, ${dim})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    const pull = clamp((t - 720) / 1320, 0, 1);
    ctx.globalAlpha = 0.32 + pull * 0.42;
    ctx.fillStyle = fx.secondary;
    ctx.beginPath();
    ctx.ellipse(enemy.x - dir * (24 + pull * 78), FLOOR + 4, 58 + pull * 80, 13 + pull * 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.62;
    ctx.strokeStyle = fx.primary;
    ctx.lineWidth = 4;
    for (let i = 0; i < 7; i += 1) {
      const y = FLOOR - 24 - i * 24;
      ctx.beginPath();
      ctx.moveTo(enemy.x - dir * (80 + i * 10), y + Math.sin(game.time * 7 + i) * 8);
      ctx.lineTo(enemy.x - dir * 12, enemy.y - 82 + Math.cos(game.time * 6 + i) * 12);
      ctx.stroke();
    }
    if (t > 1640 && t < 2840) {
      const p = clamp((t - 1640) / 360, 0, 1);
      ctx.globalAlpha = 0.48 * (1 - p * 0.35);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(0, enemy.y - 116, W, 18 + p * 26);
      ctx.fillStyle = "#050308";
      ctx.fillRect(enemy.x - 54, enemy.y - 150, 108, 122);
    }
    ctx.restore();
  }

  function drawWendigoAntlerFinisher(t, fx, dir) {
    ctx.save();
    if (t > 480 && t < 2700) {
      ctx.fillStyle = `rgba(5, 8, 6, ${0.14 + clamp((t - 480) / 600, 0, 0.34)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = "lighter";
    if (t > 560 && t < 1460) {
      ctx.globalAlpha = 0.38;
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 5;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(player.x - dir * (40 + i * 35), player.y - 150 + i * 8);
        ctx.lineTo(player.x + dir * (44 + i * 16), player.y - 132 - i * 12);
        ctx.stroke();
      }
    }
    if (t > 1320 && t < 2640) {
      const p = clamp((t - 1320) / 300, 0, 1);
      ctx.globalAlpha = 0.68 * (1 - p * 0.25);
      ctx.strokeStyle = "#6b5a48";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(enemy.x - dir * 100, enemy.y - 148);
      ctx.lineTo(enemy.x + dir * (30 + p * 90), enemy.y - 96);
      ctx.moveTo(enemy.x - dir * 88, enemy.y - 112);
      ctx.lineTo(enemy.x + dir * (48 + p * 100), enemy.y - 76);
      ctx.stroke();
      ctx.fillStyle = fx.primary;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 100, 24 + p * 86, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawIceGolemCrushFinisher(t, fx, dir) {
    ctx.save();
    if (t > 420 && t < 3020) {
      ctx.fillStyle = `rgba(190, 245, 255, ${0.08 + clamp((t - 420) / 900, 0, 0.18)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = "lighter";
    if (t > 520 && t < 2060) {
      const freeze = clamp((t - 520) / 820, 0, 1);
      ctx.globalAlpha = 0.28 + freeze * 0.48;
      ctx.fillStyle = fx.primary;
      ctx.fillRect(enemy.x - 44 - freeze * 10, enemy.y - 162 - freeze * 10, 88 + freeze * 20, 136 + freeze * 18);
      ctx.fillStyle = "#f6ffff";
      for (let i = 0; i < 6; i += 1) {
        const x = enemy.x - 54 + i * 22;
        ctx.fillRect(x, enemy.y - 178 + Math.sin(i) * 14, 10, 30 + freeze * 28);
      }
    }
    if (t > 1760 && t < 2940) {
      const p = clamp((t - 1760) / 260, 0, 1);
      ctx.globalAlpha = 0.78 * (1 - p * 0.28);
      ctx.fillStyle = "#f6ffff";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 95, 18 + p * 86, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 4;
      for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * Math.PI * 2 + game.time;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y - 100);
        ctx.lineTo(enemy.x + Math.cos(a) * (40 + p * 125), enemy.y - 100 + Math.sin(a) * (24 + p * 80));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawBigfootStompFinisher(t, fx, dir) {
    ctx.save();
    if (t > 520 && t < 2840) {
      ctx.fillStyle = `rgba(5, 7, 3, ${0.16 + clamp((t - 520) / 720, 0, 0.28)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = "lighter";
    if (t > 720 && t < 2460) {
      ctx.globalAlpha = 0.58;
      ctx.fillStyle = fx.secondary;
      for (let i = 0; i < 9; i += 1) {
        const age = clamp((t - 720 - i * 95) / 420, 0, 1);
        if (age <= 0) continue;
        const x = enemy.x - 180 + i * 45;
        const h = 28 + age * (60 + (i % 3) * 18);
        ctx.fillRect(x - 7, FLOOR - h, 14, h);
        ctx.fillRect(x - 22, FLOOR - h + 20, 44, 9);
      }
    }
    if (t > 1580 && t < 2820) {
      const p = clamp((t - 1580) / 260, 0, 1);
      ctx.globalAlpha = 0.72 * (1 - p * 0.3);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(0, FLOOR - 26 - p * 12, W, 26 + p * 18);
      ctx.fillStyle = "#f4ead8";
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y - 74, 26 + p * 118, 18 + p * 70, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRiftSplitFinisher(t, fx, dir) {
    const portalX = game.finisher?.riftCenterX || enemy.x + dir * 80;
    const portalY = game.finisher?.riftCenterY || enemy.y - 100;
    ctx.save();
    if (t > 420 && t < 3220) {
      ctx.fillStyle = `rgba(2, 1, 8, ${0.16 + clamp((t - 420) / 720, 0, 0.42)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = "lighter";

    if (t > 520 && t < 3300) {
      const open = clamp((t - 520) / 760, 0, 1);
      const close = 1 - clamp((t - 3000) / 360, 0, 1);
      const a = clamp(open * close, 0, 1);
      ctx.save();
      ctx.translate(portalX, portalY);
      ctx.rotate(Math.sin(game.time * 3) * 0.08);
      for (let i = 0; i < 4; i += 1) {
        ctx.globalAlpha = a * (0.24 + i * 0.12);
        ctx.strokeStyle = i % 2 ? fx.secondary : fx.primary;
        ctx.lineWidth = 5 + i * 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 34 + i * 17 + Math.sin(game.time * 9 + i) * 5, 74 + i * 24, Math.sin(game.time * 4 + i) * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = a * 0.62;
      ctx.fillStyle = fx.secondary;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24 + open * 22, 70 + open * 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (t > 980 && t < 2320) {
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 3;
      for (let i = 0; i < 9; i += 1) {
        const y = enemy.y - 146 + i * 18 + Math.sin(game.time * 7 + i) * 7;
        ctx.beginPath();
        ctx.moveTo(enemy.x - dir * (90 + i * 8), y);
        ctx.lineTo(portalX, portalY + (i - 4) * 16);
        ctx.stroke();
      }
    }

    if (t > 2140 && t < 3160) {
      const p = clamp((t - 2140) / 300, 0, 1);
      ctx.globalAlpha = 0.82 * (1 - p * 0.24);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(portalX - 7 - p * 7, portalY - 132 - p * 18, 14 + p * 14, 260 + p * 42);
      ctx.fillStyle = "#fff4ff";
      ctx.fillRect(portalX - 2, portalY - 124, 4, 248);

      ctx.globalAlpha = 0.55 * (1 - p * 0.2);
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(portalX - dir * (24 + p * 70), portalY - 82, 26, 110);
      ctx.fillRect(portalX + dir * (8 + p * 70), portalY - 82, 26, 110);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(portalX - dir * (34 + p * 92), portalY - 110, 18, 36);
      ctx.fillRect(portalX + dir * (24 + p * 92), portalY - 110, 18, 36);
    }
    ctx.restore();
  }

  function drawMaraQaClearFinisher(t, fx, dir) {
    ctx.save();
    if (t > 200 && t < 3400) {
      ctx.fillStyle = `rgba(4, 12, 22, ${0.2 + clamp((t - 200) / 600, 0, 0.4)})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Freeze shell
    if (t > 480 && t < 2600) {
      const a = clamp((t - 480) / 300, 0, 0.55) * clamp(1 - (t - 2300) / 300, 0, 1);
      ctx.globalAlpha = a;
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 3;
      ctx.strokeRect(enemy.x - 42, enemy.y - 138, 84, 142);
      ctx.fillStyle = `rgba(92, 224, 255, ${0.08 + a * 0.12})`;
      ctx.fillRect(enemy.x - 40, enemy.y - 136, 80, 138);
    }
    for (const stamp of game.finisher.qaStamps || []) {
      const a = clamp(stamp.life / stamp.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.92;
      ctx.translate(stamp.x, stamp.y);
      ctx.rotate(stamp.rot || 0);
      ctx.fillStyle = "#e84435";
      ctx.fillRect(-28, -12, 56, 24);
      ctx.strokeStyle = "#fff2bd";
      ctx.lineWidth = 2;
      ctx.strokeRect(-28, -12, 56, 24);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 12px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(stamp.text, 0, 1);
      ctx.restore();
    }
    if (t > 1680 && t < 2400) {
      const p = clamp((t - 1680) / 200, 0, 1);
      ctx.globalAlpha = 0.55 * (1 - p * 0.4);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(enemy.x - 90, enemy.y - 150, 180, 6 + p * 18);
    }
    ctx.restore();
  }

  function drawNoahWontFixFinisher(t, fx, dir) {
    ctx.save();
    if (t > 220 && t < 3300) {
      ctx.fillStyle = `rgba(8, 12, 18, ${0.18 + clamp((t - 220) / 500, 0, 0.36)})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Ticket board
    if (t > 500 && t < 3200) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#1a2430";
      ctx.fillRect(enemy.x - 70, enemy.y - 210, 140, 52);
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 2;
      ctx.strokeRect(enemy.x - 70, enemy.y - 210, 140, 52);
      ctx.fillStyle = "#8de6ff";
      ctx.font = "900 11px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ISSUE TRACKER", enemy.x, enemy.y - 192);
      ctx.fillStyle = "#ff5d86";
      ctx.fillText("STATUS: WON'T FIX", enemy.x, enemy.y - 174);
    }
    for (const tag of game.finisher.ticketTags || []) {
      const a = clamp(tag.life / tag.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.95;
      ctx.translate(tag.x, tag.y);
      ctx.fillStyle = "#243244";
      ctx.fillRect(-30, -10, 60, 20);
      ctx.strokeStyle = fx.primary;
      ctx.strokeRect(-30, -10, 60, 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 10px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tag.text, 0, 1);
      ctx.restore();
    }
    // Clipboard slam
    if (t > 1500 && t < 1900) {
      const p = clamp((t - 1500) / 180, 0, 1);
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#c9d6e2";
      ctx.fillRect(enemy.x - 28 + dir * (1 - p) * 80, enemy.y - 170 + p * 90, 56, 70);
      ctx.fillStyle = "#3d4f63";
      ctx.fillRect(enemy.x - 22 + dir * (1 - p) * 80, enemy.y - 160 + p * 90, 44, 8);
    }
    ctx.restore();
  }

  function drawClaireHollowFrameFinisher(t, fx, dir) {
    ctx.save();
    if (t > 180 && t < 3400) {
      ctx.fillStyle = `rgba(12, 4, 18, ${0.2 + clamp((t - 180) / 500, 0, 0.42)})`;
      ctx.fillRect(0, 0, W, H);
    }
    const wire = game.finisher.wireAlpha || 0;
    if (wire > 0.05 && t < 3200) {
      ctx.globalAlpha = 0.35 + wire * 0.45;
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 2;
      const cx = enemy.x;
      const cy = enemy.y;
      // Wireframe body
      ctx.strokeRect(cx - 22, cy - 120, 44, 52);
      ctx.beginPath();
      ctx.arc(cx, cy - 138, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 68);
      ctx.lineTo(cx - 28, cy - 8);
      ctx.moveTo(cx + 18, cy - 68);
      ctx.lineTo(cx + 28, cy - 8);
      ctx.moveTo(cx - 10, cy - 68);
      ctx.lineTo(cx - 14, cy);
      ctx.moveTo(cx + 10, cy - 68);
      ctx.lineTo(cx + 14, cy);
      ctx.stroke();
      // Peel scanlines
      ctx.globalAlpha = wire * 0.35;
      ctx.fillStyle = fx.secondary;
      for (let i = 0; i < 8; i += 1) {
        ctx.fillRect(cx - 48, cy - 150 + i * 18 + Math.sin(game.time * 10 + i) * 3, 96, 2);
      }
    }
    for (const layer of game.finisher.wireFrames || []) {
      const a = clamp(layer.life / layer.maxLife, 0, 1);
      ctx.globalAlpha = a * 0.7;
      ctx.strokeStyle = fx.primary;
      ctx.strokeRect(layer.x, layer.y, layer.w, layer.h);
    }
    if (t > 1680 && t < 2300) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = fx.primary;
      ctx.fillRect(enemy.x - 70, enemy.y - 160, 140, 4);
    }
    ctx.restore();
  }

  function drawEliDevBuildCrashFinisher(t, fx, dir) {
    ctx.save();
    // Terminal panel
    if (t > 300 && t < 3400) {
      const a = clamp((t - 300) / 280, 0, 0.88);
      ctx.globalAlpha = a;
      ctx.fillStyle = "#0a120e";
      ctx.fillRect(48, 48, W - 96, 168);
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, W - 96, 168);
      ctx.fillStyle = fx.primary;
      ctx.font = "700 12px ui-monospace, Consolas, monospace";
      ctx.textAlign = "left";
      ctx.fillText("> midnight-fist build --release", 64, 70);
    }
    for (const line of game.finisher.crashLines || []) {
      const a = clamp(line.life / line.maxLife, 0, 1);
      ctx.globalAlpha = a * 0.95;
      ctx.fillStyle = line.text.includes("FAILED") || line.text.includes("FATAL") ? "#ff6b6b" : fx.primary;
      ctx.font = "600 13px ui-monospace, Consolas, monospace";
      ctx.textAlign = "left";
      ctx.fillText(line.text, 64, line.y);
    }
    for (const block of game.finisher.codeBlocks || []) {
      const a = clamp(block.life / block.maxLife, 0, 1);
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x, block.y, block.w, block.h);
    }
    if (t > 1680 && t < 2300) {
      const p = clamp((t - 1680) / 180, 0, 1);
      ctx.globalAlpha = 0.55 * (1 - p * 0.3);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(0, enemy.y - 100, W, 8 + p * 20);
    }
    ctx.restore();
  }

  function drawAlexCaseClosedFinisher(t, fx, dir) {
    ctx.save();
    if (t > 260 && t < 3440) {
      ctx.fillStyle = `rgba(5, 5, 8, ${0.18 + clamp((t - 260) / 520, 0, 0.38)})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = "lighter";

    if (t > 500 && t < 3420) {
      const a = clamp((t - 500) / 420, 0, 1) * clamp(1 - (t - 3220) / 360, 0, 1);
      ctx.globalAlpha = a * 0.76;
      ctx.strokeStyle = "#f4ead8";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y - 92, 32, 72, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(enemy.x - 26, enemy.y - 55);
      ctx.lineTo(enemy.x - 70, enemy.y - 28);
      ctx.moveTo(enemy.x + 26, enemy.y - 55);
      ctx.lineTo(enemy.x + 70, enemy.y - 28);
      ctx.moveTo(enemy.x - 18, enemy.y - 32);
      ctx.lineTo(enemy.x - 40, enemy.y + 8);
      ctx.moveTo(enemy.x + 18, enemy.y - 32);
      ctx.lineTo(enemy.x + 40, enemy.y + 8);
      ctx.stroke();
    }

    for (const tag of game.finisher.evidenceTags || []) {
      const a = clamp(tag.life / tag.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.translate(tag.x, tag.y);
      ctx.rotate(Math.sin(game.time * 5 + tag.n) * 0.08);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(-10, -7, 20, 14);
      ctx.fillStyle = "#08080c";
      ctx.fillRect(-6, -3, 12, 3);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 9px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(tag.n), 0, 3);
      ctx.restore();
    }

    if (t > 1760 && t < 2260) {
      const p = clamp((t - 1760) / 160, 0, 1);
      ctx.globalAlpha = 0.75 * (1 - p * 0.45);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.5 * (1 - p);
      ctx.fillStyle = fx.primary;
      ctx.fillRect(enemy.x - 96, enemy.y - 178, 192, 4 + p * 20);
      ctx.fillRect(enemy.x - 96, enemy.y - 28, 192, 4 + p * 20);
    }

    if (t > 2320 && t < 3300) {
      const p = clamp((t - 2320) / 360, 0, 1);
      ctx.globalAlpha = 0.72 * (1 - p * 0.25);
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 5 + p * 5;
      const cuts = [-54, -26, 0, 28, 56];
      for (let i = 0; i < cuts.length; i += 1) {
        const y = enemy.y - 146 + i * 28;
        ctx.beginPath();
        ctx.moveTo(enemy.x - 95, y);
        ctx.lineTo(enemy.x + 95, y + cuts[i] * 0.2);
        ctx.stroke();
      }
      ctx.fillStyle = fx.secondary;
      ctx.fillRect(enemy.x - 74 - p * 40, enemy.y - 134, 148 + p * 80, 9 + p * 8);
      ctx.fillStyle = "#f4ead8";
      ctx.fillRect(enemy.x - 48, enemy.y - 160, 96, 5);
    }
    ctx.restore();
  }

  function drawPowerBlastFinisher(t, fx, dir) {
    ctx.save();
    const charge = clamp(t / 850, 0, 1);
    if (t < 2450) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = fx.primary;
      ctx.beginPath();
      ctx.arc(player.x + dir * 42, player.y - 88, 8 + charge * 22, 0, Math.PI * 2);
      ctx.fill();
      if (t > 850) {
        const volley = Math.max(0, Math.floor((t - 850) / 260));
        for (let i = 0; i < 6; i += 1) {
          const offset = (i - 2.5) * 13;
          const wave = Math.sin(t / 70 + i) * 9;
          ctx.strokeStyle = i % 2 ? fx.secondary : fx.primary;
          ctx.lineWidth = 4 + (i % 3);
          ctx.beginPath();
          ctx.moveTo(player.x + dir * 46, player.y - 88 + offset * 0.35);
          ctx.lineTo(enemy.x - dir * 16, enemy.y - 86 + offset + wave);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 82, 10 + (volley % 4) * 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (t >= 2450 && t < 3400) {
      const blast = clamp((t - 2450) / 320, 0, 1);
      ctx.globalAlpha = 1 - blast * 0.65;
      ctx.fillStyle = fx.primary;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 82, 30 + blast * 170, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y - 82, 14 + blast * 68, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSpaceUppercutFinisher(t, fx) {
    if (t < 1450) {
      ctx.save();
      const trail = clamp((t - 720) / 730, 0, 1);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = fx.primary;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(game.finisher.enemyStartX, FLOOR - 50);
      ctx.lineTo(enemy.x, Math.max(-80, enemy.y - 70));
      ctx.stroke();
      ctx.globalAlpha = trail;
      ctx.fillStyle = "#fff";
      ctx.fillRect(enemy.x - 3, enemy.y - 100, 6, 54);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.fillStyle = "rgba(1, 4, 12, 0.96)";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 110; i += 1) {
      ctx.fillStyle = i % 9 === 0 ? "#9beaff" : "rgba(255,255,255,0.72)";
      ctx.fillRect((i * 83 + 17) % W, (i * 47 + 29) % H, i % 9 === 0 ? 3 : 1, i % 9 === 0 ? 3 : 1);
    }
    ctx.fillStyle = "#143657";
    ctx.beginPath();
    ctx.arc(90, H + 42, 210, Math.PI, Math.PI * 2);
    ctx.fill();
    const victimX = W * 0.58 + Math.sin(t / 320) * 20;
    const victimY = H * 0.46 + Math.cos(t / 280) * 12;
    const suffocation = game.finisher.spaceSuffocation || 0;
    if (!game.finisher.spaceExplosion) {
      ctx.save();
      ctx.translate(victimX, victimY);
      ctx.rotate(Math.sin(t / 240) * 0.35);
      ctx.globalAlpha = 1 - suffocation * 0.35;
      ctx.fillStyle = enemy.palette?.skin || "#d6925d";
      ctx.fillRect(-8, -50, 16, 18);
      ctx.fillStyle = enemy.palette?.trunks || "#345fa8";
      ctx.fillRect(-12, -31, 24, 34);
      ctx.fillStyle = suffocation > 0.45 ? "#8aa0c8" : (enemy.palette?.accent || "#53ecff");
      ctx.fillRect(-18, -28, 6, 32);
      ctx.fillRect(12, -28, 6, 32);
      ctx.fillRect(-11, 3, 7, 30);
      ctx.fillRect(4, 3, 7, 30);
      ctx.restore();
      if (suffocation > 0) {
        ctx.strokeStyle = `rgba(130, 190, 255, ${0.35 + suffocation * 0.45})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(victimX, victimY - 41, 16 + suffocation * 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      const blast = clamp((t - 4300) / 500, 0, 1);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1 - blast * 0.72;
      ctx.fillStyle = fx.primary;
      ctx.beginPath();
      ctx.arc(victimX, victimY, 24 + blast * 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(victimX, victimY, 10 + blast * 52, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFinisherFx() {
    if (game.phase !== "finisher") return;
    const t = game.finisherTime;
    const dir = game.finisher.dir;
    const style = finisherStyle(player.character);
    const family = finisherFamily(style);
    const fx = finisherFx(style, player.palette);

    if (game.finisher?.powerBlast) {
      drawPowerBlastFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.windowUppercut) {
      drawWindowBayUppercutFinisher(t, fx);
      return;
    }
    if (game.finisher?.spaceUppercut) {
      drawSpaceUppercutFinisher(t, fx);
      return;
    }

    if (game.finisher?.tankCannon) {
      ctx.save();
      if (t > 80 && t < 2600) {
        ctx.fillStyle = `rgba(0, 0, 0, ${clamp(t / 700, 0, 0.45)})`;
        ctx.fillRect(0, 0, W, H);
      }
      if (game.finisher.tankX != null && t > 100) {
        drawPixelTank(game.finisher.tankX, FLOOR, dir, fx);
      }
      if (game.finisher.shellX != null && t > 1660 && t < 1920) {
        ctx.fillStyle = "#2f2f2f";
        ctx.beginPath();
        ctx.arc(game.finisher.shellX, enemy.y - 72, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = fx.primary;
        ctx.fillRect(game.finisher.shellX - dir * 12, enemy.y - 74, dir * 14, 4);
      }
      if (t > 1880 && t < 2500) {
        const blast = clamp((t - 1880) / 180, 0, 1);
        ctx.save();
        ctx.globalAlpha = 0.55 * (1 - blast * 0.35);
        ctx.fillStyle = fx.primary;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 78, 24 + blast * 90, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff2c9";
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 78, 10 + blast * 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      return;
    }

    if (game.finisher?.marauderGun) {
      drawMarauderGunFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.kingGroundWave) {
      drawKingGroundWaveFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.spar7anSpear) {
      drawSpar7anSpearFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.lazyController) {
      drawLazyControllerFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.ninjaKatana) {
      drawNinjaKatanaFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.gritAirstrike) {
      drawGritAirstrikeFinisher(t, fx, dir);
      return;
    }
    if (game.finisher?.anthonyNuke) {
      drawAnthonyNukeFinisher(t, fx, dir);
      return;
    }
    if (game.finisher?.plotPulseUfo) {
      drawPlotPulseUfoFinisher(t, fx, dir);
      return;
    }
    if (game.finisher?.dragonSkyFeast) {
      drawDragonSkyFeastFinisher(t, fx, dir);
      return;
    }
    if (game.finisher?.dragonBornStormBreath) {
      drawDragonBornStormBreathFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.boneHeadSwap) {
      drawBoneHeadSwapFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.jennyReplay) {
      drawJennyReplayFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.sableRewrite) {
      drawSableRewriteFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.jakeFourthDown) {
      drawJakeFourthDownFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.controlDubstep) {
      drawControlDubstepFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.motherShadow) {
      drawMotherShadowFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.wendigoAntler) {
      drawWendigoAntlerFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.iceGolemCrush) {
      drawIceGolemCrushFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.bigfootStomp) {
      drawBigfootStompFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.riftSplit) {
      drawRiftSplitFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.alexCaseClosed) {
      drawAlexCaseClosedFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.maraQaClear) {
      drawMaraQaClearFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.noahWontFix) {
      drawNoahWontFixFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.claireHollowFrame) {
      drawClaireHollowFrameFinisher(t, fx, dir);
      return;
    }

    if (game.finisher?.eliDevBuildCrash) {
      drawEliDevBuildCrashFinisher(t, fx, dir);
      return;
    }

    ctx.save();
    if (t > 650 && t < 2600) {
      ctx.fillStyle = `rgba(0, 0, 0, ${clamp((t - 650) / 500, 0, family === "shadow" ? 0.78 : 0.62)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (t > 780 && t < 1760) {
      const cx = enemy.x;
      const cy = enemy.y - 88;
      if (style === "chrome" && game.finisher?.chromeEyes) {
        drawChromeEyeBeam(t, fx, dir);
      } else if (style === "john") {
        drawJohnClawFinisher(t, fx, dir);
      } else if (family === "quake") {
        ctx.fillStyle = fx.primary;
        for (let i = 0; i < 9; i += 1) {
          const x = cx - 180 + i * 44;
          const h = 18 + Math.sin(game.time * 18 + i) * 10;
          ctx.fillRect(x, FLOOR + 4 - h, 28, h);
        }
        ctx.fillStyle = "rgba(255, 86, 63, 0.45)";
        ctx.fillRect(0, FLOOR - 8, W, 12);
      } else if (family === "beam") {
        ctx.fillStyle = "rgba(255, 47, 47, 0.3)";
        ctx.fillRect(0, cy - 14, W, 28);
        ctx.fillStyle = fx.primary;
        ctx.fillRect(0, cy - 4, W, 8);
        ctx.fillStyle = fx.secondary;
        ctx.fillRect(cx - 10, cy - 72, 20, 144);
      } else if (family === "bone") {
        for (let i = 0; i < 12; i += 1) {
          const angle = game.time * 4 + i * 0.55;
          rect(cx + Math.cos(angle) * 78 - 6, cy + Math.sin(angle) * 46 - 4, 12, 8, fx.primary);
          rect(cx + Math.cos(angle) * 60 - 2, cy + Math.sin(angle) * 35 - 10, 4, 20, fx.secondary);
        }
      } else if (family === "flame") {
        for (let i = 0; i < 8; i += 1) {
          const x = cx - 100 + i * 28;
          const flameH = 42 + Math.sin(game.time * 12 + i) * 22;
          ctx.fillStyle = i % 2 ? fx.primary : fx.secondary;
          ctx.beginPath();
          ctx.moveTo(x, FLOOR);
          ctx.lineTo(x + 15, FLOOR - flameH);
          ctx.lineTo(x + 30, FLOOR);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        for (let i = 0; i < 6; i += 1) {
          const offset = (i - 2.5) * 19 + Math.sin(game.time * 20 + i) * 6;
          ctx.strokeStyle = i % 2 ? fx.primary : fx.secondary;
          ctx.lineWidth = family === "shadow" ? 7 : 5;
          ctx.beginPath();
          ctx.moveTo(cx - dir * (family === "rush" ? 170 : 120), cy - 78 + offset);
          ctx.lineTo(cx + dir * (family === "rush" ? 140 : 88), cy + 68 + offset);
          ctx.stroke();
        }
      }
    }
    if (t > 1740 && t < 2500) {
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = fx.primary;
      if (style === "chrome" && game.finisher?.chromeEyes) {
        drawChromeEyeBeam(t, fx, dir);
        const eyes = chromeEyeWorldPoints(player);
        ctx.fillStyle = fx.secondary;
        ctx.beginPath();
        ctx.arc(eyes.left.x, eyes.left.y, 6, 0, Math.PI * 2);
        ctx.arc(eyes.right.x, eyes.right.y, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === "john") {
        drawJohnClawFinisher(t, fx, dir);
      } else if (family === "shadow") {
        ctx.fillRect(player.x - 26, 0, 9, H);
        ctx.fillRect(enemy.x + 22, 0, 9, H);
      } else if (family === "beam") {
        ctx.fillRect(enemy.x - 8, 0, 16, H);
        ctx.fillRect(0, enemy.y - 92, W, 6);
      } else {
        ctx.fillRect(enemy.x - 110, enemy.y - 124, 220, 6);
        ctx.fillRect(enemy.x - 80, enemy.y - 84, 160, 5);
      }
    }
    ctx.restore();
  }

  function drawToast() {
    if (game.toastTime <= 0) return;
    ctx.save();
    ctx.font = "900 28px Trebuchet MS, Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f8dd94";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 5;
    ctx.strokeText(game.toast, W / 2, 126);
    ctx.fillText(game.toast, W / 2, 126);
    ctx.restore();
  }

  function drawFatalityTagline() {
    if (game.phase !== "finisher" && game.phase !== "over") return;
    if (!game.finisher || !game.finisher.tagline) return;
    const t = game.finisherTime || 0;
    const taglineDelay = game.finisher?.tankCannon ? 2620 : 1200;
    if (t < taglineDelay && game.phase === "finisher") return;
    ctx.save();
    ctx.font = "900 30px Trebuchet MS, Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#f8dd94";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 6;
    const text = game.finisher.tagline.toUpperCase();
    ctx.strokeText(text, W / 2, H - 42);
    ctx.fillText(text, W / 2, H - 42);
    ctx.restore();
  }

  function drawRoundText() {
    if (game.phase === "finishPrompt") {
      ctx.save();
      ctx.font = "900 34px Trebuchet MS, Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 6;
      const text = `FINISH WINDOW ${Math.ceil(game.finishTimer)}`;
      ctx.strokeText(text, W / 2, 82);
      ctx.fillText(text, W / 2, 82);
      ctx.restore();
    }
  }

  function applyFinisherSceneCamera() {
    if (game.phase !== "finisher") return false;
    const t = game.finisherTime || 0;
    if (game.finisher?.kingGroundWave) {
      if (t < 420 || t > 1860) return false;
      const zoomIn = smoothStep((t - 420) / 420);
      const zoomOut = 1 - smoothStep((t - 1380) / 480);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.85;
      const focusX = player.x + game.finisher.dir * 6;
      const focusY = player.y - 137;
      ctx.save();
      ctx.translate(W / 2, H * 0.44);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.spar7anSpear) {
      if (t < 700 || t > 1840) return false;
      const zoomIn = smoothStep((t - 700) / 420);
      const zoomOut = 1 - smoothStep((t - 1500) / 340);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.45;
      const focusX = mix(player.x + game.finisher.dir * 80, game.finisher.spearTipX || enemy.x, 0.55);
      const focusY = mix(player.y - 108, game.finisher.spearTipY || enemy.y - 96, 0.5);
      ctx.save();
      ctx.translate(W / 2, H * 0.46);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.lazyController) {
      if (t < 520 || t > 2360) return false;
      const zoomIn = smoothStep((t - 520) / 460);
      const zoomOut = 1 - smoothStep((t - 2060) / 300);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.35;
      const focusX = mix(player.x + game.finisher.dir * 34, enemy.x, clamp((t - 1640) / 520, 0, 1) * 0.45);
      const focusY = mix(FLOOR - 98, enemy.y - 108, clamp((t - 1640) / 520, 0, 1) * 0.5);
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.gritAirstrike) {
      if (t < 760 || t > 1900) return false;
      const zoomIn = smoothStep((t - 760) / 420);
      const zoomOut = 1 - smoothStep((t - 1580) / 320);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.85;
      const focusX = player.x + game.finisher.dir * 18;
      const focusY = player.y - 126;
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.anthonyNuke) {
      if (t < 340 || t > 1320) return false;
      const zoomIn = smoothStep((t - 340) / 360);
      const zoomOut = 1 - smoothStep((t - 1040) / 280);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.7;
      const focusX = player.x + game.finisher.dir * 18;
      const focusY = player.y - 126;
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.jennyReplay) {
      if (t < 520 || t > 1660) return false;
      const zoomIn = smoothStep((t - 520) / 360);
      const zoomOut = 1 - smoothStep((t - 1300) / 300);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.72;
      const focusX = player.x + game.finisher.dir * 8;
      const focusY = player.y - 137;
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.sableRewrite) {
      if (t < 360 || t > 1260) return false;
      const zoomIn = smoothStep((t - 360) / 300);
      const zoomOut = 1 - smoothStep((t - 980) / 280);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.65;
      const focusX = player.x + game.finisher.dir * 8;
      const focusY = player.y - 142;
      ctx.save();
      ctx.translate(W / 2, H * 0.43);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.jakeFourthDown) {
      if (t < 650 || t > 1660) return false;
      const zoomIn = smoothStep((t - 650) / 360);
      const zoomOut = 1 - smoothStep((t - 1360) / 300);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.42;
      const focusX = player.x + game.finisher.dir * 16;
      const focusY = player.y - 126;
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.controlDubstep) {
      if (t < 700 || t > 1900) return false;
      const zoomIn = smoothStep((t - 700) / 380);
      const zoomOut = 1 - smoothStep((t - 1600) / 300);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.56;
      const focusX = player.x + game.finisher.dir * 36;
      const focusY = player.y - 94;
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.motherShadow) {
      if (t < 520 || t > 1660) return false;
      const zoomIn = smoothStep((t - 520) / 360);
      const zoomOut = 1 - smoothStep((t - 1360) / 300);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.55;
      const focusX = mix(player.x + game.finisher.dir * 12, enemy.x - game.finisher.dir * 26, clamp((t - 1000) / 460, 0, 1) * 0.45);
      const focusY = mix(player.y - 136, enemy.y - 110, clamp((t - 1000) / 460, 0, 1) * 0.35);
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.wendigoAntler) {
      if (t < 560 || t > 1420) return false;
      const zoomIn = smoothStep((t - 560) / 300);
      const zoomOut = 1 - smoothStep((t - 1160) / 260);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.45;
      const focusX = mix(player.x + game.finisher.dir * 20, enemy.x, clamp((t - 900) / 360, 0, 1) * 0.65);
      const focusY = mix(player.y - 150, enemy.y - 112, clamp((t - 900) / 360, 0, 1) * 0.55);
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.iceGolemCrush) {
      if (t < 520 || t > 2120) return false;
      const zoomIn = smoothStep((t - 520) / 380);
      const zoomOut = 1 - smoothStep((t - 1820) / 300);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.4;
      const focusX = mix(enemy.x, player.x + game.finisher.dir * 38, clamp((t - 1640) / 360, 0, 1) * 0.35);
      const focusY = mix(enemy.y - 118, player.y - 98, clamp((t - 1640) / 360, 0, 1) * 0.35);
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.bigfootStomp) {
      if (t < 720 || t > 1840) return false;
      const zoomIn = smoothStep((t - 720) / 320);
      const zoomOut = 1 - smoothStep((t - 1540) / 280);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.38;
      const focusX = mix(player.x + game.finisher.dir * 12, enemy.x, clamp((t - 1280) / 360, 0, 1) * 0.5);
      const focusY = mix(player.y - 76, FLOOR - 48, clamp((t - 1280) / 360, 0, 1) * 0.45);
      ctx.save();
      ctx.translate(W / 2, H * 0.47);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.riftSplit) {
      if (t < 620 || t > 2540) return false;
      const zoomIn = smoothStep((t - 620) / 360);
      const zoomOut = 1 - smoothStep((t - 2240) / 300);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.48;
      const portalX = game.finisher.riftCenterX || enemy.x;
      const portalY = game.finisher.riftCenterY || enemy.y - 100;
      const focusX = mix(enemy.x, portalX, clamp((t - 1080) / 820, 0, 1));
      const focusY = mix(enemy.y - 104, portalY, clamp((t - 1080) / 820, 0, 1));
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    if (game.finisher?.alexCaseClosed) {
      if (t < 520 || t > 2140) return false;
      const zoomIn = smoothStep((t - 520) / 360);
      const zoomOut = 1 - smoothStep((t - 1840) / 280);
      const intensity = clamp(zoomIn * zoomOut, 0, 1);
      if (intensity <= 0) return false;
      const zoom = 1 + intensity * 1.48;
      const focusX = mix(player.x + game.finisher.dir * 18, enemy.x, clamp((t - 980) / 640, 0, 1) * 0.45);
      const focusY = mix(player.y - 118, enemy.y - 118, clamp((t - 980) / 640, 0, 1) * 0.4);
      ctx.save();
      ctx.translate(W / 2, H * 0.45);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
      return true;
    }
    return false;
  }

  function drawSplashBackdrop() {
    const base = ctx.createLinearGradient(0, 0, W, H);
    base.addColorStop(0, "#1b070b");
    base.addColorStop(0.48, "#07090d");
    base.addColorStop(1, "#061b27");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    const red = ctx.createRadialGradient(W * 0.24, H * 0.48, 20, W * 0.24, H * 0.48, W * 0.62);
    red.addColorStop(0, "rgba(232, 68, 53, 0.72)");
    red.addColorStop(0.44, "rgba(130, 19, 28, 0.38)");
    red.addColorStop(1, "rgba(130, 19, 28, 0)");
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, W, H);

    const blue = ctx.createRadialGradient(W * 0.76, H * 0.48, 20, W * 0.76, H * 0.48, W * 0.62);
    blue.addColorStop(0, "rgba(32, 140, 178, 0.76)");
    blue.addColorStop(0.45, "rgba(13, 76, 111, 0.38)");
    blue.addColorStop(1, "rgba(13, 76, 111, 0)");
    ctx.fillStyle = blue;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.12);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(-3, -H, 6, H * 2);
    ctx.strokeStyle = "rgba(255, 222, 93, 0.16)";
    ctx.lineWidth = 2;
    for (let y = -H; y <= H; y += 48) {
      ctx.beginPath();
      ctx.moveTo(-42, y);
      ctx.lineTo(36, y + 24);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(141, 230, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  function render() {
    ctx.save();
    if (game.shake > 0) {
      ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
    }
    if (game.phase === "splash") {
      drawSplashBackdrop();
      ctx.restore();
      updateHud();
      return;
    }

    if (game.phase === "select") {
      drawStage();
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      updateHud();
      return;
    }

    const sceneCameraApplied = applyFinisherSceneCamera();
    drawStage();
    // Arena lighting: LUT → vignette → rim (above BG / below fighters)
    drawArenaLightingPre();
    drawArenaGroundShadows();
    drawStains();
    drawAfterImages();
    drawProjectiles();
    const hidePlayerInTank = game.finisher?.tankCannon && game.finisher.playerInTank;
    if (player.x < enemy.x) {
      if (!hidePlayerInTank) drawFighter(player);
      drawFighter(enemy);
    } else {
      drawFighter(enemy);
      if (!hidePlayerInTank) drawFighter(player);
    }
    drawFinisherFx();
    drawLimbs();
    drawGoreChunks();
    drawParticles();
    drawImpactVfx();
    drawJuiceSprites();
    drawBlood();
    drawComboFloats();
    // Arena lighting post: motes → CRT (above fighters/VFX, below HUD)
    drawArenaLightingPost();
    if (sceneCameraApplied) ctx.restore();
    drawFatalityTagline();
    drawRoundText();
    drawToast();
    ctx.restore();

    if (game.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${clamp(game.flash, 0, 0.65)})`;
      ctx.fillRect(0, 0, W, H);
    }

    updateHud();
  }

  function updateHud() {
    ui.playerName.textContent = player.name;
    ui.enemyName.textContent = enemy.name;
    ui.playerHealth.style.width = `${player.health}%`;
    ui.enemyHealth.style.width = `${enemy.health}%`;
    ui.playerMeter.style.width = `${player.meter}%`;
    ui.enemyMeter.style.width = `${enemy.meter}%`;
    ui.playerCombo.textContent = player.combo > 1 ? `${player.combo} hits` : "0 hits";
    ui.enemyCombo.textContent = enemy.combo > 1 ? `${enemy.combo} hits` : "0 hits";
    ui.roundState.textContent = game.phase === "finishPrompt" ? "Finish" : game.phase === "over" ? "Result" : game.phase === "select" ? "Select" : "Round 1";
    ui.timer.textContent = String(game.roundTime).padStart(2, "0");
    syncRosterMatchupForPhase();
    updateRiftalityButton();
  }

  let finisherButtonWasReady = false;

  function updateRiftalityButton() {
    if (!riftalityButton) return;
    const ready = game.phase === "finishPrompt" && enemy.health <= 0;
    riftalityButton.hidden = !ready;
    riftalityButton.classList.toggle("is-ready", ready);
    gameWindow?.classList.toggle("is-finisher-ready", ready);
    if (ready && !finisherButtonWasReady && window.matchMedia?.("(pointer: coarse)")?.matches) {
      try {
        navigator.vibrate?.([70, 45, 110]);
      } catch {
        // Vibration is optional and may be blocked by the browser.
      }
    }
    finisherButtonWasReady = ready;
  }

  function frame(time) {
    const dt = Math.min(34, time - lastTime || 16.67);
    lastTime = time;

    if (game.hitStop > 0) {
      // Cap so a bad juice value can never freeze the sim forever.
      if (game.hitStop > 180) game.hitStop = 180;
      game.hitStop -= dt;
      game.time += dt / 1000;
      // Keep stun/cooldown decaying during hitstop so player isn't soft-locked.
      if (player) {
        if (player.stun > 0) player.stun = Math.max(0, player.stun - dt);
        if (player.cooldown > 0) player.cooldown = Math.max(0, player.cooldown - dt);
      }
      if (enemy) {
        if (enemy.stun > 0) enemy.stun = Math.max(0, enemy.stun - dt);
        if (enemy.cooldown > 0) enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      }
      updateParticles(dt);
      if (game.phase === "finisher" || game.phase === "over") {
        updateLimbs(dt);
        updateGoreChunks(dt);
      }
      render();
      requestAnimationFrame(frame);
      return;
    }

    update(dt);
    // Throttle splash/select canvas redraws — builder uses its own RAF for animations.
    if (game.phase === "splash" || game.phase === "select") {
      menuRenderAccum += dt;
      if (menuRenderAccum >= 70) {
        menuRenderAccum = 0;
        render();
      }
    } else {
      menuRenderAccum = 0;
      render();
    }
    requestAnimationFrame(frame);
  }

  function resumeVisibleSelectScreen() {
    if (window.__midnightFistBootMode) return false;
    if (!selectScreen || selectScreen.hidden) return false;
    syncSelectModeFromDom();
    if (selectMode === "create") {
      customDraft = readBuilderDraft();
      customCharacter = createCustomCharacter(customDraft);
      characterById.set("custom", customCharacter);
      selectedCharacterId = "custom";
      enterSelect();
      return true;
    }
    if (selectMode === "roster") {
      enterSelectRoster();
      return true;
    }
    return false;
  }

  function applyLaunchConfig() {
    const params = new URLSearchParams(window.location.search);
    const config = window.MIDNIGHT_FIST_CONFIG || {};
    const embed = config.embed || params.get("embed") === "1" || document.documentElement.dataset.midnightFistEmbed === "true";
    const fighterId = config.fighter || params.get("fighter");
    const arenaId = config.arena || params.get("arena");

    if (embed) document.body.classList.add("embed-mode");
    if (fighterId && characterById.has(fighterId) && fighterId !== "custom") selectedCharacterId = fighterId;
    if (arenaId && arenaCatalog.some((arena) => arena.id === arenaId)) selectedArenaId = arenaId;
    if (!window.__midnightFistBootMode) {
      if (!applyEditorPreviewBoot(readEditorProject()) && !resumeVisibleSelectScreen()) enterSplash();
    }
  }

  window.applyMidnightFistEditorProject = applyEditorProjectUpdate;

  function dismissStartupScreen() {
    if (startupScreen) startupScreen.hidden = true;
    if (gameWindow) gameWindow.dataset.startup = "ready";
  }

  player = createFighter(true);
  enemy = createFighter(false);
  setupSelectDelegation();
  setupBuilder();
  syncBuilderFromCharacter(selectedCharacterId);
  hideMessage();
  setupVirtualJoystick();
  renderRoster();
  renderRosterPreview();
  renderArenaPicker();
  applyLaunchConfig();
  applyUiLayout();
  if (startupContinueButton) startupContinueButton.addEventListener("click", () => { softAudioUnlock(); dismissStartupScreen(); });
  if (!startupScreen && gameWindow) gameWindow.dataset.startup = "ready";
  for (const asset of arenaAssets.values()) {
    const image = asset?.image;
    if (!image) continue;
    const refreshPicker = () => renderArenaPicker();
    image.addEventListener("load", refreshPicker);
    image.addEventListener("error", refreshPicker);
  }
  updateHud();
  requestAnimationFrame(frame);

  function runMidnightFistBoot(mode) {
    if (mode === "splash") {
      enterSplash();
      return;
    }
    if (mode === "back") {
      backFromSelect();
      return;
    }
    if (mode === "arena") {
      goToArenaStep();
      return;
    }
    if (mode === "start") {
      startOrRestart();
      return;
    }
    if (mode === "builder") {
      selectMode = "create";
      ensureSelectPhase();
      scheduleBuilderUpdate({ full: true });
      return;
    }
    if (mode.startsWith("pick:")) {
      ensureSelectPhase();
      selectCharacter(mode.slice(5));
      return;
    }
    if (mode.startsWith("arena-pick:")) {
      selectArena(mode.slice(11));
      return;
    }
    if (mode === "roster") {
      enterSelectWithLoading("roster");
      return;
    }
    if (mode === "create") {
      enterSelectWithLoading("create");
    }
  }

  let sessionNoticeSeen = Boolean(window.__midnightFistSessionSeen);
  const savedFighterRecords = new Map();
  let activeSavedFighterId = null;

  function storageApi() {
    return window.MidnightFistStorage || null;
  }

  function openStudioTerminal() {
    if (window.MidnightFistTerminal?.open) {
      window.MidnightFistTerminal.open();
      return;
    }
    const terminal = query("#studio-terminal");
    if (terminal) terminal.hidden = false;
  }

  function updateAccountUi() {
    const storage = storageApi();
    const statusEl = query("#account-status");
    const loginBtn = query("#account-login-button");
    const logoutBtn = query("#account-logout-button");
    const builderStorage = query("#builder-storage");
    const saveBtn = query("#builder-save-fighter");
    const deleteBtn = query("#builder-delete-saved");
    const available = storage?.getSession()?.available;
    const loggedIn = storage?.isLoggedIn();

    if (statusEl) {
      if (!storage) statusEl.textContent = "Archive offline";
      else if (available === false) statusEl.textContent = "Archive unavailable — install storage plugin";
      else if (loggedIn) {
        const user = storage.getSession().user || {};
        const role = user.role ? ` · ${user.role}` : "";
        statusEl.textContent = `${user.displayName || user.username}${role} · archive linked`;
      } else statusEl.textContent = "Guest — saves on this device";
    }
    if (loginBtn) loginBtn.hidden = Boolean(loggedIn);
    if (logoutBtn) logoutBtn.hidden = !loggedIn;
    if (builderStorage) builderStorage.classList.toggle("is-disabled", !loggedIn);
    if (saveBtn) saveBtn.disabled = !loggedIn;
    if (deleteBtn) deleteBtn.hidden = !loggedIn || !activeSavedFighterId;
    renderSavedFighterPicker();
  }

  function renderSavedFighterPicker() {
    const select = query("#saved-fighter-load");
    if (!select) return;
    const storage = storageApi();
    const current = activeSavedFighterId || storage?.getActiveFighterId?.() || "";
    const fighters = storage?.isLoggedIn() ? storage.getSession().fighters || [] : [];
    select.innerHTML = `<option value="">Choose saved fighter...</option>${fighters
      .map((entry) => {
        const name = entry.fighter?.name || "Fighter";
        return `<option value="${entry.id}" ${entry.id === current ? "selected" : ""}>${name}</option>`;
      })
      .join("")}`;
    const deleteBtn = query("#builder-delete-saved");
    if (deleteBtn) deleteBtn.hidden = !storage?.isLoggedIn() || !current;
  }

  function syncSavedFightersToRoster() {
    const storage = storageApi();
    for (const id of [...characterById.keys()]) {
      if (id.startsWith("saved-")) characterById.delete(id);
    }
    savedFighterRecords.clear();
    if (!storage?.isLoggedIn()) {
      renderRoster();
      renderSavedFighterPicker();
      return;
    }
    for (const record of storage.getSession().fighters || []) {
      if (!record?.fighter) continue;
      const draft = record.fighter;
      const character = createCustomCharacter(draft);
      character.id = `saved-${record.id}`;
      if (draft.finisher) character.finisher = draft.finisher;
      if (draft.riftalityId) character.riftalityId = draft.riftalityId;
      characterById.set(character.id, character);
      savedFighterRecords.set(record.id, record);
    }
    renderRoster();
    renderSavedFighterPicker();
  }

  function loadSavedFighterIntoBuilder(recordId) {
    const record = savedFighterRecords.get(recordId);
    if (!record?.fighter) return;
    activeSavedFighterId = recordId;
    storageApi()?.setActiveFighterId?.(recordId);
    customDraft = normalizeCustomDraft(record.fighter);
    customCharacter = createCustomCharacter(customDraft);
    if (record.fighter.finisher) customCharacter.finisher = record.fighter.finisher;
    if (record.fighter.riftalityId) customCharacter.riftalityId = record.fighter.riftalityId;
    characterById.set("custom", customCharacter);
    writeDraftToBuilder(customDraft);
    selectedCharacterId = "custom";
    updateCustomFromBuilder(true);
    flashToast(`Loaded ${record.fighter.name}`, 1100);
    updateAccountUi();
  }

  async function saveCurrentFighterToArchive() {
    const storage = storageApi();
    if (!storage?.isLoggedIn()) {
      openStudioTerminal();
      return;
    }
    const draft = readBuilderDraft();
    const built = createCustomCharacter(draft);
    const fighter = sanitizeFighterForTerminalSave({
      ...draft,
      riftalityId: draft.riftalityId || "personal",
      riftalityLocked: true,
      finisher: built.finisher || `${draft.name} Riftality`,
      progression: draft.progression,
      economy: draft.economy,
      customDraft: draft,
    });
    try {
      customDraft = normalizeCustomDraft(fighter);
      writeDraftToBuilder(customDraft);
      storage.setDefaultFighter?.(fighter);
      const events = consumeFighterLedgerEvents();
      const saved = await storage.saveFighter(fighter, activeSavedFighterId || storage.getActiveFighterId(), { events });
      // Server row shape: { id, fighter, warnings }. Local save returns { id, fighter }.
      const row = saved && typeof saved === "object" ? saved : null;
      const authoritativeDraft = row?.fighter && typeof row.fighter === "object" ? row.fighter : null;
      if (authoritativeDraft) {
        customDraft = normalizeCustomDraft(authoritativeDraft);
        writeDraftToBuilder(customDraft);
        saveCustomDraftToDevice(customDraft);
        customCharacter = createCustomCharacter(customDraft);
        characterById.set("custom", customCharacter);
      }
      activeSavedFighterId = row?.id || activeSavedFighterId;
      syncSavedFightersToRoster();
      if (Array.isArray(row?.warnings) && row.warnings.length) {
        flashToast(`Saved · server clamped ${row.warnings.slice(0, 2).join(", ")}`, 1800);
      } else {
        flashToast(`Saved ${fighter.name} as default`, 1400);
      }
    } catch (error) {
      // Restore ledger if save failed so retry still proves spends.
      if (fighter.events?.length) saveFighterLedger([...(loadFighterLedger()), ...fighter.events].slice(-200));
      flashToast(error.message || "Save failed", 1800);
    }
  }

  function setupTerminalAccess() {
    const storage = storageApi();
    const terminal = query("#studio-terminal");
    if (!terminal || !storage) return;
    const codeInput = query("#terminal-code");
    const statusEl = query("#terminal-status");
    const loginBtn = query("#terminal-login");
    const claimBtn = query("#terminal-claim");
    const closeBtn = query("#terminal-close");

    const setStatus = (text) => {
      if (statusEl) statusEl.textContent = text;
    };

    const closeTerminal = () => {
      terminal.hidden = true;
    };

    if (closeBtn) closeBtn.addEventListener("click", closeTerminal);
    if (loginBtn) {
      loginBtn.addEventListener("click", async () => {
        try {
          await storage.loginWithCode(codeInput?.value || "");
          setStatus("Access granted. Your default build is available.");
          closeTerminal();
          updateAccountUi();
          syncSavedFightersToRoster();
          flashToast("Terminal linked", 1000);
        } catch (error) {
          setStatus(error.message || "Access denied.");
        }
      });
    }
    if (claimBtn) {
      claimBtn.addEventListener("click", async () => {
        try {
          const session = await storage.claimAccessCode();
          const code = session?.user?.displayName?.replace(/^Code\s+/i, "") || "";
          if (codeInput) codeInput.value = code;
          setStatus(code ? `Access code claimed: ${code}` : "Access code claimed.");
          updateAccountUi();
          syncSavedFightersToRoster();
          flashToast("Access code claimed", 1200);
        } catch (error) {
          setStatus(error.message || "Could not claim code.");
        }
      });
    }
  }

  async function deleteActiveSavedFighter() {
    const storage = storageApi();
    const id = activeSavedFighterId || storage?.getActiveFighterId();
    if (!storage?.isLoggedIn() || !id) return;
    try {
      await storage.deleteFighter(id);
      activeSavedFighterId = null;
      syncSavedFightersToRoster();
      flashToast("Deleted saved fighter", 1000);
    } catch (error) {
      flashToast(error.message || "Delete failed", 1600);
    }
  }

  function setupCharacterStorage() {
    const storage = storageApi();
    if (!storage) return;

    const loginBtn = query("#account-login-button");
    const logoutBtn = query("#account-logout-button");
    const saveBtn = query("#builder-save-fighter");
    const loadSelect = query("#saved-fighter-load");
    const deleteBtn = query("#builder-delete-saved");
    const clearDataBtn = query("#builder-clear-data");
    const sessionLoginBtn = query("#session-notice-login");

    setupTerminalAccess();
    if (loginBtn) loginBtn.addEventListener("click", openStudioTerminal);
    if (logoutBtn) logoutBtn.addEventListener("click", () => storage.logout().catch(() => {}));
    if (sessionLoginBtn) {
      sessionLoginBtn.addEventListener("click", () => {
        if (sessionNotice) sessionNotice.hidden = true;
        openStudioTerminal();
      });
    }

    if (saveBtn) saveBtn.addEventListener("click", () => saveCurrentFighterToArchive());
    if (loadSelect) {
      loadSelect.addEventListener("change", () => {
        if (!loadSelect.value) return;
        loadSavedFighterIntoBuilder(loadSelect.value);
      });
    }
    if (deleteBtn) deleteBtn.addEventListener("click", () => deleteActiveSavedFighter());
    if (clearDataBtn) {
      clearDataBtn.addEventListener("click", () => {
        if (!window.confirm("Clear all Midnight Fist fighters, progress, preferences, and local login data stored in this browser?")) return;
        try {
          storage.clearAllLocalData?.();
          activeSavedFighterId = null;
          customDraft = normalizeCustomDraft(customDefaultDraft);
          customCharacter = createCustomCharacter(customDraft);
          characterById.set("custom", customCharacter);
          writeDraftToBuilder(customDraft);
          syncSavedFightersToRoster();
          updateAccountUi();
          flashToast("Saved browser data cleared", 1400);
        } catch (error) {
          flashToast(error.message || "Saved data could not be cleared", 1800);
        }
      });
    }

    storage.onChange(() => {
      updateAccountUi();
      syncSavedFightersToRoster();
    });

    activeSavedFighterId = storage.getActiveFighterId?.() || null;
    storage.restoreSession().finally(() => {
      updateAccountUi();
      syncSavedFightersToRoster();
    });
  }

  window.openMidnightFistAccount = openStudioTerminal;

  function resumeVisibleSelectScreen() {
    if (window.__midnightFistBootMode) return false;
    if (!selectScreen || selectScreen.hidden) return false;
    syncSelectModeFromDom();
    if (selectMode === "create") {
      sessionNoticeSeen = Boolean(window.__midnightFistSessionSeen);
      customDraft = readBuilderDraft();
      customCharacter = createCustomCharacter(customDraft);
      characterById.set("custom", customCharacter);
      selectedCharacterId = "custom";
      enterSelect();
      return true;
    }
    if (selectMode === "roster") {
      enterSelectRoster();
      return true;
    }
    return false;
  }

  function applyLaunchConfig() {
    const params = new URLSearchParams(window.location.search);
    const config = window.MIDNIGHT_FIST_CONFIG || {};
    const embed = config.embed || params.get("embed") === "1" || document.documentElement.dataset.midnightFistEmbed === "true";
    const fighterId = config.fighter || params.get("fighter");
    const arenaId = config.arena || params.get("arena");

    if (embed) document.body.classList.add("embed-mode");
    if (fighterId && characterById.has(fighterId) && fighterId !== "custom") selectedCharacterId = fighterId;
    if (arenaId && arenaCatalog.some((arena) => arena.id === arenaId)) selectedArenaId = arenaId;
    if (!window.__midnightFistBootMode) {
      if (!applyEditorPreviewBoot(readEditorProject()) && !resumeVisibleSelectScreen()) enterSplash();
    }
  }

  window.applyMidnightFistEditorProject = applyEditorProjectUpdate;

  player = createFighter(true);
  enemy = createFighter(false);
  setupSelectDelegation();
  setupBuilder();
  syncBuilderFromCharacter(selectedCharacterId);
  hideMessage();
  renderRoster();
  renderRosterPreview();
  renderArenaPicker();
  applyLaunchConfig();
  applyUiLayout();
  setupCharacterStorage();
  setupArenaWalkTest();
  for (const asset of arenaAssets.values()) {
    const image = asset?.image;
    if (!image) continue;
    const refreshPicker = () => renderArenaPicker();
    image.addEventListener("load", refreshPicker);
    image.addEventListener("error", refreshPicker);
  }
  updateHud();
  requestAnimationFrame(frame);

  function runMidnightFistBoot(mode) {
    if (mode === "splash") {
      enterSplash();
      return;
    }
    if (mode === "back") {
      backFromSelect();
      return;
    }
    if (mode === "arena") {
      goToArenaStep();
      return;
    }
    if (mode === "start") {
      startOrRestart();
      return;
    }
    if (mode === "builder") {
      selectMode = "create";
      ensureSelectPhase();
      scheduleBuilderUpdate({ full: true });
      return;
    }
    if (mode.startsWith("pick:")) {
      ensureSelectPhase();
      selectCharacter(mode.slice(5));
      return;
    }
    if (mode.startsWith("arena-pick:")) {
      selectArena(mode.slice(11));
      return;
    }
    if (mode === "roster") {
      enterSelectWithLoading("roster");
      return;
    }
    if (mode === "create") {
      sessionNoticeSeen = Boolean(window.__midnightFistSessionSeen);
      enterSelectWithLoading("create");
    }
  }

  
  window.midnightFistBoot = runMidnightFistBoot;
  window.__ppMflFeelPack = {
    version: "20260911v02",
    bufferMs: 117,
    cancels: "light->heavy|upper|special onHit",
    audio: "wire-if-present",
    vfx: "mfl-impact-vfx-atlas-v02",
    juice: true,
    arenaLighting: true,
    clothingRestore: "20260911",
  };
  window.__ppMflClothingRestore = "20260911";
  window.__ppMflPartCatalog = {
    version: "20260912-shop-unique",
    parts: [
      "gloves-box", "boots-block", "shirt-tee", "shirt-collar", "jacket-open", "shorts-baggy", "visor", "hair-spike",
      "gloves-starter-wraps", "gloves-metro-knuckles", "gloves-titan-gauntlets", "gloves-phantom-wraps", "gloves-bone-grips",
      "boots-starter", "boots-street-runners", "boots-iron-treads", "boots-grave-walkers",
      "core-rift-capacitor", "core-bruiser-plate", "core-tempo-core", "wendigo-head",
    ],
    stockClothingLock: ["shirt-tee", "jacket-open", "shorts-baggy"],
    authoringScale: 2,
    tintMode: "multiply-value-alpha",
    cdnPattern: PART_CDN_BASE + "mfl-part-<id>_<body>[_L|_R].png",
    shopUniqueUpload: "parts-shop-unique/",
  };
  window.__ppMflDebugState = function () {
    return {
      phase: game.phase,
      roundTime: game.roundTime,
      hitStop: game.hitStop,
      shake: game.shake,
      attackBufferMs: attackBufferTime,
      attackBufferType: attackBuffer && attackBuffer.type,
      feelPack: window.__ppMflFeelPack,
      player: player ? { stun: player.stun, cooldown: player.cooldown, action: player.action && player.action.type, hasHit: !!(player.action && player.action.hasHit), health: player.health, name: player.name } : null,
      enemy: enemy ? { stun: enemy.stun, cooldown: enemy.cooldown, action: enemy.action && enemy.action.type, health: enemy.health, name: enemy.name } : null,
      matchStats: game.matchStats,
      canActPlayer: !!(player && canAct(player)),
    };
  };


  const bootQueue = window.__midnightFistBootQueue || [];
  delete window.__midnightFistBootQueue;
  if (window.__midnightFistBootMode) bootQueue.push(window.__midnightFistBootMode);
  delete window.__midnightFistBootMode;
  for (const mode of bootQueue) runMidnightFistBoot(mode);
})();

