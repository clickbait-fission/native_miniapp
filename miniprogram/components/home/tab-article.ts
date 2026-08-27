import {IAppOption} from "../../../typings";
import {Article} from "../../api";
import {sleep} from "../../utils/util";
import {kDev} from "../../utils/consts";

type BaseEvent = WechatMiniprogram.BaseEvent;

const app = getApp<IAppOption>();

Component({
    options: {
        pureDataPattern: /^_/,
    },
    data: {
        _active: false,
        fetched: false,
        fetching: false,
        articles: [] as (Article & { key: string })[],
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
                    articles = await app.api.getArticle();
                } catch (err) {
                    if (kDev) {
                        console.error('article error', err);
                    }
                    await sleep(1);
                    continue;
                }

                const keyArticles = [];
                for (let i = 0; i < articles.length; i++) {
                    keyArticles.push({...articles[i], key: `$i`});
                }

                this.setData({
                    fetched: true,
                    articles: keyArticles,
                });
            }
            this.setData({
                fetching: false,
            });
        },
        async onTapArticle(event: BaseEvent) {
            const url = `${event.currentTarget.dataset.url}`;
            await app.api.navigateTo({
                path: '/pages/web/index',
                params: {
                    url,
                },
            });
        },
    },
})