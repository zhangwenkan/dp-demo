/**
 * SVG Overlay plugin for OpenSeadragon
 * Simplified version for measurement functionality
 */

import OpenSeadragon from 'openseadragon';

interface ViewerWithSvgOverlay extends OpenSeadragon.Viewer {
  _svgOverlay?: {
    g: SVGGElement;
    resize: () => void;
  };
}

export function addSvgOverlay(viewer: OpenSeadragon.Viewer) {
  if (!viewer._svgOverlay) {
    // 创建SVG覆盖层
    const svgNS = 'http://www.w3.org/2000/svg';
    const container = viewer.container;

    // 创建SVG元素
    const svg = document.createElementNS(svgNS, 'svg');
    svg.style.position = 'absolute';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none'; // 让SVG不影响鼠标事件
    svg.setAttribute('preserveAspectRatio', 'none');

    // 创建组元素用于变换
    const g = document.createElementNS(svgNS, 'g');
    svg.appendChild(g);
    container.appendChild(svg);

    // 更新SVG尺寸
    function updateSize() {
      const viewerSize = viewer.viewport.getContainerSize();
      svg.setAttribute('width', viewerSize.x.toString());
      svg.setAttribute('height', viewerSize.y.toString());
    }

    // 由于我们直接在屏幕坐标上绘制测量线，不需要复杂的变换
    // 只需要确保SVG尺寸正确即可
    function updateTransform() {
      // 对于测量功能，我们直接在屏幕坐标上绘制，所以不需要变换
      // 保持单位矩阵，即无变换
      const transformStr = 'matrix(1,0,0,1,0,0)';
      g.setAttribute('transform', transformStr);
    }

    // 在viewport-change事件时更新
    let updateScheduled = false;
    function scheduleUpdate() {
      if (!updateScheduled) {
        updateScheduled = true;
        requestAnimationFrame(() => {
          // 不需要更新变换，只需要确保尺寸正确
          updateSize();
          updateScheduled = false;
        });
      }
    }

    viewer.addHandler('open', () => {
      updateSize();
      updateTransform();
    });

    viewer.addHandler('resize', () => {
      updateSize();
    });

    // 添加清理方法
    (viewer as ViewerWithSvgOverlay)._svgOverlay = {
      g,
      resize: updateSize
    };
  }

  return (viewer as ViewerWithSvgOverlay)._svgOverlay!.g;
}