import {Api} from "./api";
import {IAppOption} from "../typings";

// app.ts
App<IAppOption>({
    api: Api.createWx(1, ""),
    onLaunch(opts) {
        Api.configureCustomUtf8();
        this.api.onLaunch({sceneId: opts.scene});
        // 展示本地存储能力
        const logs = wx.getStorageSync('logs') || []
        logs.unshift(Date.now())
        wx.setStorageSync('logs', logs)

        // 登录
        wx.login({
            success: res => {
                console.log(res.code)
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
            },
        })
    },
    onShow(opts) {
        this.api.onShow({sceneId: opts.scene});
    },
    onHide() {
        this.api.onHide();
    },
})