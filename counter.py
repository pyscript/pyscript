from js import document
def count(counter):

    counter = document.getElementById('id-count').innerText
    counter = int(float(counter))
    counter += 1
    document.getElementById('id-count').innerText = counter

    return counter
