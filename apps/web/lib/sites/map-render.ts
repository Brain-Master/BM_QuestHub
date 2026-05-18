import type { MapPercentPoint } from "@/lib/sites/map-projection";

export type MapFrameSize = {
  width: number;
  height: number;
};

export type MapRenderRect = MapFrameSize & {
  x: number;
  y: number;
};

export type MapTransformState = {
  scale: number;
  positionX: number;
  positionY: number;
};

const SQUARE_MAP_ASPECT_RATIO = 1;

export function getContainedMapRect(
  frameSize: MapFrameSize,
  aspectRatio = SQUARE_MAP_ASPECT_RATIO,
): MapRenderRect {
  const { width, height } = frameSize;
  if (width <= 0 || height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const frameAspectRatio = width / height;
  if (frameAspectRatio > aspectRatio) {
    const containedWidth = height * aspectRatio;
    return {
      x: (width - containedWidth) / 2,
      y: 0,
      width: containedWidth,
      height,
    };
  }

  const containedHeight = width / aspectRatio;
  return {
    x: 0,
    y: (height - containedHeight) / 2,
    width,
    height: containedHeight,
  };
}

export function mapPercentPointToScreenPoint(
  point: MapPercentPoint,
  mapRect: MapRenderRect,
  transform: MapTransformState,
): MapPercentPoint {
  return {
    x: transform.positionX + (mapRect.x + (point.x / 100) * mapRect.width) * transform.scale,
    y: transform.positionY + (mapRect.y + (point.y / 100) * mapRect.height) * transform.scale,
  };
}
