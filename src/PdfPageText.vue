<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { PageViewport, PDFPageProxy, TextLayer } from 'pdfjs-dist'

const props = defineProps<{
  viewport: PageViewport,
  page: PDFPageProxy
}>()

const rootEl = ref<HTMLDivElement>()
let textLayer: TextLayer | undefined

watch(() => [props.viewport, props.page], () => {
  renderText()
})

async function renderText() {
  // console.log(`1 rendering text for page ${props.page.pageNumber}`)
  const el = rootEl.value
  const vp = props.viewport
  if (!el || !vp) return

  if (textLayer) {
    textLayer.cancel()
    textLayer = undefined
  }

  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }

  // console.log(`2 rendering text for page ${props.page.pageNumber}`)
  textLayer = new TextLayer({
    textContentSource: props.page.streamTextContent(),
    container: el,
    viewport: vp,
    // enhanceTextSelection: true
  })
  await textLayer.render()
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
from https://github.com/mozilla/pdf.js/blob/v5.6.205/web/text_layer_builder.css
*/

.pdf-text-layer {
  color-scheme: only light;

  position: absolute;
  text-align: initial;
  inset: 0;
  overflow: clip;
  opacity: 1;
  line-height: 1;
  text-size-adjust: none;
  forced-color-adjust: none;
  transform-origin: 0 0;
  caret-color: CanvasText;
  z-index: 0;

  &.highlighting {
    touch-action: none;
  }

  :is(span, br) {
    color: transparent;
    position: absolute;
    white-space: pre;
    cursor: text;
    transform-origin: 0% 0%;
  }

  /* We multiply the font size by --min-font-size, and then scale the text
   * elements by 1/--min-font-size. This allows us to effectively ignore the
   * minimum font size enforced by the browser, so that the text layer <span>s
   * can always match the size of the text in the canvas. */
  --min-font-size: 1;
  --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
  --min-font-size-inv: calc(1 / var(--min-font-size));

  > :not(.markedContent),
  .markedContent span:not(.markedContent) {
    z-index: 1;

    --font-height: 0;
    /* set by text_layer.js */
    font-size: calc(var(--text-scale-factor) * var(--font-height));

    --scale-x: 1;
    --rotate: 0deg;
    transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
  }

  .markedContent {
    display: contents;
  }

  span[role="img"] {
    user-select: none;
    cursor: default;
  }

  .highlight {
    --highlight-bg-color: rgb(180 0 170 / 0.25);
    --highlight-selected-bg-color: rgb(0 100 0 / 0.25);
    --highlight-backdrop-filter: none;
    --highlight-selected-backdrop-filter: none;

    @media screen and (forced-colors: active) {
      --highlight-bg-color: transparent;
      --highlight-selected-bg-color: transparent;
      --highlight-backdrop-filter: var(--hcm-highlight-filter);
      --highlight-selected-backdrop-filter: var(--hcm-highlight-selected-filter);
    }

    margin: -1px;
    padding: 1px;
    background-color: var(--highlight-bg-color);
    backdrop-filter: var(--highlight-backdrop-filter);
    border-radius: 4px;

    &.appended {
      position: initial;
    }

    &.begin {
      border-radius: 4px 0 0 4px;
    }

    &.end {
      border-radius: 0 4px 4px 0;
    }

    &.middle {
      border-radius: 0;
    }

    &.selected {
      background-color: var(--highlight-selected-bg-color);
      backdrop-filter: var(--highlight-selected-backdrop-filter);
      scroll-margin-top: 50px;
    }
  }

  ::selection {
    /* stylelint-disable declaration-block-no-duplicate-properties */
    /*#if !MOZCENTRAL*/
    background: rgba(0 0 255 / 0.25);
    /*#endif*/
    /* stylelint-enable declaration-block-no-duplicate-properties */
    background: color-mix(in srgb, AccentColor, transparent 75%);
  }

  /* Avoids https://github.com/mozilla/pdf.js/issues/13840 in Chrome */
  /*#if !MOZCENTRAL*/
  br::selection {
    background: transparent;
  }

  /*#endif*/

  .endOfContent {
    display: block;
    position: absolute;
    inset: 100% 0 0;
    z-index: 0;
    cursor: default;
    user-select: none;
  }

  &.selecting .endOfContent {
    top: 0;
  }
}

.textLayerImages {
  position: absolute;
  inset: 0;
  user-select: none;

  canvas {
    position: absolute;
    transform-origin: 0% 0%;
  }
}
</style>