import { markFieldInvalid, clearFieldInvalid } from "./shared.js";

let invoiceItems = [],
  defaultDiscount = 0,
  defaultDiscountType = "fixed",
  allProducts = [],
  allCustomers = [];

let suspendedInvoices = [];

async function initPage() {
  const today = new Date();
  const eestOffset = 3 * 60;
  const localDate = new Date(today.getTime() + eestOffset * 60 * 1000);
  const currentDate = localDate.toISOString().split("T")[0].replace(/-/g, "");

  // جيب آخر فاتورة من المبيعات
  const lastSale = await window.electronAPI.getSales();
  let currentInvoiceNumber = "INV - 1 - " + currentDate;
  if (lastSale.length > 0) {
    const lastInvoice = lastSale.sort((a, b) => {
      const aNum = parseInt(a.invoiceNumber.split("-")[1].trim());
      const bNum = parseInt(b.invoiceNumber.split("-")[1].trim());
      return bNum - aNum;
    })[0].invoiceNumber;
    const lastSequence = parseInt(lastInvoice.split("-")[1].trim());
    currentInvoiceNumber = `INV - ${lastSequence + 1} - ${currentDate}`;
  }

  document.getElementById("invoiceNumber").textContent = currentInvoiceNumber;
  document.getElementById("invoiceDate").textContent = localDate.toLocaleString(
    "ar-EG",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
  await loadProducts();
  await loadCustomers();
  loadCategories();
  await loadDefaultDiscount();
  await loadStoreInfo();
  await loadSuspendedInvoices();
  renderItems();

  setInterval(async () => {
    const newToday = new Date();
    const newLocalDate = new Date(newToday.getTime() + eestOffset * 60 * 1000);
    const newCurrentDate = newLocalDate
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");
    const newDisplayedDate = document
      .getElementById("invoiceNumber")
      .textContent.split("-")[2]
      ?.trim();

    if (newCurrentDate !== newDisplayedDate) {
      const newInvoiceNumber = await window.electronAPI.getNextInvoiceNumber();
      document.getElementById("invoiceNumber").textContent = newInvoiceNumber;
      document.getElementById("invoiceDate").textContent =
        newLocalDate.toLocaleString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      
    }
  }, 60000); // تحقق كل دقيقة
}

async function loadStoreInfo() {
  const s = (await window.electronAPI.getSettings()) || {},
    l = document.getElementById("storeLogoPreview"),
    n = document.getElementById("storeNamePreview");
  if (s.logo) {
    l.src = s.logo;
    l.classList.remove("hidden");
  }
  n.textContent = s.storeName || "اسم المحل";
}

async function loadProducts() {
  allProducts = await window.electronAPI.getProducts();
  updateProductOptions();
  searchProducts();
}

async function loadCustomers() {
  try {
    allCustomers = (await window.electronAPI.getCustomers()) || [];
    updateCustomerOptions();
  } catch (error) {
    console.error("خطأ في تحميل العملاء:", error);
    allCustomers = [];
  }
}

let _dropdownActiveIndex = -1;

function updateProductOptions(f = allProducts) {
  const dropdown = document.getElementById("productDropdown");
  if (!dropdown) return;

  const searchVal = (document.getElementById("productSearch")?.value || "").trim();

  if (!searchVal || f.length === 0) {
    dropdown.classList.remove("open");
    dropdown.innerHTML = "";
    _dropdownActiveIndex = -1;
    return;
  }

  _dropdownActiveIndex = -1;
  dropdown.innerHTML = f.slice(0, 30).map((p, i) => {
    const barcodeStr = p.barcode ? `<span class="item-meta">باركود: ${p.barcode}</span>` : "";
    const stockClass = (p.quantity > 0) ? "item-stock-ok" : "item-stock-low";
    const stockStr = p.quantity !== undefined
      ? `<span class="${stockClass}">المتوفر: ${p.quantity}</span>`
      : "";
    const price = Number(p.price || 0).toFixed(2);
    return `
      <div class="autocomplete-item" data-index="${i}" data-name="${p.name.replace(/"/g,'&quot;')}" onclick="selectAutocompleteItem('${p.name.replace(/'/g,"\\'")}')"> 
        <span class="item-name">${p.name}</span>
        <span class="item-meta">${price} ج.م &nbsp;·&nbsp; ${stockStr} ${barcodeStr}</span>
      </div>`;
  }).join("");

  dropdown.classList.add("open");
}


function updateCustomerOptions() {
  const customerNameInput = document.getElementById("customerName");
  const customerPhoneInput = document.getElementById("customerPhone");

  if (!customerNameInput || !customerPhoneInput) {
    console.warn("حقول العميل غير موجودة");
    return;
  }

  // إنشاء datalist للاقتراحات
  let datalist = document.getElementById("customerSuggestions");
  if (!datalist) {
    datalist = document.createElement("datalist");
    datalist.id = "customerSuggestions";
    customerNameInput.parentNode.appendChild(datalist);
  }

  datalist.innerHTML = "";
  allCustomers.forEach((customer) => {
    const option = document.createElement("option");
    option.value = customer.name;
    option.dataset.phone = customer.phone || "";
    datalist.appendChild(option);
  });

  // إضافة event listener لاختيار العميل (فقط إذا لم يكن موجوداً)
  customerNameInput.setAttribute("list", "customerSuggestions");

  // إزالة event listener القديم إذا كان موجوداً
  customerNameInput.removeEventListener("input", handleCustomerSelection);

  // إضافة event listener جديد
  customerNameInput.addEventListener("input", handleCustomerSelection);
}

async function handleInvoiceBarcodeScan(barcode) {
  if (!barcode || barcode.trim() === "") return;

  try {
    const product = allProducts.find((p) => p.barcode === barcode.trim());

    if (!product) {
      Swal.fire({
        title: "غير موجود",
        text: "لم يتم العثور على أي منتج مرتبط بهذا الباركود.",
        icon: "warning",
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "حسناً",
      });
      document.getElementById("invoiceBarcodeScannerInput").value = "";
      return;
    }

    if (product.quantity <= 0) {
      Swal.fire({
        title: "نفدت الكمية",
        text: `عذراً، منتج "${product.name}" غير متوفر حالياً بالمخزون.`,
        icon: "warning",
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "حسناً",
      });
      document.getElementById("invoiceBarcodeScannerInput").value = "";
      return;
    }

    const existingItemIndex = invoiceItems.findIndex(
      (item) => item._id === product._id
    );

    if (existingItemIndex >= 0) {
      if (invoiceItems[existingItemIndex].quantity + 1 > product.quantity) {
        Swal.fire({
          title: "تنبيه المخزون",
          text: `الكمية المتوفرة في المخزون (${product.quantity}) لا تسمح بإضافة المزيد.`,
          icon: "warning",
          confirmButtonColor: "#4f46e5",
          confirmButtonText: "حسناً",
        });
        document.getElementById("invoiceBarcodeScannerInput").value = "";
        return;
      }
      invoiceItems[existingItemIndex].quantity += 1;
    } else {
      invoiceItems.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        barcode: product.barcode,
      });
    }

    renderItems();
    document.getElementById("invoiceBarcodeScannerInput").value = "";

    Swal.fire({
      title: "تمت الإضافة",
      text: `تمت إضافة "${product.name}" إلى الفاتورة.`,
      icon: "success",
      confirmButtonColor: "#4f46e5",
      timer: 1200,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Barcode scan error:", error);
    Swal.fire({
      title: "عذراً",
      text: "حدث خطأ غير متوقع أثناء مسح الباركود، يرجى المحاولة مرة أخرى.",
      icon: "error",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "حسناً",
    });
    document.getElementById("invoiceBarcodeScannerInput").value = "";
  }
}

function handleCustomerSelection() {
  const customerNameInput = document.getElementById("customerName");
  const customerPhoneInput = document.getElementById("customerPhone");
  const selectedCustomer = allCustomers.find(
    (c) => c.name === customerNameInput.value
  );
  if (selectedCustomer) {
    customerPhoneInput.value = selectedCustomer.phone || "";
  }
}

async function loadCategories() {
  const c = await window.electronAPI.getCategories(),
    s = document.getElementById("categorySelect");
  s.innerHTML = '<option value="">الكل</option>';
  c.forEach((cat) => {
    const o = document.createElement("option");
    o.value = cat.name;
    o.textContent = cat.name;
    s.appendChild(o);
  });
}

function filterProducts() {
  const c = document.getElementById("categorySelect")?.value || "",
    t = (document.getElementById("productSearch")?.value || "").trim().toLowerCase(),
    f = allProducts.filter(
      (p) =>
        (!c || p.category === c) &&
        (p.name.toLowerCase().includes(t) ||
         (p.barcode && p.barcode.toLowerCase().includes(t)))
    );
  updateProductOptions(t ? f : []);
}

function searchProducts() {
  filterProducts();
}

function selectAutocompleteItem(name) {
  const input = document.getElementById("productSearch");
  if (input) input.value = name;
  const dropdown = document.getElementById("productDropdown");
  if (dropdown) { dropdown.classList.remove("open"); dropdown.innerHTML = ""; }
  _dropdownActiveIndex = -1;
  addProductToInvoice();
}

function handleProductSearchKeydown(event) {
  const dropdown = document.getElementById("productDropdown");
  const items = dropdown ? dropdown.querySelectorAll(".autocomplete-item") : [];

  if (event.key === "ArrowDown") {
    event.preventDefault();
    _dropdownActiveIndex = Math.min(_dropdownActiveIndex + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle("active", i === _dropdownActiveIndex));
    if (items[_dropdownActiveIndex]) items[_dropdownActiveIndex].scrollIntoView({ block: "nearest" });
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    _dropdownActiveIndex = Math.max(_dropdownActiveIndex - 1, 0);
    items.forEach((el, i) => el.classList.toggle("active", i === _dropdownActiveIndex));
    if (items[_dropdownActiveIndex]) items[_dropdownActiveIndex].scrollIntoView({ block: "nearest" });
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (_dropdownActiveIndex >= 0 && items[_dropdownActiveIndex]) {
      const name = items[_dropdownActiveIndex].dataset.name;
      selectAutocompleteItem(name);
    } else {
      if (dropdown) { dropdown.classList.remove("open"); dropdown.innerHTML = ""; }
      addProductToInvoice();
    }
  } else if (event.key === "Escape") {
    if (dropdown) { dropdown.classList.remove("open"); dropdown.innerHTML = ""; }
    _dropdownActiveIndex = -1;
  }
}

function selectProduct() {
  const n = document.getElementById("productSearch")?.value;
  if (n) {
    const p = allProducts.find((p) => p.name === n || (p.barcode && p.barcode === n));
    if (p) document.getElementById("productSearch").value = p.name;
  }
}

async function addProductToInvoice() {
  const searchInput = document.getElementById("productSearch");
  const n = searchInput ? searchInput.value.trim() : "";
  
  if (!n) {
    if (searchInput) markFieldInvalid(searchInput, "يرجى كتابة أو اختيار اسم المنتج أو مسح الباركود أولاً.");
    return;
  }
  
  const nLower = n.toLowerCase();
  let p = allProducts.find(
    (prod) =>
      prod.name.trim().toLowerCase() === nLower ||
      (prod.barcode && prod.barcode.trim().toLowerCase() === nLower)
  );

  // If not exact match, check single match among products
  if (!p) {
    const matches = allProducts.filter(
      (prod) =>
        prod.name.toLowerCase().includes(nLower) ||
        (prod.barcode && prod.barcode.toLowerCase().includes(nLower))
    );
    if (matches.length === 1) {
      p = matches[0];
    }
  }

  if (!p) {
    if (searchInput) markFieldInvalid(searchInput, "المنتج أو الباركود المحدد غير مسجل في قائمة المنتجات.");
    return;
  }

  if (p.quantity <= 0) {
    Swal.fire({
      icon: "warning",
      title: "نفدت الكمية",
      text: `عذراً، منتج "${p.name}" غير متوفر حالياً في المخزون.`,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return;
  }

  const existingIndex = invoiceItems.findIndex((i) => i._id === p._id);
  if (existingIndex >= 0) {
    if (invoiceItems[existingIndex].quantity + 1 > p.quantity) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه المخزون",
        text: `الكمية المتوفرة في المخزون (${p.quantity}) لا تسمح بإضافة المزيد من "${p.name}".`,
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "حسناً",
      });
      return;
    }
    invoiceItems[existingIndex].quantity += 1;
    renderItems();
    searchInput.value = "";
    if (typeof clearFieldInvalid === "function") clearFieldInvalid(searchInput);
    return;

  }

  invoiceItems.push({
    _id: p._id,
    name: p.name,
    price: p.price,
    quantity: 1,
    barcode: p.barcode,
  });
  renderItems();
  searchInput.value = "";
  if (typeof clearFieldInvalid === "function") clearFieldInvalid(searchInput);
}

function renderItems() {
  const thead = document.getElementById("itemsTableHead");
  if (thead) {
    if (invoiceItems.length > 0) {
      thead.classList.remove("hidden");
    } else {
      thead.classList.add("hidden");
    }
  }

  const t = document.getElementById("itemsTableBody");
  if (!t) return;

  t.innerHTML = invoiceItems
    .map(
      (i, idx) =>
        `<tr class="hover:bg-gray-50 transition-colors"><td class="font-medium text-gray-800">${
          i.name
        }</td><td class="text-center"><div class="flex items-center justify-center"><button onclick="increaseQuantity(${idx})" class="btn btn-xs btn-circle btn-success text-white"><i class="fas fa-plus"></i></button><input type="number" value="${
          i.quantity
        }" min="1" onchange="updateQuantity(${idx}, this.value)" class="input input-xs input-primary bg-transparent border quntity-input hide-number-arrows"><button onclick="decreaseQuantity(${idx})" class="btn btn-xs btn-circle btn-error text-white"><i class="fas fa-minus"></i></button></div></td><td class="text-center font-medium text-blue-600">${i.price.toFixed(
          2
        )} ج.م</td><td class="text-center font-medium">${(
          i.quantity * i.price
        ).toFixed(2)} ج.م</td><td class="text-center text-gray-500">${
          i.barcode || "--"
        }</td><td class="text-center"><button onclick="removeItem(${idx})" class="btn btn-xs btn-error text-white"><i class="fas fa-trash-alt"></i>حذف</button></td></tr>`
    )
    .join("");
  calculateTotals();
}

function increaseQuantity(i) {
  const item = invoiceItems[i];
  if (!item) return;
  const prod = allProducts.find((p) => p._id === item._id);
  if (prod && item.quantity + 1 > prod.quantity) {
    Swal.fire({
      icon: "warning",
      title: "تنبيه المخزون",
      text: `لا يمكن زيادة الكمية، الكمية المتاحة في المخزون هي ${prod.quantity} فقط.`,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return;
  }
  item.quantity++;
  renderItems();
}

function decreaseQuantity(i) {
  if (invoiceItems[i] && invoiceItems[i].quantity > 1) {
    invoiceItems[i].quantity--;
    renderItems();
  }
}

function updateQuantity(i, v) {
  const item = invoiceItems[i];
  if (!item) return;
  let newQty = Math.max(1, parseInt(v) || 1);
  const prod = allProducts.find((p) => p._id === item._id);
  if (prod && newQty > prod.quantity) {
    newQty = prod.quantity;
    Swal.fire({
      icon: "warning",
      title: "تنبيه المخزون",
      text: `تم ضبط الكمية على الحد الأقصى المتوفر بالمخزون وهو (${prod.quantity}).`,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
  }
  item.quantity = newQty;
  renderItems();
}

function removeItem(i) {
  invoiceItems.splice(i, 1);
  renderItems();
}

async function loadDefaultDiscount() {
  const s = (await window.electronAPI.getSettings()) || {};
  defaultDiscount = s.defaultDiscount || 0;
  defaultDiscountType = s.defaultDiscountType || "fixed";
  document.getElementById("defaultDiscountBtn").textContent = `إعدادات (${
    defaultDiscountType === "percentage"
      ? `${defaultDiscount}%`
      : `${defaultDiscount} ج.م`
  })`;
  calculateTotals();
}

async function openDefaultDiscountSettings() {
  const { value: f } = await Swal.fire({
    title: "إعدادات الخصم الافتراضي",
    html: `<div class="space-y-4 text-right pt-2">
      <label class="block text-sm font-semibold text-gray-700">قيمة الخصم:</label>
      <input id="swal-input1" class="swal2-input !w-full !m-0" type="number" placeholder="قيمة الخصم" min="0" step="0.01" value="${defaultDiscount}">
      <label class="block text-sm font-semibold text-gray-700 mt-3">نوع الخصم:</label>
      <select id="swal-input2" class="swal2-select !w-full !m-0">
        <option value="fixed" ${defaultDiscountType === "fixed" ? "selected" : ""}>مبلغ ثابت (ج.م)</option>
        <option value="percentage" ${defaultDiscountType === "percentage" ? "selected" : ""}>نسبة مئوية (%)</option>
      </select>
    </div>`,
    focusConfirm: false,
    preConfirm: () => {
      const v = document.getElementById("swal-input1").value,
        t = document.getElementById("swal-input2").value;
      if (!v || parseFloat(v) < 0) {
        Swal.showValidationMessage("يرجى إدخال قيمة خصم صحيحة (صفر أو أكبر)");
        return false;
      }
      return { value: parseFloat(v), type: t };
    },
    showCancelButton: true,
    confirmButtonColor: "#4f46e5",
    cancelButtonColor: "#64748b",
    confirmButtonText: "حفظ الإعدادات",
    cancelButtonText: "إلغاء",
  });
  if (f) {
    defaultDiscount = f.value;
    defaultDiscountType = f.type;
    const s = (await window.electronAPI.getSettings()) || {};
    await window.electronAPI.saveSettings({
      ...s,
      defaultDiscount,
      defaultDiscountType,
    });
    document.getElementById("defaultDiscountBtn").textContent = `إعدادات (${
      defaultDiscountType === "percentage"
        ? `${defaultDiscount}%`
        : `${defaultDiscount} ج.م`
    })`;
    calculateTotals();
    Swal.fire({
      icon: "success",
      title: "تم الحفظ",
      text: "تم حفظ إعدادات الخصم الافتراضي بنجاح.",
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
  }
}

function updateDiscount(s) {
  const a = document.getElementById("currentDiscountAmount"),
    p = document.getElementById("currentDiscountPercentage"),
    t = getSubtotal() || 0;
  if (s === "amount") {
    const v = parseFloat(a.value) || 0;
    p.value = t > 0 ? ((v / t) * 100).toFixed(2) : "0.00";
  } else if (s === "percentage") {
    const v = parseFloat(p.value) || 0;
    a.value = ((t * v) / 100).toFixed(2);
  }
  calculateTotals();
}

function getInvoiceTotals() {
  const s = getSubtotal(),
    c = parseFloat(document.getElementById("currentDiscountAmount")?.value) || 0,
    t = parseFloat(document.getElementById("taxRate")?.value) || 0,
    d =
      defaultDiscountType === "fixed"
        ? defaultDiscount
        : s > 0
        ? (s * defaultDiscount) / 100
        : 0,
    td = c + d,
    ta = (s - td) * (t / 100),
    g = s - td + ta;
  return { subtotal: s, totalDiscount: td, taxAmount: ta, grandTotal: g };
}

function calculateTotals() {
  const t = getInvoiceTotals();
  const subtotalEl = document.getElementById("subtotal");
  const totalDiscountEl = document.getElementById("totalDiscount");
  const taxAmountEl = document.getElementById("taxAmount");
  const grandTotalEl = document.getElementById("grandTotal");

  if (subtotalEl) subtotalEl.textContent = t.subtotal.toFixed(2) + " ج.م";
  if (totalDiscountEl) totalDiscountEl.textContent = t.totalDiscount.toFixed(2) + " ج.م";
  if (taxAmountEl) taxAmountEl.textContent = t.taxAmount.toFixed(2) + " ج.م";
  if (grandTotalEl) grandTotalEl.textContent = t.grandTotal.toFixed(2) + " ج.م";

  const itemsCountEl = document.getElementById("itemsCount");
  const totalUnitsCountEl = document.getElementById("totalUnitsCount");
  if (itemsCountEl) itemsCountEl.textContent = invoiceItems.length;
  if (totalUnitsCountEl) {
    const totalUnits = invoiceItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);
    totalUnitsCountEl.textContent = totalUnits;
  }

  calculateChange();
}

function calculateChange() {
  const totals = getInvoiceTotals();
  const paidInput = document.getElementById("paidAmount");
  const changeEl = document.getElementById("changeAmount");
  const badgeEl = document.getElementById("changeStatusBadge");
  if (!changeEl) return;

  const paidRaw = paidInput ? paidInput.value.trim() : "";
  if (!paidRaw) {
    changeEl.textContent = "0.00 ج.م";
    changeEl.className = "text-2xl font-black text-gray-400 py-1";
    if (badgeEl) {
      badgeEl.textContent = "في الانتظار";
      badgeEl.className = "badge badge-xs badge-ghost";
    }
    return;
  }

  const paid = parseFloat(paidRaw) || 0;
  const grandTotal = totals.grandTotal || 0;
  const diff = paid - grandTotal;

  if (diff >= -0.001) {
    const changeVal = Math.max(0, diff);
    changeEl.textContent = changeVal.toFixed(2) + " ج.م";
    changeEl.className = "text-2xl font-black text-emerald-600 py-1";
    if (badgeEl) {
      badgeEl.textContent = Math.abs(diff) < 0.01 ? "متوازن تماماً" : "متبقي للعميل";
      badgeEl.className = "badge badge-xs badge-success text-white";
    }
  } else {
    changeEl.textContent = "ناقص " + Math.abs(diff).toFixed(2) + " ج.م";
    changeEl.className = "text-2xl font-black text-red-600 py-1";
    if (badgeEl) {
      badgeEl.textContent = "المبلغ غير كافٍ";
      badgeEl.className = "badge badge-xs badge-error text-white";
    }
  }
}

function setExactPaid() {
  const totals = getInvoiceTotals();
  const paidInput = document.getElementById("paidAmount");
  if (paidInput) {
    paidInput.value = totals.grandTotal > 0 ? totals.grandTotal.toFixed(2) : "";
    calculateChange();
  }
}

function addQuickCash(amount) {
  const paidInput = document.getElementById("paidAmount");
  if (paidInput) {
    const current = parseFloat(paidInput.value) || 0;
    paidInput.value = (current + amount).toFixed(2);
    calculateChange();
  }
}

function getSubtotal() {
  return invoiceItems.reduce((s, i) => s + i.quantity * i.price, 0);
}

async function loadSuspendedInvoices() {
  try {
    suspendedInvoices = (await window.electronAPI.getSuspendedInvoices()) || [];
    renderSuspendedInvoices();
  } catch (error) {
    console.error("فشل تحميل الفواتير المعلقة:", error);
    Swal.fire({
      icon: "error",
      title: "عذراً",
      text: "تعذر تحميل قائمة الفواتير المعلقة حالياً.",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "حسناً",
    });
  }
}

function renderSuspendedInvoices() {
  const container = document.getElementById("suspendedInvoicesContainer");
  if (!container) return;

  if (suspendedInvoices.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-gray-400">
        <i class="fas fa-inbox text-3xl mb-2"></i>
        <p class="text-sm font-medium">لا توجد فواتير معلقة حالياً</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="space-y-3">
      ${suspendedInvoices
        .map(
          (inv) => `
          <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md" data-id="${
            inv.id
          }">
            <div class="flex justify-between items-start mb-2">
              <div>
                <p class="font-bold text-sm text-gray-800">فاتورة: ${
                  inv.invoiceNumber || "غير مسجلة"
                }</p>
                <p class="text-xs text-gray-500 mt-0.5">العميل: ${
                  inv.customerName || "غير محدد"
                }</p>
                <p class="text-xs text-gray-400 mt-0.5">التاريخ: ${new Date(
                  inv.suspendedAt
                ).toLocaleString("ar-EG")}</p>
              </div>
              <div class="flex gap-1.5">
                <button onclick="resumeSuspendedInvoice('${
                  inv.id
                }')" title="استرجاع الفاتورة" class="btn btn-xs btn-success text-white">
                  <i class="fas fa-play"></i>
                </button>
                <button onclick="deleteSuspendedInvoice('${
                  inv.id
                }')" title="حذف الفاتورة" class="btn btn-xs btn-error text-white">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div class="text-left pt-2 border-t border-gray-100 flex justify-between items-center">
              <span class="text-xs text-gray-500 font-medium">إجمالي المبلغ:</span>
              <span class="font-bold text-indigo-600 text-sm">${(
                inv.grandTotal || 0
              ).toFixed(2)} ج.م</span>
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;
}

async function suspendCurrentInvoice() {
  if (invoiceItems.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "تنبيه",
      text: "لا يمكن تعليق فاتورة فارغة. يرجى إضافة منتجات أولاً.",
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return;
  }

  const invoiceData = {
    invoiceNumber: document.getElementById("invoiceNumber").textContent,
    customerName: document.getElementById("customerName").value,
    customerPhone: document.getElementById("customerPhone").value,
    paymentMethod: document.getElementById("paymentMethod").value,
    items: [...invoiceItems],
    subtotal: parseFloat(document.getElementById("subtotal").textContent) || 0,
    totalDiscount: parseFloat(
      document.getElementById("totalDiscount").textContent
    ) || 0,
    taxAmount: parseFloat(document.getElementById("taxAmount").textContent) || 0,
    grandTotal: parseFloat(document.getElementById("grandTotal").textContent) || 0,
  };

  try {
    await window.electronAPI.suspendInvoice(invoiceData);
    resetForm();
    await loadSuspendedInvoices();
    Swal.fire({
      icon: "success",
      title: "تم التعليق",
      text: "تم حفظ الفاتورة في قائمة الفواتير المعلقة بنجاح.",
      confirmButtonColor: "#4f46e5",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("خطأ في تعليق الفاتورة:", error);
    Swal.fire({
      icon: "error",
      title: "عذراً",
      text: "تعذر تعليق الفاتورة حالياً، يرجى المحاولة مرة أخرى.",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "حسناً",
    });
  }
}

async function resumeSuspendedInvoice(invoiceId) {
  if (invoiceItems.length > 0) {
    const result = await Swal.fire({
      title: "تنبيه الاستبدال",
      text: "توجد فاتورة حالية بها عناصر. هل ترغب في استبدالها بالفاتورة المعلقة؟",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، استبدال",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;
  }

  try {
    const invoice = await window.electronAPI.resumeInvoice(invoiceId);
    if (!invoice) throw new Error("لم يتم العثور على بيانات الفاتورة المعلقة.");
    
    invoiceItems = invoice.items || [];
    document.getElementById("customerName").value = invoice.customerName || "";
    document.getElementById("customerPhone").value =
      invoice.customerPhone || "";
    document.getElementById("paymentMethod").value =
      invoice.paymentMethod || "cash";
    
    document.getElementById("subtotal").textContent =
      (invoice.subtotal || 0).toFixed(2) + " ج.م";
    document.getElementById("totalDiscount").textContent =
      (invoice.totalDiscount || 0).toFixed(2) + " ج.م";
    document.getElementById("taxAmount").textContent =
      (invoice.taxAmount || 0).toFixed(2) + " ج.م";
    document.getElementById("grandTotal").textContent =
      (invoice.grandTotal || 0).toFixed(2) + " ج.م";
    
    renderItems();
    await loadSuspendedInvoices();
    Swal.fire({
      icon: "success",
      title: "تم الاسترجاع",
      text: "تم استرجاع الفاتورة المعلقة بنجاح.",
      confirmButtonColor: "#4f46e5",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("خطأ في استرجاع الفاتورة:", error);
    Swal.fire({
      icon: "error",
      title: "عذراً",
      text: "تعذر استرجاع الفاتورة المعلقة.",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "حسناً",
    });
  }
}

async function deleteSuspendedInvoice(invoiceId) {
  const result = await Swal.fire({
    title: "حذف الفاتورة المعلقة",
    text: "هل أنت متأكد من رغبتك في حذف هذه الفاتورة المعلقة نهائياً؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "نعم، حذف",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
  });

  if (result.isConfirmed) {
    try {
      await window.electronAPI.deleteSuspendedInvoice(invoiceId);
      const container = document.getElementById("suspendedInvoicesContainer");
      if (container) {
        const invoiceElement = container.querySelector(`[data-id="${invoiceId}"]`);
        if (invoiceElement) {
          invoiceElement.remove();
        }
      }
      Swal.fire({
        icon: "success",
        title: "تم الحذف",
        text: "تم حذف الفاتورة المعلقة بنجاح.",
        confirmButtonColor: "#4f46e5",
        timer: 1500,
        showConfirmButton: false,
      });
      await loadSuspendedInvoices();
    } catch (error) {
      console.error("خطأ في حذف الفاتورة المعلقة:", error);
      Swal.fire({
        icon: "error",
        title: "عذراً",
        text: "تعذر حذف الفاتورة المعلقة، يرجى المحاولة مرة أخرى.",
        confirmButtonColor: "#ef4444",
        confirmButtonText: "حسناً",
      });
    }
  }
}

function resetForm() {
  invoiceItems = [];
  renderItems();
  const searchInput = document.getElementById("productSearch");
  if (searchInput) {
    searchInput.value = "";
    if (typeof clearFieldInvalid === "function") clearFieldInvalid(searchInput);
  }
  const categorySelect = document.getElementById("categorySelect");
  if (categorySelect) categorySelect.value = "";
  const customerName = document.getElementById("customerName");
  if (customerName) customerName.value = "";
  const customerPhone = document.getElementById("customerPhone");
  if (customerPhone) customerPhone.value = "";
  const paymentMethod = document.getElementById("paymentMethod");
  if (paymentMethod) paymentMethod.value = "cash";
  
  const discountAmt = document.getElementById("currentDiscountAmount");
  if (discountAmt) discountAmt.value = "";
  const discountPct = document.getElementById("currentDiscountPercentage");
  if (discountPct) discountPct.value = "";
  
  const paidInput = document.getElementById("paidAmount");
  if (paidInput) paidInput.value = "";
  
  document.getElementById("invoiceDate").textContent =
    new Date().toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  calculateTotals();
}

async function saveInvoice() {
  if (invoiceItems.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "فاتورة فارغة",
      text: "لا يمكن حفظ فاتورة فارغة. يرجى إضافة منتج واحد على الأقل إلى جدول الفاتورة.",
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return { success: false };
  }

  const c = document.getElementById("customerName").value.trim() || "عميل نقدي";
  const p = document.getElementById("customerPhone").value.trim() || "";
  const m = document.getElementById("paymentMethod").value;
  const t = getInvoiceTotals();
  let n = document.getElementById("invoiceNumber").textContent.trim();

  if (document.getElementById("invoiceNumber").dataset.isSaving === "true")
    return { success: false };
  document.getElementById("invoiceNumber").dataset.isSaving = "true";

  try {
    const existingSales = (await window.electronAPI.getSales()) || [];
    if (existingSales.some((sale) => sale.invoiceNumber === n)) {
      n = await window.electronAPI.getNextInvoiceNumber();
      document.getElementById("invoiceNumber").textContent = n;
    }

    // التحقق من توافر الكميات بالمخزون
    const ps = (await window.electronAPI.getProducts()) || [];
    for (const i of invoiceItems) {
      const pr = ps.find((prod) => prod._id === i._id);
      if (pr && pr.quantity < i.quantity) {
        Swal.fire({
          icon: "warning",
          title: "تنبيه المخزون",
          text: `الكمية المتوفرة من منتج "${pr.name}" هي (${pr.quantity}) فقط، وهي أقل من الكمية المطلوبة في الفاتورة (${i.quantity}).`,
          confirmButtonColor: "#4f46e5",
          confirmButtonText: "حسناً",
        });
        return { success: false, newInvoiceNumber: n };
      }
    }

    const s = {
      invoiceNumber: n,
      date: new Date().toISOString(),
      customerName: c,
      customerPhone: p,
      items: invoiceItems,
      subtotal: t.subtotal,
      discount: t.totalDiscount,
      tax: t.taxAmount,
      total: t.grandTotal,
      paymentMethod: m,
    };

    const cs = (await window.electronAPI.getCustomers()) || [];
    if (c !== "عميل نقدي" && !cs.some((cust) => cust.name === c)) {
      await window.electronAPI.addCustomer({
        name: c,
        phone: p,
        dateAdded: new Date().toISOString(),
      });
    }
    await window.electronAPI.addSale(s);
    try {
      const updatedSales = (await window.electronAPI.getSales()) || [];
      updatedSales.sort((a, b) => new Date(b.date) - new Date(a.date));
      localStorage.setItem("managely_sales_cache", JSON.stringify(updatedSales));
    } catch (e) {}

    for (const i of invoiceItems) {
      const pr = ps.find((prod) => prod._id === i._id);
      if (pr) {
        const q = Math.max(0, pr.quantity - i.quantity);
        await window.electronAPI.updateProduct(pr._id, { ...pr, quantity: q });
      }
    }

    // تحديث المنتجات في الذاكرة
    await loadProducts();

    const newInvoiceNumber = await window.electronAPI.getNextInvoiceNumber();
    document.getElementById("invoiceNumber").textContent = newInvoiceNumber;
    await loadSuspendedInvoices();

    resetForm();
    Swal.fire({
      icon: "success",
      title: "تم الحفظ بنجاح",
      text: "تم تسجيل الفاتورة وتحديث المخزون بنجاح.",
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return { success: true, newInvoiceNumber };
  } catch (e) {
    console.error("خطأ أثناء حفظ الفاتورة:", e);
    Swal.fire({
      icon: "error",
      title: "عذراً",
      text: "تعذر حفظ الفاتورة، يرجى مراجعة البيانات والمحاولة مرة أخرى.",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "حسناً",
    });
    return { success: false, newInvoiceNumber: n };
  } finally {
    document.getElementById("invoiceNumber").dataset.isSaving = "false";
  }
}

async function printInvoice() {
  if (invoiceItems.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "فاتورة فارغة",
      text: "لا يمكن طباعة فاتورة فارغة. يرجى إضافة منتجات أولاً.",
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return;
  }

  const c = document.getElementById("customerName").value.trim() || "عميل نقدي",
    p = document.getElementById("customerPhone").value.trim() || "غير متوفر",
    m = document.getElementById("paymentMethod").value,
    n = document.getElementById("invoiceNumber").textContent.trim(),
    d = document.getElementById("invoiceDate").textContent.trim(),
    i = [...invoiceItems],
    t = getInvoiceTotals(),
    paidVal = parseFloat(document.getElementById("paidAmount")?.value) || 0,
    changeVal = Math.max(0, paidVal - t.grandTotal),
    mt =
      { cash: "كاش", vodafoneCash: "فودافون كاش", visaCard: "كارد فيزا" }[m] ||
      "غير محدد";

  const result = await saveInvoice();
  if (!result || !result.success) {
    return;
  }

  const s = (await window.electronAPI.getSettings()) || {},
    h = `<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:'Tajawal',sans-serif;margin:0 auto;padding:4px;text-align:center;font-size:11px;width:72mm;max-width:72mm;box-sizing:border-box;color:#000;border:1px solid #000;border-radius:5px}.header img{max-width:40px;max-height:40px;margin-bottom:3px;border:1px solid #000;border-radius:50%}.header h1{font-size:12px;margin:3px 0;font-weight:bold}.header p,.customer-info p{margin:1px 0;font-size:9px}.divider{margin:3px 0;font-size:7px;color:#555}.customer-info{margin-bottom:3px}table{width:100%;margin:5px 0;font-size:9px}th,td{border:1px solid #000;padding:3px 2px;text-align:center}th{background-color:#f0f0f0;font-weight:bold}.totals p{margin:2px 0;font-size:9px}.grand-total{font-weight:bold;font-size:11px;border:1px solid #000;border-radius:5px;padding:3px;margin-top:3px;display:flex;justify-content:center;align-items:center}.footer{margin-top:3px;font-size:8px}</style></head><body><div class="header">${
      s.logo ? `<img src="${s.logo}" alt="Logo">` : ""
    }<h1>${s.storeName || "اسم المحل"}</h1><p>${
      s.storeLocation || "غير متوفر"
    }</p><p>${
      s.phoneNumbers?.join(" - ") || "غير متوفر"
    }</p><p class="divider">------------------------------------------------------------------------</p><p>فاتورة بيع #${n}</p><p>التاريخ: ${d}</p></div><p class="divider">-------------------------------------------------------------------------</p><div class="customer-info"><p>العميل: ${c} | ${p}</p></div><table><thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${i
      .map(
        (item) =>
          `<tr><td>${item.name}</td><td>${
            item.quantity
          }</td><td>${item.price.toFixed(2)} ج.م</td><td>${(
            item.quantity * item.price
          ).toFixed(2)} ج.م</td></tr>`
      )
      .join(
        ""
      )}</tbody></table><div class="totals"><p>الإجمالي الفرعي: ${t.subtotal.toFixed(
      2
    )} ج.م</p><p>الخصم: ${t.totalDiscount.toFixed(
      2
    )} ج.م</p><p>الضريبة: ${t.taxAmount.toFixed(
      2
    )} ج.م</p><p class="grand-total">الإجمالي النهائي: ${t.grandTotal.toFixed(
      2
    )} ج.م</p><p>طريقة الدفع: ${mt}</p>${paidVal > 0 ? `<p>المبلغ المستلم: ${paidVal.toFixed(2)} ج.م</p><p>الباقي للعميل: ${changeVal.toFixed(2)} ج.م</p>` : ""}</div><div class="footer"><p class="divider">-----------------------------------------------------------------------------------</p><p>شكرًا لزيارتكم | نتمنى لكم يومًا سعيدًا</p></div></body></html>`;
  try {
    const r = await window.electronAPI.printInvoiceToPOS(h, n, "mini");
    if (r && r.success) {
      Swal.fire({
        icon: "success",
        title: "تمت الطباعة",
        text: "تم إرسال الفاتورة للطباعة الحرارية بنجاح.",
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "حسناً",
      });
      resetForm();
    } else {
      const pdfPath = await window.electronAPI.printInvoiceToPDF(h, n, "mini");
      Swal.fire({
        icon: "info",
        title: "تصدير الفاتورة",
        text: pdfPath ? `تم تصدير الفاتورة بنجاح كملف PDF في: ${pdfPath}` : "تم تصدير الفاتورة كملف PDF بنجاح.",
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "حسناً",
      });
      resetForm();
    }
  } catch (e) {
    console.error("خطأ أثناء الطباعة أو التصدير:", e);
    Swal.fire({
      icon: "error",
      title: "عذراً",
      text: "تعذر استكمال الطباعة أو التصدير حالياً.",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "حسناً",
    });
  }
}

async function deleteInvoice() {
  if (invoiceItems.length === 0) {
    resetForm();
    return;
  }

  const result = await Swal.fire({
    title: "تفريغ الفاتورة",
    text: "هل أنت متأكد من رغبتك في تفريغ جميع منتجات الفاتورة الحالية؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "نعم، تفريغ",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
  });

  if (result.isConfirmed) {
    resetForm();
    Swal.fire({
      icon: "success",
      title: "تم التفريغ",
      text: "تم تفريغ محتويات الفاتورة الحالية بنجاح.",
      confirmButtonColor: "#4f46e5",
      timer: 1500,
      showConfirmButton: false,
    });
  }
}

if (window.electronAPI) {
  window.electronAPI.onOpenPage((page) => {
    window.location.href = page;
  });
}

window.addProductToInvoice = addProductToInvoice;
window.filterProducts = filterProducts;
window.searchProducts = searchProducts;
window.selectProduct = selectProduct;
window.selectAutocompleteItem = selectAutocompleteItem;
window.handleProductSearchKeydown = handleProductSearchKeydown;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.updateDiscount = updateDiscount;
window.calculateTotals = calculateTotals;
window.saveInvoice = saveInvoice;
window.printInvoice = printInvoice;
window.deleteInvoice = deleteInvoice;
window.openDefaultDiscountSettings = openDefaultDiscountSettings;
window.loadCustomers = loadCustomers;
window.updateCustomerOptions = updateCustomerOptions;
window.handleCustomerSelection = handleCustomerSelection;
window.handleInvoiceBarcodeScan = handleInvoiceBarcodeScan;
window.suspendCurrentInvoice = suspendCurrentInvoice;
window.resumeSuspendedInvoice = resumeSuspendedInvoice;
window.calculateChange = calculateChange;
window.setExactPaid = setExactPaid;
window.addQuickCash = addQuickCash;

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const wrapper = document.querySelector(".autocomplete-wrapper");
  if (wrapper && !wrapper.contains(e.target)) {
    const dropdown = document.getElementById("productDropdown");
    if (dropdown) { dropdown.classList.remove("open"); dropdown.innerHTML = ""; }
    _dropdownActiveIndex = -1;
  }
});


// اختصارات لوحة المفاتيح لنقاط البيع السريعة
window.addEventListener("keydown", (e) => {
  // عدم التفعيل إذا كانت نافذة تنبيه SweetAlert مفتوحة
  if (document.querySelector(".swal2-shown")) return;

  if (e.key === "F2") {
    e.preventDefault();
    printInvoice();
  } else if (e.key === "F1") {
    e.preventDefault();
    saveInvoice();
  } else if (e.key === "F4") {
    e.preventDefault();
    suspendCurrentInvoice();
  } else if (e.key === "F3") {
    e.preventDefault();
    const searchInput = document.getElementById("productSearch");
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  } else if (e.key === "Escape") {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "SELECT") && activeEl.value) {
      activeEl.value = "";
    } else {
      e.preventDefault();
      deleteInvoice();
    }
  }
});

window.onload = initPage;
