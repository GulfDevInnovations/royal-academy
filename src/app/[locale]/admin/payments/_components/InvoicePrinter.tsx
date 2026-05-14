// src/app/[locale]/admin/payments/_components/invoicePrinter.ts

export interface InvoiceData {
  invoiceNo: string;
  issuedAt: string; // ISO
  paidAt: string | null;
  student: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  lineItems: {
    description: string;
    detail: string;
    amount: number;
    currency: string;
  }[];
  total: number;
  currency: string;
  status: string;
  method: string | null;
}

export function printInvoice(data: InvoiceData) {
  const fmt = (n: number) => n.toFixed(3);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const STATUS_COLOR: Record<string, string> = {
    PAID: "#10b981",
    REFUNDED: "#60a5fa",
    FAILED: "#f87171",
  };
  const statusColor = STATUS_COLOR[data.status] ?? "#94a3b8";

  const METHOD_LABEL: Record<string, string> = {
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
    CREDIT_CARD: "Credit Card",
    DEBIT_CARD: "Debit Card",
  };
  const methodLabel = data.method
    ? (METHOD_LABEL[data.method] ?? data.method)
    : "—";

  const lineItemsHtml = data.lineItems
    .map(
      (item) => `
    <tr>
      <td class="desc">
        <div class="item-name">${item.description}</div>
        <div class="item-detail">${item.detail}</div>
      </td>
      <td class="amount">${fmt(item.amount)} ${item.currency}</td>
    </tr>
  `,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Receipt ${data.invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #fff;
      color: #1e293b;
      font-size: 13px;
      line-height: 1.6;
    }

    .page {
      max-width: 420px;
      margin: 0 auto;
      padding: 40px 32px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }

    .academy-name {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .academy-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .invoice-meta {
      text-align: right;
    }
    .invoice-no {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      font-family: monospace;
    }
    .status-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      background: ${statusColor}18;
      color: ${statusColor};
      border: 1px solid ${statusColor}40;
    }

    /* ── Bill to ── */
    .bill-to {
      margin-bottom: 24px;
    }
    .section-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .student-name {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
    }
    .student-contact {
      font-size: 12px;
      color: #64748b;
    }

    /* ── Dates ── */
    .dates {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
      padding: 14px 16px;
      background: #f8fafc;
      border-radius: 10px;
    }
    .date-item .label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
    .date-item .value { font-size: 13px; font-weight: 500; color: #1e293b; margin-top: 2px; }

    /* ── Line items ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    thead th {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: #94a3b8;
      padding: 0 0 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    thead th.amount { text-align: right; }

    tbody tr td {
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    td.desc .item-name   { font-weight: 500; color: #1e293b; }
    td.desc .item-detail { font-size: 11px;  color: #94a3b8; margin-top: 2px; }
    td.amount {
      text-align: right;
      font-weight: 500;
      color: #1e293b;
      white-space: nowrap;
    }

    /* ── Total ── */
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0 0;
    }
    .total-label {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
    }
    .total-amount {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .total-currency {
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
      margin-left: 4px;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-method {
      font-size: 11px;
      color: #64748b;
    }
    .footer-method span { font-weight: 600; color: #1e293b; }
    .thank-you {
      font-size: 11px;
      color: #94a3b8;
    }

    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div>
        <div class="academy-name">🎵 Your Academy</div>
        <div class="academy-sub">Music · Dance · Art</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-no">${data.invoiceNo}</div>
        <div class="status-badge">${data.status}</div>
      </div>
    </div>

    <!-- Bill to -->
    <div class="bill-to">
      <div class="section-label">Bill to</div>
      <div class="student-name">${data.student.firstName} ${data.student.lastName}</div>
      ${data.student.phone ? `<div class="student-contact">${data.student.phone}</div>` : ""}
      ${data.student.email ? `<div class="student-contact">${data.student.email}</div>` : ""}
    </div>

    <!-- Dates -->
    <div class="dates">
      <div class="date-item">
        <div class="label">Issue Date</div>
        <div class="value">${fmtDate(data.issuedAt)}</div>
      </div>
      <div class="date-item">
        <div class="label">Paid On</div>
        <div class="value">${data.paidAt ? fmtDate(data.paidAt) : "—"}</div>
      </div>
    </div>

    <!-- Line items -->
    <table>
      <thead>
        <tr>
          <th style="text-align:left">Description</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>

    <!-- Total -->
    <div class="total-row">
      <div class="total-label">Total</div>
      <div>
        <span class="total-amount">${fmt(data.total)}</span>
        <span class="total-currency">${data.currency}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-method">
        Payment via <span>${methodLabel}</span>
      </div>
      <div class="thank-you">Thank you!</div>
    </div>

  </div>
</body>
</html>`;

  // Open in hidden iframe and print
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0;";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!iframeDoc) return;

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Remove iframe after print dialog closes
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };
}
