import { paginateArray, renderPagination } from "./pagination.js";

let allProducts = [];
let filteredProducts = [];
let selectedProductImageData = "";
let currentProductsPage = 1;
let productsPageSize = 10;
let lastRenderedProductsList = [];
let editingProductId = null;

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
    productsSearch: document.getElementById("productsSearch"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    categoryFilter: document.getElementById("categoryFilter"),
    stockFilter: document.getElementById("stockFilter"),
    totalProductsCount: document.getElementById("totalProductsCount"),
    inStockCount: document.getElementById("inStockCount"),
    lowStockCount: document.getElementById("lowStockCount"),
    outOfStockCount: document.getElementById("outOfStockCount"),
    productsContainer: document.getElementById("products"),
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
    executeBarcodePrintBtn: document.getElementById("executeBarcodePrintBtn")
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
    const formattedNum = new Intl.NumberFormat("ar-EG", {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: 2
    }).format(val);
    return `${formattedNum} ج.م`;
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

        return matchesSearch && matchesCategory && matchesStock;
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
    editingProductId = null;
    resetProductForm();

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
}

export async function saveProduct() {
    const name = els.productName ? els.productName.value.trim() : "";
    const category = els.productCategory ? els.productCategory.value : "";
    const price = parseFloat(els.productPrice ? els.productPrice.value : 0);
    const purchasePrice = parseFloat(els.productPurchasePrice && els.productPurchasePrice.value ? els.productPurchasePrice.value : 0) || 0;
    const quantity = parseInt(els.productQuantity ? els.productQuantity.value : 0) || 0;
    const barcode = els.productBarcode ? els.productBarcode.value.trim() : "";
    const description = els.productDescription ? els.productDescription.value.trim() : "";

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
                        <div style="font-size: 11px; font-weight: 700; color: #059669; margin-bottom: 2px;">سعر البيع</div>
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
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (els.barcodePrintModal && els.barcodePrintModal.classList.contains("open")) {
                closePrintBarcodeModal();
            } else if (els.modal && els.modal.classList.contains("open")) {
                closeProductModal();
            }
        }
    });

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