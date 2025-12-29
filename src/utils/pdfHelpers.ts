import jsPDF from 'jspdf';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

// Brand colors matching the logo - Baby blue and white
const BRAND_PRIMARY = { r: 135, g: 206, b: 235 }; // Baby blue
const BRAND_SECONDARY = { r: 100, g: 180, b: 220 }; // Slightly darker baby blue
const BRAND_LIGHT = { r: 255, g: 255, b: 255 }; // White

// Convert image to base64 for PDF embedding
const getLogoBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Create circular clip for round logo
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Center the image in the circular clip
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;
        ctx.drawImage(img, -offsetX, -offsetY, img.width, img.height);
        
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = logoMayslimpo;
  });
};

// Professional PDF header with round logo and brand colors
export const addProfessionalHeader = async (
  doc: jsPDF, 
  title: string, 
  subtitle: string
): Promise<void> => {
  try {
    const logoBase64 = await getLogoBase64();
    
    // Header background with brand colors
    doc.setFillColor(BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setFillColor(BRAND_SECONDARY.r, BRAND_SECONDARY.g, BRAND_SECONDARY.b);
    doc.rect(0, 0, 220, 5, 'F');
    
    // Add round logo with white circle background
    doc.setFillColor(255, 255, 255);
    doc.circle(26, 20, 13, 'F');
    doc.addImage(logoBase64, 'PNG', 14, 8, 24, 24);
    
    // Company name and title
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('MaysLimpo', 44, 18);
    
    // Slogan
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BRAND_LIGHT.r, BRAND_LIGHT.g, BRAND_LIGHT.b);
    doc.text('Limpeza Profissional', 44, 24);
    
    // Title and subtitle on right side
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 196, 18, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BRAND_LIGHT.r, BRAND_LIGHT.g, BRAND_LIGHT.b);
    doc.text(subtitle, 196, 26, { align: 'right' });
    
    // Decorative line at bottom of header
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(14, 36, 196, 36);
    
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
    // Fallback without logo
    doc.setFillColor(BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('MaysLimpo', 14, 20);
    doc.setFontSize(14);
    doc.text(title, 196, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(BRAND_LIGHT.r, BRAND_LIGHT.g, BRAND_LIGHT.b);
    doc.text(subtitle, 196, 26, { align: 'right' });
  }
};

// Professional PDF footer with round logo and generation info
export const addProfessionalFooter = async (
  doc: jsPDF,
  yPosition: number
): Promise<void> => {
  const pageHeight = doc.internal.pageSize.height;
  const footerY = Math.max(yPosition + 15, pageHeight - 25);
  
  try {
    const logoBase64 = await getLogoBase64();
    
    // Footer line with brand color
    doc.setDrawColor(BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b);
    doc.setLineWidth(0.5);
    doc.line(14, footerY, 196, footerY);
    
    // Small round logo in footer
    doc.setFillColor(BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b);
    doc.circle(19, footerY + 8, 6, 'F');
    doc.addImage(logoBase64, 'PNG', 14, footerY + 3, 10, 10);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Documento gerado por MaysLimpo', 28, footerY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`${dateStr} às ${timeStr}`, 28, footerY + 13);
    
    // Website/contact on right
    doc.setTextColor(BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b);
    doc.text('www.mayslimpo.pt', 196, footerY + 10, { align: 'right' });
    
  } catch (error) {
    console.error('Error adding footer logo:', error);
    // Fallback without logo
    doc.setDrawColor(BRAND_PRIMARY.r, BRAND_PRIMARY.g, BRAND_PRIMARY.b);
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
