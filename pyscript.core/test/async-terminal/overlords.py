import json
from pyscript import fetch



async def read_document(url):
    """Read a text-based document from the specified URL."""

    response = await fetch(url)
    if response.status != 200:
        raise ValueError("Can't read that URL")
        
    return await response.text()


async def ask_the_overlords(prompt):
    """
    Ask the AI overlords.
    """

    url = "https://ntoll.pyscriptapps.com/chatty/api/proxies/openai-completions"
    
    response = await fetch(
        url,
        method="POST",
        headers={
            "Content-Type": "application/json"
        },
        body=json.dumps({
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }),
    )

    if response.status == 200:
        result = await response.json()
        answer = result["choices"][0]["message"]["content"]
    else:
        answer = "Oops, computer says 'No!'"
        print(response.status)
    return answer
