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
      // Default to dark mode
      html.setAttribute('data-theme', 'dark');
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

  // ─── Supabase: Load Projects Dynamically ───
  async function loadProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    // Show loading skeletons
    container.classList.add('loading');
    container.innerHTML = `
      <div class="project-skeleton"><div class="skeleton-image"></div><div class="skeleton-text"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div></div>
      <div class="project-skeleton"><div class="skeleton-image"></div><div class="skeleton-text"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div></div>
      <div class="project-skeleton"><div class="skeleton-image"></div><div class="skeleton-text"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div></div>
    `;

    try {
      if (typeof window.supabase === 'undefined') {
        throw new Error('Supabase not loaded');
      }

      const supabase = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
      );

      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('visible', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      container.classList.remove('loading');

      if (!projects || projects.length === 0) {
        container.innerHTML = `
          <div class="projects-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>Proyectos próximamente...</p>
          </div>
        `;
        return;
      }

      // Build all project cards HTML
      const cardsHTML = projects.map((project, i) => {
        const hasDemo = !!project.demo_url;
        const hasRepo = !!project.repo_url;
        const tags = Array.isArray(project.tags) ? project.tags : [];

        // Build overlay buttons
        let buttons = '';

        // Expand button (always shown if image exists)
        if (project.image_url) {
          buttons += `
            <button class="project-expand" data-image="${escapeAttr(project.image_url)}" aria-label="Ver imagen completa">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9"/>
                <polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/>
                <line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </button>`;
        }

        // Demo button
        if (hasDemo) {
          buttons += `
            <a href="${escapeAttr(project.demo_url)}" class="project-link" aria-label="Ver demo" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>`;
        }

        // Repo button
        if (hasRepo) {
          buttons += `
            <a href="${escapeAttr(project.repo_url)}" class="project-link" aria-label="Ver código" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </a>`;
        }

        // Image or placeholder
        const imageContent = project.image_url
          ? `<img src="${escapeAttr(project.image_url)}" alt="${escapeAttr(project.title)}" loading="lazy">`
          : `<div class="project-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="placeholder-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>`;

        const tagsHTML = tags.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');

        return `
          <article class="project-card" style="--delay: ${i}">
            <div class="project-image">
              ${imageContent}
              ${buttons ? `<div class="project-overlay">${buttons}</div>` : ''}
            </div>
            <div class="project-info">
              <h3 class="project-title">${escapeHTML(project.title)}</h3>
              <p class="project-desc">${escapeHTML(project.description)}</p>
              ${tagsHTML ? `<div class="project-tags">${tagsHTML}</div>` : ''}
            </div>
          </article>
        `;
      }).join('');

      // If more than 3 projects, use horizontal scroll with chevrons
      if (projects.length > 3) {
        container.innerHTML = `
          <div class="projects-viewport has-scroll">
            <button class="projects-chevron hidden" id="projChevLeft" aria-label="Proyectos anteriores">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div class="projects-scroll" id="projectsScroll">
              <div class="projects-grid">${cardsHTML}</div>
            </div>
            <button class="projects-chevron" id="projChevRight" aria-label="Proyectos siguientes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        `;

        // Calculate card width to match 3-column grid
        const scrollEl = document.getElementById('projectsScroll');
        const leftChev = document.getElementById('projChevLeft');
        const rightChev = document.getElementById('projChevRight');

        function calcCardWidth() {
          // Available width = scroll container width minus 2 gaps for 3 visible cards
          const gap = 24; // 1.5rem
          return Math.floor((scrollEl.clientWidth - 2 * gap) / 3);
        }

        function setCardSizes() {
          const w = calcCardWidth();
          scrollEl.querySelectorAll('.project-card').forEach(card => {
            card.style.minWidth = w + 'px';
            card.style.width = w + 'px';
          });
        }

        function updateChevrons() {
          const { scrollLeft, scrollWidth, clientWidth } = scrollEl;
          leftChev.classList.toggle('hidden', scrollLeft <= 5);
          rightChev.classList.toggle('hidden', scrollLeft >= scrollWidth - clientWidth - 5);
        }

        // Initial sizing
        setCardSizes();
        updateChevrons();

        // Chevron click handlers
        leftChev.addEventListener('click', () => {
          const w = calcCardWidth();
          scrollEl.scrollBy({ left: -(w + 24), behavior: 'smooth' });
        });

        rightChev.addEventListener('click', () => {
          const w = calcCardWidth();
          scrollEl.scrollBy({ left: w + 24, behavior: 'smooth' });
        });

        // Update chevron visibility on scroll
        scrollEl.addEventListener('scroll', updateChevrons, { passive: true });

        // Recalculate on resize
        window.addEventListener('resize', () => {
          setCardSizes();
          updateChevrons();
        });
      } else {
        // 3 or fewer projects: standard grid (no scroll)
        container.innerHTML = `<div class="projects-grid">${cardsHTML}</div>`;
      }

      // Attach expand button handlers
      container.querySelectorAll('.project-expand').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          openImageModal(btn.dataset.image);
        });
      });

      // Apply reveal animation to cards
      requestAnimationFrame(() => {
        container.querySelectorAll('.project-card').forEach(card => {
          card.classList.add('reveal');
        });
      });

    } catch (err) {
      console.error('Error loading projects:', err);
      container.classList.remove('loading');
      container.innerHTML = `
        <div class="projects-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>No se pudieron cargar los proyectos</p>
        </div>
      `;
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── Image Modal ───
  const imageModal = document.getElementById('imageModal');
  const imageModalImg = document.getElementById('imageModalImg');
  const imageModalOverlay = document.getElementById('imageModalOverlay');
  const imageModalClose = document.getElementById('imageModalClose');

  function openImageModal(src) {
    if (!imageModal || !imageModalImg) return;
    imageModalImg.src = src;
    imageModal.setAttribute('aria-hidden', 'false');
    imageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeImageModal() {
    if (!imageModal) return;
    imageModal.classList.remove('active');
    imageModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Clear src after transition to stop loading
    setTimeout(() => { imageModalImg.src = ''; }, 300);
  }

  if (imageModalOverlay) imageModalOverlay.addEventListener('click', closeImageModal);
  if (imageModalClose) imageModalClose.addEventListener('click', closeImageModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal && imageModal.classList.contains('active')) {
      closeImageModal();
    }
  });

  // Load projects from Supabase
  loadProjects();

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
