document.addEventListener('DOMContentLoaded', () => {
  console.log('auth.js loaded at', new Date().toISOString());

  const authForm = document.getElementById('authForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const authTitle = document.getElementById('authTitle');
  const toggleAuthMode = document.getElementById('toggleAuthMode');
  const registerField = document.querySelector('.register-field');

  const urlParams = new URLSearchParams(window.location.search);
  let mode = urlParams.get('mode') || 'login';
  const redirect = urlParams.get('redirect') || 'order.html';
  console.log('Mode:', mode, 'Redirect:', redirect);

  if (mode === 'register') {
    authTitle.textContent = 'Register';
    toggleAuthMode.textContent = 'Already have an account? Sign In';
    registerField.classList.remove('d-none');
  } else {
    authTitle.textContent = 'Sign In';
    toggleAuthMode.textContent = "Don't have an account? Register";
    registerField.classList.add('d-none');
  }

  toggleAuthMode.addEventListener('click', (e) => {
    e.preventDefault();
    mode = mode === 'login' ? 'register' : 'login';
    const newUrl = `auth.html?mode=${mode}${redirect ? `&redirect=${redirect}` : ''}`;
    window.history.pushState({}, '', newUrl);
    if (mode === 'register') {
      authTitle.textContent = 'Register';
      toggleAuthMode.textContent = 'Already have an account? Sign In';
      registerField.classList.remove('d-none');
    } else {
      authTitle.textContent = 'Sign In';
      toggleAuthMode.textContent = "Don't have an account? Register";
      registerField.classList.add('d-none');
    }
    console.log('Toggled mode to:', mode);
  });

  const validateEmail = (input) => {
    if (!input.value || !/\S+@\S+\.\S+/.test(input.value)) {
      input.classList.add('is-invalid');
      input.setCustomValidity('Invalid email');
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.setCustomValidity('');
      return true;
    }
  };

  const validatePassword = (input) => {
    if (!input.value) {
      input.classList.add('is-invalid');
      input.setCustomValidity('Password required');
      return false;
    } else {
      input.classList.remove('is-invalid');
      input.setCustomValidity('');
      return true;
    }
  };

  const validateConfirmPassword = (password, confirm) => {
    if (confirm.value !== password.value) {
      confirm.classList.add('is-invalid');
      confirm.setCustomValidity('Passwords do not match');
      return false;
    } else {
      confirm.classList.remove('is-invalid');
      confirm.setCustomValidity('');
      return true;
    }
  };

  emailInput.addEventListener('input', () => validateEmail(emailInput));
  passwordInput.addEventListener('input', () => validatePassword(passwordInput));
  confirmPasswordInput.addEventListener('input', () => {
    if (mode === 'register') validateConfirmPassword(passwordInput, confirmPasswordInput);
  });

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Form submitted, mode:', mode);
    authForm.classList.add('was-validated');
    let isValid = true;
    isValid = validateEmail(emailInput) && isValid;
    isValid = validatePassword(passwordInput) && isValid;
    if (mode === 'register') {
      isValid = validateConfirmPassword(passwordInput, confirmPasswordInput) && isValid;
    }
    console.log('Form validation result:', isValid);
    if (isValid) {
      console.log(`${mode === 'register' ? 'Register' : 'Login'} submitted:`, {
        email: emailInput.value,
        password: passwordInput.value,
      });
      localStorage.setItem('isLoggedIn', 'true');
      console.log('isLoggedIn set to true, redirecting to:', redirect);
      window.location.href = redirect;
    } else {
      console.log('Validation failed, please check form inputs.');
    }
  });
});