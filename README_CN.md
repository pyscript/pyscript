# PyScript

## 什么是PyScript

### 介绍

PyScript是一个框架，它允许用户使用HTML的界面和[Pyodide](https://pyodide.org/en/stable/)， [WASM](https://webassembly.org/)以及现代Web技术在浏览器中创建丰富的Python应用程序。

要开始使用，请参阅[入门教程](docs/tutorials/getting-started.md)。

有关示例，请参见[这里](examples)。

### Longer Version

PyScript是一个元项目，旨在将多种开放技术结合到一个框架中，允许用户使用Python创建复杂的浏览器应用程序。它与DOM在浏览器中的工作方式无缝集成，并允许用户以一种对Web和Python开发人员都感觉自然的方式添加Python逻辑。

## 尝试PyScript

要尝试PyScript，请将PyScript文件导入到HTML页面的 `<head>` 标签中:

```html
<head>
    <link rel="stylesheet" href="https://pyscript.net/latest/pyscript.css" />
    <script defer src="https://pyscript.net/latest/pyscript.js"></script>
</head>
```

然后你可以在HTML页面中使用PyScript组件。PyScript目前实现了以下元素:

-   `<py-script>`: 可用于定义在网页中可执行的Python代码。元素本身不呈现给页面，只用于添加逻辑
-   `<py-repl>`: 创建一个REPL组件，该组件作为代码编辑器呈现给页面，并允许用户编写可执行代码

查看[示例目录](examples)文件夹中有关如何使用它的更多示例，您需要做的就是在Chrome中打开它们。

## 如何贡献

阅读[贡献指南](CONTRIBUTING.md)了解我们的开发过程，报告错误和改进，创建问题和提出问题。

查看[开发过程](https://docs.pyscript.net/latest/development/developing.html)文档，了解有关如何设置开发环境的更多信息。

## 资料

-   [官方文档](https://docs.pyscript.net)
-   [讨论板块](https://community.anaconda.cloud/c/tech-topics/pyscript)
-   [官方主页](https://pyscript.net/)
-   [官方博客](https://engineering.anaconda.com/2022/04/welcome-pyscript.html)
-   [Discord频道](https://discord.gg/BYB2kvyFwm)

## 提示

-   这是一个极其试验性的项目，所以请预料到可能会出现故障！
-   PyScript目前仅在Chrome上进行了测试。

## 管理

[PyScript组织管理](https://github.com/pyscript/governance)记录在一个单独的存储库中。
