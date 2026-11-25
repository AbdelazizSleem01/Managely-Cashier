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
        window.Swal.fire = function (...args) {
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
        el.removeEventListener("focus", clearHandler);
        el.removeEventListener("keydown", clearHandler);
    };

    el.addEventListener("input", clearHandler);
    el.addEventListener("change", clearHandler);
    el.addEventListener("focus", clearHandler);
    el.addEventListener("keydown", clearHandler);
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

    selectEl._syncCustomSelect = function () {
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

let categories = [];
let products = [];
let cart = [];

export function saveData() {}

export async function loadCategories(callback) {
    try {
        categories = await window.electronAPI.getCategories();
        if (typeof callback === "function") callback();
    } catch (err) {
        console.error("Error loading categories:", err);
    }
}

export async function loadProducts(callback) {
    try {
        products = await window.electronAPI.getProducts();
        if (typeof callback === "function") callback();
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

export async function loadCart(callback) {
    try {
        cart = await window.electronAPI.getCart();
        if (typeof callback === "function") callback();
    } catch (err) {
        console.error("Error loading cart:", err);
    }
}

// ==========================================================================
// Session & Granular Permission Management System
// ==========================================================================
export const PAGE_URL_TO_KEY = {
    "index.html": "home",
    "home": "home",
    "index": "home",
    "sales-invoice.html": "salesInvoice",
    "sales-invoice": "salesInvoice",
    "invoice-page": "salesInvoice",
    "salesInvoice": "salesInvoice",
    "sales.html": "sales",
    "sales": "sales",
    "products.html": "products",
    "products": "products",
    "categories.html": "categories",
    "categories": "categories",
    "customers.html": "customers",
    "customers": "customers",
    "suppliers.html": "suppliers",
    "suppliers": "suppliers",
    "purchase-invoices.html": "purchaseInvoices",
    "purchase-invoices": "purchaseInvoices",
    "purchaseInvoices": "purchaseInvoices",
    "ProductsPurchaseInvoices.html": "productsPurchaseInvoices",
    "products-purchase-invoices.html": "productsPurchaseInvoices",
    "ProductsPurchaseInvoices": "productsPurchaseInvoices",
    "productsPurchaseInvoices": "productsPurchaseInvoices",
    "returns.html": "returns",
    "returns": "returns",
    "treasury.html": "treasury",
    "treasury": "treasury",
    "statistics.html": "statistics",
    "statistics": "statistics",
    "employees.html": "employees",
    "employees": "employees",
    "printer-settings.html": "printerSettings",
    "printer-settings": "printerSettings",
    "printerSettings": "printerSettings",
    "settings.html": "settings",
    "settings": "settings",
    "users.html": "users",
    "users": "users"
};

export const PAGE_KEY_TO_URL = {
    home: "index.html",
    salesInvoice: "sales-invoice.html",
    sales: "sales.html",
    products: "products.html",
    categories: "categories.html",
    customers: "customers.html",
    suppliers: "suppliers.html",
    purchaseInvoices: "purchase-invoices.html",
    productsPurchaseInvoices: "ProductsPurchaseInvoices.html",
    returns: "returns.html",
    treasury: "treasury.html",
    statistics: "statistics.html",
    employees: "employees.html",
    printerSettings: "printer-settings.html",
    settings: "settings.html",
    users: "users.html"
};

export function getCurrentUser() {
    try {
        const stored = localStorage.getItem("currentUser");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") return parsed;
        }
    } catch (e) {
        console.error("Error parsing currentUser from localStorage:", e);
    }
    return {
        _id: "default_super_admin",
        name: "المدير العام",
        username: "admin",
        role: "admin",
        roleName: "مدير عام",
        isSuperAdmin: true,
        permissions: {
            pages: {
                home: true,
                salesInvoice: true,
                sales: true,
                products: true,
                categories: true,
                customers: true,
                suppliers: true,
                purchaseInvoices: true,
                productsPurchaseInvoices: true,
                returns: true,
                treasury: true,
                statistics: true,
                employees: true,
                printerSettings: true,
                settings: true,
                users: true
            },
            actions: {
                canApplyDiscount: true,
                canChangePrice: true,
                canDeleteCartItem: true,
                canSuspendInvoice: true,
                canDeleteSale: true,
                canExportSales: true,
                canAddProduct: true,
                canEditProduct: true,
                canDeleteProduct: true,
                canImportProducts: true,
                canExportProducts: true,
                canAddTreasuryIncome: true,
                canAddTreasuryExpense: true,
                canDeleteTreasuryTransaction: true,
                canCreateBackup: true,
                canRestoreBackup: true,
                canManageUsers: true
            }
        }
    };
}

export function hasPermission(key, type = "action") {
    const user = getCurrentUser();
    if (!user) return true;
    if (user.isSuperAdmin || user.role === "admin") return true;

    if (type === "page") {
        const pages = user.permissions?.pages || {};
        return pages[key] === true;
    } else {
        const actions = user.permissions?.actions || {};
        return actions[key] === true;
    }
}

export function updateSidebarUserInfo() {
    const user = getCurrentUser();
    const nameEl = document.getElementById("sbUserName");
    const roleEl = document.getElementById("sbUserRole");
    const avatarEl = document.getElementById("sbUserAvatar");
    const shiftTextEl = document.getElementById("sbShiftText");

    if (nameEl) nameEl.textContent = user.name || user.username || "المستخدم";
    if (roleEl) {
        const roleIcons = {
            admin: '<i class="fas fa-crown text-amber-400"></i> مدير عام',
            cashier: '<i class="fas fa-cash-register text-sky-300"></i> كاشير',
            inventory: '<i class="fas fa-boxes-stacked text-amber-300"></i> مسؤول مخزن',
            accountant: '<i class="fas fa-briefcase text-emerald-300"></i> محاسب مالي',
            custom: '<i class="fas fa-sliders text-slate-300"></i> مخصص'
        };
        roleEl.innerHTML = roleIcons[user.role] || user.roleName || "مستخدم";
    }
    if (avatarEl) {
        const initial = (user.name || user.username || "م").trim().charAt(0);
        avatarEl.innerHTML = `<span>${initial}</span>`;
    }
    if (shiftTextEl && typeof window.getActiveShift === "function") {
        try {
            const activeShift = window.getActiveShift();
            if (activeShift) {
                shiftTextEl.textContent = `الوردية: #${activeShift.shiftNumber || 1} نشطة`;
            }
        } catch (e) {}
    }

    const verEl = document.getElementById("sbAppVersion");
    if (verEl) {
        if (window.electronAPI?.getAppVersion) {
            window.electronAPI.getAppVersion().then(v => {
                if (v) verEl.textContent = `v${v}`;
            }).catch(() => {});
        } else if (window.electronAPI?.updater?.getVersion) {
            window.electronAPI.updater.getVersion().then(v => {
                if (v) verEl.textContent = `v${v}`;
            }).catch(() => {});
        }
    }
}

export function filterSidebarLinks() {
    const user = getCurrentUser();
    if (user.isSuperAdmin || user.role === "admin") return;

    const links = document.querySelectorAll("#sidebar a[data-page]");
    links.forEach(a => {
        const dataPage = a.getAttribute("data-page");
        const href = (a.getAttribute("href") || "").replace(".html", "").replace("./", "");
        const pageKey = PAGE_URL_TO_KEY[dataPage] || PAGE_URL_TO_KEY[href] || dataPage;

        if (pageKey && !hasPermission(pageKey, "page")) {
            const li = a.closest("li");
            if (li) li.style.display = "none";
        }
    });

    // Auto-hide empty section groups
    document.querySelectorAll("#sidebar .sidebar-group").forEach(group => {
        const visibleLinks = group.querySelectorAll("li:not([style*='display: none'])");
        if (visibleLinks.length === 0) {
            group.style.display = "none";
        } else {
            group.style.display = "";
        }
    });
}

export function applyPagePermissionGuard() {
    const rawPath = window.location.pathname.split("/").pop() || "index.html";
    const currentPageFile = rawPath.replace(/^\/+/, "");
    
    // Ignore non-guarded pages
    if (currentPageFile === "login.html" || currentPageFile === "splash.html" || currentPageFile === "license.html" || currentPageFile === "") {
        return;
    }

    const pageKey = PAGE_URL_TO_KEY[currentPageFile] || PAGE_URL_TO_KEY[currentPageFile.replace(".html", "")];
    if (!pageKey) return;

    const user = getCurrentUser();
    if (!hasPermission(pageKey, "page")) {
        console.warn(`[Permission Guard] User '${user.name}' is blocked from '${pageKey}'`);

        // Find first allowed page
        let firstAllowedUrl = "index.html";
        const userPages = user.permissions?.pages || {};
        for (const [k, allowed] of Object.entries(userPages)) {
            if (allowed && PAGE_KEY_TO_URL[k]) {
                firstAllowedUrl = PAGE_KEY_TO_URL[k];
                break;
            }
        }

        Swal.fire({
            title: "عذراً، غير مسموح بالدخول",
            text: `ليس لديك صلاحية للوصول إلى شاشة (${pageKey}). سيتم تحويلك إلى الشاشة المتاحة لك.`,
            icon: "warning",
            confirmButtonText: "موافق",
            confirmButtonColor: "#6366f1",
            allowOutsideClick: false
        }).then(() => {
            window.location.href = `./${firstAllowedUrl}`;
        });
    }
}

export function logoutUser() {
    Swal.fire({
        title: "تسجيل الخروج؟",
        text: "هل أنت متأكد من رغبتك في تسجيل الخروج والعودة لشاشة الدخول؟",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "نعم، تسجيل الخروج",
        cancelButtonText: "إلغاء"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                sessionStorage.setItem("justLoggedOut", "true");
                localStorage.removeItem("currentUser");
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("managely_auth_session");
                if (window.electronAPI && window.electronAPI.clearRememberedSession) {
                    await window.electronAPI.clearRememberedSession();
                }
            } catch (e) {}
            window.location.href = "./login.html";
        }
    });
}

async function loadSidebar() {
    try {
        const e = document.getElementById("sidebar-container");
        if (!e) return;

        if (e.querySelector("#sidebar-toggle") && e.querySelector("#sidebar")) {
            setupSidebarToggle();
            highlightActivePage();
            updateSidebarUserInfo();
            filterSidebarLinks();
            applyPagePermissionGuard();
            return;
        }

        const n = await fetch("../HTML/sidebar.html");
        const t = await n.text();
        if (e) {
            e.innerHTML = t;
            setupSidebarToggle();
            highlightActivePage();
            updateSidebarUserInfo();
            filterSidebarLinks();
            applyPagePermissionGuard();
        }
    } catch (err) {
        console.error("Error loading sidebar:", err);
    }
}

function highlightActivePage() {
    const n = document.body?.dataset?.page || document.documentElement?.dataset?.page || (window.location.pathname.split("/").pop() || "").replace(".html", "") || "home";
    let normalized = n;
    if (n === "index" || n === "") normalized = "home";
    if (n === "sales-invoice") normalized = "invoice-page";

    document.querySelectorAll("#sidebar a[data-page]").forEach((t => {
        const linkPage = t.dataset.page;
        const href = (t.getAttribute("href") || "").replace(".html", "").replace("./", "");
        if (linkPage === normalized || linkPage === n || href === n || (normalized === "home" && href === "index")) {
            t.classList.add("active");
        } else {
            t.classList.remove("active");
        }
    }));
}

function setupSidebarToggle() {
    const n = document.getElementById("sidebar");
    const t = document.getElementById("sidebar-toggle");
    const closeBtn = document.getElementById("sidebar-close-btn");
    const e = document.querySelector(".main-content");

    const closeSidebar = () => {
        if (!n) return;
        n.classList.remove("active");
        if (e) {
            e.classList.remove("shifted");
            e.classList.remove("sidebar-open");
        }
        if (t) {
            const icon = t.querySelector("i");
            if (icon) {
                icon.classList.remove("fa-times");
                icon.classList.add("fa-bars");
            }
        }
    };

    const toggleSidebar = () => {
        if (!n) return;
        n.classList.toggle("active");
        if (e) {
            e.classList.toggle("shifted");
            e.classList.toggle("sidebar-open");
        }
        if (t) {
            const a = t.querySelector("i");
            if (n.classList.contains("active")) {
                if (a) {
                    a.classList.remove("fa-bars");
                    a.classList.add("fa-times");
                }
            } else {
                if (a) {
                    a.classList.remove("fa-times");
                    a.classList.add("fa-bars");
                }
            }
        }
    };

    if (t) {
        t.onclick = (ev) => {
            ev.stopPropagation();
            toggleSidebar();
        };
    }

    if (closeBtn) {
        closeBtn.onclick = (ev) => {
            ev.stopPropagation();
            closeSidebar();
        };
    }

    document.addEventListener("click", (a => {
        if (n && n.classList.contains("active")) {
            if (!n.contains(a.target) && a.target !== t && !t?.contains(a.target) && a.target !== closeBtn && !closeBtn?.contains(a.target)) {
                closeSidebar();
            }
        }
    }));
}

async function loadFooter() {
    try {
        const n = document.getElementById("footer-container");
        if (!n) return;
        if (n.querySelector("#globalFooter")) {
            setupFooter();
            return;
        }
        const t = await fetch("../HTML/footer.html");
        if (!t.ok) return;
        const e = await t.text();
        n.innerHTML = e;
        document.dispatchEvent(new Event("footerLoaded"));
    } catch (err) {
        console.error("Error loading footer:", err);
    }
}

function setupFooter() {
    const n = document.getElementById("appName");
    const t = document.getElementById("currentDateTime");
    const e = document.getElementById("footerLogo");

    function a() {
        const dateStr = (new Date()).toLocaleString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        if (t) t.textContent = dateStr;
    }

    const cachedSettings = localStorage.getItem("managely_store_settings");
    if (cachedSettings) {
        try {
            const s = JSON.parse(cachedSettings);
            if (s.storeName && n) n.textContent = s.storeName;
            if (s.logo && e) {
                e.src = s.logo;
                e.classList.remove("hidden");
            }
        } catch (err) {}
    }

    if (n && t && e) {
        window.electronAPI.getSettings().then((set => {
            if (set) {
                try {
                    localStorage.setItem("managely_store_settings", JSON.stringify(set));
                } catch (err) {}
                if (set.storeName && n) n.textContent = set.storeName;
                if (set.logo && e) {
                    e.src = set.logo;
                    e.classList.remove("hidden");
                } else if (e) {
                    e.classList.add("hidden");
                }
            }
        })).catch(() => {});

        a();
        setInterval(a, 1000);
    }
}

function initializeCalculatorButton() {
    if (document.getElementById("floatingCalcButton")) return;
    const currentPage = (window.location.pathname.split("/").pop() || "").replace(".html", "");
    if (currentPage === "login" || currentPage === "splash" || currentPage === "license") return;

    const n = document.createElement("button");
    n.id = "floatingCalcButton";
    n.className = "btn btn-circle btn-primary shadow-lg calc-button";
    n.innerHTML = `
        <div class="tooltip" data-tip="آلة حاسبة">
            <i class="fas fa-calculator text-xl"></i>
        </div>
    `;
    n.onclick = () => {
        if (typeof window.openCalculatorPopup === "function") {
            window.openCalculatorPopup();
        } else {
            openCalculatorPopup();
        }
    };
    document.body.appendChild(n);
}

function openCalculatorPopup() {
    if (typeof window.openCalculatorModal === "function") {
        window.openCalculatorModal();
        return;
    }
    if (typeof window.openCalculatorPopup === "function" && window.openCalculatorPopup !== openCalculatorPopup) {
        window.openCalculatorPopup();
        return;
    }
}

// Window global bindings
if (typeof window !== "undefined") {
    window.getCurrentUser = getCurrentUser;
    window.hasPermission = hasPermission;
    window.logoutUser = logoutUser;
    window.applyPagePermissionGuard = applyPagePermissionGuard;
    window.filterSidebarLinks = filterSidebarLinks;
    window.updateSidebarUserInfo = updateSidebarUserInfo;
}

document.addEventListener("DOMContentLoaded", async () => {
    initSweetAlertWrapper();
    initAllCustomSelects();
    await loadSidebar();
    loadCategories(() => {
        loadProducts(() => {
            loadCart(() => {
                if (typeof renderHomeProducts === "function") renderHomeProducts();
                if (typeof renderCart === "function") renderCart();
                if (typeof renderCategoryFilter === "function") renderCategoryFilter();
            });
        });
    });
    document.addEventListener("footerLoaded", () => {
        setupFooter();
    });
    await loadFooter();
    initializeCalculatorButton();
});

window.addEventListener("load", () => {
    initSweetAlertWrapper();
    initAllCustomSelects();
    if (!document.getElementById("floatingCalcButton")) {
        initializeCalculatorButton();
    }
});