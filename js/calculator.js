// Modern Calculator Logic & Robust Keyboard Integration (Native World-Class Modal)
let calcMemoryValue = 0;
let calcKeydownHandler = null;

const arabicToEngMap = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '٫': '.', '٬': '.', '،': '.',
    '÷': '/', '×': '*', '−': '-', '+': '+'
};

// Map keys to DOM button IDs for visual press feedback
const keyToButtonIdMap = {
    '0': 'calcKey-0',
    '1': 'calcKey-1',
    '2': 'calcKey-2',
    '3': 'calcKey-3',
    '4': 'calcKey-4',
    '5': 'calcKey-5',
    '6': 'calcKey-6',
    '7': 'calcKey-7',
    '8': 'calcKey-8',
    '9': 'calcKey-9',
    '.': 'calcKey-dot',
    '+': 'calcKey-add',
    '-': 'calcKey-subtract',
    '*': 'calcKey-multiply',
    '/': 'calcKey-divide',
    '%': 'calcKey-percent',
    '=': 'calcKey-equals',
    'Enter': 'calcKey-equals',
    'Backspace': 'calcKey-backspace',
    'Delete': 'calcKey-c',
    'c': 'calcKey-c',
    'C': 'calcKey-c'
};

function flashKeyButton(keyOrCode) {
    const btnId = keyToButtonIdMap[keyOrCode];
    if (btnId) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.classList.add('calc-btn-pressed');
            setTimeout(() => btn.classList.remove('calc-btn-pressed'), 120);
        }
    }
}

export function appendToCalc(val) {
    const display = document.getElementById("calcDisplay");
    if (!display) return;
    
    // Normalize val if arabic
    if (arabicToEngMap[val]) val = arabicToEngMap[val];
    
    const current = display.value;
    const lastChar = current.slice(-1);
    
    if (val === "." && current.split(/[\+\-\*\/]/).pop().includes(".")) {
        return;
    }
    
    if (["+", "*", "/"].includes(val) && current === "") {
        return;
    }

    if (["+", "-", "*", "/"].includes(val) && ["+", "-", "*", "/"].includes(lastChar)) {
        display.value = current.slice(0, -1) + val;
        return;
    }

    display.value += val;
    display.scrollLeft = display.scrollWidth;
}

export function clearCalc() {
    const display = document.getElementById("calcDisplay");
    const historyEl = document.getElementById("calcHistory");
    if (display) display.value = "";
    if (historyEl) historyEl.textContent = "";
}

export function backspaceCalc() {
    const display = document.getElementById("calcDisplay");
    if (display && display.value.length > 0) {
        display.value = display.value.slice(0, -1);
    }
}

export function calcToggleSign() {
    const display = document.getElementById("calcDisplay");
    if (!display || !display.value.trim()) return;
    let val = display.value.trim();
    if (val.startsWith("-")) {
        display.value = val.substring(1);
    } else {
        display.value = "-" + val;
    }
}

export function calcMemoryClear() {
    calcMemoryValue = 0;
    updateMemoryUI();
}

export function calcMemoryRecall() {
    if (calcMemoryValue !== 0) {
        appendToCalc(String(calcMemoryValue));
    }
}

export function calcMemoryAdd() {
    const display = document.getElementById("calcDisplay");
    if (!display) return;
    try {
        calculate();
        const currentVal = parseFloat(display.value) || 0;
        calcMemoryValue += currentVal;
        updateMemoryUI();
    } catch(e) {}
}

function updateMemoryUI() {
    const badge = document.getElementById("calcMemBadge");
    if (badge) {
        if (calcMemoryValue !== 0) {
            badge.classList.remove("hidden");
            badge.title = `قيمة الذاكرة: ${calcMemoryValue}`;
        } else {
            badge.classList.add("hidden");
        }
    }
}

export function calculate() {
    const display = document.getElementById("calcDisplay");
    const historyEl = document.getElementById("calcHistory");
    if (!display || !display.value.trim()) return;

    try {
        let rawExpr = display.value.trim();
        if (historyEl) historyEl.textContent = rawExpr + " =";
        
        let expression = rawExpr.replace(/×/g, "*").replace(/÷/g, "/");
        if (!/^[0-9+\-*/(). %]+$/.test(expression)) {
            throw new Error("عملية غير صالحة");
        }
        
        // Handle percentages e.g. 50% -> (50/100)
        expression = expression.replace(/([0-9.]+)%/g, "($1/100)");
        
        // Safe evaluation
        const result = Function(`'use strict'; return (${expression})`)();
        if (!isFinite(result)) {
            throw new Error("النتيجة غير محددة");
        }
        
        display.value = Number.isInteger(result) ? String(result) : parseFloat(result.toFixed(6)).toString();
    } catch (e) {
        if (historyEl) historyEl.textContent = "خطأ في العملية";
        display.value = "";
    }
}

export async function copyCalcResult() {
    const display = document.getElementById("calcDisplay");
    const copyBtn = document.getElementById("calcCopyBtn");
    const copyText = document.getElementById("calcCopyText");
    if (!display || !display.value) return;

    try {
        await navigator.clipboard.writeText(display.value);
        if (copyBtn) {
            copyBtn.classList.add("copied");
            if (copyText) copyText.textContent = "تم النسخ!";
            setTimeout(() => {
                copyBtn.classList.remove("copied");
                if (copyText) copyText.textContent = "نسخ";
            }, 1600);
        }
    } catch (err) {
        console.error("Failed to copy:", err);
    }
}

// Global Keyboard Handler for Calculator
export function handleCalculatorKey(e) {
    const display = document.getElementById("calcDisplay");
    if (!display) return false;

    let key = e.key;
    const code = e.code || "";

    // Convert Arabic numerals & symbols
    if (arabicToEngMap[key]) {
        key = arabicToEngMap[key];
    }

    // Numbers 0-9
    if (key >= "0" && key <= "9") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton(key);
        appendToCalc(key);
        return true;
    }

    // Numpad 0-9
    if (code.startsWith("Numpad") && code.length === 7 && code[6] >= "0" && code[6] <= "9") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton(code[6]);
        appendToCalc(code[6]);
        return true;
    }

    // Math Operators
    if (["+", "-", "*", "/", "(", ")", "%"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton(key);
        appendToCalc(key);
        return true;
    }

    if (code === "NumpadAdd") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton('+');
        appendToCalc("+");
        return true;
    }
    if (code === "NumpadSubtract") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton('-');
        appendToCalc("-");
        return true;
    }
    if (code === "NumpadMultiply") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton('*');
        appendToCalc("*");
        return true;
    }
    if (code === "NumpadDivide") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton('/');
        appendToCalc("/");
        return true;
    }
    if (code === "NumpadDecimal" || key === "." || key === "٫" || key === "،") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton('.');
        appendToCalc(".");
        return true;
    }

    // Enter / Equals / Calculation
    if (key === "Enter" || key === "=" || code === "NumpadEnter" || code === "Enter" || (code === "Equal" && !e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton('Enter');
        calculate();
        return true;
    }

    // Backspace
    if (key === "Backspace" || code === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton('Backspace');
        backspaceCalc();
        return true;
    }

    // Delete or Clear (C / c / Delete / ؤ)
    if (key === "Delete" || code === "Delete" || key.toLowerCase() === "c" || key === "ؤ" || code === "KeyC") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        flashKeyButton('c');
        clearCalc();
        return true;
    }

    // Escape - close modal
    if (key === "Escape" || code === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        closeCalculatorModal();
        return true;
    }

    return false;
}

export function attachCalculatorKeyboard() {
    detachCalculatorKeyboard();
    
    calcKeydownHandler = (e) => {
        const modal = document.getElementById("managelyCalcModal");
        if (!modal || !modal.classList.contains("active")) return;
        handleCalculatorKey(e);
    };
    
    window.addEventListener("keydown", calcKeydownHandler, true);
    document.addEventListener("keydown", calcKeydownHandler, true);
}

export function detachCalculatorKeyboard() {
    if (calcKeydownHandler) {
        window.removeEventListener("keydown", calcKeydownHandler, true);
        document.removeEventListener("keydown", calcKeydownHandler, true);
        calcKeydownHandler = null;
    }
}

export function injectCalculatorModal() {
    let modal = document.getElementById("managelyCalcModal");
    if (modal) return modal;

    const modalHtml = `
    <div id="managelyCalcModal" class="calc-modal-backdrop" onclick="handleCalcBackdropClick(event)">
        <div class="calc-modal-wrapper">
            <div class="calc-modal-card" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="calc-card-header">
                    <div class="calc-header-brand">
                        <div class="calc-icon-box">
                            <i class="fas fa-calculator"></i>
                        </div>
                        <div class="calc-title-group">
                            <h3 class="calc-title">آلة حاسبة ذكية</h3>
                            <span class="calc-subtitle">Managely Smart Calc</span>
                        </div>
                    </div>
                    <div class="calc-header-actions">
                        <span class="calc-kb-badge">
                            <span class="calc-kb-pulse"></span>
                            الكيبورد مفعل
                        </span>
                        <button type="button" class="calc-close-btn" onclick="closeCalculatorModal()" title="إغلاق (Esc)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- OLED Screen -->
                <div class="calc-screen-wrap">
                    <div class="calc-screen-header">
                        <div class="calc-mode-indicator">
                            <span class="calc-pill-tag">STD</span>
                            <span id="calcMemBadge" class="calc-mem-tag hidden">M</span>
                        </div>
                        <div class="calc-screen-actions">
                            <div id="calcHistory" class="calc-history-stream"></div>
                            <button type="button" id="calcCopyBtn" class="calc-copy-btn" onclick="copyCalcResult()" title="نسخ النتيجة">
                                <i class="fas fa-copy"></i>
                                <span id="calcCopyText">نسخ</span>
                            </button>
                        </div>
                    </div>
                    <div class="calc-screen-body">
                        <input type="text" id="calcDisplay" class="calc-main-lcd" placeholder="0" readonly autocomplete="off" />
                    </div>
                </div>

                <!-- Memory & Tools Toolbar -->
                <div class="calc-quick-toolbar">
                    <button type="button" onclick="calcMemoryClear()" class="calc-btn-tool" title="مسح الذاكرة (MC)">MC</button>
                    <button type="button" onclick="calcMemoryRecall()" class="calc-btn-tool" title="استرجاع الذاكرة (MR)">MR</button>
                    <button type="button" onclick="calcMemoryAdd()" class="calc-btn-tool" title="إضافة للذاكرة (M+)">M+</button>
                    <button type="button" onclick="calcToggleSign()" class="calc-btn-tool" title="تبديل الإشارة (±)">±</button>
                    <button type="button" onclick="appendToCalc('(')" class="calc-btn-tool" title="قوس فتح (">(</button>
                    <button type="button" onclick="appendToCalc(')')" class="calc-btn-tool" title="قوس إغلاق )">)</button>
                </div>

                <!-- Keypad Grid (4 columns) -->
                <div class="calc-keypad-grid">
                    <!-- Row 1 -->
                    <button type="button" id="calcKey-c" onclick="clearCalc()" class="calc-btn calc-btn-clear" title="مسح شامل (C / Delete)">
                        <span>C</span>
                    </button>
                    <button type="button" id="calcKey-backspace" onclick="backspaceCalc()" class="calc-btn calc-btn-backspace" title="مسح خانة (Backspace)">
                        <i class="fas fa-delete-left"></i>
                    </button>
                    <button type="button" id="calcKey-percent" onclick="appendToCalc('%')" class="calc-btn calc-btn-op-secondary" title="نسبة مئوية (%)">
                        <span>%</span>
                    </button>
                    <button type="button" id="calcKey-divide" onclick="appendToCalc('/')" class="calc-btn calc-btn-op" title="قسمة (/)">
                        <span>÷</span>
                    </button>

                    <!-- Row 2 -->
                    <button type="button" id="calcKey-7" onclick="appendToCalc('7')" class="calc-btn calc-btn-num"><span>7</span></button>
                    <button type="button" id="calcKey-8" onclick="appendToCalc('8')" class="calc-btn calc-btn-num"><span>8</span></button>
                    <button type="button" id="calcKey-9" onclick="appendToCalc('9')" class="calc-btn calc-btn-num"><span>9</span></button>
                    <button type="button" id="calcKey-multiply" onclick="appendToCalc('*')" class="calc-btn calc-btn-op" title="ضرب (*)">
                        <span>×</span>
                    </button>

                    <!-- Row 3 -->
                    <button type="button" id="calcKey-4" onclick="appendToCalc('4')" class="calc-btn calc-btn-num"><span>4</span></button>
                    <button type="button" id="calcKey-5" onclick="appendToCalc('5')" class="calc-btn calc-btn-num"><span>5</span></button>
                    <button type="button" id="calcKey-6" onclick="appendToCalc('6')" class="calc-btn calc-btn-num"><span>6</span></button>
                    <button type="button" id="calcKey-subtract" onclick="appendToCalc('-')" class="calc-btn calc-btn-op" title="طرح (-)">
                        <span>−</span>
                    </button>

                    <!-- Row 4 -->
                    <button type="button" id="calcKey-1" onclick="appendToCalc('1')" class="calc-btn calc-btn-num"><span>1</span></button>
                    <button type="button" id="calcKey-2" onclick="appendToCalc('2')" class="calc-btn calc-btn-num"><span>2</span></button>
                    <button type="button" id="calcKey-3" onclick="appendToCalc('3')" class="calc-btn calc-btn-num"><span>3</span></button>
                    <button type="button" id="calcKey-add" onclick="appendToCalc('+')" class="calc-btn calc-btn-op" title="جمع (+)">
                        <span>+</span>
                    </button>

                    <!-- Row 5 -->
                    <button type="button" id="calcKey-00" onclick="appendToCalc('00')" class="calc-btn calc-btn-num"><span>00</span></button>
                    <button type="button" id="calcKey-0" onclick="appendToCalc('0')" class="calc-btn calc-btn-num"><span>0</span></button>
                    <button type="button" id="calcKey-dot" onclick="appendToCalc('.')" class="calc-btn calc-btn-num" title="علامة عشرية (.)"><span>.</span></button>
                    <button type="button" id="calcKey-equals" onclick="calculate()" class="calc-btn calc-btn-equals" title="حساب (Enter / =)">
                        <span>=</span>
                    </button>
                </div>

                <!-- Footer Shortcuts Guide -->
                <div class="calc-modal-footer">
                    <div class="calc-shortcut-pill"><span>Enter</span> = حساب</div>
                    <div class="calc-shortcut-pill"><span>C</span> = مسح</div>
                    <div class="calc-shortcut-pill"><span>⌫</span> = تراجع</div>
                    <div class="calc-shortcut-pill"><span>Esc</span> = إغلاق</div>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    return document.getElementById("managelyCalcModal");
}

export function openCalculatorModal() {
    const modal = injectCalculatorModal();
    if (!modal) return;

    modal.classList.add("active");
    attachCalculatorKeyboard();
    
    // Focus or prepare display
    const display = document.getElementById("calcDisplay");
    if (display && !display.value) {
        display.value = "";
    }
}

export function closeCalculatorModal() {
    const modal = document.getElementById("managelyCalcModal");
    if (modal) {
        modal.classList.remove("active");
    }
    detachCalculatorKeyboard();
}

export function handleCalcBackdropClick(e) {
    if (e.target.id === "managelyCalcModal") {
        closeCalculatorModal();
    }
}

export function openCalculatorPopup() {
    openCalculatorModal();
}

if (typeof window !== "undefined") {
    window.appendToCalc = appendToCalc;
    window.clearCalc = clearCalc;
    window.backspaceCalc = backspaceCalc;
    window.calculate = calculate;
    window.calcToggleSign = calcToggleSign;
    window.calcMemoryClear = calcMemoryClear;
    window.calcMemoryRecall = calcMemoryRecall;
    window.calcMemoryAdd = calcMemoryAdd;
    window.copyCalcResult = copyCalcResult;
    window.openCalculatorModal = openCalculatorModal;
    window.closeCalculatorModal = closeCalculatorModal;
    window.handleCalcBackdropClick = handleCalcBackdropClick;
    window.attachCalculatorKeyboard = attachCalculatorKeyboard;
    window.detachCalculatorKeyboard = detachCalculatorKeyboard;
    window.openCalculatorPopup = openCalculatorModal;
}