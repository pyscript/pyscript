<script lang="ts">
    import Fa from 'svelte-fa';
    import { faWandMagic, faPlusCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
    import SideNav from "./SideNav.svelte";

</script>

<div class="flex content-between flex-wrap min-h-full flex-grow">
  <main class="w-full p-6">
    <div role="alert" class="w-full p-2 rounded-full bg-teal-light text-teal-darker text-lg">
      <py-script auto-generate target="page:mydiv" source='./mycode.py'>
          sum([1, 2, 3, 4, 5])
        </py-script>
    </div>
  </main>

  <footer class="w-full p-6 bg-black text-white flex space-between">
      <p class="logo-title text-center">PyScript</p>
      <p class="w-full ml-6 text-center sm:text-left">Copyright &copy; 2019</p>

        <aside class="w-full sm:w-auto text-center sm:text-right">
          <a href="https://github.com/SlawomirChabowski" title="My Github page" class="text-white block">
              <Fa icon={faInfoCircle} style="transform: scale(2);"/>
          </a>
        </aside>
  </footer>
</div>