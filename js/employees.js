let employees = [];
let currentSearchQuery = "";
let editingEmployeeId = null;
const defaultPhoto = "../assets/images/avatar.png";

const els = {
    list: document.getElementById("employeesList"),
    modal: document.getElementById("employeeModal"),
    form: document.getElementById("employeeForm"),
    formTitle: document.getElementById("formTitle"),
    modalIcon: document.getElementById("modalIcon"),
    editingId: document.getElementById("editingEmployeeId"),
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
    photoDropzone: document.getElementById("photoDropzone"),
    idPhotoDropzone: document.getElementById("idPhotoDropzone"),
    cvDropzone: document.getElementById("cvDropzone"),
    photoPrev: document.getElementById("photoPreview"),
    photoImg: document.getElementById("photoPreviewImg"),
    idPrev: document.getElementById("idPhotoPreview"),
    idImg: document.getElementById("idPhotoPreviewImg"),
    cvPrev: document.getElementById("cvPreview"),
    cvFileName: document.getElementById("cvFileName"),
    saveBtn: document.getElementById("saveEmployeeBtn"),
    content: document.getElementById("pageContent"),
    loading: document.getElementById("loadingScreen"),
    totalEmployeesCount: document.getElementById("totalEmployeesCount"),
    totalSalariesSum: document.getElementById("totalSalariesSum"),
    searchInput: document.getElementById("searchEmployeeInput"),
};

// State to track if files were explicitly removed during edit
let removedFiles = {
    photo: false,
    idPhoto: false,
    cv: false
};

/* ==========================================================================
   Security & Password Access Verification (Custom Modal Implementation)
   ========================================================================== */
let passwordResolveCallback = null;
let createPasswordResolveCallback = null;
let securityAttempts = 0;
const maxSecurityAttempts = 3;

async function checkFirstTimeAccess() {
    try {
        const passwordHash = await window.electronAPI.getPasswordHash();
        return !passwordHash || passwordHash === "";
    } catch (error) {
        console.error("Error checking first time access:", error);
        return true;
    }
}

function promptCreatePassword() {
    return new Promise((resolve) => {
        createPasswordResolveCallback = resolve;
        if (els.loading) els.loading.style.display = "none";

        const modal = document.getElementById("createPasswordModal");
        const pwdInput = document.getElementById("createPwdInput");
        const confirmInput = document.getElementById("createPwdConfirmInput");
        const errorAlert = document.getElementById("createPwdErrorMsg");

        if (pwdInput) pwdInput.value = "";
        if (confirmInput) confirmInput.value = "";
        if (errorAlert) {
            errorAlert.classList.add("hidden");
            errorAlert.textContent = "";
        }

        if (modal) {
            modal.classList.add("open");
            setTimeout(() => {
                if (pwdInput) pwdInput.focus();
            }, 150);
        }
    });
}

async function submitCreatePassword() {
    const pwdInput = document.getElementById("createPwdInput");
    const confirmInput = document.getElementById("createPwdConfirmInput");
    const errorAlert = document.getElementById("createPwdErrorMsg");
    const modal = document.getElementById("createPasswordModal");

    const pwd = pwdInput ? pwdInput.value.trim() : "";
    const confirm = confirmInput ? confirmInput.value.trim() : "";

    if (!pwd || pwd.length < 6) {
        if (errorAlert) {
            errorAlert.innerHTML = '<i class="fas fa-circle-exclamation"></i> يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل';
            errorAlert.classList.remove("hidden");
        }
        if (pwdInput) pwdInput.focus();
        return;
    }

    if (pwd !== confirm) {
        if (errorAlert) {
            errorAlert.innerHTML = '<i class="fas fa-circle-exclamation"></i> كلمتا المرور غير متطابقتين';
            errorAlert.classList.remove("hidden");
        }
        if (confirmInput) confirmInput.focus();
        return;
    }

    try {
        await window.electronAPI.updatePasswordHash(pwd);
        if (modal) modal.classList.remove("open");
        
        await Swal.fire({
            title: "تم الحفظ وتأمين الصفحة!",
            text: "تم إنشاء كلمة المرور بنجاح. مرحباً بك في صفحة الموظفين.",
            icon: "success",
            confirmButtonColor: "#6d28d9",
            confirmButtonText: "متابعة"
        });

        if (createPasswordResolveCallback) createPasswordResolveCallback(true);
    } catch (err) {
        console.error("Error saving new password:", err);
        if (errorAlert) {
            errorAlert.innerHTML = '<i class="fas fa-circle-exclamation"></i> تعذر حفظ كلمة المرور، يرجى المحاولة مرة أخرى.';
            errorAlert.classList.remove("hidden");
        }
    }
}

function promptPassword() {
    return new Promise((resolve) => {
        passwordResolveCallback = resolve;
        if (els.loading) els.loading.style.display = "none";
        
        const modal = document.getElementById("securityPasswordModal");
        const input = document.getElementById("securityPasswordInput");
        const errorAlert = document.getElementById("securityErrorMsg");
        const attemptsText = document.getElementById("pwdAttemptsCountText");
        const attemptsBadge = document.getElementById("pwdAttemptsBadge");
        
        securityAttempts = 0;
        if (input) input.value = "";
        if (errorAlert) {
            errorAlert.classList.add("hidden");
            errorAlert.textContent = "";
        }
        if (attemptsText) attemptsText.textContent = `${maxSecurityAttempts} محاولات متبقية`;
        if (attemptsBadge) attemptsBadge.classList.remove("danger");

        if (modal) {
            modal.classList.add("open");
            setTimeout(() => {
                if (input) input.focus();
            }, 150);
        }
    });
}

async function submitSecurityPassword() {
    const input = document.getElementById("securityPasswordInput");
    const errorAlert = document.getElementById("securityErrorMsg");
    const attemptsText = document.getElementById("pwdAttemptsCountText");
    const attemptsBadge = document.getElementById("pwdAttemptsBadge");
    const modal = document.getElementById("securityPasswordModal");

    const pwd = input ? input.value.trim() : "";
    if (!pwd) {
        if (errorAlert) {
            errorAlert.innerHTML = '<i class="fas fa-circle-exclamation"></i> يرجى إدخال كلمة المرور';
            errorAlert.classList.remove("hidden");
        }
        if (input) input.focus();
        return;
    }

    try {
        const storedHash = await window.electronAPI.getPasswordHash();
        if (sha256(pwd) === storedHash) {
            if (modal) modal.classList.remove("open");
            if (els.content) els.content.classList.remove("hidden-content");
            if (passwordResolveCallback) passwordResolveCallback(true);
            return;
        }
    } catch (err) {
        console.error("Error verifying password:", err);
    }

    securityAttempts++;
    const remaining = maxSecurityAttempts - securityAttempts;

    if (remaining > 0) {
        if (errorAlert) {
            errorAlert.innerHTML = `<i class="fas fa-triangle-exclamation"></i> كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.`;
            errorAlert.classList.remove("hidden");
        }
        if (attemptsText) attemptsText.textContent = `${remaining} محاولات متبقية`;
        if (attemptsBadge) attemptsBadge.classList.add("danger");
        if (input) {
            input.value = "";
            input.focus();
        }
    } else {
        if (modal) modal.classList.remove("open");
        await Swal.fire({
            icon: "error",
            title: "تم استنفاد المحاولات",
            text: "تم إدخال كلمة المرور بشكل غير صحيح 3 مرات. سيتم توجيهك للصفحة الرئيسية.",
            confirmButtonColor: "#EF4444",
            confirmButtonText: "حسناً"
        });
        window.location.href = "index.html";
    }
}

function cancelSecurityAccess() {
    window.location.href = "index.html";
}

function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btnEl ? btnEl.querySelector("i") : null;

    if (input.type === "password") {
        input.type = "text";
        if (icon) {
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        }
    } else {
        input.type = "password";
        if (icon) {
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }
}

function showChangePasswordModal() {
    const modal = document.getElementById("changePasswordModal");
    const currentInput = document.getElementById("changeCurrentPwdInput");
    const newInput = document.getElementById("changeNewPwdInput");
    const confirmInput = document.getElementById("changeConfirmPwdInput");
    const errorAlert = document.getElementById("changePwdErrorMsg");

    if (currentInput) currentInput.value = "";
    if (newInput) newInput.value = "";
    if (confirmInput) confirmInput.value = "";
    if (errorAlert) {
        errorAlert.classList.add("hidden");
        errorAlert.textContent = "";
    }

    if (modal) {
        modal.classList.add("open");
        setTimeout(() => {
            if (currentInput) currentInput.focus();
        }, 150);
    }
}

function closeChangePasswordModal() {
    const modal = document.getElementById("changePasswordModal");
    if (modal) modal.classList.remove("open");
}

function handleChangePasswordOverlayClick(e) {
    if (e.target === document.getElementById("changePasswordModal")) {
        closeChangePasswordModal();
    }
}

async function submitChangePassword() {
    const currentInput = document.getElementById("changeCurrentPwdInput");
    const newInput = document.getElementById("changeNewPwdInput");
    const confirmInput = document.getElementById("changeConfirmPwdInput");
    const errorAlert = document.getElementById("changePwdErrorMsg");
    const modal = document.getElementById("changePasswordModal");

    const currentPwd = currentInput ? currentInput.value.trim() : "";
    const newPwd = newInput ? newInput.value.trim() : "";
    const confirmPwd = confirmInput ? confirmInput.value.trim() : "";

    try {
        const storedHash = await window.electronAPI.getPasswordHash();
        if (sha256(currentPwd) !== storedHash) {
            if (errorAlert) {
                errorAlert.innerHTML = '<i class="fas fa-circle-exclamation"></i> كلمة المرور الحالية غير صحيحة';
                errorAlert.classList.remove("hidden");
            }
            if (currentInput) currentInput.focus();
            return;
        }

        if (!newPwd || newPwd.length < 6) {
            if (errorAlert) {
                errorAlert.innerHTML = '<i class="fas fa-circle-exclamation"></i> كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام';
                errorAlert.classList.remove("hidden");
            }
            if (newInput) newInput.focus();
            return;
        }

        if (newPwd !== confirmPwd) {
            if (errorAlert) {
                errorAlert.innerHTML = '<i class="fas fa-circle-exclamation"></i> كلمتا المرور غير متطابقتين';
                errorAlert.classList.remove("hidden");
            }
            if (confirmInput) confirmInput.focus();
            return;
        }

        await window.electronAPI.updatePasswordHash(newPwd);
        if (modal) modal.classList.remove("open");

        Swal.fire({
            title: "تم التغيير بنجاح",
            text: "تم تغيير كلمة مرور صفحة الموظفين بنجاح.",
            icon: "success",
            confirmButtonColor: "#059669",
            confirmButtonText: "حسناً"
        });
    } catch (err) {
        console.error("Error changing password:", err);
        if (errorAlert) {
            errorAlert.innerHTML = '<i class="fas fa-circle-exclamation"></i> حدث خطأ أثناء تغيير كلمة المرور، يرجى المحاولة لاحقاً.';
            errorAlert.classList.remove("hidden");
        }
    }
}

/* ==========================================================================
   Data Loading & Calculations
   ========================================================================== */
async function loadEmployees() {
    try {
        employees = await window.electronAPI.getEmployees();
        if (!Array.isArray(employees)) employees = [];
        updateHeaderStats();
        applyFilterAndRender();
    } catch (e) {
        showError("فشل في تحميل الموظفين", e.message);
    }
}

function updateHeaderStats() {
    const totalCount = employees.length;
    const totalSalaries = employees.reduce((sum, emp) => sum + (parseFloat(emp.salary) || 0), 0);

    if (els.totalEmployeesCount) {
        els.totalEmployeesCount.textContent = `${totalCount} موظف`;
        els.totalEmployeesCount.title = `إجمالي عدد الموظفين: ${totalCount} موظف`;
    }
    if (els.totalSalariesSum) {
        const formatted = formatSalary(totalSalaries);
        els.totalSalariesSum.textContent = formatted;
        els.totalSalariesSum.title = `إجمالي الرواتب: ${totalSalaries.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} جنيه مصري`;
    }
}

async function getFileAsDataURL(filePath) {
    if (!filePath) return "";
    try {
        return (await window.electronAPI.readFileAsDataURL(filePath)) || "";
    } catch (e) {
        console.warn("Could not read file data URL:", filePath, e);
        return "";
    }
}

function formatSalary(amount) {
    const val = parseFloat(amount) || 0;
    const isInteger = val % 1 === 0;
    const formattedNum = new Intl.NumberFormat("ar-EG", {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: 2
    }).format(val);
    return `${formattedNum} ج.م`;
}

function formatDate(dateStr) {
    if (!dateStr) return "غير محدد";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    } catch {
        return dateStr;
    }
}

/* ==========================================================================
   Rendering Employee Cards
   ========================================================================== */
function handleEmployeeSearch(query) {
    currentSearchQuery = (query || "").trim().toLowerCase();
    applyFilterAndRender();
}

function applyFilterAndRender() {
    let list = employees;
    if (currentSearchQuery) {
        list = employees.filter(emp => {
            const name = (emp.name || "").toLowerCase();
            const phone = (emp.phone || "").toLowerCase();
            const job = (emp.jobTitle || "").toLowerCase();
            const address = (emp.address || "").toLowerCase();
            return name.includes(currentSearchQuery) ||
                   phone.includes(currentSearchQuery) ||
                   job.includes(currentSearchQuery) ||
                   address.includes(currentSearchQuery);
        });
    }
    renderEmployeesList(list);
}

async function renderEmployeesList(listToRender) {
    if (!els.list) return;

    if (!listToRender.length) {
        if (currentSearchQuery) {
            els.list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon-wrap"><i class="fas fa-search"></i></div>
                    <h3>لا توجد نتائج بحث مطابقة</h3>
                    <p>لم يتم العثور على أي موظف يطابق "${escapeHTML(currentSearchQuery)}"</p>
                    <button onclick="clearSearch()" class="add-first-btn">
                        <i class="fas fa-times"></i> مسح البحث
                    </button>
                </div>
            `;
        } else {
            els.list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon-wrap"><i class="fas fa-users-slash"></i></div>
                    <h3>لا يوجد موظفين مسجلين حالياً</h3>
                    <p>ابدأ بإضافة موظف جديد لتنظيم فريق العمل ومتابعة الرواتب</p>
                    <button onclick="openAddEmployeeModal()" class="add-first-btn">
                        <i class="fas fa-user-plus"></i> إضافة أول موظف
                    </button>
                </div>
            `;
        }
        return;
    }

    const cardsHtml = await Promise.all(
        listToRender.map(async (emp) => {
            const photoUrl = emp.photo ? await getFileAsDataURL(emp.photo) : defaultPhoto;
            const hasIdPhoto = Boolean(emp.idPhoto);
            const hasCV = Boolean(emp.cv);

            return `
                <div class="employee-card" id="employee-${emp._id}">
                    <!-- Card Top -->
                    <div class="employee-card-top">
                        <div class="employee-avatar-wrap">
                            <img src="${photoUrl || defaultPhoto}" class="employee-avatar" alt="${escapeHTML(emp.name)}" onerror="this.src='${defaultPhoto}'">
                        </div>
                        <div class="employee-meta">
                            <h3 class="employee-name" title="${escapeHTML(emp.name)}">${escapeHTML(emp.name)}</h3>
                            <div class="employee-badges">
                                <span class="job-badge">
                                    <i class="fas fa-briefcase"></i>
                                    ${escapeHTML(emp.jobTitle || 'موظف')}
                                </span>
                                <span class="salary-badge">
                                    <i class="fas fa-money-bill-wave"></i>
                                    ${formatSalary(emp.salary)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Details Rows -->
                    <div class="employee-details">
                        <div class="detail-row" title="رقم الهاتف">
                            <i class="fas fa-phone-alt"></i>
                            <span>${escapeHTML(emp.phone || 'غير متوفر')}</span>
                        </div>
                        <div class="detail-row" title="العنوان">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${escapeHTML(emp.address || 'غير متوفر')}</span>
                        </div>
                        <div class="detail-row" title="المؤهل الدراسي">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${escapeHTML(emp.education || 'غير متوفر')}</span>
                        </div>
                        <div class="detail-row" title="تاريخ التعيين">
                            <i class="fas fa-calendar-check"></i>
                            <span>${formatDate(emp.hireDate)}</span>
                        </div>
                    </div>

                    <!-- Documents Preview Buttons -->
                    <div class="employee-docs">
                        ${hasIdPhoto 
                            ? `<button type="button" class="doc-btn doc-btn-id" onclick="viewEmployeeDocument('${emp._id}', 'idPhoto')" title="عرض صورة البطاقة الشخصية">
                                <i class="fas fa-id-card"></i> صورة البطاقة
                               </button>`
                            : `<span class="doc-btn doc-btn-disabled" title="لم يتم رفع صورة البطاقة">
                                <i class="fas fa-id-card"></i> بدون بطاقة
                               </span>`
                        }

                        ${hasCV 
                            ? `<button type="button" class="doc-btn doc-btn-cv" onclick="viewEmployeeDocument('${emp._id}', 'cv')" title="عرض ملف السيرة الذاتية">
                                <i class="fas fa-file-pdf"></i> السيرة الذاتية
                               </button>`
                            : `<span class="doc-btn doc-btn-disabled" title="لم يتم رفع السيرة الذاتية">
                                <i class="fas fa-file-pdf"></i> بدون CV
                               </span>`
                        }
                    </div>

                    <!-- Card Actions -->
                    <div class="employee-card-actions">
                        <button type="button" class="btn-card-edit" onclick="openEditEmployeeModal('${emp._id}')">
                            <i class="fas fa-edit"></i> تعديل البيانات
                        </button>
                        <button type="button" class="btn-card-delete" onclick="confirmDeleteEmployee('${emp._id}')" title="حذف الموظف">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        })
    );

    els.list.innerHTML = cardsHtml.join("");
}

function clearSearch() {
    if (els.searchInput) {
        els.searchInput.value = "";
    }
    currentSearchQuery = "";
    applyFilterAndRender();
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
   Document & Image Viewing
   ========================================================================== */
async function viewEmployeeDocument(employeeId, docType) {
    const emp = employees.find(e => e._id === employeeId);
    if (!emp) return;

    try {
        if (docType === "idPhoto" && emp.idPhoto) {
            showLoading(true);
            const dataUrl = await getFileAsDataURL(emp.idPhoto);
            showLoading(false);
            if (dataUrl) {
                showFileInNewWindow(dataUrl, "image", `صورة بطاقة الموظف - ${emp.name}`);
            } else {
                showError("تنبيه", "تعذر قراءة ملف صورة البطاقة.");
            }
        } else if (docType === "cv" && emp.cv) {
            showLoading(true);
            const dataUrl = await getFileAsDataURL(emp.cv);
            showLoading(false);
            if (dataUrl) {
                showFileInNewWindow(dataUrl, "pdf", `السيرة الذاتية - ${emp.name}`);
            } else {
                showError("تنبيه", "تعذر قراءة ملف السيرة الذاتية.");
            }
        }
    } catch (err) {
        showLoading(false);
        showError("تنبيه", "حدث خطأ أثناء فتح الملف: " + err.message);
    }
}

function showFileInNewWindow(dataUrl, type, title = "معاينة الملف") {
    const win = window.open("", "_blank");
    if (!win) {
        Swal.fire({
            title: "تنبيه",
            text: "يرجى السماح بالنوافذ المنبثقة لعرض الملف.",
            icon: "warning",
            confirmButtonColor: "#6d28d9"
        });
        return;
    }

    if (type === "image") {
        win.document.write(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>${escapeHTML(title)}</title>
                <style>
                    body { margin: 0; padding: 0; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Tajawal', sans-serif; }
                    .toolbar { position: fixed; top: 0; left: 0; right: 0; background: rgba(30, 41, 59, 0.95); backdrop-filter: blur(8px); padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 10; }
                    .title { color: #f8fafc; font-weight: 700; font-size: 1.1rem; }
                    .close-btn { background: #ef4444; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.9rem; }
                    .close-btn:hover { background: #dc2626; }
                    .img-container { padding: 80px 20px 20px; display: flex; align-items: center; justify-content: center; max-width: 100%; box-sizing: border-box; }
                    img { max-width: 90vw; max-height: 82vh; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); object-fit: contain; }
                </style>
            </head>
            <body>
                <div class="toolbar">
                    <span class="title">${escapeHTML(title)}</span>
                    <button class="close-btn" onclick="window.close()">✕ إغلاق</button>
                </div>
                <div class="img-container">
                    <img src="${dataUrl}" alt="${escapeHTML(title)}">
                </div>
            </body>
            </html>
        `);
    } else if (type === "pdf") {
        try {
            const byteString = atob(dataUrl.split(",")[1]);
            const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const blobUrl = URL.createObjectURL(blob);

            win.document.write(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>${escapeHTML(title)}</title>
                    <style>
                        body { margin: 0; padding: 0; background: #1e293b; font-family: 'Tajawal', sans-serif; }
                        .toolbar { height: 50px; background: #0f172a; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); }
                        .title { color: #f8fafc; font-weight: 700; font-size: 1rem; }
                        .close-btn { background: #ef4444; color: white; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-weight: 700; }
                        .close-btn:hover { background: #dc2626; }
                        iframe { width: 100%; height: calc(100vh - 50px); border: none; }
                    </style>
                </head>
                <body>
                    <div class="toolbar">
                        <span class="title">${escapeHTML(title)}</span>
                        <button class="close-btn" onclick="window.close(); URL.revokeObjectURL('${blobUrl}');">✕ إغلاق</button>
                    </div>
                    <iframe src="${blobUrl}"></iframe>
                </body>
                </html>
            `);
            win.onbeforeunload = () => URL.revokeObjectURL(blobUrl);
        } catch (e) {
            win.document.write(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head><title>خطأ في عرض الملف</title></head>
                <body style="font-family:sans-serif; text-align:center; padding:40px;">
                    <h3>تعذر فك تشفير ملف الـ PDF: ${escapeHTML(e.message)}</h3>
                    <button onclick="window.close()">إغلاق</button>
                </body>
                </html>
            `);
        }
    }
}

/* ==========================================================================
   Modal Operations (Add / Edit / Close)
   ========================================================================== */
function openAddEmployeeModal() {
    editingEmployeeId = null;
    resetForm();

    els.formTitle.textContent = "إضافة موظف جديد";
    if (els.modalIcon) {
        els.modalIcon.innerHTML = `<i class="fas fa-user-plus"></i>`;
    }

    // Set today's date as default hire date
    if (els.hireDate && !els.hireDate.value) {
        els.hireDate.value = new Date().toISOString().split("T")[0];
    }

    els.modal.classList.add("open");
    document.body.classList.add("modal-open-lock");
    setTimeout(() => els.name && els.name.focus(), 200);
}

async function openEditEmployeeModal(employeeId) {
    const emp = employees.find(e => e._id === employeeId);
    if (!emp) return;

    editingEmployeeId = employeeId;
    resetForm();
    els.editingId.value = employeeId;

    els.formTitle.textContent = "تعديل بيانات الموظف";
    if (els.modalIcon) {
        els.modalIcon.innerHTML = `<i class="fas fa-user-edit"></i>`;
    }

    els.name.value = emp.name || "";
    els.phone.value = emp.phone || "";
    els.address.value = emp.address || "";
    els.salary.value = emp.salary || "";
    els.education.value = emp.education || "";
    els.job.value = emp.jobTitle || "";
    if (emp.hireDate) {
        els.hireDate.value = emp.hireDate.split("T")[0];
    }

    // Load existing previews if files exist
    if (emp.photo) {
        const photoData = await getFileAsDataURL(emp.photo);
        if (photoData) {
            els.photoImg.src = photoData;
            els.photoPrev.classList.remove("hidden");
            els.photoDropzone.classList.add("hidden");
        }
    }

    if (emp.idPhoto) {
        const idData = await getFileAsDataURL(emp.idPhoto);
        if (idData) {
            els.idImg.src = idData;
            els.idPrev.classList.remove("hidden");
            els.idPhotoDropzone.classList.add("hidden");
        }
    }

    if (emp.cv) {
        const fileName = emp.cv.split("/").pop().split("\\").pop();
        els.cvFileName.textContent = fileName || "ملف السيرة الذاتية";
        els.cvPrev.classList.remove("hidden");
        els.cvDropzone.classList.add("hidden");
    }

    els.modal.classList.add("open");
    document.body.classList.add("modal-open-lock");
    setTimeout(() => els.name && els.name.focus(), 200);
}

function closeEmployeeModal() {
    els.modal.classList.remove("open");
    document.body.classList.remove("modal-open-lock");
    resetForm();
}

function handleModalOverlayClick(e) {
    if (e.target === els.modal) {
        closeEmployeeModal();
    }
}

function resetForm() {
    if (els.form) els.form.reset();
    if (els.editingId) els.editingId.value = "";

    // Reset previews and show dropzones
    if (els.photoPrev) els.photoPrev.classList.add("hidden");
    if (els.photoImg) els.photoImg.src = "";
    if (els.photoDropzone) els.photoDropzone.classList.remove("hidden");

    if (els.idPrev) els.idPrev.classList.add("hidden");
    if (els.idImg) els.idImg.src = "";
    if (els.idPhotoDropzone) els.idPhotoDropzone.classList.remove("hidden");

    if (els.cvPrev) els.cvPrev.classList.add("hidden");
    if (els.cvFileName) els.cvFileName.textContent = "";
    if (els.cvDropzone) els.cvDropzone.classList.remove("hidden");

    removedFiles = { photo: false, idPhoto: false, cv: false };
}

/* ==========================================================================
   File Input Handling
   ========================================================================== */
function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
        removedFiles.photo = false;
        const reader = new FileReader();
        reader.onload = (event) => {
            els.photoImg.src = event.target.result;
            els.photoPrev.classList.remove("hidden");
            els.photoDropzone.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }
}

function handleIdPhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
        removedFiles.idPhoto = false;
        const reader = new FileReader();
        reader.onload = (event) => {
            els.idImg.src = event.target.result;
            els.idPrev.classList.remove("hidden");
            els.idPhotoDropzone.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }
}

function handleCVChange(e) {
    const file = e.target.files[0];
    if (file) {
        removedFiles.cv = false;
        els.cvFileName.textContent = file.name;
        els.cvPrev.classList.remove("hidden");
        els.cvDropzone.classList.add("hidden");
    }
}

function removeSelectedFile(type) {
    if (type === "photo") {
        els.photo.value = "";
        els.photoImg.src = "";
        els.photoPrev.classList.add("hidden");
        els.photoDropzone.classList.remove("hidden");
        removedFiles.photo = true;
    } else if (type === "idPhoto") {
        els.idPhoto.value = "";
        els.idImg.src = "";
        els.idPrev.classList.add("hidden");
        els.idPhotoDropzone.classList.remove("hidden");
        removedFiles.idPhoto = true;
    } else if (type === "cv") {
        els.cv.value = "";
        els.cvFileName.textContent = "";
        els.cvPrev.classList.add("hidden");
        els.cvDropzone.classList.remove("hidden");
        removedFiles.cv = true;
    }
}

async function uploadFileIfExists(fileInput, destinationFolder) {
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return "";
    const file = fileInput.files[0];
    try {
        const arrayBuffer = await file.arrayBuffer();
        const uploadedPath = await window.electronAPI.uploadFile({
            arrayBuffer,
            name: file.name
        }, destinationFolder);
        return uploadedPath || "";
    } catch (err) {
        console.error("Upload error:", err);
        return "";
    }
}

/* ==========================================================================
   Save & Delete Employee
   ========================================================================== */
async function saveEmployee() {
    const name = els.name.value.trim();
    const phone = els.phone.value.trim();
    const address = els.address.value.trim();
    const salary = parseFloat(els.salary.value);
    const education = els.education.value.trim();
    const jobTitle = els.job.value.trim();
    const hireDate = els.hireDate.value;

    if (!name) {
        showError("بيانات ناقصة", "يرجى إدخال اسم الموظف.");
        els.name.focus();
        return;
    }
    if (!phone) {
        showError("بيانات ناقصة", "يرجى إدخال رقم هاتف الموظف.");
        els.phone.focus();
        return;
    }
    if (!jobTitle) {
        showError("بيانات ناقصة", "يرجى إدخال المسمى الوظيفي.");
        els.job.focus();
        return;
    }
    if (isNaN(salary) || salary < 0) {
        showError("بيانات ناقصة", "يرجى إدخال الراتب بشكل صحيح.");
        els.salary.focus();
        return;
    }
    if (!education) {
        showError("بيانات ناقصة", "يرجى إدخال المؤهل الدراسي.");
        els.education.focus();
        return;
    }
    if (!hireDate) {
        showError("بيانات ناقصة", "يرجى تحديد تاريخ التعيين.");
        els.hireDate.focus();
        return;
    }
    if (!address) {
        showError("بيانات ناقصة", "يرجى إدخال عنوان الموظف.");
        els.address.focus();
        return;
    }

    try {
        showLoading(true);
        if (els.saveBtn) els.saveBtn.disabled = true;

        // Upload files if selected
        const [uploadedPhoto, uploadedIdPhoto, uploadedCV] = await Promise.all([
            uploadFileIfExists(els.photo, "employees/photos"),
            uploadFileIfExists(els.idPhoto, "employees/id_photos"),
            uploadFileIfExists(els.cv, "employees/cvs"),
        ]);

        const existingEmp = editingEmployeeId ? employees.find(e => e._id === editingEmployeeId) : null;

        let finalPhoto = "";
        if (uploadedPhoto) {
            finalPhoto = uploadedPhoto;
        } else if (existingEmp && !removedFiles.photo) {
            finalPhoto = existingEmp.photo || "";
        }

        let finalIdPhoto = "";
        if (uploadedIdPhoto) {
            finalIdPhoto = uploadedIdPhoto;
        } else if (existingEmp && !removedFiles.idPhoto) {
            finalIdPhoto = existingEmp.idPhoto || "";
        }

        let finalCV = "";
        if (uploadedCV) {
            finalCV = uploadedCV;
        } else if (existingEmp && !removedFiles.cv) {
            finalCV = existingEmp.cv || "";
        }

        const employeePayload = {
            name,
            phone,
            address,
            salary,
            education,
            jobTitle,
            hireDate,
            photo: finalPhoto,
            idPhoto: finalIdPhoto,
            cv: finalCV,
        };

        if (editingEmployeeId) {
            await window.electronAPI.updateEmployee(editingEmployeeId, employeePayload);
            showSuccess("تم تحديث بيانات الموظف بنجاح");
        } else {
            await window.electronAPI.addEmployee(employeePayload);
            showSuccess("تمت إضافة الموظف بنجاح");
        }

        closeEmployeeModal();
        await loadEmployees();

    } catch (err) {
        showError("فشل في حفظ الموظف", err.message || "حدث خطأ غير متوقع");
    } finally {
        showLoading(false);
        if (els.saveBtn) els.saveBtn.disabled = false;
    }
}

async function confirmDeleteEmployee(employeeId) {
    const emp = employees.find(e => e._id === employeeId);
    const empName = emp ? emp.name : "هذا الموظف";

    const result = await Swal.fire({
        title: "هل أنت متأكد؟",
        text: `سيتم حذف بيانات الموظف "${empName}" نهائياً من النظام!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم، احذفه!",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#64748b",
        reverseButtons: true,
    });

    if (result.isConfirmed) {
        try {
            showLoading(true);
            await window.electronAPI.deleteEmployee(employeeId);
            showSuccess("تم حذف الموظف بنجاح");
            await loadEmployees();
        } catch (err) {
            showError("فشل في حذف الموظف", err.message);
        } finally {
            showLoading(false);
        }
    }
}

/* ==========================================================================
   Alert & Loading Helpers
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

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // First check access security
        const isFirstTime = await checkFirstTimeAccess();
        if (isFirstTime) {
            const passwordCreated = await promptCreatePassword();
            if (!passwordCreated) {
                window.location.href = "index.html";
                return;
            }
            els.loading.style.display = "none";
            els.content.classList.remove("hidden-content");
        } else {
            await promptPassword();
        }

        // Set up event listeners
        if (els.form) {
            els.form.addEventListener("submit", (e) => {
                e.preventDefault();
                saveEmployee();
            });
        }

        document.getElementById("changePasswordBtn")?.addEventListener("click", showChangePasswordModal);

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && els.modal && els.modal.classList.contains("open")) {
                closeEmployeeModal();
            }
        });

        // Load initial data
        await loadEmployees();

    } catch (error) {
        console.error("Error in Employees DOMContentLoaded:", error);
        await Swal.fire({
            title: "تنبيه",
            text: "حدث خطأ أثناء تحميل الصفحة. سيتم العودة للرئيسية.",
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
        window.location.href = "index.html";
    }
});

// Window globals for inline HTML event handlers
window.openAddEmployeeModal = openAddEmployeeModal;
window.openEditEmployeeModal = openEditEmployeeModal;
window.closeEmployeeModal = closeEmployeeModal;
window.handleModalOverlayClick = handleModalOverlayClick;
window.handleEmployeeSearch = handleEmployeeSearch;
window.clearSearch = clearSearch;
window.handlePhotoChange = handlePhotoChange;
window.handleIdPhotoChange = handleIdPhotoChange;
window.handleCVChange = handleCVChange;
window.removeSelectedFile = removeSelectedFile;
window.viewEmployeeDocument = viewEmployeeDocument;
window.confirmDeleteEmployee = confirmDeleteEmployee;
window.showChangePasswordModal = showChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.handleChangePasswordOverlayClick = handleChangePasswordOverlayClick;
window.submitChangePassword = submitChangePassword;
window.submitSecurityPassword = submitSecurityPassword;
window.cancelSecurityAccess = cancelSecurityAccess;
window.togglePasswordVisibility = togglePasswordVisibility;
window.submitCreatePassword = submitCreatePassword;
window.showFileInNewWindow = showFileInNewWindow;
