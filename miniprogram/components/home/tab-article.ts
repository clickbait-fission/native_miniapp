import {IAppOption} from "../../../typings";
import {Article} from "../../api";
import {sleep} from "../../utils/util";
import {kDev} from "../../utils/consts";

const app = getApp<IAppOption>();

Component({
    options: {
        pureDataPattern: /^_/,
    },
    data: {
        _active: false,
        fetched: false,
        fetching: false,
        articles: [] as Article[],
    },
    lifetimes: {
        attached() {
            this.data._active = true;
            this.prepareData();
        },
        detached() {
            this.data._active = false;
        }
    },
    methods: {
        async prepareData() {
            if (!this.data._active || this.data.fetched || this.data.fetching) {
                return;
            }

            this.setData({
                fetching: true,
            });

            if (kDev) {
                await sleep(1);
            }

            while (this.data._active && !this.data.fetched) {
                let articles: Article[];
                try {
                    articles = await app.api.getArticle({
                        openId: await app.api.authedOpenId(),
                    });
                } catch (err) {
                    if (kDev) {
                        console.log('article error', err);
                    }
                    await sleep(1);
                    continue;
                }

                this.setData({
                    fetched: true,
                    articles,
                });
            }
            this.setData({
                fetching: false,
            });
        }
    }
})