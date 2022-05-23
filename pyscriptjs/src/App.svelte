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
        border-top: 4px solid rgba(255, 255, 255, 1);
        border-left: 4px solid rgba(255, 255, 255, 1);
        border-right: 4px solid rgba(255, 255, 255, 0);
        animation: spinner 0.6s linear infinite;
    }
    @keyframes spinner {
        to {
            transform: rotate(360deg);
        }
    }

    .label {
        text-align: center;
        width: 100%;
        display: block;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.8rem;
        margin-top: 6rem;
    }

    /* Pop-up second layer begin */

    .py-overlay {
        position: fixed;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.5);
        transition: opacity 500ms;
        visibility: hidden;
        color: visible;
        opacity: 1;
    }

    .py-overlay {
        visibility: visible;
        opacity: 1;
    }

    .py-pop-up {
        text-align: center;
        width: 600px;
    }

    .py-pop-up p {
        margin: 5px;
    }

    .py-pop-up a {
        position: absolute;
        color: white;
        text-decoration: none;
        font-size: 200%;
        top: 3.5%;
        right: 5%;
    }

    .editor-box{
        --tw-border-opacity: 1;
        border-color: rgba(209, 213, 219, var(--tw-border-opacity));
        border-width: 1px;
        position: relative;
        --tw-ring-inset: var(--tw-empty,/*!*/ /*!*/);
        --tw-ring-offset-width: 0px;
        --tw-ring-offset-color: #fff;
        --tw-ring-color: rgba(59, 130, 246, 0.5);
        --tw-ring-offset-shadow: 0 0 #0000;
        --tw-ring-shadow: 0 0 #0000;
        --tw-shadow: 0 0 #0000;
        position: relative;

        box-sizing: border-box;
        border-width: 1px;
        border-style: solid;
        border-color: rgb(209, 213, 219)
    }

    .editor-box:hover button{
        opacity: 1;
    }

    .repl-play-button{
        opacity: 0;
        bottom: 0.25rem;
        right: 0.25rem;
        position: absolute;
        padding: 0;
        line-height: inherit;
        color: inherit;
        cursor: pointer;
        background-color: transparent;
        background-image: none;
        -webkit-appearance: button;
        text-transform: none;
        font-family: inherit;
        font-size: 100%;
        margin: 0;
        text-rendering: auto;
        letter-spacing: normal;
        word-spacing: normal;
        line-height: normal;
        text-transform: none;
        text-indent: 0px;
        text-shadow: none;
        display: inline-block;
        text-align: center;
        align-items: flex-start;
        cursor: default;
        box-sizing: border-box;
        background-color: -internal-light-dark(rgb(239, 239, 239), rgb(59, 59, 59));
        margin: 0em;
        padding: 1px 6px;
        border: 0;
    }

    .repl-play-button:hover{
        opacity: 1;
    }

    /* Pop-up second layer end */
</style>

<!-- <script lang="ts">
    import Tailwind from './Tailwind.svelte';
</script> -->

<!-- <Tailwind /> -->
