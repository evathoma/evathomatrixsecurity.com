/**
 * ============================================================
 * EVATHO MATRIX SECURITY TANZANIA - CORE CLIENT SCRIPT
 * Motion, Interactions, Dynamic Filtering, & Form Submissions
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Header & Topbar collapse on Scroll
  const header = document.querySelector('.header');
  const navMenu = document.getElementById('navMenu');
  const SCROLL_THRESHOLD = 40;

  const updateNavDrawerTop = () => {
    if (navMenu && header) {
      navMenu.style.top = header.offsetHeight + 'px';
    }
  };

  const handleScroll = () => {
    if (!header) return;
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    updateNavDrawerTop();
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', updateNavDrawerTop, { passive: true });
  handleScroll();

  // 2. Mobile Navigation Toggle & Accessibility
  const navToggle = document.getElementById('navToggle');

  if (navToggle && navMenu) {
    const toggleMenu = (isOpen) => {
      const expanded = typeof isOpen === 'boolean' ? isOpen : !navMenu.classList.contains('active');
      navMenu.classList.toggle('active', expanded);
      navToggle.setAttribute('aria-expanded', String(expanded));
      // Lock body scroll when drawer is open
      document.body.classList.toggle('nav-open', expanded);
      // Sync drawer top with current header height
      if (expanded) updateNavDrawerTop();

      // Morph burger → X icon
      const iconPath = navToggle.querySelector('path');
      if (iconPath) {
        iconPath.setAttribute('d', expanded ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16');
      }
    };

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close when clicking nav links (except drawer extras)
    navMenu.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Drawer CTA buttons also close the menu
    navMenu.querySelectorAll('.drawer-cta-btn, .drawer-phone-btn').forEach((btn) => {
      btn.addEventListener('click', () => toggleMenu(false));
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        toggleMenu(false);
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (
        navMenu.classList.contains('active') &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        toggleMenu(false);
      }
    });
  }

  // 3. Scroll Reveal Animations (IntersectionObserver)
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback if IntersectionObserver not supported
    revealElements.forEach((el) => el.classList.add('revealed'));
  }

  // 4. Interactive Services Filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  if (filterBtns.length > 0 && serviceCards.length > 0) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Active button state
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.getAttribute('data-filter');

        serviceCards.forEach((card) => {
          const cardCategory = card.getAttribute('data-category');
          if (category === 'all' || cardCategory === category) {
            card.style.display = 'flex';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, 50);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(15px)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 250);
          }
        });
      });
    });
  }

  // 5. Pre-select Service in Consultation Form from Card Link
  const serviceActionLinks = document.querySelectorAll('.service-action-link[data-service]');
  const serviceSelect = document.getElementById('serviceSelect');

  serviceActionLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const serviceValue = link.getAttribute('data-service');
      if (serviceSelect && serviceValue) {
        serviceSelect.value = serviceValue;
      }
    });
  });

  // 6. Security Consultation / Contact Form Handler
  const consultationForm = document.getElementById('consultationForm');
  consultationForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    window.submitInquiryForm(consultationForm);
  });

  // 7. 50/50 Split Hero Showcase Component (8-Service Continuous Loop, 3s Timer, Ken Burns Zoom)
  initHeroShowcase();
});

/**
 * ============================================================
 * 8. 50/50 SPLIT HERO SHOWCASE CONTROLLER
 * Professional defense-grade showcase: 8 photo lines on image side,
 * Ken Burns continuous zoom effect, hover pause, & service info card
 * ============================================================
 */
function initHeroShowcase() {
  const showcase = document.getElementById('home');
  if (!showcase) return;

  const slides = showcase.querySelectorAll('.hero-slide');
  if (!slides || slides.length === 0) return;

  const linesContainer = document.getElementById('photoLinesContainer');
  const serviceCategory = document.getElementById('photoServiceCategory');
  const serviceTitle = document.getElementById('photoServiceTitle');
  const serviceDesc = document.getElementById('photoServiceDesc');
  const serviceAction = document.getElementById('photoServiceAction');
  const prevBtn = document.getElementById('photoPrevBtn');
  const nextBtn = document.getElementById('photoNextBtn');

  const DURATION = 3000; // 3 seconds per service (synced with CSS kenBurnsZoom)
  let currentIndex = 0;
  let isPaused = false;
  let startTime = null;
  let elapsedBeforePause = 0;
  let rafId = null;

  const servicesData = [
    {
      label: 'Manned Guarding',
      title: 'Manned Guarding',
      category: 'Static Guarding',
      desc: 'Vetted, disciplined security personnel stationed at commercial offices, gated residences, warehouses, and industrial plants across Dar es Salaam and Tanzania.'
    },
    {
      label: 'Armed Guarding',
      title: 'Armed Guarding',
      category: 'Tactical Security',
      desc: 'Specialized armed security officers equipped with authorized firearms for financial institutions, mining depots, bullion facilities, and diplomatic properties.'
    },
    {
      label: 'Cash in Transit',
      title: 'Cash in Transit (CIT)',
      category: 'Armored Logistics',
      desc: 'Secure armored movement of large currency sums, bullion, precious stones, and confidential instruments between commercial banks, corporate vaults, and retail hubs.'
    },
    {
      label: 'Ambulance',
      title: 'Ambulance Service',
      category: 'Emergency Medical',
      desc: 'Emergency medical vehicles with life-support apparatus, trained paramedical officers, and standby emergency response for corporate sites and public gatherings.'
    },
    {
      label: 'Working Tools',
      title: 'Security Working Tools',
      category: 'Tactical Equipment',
      desc: 'Supply and deployment of reliable tactical accessories: long-range UHF/VHF radios, metal detectors, heavy-duty searchlights, batons, and screening gear.'
    },
    {
      label: 'Mobile Patrol',
      title: 'Mobile Patrol Team',
      category: 'Mobile Response',
      desc: 'Marked security response vehicles staffed by experienced tactical officers conducting scheduled and randomized patrols to verify premises integrity.'
    },
    {
      label: 'Metal Detectors',
      title: 'Metal Detectors',
      category: 'Screening Systems',
      desc: 'Deployment of walk-through detection arches and handheld security wands for high-precision visitor screening at corporate facilities, embassies, and event gates.'
    },
    {
      label: 'K9 Canine',
      title: 'Dog and Dog Handler',
      category: 'Canine Division',
      desc: 'Disciplined guard dogs and certified canine handlers trained for perimeter containment, industrial yard night watch, and explosive or contraband detection.'
    }
  ];

  // Render the Eight Lines on the Photos Side
  if (linesContainer) {
    linesContainer.innerHTML = '';
    servicesData.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `photo-line-btn ${idx === 0 ? 'active' : ''}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.setAttribute('aria-label', `${item.title}`);
      btn.dataset.index = idx;

      btn.innerHTML = `
        <div class="photo-line-track">
          <div class="photo-line-fill"></div>
        </div>
        <span class="photo-line-label">${item.label}</span>
      `;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(idx);
      });

      linesContainer.appendChild(btn);
    });
  }

  const lineButtons = linesContainer ? linesContainer.querySelectorAll('.photo-line-btn') : [];

  function updateContent(index) {
    const data = servicesData[index];
    if (!data) return;

    // Update Service Info on the Photo Stage
    if (serviceCategory) serviceCategory.textContent = data.category;
    if (serviceTitle) serviceTitle.textContent = data.title;
    if (serviceDesc) serviceDesc.textContent = data.desc;
    if (serviceAction) {
      serviceAction.dataset.service = data.title;
      serviceAction.setAttribute('aria-label', `Inquire about ${data.title}`);
    }

    // Update Photo Slides & Trigger Ken Burns Slow Zoom
    slides.forEach((slide, i) => {
      const img = slide.querySelector('.hero-slide-img');
      if (i === index) {
        slide.classList.add('active');
        slide.setAttribute('aria-hidden', 'false');
        if (img) {
          img.style.animation = 'none';
          void img.offsetWidth; // Force CSS reflow to restart smooth zoom from scale 1.0
          img.style.animation = 'kenBurnsZoom 3s linear forwards';
        }
      } else {
        slide.classList.remove('active');
        slide.setAttribute('aria-hidden', 'true');
        if (img) {
          img.style.animation = 'none';
        }
      }
    });

    // Update Active States on the Eight Lines
    lineButtons.forEach((btn, i) => {
      const isActive = i === index;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));

      const fill = btn.querySelector('.photo-line-fill');
      if (fill) {
        if (i < index) {
          fill.style.width = '100%';
        } else if (i > index) {
          fill.style.width = '0%';
        } else {
          fill.style.width = '0%';
        }
      }
    });
  }

  function goToSlide(targetIndex) {
    currentIndex = (targetIndex + servicesData.length) % servicesData.length;
    elapsedBeforePause = 0;
    startTime = performance.now();
    updateContent(currentIndex);
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  // Animation Loop: Updates the active line's progress fill smoothly
  function tick(now) {
    if (!startTime) startTime = now;

    if (!isPaused) {
      const elapsed = elapsedBeforePause + (now - startTime);
      const progressPercent = Math.min((elapsed / DURATION) * 100, 100);

      // Smoothly fill the active line
      const activeLineBtn = lineButtons[currentIndex];
      if (activeLineBtn) {
        const fill = activeLineBtn.querySelector('.photo-line-fill');
        if (fill) {
          fill.style.width = `${progressPercent}%`;
        }
      }

      if (elapsed >= DURATION) {
        goToSlide(currentIndex + 1);
      }
    } else {
      startTime = now;
    }

    rafId = requestAnimationFrame(tick);
  }

  // Pause / Resume on Hover
  function pauseShowcase() {
    if (isPaused) return;
    isPaused = true;
    showcase.classList.add('is-paused');
    if (startTime) {
      elapsedBeforePause += performance.now() - startTime;
    }
  }

  function resumeShowcase() {
    if (!isPaused) return;
    isPaused = false;
    showcase.classList.remove('is-paused');
    startTime = performance.now();
  }

  showcase.addEventListener('mouseenter', pauseShowcase);
  showcase.addEventListener('mouseleave', resumeShowcase);

  showcase.addEventListener('focusin', pauseShowcase);
  showcase.addEventListener('focusout', resumeShowcase);

  // Prev / Next button listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      prevSlide();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nextSlide();
    });
  }

  // Pre-select service in Consultation Form when clicking the photo action link
  if (serviceAction) {
    serviceAction.addEventListener('click', (e) => {
      const targetService = serviceAction.dataset.service;
      const serviceSelect = document.getElementById('serviceSelect');
      if (serviceSelect && targetService) {
        serviceSelect.value = targetService;
      }
    });
  }

  // Keyboard navigation (ArrowLeft & ArrowRight)
  showcase.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  });

  // Touch Swipe for mobile devices
  let touchStartX = 0;
  let touchEndX = 0;
  showcase.addEventListener('touchstart', (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      touchStartX = e.changedTouches[0].screenX;
      pauseShowcase();
    }
  }, { passive: true });

  showcase.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      touchEndX = e.changedTouches[0].screenX;
      resumeShowcase();
      if (touchEndX < touchStartX - 40) {
        nextSlide();
      } else if (touchEndX > touchStartX + 40) {
        prevSlide();
      }
    }
  }, { passive: true });

  // Tab visibility handling
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseShowcase();
    } else {
      resumeShowcase();
    }
  });

  // Initial render & launch loop
  updateContent(0);
  startTime = performance.now();
  rafId = requestAnimationFrame(tick);
}
