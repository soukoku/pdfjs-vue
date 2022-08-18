<script setup lang="ts">
import { ref, watch, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import { getDocument, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import debounce from 'lodash/debounce'
import PdfPage from './PdfPage.vue'
import { PdfSource, ZoomType } from './types'
import { OnProgressParameters } from 'pdfjs-dist/types/src/display/api'

const props = defineProps<{
  hideText: boolean,
  hideNumber: boolean,
  zoomType: ZoomType,
  zoom: number,
  viewport: {
    width: number,
    height: number
  },
  src: PdfSource
}>()
const emits = defineEmits<{
  (e: 'error', error: any): void,
  (e: 'update:zoom', zoom: number): void
}>()

// const pixelRatio = ref(window.devicePixelRatio)
const pdfDoc = shallowRef<PDFDocumentProxy>()
const pdfPages = shallowRef<PDFPageProxy[]>([])
const observer = shallowRef<IntersectionObserver>()
const rootEl = ref()
let pageComps = [] as any[]
const isLoading = ref(false)
const loadPercent = ref(0)

function setPageComp(component?: any) {
  if (!!component) {
    pageComps.push(component)
    if (pageComps.length == 1) component.inViewport = true
  }
}
function cleanupDoc() {
  pdfPages.value.forEach(pg => pg.cleanup())
  pdfPages.value = []
  const doc = pdfDoc.value
  if (doc) {
    doc.destroy()
    pdfDoc.value = undefined
  }
  pageComps = []
}
// function updatePixelRatio() {
//   console.debug(`new pixel ratio=${window.devicePixelRatio}`)
//   pixelRatio.value = window.devicePixelRatio
// }


watch(() => props.src, src => {
  cleanupDoc()
  if (!src) return

  const task = getDocument(src)
  isLoading.value = true
  task.onProgress = (prog: OnProgressParameters) => {
    if (prog.total) loadPercent.value = prog.loaded / prog.total
  }
  task.promise
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
    }).finally(() => {
      isLoading.value = false
    })
}, { immediate: true })

// listen for dpi change
// const mediaQuery = matchMedia(`(resolution: 1dppx)`)
onMounted(() => {
  // mediaQuery.addEventListener("change", updatePixelRatio)
  observer.value = new IntersectionObserver(debounce((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      const foundComp = pageComps.find(comp => comp?.rootEl === entry.target)
      if (foundComp) {
        foundComp.inViewport = entry.isIntersecting
      }
    })
  }, 50), {
    // root: rootEl.value,
    rootMargin: '0px'
  })
})
onBeforeUnmount(() => {
  // mediaQuery.removeEventListener("change", updatePixelRatio)
  cleanupDoc()
  observer.value?.disconnect()
})
</script>

<template>
  <div ref="rootEl">
    <slot name="loading" :src="props.src" :loading="isLoading" :progress="loadPercent">
      <p class="pdf-progress" v-if="isLoading">loading {{ Math.ceil(100 * loadPercent) }}%</p>
    </slot>
    <pdf-page v-for="page in pdfPages" :ref="setPageComp" :key="page.pageNumber" :page="page" :hide-number="hideNumber"
      :hide-text="hideText" :zoom-type="zoomType" :zoom="zoom" @update:zoom="emits('update:zoom', $event)"
      :observer="observer" :viewport="viewport">
      <template #default="{ displaySize }">
        <slot :doc="pdfDoc" :page="page" :displaySize="displaySize"></slot>
      </template>
    </pdf-page>
  </div>
</template> 
<style>
.pdf-progress {
  text-align: center;
  padding: 1rem;
}
</style>