import {IAppOption} from "../../../typings";
import {UserInfo} from "../../api";
import {sleep} from "../../utils/util";
import {kAvatar, kDev, kNickName} from "../../utils/consts";

const app = getApp<IAppOption>();

Component({
    options: {
        pureDataPattern: /^_/,
    },
    data: {
        _active: false,
        ready: false,
        nickname: kNickName,
        avatar: kAvatar,
        uid: '',
        statistics: '',
        tabs: [
            {
                id: 'favorite',
                name: '收藏',
                className: 'tab active',
            },
            {
                id: 'post',
                name: '作品',
                className: 'tab inactive',
            },
        ],
    },
    lifetimes: {
        attached() {
            this.data._active = true;
            this.getUserInfo();
        },
        detached() {
            this.data._active = false;
        },
    },
    methods: {
        async getUserInfo() {
            while (this.data._active && !this.data.ready) {
                let info: UserInfo | undefined;
                try {
                    info = await app.api.getUserInfo({
                        openId: await app.api.authedOpenId(),
                    });
                } catch (err) {
                    if (kDev) {
                        console.error('get user info', err);
                    }
                    await sleep(1);
                    continue;
                }

                if (info == null) {
                    this.setData({
                        ready: true,
                    });
                } else {
                    this.setData({
                        ready: true,
                        avatar: info.avatar ?? this.data.avatar,
                        nickname: info.nickname ?? this.data.nickname,
                        uid: `(@${info.id})`,
                        statistics: `视频:${info.videoCount} 播放:${info.videoViewCount} 粉丝:${info.fanCount} 关注:${info.followCount}`,
                    });
                }
            }
        },
        changeTab(event: WechatMiniprogram.BaseEvent) {
            const tab = event.currentTarget.dataset.tab;

            const newTabs = [];
            for (const tabConfig of this.data.tabs) {
                newTabs.push({
                    ...tabConfig,
                    className: `tab ${tab == tabConfig.id ? 'active' : 'inactive'}`,
                });
            }
            this.setData({
                tabs: newTabs,
            });
        }
    }
})