<script>
    import { selectedAssignment } from "../../stores/stores";
    import TaskDetails from "./TaskDetails.svelte";
    import TextEditor from "./TextEditor.svelte";
    import Header from "./Header.svelte";
</script>

<div class="flex basis-4/5 flex-col gap-4 items-center bg-rose-100 w-full">
    <Header/>
    {#if $selectedAssignment}
        <TaskDetails task={$selectedAssignment} />
        <TextEditor />
    {/if}
</div>