import { paginateArray, renderPagination } from "./pagination.js";

let currentType = "", lastFocusedElement = null;
let currentTransactionsList = [];
let currentTreasuryPage = 1;
let treasuryPageSize = 10;

async function loadTreasuryData() {
    try {
        if (!window.electronAPI) {
            return void Swal.fire({
                icon: "warning",
                title: "تنبيه",
                text: "يرجى إعادة تشغيل التطبيق للمتابعة بشكل صحيح."
            });
        }
        const t = await window.electronAPI.getTreasurySummary();
        if (!t) throw new Error("تعذر جلب ملخص الخزنة");
        
        document.getElementById("currentBalance").textContent = `${t.balance.toFixed(2)} جنيه`;
        document.getElementById("totalRevenue").textContent = `${t.totalRevenue.toFixed(2)} جنيه`;
        document.getElementById("totalExpense").textContent = `${t.totalExpense.toFixed(2)} جنيه`;
        
        const e = document.getElementById("warnings");
        e.innerHTML = "";
        if (t.warnings && t.warnings.length > 0) {
            t.warnings.forEach(w => {
                const n = document.createElement("p");
                n.textContent = w;
                n.className = "text-error font-bold";
                e.appendChild(n);
            });
        }
        renderTransactions(await window.electronAPI.getTreasuryTransactions());
        loadDailyStats();
    } catch (t) {
        console.error("Error loading treasury:", t);
    }
}

function renderTransactions(transactions, resetPage = true) {
    if (transactions !== undefined) {
        currentTransactionsList = transactions || [];
        if (resetPage) currentTreasuryPage = 1;
    }
    renderCurrentTransactionsPage();
}

function renderCurrentTransactionsPage() {
    const tbody = document.getElementById("transactionsBody");
    const pagContainer = document.getElementById("transactionsPagination");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    if (!currentTransactionsList || currentTransactionsList.length === 0) {
        if (pagContainer) pagContainer.innerHTML = "";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td colspan="6" class="text-center py-8 text-gray-500">
                <div class="flex flex-col items-center justify-center gap-2">
                    <i class="fas fa-database text-3xl opacity-30"></i>
                    <p>لا توجد معاملات مسجلة في الخزنة حالياً</p>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }

    const { pageItems, totalItems, currentPage } = paginateArray(currentTransactionsList, currentTreasuryPage, treasuryPageSize);
    currentTreasuryPage = currentPage;

    pageItems.forEach(t => {
        const tr = document.createElement("tr");
        let badgeClass, textClass, iconClass;
        
        if (t.type === "revenue") {
            badgeClass = "badge-tx revenue";
            textClass = "text-success font-bold";
            iconClass = "fa-arrow-up text-success";
        } else if (t.type === "expense") {
            badgeClass = "badge-tx expense";
            textClass = "text-error font-bold";
            iconClass = "fa-arrow-down text-error";
        } else if (t.type === "returned") {
            badgeClass = "badge-tx returned";
            textClass = "text-warning font-bold";
            iconClass = "fa-undo text-warning";
        }

        tr.innerHTML = `
            <td class="font-medium text-right">
                <div class="flex items-center gap-2">
                    <input type="checkbox" class="print-checkbox rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer" data-id="${t._id}">
                    <i class="fas ${iconClass}"></i>
                    <span>${new Date(t.date).toLocaleString("ar-EG")}</span>
                </div>
            </td>
            <td class='text-right'>
                <span class="${badgeClass}">
                    ${t.type === "revenue" ? "إيراد" : t.type === "expense" ? "مصروف" : "مرتجع"}
                </span>
            </td>
            <td class="${textClass} text-right" style="font-weight: 800; font-size: 0.95rem;">
                ${parseFloat(t.amount).toFixed(2)} <span class="text-xs">جنيه</span>
            </td>
            <td class="max-w-xs truncate text-right font-medium" title="${t.description || "لا يوجد وصف"}">
                ${t.description || '<span class="text-gray-400">لا يوجد وصف</span>'}
            </td>
            <td class='text-right'>
                <div class="flex items-center gap-2">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; color: #6d28d9; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem;">
                        <span>${t.user ? t.user.charAt(0) : "?"}</span>
                    </div>
                    <span class="font-bold text-gray-700 text-xs">${t.user || '<span class="text-gray-400">غير معروف</span>'}</span>
                </div>
            </td>
            <td class="text-right">
                <div class="table-actions">
                    <button class="btn-tbl-action edit edit-btn" data-id="${t._id}" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-tbl-action delete delete-btn" data-id="${t._id}" title="حذف">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll(".edit-btn").forEach(btn => btn.addEventListener("click", editTransaction));
    document.querySelectorAll(".delete-btn").forEach(btn => btn.addEventListener("click", deleteTransaction));

    renderPagination({
        container: "transactionsPagination",
        totalItems: totalItems,
        currentPage: currentTreasuryPage,
        pageSize: treasuryPageSize,
        pageSizeOptions: [10, 25, 50, 100],
        onPageChange: (newPage, newSize) => {
            currentTreasuryPage = newPage;
            treasuryPageSize = newSize;
            renderCurrentTransactionsPage();
        }
    });
}

function openModal(type) {
    currentType = type;
    const modal = document.getElementById("transactionModal");
    const title = document.getElementById("modalTitle");
    const iconWrap = document.getElementById("modalIconWrap");
    const icon = document.getElementById("modalIcon");
    const submitBtn = document.getElementById("submitTransaction");
    const submitBtnText = document.getElementById("submitBtnText");
    const amountInput = document.getElementById("transactionAmount");
    const descInput = document.getElementById("transactionDescription");
    const main = document.querySelector(".main-content");
    
    if (modal && title && amountInput && descInput) {
        lastFocusedElement = document.activeElement;
        if (main) main.setAttribute("inert", "");

        if (type === "revenue") {
            title.textContent = "إضافة إيراد جديد";
            if (iconWrap) {
                iconWrap.className = "modal-icon-wrap revenue";
                icon.className = "fas fa-plus-circle";
            }
            if (submitBtn) {
                submitBtn.className = "btn-submit revenue";
            }
            if (submitBtnText) submitBtnText.textContent = "تأكيد إضافة الإيراد";
        } else {
            title.textContent = "إضافة مصروف جديد";
            if (iconWrap) {
                iconWrap.className = "modal-icon-wrap expense";
                icon.className = "fas fa-minus-circle";
            }
            if (submitBtn) {
                submitBtn.className = "btn-submit expense";
            }
            if (submitBtnText) submitBtnText.textContent = "تأكيد إضافة المصروف";
        }

        amountInput.value = "";
        descInput.value = "";
        if (submitBtn) submitBtn.onclick = addTransaction;

        modal.classList.add("open");
        setTimeout(() => amountInput.focus(), 150);
    }
}

function closeModal() {
    const modal = document.getElementById("transactionModal");
    const main = document.querySelector(".main-content");
    if (modal) {
        modal.classList.remove("open");
        const amountInput = document.getElementById("transactionAmount");
        const descInput = document.getElementById("transactionDescription");
        if (amountInput) amountInput.value = "";
        if (descInput) descInput.value = "";
        if (main) main.removeAttribute("inert");
        if (lastFocusedElement) lastFocusedElement.focus();
    }
}

function handleOverlayClick(e) {
    if (e.target === document.getElementById("transactionModal")) {
        closeModal();
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const modal = document.getElementById("transactionModal");
        if (modal && modal.classList.contains("open")) {
            closeModal();
        }
    }
});

async function addTransaction() {
    try {
        const amountInput = document.getElementById("transactionAmount");
        const descInput = document.getElementById("transactionDescription");
        const amount = amountInput.value.trim();
        const desc = descInput.value.trim();

        if (!amount || parseFloat(amount) <= 0) {
            amountInput.focus();
            return void Swal.fire({
                icon: "warning",
                title: "بيانات غير مكتملة",
                text: "يرجى إدخال مبلغ صحيح أكبر من الصفر."
            });
        }

        if (!desc) {
            descInput.focus();
            return void Swal.fire({
                icon: "warning",
                title: "بيانات غير مكتملة",
                text: "يرجى إدخال وصف للعملية."
            });
        }

        const user = (await window.electronAPI.getSettings())?.currentUser || "غير معروف";
        await window.electronAPI.addTreasuryTransaction({
            type: currentType,
            amount: parseFloat(amount),
            description: desc,
            user: user
        });
        Swal.fire({
            icon: "success",
            title: "تمت الإضافة",
            text: `تمت إضافة ${currentType === "revenue" ? "الإيراد" : "المصروف"} بنجاح.`,
            timer: 1500,
            showConfirmButton: false
        });
        closeModal();
        loadTreasuryData();
    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "تنبيه",
            text: "تعذر إضافة المعاملة، يرجى المحاولة مرة أخرى."
        });
    }
}

async function editTransaction(e) {
    const id = e.target.closest(".edit-btn").dataset.id;
    const tx = await window.electronAPI.getTreasuryTransactions().then(list => list.find(item => item._id === id));
    if (!tx) {
        return void Swal.fire({
            icon: "error",
            title: "تنبيه",
            text: "تعذر العثور على المعاملة المطلوبة."
        });
    }
    currentType = tx.type;
    const modal = document.getElementById("transactionModal");
    const title = document.getElementById("modalTitle");
    const iconWrap = document.getElementById("modalIconWrap");
    const icon = document.getElementById("modalIcon");
    const submitBtn = document.getElementById("submitTransaction");
    const submitBtnText = document.getElementById("submitBtnText");
    const main = document.querySelector(".main-content");
    const amountInput = document.getElementById("transactionAmount");
    const descInput = document.getElementById("transactionDescription");

    if (modal && title && amountInput && descInput) {
        lastFocusedElement = document.activeElement;
        if (main) main.setAttribute("inert", "");

        const isRev = tx.type === "revenue";
        title.textContent = "تعديل " + (isRev ? "الإيراد" : "المصروف");
        if (iconWrap) {
            iconWrap.className = "modal-icon-wrap " + (isRev ? "revenue" : "expense");
            icon.className = "fas fa-edit";
        }
        if (submitBtn) {
            submitBtn.className = "btn-submit " + (isRev ? "revenue" : "expense");
        }
        if (submitBtnText) submitBtnText.textContent = "حفظ التعديلات";

        submitBtn.onclick = () => updateTransaction(id);
        amountInput.value = tx.amount;
        descInput.value = tx.description;
        modal.classList.add("open");
        setTimeout(() => amountInput.focus(), 150);
    }
}

async function updateTransaction(id) {
    try {
        const amount = document.getElementById("transactionAmount").value.trim();
        const desc = document.getElementById("transactionDescription").value.trim();
        if (!amount || !desc) {
            return void Swal.fire({
                icon: "warning",
                title: "بيانات غير مكتملة",
                text: "يرجى إدخال المبلغ والوصف للمتابعة."
            });
        }
        const user = (await window.electronAPI.getSettings())?.currentUser || "غير معروف";
        await window.electronAPI.updateTreasuryTransaction(id, {
            type: currentType,
            amount: parseFloat(amount),
            description: desc,
            user: user,
            date: (new Date).toISOString()
        });
        Swal.fire({
            icon: "success",
            title: "تم التعديل",
            text: "تم تعديل المعاملة بنجاح."
        });
        closeModal();
        loadTreasuryData();
    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "تنبيه",
            text: "تعذر تعديل المعاملة، يرجى المحاولة مرة أخرى."
        });
    }
}

async function deleteTransaction(e) {
    const id = e.target.closest(".delete-btn").dataset.id;
    const res = await Swal.fire({
        title: "تأكيد الحذف",
        text: "هل أنت متأكد من رغبتك في حذف هذه المعاملة؟ لن تتمكن من استرجاعها.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "نعم، احذفها",
        cancelButtonText: "إلغاء"
    });

    if (res.isConfirmed) {
        try {
            await window.electronAPI.deleteTreasuryTransaction(id);
            Swal.fire({
                icon: "success",
                title: "تم الحذف",
                text: "تم حذف المعاملة بنجاح."
            });
            loadTreasuryData();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "تنبيه",
                text: "تعذر حذف المعاملة، يرجى المحاولة مرة أخرى."
            });
        }
    }
}

async function filterTransactions() {
    try {
        const filter = {
            date: document.getElementById("filterDate").value,
            type: document.getElementById("filterType").value,
            user: document.getElementById("filterUser").value,
            amount: document.getElementById("filterAmount").value
        };
        renderTransactions(await window.electronAPI.filterTreasuryTransactions(filter));
    } catch (err) {
        console.error("Error filtering transactions:", err);
    }
}

let dailyStatsChart = null;
async function loadDailyStats() {
    try {
        const transactions = await window.electronAPI.getTreasuryTransactions();
        const endDate = new Date;
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);

        const filtered = transactions.filter(t => {
            const d = new Date(t.date);
            const dStr = new Date(d.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" }));
            const startStr = new Date(startDate.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" }));
            const endStr = new Date(endDate.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" }));
            return dStr >= startStr && dStr <= endStr;
        });

        const statsByDay = {};
        let currentDay = new Date(startDate);
        while (currentDay <= endDate) {
            const key = currentDay.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
            statsByDay[key] = { revenue: 0, expense: 0, returned: 0 };
            currentDay.setDate(currentDay.getDate() + 1);
        }

        filtered.forEach(t => {
            const key = new Date(t.date).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
            if (statsByDay[key]) {
                if (t.type === "revenue") statsByDay[key].revenue += parseFloat(t.amount);
                else if (t.type === "expense") statsByDay[key].expense += parseFloat(t.amount);
                else if (t.type === "returned") statsByDay[key].returned += parseFloat(t.amount);
            }
        });

        const list = Object.keys(statsByDay).map(k => ({
            date: k,
            revenue: statsByDay[k].revenue,
            expense: statsByDay[k].expense,
            returned: statsByDay[k].returned,
            net: statsByDay[k].revenue - statsByDay[k].expense - statsByDay[k].returned
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        const tbody = document.getElementById("dailyStatsBody");
        if (tbody) {
            tbody.innerHTML = "";
            if (list.length > 0) {
                list.forEach(item => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td class="text-right">${new Date(item.date).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" })}</td>
                        <td class="text-right text-success">${item.revenue.toFixed(2)} جنيه</td>
                        <td class="text-right text-error">${item.expense.toFixed(2)} جنيه</td>
                        <td class="text-right ${item.net >= 0 ? "text-success" : "text-error"}">${item.net.toFixed(2)} جنيه</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">لا توجد بيانات لعرضها</td></tr>';
            }
        }

        const labels = list.map(item => new Date(item.date).toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo" }));
        const revData = list.map(item => item.revenue);
        const expData = list.map(item => item.expense);
        const retData = list.map(item => item.returned);
        const netData = list.map(item => item.net);

        const canvas = document.getElementById("dailyStatsChart");
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (dailyStatsChart) dailyStatsChart.destroy();
            dailyStatsChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        { label: "الإيرادات", data: revData, borderColor: "rgba(40, 167, 69, 1)", backgroundColor: "rgba(40, 167, 69, 0.2)", fill: false, tension: 0.1 },
                        { label: "المصروفات", data: expData, borderColor: "rgba(220, 53, 69, 1)", backgroundColor: "rgba(220, 53, 69, 0.2)", fill: false, tension: 0.1 },
                        { label: "المرتجعات", data: retData, borderColor: "rgba(255, 193, 7, 1)", backgroundColor: "rgba(255, 193, 7, 0.2)", fill: false, tension: 0.1 },
                        { label: "الصافي", data: netData, borderColor: "rgba(59, 130, 246, 1)", backgroundColor: "rgba(59, 130, 246, 0.2)", fill: false, tension: 0.1 }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: { title: { display: true, text: "التاريخ" } },
                        y: { title: { display: true, text: "المبلغ (جنيه)" }, beginAtZero: true }
                    },
                    plugins: {
                        legend: { position: "top" },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} جنيه`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (err) {
        console.error("Error loading daily stats:", err);
    }
}

async function clearAllTransactions() {
    const res = await Swal.fire({
        title: "تأكيد تفريغ الخزنة",
        text: "سيتم حذف جميع سجلات ومعاملات الخزنة نهائياً! هل أنت متأكد؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "نعم، أفرغ الكل",
        cancelButtonText: "إلغاء"
    });

    if (res.isConfirmed) {
        try {
            const list = await window.electronAPI.getTreasuryTransactions();
            for (const item of list) await window.electronAPI.deleteTreasuryTransaction(item._id);
            Swal.fire({
                icon: "success",
                title: "تم التفريغ",
                text: "تم تفريغ سجلات الخزنة بنجاح."
            });
            loadTreasuryData();
            loadDailyStats();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "تنبيه",
                text: "تعذر تفريغ المعاملات، يرجى المحاولة مرة أخرى."
            });
        }
    }
}

async function deleteSelectedTransactions() {
    const selectedIds = Array.from(document.querySelectorAll(".print-checkbox:checked")).map(el => el.dataset.id);
    if (selectedIds.length === 0) {
        return Swal.fire({
            icon: "warning",
            title: "تنبيه",
            text: "يرجى تحديد معاملة واحدة على الأقل للمتابعة.",
            confirmButtonColor: "#3085d6"
        });
    }

    const res = await Swal.fire({
        title: "تأكيد حذف المعاملات",
        text: `سيتم حذف ${selectedIds.length} معاملة محددة نهائياً. هل أنت متأكد؟`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "نعم، احذف المحدد",
        cancelButtonText: "إلغاء"
    });

    if (res.isConfirmed) {
        try {
            for (const id of selectedIds) await window.electronAPI.deleteTreasuryTransaction(id);
            Swal.fire({
                icon: "success",
                title: "تم الحذف",
                text: "تم حذف المعاملات المحددة بنجاح."
            });
            loadTreasuryData();
            loadDailyStats();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "تنبيه",
                text: "تعذر حذف المعاملات، يرجى المحاولة مرة أخرى."
            });
        }
    }
}

async function printReport() {
    try {
        const summary = await window.electronAPI.getTreasurySummary();
        const transactions = await window.electronAPI.getTreasuryTransactions();
        const checked = Array.from(document.querySelectorAll(".print-checkbox:checked")).map(el => el.dataset.id);
        const toPrint = checked.length > 0 ? transactions.filter(t => checked.includes(t._id)) : transactions.slice(0, 30);

        if (checked.length === 0) {
            return void Swal.fire({
                icon: "warning",
                title: "تنبيه",
                text: "يرجى تحديد المعاملات التي ترغب في طباعتها.",
                confirmButtonColor: "#3085d6"
            });
        }

        const reportHtml = `
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>تقرير الخزنة المالي</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
                    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', Arial, sans-serif; }
                    body { width: 80mm; padding: 5px; font-size: 12px; color: #000; background: white; }
                    .main-div { padding: 5px; background: white; border: 1px solid #000; border-radius: 5px; max-width: 80mm; }
                    .header { text-align: center; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed #000; }
                    .title { font-weight: bold; font-size: 16px; margin: 2px 0; }
                    .date { font-size: 11px; margin-bottom: 3px; }
                    .summary { margin: 5px 0; padding: 5px 0; border-bottom: 1px dashed #000; }
                    .summary-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 12px; }
                    .summary-label { font-weight: bold; }
                    .summary-value { font-weight: bold; }
                    .balance { color: #000; }
                    .revenue { color: #28a745; }
                    .expense { color: #dc3545; }
                    .returned { color: #ffc107; }
                    table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 11px; }
                    th { background: #f8f9fa; padding: 3px; border-bottom: 1px solid #000; font-weight: bold; text-align: right; }
                    td { padding: 3px; border-bottom: 1px solid #eee; text-align: right; }
                    .footer { text-align: center; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #000; font-size: 10px; }
                </style>
            </head>
            <body>
                <div class='main-div'>
                    <div class="header">
                        <div class="title">تقرير الخزنة المالي</div>
                        <div class="date">${(new Date).toLocaleString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div class="summary">
                        <div class="summary-row">
                            <span class="summary-label">الرصيد الحالي:</span>
                            <span class="summary-value balance">${summary.balance.toFixed(2)} ج.م</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">إجمالي الإيرادات:</span>
                            <span class="summary-value revenue">${summary.totalRevenue.toFixed(2)} ج.م</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">إجمالي المصروفات:</span>
                            <span class="summary-value expense">${summary.totalExpense.toFixed(2)} ج.م</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">إجمالي المرتجعات:</span>
                            <span class="summary-value returned">${summary.totalReturned.toFixed(2)} ج.م</span>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 25%">الوقت</th>
                                <th style="width: 25%">النوع</th>
                                <th style="width: 25%">المبلغ</th>
                                <th style="width: 25%">البيان</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${toPrint.map(t => `
                                <tr>
                                    <td>${new Date(t.date).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</td>
                                    <td>${t.type === "revenue" ? "إيراد" : t.type === "expense" ? "مصروف" : "مرتجع"}</td>
                                    <td>${parseFloat(t.amount).toFixed(2)} ج.م</td>
                                    <td style="font-size: 10px;">${t.description || ""}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                    <div class="footer">
                        <div>عدد الحركات: ${toPrint.length}</div>
                        <div>نظام إدارة الخزنة</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            const printRes = await window.electronAPI.printInvoiceToPOS(reportHtml, "treasury-report", "mini");
            if (printRes && printRes.success) {
                Swal.fire({ icon: "success", title: "تمت الطباعة", text: "تمت طباعة التقرير بنجاح على طابعة الفواتير." });
            } else {
                const pdfPath = await window.electronAPI.printTreasuryReport(reportHtml);
                Swal.fire({ icon: "success", title: "تم التصدير", text: `تم حفظ التقرير كملف PDF بنجاح في المسار:\n${pdfPath}` });
            }
        } catch (err) {
            Swal.fire({ icon: "error", title: "تنبيه", text: "تعذر إتمام عملية الطباعة، يرجى التأكد من توصيل الطابعة." });
        }
    } catch (err) {
        Swal.fire({ icon: "error", title: "تنبيه", text: "تعذر إنشاء تقرير الخزنة، يرجى المحاولة مرة أخرى." });
    }
}

async function exportToExcel() {
    try {
        const transactions = await window.electronAPI.getTreasuryTransactions();
        if (!transactions || transactions.length === 0) {
            return void Swal.fire({
                icon: "info",
                title: "لا توجد بيانات",
                text: "لا توجد معاملات مسجلة لتصديرها إلى ملف Excel."
            });
        }
        const data = [
            ["التاريخ والوقت", "النوع", "المبلغ", "الوصف", "المستخدم"],
            ...transactions.map(t => [
                new Date(t.date).toLocaleString("ar-EG"),
                t.type === "revenue" ? "إيراد" : t.type === "expense" ? "مصروف" : "مرتجع",
                parseFloat(t.amount).toFixed(2) + " جنيه",
                t.description || "لا يوجد وصف",
                t.user || "غير معروف"
            ])
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 25 }, { wch: 15 }];
        ws["!freeze"] = { rows: 1 };
        XLSX.utils.book_append_sheet(wb, ws, "سجل الخزنة");
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const bytes = new Uint8Array(out);
        const filePath = await window.electronAPI.uploadFile({
            name: `treasury_report_${(new Date).toISOString().slice(0, 10)}.xlsx`,
            arrayBuffer: bytes
        }, "Documents");

        if (filePath) {
            Swal.fire({
                icon: "success",
                title: "تم التصدير بنجاح",
                text: `تم حفظ الملف في:\n${filePath}`
            });
        } else {
            Swal.fire({
                icon: "info",
                title: "تم الإلغاء",
                text: "تم إلغاء عملية تصدير الملف."
            });
        }
    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "تنبيه",
            text: "تعذر تصدير السجل إلى Excel، يرجى المحاولة لاحقاً."
        });
    }
}

window.clearAllTransactions = clearAllTransactions;
window.deleteSelectedTransactions = deleteSelectedTransactions;
window.loadDailyStats = loadDailyStats;
window.openModal = openModal;
window.closeModal = closeModal;
window.handleOverlayClick = handleOverlayClick;
window.addTransaction = addTransaction;
window.filterTransactions = filterTransactions;
window.printReport = printReport;
window.exportToExcel = exportToExcel;
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.addEventListener("load", loadTreasuryData);