<script setup lang="ts">
import { ref, watch, shallowRef, onBeforeUnmount } from 'vue'
import { getDocument, PDFDocumentProxy, PDFPageProxy, OnProgressParameters } from 'pdfjs-dist'
// import debounce from 'lodash/debounce'
import PdfPage from './PdfPage.vue'
import { PdfSource, ZoomType } from './types'
import { useDevicePixelRatio } from '@vueuse/core'

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

const { pixelRatio } = useDevicePixelRatio()
const pdfDoc = shallowRef<PDFDocumentProxy>()
const pdfPages = shallowRef<PDFPageProxy[]>([])
const rootEl = ref()
const isLoading = ref(false)
const loadPercent = ref(0)
let loadingTask: ReturnType<typeof getDocument> | undefined

async function cleanupDoc() {
  if (loadingTask) {
    await loadingTask.destroy()
    loadingTask = undefined
  }
  pdfPages.value.forEach(pg => pg.cleanup())
  pdfPages.value = []
  const doc = pdfDoc.value
  if (doc) {
    doc.destroy()
    pdfDoc.value = undefined
  }
}

watch(() => props.src, async src => {
  await cleanupDoc()
  if (!src) return

  loadingTask = getDocument(src)
  isLoading.value = true
  loadingTask.onProgress = (prog: OnProgressParameters) => {
    if (prog.total) loadPercent.value = prog.loaded / prog.total
  }
  loadingTask.promise
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

onBeforeUnmount(() => {
  cleanupDoc()
})
</script>

<template>
  <div ref="rootEl">
    <slot name="loading" :src="props.src" :loading="isLoading" :progress="loadPercent">
      <p class="pdf-progress" v-if="isLoading">loading {{ Math.ceil(100 * loadPercent) }}%</p>
    </slot>
    <pdf-page v-for="page in pdfPages" :key="page.pageNumber" :page="page" :hide-number="hideNumber"
      :hide-text="hideText" :zoom-type="zoomType" :zoom="zoom" @update:zoom="emits('update:zoom', $event)"
      :viewport="viewport" :device-pixel-ratio="pixelRatio">
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