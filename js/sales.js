import { paginateArray, renderPagination } from "./pagination.js";

let allSales = [];
let filteredSales = [];
let currentSalesPage = 1;
let salesPageSize = 10;
let currentSearchQuery = "";

export function formatSaleRow(s) {
    const items = Array.isArray(s.items) ? s.items : [];
    const formattedDate = new Date(s.date).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    const itemsHtml = items.map(item => `
        <div class="product-item-chip">
            <span class="prod-name" title="${item.name || 'منتج غير محدد'}">${item.name || "منتج غير محدد"}</span>
            <span class="prod-qty-price">${item.quantity || 0} × ${(item.price || 0).toFixed(2)} ج</span>
        </div>
    `).join("");

    return `
        <tr>
            <td>
                <div style="font-weight: 800; color: var(--primary-color);">
                    #${s.invoiceNumber || "--"}
                    ${s.hasReturn ? '<span class="badge-returned"><i class="fas fa-rotate-left"></i> مرتجع</span>' : ''}
                </div>
            </td>
            <td style="color: #64748b; font-size: 0.85rem;">${formattedDate}</td>
            <td>
                <div class="row-product-list">
                    ${itemsHtml || '<span style="color:#94a3b8; font-size:0.8rem;">لا توجد عناصر</span>'}
                </div>
            </td>
            <td><span class="total-amount-tag">${(Number(s.total) || 0).toFixed(2)} ج.م</span></td>
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

export function updateSalesStats(sales) {
    if (!Array.isArray(sales)) return;
    const totalAmt = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalRet = sales.filter(s => s.hasReturn).length;
    const elAmt = document.getElementById("totalSalesAmount");
    const elCnt = document.getElementById("totalInvoicesCount");
    const elRet = document.getElementById("totalReturnsCount");
    if (elAmt) elAmt.textContent = totalAmt.toFixed(2) + " ج.م";
    if (elCnt) elCnt.textContent = sales.length.toLocaleString("ar-EG");
    if (elRet) elRet.textContent = totalRet.toLocaleString("ar-EG");
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

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filteredSales = sales.filter(s => 
                s.customerName?.toLowerCase().includes(q) || 
                s.invoiceNumber?.toLowerCase().includes(q) || 
                s.items?.some(item => item.name?.toLowerCase().includes(q)) || 
                s.customerPhone?.toLowerCase().includes(q)
            );
        } else {
            filteredSales = sales;
        }

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
        ws["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 15 }];
        ws["!freeze"] = { rows: 1 };
        XLSX.utils.book_append_sheet(wb, ws, "المبيعات");
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const filePath = await window.electronAPI.uploadFile({
            name: `sales_report_${new Date().toISOString().slice(0, 10)}.xlsx`,
            arrayBuffer: out
        }, "Documents");

        if (filePath) {
            Swal.fire({
                icon: "success",
                title: "تم التصدير بنجاح",
                text: `تم حفظ تقرير المبيعات في:\n${filePath}`,
                confirmButtonText: "حسناً",
                confirmButtonColor: "#34D399"
            });
        } else {
            Swal.fire({
                icon: "info",
                title: "تم الإلغاء",
                text: "تم إلغاء عملية التصدير.",
                confirmButtonText: "حسناً",
                confirmButtonColor: "#6B7280"
            });
        }
    } catch (err) {
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

        const invoiceHtml = `<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:'Tajawal',sans-serif;margin:0 auto;padding:4px;text-align:center;font-size:11px;width:72mm;max-width:72mm;box-sizing:border-box;color:#000;border:1px solid #000;border-radius:5px}.header img{max-width:40px;max-height:40px;margin-bottom:3px;border:1px solid #000;border-radius:50%}.header h1{font-size:12px;margin:3px 0;font-weight:bold}.header p,.customer-info p{margin:1px 0;font-size:9px}.divider{margin:3px 0;font-size:7px;color:#555}.customer-info{margin-bottom:3px}table{width:100%;margin:5px 0;font-size:9px}th,td{border:1px solid #000;padding:3px 2px;text-align:center}th{background-color:#f0f0f0;font-weight:bold}.totals p{margin:2px 0;font-size:9px}.grand-total{font-weight:bold;font-size:11px;border:1px solid #000;border-radius:5px;padding:3px;margin-top:3px;display:flex;justify-content:center;align-items:center}.footer{margin-top:3px;font-size:8px}</style></head><body><div class="header">${
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
                    }</td><td>${Number(item.price || 0).toFixed(2)} ج.م</td><td>${(
                        Number(item.quantity || 1) * Number(item.price || 0)
                    ).toFixed(2)} ج.م</td></tr>`
            )
            .join("")}</tbody></table><div class="totals"><p>الإجمالي الفرعي: ${subtotal.toFixed(
            2
        )} ج.م</p><p>الخصم: ${discount.toFixed(
            2
        )} ج.م</p><p>الضريبة: ${tax.toFixed(
            2
        )} ج.م</p><p class="grand-total">الإجمالي النهائي: ${total.toFixed(
            2
        )} ج.م</p><p>طريقة الدفع: ${paymentMethod}</p></div><div class="footer"><p class="divider">-----------------------------------------------------------------------------------</p><p>شكرًا لزيارتكم | نتمنى لكم يومًا سعيدًا</p></div></body></html>`;

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
            const pdfPath = await window.electronAPI.printInvoiceToPDF(invoiceHtml, invoiceNumber, "mini");
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

