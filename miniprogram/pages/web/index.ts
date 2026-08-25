Component({
    properties: {
        url: String,
    },
    lifetimes: {
        attached() {
            this.setData({
                src: decodeURIComponent(this.properties.url),
            });
        },
    },
})