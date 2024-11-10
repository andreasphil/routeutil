/**
 * Helper to create a regular expression that can be used as a route.
 *
 * @param {TemplateStringsArray} segments
 * @param  {Array<string | RegExp>} values
 * @returns {RegExp}
 */
export function route(segments: TemplateStringsArray, ...values: Array<string | RegExp>): RegExp;
/**
 * Takes a parameter name and wraps it in a regular expression that can be
 * used for capturing that parameter in a `group`. Parameters created this
 * way will match one or more word characters (i.e. letters, numbers, _).
 *
 * @param {string} name The name of the parameter. Must be unique per route.
 *  Must be a valid name for a named capturing group in a regular expression.
 * @returns {RegExp} The regex of the parameter for use in a `route`
 */
export function param(name: string): RegExp;
export default class Router {
    /**
     * @param {object} [opts]
     * @param {string} [opts.startAt] If set, the router will initially navigate
     *  to the specified path if the locations' hash is empty when the router
     *  connects.
     */
    constructor(opts?: {
        startAt?: string;
    });
    /**
     * Performs the initial routing after the routes have been initialized.
     *
     * @returns {Router} The router instance for chaining
     */
    connect(): Router;
    /**
     * Stops route handling. Note that it cannot be restarted, you will need to
     * create a new router if you need it again.
     */
    disconnect(): void;
    /**
     * Adds a new route handler. If an identical handler already exists, the
     * existing handler is replaced.
     *
     * @param {RouteDef} route Path of the route
     * @param {RouteHandler} handler Function to be called when the route is matched
     * @returns {Router} The router instance for chaining
     */
    on(route: RouteDef, handler: RouteHandler): Router;
    /**
     * Removes an existing route handler.
     *
     * @param {RouteDef} route
     * @returns {Router} The router instance for chaining
     */
    off(route: RouteDef): Router;
    /**
     * This handler will be called if no route matches.
     *
     * @param {RouteHandler} handler
     * @returns {Router} The router instance for chaining
     */
    fallback(handler: RouteHandler): Router;
    /**
     * This handler will be called after any navigation (including when no route
     * matched).
     *
     * @param {RouteHandler} handler
     * @returns {Router} The router instance for chaining
     */
    afterEach(handler: RouteHandler): Router;
    #private;
}
/**
 * Defines a route for adding it to the router.
 */
export type RouteDef = string | RegExp;
/**
 * Contains information about a resolved route.
 */
export type ResolvedRoute = {
    /**
     * The raw URL
     */
    url: string;
    /**
     * The matched route. Can be `undefined` if no route
     * has matched the URL, typically when the fallback is active.
     */
    route?: RouteDef;
    /**
     * The parameters extracted from the route
     */
    params: Record<string, string>;
};
/**
 * A callback that is run when a route is matched.
 */
export type RouteHandler = (resolved: ResolvedRoute) => void;
