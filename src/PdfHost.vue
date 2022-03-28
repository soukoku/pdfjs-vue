<script setup lang="ts">
import { GlobalWorkerOptions } from 'pdfjs-dist'
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { PdfSource, ZoomType } from './types'
import PdfDocument from './PdfDocument.vue'
import debounce from 'lodash/debounce'

const props = defineProps<{
  workerJs: string,
  sources: PdfSource[],
  zoomType?: ZoomType,
  zoom: number,
  hideText?: boolean,
  hideNumber?: boolean,
}>()
const emits = defineEmits<{
  (e: 'update:zoom', zoom: number): void
  (e: 'update:zoomType', zoomType: ZoomType): void
}>()
const rootEl = ref()

defineExpose({
  zoomIn,
  zoomOut
})

watch(() => props.workerJs, js => {
  GlobalWorkerOptions.workerSrc = js
}, { immediate: true })

function onMouseWheel(e: WheelEvent) {
  if (e.ctrlKey) {
    e.preventDefault()
    if (e.deltaY < 0) {
      // make scroll up zoom in
      zoomIn()
    } else {
      zoomOut()
    }
  }
}
function onKeydown(e: KeyboardEvent) {
  if (e.ctrlKey) {
    if (e.key === '0' || e.which == 48) {
      // ctrl+0 resets
      emits('update:zoomType', ZoomType.Auto)
    }
  }
}
const viewport = ref({ width: 0, height: 0 })

// function printScroll() {
//   const root = rootEl.value as HTMLDivElement
//   console.log(`cur scrolls=`, root.scrollLeft, root.scrollTop)
// }
const updateViewport = debounce(() => {
  const root = rootEl.value
  if (root) {
    viewport.value = {
      width: root.offsetWidth,
      height: root.offsetHeight
    }
  }
}, 100)

function fitZoom(zoom: number) {
  // fit zoom to increments of .25
  const overage = zoom % .25
  return Number((zoom - overage).toFixed(2))
}
function zoomIn() {
  const proposed = fitZoom((props.zoom || 1) + .25)
  emits('update:zoom', Math.min(proposed, 2))
  emits('update:zoomType', ZoomType.Custom)
  // zoomDelta.value = Math.min(zoomDelta.value + .25, 2)
}
function zoomOut() {
  const proposed = fitZoom((props.zoom || 1) - .25)
  emits('update:zoom', Math.max(proposed, .25))
  emits('update:zoomType', ZoomType.Custom)
  // zoomDelta.value = Math.max(zoomDelta.value - .25, -.75)
}
watch(() => props.zoom, (newZoom, oldZoom) => {
  const root = rootEl.value as HTMLDivElement
  if (root) {
    // try to keep current scroll posn after zoom change
    // just an idea, to be improved so it actually works
    const curTop = root.scrollTop
    const curLeft = root.scrollLeft
    const ratio = newZoom / oldZoom
    console.log(`old scrolls ${curLeft}, ${curTop}, zoom from ${oldZoom} to ${newZoom} @ ${ratio}`)
    nextTick(() => {
      root.scrollTop = curTop * ratio
      root.scrollLeft = curLeft * ratio
      console.log(`new scrolls=`, root.scrollLeft, root.scrollTop)
    })
  }
})
onMounted(() => {
  window.addEventListener('resize', updateViewport)
  updateViewport()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
})
</script>
<template>
  <div ref="rootEl" @wheel="onMouseWheel" @keydown="onKeydown" tabindex="0" class="pdf-host">
    <pdf-document
      v-for="src in sources"
      :viewport="viewport"
      :src="src"
      :hide-number="!!hideNumber"
      :hide-text="!!hideText"
      :zoom-type="zoomType || ZoomType.Auto"
      :zoom="zoom"
      @update:zoom="emits('update:zoom', $event)"
    >
      <template #default="{ doc, page, width, height }">
        <slot name="page" :doc="doc" :page="page" :width="width" :height="height"></slot>
      </template>
    </pdf-document>
    <slot></slot>
  </div>
</template>
<style>
.pdf-host {
  height: 100%;
  overflow: auto;
  padding: 1rem 0;
  background: gainsboro;
}
.pdf-host:focus {
  outline: none;
}
</style>