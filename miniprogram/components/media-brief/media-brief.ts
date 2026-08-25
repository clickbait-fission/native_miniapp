import {Media} from "../../api";
import {kAvatar, kNickName} from "../../utils/consts";

Component({
    properties: {
        media: Object,
    },
    data: {
    },
    lifetimes: {
        attached() {
            const media = this.properties.media as Media;
            this.setData({
                id: media.id,
                cover: media.cover,
                avatar: media.ownerAvatar ?? kAvatar,
                nickname: media.ownerNickname ?? kNickName,
            });
        }
    },
    methods: {
        async onTapVideo() {
            const media = this.properties.media as Media;
            await wx.navigateTo({
                url: `/feed?top=${media.id}`,
            });
        },
        async onTapAuthor() {
            const media = this.properties.media as Media;
            await wx.navigateTo({
                url: `/user/${media.ownerId}`,
            });
        },
    }
})