let phoneFieldsCount = 0;

export function addPhoneNumberField() {
    phoneFieldsCount++;
    const container = document.getElementById("phoneNumbers");
    const div = document.createElement("div");
    div.classList.add("flex", "items-center", "gap-2");
    div.innerHTML = `
        <input id="phoneNumber${phoneFieldsCount}" type="text" class="input input-primary bg-transparent my-2 text-black w-full" placeholder="أدخل رقم الهاتف">
        <button type="button" onclick="removePhoneNumberField(this)" class="btn btn-error btn-sm">
            <i class="fas fa-trash"></i>
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
    const placeholder = document.getElementById("logoPlaceholder");
    if (input.files && input.files[0]) {
        const reader = new FileReader;
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.remove("hidden");
            placeholder.classList.add("hidden");
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.classList.add("hidden");
        placeholder.classList.remove("hidden");
    }
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
        if (logoInput.files && logoInput.files[0]) {
            logoData = await new Promise(resolve => {
                const reader = new FileReader;
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(logoInput.files[0]);
            });
        }

        const currentSettings = (await window.electronAPI.getSettings()) || {};
        const newSettings = {
            ...currentSettings,
            storeName,
            phoneNumbers: phones,
            storeLocation,
            logo: logoData || currentSettings.logo || ""
        };

        await window.electronAPI.saveSettings(newSettings);
        Swal.fire({
            title: "تم الحفظ",
            text: "تم حفظ الإعدادات بنجاح.",
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

        if (!settings) settings = {};

        if (!settings.storeName || !settings.storeLocation || !settings.phoneNumbers || !Array.isArray(settings.phoneNumbers) || settings.phoneNumbers.length === 0) {
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
        if (phoneContainer && settings.phoneNumbers && Array.isArray(settings.phoneNumbers)) {
            phoneContainer.innerHTML = "";
            phoneFieldsCount = 0;
            settings.phoneNumbers.forEach(p => {
                phoneFieldsCount++;
                const div = document.createElement("div");
                div.classList.add("flex", "items-center", "gap-2");
                div.innerHTML = `
                    <input id="phoneNumber${phoneFieldsCount}" type="text" class="input input-primary my-2 bg-transparent w-full text-black" value="${p}">
                    <button type="button" onclick="removePhoneNumberField(this)" class="btn btn-error btn-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                phoneContainer.appendChild(div);
            });
        }

        if (settings.logo && preview && placeholder) {
            preview.src = settings.logo;
            preview.classList.remove("hidden");
            placeholder.classList.add("hidden");
        } else if (preview && placeholder) {
            preview.classList.add("hidden");
            placeholder.classList.remove("hidden");
        }

        if (emailInput) emailInput.value = settings.email || "";
        if (passInput) passInput.value = "";
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
    const statusText = document.getElementById("updateStatusText");
    const statusIcon = document.getElementById("updateStatusIcon");
    const btnCheck = document.getElementById("btnCheckUpdateManual");
    const checkIcon = document.getElementById("checkUpdateIcon");
    const lastCheckTime = document.getElementById("lastCheckTime");

    if (!window.electronAPI?.updater) return;

    try {
        const ver = await window.electronAPI.updater.getVersion();
        if (ver && versionBadge) {
            versionBadge.textContent = `v${ver}`;
        }
    } catch (e) {
        console.warn("Failed to get app version:", e);
    }

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

export function loadEmailAndPasswordSettings() {
    document.addEventListener("DOMContentLoaded", () => {
        loadSettings();
    });
}

window.addPhoneNumberField = addPhoneNumberField;
window.removePhoneNumberField = removePhoneNumberField;
window.saveSettings = saveSettings;
window.previewLogo = previewLogo;