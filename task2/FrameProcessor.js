/*
 * FrameProcessor
 * Carries one panorama frame (A or B) through the g -> e -> t -> n pipeline.
 */
class FrameProcessor {
  constructor(img) {
    this.img = img;
    this.width = img.width;
    this.height = img.height;
    this.rgbaPixels = PixelUtils.copyPixels(img);
  }

  toGrayscale() {
    this.grayBuffer = PixelUtils.toSingleChannel(
      this.rgbaPixels, this.width, this.height, ColorSpace.rgbToGray
    );
  }

  toEdges() {
    this.edgeBuffer = Convolution.sobelEdgeMagnitude(this.grayBuffer, this.width, this.height);
  }

  toThresholded(thresholdValue) {
    const buffer = new Uint8ClampedArray(this.width * this.height);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Threshold.isStrongEdge(this.edgeBuffer[i], thresholdValue) ? 255 : 0;
    }
    this.binaryBuffer = buffer;
  }

  computeCentroid() {
    this.centroid = MotionAnalysis.computeCentroid(this.binaryBuffer, this.width, this.height);
    return this.centroid;
  }

  // stage: 'gray' | 'edges' | 'thresholded'
  toDisplayImage(stage) {
    const buffer = stage === 'gray' ? this.grayBuffer
      : stage === 'edges' ? this.edgeBuffer
      : this.binaryBuffer;
    const rgba = PixelUtils.singleChannelToRGBA(buffer, this.width, this.height);
    return PixelUtils.bufferToImage(rgba, this.width, this.height);
  }
}
