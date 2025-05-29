console.log('auth.js loaded at ' + new Date().toISOString());

// Validate email
const validateEmail = (email) => {
  const cleanedEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(cleanedEmail);
  console.log(`Validating email "${cleanedEmail}": ${isValid}`);
  return isValid;
};

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'login';
  const redirect = urlParams.get('redirect') || 'order.html';
  console.log(`Mode: ${mode}, Redirect: ${redirect}`);

  const authTitle = document.getElementById('authTitle');
  const authForm = document.getElementById('authForm');
  const toggleAuthMode = document.getElementById('toggleAuthMode');
  const locationField = document.getElementById('locationField');
  const senderDetailsField = document.getElementById('senderDetailsField');
  const welcomeMessage = document.getElementById('welcomeMessage');
  const locationSelect = document.getElementById('location');
  const senderFullName = document.getElementById('senderFullName');
  const senderMobile = document.getElementById('senderMobile');

  if (!authTitle || !authForm || !toggleAuthMode || !locationField || !senderDetailsField || !welcomeMessage || !locationSelect || !senderFullName || !senderMobile) {
    console.error('Auth page elements missing');
    return;
  }

  const existingUser = JSON.parse(localStorage.getItem('user'));
  const existingLocation = localStorage.getItem('userLocation');
  console.log('Checking for existing user on page load:', existingUser);
  console.log('Checking for existing location on page load:', existingLocation);

  if (mode === 'login' && existingUser) {
    console.log('Returning user detected. Showing welcome back message.');
    welcomeMessage.style.display = 'block';
    welcomeMessage.textContent = 'Welcome Back!';
  } else {
    welcomeMessage.style.display = 'none';
  }

  if (mode === 'register') {
    authTitle.textContent = 'Register';
    toggleAuthMode.textContent = 'Switch to Login';
    toggleAuthMode.href = 'auth.html?mode=login&redirect=' + redirect;
    locationField.style.display = 'block';
    senderDetailsField.style.display = 'block';
    locationSelect.setAttribute('required', 'true');
    senderFullName.setAttribute('required', 'true');
    senderMobile.setAttribute('required', 'true');
  } else {
    authTitle.textContent = 'Login';
    toggleAuthMode.textContent = 'Switch to Register';
    toggleAuthMode.href = 'auth.html?mode=register&redirect=' + redirect;
    locationField.style.display = 'none';
    senderDetailsField.style.display = 'none';
    locationSelect.removeAttribute('required');
    senderFullName.removeAttribute('required');
    senderMobile.removeAttribute('required');
  }

  if (locationSelect && senderMobile) {
    locationSelect.addEventListener('change', (e) => {
      const location = e.target.value;
      if (location === 'ZA') {
        senderMobile.placeholder = "+27712345678 (South Africa)";
      } else if (location === 'EU') {
        senderMobile.placeholder = "+491234567890 (e.g., Germany)";
      } else if (location === 'UK') {
        senderMobile.placeholder = "+447123456789 (United Kingdom)";
      }
    });
  }

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!validateEmail(email)) {
      alert('Please enter a valid email address.');
      document.getElementById('email').classList.add('is-invalid');
      return;
    } else {
      document.getElementById('email').classList.remove('is-invalid');
    }

    if (!password) {
      alert('Please enter a password.');
      document.getElementById('password').classList.add('is-invalid');
      return;
    } else {
      document.getElementById('password').classList.remove('is-invalid');
    }

    if (mode === 'register') {
      const location = document.getElementById('location').value;
      const senderFullNameValue = document.getElementById('senderFullName').value;
      const senderMobileValue = document.getElementById('senderMobile').value;

      let isValid = true;

      if (!senderFullNameValue.trim()) {
        senderFullName.classList.add('is-invalid');
        isValid = false;
      } else {
        senderFullName.classList.remove('is-invalid');
      }

      if (!senderMobileValue.trim()) {
        senderMobile.classList.add('is-invalid');
        isValid = false;
      } else {
        senderMobile.classList.remove('is-invalid');
      }

      if (!location) {
        alert('Please select a transacting location.');
        locationSelect.classList.add('is-invalid');
        return;
      } else {
        locationSelect.classList.remove('is-invalid');
      }

      if (!isValid) {
        return;
      }

      const user = {
        email: email,
        password: password,
        fullName: senderFullNameValue,
        mobile: senderMobileValue
      };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userLocation', location);
      console.log('Set userLocation during registration:', localStorage.getItem('userLocation'));

      const senderDetails = {
        fullName: senderFullNameValue,
        email: email,
        mobile: senderMobileValue
      };
      localStorage.setItem('senderDetails', JSON.stringify(senderDetails));
      console.log('Sender details saved:', senderDetails);
    } else {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        console.log('No user found. Prompting to register.');
        alert('No account found. Please register first.');
        window.location.href = 'auth.html?mode=register&redirect=' + redirect;
        return;
      }

      if (user.email !== email || user.password !== password) {
        alert('Invalid email or password.');
        return;
      }

      if (!localStorage.getItem('userLocation')) {
        localStorage.setItem('userLocation', existingLocation || '');
      }
      if (!localStorage.getItem('senderDetails')) {
        const senderDetails = {
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile
        };
        localStorage.setItem('senderDetails', JSON.stringify(senderDetails));
      }
    }

    localStorage.setItem('isLoggedIn', 'true');
    console.log('isLoggedIn set to true:', localStorage.getItem('isLoggedIn'));
    window.location.href = redirect;
  });
});