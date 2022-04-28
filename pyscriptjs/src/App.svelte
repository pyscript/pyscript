<script lang="ts">
    import Tailwind from './Tailwind.svelte';
    import { loadInterpreter } from './interpreter';
    import {
        initializers,
        loadedEnvironments,
        mode,
        postInitializers,
        pyodideLoaded,
        scriptsQueue,
    } from './stores';

    let pyodideReadyPromise;

    const initializePyodide = async () => {
        pyodideReadyPromise = loadInterpreter();
        const pyodide = await pyodideReadyPromise;
        let newEnv = {
            id: 'a',
            promise: pyodideReadyPromise,
            runtime: pyodide,
            state: 'loading',
        };
        pyodideLoaded.set(pyodide);

        loadedEnvironments.update((value: any): any => {
            value[newEnv['id']] = newEnv;
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
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js" on:load={initializePyodide}></script>
</svelte:head>

<Tailwind />
