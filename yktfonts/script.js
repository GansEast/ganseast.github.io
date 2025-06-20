document.addEventListener('DOMContentLoaded', function() {
    // Загрузка данных о шрифтах
    fetch('fonts.json')
        .then(response => response.json())
        .then(data => {
            const fonts = data.fonts;
            loadFonts(fonts); // Сначала загружаем шрифты
            displayFonts(fonts); // Затем отображаем
            setupSearchAndFilter(fonts);
            setupFontWeightDemo(); // Настраиваем демонстрацию начертаний
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
        previewText.textContent = this.value || previewText.dataset.defaultText;
    });
    
    // Сброс фильтров
    document.getElementById('reset').addEventListener('click', function() {
        document.getElementById('search').value = '';
        document.getElementById('filter').value = 'all';
        fetch('fonts.json')
            .then(response => response.json())
            .then(data => {
                displayFonts(data.fonts);
                setupFontWeightDemo();
            });
    });
});

function loadFonts(fonts) {
    const fontStyles = document.getElementById('font-styles');
    let cssRules = '';
    
    fonts.forEach(font => {
        // Для каждого варианта начертания создаем правило @font-face
        font.variants.forEach(variant => {
            cssRules += `
                @font-face {
                    font-family: '${font.family}';
                    src: url('fonts/${variant.file}') format('${variant.format || 'truetype'}');
                    font-weight: ${variant.weight};
                    font-style: ${variant.style};
                }
            `;
        });
    });
    
    fontStyles.textContent = cssRules;
}

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
    
    // Сохраняем текст по умолчанию в data-атрибут
    previewText.dataset.defaultText = font.previewText || 'Съешь ещё этих мягких французских булок, да выпей чаю.';
    
    document.getElementById('modal-font-name').textContent = font.name;
    previewText.style.fontFamily = `'${font.family}'`;
    previewText.textContent = previewText.dataset.defaultText;
    
    document.getElementById('font-family').textContent = font.family;
    document.getElementById('font-category').textContent = getCategoryName(font.category);
    document.getElementById('font-format').textContent = 'TTF/OTF';
    
    // Показываем доступные начертания
    const weights = [...new Set(font.variants.map(v => v.weight))].join(', ');
    const styles = [...new Set(font.variants.map(v => v.style))].join(', ');
    
    document.getElementById('font-weight').textContent = weights;
    document.getElementById('font-style').textContent = styles;
    
    // Обновляем демонстрацию начертаний
    updateVariantsDemo(font);
    
    document.getElementById('custom-text').value = '';
    modal.style.display = 'block';
}

function setupFontWeightDemo() {
    // Добавляем обработчики для переключения начертаний в демо-блоке
    document.querySelectorAll('.variant-example').forEach(example => {
        example.addEventListener('click', function() {
            const weight = this.dataset.weight;
            const style = this.dataset.style;
            const previewText = document.getElementById('modal-preview-text');
            
            previewText.style.fontWeight = weight;
            previewText.style.fontStyle = style;
        });
    });
}

function updateVariantsDemo(font) {
    const demoContainer = document.querySelector('.variants-demo');
    demoContainer.innerHTML = '<h3>Примеры начертаний (кликните для применения):</h3>';
    
    font.variants.forEach(variant => {
        const example = document.createElement('div');
        example.className = 'variant-example';
        example.style.fontFamily = `'${font.family}'`;
        example.style.fontWeight = variant.weight;
        example.style.fontStyle = variant.style;
        example.dataset.weight = variant.weight;
        example.dataset.style = variant.style;
        
        const weightName = getWeightName(variant.weight);
        const styleName = variant.style === 'italic' ? 'курсив' : 'обычный';
        
        example.textContent = `${font.name} ${weightName} ${styleName} (${variant.weight} ${variant.style})`;
        demoContainer.appendChild(example);
    });
}

function getWeightName(weight) {
    const weights = {
        '100': 'Thin',
        '200': 'Extra Light',
        '300': 'Light',
        '400': 'Regular',
        '500': 'Medium',
        '600': 'Semi Bold',
        '700': 'Bold',
        '800': 'Extra Bold',
        '900': 'Black'
    };
    return weights[weight] || weight;
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