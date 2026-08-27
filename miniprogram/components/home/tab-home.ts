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
        hasTop: Boolean,
        top: Number,
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
                    return await app.api.recommendByRankScore({
                        topId: currentCount == 0 && this.properties.hasTop ? this.properties.top : undefined,
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