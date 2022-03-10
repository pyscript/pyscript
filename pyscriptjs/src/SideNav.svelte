
<script lang="ts">
  import { pyodideLoaded, loadedEnvironments, navBarOpen } from './stores';
  import Fa from 'svelte-fa';
  import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

    let showNavBar = false;
    navBarOpen.subscribe(value => {
        showNavBar = value;

        console.log(showNavBar);
    });

    function toggleNavBar(evt){
        navBarOpen.set(!$navBarOpen);
    }
</script>

<style>
    :global(div.slow-moves) {
        transition: 2s;
    }

    .sidebar-inactive {
        left: -250px;
        transition: left 2s;
    }

    .sidebar{
        width: 250px;
        position: -250px
        /* transition: right 2s; */
    }

    .slide-right{
        transition: right 2s;
    }
</style>

<nav id="sidebar" class="fixed z-10 h-full mb-6 left-0 pin-y bg-white shadow-md sidebar" class:sidebar-inactive="{ !showNavBar }" class:slide-right="{ showNavBar }">
    <div class="flex flex-column w-full text-lg p-4 bg-grey-lighter shadow-md">
        <button id="menu-switch" class="focus:outline-none" on:click={toggleNavBar}>
            <Fa icon={faArrowLeft} />
        </button>
        <div>
            <h1 class="text-lg p-2 pl-6 bg-grey-lighter border-grey-light border-b text-grey-darkest">Components Catalog</h1>
        </div>
    </div>

    <ul class="list-reset">
      <li class="hover:bg-teal">
        <a href="#" class="block px-6 py-4 w-full text-grey-darkest font-bold hover:text-white text-left text-sm no-underline">
          <span class="fa fa-grip-horizontal"></span>
          REPL
        </a>
      </li>
      <li class="hover:bg-teal">
        <a href="#" class="block px-6 py-4 w-full text-grey-darkest font-bold hover:text-white text-left text-sm no-underline">
          <span class="fa fa-newspaper"></span>
          Script
        </a>
      </li>
      <li class="hover:bg-teal">
        <a href="#" class="block px-6 py-4 w-full text-grey-darkest font-bold hover:text-white text-left text-sm no-underline">
          <span class="fa fa-ellipsis-h"></span>
          Console
        </a>
      </li>
      <li class="hover:bg-teal">
        <a href="#" class="block px-6 py-4 w-full text-grey-darkest font-bold hover:text-white text-left text-sm no-underline">
          <span class="fa fa-envelope"></span>
          Div
        </a>
      </li>
      <li class="hover:bg-teal">
        <a href="#" class="block px-6 py-4 w-full text-grey-darkest font-bold hover:text-white text-left text-sm no-underline">
          <span class="fa fa-cogs"></span>
          Settings
        </a>
      </li>
    </ul>
  </nav>