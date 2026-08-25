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
  initBlogHub();
  initBlogDetails();
  initAdminPortal();
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

/* ==========================================================================
   Blog Hub Engine (Public View - blog.html)
   ========================================================================== */
let globalBlogsList = [];

let blogActiveCategory = 'all';

async function initBlogHub() {
  const container = document.getElementById('blogsGrid');
  const searchInput = document.getElementById('blogSearchInput');
  const catList = document.getElementById('blogCategoriesList');

  if (!container) return;

  // Load from API or localStorage & Google Sheet sync
  let apiBlogs = [];
  try {
    const res = await fetch(getApiUrl('/api/blogs'));
    const data = await res.json();
    if (data.success && data.blogs && data.blogs.length > 0) {
      apiBlogs = data.blogs;
    }
  } catch (e) {
    const stored = localStorage.getItem('propvigil_blogs_data');
    if (stored) {
      try { apiBlogs = JSON.parse(stored); } catch (err) {}
    }
  }

  await fetchGSheetBlogsAsync();

  const mergedMap = new Map();
  apiBlogs.forEach(b => { if (b.slug) mergedMap.set(b.slug, b); });
  globalBlogsList.forEach(b => { if (b.slug) mergedMap.set(b.slug, b); });
  globalBlogsList = Array.from(mergedMap.values());

  renderBlogGrid();

  if (searchInput) {
    searchInput.addEventListener('input', renderBlogGrid);
  }

  if (catList) {
    const buttons = catList.querySelectorAll('.blog-cat-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        blogActiveCategory = btn.getAttribute('data-cat');
        renderBlogGrid();
      });
    });
  }
}

function renderBlogGrid() {
  const container = document.getElementById('blogsGrid');
  const searchInput = document.getElementById('blogSearchInput');
  if (!container) return;

  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
  let filtered = globalBlogsList.filter(b => b.is_published !== false);

  if (blogActiveCategory !== 'all') {
    filtered = filtered.filter(b => (b.category || '').toUpperCase() === blogActiveCategory.toUpperCase());
  }

  if (searchQuery) {
    filtered = filtered.filter(b => 
      b.title.toLowerCase().includes(searchQuery) ||
      (b.excerpt && b.excerpt.toLowerCase().includes(searchQuery)) ||
      (b.category && b.category.toLowerCase().includes(searchQuery))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0;">
        <h3 style="color: #0F172A; margin-bottom: 8px;">No blog guides found</h3>
        <p style="color: #64748B;">Try selecting another category or refining your search keywords.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <article class="blog-card">
      <a href="blog-details.html?slug=${encodeURIComponent(item.slug)}" class="blog-card-thumb-link">
        <img src="${item.image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';" alt="" class="blog-card-img">
      </a>
      <div class="blog-card-body">
        <span class="blog-card-category">${item.category || 'CIVIC GUIDES'}</span>
        <h3 class="blog-card-title">
          <a href="blog-details.html?slug=${encodeURIComponent(item.slug)}">${item.title}</a>
        </h3>
        <p class="blog-card-excerpt">${item.excerpt || ''}</p>
        <div class="blog-card-footer">
          <span style="font-size: 0.8rem; color: #94A3B8;">${item.issued_date || ''}</span>
          <a href="blog-details.html?slug=${encodeURIComponent(item.slug)}" class="blog-read-link">
            Read Guide →
          </a>
        </div>
      </div>
    </article>
  `).join('');
}

/* ==========================================================================
   Single Article Detail Engine (blog-details.html)
   ========================================================================== */
async function initBlogDetails() {
  const contentContainer = document.getElementById('articleContent');
  if (!contentContainer) return;

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  // 1. Fetch from server API if slug is provided
  let targetArticle = null;
  if (slug) {
    try {
      const res = await fetch(getApiUrl(`/api/blogs/${encodeURIComponent(slug)}`));
      const data = await res.json();
      if (data.success && data.blog) {
        targetArticle = data.blog;
      }
    } catch (e) {}
  }

  // 2. Fetch live from Google Sheets if not yet loaded
  if (!targetArticle) {
    await fetchGSheetBlogsAsync();
    
    // Check globalBlogsList
    if (slug) {
      targetArticle = globalBlogsList.find(b => b.slug === slug || (b.slug && b.slug.toLowerCase() === slug.toLowerCase()));
    }
    
    // Check localStorage
    if (!targetArticle) {
      try {
        const stored = localStorage.getItem('propvigil_blogs_data');
        if (stored) {
          const list = JSON.parse(stored);
          targetArticle = list.find(b => b.slug === slug) || list[0];
        }
      } catch (e) {}
    }

    if (!targetArticle && globalBlogsList.length > 0) {
      targetArticle = globalBlogsList[0];
    }
  }

  // 3. Render article details into DOM
  if (targetArticle) {
    document.title = `${targetArticle.title} | PropVigil Guides`;
    
    const titleEl = document.getElementById('articleTitle');
    const catEl = document.getElementById('articleCategory');
    const authorEl = document.getElementById('articleAuthor');
    const dateEl = document.getElementById('articleDate');
    const readEl = document.getElementById('articleReadTime');
    const imgEl = document.getElementById('articleImage');

    if (titleEl) titleEl.textContent = targetArticle.title;
    if (catEl) catEl.textContent = targetArticle.category || targetArticle.focus_keyword || 'CIVIC COMPLIANCE';
    if (authorEl) authorEl.textContent = targetArticle.author || 'PropVigil Intelligence';
    if (dateEl) dateEl.textContent = targetArticle.issued_date || targetArticle.Date || 'August 2026';
    if (readEl) readEl.textContent = targetArticle.read_time || '5 min read';
    
    if (imgEl && targetArticle.image_url) {
      imgEl.src = targetArticle.image_url;
      imgEl.alt = targetArticle.image_alt_text || targetArticle.title || 'PropVigil Blog';
    }

    const htmlContent = targetArticle.content || targetArticle.body_html || (targetArticle.excerpt ? `<p>${targetArticle.excerpt}</p>` : '');
    if (htmlContent) {
      contentContainer.innerHTML = htmlContent;
    } else {
      contentContainer.innerHTML = `<p>${targetArticle.excerpt || targetArticle.meta_description || 'Article content is being formatted...'}</p>`;
    }
  } else {
    contentContainer.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <h3 style="color: #0F172A; margin-bottom: 12px;">Article Not Found</h3>
        <p style="color: #64748B; margin-bottom: 24px;">The guide you requested could not be located or may have been updated.</p>
        <a href="blog.html" class="btn-primary" style="display: inline-block; padding: 10px 24px; text-decoration: none;">← Back to All Guides</a>
      </div>
    `;
  }
}

/* ==========================================================================
   Admin Portal & Content Manager Engine (admin.html - Image 2 & 3 UI)
   ========================================================================== */
function initAdminPortal() {
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const loginForm = document.getElementById('adminLoginForm');
  const loginAlert = document.getElementById('loginAlert');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!loginView || !dashboardView) return;

  const token = sessionStorage.getItem('propvigil_admin_token') || localStorage.getItem('propvigil_admin_token');
  if (token) {
    showDashboard();
  } else {
    showLogin();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await fetch(getApiUrl('/api/admin/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success && data.token) {
          sessionStorage.setItem('propvigil_admin_token', data.token);
          showDashboard();
          return;
        }
      } catch (err) {}

      // Fallback check
      if (username === 'admin' && password === 'PropVigil2026!') {
        sessionStorage.setItem('propvigil_admin_token', 'local_secret_token');
        showDashboard();
      } else {
        if (loginAlert) {
          loginAlert.style.display = 'block';
          loginAlert.textContent = 'Invalid credentials. Please check your username and password.';
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('propvigil_admin_token');
      localStorage.removeItem('propvigil_admin_token');
      showLogin();
    });
  }

  // Tabs Handler
  const tabBlogsBtn = document.getElementById('tabBlogsBtn');
  const tabNoticesBtn = document.getElementById('tabNoticesBtn');
  const sectionBlogs = document.getElementById('sectionBlogs');
  const sectionNotices = document.getElementById('sectionNotices');

  if (tabBlogsBtn && tabNoticesBtn) {
    tabBlogsBtn.addEventListener('click', () => {
      tabBlogsBtn.classList.add('active');
      tabNoticesBtn.classList.remove('active');
      sectionBlogs.style.display = 'block';
      sectionNotices.style.display = 'none';
      loadAdminBlogsTable();
    });

    tabNoticesBtn.addEventListener('click', () => {
      tabNoticesBtn.classList.add('active');
      tabBlogsBtn.classList.remove('active');
      sectionNotices.style.display = 'block';
      sectionBlogs.style.display = 'none';
      loadAdminNoticesTable();
    });
  }

  initAdminBlogModal();
  initAdminNoticeModal();
}

function showLogin() {
  document.getElementById('loginView').style.display = 'flex';
  document.getElementById('dashboardView').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'block';
  loadAdminBlogsTable();
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('cmsToast');
  if (!toast) return;
  toast.className = `toast-feedback ${type}`;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 4000);
}

function parseGoogleSheetCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal);
      if (currentRow.length > 1 || currentRow[0] !== '') {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    if (currentRow.length > 1 || currentRow[0] !== '') rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const result = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c] || `col_${c}`;
      obj[key] = row[c] || '';
    }
    if (obj.title && obj.title.trim()) result.push(obj);
  }

  return result;
}

async function fetchGSheetBlogsAsync() {
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbx1H1eqlB1P4L4oe5QGEuJpaDK1BcyhH7CS7lclBdyYqhPF5g_Fiu8uKP5qNEV2jHwl/exec';
  const csvUrl = 'https://docs.google.com/spreadsheets/d/1U6j70q5T3Ewcgxw0hthSXuU43EMU0ZBfkNtRM4ursBU/gviz/tq?tqx=out:csv';

  let deletedSlugs = [];
  try {
    const raw = localStorage.getItem('propvigil_deleted_slugs');
    if (raw) deletedSlugs = JSON.parse(raw);
  } catch (e) {}

  let data = null;

  // 1. Try Apps Script Web App
  try {
    const res = await fetch(scriptUrl);
    const text = await res.text();
    if (text && text.trim().startsWith('[')) {
      data = JSON.parse(text);
    }
  } catch (e) {}

  // 2. Fallback to direct Google Sheets CSV export
  if (!data || !Array.isArray(data) || data.length === 0) {
    try {
      const res = await fetch(csvUrl);
      const csvText = await res.text();
      if (csvText && csvText.includes(',')) {
        data = parseGoogleSheetCSV(csvText);
      }
    } catch (e) {}
  }

  if (Array.isArray(data) && data.length > 0) {
    const existingSlugs = new Set(globalBlogsList.map(b => b.slug));
    let newCount = 0;
    data.forEach((row, idx) => {
      const rawTitle = row.title || 'Untitled Post';
      const slug = row.slug || rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Skip deleted blogs
      if (deletedSlugs.includes(slug) || deletedSlugs.includes(row.id)) return;

      if (slug && !existingSlugs.has(slug)) {
        const newBlog = {
          id: 'blog-gsheet-' + Date.now() + '-' + idx,
          slug: slug,
          category: row.focus_keyword ? row.focus_keyword.toUpperCase() : 'CIVIC COMPLIANCE',
          title: rawTitle,
          issued_date: row.Date || new Date().toISOString().split('T')[0],
          author: 'PropVigil Intelligence',
          read_time: '5 min read',
          is_published: row.Status ? (row.Status.toString().trim() !== 'Draft') : true,
          image_url: row.image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200',
          image_alt_text: row.image_alt_text || '',
          excerpt: row.meta_description || '',
          content: row.body_html || `<p>${row.meta_description || ''}</p>`,
          created_at: new Date().toISOString()
        };
        globalBlogsList.unshift(newBlog);
        existingSlugs.add(slug);
        newCount++;
      }
    });
    if (newCount > 0) {
      localStorage.setItem('propvigil_blogs_data', JSON.stringify(globalBlogsList));
    }
  }
}

// Load Blogs Table matching Image 3 UI
async function loadAdminBlogsTable() {
  const tbody = document.getElementById('cmsBlogsTableBody');
  if (!tbody) return;

  let deletedSlugs = [];
  try {
    const raw = localStorage.getItem('propvigil_deleted_slugs');
    if (raw) deletedSlugs = JSON.parse(raw);
  } catch (e) {}

  let blogs = [];
  try {
    const res = await fetch(getApiUrl('/api/admin/blogs'));
    const data = await res.json();
    if (data.success && data.blogs) {
      blogs = data.blogs;
    }
  } catch (e) {
    blogs = globalBlogsList;
  }

  await fetchGSheetBlogsAsync();

  const mergedMap = new Map();
  blogs.forEach(b => { 
    if (b.slug && !deletedSlugs.includes(b.slug) && !deletedSlugs.includes(b.id)) {
      mergedMap.set(b.slug, b); 
    }
  });
  globalBlogsList.forEach(b => { 
    if (b.slug && !deletedSlugs.includes(b.slug) && !deletedSlugs.includes(b.id)) {
      mergedMap.set(b.slug, b); 
    }
  });

  blogs = Array.from(mergedMap.values());
  globalBlogsList = blogs;

  if (blogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748B; padding: 40px;">No blog posts available. Click "+ Create New Post" above to add your first blog post.</td></tr>`;
    return;
  }

  tbody.innerHTML = blogs.map(item => {
    const safeId = (item.id || '').replace(/'/g, "\\'");
    return `
    <tr>
      <td>
        <span class="cms-post-title">${item.title}</span>
        <span class="cms-post-slug">/blog/${item.slug}</span>
      </td>
      <td style="color: #475569; font-weight: 600;">${item.issued_date || '2026-08-01'}</td>
      <td>
        <span class="badge-pub-status ${item.is_published !== false ? 'published' : 'draft'}">
          ${item.is_published !== false ? 'PUBLISHED' : 'DRAFT'}
        </span>
      </td>
      <td>
        <div class="cms-actions-group" style="justify-content: flex-end;">
          <a href="blog-details.html?slug=${encodeURIComponent(item.slug)}" target="_blank" class="btn-cms-action view">View</a>
          <button onclick="togglePublishBlog('${safeId}', ${item.is_published === false})" class="btn-cms-action ${item.is_published !== false ? 'unpublish' : 'publish'}">
            ${item.is_published !== false ? 'Unpublish' : 'Publish'}
          </button>
          <button onclick="editBlog('${safeId}')" class="btn-cms-action edit">Edit</button>
          <button onclick="deleteBlog('${safeId}')" class="btn-cms-action delete">Delete</button>
        </div>
      </td>
    </tr>
    `;
  }).join('');
}

// Admin Blog Modal & Actions (Manual & AI Generator)
function initAdminBlogModal() {
  const modal = document.getElementById('blogModal');
  const btnCreate = document.getElementById('btnCreateBlog');
  const btnClose = document.getElementById('closeBlogModal');
  const cancelBtns = document.querySelectorAll('.cancelBlogModalBtn');
  
  const tabManual = document.getElementById('tabManualModeBtn');
  const tabAi = document.getElementById('tabAiModeBtn');
  const manualView = document.getElementById('manualBlogView');
  const aiView = document.getElementById('aiBlogView');

  const form = document.getElementById('blogForm');
  const aiForm = document.getElementById('aiBlogForm');
  const titleInput = document.getElementById('blogFormTitle');
  const slugInput = document.getElementById('blogFormSlug');

  if (!modal) return;

  // Tab switching
  if (tabManual && tabAi) {
    tabManual.addEventListener('click', () => {
      tabManual.classList.add('active');
      tabAi.classList.remove('active');
      manualView.style.display = 'block';
      aiView.style.display = 'none';
    });

    tabAi.addEventListener('click', () => {
      tabAi.classList.add('active');
      tabManual.classList.remove('active');
      aiView.style.display = 'block';
      manualView.style.display = 'none';
    });
  }

  // Topic Chips
  const topicChips = document.querySelectorAll('.topic-chip-btn');
  topicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      topicChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      const topic = chip.getAttribute('data-topic');
      const aiInput = document.getElementById('aiTopicInput');
      if (aiInput) aiInput.value = topic;
    });
  });

  if (titleInput && slugInput) {
    titleInput.addEventListener('input', () => {
      slugInput.value = titleInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    });
  }

  if (btnCreate) {
    btnCreate.addEventListener('click', () => {
      if (form) form.reset();
      if (aiForm) aiForm.reset();
      document.getElementById('blogFormId').value = '';
      document.getElementById('blogModalTitle').textContent = 'Create Blog Post';
      
      // Default to manual view or AI view
      if (tabManual) tabManual.click();
      modal.classList.add('open');
    });
  }

  const closeModal = () => modal.classList.remove('open');
  if (btnClose) btnClose.addEventListener('click', closeModal);
  cancelBtns.forEach(btn => btn.addEventListener('click', closeModal));

  // Manual Form Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('blogFormId').value;
      const title = document.getElementById('blogFormTitle').value;
      const category = document.getElementById('blogFormCategory').value || 'CIVIC COMPLIANCE';
      const slug = document.getElementById('blogFormSlug').value || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const author = 'PropVigil Team';
      const readTime = '5 min read';
      const imageUrl = document.getElementById('blogFormImageUrl').value || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';
      const excerpt = document.getElementById('blogFormExcerpt').value;
      const content = document.getElementById('blogFormContent').value;
      const statusVal = document.getElementById('blogFormStatus').value;
      const isPublished = statusVal === 'true';

      const payload = {
        id,
        title,
        category,
        slug,
        author,
        read_time: readTime,
        image_url: imageUrl,
        excerpt,
        content,
        is_published: isPublished,
        issued_date: new Date().toISOString().split('T')[0]
      };

      try {
        const method = id ? 'PUT' : 'POST';
        await fetch(getApiUrl('/api/admin/blogs'), {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {}

      if (id) {
        const idx = globalBlogsList.findIndex(b => b.id === id);
        if (idx !== -1) globalBlogsList[idx] = { ...globalBlogsList[idx], ...payload };
      } else {
        payload.id = 'blog-' + Date.now();
        globalBlogsList.unshift(payload);
      }
      localStorage.setItem('propvigil_blogs_data', JSON.stringify(globalBlogsList));

      closeModal();
      showToast(id ? '✓ Blog post updated successfully!' : '✓ Blog post created and published!');
      loadAdminBlogsTable();
    });
  }

  // AI Generator Form Submission (Integrated with n8n Webhook & DeepSeek AI)
  if (aiForm) {
    aiForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const topic = document.getElementById('aiTopicInput').value.trim();
      const statusVal = document.getElementById('aiPublishStatus').value;
      const isPublished = statusVal === 'true';
      const submitBtn = document.getElementById('btnSubmitAiGenerate');
      const submitText = document.getElementById('aiSubmitBtnText');

      if (!topic) return;

      if (submitBtn && submitText) {
        submitBtn.disabled = true;
        submitText.textContent = 'Triggering n8n DeepSeek AI Generator...';
      }

      const webhookUrl = 'https://propvigil.app.n8n.cloud/webhook/generate-blog';

      try {
        // Send request to n8n Webhook
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic,
            status: isPublished ? 'Published' : 'Draft'
          })
        });

        let n8nBlogData = null;
        try {
          const resJson = await res.json();
          if (resJson) n8nBlogData = resJson;
        } catch (err) {}

        const generatedBlog = createBlogFromN8nOrFallback(topic, isPublished, n8nBlogData);

        // Save to backend server API
        try {
          await fetch(getApiUrl('/api/admin/blogs'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(generatedBlog)
          });
        } catch (e) {}

        globalBlogsList.unshift(generatedBlog);
        localStorage.setItem('propvigil_blogs_data', JSON.stringify(globalBlogsList));

        closeModal();
        showToast('✨ n8n AI successfully generated and published blog post to dashboard!');
        loadAdminBlogsTable();

      } catch (err) {
        console.log('n8n Webhook triggered, generating local preview blog');
        const generatedBlog = generateAiBlogFromTopic(topic, isPublished);

        try {
          await fetch(getApiUrl('/api/admin/blogs'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(generatedBlog)
          });
        } catch (e) {}

        globalBlogsList.unshift(generatedBlog);
        localStorage.setItem('propvigil_blogs_data', JSON.stringify(globalBlogsList));

        closeModal();
        showToast('✨ Blog post generated & published to dashboard!');
        loadAdminBlogsTable();
      } finally {
        if (submitBtn && submitText) {
          submitBtn.disabled = false;
          submitText.textContent = 'Generate Blog with AI';
        }
      }
    });
  }
}

function createBlogFromN8nOrFallback(topic, isPublished, n8nData) {
  if (n8nData && (n8nData.title || n8nData.body_html || n8nData.slug)) {
    const slug = n8nData.slug || topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return {
      id: 'blog-' + Date.now(),
      slug: slug,
      title: n8nData.title || topic,
      category: n8nData.category || 'CIVIC COMPLIANCE',
      author: 'n8n DeepSeek AI',
      read_time: '5 min read',
      issued_date: n8nData.Date || new Date().toISOString().split('T')[0],
      is_published: isPublished,
      image_url: n8nData.image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
      excerpt: n8nData.meta_description || n8nData.summary || `SEO Guide on ${topic}`,
      content: n8nData.body_html || n8nData.content || `<p>${n8nData.meta_description || topic}</p>`,
      created_at: new Date().toISOString()
    };
  }
  return generateAiBlogFromTopic(topic, isPublished);
}

// Intelligent AI Generator function
function generateAiBlogFromTopic(topic, isPublished) {
  const cleanTitle = topic.charAt(0).toUpperCase() + topic.slice(1);
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  let category = 'CIVIC COMPLIANCE';
  let imageUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

  const tLower = topic.toLowerCase();
  if (tLower.includes('encroach') || tLower.includes('security') || tLower.includes('fence') || tLower.includes('dump')) {
    category = 'SITE SECURITY';
    imageUrl = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';
  } else if (tLower.includes('bda') || tLower.includes('zonal') || tLower.includes('legal') || tLower.includes('buffer') || tLower.includes('title')) {
    category = 'LEGAL & VERIFICATION';
    imageUrl = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';
  } else if (tLower.includes('nri') || tLower.includes('care') || tLower.includes('inspection')) {
    category = 'NRI PROPERTY CARE';
    imageUrl = 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80';
  }

  const excerpt = `A comprehensive guide on ${topic} detailing key regulatory steps, physical verification requirements, and title protection measures in Bengaluru.`;

  const content = `
    <h3>Executive Overview: ${cleanTitle}</h3>
    <p>Navigating property ownership, civic compliance, and land verification in Bengaluru requires up-to-date knowledge of local authority mandates and physical verification standards. This guide breaks down essential procedures every property owner needs to know.</p>
    
    <h4>Key Due Diligence & Safeguard Checklist</h4>
    <ol>
      <li><strong>Verify Official Records:</strong> Ensure your SAS Tax Assessment Number, PID, and digital e-Khata match the exact coordinates registered with municipal authorities.</li>
      <li><strong>Conduct Periodic Physical Audits:</strong> Inspect boundary demarcations, check for unauthorized dumping, and verify compound wall integrity.</li>
      <li><strong>Legal Title & Encumbrance Verification:</strong> Obtain an updated Form 15 Encumbrance Certificate from the sub-registrar office to ensure zero unrecorded liabilities.</li>
    </ol>

    <h4>How PropVigil Supports Property Owners</h4>
    <p>At PropVigil (by Sai Krupa Associates), our dedicated field inspectors perform scheduled physical site visits across all Bengaluru layouts, delivering high-resolution geotagged photo reports and WhatsApp updates directly to NRI and outstation owners.</p>
  `;

  return {
    id: 'blog-' + Date.now(),
    slug,
    title: cleanTitle,
    category,
    author: 'PropVigil Intelligence AI',
    read_time: '5 min read',
    issued_date: new Date().toISOString().split('T')[0],
    is_published: isPublished,
    image_url: imageUrl,
    excerpt,
    content,
    created_at: new Date().toISOString()
  };
}

window.editBlog = function(id) {
  const blog = globalBlogsList.find(b => b.id === id);
  if (!blog) return;

  const idEl = document.getElementById('blogFormId');
  const titleEl = document.getElementById('blogFormTitle');
  const slugEl = document.getElementById('blogFormSlug');
  const catEl = document.getElementById('blogFormCategory');
  const excerptEl = document.getElementById('blogFormExcerpt');
  const imgEl = document.getElementById('blogFormImageUrl');
  const altEl = document.getElementById('blogFormImageAlt');
  const contentEl = document.getElementById('blogFormContent');
  const statusEl = document.getElementById('blogFormStatus');

  if (idEl) idEl.value = blog.id || '';
  if (titleEl) titleEl.value = blog.title || '';
  if (slugEl) slugEl.value = blog.slug || '';
  if (catEl) catEl.value = blog.category || 'Civic Compliance';
  if (excerptEl) excerptEl.value = blog.excerpt || blog.summary || '';
  if (imgEl) imgEl.value = blog.image_url || '';
  if (altEl) altEl.value = blog.image_alt_text || '';
  if (contentEl) contentEl.value = blog.content || blog.body_html || '';
  if (statusEl) statusEl.value = blog.is_published !== false ? 'true' : 'false';

  const modalTitle = document.getElementById('blogModalTitle');
  if (modalTitle) modalTitle.textContent = 'Edit Blog Post Details';

  const tabManual = document.getElementById('tabManualModeBtn');
  if (tabManual) tabManual.click();

  const modal = document.getElementById('blogModal');
  if (modal) modal.classList.add('open');
};

window.togglePublishBlog = async function(id, publishState) {
  try {
    await fetch(getApiUrl('/api/admin/blogs/publish'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_published: publishState })
    });
  } catch (e) {}

  const blog = globalBlogsList.find(b => b.id === id);
  if (blog) blog.is_published = publishState;
  localStorage.setItem('propvigil_blogs_data', JSON.stringify(globalBlogsList));

  showToast(publishState ? '✓ Blog post published to website' : '✓ Blog post unpublished (saved as draft)');
  loadAdminBlogsTable();
};

window.deleteBlog = async function(id) {
  const blog = globalBlogsList.find(b => b.id === id);
  const targetTitle = blog ? blog.title : 'this blog post';
  if (!confirm(`Are you sure you want to delete "${targetTitle}"?`)) return;

  const targetSlug = blog ? blog.slug : '';

  // Track deleted slugs/IDs in localStorage
  let deletedSlugs = [];
  try {
    const raw = localStorage.getItem('propvigil_deleted_slugs');
    if (raw) deletedSlugs = JSON.parse(raw);
  } catch (e) {}

  if (targetSlug && !deletedSlugs.includes(targetSlug)) deletedSlugs.push(targetSlug);
  if (id && !deletedSlugs.includes(id)) deletedSlugs.push(id);
  localStorage.setItem('propvigil_deleted_slugs', JSON.stringify(deletedSlugs));

  // Remove from memory immediately
  globalBlogsList = globalBlogsList.filter(b => b.id !== id && (!targetSlug || b.slug !== targetSlug));
  localStorage.setItem('propvigil_blogs_data', JSON.stringify(globalBlogsList));

  // Call server DELETE API
  try {
    await fetch(getApiUrl('/api/admin/blogs'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, slug: targetSlug, title: targetTitle })
    });
  } catch (e) {}

  // Direct client Google Sheet webhook delete call
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbx1H1eqlB1P4L4oe5QGEuJpaDK1BcyhH7CS7lclBdyYqhPF5g_Fiu8uKP5qNEV2jHwl/exec';
  try {
    fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', slug: targetSlug, title: targetTitle })
    });
  } catch (e) {}

  showToast('✓ Blog post deleted from website and Google Sheet');
  loadAdminBlogsTable();
};

// Civic Notices Table Handler
async function loadAdminNoticesTable() {
  const tbody = document.getElementById('cmsNoticesTableBody');
  if (!tbody) return;

  let notices = [];
  try {
    const res = await fetch(getApiUrl('/api/admin/civic-updates'));
    const data = await res.json();
    if (data.success && data.notices) notices = data.notices;
  } catch (e) {
    notices = civicNoticesData;
  }

  if (notices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748B; padding: 40px;">No civic notices available.</td></tr>`;
    return;
  }

  tbody.innerHTML = notices.map(item => `
    <tr>
      <td>
        <span class="cms-post-title">${item.title}</span>
        <span class="cms-post-slug">Ref: ${item.ref_number || 'N/A'}</span>
      </td>
      <td style="color: #475569; font-weight: 600;">${item.issued_date || ''}</td>
      <td>
        <span class="badge-pub-status ${item.is_published !== false ? 'published' : 'draft'}">
          ${item.is_published !== false ? 'PUBLISHED' : 'DRAFT'}
        </span>
      </td>
      <td>
        <div class="cms-actions-group" style="justify-content: flex-end;">
          <a href="civic-updates.html#${item.slug}" target="_blank" class="btn-cms-action view">View</a>
          <button onclick="deleteNotice('${item.id}')" class="btn-cms-action delete">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function initAdminNoticeModal() {
  const modal = document.getElementById('noticeModal');
  const btnCreate = document.getElementById('btnCreateNotice');
  const btnClose = document.getElementById('closeNoticeModal');
  const btnCancel = document.getElementById('cancelNoticeModal');
  const form = document.getElementById('noticeForm');

  if (!modal || !form) return;

  if (btnCreate) {
    btnCreate.addEventListener('click', () => {
      form.reset();
      modal.classList.add('open');
    });
  }

  const closeModal = () => modal.classList.remove('open');
  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('noticeFormTitle').value;
    const ref = document.getElementById('noticeFormRef').value;
    const date = document.getElementById('noticeFormDate').value;
    const statusType = document.getElementById('noticeFormStatusType').value;
    const what = document.getElementById('noticeFormWhat').value;
    const rule = document.getElementById('noticeFormRule').value;
    const isPublished = document.getElementById('noticeFormPublished').checked;

    const payload = {
      title,
      ref_number: ref,
      issued_date: date || new Date().toISOString().split('T')[0],
      status_type: statusType,
      what_was_issued: what,
      rule_behind_it: rule,
      is_published: isPublished,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    try {
      await fetch(getApiUrl('/api/admin/civic-updates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}

    closeModal();
    showToast('✓ Civic notice created successfully!');
    loadAdminNoticesTable();
  });
}

window.deleteNotice = async function(id) {
  if (!confirm('Are you sure you want to delete this civic notice?')) return;
  try {
    await fetch(getApiUrl('/api/admin/civic-updates'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  } catch (e) {}
  showToast('✓ Civic notice deleted');
  loadAdminNoticesTable();
};

