/* ==========================================
   OhmCraft: Resistor Calculator Logic
   ========================================== */

// --- Color Database ---
const colors = [
    { key: 'black', name: 'Negro', digit: 0, multiplier: 1, tolerance: null, tempco: 250 },
    { key: 'brown', name: 'Marrón', digit: 1, multiplier: 10, tolerance: 1, tempco: 100 },
    { key: 'red', name: 'Rojo', digit: 2, multiplier: 100, tolerance: 2, tempco: 50 },
    { key: 'orange', name: 'Naranja', digit: 3, multiplier: 1000, tolerance: null, tempco: 15 },
    { key: 'yellow', name: 'Amarillo', digit: 4, multiplier: 10000, tolerance: null, tempco: 25 },
    { key: 'green', name: 'Verde', digit: 5, multiplier: 100000, tolerance: 0.5, tempco: 20 },
    { key: 'blue', name: 'Azul', digit: 6, multiplier: 1000000, tolerance: 0.25, tempco: 10 },
    { key: 'violet', name: 'Violeta', digit: 7, multiplier: 10000000, tolerance: 0.1, tempco: 5 },
    { key: 'grey', name: 'Gris', digit: 8, multiplier: 100000000, tolerance: 0.05, tempco: 1 },
    { key: 'white', name: 'Blanco', digit: 9, multiplier: 1000000000, tolerance: null, tempco: null },
    { key: 'gold', name: 'Dorado', digit: null, multiplier: 0.1, tolerance: 5, tempco: null },
    { key: 'silver', name: 'Plateado', digit: null, multiplier: 0.01, tolerance: 10, tempco: null },
    { key: 'none', name: 'Ninguno', digit: null, multiplier: null, tolerance: 20, tempco: null }
];

// Color CSS Hex Codes for UI Chips and Labels
const colorHexMap = {
    black: '#000000',
    brown: '#8B4513',
    red: '#EF4444',
    orange: '#F97316',
    yellow: '#FACC15',
    green: '#10B981',
    blue: '#3B82F6',
    violet: '#8B5CF6',
    grey: '#6B7280',
    white: '#FFFFFF',
    gold: '#D4AF37',
    silver: '#C0C0C0',
    none: 'transparent'
};

// SVG Resistor Band Positions for 4, 5, and 6 bands
const bandPositions = {
    4: [
        { id: 1, x: 100, width: 16 },
        { id: 2, x: 135, width: 16 },
        { id: 4, x: 180, width: 16 },
        { id: 5, x: 260, width: 16 }
    ],
    5: [
        { id: 1, x: 95, width: 14 },
        { id: 2, x: 125, width: 14 },
        { id: 3, x: 155, width: 14 },
        { id: 4, x: 195, width: 14 },
        { id: 5, x: 260, width: 14 }
    ],
    6: [
        { id: 1, x: 95, width: 12 },
        { id: 2, x: 125, width: 12 },
        { id: 3, x: 155, width: 12 },
        { id: 4, x: 185, width: 12 },
        { id: 5, x: 245, width: 12 },
        { id: 6, x: 285, width: 12 }
    ]
};

// Band Selector Row Configurations
const bandRoles = {
    digit1: {
        name: 'Dígito 1',
        colors: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white']
    },
    digit2: {
        name: 'Dígito 2',
        colors: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white']
    },
    digit3: {
        name: 'Dígito 3',
        colors: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white']
    },
    multiplier: {
        name: 'Multiplicador',
        colors: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white', 'gold', 'silver']
    },
    tolerance: {
        name: 'Tolerancia',
        colors: ['brown', 'red', 'green', 'blue', 'violet', 'grey', 'gold', 'silver', 'none']
    },
    tempco: {
        name: 'Coef. Temperatura',
        colors: ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey']
    }
};

// --- Application State ---
let appState = {
    numBands: 5, // Default active mode is 5 bands
    selectedColors: {
        digit1: 'brown',
        digit2: 'black',
        digit3: 'black',
        multiplier: 'red',
        tolerance: 'gold',
        tempco: 'brown'
    },
    networkResistors: [] // For series/parallel calculations
};

// --- DOM References ---
const selectorsGrid = document.getElementById('selectors-grid');
const calcResVal = document.getElementById('calc-resistance-value');
const calcTolVal = document.getElementById('calc-tolerance-value');
const calcTempcoVal = document.getElementById('calc-temp-coef');

// --- Helper Functions ---

// Formats a raw numerical resistance in Ohms to a human-readable string
function formatResistance(ohms) {
    if (ohms === 0) return '0 \u2126';
    if (ohms >= 1e9) {
        return `${parseFloat((ohms / 1e9).toFixed(3))} G\u2126`;
    }
    if (ohms >= 1e6) {
        return `${parseFloat((ohms / 1e6).toFixed(3))} M\u2126`;
    }
    if (ohms >= 1000) {
        return `${parseFloat((ohms / 1000).toFixed(3))} k\u2126`;
    }
    return `${parseFloat(ohms.toFixed(3))} \u2126`;
}

// Get the Spanish translation of a color key
function getColorName(key) {
    const match = colors.find(c => c.key === key);
    return match ? match.name : key;
}

// Renders the bands visually on the given resistor SVG element
function drawResistorSVG(svgElementId, numBands, bandColors) {
    const svg = document.getElementById(svgElementId);
    if (!svg) return;
    
    // Hide all 6 SVG bands initially
    for (let i = 1; i <= 6; i++) {
        const bandEl = svg.querySelector(`#${svgElementId === 'resistor-svg' ? 'svg-band-' : 'svg-rev-band-'}${i}`);
        if (bandEl) {
            bandEl.style.display = 'none';
        }
    }
    
    // Position and color only the active bands
    const positions = bandPositions[numBands];
    positions.forEach((pos, idx) => {
        const colorKey = bandColors[idx];
        const bandId = pos.id;
        const bandEl = svg.querySelector(`#${svgElementId === 'resistor-svg' ? 'svg-band-' : 'svg-rev-band-'}${bandId}`);
        
        if (bandEl && colorKey) {
            bandEl.setAttribute('x', pos.x);
            bandEl.setAttribute('width', pos.width);
            bandEl.setAttribute('fill', colorHexMap[colorKey]);
            bandEl.style.display = 'block';
        }
    });
}

// --- Band to Value Calculator Logic ---

// Calculates the resistance details from active state
function calculateFromState() {
    const { numBands, selectedColors } = appState;
    const colorData = {};
    colors.forEach(c => { colorData[c.key] = c; });
    
    let activeColors = [];
    if (numBands === 4) {
        activeColors = [selectedColors.digit1, selectedColors.digit2, selectedColors.multiplier, selectedColors.tolerance];
    } else if (numBands === 5) {
        activeColors = [selectedColors.digit1, selectedColors.digit2, selectedColors.digit3, selectedColors.multiplier, selectedColors.tolerance];
    } else if (numBands === 6) {
        activeColors = [selectedColors.digit1, selectedColors.digit2, selectedColors.digit3, selectedColors.multiplier, selectedColors.tolerance, selectedColors.tempco];
    }
    
    // Update SVG colors
    drawResistorSVG('resistor-svg', numBands, activeColors);
    
    // Calculate Numerical Value
    const d1 = colorData[selectedColors.digit1].digit;
    const d2 = colorData[selectedColors.digit2].digit;
    
    let baseValue = 0;
    if (numBands === 4) {
        baseValue = d1 * 10 + d2;
    } else {
        const d3 = colorData[selectedColors.digit3].digit;
        baseValue = d1 * 100 + d2 * 10 + d3;
    }
    
    const multVal = colorData[selectedColors.multiplier].multiplier;
    const resistance = baseValue * multVal;
    
    // Get tolerance and tempco
    const tolerance = colorData[selectedColors.tolerance].tolerance;
    const tempco = numBands === 6 ? colorData[selectedColors.tempco].tempco : null;
    
    // Update UI Results
    calcResVal.innerHTML = formatResistance(resistance);
    
    if (tolerance !== null) {
        calcTolVal.innerHTML = `&plusmn; ${tolerance}%`;
    } else {
        calcTolVal.innerHTML = '';
    }
    
    if (numBands === 6 && tempco !== null) {
        calcTempcoVal.style.display = 'block';
        calcTempcoVal.innerHTML = `${tempco} ppm/K`;
    } else {
        calcTempcoVal.style.display = 'none';
    }
}

// Dynamically creates the HTML color buttons grid for the selector card
function renderSelectors() {
    selectorsGrid.innerHTML = '';
    
    // Determine which roles are active based on the band mode
    let activeRoles = [];
    if (appState.numBands === 4) {
        activeRoles = ['digit1', 'digit2', 'multiplier', 'tolerance'];
    } else if (appState.numBands === 5) {
        activeRoles = ['digit1', 'digit2', 'digit3', 'multiplier', 'tolerance'];
    } else if (appState.numBands === 6) {
        activeRoles = ['digit1', 'digit2', 'digit3', 'multiplier', 'tolerance', 'tempco'];
    }
    
    activeRoles.forEach(role => {
        const config = bandRoles[role];
        const selectedColor = appState.selectedColors[role];
        
        // Row Container
        const row = document.createElement('div');
        row.className = 'band-selector-row';
        
        // Title Container
        const titleContainer = document.createElement('div');
        titleContainer.className = 'band-title-container';
        
        const title = document.createElement('span');
        title.className = 'band-title';
        title.textContent = config.name;
        
        const label = document.createElement('span');
        label.className = 'selected-color-name';
        label.textContent = getColorName(selectedColor);
        
        titleContainer.appendChild(title);
        titleContainer.appendChild(label);
        row.appendChild(titleContainer);
        
        // Color Grid Buttons
        const buttonGrid = document.createElement('div');
        buttonGrid.className = 'color-buttons-container';
        
        config.colors.forEach(colorKey => {
            const btn = document.createElement('button');
            btn.className = 'color-circle-btn';
            btn.setAttribute('data-color', colorKey);
            btn.setAttribute('aria-label', getColorName(colorKey));
            btn.title = getColorName(colorKey);
            
            if (colorKey === selectedColor) {
                btn.classList.add('active');
            }
            
            btn.addEventListener('click', () => {
                // Update State
                appState.selectedColors[role] = colorKey;
                
                // Update active class on grid
                buttonGrid.querySelectorAll('.color-circle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update text label
                label.textContent = getColorName(colorKey);
                
                // Recalculate
                calculateFromState();
            });
            
            buttonGrid.appendChild(btn);
        });
        
        row.appendChild(buttonGrid);
        selectorsGrid.appendChild(row);
    });
}

// --- Value to Band (Reverse) Calculator ---

// Parses complex inputs like "4k7", "2.2M", "100" to numerical Ohm values
function parseResistanceInput(str) {
    str = str.trim().toLowerCase().replace(',', '.');
    
    // Pattern like "4k7", "2m2", "0r22"
    const inlineRegex = /^(\d+)([rkmg])(\d*)$/;
    const matchInline = str.match(inlineRegex);
    
    if (matchInline) {
        const val1 = matchInline[1];
        const unitLetter = matchInline[2];
        const val2 = matchInline[3] || '0';
        const floatVal = parseFloat(`${val1}.${val2}`);
        
        let multiplier = 1;
        if (unitLetter === 'k') multiplier = 1000;
        if (unitLetter === 'm') multiplier = 1000000;
        if (unitLetter === 'g') multiplier = 1000000000;
        
        return floatVal * multiplier;
    }
    
    // Pattern like "4.7k", "4.7 k", "100"
    const trailingRegex = /^([\d.]+)\s*([kkmg]?)$/;
    const matchTrailing = str.match(trailingRegex);
    if (matchTrailing) {
        const floatVal = parseFloat(matchTrailing[1]);
        const unitLetter = matchTrailing[2];
        
        let multiplier = 1;
        if (unitLetter === 'k') multiplier = 1000;
        if (unitLetter === 'm') multiplier = 1000000;
        if (unitLetter === 'g') multiplier = 1000000000;
        
        return floatVal * multiplier;
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? null : parsed;
}

// Resolves bands from target resistance value
function getBandsFromValue(value, numBands, toleranceVal, tempcoVal) {
    const N = numBands === 4 ? 2 : 3;
    
    // Calculate mathematical multiplier exponent
    let M = Math.floor(Math.log10(value)) - (N - 1);
    
    let outOfRange = false;
    // Multipliers standard limits: [-2, 9] (Silver is 0.01, White multiplier is 1G)
    if (M < -2) {
        M = -2;
    } else if (M > 9) {
        M = 9;
        outOfRange = true;
    }
    
    let D = Math.round(value / Math.pow(10, M));
    
    // Adjust if rounding pushes digit count higher (e.g. 99.6 rounds to 100 in 2-digit mode)
    if (D >= Math.pow(10, N)) {
        M += 1;
        D = Math.round(value / Math.pow(10, M));
    }
    
    if (M > 9) {
        M = 9;
        D = Math.pow(10, N) - 1;
        outOfRange = true;
    }
    if (D <= 0) {
        D = 1;
        outOfRange = true;
    }
    
    // Format digits as strings
    let digitsStr = D.toString().padStart(N, '0');
    if (digitsStr.length > N) {
        digitsStr = digitsStr.slice(0, N);
    }
    
    // Map digits to color keys
    const digitColors = digitsStr.split('').map(char => {
        const digitVal = parseInt(char);
        const match = colors.find(c => c.digit === digitVal);
        return match ? match.key : 'black';
    });
    
    // Map multiplier M to closest color key
    const multValue = Math.pow(10, M);
    let multColor = 'black';
    let minDiff = Infinity;
    colors.forEach(c => {
        if (c.multiplier !== null) {
            const diff = Math.abs(c.multiplier - multValue);
            if (diff < minDiff) {
                minDiff = diff;
                multColor = c.key;
            }
        }
    });
    
    // Tolerance mapping
    let tolColor = 'gold'; // default fallback
    const tolMatch = colors.find(c => c.tolerance === parseFloat(toleranceVal));
    if (tolMatch) {
        tolColor = tolMatch.key;
    }
    
    // Temperature Coef mapping
    let tempcoColor = null;
    if (numBands === 6 && tempcoVal) {
        tempcoColor = 'brown'; // default fallback
        const tcMatch = colors.find(c => c.tempco === parseInt(tempcoVal));
        if (tcMatch) {
            tempcoColor = tcMatch.key;
        }
    }
    
    const resultColors = [...digitColors, multColor, tolColor];
    if (tempcoColor) {
        resultColors.push(tempcoColor);
    }
    
    // Recalculate what resistance is actually represented
    const calculatedVal = D * Math.pow(10, M);
    
    return {
        colors: resultColors,
        exactValue: calculatedVal,
        outOfRange: outOfRange
    };
}

// Executes the Reverse calculation update cycle
function runReverseCalculation() {
    const inputValStr = document.getElementById('input-res-val').value;
    const selectUnit = parseFloat(document.getElementById('select-res-unit').value);
    const numBands = parseInt(document.getElementById('select-rev-bands').value);
    const toleranceVal = document.getElementById('select-rev-tolerance').value;
    const tempcoVal = document.getElementById('select-rev-tempco').value;
    
    const feedbackEl = document.getElementById('exact-value-feedback');
    const chipListEl = document.getElementById('reverse-bands-list');
    
    // Handle TempCo Visibility
    const tempcoGroup = document.getElementById('group-rev-tempco');
    if (numBands === 6) {
        tempcoGroup.style.display = 'flex';
    } else {
        tempcoGroup.style.display = 'none';
    }
    
    if (!inputValStr) {
        chipListEl.innerHTML = '<span class="empty-list-msg">Ingresa un valor válido.</span>';
        feedbackEl.innerHTML = '';
        drawResistorSVG('resistor-svg-reverse', numBands, Array(numBands).fill('none'));
        return;
    }
    
    const rawValue = parseResistanceInput(inputValStr);
    if (rawValue === null || isNaN(rawValue) || rawValue <= 0) {
        chipListEl.innerHTML = '<span class="empty-list-msg" style="color: var(--danger)">Valor numérico no válido</span>';
        feedbackEl.innerHTML = '';
        drawResistorSVG('resistor-svg-reverse', numBands, Array(numBands).fill('none'));
        return;
    }
    
    const targetResistance = rawValue * selectUnit;
    const resBands = getBandsFromValue(targetResistance, numBands, toleranceVal, tempcoVal);
    
    // Update SVG Graphic
    drawResistorSVG('resistor-svg-reverse', numBands, resBands.colors);
    
    // Update Chip List
    chipListEl.innerHTML = '';
    resBands.colors.forEach(colKey => {
        const chip = document.createElement('span');
        chip.className = 'color-chip';
        chip.style.setProperty('--chip-dot-color', colorHexMap[colKey]);
        
        // Label styling adjustments for contrast
        if (colKey === 'white') {
            chip.style.color = '#000';
            chip.style.backgroundColor = '#fff';
        } else if (colKey === 'black') {
            chip.style.backgroundColor = '#1f2937';
        } else {
            chip.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }
        
        chip.textContent = getColorName(colKey);
        chipListEl.appendChild(chip);
    });
    
    // Display feedback on accuracy
    const matchTolerancePercent = Math.abs(resBands.exactValue - targetResistance) / targetResistance;
    if (resBands.outOfRange) {
        feedbackEl.style.color = 'var(--danger)';
        feedbackEl.innerHTML = `Advertencia: Fuera del rango de cálculo disponible.`;
    } else if (matchTolerancePercent > 0.0001) {
        feedbackEl.style.color = 'var(--accent-purple)';
        feedbackEl.innerHTML = `Valor más cercano: <strong>${formatResistance(resBands.exactValue)}</strong> (Desviación de ${parseFloat((matchTolerancePercent * 100).toFixed(2))}% del valor deseado)`;
    } else {
        feedbackEl.style.color = 'var(--success)';
        feedbackEl.innerHTML = `Valor exacto coincidente: <strong>${formatResistance(resBands.exactValue)}</strong>`;
    }
}

// --- Series & Parallel Network Calculator ---

function updateNetworkResults() {
    const listEl = document.getElementById('resistor-list');
    const countEl = document.getElementById('resistor-count');
    const seriesEl = document.getElementById('series-eq-val');
    const parallelEl = document.getElementById('parallel-eq-val');
    
    // Clear list
    listEl.innerHTML = '';
    countEl.textContent = appState.networkResistors.length;
    
    if (appState.networkResistors.length === 0) {
        listEl.innerHTML = '<li class="empty-list-msg">No hay resistencias agregadas. Añade algunas para calcular.</li>';
        seriesEl.innerHTML = '0 &Omega;';
        parallelEl.innerHTML = '0 &Omega;';
        return;
    }
    
    // Populate list DOM
    appState.networkResistors.forEach((val, idx) => {
        const item = document.createElement('li');
        item.className = 'resistor-item';
        
        const info = document.createElement('div');
        info.className = 'resistor-info';
        
        const badge = document.createElement('span');
        badge.className = 'resistor-index';
        badge.textContent = `R${idx + 1}`;
        
        const valText = document.createElement('span');
        valText.className = 'resistor-val';
        valText.textContent = formatResistance(val);
        
        info.appendChild(badge);
        info.appendChild(valText);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-item-btn';
        delBtn.setAttribute('aria-label', `Eliminar R${idx + 1}`);
        delBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        
        delBtn.addEventListener('click', () => {
            appState.networkResistors.splice(idx, 1);
            updateNetworkResults();
        });
        
        item.appendChild(info);
        item.appendChild(delBtn);
        listEl.appendChild(item);
    });
    
    // Calculate Equivalents
    // Series: sum
    const seriesVal = appState.networkResistors.reduce((sum, current) => sum + current, 0);
    
    // Parallel: 1 / (sum of 1/R)
    let parallelVal = 0;
    const hasZero = appState.networkResistors.some(r => r === 0);
    
    if (hasZero) {
        parallelVal = 0;
    } else {
        const sumReciprocal = appState.networkResistors.reduce((sum, current) => sum + (1 / current), 0);
        parallelVal = 1 / sumReciprocal;
    }
    
    // Update displays
    seriesEl.textContent = formatResistance(seriesVal);
    parallelEl.textContent = formatResistance(parallelVal);
}

// --- Tab Switching Logic ---

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPanelId = tab.getAttribute('aria-controls');
            
            // Remove active classes
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            panels.forEach(p => p.classList.remove('active'));
            
            // Add active classes to targets
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            // Special triggers when entering tab 2
            if (targetPanelId === 'panel-values') {
                runReverseCalculation();
            }
        });
    });
}

// --- Event Listeners and Page Setup ---

document.addEventListener('DOMContentLoaded', () => {
    // Disable scroll restoration and force scroll to top
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // 1. Wire up Tabs
    setupTabs();
    
    // 2. Wire up Band Mode Selector Buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const bands = parseInt(btn.getAttribute('data-bands'));
            appState.numBands = bands;
            
            // Re-render row controls and calculate
            renderSelectors();
            calculateFromState();
        });
    });
    
    // 3. Setup Initial Selectors and Calculations
    renderSelectors();
    calculateFromState();
    
    // 4. Wire up Value to Color Forms
    const reverseForm = document.getElementById('reverse-calc-form');
    const revInputs = [
        document.getElementById('input-res-val'),
        document.getElementById('select-res-unit'),
        document.getElementById('select-rev-bands'),
        document.getElementById('select-rev-tolerance'),
        document.getElementById('select-rev-tempco')
    ];
    
    revInputs.forEach(inputEl => {
        if (inputEl) {
            // Re-run on inputs or selection changes
            inputEl.addEventListener('input', runReverseCalculation);
            inputEl.addEventListener('change', runReverseCalculation);
        }
    });
    
    // 5. Wire up Network Circuit Calculations
    const networkForm = document.getElementById('network-add-form');
    const netInputVal = document.getElementById('network-res-val');
    const netInputUnit = document.getElementById('network-res-unit');
    const clearNetBtn = document.getElementById('clear-network-btn');
    
    networkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawVal = parseFloat(netInputVal.value);
        const unit = parseFloat(netInputUnit.value);
        
        if (!isNaN(rawVal) && rawVal > 0) {
            const finalVal = rawVal * unit;
            appState.networkResistors.push(finalVal);
            netInputVal.value = ''; // Clear value field
            netInputVal.focus();
            updateNetworkResults();
        }
    });
    
    clearNetBtn.addEventListener('click', () => {
        appState.networkResistors = [];
        updateNetworkResults();
    });
});
