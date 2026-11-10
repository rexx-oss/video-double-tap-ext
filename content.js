(function () {
  let seekSeconds = 10;

  // Load configured seek interval
  const storage = chrome.storage.sync || chrome.storage.local;
  storage.get({ seekSeconds: 10 }, (res) => {
    if (res && res.seekSeconds) {
      seekSeconds = parseInt(res.seekSeconds, 10);
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.seekSeconds) {
      seekSeconds = parseInt(changes.seekSeconds.newValue, 10);
    }
  });

  // Track touch state
  let touchStartData = null;
  let lastTap = { time: 0, x: 0, y: 0 };

  // Finds any visible <video> element occupying the given screen coordinates
  function findVideoAtPoint(x, y) {
    const videos = Array.from(document.querySelectorAll('video'));
    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom &&
        rect.width > 60 &&
        rect.height > 60 &&
        window.getComputedStyle(video).visibility !== 'hidden' &&
        window.getComputedStyle(video).display !== 'none'
      ) {
        return { video, rect };
      }
    }
    return null;
  }

  // Display the iOS-style circular seek indicator
  function showSeekOverlay(rect, isLeft, seconds) {
    const overlay = document.createElement('div');
    overlay.className = `vdt-overlay ${isLeft ? 'vdt-left' : 'vdt-right'}`;

    // Position overlay over the tapped half of the video
    overlay.style.top = `${rect.top}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.width = `${rect.width / 2}px`;
    overlay.style.left = isLeft ? `${rect.left}px` : `${rect.left + rect.width / 2}px`;

    const icon = document.createElement('div');
    icon.className = 'vdt-bubble';
    icon.innerHTML = `
      <span class="vdt-arrow">${isLeft ? '◀◀' : '▶▶'}</span>
      <span class="vdt-text">${seconds}s</span>
    `;

    overlay.appendChild(icon);
    document.body.appendChild(overlay);

    overlay.addEventListener('animationend', () => overlay.remove());
    setTimeout(() => { if (overlay.isConnected) overlay.remove(); }, 650);
  }

  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartData = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now()
        };
      }
    },
    { capture: true, passive: true }
  );

  window.addEventListener(
    'touchend',
    (e) => {
      if (!touchStartData) return;

      const touch = e.changedTouches[0];
      const distX = Math.abs(touch.clientX - touchStartData.x);
      const distY = Math.abs(touch.clientY - touchStartData.y);
      const duration = Date.now() - touchStartData.time;

      // Ensure the gesture was a quick tap, not a drag or scroll
      if (distX < 20 && distY < 20 && duration < 300) {
        const now = Date.now();
        const timeDiff = now - lastTap.time;
        const tapDistance = Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y);

        if (timeDiff < 350 && tapDistance < 50) {
          // Double-tap detected
          const target = findVideoAtPoint(touch.clientX, touch.clientY);
          if (target) {
            const { video, rect } = target;
            const isLeft = (touch.clientX - rect.left) < (rect.width / 2);
            const delta = isLeft ? -seekSeconds : seekSeconds;

            const durationCap = Number.isFinite(video.duration) ? video.duration : Infinity;
            video.currentTime = Math.max(0, Math.min(durationCap, video.currentTime + delta));

            showSeekOverlay(rect, isLeft, seekSeconds);

            // Reset tap state so a 3rd tap doesn't immediately re-seek
            lastTap = { time: 0, x: 0, y: 0 };
            return;
          }
        }

        lastTap = { time: now, x: touch.clientX, y: touch.clientY };
      }
    },
    { capture: true, passive: true }
  );
})();