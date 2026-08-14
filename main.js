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
    // 2. Interactive Your Rent Journey Calculator
    // ==========================================================================
    const rentSlider = document.getElementById('monthly-rent');
    const increaseSlider = document.getElementById('annual-increase');
    const yearsPastSlider = document.getElementById('years-past');
    const yearsFutureSlider = document.getElementById('years-future');

    const rentValDisplay = document.getElementById('rent-value');
    const increaseValDisplay = document.getElementById('increase-value');
    const yearsPastValDisplay = document.getElementById('years-past-value');
    const yearsFutureValDisplay = document.getElementById('years-future-value');

    const rentPaidPastOutput = document.getElementById('rent-paid-past');
    const currentAnnualRentOutput = document.getElementById('current-annual-rent');
    const rentProjectedFutureOutput = document.getElementById('rent-projected-future');
    const totalRentOutflowOutput = document.getElementById('total-rent-outflow');

    if (rentSlider && increaseSlider && yearsPastSlider && yearsFutureSlider) {
        function formatLakhs(amount) {
            if (isNaN(amount) || amount < 0) return '₹0.00 Lakhs';
            if (amount >= 10000000) {
                const crores = amount / 10000000;
                return `₹${crores.toFixed(2)} Cr`;
            }
            const lakhs = amount / 100000;
            return `₹${lakhs.toFixed(2)} Lakhs`;
        }

        function animateValue(element, start, end, duration = 300) {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const currentVal = Math.floor(progress * (end - start) + start);
                element.innerText = formatLakhs(currentVal);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }

        let lastPast = 0;
        let lastAnnual = 0;
        let lastFuture = 0;
        let lastTotal = 0;

        function calculateRentJourney(animate = false) {
            const monthlyRent = parseFloat(rentSlider.value) || 30000;
            const annualIncreasePct = parseFloat(increaseSlider.value) || 0;
            const r = annualIncreasePct / 100;
            const yPast = parseInt(yearsPastSlider.value) || 1;
            const yFuture = parseInt(yearsFutureSlider.value) || 1;

            // Update Input Value Displays
            rentValDisplay.innerText = `₹${monthlyRent.toLocaleString('en-IN')}`;
            increaseValDisplay.innerText = `${annualIncreasePct}%`;
            yearsPastValDisplay.innerText = `${yPast} ${yPast === 1 ? 'Year' : 'Years'}`;
            yearsFutureValDisplay.innerText = `${yFuture} ${yFuture === 1 ? 'Year' : 'Years'}`;

            // 1. Current Annual Rent = Monthly Rent * 12
            const currentAnnualRent = monthlyRent * 12;

            // 2. Rent Paid So Far = sum of annual rent for "Years Already Paying Rent"
            // Annual Rent_k = Current Monthly Rent * 12 * (1 + r)^(k - 1)
            let rentPaidPast = 0;
            for (let k = 1; k <= yPast; k++) {
                rentPaidPast += currentAnnualRent * Math.pow(1 + r, k - 1);
            }

            // 3. Projected Future Rent = sum of annual rent for future years, continuing from current rental year
            // Continuing from year yPast + 1 to yPast + yFuture
            let rentProjectedFuture = 0;
            for (let k = yPast + 1; k <= yPast + yFuture; k++) {
                rentProjectedFuture += currentAnnualRent * Math.pow(1 + r, k - 1);
            }

            // 4. Total Rent Outflow = Rent Paid So Far + Projected Future Rent
            const totalRentOutflow = rentPaidPast + rentProjectedFuture;

            if (animate) {
                animateValue(rentPaidPastOutput, lastPast, rentPaidPast);
                animateValue(currentAnnualRentOutput, lastAnnual, currentAnnualRent);
                animateValue(rentProjectedFutureOutput, lastFuture, rentProjectedFuture);
                animateValue(totalRentOutflowOutput, lastTotal, totalRentOutflow);
            } else {
                rentPaidPastOutput.innerText = formatLakhs(rentPaidPast);
                currentAnnualRentOutput.innerText = formatLakhs(currentAnnualRent);
                rentProjectedFutureOutput.innerText = formatLakhs(rentProjectedFuture);
                totalRentOutflowOutput.innerText = formatLakhs(totalRentOutflow);
            }

            lastPast = rentPaidPast;
            lastAnnual = currentAnnualRent;
            lastFuture = rentProjectedFuture;
            lastTotal = totalRentOutflow;
        }

        // Live input listeners
        [rentSlider, increaseSlider, yearsPastSlider, yearsFutureSlider].forEach(slider => {
            slider.addEventListener('input', () => calculateRentJourney(false));
            slider.addEventListener('change', () => calculateRentJourney(true));
        });

        // Initial setup
        calculateRentJourney(false);
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
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? ''
        : 'https://keyownhabitat-hr-dashboard.onrender.com';

    let conversationHistory = [];

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

        // Track history for AI context
        conversationHistory.push({
            role: isUser ? 'user' : 'model',
            text: text
        });

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

    function renderDynamicOptions(options) {
        clearOptions();
        if (!options || options.length === 0) return;
        options.forEach(optText => {
            const btn = document.createElement('button');
            btn.className = 'chat-opt';
            btn.textContent = optText;
            btn.addEventListener('click', () => {
                handleAiInteraction(optText);
            });
            chatOptions.appendChild(btn);
        });
    }

    function buildWAButton(directOnly) {
        const userData = state.data;
        const text = directOnly
            ? 'Hi! I want to know more about KeyOwn Habitat HOAS.'
            : `Hi! I'm interested in KeyOwn Habitat HOAS. My details: City: ${userData.city || 'Bangalore'}, Rent/Savings: ${userData.rent || 'N/A'}, Phone: ${userData.phone || ''}. Please guide me!`;
        const url = `https://wa.me/919886535949?text=${encodeURIComponent(text)}`;
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
            chatInput.disabled = false;
            chatSend.disabled = false;
            if (step.isEnd) {
                buildWAButton(step.directWA);
                chatInput.placeholder = "Connect on WhatsApp above…";
            } else if (step.opts) {
                renderOptions(step.opts);
                chatInput.placeholder = "Type your reply or select above…";
            } else {
                // Free-text mode
                clearOptions();
                if (step.capture === 'name') {
                    chatInput.placeholder = "Type your full name…";
                } else if (step.capture === 'phone') {
                    chatInput.placeholder = "Type your 10-digit WhatsApp number…";
                } else {
                    chatInput.placeholder = "Type a message…";
                }
                chatInput.focus();
            }
        }, totalDelay);
    }

    // ---- Option click ----
    function handleOptionClick(label, next) {
        const curStep = FLOW[state.step];
        if (state.step === 'rent') state.data.rent = label;
        if (state.step === 'city') state.data.city = label.replace(/🏙 /, '');
        if (state.step === 'timeline') state.data.timeline = label;

        addMessage(label, true);
        clearOptions();
        setTimeout(() => runStep(next), 400);
    }

    // ---- AI Intelligent Response Handler ----
    async function handleAiInteraction(userText) {
        addMessage(userText, true);
        chatInput.value = '';
        clearOptions();
        showTyping(true);

        // Check if user shared a phone number
        const digits = userText.replace(/[\s\-\+]/g, '');
        const isPhone = /^[6-9]\d{9}$/.test(digits);
        if (isPhone) {
            state.data.phone = digits;
        }

        try {
            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    history: conversationHistory.slice(-8)
                })
            });

            const data = await res.json();
            showTyping(false);

            if (data.reply) {
                addMessage(data.reply);
            }

            if (isPhone) {
                buildWAButton(false);
            } else if (data.suggestedOptions && data.suggestedOptions.length > 0) {
                renderDynamicOptions(data.suggestedOptions);
            }
        } catch (e) {
            showTyping(false);
            addMessage("Thanks for sharing! Which city are you planning to buy your home in (e.g. Bangalore, Mysuru)?");
            renderDynamicOptions(['🏙 Bangalore', '🏙 Mysuru', '🏙 Other City']);
        }
    }

    function handleFreeText() {
        const val = chatInput.value.trim();
        if (!val) return;
        handleAiInteraction(val);
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

    // ---- Testimonials Marquee & Dashes ( - - - - - - ) ----
    const wrapper = document.querySelector('.testimonials-marquee-wrapper');
    const dashes = document.querySelectorAll('.slider-dashes .dash, .slider-dots .dot');
    
    if (wrapper && dashes.length > 0) {
        // Pause marquee on touch/press so user can easily read the review
        wrapper.addEventListener('touchstart', () => {
            wrapper.classList.add('is-paused');
        }, { passive: true });

        wrapper.addEventListener('touchend', () => {
            wrapper.classList.remove('is-paused');
        }, { passive: true });

        // Dash click interaction
        dashes.forEach((dash, index) => {
            dash.addEventListener('click', (e) => {
                e.preventDefault();
                dashes.forEach((d, i) => d.classList.toggle('active', i === index));
            });
        });

        // Gently cycle the active dash indicator in sync with the flow
        let dashIndex = 0;
        const intervalTime = window.innerWidth <= 768 ? 6000 : 7500;
        setInterval(() => {
            if (!wrapper.classList.contains('is-paused')) {
                dashIndex = (dashIndex + 1) % dashes.length;
                dashes.forEach((d, i) => d.classList.toggle('active', i === dashIndex));
            }
        }, intervalTime);
    }
});
