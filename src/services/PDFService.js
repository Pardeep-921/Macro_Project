import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const currency = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const safe = (value, fallback = 'N/A') => value || fallback;

const addHeader = (doc, title, subtitle) => {
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(227, 122, 34);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("MACO INDIA PVT. LTD.", 14, 18);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 26);
  doc.text(subtitle, 196, 26, { align: 'right' });
  doc.setTextColor(0, 0, 0);
};

export const PDFService = {
  generatePurchaseOrder: (customer, items) => {
    const doc = new jsPDF();
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const date = new Date().toLocaleDateString();

    // Header
    doc.setFillColor(227, 122, 34); // Primary Orange
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text("MACO INDIA PVT. LTD.", 15, 25);
    
    doc.setFontSize(10);
    doc.text("Purchase Order Document", 15, 33);
    
    // Customer Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER DETAILS", 15, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${customer.username || 'N/A'}`, 15, 62);
    doc.text(`Email: ${customer.email || 'N/A'}`, 15, 69);
    doc.text(`Date: ${date}`, 150, 62);

    // Table
    const tableData = items.map((item, index) => [
      index + 1,
      item.name,
      item.size,
      item.qty,
      item.uom,
      `Rs. ${item.price}`,
      `Rs. ${item.total}`
    ]);

    autoTable(doc, {
      startY: 80,
      head: [['Sr.', 'Item Name', 'Size', 'Qty', 'UOM', 'Rate', 'Total']],
      body: tableData,
      headStyles: { fillColor: [227, 122, 34] },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 10 }
    });

    // Summary
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.text(`Grand Total: Rs. ${totalAmount}`, 150, finalY, { align: 'right' });

    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("This is a computer generated Purchase Order and does not require a signature.", 15, 280);

    doc.save(`PO_${date.replace(/\//g, '-')}.pdf`);
  },

  generateInvoice: (order, items) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('en-IN');
    const totalAmount = items.reduce((sum, item) => {
      const lineTotal = Number(item.total_price ?? item.total ?? 0) || (Number(item.price || item.unit_price || 0) * Number(item.quantity || 0));
      return sum + lineTotal;
    }, 0);

    addHeader(doc, "Tax Invoice", `Generated: ${date}`);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Invoice / Order No: ${safe(order.orderNo || order.order_no)}`, 14, 46);
    doc.setFont("helvetica", "normal");
    doc.text(`Customer: ${safe(order.customer || order.company_name)}`, 14, 54);
    doc.text(`PO Date: ${safe(order.poDate || order.po_date)}`, 14, 62);
    doc.text(`Destination: ${safe(order.destination)}`, 14, 70);
    doc.text(`Status: ${safe(order.status || order.order_status)}`, 148, 54);
    doc.text(`Payment: ${safe(order.paymentStatus)}`, 148, 62);

    autoTable(doc, {
      startY: 82,
      head: [['Sr.', 'Item Code', 'Item Name', 'Size', 'Qty', 'UOM', 'Rate', 'Amount']],
      body: items.map((item, index) => {
        const rate = Number(item.price ?? item.unit_price ?? 0);
        const qty = Number(item.quantity || 0);
        return [
          index + 1,
          safe(item.item_code, ''),
          safe(item.itemName || item.item_name, ''),
          safe(item.size || item.size_code, ''),
          qty,
          safe(item.uom || item.unit_name, ''),
          currency(rate),
          currency(Number(item.total_price ?? item.total ?? rate * qty)),
        ];
      }),
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Grand Total: ${currency(order.amount || order.net_amount || totalAmount)}`, 196, finalY, { align: 'right' });
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("This is a computer generated invoice.", 14, 282);
    doc.save(`${safe(order.orderNo || order.order_no, 'MACO_ORDER')}_INVOICE.pdf`);
  },

  generateChallan: (challan, items = []) => {
    const doc = new jsPDF();
    addHeader(doc, "Supply Challan", `Challan: ${safe(challan.challanNo || challan.challan_no)}`);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Order No: ${safe(challan.orderNo || challan.order_no)}`, 14, 48);
    doc.text(`Company: ${safe(challan.companyName || challan.company_name)}`, 14, 56);
    doc.text(`Carrier: ${safe(challan.carrierName || challan.carrier_name)}`, 14, 64);
    doc.text(`Challan Date: ${safe(challan.challanDate || challan.challan_date)}`, 148, 48);

    const rows = items.length ? items.map((item, index) => [
      index + 1,
      safe(item.item_code, ''),
      safe(item.itemName || item.item_name, ''),
      safe(item.size || item.size_code, ''),
      Number(item.quantity || 0),
      safe(item.uom || item.unit_name, ''),
    ]) : [[1, '', safe(challan.supplyDetails || challan.supply_details, 'Dispatch details recorded'), '', '', '']];

    autoTable(doc, {
      startY: 78,
      head: [['Sr.', 'Item Code', 'Item Name / Details', 'Size', 'Qty', 'UOM']],
      body: rows,
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Goods received in good condition acknowledgement may be collected on delivery.", 14, 282);
    doc.save(`${safe(challan.challanNo || challan.challan_no, 'MACO_CHALLAN')}_CHALLAN.pdf`);
  }
};
