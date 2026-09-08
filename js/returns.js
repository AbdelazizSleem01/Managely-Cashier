if (!window.electronAPI) throw new Error("electronAPI unavailable");

let sales = [];
let selectedSaleId = null;
let selectedProducts = new Map(); // لتخزين المنتجات المحددة وكمياتها

async function loadInvoices(searchQuery = "") {
    try {
        sales = await window.electronAPI.getSales();
        const invoiceList = document.getElementById("invoiceList");
        const invoiceInput = document.getElementById("invoiceSearch");
        
        if (invoiceList && invoiceInput) {
            let filteredSales = sales;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredSales = sales.filter(sale => 
                    sale.invoiceNumber?.toLowerCase().includes(query) ||
                    new Date(sale.date).toLocaleDateString('ar-EG').includes(query)
                );
            }

            if (filteredSales.length === 0) {
                invoiceList.innerHTML = '<div class="p-2 text-center text-gray-500">لا توجد فواتير مطابقة</div>';
                invoiceList.classList.remove("hidden");
                return;
            }

            invoiceList.innerHTML = filteredSales
              .map(
                (sale) => `
                <div class="p-2 hover:bg-gray-100 invoice-item ${
                  sale.hasReturn ? "text-gray-400 cursor-not-allowed" : "cursor-pointer"
                }" 
                     data-sale-id="${sale._id}">
                    ${sale.invoiceNumber} - ${new Date(
                  sale.date
                ).toLocaleDateString("ar-EG")}
                    ${
                      sale.hasReturn
                        ? '<span class="text-error font-bold mr-2">(تـم الإسترجاع)</span>'
                        : ""
                    }
                    <div class="text-xs text-gray-500 mt-1">
                        إجمالي الفاتورة: ${sale.total?.toFixed(2) || '0'} جنيه
                    </div>
                </div>
            `
              )
              .join("");

            document.querySelectorAll('.invoice-item').forEach(item => {
                const saleId = item.getAttribute('data-sale-id');
                const sale = sales.find(s => s._id === saleId);
                if (!sale.hasReturn) {
                    item.addEventListener('click', () => selectInvoice(saleId));
                }
            });

            invoiceList.classList.remove("hidden");
        }
    } catch (error) {
        console.error("خطأ أثناء تحميل الفواتير:", error);
        Swal.fire({ title: "تنبيه", text: "تعذر تحميل قائمة الفواتير، يرجى المحاولة لاحقاً.", icon: "error", confirmButtonColor: "#EF4444" });
    }
}

function selectInvoice(saleId) {
    selectedSaleId = saleId;
    selectedProducts.clear(); // مسح المنتجات المحددة سابقاً
    
    const invoiceInput = document.getElementById("invoiceSearch");
    const invoiceList = document.getElementById("invoiceList");
    const invoiceDetails = document.getElementById("invoiceDetails");
    const invoiceInfo = document.getElementById("invoiceInfo");
    const productsContainer = document.getElementById("productsContainer");
    const returnSummary = document.getElementById("returnSummary");
    const submitReturn = document.getElementById("submitReturn");
    
    const sale = sales.find(s => s._id === saleId);

    if (invoiceInput && invoiceList && invoiceDetails && invoiceInfo && productsContainer && returnSummary && submitReturn) {
        invoiceInput.value = `${sale.invoiceNumber} - ${new Date(sale.date).toLocaleDateString('ar-EG')}`;
        invoiceList.classList.add("hidden");

        // عرض تفاصيل الفاتورة
        invoiceInfo.innerHTML = `
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div><strong>رقم الفاتورة:</strong> ${sale.invoiceNumber}</div>
                <div><strong>التاريخ:</strong> ${new Date(sale.date).toLocaleDateString('ar-EG')}</div>
                <div><strong>العميل:</strong> ${sale.customerName || 'غير محدد'}</div>
                <div><strong>إجمالي الفاتورة:</strong> ${sale.total?.toFixed(2) || '0'} جنيه</div>
            </div>
        `;

        // عرض المنتجات
        if (sale && sale.items && sale.items.length > 0) {
            productsContainer.innerHTML = sale.items.map((item, index) => `
                <div class="product-item" data-product-id="${item._id}">
                    <div class="flex items-center">
                        <input type="checkbox" 
                               id="product-${index}" 
                               class="checkbox checkbox-primary" 
                               data-product-id="${item._id}"
                               data-max-quantity="${item.quantity}"
                               data-price="${item.price}"
                               data-name="${item.name}">
                        <div class="product-info">
                            <div class="product-name">${item.name}</div>
                            <div class="product-details">
                                السعر: ${item.price?.toFixed(2) || '0'} جنيه | 
                                الكمية في الفاتورة: ${item.quantity} | 
                                الإجمالي: ${(item.price * item.quantity)?.toFixed(2) || '0'} جنيه
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <label class="text-sm text-gray-600">كمية المرتجع:</label>
                        <input type="number" 
                               class="quantity-input bg-white" 
                               min="0" 
                               max="${item.quantity}" 
                               value="0" 
                               disabled
                               data-product-id="${item._id}"
                               placeholder="0">
                        <button class="btn btn-xs btn-outline btn-primary" 
                                onclick="setMaxQuantity('${item._id}', ${item.quantity})"
                                title="تحديد الكمية الكاملة">
                            <i class="fas fa-maximize"></i>
                        </button>
                    </div>
                </div>
            `).join("");

            // إضافة event listeners للمنتجات
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', handleProductSelection);
            });

            document.querySelectorAll('.quantity-input').forEach(input => {
                input.addEventListener('input', updateReturnSummary);
            });

            invoiceDetails.classList.remove("hidden");
            returnSummary.classList.add("hidden");
            submitReturn.disabled = true;
        } else {
            productsContainer.innerHTML = '<div class="text-center text-gray-500 py-4">لا يوجد منتجات في هذه الفاتورة</div>';
            invoiceDetails.classList.remove("hidden");
            returnSummary.classList.add("hidden");
            submitReturn.disabled = true;
        }
    }
}

function handleProductSelection(event) {
    const checkbox = event.target;
    const productId = checkbox.getAttribute('data-product-id');
    const quantityInput = document.querySelector(`input[data-product-id="${productId}"][type="number"]`);
    
    if (checkbox.checked) {
        quantityInput.disabled = false;
        quantityInput.value = "1"; // تعيين قيمة افتراضية
        selectedProducts.set(productId, {
            name: checkbox.getAttribute('data-name'),
            price: parseFloat(checkbox.getAttribute('data-price')),
            maxQuantity: parseInt(checkbox.getAttribute('data-max-quantity')),
            quantity: 1
        });
    } else {
        quantityInput.disabled = true;
        quantityInput.value = "0";
        selectedProducts.delete(productId);
    }
    
    updateReturnSummary();
}

function updateReturnSummary() {
    const returnSummary = document.getElementById("returnSummary");
    const summaryContent = document.getElementById("summaryContent");
    const submitReturn = document.getElementById("submitReturn");
    
    if (selectedProducts.size === 0) {
        returnSummary.classList.add("hidden");
        submitReturn.disabled = true;
        return;
    }

    let totalReturnAmount = 0;
    let summaryHTML = '';
    const sale = sales.find(s => s._id === selectedSaleId);
    const originalTotal = sale?.total || 0;

    selectedProducts.forEach((product, productId) => {
        const quantityInput = document.querySelector(`input[data-product-id="${productId}"][type="number"]`);
        const quantity = parseInt(quantityInput.value) || 0;
        
        if (quantity > 0) {
            const itemTotal = product.price * quantity;
            totalReturnAmount += itemTotal;
            
            summaryHTML += `
                <div class="summary-item">
                    <span>${product.name} (${quantity} × ${product.price.toFixed(2)})</span>
                    <span>${itemTotal.toFixed(2)} جنيه</span>
                </div>
            `;
        }
    });

    if (totalReturnAmount > 0) {
        const percentage = ((totalReturnAmount / originalTotal) * 100).toFixed(1);
        
        summaryHTML += `
            <div class="summary-item border-t-2 border-blue-200 pt-2">
                <span>إجمالي المرتجع</span>
                <span>${totalReturnAmount.toFixed(2)} جنيه</span>
            </div>
            <div class="summary-item text-sm text-gray-600">
                <span>إجمالي الفاتورة الأصلي</span>
                <span>${originalTotal.toFixed(2)} جنيه</span>
            </div>
            <div class="summary-item text-sm text-blue-600">
                <span>نسبة المرتجع</span>
                <span>${percentage}%</span>
            </div>
        `;
        
        returnSummary.classList.remove("hidden");
        summaryContent.innerHTML = summaryHTML;
        submitReturn.disabled = false;
    } else {
        returnSummary.classList.add("hidden");
        submitReturn.disabled = true;
    }
}

async function processReturn() {
    const submitReturn = document.getElementById("submitReturn");

    if (!selectedSaleId || selectedProducts.size === 0) {
        Swal.fire({ title: "تنبيه", text: "يرجى اختيار المنتجات المراد إرجاعها أولاً.", icon: "warning", confirmButtonColor: "#3085d6" });
        return;
    }

    // التحقق من الكميات
    for (const [productId, product] of selectedProducts) {
        const quantityInput = document.querySelector(`input[data-product-id="${productId}"][type="number"]`);
        const quantity = parseInt(quantityInput.value) || 0;
        
        if (quantity <= 0) {
            Swal.fire({ title: "تنبيه", text: "يرجى تحديد كمية صحيحة للمنتجات المحددة.", icon: "warning", confirmButtonColor: "#3085d6" });
            return;
        }
        
        if (quantity > product.maxQuantity) {
            Swal.fire({ title: "تنبيه", text: `كمية المرتجع للمنتج (${product.name}) أكبر من الكمية المسجلة بالفاتورة.`, icon: "warning", confirmButtonColor: "#3085d6" });
            return;
        }
    }

    // عرض تأكيد المرتجع
    const sale = sales.find(s => s._id === selectedSaleId);
    let confirmationMessage = `هل أنت متأكد من إتمام المرتجع؟\n\nالمنتجات المرتجعة:\n`;
    let totalReturnAmount = 0;
    let returnedProducts = [];

    for (const [productId, product] of selectedProducts) {
        const quantityInput = document.querySelector(`input[data-product-id="${productId}"][type="number"]`);
        const quantity = parseInt(quantityInput.value) || 0;
        if (quantity > 0) {
            const itemTotal = product.price * quantity;
            totalReturnAmount += itemTotal;
            confirmationMessage += `• ${product.name}: ${quantity} قطعة (${itemTotal.toFixed(2)} جنيه)\n`;
            returnedProducts.push({ name: product.name, quantity, amount: itemTotal });
        }
    }

    confirmationMessage += `\nإجمالي المرتجع: ${totalReturnAmount.toFixed(2)} جنيه`;

    const result = await Swal.fire({
        title: "تأكيد المرتجع",
        text: confirmationMessage,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#34D399",
        cancelButtonColor: "#EF4444",
        confirmButtonText: "نعم، أكد المرتجع",
        cancelButtonText: "إلغاء"
    });

    if (!result.isConfirmed) {
        return;
    }

    submitReturn.disabled = true;

    try {
        const user = (await window.electronAPI.getSettings())?.currentUser || 'غير معروف';

        // معالجة كل منتج محدد
        for (const [productId, product] of selectedProducts) {
            const quantityInput = document.querySelector(`input[data-product-id="${productId}"][type="number"]`);
            const returnQuantity = parseInt(quantityInput.value) || 0;
            
            if (returnQuantity > 0) {
                const saleItem = sale.items.find(i => i._id === productId);
                const productInDB = (await window.electronAPI.getProducts()).find(p => p._id === saleItem.productId || p._id === saleItem._id);

                if (productInDB) {
                    // تحديث كمية المنتج في المخزون
                    const newQuantity = productInDB.quantity + returnQuantity;
                    await window.electronAPI.updateProduct(productInDB._id, { quantity: newQuantity });
                } else {
                    throw new Error(`المنتج ${product.name} غير موجود في المخزون.`);
                }
            }
        }

        if (returnedProducts.length === 0) {
            throw new Error("لا توجد منتجات صالحة للمرتجع.");
        }

        // إضافة حركة خزنة للمرتجع بالقيمة الفعلية
        const returnDescription = `مرتجع - فاتورة ${sale.invoiceNumber} - ${returnedProducts.map(p => `${p.name} (${p.quantity})`).join(', ')}`;
        await window.electronAPI.addTreasuryTransaction({
            date: new Date().toISOString(),
            type: 'expense',
            amount: totalReturnAmount,
            description: returnDescription,
            user: user
        });

        // تحديث حالة الفاتورة
        await window.electronAPI.updateSale(sale._id, { hasReturn: true, returnAmount: totalReturnAmount });

        // رسالة النجاح
        const successMessage = `تمت عملية المرتجع بنجاح!\n\nالمنتجات المرتجعة:\n${returnedProducts.map(p => `• ${p.name}: ${p.quantity} قطعة (${p.amount.toFixed(2)} جنيه)`).join('\n')}\n\nإجمالي المرتجع: ${totalReturnAmount.toFixed(2)} جنيه`;

        Swal.fire({
            title: "تم!",
            text: successMessage,
            icon: "success",
            confirmButtonColor: "#34D399"
        }).then(() => {
            // إعادة تعيين النموذج
            resetForm();
            loadInvoices();
        });

    } catch (error) {
        console.error("خطأ أثناء معالجة المرتجع:", error);
        Swal.fire({ title: "تنبيه", text: "تعذر إتمام عملية المرتجع، يرجى المحاولة مرة أخرى.", icon: "error", confirmButtonColor: "#EF4444" });
    } finally {
        if (submitReturn) submitReturn.disabled = false;
    }
}

function resetForm() {
    selectedSaleId = null;
    selectedProducts.clear();
    
    const invoiceInput = document.getElementById("invoiceSearch");
    const invoiceDetails = document.getElementById("invoiceDetails");
    const returnSummary = document.getElementById("returnSummary");
    const submitReturn = document.getElementById("submitReturn");
    
    if (invoiceInput) invoiceInput.value = "";
    if (invoiceDetails) invoiceDetails.classList.add("hidden");
    if (returnSummary) returnSummary.classList.add("hidden");
    if (submitReturn) submitReturn.disabled = true;
}

function selectAllProducts() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const quantityInputs = document.querySelectorAll('.quantity-input');
    
    checkboxes.forEach((checkbox, index) => {
        if (!checkbox.checked) {
            checkbox.checked = true;
            const productId = checkbox.getAttribute('data-product-id');
            const quantityInput = document.querySelector(`input[data-product-id="${productId}"][type="number"]`);
            
            if (quantityInput) {
                quantityInput.disabled = false;
                quantityInput.value = quantityInput.getAttribute('max'); // تحديد الكمية الكاملة
                
                selectedProducts.set(productId, {
                    name: checkbox.getAttribute('data-name'),
                    price: parseFloat(checkbox.getAttribute('data-price')),
                    maxQuantity: parseInt(checkbox.getAttribute('data-max-quantity')),
                    quantity: parseInt(quantityInput.getAttribute('max'))
                });
            }
        }
    });
    
    updateReturnSummary();
}

function deselectAllProducts() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const quantityInputs = document.querySelectorAll('.quantity-input');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    quantityInputs.forEach(input => {
        input.disabled = true;
        input.value = "0";
    });
    
    selectedProducts.clear();
    updateReturnSummary();
}

function setMaxQuantity(productId, maxQuantity) {
    const checkbox = document.querySelector(`input[data-product-id="${productId}"][type="checkbox"]`);
    const quantityInput = document.querySelector(`input[data-product-id="${productId}"][type="number"]`);
    
    if (checkbox && quantityInput) {
        checkbox.checked = true;
        quantityInput.disabled = false;
        quantityInput.value = maxQuantity;
        
        selectedProducts.set(productId, {
            name: checkbox.getAttribute('data-name'),
            price: parseFloat(checkbox.getAttribute('data-price')),
            maxQuantity: parseInt(checkbox.getAttribute('data-max-quantity')),
            quantity: maxQuantity
        });
        
        updateReturnSummary();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadInvoices();
    const invoiceInput = document.getElementById("invoiceSearch");
    const invoiceList = document.getElementById("invoiceList");

    if (invoiceInput) {
        invoiceInput.addEventListener("input", () => {
            loadInvoices(invoiceInput.value.trim());
            invoiceList.classList.remove("hidden");
        });
        invoiceInput.addEventListener("focus", () => {
            loadInvoices(invoiceInput.value.trim());
            invoiceList.classList.remove("hidden");
        });
    }

    if (invoiceList) {
        document.addEventListener("click", (e) => {
            if (!invoiceList.contains(e.target) && e.target !== invoiceInput) {
                invoiceList.classList.add("hidden");
            }
        });
    }
});
window.selectAllProducts = selectAllProducts;
window.deselectAllProducts = deselectAllProducts;
window.setMaxQuantity = setMaxQuantity;
window.processReturn = processReturn;