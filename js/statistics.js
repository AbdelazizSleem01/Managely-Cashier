async function getProducts() {
    try {
        const products = await window.electronAPI.getProducts();
        return Array.isArray(products) ? products.filter(p => p && typeof p === "object") : [];
    } catch (e) {
        showErrorToast("فشل في جلب بيانات المنتجات");
        return [];
    }
}

async function getCustomers() {
    try {
        const customers = await window.electronAPI.getCustomers();
        return Array.isArray(customers) ? customers.filter(c => c && typeof c === "object") : [];
    } catch (e) {
        showErrorToast("فشل في جلب بيانات العملاء");
        return [];
    }
}

async function getOrders() {
    try {
        const orders = await window.electronAPI.getOrders();
        return Array.isArray(orders) ? orders.filter(o => o && typeof o === "object") : [];
    } catch (e) {
        showErrorToast("فشل في جلب بيانات الأوردرات");
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
        showErrorToast("فشل في جلب بيانات المبيعات");
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
    } catch (e) { }
}

function showErrorToast(msg) {
    Swal.fire({
        icon: "error",
        title: "خطأ",
        text: msg,
        toast: true,
        position: "top-start",
        showConfirmButton: false,
        timer: 3000
    });
}

async function loadStatistics() {
    try {
        const [products, customers, orders, salesData] = await Promise.all([
            getProducts(),
            getCustomers(),
            getOrders(),
            getSalesData()
        ]);

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

        updateProductStats(products);
        updateCustomerStats(customers, orders, todayStr);
        updateOrderStats(orders);
        await updateSalesStats(orders, currentSales, todayStr, currentMonth, currentYear, now);
    } catch (e) {
        showErrorToast("فشل في تحميل الإحصائيات");
    }
}

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

let chartInstance = null;

function updateDailySalesChart(dailyList) {
    const canvas = document.getElementById("dailySalesChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sorted = [...dailyList].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(d => formatDate(d.date));
    const values = sorted.map(d => d.sales);

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Create purple gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(109, 40, 217, 0.3)");
    gradient.addColorStop(1, "rgba(109, 40, 217, 0.0)");

    chartInstance = new Chart(ctx, {
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

document.addEventListener("DOMContentLoaded", () => {
    loadStatistics().catch(() => { });
});