console.log('Index page loaded at ' + new Date().toISOString());
const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
console.log('Checking isLoggedIn on index.js load:', localStorage.getItem('isLoggedIn'), 'Result:', isLoggedIn);

document.addEventListener('DOMContentLoaded', () => {
  // Update the navbar based on login status
  const navbarNav = document.querySelector('#navbarNav .navbar-nav');
  if (navbarNav) {
    if (isLoggedIn) {
      navbarNav.innerHTML = `
        <li class="nav-item">
          <a class="nav-link${window.location.pathname.includes('index.html') ? ' active' : ''}" href="index.html">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link${window.location.pathname.includes('about.html') ? ' active' : ''}" href="about.html">About</a>
        </li>
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
    } else {
      navbarNav.innerHTML = `
        <li class="nav-item">
          <a class="nav-link${window.location.pathname.includes('index.html') ? ' active' : ''}" href="index.html">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link${window.location.pathname.includes('about.html') ? ' active' : ''}" href="about.html">About</a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="accountDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Account
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
            <li><a class="dropdown-item" href="auth.html?mode=login">Login</a></li>
            <li><a class="dropdown-item" href="auth.html?mode=register">Register</a></li>
          </ul>
        </li>
      `;
    }
  } else {
    console.error('Navbar navigation element not found');
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