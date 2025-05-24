// content.js

// Replaced 'unload' with 'beforeunload' to avoid permissions policy violation
window.addEventListener('beforeunload', (event) => {
  // Optional: Prompt user before leaving (e.g., to warn about unsaved changes)
  event.preventDefault();
  event.returnValue = ''; // Triggers a confirmation dialog if needed
  // Perform cleanup (e.g., save data, log out)
});

// Alternative: Use 'visibilitychange' for cleanup when the page is hidden
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Perform cleanup (e.g., save data, log out)
    navigator.sendBeacon('/api/logout', JSON.stringify({ userId: '123' }));
  }
});