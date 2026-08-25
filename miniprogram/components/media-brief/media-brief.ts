import {Media} from "../../api";
import {kAvatar, kNickName} from "../../utils/consts";
import {IAppOption} from "../../../typings";

const app = getApp<IAppOption>();

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
            await app.api.navigateTo({
                path: '/pages/feed/index',
                params: {
                    top: media.id,
                },
            });
        },
        async onTapAuthor() {
            const media = this.properties.media as Media;
            await app.api.navigateTo({
                path: '/pages/user/index',
                params: {
                    uid: media.ownerId,
                },
            });
        },
    }
})