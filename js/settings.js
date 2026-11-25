let phoneFieldsCount = 0;
let currentLogoData = "";
let isLogoRemoved = false;

export function addPhoneNumberField(val = "") {
    phoneFieldsCount++;
    const container = document.getElementById("phoneNumbers");
    if (!container) return;
    const div = document.createElement("div");
    div.classList.add("phone-item-row");
    div.innerHTML = `
        <input id="phoneNumber${phoneFieldsCount}" type="text" value="${val}" placeholder="أدخل رقم هاتف المحل / الواتساب">
        <button type="button" onclick="removePhoneNumberField(this)" class="btn-remove-phone" title="حذف هذا الرقم">
            <i class="fas fa-trash-can"></i>
        </button>
    `;
    container.appendChild(div);
}

export function removePhoneNumberField(btn) {
    btn.parentElement.remove();
}

export function previewLogo() {
    const input = document.getElementById("storeLogo");
    const preview = document.getElementById("logoPreview");
    const uploadBox = document.getElementById("logoUploadBox");
    const previewCard = document.getElementById("logoPreviewCard");

    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 2 * 1024 * 1024) {
            Swal.fire({
                title: "حجم الصورة كبير",
                text: "يرجى اختيار صورة بحجم لا يتجاوز 2 ميجابايت.",
                icon: "warning",
                confirmButtonColor: "#f59e0b"
            });
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            currentLogoData = e.target.result;
            isLogoRemoved = false;
            if (preview) preview.src = currentLogoData;
            if (previewCard) previewCard.classList.remove("hidden");
            if (uploadBox) uploadBox.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }
}

export function removeLogo() {
    Swal.fire({
        title: "حذف شعار المحل؟",
        text: "هل أنت متأكد من رغبتك في حذف الشعار الحالي؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "نعم، احذف الشعار",
        cancelButtonText: "إلغاء"
    }).then(async (result) => {
        if (result.isConfirmed) {
            const input = document.getElementById("storeLogo");
            const preview = document.getElementById("logoPreview");
            const uploadBox = document.getElementById("logoUploadBox");
            const previewCard = document.getElementById("logoPreviewCard");

            if (input) input.value = "";
            if (preview) preview.src = "";
            currentLogoData = "";
            isLogoRemoved = true;

            if (previewCard) previewCard.classList.add("hidden");
            if (uploadBox) uploadBox.classList.remove("hidden");

            try {
                const currentSettings = (await window.electronAPI.getSettings()) || {};
                await window.electronAPI.saveSettings({
                    ...currentSettings,
                    logo: ""
                });
                try {
                    localStorage.setItem("managely_store_settings", JSON.stringify({
                        ...currentSettings,
                        logo: ""
                    }));
                } catch (e) {}

                Swal.fire({
                    title: "تم الحذف",
                    text: "تم حذف الشعار بنجاح.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (err) {
                console.error("Failed to remove logo:", err);
            }
        }
    });
}

export async function saveSettings() {
    try {
        const storeNameEl = document.getElementById("storeName");
        const storeLocationEl = document.getElementById("storeLocation");
        const storeName = storeNameEl ? storeNameEl.value.trim() : "";
        const storeLocation = storeLocationEl ? storeLocationEl.value.trim() : "";
        const logoInput = document.getElementById("storeLogo");
        const phones = [];

        let hasError = false;
        let firstInvalid = null;

        if (!storeName) {
            if (typeof window.markFieldInvalid === "function" && storeNameEl) {
                window.markFieldInvalid(storeNameEl, "يرجى إدخال اسم المحل");
            }
            if (!firstInvalid) firstInvalid = storeNameEl;
            hasError = true;
        }

        if (!storeLocation) {
            if (typeof window.markFieldInvalid === "function" && storeLocationEl) {
                window.markFieldInvalid(storeLocationEl, "يرجى إدخال عنوان / موقع المحل");
            }
            if (!firstInvalid) firstInvalid = storeLocationEl;
            hasError = true;
        }

        for (let i = 1; i <= phoneFieldsCount; i++) {
            const el = document.getElementById(`phoneNumber${i}`);
            if (el) {
                const val = el.value.trim();
                if (val) phones.push(val);
            }
        }

        if (phones.length === 0) {
            const firstPhoneEl = document.getElementById("phoneNumber1");
            if (typeof window.markFieldInvalid === "function" && firstPhoneEl) {
                window.markFieldInvalid(firstPhoneEl, "يرجى إدخال رقم هاتف واحد على الأقل");
            }
            if (!firstInvalid) firstInvalid = firstPhoneEl;
            hasError = true;
        }

        if (hasError) {
            if (firstInvalid) firstInvalid.focus();
            return void Swal.fire({
                title: "بيانات غير مكتملة",
                text: "يرجى استكمال الحقول المطلوبة (اسم المتجر، العنوان، ورقم الهاتف).",
                icon: "warning",
                confirmButtonColor: "#3085d6"
            });
        }

        let logoData = "";
        if (isLogoRemoved) {
            logoData = "";
        } else if (logoInput.files && logoInput.files[0]) {
            logoData = await new Promise(resolve => {
                const reader = new FileReader;
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(logoInput.files[0]);
            });
            currentLogoData = logoData;
        } else if (currentLogoData) {
            logoData = currentLogoData;
        }

        const currentSettings = (await window.electronAPI.getSettings()) || {};
        const newSettings = {
            ...currentSettings,
            storeName,
            phoneNumbers: phones,
            storeLocation,
            logo: isLogoRemoved ? "" : (logoData || currentSettings.logo || "")
        };

        await window.electronAPI.saveSettings(newSettings);
        try {
            localStorage.setItem("managely_store_settings", JSON.stringify(newSettings));
        } catch (e) {}

        Swal.fire({
            title: "تم الحفظ",
            text: "تم حفظ بيانات المحل بنجاح.",
            icon: "success",
            confirmButtonColor: "#34D399"
        });
    } catch (err) {
        Swal.fire({
            title: "تنبيه",
            text: "تعذر حفظ الإعدادات حالياً، يرجى المحاولة مرة أخرى.",
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
}

export async function loadSettings() {
    try {
        let settings = await window.electronAPI.getSettings();
        const preview = document.getElementById("logoPreview");
        const placeholder = document.getElementById("logoPlaceholder");
        const emailInput = document.getElementById("newEmail");
        const passInput = document.getElementById("newPassword");
        const statusBadge = document.getElementById("storeStatusBadge");

        if (!settings) settings = {};

        const isComplete = settings.storeName && settings.storeLocation && Array.isArray(settings.phoneNumbers) && settings.phoneNumbers.length > 0;
        if (statusBadge) {
            if (isComplete) {
                statusBadge.textContent = "مكتملة";
                statusBadge.style.color = "#059669";
            } else {
                statusBadge.textContent = "غير مكتملة";
                statusBadge.style.color = "#d97706";
            }
        }

        if (!isComplete) {
            Swal.fire({
                title: "مرحباً بك!",
                text: "يرجى استكمال بيانات المحل (الاسم، العنوان، وأرقام الهاتف) قبل البدء في استخدام البرنامج.",
                icon: "info",
                confirmButtonColor: "#3B82F6"
            });
        }

        const nameEl = document.getElementById("storeName");
        const locEl = document.getElementById("storeLocation");
        if (nameEl) nameEl.value = settings.storeName || "";
        if (locEl) locEl.value = settings.storeLocation || "";

        const phoneContainer = document.getElementById("phoneNumbers");
        if (phoneContainer) {
            phoneContainer.innerHTML = "";
            phoneFieldsCount = 0;
            if (settings.phoneNumbers && Array.isArray(settings.phoneNumbers) && settings.phoneNumbers.length > 0) {
                settings.phoneNumbers.forEach(p => {
                    addPhoneNumberField(p);
                });
            } else {
                addPhoneNumberField();
            }
        }

        const uploadBox = document.getElementById("logoUploadBox");
        const previewCard = document.getElementById("logoPreviewCard");

        if (settings.logo && typeof settings.logo === "string" && settings.logo.trim() !== "") {
            currentLogoData = settings.logo;
            isLogoRemoved = false;
            if (preview) preview.src = settings.logo;
            if (previewCard) previewCard.classList.remove("hidden");
            if (uploadBox) uploadBox.classList.add("hidden");
        } else {
            currentLogoData = "";
            isLogoRemoved = false;
            if (preview) preview.src = "";
            if (previewCard) previewCard.classList.add("hidden");
            if (uploadBox) uploadBox.classList.remove("hidden");
        }

        if (emailInput) emailInput.value = settings.email || "";
        if (passInput) passInput.value = "";

        // Load Loyalty Points Settings
        const loyaltyCheck = document.getElementById("loyaltyEnabled");
        const loyaltySpend = document.getElementById("loyaltySpendPerPoint");
        const loyaltyVal = document.getElementById("loyaltyPointValue");
        if (loyaltyCheck) loyaltyCheck.checked = settings.loyaltyEnabled !== false;
        if (loyaltySpend) loyaltySpend.value = settings.loyaltySpendPerPoint || 10;
        if (loyaltyVal) loyaltyVal.value = settings.loyaltyPointValue || 0.10;

        // Load Session & Auto-Login Settings
        const remCheck = document.getElementById("rememberLoginEnabled");
        const durationSelect = document.getElementById("sessionDurationDays");
        const suggestCheck = document.getElementById("suggestAccountsEnabled");
        if (remCheck) remCheck.checked = settings.rememberLoginEnabled !== false;
        if (durationSelect) durationSelect.value = settings.sessionDurationDays !== undefined ? String(settings.sessionDurationDays) : "30";
        if (suggestCheck) suggestCheck.checked = settings.suggestAccountsEnabled !== false;

        // Load recent backups list
        loadBackupsList();

        // Load users management list
        loadUsers();

        // Load network & multi-device sync settings
        loadNetworkSettings();
    } catch (err) {
        console.error("Error loading settings:", err);
    }
}


export async function updateLoginCredentials(email, password) {
    try {
        const emailEl = document.getElementById("newEmail");
        const passEl = document.getElementById("newPassword");
        let hasError = false;
        let firstInvalid = null;

        if (!email) {
            if (typeof window.markFieldInvalid === "function" && emailEl) {
                window.markFieldInvalid(emailEl, "يرجى إدخال البريد الإلكتروني الجديد");
            }
            if (!firstInvalid) firstInvalid = emailEl;
            hasError = true;
        }
        if (!password) {
            if (typeof window.markFieldInvalid === "function" && passEl) {
                window.markFieldInvalid(passEl, "يرجى إدخال كلمة المرور الجديدة");
            }
            if (!firstInvalid) firstInvalid = passEl;
            hasError = true;
        }

        if (hasError) {
            if (firstInvalid) firstInvalid.focus();
            return void Swal.fire({
                title: "بيانات غير مكتملة",
                text: "يرجى إدخال البريد الإلكتروني وكلمة المرور الجديدة.",
                icon: "warning",
                confirmButtonColor: "#3085d6"
            });
        }
        await window.electronAPI.updateLoginCredentials(email, password);
        Swal.fire({
            title: "تم التحديث",
            text: "تم تحديث بيانات تسجيل الدخول بنجاح.",
            icon: "success",
            confirmButtonColor: "#34D399"
        });
    } catch (err) {
        Swal.fire({
            title: "تنبيه",
            text: "تعذر تحديث بيانات تسجيل الدخول، يرجى المحاولة مرة أخرى.",
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("settingsForm");
    if (form) {
        form.addEventListener("submit", async e => {
            e.preventDefault();
            const email = document.getElementById("newEmail")?.value.trim();
            const password = document.getElementById("newPassword")?.value.trim();
            await updateLoginCredentials(email, password);
        });
    }
    const logoInput = document.getElementById("storeLogo");
    const togglePass = document.getElementById("toggleNewPassword");
    const passInput = document.getElementById("newPassword");
    const storeName = document.getElementById("storeName");
    const storeLoc = document.getElementById("storeLocation");

    if (logoInput) logoInput.addEventListener("change", previewLogo);
    if (togglePass && passInput) {
        togglePass.addEventListener("click", () => {
            const isPass = passInput.type === "password";
            passInput.type = isPass ? "text" : "password";
            togglePass.classList.toggle("fa-eye");
            togglePass.classList.toggle("fa-eye-slash");
        });
    }
    if (storeName && storeLoc) loadSettings();
    initUpdaterSettingsSection();
});

async function initUpdaterSettingsSection() {
    const versionBadge = document.getElementById("appCurrentVersionBadge");
    const headerVer = document.getElementById("headerAppVersion");
    const statusText = document.getElementById("updateStatusText");
    const statusIcon = document.getElementById("updateStatusIcon");
    const btnCheck = document.getElementById("btnCheckUpdateManual");
    const checkIcon = document.getElementById("checkUpdateIcon");
    const lastCheckTime = document.getElementById("lastCheckTime");

    try {
        let ver = null;
        if (window.electronAPI?.getAppVersion) {
            ver = await window.electronAPI.getAppVersion();
        } else if (window.electronAPI?.updater?.getVersion) {
            ver = await window.electronAPI.updater.getVersion();
        }
        if (ver) {
            if (versionBadge) versionBadge.textContent = `v${ver}`;
            if (headerVer) headerVer.textContent = `v${ver}`;
        }
    } catch (e) {
        console.warn("Failed to get app version:", e);
    }

    if (!window.electronAPI?.updater) return;

    if (btnCheck) {
        btnCheck.addEventListener("click", async () => {
            if (checkIcon) checkIcon.classList.add("fa-spin");
            if (statusText) statusText.textContent = "جاري التحقق من التحديثات...";
            if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btnCheck.disabled = true;

            try {
                const res = await window.electronAPI.updater.check();
                const nowStr = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
                if (lastCheckTime) lastCheckTime.textContent = `آخر فحص: ${nowStr}`;

                if (res && res.updateAvailable) {
                    if (statusText) statusText.textContent = `يتوفر تحديث: v${res.versionInfo?.version || ""}`;
                    if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-sparkles text-amber-500"></i>';
                } else {
                    if (statusText) statusText.textContent = "أنت تستخدم أحدث إصدار";
                    if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
                    
                    Swal.fire({
                        title: "أحدث إصدار",
                        text: "البرنامج محدث لآخر إصدار متوفر بالفعل.",
                        icon: "info",
                        confirmButtonText: "حسناً",
                        confirmButtonColor: "#4f46e5"
                    });
                }
            } catch (err) {
                if (statusText) statusText.textContent = "تعذر الاتصال بالخادم";
                if (statusIcon) statusIcon.innerHTML = '<i class="fas fa-triangle-exclamation text-amber-500"></i>';
                Swal.fire({
                    title: "تنبيه",
                    text: "تعذر التحقق من وجود تحديثات حالياً. يرجى التحقق من اتصال الإنترنت.",
                    icon: "warning",
                    confirmButtonText: "حسناً",
                    confirmButtonColor: "#4f46e5"
                });
            } finally {
                if (checkIcon) checkIcon.classList.remove("fa-spin");
                btnCheck.disabled = false;
            }
        });
    }
}

// ==========================================================================
// Loyalty Points Settings (إعدادات نقاط ولاء العملاء)
// ==========================================================================
export async function saveLoyaltySettings() {
    try {
        const enabled = document.getElementById("loyaltyEnabled")?.checked ?? true;
        const spendPerPoint = parseFloat(document.getElementById("loyaltySpendPerPoint")?.value) || 10;
        const pointValue = parseFloat(document.getElementById("loyaltyPointValue")?.value) || 0.10;

        const current = (await window.electronAPI.getSettings()) || {};
        const updated = {
            ...current,
            loyaltyEnabled: enabled,
            loyaltySpendPerPoint: spendPerPoint,
            loyaltyPointValue: pointValue
        };

        await window.electronAPI.saveSettings(updated);
        Swal.fire({
            title: "تم الحفظ بنجاح",
            text: "تم حفظ إعدادات نظام نقاط ولاء العملاء وتفعيلها فوراً.",
            icon: "success",
            confirmButtonColor: "#f59e0b",
            timer: 1800,
            showConfirmButton: false
        });
    } catch (err) {
        console.error("Error saving loyalty settings:", err);
        Swal.fire({
            title: "خطأ",
            text: "تعذر حفظ إعدادات نقاط الولاء.",
            icon: "error",
            confirmButtonColor: "#ef4444"
        });
    }
}

// ==========================================================================
// Backup & Restore Handlers (معالجات النسخ الاحتياطي والاستعادة)
// ==========================================================================
export async function handleCreateBackup() {
    try {
        Swal.fire({
            title: "جاري إنشاء النسخة الاحتياطية...",
            text: "يرجى الانتظار واختيار مكان الحفظ...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const res = await window.electronAPI.createBackup({ manualSave: true });
        Swal.close();

        if (res && res.canceled) return;

        if (res && res.success) {
            loadBackupsList();
            Swal.fire({
                title: "تم إنشاء النسخة الاحتياطية بنجاح!",
                html: `
                    <div style="direction: rtl; text-align: right; font-family: 'Tajawal', sans-serif;">
                        <p style="color: #059669; font-weight: 700; margin-bottom: 8px;">
                            <i class="fas fa-check-circle"></i> تم تصدير جميع قواعد البيانات بأمان كامل.
                        </p>
                        <div style="background: #f1f5f9; padding: 10px; border-radius: 8px; font-size: 0.8rem; word-break: break-all; color: #334155; font-family: monospace;">
                            ${res.filePath}
                        </div>
                    </div>
                `,
                icon: "success",
                confirmButtonColor: "#0284c7",
                confirmButtonText: "رائع، شكراً"
            });
        }
    } catch (err) {
        console.error("Backup creation error:", err);
        Swal.fire({
            title: "فشل النسخ الاحتياطي",
            text: "حدث خطأ أثناء محاولة تصدير النسخة الاحتياطية.",
            icon: "error",
            confirmButtonColor: "#ef4444"
        });
    }
}

export async function handleRestoreBackup() {
    try {
        const confirm = await Swal.fire({
            title: "تنبيه هام جداً ⚠️",
            html: `
                <div style="direction: rtl; text-align: right; font-family: 'Tajawal', sans-serif;">
                    <p style="color: #b91c1c; font-weight: 700; margin-bottom: 10px;">
                        استعادة نسخة احتياطية ستقوم باستبدال كافة البيانات الحالية (المنتجات، الفواتير، الخزينة، العملاء) بالبيانات الموجودة داخل ملف النسخة!
                    </p>
                    <p style="color: #475569; font-size: 0.9rem;">
                        هل ترغب في الاستمرار واختيار ملف النسخة الاحتياطية (<strong>.mbk</strong> أو <strong>.json</strong>)؟
                    </p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "نعم، اختيار ملف واستعادة البيانات",
            cancelButtonText: "إلغاء"
        });

        if (!confirm.isConfirmed) return;

        Swal.fire({
            title: "جاري فحص واستعادة البيانات...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const res = await window.electronAPI.restoreBackup();
        Swal.close();

        if (res && res.canceled) return;

        if (res && res.success) {
            await Swal.fire({
                title: "تمت الاستعادة بنجاح! 🎉",
                html: `
                    <div style="direction: rtl; text-align: right; font-family: 'Tajawal', sans-serif;">
                        <p style="color: #059669; font-weight: 700; margin-bottom: 8px;">
                            تمت استعادة قواعد البيانات بنجاح تام!
                        </p>
                        <ul style="font-size: 0.85rem; color: #475569; line-height: 1.8;">
                            <li>عدد المنتجات المستعادة: <strong>${res.itemsCount?.products || 0}</strong></li>
                            <li>عدد الفواتير المستعادة: <strong>${res.itemsCount?.sales || 0}</strong></li>
                            <li>عدد العملاء المستعادين: <strong>${res.itemsCount?.customers || 0}</strong></li>
                            <li>حركات الخزينة المستعادة: <strong>${res.itemsCount?.treasury || 0}</strong></li>
                        </ul>
                    </div>
                `,
                icon: "success",
                confirmButtonColor: "#059669",
                confirmButtonText: "إعادة تحميل البيانات"
            });
            window.location.reload();
        }
    } catch (err) {
        console.error("Restore error:", err);
        Swal.fire({
            title: "فشل استعادة البيانات",
            text: err.message || "الملف المحدد غير صالح أو تالف.",
            icon: "error",
            confirmButtonColor: "#ef4444"
        });
    }
}

export async function loadBackupsList() {
    const container = document.getElementById("backupsListContainer");
    if (!container) return;

    try {
        if (!window.electronAPI || typeof window.electronAPI.getBackups !== "function") {
            container.innerHTML = '<span style="color: #94a3b8;">ميزة فحص النسخ غير مفعلة</span>';
            return;
        }

        const backups = await window.electronAPI.getBackups();
        if (!backups || backups.length === 0) {
            container.innerHTML = '<span style="color: #94a3b8;">لا توجد نسخ احتياطية مسجلة بعد. يتم إنشاء نسخة تلقائياً عند إغلاق كل وردية.</span>';
            return;
        }

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 6px;">
                ${backups.map(b => {
                    const dateStr = new Date(b.createdAt).toLocaleString("ar-EG");
                    const sizeKb = (b.size / 1024).toFixed(1);
                    return `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-file-shield text-blue-500"></i>
                                <span style="font-weight: 700; color: #1e293b;">${b.name}</span>
                                <span style="font-size: 0.72rem; color: #94a3b8;">(${sizeKb} KB)</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 0.75rem; color: #64748b;">${dateStr}</span>
                                <button type="button" onclick="showBackupFolder('${b.path.replace(/\\/g, '\\\\')}')" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold" title="عرض في المجلد">
                                    <i class="fas fa-folder-open"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    } catch (e) {
        console.error("Error loading backups list:", e);
        container.innerHTML = '<span style="color: #ef4444;">تعذر تحميل قائمة النسخ الاحتياطية.</span>';
    }
}

export function showBackupFolder(filePath) {
    if (window.electronAPI && typeof window.electronAPI.showItemInFolder === "function") {
        window.electronAPI.showItemInFolder(filePath);
    }
}

// ==========================================================================
// Multi-User Management & Permissions Matrix Logic
// ==========================================================================
const PAGE_PERMISSION_KEYS = [
    'home',
    'salesInvoice',
    'sales',
    'products',
    'categories',
    'customers',
    'suppliers',
    'purchaseInvoices',
    'productsPurchaseInvoices',
    'returns',
    'treasury',
    'statistics',
    'employees',
    'printerSettings',
    'settings'
];

const ACTION_PERMISSION_KEYS = [
    'canApplyDiscount',
    'canChangePrice',
    'canDeleteCartItem',
    'canSuspendInvoice',
    'canDeleteSale',
    'canExportSales',
    'canAddProduct',
    'canEditProduct',
    'canDeleteProduct',
    'canImportProducts',
    'canExportProducts',
    'canAddTreasuryIncome',
    'canAddTreasuryExpense',
    'canDeleteTreasuryTransaction',
    'canCreateBackup',
    'canRestoreBackup',
    'canManageUsers'
];

const ROLE_NAMES = {
    admin: 'مدير عام',
    cashier: 'كاشير',
    inventory: 'مسؤول مخزن',
    accountant: 'محاسب مالي',
    custom: 'مخصص'
};

const ROLE_PRESETS = {
    admin: {
        roleName: 'مدير عام',
        pages: {
            home: true,
            salesInvoice: true,
            sales: true,
            products: true,
            categories: true,
            customers: true,
            suppliers: true,
            purchaseInvoices: true,
            productsPurchaseInvoices: true,
            returns: true,
            treasury: true,
            statistics: true,
            employees: true,
            printerSettings: true,
            settings: true
        },
        actions: {
            canApplyDiscount: true,
            canChangePrice: true,
            canDeleteCartItem: true,
            canSuspendInvoice: true,
            canDeleteSale: true,
            canExportSales: true,
            canAddProduct: true,
            canEditProduct: true,
            canDeleteProduct: true,
            canImportProducts: true,
            canExportProducts: true,
            canAddTreasuryIncome: true,
            canAddTreasuryExpense: true,
            canDeleteTreasuryTransaction: true,
            canCreateBackup: true,
            canRestoreBackup: true,
            canManageUsers: true
        }
    },
    cashier: {
        roleName: 'كاشير',
        pages: {
            home: true,
            salesInvoice: true,
            sales: true,
            customers: true,
            returns: true,
            products: false,
            categories: false,
            suppliers: false,
            purchaseInvoices: false,
            productsPurchaseInvoices: false,
            treasury: false,
            statistics: false,
            employees: false,
            printerSettings: false,
            settings: false
        },
        actions: {
            canApplyDiscount: true,
            canChangePrice: false,
            canDeleteCartItem: true,
            canSuspendInvoice: true,
            canDeleteSale: false,
            canExportSales: false,
            canAddProduct: false,
            canEditProduct: false,
            canDeleteProduct: false,
            canImportProducts: false,
            canExportProducts: false,
            canAddTreasuryIncome: false,
            canAddTreasuryExpense: false,
            canDeleteTreasuryTransaction: false,
            canCreateBackup: false,
            canRestoreBackup: false,
            canManageUsers: false
        }
    },
    inventory: {
        roleName: 'مسؤول مخزن',
        pages: {
            home: true,
            salesInvoice: false,
            sales: false,
            customers: false,
            returns: true,
            products: true,
            categories: true,
            suppliers: true,
            purchaseInvoices: true,
            productsPurchaseInvoices: true,
            treasury: false,
            statistics: false,
            employees: false,
            printerSettings: false,
            settings: false
        },
        actions: {
            canApplyDiscount: false,
            canChangePrice: false,
            canDeleteCartItem: false,
            canSuspendInvoice: false,
            canDeleteSale: false,
            canExportSales: false,
            canAddProduct: true,
            canEditProduct: true,
            canDeleteProduct: false,
            canImportProducts: true,
            canExportProducts: true,
            canAddTreasuryIncome: false,
            canAddTreasuryExpense: false,
            canDeleteTreasuryTransaction: false,
            canCreateBackup: false,
            canRestoreBackup: false,
            canManageUsers: false
        }
    },
    accountant: {
        roleName: 'محاسب مالي',
        pages: {
            home: true,
            salesInvoice: false,
            sales: true,
            customers: true,
            returns: true,
            products: false,
            categories: false,
            suppliers: true,
            purchaseInvoices: true,
            productsPurchaseInvoices: true,
            treasury: true,
            statistics: true,
            employees: true,
            printerSettings: false,
            settings: false
        },
        actions: {
            canApplyDiscount: false,
            canChangePrice: false,
            canDeleteCartItem: false,
            canSuspendInvoice: false,
            canDeleteSale: false,
            canExportSales: true,
            canAddProduct: false,
            canEditProduct: false,
            canDeleteProduct: false,
            canImportProducts: false,
            canExportProducts: true,
            canAddTreasuryIncome: true,
            canAddTreasuryExpense: true,
            canDeleteTreasuryTransaction: false,
            canCreateBackup: true,
            canRestoreBackup: false,
            canManageUsers: false
        }
    }
};

export async function loadUsers() {
    const container = document.getElementById("usersListContainer");
    if (!container) return;

    try {
        if (!window.electronAPI || typeof window.electronAPI.getUsers !== "function") {
            container.innerHTML = '<span style="color: #94a3b8;">إدارة المستخدمين غير مفعلة</span>';
            return;
        }

        const users = await window.electronAPI.getUsers();
        
        // Update stats
        const total = users.length;
        const active = users.filter(u => u.status !== 'inactive').length;
        const admins = users.filter(u => u.role === 'admin').length;

        const totalEl = document.getElementById("totalUsersCount");
        const activeEl = document.getElementById("activeUsersCount");
        const adminEl = document.getElementById("adminUsersCount");

        if (totalEl) totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active;
        if (adminEl) adminEl.textContent = admins;

        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="user-empty-state" style="text-align: center; padding: 32px 16px; background: #f8fafc; border-radius: 12px; border: 2px dashed #cbd5e1;">
                    <i class="fas fa-users-slash text-4xl text-gray-400 mb-3" style="font-size: 2.5rem; color: #94a3b8;"></i>
                    <p class="text-gray-600 font-bold" style="margin-top: 10px; color: #475569;">لا يوجد مستخدمين مسجلين في النظام بعد.</p>
                    <button type="button" onclick="openAddUserModal()" class="btn-add-user-header mt-3" style="margin-top: 14px;">
                        <i class="fas fa-user-plus"></i> إضافة أول مستخدم
                    </button>
                </div>
            `;
            return;
        }

        const roleBadges = {
            admin: { text: 'مدير عام', class: 'role-admin', icon: 'fa-crown' },
            cashier: { text: 'كاشير', class: 'role-cashier', icon: 'fa-cash-register' },
            inventory: { text: 'مسؤول مخزن', class: 'role-inventory', icon: 'fa-boxes-stacked' },
            accountant: { text: 'محاسب مالي', class: 'role-accountant', icon: 'fa-briefcase' },
            custom: { text: 'مخصص', class: 'role-custom', icon: 'fa-sliders' }
        };

        container.innerHTML = users.map(user => {
            const roleInfo = roleBadges[user.role] || roleBadges.custom;
            const isActive = user.status !== 'inactive';
            const pagePermsCount = Object.values(user.permissions?.pages || {}).filter(Boolean).length;
            const actionPermsCount = Object.values(user.permissions?.actions || {}).filter(Boolean).length;
            const initial = (user.name || user.username || 'م').trim().charAt(0);

            return `
                <div class="user-card-item ${!isActive ? 'is-inactive' : ''}">
                    <div class="user-card-header">
                        <div class="user-avatar-circle">
                            <span>${initial}</span>
                        </div>
                        <div class="user-header-details">
                            <div class="user-name-row">
                                <h3 class="user-display-name">${user.name}</h3>
                                ${user.isSuperAdmin ? '<span class="super-admin-shield" title="المدير العام الأساسي للنظام"><i class="fas fa-shield-halved"></i> أساسي</span>' : ''}
                            </div>
                            <div class="user-username-badge">
                                <i class="fas fa-at"></i>
                                <span>${user.username}</span>
                            </div>
                        </div>
                        <div class="user-role-badge ${roleInfo.class}">
                            <i class="fas ${roleInfo.icon}"></i>
                            <span>${roleInfo.text}</span>
                        </div>
                    </div>

                    <div class="user-card-body">
                        <div class="user-meta-item">
                            <i class="fas fa-envelope text-gray-400"></i>
                            <span>${user.email || 'بدون بريد إلكتروني'}</span>
                        </div>
                        ${user.phone ? `
                            <div class="user-meta-item">
                                <i class="fas fa-phone text-gray-400"></i>
                                <span>${user.phone}</span>
                            </div>
                        ` : ''}
                        <div class="user-perms-summary">
                            <div class="perm-pill">
                                <i class="fas fa-layer-group text-indigo-500"></i>
                                <span>${pagePermsCount} من 15 شاشة</span>
                            </div>
                            <div class="perm-pill">
                                <i class="fas fa-bolt text-amber-500"></i>
                                <span>${actionPermsCount} من 17 عملية</span>
                            </div>
                            <div class="perm-pill ${isActive ? 'status-active' : 'status-inactive'}">
                                <i class="fas ${isActive ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-rose-500'}"></i>
                                <span>${isActive ? 'نشط' : 'معطل'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="user-card-actions">
                        <button type="button" onclick="openEditUserModal('${user._id}')" class="btn-user-action edit" title="تعديل البيانات والصلاحيات">
                            <i class="fas fa-pen-to-square"></i>
                            <span>تعديل</span>
                        </button>
                        <button type="button" onclick="openChangePasswordModal('${user._id}', '${user.name.replace(/'/g, "\\'")}')" class="btn-user-action pwd" title="تغيير كلمة المرور">
                            <i class="fas fa-key"></i>
                            <span>كلمة المرور</span>
                        </button>
                        ${!user.isSuperAdmin ? `
                            <button type="button" onclick="toggleUserStatus('${user._id}', '${user.status || 'active'}')" class="btn-user-action status ${isActive ? 'deactivate' : 'activate'}" title="${isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}">
                                <i class="fas ${isActive ? 'fa-user-slash' : 'fa-user-check'}"></i>
                                <span>${isActive ? 'تعطيل' : 'تفعيل'}</span>
                            </button>
                            <button type="button" onclick="deleteUserConfirm('${user._id}', '${user.name.replace(/'/g, "\\'")}')" class="btn-user-action delete" title="حذف المستخدم">
                                <i class="fas fa-trash-can"></i>
                                <span>حذف</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join("");
    } catch (e) {
        console.error("Error loading users list:", e);
        container.innerHTML = '<span style="color: #ef4444;">تعذر تحميل قائمة المستخدمين.</span>';
    }
}

export function openAddUserModal() {
    const modal = document.getElementById("userModal");
    if (!modal) return;

    document.getElementById("editingUserId").value = "";
    document.getElementById("userModalTitle").textContent = "إضافة مستخدم جديد";
    document.getElementById("userModalSubtitle").textContent = "تحديد بيانات الدخول والصلاحيات المخصصة للمستخدم";

    document.getElementById("userFullName").value = "";
    document.getElementById("userUsername").value = "";
    document.getElementById("userEmail").value = "";
    document.getElementById("userPhone").value = "";

    const passInput = document.getElementById("userPassword");
    const passConfirmInput = document.getElementById("userPasswordConfirm");
    const passGroup = document.getElementById("passwordGroup");
    const confirmPassGroup = document.getElementById("confirmPasswordGroup");
    const pwdStar = document.getElementById("pwdRequiredStar");
    const pwdConfirmStar = document.getElementById("pwdConfirmRequiredStar");
    const pwdHelp = document.getElementById("passwordHelpText");

    if (passInput) {
        passInput.value = "";
        passInput.required = true;
    }
    if (passConfirmInput) {
        passConfirmInput.value = "";
        passConfirmInput.required = true;
    }
    if (pwdStar) pwdStar.classList.remove("hidden");
    if (pwdConfirmStar) pwdConfirmStar.classList.remove("hidden");
    if (pwdHelp) pwdHelp.classList.add("hidden");
    if (passGroup) passGroup.classList.remove("hidden");
    if (confirmPassGroup) confirmPassGroup.classList.remove("hidden");

    // Status Radio
    const activeRadio = document.getElementById("userStatusActive");
    if (activeRadio) activeRadio.checked = true;

    // Enable role & status if previously disabled
    const roleSelect = document.getElementById("userRoleSelect");
    if (roleSelect) {
        roleSelect.disabled = false;
        roleSelect.value = "cashier";
        if (typeof roleSelect._syncCustomSelect === "function") roleSelect._syncCustomSelect();
    }

    const inactiveRadio = document.getElementById("userStatusInactive");
    if (activeRadio) activeRadio.disabled = false;
    if (inactiveRadio) inactiveRadio.disabled = false;

    // Apply default cashier role preset
    onRolePresetChange("cashier");

    modal.classList.remove("hidden");
}

export async function openEditUserModal(userId) {
    const modal = document.getElementById("userModal");
    if (!modal || !window.electronAPI) return;

    try {
        const user = await window.electronAPI.getUserById(userId);
        if (!user) {
            Swal.fire({
                title: "تنبيه",
                text: "تعذر العثور على بيانات المستخدم المطلوب.",
                icon: "error"
            });
            return;
        }

        document.getElementById("editingUserId").value = user._id;
        document.getElementById("userModalTitle").textContent = `تعديل بيانات المستخدم: ${user.name}`;
        document.getElementById("userModalSubtitle").textContent = "تعديل بيانات الحساب وتحديث مصفوفة الصلاحيات";

        document.getElementById("userFullName").value = user.name || "";
        document.getElementById("userUsername").value = user.username || "";
        document.getElementById("userEmail").value = user.email || "";
        document.getElementById("userPhone").value = user.phone || "";

        // In edit mode, password is changed via dedicated modal
        const passInput = document.getElementById("userPassword");
        const passConfirmInput = document.getElementById("userPasswordConfirm");
        const pwdStar = document.getElementById("pwdRequiredStar");
        const pwdConfirmStar = document.getElementById("pwdConfirmRequiredStar");
        const pwdHelp = document.getElementById("passwordHelpText");

        if (passInput) {
            passInput.value = "";
            passInput.required = false;
        }
        if (passConfirmInput) {
            passConfirmInput.value = "";
            passConfirmInput.required = false;
        }
        if (pwdStar) pwdStar.classList.add("hidden");
        if (pwdConfirmStar) pwdConfirmStar.classList.add("hidden");
        if (pwdHelp) pwdHelp.classList.remove("hidden");

        // Role select
        const roleSelect = document.getElementById("userRoleSelect");
        if (roleSelect) {
            roleSelect.value = user.role || "custom";
            roleSelect.disabled = !!user.isSuperAdmin;
            if (typeof roleSelect._syncCustomSelect === "function") roleSelect._syncCustomSelect();
        }

        // Status radio
        const activeRadio = document.getElementById("userStatusActive");
        const inactiveRadio = document.getElementById("userStatusInactive");
        if (user.status === "inactive") {
            if (inactiveRadio) inactiveRadio.checked = true;
        } else {
            if (activeRadio) activeRadio.checked = true;
        }

        if (activeRadio) activeRadio.disabled = !!user.isSuperAdmin;
        if (inactiveRadio) inactiveRadio.disabled = !!user.isSuperAdmin;

        // Populate page permissions
        const pagePerms = user.permissions?.pages || {};
        PAGE_PERMISSION_KEYS.forEach(key => {
            const chk = document.getElementById(`perm_page_${key}`);
            if (chk) {
                chk.checked = pagePerms[key] === true;
            }
        });

        // Populate action permissions
        const actPerms = user.permissions?.actions || {};
        ACTION_PERMISSION_KEYS.forEach(key => {
            const chk = document.getElementById(`perm_act_${key}`);
            if (chk) {
                chk.checked = actPerms[key] === true;
            }
        });

        modal.classList.remove("hidden");
    } catch (err) {
        console.error("Error opening edit user modal:", err);
        Swal.fire({
            title: "خطأ",
            text: err.message || "تعذر جلب بيانات المستخدم.",
            icon: "error"
        });
    }
}

export function closeUserModal() {
    const modal = document.getElementById("userModal");
    if (modal) modal.classList.add("hidden");
}

export function onRolePresetChange(role) {
    if (!role || role === "custom") return;

    const preset = ROLE_PRESETS[role];
    if (!preset) return;

    // Set page permissions
    if (preset.pages) {
        PAGE_PERMISSION_KEYS.forEach(key => {
            const chk = document.getElementById(`perm_page_${key}`);
            if (chk) {
                chk.checked = preset.pages[key] === true;
            }
        });
    }

    // Set action permissions
    if (preset.actions) {
        ACTION_PERMISSION_KEYS.forEach(key => {
            const chk = document.getElementById(`perm_act_${key}`);
            if (chk) {
                chk.checked = preset.actions[key] === true;
            }
        });
    }
}

export function setAllPagePermissions(state) {
    PAGE_PERMISSION_KEYS.forEach(key => {
        const chk = document.getElementById(`perm_page_${key}`);
        if (chk) chk.checked = !!state;
    });

    const roleSelect = document.getElementById("userRoleSelect");
    if (roleSelect && roleSelect.value !== "admin" && roleSelect.value !== "custom") {
        roleSelect.value = "custom";
        if (typeof roleSelect._syncCustomSelect === "function") roleSelect._syncCustomSelect();
    }
}

export function setAllActionPermissions(state) {
    ACTION_PERMISSION_KEYS.forEach(key => {
        const chk = document.getElementById(`perm_act_${key}`);
        if (chk) chk.checked = !!state;
    });

    const roleSelect = document.getElementById("userRoleSelect");
    if (roleSelect && roleSelect.value !== "admin" && roleSelect.value !== "custom") {
        roleSelect.value = "custom";
        if (typeof roleSelect._syncCustomSelect === "function") roleSelect._syncCustomSelect();
    }
}

export async function handleSaveUser(event) {
    if (event) event.preventDefault();

    const editingId = document.getElementById("editingUserId")?.value.trim();
    const fullName = document.getElementById("userFullName")?.value.trim();
    const username = document.getElementById("userUsername")?.value.trim();
    const email = document.getElementById("userEmail")?.value.trim();
    const phone = document.getElementById("userPhone")?.value.trim();
    const password = document.getElementById("userPassword")?.value.trim();
    const confirmPassword = document.getElementById("userPasswordConfirm")?.value.trim();
    const role = document.getElementById("userRoleSelect")?.value || "custom";
    const status = document.getElementById("userStatusInactive")?.checked ? "inactive" : "active";

    // Validations
    if (!fullName) {
        return void Swal.fire({
            title: "بيانات ناقصة",
            text: "يرجى إدخال الاسم الكامل للمستخدم.",
            icon: "warning"
        });
    }

    if (!username) {
        return void Swal.fire({
            title: "بيانات ناقصة",
            text: "يرجى إدخال اسم المستخدم (اسم الدخول).",
            icon: "warning"
        });
    }

    if (!editingId) {
        // Adding new user: Password is mandatory
        if (!password) {
            return void Swal.fire({
                title: "كلمة المرور مطلوبة",
                text: "يرجى إدخال كلمة المرور للمستخدم الجديد.",
                icon: "warning"
            });
        }
        if (password.length < 4) {
            return void Swal.fire({
                title: "كلمة مرور ضعيفة",
                text: "يجب ألا تقل كلمة المرور عن 4 أحرف أو أرقام.",
                icon: "warning"
            });
        }
        if (password !== confirmPassword) {
            return void Swal.fire({
                title: "تأكيد كلمة المرور",
                text: "كلمتا المرور غير متطابقتين، يرجى إعادة التأكد.",
                icon: "error"
            });
        }
    } else {
        // Editing existing user: Password optional
        if (password && password.length > 0) {
            if (password.length < 4) {
                return void Swal.fire({
                    title: "كلمة مرور ضعيفة",
                    text: "يجب ألا تقل كلمة المرور عن 4 أحرف أو أرقام.",
                    icon: "warning"
                });
            }
            if (password !== confirmPassword) {
                return void Swal.fire({
                    title: "تأكيد كلمة المرور",
                    text: "كلمتا المرور غير متطابقتين، يرجى إعادة التأكد.",
                    icon: "error"
                });
            }
        }
    }

    // Collect Permissions
    const pages = {};
    PAGE_PERMISSION_KEYS.forEach(key => {
        const chk = document.getElementById(`perm_page_${key}`);
        pages[key] = chk ? chk.checked : false;
    });

    const actions = {};
    ACTION_PERMISSION_KEYS.forEach(key => {
        const chk = document.getElementById(`perm_act_${key}`);
        actions[key] = chk ? chk.checked : false;
    });

    const userData = {
        name: fullName,
        username: username,
        email: email,
        phone: phone,
        role: role,
        roleName: ROLE_NAMES[role] || "مخصص",
        status: status,
        permissions: {
            pages: pages,
            actions: actions
        }
    };

    if (password && password.length > 0) {
        userData.password = password;
    }

    const saveBtn = document.getElementById("btnSaveUserModal");
    if (saveBtn) saveBtn.disabled = true;

    try {
        if (editingId) {
            await window.electronAPI.updateUser(editingId, userData);
            
            // Check if current user in localStorage was updated
            try {
                const storedUser = JSON.parse(localStorage.getItem("currentUser") || "null");
                if (storedUser && storedUser._id === editingId) {
                    localStorage.setItem("currentUser", JSON.stringify({
                        ...storedUser,
                        ...userData,
                        _id: editingId
                    }));
                }
            } catch (e) {}

            Swal.fire({
                title: "تم الحفظ بنجاح!",
                text: `تم تحديث بيانات وصلاحيات المستخدم (${fullName}) بنجاح.`,
                icon: "success",
                timer: 1600,
                showConfirmButton: false
            });
        } else {
            await window.electronAPI.addUser(userData);
            Swal.fire({
                title: "تمت الإضافة بنجاح!",
                text: `تم إنشاء حساب المستخدم الجديد (${fullName}) بنجاح.`,
                icon: "success",
                timer: 1600,
                showConfirmButton: false
            });
        }

        closeUserModal();
        loadUsers();
    } catch (err) {
        console.error("Error saving user:", err);
        Swal.fire({
            title: "تعذر حفظ المستخدم",
            text: err.message || "حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.",
            icon: "error"
        });
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

export function toggleUserStatus(userId, currentStatus) {
    const isActivating = currentStatus === "inactive";
    const actionText = isActivating ? "تفعيل الحساب" : "تعطيل الحساب";

    Swal.fire({
        title: `${actionText}؟`,
        text: isActivating
            ? "سيتمكن المستخدم من تسجيل الدخول واستخدام النظام بالصلاحيات المحددة له."
            : "لن يتمكن هذا المستخدم من تسجيل الدخول إلى النظام حتى يتم إعادة تفعيله.",
        icon: isActivating ? "question" : "warning",
        showCancelButton: true,
        confirmButtonColor: isActivating ? "#059669" : "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: `نعم، ${actionText}`,
        cancelButtonText: "إلغاء"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await window.electronAPI.updateUser(userId, {
                    status: isActivating ? "active" : "inactive"
                });
                Swal.fire({
                    title: "تمت العملية بنجاح",
                    text: `تم ${actionText} بنجاح.`,
                    icon: "success",
                    timer: 1400,
                    showConfirmButton: false
                });
                loadUsers();
            } catch (err) {
                Swal.fire({
                    title: "خطأ",
                    text: err.message || "تعذر تغيير حالة الحساب.",
                    icon: "error"
                });
            }
        }
    });
}

export function deleteUserConfirm(userId, userName) {
    Swal.fire({
        title: "حذف المستخدم نهائياً؟",
        html: `هل أنت متأكد من رغبتك في حذف حساب المستخدم <strong>(${userName})</strong> نهائياً من النظام؟<br><span style="font-size: 0.85rem; color: #ef4444;">هذا الإجراء لا يمكن التراجع عنه.</span>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "نعم، احذف المستخدم",
        cancelButtonText: "إلغاء"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await window.electronAPI.deleteUser(userId);
                Swal.fire({
                    title: "تم الحذف",
                    text: "تم حذف المستخدم بنجاح.",
                    icon: "success",
                    timer: 1400,
                    showConfirmButton: false
                });
                loadUsers();
            } catch (err) {
                Swal.fire({
                    title: "تعذر الحذف",
                    text: err.message || "حدث خطأ أثناء محاولة حذف المستخدم.",
                    icon: "error"
                });
            }
        }
    });
}

export function openChangePasswordModal(userId, userName) {
    const modal = document.getElementById("changeUserPasswordModal");
    if (!modal) return;

    document.getElementById("pwdTargetUserId").value = userId;
    document.getElementById("pwdTargetUserDisplay").textContent = `المستخدم: ${userName}`;
    document.getElementById("newCustomPassword").value = "";
    document.getElementById("newCustomPasswordConfirm").value = "";

    modal.classList.remove("hidden");
}

export function closeChangePasswordModal() {
    const modal = document.getElementById("changeUserPasswordModal");
    if (modal) modal.classList.add("hidden");
}

export async function handleSaveChangedPassword(event) {
    if (event) event.preventDefault();

    const userId = document.getElementById("pwdTargetUserId")?.value;
    const newPass = document.getElementById("newCustomPassword")?.value.trim();
    const newPassConfirm = document.getElementById("newCustomPasswordConfirm")?.value.trim();

    if (!userId || !newPass) {
        return void Swal.fire({
            title: "تنبيه",
            text: "يرجى إدخال كلمة المرور الجديدة.",
            icon: "warning"
        });
    }

    if (newPass.length < 4) {
        return void Swal.fire({
            title: "كلمة مرور ضعيفة",
            text: "يجب ألا تقل كلمة المرور عن 4 أحرف أو أرقام.",
            icon: "warning"
        });
    }

    if (newPass !== newPassConfirm) {
        return void Swal.fire({
            title: "تأكيد كلمة المرور",
            text: "كلمتا المرور غير متطابقتين، يرجى إعادة التأكد.",
            icon: "error"
        });
    }

    try {
        await window.electronAPI.changeUserPassword(userId, newPass);
        Swal.fire({
            title: "تم التحديث بنجاح!",
            text: "تم تغيير كلمة المرور للمستخدم بنجاح.",
            icon: "success",
            timer: 1600,
            showConfirmButton: false
        });
        closeChangePasswordModal();
    } catch (err) {
        console.error("Error changing user password:", err);
        Swal.fire({
            title: "خطأ",
            text: err.message || "تعذر تغيير كلمة المرور.",
            icon: "error"
        });
    }
}

export function togglePasswordVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    if (iconElement) {
        iconElement.classList.toggle("fa-eye", !isPassword);
        iconElement.classList.toggle("fa-eye-slash", isPassword);
    }
}

export function loadEmailAndPasswordSettings() {
    document.addEventListener("DOMContentLoaded", () => {
        loadSettings();
    });
}

// Bind all to window for inline onclick handlers & modules
window.addPhoneNumberField = addPhoneNumberField;
window.removePhoneNumberField = removePhoneNumberField;
window.saveSettings = saveSettings;
window.previewLogo = previewLogo;
window.removeLogo = removeLogo;
window.saveLoyaltySettings = saveLoyaltySettings;
window.handleCreateBackup = handleCreateBackup;
window.handleRestoreBackup = handleRestoreBackup;
window.loadBackupsList = loadBackupsList;
window.showBackupFolder = showBackupFolder;
window.saveSessionSettings = saveSessionSettings;
window.clearAllSavedSessions = clearAllSavedSessions;

// User Management window bindings
window.loadUsers = loadUsers;
window.openAddUserModal = openAddUserModal;
window.openEditUserModal = openEditUserModal;
window.closeUserModal = closeUserModal;
window.onRolePresetChange = onRolePresetChange;
window.setAllPagePermissions = setAllPagePermissions;
window.setAllActionPermissions = setAllActionPermissions;
window.handleSaveUser = handleSaveUser;
window.toggleUserStatus = toggleUserStatus;
window.deleteUserConfirm = deleteUserConfirm;
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.handleSaveChangedPassword = handleSaveChangedPassword;
window.togglePasswordVisibility = togglePasswordVisibility;

export async function saveSessionSettings() {
    try {
        const remCheck = document.getElementById("rememberLoginEnabled");
        const durationSelect = document.getElementById("sessionDurationDays");
        const suggestCheck = document.getElementById("suggestAccountsEnabled");

        const rememberLoginEnabled = remCheck ? remCheck.checked : true;
        const sessionDurationDays = durationSelect ? Number(durationSelect.value) : 30;
        const suggestAccountsEnabled = suggestCheck ? suggestCheck.checked : true;

        const currentSettings = (await window.electronAPI.getSettings()) || {};
        const newSettings = {
            ...currentSettings,
            rememberLoginEnabled,
            sessionDurationDays,
            suggestAccountsEnabled
        };

        await window.electronAPI.saveSettings(newSettings);
        try {
            localStorage.setItem("managely_store_settings", JSON.stringify(newSettings));
        } catch (e) {}

        Swal.fire({
            title: "تم الحفظ بنجاح!",
            text: "تم حفظ إعدادات تسجيل الدخول ومدة الجلسة بنجاح.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
        });
    } catch (err) {
        console.error("Error saving session settings:", err);
        Swal.fire({
            title: "خطأ",
            text: "حدث خطأ أثناء حفظ إعدادات الجلسة: " + err.message,
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
}

export function clearAllSavedSessions() {
    Swal.fire({
        title: "مسح الحسابات والجلسات المحفوظة؟",
        text: "سيتم مسح قائمة الحسابات المقترحة وإلغاء تسجيل الدخول التلقائي من هذا الجهاز.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "نعم، مسح الكل",
        cancelButtonText: "إلغاء"
    }).then((res) => {
        if (res.isConfirmed) {
            try {
                localStorage.removeItem("managely_saved_accounts");
                localStorage.removeItem("managely_auth_session");
                Swal.fire({
                    title: "تم المسح!",
                    text: "تم مسح جميع الحسابات والجلسات المحفوظة بنجاح.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (err) {
                console.error("Error clearing saved sessions:", err);
            }
        }
    });
}

// ==========================================================================
// Network Sync & Multi-Device Controller Functions
// ==========================================================================
// ==========================================================================
// Network Sync & Multi-Device / Cloud Architecture Controller
// ==========================================================================
export async function loadNetworkSettings() {
    try {
        if (!window.electronAPI || !window.electronAPI.network) return;

        const result = await window.electronAPI.network.getConfig();
        const config = result.config || {};
        const mode = config.mode || "standalone";

        // Set radio value
        const radio = document.querySelector(`input[name="networkMode"][value="${mode}"]`);
        if (radio) radio.checked = true;

        // Cloud Key Inputs
        const cloudKeyInput = document.getElementById("cloudSyncKeyInput");
        const cloudBranchInput = document.getElementById("cloudBranchNameInput");
        const cloudIntervalSelect = document.getElementById("cloudSyncIntervalSelect");

        if (cloudKeyInput) cloudKeyInput.value = config.cloudSyncKey || "";
        if (cloudBranchInput) cloudBranchInput.value = config.cloudBranchName || "";
        if (cloudIntervalSelect) cloudIntervalSelect.value = String(config.cloudSyncInterval || 15);

        // Custom Cloud Inputs
        const customUrlInput = document.getElementById("cloudCustomUrlInput");
        const customApiKeyInput = document.getElementById("cloudApiKeyInput");
        const customPinInput = document.getElementById("cloudSecurityPinInput");

        if (customUrlInput) customUrlInput.value = config.cloudCustomUrl || "";
        if (customApiKeyInput) customApiKeyInput.value = config.cloudApiKey || "";
        if (customPinInput) customPinInput.value = config.securityPin || "";

        // Local Server / Client Inputs
        const serverPortEl = document.getElementById("serverPortInput");
        const serverNameEl = document.getElementById("serverDeviceNameInput");
        const clientHostEl = document.getElementById("clientHostInput");
        const clientPortEl = document.getElementById("clientPortInput");

        if (serverPortEl) serverPortEl.value = config.serverPort || 4545;
        if (serverNameEl) serverNameEl.value = config.deviceName || "";
        if (clientHostEl) clientHostEl.value = config.serverHost || "";
        if (clientPortEl) clientPortEl.value = config.serverPort || 4545;

        // Toggle Panels according to active mode
        updateNetworkModePanels(mode);

        // Render Server Discovered IPs
        if (result.ips && Array.isArray(result.ips)) {
            renderServerIPsList(result.ips);
        }

        // Server status badge
        const serverBadge = document.getElementById("serverLiveStatusBadge");
        if (serverBadge) {
            if (result.isServerRunning) {
                serverBadge.textContent = "السيرفر نشط (Online)";
                serverBadge.className = "badge badge-success text-xs font-bold";
            } else {
                serverBadge.textContent = mode === "server" ? "جاهز للبدء" : "متوقف";
                serverBadge.className = "badge badge-ghost text-xs font-bold";
            }
        }

        // Client Status
        if (mode === "client" && result.clientStatus) {
            updateClientStatusUI(result.clientStatus);
        } else if (mode === "cloud_key" && result.clientStatus) {
            updateCloudKeyStatusUI(result.clientStatus);
        } else if (mode === "cloud_custom" && result.clientStatus) {
            updateCloudCustomStatusUI(result.clientStatus);
        }
    } catch (err) {
        console.warn("Could not load network settings:", err);
    }
}

export function updateNetworkModePanels(mode) {
    const cloudKeyPanel = document.getElementById("cloudKeyConfigPanel");
    const cloudCustomPanel = document.getElementById("cloudCustomConfigPanel");
    const serverPanel = document.getElementById("serverConfigPanel");
    const clientPanel = document.getElementById("clientConfigPanel");

    if (cloudKeyPanel) {
        if (mode === "cloud_key") cloudKeyPanel.classList.remove("hidden");
        else cloudKeyPanel.classList.add("hidden");
    }

    if (cloudCustomPanel) {
        if (mode === "cloud_custom") cloudCustomPanel.classList.remove("hidden");
        else cloudCustomPanel.classList.add("hidden");
    }

    if (serverPanel) {
        if (mode === "server") serverPanel.classList.remove("hidden");
        else serverPanel.classList.add("hidden");
    }

    if (clientPanel) {
        if (mode === "client") clientPanel.classList.remove("hidden");
        else clientPanel.classList.add("hidden");
    }
}

export function generateRandomCloudKey() {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const generatedKey = `MG-STORE-${randomCode}`;
    const input = document.getElementById("cloudSyncKeyInput");
    if (input) {
        input.value = generatedKey;
        Swal.fire({
            title: "تم توليد الكود السحابي! 🔑",
            html: `كود المزامنة الجديد: <strong style="font-size: 1.2rem; color: #d97706; letter-spacing: 1px;">${generatedKey}</strong><br><span style="font-size: 0.85rem; color: #64748b;">انسخ هذا الكود واستخدمه في الأجهزة الأخرى للربط التلقائي.</span>`,
            icon: "success",
            confirmButtonColor: "#d97706"
        });
    }
}

export function updateCloudKeyStatusUI(status) {
    const dot = document.getElementById("cloudKeyStatusDot");
    const badge = document.getElementById("cloudKeyLiveBadge");
    const feedback = document.getElementById("cloudKeyFeedback");

    if (!dot || !badge) return;

    if (status.ok) {
        dot.className = "status-indicator-dot online";
        badge.textContent = `متصل بالسحابة (${status.latencyMs || 0} ms)`;
        badge.className = "badge badge-success text-xs font-bold";
        if (feedback) {
            feedback.innerHTML = `<span class="text-emerald-600 font-bold"><i class="fas fa-check-circle"></i> متصل بسحابة Managely: كود (${status.cloudInfo?.storeKey}) - ${status.cloudInfo?.branchName || 'فرع نشط'}</span>`;
        }
    } else {
        dot.className = "status-indicator-dot offline";
        badge.textContent = "غير متصل";
        badge.className = "badge badge-error text-xs font-bold text-white";
        if (feedback) {
            feedback.innerHTML = `<span class="text-red-500 font-semibold"><i class="fas fa-circle-xmark"></i> ${status.error || 'فشل الاتصال بالسحابة'}</span>`;
        }
    }
}

export async function testCloudKeyConnectionAction() {
    const keyInput = document.getElementById("cloudSyncKeyInput");
    const branchInput = document.getElementById("cloudBranchNameInput");
    const key = keyInput ? keyInput.value.trim() : "";
    const branch = branchInput ? branchInput.value.trim() : "";

    if (!key) {
        if (keyInput && typeof window.markFieldInvalid === "function") {
            window.markFieldInvalid(keyInput, "يرجى إدخال كود المزامنة السحابي");
        }
        return void Swal.fire({
            title: "كود المزامنة مطلوب",
            text: "يرجى كتابة كود المزامنة الموحد (أو الضغط على توليد كود جديد) لفحص الاتصال بالسحابة.",
            icon: "warning",
            confirmButtonColor: "#d97706"
        });
    }

    const dot = document.getElementById("cloudKeyStatusDot");
    const badge = document.getElementById("cloudKeyLiveBadge");
    const feedback = document.getElementById("cloudKeyFeedback");

    if (dot) dot.className = "status-indicator-dot checking";
    if (badge) {
        badge.textContent = "جاري الاتصال بالسحابة...";
        badge.className = "badge badge-warning text-xs font-bold";
    }
    if (feedback) feedback.textContent = `جاري التحقق من كود المتجر ${key}...`;

    try {
        const result = await window.electronAPI.network.testCloudKey(key, branch);
        updateCloudKeyStatusUI(result);

        if (result.ok) {
            Swal.fire({
                title: "الاتصال السحابي ناجح! ☁️🟢",
                html: `تم التحقق من كود المتجر <strong>${key}</strong> والاتصال بالسحابة بنجاح.<br><br>
                <div style="text-align: right; background: #f8fafc; padding: 12px; border-radius: 10px; font-size: 0.85rem; color: #334155; line-height: 1.8;">
                    <strong>• سرعة الاستجابة:</strong> ${result.latencyMs} ms<br>
                    <strong>• اسم نقطة البيع:</strong> ${result.cloudInfo?.branchName || 'الفرع الرئيسي'}<br>
                    <strong>• بروتوكول الأمان:</strong> ${result.cloudInfo?.protocol || 'TLS 1.3 End-to-End'}<br>
                    <strong>• حالة المزامنة:</strong> نشطة ومحمية ضد فقدان البيانات
                </div>`,
                icon: "success",
                confirmButtonColor: "#d97706"
            });
        } else {
            Swal.fire({
                title: "فشل التحقق السحابي 🔴",
                text: result.error || "تعذر الاتصال بالخادم السحابي. تأكد من اتصال الإنترنت وصحة الكود.",
                icon: "error",
                confirmButtonColor: "#EF4444"
            });
        }
    } catch (err) {
        updateCloudKeyStatusUI({ ok: false, error: err.message });
        Swal.fire({
            title: "خطأ في الاتصال",
            text: err.message,
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
}

export function updateCloudCustomStatusUI(status) {
    const dot = document.getElementById("cloudCustomStatusDot");
    const badge = document.getElementById("cloudCustomLiveBadge");
    const feedback = document.getElementById("cloudCustomFeedback");

    if (!dot || !badge) return;

    if (status.ok) {
        dot.className = "status-indicator-dot online";
        badge.textContent = `السيرفر متصل (${status.latencyMs || 0} ms)`;
        badge.className = "badge badge-success text-xs font-bold";
        if (feedback) {
            feedback.innerHTML = `<span class="text-emerald-600 font-bold"><i class="fas fa-check-circle"></i> تم الاتصال بالسيرفر: ${status.serverInfo?.endpoint || 'Custom VPS'} (كود الاستجابة ${status.serverInfo?.statusCode || 200})</span>`;
        }
    } else {
        dot.className = "status-indicator-dot offline";
        badge.textContent = "فشل الاتصال";
        badge.className = "badge badge-error text-xs font-bold text-white";
        if (feedback) {
            feedback.innerHTML = `<span class="text-red-500 font-semibold"><i class="fas fa-circle-xmark"></i> ${status.error || 'تعذر الاتصال بالسيرفر المخصص'}</span>`;
        }
    }
}

export async function testCustomCloudConnectionAction() {
    const urlInput = document.getElementById("cloudCustomUrlInput");
    const keyInput = document.getElementById("cloudApiKeyInput");
    const pinInput = document.getElementById("cloudSecurityPinInput");

    const url = urlInput ? urlInput.value.trim() : "";
    const key = keyInput ? keyInput.value.trim() : "";
    const pin = pinInput ? pinInput.value.trim() : "";

    if (!url) {
        if (urlInput && typeof window.markFieldInvalid === "function") {
            window.markFieldInvalid(urlInput, "يرجى إدخال رابط الخادم السحابي");
        }
        return void Swal.fire({
            title: "رابط الخادم مطلوب",
            text: "يرجى كتابة عنوان الـ URL الخاص بالسيرفر السحابي المخصص لفحص اتصاله.",
            icon: "warning",
            confirmButtonColor: "#0284c7"
        });
    }

    const dot = document.getElementById("cloudCustomStatusDot");
    const badge = document.getElementById("cloudCustomLiveBadge");
    const feedback = document.getElementById("cloudCustomFeedback");

    if (dot) dot.className = "status-indicator-dot checking";
    if (badge) {
        badge.textContent = "جاري فحص السيرفر...";
        badge.className = "badge badge-warning text-xs font-bold";
    }
    if (feedback) feedback.textContent = `جاري محاولة الاتصال بـ ${url}...`;

    try {
        const result = await window.electronAPI.network.testCustomCloud(url, key, pin);
        updateCloudCustomStatusUI(result);

        if (result.ok) {
            Swal.fire({
                title: "الاتصال بالسيرفر المخصص ناجح! 🌐🟢",
                html: `استجاب السيرفر بنجاح وسرعة الاستجابة: <strong>${result.latencyMs} مللي ثانية</strong>.<br><span style="font-size: 0.85rem; color: #0284c7;">الخادم جاهز لاستقبال الفواتير وتزامن البيانات.</span>`,
                icon: "success",
                confirmButtonColor: "#0284c7"
            });
        } else {
            Swal.fire({
                title: "فشل الاتصال بالسيرفر 🔴",
                text: result.error || "تعذر الوصول إلى الخادم السحابي المخصص. تأكد من صحة الرابط ومفتاح الـ API.",
                icon: "error",
                confirmButtonColor: "#EF4444"
            });
        }
    } catch (err) {
        updateCloudCustomStatusUI({ ok: false, error: err.message });
        Swal.fire({
            title: "خطأ في الفحص",
            text: err.message,
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
}

export function renderServerIPsList(ips) {
    const container = document.getElementById("serverIPsListContainer");
    if (!container) return;

    if (!ips || ips.length === 0) {
        container.innerHTML = `<div style="color: #94a3b8; font-size: 0.8rem;">لم يتم العثور على عناوين IP نشطة. يرجى التأكد من اتصال الجهاز بشبكة أو تشغيل Tailscale.</div>`;
        return;
    }

    container.innerHTML = ips.map(item => {
        const isTailscale = item.type === "tailscale";
        return `
            <div class="ip-badge-item ${isTailscale ? 'tailscale' : ''}">
                <div class="flex items-center gap-2">
                    <i class="fas ${isTailscale ? 'fa-bolt text-teal-600' : 'fa-network-wired text-slate-400'}"></i>
                    <div>
                        <strong class="text-slate-800 font-mono text-sm">${item.ip}</strong>
                        <span class="text-xs text-slate-500 mr-2">(${item.label})</span>
                    </div>
                </div>
                <button type="button" class="btn-copy-ip" onclick="copyIPToClipboard('${item.ip}')" title="نسخ العنوان">
                    <i class="fas fa-copy"></i>
                    <span>نسخ</span>
                </button>
            </div>
        `;
    }).join("");
}

export async function refreshNetworkIPs() {
    try {
        if (!window.electronAPI?.network?.getServerIPs) return;
        const ips = await window.electronAPI.network.getServerIPs();
        renderServerIPsList(ips);
        Swal.fire({
            title: "تم التحديث",
            text: "تم تحديث قائمة عناوين الـ IP المتاحة بنجاح.",
            icon: "success",
            timer: 1200,
            showConfirmButton: false
        });
    } catch (e) {
        console.error("Failed to refresh IPs:", e);
    }
}

export function copyIPToClipboard(ip) {
    navigator.clipboard.writeText(ip).then(() => {
        Swal.fire({
            title: "تم النسخ!",
            text: `تم نسخ عنوان الـ IP (${ip}) إلى الحافظة.`,
            icon: "success",
            timer: 1400,
            showConfirmButton: false
        });
    }).catch(() => {
        const temp = document.createElement("input");
        temp.value = ip;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
        Swal.fire({
            title: "تم النسخ!",
            text: `تم نسخ عنوان الـ IP (${ip}) إلى الحافظة.`,
            icon: "success",
            timer: 1400,
            showConfirmButton: false
        });
    });
}

export function updateClientStatusUI(status) {
    const dot = document.getElementById("clientStatusDot");
    const badge = document.getElementById("clientConnectionBadge");
    const feedback = document.getElementById("connectionFeedback");

    if (!dot || !badge) return;

    if (status.ok) {
        dot.className = "status-indicator-dot online";
        badge.textContent = `متصل بنجاح (${status.latencyMs || 0} ms)`;
        badge.className = "badge badge-success text-xs font-bold";
        if (feedback) {
            feedback.innerHTML = `<span class="text-emerald-600 font-bold"><i class="fas fa-check-circle"></i> متصل بالسيرفر: ${status.serverInfo?.serverName || 'Master'} (${status.serverInfo?.hostname || 'Host'})</span>`;
        }
    } else {
        dot.className = "status-indicator-dot offline";
        badge.textContent = "غير متصل";
        badge.className = "badge badge-error text-xs font-bold text-white";
        if (feedback) {
            feedback.innerHTML = `<span class="text-red-500 font-semibold"><i class="fas fa-circle-xmark"></i> ${status.error || 'تعذر الاتصال بالسيرفر'}</span>`;
        }
    }
}

export async function testClientConnectionAction() {
    const hostInput = document.getElementById("clientHostInput");
    const portInput = document.getElementById("clientPortInput");
    const host = hostInput ? hostInput.value.trim() : "";
    const port = portInput ? Number(portInput.value.trim()) || 4545 : 4545;

    if (!host) {
        if (hostInput && typeof window.markFieldInvalid === "function") {
            window.markFieldInvalid(hostInput, "يرجى إدخال عنوان IP الجهاز الرئيسي");
        }
        return void Swal.fire({
            title: "عنوان الـ IP مطلوب",
            text: "يرجى كتابة عنوان الـ IP للجهاز الرئيسي (مثل IP الـ Tailscale) لفحص الاتصال.",
            icon: "warning",
            confirmButtonColor: "#7c3aed"
        });
    }

    const dot = document.getElementById("clientStatusDot");
    const badge = document.getElementById("clientConnectionBadge");
    const feedback = document.getElementById("connectionFeedback");

    if (dot) dot.className = "status-indicator-dot checking";
    if (badge) {
        badge.textContent = "جاري فحص الاتصال...";
        badge.className = "badge badge-warning text-xs font-bold";
    }
    if (feedback) feedback.textContent = `جاري محاولة الاتصال بـ http://${host}:${port}...`;

    try {
        const result = await window.electronAPI.network.testConnection(host, port);
        updateClientStatusUI(result);

        if (result.ok) {
            Swal.fire({
                title: "الاتصال ناجح! 🟢",
                text: `تم الاتصال بالسيرفر الرئيسي بنجاح (${result.latencyMs} مللي ثانية). الجهاز جاهز لمزامنة الفواتير.`,
                icon: "success",
                confirmButtonColor: "#059669"
            });
        } else {
            Swal.fire({
                title: "فشل الاتصال 🔴",
                text: result.error || "تعذر الوصول إلى الجهاز الرئيسي. تأكد من تشغيل البرنامج على الجهاز الرئيسي وتفعيل Tailscale.",
                icon: "error",
                confirmButtonColor: "#EF4444"
            });
        }
    } catch (err) {
        updateClientStatusUI({ ok: false, error: err.message });
        Swal.fire({
            title: "خطأ في الفحص",
            text: err.message,
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
}

export async function saveNetworkSettingsAction() {
    try {
        const selectedModeEl = document.querySelector('input[name="networkMode"]:checked');
        const mode = selectedModeEl ? selectedModeEl.value : "standalone";

        // Cloud Key inputs
        const cloudKeyEl = document.getElementById("cloudSyncKeyInput");
        const cloudBranchEl = document.getElementById("cloudBranchNameInput");
        const cloudIntervalEl = document.getElementById("cloudSyncIntervalSelect");

        const cloudSyncKey = cloudKeyEl ? cloudKeyEl.value.trim() : "";
        const cloudBranchName = cloudBranchEl ? cloudBranchEl.value.trim() : "";
        const cloudSyncInterval = cloudIntervalEl ? Number(cloudIntervalEl.value) || 15 : 15;

        // Custom Cloud inputs
        const customUrlEl = document.getElementById("cloudCustomUrlInput");
        const customApiKeyEl = document.getElementById("cloudApiKeyInput");
        const customPinEl = document.getElementById("cloudSecurityPinInput");

        const cloudCustomUrl = customUrlEl ? customUrlEl.value.trim() : "";
        const cloudApiKey = customApiKeyEl ? customApiKeyEl.value.trim() : "";
        const securityPin = customPinEl ? customPinEl.value.trim() : "";

        // Server / Client inputs
        const serverPortEl = document.getElementById("serverPortInput");
        const serverNameEl = document.getElementById("serverDeviceNameInput");
        const clientHostEl = document.getElementById("clientHostInput");
        const clientPortEl = document.getElementById("clientPortInput");

        const serverPort = serverPortEl ? Number(serverPortEl.value) || 4545 : 4545;
        const deviceName = serverNameEl ? serverNameEl.value.trim() : "";
        const serverHost = clientHostEl ? clientHostEl.value.trim() : "127.0.0.1";
        const clientPort = clientPortEl ? Number(clientPortEl.value) || 4545 : 4545;

        // Validations
        if (mode === "cloud_key" && !cloudSyncKey) {
            if (cloudKeyEl && typeof window.markFieldInvalid === "function") {
                window.markFieldInvalid(cloudKeyEl, "يرجى إدخال كود المزامنة السحابي");
            }
            return void Swal.fire({
                title: "بيانات غير مكتملة",
                text: "يرجى إدخال كود المزامنة السحابي (Cloud Sync Key) أو توليد كود جديد قبل الحفظ.",
                icon: "warning",
                confirmButtonColor: "#d97706"
            });
        }

        if (mode === "cloud_custom" && !cloudCustomUrl) {
            if (customUrlEl && typeof window.markFieldInvalid === "function") {
                window.markFieldInvalid(customUrlEl, "يرجى إدخال رابط الخادم السحابي");
            }
            return void Swal.fire({
                title: "بيانات غير مكتملة",
                text: "يرجى إدخال رابط الخادم السحابي المخصص (Endpoint URL) قبل الحفظ.",
                icon: "warning",
                confirmButtonColor: "#0284c7"
            });
        }

        if (mode === "client" && !serverHost) {
            if (clientHostEl && typeof window.markFieldInvalid === "function") {
                window.markFieldInvalid(clientHostEl, "يرجى إدخال عنوان IP الجهاز الرئيسي");
            }
            return void Swal.fire({
                title: "بيانات غير مكتملة",
                text: "يرجى إدخال عنوان IP الخاص بالجهاز الرئيسي عند اختيار وضع الجهاز الفرعي (Client).",
                icon: "warning",
                confirmButtonColor: "#7c3aed"
            });
        }

        const configPayload = {
            mode,
            cloudSyncKey,
            cloudBranchName,
            cloudSyncInterval,
            cloudCustomUrl,
            cloudApiKey,
            securityPin,
            serverPort: mode === "server" ? serverPort : clientPort,
            serverHost,
            deviceName
        };

        await window.electronAPI.network.saveConfig(configPayload);

        let modeDesc = "جهاز مستقل (فردي - أوفلاين)";
        if (mode === "cloud_key") modeDesc = `الربط السحابي الذكي (كود: ${cloudSyncKey})`;
        if (mode === "cloud_custom") modeDesc = `سيرفر سحابي مخصص (${cloudCustomUrl})`;
        if (mode === "server") modeDesc = `جهاز رئيسي (Master Server على المنفذ ${serverPort})`;
        if (mode === "client") modeDesc = `جهاز فرعي متصل بـ (${serverHost}:${clientPort})`;

        Swal.fire({
            title: "تم حفظ وتفعيل إعدادات الربط! 🌐",
            html: `تم ضبط وضع النظام بنجاح على: <strong>${modeDesc}</strong>.<br><span style="font-size: 0.85rem; color: #0d9488;">التغييرات أصبحت سارية المفعول فوراً.</span>`,
            icon: "success",
            confirmButtonColor: "#0d9488"
        });

        loadNetworkSettings();
    } catch (err) {
        console.error("Error saving network settings:", err);
        Swal.fire({
            title: "خطأ في الحفظ",
            text: "حدث خطأ أثناء حفظ إعدادات الشبكة: " + err.message,
            icon: "error",
            confirmButtonColor: "#EF4444"
        });
    }
}

export async function handleCloudUploadAll() {
    Swal.fire({
        title: "رفع البيانات الحالية للسحابة؟",
        text: "سيتم رفع جميع المنتجات والفئات والعملاء والفواتير الحالية من هذا الجهاز إلى قاعدة بيانات السحابة.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#0284c7",
        cancelButtonColor: "#64748b",
        confirmButtonText: "نعم، ابدأ الرفع الآن",
        cancelButtonText: "إلغاء"
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: "جاري الرفع...",
                text: "يرجى الانتظار، جاري تصدير ومزامنة البيانات مع السحابة...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                const res = await window.electronAPI.network.syncUploadAll();
                Swal.fire({
                    title: "تم الرفع بنجاح! ☁️🟢",
                    text: `تم رفع ومزامنة (${res.totalUploaded || 0}) عنصراً بنجاح إلى قاعدة البيانات السحابية.`,
                    icon: "success",
                    confirmButtonColor: "#0284c7"
                });
            } catch (err) {
                Swal.fire({
                    title: "فشل الرفع",
                    text: err.message || "حدث خطأ أثناء رفع البيانات إلى السحابة. تأكد من تشغيل كود إنشاء الجدول في Supabase.",
                    icon: "error",
                    confirmButtonColor: "#EF4444"
                });
            }
        }
    });
}

export async function handleCloudDownloadAll() {
    Swal.fire({
        title: "سحب البيانات من السحابة؟",
        text: "سيتم تنزيل وتحديث جميع الأصناف والفواتير والحسابات الموجودة في السحابة على هذا الجهاز.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#0284c7",
        cancelButtonColor: "#64748b",
        confirmButtonText: "نعم، اسحب البيانات الآن",
        cancelButtonText: "إلغاء"
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: "جاري السحب...",
                text: "يرجى الانتظار، جاري تنزيل وتحديث البيانات من السحابة...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            try {
                const res = await window.electronAPI.network.syncDownloadAll();
                Swal.fire({
                    title: "تم السحب بنجاح! ☁️🟢",
                    text: `تم استيراد وتحديث (${res.totalDownloaded || 0}) عنصراً بنجاح من السحابة إلى هذا الجهاز.`,
                    icon: "success",
                    confirmButtonColor: "#0284c7"
                });
            } catch (err) {
                Swal.fire({
                    title: "فشل السحب",
                    text: err.message || "حدث خطأ أثناء سحب البيانات من السحابة.",
                    icon: "error",
                    confirmButtonColor: "#EF4444"
                });
            }
        }
    });
}

// Window bindings
window.loadNetworkSettings = loadNetworkSettings;
window.refreshNetworkIPs = refreshNetworkIPs;
window.copyIPToClipboard = copyIPToClipboard;
window.generateRandomCloudKey = generateRandomCloudKey;
window.testCloudKeyConnectionAction = testCloudKeyConnectionAction;
window.testCustomCloudConnectionAction = testCustomCloudConnectionAction;
window.testClientConnectionAction = testClientConnectionAction;
window.saveNetworkSettingsAction = saveNetworkSettingsAction;
window.handleCloudUploadAll = handleCloudUploadAll;
window.handleCloudDownloadAll = handleCloudDownloadAll;

// Event Listeners for Network Settings Card
document.addEventListener("DOMContentLoaded", () => {
    // Mode radio toggle
    document.querySelectorAll('input[name="networkMode"]').forEach(radio => {
        radio.addEventListener("change", (e) => {
            updateNetworkModePanels(e.target.value);
        });
    });

    // Quick Action: Generate Cloud Key
    const btnGenKey = document.getElementById("btnGenerateCloudKey");
    if (btnGenKey) btnGenKey.addEventListener("click", generateRandomCloudKey);

    // Buttons: Test Connections
    const btnTestCloud = document.getElementById("btnTestCloudKeyConnection");
    if (btnTestCloud) btnTestCloud.addEventListener("click", testCloudKeyConnectionAction);

    const btnTestCustom = document.getElementById("btnTestCustomCloudConnection");
    if (btnTestCustom) btnTestCustom.addEventListener("click", testCustomCloudConnectionAction);

    const btnTestClient = document.getElementById("btnTestNetworkConnection");
    if (btnTestClient) btnTestClient.addEventListener("click", testClientConnectionAction);

    // Cloud Upload / Download All Buttons
    const btnUploadCustom = document.getElementById("btnCloudUploadAllCustom");
    if (btnUploadCustom) btnUploadCustom.addEventListener("click", handleCloudUploadAll);

    const btnDownloadCustom = document.getElementById("btnCloudDownloadAllCustom");
    if (btnDownloadCustom) btnDownloadCustom.addEventListener("click", handleCloudDownloadAll);

    const btnRefresh = document.getElementById("btnRefreshIPs");
    if (btnRefresh) btnRefresh.addEventListener("click", refreshNetworkIPs);

    const btnSaveNet = document.getElementById("btnSaveNetworkSettings");
    if (btnSaveNet) btnSaveNet.addEventListener("click", saveNetworkSettingsAction);

    // Toggle Password/Key Visibility for Custom Cloud Settings
    const togglePinBtn = document.getElementById("toggleCloudSecurityPin");
    if (togglePinBtn) {
        togglePinBtn.addEventListener("click", () => {
            togglePasswordVisibility("cloudSecurityPinInput", togglePinBtn);
        });
    }

    const toggleApiKeyBtn = document.getElementById("toggleCloudApiKey");
    if (toggleApiKeyBtn) {
        toggleApiKeyBtn.addEventListener("click", () => {
            togglePasswordVisibility("cloudApiKeyInput", toggleApiKeyBtn);
        });
    }
});