document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  const scrollProgress = document.getElementById('scrollProgress');
  const backToTop = document.getElementById('backToTop');

  function updateScrollState() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    header?.classList.toggle('scrolled', window.scrollY > 24);
    backToTop?.classList.toggle('is-visible', window.scrollY > 480);
    scrollProgress?.style.setProperty('--scroll-progress', String(Math.min(progress, 1)));
  }

  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const revealElements = document.querySelectorAll(
    '.section-heading, .about-copy, .about-photo, .service-card, .client-card, .coverage-map, .region-list li, .contact-copy, .contact-form-wrap, .trust-stat, .footer-layout > div'
  );
  revealElements.forEach((element, index) => {
    element.setAttribute('data-reveal', '');
    element.style.setProperty('--reveal-delay', `${(index % 4) * 65}ms`);
  });
  document.documentElement.classList.add('motion-ready');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

    document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));
  } else {
    document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('revealed'));
  }

  const sectionLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const observedSections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function updateCurrentNav() {
    if (!observedSections.length) return;
    const activationLine = window.innerHeight * 0.35;
    let currentSection = observedSections[0];

    observedSections.forEach((section) => {
      if (section.getBoundingClientRect().top <= activationLine) currentSection = section;
    });

    sectionLinks.forEach((link) => {
      const isCurrent = link.hash === `#${currentSection.id}`;
      link.classList.toggle('is-current', isCurrent);
      if (isCurrent) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  let navUpdateScheduled = false;
  function scheduleCurrentNavUpdate() {
    if (navUpdateScheduled) return;
    navUpdateScheduled = true;
    window.requestAnimationFrame(() => {
      updateCurrentNav();
      navUpdateScheduled = false;
    });
  }

  window.addEventListener('scroll', scheduleCurrentNavUpdate, { passive: true });
  window.addEventListener('resize', scheduleCurrentNavUpdate, { passive: true });
  updateCurrentNav();

  function addSwipeNavigation(element, onPrevious, onNext) {
    if (!element) return;
    let touchStart = null;
    element.addEventListener('touchstart', (event) => {
      const touch = event.changedTouches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    element.addEventListener('touchend', (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
        if (deltaX > 0) onPrevious();
        else onNext();
      }
      touchStart = null;
    }, { passive: true });
  }

  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');

  function closeMenu() {
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Open navigation');
    siteNav?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  }

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    siteNav?.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
  });
  siteNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('click', (event) => {
    if (
      menuToggle?.getAttribute('aria-expanded') === 'true' &&
      !siteNav?.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 780) closeMenu();
  }, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      closeLightbox();
    }
  });

  const slides = [...document.querySelectorAll('.hero-slide')];
  const heroDots = document.getElementById('heroDots');
  const heroPlayToggle = document.getElementById('heroPlayToggle');
  const hero = document.querySelector('.hero-slider');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeSlide = 0;
  let heroTimer;
  let heroPaused = reducedMotion.matches;
  let heroMotionOverride = false;
  let heroHovered = false;
  let heroFocused = false;

  function showSlide(index) {
    if (!slides.length) return;
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeSlide;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      heroDots?.children[slideIndex]?.classList.toggle('is-active', active);
      heroDots?.children[slideIndex]?.setAttribute('aria-pressed', String(active));
    });
  }

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `hero-dot${index === 0 ? ' is-active' : ''}`;
    dot.setAttribute('aria-label', `Show slide ${index + 1}`);
    dot.setAttribute('aria-pressed', String(index === 0));
    dot.addEventListener('click', () => {
      showSlide(index);
      syncHeroPlayback();
    });
    heroDots?.appendChild(dot);
  });

  function syncHeroPlayback() {
    window.clearInterval(heroTimer);
    if (!heroPaused && !heroHovered && !heroFocused && (!reducedMotion.matches || heroMotionOverride) && slides.length > 1) {
      heroTimer = window.setInterval(() => showSlide(activeSlide + 1), 5500);
    }
  }

  function updatePlaybackButton() {
    if (!heroPlayToggle) return;
    heroPlayToggle.setAttribute('aria-pressed', String(!heroPaused));
    heroPlayToggle.setAttribute('aria-label', 'Automatic slide rotation');
    heroPlayToggle.innerHTML = heroPaused
      ? '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3v10l8-5z"/></svg>'
      : '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3h2v10H5zM9 3h2v10H9z"/></svg>';
  }

  heroPlayToggle?.addEventListener('click', () => {
    heroPaused = !heroPaused;
    heroMotionOverride = !heroPaused && reducedMotion.matches;
    if (!heroPaused) heroFocused = false;
    updatePlaybackButton();
    syncHeroPlayback();
  });
  hero?.addEventListener('mouseenter', () => {
    heroHovered = true;
    syncHeroPlayback();
  });
  hero?.addEventListener('mouseleave', () => {
    heroHovered = false;
    syncHeroPlayback();
  });
  hero?.addEventListener('focusin', () => {
    heroFocused = true;
    syncHeroPlayback();
  });
  hero?.addEventListener('focusout', () => {
    window.setTimeout(() => {
      heroFocused = hero.contains(document.activeElement);
      syncHeroPlayback();
    });
  });
  hero?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showSlide(activeSlide - 1);
    if (event.key === 'ArrowRight') showSlide(activeSlide + 1);
  });
  addSwipeNavigation(hero, () => showSlide(activeSlide - 1), () => showSlide(activeSlide + 1));
  reducedMotion.addEventListener?.('change', (event) => {
    if (event.matches) {
      heroPaused = true;
      heroMotionOverride = false;
    }
    updatePlaybackButton();
    syncHeroPlayback();
  });
  updatePlaybackButton();
  syncHeroPlayback();

  const filterButtons = [...document.querySelectorAll('.filter-button')];
  const galleryItems = [...document.querySelectorAll('.gallery-item')];
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedFilter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });
      galleryItems.forEach((item) => {
        const shouldShow = selectedFilter === 'all' || item.dataset.category === selectedFilter;
        item.hidden = !shouldShow;
        if (shouldShow) {
          item.classList.remove('is-entering');
          requestAnimationFrame(() => item.classList.add('is-entering'));
        }
      });
    });
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDescription = document.getElementById('lightboxDescription');
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lightboxReturnFocus = null;
  let previousBodyOverflow = '';

  function showLightboxItem(index) {
    if (!lightboxItems.length) return;
    lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    const item = lightboxItems[lightboxIndex];
    const image = item.querySelector('img');
    lightboxImage.width = image.width;
    lightboxImage.height = image.height;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightboxTitle.textContent = item.dataset.title;
    lightboxDescription.textContent = item.dataset.description;
  }

  function openLightbox(item) {
    lightboxItems = galleryItems.filter((galleryItem) => !galleryItem.hidden);
    lightboxIndex = lightboxItems.indexOf(item);
    showLightboxItem(lightboxIndex);
    lightboxReturnFocus = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('lightboxClose').focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = previousBodyOverflow;
    lightboxReturnFocus?.focus();
    lightboxReturnFocus = null;
  }

  galleryItems.forEach((item) => item.addEventListener('click', () => openLightbox(item)));
  document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrevious')?.addEventListener('click', () => showLightboxItem(lightboxIndex - 1));
  document.getElementById('lightboxNext')?.addEventListener('click', () => showLightboxItem(lightboxIndex + 1));
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showLightboxItem(lightboxIndex - 1);
    if (event.key === 'ArrowRight') showLightboxItem(lightboxIndex + 1);
    if (event.key === 'Tab') {
      const focusable = [...lightbox.querySelectorAll('button:not([disabled])')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  addSwipeNavigation(
    lightbox?.querySelector('figure'),
    () => showLightboxItem(lightboxIndex - 1),
    () => showLightboxItem(lightboxIndex + 1)
  );

  const clientTrack = document.getElementById('clientTrack');
  const clientWindow = document.querySelector('.client-window');
  const clientCards = [...document.querySelectorAll('.client-card')];
  const clientDots = document.getElementById('clientDots');
  let clientPage = 0;
  let clientsPerPage = 3;

  function updateClientCarousel() {
    clientsPerPage = window.innerWidth <= 560 ? 1 : window.innerWidth <= 780 ? 2 : 3;
    const pages = Math.ceil(clientCards.length / clientsPerPage);
    clientPage = Math.min(clientPage, pages - 1);
    clientDots.replaceChildren();
    for (let pageIndex = 0; pageIndex < pages; pageIndex += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `carousel-dot${pageIndex === clientPage ? ' is-active' : ''}`;
      dot.setAttribute('aria-label', `Show client group ${pageIndex + 1}`);
      dot.setAttribute('aria-pressed', String(pageIndex === clientPage));
      dot.addEventListener('click', () => moveClientCarousel(pageIndex));
      clientDots.appendChild(dot);
    }
    moveClientCarousel(clientPage);
  }

  function moveClientCarousel(pageIndex) {
    const pages = Math.ceil(clientCards.length / clientsPerPage);
    clientPage = (pageIndex + pages) % pages;
    const card = clientCards[0];
    const gap = Number.parseFloat(window.getComputedStyle(clientTrack).gap) || 0;
    const offset = clientPage * clientsPerPage * (card.getBoundingClientRect().width + gap);
    clientTrack.style.transform = `translateX(-${offset}px)`;
    [...clientDots.children].forEach((dot, index) => {
      dot.classList.toggle('is-active', index === clientPage);
      dot.setAttribute('aria-pressed', String(index === clientPage));
    });
  }

  document.getElementById('clientsPrevious')?.addEventListener('click', () => moveClientCarousel(clientPage - 1));
  document.getElementById('clientsNext')?.addEventListener('click', () => moveClientCarousel(clientPage + 1));
  addSwipeNavigation(clientWindow, () => moveClientCarousel(clientPage - 1), () => moveClientCarousel(clientPage + 1));
  window.addEventListener('resize', updateClientCarousel, { passive: true });
  updateClientCarousel();

  const consultationForm = document.getElementById('consultationForm');
  consultationForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    window.submitInquiryForm(consultationForm);
  });
});
