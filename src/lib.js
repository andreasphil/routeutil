//  @ts-check

/* -------------------------------------------------- *
 * Types                                              *
 * -------------------------------------------------- */

/**
 * Defines a route for adding it to the router.
 *
 * @typedef {string | RegExp} RouteDef
 */

/**
 * Contains information about a resolved route.
 *
 * @typedef {object} ResolvedRoute
 * @prop {string} url The raw URL
 * @prop {RouteDef} [route] The matched route. Can be `undefined` if no route
 *  has matched the URL, typically when the fallback is active.
 * @prop {Record<string, string>} params The parameters extracted from the route
 */

/**
 * A callback that is run when a route is matched.
 *
 * @callback RouteHandler
 * @param {ResolvedRoute} resolved The route as the router parsed it
 * @returns {void}
 */

/* -------------------------------------------------- *
 * Utils                                              *
 * -------------------------------------------------- */

/**
 * Escape all regex special characters.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping
 *
 * @param {string} val
 * @returns Escaped value
 */
function escapeRegex(val) {
  return val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Helper to create a regular expression that can be used as a route.
 *
 * @param {TemplateStringsArray} segments
 * @param  {Array<string | RegExp>} values
 * @returns {RegExp}
 */
export function route(segments, ...values) {
  /** @type {string[]} */
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

/**
 * Takes a parameter name and wraps it in a regular expression that can be
 * used for capturing that parameter in a `group`. Parameters created this
 * way will match one or more word characters (i.e. letters, numbers, _).
 *
 * @param {string} name The name of the parameter. Must be unique per route.
 *  Must be a valid name for a named capturing group in a regular expression.
 * @returns {RegExp} The regex of the parameter for use in a `route`
 */
export function param(name) {
  return new RegExp(`(?<${name}>\\w+)`);
}

/* -------------------------------------------------- *
 * Router class                                       *
 * -------------------------------------------------- */

export default class Router {
  /** @type {Map<RouteDef, RouteHandler>} */
  #handlers = new Map();

  /** @type {RouteHandler | undefined} */
  #fallbackHandler = undefined;

  /** @type {string | undefined} */
  #startAt = undefined;

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
    addEventListener("popstate", () => {
      this.#exec();
    });

    if (this.#startAt && !location.hash) location.hash = this.#startAt;
    else this.#exec();

    return this;
  }

  /**
   * Adds a new route handler. If an identical handler already exists, the
   * existing handler is replaced.
   *
   * @param {RouteDef} route Path of the route
   * @param {RouteHandler} handler Function to be called when the route is matched
   * @returns {Router} The router instance for chaining
   */
  on(route, handler) {
    this.#handlers.set(route, handler);
    return this;
  }

  /**
   * Removes an existing route handler.
   *
   * @param {RouteDef} route
   * @returns {Router} The router instance for chaining
   */
  off(route) {
    this.#handlers.delete(route);
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
   * Parses the URL to a route and runs handler associated with the route.
   *
   * @param {string} [url] The new URL. Defaults to `location.hash`.
   */
  #exec(url = location.hash) {
    let route, handler, match, params;

    for (const [k, v] of this.#handlers.entries()) {
      if (typeof k === "string" && url === k) {
        handler = v;
      } else if (k instanceof RegExp && (match = url.match(k))) {
        params = { ...match.groups };
        handler = v;
      }

      if (handler) {
        route = k;
        break;
      }
    }

    /** @type {ResolvedRoute} */
    const resolved = { url, params: params ?? {}, route };

    (handler ?? this.#fallbackHandler)?.(resolved);
  }
}
