async function exportToDoc() {
    try {
        const snapshot = await db.collection('events').get();
        const events = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            events.push({
                id: doc.id,
                ...data,
                date: data.start?.toDate() || new Date(data.date)
            });
        });
        
        const docContent = createDocumentContent(events);
        downloadDocument(docContent);
    } catch (error) {
        console.error('Error generating document:', error);
        alert('Ошибка при генерации документа');
    }
}

function createDocumentContent(events) {
    let content = `«Утверждаю» ___________________ А.Н.КОРЯКИНА

Генеральный директор Дома Дружбы народов
им. А.Е.Кулаковского

«__»______________2025 г.

ПЛАН ОСНОВНЫХ МЕРОПРИЯТИЙ
ДОМА ДРУЖБЫ НАРОДОВ
имени А.Е.КУЛАКОВСКОГО
НОЯБРЬ 2025 г.

+---------------+-----------------+---------------------+---------------------------+-----------------+---------------+
|     Дата      |   День недели   |       Время         |      Мероприятие          | Место проведения |  Ответственный |
+---------------+-----------------+---------------------+---------------------------+-----------------+---------------+
`;

    // Группировка по дате
    const eventsByDate = {};
    events.forEach(event => {
        const dateStr = event.date.toISOString().split('T')[0];
        if (!eventsByDate[dateStr]) {
            eventsByDate[dateStr] = [];
        }
        eventsByDate[dateStr].push(event);
    });

    // Создание таблицы
    Object.keys(eventsByDate).sort().forEach(dateStr => {
        const dateEvents = eventsByDate[dateStr];
        const dateObj = new Date(dateStr);
        const day = dateObj.getDate();
        const dayOfWeek = getDayOfWeek(dateObj.getDay());
        
        dateEvents.forEach((event, index) => {
            const time = event.time || formatTimeForExport(event.start);
            if (index === 0) {
                content += `| ${day}. | ${dayOfWeek} | ${time} | ${event.title} | ${event.location || ''} | ${event.responsible || ''} |\n`;
            } else {
                content += `|     |       | ${time} | ${event.title} | ${event.location || ''} | ${event.responsible || ''} |\n`;
            }
        });
        
        content += `+---------------+-----------------+---------------------+---------------------------+-----------------+---------------+\n`;
    });

    return content;
}

function formatTimeForExport(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}.${minutes}`;
}

function getDayOfWeek(dayIndex) {
    const days = ['ВОСКРЕСЕНЬЕ', 'ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'];
    return days[dayIndex];
}

function downloadDocument(content) {
    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'план_НОЯБРЬ_2025_г.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatEventForExport(event) {
    const eventType = event.eventType || 'singleTime';
    
    switch(eventType) {
        case 'allDay':
            return `Весь день | ${event.title}`;
        case 'singleTime':
            const time = formatTimeForExport(event.start);
            return `${time} | ${event.title}`;
        case 'multiDay':
            const startStr = event.start.toLocaleDateString('ru-RU');
            const endStr = event.end.toLocaleDateString('ru-RU');
            return `${startStr} - ${endStr} | ${event.title}`;
        case 'multiTime':
            if (event.timeSlots && event.timeSlots.length > 0) {
                return event.timeSlots.map(slot => 
                    `${slot.start}-${slot.end} | ${event.title}`
                ).join('\n');
            }
            return formatTimeForExport(event.start) + ' | ' + event.title;
        default:
            return formatTimeForExport(event.start) + ' | ' + event.title;
    }
}