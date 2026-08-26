import {dynamicListBehavior} from "../../behaviors/dynamic_list";
import {IAppOption} from "../../../typings";

const app = getApp<IAppOption>();

Component({
    options: {
        pureDataPattern: /^_/,
    },
    behaviors: [
        dynamicListBehavior,
    ],
    data: {
        _cursor: undefined as number | undefined,
        _favoriteTrack: undefined as undefined | (() => void),
    },
    lifetimes: {
        created() {
            this.reInitDynamicList();
            this.data._dynamicList.emptyHint = '什么都没有,去收藏一些喜欢的视频吧';
        },
        attached() {
            this.data._dynamicList.allowLoadMore = true;
            this.updateLayout();
            this.updateFetch();
            this.data._favoriteTrack = app.favorite.observe(() => {
                this.reInitDynamicList();
                this.updateLayout();
                this.updateFetch();
            });
        },
        detached() {
            this.data._dynamicList.allowLoadMore = false;
            this.data._favoriteTrack!();
        },
    },
    pageLifetimes: {
        resize(size) {
            this.updateDynamicListHeight(size);
        },
    },
    methods: {
        reInitDynamicList() {
            this.initDynamicList({
                itemHeight: 84,
                fetcher: async () => {
                    const {cursor, media} = await app.api.getFavorite({
                        openId: await app.api.authedOpenId(),
                        cursor: this.data._cursor ?? undefined,
                        count: 20,
                    });
                    this.data._cursor = cursor;
                    return media;
                },
            });
            this.data._dynamicList.emptyHint = '什么都没有,去收藏一些喜欢的视频吧';
        },
        onTap(event: WechatMiniprogram.BaseEvent) {
            app.api.navigateTo({
                path: '/pages/feed/index',
                params: {
                    top: event.currentTarget.dataset.id,
                },
            });
        }
    },
})