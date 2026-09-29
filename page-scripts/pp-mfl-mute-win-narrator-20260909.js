/* Kill inconsistent TTS win / Riftality narrator (speechSynthesis announceWin). */
(function () {
  function mute() {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        // Block future speak calls from this page
        var noopSpeak = function () {};
        try {
          window.speechSynthesis.speak = noopSpeak;
        } catch (e) {}
      }
    } catch (e) {}
    var audio = window.MidnightFistAudio;
    if (audio && typeof audio.announceWin === "function") {
      audio.announceWin = function () {};
      return true;
    }
    return false;
  }
  if (!mute()) {
    document.addEventListener("DOMContentLoaded", mute, { once: true });
    setTimeout(mute, 0);
    setTimeout(mute, 100);
    setTimeout(mute, 500);
    setTimeout(mute, 1500);
    setTimeout(mute, 4000);
  }
  // Re-stub if audio module loads late
  var n = 0;
  var t = setInterval(function () {
    mute();
    if (++n > 40) clearInterval(t);
  }, 250);
})();
