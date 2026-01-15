<template>
   <div class="main-content w-full h-screen bg-white flex flex-col">
      <!-- 顶部工具栏 -->
      <div class="bg-gradient-to-r to-indigo-600 text-white p-3 shadow-md relative z-10">
         <div class="flex justify-between items-center">
            <div class="flex gap-3">
               <button v-if="showResetButton" @click="resetView"
                  class="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center cursor-pointer">
                  <ElIcon :size="20">
                     <Refresh />
                  </ElIcon>
               </button>
               <button @click="toggleSlideList"
                  class="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center cursor-pointer">
                  <ElIcon :size="20">
                     <Document />
                  </ElIcon>
               </button>
            </div>
            <div class="flex space-x-2">
               <button @click="togglePlay"
                  class="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center">
                  <ElIcon :size="18" class="mr-1">
                     <VideoPlay v-if="!isPlaying" />
                     <VideoPause v-else />
                  </ElIcon>
                  {{ isPlaying ? '暂停' : '播放' }}
               </button>

               <div class="flex items-center space-x-2">
                  <span class="text-sm">间隔:</span>
                  <select v-model="playInterval" class="bg-white bg-opacity-20 text-white rounded py-1 px-2 text-sm">
                     <option value="500">0.5秒</option>
                     <option value="1000">1秒</option>
                     <option value="2000">2秒</option>
                     <option value="3000">3秒</option>
                     <option value="5000">5秒</option>
                  </select>
               </div>

               <div class="flex items-center space-x-2">
                  <span class="text-sm">方向:</span>
                  <select v-model="playDirection" class="bg-white bg-opacity-20 text-white rounded py-1 px-2 text-sm">
                     <option value="forward">正向</option>
                     <option value="backward">反向</option>
                  </select>
               </div>
            </div>
         </div>
      </div>

      <!-- 切片列表浮动面板 -->
      <transition name="slide-left">
         <DndProvider :backend="HTML5Backend">
            <SlideListPanel ref="slideListPanelRef" :slideListVisible="slideListVisible" :currentIndex="currentIndex" :imageList="imageList"
               @toggle-slide-list="toggleSlideList" @prev-image="prevImage" @next-image="nextImage"
               @select-image="selectImage" />
         </DndProvider>
      </transition>

      <div class="flex flex-1 overflow-hidden relative">
         <!-- 主图像区域 -->
         <div id="openseadragon1" class="w-full h-full bg-gray-100 relative"></div>



         <!-- 右上角缩放控制按钮 -->
         <div class="absolute top-4 right-4 z-10">
            <button @click="toggleZoomControls"
               class="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center">
               <ElIcon :size="20">
                  <Menu />
               </ElIcon>
            </button>
         </div>

         <!-- 缩放控制面板 -->
         <transition name="slide-right">
            <div v-show="zoomControlsVisible"
               class="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl z-20 p-4 transform transition-transform duration-300 ease-in-out"
               :class="{ 'translate-x-0': zoomControlsVisible, 'translate-x-full': !zoomControlsVisible }">
               <div class="flex justify-between items-center mb-4">
                  <h3 class="font-bold text-lg text-gray-800">缩放控制</h3>
                  <button @click="toggleZoomControls" class="text-gray-500 hover:text-gray-700">
                     <ElIcon :size="24">
                        <Close />
                     </ElIcon>
                  </button>
               </div>

               <div class="mb-4">
                  <div class="flex justify-between items-center mb-2">
                     <label class="text-sm font-medium text-gray-700">当前缩放: {{ zoomPercent }}%</label>
                     <span class="text-xs text-gray-500">{{ Math.min(Math.max(zoomValue, 1), 1000) }}%</span>
                  </div>
                  <input type="range" min="1" max="1000" v-model="zoomValue" @input="changeZoom"
                     class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
               </div>
               <div class="grid grid-cols-3 gap-2">
                  <button @click="zoomIn"
                     class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm py-2 px-3 rounded-lg transition duration-200 flex items-center justify-center">
                     <ElIcon :size="16">
                        <Plus />
                     </ElIcon>
                     <span class="ml-1">放大</span>
                  </button>
                  <button @click="resetZoom"
                     class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-lg transition duration-200 flex items-center justify-center">
                     <ElIcon :size="16">
                        <RefreshLeft />
                     </ElIcon>
                     <span class="ml-1">重置</span>
                  </button>
                  <button @click="zoomOut"
                     class="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm py-2 px-3 rounded-lg transition duration-200 flex items-center justify-center">
                     <ElIcon :size="16">
                        <Minus />
                     </ElIcon>
                     <span class="ml-1">缩小</span>
                  </button>
               </div>
            </div>
         </transition>
      </div>
   </div>
</template>

<script lang="ts" setup>
import OpenSeadragon from 'openseadragon';
import { onMounted, onUnmounted, ref, reactive, computed } from 'vue';
import { DndProvider } from 'vue3-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SlideListPanel from '@/components/SlideListPanel.vue';
import { ElIcon } from 'element-plus';
import { 
  Document, 
  Refresh, 
  VideoPlay, 
  VideoPause, 
  Menu,
  Close,
  Plus,
  Minus,
  RefreshLeft
} from '@element-plus/icons-vue';


// 图像列表
const imageList = reactive([
   { slideName: '切片1', adoptedPart: '甲状腺', url: '/src/assets/images/slice/1.png' },
   { slideName: '切片2', adoptedPart: '甲状腺', url: '/src/assets/images/slice/2.png' },
   { slideName: '切片3', adoptedPart: '甲状腺', url: '/src/assets/images/slice/3.png' },
   { slideName: '切片4', adoptedPart: '甲状腺', url: '/src/assets/images/slice/4.png' },
   { slideName: '切片5', adoptedPart: '甲状腺', url: '/src/assets/images/slice/5.png' },
   { slideName: '切片6', adoptedPart: '甲状腺', url: '/src/assets/images/slice/6.png' },
]);

let viewer: any = null;
let playTimer: any = null;
const slideListPanelRef = ref<InstanceType<typeof SlideListPanel> | null>(null);

// 响应式变量
const currentIndex = ref(0);
const isPlaying = ref(false);
const playInterval = ref(2000);
const playDirection = ref('forward');
const zoomValue = ref(100);
const zoomPercent = ref(100);
const zoomControlsVisible = ref(false); // 缩放控制面板是否可见
const slideListVisible = ref(false); // 切片列表面板是否可见

// 计算属性：判断是否显示复位按钮
const showResetButton = computed(() => {
   if (!slideListVisible.value || !slideListPanelRef.value) {
      return false;
   }
   // 检查面板是否在初始位置
   const position = slideListPanelRef.value.position;
   return position.x !== 60 || position.y !== 175;
});

// 初始化OpenSeadragon
const initOpenSeadragon = () => {
   if (viewer) {
      viewer.destroy();
   }

   viewer = OpenSeadragon({
      id: "openseadragon1",
      showNavigator: true,
      prefixUrl: "/src/assets/images/openseadragon/",
      tileSources: {
         type: "image",
         url: imageList[currentIndex.value].url
      },
      // 添加缩放事件监听
      zoomPerClick: 1.2,
      visibilityRatio: 1,
      constrainDuringPan: true,
      // 添加自定义控件
      showFullPageControl: true,
      showHomeControl: true,
      showZoomControl: true,
   });

   // 监听缩放变化
   viewer.addHandler('zoom', function (event) {
      const currentZoom = Math.round(viewer.viewport.getZoom() * 100);
      zoomValue.value = currentZoom;
      zoomPercent.value = currentZoom;
   });

   // 监听位置变化
   viewer.addHandler('pan', function (event) {
      // 可以在这里处理平移事件
   });
};

// 切换到上一张图片
const prevImage = () => {
   if (currentIndex.value > 0) {
      currentIndex.value--;
      initOpenSeadragon();
   }
};

// 切换到下一张图片
const nextImage = () => {
   if (currentIndex.value < imageList.length - 1) {
      currentIndex.value++;
      initOpenSeadragon();
   }
};

// 选择特定图片
const selectImage = (index: number) => {
   currentIndex.value = index;
   initOpenSeadragon();
};

// 播放/暂停
const togglePlay = () => {
   isPlaying.value = !isPlaying.value;

   if (isPlaying.value) {
      startPlay();
   } else {
      stopPlay();
   }
};

// 开始播放
const startPlay = () => {
   if (playTimer) clearInterval(playTimer);

   playTimer = setInterval(() => {
      if (playDirection.value === 'forward') {
         currentIndex.value = (currentIndex.value + 1) % imageList.length;
      } else {
         currentIndex.value = (currentIndex.value - 1 + imageList.length) % imageList.length;
      }
      initOpenSeadragon();
   }, playInterval.value);
};

// 停止播放
const stopPlay = () => {
   if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
   }
};

// 放大
const zoomIn = () => {
   if (viewer) {
      viewer.viewport.zoomBy(1.2);
      viewer.viewport.applyConstraints();
   }
};

// 缩小
const zoomOut = () => {
   if (viewer) {
      viewer.viewport.zoomBy(0.8);
      viewer.viewport.applyConstraints();
   }
};

// 重置缩放
const resetZoom = () => {
   if (viewer) {
      viewer.viewport.goHome();
   }
};

// 改变缩放值
const changeZoom = () => {
   if (viewer) {
      const zoomLevel = zoomValue.value / 100;
      viewer.viewport.zoomTo(zoomLevel);
      viewer.viewport.applyConstraints();
      zoomPercent.value = zoomValue.value;
   }
};

// 切换缩放控制面板显示/隐藏
const toggleZoomControls = () => {
   zoomControlsVisible.value = !zoomControlsVisible.value;
};

// 切换切片列表面板显示/隐藏
const toggleSlideList = () => {
   slideListVisible.value = !slideListVisible.value;
};

// 复位切片列表
const resetView = () => {
   // 重置切片列表面板到初始位置
   if (slideListPanelRef.value) {
      slideListPanelRef.value.resetPosition();
   }
};

onMounted(() => {
   initOpenSeadragon();
});

onUnmounted(() => {
   if (viewer) {
      viewer.destroy();
      viewer = null;
   }

   if (playTimer) {
      clearInterval(playTimer);
   }
});
</script>

<style scoped>
#openseadragon1 {
   flex: 1;
   height: 100%;
}

/* 过渡动画 */
.slide-enter-active,
.slide-leave-active {
   transition: transform 0.3s ease;
}

.slide-enter-from {
   transform: translateX(-100%);
}

.slide-leave-to {
   transform: translateX(-100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
   transition: transform 0.3s ease;
}

.slide-right-enter-from {
   transform: translateX(100%);
}

.slide-right-leave-to {
   transform: translateX(100%);
}

.slide-left-enter-active,
.slide-left-leave-active {
   transition: transform 0.3s ease;
}

.slide-left-enter-from {
   transform: translateX(-100%);
}

.slide-left-leave-to {
   transform: translateX(-100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
   transition: transform 0.3s ease;
}

.slide-right-enter-from {
   transform: translateX(100%);
}

.slide-right-leave-to {
   transform: translateX(100%);
}
</style>
