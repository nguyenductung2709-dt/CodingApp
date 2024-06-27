import { readable, writable } from "svelte/store";

let user = localStorage.getItem("userUuid");
if (!user) {
  user = crypto.randomUUID().toString();
  localStorage.setItem("userUuid", user);
}

let pointsGet = localStorage.getItem("points");
if (!pointsGet) {
  pointsGet = 0;
  localStorage.setItem("points", pointsGet);
} else {
  pointsGet = Number(pointsGet);
}

async function fetchPoints() {
  try {
    const responseNew = await fetch(`/api/completed/${user}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const dataNew = await responseNew.json();
    points.update(() => dataNew.length * 100);
    localStorage.setItem("points", dataNew.length * 100);
  } catch (error) {
    console.error("Error fetching points:", error);
  }
}

fetchPoints(); 

export const points = writable(pointsGet);
export const userUuid = readable(user);
export const selectedAssignment = writable(null);
export const correctStatus = writable([]);
export const assignments = writable([]);
