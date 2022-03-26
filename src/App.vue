<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import PdfDocument from './components/PdfDocument.vue'



</script>

<template>
  <pdf-document
    worker-js="/js/pdfjs/2.13.216/pdf.worker.min.js"
    src="/samples/compressed.tracemonkey-pldi-09.pdf"
  ></pdf-document>
</template>
