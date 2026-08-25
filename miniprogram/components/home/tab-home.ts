import {IAppOption} from "../../../typings";
import {dynamicListBehavior} from "../../behaviors/dynamic_list";

const app = getApp<IAppOption>();

Component({
    options: {
        pureDataPattern: /^_/,
    },
    behaviors: [
        dynamicListBehavior,
    ],
    properties: {
        topId: {
            type: Number,
            optionalTypes: [null],
            value: null,
        },
        cardHeight: {
            type: Number,
            value: 280,
        },
    },
    lifetimes: {
        created() {
            this.initDynamicList({
                itemHeight: this.properties.cardHeight,
                fetcher: async (currentCount) => {
                    const openId = await app.api.authedOpenId();
                    return await app.api.recommendByRankScore({
                        openId: openId,
                        topId: currentCount == 0 ? (this.properties.topId ?? undefined) : undefined,
                    });
                },
            });
        },
        attached() {
            this.data._dynamicList.allowLoadMore = true;
            this.updateLayout(true);
            this.updateFetch();
        },
        detached() {
            this.data._dynamicList.allowLoadMore = false;
        }
    },
    pageLifetimes: {
        resize(size) {
            this.updateDynamicListHeight(size);
        },
    },
})