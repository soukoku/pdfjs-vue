<script setup lang="ts">
import { GlobalWorkerOptions } from 'pdfjs-dist'
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { PdfSource, ZoomType } from './types'
import PdfDocument from './PdfDocument.vue'
import debounce from 'lodash/debounce'

const props = defineProps<{
  /**
   * Pdfjs's worker script url. Must be set if haven't been set elsewhere.
   */
  workerSrc?: string,
  /**
   * Array of pdf sources to display.
   */
  sources: PdfSource[],
  /**
   * Type of zoom used. Defaults to Auto.
   */
  zoomType?: ZoomType,
  /**
   * Display zoom percentage if using custom zoom, defaults to 1 (100%).
   */
  zoom?: number,
  /**
   * Hides the selectable text layer.
   */
  hideText?: boolean,
  /**
   * Hides page number display.
   */
  hideNumber?: boolean,
}>()
const emits = defineEmits<{
  (e: 'update:zoom', zoom: number): void
  (e: 'update:zoomType', zoomType: ZoomType): void
}>()
const rootEl = ref()

defineExpose({
  /**
   * Try to increase zoom to the next level, up to 200%.
   */
  zoomIn,
  /**
   * Try to decrease zoom to the next level, down to 25%.
   */
  zoomOut
})

watch(() => props.workerSrc, js => {
  if (js) GlobalWorkerOptions.workerSrc = js
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
}
function zoomOut() {
  const proposed = fitZoom((props.zoom || 1) - .25)
  emits('update:zoom', Math.max(proposed, .25))
  emits('update:zoomType', ZoomType.Custom)
}
watch(() => props.zoom, (newZoom, oldZoom) => {
  const root = rootEl.value as HTMLDivElement
  if (root && newZoom && oldZoom) {
    // try to keep current scroll posn after zoom change
    // just an idea, to be improved so it actually works
    const curTop = root.scrollTop
    const curLeft = root.scrollLeft
    const ratio = newZoom / oldZoom
    // console.log(`old scrolls ${curLeft}, ${curTop}, zoom from ${oldZoom} to ${newZoom} @ ${ratio}`)
    nextTick(() => {
      root.scrollTop = curTop * ratio
      root.scrollLeft = curLeft * ratio
      // console.log(`new scrolls=`, root.scrollLeft, root.scrollTop)
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

// pz = pinch zoom gesture use, logic modified from mdn sample
const pzEvtCache = [] as PointerEvent[]
let pzPrevDiff = -1
function handlePointerDown(e: PointerEvent) {
  pzEvtCache.push(e)
}
const handlePointerMove = debounce((e: PointerEvent) => {// Find this event in the cache and update its record with this event
  for (let i = 0; i < pzEvtCache.length; i++) {
    if (e.pointerId === pzEvtCache[i].pointerId) {
      pzEvtCache[i] = e
      break
    }
  }
  // console.log('pointer move cache=' + pzEvtCache.length)
  // If two pointers are down, check for pinch gestures
  if (pzEvtCache.length === 2) {
    // Calculate the distance between the two pointers
    const dx = Math.abs(pzEvtCache[0].clientX - pzEvtCache[1].clientX)
    const dy = Math.abs(pzEvtCache[0].clientY - pzEvtCache[1].clientY)
    const curDiff = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))

    // const delta = Math.abs(curDiff - pzPrevDiff)
    // console.log('curdiff=' + curDiff + ', prev=' + pzPrevDiff + ', delta=' + delta)
    if (pzPrevDiff > 0) {

      if (curDiff > pzPrevDiff) {
        // The distance between the two pointers has increased
        zoomIn()
      }
      if (curDiff < pzPrevDiff) {
        // The distance between the two pointers has decreased
        zoomOut()
      }
    }

    // Cache the distance for the next move event
    pzPrevDiff = curDiff
  }
}, 10)

function handlePointerUp(e: PointerEvent) {
  // Remove this event from the target's cache
  for (let i = 0; i < pzEvtCache.length; i++) {
    if (pzEvtCache[i].pointerId === e.pointerId) {
      pzEvtCache.splice(i, 1)
      break
    }
  }
  // If the number of pointers down is less than two then reset diff tracker
  if (pzEvtCache.length < 2) {
    pzPrevDiff = -1
  }
}
</script>
<template>
  <div ref="rootEl" @wheel="onMouseWheel" @keydown="onKeydown" @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove" @pointerup="handlePointerUp" @pointercancel="handlePointerUp"
    @pointerleave="handlePointerUp" @pointerout="handlePointerUp" tabindex="0" class="pdf-host">
    <pdf-document v-for="src in sources" :viewport="viewport" :src="src" :hide-number="!!hideNumber"
      :hide-text="!!hideText" :zoom-type="zoomType || ZoomType.Auto" :zoom="zoom || 1"
      @update:zoom="emits('update:zoom', $event)">
      <template #loading="{ loading, progress }">
        <slot name="loading" :source="src" :loading="loading" :progress="progress"></slot>
      </template>
      <template #default="{ doc, page, displaySize }">
        <slot name="page" :source="src" :doc="doc" :page="page" :displaySize="displaySize"></slot>
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
  touch-action: pan-x pan-y;
}

.pdf-host:focus {
  outline: none;
}
</style>