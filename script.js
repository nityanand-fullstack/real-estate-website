/**
 * DreamHome Realty – Main JavaScript
 * Features: Sticky Navbar, Smooth Scroll, Scroll Reveal,
 *           Property Filter, Lightbox, EMI Calculator,
 *           Form Validation, FAQ Accordion, Counter Animation,
 *           Active Nav Links, WhatsApp Float
 */

'use strict';

/* =============================================
   GOOGLE SHEETS CONFIG
   ─────────────────────────────────────────
   Paste your Apps Script Web App URL below.
   Leave as-is to run in dev/demo mode (no real submission).
   See Code.gs for full setup instructions.
============================================= */
const SHEETS_CONFIG = {
  scriptUrl: 'YOUR_APPS_SCRIPT_WEB_APP_URL', // ← replace after deploying Code.gs
  sheetName: 'Inquiries'
};

/* =============================================
   CONSTANTS & STATE
============================================= */
const LIGHTBOX_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=85', caption: 'Skyline Heights – Bandra West, Mumbai' },
  { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=85', caption: 'Green Valley Villa – Koregaon Park, Pune' },
  { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=85', caption: 'Azure Penthouse – Whitefield, Bangalore' },
  { src: 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=85', caption: 'Pearl Residency – Gachibowli, Hyderabad' },
  { src: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85', caption: 'Prestige Business Hub – Connaught Place, Delhi' },
  { src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=85', caption: 'Golden Acres – OMR, Chennai' },
];

let currentLightboxIndex = 0;
let countersStarted = false;
let emiChartInstance = null;

/* =============================================
   DOM READY
============================================= */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initSmoothScroll();
  initScrollReveal();
  initActiveNavLinks();
  initPropertyFilter();
  initWishlistButtons();
  initFAQAccordion();
  initEMICalculator();
  initInquiryForm();
  initScrollTop();
  initCounterAnimation();
  // Run initial EMI calculation to populate results on load
  calculateEMI();
});

/* =============================================
   1. STICKY NAVBAR
============================================= */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');

  if (!navbar) return;

  // Scroll shadow
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    updateActiveNavLink();
  }, { passive: true });

  // Mobile menu toggle
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu on nav link click
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) {
        navMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
}

/* =============================================
   2. SMOOTH SCROLL
============================================= */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 76;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* =============================================
   3. SCROLL REVEAL ANIMATIONS
============================================= */
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger delay for sibling cards
        const delay = getSiblingIndex(entry.target) * 80;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));
}

/** Get sibling index for stagger animation */
function getSiblingIndex(el) {
  const parent = el.parentElement;
  if (!parent) return 0;
  const siblings = Array.from(parent.children).filter(c => c.classList.contains('reveal'));
  return siblings.indexOf(el);
}

/* =============================================
   4. ACTIVE NAV LINK HIGHLIGHT
============================================= */
function initActiveNavLinks() {
  window.addEventListener('scroll', updateActiveNavLink, { passive: true });
}

function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 76;
  const scrollY = window.scrollY + navHeight + 60;

  let current = '';
  sections.forEach(section => {
    if (scrollY >= section.offsetTop) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href').replace('#', '');
    if (href === current) link.classList.add('active');
  });
}

/* =============================================
   5. PROPERTY FILTER
============================================= */
function initPropertyFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      filterProperties(filter);
    });
  });
}

/**
 * Filter property cards by category.
 * Also handles hero search bar filter.
 */
function filterProperties(category) {
  const cards = document.querySelectorAll('.property-card');

  // If called from hero search button, get the type value
  if (!category) {
    const typeEl = document.getElementById('search-type');
    category = typeEl ? typeEl.value : 'all';
    if (!category) category = 'all';
    // Scroll to properties section
    const propSection = document.getElementById('properties');
    if (propSection) {
      const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 76;
      window.scrollTo({ top: propSection.offsetTop - navHeight, behavior: 'smooth' });
    }
    // Sync filter tabs
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === category || (category === '' && btn.dataset.filter === 'all'));
    });
  }

  let visibleCount = 0;
  cards.forEach(card => {
    const match = category === 'all' || card.dataset.category === category;
    card.classList.toggle('hidden', !match);
    if (match) {
      visibleCount++;
      // Re-trigger reveal on re-shown cards
      card.classList.remove('visible');
      setTimeout(() => card.classList.add('visible'), 100);
    }
  });

  // Show "no results" message if needed
  const grid = document.getElementById('propertiesGrid');
  let noResultsEl = document.getElementById('noResults');
  if (visibleCount === 0) {
    if (!noResultsEl) {
      noResultsEl = document.createElement('p');
      noResultsEl.id = 'noResults';
      noResultsEl.style.cssText = 'text-align:center;color:var(--text-muted);grid-column:1/-1;padding:2rem;';
      noResultsEl.textContent = 'No properties found for the selected filter. Try another category.';
      grid.appendChild(noResultsEl);
    }
  } else if (noResultsEl) {
    noResultsEl.remove();
  }
}

/* =============================================
   6. WISHLIST TOGGLE
============================================= */
function initWishlistButtons() {
  document.querySelectorAll('.card-wishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const icon = btn.querySelector('i');
      if (btn.classList.contains('active')) {
        icon.classList.replace('fa-regular', 'fa-solid');
        showToast('Added to wishlist!');
      } else {
        icon.classList.replace('fa-solid', 'fa-regular');
        showToast('Removed from wishlist');
      }
    });
  });
}

/* Simple toast notification */
function showToast(message) {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.style.cssText = `
      position:fixed; bottom:6rem; left:50%; transform:translateX(-50%) translateY(20px);
      background:var(--text-dark); color:#fff; padding:.65rem 1.5rem;
      border-radius:50px; font-size:.85rem; z-index:4000;
      opacity:0; transition:.3s ease; pointer-events:none; white-space:nowrap;
      font-family:var(--font); font-weight:500;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2500);
}

/* =============================================
   7. LIGHTBOX GALLERY
============================================= */
function openLightbox(index) {
  currentLightboxIndex = index;
  const modal = document.getElementById('lightboxModal');
  if (!modal) return;
  renderLightboxImage();
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Keyboard navigation
  document.addEventListener('keydown', handleLightboxKey);
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleLightboxKey);
}

function lightboxPrev() {
  currentLightboxIndex = (currentLightboxIndex - 1 + LIGHTBOX_IMAGES.length) % LIGHTBOX_IMAGES.length;
  renderLightboxImage();
}

function lightboxNext() {
  currentLightboxIndex = (currentLightboxIndex + 1) % LIGHTBOX_IMAGES.length;
  renderLightboxImage();
}

function renderLightboxImage() {
  const img     = document.getElementById('lightboxImg');
  const caption = document.getElementById('lightboxCaption');
  const data    = LIGHTBOX_IMAGES[currentLightboxIndex];
  if (!img || !data) return;
  img.style.opacity = '0';
  img.src = data.src;
  img.alt = data.caption;
  img.onload = () => { img.style.transition = 'opacity .3s ease'; img.style.opacity = '1'; };
  if (caption) caption.textContent = data.caption;
}

function handleLightboxKey(e) {
  if (e.key === 'ArrowLeft')  lightboxPrev();
  if (e.key === 'ArrowRight') lightboxNext();
  if (e.key === 'Escape')     closeLightbox();
}

// Close on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('lightboxModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLightbox();
    });
  }
});

/* =============================================
   8. EMI CALCULATOR
============================================= */
function initEMICalculator() {
  // Sync range sliders ↔ number inputs
  linkSlider('loanAmount',   'loanRange',   'loanDisplay',    formatIndianCurrency, false);
  linkSlider('interestRate', 'rateRange',   'rateDisplay',    (v) => v,              false);
  linkSlider('tenure',       'tenureRange', 'tenureDisplay',  (v) => v,              false);
}

function linkSlider(inputId, rangeId, displayId, formatter, _unused) {
  const input   = document.getElementById(inputId);
  const range   = document.getElementById(rangeId);
  const display = document.getElementById(displayId);
  if (!input || !range) return;

  const update = (val) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      range.value = num;
      if (display) display.textContent = formatter(num);
    }
  };

  input.addEventListener('input', () => { update(input.value); calculateEMI(); });
  range.addEventListener('input', () => {
    input.value = range.value;
    update(range.value);
    calculateEMI();
  });
}

function formatIndianCurrency(amount) {
  const num = parseInt(amount);
  if (num >= 10000000) return (num / 10000000).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
  if (num >= 100000)   return (num / 100000).toFixed(2).replace(/\.?0+$/, '') + ' L';
  return num.toLocaleString('en-IN');
}

function formatCurrencyFull(amount) {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function calculateEMI() {
  const principal    = parseFloat(document.getElementById('loanAmount')?.value)   || 5000000;
  const annualRate   = parseFloat(document.getElementById('interestRate')?.value) || 8.5;
  const tenureYears  = parseFloat(document.getElementById('tenure')?.value)        || 20;

  const monthlyRate = annualRate / 12 / 100;
  const months      = tenureYears * 12;

  let emi;
  if (monthlyRate === 0) {
    emi = principal / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    emi = (principal * monthlyRate * factor) / (factor - 1);
  }

  const totalPayable  = emi * months;
  const totalInterest = totalPayable - principal;

  // Update DOM
  const emiValEl       = document.getElementById('emiValue');
  const principalDisp  = document.getElementById('principalDisplay');
  const totalInterestEl= document.getElementById('totalInterest');
  const totalPayableEl = document.getElementById('totalPayable');

  if (emiValEl)        emiValEl.textContent        = formatCurrencyFull(emi);
  if (principalDisp)   principalDisp.textContent   = formatCurrencyFull(principal);
  if (totalInterestEl) totalInterestEl.textContent = formatCurrencyFull(totalInterest);
  if (totalPayableEl)  totalPayableEl.textContent  = formatCurrencyFull(totalPayable);

  // Update display labels
  const loanDisplay = document.getElementById('loanDisplay');
  if (loanDisplay) loanDisplay.textContent = formatIndianCurrency(principal);
  const rateDisplay = document.getElementById('rateDisplay');
  if (rateDisplay) rateDisplay.textContent = annualRate;
  const tenureDisplay = document.getElementById('tenureDisplay');
  if (tenureDisplay) tenureDisplay.textContent = tenureYears;

  // Draw donut chart
  drawEMIChart(principal, totalInterest);
}

function drawEMIChart(principal, interest) {
  const canvas = document.getElementById('emiChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = principal + interest;
  const principalRatio = principal / total;
  const interestRatio  = interest  / total;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r  = Math.min(w, h) / 2 - 12;
  const inner = r * 0.55;

  ctx.clearRect(0, 0, w, h);

  // Draw principal arc (deep blue)
  const start1 = -Math.PI / 2;
  const end1   = start1 + (2 * Math.PI * principalRatio);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, start1, end1);
  ctx.closePath();
  ctx.fillStyle = '#1a3c6e';
  ctx.fill();

  // Draw interest arc (gold)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, end1, start1 + 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = '#e8a020';
  ctx.fill();

  // Hollow center
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#1a2240';
  ctx.font      = `bold 13px Poppins, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.round(principalRatio * 100) + '%', cx, cy - 8);
  ctx.font = `11px Poppins, sans-serif`;
  ctx.fillStyle = '#7b839e';
  ctx.fillText('Principal', cx, cy + 10);
}

/* =============================================
   9. INQUIRY FORM VALIDATION
============================================= */
function initInquiryForm() {
  const form = document.getElementById('inquiryForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm()) {
      submitForm();
    }
  });

  // Real-time validation
  ['clientName', 'clientPhone', 'clientEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', () => validateField(id));
    if (el) el.addEventListener('input', () => clearError(id));
  });
}

function validateForm() {
  let isValid = true;
  if (!validateField('clientName'))  isValid = false;
  if (!validateField('clientPhone')) isValid = false;
  if (!validateField('clientEmail')) isValid = false;
  return isValid;
}

function validateField(id) {
  const el    = document.getElementById(id);
  if (!el) return true;
  const value = el.value.trim();

  if (id === 'clientName') {
    if (value.length < 2) {
      setError(el, 'nameError', 'Please enter your full name (at least 2 characters).');
      return false;
    }
  }
  if (id === 'clientPhone') {
    const phoneRegex = /^[+]?[0-9\s\-()]{7,15}$/;
    if (!phoneRegex.test(value)) {
      setError(el, 'phoneError', 'Please enter a valid phone number.');
      return false;
    }
  }
  if (id === 'clientEmail') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setError(el, 'emailError', 'Please enter a valid email address.');
      return false;
    }
  }

  clearError(id);
  return true;
}

function setError(el, errorId, message) {
  el.classList.add('error');
  const errEl = document.getElementById(errorId);
  if (errEl) errEl.textContent = message;
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('error');
  // Determine error element ID
  const errorMap = { clientName: 'nameError', clientPhone: 'phoneError', clientEmail: 'emailError' };
  const errElId = errorMap[id];
  if (errElId) {
    const errEl = document.getElementById(errElId);
    if (errEl) errEl.textContent = '';
  }
}

/**
 * Collects all inquiry form values into a plain object.
 * @returns {Object}
 */
function collectFormData() {
  return {
    name:             document.getElementById('clientName')?.value.trim()    || '',
    phone:            document.getElementById('clientPhone')?.value.trim()   || '',
    email:            document.getElementById('clientEmail')?.value.trim()   || '',
    budget:           document.getElementById('clientBudget')?.value         || '',
    propertyType:     document.getElementById('clientType')?.value           || '',
    message:          document.getElementById('clientMessage')?.value.trim() || '',
    propertyInterest: document.getElementById('formPropertyName')?.value     || '',
    sourceUrl:        window.location.href
  };
}

/**
 * Shows an inline error banner below the submit button.
 * Clears automatically when the user starts editing any field.
 * @param {string} message
 */
function showFormError(message) {
  const form = document.getElementById('inquiryForm');
  if (!form) return;

  // Remove any existing banner first
  const old = document.getElementById('formErrorBanner');
  if (old) old.remove();

  const banner = document.createElement('div');
  banner.id = 'formErrorBanner';
  banner.setAttribute('role', 'alert');
  banner.style.cssText = [
    'display:flex', 'align-items:center', 'gap:.6rem',
    'padding:.85rem 1.1rem', 'margin-top:1rem',
    'background:#fef2f2', 'color:#b91c1c',
    'border:1px solid #fecaca', 'border-radius:10px',
    'font-size:.88rem', 'font-weight:500',
    'font-family:var(--font)'
  ].join(';');
  banner.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> ' + message;

  // Insert after the submit button
  const btn = document.getElementById('submitBtn');
  if (btn && btn.parentNode) {
    btn.parentNode.insertBefore(banner, btn.nextSibling);
  } else {
    form.appendChild(banner);
  }

  // Auto-dismiss when user starts correcting the form
  const dismiss = () => { banner.remove(); form.removeEventListener('input', dismiss); };
  form.addEventListener('input', dismiss);
}

/**
 * Submits the collected form data to Google Sheets via the
 * Apps Script Web App. Falls back to a demo-mode simulation
 * when SHEETS_CONFIG.scriptUrl has not been configured yet.
 */
async function submitForm() {
  const btn  = document.getElementById('submitBtn');
  const data = collectFormData();

  // Disable button and show spinner
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
  }

  // ── Dev / demo mode: scriptUrl not configured yet ──
  if (!SHEETS_CONFIG.scriptUrl || SHEETS_CONFIG.scriptUrl === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
    console.info('[DreamHome] Google Sheets URL not set – running in demo mode.');
    await new Promise(r => setTimeout(r, 1200)); // simulate network delay
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Inquiry';
    }
    document.getElementById('inquiryForm')?.reset();
    openPopup();
    return;
  }

  // ── Live mode: POST to Google Apps Script ──
  try {
    /*
     * Content-Type: text/plain avoids a CORS preflight (OPTIONS request).
     * Google Apps Script does not respond to OPTIONS, so using
     * 'application/json' would fail silently. The body is still valid JSON;
     * Apps Script reads it from e.postData.contents.
     */
    const response = await fetch(SHEETS_CONFIG.scriptUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body:    JSON.stringify(data)
    });

    // Apps Script always returns 200; check our own status field
    const result = await response.json();

    if (result.status === 'success') {
      document.getElementById('inquiryForm')?.reset();
      openPopup();
    } else {
      throw new Error(result.message || 'Unexpected response from server.');
    }

  } catch (err) {
    console.error('[DreamHome] Submission error:', err);
    showFormError(
      'Something went wrong. Please try again or contact us directly at ' +
      '<a href="tel:+919876543210" style="color:#b91c1c">+91 98765 43210</a>.'
    );
  } finally {
    // Always re-enable the button so the user can retry
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Inquiry';
    }
  }
}

/** Open inquiry form with pre-filled property name */
function openInquiry(propertyName) {
  const hiddenEl = document.getElementById('formPropertyName');
  if (hiddenEl) hiddenEl.value = propertyName;
  const contact = document.getElementById('contact');
  if (contact) {
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 76;
    window.scrollTo({ top: contact.offsetTop - navHeight, behavior: 'smooth' });
  }
  setTimeout(() => {
    const nameField = document.getElementById('clientName');
    if (nameField) nameField.focus();
  }, 700);
}

/* =============================================
   10. SUCCESS POPUP
============================================= */
function openPopup() {
  const popup = document.getElementById('successPopup');
  if (!popup) return;
  popup.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePopup() {
  const popup = document.getElementById('successPopup');
  if (!popup) return;
  popup.classList.remove('open');
  document.body.style.overflow = '';
}

// Close popup on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('successPopup');
  if (popup) {
    popup.addEventListener('click', (e) => {
      if (e.target === popup) closePopup();
    });
  }
});

/* =============================================
   11. FAQ ACCORDION
============================================= */
function initFAQAccordion() {
  const questions = document.querySelectorAll('.faq-question');
  questions.forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.closest('.faq-item');
      const isOpen  = faqItem.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('open');
        item.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked
      if (!isOpen) {
        faqItem.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* =============================================
   12. SCROLL TO TOP
============================================= */
function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* =============================================
   13. COUNTER ANIMATION
============================================= */
function initCounterAnimation() {
  // Watch hero stats counters
  const heroStats = document.querySelector('.hero-stats');
  if (!heroStats) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !countersStarted) {
      countersStarted = true;
      animateAllCounters();
    }
  }, { threshold: 0.5 });

  observer.observe(heroStats);
}

function animateAllCounters() {
  // Hero counters
  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    animateCounter(el, parseInt(el.dataset.target), 2000);
  });
  // About section counters
  document.querySelectorAll('.about-stat-num[data-target]').forEach(el => {
    animateCounter(el, parseInt(el.dataset.target), 2000);
  });
}

function animateCounter(el, target, duration) {
  const start     = performance.now();
  const startVal  = 0;

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.round(startVal + (target - startVal) * eased);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }

  requestAnimationFrame(step);
}

/* Also trigger about stats when they come into view */
document.addEventListener('DOMContentLoaded', () => {
  const aboutStats = document.querySelector('.about-stats');
  if (!aboutStats) return;

  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      document.querySelectorAll('.about-stat-num[data-target]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.target), 1800);
      });
      obs.disconnect();
    }
  }, { threshold: 0.5 });

  obs.observe(aboutStats);
});

/* =============================================
   14. KEYBOARD ACCESSIBILITY – ESC closes modals
============================================= */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const lightbox = document.getElementById('lightboxModal');
    const popup    = document.getElementById('successPopup');
    if (lightbox?.classList.contains('open')) closeLightbox();
    if (popup?.classList.contains('open'))    closePopup();
  }
});

/* =============================================
   15. EXPOSE GLOBALS (called from HTML onclick)
============================================= */
window.filterProperties = filterProperties;
window.openLightbox     = openLightbox;
window.closeLightbox    = closeLightbox;
window.lightboxPrev     = lightboxPrev;
window.lightboxNext     = lightboxNext;
window.calculateEMI     = calculateEMI;
window.openInquiry      = openInquiry;
window.openPopup        = openPopup;
window.closePopup       = closePopup;
