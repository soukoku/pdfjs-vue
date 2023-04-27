<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { ref } from 'vue'
import PdfHost from '../PdfHost.vue'
import { ZoomType } from '../types'

const host = ref()
const zooms = ref([{
  text: 'Auto',
  type: ZoomType.Auto,
  value: undefined,
}, {
  text: 'Fit width',
  type: ZoomType.WidthFit,
  value: undefined,
}, {
  text: 'Fit page',
  type: ZoomType.PageFit,
  value: undefined,
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

const files = ['/samples/compressed.tracemonkey-pldi-09.pdf'] //, '/samples/all-rotations.pdf']

</script>

<template>
  <div style="height:100vh;height:100dvh;">
    <pdf-host ref="host" v-model:zoom-type="zoomType" v-model:zoom="zoom"
      worker-src="/js/pdfjs/2.15.349/pdf.worker.min.js" :sources="files">
      <template #page="{ page, displaySize }">
        <div>page {{ page.pageNumber }} size = {{ displaySize }}</div>
      </template>
      <template #default>
        <div style="position:fixed;top:0;z-index:1">
          <button @click="host.zoomIn">Zoom in</button>
          <button @click="host.zoomOut">Zoom out</button>
          <select @change="changeZoom">
            <option v-for="z in zooms" :value="z.value || z.type" :selected="z.value === zoom && z.type === zoomType">{{
                z.text
            }}</option>
          </select>
        </div>
      </template>
    </pdf-host>
  </div>
</template>
