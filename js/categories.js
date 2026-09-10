let categories = [];
let allProducts = [];
let currentCategoryFilter = "";

export function updateCategoryStats(cats, prods) {
    const totalCatEl = document.getElementById("totalCategoriesCount");
    const totalProdEl = document.getElementById("totalCategorizedProducts");

    if (totalCatEl) {
        totalCatEl.textContent = (cats.length || 0).toLocaleString("ar-EG");
    }

    if (totalProdEl) {
        const catNames = new Set(cats.map(c => String(c.name || "").trim().toLowerCase()));
        const categorizedCount = prods.filter(p => {
            const pCat = String(p.category || "").trim().toLowerCase();
            return pCat && catNames.has(pCat);
        }).length;
        totalProdEl.textContent = categorizedCount.toLocaleString("ar-EG");
    }
}

export function formatCategoryCard(cat, products) {
    const prodCount = cat.productsCount !== undefined ? cat.productsCount : products.filter(p => {
        const n = String(p.category || "").trim().toLowerCase();
        const r = String(cat.name || "").trim().toLowerCase();
        return n === r;
    }).length;

    return `
        <div class="category-card">
            <div class="category-card-top">
                <div class="category-badge-group">
                    <div class="category-icon-box">
                        <i class="fas fa-tag"></i>
                    </div>
                    <div>
                        <h3 class="category-title">${cat.name || "فئة غير محددة"}</h3>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="category-action-btn edit" onclick="editCategory('${cat._id}')" title="تعديل الفئة">
                        <i class="fas fa-pen-to-square"></i>
                    </button>
                    <button class="category-action-btn delete" onclick="deleteCategory('${cat._id}')" title="حذف الفئة">
                        <i class="fas fa-trash-can"></i>
                    </button>
                </div>
            </div>

            <div class="category-card-bottom">
                <span class="category-count-pill">
                    <i class="fas fa-box" style="color: var(--primary-color);"></i>
                    <span>يحتوي على: <strong>${prodCount.toLocaleString("ar-EG")}</strong> منتج</span>
                </span>
            </div>
        </div>
    `;
}

export function renderCategoriesList(catsToRender) {
    const container = document.getElementById("categories");
    if (!container) return;

    if (!catsToRender || catsToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-categories">
                <i class="fas fa-tags"></i>
                <p>${currentCategoryFilter ? "لا توجد فئات مطابقة لكلمة البحث" : "لا توجد فئات مسجلة حالياً"}</p>
                <small style="color: #94a3b8; display: block; margin-top: 6px;">يمكنك إضافة فئة جديدة باستخدام النموذج أعلاه</small>
            </div>
        `;
        return;
    }

    container.innerHTML = catsToRender.map(c => formatCategoryCard(c, allProducts)).join("");
}

export async function renderCategories() {
    const container = document.getElementById("categories");
    if (!container) return;

    try {
        const [cats, prods] = await Promise.all([
            window.electronAPI.getCategories(),
            window.electronAPI.getProducts()
        ]);

        categories = Array.isArray(cats) ? cats : [];
        allProducts = Array.isArray(prods) ? prods : [];

        updateCategoryStats(categories, allProducts);

        const filtered = currentCategoryFilter
            ? categories.filter(c => (c.name || "").toLowerCase().includes(currentCategoryFilter.toLowerCase()))
            : categories;

        renderCategoriesList(filtered);
    } catch (e) {
        console.error("Error loading categories:", e);
        if (container) {
            container.innerHTML = `
                <div class="empty-categories" style="border-color: #fecaca; color: #dc2626;">
                    <i class="fas fa-triangle-exclamation" style="color: #dc2626;"></i>
                    <p>تعذر تحميل الفئات حالياً، يرجى المحاولة لاحقاً</p>
                </div>
            `;
        }
    }
}

export function handleCategorySearch(query) {
    currentCategoryFilter = (query || "").trim();
    const filtered = currentCategoryFilter
        ? categories.filter(c => (c.name || "").toLowerCase().includes(currentCategoryFilter.toLowerCase()))
        : categories;
    renderCategoriesList(filtered);
}

export async function addCategory() {
    const inputEl = document.getElementById("categoryName");
    const val = inputEl ? inputEl.value.trim() : "";
    if (!val) {
        if (typeof window.markFieldInvalid === "function" && inputEl) {
            window.markFieldInvalid(inputEl, "يرجى إدخال اسم الفئة للمتابعة");
            inputEl.focus();
        }
        return void Swal.fire({
            icon: "warning",
            title: "تنبيه",
            text: "يرجى إدخال اسم الفئة للمتابعة.",
            confirmButtonText: "حسناً",
            confirmButtonColor: "#6d28d9"
        });
    }
    try {
        const existing = await window.electronAPI.getCategories();
        if (existing.some(e => e.name.toLowerCase() === val.toLowerCase())) {
            return void Swal.fire({
                icon: "warning",
                title: "فئة مسجلة مسبقاً",
                text: "اسم الفئة موجود بالفعل، يرجى اختيار اسم آخر.",
                confirmButtonColor: "#6d28d9",
                confirmButtonText: "حسناً"
            });
        }
        await window.electronAPI.addCategory({ name: val });
        if (inputEl) inputEl.value = "";
        await renderCategories();
        if (typeof renderCategoryOptions === "function") renderCategoryOptions();
        Swal.fire({
            icon: "success",
            title: "تم الحفظ بنجاح",
            text: "تمت إضافة الفئة الجديدة بنجاح.",
            confirmButtonColor: "#059669",
            confirmButtonText: "حسناً"
        });
    } catch (e) {
        Swal.fire({
            icon: "error",
            title: "تنبيه",
            text: "تعذر حفظ الفئة، يرجى المحاولة مرة أخرى.",
            confirmButtonColor: "#ef4444",
            confirmButtonText: "حسناً"
        });
    }
}

let lastFocusedCategoryElement = null;

export function openEditCategoryModal(id) {
    const target = categories.find(e => e._id === id);
    if (!target) {
        return void Swal.fire({
            icon: "error",
            title: "تنبيه",
            text: "تعذر العثور على بيانات الفئة المطلوبة.",
            confirmButtonColor: "#ef4444",
            confirmButtonText: "حسناً"
        });
    }

    const modal = document.getElementById("editCategoryModal");
    const idInput = document.getElementById("editCategoryId");
    const nameInput = document.getElementById("editCategoryInput");
    const main = document.querySelector(".main-content");

    if (modal && idInput && nameInput) {
        lastFocusedCategoryElement = document.activeElement;
        idInput.value = id;
        nameInput.value = target.name || "";
        if (main) main.setAttribute("inert", "");
        modal.classList.add("open");
        setTimeout(() => {
            nameInput.focus();
            nameInput.select();
        }, 150);
    }
}

export function closeEditCategoryModal() {
    const modal = document.getElementById("editCategoryModal");
    const main = document.querySelector(".main-content");
    if (modal) {
        modal.classList.remove("open");
        if (main) main.removeAttribute("inert");
        if (lastFocusedCategoryElement) lastFocusedCategoryElement.focus();
    }
}

export function handleCategoryModalOverlayClick(e) {
    if (e.target === document.getElementById("editCategoryModal")) {
        closeEditCategoryModal();
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const modal = document.getElementById("editCategoryModal");
        if (modal && modal.classList.contains("open")) {
            closeEditCategoryModal();
        }
    }
});

export async function submitEditCategory() {
    const idInput = document.getElementById("editCategoryId");
    const nameInput = document.getElementById("editCategoryInput");
    if (!idInput || !nameInput) return;

    const id = idInput.value;
    const newName = nameInput.value.trim();

    if (!newName) {
        nameInput.focus();
        return void Swal.fire({
            icon: "warning",
            title: "تنبيه",
            text: "يرجى إدخال اسم الفئة للمتابعة.",
            confirmButtonColor: "#6d28d9",
            confirmButtonText: "حسناً"
        });
    }

    try {
        const existing = await window.electronAPI.getCategories();
        if (existing.some(c => c._id !== id && c.name.toLowerCase() === newName.toLowerCase())) {
            return void Swal.fire({
                icon: "warning",
                title: "فئة مسجلة مسبقاً",
                text: "اسم الفئة موجود بالفعل، يرجى اختيار اسم آخر.",
                confirmButtonColor: "#6d28d9",
                confirmButtonText: "حسناً"
            });
        }

        await window.electronAPI.updateCategory(id, { name: newName });
        closeEditCategoryModal();
        await renderCategories();
        if (typeof renderCategoryOptions === "function") renderCategoryOptions();

        Swal.fire({
            icon: "success",
            title: "تم التعديل",
            text: "تم تعديل اسم الفئة بنجاح.",
            timer: 1500,
            showConfirmButton: false
        });
    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "تنبيه",
            text: "تعذر تعديل الفئة حالياً، يرجى المحاولة لاحقاً.",
            confirmButtonColor: "#ef4444",
            confirmButtonText: "حسناً"
        });
    }
}

export function editCategory(id) {
    openEditCategoryModal(id);
}

export async function deleteCategory(id) {
    Swal.fire({
        title: "تأكيد حذف الفئة",
        text: "هل تريد بالتأكيد حذف هذه الفئة وجميع المنتجات المرتبطة بها؟",
        icon: "warning",
        showCancelButton: true,
        cancelButtonText: "إلغاء",
        confirmButtonText: "نعم، احذف الفئة",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b"
    }).then(async res => {
        if (res.isConfirmed) {
            try {
                await window.electronAPI.deleteCategory(id);
                const prods = (await window.electronAPI.getProducts()).filter(p => p.category === id);
                for (const p of prods) await window.electronAPI.deleteProduct(p._id);
                await renderCategories();
                if (typeof renderCategoryOptions === "function") renderCategoryOptions();
                if (typeof renderProducts === "function") renderProducts();
                Swal.fire({
                    icon: "success",
                    title: "تم الحذف",
                    text: "تم حذف الفئة والمنتجات التابعة لها بنجاح.",
                    confirmButtonColor: "#059669",
                    confirmButtonText: "حسناً"
                });
            } catch (err) {
                Swal.fire({
                    icon: "error",
                    title: "تنبيه",
                    text: "تعذر حذف الفئة، يرجى المحاولة لاحقاً.",
                    confirmButtonColor: "#ef4444",
                    confirmButtonText: "حسناً"
                });
            }
        }
    });
}

if ("categories" === document.body.getAttribute("data-page")) {
    renderCategories().catch(() => {});
}

window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.editCategory = editCategory;
window.handleCategorySearch = handleCategorySearch;