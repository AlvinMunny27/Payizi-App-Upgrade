console.log('Index page loaded at ' + new Date().toISOString());
const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
console.log('Checking isLoggedIn on index.js load:', localStorage.getItem('isLoggedIn'), 'Result:', isLoggedIn);

document.addEventListener('DOMContentLoaded', () => {
  // Update the navbar based on login status
  const navbarNav = document.querySelector('#navbarNav .navbar-nav');
  if (isLoggedIn) {
    navbarNav.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="order.html">Place Order</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="order-history.html">Order History</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#" id="logoutLink">Logout</a>
      </li>
    `;
  }

  // Update the "Get Started" button link based on login status
  const getStartedButton = document.querySelector('.btn-primary');
  if (getStartedButton) {
    if (isLoggedIn) {
      getStartedButton.href = 'order.html';
      console.log('User is logged in, "Get Started" button now links to order.html');
    } else {
      getStartedButton.href = 'auth.html?mode=login&redirect=order.html';
      console.log('User is not logged in, "Get Started" button links to login page');
    }
  } else {
    console.error('"Get Started" button not found');
  }
});