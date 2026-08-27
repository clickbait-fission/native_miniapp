import {IAppOption} from "../../../typings";
import {skCheckBehavior} from "../../behaviors/sk_behavior";
import {shareBehavior} from "../../behaviors/share_behavior";
import {Media, ShareTarget, UserInfo} from "../../api";
import {kAvatar, kDev, kHome, kNickName, kShareImage, kShareTitle} from "../../utils/consts";
import {computeVars, safeBack, sleep} from "../../utils/util";

const app = getApp<IAppOption>();
const page = '/user';

Component({
    options: {
        pureDataPattern: /^_/,
    },
    behaviors: [
        skCheckBehavior,
        shareBehavior,
    ],
    properties: {
        uid: Number,
    },
    data: {
        _active: false,
        _shareCheck: false,
        _followTrack: (() => {
        }) as (() => void),
        vars: '',
        ready: false,
        showAction: false,
        isFan: false,
        nickname: '',
        avatar: '',
        statistics: '',
        hot: [] as Media[],
    },
    lifetimes: {
        attached() {
            this.data._active = true;
            this.setData({
                vars: computeVars(),
            });
            this.prepareData();

            this.data._followTrack();
            this.data._followTrack = app.follow.observe(() => {
                const track = app.follow.optCheck(this.properties.uid);
                if (track != null && track != this.data.isFan) {
                    this.setData({
                        isFan: track,
                    });
                }
            });
        },
        detached() {
            this.data._active = false;
            this.data._followTrack();
        },
    },
    pageLifetimes: {
        show() {
            this.shareCheck();
            app.api.onPageChange({
                path: page,
            });
        },
        resize() {
            this.setData({
                vars: computeVars(),
            });
        },
    },
    methods: {
        shareCheck() {
            if (this.data._shareCheck) {
                return;
            }

            this.data._shareCheck = true;
            const share = this.parseShare();
            this.skCheckOnce(page, share?.user === this.properties.uid);
        },
        async prepareData() {
            while (this.data._active && !this.data.ready) {
                let userInfo: UserInfo | undefined;
                try {
                    userInfo = await app.api.getUserInfo({
                        uid: this.properties.uid,
                    });
                } catch (err) {
                    if (kDev) {
                        console.error('get user info', err);
                    }
                    await sleep(1);
                    continue;
                }

                if (kDev) {
                    console.log(`user info of ${this.properties.uid}`, userInfo);
                }

                const uid = await app.api.authedUid();
                const showAction = this.properties.uid != uid;
                let isFan = false;
                if (showAction) {
                    const track = app.follow.optCheck(this.properties.uid);
                    if (track == null) {
                        try {
                            isFan = await app.api.checkIsFan({
                                upUid: this.properties.uid,
                            });
                        } catch (err) {
                            if (kDev) {
                                console.error('check is fan', err);
                            }
                            await sleep(1);
                            continue;
                        }
                    } else {
                        isFan = track;
                    }
                }

                let hot: Media[];
                try {
                    hot = await app.api.getHot({
                        upId: this.properties.uid,
                    });
                } catch (err) {
                    if (kDev) {
                        console.error('get hot video', err);
                    }
                    await sleep(1);
                    continue;
                }

                this.setData({
                    ready: true,
                    showAction,
                    isFan,
                    nickname: userInfo?.nickname ?? kNickName,
                    avatar: userInfo?.avatar ?? kAvatar,
                    statistics: userInfo == null ? '' : `视频:${userInfo.videoCount} 播放:${userInfo.videoViewCount} 粉丝:${userInfo.fanCount} 关注:${userInfo.followCount}`,
                    hot,
                });
            }
        },
        onShareAppMessage(event: { from: string }) {
            return this.doShare('message', event.from);
        },
        onAddToFavorites() {
            return this.doShare('favorite');
        },
        doShare(target: ShareTarget, from?: string) {
            return app.api.createShare({
                item: {
                    type: 'user',
                    id: this.properties.uid,
                    nickname: this.data.ready ? this.data.nickname : kShareTitle,
                    avatar: this.data.ready ? this.data.avatar : kShareImage,
                },
                path: kHome,
                target,
                from,
            });
        },
        onTapBack() {
            safeBack();
        },
        onTapFollow() {
            const op = this.data.isFan ? 'remove' : 'add';
            const revOp = this.data.isFan ? 'add' : 'remove';
            const opName = this.data.isFan ? '取关' : '关注';

            async function doFanOp(upId: number, op: 'add' | 'remove') {
                await app.api.followOp({
                    upId,
                    op,
                })
            }

            app.follow.change(this.properties.uid, op);
            doFanOp(this.properties.uid, op).then(() => {
                wx.showToast({
                    icon: 'success',
                    title: `已${opName}`,
                });
            }).catch((error) => {
                if (kDev) {
                    console.error('fan op', error);
                }
                app.follow.change(this.properties.uid, revOp);
                wx.showToast({
                    icon: 'success',
                    title: `暂时无法${opName},请重试`,
                });
            });
        },
        onTapVideo(event: WechatMiniprogram.BaseEvent) {
            const index = event.currentTarget.dataset.index as number;
            app.api.navigateTo({
                path: '/pages/feed/index',
                params: {
                    inputMedias: JSON.stringify(this.data.hot),
                    inputIndex: index,
                },
            });
        },
    }
})