function targetName(target: string) {
    switch (target) {
        case 'friend':
            return '分享好友';
        case 'group':
            return '分享到群';
        default:
            return target;
    }
}

Component({
    properties: {
        mediaId: Number,
        target: String,
    },
    data: {
        className: '',
    },
    lifetimes: {
        attached() {
            this.setData({
                className: `container ${this.properties.target}`,
                text: targetName(this.properties.target),
            });
        },
    },
})