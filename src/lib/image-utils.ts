import { detectDeviceType } from "@/types/screenshot-types"
import type { DeviceType } from "@/types/screenshot-types"

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("画像の読み込みに失敗しました"))
    }
    img.src = URL.createObjectURL(file)
  })
}

export function validateScreenshotDimensions(
  width: number,
  height: number
): { valid: boolean; deviceType?: DeviceType; error?: string } {
  const device = detectDeviceType(width, height)
  if (device) {
    return { valid: true, deviceType: device }
  }
  return {
    valid: false,
    error: `${width}×${height} は App Store の標準サイズに一致しません`,
  }
}
