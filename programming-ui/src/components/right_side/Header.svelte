<script>
  import { userUuid, points } from "../../stores/stores.js";
</script>

<nav class="p-4 mb-2 shadow">
  <p class="text-2xl text-gray-700 font-serif">Hello {$userUuid}!</p>
  <p class="text-2xl text-gray-700 font-serif">Points: {$points}</p>
</nav>
