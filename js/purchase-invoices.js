import { paginateArray, renderPagination } from "./pagination.js";

let productsList = [], purchaseInvoices = [], filteredInvoices = [];
let currentPurchasePage = 1, purchasePageSize = 10;

document.addEventListener("DOMContentLoaded", () => {
  initializeTabs();
  loadPurchaseInvoices();
  setupEventListeners();
});

const supplierNameInput = document.getElementById("supplier-name");
const supplierIdInput = document.getElementById("supplier-id");
const supplierNamesList = document.getElementById("supplierNamesList");
const supplierPhonesList = document.getElementById("supplierPhonesList");

function initializeTabs() {
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`${tab.dataset.tab}-tab`).classList.add("active");
    });
  });
}

function setupEventListeners() {
  const qInput = document.getElementById("product-quantity-input");
  const pInput = document.getElementById("product-price-input");
  qInput.addEventListener("input", updateProductTotalInput);
  pInput.addEventListener("input", updateProductTotalInput);
  document.getElementById("add-product-btn").addEventListener("click", addProductToTable);
  document.getElementById("paid-amount").addEventListener("input", updateRemainingAmount);
}

function updateProductTotalInput() {
  const q = parseFloat(document.getElementById("product-quantity-input").value) || 0;
  const p = parseFloat(document.getElementById("product-price-input").value) || 0;
  document.getElementById("product-total-input").value = `${(q * p).toFixed(2)} ج.م`;
}

function addProductToTable() {
  const name = document.getElementById("product-name-input").value.trim();
  const qty = parseInt(document.getElementById("product-quantity-input").value) || 0;
  const price = parseFloat(document.getElementById("product-price-input").value) || 0;
  const total = qty * price;
  if (!name || qty <= 0 || price <= 0) {
    return void Swal.fire({ title: "خطأ!", text: "يرجى التأكد من إدخال بيانات المنتج بشكل صحيح.", icon: "error", confirmButtonColor: "#EF4444" });
  }
  productsList.push({ id: Date.now(), name, quantity: qty, price, total });
  renderAddedProducts();
  updateInvoiceTotal();
  document.getElementById("product-name-input").value = "";
  document.getElementById("product-quantity-input").value = "1";
  document.getElementById("product-price-input").value = "0";
  document.getElementById("product-total-input").value = "0 ج.م";
}

function renderAddedProducts() {
  const tbody = document.getElementById("added-products-table");
  if (productsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500">لم يتم إضافة منتجات بعد</td></tr>`;
    return;
  }
  tbody.innerHTML = productsList.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.quantity}</td>
      <td>${p.price.toFixed(2)} ج.م</td>
      <td>${p.total.toFixed(2)} ج.م</td>
      <td><button onclick="removeProductFromTable(${p.id})" class="btn btn-error btn-sm"><i class="fas fa-trash"></i> حذف</button></td>
    </tr>`).join("");
}

function removeProductFromTable(id) {
  productsList = productsList.filter(p => p.id !== id);
  renderAddedProducts();
  updateInvoiceTotal();
}

function updateInvoiceTotal() {
  const total = productsList.reduce((s, p) => s + p.total, 0);
  document.getElementById("total-amount").value = `${total.toFixed(2)} ج.م`;
  updateRemainingAmount();
}

function updateRemainingAmount() {
  const total = parseFloat(document.getElementById("total-amount").value) || 0;
  const paid = parseFloat(document.getElementById("paid-amount").value) || 0;
  document.getElementById("remaining-amount").value = `${(total - paid).toFixed(2)} ج.م`;
}

function resetForm() {
  ["supplier-name","supplier-id","creator-name","creator-id","invoice-date","product-name-input","notes"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("product-quantity-input").value = "1";
  document.getElementById("product-price-input").value = "0";
  document.getElementById("product-total-input").value = "0 ج.م";
  document.getElementById("total-amount").value = "0 ج.م";
  document.getElementById("paid-amount").value = "0";
  document.getElementById("remaining-amount").value = "0 ج.م";
  productsList = [];
  renderAddedProducts();
}

async function savePurchaseInvoice() {
  try {
    const supplierName = document.getElementById("supplier-name").value.trim();
    const supplierId = document.getElementById("supplier-id").value.trim();
    const creatorName = document.getElementById("creator-name").value.trim();
    const creatorId = document.getElementById("creator-id").value.trim();
    const invoiceDate = document.getElementById("invoice-date").value;
    const notes = document.getElementById("notes").value.trim();
    const totalAmount = parseFloat(document.getElementById("total-amount").value) || 0;
    const paidAmount = parseFloat(document.getElementById("paid-amount").value) || 0;
    const remainingAmount = parseFloat(document.getElementById("remaining-amount").value) || 0;

    if (!(supplierName && supplierId && creatorName && creatorId && invoiceDate)) {
      return void Swal.fire({ title: "خطأ!", text: "يرجى إدخال جميع الحقول المطلوبة.", icon: "error", confirmButtonColor: "#EF4444" });
    }
    if (productsList.length === 0) {
      return void Swal.fire({ title: "خطأ!", text: "يرجى إضافة منتج واحد على الأقل.", icon: "error", confirmButtonColor: "#EF4444" });
    }

    const invoice = {
      invoiceNumber: (await window.electronAPI.getNextPurchaseInvoiceNumber()).toString(),
      supplierName, supplierId, creatorName, creatorId, invoiceDate,
      products: productsList, totalAmount, paidAmount, remainingAmount, notes,
      createdAt: new Date().toISOString()
    };

    await window.electronAPI.addPurchaseInvoice(invoice);

    if (paidAmount > 0) {
      const user = (await window.electronAPI.getSettings())?.currentUser || "غير معروف";
      const desc = `مصروفات - فاتورة شراء رقم ${invoice.invoiceNumber} (cash)`;
      const existing = await window.electronAPI.getTreasuryTransactions();
      if (!existing.some(t => t.description === desc && t.user === user)) {
        await window.electronAPI.addTreasuryTransaction({ date: new Date().toISOString(), type: "expense", amount: paidAmount, description: desc, user });
      }
    }

    Swal.fire({ title: "تم!", text: "تم حفظ فاتورة الشراء بنجاح.", icon: "success", confirmButtonColor: "#34D399" });
    resetForm();
    loadPurchaseInvoices();
  } catch (e) {
    Swal.fire({ title: "خطأ!", text: "حدث خطأ أثناء حفظ الفاتورة.", icon: "error", confirmButtonColor: "#EF4444" });
  }
}

async function loadPurchaseInvoices() {
  try {
    purchaseInvoices = await window.electronAPI.getPurchaseInvoices();
    filteredInvoices = [...purchaseInvoices];
    currentPurchasePage = 1;
    renderPurchaseInvoices();
  } catch (e) {
    document.getElementById("invoices-table-body").innerHTML = `<tr><td colspan="10" class="text-center text-red-500">خطأ أثناء تحميل الفواتير</td></tr>`;
  }
}

function searchInvoices() {
  const q = document.getElementById("search-invoice").value.trim();
  filteredInvoices = q ? purchaseInvoices.filter(inv => inv.invoiceNumber.includes(q)) : [...purchaseInvoices];
  currentPurchasePage = 1;
  renderPurchaseInvoices();
}

function renderPurchaseInvoices() {
  const tbody = document.getElementById("invoices-table-body");
  const pagContainer = document.getElementById("purchaseInvoicesPagination");
  const emptyState = document.getElementById("invoices-empty-state");
  const tableWrapper = document.getElementById("invoices-table-wrapper");
  const searchBar = document.getElementById("invoices-search-bar");

  if (!filteredInvoices || filteredInvoices.length === 0) {
    if (pagContainer) pagContainer.innerHTML = "";
    if (emptyState) emptyState.classList.remove("hidden");
    if (tableWrapper) tableWrapper.classList.add("hidden");
    if (searchBar) searchBar.classList.add("hidden");
    tbody.innerHTML = "";
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");
  if (tableWrapper) tableWrapper.classList.remove("hidden");
  if (searchBar) searchBar.classList.remove("hidden");

  const { pageItems, totalItems, currentPage } = paginateArray(filteredInvoices, currentPurchasePage, purchasePageSize);
  currentPurchasePage = currentPage;

  tbody.innerHTML = pageItems.map(inv => `
    <tr>
      <td>${inv.invoiceNumber}</td>
      <td>${inv.supplierName}</td>
      <td>${inv.supplierId}</td>
      <td>${inv.creatorName}</td>
      <td>${inv.creatorId}</td>
      <td>${new Date(inv.invoiceDate).toLocaleDateString("ar-EG")}</td>
      <td>${inv.totalAmount.toFixed(2)} ج.م</td>
      <td>${inv.paidAmount.toFixed(2)} ج.م</td>
      <td>${inv.remainingAmount.toFixed(2)} ج.م</td>
      <td class="action-cell">
        <div class="flex items-center justify-center gap-2">
          <button onclick="viewInvoiceDetails('${inv.invoiceNumber}')" class="btn btn-info btn-sm px-3 gap-1.5"><i class="fas fa-eye"></i> </button>
          <button onclick="printInvoice('${inv.invoiceNumber}')" class="btn btn-success btn-sm px-3 gap-1.5"><i class="fas fa-print"></i> </button>
          <button onclick="deleteInvoice('${inv._id}')" class="btn btn-error btn-sm px-3 gap-1.5"><i class="fas fa-trash"></i> </button>
        </div>
      </td>
    </tr>`).join("");

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

async function deleteInvoice(id) {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟", text: "لن يمكنك التراجع عن هذا الإجراء!",
    icon: "warning", showCancelButton: true,
    confirmButtonColor: "#EF4444", cancelButtonColor: "#6B7280", confirmButtonText: "نعم، احذفها!"
  });
  if (!result.isConfirmed) return;
  try {
    await window.electronAPI.deletePurchaseInvoice(id);
    loadPurchaseInvoices();
    Swal.fire("تم الحذف!", "تم حذف الفاتورة بنجاح.", "success");
  } catch (e) {
    Swal.fire("خطأ!", "فشل في حذف الفاتورة: " + e.message, "error");
  }
}

function viewInvoiceDetails(invoiceNumber) {
  const inv = purchaseInvoices.find(i => i.invoiceNumber === invoiceNumber);
  if (!inv) return;

  const rows = inv.products.map(p => `
    <tr style="border-bottom:1px solid #f3f0ff;">
      <td style="padding:10px 14px;text-align:right;color:#374151;font-size:0.9rem;">${p.name}</td>
      <td style="padding:10px 14px;text-align:center;color:#374151;font-weight:600;">${p.quantity}</td>
      <td style="padding:10px 14px;text-align:center;color:#6d28d9;font-weight:600;">${p.price.toFixed(2)} ج.م</td>
      <td style="padding:10px 14px;text-align:center;color:#374151;font-weight:700;">${(p.quantity * p.price).toFixed(2)} ج.م</td>
    </tr>`).join("");

  Swal.fire({
    title: "",
    html: `<div style="font-family:'Tajawal',sans-serif;direction:rtl;text-align:right;color:#1e1b4b;padding:4px 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:2px solid #ede9fe;margin-bottom:20px;">
        <div>
          <h2 style="font-size:1.4rem;font-weight:800;color:#6d28d9;margin:0;">فاتورة شراء</h2>
          <p style="font-size:1rem;color:#9ca3af;margin:4px 0 0;">#${inv.invoiceNumber}</p>
        </div>
        <div style="background:linear-gradient(135deg,#6d28d9,#4f46e5);color:white;padding:6px 18px;border-radius:999px;font-size:0.85rem;font-weight:700;">فاتورة شراء</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
        <div style="background:#faf7ff;border:1.5px solid #ede9fe;border-radius:14px;padding:14px;">
          <p style="font-size:0.78rem;font-weight:700;color:#7c3aed;margin:0 0 10px;">معلومات المورد</p>
          <div style="display:flex;justify-content:space-between;font-size:0.86rem;margin-bottom:6px;"><span style="color:#6b7280;">اسم المورد</span><span style="color:#1e1b4b;font-weight:600;">${inv.supplierName}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:0.86rem;"><span style="color:#6b7280;">رقم المورد</span><span style="color:#1e1b4b;font-weight:600;">${inv.supplierId}</span></div>
        </div>
        <div style="background:#faf7ff;border:1.5px solid #ede9fe;border-radius:14px;padding:14px;">
          <p style="font-size:0.78rem;font-weight:700;color:#7c3aed;margin:0 0 10px;">معلومات الفاتورة</p>
          <div style="display:flex;justify-content:space-between;font-size:0.86rem;margin-bottom:6px;"><span style="color:#6b7280;">منشئ الفاتورة</span><span style="color:#1e1b4b;font-weight:600;">${inv.creatorName}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:0.86rem;margin-bottom:6px;"><span style="color:#6b7280;">رقم المنشئ</span><span style="color:#1e1b4b;font-weight:600;">${inv.creatorId}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:0.86rem;"><span style="color:#6b7280;">التاريخ</span><span style="color:#1e1b4b;font-weight:600;">${new Date(inv.invoiceDate).toLocaleDateString("ar-EG")}</span></div>
        </div>
      </div>
      <div style="margin-bottom:20px;">
        <p style="font-size:0.85rem;font-weight:700;color:#7c3aed;margin:0 0 10px;">المنتجات</p>
        <div style="border-radius:12px;overflow:hidden;border:1.5px solid #ede9fe;">
          <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
            <thead>
              <tr style="background:linear-gradient(135deg,#6d28d9,#4f46e5);">
                <th style="padding:10px 14px;text-align:right;color:white;font-weight:600;">المنتج</th>
                <th style="padding:10px 14px;text-align:center;color:white;font-weight:600;">الكمية</th>
                <th style="padding:10px 14px;text-align:center;color:white;font-weight:600;">السعر</th>
                <th style="padding:10px 14px;text-align:center;color:white;font-weight:600;">المجموع</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:${inv.notes ? '16px' : '4px'};">
        <div style="background:#f5f3ff;border:1.5px solid #ddd6fe;border-radius:14px;padding:14px;text-align:center;">
          <p style="font-size:0.75rem;color:#7c3aed;font-weight:600;margin:0 0 4px;">الاجمالي</p>
          <p style="font-size:1.1rem;font-weight:800;color:#6d28d9;margin:0;">${inv.totalAmount.toFixed(2)} ج.م</p>
        </div>
        <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:14px;padding:14px;text-align:center;">
          <p style="font-size:0.75rem;color:#16a34a;font-weight:600;margin:0 0 4px;">المدفوع</p>
          <p style="font-size:1.1rem;font-weight:800;color:#15803d;margin:0;">${inv.paidAmount.toFixed(2)} ج.م</p>
        </div>
        <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:14px;padding:14px;text-align:center;">
          <p style="font-size:0.75rem;color:#d97706;font-weight:600;margin:0 0 4px;">المتبقي</p>
          <p style="font-size:1.1rem;font-weight:800;color:#b45309;margin:0;">${inv.remainingAmount.toFixed(2)} ج.م</p>
        </div>
      </div>
      ${inv.notes ? `<div style="background:#faf7ff;border:1.5px solid #ede9fe;border-radius:12px;padding:12px;"><p style="font-size:0.8rem;font-weight:700;color:#7c3aed;margin:0 0 6px;">ملاحظات</p><p style="font-size:0.88rem;color:#4b5563;margin:0;">${inv.notes}</p></div>` : ""}
    </div>`,
    showCancelButton: true,
    confirmButtonText: "اغلاق",
    cancelButtonText: "طباعة",
    confirmButtonColor: "#6d28d9",
    cancelButtonColor: "#059669",
    customClass: { popup: "swal-inv-wide" },
    didOpen: () => {
      if (!document.getElementById("swal-inv-style")) {
        const s = document.createElement("style");
        s.id = "swal-inv-style";
        s.textContent = ".swal-inv-wide{max-width:860px!important;width:90vw!important;padding:28px!important;border-radius:20px!important;} .swal-inv-wide .swal2-html-container{overflow:visible!important;max-height:none!important;padding:0!important;}";
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
    if (!inv || !inv.products) return void Swal.fire({ title: "خطأ!", text: "الفاتورة غير موجودة.", icon: "error", confirmButtonColor: "#EF4444" });

    const settings = (await window.electronAPI.getSettings()) || {};
    const storeName = settings.storeName || "اسم المحل";
    const logo = settings.logo && settings.logo.startsWith("data:image") ? settings.logo : "";

    const rows = inv.products.map(p => `
      <tr>
        <td style="text-align:right;padding:4px 3px;font-size:10px;border:1px solid #e5e7eb;">${p.name}</td>
        <td style="text-align:center;padding:4px 3px;font-size:10px;border:1px solid #e5e7eb;">${p.quantity}</td>
        <td style="text-align:center;padding:4px 3px;font-size:10px;border:1px solid #e5e7eb;">${p.price.toFixed(2)}</td>
        <td style="text-align:center;padding:4px 3px;font-size:10px;border:1px solid #e5e7eb;font-weight:bold;">${(p.quantity * p.price).toFixed(2)}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>فاتورة #${inv.invoiceNumber}</title>
      <style>
        @media print { body { margin:0;padding:0;width:80mm; } .invoice-border { border:2px solid #1e40af !important; } }
        body { font-family:'Tajawal',Arial,sans-serif;background:white;color:#333;padding:8px; }
        .invoice-border { border:2px solid #1e40af;border-radius:10px;padding:10px;margin:4px;box-shadow:0 0 0 1px #dbeafe inset; }
        .header { text-align:center;margin-bottom:8px;padding-bottom:6px;border-bottom:2px dashed #bfdbfe; }
        .store-name { font-size:16px;font-weight:700;color:#1e40af;margin-bottom:4px; }
        .invoice-title { font-size:14px;font-weight:700;color:#1e40af; }
        .logo { max-width:60mm;max-height:20mm;display:block;margin:0 auto 5px; }
        .info-box { margin:6px 0;border:1px solid #e5e7eb;border-radius:6px;padding:5px;background:#f9fafb;font-size:9px; }
        .info-row { display:flex;justify-content:space-between;margin:3px 0; }
        table { width:100%;border-collapse:collapse;margin:6px 0; }
        thead tr { background:#1e40af;color:white; }
        thead th { padding:5px 3px;font-size:10px; }
        .totals { background:#eff6ff;border:1px solid #dbeafe;border-radius:6px;padding:6px;margin:6px 0; }
        .total-row { display:flex;justify-content:space-between;margin:3px 0;font-size:10px; }
        .footer { text-align:center;margin-top:8px;padding-top:6px;border-top:2px dashed #bfdbfe;font-size:8px;color:#6b7280; }
      </style></head>
      <body>
        <div class="invoice-border">
        <div class="header">
          ${logo ? `<img src="${logo}" class="logo" alt="logo">` : ""}
          <div class="store-name">${storeName}</div>
          <div class="invoice-title">فاتورة شراء</div>
          <div style="font-size:10px;color:#1e40af;">${new Date(inv.invoiceDate).toLocaleDateString("ar-EG",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
          <div style="background:#1e40af;color:white;padding:2px 8px;border-radius:10px;display:inline-block;font-size:10px;margin-top:3px;">رقم #${inv.invoiceNumber}</div>
        </div>
        <div class="info-box">
          <div class="info-row"><span><strong>المورد:</strong> ${inv.supplierName}</span><span><strong>رقم:</strong> ${inv.supplierId}</span></div>
          <div class="info-row"><span><strong>المنشئ:</strong> ${inv.creatorName}</span><span><strong>التاريخ:</strong> ${new Date(inv.invoiceDate).toLocaleDateString("ar-EG")}</span></div>
        </div>
        <table>
          <thead><tr><th style="text-align:right;">المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>الإجمالي:</span><span style="font-weight:bold;">${inv.totalAmount.toFixed(2)} ج.م</span></div>
          <div class="total-row"><span>المدفوع:</span><span style="font-weight:bold;color:#16a34a;">${inv.paidAmount.toFixed(2)} ج.م</span></div>
          <div class="total-row"><span>المتبقي:</span><span style="font-weight:bold;color:#dc2626;">${inv.remainingAmount.toFixed(2)} ج.م</span></div>
        </div>
        ${inv.notes ? `<div style="background:#eff6ff;border-radius:6px;padding:5px;font-size:9px;"><strong style="color:#1e40af;">ملاحظات:</strong> ${inv.notes}</div>` : ""}
        <div class="footer"><div style="font-weight:bold;color:#1e40af;margin-bottom:3px;">شكراً لتعاملكم معنا</div><div>للاستفسار: 0123456789</div></div>
        </div>
      </body></html>`;

    await window.electronAPI.printInvoice(html, invoiceNumber, "pos");
    Swal.fire({ title: "تمت الطباعة!", text: "تم إرسال الفاتورة للطباعة.", icon: "success", confirmButtonColor: "#16a34a", timer: 1500 });
  } catch (e) {
    Swal.fire({ title: "خطأ في الطباعة", text: e.message || "حدث خطأ أثناء الطباعة", icon: "error", confirmButtonColor: "#dc2626" });
  }
}

window.deleteInvoice = deleteInvoice;
window.savePurchaseInvoice = savePurchaseInvoice;
window.resetForm = resetForm;
window.viewInvoiceDetails = viewInvoiceDetails;
window.removeProductFromTable = removeProductFromTable;
window.searchInvoices = searchInvoices;
window.printInvoice = printInvoice;
