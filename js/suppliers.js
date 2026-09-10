let suppliers = [];
let filteredSuppliers = [];
let invoices = [];
let currentSearchTerm = "";

const els = {
    list: document.getElementById("suppliersList"),
    modal: document.getElementById("supplierModal"),
    form: document.getElementById("supplierForm"),
    formTitle: document.getElementById("formTitle"),
    formSubtitle: document.getElementById("formSubtitle"),
    modalIcon: document.getElementById("modalIcon"),
    editingSupplierId: document.getElementById("editingSupplierId"),
    supplierName: document.getElementById("supplierName"),
    supplierPhone: document.getElementById("supplierPhone"),
    supplierAddress: document.getElementById("supplierAddress"),
    paymentMethod: document.getElementById("paymentMethod"),
    dueAmount: document.getElementById("dueAmount"),
    totalSuppliersCount: document.getElementById("totalSuppliersCount"),
    totalDueSum: document.getElementById("totalDueSum"),
    searchSupplierInput: document.getElementById("searchSupplierInput")
};

const paymentLabels = {
    cash: "كاش",
    credit: "آجل",
    installment: "تقسيط"
};

/* ==========================================================================
   Loading Data & Calculation
   ========================================================================== */
export async function loadSuppliers() {
    try {
        showLoading(true);
        suppliers = (await window.electronAPI.getSuppliers()) || [];
        invoices = (await window.electronAPI.getProductsPurchaseInvoices()) || [];

        // Recalculate and sync due amounts
        await Promise.all(
            suppliers.map(async s => {
                const sInvoices = invoices.filter(inv => inv.supplierName === s.name && inv.supplierPhone === s.phone);
                let due = 0;

                if (s.paymentMethod === "cash") {
                    due = 0;
                } else if (s.paymentMethod === "credit") {
                    due = sInvoices
                        .filter(inv => !inv.isPaid)
                        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
                } else if (s.paymentMethod === "installment") {
                    const installments = (await window.electronAPI.getInstallments(s._id)) || [];
                    due = installments
                        .filter(inst => inst.status === "pending")
                        .reduce((sum, inst) => sum + (inst.amount || 0), 0);
                }

                s.dueAmount = due;
                await window.electronAPI.updateSupplier(s._id, { dueAmount: due });
            })
        );

        filteredSuppliers = [...suppliers];
        updateSuppliersStats();
        applyFilterAndRender();
    } catch (err) {
        showError("فشل في تحميل بيانات الموردين", err.message);
    } finally {
        showLoading(false);
    }
}

export async function loadInvoices() {
    try {
        invoices = (await window.electronAPI.getProductsPurchaseInvoices()) || [];
    } catch (err) {
        console.error("فشل في تحميل الفواتير:", err);
    }
}

/* ==========================================================================
   Header Stats
   ========================================================================== */
export function updateSuppliersStats(list = suppliers) {
    const totalCount = list.length;
    const totalDue = list.reduce((sum, s) => sum + (parseFloat(s.dueAmount) || 0), 0);

    if (els.totalSuppliersCount) {
        els.totalSuppliersCount.textContent = `${totalCount} مورد`;
    }

    if (els.totalDueSum) {
        els.totalDueSum.textContent = formatCurrency(totalDue);
    }
}

export function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    const isInteger = num % 1 === 0;
    const formatted = new Intl.NumberFormat("ar-EG", {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: 2
    }).format(num);
    return `${formatted} ج.م`;
}

/* ==========================================================================
   Search & Filter
   ========================================================================== */
export function handleSupplierSearch(searchTerm) {
    currentSearchTerm = (searchTerm || "").trim().toLowerCase();
    applyFilterAndRender();
}

export function applyFilterAndRender() {
    if (!currentSearchTerm) {
        filteredSuppliers = [...suppliers];
    } else {
        filteredSuppliers = suppliers.filter(s => {
            const name = (s.name || "").toLowerCase();
            const phone = (s.phone || "").toLowerCase();
            const address = (s.address || "").toLowerCase();
            const method = (paymentLabels[s.paymentMethod] || s.paymentMethod || "").toLowerCase();

            return (
                name.includes(currentSearchTerm) ||
                phone.includes(currentSearchTerm) ||
                address.includes(currentSearchTerm) ||
                method.includes(currentSearchTerm)
            );
        });
    }

    renderSuppliers(filteredSuppliers);
}

/* ==========================================================================
   Rendering Suppliers Cards
   ========================================================================== */
export function renderSuppliers(suppliersToRender = null) {
    if (!els.list) return;
    const list = suppliersToRender !== null ? suppliersToRender : filteredSuppliers;

    if (!list.length) {
        els.list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon-wrap"><i class="fas fa-truck-moving"></i></div>
                <h3>${currentSearchTerm ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد موردين مسجلين'}</h3>
                <p>${currentSearchTerm ? 'جرب البحث بكلمات أخرى أو تحقق من رقم الهاتف' : 'إبدأ بإضافة مورد جديد لتنظيم عمليات الشراء والمديونيات'}</p>
                <button onclick="openAddSupplierModal()" class="add-first-btn">
                    <i class="fas fa-plus-circle"></i> إضافة مورد جديد
                </button>
            </div>
        `;
        return;
    }

    els.list.innerHTML = list.map(s => {
        const due = parseFloat(s.dueAmount) || 0;
        const hasDue = due > 0;
        const dueBadge = hasDue
            ? `<span class="due-badge has-due"><i class="fas fa-exclamation-circle"></i> ${formatCurrency(due)} مستحق</span>`
            : `<span class="due-badge no-due"><i class="fas fa-check-circle"></i> لا توجد مديونية</span>`;

        return `
            <div class="supplier-card" onclick="openSupplierTransactions('${s._id}')">
                <div class="supplier-card-top">
                    <div class="supplier-avatar">
                        <i class="fas fa-truck"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div class="supplier-name" title="${escapeHTML(s.name)}">${escapeHTML(s.name)}</div>
                        ${dueBadge}
                    </div>
                </div>

                <div class="supplier-details">
                    <div class="detail-row">
                        <i class="fas fa-phone-alt"></i>
                        <span>${escapeHTML(s.phone || 'غير متوفر')}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHTML(s.address || 'العنوان غير محدد')}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-credit-card"></i>
                        <span class="payment-tag">${paymentLabels[s.paymentMethod] || s.paymentMethod}</span>
                    </div>
                </div>

                <div class="supplier-card-actions">
                    <button class="btn-transactions" onclick="event.stopPropagation(); openSupplierTransactions('${s._id}')">
                        <i class="fas fa-exchange-alt"></i> عرض المعاملات
                    </button>
                    <button class="btn-icon btn-edit" onclick="event.stopPropagation(); openEditSupplierModal('${s._id}')" title="تعديل بيانات المورد">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="event.stopPropagation(); confirmDeleteSupplier('${s._id}')" title="حذف المورد">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

/* ==========================================================================
   Modal Operations (Add / Edit / Save / Delete)
   ========================================================================== */
export function openAddSupplierModal() {
    if (els.formTitle) els.formTitle.textContent = "إضافة مورد جديد";
    if (els.formSubtitle) els.formSubtitle.textContent = "أدخل بيانات المورد وطريقة الدفع المعتمدة";
    if (els.modalIcon) els.modalIcon.innerHTML = `<i class="fas fa-user-plus"></i>`;
    if (els.form) els.form.reset();
    if (els.editingSupplierId) els.editingSupplierId.value = "";
    if (els.dueAmount) els.dueAmount.value = "0";

    if (els.modal) {
        els.modal.classList.add("open");
        document.body.classList.add("modal-open-lock");
        setTimeout(() => els.supplierName && els.supplierName.focus(), 150);
    }
}

export function openEditSupplierModal(id) {
    const s = suppliers.find(item => item._id === id);
    if (!s) return;

    if (els.editingSupplierId) els.editingSupplierId.value = id;
    if (els.formTitle) els.formTitle.textContent = `تعديل بيانات المورد: ${s.name}`;
    if (els.formSubtitle) els.formSubtitle.textContent = "تعديل وتحديث بيانات ومعلومات المورد";
    if (els.modalIcon) els.modalIcon.innerHTML = `<i class="fas fa-user-edit"></i>`;

    if (els.supplierName) els.supplierName.value = s.name || "";
    if (els.supplierPhone) els.supplierPhone.value = s.phone || "";
    if (els.supplierAddress) els.supplierAddress.value = s.address || "";
    if (els.paymentMethod) els.paymentMethod.value = s.paymentMethod || "cash";
    if (els.dueAmount) els.dueAmount.value = s.dueAmount || 0;

    if (els.modal) {
        els.modal.classList.add("open");
        document.body.classList.add("modal-open-lock");
        setTimeout(() => els.supplierName && els.supplierName.focus(), 150);
    }
}

export function closeSupplierModal() {
    if (els.modal) els.modal.classList.remove("open");
    document.body.classList.remove("modal-open-lock");
    if (els.form) els.form.reset();
}

export function handleOverlayClick(e) {
    if (e.target === els.modal) {
        closeSupplierModal();
    }
}

export async function saveSupplier() {
    const name = els.supplierName ? els.supplierName.value.trim() : "";
    const phone = els.supplierPhone ? els.supplierPhone.value.trim() : "";
    const address = els.supplierAddress ? els.supplierAddress.value.trim() : "";
    const paymentMethod = els.paymentMethod ? els.paymentMethod.value : "cash";
    const dueAmount = parseFloat(els.dueAmount ? els.dueAmount.value : 0) || 0;

    if (!name) {
        showError("بيانات ناقصة", "يرجى إدخال اسم المورد.");
        if (els.supplierName) els.supplierName.focus();
        return;
    }

    if (!phone) {
        showError("بيانات ناقصة", "يرجى إدخال رقم هاتف المورد.");
        if (els.supplierPhone) els.supplierPhone.focus();
        return;
    }

    const payload = {
        name,
        phone,
        address,
        paymentMethod,
        dueAmount
    };

    try {
        showLoading(true);
        const editingId = els.editingSupplierId ? els.editingSupplierId.value : "";

        if (editingId) {
            await window.electronAPI.updateSupplier(editingId, payload);
            const idx = suppliers.findIndex(s => s._id === editingId);
            if (idx !== -1) suppliers[idx] = { _id: editingId, ...payload };
            showSuccess("تم تحديث بيانات المورد بنجاح");
        } else {
            const created = await window.electronAPI.addSupplier(payload);
            suppliers.unshift(created);
            showSuccess("تمت إضافة المورد الجديد بنجاح");
        }

        closeSupplierModal();
        await loadSuppliers();
    } catch (err) {
        showError("فشل في حفظ بيانات المورد", err.message);
    } finally {
        showLoading(false);
    }
}

export async function confirmDeleteSupplier(id) {
    const s = suppliers.find(item => item._id === id);
    if (!s) return;

    const res = await Swal.fire({
        title: "هل أنت متأكد؟",
        text: `سيتم حذف المورد "${s.name}" وكافة الدفعات المرتبطة به نهائياً!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم، احذفه!",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#64748b",
        reverseButtons: true
    });

    if (res.isConfirmed) {
        try {
            showLoading(true);
            if (s.paymentMethod === "installment") {
                const installments = (await window.electronAPI.getInstallments(id)) || [];
                for (const inst of installments) {
                    await window.electronAPI.deleteInstallment(inst._id);
                }
            }

            await window.electronAPI.deleteSupplier(id);
            suppliers = suppliers.filter(item => item._id !== id);
            showSuccess("تم حذف المورد بنجاح");
            updateSuppliersStats();
            applyFilterAndRender();
        } catch (err) {
            showError("فشل في حذف المورد", err.message);
        } finally {
            showLoading(false);
        }
    }
}

/* ==========================================================================
   Supplier Transactions Window
   ========================================================================== */
export async function openSupplierTransactions(id) {
    const s = suppliers.find(item => item._id === id);
    if (!s) return;

    const sInvoices = invoices.filter(inv => inv && inv._id && inv.supplierName === s.name && inv.supplierPhone === s.phone);
    const installments = (await window.electronAPI.getInstallments(id)) || [];

    const win = window.open("", `supplierTransactions_${id}`, "width=850,height=650");
    if (!win) {
        showError("خطأ", "يرجى السماح بفتح النوافذ المنبثقة لعرض المعاملات.");
        return;
    }

    try {
        win.document.open();
        win.document.write(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>معاملات المورد - ${escapeHTML(s.name)}</title>
                <link href="../styles/output.css" rel="stylesheet">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
                <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
                <style>
                    body {
                        font-family: 'Tajawal', sans-serif;
                        background: #f8fafc;
                        color: #1e1b4b;
                        padding: 24px;
                        margin: 0;
                    }
                    .container {
                        max-width: 900px;
                        margin: 0 auto;
                    }
                    .header {
                        background: linear-gradient(135deg, #6d28d9, #4f46e5);
                        color: white;
                        padding: 20px 24px;
                        border-radius: 18px;
                        box-shadow: 0 8px 24px rgba(109, 40, 217, 0.2);
                        margin-bottom: 20px;
                    }
                    .header h1 {
                        font-size: 1.5rem;
                        font-weight: 800;
                        margin: 0 0 4px;
                    }
                    .header p {
                        font-size: 0.9rem;
                        color: rgba(255, 255, 255, 0.85);
                        margin: 0;
                    }
                    .supplier-info-card {
                        background: white;
                        border-radius: 16px;
                        padding: 18px 20px;
                        margin-bottom: 20px;
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
                        border: 1.5px solid #ede9fe;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 20px;
                        align-items: center;
                        justify-content: space-between;
                    }
                    .info-card {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 0.92rem;
                        font-weight: 700;
                        color: #334155;
                    }
                    .info-card i {
                        font-size: 1.1rem;
                        color: #6d28d9;
                        background: #f5f3ff;
                        width: 38px;
                        height: 38px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .due-pill {
                        background: ${s.dueAmount > 0 ? '#fef2f2' : '#ecfdf5'};
                        color: ${s.dueAmount > 0 ? '#dc2626' : '#059669'};
                        border: 1.5px solid ${s.dueAmount > 0 ? '#fecaca' : '#a7f3d0'};
                        padding: 8px 16px;
                        border-radius: 999px;
                        font-weight: 800;
                        font-size: 0.95rem;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .section-title {
                        font-size: 1.15rem;
                        font-weight: 800;
                        color: #6d28d9;
                        margin: 24px 0 14px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .transaction-card {
                        background: white;
                        padding: 16px 20px;
                        border-radius: 14px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
                        margin-bottom: 12px;
                        border-right: 4px solid #6d28d9;
                        border: 1px solid #ede9fe;
                        border-right-width: 5px;
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                    }
                    .transaction-card h3 {
                        color: #6d28d9;
                        font-weight: 800;
                        font-size: 1.05rem;
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .transaction-card p {
                        margin: 0;
                        font-size: 0.88rem;
                        color: #475569;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .installments-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        background: white;
                        border-radius: 14px;
                        overflow: hidden;
                        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
                        border: 1px solid #ede9fe;
                    }
                    .installments-table th {
                        background: #f5f3ff;
                        color: #6d28d9;
                        padding: 12px;
                        text-align: center;
                        font-weight: 800;
                        font-size: 0.88rem;
                        border-bottom: 1.5px solid #ddd6fe;
                    }
                    .installments-table td {
                        padding: 12px;
                        text-align: center;
                        border-bottom: 1px solid #f1f5f9;
                        font-size: 0.88rem;
                        color: #334155;
                    }
                    .status-badge {
                        padding: 4px 12px;
                        border-radius: 999px;
                        font-size: 0.78rem;
                        font-weight: 800;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .status-pending {
                        background: #fef2f2;
                        color: #dc2626;
                        border: 1px solid #fecaca;
                    }
                    .status-paid {
                        background: #ecfdf5;
                        color: #059669;
                        border: 1px solid #a7f3d0;
                    }
                    .pay-button {
                        background: linear-gradient(135deg, #059669, #10b981);
                        color: white;
                        border: none;
                        padding: 6px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 700;
                        font-size: 0.82rem;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    }
                    .pay-button:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 10px rgba(5, 150, 105, 0.3);
                    }
                    .no-items {
                        text-align: center;
                        padding: 30px;
                        background: white;
                        border-radius: 14px;
                        color: #94a3b8;
                        border: 1.5px dashed #e2e8f0;
                        font-size: 0.95rem;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>معاملات المورد: ${escapeHTML(s.name)}</h1>
                        <p>سجل الفواتير ومواعيد سداد الدفعات والأقساط</p>
                    </div>

                    <div class="supplier-info-card">
                        <div class="info-card">
                            <i class="fas fa-phone"></i>
                            <span>${escapeHTML(s.phone)}</span>
                        </div>
                        <div class="info-card">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${escapeHTML(s.address || 'غير محدد')}</span>
                        </div>
                        <div class="due-pill">
                            <i class="fas fa-hand-holding-usd"></i>
                            <span>المبلغ المستحق: ${formatCurrency(s.dueAmount || 0)}</span>
                        </div>
                    </div>

                    <div class="section-title">
                        <i class="fas fa-file-invoice-dollar"></i> فواتير المشتريات
                    </div>
                    <div id="invoicesContainer">
                        ${sInvoices.length ? sInvoices.map(inv => renderTransactionCard(inv, s)).join("") : '<div class="no-items"><i class="fas fa-receipt text-2xl mb-2 block"></i>لا توجد فواتير مسجلة لهذا المورد</div>'}
                    </div>

                    ${s.paymentMethod === 'installment' ? `
                        <div class="section-title">
                            <i class="fas fa-calendar-check"></i> جدول الدفعات والأقساط
                        </div>
                        ${installments.length ? `
                            <table class="installments-table" id="installmentsTable">
                                <thead>
                                    <tr>
                                        <th>تاريخ الاستحقاق</th>
                                        <th>المبلغ</th>
                                        <th>الحالة</th>
                                        <th>الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${installments.map(inst => renderInstallmentRow(inst, s._id)).join("")}
                                </tbody>
                            </table>
                        ` : '<div class="no-items">لا توجد أقساط مسجلة لهذا المورد</div>'}
                    ` : ''}
                </div>

                <script>
                    function payInstallment(installmentId, amount, supplierId) {
                        if (window.opener && typeof window.opener.markPaymentAsPaid === 'function') {
                            window.opener.markPaymentAsPaid(installmentId, amount, supplierId).then(() => {
                                location.reload();
                            });
                        }
                    }

                    function payInvoice(invoiceId, amount, supplierId) {
                        if (window.opener && typeof window.opener.payInvoiceHandler === 'function') {
                            window.opener.payInvoiceHandler(invoiceId, amount, supplierId).then(() => {
                                location.reload();
                            });
                        }
                    }
                </script>
            </body>
            </html>
        `);
        win.document.close();
    } catch (e) {
        showError("خطأ", "فشل في عرض صفحة المعاملات: " + e.message);
        if (win) win.close();
    }
}

function renderInstallmentRow(inst, supplierId) {
    const isPaid = inst.status === "paid";
    return `
        <tr>
            <td>${inst.dueDate ? formatDate(inst.dueDate) : "غير محدد"}</td>
            <td style="font-weight: 800; color: #6d28d9;">${formatCurrency(inst.amount || 0)}</td>
            <td>
                <span class="status-badge ${isPaid ? 'status-paid' : 'status-pending'}">
                    <i class="fas fa-${isPaid ? 'check-circle' : 'clock'}"></i>
                    ${isPaid ? 'تم السداد' : 'قيد الانتظار'}
                </span>
            </td>
            <td>
                ${!isPaid ? `
                    <button class="pay-button" onclick="payInstallment('${inst._id}', ${inst.amount || 0}, '${supplierId}')">
                        <i class="fas fa-check"></i> سداد
                    </button>
                ` : '<span style="color: #059669; font-weight: 700;">تم الدفع</span>'}
            </td>
        </tr>
    `;
}

function renderTransactionCard(inv, supplier) {
    const isPaid = inv.isPaid || supplier.paymentMethod !== "credit";
    const paymentDateStr = inv.paymentDate ? formatDate(inv.paymentDate) : "غير مدفوع";

    return `
        <div class="transaction-card" id="invoice-${inv._id}">
            <h3><i class="fas fa-file-invoice"></i> فاتورة #${escapeHTML(inv.invoiceNumber || (inv._id ? inv._id.slice(-6) : ""))}</h3>
            <p><i class="far fa-calendar-alt"></i> التاريخ: ${formatDate(inv.date || inv.createdAt)}</p>
            <p><i class="fas fa-boxes"></i> عدد المنتجات: ${inv.items ? inv.items.length : 0}</p>
            <p><i class="fas fa-money-bill-wave"></i> إجمالي الفاتورة: <strong>${formatCurrency(inv.totalAmount || 0)}</strong></p>
            ${inv.notes ? `<p><i class="fas fa-sticky-note"></i> ملاحظات: ${escapeHTML(inv.notes)}</p>` : ""}
            ${isPaid ? `
                <p style="color: #059669; font-weight: 700;"><i class="fas fa-check-circle"></i> حالة الفاتورة: مدفوعة (${paymentDateStr})</p>
            ` : `
                <div style="margin-top: 6px;">
                    <button class="pay-button" onclick="payInvoice('${inv._id}', ${inv.totalAmount || 0}, '${supplier._id}')">
                        <i class="fas fa-hand-holding-usd"></i> سداد الفاتورة الآن
                    </button>
                </div>
            `}
        </div>
    `;
}

export async function payInvoiceHandler(invoiceId, amount, supplierId) {
    try {
        showLoading(true);
        if (!invoiceId || !supplierId) throw new Error("معرف الفاتورة أو المورد غير صحيح");

        const updateData = { isPaid: true, paymentDate: new Date().toISOString() };
        const updated = await window.electronAPI.markInvoiceAsPaid(invoiceId, updateData);
        if (!updated || !updated.isPaid) throw new Error("فشل في تحديث حالة الفاتورة");

        const s = suppliers.find(item => item._id === supplierId);
        if (s) {
            s.dueAmount = Math.max(0, (s.dueAmount || 0) - (amount || 0));
            await window.electronAPI.updateSupplier(supplierId, { dueAmount: s.dueAmount });
            await loadSuppliers();
            await loadInvoices();
        }
        return Promise.resolve();
    } catch (err) {
        showError("فشل في تسجيل سداد الفاتورة", err.message);
        throw err;
    } finally {
        showLoading(false);
    }
}

export async function markPaymentAsPaid(installmentId, amount, supplierId) {
    try {
        showLoading(true);
        if (!installmentId || !supplierId) throw new Error("معرف الدفعة أو المورد غير صحيح");

        const updated = await window.electronAPI.markInstallmentAsPaid(installmentId);
        if (!updated || updated.status !== "paid") throw new Error("فشل في تحديث حالة الدفعة");

        const s = suppliers.find(item => item._id === supplierId);
        if (s) {
            s.dueAmount = Math.max(0, (s.dueAmount || 0) - (amount || 0));
            await window.electronAPI.updateSupplier(supplierId, { dueAmount: s.dueAmount });
            await loadSuppliers();
        }
        return Promise.resolve();
    } catch (err) {
        showError("فشل في تسجيل سداد الدفعة", err.message);
        throw err;
    } finally {
        showLoading(false);
    }
}

/* ==========================================================================
   Helpers
   ========================================================================== */
function formatDate(date) {
    if (!date) return "غير محدد";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "غير محدد";
    return d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function showLoading(show) {
    if (show) {
        Swal.fire({
            title: "جاري المعالجة...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
    } else {
        Swal.close();
    }
}

function showSuccess(msg) {
    Swal.fire({
        title: "تم بنجاح!",
        text: msg,
        icon: "success",
        confirmButtonColor: "#6d28d9"
    });
}

function showError(title, msg) {
    let friendlyText = msg;
    if (typeof msg === "string") {
        friendlyText = msg.replace(/^Error:\s*/i, "").replace(/^TypeError:\s*/i, "");
    }
    Swal.fire({
        title: title || "تنبيه",
        text: friendlyText || "حدث خطأ أثناء العملية، يرجى المحاولة مرة أخرى.",
        icon: "error",
        confirmButtonColor: "#EF4444"
    });
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

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && els.modal && els.modal.classList.contains("open")) {
            closeSupplierModal();
        }
    });

    await Promise.all([loadSuppliers(), loadInvoices()]);
});

// Window globals for inline HTML event handlers
window.openAddSupplierModal = openAddSupplierModal;
window.openEditSupplierModal = openEditSupplierModal;
window.closeSupplierModal = closeSupplierModal;
window.handleOverlayClick = handleOverlayClick;
window.saveSupplier = saveSupplier;
window.confirmDeleteSupplier = confirmDeleteSupplier;
window.openSupplierTransactions = openSupplierTransactions;
window.handleSupplierSearch = handleSupplierSearch;
window.markPaymentAsPaid = markPaymentAsPaid;
window.payInvoiceHandler = payInvoiceHandler;