export interface CompressionResult {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/**
 * Compresses an image file using HTML Canvas:
 * - Max dimension: 1600px
 * - Format: JPEG (quality 0.7)
 * - Supported formats: jpg, jpeg, png, webp
 * - Max output size: 2MB check
 */
export async function compressImage(file: File, rotationDeg: number = 0): Promise<CompressionResult> {
  // Validate MIME type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('지원되지 않는 이미지 형식입니다. (JPG, PNG, WebP 형식만 지원)');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지 파일을 읽는 중 오류가 발생했습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 데이터를 파싱할 수 없습니다.'));
      img.onload = () => {
        try {
          const maxDim = 1600;
          let { width, height } = img;

          // Scale down if larger than maxDim
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('브라우저 Canvas를 초기화할 수 없습니다.'));
          }

          // Handle rotation
          const isRotatedQuarter = rotationDeg === 90 || rotationDeg === 270;
          canvas.width = isRotatedQuarter ? height : width;
          canvas.height = isRotatedQuarter ? width : height;

          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotationDeg * Math.PI) / 180);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          ctx.restore();

          const quality = 0.7;
          const dataUrl = canvas.toDataURL('image/jpeg', quality);

          // Calculate approximate byte size of base64
          const head = 'data:image/jpeg;base64,';
          const sizeBytes = Math.round(((dataUrl.length - head.length) * 3) / 4);

          // 2MB check
          const MAX_SIZE = 2 * 1024 * 1024;
          if (sizeBytes > MAX_SIZE) {
            return reject(
              new Error(
                `이미지 압축 후 용량(${Math.round(sizeBytes / 1024)}KB)이 2MB를 초과하여 등록할 수 없습니다. 더 작은 사진을 사용해주세요.`
              )
            );
          }

          resolve({
            dataUrl,
            sizeBytes,
            width: canvas.width,
            height: canvas.height
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('이미지 처리 중 오류가 발생했습니다.'));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Re-rotates an existing dataUrl
 */
export async function rotateDataUrl(dataUrl: string, rotationDegDelta: number = 90): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('이미지를 회전하는 중 오류가 발생했습니다.'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 에러'));

      canvas.width = img.height;
      canvas.height = img.width;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotationDegDelta * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = dataUrl;
  });
}
