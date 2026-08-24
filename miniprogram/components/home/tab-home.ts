import {Media} from "../../api";

type ScrollViewScroll = WechatMiniprogram.ScrollViewScroll;

Component({
    options: {
        pureDataPattern: /^_/,
    },
    properties: {
        cardHeight: {
            type: Number,
            value: 300,
        }
    },
    data: {
        medias: [
            Media.create({id: 15}),
            Media.create({id: 16}),
            Media.create({id: 17}),
            Media.create({id: 18}),
            Media.create({id: 19}),
            Media.create({id: 25}),
            Media.create({id: 26}),
            Media.create({id: 27}),
            Media.create({id: 28}),
            Media.create({id: 29}),
            Media.create({id: 35}),
            Media.create({id: 36}),
            Media.create({id: 37}),
            Media.create({id: 38}),
            Media.create({id: 39}),
            Media.create({id: 45}),
            Media.create({id: 46}),
            Media.create({id: 47}),
            Media.create({id: 48}),
            Media.create({id: 49}),
        ] satisfies Media[],
        shownMedias: [] as Media[],
        _offset: 0,
        _height: 0,
    },
    lifetimes: {
        attached() {
            this.data._height = wx.getWindowInfo().windowHeight;
            this.updateLayout();
        },
    },
    pageLifetimes: {
        resize(size) {
            this.data._height = size.size.windowHeight;
            this.updateLayout();
        },
    },
    methods: {
        updateLayout() {
            const rootHeight = this.properties.cardHeight * this.data.medias.length;
            const safeTop = this.data._offset - this.data._height;
            const safeBottom = this.data._offset + this.data._height * 2;
            const start = Math.max(Math.floor(safeTop / this.properties.cardHeight), 0);
            const end = Math.min(Math.ceil(safeBottom / this.properties.cardHeight), this.data.medias.length - 1);
            const topSpace = start * this.properties.cardHeight;
            const bottomSpace = rootHeight - (end + 1) * this.properties.cardHeight;
            const shownMedias = this.data.medias.slice(start, end);

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

            this.setData({
                dynamicStyle: `--card-height:${this.properties.cardHeight}px;--root-height:${rootHeight}px;--top-space:${topSpace}px;--bottom-space:${bottomSpace}px;`,
                shownMedias,
            });
        },
        onScroll(event: ScrollViewScroll) {
            this.data._offset = event.detail.scrollTop;
            this.updateLayout();
        },
    }
})