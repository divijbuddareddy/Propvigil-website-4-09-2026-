/**
 * PropVigil - Official Client Website Script
 * Handles Section 2 Property Accordions (in-place expand/collapse), FAQ Accordions,
 * Scroll Reveal, Mobile Navigation, and WhatsApp Form Processor
 */

document.addEventListener('DOMContentLoaded', () => {
  initPropertyAccordions();
  initPropertyTabs();
  initFaqAccordions();
  initFormHandler();
  initMobileNav();
  initScrollReveal();
  initFeeEstimator();
});

// Interactive Property Category Tab Switcher
function initPropertyTabs() {
  const tabBtns = document.querySelectorAll('.prop-tab-btn');
  const tabPanels = document.querySelectorAll('.prop-tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// Section 2 Property Type In-Place Accordion
function initPropertyAccordions() {
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    if (header) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Collapse other accordion items or expand clicked item
        accordionItems.forEach(acc => acc.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

// FAQ Accordion Engine
function initFaqAccordions() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    item.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

// Mobile Menu Navigation Toggle
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }
}

// Scroll Reveal Engine
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));
}

// Form Submission Handler
function initFormHandler() {
  const callbackForm = document.getElementById('callback-form');
  if (callbackForm) {
    callbackForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('field-name').value;
      const country = document.getElementById('field-country').value;
      const phone = document.getElementById('field-phone').value;
      const propType = document.getElementById('field-proptype').value;
      const location = document.getElementById('field-location').value;
      const callTime = document.getElementById('field-calltime').value;
      const notes = document.getElementById('field-notes')?.value || '';

      const message = `Hello PropVigil Team,%0A%0ACallback Request:%0A- Name: ${encodeURIComponent(name)}%0A- Country: ${encodeURIComponent(country)}%0A- Phone: ${encodeURIComponent(phone)}%0A- Property Type: ${encodeURIComponent(propType)}%0A- Location: ${encodeURIComponent(location)}%0A- Preferred Call Time: ${encodeURIComponent(callTime)}${notes ? `%0A- Notes: ${encodeURIComponent(notes)}` : ''}`;

      window.open(`https://wa.me/919242143775?text=${message}`, '_blank');
      alert('Thank you! Your request has been formatted and opened in WhatsApp. We will reply within one working day.');
    });
  }
}

// Interactive Property Fee Estimator Engine
function initFeeEstimator() {
  const propSelect = document.getElementById('est-proptype');
  const zoneSelect = document.getElementById('est-zone');
  const planSelect = document.getElementById('est-plan');
  const priceDisplay = document.getElementById('est-price-val');
  const subtitleDisplay = document.getElementById('est-subtitle');
  const bookBtn = document.getElementById('est-book-btn');

  if (!propSelect || !priceDisplay) return;

  function updateEstimate() {
    const prop = propSelect.value;
    const zone = zoneSelect.value;
    const plan = planSelect.value;

    let firstVisitFee = zone === 'outskirts' ? 3500 : 2500;
    let annualFee = 16000;
    let freqText = '4 inspections / year';

    if (prop === 'site') {
      annualFee = plan === 'monthly' ? 28000 : 16000;
      freqText = plan === 'monthly' ? '12 inspections / year' : '4 inspections / year';
    } else if (prop === 'unoccupied') {
      annualFee = plan === 'monthly' ? 36000 : 22000;
      freqText = plan === 'monthly' ? '12 inspections / year' : '4 inspections / year';
    } else if (prop === 'rented') {
      annualFee = 44000;
      freqText = '12 inspections / year (Monthly)';
    } else if (prop === 'construction') {
      annualFee = plan === 'monthly' ? 36000 : 24000;
      freqText = plan === 'monthly' ? '12 inspections / year' : '4 inspections / year';
    }

    if (plan === 'first_visit') {
      priceDisplay.textContent = `₹${firstVisitFee.toLocaleString('en-IN')}`;
      subtitleDisplay.textContent = `One-time first visit fee (${zone === 'outskirts' ? 'Outskirts' : 'Bengaluru City Limits'}). Credited 100% against your annual plan.`;
    } else {
      priceDisplay.textContent = `₹${annualFee.toLocaleString('en-IN')} / yr`;
      subtitleDisplay.textContent = `${freqText}. Includes geotagged PDF report & WhatsApp video update on every visit.`;
    }

    if (bookBtn) {
      const msg = `Hello PropVigil Team,%0A%0AI used the website estimator:%0A- Property Type: ${encodeURIComponent(propSelect.options[propSelect.selectedIndex].text)}%0A- Zone: ${encodeURIComponent(zoneSelect.options[zoneSelect.selectedIndex].text)}%0A- Plan Selected: ${encodeURIComponent(planSelect.options[planSelect.selectedIndex].text)}%0A- Estimated Fee: ${priceDisplay.textContent}%0A%0APlease confirm my inspection date.`;
      bookBtn.href = `https://wa.me/919242143775?text=${msg}`;
    }
  }

  propSelect.addEventListener('change', updateEstimate);
  zoneSelect.addEventListener('change', updateEstimate);
  planSelect.addEventListener('change', updateEstimate);
  updateEstimate();
}
