# PyScript

## What is PyScript

### tl;dr
PyScript is a Pythonic alternative to Scratch, JSFiddle or other "easy to use" programming frameworks, making the web a friendly, hackable, place where anyone can author interesting and interactive applications.

### Longer Version
PyScript is a meta project that aims to combine multiple open technologies to create a framework for users to use Python (and other languages) to create sophisticated applications in the browser. It highly integrate with the way the DOM works in the browser and allows users to add logic, in Python, in a way that feel natural to web as well as Python developers.

## Try PyScript

To try PyScript, import the pyscript to your html page with:
```
<link rel="stylesheet" href="pyscript.css" />
<script defer src="pyscript.js"></script>
```
At that point, you can then use PyScript components in your html page. PyScript currently implements the following elements:

* `<py-script>`: that can be used to define python code that is execute withing the web page. The element itself is not rendered to the page and only used to add logic
* `<py-repl>`: creates a REPL component that is rendered to the page as a code editor and allows users to right code that can be executed

Check out the `/examples` folder for more examples on how to use it, all you need to do is open them in Chrome.

## How to Contribute

To contribute:

* clone the repo
* cd into the main project folder with `cd pyscriptjs`
* install the dependencies with `npm install`
* run `npm run dev` to build and run the dev server. This will also watch for changes and rebuild when a file is saved

## Notes:

* This is an extremely experimental project, so expect things to break!
* PyScript has been only tested on Chrome, at the moment.
