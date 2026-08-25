import {IAppOption} from "../../../typings";

const app = getApp<IAppOption>();
const page = '/license/term-of-use';

Component({
    options: {
        pureDataPattern: /^_/,
    },
    properties: {
        sk: {
            type: String,
            optionalTypes: [null],
            value: null,
        },
    },
    data: {
        _skChecked: false,
    },
    pageLifetimes: {
        show() {
            if (!this.data._skChecked) {
                this.data._skChecked = true;
                app.api.checkSessionKey({sk: this.properties.sk, page});
            }

            app.api.onPageChange({
                path: page,
                params: {},
            });
        },
    }
})