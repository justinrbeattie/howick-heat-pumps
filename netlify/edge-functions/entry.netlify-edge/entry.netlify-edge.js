/**
 * @license
 * @builder.io/qwik 0.9.0
 * Copyright Builder.io, Inc. All Rights Reserved.
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
const EMPTY_ARRAY$1 = [];
const EMPTY_OBJ$1 = {};
const isSerializableObject = (v) => {
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || null === proto;
};
const isObject = (v) => v && "object" == typeof v;
const isArray = (v) => Array.isArray(v);
const isString = (v) => "string" == typeof v;
const isFunction = (v) => "function" == typeof v;
const QSlot = "q:slot";
const isPromise = (value) => value instanceof Promise;
const safeCall = (call, thenFn, rejectFn) => {
  try {
    const promise = call();
    return isPromise(promise) ? promise.then(thenFn, rejectFn) : thenFn(promise);
  } catch (e) {
    return rejectFn(e);
  }
};
const then = (promise, thenFn) => isPromise(promise) ? promise.then(thenFn) : thenFn(promise);
const promiseAll = (promises) => promises.some(isPromise) ? Promise.all(promises) : promises;
const isNotNullable = (v) => null != v;
const delay = (timeout) => new Promise((resolve) => {
  setTimeout(resolve, timeout);
});
let _context;
const tryGetInvokeContext = () => {
  if (!_context) {
    const context = "undefined" != typeof document && document && document.__q_context__;
    if (!context) {
      return;
    }
    return isArray(context) ? document.__q_context__ = newInvokeContextFromTuple(context) : context;
  }
  return _context;
};
const getInvokeContext = () => {
  const ctx = tryGetInvokeContext();
  if (!ctx) {
    throw qError(QError_useMethodOutsideContext);
  }
  return ctx;
};
const useInvokeContext = () => {
  const ctx = getInvokeContext();
  if ("qRender" !== ctx.$event$) {
    throw qError(QError_useInvokeContext);
  }
  return ctx.$hostElement$, ctx.$waitOn$, ctx.$renderCtx$, ctx.$subscriber$, ctx;
};
const useBindInvokeContext = (callback) => {
  if (null == callback) {
    return callback;
  }
  const ctx = getInvokeContext();
  return (...args) => invoke(ctx, callback.bind(void 0, ...args));
};
const invoke = (context, fn, ...args) => {
  const previousContext = _context;
  let returnValue;
  try {
    _context = context, returnValue = fn.apply(null, args);
  } finally {
    _context = previousContext;
  }
  return returnValue;
};
const waitAndRun = (ctx, callback) => {
  const waitOn = ctx.$waitOn$;
  if (0 === waitOn.length) {
    const result = callback();
    isPromise(result) && waitOn.push(result);
  } else {
    waitOn.push(Promise.all(waitOn).then(callback));
  }
};
const newInvokeContextFromTuple = (context) => {
  const element = context[0];
  return newInvokeContext(void 0, element, context[1], context[2]);
};
const newInvokeContext = (hostElement, element, event, url) => ({
  $seq$: 0,
  $hostElement$: hostElement,
  $element$: element,
  $event$: event,
  $url$: url,
  $qrl$: void 0,
  $props$: void 0,
  $renderCtx$: void 0,
  $subscriber$: void 0,
  $waitOn$: void 0
});
const getWrappingContainer = (el) => el.closest("[q\\:container]");
const isNode = (value) => value && "number" == typeof value.nodeType;
const isDocument = (value) => value && 9 === value.nodeType;
const isElement = (value) => 1 === value.nodeType;
const isQwikElement = (value) => isNode(value) && (1 === value.nodeType || 111 === value.nodeType);
const isVirtualElement = (value) => 111 === value.nodeType;
const isModule = (module) => isObject(module) && "Module" === module[Symbol.toStringTag];
let _platform = (() => {
  const moduleCache = /* @__PURE__ */ new Map();
  return {
    isServer: false,
    importSymbol(containerEl, url, symbolName) {
      const urlDoc = ((doc, containerEl2, url2) => {
        var _a2;
        const baseURI = doc.baseURI;
        const base = new URL((_a2 = containerEl2.getAttribute("q:base")) != null ? _a2 : baseURI, baseURI);
        return new URL(url2, base);
      })(containerEl.ownerDocument, containerEl, url).toString();
      const urlCopy = new URL(urlDoc);
      urlCopy.hash = "", urlCopy.search = "";
      const importURL = urlCopy.href;
      const mod = moduleCache.get(importURL);
      return mod ? mod[symbolName] : import(importURL).then((mod2) => {
        return module = mod2, mod2 = Object.values(module).find(isModule) || module, moduleCache.set(importURL, mod2), mod2[symbolName];
        var module;
      });
    },
    raf: (fn) => new Promise((resolve) => {
      requestAnimationFrame(() => {
        resolve(fn());
      });
    }),
    nextTick: (fn) => new Promise((resolve) => {
      setTimeout(() => {
        resolve(fn());
      });
    }),
    chunkForSymbol() {
    }
  };
})();
const setPlatform = (plt) => _platform = plt;
const getPlatform = () => _platform;
const isServer$1 = () => _platform.isServer;
const directSetAttribute = (el, prop, value) => el.setAttribute(prop, value);
const directGetAttribute = (el, prop) => el.getAttribute(prop);
const ON_PROP_REGEX = /^(on|window:|document:)/;
const isOnProp = (prop) => prop.endsWith("$") && ON_PROP_REGEX.test(prop);
const addQRLListener = (listenersMap, prop, input) => {
  let existingListeners = listenersMap[prop];
  existingListeners || (listenersMap[prop] = existingListeners = []);
  for (const qrl of input) {
    const hash = qrl.$hash$;
    let replaced = false;
    for (let i = 0; i < existingListeners.length; i++) {
      if (existingListeners[i].$hash$ === hash) {
        existingListeners.splice(i, 1, qrl), replaced = true;
        break;
      }
    }
    replaced || existingListeners.push(qrl);
  }
  return false;
};
const setEvent = (listenerMap, prop, input) => {
  prop.endsWith("$");
  const qrls = isArray(input) ? input.map(ensureQrl) : [ensureQrl(input)];
  return prop = normalizeOnProp(prop.slice(0, -1)), addQRLListener(listenerMap, prop, qrls), prop;
};
const ensureQrl = (value) => isQrl$1(value) ? value : $(value);
const getDomListeners = (ctx, containerEl) => {
  const attributes3 = ctx.$element$.attributes;
  const listeners = {};
  for (let i = 0; i < attributes3.length; i++) {
    const { name, value } = attributes3.item(i);
    if (name.startsWith("on:") || name.startsWith("on-window:") || name.startsWith("on-document:")) {
      let array = listeners[name];
      array || (listeners[name] = array = []);
      const urls = value.split("\n");
      for (const url of urls) {
        const qrl = parseQRL(url, containerEl);
        qrl.$capture$ && inflateQrl(qrl, ctx), array.push(qrl);
      }
    }
  }
  return listeners;
};
const useSequentialScope = () => {
  const ctx = useInvokeContext();
  const i = ctx.$seq$;
  const hostElement = ctx.$hostElement$;
  const elCtx = getContext(hostElement);
  const seq = elCtx.$seq$ ? elCtx.$seq$ : elCtx.$seq$ = [];
  return ctx.$seq$++, {
    get: seq[i],
    set: (value) => seq[i] = value,
    i,
    ctx
  };
};
const useCleanupQrl = (unmountFn) => {
  const { get, set: set2, i, ctx } = useSequentialScope();
  if (!get) {
    const el = ctx.$hostElement$;
    const watch = new Watch(WatchFlagsIsCleanup, i, el, unmountFn, void 0);
    const elCtx = getContext(el);
    set2(true), elCtx.$watches$ || (elCtx.$watches$ = []), elCtx.$watches$.push(watch);
  }
};
const useOn = (event, eventQrl) => _useOn(`on-${event}`, eventQrl);
const _useOn = (eventName, eventQrl) => {
  const invokeCtx = useInvokeContext();
  const ctx = getContext(invokeCtx.$hostElement$);
  addQRLListener(ctx.li, normalizeOnProp(eventName), [eventQrl]);
};
const getDocument = (node) => "undefined" != typeof document ? document : 9 === node.nodeType ? node : node.ownerDocument;
const jsx = (type, props, key) => {
  const processed = null == key ? null : String(key);
  return new JSXNodeImpl(type, props, processed);
};
class JSXNodeImpl {
  constructor(type, props, key = null) {
    this.type = type, this.props = props, this.key = key;
  }
}
const isJSXNode = (n) => n instanceof JSXNodeImpl;
const Fragment$1 = (props) => props.children;
const SkipRender = Symbol("skip render");
const SSRComment = () => null;
const Virtual = (props) => props.children;
const InternalSSRStream = () => null;
const fromCamelToKebabCase = (text) => text.replace(/([A-Z])/g, "-$1").toLowerCase();
const setAttribute = (ctx, el, prop, value) => {
  ctx ? ctx.$operations$.push({
    $operation$: _setAttribute,
    $args$: [el, prop, value]
  }) : _setAttribute(el, prop, value);
};
const _setAttribute = (el, prop, value) => {
  if (null == value || false === value) {
    el.removeAttribute(prop);
  } else {
    const str = true === value ? "" : String(value);
    directSetAttribute(el, prop, str);
  }
};
const setProperty = (ctx, node, key, value) => {
  ctx ? ctx.$operations$.push({
    $operation$: _setProperty,
    $args$: [node, key, value]
  }) : _setProperty(node, key, value);
};
const _setProperty = (node, key, value) => {
  try {
    node[key] = value;
  } catch (err) {
    logError(codeToText(QError_setProperty), {
      node,
      key,
      value
    }, err);
  }
};
const createElement = (doc, expectTag, isSvg) => isSvg ? doc.createElementNS(SVG_NS, expectTag) : doc.createElement(expectTag);
const insertBefore = (ctx, parent2, newChild, refChild) => (ctx.$operations$.push({
  $operation$: directInsertBefore,
  $args$: [parent2, newChild, refChild || null]
}), newChild);
const appendChild = (ctx, parent2, newChild) => (ctx.$operations$.push({
  $operation$: directAppendChild,
  $args$: [parent2, newChild]
}), newChild);
const appendHeadStyle = (ctx, styleTask) => {
  ctx.$containerState$.$styleIds$.add(styleTask.styleId), ctx.$postOperations$.push({
    $operation$: _appendHeadStyle,
    $args$: [ctx.$containerState$.$containerEl$, styleTask]
  });
};
const _setClasslist = (elm, toRemove, toAdd) => {
  const classList = elm.classList;
  classList.remove(...toRemove), classList.add(...toAdd);
};
const _appendHeadStyle = (containerEl, styleTask) => {
  const doc = getDocument(containerEl);
  const isDoc = doc.documentElement === containerEl;
  const headEl = doc.head;
  const style = doc.createElement("style");
  directSetAttribute(style, "q:style", styleTask.styleId), style.textContent = styleTask.content, isDoc && headEl ? directAppendChild(headEl, style) : directInsertBefore(containerEl, style, containerEl.firstChild);
};
const removeNode = (ctx, el) => {
  ctx.$operations$.push({
    $operation$: _removeNode,
    $args$: [el, ctx]
  });
};
const _removeNode = (el, staticCtx) => {
  const parent2 = el.parentElement;
  if (parent2) {
    if (1 === el.nodeType || 111 === el.nodeType) {
      const subsManager = staticCtx.$containerState$.$subsManager$;
      cleanupTree(el, staticCtx, subsManager, true);
    }
    directRemoveChild(parent2, el);
  }
};
const createTemplate = (doc, slotName) => {
  const template = createElement(doc, "q:template", false);
  return directSetAttribute(template, QSlot, slotName), directSetAttribute(template, "hidden", ""), directSetAttribute(template, "aria-hidden", "true"), template;
};
const executeDOMRender = (ctx) => {
  for (const op of ctx.$operations$) {
    op.$operation$.apply(void 0, op.$args$);
  }
  resolveSlotProjection(ctx);
};
const getKey = (el) => directGetAttribute(el, "q:key");
const setKey = (el, key) => {
  null !== key && directSetAttribute(el, "q:key", key);
};
const resolveSlotProjection = (ctx) => {
  const subsManager = ctx.$containerState$.$subsManager$;
  ctx.$rmSlots$.forEach((slotEl) => {
    const key = getKey(slotEl);
    const slotChildren = getChildren(slotEl, "root");
    if (slotChildren.length > 0) {
      const sref = slotEl.getAttribute("q:sref");
      const hostCtx = ctx.$roots$.find((r) => r.$id$ === sref);
      if (hostCtx) {
        const template = createTemplate(ctx.$doc$, key);
        const hostElm = hostCtx.$element$;
        for (const child of slotChildren) {
          directAppendChild(template, child);
        }
        directInsertBefore(hostElm, template, hostElm.firstChild);
      } else {
        cleanupTree(slotEl, ctx, subsManager, false);
      }
    }
  }), ctx.$addSlots$.forEach(([slotEl, hostElm]) => {
    const key = getKey(slotEl);
    const template = Array.from(hostElm.childNodes).find((node) => isSlotTemplate(node) && node.getAttribute(QSlot) === key);
    template && (getChildren(template, "root").forEach((child) => {
      directAppendChild(slotEl, child);
    }), template.remove());
  });
};
class VirtualElementImpl {
  constructor(open, close) {
    this.open = open, this.close = close, this._qc_ = null, this.nodeType = 111, this.localName = ":virtual", this.nodeName = ":virtual";
    const doc = this.ownerDocument = open.ownerDocument;
    this.template = createElement(doc, "template", false), this.attributes = ((str) => {
      if (!str) {
        return /* @__PURE__ */ new Map();
      }
      const attributes3 = str.split(" ");
      return new Map(attributes3.map((attr) => {
        const index2 = attr.indexOf("=");
        return index2 >= 0 ? [attr.slice(0, index2), (s = attr.slice(index2 + 1), s.replace(/\+/g, " "))] : [attr, ""];
        var s;
      }));
    })(open.data.slice(3)), open.data.startsWith("qv "), open.__virtual = this;
  }
  insertBefore(node, ref) {
    const parent2 = this.parentElement;
    if (parent2) {
      const ref2 = ref || this.close;
      parent2.insertBefore(node, ref2);
    } else {
      this.template.insertBefore(node, ref);
    }
    return node;
  }
  remove() {
    const parent2 = this.parentElement;
    if (parent2) {
      const ch = Array.from(this.childNodes);
      this.template.childElementCount, parent2.removeChild(this.open), this.template.append(...ch), parent2.removeChild(this.close);
    }
  }
  appendChild(node) {
    return this.insertBefore(node, null);
  }
  insertBeforeTo(newParent, child) {
    const ch = Array.from(this.childNodes);
    newParent.insertBefore(this.open, child);
    for (const c of ch) {
      newParent.insertBefore(c, child);
    }
    newParent.insertBefore(this.close, child), this.template.childElementCount;
  }
  appendTo(newParent) {
    this.insertBeforeTo(newParent, null);
  }
  removeChild(child) {
    this.parentElement ? this.parentElement.removeChild(child) : this.template.removeChild(child);
  }
  getAttribute(prop) {
    var _a2;
    return (_a2 = this.attributes.get(prop)) != null ? _a2 : null;
  }
  hasAttribute(prop) {
    return this.attributes.has(prop);
  }
  setAttribute(prop, value) {
    this.attributes.set(prop, value), this.open.data = updateComment(this.attributes);
  }
  removeAttribute(prop) {
    this.attributes.delete(prop), this.open.data = updateComment(this.attributes);
  }
  matches(_) {
    return false;
  }
  compareDocumentPosition(other) {
    return this.open.compareDocumentPosition(other);
  }
  closest(query) {
    const parent2 = this.parentElement;
    return parent2 ? parent2.closest(query) : null;
  }
  querySelectorAll(query) {
    const result = [];
    return getChildren(this, "elements").forEach((el) => {
      isQwikElement(el) && (el.matches(query) && result.push(el), result.concat(Array.from(el.querySelectorAll(query))));
    }), result;
  }
  querySelector(query) {
    for (const el of this.childNodes) {
      if (isElement(el)) {
        if (el.matches(query)) {
          return el;
        }
        const v = el.querySelector(query);
        if (null !== v) {
          return v;
        }
      }
    }
    return null;
  }
  get firstChild() {
    if (this.parentElement) {
      const first = this.open.nextSibling;
      return first === this.close ? null : first;
    }
    return this.template.firstChild;
  }
  get nextSibling() {
    return this.close.nextSibling;
  }
  get previousSibling() {
    return this.open.previousSibling;
  }
  get childNodes() {
    if (!this.parentElement) {
      return this.template.childNodes;
    }
    const nodes = [];
    let node = this.open;
    for (; (node = node.nextSibling) && node !== this.close; ) {
      nodes.push(node);
    }
    return nodes;
  }
  get isConnected() {
    return this.open.isConnected;
  }
  get parentElement() {
    return this.open.parentElement;
  }
}
const updateComment = (attributes3) => `qv ${((map) => {
  const attributes4 = [];
  return map.forEach((value, key) => {
    var s;
    value ? attributes4.push(`${key}=${s = value, s.replace(/ /g, "+")}`) : attributes4.push(`${key}`);
  }), attributes4.join(" ");
})(attributes3)}`;
const processVirtualNodes = (node) => {
  if (null == node) {
    return null;
  }
  if (isComment(node)) {
    const virtual = getVirtualElement(node);
    if (virtual) {
      return virtual;
    }
  }
  return node;
};
const getVirtualElement = (open) => {
  const virtual = open.__virtual;
  if (virtual) {
    return virtual;
  }
  if (open.data.startsWith("qv ")) {
    const close = findClose(open);
    return new VirtualElementImpl(open, close);
  }
  return null;
};
const findClose = (open) => {
  let node = open.nextSibling;
  let stack = 1;
  for (; node; ) {
    if (isComment(node)) {
      if (node.data.startsWith("qv ")) {
        stack++;
      } else if ("/qv" === node.data && (stack--, 0 === stack)) {
        return node;
      }
    }
    node = node.nextSibling;
  }
  throw new Error("close not found");
};
const isComment = (node) => 8 === node.nodeType;
const getRootNode = (node) => null == node ? null : isVirtualElement(node) ? node.open : node;
const createContext$1 = (name) => Object.freeze({
  id: fromCamelToKebabCase(name)
});
const useContextProvider = (context, newValue) => {
  const { get, set: set2, ctx } = useSequentialScope();
  if (void 0 !== get) {
    return;
  }
  const hostElement = ctx.$hostElement$;
  const hostCtx = getContext(hostElement);
  let contexts = hostCtx.$contexts$;
  contexts || (hostCtx.$contexts$ = contexts = /* @__PURE__ */ new Map()), contexts.set(context.id, newValue), set2(true);
};
const useContext = (context, defaultValue) => {
  const { get, set: set2, ctx } = useSequentialScope();
  if (void 0 !== get) {
    return get;
  }
  const value = resolveContext(context, ctx.$hostElement$, ctx.$renderCtx$);
  if (void 0 !== value) {
    return set2(value);
  }
  if (void 0 !== defaultValue) {
    return set2(defaultValue);
  }
  throw qError(QError_notFoundContext, context.id);
};
const resolveContext = (context, hostElement, rctx) => {
  const contextID = context.id;
  if (rctx) {
    const contexts = rctx.$localStack$;
    for (let i = contexts.length - 1; i >= 0; i--) {
      const ctx = contexts[i];
      if (hostElement = ctx.$element$, ctx.$contexts$) {
        const found = ctx.$contexts$.get(contextID);
        if (found) {
          return found;
        }
      }
    }
  }
  if (hostElement.closest) {
    const value = queryContextFromDom(hostElement, contextID);
    if (void 0 !== value) {
      return value;
    }
  }
};
const queryContextFromDom = (hostElement, contextId) => {
  var _a2;
  let element = hostElement;
  for (; element; ) {
    let node = element;
    let virtual;
    for (; node && (virtual = findVirtual(node)); ) {
      const contexts = (_a2 = tryGetContext(virtual)) == null ? void 0 : _a2.$contexts$;
      if (contexts && contexts.has(contextId)) {
        return contexts.get(contextId);
      }
      node = virtual;
    }
    element = element.parentElement;
  }
};
const findVirtual = (el) => {
  let node = el;
  let stack = 1;
  for (; node = node.previousSibling; ) {
    if (isComment(node)) {
      if ("/qv" === node.data) {
        stack++;
      } else if (node.data.startsWith("qv ") && (stack--, 0 === stack)) {
        return getVirtualElement(node);
      }
    }
  }
  return null;
};
const ERROR_CONTEXT = createContext$1("qk-error");
const handleError = (err, hostElement, rctx) => {
  if (isServer$1()) {
    throw err;
  }
  {
    const errorStore = resolveContext(ERROR_CONTEXT, hostElement, rctx);
    if (void 0 === errorStore) {
      throw err;
    }
    errorStore.error = err;
  }
};
const executeComponent = (rctx, elCtx) => {
  elCtx.$dirty$ = false, elCtx.$mounted$ = true, elCtx.$slots$ = [];
  const hostElement = elCtx.$element$;
  const onRenderQRL = elCtx.$renderQrl$;
  const props = elCtx.$props$;
  const newCtx = pushRenderContext(rctx, elCtx);
  const invocatinContext = newInvokeContext(hostElement, void 0, "qRender");
  const waitOn = invocatinContext.$waitOn$ = [];
  newCtx.$cmpCtx$ = elCtx, invocatinContext.$subscriber$ = hostElement, invocatinContext.$renderCtx$ = rctx, onRenderQRL.$setContainer$(rctx.$static$.$containerState$.$containerEl$);
  const onRenderFn = onRenderQRL.getFn(invocatinContext);
  return safeCall(() => onRenderFn(props), (jsxNode) => (elCtx.$attachedListeners$ = false, waitOn.length > 0 ? Promise.all(waitOn).then(() => elCtx.$dirty$ ? executeComponent(rctx, elCtx) : {
    node: jsxNode,
    rctx: newCtx
  }) : elCtx.$dirty$ ? executeComponent(rctx, elCtx) : {
    node: jsxNode,
    rctx: newCtx
  }), (err) => (handleError(err, hostElement, rctx), {
    node: SkipRender,
    rctx: newCtx
  }));
};
const createRenderContext = (doc, containerState) => ({
  $static$: {
    $doc$: doc,
    $containerState$: containerState,
    $hostElements$: /* @__PURE__ */ new Set(),
    $operations$: [],
    $postOperations$: [],
    $roots$: [],
    $addSlots$: [],
    $rmSlots$: []
  },
  $cmpCtx$: void 0,
  $localStack$: []
});
const pushRenderContext = (ctx, elCtx) => ({
  $static$: ctx.$static$,
  $cmpCtx$: ctx.$cmpCtx$,
  $localStack$: ctx.$localStack$.concat(elCtx)
});
const serializeClass = (obj) => {
  if (isString(obj)) {
    return obj;
  }
  if (isObject(obj)) {
    if (isArray(obj)) {
      return obj.join(" ");
    }
    {
      let buffer = "";
      let previous = false;
      for (const key of Object.keys(obj)) {
        obj[key] && (previous && (buffer += " "), buffer += key, previous = true);
      }
      return buffer;
    }
  }
  return "";
};
const parseClassListRegex = /\s/;
const parseClassList = (value) => value ? value.split(parseClassListRegex) : EMPTY_ARRAY$1;
const stringifyStyle = (obj) => {
  if (null == obj) {
    return "";
  }
  if ("object" == typeof obj) {
    if (isArray(obj)) {
      throw qError(QError_stringifyClassOrStyle, obj, "style");
    }
    {
      const chunks = [];
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          value && chunks.push(fromCamelToKebabCase(key) + ":" + value);
        }
      }
      return chunks.join(";");
    }
  }
  return String(obj);
};
const getNextIndex = (ctx) => intToStr(ctx.$static$.$containerState$.$elementIndex$++);
const setQId = (rctx, ctx) => {
  const id = getNextIndex(rctx);
  ctx.$id$ = id, ctx.$element$.setAttribute("q:id", id);
};
const SKIPS_PROPS = [QSlot, "q:renderFn", "children"];
const serializeSStyle = (scopeIds) => {
  const value = scopeIds.join(" ");
  if (value.length > 0) {
    return value;
  }
};
const renderComponent = (rctx, ctx, flags) => {
  const justMounted = !ctx.$mounted$;
  const hostElement = ctx.$element$;
  const containerState = rctx.$static$.$containerState$;
  return containerState.$hostsStaging$.delete(hostElement), containerState.$subsManager$.$clearSub$(hostElement), then(executeComponent(rctx, ctx), (res) => {
    const staticCtx = rctx.$static$;
    const newCtx = res.rctx;
    const invocatinContext = newInvokeContext(hostElement);
    if (staticCtx.$hostElements$.add(hostElement), invocatinContext.$subscriber$ = hostElement, invocatinContext.$renderCtx$ = newCtx, justMounted) {
      if (ctx.$appendStyles$) {
        for (const style of ctx.$appendStyles$) {
          appendHeadStyle(staticCtx, style);
        }
      }
      if (ctx.$scopeIds$) {
        const value = serializeSStyle(ctx.$scopeIds$);
        value && hostElement.setAttribute("q:sstyle", value);
      }
    }
    const processedJSXNode = processData$1(res.node, invocatinContext);
    return then(processedJSXNode, (processedJSXNode2) => {
      const newVdom = wrapJSX(hostElement, processedJSXNode2);
      const oldVdom = getVdom(ctx);
      return then(visitJsxNode(newCtx, oldVdom, newVdom, flags), () => {
        ctx.$vdom$ = newVdom;
      });
    });
  });
};
const getVdom = (ctx) => (ctx.$vdom$ || (ctx.$vdom$ = domToVnode(ctx.$element$)), ctx.$vdom$);
class ProcessedJSXNodeImpl {
  constructor($type$, $props$, $children$, $key$) {
    this.$type$ = $type$, this.$props$ = $props$, this.$children$ = $children$, this.$key$ = $key$, this.$elm$ = null, this.$text$ = "";
  }
}
const wrapJSX = (element, input) => {
  const children3 = void 0 === input ? EMPTY_ARRAY$1 : isArray(input) ? input : [input];
  const node = new ProcessedJSXNodeImpl(":virtual", {}, children3, null);
  return node.$elm$ = element, node;
};
const processData$1 = (node, invocationContext) => {
  if (null != node && "boolean" != typeof node) {
    if (isString(node) || "number" == typeof node) {
      const newNode = new ProcessedJSXNodeImpl("#text", EMPTY_OBJ$1, EMPTY_ARRAY$1, null);
      return newNode.$text$ = String(node), newNode;
    }
    if (isJSXNode(node)) {
      return ((node2, invocationContext2) => {
        const key = null != node2.key ? String(node2.key) : null;
        const nodeType = node2.type;
        const props = node2.props;
        const originalChildren = props.children;
        let textType = "";
        if (isString(nodeType)) {
          textType = nodeType;
        } else {
          if (nodeType !== Virtual) {
            if (isFunction(nodeType)) {
              const res = invoke(invocationContext2, nodeType, props, node2.key);
              return processData$1(res, invocationContext2);
            }
            throw qError(QError_invalidJsxNodeType, nodeType);
          }
          textType = ":virtual";
        }
        let children3 = EMPTY_ARRAY$1;
        return null != originalChildren ? then(processData$1(originalChildren, invocationContext2), (result) => (void 0 !== result && (children3 = isArray(result) ? result : [result]), new ProcessedJSXNodeImpl(textType, props, children3, key))) : new ProcessedJSXNodeImpl(textType, props, children3, key);
      })(node, invocationContext);
    }
    if (isArray(node)) {
      const output = promiseAll(node.flatMap((n) => processData$1(n, invocationContext)));
      return then(output, (array) => array.flat(100).filter(isNotNullable));
    }
    return isPromise(node) ? node.then((node2) => processData$1(node2, invocationContext)) : node === SkipRender ? new ProcessedJSXNodeImpl(":skipRender", EMPTY_OBJ$1, EMPTY_ARRAY$1, null) : void logWarn("A unsupported value was passed to the JSX, skipping render. Value:", node);
  }
};
const SVG_NS = "http://www.w3.org/2000/svg";
const CHILDREN_PLACEHOLDER = [];
const visitJsxNode = (ctx, oldVnode, newVnode, flags) => smartUpdateChildren(ctx, oldVnode, newVnode, "root", flags);
const smartUpdateChildren = (ctx, oldVnode, newVnode, mode, flags) => {
  oldVnode.$elm$;
  const ch = newVnode.$children$;
  if (1 === ch.length && ":skipRender" === ch[0].$type$) {
    return;
  }
  const elm = oldVnode.$elm$;
  oldVnode.$children$ === CHILDREN_PLACEHOLDER && "HEAD" === elm.nodeName && (mode = "head", flags |= 2);
  const oldCh = getVnodeChildren(oldVnode, mode);
  return oldCh.length > 0 && ch.length > 0 ? updateChildren(ctx, elm, oldCh, ch, flags) : ch.length > 0 ? addVnodes(ctx, elm, null, ch, 0, ch.length - 1, flags) : oldCh.length > 0 ? removeVnodes(ctx.$static$, oldCh, 0, oldCh.length - 1) : void 0;
};
const getVnodeChildren = (vnode, mode) => {
  const oldCh = vnode.$children$;
  const elm = vnode.$elm$;
  return oldCh === CHILDREN_PLACEHOLDER ? vnode.$children$ = getChildrenVnodes(elm, mode) : oldCh;
};
const updateChildren = (ctx, parentElm, oldCh, newCh, flags) => {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let oldStartVnode = oldCh[0];
  let oldEndVnode = oldCh[oldEndIdx];
  let newEndIdx = newCh.length - 1;
  let newStartVnode = newCh[0];
  let newEndVnode = newCh[newEndIdx];
  let oldKeyToIdx;
  let idxInOld;
  let elmToMove;
  const results = [];
  const staticCtx = ctx.$static$;
  for (; oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx; ) {
    if (null == oldStartVnode) {
      oldStartVnode = oldCh[++oldStartIdx];
    } else if (null == oldEndVnode) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (null == newStartVnode) {
      newStartVnode = newCh[++newStartIdx];
    } else if (null == newEndVnode) {
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      results.push(patchVnode(ctx, oldStartVnode, newStartVnode, flags)), oldStartVnode = oldCh[++oldStartIdx], newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      results.push(patchVnode(ctx, oldEndVnode, newEndVnode, flags)), oldEndVnode = oldCh[--oldEndIdx], newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      oldStartVnode.$elm$, oldEndVnode.$elm$, results.push(patchVnode(ctx, oldStartVnode, newEndVnode, flags)), insertBefore(staticCtx, parentElm, oldStartVnode.$elm$, oldEndVnode.$elm$.nextSibling), oldStartVnode = oldCh[++oldStartIdx], newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      oldStartVnode.$elm$, oldEndVnode.$elm$, results.push(patchVnode(ctx, oldEndVnode, newStartVnode, flags)), insertBefore(staticCtx, parentElm, oldEndVnode.$elm$, oldStartVnode.$elm$), oldEndVnode = oldCh[--oldEndIdx], newStartVnode = newCh[++newStartIdx];
    } else {
      if (void 0 === oldKeyToIdx && (oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)), idxInOld = oldKeyToIdx[newStartVnode.$key$], void 0 === idxInOld) {
        const newElm = createElm(ctx, newStartVnode, flags);
        results.push(then(newElm, (newElm2) => {
          insertBefore(staticCtx, parentElm, newElm2, oldStartVnode.$elm$);
        }));
      } else if (elmToMove = oldCh[idxInOld], isTagName(elmToMove, newStartVnode.$type$)) {
        results.push(patchVnode(ctx, elmToMove, newStartVnode, flags)), oldCh[idxInOld] = void 0, elmToMove.$elm$, insertBefore(staticCtx, parentElm, elmToMove.$elm$, oldStartVnode.$elm$);
      } else {
        const newElm = createElm(ctx, newStartVnode, flags);
        results.push(then(newElm, (newElm2) => {
          insertBefore(staticCtx, parentElm, newElm2, oldStartVnode.$elm$);
        }));
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }
  if (newStartIdx <= newEndIdx) {
    const before = null == newCh[newEndIdx + 1] ? null : newCh[newEndIdx + 1].$elm$;
    results.push(addVnodes(ctx, parentElm, before, newCh, newStartIdx, newEndIdx, flags));
  }
  let wait = promiseAll(results);
  return oldStartIdx <= oldEndIdx && (wait = then(wait, () => {
    removeVnodes(staticCtx, oldCh, oldStartIdx, oldEndIdx);
  })), wait;
};
const getCh = (elm, filter) => {
  const end = isVirtualElement(elm) ? elm.close : null;
  const nodes = [];
  let node = elm.firstChild;
  for (; (node = processVirtualNodes(node)) && (filter(node) && nodes.push(node), node = node.nextSibling, node !== end); ) {
  }
  return nodes;
};
const getChildren = (elm, mode) => {
  switch (mode) {
    case "root":
      return getCh(elm, isChildComponent);
    case "head":
      return getCh(elm, isHeadChildren);
    case "elements":
      return getCh(elm, isQwikElement);
  }
};
const getChildrenVnodes = (elm, mode) => getChildren(elm, mode).map(getVnodeFromEl);
const getVnodeFromEl = (el) => {
  var _a2, _b;
  return isElement(el) ? (_b = (_a2 = tryGetContext(el)) == null ? void 0 : _a2.$vdom$) != null ? _b : domToVnode(el) : domToVnode(el);
};
const domToVnode = (node) => {
  if (isQwikElement(node)) {
    const props = isVirtualElement(node) ? EMPTY_OBJ$1 : getProps(node);
    const t = new ProcessedJSXNodeImpl(node.localName, props, CHILDREN_PLACEHOLDER, getKey(node));
    return t.$elm$ = node, t;
  }
  if (3 === node.nodeType) {
    const t = new ProcessedJSXNodeImpl(node.nodeName, {}, CHILDREN_PLACEHOLDER, null);
    return t.$text$ = node.data, t.$elm$ = node, t;
  }
  throw new Error("invalid node");
};
const getProps = (node) => {
  const props = {};
  const attributes3 = node.attributes;
  const len = attributes3.length;
  for (let i = 0; i < len; i++) {
    const attr = attributes3.item(i);
    const name = attr.name;
    name.includes(":") || (props[name] = "class" === name ? parseDomClass(attr.value) : attr.value);
  }
  return props;
};
const parseDomClass = (value) => parseClassList(value).filter((c) => !c.startsWith("\u2B50\uFE0F")).join(" ");
const isHeadChildren = (node) => {
  const type = node.nodeType;
  return 1 === type ? node.hasAttribute("q:head") : 111 === type;
};
const isSlotTemplate = (node) => "Q:TEMPLATE" === node.nodeName;
const isChildComponent = (node) => {
  const type = node.nodeType;
  if (3 === type || 111 === type) {
    return true;
  }
  if (1 !== type) {
    return false;
  }
  const nodeName = node.nodeName;
  return "Q:TEMPLATE" !== nodeName && ("HEAD" !== nodeName || node.hasAttribute("q:head"));
};
const patchVnode = (rctx, oldVnode, newVnode, flags) => {
  oldVnode.$type$, newVnode.$type$;
  const elm = oldVnode.$elm$;
  const tag = newVnode.$type$;
  const staticCtx = rctx.$static$;
  const isVirtual = ":virtual" === tag;
  if (newVnode.$elm$ = elm, "#text" === tag) {
    return void (oldVnode.$text$ !== newVnode.$text$ && setProperty(staticCtx, elm, "data", newVnode.$text$));
  }
  let isSvg = !!(1 & flags);
  isSvg || "svg" !== tag || (flags |= 1, isSvg = true);
  const props = newVnode.$props$;
  const isComponent = isVirtual && "q:renderFn" in props;
  const elCtx = getContext(elm);
  if (!isComponent) {
    const listenerMap = updateProperties(elCtx, staticCtx, oldVnode.$props$, props, isSvg);
    const currentComponent = rctx.$cmpCtx$;
    if (currentComponent && !currentComponent.$attachedListeners$) {
      currentComponent.$attachedListeners$ = true;
      for (const key of Object.keys(currentComponent.li)) {
        addQRLListener(listenerMap, key, currentComponent.li[key]), addGlobalListener(staticCtx, elm, key);
      }
    }
    for (const key of Object.keys(listenerMap)) {
      setAttribute(staticCtx, elm, key, serializeQRLs(listenerMap[key], elCtx));
    }
    if (isSvg && "foreignObject" === newVnode.$type$ && (flags &= -2, isSvg = false), isVirtual && "q:s" in props) {
      const currentComponent2 = rctx.$cmpCtx$;
      return currentComponent2.$slots$, void currentComponent2.$slots$.push(newVnode);
    }
    if (void 0 !== props[dangerouslySetInnerHTML]) {
      return;
    }
    if (isVirtual && "qonce" in props) {
      return;
    }
    return smartUpdateChildren(rctx, oldVnode, newVnode, "root", flags);
  }
  let needsRender = setComponentProps$1(elCtx, rctx, props);
  return needsRender || elCtx.$renderQrl$ || elCtx.$element$.hasAttribute("q:id") || (setQId(rctx, elCtx), elCtx.$renderQrl$ = props["q:renderFn"], elCtx.$renderQrl$, needsRender = true), needsRender ? then(renderComponent(rctx, elCtx, flags), () => renderContentProjection(rctx, elCtx, newVnode, flags)) : renderContentProjection(rctx, elCtx, newVnode, flags);
};
const renderContentProjection = (rctx, hostCtx, vnode, flags) => {
  const newChildren = vnode.$children$;
  const staticCtx = rctx.$static$;
  const splittedNewChidren = ((input) => {
    var _a2;
    const output = {};
    for (const item of input) {
      const key = getSlotName(item);
      ((_a2 = output[key]) != null ? _a2 : output[key] = new ProcessedJSXNodeImpl(":virtual", {
        "q:s": ""
      }, [], key)).$children$.push(item);
    }
    return output;
  })(newChildren);
  const slotRctx = pushRenderContext(rctx, hostCtx);
  const slotMaps = getSlotMap(hostCtx);
  for (const key of Object.keys(slotMaps.slots)) {
    if (!splittedNewChidren[key]) {
      const slotEl = slotMaps.slots[key];
      const oldCh = getChildrenVnodes(slotEl, "root");
      if (oldCh.length > 0) {
        const slotCtx = tryGetContext(slotEl);
        slotCtx && slotCtx.$vdom$ && (slotCtx.$vdom$.$children$ = []), removeVnodes(staticCtx, oldCh, 0, oldCh.length - 1);
      }
    }
  }
  for (const key of Object.keys(slotMaps.templates)) {
    const templateEl = slotMaps.templates[key];
    templateEl && (splittedNewChidren[key] && !slotMaps.slots[key] || (removeNode(staticCtx, templateEl), slotMaps.templates[key] = void 0));
  }
  return promiseAll(Object.keys(splittedNewChidren).map((key) => {
    const newVdom = splittedNewChidren[key];
    const slotElm = getSlotElement(staticCtx, slotMaps, hostCtx.$element$, key);
    const slotCtx = getContext(slotElm);
    const oldVdom = getVdom(slotCtx);
    return slotCtx.$vdom$ = newVdom, newVdom.$elm$ = slotElm, smartUpdateChildren(slotRctx, oldVdom, newVdom, "root", flags);
  }));
};
const addVnodes = (ctx, parentElm, before, vnodes, startIdx, endIdx, flags) => {
  const promises = [];
  let hasPromise = false;
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx];
    const elm = createElm(ctx, ch, flags);
    promises.push(elm), isPromise(elm) && (hasPromise = true);
  }
  if (hasPromise) {
    return Promise.all(promises).then((children3) => insertChildren(ctx.$static$, parentElm, children3, before));
  }
  insertChildren(ctx.$static$, parentElm, promises, before);
};
const insertChildren = (ctx, parentElm, children3, before) => {
  for (const child of children3) {
    insertBefore(ctx, parentElm, child, before);
  }
};
const removeVnodes = (ctx, nodes, startIdx, endIdx) => {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = nodes[startIdx];
    ch && (ch.$elm$, removeNode(ctx, ch.$elm$));
  }
};
const getSlotElement = (ctx, slotMaps, parentEl, slotName) => {
  const slotEl = slotMaps.slots[slotName];
  if (slotEl) {
    return slotEl;
  }
  const templateEl = slotMaps.templates[slotName];
  if (templateEl) {
    return templateEl;
  }
  const template = createTemplate(ctx.$doc$, slotName);
  return ((ctx2, parent2, newChild) => {
    ctx2.$operations$.push({
      $operation$: directInsertBefore,
      $args$: [parent2, newChild, parent2.firstChild]
    });
  })(ctx, parentEl, template), slotMaps.templates[slotName] = template, template;
};
const getSlotName = (node) => {
  var _a2;
  return (_a2 = node.$props$[QSlot]) != null ? _a2 : "";
};
const createElm = (rctx, vnode, flags) => {
  const tag = vnode.$type$;
  const doc = rctx.$static$.$doc$;
  if ("#text" === tag) {
    return vnode.$elm$ = ((doc2, text) => doc2.createTextNode(text))(doc, vnode.$text$);
  }
  let elm;
  let isHead = !!(2 & flags);
  let isSvg = !!(1 & flags);
  isSvg || "svg" !== tag || (flags |= 1, isSvg = true);
  const isVirtual = ":virtual" === tag;
  const props = vnode.$props$;
  const isComponent = "q:renderFn" in props;
  const staticCtx = rctx.$static$;
  isVirtual ? elm = ((doc2) => {
    const open = doc2.createComment("qv ");
    const close = doc2.createComment("/qv");
    return new VirtualElementImpl(open, close);
  })(doc) : "head" === tag ? (elm = doc.head, flags |= 2, isHead = true) : (elm = createElement(doc, tag, isSvg), flags &= -3), vnode.$elm$ = elm, isSvg && "foreignObject" === tag && (isSvg = false, flags &= -2);
  const elCtx = getContext(elm);
  if (isComponent) {
    setKey(elm, vnode.$key$);
    const renderQRL = props["q:renderFn"];
    return setComponentProps$1(elCtx, rctx, props), setQId(rctx, elCtx), elCtx.$renderQrl$ = renderQRL, then(renderComponent(rctx, elCtx, flags), () => {
      let children4 = vnode.$children$;
      if (0 === children4.length) {
        return elm;
      }
      1 === children4.length && ":skipRender" === children4[0].$type$ && (children4 = children4[0].$children$);
      const slotRctx = pushRenderContext(rctx, elCtx);
      const slotMap = getSlotMap(elCtx);
      const elements = children4.map((ch) => createElm(slotRctx, ch, flags));
      return then(promiseAll(elements), () => {
        for (const node of children4) {
          node.$elm$, appendChild(staticCtx, getSlotElement(staticCtx, slotMap, elm, getSlotName(node)), node.$elm$);
        }
        return elm;
      });
    });
  }
  const currentComponent = rctx.$cmpCtx$;
  const isSlot = isVirtual && "q:s" in props;
  const hasRef = !isVirtual && "ref" in props;
  const listenerMap = setProperties(staticCtx, elCtx, props, isSvg);
  if (currentComponent && !isVirtual) {
    const scopedIds = currentComponent.$scopeIds$;
    if (scopedIds && scopedIds.forEach((styleId) => {
      elm.classList.add(styleId);
    }), !currentComponent.$attachedListeners$) {
      currentComponent.$attachedListeners$ = true;
      for (const eventName of Object.keys(currentComponent.li)) {
        addQRLListener(listenerMap, eventName, currentComponent.li[eventName]);
      }
    }
  }
  isSlot ? (currentComponent.$slots$, setKey(elm, vnode.$key$), directSetAttribute(elm, "q:sref", currentComponent.$id$), currentComponent.$slots$.push(vnode), staticCtx.$addSlots$.push([elm, currentComponent.$element$])) : setKey(elm, vnode.$key$);
  {
    const listeners = Object.keys(listenerMap);
    isHead && !isVirtual && directSetAttribute(elm, "q:head", ""), (listeners.length > 0 || hasRef) && setQId(rctx, elCtx);
    for (const key of listeners) {
      setAttribute(staticCtx, elm, key, serializeQRLs(listenerMap[key], elCtx));
    }
  }
  if (void 0 !== props[dangerouslySetInnerHTML]) {
    return elm;
  }
  let children3 = vnode.$children$;
  if (0 === children3.length) {
    return elm;
  }
  1 === children3.length && ":skipRender" === children3[0].$type$ && (children3 = children3[0].$children$);
  const promises = children3.map((ch) => createElm(rctx, ch, flags));
  return then(promiseAll(promises), () => {
    for (const node of children3) {
      node.$elm$, appendChild(rctx.$static$, elm, node.$elm$);
    }
    return elm;
  });
};
const getSlotMap = (ctx) => {
  var _a2, _b;
  const slotsArray = ((ctx2) => ctx2.$slots$ || (ctx2.$element$.parentElement, ctx2.$slots$ = readDOMSlots(ctx2)))(ctx);
  const slots = {};
  const templates = {};
  const t = Array.from(ctx.$element$.childNodes).filter(isSlotTemplate);
  for (const vnode of slotsArray) {
    vnode.$elm$, slots[(_a2 = vnode.$key$) != null ? _a2 : ""] = vnode.$elm$;
  }
  for (const elm of t) {
    templates[(_b = directGetAttribute(elm, QSlot)) != null ? _b : ""] = elm;
  }
  return {
    slots,
    templates
  };
};
const readDOMSlots = (ctx) => ((el, prop, value) => {
  const walker = ((el2, prop2, value2) => el2.ownerDocument.createTreeWalker(el2, 128, {
    acceptNode(c) {
      const virtual = getVirtualElement(c);
      return virtual && directGetAttribute(virtual, "q:sref") === value2 ? 1 : 2;
    }
  }))(el, 0, value);
  const pars = [];
  let currentNode = null;
  for (; currentNode = walker.nextNode(); ) {
    pars.push(getVirtualElement(currentNode));
  }
  return pars;
})(ctx.$element$.parentElement, 0, ctx.$id$).map(domToVnode);
const checkBeforeAssign = (ctx, elm, prop, newValue) => (prop in elm && elm[prop] !== newValue && setProperty(ctx, elm, prop, newValue), true);
const dangerouslySetInnerHTML = "dangerouslySetInnerHTML";
const PROP_HANDLER_MAP = {
  style: (ctx, elm, _, newValue) => (setProperty(ctx, elm.style, "cssText", stringifyStyle(newValue)), true),
  class: (ctx, elm, _, newValue, oldValue) => {
    const oldClasses = parseClassList(oldValue);
    const newClasses = parseClassList(newValue);
    return ((ctx2, elm2, toRemove, toAdd) => {
      ctx2 ? ctx2.$operations$.push({
        $operation$: _setClasslist,
        $args$: [elm2, toRemove, toAdd]
      }) : _setClasslist(elm2, toRemove, toAdd);
    })(ctx, elm, oldClasses.filter((c) => c && !newClasses.includes(c)), newClasses.filter((c) => c && !oldClasses.includes(c))), true;
  },
  value: checkBeforeAssign,
  checked: checkBeforeAssign,
  [dangerouslySetInnerHTML]: (ctx, elm, _, newValue) => (dangerouslySetInnerHTML in elm ? setProperty(ctx, elm, dangerouslySetInnerHTML, newValue) : "innerHTML" in elm && setProperty(ctx, elm, "innerHTML", newValue), true),
  innerHTML: () => true
};
const updateProperties = (elCtx, staticCtx, oldProps, newProps, isSvg) => {
  const keys = getKeys(oldProps, newProps);
  const listenersMap = elCtx.li = {};
  if (0 === keys.length) {
    return listenersMap;
  }
  const elm = elCtx.$element$;
  for (let key of keys) {
    if ("children" === key) {
      continue;
    }
    let newValue = newProps[key];
    "className" === key && (newProps.class = newValue, key = "class"), "class" === key && (newProps.class = newValue = serializeClass(newValue));
    const oldValue = oldProps[key];
    if (oldValue === newValue) {
      continue;
    }
    if ("ref" === key) {
      newValue.current = elm;
      continue;
    }
    if (isOnProp(key)) {
      setEvent(listenersMap, key, newValue);
      continue;
    }
    const exception = PROP_HANDLER_MAP[key];
    exception && exception(staticCtx, elm, key, newValue, oldValue) || (isSvg || !(key in elm) ? setAttribute(staticCtx, elm, key, newValue) : setProperty(staticCtx, elm, key, newValue));
  }
  return listenersMap;
};
const getKeys = (oldProps, newProps) => {
  const keys = Object.keys(newProps);
  return keys.push(...Object.keys(oldProps).filter((p) => !keys.includes(p))), keys;
};
const addGlobalListener = (staticCtx, elm, prop) => {
  try {
    window.qwikevents && window.qwikevents.push(getEventName(prop));
  } catch (err) {
  }
};
const setProperties = (rctx, elCtx, newProps, isSvg) => {
  const elm = elCtx.$element$;
  const keys = Object.keys(newProps);
  const listenerMap = elCtx.li;
  if (0 === keys.length) {
    return listenerMap;
  }
  for (let key of keys) {
    if ("children" === key) {
      continue;
    }
    let newValue = newProps[key];
    if ("className" === key && (newProps.class = newValue, key = "class"), "class" === key && (newProps.class = newValue = serializeClass(newValue)), "ref" === key) {
      newValue.current = elm;
      continue;
    }
    if (isOnProp(key)) {
      addGlobalListener(rctx, elm, setEvent(listenerMap, key, newValue));
      continue;
    }
    const exception = PROP_HANDLER_MAP[key];
    exception && exception(rctx, elm, key, newValue, void 0) || (isSvg || !(key in elm) ? setAttribute(rctx, elm, key, newValue) : setProperty(rctx, elm, key, newValue));
  }
  return listenerMap;
};
const setComponentProps$1 = (ctx, rctx, expectProps) => {
  const keys = Object.keys(expectProps);
  if (0 === keys.length) {
    return false;
  }
  const qwikProps = getPropsMutator(ctx, rctx.$static$.$containerState$);
  for (const key of keys) {
    SKIPS_PROPS.includes(key) || qwikProps.set(key, expectProps[key]);
  }
  return ctx.$dirty$;
};
const cleanupTree = (parent2, rctx, subsManager, stopSlots) => {
  if (stopSlots && parent2.hasAttribute("q:s")) {
    return void rctx.$rmSlots$.push(parent2);
  }
  cleanupElement(parent2, subsManager);
  const ch = getChildren(parent2, "elements");
  for (const child of ch) {
    cleanupTree(child, rctx, subsManager, stopSlots);
  }
};
const cleanupElement = (el, subsManager) => {
  const ctx = tryGetContext(el);
  ctx && cleanupContext(ctx, subsManager);
};
const directAppendChild = (parent2, child) => {
  isVirtualElement(child) ? child.appendTo(parent2) : parent2.appendChild(child);
};
const directRemoveChild = (parent2, child) => {
  isVirtualElement(child) ? child.remove() : parent2.removeChild(child);
};
const directInsertBefore = (parent2, child, ref) => {
  isVirtualElement(child) ? child.insertBeforeTo(parent2, getRootNode(ref)) : parent2.insertBefore(child, getRootNode(ref));
};
const createKeyToOldIdx = (children3, beginIdx, endIdx) => {
  const map = {};
  for (let i = beginIdx; i <= endIdx; ++i) {
    const key = children3[i].$key$;
    null != key && (map[key] = i);
  }
  return map;
};
const sameVnode = (vnode1, vnode2) => vnode1.$type$ === vnode2.$type$ && vnode1.$key$ === vnode2.$key$;
const isTagName = (elm, tagName4) => elm.$type$ === tagName4;
const useLexicalScope = () => {
  const context = getInvokeContext();
  let qrl = context.$qrl$;
  if (qrl) {
    qrl.$captureRef$;
  } else {
    const el = context.$element$;
    const container = getWrappingContainer(el);
    const ctx = getContext(el);
    qrl = parseQRL(decodeURIComponent(String(context.$url$)), container), resumeIfNeeded(container), inflateQrl(qrl, ctx);
  }
  return qrl.$captureRef$;
};
const notifyWatch = (watch, containerState) => {
  watch.$flags$ & WatchFlagsIsDirty || (watch.$flags$ |= WatchFlagsIsDirty, void 0 !== containerState.$hostsRendering$ ? (containerState.$renderPromise$, containerState.$watchStaging$.add(watch)) : (containerState.$watchNext$.add(watch), scheduleFrame(containerState)));
};
const scheduleFrame = (containerState) => (void 0 === containerState.$renderPromise$ && (containerState.$renderPromise$ = getPlatform().nextTick(() => renderMarked(containerState))), containerState.$renderPromise$);
const _hW = () => {
  const [watch] = useLexicalScope();
  notifyWatch(watch, getContainerState(getWrappingContainer(watch.$el$)));
};
const renderMarked = async (containerState) => {
  const hostsRendering = containerState.$hostsRendering$ = new Set(containerState.$hostsNext$);
  containerState.$hostsNext$.clear(), await executeWatchesBefore(containerState), containerState.$hostsStaging$.forEach((host) => {
    hostsRendering.add(host);
  }), containerState.$hostsStaging$.clear();
  const doc = getDocument(containerState.$containerEl$);
  const renderingQueue = Array.from(hostsRendering);
  sortNodes(renderingQueue);
  const ctx = createRenderContext(doc, containerState);
  const staticCtx = ctx.$static$;
  for (const el of renderingQueue) {
    if (!staticCtx.$hostElements$.has(el)) {
      const elCtx = getContext(el);
      if (elCtx.$renderQrl$) {
        el.isConnected, staticCtx.$roots$.push(elCtx);
        try {
          await renderComponent(ctx, elCtx, getFlags(el.parentElement));
        } catch (err) {
          logError(err);
        }
      }
    }
  }
  return staticCtx.$operations$.push(...staticCtx.$postOperations$), 0 === staticCtx.$operations$.length ? void postRendering(containerState, staticCtx) : getPlatform().raf(() => {
    (({ $static$: ctx2 }) => {
      executeDOMRender(ctx2);
    })(ctx), postRendering(containerState, staticCtx);
  });
};
const getFlags = (el) => {
  let flags = 0;
  return el && (el.namespaceURI === SVG_NS && (flags |= 1), "HEAD" === el.tagName && (flags |= 2)), flags;
};
const postRendering = async (containerState, ctx) => {
  await executeWatchesAfter(containerState, (watch, stage) => 0 != (watch.$flags$ & WatchFlagsIsEffect) && (!stage || ctx.$hostElements$.has(watch.$el$))), containerState.$hostsStaging$.forEach((el) => {
    containerState.$hostsNext$.add(el);
  }), containerState.$hostsStaging$.clear(), containerState.$hostsRendering$ = void 0, containerState.$renderPromise$ = void 0, containerState.$hostsNext$.size + containerState.$watchNext$.size > 0 && scheduleFrame(containerState);
};
const executeWatchesBefore = async (containerState) => {
  const resourcesPromises = [];
  const containerEl = containerState.$containerEl$;
  const watchPromises = [];
  const isWatch = (watch) => 0 != (watch.$flags$ & WatchFlagsIsWatch);
  const isResourceWatch2 = (watch) => 0 != (watch.$flags$ & WatchFlagsIsResource);
  containerState.$watchNext$.forEach((watch) => {
    isWatch(watch) && (watchPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)), containerState.$watchNext$.delete(watch)), isResourceWatch2(watch) && (resourcesPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)), containerState.$watchNext$.delete(watch));
  });
  do {
    if (containerState.$watchStaging$.forEach((watch) => {
      isWatch(watch) ? watchPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)) : isResourceWatch2(watch) ? resourcesPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)) : containerState.$watchNext$.add(watch);
    }), containerState.$watchStaging$.clear(), watchPromises.length > 0) {
      const watches = await Promise.all(watchPromises);
      sortWatches(watches), await Promise.all(watches.map((watch) => runSubscriber(watch, containerState))), watchPromises.length = 0;
    }
  } while (containerState.$watchStaging$.size > 0);
  if (resourcesPromises.length > 0) {
    const resources = await Promise.all(resourcesPromises);
    sortWatches(resources), resources.forEach((watch) => runSubscriber(watch, containerState));
  }
};
const executeWatchesAfter = async (containerState, watchPred) => {
  const watchPromises = [];
  const containerEl = containerState.$containerEl$;
  containerState.$watchNext$.forEach((watch) => {
    watchPred(watch, false) && (watchPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)), containerState.$watchNext$.delete(watch));
  });
  do {
    if (containerState.$watchStaging$.forEach((watch) => {
      watchPred(watch, true) ? watchPromises.push(then(watch.$qrl$.$resolveLazy$(containerEl), () => watch)) : containerState.$watchNext$.add(watch);
    }), containerState.$watchStaging$.clear(), watchPromises.length > 0) {
      const watches = await Promise.all(watchPromises);
      sortWatches(watches), await Promise.all(watches.map((watch) => runSubscriber(watch, containerState))), watchPromises.length = 0;
    }
  } while (containerState.$watchStaging$.size > 0);
};
const sortNodes = (elements) => {
  elements.sort((a2, b) => 2 & a2.compareDocumentPosition(getRootNode(b)) ? 1 : -1);
};
const sortWatches = (watches) => {
  watches.sort((a2, b) => a2.$el$ === b.$el$ ? a2.$index$ < b.$index$ ? -1 : 1 : 0 != (2 & a2.$el$.compareDocumentPosition(getRootNode(b.$el$))) ? 1 : -1);
};
const CONTAINER_STATE = Symbol("ContainerState");
const getContainerState = (containerEl) => {
  let set2 = containerEl[CONTAINER_STATE];
  return set2 || (containerEl[CONTAINER_STATE] = set2 = createContainerState(containerEl)), set2;
};
const createContainerState = (containerEl) => {
  const containerState = {
    $containerEl$: containerEl,
    $proxyMap$: /* @__PURE__ */ new WeakMap(),
    $subsManager$: null,
    $watchNext$: /* @__PURE__ */ new Set(),
    $watchStaging$: /* @__PURE__ */ new Set(),
    $hostsNext$: /* @__PURE__ */ new Set(),
    $hostsStaging$: /* @__PURE__ */ new Set(),
    $renderPromise$: void 0,
    $hostsRendering$: void 0,
    $envData$: {},
    $elementIndex$: 0,
    $styleIds$: /* @__PURE__ */ new Set(),
    $mutableProps$: false
  };
  return containerState.$subsManager$ = createSubscriptionManager(containerState), containerState;
};
const createSubscriptionManager = (containerState) => {
  const objToSubs = /* @__PURE__ */ new Map();
  const subsToObjs = /* @__PURE__ */ new Map();
  const tryGetLocal = (obj) => (getProxyTarget(obj), objToSubs.get(obj));
  const trackSubToObj = (subscriber, map) => {
    let set2 = subsToObjs.get(subscriber);
    set2 || subsToObjs.set(subscriber, set2 = /* @__PURE__ */ new Set()), set2.add(map);
  };
  const manager = {
    $tryGetLocal$: tryGetLocal,
    $getLocal$: (obj, initialMap) => {
      let local = tryGetLocal(obj);
      if (local)
        ;
      else {
        const map = initialMap || /* @__PURE__ */ new Map();
        map.forEach((_, key) => {
          trackSubToObj(key, map);
        }), objToSubs.set(obj, local = {
          $subs$: map,
          $addSub$(subscriber, key) {
            if (null == key) {
              map.set(subscriber, null);
            } else {
              let sub = map.get(subscriber);
              void 0 === sub && map.set(subscriber, sub = /* @__PURE__ */ new Set()), sub && sub.add(key);
            }
            trackSubToObj(subscriber, map);
          },
          $notifySubs$(key) {
            map.forEach((value, subscriber) => {
              null !== value && key && !value.has(key) || ((subscriber2, containerState2) => {
                isQwikElement(subscriber2) ? ((hostElement, containerState3) => {
                  const server = isServer$1();
                  server || resumeIfNeeded(containerState3.$containerEl$);
                  const ctx = getContext(hostElement);
                  if (ctx.$renderQrl$, !ctx.$dirty$) {
                    if (ctx.$dirty$ = true, void 0 !== containerState3.$hostsRendering$) {
                      containerState3.$renderPromise$, containerState3.$hostsStaging$.add(hostElement);
                    } else {
                      if (server) {
                        return void logWarn();
                      }
                      containerState3.$hostsNext$.add(hostElement), scheduleFrame(containerState3);
                    }
                  }
                })(subscriber2, containerState2) : notifyWatch(subscriber2, containerState2);
              })(subscriber, containerState);
            });
          }
        });
      }
      return local;
    },
    $clearSub$: (sub) => {
      const subs = subsToObjs.get(sub);
      subs && (subs.forEach((s) => {
        s.delete(sub);
      }), subsToObjs.delete(sub), subs.clear());
    }
  };
  return manager;
};
const _pauseFromContexts = async (allContexts, containerState) => {
  const collector = createCollector(containerState);
  const listeners = [];
  for (const ctx of allContexts) {
    const el = ctx.$element$;
    const ctxLi = ctx.li;
    for (const key of Object.keys(ctxLi)) {
      for (const qrl of ctxLi[key]) {
        const captured = qrl.$captureRef$;
        if (captured) {
          for (const obj of captured) {
            collectValue(obj, collector, true);
          }
        }
        isElement(el) && listeners.push({
          key,
          qrl,
          el,
          eventName: getEventName(key)
        });
      }
    }
    ctx.$watches$ && collector.$watches$.push(...ctx.$watches$);
  }
  if (0 === listeners.length) {
    return {
      state: {
        ctx: {},
        objs: [],
        subs: []
      },
      objs: [],
      listeners: [],
      mode: "static"
    };
  }
  let promises;
  for (; (promises = collector.$promises$).length > 0; ) {
    collector.$promises$ = [], await Promise.allSettled(promises);
  }
  const canRender = collector.$elements$.length > 0;
  if (canRender) {
    for (const element of collector.$elements$) {
      collectElementData(tryGetContext(element), collector);
    }
    for (const ctx of allContexts) {
      if (ctx.$props$ && collectMutableProps(ctx.$element$, ctx.$props$, collector), ctx.$contexts$) {
        for (const item of ctx.$contexts$.values()) {
          collectValue(item, collector, false);
        }
      }
    }
  }
  for (; (promises = collector.$promises$).length > 0; ) {
    collector.$promises$ = [], await Promise.allSettled(promises);
  }
  const elementToIndex = /* @__PURE__ */ new Map();
  const objs = Array.from(collector.$objSet$.keys());
  const objToId = /* @__PURE__ */ new Map();
  const getElementID = (el) => {
    let id = elementToIndex.get(el);
    return void 0 === id && (id = ((el2) => {
      const ctx = tryGetContext(el2);
      return ctx ? ctx.$id$ : null;
    })(el), id ? id = "#" + id : console.warn("Missing ID", el), elementToIndex.set(el, id)), id;
  };
  const getObjId = (obj) => {
    let suffix = "";
    if (isMutable(obj) && (obj = obj.mut, suffix = "%"), isPromise(obj)) {
      const { value, resolved } = getPromiseValue(obj);
      obj = value, suffix += resolved ? "~" : "_";
    }
    if (isObject(obj)) {
      const target = getProxyTarget(obj);
      if (target) {
        suffix += "!", obj = target;
      } else if (isQwikElement(obj)) {
        const elID = getElementID(obj);
        return elID ? elID + suffix : null;
      }
    }
    const id = objToId.get(obj);
    return id ? id + suffix : null;
  };
  const mustGetObjId = (obj) => {
    const key = getObjId(obj);
    if (null === key) {
      throw qError(QError_missingObjectId, obj);
    }
    return key;
  };
  const subsMap = /* @__PURE__ */ new Map();
  objs.forEach((obj) => {
    const proxy = containerState.$proxyMap$.get(obj);
    const flags = getProxyFlags(proxy);
    if (void 0 === flags) {
      return;
    }
    const subsObj = [];
    flags > 0 && subsObj.push({
      subscriber: "$",
      data: flags
    }), getProxySubs(proxy).forEach((set2, key) => {
      isNode(key) && isVirtualElement(key) && !collector.$elements$.includes(key) || subsObj.push({
        subscriber: key,
        data: set2 ? Array.from(set2) : null
      });
    }), subsObj.length > 0 && subsMap.set(obj, subsObj);
  }), objs.sort((a2, b) => (subsMap.has(a2) ? 0 : 1) - (subsMap.has(b) ? 0 : 1));
  let count = 0;
  for (const obj of objs) {
    objToId.set(obj, intToStr(count)), count++;
  }
  if (collector.$noSerialize$.length > 0) {
    const undefinedID = objToId.get(void 0);
    for (const obj of collector.$noSerialize$) {
      objToId.set(obj, undefinedID);
    }
  }
  const subs = objs.map((obj) => {
    const sub = subsMap.get(obj);
    if (!sub) {
      return;
    }
    const subsObj = {};
    return sub.forEach(({ subscriber, data }) => {
      if ("$" === subscriber) {
        subsObj[subscriber] = data;
      } else {
        const id = getObjId(subscriber);
        null !== id && (subsObj[id] = data);
      }
    }), subsObj;
  }).filter(isNotNullable);
  const convertedObjs = objs.map((obj) => {
    if (null === obj) {
      return null;
    }
    const typeObj = typeof obj;
    switch (typeObj) {
      case "undefined":
        return UNDEFINED_PREFIX;
      case "string":
      case "number":
      case "boolean":
        return obj;
      default:
        const value = serializeValue$1(obj, getObjId, containerState);
        if (void 0 !== value) {
          return value;
        }
        if ("object" === typeObj) {
          if (isArray(obj)) {
            return obj.map(mustGetObjId);
          }
          if (isSerializableObject(obj)) {
            const output = {};
            for (const key of Object.keys(obj)) {
              output[key] = mustGetObjId(obj[key]);
            }
            return output;
          }
        }
    }
    throw qError(QError_verifySerializable, obj);
  });
  const meta = {};
  allContexts.forEach((ctx) => {
    const node = ctx.$element$;
    const ref = ctx.$refMap$;
    const props = ctx.$props$;
    const contexts = ctx.$contexts$;
    const watches = ctx.$watches$;
    const renderQrl = ctx.$renderQrl$;
    const seq = ctx.$seq$;
    const metaValue = {};
    const elementCaptured = isVirtualElement(node) && collector.$elements$.includes(node);
    let add = false;
    if (ref.length > 0) {
      const value = ref.map(mustGetObjId).join(" ");
      value && (metaValue.r = value, add = true);
    }
    if (canRender) {
      if (elementCaptured && props && (metaValue.h = mustGetObjId(props) + " " + mustGetObjId(renderQrl), add = true), watches && watches.length > 0) {
        const value = watches.map(getObjId).filter(isNotNullable).join(" ");
        value && (metaValue.w = value, add = true);
      }
      if (elementCaptured && seq && seq.length > 0) {
        const value = seq.map(mustGetObjId).join(" ");
        metaValue.s = value, add = true;
      }
      if (contexts) {
        const serializedContexts = [];
        contexts.forEach((value2, key) => {
          serializedContexts.push(`${key}=${mustGetObjId(value2)}`);
        });
        const value = serializedContexts.join(" ");
        value && (metaValue.c = value, add = true);
      }
    }
    if (add) {
      const elementID = getElementID(node);
      meta[elementID] = metaValue;
    }
  });
  for (const watch of collector.$watches$) {
    destroyWatch(watch);
  }
  return {
    state: {
      ctx: meta,
      objs: convertedObjs,
      subs
    },
    objs,
    listeners,
    mode: canRender ? "render" : "listeners"
  };
};
const getNodesInScope = (parent2, predicate) => {
  predicate(parent2);
  const walker = parent2.ownerDocument.createTreeWalker(parent2, 129, {
    acceptNode: (node) => isContainer(node) ? 2 : predicate(node) ? 1 : 3
  });
  const pars = [];
  let currentNode = null;
  for (; currentNode = walker.nextNode(); ) {
    pars.push(processVirtualNodes(currentNode));
  }
  return pars;
};
const reviveNestedObjects = (obj, getObject, parser) => {
  if (!parser.fill(obj) && obj && "object" == typeof obj) {
    if (isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const value = obj[i];
        "string" == typeof value ? obj[i] = getObject(value) : reviveNestedObjects(value, getObject, parser);
      }
    } else if (isSerializableObject(obj)) {
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        "string" == typeof value ? obj[key] = getObject(value) : reviveNestedObjects(value, getObject, parser);
      }
    }
  }
};
const OBJECT_TRANSFORMS = {
  "!": (obj, containerState) => {
    var _a2;
    return (_a2 = containerState.$proxyMap$.get(obj)) != null ? _a2 : getOrCreateProxy(obj, containerState);
  },
  "%": (obj) => mutable(obj),
  "~": (obj) => Promise.resolve(obj),
  _: (obj) => Promise.reject(obj)
};
const collectMutableProps = (el, props, collector) => {
  const subs = getProxySubs(props);
  subs && subs.has(el) && collectElement(el, collector);
};
const createCollector = (containerState) => ({
  $containerState$: containerState,
  $seen$: /* @__PURE__ */ new Set(),
  $objSet$: /* @__PURE__ */ new Set(),
  $noSerialize$: [],
  $elements$: [],
  $watches$: [],
  $promises$: []
});
const collectDeferElement = (el, collector) => {
  collector.$elements$.includes(el) || collector.$elements$.push(el);
};
const collectElement = (el, collector) => {
  if (collector.$elements$.includes(el)) {
    return;
  }
  const ctx = tryGetContext(el);
  ctx && (collector.$elements$.push(el), collectElementData(ctx, collector));
};
const collectElementData = (ctx, collector) => {
  if (ctx.$props$ && collectValue(ctx.$props$, collector, false), ctx.$renderQrl$ && collectValue(ctx.$renderQrl$, collector, false), ctx.$seq$) {
    for (const obj of ctx.$seq$) {
      collectValue(obj, collector, false);
    }
  }
  if (ctx.$watches$) {
    for (const obj of ctx.$watches$) {
      collectValue(obj, collector, false);
    }
  }
  if (ctx.$contexts$) {
    for (const obj of ctx.$contexts$.values()) {
      collectValue(obj, collector, false);
    }
  }
};
const PROMISE_VALUE = Symbol();
const getPromiseValue = (promise) => promise[PROMISE_VALUE];
const collectValue = (obj, collector, leaks) => {
  if (null !== obj) {
    const objType = typeof obj;
    const seen = collector.$seen$;
    switch (objType) {
      case "function":
        if (seen.has(obj)) {
          return;
        }
        if (seen.add(obj), !fastShouldSerialize(obj)) {
          return collector.$objSet$.add(void 0), void collector.$noSerialize$.push(obj);
        }
        if (isQrl$1(obj)) {
          if (collector.$objSet$.add(obj), obj.$captureRef$) {
            for (const item of obj.$captureRef$) {
              collectValue(item, collector, leaks);
            }
          }
          return;
        }
        break;
      case "object": {
        if (seen.has(obj)) {
          return;
        }
        if (seen.add(obj), !fastShouldSerialize(obj)) {
          return collector.$objSet$.add(void 0), void collector.$noSerialize$.push(obj);
        }
        if (isPromise(obj)) {
          return void collector.$promises$.push((promise = obj, promise.then((value) => {
            const v = {
              resolved: true,
              value
            };
            return promise[PROMISE_VALUE] = v, value;
          }, (value) => {
            const v = {
              resolved: false,
              value
            };
            return promise[PROMISE_VALUE] = v, value;
          })).then((value) => {
            collectValue(value, collector, leaks);
          }));
        }
        const target = getProxyTarget(obj);
        const input = obj;
        if (target) {
          if (leaks && ((proxy, collector2) => {
            const subs = getProxySubs(proxy);
            if (!collector2.$seen$.has(subs)) {
              collector2.$seen$.add(subs);
              for (const key of Array.from(subs.keys())) {
                isNode(key) && isVirtualElement(key) ? collectDeferElement(key, collector2) : collectValue(key, collector2, true);
              }
            }
          })(input, collector), obj = target, seen.has(obj)) {
            return;
          }
          if (seen.add(obj), isResourceReturn(obj)) {
            return collector.$objSet$.add(target), collectValue(obj.promise, collector, leaks), void collectValue(obj.resolved, collector, leaks);
          }
        } else if (isNode(obj)) {
          return;
        }
        if (isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            collectValue(input[i], collector, leaks);
          }
        } else {
          for (const key of Object.keys(obj)) {
            collectValue(input[key], collector, leaks);
          }
        }
        break;
      }
    }
  }
  var promise;
  collector.$objSet$.add(obj);
};
const isContainer = (el) => isElement(el) && el.hasAttribute("q:container");
const hasQId = (el) => {
  const node = processVirtualNodes(el);
  return !!isQwikElement(node) && node.hasAttribute("q:id");
};
const intToStr = (nu) => nu.toString(36);
const strToInt = (nu) => parseInt(nu, 36);
const getEventName = (attribute) => {
  const colonPos = attribute.indexOf(":");
  return attribute.slice(colonPos + 1).replace(/-./g, (x) => x[1].toUpperCase());
};
const WatchFlagsIsEffect = 1;
const WatchFlagsIsWatch = 2;
const WatchFlagsIsDirty = 4;
const WatchFlagsIsCleanup = 8;
const WatchFlagsIsResource = 16;
const useWatchQrl = (qrl, opts) => {
  const { get, set: set2, ctx, i } = useSequentialScope();
  if (get) {
    return;
  }
  const el = ctx.$hostElement$;
  const containerState = ctx.$renderCtx$.$static$.$containerState$;
  const watch = new Watch(WatchFlagsIsDirty | WatchFlagsIsWatch, i, el, qrl, void 0);
  const elCtx = getContext(el);
  set2(true), qrl.$resolveLazy$(containerState.$containerEl$), elCtx.$watches$ || (elCtx.$watches$ = []), elCtx.$watches$.push(watch), waitAndRun(ctx, () => runSubscriber(watch, containerState, ctx.$renderCtx$)), isServer$1() && useRunWatch(watch, opts == null ? void 0 : opts.eagerness);
};
const useClientEffectQrl = (qrl, opts) => {
  var _a2;
  const { get, set: set2, i, ctx } = useSequentialScope();
  if (get) {
    return;
  }
  const el = ctx.$hostElement$;
  const watch = new Watch(WatchFlagsIsEffect, i, el, qrl, void 0);
  const eagerness = (_a2 = opts == null ? void 0 : opts.eagerness) != null ? _a2 : "visible";
  const elCtx = getContext(el);
  const containerState = ctx.$renderCtx$.$static$.$containerState$;
  set2(true), elCtx.$watches$ || (elCtx.$watches$ = []), elCtx.$watches$.push(watch), useRunWatch(watch, eagerness), isServer$1() || (qrl.$resolveLazy$(containerState.$containerEl$), notifyWatch(watch, containerState));
};
const useServerMountQrl = (mountQrl) => {
  const { get, set: set2, ctx } = useSequentialScope();
  if (!get) {
    if (!isServer$1()) {
      throw qError(QError_canNotMountUseServerMount, ctx.$hostElement$);
    }
    waitAndRun(ctx, mountQrl), set2(true);
  }
};
const isResourceWatch = (watch) => !!watch.$resource$;
const runSubscriber = (watch, containerState, rctx) => (watch.$flags$, isResourceWatch(watch) ? runResource(watch, containerState) : runWatch(watch, containerState, rctx));
const runResource = (watch, containerState, waitOn) => {
  watch.$flags$ &= ~WatchFlagsIsDirty, cleanupWatch(watch);
  const el = watch.$el$;
  const invokationContext = newInvokeContext(el, void 0, "WatchEvent");
  const { $subsManager$: subsManager } = containerState;
  const watchFn = watch.$qrl$.getFn(invokationContext, () => {
    subsManager.$clearSub$(watch);
  });
  const cleanups = [];
  const resource = watch.$resource$;
  const resourceTarget = unwrapProxy(resource);
  const opts = {
    track: (obj, prop) => {
      const target = getProxyTarget(obj);
      return target ? subsManager.$getLocal$(target).$addSub$(watch, prop) : logErrorAndStop(codeToText(QError_trackUseStore), obj), prop ? obj[prop] : obj;
    },
    cleanup(callback) {
      cleanups.push(callback);
    },
    previous: resourceTarget.resolved
  };
  let resolve;
  let reject;
  let done = false;
  const setState = (resolved, value) => !done && (done = true, resolved ? (done = true, resource.state = "resolved", resource.resolved = value, resource.error = void 0, resolve(value)) : (done = true, resource.state = "rejected", resource.resolved = void 0, resource.error = value, reject(value)), true);
  invoke(invokationContext, () => {
    resource.state = "pending", resource.resolved = void 0, resource.promise = new Promise((r, re) => {
      resolve = r, reject = re;
    });
  }), watch.$destroy$ = noSerialize(() => {
    cleanups.forEach((fn) => fn());
  });
  const promise = safeCall(() => then(waitOn, () => watchFn(opts)), (value) => {
    setState(true, value);
  }, (reason) => {
    setState(false, reason);
  });
  const timeout = resourceTarget.timeout;
  return timeout ? Promise.race([promise, delay(timeout).then(() => {
    setState(false, "timeout") && cleanupWatch(watch);
  })]) : promise;
};
const runWatch = (watch, containerState, rctx) => {
  watch.$flags$ &= ~WatchFlagsIsDirty, cleanupWatch(watch);
  const hostElement = watch.$el$;
  const invokationContext = newInvokeContext(hostElement, void 0, "WatchEvent");
  const { $subsManager$: subsManager } = containerState;
  const watchFn = watch.$qrl$.getFn(invokationContext, () => {
    subsManager.$clearSub$(watch);
  });
  const cleanups = [];
  watch.$destroy$ = noSerialize(() => {
    cleanups.forEach((fn) => fn());
  });
  const opts = {
    track: (obj, prop) => {
      const target = getProxyTarget(obj);
      return target ? subsManager.$getLocal$(target).$addSub$(watch, prop) : logErrorAndStop(codeToText(QError_trackUseStore), obj), prop ? obj[prop] : obj;
    },
    cleanup(callback) {
      cleanups.push(callback);
    }
  };
  return safeCall(() => watchFn(opts), (returnValue) => {
    isFunction(returnValue) && cleanups.push(returnValue);
  }, (reason) => {
    handleError(reason, hostElement, rctx);
  });
};
const cleanupWatch = (watch) => {
  const destroy = watch.$destroy$;
  if (destroy) {
    watch.$destroy$ = void 0;
    try {
      destroy();
    } catch (err) {
      logError(err);
    }
  }
};
const destroyWatch = (watch) => {
  watch.$flags$ & WatchFlagsIsCleanup ? (watch.$flags$ &= ~WatchFlagsIsCleanup, (0, watch.$qrl$)()) : cleanupWatch(watch);
};
const useRunWatch = (watch, eagerness) => {
  "load" === eagerness ? useOn("qinit", getWatchHandlerQrl(watch)) : "visible" === eagerness && useOn("qvisible", getWatchHandlerQrl(watch));
};
const getWatchHandlerQrl = (watch) => {
  const watchQrl = watch.$qrl$;
  return createQRL(watchQrl.$chunk$, "_hW", _hW, null, null, [watch], watchQrl.$symbol$);
};
class Watch {
  constructor($flags$, $index$, $el$, $qrl$, $resource$) {
    this.$flags$ = $flags$, this.$index$ = $index$, this.$el$ = $el$, this.$qrl$ = $qrl$, this.$resource$ = $resource$;
  }
}
const useResourceQrl = (qrl, opts) => {
  const { get, set: set2, i, ctx } = useSequentialScope();
  if (null != get) {
    return get;
  }
  const containerState = ctx.$renderCtx$.$static$.$containerState$;
  const resource = createResourceReturn(containerState, opts);
  const el = ctx.$hostElement$;
  const watch = new Watch(WatchFlagsIsDirty | WatchFlagsIsResource, i, el, qrl, resource);
  const previousWait = Promise.all(ctx.$waitOn$.slice());
  const elCtx = getContext(el);
  return runResource(watch, containerState, previousWait), elCtx.$watches$ || (elCtx.$watches$ = []), elCtx.$watches$.push(watch), set2(resource), resource;
};
const Resource = (props) => {
  if (props.onRejected && (props.value.promise.catch(() => {
  }), "rejected" === props.value.state)) {
    return props.onRejected(props.value.error);
  }
  if (props.onPending) {
    const state = props.value.state;
    if ("pending" === state) {
      return props.onPending();
    }
    if ("resolved" === state) {
      return props.onResolved(props.value.resolved);
    }
    if ("rejected" === state) {
      throw props.value.error;
    }
  }
  const promise = props.value.promise.then(useBindInvokeContext(props.onResolved), useBindInvokeContext(props.onRejected));
  return jsx(Fragment$1, {
    children: promise
  });
};
const _createResourceReturn = (opts) => ({
  __brand: "resource",
  promise: void 0,
  resolved: void 0,
  error: void 0,
  state: "pending",
  timeout: opts == null ? void 0 : opts.timeout
});
const createResourceReturn = (containerState, opts, initialPromise) => {
  const result = _createResourceReturn(opts);
  return result.promise = initialPromise, createProxy(result, containerState, 0, void 0);
};
const isResourceReturn = (obj) => isObject(obj) && "resource" === obj.__brand;
const UNDEFINED_PREFIX = "";
const QRLSerializer = {
  prefix: "",
  test: (v) => isQrl$1(v),
  serialize: (obj, getObjId, containerState) => stringifyQRL(obj, {
    $getObjId$: getObjId
  }),
  prepare: (data, containerState) => parseQRL(data, containerState.$containerEl$),
  fill: (qrl, getObject) => {
    qrl.$capture$ && qrl.$capture$.length > 0 && (qrl.$captureRef$ = qrl.$capture$.map(getObject), qrl.$capture$ = null);
  }
};
const WatchSerializer = {
  prefix: "",
  test: (v) => {
    return isObject(obj = v) && obj instanceof Watch;
    var obj;
  },
  serialize: (obj, getObjId) => ((watch, getObjId2) => {
    let value = `${intToStr(watch.$flags$)} ${intToStr(watch.$index$)} ${getObjId2(watch.$qrl$)} ${getObjId2(watch.$el$)}`;
    return isResourceWatch(watch) && (value += ` ${getObjId2(watch.$resource$)}`), value;
  })(obj, getObjId),
  prepare: (data) => ((data2) => {
    const [flags, index2, qrl, el, resource] = data2.split(" ");
    return new Watch(strToInt(flags), strToInt(index2), el, qrl, resource);
  })(data),
  fill: (watch, getObject) => {
    watch.$el$ = getObject(watch.$el$), watch.$qrl$ = getObject(watch.$qrl$), watch.$resource$ && (watch.$resource$ = getObject(watch.$resource$));
  }
};
const ResourceSerializer = {
  prefix: "",
  test: (v) => isResourceReturn(v),
  serialize: (obj, getObjId) => ((resource, getObjId2) => {
    const state = resource.state;
    return "resolved" === state ? `0 ${getObjId2(resource.resolved)}` : "pending" === state ? "1" : `2 ${getObjId2(resource.error)}`;
  })(obj, getObjId),
  prepare: (data) => ((data2) => {
    const [first, id] = data2.split(" ");
    const result = _createResourceReturn(void 0);
    return result.promise = Promise.resolve(), "0" === first ? (result.state = "resolved", result.resolved = id) : "1" === first ? (result.state = "pending", result.promise = new Promise(() => {
    })) : "2" === first && (result.state = "rejected", result.error = id), result;
  })(data),
  fill: (resource, getObject) => {
    if ("resolved" === resource.state) {
      resource.resolved = getObject(resource.resolved), resource.promise = Promise.resolve(resource.resolved);
    } else if ("rejected" === resource.state) {
      const p = Promise.reject(resource.error);
      p.catch(() => null), resource.error = getObject(resource.error), resource.promise = p;
    }
  }
};
const URLSerializer = {
  prefix: "",
  test: (v) => v instanceof URL,
  serialize: (obj) => obj.href,
  prepare: (data) => new URL(data),
  fill: void 0
};
const DateSerializer = {
  prefix: "",
  test: (v) => v instanceof Date,
  serialize: (obj) => obj.toISOString(),
  prepare: (data) => new Date(data),
  fill: void 0
};
const RegexSerializer = {
  prefix: "\x07",
  test: (v) => v instanceof RegExp,
  serialize: (obj) => `${obj.flags} ${obj.source}`,
  prepare: (data) => {
    const space = data.indexOf(" ");
    const source = data.slice(space + 1);
    const flags = data.slice(0, space);
    return new RegExp(source, flags);
  },
  fill: void 0
};
const ErrorSerializer = {
  prefix: "",
  test: (v) => v instanceof Error,
  serialize: (obj) => obj.message,
  prepare: (text) => {
    const err = new Error(text);
    return err.stack = void 0, err;
  },
  fill: void 0
};
const DocumentSerializer = {
  prefix: "",
  test: (v) => isDocument(v),
  serialize: void 0,
  prepare: (_, _c, doc) => doc,
  fill: void 0
};
const SERIALIZABLE_STATE = Symbol("serializable-data");
const ComponentSerializer = {
  prefix: "",
  test: (obj) => isQwikComponent(obj),
  serialize: (obj, getObjId, containerState) => {
    const [qrl] = obj[SERIALIZABLE_STATE];
    return stringifyQRL(qrl, {
      $getObjId$: getObjId
    });
  },
  prepare: (data, containerState) => {
    const optionsIndex = data.indexOf("{");
    const qrlString = -1 == optionsIndex ? data : data.slice(0, optionsIndex);
    const qrl = parseQRL(qrlString, containerState.$containerEl$);
    return componentQrl(qrl);
  },
  fill: (component3, getObject) => {
    const [qrl] = component3[SERIALIZABLE_STATE];
    qrl.$capture$ && qrl.$capture$.length > 0 && (qrl.$captureRef$ = qrl.$capture$.map(getObject), qrl.$capture$ = null);
  }
};
const serializers = [QRLSerializer, WatchSerializer, ResourceSerializer, URLSerializer, DateSerializer, RegexSerializer, ErrorSerializer, DocumentSerializer, ComponentSerializer, {
  prefix: "",
  test: (obj) => "function" == typeof obj && void 0 !== obj.__qwik_serializable__,
  serialize: (obj) => obj.toString(),
  prepare: (data) => {
    const fn = new Function("return " + data)();
    return fn.__qwik_serializable__ = true, fn;
  },
  fill: void 0
}];
const serializeValue$1 = (obj, getObjID, containerState) => {
  for (const s of serializers) {
    if (s.test(obj)) {
      let value = s.prefix;
      return s.serialize && (value += s.serialize(obj, getObjID, containerState)), value;
    }
  }
};
const getOrCreateProxy = (target, containerState, flags = 0) => containerState.$proxyMap$.get(target) || createProxy(target, containerState, flags, void 0);
const createProxy = (target, containerState, flags, subs) => {
  unwrapProxy(target), containerState.$proxyMap$.has(target);
  const manager = containerState.$subsManager$.$getLocal$(target, subs);
  const proxy = new Proxy(target, new ReadWriteProxyHandler(containerState, manager, flags));
  return containerState.$proxyMap$.set(target, proxy), proxy;
};
const QOjectTargetSymbol = Symbol();
const QOjectSubsSymbol = Symbol();
const QOjectFlagsSymbol = Symbol();
class ReadWriteProxyHandler {
  constructor($containerState$, $manager$, $flags$) {
    this.$containerState$ = $containerState$, this.$manager$ = $manager$, this.$flags$ = $flags$;
  }
  get(target, prop) {
    if ("symbol" == typeof prop) {
      return prop === QOjectTargetSymbol ? target : prop === QOjectFlagsSymbol ? this.$flags$ : prop === QOjectSubsSymbol ? this.$manager$.$subs$ : target[prop];
    }
    let subscriber;
    const invokeCtx = tryGetInvokeContext();
    const recursive = 0 != (1 & this.$flags$);
    const immutable = 0 != (2 & this.$flags$);
    invokeCtx && (subscriber = invokeCtx.$subscriber$);
    let value = target[prop];
    if (isMutable(value) ? value = value.mut : immutable && (subscriber = null), subscriber) {
      const isA = isArray(target);
      this.$manager$.$addSub$(subscriber, isA ? void 0 : prop);
    }
    return recursive ? wrap(value, this.$containerState$) : value;
  }
  set(target, prop, newValue) {
    if ("symbol" == typeof prop) {
      return target[prop] = newValue, true;
    }
    if (0 != (2 & this.$flags$)) {
      throw qError(QError_immutableProps);
    }
    const unwrappedNewValue = 0 != (1 & this.$flags$) ? unwrapProxy(newValue) : newValue;
    return isArray(target) ? (target[prop] = unwrappedNewValue, this.$manager$.$notifySubs$(), true) : (target[prop] !== unwrappedNewValue && (target[prop] = unwrappedNewValue, this.$manager$.$notifySubs$(prop)), true);
  }
  has(target, property) {
    return property === QOjectTargetSymbol || property === QOjectFlagsSymbol || Object.prototype.hasOwnProperty.call(target, property);
  }
  ownKeys(target) {
    let subscriber = null;
    const invokeCtx = tryGetInvokeContext();
    return invokeCtx && (subscriber = invokeCtx.$subscriber$), subscriber && this.$manager$.$addSub$(subscriber), Object.getOwnPropertyNames(target);
  }
}
const wrap = (value, containerState) => {
  if (isQrl$1(value)) {
    return value;
  }
  if (isObject(value)) {
    if (Object.isFrozen(value)) {
      return value;
    }
    const nakedValue = unwrapProxy(value);
    return nakedValue !== value || isNode(nakedValue) ? value : shouldSerialize(nakedValue) ? containerState.$proxyMap$.get(value) || getOrCreateProxy(value, containerState, 1) : value;
  }
  return value;
};
const noSerializeSet = /* @__PURE__ */ new WeakSet();
const shouldSerialize = (obj) => !isObject(obj) && !isFunction(obj) || !noSerializeSet.has(obj);
const fastShouldSerialize = (obj) => !noSerializeSet.has(obj);
const noSerialize = (input) => (null != input && noSerializeSet.add(input), input);
const mutable = (v) => new MutableImpl(v);
class MutableImpl {
  constructor(mut) {
    this.mut = mut;
  }
}
const isMutable = (v) => v instanceof MutableImpl;
const unwrapProxy = (proxy) => {
  var _a2;
  return isObject(proxy) ? (_a2 = getProxyTarget(proxy)) != null ? _a2 : proxy : proxy;
};
const getProxyTarget = (obj) => obj[QOjectTargetSymbol];
const getProxySubs = (obj) => obj[QOjectSubsSymbol];
const getProxyFlags = (obj) => {
  if (isObject(obj)) {
    return obj[QOjectFlagsSymbol];
  }
};
const resumeIfNeeded = (containerEl) => {
  "paused" === directGetAttribute(containerEl, "q:container") && (((containerEl2) => {
    if (!isContainer(containerEl2)) {
      return void logWarn();
    }
    const doc = getDocument(containerEl2);
    const script = ((parentElm) => {
      let child = parentElm.lastElementChild;
      for (; child; ) {
        if ("SCRIPT" === child.tagName && "qwik/json" === directGetAttribute(child, "type")) {
          return child;
        }
        child = child.previousElementSibling;
      }
    })(containerEl2 === doc.documentElement ? doc.body : containerEl2);
    if (!script) {
      return void logWarn();
    }
    script.remove();
    const containerState = getContainerState(containerEl2);
    ((containerEl3, containerState2) => {
      const head = containerEl3.ownerDocument.head;
      containerEl3.querySelectorAll("style[q\\:style]").forEach((el2) => {
        containerState2.$styleIds$.add(directGetAttribute(el2, "q:style")), head.appendChild(el2);
      });
    })(containerEl2, containerState);
    const meta = JSON.parse((script.textContent || "{}").replace(/\\x3C(\/?script)/g, "<$1"));
    const elements = /* @__PURE__ */ new Map();
    const getObject = (id) => ((id2, elements2, objs, containerState2) => {
      if ("string" == typeof id2 && id2.length, id2.startsWith("#")) {
        return elements2.has(id2), elements2.get(id2);
      }
      const index2 = strToInt(id2);
      objs.length;
      let obj = objs[index2];
      for (let i = id2.length - 1; i >= 0; i--) {
        const code = id2[i];
        const transform = OBJECT_TRANSFORMS[code];
        if (!transform) {
          break;
        }
        obj = transform(obj, containerState2);
      }
      return obj;
    })(id, elements, meta.objs, containerState);
    let maxId = 0;
    getNodesInScope(containerEl2, hasQId).forEach((el2) => {
      const id = directGetAttribute(el2, "q:id");
      const ctx = getContext(el2);
      ctx.$id$ = id, isElement(el2) && (ctx.$vdom$ = domToVnode(el2)), elements.set("#" + id, el2), maxId = Math.max(maxId, strToInt(id));
    }), containerState.$elementIndex$ = ++maxId;
    const parser = ((getObject2, containerState2, doc2) => {
      const map = /* @__PURE__ */ new Map();
      return {
        prepare(data) {
          for (const s of serializers) {
            const prefix = s.prefix;
            if (data.startsWith(prefix)) {
              const value = s.prepare(data.slice(prefix.length), containerState2, doc2);
              return s.fill && map.set(value, s), value;
            }
          }
          return data;
        },
        fill(obj) {
          const serializer = map.get(obj);
          return !!serializer && (serializer.fill(obj, getObject2, containerState2), true);
        }
      };
    })(getObject, containerState, doc);
    ((objs, subs, getObject2, containerState2, parser2) => {
      for (let i = 0; i < objs.length; i++) {
        const value = objs[i];
        isString(value) && (objs[i] = value === UNDEFINED_PREFIX ? void 0 : parser2.prepare(value));
      }
      for (let i = 0; i < subs.length; i++) {
        const value = objs[i];
        const sub = subs[i];
        if (sub) {
          const converted = /* @__PURE__ */ new Map();
          let flags = 0;
          for (const key of Object.keys(sub)) {
            const v = sub[key];
            if ("$" === key) {
              flags = v;
              continue;
            }
            const el2 = getObject2(key);
            if (!el2) {
              continue;
            }
            const set2 = null === v ? null : new Set(v);
            converted.set(el2, set2);
          }
          createProxy(value, containerState2, flags, converted);
        }
      }
    })(meta.objs, meta.subs, getObject, containerState, parser);
    for (const obj of meta.objs) {
      reviveNestedObjects(obj, getObject, parser);
    }
    for (const elementID of Object.keys(meta.ctx)) {
      elementID.startsWith("#");
      const ctxMeta = meta.ctx[elementID];
      const el2 = elements.get(elementID);
      const ctx = getContext(el2);
      const refMap = ctxMeta.r;
      const seq = ctxMeta.s;
      const host = ctxMeta.h;
      const contexts = ctxMeta.c;
      const watches = ctxMeta.w;
      if (refMap && (isElement(el2), ctx.$refMap$ = refMap.split(" ").map(getObject), ctx.li = getDomListeners(ctx, containerEl2)), seq && (ctx.$seq$ = seq.split(" ").map(getObject)), watches && (ctx.$watches$ = watches.split(" ").map(getObject)), contexts) {
        ctx.$contexts$ = /* @__PURE__ */ new Map();
        for (const part of contexts.split(" ")) {
          const [key, value] = part.split("=");
          ctx.$contexts$.set(key, getObject(value));
        }
      }
      if (host) {
        const [props, renderQrl] = host.split(" ");
        const styleIds = el2.getAttribute("q:sstyle");
        ctx.$scopeIds$ = styleIds ? styleIds.split(" ") : null, ctx.$mounted$ = true, ctx.$props$ = getObject(props), ctx.$renderQrl$ = getObject(renderQrl);
      }
    }
    var el;
    directSetAttribute(containerEl2, "q:container", "resumed"), (el = containerEl2) && "function" == typeof CustomEvent && el.dispatchEvent(new CustomEvent("qresume", {
      detail: void 0,
      bubbles: true,
      composed: true
    }));
  })(containerEl), appendQwikDevTools(containerEl));
};
const appendQwikDevTools = (containerEl) => {
  containerEl.qwik = {
    pause: () => (async (elmOrDoc, defaultParentJSON) => {
      const doc = getDocument(elmOrDoc);
      const documentElement = doc.documentElement;
      const containerEl2 = isDocument(elmOrDoc) ? documentElement : elmOrDoc;
      if ("paused" === directGetAttribute(containerEl2, "q:container")) {
        throw qError(QError_containerAlreadyPaused);
      }
      const parentJSON = containerEl2 === doc.documentElement ? doc.body : containerEl2;
      const data = await (async (containerEl3) => {
        const containerState = getContainerState(containerEl3);
        const contexts = getNodesInScope(containerEl3, hasQId).map(tryGetContext);
        return _pauseFromContexts(contexts, containerState);
      })(containerEl2);
      const script = doc.createElement("script");
      return directSetAttribute(script, "type", "qwik/json"), script.textContent = JSON.stringify(data.state, void 0, void 0).replace(/<(\/?script)/g, "\\x3C$1"), parentJSON.appendChild(script), directSetAttribute(containerEl2, "q:container", "paused"), data;
    })(containerEl),
    state: getContainerState(containerEl)
  };
};
const tryGetContext = (element) => element._qc_;
const getContext = (element) => {
  let ctx = tryGetContext(element);
  return ctx || (element._qc_ = ctx = {
    $dirty$: false,
    $mounted$: false,
    $attachedListeners$: false,
    $id$: "",
    $element$: element,
    $refMap$: [],
    li: {},
    $watches$: null,
    $seq$: null,
    $slots$: null,
    $scopeIds$: null,
    $appendStyles$: null,
    $props$: null,
    $vdom$: null,
    $renderQrl$: null,
    $contexts$: null
  }), ctx;
};
const cleanupContext = (ctx, subsManager) => {
  var _a2;
  const el = ctx.$element$;
  (_a2 = ctx.$watches$) == null ? void 0 : _a2.forEach((watch) => {
    subsManager.$clearSub$(watch), destroyWatch(watch);
  }), ctx.$renderQrl$ && subsManager.$clearSub$(el), ctx.$renderQrl$ = null, ctx.$seq$ = null, ctx.$watches$ = null, ctx.$dirty$ = false, el._qc_ = void 0;
};
const PREFIXES = ["on", "window:on", "document:on"];
const SCOPED = ["on", "on-window", "on-document"];
const normalizeOnProp = (prop) => {
  let scope = "on";
  for (let i = 0; i < PREFIXES.length; i++) {
    const prefix = PREFIXES[i];
    if (prop.startsWith(prefix)) {
      scope = SCOPED[i], prop = prop.slice(prefix.length);
      break;
    }
  }
  return scope + ":" + (prop.startsWith("-") ? fromCamelToKebabCase(prop.slice(1)) : prop.toLowerCase());
};
const createProps = (target, containerState) => createProxy(target, containerState, 2);
const getPropsMutator = (ctx, containerState) => {
  let props = ctx.$props$;
  props || (ctx.$props$ = props = createProps({}, containerState));
  const target = getProxyTarget(props);
  const manager = containerState.$subsManager$.$getLocal$(target);
  return {
    set(prop, value) {
      let oldValue = target[prop];
      isMutable(oldValue) && (oldValue = oldValue.mut), containerState.$mutableProps$ ? isMutable(value) ? (value = value.mut, target[prop] = value) : target[prop] = mutable(value) : (target[prop] = value, isMutable(value) && (value = value.mut, true)), oldValue !== value && manager.$notifySubs$(prop);
    }
  };
};
const inflateQrl = (qrl, elCtx) => (qrl.$capture$, qrl.$captureRef$ = qrl.$capture$.map((idx) => {
  const int = parseInt(idx, 10);
  const obj = elCtx.$refMap$[int];
  return elCtx.$refMap$.length, obj;
}));
const logError = (message, ...optionalParams) => {
  const err = message instanceof Error ? message : new Error(message);
  return "function" == typeof globalThis._handleError && message instanceof Error ? globalThis._handleError(message, optionalParams) : console.error("%cQWIK ERROR", "", err.message, ...printParams(optionalParams), err.stack), err;
};
const logErrorAndStop = (message, ...optionalParams) => logError(message, ...optionalParams);
const logWarn = (message, ...optionalParams) => {
};
const printParams = (optionalParams) => optionalParams;
const QError_stringifyClassOrStyle = 0;
const QError_verifySerializable = 3;
const QError_setProperty = 6;
const QError_notFoundContext = 13;
const QError_useMethodOutsideContext = 14;
const QError_immutableProps = 17;
const QError_useInvokeContext = 20;
const QError_containerAlreadyPaused = 21;
const QError_canNotMountUseServerMount = 22;
const QError_invalidJsxNodeType = 25;
const QError_trackUseStore = 26;
const QError_missingObjectId = 27;
const qError = (code, ...parts) => {
  const text = codeToText(code);
  return logErrorAndStop(text, ...parts);
};
const codeToText = (code) => `Code(${code})`;
const isQrl$1 = (value) => "function" == typeof value && "function" == typeof value.getSymbol;
const createQRL = (chunk, symbol, symbolRef, symbolFn, capture, captureRef, refSymbol) => {
  let _containerEl;
  const setContainer = (el) => {
    _containerEl || (_containerEl = el);
  };
  const resolve = async (containerEl) => {
    if (containerEl && setContainer(containerEl), symbolRef) {
      return symbolRef;
    }
    if (symbolFn) {
      return symbolRef = symbolFn().then((module) => symbolRef = module[symbol]);
    }
    {
      if (!_containerEl) {
        throw new Error(`QRL '${chunk}#${symbol || "default"}' does not have an attached container`);
      }
      const symbol2 = getPlatform().importSymbol(_containerEl, chunk, symbol);
      return symbolRef = then(symbol2, (ref) => symbolRef = ref);
    }
  };
  const resolveLazy = (containerEl) => symbolRef || resolve(containerEl);
  const invokeFn = (currentCtx, beforeFn) => (...args) => {
    const fn = resolveLazy();
    return then(fn, (fn2) => {
      if (isFunction(fn2)) {
        if (beforeFn && false === beforeFn()) {
          return;
        }
        const context = {
          ...createInvokationContext(currentCtx),
          $qrl$: QRL
        };
        return emitUsedSymbol(symbol, context.$element$), invoke(context, fn2, ...args);
      }
      throw qError(10);
    });
  };
  const createInvokationContext = (invoke2) => null == invoke2 ? newInvokeContext() : isArray(invoke2) ? newInvokeContextFromTuple(invoke2) : invoke2;
  const invokeQRL = async function(...args) {
    const fn = invokeFn();
    return await fn(...args);
  };
  const resolvedSymbol = refSymbol != null ? refSymbol : symbol;
  const hash = getSymbolHash$1(resolvedSymbol);
  const QRL = invokeQRL;
  const methods = {
    getSymbol: () => resolvedSymbol,
    getHash: () => hash,
    resolve,
    $resolveLazy$: resolveLazy,
    $setContainer$: setContainer,
    $chunk$: chunk,
    $symbol$: symbol,
    $refSymbol$: refSymbol,
    $hash$: hash,
    getFn: invokeFn,
    $capture$: capture,
    $captureRef$: captureRef
  };
  return Object.assign(invokeQRL, methods);
};
const getSymbolHash$1 = (symbolName) => {
  const index2 = symbolName.lastIndexOf("_");
  return index2 > -1 ? symbolName.slice(index2 + 1) : symbolName;
};
const emitUsedSymbol = (symbol, element) => {
  isServer$1() || "object" != typeof document || document.dispatchEvent(new CustomEvent("qsymbol", {
    bubbles: false,
    detail: {
      symbol,
      element,
      timestamp: performance.now()
    }
  }));
};
let runtimeSymbolId = 0;
const inlinedQrl = (symbol, symbolName, lexicalScopeCapture = EMPTY_ARRAY$1) => createQRL("/inlinedQRL", symbolName, symbol, null, null, lexicalScopeCapture, null);
const stringifyQRL = (qrl, opts = {}) => {
  var _a2;
  let symbol = qrl.$symbol$;
  let chunk = qrl.$chunk$;
  const refSymbol = (_a2 = qrl.$refSymbol$) != null ? _a2 : symbol;
  const platform = getPlatform();
  if (platform) {
    const result = platform.chunkForSymbol(refSymbol);
    result && (chunk = result[1], qrl.$refSymbol$ || (symbol = result[0]));
  }
  chunk.startsWith("./") && (chunk = chunk.slice(2));
  const parts = [chunk];
  symbol && "default" !== symbol && parts.push("#", symbol);
  const capture = qrl.$capture$;
  const captureRef = qrl.$captureRef$;
  if (captureRef && captureRef.length) {
    if (opts.$getObjId$) {
      const capture2 = captureRef.map(opts.$getObjId$);
      parts.push(`[${capture2.join(" ")}]`);
    } else if (opts.$addRefMap$) {
      const capture2 = captureRef.map(opts.$addRefMap$);
      parts.push(`[${capture2.join(" ")}]`);
    }
  } else {
    capture && capture.length > 0 && parts.push(`[${capture.join(" ")}]`);
  }
  return parts.join("");
};
const serializeQRLs = (existingQRLs, elCtx) => {
  var value;
  (function(value2) {
    return value2 && "number" == typeof value2.nodeType;
  })(value = elCtx.$element$) && value.nodeType;
  const opts = {
    $element$: elCtx.$element$,
    $addRefMap$: (obj) => addToArray(elCtx.$refMap$, obj)
  };
  return existingQRLs.map((qrl) => stringifyQRL(qrl, opts)).join("\n");
};
const parseQRL = (qrl, containerEl) => {
  const endIdx = qrl.length;
  const hashIdx = indexOf(qrl, 0, "#");
  const captureIdx = indexOf(qrl, hashIdx, "[");
  const chunkEndIdx = Math.min(hashIdx, captureIdx);
  const chunk = qrl.substring(0, chunkEndIdx);
  const symbolStartIdx = hashIdx == endIdx ? hashIdx : hashIdx + 1;
  const symbolEndIdx = captureIdx;
  const symbol = symbolStartIdx == symbolEndIdx ? "default" : qrl.substring(symbolStartIdx, symbolEndIdx);
  const captureStartIdx = captureIdx;
  const captureEndIdx = endIdx;
  const capture = captureStartIdx === captureEndIdx ? EMPTY_ARRAY$1 : qrl.substring(captureStartIdx + 1, captureEndIdx - 1).split(" ");
  "/runtimeQRL" === chunk && logError(codeToText(2), qrl);
  const iQrl = createQRL(chunk, symbol, null, null, capture, null, null);
  return containerEl && iQrl.$setContainer$(containerEl), iQrl;
};
const indexOf = (text, startIdx, char) => {
  const endIdx = text.length;
  const charIdx = text.indexOf(char, startIdx == endIdx ? 0 : startIdx);
  return -1 == charIdx ? endIdx : charIdx;
};
const addToArray = (array, obj) => {
  const index2 = array.indexOf(obj);
  return -1 === index2 ? (array.push(obj), array.length - 1) : index2;
};
const $ = (expression) => ((symbol, lexicalScopeCapture = EMPTY_ARRAY$1) => createQRL("/runtimeQRL", "s" + runtimeSymbolId++, symbol, null, null, lexicalScopeCapture, null))(expression);
const componentQrl = (onRenderQrl) => {
  function QwikComponent(props, key) {
    const hash = onRenderQrl.$hash$;
    return jsx(Virtual, {
      "q:renderFn": onRenderQrl,
      ...props
    }, hash + ":" + (key || ""));
  }
  return QwikComponent[SERIALIZABLE_STATE] = [onRenderQrl], QwikComponent;
};
const isQwikComponent = (component3) => "function" == typeof component3 && void 0 !== component3[SERIALIZABLE_STATE];
const Slot = (props) => {
  var _a2;
  const name = (_a2 = props.name) != null ? _a2 : "";
  return jsx(Virtual, {
    "q:s": ""
  }, name);
};
const renderSSR = async (node, opts) => {
  var _a2;
  const root = opts.containerTagName;
  const containerEl = createContext(1).$element$;
  const containerState = createContainerState(containerEl);
  const rctx = createRenderContext({
    nodeType: 9
  }, containerState);
  const headNodes = (_a2 = opts.beforeContent) != null ? _a2 : [];
  const ssrCtx = {
    rctx,
    $contexts$: [],
    projectedChildren: void 0,
    projectedContext: void 0,
    hostCtx: void 0,
    invocationContext: void 0,
    headNodes: "html" === root ? headNodes : []
  };
  const containerAttributes = {
    ...opts.containerAttributes,
    "q:container": "paused",
    "q:version": "0.9.0",
    "q:render": "ssr",
    "q:base": opts.base,
    children: "html" === root ? [node] : [headNodes, node]
  };
  containerState.$envData$ = {
    url: opts.url,
    ...opts.envData
  }, node = jsx(root, containerAttributes), containerState.$hostsRendering$ = /* @__PURE__ */ new Set(), containerState.$renderPromise$ = Promise.resolve().then(() => renderRoot(node, ssrCtx, opts.stream, containerState, opts)), await containerState.$renderPromise$;
};
const renderRoot = async (node, ssrCtx, stream, containerState, opts) => {
  const beforeClose = opts.beforeClose;
  return await renderNode(node, ssrCtx, stream, 0, beforeClose ? (stream2) => {
    const result = beforeClose(ssrCtx.$contexts$, containerState);
    return processData(result, ssrCtx, stream2, 0, void 0);
  } : void 0), ssrCtx.rctx.$static$;
};
const renderNodeVirtual = (node, elCtx, extraNodes, ssrCtx, stream, flags, beforeClose) => {
  var _a2;
  const props = node.props;
  const renderQrl = props["q:renderFn"];
  if (renderQrl) {
    return elCtx.$renderQrl$ = renderQrl, renderSSRComponent(ssrCtx, stream, elCtx, node, flags, beforeClose);
  }
  let virtualComment = "<!--qv" + renderVirtualAttributes(props);
  const isSlot = "q:s" in props;
  const key = null != node.key ? String(node.key) : null;
  if (isSlot && ((_a2 = ssrCtx.hostCtx) == null ? void 0 : _a2.$id$, virtualComment += " q:sref=" + ssrCtx.hostCtx.$id$), null != key && (virtualComment += " q:key=" + key), virtualComment += "-->", stream.write(virtualComment), extraNodes) {
    for (const node2 of extraNodes) {
      renderNodeElementSync(node2.type, node2.props, stream);
    }
  }
  const promise = walkChildren(props.children, ssrCtx, stream, flags);
  return then(promise, () => {
    var _a3;
    if (!isSlot && !beforeClose) {
      return void stream.write(CLOSE_VIRTUAL);
    }
    let promise2;
    if (isSlot) {
      const content = (_a3 = ssrCtx.projectedChildren) == null ? void 0 : _a3[key];
      content && (ssrCtx.projectedChildren[key] = void 0, promise2 = processData(content, ssrCtx.projectedContext, stream, flags));
    }
    return beforeClose && (promise2 = then(promise2, () => beforeClose(stream))), then(promise2, () => {
      stream.write(CLOSE_VIRTUAL);
    });
  });
};
const CLOSE_VIRTUAL = "<!--/qv-->";
const renderVirtualAttributes = (attributes3) => {
  let text = "";
  for (const prop of Object.keys(attributes3)) {
    if ("children" === prop) {
      continue;
    }
    const value = attributes3[prop];
    null != value && (text += " " + ("" === value ? prop : prop + "=" + value));
  }
  return text;
};
const renderNodeElementSync = (tagName4, attributes3, stream) => {
  if (stream.write("<" + tagName4 + ((attributes4) => {
    let text = "";
    for (const prop of Object.keys(attributes4)) {
      if ("dangerouslySetInnerHTML" === prop) {
        continue;
      }
      const value = attributes4[prop];
      null != value && (text += " " + ("" === value ? prop : prop + '="' + value + '"'));
    }
    return text;
  })(attributes3) + ">"), !!emptyElements[tagName4]) {
    return;
  }
  const innerHTML = attributes3.dangerouslySetInnerHTML;
  null != innerHTML && stream.write(innerHTML), stream.write(`</${tagName4}>`);
};
const renderSSRComponent = (ssrCtx, stream, elCtx, node, flags, beforeClose) => (setComponentProps(ssrCtx.rctx, elCtx, node.props), then(executeComponent(ssrCtx.rctx, elCtx), (res) => {
  const hostElement = elCtx.$element$;
  const newCtx = res.rctx;
  const invocationContext = newInvokeContext(hostElement, void 0);
  invocationContext.$subscriber$ = hostElement, invocationContext.$renderCtx$ = newCtx;
  const projectedContext = {
    ...ssrCtx,
    rctx: newCtx
  };
  const newSSrContext = {
    ...ssrCtx,
    projectedChildren: splitProjectedChildren(node.props.children, ssrCtx),
    projectedContext,
    rctx: newCtx,
    invocationContext
  };
  const extraNodes = [];
  if (elCtx.$appendStyles$) {
    const array = 4 & flags ? ssrCtx.headNodes : extraNodes;
    for (const style of elCtx.$appendStyles$) {
      array.push(jsx("style", {
        "q:style": style.styleId,
        dangerouslySetInnerHTML: style.content
      }));
    }
  }
  const newID = getNextIndex(ssrCtx.rctx);
  const scopeId = elCtx.$scopeIds$ ? serializeSStyle(elCtx.$scopeIds$) : void 0;
  const processedNode = jsx(node.type, {
    "q:sstyle": scopeId,
    "q:id": newID,
    children: res.node
  }, node.key);
  return elCtx.$id$ = newID, ssrCtx.$contexts$.push(elCtx), newSSrContext.hostCtx = elCtx, renderNodeVirtual(processedNode, elCtx, extraNodes, newSSrContext, stream, flags, (stream2) => beforeClose ? then(renderQTemplates(newSSrContext, stream2), () => beforeClose(stream2)) : renderQTemplates(newSSrContext, stream2));
}));
const renderQTemplates = (ssrContext, stream) => {
  const projectedChildren = ssrContext.projectedChildren;
  if (projectedChildren) {
    const nodes = Object.keys(projectedChildren).map((slotName) => {
      const value = projectedChildren[slotName];
      if (value) {
        return jsx("q:template", {
          [QSlot]: slotName,
          hidden: "",
          "aria-hidden": "true",
          children: value
        });
      }
    });
    return processData(nodes, ssrContext, stream, 0, void 0);
  }
};
const splitProjectedChildren = (children3, ssrCtx) => {
  var _a2;
  const flatChildren = flatVirtualChildren(children3, ssrCtx);
  if (null === flatChildren) {
    return;
  }
  const slotMap = {};
  for (const child of flatChildren) {
    let slotName = "";
    isJSXNode(child) && (slotName = (_a2 = child.props[QSlot]) != null ? _a2 : "");
    let array = slotMap[slotName];
    array || (slotMap[slotName] = array = []), array.push(child);
  }
  return slotMap;
};
const createContext = (nodeType) => getContext({
  nodeType,
  _qc_: null
});
const renderNode = (node, ssrCtx, stream, flags, beforeClose) => {
  var _a2;
  const tagName4 = node.type;
  if ("string" == typeof tagName4) {
    const key = node.key;
    const props = node.props;
    const elCtx = createContext(1);
    const isHead = "head" === tagName4;
    const hostCtx = ssrCtx.hostCtx;
    let openingElement = "<" + tagName4 + ((elCtx2, attributes3) => {
      let text = "";
      for (const prop of Object.keys(attributes3)) {
        if ("children" === prop || "key" === prop || "class" === prop || "className" === prop || "dangerouslySetInnerHTML" === prop) {
          continue;
        }
        const value = attributes3[prop];
        if ("ref" === prop) {
          value.current = elCtx2.$element$;
          continue;
        }
        if (isOnProp(prop)) {
          setEvent(elCtx2.li, prop, value);
          continue;
        }
        const attrName = processPropKey(prop);
        const attrValue = processPropValue(attrName, value);
        null != attrValue && (text += " " + ("" === value ? attrName : attrName + '="' + escapeAttr(attrValue) + '"'));
      }
      return text;
    })(elCtx, props);
    let classStr = stringifyClass((_a2 = props.class) != null ? _a2 : props.className);
    if (hostCtx && (hostCtx.$scopeIds$ && (classStr = hostCtx.$scopeIds$.join(" ") + " " + classStr), !hostCtx.$attachedListeners$)) {
      hostCtx.$attachedListeners$ = true;
      for (const eventName of Object.keys(hostCtx.li)) {
        addQRLListener(elCtx.li, eventName, hostCtx.li[eventName]);
      }
    }
    isHead && (flags |= 1), classStr = classStr.trim(), classStr && (openingElement += ' class="' + classStr + '"');
    const listeners = Object.keys(elCtx.li);
    for (const key2 of listeners) {
      openingElement += " " + key2 + '="' + serializeQRLs(elCtx.li[key2], elCtx) + '"';
    }
    if (null != key && (openingElement += ' q:key="' + key + '"'), "ref" in props || listeners.length > 0) {
      const newID = getNextIndex(ssrCtx.rctx);
      openingElement += ' q:id="' + newID + '"', elCtx.$id$ = newID, ssrCtx.$contexts$.push(elCtx);
    }
    if (1 & flags && (openingElement += " q:head"), openingElement += ">", stream.write(openingElement), emptyElements[tagName4]) {
      return;
    }
    const innerHTML = props.dangerouslySetInnerHTML;
    if (null != innerHTML) {
      return stream.write(String(innerHTML)), void stream.write(`</${tagName4}>`);
    }
    isHead || (flags &= -2), "html" === tagName4 ? flags |= 4 : flags &= -5;
    const promise = processData(props.children, ssrCtx, stream, flags);
    return then(promise, () => {
      if (isHead) {
        for (const node2 of ssrCtx.headNodes) {
          renderNodeElementSync(node2.type, node2.props, stream);
        }
        ssrCtx.headNodes.length = 0;
      }
      if (beforeClose) {
        return then(beforeClose(stream), () => {
          stream.write(`</${tagName4}>`);
        });
      }
      stream.write(`</${tagName4}>`);
    });
  }
  if (tagName4 === Virtual) {
    const elCtx = createContext(111);
    return renderNodeVirtual(node, elCtx, void 0, ssrCtx, stream, flags, beforeClose);
  }
  if (tagName4 === SSRComment) {
    return void stream.write("<!--" + node.props.data + "-->");
  }
  if (tagName4 === InternalSSRStream) {
    return (async (node2, ssrCtx2, stream2, flags2) => {
      stream2.write("<!--qkssr-f-->");
      const generator = node2.props.children;
      let value;
      if (isFunction(generator)) {
        const v = generator({
          write(chunk) {
            stream2.write(chunk), stream2.write("<!--qkssr-f-->");
          }
        });
        if (isPromise(v)) {
          return v;
        }
        value = v;
      } else {
        value = generator;
      }
      for await (const chunk of value) {
        await processData(chunk, ssrCtx2, stream2, flags2, void 0), stream2.write("<!--qkssr-f-->");
      }
    })(node, ssrCtx, stream, flags);
  }
  const res = invoke(ssrCtx.invocationContext, tagName4, node.props, node.key);
  return processData(res, ssrCtx, stream, flags, beforeClose);
};
const processData = (node, ssrCtx, stream, flags, beforeClose) => {
  if (null != node && "boolean" != typeof node) {
    if (isString(node) || "number" == typeof node) {
      stream.write(escapeHtml(String(node)));
    } else {
      if (isJSXNode(node)) {
        return renderNode(node, ssrCtx, stream, flags, beforeClose);
      }
      if (isArray(node)) {
        return walkChildren(node, ssrCtx, stream, flags);
      }
      if (isPromise(node)) {
        return stream.write("<!--qkssr-f-->"), node.then((node2) => processData(node2, ssrCtx, stream, flags, beforeClose));
      }
    }
  }
};
function walkChildren(children3, ssrContext, stream, flags) {
  if (null == children3) {
    return;
  }
  if (!isArray(children3)) {
    return processData(children3, ssrContext, stream, flags);
  }
  if (1 === children3.length) {
    return processData(children3[0], ssrContext, stream, flags);
  }
  if (0 === children3.length) {
    return;
  }
  let currentIndex = 0;
  const buffers = [];
  return children3.reduce((prevPromise, child, index2) => {
    const buffer = [];
    buffers.push(buffer);
    const rendered = processData(child, ssrContext, prevPromise ? {
      write(chunk) {
        currentIndex === index2 ? stream.write(chunk) : buffer.push(chunk);
      }
    } : stream, flags);
    return isPromise(rendered) || prevPromise ? then(rendered, () => then(prevPromise, () => {
      currentIndex++, buffers.length > currentIndex && buffers[currentIndex].forEach((chunk) => stream.write(chunk));
    })) : void currentIndex++;
  }, void 0);
}
const flatVirtualChildren = (children3, ssrCtx) => {
  if (null == children3) {
    return null;
  }
  const result = _flatVirtualChildren(children3, ssrCtx);
  const nodes = isArray(result) ? result : [result];
  return 0 === nodes.length ? null : nodes;
};
const stringifyClass = (str) => {
  if (!str) {
    return "";
  }
  if ("string" == typeof str) {
    return str;
  }
  if (Array.isArray(str)) {
    return str.join(" ");
  }
  const output = [];
  for (const key in str) {
    Object.prototype.hasOwnProperty.call(str, key) && str[key] && output.push(key);
  }
  return output.join(" ");
};
const _flatVirtualChildren = (children3, ssrCtx) => {
  if (null == children3) {
    return null;
  }
  if (isArray(children3)) {
    return children3.flatMap((c) => _flatVirtualChildren(c, ssrCtx));
  }
  if (isJSXNode(children3) && isFunction(children3.type) && children3.type !== SSRComment && children3.type !== InternalSSRStream && children3.type !== Virtual) {
    const res = invoke(ssrCtx.invocationContext, children3.type, children3.props, children3.key);
    return flatVirtualChildren(res, ssrCtx);
  }
  return children3;
};
const setComponentProps = (rctx, ctx, expectProps) => {
  const keys = Object.keys(expectProps);
  if (0 === keys.length) {
    return;
  }
  const target = {};
  ctx.$props$ = createProps(target, rctx.$static$.$containerState$);
  for (const key of keys) {
    "children" !== key && "q:renderFn" !== key && (target[key] = expectProps[key]);
  }
};
function processPropKey(prop) {
  return "htmlFor" === prop ? "for" : prop;
}
function processPropValue(prop, value) {
  return "style" === prop ? stringifyStyle(value) : false === value || null == value ? null : true === value ? "" : String(value);
}
const emptyElements = {
  area: true,
  base: true,
  basefont: true,
  bgsound: true,
  br: true,
  col: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true
};
const ESCAPE_HTML = /[&<>]/g;
const ESCAPE_ATTRIBUTES = /[&"]/g;
const escapeHtml = (s) => s.replace(ESCAPE_HTML, (c) => {
  switch (c) {
    case "&":
      return "&amp;";
    case "<":
      return "&lt;";
    case ">":
      return "&gt;";
    default:
      return "";
  }
});
const escapeAttr = (s) => s.replace(ESCAPE_ATTRIBUTES, (c) => {
  switch (c) {
    case "&":
      return "&amp;";
    case '"':
      return "&quot;";
    default:
      return "";
  }
});
const useStore = (initialState, opts) => {
  var _a2;
  const { get, set: set2, ctx } = useSequentialScope();
  if (null != get) {
    return get;
  }
  const value = isFunction(initialState) ? initialState() : initialState;
  if (false === (opts == null ? void 0 : opts.reactive)) {
    return set2(value), value;
  }
  {
    const containerState = ctx.$renderCtx$.$static$.$containerState$;
    const newStore = createProxy(value, containerState, ((_a2 = opts == null ? void 0 : opts.recursive) != null ? _a2 : false) ? 1 : 0, void 0);
    return set2(newStore), newStore;
  }
};
const useRef = (current) => useStore({
  current
});
function useEnvData(key, defaultValue) {
  var _a2;
  return (_a2 = useInvokeContext().$renderCtx$.$static$.$containerState$.$envData$[key]) != null ? _a2 : defaultValue;
}
const STYLE_CACHE = /* @__PURE__ */ new Map();
const getScopedStyles = (css3, scopeId) => {
  let styleCss = STYLE_CACHE.get(scopeId);
  return styleCss || STYLE_CACHE.set(scopeId, styleCss = scopeStylesheet(css3, scopeId)), styleCss;
};
const scopeStylesheet = (css3, scopeId) => {
  const end = css3.length;
  const out = [];
  const stack = [];
  let idx = 0;
  let lastIdx = idx;
  let mode = rule;
  let lastCh = 0;
  for (; idx < end; ) {
    let ch = css3.charCodeAt(idx++);
    ch === BACKSLASH && (idx++, ch = A);
    const arcs = STATE_MACHINE[mode];
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      const [expectLastCh, expectCh, newMode] = arc;
      if ((expectLastCh === lastCh || expectLastCh === ANY || expectLastCh === IDENT && isIdent(lastCh) || expectLastCh === WHITESPACE && isWhiteSpace(lastCh)) && (expectCh === ch || expectCh === ANY || expectCh === IDENT && isIdent(ch) || expectCh === NOT_IDENT && !isIdent(ch) && ch !== DOT || expectCh === WHITESPACE && isWhiteSpace(ch)) && (3 == arc.length || lookAhead(arc))) {
        if (arc.length > 3 && (ch = css3.charCodeAt(idx - 1)), newMode === EXIT || newMode == EXIT_INSERT_SCOPE) {
          newMode === EXIT_INSERT_SCOPE && (mode !== starSelector || shouldNotInsertScoping() ? isChainedSelector(ch) || insertScopingSelector(idx - (expectCh == NOT_IDENT ? 1 : expectCh == CLOSE_PARENTHESIS ? 2 : 0)) : (isChainedSelector(ch) ? flush(idx - 2) : insertScopingSelector(idx - 2), lastIdx++)), expectCh === NOT_IDENT && (idx--, ch = lastCh);
          do {
            mode = stack.pop() || rule, mode === pseudoGlobal && (flush(idx - 1), lastIdx++);
          } while (isSelfClosingRule(mode));
        } else {
          stack.push(mode), mode === pseudoGlobal && newMode === rule ? (flush(idx - 8), lastIdx = idx) : newMode === pseudoElement && insertScopingSelector(idx - 2), mode = newMode;
        }
        break;
      }
    }
    lastCh = ch;
  }
  return flush(idx), out.join("");
  function flush(idx2) {
    out.push(css3.substring(lastIdx, idx2)), lastIdx = idx2;
  }
  function insertScopingSelector(idx2) {
    mode === pseudoGlobal || shouldNotInsertScoping() || (flush(idx2), out.push(".", "\u2B50\uFE0F", scopeId));
  }
  function lookAhead(arc) {
    let prefix = 0;
    if (css3.charCodeAt(idx) === DASH) {
      for (let i = 1; i < 10; i++) {
        if (css3.charCodeAt(idx + i) === DASH) {
          prefix = i + 1;
          break;
        }
      }
    }
    words:
      for (let arcIndx = 3; arcIndx < arc.length; arcIndx++) {
        const txt = arc[arcIndx];
        for (let i = 0; i < txt.length; i++) {
          if ((css3.charCodeAt(idx + i + prefix) | LOWERCASE) !== txt.charCodeAt(i)) {
            continue words;
          }
        }
        return idx += txt.length + prefix, true;
      }
    return false;
  }
  function shouldNotInsertScoping() {
    return -1 !== stack.indexOf(pseudoGlobal) || -1 !== stack.indexOf(atRuleSelector);
  }
};
const isIdent = (ch) => ch >= _0 && ch <= _9 || ch >= A && ch <= Z || ch >= a && ch <= z || ch >= 128 || ch === UNDERSCORE || ch === DASH;
const isChainedSelector = (ch) => ch === COLON || ch === DOT || ch === OPEN_BRACKET || ch === HASH || isIdent(ch);
const isSelfClosingRule = (mode) => mode === atRuleBlock || mode === atRuleSelector || mode === atRuleInert || mode === pseudoGlobal;
const isWhiteSpace = (ch) => ch === SPACE || ch === TAB || ch === NEWLINE || ch === CARRIAGE_RETURN;
const rule = 0;
const starSelector = 2;
const pseudoGlobal = 5;
const pseudoElement = 6;
const atRuleSelector = 10;
const atRuleBlock = 11;
const atRuleInert = 12;
const EXIT = 17;
const EXIT_INSERT_SCOPE = 18;
const ANY = 0;
const IDENT = 1;
const NOT_IDENT = 2;
const WHITESPACE = 3;
const TAB = 9;
const NEWLINE = 10;
const CARRIAGE_RETURN = 13;
const SPACE = 32;
const HASH = 35;
const CLOSE_PARENTHESIS = 41;
const DASH = 45;
const DOT = 46;
const _0 = 48;
const _9 = 57;
const COLON = 58;
const A = 65;
const Z = 90;
const OPEN_BRACKET = 91;
const BACKSLASH = 92;
const UNDERSCORE = 95;
const LOWERCASE = 32;
const a = 97;
const z = 122;
const STRINGS_COMMENTS = [[ANY, 39, 14], [ANY, 34, 15], [ANY, 47, 16, "*"]];
const STATE_MACHINE = [[[ANY, 42, starSelector], [ANY, OPEN_BRACKET, 7], [ANY, COLON, pseudoElement, ":"], [ANY, COLON, pseudoGlobal, "global"], [ANY, COLON, 3, "has", "host-context", "not", "where", "is", "matches", "any"], [ANY, COLON, 4], [ANY, IDENT, 1], [ANY, DOT, 1], [ANY, HASH, 1], [ANY, 64, atRuleSelector, "keyframe"], [ANY, 64, atRuleBlock, "media", "supports"], [ANY, 64, atRuleInert], [ANY, 123, 13], [47, 42, 16], [ANY, 59, EXIT], [ANY, 125, EXIT], [ANY, CLOSE_PARENTHESIS, EXIT], ...STRINGS_COMMENTS], [[ANY, NOT_IDENT, EXIT_INSERT_SCOPE]], [[ANY, NOT_IDENT, EXIT_INSERT_SCOPE]], [[ANY, 40, rule], [ANY, NOT_IDENT, EXIT_INSERT_SCOPE]], [[ANY, 40, 8], [ANY, NOT_IDENT, EXIT_INSERT_SCOPE]], [[ANY, 40, rule], [ANY, NOT_IDENT, EXIT]], [[ANY, NOT_IDENT, EXIT]], [[ANY, 93, EXIT_INSERT_SCOPE], [ANY, 39, 14], [ANY, 34, 15]], [[ANY, CLOSE_PARENTHESIS, EXIT], ...STRINGS_COMMENTS], [[ANY, 125, EXIT], ...STRINGS_COMMENTS], [[ANY, 125, EXIT], [WHITESPACE, IDENT, 1], [ANY, COLON, pseudoGlobal, "global"], [ANY, 123, 13], ...STRINGS_COMMENTS], [[ANY, 123, rule], [ANY, 59, EXIT], ...STRINGS_COMMENTS], [[ANY, 59, EXIT], [ANY, 123, 9], ...STRINGS_COMMENTS], [[ANY, 125, EXIT], [ANY, 123, 13], [ANY, 40, 8], ...STRINGS_COMMENTS], [[ANY, 39, EXIT]], [[ANY, 34, EXIT]], [[42, 47, EXIT]]];
const useStylesScopedQrl = (styles2) => {
  _useStyles(styles2, getScopedStyles, true);
};
const _useStyles = (styleQrl, transform, scoped) => {
  const { get, set: set2, ctx, i } = useSequentialScope();
  if (get) {
    return get;
  }
  const renderCtx = ctx.$renderCtx$;
  const styleId = (index2 = i, `${((text, hash = 0) => {
    if (0 === text.length) {
      return hash;
    }
    for (let i2 = 0; i2 < text.length; i2++) {
      hash = (hash << 5) - hash + text.charCodeAt(i2), hash |= 0;
    }
    return Number(Math.abs(hash)).toString(36);
  })(styleQrl.$hash$)}-${index2}`);
  var index2;
  const containerState = renderCtx.$static$.$containerState$;
  const elCtx = getContext(ctx.$hostElement$);
  if (set2(styleId), elCtx.$appendStyles$ || (elCtx.$appendStyles$ = []), elCtx.$scopeIds$ || (elCtx.$scopeIds$ = []), scoped && elCtx.$scopeIds$.push(((styleId2) => "\u2B50\uFE0F" + styleId2)(styleId)), ((containerState2, styleId2) => containerState2.$styleIds$.has(styleId2))(containerState, styleId)) {
    return styleId;
  }
  containerState.$styleIds$.add(styleId);
  const value = styleQrl.$resolveLazy$(containerState.$containerEl$);
  const appendStyle = (styleText) => {
    elCtx.$appendStyles$, elCtx.$appendStyles$.push({
      styleId,
      content: transform(styleText, styleId)
    });
  };
  return isPromise(value) ? ctx.$waitOn$.push(value.then(appendStyle)) : appendStyle(value), styleId;
};
const QwikLogo = () => /* @__PURE__ */ jsx("svg", {
  width: "100",
  height: "35",
  viewBox: "0 0 167 53",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  children: [
    /* @__PURE__ */ jsx("path", {
      d: "M81.9545 46.5859H75.5513V35.4045C73.4363 36.8579 71.0496 37.5749 68.4884 37.5749C65.0151 37.5749 62.4344 36.6253 60.8239 34.6487C59.2134 32.6915 58.3984 29.2034 58.3984 24.2231C58.3984 19.1266 59.3492 15.5997 61.2702 13.5456C63.23 11.4721 66.3734 10.4644 70.7004 10.4644C74.7946 10.4644 78.5201 11.0264 81.9545 12.131V46.5859ZM75.5513 16.278C74.096 15.8323 72.4661 15.6191 70.7004 15.6191C68.5272 15.6191 66.9749 16.1811 66.1017 17.3244C65.2479 18.4871 64.7823 20.6962 64.7823 23.9712C64.7823 27.0524 65.1897 29.1065 66.0435 30.2304C66.8973 31.335 68.3719 31.897 70.5452 31.897C73.3781 31.897 75.5513 30.7343 75.5513 29.2809V16.278Z",
      fill: "black"
    }),
    /* @__PURE__ */ jsx("path", {
      d: "M91.133 11.1426C93.4033 17.4406 95.3242 23.7386 96.993 30.0948C99.205 23.5836 101.087 17.2856 102.542 11.1426H108.15C110.265 17.4406 112.031 23.7386 113.447 30.0948C115.97 23.196 117.949 16.8787 119.404 11.1426H125.71C123.033 20.173 120.064 28.777 116.785 36.8966H109.256C108.402 32.3039 107.044 26.7617 105.22 20.1536C104.056 25.2889 102.445 30.8893 100.33 36.8966H92.8018C90.2793 27.5174 87.5434 18.9522 84.6328 11.1426H91.133Z",
      fill: "black"
    }),
    /* @__PURE__ */ jsx("path", {
      d: "M132.832 7.55758C129.999 7.55758 129.203 6.85996 129.203 3.97257C129.203 1.39523 130.018 0.794495 132.832 0.794495C135.665 0.794495 136.46 1.39523 136.46 3.97257C136.46 6.85996 135.665 7.55758 132.832 7.55758ZM129.649 11.1426H136.053V36.8966H129.649V11.1426Z",
      fill: "black"
    }),
    /* @__PURE__ */ jsx("path", {
      d: "M166.303 11.1426C161.763 17.5956 158.581 21.5295 156.815 22.9441C158.27 23.8937 162.17 28.8933 167.002 36.916H159.628C153.613 27.7887 150.742 23.8549 149.325 23.2542V36.916H142.922V0H149.325V23.2348C150.78 22.169 153.963 18.1382 158.872 11.1426H166.303Z",
      fill: "black"
    }),
    /* @__PURE__ */ jsx("path", {
      d: "M40.973 52.5351L32.0861 43.6985L31.9503 43.7179V43.621L13.0511 24.9595L17.708 20.4637L14.9721 4.76715L1.99103 20.8513C-0.220992 23.0798 -0.628467 26.7036 0.962635 29.3778L9.07337 42.8265C10.3152 44.9 12.566 46.1402 14.9915 46.1208L19.0081 46.082L40.973 52.5351Z",
      fill: "#18B6F6"
    }),
    /* @__PURE__ */ jsx("path", {
      d: "M45.8232 20.5411L44.038 17.2468L43.1066 15.5609L42.738 14.902L42.6992 14.9408L37.8094 6.47238C36.587 4.34075 34.2974 3.02301 31.8137 3.04239L27.5255 3.15865L14.7384 3.19741C12.313 3.21679 10.101 4.49577 8.87853 6.56927L1.09766 21.9945L15.0101 4.72831L33.2496 24.7656L30.0091 28.0406L31.9495 43.7178L31.9689 43.679V43.7178H31.9301L31.9689 43.7565L33.4824 45.2293L40.8364 52.4187C41.1469 52.7094 41.6514 52.3606 41.4379 51.9924L36.8975 43.0589L44.8142 28.4282L45.0664 28.1375C45.1634 28.0212 45.2604 27.905 45.3381 27.7887C46.8904 25.6764 47.1038 22.8472 45.8232 20.5411Z",
      fill: "#AC7EF4"
    }),
    /* @__PURE__ */ jsx("path", {
      d: "M33.3076 24.6882L15.0099 4.74774L17.61 20.3668L12.9531 24.882L31.9105 43.6985L30.203 28.0794L33.3076 24.6882Z",
      fill: "white"
    })
  ]
});
const styles = "header {\n  background: var(--qwik-purple);\n}\nheader {\n  display: flex;\n  background: white;\n  border-bottom: 10px solid var(--qwik-dark-purple);\n}\n\nheader .logo a {\n  display: inline-block;\n  padding: 10px 10px 7px 20px;\n}\n\nheader ul {\n  margin: 0;\n  padding: 3px 10px 0 0;\n  list-style: none;\n  flex: 1;\n  text-align: right;\n}\n\nheader li {\n  display: inline-block;\n  margin: 0;\n  padding: 0;\n}\n\nheader li a {\n  display: inline-block;\n  padding: 15px 10px;\n  text-decoration: none;\n}\n\nheader li a:hover {\n  text-decoration: underline;\n}\n";
const Header = /* @__PURE__ */ componentQrl(inlinedQrl(() => {
  useStylesScopedQrl(inlinedQrl(styles, "s_N39ca0w8E8Y"));
  return /* @__PURE__ */ jsx("header", {
    children: [
      /* @__PURE__ */ jsx("div", {
        class: "logo",
        children: /* @__PURE__ */ jsx("a", {
          href: "https://qwik.builder.io/",
          target: "_blank",
          children: /* @__PURE__ */ jsx(QwikLogo, {})
        })
      }),
      /* @__PURE__ */ jsx("ul", {
        children: [
          /* @__PURE__ */ jsx("li", {
            children: /* @__PURE__ */ jsx("a", {
              href: "https://qwik.builder.io/docs/components/overview/",
              target: "_blank",
              children: "Docs"
            })
          }),
          /* @__PURE__ */ jsx("li", {
            children: /* @__PURE__ */ jsx("a", {
              href: "https://qwik.builder.io/examples/introduction/hello-world/",
              target: "_blank",
              children: "Exampa"
            })
          }),
          /* @__PURE__ */ jsx("li", {
            children: /* @__PURE__ */ jsx("a", {
              href: "https://qwik.builder.io/tutorial/welcome/overview/",
              target: "_blank",
              children: "Tutorials"
            })
          })
        ]
      })
    ]
  });
}, "s_ceU05TscGYE"));
const layout = /* @__PURE__ */ componentQrl(inlinedQrl(() => {
  return /* @__PURE__ */ jsx(Fragment$1, {
    children: [
      /* @__PURE__ */ jsx(Header, {}),
      /* @__PURE__ */ jsx("main", {
        children: /* @__PURE__ */ jsx(Slot, {})
      }),
      /* @__PURE__ */ jsx("footer", {
        children: /* @__PURE__ */ jsx("a", {
          href: "https://www.builder.io/",
          target: "_blank",
          children: "Made with \u2661 by Builder.iohh"
        })
      })
    ]
  });
}, "s_VkLNXphUh5s"));
const Layout_ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: layout
}, Symbol.toStringTag, { value: "Module" }));
const isServer = true;
const isBrowser$1 = false;
const ContentContext = /* @__PURE__ */ createContext$1("qc-c");
const ContentInternalContext = /* @__PURE__ */ createContext$1("qc-ic");
const DocumentHeadContext = /* @__PURE__ */ createContext$1("qc-h");
const RouteLocationContext = /* @__PURE__ */ createContext$1("qc-l");
const RouteNavigateContext = /* @__PURE__ */ createContext$1("qc-n");
const RouterOutlet = /* @__PURE__ */ componentQrl(inlinedQrl(() => {
  const { contents } = useContext(ContentInternalContext);
  if (contents && contents.length > 0) {
    const contentsLen = contents.length;
    let cmp = null;
    for (let i = contentsLen - 1; i >= 0; i--)
      cmp = jsx(contents[i].default, {
        children: cmp
      });
    return cmp;
  }
  return SkipRender;
}, "RouterOutlet_component_nd8yk3KO22c"));
const MODULE_CACHE$1 = /* @__PURE__ */ new WeakMap();
const loadRoute$1 = async (routes2, menus2, cacheModules2, pathname) => {
  if (Array.isArray(routes2))
    for (const route of routes2) {
      const match = route[0].exec(pathname);
      if (match) {
        const loaders = route[1];
        const params = getRouteParams$1(route[2], match);
        const routeBundleNames = route[4];
        const mods = new Array(loaders.length);
        const pendingLoads = [];
        const menuLoader = getMenuLoader$1(menus2, pathname);
        let menu = void 0;
        loaders.forEach((moduleLoader, i) => {
          loadModule$1(moduleLoader, pendingLoads, (routeModule) => mods[i] = routeModule, cacheModules2);
        });
        loadModule$1(menuLoader, pendingLoads, (menuModule) => menu = menuModule == null ? void 0 : menuModule.default, cacheModules2);
        if (pendingLoads.length > 0)
          await Promise.all(pendingLoads);
        return [
          params,
          mods,
          menu,
          routeBundleNames
        ];
      }
    }
  return null;
};
const loadModule$1 = (moduleLoader, pendingLoads, moduleSetter, cacheModules2) => {
  if (typeof moduleLoader === "function") {
    const loadedModule = MODULE_CACHE$1.get(moduleLoader);
    if (loadedModule)
      moduleSetter(loadedModule);
    else {
      const l = moduleLoader();
      if (typeof l.then === "function")
        pendingLoads.push(l.then((loadedModule2) => {
          if (cacheModules2 !== false)
            MODULE_CACHE$1.set(moduleLoader, loadedModule2);
          moduleSetter(loadedModule2);
        }));
      else if (l)
        moduleSetter(l);
    }
  }
};
const getMenuLoader$1 = (menus2, pathname) => {
  if (menus2) {
    const menu = menus2.find((m) => m[0] === pathname || pathname.startsWith(m[0] + (pathname.endsWith("/") ? "" : "/")));
    if (menu)
      return menu[1];
  }
  return void 0;
};
const getRouteParams$1 = (paramNames, match) => {
  const params = {};
  if (paramNames)
    for (let i = 0; i < paramNames.length; i++)
      params[paramNames[i]] = match ? match[i + 1] : "";
  return params;
};
const resolveHead = (endpoint, routeLocation, contentModules) => {
  const head = createDocumentHead();
  const headProps = {
    data: endpoint ? endpoint.body : null,
    head,
    ...routeLocation
  };
  for (let i = contentModules.length - 1; i >= 0; i--) {
    const contentModuleHead = contentModules[i] && contentModules[i].head;
    if (contentModuleHead) {
      if (typeof contentModuleHead === "function")
        resolveDocumentHead(head, contentModuleHead(headProps));
      else if (typeof contentModuleHead === "object")
        resolveDocumentHead(head, contentModuleHead);
    }
  }
  return headProps.head;
};
const resolveDocumentHead = (resolvedHead, updatedHead) => {
  if (typeof updatedHead.title === "string")
    resolvedHead.title = updatedHead.title;
  mergeArray(resolvedHead.meta, updatedHead.meta);
  mergeArray(resolvedHead.links, updatedHead.links);
  mergeArray(resolvedHead.styles, updatedHead.styles);
};
const mergeArray = (existingArr, newArr) => {
  if (Array.isArray(newArr))
    for (const newItem of newArr) {
      if (typeof newItem.key === "string") {
        const existingIndex = existingArr.findIndex((i) => i.key === newItem.key);
        if (existingIndex > -1) {
          existingArr[existingIndex] = newItem;
          continue;
        }
      }
      existingArr.push(newItem);
    }
};
const createDocumentHead = () => ({
  title: "",
  meta: [],
  links: [],
  styles: []
});
const useDocumentHead = () => useContext(DocumentHeadContext);
const useLocation = () => useContext(RouteLocationContext);
const useNavigate = () => useContext(RouteNavigateContext);
const useQwikCityEnv = () => noSerialize(useEnvData("qwikcity"));
const toPath = (url) => url.pathname + url.search + url.hash;
const toUrl = (url, baseUrl) => new URL(url, baseUrl.href);
const isSameOrigin = (a2, b) => a2.origin === b.origin;
const isSamePath = (a2, b) => a2.pathname + a2.search === b.pathname + b.search;
const isSamePathname = (a2, b) => a2.pathname === b.pathname;
const isSameOriginDifferentPathname = (a2, b) => isSameOrigin(a2, b) && !isSamePath(a2, b);
const getClientEndpointPath = (pathname) => pathname + (pathname.endsWith("/") ? "" : "/") + "q-data.json";
const getClientNavPath = (props, baseUrl) => {
  const href = props.href;
  if (typeof href === "string" && href.trim() !== "" && typeof props.target !== "string")
    try {
      const linkUrl = toUrl(href, baseUrl);
      const currentUrl = toUrl("", baseUrl);
      if (isSameOrigin(linkUrl, currentUrl))
        return toPath(linkUrl);
    } catch (e) {
      console.error(e);
    }
  return null;
};
const getPrefetchUrl = (props, clientNavPath, currentLoc) => {
  if (props.prefetch && clientNavPath) {
    const prefetchUrl = toUrl(clientNavPath, currentLoc);
    if (!isSamePathname(prefetchUrl, toUrl("", currentLoc)))
      return prefetchUrl + "";
  }
  return null;
};
const clientNavigate = (win, routeNavigate) => {
  const currentUrl = win.location;
  const newUrl = toUrl(routeNavigate.path, currentUrl);
  if (isSameOriginDifferentPathname(currentUrl, newUrl)) {
    handleScroll(win, currentUrl, newUrl);
    win.history.pushState("", "", toPath(newUrl));
  }
  if (!win[CLIENT_HISTORY_INITIALIZED]) {
    win[CLIENT_HISTORY_INITIALIZED] = 1;
    win.addEventListener("popstate", () => {
      const currentUrl2 = win.location;
      const previousUrl = toUrl(routeNavigate.path, currentUrl2);
      if (isSameOriginDifferentPathname(currentUrl2, previousUrl)) {
        handleScroll(win, previousUrl, currentUrl2);
        routeNavigate.path = toPath(currentUrl2);
      }
    });
  }
};
const handleScroll = async (win, previousUrl, newUrl) => {
  const doc = win.document;
  const newHash = newUrl.hash;
  if (isSamePath(previousUrl, newUrl)) {
    if (previousUrl.hash !== newHash) {
      await domWait();
      if (newHash)
        scrollToHashId(doc, newHash);
      else
        win.scrollTo(0, 0);
    }
  } else {
    if (newHash)
      for (let i = 0; i < 24; i++) {
        await domWait();
        if (scrollToHashId(doc, newHash))
          break;
      }
    else {
      await domWait();
      win.scrollTo(0, 0);
    }
  }
};
const domWait = () => new Promise((resolve) => setTimeout(resolve, 12));
const scrollToHashId = (doc, hash) => {
  const elmId = hash.slice(1);
  const elm = doc.getElementById(elmId);
  if (elm)
    elm.scrollIntoView();
  return elm;
};
const dispatchPrefetchEvent = (prefetchData) => dispatchEvent(new CustomEvent("qprefetch", {
  detail: prefetchData
}));
const CLIENT_HISTORY_INITIALIZED = /* @__PURE__ */ Symbol();
const loadClientData = async (href) => {
  const { cacheModules: cacheModules2 } = await Promise.resolve().then(() => _qwikCityPlan);
  const pagePathname = new URL(href).pathname;
  const endpointUrl = getClientEndpointPath(pagePathname);
  const now = Date.now();
  const expiration = cacheModules2 ? 6e5 : 15e3;
  const cachedClientPageIndex = cachedClientPages.findIndex((c) => c.u === endpointUrl);
  let cachedClientPageData = cachedClientPages[cachedClientPageIndex];
  dispatchPrefetchEvent({
    links: [
      pagePathname
    ]
  });
  if (!cachedClientPageData || cachedClientPageData.t + expiration < now) {
    cachedClientPageData = {
      u: endpointUrl,
      t: now,
      c: new Promise((resolve) => {
        fetch(endpointUrl).then((clientResponse) => {
          const contentType = clientResponse.headers.get("content-type") || "";
          if (clientResponse.ok && contentType.includes("json"))
            clientResponse.json().then((clientData) => {
              dispatchPrefetchEvent({
                bundles: clientData.prefetch,
                links: [
                  pagePathname
                ]
              });
              resolve(clientData);
            }, () => resolve(null));
          else
            resolve(null);
        }, () => resolve(null));
      })
    };
    for (let i = cachedClientPages.length - 1; i >= 0; i--)
      if (cachedClientPages[i].t + expiration < now)
        cachedClientPages.splice(i, 1);
    cachedClientPages.push(cachedClientPageData);
  }
  cachedClientPageData.c.catch((e) => console.error(e));
  return cachedClientPageData.c;
};
const cachedClientPages = [];
const QwikCity = /* @__PURE__ */ componentQrl(inlinedQrl(() => {
  const env = useQwikCityEnv();
  if (!(env == null ? void 0 : env.params))
    throw new Error(`Missing Qwik City Env Data`);
  const urlEnv = useEnvData("url");
  if (!urlEnv)
    throw new Error(`Missing Qwik URL Env Data`);
  const url = new URL(urlEnv);
  const routeLocation = useStore({
    href: url.href,
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    params: env.params
  });
  const routeNavigate = useStore({
    path: toPath(url)
  });
  const documentHead = useStore(createDocumentHead);
  const content = useStore({
    headings: void 0,
    menu: void 0
  });
  const contentInternal = useStore({
    contents: void 0
  });
  useContextProvider(ContentContext, content);
  useContextProvider(ContentInternalContext, contentInternal);
  useContextProvider(DocumentHeadContext, documentHead);
  useContextProvider(RouteLocationContext, routeLocation);
  useContextProvider(RouteNavigateContext, routeNavigate);
  useWatchQrl(inlinedQrl(async ({ track: track2 }) => {
    const [content2, contentInternal2, documentHead2, env2, routeLocation2, routeNavigate2] = useLexicalScope();
    const { routes: routes2, menus: menus2, cacheModules: cacheModules2 } = await Promise.resolve().then(() => _qwikCityPlan);
    const path = track2(routeNavigate2, "path");
    const url2 = new URL(path, routeLocation2.href);
    const pathname = url2.pathname;
    const loadRoutePromise = loadRoute$1(routes2, menus2, cacheModules2, pathname);
    const endpointResponse = isServer ? env2.response : loadClientData(url2.href);
    const loadedRoute = await loadRoutePromise;
    if (loadedRoute) {
      const [params, mods, menu] = loadedRoute;
      const contentModules = mods;
      const pageModule = contentModules[contentModules.length - 1];
      routeLocation2.href = url2.href;
      routeLocation2.pathname = pathname;
      routeLocation2.params = {
        ...params
      };
      routeLocation2.query = Object.fromEntries(url2.searchParams.entries());
      content2.headings = pageModule.headings;
      content2.menu = menu;
      contentInternal2.contents = noSerialize(contentModules);
      const clientPageData = await endpointResponse;
      const resolvedHead = resolveHead(clientPageData, routeLocation2, contentModules);
      documentHead2.links = resolvedHead.links;
      documentHead2.meta = resolvedHead.meta;
      documentHead2.styles = resolvedHead.styles;
      documentHead2.title = resolvedHead.title;
      if (isBrowser$1)
        clientNavigate(window, routeNavigate2);
    }
  }, "QwikCity_component_useWatch_AaAlzKH0KlQ", [
    content,
    contentInternal,
    documentHead,
    env,
    routeLocation,
    routeNavigate
  ]));
  return /* @__PURE__ */ jsx(Slot, {});
}, "QwikCity_component_z1nvHyEppoI"));
/* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  const nav = useNavigate();
  const loc = useLocation();
  const originalHref = props.href;
  const linkProps = {
    ...props
  };
  const clientNavPath = getClientNavPath(linkProps, loc);
  const prefetchUrl = getPrefetchUrl(props, clientNavPath, loc);
  linkProps["preventdefault:click"] = !!clientNavPath;
  linkProps.href = clientNavPath || originalHref;
  return /* @__PURE__ */ jsx("a", {
    ...linkProps,
    onClick$: inlinedQrl(() => {
      const [clientNavPath2, linkProps2, nav2] = useLexicalScope();
      if (clientNavPath2)
        nav2.path = linkProps2.href;
    }, "Link_component_a_onClick_hA9UPaY8sNQ", [
      clientNavPath,
      linkProps,
      nav
    ]),
    "data-prefetch": prefetchUrl,
    onMouseOver$: inlinedQrl((_, elm) => prefetchLinkResources(elm), "Link_component_a_onMouseOver_skxgNVWVOT8"),
    onQVisible$: inlinedQrl((_, elm) => prefetchLinkResources(elm, true), "Link_component_a_onQVisible_uVE5iM9H73c"),
    children: /* @__PURE__ */ jsx(Slot, {})
  });
}, "Link_component_mYsiJcA4IBc"));
const prefetchLinkResources = (elm, isOnVisible) => {
  var _a2;
  const prefetchUrl = (_a2 = elm == null ? void 0 : elm.dataset) == null ? void 0 : _a2.prefetch;
  if (prefetchUrl) {
    if (!windowInnerWidth)
      windowInnerWidth = window.innerWidth;
    if (!isOnVisible || isOnVisible && windowInnerWidth < 520)
      loadClientData(prefetchUrl);
  }
};
let windowInnerWidth = 0;
const swRegister = '((s,a,r,i)=>{r=(e,t)=>{t=document.querySelector("[q\\\\:base]"),t&&a.active&&a.active.postMessage({type:"qprefetch",base:t.getAttribute("q:base"),...e})},addEventListener("qprefetch",e=>{const t=e.detail;a?r(t):t.bundles&&s.push(...t.bundles)}),navigator.serviceWorker.register("/service-worker.js").then(e=>{i=()=>{a=e,r({bundles:s})},e.installing?e.installing.addEventListener("statechange",t=>{t.target.state=="activated"&&i()}):e.active&&i()}).catch(e=>console.error(e))})([])';
const ServiceWorkerRegister = () => jsx("script", {
  dangerouslySetInnerHTML: swRegister
});
const TARGET = "qwik";
function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
const registry = {};
function register(type, info) {
  let typeList = registry[type];
  if (!typeList)
    typeList = registry[type] = [];
  typeList.push(info);
  if (isBrowser()) {
    const message = {
      type: "builder.register",
      data: {
        type,
        info
      }
    };
    try {
      parent.postMessage(message, "*");
      if (parent !== window)
        window.postMessage(message, "*");
    } catch (err) {
      console.debug("Could not postmessage", err);
    }
  }
}
const registerInsertMenu = () => {
  register("insertMenu", {
    name: "_default",
    default: true,
    items: [
      {
        name: "Box"
      },
      {
        name: "Text"
      },
      {
        name: "Image"
      },
      {
        name: "Columns"
      },
      ...[
        {
          name: "Core:Section"
        },
        {
          name: "Core:Button"
        },
        {
          name: "Embed"
        },
        {
          name: "Custom Code"
        }
      ]
    ]
  });
};
const setupBrowserForEditing = () => {
  var _a2;
  if (isBrowser()) {
    (_a2 = window.parent) == null ? void 0 : _a2.postMessage({
      type: "builder.sdkInfo",
      data: {
        target: TARGET,
        supportsPatchUpdates: false
      }
    }, "*");
    window.addEventListener("message", ({ data }) => {
      var _a3, _b;
      if (data)
        switch (data.type) {
          case "builder.evaluate": {
            const text = data.data.text;
            const args = data.data.arguments || [];
            const id = data.data.id;
            const fn = new Function(text);
            let result;
            let error = null;
            try {
              result = fn.apply(null, args);
            } catch (err) {
              error = err;
            }
            if (error)
              (_a3 = window.parent) == null ? void 0 : _a3.postMessage({
                type: "builder.evaluateError",
                data: {
                  id,
                  error: error.message
                }
              }, "*");
            else if (result && typeof result.then === "function")
              result.then((finalResult) => {
                var _a4;
                (_a4 = window.parent) == null ? void 0 : _a4.postMessage({
                  type: "builder.evaluateResult",
                  data: {
                    id,
                    result: finalResult
                  }
                }, "*");
              }).catch(console.error);
            else
              (_b = window.parent) == null ? void 0 : _b.postMessage({
                type: "builder.evaluateResult",
                data: {
                  result,
                  id
                }
              }, "*");
            break;
          }
        }
    });
  }
};
const BuilderContext = createContext$1("Builder");
function isIframe() {
  return isBrowser() && window.self !== window.top;
}
function isEditing() {
  return isIframe() && window.location.search.indexOf("builder.frameEditing=") !== -1;
}
const SIZES = {
  small: {
    min: 320,
    default: 321,
    max: 640
  },
  medium: {
    min: 641,
    default: 642,
    max: 991
  },
  large: {
    min: 990,
    default: 991,
    max: 1200
  }
};
const getMaxWidthQueryForSize = (size) => `@media (max-width: ${SIZES[size].max}px)`;
function evaluate({ code, context, state, event }) {
  if (code === "") {
    console.warn("Skipping evaluation of empty code block.");
    return;
  }
  const builder = {
    isEditing: isEditing(),
    isBrowser: isBrowser(),
    isServer: !isBrowser()
  };
  const useReturn = !(code.includes(";") || code.includes(" return ") || code.trim().startsWith("return "));
  const useCode = useReturn ? `return (${code});` : code;
  try {
    return new Function("builder", "Builder", "state", "context", "event", useCode)(builder, builder, state, context, event);
  } catch (e) {
    console.warn("Builder custom code error: \n While Evaluating: \n ", useCode, "\n", e.message || e);
  }
}
const set = (obj, _path, value) => {
  if (Object(obj) !== obj)
    return obj;
  const path = Array.isArray(_path) ? _path : _path.toString().match(/[^.[\]]+/g);
  path.slice(0, -1).reduce((a2, c, i) => Object(a2[c]) === a2[c] ? a2[c] : a2[c] = Math.abs(Number(path[i + 1])) >> 0 === +path[i + 1] ? [] : {}, obj)[path[path.length - 1]] = value;
  return obj;
};
function transformBlock(block) {
  return block;
}
const evaluateBindings = ({ block, context, state }) => {
  if (!block.bindings)
    return block;
  const copied = {
    ...block,
    properties: {
      ...block.properties
    },
    actions: {
      ...block.actions
    }
  };
  for (const binding in block.bindings) {
    const expression = block.bindings[binding];
    const value = evaluate({
      code: expression,
      state,
      context
    });
    set(copied, binding, value);
  }
  return copied;
};
function getProcessedBlock({ block, context, shouldEvaluateBindings, state }) {
  const transformedBlock = transformBlock(block);
  if (shouldEvaluateBindings)
    return evaluateBindings({
      block: transformedBlock,
      state,
      context
    });
  else
    return transformedBlock;
}
const camelToKebabCase = (string) => string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
const convertStyleMaptoCSS = (style) => {
  const cssProps = Object.entries(style).map(([key, value]) => {
    if (typeof value === "string")
      return `${camelToKebabCase(key)}: ${value};`;
  });
  return cssProps.join("\n");
};
const tagName$1 = function tagName(props, state) {
  return "style";
};
const RenderInlinedStyles = (props) => {
  const state = {
    tagName: ""
  };
  state.tagName = tagName$1();
  return /* @__PURE__ */ jsx(Fragment$1, {
    children: /* @__PURE__ */ jsx(state.tagName, {
      children: props.styles
    })
  });
};
const RenderInlinedStyles$1 = RenderInlinedStyles;
const useBlock$1 = function useBlock(props, state) {
  return getProcessedBlock({
    block: props.block,
    state: props.context.state,
    context: props.context.context,
    shouldEvaluateBindings: true
  });
};
const css = function css2(props, state) {
  const styles2 = useBlock$1(props).responsiveStyles;
  const largeStyles = styles2 == null ? void 0 : styles2.large;
  const mediumStyles = styles2 == null ? void 0 : styles2.medium;
  const smallStyles = styles2 == null ? void 0 : styles2.small;
  return `
        ${largeStyles ? `.${useBlock$1(props).id} {${convertStyleMaptoCSS(largeStyles)}}` : ""}
        ${mediumStyles ? `${getMaxWidthQueryForSize("medium")} {
              .${useBlock$1(props).id} {${convertStyleMaptoCSS(mediumStyles)}}
            }` : ""}
        ${smallStyles ? `${getMaxWidthQueryForSize("small")} {
              .${useBlock$1(props).id} {${convertStyleMaptoCSS(smallStyles)}}
            }` : ""}
      }`;
};
const BlockStyles = (props) => {
  return /* @__PURE__ */ jsx(Fragment$1, {
    children: /* @__PURE__ */ jsx(RenderInlinedStyles$1, {
      styles: css(props)
    })
  });
};
const BlockStyles$1 = BlockStyles;
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
const getEventHandlerName = (key) => `on${capitalizeFirstLetter(key)}$`;
function crateEventHandler(value, options) {
  return inlinedQrl((event) => {
    const [options2, value2] = useLexicalScope();
    return evaluate({
      code: value2,
      context: options2.context,
      state: options2.state,
      event
    });
  }, "crateEventHandler_wgxT8Hlq4s8", [
    options,
    value
  ]);
}
function getBlockActions(options) {
  var _a2;
  const obj = {};
  const optionActions = (_a2 = options.block.actions) != null ? _a2 : {};
  for (const key in optionActions) {
    if (!optionActions.hasOwnProperty(key))
      continue;
    const value = optionActions[key];
    obj[getEventHandlerName(key)] = crateEventHandler(value, options);
  }
  return obj;
}
function getBlockComponentOptions(block) {
  var _a2;
  return {
    ...(_a2 = block.component) == null ? void 0 : _a2.options,
    ...block.options,
    builderBlock: block
  };
}
function getBlockProperties(block) {
  var _a2;
  return {
    ...block.properties,
    "builder-id": block.id,
    class: [
      block.id,
      "builder-block",
      block.class,
      (_a2 = block.properties) == null ? void 0 : _a2.class
    ].filter(Boolean).join(" ")
  };
}
const convertStyleObject = (obj) => {
  return obj;
};
const sanitizeBlockStyles = (styles2) => styles2;
const getStyleForTarget = (styles2) => {
  switch (TARGET) {
    case "reactNative":
      return {
        ...styles2.large ? convertStyleObject(styles2.large) : {},
        ...styles2.medium ? convertStyleObject(styles2.medium) : {},
        ...styles2.small ? convertStyleObject(styles2.small) : {}
      };
    default:
      return {
        ...styles2.large ? convertStyleObject(styles2.large) : {},
        ...styles2.medium ? {
          [getMaxWidthQueryForSize("medium")]: convertStyleObject(styles2.medium)
        } : {},
        ...styles2.small ? {
          [getMaxWidthQueryForSize("small")]: convertStyleObject(styles2.small)
        } : {}
      };
  }
};
function getBlockStyles(block) {
  if (!block.responsiveStyles)
    return {};
  const styles2 = getStyleForTarget(block.responsiveStyles);
  const newStyles = sanitizeBlockStyles(styles2);
  return newStyles;
}
function getBlockTag(block) {
  return block.tagName || "div";
}
const EMPTY_HTML_ELEMENTS = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
const isEmptyHtmlElement = (tagName4) => {
  return typeof tagName4 === "string" && EMPTY_HTML_ELEMENTS.includes(tagName4.toLowerCase());
};
function markMutable(value) {
  return mutable(value);
}
function markPropsMutable(props) {
  Object.keys(props).forEach((key) => {
    props[key] = mutable(props[key]);
  });
  return props;
}
const RenderComponent = (props) => {
  return /* @__PURE__ */ jsx(Fragment$1, {
    children: props.componentRef ? /* @__PURE__ */ jsx(props.componentRef, {
      ...markPropsMutable(props.componentOptions),
      children: [
        (props.blockChildren || []).map(function(child) {
          return /* @__PURE__ */ jsx(RenderBlock$1, {
            block: child,
            context: props.context
          }, "render-block-" + child.id);
        }),
        (props.blockChildren || []).map(function(child) {
          return /* @__PURE__ */ jsx(BlockStyles$1, {
            block: child,
            context: props.context
          }, "block-style-" + child.id);
        })
      ]
    }) : null
  });
};
const RenderComponent$1 = RenderComponent;
const RenderRepeatedBlock = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  useContextProvider(BuilderContext, useStore({
    content: (() => {
      return props.repeatContext.content;
    })(),
    state: (() => {
      return props.repeatContext.state;
    })(),
    context: (() => {
      return props.repeatContext.context;
    })(),
    apiKey: (() => {
      return props.repeatContext.apiKey;
    })(),
    registeredComponents: (() => {
      return props.repeatContext.registeredComponents;
    })()
  }));
  return /* @__PURE__ */ jsx(RenderBlock$1, {
    block: props.block,
    context: props.repeatContext
  });
}, "RenderRepeatedBlock_component_nRyVBtbGKc8"));
const RenderRepeatedBlock$1 = RenderRepeatedBlock;
const component = function component2(props, state) {
  var _a2;
  const componentName = (_a2 = getProcessedBlock({
    block: props.block,
    state: props.context.state,
    context: props.context.context,
    shouldEvaluateBindings: false
  }).component) == null ? void 0 : _a2.name;
  if (!componentName)
    return null;
  const ref = props.context.registeredComponents[componentName];
  if (!ref) {
    console.warn(`
          Could not find a registered component named "${componentName}". 
          If you registered it, is the file that registered it imported by the file that needs to render it?`);
    return void 0;
  } else
    return ref;
};
const componentInfo$b = function componentInfo(props, state) {
  if (component(props)) {
    const { component: _, ...info } = component(props);
    return info;
  } else
    return void 0;
};
const componentRef = function componentRef2(props, state) {
  var _a2;
  return (_a2 = component(props)) == null ? void 0 : _a2.component;
};
const tagName2 = function tagName3(props, state) {
  return getBlockTag(useBlock2(props));
};
const useBlock2 = function useBlock3(props, state) {
  return repeatItemData(props) ? props.block : getProcessedBlock({
    block: props.block,
    state: props.context.state,
    context: props.context.context,
    shouldEvaluateBindings: true
  });
};
const attributes = function attributes2(props, state) {
  return {
    ...getBlockProperties(useBlock2(props)),
    ...getBlockActions({
      block: useBlock2(props),
      state: props.context.state,
      context: props.context.context
    }),
    style: getBlockStyles(useBlock2(props))
  };
};
const shouldWrap = function shouldWrap2(props, state) {
  var _a2;
  return !((_a2 = componentInfo$b(props)) == null ? void 0 : _a2.noWrap);
};
const componentOptions = function componentOptions2(props, state) {
  return {
    ...getBlockComponentOptions(useBlock2(props)),
    ...shouldWrap(props) ? {} : {
      attributes: attributes(props)
    }
  };
};
const renderComponentProps = function renderComponentProps2(props, state) {
  return {
    blockChildren: children(props),
    componentRef: componentRef(props),
    componentOptions: componentOptions(props),
    context: props.context
  };
};
const children = function children2(props, state) {
  var _a2;
  return (_a2 = useBlock2(props).children) != null ? _a2 : [];
};
const childrenWithoutParentComponent = function childrenWithoutParentComponent2(props, state) {
  const shouldRenderChildrenOutsideRef = !componentRef(props) && !repeatItemData(props);
  return shouldRenderChildrenOutsideRef ? children(props) : [];
};
const repeatItemData = function repeatItemData2(props, state) {
  const { repeat, ...blockWithoutRepeat } = props.block;
  if (!(repeat == null ? void 0 : repeat.collection))
    return void 0;
  const itemsArray = evaluate({
    code: repeat.collection,
    state: props.context.state,
    context: props.context.context
  });
  if (!Array.isArray(itemsArray))
    return void 0;
  const collectionName = repeat.collection.split(".").pop();
  const itemNameToUse = repeat.itemName || (collectionName ? collectionName + "Item" : "item");
  const repeatArray = itemsArray.map((item, index2) => ({
    context: {
      ...props.context,
      state: {
        ...props.context.state,
        $index: index2,
        $item: item,
        [itemNameToUse]: item,
        [`$${itemNameToUse}Index`]: index2
      }
    },
    block: blockWithoutRepeat
  }));
  return repeatArray;
};
const RenderBlock = (props) => {
  const state = {
    tagName: ""
  };
  state.tagName = tagName2(props);
  return /* @__PURE__ */ jsx(Fragment$1, {
    children: shouldWrap(props) ? /* @__PURE__ */ jsx(Fragment$1, {
      children: [
        isEmptyHtmlElement(tagName2(props)) ? /* @__PURE__ */ jsx(state.tagName, {
          ...attributes(props)
        }) : null,
        !isEmptyHtmlElement(tagName2(props)) && TARGET === "vue2" && repeatItemData(props) ? /* @__PURE__ */ jsx("div", {
          class: "vue2-root-element-workaround",
          children: (repeatItemData(props) || []).map(function(data, index2) {
            return /* @__PURE__ */ jsx(RenderRepeatedBlock$1, {
              repeatContext: data.context,
              block: data.block
            }, index2);
          })
        }) : null,
        !isEmptyHtmlElement(tagName2(props)) && TARGET !== "vue2" && repeatItemData(props) ? (repeatItemData(props) || []).map(function(data, index2) {
          return /* @__PURE__ */ jsx(RenderRepeatedBlock$1, {
            repeatContext: data.context,
            block: data.block
          }, index2);
        }) : null,
        !isEmptyHtmlElement(tagName2(props)) && !repeatItemData(props) ? /* @__PURE__ */ jsx(state.tagName, {
          ...attributes(props),
          children: [
            /* @__PURE__ */ jsx(RenderComponent$1, {
              ...renderComponentProps(props)
            }),
            (childrenWithoutParentComponent(props) || []).map(function(child) {
              return /* @__PURE__ */ jsx(RenderBlock, {
                block: child,
                context: props.context
              }, "render-block-" + child.id);
            }),
            (childrenWithoutParentComponent(props) || []).map(function(child) {
              return /* @__PURE__ */ jsx(BlockStyles$1, {
                block: child,
                context: props.context
              }, "block-style-" + child.id);
            })
          ]
        }) : null
      ]
    }) : /* @__PURE__ */ jsx(RenderComponent$1, {
      ...renderComponentProps(props),
      context: props.context
    })
  });
};
const RenderBlock$1 = RenderBlock;
const className = function className2(props, state, builderContext) {
  var _a2;
  return "builder-blocks" + (!((_a2 = props.blocks) == null ? void 0 : _a2.length) ? " no-blocks" : "");
};
const onClick$1 = function onClick(props, state, builderContext) {
  var _a2, _b;
  if (isEditing() && !((_a2 = props.blocks) == null ? void 0 : _a2.length))
    (_b = window.parent) == null ? void 0 : _b.postMessage({
      type: "builder.clickEmptyBlocks",
      data: {
        parentElementId: props.parent,
        dataPath: props.path
      }
    }, "*");
};
const onMouseEnter = function onMouseEnter2(props, state, builderContext) {
  var _a2, _b;
  if (isEditing() && !((_a2 = props.blocks) == null ? void 0 : _a2.length))
    (_b = window.parent) == null ? void 0 : _b.postMessage({
      type: "builder.hoverEmptyBlocks",
      data: {
        parentElementId: props.parent,
        dataPath: props.path
      }
    }, "*");
};
const RenderBlocks = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  useStylesScopedQrl(inlinedQrl(STYLES$3, "RenderBlocks_component_useStylesScoped_0XKYzaR059E"));
  const builderContext = useContext(BuilderContext);
  const state = {
    tagName: ""
  };
  return /* @__PURE__ */ jsx("div", {
    class: className(props) + " div-RenderBlocks",
    "builder-path": props.path,
    "builder-parent-id": props.parent,
    style: props.style,
    onClick$: inlinedQrl((event) => {
      const [builderContext2, props2, state2] = useLexicalScope();
      return onClick$1(props2);
    }, "RenderBlocks_component_div_onClick_RzhhZa265Yg", [
      builderContext,
      props,
      state
    ]),
    onMouseEnter$: inlinedQrl((event) => {
      const [builderContext2, props2, state2] = useLexicalScope();
      return onMouseEnter(props2);
    }, "RenderBlocks_component_div_onMouseEnter_nG7I7RYG3JQ", [
      builderContext,
      props,
      state
    ]),
    children: [
      props.blocks ? (props.blocks || []).map(function(block) {
        return /* @__PURE__ */ jsx(RenderBlock$1, {
          block,
          context: builderContext
        }, "render-block-" + block.id);
      }) : null,
      props.blocks ? (props.blocks || []).map(function(block) {
        return /* @__PURE__ */ jsx(BlockStyles$1, {
          block,
          context: builderContext
        }, "block-style-" + block.id);
      }) : null
    ]
  });
}, "RenderBlocks_component_MYUZ0j1uLsw"));
const RenderBlocks$1 = RenderBlocks;
const STYLES$3 = `.div-RenderBlocks { 
display: flex;
flex-direction: column;
align-items: stretch; }`;
const getGutterSize = function getGutterSize2(props, state) {
  return typeof props.space === "number" ? props.space || 0 : 20;
};
const getColumns = function getColumns2(props, state) {
  return props.columns || [];
};
const getWidth = function getWidth2(props, state, index2) {
  var _a2;
  const columns = getColumns(props);
  return ((_a2 = columns[index2]) == null ? void 0 : _a2.width) || 100 / columns.length;
};
const getColumnCssWidth = function getColumnCssWidth2(props, state, index2) {
  const columns = getColumns(props);
  const gutterSize = getGutterSize(props);
  const subtractWidth = gutterSize * (columns.length - 1) / columns.length;
  return `calc(${getWidth(props, state, index2)}% - ${subtractWidth}px)`;
};
const maybeApplyForTablet = function maybeApplyForTablet2(props, state, prop) {
  const _stackColumnsAt = props.stackColumnsAt || "tablet";
  return _stackColumnsAt === "tablet" ? prop : "inherit";
};
const columnsCssVars = function columnsCssVars2(props, state) {
  const flexDir = props.stackColumnsAt === "never" ? "inherit" : props.reverseColumnsWhenStacked ? "column-reverse" : "column";
  return {
    "--flex-dir": flexDir,
    "--flex-dir-tablet": maybeApplyForTablet(props, state, flexDir)
  };
};
const columnCssVars = function columnCssVars2(props, state) {
  const width = "100%";
  const marginLeft = "0";
  return {
    "--column-width": width,
    "--column-margin-left": marginLeft,
    "--column-width-tablet": maybeApplyForTablet(props, state, width),
    "--column-margin-left-tablet": maybeApplyForTablet(props, state, marginLeft)
  };
};
const Columns = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  useStylesScopedQrl(inlinedQrl(STYLES$2, "Columns_component_useStylesScoped_s7JLZz7MCCQ"));
  const state = {
    tagName: ""
  };
  return /* @__PURE__ */ jsx("div", {
    class: "builder-columns div-Columns",
    style: columnsCssVars(props, state),
    children: (props.columns || []).map(function(column, index2) {
      return /* @__PURE__ */ jsx("div", {
        class: "builder-column div-Columns-2",
        style: {
          width: getColumnCssWidth(props, state, index2),
          marginLeft: `${index2 === 0 ? 0 : getGutterSize(props)}px`,
          ...columnCssVars(props, state)
        },
        children: /* @__PURE__ */ jsx(RenderBlocks$1, {
          blocks: markMutable(column.blocks),
          path: `component.options.columns.${index2}.blocks`,
          parent: props.builderBlock.id,
          style: {
            flexGrow: "1"
          }
        })
      }, index2);
    })
  });
}, "Columns_component_7yLj4bxdI6c"));
const Columns$1 = Columns;
const STYLES$2 = `.div-Columns { 
display: flex;
align-items: stretch;
line-height: normal; }@media (max-width: 991px) { .div-Columns { 
flex-direction: var(--flex-dir-tablet); } }@media (max-width: 639px) { .div-Columns { 
flex-direction: var(--flex-dir); } }.div-Columns-2 { 
display: flex;
flex-direction: column;
align-items: stretch; }@media (max-width: 991px) { .div-Columns-2 { 
width: var(--column-width-tablet) !important;
margin-left: var(--column-margin-left-tablet) !important; } }@media (max-width: 639px) { .div-Columns-2 { 
width: var(--column-width) !important;
margin-left: var(--column-margin-left) !important; } }`;
function removeProtocol(path) {
  return path.replace(/http(s)?:/, "");
}
function updateQueryParam(uri = "", key, value) {
  const re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  const separator = uri.indexOf("?") !== -1 ? "&" : "?";
  if (uri.match(re))
    return uri.replace(re, "$1" + key + "=" + encodeURIComponent(value) + "$2");
  return uri + separator + key + "=" + encodeURIComponent(value);
}
function getShopifyImageUrl(src, size) {
  if (!src || !(src == null ? void 0 : src.match(/cdn\.shopify\.com/)) || !size)
    return src;
  if (size === "master")
    return removeProtocol(src);
  const match = src.match(/(_\d+x(\d+)?)?(\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?)/i);
  if (match) {
    const prefix = src.split(match[0]);
    const suffix = match[3];
    const useSize = size.match("x") ? size : `${size}x`;
    return removeProtocol(`${prefix[0]}_${useSize}${suffix}`);
  }
  return null;
}
function getSrcSet(url) {
  if (!url)
    return url;
  const sizes = [
    100,
    200,
    400,
    800,
    1200,
    1600,
    2e3
  ];
  if (url.match(/builder\.io/)) {
    let srcUrl = url;
    const widthInSrc = Number(url.split("?width=")[1]);
    if (!isNaN(widthInSrc))
      srcUrl = `${srcUrl} ${widthInSrc}w`;
    return sizes.filter((size) => size !== widthInSrc).map((size) => `${updateQueryParam(url, "width", size)} ${size}w`).concat([
      srcUrl
    ]).join(", ");
  }
  if (url.match(/cdn\.shopify\.com/))
    return sizes.map((size) => [
      getShopifyImageUrl(url, `${size}x${size}`),
      size
    ]).filter(([sizeUrl]) => !!sizeUrl).map(([sizeUrl, size]) => `${sizeUrl} ${size}w`).concat([
      url
    ]).join(", ");
  return url;
}
const srcSetToUse = function srcSetToUse2(props, state) {
  var _a2;
  const imageToUse = props.image || props.src;
  const url = imageToUse;
  if (!url || !(url.match(/builder\.io/) || url.match(/cdn\.shopify\.com/)))
    return props.srcset;
  if (props.srcset && ((_a2 = props.image) == null ? void 0 : _a2.includes("builder.io/api/v1/image"))) {
    if (!props.srcset.includes(props.image.split("?")[0])) {
      console.debug("Removed given srcset");
      return getSrcSet(url);
    }
  } else if (props.image && !props.srcset)
    return getSrcSet(url);
  return getSrcSet(url);
};
const webpSrcSet = function webpSrcSet2(props, state) {
  var _a2;
  if (((_a2 = srcSetToUse(props)) == null ? void 0 : _a2.match(/builder\.io/)) && !props.noWebp)
    return srcSetToUse(props).replace(/\?/g, "?format=webp&");
  else
    return "";
};
const Image = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  var _a2, _b, _c, _d;
  useStylesScopedQrl(inlinedQrl(STYLES$1, "Image_component_useStylesScoped_fBMYiVf9fuU"));
  return /* @__PURE__ */ jsx("div", {
    class: "div-Image",
    children: [
      /* @__PURE__ */ jsx("picture", {
        children: [
          webpSrcSet(props) ? /* @__PURE__ */ jsx("source", {
            type: "image/webp",
            srcSet: webpSrcSet(props)
          }) : null,
          /* @__PURE__ */ jsx("img", {
            loading: "lazy",
            alt: props.altText,
            role: props.altText ? "presentation" : void 0,
            style: {
              objectPosition: props.backgroundSize || "center",
              objectFit: props.backgroundSize || "cover"
            },
            class: "builder-image" + (props.className ? " " + props.className : "") + " img-Image",
            src: props.image,
            srcSet: srcSetToUse(props),
            sizes: props.sizes
          }),
          /* @__PURE__ */ jsx("source", {
            srcSet: srcSetToUse(props)
          })
        ]
      }),
      props.aspectRatio && !(props.fitContent && ((_b = (_a2 = props.builderBlock) == null ? void 0 : _a2.children) == null ? void 0 : _b.length)) ? /* @__PURE__ */ jsx("div", {
        class: "builder-image-sizer div-Image-2",
        style: {
          paddingTop: props.aspectRatio * 100 + "%"
        }
      }) : null,
      ((_d = (_c = props.builderBlock) == null ? void 0 : _c.children) == null ? void 0 : _d.length) && props.fitContent ? /* @__PURE__ */ jsx(Slot, {}) : null,
      !props.fitContent ? /* @__PURE__ */ jsx("div", {
        class: "div-Image-3",
        children: /* @__PURE__ */ jsx(Slot, {})
      }) : null
    ]
  });
}, "Image_component_LRxDkFa1EfU"));
const Image$1 = Image;
const STYLES$1 = `.div-Image { 
position: relative; }.img-Image { 
opacity: 1;
transition: opacity 0.2s ease-in-out;
position: absolute;
height: 100%;
width: 100%;
top: 0px;
left: 0px; }.div-Image-2 { 
width: 100%;
pointer-events: none;
font-size: 0; }.div-Image-3 { 
display: flex;
flex-direction: column;
align-items: stretch;
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%; }`;
const Text = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  return /* @__PURE__ */ jsx("span", {
    class: "builder-text",
    dangerouslySetInnerHTML: props.text
  });
}, "Text_component_15p0cKUxgIE"));
const Text$1 = Text;
const videoProps = function videoProps2(props, state) {
  return {
    ...props.autoPlay === true ? {
      autoPlay: true
    } : {},
    ...props.muted === true ? {
      muted: true
    } : {},
    ...props.controls === true ? {
      controls: true
    } : {},
    ...props.loop === true ? {
      loop: true
    } : {},
    ...props.playsInline === true ? {
      playsInline: true
    } : {}
  };
};
const Video = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  var _a2;
  return /* @__PURE__ */ jsx("video", {
    ...videoProps(props),
    style: {
      width: "100%",
      height: "100%",
      ...(_a2 = props.attributes) == null ? void 0 : _a2.style,
      objectFit: props.fit,
      objectPosition: props.position,
      borderRadius: 1
    },
    src: props.video || "no-src",
    poster: props.posterImage
  });
}, "Video_component_qdcTZflYyoQ"));
const Video$1 = Video;
const Button = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  useStylesScopedQrl(inlinedQrl(STYLES, "Button_component_useStylesScoped_a1JZ0Q0Q2Oc"));
  return /* @__PURE__ */ jsx(Fragment$1, {
    children: props.link ? /* @__PURE__ */ jsx("a", {
      role: "button",
      ...props.attributes,
      href: props.link,
      target: props.openLinkInNewTab ? "_blank" : void 0,
      children: props.text
    }) : /* @__PURE__ */ jsx("button", {
      class: "button-Button",
      ...props.attributes,
      children: props.text
    })
  });
}, "Button_component_gJoMUICXoUQ"));
const Button$1 = Button;
const STYLES = `.button-Button { 
all: unset; }`;
const componentInfo$a = {
  name: "Core:Button",
  builtIn: true,
  image: "https://cdn.builder.io/api/v1/image/assets%2FIsxPKMo2gPRRKeakUztj1D6uqed2%2F81a15681c3e74df09677dfc57a615b13",
  defaultStyles: {
    appearance: "none",
    paddingTop: "15px",
    paddingBottom: "15px",
    paddingLeft: "25px",
    paddingRight: "25px",
    backgroundColor: "#000000",
    color: "white",
    borderRadius: "4px",
    textAlign: "center",
    cursor: "pointer"
  },
  inputs: [
    {
      name: "text",
      type: "text",
      defaultValue: "Click me!",
      bubble: true
    },
    {
      name: "link",
      type: "url",
      bubble: true
    },
    {
      name: "openLinkInNewTab",
      type: "boolean",
      defaultValue: false,
      friendlyName: "Open link in new tab"
    }
  ],
  static: true,
  noWrap: true
};
function markSerializable(fn) {
  fn.__qwik_serializable__ = true;
  return fn;
}
const componentInfo$9 = {
  name: "Columns",
  builtIn: true,
  inputs: [
    {
      name: "columns",
      type: "array",
      broadcast: true,
      subFields: [
        {
          name: "blocks",
          type: "array",
          hideFromUI: true,
          defaultValue: [
            {
              "@type": "@builder.io/sdk:Element",
              responsiveStyles: {
                large: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  flexShrink: "0",
                  position: "relative",
                  marginTop: "30px",
                  textAlign: "center",
                  lineHeight: "normal",
                  height: "auto",
                  minHeight: "20px",
                  minWidth: "20px",
                  overflow: "hidden"
                }
              },
              component: {
                name: "Image",
                options: {
                  image: "https://builder.io/api/v1/image/assets%2Fpwgjf0RoYWbdnJSbpBAjXNRMe9F2%2Ffb27a7c790324294af8be1c35fe30f4d",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  aspectRatio: 0.7004048582995948
                }
              }
            },
            {
              "@type": "@builder.io/sdk:Element",
              responsiveStyles: {
                large: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  flexShrink: "0",
                  position: "relative",
                  marginTop: "30px",
                  textAlign: "center",
                  lineHeight: "normal",
                  height: "auto"
                }
              },
              component: {
                name: "Text",
                options: {
                  text: "<p>Enter some text...</p>"
                }
              }
            }
          ]
        },
        {
          name: "width",
          type: "number",
          hideFromUI: true,
          helperText: "Width %, e.g. set to 50 to fill half of the space"
        },
        {
          name: "link",
          type: "url",
          helperText: "Optionally set a url that clicking this column will link to"
        }
      ],
      defaultValue: [
        {
          blocks: [
            {
              "@type": "@builder.io/sdk:Element",
              responsiveStyles: {
                large: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  flexShrink: "0",
                  position: "relative",
                  marginTop: "30px",
                  textAlign: "center",
                  lineHeight: "normal",
                  height: "auto",
                  minHeight: "20px",
                  minWidth: "20px",
                  overflow: "hidden"
                }
              },
              component: {
                name: "Image",
                options: {
                  image: "https://builder.io/api/v1/image/assets%2Fpwgjf0RoYWbdnJSbpBAjXNRMe9F2%2Ffb27a7c790324294af8be1c35fe30f4d",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  aspectRatio: 0.7004048582995948
                }
              }
            },
            {
              "@type": "@builder.io/sdk:Element",
              responsiveStyles: {
                large: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  flexShrink: "0",
                  position: "relative",
                  marginTop: "30px",
                  textAlign: "center",
                  lineHeight: "normal",
                  height: "auto"
                }
              },
              component: {
                name: "Text",
                options: {
                  text: "<p>Enter some text...</p>"
                }
              }
            }
          ]
        },
        {
          blocks: [
            {
              "@type": "@builder.io/sdk:Element",
              responsiveStyles: {
                large: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  flexShrink: "0",
                  position: "relative",
                  marginTop: "30px",
                  textAlign: "center",
                  lineHeight: "normal",
                  height: "auto",
                  minHeight: "20px",
                  minWidth: "20px",
                  overflow: "hidden"
                }
              },
              component: {
                name: "Image",
                options: {
                  image: "https://builder.io/api/v1/image/assets%2Fpwgjf0RoYWbdnJSbpBAjXNRMe9F2%2Ffb27a7c790324294af8be1c35fe30f4d",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  aspectRatio: 0.7004048582995948
                }
              }
            },
            {
              "@type": "@builder.io/sdk:Element",
              responsiveStyles: {
                large: {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  flexShrink: "0",
                  position: "relative",
                  marginTop: "30px",
                  textAlign: "center",
                  lineHeight: "normal",
                  height: "auto"
                }
              },
              component: {
                name: "Text",
                options: {
                  text: "<p>Enter some text...</p>"
                }
              }
            }
          ]
        }
      ],
      onChange: markSerializable((options) => {
        function clearWidths() {
          columns.forEach((col) => {
            col.delete("width");
          });
        }
        const columns = options.get("columns");
        if (Array.isArray(columns)) {
          const containsColumnWithWidth = !!columns.find((col) => col.get("width"));
          if (containsColumnWithWidth) {
            const containsColumnWithoutWidth = !!columns.find((col) => !col.get("width"));
            if (containsColumnWithoutWidth)
              clearWidths();
            else {
              const sumWidths = columns.reduce((memo, col) => {
                return memo + col.get("width");
              }, 0);
              const widthsDontAddUp = sumWidths !== 100;
              if (widthsDontAddUp)
                clearWidths();
            }
          }
        }
      })
    },
    {
      name: "space",
      type: "number",
      defaultValue: 20,
      helperText: "Size of gap between columns",
      advanced: true
    },
    {
      name: "stackColumnsAt",
      type: "string",
      defaultValue: "tablet",
      helperText: "Convert horizontal columns to vertical at what device size",
      enum: [
        "tablet",
        "mobile",
        "never"
      ],
      advanced: true
    },
    {
      name: "reverseColumnsWhenStacked",
      type: "boolean",
      defaultValue: false,
      helperText: "When stacking columns for mobile devices, reverse the ordering",
      advanced: true
    }
  ]
};
const componentInfo$8 = {
  name: "Fragment",
  static: true,
  hidden: true,
  builtIn: true,
  canHaveChildren: true,
  noWrap: true
};
const FragmentComponent = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  return /* @__PURE__ */ jsx("span", {
    children: /* @__PURE__ */ jsx(Slot, {})
  });
}, "FragmentComponent_component_T0AypnadAK0"));
const Fragment = FragmentComponent;
const componentInfo$7 = {
  name: "Image",
  static: true,
  builtIn: true,
  image: "https://firebasestorage.googleapis.com/v0/b/builder-3b0a2.appspot.com/o/images%2Fbaseline-insert_photo-24px.svg?alt=media&token=4e5d0ef4-f5e8-4e57-b3a9-38d63a9b9dc4",
  defaultStyles: {
    position: "relative",
    minHeight: "20px",
    minWidth: "20px",
    overflow: "hidden"
  },
  canHaveChildren: true,
  inputs: [
    {
      name: "image",
      type: "file",
      bubble: true,
      allowedFileTypes: [
        "jpeg",
        "jpg",
        "png",
        "svg"
      ],
      required: true,
      defaultValue: "https://cdn.builder.io/api/v1/image/assets%2Fpwgjf0RoYWbdnJSbpBAjXNRMe9F2%2Ffb27a7c790324294af8be1c35fe30f4d",
      onChange: markSerializable((options) => {
        const DEFAULT_ASPECT_RATIO = 0.7041;
        options.delete("srcset");
        options.delete("noWebp");
        function loadImage(url, timeout = 6e4) {
          return new Promise((resolve, reject) => {
            const img = document.createElement("img");
            let loaded = false;
            img.onload = () => {
              loaded = true;
              resolve(img);
            };
            img.addEventListener("error", (event) => {
              console.warn("Image load failed", event.error);
              reject(event.error);
            });
            img.src = url;
            setTimeout(() => {
              if (!loaded)
                reject(new Error("Image load timed out"));
            }, timeout);
          });
        }
        function round(num) {
          return Math.round(num * 1e3) / 1e3;
        }
        const value = options.get("image");
        const aspectRatio = options.get("aspectRatio");
        fetch(value).then((res) => res.blob()).then((blob) => {
          if (blob.type.includes("svg"))
            options.set("noWebp", true);
        });
        if (value && (!aspectRatio || aspectRatio === DEFAULT_ASPECT_RATIO))
          return loadImage(value).then((img) => {
            const possiblyUpdatedAspectRatio = options.get("aspectRatio");
            if (options.get("image") === value && (!possiblyUpdatedAspectRatio || possiblyUpdatedAspectRatio === DEFAULT_ASPECT_RATIO)) {
              if (img.width && img.height) {
                options.set("aspectRatio", round(img.height / img.width));
                options.set("height", img.height);
                options.set("width", img.width);
              }
            }
          });
      })
    },
    {
      name: "backgroundSize",
      type: "text",
      defaultValue: "cover",
      enum: [
        {
          label: "contain",
          value: "contain",
          helperText: "The image should never get cropped"
        },
        {
          label: "cover",
          value: "cover",
          helperText: "The image should fill it's box, cropping when needed"
        }
      ]
    },
    {
      name: "backgroundPosition",
      type: "text",
      defaultValue: "center",
      enum: [
        "center",
        "top",
        "left",
        "right",
        "bottom",
        "top left",
        "top right",
        "bottom left",
        "bottom right"
      ]
    },
    {
      name: "altText",
      type: "string",
      helperText: "Text to display when the user has images off"
    },
    {
      name: "height",
      type: "number",
      hideFromUI: true
    },
    {
      name: "width",
      type: "number",
      hideFromUI: true
    },
    {
      name: "sizes",
      type: "string",
      hideFromUI: true
    },
    {
      name: "srcset",
      type: "string",
      hideFromUI: true
    },
    {
      name: "lazy",
      type: "boolean",
      defaultValue: true,
      hideFromUI: true
    },
    {
      name: "fitContent",
      type: "boolean",
      helperText: "When child blocks are provided, fit to them instead of using the image's aspect ratio",
      defaultValue: true
    },
    {
      name: "aspectRatio",
      type: "number",
      helperText: "This is the ratio of height/width, e.g. set to 1.5 for a 300px wide and 200px tall photo. Set to 0 to not force the image to maintain it's aspect ratio",
      advanced: true,
      defaultValue: 0.7041
    }
  ]
};
const componentInfo$6 = {
  name: "Core:Section",
  static: true,
  builtIn: true,
  image: "https://cdn.builder.io/api/v1/image/assets%2FIsxPKMo2gPRRKeakUztj1D6uqed2%2F682efef23ace49afac61748dd305c70a",
  inputs: [
    {
      name: "maxWidth",
      type: "number",
      defaultValue: 1200
    },
    {
      name: "lazyLoad",
      type: "boolean",
      defaultValue: false,
      advanced: true,
      description: "Only render this section when in view"
    }
  ],
  defaultStyles: {
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "50px",
    paddingBottom: "50px",
    marginTop: "0px",
    width: "100vw",
    marginLeft: "calc(50% - 50vw)"
  },
  canHaveChildren: true,
  defaultChildren: [
    {
      "@type": "@builder.io/sdk:Element",
      responsiveStyles: {
        large: {
          textAlign: "center"
        }
      },
      component: {
        name: "Text",
        options: {
          text: "<p><b>I am a section! My content keeps from getting too wide, so that it's easy to read even on big screens.</b></p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur</p>"
        }
      }
    }
  ]
};
const SectionComponent = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  return /* @__PURE__ */ jsx("section", {
    ...props.attributes,
    style: (() => {
      props.maxWidth && typeof props.maxWidth === "number" ? props.maxWidth : void 0;
    })(),
    children: /* @__PURE__ */ jsx(Slot, {})
  });
}, "SectionComponent_component_ZWF9iD5WeLg"));
const Section = SectionComponent;
const componentInfo$5 = {
  name: "Symbol",
  noWrap: true,
  static: true,
  builtIn: true,
  inputs: [
    {
      name: "symbol",
      type: "uiSymbol"
    },
    {
      name: "dataOnly",
      helperText: "Make this a data symbol that doesn't display any UI",
      type: "boolean",
      defaultValue: false,
      advanced: true,
      hideFromUI: true
    },
    {
      name: "inheritState",
      helperText: "Inherit the parent component state and data",
      type: "boolean",
      defaultValue: false,
      advanced: true
    },
    {
      name: "renderToLiquid",
      helperText: "Render this symbols contents to liquid. Turn off to fetch with javascript and use custom targeting",
      type: "boolean",
      defaultValue: false,
      advanced: true,
      hideFromUI: true
    },
    {
      name: "useChildren",
      hideFromUI: true,
      type: "boolean"
    }
  ]
};
const componentInfo$4 = {
  name: "Text",
  static: true,
  builtIn: true,
  image: "https://firebasestorage.googleapis.com/v0/b/builder-3b0a2.appspot.com/o/images%2Fbaseline-text_fields-24px%20(1).svg?alt=media&token=12177b73-0ee3-42ca-98c6-0dd003de1929",
  inputs: [
    {
      name: "text",
      type: "html",
      required: true,
      autoFocus: true,
      bubble: true,
      defaultValue: "Enter some text..."
    }
  ],
  defaultStyles: {
    lineHeight: "normal",
    height: "auto",
    textAlign: "center"
  }
};
const componentInfo$3 = {
  name: "Video",
  canHaveChildren: true,
  builtIn: true,
  defaultStyles: {
    minHeight: "20px",
    minWidth: "20px"
  },
  image: "https://firebasestorage.googleapis.com/v0/b/builder-3b0a2.appspot.com/o/images%2Fbaseline-videocam-24px%20(1).svg?alt=media&token=49a84e4a-b20e-4977-a650-047f986874bb",
  inputs: [
    {
      name: "video",
      type: "file",
      allowedFileTypes: [
        "mp4"
      ],
      bubble: true,
      defaultValue: "https://firebasestorage.googleapis.com/v0/b/builder-3b0a2.appspot.com/o/assets%2FKQlEmWDxA0coC3PK6UvkrjwkIGI2%2F28cb070609f546cdbe5efa20e931aa4b?alt=media&token=912e9551-7a7c-4dfb-86b6-3da1537d1a7f",
      required: true
    },
    {
      name: "posterImage",
      type: "file",
      allowedFileTypes: [
        "jpeg",
        "png"
      ],
      helperText: "Image to show before the video plays"
    },
    {
      name: "autoPlay",
      type: "boolean",
      defaultValue: true
    },
    {
      name: "controls",
      type: "boolean",
      defaultValue: false
    },
    {
      name: "muted",
      type: "boolean",
      defaultValue: true
    },
    {
      name: "loop",
      type: "boolean",
      defaultValue: true
    },
    {
      name: "playsInline",
      type: "boolean",
      defaultValue: true
    },
    {
      name: "fit",
      type: "text",
      defaultValue: "cover",
      enum: [
        "contain",
        "cover",
        "fill",
        "auto"
      ]
    },
    {
      name: "fitContent",
      type: "boolean",
      helperText: "When child blocks are provided, fit to them instead of using the aspect ratio",
      defaultValue: true,
      advanced: true
    },
    {
      name: "position",
      type: "text",
      defaultValue: "center",
      enum: [
        "center",
        "top",
        "left",
        "right",
        "bottom",
        "top left",
        "top right",
        "bottom left",
        "bottom right"
      ]
    },
    {
      name: "height",
      type: "number",
      advanced: true
    },
    {
      name: "width",
      type: "number",
      advanced: true
    },
    {
      name: "aspectRatio",
      type: "number",
      advanced: true,
      defaultValue: 0.7004048582995948
    },
    {
      name: "lazyLoad",
      type: "boolean",
      helperText: 'Load this video "lazily" - as in only when a user scrolls near the video. Recommended for optmized performance and bandwidth consumption',
      defaultValue: true,
      advanced: true
    }
  ]
};
const componentInfo$2 = {
  name: "Embed",
  static: true,
  builtIn: true,
  inputs: [
    {
      name: "url",
      type: "url",
      required: true,
      defaultValue: "",
      helperText: "e.g. enter a youtube url, google map, etc",
      onChange: markSerializable((options) => {
        const url = options.get("url");
        if (url) {
          options.set("content", "Loading...");
          const apiKey = "ae0e60e78201a3f2b0de4b";
          return fetch(`https://iframe.ly/api/iframely?url=${url}&api_key=${apiKey}`).then((res) => res.json()).then((data) => {
            if (options.get("url") === url) {
              if (data.html)
                options.set("content", data.html);
              else
                options.set("content", "Invalid url, please try another");
            }
          }).catch((_err) => {
            options.set("content", "There was an error embedding this URL, please try again or another URL");
          });
        } else
          options.delete("content");
      })
    },
    {
      name: "content",
      type: "html",
      defaultValue: '<div style="padding: 20px; text-align: center">(Choose an embed URL)<div>',
      hideFromUI: true
    }
  ]
};
const SCRIPT_MIME_TYPES = [
  "text/javascript",
  "application/javascript",
  "application/ecmascript"
];
const isJsScript = (script) => SCRIPT_MIME_TYPES.includes(script.type);
const findAndRunScripts$1 = function findAndRunScripts(props, state, elem) {
  if (!elem || !elem.getElementsByTagName)
    return;
  const scripts = elem.getElementsByTagName("script");
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    if (script.src && !state.scriptsInserted.includes(script.src)) {
      state.scriptsInserted.push(script.src);
      const newScript = document.createElement("script");
      newScript.async = true;
      newScript.src = script.src;
      document.head.appendChild(newScript);
    } else if (isJsScript(script) && !state.scriptsRun.includes(script.innerText))
      try {
        state.scriptsRun.push(script.innerText);
        new Function(script.innerText)();
      } catch (error) {
        console.warn("`Embed`: Error running script:", error);
      }
  }
};
const Embed = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  const elem = useRef();
  const state = useStore({
    ranInitFn: false,
    scriptsInserted: [],
    scriptsRun: []
  });
  useWatchQrl(inlinedQrl(({ track: track2 }) => {
    const [elem2, props2, state2] = useLexicalScope();
    state2 && track2(state2, "ranInitFn");
    if (elem2 && !state2.ranInitFn) {
      state2.ranInitFn = true;
      findAndRunScripts$1(props2, state2, elem2);
    }
  }, "Embed_component_useWatch_AxgWjrHdlAI", [
    elem,
    props,
    state
  ]));
  return /* @__PURE__ */ jsx("div", {
    class: "builder-embed",
    ref: elem,
    dangerouslySetInnerHTML: props.content
  });
}, "Embed_component_Uji08ORjXbE"));
const embed = Embed;
const ImgComponent = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  return /* @__PURE__ */ jsx("img", {
    style: {
      objectFit: props.backgroundSize || "cover",
      objectPosition: props.backgroundPosition || "center"
    },
    alt: props.altText,
    src: props.imgSrc || props.image,
    ...props.attributes
  }, isEditing() && props.imgSrc || "default-key");
}, "ImgComponent_component_FXvIDBSffO8"));
const Img = ImgComponent;
const componentInfo$1 = {
  name: "Raw:Img",
  hideFromInsertMenu: true,
  builtIn: true,
  image: "https://firebasestorage.googleapis.com/v0/b/builder-3b0a2.appspot.com/o/images%2Fbaseline-insert_photo-24px.svg?alt=media&token=4e5d0ef4-f5e8-4e57-b3a9-38d63a9b9dc4",
  inputs: [
    {
      name: "image",
      bubble: true,
      type: "file",
      allowedFileTypes: [
        "jpeg",
        "jpg",
        "png",
        "svg"
      ],
      required: true
    }
  ],
  noWrap: true,
  static: true
};
const findAndRunScripts2 = function findAndRunScripts3(props, state, elem) {
  if (elem && elem.getElementsByTagName && typeof window !== "undefined") {
    const scripts = elem.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      if (script.src) {
        if (state.scriptsInserted.includes(script.src))
          continue;
        state.scriptsInserted.push(script.src);
        const newScript = document.createElement("script");
        newScript.async = true;
        newScript.src = script.src;
        document.head.appendChild(newScript);
      } else if (!script.type || [
        "text/javascript",
        "application/javascript",
        "application/ecmascript"
      ].includes(script.type)) {
        if (state.scriptsRun.includes(script.innerText))
          continue;
        try {
          state.scriptsRun.push(script.innerText);
          new Function(script.innerText)();
        } catch (error) {
          console.warn("`CustomCode`: Error running script:", error);
        }
      }
    }
  }
};
const CustomCode = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  const elem = useRef();
  const state = useStore({
    scriptsInserted: [],
    scriptsRun: []
  });
  useClientEffectQrl(inlinedQrl(() => {
    const [elem2, props2, state2] = useLexicalScope();
    findAndRunScripts2(props2, state2, elem2);
  }, "CustomCode_component_useClientEffect_4w4c951ufB4", [
    elem,
    props,
    state
  ]));
  return /* @__PURE__ */ jsx("div", {
    ref: elem,
    class: "builder-custom-code" + (props.replaceNodes ? " replace-nodes" : ""),
    dangerouslySetInnerHTML: props.code
  });
}, "CustomCode_component_uYOSy7w7Zqw"));
const customCode = CustomCode;
const componentInfo2 = {
  name: "Custom Code",
  static: true,
  builtIn: true,
  requiredPermissions: [
    "editCode"
  ],
  inputs: [
    {
      name: "code",
      type: "html",
      required: true,
      defaultValue: "<p>Hello there, I am custom HTML code!</p>",
      code: true
    },
    {
      name: "replaceNodes",
      type: "boolean",
      helperText: "Preserve server rendered dom nodes",
      advanced: true
    },
    {
      name: "scriptsClientOnly",
      type: "boolean",
      defaultValue: false,
      helperText: "Only print and run scripts on the client. Important when scripts influence DOM that could be replaced when client loads",
      advanced: true
    }
  ]
};
const getDefaultRegisteredComponents = () => [
  {
    component: Columns$1,
    ...componentInfo$9
  },
  {
    component: Image$1,
    ...componentInfo$7
  },
  {
    component: Img,
    ...componentInfo$1
  },
  {
    component: Text$1,
    ...componentInfo$4
  },
  {
    component: Video$1,
    ...componentInfo$3
  },
  {
    component: Symbol$2,
    ...componentInfo$5
  },
  {
    component: Button$1,
    ...componentInfo$a
  },
  {
    component: Section,
    ...componentInfo$6
  },
  {
    component: Fragment,
    ...componentInfo$8
  },
  {
    component: embed,
    ...componentInfo$2
  },
  {
    component: customCode,
    ...componentInfo2
  }
];
function flatten(object, path = null, separator = ".") {
  return Object.keys(object).reduce((acc, key) => {
    const value = object[key];
    const newPath = [
      path,
      key
    ].filter(Boolean).join(separator);
    const isObject2 = [
      typeof value === "object",
      value !== null,
      !(Array.isArray(value) && value.length === 0)
    ].every(Boolean);
    return isObject2 ? {
      ...acc,
      ...flatten(value, newPath, separator)
    } : {
      ...acc,
      [newPath]: value
    };
  }, {});
}
const BUILDER_SEARCHPARAMS_PREFIX = "builder.";
const convertSearchParamsToQueryObject = (searchParams) => {
  const options = {};
  searchParams.forEach((value, key) => {
    options[key] = value;
  });
  return options;
};
const getBuilderSearchParams = (_options) => {
  if (!_options)
    return {};
  const options = normalizeSearchParams(_options);
  const newOptions = {};
  Object.keys(options).forEach((key) => {
    if (key.startsWith(BUILDER_SEARCHPARAMS_PREFIX)) {
      const trimmedKey = key.replace(BUILDER_SEARCHPARAMS_PREFIX, "");
      newOptions[trimmedKey] = options[key];
    }
  });
  return newOptions;
};
const getBuilderSearchParamsFromWindow = () => {
  if (!isBrowser())
    return {};
  const searchParams = new URLSearchParams(window.location.search);
  return getBuilderSearchParams(searchParams);
};
const normalizeSearchParams = (searchParams) => searchParams instanceof URLSearchParams ? convertSearchParamsToQueryObject(searchParams) : searchParams;
function getGlobalThis() {
  if (typeof globalThis !== "undefined")
    return globalThis;
  if (typeof window !== "undefined")
    return window;
  if (typeof global !== "undefined")
    return global;
  if (typeof self !== "undefined")
    return self;
  return null;
}
async function getFetch() {
  const globalFetch = getGlobalThis().fetch;
  if (typeof globalFetch === "undefined" && typeof global !== "undefined")
    throw new Error("`fetch()` not found, ensure you have it as part of your polyfills.");
  return globalFetch.default || globalFetch;
}
const getTopLevelDomain = (host) => {
  const parts = host.split(".");
  if (parts.length > 2)
    return parts.slice(1).join(".");
  return host;
};
const getCookie = async ({ name, canTrack }) => {
  var _a2;
  try {
    if (!canTrack)
      return void 0;
    return (_a2 = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))) == null ? void 0 : _a2.split("=")[1];
  } catch (err) {
    console.debug("[COOKIE] GET error: ", err);
  }
};
const stringifyCookie = (cookie) => cookie.map(([key, value]) => value ? `${key}=${value}` : key).join("; ");
const SECURE_CONFIG = [
  [
    "secure",
    ""
  ],
  [
    "SameSite",
    "None"
  ]
];
const createCookieString = ({ name, value, expires }) => {
  const secure = isBrowser() ? location.protocol === "https:" : true;
  const secureObj = secure ? SECURE_CONFIG : [
    []
  ];
  const expiresObj = expires ? [
    [
      "expires",
      expires.toUTCString()
    ]
  ] : [
    []
  ];
  const cookieValue = [
    [
      name,
      value
    ],
    ...expiresObj,
    [
      "path",
      "/"
    ],
    [
      "domain",
      getTopLevelDomain(window.location.hostname)
    ],
    ...secureObj
  ];
  const cookie = stringifyCookie(cookieValue);
  return cookie;
};
const setCookie = async ({ name, value, expires, canTrack }) => {
  try {
    if (!canTrack)
      return void 0;
    const cookie = createCookieString({
      name,
      value,
      expires
    });
    document.cookie = cookie;
  } catch (err) {
    console.warn("[COOKIE] SET error: ", err);
  }
};
const BUILDER_STORE_PREFIX = "builderio.variations";
const getContentTestKey = (id) => `${BUILDER_STORE_PREFIX}.${id}`;
const getContentVariationCookie = ({ contentId, canTrack }) => getCookie({
  name: getContentTestKey(contentId),
  canTrack
});
const setContentVariationCookie = ({ contentId, canTrack, value }) => setCookie({
  name: getContentTestKey(contentId),
  value,
  canTrack
});
const checkIsDefined = (maybeT) => maybeT !== null && maybeT !== void 0;
const checkIsBuilderContentWithVariations = (item) => checkIsDefined(item.id) && checkIsDefined(item.variations) && Object.keys(item.variations).length > 0;
const getRandomVariationId = ({ id, variations }) => {
  var _a2;
  let n = 0;
  const random = Math.random();
  for (const id1 in variations) {
    const testRatio = (_a2 = variations[id1]) == null ? void 0 : _a2.testRatio;
    n += testRatio;
    if (random < n)
      return id1;
  }
  return id;
};
const getTestFields = ({ item, testGroupId }) => {
  const variationValue = item.variations[testGroupId];
  if (testGroupId === item.id || !variationValue)
    return {
      testVariationId: item.id,
      testVariationName: "Default"
    };
  else
    return {
      data: variationValue.data,
      testVariationId: variationValue.id,
      testVariationName: variationValue.name || (variationValue.id === item.id ? "Default" : "")
    };
};
const getContentVariation = async ({ item, canTrack }) => {
  const testGroupId = await getContentVariationCookie({
    canTrack,
    contentId: item.id
  });
  const testFields = testGroupId ? getTestFields({
    item,
    testGroupId
  }) : void 0;
  if (testFields)
    return testFields;
  else {
    const randomVariationId = getRandomVariationId({
      variations: item.variations,
      id: item.id
    });
    setContentVariationCookie({
      contentId: item.id,
      value: randomVariationId,
      canTrack
    }).catch((err) => {
      console.error("could not store A/B test variation: ", err);
    });
    return getTestFields({
      item,
      testGroupId: randomVariationId
    });
  }
};
const handleABTesting = async ({ item, canTrack }) => {
  if (!checkIsBuilderContentWithVariations(item))
    return;
  const variationValue = await getContentVariation({
    item,
    canTrack
  });
  Object.assign(item, variationValue);
};
async function getContent(options) {
  return (await getAllContent({
    ...options,
    limit: 1
  })).results[0] || null;
}
const generateContentUrl = (options) => {
  const { limit = 30, userAttributes, query, noTraverse = false, model, apiKey } = options;
  const url = new URL(`https://cdn.builder.io/api/v2/content/${model}?apiKey=${apiKey}&limit=${limit}&noTraverse=${noTraverse}`);
  const queryOptions = {
    ...getBuilderSearchParamsFromWindow(),
    ...normalizeSearchParams(options.options || {})
  };
  const flattened = flatten(queryOptions);
  for (const key in flattened)
    url.searchParams.set(key, String(flattened[key]));
  if (userAttributes)
    url.searchParams.set("userAttributes", JSON.stringify(userAttributes));
  if (query) {
    const flattened1 = flatten({
      query
    });
    for (const key1 in flattened1)
      url.searchParams.set(key1, JSON.stringify(flattened1[key1]));
  }
  return url;
};
async function getAllContent(options) {
  const url = generateContentUrl(options);
  const fetch2 = await getFetch();
  const content = await fetch2(url.href).then((res) => res.json());
  const canTrack = options.canTrack !== false;
  if (canTrack)
    for (const item of content.results)
      await handleABTesting({
        item,
        canTrack
      });
  return content;
}
function isPreviewing() {
  if (!isBrowser())
    return false;
  if (isEditing())
    return false;
  return Boolean(location.search.indexOf("builder.preview=") !== -1);
}
const components = [];
const createRegisterComponentMessage = ({ component: _, ...info }) => ({
  type: "builder.registerComponent",
  data: prepareComponentInfoToSend(info)
});
const fastClone = (obj) => JSON.parse(JSON.stringify(obj));
const serializeValue = (value) => typeof value === "function" ? serializeFn(value) : fastClone(value);
const serializeFn = (fnValue) => {
  const fnStr = fnValue.toString().trim();
  const appendFunction = !fnStr.startsWith("function") && !fnStr.startsWith("(");
  return `return (${appendFunction ? "function " : ""}${fnStr}).apply(this, arguments)`;
};
const prepareComponentInfoToSend = ({ inputs, ...info }) => ({
  ...fastClone(info),
  inputs: inputs == null ? void 0 : inputs.map((input) => Object.entries(input).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: serializeValue(value)
  }), {}))
});
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function uuid() {
  return uuidv4().replace(/-/g, "");
}
const SESSION_LOCAL_STORAGE_KEY = "builderSessionId";
const getSessionId = async ({ canTrack }) => {
  if (!canTrack)
    return void 0;
  const sessionId = await getCookie({
    name: SESSION_LOCAL_STORAGE_KEY,
    canTrack
  });
  if (checkIsDefined(sessionId))
    return sessionId;
  else {
    const newSessionId = createSessionId();
    setSessionId({
      id: newSessionId,
      canTrack
    });
  }
};
const createSessionId = () => uuid();
const setSessionId = ({ id, canTrack }) => setCookie({
  name: SESSION_LOCAL_STORAGE_KEY,
  value: id,
  canTrack
});
const getLocalStorage = () => isBrowser() && typeof localStorage !== "undefined" ? localStorage : void 0;
const getLocalStorageItem = ({ key, canTrack }) => {
  var _a2;
  try {
    if (canTrack)
      return (_a2 = getLocalStorage()) == null ? void 0 : _a2.getItem(key);
    return void 0;
  } catch (err) {
    console.debug("[LocalStorage] GET error: ", err);
  }
};
const setLocalStorageItem = ({ key, canTrack, value }) => {
  var _a2;
  try {
    if (canTrack)
      (_a2 = getLocalStorage()) == null ? void 0 : _a2.setItem(key, value);
  } catch (err) {
    console.debug("[LocalStorage] SET error: ", err);
  }
};
const VISITOR_LOCAL_STORAGE_KEY = "builderVisitorId";
const getVisitorId = ({ canTrack }) => {
  if (!canTrack)
    return void 0;
  const visitorId = getLocalStorageItem({
    key: VISITOR_LOCAL_STORAGE_KEY,
    canTrack
  });
  if (checkIsDefined(visitorId))
    return visitorId;
  else {
    const newVisitorId = createVisitorId();
    setVisitorId({
      id: newVisitorId,
      canTrack
    });
  }
};
const createVisitorId = () => uuid();
const setVisitorId = ({ id, canTrack }) => setLocalStorageItem({
  key: VISITOR_LOCAL_STORAGE_KEY,
  value: id,
  canTrack
});
const getTrackingEventData = async ({ canTrack }) => {
  if (!canTrack)
    return {
      visitorId: void 0,
      sessionId: void 0
    };
  const sessionId = await getSessionId({
    canTrack
  });
  const visitorId = getVisitorId({
    canTrack
  });
  return {
    sessionId,
    visitorId
  };
};
const createEvent = async ({ type: eventType, canTrack, orgId, contentId, ...properties }) => ({
  type: eventType,
  data: {
    ...properties,
    ...await getTrackingEventData({
      canTrack
    }),
    ownerId: orgId,
    contentId
  }
});
async function track(eventProps) {
  if (!eventProps.canTrack)
    return;
  if (isEditing())
    return;
  if (!(isBrowser() || TARGET === "reactNative"))
    return;
  return fetch(`https://builder.io/api/v1/track`, {
    method: "POST",
    body: JSON.stringify({
      events: [
        await createEvent(eventProps)
      ]
    }),
    headers: {
      "content-type": "application/json"
    },
    mode: "cors"
  }).catch((err) => {
    console.error("Failed to track: ", err);
  });
}
const getCssFromFont = function getCssFromFont2(props, state, font) {
  var _a2, _b;
  const family = font.family + (font.kind && !font.kind.includes("#") ? ", " + font.kind : "");
  const name = family.split(",")[0];
  const url = (_b = font.fileUrl) != null ? _b : (_a2 = font == null ? void 0 : font.files) == null ? void 0 : _a2.regular;
  let str = "";
  if (url && family && name)
    str += `
  @font-face {
    font-family: "${family}";
    src: local("${name}"), url('${url}') format('woff2');
    font-display: fallback;
    font-weight: 400;
  }
          `.trim();
  if (font.files)
    for (const weight in font.files) {
      const isNumber = String(Number(weight)) === weight;
      if (!isNumber)
        continue;
      const weightUrl = font.files[weight];
      if (weightUrl && weightUrl !== url)
        str += `
  @font-face {
    font-family: "${family}";
    src: url('${weightUrl}') format('woff2');
    font-display: fallback;
    font-weight: ${weight};
  }
            `.trim();
    }
  return str;
};
const getFontCss = function getFontCss2(props, state, { customFonts }) {
  var _a2;
  return ((_a2 = customFonts == null ? void 0 : customFonts.map((font) => getCssFromFont(props, state, font))) == null ? void 0 : _a2.join(" ")) || "";
};
const injectedStyles = function injectedStyles2(props, state) {
  return `
${props.cssCode || ""}
${getFontCss(props, state, {
    customFonts: props.customFonts
  })}`;
};
const RenderContentStyles = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  const state = {
    tagName: ""
  };
  return /* @__PURE__ */ jsx(RenderInlinedStyles$1, {
    styles: injectedStyles(props, state)
  });
}, "RenderContentStyles_component_Og0xL34Zbvc"));
const RenderContentStyles$1 = RenderContentStyles;
const useContent = function useContent2(props, state, elementRef) {
  var _a2, _b;
  if (!props.content && !state.overrideContent)
    return void 0;
  const mergedContent = {
    ...props.content,
    ...state.overrideContent,
    data: {
      ...(_a2 = props.content) == null ? void 0 : _a2.data,
      ...props.data,
      ...(_b = state.overrideContent) == null ? void 0 : _b.data
    }
  };
  return mergedContent;
};
const canTrackToUse = function canTrackToUse2(props, state, elementRef) {
  return props.canTrack || true;
};
const contentState = function contentState2(props, state, elementRef) {
  var _a2, _b;
  return {
    ...(_b = (_a2 = props.content) == null ? void 0 : _a2.data) == null ? void 0 : _b.state,
    ...props.data,
    ...state.overrideState
  };
};
const contextContext = function contextContext2(props, state, elementRef) {
  return props.context || {};
};
const allRegisteredComponents = function allRegisteredComponents2(props, state, elementRef) {
  const allComponentsArray = [
    ...getDefaultRegisteredComponents(),
    ...components,
    ...props.customComponents || []
  ];
  const allComponents = allComponentsArray.reduce((acc, curr) => ({
    ...acc,
    [curr.name]: curr
  }), {});
  return allComponents;
};
const processMessage = function processMessage2(props, state, elementRef, event) {
  const { data } = event;
  if (data)
    switch (data.type) {
      case "builder.contentUpdate": {
        const messageContent = data.data;
        const key = messageContent.key || messageContent.alias || messageContent.entry || messageContent.modelName;
        const contentData = messageContent.data;
        if (key === props.model) {
          state.overrideContent = contentData;
          state.forceReRenderCount = state.forceReRenderCount + 1;
        }
        break;
      }
    }
};
const evaluateJsCode = function evaluateJsCode2(props, state, elementRef) {
  var _a2, _b;
  const jsCode = (_b = (_a2 = useContent(props, state)) == null ? void 0 : _a2.data) == null ? void 0 : _b.jsCode;
  if (jsCode)
    evaluate({
      code: jsCode,
      context: contextContext(props),
      state: contentState(props, state)
    });
};
const httpReqsData = function httpReqsData2(props, state, elementRef) {
  return {};
};
const onClick2 = function onClick3(props, state, elementRef, _event) {
  var _a2;
  if (useContent(props, state))
    track({
      type: "click",
      canTrack: canTrackToUse(props),
      contentId: (_a2 = useContent(props, state)) == null ? void 0 : _a2.id,
      orgId: props.apiKey
    });
};
const evalExpression = function evalExpression2(props, state, elementRef, expression) {
  return expression.replace(/{{([^}]+)}}/g, (_match, group) => evaluate({
    code: group,
    context: contextContext(props),
    state: contentState(props, state)
  }));
};
const handleRequest = function handleRequest2(props, state, elementRef, { url, key }) {
  getFetch().then((fetch2) => fetch2(url)).then((response) => response.json()).then((json) => {
    const newOverrideState = {
      ...state.overrideState,
      [key]: json
    };
    state.overrideState = newOverrideState;
  }).catch((err) => {
    console.log("error fetching dynamic data", url, err);
  });
};
const runHttpRequests = function runHttpRequests2(props, state, elementRef) {
  var _a2, _b, _c;
  const requests = (_c = (_b = (_a2 = useContent(props, state)) == null ? void 0 : _a2.data) == null ? void 0 : _b.httpRequests) != null ? _c : {};
  Object.entries(requests).forEach(([key, url]) => {
    if (url && (!httpReqsData()[key] || isEditing())) {
      const evaluatedUrl = evalExpression(props, state, elementRef, url);
      handleRequest(props, state, elementRef, {
        url: evaluatedUrl,
        key
      });
    }
  });
};
const emitStateUpdate = function emitStateUpdate2(props, state, elementRef) {
  if (isEditing())
    window.dispatchEvent(new CustomEvent("builder:component:stateChange", {
      detail: {
        state: contentState(props, state),
        ref: {
          name: props.model
        }
      }
    }));
};
const shouldRenderContentStyles = function shouldRenderContentStyles2(props, state, elementRef) {
  var _a2, _b, _c, _d, _e;
  return Boolean((((_b = (_a2 = useContent(props, state)) == null ? void 0 : _a2.data) == null ? void 0 : _b.cssCode) || ((_e = (_d = (_c = useContent(props, state)) == null ? void 0 : _c.data) == null ? void 0 : _d.customFonts) == null ? void 0 : _e.length)) && TARGET !== "reactNative");
};
const RenderContent = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  var _a2, _b, _c, _d, _e, _f, _g;
  const elementRef = useRef();
  const state = useStore({
    forceReRenderCount: 0,
    overrideContent: null,
    overrideState: {},
    update: 0
  });
  useContextProvider(BuilderContext, useStore({
    content: (() => {
      return useContent(props, state);
    })(),
    state: (() => {
      return contentState(props, state);
    })(),
    context: (() => {
      return contextContext(props);
    })(),
    apiKey: (() => {
      return props.apiKey;
    })(),
    registeredComponents: (() => {
      return allRegisteredComponents(props);
    })()
  }));
  useClientEffectQrl(inlinedQrl(() => {
    var _a3;
    const [elementRef2, props2, state2] = useLexicalScope();
    if (isBrowser()) {
      if (isEditing()) {
        state2.forceReRenderCount = state2.forceReRenderCount + 1;
        registerInsertMenu();
        setupBrowserForEditing();
        Object.values(allRegisteredComponents(props2)).forEach((registeredComponent) => {
          var _a4;
          const message = createRegisterComponentMessage(registeredComponent);
          (_a4 = window.parent) == null ? void 0 : _a4.postMessage(message, "*");
        });
        window.addEventListener("message", processMessage.bind(null, props2, state2, elementRef2));
        window.addEventListener("builder:component:stateChangeListenerActivated", emitStateUpdate.bind(null, props2, state2, elementRef2));
      }
      if (useContent(props2, state2))
        track({
          type: "impression",
          canTrack: canTrackToUse(props2),
          contentId: (_a3 = useContent(props2, state2)) == null ? void 0 : _a3.id,
          orgId: props2.apiKey
        });
      if (isPreviewing()) {
        const searchParams = new URL(location.href).searchParams;
        if (props2.model && searchParams.get("builder.preview") === props2.model) {
          const previewApiKey = searchParams.get("apiKey") || searchParams.get("builder.space");
          if (previewApiKey)
            getContent({
              model: props2.model,
              apiKey: previewApiKey
            }).then((content) => {
              if (content)
                state2.overrideContent = content;
            });
        }
      }
      evaluateJsCode(props2, state2);
      runHttpRequests(props2, state2, elementRef2);
      emitStateUpdate(props2, state2);
    }
  }, "RenderContent_component_useClientEffect_cA0sVHIkr5g", [
    elementRef,
    props,
    state
  ]));
  useWatchQrl(inlinedQrl(({ track: track2 }) => {
    var _a3, _b2;
    const [elementRef2, props2, state2] = useLexicalScope();
    ((_a3 = state2.useContent) == null ? void 0 : _a3.data) && track2((_b2 = state2.useContent) == null ? void 0 : _b2.data, "jsCode");
    evaluateJsCode(props2, state2);
  }, "RenderContent_component_useWatch_OIBatobA0hE", [
    elementRef,
    props,
    state
  ]));
  useWatchQrl(inlinedQrl(({ track: track2 }) => {
    var _a3, _b2;
    const [elementRef2, props2, state2] = useLexicalScope();
    ((_a3 = state2.useContent) == null ? void 0 : _a3.data) && track2((_b2 = state2.useContent) == null ? void 0 : _b2.data, "httpRequests");
    runHttpRequests(props2, state2, elementRef2);
  }, "RenderContent_component_useWatch_1_LQM67VNl14k", [
    elementRef,
    props,
    state
  ]));
  useWatchQrl(inlinedQrl(({ track: track2 }) => {
    const [elementRef2, props2, state2] = useLexicalScope();
    state2 && track2(state2, "contentState");
    emitStateUpdate(props2, state2);
  }, "RenderContent_component_useWatch_2_aGi0RpYNBO0", [
    elementRef,
    props,
    state
  ]));
  useCleanupQrl(inlinedQrl(() => {
    const [elementRef2, props2, state2] = useLexicalScope();
    if (isBrowser()) {
      window.removeEventListener("message", processMessage.bind(null, props2, state2, elementRef2));
      window.removeEventListener("builder:component:stateChangeListenerActivated", emitStateUpdate.bind(null, props2, state2, elementRef2));
    }
  }, "RenderContent_component_useCleanup_FwcO310HVAI", [
    elementRef,
    props,
    state
  ]));
  return /* @__PURE__ */ jsx(Fragment$1, {
    children: useContent(props, state) ? /* @__PURE__ */ jsx("div", {
      ref: elementRef,
      onClick$: inlinedQrl((event) => {
        const [elementRef2, props2, state2] = useLexicalScope();
        return onClick2(props2, state2);
      }, "RenderContent_component__Fragment_div_onClick_wLg5o3ZkpC0", [
        elementRef,
        props,
        state
      ]),
      "builder-content-id": (_a2 = useContent(props, state)) == null ? void 0 : _a2.id,
      children: [
        shouldRenderContentStyles(props, state) ? /* @__PURE__ */ jsx(RenderContentStyles$1, {
          cssCode: (_c = (_b = useContent(props, state)) == null ? void 0 : _b.data) == null ? void 0 : _c.cssCode,
          customFonts: (_e = (_d = useContent(props, state)) == null ? void 0 : _d.data) == null ? void 0 : _e.customFonts
        }) : null,
        /* @__PURE__ */ jsx(RenderBlocks$1, {
          blocks: markMutable((_g = (_f = useContent(props, state)) == null ? void 0 : _f.data) == null ? void 0 : _g.blocks)
        }, state.forceReRenderCount)
      ]
    }) : null
  });
}, "RenderContent_component_hEAI0ahViXM"));
const RenderContent$1 = RenderContent;
const Symbol$1 = /* @__PURE__ */ componentQrl(inlinedQrl((props) => {
  var _a2, _b, _c, _d, _e;
  const builderContext = useContext(BuilderContext);
  const state = useStore({
    className: "builder-symbol",
    content: null
  });
  useClientEffectQrl(inlinedQrl(() => {
    var _a3;
    const [props2, state2] = useLexicalScope();
    state2.content = (_a3 = props2.symbol) == null ? void 0 : _a3.content;
  }, "Symbol_component_useClientEffect_Kfc9q3nzeSQ", [
    props,
    state
  ]));
  useWatchQrl(inlinedQrl(({ track: track2 }) => {
    const [builderContext2, props2, state2] = useLexicalScope();
    props2 && track2(props2, "symbol");
    state2 && track2(state2, "content");
    const symbolToUse = props2.symbol;
    if (symbolToUse && !symbolToUse.content && !state2.content && symbolToUse.model)
      getContent({
        model: symbolToUse.model,
        apiKey: builderContext2.apiKey,
        query: {
          id: symbolToUse.entry
        }
      }).then((response) => {
        state2.content = response;
      });
  }, "Symbol_component_useWatch_9HNT04zd0Dk", [
    builderContext,
    props,
    state
  ]));
  return /* @__PURE__ */ jsx("div", {
    ...props.attributes,
    class: state.className,
    children: /* @__PURE__ */ jsx(RenderContent$1, {
      apiKey: builderContext.apiKey,
      context: builderContext.context,
      customComponents: markMutable(Object.values(builderContext.registeredComponents)),
      data: markMutable({
        ...(_a2 = props.symbol) == null ? void 0 : _a2.data,
        ...builderContext.state,
        ...(_d = (_c = (_b = props.symbol) == null ? void 0 : _b.content) == null ? void 0 : _c.data) == null ? void 0 : _d.state
      }),
      model: (_e = props.symbol) == null ? void 0 : _e.model,
      content: markMutable(state.content)
    })
  });
}, "Symbol_component_WVvggdkUPdk"));
const Symbol$2 = Symbol$1;
const BUILDER_PUBLIC_API_KEY$1 = "f5a098163c3741e19503f02a69360619";
const BUILDER_MODEL$1 = "page";
const index$1 = /* @__PURE__ */ componentQrl(inlinedQrl(() => {
  const location2 = useLocation();
  const editing = location2.href.includes("localhost");
  if (editing === false) {
    const store = useStore({
      resp: {
        html: ""
      }
    });
    const apiUrl = "https://cdn.builder.io/api/v1/qwik/" + BUILDER_MODEL$1 + "?url=https%3A%2F%2Fcosmic-dusk-68b932.netlify.app%2F&apiKey=" + BUILDER_PUBLIC_API_KEY$1 + "&limit=1&userAttributes.urlPath=" + location2.pathname || "/";
    useServerMountQrl(inlinedQrl(async () => {
      const [apiUrl2, store2] = useLexicalScope();
      const response = await fetch(apiUrl2);
      store2.resp = await response.json();
    }, "s_dNJ5Ezd0No0", [
      apiUrl,
      store
    ]));
    return /* @__PURE__ */ jsx("div", {
      dangerouslySetInnerHTML: store.resp.html
    });
  } else {
    const builderContentRsrc = useResourceQrl(inlinedQrl(() => {
      const [location3] = useLexicalScope();
      return getContent({
        model: BUILDER_MODEL$1,
        apiKey: BUILDER_PUBLIC_API_KEY$1,
        options: getBuilderSearchParams(location3.query),
        userAttributes: {
          urlPath: location3.pathname || "/"
        }
      });
    }, "s_DVD34gdl1HI", [
      location2
    ]));
    return /* @__PURE__ */ jsx("div", {
      children: /* @__PURE__ */ jsx("div", {
        children: /* @__PURE__ */ jsx(Resource, {
          value: builderContentRsrc,
          onPending: () => /* @__PURE__ */ jsx("div", {
            children: "Loading..."
          }),
          onResolved: (content) => /* @__PURE__ */ jsx(RenderContent$1, {
            model: BUILDER_MODEL$1,
            content,
            apiKey: BUILDER_PUBLIC_API_KEY$1
          })
        })
      })
    });
  }
}, "s_xYL1qOwPyDI"));
const Index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BUILDER_PUBLIC_API_KEY: BUILDER_PUBLIC_API_KEY$1,
  BUILDER_MODEL: BUILDER_MODEL$1,
  default: index$1
}, Symbol.toStringTag, { value: "Module" }));
const BUILDER_PUBLIC_API_KEY = "f5a098163c3741e19503f02a69360619";
const BUILDER_MODEL = "page";
const index = /* @__PURE__ */ componentQrl(inlinedQrl(() => {
  const location2 = useLocation();
  const editing = location2.href.includes("localhost");
  if (editing === false) {
    const store = useStore({
      resp: {
        html: ""
      }
    });
    const apiUrl = "https://cdn.builder.io/api/v1/qwik/" + BUILDER_MODEL + "?url=https%3A%2F%2Fcosmic-dusk-68b932.netlify.app%2F&apiKey=" + BUILDER_PUBLIC_API_KEY + "&limit=1&userAttributes.urlPath=" + location2.pathname || "/";
    useServerMountQrl(inlinedQrl(async () => {
      const [apiUrl2, store2] = useLexicalScope();
      const response = await fetch(apiUrl2);
      store2.resp = await response.json();
    }, "s_Yh2ETpAUYws", [
      apiUrl,
      store
    ]));
    return /* @__PURE__ */ jsx("div", {
      dangerouslySetInnerHTML: store.resp.html
    });
  } else {
    const builderContentRsrc = useResourceQrl(inlinedQrl(() => {
      const [location3] = useLexicalScope();
      return getContent({
        model: BUILDER_MODEL,
        apiKey: BUILDER_PUBLIC_API_KEY,
        options: getBuilderSearchParams(location3.query),
        userAttributes: {
          urlPath: location3.pathname || "/"
        }
      });
    }, "s_OResyzSVj0k", [
      location2
    ]));
    return /* @__PURE__ */ jsx("div", {
      children: /* @__PURE__ */ jsx("div", {
        children: /* @__PURE__ */ jsx(Resource, {
          value: builderContentRsrc,
          onPending: () => /* @__PURE__ */ jsx("div", {
            children: "Loading..."
          }),
          onResolved: (content) => /* @__PURE__ */ jsx(RenderContent$1, {
            model: BUILDER_MODEL,
            content,
            apiKey: BUILDER_PUBLIC_API_KEY
          })
        })
      })
    });
  }
}, "s_y9hqf93u3Hs"));
const Page = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BUILDER_PUBLIC_API_KEY,
  BUILDER_MODEL,
  default: index
}, Symbol.toStringTag, { value: "Module" }));
const Layout = () => Layout_;
const routes = [
  [/^\/$/, [Layout, () => Index], void 0, "/", ["q-0d3c3839.js", "q-ca65ccf1.js"]],
  [/^\/([^/]+?)\/?$/, [Layout, () => Page], ["page"], "/[page]", ["q-0d3c3839.js", "q-5ea45ce3.js"]]
];
const menus = [];
const trailingSlash = false;
const basePathname = "/";
const cacheModules = true;
const _qwikCityPlan = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  routes,
  menus,
  trailingSlash,
  basePathname,
  cacheModules
}, Symbol.toStringTag, { value: "Module" }));
var HEADERS = Symbol("headers");
var _a;
var HeadersPolyfill = class {
  constructor() {
    this[_a] = {};
  }
  [(_a = HEADERS, Symbol.iterator)]() {
    return this.entries();
  }
  *keys() {
    for (const name of Object.keys(this[HEADERS])) {
      yield name;
    }
  }
  *values() {
    for (const value of Object.values(this[HEADERS])) {
      yield value;
    }
  }
  *entries() {
    for (const name of Object.keys(this[HEADERS])) {
      yield [name, this.get(name)];
    }
  }
  get(name) {
    return this[HEADERS][normalizeHeaderName(name)] || null;
  }
  set(name, value) {
    const normalizedName = normalizeHeaderName(name);
    this[HEADERS][normalizedName] = typeof value !== "string" ? String(value) : value;
  }
  append(name, value) {
    const normalizedName = normalizeHeaderName(name);
    const resolvedValue = this.has(normalizedName) ? `${this.get(normalizedName)}, ${value}` : value;
    this.set(name, resolvedValue);
  }
  delete(name) {
    if (!this.has(name)) {
      return;
    }
    const normalizedName = normalizeHeaderName(name);
    delete this[HEADERS][normalizedName];
  }
  all() {
    return this[HEADERS];
  }
  has(name) {
    return this[HEADERS].hasOwnProperty(normalizeHeaderName(name));
  }
  forEach(callback, thisArg) {
    for (const name in this[HEADERS]) {
      if (this[HEADERS].hasOwnProperty(name)) {
        callback.call(thisArg, this[HEADERS][name], name, this);
      }
    }
  }
};
var HEADERS_INVALID_CHARACTERS = /[^a-z0-9\-#$%&'*+.^_`|~]/i;
function normalizeHeaderName(name) {
  if (typeof name !== "string") {
    name = String(name);
  }
  if (HEADERS_INVALID_CHARACTERS.test(name) || name.trim() === "") {
    throw new TypeError("Invalid character in header field name");
  }
  return name.toLowerCase();
}
function createHeaders() {
  return new (typeof Headers === "function" ? Headers : HeadersPolyfill)();
}
var ErrorResponse = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
function notFoundHandler(requestCtx) {
  return errorResponse(requestCtx, new ErrorResponse(404, "Not Found"));
}
function errorHandler(requestCtx, e) {
  const status = 500;
  let message = "Server Error";
  let stack = void 0;
  if (e != null) {
    if (typeof e === "object") {
      if (typeof e.message === "string") {
        message = e.message;
      }
      if (e.stack != null) {
        stack = String(e.stack);
      }
    } else {
      message = String(e);
    }
  }
  const html = minimalHtmlResponse(status, message, stack);
  const headers = createHeaders();
  headers.set("Content-Type", "text/html; charset=utf-8");
  return requestCtx.response(
    status,
    headers,
    async (stream) => {
      stream.write(html);
    },
    e
  );
}
function errorResponse(requestCtx, errorResponse2) {
  const html = minimalHtmlResponse(
    errorResponse2.status,
    errorResponse2.message,
    errorResponse2.stack
  );
  const headers = createHeaders();
  headers.set("Content-Type", "text/html; charset=utf-8");
  return requestCtx.response(
    errorResponse2.status,
    headers,
    async (stream) => {
      stream.write(html);
    },
    errorResponse2
  );
}
function minimalHtmlResponse(status, message, stack) {
  const width = typeof message === "string" ? "600px" : "300px";
  const color = status >= 500 ? COLOR_500 : COLOR_400;
  if (status < 500) {
    stack = "";
  }
  return `<!DOCTYPE html>
<html data-qwik-city-status="${status}">
<head>
  <meta charset="utf-8">
  <title>${status} ${message}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { color: ${color}; background-color: #fafafa; padding: 30px; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }
    p { max-width: ${width}; margin: 60px auto 30px auto; background: white; border-radius: 4px; box-shadow: 0px 0px 50px -20px ${color}; overflow: hidden; }
    strong { display: inline-block; padding: 15px; background: ${color}; color: white; }
    span { display: inline-block; padding: 15px; }
    pre { max-width: 580px; margin: 0 auto; }
  </style>
</head>
<body>
  <p>
    <strong>${status}</strong>
    <span>${message}</span>
  </p>
  ${stack ? `<pre><code>${stack}</code></pre>` : ``}
</body>
</html>
`;
}
var COLOR_400 = "#006ce9";
var COLOR_500 = "#713fc2";
var MODULE_CACHE = /* @__PURE__ */ new WeakMap();
var loadRoute = async (routes2, menus2, cacheModules2, pathname) => {
  if (Array.isArray(routes2)) {
    for (const route of routes2) {
      const match = route[0].exec(pathname);
      if (match) {
        const loaders = route[1];
        const params = getRouteParams(route[2], match);
        const routeBundleNames = route[4];
        const mods = new Array(loaders.length);
        const pendingLoads = [];
        const menuLoader = getMenuLoader(menus2, pathname);
        let menu = void 0;
        loaders.forEach((moduleLoader, i) => {
          loadModule(
            moduleLoader,
            pendingLoads,
            (routeModule) => mods[i] = routeModule,
            cacheModules2
          );
        });
        loadModule(
          menuLoader,
          pendingLoads,
          (menuModule) => menu = menuModule == null ? void 0 : menuModule.default,
          cacheModules2
        );
        if (pendingLoads.length > 0) {
          await Promise.all(pendingLoads);
        }
        return [params, mods, menu, routeBundleNames];
      }
    }
  }
  return null;
};
var loadModule = (moduleLoader, pendingLoads, moduleSetter, cacheModules2) => {
  if (typeof moduleLoader === "function") {
    const loadedModule = MODULE_CACHE.get(moduleLoader);
    if (loadedModule) {
      moduleSetter(loadedModule);
    } else {
      const l = moduleLoader();
      if (typeof l.then === "function") {
        pendingLoads.push(
          l.then((loadedModule2) => {
            if (cacheModules2 !== false) {
              MODULE_CACHE.set(moduleLoader, loadedModule2);
            }
            moduleSetter(loadedModule2);
          })
        );
      } else if (l) {
        moduleSetter(l);
      }
    }
  }
};
var getMenuLoader = (menus2, pathname) => {
  if (menus2) {
    const menu = menus2.find(
      (m) => m[0] === pathname || pathname.startsWith(m[0] + (pathname.endsWith("/") ? "" : "/"))
    );
    if (menu) {
      return menu[1];
    }
  }
  return void 0;
};
var getRouteParams = (paramNames, match) => {
  const params = {};
  if (paramNames) {
    for (let i = 0; i < paramNames.length; i++) {
      params[paramNames[i]] = match ? match[i + 1] : "";
    }
  }
  return params;
};
var RedirectResponse = class {
  constructor(url, status, headers) {
    this.url = url;
    this.location = url;
    this.status = isRedirectStatus(status) ? status : 307;
    this.headers = headers || createHeaders();
    this.headers.set("Location", this.location);
    this.headers.delete("Cache-Control");
  }
};
function redirectResponse(requestCtx, responseRedirect) {
  return requestCtx.response(responseRedirect.status, responseRedirect.headers, async () => {
  });
}
function isRedirectStatus(status) {
  return typeof status === "number" && status >= 301 && status <= 308;
}
async function loadUserResponse(requestCtx, params, routeModules, platform, trailingSlash2, basePathname2 = "/") {
  if (routeModules.length === 0) {
    throw new ErrorResponse(404, `Not Found`);
  }
  const { request, url } = requestCtx;
  const { pathname } = url;
  const isPageModule = isLastModulePageRoute(routeModules);
  const isPageDataRequest = isPageModule && request.headers.get("Accept") === "application/json";
  const type = isPageDataRequest ? "pagedata" : isPageModule ? "pagehtml" : "endpoint";
  const userResponse = {
    type,
    url,
    params,
    status: 200,
    headers: createHeaders(),
    resolvedBody: void 0,
    pendingBody: void 0,
    aborted: false
  };
  let hasRequestMethodHandler = false;
  if (isPageModule && pathname !== basePathname2) {
    if (trailingSlash2) {
      if (!pathname.endsWith("/")) {
        throw new RedirectResponse(pathname + "/" + url.search, 307);
      }
    } else {
      if (pathname.endsWith("/")) {
        throw new RedirectResponse(
          pathname.slice(0, pathname.length - 1) + url.search,
          307
        );
      }
    }
  }
  let routeModuleIndex = -1;
  const abort = () => {
    routeModuleIndex = ABORT_INDEX;
  };
  const redirect = (url2, status) => {
    return new RedirectResponse(url2, status, userResponse.headers);
  };
  const error = (status, message) => {
    return new ErrorResponse(status, message);
  };
  const next = async () => {
    routeModuleIndex++;
    while (routeModuleIndex < routeModules.length) {
      const endpointModule = routeModules[routeModuleIndex];
      let reqHandler = void 0;
      switch (request.method) {
        case "GET": {
          reqHandler = endpointModule.onGet;
          break;
        }
        case "POST": {
          reqHandler = endpointModule.onPost;
          break;
        }
        case "PUT": {
          reqHandler = endpointModule.onPut;
          break;
        }
        case "PATCH": {
          reqHandler = endpointModule.onPatch;
          break;
        }
        case "OPTIONS": {
          reqHandler = endpointModule.onOptions;
          break;
        }
        case "HEAD": {
          reqHandler = endpointModule.onHead;
          break;
        }
        case "DELETE": {
          reqHandler = endpointModule.onDelete;
          break;
        }
      }
      reqHandler = reqHandler || endpointModule.onRequest;
      if (typeof reqHandler === "function") {
        hasRequestMethodHandler = true;
        const response = {
          get status() {
            return userResponse.status;
          },
          set status(code) {
            userResponse.status = code;
          },
          get headers() {
            return userResponse.headers;
          },
          redirect,
          error
        };
        const requestEv = {
          request,
          url: new URL(url),
          params: { ...params },
          response,
          platform,
          next,
          abort
        };
        const syncData = reqHandler(requestEv);
        if (typeof syncData === "function") {
          userResponse.pendingBody = createPendingBody(syncData);
        } else if (syncData !== null && typeof syncData === "object" && typeof syncData.then === "function") {
          const asyncResolved = await syncData;
          if (typeof asyncResolved === "function") {
            userResponse.pendingBody = createPendingBody(asyncResolved);
          } else {
            userResponse.resolvedBody = asyncResolved;
          }
        } else {
          userResponse.resolvedBody = syncData;
        }
      }
      routeModuleIndex++;
    }
  };
  await next();
  userResponse.aborted = routeModuleIndex >= ABORT_INDEX;
  if (!isPageDataRequest && isRedirectStatus(userResponse.status) && userResponse.headers.has("Location")) {
    throw new RedirectResponse(
      userResponse.headers.get("Location"),
      userResponse.status,
      userResponse.headers
    );
  }
  if (type === "endpoint" && !hasRequestMethodHandler) {
    throw new ErrorResponse(405, `Method Not Allowed`);
  }
  return userResponse;
}
function createPendingBody(cb) {
  return new Promise((resolve, reject) => {
    try {
      const rtn = cb();
      if (rtn !== null && typeof rtn === "object" && typeof rtn.then === "function") {
        rtn.then(resolve, reject);
      } else {
        resolve(rtn);
      }
    } catch (e) {
      reject(e);
    }
  });
}
function isLastModulePageRoute(routeModules) {
  const lastRouteModule = routeModules[routeModules.length - 1];
  return lastRouteModule && typeof lastRouteModule.default === "function";
}
function updateRequestCtx(requestCtx, trailingSlash2) {
  let pathname = requestCtx.url.pathname;
  if (pathname.endsWith(QDATA_JSON)) {
    requestCtx.request.headers.set("Accept", "application/json");
    const trimEnd = pathname.length - QDATA_JSON_LEN + (trailingSlash2 ? 1 : 0);
    pathname = pathname.slice(0, trimEnd);
    if (pathname === "") {
      pathname = "/";
    }
    requestCtx.url.pathname = pathname;
  }
}
var QDATA_JSON = "/q-data.json";
var QDATA_JSON_LEN = QDATA_JSON.length;
var ABORT_INDEX = 999999999;
function endpointHandler(requestCtx, userResponse) {
  const { pendingBody, resolvedBody, status, headers } = userResponse;
  const { response } = requestCtx;
  if (pendingBody === void 0 && resolvedBody === void 0) {
    return response(status, headers, asyncNoop);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }
  const isJson = headers.get("Content-Type").includes("json");
  return response(status, headers, async ({ write }) => {
    const body = pendingBody !== void 0 ? await pendingBody : resolvedBody;
    if (body !== void 0) {
      if (isJson) {
        write(JSON.stringify(body));
      } else {
        const type = typeof body;
        if (type === "string") {
          write(body);
        } else if (type === "number" || type === "boolean") {
          write(String(body));
        } else {
          write(body);
        }
      }
    }
  });
}
var asyncNoop = async () => {
};
function pageHandler(requestCtx, userResponse, render2, opts, routeBundleNames) {
  const { status, headers } = userResponse;
  const { response } = requestCtx;
  const isPageData = userResponse.type === "pagedata";
  if (isPageData) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "text/html; charset=utf-8");
  }
  return response(isPageData ? 200 : status, headers, async (stream) => {
    const result = await render2({
      stream: isPageData ? noopStream : stream,
      envData: getQwikCityEnvData(userResponse),
      ...opts
    });
    if (isPageData) {
      stream.write(JSON.stringify(await getClientPageData(userResponse, result, routeBundleNames)));
    } else {
      if ((typeof result).html === "string") {
        stream.write(result.html);
      }
    }
    if (typeof stream.clientData === "function") {
      stream.clientData(await getClientPageData(userResponse, result, routeBundleNames));
    }
  });
}
async function getClientPageData(userResponse, result, routeBundleNames) {
  const prefetchBundleNames = getPrefetchBundleNames(result, routeBundleNames);
  const clientPage = {
    body: userResponse.pendingBody ? await userResponse.pendingBody : userResponse.resolvedBody,
    status: userResponse.status !== 200 ? userResponse.status : void 0,
    redirect: userResponse.status >= 301 && userResponse.status <= 308 && userResponse.headers.get("location") || void 0,
    prefetch: prefetchBundleNames.length > 0 ? prefetchBundleNames : void 0
  };
  return clientPage;
}
function getPrefetchBundleNames(result, routeBundleNames) {
  const bundleNames = [];
  const addBundle2 = (bundleName) => {
    if (bundleName && !bundleNames.includes(bundleName)) {
      bundleNames.push(bundleName);
    }
  };
  const addPrefetchResource = (prefetchResources) => {
    if (Array.isArray(prefetchResources)) {
      for (const prefetchResource of prefetchResources) {
        const bundleName = prefetchResource.url.split("/").pop();
        if (bundleName && !bundleNames.includes(bundleName)) {
          addBundle2(bundleName);
          addPrefetchResource(prefetchResource.imports);
        }
      }
    }
  };
  addPrefetchResource(result.prefetchResources);
  const manifest2 = result.manifest || result._manifest;
  const renderedSymbols = result._symbols;
  if (manifest2 && renderedSymbols) {
    for (const renderedSymbolName of renderedSymbols) {
      const symbol = manifest2.symbols[renderedSymbolName];
      if (symbol && symbol.ctxName === "component$") {
        addBundle2(manifest2.mapping[renderedSymbolName]);
      }
    }
  }
  if (routeBundleNames) {
    for (const routeBundleName of routeBundleNames) {
      addBundle2(routeBundleName);
    }
  }
  return bundleNames;
}
function getQwikCityEnvData(userResponse) {
  const { url, params, pendingBody, resolvedBody, status } = userResponse;
  return {
    url: url.href,
    qwikcity: {
      params: { ...params },
      response: {
        body: pendingBody || resolvedBody,
        status
      }
    }
  };
}
var noopStream = { write: () => {
} };
async function requestHandler(requestCtx, render2, platform, opts) {
  try {
    updateRequestCtx(requestCtx, trailingSlash);
    const loadedRoute = await loadRoute(routes, menus, cacheModules, requestCtx.url.pathname);
    if (loadedRoute) {
      const [params, mods, _, routeBundleNames] = loadedRoute;
      const userResponse = await loadUserResponse(
        requestCtx,
        params,
        mods,
        platform,
        trailingSlash,
        basePathname
      );
      if (userResponse.aborted) {
        return null;
      }
      if (userResponse.type === "endpoint") {
        return endpointHandler(requestCtx, userResponse);
      }
      return pageHandler(requestCtx, userResponse, render2, opts, routeBundleNames);
    }
  } catch (e) {
    if (e instanceof RedirectResponse) {
      return redirectResponse(requestCtx, e);
    }
    if (e instanceof ErrorResponse) {
      return errorResponse(requestCtx, e);
    }
    return errorHandler(requestCtx, e);
  }
  return null;
}
function qwikCity(render2, opts) {
  async function onRequest(request, { next }) {
    try {
      const requestCtx = {
        url: new URL(request.url),
        request,
        response: (status, headers, body) => {
          return new Promise((resolve) => {
            let flushedHeaders = false;
            const { readable, writable } = new TransformStream();
            const writer = writable.getWriter();
            const response = new Response(readable, { status, headers });
            body({
              write: (chunk) => {
                if (!flushedHeaders) {
                  flushedHeaders = true;
                  resolve(response);
                }
                if (typeof chunk === "string") {
                  const encoder = new TextEncoder();
                  writer.write(encoder.encode(chunk));
                } else {
                  writer.write(chunk);
                }
              }
            }).finally(() => {
              if (!flushedHeaders) {
                flushedHeaders = true;
                resolve(response);
              }
              writer.close();
            });
          });
        }
      };
      const handledResponse = await requestHandler(requestCtx, render2, {}, opts);
      if (handledResponse) {
        return handledResponse;
      }
      const nextResponse = await next();
      if (nextResponse.status === 404) {
        const handledResponse2 = await requestHandler(requestCtx, render2, {}, opts);
        if (handledResponse2) {
          return handledResponse2;
        }
        const notFoundResponse = await notFoundHandler(requestCtx);
        return notFoundResponse;
      }
      return nextResponse;
    } catch (e) {
      return new Response(String(e || "Error"), {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  }
  return onRequest;
}
/**
 * @license
 * @builder.io/qwik/server 0.9.0
 * Copyright Builder.io, Inc. All Rights Reserved.
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
if (typeof global == "undefined") {
  const g = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof self ? self : {};
  g.global = g;
}
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a2, b) => (typeof require !== "undefined" ? require : a2)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});
function createTimer() {
  if (typeof performance === "undefined") {
    return () => 0;
  }
  const start = performance.now();
  return () => {
    const end = performance.now();
    const delta = end - start;
    return delta / 1e6;
  };
}
function getBuildBase(opts) {
  let base = opts.base;
  if (typeof base === "string") {
    if (!base.endsWith("/")) {
      base += "/";
    }
    return base;
  }
  return "/build/";
}
function createPlatform(opts, resolvedManifest) {
  const mapper = resolvedManifest == null ? void 0 : resolvedManifest.mapper;
  const mapperFn = opts.symbolMapper ? opts.symbolMapper : (symbolName) => {
    if (mapper) {
      const hash = getSymbolHash(symbolName);
      const result = mapper[hash];
      if (!result) {
        console.error("Cannot resolve symbol", symbolName, "in", mapper);
      }
      return result;
    }
  };
  const serverPlatform = {
    isServer: true,
    async importSymbol(_element, qrl, symbolName) {
      let [modulePath] = String(qrl).split("#");
      if (!modulePath.endsWith(".js")) {
        modulePath += ".js";
      }
      const module = __require(modulePath);
      if (!(symbolName in module)) {
        throw new Error(`Q-ERROR: missing symbol '${symbolName}' in module '${modulePath}'.`);
      }
      const symbol = module[symbolName];
      return symbol;
    },
    raf: () => {
      console.error("server can not rerender");
      return Promise.resolve();
    },
    nextTick: (fn) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(fn());
        });
      });
    },
    chunkForSymbol(symbolName) {
      return mapperFn(symbolName, mapper);
    }
  };
  return serverPlatform;
}
async function setServerPlatform(opts, manifest2) {
  const platform = createPlatform(opts, manifest2);
  setPlatform(platform);
}
var getSymbolHash = (symbolName) => {
  const index2 = symbolName.lastIndexOf("_");
  if (index2 > -1) {
    return symbolName.slice(index2 + 1);
  }
  return symbolName;
};
var QWIK_LOADER_DEFAULT_MINIFIED = '(()=>{function e(e){return"object"==typeof e&&e&&"Module"===e[Symbol.toStringTag]}((t,n)=>{const o="__q_context__",r=window,a=(e,n,o)=>{n=n.replace(/([A-Z])/g,(e=>"-"+e.toLowerCase())),t.querySelectorAll("[on"+e+"\\\\:"+n+"]").forEach((t=>l(t,e,n,o)))},i=(e,t)=>new CustomEvent(e,{detail:t}),s=e=>{throw Error("QWIK "+e)},c=(e,n)=>(e=e.closest("[q\\\\:container]"),new URL(n,new URL(e?e.getAttribute("q:base"):t.baseURI,t.baseURI))),l=async(n,a,l,d)=>{var u;n.hasAttribute("preventdefault:"+l)&&d.preventDefault();const b="on"+a+":"+l,v=null==(u=n._qc_)?void 0:u.li[b];if(v){for(const e of v)await e.getFn([n,d],(()=>n.isConnected))(d,n);return}const p=n.getAttribute(b);if(p)for(const a of p.split("\\n")){const l=c(n,a);if(l){const a=f(l),c=(r[l.pathname]||(w=await import(l.href.split("#")[0]),Object.values(w).find(e)||w))[a]||s(l+" does not export "+a),u=t[o];if(n.isConnected)try{t[o]=[n,d,l],await c(d,n)}finally{t[o]=u,t.dispatchEvent(i("qsymbol",{symbol:a,element:n}))}}}var w},f=e=>e.hash.replace(/^#?([^?[|]*).*$/,"$1")||"default",d=async e=>{let t=e.target;for(a("-document",e.type,e);t&&t.getAttribute;)await l(t,"",e.type,e),t=e.bubbles&&!0!==e.cancelBubble?t.parentElement:null},u=e=>{a("-window",e.type,e)},b=()=>{const e=t.readyState;if(!n&&("interactive"==e||"complete"==e)){n=1,a("","qinit",i("qinit"));const e=t.querySelectorAll("[on\\\\:qvisible]");if(e.length>0){const t=new IntersectionObserver((e=>{for(const n of e)n.isIntersecting&&(t.unobserve(n.target),l(n.target,"","qvisible",i("qvisible",n)))}));e.forEach((e=>t.observe(e)))}}},v=new Set,p=e=>{for(const t of e)v.has(t)||(document.addEventListener(t,d,{capture:!0}),r.addEventListener(t,u),v.add(t))};if(!t.qR){const e=r.qwikevents;Array.isArray(e)&&p(e),r.qwikevents={push:(...e)=>p(e)},t.addEventListener("readystatechange",b),b()}})(document)})();';
var QWIK_LOADER_DEFAULT_DEBUG = '(() => {\n    function findModule(module) {\n        return Object.values(module).find(isModule) || module;\n    }\n    function isModule(module) {\n        return "object" == typeof module && module && "Module" === module[Symbol.toStringTag];\n    }\n    ((doc, hasInitialized) => {\n        const win = window;\n        const broadcast = (infix, type, ev) => {\n            type = type.replace(/([A-Z])/g, (a => "-" + a.toLowerCase()));\n            doc.querySelectorAll("[on" + infix + "\\\\:" + type + "]").forEach((target => dispatch(target, infix, type, ev)));\n        };\n        const createEvent = (eventName, detail) => new CustomEvent(eventName, {\n            detail: detail\n        });\n        const error = msg => {\n            throw new Error("QWIK " + msg);\n        };\n        const qrlResolver = (element, qrl) => {\n            element = element.closest("[q\\\\:container]");\n            return new URL(qrl, new URL(element ? element.getAttribute("q:base") : doc.baseURI, doc.baseURI));\n        };\n        const dispatch = async (element, onPrefix, eventName, ev) => {\n            var _a;\n            element.hasAttribute("preventdefault:" + eventName) && ev.preventDefault();\n            const attrName = "on" + onPrefix + ":" + eventName;\n            const qrls = null == (_a = element._qc_) ? void 0 : _a.li[attrName];\n            if (qrls) {\n                for (const q of qrls) {\n                    await q.getFn([ element, ev ], (() => element.isConnected))(ev, element);\n                }\n                return;\n            }\n            const attrValue = element.getAttribute(attrName);\n            if (attrValue) {\n                for (const qrl of attrValue.split("\\n")) {\n                    const url = qrlResolver(element, qrl);\n                    if (url) {\n                        const symbolName = getSymbolName(url);\n                        const handler = (win[url.pathname] || findModule(await import(url.href.split("#")[0])))[symbolName] || error(url + " does not export " + symbolName);\n                        const previousCtx = doc.__q_context__;\n                        if (element.isConnected) {\n                            try {\n                                doc.__q_context__ = [ element, ev, url ];\n                                await handler(ev, element);\n                            } finally {\n                                doc.__q_context__ = previousCtx;\n                                doc.dispatchEvent(createEvent("qsymbol", {\n                                    symbol: symbolName,\n                                    element: element\n                                }));\n                            }\n                        }\n                    }\n                }\n            }\n        };\n        const getSymbolName = url => url.hash.replace(/^#?([^?[|]*).*$/, "$1") || "default";\n        const processDocumentEvent = async ev => {\n            let element = ev.target;\n            broadcast("-document", ev.type, ev);\n            while (element && element.getAttribute) {\n                await dispatch(element, "", ev.type, ev);\n                element = ev.bubbles && !0 !== ev.cancelBubble ? element.parentElement : null;\n            }\n        };\n        const processWindowEvent = ev => {\n            broadcast("-window", ev.type, ev);\n        };\n        const processReadyStateChange = () => {\n            const readyState = doc.readyState;\n            if (!hasInitialized && ("interactive" == readyState || "complete" == readyState)) {\n                hasInitialized = 1;\n                broadcast("", "qinit", createEvent("qinit"));\n                const results = doc.querySelectorAll("[on\\\\:qvisible]");\n                if (results.length > 0) {\n                    const observer = new IntersectionObserver((entries => {\n                        for (const entry of entries) {\n                            if (entry.isIntersecting) {\n                                observer.unobserve(entry.target);\n                                dispatch(entry.target, "", "qvisible", createEvent("qvisible", entry));\n                            }\n                        }\n                    }));\n                    results.forEach((el => observer.observe(el)));\n                }\n            }\n        };\n        const events =  new Set;\n        const push = eventNames => {\n            for (const eventName of eventNames) {\n                if (!events.has(eventName)) {\n                    document.addEventListener(eventName, processDocumentEvent, {\n                        capture: !0\n                    });\n                    win.addEventListener(eventName, processWindowEvent);\n                    events.add(eventName);\n                }\n            }\n        };\n        if (!doc.qR) {\n            const qwikevents = win.qwikevents;\n            Array.isArray(qwikevents) && push(qwikevents);\n            win.qwikevents = {\n                push: (...e) => push(e)\n            };\n            doc.addEventListener("readystatechange", processReadyStateChange);\n            processReadyStateChange();\n        }\n    })(document);\n})();';
var QWIK_LOADER_OPTIMIZE_MINIFIED = '(()=>{function e(e){return"object"==typeof e&&e&&"Module"===e[Symbol.toStringTag]}((t,n)=>{const o="__q_context__",r=window,a=(e,n,o)=>{n=n.replace(/([A-Z])/g,(e=>"-"+e.toLowerCase())),t.querySelectorAll("[on"+e+"\\\\:"+n+"]").forEach((t=>l(t,e,n,o)))},i=(e,t)=>new CustomEvent(e,{detail:t}),s=e=>{throw Error("QWIK "+e)},c=(e,n)=>(e=e.closest("[q\\\\:container]"),new URL(n,new URL(e?e.getAttribute("q:base"):t.baseURI,t.baseURI))),l=async(n,a,l,d)=>{var u;n.hasAttribute("preventdefault:"+l)&&d.preventDefault();const b="on"+a+":"+l,v=null==(u=n._qc_)?void 0:u.li[b];if(v){for(const e of v)await e.getFn([n,d],(()=>n.isConnected))(d,n);return}const p=n.getAttribute(b);if(p)for(const a of p.split("\\n")){const l=c(n,a);if(l){const a=f(l),c=(r[l.pathname]||(w=await import(l.href.split("#")[0]),Object.values(w).find(e)||w))[a]||s(l+" does not export "+a),u=t[o];if(n.isConnected)try{t[o]=[n,d,l],await c(d,n)}finally{t[o]=u,t.dispatchEvent(i("qsymbol",{symbol:a,element:n}))}}}var w},f=e=>e.hash.replace(/^#?([^?[|]*).*$/,"$1")||"default",d=async e=>{let t=e.target;for(a("-document",e.type,e);t&&t.getAttribute;)await l(t,"",e.type,e),t=e.bubbles&&!0!==e.cancelBubble?t.parentElement:null},u=e=>{a("-window",e.type,e)},b=()=>{const e=t.readyState;if(!n&&("interactive"==e||"complete"==e)){n=1,a("","qinit",i("qinit"));const e=t.querySelectorAll("[on\\\\:qvisible]");if(e.length>0){const t=new IntersectionObserver((e=>{for(const n of e)n.isIntersecting&&(t.unobserve(n.target),l(n.target,"","qvisible",i("qvisible",n)))}));e.forEach((e=>t.observe(e)))}}},v=new Set,p=e=>{for(const t of e)v.has(t)||(document.addEventListener(t,d,{capture:!0}),r.addEventListener(t,u),v.add(t))};if(!t.qR){const e=r.qwikevents;Array.isArray(e)&&p(e),r.qwikevents={push:(...e)=>p(e)},t.addEventListener("readystatechange",b),b()}})(document)})();';
var QWIK_LOADER_OPTIMIZE_DEBUG = '(() => {\n    function findModule(module) {\n        return Object.values(module).find(isModule) || module;\n    }\n    function isModule(module) {\n        return "object" == typeof module && module && "Module" === module[Symbol.toStringTag];\n    }\n    ((doc, hasInitialized) => {\n        const win = window;\n        const broadcast = (infix, type, ev) => {\n            type = type.replace(/([A-Z])/g, (a => "-" + a.toLowerCase()));\n            doc.querySelectorAll("[on" + infix + "\\\\:" + type + "]").forEach((target => dispatch(target, infix, type, ev)));\n        };\n        const createEvent = (eventName, detail) => new CustomEvent(eventName, {\n            detail: detail\n        });\n        const error = msg => {\n            throw new Error("QWIK " + msg);\n        };\n        const qrlResolver = (element, qrl) => {\n            element = element.closest("[q\\\\:container]");\n            return new URL(qrl, new URL(element ? element.getAttribute("q:base") : doc.baseURI, doc.baseURI));\n        };\n        const dispatch = async (element, onPrefix, eventName, ev) => {\n            var _a;\n            element.hasAttribute("preventdefault:" + eventName) && ev.preventDefault();\n            const attrName = "on" + onPrefix + ":" + eventName;\n            const qrls = null == (_a = element._qc_) ? void 0 : _a.li[attrName];\n            if (qrls) {\n                for (const q of qrls) {\n                    await q.getFn([ element, ev ], (() => element.isConnected))(ev, element);\n                }\n                return;\n            }\n            const attrValue = element.getAttribute(attrName);\n            if (attrValue) {\n                for (const qrl of attrValue.split("\\n")) {\n                    const url = qrlResolver(element, qrl);\n                    if (url) {\n                        const symbolName = getSymbolName(url);\n                        const handler = (win[url.pathname] || findModule(await import(url.href.split("#")[0])))[symbolName] || error(url + " does not export " + symbolName);\n                        const previousCtx = doc.__q_context__;\n                        if (element.isConnected) {\n                            try {\n                                doc.__q_context__ = [ element, ev, url ];\n                                await handler(ev, element);\n                            } finally {\n                                doc.__q_context__ = previousCtx;\n                                doc.dispatchEvent(createEvent("qsymbol", {\n                                    symbol: symbolName,\n                                    element: element\n                                }));\n                            }\n                        }\n                    }\n                }\n            }\n        };\n        const getSymbolName = url => url.hash.replace(/^#?([^?[|]*).*$/, "$1") || "default";\n        const processDocumentEvent = async ev => {\n            let element = ev.target;\n            broadcast("-document", ev.type, ev);\n            while (element && element.getAttribute) {\n                await dispatch(element, "", ev.type, ev);\n                element = ev.bubbles && !0 !== ev.cancelBubble ? element.parentElement : null;\n            }\n        };\n        const processWindowEvent = ev => {\n            broadcast("-window", ev.type, ev);\n        };\n        const processReadyStateChange = () => {\n            const readyState = doc.readyState;\n            if (!hasInitialized && ("interactive" == readyState || "complete" == readyState)) {\n                hasInitialized = 1;\n                broadcast("", "qinit", createEvent("qinit"));\n                const results = doc.querySelectorAll("[on\\\\:qvisible]");\n                if (results.length > 0) {\n                    const observer = new IntersectionObserver((entries => {\n                        for (const entry of entries) {\n                            if (entry.isIntersecting) {\n                                observer.unobserve(entry.target);\n                                dispatch(entry.target, "", "qvisible", createEvent("qvisible", entry));\n                            }\n                        }\n                    }));\n                    results.forEach((el => observer.observe(el)));\n                }\n            }\n        };\n        const events = new Set;\n        const push = eventNames => {\n            for (const eventName of eventNames) {\n                if (!events.has(eventName)) {\n                    document.addEventListener(eventName, processDocumentEvent, {\n                        capture: !0\n                    });\n                    win.addEventListener(eventName, processWindowEvent);\n                    events.add(eventName);\n                }\n            }\n        };\n        if (!doc.qR) {\n            const qwikevents = win.qwikevents;\n            Array.isArray(qwikevents) && push(qwikevents);\n            win.qwikevents = {\n                push: (...e) => push(e)\n            };\n            doc.addEventListener("readystatechange", processReadyStateChange);\n            processReadyStateChange();\n        }\n    })(document);\n})();';
function getQwikLoaderScript(opts = {}) {
  if (Array.isArray(opts.events) && opts.events.length > 0) {
    const loader = opts.debug ? QWIK_LOADER_OPTIMIZE_DEBUG : QWIK_LOADER_OPTIMIZE_MINIFIED;
    return loader.replace("window.qEvents", JSON.stringify(opts.events));
  }
  return opts.debug ? QWIK_LOADER_DEFAULT_DEBUG : QWIK_LOADER_DEFAULT_MINIFIED;
}
function getPrefetchResources(snapshotResult, opts, resolvedManifest) {
  if (!resolvedManifest) {
    return [];
  }
  const prefetchStrategy = opts.prefetchStrategy;
  const buildBase = getBuildBase(opts);
  if (prefetchStrategy !== null) {
    if (!prefetchStrategy || !prefetchStrategy.symbolsToPrefetch || prefetchStrategy.symbolsToPrefetch === "auto") {
      return getAutoPrefetch(snapshotResult, resolvedManifest, buildBase);
    }
    if (typeof prefetchStrategy.symbolsToPrefetch === "function") {
      try {
        return prefetchStrategy.symbolsToPrefetch({ manifest: resolvedManifest.manifest });
      } catch (e) {
        console.error("getPrefetchUrls, symbolsToPrefetch()", e);
      }
    }
  }
  return [];
}
function getAutoPrefetch(snapshotResult, resolvedManifest, buildBase) {
  const prefetchResources = [];
  const listeners = snapshotResult == null ? void 0 : snapshotResult.listeners;
  const stateObjs = snapshotResult == null ? void 0 : snapshotResult.objs;
  const { mapper, manifest: manifest2 } = resolvedManifest;
  const urls = /* @__PURE__ */ new Set();
  if (Array.isArray(listeners)) {
    for (const prioritizedSymbolName in mapper) {
      const hasSymbol = listeners.some((l) => {
        return l.qrl.getHash() === prioritizedSymbolName;
      });
      if (hasSymbol) {
        addBundle(manifest2, urls, prefetchResources, buildBase, mapper[prioritizedSymbolName][1]);
      }
    }
  }
  if (Array.isArray(stateObjs)) {
    for (const obj of stateObjs) {
      if (isQrl(obj)) {
        const qrlSymbolName = obj.getHash();
        const resolvedSymbol = mapper[qrlSymbolName];
        if (resolvedSymbol) {
          addBundle(manifest2, urls, prefetchResources, buildBase, resolvedSymbol[0]);
        }
      }
    }
  }
  return prefetchResources;
}
function addBundle(manifest2, urls, prefetchResources, buildBase, bundleFileName) {
  const url = buildBase + bundleFileName;
  if (!urls.has(url)) {
    urls.add(url);
    const bundle = manifest2.bundles[bundleFileName];
    if (bundle) {
      const prefetchResource = {
        url,
        imports: []
      };
      prefetchResources.push(prefetchResource);
      if (Array.isArray(bundle.imports)) {
        for (const importedFilename of bundle.imports) {
          addBundle(manifest2, urls, prefetchResource.imports, buildBase, importedFilename);
        }
      }
    }
  }
}
var isQrl = (value) => {
  return typeof value === "function" && typeof value.getSymbol === "function";
};
var qDev = globalThis.qDev === true;
var EMPTY_ARRAY = [];
var EMPTY_OBJ = {};
if (qDev) {
  Object.freeze(EMPTY_ARRAY);
  Object.freeze(EMPTY_OBJ);
  Error.stackTraceLimit = 9999;
}
[
  "click",
  "dblclick",
  "contextmenu",
  "auxclick",
  "pointerdown",
  "pointerup",
  "pointermove",
  "pointerover",
  "pointerenter",
  "pointerleave",
  "pointerout",
  "pointercancel",
  "gotpointercapture",
  "lostpointercapture",
  "touchstart",
  "touchend",
  "touchmove",
  "touchcancel",
  "mousedown",
  "mouseup",
  "mousemove",
  "mouseenter",
  "mouseleave",
  "mouseover",
  "mouseout",
  "wheel",
  "gesturestart",
  "gesturechange",
  "gestureend",
  "keydown",
  "keyup",
  "keypress",
  "input",
  "change",
  "search",
  "invalid",
  "beforeinput",
  "select",
  "focusin",
  "focusout",
  "focus",
  "blur",
  "submit",
  "reset",
  "scroll"
].map((n) => `on${n.toLowerCase()}$`);
[
  "useWatch$",
  "useClientEffect$",
  "useEffect$",
  "component$",
  "useStyles$",
  "useStylesScoped$"
].map((n) => n.toLowerCase());
function getValidManifest(manifest2) {
  if (manifest2 != null && manifest2.mapping != null && typeof manifest2.mapping === "object" && manifest2.symbols != null && typeof manifest2.symbols === "object" && manifest2.bundles != null && typeof manifest2.bundles === "object") {
    return manifest2;
  }
  return void 0;
}
function workerFetchScript() {
  const fetch2 = `Promise.all(e.data.map(u=>fetch(u))).finally(()=>{setTimeout(postMessage({}),9999)})`;
  const workerBody = `onmessage=(e)=>{${fetch2}}`;
  const blob = `new Blob(['${workerBody}'],{type:"text/javascript"})`;
  const url = `URL.createObjectURL(${blob})`;
  let s = `const w=new Worker(${url});`;
  s += `w.postMessage(u.map(u=>new URL(u,origin)+''));`;
  s += `w.onmessage=()=>{w.terminate()};`;
  return s;
}
function prefetchUrlsEventScript(prefetchResources) {
  const data = {
    bundles: flattenPrefetchResources(prefetchResources).map((u) => u.split("/").pop())
  };
  return `dispatchEvent(new CustomEvent("qprefetch",{detail:${JSON.stringify(data)}}))`;
}
function flattenPrefetchResources(prefetchResources) {
  const urls = [];
  const addPrefetchResource = (prefetchResources2) => {
    if (Array.isArray(prefetchResources2)) {
      for (const prefetchResource of prefetchResources2) {
        if (!urls.includes(prefetchResource.url)) {
          urls.push(prefetchResource.url);
          addPrefetchResource(prefetchResource.imports);
        }
      }
    }
  };
  addPrefetchResource(prefetchResources);
  return urls;
}
function applyPrefetchImplementation(opts, prefetchResources) {
  const { prefetchStrategy } = opts;
  if (prefetchStrategy !== null) {
    const prefetchImpl = normalizePrefetchImplementation(prefetchStrategy == null ? void 0 : prefetchStrategy.implementation);
    const prefetchNodes = [];
    if (prefetchImpl.prefetchEvent === "always") {
      prefetchUrlsEvent(prefetchNodes, prefetchResources);
    }
    if (prefetchImpl.linkInsert === "html-append") {
      linkHtmlImplementation(prefetchNodes, prefetchResources, prefetchImpl);
    }
    if (prefetchImpl.linkInsert === "js-append") {
      linkJsImplementation(prefetchNodes, prefetchResources, prefetchImpl);
    } else if (prefetchImpl.workerFetchInsert === "always") {
      workerFetchImplementation(prefetchNodes, prefetchResources);
    }
    if (prefetchNodes.length > 0) {
      return jsx(Fragment$1, { children: prefetchNodes });
    }
  }
  return null;
}
function prefetchUrlsEvent(prefetchNodes, prefetchResources) {
  prefetchNodes.push(
    jsx("script", {
      type: "module",
      dangerouslySetInnerHTML: prefetchUrlsEventScript(prefetchResources)
    })
  );
}
function linkHtmlImplementation(prefetchNodes, prefetchResources, prefetchImpl) {
  const urls = flattenPrefetchResources(prefetchResources);
  const rel = prefetchImpl.linkRel || "prefetch";
  for (const url of urls) {
    const attributes3 = {};
    attributes3["href"] = url;
    attributes3["rel"] = rel;
    if (rel === "prefetch" || rel === "preload") {
      if (url.endsWith(".js")) {
        attributes3["as"] = "script";
      }
    }
    prefetchNodes.push(jsx("link", attributes3, void 0));
  }
}
function linkJsImplementation(prefetchNodes, prefetchResources, prefetchImpl) {
  const rel = prefetchImpl.linkRel || "prefetch";
  let s = ``;
  if (prefetchImpl.workerFetchInsert === "no-link-support") {
    s += `let supportsLinkRel = true;`;
  }
  s += `const u=${JSON.stringify(flattenPrefetchResources(prefetchResources))};`;
  s += `u.map((u,i)=>{`;
  s += `const l=document.createElement('link');`;
  s += `l.setAttribute("href",u);`;
  s += `l.setAttribute("rel","${rel}");`;
  if (prefetchImpl.workerFetchInsert === "no-link-support") {
    s += `if(i===0){`;
    s += `try{`;
    s += `supportsLinkRel=l.relList.supports("${rel}");`;
    s += `}catch(e){}`;
    s += `}`;
  }
  s += `document.body.appendChild(l);`;
  s += `});`;
  if (prefetchImpl.workerFetchInsert === "no-link-support") {
    s += `if(!supportsLinkRel){`;
    s += workerFetchScript();
    s += `}`;
  }
  if (prefetchImpl.workerFetchInsert === "always") {
    s += workerFetchScript();
  }
  prefetchNodes.push(
    jsx("script", {
      type: "module",
      dangerouslySetInnerHTML: s
    })
  );
}
function workerFetchImplementation(prefetchNodes, prefetchResources) {
  let s = `const u=${JSON.stringify(flattenPrefetchResources(prefetchResources))};`;
  s += workerFetchScript();
  prefetchNodes.push(
    jsx("script", {
      type: "module",
      dangerouslySetInnerHTML: s
    })
  );
}
function normalizePrefetchImplementation(input) {
  if (typeof input === "string") {
    switch (input) {
      case "link-prefetch-html": {
        return {
          linkInsert: "html-append",
          linkRel: "prefetch",
          workerFetchInsert: null,
          prefetchEvent: null
        };
      }
      case "link-prefetch": {
        return {
          linkInsert: "js-append",
          linkRel: "prefetch",
          workerFetchInsert: "no-link-support",
          prefetchEvent: null
        };
      }
      case "link-preload-html": {
        return {
          linkInsert: "html-append",
          linkRel: "preload",
          workerFetchInsert: null,
          prefetchEvent: null
        };
      }
      case "link-preload": {
        return {
          linkInsert: "js-append",
          linkRel: "preload",
          workerFetchInsert: "no-link-support",
          prefetchEvent: null
        };
      }
      case "link-modulepreload-html": {
        return {
          linkInsert: "html-append",
          linkRel: "modulepreload",
          workerFetchInsert: null,
          prefetchEvent: null
        };
      }
      case "link-modulepreload": {
        return {
          linkInsert: "js-append",
          linkRel: "modulepreload",
          workerFetchInsert: "no-link-support",
          prefetchEvent: null
        };
      }
    }
    return {
      linkInsert: null,
      linkRel: null,
      workerFetchInsert: "always",
      prefetchEvent: null
    };
  }
  if (input && typeof input === "object") {
    return input;
  }
  const defaultImplementation = {
    linkInsert: null,
    linkRel: null,
    workerFetchInsert: "always",
    prefetchEvent: null
  };
  return defaultImplementation;
}
var DOCTYPE = "<!DOCTYPE html>";
async function renderToStream(rootNode, opts) {
  var _a2, _b, _c, _d, _e, _f;
  let stream = opts.stream;
  let bufferSize = 0;
  let totalSize = 0;
  let networkFlushes = 0;
  let firstFlushTime = 0;
  const inOrderStreaming = (_b = (_a2 = opts.streaming) == null ? void 0 : _a2.inOrder) != null ? _b : {
    strategy: "auto",
    maximunInitialChunk: 5e4,
    maximunChunk: 3e4
  };
  const containerTagName = (_c = opts.containerTagName) != null ? _c : "html";
  const containerAttributes = (_d = opts.containerAttributes) != null ? _d : {};
  let buffer = "";
  const nativeStream = stream;
  const firstFlushTimer = createTimer();
  function flush() {
    if (buffer) {
      nativeStream.write(buffer);
      buffer = "";
      bufferSize = 0;
      networkFlushes++;
      if (networkFlushes === 1) {
        firstFlushTime = firstFlushTimer();
      }
    }
  }
  function enqueue(chunk) {
    bufferSize += chunk.length;
    totalSize += chunk.length;
    buffer += chunk;
  }
  switch (inOrderStreaming.strategy) {
    case "disabled":
      stream = {
        write: enqueue
      };
      break;
    case "direct":
      stream = nativeStream;
      break;
    case "auto":
      let count = 0;
      let forceFlush = false;
      const minimunChunkSize = (_e = inOrderStreaming.maximunChunk) != null ? _e : 0;
      const initialChunkSize = (_f = inOrderStreaming.maximunInitialChunk) != null ? _f : 0;
      stream = {
        write(chunk) {
          if (chunk === "<!--qkssr-f-->") {
            forceFlush || (forceFlush = true);
          } else if (chunk === "<!--qkssr-pu-->") {
            count++;
          } else if (chunk === "<!--qkssr-po-->") {
            count--;
          } else {
            enqueue(chunk);
          }
          const chunkSize = networkFlushes === 0 ? initialChunkSize : minimunChunkSize;
          if (count === 0 && (forceFlush || bufferSize >= chunkSize)) {
            forceFlush = false;
            flush();
          }
        }
      };
      break;
  }
  if (containerTagName === "html") {
    stream.write(DOCTYPE);
  } else {
    if (opts.qwikLoader) {
      if (opts.qwikLoader.include === void 0) {
        opts.qwikLoader.include = "never";
      }
      if (opts.qwikLoader.position === void 0) {
        opts.qwikLoader.position = "bottom";
      }
    } else {
      opts.qwikLoader = {
        include: "never"
      };
    }
  }
  if (!opts.manifest) {
    console.warn("Missing client manifest, loading symbols in the client might 404");
  }
  const buildBase = getBuildBase(opts);
  const resolvedManifest = resolveManifest(opts.manifest);
  await setServerPlatform(opts, resolvedManifest);
  let prefetchResources = [];
  let snapshotResult = null;
  const injections = resolvedManifest == null ? void 0 : resolvedManifest.manifest.injections;
  const beforeContent = injections ? injections.map((injection) => {
    var _a3;
    return jsx(injection.tag, (_a3 = injection.attributes) != null ? _a3 : EMPTY_OBJ);
  }) : void 0;
  const renderTimer = createTimer();
  const renderSymbols = [];
  let renderTime = 0;
  let snapshotTime = 0;
  await renderSSR(rootNode, {
    stream,
    containerTagName,
    containerAttributes,
    envData: opts.envData,
    base: buildBase,
    beforeContent,
    beforeClose: async (contexts, containerState) => {
      var _a3, _b2, _c2;
      renderTime = renderTimer();
      const snapshotTimer = createTimer();
      snapshotResult = await _pauseFromContexts(contexts, containerState);
      prefetchResources = getPrefetchResources(snapshotResult, opts, resolvedManifest);
      const jsonData = JSON.stringify(snapshotResult.state, void 0, qDev ? "  " : void 0);
      const children3 = [
        jsx("script", {
          type: "qwik/json",
          dangerouslySetInnerHTML: escapeText(jsonData)
        })
      ];
      if (prefetchResources.length > 0) {
        children3.push(applyPrefetchImplementation(opts, prefetchResources));
      }
      const needLoader = !snapshotResult || snapshotResult.mode !== "static";
      const includeMode = (_b2 = (_a3 = opts.qwikLoader) == null ? void 0 : _a3.include) != null ? _b2 : "auto";
      const includeLoader = includeMode === "always" || includeMode === "auto" && needLoader;
      if (includeLoader) {
        const qwikLoaderScript = getQwikLoaderScript({
          events: (_c2 = opts.qwikLoader) == null ? void 0 : _c2.events,
          debug: opts.debug
        });
        children3.push(
          jsx("script", {
            id: "qwikloader",
            dangerouslySetInnerHTML: qwikLoaderScript
          })
        );
      }
      const uniqueListeners = /* @__PURE__ */ new Set();
      snapshotResult.listeners.forEach((li) => {
        uniqueListeners.add(JSON.stringify(li.eventName));
      });
      const extraListeners = Array.from(uniqueListeners);
      if (extraListeners.length > 0) {
        let content = `window.qwikevents.push(${extraListeners.join(", ")})`;
        if (!includeLoader) {
          content = `window.qwikevents||=[];${content}`;
        }
        children3.push(
          jsx("script", {
            dangerouslySetInnerHTML: content
          })
        );
      }
      collectRenderSymbols(renderSymbols, contexts);
      snapshotTime = snapshotTimer();
      return jsx(Fragment$1, { children: children3 });
    }
  });
  flush();
  const result = {
    prefetchResources: void 0,
    snapshotResult,
    flushes: networkFlushes,
    manifest: resolvedManifest == null ? void 0 : resolvedManifest.manifest,
    size: totalSize,
    timing: {
      render: renderTime,
      snapshot: snapshotTime,
      firstFlush: firstFlushTime
    },
    _symbols: renderSymbols
  };
  return result;
}
function resolveManifest(manifest2) {
  if (!manifest2) {
    return void 0;
  }
  if ("mapper" in manifest2) {
    return manifest2;
  }
  manifest2 = getValidManifest(manifest2);
  if (manifest2) {
    const mapper = {};
    Object.entries(manifest2.mapping).forEach(([key, value]) => {
      mapper[getSymbolHash(key)] = [key, value];
    });
    return {
      mapper,
      manifest: manifest2
    };
  }
  return void 0;
}
var escapeText = (str) => {
  return str.replace(/<(\/?script)/g, "\\x3C$1");
};
function collectRenderSymbols(renderSymbols, elements) {
  var _a2;
  for (const ctx of elements) {
    const symbol = (_a2 = ctx.$renderQrl$) == null ? void 0 : _a2.getSymbol();
    if (symbol && !renderSymbols.includes(symbol)) {
      renderSymbols.push(symbol);
    }
  }
}
const manifest = { "symbols": { "s_RzhhZa265Yg": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderBlocks_component_div_onClick", "canonicalFilename": "s_rzhhza265yg", "hash": "RzhhZa265Yg", "ctxKind": "event", "ctxName": "onClick$", "captures": true, "parent": "s_MYUZ0j1uLsw" }, "s_hA9UPaY8sNQ": { "origin": "../node_modules/@builder.io/qwik-city/index.qwik.mjs", "displayName": "Link_component_a_onClick", "canonicalFilename": "s_ha9upay8snq", "hash": "hA9UPaY8sNQ", "ctxKind": "event", "ctxName": "onClick$", "captures": true, "parent": "s_mYsiJcA4IBc" }, "s_wLg5o3ZkpC0": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderContent_component__Fragment_div_onClick", "canonicalFilename": "s_wlg5o3zkpc0", "hash": "wLg5o3ZkpC0", "ctxKind": "event", "ctxName": "onClick$", "captures": true, "parent": "s_hEAI0ahViXM" }, "s_nG7I7RYG3JQ": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderBlocks_component_div_onMouseEnter", "canonicalFilename": "s_ng7i7ryg3jq", "hash": "nG7I7RYG3JQ", "ctxKind": "event", "ctxName": "onMouseEnter$", "captures": true, "parent": "s_MYUZ0j1uLsw" }, "s_skxgNVWVOT8": { "origin": "../node_modules/@builder.io/qwik-city/index.qwik.mjs", "displayName": "Link_component_a_onMouseOver", "canonicalFilename": "s_skxgnvwvot8", "hash": "skxgNVWVOT8", "ctxKind": "event", "ctxName": "onMouseOver$", "captures": false, "parent": "s_mYsiJcA4IBc" }, "s_uVE5iM9H73c": { "origin": "../node_modules/@builder.io/qwik-city/index.qwik.mjs", "displayName": "Link_component_a_onQVisible", "canonicalFilename": "s_uve5im9h73c", "hash": "uVE5iM9H73c", "ctxKind": "event", "ctxName": "onQVisible$", "captures": false, "parent": "s_mYsiJcA4IBc" }, "s_9HNT04zd0Dk": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Symbol_component_useWatch", "canonicalFilename": "s_9hnt04zd0dk", "hash": "9HNT04zd0Dk", "ctxKind": "function", "ctxName": "useWatch$", "captures": true, "parent": "s_WVvggdkUPdk" }, "s_AaAlzKH0KlQ": { "origin": "../node_modules/@builder.io/qwik-city/index.qwik.mjs", "displayName": "QwikCity_component_useWatch", "canonicalFilename": "s_aaalzkh0klq", "hash": "AaAlzKH0KlQ", "ctxKind": "function", "ctxName": "useWatch$", "captures": true, "parent": "s_z1nvHyEppoI" }, "s_AxgWjrHdlAI": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Embed_component_useWatch", "canonicalFilename": "s_axgwjrhdlai", "hash": "AxgWjrHdlAI", "ctxKind": "function", "ctxName": "useWatch$", "captures": true, "parent": "s_Uji08ORjXbE" }, "s_LQM67VNl14k": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderContent_component_useWatch_1", "canonicalFilename": "s_lqm67vnl14k", "hash": "LQM67VNl14k", "ctxKind": "function", "ctxName": "useWatch$", "captures": true, "parent": "s_hEAI0ahViXM" }, "s_OIBatobA0hE": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderContent_component_useWatch", "canonicalFilename": "s_oibatoba0he", "hash": "OIBatobA0hE", "ctxKind": "function", "ctxName": "useWatch$", "captures": true, "parent": "s_hEAI0ahViXM" }, "s_aGi0RpYNBO0": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderContent_component_useWatch_2", "canonicalFilename": "s_agi0rpynbo0", "hash": "aGi0RpYNBO0", "ctxKind": "function", "ctxName": "useWatch$", "captures": true, "parent": "s_hEAI0ahViXM" }, "s_4w4c951ufB4": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "CustomCode_component_useClientEffect", "canonicalFilename": "s_4w4c951ufb4", "hash": "4w4c951ufB4", "ctxKind": "function", "ctxName": "useClientEffect$", "captures": true, "parent": "s_uYOSy7w7Zqw" }, "s_Kfc9q3nzeSQ": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Symbol_component_useClientEffect", "canonicalFilename": "s_kfc9q3nzesq", "hash": "Kfc9q3nzeSQ", "ctxKind": "function", "ctxName": "useClientEffect$", "captures": true, "parent": "s_WVvggdkUPdk" }, "s_cA0sVHIkr5g": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderContent_component_useClientEffect", "canonicalFilename": "s_ca0svhikr5g", "hash": "cA0sVHIkr5g", "ctxKind": "function", "ctxName": "useClientEffect$", "captures": true, "parent": "s_hEAI0ahViXM" }, "s_15p0cKUxgIE": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Text_component", "canonicalFilename": "s_15p0ckuxgie", "hash": "15p0cKUxgIE", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_3sccYCDd1Z0": { "origin": "root.tsx", "displayName": "root_component", "canonicalFilename": "s_3sccycdd1z0", "hash": "3sccYCDd1Z0", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_7yLj4bxdI6c": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Columns_component", "canonicalFilename": "s_7ylj4bxdi6c", "hash": "7yLj4bxdI6c", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_FXvIDBSffO8": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "ImgComponent_component", "canonicalFilename": "s_fxvidbsffo8", "hash": "FXvIDBSffO8", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_LRxDkFa1EfU": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Image_component", "canonicalFilename": "s_lrxdkfa1efu", "hash": "LRxDkFa1EfU", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_MYUZ0j1uLsw": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderBlocks_component", "canonicalFilename": "s_myuz0j1ulsw", "hash": "MYUZ0j1uLsw", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_Og0xL34Zbvc": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderContentStyles_component", "canonicalFilename": "s_og0xl34zbvc", "hash": "Og0xL34Zbvc", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_T0AypnadAK0": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "FragmentComponent_component", "canonicalFilename": "s_t0aypnadak0", "hash": "T0AypnadAK0", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_Uji08ORjXbE": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Embed_component", "canonicalFilename": "s_uji08orjxbe", "hash": "Uji08ORjXbE", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_VkLNXphUh5s": { "origin": "routes/layout.tsx", "displayName": "layout_component", "canonicalFilename": "s_vklnxphuh5s", "hash": "VkLNXphUh5s", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_WVvggdkUPdk": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Symbol_component", "canonicalFilename": "s_wvvggdkupdk", "hash": "WVvggdkUPdk", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_ZWF9iD5WeLg": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "SectionComponent_component", "canonicalFilename": "s_zwf9id5welg", "hash": "ZWF9iD5WeLg", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_ceU05TscGYE": { "origin": "components/header/header.tsx", "displayName": "header_component", "canonicalFilename": "s_ceu05tscgye", "hash": "ceU05TscGYE", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_gJoMUICXoUQ": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Button_component", "canonicalFilename": "s_gjomuicxouq", "hash": "gJoMUICXoUQ", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_hEAI0ahViXM": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderContent_component", "canonicalFilename": "s_heai0ahvixm", "hash": "hEAI0ahViXM", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_mYsiJcA4IBc": { "origin": "../node_modules/@builder.io/qwik-city/index.qwik.mjs", "displayName": "Link_component", "canonicalFilename": "s_mysijca4ibc", "hash": "mYsiJcA4IBc", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_nRyVBtbGKc8": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderRepeatedBlock_component", "canonicalFilename": "s_nryvbtbgkc8", "hash": "nRyVBtbGKc8", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_nd8yk3KO22c": { "origin": "../node_modules/@builder.io/qwik-city/index.qwik.mjs", "displayName": "RouterOutlet_component", "canonicalFilename": "s_nd8yk3ko22c", "hash": "nd8yk3KO22c", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_qdcTZflYyoQ": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Video_component", "canonicalFilename": "s_qdctzflyyoq", "hash": "qdcTZflYyoQ", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_uYOSy7w7Zqw": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "CustomCode_component", "canonicalFilename": "s_uyosy7w7zqw", "hash": "uYOSy7w7Zqw", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_xYL1qOwPyDI": { "origin": "routes/index.tsx", "displayName": "routes_component", "canonicalFilename": "s_xyl1qowpydi", "hash": "xYL1qOwPyDI", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_y9hqf93u3Hs": { "origin": "routes/[page]/index.tsx", "displayName": "_page__component", "canonicalFilename": "s_y9hqf93u3hs", "hash": "y9hqf93u3Hs", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_z1nvHyEppoI": { "origin": "../node_modules/@builder.io/qwik-city/index.qwik.mjs", "displayName": "QwikCity_component", "canonicalFilename": "s_z1nvhyeppoi", "hash": "z1nvHyEppoI", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_zrbrqoaqXSY": { "origin": "components/router-head/router-head.tsx", "displayName": "RouterHead_component", "canonicalFilename": "s_zrbrqoaqxsy", "hash": "zrbrqoaqXSY", "ctxKind": "function", "ctxName": "component$", "captures": false, "parent": null }, "s_0XKYzaR059E": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderBlocks_component_useStylesScoped", "canonicalFilename": "s_0xkyzar059e", "hash": "0XKYzaR059E", "ctxKind": "function", "ctxName": "useStylesScoped$", "captures": false, "parent": "s_MYUZ0j1uLsw" }, "s_N39ca0w8E8Y": { "origin": "components/header/header.tsx", "displayName": "header_component_useStylesScoped", "canonicalFilename": "s_n39ca0w8e8y", "hash": "N39ca0w8E8Y", "ctxKind": "function", "ctxName": "useStylesScoped$", "captures": false, "parent": "s_ceU05TscGYE" }, "s_a1JZ0Q0Q2Oc": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Button_component_useStylesScoped", "canonicalFilename": "s_a1jz0q0q2oc", "hash": "a1JZ0Q0Q2Oc", "ctxKind": "function", "ctxName": "useStylesScoped$", "captures": false, "parent": "s_gJoMUICXoUQ" }, "s_fBMYiVf9fuU": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Image_component_useStylesScoped", "canonicalFilename": "s_fbmyivf9fuu", "hash": "fBMYiVf9fuU", "ctxKind": "function", "ctxName": "useStylesScoped$", "captures": false, "parent": "s_LRxDkFa1EfU" }, "s_s7JLZz7MCCQ": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "Columns_component_useStylesScoped", "canonicalFilename": "s_s7jlzz7mccq", "hash": "s7JLZz7MCCQ", "ctxKind": "function", "ctxName": "useStylesScoped$", "captures": false, "parent": "s_7yLj4bxdI6c" }, "s_wgxT8Hlq4s8": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "crateEventHandler", "canonicalFilename": "s_wgxt8hlq4s8", "hash": "wgxT8Hlq4s8", "ctxKind": "function", "ctxName": "crateEventHandler", "captures": true, "parent": null }, "s_DVD34gdl1HI": { "origin": "routes/index.tsx", "displayName": "routes_component_builderContentRsrc_useResource", "canonicalFilename": "s_dvd34gdl1hi", "hash": "DVD34gdl1HI", "ctxKind": "function", "ctxName": "useResource$", "captures": true, "parent": "s_xYL1qOwPyDI" }, "s_FwcO310HVAI": { "origin": "../node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs", "displayName": "RenderContent_component_useCleanup", "canonicalFilename": "s_fwco310hvai", "hash": "FwcO310HVAI", "ctxKind": "function", "ctxName": "useCleanup$", "captures": true, "parent": "s_hEAI0ahViXM" }, "s_OResyzSVj0k": { "origin": "routes/[page]/index.tsx", "displayName": "_page__component_builderContentRsrc_useResource", "canonicalFilename": "s_oresyzsvj0k", "hash": "OResyzSVj0k", "ctxKind": "function", "ctxName": "useResource$", "captures": true, "parent": "s_y9hqf93u3Hs" }, "s_Yh2ETpAUYws": { "origin": "routes/[page]/index.tsx", "displayName": "_page__component_useServerMount", "canonicalFilename": "s_yh2etpauyws", "hash": "Yh2ETpAUYws", "ctxKind": "function", "ctxName": "useServerMount$", "captures": true, "parent": "s_y9hqf93u3Hs" }, "s_dNJ5Ezd0No0": { "origin": "routes/index.tsx", "displayName": "routes_component_useServerMount", "canonicalFilename": "s_dnj5ezd0no0", "hash": "dNJ5Ezd0No0", "ctxKind": "function", "ctxName": "useServerMount$", "captures": true, "parent": "s_xYL1qOwPyDI" } }, "mapping": { "s_RzhhZa265Yg": "q-df7bae81.js", "s_hA9UPaY8sNQ": "q-bfd22447.js", "s_wLg5o3ZkpC0": "q-cdc58d10.js", "s_nG7I7RYG3JQ": "q-df7bae81.js", "s_skxgNVWVOT8": "q-bfd22447.js", "s_uVE5iM9H73c": "q-bfd22447.js", "s_9HNT04zd0Dk": "q-0ac7294a.js", "s_AaAlzKH0KlQ": "q-98da734c.js", "s_AxgWjrHdlAI": "q-c3604921.js", "s_LQM67VNl14k": "q-cdc58d10.js", "s_OIBatobA0hE": "q-cdc58d10.js", "s_aGi0RpYNBO0": "q-cdc58d10.js", "s_4w4c951ufB4": "q-459c339f.js", "s_Kfc9q3nzeSQ": "q-0ac7294a.js", "s_cA0sVHIkr5g": "q-cdc58d10.js", "s_15p0cKUxgIE": "q-7ecc5fe7.js", "s_3sccYCDd1Z0": "q-75f10292.js", "s_7yLj4bxdI6c": "q-6598c03a.js", "s_FXvIDBSffO8": "q-57c6bbb1.js", "s_LRxDkFa1EfU": "q-52100207.js", "s_MYUZ0j1uLsw": "q-df7bae81.js", "s_Og0xL34Zbvc": "q-d3b1d9bd.js", "s_T0AypnadAK0": "q-78ca764d.js", "s_Uji08ORjXbE": "q-c3604921.js", "s_VkLNXphUh5s": "q-cc9a8ec3.js", "s_WVvggdkUPdk": "q-0ac7294a.js", "s_ZWF9iD5WeLg": "q-999fee39.js", "s_ceU05TscGYE": "q-d0b1dc17.js", "s_gJoMUICXoUQ": "q-4c2112b8.js", "s_hEAI0ahViXM": "q-cdc58d10.js", "s_mYsiJcA4IBc": "q-bfd22447.js", "s_nRyVBtbGKc8": "q-324620e0.js", "s_nd8yk3KO22c": "q-4762fef9.js", "s_qdcTZflYyoQ": "q-4bb22124.js", "s_uYOSy7w7Zqw": "q-459c339f.js", "s_xYL1qOwPyDI": "q-1834647b.js", "s_y9hqf93u3Hs": "q-dd2bcffe.js", "s_z1nvHyEppoI": "q-98da734c.js", "s_zrbrqoaqXSY": "q-ce6eccdb.js", "s_0XKYzaR059E": "q-df7bae81.js", "s_N39ca0w8E8Y": "q-d0b1dc17.js", "s_a1JZ0Q0Q2Oc": "q-4c2112b8.js", "s_fBMYiVf9fuU": "q-52100207.js", "s_s7JLZz7MCCQ": "q-6598c03a.js", "s_wgxT8Hlq4s8": "q-7d91b4ef.js", "s_DVD34gdl1HI": "q-1834647b.js", "s_FwcO310HVAI": "q-cdc58d10.js", "s_OResyzSVj0k": "q-dd2bcffe.js", "s_Yh2ETpAUYws": "q-2ae821b6.js", "s_dNJ5Ezd0No0": "q-2ae821b6.js" }, "bundles": { "q-047b3a98.js": { "size": 435, "imports": ["q-c06ffb54.js"], "dynamicImports": ["q-0d3c3839.js", "q-5ea45ce3.js", "q-92f0ee90.js", "q-ca65ccf1.js"], "origins": ["@qwik-city-plan"] }, "q-0ac7294a.js": { "size": 1307, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_Symbol1.js", "src/s_9hnt04zd0dk.js", "src/s_kfc9q3nzesq.js", "src/s_wvvggdkupdk.js"], "symbols": ["s_9HNT04zd0Dk", "s_Kfc9q3nzeSQ", "s_WVvggdkUPdk"] }, "q-0d3c3839.js": { "size": 158, "imports": ["q-c06ffb54.js"], "dynamicImports": ["q-cc9a8ec3.js"], "origins": ["src/routes/layout.js"] }, "q-143c7194.js": { "size": 2180, "origins": ["node_modules/@builder.io/qwik-city/service-worker.mjs", "src/routes/service-worker.js"] }, "q-1834647b.js": { "size": 1174, "imports": ["q-75f10292.js", "q-b20aae78.js", "q-c06ffb54.js", "q-ca65ccf1.js"], "dynamicImports": ["q-2ae821b6.js"], "origins": ["src/entry_routes.js", "src/s_dvd34gdl1hi.js", "src/s_xyl1qowpydi.js"], "symbols": ["s_DVD34gdl1HI", "s_xYL1qOwPyDI"] }, "q-2ae821b6.js": { "size": 218, "imports": ["q-c06ffb54.js"], "origins": ["src/entry_server.js", "src/s_dnj5ezd0no0.js", "src/s_yh2etpauyws.js"], "symbols": ["s_dNJ5Ezd0No0", "s_Yh2ETpAUYws"] }, "q-324620e0.js": { "size": 409, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_RenderRepeatedBlock.js", "src/s_nryvbtbgkc8.js"], "symbols": ["s_nRyVBtbGKc8"] }, "q-459c339f.js": { "size": 653, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_CustomCode.js", "src/s_4w4c951ufb4.js", "src/s_uyosy7w7zqw.js"], "symbols": ["s_4w4c951ufB4", "s_uYOSy7w7Zqw"] }, "q-4762fef9.js": { "size": 269, "imports": ["q-75f10292.js", "q-c06ffb54.js"], "origins": ["src/entry_RouterOutlet.js", "src/s_nd8yk3ko22c.js"], "symbols": ["s_nd8yk3KO22c"] }, "q-4bb22124.js": { "size": 323, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_Video.js", "src/s_qdctzflyyoq.js"], "symbols": ["s_qdcTZflYyoQ"] }, "q-4c2112b8.js": { "size": 571, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_Button.js", "src/s_a1jz0q0q2oc.js", "src/s_gjomuicxouq.js"], "symbols": ["s_a1JZ0Q0Q2Oc", "s_gJoMUICXoUQ"] }, "q-52100207.js": { "size": 1173, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_Image.js", "src/s_fbmyivf9fuu.js", "src/s_lrxdkfa1efu.js"], "symbols": ["s_fBMYiVf9fuU", "s_LRxDkFa1EfU"] }, "q-57c6bbb1.js": { "size": 293, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_ImgComponent.js", "src/s_fxvidbsffo8.js"], "symbols": ["s_FXvIDBSffO8"] }, "q-5ea45ce3.js": { "size": 251, "imports": ["q-c06ffb54.js"], "dynamicImports": ["q-dd2bcffe.js"], "origins": ["src/routes/[page]/index.js"] }, "q-6598c03a.js": { "size": 776, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_Columns.js", "src/s_7ylj4bxdi6c.js", "src/s_s7jlzz7mccq.js"], "symbols": ["s_7yLj4bxdI6c", "s_s7JLZz7MCCQ"] }, "q-75f10292.js": { "size": 4421, "imports": ["q-c06ffb54.js"], "dynamicImports": ["q-047b3a98.js", "q-4762fef9.js", "q-98da734c.js", "q-bfd22447.js", "q-ce6eccdb.js"], "origins": ["node_modules/@builder.io/qwik-city/index.qwik.mjs", "src/components/router-head/router-head.js", "src/entry_root.js", "src/s_3sccycdd1z0.js"], "symbols": ["s_3sccYCDd1Z0"] }, "q-78ca764d.js": { "size": 111, "imports": ["q-c06ffb54.js"], "origins": ["src/entry_FragmentComponent.js", "src/s_t0aypnadak0.js"], "symbols": ["s_T0AypnadAK0"] }, "q-7d91b4ef.js": { "size": 182, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_crateEventHandler.js", "src/s_wgxt8hlq4s8.js"], "symbols": ["s_wgxT8Hlq4s8"] }, "q-7ecc5fe7.js": { "size": 139, "imports": ["q-c06ffb54.js"], "origins": ["src/entry_Text.js", "src/s_15p0ckuxgie.js"], "symbols": ["s_15p0cKUxgIE"] }, "q-92f0ee90.js": { "size": 128, "imports": ["q-c06ffb54.js"], "dynamicImports": ["q-143c7194.js"], "origins": ["@qwik-city-entries"] }, "q-98da734c.js": { "size": 1489, "imports": ["q-75f10292.js", "q-c06ffb54.js"], "dynamicImports": ["q-047b3a98.js"], "origins": ["@builder.io/qwik/build", "src/entry_QwikCity.js", "src/s_aaalzkh0klq.js", "src/s_z1nvhyeppoi.js"], "symbols": ["s_AaAlzKH0KlQ", "s_z1nvHyEppoI"] }, "q-999fee39.js": { "size": 198, "imports": ["q-c06ffb54.js"], "origins": ["src/entry_SectionComponent.js", "src/s_zwf9id5welg.js"], "symbols": ["s_ZWF9iD5WeLg"] }, "q-b20aae78.js": { "size": 34428, "imports": ["q-c06ffb54.js"], "dynamicImports": ["q-0ac7294a.js", "q-324620e0.js", "q-459c339f.js", "q-4bb22124.js", "q-4c2112b8.js", "q-52100207.js", "q-57c6bbb1.js", "q-6598c03a.js", "q-78ca764d.js", "q-7d91b4ef.js", "q-7ecc5fe7.js", "q-999fee39.js", "q-c3604921.js", "q-cdc58d10.js", "q-d3b1d9bd.js", "q-df7bae81.js"], "origins": ["node_modules/@builder.io/sdk-qwik/lib/index.qwik.mjs"] }, "q-bb1f3941.js": { "size": 58, "imports": ["q-c06ffb54.js"] }, "q-bfd22447.js": { "size": 886, "imports": ["q-75f10292.js", "q-c06ffb54.js"], "origins": ["src/entry_Link.js", "src/s_ha9upay8snq.js", "src/s_mysijca4ibc.js", "src/s_skxgnvwvot8.js", "src/s_uve5im9h73c.js"], "symbols": ["s_hA9UPaY8sNQ", "s_mYsiJcA4IBc", "s_skxgNVWVOT8", "s_uVE5iM9H73c"] }, "q-c06ffb54.js": { "size": 37351, "dynamicImports": ["q-75f10292.js"], "origins": ["\0vite/preload-helper", "node_modules/@builder.io/qwik/core.min.mjs", "src/global.css", "src/root.js"] }, "q-c3604921.js": { "size": 689, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_Embed.js", "src/s_axgwjrhdlai.js", "src/s_uji08orjxbe.js"], "symbols": ["s_AxgWjrHdlAI", "s_Uji08ORjXbE"] }, "q-ca65ccf1.js": { "size": 251, "imports": ["q-c06ffb54.js"], "dynamicImports": ["q-1834647b.js"], "origins": ["src/routes/index.js"] }, "q-cc9a8ec3.js": { "size": 369, "imports": ["q-c06ffb54.js"], "dynamicImports": ["q-d0b1dc17.js"], "origins": ["src/components/header/header.js", "src/entry_layout.js", "src/s_vklnxphuh5s.js"], "symbols": ["s_VkLNXphUh5s"] }, "q-cdc58d10.js": { "size": 3095, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_RenderContent.js", "src/s_agi0rpynbo0.js", "src/s_ca0svhikr5g.js", "src/s_fwco310hvai.js", "src/s_heai0ahvixm.js", "src/s_lqm67vnl14k.js", "src/s_oibatoba0he.js", "src/s_wlg5o3zkpc0.js"], "symbols": ["s_aGi0RpYNBO0", "s_cA0sVHIkr5g", "s_FwcO310HVAI", "s_hEAI0ahViXM", "s_LQM67VNl14k", "s_OIBatobA0hE", "s_wLg5o3ZkpC0"] }, "q-ce6eccdb.js": { "size": 909, "imports": ["q-75f10292.js", "q-c06ffb54.js"], "origins": ["src/entry_RouterHead.js", "src/s_zrbrqoaqxsy.js"], "symbols": ["s_zrbrqoaqXSY"] }, "q-d0b1dc17.js": { "size": 4133, "imports": ["q-c06ffb54.js"], "origins": ["src/components/header/header.css?used&inline", "src/components/icons/qwik.js", "src/entry_header.js", "src/s_ceu05tscgye.js", "src/s_n39ca0w8e8y.js"], "symbols": ["s_ceU05TscGYE", "s_N39ca0w8E8Y"] }, "q-d3b1d9bd.js": { "size": 150, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_RenderContentStyles.js", "src/s_og0xl34zbvc.js"], "symbols": ["s_Og0xL34Zbvc"] }, "q-dd2bcffe.js": { "size": 1174, "imports": ["q-5ea45ce3.js", "q-75f10292.js", "q-b20aae78.js", "q-c06ffb54.js"], "dynamicImports": ["q-2ae821b6.js"], "origins": ["src/entry__page_.js", "src/s_oresyzsvj0k.js", "src/s_y9hqf93u3hs.js"], "symbols": ["s_OResyzSVj0k", "s_y9hqf93u3Hs"] }, "q-df7bae81.js": { "size": 1106, "imports": ["q-b20aae78.js", "q-c06ffb54.js"], "origins": ["src/entry_RenderBlocks.js", "src/s_0xkyzar059e.js", "src/s_myuz0j1ulsw.js", "src/s_ng7i7ryg3jq.js", "src/s_rzhhza265yg.js"], "symbols": ["s_0XKYzaR059E", "s_MYUZ0j1uLsw", "s_nG7I7RYG3JQ", "s_RzhhZa265Yg"] } }, "injections": [], "version": "1", "options": { "target": "client", "buildMode": "production", "forceFullBuild": true, "entryStrategy": { "type": "smart" } }, "platform": { "qwik": "0.9.0", "vite": "", "rollup": "2.78.1", "env": "node", "os": "darwin", "node": "16.17.0" } };
const RouterHead = /* @__PURE__ */ componentQrl(inlinedQrl(() => {
  const head = useDocumentHead();
  const loc = useLocation();
  return /* @__PURE__ */ jsx(Fragment$1, {
    children: [
      /* @__PURE__ */ jsx("title", {
        children: head.title
      }),
      /* @__PURE__ */ jsx("link", {
        rel: "canonical",
        href: loc.href
      }),
      /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0"
      }),
      /* @__PURE__ */ jsx("link", {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg"
      }),
      /* @__PURE__ */ jsx("link", {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      }),
      /* @__PURE__ */ jsx("link", {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: ""
      }),
      /* @__PURE__ */ jsx("link", {
        href: "https://fonts.googleapis.com/css2?family=Poppins&display=swap",
        rel: "stylesheet"
      }),
      /* @__PURE__ */ jsx("meta", {
        property: "og:site_name",
        content: "Qwik"
      }),
      /* @__PURE__ */ jsx("meta", {
        name: "twitter:site",
        content: "@QwikDev"
      }),
      /* @__PURE__ */ jsx("meta", {
        name: "twitter:title",
        content: "Qwik"
      }),
      head.meta.map((m) => /* @__PURE__ */ jsx("meta", {
        ...m
      })),
      head.links.map((l) => /* @__PURE__ */ jsx("link", {
        ...l
      })),
      head.styles.map((s) => /* @__PURE__ */ jsx("style", {
        ...s.props,
        dangerouslySetInnerHTML: s.style
      }))
    ]
  });
}, "s_zrbrqoaqXSY"));
const global$1 = "";
const Root = /* @__PURE__ */ componentQrl(inlinedQrl(() => {
  return /* @__PURE__ */ jsx(QwikCity, {
    children: [
      /* @__PURE__ */ jsx("head", {
        children: [
          /* @__PURE__ */ jsx("meta", {
            charSet: "utf-8"
          }),
          /* @__PURE__ */ jsx(RouterHead, {})
        ]
      }),
      /* @__PURE__ */ jsx("body", {
        lang: "en",
        children: [
          /* @__PURE__ */ jsx(RouterOutlet, {}),
          /* @__PURE__ */ jsx(ServiceWorkerRegister, {})
        ]
      })
    ]
  });
}, "s_3sccYCDd1Z0"));
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a2, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a2, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a2, prop, b[prop]);
    }
  return a2;
};
var __spreadProps = (a2, b) => __defProps(a2, __getOwnPropDescs(b));
function render(opts) {
  return renderToStream(/* @__PURE__ */ jsx(Root, {}), __spreadProps(__spreadValues({
    manifest
  }, opts), {
    prefetchStrategy: {
      implementation: {
        linkInsert: null,
        workerFetchInsert: null,
        prefetchEvent: "always"
      }
    }
  }));
}
const qwikCityHandler = qwikCity(render);
export {
  qwikCityHandler as default
};
