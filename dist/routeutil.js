// src/routeutil.js
function escapeRegex(val) {
  return val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function route(segments, ...values) {
  const buf = [];
  for (let i = 0; i < segments.length; i++) {
    buf.push(escapeRegex(segments[i]));
    const val = values[i];
    if (typeof val === "string") buf.push(escapeRegex(val));
    else if (val instanceof RegExp) buf.push(val.source);
  }
  if (!buf[0].startsWith("#/")) {
    throw new Error(`Routes must start with "#/"; route is ${buf.join("")}`);
  }
  return new RegExp(`^${buf.join("")}$`);
}
function param(name) {
  return new RegExp(`(?<${name}>\\w+)`);
}
var Router = class {
  /** @type {Map<RouteDef, RouteHandler>} */
  #handlers = /* @__PURE__ */ new Map();
  /** @type {RouteHandler | undefined} */
  #fallbackHandler = void 0;
  /** @type {RouteHandler | undefined} */
  #afterEachHandler = void 0;
  /** @type {string | undefined} */
  #startAt = void 0;
  #controller = new AbortController();
  /**
   * @param {object} [opts]
   * @param {string} [opts.startAt] If set, the router will initially navigate
   *  to the specified path if the locations' hash is empty when the router
   *  connects.
   */
  constructor(opts) {
    this.#startAt = opts?.startAt;
  }
  /**
   * Performs the initial routing after the routes have been initialized.
   *
   * @returns {Router} The router instance for chaining
   */
  connect() {
    addEventListener(
      "popstate",
      () => {
        this.#exec();
      },
      { signal: this.#controller.signal }
    );
    if (this.#startAt && !location.hash) location.hash = this.#startAt;
    else this.#exec();
    return this;
  }
  /**
   * Stops route handling. Note that it cannot be restarted, you will need to
   * create a new router if you need it again.
   */
  disconnect() {
    this.#controller.abort();
  }
  /**
   * Adds a new route handler. If an identical handler already exists, the
   * existing handler is replaced.
   *
   * @param {RouteDef | RouteDef[]} route Path of the route
   * @param {RouteHandler} handler Function to be called when the route is matched
   * @returns {Router} The router instance for chaining
   */
  on(route2, handler) {
    const routeArr = Array.isArray(route2) ? route2 : [route2];
    routeArr.forEach((i) => this.#handlers.set(i, handler));
    return this;
  }
  /**
   * Removes an existing route handler.
   *
   * @param {RouteDef | RouteDef[]} route
   * @returns {Router} The router instance for chaining
   */
  off(route2) {
    const routeArr = Array.isArray(route2) ? route2 : [route2];
    routeArr.forEach((i) => this.#handlers.delete(i));
    return this;
  }
  /**
   * This handler will be called if no route matches.
   *
   * @param {RouteHandler} handler
   * @returns {Router} The router instance for chaining
   */
  fallback(handler) {
    this.#fallbackHandler = handler;
    return this;
  }
  /**
   * This handler will be called after any navigation (including when no route
   * matched).
   *
   * @param {RouteHandler} handler
   * @returns {Router} The router instance for chaining
   */
  afterEach(handler) {
    this.#afterEachHandler = handler;
    return this;
  }
  /**
   * Parses the URL to a route and runs handler associated with the route.
   *
   * @param {string} [url] The new URL. Defaults to `location.hash`.
   */
  #exec(url = location.hash) {
    let route2, handler, match, params;
    for (const [k, v] of this.#handlers.entries()) {
      if (typeof k === "string" && url === k) {
        handler = v;
      } else if (k instanceof RegExp && (match = url.match(k))) {
        params = { ...match.groups };
        handler = v;
      }
      if (handler) {
        route2 = k;
        break;
      }
    }
    const resolved = { url, params: params ?? {}, route: route2 };
    (handler ?? this.#fallbackHandler)?.(resolved);
    this.#afterEachHandler?.(resolved);
  }
};
export {
  Router as default,
  param,
  route
};
