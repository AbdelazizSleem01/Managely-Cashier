let customers = [];
let sales = [];
let currentSearch = "";
let editingCustomerId = null;

const els = {
    list: document.getElementById("customersList"),
    modal: document.getElementById("customerModal"),
    form: document.getElementById("customerForm"),
    formTitle: document.getElementById("formTitle"),
    modalIcon: document.getElementById("modalIcon"),
    editingCustomerId: document.getElementById("editingCustomerId"),
    customerName: document.getElementById("customerName"),
    customerPhone: document.getElementById("customerPhone"),
    customerAddress: document.getElementById("customerAddress"),
    customerNotes: document.getElementById("customerNotes"),
    saveCustomerBtn: document.getElementById("saveCustomerBtn"),
    searchCustomerInput: document.getElementById("searchCustomerInput"),
    totalCustomersCount: document.getElementById("totalCustomersCount"),
    totalPurchasesSum: document.getElementById("totalPurchasesSum"),
    transactionsModal: document.getElementById("customerTransactionsModal"),
    transactionsContent: document.getElementById("transactionsContent"),
    transactionsModalTitle: document.getElementById("transactionsModalTitle"),
};

/* ==========================================================================
   Data Loading & Calculations
   ========================================================================== */
async function loadCustomers() {
    try {
        showLoading(true);
        customers = await window.electronAPI.getCustomers();
        if (!Array.isArray(customers)) customers = [];

        try {
            sales = await window.electronAPI.getSales();
            if (!Array.isArray(sales)) sales = [];
        } catch {
            sales = [];
        }

        updateHeaderStats();
        applyFilterAndRender();
    } catch (e) {
        showError("فشل في تحميل العملاء", e.message);
    } finally {
        showLoading(false);
    }
}

function updateHeaderStats() {
    const totalCount = customers.length;
    
    // Calculate total spend across all customer sales
    const totalSpend = sales.reduce((sum, s) => {
        return sum + (parseFloat(s.total) || 0);
    }, 0);

    if (els.totalCustomersCount) {
        els.totalCustomersCount.textContent = `${totalCount} عميل`;
        els.totalCustomersCount.title = `إجمالي عدد العملاء المسجلين: ${totalCount}`;
    }

    if (els.totalPurchasesSum) {
        els.totalPurchasesSum.textContent = formatCurrency(totalSpend);
        els.totalPurchasesSum.title = `إجمالي مبيعات الفواتير: ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;
    }
}

function getCustomerStats(customer) {
    if (!customer) return { count: 0, total: 0, lastDate: null };
    const name = (customer.name || "").trim().toLowerCase();
    const phone = (customer.phone || "").trim();

    const customerSales = sales.filter(s => {
        const sName = (s.customerName || "").trim().toLowerCase();
        const sPhone = (s.customerPhone || "").trim();
        return (name && sName === name) || (phone && sPhone && sPhone === phone);
    });

    const total = customerSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const count = customerSales.length;

    let lastDate = null;
    if (count > 0) {
        customerSales.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        lastDate = customerSales[0].date;
    }

    return { count, total, lastDate, salesList: customerSales };
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
   Search & Filter
   ========================================================================== */
function handleCustomerSearch(query) {
    currentSearch = (query || "").trim().toLowerCase();
    applyFilterAndRender();
}

function clearCustomerSearch() {
    if (els.searchCustomerInput) els.searchCustomerInput.value = "";
    currentSearch = "";
    applyFilterAndRender();
}

function applyFilterAndRender() {
    let list = customers;
    if (currentSearch) {
        list = customers.filter(c => {
            const name = (c.name || "").toLowerCase();
            const phone = (c.phone || "").toLowerCase();
            const address = (c.address || "").toLowerCase();
            const notes = (c.notes || "").toLowerCase();
            return name.includes(currentSearch) ||
                   phone.includes(currentSearch) ||
                   address.includes(currentSearch) ||
                   notes.includes(currentSearch);
        });
    }
    renderCustomersList(list);
}

/* ==========================================================================
   Render Customers Grid
   ========================================================================== */
function renderCustomersList(listToRender) {
    if (!els.list) return;

    if (!listToRender.length) {
        if (currentSearch) {
            els.list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon-wrap"><i class="fas fa-search"></i></div>
                    <h3>لا توجد نتائج بحث مطابقة</h3>
                    <p>لم يتم العثور على أي عميل يطابق "${escapeHTML(currentSearch)}"</p>
                    <button onclick="clearCustomerSearch()" class="add-btn-header" style="margin: 0 auto; display: inline-flex;">
                        <i class="fas fa-times"></i> مسح البحث
                    </button>
                </div>
            `;
        } else {
            els.list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon-wrap"><i class="fas fa-users-slash"></i></div>
                    <h3>لا يوجد عملاء مسجلين حالياً</h3>
                    <p>إبدأ بإضافة أول عميل لتنظيم عمليات البيع وتتبع المعاملات</p>
                    <button onclick="openAddCustomerModal()" class="add-btn-header" style="margin: 0 auto; display: inline-flex;">
                        <i class="fas fa-user-plus"></i> إضافة عميل جديد
                    </button>
                </div>
            `;
        }
        return;
    }

    els.list.innerHTML = listToRender.map(c => {
        const stats = getCustomerStats(c);
        const nameInitial = (c.name || "").trim().charAt(0) || "ع";

        return `
            <div class="customer-card" id="customer-card-${c._id}">
                <div>
                    <!-- Top: Avatar & Meta -->
                    <div class="customer-card-top">
                        <div class="customer-avatar-wrap">
                            <div class="customer-avatar">
                                <span>${escapeHTML(nameInitial)}</span>
                            </div>
                        </div>
                        <div class="customer-meta">
                            <h3 class="customer-name" title="${escapeHTML(c.name)}">${escapeHTML(c.name)}</h3>
                            <div class="customer-badges">
                                <span class="badge-pill badge-purchases">
                                    <i class="fas fa-shopping-bag"></i>
                                    <span>${stats.count} معاملة</span>
                                </span>
                                ${stats.total > 0 ? `
                                    <span class="badge-pill badge-spent">
                                        <i class="fas fa-coins"></i>
                                        <span>${formatCurrency(stats.total)}</span>
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Details -->
                    <div class="customer-details">
                        <div class="detail-row">
                            <i class="fas fa-phone-alt"></i>
                            <span>${c.phone ? `<a href="tel:${escapeHTML(c.phone)}">${escapeHTML(c.phone)}</a>` : 'غير متوفر'}</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${escapeHTML(c.address || 'العنوان غير محدد')}</span>
                        </div>
                        ${c.dateAdded ? `
                            <div class="detail-row">
                                <i class="far fa-calendar-alt"></i>
                                <span>انضم: ${formatDate(c.dateAdded)}</span>
                            </div>
                        ` : ''}
                        ${c.notes ? `
                            <div class="detail-row" style="color: #64748b; font-size: 0.82rem;">
                                <i class="fas fa-sticky-note"></i>
                                <span title="${escapeHTML(c.notes)}">${escapeHTML(c.notes)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Actions -->
                <div class="customer-card-actions">
                    <button class="btn-card-transactions" onclick="viewCustomerTransactions('${c._id}')" title="عرض سجل المبيعات والمعاملات">
                        <i class="fas fa-history"></i>
                        <span>سجل المبيعات</span>
                    </button>
                    <button class="btn-card-edit" onclick="openEditCustomerModal('${c._id}')" title="تعديل بيانات العميل">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-card-delete" onclick="confirmDeleteCustomer('${c._id}')" title="حذف العميل">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

/* ==========================================================================
   Customer Transactions Modal
   ========================================================================== */
function viewCustomerTransactions(customerId) {
    const customer = customers.find(c => c._id === customerId);
    if (!customer) return;

    const stats = getCustomerStats(customer);
    const customerSales = stats.salesList || [];

    if (els.transactionsModalTitle) {
        els.transactionsModalTitle.textContent = `معاملات العميل: ${customer.name}`;
    }

    let rowsHtml = "";
    if (customerSales.length === 0) {
        rowsHtml = `
            <tr>
                <td colspan="4" style="text-align: center; color: #94a3b8; padding: 24px;">
                    <i class="fas fa-receipt text-3xl mb-2" style="display: block; opacity: 0.5;"></i>
                    لا توجد فواتير مبيعات مسجلة لهذا العميل حتى الآن.
                </td>
            </tr>
        `;
    } else {
        rowsHtml = customerSales.map((sale, idx) => {
            const itemsCount = sale.items ? sale.items.length : 0;
            const itemsSummary = (sale.items || []).map(i => i.name).join(", ");
            const methodMap = { cash: "كاش", vodafoneCash: "فودافون كاش", visaCard: "فيزا" };
            const payMethod = methodMap[sale.paymentMethod] || sale.paymentMethod || "كاش";

            return `
                <tr>
                    <td style="font-weight: 800; color: #6d28d9;">
                        #${escapeHTML(sale.invoiceNumber || String(idx + 1))}
                    </td>
                    <td>
                        <div style="font-weight: 600;">${formatDate(sale.date)}</div>
                        <div style="font-size: 0.76rem; color: #64748b;">${payMethod}</div>
                    </td>
                    <td>
                        <span style="font-weight: 700;">${itemsCount} أصناف</span>
                        <div style="font-size: 0.75rem; color: #64748b; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(itemsSummary)}">
                            ${escapeHTML(itemsSummary || '--')}
                        </div>
                    </td>
                    <td style="font-weight: 800; color: #059669; text-align: left;">
                        ${formatCurrency(sale.total)}
                    </td>
                </tr>
            `;
        }).join("");
    }

    if (els.transactionsContent) {
        els.transactionsContent.innerHTML = `
            <div class="trans-summary-banner">
                <div class="trans-summary-item">
                    <span class="trans-summary-label">اسم العميل</span>
                    <span class="trans-summary-val">${escapeHTML(customer.name)}</span>
                </div>
                <div class="trans-summary-item">
                    <span class="trans-summary-label">رقم الهاتف</span>
                    <span class="trans-summary-val">${escapeHTML(customer.phone || 'غير متوفر')}</span>
                </div>
                <div class="trans-summary-item">
                    <span class="trans-summary-label">إجمالي الفواتير</span>
                    <span class="trans-summary-val">${stats.count} فاتورة</span>
                </div>
                <div class="trans-summary-item">
                    <span class="trans-summary-label">إجمالي المشتريات</span>
                    <span class="trans-summary-val" style="color: #059669;">${formatCurrency(stats.total)}</span>
                </div>
            </div>

            <div style="max-height: 45vh; overflow-y: auto;">
                <table class="trans-table">
                    <thead>
                        <tr>
                            <th style="width: 25%;">رقم الفاتورة</th>
                            <th style="width: 25%;">التاريخ & الدفع</th>
                            <th style="width: 30%;">المنتجات</th>
                            <th style="width: 20%; text-align: left;">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }

    if (els.transactionsModal) {
        els.transactionsModal.classList.add("open");
        document.body.classList.add("modal-open-lock");
    }
}

function closeTransactionsModal() {
    if (els.transactionsModal) {
        els.transactionsModal.classList.remove("open");
        document.body.classList.remove("modal-open-lock");
    }
}

/* ==========================================================================
   Modal Operations (Add / Edit / Close)
   ========================================================================== */
function openAddCustomerModal() {
    editingCustomerId = null;
    resetCustomerForm();

    if (els.formTitle) els.formTitle.textContent = "إضافة عميل جديد";
    if (els.modalIcon) els.modalIcon.innerHTML = `<i class="fas fa-user-plus"></i>`;

    if (els.modal) els.modal.classList.add("open");
    document.body.classList.add("modal-open-lock");
    setTimeout(() => {
        if (els.customerName) els.customerName.focus();
    }, 150);
}

function openEditCustomerModal(customerId) {
    const customer = customers.find(c => c._id === customerId);
    if (!customer) return;

    editingCustomerId = customerId;
    resetCustomerForm();
    if (els.editingCustomerId) els.editingCustomerId.value = customerId;

    if (els.formTitle) els.formTitle.textContent = `تعديل بيانات العميل: ${customer.name}`;
    if (els.modalIcon) els.modalIcon.innerHTML = `<i class="fas fa-user-edit"></i>`;

    if (els.customerName) els.customerName.value = customer.name || "";
    if (els.customerPhone) els.customerPhone.value = customer.phone || "";
    if (els.customerAddress) els.customerAddress.value = customer.address || "";
    if (els.customerNotes) els.customerNotes.value = customer.notes || "";

    if (els.modal) els.modal.classList.add("open");
    document.body.classList.add("modal-open-lock");
    setTimeout(() => {
        if (els.customerName) els.customerName.focus();
    }, 150);
}

function closeCustomerModal() {
    if (els.modal) els.modal.classList.remove("open");
    document.body.classList.remove("modal-open-lock");
    resetCustomerForm();
}

function handleModalOverlayClick(e) {
    if (e.target === els.modal) {
        closeCustomerModal();
    }
    if (e.target === els.transactionsModal) {
        closeTransactionsModal();
    }
}

function resetCustomerForm() {
    if (els.form) els.form.reset();
    if (els.editingCustomerId) els.editingCustomerId.value = "";
}

/* ==========================================================================
   Save & Delete Customer
   ========================================================================== */
async function saveCustomer() {
    const name = els.customerName ? els.customerName.value.trim() : "";
    const phone = els.customerPhone ? els.customerPhone.value.trim() : "";
    const address = els.customerAddress ? els.customerAddress.value.trim() : "";
    const notes = els.customerNotes ? els.customerNotes.value.trim() : "";

    // Arabic field validations
    if (!name) {
        showError("بيانات غير مكتملة", "يرجى إدخال اسم العميل للمتابعة.");
        if (els.customerName) els.customerName.focus();
        return;
    }

    if (!phone) {
        showError("بيانات غير مكتملة", "يرجى إدخال رقم هاتف العميل.");
        if (els.customerPhone) els.customerPhone.focus();
        return;
    }

    // Check for duplicate name
    const isEditing = Boolean(editingCustomerId);
    const duplicate = customers.find(c => 
        c.name.toLowerCase() === name.toLowerCase() && 
        (!isEditing || c._id !== editingCustomerId)
    );

    if (duplicate) {
        showError("عميل مسجل مسبقاً", `يوجد عميل مسجل بالفعل باسم "${name}". يرجى اختيار اسم مميز أو تحديث بيانات العميل الموجود.`);
        if (els.customerName) els.customerName.focus();
        return;
    }

    try {
        showLoading(true);
        if (els.saveCustomerBtn) els.saveCustomerBtn.disabled = true;

        if (isEditing) {
            const existingCustomer = customers.find(c => c._id === editingCustomerId);
            const payload = {
                name,
                phone,
                address,
                notes,
                dateAdded: existingCustomer?.dateAdded || new Date().toISOString()
            };
            await window.electronAPI.updateCustomer(editingCustomerId, payload);
            showSuccess("تم تحديث بيانات العميل بنجاح");
        } else {
            const payload = {
                name,
                phone,
                address,
                notes,
                dateAdded: new Date().toISOString()
            };
            await window.electronAPI.addCustomer(payload);
            showSuccess("تمت إضافة العميل الجديد بنجاح");
        }

        closeCustomerModal();
        await loadCustomers();
    } catch (err) {
        showError("فشل في حفظ العميل", err.message || "حدث خطأ غير متوقع");
    } finally {
        showLoading(false);
        if (els.saveCustomerBtn) els.saveCustomerBtn.disabled = false;
    }
}

async function confirmDeleteCustomer(customerId) {
    const customer = customers.find(c => c._id === customerId);
    if (!customer) return;

    const result = await Swal.fire({
        title: "هل أنت متأكد؟",
        text: `سيتم حذف العميل "${customer.name}" من النظام!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم، احذف العميل!",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
    });

    if (result.isConfirmed) {
        try {
            showLoading(true);
            await window.electronAPI.deleteCustomer(customerId);
            showSuccess("تم حذف العميل بنجاح");
            await loadCustomers();
        } catch (err) {
            showError("فشل في حذف العميل", err.message);
        } finally {
            showLoading(false);
        }
    }
}

/* ==========================================================================
   Alert Helpers
   ========================================================================== */
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
    if (els.form) {
        els.form.addEventListener("submit", (e) => {
            e.preventDefault();
            saveCustomer();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (els.modal && els.modal.classList.contains("open")) {
                closeCustomerModal();
            }
            if (els.transactionsModal && els.transactionsModal.classList.contains("open")) {
                closeTransactionsModal();
            }
        }
    });

    await loadCustomers();
});

// Window globals for inline HTML event handlers
window.openAddCustomerModal = openAddCustomerModal;
window.openEditCustomerModal = openEditCustomerModal;
window.closeCustomerModal = closeCustomerModal;
window.handleModalOverlayClick = handleModalOverlayClick;
window.handleCustomerSearch = handleCustomerSearch;
window.clearCustomerSearch = clearCustomerSearch;
window.saveCustomer = saveCustomer;
window.confirmDeleteCustomer = confirmDeleteCustomer;
window.viewCustomerTransactions = viewCustomerTransactions;
window.closeTransactionsModal = closeTransactionsModal;
