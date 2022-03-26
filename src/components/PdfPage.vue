<script setup lang="ts">
import { PDFPageProxy } from 'pdfjs-dist'
import { shallowRef } from 'vue'

const props = defineProps<{ page: PDFPageProxy }>()

</script>
<template>
  <div>{{ page.pageNumber }}</div>
</template>