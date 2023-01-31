# Setting up your development environment

* Fork the repository - [quicklink](https://github.com/pyscript/pyscript/fork)

* Clone your fork of the project

```
git clone https://github.com/<your username>/pyscript
```

* Add the original project as your upstream (this will allow you to pull the latest changes)

```sh
git remote add upstream git@github.com:pyscript/pyscript.git
```

* cd into the `pyscriptjs` folder using the line below in your terminal (if your terminal is already in pyscript then use **cd pyscriptjs** instead)

```
cd pyscript/pyscriptjs
```

* Install the dependencies with the command below (you must have node >=16)

```
make setup
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: If `make setup` gives a node/npm version required  error then go to [troubleshooting](https://github.com/pyscript/pyscript/blob/main/TROUBLESHOOTING.md)

* You can also run the examples locally by running the command below in your terminal

```
make examples
```

* Run ***npm run dev*** to build and run the dev server. This will also watch for changes and rebuild when a file is saved.

```
npm run dev
```
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **NOTE**: To access your local build paste `http://localhost:8080` into your browser


Now that node and npm have both been updated `make setup` should work, and you can continue [setting up your local environment](setting-up-environment.md) without problems (hopefully).


## Setting up and building the docs

To build the documentation locally first make sure you are in the `docs` directory.

You'll need `make` and `conda` installed in your machine. The rest of the environment should be automatically download and created for you once you use the command:

```
make setup
```

Use `conda activate $environment_name` to activate your environment.

To add new information to the documentation make sure you conform with PyScript's code of conduct and with the general principles of Diataxis. Don't worry about reading too much on it, just do your best to keep your contributions on the correct axis.

Write your documentation files using [Markedly Structured Text](https://myst-parser.readthedocs.io/en/latest/syntax/optional.html), which is very similar to vanilla Markdown but with some addons to create the documentation infrastructure.

Once done, initialize a server to check your work:

```
make livehtml
```

Visible here: [http://127.0.0.1:8000](http://127.0.0.1:8000)

# PyScript Demonstrator

A simple webapp to demonstrate the capabilities of PyScript.

## Getting started

1. If you don't already have Node.js, install it. The official installer for the
   LTS version of Node is available from [nodejs.org](https://nodejs.org/).

2. If you don't already have Rollup, install it. Rollup can be installed as a
   global resource using:

       $ npm install --global rollup

3. Install the demo apps requirements:

       $ npm install

4. Start the server:

       $ npm run dev

   This will compile the resources for the app, and start the development server.

5. When the compilation completes, it will display something like:

         Your application is ready~! 🚀

         - Local:      http://localhost:8080
         - Network:    Add `--host` to expose

       ────────────────── LOGS ──────────────────

   Once this is visible, open a browser at
   [http://localhost:8080](http://localhost:8080). This will provide a list of
   demos that you can run.

## More information

For more information:

* [Discussion board](https://community.anaconda.cloud/c/tech-topics/pyscript)
* [Home Page](https://pyscript.net/)
* [Blog Post](https://engineering.anaconda.com/2022/04/welcome-pyscript.html)
* [Discord Channel](https://discord.gg/BYB2kvyFwm)

We use Discord as the main place for our discussions

