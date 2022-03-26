<script setup lang="ts">
import { ref, watch, shallowRef, onUnmounted } from 'vue'
import { GlobalWorkerOptions, getDocument, PDFDataRangeTransport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { TypedArray, DocumentInitParameters } from 'pdfjs-dist/types/src/display/api'
import PdfPage from './PdfPage.vue'

const props = defineProps<{ workerJs: string, src: string | URL | TypedArray | PDFDataRangeTransport | DocumentInitParameters }>()
// defineEmits)

const error = ref('')
const pdfDoc = shallowRef<PDFDocumentProxy | null>(null)
const pdfPages = shallowRef<PDFPageProxy[]>([])
function cleanupDoc() {
  pdfPages.value.forEach(pg => pg.cleanup())
  pdfPages.value = []
  const doc = pdfDoc.value
  if (doc) {
    doc.destroy()
    pdfDoc.value = null
  }
}
onUnmounted(cleanupDoc)

watch(() => props.src, src => {
  if (!GlobalWorkerOptions.workerSrc)
    GlobalWorkerOptions.workerSrc = props.workerJs
  if (!src) {
    cleanupDoc()
    return
  }

  getDocument(src).promise
    .then(doc => {
      cleanupDoc()
      pdfDoc.value = doc
    })
    .catch(err => {
      error.value = err
    })
}, { immediate: true })

watch(pdfDoc, doc => {
  if (!doc) return
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

</script>

<template>
  <div>
    <p>{{ src }}</p>
    <p v-if="error">{{ error }}</p>
    <pdf-page v-for="page in pdfPages" :key="page.pageNumber" :page="page"></pdf-page>
  </div>
</template> 