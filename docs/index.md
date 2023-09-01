# PyScript

Welcome to the PyScript documentation!

PyScript is a programming platform that allows you to create web applications that run in the browser, using Python.
That creates some really interesting benefits:

* Using Python directly in the browser allows to create applications with an easier and more user friendly language
* Scalability: since applications run directly in the browser and not on a server somewhere, servers don't need to
scale as much if the number of users of an application grows exponentially
* Shareability: applications can be shared as easily as sharing an URL. Can't get easier than that ;)
* Multi-Platform support: since the browser is the underlying system where PyScript applications run, applications
can run anywhere a modern browser is installed, on windows, linux, mac, mobile, or even a Tesla! :)
* Security: since PyScript runs core in the Browser (via Web Assembly) in a sandbox fashion and the browsers offers
a very strict level of security, code never have access files or part of the underlying system without user permission,
making it a great option in terms of security.
* User Friendly APIs: web APIs are very vast and, sometimes, complicated. PyScript offers smaller and more user friendly
APIs for the most common use cases while also providing an option to access the full Web APIs as well.

We hope you'll enjoy the project and create so many incredible things with it! To learn more, consult our documentation.



::::{grid} 2
:gutter: 3

:::{grid-item-card} [Tutorials](tutorials/index.md)

Just getting started with PyScript?

Check out our [getting started guide](tutorials/getting-started.md)!
:::
:::{grid-item-card} [Guides](guides/index.md)

You already know the basics and want to learn specifics!

[Passing Objects between JavaScript and Python](guides/passing-objects.md)

[Making async HTTP requests in pure Python](guides/http-requests.md)

[Async/Await and Asyncio](guides/asyncio.md)

:::
:::{grid-item-card} [Concepts](concepts/index.md)

[What is PyScript?](concepts/what-is-pyscript.md)

:::
:::{grid-item-card} [Reference](reference/index.md)

[Frequently asked questions](reference/faq.md)

[The PyScript JS Module](reference/modules/pyscript.md)

:::{toctree}
:maxdepth: 1

:::
::::

```{toctree}
---
maxdepth: 1
hidden:
---
tutorials/index
guides/index
concepts/index
reference/index
changelog
```
