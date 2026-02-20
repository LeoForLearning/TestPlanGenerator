// src/hooks/usePDFExport.ts
import { useRef } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

export const usePDFExport = () => {
  const ref = useRef<HTMLDivElement>(null);

  // Wait for images/SVGs/fonts to load so they render into the PNG.
  const waitForAssets = async (node: HTMLElement): Promise<void> => {
    const images = Array.from(
      node.querySelectorAll("img")
    ) as HTMLImageElement[];
    const svgImages = Array.from(
      node.querySelectorAll("svg image")
    ) as SVGImageElement[];

    const imagePromises = images.map((img: HTMLImageElement) => {
      const decode = img.decode?.bind(img);
      if (decode) {
        return decode().catch(() => undefined);
      }

      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
          return;
        }
        img.onload = img.onerror = () => resolve();
      });
    });

    const svgPromises = svgImages.map((svgImg: SVGImageElement) => {
      const href =
        svgImg.getAttribute("href") || svgImg.getAttribute("xlink:href");
      if (!href) return Promise.resolve();

      return new Promise<void>((resolve) => {
        const probe = new Image();
        probe.onload = probe.onerror = () => resolve();
        probe.src = href;
      });
    });

    await Promise.all([
      ...imagePromises,
      ...svgPromises,
      document.fonts?.ready ?? Promise.resolve(),
    ]);
  };

  const exportPDF = async (fileName = "document.pdf"): Promise<void> => {
    if (!ref.current) return;

    await waitForAssets(ref.current);

    const imgData = await htmlToImage.toPng(ref.current, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // mm of padding inside the PDF
    const usableWidth = pdfWidth - margin * 2;

    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * usableWidth) / imgProps.width;

    let heightLeft = pdfHeight - (pageHeight - margin * 2);
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, usableWidth, pdfHeight);

    while (heightLeft > 0) {
      position = margin - (pdfHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, usableWidth, pdfHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(fileName);
  };

  return { ref, exportPDF };
};
