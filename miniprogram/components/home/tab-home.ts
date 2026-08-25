import {Media} from "../../api";
import {IAppOption} from "../../../typings";
import {kDev} from "../../utils/consts";

type ScrollViewScroll = WechatMiniprogram.ScrollViewScroll;

const app = getApp<IAppOption>();

Component({
    options: {
        pureDataPattern: /^_/,
    },
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
    data: {
        medias: [] as (Media & { key: string })[],
        shownMedias: [] as (Media & { key: string })[],
        _active: false,
        _offset: 0,
        _height: 0,
        _currentStart: -1,
        _currentEnd: -1,
        _fetching: false,
        _end: false,
    },
    lifetimes: {
        attached() {
            this.data._active = true;
            this.data._height = wx.getWindowInfo().windowHeight;
            this.updateLayout(true);
            this.updateFetch();
        },
        detached() {
            this.data._active = false;
        }
    },
    pageLifetimes: {
        resize(size) {
            this.data._height = size.size.windowHeight;
            this.updateLayout(true);
            this.updateFetch();
        },
    },
    methods: {
        updateLayout(force?: boolean) {
            const rootHeight = this.properties.cardHeight * this.data.medias.length;
            const safeTop = this.data._offset - this.data._height;
            const safeBottom = this.data._offset + this.data._height * 2;
            const start = Math.max(Math.floor(safeTop / this.properties.cardHeight), 0);
            const end = Math.min(Math.ceil(safeBottom / this.properties.cardHeight), this.data.medias.length - 1);

            if (force != true && this.data._currentStart == start && this.data._currentEnd == end) {
                return;
            }
            this.data._currentStart = start;
            this.data._currentEnd = end;

            const topSpace = start * this.properties.cardHeight;
            const bottomSpace = rootHeight - (end + 1) * this.properties.cardHeight;
            const shownMedias = this.data.medias.slice(start, end);

            if (kDev) {
                console.log('updateLayout', {
                    window: this.data._height,
                    rootHeight,
                    safeTop,
                    safeBottom,
                    start,
                    end,
                    topSpace,
                    bottomSpace,
                    shownMedias,
                });
            }

            this.setData({
                dynamicStyle: `--card-height:${this.properties.cardHeight}px;--root-height:${rootHeight}px;--top-space:${topSpace}px;--bottom-space:${bottomSpace}px;`,
                shownMedias,
            });
        },
        updateFetch() {
            const rootHeight = this.properties.cardHeight * this.data.medias.length;
            if (kDev) {
                console.log('updateFetch', {
                    rootHeight,
                    fetching: this.data._fetching,
                    offset: this.data._offset,
                });
            }

            if (this.data._fetching || this.data._end || !this.data._active || this.data._offset < rootHeight - this.data._height * 2) {
                return;
            }
            this.data._fetching = true;
            this.setData({
                hint: '更多精彩视频加载中',
            });

            async function doFetch(topId: number | undefined) {
                const openId = await app.api.authedOpenId();
                return await app.api.recommendByRankScore({
                    openId: openId,
                    topId: topId ?? undefined,
                });
            }

            doFetch(this.properties.topId)
                .then((medias) => {
                    this.data._fetching = false;

                    if (medias.length == 0) {
                        this.data._end = true;
                        this.setData({
                            hint: '没有更多啦',
                        });
                    } else {
                        const newMedias = [...this.data.medias];
                        for (let i = 0; i < medias.length; i++) {
                            newMedias.push({...medias[i], key: `${newMedias.length}.${medias[i].id}`})
                        }
                        this.setData({
                            medias: newMedias,
                            hint: '',
                        });
                    }

                    this.updateLayout(true);
                    this.updateFetch();
                })
                .catch((err) => {
                    this.data._fetching = false;
                    if (kDev) {
                        console.log('rank error', err);
                    }
                    setTimeout(() => {
                        this.updateFetch();
                    }, 1000);
                });
        },
        onScroll(event: ScrollViewScroll) {
            if (Math.abs(this.data._offset - event.detail.scrollTop) < this.properties.cardHeight) {
                return;
            }
            this.data._offset = event.detail.scrollTop;
            this.updateLayout();
            this.updateFetch();
        },
    }
})