<script lang="ts">
    import Tailwind from './Tailwind.svelte';
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

<Tailwind />
