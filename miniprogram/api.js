//#region \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
//#endregion
//#region src/networks/fetch_implementation.ts
var FetchNetwork = class {
	async invokeHttp({ method, uri, headers = {}, requestBody }) {
		const response = await fetch(uri, {
			method,
			headers: new Headers(headers),
			body: requestBody == null ? null : new ReadableStream({ start(controller) {
				controller.enqueue(requestBody);
				controller.close();
			} })
		});
		const responseHeaders = {};
		response.headers.forEach((value, key) => {
			responseHeaders[key] = value;
		});
		return {
			status: response.status,
			headers: responseHeaders,
			body: await response.bytes()
		};
	}
};
//#endregion
//#region src/networks/wx_implementation.ts
var WxNetwork = class {
	invokeHttp({ method, uri, headers = {}, requestBody }) {
		const buf = requestBody?.buffer;
		return new Promise((resolve, reject) => {
			const opts = {
				url: uri,
				method,
				header: headers,
				responseType: "arraybuffer",
				timeout: 5e3,
				success: (res) => {
					resolve({
						status: res.statusCode,
						headers: res.header,
						body: new Uint8Array(res.data)
					});
				},
				fail: (err) => {
					reject(err);
				}
			};
			if (buf != null) opts.data = buf;
			wx.request(opts);
		});
	}
};
//#endregion
//#region node_modules/ts-mixer/dist/cjs/util.js
var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.flatten = exports.unique = exports.hardMixProtos = exports.nearestCommonProto = exports.protoChain = exports.copyProps = void 0;
	/**
	* Utility function that works like `Object.apply`, but copies getters and setters properly as well.  Additionally gives
	* the option to exclude properties by name.
	*/
	const copyProps = (dest, src, exclude = []) => {
		const props = Object.getOwnPropertyDescriptors(src);
		for (let prop of exclude) delete props[prop];
		Object.defineProperties(dest, props);
	};
	exports.copyProps = copyProps;
	/**
	* Returns the full chain of prototypes up until Object.prototype given a starting object.  The order of prototypes will
	* be closest to farthest in the chain.
	*/
	const protoChain = (obj, currentChain = [obj]) => {
		const proto = Object.getPrototypeOf(obj);
		if (proto === null) return currentChain;
		return (0, exports.protoChain)(proto, [...currentChain, proto]);
	};
	exports.protoChain = protoChain;
	/**
	* Identifies the nearest ancestor common to all the given objects in their prototype chains.  For most unrelated
	* objects, this function should return Object.prototype.
	*/
	const nearestCommonProto = (...objs) => {
		if (objs.length === 0) return void 0;
		let commonProto = void 0;
		const protoChains = objs.map((obj) => (0, exports.protoChain)(obj));
		while (protoChains.every((protoChain) => protoChain.length > 0)) {
			const protos = protoChains.map((protoChain) => protoChain.pop());
			const potentialCommonProto = protos[0];
			if (protos.every((proto) => proto === potentialCommonProto)) commonProto = potentialCommonProto;
			else break;
		}
		return commonProto;
	};
	exports.nearestCommonProto = nearestCommonProto;
	/**
	* Creates a new prototype object that is a mixture of the given prototypes.  The mixing is achieved by first
	* identifying the nearest common ancestor and using it as the prototype for a new object.  Then all properties/methods
	* downstream of this prototype (ONLY downstream) are copied into the new object.
	*
	* The resulting prototype is more performant than softMixProtos(...), as well as ES5 compatible.  However, it's not as
	* flexible as updates to the source prototypes aren't captured by the mixed result.  See softMixProtos for why you may
	* want to use that instead.
	*/
	const hardMixProtos = (ingredients, constructor, exclude = []) => {
		var _a;
		const base = (_a = (0, exports.nearestCommonProto)(...ingredients)) !== null && _a !== void 0 ? _a : Object.prototype;
		const mixedProto = Object.create(base);
		const visitedProtos = (0, exports.protoChain)(base);
		for (let prototype of ingredients) {
			let protos = (0, exports.protoChain)(prototype);
			for (let i = protos.length - 1; i >= 0; i--) {
				let newProto = protos[i];
				if (visitedProtos.indexOf(newProto) === -1) {
					(0, exports.copyProps)(mixedProto, newProto, ["constructor", ...exclude]);
					visitedProtos.push(newProto);
				}
			}
		}
		mixedProto.constructor = constructor;
		return mixedProto;
	};
	exports.hardMixProtos = hardMixProtos;
	const unique = (arr) => arr.filter((e, i) => arr.indexOf(e) == i);
	exports.unique = unique;
	const flatten = (arr) => arr.length === 0 ? [] : arr.length === 1 ? arr[0] : arr.reduce((a1, a2) => [...a1, ...a2]);
	exports.flatten = flatten;
}));
//#endregion
//#region node_modules/ts-mixer/dist/cjs/proxy.js
var require_proxy = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.softMixProtos = exports.proxyMix = exports.getIngredientWithProp = void 0;
	const util_1 = require_util();
	/**
	* Finds the ingredient with the given prop, searching in reverse order and breadth-first if searching ingredient
	* prototypes is required.
	*/
	const getIngredientWithProp = (prop, ingredients) => {
		const protoChains = ingredients.map((ingredient) => (0, util_1.protoChain)(ingredient));
		let protoDepth = 0;
		let protosAreLeftToSearch = true;
		while (protosAreLeftToSearch) {
			protosAreLeftToSearch = false;
			for (let i = ingredients.length - 1; i >= 0; i--) {
				const searchTarget = protoChains[i][protoDepth];
				if (searchTarget !== void 0 && searchTarget !== null) {
					protosAreLeftToSearch = true;
					if (Object.getOwnPropertyDescriptor(searchTarget, prop) != void 0) return protoChains[i][0];
				}
			}
			protoDepth++;
		}
	};
	exports.getIngredientWithProp = getIngredientWithProp;
	/**
	* "Mixes" ingredients by wrapping them in a Proxy.  The optional prototype argument allows the mixed object to sit
	* downstream of an existing prototype chain.  Note that "properties" cannot be added, deleted, or modified.
	*/
	const proxyMix = (ingredients, prototype = Object.prototype) => new Proxy({}, {
		getPrototypeOf() {
			return prototype;
		},
		setPrototypeOf() {
			throw Error("Cannot set prototype of Proxies created by ts-mixer");
		},
		getOwnPropertyDescriptor(_, prop) {
			return Object.getOwnPropertyDescriptor((0, exports.getIngredientWithProp)(prop, ingredients) || {}, prop);
		},
		defineProperty() {
			throw new Error("Cannot define new properties on Proxies created by ts-mixer");
		},
		has(_, prop) {
			return (0, exports.getIngredientWithProp)(prop, ingredients) !== void 0 || prototype[prop] !== void 0;
		},
		get(_, prop) {
			return ((0, exports.getIngredientWithProp)(prop, ingredients) || prototype)[prop];
		},
		set(_, prop, val) {
			const ingredientWithProp = (0, exports.getIngredientWithProp)(prop, ingredients);
			if (ingredientWithProp === void 0) throw new Error("Cannot set new properties on Proxies created by ts-mixer");
			ingredientWithProp[prop] = val;
			return true;
		},
		deleteProperty() {
			throw new Error("Cannot delete properties on Proxies created by ts-mixer");
		},
		ownKeys() {
			return ingredients.map(Object.getOwnPropertyNames).reduce((prev, curr) => curr.concat(prev.filter((key) => curr.indexOf(key) < 0)));
		}
	});
	exports.proxyMix = proxyMix;
	/**
	* Creates a new proxy-prototype object that is a "soft" mixture of the given prototypes.  The mixing is achieved by
	* proxying all property access to the ingredients.  This is not ES5 compatible and less performant.  However, any
	* changes made to the source prototypes will be reflected in the proxy-prototype, which may be desirable.
	*/
	const softMixProtos = (ingredients, constructor) => (0, exports.proxyMix)([...ingredients, { constructor }]);
	exports.softMixProtos = softMixProtos;
}));
//#endregion
//#region node_modules/ts-mixer/dist/cjs/settings.js
var require_settings = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.settings = void 0;
	exports.settings = {
		initFunction: null,
		staticsStrategy: "copy",
		prototypeStrategy: "copy",
		decoratorInheritance: "deep"
	};
}));
//#endregion
//#region node_modules/ts-mixer/dist/cjs/mixin-tracking.js
var require_mixin_tracking = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.hasMixin = exports.registerMixins = exports.getMixinsForClass = void 0;
	const util_1 = require_util();
	const mixins = /* @__PURE__ */ new WeakMap();
	const getMixinsForClass = (clazz) => mixins.get(clazz);
	exports.getMixinsForClass = getMixinsForClass;
	const registerMixins = (mixedClass, constituents) => mixins.set(mixedClass, constituents);
	exports.registerMixins = registerMixins;
	const hasMixin = (instance, mixin) => {
		if (instance instanceof mixin) return true;
		const constructor = instance.constructor;
		const visited = /* @__PURE__ */ new Set();
		let frontier = /* @__PURE__ */ new Set();
		frontier.add(constructor);
		while (frontier.size > 0) {
			if (frontier.has(mixin)) return true;
			frontier.forEach((item) => visited.add(item));
			const newFrontier = /* @__PURE__ */ new Set();
			frontier.forEach((item) => {
				var _a;
				const itemConstituents = (_a = mixins.get(item)) !== null && _a !== void 0 ? _a : (0, util_1.protoChain)(item.prototype).map((proto) => proto.constructor).filter((item) => item !== null);
				if (itemConstituents) itemConstituents.forEach((constituent) => {
					if (!visited.has(constituent) && !frontier.has(constituent)) newFrontier.add(constituent);
				});
			});
			frontier = newFrontier;
		}
		return false;
	};
	exports.hasMixin = hasMixin;
}));
//#endregion
//#region node_modules/ts-mixer/dist/cjs/decorator.js
var require_decorator = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.decorate = exports.getDecoratorsForClass = exports.directDecoratorSearch = exports.deepDecoratorSearch = void 0;
	const util_1 = require_util();
	const mixin_tracking_1 = require_mixin_tracking();
	const mergeObjectsOfDecorators = (o1, o2) => {
		var _a, _b;
		const allKeys = (0, util_1.unique)([...Object.getOwnPropertyNames(o1), ...Object.getOwnPropertyNames(o2)]);
		const mergedObject = {};
		for (let key of allKeys) mergedObject[key] = (0, util_1.unique)([...(_a = o1 === null || o1 === void 0 ? void 0 : o1[key]) !== null && _a !== void 0 ? _a : [], ...(_b = o2 === null || o2 === void 0 ? void 0 : o2[key]) !== null && _b !== void 0 ? _b : []]);
		return mergedObject;
	};
	const mergePropertyAndMethodDecorators = (d1, d2) => {
		var _a, _b, _c, _d;
		return {
			property: mergeObjectsOfDecorators((_a = d1 === null || d1 === void 0 ? void 0 : d1.property) !== null && _a !== void 0 ? _a : {}, (_b = d2 === null || d2 === void 0 ? void 0 : d2.property) !== null && _b !== void 0 ? _b : {}),
			method: mergeObjectsOfDecorators((_c = d1 === null || d1 === void 0 ? void 0 : d1.method) !== null && _c !== void 0 ? _c : {}, (_d = d2 === null || d2 === void 0 ? void 0 : d2.method) !== null && _d !== void 0 ? _d : {})
		};
	};
	const mergeDecorators = (d1, d2) => {
		var _a, _b, _c, _d, _e, _f;
		return {
			class: (0, util_1.unique)([...(_a = d1 === null || d1 === void 0 ? void 0 : d1.class) !== null && _a !== void 0 ? _a : [], ...(_b = d2 === null || d2 === void 0 ? void 0 : d2.class) !== null && _b !== void 0 ? _b : []]),
			static: mergePropertyAndMethodDecorators((_c = d1 === null || d1 === void 0 ? void 0 : d1.static) !== null && _c !== void 0 ? _c : {}, (_d = d2 === null || d2 === void 0 ? void 0 : d2.static) !== null && _d !== void 0 ? _d : {}),
			instance: mergePropertyAndMethodDecorators((_e = d1 === null || d1 === void 0 ? void 0 : d1.instance) !== null && _e !== void 0 ? _e : {}, (_f = d2 === null || d2 === void 0 ? void 0 : d2.instance) !== null && _f !== void 0 ? _f : {})
		};
	};
	const decorators = /* @__PURE__ */ new Map();
	const findAllConstituentClasses = (...classes) => {
		var _a;
		const allClasses = /* @__PURE__ */ new Set();
		const frontier = /* @__PURE__ */ new Set([...classes]);
		while (frontier.size > 0) for (let clazz of frontier) {
			const protoChainClasses = (0, util_1.protoChain)(clazz.prototype).map((proto) => proto.constructor);
			const mixinClasses = (_a = (0, mixin_tracking_1.getMixinsForClass)(clazz)) !== null && _a !== void 0 ? _a : [];
			const newClasses = [...protoChainClasses, ...mixinClasses].filter((c) => !allClasses.has(c));
			for (let newClass of newClasses) frontier.add(newClass);
			allClasses.add(clazz);
			frontier.delete(clazz);
		}
		return [...allClasses];
	};
	const deepDecoratorSearch = (...classes) => {
		const decoratorsForClassChain = findAllConstituentClasses(...classes).map((clazz) => decorators.get(clazz)).filter((decorators) => !!decorators);
		if (decoratorsForClassChain.length == 0) return {};
		if (decoratorsForClassChain.length == 1) return decoratorsForClassChain[0];
		return decoratorsForClassChain.reduce((d1, d2) => mergeDecorators(d1, d2));
	};
	exports.deepDecoratorSearch = deepDecoratorSearch;
	const directDecoratorSearch = (...classes) => {
		const classDecorators = classes.map((clazz) => (0, exports.getDecoratorsForClass)(clazz));
		if (classDecorators.length === 0) return {};
		if (classDecorators.length === 1) return classDecorators[0];
		return classDecorators.reduce((d1, d2) => mergeDecorators(d1, d2));
	};
	exports.directDecoratorSearch = directDecoratorSearch;
	const getDecoratorsForClass = (clazz) => {
		let decoratorsForClass = decorators.get(clazz);
		if (!decoratorsForClass) {
			decoratorsForClass = {};
			decorators.set(clazz, decoratorsForClass);
		}
		return decoratorsForClass;
	};
	exports.getDecoratorsForClass = getDecoratorsForClass;
	const decorateClass = (decorator) => ((clazz) => {
		const decoratorsForClass = (0, exports.getDecoratorsForClass)(clazz);
		let classDecorators = decoratorsForClass.class;
		if (!classDecorators) {
			classDecorators = [];
			decoratorsForClass.class = classDecorators;
		}
		classDecorators.push(decorator);
		return decorator(clazz);
	});
	const decorateMember = (decorator) => ((object, key, ...otherArgs) => {
		var _a, _b, _c;
		const decoratorTargetType = typeof object === "function" ? "static" : "instance";
		const decoratorType = typeof object[key] === "function" ? "method" : "property";
		const clazz = decoratorTargetType === "static" ? object : object.constructor;
		const decoratorsForClass = (0, exports.getDecoratorsForClass)(clazz);
		const decoratorsForTargetType = (_a = decoratorsForClass === null || decoratorsForClass === void 0 ? void 0 : decoratorsForClass[decoratorTargetType]) !== null && _a !== void 0 ? _a : {};
		decoratorsForClass[decoratorTargetType] = decoratorsForTargetType;
		let decoratorsForType = (_b = decoratorsForTargetType === null || decoratorsForTargetType === void 0 ? void 0 : decoratorsForTargetType[decoratorType]) !== null && _b !== void 0 ? _b : {};
		decoratorsForTargetType[decoratorType] = decoratorsForType;
		let decoratorsForKey = (_c = decoratorsForType === null || decoratorsForType === void 0 ? void 0 : decoratorsForType[key]) !== null && _c !== void 0 ? _c : [];
		decoratorsForType[key] = decoratorsForKey;
		decoratorsForKey.push(decorator);
		return decorator(object, key, ...otherArgs);
	});
	const decorate = (decorator) => ((...args) => {
		if (args.length === 1) return decorateClass(decorator)(args[0]);
		return decorateMember(decorator)(...args);
	});
	exports.decorate = decorate;
}));
//#endregion
//#region node_modules/ts-mixer/dist/cjs/mixins.js
var require_mixins = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.mix = exports.Mixin = void 0;
	const proxy_1 = require_proxy();
	const settings_1 = require_settings();
	const util_1 = require_util();
	const decorator_1 = require_decorator();
	const mixin_tracking_1 = require_mixin_tracking();
	function Mixin(...constructors) {
		var _a, _b, _c;
		const prototypes = constructors.map((constructor) => constructor.prototype);
		const initFunctionName = settings_1.settings.initFunction;
		if (initFunctionName !== null) {
			const initFunctions = prototypes.map((proto) => proto[initFunctionName]).filter((func) => typeof func === "function");
			const combinedInitFunction = function(...args) {
				for (let initFunction of initFunctions) initFunction.apply(this, args);
			};
			const extraProto = { [initFunctionName]: combinedInitFunction };
			prototypes.push(extraProto);
		}
		function MixedClass(...args) {
			for (const constructor of constructors) (0, util_1.copyProps)(this, new constructor(...args));
			if (initFunctionName !== null && typeof this[initFunctionName] === "function") this[initFunctionName].apply(this, args);
		}
		MixedClass.prototype = settings_1.settings.prototypeStrategy === "copy" ? (0, util_1.hardMixProtos)(prototypes, MixedClass) : (0, proxy_1.softMixProtos)(prototypes, MixedClass);
		Object.setPrototypeOf(MixedClass, settings_1.settings.staticsStrategy === "copy" ? (0, util_1.hardMixProtos)(constructors, null, ["prototype"]) : (0, proxy_1.proxyMix)(constructors, Function.prototype));
		let DecoratedMixedClass = MixedClass;
		if (settings_1.settings.decoratorInheritance !== "none") {
			const classDecorators = settings_1.settings.decoratorInheritance === "deep" ? (0, decorator_1.deepDecoratorSearch)(...constructors) : (0, decorator_1.directDecoratorSearch)(...constructors);
			for (let decorator of (_a = classDecorators === null || classDecorators === void 0 ? void 0 : classDecorators.class) !== null && _a !== void 0 ? _a : []) {
				const result = decorator(DecoratedMixedClass);
				if (result) DecoratedMixedClass = result;
			}
			applyPropAndMethodDecorators((_b = classDecorators === null || classDecorators === void 0 ? void 0 : classDecorators.static) !== null && _b !== void 0 ? _b : {}, DecoratedMixedClass);
			applyPropAndMethodDecorators((_c = classDecorators === null || classDecorators === void 0 ? void 0 : classDecorators.instance) !== null && _c !== void 0 ? _c : {}, DecoratedMixedClass.prototype);
		}
		(0, mixin_tracking_1.registerMixins)(DecoratedMixedClass, constructors);
		return DecoratedMixedClass;
	}
	exports.Mixin = Mixin;
	const applyPropAndMethodDecorators = (propAndMethodDecorators, target) => {
		const propDecorators = propAndMethodDecorators.property;
		const methodDecorators = propAndMethodDecorators.method;
		if (propDecorators) for (let key in propDecorators) for (let decorator of propDecorators[key]) decorator(target, key);
		if (methodDecorators) for (let key in methodDecorators) for (let decorator of methodDecorators[key]) decorator(target, key, Object.getOwnPropertyDescriptor(target, key));
	};
	/**
	* A decorator version of the `Mixin` function.  You'll want to use this instead of `Mixin` for mixing generic classes.
	*/
	const mix = (...ingredients) => (decoratedClass) => {
		const mixedClass = Mixin(...ingredients.concat([decoratedClass]));
		Object.defineProperty(mixedClass, "name", {
			value: decoratedClass.name,
			writable: false
		});
		return mixedClass;
	};
	exports.mix = mix;
}));
//#endregion
//#region node_modules/ts-mixer/dist/cjs/index.js
var require_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.hasMixin = exports.decorate = exports.settings = exports.mix = exports.Mixin = void 0;
	var mixins_1 = require_mixins();
	Object.defineProperty(exports, "Mixin", {
		enumerable: true,
		get: function() {
			return mixins_1.Mixin;
		}
	});
	Object.defineProperty(exports, "mix", {
		enumerable: true,
		get: function() {
			return mixins_1.mix;
		}
	});
	var settings_1 = require_settings();
	Object.defineProperty(exports, "settings", {
		enumerable: true,
		get: function() {
			return settings_1.settings;
		}
	});
	var decorator_1 = require_decorator();
	Object.defineProperty(exports, "decorate", {
		enumerable: true,
		get: function() {
			return decorator_1.decorate;
		}
	});
	var mixin_tracking_1 = require_mixin_tracking();
	Object.defineProperty(exports, "hasMixin", {
		enumerable: true,
		get: function() {
			return mixin_tracking_1.hasMixin;
		}
	});
}));
//#endregion
//#region node_modules/@bufbuild/protobuf/dist/esm/wire/varint.js
/**
* Read a 64 bit varint as two JS numbers.
*
* Stores the low and high words on the reader.
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/buffer_decoder.js#L175
*/
function varint64read() {
	const buf = this.buf;
	let pos = this.pos;
	let lo = 0;
	let hi = 0;
	for (let shift = 0; shift < 28; shift += 7) {
		const b = buf[pos++];
		lo |= (b & 127) << shift;
		if ((b & 128) == 0) {
			this.pos = pos;
			this.assertBounds();
			this.varint64Lo = lo;
			this.varint64Hi = hi;
			return;
		}
	}
	const middleByte = buf[pos++];
	lo |= (middleByte & 15) << 28;
	hi = (middleByte & 112) >> 4;
	if ((middleByte & 128) == 0) {
		this.pos = pos;
		this.assertBounds();
		this.varint64Lo = lo;
		this.varint64Hi = hi;
		return;
	}
	for (let shift = 3; shift <= 31; shift += 7) {
		const b = buf[pos++];
		hi |= (b & 127) << shift;
		if ((b & 128) == 0) {
			this.pos = pos;
			this.assertBounds();
			this.varint64Lo = lo;
			this.varint64Hi = hi;
			return;
		}
	}
	throw new Error("invalid varint");
}
const TWO_PWR_32_DBL = 4294967296;
/**
* Parse decimal string of 64 bit integer value as two JS numbers.
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf-javascript/blob/a428c58273abad07c66071d9753bc4d1289de426/experimental/runtime/int64.js#L10
*/
function int64FromString(dec) {
	const minus = dec[0] === "-";
	if (minus) dec = dec.slice(1);
	const base = 1e6;
	let lowBits = 0;
	let highBits = 0;
	function add1e6digit(begin, end) {
		const digit1e6 = Number(dec.slice(begin, end));
		highBits *= base;
		lowBits = lowBits * base + digit1e6;
		if (lowBits >= TWO_PWR_32_DBL) {
			highBits = highBits + (lowBits / TWO_PWR_32_DBL | 0);
			lowBits = lowBits % TWO_PWR_32_DBL;
		}
	}
	add1e6digit(-24, -18);
	add1e6digit(-18, -12);
	add1e6digit(-12, -6);
	add1e6digit(-6);
	return minus ? negate(lowBits, highBits) : newBits(lowBits, highBits);
}
/**
* Losslessly converts a 64-bit signed integer in 32:32 split representation
* into a decimal string.
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf-javascript/blob/a428c58273abad07c66071d9753bc4d1289de426/experimental/runtime/int64.js#L10
*/
function int64ToString(lo, hi) {
	let bits = newBits(lo, hi);
	const negative = bits.hi & 2147483648;
	if (negative) bits = negate(bits.lo, bits.hi);
	const result = uInt64ToString(bits.lo, bits.hi);
	return negative ? "-" + result : result;
}
/**
* Losslessly converts a 64-bit unsigned integer in 32:32 split representation
* into a decimal string.
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf-javascript/blob/a428c58273abad07c66071d9753bc4d1289de426/experimental/runtime/int64.js#L10
*/
function uInt64ToString(lo, hi) {
	({lo, hi} = toUnsigned(lo, hi));
	if (hi <= 2097151) return String(TWO_PWR_32_DBL * hi + lo);
	const low = lo & 16777215;
	const mid = (lo >>> 24 | hi << 8) & 16777215;
	const high = hi >> 16 & 65535;
	let digitA = low + mid * 6777216 + high * 6710656;
	let digitB = mid + high * 8147497;
	let digitC = high * 2;
	const base = 1e7;
	if (digitA >= base) {
		digitB += Math.floor(digitA / base);
		digitA %= base;
	}
	if (digitB >= base) {
		digitC += Math.floor(digitB / base);
		digitB %= base;
	}
	return digitC.toString() + decimalFrom1e7WithLeadingZeros(digitB) + decimalFrom1e7WithLeadingZeros(digitA);
}
function toUnsigned(lo, hi) {
	return {
		lo: lo >>> 0,
		hi: hi >>> 0
	};
}
function newBits(lo, hi) {
	return {
		lo: lo | 0,
		hi: hi | 0
	};
}
/**
* Returns two's compliment negation of input.
* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Signed_32-bit_integers
*/
function negate(lowBits, highBits) {
	highBits = ~highBits;
	if (lowBits) lowBits = ~lowBits + 1;
	else highBits += 1;
	return newBits(lowBits, highBits);
}
/**
* Returns decimal representation of digit1e7 with leading zeros.
*/
const decimalFrom1e7WithLeadingZeros = (digit1e7) => {
	const partial = String(digit1e7);
	return "0000000".slice(partial.length) + partial;
};
/**
* Read an unsigned 32 bit varint.
*
* See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/buffer_decoder.js#L220
*/
function varint32read() {
	let b = this.buf[this.pos++];
	if ((b & 128) === 0) {
		this.assertBounds();
		return b;
	}
	let result = b & 127;
	b = this.buf[this.pos++];
	result |= (b & 127) << 7;
	if ((b & 128) === 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 127) << 14;
	if ((b & 128) === 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 127) << 21;
	if ((b & 128) === 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 15) << 28;
	for (let readBytes = 5; (b & 128) !== 0 && readBytes < 10; readBytes++) b = this.buf[this.pos++];
	if ((b & 128) !== 0) throw new Error("invalid varint");
	this.assertBounds();
	return result >>> 0;
}
//#endregion
//#region node_modules/@bufbuild/protobuf/dist/esm/proto-int64.js
/**
* Int64Support for the current environment.
*/
const protoInt64 = /*@__PURE__*/ makeInt64Support();
function makeInt64Support() {
	const dv = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
	if (typeof BigInt === "function" && typeof dv.getBigInt64 === "function" && typeof dv.getBigUint64 === "function" && typeof dv.setBigInt64 === "function" && typeof dv.setBigUint64 === "function" && (!!globalThis.Deno || !!globalThis.Bun || typeof process != "object" || typeof process.env != "object" || process.env.BUF_BIGINT_DISABLE !== "1")) {
		const MIN = BigInt("-9223372036854775808");
		const MAX = BigInt("9223372036854775807");
		const UMIN = BigInt("0");
		const UMAX = BigInt("18446744073709551615");
		return {
			zero: BigInt(0),
			supported: true,
			parse(value) {
				const bi = typeof value == "bigint" ? value : BigInt(value);
				if (bi > MAX || bi < MIN) throw new Error(`invalid int64: ${value}`);
				return bi;
			},
			uParse(value) {
				const bi = typeof value == "bigint" ? value : BigInt(value);
				if (bi > UMAX || bi < UMIN) throw new Error(`invalid uint64: ${value}`);
				return bi;
			},
			enc(value) {
				dv.setBigInt64(0, this.parse(value), true);
				return {
					lo: dv.getInt32(0, true),
					hi: dv.getInt32(4, true)
				};
			},
			uEnc(value) {
				dv.setBigInt64(0, this.uParse(value), true);
				return {
					lo: dv.getInt32(0, true),
					hi: dv.getInt32(4, true)
				};
			},
			dec(lo, hi) {
				dv.setInt32(0, lo, true);
				dv.setInt32(4, hi, true);
				return dv.getBigInt64(0, true);
			},
			uDec(lo, hi) {
				dv.setInt32(0, lo, true);
				dv.setInt32(4, hi, true);
				return dv.getBigUint64(0, true);
			}
		};
	}
	return {
		zero: "0",
		supported: false,
		parse(value) {
			if (typeof value != "string") value = value.toString();
			assertInt64String(value);
			return value;
		},
		uParse(value) {
			if (typeof value != "string") value = value.toString();
			assertUInt64String(value);
			return value;
		},
		enc(value) {
			if (typeof value != "string") value = value.toString();
			assertInt64String(value);
			return int64FromString(value);
		},
		uEnc(value) {
			if (typeof value != "string") value = value.toString();
			assertUInt64String(value);
			return int64FromString(value);
		},
		dec(lo, hi) {
			return int64ToString(lo, hi);
		},
		uDec(lo, hi) {
			return uInt64ToString(lo, hi);
		}
	};
}
function assertInt64String(value) {
	if (!/^-?[0-9]+$/.test(value)) throw new Error("invalid int64: " + value);
}
function assertUInt64String(value) {
	if (!/^[0-9]+$/.test(value)) throw new Error("invalid uint64: " + value);
}
//#endregion
//#region node_modules/@bufbuild/protobuf/dist/esm/wire/text-encoding.js
const symbol = Symbol.for("@bufbuild/protobuf/text-encoding");
/**
* Protobuf-ES requires the Text Encoding API to convert UTF-8 from and to
* binary. This WHATWG API is widely available, but it is not part of the
* ECMAScript standard. On runtimes where it is not available, use this
* function to provide your own implementation.
*
* Providing `encodeUtf8Into` is optional for backwards compatibility. If it
* is omitted, we emulate it with a wrapper that calls `encodeUtf8`.
*
* Note that the Text Encoding API does not provide a way to validate UTF-8.
* Our implementation uses String.prototype.isWellFormed, and falls back
* to use encodeURIComponent().
*/
function configureTextEncoding(textEncoding) {
	var _a;
	globalThis[symbol] = Object.assign(Object.assign({}, textEncoding), { encodeUtf8Into: (_a = textEncoding.encodeUtf8Into) !== null && _a !== void 0 ? _a : emulateEncodeInto(textEncoding.encodeUtf8.bind(textEncoding)) });
}
function getTextEncoding() {
	const globals = globalThis;
	if (!globals[symbol]) {
		const textEncoder = new globals.TextEncoder();
		const textDecoder = new globals.TextDecoder();
		let textDecoderStrict;
		const config = {
			encodeUtf8(text) {
				return textEncoder.encode(text);
			},
			decodeUtf8(bytes, strict) {
				if (strict) {
					if (!textDecoderStrict) textDecoderStrict = new globals.TextDecoder("utf-8", { fatal: true });
					return textDecoderStrict.decode(bytes);
				}
				return textDecoder.decode(bytes);
			},
			checkUtf8(text) {
				try {
					return true;
				} catch (_) {
					return false;
				}
			}
		};
		if (textEncoder.encodeInto) config.encodeUtf8Into = textEncoder.encodeInto.bind(textEncoder);
		const nativeStringIsWellFormed = String.prototype.isWellFormed;
		if (nativeStringIsWellFormed) config.checkUtf8 = (text) => {
			return nativeStringIsWellFormed.call(text);
		};
		configureTextEncoding(config);
	}
	return globals[symbol];
}
/**
* Simplistic polyfill for encodeUtf8Into.
*
* @private
*/
function emulateEncodeInto(encodeUtf8) {
	return (text, dest) => {
		const bytes = encodeUtf8(text);
		dest.set(bytes);
		return { written: bytes.byteLength };
	};
}
//#endregion
//#region node_modules/@bufbuild/protobuf/dist/esm/wire/binary-encoding.js
/**
* Protobuf binary format wire types.
*
* A wire type provides just enough information to find the length of the
* following value.
*
* See https://developers.google.com/protocol-buffers/docs/encoding#structure
*/
var WireType;
(function(WireType) {
	/**
	* Used for int32, int64, uint32, uint64, sint32, sint64, bool, enum
	*/
	WireType[WireType["Varint"] = 0] = "Varint";
	/**
	* Used for fixed64, sfixed64, double.
	* Always 8 bytes with little-endian byte order.
	*/
	WireType[WireType["Bit64"] = 1] = "Bit64";
	/**
	* Used for string, bytes, embedded messages, packed repeated fields
	*
	* Only repeated numeric types (types which use the varint, 32-bit,
	* or 64-bit wire types) can be packed. In proto3, such fields are
	* packed by default.
	*/
	WireType[WireType["LengthDelimited"] = 2] = "LengthDelimited";
	/**
	* Start of a tag-delimited aggregate, such as a proto2 group, or a message
	* in editions with message_encoding = DELIMITED.
	*/
	WireType[WireType["StartGroup"] = 3] = "StartGroup";
	/**
	* End of a tag-delimited aggregate.
	*/
	WireType[WireType["EndGroup"] = 4] = "EndGroup";
	/**
	* Used for fixed32, sfixed32, float.
	* Always 4 bytes with little-endian byte order.
	*/
	WireType[WireType["Bit32"] = 5] = "Bit32";
})(WireType || (WireType = {}));
var BinaryWriter = class {
	constructor(encodeUtf8) {
		/**
		* Previous fork positions (the write position at the time
		* `fork()` was called).
		*/
		this.stackPos = [];
		this.encodeUtf8Into = encodeUtf8 ? emulateEncodeInto(encodeUtf8) : getTextEncoding().encodeUtf8Into;
		this.buffer = EMPTY_BUFFER;
		this.viewCache = EMPTY_VIEW;
		this.pos = 0;
	}
	ensureCapacity(size) {
		const required = this.pos + size;
		if (required > this.buffer.length) {
			let newLen = this.buffer.length || INITIAL_SIZE;
			while (newLen < required) newLen *= 2;
			const newBuf = new Uint8Array(newLen);
			if (this.pos > 0) newBuf.set(this.buffer);
			this.buffer = newBuf;
		}
	}
	/**
	* The DataView over `buffer`, rebuilt only if the buffer has grown since it
	* was last used.
	*/
	view() {
		const bytes = this.buffer;
		const view = this.viewCache;
		if (view.byteLength === bytes.byteLength) return view;
		const newView = new DataView(bytes.buffer);
		this.viewCache = newView;
		return newView;
	}
	/**
	* Return all bytes written and reset this writer.
	*/
	finish() {
		const result = this.buffer.slice(0, this.pos);
		this.pos = 0;
		this.stackPos = [];
		return result;
	}
	/**
	* Start a new fork for length-delimited data like a message
	* or a packed repeated field.
	*
	* Must be joined later with `join()`.
	*/
	fork() {
		this.stackPos.push(this.pos);
		this.ensureCapacity(DEFAULT_LEN_PREFIX_SIZE);
		this.buffer[this.pos++] = 0;
		return this;
	}
	/**
	* Join the last fork. Write its length and bytes, then
	* return to the previous state.
	*/
	join() {
		const forkPos = this.stackPos.pop();
		if (forkPos === void 0) throw new Error("invalid state, fork stack empty");
		const len = this.pos - forkPos - DEFAULT_LEN_PREFIX_SIZE;
		const lenPrefixSize = varint32Size(len);
		if (lenPrefixSize > DEFAULT_LEN_PREFIX_SIZE) {
			this.ensureCapacity(lenPrefixSize - DEFAULT_LEN_PREFIX_SIZE);
			this.buffer.copyWithin(forkPos + lenPrefixSize, forkPos + DEFAULT_LEN_PREFIX_SIZE, this.pos);
		}
		this.pos = forkPos;
		this.uint32(len);
		this.pos += len;
		return this;
	}
	/**
	* Writes a tag (field number and wire type).
	*
	* Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
	*
	* Generated code should compute the tag ahead of time and call `uint32()`.
	*/
	tag(fieldNo, type) {
		return this.uint32((fieldNo << 3 | type) >>> 0);
	}
	/**
	* Write a chunk of raw bytes.
	*/
	raw(chunk) {
		this.ensureCapacity(chunk.length);
		this.buffer.set(chunk, this.pos);
		this.pos += chunk.length;
		return this;
	}
	/**
	* Write a `uint32` value, an unsigned 32 bit varint.
	*/
	uint32(value) {
		assertUInt32(value);
		this.ensureCapacity(5);
		if (value < 128) {
			this.buffer[this.pos++] = value;
			return this;
		}
		while (value > 127) {
			this.buffer[this.pos++] = value & 127 | 128;
			value >>>= 7;
		}
		this.buffer[this.pos++] = value;
		return this;
	}
	/**
	* Write a `int32` value, a signed 32 bit varint.
	*/
	int32(value) {
		assertInt32(value);
		if (value >= 0) return this.uint32(value);
		this.ensureCapacity(10);
		for (let i = 0; i < 9; i++) {
			this.buffer[this.pos++] = value & 127 | 128;
			value >>= 7;
		}
		this.buffer[this.pos++] = 1;
		return this;
	}
	/**
	* Write a `bool` value, a varint.
	*/
	bool(value) {
		this.ensureCapacity(1);
		this.buffer[this.pos++] = value ? 1 : 0;
		return this;
	}
	/**
	* Write a `bytes` value, length-delimited arbitrary data.
	*/
	bytes(value) {
		this.uint32(value.byteLength);
		return this.raw(value);
	}
	/**
	* Write a `string` value, length-delimited data converted to UTF-8 text.
	*/
	string(value) {
		if (typeof value !== "string") value = String(value);
		const len = value.length;
		if (len <= ASCII_MAX_LENGTH) {
			this.ensureCapacity(len + 1);
			const ascii = this.buffer;
			let pos = this.pos;
			ascii[pos++] = len;
			let i = 0;
			for (; i < len; i++) {
				const code = value.charCodeAt(i);
				if (code > 127) break;
				ascii[pos++] = code;
			}
			if (i == len) {
				this.pos = pos;
				return this;
			}
		}
		this.ensureCapacity(len * 3 + 5);
		const lenPrefixSizeGuess = varint32Size(len);
		const buf = this.buffer;
		const start = this.pos;
		const { written } = this.encodeUtf8Into(value, buf.subarray(start + lenPrefixSizeGuess));
		const lenPrefixSize = varint32Size(written);
		if (lenPrefixSize != lenPrefixSizeGuess) buf.copyWithin(start + lenPrefixSize, start + lenPrefixSizeGuess, start + lenPrefixSizeGuess + written);
		this.uint32(written);
		this.pos += written;
		return this;
	}
	/**
	* Write a `float` value, 32-bit floating point number.
	*/
	float(value) {
		assertFloat32(value);
		this.ensureCapacity(4);
		this.view().setFloat32(this.pos, value, true);
		this.pos += 4;
		return this;
	}
	/**
	* Write a `double` value, a 64-bit floating point number.
	*/
	double(value) {
		this.ensureCapacity(8);
		this.view().setFloat64(this.pos, value, true);
		this.pos += 8;
		return this;
	}
	/**
	* Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
	*/
	fixed32(value) {
		assertUInt32(value);
		this.ensureCapacity(4);
		this.view().setUint32(this.pos, value, true);
		this.pos += 4;
		return this;
	}
	/**
	* Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
	*/
	sfixed32(value) {
		assertInt32(value);
		this.ensureCapacity(4);
		this.view().setInt32(this.pos, value, true);
		this.pos += 4;
		return this;
	}
	/**
	* Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
	*/
	sint32(value) {
		assertInt32(value);
		return this.uint32((value << 1 ^ value >> 31) >>> 0);
	}
	/**
	* Write a `sfixed64` value, a signed, fixed-length 64-bit integer.
	*/
	sfixed64(value) {
		const tc = protoInt64.enc(value);
		this.ensureCapacity(8);
		const view = this.view();
		view.setInt32(this.pos, tc.lo, true);
		view.setInt32(this.pos + 4, tc.hi, true);
		this.pos += 8;
		return this;
	}
	/**
	* Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
	*/
	fixed64(value) {
		const tc = protoInt64.uEnc(value);
		this.ensureCapacity(8);
		const view = this.view();
		view.setInt32(this.pos, tc.lo, true);
		view.setInt32(this.pos + 4, tc.hi, true);
		this.pos += 8;
		return this;
	}
	/**
	* Write a `int64` value, a signed 64-bit varint.
	*/
	int64(value) {
		const tc = protoInt64.enc(value);
		return this.writeVarint64(tc.lo, tc.hi);
	}
	/**
	* Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
	*/
	sint64(value) {
		const tc = protoInt64.enc(value), sign = tc.hi >> 31, lo = tc.lo << 1 ^ sign, hi = (tc.hi << 1 | tc.lo >>> 31) ^ sign;
		return this.writeVarint64(lo, hi);
	}
	/**
	* Write a `uint64` value, an unsigned 64-bit varint.
	*/
	uint64(value) {
		const tc = protoInt64.uEnc(value);
		return this.writeVarint64(tc.lo, tc.hi);
	}
	/**
	* Write a 64-bit varint directly into the buffer. Accepts the value as
	* split low/high 32-bit words.
	*
	* Ported from varint64write() to avoid the intermediate number[] buffer.
	* See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/writer.js#L344
	*/
	writeVarint64(lo, hi) {
		this.ensureCapacity(10);
		const buf = this.buffer;
		let pos = this.pos;
		for (let i = 0; i < 28; i = i + 7) {
			const shift = lo >>> i;
			const hasNext = !(shift >>> 7 == 0 && hi == 0);
			buf[pos++] = (hasNext ? shift | 128 : shift) & 255;
			if (!hasNext) {
				this.pos = pos;
				return this;
			}
		}
		const splitBits = lo >>> 28 & 15 | (hi & 7) << 4;
		const hasMoreBits = !(hi >> 3 == 0);
		buf[pos++] = (hasMoreBits ? splitBits | 128 : splitBits) & 255;
		if (!hasMoreBits) {
			this.pos = pos;
			return this;
		}
		for (let i = 3; i < 31; i = i + 7) {
			const shift = hi >>> i;
			const hasNext = !(shift >>> 7 == 0);
			buf[pos++] = (hasNext ? shift | 128 : shift) & 255;
			if (!hasNext) {
				this.pos = pos;
				return this;
			}
		}
		buf[pos++] = hi >>> 31 & 1;
		this.pos = pos;
		return this;
	}
};
/**
* Capacity of the buffer allocated by the first write..
*/
const INITIAL_SIZE = 128;
/**
* Bytes `fork()` reserves for the length prefix, betting that the payload will
* be under 128 bytes. `join()` fills them in, and widens them if the bet was
* wrong.
*/
const DEFAULT_LEN_PREFIX_SIZE = 1;
/**
* Shared empty buffer used as the initial value before the first write.
* Avoids allocating and zeroing `INITIAL_SIZE` bytes per BinaryWriter when a
* writer is only used for a tiny message (or not used at all).
*/
const EMPTY_BUFFER = /* @__PURE__ */ new Uint8Array(0);
/**
* Shared empty view, paired with `EMPTY_BUFFER`. Never written to: any
* fixed-width write first grows the buffer, which replaces this view.
*/
const EMPTY_VIEW = new DataView(EMPTY_BUFFER.buffer);
/**
* Longest string on the ASCII fast paths. Must stay below 0x80, so
* that the writer's length prefix always fits a single varint byte.
*/
const ASCII_MAX_LENGTH = 32;
/**
* Number of bytes needed to encode `value` as an unsigned 32-bit varint.
*/
function varint32Size(value) {
	if (value < 128) return 1;
	if (value < 16384) return 2;
	if (value < 2097152) return 3;
	if (value < 268435456) return 4;
	return 5;
}
var BinaryReader = class {
	constructor(buf, decodeUtf8 = getTextEncoding().decodeUtf8) {
		this.decodeUtf8 = decodeUtf8;
		this.varint64Lo = 0;
		this.varint64Hi = 0;
		this.varint64 = varint64read;
		/**
		* Read a `uint32` field, an unsigned 32 bit varint.
		*/
		this.uint32 = varint32read;
		this.buf = buf;
		this.len = buf.length;
		this.pos = 0;
		this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	}
	/**
	* Reads a tag - field number and wire type. Tags are uint32 varints; values
	* that do not fit in uint32 are rejected.
	*/
	tag() {
		const start = this.pos;
		const tag = this.uint32();
		const bytesRead = this.pos - start;
		if (bytesRead > 5 || bytesRead == 5 && this.buf[this.pos - 1] > 15) throw new Error("illegal tag: varint overflows uint32");
		const fieldNo = tag >>> 3;
		const wireType = tag & 7;
		if (fieldNo <= 0 || wireType > 5) throw new Error("illegal tag: field no " + fieldNo + " wire type " + wireType);
		return [fieldNo, wireType];
	}
	/**
	* Skip one element and return the skipped data.
	*
	* When skipping StartGroup, provide the tags field number to check for
	* matching field number in the EndGroup tag. Recursion into nested groups
	* is guarded by the `recursionLimit` argument: When the limit is reached,
	* this method throws.
	*/
	skip(wireType, fieldNo, recursionLimit = 100) {
		let start = this.pos;
		switch (wireType) {
			case WireType.Varint:
				while (this.buf[this.pos++] & 128);
				break;
			case WireType.Bit64: this.pos += 4;
			case WireType.Bit32:
				this.pos += 4;
				break;
			case WireType.LengthDelimited:
				let len = this.uint32();
				this.pos += len;
				break;
			case WireType.StartGroup:
				if (recursionLimit <= 0) throw new Error("maximum recursion depth reached");
				for (;;) {
					const [fn, wt] = this.tag();
					if (wt === WireType.EndGroup) {
						if (fieldNo !== void 0 && fn !== fieldNo) throw new Error("invalid end group tag");
						break;
					}
					this.skip(wt, fn, recursionLimit - 1);
				}
				break;
			default: throw new Error("cant skip wire type " + wireType);
		}
		this.assertBounds();
		return this.buf.subarray(start, this.pos);
	}
	/**
	* Throws error if position in byte array is out of range.
	*/
	assertBounds() {
		if (this.pos > this.len) throw new RangeError("premature EOF");
	}
	/**
	* Read a `int32` field, a signed 32 bit varint.
	*/
	int32() {
		return this.uint32() | 0;
	}
	/**
	* Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
	*/
	sint32() {
		let zze = this.uint32();
		return zze >>> 1 ^ -(zze & 1);
	}
	/**
	* Read a `int64` field, a signed 64-bit varint.
	*/
	int64() {
		this.varint64();
		return protoInt64.dec(this.varint64Lo, this.varint64Hi);
	}
	/**
	* Read a `uint64` field, an unsigned 64-bit varint.
	*/
	uint64() {
		this.varint64();
		return protoInt64.uDec(this.varint64Lo, this.varint64Hi);
	}
	/**
	* Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
	*/
	sint64() {
		this.varint64();
		let lo = this.varint64Lo;
		let hi = this.varint64Hi;
		let s = -(lo & 1);
		lo = (lo >>> 1 | (hi & 1) << 31) ^ s;
		hi = hi >>> 1 ^ s;
		return protoInt64.dec(lo, hi);
	}
	/**
	* Read a `bool` field, a variant.
	*/
	bool() {
		const b = this.buf[this.pos];
		if (b < 128) {
			this.pos++;
			return b !== 0;
		}
		this.varint64();
		return this.varint64Lo !== 0 || this.varint64Hi !== 0;
	}
	/**
	* Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
	*/
	fixed32() {
		return this.view.getUint32((this.pos += 4) - 4, true);
	}
	/**
	* Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
	*/
	sfixed32() {
		return this.view.getInt32((this.pos += 4) - 4, true);
	}
	/**
	* Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
	*/
	fixed64() {
		return protoInt64.uDec(this.sfixed32(), this.sfixed32());
	}
	/**
	* Read a `fixed64` field, a signed, fixed-length 64-bit integer.
	*/
	sfixed64() {
		return protoInt64.dec(this.sfixed32(), this.sfixed32());
	}
	/**
	* Read a `float` field, 32-bit floating point number.
	*/
	float() {
		return this.view.getFloat32((this.pos += 4) - 4, true);
	}
	/**
	* Read a `double` field, a 64-bit floating point number.
	*/
	double() {
		return this.view.getFloat64((this.pos += 8) - 8, true);
	}
	/**
	* Read a `bytes` field, length-delimited arbitrary data.
	*/
	bytes() {
		let len = this.uint32(), start = this.pos;
		this.pos += len;
		this.assertBounds();
		return this.buf.subarray(start, start + len);
	}
	/**
	* Read a `string` field, length-delimited data converted to UTF-8 text. If
	* `strict` is true, throw on invalid UTF-8 instead of substituting U+FFFD.
	*/
	string(strict) {
		const bytes = this.bytes();
		const len = bytes.length;
		if (len <= ASCII_MAX_LENGTH) {
			const codes = new Array(len);
			for (let i = 0; i < len; i++) {
				const byte = bytes[i];
				if (byte > 127) return this.decodeUtf8(bytes, strict);
				codes[i] = byte;
			}
			return String.fromCharCode.apply(String, codes);
		}
		return this.decodeUtf8(bytes, strict);
	}
};
/**
* Assert a valid signed protobuf 32-bit integer as a number or string.
*/
function assertInt32(arg) {
	if (typeof arg == "string") arg = Number(arg);
	else if (typeof arg != "number") throw new Error("invalid int32: " + typeof arg);
	if (!Number.isInteger(arg) || arg > 2147483647 || arg < -2147483648) throw new Error("invalid int32: " + arg);
}
/**
* Assert a valid unsigned protobuf 32-bit integer as a number or string.
*/
function assertUInt32(arg) {
	if (typeof arg == "string") arg = Number(arg);
	else if (typeof arg != "number") throw new Error("invalid uint32: " + typeof arg);
	if (!Number.isInteger(arg) || arg > 4294967295 || arg < 0) throw new Error("invalid uint32: " + arg);
}
/**
* Assert a valid protobuf float value as a number or string.
*/
function assertFloat32(arg) {
	if (typeof arg == "string") {
		const o = arg;
		arg = Number(arg);
		if (Number.isNaN(arg) && o !== "NaN") throw new Error("invalid float32: " + o);
	} else if (typeof arg != "number") throw new Error("invalid float32: " + typeof arg);
	if (Number.isFinite(arg) && (arg > 34028234663852886e22 || arg < -34028234663852886e22)) throw new Error("invalid float32: " + arg);
}
//#endregion
//#region node_modules/@bufbuild/protobuf/dist/esm/wire/base64-encoding.js
const nativeSetFromBase64 = Uint8Array.prototype.setFromBase64;
/**
* Decodes a base64 string to a byte array.
*
* - ignores white-space, including line breaks and tabs
* - allows inner padding (can decode concatenated base64 strings)
* - does not require padding
* - understands base64url encoding:
*   "-" instead of "+",
*   "_" instead of "/",
*   no padding
*/
function base64Decode(base64Str) {
	const len = base64Str.length;
	let size = len - (len + 3 >> 2);
	if ((len & 3) == 0 && base64Str[len - 1] == "=") size -= base64Str[len - 2] == "=" ? 2 : 1;
	const bytes = new Uint8Array(size);
	let written = -1;
	if (nativeSetFromBase64) try {
		const result = nativeSetFromBase64.call(bytes, base64Str);
		if (result.read == len) written = result.written;
	} catch (_a) {}
	if (written < 0) written = setFromBase64(bytes, base64Str);
	return written == size ? bytes : bytes.subarray(0, written);
}
/** Writes into `bytes` from index 0 and returns the number of bytes written. */
function setFromBase64(bytes, base64Str) {
	const table = getDecodeTable();
	let bytePos = 0, groupPos = 0, b, p = 0;
	for (let i = 0; i < base64Str.length; i++) {
		b = table[base64Str.charCodeAt(i)];
		if (b === void 0) switch (base64Str[i]) {
			case "=": groupPos = 0;
			case "\n":
			case "\r":
			case "	":
			case " ": continue;
			default: throw Error("invalid base64 string");
		}
		switch (groupPos) {
			case 0:
				p = b;
				groupPos = 1;
				break;
			case 1:
				bytes[bytePos++] = p << 2 | (b & 48) >> 4;
				p = b;
				groupPos = 2;
				break;
			case 2:
				bytes[bytePos++] = (p & 15) << 4 | (b & 60) >> 2;
				p = b;
				groupPos = 3;
				break;
			case 3:
				bytes[bytePos++] = (p & 3) << 6 | b;
				groupPos = 0;
		}
	}
	if (groupPos == 1) throw Error("invalid base64 string");
	return bytePos;
}
const nativeToBase64 = Uint8Array.prototype.toBase64;
const toBase64OptionsMap = {
	std: {
		alphabet: "base64",
		omitPadding: false
	},
	std_raw: {
		alphabet: "base64",
		omitPadding: true
	},
	url: {
		alphabet: "base64url",
		omitPadding: true
	}
};
/**
* Encode a byte array to a base64 string.
*
* By default, this function uses the standard base64 encoding with padding.
*
* To encode without padding, use encoding = "std_raw".
*
* To encode with the URL encoding, use encoding = "url", which replaces the
* characters +/ by their URL-safe counterparts -_, and omits padding.
*/
function base64Encode(bytes, encoding = "std") {
	if (nativeToBase64) return nativeToBase64.call(bytes, toBase64OptionsMap[encoding]);
	const table = getEncodeTable(encoding);
	const pad = encoding == "std";
	let base64 = "", groupPos = 0, b, p = 0;
	for (let i = 0; i < bytes.length; i++) {
		b = bytes[i];
		switch (groupPos) {
			case 0:
				base64 += table[b >> 2];
				p = (b & 3) << 4;
				groupPos = 1;
				break;
			case 1:
				base64 += table[p | b >> 4];
				p = (b & 15) << 2;
				groupPos = 2;
				break;
			case 2:
				base64 += table[p | b >> 6];
				base64 += table[b & 63];
				groupPos = 0;
		}
	}
	if (groupPos) {
		base64 += table[p];
		if (pad) {
			base64 += "=";
			if (groupPos == 1) base64 += "=";
		}
	}
	return base64;
}
let encodeTableStd;
let encodeTableUrl;
let decodeTable;
function getEncodeTable(encoding) {
	if (!encodeTableStd) {
		encodeTableStd = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
		encodeTableUrl = encodeTableStd.slice(0, -2).concat("-", "_");
	}
	return encoding == "url" ? encodeTableUrl : encodeTableStd;
}
function getDecodeTable() {
	if (!decodeTable) {
		decodeTable = [];
		const encodeTable = getEncodeTable("std");
		for (let i = 0; i < encodeTable.length; i++) decodeTable[encodeTable[i].charCodeAt(0)] = i;
		decodeTable["-".charCodeAt(0)] = encodeTable.indexOf("+");
		decodeTable["_".charCodeAt(0)] = encodeTable.indexOf("/");
	}
	return decodeTable;
}
//#endregion
//#region src/networks/network.ts
var import_cjs = require_cjs();
function composeUri({ base, path = "/", params = {} }) {
	while (base.endsWith("/")) base = base.substring(0, base.length - 1);
	while (path.startsWith("/")) path = path.substring(1);
	let addr = `${base}/${path}`;
	if (params != null) {
		let firstParam = true;
		for (const name in params) {
			const value = params[name];
			if (firstParam) {
				firstParam = false;
				addr += "?";
			} else addr += "&";
			addr += encodeURIComponent(name);
			addr += "=";
			switch (typeof value) {
				case "boolean":
				case "number":
				case "bigint":
					addr += value;
					break;
				case "string":
					addr += encodeURIComponent(value);
					break;
				case "undefined": break;
				default: throw `path param type ${typeof value}: ${value}`;
			}
		}
	}
	return addr;
}
//#endregion
//#region src/models/client/api/shared.ts
function responseStatusFromJSON(object) {
	switch (object) {
		case 0:
		case "Ok": return 0;
		case 1:
		case "ServerError": return 1;
		case 2:
		case "BadRequest": return 2;
		default: return -1;
	}
}
function responseStatusToJSON(object) {
	switch (object) {
		case 0: return "Ok";
		case 1: return "ServerError";
		case 2: return "BadRequest";
		default: return "UNRECOGNIZED";
	}
}
function addRemoveOpTypeFromJSON(object) {
	switch (object) {
		case 0:
		case "Add": return 0;
		case 1:
		case "Remove": return 1;
		default: return -1;
	}
}
function addRemoveOpTypeToJSON(object) {
	switch (object) {
		case 0: return "Add";
		case 1: return "Remove";
		default: return "UNRECOGNIZED";
	}
}
function createBaseCommonApiData() {
	return {
		appId: 0,
		path: "",
		sceneId: 0
	};
}
const CommonApiData = {
	encode(message, writer = new BinaryWriter()) {
		if (message.appId !== 0) writer.uint32(8).int32(message.appId);
		if (message.path !== "") writer.uint32(18).string(message.path);
		if (message.sceneId !== 0) writer.uint32(24).int32(message.sceneId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseCommonApiData();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 8) break;
						message.appId = reader.int32();
						continue;
					case 2:
						if (tag !== 18) break;
						message.path = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.sceneId = reader.int32();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			appId: isSet$7(object.appId) ? globalThis.Number(object.appId) : 0,
			path: isSet$7(object.path) ? globalThis.String(object.path) : "",
			sceneId: isSet$7(object.sceneId) ? globalThis.Number(object.sceneId) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.appId !== 0) obj.appId = Math.round(message.appId);
		if (message.path !== "") obj.path = message.path;
		if (message.sceneId !== 0) obj.sceneId = Math.round(message.sceneId);
		return obj;
	},
	create(base) {
		return CommonApiData.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseCommonApiData();
		message.appId = object.appId ?? 0;
		message.path = object.path ?? "";
		message.sceneId = object.sceneId ?? 0;
		return message;
	}
};
function createBaseCommonResponseData() {
	return {
		status: 0,
		message: ""
	};
}
const CommonResponseData = {
	encode(message, writer = new BinaryWriter()) {
		if (message.status !== 0) writer.uint32(8).int32(message.status);
		if (message.message !== "") writer.uint32(18).string(message.message);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseCommonResponseData();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 8) break;
						message.status = reader.int32();
						continue;
					case 2:
						if (tag !== 18) break;
						message.message = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			status: isSet$7(object.status) ? responseStatusFromJSON(object.status) : 0,
			message: isSet$7(object.message) ? globalThis.String(object.message) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.status !== 0) obj.status = responseStatusToJSON(message.status);
		if (message.message !== "") obj.message = message.message;
		return obj;
	},
	create(base) {
		return CommonResponseData.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseCommonResponseData();
		message.status = object.status ?? 0;
		message.message = object.message ?? "";
		return message;
	}
};
function createBaseMediaAsset() {
	return {
		id: 0,
		url: "",
		cover: "",
		title: "",
		tags: [],
		ownerId: 0,
		ownerNickname: void 0,
		ownerAvatar: void 0,
		viewCount: 0,
		isFavorite: false,
		banned: false
	};
}
const MediaAsset = {
	encode(message, writer = new BinaryWriter()) {
		if (message.id !== 0) writer.uint32(8).int64(message.id);
		if (message.url !== "") writer.uint32(26).string(message.url);
		if (message.cover !== "") writer.uint32(34).string(message.cover);
		if (message.title !== "") writer.uint32(42).string(message.title);
		for (const v of message.tags) writer.uint32(50).string(v);
		if (message.ownerId !== 0) writer.uint32(56).int64(message.ownerId);
		if (message.ownerNickname !== void 0) writer.uint32(66).string(message.ownerNickname);
		if (message.ownerAvatar !== void 0) writer.uint32(74).string(message.ownerAvatar);
		if (message.viewCount !== 0) writer.uint32(88).int64(message.viewCount);
		if (message.isFavorite !== false) writer.uint32(96).bool(message.isFavorite);
		if (message.banned !== false) writer.uint32(104).bool(message.banned);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseMediaAsset();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 8) break;
						message.id = longToNumber$5(reader.int64());
						continue;
					case 3:
						if (tag !== 26) break;
						message.url = reader.string();
						continue;
					case 4:
						if (tag !== 34) break;
						message.cover = reader.string();
						continue;
					case 5:
						if (tag !== 42) break;
						message.title = reader.string();
						continue;
					case 6:
						if (tag !== 50) break;
						message.tags.push(reader.string());
						continue;
					case 7:
						if (tag !== 56) break;
						message.ownerId = longToNumber$5(reader.int64());
						continue;
					case 8:
						if (tag !== 66) break;
						message.ownerNickname = reader.string();
						continue;
					case 9:
						if (tag !== 74) break;
						message.ownerAvatar = reader.string();
						continue;
					case 11:
						if (tag !== 88) break;
						message.viewCount = longToNumber$5(reader.int64());
						continue;
					case 12:
						if (tag !== 96) break;
						message.isFavorite = reader.bool();
						continue;
					case 13:
						if (tag !== 104) break;
						message.banned = reader.bool();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			id: isSet$7(object.id) ? globalThis.Number(object.id) : 0,
			url: isSet$7(object.url) ? globalThis.String(object.url) : "",
			cover: isSet$7(object.cover) ? globalThis.String(object.cover) : "",
			title: isSet$7(object.title) ? globalThis.String(object.title) : "",
			tags: globalThis.Array.isArray(object?.tags) ? object.tags.map((e) => globalThis.String(e)) : [],
			ownerId: isSet$7(object.ownerId) ? globalThis.Number(object.ownerId) : 0,
			ownerNickname: isSet$7(object.ownerNickname) ? globalThis.String(object.ownerNickname) : void 0,
			ownerAvatar: isSet$7(object.ownerAvatar) ? globalThis.String(object.ownerAvatar) : void 0,
			viewCount: isSet$7(object.viewCount) ? globalThis.Number(object.viewCount) : 0,
			isFavorite: isSet$7(object.isFavorite) ? globalThis.Boolean(object.isFavorite) : false,
			banned: isSet$7(object.banned) ? globalThis.Boolean(object.banned) : false
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.id !== 0) obj.id = Math.round(message.id);
		if (message.url !== "") obj.url = message.url;
		if (message.cover !== "") obj.cover = message.cover;
		if (message.title !== "") obj.title = message.title;
		if (message.tags?.length) obj.tags = message.tags;
		if (message.ownerId !== 0) obj.ownerId = Math.round(message.ownerId);
		if (message.ownerNickname !== void 0) obj.ownerNickname = message.ownerNickname;
		if (message.ownerAvatar !== void 0) obj.ownerAvatar = message.ownerAvatar;
		if (message.viewCount !== 0) obj.viewCount = Math.round(message.viewCount);
		if (message.isFavorite !== false) obj.isFavorite = message.isFavorite;
		if (message.banned !== false) obj.banned = message.banned;
		return obj;
	},
	create(base) {
		return MediaAsset.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseMediaAsset();
		message.id = object.id ?? 0;
		message.url = object.url ?? "";
		message.cover = object.cover ?? "";
		message.title = object.title ?? "";
		message.tags = object.tags?.map((e) => e) || [];
		message.ownerId = object.ownerId ?? 0;
		message.ownerNickname = object.ownerNickname ?? void 0;
		message.ownerAvatar = object.ownerAvatar ?? void 0;
		message.viewCount = object.viewCount ?? 0;
		message.isFavorite = object.isFavorite ?? false;
		message.banned = object.banned ?? false;
		return message;
	}
};
function createBaseOssPutMeta() {
	return {
		url: "",
		form: {}
	};
}
const OssPutMeta = {
	encode(message, writer = new BinaryWriter()) {
		if (message.url !== "") writer.uint32(10).string(message.url);
		globalThis.Object.entries(message.form).forEach(([key, value]) => {
			OssPutMeta_FormEntry.encode({
				key,
				value
			}, writer.uint32(18).fork()).join();
		});
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseOssPutMeta();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.url = reader.string();
						continue;
					case 2: {
						if (tag !== 18) break;
						const entry2 = OssPutMeta_FormEntry.decode(reader, reader.uint32());
						if (entry2.value !== void 0) message.form[entry2.key] = entry2.value;
						continue;
					}
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			url: isSet$7(object.url) ? globalThis.String(object.url) : "",
			form: isObject$1(object.form) ? globalThis.Object.entries(object.form).reduce((acc, [key, value]) => {
				globalThis.Object.defineProperty(acc, key, {
					value: globalThis.String(value),
					enumerable: true,
					configurable: true,
					writable: true
				});
				return acc;
			}, {}) : {}
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.url !== "") obj.url = message.url;
		if (message.form) {
			const entries = globalThis.Object.entries(message.form);
			if (entries.length > 0) {
				obj.form = {};
				entries.forEach(([k, v]) => {
					obj.form[k] = v;
				});
			}
		}
		return obj;
	},
	create(base) {
		return OssPutMeta.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseOssPutMeta();
		message.url = object.url ?? "";
		message.form = globalThis.Object.entries(object.form ?? {}).reduce((acc, [key, value]) => {
			if (value !== void 0) acc[key] = globalThis.String(value);
			return acc;
		}, {});
		return message;
	}
};
function createBaseOssPutMeta_FormEntry() {
	return {
		key: "",
		value: ""
	};
}
const OssPutMeta_FormEntry = {
	encode(message, writer = new BinaryWriter()) {
		if (message.key !== "") writer.uint32(10).string(message.key);
		if (message.value !== "") writer.uint32(18).string(message.value);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseOssPutMeta_FormEntry();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.key = reader.string();
						continue;
					case 2:
						if (tag !== 18) break;
						message.value = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			key: isSet$7(object.key) ? globalThis.String(object.key) : "",
			value: isSet$7(object.value) ? globalThis.String(object.value) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.key !== "") obj.key = message.key;
		if (message.value !== "") obj.value = message.value;
		return obj;
	},
	create(base) {
		return OssPutMeta_FormEntry.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseOssPutMeta_FormEntry();
		message.key = object.key ?? "";
		message.value = object.value ?? "";
		return message;
	}
};
function createBaseDraftAsset() {
	return {
		id: 0,
		mediaId: void 0,
		url: void 0,
		cover: void 0,
		title: "",
		approved: false,
		rejectReason: void 0
	};
}
const DraftAsset = {
	encode(message, writer = new BinaryWriter()) {
		if (message.id !== 0) writer.uint32(8).int64(message.id);
		if (message.mediaId !== void 0) writer.uint32(16).int64(message.mediaId);
		if (message.url !== void 0) writer.uint32(26).string(message.url);
		if (message.cover !== void 0) writer.uint32(34).string(message.cover);
		if (message.title !== "") writer.uint32(42).string(message.title);
		if (message.approved !== false) writer.uint32(48).bool(message.approved);
		if (message.rejectReason !== void 0) writer.uint32(58).string(message.rejectReason);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseDraftAsset();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 8) break;
						message.id = longToNumber$5(reader.int64());
						continue;
					case 2:
						if (tag !== 16) break;
						message.mediaId = longToNumber$5(reader.int64());
						continue;
					case 3:
						if (tag !== 26) break;
						message.url = reader.string();
						continue;
					case 4:
						if (tag !== 34) break;
						message.cover = reader.string();
						continue;
					case 5:
						if (tag !== 42) break;
						message.title = reader.string();
						continue;
					case 6:
						if (tag !== 48) break;
						message.approved = reader.bool();
						continue;
					case 7:
						if (tag !== 58) break;
						message.rejectReason = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			id: isSet$7(object.id) ? globalThis.Number(object.id) : 0,
			mediaId: isSet$7(object.mediaId) ? globalThis.Number(object.mediaId) : isSet$7(object.media_id) ? globalThis.Number(object.media_id) : void 0,
			url: isSet$7(object.url) ? globalThis.String(object.url) : void 0,
			cover: isSet$7(object.cover) ? globalThis.String(object.cover) : void 0,
			title: isSet$7(object.title) ? globalThis.String(object.title) : "",
			approved: isSet$7(object.approved) ? globalThis.Boolean(object.approved) : false,
			rejectReason: isSet$7(object.rejectReason) ? globalThis.String(object.rejectReason) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.id !== 0) obj.id = Math.round(message.id);
		if (message.mediaId !== void 0) obj.mediaId = Math.round(message.mediaId);
		if (message.url !== void 0) obj.url = message.url;
		if (message.cover !== void 0) obj.cover = message.cover;
		if (message.title !== "") obj.title = message.title;
		if (message.approved !== false) obj.approved = message.approved;
		if (message.rejectReason !== void 0) obj.rejectReason = message.rejectReason;
		return obj;
	},
	create(base) {
		return DraftAsset.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseDraftAsset();
		message.id = object.id ?? 0;
		message.mediaId = object.mediaId ?? void 0;
		message.url = object.url ?? void 0;
		message.cover = object.cover ?? void 0;
		message.title = object.title ?? "";
		message.approved = object.approved ?? false;
		message.rejectReason = object.rejectReason ?? void 0;
		return message;
	}
};
function createBaseArticle() {
	return {
		address: "",
		image: "",
		title: "",
		brief: ""
	};
}
const Article = {
	encode(message, writer = new BinaryWriter()) {
		if (message.address !== "") writer.uint32(10).string(message.address);
		if (message.image !== "") writer.uint32(18).string(message.image);
		if (message.title !== "") writer.uint32(26).string(message.title);
		if (message.brief !== "") writer.uint32(34).string(message.brief);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseArticle();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.address = reader.string();
						continue;
					case 2:
						if (tag !== 18) break;
						message.image = reader.string();
						continue;
					case 3:
						if (tag !== 26) break;
						message.title = reader.string();
						continue;
					case 4:
						if (tag !== 34) break;
						message.brief = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			address: isSet$7(object.address) ? globalThis.String(object.address) : "",
			image: isSet$7(object.image) ? globalThis.String(object.image) : "",
			title: isSet$7(object.title) ? globalThis.String(object.title) : "",
			brief: isSet$7(object.brief) ? globalThis.String(object.brief) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.address !== "") obj.address = message.address;
		if (message.image !== "") obj.image = message.image;
		if (message.title !== "") obj.title = message.title;
		if (message.brief !== "") obj.brief = message.brief;
		return obj;
	},
	create(base) {
		return Article.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseArticle();
		message.address = object.address ?? "";
		message.image = object.image ?? "";
		message.title = object.title ?? "";
		message.brief = object.brief ?? "";
		return message;
	}
};
function longToNumber$5(int64) {
	const num = globalThis.Number(int64.toString());
	if (num > globalThis.Number.MAX_SAFE_INTEGER) throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
	if (num < globalThis.Number.MIN_SAFE_INTEGER) throw new globalThis.Error("Value is smaller than Number.MIN_SAFE_INTEGER");
	return num;
}
function isObject$1(value) {
	return typeof value === "object" && value !== null;
}
function isSet$7(value) {
	return value !== null && value !== void 0;
}
const allInOnePool = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`;
function genRandomText(opts) {
	const { pool = allInOnePool, count = 8 } = opts ?? {};
	let s = "";
	for (let i = 0; i < count; i++) s += pool[Math.floor(Math.random() * pool.length)];
	return s;
}
//#endregion
//#region src/apis/session.ts
var BaseSessionManagement = class {
	constructor(appId) {
		this.session = "<uninit>";
		this.cacheOpenId = new CachedString("current_open_id");
		this.cacheShareMark = new CachedString("current_share_mark");
		this.cachedPath = "unknown";
		this.cachedParams = {};
		this.cachedSceneId = -1;
		this.appActive = true;
		this.authCheck = Promise.reject("auth not init");
		this.openApp = void 0;
		this.appId = appId;
	}
	onLaunch({ sceneId }) {
		this.appActive = true;
		this.session = genRandomText();
		this.cachedSceneId = sceneId;
	}
	onShow({ sceneId }) {
		this.appActive = true;
		this.cachedSceneId = sceneId ?? this.cachedSceneId;
		this.authCheck = this.doAuthCheck();
		this.updateAppInfo();
	}
	onHide() {
		this.appActive = false;
		this.authCheck = Promise.reject("app hide");
	}
	onPageChange(page) {
		const pages = getCurrentPages();
		if (pages.length == 0) return;
		const current = pages[pages.length - 1];
		if (current == null) return;
		const path = page?.path ?? current.path;
		const params = page?.params ?? current.options;
		let trimParams = {};
		for (const k in params) {
			const v = params[k];
			if (v == null) continue;
			trimParams[k] = v;
		}
		if (this.cachedPath == path && paramsEq(this.cachedParams, trimParams)) return;
		this.cachedPath = path;
		this.cachedParams = trimParams;
		console.log("setCurrentPath", path, trimParams);
		this.reportOneLog((base) => [{
			base,
			openPage: { params: trimParams }
		}]);
	}
	getSessionKey() {
		return this.session;
	}
	getOpenApp() {
		return this.openApp;
	}
	async navigateTo({ path, params = {} }) {
		const uri = composeUri({
			base: "",
			path,
			params: {
				...params,
				sk: this.session
			}
		});
		await wx.navigateTo({ url: uri });
	}
	updateCachedOpenId(openId) {
		this.cacheOpenId.value = openId;
	}
	readCachedOpenId() {
		return this.cacheOpenId.value;
	}
	async authedOpenId() {
		await this.authCheck;
		return this.cacheOpenId.value;
	}
	updateCachedShareMark(shareMark) {
		this.cacheShareMark.value = shareMark;
	}
	readCachedShareMark() {
		return this.cacheShareMark.value;
	}
	async authedShareMark() {
		await this.authCheck;
		return this.cacheShareMark.value;
	}
	obtainCommonApiData() {
		return {
			appId: this.appId,
			path: this.cachedPath,
			sceneId: this.cachedSceneId
		};
	}
	userSessionCheck(_) {
		throw new Error("user session check unimplemented");
	}
	userLogin(_) {
		throw new Error("user login unimplemented");
	}
	reportOneLog(_) {
		throw new Error("report one log unimplemented");
	}
	async doAuthCheck() {
		const { needLogin } = await (async (openId) => {
			try {
				if (openId.length > 0) return await this.userSessionCheck({ openId });
			} catch (e) {
				console.log("user session check", e);
			}
			return { needLogin: true };
		})(this.cacheOpenId.value.trim());
		if (!needLogin) return;
		const response = await wx.login();
		while (this.appActive) try {
			await this.userLogin({ code: response.code });
			return;
		} catch (e) {
			console.log("do user login", e);
			throw e;
		}
	}
	updateAppInfo() {
		const opts = wx.getEnterOptionsSync();
		let path = opts?.path;
		if (opts.query != null) for (const k in opts.query) {
			path ?? (path = "");
			if (path.indexOf("?") < 0) path += "?";
			else path += "&";
			path += encodeURIComponent(k);
			const v = opts.query[k];
			if (v == null) continue;
			path += "=";
			path += encodeURIComponent(v);
		}
		const newOpenApp = {
			path,
			chatType: opts?.chatType,
			scene: opts?.scene
		};
		wx.getGroupEnterInfo({
			success: (v) => {
				newOpenApp.groupIv = v.iv;
				newOpenApp.groupEncryptedData = v.encryptedData;
				this.updateOpenApp(newOpenApp);
			},
			fail: () => {
				this.updateOpenApp(newOpenApp);
			}
		});
	}
	updateOpenApp(newOpenApp) {
		if (this.openApp != null && this.openApp?.path == newOpenApp.path && this.openApp?.scene == newOpenApp.scene) return;
		console.log("updateOpenApp", newOpenApp, this.openApp);
		this.openApp = newOpenApp;
		this.reportOneLog((base) => [{
			base,
			openApp: newOpenApp
		}]);
	}
};
function paramsEq(x, y) {
	const xKeys = Object.keys(x);
	if (xKeys.length !== Object.keys(y).length) return false;
	for (const k of xKeys) if (x[k] !== y[k]) return false;
	return true;
}
var CachedString = class {
	constructor(key, empty) {
		this.key = key;
		this.empty = empty ?? "";
		this.cache = void 0;
	}
	get value() {
		if (this.cache == null) try {
			this.cache = wx.getStorageSync(this.key);
		} catch (e) {
			console.log(`get ${this.key} in cache`, e);
		}
		return this.cache ?? this.empty;
	}
	set value(v) {
		this.cache = v;
		wx.setStorageSync(this.key, v);
	}
};
//#endregion
//#region src/compatible/utf8.ts
var Utf8TextEncoding = class {
	checkUtf8(text) {
		const size = text.length;
		for (let i = 0; i < size; i++) {
			const codePoint = text.charCodeAt(i);
			if (isASCII(codePoint)) continue;
			if (inRange(codePoint, 128, 1114111)) continue;
			return false;
		}
		return true;
	}
	encodeUtf8(text) {
		const bytes = [];
		for (let i = 0; i < text.length; ++i) encodeCodePoint(text.charCodeAt(i), bytes);
		return Uint8Array.from(bytes);
	}
	decodeUtf8(bytes) {
		let codePoints = [];
		const decoder = new CodePointDecoder();
		for (const byte of bytes) {
			const codePoint = decoder.decode(byte);
			if (codePoint != null) codePoints.push(codePoint);
		}
		decoder.end();
		return String.fromCodePoint(...codePoints);
	}
};
function isASCII(value) {
	return value >= 0 && value <= 127;
}
function inRange(value, min, max) {
	return value >= min && value <= max;
}
function encodeCodePoint(codePoint, output) {
	if (isASCII(codePoint)) {
		output.push(codePoint);
		return;
	}
	let appendCount;
	let appendOffset;
	if (inRange(codePoint, 128, 2047)) {
		appendCount = 1;
		appendOffset = 192;
	} else if (inRange(codePoint, 2048, 65535)) {
		appendCount = 2;
		appendOffset = 224;
	} else if (inRange(codePoint, 65536, 1114111)) {
		appendCount = 3;
		appendOffset = 240;
	} else throw new Error("Could encode code point of text in utf-8");
	output.push((codePoint >> 6 * appendCount) + appendOffset);
	while (appendCount > 0) {
		appendCount--;
		const temp = codePoint >> 6 * appendCount;
		output.push(128 | temp & 63);
	}
}
var CodePointDecoder = class {
	constructor() {
		this.codePoint = 0;
		this.bytesSeen = 0;
		this.bytesNeeded = 0;
		this.lowerBoundary = 128;
		this.upperBoundary = 191;
	}
	decode(byte) {
		if (this.bytesNeeded === 0) {
			if (inRange(byte, 0, 127)) return byte;
			else if (inRange(byte, 194, 223)) {
				this.bytesNeeded = 1;
				this.codePoint = byte & 31;
			} else if (inRange(byte, 224, 239)) {
				if (byte === 224) this.lowerBoundary = 160;
				if (byte === 237) this.upperBoundary = 159;
				this.bytesNeeded = 2;
				this.codePoint = byte & 15;
			} else if (inRange(byte, 240, 244)) {
				if (byte === 240) this.lowerBoundary = 144;
				if (byte === 244) this.upperBoundary = 143;
				this.bytesNeeded = 3;
				this.codePoint = byte & 7;
			} else throw new Error(`Unexpected head byte ${byte}`);
			return null;
		}
		if (!inRange(byte, this.lowerBoundary, this.upperBoundary)) {
			this.codePoint = this.bytesNeeded = this.bytesSeen = 0;
			this.lowerBoundary = 128;
			this.upperBoundary = 191;
			throw new Error(`Unexpected byte mid ${byte} (expected ${this.lowerBoundary}, ${this.upperBoundary})`);
		}
		this.lowerBoundary = 128;
		this.upperBoundary = 191;
		this.codePoint = this.codePoint << 6 | byte & 63;
		this.bytesSeen += 1;
		if (this.bytesSeen !== this.bytesNeeded) return null;
		const codePoint = this.codePoint;
		this.codePoint = this.bytesNeeded = this.bytesSeen = 0;
		return codePoint;
	}
	end() {
		if (this.bytesNeeded !== 0) {
			this.bytesNeeded = 0;
			throw new Error("Unexpected eof");
		}
	}
};
const utf8Encoding = new Utf8TextEncoding();
//#endregion
//#region src/apis/base.ts
var BaseApi = class extends BaseSessionManagement {
	constructor(appId, base, network) {
		super(appId);
		this.base = base;
		this.network = network;
	}
	async invokeProtoApi(options) {
		console.log("invokeProtoApi", options.path, options.params, options.requestBody);
		const response = await this.network.invokeHttp({
			method: options.method ?? "POST",
			uri: composeUri({
				base: this.base,
				path: options.path,
				params: options.params
			}),
			headers: { "Content-Type": "application/protobuf" },
			requestBody: options.requestMeta.encode(options.requestBody, new BinaryWriter((text) => utf8Encoding.encodeUtf8(text))).finish()
		});
		const accessId = response.headers["access-id"] ?? "unknown access id";
		const body = options.responseMeta.decode(new BinaryReader(response.body, (bytes) => utf8Encoding.decodeUtf8(bytes)));
		console.log("invokeProtoApi.ok", options.path, options.params, options.requestBody, body, accessId);
		checkApiResponse(options.extractor.commonOf(body));
		return options.extractor.bodyOf(body);
	}
	invokeNoOutputProtoApi(options) {
		return this.invokeProtoApi({
			...options,
			responseMeta: { decode: () => {} },
			extractor: {
				commonOf: () => void 0,
				bodyOf: () => {}
			}
		});
	}
};
var BadResponseException = class extends Error {
	get name() {
		return "BaseResponse";
	}
	constructor(message) {
		super();
		this.message = message;
	}
};
var ApiException = class extends Error {
	get name() {
		return "ApiException";
	}
	constructor(status, message) {
		super();
		this.status = status;
		this.message = message;
	}
};
function checkApiResponse(common) {
	if (common == null) throw new BadResponseException("no common data");
	if (common.status != 0) throw new ApiException(common.status, common.message);
}
//#endregion
//#region src/models/client/api/user.ts
function createBaseSessionCheckRequest() {
	return {
		common: void 0,
		openId: ""
	};
}
const SessionCheckRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseSessionCheckRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$6(object.openId) ? globalThis.String(object.openId) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		return obj;
	},
	create(base) {
		return SessionCheckRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseSessionCheckRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		return message;
	}
};
function createBaseSessionCheckResponse() {
	return {
		common: void 0,
		needLogin: false,
		shareMark: ""
	};
}
const SessionCheckResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.needLogin !== false) writer.uint32(16).bool(message.needLogin);
		if (message.shareMark !== "") writer.uint32(26).string(message.shareMark);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseSessionCheckResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 16) break;
						message.needLogin = reader.bool();
						continue;
					case 3:
						if (tag !== 26) break;
						message.shareMark = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			needLogin: isSet$6(object.needLogin) ? globalThis.Boolean(object.needLogin) : false,
			shareMark: isSet$6(object.shareMark) ? globalThis.String(object.shareMark) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.needLogin !== false) obj.needLogin = message.needLogin;
		if (message.shareMark !== "") obj.shareMark = message.shareMark;
		return obj;
	},
	create(base) {
		return SessionCheckResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseSessionCheckResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.needLogin = object.needLogin ?? false;
		message.shareMark = object.shareMark ?? "";
		return message;
	}
};
function createBaseLoginRequest() {
	return {
		common: void 0,
		code: ""
	};
}
const LoginRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.code !== "") writer.uint32(18).string(message.code);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseLoginRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.code = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			code: isSet$6(object.code) ? globalThis.String(object.code) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.code !== "") obj.code = message.code;
		return obj;
	},
	create(base) {
		return LoginRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseLoginRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.code = object.code ?? "";
		return message;
	}
};
function createBaseLoginResponse() {
	return {
		common: void 0,
		openId: "",
		shareMark: ""
	};
}
const LoginResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.shareMark !== "") writer.uint32(26).string(message.shareMark);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseLoginResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 26) break;
						message.shareMark = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			openId: isSet$6(object.openId) ? globalThis.String(object.openId) : "",
			shareMark: isSet$6(object.shareMark) ? globalThis.String(object.shareMark) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.shareMark !== "") obj.shareMark = message.shareMark;
		return obj;
	},
	create(base) {
		return LoginResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseLoginResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.shareMark = object.shareMark ?? "";
		return message;
	}
};
function createBaseUpdateUserInfoRequest() {
	return {
		common: void 0,
		openId: "",
		nickname: void 0,
		avatar: void 0
	};
}
const UpdateUserInfoRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.nickname !== void 0) writer.uint32(42).string(message.nickname);
		if (message.avatar !== void 0) writer.uint32(50).string(message.avatar);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseUpdateUserInfoRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 5:
						if (tag !== 42) break;
						message.nickname = reader.string();
						continue;
					case 6:
						if (tag !== 50) break;
						message.avatar = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$6(object.openId) ? globalThis.String(object.openId) : "",
			nickname: isSet$6(object.nickname) ? globalThis.String(object.nickname) : void 0,
			avatar: isSet$6(object.avatar) ? globalThis.String(object.avatar) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.nickname !== void 0) obj.nickname = message.nickname;
		if (message.avatar !== void 0) obj.avatar = message.avatar;
		return obj;
	},
	create(base) {
		return UpdateUserInfoRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseUpdateUserInfoRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.nickname = object.nickname ?? void 0;
		message.avatar = object.avatar ?? void 0;
		return message;
	}
};
function createBaseFollowOpRequest() {
	return {
		common: void 0,
		openId: "",
		upId: 0,
		op: 0
	};
}
const FollowOpRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.upId !== 0) writer.uint32(24).int64(message.upId);
		if (message.op !== 0) writer.uint32(32).int32(message.op);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseFollowOpRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.upId = longToNumber$4(reader.int64());
						continue;
					case 4:
						if (tag !== 32) break;
						message.op = reader.int32();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$6(object.openId) ? globalThis.String(object.openId) : "",
			upId: isSet$6(object.upId) ? globalThis.Number(object.upId) : 0,
			op: isSet$6(object.op) ? addRemoveOpTypeFromJSON(object.op) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.upId !== 0) obj.upId = Math.round(message.upId);
		if (message.op !== 0) obj.op = addRemoveOpTypeToJSON(message.op);
		return obj;
	},
	create(base) {
		return FollowOpRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseFollowOpRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.upId = object.upId ?? 0;
		message.op = object.op ?? 0;
		return message;
	}
};
function createBaseGetUserInfoRequest() {
	return {
		common: void 0,
		openId: void 0,
		uid: void 0
	};
}
const GetUserInfoRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== void 0) writer.uint32(18).string(message.openId);
		if (message.uid !== void 0) writer.uint32(24).int64(message.uid);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetUserInfoRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.uid = longToNumber$4(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$6(object.openId) ? globalThis.String(object.openId) : void 0,
			uid: isSet$6(object.uid) ? globalThis.Number(object.uid) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== void 0) obj.openId = message.openId;
		if (message.uid !== void 0) obj.uid = Math.round(message.uid);
		return obj;
	},
	create(base) {
		return GetUserInfoRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetUserInfoRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? void 0;
		message.uid = object.uid ?? void 0;
		return message;
	}
};
function createBaseBasicUserInfo() {
	return {
		id: 0,
		nickname: void 0,
		avatar: void 0,
		videoCount: 0,
		videoViewCount: 0,
		fanCount: 0,
		followCount: 0
	};
}
const BasicUserInfo = {
	encode(message, writer = new BinaryWriter()) {
		if (message.id !== 0) writer.uint32(8).int64(message.id);
		if (message.nickname !== void 0) writer.uint32(18).string(message.nickname);
		if (message.avatar !== void 0) writer.uint32(26).string(message.avatar);
		if (message.videoCount !== 0) writer.uint32(32).int64(message.videoCount);
		if (message.videoViewCount !== 0) writer.uint32(40).int64(message.videoViewCount);
		if (message.fanCount !== 0) writer.uint32(48).int64(message.fanCount);
		if (message.followCount !== 0) writer.uint32(56).int64(message.followCount);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseBasicUserInfo();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 8) break;
						message.id = longToNumber$4(reader.int64());
						continue;
					case 2:
						if (tag !== 18) break;
						message.nickname = reader.string();
						continue;
					case 3:
						if (tag !== 26) break;
						message.avatar = reader.string();
						continue;
					case 4:
						if (tag !== 32) break;
						message.videoCount = longToNumber$4(reader.int64());
						continue;
					case 5:
						if (tag !== 40) break;
						message.videoViewCount = longToNumber$4(reader.int64());
						continue;
					case 6:
						if (tag !== 48) break;
						message.fanCount = longToNumber$4(reader.int64());
						continue;
					case 7:
						if (tag !== 56) break;
						message.followCount = longToNumber$4(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			id: isSet$6(object.id) ? globalThis.Number(object.id) : 0,
			nickname: isSet$6(object.nickname) ? globalThis.String(object.nickname) : void 0,
			avatar: isSet$6(object.avatar) ? globalThis.String(object.avatar) : void 0,
			videoCount: isSet$6(object.videoCount) ? globalThis.Number(object.videoCount) : 0,
			videoViewCount: isSet$6(object.videoViewCount) ? globalThis.Number(object.videoViewCount) : 0,
			fanCount: isSet$6(object.fanCount) ? globalThis.Number(object.fanCount) : 0,
			followCount: isSet$6(object.followCount) ? globalThis.Number(object.followCount) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.id !== 0) obj.id = Math.round(message.id);
		if (message.nickname !== void 0) obj.nickname = message.nickname;
		if (message.avatar !== void 0) obj.avatar = message.avatar;
		if (message.videoCount !== 0) obj.videoCount = Math.round(message.videoCount);
		if (message.videoViewCount !== 0) obj.videoViewCount = Math.round(message.videoViewCount);
		if (message.fanCount !== 0) obj.fanCount = Math.round(message.fanCount);
		if (message.followCount !== 0) obj.followCount = Math.round(message.followCount);
		return obj;
	},
	create(base) {
		return BasicUserInfo.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseBasicUserInfo();
		message.id = object.id ?? 0;
		message.nickname = object.nickname ?? void 0;
		message.avatar = object.avatar ?? void 0;
		message.videoCount = object.videoCount ?? 0;
		message.videoViewCount = object.videoViewCount ?? 0;
		message.fanCount = object.fanCount ?? 0;
		message.followCount = object.followCount ?? 0;
		return message;
	}
};
function createBaseGetUserInfoResponse() {
	return {
		common: void 0,
		info: void 0
	};
}
const GetUserInfoResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.info !== void 0) BasicUserInfo.encode(message.info, writer.uint32(18).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetUserInfoResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.info = BasicUserInfo.decode(reader, reader.uint32());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			info: isSet$6(object.info) ? BasicUserInfo.fromJSON(object.info) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.info !== void 0) obj.info = BasicUserInfo.toJSON(message.info);
		return obj;
	},
	create(base) {
		return GetUserInfoResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetUserInfoResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.info = object.info !== void 0 && object.info !== null ? BasicUserInfo.fromPartial(object.info) : void 0;
		return message;
	}
};
function createBaseCheckIsFanRequest() {
	return {
		common: void 0,
		openId: "",
		upOpenId: void 0,
		upUid: void 0
	};
}
const CheckIsFanRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.upOpenId !== void 0) writer.uint32(26).string(message.upOpenId);
		if (message.upUid !== void 0) writer.uint32(32).int64(message.upUid);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseCheckIsFanRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 26) break;
						message.upOpenId = reader.string();
						continue;
					case 4:
						if (tag !== 32) break;
						message.upUid = longToNumber$4(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$6(object.openId) ? globalThis.String(object.openId) : "",
			upOpenId: isSet$6(object.upOpenId) ? globalThis.String(object.upOpenId) : void 0,
			upUid: isSet$6(object.upUid) ? globalThis.Number(object.upUid) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.upOpenId !== void 0) obj.upOpenId = message.upOpenId;
		if (message.upUid !== void 0) obj.upUid = Math.round(message.upUid);
		return obj;
	},
	create(base) {
		return CheckIsFanRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseCheckIsFanRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.upOpenId = object.upOpenId ?? void 0;
		message.upUid = object.upUid ?? void 0;
		return message;
	}
};
function createBaseCheckIsFanResponse() {
	return {
		common: void 0,
		isFan: false
	};
}
const CheckIsFanResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.isFan !== false) writer.uint32(16).bool(message.isFan);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseCheckIsFanResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 16) break;
						message.isFan = reader.bool();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			isFan: isSet$6(object.isFan) ? globalThis.Boolean(object.isFan) : false
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.isFan !== false) obj.isFan = message.isFan;
		return obj;
	},
	create(base) {
		return CheckIsFanResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseCheckIsFanResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.isFan = object.isFan ?? false;
		return message;
	}
};
function createBaseGetFollowListRequest() {
	return {
		common: void 0,
		openId: "",
		cursor: void 0,
		count: void 0,
		hotCount: void 0
	};
}
const GetFollowListRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.cursor !== void 0) writer.uint32(24).int64(message.cursor);
		if (message.count !== void 0) writer.uint32(32).int32(message.count);
		if (message.hotCount !== void 0) writer.uint32(40).int32(message.hotCount);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetFollowListRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.cursor = longToNumber$4(reader.int64());
						continue;
					case 4:
						if (tag !== 32) break;
						message.count = reader.int32();
						continue;
					case 5:
						if (tag !== 40) break;
						message.hotCount = reader.int32();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$6(object.openId) ? globalThis.String(object.openId) : "",
			cursor: isSet$6(object.cursor) ? globalThis.Number(object.cursor) : void 0,
			count: isSet$6(object.count) ? globalThis.Number(object.count) : void 0,
			hotCount: isSet$6(object.hotCount) ? globalThis.Number(object.hotCount) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.cursor !== void 0) obj.cursor = Math.round(message.cursor);
		if (message.count !== void 0) obj.count = Math.round(message.count);
		if (message.hotCount !== void 0) obj.hotCount = Math.round(message.hotCount);
		return obj;
	},
	create(base) {
		return GetFollowListRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetFollowListRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.cursor = object.cursor ?? void 0;
		message.count = object.count ?? void 0;
		message.hotCount = object.hotCount ?? void 0;
		return message;
	}
};
function createBaseGetFollowListItem() {
	return {
		user: void 0,
		cursor: 0,
		hot: []
	};
}
const GetFollowListItem = {
	encode(message, writer = new BinaryWriter()) {
		if (message.user !== void 0) BasicUserInfo.encode(message.user, writer.uint32(10).fork()).join();
		if (message.cursor !== 0) writer.uint32(16).int64(message.cursor);
		for (const v of message.hot) MediaAsset.encode(v, writer.uint32(26).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetFollowListItem();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.user = BasicUserInfo.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 16) break;
						message.cursor = longToNumber$4(reader.int64());
						continue;
					case 3:
						if (tag !== 26) break;
						message.hot.push(MediaAsset.decode(reader, reader.uint32()));
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			user: isSet$6(object.user) ? BasicUserInfo.fromJSON(object.user) : void 0,
			cursor: isSet$6(object.cursor) ? globalThis.Number(object.cursor) : 0,
			hot: globalThis.Array.isArray(object?.hot) ? object.hot.map((e) => MediaAsset.fromJSON(e)) : []
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.user !== void 0) obj.user = BasicUserInfo.toJSON(message.user);
		if (message.cursor !== 0) obj.cursor = Math.round(message.cursor);
		if (message.hot?.length) obj.hot = message.hot.map((e) => MediaAsset.toJSON(e));
		return obj;
	},
	create(base) {
		return GetFollowListItem.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetFollowListItem();
		message.user = object.user !== void 0 && object.user !== null ? BasicUserInfo.fromPartial(object.user) : void 0;
		message.cursor = object.cursor ?? 0;
		message.hot = object.hot?.map((e) => MediaAsset.fromPartial(e)) || [];
		return message;
	}
};
function createBaseGetFollowListResponse() {
	return {
		common: void 0,
		items: []
	};
}
const GetFollowListResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		for (const v of message.items) GetFollowListItem.encode(v, writer.uint32(18).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetFollowListResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.items.push(GetFollowListItem.decode(reader, reader.uint32()));
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			items: globalThis.Array.isArray(object?.items) ? object.items.map((e) => GetFollowListItem.fromJSON(e)) : []
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.items?.length) obj.items = message.items.map((e) => GetFollowListItem.toJSON(e));
		return obj;
	},
	create(base) {
		return GetFollowListResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetFollowListResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.items = object.items?.map((e) => GetFollowListItem.fromPartial(e)) || [];
		return message;
	}
};
function createBaseShareCheckRequest() {
	return {
		common: void 0,
		openId: "",
		shareMark: "",
		mediaId: void 0
	};
}
const ShareCheckRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.shareMark !== "") writer.uint32(26).string(message.shareMark);
		if (message.mediaId !== void 0) writer.uint32(32).int64(message.mediaId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseShareCheckRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 26) break;
						message.shareMark = reader.string();
						continue;
					case 4:
						if (tag !== 32) break;
						message.mediaId = longToNumber$4(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$6(object.openId) ? globalThis.String(object.openId) : "",
			shareMark: isSet$6(object.shareMark) ? globalThis.String(object.shareMark) : "",
			mediaId: isSet$6(object.mediaId) ? globalThis.Number(object.mediaId) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.shareMark !== "") obj.shareMark = message.shareMark;
		if (message.mediaId !== void 0) obj.mediaId = Math.round(message.mediaId);
		return obj;
	},
	create(base) {
		return ShareCheckRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseShareCheckRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.shareMark = object.shareMark ?? "";
		message.mediaId = object.mediaId ?? void 0;
		return message;
	}
};
function createBaseShareCheckResponse() {
	return {
		common: void 0,
		shareMark: "",
		mediaExists: false
	};
}
const ShareCheckResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.shareMark !== "") writer.uint32(18).string(message.shareMark);
		if (message.mediaExists !== false) writer.uint32(24).bool(message.mediaExists);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseShareCheckResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.shareMark = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.mediaExists = reader.bool();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			shareMark: isSet$6(object.shareMark) ? globalThis.String(object.shareMark) : "",
			mediaExists: isSet$6(object.mediaExists) ? globalThis.Boolean(object.mediaExists) : false
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.shareMark !== "") obj.shareMark = message.shareMark;
		if (message.mediaExists !== false) obj.mediaExists = message.mediaExists;
		return obj;
	},
	create(base) {
		return ShareCheckResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseShareCheckResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.shareMark = object.shareMark ?? "";
		message.mediaExists = object.mediaExists ?? false;
		return message;
	}
};
function createBaseReportSessionCorruptRequest() {
	return {
		common: void 0,
		openId: "",
		expect: "",
		actual: "",
		page: ""
	};
}
const ReportSessionCorruptRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.expect !== "") writer.uint32(26).string(message.expect);
		if (message.actual !== "") writer.uint32(34).string(message.actual);
		if (message.page !== "") writer.uint32(42).string(message.page);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseReportSessionCorruptRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 26) break;
						message.expect = reader.string();
						continue;
					case 4:
						if (tag !== 34) break;
						message.actual = reader.string();
						continue;
					case 5:
						if (tag !== 42) break;
						message.page = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$6(object.openId) ? globalThis.String(object.openId) : "",
			expect: isSet$6(object.expect) ? globalThis.String(object.expect) : "",
			actual: isSet$6(object.actual) ? globalThis.String(object.actual) : "",
			page: isSet$6(object.page) ? globalThis.String(object.page) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.expect !== "") obj.expect = message.expect;
		if (message.actual !== "") obj.actual = message.actual;
		if (message.page !== "") obj.page = message.page;
		return obj;
	},
	create(base) {
		return ReportSessionCorruptRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseReportSessionCorruptRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.expect = object.expect ?? "";
		message.actual = object.actual ?? "";
		message.page = object.page ?? "";
		return message;
	}
};
function createBaseReportSessionCorruptResponse() {
	return {
		common: void 0,
		shareMark: ""
	};
}
const ReportSessionCorruptResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.shareMark !== "") writer.uint32(18).string(message.shareMark);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseReportSessionCorruptResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.shareMark = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$6(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			shareMark: isSet$6(object.shareMark) ? globalThis.String(object.shareMark) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.shareMark !== "") obj.shareMark = message.shareMark;
		return obj;
	},
	create(base) {
		return ReportSessionCorruptResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseReportSessionCorruptResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.shareMark = object.shareMark ?? "";
		return message;
	}
};
function longToNumber$4(int64) {
	const num = globalThis.Number(int64.toString());
	if (num > globalThis.Number.MAX_SAFE_INTEGER) throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
	if (num < globalThis.Number.MIN_SAFE_INTEGER) throw new globalThis.Error("Value is smaller than Number.MIN_SAFE_INTEGER");
	return num;
}
function isSet$6(value) {
	return value !== null && value !== void 0;
}
//#endregion
//#region src/apis/api_report_session_corrupt.ts
var ApiReportSessionCorrupt = class extends BaseApi {
	checkSessionKey({ sk, page }) {
		if (sk === this.session) return null;
		return this.reportSessionCorrupt({
			openId: this.readCachedOpenId(),
			expect: this.session,
			actual: sk,
			page
		});
	}
	async reportSessionCorrupt({ openId, expect, actual, page }) {
		const { shareMark } = await this.invokeProtoApi({
			path: "/media-hub/user/report-session-corrupt",
			requestMeta: ReportSessionCorruptRequest,
			responseMeta: ReportSessionCorruptResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				expect,
				actual,
				page
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => ({ shareMark: response.shareMark })
			}
		});
		this.updateCachedShareMark(shareMark);
	}
};
//#endregion
//#region src/models/client/log/activity.ts
function createBaseOpenApp() {
	return {
		path: void 0,
		scene: void 0,
		chatType: void 0,
		groupEncryptedData: void 0,
		groupIv: void 0
	};
}
const OpenApp = {
	encode(message, writer = new BinaryWriter()) {
		if (message.path !== void 0) writer.uint32(10).string(message.path);
		if (message.scene !== void 0) writer.uint32(16).int32(message.scene);
		if (message.chatType !== void 0) writer.uint32(24).int32(message.chatType);
		if (message.groupEncryptedData !== void 0) writer.uint32(34).string(message.groupEncryptedData);
		if (message.groupIv !== void 0) writer.uint32(42).string(message.groupIv);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseOpenApp();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.path = reader.string();
						continue;
					case 2:
						if (tag !== 16) break;
						message.scene = reader.int32();
						continue;
					case 3:
						if (tag !== 24) break;
						message.chatType = reader.int32();
						continue;
					case 4:
						if (tag !== 34) break;
						message.groupEncryptedData = reader.string();
						continue;
					case 5:
						if (tag !== 42) break;
						message.groupIv = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			path: isSet$5(object.path) ? globalThis.String(object.path) : void 0,
			scene: isSet$5(object.scene) ? globalThis.Number(object.scene) : void 0,
			chatType: isSet$5(object.chatType) ? globalThis.Number(object.chatType) : void 0,
			groupEncryptedData: isSet$5(object.groupEncryptedData) ? globalThis.String(object.groupEncryptedData) : void 0,
			groupIv: isSet$5(object.groupIv) ? globalThis.String(object.groupIv) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.path !== void 0) obj.path = message.path;
		if (message.scene !== void 0) obj.scene = Math.round(message.scene);
		if (message.chatType !== void 0) obj.chatType = Math.round(message.chatType);
		if (message.groupEncryptedData !== void 0) obj.groupEncryptedData = message.groupEncryptedData;
		if (message.groupIv !== void 0) obj.groupIv = message.groupIv;
		return obj;
	},
	create(base) {
		return OpenApp.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseOpenApp();
		message.path = object.path ?? void 0;
		message.scene = object.scene ?? void 0;
		message.chatType = object.chatType ?? void 0;
		message.groupEncryptedData = object.groupEncryptedData ?? void 0;
		message.groupIv = object.groupIv ?? void 0;
		return message;
	}
};
function createBaseOpenPage() {
	return { params: {} };
}
const OpenPage = {
	encode(message, writer = new BinaryWriter()) {
		globalThis.Object.entries(message.params).forEach(([key, value]) => {
			OpenPage_ParamsEntry.encode({
				key,
				value
			}, writer.uint32(10).fork()).join();
		});
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseOpenPage();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1: {
						if (tag !== 10) break;
						const entry1 = OpenPage_ParamsEntry.decode(reader, reader.uint32());
						if (entry1.value !== void 0) message.params[entry1.key] = entry1.value;
						continue;
					}
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return { params: isObject(object.params) ? globalThis.Object.entries(object.params).reduce((acc, [key, value]) => {
			globalThis.Object.defineProperty(acc, key, {
				value: globalThis.String(value),
				enumerable: true,
				configurable: true,
				writable: true
			});
			return acc;
		}, {}) : {} };
	},
	toJSON(message) {
		const obj = {};
		if (message.params) {
			const entries = globalThis.Object.entries(message.params);
			if (entries.length > 0) {
				obj.params = {};
				entries.forEach(([k, v]) => {
					obj.params[k] = v;
				});
			}
		}
		return obj;
	},
	create(base) {
		return OpenPage.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseOpenPage();
		message.params = globalThis.Object.entries(object.params ?? {}).reduce((acc, [key, value]) => {
			if (value !== void 0) acc[key] = globalThis.String(value);
			return acc;
		}, {});
		return message;
	}
};
function createBaseOpenPage_ParamsEntry() {
	return {
		key: "",
		value: ""
	};
}
const OpenPage_ParamsEntry = {
	encode(message, writer = new BinaryWriter()) {
		if (message.key !== "") writer.uint32(10).string(message.key);
		if (message.value !== "") writer.uint32(18).string(message.value);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseOpenPage_ParamsEntry();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.key = reader.string();
						continue;
					case 2:
						if (tag !== 18) break;
						message.value = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			key: isSet$5(object.key) ? globalThis.String(object.key) : "",
			value: isSet$5(object.value) ? globalThis.String(object.value) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.key !== "") obj.key = message.key;
		if (message.value !== "") obj.value = message.value;
		return obj;
	},
	create(base) {
		return OpenPage_ParamsEntry.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseOpenPage_ParamsEntry();
		message.key = object.key ?? "";
		message.value = object.value ?? "";
		return message;
	}
};
function createBaseShareVideo() {
	return {
		mediaId: void 0,
		shareId: "",
		miniAppFrom: void 0,
		shareTarget: ""
	};
}
const ShareVideo = {
	encode(message, writer = new BinaryWriter()) {
		if (message.mediaId !== void 0) writer.uint32(8).int64(message.mediaId);
		if (message.shareId !== "") writer.uint32(18).string(message.shareId);
		if (message.miniAppFrom !== void 0) writer.uint32(26).string(message.miniAppFrom);
		if (message.shareTarget !== "") writer.uint32(34).string(message.shareTarget);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseShareVideo();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 8) break;
						message.mediaId = longToNumber$3(reader.int64());
						continue;
					case 2:
						if (tag !== 18) break;
						message.shareId = reader.string();
						continue;
					case 3:
						if (tag !== 26) break;
						message.miniAppFrom = reader.string();
						continue;
					case 4:
						if (tag !== 34) break;
						message.shareTarget = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			mediaId: isSet$5(object.mediaId) ? globalThis.Number(object.mediaId) : void 0,
			shareId: isSet$5(object.shareId) ? globalThis.String(object.shareId) : "",
			miniAppFrom: isSet$5(object.miniAppFrom) ? globalThis.String(object.miniAppFrom) : void 0,
			shareTarget: isSet$5(object.shareTarget) ? globalThis.String(object.shareTarget) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.mediaId !== void 0) obj.mediaId = Math.round(message.mediaId);
		if (message.shareId !== "") obj.shareId = message.shareId;
		if (message.miniAppFrom !== void 0) obj.miniAppFrom = message.miniAppFrom;
		if (message.shareTarget !== "") obj.shareTarget = message.shareTarget;
		return obj;
	},
	create(base) {
		return ShareVideo.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseShareVideo();
		message.mediaId = object.mediaId ?? void 0;
		message.shareId = object.shareId ?? "";
		message.miniAppFrom = object.miniAppFrom ?? void 0;
		message.shareTarget = object.shareTarget ?? "";
		return message;
	}
};
function createBaseReportMedia() {
	return {
		mediaId: 0,
		reason: ""
	};
}
const ReportMedia = {
	encode(message, writer = new BinaryWriter()) {
		if (message.mediaId !== 0) writer.uint32(8).int64(message.mediaId);
		if (message.reason !== "") writer.uint32(18).string(message.reason);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseReportMedia();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 8) break;
						message.mediaId = longToNumber$3(reader.int64());
						continue;
					case 2:
						if (tag !== 18) break;
						message.reason = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			mediaId: isSet$5(object.mediaId) ? globalThis.Number(object.mediaId) : 0,
			reason: isSet$5(object.reason) ? globalThis.String(object.reason) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.mediaId !== 0) obj.mediaId = Math.round(message.mediaId);
		if (message.reason !== "") obj.reason = message.reason;
		return obj;
	},
	create(base) {
		return ReportMedia.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseReportMedia();
		message.mediaId = object.mediaId ?? 0;
		message.reason = object.reason ?? "";
		return message;
	}
};
function longToNumber$3(int64) {
	const num = globalThis.Number(int64.toString());
	if (num > globalThis.Number.MAX_SAFE_INTEGER) throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
	if (num < globalThis.Number.MIN_SAFE_INTEGER) throw new globalThis.Error("Value is smaller than Number.MIN_SAFE_INTEGER");
	return num;
}
function isObject(value) {
	return typeof value === "object" && value !== null;
}
function isSet$5(value) {
	return value !== null && value !== void 0;
}
//#endregion
//#region src/models/client/log/video.ts
function createBaseVideoView() {
	return { mediaId: 0 };
}
const VideoView = {
	encode(message, writer = new BinaryWriter()) {
		if (message.mediaId !== 0) writer.uint32(8).int64(message.mediaId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseVideoView();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 8) break;
						message.mediaId = longToNumber$2(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return { mediaId: isSet$4(object.mediaId) ? globalThis.Number(object.mediaId) : 0 };
	},
	toJSON(message) {
		const obj = {};
		if (message.mediaId !== 0) obj.mediaId = Math.round(message.mediaId);
		return obj;
	},
	create(base) {
		return VideoView.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseVideoView();
		message.mediaId = object.mediaId ?? 0;
		return message;
	}
};
function createBaseVideoViewFinish() {
	return {
		mediaId: 0,
		complete: false
	};
}
const VideoViewFinish = {
	encode(message, writer = new BinaryWriter()) {
		if (message.mediaId !== 0) writer.uint32(8).int64(message.mediaId);
		if (message.complete !== false) writer.uint32(16).bool(message.complete);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseVideoViewFinish();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 8) break;
						message.mediaId = longToNumber$2(reader.int64());
						continue;
					case 2:
						if (tag !== 16) break;
						message.complete = reader.bool();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			mediaId: isSet$4(object.mediaId) ? globalThis.Number(object.mediaId) : 0,
			complete: isSet$4(object.complete) ? globalThis.Boolean(object.complete) : false
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.mediaId !== 0) obj.mediaId = Math.round(message.mediaId);
		if (message.complete !== false) obj.complete = message.complete;
		return obj;
	},
	create(base) {
		return VideoViewFinish.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseVideoViewFinish();
		message.mediaId = object.mediaId ?? 0;
		message.complete = object.complete ?? false;
		return message;
	}
};
function longToNumber$2(int64) {
	const num = globalThis.Number(int64.toString());
	if (num > globalThis.Number.MAX_SAFE_INTEGER) throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
	if (num < globalThis.Number.MIN_SAFE_INTEGER) throw new globalThis.Error("Value is smaller than Number.MIN_SAFE_INTEGER");
	return num;
}
function isSet$4(value) {
	return value !== null && value !== void 0;
}
//#endregion
//#region src/models/client/log/combined.ts
function createBaseCombinedLog() {
	return {
		base: void 0,
		openApp: void 0,
		openPage: void 0,
		videoView: void 0,
		videoViewFinish: void 0,
		shareVideo: void 0,
		reportMedia: void 0
	};
}
const CombinedLog = {
	encode(message, writer = new BinaryWriter()) {
		if (message.base !== void 0) BaseLogInfo.encode(message.base, writer.uint32(10).fork()).join();
		if (message.openApp !== void 0) OpenApp.encode(message.openApp, writer.uint32(90).fork()).join();
		if (message.openPage !== void 0) OpenPage.encode(message.openPage, writer.uint32(98).fork()).join();
		if (message.videoView !== void 0) VideoView.encode(message.videoView, writer.uint32(106).fork()).join();
		if (message.videoViewFinish !== void 0) VideoViewFinish.encode(message.videoViewFinish, writer.uint32(114).fork()).join();
		if (message.shareVideo !== void 0) ShareVideo.encode(message.shareVideo, writer.uint32(122).fork()).join();
		if (message.reportMedia !== void 0) ReportMedia.encode(message.reportMedia, writer.uint32(130).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseCombinedLog();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.base = BaseLogInfo.decode(reader, reader.uint32());
						continue;
					case 11:
						if (tag !== 90) break;
						message.openApp = OpenApp.decode(reader, reader.uint32());
						continue;
					case 12:
						if (tag !== 98) break;
						message.openPage = OpenPage.decode(reader, reader.uint32());
						continue;
					case 13:
						if (tag !== 106) break;
						message.videoView = VideoView.decode(reader, reader.uint32());
						continue;
					case 14:
						if (tag !== 114) break;
						message.videoViewFinish = VideoViewFinish.decode(reader, reader.uint32());
						continue;
					case 15:
						if (tag !== 122) break;
						message.shareVideo = ShareVideo.decode(reader, reader.uint32());
						continue;
					case 16:
						if (tag !== 130) break;
						message.reportMedia = ReportMedia.decode(reader, reader.uint32());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			base: isSet$3(object.base) ? BaseLogInfo.fromJSON(object.base) : void 0,
			openApp: isSet$3(object.openApp) ? OpenApp.fromJSON(object.openApp) : void 0,
			openPage: isSet$3(object.openPage) ? OpenPage.fromJSON(object.openPage) : void 0,
			videoView: isSet$3(object.videoView) ? VideoView.fromJSON(object.videoView) : void 0,
			videoViewFinish: isSet$3(object.videoViewFinish) ? VideoViewFinish.fromJSON(object.videoViewFinish) : void 0,
			shareVideo: isSet$3(object.shareVideo) ? ShareVideo.fromJSON(object.shareVideo) : void 0,
			reportMedia: isSet$3(object.reportMedia) ? ReportMedia.fromJSON(object.reportMedia) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.base !== void 0) obj.base = BaseLogInfo.toJSON(message.base);
		if (message.openApp !== void 0) obj.openApp = OpenApp.toJSON(message.openApp);
		if (message.openPage !== void 0) obj.openPage = OpenPage.toJSON(message.openPage);
		if (message.videoView !== void 0) obj.videoView = VideoView.toJSON(message.videoView);
		if (message.videoViewFinish !== void 0) obj.videoViewFinish = VideoViewFinish.toJSON(message.videoViewFinish);
		if (message.shareVideo !== void 0) obj.shareVideo = ShareVideo.toJSON(message.shareVideo);
		if (message.reportMedia !== void 0) obj.reportMedia = ReportMedia.toJSON(message.reportMedia);
		return obj;
	},
	create(base) {
		return CombinedLog.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseCombinedLog();
		message.base = object.base !== void 0 && object.base !== null ? BaseLogInfo.fromPartial(object.base) : void 0;
		message.openApp = object.openApp !== void 0 && object.openApp !== null ? OpenApp.fromPartial(object.openApp) : void 0;
		message.openPage = object.openPage !== void 0 && object.openPage !== null ? OpenPage.fromPartial(object.openPage) : void 0;
		message.videoView = object.videoView !== void 0 && object.videoView !== null ? VideoView.fromPartial(object.videoView) : void 0;
		message.videoViewFinish = object.videoViewFinish !== void 0 && object.videoViewFinish !== null ? VideoViewFinish.fromPartial(object.videoViewFinish) : void 0;
		message.shareVideo = object.shareVideo !== void 0 && object.shareVideo !== null ? ShareVideo.fromPartial(object.shareVideo) : void 0;
		message.reportMedia = object.reportMedia !== void 0 && object.reportMedia !== null ? ReportMedia.fromPartial(object.reportMedia) : void 0;
		return message;
	}
};
function createBaseBaseLogInfo() {
	return {
		openId: "",
		session: "",
		page: ""
	};
}
const BaseLogInfo = {
	encode(message, writer = new BinaryWriter()) {
		if (message.openId !== "") writer.uint32(10).string(message.openId);
		if (message.session !== "") writer.uint32(18).string(message.session);
		if (message.page !== "") writer.uint32(26).string(message.page);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseBaseLogInfo();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.openId = reader.string();
						continue;
					case 2:
						if (tag !== 18) break;
						message.session = reader.string();
						continue;
					case 3:
						if (tag !== 26) break;
						message.page = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			openId: isSet$3(object.openId) ? globalThis.String(object.openId) : "",
			session: isSet$3(object.session) ? globalThis.String(object.session) : "",
			page: isSet$3(object.page) ? globalThis.String(object.page) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.openId !== "") obj.openId = message.openId;
		if (message.session !== "") obj.session = message.session;
		if (message.page !== "") obj.page = message.page;
		return obj;
	},
	create(base) {
		return BaseLogInfo.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseBaseLogInfo();
		message.openId = object.openId ?? "";
		message.session = object.session ?? "";
		message.page = object.page ?? "";
		return message;
	}
};
function isSet$3(value) {
	return value !== null && value !== void 0;
}
//#endregion
//#region src/models/client/api/report.ts
function createBaseLogReportRequest() {
	return {
		common: void 0,
		batch: []
	};
}
const LogReportRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		for (const v of message.batch) CombinedLog.encode(v, writer.uint32(18).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseLogReportRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.batch.push(CombinedLog.decode(reader, reader.uint32()));
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$2(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			batch: globalThis.Array.isArray(object?.batch) ? object.batch.map((e) => CombinedLog.fromJSON(e)) : []
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.batch?.length) obj.batch = message.batch.map((e) => CombinedLog.toJSON(e));
		return obj;
	},
	create(base) {
		return LogReportRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseLogReportRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.batch = object.batch?.map((e) => CombinedLog.fromPartial(e)) || [];
		return message;
	}
};
function isSet$2(value) {
	return value !== null && value !== void 0;
}
//#endregion
//#region src/apis/api_report_log.ts
var ApiReportLog = class extends BaseApi {
	async reportOneLog(gen) {
		const batch = gen({
			openId: await this.authedOpenId(),
			session: this.session,
			page: this.cachedPath
		});
		await this.reportLog({ batch: await batch });
	}
	reportLog({ batch }) {
		console.log("reportLog", batch);
		return this.invokeProtoApi({
			method: "PUT",
			path: "/media-hub/report/log",
			requestBody: {
				common: this.obtainCommonApiData(),
				batch
			},
			requestMeta: LogReportRequest,
			responseMeta: CommonResponseData,
			extractor: {
				commonOf: (response) => response,
				bodyOf: () => {}
			}
		});
	}
};
//#endregion
//#region src/apis/api_auth.ts
var ApiAuth = class extends BaseApi {
	async userSessionCheck({ openId }) {
		const { needLogin, shareMark } = await this.invokeProtoApi({
			path: "/media-hub/user/session-check",
			requestBody: {
				common: this.obtainCommonApiData(),
				openId
			},
			requestMeta: SessionCheckRequest,
			responseMeta: SessionCheckResponse,
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => ({
					needLogin: response.needLogin,
					shareMark: response.shareMark
				})
			}
		});
		this.updateCachedShareMark(shareMark);
		return { needLogin };
	}
	async userLogin({ code }) {
		const { openId, shareMark } = await this.invokeProtoApi({
			path: "/media-hub/user/login",
			requestBody: {
				common: this.obtainCommonApiData(),
				code
			},
			requestMeta: LoginRequest,
			responseMeta: LoginResponse,
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => ({
					openId: response.openId,
					shareMark: response.shareMark
				})
			}
		});
		this.updateCachedShareMark(shareMark);
		this.updateCachedOpenId(openId);
	}
};
//#endregion
//#region src/models/client/api/media.ts
function createBaseRankScoreRecommendRequest() {
	return {
		common: void 0,
		openId: "",
		count: 0,
		topId: void 0,
		excludeId: void 0
	};
}
const RankScoreRecommendRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.count !== 0) writer.uint32(24).int32(message.count);
		if (message.topId !== void 0) writer.uint32(32).int64(message.topId);
		if (message.excludeId !== void 0) writer.uint32(40).int64(message.excludeId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseRankScoreRecommendRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.count = reader.int32();
						continue;
					case 4:
						if (tag !== 32) break;
						message.topId = longToNumber$1(reader.int64());
						continue;
					case 5:
						if (tag !== 40) break;
						message.excludeId = longToNumber$1(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$1(object.openId) ? globalThis.String(object.openId) : "",
			count: isSet$1(object.count) ? globalThis.Number(object.count) : 0,
			topId: isSet$1(object.topId) ? globalThis.Number(object.topId) : void 0,
			excludeId: isSet$1(object.excludeId) ? globalThis.Number(object.excludeId) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.count !== 0) obj.count = Math.round(message.count);
		if (message.topId !== void 0) obj.topId = Math.round(message.topId);
		if (message.excludeId !== void 0) obj.excludeId = Math.round(message.excludeId);
		return obj;
	},
	create(base) {
		return RankScoreRecommendRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseRankScoreRecommendRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.count = object.count ?? 0;
		message.topId = object.topId ?? void 0;
		message.excludeId = object.excludeId ?? void 0;
		return message;
	}
};
function createBaseRankScoreRecommendResponse() {
	return {
		common: void 0,
		media: []
	};
}
const RankScoreRecommendResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		for (const v of message.media) MediaAsset.encode(v, writer.uint32(18).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseRankScoreRecommendResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.media.push(MediaAsset.decode(reader, reader.uint32()));
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			media: globalThis.Array.isArray(object?.media) ? object.media.map((e) => MediaAsset.fromJSON(e)) : []
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.media?.length) obj.media = message.media.map((e) => MediaAsset.toJSON(e));
		return obj;
	},
	create(base) {
		return RankScoreRecommendResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseRankScoreRecommendResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.media = object.media?.map((e) => MediaAsset.fromPartial(e)) || [];
		return message;
	}
};
function createBaseFavoriteOperationRequest() {
	return {
		common: void 0,
		openId: "",
		mediaId: 0,
		op: 0
	};
}
const FavoriteOperationRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.mediaId !== 0) writer.uint32(24).int64(message.mediaId);
		if (message.op !== 0) writer.uint32(32).int32(message.op);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseFavoriteOperationRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.mediaId = longToNumber$1(reader.int64());
						continue;
					case 4:
						if (tag !== 32) break;
						message.op = reader.int32();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$1(object.openId) ? globalThis.String(object.openId) : "",
			mediaId: isSet$1(object.mediaId) ? globalThis.Number(object.mediaId) : 0,
			op: isSet$1(object.op) ? addRemoveOpTypeFromJSON(object.op) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.mediaId !== 0) obj.mediaId = Math.round(message.mediaId);
		if (message.op !== 0) obj.op = addRemoveOpTypeToJSON(message.op);
		return obj;
	},
	create(base) {
		return FavoriteOperationRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseFavoriteOperationRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.mediaId = object.mediaId ?? 0;
		message.op = object.op ?? 0;
		return message;
	}
};
function createBaseGetFavoriteRequest() {
	return {
		common: void 0,
		openId: "",
		cursor: void 0,
		count: 0
	};
}
const GetFavoriteRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.cursor !== void 0) writer.uint32(24).int64(message.cursor);
		if (message.count !== 0) writer.uint32(32).int32(message.count);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetFavoriteRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.cursor = longToNumber$1(reader.int64());
						continue;
					case 4:
						if (tag !== 32) break;
						message.count = reader.int32();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$1(object.openId) ? globalThis.String(object.openId) : "",
			cursor: isSet$1(object.cursor) ? globalThis.Number(object.cursor) : void 0,
			count: isSet$1(object.count) ? globalThis.Number(object.count) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.cursor !== void 0) obj.cursor = Math.round(message.cursor);
		if (message.count !== 0) obj.count = Math.round(message.count);
		return obj;
	},
	create(base) {
		return GetFavoriteRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetFavoriteRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.cursor = object.cursor ?? void 0;
		message.count = object.count ?? 0;
		return message;
	}
};
function createBaseGetFavoriteResponse() {
	return {
		common: void 0,
		cursor: 0,
		media: []
	};
}
const GetFavoriteResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.cursor !== 0) writer.uint32(16).int64(message.cursor);
		for (const v of message.media) MediaAsset.encode(v, writer.uint32(26).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetFavoriteResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 16) break;
						message.cursor = longToNumber$1(reader.int64());
						continue;
					case 3:
						if (tag !== 26) break;
						message.media.push(MediaAsset.decode(reader, reader.uint32()));
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			cursor: isSet$1(object.cursor) ? globalThis.Number(object.cursor) : 0,
			media: globalThis.Array.isArray(object?.media) ? object.media.map((e) => MediaAsset.fromJSON(e)) : []
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.cursor !== 0) obj.cursor = Math.round(message.cursor);
		if (message.media?.length) obj.media = message.media.map((e) => MediaAsset.toJSON(e));
		return obj;
	},
	create(base) {
		return GetFavoriteResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetFavoriteResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.cursor = object.cursor ?? 0;
		message.media = object.media?.map((e) => MediaAsset.fromPartial(e)) || [];
		return message;
	}
};
function createBaseGetUserHotRequest() {
	return {
		common: void 0,
		openId: "",
		upId: 0
	};
}
const GetUserHotRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.upId !== 0) writer.uint32(24).int64(message.upId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetUserHotRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.upId = longToNumber$1(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$1(object.openId) ? globalThis.String(object.openId) : "",
			upId: isSet$1(object.upId) ? globalThis.Number(object.upId) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.upId !== 0) obj.upId = Math.round(message.upId);
		return obj;
	},
	create(base) {
		return GetUserHotRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetUserHotRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.upId = object.upId ?? 0;
		return message;
	}
};
function createBaseGetUserHotResponse() {
	return {
		common: void 0,
		media: []
	};
}
const GetUserHotResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		for (const v of message.media) MediaAsset.encode(v, writer.uint32(18).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetUserHotResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.media.push(MediaAsset.decode(reader, reader.uint32()));
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			media: globalThis.Array.isArray(object?.media) ? object.media.map((e) => MediaAsset.fromJSON(e)) : []
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.media?.length) obj.media = message.media.map((e) => MediaAsset.toJSON(e));
		return obj;
	},
	create(base) {
		return GetUserHotResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetUserHotResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.media = object.media?.map((e) => MediaAsset.fromPartial(e)) || [];
		return message;
	}
};
function createBaseCreateDraftRequest() {
	return {
		common: void 0,
		openId: ""
	};
}
const CreateDraftRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseCreateDraftRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$1(object.openId) ? globalThis.String(object.openId) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		return obj;
	},
	create(base) {
		return CreateDraftRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseCreateDraftRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		return message;
	}
};
function createBaseCreateDraftResponse() {
	return {
		common: void 0,
		id: 0
	};
}
const CreateDraftResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.id !== 0) writer.uint32(16).int64(message.id);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseCreateDraftResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 16) break;
						message.id = longToNumber$1(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			id: isSet$1(object.id) ? globalThis.Number(object.id) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.id !== 0) obj.id = Math.round(message.id);
		return obj;
	},
	create(base) {
		return CreateDraftResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseCreateDraftResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.id = object.id ?? 0;
		return message;
	}
};
function createBaseGetDraftMetaRequest() {
	return {
		common: void 0,
		id: 0,
		openId: ""
	};
}
const GetDraftMetaRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.id !== 0) writer.uint32(16).int64(message.id);
		if (message.openId !== "") writer.uint32(26).string(message.openId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetDraftMetaRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 16) break;
						message.id = longToNumber$1(reader.int64());
						continue;
					case 3:
						if (tag !== 26) break;
						message.openId = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			id: isSet$1(object.id) ? globalThis.Number(object.id) : 0,
			openId: isSet$1(object.openId) ? globalThis.String(object.openId) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.id !== 0) obj.id = Math.round(message.id);
		if (message.openId !== "") obj.openId = message.openId;
		return obj;
	},
	create(base) {
		return GetDraftMetaRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetDraftMetaRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.id = object.id ?? 0;
		message.openId = object.openId ?? "";
		return message;
	}
};
function createBaseGetDraftMetaResponse() {
	return {
		common: void 0,
		cover: void 0,
		video: void 0
	};
}
const GetDraftMetaResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.cover !== void 0) OssPutMeta.encode(message.cover, writer.uint32(18).fork()).join();
		if (message.video !== void 0) OssPutMeta.encode(message.video, writer.uint32(26).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetDraftMetaResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.cover = OssPutMeta.decode(reader, reader.uint32());
						continue;
					case 3:
						if (tag !== 26) break;
						message.video = OssPutMeta.decode(reader, reader.uint32());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			cover: isSet$1(object.cover) ? OssPutMeta.fromJSON(object.cover) : void 0,
			video: isSet$1(object.video) ? OssPutMeta.fromJSON(object.video) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.cover !== void 0) obj.cover = OssPutMeta.toJSON(message.cover);
		if (message.video !== void 0) obj.video = OssPutMeta.toJSON(message.video);
		return obj;
	},
	create(base) {
		return GetDraftMetaResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetDraftMetaResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.cover = object.cover !== void 0 && object.cover !== null ? OssPutMeta.fromPartial(object.cover) : void 0;
		message.video = object.video !== void 0 && object.video !== null ? OssPutMeta.fromPartial(object.video) : void 0;
		return message;
	}
};
function createBaseUpdateDraftRequest() {
	return {
		common: void 0,
		openId: "",
		id: 0,
		markCoverReady: void 0,
		markVideoReady: void 0,
		markReviewReady: void 0,
		title: void 0,
		drop: void 0
	};
}
const UpdateDraftRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.id !== 0) writer.uint32(24).int64(message.id);
		if (message.markCoverReady !== void 0) writer.uint32(32).bool(message.markCoverReady);
		if (message.markVideoReady !== void 0) writer.uint32(40).bool(message.markVideoReady);
		if (message.markReviewReady !== void 0) writer.uint32(48).bool(message.markReviewReady);
		if (message.title !== void 0) writer.uint32(58).string(message.title);
		if (message.drop !== void 0) writer.uint32(64).bool(message.drop);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseUpdateDraftRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.id = longToNumber$1(reader.int64());
						continue;
					case 4:
						if (tag !== 32) break;
						message.markCoverReady = reader.bool();
						continue;
					case 5:
						if (tag !== 40) break;
						message.markVideoReady = reader.bool();
						continue;
					case 6:
						if (tag !== 48) break;
						message.markReviewReady = reader.bool();
						continue;
					case 7:
						if (tag !== 58) break;
						message.title = reader.string();
						continue;
					case 8:
						if (tag !== 64) break;
						message.drop = reader.bool();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$1(object.openId) ? globalThis.String(object.openId) : "",
			id: isSet$1(object.id) ? globalThis.Number(object.id) : 0,
			markCoverReady: isSet$1(object.markCoverReady) ? globalThis.Boolean(object.markCoverReady) : void 0,
			markVideoReady: isSet$1(object.markVideoReady) ? globalThis.Boolean(object.markVideoReady) : void 0,
			markReviewReady: isSet$1(object.markReviewReady) ? globalThis.Boolean(object.markReviewReady) : void 0,
			title: isSet$1(object.title) ? globalThis.String(object.title) : void 0,
			drop: isSet$1(object.drop) ? globalThis.Boolean(object.drop) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.id !== 0) obj.id = Math.round(message.id);
		if (message.markCoverReady !== void 0) obj.markCoverReady = message.markCoverReady;
		if (message.markVideoReady !== void 0) obj.markVideoReady = message.markVideoReady;
		if (message.markReviewReady !== void 0) obj.markReviewReady = message.markReviewReady;
		if (message.title !== void 0) obj.title = message.title;
		if (message.drop !== void 0) obj.drop = message.drop;
		return obj;
	},
	create(base) {
		return UpdateDraftRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseUpdateDraftRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.id = object.id ?? 0;
		message.markCoverReady = object.markCoverReady ?? void 0;
		message.markVideoReady = object.markVideoReady ?? void 0;
		message.markReviewReady = object.markReviewReady ?? void 0;
		message.title = object.title ?? void 0;
		message.drop = object.drop ?? void 0;
		return message;
	}
};
function createBaseListDraftRequest() {
	return {
		common: void 0,
		openId: "",
		cursor: void 0,
		count: 0
	};
}
const ListDraftRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.cursor !== void 0) writer.uint32(24).int64(message.cursor);
		if (message.count !== 0) writer.uint32(32).int32(message.count);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseListDraftRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.cursor = longToNumber$1(reader.int64());
						continue;
					case 4:
						if (tag !== 32) break;
						message.count = reader.int32();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$1(object.openId) ? globalThis.String(object.openId) : "",
			cursor: isSet$1(object.cursor) ? globalThis.Number(object.cursor) : void 0,
			count: isSet$1(object.count) ? globalThis.Number(object.count) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.cursor !== void 0) obj.cursor = Math.round(message.cursor);
		if (message.count !== 0) obj.count = Math.round(message.count);
		return obj;
	},
	create(base) {
		return ListDraftRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseListDraftRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.cursor = object.cursor ?? void 0;
		message.count = object.count ?? 0;
		return message;
	}
};
function createBaseListDraftResponse() {
	return {
		common: void 0,
		draft: []
	};
}
const ListDraftResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		for (const v of message.draft) DraftAsset.encode(v, writer.uint32(18).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseListDraftResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.draft.push(DraftAsset.decode(reader, reader.uint32()));
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			draft: globalThis.Array.isArray(object?.draft) ? object.draft.map((e) => DraftAsset.fromJSON(e)) : []
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.draft?.length) obj.draft = message.draft.map((e) => DraftAsset.toJSON(e));
		return obj;
	},
	create(base) {
		return ListDraftResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseListDraftResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.draft = object.draft?.map((e) => DraftAsset.fromPartial(e)) || [];
		return message;
	}
};
function createBaseGetArticleRequest() {
	return {
		common: void 0,
		openId: ""
	};
}
const GetArticleRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetArticleRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet$1(object.openId) ? globalThis.String(object.openId) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		return obj;
	},
	create(base) {
		return GetArticleRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetArticleRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		return message;
	}
};
function createBaseGetArticleResponse() {
	return {
		common: void 0,
		article: []
	};
}
const GetArticleResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		for (const v of message.article) Article.encode(v, writer.uint32(18).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseGetArticleResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.article.push(Article.decode(reader, reader.uint32()));
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet$1(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			article: globalThis.Array.isArray(object?.article) ? object.article.map((e) => Article.fromJSON(e)) : []
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.article?.length) obj.article = message.article.map((e) => Article.toJSON(e));
		return obj;
	},
	create(base) {
		return GetArticleResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseGetArticleResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.article = object.article?.map((e) => Article.fromPartial(e)) || [];
		return message;
	}
};
function longToNumber$1(int64) {
	const num = globalThis.Number(int64.toString());
	if (num > globalThis.Number.MAX_SAFE_INTEGER) throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
	if (num < globalThis.Number.MIN_SAFE_INTEGER) throw new globalThis.Error("Value is smaller than Number.MIN_SAFE_INTEGER");
	return num;
}
function isSet$1(value) {
	return value !== null && value !== void 0;
}
//#endregion
//#region src/apis/api_media.ts
var ApiMedia = class extends BaseApi {
	async recommendByRankScore({ openId, topId, excludeId, count = 10, name = "hot" }) {
		return this.invokeProtoApi({
			path: `/media-hub/recommend/rank/${encodeURIComponent(name)}`,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				count: Math.min(Math.max(count, 1), 10),
				topId,
				excludeId
			},
			requestMeta: RankScoreRecommendRequest,
			responseMeta: RankScoreRecommendResponse,
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => response.media ?? []
			}
		});
	}
	async favoriteOp({ openId, mediaId, op }) {
		let apiOp;
		switch (op) {
			case "add":
				apiOp = 0;
				break;
			case "remove":
				apiOp = 1;
				break;
			default: throw new Error(`Unknown favorite op: $op`);
		}
		return this.invokeProtoApi({
			path: "/media-hub/media/favorite-op",
			requestMeta: FavoriteOperationRequest,
			responseMeta: CommonResponseData,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				mediaId,
				op: apiOp
			},
			extractor: {
				commonOf: (response) => response,
				bodyOf: () => {}
			}
		});
	}
	async getFavorite({ openId, cursor, count = 20 }) {
		return this.invokeProtoApi({
			path: "/media-hub/media/get-favorite",
			requestMeta: GetFavoriteRequest,
			responseMeta: GetFavoriteResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				cursor,
				count
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => ({
					cursor: response.cursor,
					media: response.media
				})
			}
		});
	}
	async createDraft({ openId }) {
		return this.invokeProtoApi({
			path: "/media-hub/media/create-draft",
			requestMeta: CreateDraftRequest,
			responseMeta: CreateDraftResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => response.id
			}
		});
	}
	async updateDraft({ openId, draftId, markCoverReady, markVideoReady, markReviewReady, title, drop }) {
		return this.invokeProtoApi({
			path: "/media-hub/media/update-draft",
			requestMeta: UpdateDraftRequest,
			responseMeta: CommonResponseData,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				id: draftId,
				markCoverReady,
				markVideoReady,
				markReviewReady,
				title,
				drop
			},
			extractor: {
				commonOf: (response) => response,
				bodyOf: () => {}
			}
		});
	}
	async getDraftMeta({ openId, draftId }) {
		return this.invokeProtoApi({
			path: "/media-hub/media/get-draft-meta",
			requestMeta: GetDraftMetaRequest,
			responseMeta: GetDraftMetaResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				id: draftId
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => ({
					cover: response.cover,
					video: response.video
				})
			}
		});
	}
	async listDraft({ openId, cursor, count = 10 }) {
		return this.invokeProtoApi({
			path: "/media-hub/media/list-draft",
			requestMeta: ListDraftRequest,
			responseMeta: ListDraftResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				cursor,
				count
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => response.draft
			}
		});
	}
	async getArticle({ openId }) {
		return this.invokeProtoApi({
			path: "/media-hub/media/get-article",
			requestMeta: GetArticleRequest,
			responseMeta: GetArticleResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => response.article ?? []
			}
		});
	}
};
//#endregion
//#region src/apis/api_user.ts
var ApiUser = class extends BaseApi {
	async userUpdateInfo({ openId, nickname, avatar }) {
		return this.invokeProtoApi({
			path: "/media-hub/user/update-info",
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				nickname,
				avatar
			},
			requestMeta: UpdateUserInfoRequest,
			responseMeta: CommonResponseData,
			extractor: {
				commonOf: (response) => response,
				bodyOf: () => {}
			}
		});
	}
	async getUserInfo(query) {
		return this.invokeProtoApi({
			path: "/media-hub/user/get-info",
			requestBody: {
				common: this.obtainCommonApiData(),
				...query
			},
			requestMeta: GetUserInfoRequest,
			responseMeta: GetUserInfoResponse,
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => response.info
			}
		});
	}
	async followOp({ openId, upId, op }) {
		return this.invokeProtoApi({
			path: "/media-hub/user/follow-op",
			requestMeta: FollowOpRequest,
			responseMeta: CommonResponseData,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				upId,
				op
			},
			extractor: {
				commonOf: (response) => response,
				bodyOf: () => {}
			}
		});
	}
	addFollow({ openId, upId }) {
		return this.followOp({
			openId,
			upId,
			op: 0
		});
	}
	removeFollow({ openId, upId }) {
		return this.followOp({
			openId,
			upId,
			op: 1
		});
	}
	async getHot({ openId, upId }) {
		return this.invokeProtoApi({
			path: "/media-hub/user/get-user-hot",
			requestMeta: GetUserHotRequest,
			responseMeta: GetUserHotResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				upId
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => response.media
			}
		});
	}
	async checkIsFan(props) {
		const { openId, ...query } = props;
		return this.invokeProtoApi({
			path: "/media-hub/user/check-is-fan",
			requestMeta: CheckIsFanRequest,
			responseMeta: CheckIsFanResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				...query
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => response.isFan
			}
		});
	}
	async getFollowList({ openId, cursor, count, hotCount }) {
		return this.invokeProtoApi({
			path: "/media-hub/user/get-follow-list",
			requestMeta: GetFollowListRequest,
			responseMeta: GetFollowListResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				cursor,
				count,
				hotCount
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => response.items
			}
		});
	}
	async shareCheck({ openId, media, shareMark }) {
		const { shareMark: updateShareMark, mediaExists } = await this.invokeProtoApi({
			path: "/media-hub/user/share-check",
			requestMeta: ShareCheckRequest,
			responseMeta: ShareCheckResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				mediaId: media,
				shareMark: shareMark ?? ""
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => ({
					shareMark: response.shareMark,
					mediaExists: response.mediaExists
				})
			}
		});
		this.updateCachedShareMark(updateShareMark);
		return { mediaExists };
	}
};
//#endregion
//#region src/models/client/api/ad.ts
function createBaseAd() {
	return {
		id: 0,
		materialType: "",
		materialUrl: "",
		webpageUrl: ""
	};
}
const Ad = {
	encode(message, writer = new BinaryWriter()) {
		if (message.id !== 0) writer.uint32(8).int64(message.id);
		if (message.materialType !== "") writer.uint32(18).string(message.materialType);
		if (message.materialUrl !== "") writer.uint32(26).string(message.materialUrl);
		if (message.webpageUrl !== "") writer.uint32(34).string(message.webpageUrl);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseAd();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 8) break;
						message.id = longToNumber(reader.int64());
						continue;
					case 2:
						if (tag !== 18) break;
						message.materialType = reader.string();
						continue;
					case 3:
						if (tag !== 26) break;
						message.materialUrl = reader.string();
						continue;
					case 4:
						if (tag !== 34) break;
						message.webpageUrl = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			id: isSet(object.id) ? globalThis.Number(object.id) : 0,
			materialType: isSet(object.materialType) ? globalThis.String(object.materialType) : "",
			materialUrl: isSet(object.materialUrl) ? globalThis.String(object.materialUrl) : "",
			webpageUrl: isSet(object.webpageUrl) ? globalThis.String(object.webpageUrl) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.id !== 0) obj.id = Math.round(message.id);
		if (message.materialType !== "") obj.materialType = message.materialType;
		if (message.materialUrl !== "") obj.materialUrl = message.materialUrl;
		if (message.webpageUrl !== "") obj.webpageUrl = message.webpageUrl;
		return obj;
	},
	create(base) {
		return Ad.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseAd();
		message.id = object.id ?? 0;
		message.materialType = object.materialType ?? "";
		message.materialUrl = object.materialUrl ?? "";
		message.webpageUrl = object.webpageUrl ?? "";
		return message;
	}
};
function createBaseObtainAdRequest() {
	return {
		common: void 0,
		openId: ""
	};
}
const ObtainAdRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseObtainAdRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet(object.openId) ? globalThis.String(object.openId) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		return obj;
	},
	create(base) {
		return ObtainAdRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseObtainAdRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		return message;
	}
};
function createBaseObtainAdResponse() {
	return {
		common: void 0,
		ad: void 0,
		historyId: 0
	};
}
const ObtainAdResponse = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonResponseData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.ad !== void 0) Ad.encode(message.ad, writer.uint32(18).fork()).join();
		if (message.historyId !== 0) writer.uint32(24).int64(message.historyId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseObtainAdResponse();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonResponseData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.ad = Ad.decode(reader, reader.uint32());
						continue;
					case 3:
						if (tag !== 24) break;
						message.historyId = longToNumber(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet(object.common) ? CommonResponseData.fromJSON(object.common) : void 0,
			ad: isSet(object.ad) ? Ad.fromJSON(object.ad) : void 0,
			historyId: isSet(object.historyId) ? globalThis.Number(object.historyId) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonResponseData.toJSON(message.common);
		if (message.ad !== void 0) obj.ad = Ad.toJSON(message.ad);
		if (message.historyId !== 0) obj.historyId = Math.round(message.historyId);
		return obj;
	},
	create(base) {
		return ObtainAdResponse.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseObtainAdResponse();
		message.common = object.common !== void 0 && object.common !== null ? CommonResponseData.fromPartial(object.common) : void 0;
		message.ad = object.ad !== void 0 && object.ad !== null ? Ad.fromPartial(object.ad) : void 0;
		message.historyId = object.historyId ?? 0;
		return message;
	}
};
function createBaseMarkAdExposeRequest() {
	return {
		common: void 0,
		openId: "",
		adId: 0,
		historyId: 0
	};
}
const MarkAdExposeRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.adId !== 0) writer.uint32(24).int64(message.adId);
		if (message.historyId !== 0) writer.uint32(32).int64(message.historyId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseMarkAdExposeRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.adId = longToNumber(reader.int64());
						continue;
					case 4:
						if (tag !== 32) break;
						message.historyId = longToNumber(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet(object.openId) ? globalThis.String(object.openId) : "",
			adId: isSet(object.adId) ? globalThis.Number(object.adId) : 0,
			historyId: isSet(object.historyId) ? globalThis.Number(object.historyId) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.adId !== 0) obj.adId = Math.round(message.adId);
		if (message.historyId !== 0) obj.historyId = Math.round(message.historyId);
		return obj;
	},
	create(base) {
		return MarkAdExposeRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseMarkAdExposeRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.adId = object.adId ?? 0;
		message.historyId = object.historyId ?? 0;
		return message;
	}
};
function createBaseMarkAdConvertRequest() {
	return {
		common: void 0,
		openId: "",
		adId: 0,
		historyId: 0
	};
}
const MarkAdConvertRequest = {
	encode(message, writer = new BinaryWriter()) {
		if (message.common !== void 0) CommonApiData.encode(message.common, writer.uint32(10).fork()).join();
		if (message.openId !== "") writer.uint32(18).string(message.openId);
		if (message.adId !== 0) writer.uint32(24).int64(message.adId);
		if (message.historyId !== 0) writer.uint32(32).int64(message.historyId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const previousRecursionDepth = reader.__tsProtoDecodeDepth ?? 0;
		if (previousRecursionDepth >= 100) throw new globalThis.Error("protobuf decode recursion limit exceeded");
		reader.__tsProtoDecodeDepth = previousRecursionDepth + 1;
		try {
			const end = length === void 0 ? reader.len : reader.pos + length;
			const message = createBaseMarkAdConvertRequest();
			while (reader.pos < end) {
				const tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (tag !== 10) break;
						message.common = CommonApiData.decode(reader, reader.uint32());
						continue;
					case 2:
						if (tag !== 18) break;
						message.openId = reader.string();
						continue;
					case 3:
						if (tag !== 24) break;
						message.adId = longToNumber(reader.int64());
						continue;
					case 4:
						if (tag !== 32) break;
						message.historyId = longToNumber(reader.int64());
						continue;
				}
				if ((tag & 7) === 4 || tag === 0) break;
				reader.skip(tag & 7);
			}
			return message;
		} finally {
			reader.__tsProtoDecodeDepth = previousRecursionDepth;
		}
	},
	fromJSON(object) {
		return {
			common: isSet(object.common) ? CommonApiData.fromJSON(object.common) : void 0,
			openId: isSet(object.openId) ? globalThis.String(object.openId) : "",
			adId: isSet(object.adId) ? globalThis.Number(object.adId) : 0,
			historyId: isSet(object.historyId) ? globalThis.Number(object.historyId) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.common !== void 0) obj.common = CommonApiData.toJSON(message.common);
		if (message.openId !== "") obj.openId = message.openId;
		if (message.adId !== 0) obj.adId = Math.round(message.adId);
		if (message.historyId !== 0) obj.historyId = Math.round(message.historyId);
		return obj;
	},
	create(base) {
		return MarkAdConvertRequest.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseMarkAdConvertRequest();
		message.common = object.common !== void 0 && object.common !== null ? CommonApiData.fromPartial(object.common) : void 0;
		message.openId = object.openId ?? "";
		message.adId = object.adId ?? 0;
		message.historyId = object.historyId ?? 0;
		return message;
	}
};
function longToNumber(int64) {
	const num = globalThis.Number(int64.toString());
	if (num > globalThis.Number.MAX_SAFE_INTEGER) throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
	if (num < globalThis.Number.MIN_SAFE_INTEGER) throw new globalThis.Error("Value is smaller than Number.MIN_SAFE_INTEGER");
	return num;
}
function isSet(value) {
	return value !== null && value !== void 0;
}
//#endregion
//#region src/apis/api_ad.ts
var ApiAd = class extends BaseApi {
	async getAd({ openId }) {
		return this.invokeProtoApi({
			path: "/media-hub/ad/get-ad",
			requestMeta: ObtainAdRequest,
			responseMeta: ObtainAdResponse,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId
			},
			extractor: {
				commonOf: (response) => response.common,
				bodyOf: (response) => response.ad ?? null
			}
		});
	}
	async markAdExpose({ openId, adId, historyId }) {
		return this.invokeNoOutputProtoApi({
			path: "/media-hub/ad/mark-expose",
			requestMeta: MarkAdExposeRequest,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				adId,
				historyId
			}
		});
	}
	async markAdConvert({ openId, adId, historyId }) {
		return this.invokeNoOutputProtoApi({
			path: "/media-hub/ad/mark-convert",
			requestMeta: MarkAdConvertRequest,
			requestBody: {
				common: this.obtainCommonApiData(),
				openId,
				adId,
				historyId
			}
		});
	}
};
//#endregion
//#region src/apis/ext_share.ts
var ExtShare = class extends BaseApi {
	createShare(param) {
		let query = this.generateShareQuery({
			...convertShareItem(param.item),
			shareTarget: param.target
		});
		this.reportOneLog((base) => [{
			base,
			shareVideo: {
				shareId: query.shareId,
				mediaId: query.media,
				shareTarget: query.shareTarget,
				miniAppFrom: param?.from
			}
		}]);
		let uriQuery = `share=${encodeURIShareQuery(query)}`;
		if (param.item.type == "user") uriQuery = `${uriQuery}&uid=${param.item.id}`;
		return {
			title: getShareTitle(param.item),
			path: `${param.path}?${uriQuery}`,
			query: uriQuery,
			imageUrl: getShareImage(param.item)
		};
	}
	parseShareParam(share) {
		return decodeURIShareQuery(share);
	}
	generateShareQuery(props) {
		const now = /* @__PURE__ */ new Date();
		return {
			...props,
			shareTarget: props.shareTarget,
			timestamp: now.getTime(),
			shareId: `${now.getUTCFullYear()}.${now.getUTCMonth()}.${genRandomText()}`,
			sourceUser: this.readCachedOpenId(),
			sourceMark: this.readCachedShareMark(),
			enterOpts: this.getShareEnterOpts()
		};
	}
	getShareEnterOpts() {
		const { path, ...opts } = this.getOpenApp();
		return {
			opts,
			shareId: decodeURIShareQuery(findShareB64Json(path))?.shareId
		};
	}
};
function convertShareItem(item) {
	switch (item.type) {
		case "media": return { media: item.id };
		case "user": return { user: item.id };
		case "app": return {};
		default: throw new Error(`unknown share type`);
	}
}
function getShareTitle(item) {
	switch (item.type) {
		case "media": return item.title;
		case "user": return item.nickname;
		case "app": return item.title;
		default: throw new Error(`unknown share type`);
	}
}
function getShareImage(item) {
	switch (item.type) {
		case "media": return item.cover;
		case "user": return item.avatar;
		case "app": return item.image;
		default: throw new Error(`unknown share type`);
	}
}
function encodeURIShareQuery(query) {
	return base64Encode(utf8Encoding.encodeUtf8(JSON.stringify(query)), "url");
}
function decodeURIShareQuery(share) {
	if (share == null) return;
	try {
		const bin = base64Decode(share);
		const text = utf8Encoding.decodeUtf8(bin);
		return JSON.parse(text);
	} catch (err) {
		console.log("parse share", err);
		return;
	}
}
function findShareB64Json(path) {
	if (path == null) return void 0;
	const pos = path.indexOf("?");
	if (pos < 0) return void 0;
	const parts = path.substring(pos).split("&");
	for (const name in parts) {
		if (name != "share") continue;
		return parts[name];
	}
}
//#endregion
//#region src/index.ts
var Api = class Api extends (0, import_cjs.Mixin)(BaseApi, ApiAuth, ApiReportLog, ApiReportSessionCorrupt, ApiMedia, ApiUser, ApiAd, ExtShare) {
	constructor(appId, base, network) {
		super(appId, base, network);
	}
	static createFetch(appId, base) {
		return new Api(appId, base, new FetchNetwork());
	}
	static createWx(appId, base) {
		return new Api(appId, base, new WxNetwork());
	}
};
//#endregion
export { Api, Article, MediaAsset as Media, BasicUserInfo as UserInfo, genRandomText };

//# sourceMappingURL=index.js.map