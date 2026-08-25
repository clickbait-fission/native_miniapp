import {IAppOption} from "../../../typings";
import {computeVars} from "../../utils/util";
import {ShareTarget} from "../../api";
import {kDev, kShareImage, kShareTitle} from "../../utils/consts";

const app = getApp<IAppOption>();

type Tab = 'home' | 'article' | 'settings';
type TabConfig = {
    tab: Tab;
    name: string;
    activeIcon: string;
    inactiveIcon: string;
    className: string;
    create: boolean;
};

function initTab(): Tab {
    return 'home';
}

function initTabConfig(): TabConfig[] {
    return [
        {
            tab: 'home',
            name: '首页',
            activeIcon: '/assets/home-active.svg',
            inactiveIcon: '/assets/home.svg',
            className: 'content active',
            create: true,
        },
        {
            tab: 'article',
            name: '美文',
            activeIcon: '/assets/article-active.svg',
            inactiveIcon: '/assets/article.svg',
            className: 'content inactive',
            create: false,
        },
        {
            tab: 'settings',
            name: '设置',
            activeIcon: '/assets/settings-active.svg',
            inactiveIcon: '/assets/settings.svg',
            className: 'content inactive',
            create: false,
        },
    ];
}

Component({
    options: {
        pureDataPattern: /^_/,
    },
    properties: {
        share: {
            type: String,
            optionalTypes: [null],
            value: null,
        }
    },
    data: {
        _shareChecked: false,
        _pageViewReported: false,
        currentTab: initTab(),
        tabs: initTabConfig(),
        vars: '',
    },
    pageLifetimes: {
        show() {
            this.setData({
                vars: computeVars(),
            });
            this.checkShareOnce();
            this.reportPageViewOnce();
            this.reportTabView();
        },
        resize() {
            this.setData({
                vars: computeVars(),
            });
        },
    },
    methods: {
        async checkShareOnce() {
            if (this.data._shareChecked) {
                return;
            }
            this.data._shareChecked = true;
            if (this.properties.share == null || this.properties.share == "") {
                return;
            }
            const share = app.api.parseShareParam(this.properties.share);
            if (share == null) {
                return;
            }
            if (share.media != null) {
                let mediaExists: boolean;
                try {
                    const response = await app.api.shareCheck({
                        openId: await app.api.authedOpenId(),
                        media: share.media,
                        shareMark: share.sourceMark,
                    });
                    mediaExists = response.mediaExists;
                } catch (err) {
                    if (kDev) {
                        console.log('share check', err);
                    }
                    wx.showToast({
                        title: '查找分享内容失败',
                        icon: 'error',
                        duration: 1000,
                    });
                    return;
                }

                if (!mediaExists) {
                    wx.showToast({
                        title: '分享的视频已失效',
                        icon: 'error',
                        duration: 1000,
                    });
                    return;
                }

                app.api.navigateTo({
                    path: '/pages/feed/index',
                    params: {
                        top: share.media,
                    },
                });
            } else if (share.user != null) {
                app.api.navigateTo({
                    path: '/pages/user/index',
                    params: {
                        top: share.user,
                    },
                });
            }
        },
        reportPageViewOnce() {
            if (this.data._pageViewReported) {
                return;
            }
            this.data._pageViewReported = true;
            app.api.onPageChange({
                path: '/home',
            });
        },
        reportTabView() {
            app.api.onPageChange({
                path: `/home/${this.data.currentTab}`,
                params: {},
            });
        },
        changeTab(tab: Tab) {
            if (this.data.currentTab == tab) {
                return;
            }

            const newTabs: TabConfig[] = [];
            for (let tabConfig of this.data.tabs) {
                newTabs.push({
                    ...tabConfig,
                    className: `content ${tab == tabConfig.tab ? 'active' : 'inactive'}`,
                    create: tabConfig.create || tab == tabConfig.tab,
                });
            }

            this.setData({
                currentTab: tab,
                tabs: newTabs,
            });
            this.reportTabView();
        },
        onTapTab(event: WechatMiniprogram.BaseEvent) {
            this.changeTab(event.currentTarget.dataset.tab);
        },
        onShareAppMessage(event: { from: string }) {
            return this.doShare('message', event.from);
        },
        onShareTimeline() {
            return this.doShare('timeline');
        },
        onAddToFavorites() {
            return this.doShare('favorite');
        },
        doShare(target: ShareTarget, from?: string) {
            return app.api.createShare({
                item: {
                    type: 'app',
                    title: kShareTitle,
                    image: kShareImage,
                },
                path: '/pages/index/index',
                target,
                from,
            });
        }
    },
})
