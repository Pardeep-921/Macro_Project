import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import macoLogo from "../assets/maco logo white.png";

const currency = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const safe = (value, fallback = 'N/A') => value || fallback;

const formatDateDots = (date = new Date()) => new Intl.DateTimeFormat('en-GB')
  .format(date)
  .replace(/\//g, '.');

const fitText = (doc, text, maxWidth) => doc.splitTextToSize(safe(text, ''), maxWidth);

const customerName = (customer) =>
  customer?.companyName ||
  customer?.company_name ||
  customer?.customer ||
  customer?.display_name ||
  customer?.fullname ||
  customer?.name ||
  customer?.username ||
  'N/A';

const customerAddressLines = (customer) => [
  `M/s ${customerName(customer)}`,
  customer?.address_1 || customer?.address1 || customer?.address || customer?.billing_address,
  customer?.address_2 || customer?.address2,
  [customer?.city, customer?.state, customer?.pincode].filter(Boolean).join(' - '),
  customer?.gstin_no || customer?.gstin || customer?.gst_no ? `GSTIN : ${customer?.gstin_no || customer?.gstin || customer?.gst_no}` : null,
].filter(Boolean);

const sizeColumns = ['STD.', '001', '002', '003', '004', '005'];

const getSizeColumnValues = (item) => {
  const values = sizeColumns.map(() => 'X');
  const selectedSize = String(item.size || 'STD.').trim().toUpperCase();
  const selectedIndex = sizeColumns.findIndex(size => size.replace('.', '') === selectedSize.replace('.', ''));
  values[selectedIndex >= 0 ? selectedIndex : 0] = Number(item.qty || item.quantity || 0);
  return values;
};

const drawSignatureStamp = (doc, x, y) => {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.lines([
    [8, -4],
    [5, 2],
    [7, -8],
    [4, 12],
    [6, -7],
    [7, 1],
    [5, -3],
  ], x, y);
  doc.line(x - 4, y + 8, x + 44, y + 8);
  doc.addImage(macoLogo, 'PNG', x + 23, y - 12, 19, 19);
};

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
    const itemTotalAmount = items.reduce((sum, item) => {
      const qty = Number(item.qty || item.quantity || 0);
      const price = Number(item.price || item.rate || 0);
      return sum + Number(item.total || qty * price);
    }, 0);
    const totalAmount = Number(customer?.amount || customer?.net_amount || itemTotalAmount);
    const poDate = customer?.poDate || customer?.po_date || customer?.date;
    const date = poDate ? formatDateDots(new Date(poDate)) : formatDateDots();
    const orderNo = customer?.orderNo || customer?.poNo || Date.now().toString().slice(-4);
    const left = 6;
    const pageWidth = doc.internal.pageSize.getWidth();

    const drawHeader = () => {
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.25);

      doc.addImage(macoLogo, 'PNG', 8, 12, 28, 28);
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.text('|| OM ||', pageWidth / 2, 8, { align: 'center' });

      doc.setFont('times', 'bold');
      doc.setFontSize(24);
      doc.text('MACO PRIVATE LIMITED', pageWidth / 2, 18, { align: 'center' });
      doc.setFontSize(10);
      doc.text('(AN ISO 9001 : 2015 CERTIFIED COMPANY)', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(11);
      doc.text('MANUFACTURERS OF QUALITY AUTOMOBILE COMPONENTS', pageWidth / 2, 31, { align: 'center' });
      doc.setFontSize(9);
      doc.text('1st FLOOR, KUNDAN MANSION, 2A/3, ASAF ALI ROAD, NEW DELHI- 110 002', pageWidth / 2, 37, { align: 'center' });
      doc.text('Tel : 011-23263672, 23273274    Email : macoho@maco-india.com', pageWidth / 2, 43, { align: 'center' });
      doc.text('GSTIN : 06AAACM6957D1ZI', pageWidth / 2, 49, { align: 'center' });
      doc.text('WORKS : E-24, INDUSTRIAL AREA, SONEPAT (HARYANA)    C.I.N. : U74899DL1956PTC002720', pageWidth / 2, 56, { align: 'center' });
      doc.line(left, 60, pageWidth - left, 60);
    };

    drawHeader();

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(`ORDER CONFIRMATION NO. ${orderNo}`, left, 68);
    doc.text(`DATE  ${date}`, pageWidth - 10, 68, { align: 'right' });

    doc.setLineWidth(0.2);
    doc.rect(left, 76, 80, 25);
    doc.setFontSize(8.2);
    let customerLineY = 82;
    customerAddressLines(customer).forEach((line, index) => {
      const wrappedLines = fitText(doc, line, 74).slice(0, 2);
      doc.setFont('times', index === 0 || line.startsWith('GSTIN') ? 'bold' : 'normal');
      doc.text(wrappedLines, left + 2, customerLineY);
      customerLineY += wrappedLines.length * 4.4;
    });

    autoTable(doc, {
      startY: 75,
      margin: { left: 138, right: 7 },
      tableWidth: 65,
      body: [
        ['Your Order No.', safe(customer?.yourOrderNo || customer?.requisition || customer?.requisition_no, 'NIL')],
        ['Date', date],
        ['Mode of', safe(customer?.orderMode || 'E-Mail')],
        ['Receipt :', safe(customer?.receiptMode || 'By The Party')],
      ],
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8.5,
        cellPadding: 1.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 24 },
        1: { cellWidth: 41 },
      },
    });

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text('We thank you for your order and are pleased to confirm the same as below ;', left, 110);

    const tableBody = items.map((item, index) => {
      const qty = Number(item.qty || item.quantity || 0);
      const price = Number(item.price || item.rate || 0);
      return [
        index + 1,
        safe(item.partNo || item.part_no || item.item_code || item.code, ''),
        safe(item.name || item.itemName || item.item_name, ''),
        ...getSizeColumnValues(item),
        qty,
        price.toFixed(2),
        (Number(item.total || qty * price)).toFixed(2),
      ];
    });

    autoTable(doc, {
      startY: 114,
      margin: { left, right: left, top: 64, bottom: 34 },
      head: [
        [
          { content: 'SR.\nNO.', rowSpan: 2 },
          { content: 'MACO\nPART NO.', rowSpan: 2 },
          { content: 'ITEM\nDESCRIPTION', rowSpan: 2 },
          { content: 'SIZE', colSpan: 6 },
          { content: 'TOTAL\nQTY.', rowSpan: 2 },
          { content: 'LIST\nPRICE', rowSpan: 2 },
          { content: 'TOTAL\nLIST VALUE', rowSpan: 2 },
        ],
        sizeColumns,
      ],
      body: [
        [
          { content: 'CONNECTING ROD KITS', colSpan: 12, styles: { halign: 'left', fontStyle: 'bold', fontSize: 9.5 } },
        ],
        ...tableBody,
        [
          { content: 'TOTAL VALUE AS PER LIST PRICES', colSpan: 11, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: 'right', fontStyle: 'bold' } },
        ],
      ],
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 7.8,
        cellPadding: 1.1,
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
        textColor: [0, 0, 0],
        valign: 'middle',
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        halign: 'center',
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 18 },
        2: { cellWidth: 55 },
        3: { cellWidth: 9, halign: 'center' },
        4: { cellWidth: 9, halign: 'center' },
        5: { cellWidth: 9, halign: 'center' },
        6: { cellWidth: 9, halign: 'center' },
        7: { cellWidth: 9, halign: 'center' },
        8: { cellWidth: 9, halign: 'center' },
        9: { cellWidth: 12, halign: 'center' },
        10: { cellWidth: 17, halign: 'right' },
        11: { cellWidth: 28, halign: 'right' },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) drawHeader();
      },
    });

    let footerY = Math.max((doc.lastAutoTable?.finalY || 220) + 10, 250);
    if (footerY > 252) {
      doc.addPage();
      drawHeader();
      footerY = 72;
    }
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text("TRANSPORTER'S NAME : Saurashtra Roadways Bangalore  Door Delivery", left + 1, footerY);
    doc.text('DESTINATION          : VIJAYAWADA (DOOR DELIVERY)', left + 1, footerY + 6);
    doc.rect(left, footerY + 8, 82, 18);
    doc.text('SPECIAL INSTRUCTIONS, IF ANY :-', left + 1, footerY + 13);
    doc.text('Yours faithfully', pageWidth - 7, footerY - 2, { align: 'right' });
    doc.text('For MACO PRIVATE LIMITED', pageWidth - 7, footerY + 6, { align: 'right' });
    drawSignatureStamp(doc, pageWidth - 50, footerY + 22);
    doc.setFontSize(8);
    doc.text('Sales', pageWidth - 16, footerY + 34, { align: 'center' });

    doc.save(`PO_${date.replace(/\./g, '-')}.pdf`);
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
    doc.text(`Customer: ${safe(challan.companyName || challan.company_name)}`, 14, 56);
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
