<script setup lang="ts">
import { onMounted, watch, ref, computed, onBeforeUnmount, defineExpose } from 'vue'
import { PDFPageProxy } from 'pdfjs-dist'
import PdfPageText from './PdfPageText.vue'

const props = defineProps<{ zoom: number, pixelRatio: number, hideText: boolean, page: PDFPageProxy, observer: IntersectionObserver | undefined }>()
const canvas = ref<HTMLCanvasElement | undefined>()
const rootEl = ref()
const inViewport = ref(false)

defineExpose({ rootEl, inViewport })

const pdfScale = computed(() => {
  return props.zoom * (96 / 72)
})
const displayScale = computed(() => {
  return pdfScale.value * (props.pixelRatio || 1)
})
const pdfViewport = computed(() => {
  return props.page.getViewport({ scale: pdfScale.value })
})
const displayViewport = computed(() => {
  return props.page.getViewport({ scale: displayScale.value })
})

function renderPage() {
  if (!props.page || !canvas.value) return

  const page = props.page

  const pdfVP = pdfViewport.value
  const dispVP = displayViewport.value

  canvas.value.width = dispVP.width
  canvas.value.height = dispVP.height
  canvas.value.style.width = pdfVP.width + 'px'
  canvas.value.style.height = pdfVP.height + 'px'

  const context = canvas.value.getContext('2d')
  if (!context || !inViewport.value) return

  console.debug(`rendering page ${page.pageNumber}`)

  const renderContext = {
    canvasContext: context,
    viewport: displayViewport.value
  }
  page.render(renderContext)
}

watch(() => [props.page, displayScale.value, inViewport.value], () => {
  renderPage()
}, { immediate: true })
watch(() => props.pixelRatio, ratio => {
  console.debug('page pixel ratio changed to ' + ratio)
})
onMounted(() => {
  renderPage()
  props.observer?.observe(rootEl.value)
})
onBeforeUnmount(() => {
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
    <div class="pdf-page-number">{{ page.pageNumber }}</div>
  </div>
</template>
<style>
.pdf-page {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}
.pdf-page-layout {
  position: relative;
  display: flex;
  outline: 1px solid #ddd;
  margin-bottom: 0.5rem;
  margin: auto;
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