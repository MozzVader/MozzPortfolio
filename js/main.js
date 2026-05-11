/* ============================================
   MOZZ VADER — PORTFOLIO
   Main JavaScript
   Custom smooth scroll engine + section transitions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ─── DOM References ───
  const html = document.documentElement;
  const navbar = document.getElementById('navbar');
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const snapContainer = document.getElementById('snapContainer');
  const contactForm = document.getElementById('contactForm');

  // ─── Theme Toggle ───
  function initTheme() {
    const saved = localStorage.getItem('mozz-theme');
    if (saved) {
      html.setAttribute('data-theme', saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('mozz-theme', next);
  }

  themeToggle.addEventListener('click', toggleTheme);
  initTheme();

  // ─── Mobile Menu ───
  function openMenu() {
    menuToggle.classList.add('open');
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuToggle.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  menuToggle.addEventListener('click', () => {
    if (mobileMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
      const sectionId = link.dataset.section;
      const index = sectionData.findIndex(s => s.id === sectionId);
      if (index !== -1) goToSection(index);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  // ============================================
  // CUSTOM SCROLL ENGINE
  // ============================================
  const sections = Array.from(document.querySelectorAll('.section'));
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link[data-section]');
  const sectionDots = document.querySelectorAll('.section-dot[data-section]');

  // Section metadata
  const sectionData = sections.map(section => ({
    el: section,
    id: section.id,
  }));

  let currentIndex = 0;
  let isTransitioning = false;
  const TRANSITION_DURATION = 900; // ms — matches CSS transition
  const COOLDOWN = 400; // ms after transition before accepting new input
  let cooldownTimer = null;

  // ─── Navigate to Section ───
  function goToSection(newIndex, direction) {
    if (isTransitioning) return;
    if (newIndex < 0 || newIndex >= sections.length) return;
    if (newIndex === currentIndex) return;

    isTransitioning = true;

    // Auto-detect direction if not provided
    if (direction === undefined) {
      direction = newIndex > currentIndex ? 'down' : 'up';
    }

    const oldSection = sections[currentIndex];
    const newSection = sections[newIndex];

    // ── Apply will-change ONLY to transitioning sections ──
    oldSection.style.willChange = 'opacity, transform';
    newSection.style.willChange = 'opacity, transform';

    // Reset any leaving/active classes on ALL sections
    sections.forEach(s => {
      s.classList.remove('active', 'leaving', 'leaving-up', 'leaving-down');
    });

    // Set leaving direction on old section
    oldSection.classList.add('leaving');
    oldSection.classList.add(direction === 'down' ? 'leaving-up' : 'leaving-down');

    // Activate new section (trigger enter transition)
    requestAnimationFrame(() => {
      newSection.classList.add('active');
    });

    // Update navigation indicators
    updateNavIndicators(newIndex);

    // Animate skill bars if entering skills section
    if (newSection.id === 'skills') {
      setTimeout(() => {
        newSection.querySelectorAll('.skill-card').forEach(card => {
          card.classList.add('animated');
        });
      }, 300);
    }

    // Reset skill bars when leaving skills section
    if (oldSection.id === 'skills') {
      oldSection.querySelectorAll('.skill-card').forEach(card => {
        card.classList.remove('animated');
      });
    }

    const oldIndex = currentIndex;
    currentIndex = newIndex;

    // Allow new transitions after this one finishes
    setTimeout(() => {
      // Clean up old section — remove leaving classes
      oldSection.classList.remove('leaving', 'leaving-up', 'leaving-down');

      // ── Remove will-change after transition completes ──
      oldSection.style.willChange = '';
      newSection.style.willChange = '';

      isTransitioning = false;

      // Cooldown to prevent rapid re-triggering
      cooldownTimer = setTimeout(() => {
        cooldownTimer = null;
      }, COOLDOWN);
    }, TRANSITION_DURATION);
  }

  // ─── Update Navigation Indicators ───
  function updateNavIndicators(index) {
    const id = sectionData[index].id;

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === id);
    });

    mobileLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === id);
    });

    sectionDots.forEach(dot => {
      dot.classList.toggle('active', dot.dataset.section === id);
    });

    // Navbar scrolled state
    if (index > 0) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // ─── Wheel Handler (desktop) ───
  let wheelAccumulator = 0;
  const WHEEL_THRESHOLD = 50; // min delta to trigger navigation
  let wheelTimer = null;

  snapContainer.addEventListener('wheel', (e) => {
    e.preventDefault();

    if (isTransitioning) return;

    // Accumulate scroll delta
    wheelAccumulator += e.deltaY;

    // Clear any pending reset
    clearTimeout(wheelTimer);

    // Check if threshold reached
    if (Math.abs(wheelAccumulator) >= WHEEL_THRESHOLD) {
      const direction = wheelAccumulator > 0 ? 'down' : 'up';
      wheelAccumulator = 0;

      if (direction === 'down') {
        goToSection(currentIndex + 1, 'down');
      } else {
        goToSection(currentIndex - 1, 'up');
      }
    } else {
      // Reset accumulator after inactivity
      wheelTimer = setTimeout(() => {
        wheelAccumulator = 0;
      }, 200);
    }
  }, { passive: false });

  // ─── Touch Handler (mobile) ───
  let touchStartY = 0;
  let touchStartTime = 0;
  const TOUCH_THRESHOLD = 60; // min px swipe

  snapContainer.addEventListener('touchstart', (e) => {
    if (isTransitioning) return;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  snapContainer.addEventListener('touchend', (e) => {
    if (isTransitioning) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    const elapsed = Date.now() - touchStartTime;

    // Only trigger if swipe was fast enough and long enough
    if (elapsed < 500 && Math.abs(deltaY) > TOUCH_THRESHOLD) {
      if (deltaY > 0) {
        goToSection(currentIndex + 1, 'down');
      } else {
        goToSection(currentIndex - 1, 'up');
      }
    }
  }, { passive: true });

  // ─── Keyboard Navigation ───
  document.addEventListener('keydown', (e) => {
    if (isTransitioning) return;
    // Don't capture if user is typing in a form field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        goToSection(currentIndex + 1, 'down');
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        goToSection(currentIndex - 1, 'up');
        break;
      case 'Home':
        e.preventDefault();
        goToSection(0, 'up');
        break;
      case 'End':
        e.preventDefault();
        goToSection(sections.length - 1, 'down');
        break;
    }
  });

  // ─── Section Dots Click ───
  sectionDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetId = dot.dataset.section;
      const index = sectionData.findIndex(s => s.id === targetId);
      if (index !== -1 && index !== currentIndex) {
        goToSection(index);
      }
    });
  });

  // ─── Navbar Links Click ───
  document.querySelectorAll('.nav-link[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href').substring(1);
      const index = sectionData.findIndex(s => s.id === targetId);
      if (index !== -1 && index !== currentIndex) {
        goToSection(index);
      }
    });
  });

  // ─── Hero CTA Links ───
  document.querySelectorAll('.hero-cta a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href').substring(1);
      const index = sectionData.findIndex(s => s.id === targetId);
      if (index !== -1 && index !== currentIndex) {
        goToSection(index);
      }
    });
  });

  // ─── Diagonal Band Parallax → replaced by Mesh Background ───

  // ─── Initialize Mesh Backgrounds ───
  if (typeof MeshBackground !== 'undefined') {
    MeshBackground.initAll();
  }

  // ─── Contact Form (placeholder handler) ───
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      const btn = contactForm.querySelector('.btn-submit');
      const originalText = btn.querySelector('span').textContent;

      btn.querySelector('span').textContent = 'Enviado!';
      btn.style.background = '#22c55e';
      btn.style.pointerEvents = 'none';
      btn.querySelector('.btn-icon').style.display = 'none';

      console.log('Form submitted:', data);

      setTimeout(() => {
        btn.querySelector('span').textContent = originalText;
        btn.style.background = '';
        btn.style.pointerEvents = '';
        btn.querySelector('.btn-icon').style.display = '';
        contactForm.reset();
      }, 3000);
    });
  }

  // ─── Initial Setup ───
  // Ensure first section is active
  sections[0].classList.add('active');
  updateNavIndicators(0);

  // Trigger skill bar animation for hero section reveals
  requestAnimationFrame(() => {
    sections[0].querySelectorAll('.reveal').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  });

  console.log('Mozz Vader Portfolio loaded. Custom scroll engine active.');
});
