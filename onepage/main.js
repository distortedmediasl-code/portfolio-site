(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal blocks as they scroll into view.
  if ('IntersectionObserver' in window && !reduce) {
    root.classList.add('js');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.project, .reels, .films, .grid3d, .exp').forEach((el) => io.observe(el));
  }

  // Lightbox for any image tile.
  const box = document.querySelector('.lightbox');
  const boxImg = box.querySelector('img');
  document.querySelectorAll('.shot').forEach((btn) => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      boxImg.src = btn.dataset.full || img.src;
      boxImg.alt = img.alt;
      box.showModal();
    });
  });
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  box.addEventListener('close', () => { boxImg.removeAttribute('src'); });

  // Reels: hover to play on desktop, tap to toggle on touch.
  const canHover = matchMedia('(hover: hover)').matches;
  document.querySelectorAll('.reel').forEach((fig) => {
    const v = fig.querySelector('video');
    v.muted = true;
    const play = () => v.play().catch(() => {});
    if (canHover) {
      fig.addEventListener('mouseenter', play);
      fig.addEventListener('mouseleave', () => v.pause());
    }
    fig.addEventListener('click', () => (v.paused ? play() : v.pause()));
  });
})();
