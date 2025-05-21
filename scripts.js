document.addEventListener('DOMContentLoaded', () => {
  console.log('scripts.js loaded');

  // Rate constants
  let LIVE_RATE = 18.5; // Default fallback
  const DIVISORS = { Cash: 0.98, Bank: 0.945, Mobile: 0.95 };
  const RATE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  let lastRateFetch = 0;

  // Form configurations
  const forms = [
    { formId: 'formCash', usdInputId: 'usdCash', rateId: 'rateCash', effId: 'effCash', zarId: 'zarCash', method: 'Cash' },
    { formId: 'formBank', usdInputId: 'usdBank', rateId: 'rateBank', effId: 'effBank', zarId: 'zarBank', method: 'Bank' },
    { formId: 'formMobile', usdInputId: 'usdMobile', rateId: 'rateMobile', effId: 'effMobile', zarId: 'zarMobile', method: 'Mobile', walletId: 'walletMobile' }
  ];

  // Debounce utility
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Update cost information
  const updateCost = (usdInput, rateSpan, effSpan, zarSpan, effectiveRate, isLoading = false) => {
    if (isLoading) {
      rateSpan.textContent = 'Loading...';
      effSpan.textContent = 'Loading...';
      zarSpan.textContent = 'Loading...';
      rateSpan.parentElement.classList.add('loading');
      return;
    }

    rateSpan.parentElement.classList.remove('loading');
    const usd = parseFloat(usdInput.value) || 0;
    const zar = Math.ceil((usd * effectiveRate) / 10) * 10;

    rateSpan.textContent = LIVE_RATE.toFixed(4);
    effSpan.textContent = effectiveRate.toFixed(4);
    zarSpan.textContent = zar.toFixed(2);
  };

  // Fetch live rate
  const fetchRate = async () => {
    const now = Date.now();
    if (now - lastRateFetch < RATE_REFRESH_INTERVAL) {
      console.log('Using cached rate:', LIVE_RATE);
      return LIVE_RATE;
    }

    forms.forEach(({ rateId, effId, zarId }) => {
      const rateSpan = document.getElementById(rateId);
      const effSpan = document.getElementById(effId);
      const zarSpan = document.getElementById(zarId);
      if (rateSpan && effSpan && zarSpan) {
        updateCost({ value: 0 }, rateSpan, effSpan, zarSpan, 0, true);
      }
    });

    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      LIVE_RATE = parseFloat(data.rates.ZAR) || LIVE_RATE;
      lastRateFetch = now;
      console.log(`Live rate fetched: ${LIVE_RATE}`);
    } catch (error) {
      console.warn(`Failed to fetch live rate, using fallback: ${LIVE_RATE}`, error);
    }
    return LIVE_RATE;
  };

  // Set up each form
  const setupForm = ({ formId, usdInputId, rateId, effId, zarId, method, walletId }) => {
    const form = document.getElementById(formId);
    const usdInput = document.getElementById(usdInputId);
    const rateSpan = document.getElementById(rateId);
    const effSpan = document.getElementById(effId);
    const zarSpan = document.getElementById(zarId);
    const walletInput = walletId ? document.getElementById(walletId) : null;
    const divisor = DIVISORS[method];
    const effectiveRate = LIVE_RATE / divisor;

    if (!form || !usdInput || !rateSpan || !effSpan || !zarSpan || (method === 'Mobile' && !walletInput)) {
      console.error(`Missing elements for ${formId}:`, {
        form: !!form,
        usdInput: !!usdInput,
        rateSpan: !!rateSpan,
        effSpan: !!effSpan,
        zarSpan: !!zarSpan,
        walletInput: !walletId || !!walletInput
      });
      return;
    }

    console.log(`Setting up ${formId} with divisor ${divisor}, rate ${LIVE_RATE}`);

    // Debounced input handler
    const debouncedUpdate = debounce(() => {
      console.log(`Input event for ${usdInputId}: ${usdInput.value}`);
      updateCost(usdInput, rateSpan, effSpan, zarSpan, effectiveRate);
    }, 300);

    ['input', 'change'].forEach(event => {
      usdInput.addEventListener(event, debouncedUpdate);
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.classList.add('was-validated');

      // Validate all required fields
      if (!form.checkValidity()) {
        console.log(`Validation failed for ${formId}`);
        return;
      }

      // USD amount validation
      const usd = parseFloat(usdInput.value) || 0;
      if (usd <= 0 || usd % 10 !== 0) {
        usdInput.setCustomValidity('Enter a USD amount >0 and multiple of 10');
        return;
      } else {
        usdInput.setCustomValidity('');
      }

      // Wallet validation for Mobile method
      if (method === 'Mobile' && !walletInput.value) {
        walletInput.setCustomValidity('Please select a mobile money wallet');
        return;
      } else if (walletInput) {
        walletInput.setCustomValidity('');
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      console.log(`Form ${formId} submitted:`, data);

      // Reset form
      form.reset();
      updateCost(usdInput, rateSpan, effSpan, zarSpan, effectiveRate);
      form.classList.remove('was-validated');
    });

    // Initialize cost display
    updateCost(usdInput, rateSpan, effSpan, zarSpan, effectiveRate);
  };

  // Initialize forms after fetching rate
  fetchRate().then(() => {
    forms.forEach(setupForm);

    // Re-initialize form when tab is shown
    document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
      tab.addEventListener('shown.bs.tab', (e) => {
        const targetId = e.target.getAttribute('aria-controls');
        const formConfig = forms.find(f => f.formId === `form${targetId.charAt(0).toUpperCase() + targetId.slice(1)}`);
        if (formConfig) {
          console.log(`Tab ${targetId} shown, re-initializing ${formConfig.formId}`);
          setupForm(formConfig);
        }
      });
    });

    // Periodic rate refresh
    setInterval(fetchRate, RATE_REFRESH_INTERVAL);
  });
});