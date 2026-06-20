/**
 * Utility for compressing images on the client side before upload.
 * Uses HTML5 Canvas to resize and compress images to JPEG format.
 */

/**
 * Compresses an image File or Blob.
 * 
 * @param {File|Blob} file The image file to compress
 * @param {Object} options Compression options
 * @param {number} options.quality JPEG quality (0.0 to 1.0)
 * @param {number} options.maxWidth Maximum width of the compressed image
 * @param {number} options.maxHeight Maximum height of the compressed image
 * @returns {Promise<File|Blob>} The compressed file, or the original if compression fails or results in a larger size.
 */
export const compressImage = (file, options = {}) => {
  const { quality = 0.7, maxWidth = 1200, maxHeight = 1200 } = options;

  return new Promise((resolve) => {
    // Only compress image files
    if (file && file.type && !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions to maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export canvas to JPEG blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Create a new File from the blob if the original was a File
            const resultFile = file instanceof File 
              ? new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
              : blob;

            // If compressed file is actually larger (can happen with tiny pngs), keep original
            resolve(resultFile.size < file.size ? resultFile : file);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        resolve(file);
      };
    };
    reader.onerror = () => {
      resolve(file);
    };
  });
};
