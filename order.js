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
  let targetCurrency;
  if (userLocation === 'ZA') targetCurrency = 'ZAR';
  else if (userLocation === 'EU') targetCurrency = 'EUR';
  else if (userLocation === 'UK') targetCurrency = 'GBP';
  else {
    console.error('Invalid userLocation:', userLocation);
    return;
  }

  const liveRate = parseFloat(localStorage.getItem(`rate${targetCurrency}`)) || FALLBACK_RATES[targetCurrency];
  const feePercentage = REMITTANCE_FEE;
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

  usdInput.value = initialUsdAmount || '';
  const convertedAmount = initialUsdAmount * effectiveRate;
  const roundedAmount = roundToNearest10(convertedAmount);
  amountSpan.textContent = `${targetCurrency} ${roundedAmount.toFixed(2)}`;

  return { targetCurrency, effectiveRate };
};

// Add dynamic helper text
const addHelperText = () => {
  const helpTexts = {
    'amountHelpCash-ZW': 'Enter USD amount, must be a multiple of 5 (minimum $5)',
    'nameHelpCash-ZW': 'Enter full name of the beneficiary',
    'mobileHelpCash-ZW': 'Use format: +263 followed by 9 digits (e.g., +263771234567)',
    'govtIdHelpCash-ZW': 'Use format: XX-XXXXXXX-X-XX (e.g., 12-345678-A-90)',
    'payoutHelpCash-ZW': 'Select a payout location in Zimbabwe',
    'amountHelpBank-ZW': 'Enter USD amount, must be a multiple of 5 (minimum $5)',
    'nameHelpBank-ZW': 'Enter full name of the account holder',
    'bankHelpBank-ZW': 'Select the recipient’s bank',
    'accountHelpBank-ZW': 'Enter account number (6 or more digits)',
    'branchHelpBank-ZW': 'Enter branch code (e.g., 123-456)',
    'amountHelpMobile-ZW': 'Enter USD amount, must be a multiple of 5 (minimum $5)',
    'nameHelpMobile-ZW': 'Enter full name of the beneficiary',
    'mobileHelpMobile-ZW': 'Use format: +263 followed by 9 digits (e.g., +263771234567)',
    'govtIdHelpMobile-ZW': 'Use format: XX-XXXXXXX-X-XX (e.g., 12-345678-A-90)',
    'walletHelpMobile-ZW': 'Select a mobile wallet provider',
    'businessNameHelp-ZW': 'Enter the business name',
    'invoiceHelp-ZW': 'Use letters, numbers, or dashes (e.g., INV-2025-001)',
    'bankHelpBusiness-ZW': 'Select the business’s bank',
    'accountHelpBusiness-ZW': 'Enter account number (6 or more digits)',
    'branchHelpBusiness-ZW': 'Enter branch code (e.g., 123-456)',
    'amountHelpBusiness-ZW': 'Enter USD amount (minimum $0.50)',
    'studentNameHelp-ZW': 'Enter the student’s full name',
    'studentIdHelp-ZW': 'Enter the ID provided by the school (4+ characters, e.g., STU12345)',
    'schoolNameHelp-ZW': 'Enter the school’s name',
    'bankHelpSchool-ZW': 'Select the school’s bank',
    'accountHelpSchool-ZW': 'Enter account number (6 or more digits)',
    'branchHelpSchool-ZW': 'Enter branch code (e.g., 123-456)',
    'amountHelpSchool-ZW': 'Enter USD amount (minimum $0.50)',
    'billTypeHelp-ZW': 'Select the type of bill to pay',
    'billAccountHelp-ZW': 'Enter account or meter number (6 or more digits)',
    'amountHelpBill-ZW': 'Enter USD amount (minimum $0.50)',
    'airtimeMobileHelp-ZW': 'Use format: +263 followed by 9 digits (e.g., +263771234567)',
    'networkHelp-ZW': 'Select the network provider',
    'amountHelpAirtime-ZW': 'Enter USD amount (minimum $0.50)'
  };

  Object.keys(helpTexts).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = helpTexts[id];
      console.log(`Added helper text for ${id}: ${helpTexts[id]}`);
    } else {
      console.error(`Helper text element ${id} not found`);
    }
  });
};

// Toggle forms based on payment category and method
const toggleForms = (selectedCategory, selectedMethod = '') => {
  console.log(`Toggling forms for category: ${selectedCategory}, method: ${selectedMethod}`);
  const paymentMethodsDiv = document.getElementById('individualPaymentMethods');
  const forms = {
    'Cash-ZW': document.getElementById('formCash-ZW'),
    'Bank-ZW': document.getElementById('formBank-ZW'),
    'Mobile-ZW': document.getElementById('formMobile-ZW'),
    'Business-ZW': document.getElementById('formBusiness-ZW'),
    'School-ZW': document.getElementById('formSchool-ZW'),
    'Bill-ZW': document.getElementById('formBill-ZW'),
    'Airtime-ZW': document.getElementById('formAirtime-ZW')
  };

  // Normalize category for form key matching
  const normalizedCategory = selectedCategory ? 
    selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).toLowerCase() : '';

  paymentMethodsDiv.classList.toggle('hidden-form', selectedCategory !== 'individual');
  Object.keys(forms).forEach(key => {
    const formElement = forms[key];
    if (!formElement) {
      console.error(`Form element ${key} not found in DOM`);
      return;
    }
    if (selectedCategory === 'individual' && key === `${selectedMethod}-ZW`) {
      console.log(`Showing individual form: ${key}`);
      formElement.classList.remove('hidden-form');
    } else if (selectedCategory !== 'individual' && key === `${normalizedCategory}-ZW`) {
      console.log(`Showing category form: ${key}`);
      formElement.classList.remove('hidden-form');
    } else {
      formElement.classList.add('hidden-form');
    }
  });
};

// Validate fields
const validateField = (field, fieldId, regex = null, minLength = 1) => {
  if (!field) {
    console.error(`Field ${fieldId} not found`);
    return false;
  }
  const value = field.value.trim();
  if (!value || value.length < minLength || (regex && !regex.test(value))) {
    field.classList.add('is-invalid');
    console.log(`Validation failed for ${fieldId}: ${value}`);
    return false;
  }
  field.classList.remove('is-invalid');
  console.log(`${fieldId} valid: ${value}`);
  return true;
};

// Pre-fill form for Pay Again
const prefillForm = (order) => {
  const paymentCategorySelect = document.getElementById('paymentCategory');
  const paymentMethodSelect = document.getElementById('paymentMethod');
  if (!paymentCategorySelect) {
    console.error('Payment category select not found');
    return;
  }

  paymentCategorySelect.value = order.category;
  toggleForms(order.category, order.method);

  if (order.category === 'individual') {
    if (paymentMethodSelect) {
      paymentMethodSelect.value = order.method || '';
      toggleForms('individual', order.method);
    }
    const formId = `form${order.method}-ZW`;
    const form = document.getElementById(formId);
    if (form && order.beneficiary) {
      if (order.method === 'Cash') {
        document.getElementById('usdCash-ZW').value = order.usdAmount || '';
        document.getElementById('beneficiaryFullNameCash-ZW').value = order.beneficiary.fullName || '';
        document.getElementById('beneficiaryMobileCash-ZW').value = order.beneficiary.mobile || '';
        document.getElementById('beneficiaryGovtIdCash-ZW').value = order.beneficiary.govtId || '';
        document.getElementById('payoutLocationCash-ZW').value = order.beneficiary.payoutLocation || '';
      } else if (order.method === 'Bank') {
        document.getElementById('usdBank-ZW').value = order.usdAmount || '';
        document.getElementById('accountHolderNameBank-ZW').value = order.beneficiary.fullName || '';
        document.getElementById('bankSelectBank-ZW').value = order.beneficiary.bank || '';
        document.getElementById('accountNumberBank-ZW').value = order.beneficiary.accountNumber || '';
        document.getElementById('branchCodeBank-ZW').value = order.beneficiary.branchCode || '';
      } else if (order.method === 'Mobile') {
        document.getElementById('usdMobile-ZW').value = order.usdAmount || '';
        document.getElementById('beneficiaryNameMobile-ZW').value = order.beneficiary.fullName || '';
        document.getElementById('beneficiaryMobileMobile-ZW').value = order.beneficiary.mobile || '';
        document.getElementById('beneficiaryGovtIdMobile-ZW').value = order.beneficiary.govtId || '';
        document.getElementById('walletMobile-ZW').value = order.beneficiary.wallet || '';
      }
      console.log(`Pre-filled form ${formId} with order data`, order);
    }
  } else if (order.category === 'business') {
    const form = document.getElementById('formBusiness-ZW');
    if (form && order.beneficiary) {
      document.getElementById('usdBusiness-ZW').value = order.usdAmount || '';
      document.getElementById('businessName-ZW').value = order.beneficiary.businessName || '';
      document.getElementById('invoiceNumber-ZW').value = order.beneficiary.invoiceNumber || '';
      document.getElementById('businessBank-ZW').value = order.beneficiary.bank || '';
      document.getElementById('businessAccountNumber-ZW').value = order.beneficiary.accountNumber || '';
      document.getElementById('businessBranchCode-ZW').value = order.beneficiary.branchCode || '';
      console.log('Pre-filled formBusiness-ZW with order data', order);
    }
  } else if (order.category === 'school') {
    const form = document.getElementById('formSchool-ZW');
    if (form && order.beneficiary) {
      document.getElementById('usdSchool-ZW').value = order.usdAmount || '';
      document.getElementById('studentName-ZW').value = order.beneficiary.studentName || '';
      document.getElementById('studentId-ZW').value = order.beneficiary.studentId || '';
      document.getElementById('schoolName-ZW').value = order.beneficiary.schoolName || '';
      document.getElementById('schoolBank-ZW').value = order.beneficiary.bank || '';
      document.getElementById('schoolAccountNumber-ZW').value = order.beneficiary.accountNumber || '';
      document.getElementById('schoolBranchCode-ZW').value = order.beneficiary.branchCode || '';
      console.log('Pre-filled formSchool-ZW with order data', order);
    }
  } else if (order.category === 'bill') {
    const form = document.getElementById('formBill-ZW');
    if (form && order.beneficiary) {
      document.getElementById('usdBill-ZW').value = order.usdAmount || '';
      document.getElementById('billType-ZW').value = order.beneficiary.billType || '';
      document.getElementById('billAccountNumber-ZW').value = order.beneficiary.accountNumber || '';
      console.log('Pre-filled formBill-ZW with order data', order);
    }
  } else if (order.category === 'airtime') {
    const form = document.getElementById('formAirtime-ZW');
    if (form && order.beneficiary) {
      document.getElementById('usdAirtime-ZW').value = order.usdAmount || '';
      document.getElementById('airtimeMobile-ZW').value = order.beneficiary.mobile || '';
      document.getElementById('networkProvider-ZW').value = order.beneficiary.networkProvider || '';
      console.log('Pre-filled formAirtime-ZW with order data', order);
    }
  }
};

// Handle form submission
const handleFormSubmission = (formId, formType, category, validationFields) => {
  const form = document.getElementById(formId);
  if (!form) {
    console.error(`Form ${formId} not found`);
    return;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log(`Form ${formId} submitted`);

    let isValid = true;
    const paymentCategorySelect = document.getElementById('paymentCategory');
    if (!paymentCategorySelect || !paymentCategorySelect.value) {
      console.error('Payment category not selected');
      paymentCategorySelect.classList.add('is-invalid');
      return;
    }
    paymentCategorySelect.classList.remove('is-invalid');

    if (category === 'individual') {
      const paymentMethodSelect = document.getElementById('paymentMethod');
      if (!paymentMethodSelect || !paymentMethodSelect.value) {
        console.error('Payment method not selected');
        paymentMethodSelect.classList.add('is-invalid');
        return;
      }
      paymentMethodSelect.classList.remove('is-invalid');
    }

    // Validate amount
    let usdAmount = 0;
    const usdInput = document.getElementById(`usd${formType}`);
    usdAmount = parseFloat(usdInput.value) || 0;

    if (['Cash-ZW', 'Bank-ZW', 'Mobile-ZW'].includes(formType)) {
      if (usdAmount < 5 || usdAmount % 5 !== 0) {
        console.log(`Validation failed: Invalid USD amount ${usdAmount} for ${formType} (must be multiple of 5, minimum $5)`);
        usdInput.classList.add('is-invalid');
        isValid = false;
      } else {
        usdInput.classList.remove('is-invalid');
      }
    } else {
      if (usdAmount < 0.50) {
        console.log(`Validation failed: Invalid USD amount ${usdAmount} for ${formType} (minimum $0.50)`);
        usdInput.classList.add('is-invalid');
        isValid = false;
      } else {
        usdInput.classList.remove('is-invalid');
      }
    }

    // Validate category-specific fields
    validationFields.forEach(({ id, regex, minLength }) => {
      const field = document.getElementById(id);
      if (!validateField(field, id, regex, minLength)) {
        isValid = false;
      }
    });

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

    if (isValid) {
      console.log('All validations passed, proceeding to save order');
      let order = {
        timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        category,
        destination: 'ZW',
        usdAmount: usdAmount.toFixed(2),
        sender: senderDetails
      };

      // Set method based on category
      if (category === 'individual') {
        order.method = document.getElementById('paymentMethod').value;
      } else if (category === 'business') {
        order.method = 'Bank Transfer';
      } else if (category === 'school') {
        order.method = 'Bank Transfer';
      } else if (category === 'bill') {
        order.method = 'Bill Payment';
      } else if (category === 'airtime') {
        order.method = 'Airtime Purchase';
      }

      // Apply rate calculations for all categories
      const rateFormType = formType === 'Airtime-ZW' ? 'Air-ZW' : formType; // Adjust for Airtime ID
      const { targetCurrency, effectiveRate } = updateRateDisplay(
        rateFormType,
        `usd${formType}`,
        `rate${rateFormType}`,
        `eff${rateFormType}`,
        `zar${rateFormType}`,
        usdAmount
      );
      if (!targetCurrency || !effectiveRate) {
        console.error('Failed to calculate rates for submission');
        return;
      }
      const convertedAmount = usdAmount * effectiveRate;
      const roundedAmount = roundToNearest10(convertedAmount);
      order.convertedAmount = roundedAmount.toFixed(2);
      order.currency = targetCurrency;

      if (category === 'individual') {
        order.beneficiary = {
          fullName: document.getElementById(formType === 'Cash-ZW' ? 'beneficiaryFullNameCash-ZW' : formType === 'Bank-ZW' ? 'accountHolderNameBank-ZW' : 'beneficiaryNameMobile-ZW')?.value || '',
          mobile: document.getElementById(formType === 'Cash-ZW' ? 'beneficiaryMobileCash-ZW' : formType === 'Mobile-ZW' ? 'beneficiaryMobileMobile-ZW' : '')?.value || '',
          govtId: document.getElementById(formType === 'Cash-ZW' ? 'beneficiaryGovtIdCash-ZW' : formType === 'Mobile-ZW' ? 'beneficiaryGovtIdMobile-ZW' : '')?.value || '',
          payoutLocation: document.getElementById(formType === 'Cash-ZW' ? 'payoutLocationCash-ZW' : '')?.value || '',
          bank: document.getElementById(formType === 'Bank-ZW' ? 'bankSelectBank-ZW' : '')?.value || '',
          accountNumber: document.getElementById(formType === 'Bank-ZW' ? 'accountNumberBank-ZW' : '')?.value || '',
          branchCode: document.getElementById(formType === 'Bank-ZW' ? 'branchCodeBank-ZW' : '')?.value || '',
          wallet: document.getElementById(formType === 'Mobile-ZW' ? 'walletMobile-ZW' : '')?.value || ''
        };
      } else if (category === 'business') {
        order.beneficiary = {
          businessName: document.getElementById('businessName-ZW')?.value || '',
          invoiceNumber: document.getElementById('invoiceNumber-ZW')?.value || '',
          bank: document.getElementById('businessBank-ZW')?.value || '',
          accountNumber: document.getElementById('businessAccountNumber-ZW')?.value || '',
          branchCode: document.getElementById('businessBranchCode-ZW')?.value || ''
        };
      } else if (category === 'school') {
        order.beneficiary = {
          studentName: document.getElementById('studentName-ZW')?.value || '',
          studentId: document.getElementById('studentId-ZW')?.value || '',
          schoolName: document.getElementById('schoolName-ZW')?.value || '',
          bank: document.getElementById('schoolBank-ZW')?.value || '',
          accountNumber: document.getElementById('schoolAccountNumber-ZW')?.value || '',
          branchCode: document.getElementById('schoolBranchCode-ZW')?.value || ''
        };
      } else if (category === 'bill') {
        order.beneficiary = {
          billType: document.getElementById('billType-ZW')?.value || '',
          accountNumber: document.getElementById('billAccountNumber-ZW')?.value || ''
        };
      } else if (category === 'airtime') {
        order.beneficiary = {
          mobile: document.getElementById('airtimeMobile-ZW')?.value || '',
          networkProvider: document.getElementById('networkProvider-ZW')?.value || ''
        };
      }

      saveOrder(order);

      const modal = new bootstrap.Modal(document.getElementById('submissionModal'));
      if (!modal) {
        console.error('Submission modal not found');
        return;
      }
      modal.show();
      form.reset();
      paymentCategorySelect.value = '';
      toggleForms('');
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
  addHelperText();

  const paymentCategorySelect = document.getElementById('paymentCategory');
  const paymentMethodSelect = document.getElementById('paymentMethod');
  if (!paymentCategorySelect || !paymentMethodSelect) {
    console.error('Category or method select element not found');
    return;
  }

  // Handle Pay Again query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  const orderRef = urlParams.get('orderRef');
  if (category && orderRef) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.reference === orderRef && o.category === category);
    if (order) {
      console.log('Pre-filling form for Pay Again:', order);
      prefillForm(order);
    } else {
      console.error('Order not found for Pay Again:', { category, orderRef });
    }
  }

  paymentCategorySelect.addEventListener('change', (e) => {
    console.log(`Category changed to: ${e.target.value}`);
    toggleForms(e.target.value);
  });

  paymentMethodSelect.addEventListener('change', (e) => {
    console.log(`Method changed to: ${e.target.value}`);
    if (paymentCategorySelect.value === 'individual') {
      toggleForms('individual', e.target.value);
    }
  });

  // Initialize rate displays
  ['Cash-ZW', 'Bank-ZW', 'Mobile-ZW', 'Business-ZW', 'School-ZW', 'Bill-ZW', 'Air-ZW'].forEach(formType => {
    const inputId = formType === 'Air-ZW' ? 'usdAirtime-ZW' : `usd${formType}`;
    if (document.getElementById(inputId)) {
      updateRateDisplay(formType, inputId, `rate${formType}`, `eff${formType}`, `zar${formType}`);
    }
  });

  // Form submissions with validations
  handleFormSubmission('formCash-ZW', 'Cash-ZW', 'individual', [
    { id: 'beneficiaryFullNameCash-ZW', minLength: 2 },
    { id: 'beneficiaryMobileCash-ZW', regex: /^\+263\d{9}$/ },
    { id: 'beneficiaryGovtIdCash-ZW', regex: /^\d{2}-\d{7}[A-Z]\d{2}$/ },
    { id: 'payoutLocationCash-ZW' }
  ]);

  handleFormSubmission('formBank-ZW', 'Bank-ZW', 'individual', [
    { id: 'accountHolderNameBank-ZW', minLength: 2 },
    { id: 'bankSelectBank-ZW' },
    { id: 'accountNumberBank-ZW', minLength: 6 },
    { id: 'branchCodeBank-ZW', minLength: 5 }
  ]);

  handleFormSubmission('formMobile-ZW', 'Mobile-ZW', 'individual', [
    { id: 'beneficiaryNameMobile-ZW', minLength: 2 },
    { id: 'beneficiaryMobileMobile-ZW', regex: /^\+263\d{9}$/ },
    { id: 'beneficiaryGovtIdMobile-ZW', regex: /^\d{2}-\d{7}[A-Z]\d{2}$/ },
    { id: 'walletMobile-ZW' }
  ]);

  handleFormSubmission('formBusiness-ZW', 'Business-ZW', 'business', [
    { id: 'businessName-ZW', minLength: 2 },
    { id: 'invoiceNumber-ZW', regex: /^[A-Za-z0-9\-]+$/ },
    { id: 'businessBank-ZW' },
    { id: 'businessAccountNumber-ZW', minLength: 6 },
    { id: 'businessBranchCode-ZW', minLength: 5 }
  ]);

  handleFormSubmission('formSchool-ZW', 'School-ZW', 'school', [
    { id: 'studentName-ZW', minLength: 2 },
    { id: 'studentId-ZW', minLength: 4 },
    { id: 'schoolName-ZW', minLength: 2 },
    { id: 'schoolBank-ZW' },
    { id: 'schoolAccountNumber-ZW', minLength: 6 },
    { id: 'schoolBranchCode-ZW', minLength: 5 }
  ]);

  handleFormSubmission('formBill-ZW', 'Bill-ZW', 'bill', [
    { id: 'billType-ZW' },
    { id: 'billAccountNumber-ZW', minLength: 6 }
  ]);

  handleFormSubmission('formAirtime-ZW', 'Airtime-ZW', 'airtime', [
    { id: 'airtimeMobile-ZW', regex: /^\+263\d{9}$/ },
    { id: 'networkProvider-ZW' }
  ]);
});