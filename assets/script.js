document.addEventListener('DOMContentLoaded', () => {
  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Scroll reveal via IntersectionObserver
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));

  // Scroll-to-top visibility and behavior
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const toggleScrollBtn = () => {
    if (!scrollTopBtn) return;
    if (window.scrollY > 300) {
      scrollTopBtn.classList.remove('hidden');
    } else {
      scrollTopBtn.classList.add('hidden');
    }
  };
  window.addEventListener('scroll', toggleScrollBtn, { passive: true });
  toggleScrollBtn();
  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Carousel setup
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsContainer = document.getElementById('dots');

  if (track) {
    const imageIds = [
      101, 102, 103, 104, 105,
      106, 107, 108, 109, 110,
      111, 112, 113, 114, 115,
      116, 117, 118, 119, 120,
      121, 122, 123, 124, 125
    ];
    const images = imageIds.map((id) => `https://picsum.photos/id/${id}/1200/800`);

    const isMarquee = track.classList.contains('marquee');

    // Build slides
    const createSlide = (src, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = isMarquee ? 'carousel-slide' : 'min-w-full';
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Gallery image ${idx + 1}`;
      img.draggable = false;
      wrapper.appendChild(img);
      return wrapper;
    };

    images.forEach((src, idx) => track.appendChild(createSlide(src, idx)));
    if (isMarquee) {
      // Duplicate the list to enable seamless loop
      images.forEach((src, idx) => track.appendChild(createSlide(src, idx + images.length)));
    }

    if (!isMarquee && dotsContainer) {
      const dots = images.map((_, idx) => {
        const b = document.createElement('button');
        b.className = 'h-2.5 w-2.5 rounded-full bg-white/30 hover:bg-white/60 transition border border-white/20';
        b.setAttribute('aria-label', `Go to slide ${idx + 1}`);
        b.addEventListener('click', () => goTo(idx));
        dotsContainer.appendChild(b);
        return b;
      });
    }

    // If marquee mode, we skip manual carousel logic
    const isMarqueeMode = isMarquee;
    if (isMarqueeMode) {
      // JS-driven infinite marquee (auto by default; arrows/wheel temporarily control)
      const wrapper = document.getElementById('carousel');
      const prev = document.getElementById('prevBtn');
      const next = document.getElementById('nextBtn');

      let baseSpeed = 240; // px/s normal
      let boostedSpeed = 480; // px/s on arrow hover
      let speed = baseSpeed;
      let direction = 1; // 1 => left, -1 => right
      let manualUntilTs = 0;
      let isArrowHovering = false;

      let copyWidth = track.scrollWidth / 2;
      let position = 0; // translateX position in px, range: (-copyWidth, 0]

      const recalc = () => {
        copyWidth = track.scrollWidth / 2;
      };
      window.addEventListener('resize', recalc);
      // Also recalc after images load (if any were not cached)
      setTimeout(recalc, 300);

      const clampPosition = () => {
        // Keep position within [-copyWidth, 0)
        if (position <= -copyWidth) position += copyWidth;
        if (position > 0) position -= copyWidth;
      };

      let last = performance.now();
      const step = (now) => {
        const dt = (now - last) / 1000;
        last = now;

        // If manual control expired and no arrow hover, restore base speed
        if (!isArrowHovering && Date.now() > manualUntilTs) {
          speed = baseSpeed;
        }

        // Update position
        position -= direction * speed * dt;
        clampPosition();
        track.style.transform = `translateX(${position}px)`;

        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);

      // Wheel control when hovering the showcase area
      if (wrapper) {
        wrapper.addEventListener('wheel', (e) => {
          if (e.ctrlKey) return; // keep zoom behavior
          e.preventDefault();
          const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
          if (delta === 0) return;
          direction = delta > 0 ? 1 : -1;
          // transient boost based on wheel intensity
          const intensity = Math.min(600, baseSpeed + Math.abs(delta) * 1.5 + 120);
          speed = Math.max(baseSpeed, intensity);
          manualUntilTs = Date.now() + 900; // 0.9s after last wheel
        }, { passive: false });
      }

      // Arrow hover control: set direction and boost speed while hovering
      prev?.addEventListener('mouseenter', () => { isArrowHovering = true; direction = -1; speed = boostedSpeed; });
      prev?.addEventListener('mouseleave', () => { isArrowHovering = false; if (Date.now() > manualUntilTs) speed = baseSpeed; });
      next?.addEventListener('mouseenter', () => { isArrowHovering = true; direction = 1; speed = boostedSpeed; });
      next?.addEventListener('mouseleave', () => { isArrowHovering = false; if (Date.now() > manualUntilTs) speed = baseSpeed; });

      return; // End early in marquee mode
    }

    let currentIndex = 0;
    let autoplayTimer = null;

    const update = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      const dotEls = dotsContainer ? Array.from(dotsContainer.children) : [];
      dotEls.forEach((d, i) => {
        d.style.backgroundColor = i === currentIndex ? 'rgba(255,255,255,0.9)' : '';
        d.style.opacity = i === currentIndex ? '1' : '0.7';
        d.style.transform = i === currentIndex ? 'scale(1.2)' : 'scale(1)';
      });
    };

    const goTo = (index) => {
      if (index < 0) index = images.length - 1;
      if (index >= images.length) index = 0;
      currentIndex = index;
      update();
    };

    const next = () => goTo(currentIndex + 1);
    const prev = () => goTo(currentIndex - 1);

    nextBtn?.addEventListener('click', next);
    prevBtn?.addEventListener('click', prev);

    // Autoplay with hover pause
    const startAutoplay = () => {
      stopAutoplay();
      autoplayTimer = setInterval(next, 4000);
    };
    const stopAutoplay = () => {
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = null;
    };

    const carouselWrapper = document.getElementById('carousel');
    carouselWrapper?.addEventListener('mouseenter', stopAutoplay);
    carouselWrapper?.addEventListener('mouseleave', startAutoplay);

    // Keyboard accessibility
    carouselWrapper?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });
    carouselWrapper?.setAttribute('tabindex', '0');

    // Init
    update();
    startAutoplay();

    // Adjust on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoplay(); else startAutoplay();
    });
    window.addEventListener('blur', stopAutoplay);
    window.addEventListener('focus', startAutoplay);
  }

  // Accelerate mouse wheel scrolling for the main page only
  const findScrollableAncestor = (element) => {
    let current = element;
    while (current && current !== document.body && current !== document.documentElement) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const isScrollableY = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
      if (isScrollableY) return current;
      current = current.parentElement;
    }
    return null;
  };

  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (isFinePointer) {
    document.addEventListener('wheel', (event) => {
      // Keep native behavior for ctrl (zoom), shift (horizontal), or inside scrollable containers
      if (event.defaultPrevented || event.ctrlKey || event.shiftKey) return;
      const scrollableAncestor = findScrollableAncestor(event.target);
      if (scrollableAncestor) return; // allow native scroll in inner containers

      const speedMultiplier = 1.6; // Increase page scroll speed ~60%
      const deltaY = event.deltaY * speedMultiplier;
      if (deltaY === 0) return;

      event.preventDefault();
      window.scrollBy({ top: deltaY, left: 0, behavior: 'auto' });
    }, { passive: false });
  }
});


