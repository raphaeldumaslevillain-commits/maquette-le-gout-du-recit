const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');

if (menu && navigation) {
  menu.hidden = false;
  const setExpanded = (open) => menu.setAttribute('aria-expanded', String(open));
  menu.addEventListener('click', () => setExpanded(menu.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setExpanded(false);
      menu.focus();
    }
  });
}

const prologue = document.querySelector('[data-prologue]');

if (prologue) {
  const video = prologue.querySelector('video');
  const stage = prologue.querySelector('.prologue-stage');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const playbackShare = 0.76;
  let progress = 0;
  let frameRequest = 0;
  let failed = Boolean(video.error) || !video.canPlayType('video/mp4');

  function seekToScrollPosition() {
    if (failed || motion.matches || video.seeking || !Number.isFinite(video.duration)) return;

    const end = Math.max(0, video.duration - 0.035);
    const requestedTime = progress * end;
    if (Math.abs(video.currentTime - requestedTime) > 0.021) {
      video.currentTime = requestedTime;
      return;
    }

    const hasFrame = progress > 0 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    prologue.classList.toggle('has-frame', hasFrame);
    prologue.classList.toggle('is-complete', hasFrame && progress >= 0.99 && video.currentTime >= end - 0.05);
  }

  function syncScroll() {
    frameRequest = 0;
    const pinnedTop = Number.parseFloat(getComputedStyle(stage).top);
    const travelled = pinnedTop - prologue.getBoundingClientRect().top;

    if (failed || motion.matches) {
      prologue.classList.toggle('is-complete', travelled > 0);
      return;
    }

    const distance = (prologue.clientHeight - stage.offsetHeight) * playbackShare;
    if (distance <= 0) return;

    progress = Math.max(0, Math.min(1, travelled / distance));
    if (progress <= 0.003) {
      progress = 0;
      prologue.classList.remove('has-frame', 'is-complete');
    }
    seekToScrollPosition();
  }

  function scheduleSync() {
    if (!frameRequest) frameRequest = requestAnimationFrame(syncScroll);
  }

  function applyMotionPreference() {
    const allowScroll = !failed && !motion.matches;
    prologue.classList.toggle('is-scrollable', allowScroll);
    prologue.classList.remove('is-complete');
    if (!allowScroll) prologue.classList.remove('has-frame');
    scheduleSync();
  }

  video.addEventListener('loadedmetadata', scheduleSync);
  video.addEventListener('loadeddata', scheduleSync);
  video.addEventListener('seeked', seekToScrollPosition);
  video.addEventListener('error', () => {
    failed = true;
    applyMotionPreference();
  });
  window.addEventListener('scroll', scheduleSync, {passive: true});
  window.addEventListener('resize', scheduleSync, {passive: true});
  motion.addEventListener('change', applyMotionPreference);
  applyMotionPreference();
}
