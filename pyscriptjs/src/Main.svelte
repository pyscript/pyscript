<script lang="ts">
    import Fa from 'svelte-fa';
    import { faWandMagic, faPlusCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
    import SideNav from "./SideNav.svelte";
    import { onMount } from 'svelte';

    import { mainDiv } from './stores';

    // reference to the main application div
    let main;
    onMount(() => {
      // set the mainDiv in stores to point to the main div, after it has been mounted
      mainDiv.set(main);
    });

</script>

<div class="flex content-between flex-wrap min-h-full flex-grow">
  <main class="w-full p-6" bind:this={main}>
    <div role="alert" class="w-full p-2 rounded-full bg-teal-light text-teal-darker text-lg">
    </div>
  </main>

  <footer class="w-full p-6 bg-black text-white flex space-between">
      <p class="logo-title text-center">PyScript</p>
      <p class="w-full ml-6 text-center sm:text-left">Copyright &copy; 2022</p>

        <aside class="w-full sm:w-auto text-center sm:text-right">
          <a href="https://pyscript.com" title="PyScript" class="text-white block">
              <Fa icon={faInfoCircle} style="transform: scale(2);"/>
          </a>
        </aside>
  </footer>
</div>