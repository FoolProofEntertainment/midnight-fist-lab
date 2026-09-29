(function () {
      var GAME = "https:\/\/plot-pulse.com\/wp-content\/uploads\/2026\/09\/midnight-fist-game-19-costumes-gear-cosmetics.js?v=2026-09-29T00%3A16%3A38%2B00%3A00";
      function patch(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (typeof obj.game === 'string' && /midnight-fist-game-/.test(obj.game)) obj.game = GAME;
        if (obj.assets && typeof obj.assets.game === 'string') obj.assets.game = GAME;
      }
      try {
        patch(window.MIDNIGHT_FIST_MANIFEST);
        patch(window.MIDNIGHT_FIST_BOOT);
        patch(window.PP_MIDNIGHT_FIST);
      } catch (e) {}
      var current = window.MIDNIGHT_FIST_MANIFEST;
      try {
        Object.defineProperty(window, 'MIDNIGHT_FIST_MANIFEST', {
          configurable: true,
          enumerable: true,
          get: function () { return current; },
          set: function (v) { current = v; patch(current); }
        });
      } catch (e) {}
      if (current) patch(current);
    })();
