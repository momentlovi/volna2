document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const body = document.body;
    const loader = document.querySelector('.loader');

    // --- 1. PRELOADER ---
    window.addEventListener('load', () => {
        setTimeout(() => {
            body.classList.remove('loading');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 500);
            }
            initAutoPopup();
        }, 500);
    });

    // --- 2. HEADER SCROLL ---
    const header = document.querySelector('.site-header');
    const syncHeaderHeight = () => {
        if (!header) {
            return;
        }
        const headerHeight = Math.ceil(header.getBoundingClientRect().height);
        root.style.setProperty('--header-height', `${headerHeight}px`);
    };

    syncHeaderHeight();

    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 24);
            syncHeaderHeight();
        });
    }

    window.addEventListener('resize', syncHeaderHeight);
    window.addEventListener('orientationchange', syncHeaderHeight);

    // --- 3. MOBILE MENU ---
    const burger = document.querySelector('.burger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.m-link');

    const setMenuState = (isOpen) => {
        if (!burger || !mobileMenu) {
            return;
        }
        syncHeaderHeight();
        burger.classList.toggle('active', isOpen);
        mobileMenu.classList.toggle('active', isOpen);
        burger.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
        body.classList.toggle('no-scroll', isOpen || document.querySelector('.modal-overlay.active, .lightbox-overlay.active'));
    };

    if (burger) {
        burger.addEventListener('click', () => {
            const shouldOpen = !burger.classList.contains('active');
            setMenuState(shouldOpen);
        });
    }

    mobileLinks.forEach((link) => {
        link.addEventListener('click', () => setMenuState(false));
    });

    // --- 4. MODALS ---
    const callbackModal = document.getElementById('callbackModal');

    const openModal = (modal) => {
        if (!modal) {
            return;
        }
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        body.classList.add('no-scroll');
    };

    const closeLightbox = () => {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox) {
            return;
        }
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.modal-overlay.active') && !(burger && burger.classList.contains('active'))) {
            body.classList.remove('no-scroll');
        }
    };

    const closeModals = () => {
        document.querySelectorAll('.modal-overlay.active').forEach((modal) => {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        });

        if (!(burger && burger.classList.contains('active')) && !document.querySelector('.lightbox-overlay.active')) {
            body.classList.remove('no-scroll');
        }
    };

    const closeAllOverlays = () => {
        closeModals();
        closeLightbox();
        setMenuState(false);
    };

    const initAutoPopup = () => {
        if (sessionStorage.getItem('popupShown')) {
            return;
        }

        setTimeout(() => {
            if (!document.querySelector('.modal-overlay.active, .lightbox-overlay.active') && !(burger && burger.classList.contains('active'))) {
                openModal(callbackModal);
                sessionStorage.setItem('popupShown', 'true');
            }
        }, 18000);
    };

    document.querySelectorAll('.open-modal').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            setMenuState(false);
            openModal(callbackModal);
        });
    });

    document.querySelectorAll('.close-modal').forEach((btn) => {
        btn.addEventListener('click', closeModals);
    });

    document.querySelectorAll('.modal-overlay').forEach((modal) => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModals();
            }
        });
    });

    // --- 5. LIGHTBOX ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (lightbox && lightboxImg) {
        document.querySelectorAll('.lightbox-trigger').forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const img = item.querySelector('img');
                if (!img) {
                    return;
                }
                lightboxImg.src = img.src;
                lightbox.classList.add('active');
                lightbox.setAttribute('aria-hidden', 'false');
                body.classList.add('no-scroll');
            });
        });

        if (lightboxClose) {
            lightboxClose.addEventListener('click', closeLightbox);
        }

        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });
    }

    // --- 6. ESC KEY ---
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllOverlays();
        }
    });

    // --- 7. REVEAL ANIMATIONS ---
    const revealItems = document.querySelectorAll('.reveal-up, .reveal-img');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealItems.forEach((el) => observer.observe(el));

    // --- 8. FORMS ---
    const showFormError = (form, message) => {
        const errorNode = form.querySelector('.form-error');
        if (errorNode) {
            errorNode.textContent = message || '';
        }
    };

    document.querySelectorAll('form.lead-form').forEach((form) => {
        if (!form.querySelector('input[name="hp"], input[name="website"], input[name="company"], input[name="hidden"]')) {
            const hpInput = document.createElement('input');
            hpInput.type = 'text';
            hpInput.name = 'hp';
            hpInput.tabIndex = -1;
            hpInput.autocomplete = 'off';
            hpInput.setAttribute('aria-hidden', 'true');
            hpInput.style.display = 'none';
            form.appendChild(hpInput);
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            showFormError(form, '');

            const submitBtn = form.querySelector('button[type="submit"]');
            if (!submitBtn) {
                return;
            }

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const source = form.dataset.source || 'lead';
            const name = (form.querySelector('input[name="name"]')?.value || '').trim();
            const phone = (form.querySelector('input[name="phone"]')?.value || '').trim();
            const hp = (form.querySelector('input[name="hp"], input[name="website"], input[name="company"], input[name="hidden"]')?.value || '').trim();
            const consentPd = form.querySelector('input[name="consent_pd"]')?.checked;
            const consentAds = form.querySelector('input[name="consent_ads"]')?.checked || false;

            if (!phone) {
                showFormError(form, 'Укажите номер телефона.');
                return;
            }

            if (!consentPd) {
                showFormError(form, 'Для отправки необходимо согласие на обработку персональных данных.');
                return;
            }

            const originalText = submitBtn.textContent || '';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';

            try {
                if (typeof window.sendLead !== 'function') {
                    throw new Error('sendLead is not available');
                }

                const message = [
                    `Форма: ${source}`,
                    `Согласие ПД: ${consentPd ? 'да' : 'нет'}`,
                    `Согласие реклама: ${consentAds ? 'да' : 'нет'}`
                ].join(' | ');

                await window.sendLead({
                    name,
                    phone,
                    source,
                    message,
                    hp,
                });

                submitBtn.textContent = 'Отправлено';
                submitBtn.style.backgroundColor = '#16a34a';
                submitBtn.style.borderColor = '#16a34a';
                submitBtn.style.color = '#fff';

                sessionStorage.setItem('popupShown', 'true');

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.style.borderColor = '';
                    submitBtn.style.color = '';
                    form.reset();
                    closeModals();
                }, 1800);
            } catch (error) {
                console.error('Lead submit failed:', error);
                showFormError(form, 'Ошибка отправки. Попробуйте еще раз или позвоните 8 (800) 550-51-20.');

                submitBtn.textContent = 'Ошибка';
                submitBtn.style.backgroundColor = '#dc2626';
                submitBtn.style.borderColor = '#dc2626';
                submitBtn.style.color = '#fff';

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.style.borderColor = '';
                    submitBtn.style.color = '';
                }, 1800);
            }
        });
    });
});
