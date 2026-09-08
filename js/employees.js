let employees = [],
    editingEmployeeId = null;
const defaultPhoto = "../assets/images/avatar.png",
    els = {
        list: document.getElementById("employeesList"),
        form: document.getElementById("employeeForm"),
        name: document.getElementById("employeeName"),
        phone: document.getElementById("employeePhone"),
        address: document.getElementById("employeeAddress"),
        salary: document.getElementById("employeeSalary"),
        education: document.getElementById("employeeEducation"),
        job: document.getElementById("employeeJobTitle"),
        hireDate: document.getElementById("employeeHireDate"),
        photo: document.getElementById("employeePhoto"),
        idPhoto: document.getElementById("employeeIdPhoto"),
        cv: document.getElementById("employeeCV"),
        photoPrev: document.getElementById("photoPreview"),
        photoImg: document.getElementById("photoPreviewImg"),
        idPrev: document.getElementById("idPhotoPreview"),
        idImg: document.getElementById("idPhotoPreviewImg"),
        saveBtn: document.getElementById("saveEmployeeBtn"),
        content: document.getElementById("pageContent"),
        loading: document.getElementById("loadingScreen"),
    };

async function checkFirstTimeAccess() {
    try {
        const passwordHash = await window.electronAPI.getPasswordHash();
        return !passwordHash || passwordHash === '';
    } catch (error) {
        console.error('Error checking first time access:', error);
        return true;
    }
}

async function promptCreatePassword() {
    const { value: password } = await Swal.fire({
        title: "إنشاء كلمة مرور جديدة",
        text: "هذه أول مرة تفتح فيها صفحة الموظفين. يرجى إنشاء كلمة مرور للوصول إلى هذه الصفحة.",
        html: `
            <div class="text-right mb-4">
                <p class="text-sm text-gray-600 mb-2">تعليمات كلمة المرور:</p>
                <ul class="text-xs text-gray-500 text-right">
                    <li>• يجب أن تكون 6 أحرف على الأقل</li>
                    <li>• يمكن استخدام الأحرف والأرقام والرموز</li>
                    <li>• احتفظ بكلمة المرور في مكان آمن</li>
                </ul>
            </div>
            <div class="relative mb-3">
                <input id="swal-input-pwd" type="password" class="swal2-input pr-10" placeholder="كلمة المرور الجديدة" autocapitalize="off" autocorrect="off" dir="rtl">
                <button type="button" id="togglePwd" class="absolute left-32 top-12 transform -translate-y-1/2 text-gray-500">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
            <div class="relative">
                <input id="swal-input-confirm" type="password" class="swal2-input pr-10" placeholder="تأكيد كلمة المرور" autocapitalize="off" autocorrect="off" dir="rtl">
                <button type="button" id="toggleConfirm" class="absolute left-32 top-12 transform -translate-y-1/2 text-gray-500">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `,
        showCancelButton: false,
        confirmButtonText: "إنشاء كلمة المرور",
        confirmButtonColor: "#34D399",
        allowOutsideClick: false,
        didOpen: () => {
            // Toggle password visibility for first input
            document.getElementById("togglePwd").addEventListener("click", () => {
                const input = document.getElementById("swal-input-pwd");
                const icon = document.getElementById("togglePwd").querySelector("i");
                if (input.type === "password") {
                    input.type = "text";
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                } else {
                    input.type = "password";
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            });

            // Toggle password visibility for confirm input
            document.getElementById("toggleConfirm").addEventListener("click", () => {
                const input = document.getElementById("swal-input-confirm");
                const icon = document.getElementById("toggleConfirm").querySelector("i");
                if (input.type === "password") {
                    input.type = "text";
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                } else {
                    input.type = "password";
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            });
        },
        preConfirm: () => {
            const password = document.getElementById("swal-input-pwd").value;
            const confirmPassword = document.getElementById("swal-input-confirm").value;
            
            if (!password) {
                Swal.showValidationMessage("كلمة المرور مطلوبة");
                return false;
            }
            
            if (password.length < 6) {
                Swal.showValidationMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                return false;
            }
            
            if (!confirmPassword) {
                Swal.showValidationMessage("تأكيد كلمة المرور مطلوب");
                return false;
            }
            
            if (password !== confirmPassword) {
                Swal.showValidationMessage("كلمتا المرور غير متطابقتين");
                return false;
            }
            
            return password;
        },
    });

    if (password) {
        try {
            await window.electronAPI.updatePasswordHash(password);
            await Swal.fire({
                title: "تم بنجاح!",
                text: "تم إنشاء كلمة المرور بنجاح. يمكنك الآن الوصول إلى صفحة الموظفين.",
                icon: "success",
                confirmButtonColor: "#34D399"
            });
            return true;
        } catch (error) {
            await Swal.fire({
                title: "خطأ!",
                text: "فشل في إنشاء كلمة المرور. يرجى المحاولة مرة أخرى.",
                icon: "error",
                confirmButtonColor: "#EF4444"
            });
            return false;
        }
    }
    
    return false;
}

async function promptPassword() {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
        const { value: password } = await Swal.fire({
            title: "تأمين الصفحة",
            text: "أدخل كلمة المرور للوصول إلى صفحة الموظفين",
            html: `
                <div class="text-right mb-3">
                    <p class="text-sm text-gray-600">كلمة المرور مطلوبة للوصول إلى بيانات الموظفين</p>
                </div>
                <div class="relative">
                    <input id="swal-input-pwd" type="password" class="swal2-input pr-10" placeholder="كلمة المرور" autocapitalize="off" autocorrect="off" dir="rtl">
                    <button type="button" id="togglePwd" class="absolute left-32 top-12 transform -translate-y-1/2 text-gray-500">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <div class="text-left mt-2">
                    <p class="text-xs text-gray-500">${maxAttempts - attempts} محاولات متبقية</p>
                </div>
            `,
            showCancelButton: true,
            cancelButtonText: "إلغاء",
            confirmButtonText: "تأكيد",
            confirmButtonColor: "#34D399",
            cancelButtonColor: "#EF4444",
            allowOutsideClick: false,
            didOpen: () => {
                document.getElementById("togglePwd").addEventListener("click", () => {
                    const input = document.getElementById("swal-input-pwd");
                    const icon = document.getElementById("togglePwd").querySelector("i");
                    if (input.type === "password") {
                        input.type = "text";
                        icon.classList.remove("fa-eye");
                        icon.classList.add("fa-eye-slash");
                    } else {
                        input.type = "password";
                        icon.classList.remove("fa-eye-slash");
                        icon.classList.add("fa-eye");
                    }
                });
            },
            preConfirm: () => {
                const password = document.getElementById("swal-input-pwd").value;
                if (!password) {
                    Swal.showValidationMessage("كلمة المرور مطلوبة");
                    return false;
                }
                return password;
            },
        });

        if (!password) {
            window.location.href = "index.html";
            return;
        }

        try {
            const storedHash = await window.electronAPI.getPasswordHash();
            if (sha256(password) === storedHash) {
                els.loading.style.display = "none";
                els.content.classList.remove("hidden-content");
                return;
            }
        } catch (error) {
            console.error('Error verifying password:', error);
        }

        attempts++;
        
        if (attempts < maxAttempts) {
            await Swal.fire({
                icon: "error",
                title: "كلمة المرور غير صحيحة",
                text: `كلمة المرور غير صحيحة. ${maxAttempts - attempts} محاولات متبقية.`,
                confirmButtonColor: "#EF4444"
            });
        } else {
            await Swal.fire({
                icon: "error",
                title: "تم الحظر",
                text: "نفدت المحاولات. سيتم توجيهك للصفحة الرئيسية.",
                confirmButtonColor: "#EF4444"
            });
            window.location.href = "index.html";
        }
    }
}
async function showChangePasswordModal() {
    const { value: newPassword } = await Swal.fire({
        title: "تغيير كلمة المرور",
        text: "أدخل كلمة المرور الجديدة لصفحة الموظفين",
        html: `
            <div class="text-right mb-4">
                <p class="text-sm text-gray-600 mb-2">تعليمات كلمة المرور الجديدة:</p>
                <ul class="text-xs text-gray-500 text-right">
                    <li>• يجب أن تكون 6 أحرف على الأقل</li>
                    <li>• يمكن استخدام الأحرف والأرقام والرموز</li>
                    <li>• احتفظ بكلمة المرور في مكان آمن</li>
                </ul>
            </div>
            <div class="relative mb-3">
                <input id="newPwd" type="password" class="swal2-input pr-10" placeholder="كلمة المرور الجديدة" required>
                <button type="button" id="toggleNewPwd" class="absolute left-32 top-12 transform -translate-y-1/2 text-gray-500">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
            <div class="relative">
                <input id="confirmPwd" type="password" class="swal2-input pr-10" placeholder="تأكيد كلمة المرور" required>
                <button type="button" id="toggleConfirmPwd" class="absolute left-32 top-12 transform -translate-y-1/2 text-gray-500">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: "حفظ",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#34D399",
        cancelButtonColor: "#6B7280",
        allowOutsideClick: false,
        didOpen: () => {
            document.getElementById("toggleNewPwd").addEventListener("click", () => {
                const input = document.getElementById("newPwd");
                const icon = document.getElementById("toggleNewPwd").querySelector("i");
                if (input.type === "password") {
                    input.type = "text";
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                } else {
                    input.type = "password";
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            });
            
            document.getElementById("toggleConfirmPwd").addEventListener("click", () => {
                const input = document.getElementById("confirmPwd");
                const icon = document.getElementById("toggleConfirmPwd").querySelector("i");
                if (input.type === "password") {
                    input.type = "text";
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                } else {
                    input.type = "password";
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            });
        },
        preConfirm: () => {
            const password = document.getElementById("newPwd").value;
            const confirmPassword = document.getElementById("confirmPwd").value;
            
            if (!password) {
                Swal.showValidationMessage("كلمة المرور الجديدة مطلوبة");
                return false;
            }
            
            if (password.length < 6) {
                Swal.showValidationMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
                return false;
            }
            
            if (!confirmPassword) {
                Swal.showValidationMessage("تأكيد كلمة المرور مطلوب");
                return false;
            }
            
            if (password !== confirmPassword) {
                Swal.showValidationMessage("كلمتا المرور غير متطابقتين");
                return false;
            }
            
            return password;
        },
    });
    
    if (newPassword) {
        try {
            await window.electronAPI.updatePasswordHash(newPassword);
            await Swal.fire({
                title: "تم بنجاح!",
                text: "تم تغيير كلمة المرور بنجاح",
                icon: "success",
                confirmButtonColor: "#34D399"
            });
        } catch (error) {
            await Swal.fire({
                title: "خطأ!",
                text: "فشل تغيير كلمة المرور. يرجى المحاولة مرة أخرى.",
                icon: "error",
                confirmButtonColor: "#EF4444"
            });
        }
    }
}
function handleFilePreview(e, t, n) {
    const o = e.target.files[0];
    if (o) {
        const e = new FileReader();
        (e.onload = (e) => {
            (t.src = e.target.result), n.classList.remove("hidden");
        }),
            e.readAsDataURL(o);
    } else n.classList.add("hidden");
}
function handleCVPreview(e) {
    const t = e.target.files[0],
        n = document.getElementById("cvPreview"),
        o = document.getElementById("cvFileName"),
        a = document.getElementById("viewPdfBtn");
    if (t) {
        n.classList.remove("hidden"), (o.textContent = t.name);
        const e = URL.createObjectURL(t);
        a.onclick = () => {
            window
                .open("", "_blank")
                .document.write(
                    `\n                <!DOCTYPE html>\n                <html>\n                <head>\n                    <title>معاينة السيرة الذاتية - ${t.name}</title>\n                    <style>\n                        body { margin: 0; padding: 0; }\n                        iframe { width: 100%; height: 100vh; border: none; }\n                        .toolbar { background: #f8f9fa; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; }\n                        .close-btn { background: #dc3545; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; }\n                    </style>\n                </head>\n                <body>\n                    <div class="toolbar">\n                        <button class="close-btn" onclick="window.close()"><i class="fas fa-times"></i> إغلاق</button>\n                    </div>\n                    <iframe src="${e}"></iframe>\n                    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js"><\/script>\n                </body>\n                </html>\n            `
                );
        };
    } else n.classList.add("hidden");
}
function cleanupFiles() {
    const e = els.cv;
    e.files.length > 0 && URL.revokeObjectURL(URL.createObjectURL(e.files[0]));
    const t = document.getElementById("cvDownloadLink");
    t?.href && URL.revokeObjectURL(t.href);
}
async function loadEmployees() {
    try {
        showLoading(!0), (employees = await window.electronAPI.getEmployees()), renderEmployees();
    } catch (e) {
        showError("فشل في تحميل الموظفين", e.message);
    } finally {
        showLoading(!1);
    }
}
async function getFileAsDataURL(e) {
    try {
        return (await window.electronAPI.readFileAsDataURL(e)) || "";
    } catch (e) {
        return "";
    }
}
async function renderEmployees() {
    if (!els.list) return;
    if (!employees.length) {
        els.list.innerHTML = `
            <div class="no-employees">
                <i class="fas fa-users-slash"></i>
                <p>لا يوجد موظفين مسجلين حالياً</p>
            </div>
        `;
        return;
    }

    const employeeCards = await Promise.all(
        employees.map(async (e) => {
            const photo = e.photo ? await getFileAsDataURL(e.photo) : defaultPhoto;
            const idPhoto = e.idPhoto ? await getFileAsDataURL(e.idPhoto) : "";
            const cv = e.cv ? await getFileAsDataURL(e.cv) : "";
             // تسجيل الملفات
            return `
                <div class="employee-card">
                    <div class="flex items-center gap-4 mb-4">
                        <img src="${photo}" class="employee-photo" alt="صورة الموظف" onerror="this.src='${defaultPhoto}'">
                        <div>
                            <h3 class="employee-name">${e.name}</h3>
                            <div class="employee-detail"><i class="fas fa-briefcase"></i><span>${e.jobTitle}</span></div>
                            <div class="employee-detail"><i class="fas fa-money-bill-wave"></i><span>${formatSalary(e.salary)}</span></div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="employee-detail"><i class="fas fa-phone"></i><span>${e.phone || "غير متوفر"}</span></div>
                        <div class="employee-detail"><i class="fas fa-map-marker-alt"></i><span>${e.address || "غير متوفر"}</span></div>
                        <div class="employee-detail"><i class="fas fa-graduation-cap"></i><span>${e.education || "غير متوفر"}</span></div>
                        <div class="employee-detail"><i class="fas fa-calendar-alt"></i><span>${formatDate(e.hireDate)}</span></div>
                        <div class="employee-detail"><i class="fas fa-id-card"></i>
                            ${idPhoto ? `<a href="#" onclick="showFileInNewWindow('${idPhoto}', 'image')" class="text-blue-500 hover:underline">عرض صورة البطاقة</a>` : "<span>غير متوفر</span>"}
                        </div>
                        <div class="employee-detail"><i class="fas fa-file-pdf"></i>
                            ${cv ? `<a href="#" onclick="showFileInNewWindow('${cv}', 'pdf')" class="text-blue-500 hover:underline">عرض السيرة الذاتية</a>` : "<span>غير متوفر</span>"}
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button onclick="openEditEmployeeModal('${e._id}')" class="btn btn-warning"><i class="fas fa-edit"></i> تعديل</button>
                        <button onclick="confirmDeleteEmployee('${e._id}')" class="btn btn-error text-white"><i class="fas fa-trash"></i> حذف</button>
                    </div>
                </div>
            `;
        })
    );
    els.list.innerHTML = employeeCards.join("");
}
function showFileInNewWindow(e, t) {
    const n = window.open("", "_blank");
    if (n) {
        if ("image" === t)
            n.document.write(
                `\n            <!DOCTYPE html>\n            <html>\n            <head>\n                <title>عرض صورة البطاقة</title>\n                <style>\n                    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; }\n                    img { max-width: 100%; max-height: 100%; }\n                    .toolbar { position: fixed; top: 0; width: 100%; background: #f8f9fa; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; }\n                    .close-btn { background: #dc3545; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; }\n                </style>\n            </head>\n            <body>\n                <div class="toolbar">\n                    <button class="close-btn" onclick="window.close()"><i class="fas fa-times"></i> إغلاق</button>\n                </div>\n                <img src="${e}" alt="صورة البطاقة">\n                <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js"><\/script>\n            </body>\n            </html>\n        `
            );
        else if ("pdf" === t)
            try {
                const t = atob(e.split(",")[1]),
                    o = e.split(",")[0].split(":")[1].split(";")[0],
                    a = new ArrayBuffer(t.length),
                    s = new Uint8Array(a);
                for (let e = 0; e < t.length; e++) s[e] = t.charCodeAt(e);
                const l = new Blob([a], { type: o }),
                    i = URL.createObjectURL(l);
                n.document.write(
                    `\n                <!DOCTYPE html>\n                <html>\n                <head>\n                    <title>عرض السيرة الذاتية</title>\n                    <style>\n                        body { margin: 0; padding: 0; }\n                        iframe { width: 100%; height: 100vh; border: none; }\n                        .toolbar { background: #f8f9fa; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; }\n                        .close-btn { background: #dc3545; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; }\n                    </style>\n                </head>\n                <body>\n                    <div class="toolbar">\n                        <button class="close-btn" onclick="window.close(); URL.revokeObjectURL('${i}');"><i class="fas fa-times"></i> إغلاق</button>\n                    </div>\n                    <iframe src="${i}"></iframe>\n                    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js"><\/script>\n                </body>\n                </html>\n            `
                ),
                    (n.onbeforeunload = () => URL.revokeObjectURL(i));
            } catch (e) {
                n.document.write(
                    `\n                <!DOCTYPE html>\n                <html>\n                <head>\n                    <title>خطأ</title>\n                    <style>\n                        body { margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif; }\n                        .toolbar { background: #f8f9fa; padding: 10px; text-align: center; border-bottom: 1px solid #ddd; }\n                        .close-btn { background: #dc3545; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; }\n                    </style>\n                </head>\n                <body>\n                    <div class="toolbar">\n                        <button class="close-btn" onclick="window.close()"><i class="fas fa-times"></i> إغلاق</button>\n                    </div>\n                    <p>فشل في عرض الملف: ${e.message}</p>\n                    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js"><\/script>\n                </body>\n                </html>\n            `
                );
            }
    } else alert("يرجى السماح بفتح النوافذ المنبثقة لهذا الموقع.");
}
function formatSalary(e) {
    return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(e);
}
function formatDate(e) {
    return new Date(e).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}
async function openEditEmployeeModal(e) {
    const t = employees.find((t) => t._id === e);
    if (t) {
        if (
            ((editingEmployeeId = e),
            (els.name.value = t.name),
            (els.phone.value = t.phone),
            (els.address.value = t.address),
            (els.salary.value = t.salary),
            (els.education.value = t.education),
            (els.job.value = t.jobTitle),
            (els.hireDate.value = t.hireDate.split("T")[0]),
            t.photo)
        ) {
            const e = await getFileAsDataURL(t.photo);
            e ? ((els.photoImg.src = e), els.photoPrev.classList.remove("hidden")) : ((els.photoImg.src = defaultPhoto), els.photoPrev.classList.remove("hidden"));
        }
        if (t.idPhoto) {
            const e = await getFileAsDataURL(t.idPhoto);
            e ? ((els.idImg.src = e), els.idPrev.classList.remove("hidden")) : ((els.idImg.src = ""), els.idPrev.classList.add("hidden"));
        }
    }
}
function resetForm() {
    els.form?.reset(), els.photoPrev.classList.add("hidden"), els.idPrev.classList.add("hidden"), (els.photoImg.src = ""), (els.idImg.src = ""), (editingEmployeeId = null);
}
async function saveEmployee() {
    const e = {
        name: els.name.value.trim(),
        phone: els.phone.value.trim(),
        address: els.address.value.trim(),
        salary: parseFloat(els.salary.value),
        education: els.education.value.trim(),
        jobTitle: els.job.value.trim(),
        hireDate: els.hireDate.value,
    };
    if (!e.name || !e.phone || !e.address || isNaN(e.salary) || e.salary <= 0 || !e.education || !e.jobTitle || !e.hireDate) return showError("خطأ في الإدخال", "يرجى ملء جميع الحقول المطلوبة بشكل صحيح.");
    if (!(editingEmployeeId || (els.photo.files[0] && els.idPhoto.files[0]))) return showError("خطأ في الإدخال", "صورة الموظف وصورة البطاقة مطلوبة عند إضافة موظف جديد.");
    try {
        showLoading(!0), (els.saveBtn.disabled = !0);
        const [t, n, o] = await Promise.all([uploadFileIfExists(els.photo, "employees/photos"), uploadFileIfExists(els.idPhoto, "employees/id_photos"), uploadFileIfExists(els.cv, "employees/cvs")]),
            a = {
                ...e,
                photo: t || (editingEmployeeId ? employees.find((e) => e._id === editingEmployeeId)?.photo : ""),
                idPhoto: n || (editingEmployeeId ? employees.find((e) => e._id === editingEmployeeId)?.idPhoto : ""),
                cv: o || (editingEmployeeId ? employees.find((e) => e._id === editingEmployeeId)?.cv : ""),
            };
        editingEmployeeId
            ? (await window.electronAPI.updateEmployee(editingEmployeeId, a), Swal.fire({ title: "تم بنجاح!", text: "تم تحديث بيانات الموظف بنجاح", icon: "success", confirmButtonColor: "#34D399" }))
            : (await window.electronAPI.addEmployee(a), showSuccess("تم إضافة الموظف بنجاح")),
            resetForm(),
            loadEmployees();
    } catch (e) {
        showError("فشل في حفظ الموظف", e.message || "حدث خطأ غير متوقع");
    } finally {
        showLoading(!1), (els.saveBtn.disabled = !1);
    }
}
async function uploadFileIfExists(e, t) {
    if (!e.files[0]) return "";
    const n = e.files[0];
    try {
        return (await window.electronAPI.uploadFile({ arrayBuffer: await n.arrayBuffer(), name: n.name }, t)) || "";
    } catch (e) {
        return "";
    }
}
async function confirmDeleteEmployee(e) {
    if (
        await Swal.fire({
            title: "هل أنت متأكد؟",
            text: "سيتم حذف الموظف نهائيًا!",
            icon: "warning",
            showCancelButton: !0,
            confirmButtonText: "نعم، احذفه!",
            cancelButtonText: "إلغاء",
            confirmButtonColor: "#EF4444",
            cancelButtonColor: "#6B7280",
            reverseButtons: !0,
        }).then((e) => e.isConfirmed)
    )
        try {
            showLoading(!0), await window.electronAPI.deleteEmployee(e), showSuccess("تم حذف الموظف بنجاح"), loadEmployees();
        } catch (e) {
            showError("فشل في حذف الموظف", e.message);
        } finally {
            showLoading(!1);
        }
}
function showLoading(e) {
    e ? Swal.fire({ title: "جاري المعالجة...", allowOutsideClick: !1, didOpen: () => Swal.showLoading() }) : Swal.close();
}
function showSuccess(e) {
    Swal.fire({ title: "تم بنجاح!", text: e, icon: "success", confirmButtonColor: "#34D399" });
}
function showError(e, t) {
    Swal.fire({ title: e, text: t, icon: "error", confirmButtonColor: "#EF4444" });
}
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Check if this is the first time accessing the page
        const isFirstTime = await checkFirstTimeAccess();
        
        if (isFirstTime) {
            // First time access - prompt to create password
            const passwordCreated = await promptCreatePassword();
            if (!passwordCreated) {
                window.location.href = "index.html";
                return;
            }
        } else {
            // Not first time - prompt for existing password
            await promptPassword();
        }
        
        // Set up event listeners
        els.form?.addEventListener("submit", (e) => {
            e.preventDefault();
            saveEmployee();
        });
        
        els.photo?.addEventListener("change", (e) => handleFilePreview(e, els.photoImg, els.photoPrev));
        els.idPhoto?.addEventListener("change", (e) => handleFilePreview(e, els.idImg, els.idPrev));
        els.cv?.addEventListener("change", handleCVPreview);
        
        window.addEventListener("beforeunload", cleanupFiles);
        
        document.getElementById("changePasswordBtn")?.addEventListener("click", showChangePasswordModal);
        
        // Load employees data
        await loadEmployees();
        
    } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
        await Swal.fire({
            title: "خطأ!",
            text: "حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.",
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
        window.location.href = "index.html";
    }
}),
    (window.openEditEmployeeModal = openEditEmployeeModal),
    (window.resetForm = resetForm),
    (window.saveEmployee = saveEmployee),
    (window.confirmDeleteEmployee = confirmDeleteEmployee),
    (window.showChangePasswordModal = showChangePasswordModal),
    (window.showFileInNewWindow = showFileInNewWindow);
