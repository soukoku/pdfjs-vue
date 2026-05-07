# pdfjs-vue3

A experimental Vue 3 component for displaying PDFs using [pdfjs](https://mozilla.github.io/pdf.js/).

## Installation

Install the package and its peer dependencies:

```bash
npm install pdfjs-vue3 pdfjs-dist
```

## Setup

### Copy the PDF.js Worker Script

The PDF.js library requires a worker script to render PDFs. You need to copy it from
`pdfjs-dist` into your app's public/static folder so it can be served at runtime.

For example, copy it into `public/js/pdfjs/`:

```bash
# unix/mac
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/js/pdfjs/

# windows
copy node_modules\pdfjs-dist\build\pdf.worker.min.mjs public\js\pdfjs\
```

You can choose any path under your public folder — just remember the URL for the next step.

### Import Styles

Import the component styles in your app entry or root component:

```ts
import 'pdfjs-vue3/dist/pdfjs-vue3.css'
```

## Usage

### Basic Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { PdfHost, ZoomType } from 'pdfjs-vue3'

const zoomType = ref(ZoomType.Auto)
const zoom = ref(1)
const files = ['/samples/my-document.pdf']
</script>

<template>
  <PdfHost
    worker-src="/js/pdfjs/pdf.worker.min.mjs"
    :sources="files"
    v-model:zoom-type="zoomType"
    v-model:zoom="zoom"
    style="height: 100vh;"
  />
</template>
```

### PdfHost Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `workerSrc` | `string` | — | URL to the pdfjs worker script. Must be set if not configured elsewhere. |
| `sources` | `PdfSource[]` | — | Array of PDF sources to display. Each source can be a URL string, `URL`, `TypedArray`, `ArrayBuffer`, or a pdfjs `DocumentInitParameters` object. |
| `sourceKey` | `(source: PdfSource, index: number) => string \| number` | — | Optional key generator for source identity in rendering. Use this when sources may contain duplicate values. |
| `zoomType` | `ZoomType` | `ZoomType.Auto` | Type of zoom behavior. |
| `zoom` | `number` | `1` | Custom zoom percentage (1 = 100%). Used when `zoomType` is `Custom`. |
| `hideText` | `boolean` | `false` | Hides the selectable text layer. |
| `hideNumber` | `boolean` | `false` | Hides the page number display. |

### PdfHost Events

| Event | Payload | Description |
|------|---------|-------------|
| `update:zoom` | `number` | Emitted when zoom changes. |
| `update:zoomType` | `ZoomType` | Emitted when zoom mode changes. |
| `error` | `{ source: PdfSource, error: unknown }` | Emitted when loading a source fails. |

### ZoomType Enum

| Value | Description |
|-------|-------------|
| `Auto` | Fits width up to a certain limit. |
| `WidthFit` | Fits width of the host with no limit. |
| `PageFit` | Fits the whole page in the host. |
| `Custom` | Uses the `zoom` prop value. |

### Exposed Methods

The `PdfHost` component exposes `zoomIn()` and `zoomOut()` methods via template ref:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { PdfHost } from 'pdfjs-vue3'

const host = ref()
</script>

<template>
  <button @click="host.zoomIn()">+</button>
  <button @click="host.zoomOut()">-</button>
  <PdfHost ref="host" worker-src="/js/pdfjs/pdf.worker.min.mjs" :sources="['/doc.pdf']" />
</template>
```

### Page Slot

Use the `#page` slot to render custom overlays on each page:

```vue
<PdfHost worker-src="/js/pdfjs/pdf.worker.min.mjs" :sources="files">
  <template #page="{ page, displaySize }">
    <div>Page {{ page.pageNumber }} — {{ displaySize.width }}×{{ displaySize.height }}</div>
  </template>
</PdfHost>
```

## License

Apache-2.0
