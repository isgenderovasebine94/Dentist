
const API_BASE = '/api';

const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const allNavLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});


allNavLinks.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});


const sections = document.querySelectorAll('section[id]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      allNavLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(sec => observer.observe(sec));

const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, 80 * (entry.target.dataset.delay || 0));
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

fadeEls.forEach((el, i) => {
  el.dataset.delay = i;
  fadeObserver.observe(el);
});

const toastEl = document.getElementById('toast');
let toastTimer = null;

function showToast(message, type = 'default') {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.className = 'toast show ' + type;
  toastTimer = setTimeout(() => {
    toastEl.className = 'toast';
  }, 4000);
}

function setError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.toggle('is-invalid', !!message);
  if (error) error.textContent = message || '';
}

function clearErrors(form) {
  form.querySelectorAll('.form-input').forEach(el => el.classList.remove('is-invalid'));
  form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[\+]?[\d\s\-\(\)]{7,}$/.test(phone.trim());
}

async function loadTestimonials() {
  const list = document.getElementById('testimonialsList');

  try {
    const res = await fetch(`${API_BASE}/testimonials`);
    if (!res.ok) throw new Error('Server xətası');
    const testimonials = await res.json();
    renderTestimonials(testimonials);
  } catch (err) {
   
    const local = getLocalTestimonials();
    if (local.length > 0) {
      renderTestimonials(local);
    } else {
      list.innerHTML = `<div class="loading-state"><p style="color:#94a3b8">Hələ heç bir rəy yoxdur. İlk rəyi siz yazın! 😊</p></div>`;
    }
  }
}

function renderTestimonials(testimonials) {
  const list = document.getElementById('testimonialsList');
  if (testimonials.length === 0) {
    list.innerHTML = `<div class="loading-state"><p style="color:#94a3b8">Hələ rəy yoxdur. İlk rəyi siz yazın! 😊</p></div>`;
    return;
  }

  list.innerHTML = testimonials.map(t => {
    const stars = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
    const initial = t.name ? t.name[0].toUpperCase() : '?';
    const date = t.createdAt ? new Date(t.createdAt).toLocaleDateString('az-AZ') : '';
    return `
      <div class="testimonial-card fade-in visible">
        <div class="testimonial-header">
          <div class="testimonial-avatar">${initial}</div>
          <div class="testimonial-info">
            <strong>${escapeHtml(t.name)}</strong>
            <small>${date}</small>
          </div>
        </div>
        <div class="testimonial-stars">${stars}</div>
        <p class="testimonial-message">${escapeHtml(t.message)}</p>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


function getLocalTestimonials() {
  try {
    return JSON.parse(localStorage.getItem('testimonials') || '[]');
  } catch { return []; }
}

function saveLocalTestimonial(t) {
  const existing = getLocalTestimonials();
  existing.unshift(t);
  localStorage.setItem('testimonials', JSON.stringify(existing));
}

const reviewModal = document.getElementById('reviewModal');
const openReviewBtn = document.getElementById('openReviewModal');
const closeReviewBtn = document.getElementById('closeReviewModal');
const cancelReviewBtn = document.getElementById('cancelReview');
const reviewForm = document.getElementById('reviewForm');

let selectedRating = 0;

function openModal() { reviewModal.classList.add('open'); }
function closeModal() {
  reviewModal.classList.remove('open');
  reviewForm.reset();
  selectedRating = 0;
  updateStars(0);
  clearErrors(reviewForm);
}

openReviewBtn.addEventListener('click', openModal);
closeReviewBtn.addEventListener('click', closeModal);
cancelReviewBtn.addEventListener('click', closeModal);
reviewModal.addEventListener('click', (e) => { if (e.target === reviewModal) closeModal(); });


const stars = document.querySelectorAll('#starRating .star');
stars.forEach(star => {
  star.addEventListener('mouseenter', () => updateStars(+star.dataset.value, true));
  star.addEventListener('mouseleave', () => updateStars(selectedRating));
  star.addEventListener('click', () => {
    selectedRating = +star.dataset.value;
    document.getElementById('reviewRating').value = selectedRating;
    updateStars(selectedRating);
    setError('reviewRating', 'reviewRatingError', '');
  });
});

function updateStars(value, isHover = false) {
  stars.forEach(s => {
    const v = +s.dataset.value;
    s.classList.toggle('active', !isHover && v <= value);
    s.classList.toggle('hover', isHover && v <= value);
  });
}


reviewForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors(reviewForm);

  const name = document.getElementById('reviewName').value.trim();
  const rating = +document.getElementById('reviewRating').value;
  const message = document.getElementById('reviewMessage').value.trim();

  let valid = true;
  if (name.length < 2) { setError('reviewName', 'reviewNameError', 'Ad ən az 2 hərf olmalıdır'); valid = false; }
  if (rating < 1 || rating > 5) { setError('reviewRating', 'reviewRatingError', 'Zəhmət olmasa reytinq seçin'); valid = false; }
  if (message.length < 5) { setError('reviewMessage', 'reviewMessageError', 'Rəy ən az 5 hərf olmalıdır'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('submitReview');
  btn.disabled = true;
  btn.textContent = 'Göndərilir...';

  const newReview = {
    id: Date.now(),
    name,
    rating,
    message,
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch(`${API_BASE}/testimonials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rating, message })
    });
    if (!res.ok) throw new Error();
    const saved = await res.json();
    Object.assign(newReview, saved);
  } catch {
   
    saveLocalTestimonial(newReview);
  }

  closeModal();
  showToast('Rəyiniz əlavə edildi! Təşəkkür edirik.', 'success');
  await loadTestimonials();

  btn.disabled = false;
  btn.textContent = 'Göndər';
});


const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors(contactForm);

  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const message = document.getElementById('contactMessage').value.trim();

  let valid = true;
  if (name.length < 2) { setError('contactName', 'contactNameError', 'Ad ən az 2 hərf olmalıdır'); valid = false; }
  if (!validateEmail(email)) { setError('contactEmail', 'contactEmailError', 'Düzgün e-poçt daxil edin'); valid = false; }
  if (message.length < 10) { setError('contactMessage', 'contactMessageError', 'Mesaj ən az 10 hərf olmalıdır'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('contactSubmit');
  btn.disabled = true;
  btn.textContent = 'Göndərilir...';

  try {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    if (!res.ok) throw new Error();
  } catch { /* Xəta olsa da alert göstər */ }

  contactForm.reset();
  btn.disabled = false;
  btn.textContent = 'Göndər';

 
  alert('Mesajınız göndərildi! Təşəkkür edirəm.');
});


const appointmentForm = document.getElementById('appointmentForm');
const appointmentSuccess = document.getElementById('appointmentSuccess');


const dateInput = document.getElementById('appDate');
const today = new Date().toISOString().split('T')[0];
dateInput.min = today;

appointmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors(appointmentForm);

  const name = document.getElementById('appName').value.trim();
  const phone = document.getElementById('appPhone').value.trim();
  const service = document.getElementById('appService').value;
  const date = document.getElementById('appDate').value;
  const time = document.getElementById('appTime').value;

  
  let valid = true;

  if (name.length < 2) {
    setError('appName', 'appNameError', 'Ad ən az 2 hərf olmalıdır');
    valid = false;
  }
  if (!validatePhone(phone)) {
    setError('appPhone', 'appPhoneError', 'Düzgün telefon nömrəsi daxil edin (min. 7 rəqəm)');
    valid = false;
  }
  if (!service) {
    setError('appService', 'appServiceError', 'Zəhmət olmasa xidmət seçin');
    valid = false;
  }
  if (!date) {
    setError('appDate', 'appDateError', 'Tarix seçin');
    valid = false;
  } else if (date < today) {
    setError('appDate', 'appDateError', 'Tarix bu gündən əvvəl ola bilməz');
    valid = false;
  }
  if (!time) {
    setError('appTime', 'appTimeError', 'Saat seçin');
    valid = false;
  }

  if (!valid) return;

  const btn = document.getElementById('appointmentSubmit');
  btn.disabled = true;
  btn.textContent = 'Göndərilir...';

  const appointment = { name, phone, service, date, time };

  
  saveLocalAppointment(appointment);

 
  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    });
    if (!res.ok) throw new Error();
  } catch {
    
  }

  btn.disabled = false;
  btn.textContent = 'Randevu Al';

  appointmentForm.style.display = 'none';
  appointmentSuccess.style.display = 'block';
});

function saveLocalAppointment(app) {
  try {
    const existing = JSON.parse(localStorage.getItem('appointments') || '[]');
    existing.push({ ...app, id: Date.now(), createdAt: new Date().toISOString() });
    localStorage.setItem('appointments', JSON.stringify(existing));
  } catch { /* ignore */ }
}

function resetAppointmentForm() {
  appointmentForm.reset();
  dateInput.min = today;
  appointmentForm.style.display = 'block';
  appointmentSuccess.style.display = 'none';
}


window.resetAppointmentForm = resetAppointmentForm;


document.addEventListener('DOMContentLoaded', () => {
  loadTestimonials();
});
