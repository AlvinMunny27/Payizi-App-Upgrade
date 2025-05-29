console.log('index.js loaded');

const CURRENCIES = ['ZAR', 'EUR', 'GBP'];
const RATE_REFRESH_INTERVAL = 5 * 60 * 1000;
let lastRateFetch = 0;

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
    const timestamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    CURRENCIES.forEach(currency => {
      const rate = data.rates[currency];
      document.getElementById(`rate${currency}`).textContent = rate.toFixed(4);
      document.getElementById(`timestamp${currency}`).textContent = timestamp;
    });
    lastRateFetch = now;
  } catch (error) {
    console.error('Failed to fetch rates:', error);
    CURRENCIES.forEach(currency => {
      document.getElementById(`rate${currency}`).textContent = 'N/A';
      document.getElementById(`timestamp${currency}`).textContent = 'Failed to update';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  fetchRates();
  setInterval(fetchRates, RATE_REFRESH_INTERVAL);
});