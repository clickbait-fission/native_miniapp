import {kDev} from "./consts";

type OverrideOp = 'add' | 'remove';

export class Observable {
    private readonly observing: Record<number, () => void> = {};
    private nextObservingId = 1;
    private hasUpdate = false;

    observe(cb: () => void) {
        const idx = this.nextObservingId++;
        this.observing[idx] = cb;

        return () => {
            if (idx in this.observing) {
                delete this.observing[idx];
            }
        };
    }

    protected notifyUpdate() {
        if (this.hasUpdate) {
            return;
        }

        this.hasUpdate = true;
        setTimeout(() => {
            this.triggerUpdate();
        });
    }

    private triggerUpdate() {
        if (!this.hasUpdate) {
            return;
        }
        this.hasUpdate = false;

        for (let idx in this.observing) {
            try {
                this.observing[idx]();
            } catch (err) {
                if (kDev) {
                    console.error('FavoriteTrack.update error', err);
                }
            }
        }
    }
}

export class BasicTrack extends Observable {
    private readonly overrides: Record<number, OverrideOp> = {};

    add(id: number) {
        this.change(id, 'add');
    }

    remove(id: number) {
        this.change(id, 'remove');
    }

    change(id: number, op: OverrideOp) {
        if (id in this.overrides && this.overrides[id] === op) {
            return;
        }
        this.overrides[id] = op;
        this.notifyUpdate();
    }

    has(id: number) {
        return id in this.overrides;
    }

    optCheck(id?: number): boolean | undefined {
        if (id == null) {
            return undefined;
        }
        if (id in this.overrides) {
            switch (this.overrides[id]) {
                case 'add':
                    return true;
                case 'remove':
                    return false;
            }
        }
        return undefined;
    }

    check(id: number, fallback?: boolean) {
        return this.optCheck(id) ?? fallback ?? false;
    }
}

export class StateTracker<T> extends Observable {
    state: T;

    constructor(init: T) {
        super();
        this.state = init;
    }

    update(v: T) {
        this.state = v;
        this.notifyUpdate()
    }

    modify(op: (current: T) => T) {
        this.update(op(this.state));
    }
}
