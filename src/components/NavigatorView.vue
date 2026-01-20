<template>
  <div id="thumbnail"
    class="fixed w-[180px] h-[166px] z-[100] top-[80px] left-[10px] border border-[#25b0e5] bg-black cursor-pointer overflow-hidden">
    <canvas id="cavView" class="absolute top-0 left-0"></canvas>
    <div ref="hLineRef" class="absolute h-[1px] bg-red-600 w-full pointer-events-none" style="top: 50%;"></div>
    <div ref="vLineRef" class="absolute w-[1px] bg-red-600 h-full pointer-events-none" style="left: 50%;"></div>
    <div ref="viewRectRef" class="absolute border-1 border-red-600 pointer-events-none bg-white z-[10] opacity-50">
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import OpenSeadragon from 'openseadragon';

interface Props {
  viewer?: any;
  imageList: Array<{ slideName: string; adoptedPart: string; url: string }>;
  currentIndex: number;
}

const props = defineProps<Props>();

let navCanvas: HTMLCanvasElement | null = null;
let navCtx: CanvasRenderingContext2D | null = null;
let isDragging = false;
let dragOffsetX = 0; // 记录鼠标点击位置与红框中心的偏移 X
let dragOffsetY = 0; // 记录鼠标点击位置与红框中心的偏移 Y

const viewRectRef = ref<HTMLDivElement | null>(null);
const hLineRef = ref<HTMLDivElement | null>(null);
const vLineRef = ref<HTMLDivElement | null>(null);

const updateNavigatorView = () => {
  if (!props.viewer || !navCanvas) return;

  // 获取视口相对于图像的坐标和尺寸 (0到1之间)
  const bounds = props.viewer.viewport.getBounds();

  // 获取图片实际尺寸
  const tiledImage = props.viewer.world.getItemAt(0);
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

  // 参考网站逻辑：十字线反映视口的中心点 (Viewport Center)
  // 直接获取当前视口中心点在图像上的归一化坐标 (0~1)
  const viewportCenter = props.viewer.viewport.getCenter();
  const centerX = viewportCenter.x * navImageWidth + navOffsetX;
  const centerY = viewportCenter.y * navImageWidth + navOffsetY;

  // 更新视口矩形
  if (viewRectRef.value) {
    viewRectRef.value.style.left = `${viewRectX}px`;
    viewRectRef.value.style.top = `${viewRectY}px`;
    viewRectRef.value.style.width = `${viewRectW}px`;
    viewRectRef.value.style.height = `${viewRectH}px`;

    // 如果视口完全在可视区域外，隐藏矩形
    const isVisible = (
      viewRectX + viewRectW > 0 &&
      viewRectX < 180 &&
      viewRectY + viewRectH > 0 &&
      viewRectY < 166
    );
    viewRectRef.value.style.display = isVisible ? 'block' : 'none';
  }

  // 更新十字线位置
  if (hLineRef.value) {
    hLineRef.value.style.top = `${centerY}px`;
    hLineRef.value.style.display = 'block';
  }
  if (vLineRef.value) {
    vLineRef.value.style.left = `${centerX}px`;
    vLineRef.value.style.display = 'block';
  }
};

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
    img.src = props.imageList[props.currentIndex].url;
  }

  // 添加拖动/点击事件，操作导航视图更改主视图位置
  const thumbnail = document.getElementById('thumbnail');

  if (thumbnail && viewRectRef.value) {
    const performMove = (e: MouseEvent, useOffset = true) => {
      if (!props.viewer) return;
      const rect = thumbnail.getBoundingClientRect();
      let clickX = e.clientX - rect.left;
      let clickY = e.clientY - rect.top;

      // 如果是拖拽状态，需要减去初始偏移量，保持红框与鼠标相对位置不变
      if (useOffset && isDragging) {
        clickX -= dragOffsetX;
        clickY -= dragOffsetY;
      }

      // 使用与 updateNavigatorView 中一致的计算方法
      const tiledImage = props.viewer.world.getItemAt(0);
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

      props.viewer.viewport.panTo(new OpenSeadragon.Point(normalizedX, normalizedY), true);
    };

    thumbnail.onmousedown = (e: MouseEvent) => {
      const rect = thumbnail.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 获取当前 viewRect 的实时位置和尺寸
      if (viewRectRef.value) {
        const vrLeft = parseFloat(viewRectRef.value.style.left || '0');
        const vrTop = parseFloat(viewRectRef.value.style.top || '0');
        const vrWidth = parseFloat(viewRectRef.value.style.width || '0');
        const vrHeight = parseFloat(viewRectRef.value.style.height || '0');

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
      }
    };

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!isDragging || !props.viewer) return;

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

onMounted(() => {
  initNavigator();
  // 初始更新导航视图
  setTimeout(updateNavigatorView, 100);
});

// 监听viewer的变化并添加事件处理器
watch(() => props.viewer, (newViewer, oldViewer) => {
  // 移除旧的事件监听器
  if (oldViewer) {
    oldViewer.removeHandler('zoom', updateNavigatorView);
    oldViewer.removeHandler('pan', updateNavigatorView);
    oldViewer.removeHandler('open', updateNavigatorView);
  }
  
  // 添加新的事件监听器
  if (newViewer) {
    newViewer.addHandler('zoom', updateNavigatorView);
    newViewer.addHandler('pan', updateNavigatorView);
    newViewer.addHandler('open', updateNavigatorView); // 当新图像打开时更新
  }
}, { immediate: true });

onUnmounted(() => {
  // 清理viewer事件监听器
  if (props.viewer) {
    props.viewer.removeHandler('zoom', updateNavigatorView);
    props.viewer.removeHandler('pan', updateNavigatorView);
    props.viewer.removeHandler('open', updateNavigatorView);
  }
  
  // 清理窗口事件监听器
  window.removeEventListener('mousemove', () => {});
  window.removeEventListener('mouseup', () => {});
});
</script>

<style scoped>
/* 可以在这里添加特定的样式 */
</style>