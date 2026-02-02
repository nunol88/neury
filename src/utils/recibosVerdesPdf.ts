import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addProfessionalHeader, addProfessionalFooter, getContentStartY } from './pdfHelpers';
import { ClienteReciboVerde, RecibosVerdesStats, TAXA_SS, BASE_INCIDENCIA } from '@/hooks/useRecibosVerdes';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const generateRecibosVerdesPdf = async (
  clientes: ClienteReciboVerde[],
  stats: RecibosVerdesStats,
  month: number,
  year: number
) => {
  const doc = new jsPDF();
  const monthName = MONTHS_PT[month];
  const subtitle = `${monthName} ${year}`;

  // Add professional header
  await addProfessionalHeader(doc, 'Recibos Verdes', subtitle);

  let yPos = getContentStartY();

  // Tax info box
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(14, yPos, 182, 18, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.setFont('helvetica', 'bold');
  doc.text('Taxas Segurança Social 2026 - Prestação de Serviços', 20, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Taxa: ${(TAXA_SS * 100).toFixed(1)}% sobre ${(BASE_INCIDENCIA * 100).toFixed(0)}% do rendimento = ${((TAXA_SS * BASE_INCIDENCIA) * 100).toFixed(2)}% efetiva`, 20, yPos + 12);

  yPos += 25;

  // Summary cards
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

  // Draw summary boxes
  const boxWidth = 43;
  const boxHeight = 20;
  const boxY = yPos;
  const boxes = [
    { label: 'Clientes', value: stats.totalClientes.toString(), color: [135, 206, 235] },
    { label: 'Faturado', value: formatCurrency(stats.totalFaturado), color: [144, 238, 144] },
    { label: 'Contrib. SS', value: formatCurrency(stats.totalContribuicaoSS), color: [255, 182, 193] },
    { label: 'Líquido', value: formatCurrency(stats.totalLiquido), color: [255, 218, 185] }
  ];

  boxes.forEach((box, i) => {
    const x = 14 + (i * (boxWidth + 3));
    doc.setFillColor(box.color[0], box.color[1], box.color[2]);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(box.label, x + boxWidth / 2, boxY + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(box.value, x + boxWidth / 2, boxY + 14, { align: 'center' });
  });

  yPos = boxY + boxHeight + 10;

  // Clients table
  if (clientes.length > 0) {
    const tableData = clientes.map(c => [
      c.nome,
      `${c.horasTrabalhadas.toFixed(1)}h`,
      formatCurrency(c.valorFaturado),
      formatCurrency(c.baseIncidencia),
      formatCurrency(c.contribuicaoSS),
      formatCurrency(c.valorLiquido)
    ]);

    // Add totals row
    tableData.push([
      'TOTAL',
      '',
      formatCurrency(stats.totalFaturado),
      formatCurrency(stats.totalBaseIncidencia),
      formatCurrency(stats.totalContribuicaoSS),
      formatCurrency(stats.totalLiquido)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Cliente', 'Horas', 'Faturado', 'Base (70%)', 'SS (21,4%)', 'Líquido']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [135, 206, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didParseCell: (data) => {
        // Style the totals row
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [220, 230, 240];
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Nenhum cliente marcado como Recibo Verde neste período.', 14, yPos + 10);
    yPos += 20;
  }

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  const disclaimer = 'Nota: Este documento apresenta uma estimativa das contribuições para a Segurança Social. ' +
    'O cálculo oficial é feito trimestralmente com base na média do ano anterior.';
  const lines = doc.splitTextToSize(disclaimer, 180);
  doc.text(lines, 14, yPos);

  // Add footer
  await addProfessionalFooter(doc, yPos + 15);

  // Save the PDF
  doc.save(`RecibosVerdes_${monthName}_${year}.pdf`);
};
