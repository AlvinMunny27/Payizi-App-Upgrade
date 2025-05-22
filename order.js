document.addEventListener('DOMContentLoaded', () => {
  console.log('order.js loaded');

  // Rate constants
  let LIVE_RATE = 18.5;
  const DIVISORS = { Cash: 0.98, Bank: 0.945, Mobile: 0.95 };
  const RATE_REFRESH_INTERVAL = 5 * 60 * 1000;
  let lastRateFetch = 0;

  // Form configurations
  const forms = [
    { formId: 'formCash', usdInputId: 'usdCash', rateId: 'rateCash', effId: 'effCash', zarId: 'zarCash', method: 'Cash', 
      beneficiaryNameId: 'beneficiaryFullNameCash', beneficiaryMobileId: 'beneficiaryMobileCash', beneficiaryIdId: 'beneficiaryGovtIdCash', 
      senderNameId: 'senderFullNameCash', senderEmailId: 'senderEmailCash', senderMobileId: 'senderMobileCash', extraId: 'pickupLocationCash', extraSelectId: 'payoutLocationCash' },
    { formId: 'formBank', usdInputId: 'usdBank', rateId: 'rateBank', effId: 'effBank', zarId: 'zarBank', method: 'Bank', 
      beneficiaryNameId: 'accountHolderName', beneficiaryMobileId: null, beneficiaryIdId: null, 
      senderNameId: 'senderFullNameBank', senderEmailId: 'senderEmailBank', senderMobileId: 'senderMobileBank', 
      extraIds: ['bankSelect', 'bankName', 'accountNumber', 'branchCode'] },
    { formId: 'formMobile', usdInputId: 'usdMobile', rateId: 'rateMobile', effId: 'effMobile', zarId: 'zarMobile', method: 'Mobile', 
      beneficiaryNameId: 'beneficiaryNameMobile', beneficiaryMobileId: 'beneficiaryMobileMobile', beneficiaryIdId: 'beneficiaryGovtIdMobile', 
      senderNameId: 'senderFullNameMobile', senderEmailId: 'senderEmailMobile', senderMobileId: 'senderMobileMobile', extraId: 'walletMobile' }
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
    const rateDisplay = document.getElementById('rateDisplay');
    if (rateDisplay) rateDisplay.classList.add('loading');
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      LIVE_RATE = parseFloat(data.rates.ZAR) || LIVE_RATE;
      lastRateFetch = now;
      console.log(`Live rate fetched: ${LIVE_RATE}`);
    } catch (error) {
      console.warn(`Failed to fetch live rate, using fallback: ${LIVE_RATE}`, error);
    } finally {
      if (rateDisplay) rateDisplay.classList.remove('loading');
    }
    return LIVE_RATE;
  };

  // Update exchange rate display
  const updateRateDisplay = () => {
    const rateDisplay = document.getElementById('rateDisplay');
    if (rateDisplay) {
      rateDisplay.textContent = `Current Rate: 1 USD = ${LIVE_RATE.toFixed(4)} ZAR`;
    }
  };

  // Validate amount
  const validateAmount = (input) => {
    const value = parseFloat(input.value);
    if (isNaN(value) || value <= 0 || !Number.isInteger(value) || value % 5 !== 0) {
      input.classList.add('is-invalid');
      input.setCustomValidity('Invalid amount');
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.setCustomValidity('');
      return true;
    }
  };

  // Validate phone number
  const validatePhone = (input, isSender) => {
    const value = input.value;
    const pattern = isSender ? /^\+27\d{9}$/ : /^\+263\d{9}$/;
    if (!pattern.test(value)) {
      input.classList.add('is-invalid');
      input.setCustomValidity(isSender ? 'Invalid SA number' : 'Invalid ZW number');
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.setCustomValidity('');
      return true;
    }
  };

  // Validate name
  const validateName = (input) => {
    if (!input.value.trim()) {
      input.classList.add('is-invalid');
      input.setCustomValidity('Name required');
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.setCustomValidity('');
      return true;
    }
  };

  // Validate email
  const validateEmail = (input) => {
    if (!input.value || !/\S+@\S+\.\S+/.test(input.value)) {
      input.classList.add('is-invalid');
      input.setCustomValidity('Invalid email');
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.setCustomValidity('');
      return true;
    }
  };

  // Validate extra fields
  const validateExtra = (input, message) => {
    if (!input.value.trim()) {
      input.classList.add('is-invalid');
      input.setCustomValidity(message);
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.setCustomValidity('');
      return true;
    }
  };

  // Set up each form
  const setupForm = ({ formId, usdInputId, rateId, effId, zarId, method, beneficiaryNameId, beneficiaryMobileId, beneficiaryIdId, senderNameId, senderEmailId, senderMobileId, extraId, extraSelectId, extraIds }) => {
    const form = document.getElementById(formId);
    const usdInput = document.getElementById(usdInputId);
    const rateSpan = document.getElementById(rateId);
    const effSpan = document.getElementById(effId);
    const zarSpan = document.getElementById(zarId);
    const beneficiaryNameInput = beneficiaryNameId ? document.getElementById(beneficiaryNameId) : null;
    const beneficiaryMobileInput = beneficiaryMobileId ? document.getElementById(beneficiaryMobileId) : null;
    const beneficiaryIdInput = beneficiaryIdId ? document.getElementById(beneficiaryIdId) : null;
    const senderNameInput = senderNameId ? document.getElementById(senderNameId) : null;
    const senderEmailInput = senderEmailId ? document.getElementById(senderEmailId) : null;
    const senderMobileInput = senderMobileId ? document.getElementById(senderMobileId) : null;
    const extraInput = extraId ? document.getElementById(extraId) : null;
    const extraSelectInput = extraSelectId ? document.getElementById(extraSelectId) : null;
    const extraInputs = extraIds ? extraIds.map(id => document.getElementById(id)) : [];
    const divisor = DIVISORS[method];
    const effectiveRate = LIVE_RATE / divisor;

    if (!form || !usdInput || !rateSpan || !effSpan || !zarSpan || 
        (beneficiaryNameId && !beneficiaryNameInput) || (beneficiaryMobileId && !beneficiaryMobileInput) || (beneficiaryIdId && !beneficiaryIdInput) ||
        (senderNameId && !senderNameInput) || (senderEmailId && !senderEmailInput) || (senderMobileId && !senderMobileInput) ||
        (extraId && !extraInput) || (extraSelectId && !extraSelectInput) || extraInputs.some(input => !input)) {
      console.error(`Missing elements for ${formId}`);
      return;
    }

    console.log(`Setting up ${formId} with divisor ${divisor}, rate ${LIVE_RATE}`);

    // Real-time validations
    usdInput.addEventListener('input', debounce(() => {
      validateAmount(usdInput);
      updateCost(usdInput, rateSpan, effSpan, zarSpan, effectiveRate);
    }, 300));
    if (beneficiaryNameInput) beneficiaryNameInput.addEventListener('input', () => validateName(beneficiaryNameInput));
    if (beneficiaryMobileInput) beneficiaryMobileInput.addEventListener('input', () => validatePhone(beneficiaryMobileInput, false));
    if (beneficiaryIdInput) beneficiaryIdInput.addEventListener('input', () => validateExtra(beneficiaryIdInput, 'ID required'));
    if (senderNameInput) senderNameInput.addEventListener('input', () => validateName(senderNameInput));
    if (senderEmailInput) senderEmailInput.addEventListener('input', () => validateEmail(senderEmailInput));
    if (senderMobileInput) senderMobileInput.addEventListener('input', () => validatePhone(senderMobileInput, true));
    if (extraInput) extraInput.addEventListener('input', () => validateExtra(extraInput, method === 'Mobile' ? 'Wallet required' : 'Location required'));
    if (extraSelectInput) extraSelectInput.addEventListener('input', () => validateExtra(extraSelectInput, 'Payout location required'));
    extraInputs.forEach((input, i) => input.addEventListener('input', () => validateExtra(input, ['Bank required', 'Bank name required', 'Account number required', 'Branch code required'][i])));

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.classList.add('was-validated');
      let isValid = true;
      isValid = validateAmount(usdInput) && isValid;
      if (beneficiaryNameInput) isValid = validateName(beneficiaryNameInput) && isValid;
      if (beneficiaryMobileInput) isValid = validatePhone(beneficiaryMobileInput, false) && isValid;
      if (beneficiaryIdInput) isValid = validateExtra(beneficiaryIdInput, 'ID required') && isValid;
      if (senderNameInput) isValid = validateName(senderNameInput) && isValid;
      if (senderEmailInput) isValid = validateEmail(senderEmailInput) && isValid;
      if (senderMobileInput) isValid = validatePhone(senderMobileInput, true) && isValid;
      if (extraInput) isValid = validateExtra(extraInput, method === 'Mobile' ? 'Wallet required' : 'Location required') && isValid;
      if (extraSelectInput) isValid = validateExtra(extraSelectInput, 'Payout location required') && isValid;
      extraInputs.forEach((input, i) => isValid = validateExtra(input, ['Bank required', 'Bank name required', 'Account number required', 'Branch code required'][i]) && isValid);
      if (isValid) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        console.log(`Form ${formId} submitted:`, data);
        form.reset();
        updateCost(usdInput, rateSpan, effSpan, zarSpan, effectiveRate);
        form.classList.remove('was-validated');
      }
    });

    // Initialize cost display
    updateCost(usdInput, rateSpan, effSpan, zarSpan, effectiveRate);
  };

  // Initialize forms after fetching rate
  fetchRate().then(() => {
    updateRateDisplay();
    forms.forEach(setupForm);
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
    setInterval(() => fetchRate().then(updateRateDisplay), RATE_REFRESH_INTERVAL);
  });
});