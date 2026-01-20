async function loadHTML(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  const res = await fetch(file);
  el.innerHTML = await res.text();
}

document.addEventListener("DOMContentLoaded", () => {
  loadHTML("head", "../partials/head.html");
  loadHTML("nav", "../partials/nav.html");
  loadHTML("footer", "../partials/footer.html");
  loadHTML("pagination", "../partials/pagination.html");
});
