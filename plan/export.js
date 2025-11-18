async function exportToDoc() {
    try {
        await loadDocxLibrary();
        
        const snapshot = await db.collection('events').get();
        const events = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const startDate = data.start?.toDate() || new Date();
            const endDate = data.end?.toDate() || startDate;
            
            events.push({
                id: doc.id,
                ...data,
                start: startDate,
                end: endDate
            });
        });
        
        await generateDocxDocument(events);
    } catch (error) {
        console.error('Error generating document:', error);
        alert('Ошибка при генерации документа: ' + error.message);
    }
}

function loadDocxLibrary() {
    return new Promise((resolve, reject) => {
        if (window.docx) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/docx@7.8.2/build/index.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function generateDocxDocument(events) {
    const docx = window.docx;
    const { 
        Document, Paragraph, Table, TableCell, TableRow, TextRun, 
        AlignmentType, BorderStyle, VerticalAlign, PageOrientation,
        convertInchesToTwip, WidthType
    } = docx;

    // Получаем текущий месяц и год из календаря
    const currentMonth = getCurrentMonthFromCalendar();
    const monthName = currentMonth.monthName;
    const year = currentMonth.year;

    // Фильтруем события по текущему месяцу
    const filteredEvents = events.filter(event => {
        const eventDate = event.start;
        return eventDate.getMonth() === currentMonth.monthIndex && 
               eventDate.getFullYear() === currentMonth.year;
    });

    // Обрабатываем многодневные события - создаем отдельные записи для каждого дня
    const processedEvents = [];
    filteredEvents.forEach(event => {
        const eventType = event.eventType || 'allDay';
        
        if (eventType === 'multiDay') {
            // Для многодневных событий создаем записи для каждого дня
            const start = new Date(event.start);
            const end = new Date(event.end);
            
            // Корректируем end date для правильного отображения
            const adjustedEnd = new Date(end);
            adjustedEnd.setDate(adjustedEnd.getDate() - 1);
            
            const current = new Date(start);
            while (current <= adjustedEnd) {
                processedEvents.push({
                    ...event,
                    start: new Date(current),
                    end: new Date(current),
                    displayDate: current.toISOString().split('T')[0],
                    isMultiDay: true,
                    originalTitle: event.title
                });
                current.setDate(current.getDate() + 1);
            }
        } else {
            // Для обычных событий
            processedEvents.push({
                ...event,
                displayDate: event.start.toISOString().split('T')[0],
                isMultiDay: false,
                originalTitle: event.title
            });
        }
    });

    // Сортируем события по дате
    const sortedEvents = processedEvents.sort((a, b) => a.start - b.start);

    // Группируем события по дате
    const eventsByDate = {};
    sortedEvents.forEach(event => {
        const dateKey = event.displayDate;
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
    });

    // Создаем строки таблицы
    const tableRows = [
        // Заголовок таблицы
        new TableRow({
            children: [
                createTableCell("Дата", true, 8),
                createTableCell("Время", true, 12),
                createTableCell("Мероприятие", true, 50),
                createTableCell("Место проведения", true, 15),
                createTableCell("Ответственный", true, 15),
            ],
        })
    ];

    // Добавляем события с объединенными ячейками для дат
    Object.keys(eventsByDate).sort().forEach(dateKey => {
        const dateEvents = eventsByDate[dateKey];
        const firstEvent = dateEvents[0];
        const dateStr = formatDateForExport(firstEvent.start);
        const dayOfWeek = getDayOfWeek(firstEvent.start);
        
        // Первая строка для этой даты
        tableRows.push(
            new TableRow({
                children: [
                    createTableCell(`${dateStr}\n${dayOfWeek}`, false, dateEvents.length),
                    createTableCell(formatTimeForExport(dateEvents[0]), false),
                    createTableCell(getEventTitle(dateEvents[0]), false),
                    createTableCell(formatArrayValue(dateEvents[0].location), false),
                    createTableCell(formatArrayValue(dateEvents[0].responsible), false),
                ],
            })
        );

        // Остальные строки для этой даты (без ячейки даты)
        for (let i = 1; i < dateEvents.length; i++) {
            tableRows.push(
                new TableRow({
                    children: [
                        createTableCell("", false), // Пустая ячейка для даты
                        createTableCell(formatTimeForExport(dateEvents[i]), false),
                        createTableCell(getEventTitle(dateEvents[i]), false),
                        createTableCell(formatArrayValue(dateEvents[i].location), false),
                        createTableCell(formatArrayValue(dateEvents[i].responsible), false),
                    ],
                })
            );
        }
    });

    // Создаем документ с альбомной ориентацией
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.LANDSCAPE,
                    },
                    margin: {
                        top: convertInchesToTwip(0.5),
                        right: convertInchesToTwip(0.5),
                        bottom: convertInchesToTwip(0.5),
                        left: convertInchesToTwip(0.5),
                    }
                }
            },
            children: [
                // Шапка документа
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({ 
                            text: "«Утверждаю» ___________________ А.Н.КОРЯКИНА", 
                            size: 20,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({ 
                            text: "Генеральный директор Дома Дружбы народов",
                            size: 20,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({ 
                            text: "им. А.Е.Кулаковского",
                            size: 20,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({ 
                            text: `«__»______________${year} г.`, 
                            size: 20,
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),
                
                // Основной заголовок
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ 
                            text: "ПЛАН ОСНОВНЫХ МЕРОПРИЯТИЙ", 
                            bold: true,
                            size: 28,
                            allCaps: true,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ 
                            text: "ДОМА ДРУЖБЫ НАРОДОВ", 
                            bold: true,
                            size: 24,
                            allCaps: true,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ 
                            text: "имени А.Е.КУЛАКОВСКОГО", 
                            bold: true,
                            size: 24,
                            allCaps: true,
                        }),
                    ],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ 
                            text: `${monthName.toUpperCase()} ${year} г.`, 
                            bold: true,
                            size: 24,
                            allCaps: true,
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                // Таблица
                new Table({
                    width: {
                        size: 100,
                        type: WidthType.PERCENTAGE,
                    },
                    columnWidths: [1000, 1500, 4500, 1500, 1500],
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                    },
                    rows: tableRows,
                }),
            ],
        }],
    });

    // Генерация и скачивание файла
    const blob = await docx.Packer.toBlob(doc);
    downloadDocument(blob, `план_мероприятий_${monthName}_${year}.docx`);

    function createTableCell(text, isHeader = false, rowSpan = 1) {
        const cell = new TableCell({
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ 
                            text: text || '',
                            bold: isHeader
                        })
                    ]
                })
            ],
            verticalAlign: VerticalAlign.CENTER,
        });

        // Устанавливаем rowSpan если нужно
        if (rowSpan > 1) {
            cell.rowSpan = rowSpan;
        }

        return cell;
    }
}

// Функция для получения заголовка события с учетом многодневности
function getEventTitle(event) {
    if (event.isMultiDay && event.originalTitle) {
        return event.originalTitle;
    }
    return event.title || 'Без названия';
}

// Функция для получения текущего месяца из календаря
function getCurrentMonthFromCalendar() {
    // Получаем заголовок календаря
    const calendarTitle = document.getElementById('calendarTitle');
    if (calendarTitle) {
        const titleText = calendarTitle.textContent;
        // Парсим месяц и год из заголовка (например: "ноябрь 2025")
        const parts = titleText.split(' ');
        if (parts.length >= 2) {
            const monthName = parts[0];
            const year = parseInt(parts[1]);
            const monthIndex = getMonthIndex(monthName);
            return { monthName: monthName.toUpperCase(), year, monthIndex };
        }
    }
    
    // Если не удалось получить из календаря, используем текущую дату
    const now = new Date();
    const monthNames = [
        'ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ',
        'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'
    ];
    return {
        monthName: monthNames[now.getMonth()],
        year: now.getFullYear(),
        monthIndex: now.getMonth()
    };
}

// Функция для получения индекса месяца по названию
function getMonthIndex(monthName) {
    const months = {
        'январь': 0, 'февраль': 1, 'март': 2, 'апрель': 3, 'май': 4, 'июнь': 5,
        'июль': 6, 'август': 7, 'сентябрь': 8, 'октябрь': 9, 'ноябрь': 10, 'декабрь': 11,
        'ЯНВАРЬ': 0, 'ФЕВРАЛЬ': 1, 'МАРТ': 2, 'АПРЕЛЬ': 3, 'МАЙ': 4, 'ИЮНЬ': 5,
        'ИЮЛЬ': 6, 'АВГУСТ': 7, 'СЕНТЯБРЬ': 8, 'ОКТЯБРЬ': 9, 'НОЯБРЬ': 10, 'ДЕКАБРЬ': 11
    };
    return months[monthName.toLowerCase()] || new Date().getMonth();
}

function formatDateForExport(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.getDate().toString(); // Только число
}

function getDayOfWeek(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const days = ['ВОСКРЕСЕНЬЕ', 'ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'];
    return days[d.getDay()];
}

function formatTimeForExport(event) {
    const eventType = event.eventType || 'allDay';
    
    switch(eventType) {
        case 'allDay':
            return 'Весь день';
        case 'singleTime':
            return event.startTime || formatTime(event.start);
        case 'timeRange':
            const startTime = event.startTime || formatTime(event.start);
            const endTime = event.endTime || formatTime(event.end);
            return `${startTime}-${endTime}`;
        case 'multiDay':
            return 'Весь день';
        default:
            return formatTime(event.start);
    }
}

function formatTime(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatArrayValue(value) {
    if (!value) return '';
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    return value;
}

function downloadDocument(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}