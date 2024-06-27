import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import { serve, connectRedis, connectAmqp } from "./deps.js";

let sockets = {};

const redis = await connectRedis({
  hostname: "redis",
  port: 6379,
});

const CACHE_KEY = "assignments_cache";
const CACHE_EXPIRATION = 60 * 60;

const handleGetProgrammingAssignment = async (request) => {
  try {
    const cachedAssignments = await redis.get(CACHE_KEY);

    if (cachedAssignments) {
      return new Response(cachedAssignments, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      const assignments = await programmingAssignmentService.findAll();

      await redis.setex(CACHE_KEY, CACHE_EXPIRATION, JSON.stringify(assignments));

      return new Response(JSON.stringify(assignments), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error handling get programming assignments request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

const handleGetSubmissions = async (request) => {
  return Response.json(await programmingAssignmentService.findAllSubmissions());
}

const handleGetSubmissionsForAssignment = async (request, urlPatternResult) => {
  const id = urlPatternResult.pathname.groups.id;
  if (!/^\d+$/.test(id)) {
    return new Response(JSON.stringify({ error: "Bad request" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  try {
    const submissions = await programmingAssignmentService.findSpecificSubmissions(id);
    return new Response(JSON.stringify(submissions), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

const handleUpdateSubmissionStatus = async (request, urlPatternResult) => {
  const id = urlPatternResult.pathname.groups.id;
  const requestData = await request.json();
  try {
    await programmingAssignmentService.updateSubmissionStatus(id, requestData.gradingStatus, requestData.grader_feedback, requestData.correct);
    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

const handleUserCompletedTask = async(request, urlPatternResult) => {
  const userId = urlPatternResult.pathname.groups.userId;
  try {
    const assignments = await programmingAssignmentService.findAll()
    const completedTask = [];
    for (let i = 0; i < assignments.length; i++) {
      const submissions = await programmingAssignmentService.findSpecificSubmissionsOfUser(userId, assignments[i].id);
      if (submissions.some(submission => submission.correct === true)) {
        completedTask.push(i);
      }
    }
    return new Response(JSON.stringify(completedTask), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

const publishMessage = async (submission) => {
  const connection = await connectAmqp({
    hostname: 'rabbitmq'
  });
  const channel = await connection.openChannel();
  const queueName = "submissionsQueue";
  await channel.declareQueue({ queue: queueName });
  await channel.publish(
    { routingKey: queueName },
    { contentType: "application/json" },
    new TextEncoder().encode(JSON.stringify(submission)),
  );

  await connection.close();
}

const consumeMessages = async () => {
  const connection = await connectAmqp({
    hostname: 'rabbitmq'
  });
  const channel = await connection.openChannel();
  const queueName = "submissionsQueue";
  await channel.declareQueue({ queue: queueName });

  await channel.consume({ queue: queueName }, 
    async (args, props, data) => {
      if (data) {
        const submission = JSON.parse(new TextDecoder().decode(data));
        console.log(submission);
        const code = await programmingAssignmentService.findSpecificAssignment(submission.assignmentId);
        const testCode = code[0].test_code;
        const requestData = {
          testCode,
          code: submission.code,
        };

        const response = await fetch("http://grader-api:7000/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const responseData = await response.json();
        const fullId = `${submission.assignmentId}-${submission.userId}`;
        const newSubmission = await programmingAssignmentService.findSubmission(submission.assignmentId, submission.userId, submission.code);
        if (sockets[fullId]) {
          sockets[fullId].send(
            JSON.stringify({
              result: responseData.result,
              submission: newSubmission[0]
            })
          );
        }
      }

      await channel.ack({ deliveryTag: args.deliveryTag });
    }
  );
}

const handleGradingRequest = async (request) => {
  try {
    const requestData = await request.json();
    await publishMessage(requestData);

    return new Response("Grading request received", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling grading request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

const handlePostSubmission = async (request) => {
  try {
    const requestData = await request.json();
    const userSubmissions = await programmingAssignmentService.findSubmissionOfUser(requestData.userId);
    const oldSubmissions = await programmingAssignmentService.findSpecificSubmissionsOfUser(requestData.userId, requestData.assignmentId);
    const oldSubmission = oldSubmissions.find(sub => sub.code === requestData.code);
    const oldCodes = oldSubmissions.map(submission => submission.code);
    console.log(userSubmissions)
    if (userSubmissions.length > 0 && userSubmissions[userSubmissions.length - 1].status === "pending") {
      return new Response(JSON.stringify({ error: "You have already have a submission" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (oldCodes.includes(requestData.code)) {
    return new Response(JSON.stringify(oldSubmission.grader_feedback), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    }

    await programmingAssignmentService.postSubmission(
      requestData.assignmentId,
      requestData.code,
      requestData.userId
    );

    const newSubmission = await programmingAssignmentService.findSubmission(requestData.assignmentId, requestData.userId, requestData.code);

    return new Response(JSON.stringify(newSubmission), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling post submission request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

const handleWebSocket = async (request) => {
  console.log("Creating WS connection");
  const { socket, response } = Deno.upgradeWebSocket(request);
  const params = new URL(request.url).searchParams;
  const assignmentId = params.get("assignmentId");
  const userId = params.get("userId");
  const fullId = `${assignmentId}-${userId}`;
  socket.onopen = () => console.log("WS connected");
  socket.onmessage = (e) => console.log(`Received a message: ${e.data}`);
  socket.onclose = () => {
    console.log("WS closed");
    delete sockets[fullId];
  };
  sockets[fullId] = socket;
  console.log(sockets);
  return response;
}


const urlMapping = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/ws" }),
    fn: handleWebSocket,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/grade" }),
    fn: handleGradingRequest,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/submissions" }),
    fn: handlePostSubmission,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/submissions" }),
    fn: handleGetSubmissions,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/assignments" }),
    fn: handleGetProgrammingAssignment,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/submissions/:id" }),
    fn: handleGetSubmissionsForAssignment,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/completed/:userId" }),
    fn: handleUserCompletedTask,
  },
  {
    method: "PUT",
    pattern: new URLPattern({ pathname: "/submissions/:id" }),
    fn: handleUpdateSubmissionStatus,
  }
];

const handleRequest = async (request) => {
  const mapping = urlMapping.find(
    (um) => um.method === request.method && um.pattern.test(request.url)
  );

  if (!mapping) {
    return new Response("Not found", { status: 404 });
  }

  const mappingResult = mapping.pattern.exec(request.url);
  return await mapping.fn(request, mappingResult);
};

const portConfig = { port: 7777, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);

consumeMessages().catch(console.error);
