from js import console, document
from pyodide.http import pyfetch
import json

async def get_data():
    res = await pyfetch('https://api.coindesk.com/v1/bpi/currentprice.json')
    data = await res.json()
    console.log('fetched data from api ',data)
    return data['bpi']


async def render():
    data = await get_data()
    for currency in data:
        col = document.createElement('div')
        col.setAttribute('class','col-2')
        
        card_div = document.createElement('div')
        card_div.setAttribute('class','card text-center shadow  mb-5 bg-white rounded')
        
        card_header = document.createElement('div')
        card_header.setAttribute('class','card-header bg-warning bg-gradient mb-3')
        card_header.innerHTML = data[currency]['symbol'] + ' ' + data[currency]['rate']
        card_div.appendChild(card_header)

        card_body = document.createElement('div')
        card_body.setAttribute('class','card-body')
        
        card_title = document.createElement('h2')
        card_title.setAttribute('class','card-title')
        card_title.innerText = currency
        card_body.appendChild(card_title)
        
        card_div.appendChild(card_body)
        col.appendChild(card_div)

        document.getElementById('data-row').append(col)