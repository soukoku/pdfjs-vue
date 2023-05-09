<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { PageViewport, PDFPageProxy, renderTextLayer } from 'pdfjs-dist'
import type { TextContent } from 'pdfjs-dist/types/src/display/api'

const props = defineProps<{
  viewport: PageViewport,
  page: PDFPageProxy
}>()
const textContent = ref<TextContent>()
const rootEl = ref<HTMLDivElement>()

watch(() => props.page, async page => {
  textContent.value = await page.getTextContent()
}, { immediate: true })
watch(() => [textContent.value, rootEl.value, props.viewport], () => {
  renderText()
})

let renderTask: any = undefined

function renderText() {
  const el = rootEl.value
  const text = textContent.value
  const vp = props.viewport
  if (!el || !text || !vp) return
  if (renderTask) {
    renderTask.cancel()
    return
  }
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }

  renderTask = renderTextLayer({
    textContentSource: text,
    container: el,
    viewport: vp,
    // enhanceTextSelection: true
  })
  renderTask.promise.then(() => {
    renderTask = undefined
  }).catch(() => {
    renderTask = undefined
  }).finally(() => {
    // console.log(`page ${props.page.pageNumber} has ${el.getElementsByTagName('span').length} spans`)
  })
}

onMounted(() => {
  renderText()
})

</script>
<template>
  <div ref="rootEl" class="pdf-text-layer"></div>
</template>
<style>
/*
from https://github.com/mozilla/pdf.js/blob/v2.13.216/web/text_layer_builder.css
*/
.pdf-text-layer {
  position: absolute;
  text-align: initial;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1;
  text-size-adjust: none;
}

.pdf-text-layer span,
.pdf-text-layer br {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

/* Only necessary in Google Chrome, see issue 14205, and most unfortunately
 * the problem doesn't show up in "text" reference tests. */
.pdf-text-layer span.markedContent {
  top: 0;
  height: 0;
}

.pdf-text-layer .highlight {
  margin: -1px;
  padding: 1px;
  background-color: rgba(180, 0, 170, 1);
  border-radius: 4px;
}

.pdf-text-layer .highlight.appended {
  position: initial;
}

.pdf-text-layer .highlight.begin {
  border-radius: 4px 0 0 4px;
}

.pdf-text-layer .highlight.end {
  border-radius: 0 4px 4px 0;
}

.pdf-text-layer .highlight.middle {
  border-radius: 0;
}

.pdf-text-layer .highlight.selected {
  background-color: rgba(0, 100, 0, 1);
}

.pdf-text-layer ::selection {
  background: rgb(0, 153, 255);
}

/* Avoids https://github.com/mozilla/pdf.js/issues/13840 in Chrome */
.pdf-text-layer br::selection {
  background: transparent;
}

.pdf-text-layer .endOfContent {
  display: block;
  position: absolute;
  left: 0;
  top: 100%;
  right: 0;
  bottom: 0;
  z-index: -1;
  cursor: default;
  user-select: none;
}

.pdf-text-layer .endOfContent.active {
  top: 0;
}
</style>