import jsPDF from 'jspdf';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

// Convert image to base64 for PDF embedding
const getLogoBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = logoMayslimpo;
  });
};

// Professional PDF header with logo
export const addProfessionalHeader = async (
  doc: jsPDF, 
  title: string, 
  subtitle: string
): Promise<void> => {
  try {
    const logoBase64 = await getLogoBase64();
    
    // Header background with gradient effect (two rectangles)
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 220, 5, 'F');
    
    // Add logo
    doc.addImage(logoBase64, 'JPEG', 14, 8, 24, 24);
    
    // Company name and title
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('MaysLimpo', 44, 18);
    
    // Slogan
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 220, 255);
    doc.text('Limpeza Profissional', 44, 24);
    
    // Title and subtitle on right side
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 196, 18, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 220, 255);
    doc.text(subtitle, 196, 26, { align: 'right' });
    
    // Decorative line at bottom of header
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(14, 36, 196, 36);
    
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
    // Fallback without logo
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('MaysLimpo', 14, 20);
    doc.setFontSize(14);
    doc.text(title, 196, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 255);
    doc.text(subtitle, 196, 26, { align: 'right' });
  }
};

// Professional PDF footer with logo and generation info
export const addProfessionalFooter = async (
  doc: jsPDF,
  yPosition: number
): Promise<void> => {
  const pageHeight = doc.internal.pageSize.height;
  const footerY = Math.max(yPosition + 15, pageHeight - 25);
  
  try {
    const logoBase64 = await getLogoBase64();
    
    // Footer line
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(14, footerY, 196, footerY);
    
    // Small logo in footer
    doc.addImage(logoBase64, 'JPEG', 14, footerY + 3, 10, 10);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(139, 92, 246);
    doc.setFont('helvetica', 'bold');
    doc.text('Documento gerado por MaysLimpo', 28, footerY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`${dateStr} às ${timeStr}`, 28, footerY + 13);
    
    // Website/contact on right
    doc.setTextColor(139, 92, 246);
    doc.text('www.mayslimpo.pt', 196, footerY + 10, { align: 'right' });
    
  } catch (error) {
    console.error('Error adding footer logo:', error);
    // Fallback without logo
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(14, footerY, 196, footerY);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Documento gerado por MaysLimpo - ${dateStr} às ${timeStr}`, 14, footerY + 8);
  }
};

// Get the starting Y position after the professional header
export const getContentStartY = (): number => 52;
