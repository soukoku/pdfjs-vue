<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { ref } from 'vue'
import PdfDocument from './components/PdfDocument.vue'

const zoomDelta = ref(0)
const zooms = ref([{
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
}])

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
  zoomDelta.value += .25
}
function zoomOut() {
  zoomDelta.value -= .25
}

</script>

<template>
  <div @wheel="onMouseWheel">
    <div style="position:fixed;z-index:1">
      <button @click="zoomIn">Zoom in</button>
      <select v-model="zoomDelta">
        <option v-for="zoom in zooms" :value="zoom.delta">{{ zoom.text }}</option>
      </select>
      <button @click="zoomOut">Zoom out</button>
    </div>
    <pdf-document
      :zoom="1 + zoomDelta"
      worker-js="/js/pdfjs/2.13.216/pdf.worker.min.js"
      src="/samples/compressed.tracemonkey-pldi-09.pdf"
    ></pdf-document>
  </div>
</template>
