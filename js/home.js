if (!window.electronAPI) {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            title: "تنبيه",
            text: "يرجى إعادة تشغيل التطبيق للمتابعة بشكل صحيح.",
            icon: "warning"
        });
    }
}

let categories = [], products = [], cart = [], customers = [];

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

async function loadQuickStats() {
    try {
        const today = (new Date).toISOString().split("T")[0];
        const sales = (await window.electronAPI.getSales()).filter(s => s.date.startsWith(today));
        const salesCount = sales.length;
        const totalRevenue = sales.reduce((acc, curr) => acc + (curr.total || 0) - (curr.returnAmount || 0), 0).toFixed(2);
        const lowStockCount = (await window.electronAPI.getProducts()).filter(p => p.quantity <= 3).length;

        const elSales = document.getElementById("dailySales");
        const elRev = document.getElementById("dailyRevenue");
        const elStock = document.getElementById("lowStock");

        if (elSales) elSales.textContent = salesCount;
        if (elRev) elRev.textContent = `${totalRevenue} جنيه`;
        if (elStock) elStock.textContent = lowStockCount;
    } catch (err) {
        console.error("Error loading quick stats:", err);
    }
}

function handleKeyboardShortcuts(e) {
    const { key, ctrlKey } = e;
    switch (true) {
        case key === "F10": window.location.href = "./sales-invoice.html"; break;
        case key === "F9": window.location.href = "./products.html"; break;
        case key === "F12": window.location.href = "./treasury.html"; break;
        case key === "t" && ctrlKey: window.location.href = "./categories.html"; break;
        case key === "F4": window.location.href = "./customers.html"; break;
        case key === "s" && ctrlKey: window.location.href = "./settings.html"; break;
        case key === "p" && ctrlKey: window.location.href = "./suppliers.html"; break;
        case key === "F8": window.location.href = "./ProductsPurchaseInvoices.html"; break;
        case key === "F7": window.location.href = "./purchase-invoices.html"; break;
        case key === "F6": window.location.href = "./sales.html"; break;
        case key === "F5": window.location.href = "./statistics.html"; break;
        case key === "F3": window.location.href = "./returns.html"; break;
        default: break;
    }
}

export async function renderHomeProducts(categoryFilter = "", searchFilter = "") {
    const container = document.getElementById("products");
    if (container) {
        try {
            let prods = await window.electronAPI.getProducts();
            const cats = await window.electronAPI.getCategories();
            if (!Array.isArray(prods)) prods = [];
            if (categoryFilter) prods = prods.filter(p => p.category === categoryFilter);
            if (searchFilter) prods = prods.filter(p => p.name.toLowerCase().includes(searchFilter.toLowerCase()));
            prods.sort((a, b) => a.name.localeCompare(b.name));

            if (prods.length === 0) {
                container.innerHTML = `
                    <div class="no-results shadow-lg shadow-primary">
                        <i class="fas fa-search text-3xl mb-2"></i>
                        <p>لا توجد منتجات مطابقة للبحث</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = prods.map(p => {
                const priceText = typeof p.price === "number" ? p.price.toFixed(2) : "غير متاح";
                return `
                    <div class="card product-card shadow-lg rounded-lg p-4 relative">
                        <style>
                            .description-container {
                                position: relative;
                                display: inline-block;
                                width: 100%;
                            }
                            .description-text {
                                display: -webkit-box;
                                -webkit-line-clamp: 1;
                                -webkit-box-orient: vertical;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                line-height: 1.5em;
                                cursor: pointer;
                            }
                            .description-tooltip {
                                visibility: hidden;
                                width: auto;
                                max-width: auto;
                                background-color: #4d00c9;
                                color: #fff;
                                text-align: center;
                                border-radius: 4px;
                                padding: 8px;
                                position: absolute;
                                z-index: 10;
                                bottom: 100%;
                                left: 10%;
                                opacity: 0;
                                transition: opacity 0.3s;
                                font-size: 14px;
                                box-shadow: 3px 2px 8px rgba(0,0,0,0.2);
                            }
                            .description-container:hover .description-tooltip {
                                visibility: visible;
                                opacity: 1;
                            }
                            .bg-green-100 {
                                background-color: #ccffc7;
                                width: 50%;
                                color: #000000;
                                border-radius: 20px;
                            }
                            .bg-yellow-100 {
                                background-color: #feed7b;
                                width: 50%;
                                color: #000000;
                                border-radius: 20px;
                            }
                            .bg-red-100 {
                                background-color: #ff9d9d;
                                width: 50%;
                                color: #000000;
                                border-radius: 20px;
                            }
                        </style>
                        <h3 class="text-lg font-bold text-blue-600">${p.name || "بدون اسم"}</h3>
                        <p class="text-gray-600 inline-block px-4 rounded my-2 ${p.quantity > 10 ? "bg-green-100" : p.quantity > 3 ? "bg-yellow-100" : "bg-red-100"}">الكمية: ${p.quantity || 0}</p>
                        <p class="text-green-600 font-bold">${priceText} جنيه</p>
                        <div class="description-container">
                            <div class="description-text text-gray-600 mt-1">${p.description || "لا يوجد وصف"}</div>
                            <div class="description-tooltip">${p.description || "لا يوجد وصف"}</div>
                        </div>
                    </div>
                `;
            }).join("");
        } catch (err) {
            container.innerHTML = '<p class="text-center text-red-500 py-6">تعذر تحميل المنتجات حالياً، يرجى المحاولة لاحقاً.</p>';
        }
    }
}

function filterAndSearch() {
    renderHomeProducts(
        document.getElementById("filterCategory").value,
        document.getElementById("searchInput").value
    );
}

document.addEventListener("DOMContentLoaded", () => {
    Promise.all([loadCategories(), loadProducts(), loadCart(), loadCustomers()]).then(() => {
        renderHomeProducts();
        renderCategoryFilter();
        renderCustomers();
        loadQuickStats();
        const sInput = document.getElementById("searchInput");
        if (sInput) sInput.addEventListener("input", debounce(filterAndSearch, 300));
        document.addEventListener("keydown", handleKeyboardShortcuts);
    }).catch(() => {});
});

export async function renderCategoryFilter() {
    const el = document.getElementById("filter");
    if (el) try {
        const cats = await window.electronAPI.getCategories();
        el.querySelector("select").innerHTML = `<option value="">كل المنتجات</option>${cats.map(c => `<option class="cursor-pointer" value="${c.name}">${c.name}</option>`).join("")}`;
    } catch (err) {}
}

export async function renderCustomers() {
    const container = document.getElementById("customersTable");
    if (container) try {
        customers = await window.electronAPI.getCustomers();
        if (!customers?.length) {
            return void (container.innerHTML = `
                <div class="empty-state p-8 text-center">
                    <i class="fas fa-users-slash text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">لا يوجد عملاء مسجلين حالياً</p>
                    <p class="text-gray-400 mt-2">يمكنك إضافة عميل جديد باستخدام النموذج أعلاه</p>
                </div>
            `);
        }
        container.innerHTML = `
            <table class="table w-full rounded-lg overflow-hidden">
                <thead>
                    <tr>
                        <th class="text-right bg-gradient-to-l from-indigo-600 to-purple-600 text-white py-4 px-6">اسم العميل</th>
                        <th class="text-right bg-gradient-to-l from-indigo-600 to-purple-600 text-white py-4 px-6">رقم الهاتف</th>
                        <th class="text-center bg-gradient-to-l from-indigo-600 to-purple-600 text-white py-4 px-6">الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(c => `
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="text-right py-4 px-6 border-b border-gray-100 font-medium">${c.name}</td>
                            <td class="text-right py-4 px-6 border-b border-gray-100">${c.phone}</td>
                            <td class="py-4 px-6 border-b border-gray-100">
                                <div class="flex justify-center gap-2">
                                    <button onclick="editCustomer('${c._id}')" 
                                            class="btn btn-primary btn-sm min-h-8 h-8 px-3 rounded-md text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all">
                                        <i class="fas fa-pen-to-square ml-1"></i>
                                        تعديل
                                    </button>
                                    <button onclick="deleteCustomer('${c._id}')" 
                                            class="btn btn-error btn-sm min-h-8 h-8 px-3 rounded-md text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all">
                                        <i class="fas fa-trash ml-1"></i>
                                        حذف
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    } catch (err) {
        container.innerHTML = `
            <div class="error-state p-6 text-center bg-red-50 rounded-lg">
                <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-3"></i>
                <p class="text-red-600 font-medium">تعذر تحميل بيانات العملاء</p>
                <p class="text-red-500 text-sm mt-1">يرجى المحاولة مرة أخرى لاحقاً</p>
            </div>
        `;
    }
}

export async function addCustomer() {
    const nameEl = document.getElementById("newCustomerName");
    const phoneEl = document.getElementById("newCustomerPhone");
    const name = nameEl ? nameEl.value.trim() : "";
    const phone = phoneEl ? phoneEl.value.trim() : "";

    let hasError = false;
    let firstInvalid = null;

    if (!name) {
        if (typeof window.markFieldInvalid === "function" && nameEl) {
            window.markFieldInvalid(nameEl, "يرجى إدخال اسم العميل");
        }
        if (!firstInvalid) firstInvalid = nameEl;
        hasError = true;
    }
    if (!phone) {
        if (typeof window.markFieldInvalid === "function" && phoneEl) {
            window.markFieldInvalid(phoneEl, "يرجى إدخال رقم هاتف العميل");
        }
        if (!firstInvalid) firstInvalid = phoneEl;
        hasError = true;
    }

    if (hasError) {
        if (firstInvalid) firstInvalid.focus();
        return Swal.fire({
            title: "تنبيه",
            text: "يرجى إدخال اسم العميل ورقم الهاتف للمتابعة.",
            icon: "warning",
            confirmButtonColor: "#3085d6"
        });
    }
    if (customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        if (typeof window.markFieldInvalid === "function" && nameEl) {
            window.markFieldInvalid(nameEl, "اسم العميل مسجل بالفعل");
            nameEl.focus();
        }
        return Swal.fire({
            title: "عميل مسجل مسبقاً",
            text: "يوجد عميل مسجل بالفعل بنفس هذا الاسم.",
            icon: "warning",
            confirmButtonColor: "#3085d6"
        });
    }
    try {
        await window.electronAPI.addCustomer({
            name,
            phone,
            dateAdded: (new Date).toISOString()
        });
        renderCustomers();
        ["newCustomerName", "newCustomerPhone"].forEach(id => document.getElementById(id).value = "");
        Swal.fire({
            title: "تم الحفظ بنجاح",
            text: "تمت إضافة العميل الجديد بنجاح.",
            icon: "success",
            confirmButtonColor: "#34D399"
        });
    } catch (err) {
        Swal.fire({
            title: "تنبيه",
            text: "تعذر حفظ بيانات العميل، يرجى المحاولة مرة أخرى.",
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
}

export async function editCustomer(id) {
    const customer = customers.find(c => c._id === id);
    if (!customer) return;

    Swal.fire({
        title: "تعديل بيانات العميل",
        html: `
            <div class="space-y-3 text-right">
                <label class="text-sm font-semibold text-gray-700">اسم العميل:</label>
                <input id="editCustomerName" class="swal2-input !mt-1 !w-full" value="${customer.name}" placeholder="أدخل اسم العميل" required>
                <label class="text-sm font-semibold text-gray-700 mt-2 block">رقم الهاتف:</label>
                <input id="editCustomerPhone" class="swal2-input !mt-1 !w-full" value="${customer.phone}" placeholder="أدخل رقم الهاتف" required>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: "حفظ التعديل",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#34D399",
        cancelButtonColor: "#6B7280",
        preConfirm: () => {
            const [name, phone] = ["editCustomerName", "editCustomerPhone"].map(elId => document.getElementById(elId).value.trim());
            if (!name || !phone) {
                Swal.showValidationMessage("يرجى إدخال اسم العميل ورقم الهاتف");
                return false;
            }
            if (customers.some(c => c.name.toLowerCase() === name.toLowerCase() && c._id !== id)) {
                Swal.showValidationMessage("يوجد عميل مسجل بالفعل بهذا الاسم");
                return false;
            }
            return { name, phone };
        }
    }).then(async res => {
        if (res.isConfirmed && res.value) {
            try {
                await window.electronAPI.updateCustomer(id, {
                    name: res.value.name,
                    phone: res.value.phone,
                    dateAdded: customer.dateAdded
                });
                renderCustomers();
                Swal.fire({
                    title: "تم التعديل",
                    text: "تم تحديث بيانات العميل بنجاح.",
                    icon: "success",
                    confirmButtonColor: "#34D399"
                });
            } catch (err) {
                Swal.fire({
                    title: "تنبيه",
                    text: "تعذر تعديل بيانات العميل، يرجى المحاولة مرة أخرى.",
                    icon: "error",
                    confirmButtonColor: "#EF4444"
                });
            }
        }
    });
}

export async function deleteCustomer(id) {
    const res = await Swal.fire({
        title: "تأكيد حذف العميل",
        text: "هل أنت متأكد من رغبتك في حذف هذا العميل؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم، احذف",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#6B7280"
    });

    if (res.isConfirmed) {
        try {
            await window.electronAPI.deleteCustomer(id);
            renderCustomers();
            Swal.fire({
                title: "تم الحذف",
                text: "تم حذف العميل بنجاح.",
                icon: "success",
                confirmButtonColor: "#34D399"
            });
        } catch (err) {
            Swal.fire({
                title: "تنبيه",
                text: "تعذر حذف العميل، يرجى المحاولة مرة أخرى.",
                icon: "error",
                confirmButtonColor: "#EF4444"
            });
        }
    }
}

async function loadCategories() { categories = await window.electronAPI.getCategories(); }
async function loadProducts() { products = await window.electronAPI.getProducts(); }
async function loadCart() { cart = await window.electronAPI.getCart(); }
async function loadCustomers() { customers = await window.electronAPI.getCustomers(); }

window.electronAPI.onOpenPage((url => { window.location.href = url; }));
window.renderHomeProducts = renderHomeProducts;
window.filterProducts = filterAndSearch;
window.renderCategoryFilter = renderCategoryFilter;
window.renderCustomers = renderCustomers;
window.addCustomer = addCustomer;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;