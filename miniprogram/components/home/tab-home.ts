import {IAppOption} from "../../../typings";
import {dynamicListBehavior} from "../../behaviors/dynamic_list";
import {typedNull} from "../../utils/util";
import {Media} from "../../api";

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
    data: {
        _reportTrack: typedNull<() => void>(),
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
            this.data._reportTrack = app.reported.observe(() => {
                this.reportCheck();
            });
            this.reportCheck(true);
            this.updateLayout(true);
            this.updateFetch();
        },
        detached() {
            this.data._dynamicList.allowLoadMore = false;
            if (this.data._reportTrack != null) {
                this.data._reportTrack();
                this.data._reportTrack = null;
            }
        }
    },
    pageLifetimes: {
        resize(size) {
            this.updateDynamicListHeight(size);
        },
    },
    methods: {
        reportCheck(skipSync?: boolean) {
            let hasUpdate = false;
            for (let i = this.data._dynamicList.data.length - 1; i >= 0; i--) {
                const media = this.data._dynamicList.data[i] as Media;
                if (app.reported.state.indexOf(media.id) < 0) {
                    continue;
                }
                hasUpdate = true;
                this.data._dynamicList.data.splice(i, 1);
            }

            if (hasUpdate && skipSync !== true) {
                this.updateLayout(true);
                this.updateFetch();
            }
        },
    },
})