import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Task } from '@/hooks/useAgendamentos';
import { addProfessionalHeader, getContentStartY } from './pdfHelpers';

const formatDateLong = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const fmtCurrency = (n: number): string => `${n.toFixed(2)} €`;

/**
 * Generate a printable "daily route sheet" with one row per service.
 * Useful to print or share with the employee in the morning.
 */
export const generateDailyRoutePdf = async (
  date: string,
  tasks: Task[]
): Promise<void> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  await addProfessionalHeader(
    doc,
    'Folha do Dia',
    formatDateLong(date)
  );

  const startY = getContentStartY();

  if (tasks.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text('Sem serviços agendados para este dia.', 14, startY + 10);
    doc.save(`folha-do-dia-${date}.pdf`);
    return;
  }

  const sortedTasks = [...tasks].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  const totalValue = sortedTasks.reduce(
    (sum, t) => sum + (parseFloat(t.price) || 0),
    0
  );
  const totalHours = sortedTasks.reduce((sum, t) => {
    const [sh, sm] = t.startTime.split(':').map(Number);
    const [eh, em] = t.endTime.split(':').map(Number);
    return sum + (eh * 60 + em - (sh * 60 + sm)) / 60;
  }, 0);

  autoTable(doc, {
    startY: startY + 4,
    head: [['Hora', 'Cliente', 'Morada', 'Telefone', 'Notas', '€']],
    body: sortedTasks.map(t => [
      `${t.startTime}\n${t.endTime}`,
      t.client,
      t.address || '-',
      t.phone || '-',
      t.notes || '',
      fmtCurrency(parseFloat(t.price) || 0),
    ]),
    foot: [[
      '',
      `${sortedTasks.length} serviço${sortedTasks.length > 1 ? 's' : ''}`,
      '',
      '',
      `${totalHours.toFixed(1)} h`,
      fmtCurrency(totalValue),
    ]],
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: 'middle',
      lineColor: [220, 220, 220],
    },
    headStyles: {
      fillColor: [135, 206, 235],
      textColor: 255,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [240, 248, 255],
      textColor: [50, 50, 50],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 50 },
      3: { cellWidth: 26 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 18, halign: 'right' },
    },
  });

  doc.save(`folha-do-dia-${date}.pdf`);
};
