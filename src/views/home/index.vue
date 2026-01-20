<template>
   <div element-loading-text="切片加载中..." element-loading-background="rgba(255, 255, 255, 0.3)" class="h-screen flex flex-col">
      <!-- 顶部工具栏 -->
      <div class="bg-gradient-to-r to-indigo-600 text-white p-3 shadow-md relative z-10">
         <div class="flex justify-between items-center">
            <div class="flex min-w-[200px] gap-3">              
               <button @click="toggleSlideList"
                  class="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center cursor-pointer">
                  <ElIcon :size="20">
                     <Document />
                  </ElIcon>
               </button>
               <button v-if="showResetButton" @click="resetView"
                  class="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center cursor-pointer">
                  <ElIcon :size="20">
                     <Refresh />
                  </ElIcon>
               </button>
            </div>

            <!-- 缩放控制区域 -->
            <div class="flex items-center gap-2">
               <div class="flex gap-1 bg-white bg-opacity-80 p-1 rounded-lg shadow-lg">
                  <button v-for="zoom in zoomLevels" :key="zoom.value" @click="setZoomLevel(zoom.value)"
                     class="px-2 py-1 text-xs font-medium rounded text-gray-800 hover:bg-indigo-600 hover:text-white transition-all duration-200 cursor-pointer">
                     {{ zoom.label }}
                  </button>
               </div>
               <button
                  class="bg-white bg-opacity-80 hover:bg-opacity-100 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center cursor-pointer"
                  :class="zoomValue > Number(imageInfo.viewInfo.scanRate) ? 'text-red-600' : 'text-gray-800'">
                  {{ zoomValue }}x
               </button>
            </div>

            <!-- <div class="flex space-x-2">
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
            </div> -->
         </div>
      </div>

      <!-- 切片列表浮动面板 -->
      <transition name="slide-left">
         <DndProvider :backend="HTML5Backend">
            <SlideListPanel ref="slideListPanelRef" :slideListVisible="slideListVisible" :currentIndex="currentIndex"
               :imageList="imageList" @toggle-slide-list="toggleSlideList" @prev-image="prevImage"
               @next-image="nextImage" @select-image="selectImage" />
         </DndProvider>
      </transition>
      <!-- 主图像区域 -->
      <div id="openseadragon1" class="w-full h-full bg-gray-100 relative"></div>
      <!-- 导航视图 -->
      <NavigatorView :viewer="viewer" :imageList="imageList" :currentIndex="currentIndex" />
      
   
    </div>
</template>

<script lang="ts" setup>
import OpenSeadragon from 'openseadragon';
import { onMounted, onUnmounted, ref, reactive, computed } from 'vue';
import { DndProvider } from 'vue3-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SlideListPanel from '@/components/SlideListPanel.vue';
import NavigatorView from '@/components/NavigatorView.vue';
import { ElIcon } from 'element-plus';
import {
   Document,
   Refresh
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

// 图像具体信息
const imageInfo = reactive({
   baseInfo: {
      "fileId": "e6e1c5b355e4bd9844731d71bc9da574",
      "rate": 20,
      "tileSize": 256,
      "maxLevel": 14,
      "calibration": 0.4672897160053253,
      "rotationAngle": 0,
      "lense": 20,
      "width": 14073,
      "height": 13022,
      "vender": "kfb"
   },
   extraInfo: [
      {
         "name": "免疫组化",
         "value": "否"
      },
      {
         "name": "取材部位",
         "value": "甲状腺"
      }
   ],
   viewInfo: {
      "fileName": "切片示例-006.kfb",
      "fileSize": "67(MB)",
      "currentRes": "0.467289716005325(μm/Pixel)",
      "imagePixel": "14073×13022(px)",
      "scanRate": "20"
   },
   userSetting: {
      "displayRuler": true,
      "displayRate": true,
      "displayNav": true,
      "navSizePc": 180,
      "qpInfoPreference": 1
   },
   additionalInfoList: [
      {
         "type": "label",
         "path": "https://qp-hz.91360.com:9001/LabelImage/2026/1/label_0dc47649-df91-4294-b57b-9bd2b1fe3b7e.jpg"
      },
      {
         "type": "macro",
         "path": "https://qp-hz.91360.com:9001/OriginalImage/2026/1/macro_6eb7bdb0-2f9f-4c6f-a504-0ff377ce9a7b.jpg"
      }
   ],
   buttonList: {
      "caseInfo": true,
      "qpInfo": true,
      "userSet": true,
      "fullPage": true,
      "language": true,
      "allQps": true,
      "exportQp": true,
      "screenshots": true,
      "mark": true,
      "imageAdjust": true,
      "auxiliaryDiagnosis": false,
      "userSetSave": true,
      "autoPlay": true,
      "splitScreen": true,
      "qrCode": false,
      "prostateDiagnosis": false,
      "dualScreen": false,
      "hideQpNameAndLabel": false,
      "replaceQpName": null,
      "waterMark": false,
      "waterMarkText": null,
      "waterMarkColor": null,
      "waterMarkFont": null,
      "importAnnotations": null,
      "keepQpListOpen": null,
      "auxiliaryAnalysis": false,
      "prostateAnalysis": false,
      "lake": "",
      "anoTypes": [],
      "autoCropWidth": 160,
      "cropFix": [
         4,
         3
      ],
      "exportAnnotations": true
   },
   seoInfo: {
      "title": "数字病理会诊平台",
      "iconUrl": "https://hz.91360.com/api/media/system/favicon.ico",
      "description": "数字病理会诊平台"
   },
   goTrans: false,
   userKey: "",
   isArchived: true
});

let viewer: any = null;
let playTimer: any = null;
let initialZoom: number = 1; // 记录初始缩放级别
let navCanvas: HTMLCanvasElement | null = null; // 导航视图canvas
let navCtx: CanvasRenderingContext2D | null = null; // canvas上下文
const slideListPanelRef = ref<InstanceType<typeof SlideListPanel> | null>(null);

// 响应式变量
const currentIndex = ref(0);
const isPlaying = ref(false);
const playInterval = ref(2000);
const playDirection = ref('forward');
const zoomValue = ref(1);
const zoomPercent = ref(100);
const slideListVisible = ref(false); // 切片列表面板是否可见

// 缩放倍数级别
const zoomLevels = [
   { label: '1x', value: 1 },
   { label: '2x', value: 2 },
   { label: '4x', value: 4 },
   { label: '10x', value: 10 },
   { label: '20x', value: 20 },
   { label: '40x', value: 40 },
   { label: '1:1', value: 1 } // 1:1 相当于原始大小
];

// 计算属性:判断是否显示复位按钮
const showResetButton = computed(() => {
   if (!slideListVisible.value || !slideListPanelRef.value) {
      return false;
   }
   // 检查面板是否在初始位置
   const position = slideListPanelRef.value.position;
   return position.x !== 60 || position.y !== 175;  // 恢复初始位置判断
});

// 初始化导航视图
const initNavigator = () => {
   navCanvas = document.getElementById('cavView') as HTMLCanvasElement;
   if (!navCanvas) return;

   // 设置canvas尺寸
   navCanvas.width = 180;
   navCanvas.height = 166;
   navCtx = navCanvas.getContext('2d');

   if (navCtx) {
      // 绘制缩略图（使用当前图片）
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
         if (navCtx) {
            // 计算缩放比例以适应canvas
            const scale = Math.min(180 / img.width, 166 / img.height);
            const width = img.width * scale;
            const height = img.height * scale;
            const x = (180 - width) / 2;
            const y = (166 - height) / 2;
            
            // 清空并绘制
            navCtx.clearRect(0, 0, 180, 166);
            navCtx.drawImage(img, x, y, width, height);
         }
      };
      img.src = imageList[currentIndex.value].url;
   }
   
   // 添加拖动/点击事件，操作导航视图更改主视图位置
   const thumbnail = document.getElementById('thumbnail');
   const viewRect = document.getElementById('viewRect');

   if (thumbnail && viewRect) {
      let isDragging = false;
      let dragOffsetX = 0; // 记录鼠标点击位置与红框中心的偏移 X
      let dragOffsetY = 0; // 记录鼠标点击位置与红框中心的偏移 Y

      const performMove = (e: MouseEvent, useOffset = true) => {
         if (!viewer) return;
         const rect = thumbnail.getBoundingClientRect();
         let clickX = e.clientX - rect.left;
         let clickY = e.clientY - rect.top;

         // 如果是拖拽状态，需要减去初始偏移量，保持红框与鼠标相对位置不变
         if (useOffset && isDragging) {
            clickX -= dragOffsetX;
            clickY -= dragOffsetY;
         }

         // 使用与 updateNavigatorView 中一致的计算方法
         const tiledImage = viewer.world.getItemAt(0);
         if (!tiledImage) return;

         const imageWidth = tiledImage.source.dimensions.x;
         const imageHeight = tiledImage.source.dimensions.y;
         const aspectRatio = imageWidth / imageHeight;

         // 参考网站逻辑：以 180px 宽度为基准计算比例
         const navImageWidth = 180;
         const navImageHeight = 180 / aspectRatio;

         // 计算偏移量以居中显示在 180x166 容器中
         const navOffsetX = 0;
         const navOffsetY = (166 - navImageHeight) / 2;

         const normalizedX = (clickX - navOffsetX) / navImageWidth;
         const normalizedY = (clickY - navOffsetY) / navImageHeight;

         viewer.viewport.panTo(new OpenSeadragon.Point(normalizedX, normalizedY), true);
      };

      thumbnail.onmousedown = (e: MouseEvent) => {
         const rect = thumbnail.getBoundingClientRect();
         const mouseX = e.clientX - rect.left;
         const mouseY = e.clientY - rect.top;

         // 获取当前 viewRect 的实时位置和尺寸
         const vrLeft = parseFloat(viewRect.style.left || '0');
         const vrTop = parseFloat(viewRect.style.top || '0');
         const vrWidth = parseFloat(viewRect.style.width || '0');
         const vrHeight = parseFloat(viewRect.style.height || '0');

         // 计算红框中心点
         const vrCenterX = vrLeft + vrWidth / 2;
         const vrCenterY = vrTop + vrHeight / 2;

         // 判断鼠标是否在红框内
         const isInside = (
            mouseX >= vrLeft &&
            mouseX <= vrLeft + vrWidth &&
            mouseY >= vrTop &&
            mouseY <= vrTop + vrHeight
         );

         if (isInside) {
            isDragging = true;
            // 记录点击位置相对于红框中心的偏移量
            dragOffsetX = mouseX - vrCenterX;
            dragOffsetY = mouseY - vrCenterY;
         } else {
            // 在红框外点击：只跳转，不开启拖动
            isDragging = false;
            performMove(e, false); // 跳转时不需要偏移
         }
      };

      window.addEventListener('mousemove', (e: MouseEvent) => {
         if (!isDragging || !viewer) return;

         const rect = thumbnail.getBoundingClientRect();
         const mouseX = e.clientX - rect.left;
         const mouseY = e.clientY - rect.top;

         // 1. 检查鼠标是否超出了 thumbnail 容器范围 (180x166)
         if (mouseX < 0 || mouseX > 180 || mouseY < 0 || mouseY > 166) {
            isDragging = false;
            return;
         }

         // 执行移动
         performMove(e);
      });

      window.addEventListener('mouseup', () => {
         isDragging = false;
      });
   }
};

// 更新导航视图的视口矩形和十字线
const updateNavigatorView = () => {
   if (!viewer || !navCanvas) return;

   // 获取视口相对于图像的坐标和尺寸 (0到1之间)
   const bounds = viewer.viewport.getBounds();
   
   // 获取图片实际尺寸
   const tiledImage = viewer.world.getItemAt(0);
   if (!tiledImage) return;
   
   const imageWidth = tiledImage.source.dimensions.x;
   const imageHeight = tiledImage.source.dimensions.y;
   const aspectRatio = imageWidth / imageHeight;
   
   // 参考网站逻辑：以 180px 宽度为基准计算比例
   const navImageWidth = 180;
   const navImageHeight = 180 / aspectRatio;
   
   // 计算偏移量以居中显示在 180x166 容器中 (注意: 容器高度实际为 166)
   const navOffsetX = 0; 
   const navOffsetY = (166 - navImageHeight) / 2;
   
   // 计算视口在缩略图中的位置和尺寸
   const viewRectX = bounds.x * navImageWidth + navOffsetX;
   const viewRectY = bounds.y * navImageWidth + navOffsetY; // 垂直位置也基于宽度比例计算
   const viewRectW = bounds.width * navImageWidth;
   const viewRectH = bounds.height * navImageWidth; // 高度同样基于宽度比例
   
   // 计算中心点（十字线交叉点）
   const centerX = viewRectX + viewRectW / 2;
   const centerY = viewRectY + viewRectH / 2;
   
   // 更新视口矩形
   const viewRect = document.getElementById('viewRect');
   if (viewRect) {
      viewRect.style.left = `${viewRectX}px`;
      viewRect.style.top = `${viewRectY}px`;
      viewRect.style.width = `${viewRectW}px`;
      viewRect.style.height = `${viewRectH}px`;
      
      // 如果视口完全在可视区域外，隐藏矩形
      const isVisible = (
         viewRectX + viewRectW > 0 && 
         viewRectX < 180 && 
         viewRectY + viewRectH > 0 && 
         viewRectY < 166
      );
      viewRect.style.display = isVisible ? 'block' : 'none';
   }
   
   // 更新十字线位置
   const hLine = document.getElementById('hLine');
   const vLine = document.getElementById('vLine');
   if (hLine) {
      hLine.style.top = `${centerY}px`;
      hLine.style.display = 'block';
   }
   if (vLine) {
      vLine.style.left = `${centerX}px`;
      vLine.style.display = 'block';
   }
};

// 初始化OpenSeadragon
const initOpenSeadragon = () => {
   if (viewer) {
      viewer.destroy();
   }

   viewer = OpenSeadragon({
      id: "openseadragon1",
      showNavigationControl: false,
      prefixUrl: "/src/assets/images/openseadragon/",
      tileSources: {
         type: "image",
         url: imageList[currentIndex.value].url
      },
      // 添加缩放事件监听
      zoomPerClick: 1.2,
      visibilityRatio: 1,
      constrainDuringPan: true,
      minZoomLevel: 0.1,
      // 关闭原生Navigator，使用自定义导航视图
      showNavigator: false
   });

   // 等待图片加载完成后记录初始zoom值并设置动态约束
   viewer.addHandler('open', function () {
      initialZoom = viewer.viewport.getHomeZoom(); // 获取初始适配视口的zoom值
      
      // 动态设置最大缩放：倍数(80x) * 初始zoom
      const maxMultiplier = Number(imageInfo.viewInfo.scanRate) * 4;
      viewer.viewport.maxZoomLevel = initialZoom * maxMultiplier;
      // 允许缩小到 0.1x
      viewer.viewport.minZoomLevel = initialZoom * 0.1;
      
      // 初始化导航视图
      initNavigator();
      // 初始更新导航视图
      updateNavigatorView();
   });

   // 监听缩放变化
   viewer.addHandler('zoom', function () {
      const currentZoom = viewer.viewport.getZoom();
      // 计算相对于初始zoom的倍数
      const actualMultiplier = initialZoom > 0 ? currentZoom / initialZoom : 1;
   
      zoomValue.value = Math.round(actualMultiplier * 10) / 10; // 保留一位小数
      zoomPercent.value = Math.round(actualMultiplier * 100);
         
      // 更新导航视图
      updateNavigatorView();
   });
      
   // 监听缩放结束事件，处理居中逻辑
   viewer.addHandler('zoom-end', function () {
      const currentZoom = viewer.viewport.getZoom();
      // 计算相对于初始zoom的倍数
      const actualMultiplier = initialZoom > 0 ? currentZoom / initialZoom : 1;
         
      // 只有当缩放到接近1:1比例（刚好能在屏幕上放下）并且当前视口中心偏离图像中心较多时才居中
      if (actualMultiplier <= 1.1 && actualMultiplier >= 0.9) { // 在1:1比例附近
         const currentCenter = viewer.viewport.getCenter();
         const imageCenter = new OpenSeadragon.Point(0.5, 0.5); // 图像中心点
            
         // 计算当前中心点与图像中心的距离
         const distance = Math.sqrt(
            Math.pow(currentCenter.x - imageCenter.x, 2) + 
            Math.pow(currentCenter.y - imageCenter.y, 2)
         );
            
         // 如果偏离超过一定阈值，则居中
         if (distance > 0.1) {
            viewer.viewport.goHome(true); // 平滑移动到居中位置
         }
      }
   });
      
   // 监听位置变化
   viewer.addHandler('pan', function () {
      // 更新导航视图
      updateNavigatorView();
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

// 设置缩放倍数级别
const setZoomLevel = (level: number) => {
   if (viewer && initialZoom > 0) {
      // 根据倍数和初始zoom值计算目标zoom
      // 例如: 如果初始zoom是0.5, 要达到2倍, 目标zoom应该是0.5 * 2 = 1.0
      const targetZoom = initialZoom * level;
      viewer.viewport.zoomTo(targetZoom);
      viewer.viewport.applyConstraints();
      zoomValue.value = level;
      zoomPercent.value = level * 100;
   }
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

// 处理键盘缩放快捷键
const handleKeyDown = (event: KeyboardEvent) => {
   const key = event.key.toLowerCase();
   const zoomMap: Record<string, number> = {
      'q': 2,
      'w': 4,
      'e': 10,
      'r': 20,
      't': 40
   };

   if (zoomMap[key]) {
      setZoomLevel(zoomMap[key]);
   }
};

onMounted(() => {
   initOpenSeadragon();
   window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
   if (viewer) {
      viewer.destroy();
      viewer = null;
   }

   if (playTimer) {
      clearInterval(playTimer);
   }

   window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
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
</style>
