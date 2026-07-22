const PDFDocument = require('pdfkit');

/**
 * Build a simple invoice PDF buffer.
 * @param {object} invoice
 * @returns {Promise<Buffer>}
 */
function buildInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('UNICAB Travel & Tours', { align: 'left' });
      doc.fontSize(10).fillColor('#666').text('Invoice', { align: 'left' });
      doc.moveDown();
      doc.fillColor('#000').fontSize(12);
      doc.text(`Invoice #: ${invoice.number || '—'}`);
      doc.text(`Date: ${new Date(invoice.created_at || Date.now()).toLocaleDateString('en-ZA')}`);
      doc.text(`Status: ${(invoice.status || 'draft').toUpperCase()}`);
      doc.moveDown();
      doc.text(`Bill to: ${invoice.customer_name || 'Customer'}`);
      if (invoice.customer_email) doc.text(invoice.customer_email);
      doc.moveDown();

      doc.fontSize(11).text('Line items', { underline: true });
      doc.moveDown(0.5);
      const items = Array.isArray(invoice.line_items) ? invoice.line_items : [];
      if (!items.length) {
        doc.text('—');
      } else {
        items.forEach((item, i) => {
          const label = item.description || item.name || `Item ${i + 1}`;
          const amount = Number(item.amount_zar ?? item.amount ?? 0);
          doc.text(`${label}  —  R${amount.toFixed(2)}`);
        });
      }

      doc.moveDown();
      doc.fontSize(14).text(`Total: R${Number(invoice.amount_zar || 0).toFixed(2)}`, { align: 'right' });
      doc.moveDown(2);
      doc.fontSize(9).fillColor('#888').text('Thank you for travelling with UNICAB.', { align: 'center' });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { buildInvoicePdf };
