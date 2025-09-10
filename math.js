const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const equationInput = document.getElementById('equationInput');
const functionList = document.getElementById('functionList');
const zoomInfo = document.getElementById('zoomInfo');
const icons = document.querySelectorAll('.header-icons > div > img')

let functions = [];
let selectedFunction = null;
let isSelectedFunction = false;
let scale = 50;
let offsetX = 0;
let offsetY = 0;
let showGrid = true;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

const colors = ['#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
let colorIndex = 0;

function toggleGray() {
    for (const icon of icons) {
        icon.src = icon.src.split('.png')[0] += "_gray.png"
        icon.classList.toggle('scale_01')
    }
}

function toggleClickable() {
    for (const icon of icons) {
        icon.src = icon.src.split('_gray.png')[0] += ".png"
        icon.classList.toggle('scale_01')
    }
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
}

function screenToWorld(screenX, screenY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (screenX - rect.width / 2 - offsetX) / scale,
        y: -(screenY - rect.height / 2 - offsetY) / scale
    };
}

function worldToScreen(worldX, worldY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: worldX * scale + rect.width / 2 + offsetX,
        y: -worldY * scale + rect.height / 2 + offsetY
    };
}

function getDynamicGridSpacing() {
    const rawSpacing = 50 / scale;
    const exponent = Math.floor(Math.log10(rawSpacing));
    const base = Math.pow(10, exponent);
    const fraction = rawSpacing / base;

    let niceSpacing;
    if (fraction < 1.5) niceSpacing = base;
    else if (fraction < 3) niceSpacing = 2 * base;
    else if (fraction < 7) niceSpacing = 5 * base;
    else niceSpacing = 10 * base;

    return niceSpacing;
}

function drawGrid() {
    if (!showGrid) return;

    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    const worldBounds = {
        left: screenToWorld(0, 0).x,
        right: screenToWorld(rect.width, 0).x,
        top: screenToWorld(0, 0).y,
        bottom: screenToWorld(0, rect.height).y
    };

    const gridSpacing = getDynamicGridSpacing();

    for (let x = Math.floor(worldBounds.left / gridSpacing) * gridSpacing; x <= worldBounds.right; x += gridSpacing) {
        const screenX = worldToScreen(x, 0).x;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, rect.height);
        ctx.stroke();
    }

    for (let y = Math.floor(worldBounds.bottom / gridSpacing) * gridSpacing; y <= worldBounds.top; y += gridSpacing) {
        const screenY = worldToScreen(0, y).y;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(rect.width, screenY);
        ctx.stroke();
    }
}

function formatNumber(n, spacing) {
    if (n === 0) return '0';

    const abs = Math.abs(n);

    if (abs >= 1e6 || abs < 1e-4) {
        return n.toExponential(1).replace('+', '');
    }

    const decimals = Math.max(0, -Math.floor(Math.log10(spacing)));

    return n.toFixed(decimals);
}

function drawAxes() {
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    const centerX = rect.width / 2 + offsetX;
    const centerY = rect.height / 2 + offsetY;

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(rect.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, rect.height);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '12px Segoe UI';

    const worldBounds = {
        left: screenToWorld(0, 0).x,
        right: screenToWorld(rect.width, 0).x,
        top: screenToWorld(0, 0).y,
        bottom: screenToWorld(0, rect.height).y
    };

    const tickSpacing = getDynamicGridSpacing();

    for (let x = Math.floor(worldBounds.left / tickSpacing) * tickSpacing; x <= worldBounds.right; x += tickSpacing) {
        if (Math.abs(x) < 0.001) continue;
        const screenPos = worldToScreen(x, 0);
        if (screenPos.x > 20 && screenPos.x < rect.width - 20) {
            ctx.fillText(formatNumber(x, tickSpacing), screenPos.x - 12, screenPos.y + 15);
        }
    }

    for (let y = Math.floor(worldBounds.bottom / tickSpacing) * tickSpacing; y <= worldBounds.top; y += tickSpacing) {
        if (Math.abs(y) < 0.001) continue;
        const screenPos = worldToScreen(0, y);
        if (screenPos.y > 20 && screenPos.y < rect.height - 20) {
            ctx.fillText(formatNumber(y, tickSpacing), screenPos.x + 8, screenPos.y + 4);
        }
    }
}

function evaluateFunction(func, x) {
    try {
        return func.compiled(x);
    } catch {
        return NaN;
    }
}

function numericalDerivative(func, x, h = 1e-8) {
    const f1 = evaluateFunction(func, x + h);
    const f2 = evaluateFunction(func, x - h);

    if (isNaN(f1) || isNaN(f2) || !isFinite(f1) || !isFinite(f2)) {
        return NaN;
    }

    return (f1 - f2) / (2 * h);
}

function isValidDerivativePoint(func, x, tolerance = 1e-10) {
    const h = tolerance;
    const testPoints = [x - h, x, x + h];

    for (let testX of testPoints) {
        const y = evaluateFunction(func, testX);
        if (isNaN(y) || !isFinite(y)) {
            return false;
        }
    }

    const derivative = numericalDerivative(func, x, h);
    return !isNaN(derivative) && isFinite(derivative) && Math.abs(derivative) < 1e6;
}

function drawFunction(func) {
    const rect = canvas.getBoundingClientRect();
    const worldBounds = {
        left: screenToWorld(0, 0).x,
        right: screenToWorld(rect.width, 0).x
    };

    const pixelDensity = window.devicePixelRatio || 1;
    const maxSteps = Math.max(2000, rect.width * pixelDensity * 2);
    const minStepSize = Math.abs(worldBounds.right - worldBounds.left) / maxSteps;

    let points = [];
    let x = worldBounds.left;

    while (x <= worldBounds.right) {
        let y, isValid;
        let stepSize = minStepSize;

        if (func.isDerivative) {
            isValid = isValidDerivativePoint(func.originalFunction, x);
            if (isValid) {
                y = numericalDerivative(func.originalFunction, x);
            } else {
                y = NaN;
            }
        } else if (func.isInverse) {
            const originalY = evaluateFunction(func.originalFunction, x);
            if (originalY === 0 || isNaN(originalY) || !isFinite(originalY)) {
                y = NaN;
                isValid = false;
            } else {
                y = 1 / originalY;
                isValid = !isNaN(y) && isFinite(y) && Math.abs(y) < 1e6;
            }
        } else if (func.isPrimitive) {
            y = numericalIntegral(func.originalFunction, x);
            isValid = !isNaN(y) && isFinite(y) && Math.abs(y) < 1e6;
        } else {
            y = evaluateFunction(func, x);
            isValid = !isNaN(y) && isFinite(y) && Math.abs(y) < 1e6;
        }

        if (isValid) {
            const nextX = x + minStepSize;
            let nextY;

            if (func.isDerivative) {
                if (isValidDerivativePoint(func.originalFunction, nextX)) {
                    nextY = numericalDerivative(func.originalFunction, nextX);
                } else {
                    nextY = NaN;
                }
            } else if (func.isInverse) {
                const originalNextY = evaluateFunction(func.originalFunction, nextX);
                if (originalNextY === 0 || isNaN(originalNextY) || !isFinite(originalNextY)) {
                    nextY = NaN;
                } else {
                    nextY = 1 / originalNextY;
                }
            } else if (func.isPrimitive) {
                nextY = numericalIntegral(func.originalFunction, nextX);
            } else {
                nextY = evaluateFunction(func, nextX);
            }


            if (!isNaN(nextY) && isFinite(nextY) && Math.abs(nextY) < 1e6) {
                const derivative = Math.abs(nextY - y) / minStepSize;
                const curvature = derivative / scale;

                if (curvature > 0.5) {
                    stepSize = minStepSize * 0.1;
                } else if (curvature > 0.1) {
                    stepSize = minStepSize * 0.5;
                }

                const screenYDiff = Math.abs(worldToScreen(x, y).y - worldToScreen(nextX, nextY).y);
                if (screenYDiff > rect.height) {
                    points.push({ valid: false });
                    x += stepSize;
                    continue;
                }
            }

            const screen = worldToScreen(x, y);
            points.push({ x: screen.x, y: screen.y, valid: true, worldY: y });
        } else {
            points.push({ valid: false });
        }

        x += stepSize;
    }

    const isSelected = selectedFunction && selectedFunction.id === func.id;
    ctx.strokeStyle = func.color;
    ctx.lineWidth = isSelected ? 4 : 2.5;
    ctx.beginPath();

    let pathStarted = false;
    let lastValidPoint = null;

    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (point.valid) {
            if (!pathStarted) {
                ctx.moveTo(point.x, point.y);
                pathStarted = true;
                lastValidPoint = point;
            } else {
                if (lastValidPoint && Math.abs(point.worldY - lastValidPoint.worldY) * scale > rect.height * 2) {
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
                lastValidPoint = point;
            }
        } else {
            if (pathStarted) {
                ctx.stroke();
                ctx.beginPath();
                pathStarted = false;
                lastValidPoint = null;
            }
        }
    }

    if (pathStarted) {
        ctx.stroke();
    }
}

function updateIsSelectedFunction() {
    const wasSelected = isSelectedFunction;
    isSelectedFunction = selectedFunction !== null;

    if (wasSelected && !isSelectedFunction) {
        toggleGray();
    } else if (!wasSelected && isSelectedFunction) {
        toggleClickable();
    }
}

function numericalIntegral(func, x, h = 0.001) {
    if (x === 0) return 0;

    const steps = Math.abs(x) / h;
    const stepSize = x / steps;
    let sum = 0;

    for (let i = 0; i < steps; i++) {
        const t = i * stepSize;
        const y = evaluateFunction(func, t);
        if (!isNaN(y) && isFinite(y)) {
            sum += y * stepSize;
        }
    }

    return sum;
}

function createPrimitiveFunction(originalFunc) {
    const primitiveFunc = {
        compiled: (x) => numericalIntegral(originalFunc, x),
        equation: `∫${originalFunc.equation}dx`,
        color: colors[colorIndex % colors.length],
        id: Date.now(),
        name: `F(x) = ∫${originalFunc.equation}dx`,
        isPrimitive: true,
        originalFunction: originalFunc
    };
    colorIndex++;
    return primitiveFunc;
}

function calculatePrimitive() {
    if (!selectedFunction) return;
    const primitiveFunc = createPrimitiveFunction(selectedFunction);
    functions.push(primitiveFunc);
    updateFunctionList();
    draw();
}

function createDerivativeFunction(originalFunc) {
    const derivativeFunc = {
        compiled: (x) => numericalDerivative(originalFunc, x),
        equation: `${originalFunc.equation}'`,
        color: colors[colorIndex % colors.length],
        id: Date.now(),
        name: `g'(x) = ${originalFunc.equation}'`,
        isDerivative: true,
        originalFunction: originalFunc
    };
    colorIndex++;
    return derivativeFunc;
}

function createInverseFunction(originalFunc) {
    const inverseFunc = {
        compiled: (x) => {
            const y = evaluateFunction(originalFunc, x);
            if (isNaN(y) || !isFinite(y) || y === 0) return NaN;
            return 1 / y;
        },
        equation: `1/(${originalFunc.equation})`,
        color: colors[colorIndex % colors.length],
        id: Date.now(),
        name: `h(x) = 1/(${originalFunc.equation})`,
        isInverse: true,
        originalFunction: originalFunc
    };
    colorIndex++;
    return inverseFunc;
}

function calculateDerivative() {
    const derivativeFunc = createDerivativeFunction(selectedFunction);
    functions.push(derivativeFunc);
    updateFunctionList();
    draw();
}

function calculateInverse() {
    const inverseFunc = createInverseFunction(selectedFunction);
    functions.push(inverseFunc);
    updateFunctionList();
    draw();
}

function draw() {
    requestAnimationFrame(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawAxes();
        functions.forEach(func => drawFunction(func));
        updateZoomInfo();
    });
}

function addFunction() {
    const equation = equationInput.value.trim();
    if (!equation) return;

    try {
        const color = colors[colorIndex % colors.length];
        colorIndex++;

        const funcMap = {
            arcsin: 'Math.asin',
            arccos: 'Math.acos',
            arctan: 'Math.atan',
            sin: 'Math.sin',
            cos: 'Math.cos',
            tan: 'Math.tan',
            ch: 'Math.cosh',
            sh: 'Math.sinh',
            th: 'Math.tanh',
            argch: 'Math.acosh',
            argsh: 'Math.asinh',
            argth: 'Math.atanh',
            log: 'Math.log10',
            ln: 'Math.log',
            sqrt: 'Math.sqrt',
            abs: 'Math.abs'
        };

        const constMap = {
            pi: 'Math.PI',
            e: 'Math.E'
        };

        let jsExpr = equation
            .replace(/(\d)([a-zA-Z\(])/g, '$1*$2')
            .replace(/(pi|e)([a-zA-Z\(])/g, '$1*$2')
            .replace(/\^/g, '**')
            .replace(/\²/g, '**2')
            .replace(/\b([a-zA-Z]+)\b/g, (match) => {
                if (funcMap[match]) return funcMap[match];
                if (constMap[match]) return constMap[match];
                return match;
            });

        const compiled = new Function('x', `return ${jsExpr};`);

        const func = {
            equation,
            compiled,
            color,
            id: Date.now(),
            name: `g(x) = ${equation}`,
            isDerivative: false
        };

        functions.push(func);
        updateFunctionList();
        draw();
        equationInput.value = '';
    } catch (err) {
        alert("Erreur dans l'expression : " + err.message);
    }
}

function removeFunction(id) {
    functions = functions.filter(f => f.id !== id);
    if (selectedFunction && selectedFunction.id === id) {
        selectedFunction = null;
    }
    updateIsSelectedFunction();
    updateFunctionList();
    draw();
}

function toggleFunctionSelection(id, event) {
    event.stopPropagation();

    const func = functions.find(f => f.id === id);
    if (!func) return;

    if (selectedFunction && selectedFunction.id === id) {
        selectedFunction = null;
    } else {
        selectedFunction = func;
    }

    updateIsSelectedFunction();
    updateFunctionList();
    draw();
}

function updateFunctionList() {
    functionList.innerHTML = functions.map(func => `
        <div class="function-item ${selectedFunction && selectedFunction.id === func.id ? 'selected' : ''}" 
             onclick="toggleFunctionSelection(${func.id}, event)">
            <div class="function-color" style="background-color: ${func.color}"></div>
            <div class="function-text">
                ${convertLatex(func.name)}
            </div>
            <div class="function-buttons">
                <button class="function-btn delete-btn" onclick="removeFunction(${func.id}); event.stopPropagation()">
                    <img class="btn-img" src="img/close.png">
                </button>
            </div>
        </div>
    `).join('');

    MathJax.typeset();
}

function convertLatex(text) {
    text = text.replace(/sqrt\(([^)]+)\)/g, function (_, inner) {
        return `\\sqrt{${inner}}`;
    });
    text = text.replace(/e\^([^\s]+)/g, function (_, inner) {
        return `e^{${inner}}`;
    });
    text = text.replace(/ln\(([^)]+)\)/g, function (_, inner) {
        return `\\ln{${inner}}`;
    });
    text = text.replace(/(\w+)\^2/g, function (_, inner) {
        return `${inner}^{2}`;
    });
    const trigFunctions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot'];
    trigFunctions.forEach(func => {
        const regex = new RegExp(`${func}\\(([^)]+)\\)`, 'g');
        text = text.replace(regex, function (_, inner) {
            return `\\${func}{${inner}}`;
        });
    });
    return `<span class="mathjax-latex">\\(${text}\\)</span>`;
}

function clearAll() {
    functions = [];
    selectedFunction = null;
    updateIsSelectedFunction();
    updateFunctionList();
    draw();
}

function resetView() {
    scale = 50;
    offsetX = 0;
    offsetY = 0;
    draw();
}

function zoomIn() {
    scale *= 1.2;
    draw();
}

function zoomOut() {
    scale /= 1.2;
    draw();
}

function toggleGrid() {
    showGrid = !showGrid;
    draw();
}

function updateZoomInfo() {
    const zoomLevel = (scale / 50).toFixed(1);
    zoomInfo.textContent = `Zoom: ${zoomLevel}x | Grille: ${showGrid ? 'ON' : 'OFF'}`;
}

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        offsetX += deltaX;
        offsetY += deltaY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mouseX = (e.clientX - rect.left) * dpr;
    const mouseY = (e.clientY - rect.top) * dpr;

    const worldPos = screenToWorld(mouseX / dpr, mouseY / dpr);

    const scaleFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    scale *= scaleFactor;

    const newScreenPos = worldToScreen(worldPos.x, worldPos.y);
    offsetX += mouseX - newScreenPos.x * dpr;
    offsetY += mouseY - newScreenPos.y * dpr;

    draw();
});

equationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addFunction();
    }
});

document.querySelector('.derivate').addEventListener('click', () => {
    calculateDerivative();
});

document.querySelector('.inverse').addEventListener('click', () => {
    calculateInverse();
});

document.querySelector('.primitive').addEventListener('click', () => {
    calculatePrimitive();
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

resizeCanvas();