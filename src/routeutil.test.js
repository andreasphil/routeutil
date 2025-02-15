// @ts-check

import { JSDOM } from "jsdom";
import assert from "node:assert/strict";
import { afterEach, before, describe, mock, test } from "node:test";
import Router, { param, route } from "./routeutil.js";

describe("Router", () => {
  let window;

  /**
   * @param {string} hash
   */
  function navigate(hash) {
    window.location.hash = hash;
    tick();
  }

  function tick() {
    window.dispatchEvent(new window.Event("popstate"));
  }

  before(() => {
    const dom = new JSDOM("<!DOCTYPE html><body></body>");
    window = dom.window;

    globalThis.location = window.location;
    globalThis.addEventListener = window.addEventListener;
    globalThis.AbortController = window.AbortController;
  });

  afterEach(() => {
    navigate("");
  });

  test("initializes", () => {
    const router = new Router();
    assert(router);
  });

  test("calls the handler for a simple route", () => {
    const handler = mock.fn();
    new Router().on("#/foo", handler).connect();

    navigate("#/foo");

    assert.equal(handler.mock.callCount(), 1);
  });

  test("calls the handler for a regex route", () => {
    const handler = mock.fn();
    new Router().on(/^#\/foo$/, handler).connect();

    navigate("#/foo");

    assert.equal(handler.mock.callCount(), 1);
  });

  test("calls the handler for multiple routes", () => {
    const handler = mock.fn();
    new Router().on(["#/foo", "#/bar"], handler).connect();

    navigate("#/foo");
    navigate("#/bar");

    assert.deepEqual(handler.mock.calls[0].arguments[0], {
      url: "#/foo",
      params: {},
      route: "#/foo",
    });
    assert.deepEqual(handler.mock.calls[1].arguments[0], {
      url: "#/bar",
      params: {},
      route: "#/bar",
    });
  });

  test("provides the parameters to the handler", () => {
    const handler = mock.fn();
    new Router().on(/^#\/foo\/(?<id>\w+)$/, handler).connect();

    navigate("#/foo/bar");

    assert.equal(handler.mock.callCount(), 1);
    const { arguments: args } = handler.mock.calls[0];
    assert.deepEqual(args[0].params, { id: "bar" });
  });

  test("provides the URL to the handler", () => {
    const handler = mock.fn();
    new Router().on(/^#\/foo\/(?<id>\w+)$/, handler).connect();

    navigate("#/foo/bar");

    assert.equal(handler.mock.callCount(), 1);
    const { arguments: args } = handler.mock.calls[0];
    assert.equal(args[0].url, "#/foo/bar");
  });

  test("provides the route to the handler", () => {
    const handler = mock.fn();
    const route = /^#\/foo\/(?<id>\w+)$/;
    new Router().on(route, handler).connect();

    navigate("#/foo/bar");

    assert.equal(handler.mock.callCount(), 1);
    const { arguments: args } = handler.mock.calls[0];
    assert.equal(args[0].route, route);
  });

  test("calls the correct route when multiple routes have been registered", () => {
    const fooHandler = mock.fn();
    const barHandler = mock.fn();
    const bazHandler = mock.fn();
    const fallbackHandler = mock.fn();
    new Router({ startAt: "#/bar" })
      .on("#/foo", fooHandler)
      .on("#/bar", barHandler)
      .on(/^\/baz$/, bazHandler)
      .fallback(fallbackHandler)
      .connect();

    tick();

    assert.equal(fooHandler.mock.callCount(), 0);
    assert.equal(barHandler.mock.callCount(), 1);
    assert.equal(bazHandler.mock.callCount(), 0);
    assert.equal(fallbackHandler.mock.callCount(), 0);
  });

  test("does not call event handlers when not connected", () => {
    const handler = mock.fn();
    new Router().on("#/foo", handler);

    navigate("#/foo");

    assert.equal(handler.mock.callCount(), 0);
  });

  test("initially sets the location if the location is empty", () => {
    navigate("");
    const handler = mock.fn();
    new Router({ startAt: "#/foo" }).on("#/foo", handler).connect();

    tick();

    assert.equal(window.location.hash, "#/foo");
    assert.equal(handler.mock.callCount(), 1);
  });

  test("does not set the initial location if a location exists", () => {
    navigate("#/bar");
    const handler = mock.fn();
    new Router({ startAt: "#/foo" }).on("#/foo", handler).connect();

    tick();

    assert.equal(window.location.hash, "#/bar");
    assert.equal(handler.mock.callCount(), 0);
  });

  test("calls the handler of the initial location on connect", () => {
    navigate("#/foo");
    const handler = mock.fn();
    new Router().on("#/foo", handler).connect();

    assert.equal(window.location.hash, "#/foo");
    assert.equal(handler.mock.callCount(), 1);
  });

  test("calls the fallback when the route doesn't exist", () => {
    const handler = mock.fn();
    new Router({ startAt: "#/foo" })
      .on("#/foo", mock.fn())
      .fallback(handler)
      .connect();

    navigate("#/bar");

    assert.equal(window.location.hash, "#/bar");
    assert.equal(handler.mock.callCount(), 1);
  });

  test("route is undefined in the fallback handler", () => {
    const handler = mock.fn();
    new Router({ startAt: "#/foo" })
      .on("#/foo", mock.fn())
      .fallback(handler)
      .connect();

    navigate("#/bar");

    assert.equal(handler.mock.callCount(), 1);
    const { arguments: args } = handler.mock.calls[0];
    assert(!args[0].route);
  });

  test("calls the after each handler initially", () => {
    const handler = mock.fn();
    new Router({ startAt: "#/foo" })
      .on("#/foo", mock.fn())
      .afterEach(handler)
      .connect();

    tick();

    assert.equal(handler.mock.callCount(), 1);
  });

  test("calls the after each handler when a route matched", () => {
    const handler = mock.fn();
    const fooRoute = route`#/foo/${param("bar")}`;
    new Router().on(fooRoute, mock.fn()).afterEach(handler).connect();

    navigate("#/foo/0");

    assert.equal(handler.mock.callCount(), 2);
    assert.deepEqual(handler.mock.calls[0].arguments[0], {
      url: "",
      params: {},
      route: undefined,
    });
    assert.deepEqual(handler.mock.calls[1].arguments[0], {
      url: "#/foo/0",
      params: { bar: "0" },
      route: fooRoute,
    });
  });

  test("calls the after each handler when no route matched", () => {
    const handler = mock.fn();
    new Router().on("#/foo/", mock.fn()).afterEach(handler).connect();

    navigate("#/bar");

    assert.equal(handler.mock.callCount(), 2);
    assert.deepEqual(handler.mock.calls[0].arguments[0], {
      url: "",
      params: {},
      route: undefined,
    });
    assert.deepEqual(handler.mock.calls[1].arguments[0], {
      url: "#/bar",
      params: {},
      route: undefined,
    });
  });

  test("stops handling a route", () => {
    const fooHandler = mock.fn();
    const router = new Router({ startAt: "#/foo" })
      .on("#/foo", fooHandler)
      .on("#/bar", mock.fn())
      .connect();

    navigate("#/foo");
    assert.equal(fooHandler.mock.callCount(), 1);

    navigate("#/bar");

    router.off("#/foo");
    navigate("#/foo");
    assert.equal(fooHandler.mock.callCount(), 1);
  });

  test("stops handling multiple routes", () => {
    const handler = mock.fn();
    const router = new Router().on(["#/foo", "#/bar"], handler).connect();

    navigate("#/foo");
    assert.equal(handler.mock.callCount(), 1);

    navigate("#/bar");
    assert.equal(handler.mock.callCount(), 2);

    router.off(["#/foo", "#/bar"]);
    navigate("#/foo");
    navigate("#/bar");
    assert.equal(handler.mock.callCount(), 2);
  });

  test("disconnects", () => {
    const fooHandler = mock.fn();
    const barHandler = mock.fn();
    const router = new Router({ startAt: "#/foo" })
      .on("#/foo", fooHandler)
      .on("#/bar", barHandler)
      .connect();

    navigate("#/foo");
    assert.equal(fooHandler.mock.callCount(), 1);

    router.disconnect();
    navigate("#/bar");
    assert.equal(barHandler.mock.callCount(), 0);
  });

  describe("integration", () => {
    test("matches a route created with the helper", () => {
      const handler = mock.fn();
      new Router().on(route`#/foo`, handler).connect();

      navigate("#/foo");

      assert.equal(handler.mock.callCount(), 1);
    });

    test("returns a parameter created with the helper", () => {
      const handler = mock.fn();
      new Router().on(route`#/foo/${param("bar")}`, handler).connect();

      navigate("#/foo/example");

      assert.equal(handler.mock.callCount(), 1);
      const { arguments: args } = handler.mock.calls[0];
      assert.deepEqual(args[0].params, { bar: "example" });
    });
  });
});

describe("route", () => {
  test("returns a simple string route", () => {
    const result = route`#/foo`;

    assert.equal(result.source, "^#\\/foo$");
  });

  test("returns a route with interpolated string values", () => {
    const result = route`#/foo/${"bar"}/baz`;

    assert.equal(result.source, "^#\\/foo\\/bar\\/baz$");
  });

  test("returns a route with interpolated regex values", () => {
    const result = route`#/foo/${/bar/}/baz`;

    assert.equal(result.source, "^#\\/foo\\/bar\\/baz$");
  });

  test("escapes regex characters in the template string", () => {
    const result = route`#/foo/*/bar`;

    assert.equal(result.source, "^#\\/foo\\/\\*\\/bar$");
  });

  test("escapes regex characters in interpolated string values", () => {
    const result = route`#/foo/${"*"}/bar`;

    assert.equal(result.source, "^#\\/foo\\/\\*\\/bar$");
  });

  test("does not escape regex characters in interpolated regex values", () => {
    const result = route`#/foo/${/.*/}/bar`;

    assert.equal(result.source, "^#\\/foo\\/.*\\/bar$");
  });

  test("matches the full value", () => {
    const result = route`#/foo/bar`;

    assert.doesNotMatch("...#/foo/bar", result);
    assert.doesNotMatch("#/foo/bar...", result);
    assert.match("#/foo/bar", result);
  });

  test('throws if the resulting route doesn\'t start with "#/"', () => {
    assert.throws(() => {
      route`/foo`;
    });

    assert.throws(() => {
      route`foo`;
    });
  });
});

describe("param", () => {
  test("returns a named parameter", () => {
    const result = param("foo");

    assert.equal(result.source, "(?<foo>\\w+)");
  });
});
