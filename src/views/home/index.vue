<template>
   <div element-loading-text="切片加载中..." element-loading-background="rgba(255, 255, 255, 0.3)"
      class="h-screen flex flex-col">
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
               <button @click="toggleFullScreen"
                  class="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center cursor-pointer">
                  <ElIcon :size="20">
                     <FullScreen />
                  </ElIcon>
               </button>
               <button @click="toggleMeasuringMode"
                  class="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center cursor-pointer"
                  :class="{ '!bg-sky-700 !text-white': isMeasuringRef }">
                  <ElIcon :size="20">
                     <Crop />
                  </ElIcon>
               </button>
               <button @click="toggleAnnotationMode"
                  class="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center cursor-pointer"
                  :class="{ '!bg-indigo-600 !text-white': isAnnotating }">
                  <ElIcon :size="20">
                     <EditPen />
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
      
      <!-- 标注面板 -->
      <AnnotationPanel 
        :viewer="viewer" 
        :isAnnotating="isAnnotating" 
        v-show="isAnnotating" />
   </div>
</template>

<script lang="ts" setup>
import OpenSeadragon from 'openseadragon';
import { createDoodle } from "@wtsml/doodle"
import { onMounted, onUnmounted, ref, reactive, computed } from 'vue';
import { DndProvider } from 'vue3-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SlideListPanel from '@/components/SlideListPanel.vue';
import NavigatorView from '@/components/NavigatorView.vue';
import { ElIcon, ElMessage } from 'element-plus';
import {
   Document,
   Refresh,
   FullScreen,
   EditPen,
   Crop
} from '@element-plus/icons-vue';
import AnnotationPanel from '@/components/AnnotationPanel.vue';

// 图像列表
const imageList = reactive([
   { slideName: '切片1', adoptedPart: '甲状腺', url: '/src/assets/images/slice/1.jpg' },
   { slideName: '切片2', adoptedPart: '甲状腺', url: '/src/assets/images/slice/2.jpg' },
   { slideName: '切片3', adoptedPart: '甲状腺', url: '/src/assets/images/slice/3.jpg' },
   { slideName: '切片4', adoptedPart: '甲状腺', url: '/src/assets/images/slice/4.jpg' },
   { slideName: '切片5', adoptedPart: '甲状腺', url: '/src/assets/images/slice/5.jpg' },
   { slideName: '切片6', adoptedPart: '甲状腺', url: '/src/assets/images/slice/6.jpg' },
]);

// 图像具体信息
const imageInfo = reactive({
   baseInfo: {
      "fileId": "e6e1c5b355e4bd9844731d71bc9da574",
      "rate": 20,
      "tileSize": 254,
      "maxLevel": 14,
      "calibration": 0.4672897160053253,
      "rotationAngle": 0,
      "lense": 20,
      "width": 10000,
      "height": 9000,
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

// 存储所有测量线的起点和终点坐标
let measureLineId = 0;
let activeLineId: number | null = null;
let allLines: { id: number, startPoint: {left: number, top: number}, endPoint: {left: number, top: number} }[] = [];

const slideListPanelRef = ref<InstanceType<typeof SlideListPanel> | null>(null);

// 响应式变量
const currentIndex = ref(0);
const isPlaying = ref(false);
const playInterval = ref(2000);
const playDirection = ref('forward');
const zoomValue = ref(1);
const zoomPercent = ref(100);
const slideListVisible = ref(false); // 切片列表面板是否可见
const isAnnotating = ref(false);
const isMeasuringRef = ref(false);

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

// 计算两点之间的物理距离（以微米为单位）
function calculateLineDistanceInMicrometers(startPoint: {left: number, top: number}, endPoint: {left: number, top: number}) {
   // 获取图像的物理尺寸参数
   const pixelSize = imageInfo.baseInfo.calibration; // μm/Pixel
   
   // 计算两点之间的欧几里得距离（以像素为单位）
   const deltaX = (endPoint.left - startPoint.left) * imageInfo.baseInfo.width;
   const deltaY = (endPoint.top - startPoint.top) * imageInfo.baseInfo.height;
   const distanceInPixels = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
   
   // 转换为物理距离（微米）
   return distanceInPixels * pixelSize;
}

// 格式化距离显示
function formatDistance(distance_um: number): string {
   if (distance_um >= 1000) {
      // 转换为毫米，保留两位小数
      return `${(distance_um / 1000).toFixed(2)} mm`;
   } else {
      // 显示为微米，保留一位小数
      return `${distance_um.toFixed(1)} μm`;
   }
}

// 绘制所有345标记（提前声明，确保作用域）
function drawAll345Labels() {
   // 直接获取openseadragon-canvas作为父容器
   const osdContainer = document.getElementById('openseadragon1');
   if (!osdContainer) return;
   const parent = osdContainer.querySelector('.openseadragon-canvas') as HTMLElement;
   if (!parent) return;
   let textCanvas = document.getElementById('measure-text-canvas-all') as HTMLCanvasElement;
   if (!textCanvas) {
      textCanvas = document.createElement('canvas');
      textCanvas.id = 'measure-text-canvas-all';
      textCanvas.width = parent.offsetWidth;
      textCanvas.height = parent.offsetHeight;
      textCanvas.style.position = 'absolute';
      textCanvas.style.left = '0px';
      textCanvas.style.top = '0px';
      textCanvas.style.pointerEvents = 'none';
      textCanvas.style.zIndex = '1000';
      parent.appendChild(textCanvas);
   }
   
   // 确保canvas尺寸与容器一致
   if (textCanvas.width !== parent.offsetWidth || textCanvas.height !== parent.offsetHeight) {
      textCanvas.width = parent.offsetWidth;
      textCanvas.height = parent.offsetHeight;
   }
   
   const ctx = textCanvas.getContext('2d');
   if (ctx) {
      ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      allLines.forEach(item => {
         // 计算直线的物理距离
         const distance_um = calculateLineDistanceInMicrometers(item.startPoint, item.endPoint);
         const distanceText = formatDistance(distance_um);
         
         // 将终点的世界坐标转换为canvas像素坐标
         const pixelPoint = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(item.endPoint.left, item.endPoint.top), true);
            
         // 根据当前缩放级别调整字体大小
         const currentZoom = viewer.viewport.getZoom();
         const initialZoom = viewer.viewport.getHomeZoom();
         const zoomFactor = initialZoom > 0 ? currentZoom / initialZoom : 1;
         const fontSize = Math.max(16, 32 / zoomFactor); // 随缩放变小，但最小为16px
            
         ctx.font = `bold ${fontSize}px Arial`;
         ctx.fillStyle = '#ff3333';
         ctx.fillText(distanceText, pixelPoint.x + 10, pixelPoint.y + fontSize + 6);
      });
   }
}
   
// 初始化OpenSeadragon
const initOpenSeadragon = () => {
   if (viewer) {
      viewer.destroy();
   }

   // 创建一个函数来根据视口边界设置拖动控制
   const updatePanControls = () => {
      const bounds = viewer.viewport.getBounds();

      // 计算当前视口的宽高相对于图像的比例
      // 当视口边界小于图像边界时，表示图像比视口大，可以拖动
      const isViewSmallerThanImageHorizontally = bounds.x > 0 || (bounds.x + bounds.width) < 1;
      const isViewSmallerThanImageVertically = bounds.y > 0 || (bounds.y + bounds.height) < 1;

      // 当视口完全包含在图像内部时（红框小于导航视图范围），允许上下左右拖动
      if (isViewSmallerThanImageHorizontally && isViewSmallerThanImageVertically) {
         viewer.panHorizontal = true;
         viewer.panVertical = true;
      }
      // 当视口在某一个维度上与图像相等时（红框刚好等于导航视图范围），只允许另一个维度拖动
      else if (isViewSmallerThanImageHorizontally) {
         // 水平方向上视口小于图像，允许水平拖动
         viewer.panHorizontal = true;
         viewer.panVertical = false; // 垂直方向已满，不允许垂直拖动
      } else if (isViewSmallerThanImageVertically) {
         // 垂直方向上视口小于图像，允许垂直拖动
         viewer.panHorizontal = false; // 水平方向已满，不允许水平拖动
         viewer.panVertical = true;
      } else {
         // 当视口超出图像边界时（红框大于导航视图范围），不允许拖动
         viewer.panHorizontal = false;
         viewer.panVertical = false;
      }
   };

   viewer = OpenSeadragon({
      id: "openseadragon1",
      showNavigationControl: false,
      prefixUrl: "/src/assets/images/openseadragon/",
      tileSources: getCurrentTileSource(),

      // tileSources: '/assets/kfb_cells_10000.dzi',
      // 添加缩放事件监听
      zoomPerClick: 1.2,
      visibilityRatio: 0.1,
      constrainDuringPan: true, // 启用缩放和平移期间的约束
      minZoomLevel: 0.01,
      gestureSettingsMouse: {
         clickToZoom: false, // 禁用鼠标单击
         dblClickToZoom: false, // 禁用默认双击缩放
         zoomToRefPoint: true // 默认以鼠标为中心缩放
      },
      // 关闭原生Navigator，使用自定义导航视图
      showNavigator: false
   });

   // 在测量模式下处理鼠标事件
   let isMouseDown = false;
   let mouseDownPos: any = null;

   // 记录当前拖动点
   let lastDragPos: { left: number, top: number } | null = null;

   // 在viewer初始化后添加事件监听器
   const addMeasurementEventListeners = () => {
      viewer.addHandler('canvas-press', function(event) {
         if (isMeasuringRef.value) {
            isMouseDown = true;
            mouseDownPos = event.position;
            viewer.panHorizontal = false;
            viewer.panVertical = false;
            console.log('鼠标按下，开始测量');
            // 新建一条测量线时分配唯一id
            measureLineId++;
            activeLineId = measureLineId;
         }
      });

      viewer.addHandler('canvas-release', function(event) {
         if (isMeasuringRef.value && isMouseDown) {
            isMouseDown = false;
            // 重新启用拖动（如果条件允许）
            const bounds = viewer.viewport.getBounds();
            const isViewSmallerThanImageHorizontally = bounds.x > 0 || (bounds.x + bounds.width) < 1;
            const isViewSmallerThanImageVertically = bounds.y > 0 || (bounds.y + bounds.height) < 1;
            
            if (isViewSmallerThanImageHorizontally && isViewSmallerThanImageVertically) {
               viewer.panHorizontal = true;
               viewer.panVertical = true;
            } else if (isViewSmallerThanImageHorizontally) {
               viewer.panHorizontal = true;
               viewer.panVertical = false;
            } else if (isViewSmallerThanImageVertically) {
               viewer.panHorizontal = false;
               viewer.panVertical = true;
            }
            console.log('鼠标释放，结束测量');
            // 记录终点
            if (activeLineId !== null && lastDragPos && mouseDownPos) {
               // 将鼠标按下位置转换为图像坐标
               const startPoint = viewer.viewport.pointFromPixel(mouseDownPos, true);
               
               // 先移除同id
               allLines = allLines.filter(item => item.id !== activeLineId);
               allLines.push({ 
                  id: activeLineId, 
                  startPoint: { left: startPoint.x, top: startPoint.y }, 
                  endPoint: { left: lastDragPos.left, top: lastDragPos.top } 
               });
               drawAll345Labels();
            }
            activeLineId = null;
         }
      });

      viewer.addHandler('canvas-drag', function(event) {
         if (isMeasuringRef.value && isMouseDown && activeLineId !== null) {
            // 获取鼠标在容器内的像素坐标
            const osdContainer = document.getElementById('openseadragon1');
            if (!osdContainer) return;
            const parent = osdContainer.querySelector('.openseadragon-canvas') as HTMLElement;
            if (!parent) return;
            // 将鼠标点击位置转换为图像坐标
            const imagePoint = viewer.viewport.pointFromPixel(event.position, true);
            lastDragPos = { left: imagePoint.x, top: imagePoint.y };
            // 创建或获取唯一canvas
            let textCanvas = document.getElementById('measure-text-canvas-all') as HTMLCanvasElement;
            if (!textCanvas) {
               textCanvas = document.createElement('canvas');
               textCanvas.id = 'measure-text-canvas-all';
               textCanvas.width = parent.offsetWidth;
               textCanvas.height = parent.offsetHeight;
               textCanvas.style.position = 'absolute';
               textCanvas.style.left = '0px';
               textCanvas.style.top = '0px';
               textCanvas.style.pointerEvents = 'none';
               textCanvas.style.zIndex = '1000';
               parent.appendChild(textCanvas);
            }
            // 每次拖动时，先清空再绘制所有终点+当前拖动点
            const ctx = textCanvas.getContext('2d');
            if (ctx) {
               ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
               // 绘制所有已完成的终点
               allLines.forEach(item => {
                  // 计算直线的物理距离
                  const distance_um = calculateLineDistanceInMicrometers(item.startPoint, item.endPoint);
                  const distanceText = formatDistance(distance_um);
                  
                  // 将终点的世界坐标转换为canvas像素坐标
                  const pixelPoint = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(item.endPoint.left, item.endPoint.top), true);
                  
                  // 根据当前缩放级别调整字体大小
                  const currentZoom = viewer.viewport.getZoom();
                  const initialZoom = viewer.viewport.getHomeZoom();
                  const zoomFactor = initialZoom > 0 ? currentZoom / initialZoom : 1;
                  const fontSize = Math.max(16, 32 / zoomFactor); // 随缩放变小，但最小为16px
                  
                  ctx.font = `bold ${fontSize}px Arial`;
                  ctx.fillStyle = '#ff3333';
                  ctx.fillText(distanceText, pixelPoint.x + 10, pixelPoint.y + fontSize + 6);
               });
               // 绘制当前拖动点（显示当前线段的距离）
               if (lastDragPos && mouseDownPos) {
                  // 将鼠标按下和当前拖动位置转换为图像坐标
                  const startPoint = viewer.viewport.pointFromPixel(mouseDownPos, true);
                  
                  // 计算当前线段的物理距离
                  const distance_um = calculateLineDistanceInMicrometers(
                     { left: startPoint.x, top: startPoint.y },
                     { left: lastDragPos.left, top: lastDragPos.top }
                  );
                  const distanceText = formatDistance(distance_um);
                  
                  // 将当前拖动点的世界坐标转换为canvas像素坐标
                  const currentPixelPoint = viewer.viewport.pixelFromPoint(new OpenSeadragon.Point(lastDragPos.left, lastDragPos.top), true);
                  
                  // 根据当前缩放级别调整字体大小
                  const currentZoom = viewer.viewport.getZoom();
                  const initialZoom = viewer.viewport.getHomeZoom();
                  const zoomFactor = initialZoom > 0 ? currentZoom / initialZoom : 1;
                  const fontSize = Math.max(16, 32 / zoomFactor); // 随缩放变小，但最小为16px
                  
                  ctx.font = `bold ${fontSize}px Arial`;
                  ctx.fillStyle = '#ff3333';
                  ctx.fillText(distanceText, currentPixelPoint.x + 10, currentPixelPoint.y + fontSize + 6);
               }
            }
         }




      });
   };

   // 添加测量事件监听器
   addMeasurementEventListeners();

   // 自定义双击事件处理，实现第一次双击放大到4x，第二次双击放大到20x，之后不再响应双击缩放


   // 添加双击事件监听器
   viewer.addHandler('canvas-double-click', function () {
      console.log('initialZoom', zoomValue.value)
      if (zoomValue.value === 1 || zoomValue.value < 4 || (zoomValue.value <= 20 && zoomValue.value > 4)) {
         viewer.viewport.zoomTo(initialZoom * 4);
         console.log('55', zoomValue.value)
      } else if (zoomValue.value === 4 || zoomValue.value > 20) {
         viewer.viewport.zoomTo(initialZoom * 20);
      }
   })

   // 等待图片加载完成后记录初始zoom值并设置动态约束
   viewer.addHandler('open', function () {
      initialZoom = viewer.viewport.getHomeZoom(); // 获取初始适配视口的zoom值

      // 动态设置最大缩放：倍数(80x) * 初始zoom
      const maxMultiplier = Number(imageInfo.viewInfo.scanRate) * 4;
      viewer.viewport.maxZoomLevel = initialZoom * maxMultiplier;
      // 允许缩小到 0.1x
      viewer.viewport.minZoomLevel = initialZoom * 0.1;

      // 初始时根据当前缩放级别设置zoomToRefPoint
      const currentMultiplier = viewer.viewport.getZoom() / initialZoom;
      if (currentMultiplier < 1) {
         viewer.gestureSettingsMouse.zoomToRefPoint = false; // 以画布为中心缩放
      } else {
         viewer.gestureSettingsMouse.zoomToRefPoint = true; // 以鼠标位置为中心缩放
      }

      // 根据导航视图中红框大小设置初始拖动状态
      updatePanControls();

      // 初始更新导航视图
      // 注意：现在通过 NavigatorView 组件内部处理
   });

   // 监听缩放变化
   viewer.addHandler('zoom', function () {
      const currentZoom = viewer.viewport.getZoom();
      // 计算相对于初始zoom的倍数
      const actualMultiplier = initialZoom > 0 ? currentZoom / initialZoom : 1;

      zoomValue.value = Math.round(actualMultiplier * 10) / 10; // 保留一位小数
      zoomPercent.value = Math.round(actualMultiplier * 100);

      // 当缩放比例小于1:1时，动态调整zoomToRefPoint设置以实现画布中心缩放
      if (actualMultiplier < 1) {
         viewer.gestureSettingsMouse.zoomToRefPoint = false; // 以画布为中心缩放
      } else {
         viewer.gestureSettingsMouse.zoomToRefPoint = true; // 以鼠标位置为中心缩放
      }

      // 动态控制拖动功能：根据导航视图中红框大小来判断
      updatePanControls();

      // 如果缩放到足够小，强制居中
      if (actualMultiplier < 1) {
         // 应用约束以确保图像在视口范围内
         viewer.viewport.applyConstraints(true);
      }
   });

   // 监听缩放结束事件，处理居中逻辑
   viewer.addHandler('zoom-end', function () {
      const currentZoom = viewer.viewport.getZoom();
      // 计算相对于初始zoom的倍数
      const actualMultiplier = initialZoom > 0 ? currentZoom / initialZoom : 1;

      // 当缩放比例小于1:1时，动态调整zoomToRefPoint设置以实现画布中心缩放
      if (actualMultiplier < 1) {
         viewer.gestureSettingsMouse.zoomToRefPoint = false; // 以画布为中心缩放
      } else {
         viewer.gestureSettingsMouse.zoomToRefPoint = true; // 以鼠标位置为中心缩放
      }

      // 动态控制拖动功能：根据导航视图中红框大小来判断
      updatePanControls();

      // 当缩放到足够小时（小于1:1），自动居中
      if (actualMultiplier < 1) { // 当缩放到小于1:1时自动居中
         // 延迟执行居中操作，确保约束已应用
         setTimeout(() => {
            viewer.viewport.goHome(true); // 平滑移动到居中位置
         }, 50);
      }
   });

   // 监听位置变化
   viewer.addHandler('pan', function () {
      // 当缩放倍数小于1且位置偏离中心时，适当约束位置
      const currentZoom = viewer.viewport.getZoom();
      const actualMultiplier = initialZoom > 0 ? currentZoom / initialZoom : 1;

      if (actualMultiplier < 1) {
         // 应用约束以确保图像不会完全移出视野
         viewer.viewport.applyConstraints(true);
      }
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

// 切换全屏模式
const toggleFullScreen = () => {
   if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
         console.error(`进入全屏模式失败: ${err.message}`);
      });
   } else {
      if (document.exitFullscreen) {
         document.exitFullscreen();
      }
   }
};

// 根据文件扩展名获取适当的tileSources配置
const getCurrentTileSource = () => {
   const currentImage = imageList[currentIndex.value];
   if (currentIndex.value === 0) {
      // 第一张切片直接返回URL字符串
      return '/assets/kfb_cells_10000.dzi';
   } else {
      // 对于普通图像文件，返回对象格式
      return {
         type: "image",
         url: currentImage.url
      };
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

// 测量相关变量
let doodle: any = null;
let isMeasuring = false;

// 清除测量模式下的距离文字画布
const clearMeasurementTextCanvas = () => {
  const textCanvas = document.getElementById('measure-text-canvas-all') as HTMLCanvasElement;
  if (textCanvas) {
    const ctx = textCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    }
    // 移除元素
    textCanvas.remove();
   }
}

// 测量模式切换
const toggleMeasuringMode = () => {
   if (isMeasuring) {
      // 退出测量模式
      if (doodle) {
         doodle.destroy();
         doodle = null;
      }
      // 清除距离文字画布
      clearMeasurementTextCanvas();
      isMeasuring = false;
      isMeasuringRef.value = false;
      console.log('退出测量模式');
   } else {
      // 在进入测量模式前，先退出标注模式
      if (isAnnotating.value) {
         isAnnotating.value = false;
         console.log('退出标注模式');
      }
      
      // 进入测量模式
      doodle = createDoodle({
         viewer, // openseadragon viewer
         // 监听添加 shape 事件
         onAdd: (shape: any) => {
            doodle.addShape(shape)
         },
         // 监听删除 shape 事件
         onRemove: (shape: any) => {
            doodle.removeShape(shape)
         },
         // 监听更新 shape 事件
         onUpdate: (shape: any) => {
            doodle.updateShape(shape)
         },
         // 监听选中 shape 事件
         onSelect: (shape: any) => {
            console.log("选中了shape", shape)
         },
         // 监听取消选中 shape 事件
         onCancelSelect: (shape: any) => {
            console.log("取消选中了shape", shape)
         },
      });

      // 设置为线绘制模式
      if (doodle.setMode) {
         doodle.setMode('line');
         // 设置openseadragon-canvas下最后一个canvas的id
         setTimeout(() => {
           const osdCanvasWrap = document.querySelector('#openseadragon1 .openseadragon-canvas');
           if (osdCanvasWrap) {
             const canvases = osdCanvasWrap.getElementsByTagName('canvas');
             if (canvases.length > 0) {
               canvases[canvases.length - 1].id = 'doodle-line-canvas';
             }
           }
         }, 100);
      }
      
      isMeasuring = true;
      isMeasuringRef.value = true;
      // 显示提示信息
      ElMessage.warning('再次点击"测量"按钮退出测量模式！');
      console.log('进入测量模式');
   }
};

// 标注模式切换
const toggleAnnotationMode = () => {
   if (isAnnotating.value) {
      // 退出标注模式
      isAnnotating.value = false;
      console.log('退出标注模式');
   } else {
      // 在进入标注模式前，先退出测量模式
      if (isMeasuring) {
         // 退出测量模式
         if (doodle) {
            doodle.destroy();
            doodle = null;
         }
         // 清除距离文字画布
         clearMeasurementTextCanvas();
         isMeasuring = false;
         isMeasuringRef.value = false;
         console.log('退出测量模式');
      }
      
      // 进入标注模式
      isAnnotating.value = true;
      console.log('进入标注模式');
   }
};

// 添加一个方法来自定义线条样式并在测量线上方显示固定文本'666'
const customizeMeasurementDisplay = () => {
   if (!doodle) return;
   
   // 重写绘制函数以在测量线上方显示固定文本'666'
   if (doodle.on && typeof doodle.on === 'function') {
      // 监听形状添加事件，在线条上添加标签
      doodle.on('add', (shape: any) => {
         // 确保线条上显示'666'标签
         if (shape.type === 'line') {
            // 更新形状以包含标签（如果支持的话）
            if (shape.options) {
               shape.options.label = '666';
            }
         }
      });
   }
};

// 添加一个方法来确保测量线跟随缩放实时重绘
const ensureMeasurementLinesSyncWithZoom = () => {
   if (!viewer) return;
   
   // 监听缩放和动画结束事件，确保测量线和文字标签正确重绘
   viewer.addHandler('zoom', function() {
      if (isMeasuring) {
         // 延迟重绘以确保在缩放完成后进行
         setTimeout(() => {
            if (doodle && typeof doodle.redraw === 'function') {
               doodle.redraw();
            }
            // 同时重绘标签
            drawAll345Labels();
         }, 50);
      }
   });
   
   viewer.addHandler('animation-finish', function() {
      if (isMeasuring) {
         // 动画结束后重绘测量线
         if (doodle && typeof doodle.redraw === 'function') {
            doodle.redraw();
         }
         // 同时重绘标签
         drawAll345Labels();
      }
   });
   
   // 监听OpenSeadragon容器尺寸变化
   viewer.addHandler('resize', function() {
      // 重新调整measure-text-canvas-all的尺寸
      const osdContainer = document.getElementById('openseadragon1');
      if (osdContainer) {
         const parent = osdContainer.querySelector('.openseadragon-canvas') as HTMLElement;
         if (parent) {
            let textCanvas = document.getElementById('measure-text-canvas-all') as HTMLCanvasElement;
            if (textCanvas) {
               textCanvas.width = parent.offsetWidth;
               textCanvas.height = parent.offsetHeight;
            }
         }
      }
      // 也需要重绘标签
      if (isMeasuring) {
         drawAll345Labels();
      }
   });
};

// 在组件挂载后初始化测量功能
onMounted(() => {
   initOpenSeadragon();
   window.addEventListener('keydown', handleKeyDown);
   // 确保测量线与缩放同步
   setTimeout(() => {
      ensureMeasurementLinesSyncWithZoom();
      customizeMeasurementDisplay();
   }, 1000); // 等待viewer完全初始化
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