from pyodide.http import pyfetch, FetchResponse
from typing import Optional

async def request(url:str, method:str = "GET", body:Optional[str] = None,
 headers:Optional[dict[str,str]] = None) -> FetchResponse:
    """
    Async request function. Pass in Method and make sure to await!
    Parameters:
        method: str = {"GET", "POST", "PUT", "DELETE"} from javascript global fetch())
        body: str = body as json string. Example, body=json.dumps(my_dict)
        header: dict[str,str] = header as dict, will be converted to string... 
            Example, header:json.dumps({"Content-Type":"application/json"})

    Return: 
        response: pyodide.http.FetchResponse = use with .status or await.json(), etc.
    """
    kwargs = {"method":method, "mode":"cors"}
    if body and method not in ["GET", "HEAD"]:
        kwargs["body"] = body
    if headers:
        kwargs["headers"] = headers
    
    
    response = await pyfetch(url, **kwargs)
    return response
