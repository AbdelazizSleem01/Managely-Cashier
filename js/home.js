if (!window.electronAPI) {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            title: "تنبيه",
            text: "يرجى إعادة تشغيل التطبيق للمتابعة بشكل صحيح.",
            icon: "warning"
        });
    }
}

let categories = [];
let products = [];
let cart = [];
let customers = [];
let activeCategoryFilter = "";
let isLowStockFilterActive = false;

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// 1. Live Arabic Clock & Dynamic Greeting
function updateLiveClockAndGreeting() {
    const timeEl = document.getElementById("liveHomeTime");
    const dateEl = document.getElementById("liveHomeDate");
    const greetingTextEl = document.getElementById("heroGreetingText");
    const greetingBadgeEl = document.getElementById("heroGreetingBadge");

    const now = new Date();
    const hours = now.getHours();

    if (greetingTextEl && greetingBadgeEl) {
        if (hours >= 4 && hours < 13) {
            greetingTextEl.textContent = "صباح الخير ";
            const icon = greetingBadgeEl.querySelector("i");
            if (icon) icon.className = "fas fa-sun";
        } else if (hours >= 13 && hours < 18) {
            greetingTextEl.textContent = "مساء الخير ";
            const icon = greetingBadgeEl.querySelector("i");
            if (icon) icon.className = "fas fa-cloud-sun";
        } else {
            greetingTextEl.textContent = "مساء الخير ";
            const icon = greetingBadgeEl.querySelector("i");
            if (icon) icon.className = "fas fa-moon";
        }
    }

    if (timeEl) {
        const hours24 = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const period = hours24 >= 12 ? "م" : "ص";
        const hours12 = String(hours24 % 12 || 12).padStart(2, "0");
        timeEl.textContent = `${hours12}:${minutes}:${seconds} ${period}`;
    }

    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }
}

// 2. Load Quick Stats & Treasury Balance & Store Name
async function loadQuickStats() {
    try {
        const today = (new Date()).toISOString().split("T")[0];
        const allSales = (await window.electronAPI.getSales()) || [];
        const todaySales = allSales.filter(s => s && s.date && s.date.startsWith(today));

        const salesCount = todaySales.length;
        const totalRevenue = todaySales.reduce((acc, curr) => acc + (curr.total || 0) - (curr.returnAmount || 0), 0).toFixed(2);

        const allProducts = (await window.electronAPI.getProducts()) || [];
        const lowStockCount = allProducts.filter(p => Number(p.quantity || 0) <= 3).length;

        const elSales = document.getElementById("dailySales");
        const elRev = document.getElementById("dailyRevenue");
        const elStock = document.getElementById("lowStock");
        const elTreasury = document.getElementById("homeTreasuryBalance");

        if (elSales) elSales.textContent = salesCount;
        if (elRev) elRev.textContent = `${Number(totalRevenue).toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه`;
        if (elStock) elStock.textContent = lowStockCount;

        // Load Treasury balance
        if (elTreasury) {
            try {
                if (typeof window.electronAPI.getTreasurySummary === "function") {
                    const treasurySummary = await window.electronAPI.getTreasurySummary();
                    if (treasurySummary && typeof treasurySummary.balance === "number") {
                        elTreasury.textContent = `${treasurySummary.balance.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه`;
                    }
                } else if (typeof window.electronAPI.getTreasuryTransactions === "function") {
                    const txs = await window.electronAPI.getTreasuryTransactions();
                    if (Array.isArray(txs)) {
                        const totalIn = txs.filter(t => t.type === "deposit" || t.type === "sale").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                        const totalOut = txs.filter(t => t.type === "withdrawal" || t.type === "expense").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                        const bal = totalIn - totalOut;
                        elTreasury.textContent = `${bal.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه`;
                    }
                }
            } catch (tErr) {
                console.warn("Could not fetch live treasury summary:", tErr);
            }
        }

        // Load Store Name
        try {
            const settings = await window.electronAPI.getSettings();
            if (settings && settings.storeName) {
                const storeNameEl = document.getElementById("heroStoreName");
                if (storeNameEl) {
                    storeNameEl.textContent = `نظام ${settings.storeName} للإدارة ونقاط البيع`;
                }
            }
        } catch (sErr) { }

    } catch (err) {
        console.error("Error loading quick stats:", err);
    }
}

// 3. Load Recent Invoices
async function loadRecentInvoices() {
    const container = document.getElementById("recentInvoicesContainer");
    if (!container) return;

    try {
        const sales = (await window.electronAPI.getSales()) || [];
        if (!sales.length) {
            container.innerHTML = `
                <div class="p-4 text-center text-gray-400 bg-gray-50 rounded-xl">
                    <i class="fas fa-receipt text-2xl mb-1 text-gray-300"></i>
                    <p class="text-xs font-semibold m-0">لا توجد فواتير مسجلة اليوم حتى الآن</p>
                </div>
            `;
            return;
        }

        // Sort descending by date/id
        const sortedSales = [...sales].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5);

        container.innerHTML = sortedSales.map(sale => {
            const invNum = sale.invoiceNumber || sale.invoiceId || sale._id?.slice(-6) || "---";
            const custName = sale.customerName || sale.customer || "عميل نقدي";
            const total = Number(sale.total || 0).toFixed(2);
            let timeStr = "";
            if (sale.date) {
                try {
                    const d = new Date(sale.date);
                    timeStr = d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
                } catch (e) {
                    timeStr = "";
                }
            }

            return `
                <div class="recent-invoice-item">
                    <div class="recent-invoice-info">
                        <div class="recent-invoice-icon">
                            <i class="fas fa-file-invoice-dollar"></i>
                        </div>
                        <div>
                            <div class="recent-invoice-title">فاتورة #${invNum}</div>
                            <div class="recent-invoice-meta">${custName} ${timeStr ? `• ${timeStr}` : ""}</div>
                        </div>
                    </div>
                    <div class="recent-invoice-total">${total} ج.م</div>
                </div>
            `;
        }).join("");
    } catch (err) {
        container.innerHTML = `<p class="text-xs text-gray-400 text-center py-2">تعذر تحميل أحدث الفواتير</p>`;
    }
}

// 4. Keyboard Shortcuts Handler
function handleKeyboardShortcuts(e) {
    // If SweetAlert2 popup (e.g. Calculator) is currently visible, skip home shortcuts
    if (typeof Swal !== "undefined" && Swal.isVisible()) {
        return;
    }

    const { key, ctrlKey, target } = e;

    // If typing in an input/textarea, ignore single key shortcuts except escape
    const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");

    if (key === "Escape") {
        closeShortcutsModal();
        return;
    }

    if (key === "F1") {
        e.preventDefault();
        openShortcutsModal();
        return;
    }

    if (key === "/" && !isTyping && !ctrlKey) {
        e.preventDefault();
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.focus();
        return;
    }

    if (isTyping && !ctrlKey) return;

    switch (true) {
        case key === "F10":
            e.preventDefault();
            window.location.href = "./sales-invoice.html";
            break;
        case key === "F9":
            e.preventDefault();
            window.location.href = "./products.html";
            break;
        case key === "F12":
            e.preventDefault();
            window.location.href = "./treasury.html";
            break;
        case (key === "t" || key === "T" || key === "ف") && ctrlKey:
            e.preventDefault();
            window.location.href = "./categories.html";
            break;
        case key === "F4":
            e.preventDefault();
            window.location.href = "./customers.html";
            break;
        case (key === "s" || key === "S" || key === "س") && ctrlKey:
            e.preventDefault();
            window.location.href = "./settings.html";
            break;
        case (key === "p" || key === "P" || key === "ح") && ctrlKey:
            e.preventDefault();
            window.location.href = "./suppliers.html";
            break;
        case key === "F8":
            e.preventDefault();
            window.location.href = "./ProductsPurchaseInvoices.html";
            break;
        case key === "F7":
            e.preventDefault();
            window.location.href = "./purchase-invoices.html";
            break;
        case key === "F6":
            e.preventDefault();
            window.location.href = "./sales.html";
            break;
        case key === "F5":
            // Allow default reload if Ctrl/Shift is pressed, otherwise go to statistics
            if (!ctrlKey) {
                e.preventDefault();
                window.location.href = "./statistics.html";
            }
            break;
        case key === "F3":
            e.preventDefault();
            window.location.href = "./returns.html";
            break;
        default:
            break;
    }
}

// 5. Render Products Grid
export async function renderHomeProducts(categoryFilter = activeCategoryFilter, searchFilter = "", onlyLowStock = isLowStockFilterActive) {
    const container = document.getElementById("products");
    const noProductsEl = document.getElementById("noProducts");
    const badgeEl = document.getElementById("totalProductsBadge");

    if (!container) return;

    try {
        let prods = await window.electronAPI.getProducts();
        if (!Array.isArray(prods)) prods = [];

        // Update total product count badge
        if (badgeEl) {
            badgeEl.textContent = `${prods.length} منتج`;
        }

        // Apply filters
        if (categoryFilter) {
            prods = prods.filter(p => p.category === categoryFilter);
        }
        if (searchFilter) {
            const q = searchFilter.toLowerCase().trim();
            prods = prods.filter(p =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.barcode && String(p.barcode).toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
        }
        if (onlyLowStock) {
            prods = prods.filter(p => Number(p.quantity || 0) <= 3);
        }

        prods.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        if (prods.length === 0) {
            container.innerHTML = "";
            if (noProductsEl) noProductsEl.classList.remove("hidden");
            return;
        }

        if (noProductsEl) noProductsEl.classList.add("hidden");

        container.innerHTML = prods.map(p => {
            const price = typeof p.price === "number" ? p.price.toFixed(2) : (Number(p.price) || 0).toFixed(2);
            const qty = Number(p.quantity || 0);

            let stockClass = "in-stock";
            let stockText = `متوفر: ${qty}`;
            let stockIcon = "fa-check-circle";

            if (qty <= 0) {
                stockClass = "out-of-stock";
                stockText = "نفذ من المخزون";
                stockIcon = "fa-circle-xmark";
            } else if (qty <= 3) {
                stockClass = "low-stock";
                stockText = `منخفض: ${qty}`;
                stockIcon = "fa-triangle-exclamation";
            }

            return `
                <div class="home-product-card">
                    <div>
                        <div class="product-card-head">
                            <h3 class="product-card-title">${p.name || "منتج بدون اسم"}</h3>
                            ${p.category ? `<span class="product-card-category">${p.category}</span>` : ""}
                        </div>
                        <p class="product-card-desc" title="${p.description || ""}">${p.description || "لا يوجد وصف إضافي للمنتج"}</p>
                    </div>

                    <div class="product-card-footer">
                        <div class="product-card-price">${price} <span class="text-xs font-bold text-gray-500">ج.م</span></div>
                        <span class="product-stock-tag ${stockClass}">
                            <i class="fas ${stockIcon}"></i>
                            <span>${stockText}</span>
                        </span>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Error loading products:", err);
        container.innerHTML = '<p class="text-center text-red-500 py-6 col-span-full">تعذر تحميل المنتجات حالياً، يرجى المحاولة لاحقاً.</p>';
    }
}

// 6. Category Filter Pills
export async function renderCategoryFilter() {
    const pillsContainer = document.getElementById("categoryPillsContainer");
    const selectEl = document.getElementById("filterCategory");

    try {
        categories = (await window.electronAPI.getCategories()) || [];

        // Render Select (for backwards compatibility)
        if (selectEl) {
            selectEl.innerHTML = `<option value="">كل المنتجات</option>${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}`;
        }

        // Render Modern Category Filter Pills
        if (pillsContainer) {
            let pillsHtml = `
                <button type="button" class="category-pill-btn ${activeCategoryFilter === "" ? "active" : ""}" onclick="setCategoryFilter('')">
                    <i class="fas fa-layer-group"></i>
                    <span>كل المنتجات</span>
                </button>
            `;

            categories.forEach(cat => {
                const isActive = activeCategoryFilter === cat.name;
                pillsHtml += `
                    <button type="button" class="category-pill-btn ${isActive ? "active" : ""}" onclick="setCategoryFilter('${cat.name}')">
                        <i class="fas fa-tag"></i>
                        <span>${cat.name}</span>
                    </button>
                `;
            });

            pillsContainer.innerHTML = pillsHtml;
        }
    } catch (err) {
        console.error("Error rendering category filter:", err);
    }
}

export function setCategoryFilter(categoryName) {
    activeCategoryFilter = categoryName;
    isLowStockFilterActive = false;

    // Update active pill button
    const pills = document.querySelectorAll(".category-pill-btn");
    pills.forEach(pill => {
        const text = pill.querySelector("span")?.textContent || "";
        if ((categoryName === "" && text === "كل المنتجات") || text === categoryName) {
            pill.classList.add("active");
        } else {
            pill.classList.remove("active");
        }
    });

    const selectEl = document.getElementById("filterCategory");
    if (selectEl) selectEl.value = categoryName;

    const sInput = document.getElementById("searchInput");
    renderHomeProducts(activeCategoryFilter, sInput ? sInput.value : "", false);
}

export function filterLowStockProducts() {
    isLowStockFilterActive = !isLowStockFilterActive;
    activeCategoryFilter = "";

    // Clear active pill state
    document.querySelectorAll(".category-pill-btn").forEach(p => p.classList.remove("active"));

    const sInput = document.getElementById("searchInput");
    renderHomeProducts("", sInput ? sInput.value : "", isLowStockFilterActive);

    if (isLowStockFilterActive) {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        Toast.fire({
            icon: 'info',
            title: 'تمت تصفية المنتجات التي أوشكت على النفاد'
        });
    }
}

function filterAndSearch() {
    const sInput = document.getElementById("searchInput");
    renderHomeProducts(activeCategoryFilter, sInput ? sInput.value : "", isLowStockFilterActive);
}

// 7. Shortcuts Modal Controls
export function openShortcutsModal() {
    const modal = document.getElementById("shortcutsModal");
    if (modal) modal.classList.add("open");
}

export function closeShortcutsModal() {
    const modal = document.getElementById("shortcutsModal");
    if (modal) modal.classList.remove("open");
}

export function handleShortcutsOverlayClick(e) {
    if (e.target && e.target.id === "shortcutsModal") {
        closeShortcutsModal();
    }
}

// 8. Initialization
document.addEventListener("DOMContentLoaded", () => {
    updateLiveClockAndGreeting();
    setInterval(updateLiveClockAndGreeting, 1000);

    Promise.all([
        window.electronAPI.getCategories().catch(() => []),
        window.electronAPI.getProducts().catch(() => [])
    ]).then(() => {
        renderCategoryFilter();
        renderHomeProducts();
        loadQuickStats();
        loadRecentInvoices();

        const sInput = document.getElementById("searchInput");
        if (sInput) sInput.addEventListener("input", debounce(filterAndSearch, 250));

        document.addEventListener("keydown", handleKeyboardShortcuts);
    }).catch(err => {
        console.error("Init error on home page:", err);
    });
});

// Window Exports
if (typeof window !== "undefined") {
    window.renderHomeProducts = renderHomeProducts;
    window.filterProducts = filterAndSearch;
    window.renderCategoryFilter = renderCategoryFilter;
    window.setCategoryFilter = setCategoryFilter;
    window.filterLowStockProducts = filterLowStockProducts;
    window.openShortcutsModal = openShortcutsModal;
    window.closeShortcutsModal = closeShortcutsModal;
    window.handleShortcutsOverlayClick = handleShortcutsOverlayClick;
}