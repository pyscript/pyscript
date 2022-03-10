<script lang="ts">
  // import Button from "./Button.svelte";
  // import Logo from "./Logo.svelte";
  // import Main from "./OldMain.svelte";
  // import Header from "./OldHeader.svelte";
  import Tailwind from "./Tailwind.svelte";
  import { loadInterpreter } from './interpreter';
  import { pyodideLoaded, loadedEnvironments, navBarOpen } from './stores';
  import Main from "./Main.svelte";
  import Header from "./Header.svelte";
  import SideNav from "./SideNav.svelte";

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
    let showNavBar = false;
    let main = document.querySelector("#main");
    navBarOpen.subscribe(value => {
        showNavBar = value;
    });
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


<div class="flex flex-wrap bg-grey-light min-h-screen">
  <SideNav />

  <div id="main" class="w-full min-h-full absolute pin-r flex flex-col">
    <Header />
    <Main />
  </div>

</div>