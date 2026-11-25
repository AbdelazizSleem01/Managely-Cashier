import { paginateArray, renderPagination } from "./pagination.js";
import { buildSalesReceipt } from "./receipt-template.js";

let allSales = [];
let filteredSales = [];
let currentSalesPage = 1;
let salesPageSize = 10;
let currentSearchQuery = "";

export function formatSaleRow(s) {
    const items = Array.isArray(s.items) ? s.items : [];
    const currSym = s.currencySymbol || (s.currency && s.currency.symbol) || "ج.م";
    const formattedDate = new Date(s.date).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    const itemsHtml = items.map(item => `
        <div class="product-item-chip">
            <span class="prod-name" title="${item.name || 'منتج غير محدد'}">${item.name || "منتج غير محدد"}</span>
            <span class="prod-qty-price">${item.quantity || 0} × ${(item.price || 0).toFixed(2)} ${currSym}</span>
        </div>
    `).join("");

    return `
        <tr>
            <td>
                <div style="font-weight: 800; color: var(--primary-color);">
                    #${s.invoiceNumber || "--"}
                    ${s.hasReturn ? '<span class="badge-returned"><i class="fas fa-rotate-left"></i> مرتجع</span>' : ''}
                    ${s.currencyCode && s.currencyCode !== 'EGP' ? `<span style="font-size: 0.72rem; background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; border: 1px solid #fde68a; margin-right: 4px;">${s.currencyCode}</span>` : ''}
                </div>
            </td>
            <td style="color: #64748b; font-size: 0.85rem;">${formattedDate}</td>
            <td>
                <div class="row-product-list">
                    ${itemsHtml || '<span style="color:#94a3b8; font-size:0.8rem;">لا توجد عناصر</span>'}
                </div>
            </td>
            <td><span class="total-amount-tag">${(Number(s.total) || 0).toFixed(2)} ${currSym}</span></td>
            <td style="font-weight: 600;">${s.customerName || "--"}</td>
            <td style="direction: ltr; text-align: right; color: #64748b; font-size: 0.85rem;">${s.customerPhone || "--"}</td>
            <td>
                <div class="table-action-btns">
                    <button onclick="printSale('${s._id}')" class="btn-tbl-action btn-tbl-print" title="طباعة الفاتورة">
                        <i class="fas fa-print"></i>
                    </button>
                    <button onclick="deleteSale('${s._id}')" class="btn-tbl-action btn-tbl-delete" title="حذف الفاتورة">
                        <i class="fas fa-trash-can"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

export function formatCompactCurrency(value) {
    const num = Number(value) || 0;
    const abs = Math.abs(num);
    if (abs >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + "B ج.م";
    }
    if (abs >= 1_000_000) {
        return (num / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + "M ج.م";
    }
    if (abs >= 10_000) {
        return (num / 1_000).toFixed(1).replace(/\.?0+$/, '') + "K ج.م";
    }
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ج.م";
}

export function formatCompactCount(value) {
    const num = Number(value) || 0;
    const abs = Math.abs(num);
    if (abs >= 1_000_000) {
        return (num / 1_000_000).toFixed(1).replace(/\.?0+$/, '') + "M";
    }
    if (abs >= 10_000) {
        return (num / 1_000).toFixed(1).replace(/\.?0+$/, '') + "K";
    }
    return num.toLocaleString("ar-EG");
}

export function updateSalesStats(sales) {
    if (!Array.isArray(sales)) return;
    const totalAmt = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalRet = sales.filter(s => s.hasReturn).length;
    const totalProfit = sales.reduce((sum, s) => {
        let p = 0;
        if (s.netProfit != null) {
            p = Number(s.netProfit);
        } else if (Array.isArray(s.items)) {
            const cost = s.items.reduce((cSum, it) => cSum + ((Number(it.costPrice || it.purchasePrice) || 0) * (Number(it.quantity) || 1)), 0);
            p = Math.max(0, (Number(s.total) || 0) - cost);
        }
        return sum + p;
    }, 0);

    const elAmt = document.getElementById("totalSalesAmount");
    const elCnt = document.getElementById("totalInvoicesCount");
    const elRet = document.getElementById("totalReturnsCount");
    const elProf = document.getElementById("totalProfitAmount");

    if (elAmt) {
        elAmt.textContent = formatCompactCurrency(totalAmt);
        elAmt.title = `إجمالي المبيعات الدقيق: ${totalAmt.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م (${totalAmt.toFixed(2)} EGP)`;
    }
    if (elCnt) {
        elCnt.textContent = formatCompactCount(sales.length);
        elCnt.title = `إجمالي عدد الفواتير: ${sales.length.toLocaleString("ar-EG")}`;
    }
    if (elRet) {
        elRet.textContent = formatCompactCount(totalRet);
        elRet.title = `إجمالي المرتجعات: ${totalRet.toLocaleString("ar-EG")}`;
    }
    if (elProf) {
        elProf.textContent = formatCompactCurrency(totalProfit);
        elProf.title = `صافي الأرباح الدقيق: ${totalProfit.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م (${totalProfit.toFixed(2)} EGP)`;
    }
}

export function populateSalesCurrencyFilter(sales = []) {
    const filterEl = document.getElementById("salesCurrencyFilter");
    if (!filterEl) return;
    const currentVal = filterEl.value;

    const currenciesMap = new Map();
    (sales || []).forEach(s => {
        const code = s.currencyCode || "EGP";
        const sym = s.currencySymbol || "ج.م";
        if (!currenciesMap.has(code)) {
            currenciesMap.set(code, sym);
        }
    });

    if (currenciesMap.size <= 1 && !currenciesMap.has("EGP")) {
        currenciesMap.set("EGP", "ج.م");
    }

    let optionsHtml = `<option value="">جميع العملات</option>`;
    currenciesMap.forEach((sym, code) => {
        optionsHtml += `<option value="${code}" ${code === currentVal ? 'selected' : ''}>${code} (${sym})</option>`;
    });

    filterEl.innerHTML = optionsHtml;
}


export function renderSalesRows(sales, table, searchQuery = "") {
    if (!table) return;
    if (!Array.isArray(sales) || sales.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <p>${searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لا توجد مبيعات مسجلة حتى الآن"}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    table.innerHTML = sales.map(formatSaleRow).join("");
}

export function renderCurrentSalesPage() {
    const table = document.getElementById("salesTable");
    if (!table) return;

    const { pageItems, totalItems, currentPage } = paginateArray(filteredSales, currentSalesPage, salesPageSize);
    currentSalesPage = currentPage;
    renderSalesRows(pageItems, table, currentSearchQuery);

    renderPagination({
        container: "salesPagination",
        totalItems: totalItems,
        currentPage: currentSalesPage,
        pageSize: salesPageSize,
        pageSizeOptions: [10, 25, 50, 100],
        onPageChange: (newPage, newSize) => {
            currentSalesPage = newPage;
            salesPageSize = newSize;
            renderCurrentSalesPage();
            const card = table.closest(".sales-card-container");
            if (card) {
                card.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    });
}

export async function renderSales(searchQuery = "", resetPage = true) {
    const table = document.getElementById("salesTable");
    if (!table) return;

    currentSearchQuery = searchQuery;
    if (resetPage) {
        currentSalesPage = 1;
    }

    // 1. Render from cache immediately if not searching and allSales empty
    if (!searchQuery && allSales.length === 0) {
        try {
            const cached = localStorage.getItem("managely_sales_cache");
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    allSales = parsed;
                    filteredSales = parsed;
                    updateSalesStats(allSales);
                    renderCurrentSalesPage();
                }
            }
        } catch (e) {}
    }

    try {
        let sales = await window.electronAPI.getSales();
        if (!Array.isArray(sales)) sales = [];
        sales.sort((a, b) => new Date(b.date) - new Date(a.date));
        allSales = sales;
        updateSalesStats(allSales);

        try {
            localStorage.setItem("managely_sales_cache", JSON.stringify(sales));
        } catch (e) {}

        try {
            populateSalesCurrencyFilter(sales);
        } catch (e) {}

        const currFilterVal = document.getElementById("salesCurrencyFilter")?.value || "";

        filteredSales = sales.filter(s => {
            const matchesSearch = !searchQuery || 
                s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                s.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                s.items?.some(item => item.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
                s.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase());

            const sCode = s.currencyCode || "EGP";
            const matchesCurrency = !currFilterVal || sCode === currFilterVal;

            return matchesSearch && matchesCurrency;
        });

        renderCurrentSalesPage();
    } catch (err) {
        if (!table.children.length) {
            table.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="fas fa-triangle-exclamation" style="color: #ef4444;"></i>
                            <p style="color: #ef4444;">تعذر تحميل سجل المبيعات حالياً</p>
                            <small style="color: #64748b;">يرجى المحاولة مرة أخرى لاحقاً</small>
                        </div>
                    </td>
                </tr>
            `;
            const pag = document.getElementById("salesPagination");
            if (pag) pag.innerHTML = "";
        }
    }
}

export async function deleteSale(id) {
    if (typeof window.hasPermission === "function" && !window.hasPermission("canDeleteSale")) {
        return void Swal.fire({
            icon: "warning",
            title: "صلاحية مقيدة",
            text: "ليس لديك صلاحية لحذف فواتير البيع من السجل.",
            confirmButtonColor: "#f59e0b",
            confirmButtonText: "حسناً"
        });
    }

    Swal.fire({
        title: "تأكيد حذف الفاتورة",
        text: "هل أنت متأكد من رغبتك في حذف هذه الفاتورة؟ لن تتمكن من استرجاعها.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم، احذف",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#6B7280"
    }).then(async res => {
        if (res.isConfirmed) {
            try {
                await window.electronAPI.deleteSale(id);
                renderSales();
                Swal.fire({
                    icon: "success",
                    title: "تم الحذف",
                    text: "تم حذف الفاتورة بنجاح.",
                    confirmButtonText: "حسناً",
                    confirmButtonColor: "#34D399"
                });
            } catch (err) {
                Swal.fire({
                    title: "تنبيه",
                    text: "تعذر حذف الفاتورة، يرجى المحاولة مرة أخرى.",
                    icon: "error",
                    confirmButtonColor: "#EF4444"
                });
            }
        }
    });
}

export function handleSearch() {
    renderSales(document.getElementById("searchInput").value.trim());
}

export async function exportToExcel() {
    if (typeof window.hasPermission === "function" && !window.hasPermission("canExportSales")) {
        return void Swal.fire({
            icon: "warning",
            title: "صلاحية مقيدة",
            text: "ليس لديك صلاحية لتصدير سجل المبيعات إلى Excel.",
            confirmButtonColor: "#f59e0b",
            confirmButtonText: "حسناً"
        });
    }

    try {
        const sales = await window.electronAPI.getSales();
        if (sales.length === 0) {
            return void Swal.fire({
                icon: "info",
                title: "لا توجد مبيعات",
                text: "لا توجد مبيعات مسجلة لتصديرها إلى ملف Excel.",
                confirmButtonText: "حسناً",
                confirmButtonColor: "#34D399"
            });
        }
        const rows = [["رقم الفاتورة", "التاريخ", "اسم المنتج", "الكمية", "السعر", "الإجمالي", "اسم العميل", "رقم الهاتف"]];
        sales.forEach(s => {
            (s.items || []).forEach(item => {
                rows.push([
                    s.invoiceNumber || "غير محدد",
                    new Date(s.date).toLocaleString("ar-EG"),
                    item.name || "غير معروف",
                    item.quantity || 0,
                    (item.price || 0).toFixed(2),
                    (s.total || 0).toFixed(2),
                    s.customerName || "غير معروف",
                    s.customerPhone || "غير متوفر"
                ]);
            });
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws["!cols"] = [{ wch: 18 }, { wch: 22 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 16 }];
        ws["!freeze"] = { rows: 1 };
        XLSX.utils.book_append_sheet(wb, ws, "المبيعات");
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const bytes = new Uint8Array(out);

        const dateStr = new Date().toISOString().slice(0, 10);
        const fileName = `sales_report_${dateStr}.xlsx`;

        let saveRes = null;
        let tryNative = false;
        if (window.electronAPI && typeof window.electronAPI.saveExcelDialog === "function") {
            try {
                saveRes = await window.electronAPI.saveExcelDialog({
                    defaultFileName: fileName,
                    arrayBuffer: bytes
                });
                tryNative = true;
            } catch (dialogErr) {
                console.warn("saveExcelDialog IPC handler not yet available in running process, falling back to direct download:", dialogErr);
                saveRes = null;
            }
        }

        // If user actively canceled the native dialog
        if (tryNative && saveRes && saveRes.canceled) {
            return;
        }

        // If native save dialog was successful and saved the file
        if (saveRes && saveRes.success && saveRes.filePath) {
            const savedPath = saveRes.filePath;
            Swal.fire({
                icon: "success",
                title: "تم تصدير وحفظ تقرير المبيعات بنجاح",
                html: `
                    <div style="text-align: right; direction: rtl; font-family: 'Tajawal', sans-serif;">
                        <p style="margin-bottom: 8px; font-weight: 700; color: #1e1b4b;">تم حفظ ملف تقرير المبيعات بنجاح في المسار التالي:</p>
                        <div style="background: #f8fafc; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #cbd5e1; direction: ltr; text-align: left; word-break: break-all; font-family: monospace; font-size: 0.85rem; color: #0f172a; margin-bottom: 12px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);">
                            ${savedPath}
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-file-excel"></i> فتح ملف Excel',
                cancelButtonText: '<i class="fas fa-folder-open"></i> فتح المجلد',
                confirmButtonColor: "#10b981",
                cancelButtonColor: "#6366f1",
                showCloseButton: true
            }).then((result) => {
                if (result.isConfirmed) {
                    if (window.electronAPI && window.electronAPI.openPath) {
                        window.electronAPI.openPath(savedPath);
                    } else if (window.electronAPI && window.electronAPI.openFileWithShell) {
                        window.electronAPI.openFileWithShell(savedPath);
                    }
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    if (window.electronAPI && window.electronAPI.showItemInFolder) {
                        window.electronAPI.showItemInFolder(savedPath);
                    }
                }
            });
            return;
        }

        // Resilient Fallback: direct download using XLSX.writeFile or Blob
        if (typeof XLSX !== "undefined" && typeof XLSX.writeFile === "function") {
            XLSX.writeFile(wb, fileName);
        } else {
            const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        Swal.fire({
            icon: "success",
            title: "تم تصدير وحفظ تقرير المبيعات بنجاح",
            html: `
                <div style="text-align: right; direction: rtl; font-family: 'Tajawal', sans-serif;">
                    <p style="margin-bottom: 8px; font-weight: 700; color: #1e1b4b;">تم تنزيل وتصدير ملف تقرير المبيعات بنجاح باسم:</p>
                    <div style="background: #f0fdf4; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #86efac; direction: ltr; text-align: center; word-break: break-all; font-family: monospace; font-size: 0.95rem; font-weight: bold; color: #15803d; margin-bottom: 12px;">
                        ${fileName}
                    </div>
                    <p style="color: #475569; font-size: 0.88rem; margin: 0;">
                        <i class="fas fa-folder-download" style="color: #10b981;"></i> تم حفظ الملف في مجلد <strong>التنزيلات (Downloads)</strong> على جهازك.
                    </p>
                </div>
            `,
            confirmButtonText: "حسناً، فهمت",
            confirmButtonColor: "#10b981"
        });
    } catch (err) {
        console.error("Error exporting sales to excel:", err);
        Swal.fire({
            title: "تنبيه",
            text: "تعذر تصدير تقرير المبيعات إلى Excel، يرجى المحاولة مرة أخرى.",
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
}

export async function printSale(id) {
    try {
        const sales = await window.electronAPI.getSales();
        const sale = (sales || []).find(s => s._id === id);
        if (!sale) {
            return void Swal.fire({
                icon: "error",
                title: "خطأ",
                text: "لم يتم العثور على بيانات الفاتورة.",
                confirmButtonColor: "#ef4444",
                confirmButtonText: "حسناً"
            });
        }

        const settings = (await window.electronAPI.getSettings()) || {};
        const invoiceNumber = sale.invoiceNumber || "غير محدد";
        const customerName = sale.customerName || "عميل نقدي";
        const customerPhone = sale.customerPhone || "غير متوفر";
        const formattedDate = new Date(sale.date).toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const items = Array.isArray(sale.items) ? sale.items : [];
        const subtotal = sale.subtotal !== undefined && sale.subtotal !== null
            ? Number(sale.subtotal)
            : items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
        const discount = Number(sale.discount || 0);
        const tax = Number(sale.tax || 0);
        const total = sale.total !== undefined && sale.total !== null
            ? Number(sale.total)
            : (subtotal - discount + tax);

        const paymentMethodMap = {
            cash: "كاش",
            vodafoneCash: "فودافون كاش",
            visaCard: "كارد فيزا"
        };
        const paymentMethod = paymentMethodMap[sale.paymentMethod] || sale.paymentMethod || "كاش";

        const currSym = sale.currencySymbol || (sale.currency && sale.currency.symbol) || "ج.م";
        let invoiceHtml = `<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:'Tajawal',sans-serif;margin:0 auto;padding:4px;text-align:center;font-size:11px;width:72mm;max-width:72mm;box-sizing:border-box;color:#000;border:1px solid #000;border-radius:5px}.header img{max-width:40px;max-height:40px;margin-bottom:3px;border:1px solid #000;border-radius:50%}.header h1{font-size:12px;margin:3px 0;font-weight:bold}.header p,.customer-info p{margin:1px 0;font-size:9px}.divider{margin:3px 0;font-size:7px;color:#555}.customer-info{margin-bottom:3px}table{width:100%;margin:5px 0;font-size:9px}th,td{border:1px solid #000;padding:3px 2px;text-align:center}th{background-color:#f0f0f0;font-weight:bold}.totals p{margin:2px 0;font-size:9px}.grand-total{font-weight:bold;font-size:11px;border:1px solid #000;border-radius:5px;padding:3px;margin-top:3px;display:flex;justify-content:center;align-items:center}.footer{margin-top:3px;font-size:8px}</style></head><body><div class="header">${
            settings.logo ? `<img src="${settings.logo}" alt="Logo">` : ""
        }<h1>${settings.storeName || "اسم المحل"}</h1><p>${
            settings.storeLocation || "غير متوفر"
        }</p><p>${
            settings.phoneNumbers?.join(" - ") || "غير متوفر"
        }</p><p class="divider">------------------------------------------------------------------------</p><p>فاتورة بيع #${invoiceNumber}</p><p>التاريخ: ${formattedDate}</p></div><p class="divider">-------------------------------------------------------------------------</p><div class="customer-info"><p>العميل: ${customerName} | ${customerPhone}</p></div><table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${items
            .map(
                (item) =>
                    `<tr><td>${item.name || "منتج"}</td><td>${
                        item.quantity || 1
                    }</td><td>${Number(item.price || 0).toFixed(2)} ${currSym}</td><td>${(
                        Number(item.quantity || 1) * Number(item.price || 0)
                    ).toFixed(2)} ${currSym}</td></tr>`
            )
            .join("")}</tbody></table><div class="totals"><p>الإجمالي الفرعي: ${subtotal.toFixed(
            2
        )} ${currSym}</p><p>الخصم: ${discount.toFixed(
            2
        )} ${currSym}</p><p>الضريبة: ${tax.toFixed(
            2
        )} ${currSym}</p><p class="grand-total">الإجمالي النهائي: ${total.toFixed(
            2
        )} ${currSym}</p><p>طريقة الدفع: ${paymentMethod}</p></div><div class="footer"><p class="divider">-----------------------------------------------------------------------------------</p><p>شكرًا لزيارتكم | نتمنى لكم يومًا سعيدًا</p></div></body></html>`;

        invoiceHtml = buildSalesReceipt({
            settings,
            invoiceNumber,
            date: formattedDate,
            paymentMethod,
            customerName,
            customerPhone,
            items: items.map((item) => ({
                name: item.name,
                quantity: Number(item.quantity || 1),
                price: Number(item.price || 0),
                total: Number(item.quantity || 1) * Number(item.price || 0),
                discount: 0
            })),
            subtotal,
            discount,
            tax,
            taxRate: Number(sale.taxRate || 0),
            grandTotal: total,
            paid: Number(sale.paidAmount || 0),
            change: Number(sale.changeAmount || 0),
            currency: currSym
        });

        const r = await window.electronAPI.printInvoiceToPOS(invoiceHtml, invoiceNumber, "mini");
        if (r && r.success) {
            Swal.fire({
                icon: "success",
                title: "تمت الطباعة",
                text: "تم إرسال الفاتورة للطباعة الحرارية بنجاح.",
                confirmButtonColor: "#4f46e5",
                confirmButtonText: "حسناً"
            });
        } else {
            // printInvoiceToPOS already generates and opens a PDF when there is
            // no physical printer. Reuse that result instead of exporting and
            // opening the same invoice a second time.
            const pdfPath = r?.pdf && r?.filePath
                ? r.filePath
                : await window.electronAPI.printInvoiceToPDF(invoiceHtml, invoiceNumber, "mini");
            Swal.fire({
                icon: "info",
                title: "تصدير الفاتورة",
                text: pdfPath ? `تم تصدير الفاتورة بنجاح كملف PDF في:\n${pdfPath}` : "تم تصدير الفاتورة كملف PDF بنجاح.",
                confirmButtonColor: "#4f46e5",
                confirmButtonText: "حسناً"
            });
        }
    } catch (err) {
        console.error("خطأ أثناء طباعة الفاتورة:", err);
        Swal.fire({
            icon: "error",
            title: "عذراً",
            text: "حدث خطأ أثناء طباعة الفاتورة، يرجى المحاولة مرة أخرى.",
            confirmButtonColor: "#ef4444",
            confirmButtonText: "حسناً"
        });
    }
}

window.renderSales = renderSales;
window.handleSearch = handleSearch;
window.exportToExcel = exportToExcel;
window.deleteSale = deleteSale;
window.printSale = printSale;
if ("sales" === document.body.getAttribute("data-page")) {
    renderSales();
}

