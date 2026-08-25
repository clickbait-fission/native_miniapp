import {IAppOption} from "../../../typings";

const app = getApp<IAppOption>();
const page = '/feed';

Component({
    options: {
        pureDataPattern: /^_/,
    },
    properties: {
        top: {
            type: Number,
            optionalTypes: [null],
            value: null
        },
        sk: {
            type: String,
            optionalTypes: [null],
            value: null,
        },
    },
    data: {
        _skChecked: false,
        _skReportPromise: null as Promise<void> | null,
    },
    pageLifetimes: {
        show() {
            if (!this.data._skChecked) {
                this.data._skChecked = true;
                this.data._skReportPromise = app.api.checkSessionKey({
                    sk: this.properties.sk,
                    page,
                });
            }
            app.api.onPageChange({
                path: page,
            });
        },
    },
    methods: {}
})