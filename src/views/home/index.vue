<template>
   <div class="main-content text-center">
      <span class="title text-[30px] text-[#cf1a32]">{{ homeInfo.title }}</span>
   </div>
</template>

<script lang="ts" setup>
import { useHomeStoreHook } from '@/store/modules/home';
const store = useHomeStoreHook();

const homeInfo = {
   title: store.title,
};
</script>


