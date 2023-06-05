# pyscript

[![build](https://github.com/WebReflection/python/actions/workflows/node.js.yml/badge.svg)](https://github.com/WebReflection/python/actions/workflows/node.js.yml) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/python/badge.svg?branch=api&t=1RBdLX)](https://coveralls.io/github/WebReflection/python?branch=api)

- - -

## API

Please check the PR around current API and help me out changing or improving it, thank you!
https://github.com/WebReflection/python/blob/c50ab771ffb14d2fbb499219d67200cf02e0cd5f/API.md

- - -

### Development

The working folder (source code of truth) is the `./esm` one, while the `./cjs` is populated as dual module and to test (but it's 1:1 code, no trnaspilation except for imports/exports).

Please be sure the following line is prsent in your `.git/hooks/pre-commit` file to always test and check coverage before committing.

```sh
exec npx c8 --100 npm test > /dev/null
```

- - -

The goal of this repository is to explore a few *PyScript* related topics, such as:

  * **bootstrap time**: do we need to do everything we currently do by default?
  * **ESM / npm module**: why are we still attaching things to the global?
  * **dependencies**: do we need to include a whole *TOML* v0.4 parser by default?
  * **DX / UX**: what if we simplify most pain points we already know while solving all problems we also will or already have moving forward?
  * **YAGNI**: thoughts about current features that look more like a workaround

Following each topic is discussed with findings, ideas, and proof of concepts.

## Bootstrap Time

Once bundled, the current PoC weigths **2.7K** (~1K compressed) as opposite of current *pyscript.js* which is **1.2MB** (~230K compressed).
By no mean the current PoC can replace all *pyscript.js* features, but I believe a smaller and better architected core could help creating even more projects around our offer.

**Notable findings**

  * even if no `<py-config>` is defined, we include a whole TOML library and we import *micropip*, *pyparsing* and *pypackaging* for an "*Hello World*"
  * there's a lot of code which only goal is to handle *HTML* issues with parsed content and entities and *IDs*. This PoC never uses, neither needs, *IDs* at all and it makes any target avilable within the Python code instead of needing to have discoverable *IDs* (see recent MR around *IDs* in Shadow DOM too) ... should we re-consider the need for *IDs* and drop all the code around this topic in the (hopefully) near future?
  * there's no need to normalize any *python* output with the usage of `<script>` because if the indentation is not broken the interpreter works just fine (this is extra code we could just remove from our codebase)
  * despite our possible improvements around previous point, the "*elephant in the room*" is *pyodide* initialization time. We can save bandwidth and some millisencods but the main thread is blocked for ~1.5 seconds when *pyodide* kicks in. Is there anything we can do to at least move its initialization elsewhere? (e.g. *Worker*)
  * adding a *cache all* strategy for an extremely simple *Service Worker* made bootstrap time predictable, either via this PoC or via *pyscript*. Is there any particular reason we are not using a *Service Worker* everywhere we offer or demo *pyscript*?
  * once initialized, both *pyodide* and *micropython* expose the version ... why do we attach a version before loading these runtimes?

## As ESM / `npm` module

Both *pyscript*, current *micropython* file, and (IIRC) *pyodide* leak something on the *global* context. Not only this is generally considered a bad practice but it also plays badly with the idea that multiple interpreters *could* coexist in the same page (already possible with this PoC).

Not being a module also means we don't get to benefit from easy install and all *CDNs* that for free would allow any developer to use our offer in the wild, including local projects bootstrapped via all the usual/common Web related tools.

What would it take to actually use *pyscript* as a module or why are we still using these fairly outdated and problematic/conflicting practices instead?

## Dependencies

We all agree that *TOML* is likely the preferred choice for Python users to setup the environment but it's not clear why we need to embed a 3rd party fork that parses the whole *TOML* standard within our code out of the box, or why we do initialize a package manager when it's not even needed, asking the core to download extra stuff by default even for cases such stuff was not desired nor required.

Accordingly, if there's no particular reason I am not aware about, should we include via dynamic `import` the *TOML* parser **and** botstrap `micropip` and the rest only if the config exists and not by default?

If it has to be there by default, why isn't the package manager already embedded within *pyodide* or *micropython* (`mip`) and initialized internally?

Last, but not least, as our config consist of 3 or 4 fields and nothing else, do we really need a whole TOML 3rd party parer instead of a super-simple one that just gets the job done, in case we want to embed that in core? Reading *config*'s specs it feels like we're slightly overdoing it in there and we also have issues with the config order (which btw could also be the case for JSON configurations).

## DX / UX

We currently have (imho) some hard to explain limitation around *pyscript*, most notably:

  * we have a `<py-config>` custom element where only a single one can be used and everything else is ignored. The reasons for this (I am guessing) are:
    * we have a single interpreter at the time ... but how would this scale when multiple interpreteres are wanted/desired?
    * there's no relation between a `<py-config>` and a `<py-script>` element ... even their definition order on the page doesn't matter so that if multiple `<py-script>` on a page have as last node a `<py-config>` they all follow that rule, making it impossible to grant either runtime or config per each `<py-script>`. Aren't we trapped by this decoupling of components that are, in fact, strongly coupled and constrained by such *implicit* coupling? What's the plan forward here?
  * in all our live examples but 2 all we need is *a single `<py-script>` tag and, occasionally, a single `<py-config>` tag and I wonder if this is effectily the main use-case to address, while the need for multiple `<py-script>` that all share same config and environment look like needed only to display results in different places of the page, something easy to address via IDs when elements are well known or via the `js.document.querySelector(...)` API we expose through *pyodide* and *micropython*. Shouldn't we instead find a better way to relate same env when more `<py-script>` are meant, so that we bootstrap only one *main* env and we refer to such *env* via attributes?
  * there's no way to display Python results within `<py-script>` custom element if this is within unexpected places: tables, trs, tds, options, sources, and what's not, current PoC offers an escape hatch to assign the target at runtime without any of the caveats we have with custom elements
  * we recently introduced `py-*` events for any node but that implicitly blocks multiple runtimes per page ... should we find a compromise/solution to this, since the `env` attribute could be used as `py-env` target too?

The current PoC couple *env* and *config* through a single component, isolating every script, runtime, and environment from each other.

Not only that, multiple *python scripts* can share the same configuration whenever that's desired and in multiple pages or different parts of the page but these don't necessarily need to share the same environment.

The current PoC indeed allows multiple config and multiple interpreters (*pyodide* or *micropython*) per page, downloading each only once but initializing these per each *script* when desired.

A unique identifier, that is not an ID, could also relate each script to the same env as it's done now (shared *pyodide* runtime across all *py-script* tags) but that'd be an extra feature, not the default, and it can be orchestrated explicitly, example

```html
<script type="py" config="shared-demo.toml">
  from js import document
  # target here is the related current script node
  document.currentScript.target.textContent = 'a'
</script>
<hr>
<script type="py" env="shared-env">
  # this env shares nothing with the previous/default one
  from js import document
  # target here is the related current script node
  # which is different from the previous one
  document.currentScript.target.textContent = 'b'
</script>
<hr>
<script type="py" env="shared-env">
  # this env shares globals only with the previous script
  from js import document
  # target here is the related current script node
  # which is also again different from the previous one
  document.currentScript.target.textContent = 'c'
</script>
```

I (personally) believe that optionally coupling *env*, *config*, and *runtime* to each single script provides the base to distribute *pyscript* components in the wild and without ever causing issues, so in few words this is not only a more robust and clean approach to what we have already, where two 3rd party *pyscript* components can't coexist within the same page because of the points previously mentioned, but it's way more expicit than having multiple `<py-config>` potentially ignored by the page because one was already present / parsed / used within another component that landed before.

## YAGNI

This is a super-personal take around current *pyscript* state of affairs:

  * the splash screen reminds me good'ol days with Flash Player ... ideally we should have a fast boostrap that makes such practice irrelevant
  * the `interpreters` in the config, when only a config can run, is weird to say the least ... it's theoretically an array of details, with names and stuff, and I think nobody cares about it ... the current `runtime` attribute looks much easier to explain and reason about, plus, as previously mentioned, is confined within the *script* that is running current python code
  * the whole TOML parser for our explicit use case looks like replace-able with a single RegExp or a split line loop (see https://github.com/WebReflection/basic-toml#readme)
  * plugins should never be embedded out of the box ... we might want to provide a list of plugins via a `plugins` attribute and handle these ourselves but I think that having a `@pyscript/core` module any plugin can use to register itself would be better at scale and architecture
