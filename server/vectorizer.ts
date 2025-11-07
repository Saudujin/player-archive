import axios from "axios";
import FormData from "form-data";
import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";

const VECTORIZER_API_URL = "https://vectorizer.ai/api/v1/vectorize";
const API_ID = process.env.VECTORIZER_API_ID!;
const API_SECRET = process.env.VECTORIZER_API_SECRET!;

/**
 * Vectorize image using Vectorizer.AI
 * Returns SVG content as string
 */
export async function vectorizeImage(imageBuffer: Buffer): Promise<string> {
  const formData = new FormData();
  formData.append("image", imageBuffer, { filename: "image.png" });
  formData.append("mode", "production");

  const response = await axios.post(VECTORIZER_API_URL, formData, {
    auth: {
      username: API_ID,
      password: API_SECRET,
    },
    headers: formData.getHeaders(),
    responseType: "text",
  });

  return response.data;
}

/**
 * Convert SVG to PDF using pdfkit
 */
export async function svgToPdf(svgContent: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Add SVG to PDF
      SVGtoPDF(doc, svgContent, 0, 0, {
        width: doc.page.width,
        height: doc.page.height,
        preserveAspectRatio: "xMidYMid meet",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
