# Using the fetch from py-config

This tutorial shows how to use the fetch configuration from `py-config` to fetch two files from a remote server, store them in a local directory, and verify their contents.

## Development setup

We will create a todo list application similar to the one in the [examples](https://pyscript.net/examples/todo.html). To do this, we need three things:

 * An `index.html` file containing the HTML for the application.
 * A `todo.py` file containing the Python code for the application.
 * A `utils.py` file containing some utility functions for the application.


We will use the `fetch` configuration from `py-config` to fetch these files from a remote server and store them in a local directory.

### Creating the html file

In this first step, we will create the `index.html` file and import both `pyscript.css` and `pyscript.js`. These are needed to run our Python code in the browser and style the application.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>My Todo</title>

  <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
  <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>

  <body>

  </body>
</html>
```

## Fetching the files

### Using `fetch` to get the python files

Now we will use the `fetch` configuration from `py-config` to fetch the `todo.py` and `utils.py` files from a remote server and store them in a local directory called `todo`. Here we will fetch files from different URLs, using a `fetch` per item.

Also, remember when we said that we needed three things? We actually need four things. We also need
to fetch `pyscript.py` because we will use the `Element` class to interact with the DOM.

```{note}
We are not going into in-depth as to why we need to fetch `pyscript.py` here. The short version is that PyScript isn't installed in the filesystem when we fetch the files.
```


```html
<!DOCTYPE html>
<html lang="en">
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>My Todo</title>

  <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
  <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>

  <body>
    <py-config>
    [[fetch]]
    from = "https://raw.githubusercontent.com/pyscript/pyscript/main/pyscriptjs/src/python/"
    files = ["pyscript.py"]
    [[fetch]]
    from = "https://pyscript.net/examples/"
    files = ["utils.py"]
    [[fetch]]
    from = "https://gist.githubusercontent.com/FabioRosado/faba0b7f6ad4438b07c9ac567c73b864/raw/37603b76dc7ef7997bf36781ea0116150f727f44/"
    files = ["todo.py"]
    </py-config>
  </body>
</html>
```

## Creating a todo application

### Creating the todo elements

Now we will create the todo elements in the `body` of the `index.html` file.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>My Todo</title>

  <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
  <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>

  <body>
    <py-config>
      [[fetch]]
      from = "https://raw.githubusercontent.com/pyscript/pyscript/main/pyscriptjs/src/python/"
      files = ["pyscript.py"]
      [[fetch]]
      from = "https://pyscript.net/examples/"
      files = ["utils.py"]
      [[fetch]]
      from = "https://gist.githubusercontent.com/FabioRosado/faba0b7f6ad4438b07c9ac567c73b864/raw/37603b76dc7ef7997bf36781ea0116150f727f44/"
      files = ["todo.py"]
    </py-config>
    <section>
      <div class="text-center w-full mb-8">
        <h1 class="text-3xl font-bold text-gray-800 uppercase tracking-tight">To Do List</h1>
      </div>
      <div>
        <input id="new-task-content" class="py-input" type="text">
        <button id="new-task-btn" class="py-button" type="submit" py-click="add_task()">
        Add task
        </button>
      </div>
      <div id="list-tasks-container" class="flex flex-col-reverse mt-4"></div>
      <template id="task-template">
        <section class="task py-li-element">
          <label for="flex items-center p-2 ">
            <input class="mr-2" type="checkbox">
            <p class="m-0 inline"></p>
          </label>
        </section>
      </template>
    </section>
  </body>
</html>
```

Our todo application is starting to shape up, although if you try to add any tasks, you will notice that nothing happens. This is because we have not yet imported the `todo.py` file.

### Importing the needed functions from `todo.py`

This is where the magic happens. We can import the `todo.py` file by adding it as a source to the `py-script` tag. By specifying the file, pyscript will automatically import the file and run the code in it.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>My Todo</title>

  <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
  <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>

  <body>
    <py-config>
      [[fetch]]
      from = "https://raw.githubusercontent.com/pyscript/pyscript/main/pyscriptjs/src/python/"
      files = ["pyscript.py"]
      [[fetch]]
      from = "https://pyscript.net/examples/"
      files = ["utils.py"]
      [[fetch]]
      from = "https://gist.githubusercontent.com/FabioRosado/faba0b7f6ad4438b07c9ac567c73b864/raw/37603b76dc7ef7997bf36781ea0116150f727f44/"
      files = ["todo.py"]
    </py-config>
    <py-script>
        from todo import add_task, add_task_event
    </py-script>
    <section>
      <div class="text-center w-full mb-8">
        <h1 class="text-3xl font-bold text-gray-800 uppercase tracking-tight">To Do List</h1>
      </div>
      <div>
        <input id="new-task-content" class="py-input" type="text">
        <button id="new-task-btn" class="py-button" type="submit" py-click="add_task()">
        Add task
        </button>
      </div>
      <div id="list-tasks-container" class="flex flex-col-reverse mt-4"></div>
      <template id="task-template">
        <section class="task py-li-element">
          <label for="flex items-center p-2 ">
            <input class="mr-2" type="checkbox">
            <p class="m-0 inline"></p>
          </label>
        </section>
      </template>
    </section>
  </body>
</html>
```

You can now save the file and refresh the page. You should now be able to add tasks to your todo list.

## That's it!

You have now created a todo application using pyscript. You can add tasks and mark them as done. Let's take a recap of what we have achieved:

* We have imported three separate files into our `index.html` file using the `py-config` tag.
* We have created the necessary HTML code to create our todo's
* We have imported functions from the `todo.py` file, using the `py-script` tag.

For reference, the code from [the gist](https://gist.githubusercontent.com/FabioRosado/faba0b7f6ad4438b07c9ac567c73b864/raw/37603b76dc7ef7997bf36781ea0116150f727f44/todo.py) is the same code that our [todo example](https://pyscript.net/examples/todo.html) uses with a slight change of importing `Element` from `pyscript`.
