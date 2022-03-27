import { PDFDataRangeTransport } from 'pdfjs-dist'
import type {
  TypedArray,
  DocumentInitParameters
} from 'pdfjs-dist/types/src/display/api'

export enum ZoomType {
  Auto,
  WidthFit,
  PageFit,
  Custom
}

export type PdfSource =
  | string
  | URL
  | PDFDataRangeTransport
  | TypedArray
  | DocumentInitParameters
