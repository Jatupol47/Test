document.addEventListener('DOMContentLoaded', () => {
  initQRSwitcher();
  initTaxModal();
  initBackToTop();
  initPrayerTimes();
  initMonthlyPrayerTimes();
  initCurrentDate();
  initGallery();
});
// ==============================
// QR SWITCHER
// ==============================
function initQRSwitcher() {
  window.changeQR = function (bank) {
    const img = document.getElementById('qrCodeImage');
    const buttons = document.querySelectorAll('.bank-switcher button');
    if (!img) return;

    buttons.forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(
      `.bank-switcher button[onclick="changeQR('${bank}')"]`
    );
    if (btn) btn.classList.add('active');

    const map = {
      kbank: { src: 'img/qr.png', alt: 'QR Code ธนาคารกสิกรไทย' },
      bbl: { src: 'img/qr2.png', alt: 'QR Code ธนาคารกรุงเทพ' }
    };

    if (map[bank]) {
      img.src = map[bank].src;
      img.alt = map[bank].alt;
    }
  };
}

// ==============================
// TAX RECEIPT MODAL
// ==============================
function initTaxModal() {
  const btn = document.getElementById('taxReceiptBtn');
  const modal = document.getElementById('taxReceiptModal');
  const close = document.getElementById('modalClose');
  const form = document.getElementById('taxForm');

  if (!btn || !modal || !close || !form) return;

  const open = () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  };

  const hide = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  btn.addEventListener('click', open);
  close.addEventListener('click', hide);
  modal.addEventListener('click', e => e.target === modal && hide());

  form.addEventListener('submit', e => {
    e.preventDefault();
    alert('ส่งคำขอใบลดหย่อนเรียบร้อยแล้ว ทีมงานจะติดต่อกลับผ่านอีเมล');
    hide();
  });
}

// ==============================
// BACK TO TOP
// ==============================
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 300);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ==============================
// PRAYER TIME (DAILY)
// ==============================
const PRAYER_API =
  'https://api.aladhan.com/v1/timingsByCity?city=Bangkok&country=Thailand&method=2';

function cleanTime(t) {
  return t.replace(/\s*\(.+\)/, '');
}

function formatMinutes(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h ? h + ' ชั่วโมง ' : ''}${m} นาที`;
}

function findNextPrayer(times) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  const map = {};
  order.forEach(p => {
    const [h, m] = cleanTime(times[p]).split(':').map(Number);
    map[p] = h * 60 + m;
  });

  let next = order.find(p => map[p] > nowMin) || 'Fajr';
  let diff = next === 'Fajr'
    ? 1440 - nowMin + map.Fajr
    : map[next] - nowMin;

  return { next, diff };
}

async function initPrayerTimes() {
  if (!document.title.includes('ตารางเวลาละหมาด')) return;

  try {
    const res = await fetch(PRAYER_API);
    const json = await res.json();
    const times = json.data.timings;

    const { next, diff } = findNextPrayer(times);
    const text = document.querySelector('.highlight-widget p');
    const cells = document.querySelectorAll('.highlight-widget table td');

    const th = {
      Fajr: 'ซุบฮิ', Dhuhr: 'ดุฮ์ริ',
      Asr: 'อัศริ', Maghrib: 'มัฆริบ', Isha: 'อิชาอ์'
    };

    if (text) {
      text.innerHTML = `<strong>เวลาถัดไป:</strong> ${th[next]} ในอีก ${formatMinutes(diff)}`;
    }

    ['Fajr','Dhuhr','Asr','Maghrib','Isha'].forEach((p, i) => {
      if (!cells[i]) return;
      cells[i].textContent = cleanTime(times[p]);
      cells[i].classList.toggle('next-time', p === next);
    });

  } catch (e) {
    console.error(e);
  }
}

// ==============================
// PRAYER TIME (MONTHLY)
// ==============================
async function initMonthlyPrayerTimes() {
  if (!document.title.includes('ตารางเวลาละหมาด')) return;

  const body = document.getElementById('monthlyTableBody');
  const label = document.getElementById('currentMonth');
  if (!body || !label) return;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const today = now.getDate();

  const thaiMonths = [
    'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
  ];

  label.textContent = `${thaiMonths[month - 1]} ${year}`;

  const url =
    `https://api.aladhan.com/v1/calendarByCity?city=Bangkok&country=Thailand&method=2&month=${month}&year=${year}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    body.innerHTML = json.data.map((d, i) => `
      <tr class="${i + 1 === today ? 'today-highlight' : ''}">
        <td>${i + 1}</td>
        <td>${cleanTime(d.timings.Fajr)}</td>
        <td>${cleanTime(d.timings.Sunrise)}</td>
        <td>${cleanTime(d.timings.Dhuhr)}</td>
        <td>${cleanTime(d.timings.Asr)}</td>
        <td>${cleanTime(d.timings.Maghrib)}</td>
        <td>${cleanTime(d.timings.Isha)}</td>
      </tr>
    `).join('');

  } catch {
    body.innerHTML = `<tr><td colspan="7">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
  }
}

// ==============================
// CURRENT DATE (THAI)
// ==============================
function initCurrentDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;

  const d = new Date();
  const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const months = [
    'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
  ];

  el.textContent =
    `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
}

// ==============================
// GALLERY POPUP
// ==============================
function initGallery() {
  const popup = document.getElementById('popup');
  const img = document.getElementById('popupImg');
  const close = document.getElementById('closeBtn');
  const thumbs = document.querySelectorAll('.gallery img');

  if (!popup || !img || !close || thumbs.length === 0) return;

  thumbs.forEach(t =>
    t.addEventListener('click', () => {
      img.src = t.src;
      popup.style.display = 'flex';
    })
  );

  close.addEventListener('click', () => popup.style.display = 'none');
  popup.addEventListener('click', e => e.target === popup && (popup.style.display = 'none'));
}