import {IAppOption} from "../../../typings";

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

function computeVars() {
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const windowInfo = wx.getWindowInfo();
    return `--safe-top: ${menuButton.top}px; --safe-bottom: ${windowInfo.windowHeight - windowInfo.safeArea.bottom}px;`;
}

Component({
    options: {
        pureDataPattern: /^_/,
    },
    properties: {},
    data: {
        _pageViewReported: false,
        currentTab: initTab(),
        tabs: initTabConfig(),
        vars: computeVars(),
    },
    pageLifetimes: {
        show() {
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
    },
})
