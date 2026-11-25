import { paginateArray, renderPagination } from "./pagination.js";
import { hasPermission } from "./shared.js";

let allProducts = [];
let filteredProducts = [];
let selectedProductImageData = "";
let currentProductsPage = 1;
let productsPageSize = 10;
let lastRenderedProductsList = [];
let editingProductId = null;
let storeCurrencies = [];
let editingCurrencyId = null;

const els = {
    modal: document.getElementById("productModal"),
    form: document.getElementById("productForm"),
    formTitle: document.getElementById("formTitle"),
    formSubtitle: document.getElementById("formSubtitle"),
    modalIcon: document.getElementById("modalIcon"),
    editingProductId: document.getElementById("editingProductId"),
    productName: document.getElementById("productName"),
    productCategory: document.getElementById("productCategory"),
    productPrice: document.getElementById("productPrice"),
    productPurchasePrice: document.getElementById("productPurchasePrice"),
    productQuantity: document.getElementById("productQuantity"),
    productBarcode: document.getElementById("productBarcode"),
    barcodePreview: document.getElementById("barcodePreview"),
    reader: document.getElementById("reader"),
    scanMethod: document.getElementById("scanMethod"),
    productImageInput: document.getElementById("productImageInput"),
    productImageUploadBox: document.getElementById("productImageUploadBox"),
    productImagePreviewContainer: document.getElementById("productImagePreviewContainer"),
    productImagePreview: document.getElementById("productImagePreview"),
    productImageFileName: document.getElementById("productImageFileName"),
    productDescription: document.getElementById("productDescription"),
    saveProductBtn: document.getElementById("saveProductBtn"),
    productCurrencyPricesList: document.getElementById("productCurrencyPricesList"),
    productsSearch: document.getElementById("productsSearch"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    categoryFilter: document.getElementById("categoryFilter"),
    stockFilter: document.getElementById("stockFilter"),
    currencyFilter: document.getElementById("currencyFilter"),
    totalProductsCount: document.getElementById("totalProductsCount"),
    inStockCount: document.getElementById("inStockCount"),
    lowStockCount: document.getElementById("lowStockCount"),
    outOfStockCount: document.getElementById("outOfStockCount"),
    productsContainer: document.getElementById("products"),
    // Currencies Management Modal
    currenciesModal: document.getElementById("currenciesModal"),
    currencyForm: document.getElementById("currencyForm"),
    editingCurrencyId: document.getElementById("editingCurrencyId"),
    quickCurrencyPreset: document.getElementById("quickCurrencyPreset"),
    currencyName: document.getElementById("currencyName"),
    currencyCode: document.getElementById("currencyCode"),
    currencySymbol: document.getElementById("currencySymbol"),
    currencyExchangeRate: document.getElementById("currencyExchangeRate"),
    currencyIsDefault: document.getElementById("currencyIsDefault"),
    saveCurrencyBtn: document.getElementById("saveCurrencyBtn"),
    saveCurrencyBtnText: document.getElementById("saveCurrencyBtnText"),
    cancelCurrencyEditBtn: document.getElementById("cancelCurrencyEditBtn"),
    currencyFormTitle: document.getElementById("currencyFormTitle"),
    currenciesListContainer: document.getElementById("currenciesListContainer"),
    currenciesCountBadge: document.getElementById("currenciesCountBadge"),
    // Barcode Print Dedicated Modal
    barcodePrintModal: document.getElementById("printBarcodeModal"),
    printBarcodeForm: document.getElementById("printBarcodeForm"),
    printBarcodeProductId: document.getElementById("printBarcodeProductId"),
    modalIncludeStoreName: document.getElementById("modalIncludeStoreName"),
    modalIncludeProductName: document.getElementById("modalIncludeProductName"),
    modalIncludePrice: document.getElementById("modalIncludePrice"),
    modalStoreNameText: document.getElementById("modalStoreNameText"),
    modalProductNameText: document.getElementById("modalProductNameText"),
    modalPriceText: document.getElementById("modalPriceText"),
    modalPrintCopies: document.getElementById("modalPrintCopies"),
    modalPrintToPOS: document.getElementById("modalPrintToPOS"),
    barcodeModalProductSubtitle: document.getElementById("barcodeModalProductSubtitle"),
    stickerStoreName: document.getElementById("stickerStoreName"),
    stickerProductName: document.getElementById("stickerProductName"),
    stickerBarcodeSvg: document.getElementById("stickerBarcodeSvg"),
    stickerBarcodeText: document.getElementById("stickerBarcodeText"),
    stickerPrice: document.getElementById("stickerPrice"),
    executeBarcodePrintBtn: document.getElementById("executeBarcodePrintBtn"),
    // Import Products from Excel / CSV Modal
    importModal: document.getElementById("importProductsModal"),
    importFileInput: document.getElementById("importFileInput"),
    importDropzone: document.getElementById("importDropzone"),
    importPreviewSection: document.getElementById("importPreviewSection"),
    importFileName: document.getElementById("importFileName"),
    importTotalRows: document.getElementById("importTotalRows"),
    importNewCategoriesCount: document.getElementById("importNewCategoriesCount"),
    duplicateStrategySelect: document.getElementById("duplicateStrategySelect"),
    autoCreateCategoriesCheck: document.getElementById("autoCreateCategoriesCheck"),
    importPreviewTableBody: document.getElementById("importPreviewTableBody"),
    importProgressBarWrap: document.getElementById("importProgressBarWrap"),
    importProgressBar: document.getElementById("importProgressBar"),
    importProgressStatus: document.getElementById("importProgressStatus"),
    executeImportBtn: document.getElementById("executeImportBtn")
};

/* ==========================================================================
   Image Processing & Upload
   ========================================================================== */
function processImageFile(file, callback) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        showError("حجم كبير!", "يرجى اختيار صورة أقل من 5 ميجابايت.");
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDim = 500;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            callback(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

export function previewProductImage(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    processImageFile(file, (dataUrl) => {
        selectedProductImageData = dataUrl;
        if (els.productImagePreview) els.productImagePreview.src = dataUrl;
        if (els.productImageFileName) els.productImageFileName.textContent = file.name;
        if (els.productImageUploadBox) els.productImageUploadBox.style.display = "none";
        if (els.productImagePreviewContainer) els.productImagePreviewContainer.style.display = "flex";
    });
}

export function removeProductImage() {
    selectedProductImageData = "";
    if (els.productImageInput) els.productImageInput.value = "";
    if (els.productImagePreview) els.productImagePreview.src = "";
    if (els.productImageFileName) els.productImageFileName.textContent = "";
    if (els.productImageUploadBox) els.productImageUploadBox.style.display = "flex";
    if (els.productImagePreviewContainer) els.productImagePreviewContainer.style.display = "none";
}

/* ==========================================================================
   Category Options
   ========================================================================== */
export async function renderCategoryOptions() {
    try {
        const categories = await window.electronAPI.getCategories();
        const options = `<option value="">اختار الفئة</option>${categories.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join("")}`;
        if (els.productCategory) els.productCategory.innerHTML = options;
        if (els.categoryFilter) {
            els.categoryFilter.innerHTML = `<option value="">جميع الفئات</option>${categories.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join("")}`;
        }
    } catch (e) {
        console.error("Error loading categories:", e);
    }
}

/* ==========================================================================
   Loading & Statistics
   ========================================================================== */
export async function loadProducts() {
    try {
        showLoading(true);
        allProducts = await window.electronAPI.getProducts();
        if (!Array.isArray(allProducts)) allProducts = [];
        filteredProducts = [...allProducts];
        updateStatistics();
        renderProducts();
    } catch (error) {
        showError("خطأ", "فشل في تحميل قائمة المنتجات: " + error.message);
    } finally {
        showLoading(false);
    }
}

export function updateStatistics(products = allProducts) {
    const total = products.length;
    const inStock = products.filter(p => Number(p.quantity) > 10).length;
    const lowStock = products.filter(p => Number(p.quantity) > 0 && Number(p.quantity) <= 10).length;
    const outOfStock = products.filter(p => Number(p.quantity) <= 0).length;

    if (els.totalProductsCount) els.totalProductsCount.textContent = total;
    if (els.inStockCount) els.inStockCount.textContent = inStock;
    if (els.lowStockCount) els.lowStockCount.textContent = lowStock;
    if (els.outOfStockCount) els.outOfStockCount.textContent = outOfStock;
}

export function formatCurrency(amount) {
    const val = parseFloat(amount) || 0;
    const isInteger = val % 1 === 0;
    const defaultCurr = (Array.isArray(storeCurrencies) && storeCurrencies.find(c => c.isDefault)) || { symbol: "ج.م" };
    const symbol = defaultCurr.symbol || "ج.م";
    const formattedNum = new Intl.NumberFormat("ar-EG", {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: 2
    }).format(val);
    return `${formattedNum} ${symbol}`;
}

/* ==========================================================================
   Rendering Products Main Table
   ========================================================================== */
export async function renderProducts(productsToRender = null, resetPage = false) {
    const container = els.productsContainer;
    if (!container) return;

    try {
        const products = productsToRender || filteredProducts || allProducts;
        lastRenderedProductsList = products;
        if (resetPage) {
            currentProductsPage = 1;
        }

        if (!products.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon-wrap"><i class="fas fa-boxes-stacked"></i></div>
                    <h3>لا توجد منتجات مسجلة</h3>
                    <p>لم يتم العثور على أية منتجات مطابقة للبحث أو الفلتر المحدد</p>
                    <button onclick="openAddProductModal()" class="add-product-btn-header" style="margin: 0 auto; display: inline-flex;">
                        <i class="fas fa-plus-circle"></i> إضافة منتج جديد
                    </button>
                </div>
            `;
            const pag = document.getElementById("productsPagination");
            if (pag) pag.innerHTML = "";
            return;
        }

        const { pageItems, totalItems, currentPage } = paginateArray(products, currentProductsPage, productsPageSize);
        currentProductsPage = currentPage;

        const rows = pageItems.map(p => {
            const qty = Number(p.quantity) || 0;
            let stockBadge = "";
            if (qty > 10) {
                stockBadge = `<span class="stock-badge stock-in"><i class="fas fa-check-circle"></i> متوفر (${qty})</span>`;
            } else if (qty > 0) {
                stockBadge = `<span class="stock-badge stock-low"><i class="fas fa-exclamation-triangle"></i> منخفض (${qty})</span>`;
            } else {
                stockBadge = `<span class="stock-badge stock-out"><i class="fas fa-times-circle"></i> نفذ (0)</span>`;
            }

            const salePriceFormatted = formatCurrency(p.price);
            const purchasePriceFormatted = p.purchasePrice ? formatCurrency(p.purchasePrice) : "--";

            return `
                <tr id="product-row-${p._id}">
                    <td style="width: 60px; text-align: center;">
                        <div class="prod-thumb-wrap">
                            ${p.image ? `<img src="${p.image}" alt="${escapeHTML(p.name)}" class="prod-thumb-img">` : `<i class="fas fa-box prod-thumb-placeholder"></i>`}
                        </div>
                    </td>

                    <td>
                        <div class="prod-name-title">${escapeHTML(p.name)}</div>
                        ${p.description ? `<div class="prod-name-desc" title="${escapeHTML(p.description)}">${escapeHTML(p.description)}</div>` : ''}
                    </td>

                    <td>
                        <span class="prod-cat-badge">
                            <i class="fas fa-layer-group"></i>
                            <span>${escapeHTML(p.category || 'عام')}</span>
                        </span>
                    </td>

                    <td>
                        <span class="price-tag-sale">${salePriceFormatted}</span>
                        ${p.currencyPrices && Array.isArray(p.currencyPrices) && p.currencyPrices.length > 0 ? `
                            <div class="currency-prices-badges-wrap">
                                ${p.currencyPrices.map(cp => `
                                    <span class="currency-badge-pill" title="سعر البيع بـ ${escapeHTML(cp.currencyName || cp.currencyCode)}">
                                        <i class="fas fa-coins" style="font-size: 8px;"></i>
                                        <span>${Number(cp.price).toFixed(2)} ${escapeHTML(cp.currencySymbol || cp.currencyCode)}</span>
                                    </span>
                                `).join("")}
                            </div>
                        ` : ''}
                    </td>

                    <td>
                        <span class="price-tag-purchase">${purchasePriceFormatted}</span>
                    </td>

                    <td>
                        ${stockBadge}
                    </td>

                    <td style="text-align: center;">
                        ${p.barcode ? `
                            <div class="table-barcode-wrap">
                                <svg class="barcode-svg" jsbarcode-format="CODE128" jsbarcode-value="${escapeHTML(p.barcode)}" jsbarcode-displayvalue="false" jsbarcode-width="1.2" jsbarcode-height="18" jsbarcode-margin="0"></svg>
                                <span class="table-barcode-code">${escapeHTML(p.barcode)}</span>
                            </div>
                        ` : `<span style="color: #94a3b8; font-size: 0.8rem;">غير محدد</span>`}
                    </td>

                    <td>
                        <div class="table-action-btns">
                            <button class="btn-tbl-action btn-tbl-view" onclick="viewProduct('${p._id}')" title="عرض تفاصيل المنتج">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-tbl-action btn-tbl-barcode" onclick="printBarcode('${p._id}')" title="طباعة الباركود">
                                <i class="fas fa-barcode"></i>
                            </button>
                            <button class="btn-tbl-action btn-tbl-edit" onclick="openEditProductModal('${p._id}')" title="تعديل المنتج">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="btn-tbl-action btn-tbl-delete" onclick="deleteProduct('${p._id}')" title="حذف المنتج">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        container.innerHTML = `
            <div class="products-table-wrap">
                <table class="products-table">
                    <thead>
                        <tr>
                            <th style="width: 5%;">الصورة</th>
                            <th style="width: 25%;">اسم المنتج</th>
                            <th style="width: 15%;">الفئة</th>
                            <th style="width: 12%;">سعر البيع</th>
                            <th style="width: 12%;">سعر الشراء</th>
                            <th style="width: 12%;">المخزون</th>
                            <th style="width: 11%; text-align: center;">الباركود</th>
                            <th style="width: 8%; text-align: center;">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
            <div id="productsPagination" style="padding: 16px; border-top: 1px solid #ede9fe;"></div>
        `;

        if (typeof JsBarcode !== "undefined") {
            JsBarcode(".barcode-svg").init();
        }

        renderPagination({
            container: "productsPagination",
            totalItems: totalItems,
            currentPage: currentProductsPage,
            pageSize: productsPageSize,
            pageSizeOptions: [10, 25, 50, 100],
            onPageChange: (newPage, newSize) => {
                currentProductsPage = newPage;
                productsPageSize = newSize;
                renderProducts(lastRenderedProductsList, false);
                if (els.productsContainer) {
                    els.productsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        });
    } catch (e) {
        console.error("Error in renderProducts:", e);
    }
}

/* ==========================================================================
   Filter & Search
   ========================================================================== */
export function filterProducts() {
    const searchTerm = els.productsSearch ? els.productsSearch.value.trim().toLowerCase() : "";
    const categoryFilter = els.categoryFilter ? els.categoryFilter.value : "";
    const stockFilter = els.stockFilter ? els.stockFilter.value : "";
    const currencyFilter = els.currencyFilter ? els.currencyFilter.value : "";

    if (els.clearSearchBtn) {
        if (searchTerm) {
            els.clearSearchBtn.classList.remove("hidden");
        } else {
            els.clearSearchBtn.classList.add("hidden");
        }
    }

    filteredProducts = allProducts.filter(p => {
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const barcode = (p.barcode || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();

        const matchesSearch = !searchTerm ||
            name.includes(searchTerm) ||
            desc.includes(searchTerm) ||
            barcode.includes(searchTerm) ||
            cat.includes(searchTerm);

        const matchesCategory = !categoryFilter || p.category === categoryFilter;

        let matchesStock = true;
        const qty = Number(p.quantity) || 0;
        if (stockFilter === "inStock") matchesStock = qty > 10;
        else if (stockFilter === "lowStock") matchesStock = qty > 0 && qty <= 10;
        else if (stockFilter === "outOfStock") matchesStock = qty <= 0;

        let matchesCurrency = true;
        if (currencyFilter) {
            const isBase = storeCurrencies.find(c => c.code === currencyFilter)?.isDefault;
            if (isBase) {
                matchesCurrency = Number(p.price) > 0;
            } else {
                matchesCurrency = Boolean(p.currencyPrices && Array.isArray(p.currencyPrices) && p.currencyPrices.some(cp => cp.currencyCode === currencyFilter && Number(cp.price) > 0));
            }
        }

        return matchesSearch && matchesCategory && matchesStock && matchesCurrency;
    });

    renderProducts(filteredProducts, true);
    updateStatistics(filteredProducts);
}

export function clearSearch() {
    if (els.productsSearch) {
        els.productsSearch.value = "";
        els.productsSearch.focus();
    }
    if (els.clearSearchBtn) els.clearSearchBtn.classList.add("hidden");
    filterProducts();
}

export function resetFilters() {
    if (els.productsSearch) els.productsSearch.value = "";
    if (els.clearSearchBtn) els.clearSearchBtn.classList.add("hidden");
    if (els.categoryFilter) els.categoryFilter.value = "";
    if (els.stockFilter) els.stockFilter.value = "";
    if (els.currencyFilter) els.currencyFilter.value = "";

    filteredProducts = [...allProducts];
    renderProducts(allProducts, true);
    updateStatistics();
}

export function quickFilterStock(status) {
    if (els.stockFilter) {
        els.stockFilter.value = status;
        filterProducts();
    }
}

/* ==========================================================================
   Modal Operations (Add / Edit / Save / Delete)
   ========================================================================== */
export function openAddProductModal() {
    if (!hasPermission('canAddProduct')) {
        showError("غير مسموح", "عفواً، ليس لديك صلاحية إضافة منتجات جديدة.");
        return;
    }

    editingProductId = null;
    resetProductForm();
    renderProductCurrencyPriceRows([]);

    if (els.formTitle) els.formTitle.textContent = "إضافة منتج جديد";
    if (els.formSubtitle) els.formSubtitle.textContent = "أدخل تفاصيل المنتج، الأسعار، والمخزون بدقة";
    if (els.modalIcon) els.modalIcon.innerHTML = `<i class="fas fa-plus-circle"></i>`;
    if (els.saveProductBtn) {
        els.saveProductBtn.innerHTML = `<i class="fas fa-plus-circle"></i><span>حفظ المنتج</span>`;
    }

    if (els.modal) els.modal.classList.add("open");
    document.body.classList.add("modal-open-lock");
    setTimeout(() => {
        if (els.productName) els.productName.focus();
    }, 150);
}

export async function openEditProductModal(productId) {
    if (!hasPermission('canEditProduct')) {
        showError("غير مسموح", "عفواً، ليس لديك صلاحية تعديل بيانات المنتجات.");
        return;
    }

    const p = allProducts.find(item => item._id === productId);
    if (!p) return;

    editingProductId = productId;
    resetProductForm();
    if (els.editingProductId) els.editingProductId.value = productId;

    if (els.formTitle) els.formTitle.textContent = `تعديل بيانات المنتج: ${p.name}`;
    if (els.formSubtitle) els.formSubtitle.textContent = "تعديل وتحديث أسعار ومخزون ومعلومات المنتج";
    if (els.modalIcon) els.modalIcon.innerHTML = `<i class="fas fa-edit"></i>`;
    if (els.saveProductBtn) {
        els.saveProductBtn.innerHTML = `<i class="fas fa-save"></i><span>حفظ التعديلات</span>`;
    }

    if (els.productName) els.productName.value = p.name || "";
    if (els.productCategory) els.productCategory.value = p.category || "";
    if (els.productPrice) els.productPrice.value = p.price || "";
    if (els.productPurchasePrice) els.productPurchasePrice.value = p.purchasePrice || "";
    if (els.productQuantity) els.productQuantity.value = p.quantity !== undefined ? p.quantity : 1;
    if (els.productBarcode) els.productBarcode.value = p.barcode || "";
    if (els.productDescription) els.productDescription.value = p.description || "";

    renderProductCurrencyPriceRows(p.currencyPrices || []);

    if (p.barcode) {
        renderBarcode(p.barcode, "barcodePreview");
    }

    if (p.image) {
        selectedProductImageData = p.image;
        if (els.productImagePreview) els.productImagePreview.src = p.image;
        if (els.productImageUploadBox) els.productImageUploadBox.style.display = "none";
        if (els.productImagePreviewContainer) els.productImagePreviewContainer.style.display = "flex";
    }

    if (els.modal) els.modal.classList.add("open");
    document.body.classList.add("modal-open-lock");
    setTimeout(() => {
        if (els.productName) els.productName.focus();
    }, 150);
}

export function closeProductModal() {
    if (els.modal) els.modal.classList.remove("open");
    document.body.classList.remove("modal-open-lock");
    resetProductForm();
}

export function handleModalOverlayClick(e) {
    if (e.target === els.modal) {
        closeProductModal();
    }
}

export function resetProductForm() {
    if (els.form) els.form.reset();
    if (els.editingProductId) els.editingProductId.value = "";
    removeProductImage();
    if (els.barcodePreview) els.barcodePreview.innerHTML = "";
    if (els.reader) els.reader.style.display = "none";
    if (els.productCurrencyPricesList) els.productCurrencyPricesList.innerHTML = "";
}

export async function saveProduct() {
    const isEditing = Boolean(editingProductId);
    if (isEditing && !hasPermission('canEditProduct')) {
        showError("غير مسموح", "عفواً، ليس لديك صلاحية تعديل بيانات المنتجات.");
        return;
    }
    if (!isEditing && !hasPermission('canAddProduct')) {
        showError("غير مسموح", "عفواً، ليس لديك صلاحية إضافة منتجات جديدة.");
        return;
    }

    const name = els.productName ? els.productName.value.trim() : "";
    const category = els.productCategory ? els.productCategory.value : "";
    const price = parseFloat(els.productPrice ? els.productPrice.value : 0);
    const purchasePrice = parseFloat(els.productPurchasePrice && els.productPurchasePrice.value ? els.productPurchasePrice.value : 0) || 0;
    const quantity = parseInt(els.productQuantity ? els.productQuantity.value : 0) || 0;
    const barcode = els.productBarcode ? els.productBarcode.value.trim() : "";
    const description = els.productDescription ? els.productDescription.value.trim() : "";
    const currencyPrices = collectProductCurrencyPrices();

    if (!name) {
        showError("بيانات غير مكتملة", "يرجى إدخال اسم المنتج.");
        if (els.productName) els.productName.focus();
        return;
    }
    if (!category) {
        showError("بيانات غير مكتملة", "يرجى اختيار فئة للمنتج.");
        if (els.productCategory) els.productCategory.focus();
        return;
    }
    if (isNaN(price) || price <= 0) {
        showError("بيانات غير صحيحة", "يرجى إدخال سعر بيع صحيح أكبر من 0.");
        if (els.productPrice) els.productPrice.focus();
        return;
    }
    if (isNaN(quantity) || quantity < 0) {
        showError("بيانات غير صحيحة", "يرجى إدخال كمية صحيحة للمخزون.");
        if (els.productQuantity) els.productQuantity.focus();
        return;
    }

    const payload = {
        name,
        category,
        price,
        purchasePrice,
        quantity,
        barcode,
        description,
        currencyPrices,
        image: selectedProductImageData || ""
    };

    try {
        showLoading(true);
        if (els.saveProductBtn) els.saveProductBtn.disabled = true;

        if (editingProductId) {
            await window.electronAPI.updateProduct(editingProductId, payload);
            const idx = allProducts.findIndex(p => p._id === editingProductId);
            if (idx !== -1) {
                allProducts[idx] = { _id: editingProductId, ...payload };
            }
            showSuccess("تم تحديث بيانات المنتج بنجاح");
        } else {
            const created = await window.electronAPI.addProduct(payload);
            allProducts.unshift(created);
            showSuccess("تمت إضافة المنتج الجديد بنجاح");
        }

        closeProductModal();
        filterProducts();
    } catch (err) {
        showError("فشل في حفظ المنتج", err.message || "حدث خطأ غير متوقع");
    } finally {
        showLoading(false);
        if (els.saveProductBtn) els.saveProductBtn.disabled = false;
    }
}

export async function deleteProduct(productId) {
    if (!hasPermission('canDeleteProduct')) {
        showError("غير مسموح", "عفواً، ليس لديك صلاحية حذف المنتجات.");
        return;
    }

    const product = allProducts.find(p => p._id === productId);
    if (!product) return;

    const res = await Swal.fire({
        title: "هل أنت متأكد؟",
        text: `سيتم حذف المنتج "${product.name}" نهائياً من قاعدة البيانات!`,
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
            await window.electronAPI.deleteProduct(productId);
            allProducts = allProducts.filter(p => p._id !== productId);
            filterProducts();
            showSuccess("تم حذف المنتج بنجاح");
        } catch (e) {
            showError("خطأ", "حدث خطأ أثناء حذف المنتج: " + e.message);
        } finally {
            showLoading(false);
        }
    }
}

/* ==========================================================================
   Barcode Generation & Scanning
   ========================================================================== */
export function generateUniqueBarcode() {
    return "BC-" + Math.random().toString(36).substr(2, 9).toUpperCase() + "-" + Date.now();
}

export function renderBarcode(barcodeVal, targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    const cleanVal = barcodeVal ? String(barcodeVal).trim() : "";
    if (cleanVal !== "") {
        el.innerHTML = `<svg id="${targetId}-svg" class="barcode-preview-svg"></svg>`;
        const svgEl = document.getElementById(`${targetId}-svg`);
        if (svgEl && typeof JsBarcode !== "undefined") {
            try {
                JsBarcode(svgEl, cleanVal, {
                    format: "CODE128",
                    displayValue: false,
                    width: 1.2,
                    height: 26,
                    margin: 0
                });
            } catch (err) {
                console.warn("JsBarcode preview error:", err);
            }
        }
    } else {
        el.innerHTML = "";
    }
}

export function generateAndRenderBarcode() {
    const barcode = generateUniqueBarcode();
    if (els.productBarcode) {
        els.productBarcode.value = barcode;
    }
    renderBarcode(barcode, "barcodePreview");
}

export async function startScanning() {
    const method = els.scanMethod ? els.scanMethod.value : "camera";
    if (method === "camera") {
        scanWithCamera();
    } else {
        scanWithScanner();
    }
}

export async function scanWithCamera() {
    const reader = els.reader;
    if (!reader) return;
    reader.style.display = "block";
    reader.innerHTML = '<video id="video" style="width: 100%; border-radius: 8px; border: 1.5px solid #6d28d9; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></video>';

    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = reader.querySelector("video");
        video.srcObject = stream;
        await video.play();
    } catch (e) {
        reader.style.display = "none";
        showError("خطأ في الكاميرا", `تعذر الوصول للكاميرا: ${e.message}`);
        return;
    }

    if (typeof Quagga !== "undefined") {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: reader.querySelector("video"),
                constraints: { video: { facingMode: "environment" } }
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader"]
            }
        }, function (err) {
            if (err) {
                if (stream) stream.getTracks().forEach(t => t.stop());
                reader.style.display = "none";
                showError("خطأ", "فشل في تهيئة مسح الباركود: " + err.message);
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected(function (result) {
            if (result && result.codeResult && result.codeResult.code) {
                const code = result.codeResult.code;
                if (els.productBarcode) els.productBarcode.value = code;
                renderBarcode(code, "barcodePreview");
                Quagga.stop();
                if (stream) stream.getTracks().forEach(t => t.stop());
                reader.style.display = "none";
            }
        });
    }
}

export function scanWithScanner() {
    if (els.reader) els.reader.style.display = "none";
    Swal.fire({
        title: "مسح بالسكانر",
        text: "يرجى مسح الباركود باستخدام جهاز السكانر، وسيتم إدخاله تلقائياً.",
        icon: "info",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#6d28d9"
    });
    if (els.productBarcode) {
        els.productBarcode.focus();
        const handler = (e) => {
            const val = e.target.value.trim();
            if (val) {
                renderBarcode(val, "barcodePreview");
                els.productBarcode.removeEventListener("input", handler);
            }
        };
        els.productBarcode.addEventListener("input", handler);
    }
}

/* ==========================================================================
   Full View Product Details Modal (Eye Icon)
   ========================================================================== */
export async function viewProduct(productId) {
    const t = allProducts.find(p => p._id === productId);
    if (!t) {
        showError("خطأ", "المنتج غير موجود!");
        return;
    }

    const qty = Number(t.quantity) || 0;
    const qtyBadge = qty > 10
        ? `<span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;"><i class="fas fa-check-circle" style="font-size: 10px;"></i> متوفر (${qty})</span>`
        : qty > 0
            ? `<span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #fef9c3; color: #a16207; border: 1px solid #fef08a;"><i class="fas fa-exclamation-triangle" style="font-size: 10px;"></i> منخفض (${qty})</span>`
            : `<span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;"><i class="fas fa-times-circle" style="font-size: 10px;"></i> نفذ (0)</span>`;

    const price = Number(t.price) || 0;
    const purchasePrice = Number(t.purchasePrice) || 0;
    const profit = price - purchasePrice;
    const profitMargin = purchasePrice > 0 ? ((profit / purchasePrice) * 100).toFixed(0) : (price > 0 ? 100 : 0);

    Swal.fire({
        width: "720px",
        showCloseButton: true,
        showConfirmButton: true,
        confirmButtonText: "إغلاق",
        confirmButtonColor: "#6d28d9",
        customClass: {
            popup: "rounded-2xl shadow-2xl"
        },
        html: `
        <div class="w-full text-right" dir="rtl" style="font-family: 'Tajawal', sans-serif;">
            <div style="background: linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%); padding: 18px 24px; border-radius: 14px; margin-bottom: 16px; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px;">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <div>
                        <h2 style="font-size: 19px; font-weight: 800; margin: 0; line-height: 1.2;">${escapeHTML(t.name)}</h2>
                        <p style="font-size: 12px; color: rgba(255,255,255,0.85); margin: 3px 0 0 0;">الفئة: ${escapeHTML(t.category || "عام")}</p>
                    </div>
                </div>
                <div>${qtyBadge}</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px;">
                <div style="background: #f8fafc; border: 1px solid #ede9fe; border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 16px;">
                    <div style="width: 90px; height: 90px; border-radius: 12px; overflow: hidden; background: #ffffff; border: 1.5px solid #ede9fe; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${t.image ? `<img src="${t.image}" alt="${escapeHTML(t.name)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-box" style="font-size: 30px; color: #6d28d9;"></i>`}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 4px;">الوصف:</div>
                        <div style="font-size: 13px; color: #334155; line-height: 1.5;">${t.description ? escapeHTML(t.description) : '<span style="color: #94a3b8; font-style: italic;">لا يوجد وصف مسجل لهذا المنتج</span>'}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 12px; text-align: right;">
                        <div style="font-size: 11px; font-weight: 700; color: #059669; margin-bottom: 2px;">سعر البيع (الأساسي)</div>
                        <div style="font-size: 18px; font-weight: 900; color: #059669;">${formatCurrency(price)}</div>
                    </div>
                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px; text-align: right;">
                        <div style="font-size: 11px; font-weight: 700; color: #2563eb; margin-bottom: 2px;">سعر الشراء</div>
                        <div style="font-size: 18px; font-weight: 900; color: #2563eb;">${formatCurrency(purchasePrice)}</div>
                    </div>
                    <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 12px; text-align: right;">
                        <div style="font-size: 11px; font-weight: 700; color: #6d28d9; margin-bottom: 2px;">هامش الربح</div>
                        <div style="font-size: 18px; font-weight: 900; color: #6d28d9;">${profit >= 0 ? '+' : ''}${formatCurrency(profit)} (${profitMargin}%)</div>
                    </div>
                </div>

                ${t.currencyPrices && Array.isArray(t.currencyPrices) && t.currencyPrices.length > 0 ? `
                    <div style="background: #fbfbfe; border: 1px solid #ede9fe; border-radius: 12px; padding: 12px 16px;">
                        <div style="font-size: 11px; font-weight: 700; color: #6d28d9; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-coins text-amber-500"></i>
                            <span>الأسعار بالعملات الإضافية:</span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${t.currencyPrices.map(cp => `
                                <div style="background: #ffffff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 6px 12px; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
                                    <span style="font-weight: 800; color: #1e1b4b; font-size: 13px;">${escapeHTML(cp.currencyName || cp.currencyCode)}:</span>
                                    <span style="font-weight: 900; color: #059669; font-size: 14px;">${Number(cp.price).toFixed(2)} ${escapeHTML(cp.currencySymbol || cp.currencyCode)}</span>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                ` : ''}

                ${t.barcode ? `
                    <div style="background: #fdfcff; border: 1px solid #ede9fe; border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <span style="font-size: 11px; font-weight: 700; color: #64748b;">كود الباركود:</span>
                            <span style="font-size: 13px; font-family: monospace; font-weight: 800; color: #1e1b4b; margin-right: 8px;">${escapeHTML(t.barcode)}</span>
                        </div>
                        <div>
                            <svg class="barcode-modal" jsbarcode-format="CODE128" jsbarcode-value="${escapeHTML(t.barcode)}" jsbarcode-displayvalue="false" jsbarcode-width="1.6" jsbarcode-height="30" jsbarcode-margin="0"></svg>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>`,
        didOpen: () => {
            if (t.barcode && typeof JsBarcode !== "undefined") {
                JsBarcode(".barcode-modal").init();
            }
        }
    });
}

/* ==========================================================================
   Dedicated Barcode Print Modal Operations
   ========================================================================== */
let activeBarcodeProduct = null;
let currentStoreName = "زيزو كاشير";

export async function openPrintBarcodeModal(productId) {
    try {
        const product = allProducts.find(p => p._id === productId);
        if (!product) {
            showError("خطأ!", "المنتج غير موجود!");
            return;
        }
        if (!product.barcode || product.barcode.trim() === "") {
            showError("تنبيه", "لا يوجد كود باركود مسجل لهذا المنتج! يرجى إضافة باركود للمنتج أولاً من خلال زر التعديل.");
            return;
        }

        activeBarcodeProduct = product;

        // Fetch store name from settings
        try {
            const settings = await window.electronAPI.getSettings();
            if (settings && settings.storeName) {
                currentStoreName = settings.storeName;
            }
        } catch (err) {
            console.warn("Could not fetch store settings:", err);
        }

        if (els.printBarcodeProductId) els.printBarcodeProductId.value = product._id;
        if (els.barcodeModalProductSubtitle) {
            els.barcodeModalProductSubtitle.textContent = `المنتج: ${product.name} | الباركود: ${product.barcode}`;
        }
        if (els.modalStoreNameText) els.modalStoreNameText.textContent = currentStoreName;
        if (els.modalProductNameText) els.modalProductNameText.textContent = product.name;
        if (els.modalPriceText) els.modalPriceText.textContent = formatCurrency(product.price);
        if (els.modalPrintCopies) els.modalPrintCopies.value = 1;
        if (els.modalPrintToPOS) els.modalPrintToPOS.checked = false;

        // Reset checkboxes default to checked
        if (els.modalIncludeStoreName) els.modalIncludeStoreName.checked = true;
        if (els.modalIncludeProductName) els.modalIncludeProductName.checked = true;
        if (els.modalIncludePrice) els.modalIncludePrice.checked = true;

        updateBarcodeStickerPreview();

        if (els.barcodePrintModal) els.barcodePrintModal.classList.add("open");
        document.body.classList.add("modal-open-lock");
    } catch (e) {
        showError("خطأ", "تعذر فتح نافذة طباعة الباركود: " + e.message);
    }
}

export function closePrintBarcodeModal() {
    if (els.barcodePrintModal) els.barcodePrintModal.classList.remove("open");
    document.body.classList.remove("modal-open-lock");
    activeBarcodeProduct = null;
}

export function handleBarcodeModalOverlayClick(e) {
    if (e.target === els.barcodePrintModal) {
        closePrintBarcodeModal();
    }
}

export function updateBarcodeStickerPreview() {
    if (!activeBarcodeProduct) return;

    const includeStore = els.modalIncludeStoreName ? els.modalIncludeStoreName.checked : true;
    const includeProd = els.modalIncludeProductName ? els.modalIncludeProductName.checked : true;
    const includePrice = els.modalIncludePrice ? els.modalIncludePrice.checked : true;

    if (els.stickerStoreName) {
        els.stickerStoreName.style.display = includeStore ? "block" : "none";
        els.stickerStoreName.textContent = currentStoreName;
    }
    if (els.stickerProductName) {
        els.stickerProductName.style.display = includeProd ? "block" : "none";
        els.stickerProductName.textContent = activeBarcodeProduct.name || "";
    }
    if (els.stickerBarcodeText) {
        els.stickerBarcodeText.textContent = activeBarcodeProduct.barcode || "";
    }
    if (els.stickerPrice) {
        els.stickerPrice.style.display = includePrice ? "block" : "none";
        els.stickerPrice.textContent = formatCurrency(activeBarcodeProduct.price);
    }

    if (els.stickerBarcodeSvg && activeBarcodeProduct.barcode) {
        if (typeof JsBarcode !== "undefined") {
            try {
                JsBarcode(els.stickerBarcodeSvg, activeBarcodeProduct.barcode.trim(), {
                    format: "CODE128",
                    displayValue: false,
                    width: 1.3,
                    height: 28,
                    margin: 0
                });
            } catch (err) {
                console.warn("Sticker JsBarcode error:", err);
            }
        }
    }
}

export async function executeBarcodePrint() {
    if (!activeBarcodeProduct) return;

    const t = activeBarcodeProduct;
    const includeStoreName = els.modalIncludeStoreName ? els.modalIncludeStoreName.checked : true;
    const includeProductName = els.modalIncludeProductName ? els.modalIncludeProductName.checked : true;
    const includePrice = els.modalIncludePrice ? els.modalIncludePrice.checked : true;
    const copies = parseInt(els.modalPrintCopies ? els.modalPrintCopies.value : 1) || 1;
    const printToPOS = els.modalPrintToPOS ? els.modalPrintToPOS.checked : false;

    try {
        showLoading(true);
        if (els.executeBarcodePrintBtn) els.executeBarcodePrintBtn.disabled = true;

        let d = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>طباعة الباركود - ${escapeHTML(t.name)}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                <style>
                    @page { margin: 0; size: 38mm 20mm; }
                    body { margin: 0; font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 0; }
                    .barcode-container {
                        width: 33mm;
                        height: 15mm;
                        padding: 1mm;
                        margin: 0;
                        border: 1px dashed #ddd;
                        background: white;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    .name-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin: 0;
                        width: 90%;
                    }
                    .barcode { margin: 0 auto; width: 90%; }
                    .store-name { font-size: 8px; font-weight: bold; margin: 0; }
                    .product-name { font-size: 7px; margin: 0; line-height: 1; }
                    .barcode-text { font-size: 6px; margin: 0; }
                    .price { font-size: 7px; font-weight: bold; color: #059669; margin-top: 1px; }
                    @media print { .barcode-container { break-inside: avoid; } }
                </style>
            </head>
            <body>`;
        for (let a = 0; a < copies; a++) {
            d += `
                <div class="barcode-container">
                    <div class="name-container">
                        ${includeStoreName ? `<div class="store-name">${escapeHTML(currentStoreName)}</div>` : ""}
                        ${includeProductName ? `<div class="product-name">${escapeHTML(t.name)}</div>` : ""}
                    </div>
                    <svg class="barcode" jsbarcode-format="CODE128" jsbarcode-value="${escapeHTML(t.barcode)}" jsbarcode-displayvalue="false"></svg>
                    <div class="barcode-text">${escapeHTML(t.barcode)}</div>
                    ${includePrice ? `<div class="price">${t.price} ج.م</div>` : ""}
                </div>`;
        }
        d += `
            <script>
                JsBarcode(".barcode").init();
            </script>
        </body>
        </html>`;

        if (printToPOS) {
            const e = await window.electronAPI.printInvoiceToPOS(d, t.barcode, "mini");
            if (e && e.skipped) {
                showError("تنبيه!", e.message);
            } else {
                showSuccess("تم إرسال أمر الطباعة بنجاح إلى الطابعة الحرارية.");
                closePrintBarcodeModal();
            }
        } else {
            const pdfPath = await window.electronAPI.printBarcode(d, t.barcode, "barcode");
            showSuccess(`تم حفظ الباركود بنجاح كملف PDF: ${pdfPath}`);
            closePrintBarcodeModal();
        }
    } catch (e) {
        showError("خطأ أثناء الطباعة", e.message || "فشلت عملية الطباعة.");
    } finally {
        showLoading(false);
        if (els.executeBarcodePrintBtn) els.executeBarcodePrintBtn.disabled = false;
    }
}

// Global printBarcode alias to open modal
export const printBarcode = openPrintBarcodeModal;

/* ==========================================================================
   Bulk Products Import (Excel / CSV)
   ========================================================================== */
let _importedProductsPayload = [];
let _detectedNewCategories = new Set();

export function openImportProductsModal() {
    if (!hasPermission('canImportProducts')) {
        showError("غير مسموح", "عفواً، ليس لديك صلاحية استيراد المنتجات.");
        return;
    }

    resetImportModalState();
    if (els.importModal) {
        els.importModal.classList.add("open");
        document.body.classList.add("modal-open-lock");
    }
}

export function closeImportProductsModal() {
    if (els.importModal) {
        els.importModal.classList.remove("open");
        document.body.classList.remove("modal-open-lock");
    }
    resetImportModalState();
}

export function handleImportModalOverlayClick(e) {
    if (e.target === els.importModal) {
        closeImportProductsModal();
    }
}

function resetImportModalState() {
    _importedProductsPayload = [];
    _detectedNewCategories.clear();
    if (els.importFileInput) els.importFileInput.value = "";
    if (els.importDropzone) {
        els.importDropzone.classList.remove("drag-over");
        els.importDropzone.style.display = "flex";
    }
    if (els.importPreviewSection) els.importPreviewSection.classList.add("hidden");
    if (els.importPreviewTableBody) els.importPreviewTableBody.innerHTML = "";
    if (els.importProgressBarWrap) els.importProgressBarWrap.classList.add("hidden");
    if (els.importProgressBar) els.importProgressBar.style.width = "0%";
    if (els.executeImportBtn) {
        els.executeImportBtn.disabled = true;
        els.executeImportBtn.innerHTML = `<i class="fas fa-file-import"></i><span>بدء استيراد المنتجات</span>`;
    }
}

export function downloadProductExcelTemplate() {
    try {
        if (typeof XLSX === "undefined") {
            showError("تنبيه", "مكتبة Excel غير محملة، يرجى التأكد من اتصال الإنترنت.");
            return;
        }

        const sampleData = [
            {
                "اسم المنتج": "شاي ليبتون 100 فتلة",
                "الفئة": "مشروبات ساخنة",
                "سعر البيع": 85.00,
                "سعر الشراء": 70.00,
                "الكمية": 50,
                "الباركود": "622100100101",
                "الوصف": "شاي أسود ناعم 100 كيس"
            },
            {
                "اسم المنتج": "سكر أبيض 1 كجم",
                "الفئة": "بقالة",
                "سعر البيع": 35.00,
                "سعر الشراء": 29.50,
                "الكمية": 100,
                "الباركود": "622100100102",
                "الوصف": "سكر نقي عالي الجودة"
            },
            {
                "اسم المنتج": "أرز مصري فاخر 1 كجم",
                "الفئة": "بقالة",
                "سعر البيع": 32.00,
                "سعر الشراء": 26.00,
                "الكمية": 80,
                "الباركود": "622100100103",
                "الوصف": "أرز حبة عريضة درجة أولى"
            },
            {
                "اسم المنتج": "زيت عباد الشمس 800 مل",
                "الفئة": "زيوت وسمن",
                "سعر البيع": 65.00,
                "سعر الشراء": 54.00,
                "الكمية": 40,
                "الباركود": "622100100104",
                "الوصف": "زيت نقي للطهي والقلي"
            }
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sampleData);

        // Auto-width columns for nice presentation
        ws["!cols"] = [
            { wch: 28 }, // اسم المنتج
            { wch: 18 }, // الفئة
            { wch: 14 }, // سعر البيع
            { wch: 14 }, // سعر الشراء
            { wch: 12 }, // الكمية
            { wch: 20 }, // الباركود
            { wch: 32 }  // الوصف
        ];

        XLSX.utils.book_append_sheet(wb, ws, "المنتجات");
        XLSX.writeFile(wb, "نموذج_استيراد_المنتجات_Managely.xlsx");
    } catch (err) {
        console.error("Error downloading template:", err);
        showError("خطأ", "فشل في توليد نموذج الإكسيل: " + err.message);
    }
}

export function handleImportFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    parseAndPreviewImportFile(file);
}

function cleanKeyName(str) {
    return (str || "")
        .toString()
        .toLowerCase()
        .replace(/[\(\)\[\]\{\}\/\\,\.\*_\-:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function parseNumber(val) {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleaned = val.toString().replace(/[^0-9.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function parseInteger(val) {
    if (typeof val === "number") return isNaN(val) ? 0 : Math.round(val);
    if (!val) return 0;
    const cleaned = val.toString().replace(/[^0-9-]/g, "");
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
}

function parseAndPreviewImportFile(file) {
    if (typeof XLSX === "undefined") {
        showError("تنبيه", "مكتبة معالجة الملفات غير متوفرة.");
        return;
    }

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileNameLower = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileNameLower.endsWith(ext));
    if (!isValidExt) {
        showError("صيغة غير مدعومة", "يرجى اختيار ملف بإحدى الصيغ المدعومة (.xlsx, .xls, .csv).");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                showError("ملف فارغ", "لم يتم العثور على أوراق عمل داخل الملف.");
                return;
            }

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

            if (!rawRows || rawRows.length === 0) {
                showError("ملف فارغ", "لا توجد أية صفوف أو بيانات داخل ورقة العمل الأولى.");
                return;
            }

            // Get existing categories to detect new ones
            let existingCategoryNames = new Set();
            try {
                const categories = await window.electronAPI.getCategories();
                if (Array.isArray(categories)) {
                    categories.forEach(c => {
                        if (c.name) existingCategoryNames.add(c.name.trim().toLowerCase());
                    });
                }
            } catch (catErr) {
                console.warn("Could not fetch existing categories:", catErr);
            }

            _importedProductsPayload = [];
            _detectedNewCategories.clear();

            rawRows.forEach((row, idx) => {
                const normalized = normalizeProductRow(row, idx + 2); // 1-based index including header
                if (normalized && normalized.name) {
                    _importedProductsPayload.push(normalized);
                    if (normalized.category && !existingCategoryNames.has(normalized.category.toLowerCase())) {
                        _detectedNewCategories.add(normalized.category);
                    }
                }
            });

            if (_importedProductsPayload.length === 0) {
                showError("لا توجد بيانات صالحة", "لم يتم العثور على أسماء منتجات صالحة في الملف. يرجى مراجعة عناوين الأعمدة والبيانات.");
                return;
            }

            // Update UI with preview
            if (els.importFileName) els.importFileName.textContent = file.name;
            if (els.importTotalRows) els.importTotalRows.textContent = _importedProductsPayload.length;
            if (els.importNewCategoriesCount) els.importNewCategoriesCount.textContent = _detectedNewCategories.size;

            renderImportPreviewTable(_importedProductsPayload);

            if (els.importPreviewSection) els.importPreviewSection.classList.remove("hidden");
            if (els.importDropzone) els.importDropzone.style.display = "none";
            if (els.executeImportBtn) els.executeImportBtn.disabled = false;

        } catch (err) {
            console.error("Error reading import file:", err);
            showError("خطأ في قراءة الملف", "تعذر معالجة وقراءة محتويات الملف: " + err.message);
        }
    };

    reader.onerror = function () {
        showError("خطأ", "حدث خطأ أثناء قراءة الملف من الجهاز.");
    };

    reader.readAsArrayBuffer(file);
}

function normalizeProductRow(row, rowIndex) {
    if (!row || typeof row !== "object") return null;

    let name = "";
    let category = "عام";
    let price = 0;
    let purchasePrice = 0;
    let quantity = 0;
    let barcode = "";
    let descriptionParts = [];
    let image = "";

    for (const [rawKey, rawVal] of Object.entries(row)) {
        const key = cleanKeyName(rawKey);
        const valStr = rawVal !== undefined && rawVal !== null ? rawVal.toString().trim() : "";
        if (!valStr && valStr !== "0") continue;

        // 1. Product Name
        if (/اسم\s*المنتج|اسم\s*الصنف|اسم\s*السلعة|اسم\s*البضاعة|^الاسم$|^المنتج$|^الصنف$|^name$|product\s*name|item\s*name|^title$/i.test(key)) {
            if (!name) name = valStr;
        }
        // 2. Category
        else if (/^الفئة$|^فئة$|^التصنيف$|^تصنيف$|^القسم$|^قسم$|^النوع$|^نوع$|^category$|^cat$|^dept$|^department$|^group$|^class$/i.test(key)) {
            if (valStr) category = valStr;
        }
        // 3. Purchase Price / Cost (Check BEFORE sale price so 'سعر الشراء' doesn't accidentally match generic 'سعر')
        else if (/سعر\s*الشراء|سعر\s*التكلفة|سعر\s*الجملة|سعر\s*المورد|تكلفة|شراء|cost|purchase\s*price|buy\s*price|supplier\s*price/i.test(key)) {
            purchasePrice = parseNumber(valStr);
        }
        // 4. Sale Price
        else if (/سعر\s*البيع|سعر\s*القطاعي|سعر\s*الجمهور|سعر\s*المستهلك|^السعر$|^سعر$|^price$|sale\s*price|sell\s*price|retail\s*price|unit\s*price/i.test(key)) {
            price = parseNumber(valStr);
        }
        // 5. Quantity / Stock
        else if (/الكمية\s*بالمخزون|الكمية\s*المتاحة|كمية\s*المخزن|رصيد|مخزون|^الكمية$|^الكميه$|^المخزون$|^العدد$|^quantity$|^qty$|^stock$|^count$|^balance$/i.test(key)) {
            quantity = parseInteger(valStr);
        }
        // 6. Barcode / SKU
        else if (/كود\s*الباركود|الباركود|باركود|كود\s*المنتج|كود\s*الصنف|^الباركود|^كود$|^barcode$|^sku$|^upc$|^ean$|^code$/i.test(key)) {
            barcode = valStr;
        }
        // 7. Image
        else if (/صورة|image|photo|pic/i.test(key)) {
            image = valStr;
        }
        // 8. Description & Notes
        else if (/وصف|ملاحظات|تفاصيل|بيان|مواصفات|شرح|description|desc|notes|details|memo/i.test(key)) {
            if (valStr) descriptionParts.push(valStr);
        }
    }

    // Fallback if name wasn't matched but there's a column with 'اسم' or 'name' or 'item' or 'product'
    if (!name) {
        for (const [rawKey, rawVal] of Object.entries(row)) {
            const key = cleanKeyName(rawKey);
            if (/اسم|name|item|product/i.test(key) && rawVal) {
                name = rawVal.toString().trim();
                break;
            }
        }
    }

    if (!name) return null;

    return {
        name,
        category: category || "عام",
        price,
        purchasePrice,
        quantity,
        barcode,
        description: descriptionParts.join(" - "),
        image,
        rowIndex
    };
}

function renderImportPreviewTable(items) {
    if (!els.importPreviewTableBody) return;

    const previewList = items.slice(0, 5); // Show first 5 rows
    const rowsHtml = previewList.map((item, index) => {
        return `
            <tr>
                <td style="font-weight: 700; color: #64748b;">${index + 1}</td>
                <td style="font-weight: 700; color: #1e1b4b;">${escapeHTML(item.name)}</td>
                <td><span class="preview-cat-badge">${escapeHTML(item.category)}</span></td>
                <td style="color: #059669; font-weight: 700;">${formatCurrency(item.price)}</td>
                <td style="color: #64748b;">${item.purchasePrice ? formatCurrency(item.purchasePrice) : "--"}</td>
                <td><span class="preview-qty-badge">${item.quantity}</span></td>
                <td style="font-family: monospace; color: #4b5563;">${escapeHTML(item.barcode || "--")}</td>
            </tr>
        `;
    }).join("");

    els.importPreviewTableBody.innerHTML = rowsHtml;
}

export async function executeProductsImport() {
    if (!_importedProductsPayload || _importedProductsPayload.length === 0) {
        showError("تنبيه", "يرجى اختيار ملف يحتوي على منتجات أولاً.");
        return;
    }

    const duplicateStrategy = els.duplicateStrategySelect ? els.duplicateStrategySelect.value : "update";
    const autoCreateCategories = els.autoCreateCategoriesCheck ? els.autoCreateCategoriesCheck.checked : true;

    try {
        if (els.importProgressBarWrap) els.importProgressBarWrap.classList.remove("hidden");
        if (els.importProgressBar) els.importProgressBar.style.width = "40%";
        if (els.importProgressStatus) els.importProgressStatus.textContent = `جاري معالجة ${_importedProductsPayload.length} منتج...`;
        if (els.executeImportBtn) {
            els.executeImportBtn.disabled = true;
            els.executeImportBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>جاري الاستيراد...</span>`;
        }

        const result = await window.electronAPI.importProductsBatch({
            products: _importedProductsPayload,
            duplicateStrategy,
            autoCreateCategories
        });

        if (els.importProgressBar) els.importProgressBar.style.width = "100%";
        if (els.importProgressStatus) els.importProgressStatus.textContent = "اكتملت المعالجة بنجاح!";

        await new Promise(r => setTimeout(r, 400));

        closeImportProductsModal();

        // Show comprehensive summary SweetAlert
        Swal.fire({
            title: "تم الاستيراد بنجاح! 🎉",
            html: `
                <div style="text-align: right; direction: rtl; font-size: 0.95rem; line-height: 1.8;">
                    <p style="color: #059669; font-weight: 700; margin-bottom: 12px;">
                        <i class="fas fa-check-circle"></i> تم إكمال معالجة ملف المنتجات بنجاح.
                    </p>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px;">
                        <div>📦 <strong>إجمالي المنتجات في الملف:</strong> <span style="font-weight: 700;">${result.totalRows}</span></div>
                        <div style="color: #059669;">➕ <strong>منتجات جديدة تمت إضافتها:</strong> <span style="font-weight: 700;">${result.addedCount}</span></div>
                        <div style="color: #2563eb;">🔄 <strong>منتجات تم تحديثها:</strong> <span style="font-weight: 700;">${result.updatedCount}</span></div>
                        ${result.skippedCount > 0 ? `<div style="color: #d97706;">⏭️ <strong>منتجات تم تخطيها:</strong> <span style="font-weight: 700;">${result.skippedCount}</span></div>` : ""}
                        ${result.newCategoriesCount > 0 ? `<div style="color: #7c3aed;">🏷️ <strong>فئات جديدة تم إنشاؤها تلقائياً:</strong> <span style="font-weight: 700;">${result.newCategoriesCount}</span></div>` : ""}
                    </div>
                    ${result.errors && result.errors.length > 0 ? `
                        <div style="max-height: 120px; overflow-y: auto; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px; font-size: 0.82rem; color: #9f1239;">
                            <strong>ملاحظات التخطي (${result.errors.length}):</strong><br/>
                            ${result.errors.map(e => escapeHTML(e)).join("<br/>")}
                        </div>
                    ` : ""}
                </div>
            `,
            icon: "success",
            confirmButtonText: "رائع، استمرار",
            confirmButtonColor: "#6d28d9"
        });

        // Refresh UI
        await renderCategoryOptions();
        await loadProducts();

    } catch (err) {
        console.error("Error executing products import:", err);
        showError("فشل الاستيراد", "حدث خطأ أثناء معالجة البيانات: " + err.message);
    } finally {
        if (els.importProgressBarWrap) els.importProgressBarWrap.classList.add("hidden");
        if (els.executeImportBtn) {
            els.executeImportBtn.disabled = false;
            els.executeImportBtn.innerHTML = `<i class="fas fa-file-import"></i><span>بدء استيراد المنتجات</span>`;
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
   Store Currencies Management
   ========================================================================== */
export function populateCurrencyFilterOptions() {
    if (!els.currencyFilter) return;
    const currentVal = els.currencyFilter.value;
    els.currencyFilter.innerHTML = `<option value="">جميع العملات</option>` + storeCurrencies.map(c => `
        <option value="${escapeHTML(c.code)}" ${c.code === currentVal ? 'selected' : ''}>
            ${escapeHTML(c.name)} (${escapeHTML(c.code)} - ${escapeHTML(c.symbol)})
        </option>
    `).join("");
}

export async function loadCurrencies() {
    try {
        storeCurrencies = await window.electronAPI.getCurrencies() || [];
        populateCurrencyFilterOptions();
    } catch (err) {
        console.error("Error loading store currencies:", err);
        storeCurrencies = [];
    }
}

export async function openCurrenciesModal() {
    await loadCurrencies();
    resetCurrencyForm();
    renderCurrenciesList();
    if (els.currenciesModal) els.currenciesModal.classList.add("open");
    document.body.classList.add("modal-open-lock");
}

export function closeCurrenciesModal() {
    if (els.currenciesModal) els.currenciesModal.classList.remove("open");
    document.body.classList.remove("modal-open-lock");
    resetCurrencyForm();
}

export function handleCurrenciesModalOverlayClick(e) {
    if (e.target === els.currenciesModal) {
        closeCurrenciesModal();
    }
}

export function applyCurrencyPreset(val) {
    if (!val) return;
    const parts = val.split("|");
    if (parts.length >= 3) {
        const code = parts[0];
        const name = parts[1];
        const symbol = parts[2];
        if (els.currencyCode) els.currencyCode.value = code;
        if (els.currencyName) els.currencyName.value = name;
        if (els.currencySymbol) els.currencySymbol.value = symbol;
        if (els.currencyExchangeRate) {
            els.currencyExchangeRate.focus();
            els.currencyExchangeRate.select();
        }
    }
}

export function resetCurrencyForm() {
    editingCurrencyId = null;
    if (els.currencyForm) els.currencyForm.reset();
    if (els.editingCurrencyId) els.editingCurrencyId.value = "";
    if (els.quickCurrencyPreset) els.quickCurrencyPreset.value = "";
    if (els.currencyExchangeRate) els.currencyExchangeRate.value = "1";
    if (els.currencyIsDefault) els.currencyIsDefault.checked = false;
    if (els.currencyFormTitle) {
        els.currencyFormTitle.innerHTML = `<i class="fas fa-plus-circle text-amber-500"></i><span>إضافة عملة جديدة للمتجر</span>`;
    }
    if (els.saveCurrencyBtnText) els.saveCurrencyBtnText.textContent = "حفظ العملة";
    if (els.cancelCurrencyEditBtn) els.cancelCurrencyEditBtn.classList.add("hidden");
}

export function editCurrency(id) {
    const curr = storeCurrencies.find(c => c._id === id);
    if (!curr) return;

    editingCurrencyId = id;
    if (els.editingCurrencyId) els.editingCurrencyId.value = id;
    if (els.quickCurrencyPreset) els.quickCurrencyPreset.value = "";
    if (els.currencyName) els.currencyName.value = curr.name || "";
    if (els.currencyCode) els.currencyCode.value = curr.code || "";
    if (els.currencySymbol) els.currencySymbol.value = curr.symbol || "";
    if (els.currencyExchangeRate) els.currencyExchangeRate.value = curr.exchangeRate || 1;
    if (els.currencyIsDefault) els.currencyIsDefault.checked = Boolean(curr.isDefault);

    if (els.currencyFormTitle) {
        els.currencyFormTitle.innerHTML = `<i class="fas fa-edit text-blue-500"></i><span>تعديل العملة: ${escapeHTML(curr.name)}</span>`;
    }
    if (els.saveCurrencyBtnText) els.saveCurrencyBtnText.textContent = "حفظ التعديلات";
    if (els.cancelCurrencyEditBtn) els.cancelCurrencyEditBtn.classList.remove("hidden");

    if (els.currencyName) els.currencyName.focus();
}

export async function saveCurrency() {
    const name = els.currencyName ? els.currencyName.value.trim() : "";
    const code = els.currencyCode ? els.currencyCode.value.trim().toUpperCase() : "";
    const symbol = els.currencySymbol ? els.currencySymbol.value.trim() : "";
    const exchangeRate = parseFloat(els.currencyExchangeRate ? els.currencyExchangeRate.value : 1) || 1;
    const isDefault = els.currencyIsDefault ? els.currencyIsDefault.checked : false;

    if (!name || !code || !symbol) {
        showError("بيانات ناقصة", "يرجى ملء اسم العملة، الكود، والرمز.");
        return;
    }

    const payload = {
        name,
        code,
        symbol,
        exchangeRate,
        isDefault
    };

    try {
        showLoading(true);
        const targetId = editingCurrencyId || storeCurrencies.find(c => (c.code || "").toUpperCase() === code)?._id;
        if (targetId) {
            await window.electronAPI.updateCurrency(targetId, payload);
            showSuccess("تم تحديث بيانات العملة بنجاح");
        } else {
            await window.electronAPI.addCurrency(payload);
            showSuccess("تمت إضافة العملة بنجاح");
        }
        await loadCurrencies();
        resetCurrencyForm();
        renderCurrenciesList();
    } catch (err) {
        showError("خطأ في حفظ العملة", err.message || "فشلت العملية");
    } finally {
        showLoading(false);
    }
}

export async function deleteCurrency(id) {
    const curr = storeCurrencies.find(c => c._id === id);
    if (!curr) return;

    if (curr.isDefault) {
        showError("عملة أساسية", "لا يمكن حذف العملة الأساسية للمتجر. يمكنك تعيين عملة أخرى كأساسية أولاً.");
        return;
    }

    const res = await Swal.fire({
        title: "حذف العملة؟",
        text: `هل أنت متأكد من حذف العملة "${curr.name} (${curr.code})"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم، احذفها",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
        reverseButtons: true
    });

    if (res.isConfirmed) {
        try {
            showLoading(true);
            await window.electronAPI.deleteCurrency(id);
            showSuccess("تم حذف العملة بنجاح");
            await loadCurrencies();
            if (editingCurrencyId === id) resetCurrencyForm();
            renderCurrenciesList();
        } catch (err) {
            showError("خطأ أثناء الحذف", err.message || "تعذر حذف العملة");
        } finally {
            showLoading(false);
        }
    }
}

export function renderCurrenciesList() {
    if (!els.currenciesListContainer) return;
    if (els.currenciesCountBadge) {
        els.currenciesCountBadge.textContent = `${storeCurrencies.length} عملات`;
    }

    if (storeCurrencies.length === 0) {
        els.currenciesListContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: #94a3b8;">
                <i class="fas fa-coins" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
                لم يتم تسجيل أي عملات حتى الآن
            </div>
        `;
        return;
    }

    els.currenciesListContainer.innerHTML = storeCurrencies.map(c => `
        <div class="currency-card-item ${c.isDefault ? 'is-default-card' : ''}">
            <div class="curr-card-top">
                <span class="curr-code-pill">
                    <i class="fas fa-globe"></i>
                    <span>${escapeHTML(c.code)}</span>
                </span>
                ${c.isDefault ? `
                    <span class="curr-default-badge">
                        <i class="fas fa-star text-amber-500"></i>
                        <span>الأساسية</span>
                    </span>
                ` : `
                    <span style="font-size: 0.78rem; font-weight: 700; color: #64748b; background: #f8fafc; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                        فرعية
                    </span>
                `}
            </div>

            <div class="curr-card-body">
                <div class="curr-card-name">${escapeHTML(c.name)} <span style="color: #6d28d9; font-weight: 800;">(${escapeHTML(c.symbol)})</span></div>
                <div class="curr-card-rate">
                    ${c.isDefault ? 'العملة المعتمدة للمتجر' : `سعر الصرف: <strong>${c.exchangeRate || 1}</strong>`}
                </div>
            </div>

            <div class="curr-card-actions">
                <button type="button" class="btn-curr-action btn-curr-edit" onclick="editCurrency('${c._id}')" title="تعديل العملة">
                    <i class="fas fa-pen"></i>
                    <span>تعديل</span>
                </button>
                ${!c.isDefault ? `
                    <button type="button" class="btn-curr-action btn-curr-delete" onclick="deleteCurrency('${c._id}')" title="حذف العملة">
                        <i class="fas fa-trash-alt"></i>
                        <span>حذف</span>
                    </button>
                ` : `
                    <button type="button" class="btn-curr-action" disabled style="opacity: 0.4; cursor: not-allowed; background: #f1f5f9; color: #94a3b8;" title="العملة الأساسية لا تحذف">
                        <i class="fas fa-lock"></i>
                        <span>أساسية</span>
                    </button>
                `}
            </div>
        </div>
    `).join("");
}

/* ==========================================================================
   Product Multi-Currency Pricing
   ========================================================================== */
export function addProductCurrencyPriceRow(data = {}) {
    if (!els.productCurrencyPricesList) return;

    const availableCurrencies = storeCurrencies.filter(c => !c.isDefault);
    if (availableCurrencies.length === 0) {
        showError("لا توجد عملات إضافية", "يرجى إضافة عملات أخرى للمتجر من خلال زر (إدارة العملات) أولاً.");
        return;
    }

    const rowId = "curr_row_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const selectedCurrencyCode = data.currencyCode || (availableCurrencies[0] ? availableCurrencies[0].code : "");
    const priceValue = data.price !== undefined ? data.price : "";

    const rowDiv = document.createElement("div");
    rowDiv.className = "currency-price-row";
    rowDiv.id = rowId;

    const optionsHtml = availableCurrencies.map(c => `
        <option value="${escapeHTML(c.code)}" data-symbol="${escapeHTML(c.symbol)}" data-name="${escapeHTML(c.name)}" data-id="${c._id}" ${c.code === selectedCurrencyCode ? 'selected' : ''}>
            ${escapeHTML(c.name)} (${escapeHTML(c.code)} - ${escapeHTML(c.symbol)})
        </option>
    `).join("");

    const initialCurrency = availableCurrencies.find(c => c.code === selectedCurrencyCode) || availableCurrencies[0];
    const initialSymbol = initialCurrency ? initialCurrency.symbol : "$";

    rowDiv.innerHTML = `
        <div class="curr-select-wrap">
            <select class="modal-select product-currency-select" onchange="handleProductCurrencySelectChange(this)" style="padding: 8px 12px; font-size: 0.88rem;">
                ${optionsHtml}
            </select>
        </div>
        <div class="curr-price-input-wrap">
            <input type="number" step="any" min="0" class="modal-input product-currency-price-input" placeholder="0.00" value="${priceValue}" required style="padding: 8px 12px; font-size: 0.9rem; font-weight: 700;">
        </div>
        <div class="curr-symbol-badge">
            <span class="curr-symbol-text">${escapeHTML(initialSymbol)}</span>
        </div>
        <button type="button" class="btn-remove-curr-row" onclick="removeProductCurrencyPriceRow('${rowId}')" title="حذف هذا السعر">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    els.productCurrencyPricesList.appendChild(rowDiv);
}

export function handleProductCurrencySelectChange(selectEl) {
    const row = selectEl.closest(".currency-price-row");
    if (!row) return;
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    const symbol = selectedOption.getAttribute("data-symbol") || "";
    const symbolText = row.querySelector(".curr-symbol-text");
    if (symbolText) symbolText.textContent = symbol;
}

export function removeProductCurrencyPriceRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) row.remove();
}

export function collectProductCurrencyPrices() {
    if (!els.productCurrencyPricesList) return [];
    const rows = els.productCurrencyPricesList.querySelectorAll(".currency-price-row");
    const list = [];
    const seenCodes = new Set();

    for (const row of rows) {
        const select = row.querySelector(".product-currency-select");
        const priceInput = row.querySelector(".product-currency-price-input");
        if (select && priceInput) {
            const code = select.value;
            const price = parseFloat(priceInput.value) || 0;
            const opt = select.options[select.selectedIndex];
            const symbol = opt ? opt.getAttribute("data-symbol") : "";
            const name = opt ? opt.getAttribute("data-name") : "";
            const currencyId = opt ? opt.getAttribute("data-id") : "";

            if (price > 0 && !seenCodes.has(code)) {
                seenCodes.add(code);
                list.push({
                    currencyId,
                    currencyCode: code,
                    currencyName: name,
                    currencySymbol: symbol,
                    price
                });
            }
        }
    }
    return list;
}

export function renderProductCurrencyPriceRows(prices = []) {
    if (!els.productCurrencyPricesList) return;
    els.productCurrencyPricesList.innerHTML = "";
    if (Array.isArray(prices) && prices.length > 0) {
        prices.forEach(p => addProductCurrencyPriceRow(p));
    }
}

export function autoCalculateProductCurrencyPrices() {
    const basePrice = parseFloat(els.productPrice ? els.productPrice.value : 0) || 0;
    if (basePrice <= 0) {
        showError("تنبيه السعر", "يرجى إدخال سعر البيع (بالعملة الأساسية) أولاً لحساب أسعار باقي العملات تلقائياً.");
        if (els.productPrice) els.productPrice.focus();
        return;
    }

    const nonDefaultCurrencies = storeCurrencies.filter(c => !c.isDefault);
    if (nonDefaultCurrencies.length === 0) {
        showError("لا توجد عملات إضافية", "يرجى إضافة عملات أخرى للمتجر من خلال زر (العملات) في الأعلى أولاً.");
        return;
    }

    if (els.productCurrencyPricesList) {
        els.productCurrencyPricesList.innerHTML = "";
    }

    nonDefaultCurrencies.forEach(c => {
        const rate = parseFloat(c.exchangeRate) || 1;
        const converted = rate > 0 ? (basePrice / rate).toFixed(2) : basePrice.toFixed(2);
        addProductCurrencyPriceRow({
            currencyId: c._id,
            currencyCode: c.code,
            currencyName: c.name,
            currencySymbol: c.symbol,
            price: parseFloat(converted)
        });
    });

    showSuccess(`تم حساب الأسعار تلقائياً لـ (${nonDefaultCurrencies.length}) عملات بنجاح بناءً على أسعار الصرف.`);
}

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (els.currenciesModal && els.currenciesModal.classList.contains("open")) {
                closeCurrenciesModal();
            } else if (els.importModal && els.importModal.classList.contains("open")) {
                closeImportProductsModal();
            } else if (els.barcodePrintModal && els.barcodePrintModal.classList.contains("open")) {
                closePrintBarcodeModal();
            } else if (els.modal && els.modal.classList.contains("open")) {
                closeProductModal();
            }
        }
    });

    // Setup Drag and Drop for Import Modal Dropzone
    if (els.importDropzone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            els.importDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                els.importDropzone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            els.importDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                els.importDropzone.classList.remove('drag-over');
            }, false);
        });

        els.importDropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                parseAndPreviewImportFile(files[0]);
            }
        }, false);
    }

    await loadCurrencies();
    await renderCategoryOptions();
    await loadProducts();
});

// Window globals for inline HTML event handlers
window.openAddProductModal = openAddProductModal;
window.openEditProductModal = openEditProductModal;
window.closeProductModal = closeProductModal;
window.handleModalOverlayClick = handleModalOverlayClick;
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
window.viewProduct = viewProduct;
window.printBarcode = printBarcode;
window.openPrintBarcodeModal = openPrintBarcodeModal;
window.closePrintBarcodeModal = closePrintBarcodeModal;
window.handleBarcodeModalOverlayClick = handleBarcodeModalOverlayClick;
window.updateBarcodeStickerPreview = updateBarcodeStickerPreview;
window.executeBarcodePrint = executeBarcodePrint;
window.openImportProductsModal = openImportProductsModal;
window.closeImportProductsModal = closeImportProductsModal;
window.handleImportModalOverlayClick = handleImportModalOverlayClick;
window.downloadProductExcelTemplate = downloadProductExcelTemplate;
window.handleImportFileSelect = handleImportFileSelect;
window.executeProductsImport = executeProductsImport;
window.filterProducts = filterProducts;
window.resetFilters = resetFilters;
window.clearSearch = clearSearch;
window.quickFilterStock = quickFilterStock;
window.previewProductImage = previewProductImage;
window.removeProductImage = removeProductImage;
window.generateAndRenderBarcode = generateAndRenderBarcode;
window.renderBarcode = renderBarcode;
window.startScanning = startScanning;
window.scanWithCamera = scanWithCamera;
window.scanWithScanner = scanWithScanner;

// Currencies window globals
window.openCurrenciesModal = openCurrenciesModal;
window.closeCurrenciesModal = closeCurrenciesModal;
window.handleCurrenciesModalOverlayClick = handleCurrenciesModalOverlayClick;
window.resetCurrencyForm = resetCurrencyForm;
window.editCurrency = editCurrency;
window.saveCurrency = saveCurrency;
window.deleteCurrency = deleteCurrency;
window.applyCurrencyPreset = applyCurrencyPreset;
window.addProductCurrencyPriceRow = addProductCurrencyPriceRow;
window.handleProductCurrencySelectChange = handleProductCurrencySelectChange;
window.removeProductCurrencyPriceRow = removeProductCurrencyPriceRow;
window.autoCalculateProductCurrencyPrices = autoCalculateProductCurrencyPrices;
window.populateCurrencyFilterOptions = populateCurrencyFilterOptions;