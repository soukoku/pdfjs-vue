<script setup lang="ts">
import { ref, watch, shallowRef, onUnmounted, onMounted, onBeforeUnmount } from 'vue'
import { GlobalWorkerOptions, getDocument, PDFDataRangeTransport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
// import { TypedArray, DocumentInitParameters } from 'pdfjs-dist/types/src/display/api'
import PdfPage from './PdfPage.vue'

const props = defineProps<{ workerJs: string, src: string | URL | PDFDataRangeTransport }>()// | TypedArray | DocumentInitParameters }>()
// defineEmits)

const error = ref('')
const pdfDoc = shallowRef<PDFDocumentProxy | null>(null)
const pdfPages = shallowRef<PDFPageProxy[]>([])
const zoom = ref(1)

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

const pixelRatio = ref(window.devicePixelRatio)
function updatePixelRatio() {
  // console.log('current pixel ratio=', window.devicePixelRatio)
  pixelRatio.value = window.devicePixelRatio
}

// listen for dpi change
const mediaQuery = matchMedia(`(resolution: 1dppx)`)

onMounted(() => {
  mediaQuery.addEventListener("change", updatePixelRatio)
})
onBeforeUnmount(() => {
  mediaQuery.removeEventListener("change", updatePixelRatio)
})

</script>

<template>
  <div>
    <p>{{ src }}</p>
    <p v-if="error">{{ error }}</p>
    <pdf-page
      v-for="page in pdfPages"
      :key="page.pageNumber"
      :page="page"
      :pixel-ratio="pixelRatio"
      :zoom="zoom"
    >
      <template #default="{ width, height }">
        <slot :page="page.pageNumber" :width="width" :height="height"></slot>
      </template>
    </pdf-page>
  </div>
</template> 