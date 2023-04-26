# Setting up your development environment

These steps will help you set up your development environment. We suggest completing each step before going to the next step, as some parts have dependencies on previous commands.

## Prepare your repository

* Create a fork of the [PyScript github repository](https://github.com/pyscript/pyscript/fork) to your github.

* In your development machine, clone your fork of PyScript. Use this command in your terminal.

```sh
git clone https://github.com/<your username>/pyscript
```

* With the following command, add the original project as your upstream. This will allow you to pull the latest changes.

```sh
git remote add upstream https://github.com/pyscript/pyscript.git
git pull upstream main
```

* If the above fails, try this alternative:

```sh
git remote remove upstream
git remote add upstream git@github.com:pyscript/pyscript.git
git pull upstream main
```

## Install the dependencies

* change directory into `pyscriptjs` using this command:

```sh
cd pyscript/pyscriptjs
```

We need to ensure that we have installed `nodejs` >= 16 and `make`, before we can continue.

* Install `nodejs` with at least version 16. This can be downloaded at [https://nodejs.org](https://nodejs.org)

* Ensure that `make` is available on your system:

  * *Linux*. `make` is usually installed by default in most Linux distributions. In the case it is not installed, run the terminal command `sudo apt install make`.

  * *OS X*. Install Apple Developer Tools. `make` is included in this package.

  * *Windows*. It is recommended to use either Windows Subsystem for Linux (WSL) or GNUWin32 for installing `make`. Instructions can be found [in this StackOverflow question](https://stackoverflow.com/questions/32127524/how-to-install-and-use-make-in-windows).

* The following command will download and install the rest of the PyScript dependencies:

```
make setup
```

  * **NOTE**: If `make setup` gives an error on an incompatible version for node or npm, please refer to [troubleshooting](https://github.com/pyscript/pyscript/blob/main/TROUBLESHOOTING.md).

## Activating the environment

* After the above `make setup` command is completed, it will print out the command for activating the environment using the following format. Use this to work on the development environment:

```
conda activate <environment name>
```

## Deactivating the environment

* To deactivate the environment, use the following command:
```
conda deactivate
```


# Running PyScript examples server

The examples server is used to view and edit the example files.

* change directory into `pyscriptjs` using this command:

```sh
cd pyscript/pyscriptjs
```

* To build the examples, run this command:

```
make examples
```

* To serve the examples, run this command:

```sh
python -m http.server 8080 --directory examples
```

* Alternately, you can also run this command if conda is not activated:

```sh
conda run -p <environment name> python -m http.server 8080 --directory examples
```

* You can access the examples server by visiting the following url in your browser: [http://localhost:8080](http://localhost:8080)


# Running the PyScript development server

The PyScript development server will regularly check for any changes in the src directory. If any changes were detected, the server will rebuild itself to reflect the changes. This is useful for development with PyScript.

* change directory into `pyscriptjs` using this command:

```sh
cd pyscript/pyscriptjs
```

* Use the following command to build and run the PyScript dev server.

```
npm run dev
```

* You can access the PyScript development server by visiting the following url in your browser: [http://localhost:8080](http://localhost:8080)

# Setting up the test environment

A key to good development is to perform tests before sending a Pull Request for your changes.

## Install the dependencies

* change directory into `pyscriptjs` using this command:

```sh
cd pyscript/pyscriptjs
```

* The following command will download the dependencies needed for running the tests:

```
make setup
```

  * If you are not using a conda environment, or wish to install the dependencies manually, here are the packages needed:
    * `pillow`
    * `requests`
    * `numpy`
    * `playwright`
    * `pytest-playwright`. Note that this is only available as a `pip` package.

## Activating the environment

* After the above `make setup` command is completed, it will print out the command for activating the environment using the following format:

```
conda activate <environment name>
```

## Deactivating the environment

* To deactivate the environment, use the following command:
```
conda deactivate
```

## Running the tests

* After setting up the test environment and while the environment is activated, you can run the tests with the following command:

```
make test
```

For more information about PyScript's testing framework, head over to the [development process](developing.md) page.

# Setting up your documentation environment

The documentation environment is separate from the development environment. It is used for updating and reviewing the documentation before deployment.

## Installing the dependencies

* change directory into the `docs` using this command:

```sh
cd pyscript/docs
```

* The following command will download, install the dependencies, and create the environment for you:

```
make setup
```

(activating-documentation-environment)=
## Activating the environment

* After the above `make setup` command is completed, it will print out the command for activating the environment using the following format:

```
conda activate <docs environment name>
```

Note that the docs environment path is different from the developer's environment path.

## Deactivating the environment

* To deactivate the environment, use the following command:
```
conda deactivate
```

## Contributing to the documentation

* Before sending a pull request, we recommend that your documentation conforms with [PyScript's code of conduct](https://github.com/pyscript/governance/blob/main/CODE-OF-CONDUCT.md) and with the general principles of [Diataxis](https://diataxis.fr/). Don't worry about reading too much on it, just do your best to keep your contributions on the correct axis.

* Write your documentation files using [Markedly Structured Text](https://myst-parser.readthedocs.io/en/latest/syntax/optional.html). This is similar to Markdown but with some addons to create the documentation infrastructure.

## Reviewing your work

* Before sending a Pull Request, review your work by starting the documentation server. To do this, use the following command:

```
make livehtml
```

You can visit the documentation server by opening a browser and visiting [http://127.0.0.1:8000](http://127.0.0.1:8000).

* Alternately, you can open a static documentation server. Unlike the above, this will not automatically update any changes done after running this server. To see the changes done, you will need to manually stop and restart the server. To do this, use the following command:

```
make htmlserve
```

You can visit the documentation server by opening a browser and visiting [http://127.0.0.1:8080](http://127.0.0.1:8080).

* To stop either server, press `ctrl+C` or `command+C` while the shell running the command is active.

* Note: If the above make commands failed, you need to activate the documentation environment first before running any of the commands. Refer to [Activating the environment](#activating-documentation-environment) section above.

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
