# PyScript

## PyScript란?

### Summary
PyScript는 Scratch, JSFiddle 및 기타 "사용하기 쉬운" 프로그래밍 프레임워크에 대한 파이썬의 대안이며, 누구나 흥미롭고 상호작용하는 애플리케이션을 친근하고 나만의 방식대로 웹에 만드는 것을 목표로 합니다.

시작하려면 [시작 튜토리얼](docs/tutorials/getting-started.md)을 참조하세요.

예제 보기 [the pyscript folder](pyscriptjs).

### Longer Version
PyScript는 사용자가 파이썬으로 정교한 브라우저 애플리케이션을 만들 수 있게 하는 여러 오픈소스 기술들을 결합하는 것이 목표인 메타 프로젝트입니다.
PyScript는 브라우저에서 DOM이 작동하는 방식과 정교하게 결합하고 웹과 파이썬 개발자 모두가 자연스럽게 파이썬 로직을 추가할 수 있게 합니다.


## PyScript 사용하기

PyScript를 사용하려면, 다음과 같이 html 페이지에 적절한 pyscript 파일들을 import 해야 합니다.
```html
<link rel="stylesheet" href="https://pyscript.net/alpha/pyscript.css" />
<script defer src="https://pyscript.net/alpha/pyscript.js"></script>
```
이제 PyScript 컴포넌트들을 html 페이지에 사용할 수 있습니다. PyScript는 현재 다음과 같은 요소(elements)들을 구현하고 있습니다.

* `<py-script>`: 웹 페이지 내에서 실행할 수 있는 파이썬 코드를 정의하는 데 사용할 수 있습니다. 요소(element) 자체는 페이지에 렌더링되지 않으며 논리를 추가하는 데만 사용됩니다
* `<py-repl>`: 코드 편집기로 페이지에 렌더링되는 REP 구성 요소를 만들고 사용자가 실행 코드를 쓸 수 있게 합니다.

사용방법에 대한 자세한 예시는 [pyscriptjs/examples](pyscriptjs/examples) 폴더를 확인하십시오. 크롬에서 열기만 하시면 됩니다.

## Contribute

[기여하기](CONTRIBUTING.md) 문서를 참조하십시오.

## Resources

* [토론 게시판](https://community.anaconda.cloud/c/tech-topics/pyscript)
* [홈페이지](https://pyscript.net/)
* [블로그 포스팅](https://engineering.anaconda.com/2022/04/welcome-pyscript.html)

## Notes

* 이것은 매우 실험적인 프로젝트이므로, 문제가 발생할 수 있습니다!
* PyScript는 현재 크롬에서만 테스트 되었습니다.

## Governance

[PyScript organization governance](https://github.com/pyscript/governance) 는 별도의 저장소에 문서화되어 있습니다.
