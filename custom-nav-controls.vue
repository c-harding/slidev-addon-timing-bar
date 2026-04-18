<script setup lang="ts">
import { useNav } from '@slidev/client';
import SlideTimingBar from './components/timing/SlideTimingBar.vue';

const { isPresenter } = useNav();
</script>

<template>
  <SlideTimingBar v-if="isPresenter" />
</template>
