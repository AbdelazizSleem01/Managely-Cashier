import './updater-ui.js';

// User-Friendly Error & Alert Handler
export function formatUserFriendlyMessage(args) {
    let opts = {};
    if (typeof args[0] === "string") {
        opts = {
            title: args[0],
            text: args[1] || "",
            icon: args[2] || undefined
        };
    } else if (typeof args[0] === "object" && args[0] !== null) {
        opts = { ...args[0] };
    }

    let title = opts.title || "";
    let text = opts.text || "";
    const fullStr = `${title} ${text}`.trim();

    const technicalTranslations = [
        { regex: /network\s*error|failed\s*to\s*fetch|timeout|econnrefused|خادم الترخيص|net::err/i, title: "تعذر الاتصال", text: "يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً." },
        { regex: /access\s*is\s*denied|eacces|permission\s*denied|ebusy/i, title: "تنبيه في الصلاحيات", text: "تعذر الوصول لبعض الملفات، يرجى تشغيل البرنامج كمسؤول (Run as Administrator)." },
        { regex: /enoent|file\s*not\s*found|الملف غير موجود/i, title: "الملف غير موجود", text: "تعذر العثور على الملف المطلوب في المسار المحدد." },
        { regex: /electronapi.*unavailable|updatecategory.*not available|cannot read propert/i, title: "تنبيه", text: "يرجى إعادة تشغيل التطبيق للمتابعة بشكل سليم." },
        { regex: /field.*empty/i, title: "بيانات غير مكتملة", text: "يرجى ملء جميع الحقول المطلوبة قبل المتابعة." },
        { regex: /العميل موجود/i, title: "عميل مسجل مسبقاً", text: "يوجد عميل مسجل بالفعل بنفس الاسم، يرجى التحقق من الاسم." },
        { regex: /الباركود مستخدم|barcode.*exists/i, title: "باركود مستخدم", text: "هذا الباركود مسجل مسبقاً لمنتج آخر، يرجى اختيار باركود مختلف." },
        { regex: /اسم الفئة موجود|category.*exists/i, title: "فئة مسجلة مسبقاً", text: "اسم هذه الفئة مسجل بالفعل، يرجى اختيار اسم آخر." },
        { regex: /فشل في تشغيل الكاميرا|كاميرا|getUserMedia|quagga/i, title: "تعذر تشغيل الكاميرا", text: "يرجى التأكد من توصيل الكاميرا والسماح للبرنامج بالوصول إليها." },
        { regex: /طابعة|طابعات|printer|pos/i, title: "تنبيه الطابعة", text: "تعذر إتمام عملية الطباعة، يرجى التأكد من توصيل الطابعة وتشغيلها." },
        { regex: /لا يمكن تعليق فاتورة فارغة/i, title: "فاتورة فارغة", text: "لا يمكن تعليق فاتورة بدون إضافة أي منتجات." },
        { regex: /المورد غير موجود|لم يتم العثور على المورد/i, title: "تنبيه", text: "تعذر العثور على بيانات المورد المطلوب." },
        { regex: /الفاتورة غير موجودة|لم يتم العثور على الفاتورة/i, title: "تنبيه", text: "تعذر العثور على الفاتورة المحددة." },
        { regex: /المنتج غير موجود|لم يتم العثور على المنتج/i, title: "تنبيه", text: "تعذر العثور على بيانات المنتج المطلوب." },
        { regex: /لا توجد منتجات صالحة للمرتجع|يرجى اختيار منتجات للمرتجع/i, title: "تنبيه المرتجع", text: "يرجى تحديد المنتجات والكميات المراد إرجاعها." },
        { regex: /كلمة المرور مطلوبة/i, title: "تنبيه", text: "يرجى إدخال كلمة المرور للمتابعة." },
        { regex: /كلمتا المرور غير متطابقتين/i, title: "تنبيه", text: "كلمتا المرور غير متطابقتين، يرجى إعادة التحقق." },
        { regex: /كلمة المرور يجب أن تكون 6 أحرف/i, title: "تنبيه", text: "يجب ألا تقل كلمة المرور عن 6 أحرف." },
        { regex: /كلمة المرور غير صحيحة/i, title: "بيانات غير صحيحة", text: "كلمة المرور المدخلة غير صحيحة، يرجى المحاولة مجدداً." },
        { regex: /النظام لا يدعم التعديل|updateCategory is not available/i, title: "تنبيه", text: "تعذر إتمام عملية التعديل حالياً، يرجى المحاولة لاحقاً." }
    ];

    for (const item of technicalTranslations) {
        if (item.regex.test(fullStr)) {
            opts.title = item.title;
            if (!text || text.length < 5) {
                opts.text = item.text;
            }
            break;
        }
    }

    if (opts.text && typeof opts.text === "string") {
        opts.text = opts.text
            .replace(/^Error:\s*/i, "")
            .replace(/^TypeError:\s*/i, "")
            .replace(/^ReferenceError:\s*/i, "")
            .replace(/^حدث خطأ أثناء\s*/, "تعذر ")
            .replace(/^فشل في\s*/, "تعذر ")
            .replace(/^فشل\s*/, "تعذر ")
            .replace(/\[object Object\]/g, "بيانات غير صالحة");
    }

    if (opts.title === "خطأ!" || opts.title === "خطأ" || opts.title === "Error" || opts.title === "Error!") {
        opts.title = "تنبيه";
    }

    return opts;
}

export function initSweetAlertWrapper() {
    if (typeof window !== "undefined" && typeof window.Swal !== "undefined" && window.Swal.fire && !window.Swal._isCustomWrapped) {
        const originalFire = window.Swal.fire.bind(window.Swal);
        window.Swal.fire = function(...args) {
            try {
                const formatted = formatUserFriendlyMessage(args);
                return originalFire(formatted);
            } catch (e) {
                return originalFire(...args);
            }
        };
        window.Swal._isCustomWrapped = true;
    }
}

export function markFieldInvalid(el, msg = "هذا الحقل مطلوب، يرجى إدخال البيانات.") {
    if (!el) return;
    el.classList.add("field-invalid");
    
    // Also mark custom-select-trigger if exists
    if (el.dataset.customSelectInitialized === "true" && el.parentElement) {
        const trigger = el.parentElement.querySelector(".custom-select-trigger");
        if (trigger) trigger.classList.add("field-invalid");
    }

    const parent = el.closest(".form-control") || (el.parentElement && el.parentElement.classList.contains("custom-select-wrapper") ? el.parentElement.parentElement : el.parentElement);
    if (parent) {
        let errEl = parent.querySelector(".field-error-text");
        if (!errEl) {
            errEl = document.createElement("span");
            errEl.className = "field-error-text";
            parent.appendChild(errEl);
        }
        errEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    }

    const clearHandler = () => {
        el.classList.remove("field-invalid");
        if (el.dataset.customSelectInitialized === "true" && el.parentElement) {
            const trigger = el.parentElement.querySelector(".custom-select-trigger");
            if (trigger) trigger.classList.remove("field-invalid");
        }
        if (parent) {
            const errEl = parent.querySelector(".field-error-text");
            if (errEl) errEl.remove();
        }
        el.removeEventListener("input", clearHandler);
        el.removeEventListener("change", clearHandler);
    };

    el.addEventListener("input", clearHandler);
    el.addEventListener("change", clearHandler);
}

export function clearFieldInvalid(el) {
    if (!el) return;
    el.classList.remove("field-invalid");
    if (el.dataset.customSelectInitialized === "true" && el.parentElement) {
        const trigger = el.parentElement.querySelector(".custom-select-trigger");
        if (trigger) trigger.classList.remove("field-invalid");
    }
    const parent = el.closest(".form-control") || (el.parentElement && el.parentElement.classList.contains("custom-select-wrapper") ? el.parentElement.parentElement : el.parentElement);
    if (parent) {
        const errEl = parent.querySelector(".field-error-text");
        if (errEl) errEl.remove();
    }
}

/* ==========================================================================
   Universal Custom Select Dropdown Enhancer
   ========================================================================== */
export function initCustomSelect(selectEl) {
    if (!selectEl || selectEl.dataset.customSelectInitialized === "true") {
        return;
    }
    if (selectEl.tagName && selectEl.tagName.toLowerCase() !== "select") return;

    // Ignore SweetAlert2 internal elements and elements with data-no-custom-select
    if (
        selectEl.classList.contains("swal2-select") ||
        (selectEl.closest && selectEl.closest(".swal2-container, .swal2-popup")) ||
        selectEl.hasAttribute("data-no-custom-select")
    ) {
        return;
    }

    selectEl.dataset.customSelectInitialized = "true";

    // Create wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "custom-select-wrapper";
    
    // Mirror dimensions and flex styles
    if (selectEl.classList.contains("w-full")) wrapper.classList.add("w-full");
    if (selectEl.classList.contains("field-invalid")) wrapper.classList.add("field-invalid");

    // Replace in DOM
    const parent = selectEl.parentNode;
    if (!parent) return;
    parent.insertBefore(wrapper, selectEl);
    wrapper.appendChild(selectEl);

    // Create trigger
    const trigger = document.createElement("div");
    trigger.className = "custom-select-trigger";
    trigger.setAttribute("tabindex", "0");
    if (selectEl.classList.contains("field-invalid")) trigger.classList.add("field-invalid");
    if (selectEl.disabled) trigger.classList.add("is-disabled");

    const textSpan = document.createElement("span");
    textSpan.className = "custom-select-trigger-text";

    const arrowSpan = document.createElement("span");
    arrowSpan.className = "custom-select-trigger-arrow";
    arrowSpan.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

    trigger.appendChild(textSpan);
    trigger.appendChild(arrowSpan);
    wrapper.appendChild(trigger);

    // Create dropdown menu
    const dropdown = document.createElement("div");
    dropdown.className = "custom-select-dropdown";
    wrapper.appendChild(dropdown);

    function buildOptions() {
        dropdown.innerHTML = "";
        const options = Array.from(selectEl.options);

        const selectedOpt = selectEl.options[selectEl.selectedIndex] || options[0];
        textSpan.textContent = selectedOpt ? selectedOpt.textContent : "اختر...";

        options.forEach((opt, idx) => {
            const optDiv = document.createElement("div");
            optDiv.className = "custom-select-option";
            if (opt.disabled) optDiv.classList.add("is-disabled");
            if (idx === selectEl.selectedIndex) optDiv.classList.add("is-selected");

            const labelSpan = document.createElement("span");
            labelSpan.textContent = opt.textContent;
            optDiv.appendChild(labelSpan);

            if (idx === selectEl.selectedIndex) {
                const checkIcon = document.createElement("i");
                checkIcon.className = "fas fa-check custom-select-option-check";
                optDiv.appendChild(checkIcon);
            }

            optDiv.addEventListener("click", (e) => {
                e.stopPropagation();
                if (opt.disabled) return;

                selectEl.selectedIndex = idx;
                selectEl.value = opt.value;

                textSpan.textContent = opt.textContent;
                closeAllCustomSelects();

                selectEl.dispatchEvent(new Event("input", { bubbles: true }));
                selectEl.dispatchEvent(new Event("change", { bubbles: true }));
                if (typeof selectEl.onchange === "function") {
                    selectEl.onchange(new Event("change"));
                }

                clearFieldInvalid(selectEl);
            });

            dropdown.appendChild(optDiv);
        });
    }

    buildOptions();

    // Toggle dropdown
    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        if (selectEl.disabled) return;

        const isOpen = dropdown.classList.contains("is-open");
        closeAllCustomSelects();
        if (!isOpen) {
            dropdown.classList.add("is-open");
            trigger.classList.add("is-open");
        }
    });

    // Keyboard support
    trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            trigger.click();
        } else if (e.key === "Escape") {
            closeAllCustomSelects();
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!dropdown.classList.contains("is-open")) {
                trigger.click();
            } else {
                const enabledOpts = Array.from(selectEl.options).filter(o => !o.disabled);
                const currIdx = enabledOpts.findIndex(o => o.value === selectEl.value);
                let nextIdx = e.key === "ArrowDown" ? currIdx + 1 : currIdx - 1;
                if (nextIdx >= 0 && nextIdx < enabledOpts.length) {
                    const target = enabledOpts[nextIdx];
                    selectEl.value = target.value;
                    selectEl.dispatchEvent(new Event("change", { bubbles: true }));
                    buildOptions();
                }
            }
        }
    });

    // Observe changes to select
    const observer = new MutationObserver(() => {
        buildOptions();
        if (selectEl.classList.contains("field-invalid")) {
            trigger.classList.add("field-invalid");
        } else {
            trigger.classList.remove("field-invalid");
        }
        if (selectEl.disabled) {
            trigger.classList.add("is-disabled");
        } else {
            trigger.classList.remove("is-disabled");
        }
    });

    observer.observe(selectEl, { childList: true, attributes: true, subtree: true });

    selectEl._syncCustomSelect = function() {
        buildOptions();
    };
}

export function closeAllCustomSelects() {
    document.querySelectorAll(".custom-select-dropdown.is-open").forEach(d => d.classList.remove("is-open"));
    document.querySelectorAll(".custom-select-trigger.is-open").forEach(t => t.classList.remove("is-open"));
}

export function initAllCustomSelects(root = document) {
    if (!root || !root.querySelectorAll) return;
    if (root.classList && (root.classList.contains("swal2-container") || root.classList.contains("swal2-popup"))) {
        return;
    }
    if (root.closest && root.closest(".swal2-container, .swal2-popup")) {
        return;
    }
    const selects = root.querySelectorAll("select:not([data-custom-select-initialized='true']):not(.swal2-select)");
    selects.forEach(s => {
        if (!s.closest(".swal2-container, .swal2-popup") && !s.hasAttribute("data-no-custom-select")) {
            initCustomSelect(s);
        }
    });
}

// Hook property setters for programmatic updates to .value and .selectedIndex
if (typeof HTMLSelectElement !== "undefined" && !HTMLSelectElement._isCustomSelectHooked) {
    const origValueDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    if (origValueDescriptor && origValueDescriptor.set) {
        Object.defineProperty(HTMLSelectElement.prototype, "value", {
            get() {
                return origValueDescriptor.get.call(this);
            },
            set(v) {
                origValueDescriptor.set.call(this, v);
                if (typeof this._syncCustomSelect === "function") {
                    this._syncCustomSelect();
                }
            },
            configurable: true
        });
    }

    const origSelectedIndexDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");
    if (origSelectedIndexDescriptor && origSelectedIndexDescriptor.set) {
        Object.defineProperty(HTMLSelectElement.prototype, "selectedIndex", {
            get() {
                return origSelectedIndexDescriptor.get.call(this);
            },
            set(v) {
                origSelectedIndexDescriptor.set.call(this, v);
                if (typeof this._syncCustomSelect === "function") {
                    this._syncCustomSelect();
                }
            },
            configurable: true
        });
    }
    HTMLSelectElement._isCustomSelectHooked = true;
}

if (typeof window !== "undefined") {
    window.markFieldInvalid = markFieldInvalid;
    window.clearFieldInvalid = clearFieldInvalid;
    window.initCustomSelect = initCustomSelect;
    window.initAllCustomSelects = initAllCustomSelects;
    window.closeAllCustomSelects = closeAllCustomSelects;
    window.openCalculatorPopup = openCalculatorPopup;
}
initSweetAlertWrapper();

// Global click outside listener & DOM MutationObserver
if (typeof document !== "undefined") {
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".custom-select-wrapper")) {
            closeAllCustomSelects();
        }
    });

    const bodyObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (
                        node.classList &&
                        (node.classList.contains("swal2-container") ||
                         node.classList.contains("swal2-popup"))
                    ) {
                        continue;
                    }
                    if (node.closest && node.closest(".swal2-container, .swal2-popup")) {
                        continue;
                    }
                    if (node.tagName && node.tagName.toLowerCase() === "select") {
                        initCustomSelect(node);
                    } else if (node.querySelectorAll) {
                        initAllCustomSelects(node);
                    }
                }
            }
        }
    });

    if (document.body) {
        bodyObserver.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            bodyObserver.observe(document.body, { childList: true, subtree: true });
        });
    }
}

let categories=[],products=[],cart=[];export function saveData(){}export async function loadCategories(n){try{categories=await window.electronAPI.getCategories(),"function"==typeof n&&n()}catch(n){}}export async function loadProducts(n){try{products=await window.electronAPI.getProducts(),"function"==typeof n&&n()}catch(n){}}export async function loadCart(n){try{cart=await window.electronAPI.getCart(),"function"==typeof n&&n()}catch(n){}}async function loadSidebar(){try{const e=document.getElementById("sidebar-container");if(!e)return;if(e.querySelector("#sidebar-toggle")&&e.querySelector("#sidebar")){setupSidebarToggle();highlightActivePage();return;}const n=await fetch("../HTML/sidebar.html"),t=await n.text();e&&(e.innerHTML=t,setupSidebarToggle(),highlightActivePage())}catch(n){}}function highlightActivePage(){const n=document.body.dataset.page;document.querySelectorAll("#sidebar a[data-page]").forEach((t=>{t.dataset.page===n?t.classList.add("text-blue-200","font-bold"):t.classList.remove("text-blue-200","font-bold")}))}function setupSidebarToggle(){const n=document.getElementById("sidebar"),t=document.getElementById("sidebar-toggle"),e=document.querySelector(".main-content");t&&n&&e&&(t.addEventListener("click",(()=>{n.classList.toggle("active"),e.classList.toggle("shifted"),e.classList.toggle("sidebar-open");const a=t.querySelector("i");n.classList.contains("active")?(a.classList.remove("fa-bars"),a.classList.add("fa-times")):(a.classList.remove("fa-times"),a.classList.add("fa-bars"))})),document.addEventListener("click",(a=>{if(!n.contains(a.target)&&a.target!==t&&!t.contains(a.target)){n.classList.remove("active"),e.classList.remove("shifted"),e.classList.remove("sidebar-open");const a=t.querySelector("i");a.classList.remove("fa-times"),a.classList.add("fa-bars")}})))}async function loadFooter(){try{const n=document.getElementById("footer-container");if(!n)return;if(n.querySelector("#globalFooter")){setupFooter();return;}const t=await fetch("../HTML/footer.html");if(!t.ok)return;const e=await t.text();n.innerHTML=e,document.dispatchEvent(new Event("footerLoaded"))}catch(n){}}function setupFooter(){const n=document.getElementById("appName"),t=document.getElementById("currentDateTime"),e=document.getElementById("footerLogo");function a(){const n=(new Date).toLocaleString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"});if(t)t.textContent=n}const cachedSettings=localStorage.getItem("managely_store_settings");if(cachedSettings){try{const s=JSON.parse(cachedSettings);if(s.storeName&&n)n.textContent=s.storeName;if(s.logo&&e){e.src=s.logo;e.classList.remove("hidden");}}catch(err){}}n&&t&&e&&(window.electronAPI.getSettings().then((t=>{if(t){try{localStorage.setItem("managely_store_settings",JSON.stringify(t));}catch(e){}if(t.storeName&&n)n.textContent=t.storeName;if(t.logo&&e){e.src=t.logo;e.classList.remove("hidden");}else if(e){e.classList.add("hidden");}}})).catch((n=>{})),a(),setInterval(a,1e3))}function initializeCalculatorButton(){if(document.getElementById("floatingCalcButton"))return;const n=document.createElement("button");n.id="floatingCalcButton",n.className="btn btn-circle btn-primary shadow-lg calc-button  ",n.innerHTML='\n        <div class="tooltip " data-tip="آلة حاسبة">\n        <i class="fas fa-calculator text-xl"></i>\n        </div>\n    ',n.onclick=()=>{if(typeof window.openCalculatorPopup==="function"){window.openCalculatorPopup();}else{openCalculatorPopup();}},document.body.appendChild(n)}function openCalculatorPopup(){if(typeof window.openCalculatorPopup==="function"&&window.openCalculatorPopup!==openCalculatorPopup){window.openCalculatorPopup();return;}Swal.fire({html:`<div class="modern-calc-wrap"><div class="calc-header-bar"><div class="calc-header-title"><i class="fas fa-calculator"></i><span>آلة حاسبة ذكية</span></div><span style="font-size:0.72rem;font-weight:700;color:#a78bfa;background:#0f172a;padding:2px 8px;border-radius:6px;border:1px solid #334155;">تدعم الكيبورد</span></div><div class="calc-display-area"><div id="calcHistory" class="calc-history-line"></div><input type="text" id="calcDisplay" class="calc-main-input" placeholder="0" readonly /></div><div class="calc-keypad"><button type="button" onclick="clearCalc()" class="calc-btn-key calc-btn-clear" title="مسح (C / Delete)">C</button><button type="button" onclick="backspaceCalc()" class="calc-btn-key calc-btn-backspace" title="مسح خانة (Backspace)">⌫</button><button type="button" onclick="appendToCalc('%')" class="calc-btn-key calc-btn-util">%</button><button type="button" onclick="appendToCalc('/')" class="calc-btn-key calc-btn-op" title="قسمة (/)">÷</button><button type="button" onclick="appendToCalc('7')" class="calc-btn-key calc-btn-num">7</button><button type="button" onclick="appendToCalc('8')" class="calc-btn-key calc-btn-num">8</button><button type="button" onclick="appendToCalc('9')" class="calc-btn-key calc-btn-num">9</button><button type="button" onclick="appendToCalc('*')" class="calc-btn-key calc-btn-op" title="ضرب (*)">×</button><button type="button" onclick="appendToCalc('4')" class="calc-btn-key calc-btn-num">4</button><button type="button" onclick="appendToCalc('5')" class="calc-btn-key calc-btn-num">5</button><button type="button" onclick="appendToCalc('6')" class="calc-btn-key calc-btn-num">6</button><button type="button" onclick="appendToCalc('-')" class="calc-btn-key calc-btn-op" title="طرح (-)">-</button><button type="button" onclick="appendToCalc('1')" class="calc-btn-key calc-btn-num">1</button><button type="button" onclick="appendToCalc('2')" class="calc-btn-key calc-btn-num">2</button><button type="button" onclick="appendToCalc('3')" class="calc-btn-key calc-btn-num">3</button><button type="button" onclick="appendToCalc('+')" class="calc-btn-key calc-btn-op" title="جمع (+)">+</button><button type="button" onclick="appendToCalc('(')" class="calc-btn-key calc-btn-util">(</button><button type="button" onclick="appendToCalc('0')" class="calc-btn-key calc-btn-num">0</button><button type="button" onclick="appendToCalc('.')" class="calc-btn-key calc-btn-num">.</button><button type="button" onclick="calculate()" class="calc-btn-key calc-btn-eq" title="حساب (Enter / =)">=</button></div></div>`,showConfirmButton:false,showCloseButton:true,customClass:{popup:"calculator-swal-popup"},didOpen:()=>{if(typeof window.attachCalculatorKeyboard==="function"){window.attachCalculatorKeyboard();}},willClose:()=>{if(typeof window.detachCalculatorKeyboard==="function"){window.detachCalculatorKeyboard();}}})}document.addEventListener("DOMContentLoaded",(async()=>{initSweetAlertWrapper(),initAllCustomSelects(),await loadSidebar(),loadCategories((()=>{loadProducts((()=>{loadCart((()=>{"function"==typeof renderHomeProducts&&renderHomeProducts(),"function"==typeof renderCart&&renderCart(),"function"==typeof renderCategoryFilter&&renderCategoryFilter()}))}))})),document.addEventListener("footerLoaded",(()=>{setupFooter()})),await loadFooter(),initializeCalculatorButton()})),window.addEventListener("load",(()=>{initSweetAlertWrapper(),initAllCustomSelects(),document.getElementById("floatingCalcButton")||initializeCalculatorButton()}));