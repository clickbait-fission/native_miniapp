import {IAppOption} from "../../../typings";
import {skCheckBehavior} from "../../behaviors/sk_behavior";
import {shareBehavior} from "../../behaviors/share_behavior";

const app = getApp<IAppOption>();
const page = '/user';

Component({
    options: {
        pureDataPattern: /^_/,
    },
    behaviors: [
        skCheckBehavior,
        shareBehavior,
    ],
    properties: {
        uid: Number,
    },
    data: {
        _shareCheck: false,
    },
    pageLifetimes: {
        show() {
            if (!this.data._skChecked) {
                this.data._skChecked = true;
                app.api.checkSessionKey({sk: this.properties.sk, page});
            }
            this.shareCheck();
            app.api.onPageChange({
                path: page,
            });
        },
    },
    methods: {
        shareCheck() {
            if (this.data._shareCheck) {
                return;
            }

            this.data._shareCheck = true;
            const share = this.parseShare();
            this.skCheckOnce(page, share?.user === this.properties.uid);
        }
    }
})