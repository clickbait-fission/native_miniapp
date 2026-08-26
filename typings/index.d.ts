/// <reference path="./types/index.d.ts" />

import {Api} from "../miniprogram/api";
import {BasicTrack} from "../miniprogram/utils/favorite_track";

interface IAppOption {
    api: Api,
    favorite: BasicTrack,
    follow: BasicTrack,
}