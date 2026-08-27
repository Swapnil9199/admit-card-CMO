import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generate and download a high-resolution 2-Page PDF for a candidate admit card
 */
export async function downloadAdmitCardPdf(elementId, candidateName = "Candidate") {
  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error("Admit card container element not found");
  }

  // Find page elements
  const pages = container.querySelectorAll('.admit-card-page');
  if (!pages || pages.length === 0) {
    throw new Error("No admit card pages found in container");
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 5; // 5mm margin

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const canvas = await html2canvas(page, {
      scale: 2.5, // Crisp high-DPI rendering
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const titleNodes = clonedDoc.querySelectorAll('.admit-card-title-text');
        titleNodes.forEach(node => {
          node.style.color = '#000000';
          node.style.visibility = 'visible';
          node.style.opacity = '1';
          node.style.display = 'block';
          node.style.fontWeight = '900';
        });
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const renderWidth = pdfWidth - (margin * 2);
    const renderHeight = (canvas.height * renderWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', margin, margin, renderWidth, Math.min(renderHeight, pdfHeight - (margin * 2)));
  }

  const sanitizedFilename = `Admit_Card_${candidateName.replace(/\s+/g, '_')}.pdf`;
  pdf.save(sanitizedFilename);
}

/**
 * Generate raw base64 string of the 2-Page PDF for email attachment dispatch
 */
export async function generateAdmitCardPdfBase64(elementId, candidateName = "Candidate") {
  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error("Admit card container element not found");
  }

  const pages = container.querySelectorAll('.admit-card-page');
  if (!pages || pages.length === 0) {
    throw new Error("No admit card pages found in container");
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 5;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const canvas = await html2canvas(page, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const titleNodes = clonedDoc.querySelectorAll('.admit-card-title-text');
        titleNodes.forEach(node => {
          node.style.color = '#000000';
          node.style.visibility = 'visible';
          node.style.opacity = '1';
          node.style.display = 'block';
          node.style.fontWeight = '900';
        });
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const renderWidth = pdfWidth - (margin * 2);
    const renderHeight = (canvas.height * renderWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', margin, margin, renderWidth, Math.min(renderHeight, pdfHeight - (margin * 2)));
  }

  const sanitizedFilename = `Admit_Card_${candidateName.replace(/\s+/g, '_')}.pdf`;
  // Extract base64 without data URI prefix
  const dataUri = pdf.output('datauristring');
  const base64Content = dataUri.split(',')[1];

  return {
    pdfBase64: base64Content,
    filename: sanitizedFilename
  };
}

/**
 * Generate a merged PDF for multiple candidates in batch
 */
export async function generateBatchAdmitCardsPdf(containerId, progressCallback) {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error("Batch print container not found");
  }

  const pages = container.querySelectorAll('.admit-card-page');
  if (!pages || pages.length === 0) {
    throw new Error("No admit card pages found");
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 5;

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    if (progressCallback) {
      progressCallback(Math.round(((i + 1) / pages.length) * 100));
    }

    const page = pages[i];
    const canvas = await html2canvas(page, {
      scale: 2.2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1000
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const renderWidth = pdfWidth - (margin * 2);
    const renderHeight = (canvas.height * renderWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', margin, margin, renderWidth, Math.min(renderHeight, pdfHeight - (margin * 2)));
  }

  pdf.save(`Batch_Admit_Cards_${Date.now()}.pdf`);
}
