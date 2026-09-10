let invoices = [];
let products = [];
let suppliers = [];
let items = [];
let currentInvoicesSearch = "";
let editingInvoiceId = null;

const els = {
    list: document.getElementById("invoicesList"),
    modal: document.getElementById("purchaseInvoiceModal"),
    form: document.getElementById("invoiceForm"),
    formTitle: document.getElementById("formTitle"),
    modalIcon: document.getElementById("modalIcon"),
    editingInvoiceId: document.getElementById("editingInvoiceId"),
    selectedSupplierId: document.getElementById("selectedSupplierId"),
    noSuppliersAlert: document.getElementById("noSuppliersAlert"),
    supplierSearch: document.getElementById("supplierSearch"),
    supplierDropdown: document.getElementById("supplierDropdown"),
    supplierName: document.getElementById("supplierName"),
    supplierPhone: document.getElementById("supplierPhone"),
    createdByName: document.getElementById("createdByName"),
    createdByPhone: document.getElementById("createdByPhone"),
    invoiceDate: document.getElementById("invoiceDate"),
    paymentMethodSelect: document.getElementById("paymentMethodSelect"),
    paymentMethodHidden: document.getElementById("paymentMethodHidden"),
    installmentCountGroup: document.getElementById("installmentCountGroup"),
    installmentCount: document.getElementById("installmentCount"),
    creditDueDateGroup: document.getElementById("creditDueDateGroup"),
    creditDueDate: document.getElementById("creditDueDate"),
    installmentDatesContainer: document.getElementById("installmentDatesContainer"),
    installmentDates: document.getElementById("installmentDates"),
    productSearchInput: document.getElementById("productSearchInput"),
    selectedProductId: document.getElementById("selectedProductId"),
    productDropdown: document.getElementById("productDropdown"),
    productQuantity: document.getElementById("productQuantity"),
    productPrice: document.getElementById("productPrice"),
    itemsListBody: document.getElementById("itemsListBody"),
    totalAmount: document.getElementById("totalAmount"),
    notes: document.getElementById("notes"),
    invoiceImage: document.getElementById("invoiceImage"),
    invoiceImageDropzone: document.getElementById("invoiceImageDropzone"),
    imagePreview: document.getElementById("imagePreview"),
    imagePreviewImg: document.getElementById("imagePreviewImg"),
    saveInvoiceBtn: document.getElementById("saveInvoiceBtn"),
    invoicesSearch: document.getElementById("invoicesSearch"),
    totalInvoicesCount: document.getElementById("totalInvoicesCount"),
    totalPurchasesSum: document.getElementById("totalPurchasesSum"),
};

/* ==========================================================================
   Data Loading & Calculations
   ========================================================================== */
async function loadSuppliers() {
    try {
        suppliers = await window.electronAPI.getSuppliers();
        if (!Array.isArray(suppliers)) suppliers = [];
        checkSuppliersState();
    } catch (e) {
        showError("فشل في تحميل الموردين", e.message);
    }
}

async function loadProducts() {
    try {
        products = await window.electronAPI.getProducts();
        if (!Array.isArray(products)) products = [];
    } catch (e) {
        showError("فشل في تحميل المنتجات", e.message);
    }
}

async function loadInvoices() {
    try {
        showLoading(true);
        invoices = await window.electronAPI.getProductsPurchaseInvoices();
        if (!Array.isArray(invoices)) invoices = [];
        updateHeaderStats();
        applyInvoicesFilterAndRender();
    } catch (e) {
        showError("فشل في تحميل الفواتير", e.message);
    } finally {
        showLoading(false);
    }
}

function updateHeaderStats() {
    const totalCount = invoices.length;
    const totalSum = invoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);

    if (els.totalInvoicesCount) {
        els.totalInvoicesCount.textContent = `${totalCount} فاتورة`;
        els.totalInvoicesCount.title = `إجمالي عدد الفواتير: ${totalCount} فاتورة`;
    }
    if (els.totalPurchasesSum) {
        const formatted = formatCurrency(totalSum);
        els.totalPurchasesSum.textContent = formatted;
        els.totalPurchasesSum.title = `إجمالي المشتريات: ${totalSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه مصري`;
    }
}

function getInvoiceDisplayNumber(inv) {
    if (!inv) return "PUR-0001";
    if (inv.invoiceNumber && !inv.invoiceNumber.startsWith("SUSPENDED_")) {
        if (/^(PUR|PINV|INV|شراء)[\s-]/i.test(inv.invoiceNumber) || /^\d+$/.test(inv.invoiceNumber)) {
            return inv.invoiceNumber;
        }
        return `PUR-${inv.invoiceNumber.replace(/^#/, '')}`;
    }
    if (inv._id) {
        const idx = invoices.findIndex(i => i._id === inv._id);
        if (idx !== -1) {
            const seq = invoices.length - idx;
            return `PUR-${String(seq).padStart(4, "0")}`;
        }
        const numericPart = inv._id.replace(/\D/g, '').slice(-4);
        if (numericPart) return `PUR-${numericPart.padStart(4, "0")}`;
    }
    return "PUR-0001";
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

async function getFileAsDataURL(filePath) {
    if (!filePath) return "";
    try {
        return (await window.electronAPI.readFileAsDataURL(filePath)) || "";
    } catch {
        return "";
    }
}

function checkSuppliersState() {
    if (!els.noSuppliersAlert) return;
    if (suppliers.length === 0) {
        els.noSuppliersAlert.classList.remove("hidden");
    } else {
        els.noSuppliersAlert.classList.add("hidden");
    }
}

/* ==========================================================================
   Supplier Autocomplete Search (No Auto-Open on Form Open)
   ========================================================================== */
function initSupplierSearch() {
    if (!els.supplierSearch || !els.supplierDropdown) return;

    els.supplierSearch.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        if (val) {
            showSupplierSuggestions(val);
        } else {
            els.supplierDropdown.classList.remove("show");
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest("#supplierSearch") && !e.target.closest("#supplierDropdown")) {
            els.supplierDropdown.classList.remove("show");
        }
    });
}

function showSupplierSuggestions(query = "") {
    if (!els.supplierDropdown) return;

    if (suppliers.length === 0) {
        checkSuppliersState();
        els.supplierDropdown.innerHTML = `
            <div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 0.85rem;">
                لا يوجد موردين مسجلين بعد.
            </div>
        `;
        els.supplierDropdown.classList.add("show");
        return;
    }

    const q = query.trim().toLowerCase();
    const matches = suppliers.filter(s => {
        const name = (s.name || "").toLowerCase();
        const phone = (s.phone || "").toLowerCase();
        return name.includes(q) || phone.includes(q);
    });

    if (matches.length === 0) {
        els.supplierDropdown.innerHTML = `
            <div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 0.85rem;">
                لم يتم العثور على مورد مطابق
            </div>
        `;
    } else {
        const paymentMap = { cash: "كاش", credit: "آجل", installment: "تقسيط" };
        const displayed = matches.slice(0, 30);
        els.supplierDropdown.innerHTML = displayed.map(s => `
            <div class="autocomplete-item" onclick="selectSupplier('${s._id}')">
                <div>
                    <div class="autocomplete-item-name">
                        <i class="fas fa-truck text-primary"></i>
                        <span>${escapeHTML(s.name)}</span>
                    </div>
                    <div class="autocomplete-item-phone">
                        <i class="fas fa-phone"></i> ${escapeHTML(s.phone || 'بدون هاتف')}
                    </div>
                </div>
                <span class="badge-payment badge-${s.paymentMethod || 'cash'}">
                    ${paymentMap[s.paymentMethod] || 'كاش'}
                </span>
            </div>
        `).join("");
    }

    els.supplierDropdown.classList.add("show");
}

function selectSupplier(supplierId) {
    const s = suppliers.find(item => item._id === supplierId);
    if (!s) return;

    els.selectedSupplierId.value = s._id;
    els.supplierName.value = s.name;
    els.supplierPhone.value = s.phone || "";
    els.supplierSearch.value = `${s.name} (${s.phone || 'بدون هاتف'})`;

    const method = s.paymentMethod || "cash";
    if (els.paymentMethodSelect) {
        els.paymentMethodSelect.value = method;
    }
    if (els.paymentMethodHidden) {
        els.paymentMethodHidden.value = method;
    }
    handlePaymentMethodChange(method);

    els.supplierDropdown.classList.remove("show");
}

/* ==========================================================================
   Product Autocomplete & Search (Scalable for 10,000+ Products)
   ========================================================================== */
function initProductSearch() {
    if (!els.productSearchInput || !els.productDropdown) return;

    els.productSearchInput.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        if (val) {
            showProductSuggestions(val);
        } else {
            els.selectedProductId.value = "";
            els.productDropdown.classList.remove("show");
        }
    });

    els.productSearchInput.addEventListener("focus", () => {
        const val = els.productSearchInput.value.trim();
        if (val) {
            showProductSuggestions(val);
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.target.closest("#productSearchInput") && !e.target.closest("#productDropdown")) {
            els.productDropdown.classList.remove("show");
        }
    });
}

function showProductSuggestions(query = "") {
    if (!els.productDropdown) return;

    if (products.length === 0) {
        els.productDropdown.innerHTML = `
            <div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 0.85rem;">
                لا توجد منتجات مسجلة بالنظام بعد.
            </div>
        `;
        els.productDropdown.classList.add("show");
        return;
    }

    const q = query.trim().toLowerCase();
    const matches = products.filter(p => {
        const name = (p.name || "").toLowerCase();
        const barcode = (p.barcode || "").toLowerCase();
        return name.includes(q) || barcode.includes(q);
    });

    if (matches.length === 0) {
        els.productDropdown.innerHTML = `
            <div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 0.85rem;">
                لم يتم العثور على منتج يطابق "${escapeHTML(query)}"
            </div>
        `;
    } else {
        const displayed = matches.slice(0, 30);
        const hasMore = matches.length > 30;

        let html = displayed.map(p => {
            const price = (parseFloat(p.purchasePrice) || parseFloat(p.price) || 0).toFixed(2);
            return `
                <div class="autocomplete-item" onclick="selectProduct('${p._id}')">
                    <div>
                        <div class="autocomplete-item-name">
                            <i class="fas fa-box text-primary"></i>
                            <span>${escapeHTML(p.name)}</span>
                        </div>
                        ${p.barcode ? `
                            <div class="autocomplete-item-phone">
                                <i class="fas fa-barcode"></i> ${escapeHTML(p.barcode)}
                            </div>
                        ` : ''}
                    </div>
                    <div style="text-align: left;">
                        <span style="font-weight: 800; color: #6d28d9; font-size: 0.88rem;">${price} ج.م</span>
                    </div>
                </div>
            `;
        }).join("");

        if (hasMore) {
            html += `
                <div style="padding: 6px; text-align: center; font-size: 0.76rem; color: #94a3b8; background: #fafafa; border-top: 1px dashed #e2e8f0;">
                    يوجد المزيد من النتائج المطابقة (${matches.length - 30}+)، اكتب اسم المنتج بدقة أكثر...
                </div>
            `;
        }

        els.productDropdown.innerHTML = html;
    }

    els.productDropdown.classList.add("show");
}

function selectProduct(productId) {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;

    if (els.selectedProductId) els.selectedProductId.value = prod._id;
    if (els.productSearchInput) els.productSearchInput.value = prod.name;
    if (els.productPrice) {
        const price = (parseFloat(prod.purchasePrice) || parseFloat(prod.price) || 0).toFixed(2);
        els.productPrice.value = price;
    }
    if (els.productQuantity) {
        els.productQuantity.value = 1;
        els.productQuantity.focus();
    }

    if (els.productDropdown) els.productDropdown.classList.remove("show");
}

function addItemToInvoice() {
    let productId = els.selectedProductId ? els.selectedProductId.value : "";
    const searchVal = els.productSearchInput ? els.productSearchInput.value.trim() : "";
    const quantity = parseInt(els.productQuantity.value) || 0;
    const price = parseFloat(els.productPrice.value);

    if (!productId && searchVal) {
        const matched = products.find(p => p.name && p.name.trim().toLowerCase() === searchVal.toLowerCase());
        if (matched) {
            productId = matched._id;
            els.selectedProductId.value = matched._id;
        }
    }

    if (!productId || !searchVal) {
        showError("بيانات غير مكتملة", "يرجى اختيار / البحث عن منتج لإضافته للفاتورة.");
        if (els.productSearchInput) els.productSearchInput.focus();
        return;
    }

    if (quantity <= 0) {
        showError("بيانات غير صحيحة", "يرجى إدخال كمية صحيحة (أكبر من 0).");
        if (els.productQuantity) els.productQuantity.focus();
        return;
    }

    if (isNaN(price) || price < 0) {
        showError("بيانات غير صحيحة", "يرجى إدخال سعر الشراء بشكل صحيح.");
        if (els.productPrice) els.productPrice.focus();
        return;
    }

    const prod = products.find(p => p._id === productId);
    if (!prod) {
        showError("تنبيه", "المنتج المحدد غير موجود في قاعدة البيانات.");
        return;
    }

    const existingIdx = items.findIndex(it => it.productId === productId);
    if (existingIdx !== -1) {
        items[existingIdx].quantity += quantity;
        items[existingIdx].price = price;
    } else {
        items.push({
            productId: prod._id,
            productName: prod.name,
            quantity: quantity,
            price: price,
            unit: prod.unit || "وحدة"
        });
    }

    renderItemsTable();
    calculateTotalAmount();

    if (els.selectedProductId) els.selectedProductId.value = "";
    if (els.productSearchInput) els.productSearchInput.value = "";
    if (els.productQuantity) els.productQuantity.value = 1;
    if (els.productPrice) els.productPrice.value = "";
    if (els.productDropdown) els.productDropdown.classList.remove("show");
    if (els.productSearchInput) els.productSearchInput.focus();
}

function removeItemFromInvoice(index) {
    items.splice(index, 1);
    renderItemsTable();
    calculateTotalAmount();
}

function renderItemsTable() {
    if (!els.itemsListBody) return;

    if (items.length === 0) {
        els.itemsListBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">
                    <i class="fas fa-cart-arrow-down" style="margin-left: 8px;"></i>
                    لم يتم إضافة أي منتجات للفاتورة بعد
                </td>
            </tr>
        `;
        return;
    }

    els.itemsListBody.innerHTML = items.map((item, idx) => {
        const itemTotal = (item.quantity * item.price).toFixed(2);
        return `
            <tr>
                <td style="font-weight: 700; color: #1e293b;">
                    <i class="fas fa-box text-primary" style="margin-left: 8px;"></i>
                    <span>${escapeHTML(item.productName)}</span>
                </td>
                <td>
                    <span style="font-weight: 700;">${item.quantity}</span> ${escapeHTML(item.unit || 'وحدة')}
                </td>
                <td>${item.price.toFixed(2)} ج.م</td>
                <td style="font-weight: 800; color: #6d28d9;">${itemTotal} ج.م</td>
                <td style="text-align: center;">
                    <button type="button" class="btn-remove-item" onclick="removeItemFromInvoice(${idx})" title="حذف المنتج">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function calculateTotalAmount() {
    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    if (els.totalAmount) {
        els.totalAmount.value = total.toFixed(2);
    }
    const currentMethod = els.paymentMethodHidden?.value || els.paymentMethodSelect?.value || "cash";
    if (currentMethod === "installment") {
        generateInstallmentDates();
    }
    return total;
}

/* ==========================================================================
   Payment Method & Installments / Credit Handling
   ========================================================================== */
function handlePaymentMethodChange(method) {
    if (method === "installment") {
        if (els.installmentCountGroup) els.installmentCountGroup.style.display = "block";
        if (els.installmentDatesContainer) els.installmentDatesContainer.style.display = "block";
        if (els.creditDueDateGroup) els.creditDueDateGroup.style.display = "none";
        generateInstallmentDates();
    } else if (method === "credit") {
        if (els.installmentCountGroup) els.installmentCountGroup.style.display = "none";
        if (els.installmentDatesContainer) els.installmentDatesContainer.style.display = "none";
        if (els.creditDueDateGroup) {
            els.creditDueDateGroup.style.display = "block";
            if (els.creditDueDate && !els.creditDueDate.value) {
                const baseDateStr = els.invoiceDate?.value || new Date().toISOString().split("T")[0];
                const d = new Date(baseDateStr);
                d.setDate(d.getDate() + 30);
                els.creditDueDate.value = d.toISOString().split("T")[0];
            }
        }
    } else {
        // Cash
        if (els.installmentCountGroup) els.installmentCountGroup.style.display = "none";
        if (els.installmentDatesContainer) els.installmentDatesContainer.style.display = "none";
        if (els.creditDueDateGroup) els.creditDueDateGroup.style.display = "none";
    }
}

function generateInstallmentDates() {
    if (!els.installmentDates) return;
    const count = parseInt(els.installmentCount?.value) || 3;
    const baseDateStr = els.invoiceDate?.value || new Date().toISOString().split("T")[0];
    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const installmentAmount = count > 0 ? (total / count).toFixed(2) : "0.00";

    const baseDate = new Date(baseDateStr);
    const dates = [];

    for (let i = 0; i < count; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        dates.push(dueDate.toISOString().split("T")[0]);
    }

    els.installmentDates.innerHTML = dates.map((date, idx) => `
        <div class="installment-date-row">
            <span class="installment-date-num">الدفعة ${idx + 1}:</span>
            <input type="date" class="modal-input" style="flex: 1;" value="${date}" data-installment-idx="${idx}">
            <span style="font-weight: 700; color: #059669; font-size: 0.85rem; min-width: 90px; text-align: left;">
                ${installmentAmount} ج.م
            </span>
        </div>
    `).join("");
}

function getCustomInstallmentDates() {
    if (!els.installmentDates) return [];
    const inputs = els.installmentDates.querySelectorAll('input[type="date"]');
    return Array.from(inputs).map(inp => inp.value).filter(Boolean);
}

/* ==========================================================================
   Invoices Table & Main View
   ========================================================================== */
function handleInvoicesSearch(query) {
    currentInvoicesSearch = (query || "").trim().toLowerCase();
    applyInvoicesFilterAndRender();
}

function applyInvoicesFilterAndRender() {
    let list = invoices;
    if (currentInvoicesSearch) {
        list = invoices.filter(inv => {
            const num = (getInvoiceDisplayNumber(inv) || "").toLowerCase();
            const supp = (inv.supplierName || "").toLowerCase();
            const phone = (inv.supplierPhone || inv.createdByPhone || "").toLowerCase();
            const creator = (inv.createdByName || "").toLowerCase();
            const total = (inv.totalAmount || "").toString();
            const date = (inv.date || "").toLowerCase();
            return num.includes(currentInvoicesSearch) ||
                   supp.includes(currentInvoicesSearch) ||
                   phone.includes(currentInvoicesSearch) ||
                   creator.includes(currentInvoicesSearch) ||
                   total.includes(currentInvoicesSearch) ||
                   date.includes(currentInvoicesSearch);
        });
    }
    renderInvoicesTable(list);
}

async function renderInvoicesTable(listToRender) {
    if (!els.list) return;

    if (!listToRender.length) {
        if (currentInvoicesSearch) {
            els.list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon-wrap"><i class="fas fa-search"></i></div>
                    <h3>لا توجد نتائج بحث مطابقة</h3>
                    <p>لم يتم العثور على أي فاتورة تطابق "${escapeHTML(currentInvoicesSearch)}"</p>
                    <button onclick="clearInvoicesSearch()" class="add-invoice-btn-header" style="margin-top: 8px;">
                        <i class="fas fa-times" style="margin-left: 6px;"></i> مسح البحث
                    </button>
                </div>
            `;
        } else {
            els.list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon-wrap"><i class="fas fa-file-invoice-dollar"></i></div>
                    <h3>لا توجد فواتير شراء مسجلة حالياً</h3>
                    <p>إبدأ بتسجيل أول فاتورة مشتريات لتحديث المخزون ومتابعة الحسابات</p>
                    <button onclick="openAddInvoiceModal()" class="add-invoice-btn-header" style="margin-top: 8px;">
                        <i class="fas fa-plus-circle" style="margin-left: 6px;"></i> إضافة فاتورة جديدة
                    </button>
                </div>
            `;
        }
        return;
    }

    const paymentMap = { cash: "كاش", credit: "آجل", installment: "تقسيط" };

    const rows = await Promise.all(listToRender.map(async (inv) => {
        const invNum = getInvoiceDisplayNumber(inv);
        const supp = suppliers.find(s => s._id === inv.supplierId || s.name === inv.supplierName);
        const method = inv.paymentMethod || (supp ? supp.paymentMethod : "cash") || "cash";
        const total = parseFloat(inv.totalAmount) || 0;
        const itemsCount = inv.items ? inv.items.length : 0;
        const topItem = inv.items && inv.items[0] ? inv.items[0].productName : "";
        const hasImage = Boolean(inv.image);

        return `
            <tr id="invoice-row-${inv._id}">
                <td style="font-weight: 800; color: #6d28d9;">
                    #${escapeHTML(invNum)}
                </td>

                <td>
                    <div class="supplier-cell">
                        <span class="supplier-main-name">
                            <i class="fas fa-store-alt text-primary" style="margin-left: 8px;"></i>
                            <span>${escapeHTML(inv.supplierName || 'غير محدد')}</span>
                        </span>
                        ${inv.supplierPhone ? `
                            <span class="supplier-sub-phone">
                                <i class="fas fa-phone-alt" style="margin-left: 6px;"></i>
                                <span>${escapeHTML(inv.supplierPhone)}</span>
                            </span>
                        ` : ''}
                    </div>
                </td>

                <td>
                    <div class="badge-date">
                        <i class="far fa-calendar-alt" style="margin-left: 8px;"></i>
                        <span>${formatDate(inv.date)}</span>
                    </div>
                </td>

                <td>
                    <span class="products-pill-count" title="${escapeHTML(topItem)}">
                        <i class="fas fa-boxes" style="margin-left: 8px;"></i>
                        <span>${itemsCount} منتجات</span>
                    </span>
                </td>

                <td>
                    <span class="badge-payment badge-${method}">
                        <i class="fas fa-credit-card" style="margin-left: 6px;"></i>
                        <span>${paymentMap[method] || method}</span>
                    </span>
                </td>

                <td class="total-amount-cell">
                    ${formatCurrency(total)}
                </td>

                <td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem; color: #64748b;">
                    ${escapeHTML(inv.notes || '--')}
                </td>

                <td>
                    <div class="table-action-btns">
                        <button class="btn-tbl-action btn-tbl-view" onclick="viewFullInvoiceDetails('${inv._id}')" title="عرض تفاصيل الفاتورة كاملة">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${hasImage ? `
                            <button class="btn-tbl-action btn-tbl-image" onclick="previewInvoiceAttachment('${inv._id}')" title="عرض صورة الفاتورة المرفقة">
                                <i class="fas fa-image"></i>
                            </button>
                        ` : ''}
                        <button class="btn-tbl-action btn-tbl-print" onclick="printPurchaseInvoice('${inv._id}')" title="طباعة الفاتورة">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn-tbl-action btn-tbl-edit" onclick="openEditInvoiceModal('${inv._id}')" title="تعديل الفاتورة">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-tbl-action btn-tbl-delete" onclick="confirmDeleteInvoice('${inv._id}')" title="حذف الفاتورة">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }));

    els.list.innerHTML = `
        <table class="invoices-table">
            <thead>
                <tr>
                    <th style="width: 11%;">رقم الفاتورة</th>
                    <th style="width: 19%;">المورد</th>
                    <th style="width: 15%;">التاريخ</th>
                    <th style="width: 11%;">المنتجات</th>
                    <th style="width: 11%;">نوع الدفع</th>
                    <th style="width: 13%;">الإجمالي</th>
                    <th style="width: 10%;">ملاحظات</th>
                    <th style="width: 18%; text-align: center;">الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${rows.join("")}
            </tbody>
        </table>
    `;
}

function clearInvoicesSearch() {
    if (els.invoicesSearch) els.invoicesSearch.value = "";
    currentInvoicesSearch = "";
    applyInvoicesFilterAndRender();
}

/* ==========================================================================
   Full Invoice Details Modal (Eye Icon)
   ========================================================================== */
async function viewFullInvoiceDetails(invoiceId) {
    const inv = invoices.find(i => i._id === invoiceId);
    if (!inv) {
        showError("خطأ", "الفاتورة غير موجودة.");
        return;
    }

    const paymentMap = { cash: "كاش (دفع فوري)", credit: "آجل (مديونية مورد)", installment: "تقسيط (دفعات مجدولة)" };
    const method = inv.paymentMethod || "cash";
    const total = parseFloat(inv.totalAmount) || 0;
    const invNum = getInvoiceDisplayNumber(inv);

    let imageThumbHtml = "";
    if (inv.image) {
        const imgData = await getFileAsDataURL(inv.image);
        if (imgData) {
            imageThumbHtml = `
                <div class="inv-image-attachment-box">
                    <img src="${imgData}" class="inv-image-thumb-preview" alt="صورة الفاتورة" onclick="previewInvoiceAttachment('${inv._id}')" title="انقر لتكبير صورة الفاتورة">
                    <div>
                        <div style="font-weight: 700; font-size: 0.88rem; color: #1e293b;">صورة الفاتورة الورقية المرفقة</div>
                        <div style="font-size: 0.78rem; color: #64748b;">انقر على الصورة لمعاينتها بحجم أوضح</div>
                    </div>
                </div>
            `;
        }
    }

    const itemsRowsHtml = (inv.items || []).map((it, idx) => {
        const itemTotal = ((it.quantity || 1) * (it.price || 0)).toFixed(2);
        return `
            <tr>
                <td style="font-weight: 700;">${idx + 1}. ${escapeHTML(it.productName)}</td>
                <td style="text-align: center;">${it.quantity} ${escapeHTML(it.unit || 'وحدة')}</td>
                <td style="text-align: center;">${(it.price || 0).toFixed(2)} ج.م</td>
                <td style="font-weight: 800; color: #6d28d9; text-align: left;">${itemTotal} ج.م</td>
            </tr>
        `;
    }).join("");

    const detailsModalHtml = `
        <div class="invoice-details-view">
            <!-- Header banner -->
            <div class="inv-details-header-card">
                <div class="inv-header-title">
                    <div class="inv-header-icon">
                        <i class="fas fa-file-invoice"></i>
                    </div>
                    <div>
                        <h3 class="inv-header-num">فاتورة شراء #${escapeHTML(invNum)}</h3>
                        <div class="inv-header-date">
                            <i class="far fa-calendar-alt" style="margin-left: 6px;"></i>
                            ${formatDate(inv.date)}
                        </div>
                    </div>
                </div>
                <div>
                    <span class="badge-payment badge-${method}" style="font-size: 0.85rem; padding: 6px 14px;">
                        <i class="fas fa-credit-card" style="margin-left: 6px;"></i>
                        ${paymentMap[method] || method}
                    </span>
                </div>
            </div>

            <!-- Meta Grid -->
            <div class="inv-meta-grid">
                <div class="inv-meta-card">
                    <div class="inv-meta-icon">
                        <i class="fas fa-truck"></i>
                    </div>
                    <div class="inv-meta-info">
                        <span class="inv-meta-label">المورد</span>
                        <span class="inv-meta-val">${escapeHTML(inv.supplierName || 'غير محدد')}</span>
                    </div>
                </div>

                <div class="inv-meta-card">
                    <div class="inv-meta-icon">
                        <i class="fas fa-phone-alt"></i>
                    </div>
                    <div class="inv-meta-info">
                        <span class="inv-meta-label">هاتف المورد</span>
                        <span class="inv-meta-val">${escapeHTML(inv.supplierPhone || 'غير متوفر')}</span>
                    </div>
                </div>

                <div class="inv-meta-card">
                    <div class="inv-meta-icon">
                        <i class="fas fa-user-edit"></i>
                    </div>
                    <div class="inv-meta-info">
                        <span class="inv-meta-label">المسؤول عن الفاتورة</span>
                        <span class="inv-meta-val">${escapeHTML(inv.createdByName || 'غير محدد')}</span>
                    </div>
                </div>

                <div class="inv-meta-card">
                    <div class="inv-meta-icon">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <div class="inv-meta-info">
                        <span class="inv-meta-label">هاتف المسؤول</span>
                        <span class="inv-meta-val">${escapeHTML(inv.createdByPhone || 'غير متوفر')}</span>
                    </div>
                </div>

                ${method === 'credit' ? `
                    <div class="inv-meta-card">
                        <div class="inv-meta-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="inv-meta-info">
                            <span class="inv-meta-label">تاريخ الاستحقاق الآجل</span>
                            <span class="inv-meta-val" style="color: #6d28d9; font-weight: 800;">${inv.creditDueDate ? formatDate(inv.creditDueDate) : 'غير محدد'}</span>
                        </div>
                    </div>
                    <div class="inv-meta-card">
                        <div class="inv-meta-icon">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                        <div class="inv-meta-info">
                            <span class="inv-meta-label">حالة سداد الآجل</span>
                            <span class="inv-meta-val">${inv.isPaid ? '<span style="color:#059669; font-weight:800;">تم السداد للمورد</span>' : '<span style="color:#dc2626; font-weight:800;">مستحق الدفع للمورد</span>'}</span>
                        </div>
                    </div>
                ` : ''}

                ${method === 'installment' ? `
                    <div class="inv-meta-card">
                        <div class="inv-meta-icon">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <div class="inv-meta-info">
                            <span class="inv-meta-label">عدد الدفعات المجدولة</span>
                            <span class="inv-meta-val" style="color: #6d28d9; font-weight: 800;">${inv.installmentCount || 3} دفعات شهرية</span>
                        </div>
                    </div>
                    <div class="inv-meta-card">
                        <div class="inv-meta-icon">
                            <i class="fas fa-money-check-alt"></i>
                        </div>
                        <div class="inv-meta-info">
                            <span class="inv-meta-label">قيمة القسط التقريبية</span>
                            <span class="inv-meta-val" style="color: #059669; font-weight: 800;">${((total || 0) / (inv.installmentCount || 3)).toFixed(2)} ج.م / دفعة</span>
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Items Table -->
            <div class="inv-items-table-box">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 45%;">المنتج</th>
                            <th style="width: 15%; text-align: center;">الكمية</th>
                            <th style="width: 20%; text-align: center;">سعر الشراء</th>
                            <th style="width: 20%; text-align: left;">المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRowsHtml || `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 16px;">لا توجد تفاصيل أصناف</td></tr>`}
                    </tbody>
                </table>
            </div>

            <!-- Total Amount Box -->
            <div class="inv-total-summary-box">
                <span class="inv-total-label">
                    <i class="fas fa-calculator" style="margin-left: 8px; color: #6d28d9;"></i>
                    إجمالي الفاتورة النهائي:
                </span>
                <span class="inv-total-value">${formatCurrency(total)}</span>
            </div>

            <!-- Notes if any -->
            ${inv.notes ? `
                <div class="inv-notes-box">
                    <strong><i class="fas fa-sticky-note" style="margin-left: 6px;"></i> ملاحظات:</strong> ${escapeHTML(inv.notes)}
                </div>
            ` : ''}

            <!-- Image attachment preview if any -->
            ${imageThumbHtml}
        </div>
    `;

    Swal.fire({
        html: detailsModalHtml,
        width: "720px",
        showCloseButton: true,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-print" style="margin-left: 6px;"></i> طباعة الفاتورة',
        confirmButtonColor: "#6d28d9",
        cancelButtonText: '<i class="fas fa-times" style="margin-left: 6px;"></i> إغلاق',
        cancelButtonColor: "#64748b",
        focusConfirm: false,
        customClass: {
            popup: 'rounded-2xl shadow-2xl'
        }
    }).then((res) => {
        if (res.isConfirmed) {
            printPurchaseInvoice(inv._id);
        }
    });
}

/* ==========================================================================
   Image Attachment Preview (Constrained size, Sleek modal)
   ========================================================================== */
async function previewInvoiceAttachment(invoiceId) {
    const inv = invoices.find(i => i._id === invoiceId);
    if (!inv || !inv.image) {
        showError("تنبيه", "لا توجد صورة مرفقة مع هذه الفاتورة.");
        return;
    }

    const invNum = getInvoiceDisplayNumber(inv);
    showLoading(true);
    const dataUrl = await getFileAsDataURL(inv.image);
    showLoading(false);

    if (dataUrl) {
        Swal.fire({
            title: `صورة الفاتورة #${invNum}`,
            html: `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center;">
                    <div style="max-height: 52vh; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 14px; background: #f8fafc; border: 1.5px solid #ede9fe; padding: 8px;">
                        <img src="${dataUrl}" alt="صورة الفاتورة" style="max-height: 48vh; max-width: 100%; object-fit: contain; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
                    </div>
                    <div style="font-size: 0.88rem; color: #64748b; font-weight: 600;">
                        <i class="fas fa-store-alt" style="margin-left: 6px; color: #6d28d9;"></i>
                        المورد: <span style="color: #1e293b; font-weight: 700;">${escapeHTML(inv.supplierName || 'غير محدد')}</span>
                        <span style="margin: 0 8px; color: #cbd5e1;">|</span>
                        <i class="far fa-calendar-alt" style="margin-left: 6px; color: #6d28d9;"></i>
                        ${formatDate(inv.date)}
                    </div>
                </div>
            `,
            width: "600px",
            confirmButtonText: '<i class="fas fa-times" style="margin-left: 6px;"></i> إغلاق',
            confirmButtonColor: "#6d28d9",
            customClass: {
                popup: 'rounded-2xl shadow-2xl'
            }
        });
    } else {
        showError("تنبيه", "تعذر قراءة ملف صورة الفاتورة المرفق.");
    }
}

/* ==========================================================================
   Modal Operations (Add / Edit / Close)
   ========================================================================== */
function openAddInvoiceModal() {
    editingInvoiceId = null;
    resetInvoiceForm();

    els.formTitle.textContent = "إضافة فاتورة شراء جديدة";
    if (els.modalIcon) {
        els.modalIcon.innerHTML = `<i class="fas fa-file-invoice"></i>`;
    }

    if (els.invoiceDate && !els.invoiceDate.value) {
        els.invoiceDate.value = new Date().toISOString().split("T")[0];
    }

    checkSuppliersState();
    els.modal.classList.add("open");
    document.body.classList.add("modal-open-lock");
}

async function openEditInvoiceModal(invoiceId) {
    const inv = invoices.find(item => item._id === invoiceId);
    if (!inv) return;

    editingInvoiceId = invoiceId;
    resetInvoiceForm();
    els.editingInvoiceId.value = invoiceId;

    const invNum = getInvoiceDisplayNumber(inv);
    els.formTitle.textContent = `تعديل فاتورة شراء #${invNum}`;
    if (els.modalIcon) {
        els.modalIcon.innerHTML = `<i class="fas fa-edit"></i>`;
    }

    els.selectedSupplierId.value = inv.supplierId || "";
    els.supplierName.value = inv.supplierName || "";
    els.supplierPhone.value = inv.supplierPhone || "";
    els.supplierSearch.value = `${inv.supplierName || ''} (${inv.supplierPhone || ''})`;

    els.createdByName.value = inv.createdByName || "";
    els.createdByPhone.value = inv.createdByPhone || "";
    if (inv.date) {
        els.invoiceDate.value = inv.date.split("T")[0];
    }

    const supp = suppliers.find(s => s._id === inv.supplierId || s.name === inv.supplierName);
    const method = inv.paymentMethod || (supp ? supp.paymentMethod : "cash") || "cash";
    if (els.paymentMethodSelect) els.paymentMethodSelect.value = method;
    if (els.paymentMethodHidden) els.paymentMethodHidden.value = method;
    handlePaymentMethodChange(method);

    if (method === "credit" && inv.creditDueDate && els.creditDueDate) {
        els.creditDueDate.value = inv.creditDueDate;
    }

    if (method === "installment" && inv.installmentCount && els.installmentCount) {
        els.installmentCount.value = inv.installmentCount;
        generateInstallmentDates();
    }

    items = Array.isArray(inv.items) ? JSON.parse(JSON.stringify(inv.items)) : [];
    renderItemsTable();
    calculateTotalAmount();

    els.notes.value = inv.notes || "";

    if (inv.image) {
        const imgData = await getFileAsDataURL(inv.image);
        if (imgData) {
            els.imagePreviewImg.src = imgData;
            els.imagePreview.classList.remove("hidden");
            els.invoiceImageDropzone.classList.add("hidden");
        }
    }

    els.modal.classList.add("open");
    document.body.classList.add("modal-open-lock");
}

function closeInvoiceModal() {
    els.modal.classList.remove("open");
    document.body.classList.remove("modal-open-lock");
    resetInvoiceForm();
}

function handleModalOverlayClick(e) {
    if (e.target === els.modal) {
        closeInvoiceModal();
    }
}

function resetInvoiceForm() {
    if (els.form) els.form.reset();
    if (els.editingInvoiceId) els.editingInvoiceId.value = "";
    if (els.selectedSupplierId) els.selectedSupplierId.value = "";
    if (els.supplierSearch) els.supplierSearch.value = "";
    if (els.supplierDropdown) els.supplierDropdown.classList.remove("show");

    if (els.selectedProductId) els.selectedProductId.value = "";
    if (els.productSearchInput) els.productSearchInput.value = "";
    if (els.productDropdown) els.productDropdown.classList.remove("show");

    items = [];
    renderItemsTable();
    if (els.totalAmount) els.totalAmount.value = "";

    if (els.imagePreview) els.imagePreview.classList.add("hidden");
    if (els.imagePreviewImg) els.imagePreviewImg.src = "";
    if (els.invoiceImageDropzone) els.invoiceImageDropzone.classList.remove("hidden");

    if (els.installmentCountGroup) els.installmentCountGroup.style.display = "none";
    if (els.installmentDatesContainer) els.installmentDatesContainer.style.display = "none";
    if (els.installmentDates) els.installmentDates.innerHTML = "";
    if (els.creditDueDateGroup) els.creditDueDateGroup.style.display = "none";
    if (els.creditDueDate) els.creditDueDate.value = "";
    if (els.paymentMethodSelect) els.paymentMethodSelect.value = "cash";
    if (els.paymentMethodHidden) els.paymentMethodHidden.value = "cash";
}

/* ==========================================================================
   Image Handling
   ========================================================================== */
function handleInvoiceImageChange(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            els.imagePreviewImg.src = event.target.result;
            els.imagePreview.classList.remove("hidden");
            els.invoiceImageDropzone.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }
}

function removeInvoiceImage() {
    els.invoiceImage.value = "";
    els.imagePreviewImg.src = "";
    els.imagePreview.classList.add("hidden");
    els.invoiceImageDropzone.classList.remove("hidden");
}

/* ==========================================================================
   Save & Delete Purchase Invoice
   ========================================================================== */
async function saveInvoice() {
    const supplierId = els.selectedSupplierId ? els.selectedSupplierId.value : "";
    const supplierName = els.supplierName ? els.supplierName.value.trim() : "";
    const supplierPhone = els.supplierPhone ? els.supplierPhone.value.trim() : "";
    const createdByName = els.createdByName ? els.createdByName.value.trim() : "";
    const createdByPhone = els.createdByPhone ? els.createdByPhone.value.trim() : "";
    const invoiceDate = els.invoiceDate ? els.invoiceDate.value.trim() : "";
    const paymentMethod = els.paymentMethodHidden?.value || els.paymentMethodSelect?.value || "cash";
    const installmentCount = parseInt(els.installmentCount ? els.installmentCount.value : 3) || 3;
    const creditDueDate = els.creditDueDate ? els.creditDueDate.value.trim() : "";
    const notes = els.notes ? els.notes.value.trim() : "";
    const totalAmount = calculateTotalAmount();
    const imageFile = els.invoiceImage && els.invoiceImage.files ? els.invoiceImage.files[0] : null;

    // Specific Arabic Validations
    if (!supplierName || !supplierPhone) {
        showError("بيانات غير مكتملة", "يرجى اختيار مورد من القائمة أولاً.");
        if (els.supplierSearch) els.supplierSearch.focus();
        return;
    }
    if (!createdByName) {
        showError("بيانات غير مكتملة", "يرجى إدخال اسم منشئ الفاتورة (المسؤول).");
        if (els.createdByName) els.createdByName.focus();
        return;
    }
    if (!createdByPhone) {
        showError("بيانات غير مكتملة", "يرجى إدخال رقم هاتف منشئ الفاتورة.");
        if (els.createdByPhone) els.createdByPhone.focus();
        return;
    }
    if (!invoiceDate) {
        showError("بيانات غير مكتملة", "يرجى تحديد تاريخ الفاتورة.");
        if (els.invoiceDate) els.invoiceDate.focus();
        return;
    }
    if (paymentMethod === "credit" && !creditDueDate) {
        showError("بيانات غير مكتملة", "يرجى تحديد تاريخ استحقاق المبلغ الآجل للمورد.");
        if (els.creditDueDate) els.creditDueDate.focus();
        return;
    }
    if (items.length === 0) {
        showError("فاتورة فارغة", "يرجى إضافة منتج واحد على الأقل لجدول الفاتورة قبل الحفظ.");
        if (els.productSearchInput) els.productSearchInput.focus();
        return;
    }

    const supplier = suppliers.find(s => (supplierId && s._id === supplierId) || (s.name === supplierName && s.phone === supplierPhone));
    if (!supplier) {
        showError("تنبيه", "تعذر العثور على المورد بقاعدة البيانات، يرجى إعادة اختياره من القائمة.");
        return;
    }

    try {
        showLoading(true);
        if (els.saveInvoiceBtn) els.saveInvoiceBtn.disabled = true;

        let uploadedImagePath = "";
        const isEditing = Boolean(editingInvoiceId);
        const existingInv = isEditing ? invoices.find(i => i._id === editingInvoiceId) : null;

        if (imageFile) {
            const arrayBuffer = await imageFile.arrayBuffer();
            uploadedImagePath = await window.electronAPI.uploadFile({
                arrayBuffer,
                name: imageFile.name
            }, "invoices/images");
        } else if (existingInv) {
            uploadedImagePath = existingInv.image || "";
        }

        // Generate clean reasonable invoice number
        let invoiceNumber = "";
        if (isEditing) {
            invoiceNumber = existingInv.invoiceNumber || getInvoiceDisplayNumber(existingInv);
        } else {
            try {
                const seqNum = await window.electronAPI.getNextProductsPurchaseInvoiceNumber();
                invoiceNumber = `PUR-${String(seqNum || 1).padStart(4, "0")}`;
            } catch {
                invoiceNumber = `PUR-${String(invoices.length + 1).padStart(4, "0")}`;
            }
        }

        const isPaid = (paymentMethod === "cash");

        const invoicePayload = {
            invoiceNumber,
            supplierId: supplier._id,
            supplierName: supplier.name,
            supplierPhone: supplier.phone,
            createdByName,
            createdByPhone,
            date: invoiceDate,
            paymentMethod,
            installmentCount: paymentMethod === "installment" ? installmentCount : undefined,
            creditDueDate: paymentMethod === "credit" ? creditDueDate : undefined,
            isPaid,
            totalAmount,
            notes,
            image: uploadedImagePath,
            items: items
        };

        // If Cash: log Treasury Expense
        if (totalAmount > 0 && paymentMethod === "cash") {
            try {
                const settings = await window.electronAPI.getSettings();
                const currentUser = settings?.currentUser || createdByName || "مسؤول النظام";
                const desc = `مصروفات - فاتورة شراء منتجات رقم ${invoiceNumber} (cash)`;

                const existingTransactions = await window.electronAPI.getTreasuryTransactions();
                const alreadyLogged = existingTransactions.some(t => t.description === desc);
                if (!alreadyLogged) {
                    await window.electronAPI.addTreasuryTransaction({
                        date: new Date().toISOString(),
                        type: "expense",
                        amount: totalAmount,
                        description: desc,
                        user: currentUser
                    });
                }
            } catch (treasuryErr) {
                console.warn("Treasury logging notice:", treasuryErr);
            }
        }

        // Inventory Stock Update
        if (isEditing) {
            for (const oldItem of existingInv.items || []) {
                const prod = products.find(p => p._id === oldItem.productId);
                if (prod) {
                    const newQty = (prod.quantity || 0) - oldItem.quantity;
                    await window.electronAPI.updateProduct(oldItem.productId, { ...prod, quantity: newQty });
                    prod.quantity = newQty;
                }
            }
        }

        for (const newItem of items) {
            const prod = products.find(p => p._id === newItem.productId);
            if (prod) {
                const newQty = (prod.quantity || 0) + newItem.quantity;
                await window.electronAPI.updateProduct(newItem.productId, { ...prod, quantity: newQty });
                prod.quantity = newQty;
            }
        }

        // Installments & Supplier Due Debt Handling
        let newDueAmount = supplier.dueAmount || 0;

        if (isEditing) {
            const oldInstallments = await window.electronAPI.getInstallments(supplier._id);
            const invInstallments = oldInstallments.filter(inst => inst.invoiceId === editingInvoiceId || inst.invoiceId === invoiceNumber);
            for (const inst of invInstallments) {
                await window.electronAPI.deleteInstallment(inst._id);
            }
            if (existingInv.paymentMethod === "installment" || (existingInv.paymentMethod === "credit" && !existingInv.isPaid)) {
                newDueAmount = Math.max(0, newDueAmount - (existingInv.totalAmount || 0));
            }
        }

        if (paymentMethod === "installment") {
            const perInstallment = totalAmount / installmentCount;
            newDueAmount += totalAmount;

            const customDueDates = getCustomInstallmentDates();
            const dueDates = customDueDates.length === installmentCount ? customDueDates : [];

            if (dueDates.length === 0) {
                const baseD = new Date(invoiceDate);
                for (let i = 0; i < installmentCount; i++) {
                    baseD.setMonth(baseD.getMonth() + 1);
                    dueDates.push(baseD.toISOString().split("T")[0]);
                }
            }

            for (let i = 0; i < installmentCount; i++) {
                await window.electronAPI.addInstallment({
                    supplierId: supplier._id,
                    amount: perInstallment,
                    dueDate: dueDates[i],
                    invoiceId: invoiceNumber,
                    status: "pending"
                });
            }
        } else if (paymentMethod === "credit") {
            newDueAmount += totalAmount;
        }

        if (paymentMethod !== "cash") {
            await window.electronAPI.updateSupplier(supplier._id, { dueAmount: newDueAmount });
            supplier.dueAmount = newDueAmount;
        }

        // Save to Database
        if (isEditing) {
            await window.electronAPI.updateProductsPurchaseInvoice(editingInvoiceId, invoicePayload);
            showSuccess("تم تحديث فاتورة الشراء بنجاح");
        } else {
            await window.electronAPI.addProductsPurchaseInvoice(invoicePayload);
            showSuccess("تم إضافة فاتورة الشراء بنجاح وتحديث المخزون");
        }

        closeInvoiceModal();
        await loadInvoices();
        await loadSuppliers();
        await loadProducts();

    } catch (err) {
        showError("فشل في حفظ الفاتورة", err.message || "حدث خطأ غير متوقع");
    } finally {
        showLoading(false);
        if (els.saveInvoiceBtn) els.saveInvoiceBtn.disabled = false;
    }
}

async function confirmDeleteInvoice(invoiceId) {
    const inv = invoices.find(i => i._id === invoiceId);
    if (!inv) return;

    const invNum = getInvoiceDisplayNumber(inv);
    const result = await Swal.fire({
        title: "هل أنت متأكد؟",
        text: `سيتم حذف فاتورة الشراء #${invNum} وإعادة ضبط المخزون!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم، احذفها!",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
    });

    if (result.isConfirmed) {
        try {
            showLoading(true);

            for (const item of inv.items || []) {
                const prod = products.find(p => p._id === item.productId);
                if (prod) {
                    const newQty = Math.max(0, (prod.quantity || 0) - item.quantity);
                    await window.electronAPI.updateProduct(item.productId, { ...prod, quantity: newQty });
                    prod.quantity = newQty;
                }
            }

            const supplier = suppliers.find(s => s._id === inv.supplierId || s.name === inv.supplierName);
            if (supplier) {
                if (inv.paymentMethod === "installment") {
                    const allInst = await window.electronAPI.getInstallments(supplier._id);
                    const matchedInst = allInst.filter(inst => inst.invoiceId === invoiceId || inst.invoiceId === inv.invoiceNumber || inst.invoiceId === invNum);
                    for (const inst of matchedInst) {
                        await window.electronAPI.deleteInstallment(inst._id);
                    }
                    supplier.dueAmount = Math.max(0, (supplier.dueAmount || 0) - inv.totalAmount);
                    await window.electronAPI.updateSupplier(supplier._id, { dueAmount: supplier.dueAmount });
                } else if (inv.paymentMethod === "credit") {
                    supplier.dueAmount = Math.max(0, (supplier.dueAmount || 0) - inv.totalAmount);
                    await window.electronAPI.updateSupplier(supplier._id, { dueAmount: supplier.dueAmount });
                }
            }

            await window.electronAPI.deleteProductsPurchaseInvoice(invoiceId);
            showSuccess("تم حذف الفاتورة بنجاح");
            await loadInvoices();
            await loadSuppliers();
            await loadProducts();

        } catch (err) {
            showError("فشل في حذف الفاتورة", err.message);
        } finally {
            showLoading(false);
        }
    }
}

/* ==========================================================================
   Print Purchase Invoice (Compact 72mm Thermal POS Format)
   ========================================================================== */
async function printPurchaseInvoice(invoiceId) {
    const inv = invoices.find(i => i._id === invoiceId);
    if (!inv) {
        showError("خطأ", "الفاتورة غير موجودة");
        return;
    }

    try {
        const settings = await window.electronAPI.getSettings();
        const storeName = settings?.storeName || "اسم المحل";
        const storeLocation = settings?.storeLocation || "";
        const storePhones = settings?.phoneNumbers?.join(" - ") || "";
        const logo = settings?.logo || "";
        const invNum = getInvoiceDisplayNumber(inv);

        const paymentMap = { cash: "كاش", credit: "آجل", installment: "تقسيط" };
        const paymentMethodArabic = paymentMap[inv.paymentMethod] || inv.paymentMethod || "كاش";

        const formattedDate = new Date(inv.date || inv.createdAt || Date.now()).toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const items = Array.isArray(inv.items) ? inv.items : [];

        const receiptHtml = `<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>@page{margin:0;size:auto;}body{font-family:'Tajawal',sans-serif;margin:0 auto;padding:4px;text-align:center;font-size:11px;width:72mm;max-width:72mm;box-sizing:border-box;color:#000;border:1px solid #000;border-radius:5px;background:#fff;direction:rtl;}.header img{max-width:40px;max-height:40px;margin:0 auto 3px;border:1px solid #000;border-radius:50%;object-fit:cover;display:block;}.header h1{font-size:12px;margin:3px 0;font-weight:bold;}.header p,.info-section p{margin:1px 0;font-size:9px;}.divider{margin:3px 0;font-size:7px;color:#555;letter-spacing:-1px;overflow:hidden;white-space:nowrap;}.info-section{margin-bottom:3px;text-align:right;font-size:9px;}.info-row{display:flex;justify-content:space-between;margin:1px 0;font-size:9px;}table{width:100%;margin:5px 0;font-size:9px;border-collapse:collapse;}th,td{border:1px solid #000;padding:3px 2px;text-align:center;}th{background-color:#f0f0f0;font-weight:bold;}.totals{margin-top:2px;font-size:9px;text-align:right;}.totals p{margin:2px 0;}.grand-total{font-weight:bold;font-size:11px;border:1px solid #000;border-radius:5px;padding:3px;margin-top:3px;display:flex;justify-content:center;align-items:center;background:#f9f9f9;}.footer{margin-top:3px;font-size:8px;}</style></head><body><div class="header">${logo ? `<img src="${logo}" alt="Logo">` : ""}<h1>${escapeHTML(storeName)}</h1>${storeLocation ? `<p>${escapeHTML(storeLocation)}</p>` : ""}${storePhones ? `<p>${escapeHTML(storePhones)}</p>` : ""}<p class="divider">------------------------------------------------------------------------</p><p>فاتورة شراء منتجات #${escapeHTML(invNum)}</p><p>التاريخ: ${formattedDate}</p></div><p class="divider">-------------------------------------------------------------------------</p><div class="info-section"><div class="info-row"><span><strong>المورد:</strong> ${escapeHTML(inv.supplierName || "غير محدد")}</span>${inv.supplierPhone ? `<span><strong>هاتف:</strong> ${escapeHTML(inv.supplierPhone)}</span>` : ""}</div><div class="info-row"><span><strong>المسؤول:</strong> ${escapeHTML(inv.createdByName || "غير محدد")}</span>${inv.createdByPhone ? `<span><strong>هاتف:</strong> ${escapeHTML(inv.createdByPhone)}</span>` : ""}</div><div class="info-row"><span><strong>طريقة الدفع:</strong> ${escapeHTML(paymentMethodArabic)}</span>${inv.paymentMethod === 'credit' && inv.creditDueDate ? `<span><strong>استحقاق:</strong> ${formatDate(inv.creditDueDate)}</span>` : ''}${inv.paymentMethod === 'installment' && inv.installmentCount ? `<span><strong>أقساط:</strong> ${inv.installmentCount} شهرية</span>` : ''}</div></div><table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${items.map(it => `<tr><td style="text-align:right;">${escapeHTML(it.productName)}</td><td>${it.quantity}</td><td>${(it.price || 0).toFixed(2)}</td><td style="font-weight:bold;">${((it.quantity || 1) * (it.price || 0)).toFixed(2)}</td></tr>`).join("")}</tbody></table><div class="totals"><p class="grand-total">الإجمالي النهائي: ${(Number(inv.totalAmount) || 0).toFixed(2)} ج.م</p>${inv.notes ? `<p><strong>ملاحظات:</strong> ${escapeHTML(inv.notes)}</p>` : ""}</div><div class="footer"><p class="divider">-----------------------------------------------------------------------------------</p><p>نظام Managely لإدارة فواتير الشراء</p></div></body></html>`;

        const printResult = await window.electronAPI.printInvoiceToPOS(receiptHtml, invNum, "mini");
        if (printResult && printResult.success) {
            showSuccess("تم إرسال الفاتورة للطباعة الحرارية بنجاح.");
        } else {
            const pdfPath = await window.electronAPI.printInvoiceToPDF(receiptHtml, invNum, "mini");
            showSuccess(pdfPath ? `تم تصدير الفاتورة بنجاح كملف PDF في:\n${pdfPath}` : "تم تصدير الفاتورة كملف PDF بنجاح.");
        }
    } catch (e) {
        showError("خطأ أثناء الطباعة", e.message);
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
    initSupplierSearch();
    initProductSearch();

    if (els.form) {
        els.form.addEventListener("submit", (e) => {
            e.preventDefault();
            saveInvoice();
        });
    }

    if (els.invoiceDate) {
        els.invoiceDate.addEventListener("change", () => {
            const currentMethod = els.paymentMethodHidden?.value || els.paymentMethodSelect?.value || "cash";
            if (currentMethod === "installment") {
                generateInstallmentDates();
            } else if (currentMethod === "credit" && els.creditDueDate) {
                const baseDateStr = els.invoiceDate.value || new Date().toISOString().split("T")[0];
                const d = new Date(baseDateStr);
                d.setDate(d.getDate() + 30);
                els.creditDueDate.value = d.toISOString().split("T")[0];
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && els.modal && els.modal.classList.contains("open")) {
            closeInvoiceModal();
        }
    });

    await Promise.all([
        loadSuppliers(),
        loadProducts(),
        loadInvoices()
    ]);
});

// Window globals for inline HTML event handlers
window.openAddInvoiceModal = openAddInvoiceModal;
window.openEditInvoiceModal = openEditInvoiceModal;
window.closeInvoiceModal = closeInvoiceModal;
window.handleModalOverlayClick = handleModalOverlayClick;
window.handleInvoicesSearch = handleInvoicesSearch;
window.clearInvoicesSearch = clearInvoicesSearch;
window.selectSupplier = selectSupplier;
window.selectProduct = selectProduct;
window.showProductSuggestions = showProductSuggestions;
window.handlePaymentMethodChange = handlePaymentMethodChange;
window.generateInstallmentDates = generateInstallmentDates;
window.addItemToInvoice = addItemToInvoice;
window.removeItemFromInvoice = removeItemFromInvoice;
window.handleInvoiceImageChange = handleInvoiceImageChange;
window.removeInvoiceImage = removeInvoiceImage;
window.previewInvoiceAttachment = previewInvoiceAttachment;
window.viewFullInvoiceDetails = viewFullInvoiceDetails;
window.printPurchaseInvoice = printPurchaseInvoice;
window.confirmDeleteInvoice = confirmDeleteInvoice;