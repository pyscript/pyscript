<script lang="ts">
  // import Button from "./Button.svelte";
  // import Logo from "./Logo.svelte";
  import Main from "./Main.svelte";
  import Header from "./Header.svelte";
  import Tailwind from "./Tailwind.svelte";
  import { loadInterpreter } from './interpreter';
  import { pyodideLoaded, loadedEnvironments } from './stores';

  let pyodideReadyPromise
  const initializePyodide = () =>{
    // @ts-ignore
    // pyodideLoaded.set('loaded', true);
    pyodideReadyPromise = loadInterpreter();
    // @ts-ignore
    let newEnv = {
      'id': 'a',
      'promise': pyodideReadyPromise,
      'state': 'loading',
    }
    pyodideLoaded.set(pyodideReadyPromise);
    loadedEnvironments.update((value: any): any => {
      value[newEnv['id']] = newEnv;
    });
    // let environments = loadedEnvironments;
    // debugger
  }

</script>

<svelte:head>
	<script src="https://cdn.jsdelivr.net/pyodide/v0.19.0/full/pyodide.js" on:load={initializePyodide}></script>
</svelte:head>

<style>
  :global(div.dev-buttons-group) {
    margin-top: -12px;
    z-index: 9999;
  }

  :global(div.output) {
    margin-top: -25px;
    z-index: 9999;
  }
</style>

<Tailwind />

<div class="min-h-full">
  <Header />

  <Main />

</div>