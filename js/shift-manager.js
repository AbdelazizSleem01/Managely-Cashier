/**
 * Managely POS - Shift Management & Z-Report System (إدارة الوردية وجرد الدرج)
 */

export function getActiveShift() {
    try {
        const raw = localStorage.getItem("managely_active_shift");
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.error("Error reading active shift:", e);
        return null;
    }
}

export function setActiveShift(shift) {
    if (!shift) {
        localStorage.removeItem("managely_active_shift");
    } else {
        localStorage.setItem("managely_active_shift", JSON.stringify(shift));
    }
    updateShiftBadgeUI();
}

export function openNewShift(startingCash = 0, cashierName = "الكاشير") {
    const shiftNumber = (parseInt(localStorage.getItem("managely_last_shift_num") || "0", 10) + 1);
    localStorage.setItem("managely_last_shift_num", shiftNumber.toString());

    const shift = {
        id: "SHIFT_" + Date.now(),
        shiftNumber: shiftNumber,
        cashierName: cashierName || "الكاشير",
        openedAt: new Date().toISOString(),
        startingCash: parseFloat(startingCash || 0),
        status: "open"
    };

    setActiveShift(shift);

    Swal.fire({
        icon: "success",
        title: `تم فتح الوردية رقم #${shiftNumber} بنجاح`,
        html: `
            <div style="direction: rtl; text-align: center; font-family: 'Tajawal', sans-serif;">
                <p style="margin: 4px 0; color: #475569;">العهدة الافتتاحية المسجلة:</p>
                <div style="font-size: 1.5rem; font-weight: 900; color: #10b981; margin-bottom: 8px;">
                    ${shift.startingCash.toFixed(2)} ج.م
                </div>
                <p style="font-size: 0.85rem; color: #64748b;">مسؤول الوردية: <strong>${shift.cashierName}</strong></p>
            </div>
        `,
        confirmButtonColor: "#10b981",
        confirmButtonText: "متابعة البيع"
    });

    return shift;
}

export async function calculateShiftFinancials() {
    const shift = getActiveShift();
    if (!shift) return null;

    const openedDate = new Date(shift.openedAt);
    let sales = [];
    let treasury = [];

    try {
        if (window.electronAPI && typeof window.electronAPI.getSales === "function") {
            sales = (await window.electronAPI.getSales()) || [];
        }
        if (window.electronAPI && typeof window.electronAPI.getTreasuryTransactions === "function") {
            treasury = (await window.electronAPI.getTreasuryTransactions()) || [];
        }
    } catch (err) {
        console.error("Error fetching shift transactions:", err);
    }

    // Filter transactions created during this shift
    const shiftSales = sales.filter(s => new Date(s.date) >= openedDate);
    const shiftTreasury = treasury.filter(t => new Date(t.date) >= openedDate);

    let cashSales = 0;
    let cardSales = 0;
    let walletSales = 0;
    let creditSales = 0;
    let totalGrossSales = 0;
    let totalInvoicesCount = shiftSales.length;

    shiftSales.forEach(s => {
        const total = parseFloat(s.total || 0);
        totalGrossSales += total;
        const method = s.paymentMethod || "cash";

        if (method === "split" && s.splitPayment) {
            cashSales += parseFloat(s.splitPayment.cash || 0);
            cardSales += parseFloat(s.splitPayment.card || 0);
        } else if (method === "visaCard" || method === "card" || method === "visa") {
            cardSales += total;
        } else if (method === "vodafoneCash" || method === "wallet") {
            walletSales += total;
        } else if (method === "credit") {
            creditSales += total;
        } else {
            cashSales += total;
        }
    });

    // Expenses & Returns from Treasury during this shift
    const expenses = shiftTreasury
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const returns = shiftTreasury
        .filter(t => t.type === "returned")
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const expectedCashInDrawer = shift.startingCash + cashSales - expenses - returns;

    return {
        shift,
        totalInvoicesCount,
        totalGrossSales,
        startingCash: shift.startingCash,
        cashSales,
        cardSales,
        walletSales,
        creditSales,
        expenses,
        returns,
        expectedCashInDrawer
    };
}

export async function closeCurrentShift(actualCashCounted, notes = "") {
    const summary = await calculateShiftFinancials();
    if (!summary) return;

    const actual = parseFloat(actualCashCounted || 0);
    const diff = actual - summary.expectedCashInDrawer;

    const closedRecord = {
        ...summary.shift,
        closedAt: new Date().toISOString(),
        status: "closed",
        notes: notes || "",
        actualCashCounted: actual,
        expectedCashInDrawer: summary.expectedCashInDrawer,
        difference: diff,
        totalInvoicesCount: summary.totalInvoicesCount,
        totalGrossSales: summary.totalGrossSales,
        cashSales: summary.cashSales,
        cardSales: summary.cardSales,
        walletSales: summary.walletSales,
        creditSales: summary.creditSales,
        expenses: summary.expenses,
        returns: summary.returns
    };

    // Save to shift history in localStorage
    try {
        const historyRaw = localStorage.getItem("managely_shifts_history");
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        history.unshift(closedRecord);
        localStorage.setItem("managely_shifts_history", JSON.stringify(history.slice(0, 100)));
    } catch (e) {
        console.error("Error saving shift history:", e);
    }

    // Clear active shift
    setActiveShift(null);

    // Auto-backup databases safely in background
    try {
        if (window.electronAPI && typeof window.electronAPI.autoBackup === "function") {
            window.electronAPI.autoBackup().catch((e) => console.warn("Auto-backup shift notice:", e));
        }
    } catch (e) {}


    // Show Confirmation & Offer Print Z-Report
    Swal.fire({
        icon: diff === 0 ? "success" : diff < 0 ? "warning" : "info",
        title: `تم تقفيل الوردية #${closedRecord.shiftNumber} بنجاح`,
        html: `
            <div style="direction: rtl; text-align: right; font-family: 'Tajawal', sans-serif;">
                <div style="background: #f8fafc; padding: 14px; border-radius: 12px; border: 1.5px solid #e2e8f0; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="color: #64748b;">المبلغ الفعلي بالدرج:</span>
                        <strong style="color: #0f172a; font-family: monospace;">${actual.toFixed(2)} ج.م</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="color: #64748b;">المبلغ المتوقع بالدرج:</span>
                        <strong style="color: #6001e3; font-family: monospace;">${summary.expectedCashInDrawer.toFixed(2)} ج.م</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
                        <span>حالة الفارق:</span>
                        <strong style="color: ${diff === 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#3b82f6'}; font-family: monospace;">
                            ${diff === 0 ? 'مطابق تماماً (0.00)' : diff < 0 ? `عجز: ${Math.abs(diff).toFixed(2)} ج.م` : `زيادة: ${diff.toFixed(2)} ج.م`}
                        </strong>
                    </div>
                </div>
                <p style="font-size: 0.85rem; color: #64748b; text-align: center; margin: 0;">
                    هل ترغب في طباعة إيصال تقرير الوردية (Z-Report) الآن؟
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-print"></i> طباعة إيصال Z-Report',
        cancelButtonText: 'إغلاق',
        confirmButtonColor: "#6001e3",
        cancelButtonColor: "#64748b"
    }).then((result) => {
        if (result.isConfirmed) {
            printZReportThermal(closedRecord);
        }
    });

    return closedRecord;
}

export function printZReportThermal(record) {
    if (!record) return;

    const diffText = record.difference === 0 
        ? "مطابق تماماً (0.00 ج.م)" 
        : record.difference < 0 
            ? `عجز: ${Math.abs(record.difference).toFixed(2)} ج.م` 
            : `زيادة: ${record.difference.toFixed(2)} ج.م`;

    const storeSettings = JSON.parse(localStorage.getItem("managely_store_settings") || "{}");
    const storeName = storeSettings.storeName || "Managely POS";

    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="utf-8">
            <title>تقرير الوردية Z-Report #${record.shiftNumber}</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace, 'Tajawal', sans-serif;
                    width: 78mm;
                    margin: 0 auto;
                    padding: 8px;
                    font-size: 12px;
                    color: #000;
                    line-height: 1.4;
                }
                .text-center { text-align: center; }
                .bold { font-weight: bold; }
                .title { font-size: 16px; font-weight: 900; margin: 4px 0; }
                .divider { border-top: 1px dashed #000; margin: 6px 0; }
                .double-divider { border-top: 2px solid #000; margin: 8px 0; }
                .row { display: flex; justify-content: space-between; margin: 3px 0; }
                .highlight { font-size: 13px; font-weight: 900; }
                @media print {
                    body { width: 100%; margin: 0; padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="text-center">
                <div class="title">${storeName}</div>
                <div class="bold">تقرير إغلاق الوردية (Z-REPORT)</div>
                <div>وردية رقم: #${record.shiftNumber}</div>
            </div>
            <div class="divider"></div>
            <div class="row"><span>المسؤول:</span><span>${record.cashierName}</span></div>
            <div class="row"><span>تاريخ الفتح:</span><span>${new Date(record.openedAt).toLocaleString('ar-EG')}</span></div>
            <div class="row"><span>تاريخ الإغلاق:</span><span>${new Date(record.closedAt).toLocaleString('ar-EG')}</span></div>
            <div class="row"><span>عدد الفواتير:</span><span class="bold">${record.totalInvoicesCount}</span></div>
            <div class="double-divider"></div>
            <div class="row"><span>العهدة الافتتاحية:</span><span>${record.startingCash.toFixed(2)} ج.م</span></div>
            <div class="row"><span>مبيعات نقدي (كاش):</span><span>${record.cashSales.toFixed(2)} ج.م</span></div>
            <div class="row"><span>مبيعات بطاقات (فيزا):</span><span>${record.cardSales.toFixed(2)} ج.م</span></div>
            <div class="row"><span>محافظ إلكترونية:</span><span>${record.walletSales.toFixed(2)} ج.م</span></div>
            <div class="row"><span>مبيعات حساب آجل:</span><span>${record.creditSales.toFixed(2)} ج.م</span></div>
            <div class="row"><span>المصروفات المسحوبة:</span><span>-${record.expenses.toFixed(2)} ج.م</span></div>
            <div class="row"><span>المرتجعات:</span><span>-${record.returns.toFixed(2)} ج.م</span></div>
            <div class="double-divider"></div>
            <div class="row highlight"><span>إجمالي المبيعات:</span><span>${record.totalGrossSales.toFixed(2)} ج.م</span></div>
            <div class="row highlight"><span>الكاش المتوقع بالدرج:</span><span>${record.expectedCashInDrawer.toFixed(2)} ج.م</span></div>
            <div class="row highlight"><span>الكاش الفعلي المحسوب:</span><span>${record.actualCashCounted.toFixed(2)} ج.م</span></div>
            <div class="divider"></div>
            <div class="row bold"><span>الفارق (عجز/زيادة):</span><span>${diffText}</span></div>
            ${record.notes ? `<div class="row"><span>ملاحظات:</span><span>${record.notes}</span></div>` : ''}
            <div class="double-divider"></div>
            <div class="text-center" style="font-size: 10px; margin-top: 8px;">
                نظام Managely POS - تم الطباعة تلقائياً
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => window.close(), 800);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

export function updateShiftBadgeUI() {
    const badge = document.getElementById("currentShiftBadge");
    if (!badge) return;

    const shift = getActiveShift();
    if (shift) {
        badge.className = "pos-shift-badge shift-open";
        badge.innerHTML = `
            <span class="badge-dot"></span>
            <span>الوردية #${shift.shiftNumber} (${shift.cashierName})</span>
            <i class="fas fa-lock text-[10px] mr-1 opacity-70"></i>
        `;
        badge.title = "الوردية مفتوحة - انقر لتقفيل الوردية وجرد الدرج (Z-Report)";
    } else {
        badge.className = "pos-shift-badge shift-closed";
        badge.innerHTML = `
            <span class="badge-dot"></span>
            <span>الوردية مغلقة</span>
            <i class="fas fa-plus-circle text-[10px] mr-1 opacity-70"></i>
        `;
        badge.title = "انقر لفتح وردية جديدة وتسجيل العهدة الافتتاحية";
    }
}

export async function handleShiftBadgeClick() {
    const shift = getActiveShift();
    if (!shift) {
        // Open Shift Dialog
        const { value: formValues } = await Swal.fire({
            title: "فتح وردية جديدة",
            html: `
                <div style="direction: rtl; text-align: right; font-family: 'Tajawal', sans-serif;">
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #334155; margin-bottom: 6px;">
                            <i class="fas fa-user text-purple-600"></i> اسم مسؤول الوردية (الكاشير):
                        </label>
                        <input id="swalShiftCashier" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box; font-size: 0.95rem;" placeholder="اسم الكاشير" value="الكاشير">
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #334155; margin-bottom: 6px;">
                            <i class="fas fa-coins text-emerald-600"></i> عهدة بداية الوردية (الكاش الافتتاحي بالدرج):
                        </label>
                        <input id="swalShiftFloat" type="number" step="any" min="0" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box; font-size: 1.1rem; font-weight: bold; color: #10b981;" placeholder="0.00" value="0">
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-play"></i> بدء الوردية',
            cancelButtonText: "إلغاء",
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#64748b",
            preConfirm: () => {
                const cashier = document.getElementById("swalShiftCashier")?.value.trim() || "الكاشير";
                const startCash = parseFloat(document.getElementById("swalShiftFloat")?.value || "0");
                return { cashier, startCash };
            }
        });

        if (formValues) {
            openNewShift(formValues.startCash, formValues.cashier);
        }
    } else {
        // Close Shift / Z-Report Dialog
        const summary = await calculateShiftFinancials();
        if (!summary) return;

        const { value: formValues } = await Swal.fire({
            title: `جرد وتقفيل الوردية #${shift.shiftNumber}`,
            html: `
                <div style="direction: rtl; text-align: right; font-family: 'Tajawal', sans-serif;">
                    <div style="background: #f8fafc; padding: 12px; border-radius: 12px; border: 1.5px solid #e2e8f0; margin-bottom: 14px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem;">
                            <div><span style="color: #64748b;">مسؤول الوردية:</span> <strong>${shift.cashierName}</strong></div>
                            <div><span style="color: #64748b;">عدد الفواتير:</span> <strong>${summary.totalInvoicesCount}</strong></div>
                            <div><span style="color: #64748b;">العهدة الافتتاحية:</span> <strong>${summary.startingCash.toFixed(2)} ج.م</strong></div>
                            <div><span style="color: #64748b;">مبيعات الكاش:</span> <strong>${summary.cashSales.toFixed(2)} ج.م</strong></div>
                            <div><span style="color: #64748b;">مبيعات الفيزا:</span> <strong>${summary.cardSales.toFixed(2)} ج.م</strong></div>
                            <div><span style="color: #64748b;">مبيعات المحافظ:</span> <strong>${summary.walletSales.toFixed(2)} ج.م</strong></div>
                            <div><span style="color: #64748b;">المصروفات:</span> <strong style="color: #ef4444;">-${summary.expenses.toFixed(2)} ج.م</strong></div>
                            <div><span style="color: #64748b;">المرتجعات:</span> <strong style="color: #ef4444;">-${summary.returns.toFixed(2)} ج.م</strong></div>
                        </div>
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 800; color: #1e1b4b;">المبلغ المتوقع في الدرج:</span>
                            <span style="font-size: 1.25rem; font-weight: 900; color: #6001e3; font-family: monospace;">${summary.expectedCashInDrawer.toFixed(2)} ج.م</span>
                        </div>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-size: 0.9rem; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
                            <i class="fas fa-money-bill-wave text-emerald-600"></i> أدخل المبلغ النقدي الفعلي الموجود بالدرج حالياً:
                        </label>
                        <input id="swalActualCash" type="number" step="any" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box; font-size: 1.25rem; font-weight: 900; color: #10b981; border: 2px solid #86efac;" placeholder="0.00" value="${summary.expectedCashInDrawer.toFixed(2)}">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #64748b; margin-bottom: 4px;">
                            ملاحظات الإغلاق (اختياري):
                        </label>
                        <input id="swalCloseNotes" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box; font-size: 0.85rem;" placeholder="أية ملاحظات خاصة بالجرد...">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-lock"></i> تقفيل الوردية وجرد الدرج (Z-Report)',
            cancelButtonText: "إلغاء",
            confirmButtonColor: "#6001e3",
            cancelButtonColor: "#64748b",
            preConfirm: () => {
                const actual = document.getElementById("swalActualCash")?.value;
                const notes = document.getElementById("swalCloseNotes")?.value;
                if (actual === "" || isNaN(actual)) {
                    Swal.showValidationMessage("يرجى إدخال المبلغ الفعلي بالدرج");
                    return false;
                }
                return { actual: parseFloat(actual), notes };
            }
        });

        if (formValues) {
            closeCurrentShift(formValues.actual, formValues.notes);
        }
    }
}

// Global Exports
window.openNewShift = openNewShift;
window.closeCurrentShift = closeCurrentShift;
window.handleShiftBadgeClick = handleShiftBadgeClick;
window.updateShiftBadgeUI = updateShiftBadgeUI;
window.printZReportThermal = printZReportThermal;
