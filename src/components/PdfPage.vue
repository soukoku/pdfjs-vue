<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue'
import { PDFPageProxy } from 'pdfjs-dist'
import PdfPageText from './PdfPageText.vue'

const props = defineProps<{ zoom: number, pixelRatio: number, hideText: boolean, page: PDFPageProxy }>()
const canvas = ref<HTMLCanvasElement | undefined>()

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
const canvasAttrs = computed(() => {
  const vp = pdfViewport.value

  return {
    width: vp.width * displayScale.value,
    height: vp.height * displayScale.value,
    style: {
      width: vp.width,
      height: vp.height
    }
  }
})

function renderPage() {
  if (!props.page || !canvas.value) return

  const page = props.page

  console.log(`rendering page ${page.pageNumber}`)

  const sizes = canvasAttrs.value
  canvas.value.width = sizes.width
  canvas.value.height = sizes.height
  canvas.value.style.width = sizes.style.width + 'px'
  canvas.value.style.height = sizes.style.height + 'px'

  const context = canvas.value.getContext('2d')
  if (!context) return

  const renderContext = {
    canvasContext: context,
    transform: [displayScale.value, 0, 0, displayScale.value, 0, 0],
    viewport: displayViewport.value
  }
  page.render(renderContext)
}

watch(() => [props.page, displayScale.value], () => {
  renderPage()
}, { immediate: true })

onMounted(() => {
  renderPage()
})

</script>
<template>
  <div class="pdf-page">
    <div class="pdf-page-layout">
      <canvas ref="canvas"></canvas>
      <div class="pdf-page-overlay">
        <pdf-page-text v-if="!hideText" :viewport="pdfViewport" :page="page" />
        <slot :width="canvasAttrs.width" :height="canvasAttrs.height"></slot>
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