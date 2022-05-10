<script lang="ts">
    import Tailwind from './Tailwind.svelte';
    import { loadInterpreter } from './interpreter';
    import type { AppConfig } from './components/pyconfig';
    import { initializers, loadedEnvironments, mode, postInitializers, pyodideLoaded, scriptsQueue, globalLoader, appConfig } from './stores';

    let pyodideReadyPromise;

    let loader;
    let appConfig_: AppConfig = {
        autoclose_loader: true,
    };

    globalLoader.subscribe(value => {
        loader = value;
    });

    appConfig.subscribe( (value:AppConfig) => {
        if (value){
            appConfig_ = value;
        }
        console.log("config set!")
    });

    const initializePyodide = async () => {
        loader.log("Loading runtime...")
        pyodideReadyPromise = loadInterpreter();
        const pyodide = await pyodideReadyPromise;
        const newEnv = {
            id: 'a',
            promise: pyodideReadyPromise,
            runtime: pyodide,
            state: 'loading',
        };
        pyodideLoaded.set(pyodide);

        // Inject the loader into the runtime namespace
        pyodide.globals.set("pyscript_loader", loader);

        loader.log("Runtime created...")
        loadedEnvironments.update((value: any): any => {
            value[newEnv['id']] = newEnv;
        });

        // now we call all initializers before we actually executed all page scripts
        loader.log("Initializing components...")
        for (let initializer of $initializers) {
            await initializer();
        }

        // now we can actually execute the page scripts if we are in play mode
        loader.log("Initializing scripts...")
        if ($mode == 'play') {
            for (let script of $scriptsQueue) {
                await script.evaluate();
            }
            scriptsQueue.set([]);
        }

        // now we call all post initializers AFTER we actually executed all page scripts
        loader.log("Running post initializers...");

        if (appConfig_ && appConfig_.autoclose_loader) {
            loader.close();
            console.log("------ loader closed ------");
        }

        setTimeout(async () => {
            for (let initializer of $postInitializers) {
                await initializer();
            }
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
      top: calc(40% - 20px);
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
      font-size: 0.8rem;
      margin-top: 6rem;
    }
  </style>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js" on:load={initializePyodide}></script>
</svelte:head>

<Tailwind />
