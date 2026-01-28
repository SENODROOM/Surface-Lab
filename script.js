// Three.js Setup
let scene, camera, renderer;
let showGrid = true;
let showAxes = true;
let gridHelper, axesHelper;

// Equation management
let equations = [];
let equationIdCounter = 0;
let activeEquationId = null;

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
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
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
    if (!equation || !equation.expression.trim()) return;
    
    const errorDiv = document.getElementById(`error-${id}`);
    const input = document.querySelector(`.equation-card[data-id="${id}"] .equation-input`);
    
    try {
        const parsedEquation = parseEquation(equation.expression);
        errorDiv.textContent = '';
        input.classList.remove('input-error');
        
        // Remove old mesh
        if (equation.mesh) {
            scene.remove(equation.mesh);
        }
        
        // Create new mesh
        const mesh = createSurfaceMesh(parsedEquation, equation.color);
        equation.mesh = mesh;
        mesh.visible = equation.visible;
        scene.add(mesh);
        
        updateStats();
    } catch (error) {
        errorDiv.textContent = error.message;
        input.classList.add('input-error');
    }
}

function updateAllSurfaces() {
    equations.forEach(equation => {
        if (equation.expression.trim()) {
            updateEquationSurface(equation.id);
        }
    });
}

function createSurfaceMesh(parsedEquation, colorHex) {
    const xmin = parseFloat(document.getElementById('xmin').value);
    const xmax = parseFloat(document.getElementById('xmax').value);
    const ymin = parseFloat(document.getElementById('ymin').value);
    const ymax = parseFloat(document.getElementById('ymax').value);
    const resolution = parseInt(document.getElementById('resolution').value);
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const indices = [];
    
    let minZ = Infinity;
    let maxZ = -Infinity;
    
    // Generate vertices
    for (let i = 0; i <= resolution; i++) {
        for (let j = 0; j <= resolution; j++) {
            const x = xmin + (xmax - xmin) * (i / resolution);
            const y = ymin + (ymax - ymin) * (j / resolution);
            const z = evaluateFunction(parsedEquation, x, y);
            
            vertices.push(x, y, z);
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
        }
    }
    
    // Add colors based on height and base color
    const baseColor = new THREE.Color(colorHex);
    const lightColor = new THREE.Color(colorHex).multiplyScalar(1.5);
    const darkColor = new THREE.Color(colorHex).multiplyScalar(0.5);
    
    for (let i = 0; i < vertices.length; i += 3) {
        const z = vertices[i + 2];
        const t = (z - minZ) / (maxZ - minZ || 1);
        const color = new THREE.Color().lerpColors(darkColor, lightColor, t);
        colors.push(color.r, color.g, color.b);
    }
    
    // Create indices
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const a = i * (resolution + 1) + j;
            const b = a + 1;
            const c = a + resolution + 1;
            const d = c + 1;
            
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        shininess: 60,
        flatShading: false,
        transparent: true,
        opacity: 0.9
    });
    
    return new THREE.Mesh(geometry, material);
}

function parseEquation(equation) {
    let parsed = equation
        .replace(/√/g, 'sqrt')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/π/g, 'pi')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\s+/g, '');
    
    // Implicit multiplication
    parsed = parsed.replace(/(\d+\.?\d*)([xy])/gi, '$1*$2');
    parsed = parsed.replace(/(\d+\.?\d*)\(/g, '$1*(');
    parsed = parsed.replace(/\)(\d+\.?\d*)/g, ')*$1');
    parsed = parsed.replace(/\)([xy])/gi, ')*$1');
    parsed = parsed.replace(/([xy])\(/gi, '$1*(');
    parsed = parsed.replace(/\)\(/g, ')*(');
    parsed = parsed.replace(/([xy])([xy])/gi, '$1*$2');
    
    // Replace functions
    parsed = parsed
        .replace(/sqrt/gi, 'Math.sqrt')
        .replace(/sinh/gi, 'Math.sinh')
        .replace(/cosh/gi, 'Math.cosh')
        .replace(/tanh/gi, 'Math.tanh')
        .replace(/asin/gi, 'Math.asin')
        .replace(/acos/gi, 'Math.acos')
        .replace(/atan/gi, 'Math.atan')
        .replace(/sin/gi, 'Math.sin')
        .replace(/cos/gi, 'Math.cos')
        .replace(/tan/gi, 'Math.tan')
        .replace(/exp/gi, 'Math.exp')
        .replace(/ln/gi, 'Math.log')
        .replace(/log/gi, 'Math.log')
        .replace(/abs/gi, 'Math.abs')
        .replace(/floor/gi, 'Math.floor')
        .replace(/ceil/gi, 'Math.ceil')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e(?![a-z])/gi, 'Math.E');
    
    // More implicit multiplication
    parsed = parsed.replace(/(\d+\.?\d*)(Math\.[a-zA-Z]+)/g, '$1*$2');
    parsed = parsed.replace(/\)(Math\.[a-zA-Z]+)/g, ')*$1');
    parsed = parsed.replace(/([xy])(Math\.[a-zA-Z]+)/gi, '$1*$2');
    
    parsed = parsed.replace(/\^/g, '**');
    
    try {
        const testFunc = new Function('x', 'y', `return ${parsed};`);
        testFunc(1, 1);
        return parsed;
    } catch (error) {
        throw new Error('Invalid equation syntax');
    }
}

function evaluateFunction(equation, x, y) {
    try {
        const func = new Function('x', 'y', `return ${equation};`);
        const result = func(x, y);
        if (isNaN(result) || !isFinite(result)) {
            return 0;
        }
        return result;
    } catch (error) {
        return 0;
    }
}

// Autocomplete functions
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
    renderer.render(scene, camera);
}

// Initialize
init();
