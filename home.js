document.addEventListener('DOMContentLoaded', () => {
  console.log('home.js loaded');

  // Rate constants
  let LIVE_RATE = 18.5;
  const RATE_REFRESH_INTERVAL = 5 * 60 * 1000;
  let lastRateFetch = 0;

  // Elements
  const calcForm = document.getElementById('calcForm');
  const calcUsd = document.getElementById('calcUsd');
  const calcRate = document.getElementById('calcRate');
  const calcZar = document.getElementById('calcZar');
  const rateDisplay = document.getElementById('rateDisplay');

  // Debounce utility
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Update calculator
  const updateCalc = (usdInput, rateSpan, zarSpan, isLoading = false) => {
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

  // Fetch live rate
  const fetchRate = async () => {
    const now = Date.now();
    if (now - lastRateFetch < RATE_REFRESH_INTERVAL) {
      console.log('Using cached rate:', LIVE_RATE);
      return LIVE_RATE;
    }
    updateCalc(calcUsd, calcRate, calcZar, true);
    rateDisplay.classList.add('loading');
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
      rateDisplay.classList.remove('loading');
    }
    return LIVE_RATE;
  };

  // Update exchange rate display
  const updateRateDisplay = () => {
    rateDisplay.textContent = `Current Rate: 1 USD = ${LIVE_RATE.toFixed(4)} ZAR`;
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

  // Initialize calculator
  calcUsd.addEventListener('input', debounce(() => {
    validateAmount(calcUsd);
    updateCalc(calcUsd, calcRate, calcZar);
  }, 300));

  calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateAmount(calcUsd)) {
      updateCalc(calcUsd, calcRate, calcZar);
    }
  });

  // Fetch rate and initialize
  fetchRate().then(() => {
    updateRateDisplay();
    updateCalc(calcUsd, calcRate, calcZar);
    setInterval(() => fetchRate().then(updateRateDisplay), RATE_REFRESH_INTERVAL);
  });
});