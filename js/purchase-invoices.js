import { paginateArray, renderPagination } from "./pagination.js";

let productsList = [];
let purchaseInvoices = [];
let filteredInvoices = [];
let currentPurchasePage = 1;
let purchasePageSize = 10;
let currentSearchQuery = "";

const els = {
    modal: document.getElementById("purchaseInvoiceModal"),
    form: document.getElementById("invoiceForm"),
    totalInvoicesCount: document.getElementById("totalInvoicesCount"),
    totalPurchasesSum: document.getElementById("totalPurchasesSum"),
    searchInput: document.getElementById("search-invoice"),
    tableBody: document.getElementById("invoices-table-body"),
    tableWrapper: document.getElementById("invoices-table-wrapper"),
    emptyState: document.getElementById("invoices-empty-state"),
    pagination: document.getElementById("purchaseInvoicesPagination"),
    supplierName: document.getElementById("supplier-name"),
    supplierId: document.getElementById("supplier-id"),
    creatorName: document.getElementById("creator-name"),
    creatorId: document.getElementById("creator-id"),
    invoiceDate: document.getElementById("invoice-date"),
    productName: document.getElementById("product-name-input"),
    productQuantity: document.getElementById("product-quantity-input"),
    productPrice: document.getElementById("product-price-input"),
    addProductBtn: document.getElementById("add-product-btn"),
    addedProductsTable: document.getElementById("added-products-table"),
    totalAmount: document.getElementById("total-amount"),
    paidAmount: document.getElementById("paid-amount"),
    remainingAmount: document.getElementById("remaining-amount"),
    notes: document.getElementById("notes"),
    saveBtn: document.getElementById("saveInvoiceBtn"),
};

document.addEventListener("DOMContentLoaded", () => {
    loadPurchaseInvoices();
    setupEventListeners();
});

function setupEventListeners() {
    if (els.productQuantity) {
        els.productQuantity.addEventListener("input", updateProductRowCalculation);
    }
    if (els.productPrice) {
        els.productPrice.addEventListener("input", updateProductRowCalculation);
    }
    if (els.addProductBtn) {
        els.addProductBtn.addEventListener("click", addProductToTable);
    }
    if (els.paidAmount) {
        els.paidAmount.addEventListener("input", updateRemainingAmount);
    }
    if (els.searchInput) {
        els.searchInput.addEventListener("input", (e) => {
            currentSearchQuery = e.target.value.trim().toLowerCase();
            searchInvoices();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && els.modal && els.modal.classList.contains("open")) {
            closeInvoiceModal();
        }
    });
}

function updateProductRowCalculation() {
    // Helper if needed for live preview
}

/* ==========================================================================
   Data Loading & Calculations
   ========================================================================== */
async function loadPurchaseInvoices() {
    try {
        purchaseInvoices = await window.electronAPI.getPurchaseInvoices();
        if (!Array.isArray(purchaseInvoices)) purchaseInvoices = [];
        updateHeaderStats();
        applyFilterAndRender();
    } catch (e) {
        console.error("Error loading purchase invoices:", e);
        if (els.tableBody) {
            els.tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-red-500 py-4 font-bold">خطأ أثناء تحميل الفواتير</td></tr>`;
        }
    }
}

function updateHeaderStats() {
    const totalCount = purchaseInvoices.length;
    const totalSum = purchaseInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);

    if (els.totalInvoicesCount) {
        els.totalInvoicesCount.textContent = `${totalCount.toLocaleString('ar-EG')} فاتورة`;
        els.totalInvoicesCount.title = `إجمالي عدد الفواتير: ${totalCount} فاتورة`;
    }
    if (els.totalPurchasesSum) {
        const formatted = formatCurrency(totalSum);
        els.totalPurchasesSum.textContent = formatted;
        els.totalPurchasesSum.title = `إجمالي المشتريات: ${totalSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه مصري`;
    }
}

function formatCurrency(amount) {
    const val = parseFloat(amount) || 0;
    const isInteger = val % 1 === 0;
    const formattedNum = new Intl.NumberFormat("ar-EG", {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: 2
    }).format(val);
    return `${formattedNum} ج.م`;
}

function formatDate(dateStr) {
    if (!dateStr) return "غير محدد";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    } catch {
        return dateStr;
    }
}

/* ==========================================================================
   Search & Filtering
   ========================================================================== */
function searchInvoices() {
    if (!currentSearchQuery) {
        filteredInvoices = [...purchaseInvoices];
    } else {
        filteredInvoices = purchaseInvoices.filter(inv => {
            const num = (inv.invoiceNumber || "").toString().toLowerCase();
            const sName = (inv.supplierName || "").toLowerCase();
            const sId = (inv.supplierId || "").toLowerCase();
            const cName = (inv.creatorName || "").toLowerCase();
            const cId = (inv.creatorId || "").toLowerCase();
            const date = (inv.invoiceDate || "").toLowerCase();
            const amount = (inv.totalAmount || "").toString();

            return num.includes(currentSearchQuery) ||
                   sName.includes(currentSearchQuery) ||
                   sId.includes(currentSearchQuery) ||
                   cName.includes(currentSearchQuery) ||
                   cId.includes(currentSearchQuery) ||
                   date.includes(currentSearchQuery) ||
                   amount.includes(currentSearchQuery);
        });
    }
    currentPurchasePage = 1;
    renderPurchaseInvoices();
}

function applyFilterAndRender() {
    searchInvoices();
}

/* ==========================================================================
   Rendering Invoices Table & Pagination
   ========================================================================== */
function renderPurchaseInvoices() {
    if (!els.tableBody || !els.emptyState || !els.tableWrapper) return;

    if (!filteredInvoices || filteredInvoices.length === 0) {
        if (els.pagination) els.pagination.innerHTML = "";
        els.emptyState.classList.remove("hidden");
        els.tableWrapper.classList.add("hidden");
        els.tableBody.innerHTML = "";
        return;
    }

    els.emptyState.classList.add("hidden");
    els.tableWrapper.classList.remove("hidden");

    const { pageItems, totalItems, currentPage } = paginateArray(filteredInvoices, currentPurchasePage, purchasePageSize);
    currentPurchasePage = currentPage;

    els.tableBody.innerHTML = pageItems.map(inv => `
        <tr>
            <td>
                <span class="invoice-badge-num">#${escapeHTML(inv.invoiceNumber)}</span>
            </td>
            <td style="font-weight: 700; color: #1e1b4b;">
                <i class="fas fa-user-tie text-primary" style="margin-left: 6px;"></i>
                ${escapeHTML(inv.supplierName || 'غير محدد')}
            </td>
            <td>${escapeHTML(inv.supplierId || '-')}</td>
            <td>${escapeHTML(inv.creatorName || '-')}</td>
            <td>${formatDate(inv.invoiceDate)}</td>
            <td><span class="amount-total-badge">${formatCurrency(inv.totalAmount)}</span></td>
            <td><span class="amount-paid-badge">${formatCurrency(inv.paidAmount)}</span></td>
            <td><span class="amount-remaining-badge">${formatCurrency(inv.remainingAmount)}</span></td>
            <td class="action-cell">
                <div class="table-actions-group">
                    <button type="button" onclick="viewInvoiceDetails('${inv.invoiceNumber}')" class="btn-action-view" title="عرض تفاصيل الفاتورة">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" onclick="printInvoice('${inv.invoiceNumber}')" class="btn-action-print" title="طباعة الفاتورة">
                        <i class="fas fa-print"></i>
                    </button>
                    <button type="button" onclick="deleteInvoice('${inv._id}')" class="btn-action-delete" title="حذف الفاتورة">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    renderPagination({
        container: "purchaseInvoicesPagination",
        totalItems,
        currentPage: currentPurchasePage,
        pageSize: purchasePageSize,
        pageSizeOptions: [10, 25, 50, 100],
        onPageChange: (newPage, newSize) => {
            currentPurchasePage = newPage;
            purchasePageSize = newSize;
            renderPurchaseInvoices();
        }
    });
}

/* ==========================================================================
   Modal Operations (Add Invoice)
   ========================================================================== */
function openAddInvoiceModal() {
    resetForm();

    // Default today's date
    if (els.invoiceDate && !els.invoiceDate.value) {
        els.invoiceDate.value = new Date().toISOString().split("T")[0];
    }

    if (els.modal) {
        els.modal.classList.add("open");
        document.body.classList.add("modal-open-lock");
        setTimeout(() => els.supplierName && els.supplierName.focus(), 200);
    }
}

function closeInvoiceModal() {
    if (els.modal) {
        els.modal.classList.remove("open");
        document.body.classList.remove("modal-open-lock");
    }
    resetForm();
}

function handleModalOverlayClick(e) {
    if (e.target === els.modal) {
        closeInvoiceModal();
    }
}

/* ==========================================================================
   Product Adding inside Modal
   ========================================================================== */
function addProductToTable() {
    const name = (els.productName ? els.productName.value : "").trim();
    const qty = parseInt(els.productQuantity ? els.productQuantity.value : 0) || 0;
    const price = parseFloat(els.productPrice ? els.productPrice.value : 0) || 0;
    const total = qty * price;

    if (!name) {
        return void Swal.fire({ title: "بيانات ناقصة", text: "يرجى إدخال اسم المنتج.", icon: "error", confirmButtonColor: "#EF4444" });
    }
    if (qty <= 0) {
        return void Swal.fire({ title: "بيانات ناقصة", text: "يرجى إدخال كمية صحيحة أكبر من صفر.", icon: "error", confirmButtonColor: "#EF4444" });
    }
    if (price <= 0) {
        return void Swal.fire({ title: "بيانات ناقصة", text: "يرجى إدخال سعر شراء صحيح أكبر من صفر.", icon: "error", confirmButtonColor: "#EF4444" });
    }

    productsList.push({ id: Date.now(), name, quantity: qty, price, total });
    renderAddedProducts();
    updateInvoiceTotal();

    // Reset row inputs
    if (els.productName) els.productName.value = "";
    if (els.productQuantity) els.productQuantity.value = "1";
    if (els.productPrice) els.productPrice.value = "0";
    if (els.productName) els.productName.focus();
}

function renderAddedProducts() {
    if (!els.addedProductsTable) return;
    if (productsList.length === 0) {
        els.addedProductsTable.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">
                    <i class="fas fa-cart-arrow-down" style="margin-left: 6px;"></i>
                    لم يتم إضافة أي منتجات للفاتورة بعد
                </td>
            </tr>
        `;
        return;
    }

    els.addedProductsTable.innerHTML = productsList.map(p => `
        <tr>
            <td style="font-weight: 700; color: #1e1b4b;">${escapeHTML(p.name)}</td>
            <td style="font-weight: 700;">${p.quantity}</td>
            <td>${formatCurrency(p.price)}</td>
            <td style="font-weight: 800; color: #6d28d9;">${formatCurrency(p.total)}</td>
            <td style="text-align: center;">
                <button type="button" onclick="removeProductFromTable(${p.id})" class="btn-remove-item" title="حذف المنتج">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

function removeProductFromTable(id) {
    productsList = productsList.filter(p => p.id !== id);
    renderAddedProducts();
    updateInvoiceTotal();
}

function updateInvoiceTotal() {
    const total = productsList.reduce((s, p) => s + p.total, 0);
    if (els.totalAmount) {
        els.totalAmount.value = `${total.toFixed(2)} ج.م`;
    }
    updateRemainingAmount();
}

function updateRemainingAmount() {
    const total = productsList.reduce((s, p) => s + p.total, 0);
    const paid = parseFloat(els.paidAmount ? els.paidAmount.value : 0) || 0;
    const remaining = Math.max(0, total - paid);
    if (els.remainingAmount) {
        els.remainingAmount.value = `${remaining.toFixed(2)} ج.م`;
    }
}

function resetForm() {
    if (els.supplierName) els.supplierName.value = "";
    if (els.supplierId) els.supplierId.value = "";
    if (els.creatorName) els.creatorName.value = "";
    if (els.creatorId) els.creatorId.value = "";
    if (els.invoiceDate) els.invoiceDate.value = new Date().toISOString().split("T")[0];
    if (els.productName) els.productName.value = "";
    if (els.productQuantity) els.productQuantity.value = "1";
    if (els.productPrice) els.productPrice.value = "0";
    if (els.totalAmount) els.totalAmount.value = "0 ج.م";
    if (els.paidAmount) els.paidAmount.value = "0";
    if (els.remainingAmount) els.remainingAmount.value = "0 ج.م";
    if (els.notes) els.notes.value = "";
    productsList = [];
    renderAddedProducts();
}

/* ==========================================================================
   Save & Delete Purchase Invoice
   ========================================================================== */
async function savePurchaseInvoice() {
    try {
        const supplierName = (els.supplierName ? els.supplierName.value : "").trim();
        const supplierId = (els.supplierId ? els.supplierId.value : "").trim();
        const creatorName = (els.creatorName ? els.creatorName.value : "").trim();
        const creatorId = (els.creatorId ? els.creatorId.value : "").trim();
        const invoiceDate = els.invoiceDate ? els.invoiceDate.value : "";
        const notes = (els.notes ? els.notes.value : "").trim();
        const totalAmount = productsList.reduce((s, p) => s + p.total, 0);
        const paidAmount = parseFloat(els.paidAmount ? els.paidAmount.value : 0) || 0;
        const remainingAmount = Math.max(0, totalAmount - paidAmount);

        if (!supplierName) {
            return void Swal.fire({ title: "بيانات ناقصة", text: "يرجى إدخال اسم المورد.", icon: "error", confirmButtonColor: "#EF4444" });
        }
        if (!supplierId) {
            return void Swal.fire({ title: "بيانات ناقصة", text: "يرجى إدخال رقم هاتف أو كود المورد.", icon: "error", confirmButtonColor: "#EF4444" });
        }
        if (!creatorName) {
            return void Swal.fire({ title: "بيانات ناقصة", text: "يرجى إدخال اسم منشئ الفاتورة.", icon: "error", confirmButtonColor: "#EF4444" });
        }
        if (!creatorId) {
            return void Swal.fire({ title: "بيانات ناقصة", text: "يرجى إدخال رقم هاتف منشئ الفاتورة.", icon: "error", confirmButtonColor: "#EF4444" });
        }
        if (!invoiceDate) {
            return void Swal.fire({ title: "بيانات ناقصة", text: "يرجى تحديد تاريخ الفاتورة.", icon: "error", confirmButtonColor: "#EF4444" });
        }
        if (productsList.length === 0) {
            return void Swal.fire({ title: "بيانات ناقصة", text: "يرجى إضافة منتج واحد على الأقل للفاتورة.", icon: "error", confirmButtonColor: "#EF4444" });
        }

        if (els.saveBtn) els.saveBtn.disabled = true;

        const nextNum = await window.electronAPI.getNextPurchaseInvoiceNumber();
        const invoice = {
            invoiceNumber: (nextNum || Date.now()).toString(),
            supplierName,
            supplierId,
            creatorName,
            creatorId,
            invoiceDate,
            products: productsList,
            totalAmount,
            paidAmount,
            remainingAmount,
            notes,
            createdAt: new Date().toISOString()
        };

        await window.electronAPI.addPurchaseInvoice(invoice);

        // Record treasury transaction if cash paid
        if (paidAmount > 0) {
            const user = (await window.electronAPI.getSettings())?.currentUser || "غير معروف";
            const desc = `مصروفات - فاتورة شراء رقم ${invoice.invoiceNumber} (cash)`;
            const existing = (await window.electronAPI.getTreasuryTransactions()) || [];
            if (!existing.some(t => t.description === desc && t.user === user)) {
                await window.electronAPI.addTreasuryTransaction({
                    date: new Date().toISOString(),
                    type: "expense",
                    amount: paidAmount,
                    description: desc,
                    user
                });
            }
        }

        Swal.fire({
            title: "تم بنجاح!",
            text: `تم حفظ فاتورة الشراء رقم #${invoice.invoiceNumber} بنجاح.`,
            icon: "success",
            confirmButtonColor: "#6d28d9"
        });

        closeInvoiceModal();
        await loadPurchaseInvoices();

    } catch (e) {
        Swal.fire({
            title: "خطأ!",
            text: "حدث خطأ أثناء حفظ الفاتورة: " + (e.message || ""),
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    } finally {
        if (els.saveBtn) els.saveBtn.disabled = false;
    }
}

async function deleteInvoice(id) {
    const result = await Swal.fire({
        title: "هل أنت متأكد؟",
        text: "لن يمكنك التراجع عن حذف فاتورة الشراء هذه!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "نعم، احذفها!",
        cancelButtonText: "إلغاء",
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
        await window.electronAPI.deletePurchaseInvoice(id);
        Swal.fire({
            title: "تم الحذف!",
            text: "تم حذف الفاتورة بنجاح.",
            icon: "success",
            confirmButtonColor: "#6d28d9"
        });
        await loadPurchaseInvoices();
    } catch (e) {
        Swal.fire({
            title: "خطأ!",
            text: "فشل في حذف الفاتورة: " + (e.message || ""),
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
}

/* ==========================================================================
   View Invoice Details & Print
   ========================================================================== */
function viewInvoiceDetails(invoiceNumber) {
    const inv = purchaseInvoices.find(i => i.invoiceNumber === invoiceNumber);
    if (!inv) return;

    const rows = (inv.products || []).map(p => `
        <tr style="border-bottom:1px solid #f3f0ff;">
            <td style="padding:10px 14px;text-align:right;color:#1e1b4b;font-weight:700;font-size:0.9rem;">${escapeHTML(p.name)}</td>
            <td style="padding:10px 14px;text-align:center;color:#374151;font-weight:700;">${p.quantity}</td>
            <td style="padding:10px 14px;text-align:center;color:#6d28d9;font-weight:700;">${formatCurrency(p.price)}</td>
            <td style="padding:10px 14px;text-align:center;color:#1e1b4b;font-weight:800;">${formatCurrency(p.total || (p.quantity * p.price))}</td>
        </tr>
    `).join("");

    Swal.fire({
        title: "",
        html: `
            <div style="font-family:'Tajawal',sans-serif;direction:rtl;text-align:right;color:#1e1b4b;padding:4px 0;">
                <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:2px solid #ede9fe;margin-bottom:20px;">
                    <div>
                        <h2 style="font-size:1.4rem;font-weight:800;color:#6d28d9;margin:0;">تفاصيل فاتورة الشراء</h2>
                        <p style="font-size:1rem;color:#94a3b8;margin:4px 0 0;font-weight:700;">رقم #${escapeHTML(inv.invoiceNumber)}</p>
                    </div>
                    <div style="background:linear-gradient(135deg,#6d28d9,#4f46e5);color:white;padding:6px 18px;border-radius:999px;font-size:0.85rem;font-weight:700;">
                        فاتورة شراء
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
                    <div style="background:#faf7ff;border:1.5px solid #ede9fe;border-radius:14px;padding:14px;">
                        <p style="font-size:0.82rem;font-weight:800;color:#7c3aed;margin:0 0 10px;">معلومات المورد</p>
                        <div style="display:flex;justify-content:space-between;font-size:0.88rem;margin-bottom:6px;"><span style="color:#64748b;">اسم المورد:</span><span style="color:#1e1b4b;font-weight:700;">${escapeHTML(inv.supplierName)}</span></div>
                        <div style="display:flex;justify-content:space-between;font-size:0.88rem;"><span style="color:#64748b;">رقم الهاتف / الكود:</span><span style="color:#1e1b4b;font-weight:700;">${escapeHTML(inv.supplierId)}</span></div>
                    </div>
                    <div style="background:#faf7ff;border:1.5px solid #ede9fe;border-radius:14px;padding:14px;">
                        <p style="font-size:0.82rem;font-weight:800;color:#7c3aed;margin:0 0 10px;">معلومات الفاتورة</p>
                        <div style="display:flex;justify-content:space-between;font-size:0.88rem;margin-bottom:6px;"><span style="color:#64748b;">منشئ الفاتورة:</span><span style="color:#1e1b4b;font-weight:700;">${escapeHTML(inv.creatorName)}</span></div>
                        <div style="display:flex;justify-content:space-between;font-size:0.88rem;margin-bottom:6px;"><span style="color:#64748b;">رقم هاتف المنشئ:</span><span style="color:#1e1b4b;font-weight:700;">${escapeHTML(inv.creatorId)}</span></div>
                        <div style="display:flex;justify-content:space-between;font-size:0.88rem;"><span style="color:#64748b;">التاريخ:</span><span style="color:#1e1b4b;font-weight:700;">${formatDate(inv.invoiceDate)}</span></div>
                    </div>
                </div>

                <div style="margin-bottom:20px;">
                    <p style="font-size:0.88rem;font-weight:800;color:#7c3aed;margin:0 0 10px;">المنتجات المشتراة</p>
                    <div style="border-radius:12px;overflow:hidden;border:1.5px solid #ede9fe;">
                        <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
                            <thead>
                                <tr style="background:linear-gradient(135deg,#6d28d9,#4f46e5);color:white;">
                                    <th style="padding:10px 14px;text-align:right;font-weight:700;">المنتج</th>
                                    <th style="padding:10px 14px;text-align:center;font-weight:700;">الكمية</th>
                                    <th style="padding:10px 14px;text-align:center;font-weight:700;">سعر الوحدة</th>
                                    <th style="padding:10px 14px;text-align:center;font-weight:700;">المجموع</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:${inv.notes ? '16px' : '4px'};">
                    <div style="background:#f5f3ff;border:1.5px solid #ddd6fe;border-radius:14px;padding:14px;text-align:center;">
                        <p style="font-size:0.78rem;color:#7c3aed;font-weight:700;margin:0 0 4px;">الإجمالي</p>
                        <p style="font-size:1.15rem;font-weight:800;color:#6d28d9;margin:0;">${formatCurrency(inv.totalAmount)}</p>
                    </div>
                    <div style="background:#ecfdf5;border:1.5px solid #a7f3d0;border-radius:14px;padding:14px;text-align:center;">
                        <p style="font-size:0.78rem;color:#059669;font-weight:700;margin:0 0 4px;">المدفوع</p>
                        <p style="font-size:1.15rem;font-weight:800;color:#059669;margin:0;">${formatCurrency(inv.paidAmount)}</p>
                    </div>
                    <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:14px;padding:14px;text-align:center;">
                        <p style="font-size:0.78rem;color:#dc2626;font-weight:700;margin:0 0 4px;">المتبقي</p>
                        <p style="font-size:1.15rem;font-weight:800;color:#dc2626;margin:0;">${formatCurrency(inv.remainingAmount)}</p>
                    </div>
                </div>

                ${inv.notes ? `
                    <div style="background:#faf7ff;border:1.5px solid #ede9fe;border-radius:12px;padding:12px;margin-top:12px;">
                        <p style="font-size:0.82rem;font-weight:800;color:#7c3aed;margin:0 0 6px;">ملاحظات:</p>
                        <p style="font-size:0.88rem;color:#475569;margin:0;">${escapeHTML(inv.notes)}</p>
                    </div>
                ` : ""}
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: "إغلاق",
        cancelButtonText: "طباعة الفاتورة",
        confirmButtonColor: "#6d28d9",
        cancelButtonColor: "#059669",
        customClass: { popup: "swal-inv-wide" },
        didOpen: () => {
            if (!document.getElementById("swal-inv-style")) {
                const s = document.createElement("style");
                s.id = "swal-inv-style";
                s.textContent = ".swal-inv-wide{max-width:860px!important;width:90vw!important;padding:28px!important;border-radius:24px!important;} .swal-inv-wide .swal2-html-container{overflow:visible!important;max-height:none!important;padding:0!important;}";
                document.head.appendChild(s);
            }
        }
    }).then(result => {
        if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
            printInvoice(invoiceNumber);
        }
    });
}

async function printInvoice(invoiceNumber) {
    try {
        const inv = purchaseInvoices.find(i => i.invoiceNumber === invoiceNumber);
        if (!inv || !inv.products) {
            return void Swal.fire({ title: "خطأ!", text: "الفاتورة غير موجودة.", icon: "error", confirmButtonColor: "#EF4444" });
        }

        const settings = (await window.electronAPI.getSettings()) || {};
        const storeName = settings.storeName || "اسم المحل";
        const storeLocation = settings.storeLocation || "";
        const storePhones = settings.phoneNumbers?.join(" - ") || "";
        const logo = settings.logo && settings.logo.startsWith("data:image") ? settings.logo : "";

        const formattedDate = new Date(inv.invoiceDate || inv.createdAt || Date.now()).toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const rows = inv.products.map(p => `
            <tr>
                <td style="text-align:right;">${escapeHTML(p.name)}</td>
                <td>${p.quantity}</td>
                <td>${Number(p.price || 0).toFixed(2)}</td>
                <td style="font-weight:bold;">${((p.quantity || 1) * (p.price || 0)).toFixed(2)}</td>
            </tr>
        `).join("");

        const html = `<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>فاتورة #${inv.invoiceNumber}</title><style>@page{margin:0;size:auto;}body{font-family:'Tajawal',sans-serif;margin:0 auto;padding:4px;text-align:center;font-size:11px;width:72mm;max-width:72mm;box-sizing:border-box;color:#000;border:1px solid #000;border-radius:5px;background:#fff;direction:rtl;}.header img{max-width:40px;max-height:40px;margin:0 auto 3px;border:1px solid #000;border-radius:50%;object-fit:cover;display:block;}.header h1{font-size:12px;margin:3px 0;font-weight:bold;}.header p,.info-section p{margin:1px 0;font-size:9px;}.divider{margin:3px 0;font-size:7px;color:#555;letter-spacing:-1px;overflow:hidden;white-space:nowrap;}.info-section{margin-bottom:3px;text-align:right;font-size:9px;}.info-row{display:flex;justify-content:space-between;margin:1px 0;font-size:9px;}table{width:100%;margin:5px 0;font-size:9px;border-collapse:collapse;}th,td{border:1px solid #000;padding:3px 2px;text-align:center;}th{background-color:#f0f0f0;font-weight:bold;}.totals{margin-top:2px;font-size:9px;text-align:right;}.totals p{margin:2px 0;}.grand-total{font-weight:bold;font-size:11px;border:1px solid #000;border-radius:5px;padding:3px;margin-top:3px;display:flex;justify-content:center;align-items:center;background:#f9f9f9;}.footer{margin-top:3px;font-size:8px;}</style></head><body><div class="header">${logo ? `<img src="${logo}" alt="Logo">` : ""}<h1>${escapeHTML(storeName)}</h1>${storeLocation ? `<p>${escapeHTML(storeLocation)}</p>` : ""}${storePhones ? `<p>${escapeHTML(storePhones)}</p>` : ""}<p class="divider">------------------------------------------------------------------------</p><p>فاتورة شراء #${inv.invoiceNumber}</p><p>التاريخ: ${formattedDate}</p></div><p class="divider">-------------------------------------------------------------------------</p><div class="info-section"><div class="info-row"><span><strong>المورد:</strong> ${escapeHTML(inv.supplierName)}</span><span><strong>الكود/الهاتف:</strong> ${escapeHTML(inv.supplierId)}</span></div><div class="info-row"><span><strong>المنشئ:</strong> ${escapeHTML(inv.creatorName)}</span><span><strong>التاريخ:</strong> ${formatDate(inv.invoiceDate)}</span></div></div><table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><p class="grand-total">الإجمالي النهائي: ${Number(inv.totalAmount || 0).toFixed(2)} ج.م</p>${inv.paidAmount !== undefined ? `<p>المدفوع: ${Number(inv.paidAmount).toFixed(2)} ج.م | المتبقي: ${Number(inv.remainingAmount || 0).toFixed(2)} ج.م</p>` : ""}${inv.notes ? `<p><strong>ملاحظات:</strong> ${escapeHTML(inv.notes)}</p>` : ""}</div><div class="footer"><p class="divider">-----------------------------------------------------------------------------------</p><p>نظام Managely لإدارة فواتير الشراء</p></div></body></html>`;

        const printResult = await window.electronAPI.printInvoiceToPOS(html, inv.invoiceNumber, "mini");
        if (printResult && printResult.success) {
            Swal.fire({ title: "تمت الطباعة!", text: "تم إرسال الفاتورة للطباعة الحرارية بنجاح.", icon: "success", confirmButtonColor: "#059669", timer: 1500 });
        } else {
            const pdfPath = await window.electronAPI.printInvoiceToPDF(html, inv.invoiceNumber, "mini");
            Swal.fire({ title: "تصدير الفاتورة", text: pdfPath ? `تم حفظ الفاتورة بنجاح كملف PDF في:\n${pdfPath}` : "تم تصدير الفاتورة بنجاح.", icon: "info", confirmButtonColor: "#6d28d9" });
        }
    } catch (e) {
        Swal.fire({ title: "خطأ في الطباعة", text: e.message || "حدث خطأ أثناء الطباعة", icon: "error", confirmButtonColor: "#dc2626" });
    }
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Window exports
window.openAddInvoiceModal = openAddInvoiceModal;
window.closeInvoiceModal = closeInvoiceModal;
window.handleModalOverlayClick = handleModalOverlayClick;
window.addProductToTable = addProductToTable;
window.removeProductFromTable = removeProductFromTable;
window.savePurchaseInvoice = savePurchaseInvoice;
window.deleteInvoice = deleteInvoice;
window.viewInvoiceDetails = viewInvoiceDetails;
window.printInvoice = printInvoice;
window.searchInvoices = searchInvoices;
window.resetForm = resetForm;
