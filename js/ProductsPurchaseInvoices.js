let invoices = [], products = [], items = [], heldInvoices = [], suppliers = []; 
const els = { 
    list: document.getElementById("invoicesList"), 
    content: document.getElementById("pageContent"), 
    loading: document.getElementById("loadingScreen"), 
    form: document.getElementById("invoiceForm"), 
    formTitle: document.getElementById("formTitle"), 
    editingInvoiceId: document.getElementById("editingInvoiceId"), 
    supplierSearch: document.getElementById("supplierSearch"), 
    supplierName: document.getElementById("supplierName"), 
    supplierPhone: document.getElementById("supplierPhone"), 
    createdByName: document.getElementById("createdByName"), 
    createdByPhone: document.getElementById("createdByPhone"), 
    invoiceDate: document.getElementById("invoiceDate"), 
    productSelect: document.getElementById("productSelect"), 
    quantity: document.getElementById("quantity"), 
    itemsList: document.getElementById("itemsList"), 
    totalAmount: document.getElementById("totalAmount"), 
    notes: document.getElementById("notes"), 
    invoiceImage: document.getElementById("invoiceImage"), 
    imagePreview: document.getElementById("imagePreview"), 
    imagePreviewImg: document.getElementById("imagePreviewImg"), 
    paymentMethod: document.getElementById("paymentMethod"), 
    paymentLabel: document.getElementById("paymentLabel"), 
    installmentCount: document.getElementById("installmentCount"), 
    paymentDisplay: document.getElementById("paymentDisplay"), 
    invoicesSearch: document.getElementById("invoicesSearch"),
    installmentDatesContainer: document.getElementById("installmentDatesContainer"),
    installmentDates: document.getElementById("installmentDates")
};
async function loadSuppliers() { try { showLoading(!0), suppliers = await window.electronAPI.getSuppliers(), renderSupplierDatalist(suppliers) } catch (e) { showError("فشل في تحميل قائمة الموردين", e.message) } finally { showLoading(!1) } } function renderFilteredInvoices(e = invoices) { if (!els.list) return; if (!e.length) return void (els.list.innerHTML = '\n            <div class="col-span-full text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">\n                <div class="flex flex-col items-center gap-4">\n                    <i class="fas fa-file-invoice text-6xl text-primary"></i>\n                    <div class="space-y-2">\n                        <h3 class="text-2xl font-bold text-primary">لا يوجد فواتير</h3>\n                        <p class="text-gray-500">لا توجد نتائج مطابقة للبحث</p>\n                    </div>\n                </div>\n            </div>\n        '); const n = e.map((async e => { let n = "", t = !1; return e.image && (n = await getFileAsDataURL(e.image), n || (t = !0)), `\n        <div class="invoice-table-container">\n            <table class="invoice-table">\n                <thead>\n                    <tr>\n                        <th width="20%">المورد</th>\n                        <th width="15%">التاريخ</th>\n                        <th width="15%">رقم الجوال</th>\n                        <th width="15%">المنتجات</th>\n                        <th width="15%">المجموع</th>\n                        <th width="15%">ملاحظات</th>\n                        <th width="20%">الإجراءات</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    <tr class="invoice-row">\n                        <td class="supplier-info">\n                            <div class="supplier-name">\n                                <i class="fas fa-store-alt"></i>\n                                ${e.supplierName || "فاتورة بدون اسم"}\n                            </div>\n                            ${e.supplierPhone ? `\n                                <div class="created-by">\n                                    <i class="fas fa-user-edit"></i>\n                                    ${e.supplierPhone}\n                                </div>\n                                ` : ""}\n                        </td>\n                        \n                        <td class="invoice-date">\n                            <div class="date-badge">\n                                <i class="far fa-calendar-alt"></i>\n                                ${formatDate(e.date)}\n                            </div>\n                        </td>\n                        \n                        <td class="supplier-phone">\n                            ${e.createdByPhone ? `\n                                <a href="tel:${e.createdByPhone}" class="phone-link">\n                                    <i class="fas fa-phone-alt"></i>\n                                    ${e.createdByPhone}\n                                </a>\n                                ` : '<span class="text-muted">غير متوفر</span>'}\n                        </td>\n                        \n                        <td class="products-count">\n                            <div class="products-badge">\n                                <i class="fas fa-boxes"></i>\n                                ${e.items.length} منتج\n                            </div>\n                            <div class="top-product">\n                                ${e.items[0]?.productName || ""}\n                                ${e.items.length > 1 ? "+" + (e.items.length - 1) : ""}\n                            </div>\n                        </td>\n                        \n                        <td class="total-amount text-primary">\n                            <div class="amount">\n                                ${e.totalAmount ? e.totalAmount.toFixed(2) + " ج.م" : "--"}\n                            </div>\n                        </td>\n                        <td class="notes-preview">\n                            <div class="notes-badge">\n                                <i class="fas fa-sticky-note"></i>\n                                ${e.notes || ""}\n                            </div>\n                        </td>\n\n                        <td class="actions">\n                            <div class="action-buttons">\n                                <button onclick="openEditInvoiceModal('${e._id}')" class="btn-edit" title="تعديل">\n                                    <i class="fas fa-edit"></i>\n                                </button>\n                                <button onclick="printPurchaseInvoice('${e._id}')" class="btn-print" title="طباعة">\n                                    <i class="fas fa-print"></i>\n                                </button>\n                                <button onclick="confirmDeleteInvoice('${e._id}')" class="btn-delete" title="حذف">\n                                    <i class="fas fa-trash"></i>\n                                </button>\n                            </div>\n                            ${e.image ? `\n                                <div class="image-preview" onclick="${n ? `showFileInNewWindow('${n}')` : "Swal.fire({title: 'خطأ', text: 'الصورة غير متوفرة', icon: 'error', confirmButtonColor: '#EF4444'})"}">\n                                    <i class="fas fa-image"></i> ${t ? "الصورة غير متوفرة" : "صورة الفاتورة"}\n                                </div>\n                                ` : ""}\n                        </td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n        ` })); Promise.all(n).then((e => { els.list.innerHTML = e.join("") })) } function renderSupplierDatalist(e = suppliers) { document.getElementById("supplierList").innerHTML = e.map((e => `\n        <option value="${e.name} (${e.phone})" data-name="${e.name}" data-phone="${e.phone}" data-id="${e._id}">\n    `)).join("") } async function loadProducts() { try { showLoading(!0), products = await window.electronAPI.getProducts(), renderProductSelect() } catch (e) { showError("فشل في تحميل المنتجات", e.message) } finally { showLoading(!1) } } function renderProductSelect() { els.productSelect.innerHTML = '<option value="">اختر منتجًا</option>' + products.map((e => `<option value="${e._id}" data-price="${e.purchasePrice || e.price || 0}">${e.name}</option>`)).join("") } async function loadInvoices() { try { showLoading(!0), invoices = await window.electronAPI.getProductsPurchaseInvoices(), renderFilteredInvoices() } catch (e) { showError("فشل في تحميل الفواتير", e.message) } finally { showLoading(!1) } } async function getFileAsDataURL(e) { try { if (!e || "" === e) return ""; let n = e; n = n.replace(/C:\\Users\\[^\\]+\\AppData\\Roaming\\cashier-system\\/gi, ""), n = n.replace(/C:\\Users\\[^\\]+\\OneDrive\\Documents\\/gi, ""); const t = n.split("/").pop(), i = n.substring(0, n.lastIndexOf("/")); n = `${i}/${t}`.replace(/\/+/g, "/"); try { return await window.electronAPI.readFileAsDataURL(n) || "" } catch (e) { return "" } } catch (e) { return "" } } async function renderInvoices() { if (!els.list) return; if (!invoices.length) return void (els.list.innerHTML = '\n            <div class="col-span-full text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-100">\n                <div class="flex flex-col items-center gap-4">\n                    <i class="fas fa-file-invoice text-6xl text-primary"></i>\n                    <div class="space-y-2">\n                        <h3 class="text-2xl font-bold text-primary">لا يوجد فواتير</h3>\n                        <p class="text-gray-500">إبدأ بإضافة فاتورة جديدة الآن</p>\n                    </div>\n                </div>\n            </div>\n        '); const e = await Promise.all(invoices.map((async e => { let n = "", t = !1; return e.image && (n = await getFileAsDataURL(e.image), n || (t = !0)), `\n        <div class="invoice-table-container">\n            <table class="invoice-table">\n                <thead>\n                    <tr>\n                        <th width="20%">المورد</th>\n                        <th width="15%">التاريخ</th>\n                        <th width="15%">رقم الجوال</th>\n                        <th width="15%">المنتجات</th>\n                        <th width="15%">المجموع</th>\n                        <th width="15%">ملاحظات</th>\n                        <th width="20%">الإجراءات</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    <tr class="invoice-row">\n                        <td class="supplier-info">\n                            <div class="supplier-name">\n                                <i class="fas fa-store-alt"></i>\n                                ${e.supplierName || "فاتورة بدون اسم"}\n                            </div>\n                            ${e.supplierPhone ? `\n                                <div class="created-by">\n                                    <i class="fas fa-user-edit"></i>\n                                    ${e.supplierPhone}\n                                </div>\n                                ` : ""}\n                        </td>\n                        \n                        <td class="invoice-date">\n                            <div class="date-badge">\n                                <i class="far fa-calendar-alt"></i>\n                                ${formatDate(e.date)}\n                            </div>\n                        </td>\n                        \n                        <td class="supplier-phone">\n                            ${e.createdByPhone ? `\n                                <a href="tel:${e.createdByPhone}" class="phone-link">\n                                    <i class="fas fa-phone-alt"></i>\n                                    ${e.createdByPhone}\n                                </a>\n                                ` : '<span class="text-muted">غير متوفر</span>'}\n                        </td>\n                        \n                        <td class="products-count">\n                            <div class="products-badge">\n                                <i class="fas fa-boxes"></i>\n                                ${e.items.length} منتج\n                            </div>\n                            <div class="top-product">\n                                ${e.items[0]?.productName || ""}\n                                ${e.items.length > 1 ? "+" + (e.items.length - 1) : ""}\n                            </div>\n                        </td>\n                        \n                        <td class="total-amount text-primary">\n                            <div class="amount">\n                                ${e.totalAmount ? e.totalAmount.toFixed(2) + " ج.م" : "--"}\n                            </div>\n                        </td>\n                        <td class="notes-preview">\n                            <div class="notes-badge">\n                                <i class="fas fa-sticky-note"></i>\n                                ${e.notes || ""}\n                            </div>\n                        </td>\n\n                        <td class="actions">\n                            <div class="action-buttons">\n                                <button onclick="openEditInvoiceModal('${e._id}')" class="btn-edit" title="تعديل">\n                                    <i class="fas fa-edit"></i>\n                                </button>\n                                <button onclick="printPurchaseInvoice('${e._id}')" class="btn-print" title="طباعة">\n                                    <i class="fas fa-print"></i>\n                                </button>\n                                <button onclick="confirmDeleteInvoice('${e._id}')" class="btn-delete" title="حذف">\n                                    <i class="fas fa-trash"></i>\n                                </button>\n                            </div>\n                            ${e.image ? `\n                                <div class="image-preview" onclick="${n ? `showFileInNewWindow('${n}')` : "Swal.fire({title: 'خطأ', text: 'الصورة غير متوفرة', icon: 'error', confirmButtonColor: '#EF4444'})"}">\n                                    <i class="fas fa-image"></i> ${t ? "الصورة غير متوفرة" : "صورة الفاتورة"}\n                                </div>\n                                ` : ""}\n                        </td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n        ` }))); els.list.innerHTML = e.join("") } async function printPurchaseInvoice(e) {
    const n = invoices.find((n => n._id === e));
    if (!n) return void showError("خطأ", "فاتورة غير موجودة");
    const t = await window.electronAPI.getSettings(), i = t?.storeName || "المتجر", a = t?.logo || "", s = (n.image && await getFileAsDataURL(n.image), `
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>فاتورة شراء - ${n.supplierName || "غير محدد"}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Tajawal', sans-serif;
                line-height: 1.3;
            }
            
            body {
                width: 80mm;
                padding: 0;
                margin: 0;
                color: #000;
                background: white;
                font-size: 14px;
                position: relative;
            }
            
            .receipt {
                width: 100%;
                max-width: 80mm;
                padding: 10px 15px;
                border: 1px solid #ccc;
                border-radius: 5px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                position:absolute;
                top: 20%;
                left: -40%;
                transform: translate(-50%, -50%);
            }
            
            .header {
                text-align: center;
                margin-bottom: 10px;
                padding-bottom: 8px;
                border-bottom: 2px dashed #ccc;
            }
            
            .logo {
                max-width: 50%;
                max-height: 50px;
                border: 1px solid #ccc;
                border-radius: 5px;
                padding: 5px;
                margin: 0 auto;
            }
            
            .title {
                font-weight: 700;
                font-size: 18px;
                margin: 5px 0;
                color: #333;
            }
            
            .subtitle {
                font-size: 14px;
                color: #555;
                margin-bottom: 5px;
            }
            
            .date-time {
                font-size: 12px;
                color: #666;
                margin-bottom: 5px;
            }
            
            .info-section {
                margin: 8px 0;
                padding: 5px 0;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
                font-size: 13px;
            }
            
            .info-label {
                font-weight: 600;
                color: #444;
                min-width: 40%;\n            }\n            \n            .info-value {\n                font-weight: 500;\n                color: #222;\n                text-align: left;\n                direction: ltr;\n            }\n            \n            .divider {\n                border-top: 1px dashed #aaa;\n                margin: 8px 0;\n            }\n            \n            .items-table {\n                width: 100%;\n                border-collapse: collapse;\n                margin: 10px 0;\n            }\n            \n            .items-table th {\n                font-weight: 700;\n                font-size: 13px;\n                padding: 5px 3px;\n                border-bottom: 1px solid #ddd;\n                text-align: right;\n            }\n            \n            .items-table td {\n                padding: 4px 3px;\n                font-size: 12px;\n                border-bottom: 1px dotted #eee;\n                text-align: right;\n            }\n            \n            .total-row {\n                font-weight: 700;\n                font-size: 15px;\n                margin-top: 10px;\n                padding-top: 8px;\n                border-top: 2px dashed #ccc;\n                display: flex;\n                justify-content: space-between;\n            }\n            \n            .notes {\n                margin: 10px 0;\n                padding: 8px;\n                background: #f5f5f5;\n                border-radius: 4px;\n                font-size: 12px;\n                border-right: 3px solid #ddd;\n            }\n            \n            .footer {\n                text-align: center;\n                margin-top: 15px;\n                padding-top: 8px;\n                border-top: 2px dashed #ccc;\n                font-size: 11px;\n                color: #777;\n            }\n            \n            .barcode {\n                text-align: center;\n                margin: 10px 0;\n                padding: 5px;\n            }\n            \n            @media print {\n                body {\n                    width: 80mm !important;\n                    margin: 0 !important;\n                    padding: 0 !important;\n                }\n                .no-print {\n                    display: none !important;\n                }\n                .receipt {\n                    padding: 5px 10px !important;\n                }\n            }\n        </style>\n    </head>\n    <body>\n        <div class="receipt">\n            <div class="header">\n                ${a ? `<img src="${a}" alt="Store Logo" class="logo">` : ""}\n                <div class="title">${i}</div>\n                <div class="subtitle">فاتورة شراء - ${n.supplierName || "غير محدد"}</div>\n                <div class="date-time">${formatDate(n.date)}</div>\n            </div>\n            \n            <div class="info-section">\n                <div class="info-row">\n                    <span class="info-label">اسم المورد:</span>\n                    <span class="info-value">${n.supplierName || "--"}</span>\n                </div>\n                <div class="info-row">\n                    <span class="info-label">رقم المورد:</span>\n                    <span class="info-value">${n.supplierPhone || "--"}</span>\n                </div>\n                <div class="info-row">\n                    <span class="info-label">مسئول الإدخال:</span>\n                    <span class="info-value">${n.createdByName || "--"} (${n.createdByPhone || "--"})</span>\n                </div>\n            </div>\n            \n            <div class="divider"></div>\n            \n            <table class="items-table">\n                <thead>\n                    <tr>\n                        <th width="50%">المنتج</th>\n                        <th width="20%">الكمية</th>\n                        <th width="30%">السعر</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    ${n.items.map((e => `\n                            <tr>\n                                <td>${e.productName}</td>\n                                <td>${e.quantity} ${e.unit || "وحدة"}</td>\n                                <td>${e.price ? e.price.toFixed(2) : "0.00"} ج.م</td>\n                            </tr>\n                        `)).join("")}\n                </tbody>\n            </table>\n            \n            <div class="total-row">\n                <span>المجموع الكلي:</span>\n                <span>${n.totalAmount ? n.totalAmount.toFixed(2) : "0.00"} ج.م</span>\n            </div>\n            \n            ${n.notes ? `\n                <div class="notes">\n                    <strong>ملاحظات:</strong> ${n.notes}\n                </div>\n            ` : ""}\n            \n            <div class="footer">\n                <div>${(new Date).getFullYear()} © نظام إدارة المشتريات</div>\n                <div class="barcode">\n                    * ${n.invoiceNumber || n._id.slice(-6)} *\n                    <div class="title">${i}</div>\n                </div>\n            </div>\n        </div>\n    </body>\n    </html>\n    `);
    try {
        const r = await window.electronAPI.printInvoiceToPOS(s, n._id, "purchase");
        if (r && r.success) {
            showSuccess("تمت الطباعة بنجاح على الطابعة الافتراضية أو الحرارية.");
        } else {
            const pdfPath = await window.electronAPI.printPurchaseInvoice(s, n._id, "purchase");
            showSuccess(`تم حفظ الفاتورة كملف PDF في: ${pdfPath}`);
        }
    } catch (e) {
        showError("خطأ أثناء الطباعة أو التصدير", e.message);
    }
} function showFileInNewWindow(e) { const n = window.open("", "_blank"); n ? n.document.write(`\n        <!DOCTYPE html>\n        <html>\n        <head>\n            <title>عرض صورة الفاتورة</title>\n            <style>\n                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; }\n                img { max-width: 100%; max-height: 100%; }\n                .toolbar { position: fixed; top: 0; width: 100%; background: #f8f9fa; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; }\n                .close-btn { background: #dc3545; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; }\n            </style>\n        </head>\n        <body>\n            <div class="toolbar">\n                <button class="close-btn" onclick="window.close()"><i class="fas fa-times"></i> إغلاق</button>\n            </div>\n            <img src="${e}" alt="صورة الفاتورة">\n            <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js"><\/script>\n        </body>\n        </html>\n    `) : alert("يرجى السماح بفتح النوافذ المنبثقة لهذا الموقع.") } function formatDate(e) { return new Date(e).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) } 

function calculateTotalAmount() { 
    const e = items.reduce(((e, n) => e + n.quantity * n.price), 0); 
    return els.totalAmount.value = e.toFixed(2), e 
} 

// تعريف الدالة في النطاق العام
window.addItem = function() { 
    const productId = els.productSelect.value;
    const quantity = parseInt(els.quantity.value);
    const selectedOption = els.productSelect.options[els.productSelect.selectedIndex];
    const price = parseFloat(selectedOption.dataset.price) || 0;
    
    
    
    if (!productId) {
        showError("خطأ", "يرجى اختيار منتج");
        return;
    }
    
    if (!quantity || quantity <= 0) {
        showError("خطأ", "يرجى إدخال كمية صحيحة");
        return;
    }
    
    if (!price || price <= 0) {
        showError("خطأ", "السعر غير صحيح");
        return;
    }
    
    const product = products.find(p => p._id === productId);
    if (!product) {
        showError("خطأ", "المنتج غير موجود");
        return;
    }
    
    // إضافة المنتج للقائمة
    items.push({
        productId: productId,
        productName: product.name,
        quantity: quantity,
        price: price,
        unit: product.unit || "وحدة"
    });
    
    // تحديث الواجهة
    renderItemsList();
    calculateTotalAmount();
    
    // مسح الحقول
    els.productSelect.value = "";
    els.quantity.value = "";
    
    showSuccess("تم إضافة المنتج بنجاح");
} 

function renderItemsList() { 
    els.itemsList.innerHTML = items.map(((e, n) => `\n        <li class="flex justify-between items-center text-gray-800" data-item="${e.productId},${e.quantity}">\n            ${e.productName} - الكمية: ${e.quantity} - السعر: ${e.price.toFixed(2)} ج.م\n            <button type="button" class="text-red-500" onclick="removeItem(${n})">حذف</button>\n        </li>\n    `)).join("") 
} 

// تعريف دالة حذف المنتج في النطاق العام
window.removeItem = function(e) { 
    items.splice(e, 1); 
    renderItemsList(); 
    calculateTotalAmount(); 
}; 

async function openEditInvoiceModal(e) { const n = invoices.find((n => n._id === e)); if (!n) return; els.editingInvoiceId.value = e, els.formTitle.textContent = "تعديل الفاتورة"; const t = suppliers.find((e => e._id === n.supplierId)); if (t && (els.supplierSearch.value = `${t.name} (${t.phone})`, els.supplierName.value = t.name, els.supplierPhone.value = t.phone, els.paymentMethod.value = t.paymentMethod || "cash", "installment" === t.paymentMethod ? (els.paymentLabel.innerHTML = '\n                <i class="fas fa-money-check-alt text-primary"></i>\n                عدد الدفعات\n            ', els.installmentCount.style.display = "block", els.paymentDisplay.style.display = "none", els.installmentCount.value = n.installmentCount || 3) : (els.paymentLabel.innerHTML = '\n                <i class="fas fa-money-check-alt text-primary"></i>\n                نوع الدفع\n            ', els.installmentCount.style.display = "none", els.paymentDisplay.style.display = "block", els.paymentDisplay.value = "cash" === t.paymentMethod ? "كاش" : "آجل")), els.createdByName.value = n.createdByName || "", els.createdByPhone.value = n.createdByPhone || "", els.invoiceDate.value = n.date.split("T")[0], items = [...n.items], renderItemsList(), calculateTotalAmount(), els.notes.value = n.notes || "", n.image) try { const e = await getFileAsDataURL(n.image); e ? (els.imagePreviewImg.src = e, els.imagePreview.classList.remove("hidden")) : (els.imagePreviewImg.src = "", els.imagePreview.classList.add("hidden"), showError("خطأ", "تعذر تحميل صورة الفاتورة")) } catch (e) { els.imagePreviewImg.src = "", els.imagePreview.classList.add("hidden"), showError("خطأ", "تعذر تحميل صورة الفاتورة: " + e.message) } else els.imagePreview.classList.add("hidden") } async function saveInvoice() { 
    const e = els.supplierName.value.trim(), 
          n = els.supplierPhone.value.trim(), 
          t = els.createdByName.value.trim(), 
          i = els.createdByPhone.value.trim(), 
          a = els.invoiceDate.value.trim(), 
          s = calculateTotalAmount(), 
          o = els.notes.value.trim(), 
          l = els.paymentMethod.value, 
          d = parseInt(els.installmentCount.value) || 3, 
          r = els.invoiceImage.files[0]; 

    let hasError = false;
    let firstInvalid = null;

    if (!els.supplierSearch.value.trim() || !e || !n) {
        if (typeof window.markFieldInvalid === "function") {
            window.markFieldInvalid(els.supplierSearch, "يرجى اختيار مورد من القائمة");
        }
        if (!firstInvalid) firstInvalid = els.supplierSearch;
        hasError = true;
    }

    if (!t) {
        if (typeof window.markFieldInvalid === "function") {
            window.markFieldInvalid(els.createdByName, "يرجى إدخال اسم منشئ الفاتورة");
        }
        if (!firstInvalid) firstInvalid = els.createdByName;
        hasError = true;
    }

    if (!i) {
        if (typeof window.markFieldInvalid === "function") {
            window.markFieldInvalid(els.createdByPhone, "يرجى إدخال رقم هاتف المنشئ");
        }
        if (!firstInvalid) firstInvalid = els.createdByPhone;
        hasError = true;
    }

    if (!a) {
        if (typeof window.markFieldInvalid === "function") {
            window.markFieldInvalid(els.invoiceDate, "يرجى تحديد تاريخ الفاتورة");
        }
        if (!firstInvalid) firstInvalid = els.invoiceDate;
        hasError = true;
    }

    if (items.length === 0) {
        if (typeof window.markFieldInvalid === "function") {
            window.markFieldInvalid(els.productSelect, "يرجى إضافة منتج واحد على الأقل للفاتورة");
        }
        if (!firstInvalid) firstInvalid = els.productSelect;
        hasError = true;
    }

    if (hasError) {
        if (firstInvalid) firstInvalid.focus();
        return void showError("بيانات غير مكتملة", "يرجى استكمال جميع الحقول المطلوبة باللون الأحمر.");
    }

    const c = suppliers.find((t => t.name === e && t.phone === n)); 
    if (!c) return void showError("خطأ", "المورد المحدد غير موجود بقاعدة البيانات."); 
    const p = c._id; 
    if (!p) return void showError("خطأ", "تعذر التعرف على المورد، يرجى إعادة اختياره."); 
    let u = ""; 
    const m = els.editingInvoiceId.value; 
    if (m && (u = invoices.find((e => e._id === m)).image || ""), r) try { 
        const e = "invoices/images"; 
        u = await window.electronAPI.uploadFile({ arrayBuffer: await r.arrayBuffer(), name: r.name }, e); 
        u = u.replace(/.*\\invoices\\images\\/i, "invoices/images/"); 
        u = u.replace(/\\/g, "/"); 
        Swal.fire({ title: `تم رفع الصورة بنجاح`, icon: "success", text: r.name, confirmButtonColor: "#3085d6", confirmButtonText: "موافق" }); 
    } catch (e) { 
        return void showError("خطأ في رفع الصورة", e.message); 
    } 
    const h = { supplierId: p, supplierName: e, supplierPhone: n, createdByName: t, createdByPhone: i, date: a, totalAmount: s, notes: o, image: u, items: items }; try { showLoading(!0); let e = c.dueAmount || 0; if (s > 0) { const e = (await window.electronAPI.getSettings())?.currentUser || "غير معروف", n = m ? invoices.find((e => e._id === m)).invoiceNumber : await window.electronAPI.getNextProductsPurchaseInvoiceNumber(), t = `مصروفات - فاتورة شراء منتجـات رقم ${n} (cash)`, i = await window.electronAPI.getTreasuryTransactions(); "cash" !== l || i.some((n => n.description === t && n.user === e)) || await window.electronAPI.addTreasuryTransaction({ date: (new Date).toISOString(), type: "expense", amount: s, description: t, user: e }) } if (m) { const e = invoices.find((e => e._id === m)), n = suppliers.find((n => n._id === e.supplierId)); for (const n of e.items) { const e = products.find((e => e._id === n.productId)); if (e) { const t = (e.quantity || 0) - n.quantity; await window.electronAPI.updateProduct(n.productId, { ...e, quantity: t }), e.quantity = t } } if (n && "installment" === n.paymentMethod) { const t = (await window.electronAPI.getInstallments(n._id)).filter((e => e.invoiceId === m)); for (const e of t) await window.electronAPI.deleteInstallment(e._id); const i = e.totalAmount; n.dueAmount -= i, await window.electronAPI.updateSupplier(n._id, { dueAmount: n.dueAmount }) } else n && "credit" === n.paymentMethod && (n.dueAmount -= e.totalAmount, await window.electronAPI.updateSupplier(n._id, { dueAmount: n.dueAmount })) } for (const e of items) { const n = products.find((n => n._id === e.productId)); if (n) { const t = (n.quantity || 0) + e.quantity; await window.electronAPI.updateProduct(e.productId, { ...n, quantity: t }), n.quantity = t } } if ("installment" === l) { 
    const n = s / d; 
    e = n * d; 
    
    // استخدام مواعيد الدفع المخصصة إذا كانت متوفرة
    const customDates = getCustomInstallmentDates();
    const dueDates = customDates.length === d ? customDates : [];
    
    if (dueDates.length === 0) {
        // إذا لم تكن هناك مواعيد مخصصة، استخدم المواعيد الافتراضية
        const t = new Date(a);
        for (let e = 0; e < d; e++) {
            t.setMonth(t.getMonth() + 1);
            dueDates.push(t.toISOString().split("T")[0]);
        }
    }
    
    for (let e = 0; e < d; e++) {
        await window.electronAPI.addInstallment({ 
            supplierId: p, 
            amount: n, 
            dueDate: dueDates[e], 
            invoiceId: m || await window.electronAPI.getNextProductsPurchaseInvoiceNumber() 
        });
    }
} else "credit" === l && (e += s); if (m) { await window.electronAPI.updateProductsPurchaseInvoice(m, { ...h, installmentCount: d }); showSuccess("تم تحديث الفاتورة بنجاح") } else { const e = await window.electronAPI.addProductsPurchaseInvoice({ ...h, installmentCount: d }); showSuccess("تم إضافة الفاتورة بنجاح وتحديث المخزون") } if ("cash" !== l) { await window.electronAPI.updateSupplier(p, { dueAmount: e }); const n = suppliers.findIndex((e => e._id === p)); -1 !== n && (suppliers[n].dueAmount = e) } resetForm(); await loadInvoices(); await loadSuppliers() } catch (e) { showError("فشل في حفظ الفاتورة", e.message) } finally { showLoading(!1) } } function resetForm() { els.form.reset(), els.formTitle.textContent = "إضافة فاتورة جديدة", els.editingInvoiceId.value = "", items = [], renderItemsList(), els.totalAmount.value = "", els.imagePreview.classList.add("hidden"), els.imagePreviewImg.src = "", els.paymentLabel.innerHTML = '\n        <i class="fas fa-money-check-alt text-primary"></i>\n        نوع الدفع\n    ', els.installmentCount.style.display = "none", els.paymentDisplay.style.display = "block", els.paymentDisplay.value = "كاش", els.installmentDatesContainer.style.display = "none" } function cancelEdit() { resetForm() } async function confirmDeleteInvoice(e) { if (await Swal.fire({ title: "هل أنت متأكد؟", text: "سيتم حذف الفاتورة نهائيًا!", icon: "warning", showCancelButton: !0, confirmButtonText: "نعم، احذفها!", cancelButtonText: "إلغاء", confirmButtonColor: "#EF4444", cancelButtonColor: "#6B7280", reverseButtons: !0 }).then((e => e.isConfirmed))) try { showLoading(!0); const n = invoices.find((n => n._id === e)), t = suppliers.find((e => e._id === n.supplierId)); for (const e of n.items) { const n = products.find((n => n._id === e.productId)); if (n) { const t = (n.quantity || 0) - e.quantity; await window.electronAPI.updateProduct(e.productId, { ...n, quantity: t }), n.quantity = t } } if (t && "installment" === t.paymentMethod) { const i = (await window.electronAPI.getInstallments(t._id)).filter((n => n.invoiceId === e)); for (const e of i) await window.electronAPI.deleteInstallment(e._id); t.dueAmount -= n.totalAmount, await window.electronAPI.updateSupplier(t._id, { dueAmount: t.dueAmount }) } else t && "credit" === t.paymentMethod && (t.dueAmount -= n.totalAmount, await window.electronAPI.updateSupplier(t._id, { dueAmount: t.dueAmount })); await window.electronAPI.deleteProductsPurchaseInvoice(e), invoices = invoices.filter((n => n._id !== e)), showSuccess("تم حذف الفاتورة بنجاح"), renderInvoices(), await loadSuppliers() } catch (e) { showError("فشل في حذف الفاتورة", e.message) } finally { showLoading(!1) } } function holdInvoice() { const e = { supplierName: els.supplierName.value, supplierPhone: els.supplierPhone.value, createdByName: els.createdByName.value, createdByPhone: els.createdByPhone.value, items: [...items], totalAmount: calculateTotalAmount(), invoiceDate: els.invoiceDate.value, notes: els.notes.value, image: els.imagePreviewImg.src }; e.supplierName && e.supplierPhone && e.createdByName && e.createdByPhone && e.totalAmount && e.invoiceDate ? (heldInvoices.push(e), showAlert("تم تعليق الفاتورة بنجاح", "success"), resetForm()) : showAlert("يرجى ملء جميع الحقول المطلوبة قبل تعليق الفاتورة", "error") } function showQuickSalesReport() { const e = (new Date).toISOString().split("T")[0], n = { totalInvoices: invoices.length, totalAmount: invoices.reduce(((e, n) => e + (n.totalAmount || 0)), 0) }; Swal.fire({ title: "تقرير المشتريات السريع", html: `\n            <p><strong>التاريخ:</strong> ${e}</p>\n            <p><strong>عدد الفواتير:</strong> ${n.totalInvoices}</p>\n            <p><strong>إجمالي المشتريات:</strong> ${n.totalAmount.toFixed(2)} جنيه</p>\n        `, icon: "info", confirmButtonText: "إغلاق" }) } function showAlert(e, n) { Swal.fire({ title: "success" === n ? "نجاح!" : "خطأ!", text: e, icon: n, confirmButtonColor: "success" === n ? "#34D399" : "#EF4444" }) } function showLoading(e) { e ? Swal.fire({ title: "جاري المعالجة...", allowOutsideClick: !1, didOpen: () => Swal.showLoading() }) : Swal.close() } function showSuccess(e) { Swal.fire({ title: "تم بنجاح!", text: e, icon: "success", confirmButtonColor: "#34D399" }) } function showError(e, n) { Swal.fire({ title: e, text: n, icon: "error", confirmButtonColor: "#EF4444" }) } function suggestSupplier(e) { document.getElementById("supplierNameList").innerHTML = e.map((e => `\n        <option value="${e.name}">\n    `)).join("") } function suggestSupplierPhone(e) { document.getElementById("supplierPhoneList").innerHTML = e.map((e => `\n        <option value="${e.phone}">\n    `)).join("") } document.addEventListener("DOMContentLoaded", (async () => { 
    await loadSuppliers(), loadProducts(), loadInvoices(), 
    els.form.addEventListener("submit", (async e => { e.preventDefault(), saveInvoice() })), 
    els.invoiceImage.addEventListener("change", (e => { 
        const n = e.target.files[0]; 
        if (n) { 
            const e = new FileReader; 
            e.onload = e => { els.imagePreviewImg.src = e.target.result, els.imagePreview.classList.remove("hidden") }, 
            e.readAsDataURL(n) 
        } else els.imagePreview.classList.add("hidden") 
    })), 
    els.supplierSearch.addEventListener("input", (() => { 
        const e = els.supplierSearch.value.toLowerCase(); 
        renderSupplierDatalist(suppliers.filter((n => n.name.toLowerCase().includes(e) || n.phone.includes(e)))) 
    })), 
    els.supplierSearch.addEventListener("change", (() => { 
        const e = els.supplierSearch.value, n = suppliers.find((n => `${n.name} (${n.phone})` === e)); 
        n ? (els.supplierName.value = n.name, els.supplierPhone.value = n.phone, els.paymentMethod.value = n.paymentMethod || "cash", "installment" === n.paymentMethod ? (els.paymentLabel.innerHTML = '\n                    <i class="fas fa-money-check-alt text-primary"></i>\n                    عدد الدفعات\n                ', els.installmentCount.style.display = "block", els.paymentDisplay.style.display = "none", els.installmentDatesContainer.style.display = "block", generateInstallmentDates()) : (els.paymentLabel.innerHTML = '\n                    <i class="fas fa-money-check-alt text-primary"></i>\n                    نوع الدفع\n                ', els.installmentCount.style.display = "none", els.paymentDisplay.style.display = "block", els.installmentDatesContainer.style.display = "none", els.paymentDisplay.value = "cash" === n.paymentMethod ? "كاش" : "آجل")) : (els.supplierName.value = "", els.supplierPhone.value = "", els.paymentMethod.value = "cash", els.paymentLabel.innerHTML = '\n                <i class="fas fa-money-check-alt text-primary"></i>\n                نوع الدفع\n            ', els.installmentCount.style.display = "none", els.paymentDisplay.style.display = "block", els.installmentDatesContainer.style.display = "none", els.paymentDisplay.value = "كاش") 
    })), 
    els.invoicesSearch.addEventListener("input", (() => { 
        const e = els.invoicesSearch.value.toLowerCase(); 
        renderFilteredInvoices(invoices.filter((n => n.supplierName?.toLowerCase().includes(e) || n.supplierPhone?.includes(e) || n.createdByName?.toLowerCase().includes(e) || n.totalAmount?.toString().includes(e)))) 
    })),
    
    // إضافة أحداث لتوليد مواعيد الدفع
    els.installmentCount.addEventListener("change", generateInstallmentDates),
    els.invoiceDate.addEventListener("change", generateInstallmentDates),
    
    // إضافة أحداث لتوليد مواعيد الدفع
    els.installmentCount.addEventListener("change", generateInstallmentDates),
    els.invoiceDate.addEventListener("change", generateInstallmentDates)
}))

// دالة لتوليد مواعيد الدفع المخصصة
function generateInstallmentDates() {
    const count = parseInt(els.installmentCount.value) || 3;
    const invoiceDate = els.invoiceDate.value;
    
    if (!invoiceDate) {
        return;
    }
    
    const dates = [];
    const baseDate = new Date(invoiceDate);
    
    for (let i = 0; i < count; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        dates.push(dueDate.toISOString().split('T')[0]);
    }
    
    renderInstallmentDates(dates);
}

// دالة لعرض مواعيد الدفع
function renderInstallmentDates(dates) {
    if (!els.installmentDates) return;
    
    els.installmentDates.innerHTML = dates.map((date, index) => `
        <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span class="text-sm font-medium">الدفعة ${index + 1}:</span>
            <input type="date" 
                   class="input input-sm input-bordered bg-transparent input-primary flex-1" 
                   value="${date}" 
                   data-installment-index="${index}"
                   onchange="updateInstallmentDate(${index}, this.value)">
        </div>
    `).join('');
}

// دالة لتحديث موعد دفعة معينة
function updateInstallmentDate(index, newDate) {
    
}

// دالة للحصول على مواعيد الدفع المخصصة
function getCustomInstallmentDates() {
    if (!els.installmentDates) return [];
    
    const dateInputs = els.installmentDates.querySelectorAll('input[type="date"]');
    return Array.from(dateInputs).map(input => input.value).filter(date => date);
}

window.printPurchaseInvoice = printPurchaseInvoice;