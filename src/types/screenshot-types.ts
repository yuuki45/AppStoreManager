export interface DeviceType {
  code: string
  label: string
  width: number
  height: number
}

export const DEVICE_TYPES: DeviceType[] = [
  { code: "IPHONE_67", label: 'iPhone 6.7"', width: 1290, height: 2796 },
  { code: "IPHONE_65", label: 'iPhone 6.5"', width: 1242, height: 2688 },
  { code: "IPHONE_55", label: 'iPhone 5.5"', width: 1242, height: 2208 },
  { code: "IPAD_PRO_129", label: 'iPad Pro 12.9"', width: 2048, height: 2732 },
  { code: "IPAD_PRO_11", label: 'iPad Pro 11"', width: 1668, height: 2388 },
]

export function detectDeviceType(width: number, height: number): DeviceType | null {
  // 縦横どちらでもマッチ
  return DEVICE_TYPES.find(
    (d) =>
      (d.width === width && d.height === height) ||
      (d.width === height && d.height === width)
  ) ?? null
}

export function getDeviceTypeByCode(code: string): DeviceType | undefined {
  return DEVICE_TYPES.find((d) => d.code === code)
}
