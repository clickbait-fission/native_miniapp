Component({
    properties: {
        media: Object,
    },
    data: {
        mediaJson() {
            return JSON.stringify(this.properties.media);
        }
    }
})