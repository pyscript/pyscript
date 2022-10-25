# &lt;py-script&gt;

The `<py-script>` element lets you execute multi-line Python scripts both inline and via a src attribute.

## Attributes

| attribute | type | default | description |
|----|----|----|----|
| **src** | url |    | Url to a python source file. |

## Examples

- Inline `<py-script>` element:
```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
  </head>
  <body>
      <py-script>
        print("Let's compute π:")
        def compute_pi(n):
            pi = 2
            for i in range(1,n):
                pi *= 4 * i ** 2 / (4 * i ** 2 - 1)
            return pi

        pi = compute_pi(100000)
        s = f"π is approximately {pi:.3f}"
        print(s)
      </py-script>
  </body>
</html>
```

- `<py-script>` element with `src` attribute:
```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
    <py-config>
    paths =[
        "compute_pi.py"
    ]
    </py-config>
  </head>
  <body>
      <py-script src="compute_pi.py"></py-script>
  </body>
</html>
```
