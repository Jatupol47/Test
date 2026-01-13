// --- ฟังก์ชันเปลี่ยน QR ---
function changeQR(bank) {
  const imgElement = document.getElementById('qrCodeImage');
  const buttons = document.querySelectorAll('.bank-switcher button');

  buttons.forEach(btn => btn.classList.remove('active'));
  const selector = `.bank-switcher button[onclick="changeQR('${bank}')"]`;
  const btn = document.querySelector(selector);
  if (btn) btn.classList.add('active');

  if (bank === 'kbank') {
    imgElement.src = 'img/qr.png';
    imgElement.alt = 'QR Code ธนาคารกสิกรไทย';
  } else if (bank === 'bbl') {
    imgElement.src = 'img/qr2.png';
    imgElement.alt = 'QR Code ธนาคารกรุงเทพ';
  }
}


// --- Modal ใบลดหย่อน ---
const taxBtn = document.getElementById('taxReceiptBtn');
const modal = document.getElementById('taxReceiptModal');
const modalClose = document.getElementById('modalClose');
const taxForm = document.getElementById('taxForm');

function openModal() {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

if (taxBtn && modal && modalClose && taxForm) {
  taxBtn.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  taxForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('ส่งคำขอใบลดหย่อนเรียบร้อยแล้ว ทีมงานจะติดต่อกลับผ่านอีเมล');
    closeModal();
  });
}


// --- ปุ่มกลับขึ้นบนสุด ---
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add('show');
  } else {
    backToTopBtn.classList.remove('show');
  }
});

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});


// ===========================================
// ***   ระบบดึงและแสดงเวลาละหมาดอัตโนมัติ   ***
// ===========================================

const PRAYER_API_URL =
  "https://api.aladhan.com/v1/timingsByCity?city=Bangkok&country=Thailand&method=2";

// --- ฟังก์ชันล้างค่าเวลา เช่น "05:12 (ICT)" → "05:12"
function cleanTime(t) {
  return t.replace(/\s*\(.+\)/, "").trim();
}

// --- แปลงนาทีเป็น ชั่วโมง/นาที ---
function formatMinutesToHours(minutes) {
  if (minutes < 0) return "0 นาที";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  let result = [];
  if (hours > 0) result.push(`${hours} ชั่วโมง`);
  result.push(`${mins} นาที`);
  return result.join(" ");
}


// --- หาเวลาละหมาดถัดไป ---
function findNextPrayer(times) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const order = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  let prayerMinutes = {};
  order.forEach(p => {
    const [h, m] = cleanTime(times[p]).split(':').map(Number);
    prayerMinutes[p] = h * 60 + m;
  });

  let nextName = "";
  let minDiff = Infinity;

  order.forEach(p => {
    const diff = prayerMinutes[p] - nowMin;
    if (diff > 0 && diff < minDiff) {
      minDiff = diff;
      nextName = p;
    }
  });

  // ถ้าเลยเวลา Isha แล้ว → ซุบฮิวันใหม่
  if (!nextName) {
    nextName = "Fajr";
    minDiff = (24 * 60 - nowMin) + prayerMinutes["Fajr"];
  }

  return {
    originalEN: nextName,
    nameTH: {
      Fajr: "ซุบฮิ",
      Dhuhr: "ดุฮ์ริ",
      Asr: "อัศริ",
      Maghrib: "มัฆริบ",
      Isha: "อิชาอ์"
    }[nextName],
    time: cleanTime(times[nextName]),
    minutesUntil: minDiff
  };
}


// --- โหลดข้อมูลจาก API ---
async function loadPrayerTimes() {
  try {
    const response = await fetch(PRAYER_API_URL);
    const json = await response.json();

    if (json.code !== 200) {
      console.error("API Error:", json.status);
      return;
    }

    const timings = json.data.timings;

    // เวลาถัดไป
    const next = findNextPrayer(timings);
    const timeFormatted = formatMinutesToHours(next.minutesUntil);

    const widgetText = document.querySelector('.highlight-widget p');
    const widgetTableCells = document.querySelectorAll('.highlight-widget table td');

    if (widgetText) {
      widgetText.innerHTML = `<strong>เวลาถัดไป:</strong> ${next.nameTH} ในอีก ${timeFormatted}`;
    }

    // ตาราง header
    const dailyKeys = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    widgetTableCells.forEach((cell, i) => {
      const p = dailyKeys[i];
      cell.textContent = cleanTime(timings[p]);
      cell.classList.remove('next-time');

      if (p === next.originalEN) {
        cell.classList.add('next-time');
      }
    });

  } catch (err) {
    console.error("Fetch Error:", err);
  }
}


// --- เรียกใช้เมื่ออยู่ในหน้า "ตารางเวลาละหมาด" ---
if (document.title.includes('ตารางเวลาละหมาด')) {
  loadPrayerTimes();
}

// ===========================================
// ***           ตารางเวลาละหมาดรายเดือน           ***
// ===========================================

// API รายเดือน: ใช้ city + country + เดือน + ปี
function getMonthlyPrayerURL(month, year) {
    return `https://api.aladhan.com/v1/calendarByCity?city=Bangkok&country=Thailand&method=2&month=${month}&year=${year}`;
}

async function loadMonthlyPrayerTimes() {
    const now = new Date();
    const month = now.getMonth() + 1; 
    const year = now.getFullYear();
    const todayDate = now.getDate();
    
    const url = getMonthlyPrayerURL(month, year);

    const body = document.getElementById("monthlyTableBody");
    const monthDisplay = document.getElementById("currentMonth");

    // ตั้งชื่อเดือนไทย
    const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    monthDisplay.textContent = `${thaiMonths[month - 1]} ${year}`;

    try {
        const response = await fetch(url);
        const json = await response.json();

        if (json.code !== 200) {
            body.innerHTML = `<tr><td colspan="7">โหลดข้อมูลไม่สำเร็จ</td></tr>`;
            return;
        }

        const calendar = json.data;

        let html = "";

        calendar.forEach((day, index) => {
            const d = index + 1;
            const t = day.timings;

            // ล้าง "(ICT)"
            function clean(x) { return x.replace(/\s*\(.+\)/, ""); }

            const isToday = (d === todayDate);
            
            html += `
                <tr class="${isToday ? 'today-highlight' : ''}">
                    <td>${d}</td>
                    <td>${clean(t.Fajr)}</td>
                    <td>${clean(t.Sunrise)}</td>
                    <td>${clean(t.Dhuhr)}</td>
                    <td>${clean(t.Asr)}</td>
                    <td>${clean(t.Maghrib)}</td>
                    <td>${clean(t.Isha)}</td>
                </tr>
            `;
        });

        body.innerHTML = html;

    } catch (err) {
        console.error(err);
        body.innerHTML = `<tr><td colspan="7">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
    }
}


// 🔥 เรียกใช้งานเฉพาะหน้า "ตารางเวลาละหมาด"
if (document.title.includes("ตารางเวลาละหมาด")) {
    loadMonthlyPrayerTimes();
}

// ===========================================
// แสดงวันที่ปัจจุบันแบบไทย
// ===========================================
function updateCurrentDate() {
    const dateEl = document.getElementById("currentDate");
    if (!dateEl) return;

    const now = new Date();

    const thaiDays = [
        "อาทิตย์", "จันทร์", "อังคาร", "พุธ",
        "พฤหัสบดี", "ศุกร์", "เสาร์"
    ];

    const thaiMonths = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
        "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
        "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const day = thaiDays[now.getDay()];
    const date = now.getDate();
    const month = thaiMonths[now.getMonth()];
    const year = now.getFullYear() + 543; // แปลงเป็น พ.ศ.

    dateEl.textContent = `${day} ${date} ${month} พ.ศ. ${year}`;
}
// ===========================================
updateCurrentDate();
// ===========================================
