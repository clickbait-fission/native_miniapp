import {kDev} from "./consts";

type OverrideOp = 'add' | 'remove';

export class BasicTrack {
    private readonly overrides: Record<number, OverrideOp> = {};
    private readonly observing: Record<number, () => void> = {};
    private nextObservingId = 1;
    private hasUpdate = false;

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
        this.hasUpdate = true;
        setTimeout(() => {
            this.triggerUpdate();
        });
    }

    observe(cb: () => void) {
        const idx = this.nextObservingId++;
        this.observing[idx] = cb;

        return () => {
            if (idx in this.observing) {
                delete this.observing[idx];
            }
        };
    }

    has(id: number) {
        return id in this.overrides;
    }

    optCheck(id: number): boolean | undefined {
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