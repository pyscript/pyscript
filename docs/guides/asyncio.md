# Using Async/Await and Asyncio

## {bdg-warning-line}`Deprecated` Implicit Coroutine Scheduling / Top-Level Await

In PyScript versions 2022.09.1 and earlier, \<py-script\> tags could be written in a way that enabled "Implicit Coroutine Scheduling." The keywords `await`, `async for` and `await with` were permitted to be used outside of `async` functions. Any \<py-script\> tags with these keywords at the top level were compiled into coroutines and automatically scheuled to run in the browser's event loop. This functionality was deprecated, and these keywords are no longer allowed outside of `async` functions.

To transition code from using top-level await statements to the currently-acceptable syntax, wrap the code into a coroutine using `async def()` and schedule it to run in the browser's event looping using `asyncio.ensure_future()` or `asyncio.create_task()`.

The following two pieces of code are functionally equivalent - the first only works in versions 2022.09.1, the latter is the currently acceptable equivalent.

```python
# This version is deprecated, since
# it uses 'await' outside an async function
<py-script>
import asyncio

for i in range(3):
    print(i)
    await asyncio.sleep(1)
</py-script>
```

```python
# This version is acceptable
<py-script>
import asyncio

async def main():
    for i in range(3):
        print(i)
        await asyncio.sleep(1)

asyncio.ensure_future(main())
</py-script>
```
