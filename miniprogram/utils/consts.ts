// 文件包含环境切换,除非**有必要**,否则不要提交本文件

export { kDev } from "../api";

// export const kAppId = 3;
// export const kApiBase = "http://192.168.199.205:6001/api";

export const kAppId = 2;
export const kApiBase = "https://api.shannonlimit.cn/api";

export const kHome = '/pages/index/index'
export const kNickName = "神秘用户";
export const kAvatar = "https://media.shannonlimit.cn/miniapp/avatar.jpg";
export const kShareTitle = "丰收青年点";
export const kShareImage = "https://media.shannonlimit.cn/miniapp/app-share.jpg";

export const kSdk = wx.getAppBaseInfo().SDKVersion;

export function fitSdkVersion(minSdkVersion: string) {
    const sdkParts = kSdk.split(".");
    const minSdkParts = minSdkVersion.split(".");

    const len = Math.max(sdkParts.length, minSdkParts.length)

    while (sdkParts.length < len) {
        sdkParts.push('0')
    }
    while (minSdkParts.length < len) {
        minSdkParts.push('0')
    }

    for (let i = 0; i < len; i++) {
        const v = parseInt(sdkParts[i])
        const minV = parseInt(minSdkParts[i])

        if (v < minV) {
            return false;
        }
    }

    return true;
}
