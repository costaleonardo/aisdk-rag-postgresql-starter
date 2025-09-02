declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }
  
  function pdfParse(dataBuffer: Buffer): Promise<PDFData>;
  export default pdfParse;
}

declare module 'mammoth' {
  interface Result {
    value: string;
    messages: any[];
  }
  
  export function extractRawText(options: { buffer: Buffer }): Promise<Result>;
  export function convertToHtml(options: { buffer: Buffer }): Promise<Result>;
}

declare module 'csv-parse/sync' {
  export function parse(input: string, options?: any): any[];
}