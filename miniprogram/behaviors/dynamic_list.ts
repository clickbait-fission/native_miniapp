import {kDev} from "../utils/consts";

type IResizeOption = WechatMiniprogram.Page.IResizeOption;
type ItemFetcher = (currentCount: number) => Promise<unknown[]>;

type DynamicListData = {
    itemHeight: number;
    fetcher: ItemFetcher;
    data: unknown[];
    fetching: boolean;
    eof: boolean;
    start: number;
    end: number;
    offset: number;
    height: number;
    allowLoadMore: boolean;
    emptyHint: string;
    loadingHint: string;
    endHint: string;
};

const emptyDynamicListData: DynamicListData = {
    itemHeight: 0,
    fetcher: () => Promise.resolve([]),
    data: [],
    fetching: false,
    eof: true,
    start: -1,
    end: -1,
    offset: 0,
    height: 0,
    allowLoadMore: false,
    emptyHint: '',
    loadingHint: '',
    endHint: '',
};

export const dynamicListBehavior = Behavior({
    data: {
        _dynamicList: emptyDynamicListData,
        dynamicStyle: '',
        shown: [] as unknown[],
    },
    methods: {
        initDynamicList(
            opts: {
                itemHeight: number;
                fetcher: ItemFetcher;
            }
        ) {
            const wi = wx.getWindowInfo();
            this.data._dynamicList = {
                itemHeight: opts.itemHeight,
                fetcher: opts.fetcher,
                data: [],
                fetching: false,
                eof: false,
                start: -1,
                end: -1,
                offset: 0,
                height: Math.max(wi.windowWidth, wi.windowHeight),
                allowLoadMore: true,
                emptyHint: '这里什么都没有',
                loadingHint: '正在加载更多精彩视频',
                endHint: '没有更多啦',
            };
        },
        updateDynamicListHeight(opts?: IResizeOption) {
            const ws = opts?.size ?? wx.getWindowInfo();
            this.data._dynamicList.height = Math.max(ws.windowWidth, ws.windowHeight);
        },
        updateLayout(force?: boolean) {
            const dynamicList = this.data._dynamicList;
            const rootHeight = dynamicList.itemHeight * dynamicList.data.length;
            const safeTop = dynamicList.offset - dynamicList.height;
            const safeBottom = dynamicList.offset + dynamicList.height * 2;
            const start = Math.max(Math.floor(safeTop / dynamicList.height), 0);
            const end = Math.min(Math.ceil(safeBottom / dynamicList.itemHeight), dynamicList.data.length - 1);

            if (force != true && dynamicList.start == start && dynamicList.end == end) {
                return;
            }
            dynamicList.start = start;
            dynamicList.end = end;

            const topSpace = start * dynamicList.itemHeight;
            const bottomSpace = rootHeight - (end + 1) * dynamicList.itemHeight;
            const shown = dynamicList.data.slice(start, end);

            if (kDev) {
                console.log('updateLayout', {
                    rootHeight,
                    safeTop,
                    safeBottom,
                    start,
                    end,
                    topSpace,
                    bottomSpace,
                    shown,
                    dynamicList,
                });
            }

            this.setData({
                dynamicStyle: `--card-height:${dynamicList.itemHeight}px;--root-height:${rootHeight}px;--top-space:${topSpace}px;--bottom-space:${bottomSpace}px;`,
                shown,
            });
        },
        updateFetch() {
            const dynamicList = this.data._dynamicList;
            const rootHeight = dynamicList.itemHeight * dynamicList.data.length;
            if (kDev) {
                console.log('updateFetch', dynamicList);
            }

            if (dynamicList.fetching || dynamicList.eof || !dynamicList.allowLoadMore || dynamicList.offset < rootHeight - dynamicList.height * 2) {
                return;
            }
            dynamicList.fetching = true;
            this.setData({
                hint: dynamicList.loadingHint,
            });

            dynamicList.fetcher(dynamicList.data.length)
                .then((moreData) => {
                    dynamicList.fetching = false;

                    if (moreData.length == 0) {
                        dynamicList.eof = true;
                    } else {
                        dynamicList.data = [...dynamicList.data, ...moreData];
                    }
                    this.setData({
                        hint: dynamicList.eof ? dynamicList.endHint : '',
                    });

                    this.updateLayout(true);
                    setTimeout(() => {
                        this.updateFetch();
                    }, 100);
                })
                .catch((err) => {
                    dynamicList.fetching = false;
                    if (kDev) {
                        console.log('rank error', err);
                    }
                    setTimeout(() => {
                        this.updateFetch();
                    }, 1000);
                });
        },
        onScroll(event: WechatMiniprogram.ScrollViewScroll) {
            const dynamicList = this.data._dynamicList;
            if (Math.abs(dynamicList.offset - event.detail.scrollTop) < dynamicList.itemHeight) {
                return;
            }
            dynamicList.offset = event.detail.scrollTop;
            this.updateLayout();
            this.updateFetch();
        },
    },
});