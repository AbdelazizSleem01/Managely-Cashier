let categories = [];

export async function renderCategories() {
    const t = document.getElementById("categories");
    if (t) try {
        categories = await window.electronAPI.getCategories();
        if (!categories || 0 === categories.length) {
            return void (t.innerHTML = '<p class="text-center text-gray-500 py-8">لا توجد فئات مسجلة حالياً.</p>');
        }
        const e = await window.electronAPI.getProducts();
        t.innerHTML = categories.map((t => {
            const n = t.productsCount || e.filter((e => {
                const n = String(e.category || "").trim(), r = String(t.name || "").trim();
                return n === r;
            })).length;
            return `
                <div class="card bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 rounded-xl overflow-hidden">
                    <div class="card-body p-5">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 space-x-reverse">
                                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <i class="fas fa-tag"></i>
                                </div>
                                <h3 class="card-title text-lg font-semibold text-gray-800">${t.name || "بدون اسم"}</h3>
                            </div>
                            <div class="card-actions">
                                <div class="flex gap-2">
                                    <button class="btn btn-circle btn-sm btn-outline btn-error hover:bg-red-600 hover:text-white" 
                                            onclick="deleteCategory('${t._id}')"
                                            data-tip="حذف الفئة">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                    <button class="btn btn-circle btn-sm btn-outline btn-warning hover:bg-yellow-500 hover:text-white" 
                                            onclick="editCategory('${t._id}')"
                                            data-tip="تعديل الفئة">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 text-sm text-gray-500">
                            <span class="inline-block px-2 py-1 bg-gray-100 rounded-full">
                                ${n} منتج${1 === n ? "" : "ات"}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        })).join("");
    } catch (e) {
        t.innerHTML = '<p class="text-center text-red-500 py-8">تعذر تحميل الفئات حالياً، يرجى المحاولة لاحقاً.</p>';
    }
}

export async function addCategory() {
    const inputEl = document.getElementById("categoryName");
    const t = inputEl ? inputEl.value.trim() : "";
    if (!t) {
        if (typeof window.markFieldInvalid === "function" && inputEl) {
            window.markFieldInvalid(inputEl, "يرجى إدخال اسم الفئة للمتابعة");
            inputEl.focus();
        }
        return void Swal.fire({
            icon: "warning",
            title: "تنبيه",
            text: "يرجى إدخال اسم الفئة للمتابعة.",
            confirmButtonText: "حسناً"
        });
    }
    try {
        const existing = await window.electronAPI.getCategories();
        if (existing.some(e => e.name.toLowerCase() === t.toLowerCase())) {
            return void Swal.fire({
                icon: "warning",
                title: "فئة مسجلة مسبقاً",
                text: "اسم الفئة موجود بالفعل، يرجى اختيار اسم آخر."
            });
        }
        await window.electronAPI.addCategory({ name: t });
        document.getElementById("categoryName").value = "";
        renderCategories();
        if (typeof renderCategoryOptions === "function") renderCategoryOptions();
        Swal.fire({
            icon: "success",
            title: "تم الحفظ بنجاح",
            text: "تمت إضافة الفئة الجديدة بنجاح."
        });
    } catch (e) {
        Swal.fire({
            icon: "error",
            title: "تنبيه",
            text: "تعذر حفظ الفئة، يرجى المحاولة مرة أخرى."
        });
    }
}

export async function editCategory(t) {
    try {
        const e = categories.find(e => e._id === t);
        if (!e) {
            return void Swal.fire({
                icon: "error",
                title: "تنبيه",
                text: "تعذر العثور على بيانات الفئة المطلوبة."
            });
        }
        Swal.fire({
            title: "تعديل الفئة",
            html: `
                <div class="form-control text-right">
                    <label class="label"><span class="label-text text-primary font-semibold">اسم الفئة</span></label>
                    <input id="editCategoryName" class="input input-bordered input-primary bg-transparent w-full text-black" value="${e.name}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: "حفظ التعديل",
            cancelButtonText: "إلغاء",
            buttonsStyling: false,
            customClass: {
                confirmButton: "btn btn-primary mx-2 text-white",
                cancelButton: "btn btn-ghost mx-2"
            },
            preConfirm: () => {
                const name = document.getElementById("editCategoryName").value.trim();
                if (!name) {
                    Swal.showValidationMessage("يرجى إدخال اسم الفئة");
                    return false;
                }
                return name;
            }
        }).then(async res => {
            if (res.isConfirmed && res.value) {
                const newName = res.value;
                const existing = await window.electronAPI.getCategories();
                if (existing.some(c => c._id !== t && c.name.toLowerCase() === newName.toLowerCase())) {
                    return void Swal.fire({
                        icon: "warning",
                        title: "فئة مسجلة مسبقاً",
                        text: "اسم الفئة موجود بالفعل، يرجى اختيار اسم آخر."
                    });
                }
                try {
                    await window.electronAPI.updateCategory(t, { name: newName });
                    renderCategories();
                    if (typeof renderCategoryOptions === "function") renderCategoryOptions();
                    Swal.fire({
                        icon: "success",
                        title: "تم التعديل",
                        text: "تم تعديل اسم الفئة بنجاح."
                    });
                } catch (err) {
                    Swal.fire({
                        icon: "error",
                        title: "تنبيه",
                        text: "تعذر تعديل الفئة حالياً، يرجى المحاولة لاحقاً."
                    });
                }
            }
        });
    } catch (t) {
        Swal.fire({
            icon: "error",
            title: "تنبيه",
            text: "تعذر استرجاع بيانات الفئة."
        });
    }
}

export async function deleteCategory(t) {
    Swal.fire({
        title: "تأكيد حذف الفئة",
        text: "هل تريد بالتأكيد حذف هذه الفئة وجميع المنتجات المرتبطة بها؟",
        icon: "warning",
        showCancelButton: true,
        cancelButtonText: "إلغاء",
        confirmButtonText: "نعم، احذف",
        buttonsStyling: false,
        customClass: {
            confirmButton: "btn btn-error mx-2 text-white",
            cancelButton: "btn btn-ghost mx-2"
        }
    }).then(async e => {
        if (e.isConfirmed) {
            try {
                await window.electronAPI.deleteCategory(t);
                const prods = (await window.electronAPI.getProducts()).filter(p => p.category === t);
                for (const p of prods) await window.electronAPI.deleteProduct(p._id);
                renderCategories();
                if (typeof renderCategoryOptions === "function") renderCategoryOptions();
                if (typeof renderProducts === "function") renderProducts();
                Swal.fire({
                    icon: "success",
                    title: "تم الحذف",
                    text: "تم حذف الفئة بنجاح."
                });
            } catch (err) {
                Swal.fire({
                    icon: "error",
                    title: "تنبيه",
                    text: "تعذر حذف الفئة، يرجى المحاولة لاحقاً."
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