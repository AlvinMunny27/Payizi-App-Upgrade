document.addEventListener('DOMContentLoaded', () => {
  console.log('home.js loaded');

  let LIVE_RATE = 18.5;
  const RATE_REFRESH_INTERVAL = 5 * 60 * 1000;
  let lastRateFetch = 0;

  const calcForm = document.getElementById('calcForm');
  const calcUsd = document.getElementById('calcUsd');
  const calcRate = document.getElementById('calcRate');
  const calcZar = document.getElementById('calcZar');
  const rateDisplay = document.getElementById('rateDisplay');

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const updateCost = (usdInput, rateSpan, zarSpan, isLoading = false) => {
    if (isLoading) {
      rateSpan.textContent = 'Loading...';
      zarSpan.textContent = 'Loading...';
      rateSpan.parentElement.classList.add('loading');
      return;
    }
    rateSpan.parentElement.classList.remove('loading');
    const usd = parseFloat(usdInput.value) || 0;
    const zar = Math.ceil((usd * LIVE_RATE) / 10) * 10;
    rateSpan.textContent = LIVE_RATE.toFixed(4);
    zarSpan.textContent = zar.toFixed(2);
  };

  const fetchRate = async () => {
    const now = Date.now();
    if (now - lastRateFetch < RATE_REFRESH_INTERVAL) {
      console.log('Using cached rate:', LIVE_RATE);
      return LIVE_RATE;
    }
    updateCost(calcUsd, calcRate, calcZar, true);
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

  const updateRateDisplay = () => {
    if (rateDisplay) {
      rateDisplay.textContent = `Current Rate: 1 USD = ${LIVE_RATE.toFixed(4)} ZAR`;
    }
  };

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

  calcUsd.addEventListener('input', debounce(() => {
    validateAmount(calcUsd);
    updateCost(calcUsd, calcRate, calcZar);
  }, 300));

  calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    calcForm.classList.add('was-validated');
    if (validateAmount(calcUsd)) {
      calcForm.classList.remove('was-validated');
    }
  });

  fetchRate().then(() => {
    updateRateDisplay();
    updateCost(calcUsd, calcRate, calcZar);
    setInterval(() => fetchRate().then(updateRateDisplay), RATE_REFRESH_INTERVAL);
  });
});
const usdInput = document.getElementById('usdInput'); // Replace with your actual ID
const zarOutput = document.getElementById('zarOutput'); // Replace with your actual ID
usdInput.addEventListener('input', function() {
  const usdValue = parseFloat(usdInput.value) || 0;
  const rate = 17.8533; // Update with your live rate
  zarOutput.textContent = `ZAR: ${(usdValue * rate).toFixed(2)}`;
});