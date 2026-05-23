
(function () {
  // This is an IIFE (Immediately Invoked Function Expression).
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    // $ → shortcut for document.querySelector (finds 1 element).
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    // $$ → shortcut for document.querySelectorAll (finds many elements and turns them into an array).
  
    const state = {
      page: 1,    
      //  current pagination page
      perPage: 12, // Increased for better big screen experience
      sort: 'none', // 'price-asc' | 'price-desc' | 'newest'
      categories: new Set(),
      priceRanges: new Set(),
      cartCount: 0,
      items: [],
      cart: [], // {title, price, thumbSrc}
    };
  
    function parsePrice(text) {
      if (!text) return 0;
      // Handle 'k' notation (e.g., 26k -> 26000) and remove currency symbols
      let clean = text.toLowerCase().replace(/[^0-9.k]/g, '');
      if (clean.includes('k')) {
        let val = parseFloat(clean.replace('k', '')) || 0;
        return val * 1000;
      }
      return parseFloat(clean) || 0;
    }

    // Parse photo items into data objects
    function parseItems() {
      const cards = $$('.photo-item');
      state.items = cards.map((el, idx) => {
        const category = $('.photo-category', el)?.textContent.trim() || '';
        const title = $('.photo-title', el)?.textContent.trim() || '';
        const priceText = $('.photo-price', el)?.textContent || '0';
        const price = parsePrice(priceText);
        // Use DOM order as a proxy for recency (higher idx = newer)
        const createdAt = Date.now() - (cards.length - idx) * 1000;
        return { el, category, title, price, createdAt };
      });
    }
  
    // Category and price filter helpers
    function getActiveCategories() {
      const checks = $$('.category-list input[type="checkbox"]');
      state.categories = new Set(
        checks.filter(ch => ch.checked).map(ch => ch.parentElement.textContent.trim())
      );
    }
  
    function getActivePriceRanges() {
      const checks = $$('.price-filter input[type="checkbox"][name="price"]');
      state.priceRanges = new Set(
        checks.filter(ch => ch.checked).map(ch => ch.parentElement.textContent.trim())
      );
    }
  
    function priceInRanges(price) {
      if (state.priceRanges.size === 0) return true;
      const ranges = Array.from(state.priceRanges);
      return ranges.some(label => {
        const txt = label.toLowerCase();
        const numbers = label.match(/\d+/g);
        if (!numbers) return true;

        if (txt.includes('lower than')) {
          return price < Number(numbers[0]);
        }
        if (txt.includes('more than')) {
          return price > Number(numbers[0]);
        }
        if (numbers.length >= 2) {
          const min = Number(numbers[0]);
          const max = Number(numbers[1]);
          return price >= min && price <= max;
        }
        return true;
      });
    }
  
    function applyFiltersSortPaginate() {
      // ------------------ FILTER ITEMS ------------------
      let filtered = state.items.filter(item => {
        const catOk =
          state.categories.size === 0 || state.categories.has(item.category);
        const priceOk = priceInRanges(item.price);
        return catOk && priceOk;
      });

      // ------------------ SORT ITEMS ------------------
      if (state.sort === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
      } 
      else if (state.sort === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
      } 
      else if (state.sort === 'newest') {
        filtered.sort((a, b) => b.createdAt - a.createdAt);
      }

      // Total pages available
      const perPage = state.perPage;
      const totalPages = Math.ceil(filtered.length / perPage);

      // Prevent page overflow
      if (state.page > totalPages) {
        state.page = totalPages || 1;
      }

      // ------------------ PAGINATION ------------------
      const start = (state.page - 1) * perPage;
      const end = start + perPage;
      const paginated = filtered.slice(start, end);

      // Hide all items first
      state.items.forEach(item => {
        item.el.style.display = 'none';
      });

      // Show ONLY current page items
      paginated.forEach(item => {
        item.el.style.display = '';
      });

      // ------------------ UPDATE PAGINATION UI ------------------
      const pag = $('.pagination');
      if (pag) {
        let pagHtml = '<button class="prev" aria-label="Previous page">‹</button>';
        for (let i = 1; i <= totalPages; i++) {
          const activeClass = i === state.page ? 'active' : '';
          pagHtml += `<button class="page-btn ${activeClass}">${i}</button>`;
        }
        pagHtml += '<button class="next" aria-label="Next page">›</button>';
        pag.innerHTML = pagHtml;
      }
    }
    
    function handleSortChange() {
      const sortSel = $('.sort-dropdown');
      if (!sortSel) return;
      sortSel.addEventListener('change', () => {
        const val = sortSel.value.toLowerCase();
        if (val.includes('low to high')) state.sort = 'price-asc';
        else if (val.includes('high to low')) state.sort = 'price-desc';
        else if (val.includes('newest')) state.sort = 'newest';
        else state.sort = 'none';
        state.page = 1;
        applyFiltersSortPaginate();
      });
    }
  
    function handleFilters() {
      // categories
      $$('.category-list input[type="checkbox"]').forEach(ch => {
        ch.addEventListener('change', () => {
          getActiveCategories();
          state.page = 1;
          applyFiltersSortPaginate();
        });
      });
      // price
      $$('.price-filter input[type="checkbox"][name="price"]').forEach(ch => {
        ch.addEventListener('change', () => {
          getActivePriceRanges();
          state.page = 1;
          applyFiltersSortPaginate();
        });
      });
    }
  
    function handlePagination() {
      const pag = $('.pagination');
      if (!pag) return;
    
      pag.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
    
        const label = btn.textContent.trim();
    
        // Page number clicked
        if (/^\d+$/.test(label)) {
          state.page = Number(label);
        }
        // Previous
        else if (label === '‹') {
          state.page = Math.max(1, state.page - 1);
        }
        // Next
        else if (label === '›') {
          state.page = state.page + 1; // final max correction happens below
        }
    
        applyFiltersSortPaginate();
      });
    }
    
  
    function handleCart() {
      const cartTrigger = $('.cart-trigger');
      if (cartTrigger) {
        if (!$('.cart-badge', cartTrigger)) {
          const badge = document.createElement('span');
          badge.className = 'cart-badge';
          badge.textContent = '0';
          cartTrigger.appendChild(badge);
        }
        cartTrigger.addEventListener('click', openCart);
      }
  
      function updateBadge() {
        const b = $('.cart-badge');
        if (b) b.textContent = String(state.cartCount);
      }
  
      function updateCartUI() {
        const itemsWrap = $('.cart-items');
        const totalEl = $('.cart-total-value');
        if (!itemsWrap || !totalEl) return;
        itemsWrap.innerHTML = '';
        let total = 0;
        state.cart.forEach((it, idx) => {
          total += it.price;
          const row = document.createElement('div');
          row.className = 'cart-item';
          row.innerHTML = `
            <img class="cart-item-thumb" src="${it.thumbSrc}" alt="${it.title}">
            <div>
              <div class="cart-item-title">${it.title}</div>
              <div class="cart-item-price">NGN ${it.price.toLocaleString()}</div>
            </div>
            <button class="cart-item-remove" data-index="${idx}">Remove</button>
          `;
          itemsWrap.appendChild(row);
        });
        totalEl.textContent = `NGN ${total.toLocaleString()}`;
  
        // remove handlers
        $$('.cart-item-remove', itemsWrap).forEach(btn => {
          btn.addEventListener('click', e => {
            const i = Number(e.currentTarget.getAttribute('data-index'));
            const removed = state.cart.splice(i, 1)[0];
            if (removed) state.cartCount = Math.max(0, state.cartCount - 1);
            updateBadge();
            updateCartUI();
          });
        });
      }
  
      function openCart() {
        const panel = $('.cart-panel');
        const backdrop = $('.cart-backdrop');
        if (!panel || !backdrop) return;
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        backdrop.hidden = false;
      }
      function closeCart() {
        const panel = $('.cart-panel');
        const backdrop = $('.cart-backdrop');
        if (!panel || !backdrop) return;
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        backdrop.hidden = true;
      }
  
      const closeBtn = $('.cart-close');
      const backdrop = $('.cart-backdrop');
      if (closeBtn) closeBtn.addEventListener('click', closeCart);
      if (backdrop) backdrop.addEventListener('click', closeCart);
  
      const clearBtn = $('.clear-cart-btn');
      if (clearBtn) clearBtn.addEventListener('click', () => {
        state.cart.length = 0;
        state.cartCount = 0;
        updateBadge();
        updateCartUI();
      });

      const checkoutBtn = $('.checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          if (state.cart.length === 0) {
            alert('Your cart is empty');
            return;
          }

          if (typeof PaystackPop === 'undefined') {
            alert('Payment system is currently unavailable. Please check your internet connection.');
            return;
          }

          const total = state.cart.reduce((sum, item) => sum + item.price, 0);
          const email = $('#cart-email')?.value || '';
          const fullName = $('#cart-name')?.value || '';
          const phone = $('#cart-phone')?.value || '';

          if (!email || !email.includes('@')) {
            alert('Please enter a valid email address.');
            return;
          }

          if (total <= 0) {
            alert('Invalid total amount.');
            return;
          }

          // Close cart before opening Paystack to avoid UI overlap issues
          closeCart();

          const handler = PaystackPop.setup({
            key: 'pk_test_0ebacd0179556628f883151650864d7d8dea86b7',
            email: email,
            amount: Math.round(total * 100), // Amount in kobo
            currency: 'NGN',
            ref: 'BEJ-' + Math.floor((Math.random() * 1000000000) + 1),
            metadata: {
              custom_fields: [
                {
                  display_name: "Full Name",
                  variable_name: "full_name",
                  value: fullName
                },
                {
                  display_name: "Phone Number",
                  variable_name: "phone_number",
                  value: phone
                }
              ]
            },
            callback: function(response) {
              alert('Payment complete! Reference: ' + response.reference);
              state.cart.length = 0;
              state.cartCount = 0;
              updateBadge();
              updateCartUI();
              closeCart();
            },
            onClose: function() {
              alert('Payment window closed.');
            }
          });

          handler.openIframe();
        });
      }
  
      $$('.photo-add-btn, .add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          // find card context if available
          const card = e.target.closest('.photo-item');
          let title = 'Item';
          let price = 0;
          let thumbSrc = '';

          if (card) {
            title = $('.photo-title', card)?.textContent.trim() || title;
            const priceText = $('.photo-price', card)?.textContent || '0';
            price = parsePrice(priceText);
            thumbSrc = $('img', card)?.getAttribute('src') || '';
          } else if (e.target.classList.contains('add-to-cart-btn')) {
            // Hero item
            title = "Symphony Red Wine";
            price = 25000; // Hero item price
            thumbSrc = "./images/DRINKS PHOTOS/SYMPHONY RED WINE.jpg";
          }

          if (price <= 0) {
            alert('This item currently has no price. Please contact us for details.');
            return;
          }

          state.cart.push({ title, price, thumbSrc });
          state.cartCount += 1;
          updateBadge();
          updateCartUI();
        });
      });
  
      // Expose for other handlers
      window.__openCart = openCart;
    }
  
    // Intersection Observer for active link highlighting
    function handleActiveLinks() {
      const sections = $$('section[id], main[id]');
      const navLinks = $$('.nav-link');

      const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
              link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
          }
        });
      }, observerOptions);

      sections.forEach(section => observer.observe(section));
    }

    // Initialize
    function init() {
      parseItems();
      getActiveCategories();
      getActivePriceRanges();
      handleSortChange();
      handleFilters();
      handlePagination();
      handleCart();
      handleFavorites();
      handleActiveLinks();
  
      function handleFavorites() {
        document.addEventListener('click', e => {
          const btn = e.target.closest('.favorite-btn');
          if (btn) {
            btn.classList.toggle('active');
            const isFavorite = btn.classList.contains('active');
            // Visual feedback or persisted state could go here
            btn.style.transform = 'scale(1.3)';
            setTimeout(() => {
              btn.style.transform = '';
            }, 200);
          }
        });
      }

      // Mobile menu toggle
      const menuToggle = $('.menu-toggle');
      const navbar = $('.navbar');
      if (menuToggle && navbar) {
        menuToggle.addEventListener('click', () => {
          menuToggle.classList.toggle('active');
          navbar.classList.toggle('active');
        });

        // Close menu when a link is clicked
        $$('a', navbar).forEach(link => {
          link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navbar.classList.remove('active');
          });
        });
      }

      // Mobile filters toggle
      const filtersToggle = $('.filters-toggle');
      const sidebar = $('.sidebar');
      const backdropEl = $('.cart-backdrop');
      if (filtersToggle && sidebar) {
        filtersToggle.addEventListener('click', () => {
          const nowOpen = !sidebar.classList.contains('open');
          sidebar.classList.toggle('open');
          // reuse existing backdrop for filters on mobile
          if (backdropEl) {
            backdropEl.hidden = !nowOpen;
            backdropEl.classList.toggle('filters-open', nowOpen);
          }
        });
        if (backdropEl) {
          backdropEl.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
              sidebar.classList.remove('open');
              backdropEl.classList.remove('filters-open');
            }
          });
        }
      }
  
      // Newsletter Form Handling
      const newsletterForm = $('.newsletter-form');
      if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const emailInput = $('.newsletter-input', newsletterForm);
          const email = emailInput.value;
          if (email) {
            // In a real app, you would send this to a backend
            alert(`Thank you for joining our Wine Club, ${email}! We've sent a welcome gift to your inbox.`);
            emailInput.value = '';
          }
        });
      }

      applyFiltersSortPaginate();
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
  