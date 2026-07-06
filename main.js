document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    
    // Smooth Navbar transition on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Robust smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    
                    // Small delay if coming from mobile menu to allow layout to settle
                    setTimeout(() => {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            }
        });
    });
    // ==========================================================================
    // 1. Ambient Background Particle Canvas
    // ==========================================================================
    const canvas = document.getElementById('ambient-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        // Handle resize
        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        // Particle Class
        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 1.5 + 0.5;
                this.speedX = Math.random() * 0.15 - 0.075;
                this.speedY = Math.random() * 0.15 - 0.075;
                this.alpha = Math.random() * 0.5 + 0.1;
                this.fadeSpeed = Math.random() * 0.005 + 0.002;
                this.fadeIn = Math.random() > 0.5;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                // Bounce bounds
                if (this.x < 0 || this.x > width) this.speedX *= -1;
                if (this.y < 0 || this.y > height) this.speedY *= -1;

                // Ambient twinkle
                if (this.fadeIn) {
                    this.alpha += this.fadeSpeed;
                    if (this.alpha >= 0.7) this.fadeIn = false;
                } else {
                    this.alpha -= this.fadeSpeed;
                    if (this.alpha <= 0.1) this.fadeIn = true;
                }
            }

            draw() {
                ctx.save();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 98, 65, ${this.alpha * 0.5})`;
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(0, 98, 65, 0.3)';
                ctx.fill();
                ctx.restore();
            }
        }

        // Initialize particles (slow moving starry dust)
        const particleCount = Math.min(60, Math.floor(width / 25));
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Animation loop
        function animateParticles() {
            ctx.clearRect(0, 0, width, height);
            
            // Draw very soft, permanent radial ambient glows
            const grad1 = ctx.createRadialGradient(width * 0.8, height * 0.2, 0, width * 0.8, height * 0.2, 400);
            grad1.addColorStop(0, 'rgba(0, 98, 65, 0.04)');
            grad1.addColorStop(1, 'rgba(242, 240, 235, 0)');
            ctx.fillStyle = grad1;
            ctx.fillRect(0, 0, width, height);

            const grad2 = ctx.createRadialGradient(width * 0.2, height * 0.8, 0, width * 0.2, height * 0.8, 300);
            grad2.addColorStop(0, 'rgba(30, 57, 50, 0.03)');
            grad2.addColorStop(1, 'rgba(242, 240, 235, 0)');
            ctx.fillStyle = grad2;
            ctx.fillRect(0, 0, width, height);

            // Draw and update particles
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    // ==========================================================================
    // 2. Interactive Rent vs. Asset Calculator
    // ==========================================================================
    const rentSlider = document.getElementById('monthly-rent');
    const periodSlider = document.getElementById('transition-period');
    const rentValDisplay = document.getElementById('rent-value');
    const periodValDisplay = document.getElementById('period-value');

    const wastedRentOutput = document.getElementById('wasted-rent');
    const keyownEquityOutput = document.getElementById('keyown-equity');
    const netAdvantageOutput = document.getElementById('net-advantage');

    if (rentSlider && periodSlider) {
        function formatCurrency(amount) {
            const lakhs = amount / 100000;
            if (lakhs >= 100) {
                const crores = lakhs / 100;
                return `₹${crores.toFixed(2)} Cr`;
            }
            return `₹${lakhs.toFixed(1)} Lakhs`;
        }

        function animateNumber(element, start, end, duration, isLakhs = true) {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const currentVal = Math.floor(progress * (end - start) + start);
                
                if (isLakhs) {
                    element.innerText = formatCurrency(currentVal);
                } else {
                    element.innerText = `₹${currentVal.toLocaleString('en-IN')}`;
                }
                
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }

        let lastWasted = 0;
        let lastEquity = 0;
        let lastAdvantage = 0;

        function calculateResults(animate = false) {
            const initialRent = parseInt(rentSlider.value);
            const months = parseInt(periodSlider.value);

            rentValDisplay.innerText = `₹${initialRent.toLocaleString('en-IN')}`;
            periodValDisplay.innerText = `${months} Months (${Math.round(months / 12)} yrs)`;

            // Formula: 10% annual rent escalation rate
            // Cumulative rent = Sum(Rent0 * (1.10)^floor(m/12))
            let totalWastedRent = 0;
            for (let m = 0; m < months; m++) {
                let y = Math.floor(m / 12);
                totalWastedRent += initialRent * Math.pow(1.10, y);
            }

            // Formula: 15% co-investment allocation, compounded monthly at 11.2% annual yield
            let accumulatedEquity = 0;
            const monthlyYield = 0.112 / 12;
            for (let m = 0; m < months; m++) {
                let y = Math.floor(m / 12);
                let currentMonthlyRent = initialRent * Math.pow(1.10, y);
                let contribution = currentMonthlyRent * 0.15; // 15% redirected
                accumulatedEquity = (accumulatedEquity + contribution) * (1 + monthlyYield);
            }

            // High premium multiplier match (e.g. 1.25x for premium strategy plans)
            let totalHOASAdvantage = accumulatedEquity;

            if (animate) {
                animateNumber(wastedRentOutput, lastWasted, totalWastedRent, 350);
                animateNumber(keyownEquityOutput, lastEquity, accumulatedEquity, 350);
                animateNumber(netAdvantageOutput, lastAdvantage, totalHOASAdvantage, 350);
            } else {
                wastedRentOutput.innerText = formatCurrency(totalWastedRent);
                keyownEquityOutput.innerText = formatCurrency(accumulatedEquity);
                netAdvantageOutput.innerText = formatCurrency(totalHOASAdvantage);
            }

            lastWasted = totalWastedRent;
            lastEquity = accumulatedEquity;
            lastAdvantage = totalHOASAdvantage;
        }

        // Event listeners
        rentSlider.addEventListener('input', () => calculateResults(false));
        periodSlider.addEventListener('input', () => calculateResults(false));
        
        // Final recalculation trigger on slider release for smooth animation transition
        rentSlider.addEventListener('change', () => calculateResults(true));
        periodSlider.addEventListener('change', () => calculateResults(true));

        // Initial setup
        calculateResults(false);
    }

    // ==========================================================================
    // 3. Collapsible FAQ Accordions
    // ==========================================================================
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        if (trigger) {
            trigger.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close other open accordions
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });

                // Toggle this accordion
                if (isActive) {
                    item.classList.remove('active');
                } else {
                    item.classList.add('active');
                }
            });
        }
    });

    // ==========================================================================
    // 4. Strategic Lead Assessment Form Submission
    // ==========================================================================
    const strategyForm = document.getElementById('strategy-form');
    const formSuccess = document.getElementById('form-success');

    if (strategyForm && formSuccess) {
        strategyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Collect info
            const userName = document.getElementById('user-name').value;
            const userEmail = document.getElementById('user-email').value;
            const userPhone = document.getElementById('user-phone').value;
            const userCity = document.getElementById('user-city').value;
            
            // --- Basic Validation ---
            // Phone: strip spaces and dashes, then check if it's 10 digits (with optional +91)
            const cleanPhone = userPhone.replace(/[\s\-]/g, '');
            const phoneRegex = /^(\+91)?\d{10}$/;
            if (!phoneRegex.test(cleanPhone)) {
                alert("Please enter a valid 10-digit phone number.");
                return;
            }
            
            // Email typo check (.con instead of .com)
            if (userEmail.toLowerCase().endsWith('.con')) {
                alert("It looks like there's a typo in your email (ends with .con). Did you mean .com?");
                return;
            }
            // ------------------------
            
            // 1. Send to our backend API (/api/assessment)
            const submitBtn = strategyForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processing...';
            submitBtn.disabled = true;

            const formData = new FormData();
            formData.append('name', userName);
            formData.append('email', userEmail);
            formData.append('phone', userPhone);
            formData.append('city', userCity);

            const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
                ? '/api/assessment' 
                : 'https://3d62c006e16d45.lhr.life/api/assessment';

            fetch(apiUrl, {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    console.log('Backend automation triggered successfully.');
                }
            })
            .catch(error => console.error('Error submitting form:', error))
            .finally(() => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            });
            
            // 2. Open WhatsApp
            const waText = `Hi, I'm interested in the HOAS Assessment.\n\n*Name:* ${userName}\n*Email:* ${userEmail}\n*Phone:* ${userPhone}\n*City:* ${userCity}`;
            const waUrl = `https://wa.me/919886535949?text=${encodeURIComponent(waText)}`;
            window.open(waUrl, '_blank');
            
            // Stagger transition effect
            strategyForm.style.opacity = '0';
            strategyForm.style.transition = 'opacity 0.4s ease';

            setTimeout(() => {
                strategyForm.classList.add('d-none');
                formSuccess.classList.remove('d-none');
                formSuccess.style.opacity = '0';
                formSuccess.style.transform = 'translateY(15px)';
                formSuccess.style.transition = 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
                
                // Personalize message
                const successHeading = formSuccess.querySelector('h3');
                if (successHeading) {
                    successHeading.innerText = `Assessment Request Submitted, ${userName.split(' ')[0]}!`;
                }

                setTimeout(() => {
                    formSuccess.style.opacity = '1';
                    formSuccess.style.transform = 'translateY(0)';
                }, 50);
            }, 400);
        });
    }

    // ==========================================================================
    // 5. Interactive Chatbot — Full Guided Flow
    // ==========================================================================
    const botTrigger  = document.getElementById('chatbot-trigger');
    const botClose    = document.getElementById('chat-close');
    const botRestart  = document.getElementById('chat-restart');
    const botWindow   = document.getElementById('chatbot-window');
    const chatMessages = document.getElementById('chat-messages');
    const chatOptions  = document.getElementById('chat-options');
    const chatTyping   = document.getElementById('chat-typing');
    const chatInput    = document.getElementById('chat-input');
    const chatSend     = document.getElementById('chat-send');
    const triggerBadge = document.getElementById('trigger-badge');

    if (!botTrigger || !botWindow) return;

    // ---- Conversation Script ----
    // Each step: { bot: [messages], opts: [{label, next}] | null }
    // null opts = free-text capture step
    const FLOW = {
        start: {
            bot: [
                '👋 Welcome to KeyOwn Habitat!',
                'I\'m your HOAS Assistant. I help renters like you plan their path to homeownership. Shall we get started?'
            ],
            opts: [
                { label: '✅ Yes, let\'s go!', next: 'rent' },
                { label: '❓ What is HOAS?',   next: 'what_is_hoas' },
            ]
        },
        what_is_hoas: {
            bot: [
                'HOAS stands for Home Ownership Advisory System. 🏠',
                'It\'s a structured, step-by-step framework that turns your monthly rent into a pathway to owning your own home — building your equity, credit, and wealth along the way.',
                'Ready to see if you qualify?'
            ],
            opts: [
                { label: '✅ Yes, check my eligibility', next: 'rent' },
                { label: '📞 Talk to an advisor',         next: 'whatsapp_direct' },
            ]
        },
        rent: {
            bot: ['What is your current monthly rent?'],
            opts: [
                { label: '₹15,000 – ₹30,000',  next: 'city' },
                { label: '₹30,000 – ₹60,000',  next: 'city' },
                { label: '₹60,000 – ₹1,00,000', next: 'city' },
                { label: '₹1,00,000+',          next: 'city' },
            ]
        },
        city: {
            bot: ['Great! Which city are you looking to own a home in?'],
            opts: [
                { label: '🏙 Bangalore',      next: 'timeline' },
                { label: '🏙 Mumbai',         next: 'timeline' },
                { label: '🏙 Delhi NCR',      next: 'timeline' },
                { label: '🏙 Pune',           next: 'timeline' },
                { label: '🏙 Hyderabad',      next: 'timeline' },
                { label: '🏙 Other city',     next: 'timeline' },
            ]
        },
        timeline: {
            bot: ['When are you hoping to transition from renting to owning?'],
            opts: [
                { label: '⚡ Within 1 year',   next: 'name' },
                { label: '📅 1 – 3 years',     next: 'name' },
                { label: '🗓 3 – 5 years',     next: 'name' },
                { label: '🔭 5+ years away',   next: 'name' },
            ]
        },
        name: {
            bot: ['Almost there! What\'s your name?'],
            opts: null,   // free-text capture
            capture: 'name',
            next: 'phone'
        },
        phone: {
            bot: ['Thanks, {name}! 🙌 Last step — what\'s the best number to reach you on WhatsApp?'],
            opts: null,
            capture: 'phone',
            next: 'final'
        },
        final: {
            bot: [
                'Perfect! Based on your profile, you are a strong candidate for our HOAS Framework. 🎉',
                'One of our senior advisors will contact you shortly to walk you through your personalised Downpayment Match Strategy.',
                'Click below to instantly connect on WhatsApp and fast-track your consultation!'
            ],
            opts: null,
            isEnd: true
        },
        whatsapp_direct: {
            bot: ['No problem! Click the button below to instantly chat with one of our senior advisors on WhatsApp. 📲'],
            opts: null,
            isEnd: true,
            directWA: true
        }
    };

    // ---- State ----
    let state = {};
    function resetState() {
        state = { step: 'start', data: {} };
    }
    resetState();

    // ---- Helpers ----
    function scrollBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping(show) {
        chatTyping.style.display = show ? 'flex' : 'none';
        if (show) scrollBottom();
    }

    function addMessage(text, isUser = false) {
        const el = document.createElement('div');
        el.className = `message ${isUser ? 'user-msg' : 'system-msg'}`;
        // Replace template vars
        Object.entries(state.data).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, v);
        });
        el.textContent = text;
        chatMessages.appendChild(el);
        scrollBottom();
        return el;
    }

    function clearOptions() {
        chatOptions.innerHTML = '';
    }

    function renderOptions(opts) {
        clearOptions();
        if (!opts) return;
        opts.forEach(({ label, next }) => {
            const btn = document.createElement('button');
            btn.className = 'chat-opt';
            btn.textContent = label;
            btn.addEventListener('click', () => handleOptionClick(label, next));
            chatOptions.appendChild(btn);
        });
    }

    function buildWAButton(directOnly) {
        const userData = state.data;
        const text = directOnly
            ? 'Hi! I want to know more about KeyOwn Habitat HOAS.'
            : `Hi! I'm ${userData.name || 'interested'}. I pay ${userData.rent || ''} rent and want to own a home in ${userData.city || ''}. My phone: ${userData.phone || ''}. Please guide me!`;
        const url = `https://wa.me/919876543210?text=${encodeURIComponent(text)}`;
        chatOptions.innerHTML = `
            <a href="${url}" target="_blank" class="btn btn-primary"
               style="text-decoration:none; text-align:center; justify-content:center; width:100%; font-size:0.88rem;">
               Connect on WhatsApp &nbsp;<i class="ph ph-whatsapp-logo"></i>
            </a>`;
    }

    // ---- Step runner ----
    function runStep(stepKey) {
        state.step = stepKey;
        const step = FLOW[stepKey];
        if (!step) return;

        const msgs = step.bot || [];
        showTyping(true);

        let delay = 700;
        msgs.forEach((msg, i) => {
            setTimeout(() => {
                if (i === msgs.length - 1) showTyping(false);
                addMessage(msg);
                if (i < msgs.length - 1) showTyping(true);
            }, delay * (i + 1));
        });

        const totalDelay = delay * (msgs.length + 1);

        setTimeout(() => {
            if (step.isEnd) {
                buildWAButton(step.directWA);
                chatInput.disabled = true;
                chatSend.disabled = true;
            } else if (step.opts) {
                renderOptions(step.opts);
                chatInput.disabled = true;
                chatSend.disabled = true;
            } else {
                // Free-text mode
                clearOptions();
                chatInput.disabled = false;
                chatSend.disabled = false;
                chatInput.focus();
            }
        }, totalDelay);
    }

    // ---- Option click ----
    function handleOptionClick(label, next) {
        // Track data by step
        const curStep = FLOW[state.step];
        if (state.step === 'rent') state.data.rent = label;
        if (state.step === 'city') state.data.city = label.replace(/🏙 /, '');
        if (state.step === 'timeline') state.data.timeline = label;

        addMessage(label, true);
        clearOptions();
        chatInput.disabled = true;
        chatSend.disabled = true;
        setTimeout(() => runStep(next), 400);
    }

    // ---- Free-text send ----
    function showInputError(msg) {
        // Remove any existing error
        const existing = document.getElementById('chat-input-error');
        if (existing) existing.remove();
        const err = document.createElement('div');
        err.id = 'chat-input-error';
        err.style.cssText = 'font-size:0.75rem; color:#ef4444; padding:0 1rem 0.4rem; background:#fff;';
        err.textContent = msg;
        chatInput.parentElement.insertAdjacentElement('beforebegin', err);
        chatInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            err.remove();
            chatInput.style.borderColor = '';
        }, 3000);
    }

    function handleFreeText() {
        const val = chatInput.value.trim();
        if (!val) return;

        const curStep = FLOW[state.step];

        // Validation per capture type
        if (curStep && curStep.capture === 'name') {
            if (val.length < 2 || !/^[a-zA-Z\s]+$/.test(val)) {
                showInputError('⚠️ Please enter a valid name (letters only, min 2 characters).');
                return;
            }
        }

        if (curStep && curStep.capture === 'phone') {
            const digits = val.replace(/[\s\-\+]/g, '');
            if (!/^[6-9]\d{9}$/.test(digits)) {
                showInputError('⚠️ Please enter a valid 10-digit Indian mobile number (starts with 6–9).');
                chatInput.select();
                return;
            }
        }

        // Clear any previous error styling
        const existing = document.getElementById('chat-input-error');
        if (existing) existing.remove();
        chatInput.style.borderColor = '';

        if (curStep && curStep.capture) {
            state.data[curStep.capture] = val;
        }
        addMessage(val, true);
        chatInput.value = '';
        chatInput.disabled = true;
        chatSend.disabled = true;
        const next = curStep ? curStep.next : null;
        if (next) setTimeout(() => runStep(next), 400);
    }

    chatSend.addEventListener('click', handleFreeText);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleFreeText();
    });

    // ---- Open / Close / Restart ----
    function openChat() {
        botWindow.classList.add('active');
        if (triggerBadge) triggerBadge.style.display = 'none';
        // Start the flow if messages area is empty
        if (chatMessages.children.length === 0) {
            runStep('start');
        }
    }

    function closeChat() {
        botWindow.classList.remove('active');
    }

    function restartChat() {
        chatMessages.innerHTML = '';
        clearOptions();
        chatInput.value = '';
        chatInput.disabled = false;
        chatSend.disabled = false;
        showTyping(false);
        resetState();
        runStep('start');
    }

    botTrigger.addEventListener('click', openChat);
    botClose.addEventListener('click', closeChat);
    botRestart.addEventListener('click', restartChat);

    // ==========================================================================
    // 6. IntersectionObserver Scroll Reveal Animations
    // ==========================================================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Stagger nested children animations if present
                const staggeredChildren = entry.target.querySelectorAll('.reveal-up:not(.visible)');
                staggeredChildren.forEach((child, index) => {
                    setTimeout(() => {
                        child.classList.add('visible');
                    }, index * 100);
                });
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Initial animations for Hero elements
    const heroElements = [
        document.querySelector('.badge'),
        document.querySelector('.headline'),
        document.querySelector('.subheadline'),
        document.querySelector('.hero-actions'),
        document.querySelector('.hero-visual')
    ];

    heroElements.forEach((el, index) => {
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 0.12}s`;
            
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 100);
        }
    });

    // Observe all other sections and elements
    document.querySelectorAll('.reveal-up').forEach(section => {
        revealObserver.observe(section);
    });

    // ---- Testimonials Slider Dots ----
    const track = document.querySelector('.testimonials-track');
    const dots = document.querySelectorAll('.slider-dots .dot');
    
    if (track && dots.length > 0) {
        // Update active dot on scroll
        track.addEventListener('scroll', () => {
            const scrollLeft = track.scrollLeft;
            // The cards have width: 85vw. It's best to find exact offsetWidth + gap
            const firstCard = track.querySelector('.testimonial-card');
            if (!firstCard) return;
            const cardWidth = firstCard.offsetWidth + parseFloat(window.getComputedStyle(track).gap || 16);
            
            let currentIndex = Math.round(scrollLeft / cardWidth);
            if (currentIndex > dots.length - 1) currentIndex = dots.length - 1;
            
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        });

        // Scroll to card on dot click
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const firstCard = track.querySelector('.testimonial-card');
                if (!firstCard) return;
                const cardWidth = firstCard.offsetWidth + parseFloat(window.getComputedStyle(track).gap || 16);
                track.scrollTo({
                    left: index * cardWidth,
                    behavior: 'smooth'
                });
            });
        });

        // Auto-play slideshow for mobile
        let slideInterval = setInterval(autoSlide, 3000);
        
        function autoSlide() {
            // Only auto-slide if it's in mobile view (dots are visible)
            if (window.getComputedStyle(document.querySelector('.slider-dots')).display === 'none') return;
            
            const firstCard = track.querySelector('.testimonial-card');
            if (!firstCard) return;
            const cardWidth = firstCard.offsetWidth + parseFloat(window.getComputedStyle(track).gap || 16);
            
            let currentIndex = Math.round(track.scrollLeft / cardWidth);
            let nextIndex = currentIndex + 1;
            
            if (nextIndex >= dots.length) {
                nextIndex = 0;
            }
            
            track.scrollTo({
                left: nextIndex * cardWidth,
                behavior: 'smooth'
            });
        }
        
        // Pause on touch/interaction
        track.addEventListener('touchstart', () => clearInterval(slideInterval), {passive: true});
        track.addEventListener('touchend', () => {
            clearInterval(slideInterval);
            slideInterval = setInterval(autoSlide, 3000);
        }, {passive: true});
    }
});
