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
}

/* ══════════════════════════════════════════════════════════════════
   NAV — scroll-activated backdrop
   ══════════════════════════════════════════════════════════════════ */
(function initNav() {
  const nav = $('#nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
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
   GALLERY — LAYOUT TOGGLE (Grid ↔ List)
   ══════════════════════════════════════════════════════════════════ */
(function initGallery() {
  const gallery   = $('#mediaGallery');
  const toggleBtn = $('#layout-toggle');
  if (!gallery || !toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    gallery.classList.toggle('list-view');
    toggleBtn.classList.toggle('is-list');
  });
})();

/* ══════════════════════════════════════════════════════════════════
   SCROLL REVEALS — Cards & Achievements
   ══════════════════════════════════════════════════════════════════ */
(function initScrollReveals() {
  if (typeof gsap === 'undefined') {
    // Fallback
    $$('.media-card, .achievement-item, .contact-heading, .contact-sub, .contact-links').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  const d = (base) => prefersReducedMotion() ? 0 : base;

  // Media cards
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

  // Achievement items
  $$('.achievement-item').forEach((item, i) => {
    gsap.to(item, {
      opacity: 1, y: 0,
      duration: d(0.6),
      ease: 'power3.out',
      delay: i * d(0.06),
      scrollTrigger: {
        trigger: item,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    });
  });

  // Contact heading
  const contactHeading = $('.contact-heading');
  const contactSub = $('.contact-sub');
  const contactLinks = $('.contact-links');

  if (contactHeading) {
    gsap.to(contactHeading, {
      opacity: 1,
      duration: d(0.9), ease: 'power3.out',
      scrollTrigger: { trigger: contactHeading, start: 'top 85%' },
    });
  }
  if (contactSub) {
    gsap.to(contactSub, {
      opacity: 1,
      duration: d(0.7), ease: 'power3.out',
      delay: d(0.15),
      scrollTrigger: { trigger: contactSub, start: 'top 88%' },
    });
  }
  if (contactLinks) {
    gsap.to(contactLinks, {
      opacity: 1,
      duration: d(0.7), ease: 'power3.out',
      delay: d(0.25),
      scrollTrigger: { trigger: contactLinks, start: 'top 90%' },
    });
  }
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
