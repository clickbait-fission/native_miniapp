//#region node_modules/ts-mixer/dist/types/types.d.ts
/**
 * A rigorous type alias for a class.
 */
type Class<CtorArgs extends any[] = any[], InstanceType = {}, StaticType = {}, IsAbstract = false> = (abstract new (...args: any[]) => InstanceType) & StaticType;
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
declare enum AddRemoveOpType {
  Add = 0,
  Remove = 1,
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
    op: 'add' | 'remove';
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
    op: AddRemoveOpType;
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
type ShareTarget = 'message' | 'timeline' | 'favorite' | string;
type ShareQuery = {
  media?: number;
  user?: number;
  shareTarget: ShareTarget;
  timestamp: number;
  shareId: string;
  sourceUser: string;
  sourceMark: string;
  enterOpts: Omit<OpenApp, 'path'> & {
    shareId?: string | undefined;
  };
};
declare class ExtShare extends BaseApi {
  createShare(param: ShareParam): {
    title: string;
    path: string;
    query: string;
    imageUrl: string;
  };
  parseShareParam(share: string): ShareQuery | undefined;
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
//#region src/index.d.ts
declare const Api_base: Class<any[], BaseApi & ApiAuth & ApiReportLog & ApiReportSessionCorrupt & ApiMedia & ApiUser & ApiAd & ExtShare, typeof BaseApi & typeof ApiAuth & typeof ApiReportLog & typeof ApiReportSessionCorrupt & typeof ApiMedia & typeof ApiUser & typeof ApiAd & typeof ExtShare>;
declare class Api extends Api_base {
  constructor(appId: number, base: string, network: Network);
  static createFetch(appId: number, base: string): Api;
  static createWx(appId: number, base: string): Api;
}
//#endregion
export { Api, Article, MediaAsset as Media, type RankName, type ShareItem, type ShareObject, type ShareParam, type ShareTarget, genRandomText };
//# sourceMappingURL=index.d.ts.map