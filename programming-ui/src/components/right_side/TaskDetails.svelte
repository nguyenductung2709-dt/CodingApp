<script>
    export let task;
</script>

<div class = "flex flex-col w-full items-center bg-rose-200 h-28 border-pink-300">
    <h1 class = "mt-1 mb-4 text-3xl font-medium">{task.title}</h1>
    <p>{task.handout}</p>
</div>