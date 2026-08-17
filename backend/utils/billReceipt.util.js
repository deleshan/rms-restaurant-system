const PDFDocument = require('pdfkit');
const https = require('https');

const fetchImageBuffer = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    try {
      https.get(url, (res) => {
        const chunks = [];
        res.on('data',  (c) => chunks.push(c));
        res.on('end',   ()  => resolve(Buffer.concat(chunks)));
        res.on('error', ()  => resolve(null));
      }).on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });

/**
 * Draws a horizontal rule across the content width
 */
const drawHR = (doc, margin, pageWidth, gap = 6) => {
  doc.moveDown(gap / 10);
  doc
    .moveTo(margin, doc.y)
    .lineTo(pageWidth - margin, doc.y)
    .strokeColor('#dddddd')
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(gap / 10);
};

/**
 * Calculates the required page height dynamically based on content
 */
const calcPageHeight = (order, hasLogo) => {
  const itemCount  = order.items?.length || 0;
  const baseHeight = 320;           // header + meta + totals + footer
  const logoHeight = hasLogo ? 90 : 0;
  const itemHeight = itemCount * 22; // ~22pt per row
  const extraRows  = order.specialRequest ? 30 : 0;
  return Math.max(420, baseHeight + logoHeight + itemHeight + extraRows + 60);
};

/**
 * @param {Object} order      - Populated order document
 * @param {Object} restaurant - Restaurant document (with notificationSettings)
 */
const generateBillPDF = async (order, restaurant) => {
  return new Promise(async (resolve, reject) => {

    const branding   = restaurant?.notificationSettings?.branding || {};
    const vendorName = restaurant?.name        || 'Restaurant';
    const address    = branding.address        || '';
    const phone      = branding.phone          || '';
    const taxNo      = branding.taxNumber      || '';
    const footer     = branding.footerNote     || 'Thank you for dining with us!';
    const website    = branding.website        || '';

    // Fetch logo before creating doc so we know the height
    let logoBuffer = null;
    if (branding.logoUrl) {
      logoBuffer = await fetchImageBuffer(branding.logoUrl);
    }

    const PAGE_WIDTH   = 226;   // 80mm thermal receipt width in points
    const MARGIN       = 16;
    const CONTENT_W    = PAGE_WIDTH - MARGIN * 2;
    const PAGE_HEIGHT  = calcPageHeight(order, !!logoBuffer);

    const doc = new PDFDocument({
      size:    [PAGE_WIDTH, PAGE_HEIGHT],
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      autoFirstPage: true,
    });

    const chunks = [];
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Column X positions (all relative to MARGIN)
    const col = {
      name:  MARGIN,
      qty:   MARGIN + CONTENT_W * 0.52,
      price: MARGIN + CONTENT_W * 0.68,
      total: MARGIN + CONTENT_W * 0.82,
    };
    const colW = {
      name:  CONTENT_W * 0.50,
      qty:   CONTENT_W * 0.14,
      price: CONTENT_W * 0.18,
      total: CONTENT_W * 0.18,
    };

    // Logo
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, MARGIN, doc.y, {
          fit:   [CONTENT_W, 70],
          align: 'center',
        });
        doc.moveDown(0.5);
      } catch {
        // silently skip broken logo
      }
    }

    // Restaurant Header 
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text(vendorName, MARGIN, doc.y, { width: CONTENT_W, align: 'center' });

    if (address) {
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#555555')
        .text(address, MARGIN, doc.y, { width: CONTENT_W, align: 'center' });
    }
    if (phone) {
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#555555')
        .text(phone, MARGIN, doc.y, { width: CONTENT_W, align: 'center' });
    }
    if (taxNo) {
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor('#777777')
        .text(`VAT/Tax: ${taxNo}`, MARGIN, doc.y, { width: CONTENT_W, align: 'center' });
    }

    drawHR(doc, MARGIN, PAGE_WIDTH, 8);

    // Order Meta
    const metaLeft  = MARGIN;
    const metaRight = MARGIN + CONTENT_W / 2;
    const metaW     = CONTENT_W / 2 - 4;

    const metaStartY = doc.y;

    doc
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Order',    metaLeft,  metaStartY, { width: metaW })
      .text('Table',    metaLeft,  doc.y,      { width: metaW })
      .text('Customer', metaLeft,  doc.y,      { width: metaW })
      .text('Date',     metaLeft,  doc.y,      { width: metaW });

    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor('#333333')
      .text(`#${String(order._id).slice(-6).toUpperCase()}`,  metaRight, metaStartY,       { width: metaW })
      .text(String(order.tableId || '—'),                     metaRight, metaStartY + 12,  { width: metaW })
      .text(order.user?.name || 'Guest',                      metaRight, metaStartY + 24,  { width: metaW })
      .text(new Date(order.createdAt).toLocaleString('en-LK', {
        day:   '2-digit', month: 'short', year: 'numeric',
        hour:  '2-digit', minute: '2-digit',
      }),                                                      metaRight, metaStartY + 36,  { width: metaW });

    // Move past the tallest column
    doc.y = metaStartY + 52;

    drawHR(doc, MARGIN, PAGE_WIDTH, 8);

    // Items Table Header
    const headerY = doc.y;
    doc
      .fontSize(7)
      .font('Helvetica-Bold')
      .fillColor('#555555')
      .text('ITEM',   col.name,  headerY, { width: colW.name  })
      .text('QTY',    col.qty,   headerY, { width: colW.qty,   align: 'center' })
      .text('PRICE',  col.price, headerY, { width: colW.price, align: 'right'  })
      .text('TOTAL',  col.total, headerY, { width: colW.total, align: 'right'  });

    doc.y = headerY + 14;
    drawHR(doc, MARGIN, PAGE_WIDTH, 4);

    // Items Rows
    for (const item of order.items) {
      const qty      = item.qty || item.quantity || 1;
      const price    = item.price || 0;
      const lineAmt  = qty * price;
      const rowY     = doc.y;

      // Item name may wrap - measure it first
      const nameLines = Math.ceil(item.name.length / 18); // rough wrap estimate
      const rowHeight = Math.max(12, nameLines * 10);

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#1a1a1a')
        .text(item.name,                               col.name,  rowY, { width: colW.name,  lineBreak: true  })
        .text(String(qty),                             col.qty,   rowY, { width: colW.qty,   align: 'center', lineBreak: false })
        .text(`${price.toLocaleString()}`,             col.price, rowY, { width: colW.price, align: 'right',  lineBreak: false })
        .text(`${lineAmt.toLocaleString()}`,           col.total, rowY, { width: colW.total, align: 'right',  lineBreak: false });

      // Customizations (indented, smaller)
      if (item.customizations?.length) {
        const customY = rowY + rowHeight;
        doc
          .fontSize(6.5)
          .font('Helvetica-Oblique')
          .fillColor('#888888')
          .text(item.customizations.join(', '), col.name + 6, customY, {
            width: colW.name + colW.qty,
            lineBreak: false,
          });
        doc.y = customY + 10;
      } else {
        doc.y = rowY + rowHeight + 3;
      }
    }

    drawHR(doc, MARGIN, PAGE_WIDTH, 8);

    // Totals Block 
    const subtotal  = order.items.reduce((s, i) => s + ((i.price || 0) * (i.qty || i.quantity || 1)), 0);
    const isRounded = Math.round(subtotal) !== Math.round(order.totalPrice);

    const totalLabelX = col.price - 20;
    const totalValueX = col.total;
    const totalLabelW = colW.price + 20;
    const totalValueW = colW.total;

    if (isRounded) {
      const totalsY = doc.y;
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor('#555555')
        .text('Subtotal',  totalLabelX, totalsY,      { width: totalLabelW, align: 'right' })
        .text(`LKR ${subtotal.toLocaleString()}`, totalValueX, totalsY, { width: totalValueW, align: 'right' });

      doc.y = totalsY + 13;
    }

    const grandTotalY = doc.y;
    doc
      .fontSize(9.5)
      .font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text('TOTAL',                                    totalLabelX, grandTotalY, { width: totalLabelW, align: 'right' })
      .text(`LKR ${(order.totalPrice || 0).toLocaleString()}`, totalValueX, grandTotalY, { width: totalValueW, align: 'right' });

    doc.y = grandTotalY + 18;

    // Payment Status 
    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor(order.isPaid ? '#16a34a' : '#dc2626')
      .text(
        order.isPaid
          ? `✓ PAID${order.paymentMethod ? ` (${order.paymentMethod})` : ''}`
          : '● PAYMENT PENDING',
        MARGIN, doc.y,
        { width: CONTENT_W, align: 'right' }
      );

    doc.moveDown(0.5);

    // Special Request 
    if (order.specialRequest) {
      drawHR(doc, MARGIN, PAGE_WIDTH, 6);
      doc
        .fontSize(7)
        .font('Helvetica-Oblique')
        .fillColor('#555555')
        .text(`Note: ${order.specialRequest}`, MARGIN, doc.y, {
          width: CONTENT_W,
        });
      doc.moveDown(0.3);
    }

    drawHR(doc, MARGIN, PAGE_WIDTH, 10);

    // Footer 
    doc
      .fontSize(7.5)
      .font('Helvetica')
      .fillColor('#555555')
      .text(footer, MARGIN, doc.y, { width: CONTENT_W, align: 'center' });

    if (website) {
      doc.moveDown(0.2);
      doc
        .fontSize(6.5)
        .fillColor('#3b82f6')
        .text(website, MARGIN, doc.y, {
          width:     CONTENT_W,
          align:     'center',
          underline: true,
        });
    }

    doc.moveDown(0.5);

    doc.end();
  });
};

module.exports = { generateBillPDF };