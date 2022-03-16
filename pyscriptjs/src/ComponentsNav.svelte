
<script lang="ts">
  import { mainDiv, componentsNavOpen } from './stores';
  import Fa from 'svelte-fa';
  import { faArrowRight } from '@fortawesome/free-solid-svg-icons'

    let showMe = false;
    componentsNavOpen.subscribe(value => {
        showMe = value;

        console.log(showMe);
    });

    function toggleNavBar(evt){
      componentsNavOpen.set(!$componentsNavOpen);
    }

    function addPyScript(evt){
      const newPyscript = document.createElement("py-script");
      newPyscript.setAttribute('auto-generate', null);
      $mainDiv.appendChild(newPyscript);
      toggleNavBar(evt);
    }
</script>

<style>
    :global(div.slow-moves) {
        transition: 2s;
    }

    .rightsidebar-inactive {
        right: -250px;
        transition: left 2s;
    }

    .rightsidebar{
        width: 250px;
        /* transition: right 2s; */
    }

    .slide-right{
        right: 0;
        transition: right 1s;
    }
</style>

<nav id="rightsidebar" class="absolute z-10 h-full mb-6 pin-y bg-white shadow-md rightsidebar" class:rightsidebar-inactive="{ !showMe }" class:slide-right="{ showMe }">
    <div class="flex flex-column w-full text-lg p-4 bg-grey-lighter shadow-md">
        <button id="menu-switch" class="focus:outline-none" on:click={toggleNavBar}>
            <Fa icon={faArrowRight} />
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
        <a href="#" class="block px-6 py-4 w-full text-grey-darkest font-bold hover:text-white text-left text-sm no-underline"  on:click={addPyScript}>
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