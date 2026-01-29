// Three.js Setup
let scene, camera, renderer;
let showGrid = true;
let showAxes = true;
let gridHelper, axesHelper;

// Equation management
let equations = [];
let equationIdCounter = 0;
let activeEquationId = null;

// Analysis features
let criticalPointMarkers = [];
let contourLines = [];
let normalVectors = [];
let evaluationMarker = null;

// Animation
let autoRotate = false;
let rotationSpeed = 0.005;
let animationTime = 0;
let isAnimating = false;

// Visualization settings
let renderMode = 'solid';
let colorMode = 'solid';
let surfaceOpacity = 1.0;
let surfaceShininess = 30;
let smoothShading = true;

// Color palette for equations
const colorPalette = [
    '#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b',
    '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#a855f7'
];

// Autocomplete suggestions
const functionSuggestions = [
    { trigger: 'sin', suggestion: 'sin()', display: 'sin(x) - Sine function', cursorOffset: 1 },
    { trigger: 'cos', suggestion: 'cos()', display: 'cos(x) - Cosine function', cursorOffset: 1 },
    { trigger: 'tan', suggestion: 'tan()', display: 'tan(x) - Tangent function', cursorOffset: 1 },
    { trigger: 'sqrt', suggestion: '√()', display: '√(x) - Square root', cursorOffset: 2 },
    { trigger: 'sq', suggestion: '√()', display: '√(x) - Square root', cursorOffset: 2 },
    { trigger: 'exp', suggestion: 'exp()', display: 'exp(x) - Exponential (eˣ)', cursorOffset: 1 },
    { trigger: 'ln', suggestion: 'ln()', display: 'ln(x) - Natural logarithm', cursorOffset: 1 },
    { trigger: 'log', suggestion: 'log()', display: 'log(x) - Natural logarithm', cursorOffset: 1 },
    { trigger: 'abs', suggestion: 'abs()', display: 'abs(x) - Absolute value', cursorOffset: 1 },
    { trigger: 'pi', suggestion: 'π', display: 'π - Pi constant', cursorOffset: 0 },
    { trigger: 'asin', suggestion: 'asin()', display: 'asin(x) - Arcsine', cursorOffset: 1 },
    { trigger: 'acos', suggestion: 'acos()', display: 'acos(x) - Arccosine', cursorOffset: 1 },
    { trigger: 'atan', suggestion: 'atan()', display: 'atan(x) - Arctangent', cursorOffset: 1 }
];

// Autocomplete state
let currentSuggestions = [];
let autocompleteIndex = -1;

function init() {
    const canvas = document.getElementById('canvas3d');
    const container = canvas.parentElement;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);

    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(10, 10, 10);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x6366f1, 0.3);
    directionalLight2.position.set(-10, -5, -10);
    scene.add(directionalLight2);

    // Grid
    gridHelper = new THREE.GridHelper(20, 20, 0x2a2a3f, 0x1a1a2f);
    scene.add(gridHelper);

    // Axes
    axesHelper = new THREE.AxesHelper(8);
    scene.add(axesHelper);

    // Controls
    setupControls();
    setupGlobalAutocomplete();

    // Add initial equation
    addEquation();

    // Resize handler
    window.addEventListener('resize', onWindowResize);

    // Range change handlers
    ['xmin', 'xmax', 'ymin', 'ymax'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateAllSurfaces);
    });

    document.getElementById('resolution').addEventListener('input', (e) => {
        document.getElementById('res-value').textContent = e.target.value;
    });

    document.getElementById('resolution').addEventListener('change', updateAllSurfaces);

    // Opacity slider
    document.getElementById('surface-opacity').addEventListener('input', (e) => {
        document.getElementById('opacity-value').textContent = e.target.value + '%';
    });

    // Shininess slider
    document.getElementById('surface-shininess').addEventListener('input', (e) => {
        document.getElementById('shininess-value').textContent = e.target.value;
    });

    // Rotation speed slider
    document.getElementById('rotation-speed').addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('rotation-speed-value').textContent = (value / 5).toFixed(1) + 'x';
        rotationSpeed = 0.001 * value;
    });

    // Animation loop
    animate();
}

function addEquation() {
    const id = equationIdCounter++;
    const color = colorPalette[id % colorPalette.length];
    
    const equation = {
        id: id,
        expression: '',
        color: color,
        visible: true,
        mesh: null
    };
    
    equations.push(equation);
    
    const container = document.getElementById('equations-container');
    const eqCard = createEquationCard(equation);
    container.appendChild(eqCard);
    
    // Focus on the new equation input
    const input = eqCard.querySelector('.equation-input');
    input.focus();
    activeEquationId = id;
    
    updateSurfaceCount();
}

function createEquationCard(equation) {
    const card = document.createElement('div');
    card.className = 'equation-card';
    card.dataset.id = equation.id;
    
    card.innerHTML = `
        <div class="equation-card-header">
            <button class="color-indicator" style="background: ${equation.color}" 
                    onclick="toggleEquationVisibility(${equation.id})" 
                    title="Toggle visibility">
            </button>
            <button class="btn-icon-small" onclick="deleteEquation(${equation.id})" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="equation-input-wrapper">
            <input type="text" 
                   class="equation-input" 
                   placeholder="z = f(x, y)" 
                   value="${equation.expression}"
                   onfocus="setActiveEquation(${equation.id})"
                   oninput="handleEquationInput(${equation.id}, this.value)"
                   onkeydown="handleEquationKeydown(event, ${equation.id})">
            <div class="equation-error" id="error-${equation.id}"></div>
        </div>
    `;
    
    return card;
}

function setActiveEquation(id) {
    activeEquationId = id;
    document.querySelectorAll('.equation-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`.equation-card[data-id="${id}"]`).classList.add('active');
}

function handleEquationInput(id, value) {
    const equation = equations.find(eq => eq.id === id);
    if (equation) {
        // Store the raw value
        equation.expression = value;
        handleAutocomplete(document.querySelector(`.equation-card[data-id="${id}"] .equation-input`));
    }
}

function handleEquationKeydown(event, id) {
    if (event.key === 'Enter') {
        event.preventDefault();
        updateEquationSurface(id);
    } else if (event.key === 'Tab') {
        event.preventDefault();
        if (currentSuggestions.length > 0) {
            const index = autocompleteIndex >= 0 ? autocompleteIndex : 0;
            applySuggestion(currentSuggestions[index], id);
        }
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (currentSuggestions.length > 0) {
            autocompleteIndex = Math.min(autocompleteIndex + 1, currentSuggestions.length - 1);
            updateAutocompleteDisplay();
        }
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (currentSuggestions.length > 0) {
            autocompleteIndex = Math.max(autocompleteIndex - 1, 0);
            updateAutocompleteDisplay();
        }
    } else if (event.key === 'Escape') {
        hideAutocomplete();
    }
}

function deleteEquation(id) {
    const equation = equations.find(eq => eq.id === id);
    if (equation && equation.mesh) {
        scene.remove(equation.mesh);
    }
    
    equations = equations.filter(eq => eq.id !== id);
    
    const card = document.querySelector(`.equation-card[data-id="${id}"]`);
    if (card) {
        card.remove();
    }
    
    updateSurfaceCount();
}

function toggleEquationVisibility(id) {
    const equation = equations.find(eq => eq.id === id);
    if (equation) {
        equation.visible = !equation.visible;
        if (equation.mesh) {
            equation.mesh.visible = equation.visible;
        }
        
        const colorBtn = document.querySelector(`.equation-card[data-id="${id}"] .color-indicator`);
        if (colorBtn) {
            colorBtn.style.opacity = equation.visible ? '1' : '0.3';
        }
    }
}

function updateEquationSurface(id) {
    const equation = equations.find(eq => eq.id === id);
    if (!equation) return;
    
    const input = document.querySelector(`.equation-card[data-id="${id}"] .equation-input`);
    const errorDiv = document.getElementById(`error-${id}`);
    
    input.classList.remove('input-error');
    errorDiv.textContent = '';
    
    if (!equation.expression.trim()) {
        if (equation.mesh) {
            scene.remove(equation.mesh);
            equation.mesh = null;
        }
        updateStats();
        return;
    }
    
    try {
        // Test the evaluator first with multiple test points
        const testEval = createEvaluator(equation.expression);
        
        // Test with several points to ensure validity
        const testPoints = [[0, 0], [1, 1], [-1, -1], [0.5, 0.5]];
        let validResults = 0;
        
        for (const [tx, ty] of testPoints) {
            try {
                const result = testEval(tx, ty);
                if (isFinite(result)) {
                    validResults++;
                }
            } catch (e) {
                // Point failed, but that's ok if some points work
            }
        }
        
        // Need at least one valid result
        if (validResults === 0) {
            throw new Error('Expression produces no valid values');
        }
        
        // Remove old mesh
        if (equation.mesh) {
            scene.remove(equation.mesh);
        }
        
        // Create surface
        const surface = createSurface(equation.expression, equation.color);
        equation.mesh = surface;
        scene.add(surface);
        
        updateStats();
    } catch (error) {
        input.classList.add('input-error');
        const errorMessage = error.message || 'Invalid expression';
        errorDiv.textContent = errorMessage;
        console.error('Expression error for equation', id, ':', error);
    }
}

function createSurface(expression, color) {
    const xmin = parseFloat(document.getElementById('xmin').value);
    const xmax = parseFloat(document.getElementById('xmax').value);
    const ymin = parseFloat(document.getElementById('ymin').value);
    const ymax = parseFloat(document.getElementById('ymax').value);
    const resolution = parseInt(document.getElementById('resolution').value);
    
    const geometry = new THREE.PlaneGeometry(
        xmax - xmin,
        ymax - ymin,
        resolution,
        resolution
    );
    
    const positions = geometry.attributes.position;
    const evaluator = createEvaluator(expression);
    
    // Create colors for height gradient
    const colors = new Float32Array(positions.count * 3);
    let minZ = Infinity;
    let maxZ = -Infinity;
    
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        
        const actualX = xmin + (x / (xmax - xmin) + 0.5) * (xmax - xmin);
        const actualY = ymin + (y / (ymax - ymin) + 0.5) * (ymax - ymin);
        
        try {
            const z = evaluator(actualX, actualY);
            if (isFinite(z)) {
                positions.setZ(i, z);
                minZ = Math.min(minZ, z);
                maxZ = Math.max(maxZ, z);
            } else {
                positions.setZ(i, 0);
            }
        } catch (e) {
            positions.setZ(i, 0);
        }
    }
    
    // Apply color mapping
    if (colorMode === 'height' || colorMode === 'rainbow' || colorMode === 'cool-warm') {
        for (let i = 0; i < positions.count; i++) {
            const z = positions.getZ(i);
            const t = maxZ !== minZ ? (z - minZ) / (maxZ - minZ) : 0.5;
            
            let r, g, b;
            if (colorMode === 'height') {
                const baseColor = new THREE.Color(color);
                r = baseColor.r * (0.5 + t * 0.5);
                g = baseColor.g * (0.5 + t * 0.5);
                b = baseColor.b * (0.5 + t * 0.5);
            } else if (colorMode === 'rainbow') {
                const hue = t * 0.7; // 0 to 0.7 (red to blue)
                const col = new THREE.Color().setHSL(hue, 1, 0.5);
                r = col.r;
                g = col.g;
                b = col.b;
            } else { // cool-warm
                r = t;
                g = 0.5;
                b = 1 - t;
            }
            
            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    
    // Ensure geometry is properly indexed
    if (!geometry.index) {
        geometry = geometry.toNonIndexed();
    }
    
    geometry.computeVertexNormals();
    positions.needsUpdate = true;
    
    // Create material based on settings
    let material;
    if (renderMode === 'points') {
        material = new THREE.PointsMaterial({
            color: new THREE.Color(color),
            size: 0.1,
            vertexColors: colorMode !== 'solid'
        });
        return new THREE.Points(geometry, material);
    } else if (renderMode === 'wireframe') {
        material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            wireframe: true,
            transparent: surfaceOpacity < 1,
            opacity: surfaceOpacity,
            vertexColors: colorMode !== 'solid'
        });
    } else {
        material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color),
            shininess: surfaceShininess,
            side: THREE.DoubleSide,
            flatShading: !smoothShading,
            transparent: surfaceOpacity < 1,
            opacity: surfaceOpacity,
            vertexColors: colorMode !== 'solid'
        });
        
        if (renderMode === 'both') {
            const mesh = new THREE.Mesh(geometry, material);
            const wireframe = new THREE.LineSegments(
                new THREE.WireframeGeometry(geometry),
                new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true })
            );
            mesh.add(wireframe);
            return mesh;
        }
    }
    
    return new THREE.Mesh(geometry, material);
}

function preprocessExpression(expr) {
    // Normalize the expression
    expr = expr.trim();
    
    // Replace unicode superscripts with ^ notation
    const superscripts = {'²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9'};
    for (const [sup, pow] of Object.entries(superscripts)) {
        expr = expr.replace(new RegExp(sup, 'g'), pow);
    }
    
    return expr;
}

function createEvaluator(expression) {
    let expr = preprocessExpression(expression);
    
    // Step 1: Replace constants
    expr = expr.replace(/π/g, 'Math.PI');
    expr = expr.replace(/÷/g, '/');
    expr = expr.replace(/×/g, '*');
    
    // Step 2: Handle square root - convert √ to Math.sqrt
    // √(expression) -> Math.sqrt(expression)
    expr = expr.replace(/√/g, 'Math.sqrt');
    
    // If sqrt doesn't have parentheses, we need to add them
    // But Math.sqrt without () is fine as a reference
    
    // Step 3: Handle 'e' constant - only standalone, not in 'exp'
    // Replace 'e' that's not part of a word
    expr = expr.replace(/\be\b/g, 'Math.E');
    
    // Step 4: Replace math function names with Math.xxx
    const functions = {
        'sin': 'Math.sin',
        'cos': 'Math.cos', 
        'tan': 'Math.tan',
        'asin': 'Math.asin',
        'acos': 'Math.acos',
        'atan': 'Math.atan',
        'exp': 'Math.exp',
        'ln': 'Math.log',
        'log': 'Math.log',
        'abs': 'Math.abs',
        'sqrt': 'Math.sqrt'
    };
    
    for (const [fn, mathFn] of Object.entries(functions)) {
        // Only replace if not already Math.xxx
        const parts = expr.split('Math.' + fn);
        if (parts.length === 1) {
            // No Math.xxx found, safe to replace
            const regex = new RegExp('\\b' + fn + '\\b', 'g');
            expr = expr.replace(regex, mathFn);
        }
    }
    
    // Step 5: Handle implicit multiplication
    // Must be done carefully after function replacement
    
    // 5a. Number followed by letter: 2x, 3y, 5sin -> 2*x, 3*y, 5*sin
    // But not 1e5 or similar scientific notation
    expr = expr.replace(/(\d)([a-zA-Z])/g, (match, num, letter, offset) => {
        // Check if this is scientific notation (1e5, 2e-3)
        if (letter === 'e' || letter === 'E') {
            const after = expr[offset + match.length];
            if (after === '+' || after === '-' || /\d/.test(after)) {
                return match; // Keep as is
            }
        }
        return num + '*' + letter;
    });
    
    // 5b. Number followed by opening paren: 2(x+1) -> 2*(x+1)
    expr = expr.replace(/(\d)\(/g, '$1*(');
    
    // 5c. Closing paren followed by opening paren: )(  -> )*(
    expr = expr.replace(/\)\(/g, ')*(');
    
    // 5d. Closing paren followed by number: )2 -> )*2
    expr = expr.replace(/\)(\d)/g, ')*$1');
    
    // 5e. Closing paren followed by letter (variable or function): )x, )sin -> )*x, )*sin
    expr = expr.replace(/\)([a-zA-Z])/g, ')*$1');
    
    // 5f. Variable followed by opening paren: x( -> x*(
    expr = expr.replace(/([xy])\(/g, '$1*(');
    
    // 5g. Variable followed by variable: xy -> x*y (but allow whitespace)
    expr = expr.replace(/([xy])([xy])/g, '$1*$2');
    
    // Step 6: Convert ^ to **
    expr = expr.replace(/\^/g, '**');
    
    // Step 7: Build and test the function
    try {
        const func = new Function('x', 'y', `
            'use strict';
            try {
                const result = ${expr};
                return result;
            } catch (e) {
                return NaN;
            }
        `);
        
        // Test the function
        const testVal = func(1, 1);
        if (testVal === undefined) {
            throw new Error('Function returns undefined');
        }
        
        return func;
    } catch (error) {
        console.error('Parse error:', error);
        console.error('Original:', expression);
        console.error('Processed:', expr);
        throw new Error('Invalid mathematical expression');
    }
}

function updateAllSurfaces() {
    equations.forEach(eq => {
        if (eq.expression) {
            updateEquationSurface(eq.id);
        }
    });
}

// Autocomplete functionality
function setupGlobalAutocomplete() {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.equation-input') && !e.target.closest('.autocomplete-dropdown')) {
            hideAutocomplete();
        }
    });
}

function handleAutocomplete(input) {
    const value = input.value;
    const cursorPos = input.selectionStart;
    const beforeCursor = value.substring(0, cursorPos);
    const match = beforeCursor.match(/[a-zA-Z]+$/);
    
    if (!match) {
        hideAutocomplete();
        return;
    }
    
    const currentWord = match[0].toLowerCase();
    const matches = functionSuggestions.filter(s => 
        s.trigger.startsWith(currentWord)
    );
    
    if (matches.length > 0) {
        currentSuggestions = matches;
        autocompleteIndex = 0;
        showAutocomplete(matches, input);
    } else {
        hideAutocomplete();
    }
}

function showAutocomplete(suggestions, input) {
    const dropdown = document.getElementById('autocomplete');
    dropdown.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        if (index === autocompleteIndex) {
            item.classList.add('active');
        }
        item.textContent = suggestion.display;
        item.addEventListener('click', () => applySuggestion(suggestion, activeEquationId));
        dropdown.appendChild(item);
    });
    
    // Position dropdown
    const rect = input.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${rect.width}px`;
    dropdown.classList.add('show');
}

function updateAutocompleteDisplay() {
    const items = document.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
        item.classList.toggle('active', index === autocompleteIndex);
    });
}

function hideAutocomplete() {
    const dropdown = document.getElementById('autocomplete');
    dropdown.classList.remove('show');
    currentSuggestions = [];
    autocompleteIndex = -1;
}

function applySuggestion(suggestion, equationId) {
    const input = document.querySelector(`.equation-card[data-id="${equationId}"] .equation-input`);
    const value = input.value;
    const cursorPos = input.selectionStart;
    const beforeCursor = value.substring(0, cursorPos);
    const afterCursor = value.substring(cursorPos);
    const match = beforeCursor.match(/[a-zA-Z]+$/);
    
    if (match) {
        const wordStart = cursorPos - match[0].length;
        const newValue = value.substring(0, wordStart) + suggestion.suggestion + afterCursor;
        input.value = newValue;
        
        const equation = equations.find(eq => eq.id === equationId);
        if (equation) {
            equation.expression = newValue;
        }
        
        const newCursorPos = wordStart + suggestion.suggestion.length - suggestion.cursorOffset;
        input.setSelectionRange(newCursorPos, newCursorPos);
    }
    
    hideAutocomplete();
    input.focus();
}

// Function keyboard
function insertAtActive(text, cursorOffset = 0) {
    if (activeEquationId === null) return;
    
    const input = document.querySelector(`.equation-card[data-id="${activeEquationId}"] .equation-input`);
    if (!input) return;
    
    const cursorPos = input.selectionStart;
    const value = input.value;
    const newValue = value.substring(0, cursorPos) + text + value.substring(cursorPos);
    
    input.value = newValue;
    const equation = equations.find(eq => eq.id === activeEquationId);
    if (equation) {
        equation.expression = newValue;
    }
    
    const newCursorPos = cursorPos + text.length - cursorOffset;
    input.setSelectionRange(newCursorPos, newCursorPos);
    input.focus();
}

// UI toggles
function toggleKeyboard() {
    const content = document.getElementById('keyboard-content');
    const section = content.closest('.section');
    section.classList.toggle('collapsed');
}

function toggleSection(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const section = content.closest('.section');
    section.classList.toggle('collapsed');
}

function toggleRightPanel() {
    const panel = document.getElementById('right-panel');
    const container = document.querySelector('.app-container');
    
    panel.classList.toggle('hidden');
    container.classList.toggle('right-panel-hidden');
    
    // Trigger resize to adjust canvas
    setTimeout(() => {
        onWindowResize();
    }, 300);
}

// Presets
function loadPreset(equation, color) {
    addEquation();
    const lastEquation = equations[equations.length - 1];
    lastEquation.expression = equation;
    lastEquation.color = color;
    
    const card = document.querySelector(`.equation-card[data-id="${lastEquation.id}"]`);
    const input = card.querySelector('.equation-input');
    const colorBtn = card.querySelector('.color-indicator');
    
    input.value = equation;
    colorBtn.style.background = color;
    
    updateEquationSurface(lastEquation.id);
}

// ===== RIGHT PANEL FEATURES =====

// Surface Analysis
function analyzeSurface() {
    if (activeEquationId === null) {
        alert('Please select an equation first');
        return;
    }
    
    const equation = equations.find(eq => eq.id === activeEquationId);
    if (!equation || !equation.mesh) {
        alert('Please create a surface first');
        return;
    }
    
    const geometry = equation.mesh.geometry;
    const positions = geometry.attributes.position;
    
    // Calculate statistics
    let minZ = Infinity, maxZ = -Infinity;
    let volume = 0;
    let surfaceArea = 0;
    
    const xmin = parseFloat(document.getElementById('xmin').value);
    const xmax = parseFloat(document.getElementById('xmax').value);
    const ymin = parseFloat(document.getElementById('ymin').value);
    const ymax = parseFloat(document.getElementById('ymax').value);
    
    for (let i = 0; i < positions.count; i++) {
        const z = positions.getZ(i);
        if (isFinite(z)) {
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
            volume += z;
        }
    }
    
    const dx = (xmax - xmin) / Math.sqrt(positions.count);
    const dy = (ymax - ymin) / Math.sqrt(positions.count);
    volume = volume * dx * dy;
    
    // Approximate surface area using triangles
    let surfaceAreaCalc = geometry.clone();
    if (!surfaceAreaCalc.index) {
        surfaceAreaCalc = surfaceAreaCalc.toNonIndexed();
        const indices = [];
        for (let i = 0; i < positions.count; i++) {
            indices.push(i);
        }
        surfaceAreaCalc.setIndex(indices);
    }
    
    const index = surfaceAreaCalc.index;
    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            const i1 = index.getX ? index.getX(i) : index.array[i];
            const i2 = index.getX ? index.getX(i + 1) : index.array[i + 1];
            const i3 = index.getX ? index.getX(i + 2) : index.array[i + 2];
            
            const a = new THREE.Vector3(
                positions.getX(i1),
                positions.getY(i1),
                positions.getZ(i1)
            );
            const b = new THREE.Vector3(
                positions.getX(i2),
                positions.getY(i2),
                positions.getZ(i2)
            );
            const c = new THREE.Vector3(
                positions.getX(i3),
                positions.getY(i3),
                positions.getZ(i3)
            );
            
            const ab = new THREE.Vector3().subVectors(b, a);
            const ac = new THREE.Vector3().subVectors(c, a);
            const cross = new THREE.Vector3().crossVectors(ab, ac);
            surfaceArea += cross.length() / 2;
        }
    }
    
    // Update display
    document.getElementById('surface-area').textContent = surfaceArea.toFixed(2);
    document.getElementById('surface-volume').textContent = volume.toFixed(2);
    document.getElementById('z-range').textContent = `${minZ.toFixed(2)} to ${maxZ.toFixed(2)}`;
}

function toggleCriticalPoints() {
    const checkbox = document.getElementById('show-critical-points');
    
    // Clear existing markers
    criticalPointMarkers.forEach(marker => scene.remove(marker));
    criticalPointMarkers = [];
    
    if (!checkbox.checked) return;
    
    if (activeEquationId === null) {
        alert('Please select an equation first');
        checkbox.checked = false;
        return;
    }
    
    const equation = equations.find(eq => eq.id === activeEquationId);
    if (!equation || !equation.mesh) {
        alert('Please create a surface first');
        checkbox.checked = false;
        return;
    }
    
    try {
        // Find approximate critical points (simplified approach)
        const geometry = equation.mesh.geometry;
        const positions = geometry.attributes.position;
        
        // Find high and low points
        let minZ = Infinity, maxZ = -Infinity;
        let minIdx = 0, maxIdx = 0;
        
        for (let i = 0; i < positions.count; i++) {
            const z = positions.getZ(i);
            if (isFinite(z)) {
                if (z < minZ) {
                    minZ = z;
                    minIdx = i;
                }
                if (z > maxZ) {
                    maxZ = z;
                    maxIdx = i;
                }
            }
        }
        
        // Add markers
        const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        
        if (isFinite(minZ)) {
            const minMarker = new THREE.Mesh(
                markerGeometry,
                new THREE.MeshBasicMaterial({ color: 0x0000ff })
            );
            minMarker.position.set(
                positions.getX(minIdx),
                positions.getY(minIdx),
                positions.getZ(minIdx)
            );
            scene.add(minMarker);
            criticalPointMarkers.push(minMarker);
        }
        
        if (isFinite(maxZ) && maxIdx !== minIdx) {
            const maxMarker = new THREE.Mesh(
                markerGeometry,
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            maxMarker.position.set(
                positions.getX(maxIdx),
                positions.getY(maxIdx),
                positions.getZ(maxIdx)
            );
            scene.add(maxMarker);
            criticalPointMarkers.push(maxMarker);
        }
    } catch (error) {
        console.error('Error finding critical points:', error);
        checkbox.checked = false;
    }
}

function toggleContours() {
    const checkbox = document.getElementById('show-contours');
    
    // Clear existing contours
    contourLines.forEach(line => scene.remove(line));
    contourLines = [];
    
    if (!checkbox.checked) return;
    
    // Implementation would create contour lines
    // This is a placeholder for the feature
    console.log('Contour lines feature - advanced implementation needed');
}

function toggleNormals() {
    const checkbox = document.getElementById('show-normals');
    
    // Clear existing normals
    normalVectors.forEach(normal => scene.remove(normal));
    normalVectors = [];
    
    if (!checkbox.checked) return;
    
    if (activeEquationId === null) {
        alert('Please select an equation first');
        checkbox.checked = false;
        return;
    }
    
    const equation = equations.find(eq => eq.id === activeEquationId);
    if (!equation || !equation.mesh) {
        alert('Please create a surface first');
        checkbox.checked = false;
        return;
    }
    
    try {
        const geometry = equation.mesh.geometry;
        const positions = geometry.attributes.position;
        
        // Compute normals if not already present
        if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
        }
        
        const normals = geometry.attributes.normal;
        
        // Sample normals (show every 15th for better performance)
        const step = Math.max(15, Math.floor(positions.count / 200));
        
        for (let i = 0; i < positions.count; i += step) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            if (!isFinite(x) || !isFinite(y) || !isFinite(z)) continue;
            
            const origin = new THREE.Vector3(x, y, z);
            
            const nx = normals.getX(i);
            const ny = normals.getY(i);
            const nz = normals.getZ(i);
            
            if (!isFinite(nx) || !isFinite(ny) || !isFinite(nz)) continue;
            
            const direction = new THREE.Vector3(nx, ny, nz).normalize();
            
            const arrow = new THREE.ArrowHelper(
                direction,
                origin,
                0.5,
                0xffff00,
                0.2,
                0.1
            );
            
            scene.add(arrow);
            normalVectors.push(arrow);
        }
    } catch (error) {
        console.error('Error displaying normals:', error);
        checkbox.checked = false;
    }
}

// Visualization
function changeRenderMode() {
    renderMode = document.getElementById('render-mode').value;
    // Store current states
    const currentExpressions = equations.map(eq => ({
        id: eq.id,
        expression: eq.expression,
        color: eq.color,
        visible: eq.visible
    }));
    
    // Recreate all surfaces with new render mode
    currentExpressions.forEach(eqData => {
        if (eqData.expression) {
            updateEquationSurface(eqData.id);
        }
    });
}

function changeColorMode() {
    colorMode = document.getElementById('color-mode').value;
    // Store current states
    const currentExpressions = equations.map(eq => ({
        id: eq.id,
        expression: eq.expression,
        color: eq.color,
        visible: eq.visible
    }));
    
    // Recreate all surfaces with new color mode
    currentExpressions.forEach(eqData => {
        if (eqData.expression) {
            updateEquationSurface(eqData.id);
        }
    });
}

function changeSurfaceOpacity() {
    surfaceOpacity = parseFloat(document.getElementById('surface-opacity').value) / 100;
    equations.forEach(eq => {
        if (eq.mesh && eq.mesh.material) {
            eq.mesh.material.opacity = surfaceOpacity;
            eq.mesh.material.transparent = surfaceOpacity < 1;
            eq.mesh.material.needsUpdate = true;
        }
    });
}

function changeSurfaceShininess() {
    surfaceShininess = parseFloat(document.getElementById('surface-shininess').value);
    equations.forEach(eq => {
        if (eq.mesh && eq.mesh.material && eq.mesh.material.shininess !== undefined) {
            eq.mesh.material.shininess = surfaceShininess;
            eq.mesh.material.needsUpdate = true;
        }
    });
}

function toggleSmoothShading() {
    smoothShading = document.getElementById('smooth-shading').checked;
    // Store current states
    const currentExpressions = equations.map(eq => ({
        id: eq.id,
        expression: eq.expression,
        color: eq.color,
        visible: eq.visible
    }));
    
    // Recreate all surfaces with new shading
    currentExpressions.forEach(eqData => {
        if (eqData.expression) {
            updateEquationSurface(eqData.id);
        }
    });
}

// Animation
function toggleAutoRotate() {
    autoRotate = document.getElementById('auto-rotate').checked;
}

function changeRotationSpeed() {
    const value = document.getElementById('rotation-speed').value;
    rotationSpeed = 0.001 * value;
}

function startAnimation() {
    isAnimating = true;
}

function stopAnimation() {
    isAnimating = false;
}

// Point Evaluation
function evaluatePoint() {
    if (activeEquationId === null) {
        alert('Please select an equation first');
        return;
    }
    
    const equation = equations.find(eq => eq.id === activeEquationId);
    if (!equation || !equation.expression) {
        alert('Please create an equation first');
        return;
    }
    
    const x = parseFloat(document.getElementById('eval-x').value);
    const y = parseFloat(document.getElementById('eval-y').value);
    
    if (isNaN(x) || isNaN(y)) {
        document.getElementById('eval-z-value').textContent = 'Invalid input';
        return;
    }
    
    try {
        const evaluator = createEvaluator(equation.expression);
        const z = evaluator(x, y);
        
        if (isFinite(z)) {
            document.getElementById('eval-z-value').textContent = z.toFixed(4);
            
            // Update marker if visible
            if (document.getElementById('show-marker').checked) {
                updateEvaluationMarker(x, y, z);
            }
        } else {
            document.getElementById('eval-z-value').textContent = 'Undefined';
        }
    } catch (error) {
        document.getElementById('eval-z-value').textContent = 'Error';
        console.error('Evaluation error:', error);
    }
}

function toggleMarker() {
    const checkbox = document.getElementById('show-marker').checked;
    
    if (!checkbox && evaluationMarker) {
        scene.remove(evaluationMarker);
        evaluationMarker = null;
        return;
    }
    
    if (checkbox) {
        const xVal = document.getElementById('eval-x').value;
        const yVal = document.getElementById('eval-y').value;
        if (xVal && yVal) {
            evaluatePoint();
        }
    }
}

function updateEvaluationMarker(x, y, z) {
    if (evaluationMarker) {
        scene.remove(evaluationMarker);
        evaluationMarker = null;
    }
    
    if (!isFinite(z)) return;
    
    const markerGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    evaluationMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    evaluationMarker.position.set(x, y, z);
    scene.add(evaluationMarker);
}

// Export Functions
function exportScreenshot() {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = 'graphspace-' + Date.now() + '.png';
    link.href = dataURL;
    link.click();
}

function exportSTL() {
    if (equations.length === 0 || !equations.some(eq => eq.mesh)) {
        alert('Please create at least one surface first');
        return;
    }
    
    // Simple STL export
    let stlString = 'solid GraphSpace\n';
    
    equations.forEach(eq => {
        if (!eq.mesh || !eq.mesh.geometry) return;
        
        let geometry = eq.mesh.geometry;
        const positions = geometry.attributes.position;
        
        // Ensure geometry has index
        if (!geometry.index) {
            geometry = geometry.clone();
            const indices = [];
            for (let i = 0; i < positions.count; i++) {
                indices.push(i);
            }
            geometry.setIndex(indices);
        }
        
        const index = geometry.index;
        if (!index) return;
        
        for (let i = 0; i < index.count; i += 3) {
            const i1 = index.getX ? index.getX(i) : index.array[i];
            const i2 = index.getX ? index.getX(i + 1) : index.array[i + 1];
            const i3 = index.getX ? index.getX(i + 2) : index.array[i + 2];
            
            const v1 = new THREE.Vector3(
                positions.getX(i1),
                positions.getY(i1),
                positions.getZ(i1)
            );
            const v2 = new THREE.Vector3(
                positions.getX(i2),
                positions.getY(i2),
                positions.getZ(i2)
            );
            const v3 = new THREE.Vector3(
                positions.getX(i3),
                positions.getY(i3),
                positions.getZ(i3)
            );
            
            const normal = new THREE.Vector3();
            const cb = new THREE.Vector3();
            const ab = new THREE.Vector3();
            
            cb.subVectors(v3, v2);
            ab.subVectors(v1, v2);
            cb.cross(ab);
            cb.normalize();
            
            stlString += `  facet normal ${cb.x} ${cb.y} ${cb.z}\n`;
            stlString += `    outer loop\n`;
            stlString += `      vertex ${v1.x} ${v1.y} ${v1.z}\n`;
            stlString += `      vertex ${v2.x} ${v2.y} ${v2.z}\n`;
            stlString += `      vertex ${v3.x} ${v3.y} ${v3.z}\n`;
            stlString += `    endloop\n`;
            stlString += `  endfacet\n`;
        }
    });
    
    stlString += 'endsolid GraphSpace\n';
    
    const blob = new Blob([stlString], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = 'graphspace-' + Date.now() + '.stl';
    link.href = URL.createObjectURL(blob);
    link.click();
}

function exportData() {
    if (equations.length === 0 || !equations.some(eq => eq.mesh)) {
        alert('Please create at least one surface first');
        return;
    }
    
    let csvString = 'Equation,X,Y,Z\n';
    
    const xmin = parseFloat(document.getElementById('xmin').value);
    const xmax = parseFloat(document.getElementById('xmax').value);
    const ymin = parseFloat(document.getElementById('ymin').value);
    const ymax = parseFloat(document.getElementById('ymax').value);
    const resolution = parseInt(document.getElementById('resolution').value);
    
    equations.forEach(eq => {
        if (!eq.mesh || !eq.mesh.geometry) return;
        
        const geometry = eq.mesh.geometry;
        const positions = geometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            csvString += `"${eq.expression}",${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}\n`;
        }
    });
    
    const blob = new Blob([csvString], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = 'graphspace-data-' + Date.now() + '.csv';
    link.href = URL.createObjectURL(blob);
    link.click();
}

function exportEquations() {
    const data = {
        equations: equations.map(eq => ({
            expression: eq.expression,
            color: eq.color,
            visible: eq.visible
        })),
        settings: {
            xmin: document.getElementById('xmin').value,
            xmax: document.getElementById('xmax').value,
            ymin: document.getElementById('ymin').value,
            ymax: document.getElementById('ymax').value,
            resolution: document.getElementById('resolution').value
        }
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'graphspace-equations-' + Date.now() + '.json';
    link.href = URL.createObjectURL(blob);
    link.click();
}

// Camera Presets
function setCameraView(view) {
    const distance = 15;
    
    switch(view) {
        case 'front':
            camera.position.set(0, 0, distance);
            break;
        case 'back':
            camera.position.set(0, 0, -distance);
            break;
        case 'top':
            camera.position.set(0, distance, 0);
            break;
        case 'bottom':
            camera.position.set(0, -distance, 0);
            break;
        case 'left':
            camera.position.set(-distance, 0, 0);
            break;
        case 'right':
            camera.position.set(distance, 0, 0);
            break;
        case 'isometric':
            camera.position.set(distance * 0.7, distance * 0.7, distance * 0.7);
            break;
    }
    
    camera.lookAt(0, 0, 0);
}

// Camera and scene controls
function setupControls() {
    const canvas = renderer.domElement;
    let isDragging = false;
    let isShiftDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        isShiftDragging = e.shiftKey;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        if (isShiftDragging) {
            const panSpeed = 0.01;
            camera.position.x -= deltaX * panSpeed;
            camera.position.y += deltaY * panSpeed;
        } else {
            const rotateSpeed = 0.005;
            const phi = Math.atan2(camera.position.z, camera.position.x);
            const theta = Math.acos(camera.position.y / Math.sqrt(
                camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2
            ));
            
            const newPhi = phi - deltaX * rotateSpeed;
            const newTheta = Math.max(0.1, Math.min(Math.PI - 0.1, theta + deltaY * rotateSpeed));
            
            const radius = Math.sqrt(
                camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2
            );
            
            camera.position.x = radius * Math.sin(newTheta) * Math.cos(newPhi);
            camera.position.y = radius * Math.cos(newTheta);
            camera.position.z = radius * Math.sin(newTheta) * Math.sin(newPhi);
            camera.lookAt(0, 0, 0);
        }
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.1;
        const radius = Math.sqrt(
            camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2
        );
        const newRadius = Math.max(3, Math.min(50, radius + e.deltaY * zoomSpeed * 0.01));
        const scale = newRadius / radius;
        
        camera.position.multiplyScalar(scale);
    });
}

function resetCamera() {
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
}

function toggleGrid() {
    showGrid = !showGrid;
    gridHelper.visible = showGrid;
}

function toggleAxes() {
    showAxes = !showAxes;
    axesHelper.visible = showAxes;
}

function updateStats() {
    const resolution = parseInt(document.getElementById('resolution').value);
    const pointsPerSurface = (resolution + 1) ** 2;
    const totalPoints = equations.filter(eq => eq.mesh).length * pointsPerSurface;
    
    document.getElementById('stat-points').textContent = totalPoints.toLocaleString();
}

function updateSurfaceCount() {
    const count = equations.length;
    document.getElementById('stat-surfaces').textContent = count;
}

function onWindowResize() {
    const container = renderer.domElement.parentElement;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Auto-rotate camera
    if (autoRotate) {
        const radius = Math.sqrt(
            camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2
        );
        const phi = Math.atan2(camera.position.z, camera.position.x);
        const theta = Math.acos(camera.position.y / radius);
        
        const newPhi = phi + rotationSpeed;
        
        camera.position.x = radius * Math.sin(theta) * Math.cos(newPhi);
        camera.position.z = radius * Math.sin(theta) * Math.sin(newPhi);
        camera.lookAt(0, 0, 0);
    }
    
    // Animation effects
    if (isAnimating) {
        animationTime += 0.01;
        const animationType = document.getElementById('animation-type').value;
        
        equations.forEach(eq => {
            if (!eq.mesh) return;
            
            switch(animationType) {
                case 'wave':
                    eq.mesh.position.z = Math.sin(animationTime) * 0.5;
                    break;
                case 'pulse':
                    const scale = 1 + Math.sin(animationTime * 2) * 0.1;
                    eq.mesh.scale.set(scale, scale, scale);
                    break;
                case 'morph':
                    eq.mesh.rotation.y = animationTime * 0.5;
                    break;
            }
        });
    }
    
    renderer.render(scene, camera);
}

// Initialize
init();
