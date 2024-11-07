export const compareImages = async (image1Url, image2Url) => {
  return new Promise((resolve) => {
    const img1 = new Image();
    const img2 = new Image();
    let loadedImages = 0;

    const onBothLoaded = () => {
      const canvas1 = document.createElement('canvas');
      const canvas2 = document.createElement('canvas');
      const diffCanvas = document.createElement('canvas');

      const width = img1.width;
      const height = img1.height;
      
      canvas1.width = width;
      canvas1.height = height;
      canvas2.width = width;
      canvas2.height = height;
      diffCanvas.width = width;
      diffCanvas.height = height;

      const ctx1 = canvas1.getContext('2d');
      const ctx2 = canvas2.getContext('2d');
      const diffCtx = diffCanvas.getContext('2d');

      ctx1.drawImage(img1, 0, 0);
      ctx2.drawImage(img2, 0, 0);

      const imageData1 = ctx1.getImageData(0, 0, width, height);
      const imageData2 = ctx2.getImageData(0, 0, width, height);
      const diffImageData = diffCtx.createImageData(width, height);

      let differences = 0;
      const discrepancyMap = new Map(); // Map to store discrepancy regions
      let currentRegionId = 1;

      // Helper function to get nearby region
      const getNearbyRegion = (x, y) => {
        const proximityThreshold = 20; // Pixels within this distance are considered related
        for (const [id, region] of discrepancyMap.entries()) {
          const xDistance = Math.min(
            Math.abs(x - region.startX),
            Math.abs(x - region.endX)
          );
          const yDistance = Math.min(
            Math.abs(y - region.startY),
            Math.abs(y - region.endY)
          );
          if (xDistance <= proximityThreshold && yDistance <= proximityThreshold) {
            return id;
          }
        }
        return null;
      };

      // Compare pixels
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          
          const r1 = imageData1.data[i];
          const g1 = imageData1.data[i + 1];
          const b1 = imageData1.data[i + 2];
          
          const r2 = imageData2.data[i];
          const g2 = imageData2.data[i + 1];
          const b2 = imageData2.data[i + 2];

          const isDifferent = Math.abs(r1 - r2) > 30 || 
                            Math.abs(g1 - g2) > 30 || 
                            Math.abs(b1 - b2) > 30;

          if (isDifferent) {
            // Highlight difference in red
            diffImageData.data[i] = 255;     // Red
            diffImageData.data[i + 1] = 0;   // Green
            diffImageData.data[i + 2] = 0;   // Blue
            diffImageData.data[i + 3] = 255; // Alpha
            differences++;

            // Check for nearby regions
            const nearbyRegionId = getNearbyRegion(x, y);
            
            if (nearbyRegionId) {
              // Expand existing region
              const region = discrepancyMap.get(nearbyRegionId);
              region.startX = Math.min(region.startX, x);
              region.startY = Math.min(region.startY, y);
              region.endX = Math.max(region.endX, x);
              region.endY = Math.max(region.endY, y);
              region.width = region.endX - region.startX + 1;
              region.height = region.endY - region.startY + 1;
              region.pixelCount++;
            } else {
              // Create new region
              discrepancyMap.set(currentRegionId, {
                id: currentRegionId,
                startX: x,
                startY: y,
                endX: x,
                endY: y,
                width: 1,
                height: 1,
                pixelCount: 1
              });
              currentRegionId++;
            }
          } else {
            // Keep original pixel from first image
            diffImageData.data[i] = r1;
            diffImageData.data[i + 1] = g1;
            diffImageData.data[i + 2] = b1;
            diffImageData.data[i + 3] = 255;
          }
        }
      }

      // Draw difference image
      diffCtx.putImageData(diffImageData, 0, 0);

      // Calculate percentage of differences
      const totalPixels = (width * height);
      const percentDifference = ((differences / totalPixels) * 100).toFixed(2);

      // Filter and consolidate significant regions
      const significantRegions = Array.from(discrepancyMap.values())
        .filter(region => region.pixelCount > 25) // Filter out noise
        .sort((a, b) => {
          // Sort by vertical position first, then horizontal
          if (Math.abs(a.startY - b.startY) > 20) {
            return a.startY - b.startY;
          }
          return a.startX - b.startX;
        })
        .map((region, index) => {
          const areaDesc = region.width * region.height > 1000 
            ? 'Large area' 
            : region.width * region.height > 100 
              ? 'Medium area'
              : 'Small area';
          
          const positionDesc = region.startY < height * 0.33 
            ? 'top'
            : region.startY < height * 0.66 
              ? 'middle'
              : 'bottom';

          return {
            ...region,
            id: index + 1,
            description: `${areaDesc} difference found in the ${positionDesc} section at (${region.startX}, ${region.startY}), spanning ${region.width}x${region.height} pixels`
          };
        });

      resolve({
        diffImageUrl: diffCanvas.toDataURL(),
        percentDifference,
        width,
        height,
        discrepancies: significantRegions
      });
    };

    const onImageLoad = () => {
      loadedImages++;
      if (loadedImages === 2) {
        onBothLoaded();
      }
    };

    img1.onload = onImageLoad;
    img2.onload = onImageLoad;

    img1.src = image1Url;
    img2.src = image2Url;
  });
};
