// App Store Connect API レスポンス型

export interface AppleApp {
  type: "apps"
  id: string
  attributes: {
    name: string
    bundleId: string
    sku: string
    primaryLocale: string
  }
}

export interface AppleAppsResponse {
  data: AppleApp[]
}

export interface AppInfoLocalization {
  type: "appInfoLocalizations"
  id: string
  attributes: {
    locale: string
    name: string | null
    subtitle: string | null
    privacyPolicyUrl: string | null
  }
}

export interface AppInfoLocalizationsResponse {
  data: AppInfoLocalization[]
}

export interface AppStoreVersionLocalization {
  type: "appStoreVersionLocalizations"
  id: string
  attributes: {
    locale: string
    description: string | null
    keywords: string | null
    promotionalText: string | null
    supportUrl: string | null
    marketingUrl: string | null
    whatsNew: string | null
  }
}

export interface AppStoreVersionLocalizationsResponse {
  data: AppStoreVersionLocalization[]
}

export interface AppInfo {
  type: "appInfos"
  id: string
}

export interface AppInfosResponse {
  data: AppInfo[]
}

export interface AppStoreVersion {
  type: "appStoreVersions"
  id: string
  attributes: {
    versionString: string
    appStoreState: string
    platform: string
  }
}

export interface AppStoreVersionsResponse {
  data: AppStoreVersion[]
}
