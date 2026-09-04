type TapInput<T> = {
    tapTimeoutSeconds?: number;
    onTap: (id: T) => void;
    onDoubleTap: (id: T) => void;
    tapContentEq?: (a: T, b: T) => boolean;
};

function idomEq<T>(a: T, b: T) {
    return a == b;
}

export class TapTrack<T> {
    private readonly opts: TapInput<T>;
    private waitDoubleTap = false;
    private waitTimer: number = 0;
    private tapContent: T | null = null;

    constructor(opts: TapInput<T>) {
        this.opts = opts;
    }

    private get timeout(): number {
        return this.opts.tapTimeoutSeconds ?? 0.3;
    }

    private isSameContent(id: T) {
        const current = this.tapContent;
        if (current == null) {
            return false;
        }
        return (this.opts.tapContentEq ?? idomEq<T>)(current, id);
    }

    reset() {
        if (this.waitDoubleTap) {
            this.waitDoubleTap = false;
            this.tapContent = null;
            clearTimeout(this.waitTimer);
        }
    }

    onTap(id: T) {
        if (this.waitDoubleTap) {
            this.waitDoubleTap = false;
            clearTimeout(this.waitTimer);
            if (this.isSameContent(id)) {
                this.tapContent = null;
                this.opts.onDoubleTap(id);
                return;
            }
        }

        this.waitDoubleTap = true;
        this.tapContent = id;
        this.waitTimer = setTimeout(() => {
            this.waitDoubleTap = false;
            this.opts.onTap(id);
        }, Math.round(this.timeout * 1000));
    }
}