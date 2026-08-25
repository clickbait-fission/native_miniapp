import {IAppOption} from "../../../typings";
import {Media} from "../../api";

const app = getApp<IAppOption>();
const page = '/feed';

type OptMedia = Media | null;

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

class RotateSpan {
    readonly span: MediaInSpan[] = [
        new MediaInSpan(),
        new MediaInSpan(),
        new MediaInSpan(),
        new MediaInSpan(),
        new MediaInSpan(),
    ];

    get spanActiveIndex(): number {
        // todo: 当前展示内容在span中的index
    }

    get spanEnd(): number {
        // todo: 当前展示内容最后一个media在所有数据中的index
    }

    move(step: number) {
        // todo: 移动当前span特定个步骤, 对应用户滑动了n个视频
    }

    pickData(data: Media[]) {
        // todo: data是整个feed流的所有数据, 根据当前位置和span的rotate情况, 挑选数据填充到span中
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
        _skChecked: false,
        _skReportPromise: null as Promise<void> | null,
        direction: 'positive',
        medias: initMedias(),
        _data: initData(),
        _rotateOffset: 0,
        _dataOffset: 0,
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
    }
})