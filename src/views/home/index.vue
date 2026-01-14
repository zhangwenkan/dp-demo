<template>
   <div class="main-content text-center w-full h-screen bg-white">
      <div id="openseadragon1" class="w-full h-full"></div>
   </div>
</template>

<script lang="ts" setup>
import OpenSeadragon from 'openseadragon';
import { onMounted, onUnmounted, ref } from 'vue';

let viewer: any = null;
const initOpenSeadragon = () => {
  viewer = OpenSeadragon({
    id: "openseadragon1",//绑定ID
    showNavigator: true, // 是否显示导航缩略图
    prefixUrl: "/src/assets/images/openseadragon/",//openseadragon自带的一些图标
    tileSources: {
      type: "image",//图片的类型
      url: '/src/assets/images/bag.jpg',//图片的url
      // Image: {
      //    xmlns: "http://schemas.microsoft.com/deepzoom/2009",
      //    Url: "/src/assets/images/",//图片存放的路径
      //    Overlap: "0",
      //    TileSize: "1024",
      //    Format: "png",
      //    Size: {
      //       Height: "38912",
      //       Width: "24704"
      //    }
      // }
    }
  });
};

onMounted(() => {     
  initOpenSeadragon();
});

onUnmounted(() => {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
});
</script>
