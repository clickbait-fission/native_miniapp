Component({
    properties: {
        black: {
            type: Boolean,
            value: true,
        },
        size: {
            type: Number,
            value: 48,
        }
    },
    lifetimes: {
        attached() {
            this.setData({
                style: `--size:${this.properties.size}px;`,
                src: this.properties.black ? '/assets/loader-circle-black.svg' : '/assets/loader-circle-white.svg',
            });
        }
    },
})