import { formatUserFriendlyMessage, initSweetAlertWrapper } from './shared.js';

// Initialize SweetAlert wrapper
initSweetAlertWrapper();

// Constants
export const PAGE_PERMISSION_KEYS = [
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
    'settings',
    'users'
];

export const ACTION_PERMISSION_KEYS = [
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

export const ROLE_NAMES = {
    admin: 'مدير عام',
    cashier: 'كاشير',
    inventory: 'مسؤول مخزن',
    accountant: 'محاسب مالي',
    custom: 'مخصص'
};

export const ROLE_PRESETS = {
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
            settings: true,
            users: true
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
            settings: false,
            users: false
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
            settings: false,
            users: false
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
            settings: false,
            users: false
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

let allUsersCache = [];

// ==========================================
// Initialization & Loading
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

export async function loadUsers() {
    const grid = document.getElementById("usersGrid");
    if (!grid) return;

    try {
        if (!window.electronAPI || typeof window.electronAPI.getUsers !== "function") {
            grid.innerHTML = `
                <div class="empty-users-state">
                    <i class="fas fa-exclamation-triangle empty-icon" style="color: #f59e0b;"></i>
                    <h3>تعذر الاتصال بقاعدة بيانات المستخدمين</h3>
                    <p>يرجى التأكد من تشغيل البرنامج بشكل سليم.</p>
                </div>
            `;
            return;
        }

        const users = await window.electronAPI.getUsers();
        allUsersCache = users || [];

        updateStatsPills(allUsersCache);
        filterUsers();
    } catch (err) {
        console.error("Error loading users:", err);
        grid.innerHTML = `
            <div class="empty-users-state">
                <i class="fas fa-circle-xmark empty-icon" style="color: #ef4444;"></i>
                <h3>حدث خطأ أثناء تحميل المستخدمين</h3>
                <p>${err.message || 'يرجى إعادة المحاولة.'}</p>
            </div>
        `;
    }
}

function updateStatsPills(users) {
    const total = users.length;
    const active = users.filter(u => u.status !== 'inactive').length;
    const admins = users.filter(u => u.role === 'admin' || u.isSuperAdmin).length;
    const staff = total - admins;

    const totalEl = document.getElementById("totalUsersStat");
    const activeEl = document.getElementById("activeUsersStat");
    const adminEl = document.getElementById("adminUsersStat");
    const staffEl = document.getElementById("staffUsersStat");

    if (totalEl) totalEl.textContent = `${total} مستخدم`;
    if (activeEl) activeEl.textContent = active;
    if (adminEl) adminEl.textContent = admins;
    if (staffEl) staffEl.textContent = staff;
}

export function filterUsers() {
    const searchInput = document.getElementById("searchUserInput");
    const query = (searchInput?.value || "").trim().toLowerCase();
    const role = document.getElementById("roleFilter")?.value || "all";
    const status = document.getElementById("statusFilter")?.value || "all";

    // Toggle clear search button
    const clearBtn = document.getElementById("clearUserSearchBtn");
    if (clearBtn) {
        if (query.length > 0) {
            clearBtn.classList.remove("hidden");
        } else {
            clearBtn.classList.add("hidden");
        }
    }

    let filtered = allUsersCache.filter(user => {
        // Search text
        if (query) {
            const name = (user.name || "").toLowerCase();
            const username = (user.username || "").toLowerCase();
            const email = (user.email || "").toLowerCase();
            const phone = (user.phone || "").toLowerCase();
            const match = name.includes(query) || username.includes(query) || email.includes(query) || phone.includes(query);
            if (!match) return false;
        }

        // Role filter
        if (role !== "all") {
            if (role === "admin") {
                if (!user.isSuperAdmin && user.role !== "admin") return false;
            } else if (user.role !== role) {
                return false;
            }
        }

        // Status filter
        if (status !== "all") {
            const isActive = user.status !== "inactive";
            if (status === "active" && !isActive) return false;
            if (status === "inactive" && isActive) return false;
        }

        return true;
    });

    renderUsers(filtered);
}

export function clearUserSearch() {
    const input = document.getElementById("searchUserInput");
    if (input) {
        input.value = "";
        input.focus();
    }
    filterUsers();
}

export function resetUserFilters() {
    const searchInput = document.getElementById("searchUserInput");
    const roleFilter = document.getElementById("roleFilter");
    const statusFilter = document.getElementById("statusFilter");

    if (searchInput) searchInput.value = "";
    if (roleFilter) {
        roleFilter.value = "all";
        if (typeof roleFilter._syncCustomSelect === "function") roleFilter._syncCustomSelect();
    }
    if (statusFilter) {
        statusFilter.value = "all";
        if (typeof statusFilter._syncCustomSelect === "function") statusFilter._syncCustomSelect();
    }
    filterUsers();
}

export function quickFilterStatus(status) {
    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
        statusFilter.value = status;
        if (typeof statusFilter._syncCustomSelect === "function") statusFilter._syncCustomSelect();
    }
    filterUsers();
}

export function quickFilterRole(role) {
    const roleFilter = document.getElementById("roleFilter");
    if (roleFilter) {
        roleFilter.value = role;
        if (typeof roleFilter._syncCustomSelect === "function") roleFilter._syncCustomSelect();
    }
    filterUsers();
}

export function renderUsers(users) {
    const grid = document.getElementById("usersGrid");
    if (!grid) return;

    if (!users || users.length === 0) {
        grid.innerHTML = `
            <div class="empty-users-state">
                <i class="fas fa-users-slash empty-icon"></i>
                <h3>لا توجد نتائج مطابقة</h3>
                <p>لم نتمكن من العثور على أي مستخدم يطابق معايير البحث الحالية.</p>
                <button type="button" onclick="openAddUserModal()" class="btn-add-user-header" style="margin: 12px auto 0;">
                    <i class="fas fa-user-plus"></i> إضافة مستخدم جديد
                </button>
            </div>
        `;
        return;
    }

    const roleBadgeConfigs = {
        admin: { text: 'مدير عام', class: 'role-admin', icon: 'fa-crown' },
        cashier: { text: 'كاشير', class: 'role-cashier', icon: 'fa-cash-register' },
        inventory: { text: 'مسؤول مخزن', class: 'role-inventory', icon: 'fa-boxes-stacked' },
        accountant: { text: 'محاسب مالي', class: 'role-accountant', icon: 'fa-briefcase' },
        custom: { text: 'مخصص', class: 'role-custom', icon: 'fa-sliders' }
    };

    grid.innerHTML = users.map(user => {
        const isSuper = !!user.isSuperAdmin;
        const isActive = user.status !== 'inactive';
        const roleInfo = roleBadgeConfigs[user.role] || roleBadgeConfigs.custom;
        const initial = (user.name || user.username || 'م').trim().charAt(0);

        const pagePerms = user.permissions?.pages || {};
        const actionPerms = user.permissions?.actions || {};
        const pageCount = isSuper ? 16 : Object.values(pagePerms).filter(Boolean).length;
        const actionCount = isSuper ? 17 : Object.values(actionPerms).filter(Boolean).length;

        // Permissions preview labels
        const pageNamesMap = {
            home: 'الرئيسية',
            salesInvoice: 'الكاشير',
            sales: 'المبيعات',
            products: 'المنتجات',
            categories: 'الفئات',
            customers: 'العملاء',
            suppliers: 'الموردين',
            purchaseInvoices: 'المشتريات',
            productsPurchaseInvoices: 'توريد البضائع',
            returns: 'المرتجعات',
            treasury: 'الخزنة',
            statistics: 'الإحصائيات',
            employees: 'الموظفين',
            printerSettings: 'الطابعة',
            settings: 'الإعدادات',
            users: 'المستخدمين'
        };

        const activePagesList = Object.keys(pagePerms).filter(k => pagePerms[k]);
        let pillsHtml = '';
        if (isSuper) {
            pillsHtml = `<span class="perm-pill more" style="background: #fef3c7; color: #b45309;"><i class="fas fa-star" style="color: #f59e0b;"></i> صلاحيات كاملة وشاملة</span>`;
        } else if (activePagesList.length === 0) {
            pillsHtml = `<span class="perm-pill" style="color: #94a3b8;">لا توجد شاشات محددة</span>`;
        } else {
            const preview = activePagesList.slice(0, 3).map(k => `<span class="perm-pill">${pageNamesMap[k] || k}</span>`).join('');
            const remaining = activePagesList.length - 3;
            pillsHtml = preview + (remaining > 0 ? `<span class="perm-pill more">+${remaining} أخرى</span>` : '');
        }

        return `
            <div class="user-card ${isSuper ? 'super-admin-card' : ''}">
                <div>
                    <div class="user-card-top">
                        <div class="user-card-profile">
                            <div class="user-avatar-circle">
                                <span>${initial}</span>
                            </div>
                            <div class="user-info-text">
                                <h3>${user.name}</h3>
                                <span class="user-username-tag">@${user.username}</span>
                            </div>
                        </div>
                        <span class="user-role-badge ${roleInfo.class}"><i class="fas ${roleInfo.icon}"></i> <span>${roleInfo.text}</span></span>
                    </div>

                    <div class="user-card-details">
                        <div class="detail-row">
                            <i class="fas fa-envelope"></i>
                            <span title="${user.email || 'غير مسجل'}">${user.email || 'بدون بريد إلكتروني'}</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-phone"></i>
                            <span>${user.phone || 'بدون رقم هاتف'}</span>
                        </div>
                    </div>

                    <div class="permissions-preview-wrap">
                        <div class="permissions-preview-header">
                            <span><i class="fas fa-shield-alt text-primary"></i> الصلاحيات المتاحة</span>
                            <span style="font-size: 0.72rem; color: #64748b;">${pageCount}/16 شاشة • ${actionCount}/17 عملية</span>
                        </div>
                        <div class="permissions-pills-list">
                            ${pillsHtml}
                        </div>
                    </div>
                </div>

                <div class="user-card-actions">
                    <div class="user-status-switch" onclick="${!isSuper ? `toggleUserStatus('${user._id}', '${user.status || 'active'}')` : ''}" style="${isSuper ? 'cursor: default;' : ''}">
                        <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                            <i class="fas ${isActive ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
                            ${isActive ? 'حساب نشط' : 'حساب معطل'}
                        </span>
                    </div>

                    <div class="action-buttons-group">
                        <button type="button" class="btn-card-action btn-action-edit" onclick="openEditUserModal('${user._id}')" title="تعديل البيانات والصلاحيات">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button type="button" class="btn-card-action btn-action-pwd" onclick="openChangePasswordModal('${user._id}', '${user.name.replace(/'/g, "\\'")}')" title="تغيير كلمة المرور">
                            <i class="fas fa-key"></i>
                        </button>
                        ${!isSuper ? `
                            <button type="button" class="btn-card-action btn-action-delete" onclick="deleteUserConfirm('${user._id}', '${user.name.replace(/'/g, "\\'")}')" title="حذف المستخدم">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// ==========================================
// Modal Operations (Add / Edit User)
// ==========================================
export function openAddUserModal() {
    const modal = document.getElementById("userModal");
    if (!modal) return;

    document.getElementById("editingUserId").value = "";
    document.getElementById("userModalTitle").textContent = "إضافة مستخدم جديد";
    document.getElementById("userModalSubtitle").textContent = "تحديد بيانات الدخول والأدوار ومصفوفة الصلاحيات";

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

    // Enable role select
    const roleSelect = document.getElementById("userRoleSelect");
    if (roleSelect) {
        roleSelect.disabled = false;
        roleSelect.value = "cashier";
    }

    const inactiveRadio = document.getElementById("userStatusInactive");
    if (activeRadio) activeRadio.disabled = false;
    if (inactiveRadio) inactiveRadio.disabled = false;

    // Default cashier preset
    onRolePresetChange("cashier");

    modal.classList.remove("hidden");
    modal.classList.add("open");
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
        document.getElementById("userModalTitle").textContent = `تعديل المستخدم: ${user.name}`;
        document.getElementById("userModalSubtitle").textContent = "تعديل بيانات الحساب وتحديث الصلاحيات الممنوحة";

        document.getElementById("userFullName").value = user.name || "";
        document.getElementById("userUsername").value = user.username || "";
        document.getElementById("userEmail").value = user.email || "";
        document.getElementById("userPhone").value = user.phone || "";

        // In edit mode, password is optional
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
                chk.checked = user.isSuperAdmin ? true : pagePerms[key] === true;
            }
        });

        // Populate action permissions
        const actPerms = user.permissions?.actions || {};
        ACTION_PERMISSION_KEYS.forEach(key => {
            const chk = document.getElementById(`perm_act_${key}`);
            if (chk) {
                chk.checked = user.isSuperAdmin ? true : actPerms[key] === true;
            }
        });

        modal.classList.remove("hidden");
        modal.classList.add("open");
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
    if (modal) {
        modal.classList.remove("open");
        modal.classList.add("hidden");
    }
}

export function handleUserModalOverlayClick(e) {
    if (e.target.id === "userModal") {
        closeUserModal();
    }
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

            // If current session is the updated user, update localStorage
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
                    text: `تم حذف حساب المستخدم (${userName}) بنجاح.`,
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

// ==========================================
// Change User Password Modal
// ==========================================
export function openChangePasswordModal(userId, userName) {
    const modal = document.getElementById("changeUserPasswordModal");
    if (!modal) return;

    document.getElementById("pwdTargetUserId").value = userId;
    const disp = document.getElementById("pwdTargetUserDisplay");
    if (disp) disp.textContent = `المستخدم: ${userName || '--'}`;

    const pwd1 = document.getElementById("newCustomPassword");
    const pwd2 = document.getElementById("newCustomPasswordConfirm");
    if (pwd1) pwd1.value = "";
    if (pwd2) pwd2.value = "";

    modal.classList.remove("hidden");
    modal.classList.add("open");
}

export function closeChangePasswordModal() {
    const modal = document.getElementById("changeUserPasswordModal");
    if (modal) {
        modal.classList.remove("open");
        modal.classList.add("hidden");
    }
}

export function handleChangePwdModalOverlayClick(e) {
    if (e.target.id === "changeUserPasswordModal") {
        closeChangePasswordModal();
    }
}

export async function handleSaveChangedPassword(event) {
    if (event) event.preventDefault();

    const userId = document.getElementById("pwdTargetUserId")?.value;
    const newPwd = document.getElementById("newCustomPassword")?.value.trim();
    const newPwdConfirm = document.getElementById("newCustomPasswordConfirm")?.value.trim();

    if (!userId) {
        return void Swal.fire({ title: "خطأ", text: "معرف المستخدم غير محدد.", icon: "error" });
    }

    if (!newPwd || newPwd.length < 4) {
        return void Swal.fire({
            title: "كلمة مرور ضعيفة",
            text: "يجب ألا تقل كلمة المرور الجديدة عن 4 أحرف أو أرقام.",
            icon: "warning"
        });
    }

    if (newPwd !== newPwdConfirm) {
        return void Swal.fire({
            title: "تأكيد كلمة المرور",
            text: "كلمتا المرور غير متطابقتين، يرجى إعادة التأكد.",
            icon: "error"
        });
    }

    try {
        await window.electronAPI.changeUserPassword(userId, newPwd);
        Swal.fire({
            title: "تم تغيير كلمة المرور!",
            text: "تم تحديث كلمة المرور للمستخدم بنجاح.",
            icon: "success",
            timer: 1600,
            showConfirmButton: false
        });
        closeChangePasswordModal();
    } catch (err) {
        console.error("Error changing password:", err);
        Swal.fire({
            title: "تعذر تغيير كلمة المرور",
            text: err.message || "حدث خطأ أثناء محاولة تحديث كلمة المرور.",
            icon: "error"
        });
    }
}

export function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    const icon = btn.querySelector("i") || btn;
    if (icon) {
        if (isPassword) {
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }
}

// Global window exposure for HTML onclick handlers
if (typeof window !== "undefined") {
    window.loadUsers = loadUsers;
    window.filterUsers = filterUsers;
    window.clearUserSearch = clearUserSearch;
    window.resetUserFilters = resetUserFilters;
    window.quickFilterStatus = quickFilterStatus;
    window.quickFilterRole = quickFilterRole;
    window.openAddUserModal = openAddUserModal;
    window.openEditUserModal = openEditUserModal;
    window.closeUserModal = closeUserModal;
    window.handleUserModalOverlayClick = handleUserModalOverlayClick;
    window.onRolePresetChange = onRolePresetChange;
    window.setAllPagePermissions = setAllPagePermissions;
    window.setAllActionPermissions = setAllActionPermissions;
    window.handleSaveUser = handleSaveUser;
    window.toggleUserStatus = toggleUserStatus;
    window.deleteUserConfirm = deleteUserConfirm;
    window.openChangePasswordModal = openChangePasswordModal;
    window.closeChangePasswordModal = closeChangePasswordModal;
    window.handleChangePwdModalOverlayClick = handleChangePwdModalOverlayClick;
    window.handleSaveChangedPassword = handleSaveChangedPassword;
    window.togglePasswordVisibility = togglePasswordVisibility;
}
