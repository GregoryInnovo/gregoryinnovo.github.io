/**
 * Gregory Innovo — Portfolio / main.js
 * Hero particle canvas · Glitch hover · GSAP scroll reveals
 * Waveform canvas · Gallery layout toggle · Nav scroll effect
 */

'use strict';

/* ── Helpers ───────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ── Register GSAP plugins ─────────────────────────────────────── */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // Recalculate ScrollTrigger positions after images/assets load (fixes content "not loading" below)
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

  // Refresh on resize so triggers stay correct
  let resizeTid;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTid);
    resizeTid = setTimeout(() => ScrollTrigger.refresh(), 150);
  });
}

/* ══════════════════════════════════════════════════════════════════
   NAV — scroll-activated backdrop + active section (scroll-spy)
   ══════════════════════════════════════════════════════════════════ */
(function initNav() {
  const nav = $('#nav');
  const navLinks = $$('.nav-link');
  const sections = ['#hero', '#about', '#work', '#contact'];

  if (!nav) return;

  function updateNav() {
    const y = window.scrollY + 120;
    let current = '#hero';

    for (let i = sections.length - 1; i >= 0; i--) {
      const el = $(sections[i]);
      if (el && el.offsetTop <= y) {
        current = sections[i];
        break;
      }
    }

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === current && href !== '#hero');
    });
  }

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    updateNav();
  }, { passive: true });

  updateNav();
})();

/* ══════════════════════════════════════════════════════════════════
   HERO — PARTICLE WAVEFORM CANVAS
   ══════════════════════════════════════════════════════════════════ */
(function initHeroCanvas() {
  const canvas = $('#heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  let mouseX = 0.5;
  let mouseY = 0.5;
  let startTime = performance.now();

  const PARTICLE_COUNT = 200;
  const particles = [];

  class Particle {
    constructor(i) {
      this.index = i;
      this.radius = Math.random() * 2 + 0.8;
      this.phase = (i / PARTICLE_COUNT) * Math.PI * 8;
      const hues = ['#ff3cac', '#00f5d4', '#f5d22b', '#ff6b2b'];
      this.color = hues[Math.floor(Math.random() * hues.length)];
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
    }

    update(t, mxPx, myPx) {
      const waveAmp = H * 0.18;
      const freq = 1.8 + mouseX * 1.2;
      const baseX = (this.index / PARTICLE_COUNT) * W;
      const baseY = H / 2
        + Math.sin(baseX * freq * 0.005 + t * 0.8 + this.phase) * waveAmp * 0.8
        + Math.sin(baseX * freq * 0.012 + t * 1.4 + this.phase) * waveAmp * 0.4;

      // Snap x to wave base (only y is animated vertically)
      const springStrX = 0.1;
      const springStrY = 0.07;
      this.vx += (baseX - this.x) * springStrX;
      this.vy += (baseY - this.y) * springStrY;

      if (!prefersReducedMotion()) {
        const dx = this.x - mxPx;
        const dy = this.y - myPx;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 85;
        if (dist < repelRadius && dist > 0) {
          const force = (repelRadius - dist) / repelRadius;
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * force * 4.5;
          this.vy += Math.sin(angle) * force * 4.5;
        }
      }

      this.vx *= 0.82;
      this.vy *= 0.82;
      this.x += this.vx;
      this.y += this.vy;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 7;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function buildParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = new Particle(i);
      p.x = (i / PARTICLE_COUNT) * W;
      p.y = H / 2;
      particles.push(p);
    }
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildParticles();
  }

  function loop() {
    requestAnimationFrame(loop);
    const t = (performance.now() - startTime) / 1000;
    const mxPx = mouseX * W;
    const myPx = mouseY * H;

    ctx.clearRect(0, 0, W, H);

    // Subtle atmosphere gradient
    const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.65);
    grd.addColorStop(0, 'rgba(255,60,172,0.04)');
    grd.addColorStop(0.5, 'rgba(0,245,212,0.025)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    particles.forEach(p => { p.update(t, mxPx, myPx); p.draw(); });
  }

  const heroEl = $('#hero');
  if (heroEl) {
    heroEl.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = (e.clientY - rect.top) / rect.height;
    });
    heroEl.addEventListener('mouseleave', () => { mouseX = 0.5; mouseY = 0.5; });
  }

  window.addEventListener('resize', resize);
  resize();
  loop();
})();

/* ══════════════════════════════════════════════════════════════════
   HERO — GLITCH HOVER
   ══════════════════════════════════════════════════════════════════ */
(function initGlitch() {
  const nameEl = $('.hero-name');
  if (!nameEl) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-name-wrapper';
  nameEl.parentNode.insertBefore(wrapper, nameEl);

  const glitch1 = $('.hero-name-glitch--1');
  const glitch2 = $('.hero-name-glitch--2');
  wrapper.appendChild(nameEl);
  if (glitch1) wrapper.appendChild(glitch1);
  if (glitch2) wrapper.appendChild(glitch2);

  wrapper.addEventListener('mouseenter', () => {
    if (!prefersReducedMotion()) wrapper.classList.add('is-hovered');
  });
  wrapper.addEventListener('mouseleave', () => {
    wrapper.classList.remove('is-hovered');
  });
})();

/* ══════════════════════════════════════════════════════════════════
   HERO — ENTRANCE ANIMATIONS
   ══════════════════════════════════════════════════════════════════ */
(function initHeroEntrance() {
  const eyebrow   = $('.hero-eyebrow');
  const nameEl    = $('.hero-name');
  const tagline   = $('.hero-tagline');
  const scrollCue = $('.hero-scroll-cue');

  if (typeof gsap === 'undefined') {
    // Fallback: just show everything
    [eyebrow, nameEl, tagline, scrollCue].forEach(el => {
      if (el) el.style.opacity = '1';
    });
    return;
  }

  const d = (base) => prefersReducedMotion() ? 0 : base;
  const tl = gsap.timeline({ delay: 0.2 });

  tl.fromTo(eyebrow, { opacity: 0, y: 14 }, {
    opacity: 1, y: 0,
    duration: d(0.65), ease: 'power3.out',
  });

  tl.fromTo(nameEl, { opacity: 0, y: 32 }, {
    opacity: 1, y: 0,
    duration: d(0.9), ease: 'power3.out',
  }, '-=0.35');

  tl.fromTo(tagline, { opacity: 0, y: 18 }, {
    opacity: 1, y: 0,
    duration: d(0.7), ease: 'power3.out',
  }, '-=0.5');

  tl.fromTo(scrollCue, { opacity: 0 }, {
    opacity: 1, duration: d(0.6), ease: 'power2.out',
  }, '-=0.2');
})();

/* ══════════════════════════════════════════════════════════════════
   PROJECT DETAIL DATA (for View Transition detail view)
   ══════════════════════════════════════════════════════════════════ */
const PROJECTS = [
  {
    title: 'Foodhy',
    description: 'AI-powered food suggestions app. Won $10K Grand Prize at Huawei Cloud Developer Competition LATAM.',
    tags: ['AI · LLM', 'Mobile', 'Startup'],
    projectUrl: 'https://foodhy.com.co/',
    cardImage: './assets/img/Foodhy.PNG',
    summary: 'Foodhy is a platform that provides accessible nutritional information for everyone, fostering a culture of responsible and mindful consumption. Supported by artificial intelligence and professional guidance, it allows users to scan barcode products to get nutritional info and AI-powered suggestions. Built by MediaCollab, it won the Grand Prize ($10K USD) at the Huawei Cloud Developer Competition 2023 Latin America in Lima, Peru, competing against 7 teams from Colombia, Mexico, and Peru.',
    images: ['./assets/img/foodhy_team.jpeg'],
    links: [
      { label: 'Watch pitch', url: 'https://www.youtube.com/watch?v=QsSwR6EaTkU' },
      { label: 'LinkedIn post', url: 'https://www.linkedin.com/posts/damddev_huaweicloud-hdc2023-entrepreneurship-activity-7140202292753903616-4AR2?utm_source=share&utm_medium=member_desktop&rcm=ACoAADAruK4BlaZjQIm1f5Mtg79ZeaNr3GOdods' },
    ],
  },
  {
    title: 'Pocket (In Progress)',
    description: 'Voice-controlled productivity app for content consumption and note-taking.',
    tags: ['Voice', 'Productivity', 'Consumption'],
    projectUrl: '#',
    cardImage: "url('./assets/img/pocket.png'), linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)",
    summary: 'Pocket is a personal finance and content tracker built around one idea: everything you consume, earn, and spend should be effortless to log. Using voice commands, you save articles, podcasts, videos, purchases, and income entries without breaking your flow — you hear something, you say it, Pocket captures it. It then organizes your content library and financial activity in one place, giving you clarity on where your time and money actually go. Currently in active development, exploring LLM integrations to auto-summarize saved content and generate spending insights.',
    images: [],
    links: [],
  },
  {
    title: 'SellMoreTrips',
    description: 'AI platform for travel agencies to increase sales through personalized recommendations.',
    tags: ['AI · LLM', 'Fullstack', 'Travel'],
    projectUrl: 'https://sellmoretrips.com/',
    cardImage: './assets/img/posterSMT.png',
    summary: 'SellMoreTrips is a B2B AI platform built to help travel agencies close more deals. It analyzes each client\'s profile and travel history to automatically generate personalized destination recommendations and commercial proposals — cutting hours of manual work into seconds. Agents get a dashboard with client insights, automated quote generation, and a real-time LLM assistant that answers traveler questions 24/7. Built on the MERN stack with AI automation at its core, replacing repetitive agency workflows with intelligent, scalable processes.',
    images: [],
    links: [],
  },
  {
    title: 'ElderLink',
    description: 'Voice assistant for seniors. Natural language to control apps, send messages, and place orders.',
    tags: ['AI · LLM', 'Voice', 'UAO'],
    projectUrl: 'https://www.uao.edu.co/ingenieria/conoce-a-elderlink/',
    cardImage: './assets/img/elderlink.png',
    summary: 'ElderLink is a voice assistant designed for seniors with little to no tech experience. Through natural conversation — no buttons, no menus — elders can ask for information on any topic, request an Uber ride via deep links, send WhatsApp messages, play music, or call a family member. The assistant also automates reminders for medication, alarms, and appointments, acting as a daily companion that bridges the digital gap. The goal: make technology invisible so elders can focus on living, not on learning apps.',
    images: [],
    links: [],
  },
  {
    title: 'Zen Pomodoro (In Progress)',
    description: 'Minimalist Pomodoro timer with task planner and focus tracking.',
    tags: ['Productivity', 'Web App', 'Planner'],
    projectUrl: 'https://zenpomodoro.pages.dev/',
    cardImage: "url('./assets/img/zenpomodoro.png'), linear-gradient(135deg, #2d1f3d 0%, #1a1a2e 100%)",
    summary: 'Zen Pomodoro is a minimalist focus timer built around the Pomodoro technique, designed for people who want deep work without noise. It includes a daily task planner, session stats, and a carefully crafted dark UI. The philosophy is "enough and nothing more" — no aggressive notifications, no forced gamification, no clutter. A progressive web app that works offline and installs on any device, keeping you focused on what matters.',
    images: [],
    links: [],
  },
  {
    title: 'Media Collab',
    description: 'UAO student innovation group I founded. Hackathons, workshops, and product development.',
    tags: ['Founder', 'Student Group', 'Innovation'],
    projectUrl: 'https://mediacollab.pages.dev/',
    cardImage: "url('./assets/img/mediacollab.png'), linear-gradient(135deg, #ffffff 0%, #e8e8e8 100%)",
    summary: 'Media Collab is the student innovation group I founded at Universidad Autónoma de Occidente. Built around one mission: ship real products and compete at the highest level. The group participated in 13+ hackathons, winning the $10K Grand Prize at Huawei Cloud Developer Competition LATAM 2023, 1st place at NTT Data Innovation Summit, and multiple national Top 10 finishes. Beyond competing, Media Collab ran workshops on development, design, and entrepreneurship for the university community, becoming a launchpad for student builders.',
    images: [],
    links: [],
  },
  {
    title: 'Crossing Biomes',
    description: '3D exploration game built with Unity. Finalist at Huawei Developer Challenge, published on AppGallery.',
    tags: ['Game Dev', 'Unity 3D', 'Huawei'],
    projectUrl: 'https://appgallery.huawei.com/#/app/C102501697',
    cardImage: './assets/img/CB_Proyect.jpg',
    summary: 'Crossing Biomes is a 3D exploration game built in Unity for the Huawei Developer Challenge. Players travel through diverse natural biomes — forest, desert, tundra — with platforming and collection mechanics, all optimized for Android using Huawei Mobile Services (HMS). The GearSoul team reached the finalist round and the game was officially published on Huawei AppGallery. It was my first experience shipping a game to a real store and navigating the full pipeline from prototype to production build.',
    images: [],
    links: [],
  },
  {
    title: 'The Adventure of Creation',
    description: 'Educational game about creativity. Mention of Honor at Game Jam Lab 2020 — Best Educational Game.',
    tags: ['Game Dev', 'Educational', 'Game Jam'],
    projectUrl: 'https://gregoryinnovo.itch.io/la-aventura-de-la-creacin',
    cardImage: './assets/img/la-aventura-de-la-creacion.jpg',
    summary: 'This video game is a metaphor for the mental process that an artist undergoes while creating a painting. The main character explores both abstract thoughts and logical reasoning, drawing and transforming the environment to complete a maze of ideas and break through the walls of creative block. The game is inspired by the works of León Ferrari and Maria Theresa Negreiros.',
    images: [],
    links: [],
  },
];

/* ══════════════════════════════════════════════════════════════════
   GALLERY — LAYOUT TOGGLE (Grid ↔ List) + VIEW TRANSITIONS
   ══════════════════════════════════════════════════════════════════ */
(function initGallery() {
  const gallery    = $('#mediaGallery');
  const toggleBtn  = $('#layout-toggle');
  const gridWrap   = $('#workGridWrap');
  const detailView  = $('#workDetailView');
  const detailBack  = $('#workDetailBack');
  const cardLinks   = $$('.card-link[data-project-index]');

  if (!gallery || !toggleBtn || !gridWrap || !detailView) return;

  toggleBtn.addEventListener('click', () => {
    gallery.classList.toggle('list-view');
    toggleBtn.classList.toggle('is-list');
  });

  function supportsViewTransitions() {
    return 'startViewTransition' in document;
  }

  function setViewTransitionNames(index, cardOnly) {
    const imgName  = `work-card-image-${index}`;
    const titleName = `work-card-title-${index}`;
    $$('.work-card-img').forEach((el) => {
      el.style.viewTransitionName = el.dataset.id === String(index) ? imgName : 'none';
    });
    $$('.work-card-title').forEach((el) => {
      el.style.viewTransitionName = el.dataset.id === String(index) ? titleName : 'none';
    });
    if (!cardOnly && detailView) {
      const detailImg   = $('#workDetailImage');
      const detailTitle = $('#workDetailTitle');
      if (detailImg) detailImg.style.viewTransitionName = imgName;
      if (detailTitle) detailTitle.style.viewTransitionName = titleName;
    }
  }

  function clearViewTransitionNames() {
    $$('.work-card-img, .work-card-title').forEach((el) => {
      el.style.viewTransitionName = 'none';
    });
    const detailImg   = $('#workDetailImage');
    const detailTitle = $('#workDetailTitle');
    if (detailImg) detailImg.style.viewTransitionName = 'none';
    if (detailTitle) detailTitle.style.viewTransitionName = 'none';
  }

  function openDetail(index) {
    const proj = PROJECTS[index];
    if (!proj) return;

    setViewTransitionNames(index, true);

    const doUpdate = () => {
      gridWrap.hidden = true;
      gridWrap.setAttribute('aria-hidden', 'true');
      detailView.hidden = false;
      detailView.setAttribute('aria-hidden', 'false');
      savedScrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.top = `-${savedScrollY}px`;

      const detailImg     = $('#workDetailImage');
      const detailTitle   = $('#workDetailTitle');
      const detailDesc    = $('#workDetailDesc');
      const detailTags    = $('#workDetailTags');
      const detailSummary = $('#workDetailSummary');
      const detailGallery = $('#workDetailGallery');
      const detailLinks   = $('#workDetailLinks');
      const projectLink  = $('#workDetailProjectLink');

      if (detailImg) {
        const bg = proj.cardImage.startsWith('url(') ? proj.cardImage : `url(${proj.cardImage})`;
        detailImg.style.backgroundImage = bg;
        detailImg.style.viewTransitionName = `work-card-image-${index}`;
      }
      if (detailTitle) {
        detailTitle.textContent = proj.title;
        detailTitle.style.viewTransitionName = `work-card-title-${index}`;
      }
      if (detailDesc) detailDesc.textContent = proj.description;
      if (detailTags) {
        detailTags.innerHTML = proj.tags.map((t) => `<span class="tag">${t}</span>`).join('');
      }
      if (detailSummary) {
        detailSummary.innerHTML = proj.summary ? `<p>${proj.summary}</p>` : '';
        detailSummary.hidden = !proj.summary;
      }
      if (detailGallery) {
        detailGallery.innerHTML = proj.images
          .map((src) => `<img src="${src}" alt="" loading="lazy" class="work-detail-gallery-img" />`)
          .join('');
        detailGallery.hidden = !proj.images.length;
      }
      if (detailLinks) {
        detailLinks.innerHTML = proj.links
          .map((l) => `<a href="${l.url}" target="_blank" rel="noopener" class="work-detail-link">${l.label}</a>`)
          .join('');
        detailLinks.hidden = !proj.links.length;
      }
      if (projectLink) {
        projectLink.href = proj.projectUrl;
        projectLink.hidden = !proj.projectUrl || proj.projectUrl === '#';
      }
    };

    if (supportsViewTransitions()) {
      document.startViewTransition(doUpdate);
    } else {
      doUpdate();
    }
  }

  function closeDetail(index) {
    setViewTransitionNames(index, false);

    const doUpdate = () => {
      detailView.hidden = true;
      detailView.setAttribute('aria-hidden', 'true');
      gridWrap.hidden = false;
      gridWrap.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = '';
      document.body.style.top = '';
      window.scrollTo({ top: savedScrollY, behavior: 'instant' });
      clearViewTransitionNames();
    };

    if (supportsViewTransitions()) {
      document.startViewTransition(doUpdate);
    } else {
      doUpdate();
    }
  }

  let currentDetailIndex = -1;
  let savedScrollY = 0;

  cardLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const idx = parseInt(link.getAttribute('data-project-index'), 10);
      if (idx < 0 || idx >= PROJECTS.length) return;
      e.preventDefault();
      e.stopPropagation();
      currentDetailIndex = idx;
      openDetail(idx);
    });
  });

  if (detailBack) {
    detailBack.addEventListener('click', () => {
      if (currentDetailIndex >= 0) {
        closeDetail(currentDetailIndex);
        currentDetailIndex = -1;
      }
    });
  }

  detailView.addEventListener('click', (e) => {
    if (!e.target.closest('.work-detail-layout') && currentDetailIndex >= 0) {
      closeDetail(currentDetailIndex);
      currentDetailIndex = -1;
    }
  });
})();

/* ══════════════════════════════════════════════════════════════════
   SCROLL REVEALS — Media Cards
   ══════════════════════════════════════════════════════════════════ */
(function initScrollReveals() {
  if (typeof gsap === 'undefined') {
    $$('.media-card').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  const d = (base) => prefersReducedMotion() ? 0 : base;

  $$('.media-card').forEach((card, i) => {
    gsap.to(card, {
      opacity: 1, y: 0,
      duration: d(0.7),
      ease: 'power3.out',
      delay: i * d(0.08),
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });
})();

/* ══════════════════════════════════════════════════════════════════
   ABOUT — scroll reveal + counter animation for facts
   ══════════════════════════════════════════════════════════════════ */
(function initAboutAnimations() {
  if (typeof gsap === 'undefined') return;

  const d = (base) => prefersReducedMotion() ? 0 : base;
  const aboutSection = $('#about');
  const eyebrow = $('.about-eyebrow');
  const title = $('.about-title');
  const bio = $('.about-bio');
  const facts = $$('.fact');
  const social = $('.about-social');

  if (!aboutSection) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: aboutSection,
      start: 'top 75%',
      toggleActions: 'play none none none', /* solo una vez al entrar */
    },
  });

  if (eyebrow) tl.fromTo(eyebrow, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: d(0.5), ease: 'power3.out' });
  if (title) tl.fromTo(title, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: d(0.6), ease: 'power3.out' }, '-=0.3');
  if (bio) tl.fromTo(bio, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: d(0.55), ease: 'power3.out' }, '-=0.35');
  tl.fromTo(facts, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: d(0.5), stagger: d(0.08), ease: 'power3.out' }, '-=0.4');
  if (social) tl.fromTo(social, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: d(0.5), ease: 'power3.out' }, '-=0.3');

  /* Counter animation for facts */
  facts.forEach((factEl) => {
    const numEl = factEl.querySelector('.fact-num');
    if (!numEl) return;
    const count = parseInt(factEl.dataset.count, 10) || 0;
    const prefix = factEl.dataset.prefix || '';
    const suffix = factEl.dataset.suffix || '';

    const obj = { val: 0 };
    gsap.to(obj, {
      val: count,
      duration: d(1.4),
      ease: 'power2.out',
      scrollTrigger: {
        trigger: factEl,
        start: 'top 88%',
        toggleActions: 'play none none none', /* solo una vez */
      },
      onUpdate: () => {
        numEl.textContent = prefix + Math.round(obj.val) + suffix;
      },
    });
  });
})();

/* ══════════════════════════════════════════════════════════════════
   WAVEFORM VISUALIZER CANVAS — with mouse interaction
   ══════════════════════════════════════════════════════════════════ */
(function initWaveform() {
  const canvas = $('#waveformCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  let mouseX = 0;   // raw px, updated on section mousemove
  let animId;
  let startTime = performance.now();

  const waves = [
    { freq: 0.022, amp: 0.15, speed: 1.0,  color: '#ff3cac', lineWidth: 2.5 },
    { freq: 0.034, amp: 0.10, speed: 1.6,  color: '#00f5d4', lineWidth: 2   },
    { freq: 0.055, amp: 0.06, speed: 2.3,  color: '#f5d22b', lineWidth: 1.5 },
  ];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    mouseX = W / 2;
  }

  function drawWave(t) {
    ctx.clearRect(0, 0, W, H);

    const centerY = H / 2;
    const mxInfluence = (mouseX / W - 0.5) * 0.5;

    waves.forEach((wave, wi) => {
      const amp = wave.amp * H;

      // Horizontal gradient per wave
      const grd = ctx.createLinearGradient(0, 0, W, 0);
      if (wi === 0) {
        grd.addColorStop(0,   'rgba(255,60,172,0)');
        grd.addColorStop(0.3, '#ff3cac');
        grd.addColorStop(0.7, '#ff6b2b');
        grd.addColorStop(1,   'rgba(255,107,43,0)');
      } else if (wi === 1) {
        grd.addColorStop(0,    'rgba(0,245,212,0)');
        grd.addColorStop(0.25, '#00f5d4');
        grd.addColorStop(0.75, '#ff3cac');
        grd.addColorStop(1,    'rgba(255,60,172,0)');
      } else {
        grd.addColorStop(0,   'rgba(245,210,43,0)');
        grd.addColorStop(0.4, '#f5d22b');
        grd.addColorStop(0.6, '#00f5d4');
        grd.addColorStop(1,   'rgba(0,245,212,0)');
      }

      ctx.beginPath();
      ctx.strokeStyle = grd;
      ctx.lineWidth   = wave.lineWidth;
      ctx.shadowBlur  = 16;
      ctx.shadowColor = wave.color;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';

      for (let x = 0; x <= W; x += 2) {
        const freqMod = wave.freq + mxInfluence;
        const y = centerY
          + Math.sin(x * freqMod       + t * wave.speed)       * amp
          + Math.sin(x * freqMod * 2.1 + t * wave.speed * 0.5) * amp * 0.3;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Subtle dashed center line
    ctx.beginPath();
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(68,68,102,0.45)';
    ctx.lineWidth   = 1;
    ctx.moveTo(0, centerY);
    ctx.lineTo(W, centerY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function loop() {
    animId = requestAnimationFrame(loop);
    if (prefersReducedMotion()) {
      drawWave(0);
      cancelAnimationFrame(animId);
      return;
    }
    drawWave((performance.now() - startTime) / 1000);
  }

  // Mouse tracking on the waveform section
  const wfSection = $('#waveform');
  if (wfSection) {
    wfSection.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
    });
    wfSection.addEventListener('mouseleave', () => {
      mouseX = W / 2;
    });
  }

  window.addEventListener('resize', resize);
  resize();
  loop();
})();

/* ══════════════════════════════════════════════════════════════════
   ACHIEVEMENTS — VERTICAL GRID WITH SCROLL REVEALS
   ══════════════════════════════════════════════════════════════════ */
(function initAchievementsGallery() {
  if (typeof gsap === 'undefined') {
    $$('.achievement-panel').forEach(el => {
      el.style.opacity = '1';
    });
    return;
  }

  const panels = gsap.utils.toArray('.achievement-panel');
  const d = (base) => prefersReducedMotion() ? 0 : base;

  panels.forEach((panel, i) => {
    const inner = panel.querySelector('.achievement-panel-inner');
    if (!inner) return;
    gsap.set(panel, { opacity: 0, y: 24 });
    gsap.to(panel, {
      opacity: 1, y: 0,
      duration: d(0.6),
      ease: 'power3.out',
      delay: i * d(0.06),
      scrollTrigger: {
        trigger: panel,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    });
  });
})();

/* ══════════════════════════════════════════════════════════════════
   CONTACT — TEXT REVEAL
   ══════════════════════════════════════════════════════════════════ */
(function initContactReveal() {
  const headingEl = $('.contact-heading');
  const subEl     = $('.contact-sub');
  const linksEl   = $('.contact-links');

  if (typeof gsap === 'undefined') {
    [headingEl, subEl, linksEl].forEach(el => {
      if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
    });
    return;
  }

  const d = (base) => prefersReducedMotion() ? 0 : base;

  const contactSection = $('#contact');
  if (!contactSection) return;

  /* — Heading: clip-path wipe reveal (solo una vez) — */
  if (headingEl) {
    headingEl.style.opacity = '1';
    gsap.fromTo(headingEl,
      { clipPath: 'inset(0 100% 0 0)', y: 24 },
      {
        clipPath: 'inset(0 0% 0 0)', y: 0,
        duration: d(1.0),
        ease: 'power3.inOut',
        scrollTrigger: {
          trigger: contactSection,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  }

  /* — Sub: word-by-word reveal (solo una vez) — */
  if (subEl) {
    const text = subEl.textContent.trim();
    subEl.textContent = '';
    subEl.style.opacity = '1';

    text.split(' ').forEach((word, i, arr) => {
      const span = document.createElement('span');
      span.className = 'contact-word';
      span.textContent = word;
      subEl.appendChild(span);
      if (i < arr.length - 1) subEl.appendChild(document.createTextNode(' '));
    });

    gsap.set('.contact-word', { y: 18, opacity: 0 });
    gsap.to('.contact-word', {
      y: 0, opacity: 1,
      duration: d(0.55),
      ease: 'power3.out',
      stagger: d(0.05),
      delay: d(0.15),
      scrollTrigger: {
        trigger: contactSection,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  }

  /* — Buttons: staggered fade-up (solo una vez) — */
  if (linksEl) {
    const btns = $$('.contact-btn', linksEl);
    linksEl.style.opacity = '1';
    gsap.set(btns, { y: 16, opacity: 0 });
    gsap.to(btns, {
      y: 0, opacity: 1,
      duration: d(0.5),
      ease: 'power3.out',
      stagger: d(0.08),
      delay: d(0.3),
      scrollTrigger: {
        trigger: contactSection,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  }
})();
