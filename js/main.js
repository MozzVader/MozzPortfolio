/* ============================================
   MOZZ VADER — PORTFOLIO
   Main JavaScript
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
      // Check system preference
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

  // Close menu on link click
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  // ─── Active Nav Link (Intersection Observer) ───
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link[data-section]');

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;

          navLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.section === id);
          });

          mobileLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.section === id);
          });
        }
      });
    },
    {
      root: snapContainer,
      threshold: 0.55,
    }
  );

  sections.forEach((section) => navObserver.observe(section));

  // ─── Reveal Animations (Intersection Observer) ───
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Animate skill bars inside this element
          const skillBars = entry.target.querySelectorAll('.skill-bar');
          skillBars.forEach((bar) => {
            bar.closest('.skill-card').classList.add('animated');
          });

          // If the element itself is a skill card
          if (entry.target.classList.contains('skill-card')) {
            entry.target.classList.add('animated');
          }
        }
      });
    },
    {
      root: snapContainer,
      threshold: 0.2,
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  // ─── Smooth Scroll for Nav Links ───
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });

  // ─── Navbar Background on Scroll ───
  let lastScrollY = 0;

  snapContainer.addEventListener('scroll', () => {
    const currentScrollY = snapContainer.scrollTop;

    // Add/remove scrolled class for subtle visual feedback
    if (currentScrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScrollY = currentScrollY;
  });

  // ─── Contact Form (placeholder handler) ───
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      // Basic validation visual feedback
      const btn = contactForm.querySelector('.btn-submit');
      const originalText = btn.querySelector('span').textContent;

      // Simulate sending
      btn.querySelector('span').textContent = 'Enviado!';
      btn.style.background = '#22c55e';
      btn.style.pointerEvents = 'none';
      btn.querySelector('.btn-icon').style.display = 'none';

      console.log('Form submitted:', data);

      // Reset after 3 seconds
      setTimeout(() => {
        btn.querySelector('span').textContent = originalText;
        btn.style.background = '';
        btn.style.pointerEvents = '';
        btn.querySelector('.btn-icon').style.display = '';
        contactForm.reset();
      }, 3000);
    });
  }

  // ─── Keyboard Navigation (Arrow keys for snap sections) ───
  let isScrolling = false;

  snapContainer.addEventListener('wheel', () => {
    isScrolling = true;
    clearTimeout(snapContainer._wheelTimeout);
    snapContainer._wheelTimeout = setTimeout(() => {
      isScrolling = false;
    }, 1000);
  });

  document.addEventListener('keydown', (e) => {
    if (isScrolling) return;

    const currentSection = getCurrentVisibleSection();
    if (!currentSection) return;

    let targetSection = null;

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      targetSection = currentSection.nextElementSibling;
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      targetSection = currentSection.previousElementSibling;
    } else if (e.key === 'Home') {
      targetSection = sections[0];
    } else if (e.key === 'End') {
      targetSection = sections[sections.length - 1];
    }

    if (targetSection && targetSection.classList.contains('section')) {
      e.preventDefault();
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });

  function getCurrentVisibleSection() {
    const scrollTop = snapContainer.scrollTop;
    const containerHeight = snapContainer.clientHeight;

    let closest = null;
    let closestDistance = Infinity;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - navbar.offsetHeight;
      const distance = Math.abs(scrollTop - sectionTop);

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = section;
      }
    });

    return closest;
  }

  // ─── Initial Reveal for Hero Section ───
  // The hero should be visible immediately
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    // Small delay for entrance effect
    requestAnimationFrame(() => {
      heroContent.classList.add('visible');
    });
  }

  console.log('Mozz Vader Portfolio loaded.');
});
