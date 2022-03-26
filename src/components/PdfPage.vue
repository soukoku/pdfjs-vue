<script setup lang="ts">
import { computed } from '@vue/reactivity'
import { PageViewport, PDFPageProxy } from 'pdfjs-dist'
import { onMounted, shallowRef, watch, ref } from 'vue'

const props = defineProps<{ zoom: number, pixelRatio: number, page: PDFPageProxy }>()
const canvas = ref<HTMLCanvasElement | undefined>()

const pdfScale = computed(() => {
  return props.zoom * (96 / 72)
})
const displayScale = computed(() => {
  return pdfScale.value * (props.pixelRatio || 1)
})
const canvasAttrs = computed(() => {
  const vp = props.page.getViewport({ scale: pdfScale.value })

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
    viewport: page.getViewport({ scale: displayScale.value })
  }
  page.render(renderContext)
}

// defineExpose({
//   renderPage
// })

watch(() => [props.page, displayScale.value], () => {
  renderPage()
}, { immediate: true })

onMounted(() => {
  renderPage()
})

</script>
<template>
  <div style="margin-bottom:1rem; display:flex; flex-direction: column;">
    <div
      style="position:relative; display:flex; user-select: none; outline: 1px solid #ddd; margin-bottom:.5rem; margin:auto;"
    >
      <canvas ref="canvas"></canvas>
      <slot :width="canvasAttrs.width" :height="canvasAttrs.height"></slot>
    </div>
    <div style="text-align:center; line-height: 1.5;">{{ page.pageNumber }}</div>
  </div>
</template>