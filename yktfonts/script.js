document.addEventListener('DOMContentLoaded', function() {
    // Загрузка данных о шрифтах
    fetch('fonts.json')
        .then(response => response.json())
        .then(data => {
            const fonts = data.fonts;
            displayFonts(fonts);
            setupSearchAndFilter(fonts);
        })
        .catch(error => console.error('Ошибка загрузки шрифтов:', error));

    // Настройка модального окна
    const modal = document.getElementById('preview-modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Обработчик изменения пользовательского текста
    document.getElementById('custom-text').addEventListener('input', function() {
        const previewText = document.getElementById('modal-preview-text');
        previewText.textContent = this.value || 'Съешь ещё этих мягких французских булок, да выпей чаю.';
    });
    
    // Сброс фильтров
    document.getElementById('reset').addEventListener('click', function() {
        document.getElementById('search').value = '';
        document.getElementById('filter').value = 'all';
        fetch('fonts.json')
            .then(response => response.json())
            .then(data => displayFonts(data.fonts));
    });
});

function displayFonts(fonts) {
    const fontGrid = document.getElementById('font-grid');
    fontGrid.innerHTML = '';
    
    fonts.forEach(font => {
        const fontCard = document.createElement('div');
        fontCard.className = 'font-card';
        fontCard.innerHTML = `
            <div class="font-name">${font.name}</div>
            <div class="font-preview" style="font-family: '${font.family}'">${font.previewText || 'Съешь ещё этих мягких французских булок, да выпей чаю.'}</div>
            <span class="font-category category-${font.category}">${getCategoryName(font.category)}</span>
        `;
        
        fontCard.addEventListener('click', function() {
            showFontPreview(font);
        });
        
        fontGrid.appendChild(fontCard);
    });
}

function showFontPreview(font) {
    const modal = document.getElementById('preview-modal');
    const previewText = document.getElementById('modal-preview-text');
    
    document.getElementById('modal-font-name').textContent = font.name;
    previewText.style.fontFamily = `'${font.family}'`;
    previewText.textContent = 'Съешь ещё этих мягких французских булок, да выпей чаю.';
    
    document.getElementById('font-family').textContent = font.family;
    document.getElementById('font-category').textContent = getCategoryName(font.category);
    document.getElementById('font-format').textContent = font.format || 'TTF/OTF';
    document.getElementById('font-weight').textContent = font.weight || 'Normal (400)';
    document.getElementById('font-style').textContent = font.style || 'Normal';
    
    document.getElementById('custom-text').value = '';
    modal.style.display = 'block';
}

function setupSearchAndFilter(fonts) {
    const searchInput = document.getElementById('search');
    const filterSelect = document.getElementById('filter');
    
    searchInput.addEventListener('input', function() {
        filterFonts(fonts);
    });
    
    filterSelect.addEventListener('change', function() {
        filterFonts(fonts);
    });
}

function filterFonts(fonts) {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filterValue = document.getElementById('filter').value;
    
    const filteredFonts = fonts.filter(font => {
        const matchesSearch = font.name.toLowerCase().includes(searchTerm) || 
                             font.family.toLowerCase().includes(searchTerm);
        const matchesFilter = filterValue === 'all' || font.category === filterValue;
        
        return matchesSearch && matchesFilter;
    });
    
    displayFonts(filteredFonts);
}

function getCategoryName(category) {
    const categories = {
        'sans-serif': 'Без засечек',
        'serif': 'С засечками',
        'monospace': 'Моноширинные',
        'display': 'Декоративные',
        'handwriting': 'Рукописные'
    };
    
    return categories[category] || category;
}