import { beforeEach, expect, jest } from "@jest/globals"
import { ensureUniqueId, joinPaths, fetchIt } from "../../src/utils"
import { FetchError } from "../../src/exceptions"
import { Response } from 'node-fetch';

describe("Utils", () => {

  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement("div");
  })

  it("ensureUniqueId sets unique id on element", async () => {
    expect(element.id).toBe("")

    ensureUniqueId(element)

    expect(element.id).toBe("py-internal-0")
  })

  it("ensureUniqueId sets unique id with increasing counter", async () => {
    const secondElement = document.createElement("div")

    expect(element.id).toBe("")
    expect(secondElement.id).toBe("")

    ensureUniqueId(element)
    ensureUniqueId(secondElement)

    // The counter will have been incremented on
    // the previous test, make sure it keeps increasing
    expect(element.id).toBe("py-internal-1")
    expect(secondElement.id).toBe("py-internal-2")
  })
})

describe("JoinPaths", () => {
  it("should remove trailing slashes from the beginning and the end", () => {
    const paths: string[] = ['///abc/d/e///'];
    const joinedPath = joinPaths(paths);
    expect(joinedPath).toStrictEqual('/abc/d/e');
  })

  it("should not remove slashes from the middle to preserve protocols such as http", () => {
    const paths: string[] = ['http://google.com', '///data.txt'];
    const joinedPath = joinPaths(paths);
    expect(joinedPath).toStrictEqual('http://google.com/data.txt');
  })

  it("should not join paths when they are empty strings", () => {
    const paths: string[] = ['', '///hhh/ll/pp///', '', 'kkk'];
    const joinedPath = joinPaths(paths);
    expect(joinedPath).toStrictEqual('hhh/ll/pp/kkk');
  })
})

describe("fetchIt", () => {

  it("should return a response object", async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response(status="200", "Hello World"))));

    const response = await fetchIt("https://pyscript.net");
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
  })

  it('receiving a 404 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("Not Found", {status: 404}))));

    const url = "https://pyscript.net/non-existent-page"
    const expectedError = new FetchError(
      FetchError.ErrorCode.FETCH_NOT_FOUND_ERROR,
      `Fetching from URL ${url} failed with error 404 (Not Found).`
    )

    expect(() => fetchIt(url)).rejects.toThrow(expectedError);
  })

  it('receiving a 404 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("Not Found", {status: 404}))));

    const url = "https://pyscript.net/non-existent-page"
    const expectedError = new FetchError(
      FetchError.ErrorCode.FETCH_NOT_FOUND_ERROR,
      `Fetching from URL ${url} failed with error 404 (Not Found).`
    )

    expect(() => fetchIt(url)).rejects.toThrow(expectedError);
  })

  it('receiving a 401 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("", {status: 401}))));

    const url = "https://pyscript.net/protected-page"
    const expectedError = new FetchError(
      FetchError.ErrorCode.FETCH_UNAUTHORIZED_ERROR,
      `Fetching from URL ${url} failed with error 401 (Unauthorized).`
    )

    expect(() => fetchIt(url)).rejects.toThrow(expectedError);
  })

  it('receiving a 403 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("", {status: 403}))));

    const url = "https://pyscript.net/secret-page"
    const expectedError = new FetchError(
      FetchError.ErrorCode.FETCH_FORBIDDEN_ERROR,
      `Fetching from URL ${url} failed with error 403 (Forbidden).`
    )

    expect(() => fetchIt(url)).rejects.toThrow(expectedError);
  })

  it('receiving a 500 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("Not Found", {status: 500}))));

    const url = "https://pyscript.net/protected-page"
    const expectedError = new FetchError(
      FetchError.ErrorCode.FETCH_SERVER_ERROR,
      `Fetching from URL ${url} failed with error 500 (Internal Server Error).`
    )

    expect(() => fetchIt(url)).rejects.toThrow(expectedError);
  })

  it('receiving a 503 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("Not Found", {status: 503}))));

    const url = "https://pyscript.net/protected-page"
    const expectedError = new FetchError(
      FetchError.ErrorCode.FETCH_UNAVAILABLE_ERROR,
      `Fetching from URL ${url} failed with error 503 (Service Unavailable).`
    )

    expect(() => fetchIt(url)).rejects.toThrow(expectedError);
  })
})
