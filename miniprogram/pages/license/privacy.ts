import {IAppOption} from "../../../typings";
import {skCheckBehavior} from "../../behaviors/sk_behavior";

const app = getApp<IAppOption>();
const page = '/license/privacy';

Component({
    options: {
        pureDataPattern: /^_/,
    },
    behaviors: [
        skCheckBehavior,
    ],
    pageLifetimes: {
        show() {
            this.skCheckOnce(page);
            app.api.onPageChange({
                path: page,
                params: {},
            });
        },
    }
})