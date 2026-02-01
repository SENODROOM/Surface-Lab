
const mathDisplay = document.getElementById('mathDisplay');
const rawExpression = document.getElementById('rawExpression');
const result = document.getElementById('result');
const resultSection = document.getElementById('resultSection');
const modeIndicator = document.getElementById('modeIndicator');

let expressionData = [];
let currentMode = 'normal'; // 'normal', 'superscript', 'fraction-num', 'fraction-den', 'sqrt', 'function', 'abs'
let currentFraction = null;
let currentSuperscript = null;
let currentSqrt = null;
let currentFunction = null;
let currentAbs = null;

// Handle input
mathDisplay.addEventListener('beforeinput', function (e) {
    e.preventDefault();

    const data = e.data;

    if (!data) {
        if (e.inputType === 'deleteContentBackward') {
            handleBackspace();
        }
        return;
    }

    // Check for special sequences
    if (data === '^') {
        enterSuperscriptMode();
    } else if (data === '/' && currentMode !== 'fraction-num') {
        enterFractionMode();
    } else {
        insertCharacter(data);
    }
});

// Handle paste
mathDisplay.addEventListener('paste', function (e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    for (let char of text) {
        insertCharacter(char);
    }
});

function insertCharacter(char) {
    if (currentMode === 'sqrt') {
        if (currentSqrt) {
            currentSqrt.content += char;
        }
    } else if (currentMode === 'abs') {
        if (currentAbs) {
            currentAbs.content += char;
        }
    } else if (currentMode === 'function') {
        if (currentFunction) {
            currentFunction.content += char;
        }
    } else if (currentMode === 'superscript') {
        if (currentSuperscript) {
            currentSuperscript.exponent += char;
        }
    } else if (currentMode === 'fraction-num') {
        if (currentFraction) {
            currentFraction.numerator += char;
        }
    } else if (currentMode === 'fraction-den') {
        if (currentFraction) {
            currentFraction.denominator += char;
        }
    } else {
        // Check for function and special patterns
        const lastText = getLastTextElement();
        if (lastText) {
            lastText.text += char;

            // Check for sqrt
            if (lastText.text.endsWith('sqrt')) {
                lastText.text = lastText.text.slice(0, -4);
                if (lastText.text === '') {
                    expressionData.pop();
                }
                enterSqrtMode();
                return;
            }

            // Check for abs
            if (lastText.text.endsWith('abs')) {
                lastText.text = lastText.text.slice(0, -3);
                if (lastText.text === '') {
                    expressionData.pop();
                }
                enterAbsMode();
                return;
            }

            // Check for trigonometric and other functions
            const functions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'exp', 'ceil', 'floor', 'round', 'max', 'min'];
            for (let func of functions) {
                if (lastText.text.endsWith(func)) {
                    lastText.text = lastText.text.slice(0, -func.length);
                    if (lastText.text === '') {
                        expressionData.pop();
                    }
                    enterFunctionMode(func);
                    return;
                }
            }
        } else {
            expressionData.push({ type: 'text', text: char });
        }
    }

    render();
}

function enterSqrtMode() {
    currentSqrt = { content: '' };
    expressionData.push({ type: 'sqrt', data: currentSqrt });
    currentMode = 'sqrt';
    modeIndicator.textContent = 'Square Root';
    modeIndicator.classList.add('active');
    render();
}

function enterAbsMode() {
    currentAbs = { content: '' };
    expressionData.push({ type: 'abs', data: currentAbs });
    currentMode = 'abs';
    modeIndicator.textContent = 'Absolute Value';
    modeIndicator.classList.add('active');
    render();
}

function enterFunctionMode(funcName) {
    currentFunction = { name: funcName, content: '' };
    expressionData.push({ type: 'function', data: currentFunction });
    currentMode = 'function';
    modeIndicator.textContent = funcName.toUpperCase() + '()';
    modeIndicator.classList.add('active');
    render();
}

function enterSuperscriptMode() {
    const lastText = getLastTextElement();
    if (lastText && lastText.text) {
        const base = lastText.text;
        lastText.text = '';
        if (lastText.text === '') {
            expressionData.pop();
        }
        currentSuperscript = { base: base, exponent: '' };
        expressionData.push({ type: 'superscript', data: currentSuperscript });
        currentMode = 'superscript';
        modeIndicator.textContent = 'Superscript Mode';
        modeIndicator.classList.add('active');
    }
    render();
}

function enterFractionMode() {
    const lastText = getLastTextElement();
    let numerator = '';
    if (lastText && lastText.text) {
        numerator = lastText.text;
        lastText.text = '';
        if (lastText.text === '') {
            expressionData.pop();
        }
    }
    currentFraction = { numerator: numerator, denominator: '' };
    expressionData.push({ type: 'fraction', data: currentFraction });
    currentMode = 'fraction-den'; // Start directly in denominator mode
    modeIndicator.textContent = 'Fraction - Denominator';
    modeIndicator.classList.add('active');
    render();
}

function handleBackspace() {
    if (currentMode === 'sqrt') {
        if (currentSqrt && currentSqrt.content) {
            currentSqrt.content = currentSqrt.content.slice(0, -1);
        } else {
            exitSqrtMode();
            expressionData.pop();
        }
    } else if (currentMode === 'abs') {
        if (currentAbs && currentAbs.content) {
            currentAbs.content = currentAbs.content.slice(0, -1);
        } else {
            exitAbsMode();
            expressionData.pop();
        }
    } else if (currentMode === 'function') {
        if (currentFunction && currentFunction.content) {
            currentFunction.content = currentFunction.content.slice(0, -1);
        } else {
            exitFunctionMode();
            expressionData.pop();
        }
    } else if (currentMode === 'superscript') {
        if (currentSuperscript && currentSuperscript.exponent) {
            currentSuperscript.exponent = currentSuperscript.exponent.slice(0, -1);
            if (currentSuperscript.exponent === '') {
                exitSuperscriptMode();
            }
        }
    } else if (currentMode === 'fraction-num') {
        if (currentFraction && currentFraction.numerator) {
            currentFraction.numerator = currentFraction.numerator.slice(0, -1);
        } else {
            exitFractionMode();
        }
    } else if (currentMode === 'fraction-den') {
        if (currentFraction && currentFraction.denominator) {
            currentFraction.denominator = currentFraction.denominator.slice(0, -1);
        } else {
            currentMode = 'fraction-num';
            modeIndicator.textContent = 'Fraction - Numerator';
        }
    } else {
        const lastElement = expressionData[expressionData.length - 1];
        if (lastElement) {
            if (lastElement.type === 'text' && lastElement.text) {
                lastElement.text = lastElement.text.slice(0, -1);
                if (lastElement.text === '') {
                    expressionData.pop();
                }
            } else {
                expressionData.pop();
            }
        }
    }
    render();
}

function exitSqrtMode() {
    currentMode = 'normal';
    currentSqrt = null;
    modeIndicator.classList.remove('active');
}

function exitAbsMode() {
    currentMode = 'normal';
    currentAbs = null;
    modeIndicator.classList.remove('active');
}

function exitFunctionMode() {
    currentMode = 'normal';
    currentFunction = null;
    modeIndicator.classList.remove('active');
}

function exitSuperscriptMode() {
    currentMode = 'normal';
    currentSuperscript = null;
    modeIndicator.classList.remove('active');
}

function exitFractionMode() {
    currentMode = 'normal';
    currentFraction = null;
    modeIndicator.classList.remove('active');
}

// Handle Space and Tab in fraction mode, and arrow keys for superscript
mathDisplay.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' && (currentMode === 'superscript' || currentMode === 'sqrt' || currentMode === 'function' || currentMode === 'abs')) {
        e.preventDefault();
        if (currentMode === 'superscript') exitSuperscriptMode();
        if (currentMode === 'sqrt') exitSqrtMode();
        if (currentMode === 'function') exitFunctionMode();
        if (currentMode === 'abs') exitAbsMode();
        render();
    } else if (e.key === 'ArrowLeft' && currentMode === 'fraction-den') {
        // Move from denominator to numerator
        e.preventDefault();
        currentMode = 'fraction-num';
        modeIndicator.textContent = 'Fraction - Numerator';
        render();
    } else if (e.key === 'ArrowRight' && currentMode === 'fraction-num') {
        // Move from numerator to denominator
        e.preventDefault();
        currentMode = 'fraction-den';
        modeIndicator.textContent = 'Fraction - Denominator';
        render();
    } else if (e.key === 'ArrowRight' && currentMode === 'fraction-den') {
        // Exit fraction mode
        e.preventDefault();
        exitFractionMode();
        render();
    } else if ((e.key === ' ' || e.key === 'Tab') && currentMode === 'fraction-num') {
        e.preventDefault();
        currentMode = 'fraction-den';
        modeIndicator.textContent = 'Fraction - Denominator';
    } else if ((e.key === ' ' || e.key === 'Tab' || e.key === 'Enter') && currentMode === 'fraction-den') {
        e.preventDefault();
        exitFractionMode();
    } else if ((e.key === ' ' || e.key === 'Tab' || e.key === 'Enter') && (currentMode === 'superscript' || currentMode === 'sqrt' || currentMode === 'function' || currentMode === 'abs')) {
        e.preventDefault();
        if (currentMode === 'superscript') exitSuperscriptMode();
        if (currentMode === 'sqrt') exitSqrtMode();
        if (currentMode === 'function') exitFunctionMode();
        if (currentMode === 'abs') exitAbsMode();
    } else if (e.key === 'Escape') {
        e.preventDefault();
        if (currentMode !== 'normal') {
            if (currentMode === 'superscript') exitSuperscriptMode();
            if (currentMode === 'sqrt') exitSqrtMode();
            if (currentMode === 'function') exitFunctionMode();
            if (currentMode === 'abs') exitAbsMode();
            if (currentMode.startsWith('fraction')) exitFractionMode();
        }
    }
});

function getLastTextElement() {
    for (let i = expressionData.length - 1; i >= 0; i--) {
        if (expressionData[i].type === 'text') {
            return expressionData[i];
        }
    }
    return null;
}

function render() {
    let html = '';
    for (let i = 0; i < expressionData.length; i++) {
        const elem = expressionData[i];
        const isLast = (i === expressionData.length - 1);

        if (elem.type === 'text') {
            html += `<span>${escapeHtml(elem.text)}</span>`;
        } else if (elem.type === 'sqrt') {
            html += `<span class="sqrt-symbol"><span class="sqrt-content" id="${isLast && currentMode === 'sqrt' ? 'cursorTarget' : ''}">${escapeHtml(elem.data.content || ' ')}</span></span>`;
        } else if (elem.type === 'abs') {
            html += `<span class="abs-bars"><span class="abs-content" id="${isLast && currentMode === 'abs' ? 'cursorTarget' : ''}">${escapeHtml(elem.data.content || ' ')}</span></span>`;
        } else if (elem.type === 'function') {
            html += `<span class="parentheses"><span class="function-name">${escapeHtml(elem.data.name)}</span>(<span id="${isLast && currentMode === 'function' ? 'cursorTarget' : ''}">${escapeHtml(elem.data.content || ' ')}</span>)</span>`;
        } else if (elem.type === 'superscript') {
            html += `<span>${escapeHtml(elem.data.base)}<span class="superscript" id="${isLast && currentMode === 'superscript' ? 'cursorTarget' : ''}">${escapeHtml(elem.data.exponent || ' ')}</span></span>`;
        } else if (elem.type === 'fraction') {
            html += `<span class="fraction">
                        <span class="numerator" id="${isLast && currentMode === 'fraction-num' ? 'cursorTarget' : ''}">${escapeHtml(elem.data.numerator || ' ')}</span>
                        <span class="fraction-line"></span>
                        <span class="denominator" id="${isLast && currentMode === 'fraction-den' ? 'cursorTarget' : ''}">${escapeHtml(elem.data.denominator || ' ')}</span>
                    </span>`;
        }
    }
    mathDisplay.innerHTML = html || '';

    // Update raw expression
    updateRawExpression();

    // Move cursor to the correct position
    const range = document.createRange();
    const sel = window.getSelection();
    const cursorTarget = document.getElementById('cursorTarget');

    if (cursorTarget && cursorTarget.firstChild) {
        // Position cursor inside the target element
        range.setStart(cursorTarget.firstChild, cursorTarget.textContent.length);
        range.collapse(true);
    } else if (mathDisplay.lastChild) {
        // Default: position at end
        range.setStartAfter(mathDisplay.lastChild);
        range.collapse(true);
    }

    sel.removeAllRanges();
    sel.addRange(range);
}

function updateRawExpression() {
    let raw = '';
    for (let elem of expressionData) {
        if (elem.type === 'text') {
            raw += elem.text;
        } else if (elem.type === 'sqrt') {
            raw += `sqrt(${elem.data.content})`;
        } else if (elem.type === 'abs') {
            raw += `abs(${elem.data.content})`;
        } else if (elem.type === 'function') {
            raw += `${elem.data.name}(${elem.data.content})`;
        } else if (elem.type === 'superscript') {
            raw += `${elem.data.base}^${elem.data.exponent}`;
        } else if (elem.type === 'fraction') {
            raw += `(${elem.data.numerator})/(${elem.data.denominator})`;
        }
    }
    rawExpression.textContent = raw || 'Type to see raw expression...';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function insertText(text) {
    for (let char of text) {
        insertCharacter(char);
    }
}

function insertSymbol(type) {
    if (type === 'sqrt') {
        enterSqrtMode();
    } else if (type === 'abs') {
        enterAbsMode();
    } else if (type === 'power') {
        enterSuperscriptMode();
    } else if (type === 'fraction') {
        enterFractionMode();
    }
    mathDisplay.focus();
}

function insertFunction(funcName) {
    enterFunctionMode(funcName);
    mathDisplay.focus();
}

function evaluateExpression() {
    updateRawExpression();
    const expression = rawExpression.textContent.trim();

    if (!expression || expression === 'Type to see raw expression...') {
        alert('Please enter a mathematical expression');
        return;
    }

    try {
        // Replace π with pi for math.js
        const processedExpression = expression.replace(/π/g, 'pi');
        const evaluated = math.evaluate(processedExpression);

        let formattedResult;
        if (typeof evaluated === 'number') {
            formattedResult = Math.round(evaluated * 10000000000) / 10000000000;
        } else {
            formattedResult = evaluated.toString();
        }

        result.textContent = formattedResult;
        resultSection.style.display = 'block';
        resultSection.classList.remove('error');
    } catch (error) {
        result.textContent = 'Error: ' + error.message;
        resultSection.style.display = 'block';
        resultSection.classList.add('error');
    }
}

// Focus on load
mathDisplay.focus();