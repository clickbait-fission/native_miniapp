import {IAppOption} from "../../../typings";
import {Media, ShareItem, ShareTarget} from "../../api";
import {kDev, kHome, kShareImage, kShareTitle} from "../../utils/consts";
import {computeVars, sleep} from "../../utils/util";
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

    get spanActiveMedia(): Media | null {
        return this.span[this.rotateOffset].media;
    }

    get spanStart(): number {
        // 当前展示内容最后一个media在所有数据中的index
        return this.dataOffset - kSpanHalf;
    }

    get spanEnd(): number {
        // 当前展示内容最后一个media在所有数据中的index
        return this.dataOffset + kSpanHalf;
    }

    get canMoveNegative(): boolean {
        return this.span[(this.rotateOffset + 1) % kSpanSize].media != null;
    }

    get canMovePositive(): boolean {
        return this.dataOffset > 0;
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
        top: {
            type: Number,
            optionalTypes: [null],
            value: null
        },
    },
    data: {
        _active: false,
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
        direction: 'positive',
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
            this.setData({
                medias: this.data._span!.medias,
                vars: computeVars(),
            });
            this.shareCheck();
            this.checkFetchMore();
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
                    console.log('share check error', err);
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
            const direction = span.direction;
            const isEmpty = !this.data._fetching && this.data._end && this.data._data.length == 0;
            const hasMedias = span.hasMedias;
            const circle = this.data._data.length > span.span.length && span.spanStart > 0;

            let hasUpdate = this.data.medias !== span.span
                || this.data.direction != direction
                || this.data.hasMedias != hasMedias
                || this.data.isEmpty != isEmpty
                || this.data.circle != circle
                || !span.matchKeys(this.data._keys);
            if (!hasUpdate) {
                return;
            }

            if (hasUpdate) {
                const patch = {
                    hasMedias,
                    isEmpty,
                    medias: span.medias,
                    direction,
                    circle,
                    _keys: span.keys,
                    current: span.spanActiveIndex,
                };
                if (kDev) {
                    console.log('feed.patch', patch);
                }
                this.setData(patch);
            }
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
                this.data._end = this.data._data.length >= 6; //todo 模拟数据不足
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
            wx.navigateBack();
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
