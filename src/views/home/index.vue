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
               <button @click="toggleFullScreen"
                  class="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center cursor-pointer">
                  <ElIcon :size="20">
                     <FullScreen />
                  </ElIcon>
               </button>
               <button @click="toggleMeasuringMode"
                  class="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-medium py-2 px-3 rounded-lg shadow-lg transition duration-200 flex items-center cursor-pointer"
                  :class="measuringMode ? 'bg-blue-500 text-white' : ''">
                  <ElIcon :size="20">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="20" height="20">
                        <path fill="currentColor" d="M128 480h768v64H128v-64z m0-256h768v64H128V224z m0 512h768v64H128v-64z"/>
                     </svg>
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
   Refresh,
   FullScreen
} from '@element-plus/icons-vue';


// 图像列表
const imageList = reactive([
   { slideName: '切片1', adoptedPart: '甲状腺', url: '/src/assets/images/slice/1.jpg' },
   { slideName: '切片2', adoptedPart: '甲状腺', url: '/src/assets/images/slice/2.jpg' },
   { slideName: '切片3', adoptedPart: '甲状腺', url: '/src/assets/images/slice/3.jpg' },
   { slideName: '切片4', adoptedPart: '甲状腺', url: '/src/assets/images/slice/4.jpg' },
   { slideName: '切片5', adoptedPart: '甲状腺', url: '/src/assets/images/slice/5.jpg' },
   { slideName: '切片6', adoptedPart: '甲状腺', url: '/src/assets/images/slice/6.jpg' },
]);

// 测量功能相关状态
const measuringMode = ref(false); // 测量模式开关
const measurementStartPoint = ref<{ x: number; y: number } | null>(null);
const measurementEndPoint = ref<{ x: number; y: number } | null>(null);
const measurementDistance = ref<number | null>(null); // 物理距离

// Canvas元素引用
let measurementCanvas: HTMLCanvasElement | null = null;
let canvasContext: CanvasRenderingContext2D | null = null;

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
      // 当视口超出图像边界时（红框大于导航视图），不允许拖动
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
    showNavigator: false,
    // 在测量模式下进一步禁用鼠标交互
    panHorizontal: true,
    panVertical: true
  });
  
  // 保存原始的鼠标事件处理器，以便在测量模式下临时禁用它们
  let originalMouseDownHandler = null;
  let originalMouseMoveHandler = null;
  let originalMouseUpHandler = null;

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
    
    // 如果处于测量模式，重绘测量线
    if (measuringMode.value) {
      redrawMeasurementLine();
    }
  });
  
  // 监听缩放和平移事件，及时更新测量线
  viewer.addHandler('animation', function () {
    if (measuringMode.value) {
      redrawMeasurementLine();
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

// 切换测量模式
const toggleMeasuringMode = () => {
   measuringMode.value = !measuringMode.value;
   
   if (measuringMode.value) {
      // 进入测量模式
      if (viewer) {
         // 保存当前的交互设置
         (viewer as any).originalPanHorizontal = viewer.panHorizontal;
         (viewer as any).originalPanVertical = viewer.panVertical;
         (viewer as any).originalDragToPan = viewer.gestureSettingsMouse.dragToPan;
         
         // 禁用拖拽平移以避免与测量冲突
         viewer.panHorizontal = false;
         viewer.panVertical = false;
         viewer.gestureSettingsMouse.dragToPan = false;
      }
      
      // 初始化Canvas
      initMeasurementCanvas();
      // 绑定鼠标事件
      bindMeasurementEvents();
   } else {
      // 退出测量模式
      if (viewer) {
         // 恢复之前的交互设置
         viewer.panHorizontal = (viewer as any).originalPanHorizontal ?? true;
         viewer.panVertical = (viewer as any).originalPanVertical ?? true;
         viewer.gestureSettingsMouse.dragToPan = (viewer as any).originalDragToPan ?? true;
      }
      
      // 清除测量数据和事件
      clearMeasurement();
      unbindMeasurementEvents();
   }
};

// 初始化测量Canvas
const initMeasurementCanvas = () => {
   // 移除旧的Canvas（如果存在）
   const existingCanvas = document.getElementById('measurement-canvas');
   if (existingCanvas) {
      existingCanvas.remove();
   }
   
   if (viewer) {
      // 创建新的Canvas元素
      measurementCanvas = document.createElement('canvas');
      measurementCanvas.id = 'measurement-canvas';
      
      // 设置Canvas样式
      Object.assign(measurementCanvas.style, {
         pointerEvents: 'none', // 让Canvas不阻挡鼠标事件
      });
      
      // 设置Canvas尺寸
      if (measurementCanvas) {
         // 设置较大的初始尺寸来提高清晰度
         measurementCanvas.width = 4000; // 较大的初始宽度
         measurementCanvas.height = 4000; // 较大的初始高度
         
         // 初始化Canvas上下文
         canvasContext = measurementCanvas.getContext('2d');
         
         // 设置初始绘制样式
         if (canvasContext) {
            canvasContext.lineCap = 'round';
            canvasContext.lineJoin = 'round';
            // 启用抗锯齿以提高清晰度
            canvasContext.imageSmoothingEnabled = true;
            canvasContext.imageSmoothingQuality = 'high';
         }
      }
      
      // 将Canvas作为overlay添加到viewer中
      if (viewer && measurementCanvas) {
         // 添加为overlay，让其随图像一起缩放
         viewer.addOverlay({
            element: measurementCanvas,
            location: new OpenSeadragon.Rect(0, 0, 1, 1), // 从图像的左上角开始，覆盖整个图像
            id: 'measurement-overlay',
            placement: OpenSeadragon.OverlayPlacement.TOP_LEFT
         });
         
         // 初始绘制
         redrawMeasurementLine();
      }
      
      // 监听缩放和平移事件，动态调整canvas大小以保持清晰度
      viewer.addHandler('zoom', function(event) {
         if (measuringMode.value) {
            redrawMeasurementLine(); // 在缩放时重新绘制
         }
      });
      
      viewer.addHandler('pan', function(event) {
         if (measuringMode.value) {
            redrawMeasurementLine();
         }
      });
      
      // 监听resize事件，调整canvas大小
      viewer.addHandler('open', function(event) {
         if (measuringMode.value) {
            setTimeout(() => {
               redrawMeasurementLine();
            }, 100);
         }
      });
   }
};

// 绑定测量相关的鼠标事件
const bindMeasurementEvents = () => {
   if (viewer) {
      // 使用OpenSeadragon的内置事件系统
      (viewer as any).measurementMouseDownHandler = (event: any) => {
         if (!measuringMode.value || !viewer || !canvasContext) return;
         
         console.log('测量模式下的鼠标按下事件触发');
         
         // 阻止默认动作
         event.originalEvent.preventDefault();
         
         // 获取鼠标位置
         const position = event.position;
         
         // 转换为OpenSeadragon视口坐标
         const viewportPoint = viewer.viewport.pointFromPixel(position);
         
         // 保存起始点
         measurementStartPoint.value = { x: viewportPoint.x, y: viewportPoint.y };
         measurementEndPoint.value = { x: viewportPoint.x, y: viewportPoint.y };
         measurementDistance.value = 0;
         
         console.log('测量起点:', measurementStartPoint.value);
         
         // 绘制起始点
         redrawMeasurementLine();
         
         // 添加移动和释放事件
         const onMouseDrag = (dragEvent: any) => {
            if (!measuringMode.value || !viewer || !canvasContext || !measurementStartPoint.value) return;
            
            dragEvent.originalEvent.preventDefault();
            
            const dragPosition = dragEvent.position;
            
            // 转换为OpenSeadragon视口坐标
            const dragViewportPoint = viewer.viewport.pointFromPixel(dragPosition);
            
            // 更新终点
            measurementEndPoint.value = { x: dragViewportPoint.x, y: dragViewportPoint.y };
            
            // 计算物理距离
            calculatePhysicalDistance();
            
            console.log('测量过程中的距离:', measurementDistance.value);
            
            // 绘制测量线
            redrawMeasurementLine();
         };
         
         const onMouseRelease = (releaseEvent: any) => {
            releaseEvent.originalEvent.preventDefault();
            
            console.log('测量结束，终点:', measurementEndPoint.value, '距离:', measurementDistance.value);
            
            // 移除临时事件
            viewer.removeHandler('canvas-drag', onMouseDrag);
            viewer.removeHandler('canvas-release', onMouseRelease);
            
            // 确保最后一次绘制
            redrawMeasurementLine();
         };
         
         viewer.addHandler('canvas-drag', onMouseDrag);
         viewer.addHandler('canvas-release', onMouseRelease);
      };
      
      viewer.addHandler('canvas-press', (viewer as any).measurementMouseDownHandler);
   }
};

// 解绑测量相关的鼠标事件
const unbindMeasurementEvents = () => {
   if (viewer) {
      const handler = (viewer as any).measurementMouseDownHandler;
      
      if (handler) {
         viewer.removeHandler('canvas-press', handler);
         (viewer as any).measurementMouseDownHandler = null;
      }
   }
};

// 清除测量数据
const clearMeasurement = () => {
   measurementStartPoint.value = null;
   measurementEndPoint.value = null;
   measurementDistance.value = null;
   
   // 清除Canvas
   if (measurementCanvas && canvasContext) {
      canvasContext.clearRect(0, 0, measurementCanvas.width, measurementCanvas.height);
   }
   
   // 如果viewer存在，移除overlay
   if (viewer) {
      try {
         viewer.removeOverlay('measurement-overlay');
      } catch (e) {
         // 如果overlay不存在则忽略错误
      }
   }
};

// 动态调整Canvas分辨率以保持清晰度
const adjustCanvasResolution = () => {
   if (!viewer || !measurementCanvas || !canvasContext) return;
   
   // 获取当前缩放级别
   const currentZoom = viewer.viewport.getZoom();
   const homeZoom = viewer.viewport.getHomeZoom();
   const zoomFactor = currentZoom / homeZoom;
   
   // 根据当前缩放级别计算合适的canvas尺寸
   // 避免canvas过大导致性能问题
   const maxCanvasSize = 4000; // 最大canvas尺寸
   
   // 基础尺寸（根据图像大小）
   const bounds = viewer.world.getBounds();
   const baseWidth = bounds.width;
   const baseHeight = bounds.height;
   
   // 计算缩放后的尺寸
   let newWidth = Math.min(Math.ceil(baseWidth * zoomFactor * 2), maxCanvasSize);
   let newHeight = Math.min(Math.ceil(baseHeight * zoomFactor * 2), maxCanvasSize);
   
   // 确保最小尺寸
   newWidth = Math.max(newWidth, 500);
   newHeight = Math.max(newHeight, 500);
   
   // 只有当尺寸变化较大时才重新创建canvas
   if (Math.abs(measurementCanvas.width - newWidth) > 100 || Math.abs(measurementCanvas.height - newHeight) > 100) {
      // 保存当前内容
      let tempCanvas = document.createElement('canvas');
      tempCanvas.width = measurementCanvas.width;
      tempCanvas.height = measurementCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
         tempCtx.drawImage(measurementCanvas, 0, 0);
         
         // 重新设置canvas尺寸
         measurementCanvas.width = newWidth;
         measurementCanvas.height = newHeight;
         
         // 恢复内容
         canvasContext.drawImage(tempCanvas, 0, 0);
      }
   }
   
   // 重新绘制测量线
   redrawMeasurementLine();
};

// 计算物理距离
const calculatePhysicalDistance = () => {
   if (!measurementStartPoint.value || !measurementEndPoint.value) return;
   
   // 获取图像像素/微米比例
   const calibration = imageInfo.baseInfo.calibration; // μm/Pixel
   
   // 计算两点间的欧几里得距离（在图像坐标系中）
   const dx = measurementEndPoint.value.x - measurementStartPoint.value.x;
   const dy = measurementEndPoint.value.y - measurementStartPoint.value.y;
   const distanceInViewport = Math.sqrt(dx * dx + dy * dy);
   
   // 转换为实际物理距离（微米）
   // 需要考虑当前缩放级别
   const currentZoom = viewer?.viewport.getZoom() || 1;
   const initialZoom = viewer?.viewport.getHomeZoom() || 1;
   const actualMultiplier = initialZoom > 0 ? currentZoom / initialZoom : 1;
   
   // 实际距离 = 视口距离 × 缩放系数 × 像素转微米系数
   const distanceInPixels = distanceInViewport / actualMultiplier;
   const physicalDistance = distanceInPixels * calibration; // 微米
   
   measurementDistance.value = parseFloat(physicalDistance.toFixed(2));
};

// 重新绘制测量线
const redrawMeasurementLine = () => {
   if (!canvasContext || !measurementCanvas) {
      console.log('Canvas上下文或Canvas元素未初始化', { canvasContext: !!canvasContext, measurementCanvas: !!measurementCanvas });
      return;
   }
   
   canvasContext.clearRect(0, 0, measurementCanvas.width, measurementCanvas.height);
   
   if (!measurementStartPoint.value) {
      console.log('测量起点未设置');
      return;
   }
   
   console.log('开始绘制测量线', {
      startPoint: measurementStartPoint.value,
      endPoint: measurementEndPoint.value,
      distance: measurementDistance.value,
      canvasSize: { width: measurementCanvas.width, height: measurementCanvas.height }
   });
   
   // 设置绘制样式
   canvasContext.strokeStyle = '#FF0000'; // 红色
   canvasContext.lineWidth = 2;
   canvasContext.setLineDash([]); // 实线，无虚线
   
   // 将世界坐标转换为Canvas坐标
   let startX = 0, startY = 0, endX = 0, endY = 0;
   
   // 使用OpenSeadragon的overlay坐标系统
   if (viewer && measurementCanvas) {
      // 将归一化坐标转换为Canvas像素坐标
      startX = measurementStartPoint.value.x * measurementCanvas.width;
      startY = measurementStartPoint.value.y * measurementCanvas.height;
      
      console.log('坐标转换结果', { startX, startY, canvasWidth: measurementCanvas.width, canvasHeight: measurementCanvas.height });
      
      // 终点
      if (measurementEndPoint.value) {
         endX = measurementEndPoint.value.x * measurementCanvas.width;
         endY = measurementEndPoint.value.y * measurementCanvas.height;
         
         console.log('终点坐标转换结果', { endX, endY });
      } else {
         // 如果没有终点，则终点与起点相同
         endX = startX;
         endY = startY;
         console.log('终点与起点相同');
      }
      
      // 检查坐标是否有效
      if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
         console.log('坐标无效，无法绘制', { startX, startY, endX, endY });
         return;
      }
      
      // 绘制测量线
      canvasContext.beginPath();
      canvasContext.moveTo(startX, startY);
      canvasContext.lineTo(endX, endY);
      canvasContext.stroke();
      
      console.log('已绘制测量线', { startX, startY, endX, endY });
      
      // 在终点绘制圆点
      canvasContext.beginPath();
      canvasContext.arc(endX, endY, 4, 0, 2 * Math.PI);
      canvasContext.fillStyle = '#FF0000';
      canvasContext.fill();
      
      // 显示距离文本
      if (measurementDistance.value !== null) {
         const midX = (startX + endX) / 2;
         const midY = (startY + endY) / 2;
         
         // 设置文本样式
         canvasContext.font = '14px Arial';
         canvasContext.fillStyle = '#FF0000'; // 根据规范，文本也使用红色
         canvasContext.strokeStyle = '#FFFFFF';
         canvasContext.lineWidth = 2;
         canvasContext.textAlign = 'center';
         canvasContext.textBaseline = 'middle';
         
         // 根据距离值决定单位
         let displayDistance = measurementDistance.value;
         let unit = ' μm';
         
         // 当距离大于1000um时，转换为mm
         if (displayDistance >= 1000) {
            displayDistance = displayDistance / 1000;
            unit = ' mm';
         }
         
         const distanceText = `${displayDistance.toFixed(displayDistance < 1 ? 2 : (displayDistance >= 1000 ? 3 : 1))}${unit}`;
         
         // 绘制文本边框（白色轮廓）
         canvasContext.strokeText(
            distanceText,
            midX,
            midY
         );
         
         // 绘制文本填充（红色填充）
         canvasContext.fillText(
            distanceText,
            midX,
            midY
         );
         
         console.log('已绘制距离文本', { distanceText, midX, midY });
      }
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
   
   // 清理测量相关资源
   if (measuringMode.value) {
      toggleMeasuringMode(); // 退出测量模式
   }
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
