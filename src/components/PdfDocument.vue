<script setup lang="ts">
import { ref, watch, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import { GlobalWorkerOptions, getDocument, PDFDataRangeTransport, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { TypedArray, DocumentInitParameters } from 'pdfjs-dist/types/src/display/api'
import debounce from 'lodash/debounce'
import PdfPage from './PdfPage.vue'

const props = defineProps<{
  hideText?: boolean,
  hideNumber?: boolean,
  zoom: number | string,
  workerJs: string,
  viewport: {
    width: number,
    height: number
  },
  src: string | URL | PDFDataRangeTransport | TypedArray | DocumentInitParameters
}>()
const emits = defineEmits<{ (e: 'error', error: any): void }>()

const pixelRatio = ref(window.devicePixelRatio)
const pdfDoc = shallowRef<PDFDocumentProxy>()
const pdfPages = shallowRef<PDFPageProxy[]>([])
const observer = shallowRef<IntersectionObserver>()
const rootEl = ref()
const pageComps = ref<any[]>([])

function setPageComp(component: any) {
  pageComps.value.push(component)
}
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
  console.debug(`new pixel ratio=${window.devicePixelRatio}`)
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
  observer.value = new IntersectionObserver(debounce((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const foundComp = pageComps.value.find(comp => comp?.rootEl === entry.target)
        if (foundComp) {
          foundComp.inViewport = true
        }
      }
    })
  }, 50), {
    // root: rootEl.value,
    rootMargin: '0px'
  })
})
onBeforeUnmount(() => {
  mediaQuery.removeEventListener("change", updatePixelRatio)
  cleanupDoc()
  observer.value?.disconnect()
})
</script>

<template>
  <div ref="rootEl">
    <pdf-page
      v-for="page in pdfPages"
      :ref="setPageComp"
      :key="page.pageNumber"
      :page="page"
      :hide-number="hideNumber"
      :hide-text="hideText"
      :pixelRatio="pixelRatio"
      :zoom="zoom"
      :observer="observer"
      :viewport="viewport"
    >
      <template #default="{ width, height }">
        <slot :page="page.pageNumber" :width="width" :height="height"></slot>
      </template>
    </pdf-page>
  </div>
</template> 