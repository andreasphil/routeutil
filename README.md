<h1 align="center">
  Route Util 🪿
</h1>

<p align="center">
  <strong>Bare minimum client side router</strong>
</p>

> ⚠️ Work in progress. Things are most certainly incomplete and/or broken, and
> will definitely change.

- 🍱 All the essentials for simple, client-side routing: routes, params & fallbacks
- 🐙 Flexible: use with plain JavaScript or easily integrate with any framework
- 👌 Fully typed and tested
- 🐛 Tiny (<1kb min+gzip) footprint with no runtime dependencies

## Installation

From a CDN:

```js
import Router from "https://esm.sh/gh/andreasphil/routeutil@<tag>";
```

With a package manager:

```sh
npm i github:andreasphil/routeutil#<tag>
```

## Usage

Route Util is an intentionally primitive alternative to more powerful routers for constrained use cases—basically just a structured way of watching and reacting to changes in `location.hash`. You register routes in the form of strings or regular expressions. A callback handler will be executed if `location.hash` matches any of them. You can also provide a fallback in case none matches. That's it!

```js
import Router from "@andreasphil/routeutil";

// Create a router. `startAt` is optional. If provided, the router will
// initially load that route if no route is active.
const router = new Router({ startAt: "#/home" });

// Register a simple string route. Routes must start with `#/`.
router.on("#/home", () => {
  console.log("@ home");
});

// Register a route with a regular expression. Expressions should match the
// entire path to avoid ambiguity. Use named capturing groups for paramters.
router.on(/^#\/users\/(?<id>\w+)$/, ({ params }) => {
  console.log("@ users", params.id);
});

// The fallback will be called if no registered route matches.
router.fallback(() => {
  console.log("@ 404");
});

// Register an afterEach handler to perform something whenever the router
// runs. This includes when no route matches. In this case, `route` and `params`
// will be empty.
router.afterEach((resolved) => {
  console.log(`completed navigation to ${resolved.url}`);
});

// Tell the router it's ready to wire up event handling and perform initial
// routing. You can still add more routes later.
router.connect();
```

### Route helper

The `route` helper makes it more convenient to create readable, well-formed routes. They can also include parameters.

```js
import Router, { route, param } from "@andreasphil/routeutil";

const homeRoute = route`#/home`;
const userDetailRoute = route`#/users/${param("id")}`;

const router = new Router({ startAt: "#/home" })
  .on(homeRoute, () => {})
  .on(userDetailRoute, ({ params }) => {})
  .connect();

// Use `disconnect` to stop the router. You'll need to create a new one in
// case you need it again.
router.disconnect();
```

### Navigating

Route Util builds on the [`popstate` event](https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event) and [`location.hash`](https://developer.mozilla.org/en-US/docs/Web/API/Location/hash). While it doesn't provide any functionality for navigation of its own, you can use all of the browser's standard methods for getting around. For example:

Links:

```html
<a href="#/home">Home</a> <a href="#/users/1">User 1</a>
```

Programmatically setting the route via `location.hash`:

```js
location.hash = "#/users/1";
```

Replacing:

```js
location.replace("#/users/1");
```

Navigating back and forward:

```js
history.back();
history.forward();
```

### API

See [lib.d.ts](./dist/lib.d.ts) for all available methods and docs.

## Development

This library is built with [esbuild](https://esbuild.github.io). Packages are managed by [pnpm](https://pnpm.io). Tests are powered by [Node.js' test runner](https://nodejs.org/en/learn/test-runner/introduction). The following commands are available:

```sh
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
pnpm build        # Typecheck, emit declarations and bundle
```

For a demo, open [index.html](./index.html) in a browser.

## Credits

This library uses a number of open source packages listed in [package.json](./package.json). It was inspired by similar projects like [navaid](https://github.com/lukeed/navaid) and [page.js](https://github.com/visionmedia/page.js).

Thanks 🙏
