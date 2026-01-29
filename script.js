// Three.js Setup
let scene, camera, renderer;
let showGrid = true;
let showAxes = true;
let gridHelper, axesHelper;
let currentZoomLevel = 1.0;  // Track zoom level for dynamic axis scaling

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
let axisOrientation = 'y-up'; // 'y-up' or 'z-up'

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

// Toast notification system
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            ${type === 'error' ? '⚠️' : type === 'success' ? '✓' : 'ℹ️'}
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

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

    // Grid with dynamic sizing
    updateGridAndAxes();

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

// Update grid and axes based on zoom level
function updateGridAndAxes() {
    // Remove existing grid and axes
    if (gridHelper) scene.remove(gridHelper);
    if (axesHelper) scene.remove(axesHelper);
    
    // Calculate appropriate size based on zoom level
    const baseSize = 20;
    const gridSize = baseSize * currentZoomLevel;
    const gridDivisions = Math.max(10, Math.min(40, Math.round(20 * currentZoomLevel)));
    
    // Create new grid with dynamic size
    gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x2a2a3f, 0x1a1a2f);
    gridHelper.visible = showGrid;
    scene.add(gridHelper);
    
    // Create new axes with dynamic size
    const axesSize = Math.max(5, 8 * currentZoomLevel);
    axesHelper = new THREE.AxesHelper(axesSize);
    axesHelper.visible = showAxes;
    scene.add(axesHelper);
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

function updateEquationSurface(id) {
    const equation = equations.find(eq => eq.id === id);
    if (!equation) return;
    
    const errorDiv = document.getElementById(`error-${id}`);
    const input = document.querySelector(`.equation-card[data-id="${id}"] .equation-input`);
    
    try {
        // Remove old mesh
        if (equation.mesh) {
            scene.remove(equation.mesh);
            equation.mesh.geometry.dispose();
            equation.mesh.material.dispose();
        }
        
        // Create new surface
        const mesh = createSurface(equation.expression, equation.color);
        equation.mesh = mesh;
        scene.add(mesh);
        
        // Clear error
        input.classList.remove('input-error');
        errorDiv.textContent = '';
        
        updateStats();
    } catch (error) {
        input.classList.add('input-error');
        errorDiv.textContent = error.message || 'Invalid expression';
    }
}

function createSurface(expression, color) {
    const xmin = parseFloat(document.getElementById('xmin').value);
    const xmax = parseFloat(document.getElementById('xmax').value);
    const ymin = parseFloat(document.getElementById('ymin').value);
    const ymax = parseFloat(document.getElementById('ymax').value);
    const resolution = parseInt(document.getElementById('resolution').value);
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const colors = [];
    
    // Generate vertices
    let minZ = Infinity;
    let maxZ = -Infinity;
    
    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            const x = xmin + (xmax - xmin) * i / resolution;
            const y = ymin + (ymax - ymin) * j / resolution;
            const z = evaluateExpression(expression, x, y);
            
            // Handle invalid values (NaN, Infinity)
            const validZ = isFinite(z) ? z : 0;
            
            // Position vertices based on axis orientation
            if (axisOrientation === 'z-up') {
                // Z-up: x, y are horizontal, z is vertical
                vertices.push(x, y, validZ);
            } else {
                // Y-up (default): x, z are horizontal, y is vertical
                vertices.push(x, validZ, y);
            }
            
            if (isFinite(z)) {
                minZ = Math.min(minZ, z);
                maxZ = Math.max(maxZ, z);
            }
        }
    }
    
    // Generate indices for triangles
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const a = i * (resolution + 1) + j;
            const b = i * (resolution + 1) + (j + 1);
            const c = (i + 1) * (resolution + 1) + j;
            const d = (i + 1) * (resolution + 1) + (j + 1);
            
            indices.push(a, b, d);
            indices.push(a, d, c);
        }
    }
    
    // Generate colors based on height
    if (colorMode === 'height' || colorMode === 'slope') {
        const colorObj = new THREE.Color(color);
        const zRange = maxZ - minZ;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const z = vertices[i + 1];
            let t;
            
            if (colorMode === 'height') {
                t = zRange > 0 ? (z - minZ) / zRange : 0.5;
            } else {
                // Slope coloring
                const idx = Math.floor(i / 3);
                const row = Math.floor(idx / (resolution + 1));
                const col = idx % (resolution + 1);
                
                let slope = 0;
                if (row > 0 && row < resolution && col > 0 && col < resolution) {
                    const dzdx = vertices[i + 3] - vertices[i - 3];
                    const dzdy = vertices[i + (resolution + 1) * 3 + 1] - vertices[i - (resolution + 1) * 3 + 1];
                    slope = Math.sqrt(dzdx * dzdx + dzdy * dzdy);
                }
                
                t = Math.min(slope / 2, 1);
            }
            
            const r = colorObj.r + (1 - colorObj.r) * t;
            const g = colorObj.g + (0.2 - colorObj.g) * t;
            const b = colorObj.b + (1 - colorObj.b) * t;
            
            colors.push(r, g, b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    
    if (smoothShading) {
        geometry.computeVertexNormals();
    }
    
    // Material
    let material;
    if (renderMode === 'wireframe') {
        material = new THREE.MeshBasicMaterial({
            color: color,
            wireframe: true,
            transparent: true,
            opacity: surfaceOpacity
        });
    } else if (renderMode === 'points') {
        material = new THREE.PointsMaterial({
            color: color,
            size: 0.1,
            transparent: true,
            opacity: surfaceOpacity
        });
    } else {
        const useVertexColors = colorMode === 'height' || colorMode === 'slope';
        material = new THREE.MeshPhongMaterial({
            color: useVertexColors ? 0xffffff : color,
            vertexColors: useVertexColors,
            shininess: surfaceShininess,
            transparent: true,
            opacity: surfaceOpacity,
            side: THREE.DoubleSide,
            flatShading: !smoothShading
        });
    }
    
    const mesh = renderMode === 'points' ? new THREE.Points(geometry, material) : new THREE.Mesh(geometry, material);
    return mesh;
}

function evaluateExpression(expr, x, y) {
    // Replace mathematical symbols in specific order to avoid conflicts
    let code = expr
        // First, handle superscripts and special characters
        .replace(/²/g, '**2')
        .replace(/³/g, '**3')
        .replace(/π/g, 'Math.PI')
        .replace(/\^/g, '**')
        // Handle square root symbol BEFORE function replacements
        .replace(/√\(/g, 'SQRT_PLACEHOLDER(')  // Temporary placeholder
        .replace(/√/g, 'SQRT_PLACEHOLDER')
        // Replace special arc functions first (before sin, cos, tan)
        .replace(/asin\(/g, 'Math.asin(')
        .replace(/acos\(/g, 'Math.acos(')
        .replace(/atan\(/g, 'Math.atan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        // Replace trig functions with parentheses
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        // Replace other functions with parentheses
        .replace(/exp\(/g, 'Math.exp(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/log\(/g, 'Math.log(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/floor\(/g, 'Math.floor(')
        .replace(/ceil\(/g, 'Math.ceil(')
        .replace(/round\(/g, 'Math.round(')
        // Now replace the placeholder with Math.sqrt
        .replace(/SQRT_PLACEHOLDER/g, 'Math.sqrt')
        // Handle implicit multiplication - ENHANCED for xy notation
        .replace(/([xy])([xy])/g, '$1*$2')  // xy becomes x*y, xx becomes x*x, yy becomes y*y
        .replace(/(\d+)([xy])/g, '$1*$2')  // 2x becomes 2*x, 3y becomes 3*y
        .replace(/([xy])(\d+)/g, '$1*$2')  // x2 becomes x*2
        .replace(/\)\s*\(/g, ')*(')  // )( becomes )*(
        .replace(/\)\s*(Math\.)/g, ')*$1')  // )Math. becomes )*Math.
        .replace(/\)\s*([xy])/g, ')*$1')  // )x or )y becomes )*x or )*y
        .replace(/([xy])\s*\(/g, '$1*(')  // x( or y( becomes x*( or y*(
        .replace(/(\d)\s*(Math\.PI)/g, '$1*$2')  // 2π becomes 2*Math.PI
        // Handle 'e' constant carefully (only as standalone, not in exp, etc.)
        .replace(/\be\b(?!xp)/g, 'Math.E');
    
    try {
        // Create function with x and y parameters
        const func = new Function('x', 'y', `return ${code}`);
        const result = func(x, y);
        
        // Return 0 for invalid results instead of NaN or Infinity
        return isFinite(result) ? result : 0;
    } catch (error) {
        throw new Error('Invalid mathematical expression');
    }
}

function deleteEquation(id) {
    const equation = equations.find(eq => eq.id === id);
    if (!equation) return;
    
    if (equation.mesh) {
        scene.remove(equation.mesh);
        equation.mesh.geometry.dispose();
        equation.mesh.material.dispose();
    }
    
    equations = equations.filter(eq => eq.id !== id);
    
    const card = document.querySelector(`.equation-card[data-id="${id}"]`);
    if (card) card.remove();
    
    updateSurfaceCount();
    updateStats();
}

function toggleEquationVisibility(id) {
    const equation = equations.find(eq => eq.id === id);
    if (!equation || !equation.mesh) return;
    
    equation.visible = !equation.visible;
    equation.mesh.visible = equation.visible;
    
    const colorIndicator = document.querySelector(`.equation-card[data-id="${id}"] .color-indicator`);
    if (colorIndicator) {
        colorIndicator.style.opacity = equation.visible ? '1' : '0.3';
    }
}

function updateAllSurfaces() {
    equations.forEach(eq => {
        if (eq.expression) {
            updateEquationSurface(eq.id);
        }
    });
}

function loadPreset(expression, color) {
    if (equations.length === 0) {
        addEquation();
    }
    
    const lastEquation = equations[equations.length - 1];
    lastEquation.expression = expression;
    lastEquation.color = color;
    
    const input = document.querySelector(`.equation-card[data-id="${lastEquation.id}"] .equation-input`);
    if (input) {
        input.value = expression;
    }
    
    updateEquationSurface(lastEquation.id);
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
    const cursorPosition = input.selectionStart;
    
    // Get the word before cursor
    const textBeforeCursor = value.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/[\s\+\-\*\/\(\)\^]/);
    const currentWord = words[words.length - 1].toLowerCase();
    
    if (currentWord.length < 2) {
        hideAutocomplete();
        return;
    }
    
    // Find matching suggestions
    const matches = functionSuggestions.filter(s => 
        s.trigger.startsWith(currentWord) && s.trigger !== currentWord
    );
    
    if (matches.length === 0) {
        hideAutocomplete();
        return;
    }
    
    currentSuggestions = matches;
    autocompleteIndex = 0;
    showAutocomplete(input, matches);
}

function showAutocomplete(input, suggestions) {
    const dropdown = document.getElementById('autocomplete');
    dropdown.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        if (index === autocompleteIndex) item.classList.add('active');
        item.textContent = suggestion.display;
        item.addEventListener('click', () => applySuggestion(suggestion, activeEquationId));
        dropdown.appendChild(item);
    });
    
    const rect = input.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.style.width = rect.width + 'px';
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
    if (!input) return;
    
    const value = input.value;
    const cursorPosition = input.selectionStart;
    
    // Find the start of the current word
    const textBeforeCursor = value.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/[\s\+\-\*\/\(\)\^]/);
    const currentWord = words[words.length - 1];
    const wordStart = cursorPosition - currentWord.length;
    
    // Replace the current word with the suggestion
    const newValue = value.substring(0, wordStart) + suggestion.suggestion + value.substring(cursorPosition);
    input.value = newValue;
    
    // Set cursor position
    const newCursorPos = wordStart + suggestion.suggestion.length - suggestion.cursorOffset;
    input.setSelectionRange(newCursorPos, newCursorPos);
    
    // Update equation
    handleEquationInput(equationId, newValue);
    hideAutocomplete();
    input.focus();
}

function insertAtActive(text, cursorOffset = 0) {
    if (activeEquationId === null) return;
    
    const input = document.querySelector(`.equation-card[data-id="${activeEquationId}"] .equation-input`);
    if (!input) return;
    
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    
    const newValue = value.substring(0, start) + text + value.substring(end);
    input.value = newValue;
    
    const newCursorPos = start + text.length - cursorOffset;
    input.setSelectionRange(newCursorPos, newCursorPos);
    
    handleEquationInput(activeEquationId, newValue);
    input.focus();
}

// UI Controls
function toggleKeyboard() {
    const section = document.querySelector('.keyboard-section');
    section.classList.toggle('collapsed');
}

function toggleSection(sectionName) {
    const section = document.getElementById(`${sectionName}-content`).parentElement;
    section.classList.toggle('collapsed');
}

function toggleRightPanel() {
    const panel = document.getElementById('right-panel');
    panel.classList.toggle('hidden');
    
    const container = document.querySelector('.app-container');
    container.classList.toggle('right-panel-hidden');
}

// Visualization controls
function changeRenderMode() {
    renderMode = document.getElementById('render-mode').value;
    updateAllSurfaces();
}

function changeColorMode() {
    colorMode = document.getElementById('color-mode').value;
    updateAllSurfaces();
}

function changeSurfaceOpacity() {
    surfaceOpacity = parseFloat(document.getElementById('surface-opacity').value) / 100;
    equations.forEach(eq => {
        if (eq.mesh && eq.mesh.material) {
            eq.mesh.material.opacity = surfaceOpacity;
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
    updateAllSurfaces();
}

function changeAxisOrientation() {
    axisOrientation = document.getElementById('axis-orientation').value;
    
    // Update all surfaces with new orientation
    updateAllSurfaces();
    
    // Show notification
    showToast(
        axisOrientation === 'y-up' ? 'Y-Axis is now vertical' : 'Z-Axis is now vertical',
        'success'
    );
}

// Surface Analysis Functions
function analyzeSurface() {
    if (activeEquationId === null) {
        showToast('Please select an equation first', 'info');
        return;
    }
    
    const equation = equations.find(eq => eq.id === activeEquationId);
    if (!equation || !equation.mesh) {
        showToast('Please create a surface first', 'info');
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
        const z = positions.getY(i);  // Y is height in our coordinate system
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
    const index = geometry.index;
    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            const i1 = index.getX(i);
            const i2 = index.getX(i + 1);
            const i3 = index.getX(i + 2);
            
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
    criticalPointMarkers.forEach(marker => {
        scene.remove(marker);
        if (marker.geometry) marker.geometry.dispose();
        if (marker.material) marker.material.dispose();
    });
    criticalPointMarkers = [];
    
    if (!checkbox.checked) return;
    
    if (activeEquationId === null) {
        showToast('Please select an equation first', 'info');
        checkbox.checked = false;
        return;
    }
    
    const equation = equations.find(eq => eq.id === activeEquationId);
    if (!equation || !equation.mesh) {
        showToast('Please create a surface first', 'info');
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
            const z = positions.getY(i);  // Y is height in our coordinate system
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
        const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        
        if (isFinite(minZ)) {
            const minMarker = new THREE.Mesh(
                markerGeometry.clone(),
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
                markerGeometry.clone(),
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
    contourLines.forEach(line => {
        scene.remove(line);
        if (line.geometry) line.geometry.dispose();
        if (line.material) line.material.dispose();
    });
    contourLines = [];
    
    if (!checkbox.checked) return;
    
    if (activeEquationId === null) {
        showToast('Please select an equation first', 'info');
        checkbox.checked = false;
        return;
    }
    
    const equation = equations.find(eq => eq.id === activeEquationId);
    if (!equation || !equation.mesh) {
        showToast('Please create a surface first', 'info');
        checkbox.checked = false;
        return;
    }
    
    try {
        const geometry = equation.mesh.geometry;
        const positions = geometry.attributes.position;
        
        // Find Z range
        let minZ = Infinity, maxZ = -Infinity;
        for (let i = 0; i < positions.count; i++) {
            const z = positions.getY(i);
            if (isFinite(z)) {
                minZ = Math.min(minZ, z);
                maxZ = Math.max(maxZ, z);
            }
        }
        
        // Create contour lines at different heights
        const numContours = 10;
        const contourStep = (maxZ - minZ) / (numContours + 1);
        
        for (let c = 1; c <= numContours; c++) {
            const contourHeight = minZ + c * contourStep;
            const contourPoints = [];
            
            // Sample points close to contour height
            for (let i = 0; i < positions.count; i++) {
                const z = positions.getY(i);
                if (Math.abs(z - contourHeight) < contourStep * 0.2) {
                    contourPoints.push(new THREE.Vector3(
                        positions.getX(i),
                        positions.getY(i),
                        positions.getZ(i)
                    ));
                }
            }
            
            if (contourPoints.length > 2) {
                const contourGeometry = new THREE.BufferGeometry().setFromPoints(contourPoints);
                const contourMaterial = new THREE.LineBasicMaterial({ 
                    color: 0x00ff00,
                    opacity: 0.5,
                    transparent: true
                });
                const contourLine = new THREE.LineSegments(contourGeometry, contourMaterial);
                scene.add(contourLine);
                contourLines.push(contourLine);
            }
        }
    } catch (error) {
        console.error('Error creating contours:', error);
        checkbox.checked = false;
    }
}

function toggleNormals() {
    const checkbox = document.getElementById('show-normals');
    
    // Clear existing normals
    normalVectors.forEach(normal => {
        scene.remove(normal);
        if (normal.line && normal.line.geometry) normal.line.geometry.dispose();
        if (normal.line && normal.line.material) normal.line.material.dispose();
        if (normal.cone && normal.cone.geometry) normal.cone.geometry.dispose();
        if (normal.cone && normal.cone.material) normal.cone.material.dispose();
    });
    normalVectors = [];
    
    if (!checkbox.checked) return;
    
    if (activeEquationId === null) {
        showToast('Please select an equation first', 'info');
        checkbox.checked = false;
        return;
    }
    
    const equation = equations.find(eq => eq.id === activeEquationId);
    if (!equation || !equation.mesh) {
        showToast('Please create a surface first', 'info');
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
        
        // Sample normals (show every 20th for better performance)
        const step = Math.max(20, Math.floor(positions.count / 150));
        
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

function toggleAutoRotate() {
    autoRotate = document.getElementById('auto-rotate').checked;
}

// Animation controls
function startAnimation() {
    isAnimating = true;
}

function stopAnimation() {
    isAnimating = false;
    
    // Reset transformations
    equations.forEach(eq => {
        if (eq.mesh) {
            eq.mesh.position.set(0, 0, 0);
            eq.mesh.scale.set(1, 1, 1);
            eq.mesh.rotation.set(0, 0, 0);
        }
    });
}

// Point evaluation
function evaluatePoint() {
    const x = parseFloat(document.getElementById('eval-x').value);
    const y = parseFloat(document.getElementById('eval-y').value);
    const resultDiv = document.getElementById('eval-z-value');
    
    if (equations.length === 0 || !equations[0].expression) {
        resultDiv.textContent = '—';
        return;
    }
    
    try {
        const z = evaluateExpression(equations[0].expression, x, y);
        resultDiv.textContent = isFinite(z) ? z.toFixed(4) : 'Undefined';
        
        // Update marker if enabled
        if (document.getElementById('show-marker').checked) {
            updateEvaluationMarker(x, y, z);
        }
    } catch (error) {
        resultDiv.textContent = 'Error';
    }
}

function updateEvaluationMarker(x, y, z) {
    // Remove old marker
    if (evaluationMarker) {
        scene.remove(evaluationMarker);
        evaluationMarker.geometry.dispose();
        evaluationMarker.material.dispose();
    }
    
    if (!isFinite(z)) return;
    
    // Create new marker
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    evaluationMarker = new THREE.Mesh(geometry, material);
    evaluationMarker.position.set(x, z, y);
    scene.add(evaluationMarker);
}

function toggleMarker() {
    const showMarker = document.getElementById('show-marker').checked;
    
    if (!showMarker && evaluationMarker) {
        scene.remove(evaluationMarker);
        evaluationMarker.geometry.dispose();
        evaluationMarker.material.dispose();
        evaluationMarker = null;
    } else if (showMarker) {
        evaluatePoint();
    }
}

// Export functions
function exportScreenshot() {
    const dataURL = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'graphspace-screenshot-' + Date.now() + '.png';
    link.href = dataURL;
    link.click();
}

function exportSTL() {
    if (equations.length === 0 || !equations.some(eq => eq.mesh)) {
        showToast('Please create at least one surface first', 'info');
        return;
    }
    
    let stlString = '';
    
    equations.forEach(eq => {
        if (!eq.mesh || !eq.mesh.geometry) return;
        
        const geometry = eq.mesh.geometry;
        const positions = geometry.attributes.position;
        const indices = geometry.index;
        
        for (let i = 0; i < indices.count; i += 3) {
            const i1 = indices.getX(i);
            const i2 = indices.getX(i + 1);
            const i3 = indices.getX(i + 2);
            
            const v1 = new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1));
            const v2 = new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2));
            const v3 = new THREE.Vector3(positions.getX(i3), positions.getY(i3), positions.getZ(i3));
            
            const normal = new THREE.Vector3()
                .crossVectors(
                    new THREE.Vector3().subVectors(v2, v1),
                    new THREE.Vector3().subVectors(v3, v1)
                )
                .normalize();
            
            stlString += `facet normal ${normal.x} ${normal.y} ${normal.z}\n`;
            stlString += `  outer loop\n`;
            stlString += `    vertex ${v1.x} ${v1.y} ${v1.z}\n`;
            stlString += `    vertex ${v2.x} ${v2.y} ${v2.z}\n`;
            stlString += `    vertex ${v3.x} ${v3.y} ${v3.z}\n`;
            stlString += `  endloop\n`;
            stlString += `endfacet\n`;
        }
    });
    
    const fullSTL = `solid graphspace\n${stlString}endsolid graphspace\n`;
    const blob = new Blob([fullSTL], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = 'graphspace-model-' + Date.now() + '.stl';
    link.href = URL.createObjectURL(blob);
    link.click();
}

function exportData() {
    if (equations.length === 0 || !equations.some(eq => eq.mesh)) {
        showToast('Please create at least one surface first', 'info');
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
            const y = positions.getZ(i);
            const z = positions.getY(i);
            
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

// Camera and scene controls with improved zoom
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
            // Pan with dynamic speed based on zoom
            const panSpeed = 0.01 * currentZoomLevel;
            camera.position.x -= deltaX * panSpeed;
            camera.position.y += deltaY * panSpeed;
        } else {
            // Rotate
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
    
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });
    
    // Improved zoom with dynamic axis scaling
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const zoomSpeed = 0.1;
        const radius = Math.sqrt(
            camera.position.x ** 2 + camera.position.y ** 2 + camera.position.z ** 2
        );
        
        // Zoom in/out: scroll down = zoom out (increase radius), scroll up = zoom in (decrease radius)
        const delta = e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
        const newRadius = Math.max(3, Math.min(100, radius + delta));
        const scale = newRadius / radius;
        
        camera.position.multiplyScalar(scale);
        
        // Update zoom level for dynamic grid/axes scaling
        // Base zoom level is at distance 10
        const baseDistance = 10;
        currentZoomLevel = newRadius / baseDistance;
        
        // Update grid and axes to match zoom level
        updateGridAndAxes();
    });
}

function resetCamera() {
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    currentZoomLevel = 1.0;
    updateGridAndAxes();
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
                    eq.mesh.position.y = Math.sin(animationTime) * 0.5;
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
