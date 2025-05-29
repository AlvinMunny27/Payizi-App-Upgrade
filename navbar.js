document.addEventListener('DOMContentLoaded', () => {
  console.log('Navbar loaded at ' + new Date().toISOString());

  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('isLoggedIn');
      // Preserve user, userLocation, and senderDetails to avoid re-registration
      console.log('User logged out, preserving registration data');
      window.location.href = 'index.html';
    });
  }
});