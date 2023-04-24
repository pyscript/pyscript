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

* Install the dependencies with the command below (you must have `nodejs` >=16 and `make`)

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

## Tests

You'll need to install the following to have a functional test environment: `playwright`, `pytest-playwright`, `pillow`, `requests` and `numpy`.

`pytest-playwright`is only available as a `pip` package so we recommend that you install `playwright` and `pytest` from `pip`.

If you're interested to learn more about PyScript's testing framework, head over to the [development process](developing.md) page.

## Documentation

### Building the doc environment

* cd into the `docs` directory

```
cd pyscript/docs
```

* The following command will download and create the environment for you:

```
make setup
```

* After the above is completed, it will print out the command for activating the environment using the following format:

```
conda activate <environment name>
```

### Contributing to the documentation

* Before sending a pull request, we recommend that your documentation conforms with [PyScript's code of conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md) and with the general principles of [Diataxis](https://diataxis.fr/). Don't worry about reading too much on it, just do your best to keep your contributions on the correct axis.

* Write your documentation files using [Markedly Structured Text](https://myst-parser.readthedocs.io/en/latest/syntax/optional.html). This is similar to Markdown but with some addons to create the documentation infrastructure.

### Reviewing your work

* Before sending a Pull Request, review your work by starting the documentation server. To do this, use the following command:

```
make livehtml
```

You can visit the documentation server by opening a browser and visiting [http://127.0.0.1:8000](http://127.0.0.1:8000).

* Alternately, you can open a static documentation server using the following command:
```
make htmlserve
```

You can visit the documentation server by opening a browser and visiting [http://127.0.0.1:8080](http://127.0.0.1:8080).

However, the above command will not automatically update any changes done after running this server. Any changes done will need the shutting down and restarting of the server.

* To stop either server, press `ctrl+C` or `command+C` while the shell running the command is active.

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
