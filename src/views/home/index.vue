<template>
   <div class="main-content">
      <span class="title font-[400]">{{ homeInfo.title }}</span>
   </div>
</template>

<script lang="ts" setup>
import { useHomeStoreHook } from '@/store/modules/home';
const store = useHomeStoreHook();

const homeInfo = {
   title: store.title,
};
</script>

<style lang="scss" scoped>
.main-content {
   display: flex;
   justify-content: center;
   align-items: center;
   flex-direction: column;
   height: 100vh;
   a {
      display: flex;
      align-items: center;
   }
   .title {
      font-size: 60px;
      font-weight: 700;
      color: transparent;
      -webkit-background-clip: text;
      background-clip: text;
      background-image: linear-gradient(to right, #f2a829, #ffc76b);
   }
}
</style>
