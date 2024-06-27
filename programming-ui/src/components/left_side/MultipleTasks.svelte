<script>
    import { onMount } from "svelte";
    import { selectedAssignment, correctStatus, userUuid, assignments } from "../../stores/stores";
    import TaskComponent from "./TaskComponent.svelte";
    
    let completedTasks = [];
    
    const changeSelectedAssignment = async (assignment) => {
        selectedAssignment.set(assignment);
        console.log($selectedAssignment);
    }

    const fetchAssignment = async () => {
        const response = await fetch("/api/assignments", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();
        assignments.set(data); // Reassign to trigger reactivity

        const responseNew = await fetch(`/api/completed/${$userUuid}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const dataNew = await responseNew.json();
        completedTasks = dataNew;
        console.log(completedTasks);

        correctStatus.set(new Array($assignments.length).fill(false));
        correctStatus.update((status) => {
            completedTasks.forEach((task) => {
                status[task] = true;
            });
            return status;
        });
    };
    console.log($correctStatus)
    
    onMount(fetchAssignment);
</script>

<div class = "py-2 flex basis-1/5 flex-col overflow-y-auto bg-rose-200 h-screen">
    {#each $assignments as assignment}
        <div on:click={() => changeSelectedAssignment(assignment)}>
            <TaskComponent task={assignment} correct={$correctStatus}/>
        </div>
    {/each}
</div>
