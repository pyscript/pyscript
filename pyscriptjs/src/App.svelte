<script lang="ts">

  import Fa from 'svelte-fa';
  import { faPlusCircle } from '@fortawesome/free-solid-svg-icons'
  import Tailwind from "./Tailwind.svelte";
  import { loadInterpreter } from './interpreter';
  import { pyodideLoaded, loadedEnvironments, navBarOpen } from './stores';
  import Main from "./Main.svelte";
  import Header from "./Header.svelte";
  import SideNav from "./SideNav.svelte";

  let iconSize = 2;
  let pyodideReadyPromise

  function bumpSize(evt){
    iconSize = 4;
  }

  function downSize(evt){
    iconSize = 2;
  }

  const initializePyodide = () =>{
    // @ts-ignore
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
  <div>
    <SideNav />
  </div>
  <div id="main" class="w-full min-h-full absolute pin-r flex flex-col">
    <Header />
    <div id="add-component" class="lex flex-column w-full text-lg">
      <div style="margin-left: 50%;" on:mouseenter={bumpSize} on:mouseleave={downSize}>
        <Fa icon={faPlusCircle} class="grow-icon"style="transform: scale({iconSize});"/>
      </div>
    </div>
    <Main />
  </div>
</div>