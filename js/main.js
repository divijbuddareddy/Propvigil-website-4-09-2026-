/**
 * PropVigil - Official Client Website Script
 * Handles Section 2 Property Accordions (in-place expand/collapse), FAQ Accordions,
 * Scroll Reveal, Mobile Navigation, and WhatsApp Form Processor
 */

document.addEventListener('DOMContentLoaded', () => {
  initPropertyAccordions();
  initFaqAccordions();
  initFormHandler();
  initMobileNav();
  initScrollReveal();
});

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
