import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addProfessionalHeader, addProfessionalFooter, getContentStartY } from './pdfHelpers';
import { ClientHistory } from '@/hooks/useClientStats';

// Brand colors
const BRAND_PRIMARY = { r: 135, g: 206, b: 235 };

export const generateClientReportPdf = async (
  clientName: string,
  history: ClientHistory[],
  selectedMonthLabel?: string | null
): Promise<void> => {
  const doc = new jsPDF();
  
  // Filter only completed services
  const completedServices = history.filter(h => h.completed);
  
  // Header
  await addProfessionalHeader(doc, 'Relatório de Serviços', clientName);
  
  let yPos = getContentStartY();
  
  // Period info
  const periodLabel = selectedMonthLabel || 'Todos os períodos';
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Período: ${periodLabel}`, 14, yPos);
  
  yPos += 10;
  
  if (completedServices.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(120, 120, 120);
    doc.text('Sem serviços concluídos neste período.', 14, yPos + 10);
    await addProfessionalFooter(doc, yPos + 30);
    doc.save(`Relatorio_${clientName.replace(/\s+/g, '_')}.pdf`);
    return;
  }
  
  // Prepare table data (NO monetary values)
  const tableData = completedServices.map(service => {
    const date = new Date(service.date);
    const dayName = date.toLocaleDateString('pt-PT', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('pt-PT');
    
    // Calculate hours
    const start = new Date(`1970-01-01T${service.startTime}`);
    const end = new Date(`1970-01-01T${service.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    return [
      formattedDate,
      dayName.charAt(0).toUpperCase() + dayName.slice(1),
      `${service.startTime} - ${service.endTime}`,
      `${hours.toFixed(1)}h`
    ];
  });
  
  // Add services table
  autoTable(doc, {
    head: [['Data', 'Dia', 'Horário', 'Horas']],
    body: tableData,
    startY: yPos,
    theme: 'grid',
    headStyles: {
      fillColor: [BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      textColor: [50, 50, 50],
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { cellWidth: 45 },
      3: { cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
  });
  
  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;
  
  // Calculate totals
  const totalHours = completedServices.reduce((sum, s) => {
    const start = new Date(`1970-01-01T${s.startTime}`);
    const end = new Date(`1970-01-01T${s.endTime}`);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);
  
  // Add summary (NO monetary values)
  const summaryY = finalY + 10;
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, summaryY, 182, 28, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo', 20, summaryY + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.text(`Total de Serviços: ${completedServices.length}`, 20, summaryY + 18);
  doc.text(`Total de Horas: ${totalHours.toFixed(1)}h`, 100, summaryY + 18);
  
  // Footer
  await addProfessionalFooter(doc, summaryY + 35);
  
  // Save
  const safeClientName = clientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  doc.save(`Relatorio_Servicos_${safeClientName}.pdf`);
};
