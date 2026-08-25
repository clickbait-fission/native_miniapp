import {IAppOption} from "../../../typings";
import {Media} from "../../api";
import {kDev} from "../../utils/consts";
import {sleep} from "../../utils/util";

const app = getApp<IAppOption>();
const page = '/feed';

type OptMedia = Media | null;

/** swiper固定展示的swiper-item个数 */
const kSpanSize = 5;
/** 当前视频前后各保留的span槽位数, 即 (kSpanSize - 1) / 2 */
const kSpanHalf = (kSpanSize - 1) / 2;
/** span末尾距已加载数据末尾多近时提前拉取下一页 */
const kPrefetchCount = 3;

function initData(): Media[] {
    return [];
}

function initMedias(): OptMedia[] {
    return [null, null, null, null, null];
}

class MediaInSpan {
    media: Media | null = null;
    active: boolean = false;
    nearActive: boolean = false;
}

function initSpanData() {
    const data: MediaInSpan[] = [];
    for (let i = 0; i < kSpanSize; i++) {
        data.push(new MediaInSpan());
    }
    return data;
}

/**
 * 管理可循环swiper中旋转的数据span。
 *
 * span固定持有kSpanSize个槽位, 只维护以"当前正在看的视频"为中心的一小段数据窗口,
 * 因此超长feed流不必把全部数据渲染进swiper, 也就没有大数据量下的性能问题。
 *
 * 数据窗口的映射规则(旋转复用):
 *   - rotateOffset: 当前正在看的视频在span中的槽位index, 与swiper的current一致;
 *   - dataOffset:    当前正在看的视频在整体feed数据中的index;
 *   - 槽位i存放 feed[dataOffset + rel], 其中rel = ((i - rotateOffset) % spanSize) 归一化到 [-kSpanHalf, kSpanHalf]。
 *
 * 因为"即将滑入视口的槽位"总是预先填好了下一个视频, 循环swiper在首尾衔接(4->0或0->4)
 * 的动画过程中不会闪现旧内容; 每次move只会有1个位于视口外的槽位需要重新填充。
 */
class RotateSpan {
    readonly span: MediaInSpan[] = initSpanData();

    /** 当前正在看的视频在span中的槽位index(即swiper的current) */
    private rotateOffset: number = 0;

    /** 当前正在看的视频在整体feed数据中的index */
    private dataOffset: number = 0;

    /** 槽位index相对当前视频的偏移, 归一化到 [-kSpanHalf, kSpanHalf] */
    private relOf(index: number): number {
        let rel = ((index - this.rotateOffset) % kSpanSize + kSpanSize) % kSpanSize;
        if (rel > kSpanHalf) {
            rel -= kSpanSize;
        }
        return rel;
    }

    get spanActiveIndex(): number {
        // 当前展示内容在span中的index
        return this.rotateOffset;
    }

    get spanEnd(): number {
        // 当前展示内容最后一个media在所有数据中的index
        return this.dataOffset + kSpanHalf;
    }

    get canMovePositive(): boolean {
        // todo: 当前视频的下一个视频不为null返回true
    }

    get canMoveNegative(): boolean {
        // todo: 当前视频不是第一个视频则返回true
    }

    get direction() {
        if (this.canMovePositive && this.canMoveNegative) {
            return 'all';
        }
        if (this.canMovePositive) {
            return 'positive';
        }
        if (this.canMoveNegative) {
            return 'negative';
        }
        // unreachable
        return 'none';
    }

    move(step: number) {
        // 移动当前span特定个步骤, 对应用户滑动了n个视频
        if (step === 0) {
            return;
        }
        this.dataOffset += step;
        this.rotateOffset = ((this.rotateOffset + step) % kSpanSize + kSpanSize) % kSpanSize;
    }

    pickData(data: Media[]) {
        // data是整个feed流的所有数据, 根据当前位置和span的rotate情况, 挑选数据填充到span中
        for (let i = 0; i < this.span.length; i++) {
            const rel = this.relOf(i);
            const idx = this.dataOffset + rel;
            const entry = this.span[i];
            entry.media = idx >= 0 && idx < data.length ? data[idx] : null;
            entry.active = i === this.rotateOffset;
            entry.nearActive = rel === 1 || rel === -1;
        }
    }
}

Component({
    options: {
        pureDataPattern: /^_/,
    },
    properties: {
        top: {
            type: Number,
            optionalTypes: [null],
            value: null
        },
        sk: {
            type: String,
            optionalTypes: [null],
            value: null,
        },
    },
    data: {
        _active: false,
        _skChecked: false,
        _skReportPromise: null as Promise<void> | null,
        direction: 'positive',
        hasMedias: false,
        medias: initMedias(),
        _span: new RotateSpan(),
        _data: initData(),
        _fetching: false,
        _end: false,
    },
    lifetimes: {
        attached() {
            this.data._active = true;
            this.checkFetchMore();
        },
        detached() {
            this.data._active = false;
        },
    },
    pageLifetimes: {
        show() {
            if (!this.data._skChecked) {
                this.data._skChecked = true;
                this.data._skReportPromise = app.api.checkSessionKey({
                    sk: this.properties.sk,
                    page,
                });
            }
            app.api.onPageChange({
                path: page,
            });
        },
    },
    methods: {
        onSwiperChange(event: WechatMiniprogram.SwiperChange) {
            const span = this.data._span;

            let step = event.detail.current - span.spanActiveIndex;
            if (step > kSpanHalf) {
                step -= kSpanSize;
            } else if (step < -kSpanHalf) {
                step += kSpanSize;
            }
            if (step === 0) {
                return;
            }
            span.move(step);
            span.pickData(this.data._data);
            this.sync();
            this.checkFetchMore();
        },
        sync() {
            const span = this.data._span;
            let hasUpdate = span.direction != this.data.direction;
            if (!hasUpdate) {
                for (let i = 0; i < kSpanSize; i++) {
                    if (this.data.medias[i]?.id === span.span[i].media?.id) {
                        continue;
                    }
                    hasUpdate = true;
                    break;
                }
            }

            if (!hasUpdate) {
                return;
            }

            let newMedias = [];
            let hasMedias = false;
            for (let i = 0; i < kSpanSize; i++) {
                hasMedias ||= span.span[i].media != null;
                newMedias.push(span.span[i].media);
            }

            if (hasUpdate) {
                this.setData({
                    hasMedias,
                    medias: newMedias,
                    direction: span.direction,
                });
            }
        },
        async checkFetchMore() {
            if (!this.data._active || this.data._fetching || this.data._end || this.data._span.spanEnd < (this.data._data.length - kPrefetchCount)) {
                return;
            }

            this.data._fetching = true;
            while (this.data._active && !this.data._end && this.data._span.spanEnd >= (this.data._data.length - kSpanHalf)) {
                let chunk: Media[];
                try {
                    if (kDev) {
                        await sleep(1);
                    }
                    chunk = await app.api.recommendByRankScore({
                        openId: await app.api.authedOpenId(),
                        topId: this.data._data.length == 0 ? (this.properties.top ?? undefined) : undefined,
                    });
                } catch (err) {
                    if (kDev) {
                        console.log('feed error', err);
                    }
                    await sleep(1);
                    continue;
                }

                if (chunk.length == 0) {
                    this.data._end = true;
                    break;
                }

                this.data._data.push(...chunk);
                this.data._span.pickData(this.data._data);
                this.sync();
            }
            this.data._fetching = false;
        },
    },
})
