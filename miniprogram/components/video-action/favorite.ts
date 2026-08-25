import {IAppOption} from "../../../typings";

const app = getApp<IAppOption>();

Component({
    options: {
        pureDataPattern: /^_/,
    },
    properties: {
        mediaId: Number,
        isFavorite: Boolean,
    },
    data: {
        _favoriteUntrack: (() => {
        }) as (() => void),
        _busy: false,
        icon: '',
    },
    lifetimes: {
        attached() {
            this.data._favoriteUntrack = app.favorite.addObserver(() => {
                this.updateFavorite();
            });
            this.updateFavorite();
        },
        detached() {
            this.data._favoriteUntrack();
        },
    },
    methods: {
        updateFavorite() {
            const isFavorite = app.favorite.isFavorite(this.properties.mediaId, this.properties.isFavorite);
            this.setData({
                icon: isFavorite ? '/assets/favorite-remove.svg' : '/assets/favorite-add.svg',
            });
        },
        async onTap() {
            if (this.data._busy) {
                return;
            }

            const isFavorite = app.favorite.isFavorite(this.properties.mediaId, this.properties.isFavorite);
            const op = isFavorite ? 'remove' : 'add';
            const opName = isFavorite ? '取消收藏' : '收藏';
            const revertOp = isFavorite ? 'add' : 'remove';
            app.favorite.changeFavorite(this.properties.mediaId, op);
            try {
                await app.api.favoriteOp({
                    openId: await app.api.authedOpenId(),
                    mediaId: this.properties.mediaId,
                    op,
                });
            } catch (err) {
                wx.showToast({
                    icon: 'error',
                    title: `${opName}失败`,
                    duration: 1000,
                });
                app.favorite.changeFavorite(this.properties.mediaId, revertOp);
                return;
            } finally {
                this.data._busy = false;
            }

            wx.showToast({
                icon: 'success',
                title: `${opName}成功`,
                duration: 700,
            });
        },
    }
})