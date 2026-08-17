const PDFDocument = require('pdfkit');

/**
 * Renders a finance report (rows + summary) into a PDF buffer.
 * Generic enough to serve capital transactions, sales, and expense exports
 * with the same visual structure — a header, a summary block, and a table.
 */
const generateFinanceReportPDF = ({ title, restaurantName, periodLabel, summary, columns, rows }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // HEADER 
      doc
        .fontSize(18).font('Helvetica-Bold').text(restaurantName || 'Restaurant', { align: 'left' })
        .fontSize(14).font('Helvetica-Bold').text(title, { align: 'left' })
        .fontSize(10).font('Helvetica').fillColor('#666666')
        .text(periodLabel || '', { align: 'left' })
        .text(`Generated: ${new Date().toLocaleString()}`, { align: 'left' })
        .fillColor('#000000')
        .moveDown(1);

      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#dddddd').stroke();
      doc.moveDown(1);

      // SUMMARY BLOCK (optional key/value pairs)
      if (summary && Object.keys(summary).length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').text('Summary', { underline: false });
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');
        Object.entries(summary).forEach(([label, value]) => {
          doc.text(`${label}: ${value}`);
        });
        doc.moveDown(1);
      }

      // TABLE
      const tableTop = doc.y;
      const colWidth = (555 - 40) / columns.length;

      const drawRow = (values, y, isHeader = false) => {
        doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
        values.forEach((val, i) => {
          doc.text(String(val ?? ''), 40 + i * colWidth, y, {
            width: colWidth - 8,
            ellipsis: true,
          });
        });
      };

      let y = tableTop;
      drawRow(columns, y, true);
      y += 18;
      doc.moveTo(40, y - 4).lineTo(555, y - 4).strokeColor('#dddddd').stroke();

      rows.forEach((row) => {
        // New page if we're near the bottom margin
        if (y > 760) {
          doc.addPage();
          y = 40;
          drawRow(columns, y, true);
          y += 18;
        }
        drawRow(row, y);
        y += 16;
      });

      // FOOTER 
      doc.fontSize(8).fillColor('#999999')
        .text(`Total records: ${rows.length}`, 40, 800, { align: 'left' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateFinanceReportPDF };