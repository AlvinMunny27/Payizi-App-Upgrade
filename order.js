console.log('order.js loaded at ' + new Date().toISOString());

// Rate constants
const CURRENCIES = ['ZAR', 'EUR', 'GBP'];
const RATE_REFRESH_INTERVAL = 5 * 60 * 1000;
let lastRateFetch = 0;
const FALLBACK_RATES = { ZAR: 17.8, EUR: 0.92, GBP: 0.78 };
const REMITTANCE_FEE = 0.02;
const FX_MARGIN = 0.00;

// Generate 8-digit alphanumeric order reference
const generateOrderReference = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  console.log('Generated order reference:', result);
  return result;
};

// Fetch exchange rates
const fetchRates = async () => {
  const now = Date.now();
  if (now - lastRateFetch < RATE_REFRESH_INTERVAL) {
    console.log('Using cached rates');
    return;
  }
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    CURRENCIES.forEach(currency => {
      const rate = data.rates[currency] || FALLBACK_RATES[currency];
      localStorage.setItem(`rate${currency}`, rate.toFixed(4));
    });
    lastRateFetch = now;
  } catch (error) {
    console.error('Failed to fetch rates:', error);
    CURRENCIES.forEach(currency => {
      localStorage.setItem(`rate${currency}`, FALLBACK_RATES[currency].toFixed(4));
    });
  }
};

// Validate email
const validateEmail = (email) => {
  if (!email) {
    console.log('Email is empty or undefined');
    return false;
  }
  const cleanedEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(cleanedEmail);
  console.log(`Validating email "${cleanedEmail}": ${isValid}`);
  return isValid;
};

// Save order to localStorage
const saveOrder = (order) => {
  let orders = JSON.parse(localStorage.getItem('orders')) || [];
  order.reference = generateOrderReference();
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));
  console.log('Order saved with reference:', order.reference, order);
  console.log('All orders:', orders);
};

// Round to the nearest 10
const roundToNearest10 = (amount) => {
  return Math.round(amount / 10) * 10;
};

// Calculate rates and update form
const updateRateDisplay = (formType, usdInputId, rateSpanId, effRateSpanId, amountSpanId, initialUsdAmount = 0) => {
  const usdInput = document.getElementById(usdInputId);
  const rateSpan = document.getElementById(rateSpanId);
  const effRateSpan = document.getElementById(effRateSpanId);
  const amountSpan = document.getElementById(amountSpanId);

  if (!usdInput || !rateSpan || !effRateSpan || !amountSpan) {
    console.error(`Elements for ${formType} not found`);
    return;
  }

  const userLocation = localStorage.getItem('userLocation');
  let targetCurrency, liveRate, feePercentage;

  if (userLocation === 'ZA') targetCurrency = 'ZAR';
  else if (userLocation === 'EU') targetCurrency = 'EUR';
  else if (userLocation === 'UK') targetCurrency = 'GBP';
  else {
    console.error('Invalid userLocation:', userLocation);
    return;
  }

  liveRate = parseFloat(localStorage.getItem(`rate${targetCurrency}`)) || FALLBACK_RATES[targetCurrency];
  feePercentage = REMITTANCE_FEE;
  const effectiveRate = liveRate * (1 + feePercentage);

  console.log(`Rate calculation for ${formType}: Live Rate = ${liveRate}, Fee = ${feePercentage * 100}%, Effective Rate = ${effectiveRate}`);
  rateSpan.textContent = liveRate.toFixed(4);
  effRateSpan.textContent = effectiveRate.toFixed(4);

  usdInput.addEventListener('input', () => {
    const usdAmount = parseFloat(usdInput.value) || 0;
    const convertedAmount = usdAmount * effectiveRate;
    const roundedAmount = roundToNearest10(convertedAmount);
    console.log(`Amount calculation for ${formType}: USD = ${usdAmount}, Converted = ${convertedAmount}, Rounded = ${roundedAmount}`);
    amountSpan.textContent = `${targetCurrency} ${roundedAmount.toFixed(2)}`;
  });

  usdInput.value = initialUsdAmount;
  const convertedAmount = initialUsdAmount * effectiveRate;
  const roundedAmount = roundToNearest10(convertedAmount);
  console.log(`Initial amount calculation for ${formType}: USD = ${initialUsdAmount}, Converted = ${convertedAmount}, Rounded = ${roundedAmount}`);
  amountSpan.textContent = `${targetCurrency} ${roundedAmount.toFixed(2)}`;

  return { targetCurrency, effectiveRate };
};

// Show/hide forms based on payment method
const togglePaymentForms = (selectedMethod) => {
  console.log(`Toggling payment forms for method: ${selectedMethod}`);
  const forms = {
    'Cash-ZW': document.getElementById('formCash-ZW'),
    'Bank-ZW': document.getElementById('formBank-ZW'),
    'Mobile-ZW': document.getElementById('formMobile-ZW')
  };

  let hasForms = false;
  Object.keys(forms).forEach(key => {
    const formElement = forms[key];
    if (!formElement) {
      console.error(`Form element ${key} not found in DOM`);
      return;
    }
    hasForms = true;
    if (key === `${selectedMethod}-ZW`) {
      formElement.classList.remove('hidden-form');
    } else {
      formElement.classList.add('hidden-form');
    }
  });

  if (!hasForms) {
    console.error('No payment forms found in DOM. Please check order.html.');
  }
};

// Pre-fill form with order details
const prefillForm = (order) => {
  const method = order.method;
  const paymentMethodSelect = document.getElementById('paymentMethod');
  if (!paymentMethodSelect) {
    console.error('Payment method select element not found');
    return;
  }
  paymentMethodSelect.value = method;

  togglePaymentForms(method);

  const formKey = `${method}-ZW`;
  const usdInput = document.getElementById(`usd${formKey}`);
  if (usdInput) {
    updateRateDisplay(formKey, `usd${formKey}`, `rate${formKey}`, `eff${formKey}`, `zar${formKey}`, parseFloat(order.usdAmount));
  } else {
    console.error(`USD input for ${formKey} not found`);
  }

  if (formKey === 'Cash-ZW') {
    document.getElementById('beneficiaryFullNameCash-ZW').value = order.beneficiary.fullName;
    document.getElementById('beneficiaryMobileCash-ZW').value = order.beneficiary.mobile;
    document.getElementById('beneficiaryGovtIdCash-ZW').value = order.beneficiary.govtId;
    document.getElementById('payoutLocationCash-ZW').value = order.beneficiary.payoutLocation;
  } else if (formKey.includes('Bank')) {
    document.getElementById(`accountHolderName${formKey}`).value = order.beneficiary.fullName;
    document.getElementById(`bankSelect${formKey}`).value = order.beneficiary.bank;
    document.getElementById(`accountNumber${formKey}`).value = order.beneficiary.accountNumber;
    document.getElementById(`branchCode${formKey}`).value = order.beneficiary.branchCode;
  } else if (formKey.includes('Mobile')) {
    document.getElementById(`beneficiaryNameMobile${formKey}`).value = order.beneficiary.fullName;
    document.getElementById(`beneficiaryMobileMobile${formKey}`).value = order.beneficiary.mobile;
    document.getElementById(`beneficiaryGovtIdMobile${formKey}`).value = order.beneficiary.govtId;
    document.getElementById(`walletMobile${formKey}`).value = order.beneficiary.wallet;
  }
};

// Handle form submission
const handleFormSubmission = (formId, formType) => {
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form ${formId} not found`);
    return;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log(`Form ${formId} submitted`);

    const paymentMethodSelect = document.getElementById('paymentMethod');
    if (!paymentMethodSelect) {
      console.error('Payment method select element not found');
      return;
    }
    if (!paymentMethodSelect.value) {
      console.log('Validation failed: Payment method not selected');
      paymentMethodSelect.classList.add('is-invalid');
      return;
    }
    paymentMethodSelect.classList.remove('is-invalid');
    console.log('Payment method selected:', paymentMethodSelect.value);

    let isValid = true;
    const usdInput = form.querySelector(`#usd${formType}`);
    if (!usdInput) {
      console.error(`USD input for ${formType} not found`);
      return;
    }
    const usdAmount = parseFloat(usdInput.value) || 0;
    if (usdAmount <= 0 || usdAmount % 5 !== 0) {
      console.log(`Validation failed: Invalid USD amount ${usdAmount}`);
      usdInput.classList.add('is-invalid');
      isValid = false;
    } else {
      usdInput.classList.remove('is-invalid');
      console.log('USD amount valid:', usdAmount);
    }

    const fullNameFields = [];
    if (formType === 'Cash-ZW') fullNameFields.push('beneficiaryFullNameCash-ZW');
    if (formType.includes('Bank')) fullNameFields.push(`accountHolderName${formType}`);
    if (formType.includes('Mobile')) fullNameFields.push(`beneficiaryNameMobile${formType}`);
    fullNameFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (!field) {
        console.error(`Field ${fieldId} not found`);
        isValid = false;
        return;
      }
      if (!field.value.trim()) {
        console.log(`Validation failed: ${fieldId} is empty`);
        field.classList.add('is-invalid');
        isValid = false;
      } else {
        field.classList.remove('is-invalid');
        console.log(`${fieldId} valid: ${field.value}`);
      }
    });

    if (!formType.includes('Bank')) {
      const beneficiaryMobile = document.getElementById(formType === 'Cash-ZW' ? 'beneficiaryMobileCash-ZW' : `beneficiaryMobileMobile${formType}`);
      if (!beneficiaryMobile) {
        console.error(`Beneficiary mobile for ${formType} not found`);
        isValid = false;
        return;
      }
      if (!beneficiaryMobile.value.trim()) {
        console.log('Validation failed: Beneficiary mobile is empty');
        beneficiaryMobile.classList.add('is-invalid');
        isValid = false;
      } else {
        beneficiaryMobile.classList.remove('is-invalid');
        console.log('Beneficiary mobile valid:', beneficiaryMobile.value);
      }

      const govtId = document.getElementById(formType === 'Cash-ZW' ? 'beneficiaryGovtIdCash-ZW' : `beneficiaryGovtIdMobile${formType}`);
      if (!govtId) {
        console.error(`Government ID for ${formType} not found`);
        isValid = false;
        return;
      }
      if (!govtId.value.trim()) {
        console.log('Validation failed: Government ID is empty');
        govtId.classList.add('is-invalid');
        isValid = false;
      } else {
        govtId.classList.remove('is-invalid');
        console.log('Government ID valid:', govtId.value);
      }
    }

    const selectFields = [];
    if (formType === 'Cash-ZW') selectFields.push('payoutLocationCash-ZW');
    if (formType.includes('Bank')) selectFields.push(`bankSelect${formType}`);
    if (formType.includes('Mobile')) selectFields.push(`walletMobile${formType}`);
    selectFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (!field) {
        console.error(`Select field ${fieldId} not found`);
        isValid = false;
        return;
      }
      if (!field.value) {
        console.log(`Validation failed: ${fieldId} not selected`);
        field.classList.add('is-invalid');
        isValid = false;
      } else {
        field.classList.remove('is-invalid');
        console.log(`${fieldId} valid: ${field.value}`);
      }
    });

    if (formType.includes('Bank')) {
      const accountNumber = document.getElementById(`accountNumber${formType}`);
      const branchCode = document.getElementById(`branchCode${formType}`);
      if (!accountNumber || !branchCode) {
        console.error(`Bank fields for ${formType} not found`);
        isValid = false;
        return;
      }
      if (!accountNumber.value.trim()) {
        console.log('Validation failed: Account number is empty');
        accountNumber.classList.add('is-invalid');
        isValid = false;
      } else {
        accountNumber.classList.remove('is-invalid');
        console.log('Account number valid:', accountNumber.value);
      }
      if (!branchCode.value.trim()) {
        console.log('Validation failed: Branch code is empty');
        branchCode.classList.add('is-invalid');
        isValid = false;
      } else {
        branchCode.classList.remove('is-invalid');
        console.log('Branch code valid:', branchCode.value);
      }
    }

    const senderDetails = JSON.parse(localStorage.getItem('senderDetails'));
    const userLocation = localStorage.getItem('userLocation');
    let validationError = '';
    if (!senderDetails) {
      validationError = 'Sender details are missing in localStorage.';
    } else if (!senderDetails.fullName) {
      validationError = 'Sender full name is missing.';
    } else if (!validateEmail(senderDetails.email)) {
      validationError = 'Sender email is invalid.';
    }

    if (validationError) {
      console.error(validationError, senderDetails);
      alert(validationError + ' Please re-register.');
      window.location.href = 'auth.html?mode=register&redirect=order.html';
      return;
    }
    console.log('Sender details validated:', senderDetails);

    if (isValid) {
      console.log('All validations passed, proceeding to save order');
      const { targetCurrency, effectiveRate } = updateRateDisplay(formType, `usd${formType}`, `rate${formType}`, `eff${formType}`, `zar${formType}`, usdAmount);
      if (!targetCurrency || !effectiveRate) {
        console.error('Failed to calculate rates for submission');
        return;
      }
      const convertedAmount = usdAmount * effectiveRate;
      const roundedAmount = roundToNearest10(convertedAmount);

      const order = {
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        method: paymentMethodSelect.value,
        destination: 'ZW',
        usdAmount: usdAmount.toFixed(2),
        convertedAmount: roundedAmount.toFixed(2),
        currency: targetCurrency,
        beneficiary: {
          fullName: document.getElementById(formType === 'Cash-ZW' ? 'beneficiaryFullNameCash-ZW' : formType.includes('Bank') ? `accountHolderName${formType}` : `beneficiaryNameMobile${formType}`)?.value || '',
          mobile: document.getElementById(formType === 'Cash-ZW' ? 'beneficiaryMobileCash-ZW' : formType.includes('Mobile') ? `beneficiaryMobileMobile${formType}` : '')?.value || '',
          govtId: document.getElementById(formType === 'Cash-ZW' ? 'beneficiaryGovtIdCash-ZW' : formType.includes('Mobile') ? `beneficiaryGovtIdMobile${formType}` : '')?.value || '',
          payoutLocation: document.getElementById(formType === 'Cash-ZW' ? 'payoutLocationCash-ZW' : '')?.value || '',
          bank: document.getElementById(formType.includes('Bank') ? `bankSelect${formType}` : '')?.value || '',
          accountNumber: document.getElementById(formType.includes('Bank') ? `accountNumber${formType}` : '')?.value || '',
          branchCode: document.getElementById(formType.includes('Bank') ? `branchCode${formType}` : '')?.value || '',
          wallet: document.getElementById(formType.includes('Mobile') ? `walletMobile${formType}` : '')?.value || ''
        },
        sender: senderDetails
      };

      saveOrder(order);

      const modal = new bootstrap.Modal(document.getElementById('submissionModal'));
      if (!modal) {
        console.error('Submission modal not found');
        return;
      }
      modal.show();
    } else {
      console.log('Form validation failed');
    }
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  console.log('Checking isLoggedIn on order.js load:', localStorage.getItem('isLoggedIn'), 'Result:', isLoggedIn);
  if (!isLoggedIn) {
    console.log('User not logged in. Redirecting to login.');
    window.location.href = 'auth.html?mode=login&redirect=order.html';
    return;
  }

  const userLocation = localStorage.getItem('userLocation');
  if (!['ZA', 'EU', 'UK'].includes(userLocation)) {
    console.error('Invalid user location for order placement:', userLocation);
    alert('This feature is only available for users in South Africa, Europe, or the United Kingdom.');
    window.location.href = 'index.html';
    return;
  }

  await fetchRates();

  const paymentMethodSelect = document.getElementById('paymentMethod');
  if (!paymentMethodSelect) {
    console.error('Payment method select element not found');
    return;
  }
  paymentMethodSelect.innerHTML = `
    <option value="">Select Payment Method</option>
    <option value="Cash">Cash Pickup</option>
    <option value="Bank">Bank Transfer</option>
    <option value="Mobile">Mobile Money</option>
  `;

  paymentMethodSelect.addEventListener('change', (e) => {
    togglePaymentForms(e.target.value);
  });

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  if (orderId !== null) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders[parseInt(orderId)];
    if (order) {
      console.log('Pre-filling form with order:', order);
      prefillForm(order);
    } else {
      console.error('Order not found for ID:', orderId);
    }
  } else {
    if (document.getElementById('usdCash-ZW')) {
      updateRateDisplay('Cash-ZW', 'usdCash-ZW', 'rateCash-ZW', 'effCash-ZW', 'zarCash-ZW');
    }
    if (document.getElementById('usdBank-ZW')) {
      updateRateDisplay('Bank-ZW', 'usdBank-ZW', 'rateBank-ZW', 'effBank-ZW', 'zarBank-ZW');
    }
    if (document.getElementById('usdMobile-ZW')) {
      updateRateDisplay('Mobile-ZW', 'usdMobile-ZW', 'rateMobile-ZW', 'effMobile-ZW', 'zarMobile-ZW');
    }
  }

  handleFormSubmission('formCash-ZW', 'Cash-ZW');
  handleFormSubmission('formBank-ZW', 'Bank-ZW');
  handleFormSubmission('formMobile-ZW', 'Mobile-ZW');
});