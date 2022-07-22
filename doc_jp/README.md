# PyScript

## PyScriptとは

### まとめ
PyScriptは、Python版のScratchやJSFiddleのような、「使いやすい」プログラミングフレームワークです。誰もが面白くインタラクティブなアプリケーションを作成できる、親しみやすくハックしやすいWebを作ることを目的としています。

はじめる → [GETTING-STARTED](GETTING-STARTED.md).

例をみる → [the pyscript folder](pyscriptjs).

### 詳細
PyScriptは、複数のオープンな技術を組み合わせて、ユーザーがPythonで洗練されたブラウザアプリケーションを作成できるフレームワークにすることを目的としたメタプロジェクトです。ブラウザのDOMの動きとシームレスに統合され、WebとPython両方の開発者が自然な方法でPythonのロジックを追加できます。

## PyScriptを試してみる

PyScriptを試すには、まずpyscriptファイルをhtmlページにインポートします。
```html
<link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
<script defer src="https://pyscript.net/alpha/pyscript.js"></script>
```
すると、htmlページでPyScriptコンポーネントを使うことができます。PyScriptは現在、以下の要素を実装しています。

* `<py-script>`: ウェブページで実行可能なPythonコードを定義するために使用できます。要素自体はページに表示されず、ロジックを追加するためにのみ使用されます。
* `<py-repl>`: コードエディターとしてページに表示され、ユーザーが実行可能なコードを書くことができるREPLコンポーネントを作成します。

[pyscriptjs/examples](pyscriptjs/examples)に使い方のサンプルがありますので、チェックしてみてください。Chromeで開くだけです。

## Contribute

[CONTRIBUTING](CONTRIBUTING.md)を参照してください。

## Resources

* [Discussion board](https://community.anaconda.cloud/c/tech-topics/pyscript)
* [Home Page](https://pyscript.net/)
* [Blog Post](https://engineering.anaconda.com/2022/04/welcome-pyscript.html)

## Notes

* このプロジェクトは非常に実験的なものなので、破壊的な変更が予想されます
* PyScriptはいまのところChromeでのみテストされています。

## Governance

[PyScript organization governance](https://github.com/pyscript/governance) については別のレポジトリで管理されています。
