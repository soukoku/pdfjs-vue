<script setup lang="ts">
import { ref, watch, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import { GlobalWorkerOptions, getDocument, PDFDataRangeTransport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { TypedArray, DocumentInitParameters } from 'pdfjs-dist/types/src/display/api'
import PdfPage from './PdfPage.vue'

const props = defineProps<{ zoom: number, workerJs: string, src: string | URL | PDFDataRangeTransport | TypedArray | DocumentInitParameters }>()
const emits = defineEmits<{ (e: 'error', error: any): void }>()

const pixelRatio = ref(window.devicePixelRatio)
const pdfDoc = shallowRef<PDFDocumentProxy>()
const pdfPages = shallowRef<PDFPageProxy[]>([])

function cleanupDoc() {
  pdfPages.value.forEach(pg => pg.cleanup())
  pdfPages.value = []
  const doc = pdfDoc.value
  if (doc) {
    doc.destroy()
    pdfDoc.value = undefined
  }
}
function updatePixelRatio() {
  pixelRatio.value = window.devicePixelRatio
}


watch(() => props.src, src => {
  if (!GlobalWorkerOptions.workerSrc)
    GlobalWorkerOptions.workerSrc = props.workerJs

  cleanupDoc()
  if (!src) return

  getDocument(src).promise
    .then(doc => {
      pdfDoc.value = doc

      const tasks = []
      for (let i = 1; i <= doc.numPages; i++) {
        tasks.push(doc.getPage(i))
      }
      Promise.all(tasks).then(pages => {
        // only load pages if still the same doc
        if (doc === pdfDoc.value)
          pdfPages.value = pages
      })
    })
    .catch(err => {
      emits('error', err)
    })
}, { immediate: true })


// listen for dpi change
const mediaQuery = matchMedia(`(resolution: 1dppx)`)
onMounted(() => {
  mediaQuery.addEventListener("change", updatePixelRatio)
})
onBeforeUnmount(() => {
  mediaQuery.removeEventListener("change", updatePixelRatio)
  cleanupDoc()
})

</script>

<template>
  <div>
    <pdf-page
      v-for="page in pdfPages"
      :hide-text="false"
      :key="page.pageNumber"
      :page="page"
      :pixel-ratio="pixelRatio"
      :zoom="zoom || 1"
    >
      <template #default="{ width, height }">
        <slot :page="page.pageNumber" :width="width" :height="height"></slot>
      </template>
    </pdf-page>
  </div>
</template> 