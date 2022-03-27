<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { ref } from 'vue'
import PdfDocument from './components/PdfDocument.vue'
import PdfHost from './components/PdfHost.vue'
import { ZoomType } from './types'

const scroller = ref()
const zooms = ref([{
  text: 'Auto',
  type: ZoomType.Auto
}, {
  text: 'Fit width',
  type: ZoomType.WidthFit
}, {
  text: 'Fit page',
  type: ZoomType.PageFit
}, {
  text: '200%',
  type: ZoomType.Custom,
  value: 2
}, {
  text: '175%',
  type: ZoomType.Custom,
  value: 1.75
}, {
  text: '150%',
  type: ZoomType.Custom,
  value: 1.5
}, {
  text: '125%',
  type: ZoomType.Custom,
  value: 1.25
}, {
  text: '100%',
  type: ZoomType.Custom,
  value: 1
}, {
  text: '75%',
  type: ZoomType.Custom,
  value: .75
}, {
  text: '50%',
  type: ZoomType.Custom,
  value: .5
}, {
  text: '25%',
  type: ZoomType.Custom,
  value: .25
}])
const zoomType = ref(ZoomType.Auto)
const zoom = ref(1)

function changeZoom(e: Event) {
  const target = e.target as HTMLSelectElement
  if (target && target.selectedIndex > -1) {
    const newZoom = zooms.value[target.selectedIndex]
    zoomType.value = newZoom.type
    if (newZoom.value) {
      zoom.value = newZoom.value
    }
  }
}
// watch(zoom,newZoom=>{
//   const hit = zooms.value.findIndex(z=>z.value===newZoom)
//   if()
// })

</script>

<template>
  <div style="height:100vh">
    <pdf-host ref="scroller" v-model:zoom-type="zoomType" v-model:zoom="zoom">
      <template #default="{ viewport }">
        <div style="position:fixed;top:0;z-index:1">
          <button @click="scroller.zoomIn">Zoom in</button>
          <button @click="scroller.zoomOut">Zoom out</button>
          <select @change="changeZoom">
            <option v-for="zoom in zooms" :value="zoom.value || zoom.type">{{ zoom.text }}</option>
          </select>
        </div>
        <pdf-document
          :viewport="viewport"
          :zoom-type="zoomType"
          v-model:zoom="zoom"
          worker-js="/js/pdfjs/2.13.216/pdf.worker.min.js"
          src="/samples/compressed.tracemonkey-pldi-09.pdf"
        ></pdf-document>
      </template>
    </pdf-host>
  </div>
</template>
