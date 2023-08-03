import random

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from httpx import AsyncClient

app = FastAPI()

base = "/test"


def generate_html_response():
    html_content = """
    <!doctype html>
    <html>
        <head>
            <title>PyScript Service Worker</title>
        </head>
        <body>
            <h1>PyScript from a service worker 🦄</h1>
            <h2>FastAPI demo</h2>
            <ul>
                <li>Test some random <a href="./json">json</a></li>
                <li>Test some random <a href="./emoji">emoji</a></li>
            </ul>
        </body>
    </html>
    """

    return HTMLResponse(content=html_content, status_code=200)


@app.get(base + "/", response_class=HTMLResponse)
async def root():
    return generate_html_response()


# used to test errors forwarded as 500
# shenanigans(1, 2, 3)


@app.get(base + "/json")
async def json():
    # used to test that file changes actually happen when
    # '/pyscript.sw/update_handler' is reached
    # print(base + "/json")
    return {"message": random.choice(["Hello World", "Bonjour le monde", "Hola Mundo"])}


@app.get(base + "/emoji")
async def emoji():
    return {"emoji": random.choice(["👋", "👋🏻", "👋🏼", "👋🏽", "👋🏾", "👋🏿"])}


async def handle_request(request):
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        response = await client.get(request.url)

    return response.text, response.status_code, response.headers.items()
