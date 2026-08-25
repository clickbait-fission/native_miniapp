import {kDev} from "./consts";

type FavoriteOp = 'add' | 'remove';

export class FavoriteTrack {
    private readonly favorites: Record<number, FavoriteOp> = {};
    private readonly observing: Record<number, () => void> = {};
    private nextObservingId = 1;
    private hasUpdate = false;

    addFavorite(id: number) {
        this.changeFavorite(id, 'add');
    }

    removeFavorite(id: number) {
        this.changeFavorite(id, 'remove');
    }

    changeFavorite(id: number, op: FavoriteOp) {
        if (id in this.favorites && this.favorites[id] === op) {
            return;
        }
        this.favorites[id] = op;
        this.hasUpdate = true;
        setTimeout(() => {
            this.triggerUpdate();
        });
    }

    addObserver(cb: () => void) {
        const idx = this.nextObservingId++;
        this.observing[idx] = cb;

        return () => {
            if (idx in this.observing) {
                delete this.observing[idx];
            }
        };
    }

    isFavorite(id: number, inputFavorite?: boolean) {
        if (id in this.favorites) {
            switch (this.favorites[id]) {
                case 'add':
                    return true;
                case 'remove':
                    return false;
            }
        }
        return inputFavorite ?? false;
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
                    console.log('FavoriteTrack.update error', err);
                }
            }
        }
    }
}