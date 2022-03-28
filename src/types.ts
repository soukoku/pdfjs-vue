import { PDFDataRangeTransport } from 'pdfjs-dist'
import type {
  TypedArray,
  DocumentInitParameters
} from 'pdfjs-dist/types/src/display/api'

/**
 * Types of zooms supported in pdf display.
 */
export enum ZoomType {
  /**
   * Auto zoom to fit width of host until a certain limit.
   */
  Auto,
  /**
   * Fits width of host with no limit.
   */
  WidthFit,
  /**
   * Fits whole page in the host.
   */
  PageFit,
  /**
   * Custom zoom value percentage.
   */
  Custom
}

/**
 * Source of pdf to display in the host.
 */
export type PdfSource =
  | string
  | URL
  | PDFDataRangeTransport
  | TypedArray
  | DocumentInitParameters
