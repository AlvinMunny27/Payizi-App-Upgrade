document.addEventListener('DOMContentLoaded', () => {
  console.log('Order history page loaded at ' + new Date().toISOString());

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  console.log('Checking isLoggedIn on order-history.js load:', localStorage.getItem('isLoggedIn'), 'Result:', isLoggedIn);
  if (!isLoggedIn) {
    console.log('User not logged in. Redirecting to login.');
    window.location.href = 'auth.html?mode=login&redirect=order-history.html';
    return;
  }

  const orderHistoryBody = document.getElementById('orderHistoryBody');
  if (!orderHistoryBody) {
    console.error('Order history table body not found');
    return;
  }

  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  if (orders.length === 0) {
    console.log('No orders found in localStorage');
    orderHistoryBody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found.</td></tr>';
    return;
  }

  console.log('Orders retrieved from localStorage:', orders);
  orders.forEach((order, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.reference || 'N/A'}</td>
      <td>${order.timestamp}</td>
      <td>${order.method}</td>
      <td>${order.destination}</td>
      <td>$${order.usdAmount}</td>
      <td>${order.currency} ${order.convertedAmount}</td>
      <td><a href="order.html?orderId=${index}" class="btn btn-sm btn-primary">Pay Again</a></td>
    `;
    orderHistoryBody.appendChild(row);
  });
});