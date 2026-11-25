function escapeReceiptHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

export function buildSalesReceipt({
  settings = {},
  invoiceNumber,
  date,
  paymentMethod,
  customerName,
  customerPhone,
  items = [],
  subtotal = 0,
  discount = 0,
  tax = 0,
  taxRate = 0,
  grandTotal = 0,
  paid = 0,
  change = 0,
  currency = "ج.م",
}) {
  const storeName = settings.storeName || "نقطة بيع مانيجلي";
  const storeLocation = settings.storeLocation || "";
  const storePhones = Array.isArray(settings.phoneNumbers)
    ? settings.phoneNumbers.filter(Boolean).join(" • ")
    : settings.phoneNumbers || "";
  const hasCustomerPhone = customerPhone && customerPhone !== "غير متوفر" && customerPhone !== "--";

  const itemRows = items
    .map((item) => {
      const itemDiscount = Number(item.discount || 0);
      return `
        <tr>
          <td class="item-name">
            <strong>${escapeReceiptHtml(item.name || "منتج")}</strong>
            ${itemDiscount > 0 ? `<small>خصم ${money(itemDiscount)} ${escapeReceiptHtml(currency)}</small>` : ""}
          </td>
          <td class="number">${escapeReceiptHtml(item.quantity || 1)}</td>
          <td class="number">${money(item.price)}</td>
          <td class="number item-total">${money(item.total)}</td>
        </tr>`;
    })
    .join("");

  const optionalTotals = `
    ${Number(discount) > 0 ? `
      <div class="total-row discount-row">
        <span>الخصم</span>
        <b class="number">- ${money(discount)} ${escapeReceiptHtml(currency)}</b>
      </div>` : ""}
    ${Number(tax) > 0 ? `
      <div class="total-row">
        <span>الضريبة${Number(taxRate) > 0 ? ` (${money(taxRate).replace(/\.00$/, "")}%)` : ""}</span>
        <b class="number">+ ${money(tax)} ${escapeReceiptHtml(currency)}</b>
      </div>` : ""}`;

  return `<!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <title>فاتورة ${escapeReceiptHtml(invoiceNumber)}</title>
    <style>
      @page { margin: 0; size: auto; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; color: #111; }
      body {
        width: 72mm;
        max-width: 72mm;
        margin: 0 auto;
        padding: 4mm 3.5mm 3mm;
        font-family: "Tajawal", "Segoe UI", Tahoma, Arial, sans-serif;
        font-size: 10px;
        line-height: 1.45;
        direction: rtl;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .receipt-header { text-align: center; }
      .store-logo {
        display: block;
        width: 13mm;
        height: 13mm;
        margin: 0 auto 2mm;
        object-fit: contain;
      }
      .store-name {
        margin: 0;
        font-size: 16px;
        line-height: 1.25;
        font-weight: 900;
      }
      .store-contact {
        margin: 1mm 0 0;
        font-size: 9px;
        color: #333;
      }
      .document-title {
        display: inline-block;
        margin: 3mm 0 1.5mm;
        padding: 1mm 4mm;
        border: 1.5px solid #111;
        border-radius: 99px;
        font-size: 11px;
        font-weight: 800;
      }
      .invoice-number {
        margin: 0 0 2.5mm;
        font-size: 10px;
        font-weight: 700;
      }
      .number, .invoice-number b {
        direction: ltr;
        unicode-bidi: isolate;
        font-variant-numeric: tabular-nums;
      }
      .details-card {
        border-top: 1.5px solid #111;
        border-bottom: 1px solid #111;
        padding: 1.5mm 0;
        margin-bottom: 2.5mm;
      }
      .detail-row, .total-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 3mm;
        padding: .65mm 0;
      }
      .detail-label { color: #444; white-space: nowrap; }
      .detail-value { font-weight: 700; text-align: left; overflow-wrap: anywhere; }
      .customer-row {
        margin-top: 1mm;
        padding-top: 1.2mm;
        border-top: 1px dotted #777;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        margin: 0 0 2mm;
      }
      th {
        padding: 1.5mm .8mm;
        border-top: 1.5px solid #111;
        border-bottom: 1.5px solid #111;
        background: #ededed;
        font-size: 9px;
        font-weight: 800;
        text-align: center;
      }
      th:first-child { width: 43%; text-align: right; }
      th:nth-child(2) { width: 14%; }
      th:nth-child(3) { width: 20%; }
      th:nth-child(4) { width: 23%; text-align: left; }
      td {
        padding: 1.8mm .8mm;
        border-bottom: 1px dotted #999;
        text-align: center;
        vertical-align: top;
      }
      .item-name { text-align: right; overflow-wrap: anywhere; }
      .item-name strong { display: block; font-weight: 700; }
      .item-name small { display: block; margin-top: .5mm; font-size: 8px; color: #444; }
      .item-total { text-align: left; font-weight: 800; }
      .totals { padding-top: 1mm; }
      .total-row { font-size: 10px; }
      .discount-row { border-bottom: 1px dotted #999; }
      .grand-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 3mm;
        margin: 2mm 0;
        padding: 2.2mm 2mm;
        border: 2px solid #111;
        border-radius: 2mm;
        background: #f2f2f2;
        font-size: 13px;
        font-weight: 900;
      }
      .payment-summary {
        margin-top: 1mm;
        padding-top: 1mm;
        border-top: 1px dotted #777;
      }
      .receipt-footer {
        margin-top: 3mm;
        padding-top: 2.5mm;
        border-top: 1.5px solid #111;
        text-align: center;
      }
      .thank-you { margin: 0; font-size: 10px; font-weight: 800; }
      .powered-by { margin: 1mm 0 0; font-size: 8px; color: #555; }
    </style>
  </head>
  <body>
    <header class="receipt-header">
      ${settings.logo ? `<img class="store-logo" src="${escapeReceiptHtml(settings.logo)}" alt="شعار المتجر">` : ""}
      <h1 class="store-name">${escapeReceiptHtml(storeName)}</h1>
      ${storeLocation ? `<p class="store-contact">${escapeReceiptHtml(storeLocation)}</p>` : ""}
      ${storePhones ? `<p class="store-contact number">${escapeReceiptHtml(storePhones)}</p>` : ""}
      <div class="document-title">فاتورة مبيعات</div>
      <p class="invoice-number">رقم الفاتورة: <b>${escapeReceiptHtml(invoiceNumber)}</b></p>
    </header>

    <section class="details-card">
      <div class="detail-row">
        <span class="detail-label">التاريخ والوقت</span>
        <span class="detail-value">${escapeReceiptHtml(date)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">طريقة الدفع</span>
        <span class="detail-value">${escapeReceiptHtml(paymentMethod)}</span>
      </div>
      <div class="detail-row customer-row">
        <span class="detail-label">العميل</span>
        <span class="detail-value">${escapeReceiptHtml(customerName || "عميل نقدي")}${hasCustomerPhone ? `<br><span class="number">${escapeReceiptHtml(customerPhone)}</span>` : ""}</span>
      </div>
    </section>

    <table>
      <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <section class="totals">
      <div class="total-row">
        <span>الإجمالي الفرعي</span>
        <b class="number">${money(subtotal)} ${escapeReceiptHtml(currency)}</b>
      </div>
      ${optionalTotals}
      <div class="grand-total">
        <span>الإجمالي النهائي</span>
        <span class="number">${money(grandTotal)} ${escapeReceiptHtml(currency)}</span>
      </div>
      ${Number(paid) > 0 ? `
        <div class="payment-summary">
          <div class="total-row"><span>المدفوع</span><b class="number">${money(paid)} ${escapeReceiptHtml(currency)}</b></div>
          <div class="total-row"><span>الباقي</span><b class="number">${money(change)} ${escapeReceiptHtml(currency)}</b></div>
        </div>` : ""}
    </section>

    <footer class="receipt-footer">
      <p class="thank-you">شكرًا لزيارتكم، نتمنى لكم يومًا سعيدًا</p>
      <p class="powered-by">تمت الطباعة بواسطة نظام Managely</p>
    </footer>
  </body>
  </html>`;
}
