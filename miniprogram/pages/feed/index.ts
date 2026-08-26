import {IAppOption} from "../../../typings";
import {Media, parseTsMediaArray, ShareItem, ShareTarget} from "../../api";
import {kDev, kHome, kShareImage, kShareTitle} from "../../utils/consts";
import {computeVars, safeBack, sleep} from "../../utils/util";
import {skCheckBehavior} from "../../behaviors/sk_behavior";
import {shareBehavior} from "../../behaviors/share_behavior";

const app = getApp<IAppOption>();
const page = '/feed';

/** swiper固定展示的swiper-item个数 */
const kSpanSize = 5;
/** 当前视频前后各保留的span槽位数, 即 (kSpanSize - 1) / 2 */
const kSpanHalf = (kSpanSize - 1) / 2;
/** span末尾距已加载数据末尾多近时提前拉取下一页 */
const kPrefetchCount = 10;

function initData(): Media[] {
    return [];
}

class MediaInSpan {
    index: number = 0;
    id: string = '';
    media: Media | null = null;
    active: boolean = false;
    nearActive: boolean = false;
}

function initSpanData() {
    const data: MediaInSpan[] = [];
    for (let i = 0; i < kSpanSize; i++) {
        const media = new MediaInSpan();
        media.index = i;
        media.id = `video${i}`;
        data.push(media);
    }
    return data;
}

/**
 * 管理循环swiper中旋转的数据span。
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
 *
 * 边界处理(不再依赖swiper的direction属性):
 *   - 中间区域: 使用上面的旋转布局, circle = true, swiper首尾衔接由旋转槽位保证;
 *   - 顶/底端边界区域: 切换为线性布局(circle = false), 通过reAnchor把span正好对齐到
 *     数据边界(顶端槽位0 = 数据0, 底端槽位4 = 最后一个数据), 让swiper自身的首/尾item
 *     直接成为数据边界, 用户自然无法滑出数据范围。
 */
class RotateSpan {
    readonly span: MediaInSpan[] = initSpanData();

    /** 当前正在看的视频在span中的槽位index(即swiper的current) */
    private rotateOffset: number = 0;

    /** 当前正在看的视频在整体feed数据中的index */
    private dataOffset: number = 0;

    /** 是否处于数据边界(top/bottom)的线性布局; false为中间区域的旋转布局 */
    private linear: boolean = false;

    /** 槽位index相对当前视频的偏移, 归一化到 [-kSpanHalf, kSpanHalf] */
    private relOf(index: number): number {
        if (this.linear) {
            // 线性布局: 槽位直接按窗口顺序摆放, 不做循环归一化
            return index - this.rotateOffset;
        }
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

    get spanActiveMedia(): Media | null {
        return this.span[this.rotateOffset].media;
    }

    get spanEnd(): number {
        // 当前展示内容最后一个media在所有数据中的index
        return this.dataOffset + kSpanHalf;
    }

    /** 当前数据窗口所处的区域: 顶端 / 中间 / 底端 */
    regionOf(len: number): 'top' | 'middle' | 'bottom' {
        if (len <= kSpanSize || this.dataOffset <= kSpanHalf) {
            return 'top';
        }
        if (this.dataOffset >= len - 1 - kSpanHalf) {
            return 'bottom';
        }
        return 'middle';
    }

    /** 只有中间区域需要swiper循环; 顶/底端边界区域关闭circle, 依靠swiper自身边界 */
    circleOf(len: number): boolean {
        return len > kSpanSize && this.regionOf(len) === 'middle';
    }

    /**
     * 将span对齐到数据边界:
     *   - top:    线性窗口从数据头开始, 当前视频位于槽位 dataOffset(槽位0 = 数据0);
     *   - bottom: 线性窗口以数据尾结束, 当前视频位于槽位 dataOffset - (len - kSpanSize)
     *             (槽位4 = 最后一个数据);
     *   - middle: 保持旋转布局与rotateOffset不变。
     * 返回布局是否发生了变化。
     */
    reAnchor(len: number): boolean {
        const region = this.regionOf(len);
        let targetR = this.rotateOffset;
        if (region === 'top') {
            targetR = this.dataOffset;
        } else if (region === 'bottom') {
            targetR = this.dataOffset - (len - kSpanSize);
        }
        const linear = region !== 'middle';
        const changed = this.linear !== linear || this.rotateOffset !== targetR;
        this.linear = linear;
        this.rotateOffset = targetR;
        return changed;
    }

    get hasMedias() {
        for (let i = 0; i < kSpanSize; i++) {
            if (this.span[i].media != null) {
                return true;
            }
        }
        return false;
    }

    get keys() {
        const keys: (number | undefined)[] = [];
        for (let i = 0; i < kSpanSize; i++) {
            keys.push(this.span[i].media?.id);
        }
        return keys;
    }

    get medias(): MediaInSpan[] {
        // 处理数据不足kSpanSize的情况
        if (this.dataOffset - this.rotateOffset == 0) {
            const headPart = [];
            let status: 'head' | 'gap' = 'head';
            for (let i = 0; i < this.span.length; i++) {
                if (this.span[i].media != null) {
                    if (status == 'head') {
                        headPart.push(this.span[i]);
                    } else {
                        // something is wrong
                        return this.span;
                    }
                } else {
                    if (status == 'head') {
                        status = 'gap';
                    }
                }
            }
            return headPart;
        }
        return this.span;
    }

    matchKeys(keys: (number | undefined)[]) {
        if (keys.length != kSpanSize) {
            return false;
        }

        for (let i = 0; i < kSpanSize; i++) {
            if (this.span[i].index !== keys[i]) {
                return false;
            }
        }

        return true;
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
    behaviors: [
        skCheckBehavior,
        shareBehavior,
    ],
    properties: {
        inputMedias: {
            type: Array,
            optionalTypes: [String, null],
            value: null,
        },
        inputIndex: {
            type: Number,
            optionalTypes: [String, null],
            value: null,
        },
        top: {
            type: Number,
            optionalTypes: [null],
            value: null
        },
    },
    data: {
        _active: false,
        _inputCheck: false,
        _shareChecked: false,
        _shareCheckPromise: null as Promise<void> | null,
        _shareMedia: undefined as number | undefined,
        _span: null as RotateSpan | null,
        _data: initData(),
        _fetching: false,
        _end: false,
        _keys: [] as (number | undefined)[],
        _playingId: '',
        _finishReported: false,
        _swiperInAnim: false,
        _swiperAnimResetTimer: null as number | null,
        circle: false,
        hasMedias: false,
        medias: null as MediaInSpan[] | null,
        isEmpty: false,
        vars: '',
        current: 0,
    },
    lifetimes: {
        created() {
            this.data._span = new RotateSpan();
            this.data._data = initData();
        },
        attached() {
            this.data._active = true;
            this.inputCheck();
            this.setData({
                medias: this.data._span!.medias,
                vars: computeVars(),
            });
            this.shareCheck();
            this.checkFetchMore();
            this.sync();
        },
        detached() {
            this.data._active = false;
        },
    },
    pageLifetimes: {
        show() {
            app.api.onPageChange({
                path: page,
            });
        },
        resize() {
            this.setData({
                vars: computeVars(),
            });
        },
    },
    methods: {
        inputCheck() {
            if (this.data._inputCheck) {
                return;
            }
            this.data._inputCheck = true;

            if (this.properties.inputMedias == null) {
                return;
            }

            try {
                const medias = parseTsMediaArray(this.properties.inputMedias);
                let index = 0;
                if (this.properties.inputIndex != null) {
                    switch (typeof this.properties.inputIndex) {
                        case 'number':
                            index = this.properties.inputIndex;
                            break;
                        case 'string':
                            index = parseInt(this.properties.inputIndex);
                            break;
                        default:
                            if (kDev) {
                                console.error('unknown input index type', this.properties.inputIndex)
                            }
                            break;
                    }
                }

                this.data._data = medias;
                this.data._end = true;
                this.data._span!.move(index);
                this.data._span!.pickData(medias)

                if (kDev) {
                    console.log('feed has input', {
                        inputMedias: this.properties.inputMedias,
                        inputIndex: this.properties.inputIndex,
                        medias,
                        index,
                    });
                }
            } catch (err) {
                if (kDev) {
                    console.error('parse input media', err);
                }
            }
        },
        shareCheck() {
            if (this.data._shareChecked) {
                return;
            }
            this.data._shareChecked = true;

            const doShareCheck = async () => {
                const share = this.parseShare();
                this.skCheckOnce(page, share?.media != null);
                await this.data._skCheckPromise;
                const {mediaExists} = await app.api.shareCheck({
                    openId: await app.api.authedOpenId(),
                    shareMark: share?.sourceMark ?? "",
                    media: share?.media ?? undefined,
                });
                if (mediaExists) {
                    this.data._shareMedia = share?.media;
                }
            };
            this.data._shareCheckPromise = doShareCheck().catch((err) => {
                if (kDev) {
                    console.error('share check error', err);
                }
            });
        },
        onSwiperChange(event: WechatMiniprogram.SwiperChange) {
            this.markSwiperInAnim();

            const span = this.data._span!;

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
            // this.sync();
            this.checkFetchMore();
        },
        onSwiperAnimFinish() {
            this.markSwiperAnimDone();
        },
        markSwiperInAnim() {
            this.data._swiperInAnim = true;
            if (this.data._swiperAnimResetTimer != null) {
                clearTimeout(this.data._swiperAnimResetTimer);
            }
            this.data._swiperAnimResetTimer = setTimeout(() => {
                this.markSwiperAnimDone();
            }, 1000);
        },
        markSwiperAnimDone() {
            this.data._swiperInAnim = false;
            if (this.data._swiperAnimResetTimer != null) {
                clearTimeout(this.data._swiperAnimResetTimer);
            }
            this.sync();
        },
        sync() {
            if (kDev) {
                console.log('feed.sync', this.data);
            }

            const span = this.data._span!;
            const data = this.data._data;
            const len = data.length;

            // 数据边界对齐: 顶/底端切换为线性布局并关闭circle, 中间保持旋转布局
            span.reAnchor(len);
            span.pickData(data);

            const isEmpty = !this.data._fetching && this.data._end && len == 0;
            const hasMedias = span.hasMedias;
            const circle = span.circleOf(len);
            const current = span.spanActiveIndex;

            let hasUpdate = this.data.medias !== span.span
                || this.data.hasMedias != hasMedias
                || this.data.isEmpty != isEmpty
                || this.data.circle != circle
                || this.data.current != current
                || !span.matchKeys(this.data._keys);
            if (!hasUpdate) {
                return;
            }

            const patch = {
                hasMedias,
                isEmpty,
                medias: span.medias,
                circle,
                _keys: span.keys,
                current,
            };
            if (kDev) {
                console.log('feed.patch', patch);
            }
            this.setData(patch);
        },
        async checkFetchMore() {
            if (!this.data._active || this.data._fetching || this.data._end || this.data._span!.spanEnd < (this.data._data.length - kPrefetchCount)) {
                return;
            }

            await this.data._skCheckPromise;
            await this.data._shareCheckPromise;

            this.data._fetching = true;
            while (this.data._active && !this.data._end && this.data._span!.spanEnd >= (this.data._data.length - kSpanHalf)) {
                let chunk: Media[];
                try {
                    if (kDev) {
                        await sleep(2);
                    }
                    chunk = await app.api.recommendByRankScore({
                        openId: await app.api.authedOpenId(),
                        topId: this.data._data.length == 0 ? (this.data._shareMedia ?? this.properties.top ?? undefined) : undefined,
                    });
                } catch (err) {
                    if (kDev) {
                        console.error('feed error', err);
                    }
                    await sleep(1);
                    continue;
                }

                if (chunk.length == 0) {
                    this.data._end = true;
                    break;
                }

                this.data._data.push(...chunk);
                this.data._span!.pickData(this.data._data);
                if (!this.data._swiperInAnim) {
                    this.sync();
                }
            }
            this.data._fetching = false;
            if (!this.data._swiperInAnim) {
                this.sync();
            }
        },
        onTapVideo(event: WechatMiniprogram.BaseEvent) {
            const id = event.currentTarget.dataset.id as string;
            const ctx = wx.createVideoContext(id);
            if (this.data._playingId == id) {
                ctx.pause();
            } else {
                ctx.play();
            }
        },
        onVideoPlay(event: WechatMiniprogram.BaseEvent) {
            const id = event.currentTarget.dataset.id as string;
            if (this.data._playingId != id) {
                const previousMedia = this.mediaIdOf(this.data._playingId);
                if (previousMedia != null && !this.data._finishReported) {
                    app.api.reportOneLog((base) => [
                        {
                            base,
                            videoViewFinish: {
                                mediaId: previousMedia,
                                complete: false,
                            },
                        }
                    ]);
                }

                this.data._playingId = id;
                this.data._finishReported = false;

                const mediaId = this.mediaIdOf(id);
                if (mediaId != null) {
                    app.api.reportOneLog((base) => [
                        {
                            base,
                            videoView: {
                                mediaId,
                            },
                        }
                    ]);
                }
            }
        },
        onVideoPause(event: WechatMiniprogram.BaseEvent) {
            const id = event.currentTarget.dataset.mediaId as string;
            if (this.data._playingId == id) {
                this.data._playingId = '';
            }
        },
        onVideoFinish(event: WechatMiniprogram.BaseEvent) {
            const id = event.currentTarget.dataset.mediaId as string;
            if (!this.data._finishReported) {
                this.data._finishReported = true;

                const mediaId = this.mediaIdOf(id);
                if (mediaId != null) {
                    app.api.reportOneLog((base) => [
                        {
                            base,
                            videoViewFinish: {
                                mediaId,
                                complete: true,
                            },
                        }
                    ]);
                }
            }
        },
        mediaIdOf(id: string) {
            for (let mediaInSpan of this.data._span!.span) {
                if (mediaInSpan.id == id) {
                    return mediaInSpan?.media?.id;
                }
            }
            return undefined;
        },
        onTapBack() {
            safeBack();
        },
        onShareAppMessage(event: { from: string }) {
            return this.doShare('message', event.from);
        },
        onShareTimeline() {
            return this.doShare('timeline');
        },
        onAddToFavorites() {
            return this.doShare('favorite');
        },
        doShare(target: ShareTarget, from?: string) {
            const span = this.data._span!;
            const media = span.spanActiveMedia;

            let item: ShareItem;
            if (media == null) {
                item = {
                    type: 'app',
                    title: kShareTitle,
                    image: kShareImage,
                };
            } else {
                item = {
                    type: 'media',
                    id: media.id,
                    title: media.title,
                    cover: media.cover,
                };
            }

            return app.api.createShare({
                item,
                path: kHome,
                target,
                from,
            });
        }
    },
})
