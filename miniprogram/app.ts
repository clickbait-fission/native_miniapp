import {Api} from "./api";
import {IAppOption} from "../typings";
import {kApiBase, kAppId, kDev} from "./utils/consts";
import {BasicTrack} from "./utils/favorite_track";

// app.ts
App<IAppOption>({
    // dev
    api: Api.createWx(kAppId, kApiBase),
    // prod
    // api: Api.createWx(2, "http://127.0.0.1:6001/api"),
    favorite: new BasicTrack(),
    follow: new BasicTrack(),
    onLaunch(opts) {
        if (kDev) {
            console.log('app.onLaunch');
        }
        this.api.onLaunch({sceneId: opts.scene});
    },
    onShow(opts) {
        if (kDev) {
            console.log('app.onShow');
        }
        this.api.onShow({sceneId: opts.scene});
    },
    onHide() {
        if (kDev) {
            console.log('app.onHide');
        }
        this.api.onHide();
    },
})