# PyScript入門

このページは、PyScriptに入門するための方法を紹介します。

## セットアップ

PyScriptはブラウザ以外のいかなる開発環境も必要としません。私たちは [Chrome](https://www.google.com/chrome/)を推奨しています。

If you're using [VSCode](https://code.visualstudio.com/), the
[Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
can be used to reload the page as you edit the HTML file.

## 導入

追加のインストールは不要です。 このドキュメントでは https://pyscript.net で提供されているPyScriptアセットを使用します。

ソースをダウンロードして自分でビルドする場合は、README.mdファイルに書かれている指示にしたがってください。

## 最初のPyScript HTMLファイル

これがPyScriptを使った "Hello, world!" の例です。

お気に入りのエディタで、PyScript、JavaScript、CSS のファイルと同じディレクトリに `hello.html` というファイルを以下の内容で新規作成し、ブラウザでファイルを開いてください。HTMLは通常、エクスプローラーの中でダブルクリックすると開くことができます。

```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
    <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
  </head>
  <body> <py-script> print('Hello, World!') </py-script> </body>
</html>
```

HTMLのbodyに`<py-script>` タグが使われていることに注目してください。ここでPythonのコードを書くことになります。以下の章では、PyScriptが提供する8つのタグを紹介します。

## py-script タグ

`<py-script>` タグを使うと、複数行のPythonスクリプトを実行し、ページに表示できます。例として、πを計算してみましょう。

```html
<html>
  <head>
    <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
    <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
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

### ラベル付き要素への書き込み

この例では、1つの`<py-script>`タグがあり、1つまたは複数の行を順番にページへ出力しています。`<py-script>`の中では、`pyscript`モジュールにアクセスすることができ、ページ上のラベル付き要素に文字列を送信するための`.write()`メソッドを提供します。

たとえば、いくつかのスタイル要素を追加し、<py-script>タグの書き込み先となるプレースホルダーを提供できます。

```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
      <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" crossorigin="anonymous">
    </head>

  <body>
    <b><p>Today is <u><label id='today'></label></u></p></b>
    <br>
    <div id="pi" class="alert alert-primary"></div>
    <py-script>
import datetime as dt
pyscript.write('today', dt.date.today().strftime('%A %B %d, %Y'))

def compute_pi(n):
    pi = 2
    for i in range(1,n):
        pi *= 4 * i ** 2 / (4 * i ** 2 - 1)
    return pi

pi = compute_pi(100000)
pyscript.write('pi', f'π is approximately {pi:.3f}')
    </py-script>
  </body>
</html>
```

## Packagesとmodules

[Python Standard Library](https://docs.python.org/3/library/) と`pyscript` moduleに加え、多くのサードパーティ製OSSパッケージがPyScriptと即座に連携して動作します。

これらを使用するためには、HTMLの先頭で`<py-env>`を使用して依存関係を宣言する必要があります。[toga example](https://github.com/pyscript/pyscript/blob/main/pyscriptjs/examples/toga/freedom.html)のように、ディスク上の`.whl`ファイルに直接リンクすることもできます。


```
<py-env>
- './static/wheels/travertino-0.1.3-py3-none-any.whl'
</py-env>
```

あなたの`.whl`が純粋なPython wheelでない場合、[こちら](https://github.com/pyodide/pyodide/tree/main/packages)へ追加するため[pyodide](https://github.com/pyodide/pyodide)にPRまたはissueをしてください。十分な需要があれば、pyodideチームはあなたのパッケージのサポートに取り組むでしょう。しかし、あなたがPRを行い、ブロック解除のためにチームと相談すれば、より早く進むでしょう。

たとえば、NumPyやMatplotlibが利用可能です。ここでは、ショートカットとして `<py-script output="plot">` を使用していることに注意してください。これは、スクリプトの最終行にある式を受け取り、`pyscript.write('plot', fig) `を実行します


```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
      <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
      <py-env>
        - numpy
        - matplotlib
      </py-env>
    </head>

  <body>
    <h1>Let's plot random numbers</h1>
    <div id="plot"></div>
    <py-script output="plot">
import matplotlib.pyplot as plt
import numpy as np

x = np.random.randn(1000)
y = np.random.randn(1000)

fig, ax = plt.subplots()
ax.scatter(x, y)
fig
    </py-script>
  </body>
</html>
```

### Local modules

パッケージに加えて、<py-script>タグの中でインポートされるローカルのPythonモジュールを宣言できます。たとえば、乱数生成のステップをファイル`data.py`の関数に配置できます。

```python
# data.py
import numpy as np

def make_x_and_y(n):
    x = np.random.randn(n)
    y = np.random.randn(n)
    return x, y
```

HTMLタグの`<py-env>`では、ローカルモジュールへのパスは`paths:key`で提供されます。

```html
<html>
    <head>
      <link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
      <script defer src="https://pyscript.net/alpha/pyscript.js"></script>
      <py-env>
        - numpy
        - matplotlib
        - paths:
          - /data.py
      </py-env>
    </head>

  <body>
    <h1>Let's plot random numbers</h1>
    <div id="plot"></div>
    <py-script output="plot">
import matplotlib.pyplot as plt
from data import make_x_and_y

x, y = make_x_and_y(n=1000)

fig, ax = plt.subplots()
ax.scatter(x, y)
fig
    </py-script>
  </body>
</html>
```
