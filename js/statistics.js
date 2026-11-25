/**
 * Managely POS - AI Business Analytics & Financial Intelligence Hub
 * Comprehensive analysis for sales, peak hours, P&L profit engine, and dead stock detector.
 */

// Global State
let allProducts = [];
let allCustomers = [];
let allOrders = [];
let allTreasuryTransactions = [];
let cachedSalesData = null;

let activeTab = "tab-overview";
let activePeriod = "all";
let deadStockFilterDays = 30;
let deadStockSearchQuery = "";

// Chart instances
let dailySalesChartInstance = null;
let peakHoursChartInstance = null;
let weeklyDaysChartInstance = null;
let pnlComparisonChartInstance = null;

// =========================================================================
// Data Fetchers
// =========================================================================

async function getProducts() {
    try {
        const products = await window.electronAPI.getProducts();
        return Array.isArray(products) ? products.filter(p => p && typeof p === "object") : [];
    } catch (e) {
        console.error("Error fetching products:", e);
        return [];
    }
}

async function getCustomers() {
    try {
        const customers = await window.electronAPI.getCustomers();
        return Array.isArray(customers) ? customers.filter(c => c && typeof c === "object") : [];
    } catch (e) {
        console.error("Error fetching customers:", e);
        return [];
    }
}

async function getOrders() {
    try {
        const orders = await window.electronAPI.getOrders();
        return Array.isArray(orders) ? orders.filter(o => o && typeof o === "object") : [];
    } catch (e) {
        console.error("Error fetching orders:", e);
        return [];
    }
}

async function getTreasuryTransactions() {
    try {
        const txs = await window.electronAPI.getTreasuryTransactions();
        return Array.isArray(txs) ? txs.filter(t => t && typeof t === "object") : [];
    } catch (e) {
        console.error("Error fetching treasury transactions:", e);
        return [];
    }
}

async function getSalesData() {
    try {
        const data = await window.electronAPI.getSalesData();
        if (!data || typeof data !== "object") {
            return {
                daily: [],
                monthly: { sales: 0, month: "", previousSales: 0 },
                yearly: { sales: 0, year: "", previousSales: 0 },
                monthlyOrders: 0,
                yearlyOrders: 0
            };
        }
        if (data.daily && !Array.isArray(data.daily)) {
            const t = data.daily;
            data.daily = [];
            if (t.date && typeof t.sales === "number") {
                data.daily.push({ date: t.date, sales: t.sales, orders: data.dailyOrders || 0 });
            }
            delete data.dailyOrders;
        }
        if (!Array.isArray(data.daily)) data.daily = [];
        if (!data.monthly || typeof data.monthly !== "object") data.monthly = { sales: 0, month: "", previousSales: 0 };
        if (!data.yearly || typeof data.yearly !== "object") data.yearly = { sales: 0, year: "", previousSales: 0 };
        return data;
    } catch (e) {
        console.error("Error fetching sales data:", e);
        return {
            daily: [],
            monthly: { sales: 0, month: "", previousSales: 0 },
            yearly: { sales: 0, year: "", previousSales: 0 },
            monthlyOrders: 0,
            yearlyOrders: 0
        };
    }
}

async function saveSalesData(data) {
    try {
        if (!data || typeof data !== "object") return;
        await window.electronAPI.saveSalesData(data);
    } catch (e) {
        console.error("Error saving sales data:", e);
    }
}

function showErrorToast(msg) {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            icon: "error",
            title: "خطأ",
            text: msg,
            toast: true,
            position: "top-start",
            showConfirmButton: false,
            timer: 3000
        });
    } else {
        console.error(msg);
    }
}

// =========================================================================
// Main Lifecycle & Statistics Loader
// =========================================================================

async function loadStatistics() {
    try {
        const [products, customers, orders, salesData, treasury] = await Promise.all([
            getProducts(),
            getCustomers(),
            getOrders(),
            getSalesData(),
            getTreasuryTransactions()
        ]);

        allProducts = products;
        allCustomers = customers;
        allOrders = orders;
        cachedSalesData = salesData;
        allTreasuryTransactions = treasury;

        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const currentMonth = now.toISOString().slice(0, 7);
        const currentYear = now.getFullYear().toString();

        const past30Days = new Date();
        past30Days.setDate(past30Days.getDate() - 30);

        const recentDaily = (salesData.daily || []).filter(item => {
            if (!item || !item.date) return false;
            return new Date(item.date) >= past30Days;
        });

        const currentSales = { ...salesData, daily: recentDaily };
        if (currentSales.monthly.month !== currentMonth) {
            currentSales.monthly.previousSales = currentSales.monthly.sales;
            currentSales.monthly.sales = 0;
            currentSales.monthly.month = currentMonth;
            currentSales.monthlyOrders = 0;
        }
        if (currentSales.yearly.year !== currentYear) {
            currentSales.yearly.previousSales = currentSales.yearly.sales;
            currentSales.yearly.sales = 0;
            currentSales.yearly.year = currentYear;
            currentSales.yearlyOrders = 0;
        }

        // Render Overview stats
        updateProductStats(allProducts);
        updateCustomerStats(allCustomers, allOrders, todayStr);
        updateOrderStats(allOrders);
        await updateSalesStats(allOrders, currentSales, todayStr, currentMonth, currentYear, now);

        // Run AI & Financial calculations based on active period
        refreshAnalyticsModules();

    } catch (e) {
        console.error("Failed to load statistics:", e);
        showErrorToast("فشل في تحميل الإحصائيات الشاملة");
    }
}

// =========================================================================
// Navigation & Period Filters
// =========================================================================

export function switchAnalyticsTab(tabId) {
    activeTab = tabId;

    // Update Tab Buttons UI
    document.querySelectorAll(".analytics-tab-btn").forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Update Tab Panes UI
    document.querySelectorAll(".analytics-tab-pane").forEach(pane => {
        if (pane.id === tabId) {
            pane.classList.remove("hidden");
            pane.classList.add("active");
        } else {
            pane.classList.add("hidden");
            pane.classList.remove("active");
        }
    });

    // Resize active charts to fix canvas scaling on display toggle
    setTimeout(() => {
        if (tabId === "tab-overview" && dailySalesChartInstance) dailySalesChartInstance.resize();
        if (tabId === "tab-ai-insights") {
            if (peakHoursChartInstance) peakHoursChartInstance.resize();
            if (weeklyDaysChartInstance) weeklyDaysChartInstance.resize();
        }
        if (tabId === "tab-pnl" && pnlComparisonChartInstance) pnlComparisonChartInstance.resize();
    }, 50);
}

export function changeAnalyticsPeriod(period) {
    activePeriod = period;

    // Update Period Buttons UI
    document.querySelectorAll(".period-pill-btn").forEach(btn => {
        if (btn.dataset.period === period) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    refreshAnalyticsModules();
}

/**
 * Filters an array of records by the active time period
 */
function filterRecordsByPeriod(records, dateField = "date", period = activePeriod) {
    if (!Array.isArray(records)) return [];
    if (period === "all") return records;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentMonth = now.toISOString().slice(0, 7);
    const currentYear = now.getFullYear().toString();

    return records.filter(item => {
        if (!item || !item[dateField]) return false;
        const d = new Date(item[dateField]);
        if (isNaN(d.getTime())) return false;

        const dateStr = d.toISOString().split("T")[0];
        const monthStr = d.toISOString().slice(0, 7);
        const yearStr = d.getFullYear().toString();

        if (period === "today") {
            return dateStr === todayStr;
        } else if (period === "7days") {
            const past7 = new Date(now);
            past7.setDate(past7.getDate() - 7);
            past7.setHours(0, 0, 0, 0);
            return d >= past7;
        } else if (period === "thisMonth") {
            return monthStr === currentMonth;
        } else if (period === "30days") {
            const past30 = new Date(now);
            past30.setDate(past30.getDate() - 30);
            past30.setHours(0, 0, 0, 0);
            return d >= past30;
        } else if (period === "thisYear") {
            return yearStr === currentYear;
        }
        return true;
    });
}

function refreshAnalyticsModules() {
    const filteredOrders = filterRecordsByPeriod(allOrders, "date", activePeriod);
    const filteredTreasury = filterRecordsByPeriod(allTreasuryTransactions, "date", activePeriod);

    computeAIInsights(filteredOrders, allProducts, filteredTreasury);
    computePeakHoursAndDays(filteredOrders);
    computeProfitAndLoss(filteredOrders, allProducts, filteredTreasury);
    computeDeadStock(allProducts, allOrders);
}

// =========================================================================
// Tab 1: Overview & Standard Stats Functions
// =========================================================================

function updateProductStats(products) {
    const totalCount = products.length;
    const elTotal = document.getElementById("totalProducts");
    const elHeaderProd = document.getElementById("headerStatProducts");
    if (elTotal) elTotal.textContent = totalCount.toLocaleString("ar-EG");
    if (elHeaderProd) elHeaderProd.textContent = totalCount.toLocaleString("ar-EG");

    const lowStock = products.filter(p => p && typeof p.quantity === "number" && p.quantity < 10);
    const container = document.getElementById("lowStockProducts");
    if (!container) return;
    container.innerHTML = "";

    if (lowStock.length === 0) {
        container.innerHTML = `
            <div style="padding: 24px; text-align: center; color: #059669; font-weight: 700;">
                <i class="fas fa-circle-check" style="font-size: 1.5rem; margin-bottom: 6px; display: block;"></i>
                <span>جميع المنتجات متوفرة بكميات كافية وآمنة</span>
            </div>
        `;
        return;
    }

    lowStock.forEach(item => {
        const isCritical = (item.quantity || 0) < 5;
        const row = document.createElement("div");
        row.className = "low-stock-row";
        row.innerHTML = `
            <div class="low-stock-title">
                <i class="fas fa-triangle-exclamation" style="color: ${isCritical ? '#dc2626' : '#d97706'};"></i>
                <span>${item.name || "منتج غير محدد"}</span>
            </div>
            <span class="low-stock-badge ${isCritical ? 'critical' : ''}">
                ${item.quantity || 0} متبقي بالمخزن
            </span>
        `;
        container.appendChild(row);
    });
}

function updateCustomerStats(customers, orders, todayStr) {
    const validCustomers = [...new Set(customers.filter(c => c?.name && typeof c.name === "string").map(c => c.name.trim().toLowerCase()))];
    const totalCustomers = validCustomers.length;

    const elTotalCust = document.getElementById("totalCustomers");
    const elHeaderCust = document.getElementById("headerStatCustomers");
    if (elTotalCust) elTotalCust.textContent = totalCustomers.toLocaleString("ar-EG");
    if (elHeaderCust) elHeaderCust.textContent = totalCustomers.toLocaleString("ar-EG");

    const todayOrders = orders.filter(o => o?.date && new Date(o.date).toISOString().split("T")[0] === todayStr);
    const todayCust = [...new Set(todayOrders.filter(o => o?.customerName).map(o => o.customerName.trim().toLowerCase()))];
    const priorOrders = orders.filter(o => o?.date && new Date(o.date).toISOString().split("T")[0] < todayStr && o?.customerName);
    const priorCust = [...new Set(priorOrders.map(o => o.customerName.trim().toLowerCase()))];

    const newCustomers = todayCust.filter(c => !priorCust.includes(c));
    const oldCustomers = todayCust.filter(c => priorCust.includes(c));

    const elNewCust = document.getElementById("newCustomers");
    const elOldCust = document.getElementById("oldCustomers");
    const elNewPct = document.getElementById("newCustomersPercentage");

    if (elNewCust) elNewCust.textContent = newCustomers.length.toLocaleString("ar-EG");
    if (elOldCust) elOldCust.textContent = oldCustomers.length.toLocaleString("ar-EG");

    const pct = totalCustomers > 0 ? Math.round((newCustomers.length / totalCustomers) * 100) : 0;
    if (elNewPct) elNewPct.textContent = `${pct}%`;
}

function updateOrderStats(orders) {
    const elOrders = document.getElementById("totalOrders");
    if (elOrders) elOrders.textContent = (orders.length || 0).toLocaleString("ar-EG");
}

async function updateSalesStats(orders, salesData, todayStr, currentMonth, currentYear, now) {
    let dailyTotal = 0;
    let dailyCount = 0;
    let monthlyTotal = 0;
    let monthlyCount = 0;
    let yearlyTotal = 0;
    let yearlyCount = 0;

    const dailyMap = new Map();
    const past29Days = new Date(now);
    past29Days.setDate(past29Days.getDate() - 29);
    past29Days.setHours(0, 0, 0, 0);

    orders.forEach(ord => {
        if (!ord?.date || typeof ord.total !== "number") return;
        const d = new Date(ord.date);
        if (isNaN(d.getTime())) return;

        const dateKey = d.toISOString().split("T")[0];
        const monthKey = d.toISOString().slice(0, 7);
        const yearKey = d.getFullYear().toString();
        const netAmt = parseFloat(ord.total || 0) - (parseFloat(ord.returnAmount || 0) || 0);

        if (d >= past29Days && d <= now) {
            if (!dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, { date: dateKey, sales: 0, orders: 0 });
            }
            const cur = dailyMap.get(dateKey);
            cur.sales += netAmt;
            cur.orders += 1;
            dailyTotal += netAmt;
            dailyCount += 1;
        }

        if (monthKey === currentMonth) {
            monthlyTotal += netAmt;
            monthlyCount += 1;
        }

        if (yearKey === currentYear) {
            yearlyTotal += netAmt;
            yearlyCount += 1;
        }
    });

    const dailyList = Array.from(dailyMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
    const updatedSalesData = {
        ...salesData,
        daily: dailyList,
        monthly: {
            ...salesData.monthly,
            sales: monthlyTotal,
            month: currentMonth,
            previousSales: salesData.monthly.month === currentMonth ? salesData.monthly.previousSales : (salesData.monthly.sales || 0)
        },
        yearly: {
            ...salesData.yearly,
            sales: yearlyTotal,
            year: currentYear,
            previousSales: salesData.yearly.year === currentYear ? salesData.yearly.previousSales : (salesData.yearly.sales || 0)
        },
        monthlyOrders: monthlyCount,
        yearlyOrders: yearlyCount
    };

    const elDailySales = document.getElementById("dailySales");
    const elMonthlySales = document.getElementById("monthlySales");
    const elYearlySales = document.getElementById("yearlySales");
    const elHeaderSales = document.getElementById("headerStatSales");

    if (elDailySales) elDailySales.textContent = `${dailyTotal.toFixed(2)} ج.م`;
    if (elMonthlySales) elMonthlySales.textContent = `${monthlyTotal.toFixed(2)} ج.م`;
    if (elYearlySales) elYearlySales.textContent = `${yearlyTotal.toFixed(2)} ج.م`;
    if (elHeaderSales) elHeaderSales.textContent = `${monthlyTotal.toFixed(2)} ج.م`;

    const elDailyOrders = document.getElementById("dailyOrders");
    const elMonthlyOrders = document.getElementById("monthlyOrders");
    const elYearlyOrders = document.getElementById("yearlyOrders");

    if (elDailyOrders) elDailyOrders.textContent = dailyCount.toLocaleString("ar-EG");
    if (elMonthlyOrders) elMonthlyOrders.textContent = monthlyCount.toLocaleString("ar-EG");
    if (elYearlyOrders) elYearlyOrders.textContent = yearlyCount.toLocaleString("ar-EG");

    updateDailySalesProgress(dailyList);
    updateDailySalesChart(dailyList);
    updateSalesChanges(updatedSalesData, monthlyTotal, yearlyTotal);
    updateTopProducts(orders);
    await saveSalesData(updatedSalesData);
}

function updateDailySalesProgress(dailyList) {
    const container = document.getElementById("dailySalesProgress");
    if (!container) return;
    container.innerHTML = "";

    if (!Array.isArray(dailyList) || dailyList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 24px; color: #64748b;">
                <i class="fas fa-chart-simple" style="font-size: 1.5rem; color: #94a3b8; margin-bottom: 6px; display: block;"></i>
                <span>لا توجد مبيعات مسجلة خلال آخر 30 يوم</span>
            </div>
        `;
        return;
    }

    const sorted = [...dailyList].sort((a, b) => new Date(b.date) - new Date(a.date));
    const maxSales = Math.max(...sorted.map(d => d.sales), 1);

    sorted.forEach(item => {
        const pct = Math.min((item.sales / maxSales) * 100, 100);
        const row = document.createElement("div");
        row.className = "progress-row-item";
        row.innerHTML = `
            <span class="progress-date">${formatDate(item.date)}</span>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
            <span class="progress-amount">${(Number(item.sales) || 0).toFixed(2)} ج.م</span>
            <span class="progress-orders-cnt">(${item.orders || 0} طلب)</span>
        `;
        container.appendChild(row);
    });
}

function updateDailySalesChart(dailyList) {
    const canvas = document.getElementById("dailySalesChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sorted = [...dailyList].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(d => formatDate(d.date));
    const values = sorted.map(d => d.sales);

    if (dailySalesChartInstance) {
        dailySalesChartInstance.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(109, 40, 217, 0.3)");
    gradient.addColorStop(1, "rgba(109, 40, 217, 0.0)");

    dailySalesChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "المبيعات اليومية (ج.م)",
                data: values,
                borderColor: "#6d28d9",
                backgroundColor: gradient,
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: "#6d28d9",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                    labels: {
                        font: { size: 13, family: "'Tajawal', sans-serif", weight: "bold" },
                        color: "#334155"
                    }
                },
                tooltip: {
                    backgroundColor: "#1e1b4b",
                    titleFont: { family: "'Tajawal', sans-serif" },
                    bodyFont: { family: "'Tajawal', sans-serif", weight: "bold" },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: item => ` المبيعات: ${Number(item.parsed.y).toFixed(2)} ج.م`
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: { family: "'Tajawal', sans-serif", size: 11 },
                        color: "#64748b"
                    },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { family: "'Tajawal', sans-serif", size: 11 },
                        color: "#64748b",
                        callback: val => `${val} ج`
                    },
                    grid: { color: "#f1f5f9" }
                }
            }
        }
    });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

function updateSalesChanges(salesData, currentMonthSales, currentYearSales) {
    let monthPct = 0;
    let yearPct = 0;

    if (salesData.monthly.previousSales > 0) {
        monthPct = ((currentMonthSales - salesData.monthly.previousSales) / salesData.monthly.previousSales) * 100;
    }
    if (salesData.yearly.previousSales > 0) {
        yearPct = ((currentYearSales - salesData.yearly.previousSales) / salesData.yearly.previousSales) * 100;
    }

    const elMonthChange = document.getElementById("monthlySalesChange");
    const elYearChange = document.getElementById("yearlySalesChange");

    if (elMonthChange) {
        if (salesData.monthly.previousSales > 0) {
            const isUp = monthPct >= 0;
            elMonthChange.innerHTML = `
                <div class="kpi-change-tag ${isUp ? 'up' : 'down'}">
                    <i class="fas fa-arrow-${isUp ? 'up' : 'down'}"></i>
                    <span>${isUp ? '+' : ''}${monthPct.toFixed(1)}% عن الشهر السابق</span>
                </div>
            `;
        } else {
            elMonthChange.innerHTML = `<span class="kpi-subtext">لا توجد بيانات شهر سابق</span>`;
        }
    }

    if (elYearChange) {
        if (salesData.yearly.previousSales > 0) {
            const isUp = yearPct >= 0;
            elYearChange.innerHTML = `
                <div class="kpi-change-tag ${isUp ? 'up' : 'down'}">
                    <i class="fas fa-arrow-${isUp ? 'up' : 'down'}"></i>
                    <span>${isUp ? '+' : ''}${yearPct.toFixed(1)}% عن السنة السابقة</span>
                </div>
            `;
        } else {
            elYearChange.innerHTML = `<span class="kpi-subtext">لا توجد بيانات سنة سابقة</span>`;
        }
    }
}

function updateTopProducts(orders) {
    const counts = {};
    orders.forEach(ord => {
        if (ord?.items && Array.isArray(ord.items)) {
            ord.items.forEach(it => {
                if (!it?.name) return;
                const name = it.name.trim();
                const qty = parseInt(it.quantity) || 0;
                counts[name] = (counts[name] || 0) + qty;
            });
        }
    });

    const topList = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const container = document.getElementById("topProducts");
    if (!container) return;
    container.innerHTML = "";

    if (topList.length === 0) {
        container.innerHTML = `
            <div style="padding: 24px; text-align: center; color: #64748b;">
                <i class="fas fa-bag-shopping" style="font-size: 1.5rem; color: #94a3b8; margin-bottom: 6px; display: block;"></i>
                <span>لا توجد بيانات مبيعات حتى الآن</span>
            </div>
        `;
        return;
    }

    const rankClasses = ["gold", "silver", "bronze", "", ""];
    const rankEmojis = ["🥇", "🥈", "🥉", "4", "5"];

    topList.forEach(([name, qty], idx) => {
        const row = document.createElement("div");
        row.className = "top-prod-row";
        row.innerHTML = `
            <div class="prod-rank-group">
                <div class="rank-badge ${rankClasses[idx] || ''}">
                    ${rankEmojis[idx] || (idx + 1)}
                </div>
                <span class="prod-title-text">${name}</span>
            </div>
            <span class="prod-qty-badge">${qty.toLocaleString("ar-EG")} وحدة مباعة</span>
        `;
        container.appendChild(row);
    });
}

// =========================================================================
// Tab 2: AI Business Growth Advisor & Peak Hours
// =========================================================================

function computeAIInsights(orders, products, treasury) {
    const grid = document.getElementById("aiInsightsGrid");
    if (!grid) return;

    let totalRevenue = 0;
    let productRevMap = {};
    let hourCountMap = {};

    orders.forEach(ord => {
        const netAmt = parseFloat(ord.total || 0) - (parseFloat(ord.returnAmount || 0) || 0);
        totalRevenue += netAmt;

        if (ord.date) {
            const h = new Date(ord.date).getHours();
            hourCountMap[h] = (hourCountMap[h] || 0) + 1;
        }

        if (Array.isArray(ord.items)) {
            ord.items.forEach(it => {
                const name = it.name || "صنف غير معروف";
                const itemRev = (parseFloat(it.price) || 0) * (parseInt(it.quantity) || 0);
                productRevMap[name] = (productRevMap[name] || 0) + itemRev;
            });
        }
    });

    const orderCount = orders.length;
    const aov = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Peak hour
    let peakHour = 20; // default 8 PM
    let peakOrders = 0;
    Object.entries(hourCountMap).forEach(([h, cnt]) => {
        if (cnt > peakOrders) {
            peakOrders = cnt;
            peakHour = parseInt(h);
        }
    });

    const formatHourDisplay = (h) => {
        const period = h >= 12 ? "مساءً" : "صباحاً";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        const nextH = (h + 1) % 24;
        const nextPeriod = nextH >= 12 ? "مساءً" : "صباحاً";
        const nextH12 = nextH % 12 === 0 ? 12 : nextH % 12;
        return `${String(h12).padStart(2, "0")}:00 ${period} - ${String(nextH12).padStart(2, "0")}:00 ${nextPeriod}`;
    };

    // Top Revenue Product
    let topProdName = "لا توجد بيانات";
    let topProdRev = 0;
    Object.entries(productRevMap).forEach(([name, rev]) => {
        if (rev > topProdRev) {
            topProdRev = rev;
            topProdName = name;
        }
    });

    // Dead Stock calculations
    const soldProductIds = new Set();
    orders.forEach(o => {
        if (Array.isArray(o.items)) {
            o.items.forEach(it => {
                if (it._id) soldProductIds.add(it._id);
                if (it.barcode) soldProductIds.add(it.barcode);
                if (it.name) soldProductIds.add(it.name.trim());
            });
        }
    });

    let deadStockFrozenCapital = 0;
    let deadStockItemCount = 0;
    products.forEach(p => {
        const qty = parseInt(p.quantity) || 0;
        if (qty > 0) {
            const isSold = soldProductIds.has(p._id) || soldProductIds.has(p.barcode) || soldProductIds.has(p.name?.trim());
            if (!isSold) {
                deadStockItemCount++;
                const cost = parseFloat(p.purchasePrice) || (parseFloat(p.price) * 0.7) || 0;
                deadStockFrozenCapital += qty * cost;
            }
        }
    });

    // Forecast: monthly projection
    const dailyAvg = totalRevenue / Math.max(1, (activePeriod === "today" ? 1 : activePeriod === "7days" ? 7 : 30));
    const monthlyForecast = dailyAvg * 30;

    const cardsHtml = `
        <!-- Card 1: Peak Hours -->
        <div class="ai-insight-card card-gold">
            <div>
                <div class="ai-card-header">
                    <div class="ai-card-title-group">
                        <div class="ai-card-icon-wrap gold"><i class="fas fa-fire"></i></div>
                        <h3 class="ai-insight-title">ساعة الذروة الذهبية</h3>
                    </div>
                    <span class="ai-insight-badge badge-warning"><i class="fas fa-bolt"></i> كثافة عالية</span>
                </div>
                <div class="ai-metric-highlight">${orderCount > 0 ? formatHourDisplay(peakHour) : "بانتظار حركة المبيعات"}</div>
                <div class="ai-card-explanation">تسجل هذه الساعة أعلى كثافة لإصدار الفواتير بإجمالي (${peakOrders.toLocaleString("ar-EG")} طلب) خلال الفترة المحددة.</div>
            </div>
            <div class="ai-recommendation-box">
                <strong>توصية الذكاء الاصطناعي:</strong> جهّز طاقم الكاشير وحضّر الأصناف الأكثر طلباً قبل هذه الساعة بـ 30 دقيقة لتفادي التكدس.
            </div>
        </div>

        <!-- Card 2: Average Order Value (AOV) -->
        <div class="ai-insight-card card-purple">
            <div>
                <div class="ai-card-header">
                    <div class="ai-card-title-group">
                        <div class="ai-card-icon-wrap purple"><i class="fas fa-receipt"></i></div>
                        <h3 class="ai-insight-title">متوسط قيمة الفاتورة (AOV)</h3>
                    </div>
                    <span class="ai-insight-badge badge-purple"><i class="fas fa-chart-pie"></i> معدل السلة</span>
                </div>
                <div class="ai-metric-highlight">${aov.toFixed(2)} ج.م</div>
                <div class="ai-card-explanation">متوسط إنفاق العميل في الزيارة الواحدة عبر ${orderCount.toLocaleString("ar-EG")} فاتورة بيع منجزة.</div>
            </div>
            <div class="ai-recommendation-box">
                <strong>توصية الذكاء الاصطناعي:</strong> حفّز الكاشير على تقديم عروض تكميلية (Cross-selling) عند الدفع لرفع متوسط الفاتورة بنسبة 15%.
            </div>
        </div>

        <!-- Card 3: Star Product Driver -->
        <div class="ai-insight-card card-emerald">
            <div>
                <div class="ai-card-header">
                    <div class="ai-card-title-group">
                        <div class="ai-card-icon-wrap emerald"><i class="fas fa-crown"></i></div>
                        <h3 class="ai-insight-title">قائد الإيرادات والأرباح</h3>
                    </div>
                    <span class="ai-insight-badge badge-success"><i class="fas fa-star"></i> النجم الأول</span>
                </div>
                <div class="ai-metric-highlight" style="font-size: 1.15rem; color: #059669;">${topProdName}</div>
                <div class="ai-card-explanation">حقق أعلى حصيلة مبيعات بقيمة ${topProdRev.toFixed(2)} ج.م، ويعتبر المحرك الأساسي لحركة المحل.</div>
            </div>
            <div class="ai-recommendation-box">
                <strong>توصية الذكاء الاصطناعي:</strong> حافظ على استقرار مخزون هذا الصنف وضعه في واجهة المحل لزيادة المبيعات المرافقة.
            </div>
        </div>

        <!-- Card 4: Monthly Forecast & Frozen Capital -->
        <div class="ai-insight-card ${deadStockFrozenCapital > 0 ? 'card-rose' : 'card-cyan'}">
            <div>
                <div class="ai-card-header">
                    <div class="ai-card-title-group">
                        <div class="ai-card-icon-wrap ${deadStockFrozenCapital > 0 ? 'rose' : 'blue'}">
                            <i class="fas ${deadStockFrozenCapital > 0 ? 'fa-snowflake' : 'fa-arrow-trend-up'}"></i>
                        </div>
                        <h3 class="ai-insight-title">${deadStockFrozenCapital > 0 ? 'السيولة المجمدة بالمخزون' : 'توقع الإيراد الشهري'}</h3>
                    </div>
                    <span class="ai-insight-badge ${deadStockFrozenCapital > 0 ? 'badge-warning' : 'badge-success'}">
                        ${deadStockFrozenCapital > 0 ? 'فرصة سيولة' : 'توقع ذكي'}
                    </span>
                </div>
                <div class="ai-metric-highlight" style="color: ${deadStockFrozenCapital > 0 ? '#e11d48' : '#0284c7'};">
                    ${deadStockFrozenCapital > 0 ? `${deadStockFrozenCapital.toFixed(2)} ج.م` : `~${monthlyForecast.toFixed(0)} ج.م`}
                </div>
                <div class="ai-card-explanation">
                    ${deadStockFrozenCapital > 0
            ? `يوجد ${deadStockItemCount} صنف راكد لم يسجل أي حركة بيع، مما يجمد رأس المال في الرفوف.`
            : `بناءً على وتيرة المبيعات الحالية، يتوقع تحقيق هذا الإجمالي خلال الـ 30 يوماً القادمة.`
        }
                </div>
            </div>
            <div class="ai-recommendation-box">
                <strong>توصية الذكاء الاصطناعي:</strong> ${deadStockFrozenCapital > 0 ? 'قم بعمل باقات ترويجية (Bundles) وتخفيضات لتسييل هذه الأصناف وضخ السيولة في المنتجات السريعة.' : 'استمر في تنشيط العروض في الأيام الهادئة لتحقيق نمو يتجاوز 20%.'}
            </div>
        </div>
    `;

    grid.innerHTML = cardsHtml;
}

function computePeakHoursAndDays(orders) {
    // 1. Peak Hours (24 Hours distribution)
    const hoursData = new Array(24).fill(0);
    const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const daysData = [0, 0, 0, 0, 0, 0, 0];
    const daysSales = [0, 0, 0, 0, 0, 0, 0];

    orders.forEach(ord => {
        if (!ord.date) return;
        const d = new Date(ord.date);
        if (isNaN(d.getTime())) return;

        const h = d.getHours();
        const dayIdx = d.getDay();
        const netAmt = parseFloat(ord.total || 0) - (parseFloat(ord.returnAmount || 0) || 0);

        hoursData[h] += 1;
        daysData[dayIdx] += 1;
        daysSales[dayIdx] += netAmt;
    });

    // Summary texts
    let maxHourIdx = 20;
    let maxHourVal = 0;
    hoursData.forEach((cnt, idx) => {
        if (cnt > maxHourVal) {
            maxHourVal = cnt;
            maxHourIdx = idx;
        }
    });

    let bestDayIdx = 5; // Friday default
    let bestDaySales = 0;
    daysSales.forEach((s, idx) => {
        if (s > bestDaySales) {
            bestDaySales = s;
            bestDayIdx = idx;
        }
    });

    const elPeakHour = document.getElementById("peakHourText");
    const elBestDay = document.getElementById("bestDayText");

    const formatH = (h) => {
        const period = h >= 12 ? "م" : "ص";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:00 ${period}`;
    };

    if (elPeakHour) {
        elPeakHour.textContent = maxHourVal > 0 ? `${formatH(maxHourIdx)} (${maxHourVal} فاتورة)` : "لا توجد بيانات كافية";
    }
    if (elBestDay) {
        elBestDay.textContent = bestDaySales > 0 ? `${dayNames[bestDayIdx]} (${bestDaySales.toFixed(2)} ج.م)` : "لا توجد بيانات كافية";
    }

    // Render Peak Hours Chart
    const hoursCanvas = document.getElementById("peakHoursChart");
    if (hoursCanvas) {
        const ctx = hoursCanvas.getContext("2d");
        if (peakHoursChartInstance) peakHoursChartInstance.destroy();

        const hourLabels = hoursData.map((_, i) => formatH(i));
        const bgColors = hoursData.map((_, i) => (i === maxHourIdx && maxHourVal > 0) ? "#f59e0b" : "rgba(109, 40, 217, 0.65)");

        peakHoursChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: hourLabels,
                datasets: [{
                    label: "عدد الفواتير بالساعة",
                    data: hoursData,
                    backgroundColor: bgColors,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#1e1b4b",
                        callbacks: {
                            label: item => ` عدد الفواتير: ${item.parsed.y}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { font: { family: "'Tajawal', sans-serif", size: 9 }, color: "#64748b" },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, font: { family: "'Tajawal', sans-serif", size: 10 }, color: "#64748b" },
                        grid: { color: "#f1f5f9" }
                    }
                }
            }
        });
    }

    // Render Weekly Days Chart
    const daysCanvas = document.getElementById("weeklyDaysChart");
    if (daysCanvas) {
        const ctx = daysCanvas.getContext("2d");
        if (weeklyDaysChartInstance) weeklyDaysChartInstance.destroy();

        // Reorder days starting from Saturday (Saturday = 6, Sunday = 0, ..., Friday = 5)
        const orderedDayIndices = [6, 0, 1, 2, 3, 4, 5];
        const orderedLabels = orderedDayIndices.map(i => dayNames[i]);
        const orderedSales = orderedDayIndices.map(i => daysSales[i]);
        const orderedBg = orderedDayIndices.map(i => (i === bestDayIdx && bestDaySales > 0) ? "#059669" : "rgba(79, 70, 229, 0.7)");

        weeklyDaysChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: orderedLabels,
                datasets: [{
                    label: "إجمالي المبيعات (ج.م)",
                    data: orderedSales,
                    backgroundColor: orderedBg,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#1e1b4b",
                        callbacks: {
                            label: item => ` المبيعات: ${Number(item.parsed.y).toFixed(2)} ج.م`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { font: { family: "'Tajawal', sans-serif", size: 11, weight: "bold" }, color: "#475569" },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { font: { family: "'Tajawal', sans-serif", size: 10 }, color: "#64748b", callback: v => `${v} ج` },
                        grid: { color: "#f1f5f9" }
                    }
                }
            }
        });
    }
}

// =========================================================================
// Tab 3: Profit & Loss Statement (P&L) Engine
// =========================================================================

function computeProfitAndLoss(orders, products, treasury) {
    let grossRevenue = 0;
    let cogsTotal = 0;
    let returnsAndDiscounts = 0;
    let operatingExpenses = 0;

    const prodCostMap = new Map();
    const prodCategoryMap = new Map();
    products.forEach(p => {
        const cost = parseFloat(p.purchasePrice) || (parseFloat(p.price) * 0.7) || 0;
        const cat = (p.category || "عام").trim();
        if (p._id) { prodCostMap.set(p._id, cost); prodCategoryMap.set(p._id, cat); }
        if (p.barcode) { prodCostMap.set(p.barcode, cost); prodCategoryMap.set(p.barcode, cat); }
        if (p.name) { prodCostMap.set(p.name.trim(), cost); prodCategoryMap.set(p.name.trim(), cat); }
    });

    const categoryProfitMap = {};

    orders.forEach(ord => {
        const ordDiscount = parseFloat(ord.discount || 0) || 0;
        const ordReturn = parseFloat(ord.returnAmount || 0) || 0;
        returnsAndDiscounts += (ordDiscount + ordReturn);

        let orderRevenue = 0;
        let orderCogs = 0;

        if (Array.isArray(ord.items)) {
            ord.items.forEach(it => {
                const qty = parseInt(it.quantity) || 0;
                const price = parseFloat(it.price) || 0;
                let cost = parseFloat(it.costPrice);
                if (isNaN(cost) || cost <= 0) {
                    cost = prodCostMap.get(it._id) || prodCostMap.get(it.barcode) || prodCostMap.get(it.name?.trim()) || (price * 0.7);
                }

                const lineRevenue = qty * price;
                const lineCost = qty * cost;
                const lineProfit = lineRevenue - lineCost;

                orderRevenue += lineRevenue;
                orderCogs += lineCost;

                const cat = (it.category || prodCategoryMap.get(it._id) || prodCategoryMap.get(it.name?.trim()) || "عام").trim();
                if (!categoryProfitMap[cat]) {
                    categoryProfitMap[cat] = { revenue: 0, profit: 0, count: 0 };
                }
                categoryProfitMap[cat].revenue += lineRevenue;
                categoryProfitMap[cat].profit += lineProfit;
                categoryProfitMap[cat].count += qty;
            });
        } else {
            orderRevenue = parseFloat(ord.total || 0);
            orderCogs = orderRevenue * 0.7;
        }

        grossRevenue += orderRevenue;
        cogsTotal += orderCogs;
    });

    // Treasury Operating Expenses
    treasury.forEach(tx => {
        const amt = parseFloat(tx.amount || 0);
        if (tx.type === "expense") {
            operatingExpenses += amt;
        } else if (tx.type === "returned") {
            returnsAndDiscounts += amt;
        }
    });

    const grossProfit = grossRevenue - cogsTotal;
    const grossMarginPct = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
    const netProfit = grossProfit - operatingExpenses - returnsAndDiscounts;
    const netMarginPct = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    // Update DOM KPI elements
    const elGrossRev = document.getElementById("pnlGrossRevenue");
    const elCogs = document.getElementById("pnlCogs");
    const elGrossProfit = document.getElementById("pnlGrossProfit");
    const elGrossMarginPct = document.getElementById("pnlGrossMarginPct");
    const elExpenses = document.getElementById("pnlOperatingExpenses");
    const elReturns = document.getElementById("pnlReturnsAndDiscounts");
    const elNetProfit = document.getElementById("pnlNetProfit");
    const elNetMarginPct = document.getElementById("pnlNetMarginPct");

    if (elGrossRev) elGrossRev.textContent = `${grossRevenue.toFixed(2)} ج.م`;
    if (elCogs) elCogs.textContent = `${cogsTotal.toFixed(2)} ج.م`;
    if (elGrossProfit) elGrossProfit.textContent = `${grossProfit.toFixed(2)} ج.م`;
    if (elGrossMarginPct) elGrossMarginPct.textContent = `${grossMarginPct.toFixed(1)}%`;
    if (elExpenses) elExpenses.textContent = `${operatingExpenses.toFixed(2)} ج.م`;
    if (elReturns) elReturns.textContent = `${returnsAndDiscounts.toFixed(2)} ج.م`;
    if (elNetProfit) {
        elNetProfit.textContent = `${netProfit.toFixed(2)} ج.م`;
        elNetProfit.style.color = netProfit >= 0 ? "#047857" : "#dc2626";
    }
    if (elNetMarginPct) elNetMarginPct.textContent = `${netMarginPct.toFixed(1)}%`;

    // Render P&L Comparison Chart
    const pnlCanvas = document.getElementById("pnlComparisonChart");
    if (pnlCanvas) {
        const ctx = pnlCanvas.getContext("2d");
        if (pnlComparisonChartInstance) pnlComparisonChartInstance.destroy();

        pnlComparisonChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["الإيرادات", "تكلفة البضاعة", "مجمل الربح", "المصروفات والخصم", "صافي الربح"],
                datasets: [{
                    label: "المبلغ (ج.م)",
                    data: [grossRevenue, cogsTotal, grossProfit, (operatingExpenses + returnsAndDiscounts), netProfit],
                    backgroundColor: [
                        "#10b981", // Revenue
                        "#94a3b8", // COGS
                        "#8b5cf6", // Gross Profit
                        "#ef4444", // Expenses & Discounts
                        netProfit >= 0 ? "#059669" : "#dc2626"  // Net Profit
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#1e1b4b",
                        callbacks: {
                            label: item => ` المبلغ: ${Number(item.parsed.y).toFixed(2)} ج.م`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { font: { family: "'Tajawal', sans-serif", size: 10, weight: "bold" }, color: "#334155" },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { font: { family: "'Tajawal', sans-serif", size: 10 }, color: "#64748b", callback: v => `${v} ج` },
                        grid: { color: "#f1f5f9" }
                    }
                }
            }
        });
    }

    // Render Category Profit Contribution Breakdown
    const catContainer = document.getElementById("categoryProfitBreakdown");
    if (catContainer) {
        catContainer.innerHTML = "";
        const catList = Object.entries(categoryProfitMap).sort((a, b) => b[1].profit - a[1].profit);

        if (catList.length === 0) {
            catContainer.innerHTML = `
                <div style="padding: 24px; text-align: center; color: #94a3b8; font-weight: 600;">
                    <i class="fas fa-layer-group" style="font-size: 1.5rem; margin-bottom: 6px; display: block;"></i>
                    <span>لا توجد مبيعات مصنفة خلال الفترة</span>
                </div>
            `;
        } else {
            const totalCatProfit = Math.max(catList.reduce((acc, curr) => acc + Math.max(0, curr[1].profit), 0), 1);

            catList.forEach(([catName, stats]) => {
                const profitPct = Math.max(0, Math.min(100, Math.round((stats.profit / totalCatProfit) * 100)));
                const row = document.createElement("div");
                row.className = "category-profit-item";
                row.innerHTML = `
                    <div class="category-profit-head">
                        <span style="color: #1e1b4b;"><i class="fas fa-folder text-purple-500"></i> ${catName}</span>
                        <span style="color: #059669; font-weight: 800;">${stats.profit.toFixed(2)} ج.م (${profitPct}%)</span>
                    </div>
                    <div class="category-profit-bar-wrap">
                        <div class="category-profit-bar-fill" style="width: ${profitPct}%;"></div>
                    </div>
                `;
                catContainer.appendChild(row);
            });
        }
    }
}

// =========================================================================
// Tab 4: Dead Stock & Frozen Capital Detector
// =========================================================================

let deadStockItemsMaster = [];

function computeDeadStock(products, orders) {
    const lastSoldMap = new Map();
    const now = new Date();

    orders.forEach(ord => {
        if (!ord.date) return;
        const ordDate = new Date(ord.date);
        if (isNaN(ordDate.getTime())) return;

        if (Array.isArray(ord.items)) {
            ord.items.forEach(it => {
                const keys = [it._id, it.barcode, it.name?.trim()].filter(Boolean);
                keys.forEach(k => {
                    const existing = lastSoldMap.get(k);
                    if (!existing || ordDate > existing) {
                        lastSoldMap.set(k, ordDate);
                    }
                });
            });
        }
    });

    deadStockItemsMaster = [];

    products.forEach(p => {
        const qty = parseInt(p.quantity) || 0;
        if (qty <= 0) return; // ignore out of stock

        const lastSold = lastSoldMap.get(p._id) || lastSoldMap.get(p.barcode) || lastSoldMap.get(p.name?.trim());
        const costPrice = parseFloat(p.purchasePrice) || (parseFloat(p.price) * 0.7) || 0;
        const sellPrice = parseFloat(p.price) || 0;
        const frozenCapital = qty * costPrice;

        let daysDormant = Infinity;
        let lastSoldFormatted = "لم يُباع مطلقاً";

        if (lastSold) {
            const diffMs = now - lastSold;
            daysDormant = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            lastSoldFormatted = lastSold.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
        }

        deadStockItemsMaster.push({
            id: p._id || p.barcode || p.name,
            name: p.name || "صنف بدون اسم",
            category: p.category || "عام",
            barcode: p.barcode || "",
            costPrice,
            sellPrice,
            quantity: qty,
            frozenCapital,
            daysDormant,
            lastSoldFormatted,
            neverSold: !lastSold
        });
    });

    // Update Tab Badge Count
    const dormantOver30 = deadStockItemsMaster.filter(i => i.daysDormant >= 30);
    const elBadge = document.getElementById("deadStockTabBadge");
    if (elBadge) elBadge.textContent = dormantOver30.length.toLocaleString("ar-EG");

    renderDeadStockTable();
}

export function filterDeadStockTable(days) {
    deadStockFilterDays = days;
    document.querySelectorAll(".dormancy-filter-btn").forEach(btn => {
        if (btn.dataset.days == days) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    renderDeadStockTable();
}

export function handleDeadStockSearch(query) {
    deadStockSearchQuery = (query || "").trim().toLowerCase();
    renderDeadStockTable();
}

function renderDeadStockTable() {
    let filtered = deadStockItemsMaster;

    if (deadStockFilterDays === "never") {
        filtered = filtered.filter(i => i.neverSold);
    } else {
        const d = parseInt(deadStockFilterDays) || 30;
        filtered = filtered.filter(i => i.daysDormant >= d);
    }

    if (deadStockSearchQuery) {
        filtered = filtered.filter(i =>
            i.name.toLowerCase().includes(deadStockSearchQuery) ||
            i.barcode.toLowerCase().includes(deadStockSearchQuery) ||
            i.category.toLowerCase().includes(deadStockSearchQuery)
        );
    }

    // Sort by largest frozen capital first
    filtered.sort((a, b) => b.frozenCapital - a.frozenCapital);

    // Update Summary KPI Cards
    const totalFrozenCapital = filtered.reduce((acc, curr) => acc + curr.frozenCapital, 0);
    const totalUnits = filtered.reduce((acc, curr) => acc + curr.quantity, 0);

    const elItemCount = document.getElementById("deadStockItemCount");
    const elUnitsCount = document.getElementById("deadStockUnitsCount");
    const elFrozenCap = document.getElementById("deadStockFrozenCapital");

    if (elItemCount) elItemCount.textContent = filtered.length.toLocaleString("ar-EG");
    if (elUnitsCount) elUnitsCount.textContent = totalUnits.toLocaleString("ar-EG");
    if (elFrozenCap) elFrozenCap.textContent = `${totalFrozenCapital.toFixed(2)} ج.م`;

    const tbody = document.getElementById("deadStockTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 32px; color: #059669; font-weight: 700;">
                    <i class="fas fa-circle-check" style="font-size: 1.6rem; margin-bottom: 8px; display: block;"></i>
                    <span>ممتاز! لا توجد أصناف راكدة تطابق معايير الفلترة المحددة.</span>
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach((item, idx) => {
        const tr = document.createElement("tr");
        const isFrozenCritical = item.neverSold || item.daysDormant >= 90;

        tr.innerHTML = `
            <td style="font-weight: 700; color: #64748b;">${idx + 1}</td>
            <td style="font-weight: 800; color: #1e1b4b;">${item.name}</td>
            <td><span class="table-cat-badge">${item.category}</span></td>
            <td style="color: #64748b;">${item.costPrice.toFixed(2)} ج.م</td>
            <td style="font-weight: 700; color: #059669;">${item.sellPrice.toFixed(2)} ج.م</td>
            <td style="font-weight: 800; color: #4338ca;">${item.quantity.toLocaleString("ar-EG")}</td>
            <td style="font-weight: 900; color: #ea580c;">${item.frozenCapital.toFixed(2)} ج.م</td>
            <td>
                <span class="${isFrozenCritical ? 'dead-badge-frozen' : 'dead-badge-cold'}">
                    ${item.neverSold ? 'لم يُباع أبداً' : `${item.daysDormant} يوم (${item.lastSoldFormatted})`}
                </span>
            </td>
            <td style="text-align: center;">
                <button type="button" class="btn-promo-action" onclick="suggestProductPromo('${item.name.replace(/'/g, "\\'")}', ${item.costPrice}, ${item.sellPrice}, ${item.quantity})">
                    <i class="fas fa-tag"></i>
                    <span>اقتراح تصفية</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export function suggestProductPromo(name, costPrice, sellPrice, qty) {
    const discountedPrice = Math.max(costPrice + 1, sellPrice * 0.85);
    const margin = sellPrice > 0 ? ((sellPrice - costPrice) / sellPrice) * 100 : 0;

    Swal.fire({
        title: `توصية ذكية لتصريف: ${name}`,
        html: `
            <div style="text-align: right; line-height: 1.8; font-size: 0.95rem;">
                <p>📦 <strong>الكمية المعطلة بالمخزن:</strong> ${qty} قطعة</p>
                <p>💰 <strong>سعر الشراء:</strong> ${costPrice.toFixed(2)} ج.م | <strong>سعر البيع الحالي:</strong> ${sellPrice.toFixed(2)} ج.م</p>
                <p>📊 <strong>هامش الربح الحالي:</strong> ${margin.toFixed(1)}%</p>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px; margin-top: 12px;">
                    <strong style="color: #166534;"><i class="fas fa-wand-magic-sparkles"></i> اقتراح الذكاء الاصطناعي:</strong>
                    <p style="margin: 4px 0 0; color: #15803d;">
                        اعرض المنتج بسعر مخفض ترويجي <strong>${discountedPrice.toFixed(2)} ج.م</strong> (خصم 15%) أو قدم عرض <strong>"اشتري 2 واحصل على 1 مجاناً"</strong> لتحرير السيولة واستثمارها فوراً في الأصناف الأسرع دوراناً.
                    </p>
                </div>
            </div>
        `,
        icon: "info",
        confirmButtonText: "حسناً، فهمت",
        confirmButtonColor: "#6d28d9"
    });
}

export function exportAnalyticsReport() {
    // ── Collect live data from the DOM ──────────────────────────────────────
    const g = id => document.getElementById(id);
    const gt = id => (g(id)?.textContent || "—").trim();

    const now = new Date();
    const reportDate = now.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const reportTime = now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

    // Active period label
    const activePeriodBtn = document.querySelector(".period-pill-btn.active");
    const periodLabel = activePeriodBtn?.textContent?.trim() || "الكل";

    // Overview KPIs
    const kpiTotalProducts = gt("totalProducts");
    const kpiTotalCustomers = gt("totalCustomers");
    const kpiTotalOrders = gt("totalOrders");
    const kpiNewCustomers = gt("newCustomers");
    const kpiNewCustomersPct = gt("newCustomersPercentage");

    // Sales KPIs
    const kpiDailySales = gt("dailySales");
    const kpiMonthlySales = gt("monthlySales");
    const kpiYearlySales = gt("yearlySales");
    const kpiDailyOrders = gt("dailyOrders");
    const kpiMonthlyOrders = gt("monthlyOrders");
    const kpiYearlyOrders = gt("yearlyOrders");

    // P&L
    const kpiGrossRevenue = gt("pnlGrossRevenue");
    const kpiCogs = gt("pnlCogs");
    const kpiGrossProfit = gt("pnlGrossProfit");
    const kpiGrossMarginPct = gt("pnlGrossMarginPct");
    const kpiOperatingExpenses = gt("pnlOperatingExpenses");
    const kpiReturnsAndDiscounts = gt("pnlReturnsAndDiscounts");
    const kpiNetProfit = gt("pnlNetProfit");
    const kpiNetMarginPct = gt("pnlNetMarginPct");
    const netProfitNum = parseFloat(kpiNetProfit) || 0;

    // AI Insights
    const kpiPeakHour = gt("peakHourText");
    const kpiBestDay = gt("bestDayText");

    // Top Products rows
    let topProductsHtml = "";
    const topProdsEl = g("topProducts");
    if (topProdsEl) {
        const rows = topProdsEl.querySelectorAll(".top-prod-row");
        rows.forEach((row, idx) => {
            const name = row.querySelector(".prod-title-text")?.textContent?.trim() || "—";
            const qty = row.querySelector(".prod-qty-badge")?.textContent?.trim() || "—";
            const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
            topProductsHtml += `
                <tr>
                    <td style="text-align:center; font-size:1.1rem;">${medals[idx] || (idx + 1)}</td>
                    <td>${name}</td>
                    <td style="text-align:center; color:#6d28d9; font-weight:700;">${qty}</td>
                </tr>`;
        });
    }
    if (!topProductsHtml) topProductsHtml = `<tr><td colspan="3" style="text-align:center;color:#94a3b8;">لا توجد بيانات</td></tr>`;

    // Low Stock rows
    let lowStockHtml = "";
    const lowStockEl = g("lowStockProducts");
    if (lowStockEl) {
        const rows = lowStockEl.querySelectorAll(".low-stock-row");
        rows.forEach(row => {
            const name = row.querySelector(".low-stock-title span")?.textContent?.trim() || "—";
            const badge = row.querySelector(".low-stock-badge")?.textContent?.trim() || "—";
            const isCritical = row.querySelector(".low-stock-badge.critical") !== null;
            lowStockHtml += `
                <tr>
                    <td>${name}</td>
                    <td style="text-align:center; color:${isCritical ? '#dc2626' : '#d97706'}; font-weight:700;">⚠ ${badge}</td>
                </tr>`;
        });
    }
    if (!lowStockHtml) lowStockHtml = `<tr><td colspan="2" style="text-align:center;color:#059669;">✔ جميع المنتجات متوفرة بكميات كافية</td></tr>`;

    // Category Profit rows
    let catProfitHtml = "";
    const catEl = g("categoryProfitBreakdown");
    if (catEl) {
        const rows = catEl.querySelectorAll(".category-profit-item");
        rows.forEach(row => {
            const head = row.querySelector(".category-profit-head");
            const catName = head?.children[0]?.textContent?.trim() || "—";
            const catProfit = head?.children[1]?.textContent?.trim() || "—";
            catProfitHtml += `
                <tr>
                    <td>${catName}</td>
                    <td style="text-align:center; color:#059669; font-weight:700;">${catProfit}</td>
                </tr>`;
        });
    }
    if (!catProfitHtml) catProfitHtml = `<tr><td colspan="2" style="text-align:center;color:#94a3b8;">لا توجد بيانات مصنفة</td></tr>`;

    // Dead stock summary
    const deadStockBadge = g("deadStockTabBadge")?.textContent?.trim() || "0";

    // Daily sales last 7 rows
    let dailyTableHtml = "";
    const progressEl = g("dailySalesProgress");
    if (progressEl) {
        const rows = progressEl.querySelectorAll(".progress-row-item");
        let count = 0;
        rows.forEach(row => {
            if (count >= 10) return;
            const date = row.querySelector(".progress-date")?.textContent?.trim() || "—";
            const amount = row.querySelector(".progress-amount")?.textContent?.trim() || "—";
            const orders = row.querySelector(".progress-orders-cnt")?.textContent?.trim() || "";
            dailyTableHtml += `
                <tr>
                    <td>${date}</td>
                    <td style="text-align:center; color:#6d28d9; font-weight:700;">${amount}</td>
                    <td style="text-align:center; color:#64748b;">${orders}</td>
                </tr>`;
            count++;
        });
    }
    if (!dailyTableHtml) dailyTableHtml = `<tr><td colspan="3" style="text-align:center;color:#94a3b8;">لا توجد بيانات يومية</td></tr>`;

    // ── Build Report HTML ──────────────────────────────────────────────────
    const reportHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>التقرير التحليلي الشامل - Managely</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Tajawal', Arial, sans-serif;
    background: #fff;
    color: #1e1b4b;
    font-size: 13px;
    direction: rtl;
  }

  /* ── Page Layout ── */
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm 14mm; }

  /* ── Header ── */
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #6d28d9;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  .report-logo-area h1 { font-size: 1.5rem; color: #6d28d9; font-weight: 900; margin-bottom: 2px; }
  .report-logo-area p  { font-size: 0.78rem; color: #64748b; }
  .report-meta { text-align: left; font-size: 0.78rem; color: #475569; line-height: 1.7; }
  .report-meta .badge-period {
    display: inline-block;
    background: #ede9fe;
    color: #6d28d9;
    border-radius: 20px;
    padding: 2px 10px;
    font-weight: 700;
    margin-top: 4px;
    font-size: 0.75rem;
  }

  /* ── Section Title ── */
  .section-title {
    background: linear-gradient(135deg, #6d28d9, #4f46e5);
    color: #fff;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 800;
    margin: 14px 0 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── KPI Grid ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 10px;
  }
  .kpi-card {
    border: 1.5px solid #ede9fe;
    border-radius: 10px;
    padding: 9px 10px;
    background: #fafaf9;
    text-align: center;
  }
  .kpi-card .label { font-size: 0.68rem; color: #64748b; font-weight: 700; margin-bottom: 4px; }
  .kpi-card .value { font-size: 1.05rem; color: #6d28d9; font-weight: 900; }
  .kpi-card .value.green { color: #059669; }
  .kpi-card .value.red   { color: #dc2626; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 10px; }
  thead th {
    background: #f5f3ff;
    color: #6d28d9;
    font-weight: 800;
    padding: 7px 10px;
    border-bottom: 2px solid #ddd6fe;
    text-align: right;
  }
  tbody td {
    padding: 6px 10px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  tbody tr:nth-child(even) td { background: #faf9ff; }
  tbody tr:last-child td { border-bottom: none; }

  /* ── P&L Statement ── */
  .pnl-table table { border: 1.5px solid #ede9fe; border-radius: 10px; overflow: hidden; }
  .pnl-table .row-revenue td  { background: #f0fdf4; color: #059669; font-weight: 700; }
  .pnl-table .row-cogs td     { background: #fff; color: #475569; }
  .pnl-table .row-gross td    { background: #ede9fe; color: #6d28d9; font-weight: 800; font-size: 0.9rem; }
  .pnl-table .row-expense td  { background: #fff7ed; color: #d97706; }
  .pnl-table .row-returns td  { background: #fef2f2; color: #dc2626; }
  .pnl-table .row-net-pos td  { background: #d1fae5; color: #047857; font-weight: 900; font-size: 1rem; }
  .pnl-table .row-net-neg td  { background: #fee2e2; color: #b91c1c; font-weight: 900; font-size: 1rem; }
  .pnl-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  .pnl-table td:last-child { text-align: left; font-weight: 700; font-size: 0.9rem; }

  /* ── AI Insight Cards ── */
  .insight-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .insight-card { border-radius: 10px; padding: 10px 12px; border: 1.5px solid #e2e8f0; }
  .insight-card .ic-label { font-size: 0.7rem; color: #64748b; font-weight: 700; margin-bottom: 3px; }
  .insight-card .ic-value { font-size: 0.88rem; font-weight: 800; color: #1e1b4b; margin-bottom: 4px; }
  .insight-card .ic-tip   { font-size: 0.72rem; color: #475569; line-height: 1.5; }
  .ic-gold   { background: #fffbeb; border-color: #fde68a; }
  .ic-purple { background: #faf5ff; border-color: #ddd6fe; }
  .ic-green  { background: #f0fdf4; border-color: #bbf7d0; }
  .ic-blue   { background: #f0f9ff; border-color: #bae6fd; }

  /* ── Footer ── */
  .report-footer {
    border-top: 2px solid #ede9fe;
    margin-top: 20px;
    padding-top: 8px;
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: #94a3b8;
  }
  .footer-note { color: #6d28d9; font-weight: 700; font-size: 0.72rem; }

  /* ── Print ── */
  @media print {
    body { font-size: 12px; }
    .page { padding: 8mm 10mm; }
    @page { size: A4; margin: 0; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- ════ HEADER ════ -->
  <div class="report-header">
    <div class="report-logo-area">
      <h1>📊 Managely POS</h1>
      <p>التقرير التحليلي الشامل لأداء الأعمال</p>
    </div>
    <div class="report-meta">
      <div><strong>تاريخ الطباعة:</strong> ${reportDate}</div>
      <div><strong>الوقت:</strong> ${reportTime}</div>
      <div><span class="badge-period">الفترة: ${periodLabel}</span></div>
    </div>
  </div>

  <!-- ════ SECTION 1: Overview KPIs ════ -->
  <div class="section-title">📦 الملخص العام – المنتجات والعملاء والفواتير</div>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="label">إجمالي المنتجات</div>
      <div class="value">${kpiTotalProducts}</div>
    </div>
    <div class="kpi-card">
      <div class="label">إجمالي العملاء</div>
      <div class="value">${kpiTotalCustomers}</div>
    </div>
    <div class="kpi-card">
      <div class="label">إجمالي الفواتير</div>
      <div class="value">${kpiTotalOrders}</div>
    </div>
    <div class="kpi-card">
      <div class="label">عملاء جدد اليوم</div>
      <div class="value green">${kpiNewCustomers} (${kpiNewCustomersPct})</div>
    </div>
  </div>

  <!-- ════ SECTION 2: Sales Performance ════ -->
  <div class="section-title">💰 أداء المبيعات</div>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="label">مبيعات اليوم</div>
      <div class="value green">${kpiDailySales}</div>
      <div class="label" style="margin-top:3px;">${kpiDailyOrders} فاتورة</div>
    </div>
    <div class="kpi-card">
      <div class="label">مبيعات الشهر الجاري</div>
      <div class="value green">${kpiMonthlySales}</div>
      <div class="label" style="margin-top:3px;">${kpiMonthlyOrders} فاتورة</div>
    </div>
    <div class="kpi-card">
      <div class="label">مبيعات السنة الجارية</div>
      <div class="value green">${kpiYearlySales}</div>
      <div class="label" style="margin-top:3px;">${kpiYearlyOrders} فاتورة</div>
    </div>
    <div class="kpi-card">
      <div class="label">منتجات راكدة</div>
      <div class="value ${parseInt(deadStockBadge) > 0 ? 'red' : 'green'}">${deadStockBadge} صنف</div>
    </div>
  </div>

  <!-- Daily sales table -->
  <div class="section-title">📅 آخر 10 أيام مبيعات يومية</div>
  <table>
    <thead><tr><th>التاريخ</th><th style="text-align:center;">المبيعات</th><th style="text-align:center;">الطلبات</th></tr></thead>
    <tbody>${dailyTableHtml}</tbody>
  </table>

  <!-- ════ SECTION 3: P&L Statement ════ -->
  <div class="section-title">📈 قائمة الدخل والأرباح (P&L)</div>
  <div class="pnl-table">
    <table>
      <thead><tr><th>البند</th><th>المبلغ</th></tr></thead>
      <tbody>
        <tr class="row-revenue"><td>💵 إجمالي الإيرادات (Gross Revenue)</td><td>${kpiGrossRevenue}</td></tr>
        <tr class="row-cogs"><td>🏭 تكلفة البضاعة المباعة (COGS)</td><td>- ${kpiCogs}</td></tr>
        <tr class="row-gross"><td>📊 مجمل الربح (Gross Profit) — هامش: ${kpiGrossMarginPct}</td><td>${kpiGrossProfit}</td></tr>
        <tr class="row-expense"><td>🏢 المصروفات التشغيلية</td><td>- ${kpiOperatingExpenses}</td></tr>
        <tr class="row-returns"><td>↩ المرتجعات والخصومات</td><td>- ${kpiReturnsAndDiscounts}</td></tr>
        <tr class="${netProfitNum >= 0 ? 'row-net-pos' : 'row-net-neg'}">
          <td>${netProfitNum >= 0 ? '✅' : '⚠'} صافي الربح (Net Profit) — هامش: ${kpiNetMarginPct}</td>
          <td>${kpiNetProfit}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ════ SECTION 4: AI Insights ════ -->
  <div class="section-title">🤖 رؤى الذكاء الاصطناعي وتوصيات الأداء</div>
  <div class="insight-row">
    <div class="insight-card ic-gold">
      <div class="ic-label">🔥 ساعة الذروة الذهبية</div>
      <div class="ic-value">${kpiPeakHour}</div>
      <div class="ic-tip">جهّز طاقم الكاشير وحضّر الأصناف الأكثر طلباً قبل هذه الساعة بـ 30 دقيقة.</div>
    </div>
    <div class="insight-card ic-green">
      <div class="ic-label">📅 أفضل يوم في الأسبوع</div>
      <div class="ic-value">${kpiBestDay}</div>
      <div class="ic-tip">خصص عروض ترويجية في الأيام الأقل مبيعاً لتحقيق نمو يتجاوز 20%.</div>
    </div>
  </div>

  <!-- ════ SECTION 5: Top Products & Low Stock side by side ════ -->
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
    <div>
      <div class="section-title">🏆 أعلى 5 منتجات مبيعاً</div>
      <table>
        <thead><tr><th style="width:30px;">#</th><th>المنتج</th><th style="text-align:center;">الكمية</th></tr></thead>
        <tbody>${topProductsHtml}</tbody>
      </table>
    </div>
    <div>
      <div class="section-title">⚠ المنتجات منخفضة المخزون</div>
      <table>
        <thead><tr><th>المنتج</th><th style="text-align:center;">المخزون</th></tr></thead>
        <tbody>${lowStockHtml}</tbody>
      </table>
    </div>
  </div>

  <!-- ════ SECTION 6: Category Profit Breakdown ════ -->
  <div class="section-title">📂 ربحية الفئات</div>
  <table>
    <thead><tr><th>الفئة</th><th style="text-align:center;">الربح والنسبة</th></tr></thead>
    <tbody>${catProfitHtml}</tbody>
  </table>

  <!-- ════ FOOTER ════ -->
  <div class="report-footer">
    <div class="footer-note">Managely POS – نظام إدارة المبيعات</div>
    <div>تم إنشاء هذا التقرير آلياً بتاريخ ${reportDate} – ${reportTime}</div>
  </div>

</div>
<script>
  // Auto-trigger print dialog after fonts load
  window.addEventListener("load", () => {
    setTimeout(() => window.print(), 800);
  });
</script>
</body>
</html>`;

    // Open in new window
    const win = window.open("", "_blank", "width=900,height=700,scrollbars=yes,resizable=yes");
    if (!win) {
        if (typeof Swal !== "undefined") {
            Swal.fire({ icon: "warning", title: "تنبيه", text: "يرجى السماح بالنوافذ المنبثقة لفتح التقرير", confirmButtonColor: "#6d28d9" });
        }
        return;
    }
    win.document.open();
    win.document.write(reportHtml);
    win.document.close();
}

// Make functions accessible from HTML onclick attributes
window.switchAnalyticsTab = switchAnalyticsTab;
window.changeAnalyticsPeriod = changeAnalyticsPeriod;
window.filterDeadStockTable = filterDeadStockTable;
window.handleDeadStockSearch = handleDeadStockSearch;
window.suggestProductPromo = suggestProductPromo;
window.exportAnalyticsReport = exportAnalyticsReport;

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    loadStatistics().catch((e) => console.error("Initialization error:", e));
});