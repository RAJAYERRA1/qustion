const express = require("express");

const path = require("path");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();

app.use(express.json());

const { format, isValid, parseISO } = require("date-fns");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const startingServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

startingServer();

function formatDate(date) {
  const formattedDate = format(new Date(date), "yyyy-MM-dd");
  return formattedDate;
}

// /todos/:todoId/

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { todo, priority, status, category, dueDate } = todoDetails;
  console.log(todoId);

  if (
    todo !== "" &&
    priority === undefined &&
    status === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    const addTodoQuery = `
    UPDATE 
      todo 
    SET
      todo = '${todo}'
    WHERE 
      id = ${todoId}`;

    await db.run(addTodoQuery);

    response.send("Todo Updated");
  } else if (
    todo === undefined &&
    priority !== "" &&
    status === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    if (
      (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") ===
      false
    ) {
      response.status(400).send("Invalid Todo Priority");
    } else {
      const addTodoQuery = `
    UPDATE 
      todo 
      SET
         
         priority ='${priority}'
        
      WHERE 
      id = ${todoId};`;

      await db.run(addTodoQuery);

      response.send("Priority Updated");
    }
  } else if (
    todo === undefined &&
    priority === undefined &&
    status !== "" &&
    category === undefined &&
    dueDate === undefined
  ) {
    if (
      (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") ===
      false
    ) {
      response.status(400).send("Invalid Todo Status");
    } else {
      const addTodoQuery = `
    UPDATE 
      todo 
      SET
        status= '${status}'
      WHERE 
      id = ${todoId};`;

      await db.run(addTodoQuery);

      response.send("Status Updated");
    }
  } else if (
    todo === undefined &&
    priority === undefined &&
    status === undefined &&
    category !== "" &&
    dueDate === undefined
  ) {
    if (
      (category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING") === false
    ) {
      response.status(400).send("Invalid Todo Category");
    } else {
      const addTodoQuery = `
    UPDATE 
      todo 
      SET
         
        category= '${category}'
      WHERE 
      id = ${todoId};`;

      await db.run(addTodoQuery);

      response.send("Category Updated");
    }
  } else if (
    todo === undefined &&
    priority === undefined &&
    status === undefined &&
    category === undefined &&
    dueDate !== ""
  ) {
    const newDate = parseISO(formatDate(dueDate));
    if (isValid(newDate)) {
      const addTodoQuery = `
    UPDATE 
      todo 
    SET
      due_date = '${newDate}'
    WHERE 
      id = ${todoId};`;

      await db.run(addTodoQuery);

      response.send("Due Date Updated");
    } else {
      response.status(400).send("Invalid Due Date");
    }
  }
});

// delete
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const deleteQuery = `
    DELETE 
    FROM
     todo
    WHERE
    id=${todoId};`;

  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

// /todos/:todoId/
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
    id=${todoId};`;

  const todoResponse = await db.get(todoQuery);
  response.send(todoResponse);
});

// /todos/
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { todo, id, priority, status, category, dueDate } = todoDetails;
  const newDate = formatDate(dueDate);

  if (
    (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") ===
    false
  ) {
    response.status(400).send("Invalid Todo Priority");
  } else if (
    (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") ===
    false
  ) {
    response.status(400).send("Invalid Todo Status");
  } else if (
    (category === "WORK" || category === "HOME" || category === "LEARNING") ===
    false
  ) {
    response.status(400).send("Invalid Todo Category");
  } else if (!isValid(parseISO(newDate))) {
    response.status(400).send("Invalid Due Date");
  } else {
    const addTodoQuery = `
    INSERT INTO
      todo ( id,todo, priority, status,category,due_date)
    VALUES
      (
         ${id},
         '${todo}',
         '${priority}',
         '${status}',
         '${category}',
         '${newDate}'
      );`;

    await db.run(addTodoQuery);

    response.send("Todo Successfully Added");
  }
});

// /agenda/

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const n = formatDate(date);

  try {
    const newDate = parseISO(formatDate(date));
    if (!isValid(newDate)) {
      throw new Error("Invalid Due Date");
    }

    const todoQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
    due_date='${n}';`;
    const todoResponse = await db.get(todoQuery);
    if (todoResponse.length === 0) {
      response.status(400).send("Invalid Due Date");
    } else {
      response.send(todoResponse);
    }
  } catch (error) {
    response.status(400).send("Invalid Due Date");
  }
});

// /todos/
app.get("/todos/", async (request, response) => {
  const { search_q, priority, status, category, dueDate } = request.query;
  if (
    search_q === undefined &&
    priority === undefined &&
    status !== "" &&
    category === undefined &&
    dueDate === undefined
  ) {
    const todoQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
    status='${status}';`;

    const todoResponse = await db.all(todoQuery);
    if (todoResponse.length === 0) {
      response.status(400).send("Invalid Todo Status");
    } else {
      response.send(todoResponse);
    }
  } else if (
    search_q === undefined &&
    priority !== "" &&
    status === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    const todoQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
    priority='${priority}';`;

    const todoResponse = await db.all(todoQuery);
    if (todoResponse.length === 0) {
      response.status(400).send("Invalid Todo Priority");
    } else {
      response.send(todoResponse);
    }
  } else if (
    search_q === undefined &&
    priority !== "" &&
    status !== "" &&
    category === undefined &&
    dueDate === undefined
  ) {
    const todoQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
    priority='${priority}' AND status='${status}';`;

    const todoResponse = await db.all(todoQuery);
    response.send(todoResponse);
  } else if (
    search_q !== "" &&
    priority === undefined &&
    status === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    const todoQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
      todo LIKE '%${search_q}%';`;

    const todoResponse = await db.all(todoQuery);
    response.send(todoResponse);
  } else if (
    search_q === undefined &&
    priority === undefined &&
    status === undefined &&
    category !== "" &&
    dueDate === undefined
  ) {
    const todoQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
    category='${category}' ;`;

    const todoResponse = await db.all(todoQuery);
    if (todoResponse.length === 0) {
      response.status(400).send("Invalid Todo Category");
    } else {
      response.send(todoResponse);
    }
  } else if (
    search_q === undefined &&
    priority === undefined &&
    status !== "" &&
    category !== "" &&
    dueDate === undefined
  ) {
    const todoQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
    category='${category}' AND status='${status}' ;`;

    const todoResponse = await db.all(todoQuery);
    response.send(todoResponse);
  } else if (
    search_q === undefined &&
    priority !== undefined &&
    status === undefined &&
    category !== undefined &&
    dueDate === undefined
  ) {
    const todoQuery = `
    SELECT
      *
    FROM
     todo
    WHERE
    category='${category}' AND  priority='${priority}' ;`;

    const todoResponse = await db.all(todoQuery);
    response.send(todoResponse);
  }
});

module.exports = app;

