import { describe, it, expect, jest } from '@jest/globals'
import { FetchError, ErrorCode } from "../../src/exceptions"
import { robustFetch } from "../../src/fetch"
import { Response } from 'node-fetch';

describe("robustFetch", () => {

  it("should return a response object", async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response(status="200", "Hello World"))));

    const response = await robustFetch("https://pyscript.net");
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
  })

  it('receiving a 404 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("Not Found", {status: 404}))));

    const url = "https://pyscript.net/non-existent-page"
    const expectedError = new FetchError(
      ErrorCode.FETCH_NOT_FOUND_ERROR,
      `Fetching from URL ${url} failed with error 404 (Not Found).`
    )

    expect(() => robustFetch(url)).rejects.toThrow(expectedError);
  })

  it('receiving a 404 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("Not Found", {status: 404}))));

    const url = "https://pyscript.net/non-existent-page"
    const expectedError = new FetchError(
      ErrorCode.FETCH_NOT_FOUND_ERROR,
      `Fetching from URL ${url} failed with error 404 (Not Found).`
    )

    expect(() => robustFetch(url)).rejects.toThrow(expectedError);
  })

  it('receiving a 401 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("", {status: 401}))));

    const url = "https://pyscript.net/protected-page"
    const expectedError = new FetchError(
      ErrorCode.FETCH_UNAUTHORIZED_ERROR,
      `Fetching from URL ${url} failed with error 401 (Unauthorized).`
    )

    expect(() => robustFetch(url)).rejects.toThrow(expectedError);
  })

  it('receiving a 403 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("", {status: 403}))));

    const url = "https://pyscript.net/secret-page"
    const expectedError = new FetchError(
      ErrorCode.FETCH_FORBIDDEN_ERROR,
      `Fetching from URL ${url} failed with error 403 (Forbidden).`
    )

    expect(() => robustFetch(url)).rejects.toThrow(expectedError);
  })

  it('receiving a 500 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("Not Found", {status: 500}))));

    const url = "https://pyscript.net/protected-page"
    const expectedError = new FetchError(
      ErrorCode.FETCH_SERVER_ERROR,
      `Fetching from URL ${url} failed with error 500 (Internal Server Error).`
    )

    expect(() => robustFetch(url)).rejects.toThrow(expectedError);
  })

  it('receiving a 503 when fetching should throw FetchError with the right errorCode', async () => {
    global.fetch = jest.fn(() => (Promise.resolve(new Response("Not Found", {status: 503}))));

    const url = "https://pyscript.net/protected-page"
    const expectedError = new FetchError(
      ErrorCode.FETCH_UNAVAILABLE_ERROR,
      `Fetching from URL ${url} failed with error 503 (Service Unavailable).`
    )

    expect(() => robustFetch(url)).rejects.toThrow(expectedError);
  })
});
