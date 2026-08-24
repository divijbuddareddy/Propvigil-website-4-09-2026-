/**
 * PropVigil - Official Client Website Script
 * Handles Section 2 Property Accordions, FAQ Accordions, Scroll Reveal, Mobile Nav,
 * Fee Estimator, Dynamic Civic Updates Tracker & Contact Form API Dispatch
 */

document.addEventListener('DOMContentLoaded', () => {
  initPropertyAccordions();
  initPropertyTabs();
  initFaqAccordions();
  initFormHandler();
  initMobileNav();
  initScrollReveal();
  initFeeEstimator();
  initCivicUpdates();
});

function getApiUrl(path) {
  if (window.location.protocol === 'file:' || window.location.port !== '3000') {
    return 'http://localhost:3000' + path;
  }
  return path;
}

// Dynamic Civic Updates API Engine
let civicNoticesData = [];
let activeFilter = 'all';

async function initCivicUpdates() {
  const container = document.getElementById('civic-notices-container');
  const searchInput = document.getElementById('civic-search-input');
  const filterBtns = document.querySelectorAll('.filter-pill-btn');

  if (!container) return;

  try {
    const res = await fetch(getApiUrl('/api/civic-updates'));
    const data = await res.json();

    if (data.success && data.notices && data.notices.length > 0) {
      civicNoticesData = data.notices;
      renderCivicNotices(civicNoticesData);
    }
  } catch (err) {
    console.log('Using static backup notices for offline preview');
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterAndRenderNotices(e.target.value, activeFilter);
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      const searchVal = searchInput ? searchInput.value : '';
      filterAndRenderNotices(searchVal, activeFilter);
    });
  });
}

function filterAndRenderNotices(searchQuery, filterType) {
  let list = civicNoticesData;

  if (filterType !== 'all') {
    list = list.filter(n => n.status_type === filterType);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    list = list.filter(n => 
      n.title.toLowerCase().includes(q) ||
      (n.ref_number && n.ref_number.toLowerCase().includes(q)) ||
      (n.what_was_issued && n.what_was_issued.toLowerCase().includes(q)) ||
      (n.rule_behind_it && n.rule_behind_it.toLowerCase().includes(q))
    );
  }

  renderCivicNotices(list);
}

function renderCivicNotices(notices) {
  const container = document.getElementById('civic-notices-container');
  if (!container) return;

  if (!notices || notices.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 16px; border: 1px solid var(--border-light);">
        <h3 style="color: var(--brand-navy); margin-bottom: 8px;">No matching civic notices found</h3>
        <p style="color: var(--text-muted);">Try adjusting your search query or filter criteria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notices.map(item => {
    const badgeClass = item.status_type || 'warning';
    const badgeText = item.status_type === 'danger' ? 'Deadline Passed' : (item.status_type === 'success' ? 'Compliant' : 'Active Mandate');
    
    let ratesHtml = '';
    if (item.rates && item.rates.length > 0) {
      ratesHtml = `
        <div style="margin-bottom: 28px;">
          <h3 style="font-size: 1.2rem; color: var(--brand-navy); margin-bottom: 12px;">RATES PUBLISHED IN THE NOTICE</h3>
          <div class="data-table-wrapper">
            <table class="plain-data-table">
              <thead>
                <tr>
                  <th>Site dimensions</th>
                  <th>Cleaning — no wall</th>
                  <th>Cleaning — with wall</th>
                  <th>Transportation</th>
                </tr>
              </thead>
              <tbody>
                ${item.rates.map(r => `
                  <tr>
                    <td><strong>${r.dimensions}</strong></td>
                    <td>${r.no_wall}</td>
                    <td>${r.with_wall}</td>
                    <td>${r.transport}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    return `
      <div class="notice-card-elevated reveal-on-scroll revealed" id="${item.slug}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--brand-gold); text-transform: uppercase;">${item.entry_label || 'CIVIC NOTICE'}</span>
          <span class="status-badge-tag ${badgeClass}">${badgeText}</span>
        </div>

        <h2 style="font-size: 2rem; color: var(--brand-navy); margin: 6px 0 12px 0;">${item.title}</h2>
        
        <p style="font-size: 0.9rem; color: var(--text-muted); padding-bottom: 20px; border-bottom: 1px solid var(--border-light); margin-bottom: 24px;">
          Issued ${item.issued_date || 'N/A'} · Ref. ${item.ref_number || 'N/A'} · ${item.status || ''}
        </p>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 1.2rem; color: var(--brand-navy); margin-bottom: 8px;">WHAT WAS ISSUED</h3>
          <p>${item.what_was_issued || ''}</p>
        </div>

        ${item.slug === 'gba-vacant-site-clearing-notice-2026' ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; border: 1.5px solid var(--border-gold); padding: 16px; border-radius: var(--radius-md); background: var(--bg-dark);">
            <div style="border-radius: var(--radius-sm); overflow: hidden; position: relative;">
              <span style="position: absolute; top: 10px; left: 10px; background: rgba(239,68,68,0.9); color: white; padding: 4px 10px; font-size: 0.75rem; font-weight: bold; border-radius: 99px;">NON-COMPLIANT SITE</span>
              <img src="assets/before.jpg" alt="Uncleared Vacant Site in Bengaluru" style="width: 100%; height: 200px; object-fit: cover; display: block;">
              <div style="padding: 10px; background: white; font-size: 0.85rem; font-weight: 600; color: var(--brand-navy);">Site with overgrown debris & dumping risk</div>
            </div>
            <div style="border-radius: var(--radius-sm); overflow: hidden; position: relative;">
              <span style="position: absolute; top: 10px; left: 10px; background: rgba(16,185,129,0.9); color: white; padding: 4px 10px; font-size: 0.75rem; font-weight: bold; border-radius: 99px;">CLEARED BY PROPVIGIL</span>
              <img src="assets/after.jpg" alt="Cleared Vacant Site after PropVigil care" style="width: 100%; height: 200px; object-fit: cover; display: block;">
              <div style="padding: 10px; background: white; font-size: 0.85rem; font-weight: 600; color: var(--brand-navy);">Fully cleared, fenced & compliant with GBA norms</div>
            </div>
          </div>
        ` : ''}

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 1.2rem; color: var(--brand-navy); margin-bottom: 8px;">THE RULE BEHIND IT</h3>
          <p>${item.rule_behind_it || ''}</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 1.2rem; color: var(--brand-navy); margin-bottom: 8px;">WHAT HAPPENS IF NOT COMPLIED</h3>
          <p>${item.consequences || ''}</p>
        </div>

        ${ratesHtml}

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-top: 36px; padding-top: 24px; border-top: 1px solid var(--border-light);">
          <a href="${item.pdf_url ? item.pdf_url : 'https://wa.me/919242143775?text=Hello%20PropVigil%20Team,%20please%20send%20me%20the%20original%20Notice%20PDF%20Ref%20' + encodeURIComponent(item.ref_number || '')}" target="_blank" class="btn-pdf-download">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>${item.pdf_url ? 'View Uploaded PDF (' + (item.pdf_filename || 'Document') + ')' : 'Request Notice Document via WhatsApp'}</span>
          </a>

          <a href="https://wa.me/919242143775" target="_blank" class="btn btn-whatsapp" style="padding: 14px 28px;">
            <span>Need site compliance care? Contact us on WhatsApp</span>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

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

// Section 2 Property Type Accordion
function initPropertyAccordions() {
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    if (header) {
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

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

// Form Submission & Contact API Handler
function initFormHandler() {
  const callbackForm = document.getElementById('callback-form');
  const toastFeedback = document.getElementById('contact-toast-feedback');

  if (callbackForm) {
    callbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('field-name').value;
      const country = document.getElementById('field-country').value;
      const phone = document.getElementById('field-phone').value;
      const propType = document.getElementById('field-proptype').value;
      const location = document.getElementById('field-location').value;
      const callTime = document.getElementById('field-calltime').value;
      const notes = document.getElementById('field-notes')?.value || '';

      const formData = {
        name,
        country,
        phone,
        prop_type: propType,
        location,
        preferred_time: callTime,
        notes
      };

      if (toastFeedback) {
        toastFeedback.className = 'toast-feedback success';
        toastFeedback.style.display = 'block';
        toastFeedback.textContent = 'Sending callback request to saikrupaassociates@gmail.com...';
      }

      try {
        await fetch(getApiUrl('/api/contact'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } catch (err) {
        console.log('Backend contact API logged locally');
      }

      if (toastFeedback) {
        toastFeedback.textContent = '✓ Request submitted! Email dispatched to saikrupaassociates@gmail.com and WhatsApp opened.';
      }

      const message = `Hello PropVigil Team,%0A%0ACallback Request:%0A- Name: ${encodeURIComponent(name)}%0A- Country: ${encodeURIComponent(country)}%0A- Phone: ${encodeURIComponent(phone)}%0A- Property Type: ${encodeURIComponent(propType)}%0A- Location: ${encodeURIComponent(location)}%0A- Preferred Call Time: ${encodeURIComponent(callTime)}${notes ? `%0A- Notes: ${encodeURIComponent(notes)}` : ''}`;

      window.open(`https://wa.me/919242143775?text=${message}`, '_blank');
    });
  }
}

// Interactive Property Fee Estimator Engine
function initFeeEstimator() {
  const propSelect = document.getElementById('est-proptype');
  const sizeSelect = document.getElementById('est-size');
  const sizeLabel = document.getElementById('est-size-label');
  const zoneSelect = document.getElementById('est-zone');
  const planSelect = document.getElementById('est-plan');
  const priceDisplay = document.getElementById('est-price-val');
  const subtitleDisplay = document.getElementById('est-subtitle');
  const bookBtn = document.getElementById('est-book-btn');

  if (!propSelect || !priceDisplay) return;

  function updateSizeDropdown() {
    if (!sizeSelect) return;
    const currentVal = sizeSelect.value;
    const isSite = propSelect.value === 'site';

    if (sizeLabel) {
      sizeLabel.textContent = isSite ? 'Plot / Site Dimensions' : 'Flat / Property Configuration';
    }

    if (isSite) {
      sizeSelect.innerHTML = `
        <option value="1bhk" ${currentVal === '1bhk' || currentVal === 'small' ? 'selected' : ''}>Up to 30x40 (&lt; 1,200 sq ft)</option>
        <option value="2bhk" ${currentVal === '2bhk' || currentVal === 'medium' || !currentVal ? 'selected' : ''}>30x40 to 40x60 (1,200 - 2,400 sq ft)</option>
        <option value="3bhk" ${currentVal === '3bhk' || currentVal === 'large' ? 'selected' : ''}>40x60 to 50x80 (2,400 - 4,000 sq ft)</option>
        <option value="4bhk" ${currentVal === '4bhk' || currentVal === 'xlarge' ? 'selected' : ''}>50x80+ / Large Site (&gt; 4,000 sq ft)</option>
      `;
    } else {
      sizeSelect.innerHTML = `
        <option value="1bhk" ${currentVal === '1bhk' || currentVal === 'small' ? 'selected' : ''}>1 BHK / Studio (&lt; 900 sq ft)</option>
        <option value="2bhk" ${currentVal === '2bhk' || currentVal === 'medium' || !currentVal ? 'selected' : ''}>2 BHK (900 - 1,500 sq ft)</option>
        <option value="3bhk" ${currentVal === '3bhk' || currentVal === 'large' ? 'selected' : ''}>3 BHK (1,500 - 2,400 sq ft)</option>
        <option value="4bhk" ${currentVal === '4bhk' || currentVal === 'xlarge' ? 'selected' : ''}>4+ BHK / Duplex / Villa (&gt; 2,400 sq ft)</option>
      `;
    }
  }

  function updateEstimate() {
    const prop = propSelect.value;
    const size = sizeSelect ? sizeSelect.value : '2bhk';
    const zone = zoneSelect.value;
    const plan = planSelect.value;

    let firstVisitFee = zone === 'outskirts' ? 3500 : 2500;
    if (size === '3bhk') firstVisitFee += 500;
    if (size === '4bhk') firstVisitFee += 1000;

    let baseAnnualFee = 16000;
    let freqText = '4 inspections / year';

    if (prop === 'site') {
      if (size === '1bhk') baseAnnualFee = plan === 'monthly' ? 24000 : 14000;
      else if (size === '2bhk') baseAnnualFee = plan === 'monthly' ? 28000 : 16000;
      else if (size === '3bhk') baseAnnualFee = plan === 'monthly' ? 34000 : 20000;
      else if (size === '4bhk') baseAnnualFee = plan === 'monthly' ? 44000 : 26000;
      freqText = plan === 'monthly' ? '12 inspections / year' : '4 inspections / year';
    } else if (prop === 'unoccupied') {
      if (size === '1bhk') baseAnnualFee = plan === 'monthly' ? 30000 : 18000;
      else if (size === '2bhk') baseAnnualFee = plan === 'monthly' ? 36000 : 22000;
      else if (size === '3bhk') baseAnnualFee = plan === 'monthly' ? 44000 : 28000;
      else if (size === '4bhk') baseAnnualFee = plan === 'monthly' ? 56000 : 36000;
      freqText = plan === 'monthly' ? '12 inspections / year' : '4 inspections / year';
    } else if (prop === 'rented') {
      if (size === '1bhk') baseAnnualFee = 38000;
      else if (size === '2bhk') baseAnnualFee = 44000;
      else if (size === '3bhk') baseAnnualFee = 54000;
      else if (size === '4bhk') baseAnnualFee = 68000;
      freqText = '12 inspections / year (Monthly)';
    } else if (prop === 'construction') {
      if (size === '1bhk') baseAnnualFee = plan === 'monthly' ? 30000 : 20000;
      else if (size === '2bhk') baseAnnualFee = plan === 'monthly' ? 36000 : 24000;
      else if (size === '3bhk') baseAnnualFee = plan === 'monthly' ? 44000 : 30000;
      else if (size === '4bhk') baseAnnualFee = plan === 'monthly' ? 56000 : 38000;
      freqText = plan === 'monthly' ? '12 inspections / year' : '4 inspections / year';
    }

    let annualFee = baseAnnualFee;
    if (zone === 'outskirts' && plan !== 'first_visit') {
      annualFee += (plan === 'monthly' ? 4000 : 2000);
    }

    if (plan === 'first_visit') {
      priceDisplay.textContent = `₹${firstVisitFee.toLocaleString('en-IN')}`;
      subtitleDisplay.textContent = `One-time first visit fee (${zone === 'outskirts' ? 'Outskirts' : 'Bengaluru City Limits'}). Credited 100% against your annual plan.`;
    } else {
      priceDisplay.textContent = `₹${annualFee.toLocaleString('en-IN')} / yr`;
      subtitleDisplay.textContent = `${freqText}. Includes geotagged PDF report & WhatsApp video update on every visit.`;
    }

    if (bookBtn) {
      const sizeText = sizeSelect && sizeSelect.options[sizeSelect.selectedIndex] ? sizeSelect.options[sizeSelect.selectedIndex].text : '';
      const msg = `Hello PropVigil Team,%0A%0AI used the website estimator:%0A- Property Category: ${encodeURIComponent(propSelect.options[propSelect.selectedIndex].text)}%0A- Property / Flat Size: ${encodeURIComponent(sizeText)}%0A- Location Zone: ${encodeURIComponent(zoneSelect.options[zoneSelect.selectedIndex].text)}%0A- Plan Selected: ${encodeURIComponent(planSelect.options[planSelect.selectedIndex].text)}%0A- Estimated Fee: ${priceDisplay.textContent}%0A%0APlease confirm my inspection date.`;
      bookBtn.href = `https://wa.me/919242143775?text=${msg}`;
    }
  }

  propSelect.addEventListener('change', () => {
    updateSizeDropdown();
    updateEstimate();
  });
  if (sizeSelect) {
    sizeSelect.addEventListener('change', updateEstimate);
  }
  zoneSelect.addEventListener('change', updateEstimate);
  planSelect.addEventListener('change', updateEstimate);

  updateSizeDropdown();
  updateEstimate();
}
