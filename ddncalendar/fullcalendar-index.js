class CalendarViewer {
    constructor() {
        this.calendar = null;
        this.init();
    }

    init() {
        this.initCalendar();
        this.setupEventListeners();
        this.loadEvents();
    }

    initCalendar() {
        const calendarEl = document.getElementById('calendar');
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'ru',
            timeZone: 'local',
            firstDay: 1,
            initialView: 'dayGridMonth',
            headerToolbar: false,
            height: 'auto',
            editable: false,
            selectable: false,
            droppable: false,
            eventResizableFromStart: false,
            
            // Обработчики событий
            eventClick: (info) => this.handleEventClick(info),
            
            // Кастомизация внешнего вида
            eventDisplay: 'block',
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            
            views: {
                dayGridMonth: {
                    titleFormat: { year: 'numeric', month: 'long' }
                },
                timeGridWeek: {
                    titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
                },
                timeGridDay: {
                    titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
                }
            },
            
            eventDidMount: (info) => {
                this.customizeEvent(info);
            }
        });

        this.calendar.render();
        this.updateCalendarTitle();
    }

    setupEventListeners() {
        // Навигация
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.calendar.prev();
            this.updateCalendarTitle();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.calendar.next();
            this.updateCalendarTitle();
        });

        // Переключение видов
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.calendar.changeView(view);
                this.updateCalendarTitle();
            });
        });

        // Модальное окно
        document.querySelector('.close').addEventListener('click', () => {
            this.closeEventModal();
        });

        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('eventModal');
            if (e.target === modal) {
                this.closeEventModal();
            }
        });
    }

    handleEventClick(info) {
        this.showEventDetails(info.event);
    }

    showEventDetails(event) {
        const extendedProps = event.extendedProps;
        
        document.getElementById('modalTitle').textContent = event.title;
        document.getElementById('detailTime').textContent = this.formatEventTime(event);
        document.getElementById('detailDate').textContent = this.formatDate(event.start);
        document.getElementById('detailLocation').textContent = extendedProps.location || 'Не указано';
        document.getElementById('detailResponsible').textContent = extendedProps.responsible || 'Не указано';
        document.getElementById('detailCategory').textContent = extendedProps.category || 'Не указано';
        document.getElementById('detailDescription').textContent = extendedProps.description || 'Нет описания';
        document.getElementById('detailNotes').textContent = extendedProps.notes || 'Нет примечаний';

        document.getElementById('eventModal').style.display = 'block';
    }

    closeEventModal() {
        document.getElementById('eventModal').style.display = 'none';
    }

    async loadEvents() {
        try {
            const snapshot = await db.collection('events').get();
            const events = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                events.push({
                    id: doc.id,
                    title: data.title,
                    start: data.start?.toDate() || new Date(data.date + 'T00:00'),
                    end: data.end?.toDate() || data.start?.toDate() || new Date(data.date + 'T23:59'),
                    allDay: data.allDay || false,
                    color: data.color || '#3498db',
                    textColor: '#ffffff',
                    extendedProps: {
                        location: data.location,
                        responsible: data.responsible,
                        category: data.category,
                        description: data.description,
                        notes: data.notes,
                        time: data.time
                    }
                });
            });
            
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(events);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    customizeEvent(info) {
        const event = info.event;
        const element = info.el;
        
        // Добавляем кастомный контент
        const content = `
            <div class="fc-event-main-frame">
                <div class="fc-event-time">${info.timeText}</div>
                <div class="fc-event-title">${event.title}</div>
                ${event.extendedProps.responsible ? 
                    `<div class="fc-event-responsible">${event.extendedProps.responsible}</div>` : ''}
            </div>
        `;
        
        element.querySelector('.fc-event-main').innerHTML = content;
        
        // Добавляем иконку категории
        if (event.extendedProps.category) {
            const categoryBadge = document.createElement('div');
            categoryBadge.className = 'fc-event-category';
            categoryBadge.textContent = event.extendedProps.category;
            categoryBadge.style.background = event.backgroundColor;
            element.appendChild(categoryBadge);
        }
    }

    updateCalendarTitle() {
        const titleElement = document.getElementById('calendarTitle');
        const view = this.calendar.view;
        titleElement.textContent = view.title;
    }

    formatEventTime(event) {
        if (event.allDay) {
            return 'Весь день';
        }
        
        const start = event.start;
        const end = event.end;
        
        if (end && start.toDateString() !== end.toDateString()) {
            return `${this.formatTime(start)} - ${this.formatDate(end)} ${this.formatTime(end)}`;
        } else if (end) {
            return `${this.formatTime(start)} - ${this.formatTime(end)}`;
        } else {
            return this.formatTime(start);
        }
    }

    formatDate(date) {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new CalendarViewer();
});