<script lang="ts">
  // import Button from "./Button.svelte";
  // import Logo from "./Logo.svelte";
  import Main from "./Main.svelte";
  import Header from "./Header.svelte";
  import Tailwind from "./Tailwind.svelte";
</script>

<style>
  :global(div.dev-buttons-group) {
    margin-top: -12px;
    z-index: 9999;
  }
</style>

<Tailwind />

<div class="min-h-full">
  <Header />

  <Main />

</div>