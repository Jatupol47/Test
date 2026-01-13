const popup = document.getElementById('popup');
const popupImg = document.getElementById('popupImg');
const closeBtn = document.getElementById('closeBtn');

if (popup && popupImg && closeBtn) {
  document.querySelectorAll('.gallery img').forEach(img => {
    img.addEventListener('click', () => {
      popupImg.src = img.src;
      popup.style.display = 'flex';
    });
  });

  closeBtn.addEventListener('click', () => {
    popup.style.display = 'none';
  });

  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.style.display = 'none';
    }
  });
}