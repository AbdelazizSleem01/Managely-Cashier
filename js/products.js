import { paginateArray, renderPagination } from "./pagination.js";

let allProducts = []; // لتخزين جميع المنتجات
let filteredProducts = []; // للمنتجات المفلترة
let selectedProductImageData = ""; // لتخزين بيانات صورة المنتج المحددة
let currentProductsPage = 1;
let productsPageSize = 10;
let lastRenderedProductsList = [];

// ضغط وتحويل ملف الصورة إلى DataURL بحجم مثالي
function processImageFile(file, callback) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        Swal.fire("حجم كبير!", "يرجى اختيار صورة أقل من 5 ميجابايت.", "warning");
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
        const preview = document.getElementById("productImagePreview");
        const fileNameSpan = document.getElementById("productImageFileName");
        const uploadBox = document.getElementById("productImageUploadBox");
        const previewContainer = document.getElementById("productImagePreviewContainer");

        if (preview) {
            preview.src = dataUrl;
        }
        if (fileNameSpan) {
            fileNameSpan.textContent = file.name;
        }
        if (uploadBox) {
            uploadBox.style.display = "none";
            uploadBox.classList.add("hidden");
        }
        if (previewContainer) {
            previewContainer.style.display = "flex";
            previewContainer.classList.remove("hidden");
        }
    });
}

export function removeProductImage() {
    selectedProductImageData = "";
    const input = document.getElementById("productImageInput");
    const preview = document.getElementById("productImagePreview");
    const fileNameSpan = document.getElementById("productImageFileName");
    const uploadBox = document.getElementById("productImageUploadBox");
    const previewContainer = document.getElementById("productImagePreviewContainer");

    if (input) input.value = "";
    if (preview) preview.src = "";
    if (fileNameSpan) fileNameSpan.textContent = "";

    if (uploadBox) {
        uploadBox.style.display = "flex";
        uploadBox.classList.remove("hidden");
    }
    if (previewContainer) {
        previewContainer.style.display = "none";
        previewContainer.classList.add("hidden");
    }
}

export async function renderCategoryOptions() {
    const e = document.getElementById("productCategory");
    const categoryFilter = document.getElementById("categoryFilter");
    if (e) try {
        const t = await window.electronAPI.getCategories();
        const options = `<option value="">اختار الفئة</option>${t.map((e => `<option value="${e.name}">${e.name}</option>`)).join("")}`;
        e.innerHTML = options;
        if (categoryFilter) {
            categoryFilter.innerHTML = `<option value="">جميع الفئات</option>${t.map((e => `<option value="${e.name}">${e.name}</option>`)).join("")}`;
        }
    } catch (e) { }
}

export async function renderProducts(productsToRender = null, resetPage = false) {
    const e = document.getElementById("products");
    if (e) try {
        const products = productsToRender || allProducts;
        lastRenderedProductsList = products;
        if (resetPage) {
            currentProductsPage = 1;
        }

        if (!products.length) {
            e.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div class="w-20 h-20 mb-4 rounded-full bg-gradient-to-tr from-indigo-50 to-purple-100 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100/80">
                        <i class="fas fa-search text-3xl opacity-75"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-700 mb-1.5">لا توجد نتائج مطابقة</h3>
                    <p class="text-sm text-gray-400 max-w-sm">لم يتم العثور على أي منتجات مطابقة لمعايير البحث أو الفلترة المحددة</p>
                </div>
            `;
            const pag = document.getElementById("productsPagination");
            if (pag) pag.innerHTML = "";
            return;
        }

        const { pageItems, totalItems, currentPage } = paginateArray(products, currentProductsPage, productsPageSize);
        currentProductsPage = currentPage;

        const tableHTML = `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-primary to-primary-focus">
                <h2 class="text-xl font-bold text-white">قائمة المنتجات (${totalItems})</h2>
                <div class="flex items-center gap-2 text-white">
                    <i class="fas fa-filter"></i>
                    <span class="text-sm">${totalItems === allProducts.length ? 'عرض جميع المنتجات' : 'تم تطبيق الفلتر'}</span>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="table w-full border-collapse">
                    <thead>
                        <tr class="bg-gray-50 text-gray-700">
                            <th class="p-4 text-center font-semibold text-sm uppercase tracking-wider border-b border-gray-200">الصورة</th>
                            <th class="p-4 text-center font-semibold text-sm uppercase tracking-wider border-b border-gray-200">المنتج</th>
                            <th class="p-4 text-center font-semibold text-sm uppercase tracking-wider border-b border-gray-200">الوصف</th>
                            <th class="p-4 text-center font-semibold text-sm uppercase tracking-wider border-b border-gray-200">الفئة</th>
                            <th class="p-4 text-center font-semibold text-sm uppercase tracking-wider border-b border-gray-200">السعر</th>
                            <th class="p-4 text-center font-semibold text-sm uppercase tracking-wider border-b border-gray-200">المخزون</th>
                            <th class="p-4 text-center font-semibold text-sm uppercase tracking-wider border-b border-gray-200">الباركود</th>
                            <th class="p-4 text-center font-semibold text-sm uppercase tracking-wider border-b border-gray-200">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${pageItems.map((e, index) => `
                            <tr class="hover:bg-blue-50/50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-gray-50/30' : ''}">
                                <td class="p-4 text-center border-b border-gray-100">
                                    ${e.image ? `<div class="w-12 h-12 mx-auto rounded-md overflow-hidden border border-gray-200"><img src="${e.image}" alt="${e.name}" class="w-full h-full object-cover"></div>` : '<div class="w-12 h-12 mx-auto rounded-md bg-gray-100 flex items-center justify-center text-primary p-4"><i class="fas fa-box-open text-xl"></i></div>'}
                                </td>
                                <td class="p-4 text-center font-medium text-gray-900 border-b border-gray-100">${e.name}</td>
                                <td class="p-4 text-center text-gray-600 border-b border-gray-100 max-w-xs truncate" title="${e.description || "لا يوجد"}">${e.description || '<span class="text-gray-400">لا يوجد</span>'}</td>
                                <td class="p-4 text-center border-b border-gray-100"><span class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${e.category}</span></td>
                                <td class="p-4 text-center font-bold border-b border-gray-100"><span class=" text-primary px-3 py-1 rounded-full text-sm">${e.price} ج.م</span></td>
                                <td class="p-4 text-center border-b border-gray-100"><div class="flex items-center justify-center"><span class="font-bold ${e.quantity > 10 ? "text-green-600" : e.quantity > 0 ? "text-yellow-600" : "text-red-600"}">${e.quantity}</span>${e.quantity <= 10 && e.quantity > 0 ? '<span class="ml-1 text-xs text-yellow-600">(منخفض)</span>' : 0 === e.quantity ? '<span class="ml-1 text-xs text-red-600">(نفذ)</span>' : ""}</div></td>
                                <td class="p-4 text-center">${e.barcode ? `<div class="flex flex-col items-center"><svg class="barcode" jsbarcode-format="CODE128" jsbarcode-value="${e.barcode}" jsbarcode-displayvalue="false" jsbarcode-width="2" jsbarcode-height="100" jsbarcode-margin="5"></svg><span class="text-xs text-gray-500 mt-1">${e.barcode}</span></div>` : '<span class="text-gray-400">غير محدد</span>'}</td>
                                <td class="p-4 text-center border-b border-gray-100">
                                    <div class="flex justify-center gap-2">
                                        <button class="btn btn-circle btn-sm btn-error hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200" onclick="deleteProduct('${e._id}')" title="حذف">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                        <button class="btn btn-circle btn-sm btn-warning hover:bg-yellow-600 text-white shadow-md hover:shadow-lg transition-all duration-200" onclick="editProduct('${e._id}')" title="تعديل">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-circle btn-sm btn-info hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200" onclick="viewProduct('${e._id}')" title="عرض">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-circle btn-sm btn-success hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200" onclick="printBarcode('${e._id}')" title="طباعة الباركود">
                                            <i class="fas fa-barcode"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
            <div id="productsPagination" class="p-4 border-t border-gray-100 bg-gray-50/50"></div>
        </div>`;
        e.innerHTML = tableHTML;
        "undefined" != typeof JsBarcode && JsBarcode(".barcode").init();

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
                const pContainer = document.getElementById("products");
                if (pContainer) {
                    pContainer.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        });
    } catch (e) { }
} export async function printBarcode(e) { try { const t = (await window.electronAPI.getProducts()).find((t => t._id === e)); if (!t) return Swal.fire("خطأ!", "المنتج غير موجود!", "error"); if (!t.barcode) return Swal.fire("خطأ!", "لا يوجد باركود لهذا المنتج!", "error"); const r = (await window.electronAPI.getSettings())?.storeName || "اسم المحل", a = await Swal.fire({ title: "طباعة الباركود", html: '\n            <div class="space-y-4 text-right">\n                <div class="form-control">\n                    <label class="label cursor-pointer flex justify-end gap-2">\n                        <span class="label-text text-primary">إضافة اسم المحل</span>\n                        <input type="checkbox" id="includeStoreName" class="checkbox checkbox-primary" checked>\n                    </label>\n                </div>\n                <div class="form-control">\n                    <label class="label cursor-pointer flex justify-end gap-2">\n                        <span class="label-text text-primary">إضافة اسم المنتج</span>\n                        <input type="checkbox" id="includeProductName" class="checkbox checkbox-primary" checked>\n                    </label>\n                </div>\n                <div class="form-control">\n                    <label class="label cursor-pointer flex justify-end gap-2">\n                        <span class="label-text text-primary">إضافة السعر</span>\n                        <input type="checkbox" id="includePrice" class="checkbox checkbox-primary" checked>\n                    </label>\n                </div>\n                <div class="form-control">\n                    <label class="label"><span class="label-text text-primary">عدد النسخ</span></label>\n                    <input type="number" id="copies" class="input input-bordered input-primary bg-transparent w-full" value="1" min="1">\n                </div>\n                <div class="form-control">\n                    <label class="label cursor-pointer flex justify-end gap-2">\n                        <span class="label-text text-primary">طباعة على الطابعة (POS)</span>\n                        <input type="checkbox" id="printToPOS" class="checkbox checkbox-primary">\n                    </label>\n                </div>\n            </div>', showCancelButton: !0, confirmButtonText: "طباعة", cancelButtonText: "إلغاء", preConfirm: () => ({ includeStoreName: Swal.getPopup().querySelector("#includeStoreName").checked, includeProductName: Swal.getPopup().querySelector("#includeProductName").checked, includePrice: Swal.getPopup().querySelector("#includePrice").checked, copies: parseInt(Swal.getPopup().querySelector("#copies").value) || 1, printToPOS: Swal.getPopup().querySelector("#printToPOS").checked }) }); if (a.isConfirmed) { const { includeStoreName: e, includeProductName: n, includePrice: o, copies: c, printToPOS: s } = a.value; let d = `\n            <!DOCTYPE html>\n            <html>\n            <head>\n                <meta charset="UTF-8">\n                <title>طباعة الباركود - ${t.name}</title>\n                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>\n                <style>\n                    @page { margin: 0; size: 38mm 20mm; }\n                    body { margin: 0; font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 0; }\n                    .barcode-container { \n                        width: 33mm; \n                        height: 15mm; \n                        padding: 1mm; \n                        margin: 0; \n                        border: 1px dashed #ddd; \n                        background: white; \n                        box-sizing: border-box; \n                        display: flex; \n                        flex-direction: column; \n                        justify-content: center; \n                        align-items: center; \n                    }\n                    .name-container { \n                        display: flex; \n                        justify-content: space-between;\n                        align-items: center;\n                        margin: 0; \n                        width: 80%; \n                    }\n                    .barcode { \n                        margin: 0 auto; \n                        width: 90%; \n                    }\n                    .store-name { \n                        font-size: 8px; \n                        font-weight: bold; \n                        margin: 0; \n                    }\n                    .product-name { \n                        font-size: 7px; \n                        margin: 0; \n                        line-height: 1; \n                    }\n                    .barcode-text { \n                        font-size: 6px; \n                        margin: 0; \n                    }\n                    .price { \n                        font-size: 7px; \n                        font-weight: bold; \n                        color: #2ecc71; \n                        margin-top: 1px; \n                    }\n                    @media print {\n                        .barcode-container { \n                            break-inside: avoid; \n                        }\n                    }\n                </style>\n            </head>\n            <body>`; for (let a = 0; a < c; a++)d += `\n                <div class="barcode-container">\n                    <div class="name-container">\n                        ${e ? `<div class="store-name">${r}</div>` : ""}\n                        ${n ? `<div class="product-name">${t.name}</div>` : ""}\n                    </div>\n                    <svg class="barcode" jsbarcode-format="CODE128" jsbarcode-value="${t.barcode}" jsbarcode-displayvalue="false" ></svg>\n                    <div class="barcode-text">${t.barcode}</div>\n                    ${o ? `<div class="price">${t.price} ج.م</div>` : ""}\n                </div>`; if (d += '\n                <script>\n                    JsBarcode(".barcode").init();\n                <\/script>\n            </body>\n            </html>', s) { const e = await window.electronAPI.printInvoiceToPOS(d, t.barcode, "mini"); e.skipped ? Swal.fire({ title: "تنبيه!", text: e.message, icon: "warning", confirmButtonColor: "#F59E0B", timer: 3e3, showConfirmButton: !1 }) : Swal.fire({ title: "تم!", text: "تم الطباعة بنجاح على الطابعة.", icon: "success", confirmButtonColor: "#34D399", timer: 2e3, showConfirmButton: !1 }) } else { const e = await window.electronAPI.printBarcode(d, t.barcode, "barcode"); Swal.fire({ title: "تم!", text: `تم حفظ الباركود كملف PDF في: ${e}`, icon: "success", confirmButtonColor: "#34D399", timer: 3e3, showConfirmButton: !1 }) } } } catch (e) { Swal.fire("خطأ!", "حدث خطأ أثناء طباعة الباركود: " + e.message, "error") } } export function generateUniqueBarcode() { return "BC-" + Math.random().toString(36).substr(2, 9).toUpperCase() + "-" + Date.now() } export function renderBarcode(e, t) { const r = document.getElementById(t); e && "" !== e.trim() ? (r.innerHTML = `<svg class="barcode" jsbarcode-format="CODE128" jsbarcode-value="${e}"></svg>`, "undefined" != typeof JsBarcode && JsBarcode(".barcode", { format: "CODE128", displayValue: !1, width: 2, height: 40, margin: 5 }).init()) : r.innerHTML = "" } export function generateAndRenderBarcode() { const e = document.getElementById("productBarcode"), t = generateUniqueBarcode(); e.value = t, renderBarcode(t, "barcodePreview") } export async function startScanning() { const e = document.getElementById("scanMethod").value; "camera" === e ? scanWithCamera() : "scanner" === e && scanWithScanner() } export async function scanWithCamera() { const e = document.getElementById("productBarcode"), t = document.getElementById("reader"); t.style.display = "block", t.innerHTML = '<video id="video" style="width: 100%; border:1px solid #000 ; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);"></video>'; try { const e = await navigator.mediaDevices.enumerateDevices(); if (0 === e.filter((e => "videoinput" === e.kind)).length) throw new Error("لا يوجد كاميرا متاحة في الجهاز.") } catch (e) { return t.style.display = "none", void Swal.fire("خطأ!", `فشل في الوصول للكاميرا: ${e.message}. تأكدي من إذن الكاميرا أو اتصالها.`, "error") } let r; try { r = await navigator.mediaDevices.getUserMedia({ video: !0 }); const e = document.querySelector("#reader video"); e.srcObject = r, await e.play() } catch (e) { return t.style.display = "none", void Swal.fire("خطأ!", `فشل في تشغيل الكاميرا: ${e.message}. تأكدي من الإذن أو إعدادات الجهاز.`, "error") } Quagga.init({ inputStream: { name: "Live", type: "LiveStream", target: document.querySelector("#reader video"), constraints: { video: { facingMode: "environment" } } }, decoder: { readers: ["code_128_reader", "ean_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader"] } }, (function (e) { if (e) return r && r.getTracks().forEach((e => e.stop())), t.style.display = "none", void Swal.fire("خطأ!", `فشل في تهيئة مسح الباركود: ${e.message}`, "error"); const a = document.getElementsByTagName("canvas"); for (let e of a) { e.getContext("2d", { willReadFrequently: !0 }) } Quagga.start() })), Quagga.onDetected((function (a) { a && a.codeResult && a.codeResult.code && (e.value = a.codeResult.code, renderBarcode(a.codeResult.code, "barcodePreview"), Quagga.stop(), r && r.getTracks().forEach((e => e.stop())), t.style.display = "none") })), Quagga.onProcessed((function (e) { e && e.codeResult })) } export function scanWithScanner() { const e = document.getElementById("productBarcode"); document.getElementById("reader").style.display = "none", Swal.fire({ title: "مسح الباركود", text: "من فضلك، استخدم جهاز السكانر لمسح الباركود. سيتم إدخال الباركود تلقائيًا في الحقل.", icon: "info", showCancelButton: !0, confirmButtonText: "تم", cancelButtonText: "إلغاء" }), e.focus(); const t = r => { const a = r.target.value.trim(); a && (renderBarcode(a, "barcodePreview"), e.removeEventListener("input", t)) }; e.addEventListener("input", t) } export async function addProduct() {
    const nameEl = document.getElementById("productName"),
        priceEl = document.getElementById("productPrice"),
        catEl = document.getElementById("productCategory"),
        descEl = document.getElementById("productDescription"),
        qtyEl = document.getElementById("productQuantity"),
        barcodeEl = document.getElementById("productBarcode"),
        purchaseEl = document.getElementById("productPurchasePrice");

    const e = nameEl?.value.trim() || "",
        t = parseFloat(priceEl?.value),
        r = catEl?.value || "",
        a = descEl?.value.trim() || "",
        n = parseInt(qtyEl?.value) || 0,
        o = barcodeEl?.value.trim() || "",
        purchasePrice = parseFloat(purchaseEl?.value) || 0;

    let hasError = false;
    let firstInvalid = null;

    if (!e) {
        window.markFieldInvalid(nameEl, "يرجى إدخال اسم المنتج");
        hasError = true;
        if (!firstInvalid) firstInvalid = nameEl;
    }
    if (isNaN(t) || t <= 0) {
        window.markFieldInvalid(priceEl, "يرجى إدخال سعر بيع صحيح");
        hasError = true;
        if (!firstInvalid) firstInvalid = priceEl;
    }
    if (!r) {
        window.markFieldInvalid(catEl, "يرجى اختيار فئة المنتج");
        hasError = true;
        if (!firstInvalid) firstInvalid = catEl;
    }

    if (hasError) {
        if (firstInvalid) firstInvalid.focus();
        return Swal.fire({
            title: "بيانات غير مكتملة",
            text: "يرجى ملء جميع الحقول المطلوبة (المحددة باللون الأحمر).",
            icon: "warning",
            confirmButtonColor: "#3085d6"
        });
    }

    try {
        const newProduct = await window.electronAPI.addProduct({
            name: e,
            price: t,
            category: r,
            description: a,
            quantity: n,
            barcode: o,
            purchasePrice: purchasePrice,
            image: selectedProductImageData || ""
        });
        if (nameEl) nameEl.value = "";
        if (priceEl) priceEl.value = "";
        if (purchaseEl) purchaseEl.value = "";
        if (catEl) catEl.value = "";
        if (descEl) descEl.value = "";
        if (qtyEl) qtyEl.value = "";
        if (barcodeEl) barcodeEl.value = "";
        removeProductImage();
        const bp = document.getElementById("barcodePreview");
        if (bp) bp.innerHTML = "";

        // تحديث القائمة
        allProducts.push(newProduct);
        filterProducts(); // إعادة تطبيق الفلاتر

        Swal.fire({
            title: "تمت الإضافة",
            text: "تمت إضافة المنتج بنجاح.",
            icon: "success",
            confirmButtonColor: "#34D399"
        });
    } catch (e) {
        Swal.fire({
            title: "تنبيه",
            text: "تعذر إضافة المنتج، يرجى التحقق من البيانات والمحاولة مجدداً.",
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
} export async function deleteProduct(e) {
    Swal.fire({ title: "هل أنت متأكد؟", text: "لا يمكن التراجع عن هذا الإجراء!", icon: "warning", showCancelButton: !0 }).then((async t => {
        if (t.isConfirmed) try {
            await window.electronAPI.deleteProduct(e),
                // تحديث القائمة
                allProducts = allProducts.filter(product => product._id !== e);
            filterProducts();
            Swal.fire("تم الحذف!", "تم حذف المنتج بنجاح.", "success")
        } catch (e) { Swal.fire("خطأ!", "حدث خطأ أثناء حذف المنتج", "error") }
    }))
} export async function editProduct(e) {
    try {
        const t = (await window.electronAPI.getProducts()).find((t => t._id === e));
        if (!t) return Swal.fire("خطأ!", "المنتج غير موجود!", "error");
        const r = await window.electronAPI.getCategories();
        Swal.fire({
            width: "780px",
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: "حفظ التعديلات",
            cancelButtonText: "إلغاء",
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#f1f5f9",
            backdrop: "rgba(15, 23, 42, 0.45)",
            customClass: {
                popup: "product-details-swal shadow-2xl border border-gray-200 text-right",
                confirmButton: "swal-btn-save",
                cancelButton: "swal-btn-cancel"
            },
            html: `
            <div class="w-full text-right" dir="rtl" style="font-family: 'Tajawal', sans-serif;">
                <!-- رأس المودال بتدرج لوني فخم مطابق لمودال التفاصيل -->
                <div style="background: linear-gradient(135deg, #4d00c9 0%, #6001e3 100%); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; text-align: right;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 18px; border: 1px solid rgba(255,255,255,0.3); flex-shrink: 0;">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div>
                            <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0; line-height: 1.2;">تعديل بيانات المنتج</h2>
                            <p style="font-size: 12px; color: rgba(255,255,255,0.85); margin: 2px 0 0 0;">تحديث الأسعار والمخزون والتفاصيل المسجلة</p>
                        </div>
                    </div>
                </div>

                <!-- جسم المودال المنظم بدقة وراحة للعين -->
                <div style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
                    <!-- البطاقة الرئيسية: صورة المنتج + الاسم + التصنيف -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; display: flex; align-items: stretch; gap: 16px; text-align: right;">
                        <!-- صندوق صورة المنتج مع زر الرفع والحذف المدمج -->
                        <div style="width: 105px; height: 105px; min-width: 105px; max-width: 105px; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.06); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; flex-shrink: 0;">
                            <img id="swalProductImagePreview" src="${t.image || ''}" class="${t.image ? '' : 'hidden'}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0;" alt="معاينة" />
                            <div id="swalProductImagePlaceholder" class="${t.image ? 'hidden' : ''}" style="text-align: center; color: #94a3b8; pointer-events: none;">
                                <i class="fas fa-image" style="font-size: 28px;"></i>
                                <p style="font-size: 10px; margin: 4px 0 0; font-weight: 700;">صورة المنتج</p>
                            </div>
                            <button type="button" id="swalRemoveImageBtn" class="${t.image ? '' : 'hidden'}" style="position: absolute; top: 4px; left: 4px; width: 22px; height: 22px; border-radius: 50%; background: #ef4444; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); z-index: 10;" title="حذف الصورة">
                                <i class="fas fa-times"></i>
                            </button>
                            <label for="swalProductImageInput" style="position: absolute; bottom: 0; inset-inline: 0; background: rgba(15,23,42,0.7); color: #ffffff; font-size: 10px; font-weight: 700; text-align: center; padding: 4px 0; cursor: pointer; backdrop-filter: blur(2px); z-index: 5; margin: 0; transition: background 0.2s;" title="انقر لتغيير الصورة">
                                <i class="fas fa-camera" style="margin-left: 3px;"></i>تغيير
                            </label>
                            <input type="file" id="swalProductImageInput" accept="image/*" style="display: none;" />
                        </div>

                        <!-- حقول الاسم والفئة بمساحة رحبة وبوردرات متناسقة مع البوكس -->
                        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
                            <div>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;">
                                    <i class="fas fa-tag text-primary" style="font-size: 12px;"></i>
                                    <span>اسم المنتج <span style="color: #ef4444;">*</span></span>
                                </label>
                                <input id="swalProductName" class="w-full bg-white text-sm font-semibold text-gray-800" value="${t.name}" placeholder="أدخل اسم المنتج" style="height: 38px; border-radius: 8px; border: 1.5px solid #cbd5e1; padding: 0 12px; box-sizing: border-box; outline: none !important; transition: all 0.2s;">
                            </div>

                            <div>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;">
                                    <i class="fas fa-layer-group text-primary" style="font-size: 12px;"></i>
                                    <span>الفئة <span style="color: #ef4444;">*</span></span>
                                </label>
                                <!-- دروب داون فئات مخصص مع بحث بستايل الموقع -->
                                <div id="swalCategoryWrapper" style="position: relative; width: 100%;">
                                    <div id="swalCategoryTrigger" style="display: flex; align-items: center; justify-content: space-between; width: 100%; height: 38px; min-height: 38px; padding: 0 12px; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; color: #1e293b; box-sizing: border-box; outline: none !important; transition: all 0.2s;">
                                        <span id="swalCategoryTriggerText" style="flex: 1; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            ${t.category || "اختر الفئة"}
                                        </span>
                                        <span id="swalCategoryTriggerArrow" style="color: #6001e3; display: flex; align-items: center; justify-content: center; margin-right: 6px; transition: transform 0.2s;">
                                            <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </span>
                                    </div>

                                    <!-- القائمة المنسدلة للبحث والاختيار مع ستايل الموقع -->
                                    <div id="swalCategoryDropdown" style="position: absolute; top: calc(100% + 4px); right: 0; left: 0; background: #ffffff; border: 1.5px solid #e0e7ff; border-radius: 10px; box-shadow: 0 12px 28px rgba(96, 1, 227, 0.16), 0 4px 10px rgba(0, 0, 0, 0.08); z-index: 999999; display: none; padding: 6px; box-sizing: border-box;">
                                        <!-- حقل البحث في الفئات -->
                                        <div style="padding: 4px 4px 6px 4px; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px;">
                                            <div style="position: relative; display: flex; align-items: center;">
                                                <i class="fas fa-search" style="position: absolute; right: 10px; color: #94a3b8; font-size: 11px; pointer-events: none;"></i>
                                                <input type="text" id="swalCategorySearch" placeholder="ابحث في الفئات..." style="width: 100%; padding: 6px 30px 6px 8px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 6px; outline: none !important; background: #f8fafc; font-family: 'Tajawal', sans-serif; font-weight: 600; transition: all 0.2s;" />
                                            </div>
                                        </div>
                                        <!-- قائمة الفئات -->
                                        <div id="swalCategoryOptionsList" style="max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px;">
                                        </div>
                                    </div>

                                    <select id="swalProductCategory" style="display: none;">
                                        <option disabled value="">اختر الفئة</option>
                                        ${r.map((e => `<option value="${e.name}" ${t.category === e.name ? "selected" : ""}>${e.name}</option>`)).join("")}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- وصف المنتج ببوردر متناسق -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; text-align: right;">
                        <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;">
                            <i class="fas fa-align-right text-primary" style="font-size: 12px;"></i>
                            <span>وصف المنتج (اختياري)</span>
                        </label>
                        <textarea id="swalProductDescription" class="w-full bg-white text-xs text-gray-700 resize-none" rows="2" placeholder="أدخل وصفاً توضيحياً للمنتج..." style="min-height: 50px; border-radius: 8px; border: 1.5px solid #cbd5e1; padding: 8px 12px; box-sizing: border-box; outline: none !important; transition: all 0.2s;">${t.description || ""}</textarea>
                    </div>

                    <!-- شبكة الأسعار والكمية ببوردرات متناغمة مع ألوان الصناديق -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                        <!-- سعر البيع (أخضر متناسق) -->
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 10px 12px; text-align: right;">
                            <label style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 11px; font-weight: 700; color: #15803d; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-money-bill-wave" style="font-size: 12px;"></i>
                                    سعر البيع <span style="color: #ef4444;">*</span>
                                </span>
                                <span style="font-size: 10px; background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 4px; font-weight: 700;">ج.م</span>
                            </label>
                            <input id="swalProductPrice" type="number" step="any" class="w-full bg-white text-base font-extrabold text-green-700" value="${t.price}" placeholder="0.00" style="height: 38px; border-radius: 8px; border: 1.5px solid #86efac; padding: 0 12px; box-sizing: border-box; outline: none !important; transition: all 0.2s;">
                        </div>

                        <!-- سعر الشراء (أزرق متناسق) -->
                        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 10px 12px; text-align: right;">
                            <label style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 11px; font-weight: 700; color: #1d4ed8; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-shopping-cart" style="font-size: 12px;"></i>
                                    سعر الشراء
                                </span>
                                <span style="font-size: 10px; background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 4px; font-weight: 700;">ج.م</span>
                            </label>
                            <input id="swalProductPurchasePrice" type="number" step="any" class="w-full bg-white text-base font-extrabold text-blue-700" value="${t.purchasePrice || 0}" placeholder="0.00" style="height: 38px; border-radius: 8px; border: 1.5px solid #93c5fd; padding: 0 12px; box-sizing: border-box; outline: none !important; transition: all 0.2s;">
                        </div>

                        <!-- الكمية بالمخزون (بنفسجي متناسق) -->
                        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 10px 12px; text-align: right;">
                            <label style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 11px; font-weight: 700; color: #7e22ce; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-boxes" style="font-size: 12px;"></i>
                                    الكمية بالمخزون
                                </span>
                                <span style="font-size: 10px; background: #f3e8ff; color: #6b21a8; padding: 1px 6px; border-radius: 4px; font-weight: 700;">قطعة</span>
                            </label>
                            <input id="swalProductQuantity" type="number" class="w-full bg-white text-base font-extrabold text-purple-700" value="${t.quantity}" placeholder="0" style="height: 38px; border-radius: 8px; border: 1.5px solid #d8b4fe; padding: 0 12px; box-sizing: border-box; outline: none !important; transition: all 0.2s;">
                        </div>
                    </div>

                    <!-- شريط الباركود المتكامل (بدون بوردر مكرر، وعرض متناسق للمسح) -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; text-align: right;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #475569; margin: 0;">
                                <div style="width: 28px; height: 28px; border-radius: 6px; background: #ede9fe; color: #4d00c9; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                                    <i class="fas fa-barcode"></i>
                                </div>
                                <span>كود الباركود</span>
                            </label>
                            <!-- عرض الباركود مباشرة بدون بوردر مزدوج -->
                            <div id="swalBarcodePreview" style="display: flex; align-items: center; justify-content: center; min-height: 32px;"></div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                            <input id="swalProductBarcode" type="text" class="bg-white text-xs font-mono font-bold text-gray-800" value="${t.barcode || ""}" placeholder="أدخل الباركود يدوياً أو قم بالتوليد" style="height: 38px; border-radius: 8px; border: 1.5px solid #cbd5e1; padding: 0 12px; flex: 1; min-width: 180px; box-sizing: border-box; outline: none !important; transition: all 0.2s;">
                            <button type="button" id="generateBarcodeBtn" class="btn btn-primary text-xs font-bold gap-1.5 shrink-0" style="height: 38px; min-height: 38px; border-radius: 8px; padding: 0 14px;">
                                <i class="fas fa-wand-magic-sparkles"></i> توليد
                            </button>
                            <!-- حقل طريقة المسح بعرض رحب 165px يمنع انقطاع النص -->
                            <select id="swalScanMethod" class="text-xs font-bold shrink-0" style="height: 38px; min-height: 38px; border-radius: 8px; width: 165px; min-width: 165px; border: 1.5px solid #cbd5e1; background: #ffffff; color: #1e293b; padding: 0 10px; cursor: pointer; outline: none !important; transition: all 0.2s;">
                                <option value="camera">مسح بالكاميرا</option>
                                <option value="scanner">جهاز السكانر</option>
                            </select>
                            <button type="button" id="scanBarcodeBtn" class="btn btn-info text-xs font-bold gap-1.5 text-white shrink-0" style="height: 38px; min-height: 38px; border-radius: 8px; padding: 0 14px;">
                                <i class="fas fa-camera"></i> مسح
                            </button>
                        </div>
                        <div id="swalReader" style="width: 100%; max-width: 320px; margin: 10px auto 0; display: none;"></div>
                    </div>
                </div>
            </div>`,
            showCancelButton: !0,
            didOpen: () => {
                renderBarcode(t.barcode, "swalBarcodePreview");
                let swalEditedImage = t.image || "";
                const swalImgInput = document.getElementById("swalProductImageInput");
                const swalImgPreview = document.getElementById("swalProductImagePreview");
                const swalImgPlaceholder = document.getElementById("swalProductImagePlaceholder");
                const swalRemoveBtn = document.getElementById("swalRemoveImageBtn");

                // تهيئة دروب داون الفئات المخصص مع البحث بستايل الموقع
                const categoryTrigger = document.getElementById("swalCategoryTrigger");
                const categoryDropdown = document.getElementById("swalCategoryDropdown");
                const categoryTriggerText = document.getElementById("swalCategoryTriggerText");
                const categoryTriggerArrow = document.getElementById("swalCategoryTriggerArrow");
                const categorySearch = document.getElementById("swalCategorySearch");
                const categoryOptionsList = document.getElementById("swalCategoryOptionsList");
                const hiddenCategorySelect = document.getElementById("swalProductCategory");
                const categoriesList = r || [];

                function renderCategoryItems(filterText = "") {
                    if (!categoryOptionsList) return;
                    categoryOptionsList.innerHTML = "";
                    const filtered = categoriesList.filter(c => c.name.toLowerCase().includes(filterText.toLowerCase()));

                    if (filtered.length === 0) {
                        categoryOptionsList.innerHTML = '<div style="padding: 8px; font-size: 12px; color: #94a3b8; text-align: center;">لا توجد فئات مطابقة</div>';
                        return;
                    }

                    filtered.forEach(cat => {
                        const isSelected = hiddenCategorySelect.value === cat.name;
                        const optEl = document.createElement("div");
                        optEl.style.cssText = `display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; transition: all 0.15s; color: ${isSelected ? '#4d00c9' : '#1e293b'}; background: ${isSelected ? '#ede9fe' : 'transparent'};`;

                        optEl.innerHTML = `<span>${cat.name}</span>${isSelected ? '<i class="fas fa-check" style="color: #4d00c9; font-size: 11px;"></i>' : ''}`;

                        optEl.onmouseenter = () => {
                            if (!isSelected) optEl.style.background = "#f5f3ff";
                        };
                        optEl.onmouseleave = () => {
                            if (!isSelected) optEl.style.background = "transparent";
                        };

                        optEl.onclick = (ev) => {
                            ev.stopPropagation();
                            hiddenCategorySelect.value = cat.name;
                            categoryTriggerText.textContent = cat.name;
                            closeCategoryDropdown();
                        };

                        categoryOptionsList.appendChild(optEl);
                    });
                }

                function openCategoryDropdown() {
                    if (!categoryDropdown) return;
                    categoryDropdown.style.display = "block";
                    categoryTrigger.style.borderColor = "#4d00c9";
                    categoryTrigger.style.boxShadow = "0 0 0 2px rgba(77, 0, 201, 0.15)";
                    if (categoryTriggerArrow) categoryTriggerArrow.style.transform = "rotate(180deg)";
                    if (categorySearch) {
                        categorySearch.value = "";
                        renderCategoryItems("");
                        setTimeout(() => categorySearch.focus(), 50);
                    }
                }

                function closeCategoryDropdown() {
                    if (!categoryDropdown) return;
                    categoryDropdown.style.display = "none";
                    categoryTrigger.style.borderColor = "#cbd5e1";
                    categoryTrigger.style.boxShadow = "none";
                    if (categoryTriggerArrow) categoryTriggerArrow.style.transform = "rotate(0deg)";
                }

                if (categoryTrigger) {
                    categoryTrigger.onclick = (ev) => {
                        ev.stopPropagation();
                        if (categoryDropdown.style.display === "block") {
                            closeCategoryDropdown();
                        } else {
                            openCategoryDropdown();
                        }
                    };
                }

                if (categorySearch) {
                    categorySearch.oninput = (ev) => {
                        renderCategoryItems(ev.target.value.trim());
                    };
                    categorySearch.onclick = (ev) => ev.stopPropagation();
                }

                const currentPopup = Swal.getPopup();
                if (currentPopup) {
                    currentPopup.addEventListener("click", (ev) => {
                        if (!ev.target.closest("#swalCategoryWrapper")) {
                            closeCategoryDropdown();
                        }
                    });
                }

                renderCategoryItems("");

                if (swalImgInput) {
                    swalImgInput.addEventListener("change", (ev) => {
                        const file = ev.target.files && ev.target.files[0];
                        if (file) {
                            processImageFile(file, (dataUrl) => {
                                swalEditedImage = dataUrl;
                                if (swalImgPreview) {
                                    swalImgPreview.src = dataUrl;
                                    swalImgPreview.classList.remove("hidden");
                                }
                                if (swalImgPlaceholder) swalImgPlaceholder.classList.add("hidden");
                                if (swalRemoveBtn) swalRemoveBtn.classList.remove("hidden");
                            });
                        }
                    });
                }
                if (swalRemoveBtn) {
                    swalRemoveBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        swalEditedImage = "";
                        if (swalImgInput) swalImgInput.value = "";
                        if (swalImgPreview) {
                            swalImgPreview.src = "";
                            swalImgPreview.classList.add("hidden");
                        }
                        if (swalImgPlaceholder) swalImgPlaceholder.classList.remove("hidden");
                        swalRemoveBtn.classList.add("hidden");
                    });
                }

                // حفظ المتغير في عنصر الـ popup
                Swal.getPopup()._getEditedImage = () => swalEditedImage;

                const barcodeInput = document.getElementById("swalProductBarcode");
                if (barcodeInput) {
                    barcodeInput.addEventListener("input", (e) => {
                        renderBarcode(e.target.value.trim(), "swalBarcodePreview");
                    });
                }

                document.getElementById("generateBarcodeBtn").addEventListener("click", (() => {
                    const e = generateUniqueBarcode();
                    document.getElementById("swalProductBarcode").value = e,
                        renderBarcode(e, "swalBarcodePreview")
                })),
                    document.getElementById("scanBarcodeBtn").addEventListener("click", (async () => {
                        const e = document.getElementById("swalScanMethod").value,
                            t = document.getElementById("swalProductBarcode"),
                            r = document.getElementById("swalReader");
                        if ("camera" === e) {
                            let e;
                            r.style.display = "block";
                            try {
                                e = await navigator.mediaDevices.getUserMedia({ video: !0 });
                                const t = document.createElement("video");
                                r.appendChild(t),
                                    t.srcObject = e,
                                    await t.play()
                            } catch (e) {
                                return r.style.display = "none",
                                    void Swal.fire("خطأ!", `فشل في تشغيل الكاميرا: ${e.message}. تأكدي من الإذن أو إعدادات الجهاز.`, "error")
                            }
                            Quagga.init({
                                inputStream: {
                                    name: "Live",
                                    type: "LiveStream",
                                    target: video,
                                    constraints: {
                                        video: {
                                            facingMode: "environment"
                                        }
                                    }
                                },
                                decoder: {
                                    readers: ["code_128_reader", "ean_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader"]
                                }
                            }, (function (t) {
                                if (t) return e && e.getTracks().forEach((e => e.stop())),
                                    r.style.display = "none",
                                    void Swal.fire("خطأ!", `فشل في تهيئة مسح الباركود: ${t.message}`, "error");
                                const a = document.getElementsByTagName("canvas");
                                for (let e of a) {
                                    e.getContext("2d", { willReadFrequently: !0 })
                                }
                                Quagga.start()
                            })),
                                Quagga.onDetected((function (a) {
                                    a && a.codeResult && a.codeResult.code && (
                                        t.value = a.codeResult.code,
                                        renderBarcode(a.codeResult.code, "swalBarcodePreview"),
                                        Quagga.stop(),
                                        e && e.getTracks().forEach((e => e.stop())),
                                        r.style.display = "none"
                                    )
                                })),
                                Quagga.onProcessed((function (e) {
                                    e && e.codeResult
                                }))
                        } else {
                            r.style.display = "none",
                                Swal.fire({
                                    title: "مسح الباركود",
                                    text: "من فضلك، استخدم جهاز السكانر لمسح الباركود. سيتم إدخال الباركود تلقائيًا في الحقل.",
                                    icon: "info",
                                    showCancelButton: !0,
                                    confirmButtonText: "تم",
                                    cancelButtonText: "إلغاء"
                                }),
                                t.focus();
                            const e = r => {
                                const a = r.target.value.trim();
                                a && (
                                    renderBarcode(a, "swalBarcodePreview"),
                                    t.removeEventListener("input", e)
                                )
                            };
                            t.addEventListener("input", e)
                        }
                    }))
            },
            preConfirm: () => {
                const popup = Swal.getPopup();
                return {
                    name: popup.querySelector("#swalProductName").value.trim(),
                    description: popup.querySelector("#swalProductDescription").value.trim(),
                    price: parseFloat(popup.querySelector("#swalProductPrice").value),
                    purchasePrice: parseFloat(popup.querySelector("#swalProductPurchasePrice").value) || 0,
                    quantity: parseInt(popup.querySelector("#swalProductQuantity").value) || 0,
                    barcode: popup.querySelector("#swalProductBarcode").value.trim(),
                    category: popup.querySelector("#swalProductCategory").value,
                    image: popup._getEditedImage ? popup._getEditedImage() : (t.image || "")
                };
            }
        }).then((async t => {
            if (t.isConfirmed && t.value) {
                if (!t.value.name || isNaN(t.value.price) || !t.value.category) return Swal.fire("خطأ!", "من فضلك املأ الحقول الأساسية (الاسم، السعر، الفئة) بشكل صحيح!", "error");
                try {
                    await window.electronAPI.updateProduct(e, t.value);
                    const productIndex = allProducts.findIndex(product => product._id === e);
                    if (productIndex !== -1) {
                        allProducts[productIndex] = { ...allProducts[productIndex], ...t.value };
                        filterProducts();
                    }
                    renderProducts();
                    Swal.fire("تم التعديل!", "تم تعديل المنتج بنجاح.", "success");
                } catch (e) {
                    Swal.fire("خطأ!", e.message || "حدث خطأ أثناء تعديل المنتج", "error");
                }
            }
        }));
    } catch (e) {
        Swal.fire("خطأ!", "حدث خطأ أثناء استرجاع المنتج", "error");
    }
}

export async function viewProduct(e) {
    try {
        const t = (await window.electronAPI.getProducts()).find((p => p._id === e));
        if (!t) return Swal.fire("خطأ!", "المنتج غير موجود!", "error");

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
            width: "780px",
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: "إغلاق",
            confirmButtonColor: "#4d00c9",
            backdrop: "rgba(15, 23, 42, 0.45)",
            customClass: {
                popup: "product-details-swal shadow-2xl border border-gray-200 text-right",
                confirmButton: "btn btn-primary px-8 h-[38px] min-h-[38px] text-sm font-bold"
            },
            html: `
            <div class="w-full text-right" dir="rtl" style="font-family: 'Tajawal', sans-serif;">
                <!-- رأس المودال بتدرج لوني فخم -->
                <div style="background: linear-gradient(135deg, #4d00c9 0%, #6001e3 100%); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; text-align: right;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 18px; border: 1px solid rgba(255,255,255,0.3); flex-shrink: 0;">
                            <i class="fas fa-boxes-stacked"></i>
                        </div>
                        <div>
                            <h2 style="font-size: 18px; font-weight: 800; color: #ffffff; margin: 0; line-height: 1.2;">تفاصيل المنتج</h2>
                            <p style="font-size: 12px; color: rgba(255,255,255,0.85); margin: 2px 0 0 0;">كافة البيانات والمواصفات المسجلة</p>
                        </div>
                    </div>
                </div>

                <!-- جسم المودال المنظم بدقة وراحة للعين -->
                <div style="padding: 20px; display: flex; flex-direction: column; gap: 14px;">
                    <!-- البطاقة الرئيسية: صورة المنتج + الاسم + التصنيف + الوصف -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; display: flex; align-items: stretch; gap: 16px; text-align: right;">
                        <!-- صورة المنتج بحجم ثابت وأنيق وواضح تماماً -->
                        <div style="width: 105px; height: 105px; min-width: 105px; max-width: 105px; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            ${t.image
                    ? `<img src="${t.image}" alt="${t.name}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`
                    : `<div style="text-align: center; color: #94a3b8;"><i class="fas fa-image" style="font-size: 30px;"></i><p style="font-size: 10px; margin: 4px 0 0; font-weight: 700;">بدون صورة</p></div>`
                }
                        </div>

                        <!-- بيانات الاسم والتصنيف والوصف بمساحة رحبة تمنع التداخل نهائياً -->
                        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 6px;">
                                    <h3 style="font-size: 17px; font-weight: 800; color: #1e293b; margin: 0; line-height: 1.4; word-break: break-word;">${t.name}</h3>
                                    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                                        ${qtyBadge}
                                        <span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe;">
                                            <i class="fas fa-layer-group" style="font-size: 10px;"></i>
                                            ${t.category || "عام"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style="background: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; line-height: 1.5; color: #475569;">
                                <span style="font-weight: 700; color: #334155; margin-left: 6px;">
                                    <i class="fas fa-align-right" style="color: #4d00c9; margin-left: 4px;"></i>الوصف:
                                </span>
                                <span>${t.description ? t.description : '<span style="color: #94a3b8; font-style: italic;">لا يوجد وصف متوفر لهذا المنتج</span>'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- شبكة الأسعار والربح (3 بطاقات واضحة) -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                        <!-- سعر البيع -->
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 14px; text-align: right;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 11px; font-weight: 700; color: #15803d; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-money-bill-wave" style="font-size: 12px;"></i>
                                    سعر البيع
                                </span>
                                <span style="font-size: 10px; background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 4px; font-weight: 700;">الأساسي</span>
                            </div>
                            <div style="font-size: 20px; font-weight: 900; color: #16a34a; line-height: 1.2;">
                                ${price} <span style="font-size: 12px; font-weight: 700;">ج.م</span>
                            </div>
                        </div>

                        <!-- سعر الشراء -->
                        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px 14px; text-align: right;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 11px; font-weight: 700; color: #1d4ed8; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-shopping-cart" style="font-size: 12px;"></i>
                                    سعر الشراء
                                </span>
                                <span style="font-size: 10px; background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 4px; font-weight: 700;">التكلفة</span>
                            </div>
                            <div style="font-size: 20px; font-weight: 900; color: #2563eb; line-height: 1.2;">
                                ${purchasePrice} <span style="font-size: 12px; font-weight: 700;">ج.م</span>
                            </div>
                        </div>

                        <!-- هامش الربح -->
                        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 12px 14px; text-align: right;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                                <span style="font-size: 11px; font-weight: 700; color: #7e22ce; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-chart-line" style="font-size: 12px;"></i>
                                    هامش الربح
                                </span>
                                <span style="font-size: 10px; background: #f3e8ff; color: #6b21a8; padding: 1px 6px; border-radius: 4px; font-weight: 700;">
                                    ${profit >= 0 ? '+' : ''}${profitMargin}%
                                </span>
                            </div>
                            <div style="font-size: 20px; font-weight: 900; color: ${profit >= 0 ? '#9333ea' : '#dc2626'}; line-height: 1.2;">
                                ${profit} <span style="font-size: 12px; font-weight: 700;">ج.م</span>
                            </div>
                        </div>
                    </div>

                    <!-- شريط الباركود -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px; text-align: right;">
                            <div style="width: 38px; height: 38px; border-radius: 10px; background: #ede9fe; color: #4d00c9; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                                <i class="fas fa-barcode"></i>
                            </div>
                            <div>
                                <p style="font-size: 11px; font-weight: 700; color: #64748b; margin: 0 0 2px 0;">كود الباركود</p>
                                <p style="font-size: 13px; font-family: monospace; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: 0.5px;">
                                    ${t.barcode || "لا يوجد باركود مسجل"}
                                </p>
                            </div>
                        </div>
                        <div style="flex-shrink: 0;">
                            ${t.barcode ? `
                                <div style="display: flex; align-items: center; justify-content: center;">
                                    <svg class="barcode-modal" jsbarcode-format="CODE128" jsbarcode-value="${t.barcode}" jsbarcode-displayvalue="false" jsbarcode-width="1.8" jsbarcode-height="35" jsbarcode-margin="2"></svg>
                                </div>
                            ` : '<span style="font-size: 12px; color: #94a3b8; font-weight: 600;">غير متوفر</span>'}
                        </div>
                    </div>
                </div>
            </div>
            `,
            didOpen: () => {
                if (t.barcode && typeof JsBarcode !== "undefined") {
                    JsBarcode(".barcode-modal", {
                        format: "CODE128",
                        displayValue: false,
                        width: 1.8,
                        height: 35,
                        margin: 2
                    }).init();
                }
            }
        });
    } catch (e) {
        Swal.fire("خطأ!", "حدث خطأ أثناء عرض المنتج", "error");
    }
}

"products" === document.body.getAttribute("data-page") && (renderCategoryOptions(), loadProducts()), window.startScanning = startScanning, window.deleteProduct = deleteProduct, window.renderCategoryOptions = renderCategoryOptions, window.renderProducts = renderProducts, window.generateUniqueBarcode = generateUniqueBarcode, window.renderBarcode = renderBarcode, window.generateAndRenderBarcode = generateAndRenderBarcode, window.scanWithCamera = scanWithCamera, window.scanWithScanner = scanWithScanner, window.addProduct = addProduct, window.deleteProduct = deleteProduct, window.editProduct = editProduct, window.viewProduct = viewProduct, window.printBarcode = printBarcode, window.filterProducts = filterProducts, window.resetFilters = resetFilters, window.clearSearch = clearSearch, window.previewProductImage = previewProductImage, window.removeProductImage = removeProductImage;

// إضافة الأحداث للبحث والتصفية
if (document.body.getAttribute("data-page") === "products") {
    // حدث البحث
    const searchInput = document.getElementById('productsSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    // حدث تصفية الفئة
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    // حدث تصفية المخزون
    const stockFilter = document.getElementById('stockFilter');
    if (stockFilter) {
        stockFilter.addEventListener('change', filterProducts);
    }


}

// دالة تحميل المنتجات
export async function loadProducts() {
    try {
        allProducts = await window.electronAPI.getProducts();
        filteredProducts = [...allProducts];
        renderProducts();
        updateStatistics();
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
    }
}

// دالة تحديث الإحصائيات
export function updateStatistics(products = allProducts) {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.quantity > 10).length;
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;

    const totalElement = document.getElementById('totalProductsCount');
    const inStockElement = document.getElementById('inStockCount');
    const lowStockElement = document.getElementById('lowStockCount');
    const outOfStockElement = document.getElementById('outOfStockCount');

    if (totalElement) totalElement.textContent = totalProducts;
    if (inStockElement) inStockElement.textContent = inStock;
    if (lowStockElement) lowStockElement.textContent = lowStock;
    if (outOfStockElement) outOfStockElement.textContent = outOfStock;
}

// دالة مسح البحث
export function clearSearch() {
    const searchInput = document.getElementById('productsSearch');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }

    if (clearBtn) {
        clearBtn.classList.add('hidden');
    }

    filterProducts();
}

// دالة البحث والتصفية
export function filterProducts() {
    const searchTerm = document.getElementById('productsSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const stockFilter = document.getElementById('stockFilter')?.value || '';
    const clearBtn = document.getElementById('clearSearchBtn');

    // إظهار/إخفاء زر مسح البحث
    if (clearBtn) {
        if (searchTerm) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }

    filteredProducts = allProducts.filter(product => {
        // البحث في النص
        const matchesSearch = !searchTerm ||
            product.name.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm) ||
            product.barcode?.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm);

        // تصفية الفئة
        const matchesCategory = !categoryFilter || product.category === categoryFilter;

        // تصفية المخزون
        let matchesStock = true;
        if (stockFilter) {
            switch (stockFilter) {
                case 'inStock':
                    matchesStock = product.quantity > 10;
                    break;
                case 'lowStock':
                    matchesStock = product.quantity > 0 && product.quantity <= 10;
                    break;
                case 'outOfStock':
                    matchesStock = product.quantity === 0;
                    break;
            }
        }

        return matchesSearch && matchesCategory && matchesStock;
    });

    renderProducts(filteredProducts, true);
    updateStatistics(filteredProducts);
}

// دالة إعادة تعيين الفلاتر
export function resetFilters() {
    const searchInput = document.getElementById('productsSearch');
    const categorySelect = document.getElementById('categoryFilter');
    const stockSelect = document.getElementById('stockFilter');

    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = '';
    if (stockSelect) stockSelect.value = '';

    filteredProducts = [...allProducts];
    renderProducts(allProducts, true);
    updateStatistics();
}