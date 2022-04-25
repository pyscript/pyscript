<style>
    :global(div.buttons-box) {
        margin-top: -25px;
    }

    :global(.parentBox:hover .buttons-box) {
        visibility: visible;
    }
</style>

<script lang="ts">
    import Tailwind from './Tailwind.svelte';
    import { loadInterpreter } from './interpreter';
    import {
        componentsNavOpen,
        initializers,
        loadedEnvironments,
        mode,
        navBarOpen,
        postInitializers,
        pyodideLoaded,
        scriptsQueue,
    } from './stores';

    let iconSize = 2;
    let pyodideReadyPromise;

    function bumpSize(evt) {
        iconSize = 4;
    }

    function downSize(evt) {
        iconSize = 2;
    }

    const initializePyodide = async () => {
        pyodideReadyPromise = loadInterpreter();
        let newEnv = {
            id: 'a',
            promise: pyodideReadyPromise,
            state: 'loading',
        };
        pyodideLoaded.set(pyodideReadyPromise);
        loadedEnvironments.update((value: any): any => {
            value[newEnv['id']] = newEnv;
        });

        let showNavBar = false;
        let main = document.querySelector('#main');
        navBarOpen.subscribe(value => {
            showNavBar = value;
        });

        // now we call all initializers before we actually executed all page scripts
        for (let initializer of $initializers) {
            await initializer();
        }

        // now we can actually execute the page scripts if we are in play mode
        if ($mode == 'play') {
            for (let script of $scriptsQueue) {
                script.evaluate();
            }
            scriptsQueue.set([]);
        }

        // now we call all post initializers AFTER we actually executed all page scripts
        setTimeout(() => {
            for (let initializer of $postInitializers) {
                initializer();
            }
        }, 3000);
    };

    function toggleComponentsNavBar(evt) {
        componentsNavOpen.set(!$componentsNavOpen);
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js" on:load={initializePyodide}></script>
</svelte:head>

<Tailwind />
