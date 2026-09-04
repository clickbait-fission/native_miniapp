/// <reference path="./types/index.d.ts" />

import {Api} from "../miniprogram/api";
import {BasicTrack, StateTracker} from "../miniprogram/utils/trackers";

interface IAppOption {
    api: Api,
    favorite: BasicTrack,
    follow: BasicTrack,
    reported: StateTracker<number[]>,
}