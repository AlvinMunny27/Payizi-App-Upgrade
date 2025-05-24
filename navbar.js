// navbar.js
console.log('navbar.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const accountDropdown = document.getElementById('accountDropdown');
  const logoutLink = document.getElementById('logoutLink');

  if (isLoggedIn) {
    accountDropdown.style.display = 'none';
    logoutLink.style.display = 'block';
  } else {
    accountDropdown.style.display = 'block';
    logoutLink.style.display = 'none';
  }
});

function logout() {
  localStorage.removeItem('isLoggedIn');
  window.location.href = 'auth.html?mode=login';
}