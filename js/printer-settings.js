const electronAPI = window.electronAPI;

const printerListDiv = document.getElementById('printer-list');
const saveBtn = document.getElementById('save-btn');
const testPrintBtn = document.getElementById('test-print-btn');
const refreshBtn = document.getElementById('refresh-btn');
const headerStatusPill = document.getElementById('headerStatusPill');
const headerStatusIcon = document.getElementById('headerStatusIcon');
const headerStatusText = document.getElementById('headerStatusText');
const activePrinterName = document.getElementById('activePrinterName');
const activePrinterMeta = document.getElementById('activePrinterMeta');

let selectedPrinter = null;
let currentDefaultPrinter = null;
let printers = [];

async function loadPrinters() {
    if (!printerListDiv) return;

    // Loading State
    printerListDiv.innerHTML = `
        <div class="printer-loading-state">
            <i class="fas fa-circle-notch spinner-icon"></i>
            <span>جاري الكشف عن الطابعات المتصلة بالجهاز...</span>
        </div>
    `;
    if (saveBtn) saveBtn.disabled = true;
    if (testPrintBtn) testPrintBtn.disabled = true;
    if (headerStatusPill) {
        headerStatusPill.className = "header-status-pill";
    }
    if (headerStatusIcon) {
        headerStatusIcon.className = "fas fa-spinner fa-spin";
    }
    if (headerStatusText) {
        headerStatusText.textContent = "جاري فحص الطابعات...";
    }

    try {
        if (!electronAPI || !electronAPI.getAllPrinters) {
            throw new Error("Electron API غير متوفر");
        }

        printers = await electronAPI.getAllPrinters();
        currentDefaultPrinter = await electronAPI.getDefaultPrinterSetting();

        if (!printers || printers.length === 0) {
            printerListDiv.innerHTML = `
                <div class="printer-empty-state">
                    <i class="fas fa-print-slash" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 8px;"></i>
                    <h3 style="font-weight: 800; font-size: 1.1rem; margin: 0; color: #475569;">لم يتم العثور على أي طابعات متصلة</h3>
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0;">تأكد من توصيل كابل الطابعة بالكمبيوتر وتثبيت التعريف الخاص بها.</p>
                </div>
            `;
            if (headerStatusPill) headerStatusPill.className = "header-status-pill empty";
            if (headerStatusIcon) headerStatusIcon.className = "fas fa-triangle-exclamation";
            if (headerStatusText) headerStatusText.textContent = "لا توجد طابعات";
            if (activePrinterName) activePrinterName.textContent = "غير متوفرة";
            if (activePrinterMeta) activePrinterMeta.textContent = "يرجى توصيل طابعة أولاً";
            return;
        }

        // Determine initially selected printer
        selectedPrinter = currentDefaultPrinter || printers.find(p => p.isDefault)?.name || printers[0].name;

        // Render modern printer cards
        printerListDiv.innerHTML = printers.map(printer => {
            const isSelected = selectedPrinter === printer.name;
            const isSysDefault = printer.isDefault;
            const isAppDefault = currentDefaultPrinter === printer.name;

            return `
                <div class="printer-card ${isSelected ? 'selected' : ''}" data-name="${printer.name}">
                    <div class="printer-card-main">
                        <input type="radio" name="printer" value="${printer.name}" id="printer-${encodeURIComponent(printer.name)}" class="printer-card-radio" ${isSelected ? 'checked' : ''}>
                        <div class="printer-card-icon-box">
                            <i class="fas fa-print"></i>
                            <span class="printer-online-dot" title="متصلة"></span>
                        </div>
                        <div class="printer-card-info">
                            <label for="printer-${encodeURIComponent(printer.name)}" class="printer-card-name" style="cursor: pointer;">
                                ${printer.name}
                            </label>
                            <span class="printer-card-desc">
                                ${printer.description ? printer.description : 'طابعة مستندات وإيصالات'}
                                ${printer.status ? ' - الحالة: ' + printer.status : ''}
                            </span>
                        </div>
                    </div>
                    <div class="printer-card-badges">
                        ${isAppDefault ? '<span class="badge-printer-app-default"><i class="fas fa-star"></i> الطابعة الافتراضية للنظام</span>' : ''}
                        ${isSysDefault ? '<span class="badge-printer-default"><i class="fas fa-desktop"></i> طابعة الويندوز الافتراضية</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Header Status
        if (headerStatusPill) headerStatusPill.className = "header-status-pill ready";
        if (headerStatusIcon) headerStatusIcon.className = "fas fa-circle-check";
        if (headerStatusText) headerStatusText.textContent = `متصل: ${printers.length} طابعة`;

        // Enable buttons
        if (saveBtn) saveBtn.disabled = false;
        if (testPrintBtn) testPrintBtn.disabled = false;

        // Update preview
        updateActivePrinterPreview();

        // Attach Click & Radio Events
        document.querySelectorAll('.printer-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const name = card.dataset.name;
                const radio = card.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
                selectPrinterCard(name);
            });
        });

        document.querySelectorAll('input[name="printer"]').forEach(input => {
            input.addEventListener('change', e => {
                selectPrinterCard(e.target.value);
            });
        });

    } catch (err) {
        console.error("Error loading printers:", err);
        printerListDiv.innerHTML = `
            <div class="printer-empty-state">
                <i class="fas fa-triangle-exclamation" style="font-size: 2.5rem; color: #ef4444; margin-bottom: 8px;"></i>
                <h3 style="font-weight: 800; font-size: 1.1rem; margin: 0; color: #991b1b;">تعذر الكشف عن قائمة الطابعات</h3>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0;">يرجى التأكد من تشغيل خدمة الطباعة (Print Spooler) في النظام.</p>
            </div>
        `;
        if (headerStatusPill) headerStatusPill.className = "header-status-pill empty";
        if (headerStatusIcon) headerStatusIcon.className = "fas fa-circle-exclamation";
        if (headerStatusText) headerStatusText.textContent = "خطأ في الاتصال";
    }
}

function selectPrinterCard(printerName) {
    selectedPrinter = printerName;
    document.querySelectorAll('.printer-card').forEach(card => {
        if (card.dataset.name === printerName) {
            card.classList.add('selected');
            const radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        } else {
            card.classList.remove('selected');
        }
    });
    updateActivePrinterPreview();
}

function updateActivePrinterPreview() {
    if (!activePrinterName) return;
    if (selectedPrinter) {
        activePrinterName.textContent = selectedPrinter;
        const matched = printers.find(p => p.name === selectedPrinter);
        if (activePrinterMeta) {
            if (currentDefaultPrinter === selectedPrinter) {
                activePrinterMeta.innerHTML = `<span style="color: #059669; font-weight: 800;">✓ هذه هي الطابعة الافتراضية المعتمدة حالياً للبرنامج</span>`;
            } else {
                activePrinterMeta.textContent = matched?.description || "جاهزة لتعيينها كطابعة افتراضية";
            }
        }
    } else {
        activePrinterName.textContent = "لم يتم التحديد";
        if (activePrinterMeta) activePrinterMeta.textContent = "اختر طابعة من القائمة";
    }
}

// Save Default Printer
if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
        if (!selectedPrinter) {
            return Swal.fire({
                icon: "warning",
                title: "تنبيه",
                text: "يرجى تحديد طابعة من القائمة أولاً.",
                confirmButtonColor: "#6d28d9"
            });
        }

        saveBtn.disabled = true;
        try {
            await electronAPI.setDefaultPrinterSetting(selectedPrinter);
            currentDefaultPrinter = selectedPrinter;

            Swal.fire({
                icon: "success",
                title: "تم الحفظ بنجاح",
                text: `تم تعيين [${selectedPrinter}] كطابعة افتراضية لجميع الفواتير والإيصالات.`,
                timer: 2000,
                showConfirmButton: false
            });

            // Reload cards to update badges
            await loadPrinters();
        } catch (err) {
            console.error("Error saving default printer:", err);
            Swal.fire({
                icon: "error",
                title: "تعذر الحفظ",
                text: "حدث خطأ أثناء حفظ إعدادات الطابعة، يرجى المحاولة لاحقاً.",
                confirmButtonColor: "#dc2626"
            });
        } finally {
            saveBtn.disabled = false;
        }
    });
}

// Test Print
if (testPrintBtn) {
    testPrintBtn.addEventListener('click', async () => {
        if (!selectedPrinter) {
            return Swal.fire({
                icon: "warning",
                title: "تنبيه",
                text: "يرجى اختيار طابعة أولاً لإجراء الاختبار.",
                confirmButtonColor: "#6d28d9"
            });
        }

        const testReceiptHtml = `
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>صفحة اختبار الطابعة</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;900&display=swap');
                    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', Arial, sans-serif; }
                    body { width: 80mm; padding: 10px; font-size: 13px; color: #000; background: #fff; }
                    .box { border: 1.5px dashed #000; padding: 12px; border-radius: 6px; text-align: center; }
                    .brand { font-size: 18px; font-weight: 900; margin-bottom: 4px; }
                    .sub-brand { font-size: 11px; color: #333; margin-bottom: 8px; }
                    .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
                    .badge-ok { display: inline-block; font-size: 14px; font-weight: 900; margin: 8px 0; padding: 4px 8px; border: 1px solid #000; border-radius: 4px; }
                    .row { display: flex; justify-content: space-between; font-size: 11px; margin: 4px 0; }
                    .footer { font-size: 10px; margin-top: 8px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="box">
                    <div class="brand">مانيجلي - MANAGELY</div>
                    <div class="sub-brand">نظام إدارة نقاط البيع والمخازن</div>
                    <div class="divider"></div>
                    <div class="badge-ok">✓ اختبار الاتصال ناجح</div>
                    <div class="divider"></div>
                    <div class="row">
                        <span>الطابعة:</span>
                        <strong style="direction: ltr;">${selectedPrinter}</strong>
                    </div>
                    <div class="row">
                        <span>التاريخ:</span>
                        <span>${new Date().toLocaleDateString("ar-EG")}</span>
                    </div>
                    <div class="row">
                        <span>الوقت:</span>
                        <span>${new Date().toLocaleTimeString("ar-EG")}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="footer">شكراً لاستخدامك برنامج مانيجلي</div>
                </div>
            </body>
            </html>
        `;

        try {
            Swal.fire({
                title: "جاري إرسال صفحة الاختبار...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const res = await electronAPI.printInvoiceToPOS(testReceiptHtml, "TEST-" + Date.now(), "mini");
            if (res && res.success) {
                Swal.fire({
                    icon: "success",
                    title: "تمت الطباعة بنجاح",
                    text: `تم إرسال صفحة الاختبار بنجاح إلى [${selectedPrinter}].`,
                    confirmButtonColor: "#059669"
                });
            } else if (res && res.filePath) {
                Swal.fire({
                    icon: "info",
                    title: "تم الحفظ كملف PDF",
                    text: `تم حفظ صفحة الاختبار في:\n${res.filePath}`,
                    confirmButtonColor: "#6d28d9"
                });
            } else {
                Swal.fire({
                    icon: "success",
                    title: "تم إرسال الأمر",
                    text: "تم إرسال أمر الطباعة إلى نظام التشغيل.",
                    confirmButtonColor: "#059669"
                });
            }
        } catch (err) {
            console.error("Test print error:", err);
            Swal.fire({
                icon: "error",
                title: "تعذر الاختبار",
                text: "حدث خطأ أثناء محاولة الطباعة، يرجى التحقق من اتصال الطابعة والورق.",
                confirmButtonColor: "#dc2626"
            });
        }
    });
}

// Refresh Button
if (refreshBtn) {
    refreshBtn.addEventListener('click', loadPrinters);
}

window.addEventListener('DOMContentLoaded', loadPrinters);
