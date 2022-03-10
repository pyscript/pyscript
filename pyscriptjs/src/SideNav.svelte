
<script lang="ts">
  import { pyodideLoaded, loadedEnvironments, navBarOpen } from './stores';

  
//   let menuSwitch = document.querySelector("#menu-switch"),
// sidebar = document.querySelector("#sidebar"),
// main = document.querySelector("#main");
    let showNavBar = false;
  navBarOpen.subscribe(value => {
    showNavBar = value;

    console.log(showNavBar);
});
console.log("showNav");
console.log(showNavBar);
</script>

<style>
    :global(div.slow-moves) {
        transition: 0.3s;
    }

    .sidebar-inactive {
        transform: translateX(-100%);
    }

</style>

<nav id="sidebar" class="fixed z-10 pin-y bg-grey-lightest shadow-md w-full slow-moves sm:w-1/3 lg:w-1/4" class:sidebar-inactive="{ !showNavBar }">

    <h1 class="text-lg p-6 bg-grey-lighter border-grey-light border-b text-grey-darkest">Components Catalog</h1>

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