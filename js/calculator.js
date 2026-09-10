// Modern Calculator Logic & Robust Keyboard Integration
let calcHistory = "";
let calcKeydownHandler = null;

const arabicToEngMap = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '٫': '.', '٬': '.', '،': '.',
    '÷': '/', '×': '*', '−': '-', '+': '+'
};

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
        
        display.value = Number.isInteger(result) ? String(result) : parseFloat(result.toFixed(4)).toString();
    } catch (e) {
        if (typeof Swal !== "undefined") {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 1800
            });
            Toast.fire({
                icon: 'error',
                title: 'عملية حسابية غير صحيحة'
            });
        }
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
        appendToCalc(key);
        return true;
    }

    // Numpad 0-9
    if (code.startsWith("Numpad") && code.length === 7 && code[6] >= "0" && code[6] <= "9") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        appendToCalc(code[6]);
        return true;
    }

    // Math Operators
    if (["+", "-", "*", "/", "(", ")", "%"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        appendToCalc(key);
        return true;
    }

    if (code === "NumpadAdd") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        appendToCalc("+");
        return true;
    }
    if (code === "NumpadSubtract") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        appendToCalc("-");
        return true;
    }
    if (code === "NumpadMultiply") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        appendToCalc("*");
        return true;
    }
    if (code === "NumpadDivide") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        appendToCalc("/");
        return true;
    }
    if (code === "NumpadDecimal" || key === "." || key === "٫" || key === "،") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        appendToCalc(".");
        return true;
    }

    // Enter / Equals / Calculation
    if (key === "Enter" || key === "=" || code === "NumpadEnter" || code === "Enter" || (code === "Equal" && !e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        calculate();
        return true;
    }

    // Backspace
    if (key === "Backspace" || code === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        backspaceCalc();
        return true;
    }

    // Delete or Clear (C / c / Delete / ؤ)
    if (key === "Delete" || code === "Delete" || key.toLowerCase() === "c" || key === "ؤ" || code === "KeyC") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        clearCalc();
        return true;
    }

    // Escape - close modal
    if (key === "Escape" || code === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        if (typeof Swal !== "undefined" && Swal.isVisible()) {
            Swal.close();
        }
        return true;
    }

    return false;
}

export function attachCalculatorKeyboard() {
    detachCalculatorKeyboard();
    
    calcKeydownHandler = (e) => {
        if (!document.getElementById("calcDisplay")) return;
        if (typeof Swal !== "undefined" && !Swal.isVisible()) return;

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

export function openCalculatorPopup() {
    if (typeof Swal === "undefined") return;

    Swal.fire({
        html: `
        <div class="modern-calc-wrap">
            <div class="calc-header-bar">
                <div class="calc-header-title">
                    <i class="fas fa-calculator"></i>
                    <span>آلة حاسبة ذكية</span>
                </div>
                <span style="font-size:0.72rem;font-weight:700;color:#a78bfa;background:#0f172a;padding:2px 8px;border-radius:6px;border:1px solid #334155;">تدعم الكيبورد</span>
            </div>
            <div class="calc-display-area">
                <div id="calcHistory" class="calc-history-line"></div>
                <input type="text" id="calcDisplay" class="calc-main-input" placeholder="0" readonly />
            </div>
            <div class="calc-keypad">
                <button type="button" onclick="clearCalc()" class="calc-btn-key calc-btn-clear" title="مسح (C / Delete)">C</button>
                <button type="button" onclick="backspaceCalc()" class="calc-btn-key calc-btn-backspace" title="مسح خانة (Backspace)">⌫</button>
                <button type="button" onclick="appendToCalc('%')" class="calc-btn-key calc-btn-util" title="نسبة مئوية (%)">%</button>
                <button type="button" onclick="appendToCalc('/')" class="calc-btn-key calc-btn-op" title="قسمة (/)">÷</button>

                <button type="button" onclick="appendToCalc('7')" class="calc-btn-key calc-btn-num">7</button>
                <button type="button" onclick="appendToCalc('8')" class="calc-btn-key calc-btn-num">8</button>
                <button type="button" onclick="appendToCalc('9')" class="calc-btn-key calc-btn-num">9</button>
                <button type="button" onclick="appendToCalc('*')" class="calc-btn-key calc-btn-op" title="ضرب (*)">×</button>

                <button type="button" onclick="appendToCalc('4')" class="calc-btn-key calc-btn-num">4</button>
                <button type="button" onclick="appendToCalc('5')" class="calc-btn-key calc-btn-num">5</button>
                <button type="button" onclick="appendToCalc('6')" class="calc-btn-key calc-btn-num">6</button>
                <button type="button" onclick="appendToCalc('-')" class="calc-btn-key calc-btn-op" title="طرح (-)">-</button>

                <button type="button" onclick="appendToCalc('1')" class="calc-btn-key calc-btn-num">1</button>
                <button type="button" onclick="appendToCalc('2')" class="calc-btn-key calc-btn-num">2</button>
                <button type="button" onclick="appendToCalc('3')" class="calc-btn-key calc-btn-num">3</button>
                <button type="button" onclick="appendToCalc('+')" class="calc-btn-key calc-btn-op" title="جمع (+)">+</button>

                <button type="button" onclick="appendToCalc('(')" class="calc-btn-key calc-btn-util">(</button>
                <button type="button" onclick="appendToCalc('0')" class="calc-btn-key calc-btn-num">0</button>
                <button type="button" onclick="appendToCalc('.')" class="calc-btn-key calc-btn-num">.</button>
                <button type="button" onclick="calculate()" class="calc-btn-key calc-btn-eq" title="حساب (Enter / =)">=</button>
            </div>
        </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        backdrop: 'rgba(15, 23, 42, 0.8)',
        customClass: {
            popup: "calculator-swal-popup"
        },
        didOpen: () => {
            attachCalculatorKeyboard();
        },
        willClose: () => {
            detachCalculatorKeyboard();
        }
    });
}

if (typeof window !== "undefined") {
    window.appendToCalc = appendToCalc;
    window.clearCalc = clearCalc;
    window.backspaceCalc = backspaceCalc;
    window.calculate = calculate;
    window.attachCalculatorKeyboard = attachCalculatorKeyboard;
    window.detachCalculatorKeyboard = detachCalculatorKeyboard;
    window.openCalculatorPopup = openCalculatorPopup;
}