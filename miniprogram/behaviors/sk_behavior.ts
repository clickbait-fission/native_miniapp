import {IAppOption} from "../../typings";
import {kDev} from "../utils/consts";

const app = getApp<IAppOption>();

export const skCheckBehavior = Behavior({
    properties: {
        sk: {
            type: String,
            optionalTypes: [null],
            value: null,
        }
    },
    data: {
        _skChecked: false,
        _skCheckPromise: null as Promise<void> | undefined | null,
    },
    methods: {
        skCheckOnce(page: string, ignoreNull?: boolean) {
            if (this.data._skChecked) {
                return;
            }

            this.data._skChecked = true;

            if (this.properties.sk == null) {
                if (ignoreNull === true) {
                    return;
                }
            }

            this.data._skCheckPromise = app.api.checkSessionKey({
                sk: this.properties.sk ?? "",
                page,
            })?.catch((err) => {
                if (kDev) {
                    console.log('sk check error', page, err);
                }
            });
        },
    },
});