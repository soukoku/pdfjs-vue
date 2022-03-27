<script setup lang="ts">
import { onMounted, watch, ref, computed, onBeforeUnmount, defineExpose } from 'vue'
import { PDFPageProxy, RenderTask } from 'pdfjs-dist'
import PdfPageText from './PdfPageText.vue'
import { ZoomType } from '../types'

const props = defineProps<{
  zoom: number,
  zoomType: ZoomType,
  hideText?: boolean,
  hideNumber?: boolean,
  viewport: {
    width: number,
    height: number
  },
  page: PDFPageProxy,
  observer: IntersectionObserver | undefined
}>()
const emits = defineEmits<{
  (e: 'update:zoom', zoom: number): void
}>()
const canvas = ref<HTMLCanvasElement>()
const rootEl = ref<HTMLDivElement>()
const inViewport = ref(false)
const maxAutoWidth = 1100

defineExpose({ rootEl, inViewport })

const baseScale = 96 / 72

const pdfScale = computed(() => {
  const { width: pageWidth, height: pageHeight } = props.page.getViewport({ scale: baseScale })
  const { width: vpWidth, height: vpHeight } = props.viewport
  let wLimit = 0
  let newZoom = 1
  switch (props.zoomType) {
    case ZoomType.Auto:
      // minus 40 for scroll bar & some space
      wLimit = Math.min(vpWidth, maxAutoWidth) - 40
      newZoom = (wLimit / pageWidth)
      return baseScale * newZoom
    case ZoomType.WidthFit:
      wLimit = vpWidth - 40
      newZoom = (wLimit / pageWidth)
      return baseScale * newZoom
    case ZoomType.PageFit:
      if (vpWidth > vpHeight) {
        // fit height
        newZoom = (vpHeight / pageHeight)
        return baseScale * newZoom
      } else {
        // fit width
        wLimit = vpWidth - 40
        newZoom = (wLimit / pageWidth)
        return baseScale * newZoom
      }
  }
  // exact zoom number
  return baseScale * props.zoom
})
const displayScale = computed(() => {
  return pdfScale.value * (window?.devicePixelRatio || 1)
})
const pdfViewport = computed(() => {
  return props.page.getViewport({ scale: pdfScale.value })
})
const displayViewport = computed(() => {
  return props.page.getViewport({ scale: displayScale.value })
})

watch(pdfScale, newScale => {
  emits('update:zoom', newScale / baseScale)
}, { immediate: true })

let renderTask: RenderTask | undefined

function renderPage() {
  if (!props.page || !canvas.value) return

  const page = props.page

  const pdfVP = pdfViewport.value
  const dispVP = displayViewport.value

  canvas.value.width = Math.ceil(dispVP.width)
  canvas.value.height = Math.ceil(dispVP.height)
  canvas.value.style.width = Math.floor(pdfVP.width) + 'px'
  canvas.value.style.height = Math.floor(pdfVP.height) + 'px'

  const context = canvas.value.getContext('2d')
  if (!context || !inViewport.value) return
  if (renderTask) {
    renderTask.cancel()
    return
  }

  console.debug(`rendering page ${page.pageNumber}`)

  const renderContext = {
    canvasContext: context,
    viewport: displayViewport.value
  }
  renderTask = page.render(renderContext)
  renderTask.promise
    .then(() => renderTask = undefined)
    .catch(() => {
      renderTask = undefined
      renderPage()
    })
}

watch(() => [props.page, displayScale.value, inViewport.value], () => {
  renderPage()
}, { immediate: true })

onMounted(() => {
  renderPage()
  if (rootEl.value)
    props.observer?.observe(rootEl.value)
})
onBeforeUnmount(() => {
  if (rootEl.value)
    props.observer?.unobserve(rootEl.value)
})

</script>
<template>
  <div ref="rootEl" class="pdf-page">
    <div class="pdf-page-layout">
      <canvas ref="canvas"></canvas>
      <div class="pdf-page-overlay">
        <pdf-page-text v-if="!hideText" :viewport="pdfViewport" :page="page" />
        <slot :width="pdfViewport.width" :height="pdfViewport.height"></slot>
      </div>
    </div>
    <div v-if="!hideNumber" class="pdf-page-number">{{ page.pageNumber }}</div>
  </div>
</template>
<style>
.pdf-page {
  margin: 1rem auto;
  display: flex;
  flex-direction: column;
}
.pdf-page-layout {
  position: relative;
  display: flex;
  margin-bottom: 0.5rem;
  margin: auto;
  background: #fff;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))
    drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
}
.pdf-page-number {
  text-align: center;
  line-height: 1.5;
}
.pdf-page-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>