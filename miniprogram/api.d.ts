//#region node_modules/ts-mixer/dist/types/types.d.ts
/**
 * A rigorous type alias for a class.
 */
type Class$1<CtorArgs extends any[] = any[], InstanceType = {}, StaticType = {}, IsAbstract = false> = (abstract new (...args: any[]) => InstanceType) & StaticType;
//#endregion
//#region src/networks/network.d.ts
type HttpMethod = 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT';
interface Network {
  invokeHttp(request: NetworkRequest): Promise<NetworkResponse>;
}
type NetworkRequest = {
  method: HttpMethod;
  uri: string;
  headers?: Record<string, string>;
  requestBody?: Uint8Array<ArrayBuffer>;
};
type NetworkResponse = {
  status: number;
  headers: Record<string, any>;
  body: Uint8Array;
};
//#endregion
//#region node_modules/@bufbuild/protobuf/dist/esm/wire/binary-encoding.d.ts
/**
 * Protobuf binary format wire types.
 *
 * A wire type provides just enough information to find the length of the
 * following value.
 *
 * See https://developers.google.com/protocol-buffers/docs/encoding#structure
 */
declare enum WireType {
  /**
   * Used for int32, int64, uint32, uint64, sint32, sint64, bool, enum
   */
  Varint = 0,
  /**
   * Used for fixed64, sfixed64, double.
   * Always 8 bytes with little-endian byte order.
   */
  Bit64 = 1,
  /**
   * Used for string, bytes, embedded messages, packed repeated fields
   *
   * Only repeated numeric types (types which use the varint, 32-bit,
   * or 64-bit wire types) can be packed. In proto3, such fields are
   * packed by default.
   */
  LengthDelimited = 2,
  /**
   * Start of a tag-delimited aggregate, such as a proto2 group, or a message
   * in editions with message_encoding = DELIMITED.
   */
  StartGroup = 3,
  /**
   * End of a tag-delimited aggregate.
   */
  EndGroup = 4,
  /**
   * Used for fixed32, sfixed32, float.
   * Always 4 bytes with little-endian byte order.
   */
  Bit32 = 5
}
declare class BinaryWriter {
  /**
   * Growable byte buffer. We allocate a reasonably sized
   * initial buffer and double its capacity when needed.
   */
  private buffer;
  /**
   * Cached DataView for fixed-width writes. Read it via `view()`, which
   * rebuilds it if `buffer` has since grown.
   */
  private viewCache;
  /**
   * Current write position in the buffer.
   */
  private pos;
  /**
   * Previous fork positions (the write position at the time
   * `fork()` was called).
   */
  private stackPos;
  /**
   * UTF-8 codec used by `string()`. Uses the text encoding's `encodeUtf8Into`,
   * or emulates it if a custom `encodeUtf8` was passed to the constructor.
   */
  private readonly encodeUtf8Into;
  constructor(encodeUtf8?: (text: string) => Uint8Array);
  private ensureCapacity;
  /**
   * The DataView over `buffer`, rebuilt only if the buffer has grown since it
   * was last used.
   */
  private view;
  /**
   * Return all bytes written and reset this writer.
   */
  finish(): Uint8Array<ArrayBuffer>;
  /**
   * Start a new fork for length-delimited data like a message
   * or a packed repeated field.
   *
   * Must be joined later with `join()`.
   */
  fork(): this;
  /**
   * Join the last fork. Write its length and bytes, then
   * return to the previous state.
   */
  join(): this;
  /**
   * Writes a tag (field number and wire type).
   *
   * Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
   *
   * Generated code should compute the tag ahead of time and call `uint32()`.
   */
  tag(fieldNo: number, type: WireType): this;
  /**
   * Write a chunk of raw bytes.
   */
  raw(chunk: Uint8Array): this;
  /**
   * Write a `uint32` value, an unsigned 32 bit varint.
   */
  uint32(value: number): this;
  /**
   * Write a `int32` value, a signed 32 bit varint.
   */
  int32(value: number): this;
  /**
   * Write a `bool` value, a varint.
   */
  bool(value: boolean): this;
  /**
   * Write a `bytes` value, length-delimited arbitrary data.
   */
  bytes(value: Uint8Array): this;
  /**
   * Write a `string` value, length-delimited data converted to UTF-8 text.
   */
  string(value: string): this;
  /**
   * Write a `float` value, 32-bit floating point number.
   */
  float(value: number): this;
  /**
   * Write a `double` value, a 64-bit floating point number.
   */
  double(value: number): this;
  /**
   * Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
   */
  fixed32(value: number): this;
  /**
   * Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
   */
  sfixed32(value: number): this;
  /**
   * Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
   */
  sint32(value: number): this;
  /**
   * Write a `sfixed64` value, a signed, fixed-length 64-bit integer.
   */
  sfixed64(value: string | number | bigint): this;
  /**
   * Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
   */
  fixed64(value: string | number | bigint): this;
  /**
   * Write a `int64` value, a signed 64-bit varint.
   */
  int64(value: string | number | bigint): this;
  /**
   * Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64(value: string | number | bigint): this;
  /**
   * Write a `uint64` value, an unsigned 64-bit varint.
   */
  uint64(value: string | number | bigint): this;
  /**
   * Write a 64-bit varint directly into the buffer. Accepts the value as
   * split low/high 32-bit words.
   *
   * Ported from varint64write() to avoid the intermediate number[] buffer.
   * See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/writer.js#L344
   */
  private writeVarint64;
}
declare class BinaryReader {
  private readonly decodeUtf8;
  /**
   * Current position.
   */
  pos: number;
  /**
   * Number of bytes available in this reader.
   */
  readonly len: number;
  private readonly buf;
  private readonly view;
  constructor(buf: Uint8Array, decodeUtf8?: (bytes: Uint8Array, strict?: boolean) => string);
  /**
   * Reads a tag - field number and wire type. Tags are uint32 varints; values
   * that do not fit in uint32 are rejected.
   */
  tag(): [number, WireType];
  /**
   * Skip one element and return the skipped data.
   *
   * When skipping StartGroup, provide the tags field number to check for
   * matching field number in the EndGroup tag. Recursion into nested groups
   * is guarded by the `recursionLimit` argument: When the limit is reached,
   * this method throws.
   */
  skip(wireType: WireType, fieldNo?: number, recursionLimit?: number): Uint8Array;
  private varint64Lo;
  private varint64Hi;
  private varint64;
  /**
   * Throws error if position in byte array is out of range.
   */
  private assertBounds;
  /**
   * Read a `uint32` field, an unsigned 32 bit varint.
   */
  uint32: () => number;
  /**
   * Read a `int32` field, a signed 32 bit varint.
   */
  int32(): number;
  /**
   * Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
   */
  sint32(): number;
  /**
   * Read a `int64` field, a signed 64-bit varint.
   */
  int64(): bigint | string;
  /**
   * Read a `uint64` field, an unsigned 64-bit varint.
   */
  uint64(): bigint | string;
  /**
   * Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64(): bigint | string;
  /**
   * Read a `bool` field, a variant.
   */
  bool(): boolean;
  /**
   * Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
   */
  fixed32(): number;
  /**
   * Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
   */
  sfixed32(): number;
  /**
   * Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
   */
  fixed64(): bigint | string;
  /**
   * Read a `fixed64` field, a signed, fixed-length 64-bit integer.
   */
  sfixed64(): bigint | string;
  /**
   * Read a `float` field, 32-bit floating point number.
   */
  float(): number;
  /**
   * Read a `double` field, a 64-bit floating point number.
   */
  double(): number;
  /**
   * Read a `bytes` field, length-delimited arbitrary data.
   */
  bytes(): Uint8Array;
  /**
   * Read a `string` field, length-delimited data converted to UTF-8 text. If
   * `strict` is true, throw on invalid UTF-8 instead of substituting U+FFFD.
   */
  string(strict?: boolean): string;
}
//#endregion
//#region src/models/client/api/shared.d.ts
declare enum ResponseStatus {
  Ok = 0,
  ServerError = 1,
  BadRequest = 2,
  UNRECOGNIZED = -1
}
interface CommonApiData {
  /** 服务端配置的id 不是微信appId */
  appId: number;
  path: string;
  sceneId: number;
}
interface CommonResponseData {
  status: ResponseStatus;
  message: string;
}
interface MediaAsset {
  id: number;
  url: string;
  cover: string;
  title: string;
  tags: string[];
  ownerId: number;
  ownerNickname?: string | undefined;
  ownerAvatar?: string | undefined;
  viewCount: number;
  isFavorite: boolean;
  banned: boolean;
}
interface OssPutMeta {
  url: string;
  form: {
    [key: string]: string;
  };
}
interface DraftAsset {
  id: number;
  mediaId?: number | undefined;
  url?: string | undefined;
  cover?: string | undefined;
  title: string;
  approved: boolean;
  rejectReason?: string | undefined;
}
interface Article {
  address: string;
  image: string;
  title: string;
  brief: string;
}
declare const CommonApiData: MessageFns$5<CommonApiData>;
declare const CommonResponseData: MessageFns$5<CommonResponseData>;
declare const MediaAsset: MessageFns$5<MediaAsset>;
declare const OssPutMeta: MessageFns$5<OssPutMeta>;
declare const DraftAsset: MessageFns$5<DraftAsset>;
declare const Article: MessageFns$5<Article>;
type Builtin$5 = Date | Function | Uint8Array | string | number | boolean | undefined;
type DeepPartial$5<T> = T extends Builtin$5 ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial$5<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial$5<U>> : T extends {} ? { [K in keyof T]?: DeepPartial$5<T[K]>; } : Partial<T>;
type KeysOfUnion$5<T> = T extends T ? keyof T : never;
type Exact$5<P, I extends P> = P extends Builtin$5 ? P : P & { [K in keyof P]: Exact$5<P[K], I[K]>; } & { [K in Exclude<keyof I, KeysOfUnion$5<P>>]: never; };
interface MessageFns$5<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
  create<I extends Exact$5<DeepPartial$5<T>, I>>(base?: I): T;
  fromPartial<I extends Exact$5<DeepPartial$5<T>, I>>(object: I): T;
}
//#endregion
//#region src/models/client/log/activity.d.ts
interface OpenApp {
  path?: string | undefined;
  scene?: number | undefined;
  chatType?: number | undefined;
  groupEncryptedData?: string | undefined;
  groupIv?: string | undefined;
}
interface OpenPage {
  params: {
    [key: string]: string;
  };
}
interface ShareVideo {
  mediaId?: number | undefined;
  shareId: string;
  miniAppFrom?: string | undefined;
  shareTarget: string;
}
interface ReportMedia {
  mediaId: number;
  reason: string;
}
declare const OpenApp: MessageFns$4<OpenApp>;
declare const OpenPage: MessageFns$4<OpenPage>;
declare const ShareVideo: MessageFns$4<ShareVideo>;
declare const ReportMedia: MessageFns$4<ReportMedia>;
type Builtin$4 = Date | Function | Uint8Array | string | number | boolean | undefined;
type DeepPartial$4<T> = T extends Builtin$4 ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial$4<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial$4<U>> : T extends {} ? { [K in keyof T]?: DeepPartial$4<T[K]>; } : Partial<T>;
type KeysOfUnion$4<T> = T extends T ? keyof T : never;
type Exact$4<P, I extends P> = P extends Builtin$4 ? P : P & { [K in keyof P]: Exact$4<P[K], I[K]>; } & { [K in Exclude<keyof I, KeysOfUnion$4<P>>]: never; };
interface MessageFns$4<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
  create<I extends Exact$4<DeepPartial$4<T>, I>>(base?: I): T;
  fromPartial<I extends Exact$4<DeepPartial$4<T>, I>>(object: I): T;
}
//#endregion
//#region src/models/client/log/video.d.ts
interface VideoView {
  mediaId: number;
}
interface VideoViewFinish {
  mediaId: number;
  complete: boolean;
}
declare const VideoView: MessageFns$3<VideoView>;
declare const VideoViewFinish: MessageFns$3<VideoViewFinish>;
type Builtin$3 = Date | Function | Uint8Array | string | number | boolean | undefined;
type DeepPartial$3<T> = T extends Builtin$3 ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial$3<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial$3<U>> : T extends {} ? { [K in keyof T]?: DeepPartial$3<T[K]>; } : Partial<T>;
type KeysOfUnion$3<T> = T extends T ? keyof T : never;
type Exact$3<P, I extends P> = P extends Builtin$3 ? P : P & { [K in keyof P]: Exact$3<P[K], I[K]>; } & { [K in Exclude<keyof I, KeysOfUnion$3<P>>]: never; };
interface MessageFns$3<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
  create<I extends Exact$3<DeepPartial$3<T>, I>>(base?: I): T;
  fromPartial<I extends Exact$3<DeepPartial$3<T>, I>>(object: I): T;
}
//#endregion
//#region src/models/client/log/combined.d.ts
interface CombinedLog {
  base: BaseLogInfo | undefined;
  openApp?: OpenApp | undefined;
  openPage?: OpenPage | undefined;
  videoView?: VideoView | undefined;
  videoViewFinish?: VideoViewFinish | undefined;
  shareVideo?: ShareVideo | undefined;
  reportMedia?: ReportMedia | undefined;
}
interface BaseLogInfo {
  openId: string;
  session: string;
  page: string;
}
declare const CombinedLog: MessageFns$2<CombinedLog>;
declare const BaseLogInfo: MessageFns$2<BaseLogInfo>;
type Builtin$2 = Date | Function | Uint8Array | string | number | boolean | undefined;
type DeepPartial$2<T> = T extends Builtin$2 ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial$2<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial$2<U>> : T extends {} ? { [K in keyof T]?: DeepPartial$2<T[K]>; } : Partial<T>;
type KeysOfUnion$2<T> = T extends T ? keyof T : never;
type Exact$2<P, I extends P> = P extends Builtin$2 ? P : P & { [K in keyof P]: Exact$2<P[K], I[K]>; } & { [K in Exclude<keyof I, KeysOfUnion$2<P>>]: never; };
interface MessageFns$2<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
  create<I extends Exact$2<DeepPartial$2<T>, I>>(base?: I): T;
  fromPartial<I extends Exact$2<DeepPartial$2<T>, I>>(object: I): T;
}
//#endregion
//#region src/apis/session.d.ts
declare class BaseSessionManagement {
  protected session: string;
  private readonly cacheOpenId;
  private readonly cacheUid;
  private readonly cacheShareMark;
  readonly appId: number;
  protected cachedPath: string;
  protected cachedParams: Record<string, string>;
  protected cachedSceneId: number;
  protected appActive: boolean;
  private authCheck;
  private openApp;
  constructor(appId: number);
  onLaunch({ sceneId }: {
    sceneId: number;
  }): void;
  onShow({ sceneId }: {
    sceneId: number | undefined | null;
  }): void;
  onHide(): void;
  onPageChange(page?: {
    path: string;
    params?: Record<string, string | undefined>;
  }): void;
  getSessionKey(): string;
  getOpenApp(): OpenApp | undefined;
  navigateTo({ path, params }: {
    path: string;
    params?: Record<string, string | number | undefined>;
  }): Promise<void>;
  protected updateCachedUid(uid: number): void;
  readCacheUid(): number | undefined;
  authedUid(): Promise<number | undefined>;
  protected updateCachedOpenId(openId: string): void;
  readCachedOpenId(): string;
  authedOpenId(): Promise<string>;
  protected updateCachedShareMark(shareMark: string): void;
  readCachedShareMark(): string;
  authedShareMark(): Promise<string>;
  protected obtainCommonApiData(): CommonApiData;
  protected userSessionCheck(_: {
    openId: string;
  }): Promise<{
    needLogin: boolean;
  }>;
  protected userLogin(_: {
    code: string;
  }): Promise<void>;
  reportOneLog(_: (base: BaseLogInfo) => (Promise<CombinedLog[]> | CombinedLog[])): void;
  private doAuthCheck;
  private updateAppInfo;
  private updateOpenApp;
}
//#endregion
//#region src/apis/base.d.ts
declare class BaseApi extends BaseSessionManagement {
  private readonly base;
  private readonly network;
  constructor(appId: number, base: string, network: Network);
  protected invokeProtoApi<RequestType, ResponseType, BodyType>(options: {
    method?: HttpMethod;
    path: string;
    params?: Record<string, string | number>;
    requestBody: RequestType;
    requestMeta: {
      encode(message: RequestType, writer?: BinaryWriter): BinaryWriter;
    };
    responseMeta: {
      decode(input: BinaryReader | Uint8Array, length?: number): ResponseType;
    };
    extractor: {
      commonOf(response: ResponseType): CommonResponseData | null | undefined;
      bodyOf(response: ResponseType): BodyType;
    };
  }): Promise<BodyType>;
  protected invokeNoOutputProtoApi<RequestType>(options: {
    method?: HttpMethod;
    path: string;
    requestBody: RequestType;
    requestMeta: {
      encode(message: RequestType, writer?: BinaryWriter): BinaryWriter;
    };
  }): Promise<void>;
}
//#endregion
//#region src/apis/api_report_session_corrupt.d.ts
declare class ApiReportSessionCorrupt extends BaseApi {
  checkSessionKey({ sk, page }: {
    sk: string;
    page: string;
  }): Promise<void> | null;
  reportSessionCorrupt({ openId, expect, actual, page }: {
    openId: string;
    expect: string;
    actual: string;
    page: string;
  }): Promise<void>;
}
//#endregion
//#region src/apis/api_report_log.d.ts
declare class ApiReportLog extends BaseApi {
  reportOneLog(gen: (base: BaseLogInfo) => (Promise<CombinedLog[]> | CombinedLog[])): Promise<void>;
  reportLog({ batch }: {
    batch: CombinedLog[];
  }): Promise<void>;
}
//#endregion
//#region src/apis/api_auth.d.ts
declare class ApiAuth extends BaseApi {
  protected userSessionCheck({ openId }: {
    openId: string;
  }): Promise<{
    needLogin: boolean;
  }>;
  protected userLogin({ code }: {
    code: string;
  }): Promise<void>;
}
//#endregion
//#region src/compatible/add_remove_op.d.ts
type TextAddRemoveOp = 'add' | 'remove';
//#endregion
//#region src/apis/api_media.d.ts
type RankName = 'hot';
declare class ApiMedia extends BaseApi {
  recommendByRankScore({ openId, topId, excludeId, count, name }: {
    openId: string;
    topId?: number;
    excludeId?: number;
    count?: number;
    name?: RankName | string;
  }): Promise<MediaAsset[]>;
  favoriteOp({ openId, mediaId, op }: {
    openId: string;
    mediaId: number;
    op: TextAddRemoveOp;
  }): Promise<void>;
  getFavorite({ openId, cursor, count }: {
    openId: string;
    cursor?: number;
    count?: number;
  }): Promise<{
    cursor: number;
    media: MediaAsset[];
  }>;
  createDraft({ openId }: {
    openId: string;
  }): Promise<number>;
  updateDraft({ openId, draftId, markCoverReady, markVideoReady, markReviewReady, title, drop }: {
    openId: string;
    draftId: number;
    markCoverReady?: boolean;
    markVideoReady?: boolean;
    markReviewReady?: boolean;
    title?: string;
    drop?: boolean;
  }): Promise<void>;
  getDraftMeta({ openId, draftId }: {
    openId: string;
    draftId: number;
  }): Promise<{
    cover: OssPutMeta | undefined;
    video: OssPutMeta | undefined;
  }>;
  listDraft({ openId, cursor, count }: {
    openId: string;
    cursor?: number;
    count?: number;
  }): Promise<DraftAsset[]>;
  getArticle({ openId }: {
    openId: string;
  }): Promise<Article[]>;
}
//#endregion
//#region src/models/client/api/user.d.ts
interface BasicUserInfo {
  id: number;
  nickname?: string | undefined;
  avatar?: string | undefined;
  videoCount: number;
  videoViewCount: number;
  fanCount: number;
  followCount: number;
}
interface GetFollowListItem {
  user: BasicUserInfo | undefined;
  cursor: number;
  hot: MediaAsset[];
}
declare const BasicUserInfo: MessageFns$1<BasicUserInfo>;
declare const GetFollowListItem: MessageFns$1<GetFollowListItem>;
type Builtin$1 = Date | Function | Uint8Array | string | number | boolean | undefined;
type DeepPartial$1<T> = T extends Builtin$1 ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial$1<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial$1<U>> : T extends {} ? { [K in keyof T]?: DeepPartial$1<T[K]>; } : Partial<T>;
type KeysOfUnion$1<T> = T extends T ? keyof T : never;
type Exact$1<P, I extends P> = P extends Builtin$1 ? P : P & { [K in keyof P]: Exact$1<P[K], I[K]>; } & { [K in Exclude<keyof I, KeysOfUnion$1<P>>]: never; };
interface MessageFns$1<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
  create<I extends Exact$1<DeepPartial$1<T>, I>>(base?: I): T;
  fromPartial<I extends Exact$1<DeepPartial$1<T>, I>>(object: I): T;
}
//#endregion
//#region src/apis/api_user.d.ts
declare class ApiUser extends BaseApi {
  userUpdateInfo({ openId, nickname, avatar }: {
    openId: string;
    nickname?: string;
    avatar?: string;
  }): Promise<void>;
  getUserInfo(query: {
    uid: number;
  } | {
    openId: string;
  }): Promise<BasicUserInfo | undefined>;
  followOp({ openId, upId, op }: {
    openId: string;
    upId: number;
    op: TextAddRemoveOp;
  }): Promise<void>;
  addFollow({ openId, upId }: {
    openId: string;
    upId: number;
  }): Promise<void>;
  removeFollow({ openId, upId }: {
    openId: string;
    upId: number;
  }): Promise<void>;
  getHot({ openId, upId }: {
    openId: string;
    upId: number;
  }): Promise<MediaAsset[]>;
  checkIsFan(props: {
    openId: string;
  } & ({
    upOpenId: string;
  } | {
    upUid: number;
  })): Promise<boolean>;
  getFollowList({ openId, cursor, count, hotCount }: {
    openId: string;
    cursor?: number;
    count?: number;
    hotCount?: number;
  }): Promise<GetFollowListItem[]>;
  shareCheck({ openId, media, shareMark }: {
    openId: string;
    media?: number;
    shareMark?: string | undefined | null;
  }): Promise<{
    mediaExists: boolean;
  }>;
  reportVideo({ openId, mediaId, reason }: {
    openId: string;
    mediaId: number;
    reason: string;
  }): Promise<void>;
}
//#endregion
//#region src/models/client/api/ad.d.ts
interface Ad {
  id: number;
  materialType: string;
  materialUrl: string;
  webpageUrl: string;
}
declare const Ad: MessageFns<Ad>;
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]>; } : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
type Exact<P, I extends P> = P extends Builtin ? P : P & { [K in keyof P]: Exact<P[K], I[K]>; } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never; };
interface MessageFns<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
  create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
  fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
//#endregion
//#region src/apis/api_ad.d.ts
declare class ApiAd extends BaseApi {
  getAd({ openId }: {
    openId: string;
  }): Promise<Ad | null>;
  markAdExpose({ openId, adId, historyId }: {
    openId: string;
    adId: number;
    historyId: number;
  }): Promise<void>;
  markAdConvert({ openId, adId, historyId }: {
    openId: string;
    adId: number;
    historyId: number;
  }): Promise<void>;
}
//#endregion
//#region node_modules/zod/v4/core/json-schema.d.cts
type _JSONSchema = boolean | JSONSchema;
type JSONSchema = {
  [k: string]: unknown;
  $schema?: "https://json-schema.org/draft/2020-12/schema" | "http://json-schema.org/draft-07/schema#" | "http://json-schema.org/draft-04/schema#";
  $id?: string;
  $anchor?: string;
  $ref?: string;
  $dynamicRef?: string;
  $dynamicAnchor?: string;
  $vocabulary?: Record<string, boolean>;
  $comment?: string;
  $defs?: Record<string, JSONSchema>;
  type?: "object" | "array" | "string" | "number" | "boolean" | "null" | "integer";
  additionalItems?: _JSONSchema;
  unevaluatedItems?: _JSONSchema;
  prefixItems?: _JSONSchema[];
  items?: _JSONSchema | _JSONSchema[];
  contains?: _JSONSchema;
  additionalProperties?: _JSONSchema;
  unevaluatedProperties?: _JSONSchema;
  properties?: Record<string, _JSONSchema>;
  patternProperties?: Record<string, _JSONSchema>;
  dependentSchemas?: Record<string, _JSONSchema>;
  propertyNames?: _JSONSchema;
  if?: _JSONSchema;
  then?: _JSONSchema;
  else?: _JSONSchema;
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: _JSONSchema;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number | boolean;
  minimum?: number;
  exclusiveMinimum?: number | boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxContains?: number;
  minContains?: number;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  dependentRequired?: Record<string, string[]>;
  enum?: Array<string | number | boolean | null>;
  const?: string | number | boolean | null;
  id?: string;
  title?: string;
  description?: string;
  default?: unknown;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  nullable?: boolean;
  examples?: unknown[];
  format?: string;
  contentMediaType?: string;
  contentEncoding?: string;
  contentSchema?: JSONSchema;
  _prefault?: unknown;
};
type BaseSchema = JSONSchema;
//#endregion
//#region node_modules/zod/v4/core/standard-schema.d.cts
/** The Standard interface. */
interface StandardTypedV1<Input = unknown, Output = Input> {
  /** The Standard properties. */
  readonly "~standard": StandardTypedV1.Props<Input, Output>;
}
declare namespace StandardTypedV1 {
  /** The Standard properties interface. */
  interface Props<Input = unknown, Output = Input> {
    /** The version number of the standard. */
    readonly version: 1;
    /** The vendor name of the schema library. */
    readonly vendor: string;
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined;
  }
  /** The Standard types interface. */
  interface Types<Input = unknown, Output = Input> {
    /** The input type of the schema. */
    readonly input: Input;
    /** The output type of the schema. */
    readonly output: Output;
  }
  /** Infers the input type of a Standard. */
  type InferInput<Schema extends StandardTypedV1> = NonNullable<Schema["~standard"]["types"]>["input"];
  /** Infers the output type of a Standard. */
  type InferOutput<Schema extends StandardTypedV1> = NonNullable<Schema["~standard"]["types"]>["output"];
}
/** The Standard Schema interface. */
interface StandardSchemaV1<Input = unknown, Output = Input> {
  /** The Standard Schema properties. */
  readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}
declare namespace StandardSchemaV1 {
  /** The Standard Schema properties interface. */
  interface Props<Input = unknown, Output = Input> extends StandardTypedV1.Props<Input, Output> {
    /** Validates unknown input values. */
    readonly validate: (value: unknown, options?: StandardSchemaV1.Options | undefined) => Result<Output> | Promise<Result<Output>>;
  }
  /** The result interface of the validate function. */
  type Result<Output> = SuccessResult<Output> | FailureResult;
  /** The result interface if validation succeeds. */
  interface SuccessResult<Output> {
    /** The typed output value. */
    readonly value: Output;
    /** The absence of issues indicates success. */
    readonly issues?: undefined;
  }
  interface Options {
    /** Implicit support for additional vendor-specific parameters, if needed. */
    readonly libraryOptions?: Record<string, unknown> | undefined;
  }
  /** The result interface if validation fails. */
  interface FailureResult {
    /** The issues of failed validation. */
    readonly issues: ReadonlyArray<Issue>;
  }
  /** The issue interface of the failure output. */
  interface Issue {
    /** The error message of the issue. */
    readonly message: string;
    /** The path of the issue, if any. */
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }
  /** The path segment interface of the issue. */
  interface PathSegment {
    /** The key representing a path segment. */
    readonly key: PropertyKey;
  }
  /** The Standard types interface. */
  interface Types<Input = unknown, Output = Input> extends StandardTypedV1.Types<Input, Output> {}
  /** Infers the input type of a Standard. */
  type InferInput<Schema extends StandardTypedV1> = StandardTypedV1.InferInput<Schema>;
  /** Infers the output type of a Standard. */
  type InferOutput<Schema extends StandardTypedV1> = StandardTypedV1.InferOutput<Schema>;
}
//#endregion
//#region node_modules/zod/v4/core/registries.d.cts
declare const $output: unique symbol;
type $output = typeof $output;
declare const $input: unique symbol;
type $input = typeof $input;
type $replace<Meta, S extends $ZodType> = Meta extends $output ? output<S> : Meta extends $input ? input<S> : Meta extends (infer M)[] ? $replace<M, S>[] : Meta extends ((...args: infer P) => infer R) ? (...args: { [K in keyof P]: $replace<P[K], S>; }) => $replace<R, S> : Meta extends object ? { [K in keyof Meta]: $replace<Meta[K], S>; } : Meta;
type MetadataType = object | undefined;
declare class $ZodRegistry<Meta extends MetadataType = MetadataType, Schema extends $ZodType = $ZodType> {
  _meta: Meta;
  _schema: Schema;
  _map: WeakMap<Schema, $replace<Meta, Schema>>;
  _idmap: Map<string, Schema>;
  add<S extends Schema>(schema: S, ..._meta: undefined extends Meta ? [$replace<Meta, S>?] : [$replace<Meta, S>]): this;
  clear(): this;
  remove(schema: Schema): this;
  get<S extends Schema>(schema: S): $replace<Meta, S> | undefined;
  has(schema: Schema): boolean;
}
//#endregion
//#region node_modules/zod/v4/core/to-json-schema.d.cts
type Processor<T extends $ZodType = $ZodType> = (schema: T, ctx: ToJSONSchemaContext, json: BaseSchema, params: ProcessParams) => void;
interface ProcessParams {
  schemaPath: $ZodType[];
  path: (string | number)[];
}
interface Seen {
  /** JSON Schema result for this Zod schema */
  schema: BaseSchema;
  /** A cached version of the schema that doesn't get overwritten during ref resolution */
  def?: BaseSchema;
  defId?: string | undefined;
  /** Number of times this schema was encountered during traversal */
  count: number;
  /** Cycle path */
  cycle?: (string | number)[] | undefined;
  isParent?: boolean | undefined;
  /** Schema to inherit JSON Schema properties from (set by processor for wrappers) */
  ref?: $ZodType | null;
  /** JSON Schema property path for this schema */
  path?: (string | number)[] | undefined;
}
interface ToJSONSchemaContext {
  processors: Record<string, Processor>;
  metadataRegistry: $ZodRegistry<Record<string, any>>;
  target: "draft-04" | "draft-07" | "draft-2020-12" | "openapi-3.0" | ({} & string);
  unrepresentable: "throw" | "any";
  override: (ctx: {
    zodSchema: $ZodType;
    jsonSchema: BaseSchema;
    path: (string | number)[];
  }) => void;
  io: "input" | "output";
  counter: number;
  seen: Map<$ZodType, Seen>;
  cycles: "ref" | "throw";
  reused: "ref" | "inline";
  external?: {
    registry: $ZodRegistry<{
      id?: string | undefined;
    }>;
    uri?: ((id: string) => string) | undefined;
    defs: Record<string, BaseSchema>;
  } | undefined;
}
//#endregion
//#region node_modules/zod/v4/core/util.d.cts
type IsAny<T> = 0 extends 1 & T ? true : false;
type Omit$1<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type MakePartial<T, K extends keyof T> = Omit$1<T, K> & InexactPartial<Pick<T, K>>;
type LoosePartial<T extends object> = InexactPartial<T> & {
  [k: string]: unknown;
};
type InexactPartial<T> = { [P in keyof T]?: T[P] | undefined; };
type Identity<T> = T;
type Flatten<T> = Identity<{ [k in keyof T]: T[k]; }>;
type Prettify<T> = { [K in keyof T]: T[K]; } & {};
type AnyFunc = (...args: any[]) => any;
type MaybeAsync<T> = T | Promise<T>;
type Literal = string | number | bigint | boolean | null | undefined;
type Primitive = string | number | symbol | bigint | boolean | null | undefined;
type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseError<T>;
type SafeParseSuccess<T> = {
  success: true;
  data: T;
  error?: never;
};
type SafeParseError<T> = {
  success: false;
  data?: never;
  error: $ZodError<T>;
};
type PropValues = Record<string, Set<Primitive>>;
type PrimitiveSet = Set<Primitive>;
declare abstract class Class {
  constructor(..._args: any[]);
}
//#endregion
//#region node_modules/zod/v4/core/versions.d.cts
declare const version: {
  readonly major: 4;
  readonly minor: 4;
  readonly patch: number;
};
//#endregion
//#region node_modules/zod/v4/core/schemas.d.cts
interface ParseContext<T extends $ZodIssueBase = never> {
  /** Customize error messages. */
  readonly error?: $ZodErrorMap<T>;
  /** Include the `input` field in issue objects. Default `false`. */
  readonly reportInput?: boolean;
  /** Skip eval-based fast path. Default `false`. */
  readonly jitless?: boolean;
}
/** @internal */
interface ParseContextInternal<T extends $ZodIssueBase = never> extends ParseContext<T> {
  readonly async?: boolean | undefined;
  readonly direction?: "forward" | "backward";
  readonly skipChecks?: boolean;
}
interface ParsePayload<T = unknown> {
  value: T;
  issues: $ZodRawIssue[];
  /** A way to mark a whole payload as aborted. Used in codecs/pipes. */
  aborted?: boolean;
  /** @internal Marks a value as a fallback that an outer wrapper (e.g.
   * $ZodOptional) may override with its own interpretation when input was
   * undefined. Set by $ZodCatch when catchValue substitutes and by every
   * $ZodTransform invocation. */
  fallback?: boolean | undefined;
}
type CheckFn<T> = (input: ParsePayload<T>) => MaybeAsync<void>;
interface $ZodTypeDef {
  type: "string" | "number" | "int" | "boolean" | "bigint" | "symbol" | "null" | "undefined" | "void" | "never" | "any" | "unknown" | "date" | "object" | "record" | "file" | "array" | "tuple" | "union" | "intersection" | "map" | "set" | "enum" | "literal" | "nullable" | "optional" | "nonoptional" | "success" | "transform" | "default" | "prefault" | "catch" | "nan" | "pipe" | "readonly" | "template_literal" | "promise" | "lazy" | "function" | "custom";
  error?: $ZodErrorMap<never> | undefined;
  checks?: $ZodCheck<never>[];
}
interface _$ZodTypeInternals {
  /** The `@zod/core` version of this schema */
  version: typeof version;
  /** Schema definition. */
  def: $ZodTypeDef;
  /** @internal Randomly generated ID for this schema. */
  /** @internal List of deferred initializers. */
  deferred: AnyFunc[] | undefined;
  /** @internal Parses input and runs all checks (refinements). */
  run(payload: ParsePayload<any>, ctx: ParseContextInternal): MaybeAsync<ParsePayload>;
  /** @internal Parses input, doesn't run checks. */
  parse(payload: ParsePayload<any>, ctx: ParseContextInternal): MaybeAsync<ParsePayload>;
  /** @internal  Stores identifiers for the set of traits implemented by this schema. */
  traits: Set<string>;
  /** @internal Indicates that a schema output type should be considered optional inside objects.
   * @default Required
   */
  /** @internal */
  optin?: "optional" | undefined;
  /** @internal */
  optout?: "optional" | undefined;
  /** @internal The set of literal values that will pass validation. Must be an exhaustive set. Used to determine optionality in z.record().
   *
   * Defined on: enum, const, literal, null, undefined
   * Passthrough: optional, nullable, branded, default, catch, pipe
   * Todo: unions?
   */
  values?: PrimitiveSet | undefined;
  /** Default value bubbled up from  */
  /** @internal A set of literal discriminators used for the fast path in discriminated unions. */
  propValues?: PropValues | undefined;
  /** @internal This flag indicates that a schema validation can be represented with a regular expression. Used to determine allowable schemas in z.templateLiteral(). */
  pattern: RegExp | undefined;
  /** @internal The constructor function of this schema. */
  constr: new (def: any) => $ZodType;
  /** @internal A catchall object for bag metadata related to this schema. Commonly modified by checks using `onattach`. */
  bag: Record<string, unknown>;
  /** @internal The set of issues this schema might throw during type checking. */
  isst: $ZodIssueBase;
  /** @internal Subject to change, not a public API. */
  processJSONSchema?: ((ctx: ToJSONSchemaContext, json: BaseSchema, params: ProcessParams) => void) | undefined;
  /** An optional method used to override `toJSONSchema` logic. */
  toJSONSchema?: () => unknown;
  /** @internal The parent of this schema. Only set during certain clone operations. */
  parent?: $ZodType | undefined;
}
/** @internal */
interface $ZodTypeInternals<out O = unknown, out I = unknown> extends _$ZodTypeInternals {
  /** @internal The inferred output type */
  output: O;
  /** @internal The inferred input type */
  input: I;
}
type $ZodStandardSchema<T> = StandardSchemaV1.Props<input<T>, output<T>>;
type SomeType$1 = {
  _zod: _$ZodTypeInternals;
};
interface $ZodType<O = unknown, I = unknown, Internals extends $ZodTypeInternals<O, I> = $ZodTypeInternals<O, I>> {
  _zod: Internals;
  "~standard": $ZodStandardSchema<this>;
}
interface _$ZodType<T extends $ZodTypeInternals = $ZodTypeInternals> extends $ZodType<T["output"], T["input"], T> {}
declare const $ZodType: $constructor<$ZodType>;
interface $ZodStringDef extends $ZodTypeDef {
  type: "string";
  coerce?: boolean;
  checks?: $ZodCheck<string>[];
}
interface $ZodStringInternals<Input> extends $ZodTypeInternals<string, Input> {
  def: $ZodStringDef;
  /** @deprecated Internal API, use with caution (not deprecated) */
  pattern: RegExp;
  /** @deprecated Internal API, use with caution (not deprecated) */
  isst: $ZodIssueInvalidType;
  bag: LoosePartial<{
    minimum: number;
    maximum: number;
    patterns: Set<RegExp>;
    format: string;
    contentEncoding: string;
  }>;
}
interface $ZodString<Input = unknown> extends _$ZodType<$ZodStringInternals<Input>> {}
declare const $ZodString: $constructor<$ZodString>;
interface $ZodNumberDef extends $ZodTypeDef {
  type: "number";
  coerce?: boolean;
}
interface $ZodNumberInternals<Input = unknown> extends $ZodTypeInternals<number, Input> {
  def: $ZodNumberDef;
  /** @deprecated Internal API, use with caution (not deprecated) */
  pattern: RegExp;
  /** @deprecated Internal API, use with caution (not deprecated) */
  isst: $ZodIssueInvalidType;
  bag: LoosePartial<{
    minimum: number;
    maximum: number;
    exclusiveMinimum: number;
    exclusiveMaximum: number;
    format: string;
    pattern: RegExp;
  }>;
}
interface $ZodNumber<Input = unknown> extends $ZodType {
  _zod: $ZodNumberInternals<Input>;
}
declare const $ZodNumber: $constructor<$ZodNumber>;
interface $ZodBooleanDef extends $ZodTypeDef {
  type: "boolean";
  coerce?: boolean;
  checks?: $ZodCheck<boolean>[];
}
interface $ZodBooleanInternals<T = unknown> extends $ZodTypeInternals<boolean, T> {
  pattern: RegExp;
  def: $ZodBooleanDef;
  isst: $ZodIssueInvalidType;
}
type OptionalOutSchema = {
  _zod: {
    optout: "optional";
  };
};
type OptionalInSchema = {
  _zod: {
    optin: "optional";
  };
};
type $InferObjectOutput<T extends $ZodLooseShape, Extra extends Record<string, unknown>> = string extends keyof T ? IsAny<T[keyof T]> extends true ? Record<string, unknown> : Record<string, output<T[keyof T]>> : keyof (T & Extra) extends never ? Record<string, never> : Prettify<{ -readonly [k in keyof T as T[k] extends OptionalOutSchema ? never : k]: T[k]["_zod"]["output"]; } & { -readonly [k in keyof T as T[k] extends OptionalOutSchema ? k : never]?: T[k]["_zod"]["output"]; } & Extra>;
type $InferObjectInput<T extends $ZodLooseShape, Extra extends Record<string, unknown>> = string extends keyof T ? IsAny<T[keyof T]> extends true ? Record<string, unknown> : Record<string, input<T[keyof T]>> : keyof (T & Extra) extends never ? Record<string, never> : Prettify<{ -readonly [k in keyof T as T[k] extends OptionalInSchema ? never : k]: T[k]["_zod"]["input"]; } & { -readonly [k in keyof T as T[k] extends OptionalInSchema ? k : never]?: T[k]["_zod"]["input"]; } & Extra>;
type $ZodObjectConfig = {
  out: Record<string, unknown>;
  in: Record<string, unknown>;
};
type $strip = {
  out: {};
  in: {};
};
type $ZodShape = Readonly<{
  [k: string]: $ZodType;
}>;
interface $ZodObjectDef<Shape extends $ZodShape = $ZodShape> extends $ZodTypeDef {
  type: "object";
  shape: Shape;
  catchall?: $ZodType | undefined;
}
interface $ZodObjectInternals<
/** @ts-ignore Cast variance */
out Shape extends $ZodShape = $ZodShape, out Config extends $ZodObjectConfig = $ZodObjectConfig> extends _$ZodTypeInternals {
  def: $ZodObjectDef<Shape>;
  config: Config;
  isst: $ZodIssueInvalidType | $ZodIssueUnrecognizedKeys;
  propValues: PropValues;
  output: $InferObjectOutput<Shape, Config["out"]>;
  input: $InferObjectInput<Shape, Config["in"]>;
  optin?: "optional" | undefined;
  optout?: "optional" | undefined;
}
type $ZodLooseShape = Record<string, any>;
interface $ZodObject<
/** @ts-ignore Cast variance */
out Shape extends Readonly<$ZodShape> = Readonly<$ZodShape>, out Params extends $ZodObjectConfig = $ZodObjectConfig> extends $ZodType<any, any, $ZodObjectInternals<Shape, Params>> {}
declare const $ZodObject: $constructor<$ZodObject>;
type $InferUnionOutput<T extends SomeType$1> = T extends any ? output<T> : never;
type $InferUnionInput<T extends SomeType$1> = T extends any ? input<T> : never;
interface $ZodUnionDef<Options extends readonly SomeType$1[] = readonly $ZodType[]> extends $ZodTypeDef {
  type: "union";
  options: Options;
  inclusive?: boolean;
}
type IsOptionalIn<T extends SomeType$1> = T extends OptionalInSchema ? true : false;
type IsOptionalOut<T extends SomeType$1> = T extends OptionalOutSchema ? true : false;
interface $ZodUnionInternals<T extends readonly SomeType$1[] = readonly $ZodType[]> extends _$ZodTypeInternals {
  def: $ZodUnionDef<T>;
  isst: $ZodIssueInvalidUnion;
  pattern: T[number]["_zod"]["pattern"];
  values: T[number]["_zod"]["values"];
  output: $InferUnionOutput<T[number]>;
  input: $InferUnionInput<T[number]>;
  optin: IsOptionalIn<T[number]> extends false ? "optional" | undefined : "optional";
  optout: IsOptionalOut<T[number]> extends false ? "optional" | undefined : "optional";
}
interface $ZodLiteralDef<T extends Literal> extends $ZodTypeDef {
  type: "literal";
  values: T[];
}
interface $ZodLiteralInternals<T extends Literal = Literal> extends $ZodTypeInternals<T, T> {
  def: $ZodLiteralDef<T>;
  values: Set<T>;
  pattern: RegExp;
  isst: $ZodIssueInvalidValue;
}
interface $ZodOptionalDef<T extends SomeType$1 = $ZodType> extends $ZodTypeDef {
  type: "optional";
  innerType: T;
}
interface $ZodOptionalInternals<T extends SomeType$1 = $ZodType> extends $ZodTypeInternals<output<T> | undefined, input<T> | undefined> {
  def: $ZodOptionalDef<T>;
  optin: "optional";
  optout: "optional";
  isst: never;
  values: T["_zod"]["values"];
  pattern: T["_zod"]["pattern"];
}
interface $ZodOptional<T extends SomeType$1 = $ZodType> extends $ZodType {
  _zod: $ZodOptionalInternals<T>;
}
declare const $ZodOptional: $constructor<$ZodOptional>;
//#endregion
//#region node_modules/zod/v4/core/checks.d.cts
interface $ZodCheckDef {
  check: string;
  error?: $ZodErrorMap<never> | undefined;
  /** If true, no later checks will be executed if this check fails. Default `false`. */
  abort?: boolean | undefined;
  /** If provided, the check runs only when this returns `true`. By default, it is skipped if prior parsing produced aborting issues. */
  when?: ((payload: ParsePayload) => boolean) | undefined;
}
interface $ZodCheckInternals<T> {
  def: $ZodCheckDef;
  /** The set of issues this check might throw. */
  issc?: $ZodIssueBase;
  check(payload: ParsePayload<T>): MaybeAsync<void>;
  onattach: ((schema: $ZodType) => void)[];
}
interface $ZodCheck<in T = never> {
  _zod: $ZodCheckInternals<T>;
}
declare const $ZodCheck: $constructor<$ZodCheck<any>>;
type $ZodStringFormats = "email" | "url" | "emoji" | "uuid" | "guid" | "nanoid" | "cuid" | "cuid2" | "ulid" | "xid" | "ksuid" | "datetime" | "date" | "time" | "duration" | "ipv4" | "ipv6" | "cidrv4" | "cidrv6" | "base64" | "base64url" | "json_string" | "e164" | "lowercase" | "uppercase" | "regex" | "jwt" | "starts_with" | "ends_with" | "includes";
//#endregion
//#region node_modules/zod/v4/core/errors.d.cts
interface $ZodIssueBase {
  readonly code?: string;
  readonly input?: unknown;
  readonly path: PropertyKey[];
  readonly message: string;
}
type $ZodInvalidTypeExpected = "string" | "number" | "int" | "boolean" | "bigint" | "symbol" | "undefined" | "null" | "never" | "void" | "date" | "array" | "object" | "tuple" | "record" | "map" | "set" | "file" | "nonoptional" | "nan" | "function" | (string & {});
interface $ZodIssueInvalidType<Input = unknown> extends $ZodIssueBase {
  readonly code: "invalid_type";
  readonly expected: $ZodInvalidTypeExpected;
  readonly input?: Input;
}
interface $ZodIssueTooBig<Input = unknown> extends $ZodIssueBase {
  readonly code: "too_big";
  readonly origin: "number" | "int" | "bigint" | "date" | "string" | "array" | "set" | "file" | (string & {});
  readonly maximum: number | bigint;
  readonly inclusive?: boolean;
  readonly exact?: boolean;
  readonly input?: Input;
}
interface $ZodIssueTooSmall<Input = unknown> extends $ZodIssueBase {
  readonly code: "too_small";
  readonly origin: "number" | "int" | "bigint" | "date" | "string" | "array" | "set" | "file" | (string & {});
  readonly minimum: number | bigint;
  /** True if the allowable range includes the minimum */
  readonly inclusive?: boolean;
  /** True if the allowed value is fixed (e.g.` z.length(5)`), not a range (`z.minLength(5)`) */
  readonly exact?: boolean;
  readonly input?: Input;
}
interface $ZodIssueInvalidStringFormat extends $ZodIssueBase {
  readonly code: "invalid_format";
  readonly format: $ZodStringFormats | (string & {});
  readonly pattern?: string;
  readonly input?: string;
}
interface $ZodIssueNotMultipleOf<Input extends number | bigint = number | bigint> extends $ZodIssueBase {
  readonly code: "not_multiple_of";
  readonly divisor: number;
  readonly input?: Input;
}
interface $ZodIssueUnrecognizedKeys extends $ZodIssueBase {
  readonly code: "unrecognized_keys";
  readonly keys: string[];
  readonly input?: Record<string, unknown>;
}
interface $ZodIssueInvalidUnionNoMatch extends $ZodIssueBase {
  readonly code: "invalid_union";
  readonly errors: $ZodIssue[][];
  readonly input?: unknown;
  readonly discriminator?: string | undefined;
  readonly options?: Primitive[];
  readonly inclusive?: true;
}
interface $ZodIssueInvalidUnionMultipleMatch extends $ZodIssueBase {
  readonly code: "invalid_union";
  readonly errors: [];
  readonly input?: unknown;
  readonly discriminator?: string | undefined;
  readonly inclusive: false;
}
type $ZodIssueInvalidUnion = $ZodIssueInvalidUnionNoMatch | $ZodIssueInvalidUnionMultipleMatch;
interface $ZodIssueInvalidKey<Input = unknown> extends $ZodIssueBase {
  readonly code: "invalid_key";
  readonly origin: "map" | "record";
  readonly issues: $ZodIssue[];
  readonly input?: Input;
}
interface $ZodIssueInvalidElement<Input = unknown> extends $ZodIssueBase {
  readonly code: "invalid_element";
  readonly origin: "map" | "set";
  readonly key: unknown;
  readonly issues: $ZodIssue[];
  readonly input?: Input;
}
interface $ZodIssueInvalidValue<Input = unknown> extends $ZodIssueBase {
  readonly code: "invalid_value";
  readonly values: Primitive[];
  readonly input?: Input;
}
interface $ZodIssueCustom extends $ZodIssueBase {
  readonly code: "custom";
  readonly params?: Record<string, any> | undefined;
  readonly input?: unknown;
}
type $ZodIssue = $ZodIssueInvalidType | $ZodIssueTooBig | $ZodIssueTooSmall | $ZodIssueInvalidStringFormat | $ZodIssueNotMultipleOf | $ZodIssueUnrecognizedKeys | $ZodIssueInvalidUnion | $ZodIssueInvalidKey | $ZodIssueInvalidElement | $ZodIssueInvalidValue | $ZodIssueCustom;
type $ZodInternalIssue<T extends $ZodIssueBase = $ZodIssue> = T extends any ? RawIssue<T> : never;
type RawIssue<T extends $ZodIssueBase> = T extends any ? Flatten<MakePartial<T, "message" | "path"> & {
  /** The input data */
  readonly input: unknown;
  /** The schema or check that originated this issue. */
  readonly inst?: $ZodType | $ZodCheck;
  /** If `true`, Zod will continue executing checks/refinements after this issue. */
  readonly continue?: boolean | undefined;
} & Record<string, unknown>> : never;
type $ZodRawIssue<T extends $ZodIssueBase = $ZodIssue> = $ZodInternalIssue<T>;
interface $ZodErrorMap<T extends $ZodIssueBase = $ZodIssue> {
  (issue: $ZodRawIssue<T>): {
    message: string;
  } | string | undefined | null;
}
interface $ZodError<T = unknown> extends Error {
  type: T;
  issues: $ZodIssue[];
  _zod: {
    output: T;
    def: $ZodIssue[];
  };
  stack?: string;
  name: string;
}
declare const $ZodError: $constructor<$ZodError>;
//#endregion
//#region node_modules/zod/v4/core/core.d.cts
type ZodTrait = {
  _zod: {
    def: any;
    [k: string]: any;
  };
};
interface $constructor<T extends ZodTrait, D = T["_zod"]["def"]> {
  new (def: D): T;
  init(inst: T, def: D): asserts inst is T;
}
declare function $constructor<T extends ZodTrait, D = T["_zod"]["def"]>(name: string, initializer: (inst: T, def: D) => void, params?: {
  Parent?: typeof Class;
}): $constructor<T, D>;
declare const $brand: unique symbol;
type $brand<T extends string | number | symbol = string | number | symbol> = {
  [$brand]: { [k in T]: true; };
};
type $ZodBranded<T extends SomeType$1, Brand extends string | number | symbol, Dir extends "in" | "out" | "inout" = "out"> = T & (Dir extends "inout" ? {
  _zod: {
    input: input<T> & $brand<Brand>;
    output: output<T> & $brand<Brand>;
  };
} : Dir extends "in" ? {
  _zod: {
    input: input<T> & $brand<Brand>;
  };
} : {
  _zod: {
    output: output<T> & $brand<Brand>;
  };
});
type input<T> = T extends {
  _zod: {
    input: any;
  };
} ? T["_zod"]["input"] : unknown;
type output<T> = T extends {
  _zod: {
    output: any;
  };
} ? T["_zod"]["output"] : unknown;
//#endregion
//#region node_modules/zod/v4/mini/schemas.d.cts
type SomeType = SomeType$1;
interface ZodMiniType<out Output = unknown, out Input = unknown, out Internals extends $ZodTypeInternals<Output, Input> = $ZodTypeInternals<Output, Input>> extends $ZodType<Output, Input, Internals> {
  type: Internals["def"]["type"];
  check(...checks: (CheckFn<output<this>> | $ZodCheck<output<this>>)[]): this;
  with(...checks: (CheckFn<output<this>> | $ZodCheck<output<this>>)[]): this;
  clone(def?: Internals["def"], params?: {
    parent: boolean;
  }): this;
  register<R extends $ZodRegistry>(registry: R, ...meta: this extends R["_schema"] ? undefined extends R["_meta"] ? [$replace<R["_meta"], this>?] : [$replace<R["_meta"], this>] : ["Incompatible schema"]): this;
  brand<T extends PropertyKey = PropertyKey, Dir extends "in" | "out" | "inout" = "out">(value?: T): PropertyKey extends T ? this : $ZodBranded<this, T, Dir>;
  def: Internals["def"];
  parse(data: unknown, params?: ParseContext<$ZodIssue>): output<this>;
  safeParse(data: unknown, params?: ParseContext<$ZodIssue>): SafeParseResult<output<this>>;
  parseAsync(data: unknown, params?: ParseContext<$ZodIssue>): Promise<output<this>>;
  safeParseAsync(data: unknown, params?: ParseContext<$ZodIssue>): Promise<SafeParseResult<output<this>>>;
  apply<T>(fn: (schema: this) => T): T;
}
interface _ZodMiniType<out Internals extends $ZodTypeInternals = $ZodTypeInternals> extends ZodMiniType<any, any, Internals> {}
declare const ZodMiniType: $constructor<ZodMiniType>;
interface _ZodMiniString<T extends $ZodStringInternals<unknown> = $ZodStringInternals<unknown>> extends _ZodMiniType<T>, $ZodString<T["input"]> {
  _zod: T;
}
interface ZodMiniString<Input = unknown> extends _ZodMiniString<$ZodStringInternals<Input>>, $ZodString<Input> {}
declare const ZodMiniString: $constructor<ZodMiniString>;
interface _ZodMiniNumber<T extends $ZodNumberInternals<unknown> = $ZodNumberInternals<unknown>> extends _ZodMiniType<T>, $ZodNumber<T["input"]> {
  _zod: T;
}
interface ZodMiniNumber<Input = unknown> extends _ZodMiniNumber<$ZodNumberInternals<Input>>, $ZodNumber<Input> {}
declare const ZodMiniNumber: $constructor<ZodMiniNumber>;
interface ZodMiniBoolean<T = unknown> extends _ZodMiniType<$ZodBooleanInternals<T>> {}
declare const ZodMiniBoolean: $constructor<ZodMiniBoolean>;
interface ZodMiniObject<
/** @ts-ignore Cast variance */
out Shape extends $ZodShape = $ZodShape, out Config extends $ZodObjectConfig = $strip> extends ZodMiniType<any, any, $ZodObjectInternals<Shape, Config>>, $ZodObject<Shape, Config> {
  shape: Shape;
}
declare const ZodMiniObject: $constructor<ZodMiniObject>;
interface ZodMiniUnion<T extends readonly SomeType[] = readonly $ZodType[]> extends _ZodMiniType<$ZodUnionInternals<T>> {}
declare const ZodMiniUnion: $constructor<ZodMiniUnion>;
interface ZodMiniLiteral<T extends Literal = Literal> extends _ZodMiniType<$ZodLiteralInternals<T>> {}
declare const ZodMiniLiteral: $constructor<ZodMiniLiteral>;
interface ZodMiniOptional<T extends SomeType = $ZodType> extends _ZodMiniType<$ZodOptionalInternals<T>>, $ZodOptional<T> {}
declare const ZodMiniOptional: $constructor<ZodMiniOptional>;
//#endregion
//#region src/apis/ext_share.d.ts
type ShareItem = {
  type: 'media';
  id: number;
  title: string;
  cover: string;
} | {
  type: 'user';
  id: number;
  nickname: string;
  avatar: string;
} | {
  type: 'app';
  title: string;
  image: string;
};
type ShareParam = {
  path: string;
  item: ShareItem;
  target: ShareTarget;
  from?: string;
};
type ShareObject = {
  title: string;
  path: string;
  query: string;
  imageUrl: string;
};
declare const zShareTarget: ZodMiniUnion<readonly [ZodMiniLiteral<"favorite" | "message" | "timeline">, ZodMiniString<string>]>;
type ShareTarget = output<typeof zShareTarget>;
declare const zShareQuery: ZodMiniObject<{
  media: ZodMiniOptional<ZodMiniNumber<number>>;
  user: ZodMiniOptional<ZodMiniNumber<number>>;
  shareTarget: ZodMiniUnion<readonly [ZodMiniLiteral<"favorite" | "message" | "timeline">, ZodMiniString<string>]>;
  timestamp: ZodMiniNumber<number>;
  shareId: ZodMiniString<string>;
  sourceUser: ZodMiniString<string>;
  sourceMark: ZodMiniString<string>;
  enterOpts: ZodMiniObject<{
    opts: ZodMiniObject<{
      scene: ZodMiniOptional<ZodMiniNumber<number>>;
      chatType: ZodMiniOptional<ZodMiniNumber<number>>;
      groupEncryptedData: ZodMiniOptional<ZodMiniString<string>>;
      groupIv: ZodMiniOptional<ZodMiniString<string>>;
    }, $strip>;
    shareId: ZodMiniOptional<ZodMiniString<string>>;
  }, $strip>;
}, $strip>;
type ShareQuery = output<typeof zShareQuery>;
declare class ExtShare extends BaseApi {
  createShare(param: ShareParam): {
    title: string;
    path: string;
    query: string;
    imageUrl: string;
  };
  parseShareParam(share: string): {
    media?: number | undefined;
    user?: number | undefined;
    shareTarget: string;
    timestamp: number;
    shareId: string;
    sourceUser: string;
    sourceMark: string;
    enterOpts: {
      opts: {
        scene?: number | undefined;
        chatType?: number | undefined;
        groupEncryptedData?: string | undefined;
        groupIv?: string | undefined;
      };
      shareId?: string | undefined;
    };
  } | undefined;
  private generateShareQuery;
  private getShareEnterOpts;
}
//#endregion
//#region src/compatible/random.d.ts
declare function genRandomText(opts?: {
  pool?: string | undefined;
  count?: number | undefined;
}): any;
//#endregion
//#region src/compatible/parse.d.ts
declare const zMedia: ZodMiniObject<{
  id: ZodMiniNumber<number>;
  url: ZodMiniString<string>;
  cover: ZodMiniString<string>;
  title: ZodMiniString<string>;
  ownerId: ZodMiniNumber<number>;
  ownerNickname: ZodMiniOptional<ZodMiniString<string>>;
  ownerAvatar: ZodMiniOptional<ZodMiniString<string>>;
  viewCount: ZodMiniNumber<number>;
  isFavorite: ZodMiniBoolean<boolean>;
}, $strip>;
type TsMedia = output<typeof zMedia>;
declare function parseTsMedia(object: unknown): {
  id: number;
  url: string;
  cover: string;
  title: string;
  ownerId: number;
  ownerNickname?: string | undefined;
  ownerAvatar?: string | undefined;
  viewCount: number;
  isFavorite: boolean;
};
declare function parseTsMediaArray(object: unknown): {
  id: number;
  url: string;
  cover: string;
  title: string;
  ownerId: number;
  ownerNickname?: string | undefined;
  ownerAvatar?: string | undefined;
  viewCount: number;
  isFavorite: boolean;
}[];
//#endregion
//#region src/index.d.ts
declare const Api_base: Class$1<any[], BaseApi & ApiAuth & ApiReportLog & ApiReportSessionCorrupt & ApiMedia & ApiUser & ApiAd & ExtShare, typeof BaseApi & typeof ApiAuth & typeof ApiReportLog & typeof ApiReportSessionCorrupt & typeof ApiMedia & typeof ApiUser & typeof ApiAd & typeof ExtShare>;
declare class Api extends Api_base {
  constructor(appId: number, base: string, network: Network);
  static createFetch(appId: number, base: string): Api;
  static createWx(appId: number, base: string): Api;
}
//#endregion
export { Api, type Article, type TsMedia as Media, type RankName, type ShareItem, type ShareObject, type ShareParam, type ShareQuery, type ShareTarget, BasicUserInfo as UserInfo, genRandomText, parseTsMedia, parseTsMediaArray };
//# sourceMappingURL=index.d.ts.map