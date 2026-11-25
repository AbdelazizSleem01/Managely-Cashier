import { markFieldInvalid, clearFieldInvalid, initSweetAlertWrapper } from "./shared.js";
import { updateShiftBadgeUI, handleShiftBadgeClick } from "./shift-manager.js";
import { buildSalesReceipt } from "./receipt-template.js";

// ==========================================================================
// POS Global State & Variables
// ==========================================================================
let invoiceItems = [];
let allProducts = [];
let allCustomers = [];
let suspendedInvoices = [];
let storeCurrencies = [];
let activeCurrency = {
  code: "EGP",
  name: "جنيه مصري",
  symbol: "ج.م",
  exchangeRate: 1,
  isDefault: true,
};
let currentPaymentMethod = "cash";
let defaultDiscount = 0;
let defaultDiscountType = "fixed";
let defaultTax = 0;
let defaultTaxType = "percentage";
let defaultTaxEnabled = false;
let lastTaxSource = "percentage";
let lastDiscountSource = "amount";
let _productDropdownActiveIndex = -1;
let _customerDropdownActiveIndex = -1;
let _audioCtx = null;
let _draftSaveTimeout = null;

// Customer Loyalty Points State
let _posLoyaltySettings = { loyaltyEnabled: true, loyaltySpendPerPoint: 10, loyaltyPointValue: 0.10 };
let currentPointsRedeemed = 0;
let currentPointsDiscount = 0;


// ==========================================================================
// Web Audio API Zero-Latency POS Sound Synthesizer
// ==========================================================================
function getAudioContext() {
  if (!_audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      _audioCtx = new AudioContextClass();
    }
  }
  if (_audioCtx && _audioCtx.state === "suspended") {
    _audioCtx.resume();
  }
  return _audioCtx;
}

function playSound(type = "beep") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (type === "success" || type === "beep") {
      // Crisp 880Hz POS scanner beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "error" || type === "buzz") {
      // 220Hz downward buzz for not-found or stock warning
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.23);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    } else if (type === "hold" || type === "chime") {
      // Two-tone cheerful chime for hold / suspend
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now);
      osc2.frequency.setValueAtTime(659.25, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.3);
    }
  } catch (err) {
    console.warn("Audio playback not supported or blocked:", err);
  }
}

// ==========================================================================
// Focus Helper (Keeps Barcode Scanner Ready at All Times)
// ==========================================================================
function focusSearchInput() {
  setTimeout(() => {
    const searchInput = document.getElementById("productSearch");
    if (searchInput && document.activeElement !== searchInput) {
      const currentActive = document.activeElement;
      const isTypingInOtherForm =
        currentActive &&
        (currentActive.id === "customerName" ||
          currentActive.id === "customerPhone" ||
          currentActive.id === "paidAmount" ||
          currentActive.id === "splitCashAmount" ||
          currentActive.id === "splitCardAmount" ||
          currentActive.id === "currentDiscountAmount" ||
          currentActive.id === "currentDiscountPercentage" ||
          currentActive.classList.contains("pos-qty-input") ||
          currentActive.classList.contains("pos-price-input") ||
          currentActive.classList.contains("pos-item-discount-input") ||
          currentActive.closest(".modal-box"));

      if (!isTypingInOtherForm) {
        searchInput.focus();
        searchInput.select();
      }
    }
  }, 50);
}

// ==========================================================================
// Page Initialization & Event Binding
// ==========================================================================
async function initPage() {
  const today = new Date();
  const eestOffset = 3 * 60;
  const localDate = new Date(today.getTime() + eestOffset * 60 * 1000);
  const currentDate = localDate.toISOString().split("T")[0].replace(/-/g, "");

  // Load next invoice number
  try {
    let currentInvoiceNumber = "INV - 1 - " + currentDate;
    if (window.electronAPI && window.electronAPI.getSales) {
      const sales = (await window.electronAPI.getSales()) || [];
      if (sales.length > 0) {
        const lastInvoice = sales.sort((a, b) => {
          const aNum = parseInt((a.invoiceNumber || "").split("-")[1] || 0);
          const bNum = parseInt((b.invoiceNumber || "").split("-")[1] || 0);
          return bNum - aNum;
        })[0].invoiceNumber;
        const lastSequence = parseInt((lastInvoice || "").split("-")[1] || 0);
        currentInvoiceNumber = `INV - ${lastSequence + 1} - ${currentDate}`;
      }
    }
    const invEl = document.getElementById("invoiceNumber");
    if (invEl) invEl.textContent = currentInvoiceNumber;
  } catch (e) {
    console.error("Error setting invoice number:", e);
  }

  const dateEl = document.getElementById("invoiceDate");
  if (dateEl) {
    dateEl.textContent = localDate.toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Load Data
  await loadCurrencies();
  await loadProducts();
  await loadCustomers();
  await loadCategories();
  await loadDefaultDiscount();
  await loadDefaultTax();
  await loadStoreInfo();
  await loadLoyaltySettings();
  await loadSuspendedInvoices();


  // Render initial table
  renderItems();

  // Update Active Shift Badge
  if (typeof updateShiftBadgeUI === "function") {
    updateShiftBadgeUI();
  }

  // Check for auto-draft recovery
  checkDraftRecovery();

  // Focus search input
  focusSearchInput();

  // Global click to close autocomplete dropdowns
  document.addEventListener("click", (e) => {
    const productDropdown = document.getElementById("productDropdown");
    const productWrapper = document.querySelector(".search-input-wrapper");
    if (productDropdown && productWrapper && !productWrapper.contains(e.target)) {
      productDropdown.classList.remove("open");
      productDropdown.innerHTML = "";
      _productDropdownActiveIndex = -1;
    }

    const customerDropdown = document.getElementById("customerDropdown");
    const customerGroup = document.getElementById("customerName")?.parentElement;
    if (customerDropdown && customerGroup && !customerGroup.contains(e.target)) {
      customerDropdown.classList.remove("open");
      customerDropdown.innerHTML = "";
      _customerDropdownActiveIndex = -1;
    }
  });

  // Setup Hidden Barcode Scanner Input Listener if needed
  const hiddenScanner = document.getElementById("invoiceBarcodeScannerInput");
  if (hiddenScanner) {
    hiddenScanner.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleBarcodeDirectScan(hiddenScanner.value.trim());
        hiddenScanner.value = "";
      }
    });
  }
}

// ==========================================================================
// Store & Settings Info
// ==========================================================================
async function loadStoreInfo() {
  try {
    if (!window.electronAPI || !window.electronAPI.getSettings) return;
    const s = (await window.electronAPI.getSettings()) || {};
    const n = document.getElementById("storeNamePreview");
    if (n) {
      n.textContent = s.storeName ? `فرع: ${s.storeName}` : "الفرع الرئيسي";
    }
  } catch (err) {
    console.error("Error loading store info:", err);
  }
}

async function loadProducts() {
  try {
    if (window.electronAPI && window.electronAPI.getProducts) {
      allProducts = (await window.electronAPI.getProducts()) || [];
    }
  } catch (err) {
    console.error("Error loading products:", err);
    allProducts = [];
  }
}

async function loadCustomers() {
  try {
    if (window.electronAPI && window.electronAPI.getCustomers) {
      allCustomers = (await window.electronAPI.getCustomers()) || [];
    }
  } catch (err) {
    console.error("Error loading customers:", err);
    allCustomers = [];
  }
}

async function loadCategories() {
  try {
    if (!window.electronAPI || !window.electronAPI.getCategories) return;
    const categories = (await window.electronAPI.getCategories()) || [];
    const select = document.getElementById("categorySelect");
    if (!select) return;

    select.innerHTML = '<option value="">جميع التصنيفات</option>';
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading categories:", err);
  }
}

// ==========================================================================
// Currency Management & Active Switcher for POS
// ==========================================================================
async function loadCurrencies() {
  try {
    if (window.electronAPI && window.electronAPI.getCurrencies) {
      storeCurrencies = (await window.electronAPI.getCurrencies()) || [];
    }
    if (!storeCurrencies || storeCurrencies.length === 0) {
      storeCurrencies = [
        { code: "EGP", name: "جنيه مصري", symbol: "ج.م", exchangeRate: 1, isDefault: true }
      ];
    }
    const defaultCurr = storeCurrencies.find((c) => c.isDefault) || storeCurrencies[0];
    activeCurrency = { ...defaultCurr };
    renderCurrencySelector();
    updateCurrencySymbolsUI();
  } catch (err) {
    console.error("Error loading currencies:", err);
  }
}

function renderCurrencySelector() {
  const select = document.getElementById("invoiceCurrencySelect");
  if (!select) return;
  select.innerHTML = storeCurrencies.map((c) => `
    <option value="${c.code}" ${c.code === activeCurrency.code ? "selected" : ""}>
      ${c.code} (${c.symbol})
    </option>
  `).join("");
}

function updateCurrencySymbolsUI() {
  const sym = activeCurrency ? activeCurrency.symbol : "ج.م";
  document.querySelectorAll(".pos-split-currency-symbol, .pos-currency-symbol").forEach((el) => {
    el.textContent = sym;
  });
  // Update price column header in items table
  const priceColHeader = document.getElementById("priceColumnCurrency");
  if (priceColHeader) priceColHeader.textContent = sym;
}

function getProductActivePrice(p) {
  if (!p) return 0;
  if (p.currencyPrices && Array.isArray(p.currencyPrices) && p.currencyPrices.length > 0) {
    const custom = p.currencyPrices.find((cp) => cp.currencyCode === activeCurrency.code);
    if (custom && Number(custom.price) > 0) {
      return Number(custom.price);
    }
  }
  const base = Number(p.price || 0);
  if (activeCurrency.isDefault) return base;
  const rate = Number(activeCurrency.exchangeRate) || 1;
  return rate > 0 ? parseFloat((base / rate).toFixed(2)) : base;
}

function setInvoiceCurrency(currencyCode) {
  const found = storeCurrencies.find((c) => c.code === currencyCode);
  if (!found) return;
  activeCurrency = { ...found };
  renderCurrencySelector();
  updateCurrencySymbolsUI();

  // Convert all items currently in invoiceItems
  invoiceItems.forEach((item) => {
    const p = allProducts.find((prod) => prod._id === item._id);
    const basePrice = Number(item.basePrice !== undefined ? item.basePrice : (p ? p.price : item.price));
    item.basePrice = basePrice;

    if (p && p.currencyPrices && Array.isArray(p.currencyPrices) && p.currencyPrices.length > 0) {
      const customCurr = p.currencyPrices.find((cp) => cp.currencyCode === activeCurrency.code);
      if (customCurr && Number(customCurr.price) > 0) {
        item.price = Number(customCurr.price);
        return;
      }
    }

    if (activeCurrency.isDefault) {
      item.price = basePrice;
    } else {
      const rate = Number(activeCurrency.exchangeRate) || 1;
      item.price = rate > 0 ? parseFloat((basePrice / rate).toFixed(2)) : basePrice;
    }
  });

  renderItems();
  calculateTotals();
  saveDraftToStorage();
}

// ==========================================================================
// Product Search & Barcode Scanning Autocomplete
// ==========================================================================
function filterProductsByCategory() {
  const searchVal = (document.getElementById("productSearch")?.value || "").trim();
  searchProducts(searchVal);
}

function searchProducts(query = "") {
  const dropdown = document.getElementById("productDropdown");
  if (!dropdown) return;

  const category = document.getElementById("categorySelect")?.value || "";
  const trimmed = query.trim().toLowerCase();

  if (!trimmed && !category) {
    dropdown.classList.remove("open");
    dropdown.innerHTML = "";
    _productDropdownActiveIndex = -1;
    return;
  }

  let filtered = allProducts.filter((p) => {
    const matchCategory = !category || p.category === category;
    const matchQuery =
      !trimmed ||
      (p.name && p.name.toLowerCase().includes(trimmed)) ||
      (p.barcode && p.barcode.toLowerCase().includes(trimmed)) ||
      (p.sku && p.sku.toLowerCase().includes(trimmed));
    return matchCategory && matchQuery;
  });

  if (filtered.length === 0) {
    dropdown.innerHTML = `
      <div class="p-3 text-center text-gray-400 text-sm">
        <i class="fas fa-search-minus ml-1.5"></i>
        <span>لا توجد منتجات مطابقة للبحث</span>
      </div>
    `;
    dropdown.classList.add("open");
    _productDropdownActiveIndex = -1;
    return;
  }

  _productDropdownActiveIndex = -1;
  dropdown.innerHTML = filtered.slice(0, 20).map((p, index) => {
    const activePrice = getProductActivePrice(p);
    const priceStr = activePrice.toFixed(2);
    const stock = Number(p.quantity || 0);
    let stockBadge = "";
    if (stock <= 0) {
      stockBadge = `<span class="pos-dropdown-stock !bg-red-50 !text-red-600 !border-red-200">نفد (${stock})</span>`;
    } else if (stock <= 5) {
      stockBadge = `<span class="pos-dropdown-stock !bg-amber-50 !text-amber-700 !border-amber-200">حرج (${stock})</span>`;
    } else {
      stockBadge = `<span class="pos-dropdown-stock">متوفر: ${stock}</span>`;
    }

    const imgTag = p.image
      ? `<img src="${p.image}" class="pos-dropdown-thumb" alt="${p.name}">`
      : `<div class="pos-dropdown-thumb-placeholder"><i class="fas fa-box"></i></div>`;

    const barcodeHtml = p.barcode
      ? `<span class="text-[11px] text-gray-400 font-mono">${p.barcode}</span>`
      : "";

    return `
      <div class="pos-dropdown-item" data-index="${index}" data-id="${p._id}" onclick="selectAutocompleteItem('${p._id}')">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          ${imgTag}
          <div class="flex flex-col min-w-0">
            <span class="pos-dropdown-name truncate">${p.name}</span>
            ${barcodeHtml}
          </div>
        </div>
        <div class="flex items-center gap-2 mr-2">
          ${stockBadge}
          <span class="pos-dropdown-price">${priceStr} ${activeCurrency ? activeCurrency.symbol : "ج.م"}</span>
        </div>
      </div>
    `;
  }).join("");

  dropdown.classList.add("open");
}

function handleProductSearchKeydown(event) {
  const dropdown = document.getElementById("productDropdown");
  const items = dropdown ? dropdown.querySelectorAll(".pos-dropdown-item") : [];

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (items.length === 0) return;
    _productDropdownActiveIndex = Math.min(_productDropdownActiveIndex + 1, items.length - 1);
    items.forEach((el, idx) => el.classList.toggle("active", idx === _productDropdownActiveIndex));
    if (items[_productDropdownActiveIndex]) {
      items[_productDropdownActiveIndex].scrollIntoView({ block: "nearest" });
    }
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    if (items.length === 0) return;
    _productDropdownActiveIndex = Math.max(_productDropdownActiveIndex - 1, 0);
    items.forEach((el, idx) => el.classList.toggle("active", idx === _productDropdownActiveIndex));
    if (items[_productDropdownActiveIndex]) {
      items[_productDropdownActiveIndex].scrollIntoView({ block: "nearest" });
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (_productDropdownActiveIndex >= 0 && items[_productDropdownActiveIndex]) {
      const prodId = items[_productDropdownActiveIndex].dataset.id;
      selectAutocompleteItem(prodId);
    } else {
      addProductToInvoice();
    }
  } else if (event.key === "Escape") {
    if (dropdown) {
      dropdown.classList.remove("open");
      dropdown.innerHTML = "";
    }
    _productDropdownActiveIndex = -1;
  }
}

function selectAutocompleteItem(productId) {
  const dropdown = document.getElementById("productDropdown");
  if (dropdown) {
    dropdown.classList.remove("open");
    dropdown.innerHTML = "";
  }
  _productDropdownActiveIndex = -1;

  const product = allProducts.find((p) => p._id === productId);
  if (product) {
    addProductEntity(product);
  }
}

function handleBarcodeDirectScan(barcode) {
  if (!barcode) return;
  const product = allProducts.find((p) => p.barcode && p.barcode.trim() === barcode.trim());
  if (product) {
    addProductEntity(product);
  } else {
    playSound("error");
    Swal.fire({
      icon: "warning",
      title: "الباركود غير مسجل",
      text: `لم يتم العثور على أي منتج مرتبط بالباركود (${barcode}).`,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
  }
}

function parseScaleBarcode(query) {
  const clean = (query || "").trim();
  if (/^(99|20|21)\d{11}$/.test(clean)) {
    const prefix = clean.substring(0, 2);
    const itemCode = clean.substring(2, 7); // 5-digit product code
    const weightRaw = clean.substring(7, 12); // 5-digit weight in grams
    const weightKg = parseFloat(weightRaw) / 1000;
    return {
      isScale: true,
      prefix,
      itemCode,
      weightKg: weightKg > 0 ? weightKg : 1,
      fullBarcode: clean,
    };
  }
  return null;
}

async function addProductToInvoice() {
  const searchInput = document.getElementById("productSearch");
  const query = searchInput ? searchInput.value.trim() : "";

  if (!query) {
    if (searchInput) {
      markFieldInvalid(searchInput, "يرجى كتابة اسم المنتج أو مسح الباركود.");
      searchInput.focus();
    }
    playSound("error");
    return;
  }

  const scaleInfo = parseScaleBarcode(query);
  let product = null;
  let qtyToAdd = 1;

  if (scaleInfo) {
    const strippedCode = scaleInfo.itemCode.replace(/^0+/, "");
    product = allProducts.find(
      (p) =>
        (p.barcode && p.barcode.trim() === scaleInfo.itemCode) ||
        (p.barcode && p.barcode.trim() === strippedCode) ||
        (p.sku && p.sku.trim() === scaleInfo.itemCode) ||
        (p.sku && p.sku.trim() === strippedCode) ||
        (p.barcode && p.barcode.trim() === scaleInfo.fullBarcode)
    );
    if (product) {
      qtyToAdd = scaleInfo.weightKg;
    }
  }

  if (!product) {
    const queryLower = query.toLowerCase();

    // 1. Check exact barcode match first
    product = allProducts.find(
      (p) => p.barcode && p.barcode.trim().toLowerCase() === queryLower
    );

    // 2. Check exact name match
    if (!product) {
      product = allProducts.find(
        (p) => p.name && p.name.trim().toLowerCase() === queryLower
      );
    }

    // 3. Check single partial match
    if (!product) {
      const matches = allProducts.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(queryLower)) ||
          (p.barcode && p.barcode.toLowerCase().includes(queryLower))
      );
      if (matches.length === 1) {
        product = matches[0];
      }
    }
  }

  if (!product) {
    playSound("error");
    if (searchInput) markFieldInvalid(searchInput, "المنتج أو الباركود غير مسجل في قائمة المنتجات.");
    return;
  }

  addProductEntity(product, qtyToAdd);
}

function addProductEntity(product, qtyToAdd = 1) {
  const searchInput = document.getElementById("productSearch");
  const stock = Number(product.quantity || 0);

  if (stock <= 0) {
    playSound("error");
    Swal.fire({
      icon: "warning",
      title: "نفدت الكمية",
      text: `عذراً، منتج "${product.name}" غير متوفر حالياً في المخزون (الرصيد 0).`,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return;
  }

  const existingIndex = invoiceItems.findIndex((i) => i._id === product._id);

  if (existingIndex >= 0) {
    const currentQty = Number(invoiceItems[existingIndex].quantity || 0);
    const newQty = parseFloat((currentQty + Number(qtyToAdd)).toFixed(3));
    if (newQty > stock) {
      playSound("error");
      Swal.fire({
        icon: "warning",
        title: "تنبيه المخزون",
        text: `الكمية المتوفرة بالمخزون من "${product.name}" هي (${stock}) فقط.`,
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "حسناً",
      });
      return;
    }
    invoiceItems[existingIndex].quantity = newQty;
  } else {
    const initialQty = parseFloat(Number(qtyToAdd).toFixed(3));
    if (initialQty > stock) {
      playSound("error");
      Swal.fire({
        icon: "warning",
        title: "تنبيه المخزون",
        text: `الكمية المتوفرة بالمخزون من "${product.name}" هي (${stock}) فقط.`,
        confirmButtonColor: "#4f46e5",
        confirmButtonText: "حسناً",
      });
      return;
    }
    const unitPrice = getProductActivePrice(product);
    invoiceItems.push({
      _id: product._id,
      name: product.name,
      basePrice: Number(product.price || 0),
      currencyPrices: product.currencyPrices || [],
      price: unitPrice,
      costPrice: Number(product.costPrice || product.purchasePrice || 0),
      quantity: initialQty,
      stock: stock,
      barcode: product.barcode || "",
      image: product.image || "",
      discountType: "fixed",
      discountValue: 0,
    });
  }

  // Sound & Visual Feedback
  playSound("success");

  if (searchInput) {
    searchInput.value = "";
    if (typeof clearFieldInvalid === "function") clearFieldInvalid(searchInput);
  }

  const dropdown = document.getElementById("productDropdown");
  if (dropdown) {
    dropdown.classList.remove("open");
    dropdown.innerHTML = "";
  }
  _productDropdownActiveIndex = -1;

  renderItems();
  saveDraftToStorage();
  focusSearchInput();
}

// ==========================================================================
// Items Table Rendering & Live Updates
// ==========================================================================
function renderItems() {
  const tbody = document.getElementById("itemsTableBody");
  const emptyState = document.getElementById("tableEmptyState");
  if (!tbody) return;

  if (invoiceItems.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    calculateTotals();
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  tbody.innerHTML = invoiceItems
    .map((item, index) => {
      const lineSubtotal = item.price * item.quantity;
      const itemDiscountAmount =
        item.discountType === "percentage"
          ? (lineSubtotal * (item.discountValue || 0)) / 100
          : item.discountValue || 0;
      const lineTotal = Math.max(0, lineSubtotal - itemDiscountAmount);

      // Low stock row warning
      const isLowStock = item.stock <= 5 || item.quantity >= item.stock;
      const rowHighlight = isLowStock ? "bg-amber-50/40" : "";

      const imgHtml = item.image
        ? `<img src="${item.image}" class="pos-item-thumb" alt="${item.name}">`
        : `<div class="pos-item-thumb-placeholder"><i class="fas fa-box text-xs"></i></div>`;

      const stockBadge = isLowStock
        ? `<span class="pos-low-stock-badge"><i class="fas fa-exclamation-triangle ml-1"></i>المتبقي: ${item.stock}</span>`
        : `<span class="text-[11px] text-gray-400 font-medium">متاح: ${item.stock}</span>`;

      const barcodeHtml = item.barcode
        ? `<span class="pos-item-barcode">${item.barcode}</span>`
        : "";

      return `
        <tr class="hover:bg-purple-50/20 transition-colors ${rowHighlight}">
          <!-- Index -->
          <td class="text-center font-bold text-gray-400 text-xs">${index + 1}</td>

          <!-- Product Name & Thumbnail -->
          <td>
            <div class="pos-item-cell">
              ${imgHtml}
              <div class="pos-item-info">
                <span class="pos-item-name">${item.name}</span>
                <div class="pos-item-meta">
                  ${barcodeHtml}
                  ${stockBadge}
                </div>
              </div>
            </div>
          </td>

          <!-- Unit Price (Editable) -->
          <td class="text-center">
            <div class="relative inline-block w-24">
              <input 
                type="number" 
                value="${item.price}" 
                min="0" 
                step="any"
                onchange="updateItemPrice(${index}, this.value)"
                class="pos-price-input"
                title="تعديل سعر البيع للوحدة"
              >
            </div>
          </td>

          <!-- Quantity Stepper with Keyboard Support -->
          <td class="text-center">
            <div class="pos-qty-stepper">
              <button 
                type="button" 
                class="pos-qty-btn decrease" 
                onclick="decreaseQuantity(${index})" 
                title="تقليل الكمية"
              >
                <i class="fas fa-minus"></i>
              </button>
              
              <input 
                type="number" 
                value="${item.quantity}" 
                min="0.001" 
                step="any"
                max="${item.stock}"
                onchange="updateQuantity(${index}, this.value)"
                onkeydown="handleQuantityKeydown(event, ${index})"
                class="pos-qty-input"
                title="يمكنك استخدام الأسهم أو +/- لتعديل الكمية بالكيبورد"
              >

              <button 
                type="button" 
                class="pos-qty-btn increase" 
                onclick="increaseQuantity(${index})" 
                title="زيادة الكمية"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </td>

          <!-- Per-Item Discount -->
          <td class="text-center">
            <div class="pos-item-discount-group">
              <button 
                type="button" 
                class="pos-discount-toggle" 
                onclick="toggleItemDiscountType(${index})"
                title="التبديل بين خصم مبلغ أو نسبة مئوية"
              >
                ${item.discountType === "percentage" ? "%" : (activeCurrency ? activeCurrency.symbol : "ج.م")}
              </button>
              <input 
                type="number" 
                value="${item.discountValue || 0}" 
                min="0" 
                step="any"
                oninput="updateItemDiscountValue(${index}, this.value)"
                class="pos-item-discount-input" 
                placeholder="0"
              >
            </div>
          </td>

          <!-- Line Total -->
          <td class="text-center">
            <span class="font-black text-gray-900 text-sm">${lineTotal.toFixed(2)} ${activeCurrency ? activeCurrency.symbol : "ج.م"}</span>
          </td>

          <!-- Action (Delete) -->
          <td class="text-center">
            <button 
              type="button" 
              onclick="removeItem(${index})" 
              class="pos-btn-del" 
              title="حذف هذا الصنف من الفاتورة"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  calculateTotals();
}

// ==========================================================================
// Quantity & Price & Line-Discount Handlers
// ==========================================================================
function increaseQuantity(index) {
  const item = invoiceItems[index];
  if (!item) return;

  if (item.quantity + 1 > item.stock) {
    playSound("error");
    Swal.fire({
      icon: "warning",
      title: "تنبيه المخزون",
      text: `لا يمكن زيادة الكمية عن المتاح بالمخزون (${item.stock}).`,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return;
  }

  item.quantity = parseFloat((item.quantity + 1).toFixed(3));
  renderItems();
  saveDraftToStorage();
}

function decreaseQuantity(index) {
  const item = invoiceItems[index];
  if (!item) return;

  if (item.quantity > 1) {
    item.quantity = parseFloat((item.quantity - 1).toFixed(3));
    renderItems();
    saveDraftToStorage();
  } else if (item.quantity > 0.1) {
    item.quantity = parseFloat((item.quantity - 0.1).toFixed(3));
    renderItems();
    saveDraftToStorage();
  } else {
    removeItem(index);
  }
}

function updateQuantity(index, val) {
  const item = invoiceItems[index];
  if (!item) return;

  let newQty = parseFloat(val);
  if (isNaN(newQty) || newQty <= 0) newQty = 1;
  newQty = parseFloat(newQty.toFixed(3));

  if (newQty > item.stock) {
    newQty = item.stock;
    playSound("error");
    Swal.fire({
      icon: "warning",
      title: "تنبيه المخزون",
      text: `تم ضبط الكمية على الحد الأقصى المتوفر بالمخزون (${item.stock}).`,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
  }

  item.quantity = newQty;
  renderItems();
  saveDraftToStorage();
}

function handleQuantityKeydown(event, index) {
  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    increaseQuantity(index);
  } else if (event.key === "-" || event.key === "_") {
    event.preventDefault();
    decreaseQuantity(index);
  } else if (event.key === "Enter") {
    event.preventDefault();
    focusSearchInput();
  }
}

function updateItemPrice(index, val) {
  const item = invoiceItems[index];
  if (!item) return;

  if (typeof window.hasPermission === "function" && !window.hasPermission("canChangePrice")) {
    Swal.fire({
      icon: "warning",
      title: "صلاحية مقيدة",
      text: "ليس لديك صلاحية لتعديل سعر البيع أثناء عمل الفاتورة.",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "حسناً",
    });
    renderItems();
    return;
  }

  const newPrice = parseFloat(val) || 0;

  // Warning if selling below cost
  if (item.costPrice > 0 && newPrice < item.costPrice) {
    Swal.fire({
      icon: "warning",
      title: "تنبيه هامش الربح",
      text: `سعر البيع المدخل (${newPrice.toFixed(2)} ج.م) أقل من سعر التكلفة (${item.costPrice.toFixed(2)} ج.م).`,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "موافق والمتابعة",
    });
  }

  item.price = Math.max(0, newPrice);
  if (activeCurrency && activeCurrency.isDefault) {
    item.basePrice = item.price;
  } else if (activeCurrency && activeCurrency.exchangeRate > 0) {
    item.basePrice = Number((item.price * activeCurrency.exchangeRate).toFixed(2));
  }
  renderItems();
  saveDraftToStorage();
}

function toggleItemDiscountType(index) {
  const item = invoiceItems[index];
  if (!item) return;

  if (typeof window.hasPermission === "function" && !window.hasPermission("canApplyDiscount")) {
    Swal.fire({
      icon: "warning",
      title: "صلاحية مقيدة",
      text: "ليس لديك صلاحية لتطبيق خصم على الفاتورة.",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "حسناً",
    });
    return;
  }

  item.discountType = item.discountType === "fixed" ? "percentage" : "fixed";
  renderItems();
  saveDraftToStorage();
}

function updateItemDiscountValue(index, val) {
  const item = invoiceItems[index];
  if (!item) return;

  if (typeof window.hasPermission === "function" && !window.hasPermission("canApplyDiscount")) {
    Swal.fire({
      icon: "warning",
      title: "صلاحية مقيدة",
      text: "ليس لديك صلاحية لتطبيق خصم على الفاتورة.",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "حسناً",
    });
    renderItems();
    return;
  }

  let v = parseFloat(val) || 0;
  if (v < 0) v = 0;
  if (item.discountType === "percentage" && v > 100) v = 100;

  item.discountValue = v;
  renderItems();
  saveDraftToStorage();
}

function removeItem(index) {
  const item = invoiceItems[index];
  if (!item) return;

  if (typeof window.hasPermission === "function" && !window.hasPermission("canDeleteCartItem")) {
    Swal.fire({
      icon: "warning",
      title: "صلاحية مقيدة",
      text: "ليس لديك صلاحية لحذف أصناف من سلة الفاتورة.",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "حسناً",
    });
    return;
  }

  invoiceItems.splice(index, 1);
  renderItems();
  saveDraftToStorage();
  focusSearchInput();
}

// ==========================================================================
// Financial Breakdown & Totals Calculation
// ==========================================================================
function getSubtotal() {
  return invoiceItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

function getItemDiscountsTotal() {
  return invoiceItems.reduce((acc, item) => {
    const lineSubtotal = item.price * item.quantity;
    const itemDisc =
      item.discountType === "percentage"
        ? (lineSubtotal * (item.discountValue || 0)) / 100
        : item.discountValue || 0;
    return acc + Math.min(lineSubtotal, itemDisc);
  }, 0);
}

function getInvoiceTotals() {
  const subtotal = getSubtotal();
  const itemDiscounts = getItemDiscountsTotal();
  const invoiceDiscountInput = parseFloat(document.getElementById("currentDiscountAmount")?.value) || 0;

  // Default discount calculation
  const defaultDiscAmount =
    defaultDiscountType === "fixed"
      ? defaultDiscount
      : subtotal > 0
      ? (subtotal * defaultDiscount) / 100
      : 0;

  const totalDiscount = Math.min(subtotal, itemDiscounts + invoiceDiscountInput + defaultDiscAmount);
  const taxableAmount = Math.max(0, subtotal - totalDiscount);

  // Tax calculation (Dual: Amount or Percentage)
  const taxAmountInput = document.getElementById("currentTaxAmount");
  const taxPctInput = document.getElementById("currentTaxPercentage") || document.getElementById("taxRate");

  let taxRate = 0;
  let taxAmount = 0;

  const rawTaxAmt = taxAmountInput ? taxAmountInput.value.trim() : "";
  const rawTaxPct = taxPctInput ? taxPctInput.value.trim() : "";

  if (rawTaxAmt !== "" || rawTaxPct !== "") {
    if (lastTaxSource === "amount") {
      taxAmount = parseFloat(rawTaxAmt) || 0;
      taxRate = taxableAmount > 0 ? (taxAmount / taxableAmount) * 100 : 0;
    } else {
      taxRate = parseFloat(rawTaxPct) || 0;
      taxAmount = (taxableAmount * taxRate) / 100;
    }
  } else if (defaultTaxEnabled && defaultTax > 0) {
    if (defaultTaxType === "fixed") {
      taxAmount = defaultTax;
      taxRate = taxableAmount > 0 ? (defaultTax / taxableAmount) * 100 : 0;
    } else {
      taxRate = defaultTax;
      taxAmount = (taxableAmount * defaultTax) / 100;
    }
  }

  const grandTotal = Math.max(0, taxableAmount + taxAmount);

  return {
    subtotal,
    itemDiscounts,
    invoiceDiscountInput,
    defaultDiscount: defaultDiscAmount,
    totalDiscount,
    taxableAmount,
    taxRate,
    taxAmount,
    grandTotal,
  };
}

function updateInvoiceDiscount(source) {
  lastDiscountSource = source;
  const amountInput = document.getElementById("currentDiscountAmount");
  const pctInput = document.getElementById("currentDiscountPercentage");
  const subtotal = getSubtotal() || 0;

  if (typeof window.hasPermission === "function" && !window.hasPermission("canApplyDiscount")) {
    if (amountInput) amountInput.value = "";
    if (pctInput) pctInput.value = "";
    calculateTotals();
    Swal.fire({
      icon: "warning",
      title: "صلاحية مقيدة",
      text: "ليس لديك صلاحية لتطبيق خصم على الفاتورة.",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "حسناً",
    });
    return;
  }

  if (!amountInput || !pctInput) return;

  if (source === "amount") {
    const val = parseFloat(amountInput.value) || 0;
    pctInput.value = subtotal > 0 ? ((val / subtotal) * 100).toFixed(2) : "0.00";
  } else if (source === "percentage") {
    const val = parseFloat(pctInput.value) || 0;
    amountInput.value = ((subtotal * val) / 100).toFixed(2);
  }

  calculateTotals();
  saveDraftToStorage();
}

function updateInvoiceTax(source) {
  lastTaxSource = source;
  const amountInput = document.getElementById("currentTaxAmount");
  const pctInput = document.getElementById("currentTaxPercentage");
  const legacyTaxRate = document.getElementById("taxRate");

  const subtotal = getSubtotal() || 0;
  const itemDiscounts = getItemDiscountsTotal();
  const invoiceDiscountInput = parseFloat(document.getElementById("currentDiscountAmount")?.value) || 0;
  const defaultDiscAmount =
    defaultDiscountType === "fixed"
      ? defaultDiscount
      : subtotal > 0
      ? (subtotal * defaultDiscount) / 100
      : 0;
  const totalDiscount = Math.min(subtotal, itemDiscounts + invoiceDiscountInput + defaultDiscAmount);
  const taxableAmount = Math.max(0, subtotal - totalDiscount);

  if (!amountInput || !pctInput) return;

  if (source === "amount") {
    const val = parseFloat(amountInput.value) || 0;
    const computedPct = taxableAmount > 0 ? ((val / taxableAmount) * 100).toFixed(2) : "0.00";
    pctInput.value = computedPct;
    if (legacyTaxRate) legacyTaxRate.value = computedPct;
  } else if (source === "percentage") {
    const val = parseFloat(pctInput.value) || 0;
    const computedAmt = ((taxableAmount * val) / 100).toFixed(2);
    amountInput.value = computedAmt;
    if (legacyTaxRate) legacyTaxRate.value = pctInput.value;
  }

  calculateTotals();
  saveDraftToStorage();
}

function calculateTotals() {
  const t = getInvoiceTotals();

  const subtotalEl = document.getElementById("subtotal");
  const totalDiscountEl = document.getElementById("totalDiscount");
  const taxAmountEl = document.getElementById("taxAmount");
  const grandTotalEl = document.getElementById("grandTotal");
  const currSym = activeCurrency ? activeCurrency.symbol : "ج.م";

  if (subtotalEl) subtotalEl.textContent = t.subtotal.toFixed(2) + " " + currSym;
  if (totalDiscountEl) totalDiscountEl.textContent = t.totalDiscount.toFixed(2) + " " + currSym;
  if (taxAmountEl) taxAmountEl.textContent = t.taxAmount.toFixed(2) + " " + currSym;
  if (grandTotalEl) grandTotalEl.textContent = t.grandTotal.toFixed(2) + " " + currSym;

  // Sync Tax input fields if not currently focused
  const taxAmountInput = document.getElementById("currentTaxAmount");
  const taxPctInput = document.getElementById("currentTaxPercentage");
  const legacyTaxRate = document.getElementById("taxRate");

  if (taxAmountInput && taxPctInput) {
    if (document.activeElement !== taxAmountInput && document.activeElement !== taxPctInput) {
      if (taxAmountInput.value === "" && taxPctInput.value === "" && defaultTaxEnabled && defaultTax > 0) {
        if (defaultTaxType === "fixed") {
          taxAmountInput.value = defaultTax;
          taxPctInput.value = t.taxableAmount > 0 ? ((defaultTax / t.taxableAmount) * 100).toFixed(2) : "0.00";
        } else {
          taxPctInput.value = defaultTax;
          taxAmountInput.value = ((t.taxableAmount * defaultTax) / 100).toFixed(2);
        }
      } else if (lastTaxSource === "percentage" && taxPctInput.value !== "") {
        taxAmountInput.value = t.taxAmount > 0 ? t.taxAmount.toFixed(2) : "0";
      } else if (lastTaxSource === "amount" && taxAmountInput.value !== "") {
        taxPctInput.value = t.taxRate > 0 ? t.taxRate.toFixed(2) : "0";
      }
      if (legacyTaxRate) legacyTaxRate.value = taxPctInput.value || "0";
    }
  }

  // Counters
  const itemsCountEl = document.getElementById("itemsCount");
  const totalUnitsCountEl = document.getElementById("totalUnitsCount");
  const totalUnits = invoiceItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0);

  if (itemsCountEl) itemsCountEl.textContent = invoiceItems.length;
  if (totalUnitsCountEl) totalUnitsCountEl.textContent = totalUnits;

  // Sticky Bottom Dock Sync
  const dockSummaryEl = document.getElementById("dockItemsSummary");
  const dockGrandTotalEl = document.getElementById("dockGrandTotal");
  if (dockSummaryEl) {
    dockSummaryEl.textContent = `${invoiceItems.length} أصناف (${totalUnits} قطع)`;
  }
  if (dockGrandTotalEl) {
    dockGrandTotalEl.textContent = t.grandTotal.toFixed(2) + " " + currSym;
  }

  // Update change & split balance
  calculateChange();
  syncSplitBalance();
}

// ==========================================================================
// Payment Method Selection & Split Payment
// ==========================================================================
function setPaymentMethod(method) {
  currentPaymentMethod = method;

  const tabs = document.querySelectorAll(".pos-payment-tab");
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.method === method);
  });

  const splitBox = document.getElementById("splitPaymentContainer");
  if (splitBox) {
    if (method === "split") {
      splitBox.style.display = "grid";
      const totals = getInvoiceTotals();
      const splitCash = document.getElementById("splitCashAmount");
      const splitCard = document.getElementById("splitCardAmount");
      if (splitCash && splitCard) {
        splitCash.value = (totals.grandTotal / 2).toFixed(2);
        splitCard.value = (totals.grandTotal / 2).toFixed(2);
      }
    } else {
      splitBox.style.display = "none";
    }
  }

  saveDraftToStorage();
}

function handleSplitAmountChange(source) {
  const totals = getInvoiceTotals();
  const splitCash = document.getElementById("splitCashAmount");
  const splitCard = document.getElementById("splitCardAmount");
  if (!splitCash || !splitCard) return;

  if (source === "cash") {
    const cashVal = parseFloat(splitCash.value) || 0;
    const remainder = Math.max(0, totals.grandTotal - cashVal);
    splitCard.value = remainder.toFixed(2);
  } else if (source === "card") {
    const cardVal = parseFloat(splitCard.value) || 0;
    const remainder = Math.max(0, totals.grandTotal - cardVal);
    splitCash.value = remainder.toFixed(2);
  }

  saveDraftToStorage();
}

function syncSplitBalance() {
  if (currentPaymentMethod === "split") {
    const totals = getInvoiceTotals();
    const splitCash = document.getElementById("splitCashAmount");
    const splitCard = document.getElementById("splitCardAmount");
    if (splitCash && splitCard) {
      const cashVal = parseFloat(splitCash.value) || 0;
      if (cashVal <= totals.grandTotal) {
        splitCard.value = Math.max(0, totals.grandTotal - cashVal).toFixed(2);
      }
    }
  }
}

// ==========================================================================
// Cash Calculator & Change Due ("الباقي للعميل")
// ==========================================================================
function calculateChange() {
  const totals = getInvoiceTotals();
  const paidInput = document.getElementById("paidAmount");
  const changeEl = document.getElementById("changeAmount");
  const badgeEl = document.getElementById("changeStatusBadge");
  if (!changeEl) return;

  const paidRaw = paidInput ? paidInput.value.trim() : "";
  if (!paidRaw) {
    changeEl.textContent = "0.00 ج.م";
    changeEl.className = "pos-change-number !text-gray-400";
    if (badgeEl) {
      badgeEl.textContent = "في الانتظار";
      badgeEl.className = "text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full";
    }
    return;
  }

  const paid = parseFloat(paidRaw) || 0;
  const grandTotal = totals.grandTotal || 0;
  const diff = paid - grandTotal;

  const currSym = activeCurrency ? activeCurrency.symbol : "ج.م";
  if (diff >= -0.001) {
    const changeVal = Math.max(0, diff);
    changeEl.textContent = changeVal.toFixed(2) + " " + currSym;
    changeEl.className = "pos-change-number";
    if (badgeEl) {
      badgeEl.textContent = Math.abs(diff) < 0.01 ? "متوازن تماماً" : "متبقي للعميل";
      badgeEl.className = "text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full";
    }
  } else {
    changeEl.textContent = "ناقص " + Math.abs(diff).toFixed(2) + " " + currSym;
    changeEl.className = "pos-change-number !text-red-600";
    if (badgeEl) {
      badgeEl.textContent = "المبلغ غير كافٍ";
      badgeEl.className = "text-[11px] font-bold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full";
    }
  }

  saveDraftToStorage();
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

// ==========================================================================
// Customer Autocomplete & Quick Add Customer Modal
// ==========================================================================
function handleCustomerSearch(query = "") {
  const dropdown = document.getElementById("customerDropdown");
  if (!dropdown) return;

  const trimmed = query.trim().toLowerCase();
  const cashBadge = document.getElementById("cashCustomerBadge");

  if (!trimmed) {
    if (cashBadge) {
      cashBadge.innerHTML = `<i class="fas fa-check-circle text-emerald-500"></i><span>البيع لعميل نقدي</span>`;
      cashBadge.className = "text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200";
    }
    dropdown.classList.remove("open");
    dropdown.innerHTML = "";
    _customerDropdownActiveIndex = -1;
    return;
  }

  const filtered = allCustomers.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(trimmed)) ||
      (c.phone && c.phone.includes(trimmed))
  );

  if (filtered.length === 0) {
    dropdown.innerHTML = `
      <div class="p-3 text-center text-gray-400 text-sm">
        <span>لا يوجد عميل مسجل بهذا الاسم</span>
        <button type="button" onclick="openQuickCustomerModal('${query}')" class="block mx-auto mt-2 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100">
          + إضافة "${query}" كعميل جديد
        </button>
      </div>
    `;
    dropdown.classList.add("open");
    _customerDropdownActiveIndex = -1;
    return;
  }

  _customerDropdownActiveIndex = -1;
  dropdown.innerHTML = filtered.slice(0, 15).map((c, idx) => {
    const safeName = (c.name || "").replace(/"/g, "&quot;");
    const safePhone = (c.phone || "").replace(/"/g, "&quot;");
    const jsName = (c.name || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const jsPhone = (c.phone || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return `
      <div class="pos-dropdown-item" data-index="${idx}" data-name="${safeName}" data-phone="${safePhone}" onclick="selectCustomerItem('${jsName}', '${jsPhone}')">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
            <i class="fas fa-user"></i>
          </div>
          <div>
            <div class="font-bold text-gray-800 text-sm">${c.name}</div>
            <div class="text-xs text-gray-400">${c.phone || "بدون هاتف"}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  dropdown.classList.add("open");
}

function handleCustomerSearchKeydown(event) {
  const dropdown = document.getElementById("customerDropdown");
  const isOpen = dropdown && dropdown.classList.contains("open");
  const items = dropdown ? dropdown.querySelectorAll(".pos-dropdown-item") : [];

  if (event.key === "ArrowDown") {
    if (!isOpen || items.length === 0) return;
    event.preventDefault();
    _customerDropdownActiveIndex = Math.min(_customerDropdownActiveIndex + 1, items.length - 1);
    items.forEach((el, idx) => el.classList.toggle("active", idx === _customerDropdownActiveIndex));
    if (items[_customerDropdownActiveIndex]) {
      items[_customerDropdownActiveIndex].scrollIntoView({ block: "nearest" });
    }
  } else if (event.key === "ArrowUp") {
    if (!isOpen || items.length === 0) return;
    event.preventDefault();
    _customerDropdownActiveIndex = Math.max(_customerDropdownActiveIndex - 1, 0);
    items.forEach((el, idx) => el.classList.toggle("active", idx === _customerDropdownActiveIndex));
    if (items[_customerDropdownActiveIndex]) {
      items[_customerDropdownActiveIndex].scrollIntoView({ block: "nearest" });
    }
  } else if (event.key === "Enter") {
    if (isOpen && items.length > 0) {
      event.preventDefault();
      // If user navigated to an item with arrows, pick it; otherwise pick the very first match
      const targetIdx = _customerDropdownActiveIndex >= 0 ? _customerDropdownActiveIndex : 0;
      const targetItem = items[targetIdx];
      if (targetItem) {
        const name = targetItem.getAttribute("data-name") || "";
        const phone = targetItem.getAttribute("data-phone") || "";
        selectCustomerItem(name, phone);
        return;
      }
    }
    // If no dropdown open or empty, pressing Enter moves focus to barcode search input
    event.preventDefault();
    const searchInput = document.getElementById("productSearch");
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  } else if (event.key === "Escape") {
    if (dropdown) {
      dropdown.classList.remove("open");
      dropdown.innerHTML = "";
    }
    _customerDropdownActiveIndex = -1;
  }
}

async function loadLoyaltySettings() {
  try {
    if (window.electronAPI && window.electronAPI.getSettings) {
      const s = (await window.electronAPI.getSettings()) || {};
      _posLoyaltySettings = {
        loyaltyEnabled: s.loyaltyEnabled !== false,
        loyaltySpendPerPoint: parseFloat(s.loyaltySpendPerPoint) || 10,
        loyaltyPointValue: parseFloat(s.loyaltyPointValue) || 0.10,
      };
    }
  } catch (e) {
    console.warn("Could not load loyalty settings:", e);
  }
}

function updateCustomerLoyaltyUI(name, phone) {
  const loyaltyBanner = document.getElementById("customerLoyaltyBanner");
  const pointsText = document.getElementById("customerLoyaltyPointsText");
  const redeemBtn = document.getElementById("btnRedeemPoints");
  if (!loyaltyBanner) return;

  const cust = allCustomers.find((c) => c.name === name || (phone && c.phone === phone));
  const points = Number(cust?.points || 0);

  if (cust && points > 0 && _posLoyaltySettings.loyaltyEnabled !== false) {
    const pValue = (points * (_posLoyaltySettings.loyaltyPointValue || 0.10)).toFixed(2);
    if (pointsText) pointsText.textContent = `${points} نقطة (${pValue} ج.م)`;
    if (redeemBtn) {
      redeemBtn.innerHTML = '<i class="fas fa-gift"></i><span>استبدال بخصم</span>';
      redeemBtn.disabled = false;
      redeemBtn.style.background = "";
    }
    loyaltyBanner.classList.remove("hidden");
  } else {
    loyaltyBanner.classList.add("hidden");
  }
}

function redeemCustomerPoints() {
  const custName = document.getElementById("customerName")?.value.trim();
  const cust = allCustomers.find((c) => c.name === custName);
  const points = Number(cust?.points || 0);

  if (!cust || points <= 0) {
    Swal.fire({
      icon: "info",
      title: "لا توجد نقاط",
      text: "هذا العميل لا يمتلك نقاط ولاء متاحة للاستبدال حالياً.",
      confirmButtonColor: "#4f46e5",
    });
    return;
  }

  const totals = getInvoiceTotals();
  if (totals.subtotal <= 0) {
    Swal.fire({
      icon: "warning",
      title: "فاتورة فارغة",
      text: "يرجى إضافة منتجات للفاتورة أولاً قبل استبدال النقاط.",
      confirmButtonColor: "#4f46e5",
    });
    return;
  }

  const pointValue = _posLoyaltySettings.loyaltyPointValue || 0.10;
  const maxDiscount = parseFloat((points * pointValue).toFixed(2));
  const discountToApply = Math.min(totals.subtotal, maxDiscount);
  const pointsUsed = Math.ceil(discountToApply / pointValue);

  currentPointsRedeemed = pointsUsed;
  currentPointsDiscount = discountToApply;

  const discAmtInput = document.getElementById("currentDiscountAmount");
  if (discAmtInput) {
    discAmtInput.value = discountToApply.toFixed(2);
  }

  calculateTotals();

  const redeemBtn = document.getElementById("btnRedeemPoints");
  if (redeemBtn) {
    redeemBtn.innerHTML = `<i class="fas fa-check-circle"></i><span>تم الخصم (${discountToApply.toFixed(2)} ج.م)</span>`;
    redeemBtn.disabled = true;
    redeemBtn.style.background = "#059669";
  }

  playSound("chime");
  Swal.fire({
    icon: "success",
    title: "تم تطبيق خصم النقاط!",
    text: `تم استبدال ${pointsUsed} نقطة وتطبيق خصم مباشر بقيمة ${discountToApply.toFixed(2)} ج.م على الفاتورة.`,
    confirmButtonColor: "#059669",
    timer: 1600,
    showConfirmButton: false,
  });
}

function selectCustomerItem(name, phone) {
  const nameInput = document.getElementById("customerName");
  const phoneInput = document.getElementById("customerPhone");
  const dropdown = document.getElementById("customerDropdown");
  const cashBadge = document.getElementById("cashCustomerBadge");

  if (nameInput) nameInput.value = name;
  if (phoneInput) phoneInput.value = phone || "";
  if (dropdown) {
    dropdown.classList.remove("open");
    dropdown.innerHTML = "";
  }
  _customerDropdownActiveIndex = -1;

  if (cashBadge) {
    cashBadge.innerHTML = `<i class="fas fa-user-check text-purple-500"></i><span>عميل مسجل</span>`;
    cashBadge.className = "text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200";
  }

  updateCustomerLoyaltyUI(name, phone);
  saveDraftToStorage();

  // Directly focus barcode/product search input so cashier can start scanning immediately
  const searchInput = document.getElementById("productSearch");
  if (searchInput) {
    searchInput.focus();
    searchInput.select();
  }
}


function openQuickCustomerModal(prefilledName = "") {
  const modal = document.getElementById("quickCustomerModal");
  const nameInput = document.getElementById("qcName");
  if (modal) {
    modal.classList.add("active");
    if (nameInput) {
      nameInput.value = typeof prefilledName === "string" ? prefilledName : "";
      setTimeout(() => nameInput.focus(), 100);
    }
  }
}

function closeQuickCustomerModal() {
  const modal = document.getElementById("quickCustomerModal");
  if (modal) modal.classList.remove("active");
  focusSearchInput();
}

async function handleQuickCustomerSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("qcName")?.value.trim();
  const phone = document.getElementById("qcPhone")?.value.trim();
  const address = document.getElementById("qcAddress")?.value.trim();
  const notes = document.getElementById("qcNotes")?.value.trim();

  if (!name || !phone) {
    Swal.fire({
      icon: "warning",
      title: "بيانات ناقصة",
      text: "يرجى إدخال اسم العميل ورقم الهاتف.",
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return;
  }

  try {
    if (window.electronAPI && window.electronAPI.addCustomer) {
      await window.electronAPI.addCustomer({
        name,
        phone,
        address,
        notes,
        dateAdded: new Date().toISOString(),
      });
      await loadCustomers();
    }

    selectCustomerItem(name, phone);
    closeQuickCustomerModal();

    Swal.fire({
      icon: "success",
      title: "تمت إضافة العميل",
      text: `تم تسجيل العميل "${name}" واختياره للفاتورة الحالية بنجاح.`,
      confirmButtonColor: "#4f46e5",
      timer: 1400,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error("Error adding customer:", err);
    Swal.fire({
      icon: "error",
      title: "عذراً",
      text: "تعذر إضافة العميل، يرجى المحاولة مجدداً.",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "حسناً",
    });
  }
}

// ==========================================================================
// Collapsible Optional Details Accordion
// ==========================================================================
function toggleExtraDetails() {
  const accordion = document.getElementById("extraDetailsAccordion");
  const icon = document.getElementById("extraDetailsIcon");
  if (!accordion) return;

  if (accordion.style.display === "none" || !accordion.style.display) {
    accordion.style.display = "grid";
    if (icon) icon.style.transform = "rotate(180deg)";
  } else {
    accordion.style.display = "none";
    if (icon) icon.style.transform = "rotate(0deg)";
  }
}

// ==========================================================================
// Suspended Invoices Management (الفواتير المعلقة)
// ==========================================================================
async function loadSuspendedInvoices() {
  try {
    if (window.electronAPI && window.electronAPI.getSuspendedInvoices) {
      suspendedInvoices = (await window.electronAPI.getSuspendedInvoices()) || [];
    }
    const badge = document.getElementById("heldCountBadge");
    if (badge) badge.textContent = suspendedInvoices.length;
    renderSuspendedInvoices();
  } catch (err) {
    console.error("Error loading suspended invoices:", err);
  }
}

function openSuspendedInvoicesModal() {
  const modal = document.getElementById("suspendedInvoicesModal");
  if (modal) {
    renderSuspendedInvoices();
    modal.classList.add("active");
  }
}

function closeSuspendedInvoicesModal() {
  const modal = document.getElementById("suspendedInvoicesModal");
  if (modal) modal.classList.remove("active");
  focusSearchInput();
}

function renderSuspendedInvoices() {
  const container = document.getElementById("suspendedInvoicesList");
  if (!container) return;

  if (suspendedInvoices.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-gray-400">
        <i class="fas fa-inbox text-4xl mb-3 text-gray-300"></i>
        <h4 class="text-base font-bold text-gray-600 mb-1">لا توجد فواتير معلقة حالياً</h4>
        <p class="text-xs text-gray-400">يمكنك تعليق أي فاتورة جارية بالضغط على زر تعليق (F3)</p>
      </div>
    `;
    return;
  }

  container.innerHTML = suspendedInvoices
    .map((inv) => {
      const dateStr = inv.suspendedAt
        ? new Date(inv.suspendedAt).toLocaleString("ar-EG")
        : "منذ قليل";
      const total = Number(inv.grandTotal || inv.total || 0).toFixed(2);
      const itemsCount = (inv.items || []).length;

      return `
        <div class="pos-held-card" data-id="${inv.id}">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-black text-gray-900 text-sm">${inv.invoiceNumber || "فاتورة معلقة"}</span>
                <span class="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">${inv.customerName || "عميل نقدي"}</span>
              </div>
              <div class="text-xs text-gray-400 flex items-center gap-3">
                <span><i class="fas fa-boxes ml-1"></i>${itemsCount} أصناف</span>
                <span><i class="fas fa-clock ml-1"></i>${dateStr}</span>
              </div>
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
              <span class="font-black text-emerald-600 text-base">${total} ج.م</span>
              <div class="flex gap-2">
                <button type="button" onclick="resumeSuspendedInvoice('${inv.id}')" class="btn-pos-primary !py-1.5 !px-3 text-xs" title="استرجاع الفاتورة">
                  <i class="fas fa-play"></i>
                  <span>استرجاع</span>
                </button>
                <button type="button" onclick="deleteSuspendedInvoice('${inv.id}')" class="btn-pos-clear !py-1.5 !px-2.5 text-xs" title="حذف الفاتورة">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

async function suspendCurrentInvoice() {
  if (typeof window.hasPermission === "function" && !window.hasPermission("canSuspendInvoice")) {
    Swal.fire({
      icon: "warning",
      title: "صلاحية مقيدة",
      text: "ليس لديك صلاحية لتعليق الفواتير.",
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "حسناً",
    });
    return;
  }

  if (invoiceItems.length === 0) {
    playSound("error");
    Swal.fire({
      icon: "warning",
      title: "تنبيه",
      text: "لا يمكن تعليق فاتورة فارغة. يرجى إضافة منتجات أولاً.",
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return;
  }

  const totals = getInvoiceTotals();
  const invoiceData = {
    invoiceNumber: document.getElementById("invoiceNumber")?.textContent || "INV-...",
    customerName: document.getElementById("customerName")?.value.trim() || "عميل نقدي",
    customerPhone: document.getElementById("customerPhone")?.value.trim() || "",
    paymentMethod: currentPaymentMethod,
    items: [...invoiceItems],
    subtotal: totals.subtotal,
    totalDiscount: totals.totalDiscount,
    taxAmount: totals.taxAmount,
    grandTotal: totals.grandTotal,
    suspendedAt: new Date().toISOString(),
    salesRep: document.getElementById("salesRepInput")?.value.trim() || "",
    notes: document.getElementById("invoiceNotesInput")?.value.trim() || "",
    deliveryAddress: document.getElementById("deliveryAddressInput")?.value.trim() || "",
    creditDueDate: document.getElementById("creditDueDateInput")?.value || "",
  };

  try {
    if (window.electronAPI && window.electronAPI.suspendInvoice) {
      await window.electronAPI.suspendInvoice(invoiceData);
    }

    playSound("hold");
    resetInvoiceState();
    clearDraftFromStorage();
    await loadSuspendedInvoices();

    Swal.fire({
      icon: "success",
      title: "تم تعليق الفاتورة",
      text: "تم حفظ الفاتورة الحالية في قائمة الفواتير المعلقة، ويمكنك البدء في فاتورة جديدة.",
      confirmButtonColor: "#4f46e5",
      timer: 1400,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error("Error suspending invoice:", err);
    Swal.fire({
      icon: "error",
      title: "عذراً",
      text: "تعذر تعليق الفاتورة حالياً، يرجى المحاولة مجدداً.",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "حسناً",
    });
  }
}

async function resumeSuspendedInvoice(invoiceId) {
  if (invoiceItems.length > 0) {
    const result = await Swal.fire({
      title: "استبدال الفاتورة الحالية",
      text: "توجد فاتورة حالية تحتوي على أصناف. هل ترغب في استبدالها بالفاتورة المعلقة؟",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، استرجاع واستبدال",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;
  }

  try {
    if (window.electronAPI && window.electronAPI.resumeInvoice) {
      const invoice = await window.electronAPI.resumeInvoice(invoiceId);
      if (!invoice) throw new Error("لم يتم العثور على الفاتورة المعلقة.");

      invoiceItems = invoice.items || [];
      const nameInput = document.getElementById("customerName");
      const phoneInput = document.getElementById("customerPhone");
      const salesRepInput = document.getElementById("salesRepInput");
      const notesInput = document.getElementById("invoiceNotesInput");
      const deliveryInput = document.getElementById("deliveryAddressInput");
      const dueInput = document.getElementById("creditDueDateInput");

      if (nameInput) nameInput.value = invoice.customerName || "";
      if (phoneInput) phoneInput.value = invoice.customerPhone || "";
      if (salesRepInput) salesRepInput.value = invoice.salesRep || "";
      if (notesInput) notesInput.value = invoice.notes || "";
      if (deliveryInput) deliveryInput.value = invoice.deliveryAddress || "";
      if (dueInput) dueInput.value = invoice.creditDueDate || "";

      setPaymentMethod(invoice.paymentMethod || "cash");
      renderItems();
      saveDraftToStorage();
      await loadSuspendedInvoices();
      closeSuspendedInvoicesModal();

      playSound("success");
      Swal.fire({
        icon: "success",
        title: "تم الاسترجاع",
        text: "تم استرجاع الفاتورة المعلقة بنجاح.",
        confirmButtonColor: "#4f46e5",
        timer: 1300,
        showConfirmButton: false,
      });
    }
  } catch (err) {
    console.error("Error resuming invoice:", err);
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
      if (window.electronAPI && window.electronAPI.deleteSuspendedInvoice) {
        await window.electronAPI.deleteSuspendedInvoice(invoiceId);
      }
      await loadSuspendedInvoices();
      Swal.fire({
        icon: "success",
        title: "تم الحذف",
        text: "تم حذف الفاتورة المعلقة بنجاح.",
        confirmButtonColor: "#4f46e5",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting suspended invoice:", err);
    }
  }
}

// ==========================================================================
// Default Discount Settings Modal
// ==========================================================================
async function loadDefaultDiscount() {
  try {
    if (!window.electronAPI || !window.electronAPI.getSettings) {
      const saved = localStorage.getItem("pos_default_discount_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        defaultDiscount = parsed.defaultDiscount || 0;
        defaultDiscountType = parsed.defaultDiscountType || "fixed";
      }
      return;
    }
    const s = (await window.electronAPI.getSettings()) || {};
    defaultDiscount = s.defaultDiscount || 0;
    defaultDiscountType = s.defaultDiscountType || "fixed";
  } catch (err) {
    console.error("Error loading default discount:", err);
  }
}

function openDefaultDiscountSettings() {
  const modal = document.getElementById("defaultDiscountModal");
  const typeSelect = document.getElementById("defaultDiscountTypeSelect");
  const valInput = document.getElementById("defaultDiscountValueInput");

  if (modal) {
    if (typeSelect) typeSelect.value = defaultDiscountType;
    if (valInput) valInput.value = defaultDiscount;
    modal.classList.add("active");
  }
}

function closeDefaultDiscountModal() {
  const modal = document.getElementById("defaultDiscountModal");
  if (modal) modal.classList.remove("active");
  focusSearchInput();
}

async function saveDefaultDiscountSettings() {
  const typeSelect = document.getElementById("defaultDiscountTypeSelect");
  const valInput = document.getElementById("defaultDiscountValueInput");

  const newType = typeSelect ? typeSelect.value : "fixed";
  const newVal = parseFloat(valInput ? valInput.value : 0) || 0;

  defaultDiscount = newVal;
  defaultDiscountType = newType;

  try {
    if (window.electronAPI && window.electronAPI.saveSettings && window.electronAPI.getSettings) {
      const s = (await window.electronAPI.getSettings()) || {};
      await window.electronAPI.saveSettings({
        ...s,
        defaultDiscount,
        defaultDiscountType,
      });
    }
    localStorage.setItem(
      "pos_default_discount_settings",
      JSON.stringify({ defaultDiscount, defaultDiscountType })
    );

    calculateTotals();
    closeDefaultDiscountModal();

    Swal.fire({
      icon: "success",
      title: "تم حفظ الإعدادات",
      text: "تم تحديث إعدادات الخصم الدائم بنجاح.",
      confirmButtonColor: "#4f46e5",
      timer: 1300,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error("Error saving default discount:", err);
  }
}

async function deleteDefaultDiscountSettings() {
  const result = await Swal.fire({
    title: "حذف الخصم الدائم؟",
    text: "هل تريد حذف وإلغاء تطبيق الخصم الدائم على الفواتير؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "نعم، حذف الخصم",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
  });

  if (result.isConfirmed) {
    defaultDiscount = 0;
    try {
      if (window.electronAPI && window.electronAPI.saveSettings && window.electronAPI.getSettings) {
        const s = (await window.electronAPI.getSettings()) || {};
        await window.electronAPI.saveSettings({
          ...s,
          defaultDiscount: 0,
        });
      }
      localStorage.setItem(
        "pos_default_discount_settings",
        JSON.stringify({ defaultDiscount: 0, defaultDiscountType: "fixed" })
      );

      calculateTotals();
      closeDefaultDiscountModal();

      Swal.fire({
        icon: "success",
        title: "تم حذف الخصم",
        text: "تم إلغاء وحذف الخصم الدائم بنجاح.",
        confirmButtonColor: "#4f46e5",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting default discount:", err);
    }
  }
}

// ==========================================================================
// Default Tax Settings Modal
// ==========================================================================
async function loadDefaultTax() {
  try {
    if (!window.electronAPI || !window.electronAPI.getSettings) {
      const saved = localStorage.getItem("pos_default_tax_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        defaultTax = parsed.defaultTax || 0;
        defaultTaxType = parsed.defaultTaxType || "percentage";
        defaultTaxEnabled = typeof parsed.defaultTaxEnabled !== "undefined" ? parsed.defaultTaxEnabled : (defaultTax > 0);
      }
      return;
    }
    const s = (await window.electronAPI.getSettings()) || {};
    defaultTax = typeof s.defaultTax !== "undefined" ? Number(s.defaultTax) : 0;
    defaultTaxType = s.defaultTaxType || "percentage";
    defaultTaxEnabled = typeof s.defaultTaxEnabled !== "undefined" ? Boolean(s.defaultTaxEnabled) : (defaultTax > 0);
  } catch (err) {
    console.error("Error loading default tax:", err);
  }
}

function openDefaultTaxSettings() {
  const modal = document.getElementById("defaultTaxModal");
  const typeSelect = document.getElementById("defaultTaxTypeSelect");
  const valInput = document.getElementById("defaultTaxValueInput");
  const enabledToggle = document.getElementById("defaultTaxEnabledToggle");

  if (modal) {
    if (typeSelect) typeSelect.value = defaultTaxType;
    if (valInput) valInput.value = defaultTax;
    if (enabledToggle) enabledToggle.checked = defaultTaxEnabled;
    modal.classList.add("active");
  }
}

function closeDefaultTaxModal() {
  const modal = document.getElementById("defaultTaxModal");
  if (modal) modal.classList.remove("active");
  focusSearchInput();
}

async function saveDefaultTaxSettings() {
  const typeSelect = document.getElementById("defaultTaxTypeSelect");
  const valInput = document.getElementById("defaultTaxValueInput");
  const enabledToggle = document.getElementById("defaultTaxEnabledToggle");

  const newType = typeSelect ? typeSelect.value : "percentage";
  const newVal = parseFloat(valInput ? valInput.value : 0) || 0;
  const isEnabled = enabledToggle ? enabledToggle.checked : true;

  defaultTax = newVal;
  defaultTaxType = newType;
  defaultTaxEnabled = isEnabled;

  try {
    if (window.electronAPI && window.electronAPI.saveSettings && window.electronAPI.getSettings) {
      const s = (await window.electronAPI.getSettings()) || {};
      await window.electronAPI.saveSettings({
        ...s,
        defaultTax,
        defaultTaxType,
        defaultTaxEnabled,
      });
    }
    localStorage.setItem(
      "pos_default_tax_settings",
      JSON.stringify({ defaultTax, defaultTaxType, defaultTaxEnabled })
    );

    // Reset current invoice tax inputs so new defaults apply
    const taxAmountInput = document.getElementById("currentTaxAmount");
    const taxPctInput = document.getElementById("currentTaxPercentage");
    if (taxAmountInput) taxAmountInput.value = "";
    if (taxPctInput) taxPctInput.value = "";

    calculateTotals();
    closeDefaultTaxModal();

    Swal.fire({
      icon: "success",
      title: "تم حفظ إعدادات الضريبة",
      text: "تم تحديث إعدادات الضريبة الدائمة بنجاح.",
      confirmButtonColor: "#4f46e5",
      timer: 1300,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error("Error saving default tax:", err);
  }
}

async function deleteDefaultTaxSettings() {
  const result = await Swal.fire({
    title: "حذف الضريبة الدائمة؟",
    text: "هل تريد حذف وإلغاء تطبيق الضريبة الدائمة على الفواتير؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "نعم، حذف الضريبة",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
  });

  if (result.isConfirmed) {
    defaultTax = 0;
    defaultTaxEnabled = false;

    try {
      if (window.electronAPI && window.electronAPI.saveSettings && window.electronAPI.getSettings) {
        const s = (await window.electronAPI.getSettings()) || {};
        await window.electronAPI.saveSettings({
          ...s,
          defaultTax: 0,
          defaultTaxEnabled: false,
        });
      }
      localStorage.setItem(
        "pos_default_tax_settings",
        JSON.stringify({ defaultTax: 0, defaultTaxType: "percentage", defaultTaxEnabled: false })
      );

      const taxAmountInput = document.getElementById("currentTaxAmount");
      const taxPctInput = document.getElementById("currentTaxPercentage");
      const legacyTaxRate = document.getElementById("taxRate");
      if (taxAmountInput) taxAmountInput.value = "";
      if (taxPctInput) taxPctInput.value = "";
      if (legacyTaxRate) legacyTaxRate.value = "0";

      calculateTotals();
      closeDefaultTaxModal();

      Swal.fire({
        icon: "success",
        title: "تم حذف الضريبة",
        text: "تم إيقاف وحذف الضريبة الدائمة بنجاح.",
        confirmButtonColor: "#4f46e5",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting default tax:", err);
    }
  }
}

// ==========================================================================
// Shortcuts Guide Modal & Modal Helpers
// ==========================================================================
function openShortcutsModal() {
  const modal = document.getElementById("shortcutsModal");
  if (modal) modal.classList.add("active");
}

function closeShortcutsModal() {
  const modal = document.getElementById("shortcutsModal");
  if (modal) modal.classList.remove("active");
  focusSearchInput();
}

function handleModalOverlayClick(event, modalId) {
  if (event.target && event.target.id === modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
    focusSearchInput();
  }
}

// ==========================================================================
// Auto-Draft Recovery & Crash Protection
// ==========================================================================
function saveDraftToStorage() {
  clearTimeout(_draftSaveTimeout);
  _draftSaveTimeout = setTimeout(() => {
    try {
      if (invoiceItems.length === 0) {
        localStorage.removeItem("pos_invoice_draft");
        return;
      }
      const draft = {
        invoiceItems,
        customerName: document.getElementById("customerName")?.value || "",
        customerPhone: document.getElementById("customerPhone")?.value || "",
        currentPaymentMethod,
        activeCurrencyCode: activeCurrency ? activeCurrency.code : "EGP",
        paidAmount: document.getElementById("paidAmount")?.value || "",
        splitCashAmount: document.getElementById("splitCashAmount")?.value || "",
        splitCardAmount: document.getElementById("splitCardAmount")?.value || "",
        discountAmount: document.getElementById("currentDiscountAmount")?.value || "",
        discountPct: document.getElementById("currentDiscountPercentage")?.value || "",
        taxAmount: document.getElementById("currentTaxAmount")?.value || "",
        taxPct: document.getElementById("currentTaxPercentage")?.value || "",
        taxRate: document.getElementById("currentTaxPercentage")?.value || document.getElementById("taxRate")?.value || "0",
        lastTaxSource,
        lastDiscountSource,
        salesRep: document.getElementById("salesRepInput")?.value || "",
        notes: document.getElementById("invoiceNotesInput")?.value || "",
        deliveryAddress: document.getElementById("deliveryAddressInput")?.value || "",
        creditDueDate: document.getElementById("creditDueDateInput")?.value || "",
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("pos_invoice_draft", JSON.stringify(draft));
    } catch (e) {
      console.warn("Unable to save draft to localStorage:", e);
    }
  }, 400);
}

function clearDraftFromStorage() {
  try {
    localStorage.removeItem("pos_invoice_draft");
  } catch (e) {}
}

function checkDraftRecovery() {
  try {
    const raw = localStorage.getItem("pos_invoice_draft");
    if (!raw) return;

    const draft = JSON.parse(raw);
    if (draft && draft.invoiceItems && draft.invoiceItems.length > 0) {
      Swal.fire({
        title: "استعادة الفاتورة غير المحفوظة",
        text: `توجد فاتورة سابقة غير محفوظة تحتوي على (${draft.invoiceItems.length}) أصناف، هل ترغب في استعادتها الآن؟`,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "نعم، استعادة",
        cancelButtonText: "لا، بدء فاتورة جديدة",
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#64748b",
      }).then((result) => {
        if (result.isConfirmed) {
          invoiceItems = draft.invoiceItems;
          const nameInput = document.getElementById("customerName");
          const phoneInput = document.getElementById("customerPhone");
          const paidInput = document.getElementById("paidAmount");
          const splitCash = document.getElementById("splitCashAmount");
          const splitCard = document.getElementById("splitCardAmount");
          const discAmt = document.getElementById("currentDiscountAmount");
          const discPct = document.getElementById("currentDiscountPercentage");
          const taxAmt = document.getElementById("currentTaxAmount");
          const taxPct = document.getElementById("currentTaxPercentage");
          const legacyTax = document.getElementById("taxRate");

          if (nameInput) nameInput.value = draft.customerName || "";
          if (phoneInput) phoneInput.value = draft.customerPhone || "";
          if (paidInput) paidInput.value = draft.paidAmount || "";
          if (splitCash) splitCash.value = draft.splitCashAmount || "";
          if (splitCard) splitCard.value = draft.splitCardAmount || "";
          if (discAmt) discAmt.value = draft.discountAmount || "";
          if (discPct) discPct.value = draft.discountPct || "";
          if (taxAmt) taxAmt.value = draft.taxAmount || "";
          if (taxPct) taxPct.value = draft.taxPct || draft.taxRate || "";
          if (legacyTax) legacyTax.value = draft.taxPct || draft.taxRate || "0";
          if (draft.lastTaxSource) lastTaxSource = draft.lastTaxSource;
          if (draft.lastDiscountSource) lastDiscountSource = draft.lastDiscountSource;

          if (draft.activeCurrencyCode) {
            setInvoiceCurrency(draft.activeCurrencyCode);
          }
          setPaymentMethod(draft.currentPaymentMethod || "cash");
          renderItems();
          focusSearchInput();
        } else {
          clearDraftFromStorage();
        }
      });
    }
  } catch (err) {
    console.error("Error reading draft:", err);
  }
}

// ==========================================================================
// Reset & Clear Actions
// ==========================================================================
function resetInvoiceState() {
  invoiceItems = [];
  currentPointsRedeemed = 0;
  currentPointsDiscount = 0;

  const loyaltyBanner = document.getElementById("customerLoyaltyBanner");
  if (loyaltyBanner) loyaltyBanner.classList.add("hidden");

  renderItems();

  const searchInput = document.getElementById("productSearch");
  if (searchInput) {
    searchInput.value = "";
    if (typeof clearFieldInvalid === "function") clearFieldInvalid(searchInput);
  }

  const catSelect = document.getElementById("categorySelect");
  if (catSelect) catSelect.value = "";

  const nameInput = document.getElementById("customerName");
  if (nameInput) nameInput.value = "";

  const phoneInput = document.getElementById("customerPhone");
  if (phoneInput) phoneInput.value = "";

  const cashBadge = document.getElementById("cashCustomerBadge");
  if (cashBadge) {
    cashBadge.innerHTML = `<i class="fas fa-check-circle text-emerald-500"></i><span>البيع لعميل نقدي</span>`;
    cashBadge.className = "text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200";
  }

  const paidInput = document.getElementById("paidAmount");
  if (paidInput) paidInput.value = "";

  const discAmt = document.getElementById("currentDiscountAmount");
  if (discAmt) discAmt.value = "";

  const discPct = document.getElementById("currentDiscountPercentage");
  if (discPct) discPct.value = "";

  const taxAmt = document.getElementById("currentTaxAmount");
  if (taxAmt) taxAmt.value = "";

  const taxPct = document.getElementById("currentTaxPercentage");
  if (taxPct) taxPct.value = "";

  const legacyTax = document.getElementById("taxRate");
  if (legacyTax) legacyTax.value = "";

  const salesRep = document.getElementById("salesRepInput");
  if (salesRep) salesRep.value = "";

  const notes = document.getElementById("invoiceNotesInput");
  if (notes) notes.value = "";

  const delivery = document.getElementById("deliveryAddressInput");
  if (delivery) delivery.value = "";

  const due = document.getElementById("creditDueDateInput");
  if (due) due.value = "";

  setPaymentMethod("cash");
  calculateTotals();
}

async function confirmResetInvoice() {
  if (invoiceItems.length > 0) {
    const res = await Swal.fire({
      title: "فاتورة جديدة",
      text: "هل ترغب في بدء فاتورة جديدة وتفريغ الحالية؟",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، فاتورة جديدة",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#64748b",
    });
    if (!res.isConfirmed) return;
  }
  resetInvoiceState();
  clearDraftFromStorage();
  focusSearchInput();
}

async function confirmClearInvoice() {
  if (invoiceItems.length === 0) {
    resetInvoiceState();
    return;
  }

  const res = await Swal.fire({
    title: "تفريغ وإلغاء الفاتورة",
    text: "هل أنت متأكد من رغبتك في تفريغ جميع منتجات الفاتورة الحالية؟",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "نعم، تفريغ",
    cancelButtonText: "تراجع",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
  });

  if (res.isConfirmed) {
    resetInvoiceState();
    clearDraftFromStorage();
    focusSearchInput();
    Swal.fire({
      icon: "success",
      title: "تم التفريغ",
      text: "تم تفريغ محتويات الفاتورة بنجاح.",
      confirmButtonColor: "#4f46e5",
      timer: 1200,
      showConfirmButton: false,
    });
  }
}

// ==========================================================================
// Save Invoice & Update Inventory
// ==========================================================================
async function saveInvoiceInternal() {
  if (invoiceItems.length === 0) {
    playSound("error");
    Swal.fire({
      icon: "warning",
      title: "فاتورة فارغة",
      text: "لا يمكن حفظ فاتورة فارغة. يرجى مسح باركود أو إضافة منتج أولاً.",
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return { success: false };
  }

  const customerName = document.getElementById("customerName")?.value.trim() || "عميل نقدي";
  const customerPhone = document.getElementById("customerPhone")?.value.trim() || "";
  const totals = getInvoiceTotals();
  const invoiceNumberEl = document.getElementById("invoiceNumber");
  let invoiceNumber = invoiceNumberEl ? invoiceNumberEl.textContent.trim() : "";

  if (invoiceNumberEl && invoiceNumberEl.dataset.isSaving === "true") {
    return { success: false };
  }
  if (invoiceNumberEl) invoiceNumberEl.dataset.isSaving = "true";

  try {
    // Check for duplicate invoice number and refresh if needed
    if (window.electronAPI && window.electronAPI.getSales) {
      const sales = (await window.electronAPI.getSales()) || [];
      if (sales.some((s) => s.invoiceNumber === invoiceNumber)) {
        invoiceNumber = await window.electronAPI.getNextInvoiceNumber();
        if (invoiceNumberEl) invoiceNumberEl.textContent = invoiceNumber;
      }
    }

    // Validate inventory stock availability before committing
    const currentProducts = (await window.electronAPI.getProducts()) || [];
    for (const item of invoiceItems) {
      const liveProd = currentProducts.find((p) => p._id === item._id);
      if (liveProd && liveProd.quantity < item.quantity) {
        playSound("error");
        Swal.fire({
          icon: "warning",
          title: "تنبيه المخزون",
          text: `الكمية المتوفرة من "${liveProd.name}" هي (${liveProd.quantity}) فقط، وهي أقل من الكمية المطلوبة (${item.quantity}).`,
          confirmButtonColor: "#4f46e5",
          confirmButtonText: "حسناً",
        });
        return { success: false };
      }
    }

    const paidVal = parseFloat(document.getElementById("paidAmount")?.value) || 0;
    const splitCashVal = parseFloat(document.getElementById("splitCashAmount")?.value) || 0;
    const splitCardVal = parseFloat(document.getElementById("splitCardAmount")?.value) || 0;

    // Calculate total cost and net profit
    const totalCost = invoiceItems.reduce(
      (acc, item) => acc + (Number(item.costPrice) || 0) * (Number(item.quantity) || 1),
      0
    );
    const netProfit = Math.max(0, totals.grandTotal - totalCost);

    // Calculate Loyalty Points
    const isLoyaltyEnabled = _posLoyaltySettings?.loyaltyEnabled !== false;
    const spendPerPoint = _posLoyaltySettings?.loyaltySpendPerPoint || 10;
    let pointsEarned = 0;
    if (isLoyaltyEnabled && totals.grandTotal > 0 && customerName !== "عميل نقدي") {
      pointsEarned = Math.floor(totals.grandTotal / spendPerPoint);
    }

    const activeUser = typeof window.getCurrentUser === "function" ? window.getCurrentUser() : null;
    const activeUserName = activeUser ? (activeUser.name || activeUser.username) : "المدير العام";

    const salePayload = {
      invoiceNumber,
      date: new Date().toISOString(),
      customerName,
      customerPhone,
      user: activeUserName,
      cashierName: activeUserName,
      createdByName: activeUserName,
      currency: {
        code: activeCurrency ? activeCurrency.code : "EGP",
        name: activeCurrency ? activeCurrency.name : "جنيه مصري",
        symbol: activeCurrency ? activeCurrency.symbol : "ج.م",
        exchangeRate: activeCurrency ? (activeCurrency.exchangeRate || 1) : 1,
        isDefault: activeCurrency ? Boolean(activeCurrency.isDefault) : true,
      },
      currencyCode: activeCurrency ? activeCurrency.code : "EGP",
      currencySymbol: activeCurrency ? activeCurrency.symbol : "ج.م",
      items: invoiceItems.map((item) => ({
        _id: item._id,
        name: item.name,
        price: item.price,
        basePrice: item.basePrice || item.price,
        costPrice: item.costPrice || 0,
        quantity: item.quantity,
        barcode: item.barcode || "",
        discountType: item.discountType,
        discountValue: item.discountValue || 0,
      })),
      subtotal: totals.subtotal,
      itemDiscounts: totals.itemDiscounts,
      discount: totals.totalDiscount,
      tax: totals.taxAmount,
      total: totals.grandTotal,
      totalCost,
      netProfit,
      loyaltyPointsEarned: pointsEarned,
      loyaltyPointsRedeemed: currentPointsRedeemed,
      loyaltyDiscount: currentPointsDiscount,
      paymentMethod: currentPaymentMethod,
      paidAmount: paidVal,
      splitPayment:
        currentPaymentMethod === "split"
          ? { cash: splitCashVal, card: splitCardVal }
          : null,
      salesRep: document.getElementById("salesRepInput")?.value.trim() || "",
      notes: document.getElementById("invoiceNotesInput")?.value.trim() || "",
      deliveryAddress: document.getElementById("deliveryAddressInput")?.value.trim() || "",
      creditDueDate: document.getElementById("creditDueDateInput")?.value || "",
    };

    // Auto-save new customer if not exists
    if (customerName !== "عميل نقدي" && !allCustomers.some((c) => c.name === customerName)) {
      await window.electronAPI.addCustomer({
        name: customerName,
        phone: customerPhone,
        points: pointsEarned,
        totalSpent: totals.grandTotal,
        dateAdded: new Date().toISOString(),
      });
      await loadCustomers();
    } else if (customerName !== "عميل نقدي") {
      // Update existing customer's loyalty points and total spend
      const liveCust = allCustomers.find((c) => c.name === customerName);
      if (liveCust) {
        const curPoints = Number(liveCust.points || 0);
        const newPoints = Math.max(0, curPoints - currentPointsRedeemed + pointsEarned);
        const curSpent = Number(liveCust.totalSpent || 0);
        await window.electronAPI.updateCustomer(liveCust._id, {
          ...liveCust,
          points: newPoints,
          totalSpent: curSpent + totals.grandTotal,
          lastVisit: new Date().toISOString(),
        });
        await loadCustomers();
      }
    }

    // Save sale record
    await window.electronAPI.addSale(salePayload);

    // Update local sales cache
    try {
      const updatedSales = (await window.electronAPI.getSales()) || [];
      updatedSales.sort((a, b) => new Date(b.date) - new Date(a.date));
      localStorage.setItem("managely_sales_cache", JSON.stringify(updatedSales));
    } catch (e) {}

    // Deduct quantities from product stock
    for (const item of invoiceItems) {
      const liveProd = currentProducts.find((p) => p._id === item._id);
      if (liveProd) {
        const remainingStock = Math.max(0, liveProd.quantity - item.quantity);
        await window.electronAPI.updateProduct(liveProd._id, {
          ...liveProd,
          quantity: remainingStock,
        });
      }
    }

    // Reload products in memory
    await loadProducts();

    // Prepare next invoice number
    const newInvoiceNumber = await window.electronAPI.getNextInvoiceNumber();
    if (invoiceNumberEl) invoiceNumberEl.textContent = newInvoiceNumber;

    clearDraftFromStorage();


    return {
      success: true,
      sale: salePayload,
      invoiceNumber,
      newInvoiceNumber,
    };
  } catch (err) {
    console.error("Error saving invoice:", err);
    playSound("error");
    Swal.fire({
      icon: "error",
      title: "عذراً",
      text: "تعذر حفظ الفاتورة، يرجى مراجعة البيانات والمحاولة مجدداً.",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "حسناً",
    });
    return { success: false };
  } finally {
    if (invoiceNumberEl) invoiceNumberEl.dataset.isSaving = "false";
  }
}

async function saveInvoiceOnly() {
  const result = await saveInvoiceInternal();
  if (result && result.success) {
    playSound("success");
    resetInvoiceState();
    focusSearchInput();
    Swal.fire({
      icon: "success",
      title: "تم الحفظ بنجاح",
      text: `تم تسجيل الفاتورة (${result.invoiceNumber}) وتحديث المخزون بنجاح.`,
      confirmButtonColor: "#4f46e5",
      timer: 1600,
      showConfirmButton: false,
    });
  }
}

// ==========================================================================
// Save & Print (Thermal Receipt Slip / PDF)
// ==========================================================================
async function saveAndPrintInvoice() {
  if (invoiceItems.length === 0) {
    playSound("error");
    Swal.fire({
      icon: "warning",
      title: "فاتورة فارغة",
      text: "لا يمكن طباعة فاتورة فارغة. يرجى إضافة منتجات أولاً.",
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return;
  }

  const itemsSnapshot = [...invoiceItems];
  const totalsSnapshot = getInvoiceTotals();
  const customerName = document.getElementById("customerName")?.value.trim() || "عميل نقدي";
  const customerPhone = document.getElementById("customerPhone")?.value.trim() || "غير متوفر";
  const paidVal = parseFloat(document.getElementById("paidAmount")?.value) || 0;
  const changeVal = Math.max(0, paidVal - totalsSnapshot.grandTotal);
  const invoiceDateStr = document.getElementById("invoiceDate")?.textContent || "";
  const paymentLabel =
    {
      cash: "نقدي (كاش)",
      visaCard: "بطاقة فيزا",
      vodafoneCash: "محفظة إلكترونية",
      split: "دفع مقسم (كاش + إلكتروني)",
      credit: "آجل",
    }[currentPaymentMethod] || "نقدي";

  // Commit save to database
  const result = await saveInvoiceInternal();
  if (!result || !result.success) return;

  const invoiceNumber = result.invoiceNumber;

  // Build thermal 72mm/80mm receipt HTML template
  let storeSettings = {};
  try {
    storeSettings = (await window.electronAPI.getSettings()) || {};
  } catch (e) {}

  let receiptHtml = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <style>
        @page { margin: 0; size: auto; }
        body {
          font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0 auto;
          padding: 8px 6px;
          text-align: center;
          font-size: 11px;
          line-height: 1.35;
          width: 72mm;
          max-width: 72mm;
          box-sizing: border-box;
          color: #000;
          background: #fff;
        }
        .receipt-header {
          border-bottom: 1px dashed #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        .receipt-header img {
          max-width: 48px;
          max-height: 48px;
          margin-bottom: 4px;
        }
        .receipt-header h1 {
          font-size: 14px;
          font-weight: 800;
          margin: 2px 0;
        }
        .receipt-header p {
          font-size: 10px;
          margin: 1px 0;
          color: #333;
        }
        .invoice-meta {
          text-align: right;
          font-size: 10px;
          margin-bottom: 6px;
          border-bottom: 1px dashed #000;
          padding-bottom: 4px;
        }
        .invoice-meta-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 6px 0;
          font-size: 10px;
        }
        th, td {
          padding: 4px 2px;
          border-bottom: 1px dotted #ccc;
        }
        th {
          border-bottom: 1px solid #000;
          font-weight: bold;
          background: #f8f8f8;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .receipt-totals {
          border-top: 1px dashed #000;
          padding-top: 4px;
          margin-top: 4px;
          font-size: 10px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        .grand-total-box {
          border: 1.5px solid #000;
          border-radius: 4px;
          padding: 4px;
          margin: 6px 0;
          font-weight: 900;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .receipt-footer {
          margin-top: 8px;
          border-top: 1px dashed #000;
          padding-top: 6px;
          font-size: 9px;
          color: #444;
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        ${storeSettings.logo ? `<img src="${storeSettings.logo}" alt="Logo">` : ""}
        <h1>${storeSettings.storeName || "نقطة بيع مانيجلي"}</h1>
        <p>${storeSettings.storeLocation || ""}</p>
        <p>${storeSettings.phoneNumbers?.join(" - ") || ""}</p>
      </div>

      <div class="invoice-meta">
        <div class="invoice-meta-row">
          <span><strong>رقم الفاتورة:</strong> ${invoiceNumber}</span>
          <span><strong>طريقة الدفع:</strong> ${paymentLabel}</span>
        </div>
        <div class="invoice-meta-row">
          <span><strong>التاريخ:</strong> ${invoiceDateStr}</span>
        </div>
        <div class="invoice-meta-row">
          <span><strong>العميل:</strong> ${customerName}</span>
          ${customerPhone && customerPhone !== "غير متوفر" ? `<span>${customerPhone}</span>` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-right">الصنف</th>
            <th class="text-center">الكمية</th>
            <th class="text-center">السعر</th>
            <th class="text-left">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsSnapshot
            .map((item) => {
              const lineSub = item.price * item.quantity;
              const disc =
                item.discountType === "percentage"
                  ? (lineSub * (item.discountValue || 0)) / 100
                  : item.discountValue || 0;
              const lineTot = Math.max(0, lineSub - disc);
              return `
                <tr>
                  <td class="text-right">
                    <strong>${item.name}</strong>
                    ${disc > 0 ? `<br><small style="color:#666;">(خصم: ${disc.toFixed(2)})</small>` : ""}
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-center">${item.price.toFixed(2)}</td>
                  <td class="text-left">${lineTot.toFixed(2)}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>

      <div class="receipt-totals">
        <div class="totals-row">
          <span>الإجمالي الفرعي:</span>
          <span>${totalsSnapshot.subtotal.toFixed(2)} ${activeCurrency ? activeCurrency.symbol : "ج.م"}</span>
        </div>
        ${
          totalsSnapshot.totalDiscount > 0
            ? `<div class="totals-row" style="color: #c00;">
                 <span>إجمالي الخصم:</span>
                 <span>-${totalsSnapshot.totalDiscount.toFixed(2)} ${activeCurrency ? activeCurrency.symbol : "ج.م"}</span>
               </div>`
            : ""
        }
        ${
          totalsSnapshot.taxAmount > 0
            ? `<div class="totals-row">
                 <span>الضريبة${totalsSnapshot.taxRate > 0 ? ` (${totalsSnapshot.taxRate.toFixed(totalsSnapshot.taxRate % 1 === 0 ? 0 : 2)}%)` : ""}:</span>
                 <span>+${totalsSnapshot.taxAmount.toFixed(2)} ${activeCurrency ? activeCurrency.symbol : "ج.م"}</span>
               </div>`
            : ""
        }

        <div class="grand-total-box">
          <span>الصافي النهائي:</span>
          <span>${totalsSnapshot.grandTotal.toFixed(2)} ${activeCurrency ? activeCurrency.symbol : "ج.م"}</span>
        </div>

        ${
          paidVal > 0
            ? `<div class="totals-row">
                 <span>المبلغ المدفوع:</span>
                 <span>${paidVal.toFixed(2)} ${activeCurrency ? activeCurrency.symbol : "ج.م"}</span>
               </div>
               <div class="totals-row" style="font-weight: bold;">
                 <span>الباقي للعميل:</span>
                 <span>${changeVal.toFixed(2)} ${activeCurrency ? activeCurrency.symbol : "ج.م"}</span>
               </div>`
            : ""
        }
      </div>

      <div class="receipt-footer">
        <p>شكرًا لزيارتكم ونتمنى لكم يومًا سعيدًا!</p>
        <p>برنامج مانيجلي لإدارة الكاشير ونقاط البيع</p>
      </div>
    </body>
    </html>
  `;

  receiptHtml = buildSalesReceipt({
    settings: storeSettings,
    invoiceNumber,
    date: invoiceDateStr,
    paymentMethod: paymentLabel,
    customerName,
    customerPhone,
    items: itemsSnapshot.map((item) => {
      const lineSubtotal = Number(item.price || 0) * Number(item.quantity || 0);
      const itemDiscount = item.discountType === "percentage"
        ? (lineSubtotal * Number(item.discountValue || 0)) / 100
        : Number(item.discountValue || 0);
      return {
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        discount: itemDiscount,
        total: Math.max(0, lineSubtotal - itemDiscount),
      };
    }),
    subtotal: totalsSnapshot.subtotal,
    discount: totalsSnapshot.totalDiscount,
    tax: totalsSnapshot.taxAmount,
    taxRate: totalsSnapshot.taxRate,
    grandTotal: totalsSnapshot.grandTotal,
    paid: paidVal,
    change: changeVal,
    currency: activeCurrency ? activeCurrency.symbol : "ج.م",
  });

  resetInvoiceState();
  focusSearchInput();

  try {
    const printRes = await window.electronAPI.printInvoiceToPOS(receiptHtml, invoiceNumber, "mini");
    if (printRes && printRes.success) {
      playSound("success");
      Swal.fire({
        icon: "success",
        title: "تمت الطباعة",
        text: `تم إرسال الفاتورة للطابعة [${printRes.printerName || "الحرارية"}] بنجاح.`,
        confirmButtonColor: "#4f46e5",
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      const pdfPath = printRes?.filePath || await window.electronAPI.printInvoiceToPDF(receiptHtml, invoiceNumber, "mini");
      playSound("success");

      Swal.fire({
        icon: "info",
        title: "📄 تم تصدير الفاتورة كملف PDF",
        html: `
          <div style="text-align: right; font-size: 0.95rem; line-height: 1.6;">
            <p style="margin-bottom: 6px;">تم حفظ الفاتورة وتصديرها بصيغة PDF لعدم توفر طابعة كاشير حرارية متصلة:</p>
            <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-family: monospace; word-break: break-all; font-size: 0.85rem; color: #334155; margin-bottom: 10px; direction: ltr; text-align: left;">
              ${pdfPath || ""}
            </div>
            <p style="color: #64748b; font-size: 0.82rem; margin: 0;">تم فتح ملف الفاتورة تلقائياً لعرضه وطباعته.</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#059669",
        confirmButtonText: "📄 فتح الفاتورة",
        cancelButtonText: "📁 فتح المجلد",
      }).then((result) => {
        if (result.isConfirmed && pdfPath && window.electronAPI.openPath) {
          window.electronAPI.openPath(pdfPath);
        } else if (result.dismiss === Swal.DismissReason.cancel && pdfPath && window.electronAPI.showItemInFolder) {
          window.electronAPI.showItemInFolder(pdfPath);
        }
      });
    }
  } catch (err) {
    console.error("Print error:", err);
    Swal.fire({
      icon: "error",
      title: "تنبيه الفاتورة",
      text: "تعذر إتمام تصدير أو طباعة الفاتورة، يرجى المحاولة مرة أخرى.",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "حسناً",
    });
  }
}

// ==========================================================================
// Global Keyboard Shortcuts Dispatcher
// ==========================================================================
function handlePOSGlobalKeydown(e) {
  // If a SweetAlert modal or Calculator modal is open, let it handle keys
  if (document.querySelector(".swal2-shown") || (document.getElementById("managelyCalcModal") && document.getElementById("managelyCalcModal").classList.contains("active"))) return;

  const key = e.key;
  const code = e.code;
  const keyCode = e.keyCode || e.which;

  // F10 or Ctrl+Enter: Save & Print
  if (key === "F10" || code === "F10" || keyCode === 121 || (e.ctrlKey && (key === "Enter" || keyCode === 13))) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    saveAndPrintInvoice();
    return;
  }

  // Ctrl+S: Save Invoice Only
  if ((e.ctrlKey || e.metaKey) && (key === "s" || key === "S" || key === "س" || code === "KeyS")) {
    e.preventDefault();
    e.stopPropagation();
    saveInvoiceOnly();
    return;
  }

  // Ctrl+N: New Invoice
  if ((e.ctrlKey || e.metaKey) && (key === "n" || key === "N" || key === "ى" || code === "KeyN")) {
    e.preventDefault();
    e.stopPropagation();
    confirmResetInvoice();
    return;
  }

  // F3: Hold / Suspend Invoice
  if (key === "F3" || code === "F3" || keyCode === 114) {
    e.preventDefault();
    e.stopPropagation();
    suspendCurrentInvoice();
    return;
  }

  // F4: Focus Customer Name
  if (key === "F4" || code === "F4" || keyCode === 115) {
    e.preventDefault();
    e.stopPropagation();
    const custInput = document.getElementById("customerName");
    if (custInput) {
      custInput.focus();
      custInput.select();
    }
    return;
  }

  // F2 or '/' (when not typing in an input): Focus Product Search
  if (key === "F2" || code === "F2" || keyCode === 113 || (key === "/" && document.activeElement.tagName !== "INPUT")) {
    e.preventDefault();
    e.stopPropagation();
    const searchInput = document.getElementById("productSearch");
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
    return;
  }

  // F6: Focus Discount Input
  if (key === "F6" || code === "F6" || keyCode === 117) {
    e.preventDefault();
    e.stopPropagation();
    const discInput = document.getElementById("currentDiscountAmount");
    if (discInput) {
      discInput.focus();
      discInput.select();
    }
    return;
  }

  // F8: Focus Paid Amount Input
  if (key === "F8" || code === "F8" || keyCode === 119) {
    e.preventDefault();
    e.stopPropagation();
    const paidInput = document.getElementById("paidAmount");
    if (paidInput) {
      paidInput.focus();
      paidInput.select();
    }
    return;
  }

  // F1: Open Shortcuts Guide
  if (key === "F1" || code === "F1" || keyCode === 112) {
    e.preventDefault();
    e.stopPropagation();
    openShortcutsModal();
    return;
  }

  // Escape: Close modals or clear search
  if (key === "Escape" || code === "Escape" || keyCode === 27) {
    const activeModal = document.querySelector(".modal-overlay.active, .modal-overlay.open");
    if (activeModal) {
      activeModal.classList.remove("active");
      activeModal.classList.remove("open");
      focusSearchInput();
      return;
    }

    const productDropdown = document.getElementById("productDropdown");
    if (productDropdown && productDropdown.classList.contains("open")) {
      productDropdown.classList.remove("open");
      productDropdown.innerHTML = "";
      return;
    }

    const customerDropdown = document.getElementById("customerDropdown");
    if (customerDropdown && customerDropdown.classList.contains("open")) {
      customerDropdown.classList.remove("open");
      customerDropdown.innerHTML = "";
      return;
    }
  }
}

window.addEventListener("keydown", handlePOSGlobalKeydown, true);
document.addEventListener("keydown", handlePOSGlobalKeydown, true);


// ==========================================================================
// WhatsApp Invoice Direct Share
// ==========================================================================
async function shareCurrentInvoiceWhatsApp() {
  if (invoiceItems.length === 0) {
    playSound("error");
    Swal.fire({
      icon: "warning",
      title: "فاتورة فارغة",
      text: "يرجى إضافة منتجات إلى الفاتورة أولاً قبل المشاركة عبر واتساب.",
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "حسناً",
    });
    return;
  }

  const totals = getInvoiceTotals();
  let storeSettings = {};
  try {
    storeSettings = (await window.electronAPI.getSettings()) || {};
  } catch (e) {}

  const storeName = storeSettings.storeName || "متجر مانيجلي";
  const invNum = document.getElementById("invoiceNumber")?.textContent || "فاتورة مبيعات";
  const invDate = document.getElementById("invoiceDate")?.textContent || new Date().toLocaleDateString("ar-EG");
  const customerName = document.getElementById("customerName")?.value.trim() || "عميل نقدي";
  let customerPhone = (document.getElementById("customerPhone")?.value || "").replace(/\D/g, "");

  const currSym = activeCurrency ? activeCurrency.symbol : "ج.م";
  // Build items text
  let itemsText = "";
  invoiceItems.forEach((item, idx) => {
    const lineSub = item.price * item.quantity;
    const lineDiscount = item.discountType === "percentage" ? (lineSub * (item.discountValue || 0)) / 100 : item.discountValue || 0;
    const lineTotal = Math.max(0, lineSub - lineDiscount);
    itemsText += `${idx + 1}. *${item.name}*\n   الكمية: ${item.quantity} × ${item.price.toFixed(2)} = ${lineTotal.toFixed(2)} ${currSym}\n`;
  });

  const paymentLabel =
    {
      cash: "نقدي (كاش)",
      visaCard: "بطاقة فيزا",
      vodafoneCash: "محفظة إلكترونية",
      split: "دفع مقسم (كاش + فيزا)",
      credit: "آجل",
    }[currentPaymentMethod] || "نقدي";

  const msg = 
`🧾 *إشعار فاتورة إلكترونية*
🏪 *${storeName}*
--------------------------------
🔢 رقم الفاتورة: ${invNum}
📅 التاريخ: ${invDate}
👤 العميل: ${customerName}
--------------------------------
*الأصناف والمشتريات:*
${itemsText}--------------------------------
💵 الإجمالي الفرعي: ${totals.subtotal.toFixed(2)} ${currSym}
${totals.totalDiscount > 0 ? `🏷️ إجمالي الخصم: ${totals.totalDiscount.toFixed(2)} ${currSym}\n` : ""}💰 *الصافي المطلوب: ${totals.grandTotal.toFixed(2)} ${currSym}*
💳 طريقة الدفع: ${paymentLabel}
--------------------------------
شكراً لتعاملكم معنا ونتشرف بزيارتكم دائماً! ✨`;

  if (customerPhone) {
    if (customerPhone.startsWith("01")) {
      customerPhone = "2" + customerPhone;
    }
    const waUrl = `https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  } else {
    const { value: enteredPhone } = await Swal.fire({
      title: "إرسال الفاتورة عبر واتساب",
      input: "tel",
      inputLabel: "أدخل رقم هاتف العميل (واتساب):",
      inputPlaceholder: "01xxxxxxxxx",
      inputValue: "",
      showCancelButton: true,
      confirmButtonText: '<i class="fab fa-whatsapp"></i> فتح واتساب',
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#25D366",
      cancelButtonColor: "#64748b",
    });

    if (enteredPhone) {
      let cleanPhone = enteredPhone.replace(/\D/g, "");
      if (cleanPhone.startsWith("01")) {
        cleanPhone = "2" + cleanPhone;
      }
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank");
    }
  }
}

// ==========================================================================
// Window Global Exports for HTML event bindings
// ==========================================================================
window.addProductToInvoice = addProductToInvoice;
window.filterProductsByCategory = filterProductsByCategory;
window.searchProducts = searchProducts;
window.handleProductSearchKeydown = handleProductSearchKeydown;
window.selectAutocompleteItem = selectAutocompleteItem;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.updateQuantity = updateQuantity;
window.handleQuantityKeydown = handleQuantityKeydown;
window.updateItemPrice = updateItemPrice;
window.toggleItemDiscountType = toggleItemDiscountType;
window.updateItemDiscountValue = updateItemDiscountValue;
window.removeItem = removeItem;
window.updateInvoiceDiscount = updateInvoiceDiscount;
window.calculateTotals = calculateTotals;
window.setPaymentMethod = setPaymentMethod;
window.handleSplitAmountChange = handleSplitAmountChange;
window.calculateChange = calculateChange;
window.setExactPaid = setExactPaid;
window.addQuickCash = addQuickCash;
window.handleCustomerSearch = handleCustomerSearch;
window.handleCustomerSearchKeydown = handleCustomerSearchKeydown;
window.selectCustomerItem = selectCustomerItem;
window.openQuickCustomerModal = openQuickCustomerModal;
window.closeQuickCustomerModal = closeQuickCustomerModal;
window.handleQuickCustomerSubmit = handleQuickCustomerSubmit;
window.toggleExtraDetails = toggleExtraDetails;
window.openSuspendedInvoicesModal = openSuspendedInvoicesModal;
window.closeSuspendedInvoicesModal = closeSuspendedInvoicesModal;
window.suspendCurrentInvoice = suspendCurrentInvoice;
window.resumeSuspendedInvoice = resumeSuspendedInvoice;
window.deleteSuspendedInvoice = deleteSuspendedInvoice;
window.openDefaultDiscountSettings = openDefaultDiscountSettings;
window.closeDefaultDiscountModal = closeDefaultDiscountModal;
window.saveDefaultDiscountSettings = saveDefaultDiscountSettings;
window.deleteDefaultDiscountSettings = deleteDefaultDiscountSettings;
window.openDefaultTaxSettings = openDefaultTaxSettings;
window.closeDefaultTaxModal = closeDefaultTaxModal;
window.saveDefaultTaxSettings = saveDefaultTaxSettings;
window.deleteDefaultTaxSettings = deleteDefaultTaxSettings;
window.updateInvoiceTax = updateInvoiceTax;
window.openShortcutsModal = openShortcutsModal;
window.closeShortcutsModal = closeShortcutsModal;
window.handleModalOverlayClick = handleModalOverlayClick;
window.confirmResetInvoice = confirmResetInvoice;
window.confirmClearInvoice = confirmClearInvoice;
window.saveInvoiceOnly = saveInvoiceOnly;
window.saveAndPrintInvoice = saveAndPrintInvoice;
window.shareCurrentInvoiceWhatsApp = shareCurrentInvoiceWhatsApp;
window.parseScaleBarcode = parseScaleBarcode;
window.redeemCustomerPoints = redeemCustomerPoints;
window.updateCustomerLoyaltyUI = updateCustomerLoyaltyUI;
window.setInvoiceCurrency = setInvoiceCurrency;
window.loadCurrencies = loadCurrencies;

// Start init on page load
window.onload = initPage;

