<script lang="ts">
    import Fa from 'svelte-fa';
    import { faCog, faBars, faPlay, faTimes } from '@fortawesome/free-solid-svg-icons'
    import { pyodideLoaded, loadedEnvironments, navBarOpen } from './stores';

    export let name = "PyScript";

    let showNavBar = false;
    navBarOpen.subscribe(value => {
        showNavBar = value;

        console.log(showNavBar);
        toggleSidebar();
    });

    function toggleNavBar(evt){
        navBarOpen.set(!$navBarOpen);
    }
  

    function toggleSidebar() {
        let menuSwitch = document.querySelector("#menu-switch"),
        sidebar = document.querySelector("#sidebar"),
        main = document.querySelector("#main");

        let classesToApplyForSidebar = {
            active: [],
            inactive: ["sidebar-inactive"]
        },
        classesToApplyForMain = {
            active: ["sm:w-2/3", "lg:w-3/4", 'main-squeezed'],
            inactive: []
        },
        classesToApplyForMenuButton = {
            active: ["fa-times-circle", "text-red-light"],
            inactive: ["fa-bars"]
        };

        // let isMenuActive = menuSwitch.getAttribute("data-menu-active") === "true";

        if (!menuSwitch){
            return;
        }
        if (!showNavBar) {
            // menuSwitch.setAttribute("data-menu-active", null);

            menuSwitch.children[0].classList.remove(
            ...classesToApplyForMenuButton.active
        );
            menuSwitch.children[0].classList.add(
                ...classesToApplyForMenuButton.inactive
        );

        sidebar.classList.remove(...classesToApplyForSidebar.active);
        sidebar.classList.add(...classesToApplyForSidebar.inactive);

        main.classList.remove(...classesToApplyForMain.active);
        main.classList.add(...classesToApplyForMain.inactive);
        } else {
        // menuSwitch.setAttribute("data-menu-active", true);

        menuSwitch.children[0].classList.add(
            ...classesToApplyForMenuButton.active
        );
        menuSwitch.children[0].classList.remove(
            ...classesToApplyForMenuButton.inactive
        );

        sidebar.classList.add(...classesToApplyForSidebar.active);
        sidebar.classList.remove(...classesToApplyForSidebar.inactive);

        main.classList.add(...classesToApplyForMain.active);
        main.classList.remove(...classesToApplyForMain.inactive);
        }
    }
</script>

<style>
    :global(div.main-squeezed) {
        transform: translateX(33.3333%);
    }

    :global(.logo-title){
        font-family: FreeMono, monospace;
    }
</style>

<aside id="navbar" class="flex flex-column w-full text-lg p-6 bg-grey-lighter shadow-md slow-moves">
    <button id="menu-switch" class="focus:outline-none" on:click={toggleNavBar}>
        <div class:hidden={showNavBar}>
            <Fa icon={faBars} />
        </div>
        <div class:hidden={!showNavBar}>
            <Fa icon={faTimes} color="red" />
        </div>
    </button>
    <p class="w-full logo-title text-center">{name}</p>
    <div class="flex flex-column">
        <button class="mr-6">
            <Fa icon={faPlay} color="black" />
        </button>
        <button class="">
            <Fa icon={faCog} color="black" />
        </button>
    </div>
</aside>