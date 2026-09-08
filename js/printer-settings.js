const electronAPI = window.electronAPI;

const printerListDiv = document.getElementById('printer-list');
const saveBtn = document.getElementById('save-btn');
const messageDiv = document.getElementById('message');
let selectedPrinter = null;
let printers = [];

async function loadPrinters() {
    try {
        printers = await electronAPI.getAllPrinters(); 
        // كل عنصر فيه name, description, status, isDefault
        if (!printers.length) {
            printerListDiv.innerHTML = '<span class="error">لم يتم العثور على طابعات متصلة.</span>';
            saveBtn.disabled = true;
            return;
        }

        const defaultPrinter = await electronAPI.getDefaultPrinterSetting();
        printerListDiv.innerHTML = printers.map(printer => `
            <div class="printer-item">
                <input type="radio" name="printer" value="${printer.name}" id="printer-${printer.name}" ${defaultPrinter === printer.name ? 'checked' : ''}>
                <label for="printer-${printer.name}">
                    <strong>${printer.name}</strong> 
                    ${printer.isDefault ? '<span style="color: green;">(افتراضية)</span>' : ''}
                    <br>
                    <small>${printer.description || ''} - الحالة: ${printer.status || 'غير معروفة'}</small>
                </label>
            </div>
        `).join('');

        selectedPrinter = defaultPrinter || printers.find(p => p.isDefault)?.name || printers[0].name;
        saveBtn.disabled = false;

        document.querySelectorAll('input[name="printer"]').forEach(input => {
            input.addEventListener('change', e => {
                selectedPrinter = e.target.value;
            });
        });
    } catch (err) {
        printerListDiv.innerHTML = '<span class="error">تعذر جلب قائمة الطابعات. يرجى التأكد من توصيل الطابعة بالكمبيوتر.</span>';
        saveBtn.disabled = true;
    }
}

saveBtn.addEventListener('click', async () => {
    if (!selectedPrinter) return;
    saveBtn.disabled = true;
    messageDiv.textContent = '';
    try {
        await electronAPI.setDefaultPrinterSetting(selectedPrinter);
        messageDiv.innerHTML = '<span class="success">تم حفظ الطابعة الافتراضية بنجاح!</span>';
    } catch (err) {
        messageDiv.innerHTML = '<span class="error">تعذر حفظ إعدادات الطابعة، يرجى المحاولة مجدداً.</span>';
    }
    saveBtn.disabled = false;
});

window.addEventListener('DOMContentLoaded', loadPrinters);
