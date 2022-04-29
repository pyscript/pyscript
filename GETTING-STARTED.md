# Getting started with PyScript

This page will guide you through getting started with PyScript.

## Development setup

PyScript does not require any development environment other
than a web browser. We recommend using Chrome.

## Installation

First, go to https://pyscript.net and download the PyScript assets.
Unzip the archive to a directory where you wish to write PyScript-enabled
HTML files. You should then have three files in your directory.

```
├── ./
│   ├── pyscript.css
│   ├── pyscript.js
│   └── pyscript.js.map
```

## Your first PyScript HTML file

Here's a "Hello, world!" example using PyScript using the assets you
downloaded from https://pyscript.net.

Using your favorite editor create a new file called `hello.html` in
the same directory as your PyScript JavaScript and CSS files with the
following content and open the file in your web browser. You can typically
open an HTML by double clicking it in your file explorer.

```html
<html>
  <head>
    <link rel="stylesheet" href="pyscript.css" />
    <script defer src="pyscript.js"></script>
  </head>
  <body> <py-script> print('Hello, World!') </py-script> </body>
</html>
```

Notice the use of the `<py-script>` tag in the HTML body. This
is where you'll write your Python code. In the following sections we'll
introduce the 8 tags provided by PyScript.

## The py-script tag

The `<py-script>` tag let's you execute multi-line Python scripts and
print back onto the page. For
example we can compute π.

```html
<html>
  <head>
    <link rel="stylesheet" href="pyscript.css" />
    <script defer src="pyscript.js"></script>
  </head>
  <body>
      <py-script>
print("Let's compute π:")
def wallis(n):
    pi = 2
    for i in range(1,n):
        pi *= 4 * i ** 2 / (4 * i ** 2 - 1)
    return pi

pi = wallis(100000)
s = f"π is approximately {pi:.3f}"
print(s)
      </py-script>
</html>
```

### Writing into labeled elements

In the example above we had a single `<py-script>` tag and it printed
one or more lines onto the page in order. Within the `<py-script>` you
have access to the `pyscript` module, which provides a `.write()` method
to send strings into labeled elements on the page.

For example we'll add some style elements and provide place holders for
the `<py-script>` tag write to.

```html
<html>
    <head>
      <link rel="stylesheet" href="pyscript.css" />
      <script defer src="pyscript.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
    </head>

  <body>
    <b><p>Today is <u><label id='today'></label></u></p></b>
    <br>
    <div id="pi" class="alert alert-primary"></div>
    <py-script>
import datetime as dt
pyscript.write('today', dt.date.today().strftime('%A %B %d, %Y'))

def wallis(n):
    pi = 2
    for i in range(1,n):
        pi *= 4 * i ** 2 / (4 * i ** 2 - 1)
    return pi

pi = wallis(100000)
pyscript.write('pi', f'π is approximately {pi:.3f}')
    </py-script>
  </body>
</html>
```



## Asynchronous