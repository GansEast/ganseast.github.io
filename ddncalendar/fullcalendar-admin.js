class CalendarAdmin {
    constructor() {
        this.calendar = null;
        this.currentEvent = null;
        this.isUpdating = false;
        this.activeFilters = {
            responsible: '',
            location: ''
        };
        this.allEvents = []; // Храним все события
        
        // НАСТРОЙКИ ПО УМОЛЧАНИЮ ДЛЯ НОВЫХ СОБЫТИЙ
        this.defaultValues = {
            title: 'Сценическая репетиция + монтаж',
            location: ['Большой зал'],
            responsible: ['Романов О.П.', 'Тойтонов Э.А.']
        };
        
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
            editable: true,
            selectable: true,
            droppable: true,
            eventResizableFromStart: true,
            fixedWeekCount: false,

            
            // Настройки временного диапазона
            slotMinTime: '08:00:00',
            slotMaxTime: '22:00:00',
            
            // Настройки отображения событий
            dayMaxEvents: 4,
            dayMaxEventRows: true,
            moreLinkClick: 'popover',
            
            // Используем функцию для фильтрации событий
            events: (info, successCallback, failureCallback) => {
                const filteredEvents = this.getFilteredEvents();
                successCallback(filteredEvents);
            },
                
            // Обработчики событий
            dateClick: (info) => this.handleDateClick(info),
            eventClick: (info) => this.handleEventClick(info),
            eventDrop: (info) => this.handleEventDrop(info),
            eventResize: (info) => this.handleEventResize(info),
            select: (info) => this.handleSelect(info),
            
            eventDidMount: (info) => {
                const eventType = info.event.extendedProps.eventType || 'allDay';
                const isFiltered = info.event.extendedProps._filtered || false;
                
                // Добавляем класс типа события
                info.el.classList.add(`fc-event-type-${eventType}`);
                
                // Применяем opacity напрямую
                if (isFiltered) {
                    info.el.style.opacity = '0.3';
                    info.el.style.pointerEvents = 'none';
                } else {
                    info.el.style.opacity = '1';
                    info.el.style.pointerEvents = 'auto';
                }
            },

            // Кастомизация контента
            eventContent: (info) => {
                const event = info.event;
                const eventType = event.extendedProps.eventType || 'allDay';
                const viewType = info.view.type;
                
                // Для списочного вида добавляем дополнительную информацию
                if (viewType === 'listMonth') {
                    const location = this.formatEventProperty(event.extendedProps.location);
                    const responsible = this.formatEventProperty(event.extendedProps.responsible);
                    let timeDisplay = '';
                    
                    if (eventType === 'singleTime' && info.timeText) {
                        timeDisplay = info.timeText;
                    } else if (eventType === 'timeRange' && event.extendedProps.startTime && event.extendedProps.endTime) {
                        // timeDisplay = `${event.extendedProps.startTime}-${event.extendedProps.endTime}`;
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
                    // Обычное отображение для других видов
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
                    // Добавляем кастомные колонки
                    listDayFormat: { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' },
                    listDaySideFormat: false,
                    noEventsContent: 'Нет мероприятий на этот период'
                }
            }
        });

        this.calendar.render();
        this.updateCalendarTitle();
    }

    getFilteredEvents() {
        return this.allEvents.map(event => {
            const eventData = event.extendedProps;
            let shouldShow = true;

            // Проверяем фильтр по ответственным
            if (this.activeFilters.responsible && this.activeFilters.responsible.length > 0) {
                const eventResponsibles = this.normalizeEventData(eventData.responsible);
                const hasMatchingResponsible = eventResponsibles.some(resp => 
                    this.activeFilters.responsible.includes(resp)
                );
                
                if (!hasMatchingResponsible) {
                    shouldShow = false;
                }
            }

            // Проверяем фильтр по залам
            if (shouldShow && this.activeFilters.location && this.activeFilters.location.length > 0) {
                const eventLocations = this.normalizeEventData(eventData.location);
                const hasMatchingLocation = eventLocations.some(loc => 
                    this.activeFilters.location.includes(loc)
                );
                
                if (!hasMatchingLocation) {
                    shouldShow = false;
                }
            }

            // Возвращаем событие с дополнительным свойством для opacity
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

        // Создание события
        // document.getElementById('createEvent').addEventListener('click', () => {
        //     this.openEventModal();
        // });

        // Модальное окно
        document.querySelector('.close').addEventListener('click', () => {
            this.closeEventModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeEventModal();
        });

        // Форма
        document.getElementById('eventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // Удаление
        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.deleteEvent();
        });

        // Экспорт
        document.getElementById('exportBtn').addEventListener('click', () => {
            if (typeof exportToDoc === 'function') {
                exportToDoc();
            }
        });

        // Закрытие модального окна
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('eventModal');
            if (e.target === modal) {
                this.closeEventModal();
            }
        });

        document.getElementById('startTime').addEventListener('change', () => {
            this.handleTimeChange();
        });

        document.getElementById('endDate').addEventListener('change', () => {
            this.handleEndDateChange();
        });

        document.getElementById('eventDate').addEventListener('change', (e) => {
            if (e.target.value) {
                document.getElementById('endDate').focus();
            }
        });

        document.getElementById('startTime').addEventListener('change', (e) => {
            if (e.target.value) {
                document.getElementById('endTime').focus();
            }
        });
    }

    setupFilterListeners() {
        // Слушатели изменений чекбоксов фильтров
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

        const resetFilters = document.getElementById('resetFilters');
        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    // Получение текущих значений фильтров
    getCurrentFilterValues() {
        const responsibleValues = this.getCheckboxValues('filterResponsible');
        const locationValues = this.getCheckboxValues('filterLocation');
        
        console.log('Filter values - responsible:', responsibleValues, 'location:', locationValues); // Для отладки
        
        return {
            responsible: responsibleValues,
            location: locationValues
        };
    }

    // Применение фильтров
    applyFilters() {
        const filterValues = this.getCurrentFilterValues();
        this.activeFilters = filterValues;
        
        console.log('Applied filters:', this.activeFilters); // Для отладки
        
        // Принудительно обновляем события в календаре
        this.calendar.refetchEvents();
        
        // Также принудительно обновляем opacity для всех событий
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

    // Сброс фильтров
    resetFilters() {
        // Сбрасываем все чекбоксы фильтров
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

        console.log('Filters reset'); // Для отладки
        
        this.calendar.refetchEvents();
        
        setTimeout(() => {
            this.updateEventsOpacity();
        }, 100);
    }


    // Применение фильтров к событиям
    applyFiltersToEvents() {
        const events = this.calendar.getEvents();
        let visibleCount = 0;
        
        // Сначала сбросим все фильтры
        events.forEach(event => {
            if (event.el) {
                event.el.classList.remove('fc-event-filtered');
            }
        });
        
        // Если нет активных фильтров - показываем все
        if (!this.activeFilters.responsible && !this.activeFilters.location) {
            visibleCount = events.length;
            return;
        }
        
        // Применяем фильтры
        events.forEach(event => {
            const eventData = event.extendedProps;
            let shouldShow = true;

            // Фильтр по ответственным
            if (this.activeFilters.responsible) {
                const eventResponsibles = this.normalizeEventData(eventData.responsible);
                
                const hasMatchingResponsible = eventResponsibles.some(resp => 
                    resp === this.activeFilters.responsible
                );
                
                if (!hasMatchingResponsible) {
                    shouldShow = false;
                } else {
                }
            }

            // Фильтр по залам
            if (shouldShow && this.activeFilters.location) {
                const eventLocations = this.normalizeEventData(eventData.location);
                
                const hasMatchingLocation = eventLocations.some(loc => 
                    loc === this.activeFilters.location
                );
                
                if (!hasMatchingLocation) {
                    shouldShow = false;
                } else {
                }
            }

            // Применяем видимость
            if (event.el) {
                if (shouldShow) {
                    event.el.classList.remove('fc-event-filtered');
                    visibleCount++;
                } else {
                    event.el.classList.add('fc-event-filtered');
                }
            }
        });

        
        // Принудительная перерисовка
        setTimeout(() => {
            this.calendar.render();
        }, 100);
    }

    // Нормализация данных события
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

    // Применение фильтра к одному событию
    applyFilterToSingleEvent(event) {
        const eventData = event.extendedProps;
        let shouldShow = true;

        // Проверяем фильтр по ответственным
        if (this.activeFilters.responsible) {
            const eventResponsibles = this.normalizeEventData(eventData.responsible);
            const hasMatchingResponsible = eventResponsibles.some(resp => 
                resp === this.activeFilters.responsible
            );
            
            if (!hasMatchingResponsible) {
                shouldShow = false;
            }
        }

        // Проверяем фильтр по залам
        if (shouldShow && this.activeFilters.location) {
            const eventLocations = this.normalizeEventData(eventData.location);
            const hasMatchingLocation = eventLocations.some(loc => 
                loc === this.activeFilters.location
            );
            
            if (!hasMatchingLocation) {
                shouldShow = false;
            }
        }

        // Применяем видимость
        if (event.el && !shouldShow) {
            event.el.classList.add('fc-event-filtered');
        }
    }

    handleTimeChange() {
        const startTime = this.getFieldValue('startTime');
        const endTimeField = document.getElementById('endTime');
        
        if (startTime) {
            endTimeField.disabled = false;
        } else {
            endTimeField.disabled = true;
            this.setFieldValue('endTime', '');
        }
    }

    handleEndDateChange() {
        const endDate = this.getFieldValue('endDate');
        const eventDate = this.getFieldValue('eventDate');
        
        if (endDate && endDate !== eventDate) {
            document.getElementById('startTime').disabled = true;
            document.getElementById('endTime').disabled = true;
            this.setFieldValue('startTime', '');
            this.setFieldValue('endTime', '');
        } else {
            document.getElementById('startTime').disabled = false;
            this.handleTimeChange();
        }
    }

    determineEventType() {
        const eventDate = this.getFieldValue('eventDate');
        const endDate = this.getFieldValue('endDate');
        const startTime = this.getFieldValue('startTime');
        const endTime = this.getFieldValue('endTime');
        
        if (endDate && endDate !== eventDate) {
            return 'multiDay';
        } else if (startTime && endTime) {
            return 'timeRange';
        } else if (startTime) {
            return 'singleTime';
        } else {
            return 'allDay';
        }
    }

    handleDateClick(info) {
        const viewType = this.calendar.view.type;
        const isTimeView = viewType === 'timeGridWeek' || viewType === 'timeGridDay';
        
        let eventData = {
            start: info.date,
            allDay: !info.dateStr.includes('T')
        };

        if (isTimeView && info.dateStr.includes('T')) {
            // Временной вид - используем время из клика
            const clickedTime = new Date(info.date);
            const endTime = new Date(clickedTime.getTime() + 60 * 60 * 1000); // +1 час
            
            eventData.extendedProps = {
                startTime: this.formatTimeInput(clickedTime),
                endTime: this.formatTimeInput(endTime),
                eventType: 'timeRange'
            };
            
            eventData.allDay = false;
            eventData.end = endTime; // Устанавливаем end для корректного отображения
        } else {
            // Месячный вид или клик по всему дню
            eventData.extendedProps = {
                eventType: 'allDay'
            };
        }

        this.openEventModal(eventData);
    }

    handleEventClick(info) {
        this.openEventModal(info.event);
    }

    handleEventDrop(info) {
        this.updateEventInFirebase(info);
    }

    handleEventResize(info) {
        this.updateEventInFirebase(info);
    }

    handleSelect(selectionInfo) {
        const start = selectionInfo.start;
        const end = selectionInfo.end;
        const allDay = selectionInfo.allDay;
        
        let eventData = {
            start: start,
            end: end,
            allDay: allDay
        };

        // Определяем тип события на основе выделения
        const startDay = new Date(start);
        startDay.setHours(0, 0, 0, 0);
        
        const endDay = new Date(end);
        endDay.setHours(0, 0, 0, 0);
        
        const isMultiDay = startDay.getTime() !== endDay.getTime();
        const isTimeRange = !allDay && start.getTime() !== end.getTime();

        if (isMultiDay && allDay) {
            // Многодневное выделение
            const displayEnd = new Date(end);
            displayEnd.setDate(displayEnd.getDate() - 1); // Корректируем для отображения в форме
            eventData.extendedProps = {
                endDate: this.formatDateInput(displayEnd),
                eventType: 'multiDay'
            };
        } else if (isTimeRange) {
            // Временной диапазон
            eventData.extendedProps = {
                startTime: this.formatTimeInput(start),
                endTime: this.formatTimeInput(end),
                eventType: 'timeRange'
            };
        } else if (!allDay && start.getTime() === end.getTime()) {
            // Одиночный клик во временном виде - используем выделенное время
            eventData.extendedProps = {
                startTime: this.formatTimeInput(start),
                endTime: this.formatTimeInput(new Date(start.getTime() + 60 * 60 * 1000)), // +1 час
                eventType: 'timeRange'
            };
        } else {
            // Однодневное событие на весь день
            eventData.extendedProps = {
                eventType: 'allDay'
            };
        }

        this.openEventModal(eventData);
    }

    openEventModal(eventData = null) {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const deleteBtn = document.getElementById('deleteBtn');
        
        if (!modal || !form) {
            console.error('Модальное окно или форма не найдены');
            return;
        }
        
        form.reset();
        
        // Сбрасываем состояния полей
        const startTimeField = document.getElementById('startTime');
        const endTimeField = document.getElementById('endTime');
        if (startTimeField) startTimeField.disabled = false;
        if (endTimeField) endTimeField.disabled = true;
        
        if (eventData && eventData.id) {
            // Редактирование существующего события
            this.currentEvent = eventData;
            const modalTitle = document.getElementById('modalTitle');
            if (modalTitle) {
                modalTitle.textContent = 'Редактировать мероприятие';
            }
            if (deleteBtn) {
                deleteBtn.style.display = 'block';
            }
            
            this.fillFormWithEventData(eventData);
        } else {
            // Создание нового события
            this.currentEvent = null;
            const modalTitle = document.getElementById('modalTitle');
            if (modalTitle) {
                modalTitle.textContent = 'Новое мероприятие';
            }
            if (deleteBtn) {
                deleteBtn.style.display = 'none';
            }
            
            this.fillFormWithEventData({});

            // Устанавливаем текущую дату напрямую
            const now = new Date();
            const eventDateField = document.getElementById('eventDate');
            const endDateField = document.getElementById('endDate');
            const startTimeField = document.getElementById('startTime');
            const endTimeField = document.getElementById('endTime');
            
            if (eventDateField) eventDateField.value = this.formatDateInput(now);
            if (endDateField) endDateField.value = '';
            if (startTimeField) startTimeField.value = '';
            if (endTimeField) endTimeField.value = '';
            
            // УСТАНАВЛИВАЕМ ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ ДЛЯ НОВОГО СОБЫТИЯ
            setTimeout(() => {
                this.setDefaultValues();
            }, 50);
        }
        
        modal.style.display = 'block';
    }

    // Заменяем метод setDefaultValues
    setDefaultValues() {
        console.log('Setting default values...');
        
        // Используем прямой доступ к элементам вместо setFieldValue
        const titleField = document.getElementById('eventTitle');
        if (titleField) {
            titleField.value = 'Сценическая репетиция + монтаж';
        }
        
        // Место проведения по умолчанию (Большой зал)
        const bigHallCheckbox = document.querySelector('input[name="eventLocation"][value="Большой зал"]');
        if (bigHallCheckbox) {
            bigHallCheckbox.checked = true;
            console.log('Big hall checkbox set to checked');
        }
        
        // Ответственные по умолчанию (Романов О.П., Тойтонов Э.А.)
        const romanovCheckbox = document.querySelector('input[name="eventResponsible"][value="Романов О.П."]');
        const toitonovCheckbox = document.querySelector('input[name="eventResponsible"][value="Тойтонов Э.А."]');
        
        if (romanovCheckbox) romanovCheckbox.checked = true;
        if (toitonovCheckbox) toitonovCheckbox.checked = true;
        
        console.log('Default values set');
    }

    fillFormWithEventData(eventData) {
        const event = eventData.extendedProps || eventData;
        const start = eventData.start || new Date();
        const end = eventData.end || start;
        
        // Используем прямой доступ к полям
        const eventIdField = document.getElementById('eventId');
        const eventTitleField = document.getElementById('eventTitle');
        // const eventNotesField = document.getElementById('eventNotes');
        const eventDateField = document.getElementById('eventDate');
        const endDateField = document.getElementById('endDate');
        const startTimeField = document.getElementById('startTime');
        const endTimeField = document.getElementById('endTime');
        
        if (eventIdField) eventIdField.value = eventData.id || '';
        
        if (!eventData.id) {
            // НОВОЕ СОБЫТИЕ - ИСПОЛЬЗУЕМ ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ
            if (eventTitleField) eventTitleField.value = 'Сценическая репетиция + монтаж';
            if (eventDateField) eventDateField.value = this.formatDateInput(new Date());
            if (endDateField) endDateField.value = '';
            if (startTimeField) startTimeField.value = '';
            if (endTimeField) endTimeField.value = '';
            // if (eventNotesField) eventNotesField.value = '';
            
            // Чекбоксы по умолчанию
            this.fillCheckboxGroup('eventLocationGroup', ['Большой зал']);
            this.fillCheckboxGroup('eventResponsibleGroup', ['Романов О.П.', 'Тойтонов Э.А.']);
            
        } else {
            // СУЩЕСТВУЮЩЕЕ СОБЫТИЕ - ИСПОЛЬЗУЕМ СОХРАНЕННЫЕ ЗНАЧЕНИЯ
            if (eventTitleField) eventTitleField.value = eventData.title || '';
            // if (eventNotesField) eventNotesField.value = event.notes || '';
            if (eventDateField) eventDateField.value = this.formatDateInput(start);
            
            // ... остальная логика для существующих событий
            this.fillCheckboxGroup('eventLocationGroup', event.location);
            this.fillCheckboxGroup('eventResponsibleGroup', event.responsible);
        }
        
        // if (eventNotesField) eventNotesField.value = event.notes || '';
        
        // Всегда устанавливаем дату начала
        if (eventDateField) eventDateField.value = this.formatDateInput(start);
        
        // Определяем, многодневное ли событие
        const startDay = new Date(start);
        startDay.setHours(0, 0, 0, 0);
        
        const endDay = new Date(end);
        endDay.setHours(0, 0, 0, 0);
        
        const isMultiDay = startDay.getTime() !== endDay.getTime();
        
        if (isMultiDay && eventData.allDay) {
            // Для многодневных событий: end - 1 день для отображения в форме
            const displayEndDate = new Date(end);
            displayEndDate.setDate(displayEndDate.getDate() - 1);
            if (endDateField) endDateField.value = this.formatDateInput(displayEndDate);
            if (startTimeField) startTimeField.disabled = true;
            if (endTimeField) endTimeField.disabled = true;
            if (startTimeField) startTimeField.value = '';
            if (endTimeField) endTimeField.value = '';
        } else {
            // Для однодневных событий
            if (endDateField) endDateField.value = '';
            if (startTimeField) startTimeField.disabled = false;
            
            // Заполняем время если есть
            if (event.startTime && startTimeField) {
                startTimeField.value = event.startTime;
                if (endTimeField) endTimeField.disabled = false;
            }
            
            if (event.endTime && endTimeField) {
                endTimeField.value = event.endTime;
            }
        }
        
        // Заполняем чекбоксы - для новых событий используем значения по умолчанию
        if (!eventData.id) {
            // Новое событие - используем значения по умолчанию
            this.setDefaultValues();
        } else {
            // Существующее событие - используем сохраненные значения
            this.fillCheckboxGroup('eventLocationGroup', event.location);
            this.fillCheckboxGroup('eventResponsibleGroup', event.responsible);
        }
        
        this.handleTimeChange();
    }


    fillCheckboxGroup(groupId, values) {
        const group = document.getElementById(groupId);
        if (!group || !values) return;
        
        // Снимаем все выделения
        group.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Устанавливаем выбранные значения
        if (Array.isArray(values)) {
            values.forEach(value => {
                const checkbox = group.querySelector(`input[value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        } else {
            const checkbox = group.querySelector(`input[value="${values}"]`);
            if (checkbox) checkbox.checked = true;
        }
    }

    closeEventModal() {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentEvent = null;
    }

    async saveEvent() {
        try {
            if (!this.validateEventDates()) {
                return;
            }

            const formData = this.getFormData();
            
            if (this.currentEvent && this.currentEvent.id) {
                await db.collection('events').doc(this.currentEvent.id).update({
                    ...formData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await db.collection('events').add({
                    ...formData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            this.closeEventModal();
            this.loadEvents();
        } catch (error) {
            if (!error.message.includes('required')) {
                console.error('Error saving event:', error);
                alert('Ошибка при сохранении мероприятия');
            }
        }
    }

    getFormData() {
        const eventType = this.determineEventType();
        let eventData = {
            title: this.getFieldValue('eventTitle'),
            location: this.getCheckboxValues('eventLocation'),
            responsible: this.getCheckboxValues('eventResponsible'),
            // notes: this.getFieldValue('eventNotes'),
            color: '#3498db',
            textColor: '#ffffff',
            eventType: eventType
        };

        const createLocalDate = (dateString, timeString = '00:00') => {
            const [year, month, day] = dateString.split('-').map(Number);
            const [hours, minutes] = timeString.split(':').map(Number);
            return new Date(year, month - 1, day, hours, minutes);
        };

        const eventDate = this.getFieldValue('eventDate');
        if (!eventDate) {
            alert('Пожалуйста, выберите дату');
            throw new Error('Date required');
        }

        switch(eventType) {
            case 'allDay':
                // Однодневное событие: start и end в один день
                eventData.start = createLocalDate(eventDate, '00:00');
                eventData.end = createLocalDate(eventDate, '23:59');
                eventData.allDay = true;
                break;
                
            case 'singleTime':
                const singleTime = this.getFieldValue('startTime');
                eventData.start = createLocalDate(eventDate, singleTime);
                eventData.end = createLocalDate(eventDate, singleTime);
                eventData.allDay = false;
                eventData.startTime = singleTime;
                break;
                
            case 'timeRange':
                const startTime = this.getFieldValue('startTime');
                const endTime = this.getFieldValue('endTime');
                eventData.start = createLocalDate(eventDate, startTime);
                eventData.end = createLocalDate(eventDate, endTime);
                eventData.allDay = false;
                eventData.startTime = startTime;
                eventData.endTime = endTime;
                break;
                
            case 'multiDay':
                const endDate = this.getFieldValue('endDate');
                // Многодневное: start - начало первого дня, end - начало следующего дня после последнего
                eventData.start = createLocalDate(eventDate, '00:00');
                eventData.end = createLocalDate(endDate, '00:00');
                // eventData.end.setDate(eventData.end.getDate()); // +1 день для корректного отображения в календаре
                eventData.end.setDate(eventData.end.getDate() + 1); // +1 день для корректного отображения в календаре
                eventData.allDay = true;
                break;
        }

        return eventData;
    }

    getFieldValue(fieldId) {
        const field = document.getElementById(fieldId);
        return field ? field.value : '';
    }

    getCheckboxValues(groupName) {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]:checked`);
        const values = Array.from(checkboxes).map(checkbox => checkbox.value);
        
        console.log(`getCheckboxValues('${groupName}') returned:`, values); // Для отладки
        
        return values;
    }

    async deleteEvent() {
        if (!this.currentEvent || !this.currentEvent.id) return;
        
        if (confirm('Вы уверены, что хотите удалить это мероприятие?')) {
            try {
                await db.collection('events').doc(this.currentEvent.id).delete();
                this.closeEventModal();
                this.loadEvents();
            } catch (error) {
                console.error('Error deleting event:', error);
                alert('Ошибка при удалении мероприятия');
            }
        }
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
            
            
            // Принудительно обновляем календарь
            this.calendar.refetchEvents();
            
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    async updateEventInFirebase(info) {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        
        try {
            const event = info.event;
            const updateData = {
                start: event.start,
                end: event.end,
                allDay: event.allDay,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('events').doc(event.id).update(updateData);
            
        } catch (error) {
            console.error('Error updating event:', error);
            info.revert();
            alert('Ошибка при обновлении мероприятия');
        } finally {
            this.isUpdating = false;
        }
    }

    updateCalendarTitle() {
        const titleElement = document.getElementById('calendarTitle');
        if (!titleElement) return;
        
        const view = this.calendar.view;
        titleElement.textContent = view.title;
    }

    formatDateInput(date) {
        if (!date) return '';
        
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return localDate.toISOString().split('T')[0];
    }

    formatTimeInput(date) {
        if (!date) return '';
        
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${hours}:${minutes}`;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    validateEventDates() {
        const eventDate = this.getFieldValue('eventDate');
        const endDate = this.getFieldValue('endDate');
        const startTime = this.getFieldValue('startTime');
        const endTime = this.getFieldValue('endTime');
        
        if (endDate && endDate < eventDate) {
            alert('Дата окончания не может быть раньше даты начала');
            return false;
        }
        
        if (endTime && startTime && endTime <= startTime) {
            alert('Время окончания должно быть позже времени начала');
            return false;
        }
        
        return true;
    }

    roundTimeToNearest30Minutes(date) {
        const roundedDate = new Date(date);
        const minutes = roundedDate.getMinutes();
        roundedDate.setMinutes(Math.ceil(minutes / 30) * 30);
        roundedDate.setSeconds(0);
        roundedDate.setMilliseconds(0);
        return roundedDate;
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

    setFieldValue(fieldId, value) {
        try {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
            }
        } catch (error) {
            console.error('Error setting field value:', error);
        }
    }
}

let calendarAdmin;

document.addEventListener('DOMContentLoaded', () => {
    calendarAdmin = new CalendarAdmin();
});