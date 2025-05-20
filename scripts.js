document.addEventListener('DOMContentLoaded', () => {
  console.log('scripts.js loaded');

  // Rate constants
  let LIVE_RATE = 18.5; // Default fallback rate
  const DIVISORS = {
    Cash: 0.98,
    Bank: 0.945,
    Mobile: 0.95
  };

  // Form configurations
  const forms = [
    { formId: 'formCash', usdInputId: 'usdCash', rateId: 'rateCash', effId: 'effCash', zarId: 'zarCash', method: 'Cash' },
    { formId: 'formBank', usdInputId: 'usdBank', rateId: 'rateBank', effId: 'effBank', zarId: 'zarBank', method: 'Bank' },
    { formId: 'formMobile', usdInputId: 'usdMobile', rateId: 'rateMobile', effId: 'effMobile', zarId: 'zarMobile', method: 'Mobile', walletId: 'walletMobile' }
  ];

  // Update cost information
  const updateCost = (usdInput, rateSpan, effSpan, zarSpan, effectiveRate) => {
    const usd = parseFloat(usdInput.value) || 0;
    const zar = Math.ceil((usd * effectiveRate) / 10) * 10;

    rateSpan.textContent = LIVE_RATE.toFixed(4);
    effSpan.textContent = effectiveRate.toFixed(4);
    zarSpan.textContent = zar.toFixed(2);

    // Log visibility for debugging
    if (rateSpan.offsetParent === null) {
      console.log(`Note: ${rateSpan.id} is hidden (in inactive tab)`);
    }
  };

  // Set up each form
  const setupForm = ({ formId, usdInputId, rateId, effId, zarId, method, walletId }) => {
    const form = document.getElementById(formId);
    const usdInput = document.getElementById(usdInputId);
    const rateSpan = document.getElementById(rateId);
    const effSpan = document.getElementById(effId);
    const zarSpan = document.getElementById(zarId);
    const divisor = DIVISORS[method];
    const effectiveRate = LIVE_RATE / divisor;

    // Validate elements
    if (!form || !usdInput || !rateSpan || !effSpan || !zarSpan) {
      console.error(`Missing elements for ${formId}:`, {
        form: !!form,
        usdInput: !!usdInput,
        rateSpan: !!rateSpan,
        effSpan: !!effSpan,
        zarSpan: !!zarSpan
      });
      return;
    }

    console.log(`Setting up ${formId} with divisor ${divisor}, rate ${LIVE_RATE}`);

    // Handle input events
    usdInput.addEventListener('input', () => {
      console.log(`Input event for ${usdInputId}: ${usdInput.value}`);
      updateCost(usdInput, rateSpan, effSpan, zarSpan, effectiveRate);
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const usd = parseFloat(usdInput.value) || 0;

      // Wallet validation for Mobile method
      if (method === 'Mobile') {
        const wallet = document.getElementById(walletId).value;
        if (!wallet) {
          alert('Please select a mobile money wallet');
          form.classList.add('was-validated');
          return;
        }
      }

      // USD amount validation
      if (usd <= 0 || usd % 10 !== 0) {
        alert('Enter a USD amount >0 and multiple of 10');
        console.log(`Validation failed for ${formId}: USD=${usd}`);
        form.classList.add('was-validated');
        return;
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      let alertMessage = `${method} Order:\nUSD: ${usd}\nZAR: ${zarSpan.textContent}`;

      // Include wallet in alert for Mobile method
      if (method === 'Mobile') {
        alertMessage += `\nWallet: ${data.wallet}`;
      }

      // Include additional fields in alert
      if (method === 'Cash') {
        alertMessage += `\nBeneficiary: ${data.beneficiaryFullNameCash}\nMobile: ${data.beneficiaryMobileCash}\nSender: ${data.senderFullNameCash}`;
      } else if (method === 'Bank') {
        alertMessage += `\nBank: ${data.bankName}\nAccount: ${data.accountNumber}\nSender: ${data.senderFullNameBank}`;
      } else if (method === 'Mobile') {
        alertMessage += `\nBeneficiary: ${data.beneficiaryNameMobile}\nMobile: ${data.beneficiaryMobileMobile}\nSender: ${data.senderFullNameMobile}`;
      }

      alert(alertMessage);
      console.log(`Form ${formId} submitted:`, data);

      form.reset();
      updateCost(usdInput, rateSpan, effSpan, zarSpan, effectiveRate);
      zarSpan.textContent = '0.00';
      form.classList.remove('was-validated');
    });

    // Initialize cost display
    updateCost(usdInput, rateSpan, effSpan, zarSpan, effectiveRate);
  };

  // Fetch live rate and initialize forms
  fetch('https://open.er-api.com/v6/latest/USD')
    .then(response => {
      if (!response.ok) {
        throw new Error('API request failed');
      }
      return response.json();
    })
    .then(data => {
      LIVE_RATE = parseFloat(data.rates.ZAR) || LIVE_RATE;
      console.log(`Live rate fetched: ${LIVE_RATE}`);
    })
    .catch(error => {
      console.warn(`Failed to fetch live rate, using fallback: ${LIVE_RATE}`, error);
    })
    .finally(() => {
      // Initialize all forms after rate is fetched or fallback applied
      forms.forEach(setupForm);

      // Re-initialize form when tab is shown
      document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
          const targetId = e.target.getAttribute('aria-controls'); // e.g., 'cash', 'bank', 'mobile'
          const formConfig = forms.find(f => f.formId === `form${targetId.charAt(0).toUpperCase() + targetId.slice(1)}`);
          if (formConfig) {
            console.log(`Tab ${targetId} shown, re-initializing ${formConfig.formId}`);
            setupForm(formConfig);
          }
        });
      });
    });
});