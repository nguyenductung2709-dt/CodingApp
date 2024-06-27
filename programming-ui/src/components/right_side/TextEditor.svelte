<script>
  import { userUuid, selectedAssignment, correctStatus, assignments, points } from "../../stores/stores.js";
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';

  let text = '';
  let pending = false;
  let socket;

  const createWebSocketConnection = (assignmentId, userId) => {
      socket = new WebSocket(`ws://${window.location.host}/api/ws?assignmentId=${assignmentId}&userId=${userId}`);
      
      socket.onopen = () => console.log("WebSocket connection established");
      socket.onmessage = handleMessage;
      socket.onclose = () => {
          console.log("WebSocket connection closed");
      };
      socket.onerror = (error) => console.error("WebSocket error:", error);
  }

  const handleMessage = async(messageData) => {
      const message = JSON.parse(messageData.data);
      const result = message.result;
      const submission = message.submission;
      if (message) {
        pending = false;
      }
      if (result && submission) {
        alert(result);
        const correct = result.includes('OK') && /Ran (\d+) test/.test(result) && parseInt(result.match(/Ran (\d+) test/)[1]) >= 1;
        const feedbackData = {
            gradingStatus: "processed",
            grader_feedback: result,
            correct: correct
          }
        await fetch(`/api/submissions/${submission.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(feedbackData),
          });
        if (correct) {
          correctStatus.update((status) => {
            status[get(selectedAssignment).assignment_order - 1] = true;
            return status;
          });
          selectedAssignment.set($assignments[get(selectedAssignment).assignment_order]);
          text = ''
          
          const responseNew = await fetch(`/api/completed/${$userUuid}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
          });
          const dataNew = await responseNew.json();
          points.update(() => dataNew.length * 100);
          localStorage.setItem("points", dataNew.length * 100);
        }
      }
  }

  const doSimpleGradingDemo = async () => {
    pending = true;
    const initialSubmissionData = {
      assignmentId: get(selectedAssignment).id,
      userId: get(userUuid),
      code: text,
    };

    try {
      createWebSocketConnection(get(selectedAssignment).id, get(userUuid));

      const firstResponse = await fetch("/api/submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(initialSubmissionData),
        });

      if (firstResponse.status === 400) {
        alert(await firstResponse.json())
        pending = false;
        text = '';
        selectedAssignment.set($assignments[get(selectedAssignment).assignment_order]);
        return;
      }

      if (firstResponse.status === 404) {
        alert("You already have another submission")
        pending = false;
        return;
      }

      await fetch("/api/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(initialSubmissionData),
      });
    } catch (error) {
      console.error("Error during grading:", error);
    }
  };
</script>

<textarea id = "codeBox" bind:value={text} class="block w-full h-5/6 text-lg text-gray-900 bg-rose-50 border-pink-300 rounded-lg border p-2" placeholder="Write your code here"></textarea>

{#if pending}
  <div class="flex items-center justify-center">
    <div class="loader w-9 h-9 border-4 border-gray-200 border-t-[#09f] rounded-full animate-spin"></div>
    <span class="ml-2">Pending...</span>
  </div>
{/if}

<button
  class="bg-blue-500 hover:bg-blue-700 h-20 w-40 text-white font-bold rounded m-4"
  on:click={doSimpleGradingDemo}
  disabled={pending}
>
  Submit for grading
</button>

<style>
  .loader {
    animation: spin 1s ease infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
