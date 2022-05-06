<script lang="ts">
    import Tailwind from './Tailwind.svelte';
    import { loadInterpreter } from './interpreter';
    import { initializers, loadedEnvironments, mode, postInitializers, pyodideLoaded, scriptsQueue, globalLoader } from './stores';

    let pyodideReadyPromise;

    let loader;

    globalLoader.subscribe(value => {
        loader = value;
    });

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
            loader.remove();
        }, 3000);
    };
</script>

<style global>
    .spinner::after {
      content: '';
      box-sizing: border-box;
      width: 40px;
      height: 40px;
      position: absolute;
      top: calc(50% - 20px);
      left: calc(50% - 20px);
      border-radius: 50%;
    }

    .spinner.smooth::after {
      border-top: 4px solid rgba(255, 255, 255, 1.0);
      border-left: 4px solid rgba(255, 255, 255, 1.0);
      border-right: 4px solid rgba(255, 255, 255, 0.0);
      animation: spinner .6s linear infinite;
    }
    @keyframes spinner {
      to {transform: rotate(360deg);}
    }

    .label {
      text-align: center;
      width: 100%;
      display: block;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      font-size: 0.8rem;
      margin-top: 6rem;
    }
  </style>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js" on:load={initializePyodide}></script>
</svelte:head>

<Tailwind />
