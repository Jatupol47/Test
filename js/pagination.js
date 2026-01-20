document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  // โหลด partial
  const res = await fetch('/partials/pagination.html');
  container.innerHTML = await res.text();

  const links = container.querySelectorAll('[data-page]');
  const prev = container.querySelector('.prev');
  const next = container.querySelector('.next');

  // หา page ปัจจุบันจาก URL
  const path = location.pathname;
  let currentPage = 1;

  links.forEach(link => {
    if (path.endsWith(link.getAttribute('href'))) {
      currentPage = Number(link.dataset.page);
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  // prev / next
  prev.href = links[currentPage - 2]
    ? links[currentPage - 2].getAttribute('href')
    : links[0].getAttribute('href');

  next.href = links[currentPage]
    ? links[currentPage].getAttribute('href')
    : links[links.length - 1].getAttribute('href');
});