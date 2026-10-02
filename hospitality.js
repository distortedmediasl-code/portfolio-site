const viewer = document.querySelector('#image-viewer');
const expandedImage = viewer.querySelector('img');
document.querySelectorAll('[data-full]').forEach(button => {
  button.addEventListener('click', () => {
    expandedImage.src = button.dataset.full;
    expandedImage.alt = button.querySelector('img').alt;
    viewer.showModal();
    viewer.scrollTop = 0;
  });
});
viewer.querySelector('button').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
const videos = [...document.querySelectorAll('video')];
const loops = [...document.querySelectorAll('.mario-loop')];
function updateSoundButton(video) {
  const button = video.parentElement.querySelector('.sound-toggle');
  if (!button) return;
  const audible = !video.muted && video.volume > 0;
  button.textContent = audible ? 'Sound on' : 'Sound off';
  button.setAttribute('aria-pressed', String(audible));
  button.setAttribute('aria-label', `Turn sound ${audible ? 'off' : 'on'} for Mario video ${loops.indexOf(video) + 1}`);
}
videos.forEach(video => {
  video.addEventListener('volumechange', () => {
    if (!video.muted && video.volume > 0) {
      videos.forEach(other => { if (other !== video) other.muted = true; });
    }
    updateSoundButton(video);
  });
});
loops.forEach(video => {
  video.muted = true;
  video.parentElement.querySelector('.sound-toggle').addEventListener('click', () => {
    const enableSound = video.muted || video.volume === 0;
    if (enableSound) {
      videos.forEach(other => { if (other !== video) other.muted = true; });
      video.volume = 1;
    }
    video.muted = !enableSound;
    updateSoundButton(video);
    if (video.paused) video.play().catch(() => {});
  });
  // Native controls remain available if the browser blocks autoplay.
  video.play().catch(() => {});
});
