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

...