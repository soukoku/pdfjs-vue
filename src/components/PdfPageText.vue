<script setup lang="ts">
import { ref, watch } from 'vue'
import { PageViewport, PDFPageProxy } from 'pdfjs-dist'
import { TextContent } from 'pdfjs-dist/types/src/display/api'
import { computed } from '@vue/reactivity'

const props = defineProps<{ viewport: PageViewport, page: PDFPageProxy }>()
const textContent = ref<TextContent>()

watch(() => props.page, async page => {
  textContent.value = await page.getTextContent()
})

const displayLines = computed(() => {
  return [] as Line[]
})

interface Line {
  text: string,
  ltr: string,
  style: Record<string, string>
}

</script>
<template>
  <div class="pdf-text-layer">
    <span
      v-for="line in displayLines"
      role="presentation"
      :dir="line.ltr"
      :style="line.style"
    >{{ line.text }}</span>
  </div>
</template>
<style>
.pdf-text-layer {
  overflow: hidden;
  line-height: 1;
  opacity: 0.2;
  text-align: initial;
  width: 100%;
  height: 100%;
  text-size-adjust: none;
}
.pdf-text-layer span {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}
</style>