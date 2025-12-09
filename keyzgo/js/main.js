// Анимации при скролле
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Наблюдаем за элементами с анимациями
    const animatedElements = document.querySelectorAll('.fade-in, .feature-card, .pricing-card, .step-card, .accordion-item');
    animatedElements.forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    
    // Навигация при скролле
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Табы "Как это работает"
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Убираем активные классы
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Добавляем активные классы
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // FAQ аккордеон
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Закрываем все элементы
            document.querySelectorAll('.accordion-item').forEach(el => {
                el.classList.remove('active');
            });
            
            // Открываем текущий, если он был закрыт
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    initStepsSwiper();

});

// Данные инструкций для каждой платформы
const platformInstructions = {
    windows: {
        name: "Windows",
        steps: [
            {
                number: 1,
                title: "Покупка ключа",
                content: "Выберите подходящий тариф и оплатите его удобным способом",
                instructions: null,
                icon: "💰"
            },
            {
                number: 2,
                title: "Получение ключа",
                content: "Сразу после оплаты вы получите конфигурационный файл (.ovpn)",
                instructions: null,
                icon: "📄"
            },
            {
                number: 3,
                title: "Скачайте OpenVPN",
                content: "Перейдите на официальный сайт OpenVPN",
                instructions: [
                    "Откройте браузер",
                    "Перейдите на https://openvpn.net/client/",
                    "Скачайте клиент для Windows"
                ],
                icon: "⬇️"
            },
            {
                number: 4,
                title: "Установите программу",
                content: "Запустите установщик OpenVPN",
                instructions: [
                    "Найдите скачанный файл",
                    "Запустите установщик",
                    "Следуйте инструкциям мастера"
                ],
                icon: "⚙️"
            },
            {
                number: 5,
                title: "Импортируйте файл",
                content: "Добавьте конфигурацию в OpenVPN",
                instructions: [
                    "Запустите OpenVPN Connect",
                    "Выберите 'Import file'"
                ],
                icon: "📁"
            },
            {
                number: 6,
                title: "Подключитесь",
                content: "Активируйте VPN соединение",
                instructions: [
                    "Выберите ваш профиль",
                    "Нажмите 'Connect'",
                    "Дождитесь подключения"
                ],
                icon: "🔗"
            },
            {
                number: 7,
                title: "Готово!",
                content: "Наслаждайтесь защищенным интернетом",
                icon: "✅"
            }
        ]
    },
    macos: {
        name: "macOS",
        steps: [
            {
                number: 1,
                title: "Покупка ключа",
                content: "Выберите подходящий тариф и оплатите его удобным способом",
                instructions: null,
                icon: "💰"
            },
            {
                number: 2,
                title: "Получение ключа",
                content: "Сразу после оплаты вы получите конфигурационный файл (.ovpn)",
                instructions: null,
                icon: "📄"
            },
            {
                number: 3,
                title: "Скачайте Tunnelblick",
                content: "Установите OpenVPN клиент для Mac",
                instructions: [
                    "Откройте tunnelblick.net",
                    "Скачайте установщик",
                    "Запустите установку"
                ],
                icon: "⬇️"
            },
            {
                number: 4,
                title: "Установите программу",
                content: "Настройте Tunnelblick на Mac",
                instructions: [
                    "Перетащите в Applications",
                    "Запустите Tunnelblick",
                    "Разрешите расширения"
                ],
                icon: "⚙️"
            },
            {
                number: 5,
                title: "Импортируйте файл",
                content: "Добавьте конфигурацию в Tunnelblick",
                instructions: [
                    "Дважды кликните .ovpn файл",
                    "Подтвердите установку",
                    "Введите пароль Mac"
                ],
                icon: "📁"
            },
            {
                number: 6,
                title: "Подключитесь",
                content: "Активируйте VPN соединение",
                instructions: [
                    "Нажмите на иконку Tunnelblick",
                    "Выберите ваш профиль",
                    "Нажмите 'Connect'"
                ],
                icon: "🔗"
            },
            {
                number: 7,
                title: "Готово!",
                content: "Наслаждайтесь защищенным интернетом",
                icon: "✅"
            }
        ]
    },
    android: {
        name: "Android",
        steps: [
            {
                number: 1,
                title: "Покупка ключа",
                content: "Выберите подходящий тариф и оплатите его удобным способом",
                instructions: null,
                icon: "💰"
            },
            {
                number: 2,
                title: "Получение ключа",
                content: "Сразу после оплаты вы получите конфигурационный файл (.ovpn)",
                instructions: null,
                icon: "📄"
            },
            {
                number: 3,
                title: "Установите приложение",
                content: "Скачайте OpenVPN Connect",
                instructions: [
                    "Откройте Google Play",
                    "Найдите OpenVPN Connect",
                    "Нажмите 'Установить'"
                ],
                icon: "📱"
            },
            {
                number: 4,
                title: "Запустите приложение",
                content: "Настройте OpenVPN на Android",
                instructions: [
                    "Откройте приложение",
                    "Примите условия",
                    "Разрешите доступ"
                ],
                icon: "▶️"
            },
            {
                number: 5,
                title: "Импортируйте файл",
                content: "Добавьте конфигурацию",
                instructions: [
                    "Нажмите на значок +",
                    "Выберите 'Import from file'",
                    "Найдите файл .ovpn"
                ],
                icon: "📁"
            },
            {
                number: 6,
                title: "Подключитесь",
                content: "Активируйте VPN соединение",
                instructions: [
                    "Нажмите на профиль",
                    "Разрешите VPN соединение",
                    "Дождитесь подключения"
                ],
                icon: "🔗"
            },
            {
                number: 7,
                title: "Готово!",
                content: "Наслаждайтесь защищенным интернетом",
                icon: "✅"
            }
        ]
    },
    ios: {
        name: "iOS",
        steps: [
            {
                number: 1,
                title: "Покупка ключа",
                content: "Выберите подходящий тариф и оплатите его удобным способом",
                instructions: null,
                icon: "💰"
            },
            {
                number: 2,
                title: "Получение ключа",
                content: "Сразу после оплаты вы получите конфигурационный файл (.ovpn)",
                instructions: null,
                icon: "📄"
            },
            {
                number: 3,
                title: "Установите приложение",
                content: "Скачайте OpenVPN Connect",
                instructions: [
                    "Откройте App Store",
                    "Найдите OpenVPN Connect",
                    "Нажмите 'Получить'"
                ],
                icon: "📱"
            },
            {
                number: 4,
                title: "Подготовьте файл",
                content: "Отправьте конфигурацию на iPhone",
                instructions: [
                    "Отправьте .ovpn файл на email",
                    "Откройте письмо на iPhone",
                    "Скачайте вложение"
                ],
                icon: "✉️"
            },
            {
                number: 5,
                title: "Импортируйте файл",
                content: "Добавьте конфигурацию в OpenVPN",
                instructions: [
                    "Откройте файл .ovpn",
                    "Выберите 'Открыть в OpenVPN'",
                    "Разрешите добавление профиля"
                ],
                icon: "📁"
            },
            {
                number: 6,
                title: "Подключитесь",
                content: "Активируйте VPN соединение",
                instructions: [
                    "Откройте OpenVPN Connect",
                    "Нажмите на переключатель",
                    "Разрешите VPN профиль"
                ],
                icon: "🔗"
            },
            {
                number: 7,
                title: "Готово!",
                content: "Наслаждайтесь защищенным интернетом",
                icon: "✅"
            }
        ]
    }
};

// Инициализация Swiper
function initStepsSwiper() {
    const platformOptions = document.querySelectorAll('.platform-option');
    let currentPlatform = 'windows';
    let swiper = null;
    
    // Функция для создания HTML слайда
    function createSlideHTML(step) {
        let instructionsHTML = '';
        
        if (step.instructions && step.instructions.length > 0) {
            instructionsHTML = `
                <div class="step-instructions">
                    ${step.instructions.map((instruction, index) => `
                        <div class="step-instruction">
                            <div class="instruction-number">${index + 1}</div>
                            <div class="instruction-text">${instruction}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        return `
            <div class="swiper-slide">
                <div class="step-number">${step.number}</div>
                <h3>${step.title}</h3>
                <p class="step-content">${step.content}</p>
                ${instructionsHTML}
            </div>
        `;
    }
    
    // Функция для обновления слайдов
    function updateSlides(platform) {
        currentPlatform = platform;
        const steps = platformInstructions[platform].steps;
        const swiperWrapper = document.querySelector('.swiper-wrapper');
        
        // Очищаем существующие слайды
        swiperWrapper.innerHTML = '';
        
        // Добавляем новые слайды
        steps.forEach(step => {
            swiperWrapper.innerHTML += createSlideHTML(step);
        });
        
        // Если Swiper уже инициализирован, обновляем его
        if (swiper) {
            swiper.update();
            swiper.slideTo(0); // Возвращаем к первому слайду
        }
    }
    
    // Функция для инициализации Swiper
    function initSwiper() {
        swiper = new Swiper('#steps-swiper', {
            slidesPerView: 3,
            spaceBetween: 30,
            
            // Настройки для адаптивности
            breakpoints: {
                // При ширине меньше 480px
                0: {
                    slidesPerView: 1,
                    spaceBetween: 20
                },
                // При ширине меньше 768px
                480: {
                    slidesPerView: 1,
                    spaceBetween: 20
                },
                // При ширине меньше 1024px
                768: {
                    slidesPerView: 2,
                    spaceBetween: 25
                },
                // При ширине больше 1024px
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 30
                }
            },
            
            // Навигация
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            
            // Пагинация (точки)
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true,
            },
            
            // Отключаем автоплей
            autoplay: false,
            
            // Эффекты
            effect: 'slide',
            speed: 600,
            
            // Loop для бесконечной прокрутки (по желанию)
            loop: false,
            
            // Захват курсора для лучшего UX
            grabCursor: true,
        });
    }
    
    // Функция для инициализации событий
    function initEvents() {
        // События для выбора платформы
        platformOptions.forEach(option => {
            option.addEventListener('click', () => {
                const platform = option.getAttribute('data-platform');
                
                // Обновляем активный класс
                platformOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Обновляем слайды
                updateSlides(platform);
            });
        });
    }
    
    // Инициализация
    function init() {
        updateSlides(currentPlatform);
        initSwiper();
        initEvents();
    }
    
    // Запускаем инициализацию
    init();
}

// Инициализируем Swiper при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
});