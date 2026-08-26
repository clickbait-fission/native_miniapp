import {IAppOption} from "../../typings";
import {kDev} from "../utils/consts";

const app = getApp<IAppOption>();

export const shareBehavior = Behavior({
    properties: {
        share: {
            type: String,
            optionalTypes: [null],
            value: null,
        },
    },
    methods: {
        parseShare() {
            if (this.properties.share == null || this.properties.share == "") {
                return undefined;
            }
            try {
                return app.api.parseShareParam(this.properties.share);
            } catch (err) {
                if (kDev) {
                    console.error('parse share', err);
                }
                return undefined;
            }
        }
    }
});