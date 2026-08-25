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
    },
    lifetimes: {
        created() {
            this.initDynamicList({
                itemHeight: 84,
                fetcher: async () => {
                    const draft = await app.api.listDraft({
                        openId: await app.api.authedOpenId(),
                        cursor: this.data._cursor ?? undefined,
                        count: 20,
                    });
                    if (draft.length > 0) {
                        this.data._cursor = draft[draft.length - 1].id;
                    }
                    return draft;
                },
            });
            this.data._dynamicList.emptyHint = '尚未发布任何作品';
        },
        attached() {
            this.data._dynamicList.allowLoadMore = true;
            this.updateLayout();
            this.updateFetch();
        },
        detached() {
            this.data._dynamicList.allowLoadMore = false;
        },
    },
    pageLifetimes: {
        show() {
        },
        resize(size) {
            this.updateDynamicListHeight(size);
        },
    },
})