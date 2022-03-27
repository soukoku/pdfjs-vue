<script setup lang="ts">
import { onMounted, watch, ref, computed, onBeforeUnmount, defineExpose } from 'vue'
import { PDFPageProxy, RenderTask } from 'pdfjs-dist'
import PdfPageText from './PdfPageText.vue'

const props = defineProps<{
  zoom: number | string,
  pixelRatio: number,
  hideText?: boolean,
  hideNumber?: boolean,
  viewport: {
    width: number,
    height: number
  },
  page: PDFPageProxy,
  observer: IntersectionObserver | undefined
}>()
const canvas = ref<HTMLCanvasElement>()
const rootEl = ref<HTMLDivElement>()
const inViewport = ref(false)
const maxAutoWidth = 1100

defineExpose({ rootEl, inViewport })

const pdfScale = computed(() => {
  let scale = (96 / 72)
  if (typeof props.zoom === 'string') {
    // if (props.zoom === 'height') {
    //   // max height of rootEl
    //   const hLimit = root.offsetHeight
    // } else {
    // max width of rootEl
    const wLimit = Math.min(props.viewport.width, maxAutoWidth) - 40 // minus scroll bar & some space
    const { width: pdfWidth } = props.page.getViewport({ scale })
    console.log('wLimit=' + wLimit + ', pdfWidth=' + pdfWidth)
    scale *= (wLimit / pdfWidth)
    // }
  } else {
    scale *= props.zoom
  }
  return scale
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

let renderTask: RenderTask | undefined

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
watch(() => props.pixelRatio, ratio => {
  console.debug('page pixel ratio changed to ' + ratio)
})
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