<script lang="ts">
  import {EditorState, EditorView , basicSetup} from "@codemirror/basic-setup"

  import { python } from "@codemirror/lang-python"
  import { keymap } from "@codemirror/view";
  import { defaultKeymap } from "@codemirror/commands";
  import { oneDarkTheme } from "@codemirror/theme-one-dark";


</script>
  <header class="bg-white shadow">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
    </div>
  </header>
  <main>
    <div  class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Replace with your content -->
      <div class="px-4 py-6 sm:px-0">
        <div id="dashboard" class="border-4 border-dashed border-gray-200 rounded-lg h-96">
          <py-script>
            sum([1, 2, 3, 4, 5])
          </py-script>
    

        </div>
      </div>

      

      <!-- /End replace -->
    </div>
  </main>