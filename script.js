/* ═══════════════════════════════════════════════════
   STUDIO88 AI — INTERACTIVITY
   ═══════════════════════════════════════════════════ */

/* ── Booking Configuration ──────────────────────────
   We use a Cloudflare Pages Function at /functions/api/book.js
   to securely handle Brevo emails. No API keys should be
   pasted here for security!
   ─────────────────────────────────────────────────── */

// Apply theme early to prevent flash
let savedTheme = null;
try {
    savedTheme = localStorage.getItem('theme');
} catch (e) {
    console.warn('localStorage access denied (likely file:// protocol)');
}

if (savedTheme === 'light') {
    document.documentElement.classList.add('light-mode');
}

document.addEventListener('DOMContentLoaded', () => {

    /* ── Init Booking ───────────────────────────────── */
    // No initialization needed for FETCH-based booking

    /* ── Theme Toggle ──────────────────────────────── */
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('light-mode');
            document.body.classList.toggle('light-mode');
            const isLight = document.documentElement.classList.contains('light-mode');
            try {
                localStorage.setItem('theme', isLight ? 'light' : 'dark');
            } catch (e) {
                console.warn('localStorage access denied');
            }
        });
    }

    /* ── Sticky Navbar ─────────────────────────────── */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    /* ── Mobile Nav Toggle ─────────────────────────── */
    const navToggle = document.getElementById('navToggle');
    const navLinks  = document.getElementById('navLinks');
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    /* ── Smooth Scroll ─────────────────────────────── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    /* ── Intersection Observer (Reveal) ────────────── */
    const reveals     = document.querySelectorAll('.reveal');
    const observerOpts = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };
    const observer    = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOpts);
    reveals.forEach(el => observer.observe(el));


    /* ═══════════════════════════════════════════════
       CALENDAR WIDGET
       ═══════════════════════════════════════════════ */
    const calDays      = document.getElementById('calDays');
    const calMonth     = document.getElementById('calMonth');
    const calPrev      = document.getElementById('calPrev');
    const calNext      = document.getElementById('calNext');
    const timeSlots    = document.getElementById('timeSlots');
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    const selectedDT   = document.getElementById('selectedDateTime');
    const formSelected = document.getElementById('formSelected');

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const TIME_OPTIONS = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
        '04:00 PM', '04:30 PM'
    ];

    let currentDate = new Date();
    let viewMonth   = currentDate.getMonth();
    let viewYear    = currentDate.getFullYear();
    let selectedDay  = null;
    let selectedTime = null;

    function renderCalendar() {
        calMonth.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
        calDays.innerHTML = '';

        const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const today       = new Date();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'cal-day cal-day--empty';
            calDays.appendChild(empty);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dayEl   = document.createElement('div');
            dayEl.className = 'cal-day';
            dayEl.textContent = d;

            const thisDate = new Date(viewYear, viewMonth, d);
            const isPast   = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isSunday = thisDate.getDay() === 0;

            if (isPast || isSunday) {
                dayEl.classList.add('cal-day--disabled');
            } else {
                const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                if (isToday) dayEl.classList.add('cal-day--today');

                if (selectedDay && selectedDay.d === d && selectedDay.m === viewMonth && selectedDay.y === viewYear) {
                    dayEl.classList.add('cal-day--selected');
                }

                dayEl.addEventListener('click', () => selectDay(d));
            }

            calDays.appendChild(dayEl);
        }
    }

    function selectDay(d) {
        selectedDay  = { d, m: viewMonth, y: viewYear };
        selectedTime = null;
        renderCalendar();
        renderTimeSlots();
        updateSelectedDisplay();
    }

    function renderTimeSlots() {
        timeSlots.classList.add('visible');
        timeSlotsGrid.innerHTML = '';

        TIME_OPTIONS.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            if (selectedTime === time) slot.classList.add('time-slot--selected');
            slot.addEventListener('click', () => {
                selectedTime = time;
                renderTimeSlots();
                updateSelectedDisplay();
            });
            timeSlotsGrid.appendChild(slot);
        });
    }

    function updateSelectedDisplay() {
        if (selectedDay && selectedTime) {
            const dateStr = `${MONTHS[selectedDay.m]} ${selectedDay.d}, ${selectedDay.y}`;
            selectedDT.textContent = `${dateStr} at ${selectedTime}`;
            formSelected.classList.add('has-selection');
        } else if (selectedDay) {
            selectedDT.textContent = `${MONTHS[selectedDay.m]} ${selectedDay.d}, ${selectedDay.y} — pick a time`;
            formSelected.classList.add('has-selection');
        } else {
            selectedDT.textContent = 'Select a date & time';
            formSelected.classList.remove('has-selection');
        }
    }

    calPrev.addEventListener('click', () => {
        viewMonth--;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        renderCalendar();
    });
    calNext.addEventListener('click', () => {
        viewMonth++;
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        renderCalendar();
    });

    renderCalendar();


    /* ═══════════════════════════════════════════════
       PORTFOLIO CARD "INQUIRE" → BOOKING
       ═══════════════════════════════════════════════ */
    document.querySelectorAll('.card-cta').forEach(btn => {
        btn.addEventListener('click', () => {
            const appName  = btn.dataset.app;
            const appSelect = document.getElementById('bookingApp');
            for (const opt of appSelect.options) {
                if (opt.text === appName) { appSelect.value = opt.value; break; }
            }
            document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        });
    });


    /* ═══════════════════════════════════════════════
       FORM VALIDATION & SUBMISSION
       ═══════════════════════════════════════════════ */
    const form        = document.getElementById('bookingForm');
    const nameInput   = document.getElementById('bookingName');
    const emailInput  = document.getElementById('bookingEmail');
    const phoneInput  = document.getElementById('bookingPhone');
    const appSelect   = document.getElementById('bookingApp');
    const messageInput = document.getElementById('bookingMessage');
    const submitBtn   = document.getElementById('submitBtn');
    const modal       = document.getElementById('successModal');
    const modalText   = document.getElementById('modalText');
    const modalClose  = document.getElementById('modalClose');

    function showError(id, msg) {
        document.getElementById(id).textContent = msg;
    }
    function clearErrors() {
        ['nameError', 'emailError', 'appError'].forEach(id => showError(id, ''));
    }

    function setLoading(loading) {
        submitBtn.disabled = loading;
        submitBtn.classList.toggle('btn--loading', loading);
    }

    function showSubmitError(msg) {
        // Show error beneath the submit button
        let errEl = document.getElementById('submitError');
        if (!errEl) {
            errEl = document.createElement('p');
            errEl.id = 'submitError';
            errEl.className = 'submit-error';
            submitBtn.after(errEl);
        }
        errEl.textContent = msg;
    }
    function clearSubmitError() {
        const errEl = document.getElementById('submitError');
        if (errEl) errEl.textContent = '';
    }

    form.addEventListener('submit', async e => {
        e.preventDefault();
        clearErrors();
        clearSubmitError();
        let valid = true;

        console.log('--- Submit Event ---');
        console.log('selectedDay:', selectedDay);
        console.log('selectedTime:', selectedTime);

        if (!selectedDay || !selectedTime) {
            alert('Please select a date and time first. (Debug state printed in console)');
            valid = false;
        }
        if (!nameInput.value.trim()) {
            showError('nameError', 'Please enter your name.');
            valid = false;
        }
        if (!emailInput.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
            showError('emailError', 'Please enter a valid email.');
            valid = false;
        }
        if (!appSelect.value) {
            showError('appError', 'Please select an AI app.');
            valid = false;
        }

        if (!valid) return;

        const dateStr     = `${MONTHS[selectedDay.m]} ${selectedDay.d}, ${selectedDay.y}`;
        const meetingType = document.querySelector('input[name="meetingType"]:checked')?.value || 'virtual';
        const clientName  = nameInput.value.trim();
        const clientEmail = emailInput.value.trim();

        // ── Brevo / Cloudflare Function send ──────────
        setLoading(true);

        const payload = {
            from_name   : clientName,
            from_email  : clientEmail,
            phone       : phoneInput?.value.trim() || 'Not provided',
            app_interest: appSelect.value,
            meeting_type: meetingType === 'virtual' ? 'Virtual Call' : 'In-Person Meetup',
            booking_date: dateStr,
            booking_time: selectedTime,
            message     : messageInput?.value.trim() || 'No brief provided'
        };

        try {
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send');
            }

            // ── Success ──
            modalText.textContent = `Your call is booked for ${dateStr} at ${selectedTime}. A confirmation has been sent to ${clientEmail}.`;
            modal.classList.add('visible');

            // Reset form state
            form.reset();
            selectedDay  = null;
            selectedTime = null;
            timeSlots.classList.remove('visible');
            formSelected.classList.remove('has-selection');
            selectedDT.textContent = 'Select a date & time';
            renderCalendar();

        } catch (err) {
            console.error('Booking error:', err);
            showSubmitError(`⚠️ ${err.message || 'Something went wrong.'} Please try again or email us directly at hello@studio88.ai`);
        } finally {
            setLoading(false);
        }
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('visible');
    });
    modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('visible');
    });

});
