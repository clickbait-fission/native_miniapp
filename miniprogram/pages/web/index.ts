import {IAppOption} from "../../../typings";
import {skCheckBehavior} from "../../behaviors/sk_behavior";

const app = getApp<IAppOption>();
const page = '/web';

Component({
    options: {
        pureDataPattern: /^_/,
    },
    behaviors: [skCheckBehavior],
    properties: {
        url: String,
    },
    pageLifetimes: {
        show() {
            this.skCheckOnce(page);
            app.api.onPageChange({
                path: page,
            });
        },
    },
    lifetimes: {
        attached() {
            this.setData({
                src: decodeURIComponent(this.properties.url),
            });
        },
    },
})