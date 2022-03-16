
<script lang="ts">
  import { mainDiv, componentsNavOpen, componentDetailsNavOpen, currentComponentDetails } from './stores';
  import Fa from 'svelte-fa';
  import { faArrowRight, faL } from '@fortawesome/free-solid-svg-icons'

    let showMe = false;
    componentDetailsNavOpen.subscribe(value => {
        showMe = value;

        console.log(showMe);
    });

    currentComponentDetails.subscribe(value => {
      
    })

    function toggleNavBar(evt){
      componentDetailsNavOpen.set(!$componentDetailsNavOpen);
      if ($componentDetailsNavOpen == true && $componentDetailsNavOpen == $componentsNavOpen ){
        componentsNavOpen.set(false);
      }
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
        right: -300px;
        transition: left 2s;
    }

    .rightsidebar{
        width: 300px;
        /* transition: right 2s; */
    }

    .slide-right{
        right: 0;
        transition: right 1s;
    }
    
</style>

<nav id="component-detail-bar" class="absolute z-10 h-full mb-6 pin-y bg-white shadow-md rightsidebar" class:rightsidebar-inactive="{ !showMe }" class:slide-right="{ showMe }">
  <div class="flex flex-column w-full text-lg p-4 bg-grey-lighter shadow-md">
      <button id="menu-switch" class="focus:outline-none" on:click={toggleNavBar}>
          <Fa icon={faArrowRight} />
      </button>
      <div>
          <h1 class="text-lg p-2 pl-6 bg-grey-lighter border-grey-light border-b text-grey-darkest">Component Details</h1>
      </div>
  </div>
  <form>
  <table class="table-fixed">
    <thead>
      <tr>
        <th class="text-left">Property</th>
        <th class="text-right">Value</th>
      </tr>
    </thead>
    <tbody>
      
    {#each $currentComponentDetails as attribute}
    <tr>
        <td>{attribute.key}</td>
        <td> <input  class="text-right" placeholder={attribute.value} value="{attribute.value}"></td>
      </tr>
    {/each}

    
    </tbody>
  </table>
</form>
</nav>