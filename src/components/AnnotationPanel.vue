<template>
  <div v-show="isAnnotating && annotations.length > 0" 
       class="absolute top-20 right-4 w-64 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-xl z-20 max-h-[calc(100%-6rem)] overflow-y-auto">
    <div class="p-3 border-b border-gray-200">
      <h3 class="font-bold text-gray-800 flex justify-between items-center">
        <span>标注列表</span>
        <button @click="clearAnnotations" 
                class="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded transition-colors"
                title="清除所有标注">
          清除
        </button>
      </h3>
    </div>
    <ul class="divide-y divide-gray-200">
      <li v-for="(annotation, index) in annotations" 
          :key="annotation.id"
          @click="selectAnnotation(annotation)"
          class="p-2 cursor-pointer hover:bg-blue-50 transition-colors"
          :class="{ 'bg-blue-100': selectedAnnotation?.id === annotation.id }">
        <div class="flex items-center">
          <div class="w-4 h-4 rounded-full mr-2" 
               :style="{ backgroundColor: annotation.color || currentAnnotationColor }">
          </div>
          <span class="text-sm text-gray-700">{{ index + 1 }}. {{ formatAnnotationType(annotation.type) }}</span>
        </div>
      </li>
    </ul>
  </div>
  
  <!-- 标注工具栏 -->
  <div v-show="isAnnotating" class="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-10">
    <div class="flex gap-1 bg-white bg-opacity-80 p-1 rounded-lg shadow-lg">
      <button @click="setAnnotationTool('rect')"
              class="px-3 py-1 text-xs font-medium rounded text-gray-800 hover:bg-indigo-600 hover:text-white transition-all duration-200 cursor-pointer"
              :class="{ 'bg-indigo-600 text-white': currentAnnotationTool === 'rect' }"
              title="矩形工具">
        矩形
      </button>
      <button @click="setAnnotationTool('circle')"
              class="px-3 py-1 text-xs font-medium rounded text-gray-800 hover:bg-indigo-600 hover:text-white transition-all duration-200 cursor-pointer"
              :class="{ 'bg-indigo-600 text-white': currentAnnotationTool === 'circle' }"
              title="圆形工具">
        圆形
      </button>
      <button @click="setAnnotationTool('ellipse')"
              class="px-3 py-1 text-xs font-medium rounded text-gray-800 hover:bg-indigo-600 hover:text-white transition-all duration-200 cursor-pointer"
              :class="{ 'bg-indigo-600 text-white': currentAnnotationTool === 'ellipse' }"
              title="椭圆工具">
        椭圆
      </button>
      <button @click="setAnnotationTool('line')"
              class="px-3 py-1 text-xs font-medium rounded text-gray-800 hover:bg-indigo-600 hover:text-white transition-all duration-200 cursor-pointer"
              :class="{ 'bg-indigo-600 text-white': currentAnnotationTool === 'line' }"
              title="线段工具">
        线段
      </button>
    </div>
    
    <!-- 颜色选择器 -->
    <div class="flex gap-1 bg-white bg-opacity-80 p-1 rounded-lg shadow-lg">
      <button @click="setAnnotationColor('#FF0000')"
              class="w-6 h-6 rounded-full border-2 border-white hover:scale-110 transition-transform cursor-pointer"
              :class="{ 'border-yellow-400 scale-110': currentAnnotationColor === '#FF0000' }"
              style="background-color: #FF0000;"
              title="红色">
      </button>
      <button @click="setAnnotationColor('#0000FF')"
              class="w-6 h-6 rounded-full border-2 border-white hover:scale-110 transition-transform cursor-pointer"
              :class="{ 'border-yellow-400 scale-110': currentAnnotationColor === '#0000FF' }"
              style="background-color: #0000FF;"
              title="蓝色">
      </button>
      <button @click="setAnnotationColor('#FFFF00')"
              class="w-6 h-6 rounded-full border-2 border-white hover:scale-110 transition-transform cursor-pointer"
              :class="{ 'border-yellow-400 scale-110': currentAnnotationColor === '#FFFF00' }"
              style="background-color: #FFFF00;"
              title="黄色">
      </button>
      <button @click="setAnnotationColor('#00FF00')"
              class="w-6 h-6 rounded-full border-2 border-white hover:scale-110 transition-transform cursor-pointer"
              :class="{ 'border-yellow-400 scale-110': currentAnnotationColor === '#00FF00' }"
              style="background-color: #00FF00;"
              title="绿色">
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { createDoodle } from "@wtsml/doodle";

// 定义 props
interface Props {
  viewer: any;
  isAnnotating: boolean;
  originalPanHorizontal?: boolean;
  originalPanVertical?: boolean;
}

const props = defineProps<Props>();

// 定义 emits
const emit = defineEmits<{
  'update:isAnnotating': [value: boolean];
}>();

// 响应式变量
const currentAnnotationTool = ref('rect'); // 当前标注工具: line, circle, rect, ellipse
const currentAnnotationColor = ref('#FF0000'); // 当前标注颜色: 红色
const annotations = ref<any[]>([]); // 存储所有标注
const selectedAnnotation = ref<any>(null); // 当前选中的标注

// doodle 实例
let annotationDoodle: any = null;

// 工具方法
const formatAnnotationType = (type: string) => {
  const typeMap: Record<string, string> = {
    'rect': '矩形',
    'circle': '圆形',
    'ellipse': '椭圆',
    'line': '线段'
  };
  return typeMap[type] || type;
};

// 设置标注工具
const setAnnotationTool = (tool: string) => {
  currentAnnotationTool.value = tool;
  
  // 如果正在标注模式下，更新当前绘图模式
  if (props.isAnnotating && annotationDoodle && annotationDoodle.setMode) {
    annotationDoodle.setMode(tool);
    console.log(`切换到${tool}工具`);
  }
};

// 设置标注颜色
const setAnnotationColor = (color: string) => {
  currentAnnotationColor.value = color;
  
  // 如果正在标注模式下，可能需要更新当前绘图颜色（如果doodle支持）
  console.log(`切换到颜色${color}`);
};

// 选中标注
const selectAnnotation = (annotation: any) => {
  selectedAnnotation.value = annotation;
  
  // 如果doodle支持选中特定形状，这里可以调用相应方法
  if (annotationDoodle && annotationDoodle.select) {
    annotationDoodle.select(annotation);
  }
  
  console.log('选中了标注', annotation);
};

// 清除所有标注
const clearAnnotations = () => {
  if (annotationDoodle) {
    // 清除所有标注
    annotations.value.forEach(annotation => {
      annotationDoodle.removeShape(annotation);
    });
    annotations.value = [];
  }
  selectedAnnotation.value = null;
  console.log('已清除所有标注');
};

// 初始化标注功能
const initAnnotation = () => {
  if (!props.viewer) return;

  // 如果已有实例则不重新创建，而是恢复功能
  if (!annotationDoodle) {
    annotationDoodle = createDoodle({
      viewer: props.viewer, // openseadragon viewer
      // 监听添加 shape 事件
      onAdd: (shape: any) => {
        shape.color = currentAnnotationColor.value; // 设置颜色
        annotations.value.push(shape);
        annotationDoodle.addShape(shape);
      },
      // 监听删除 shape 事件
      onRemove: (shape: any) => {
        const index = annotations.value.findIndex(s => s.id === shape.id);
        if (index !== -1) {
          annotations.value.splice(index, 1);
        }
        annotationDoodle.removeShape(shape);
      },
      // 监听更新 shape 事件
      onUpdate: (shape: any) => {
        const index = annotations.value.findIndex(s => s.id === shape.id);
        if (index !== -1) {
          annotations.value[index] = shape;
        }
        annotationDoodle.updateShape(shape);
      },
      // 监听选中 shape 事件
      onSelect: (shape: any) => {
        selectedAnnotation.value = shape;
        console.log("选中了标注", shape);
      },
      // 监听取消选中 shape 事件
      onCancelSelect: (shape: any) => {
        if (selectedAnnotation.value && selectedAnnotation.value.id === shape.id) {
          selectedAnnotation.value = null;
        }
        console.log("取消选中了标注", shape);
      },
    });

    // 恢复之前的所有标注
    annotations.value.forEach(annotation => {
      annotationDoodle.addShape(annotation);
    });
  }

  // 设置当前工具模式
  if (annotationDoodle && annotationDoodle.setMode) {
    annotationDoodle.setMode(currentAnnotationTool.value);
    // 设置openseadragon-canvas下最后一个canvas的id
    setTimeout(() => {
      const osdCanvasWrap = document.querySelector('#openseadragon1 .openseadragon-canvas');
      if (osdCanvasWrap) {
        const canvases = osdCanvasWrap.getElementsByTagName('canvas');
        if (canvases.length > 0) {
          canvases[canvases.length - 1].id = 'doodle-annotation-canvas';
        }
      }
    }, 100);
  }
  
};

// 隐藏标注界面但保留画布上的标注
const destroyAnnotation = () => {
  // 不销毁doodle实例，只清除选择状态，这样保留画布上的标注
  selectedAnnotation.value = null;
    // 设置为move模式并禁用绘图工具
    if (annotationDoodle) {
      annotationDoodle.setMode('move');
    }
};

// 监听 isAnnotating 变化
watch(() => props.isAnnotating, (newValue) => {
  if (newValue) {
    initAnnotation();
  } else {
    destroyAnnotation();
  }
}, { immediate: true });

// 组件挂载时
onMounted(() => {
  // 总是初始化，即使当前不在标注模式
  initAnnotation();
});

// 组件卸载时
onUnmounted(() => {
  if (annotationDoodle) {
    annotationDoodle.destroy();
    annotationDoodle = null;
  }
});

// 为了在父组件中访问这些方法，我们使用 defineExpose
defineExpose({
  setAnnotationTool,
  setAnnotationColor,
  selectAnnotation,
  clearAnnotations,
  currentAnnotationTool,
  currentAnnotationColor,
  annotations,
  selectedAnnotation
});
</script>

<style scoped>
/* 组件样式 */
</style>