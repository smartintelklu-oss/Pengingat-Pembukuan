import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Transaction, LedgerBook } from '../types';

/**
 * Format number to Indonesian Rupiah representation
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Exports financial ledger transactions to Excel (.xlsx)
 */
export function exportToExcel(
  transactions: Transaction[],
  ledger: LedgerBook,
  dateRangeLabel: string
) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // 1. Prepare main transaction records
  const transactionRows = transactions.map((t, idx) => ({
    'No': idx + 1,
    'Tanggal': t.date,
    'Buku Pembukuan': ledger.name,
    'Jenis': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    'Kategori': t.category,
    'Judul Transaksi': t.title,
    'Keterangan': t.note || '-',
    'Metode Pembayaran': t.paymentMethod,
    'Pemasukan (Rp)': t.type === 'income' ? t.amount : 0,
    'Pengeluaran (Rp)': t.type === 'expense' ? t.amount : 0,
  }));

  // Add Summary Header Information
  const headerInfo = [
    { 'No': 'LAPORAN PEMBUKUAN KEUANGAN' },
    { 'No': `Nama Buku: ${ledger.name}` },
    { 'No': `Periode: ${dateRangeLabel}` },
    { 'No': `Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}` },
    { 'No': `Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}` },
    { 'No': `Saldo Kas Bersih: Rp ${balance.toLocaleString('id-ID')}` },
    { 'No': `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}` },
    {}, // Empty row separator
  ];

  // 2. Category Summary Sheet
  const categorySummary: Record<string, { type: string; total: number }> = {};
  transactions.forEach(t => {
    if (!categorySummary[t.category]) {
      categorySummary[t.category] = { type: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', total: 0 };
    }
    categorySummary[t.category].total += t.amount;
  });

  const categoryRows = Object.entries(categorySummary).map(([cat, data]) => ({
    'Kategori': cat,
    'Jenis': data.type,
    'Total Transaksi (Rp)': data.total,
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Combine header + data for sheet 1
  const wsTransactions = XLSX.utils.json_to_sheet([...headerInfo, ...transactionRows], { skipHeader: false });
  
  // Set column widths
  wsTransactions['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 16 }, // Buku
    { wch: 14 }, // Jenis
    { wch: 22 }, // Kategori
    { wch: 28 }, // Judul
    { wch: 30 }, // Keterangan
    { wch: 18 }, // Metode
    { wch: 18 }, // Masuk
    { wch: 18 }, // Keluar
  ];

  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Daftar Transaksi');

  // Sheet 2: Kategori
  const wsCategories = XLSX.utils.json_to_sheet(categoryRows);
  wsCategories['!cols'] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Ringkasan Kategori');

  // Write file
  const filename = `Pembukuan_${ledger.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exports financial ledger transactions to PDF (.pdf)
 */
export function exportToPDF(
  transactions: Transaction[],
  ledger: LedgerBook,
  dateRangeLabel: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  let y = 18;

  // Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text('LAPORAN PEMBUKUAN KEUANGAN', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`Buku: ${ledger.name}  |  Periode: ${dateRangeLabel}  |  Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, y);

  y += 10;
  // Summary Boxes
  // Box 1: Pemasukan
  doc.setFillColor(240, 253, 244); // Green 50
  doc.setDrawColor(187, 247, 208); // Green 200
  doc.roundedRect(14, y, 56, 22, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52); // Green 800
  doc.text('Total Pemasukan', 18, y + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rp ${totalIncome.toLocaleString('id-ID')}`, 18, y + 16);

  // Box 2: Pengeluaran
  doc.setFillColor(254, 242, 242); // Red 50
  doc.setDrawColor(254, 202, 202); // Red 200
  doc.roundedRect(74, y, 56, 22, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(153, 27, 27); // Red 800
  doc.text('Total Pengeluaran', 78, y + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rp ${totalExpense.toLocaleString('id-ID')}`, 78, y + 16);

  // Box 3: Saldo Kas
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.setDrawColor(191, 219, 254); // Blue 200
  doc.roundedRect(134, y, 62, 22, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 64, 175); // Blue 800
  doc.text('Saldo Kas Bersih', 138, y + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rp ${balance.toLocaleString('id-ID')}`, 138, y + 16);

  y += 30;

  // Table Headers
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setTextColor(51, 65, 85);
  doc.rect(14, y, 182, 8, 'F');
  
  doc.text('Tanggal', 16, y + 5.5);
  doc.text('Kategori', 42, y + 5.5);
  doc.text('Keterangan / Transaksi', 82, y + 5.5);
  doc.text('Metode', 140, y + 5.5);
  doc.text('Jumlah (Rp)', 170, y + 5.5, { align: 'right' });

  y += 9;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  transactions.forEach((tx) => {
    // Check if new page needed
    if (y > 275) {
      doc.addPage();
      y = 18;
      // Re-render header on new page
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 8, 'F');
      doc.text('Tanggal', 16, y + 5.5);
      doc.text('Kategori', 42, y + 5.5);
      doc.text('Keterangan / Transaksi', 82, y + 5.5);
      doc.text('Metode', 140, y + 5.5);
      doc.text('Jumlah (Rp)', 170, y + 5.5, { align: 'right' });
      y += 9;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    doc.setTextColor(71, 85, 105);
    doc.text(tx.date, 16, y + 4.5);
    
    // Category
    doc.text(tx.category.substring(0, 18), 42, y + 4.5);

    // Title / Note
    const titleText = tx.title.length > 32 ? tx.title.substring(0, 30) + '...' : tx.title;
    doc.setTextColor(15, 23, 42);
    doc.text(titleText, 82, y + 4.5);

    // Payment Method
    doc.setTextColor(100, 116, 139);
    doc.text(tx.paymentMethod, 140, y + 4.5);

    // Amount
    if (tx.type === 'income') {
      doc.setTextColor(22, 101, 52); // green
      doc.text(`+ Rp ${tx.amount.toLocaleString('id-ID')}`, 194, y + 4.5, { align: 'right' });
    } else {
      doc.setTextColor(185, 28, 28); // red
      doc.text(`- Rp ${tx.amount.toLocaleString('id-ID')}`, 194, y + 4.5, { align: 'right' });
    }

    // Light line divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 6.5, 196, y + 6.5);

    y += 7.5;
  });

  // Footer / Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${totalPages}  •  Aplikasi Catatan & Pembukuan Pintar`, 105, 290, { align: 'center' });
  }

  const filename = `Pembukuan_${ledger.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
