class CalendarPublic {
    constructor() {
        this.calendar = null;
        this.activeFilters = {
            responsible: [],
            location: []
        };
        this.allEvents = [];
        
        this.init();
    }

    init() {
        this.initCalendar();
        this.setupEventListeners();
        this.setupFilterListeners();
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
            height: '100%',
            editable: false,
            selectable: false,
            droppable: false,
            eventResizableFromStart: false,
            fixedWeekCount: false,

            slotMinTime: '08:00:00',
            slotMaxTime: '22:00:00',
            
            dayMaxEvents: 4,
            dayMaxEventRows: true,
            moreLinkClick: 'popover',
            
            events: (info, successCallback, failureCallback) => {
                const filteredEvents = this.getFilteredEvents();
                successCallback(filteredEvents);
            },
                
            eventClick: (info) => this.showEventDetails(info),
            
            eventDidMount: (info) => {
                const eventType = info.event.extendedProps.eventType || 'allDay';
                const isFiltered = info.event.extendedProps._filtered || false;
                
                info.el.classList.add(`fc-event-type-${eventType}`);
                
                if (isFiltered) {
                    info.el.style.opacity = '0.3';
                    info.el.style.pointerEvents = 'none';
                } else {
                    info.el.style.opacity = '1';
                    info.el.style.pointerEvents = 'auto';
                }

                // Добавляем всплывающую подсказку
                info.el.title = this.getEventTooltip(info.event);
            },

            eventContent: (info) => {
                const event = info.event;
                const eventType = event.extendedProps.eventType || 'allDay';
                const viewType = info.view.type;
                
                if (viewType === 'listMonth') {
                    const location = this.formatEventProperty(event.extendedProps.location);
                    const responsible = this.formatEventProperty(event.extendedProps.responsible);
                    let timeDisplay = '';
                    
                    if (eventType === 'singleTime' && info.timeText) {
                        timeDisplay = info.timeText;
                    } else if (eventType === 'timeRange' && event.extendedProps.startTime && event.extendedProps.endTime) {
                        timeDisplay = `${event.extendedProps.startTime}-${event.extendedProps.endTime}`;
                    } else if (eventType === 'multiDay') {
                        const startStr = event.start ? event.start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '';
                        let endStr = '';

                        if (event.end) {
                            const endDate = new Date(event.end);
                            endDate.setDate(endDate.getDate() - 1);
                            endStr = endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                        }
                        timeDisplay = startStr && endStr ? `${startStr}-${endStr}` : '';
                    }
                    
                    return {
                        html: `
                            <div class="fc-list-event-content">
                                <div class="fc-list-event-main">
                                    <div class="fc-list-event-title">${timeDisplay ? `[${timeDisplay}]` : ''} ${event.title}</div>
                                </div>
                                <div class="fc-list-event-details">
                                    ${location ? `<div class="fc-list-event-location">${location}</div>` : ''}
                                    ${responsible ? `<div class="fc-list-event-responsible">${responsible}</div>` : ''}
                                </div>
                            </div>
                        `
                    };
                } else {
                    let displayText = event.title;
                    let timeDisplay = '';
                    
                    if (eventType === 'singleTime' && info.timeText) {
                        timeDisplay = info.timeText;
                    } else if (eventType === 'timeRange' && event.extendedProps.startTime && event.extendedProps.endTime) {
                        timeDisplay = `${event.extendedProps.startTime}-${event.extendedProps.endTime}`;
                    } else if (eventType === 'multiDay') {
                        const startStr = event.start ? event.start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '';
                        let endStr = '';

                        if (event.end) {
                            const endDate = new Date(event.end);
                            endDate.setDate(endDate.getDate() - 1);
                            endStr = endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                        }
                        timeDisplay = startStr && endStr ? `${startStr}-${endStr}` : '';
                    }
                    
                    return {
                        html: `
                            <div class="fc-event-main-frame">
                                ${timeDisplay ? `<div class="fc-event-time">${timeDisplay}</div>` : ''}
                                <div class="fc-event-title">${displayText}</div>
                            </div>
                        `
                    };
                }
            },
            
            eventDisplay: 'block',
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            
            views: {
                dayGridMonth: {
                    titleFormat: { year: 'numeric', month: 'long' },
                    dayMaxEventRows: 6
                },
                timeGridWeek: {
                    titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
                    dayMaxEvents: true,
                    slotMinTime: '08:00:00',
                    slotMaxTime: '22:00:00'
                },
                timeGridDay: {
                    titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                    dayMaxEvents: false,
                    slotMinTime: '08:00:00',
                    slotMaxTime: '22:00:00'
                },
                listMonth: {
                    titleFormat: { year: 'numeric', month: 'long' },
                    listDayFormat: { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
                    listDaySideFormat: false,
                    noEventsContent: 'Нет мероприятий на этот период'
                }
            }
        });

        this.calendar.render();
        this.updateCalendarTitle();
    }

    getEventTooltip(event) {
        const props = event.extendedProps;
        const location = this.formatEventProperty(props.location);
        const responsible = this.formatEventProperty(props.responsible);
        let timeInfo = '';

        if (props.eventType === 'timeRange' && props.startTime && props.endTime) {
            timeInfo = `Время: ${props.startTime}-${props.endTime}`;
        } else if (props.eventType === 'singleTime' && props.startTime) {
            timeInfo = `Время: ${props.startTime}`;
        } else if (props.eventType === 'multiDay') {
            const startStr = event.start ? event.start.toLocaleDateString('ru-RU') : '';
            let endStr = '';
            if (event.end) {
                const endDate = new Date(event.end);
                endDate.setDate(endDate.getDate() - 1);
                endStr = endDate.toLocaleDateString('ru-RU');
            }
            timeInfo = `Период: ${startStr} - ${endStr}`;
        }

        return [
            event.title,
            timeInfo,
            location ? `Место: ${location}` : '',
            responsible ? `Ответственный: ${responsible}` : ''
        ].filter(item => item !== '').join('\n');
    }

    showEventDetails(info) {
        const event = info.event;
        const props = event.extendedProps;
        
        // Заполняем модальное окно данными
        document.getElementById('detailsEventTitle').textContent = event.title;
        
        // Дата
        const dateStr = event.start ? event.start.toLocaleDateString('ru-RU', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }) : '';
        document.getElementById('detailsEventDate').textContent = dateStr;
        
        // Время
        let timeStr = '';
        if (props.eventType === 'timeRange' && props.startTime && props.endTime) {
            timeStr = `${props.startTime} - ${props.endTime}`;
        } else if (props.eventType === 'singleTime' && props.startTime) {
            timeStr = props.startTime;
        } else if (props.eventType === 'multiDay') {
            const startStr = event.start ? event.start.toLocaleDateString('ru-RU') : '';
            let endStr = '';
            if (event.end) {
                const endDate = new Date(event.end);
                endDate.setDate(endDate.getDate() - 1);
                endStr = endDate.toLocaleDateString('ru-RU');
            }
            timeStr = `${startStr} - ${endStr}`;
        } else {
            timeStr = 'Весь день';
        }
        document.getElementById('detailsEventTime').textContent = timeStr;
        
        // Место
        const location = this.formatEventProperty(props.location);
        document.getElementById('detailsEventLocation').textContent = location || 'Не указано';
        
        // Ответственный
        const responsible = this.formatEventProperty(props.responsible);
        document.getElementById('detailsEventResponsible').textContent = responsible || 'Не указан';
        
        // Показываем модальное окно
        document.getElementById('eventDetailsModal').style.display = 'block';
    }

    getFilteredEvents() {
        return this.allEvents.map(event => {
            const eventData = event.extendedProps;
            let shouldShow = true;

            if (this.activeFilters.responsible && this.activeFilters.responsible.length > 0) {
                const eventResponsibles = this.normalizeEventData(eventData.responsible);
                const hasMatchingResponsible = eventResponsibles.some(resp => 
                    this.activeFilters.responsible.includes(resp)
                );
                
                if (!hasMatchingResponsible) {
                    shouldShow = false;
                }
            }

            if (shouldShow && this.activeFilters.location && this.activeFilters.location.length > 0) {
                const eventLocations = this.normalizeEventData(eventData.location);
                const hasMatchingLocation = eventLocations.some(loc => 
                    this.activeFilters.location.includes(loc)
                );
                
                if (!hasMatchingLocation) {
                    shouldShow = false;
                }
            }

            return {
                ...event,
                extendedProps: {
                    ...event.extendedProps,
                    _filtered: !shouldShow
                }
            };
        });
    }

    setupEventListeners() {
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.calendar.prev();
            this.updateCalendarTitle();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.calendar.next();
            this.updateCalendarTitle();
        });

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.calendar.changeView(view);
                this.updateCalendarTitle();
            });
        });

        document.getElementById('exportBtnPublic').addEventListener('click', () => {
            if (typeof exportToDoc === 'function') {
                exportToDoc();
            }
        });

        // Закрытие модального окна деталей
        document.getElementById('closeDetails').addEventListener('click', () => {
            document.getElementById('eventDetailsModal').style.display = 'none';
        });

        document.getElementById('closeDetailsBtn').addEventListener('click', () => {
            document.getElementById('eventDetailsModal').style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('eventDetailsModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    setupFilterListeners() {
        document.querySelectorAll('input[name="filterResponsible"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        document.querySelectorAll('input[name="filterLocation"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // document.getElementById('resetFilters').addEventListener('click', () => {
        //     this.resetFilters();
        // });
    }

    getCurrentFilterValues() {
        const responsibleValues = this.getCheckboxValues('filterResponsible');
        const locationValues = this.getCheckboxValues('filterLocation');
        
        return {
            responsible: responsibleValues,
            location: locationValues
        };
    }

    applyFilters() {
        const filterValues = this.getCurrentFilterValues();
        this.activeFilters = filterValues;
        
        this.calendar.refetchEvents();
        
        setTimeout(() => {
            this.updateEventsOpacity();
        }, 100);
    }

    updateEventsOpacity() {
        const events = this.calendar.getEvents();
        events.forEach(event => {
            const isFiltered = event.extendedProps._filtered || false;
            if (event.el) {
                if (isFiltered) {
                    event.el.style.opacity = '0.3';
                    event.el.style.pointerEvents = 'none';
                } else {
                    event.el.style.opacity = '1';
                    event.el.style.pointerEvents = 'auto';
                }
            }
        });
    }

    resetFilters() {
        document.querySelectorAll('input[name="filterResponsible"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        document.querySelectorAll('input[name="filterLocation"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        this.activeFilters = {
            responsible: [],
            location: []
        };

        this.calendar.refetchEvents();
        
        setTimeout(() => {
            this.updateEventsOpacity();
        }, 100);
    }

    normalizeEventData(data) {
        if (!data || data === '') return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
            if (data.includes(',')) {
                return data.split(',').map(item => item.trim());
            }
            return [data.trim()];
        }
        return [String(data)];
    }

    async loadEvents() {
        try {
            const snapshot = await db.collection('events').get();
            this.allEvents = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                let eventColor;
                const eventType = data.eventType || 'allDay';
                
                if (eventType === 'singleTime' || eventType === 'timeRange') {
                    eventColor = '#64befd';
                } else {
                    eventColor = '#0086f9';
                }
                
                this.allEvents.push({
                    id: doc.id,
                    title: data.title,
                    start: data.start?.toDate() || new Date(),
                    end: data.end?.toDate() || data.start?.toDate() || new Date(),
                    allDay: data.allDay || false,
                    color: eventColor,
                    textColor: '#ffffff',
                    extendedProps: {
                        location: data.location || '',
                        responsible: data.responsible || '',
                        notes: data.notes || '',
                        startTime: data.startTime || '',
                        endTime: data.endTime || '',
                        eventType: data.eventType || 'allDay'
                    }
                });
            });
            
            this.calendar.refetchEvents();
            
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    updateCalendarTitle() {
        const titleElement = document.getElementById('calendarTitle');
        if (!titleElement) return;
        
        const view = this.calendar.view;
        titleElement.textContent = view.title;
    }

    formatEventProperty(property) {
        if (!property) return '';
        
        if (Array.isArray(property)) {
            return property.filter(item => item && item.trim() !== '').join(', ');
        } else if (typeof property === 'string') {
            return property;
        }
        
        return String(property);
    }

    getCheckboxValues(groupName) {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]:checked`);
        const values = Array.from(checkboxes).map(checkbox => checkbox.value);
        return values;
    }
}

let calendarPublic;

document.addEventListener('DOMContentLoaded', () => {
    calendarPublic = new CalendarPublic();
});