<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { ref, watch, nextTick, computed, onMounted, onBeforeUnmount } from 'vue'
import PdfDocument from './components/PdfDocument.vue'

const rootEl = ref()
const zoomDelta = ref<number | string>('auto')
const zooms = ref([{
  text: 'auto',
  delta: 'auto'
}, {
  text: '200%',
  delta: 1
}, {
  text: '175%',
  delta: .75
}, {
  text: '150%',
  delta: .5
}, {
  text: '125%',
  delta: .25
}, {
  text: '100%',
  delta: 0
}, {
  text: '75%',
  delta: -.25
}, {
  text: '50%',
  delta: -.5
}, {
  text: '25%',
  delta: -.75
}])
const viewport = ref({ width: 0, height: 0 })

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
function zoomIn() {
  // zoomDelta.value = Math.min(zoomDelta.value + .25, 2)
}
function zoomOut() {
  // zoomDelta.value = Math.max(zoomDelta.value - .25, -.75)
}
function printScroll() {
  const root = rootEl.value as HTMLDivElement
  console.log(`cur scrolls=`, root.scrollLeft, root.scrollTop)
}
function updateViewport() {
  const root = rootEl.value
  if (root) {
    viewport.value = {
      width: root.offsetWidth,
      height: root.offsetHeight
    }
  }

}
onMounted(() => {
  window.addEventListener('resize', updateViewport)
  updateViewport()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
})
// watch(zoomDelta, (newDelta, oldDelta) => {
//   const root = rootEl.value as HTMLDivElement
//   if (root) {
//     // try to keep current scroll posn after zoom change
//     // just an idea, to be improved so it actually works
//     const curTop = root.scrollTop
//     const curLeft = root.scrollLeft
//     const zoomIn = newDelta > oldDelta
//     const change = Math.abs(newDelta - oldDelta)
//     const ratio = zoomIn ? 1 / (1 - change) : (1 - change)
//     console.log(`old scrolls ${curLeft}, ${curTop}, ${ratio}`)
//     nextTick(() => {
//       root.scrollTop = curTop * ratio
//       root.scrollLeft = curLeft * ratio
//       console.log(`new scrolls=`, root.scrollLeft, root.scrollTop)
//     })
//   }
// })

</script>

<template>
  <div
    ref="rootEl"
    @wheel="onMouseWheel"
    style="height:100vh;overflow:auto;padding:1rem 0;background:gainsboro;"
  >
    <div style="position:fixed;top:0;z-index:1">
      <button @click="zoomIn">Zoom in</button>
      <select v-model="zoomDelta">
        <option v-for="zoom in zooms" :value="zoom.delta">{{ zoom.text }}</option>
      </select>
      <button @click="zoomOut">Zoom out</button>
      <button @click="printScroll">test</button>
    </div>
    <pdf-document
      :viewport="viewport"
      :zoom="zoomDelta"
      worker-js="/js/pdfjs/2.13.216/pdf.worker.min.js"
      src="/samples/compressed.tracemonkey-pldi-09.pdf"
    ></pdf-document>
  </div>
</template>
