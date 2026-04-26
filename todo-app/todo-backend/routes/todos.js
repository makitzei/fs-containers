const express = require('express');
const { Todo } = require('../mongo');
const router = express.Router();
const { createClient } = require('redis');
const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => {
  console.error("Redis Client Error", err);
});

async function initRedis() {
  await client.connect();
}

initRedis();

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos);
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
  try {
    const todo = await Todo.create({
      text: req.body.text,
      done: false
    });

    client.incr('todos:added_todos').catch(console.error);

    res.status(201).json(todo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add a new todo'})
  }
  

  
});

// const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  req.todo = await Todo.findById(id)
  if (!req.todo) return res.sendStatus(404)

  next()
}

/* GET added todos. */
router.get('/statistics', async (req, res) => {
  try{
    const new_todos = Number(await client.get('todos:added_todos')) || 0
    res.json({
      added_todos: new_todos
    });  
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
});

/* DELETE todo. */
router.delete('/:id', findByIdMiddleware, async (req, res) => {
  await req.todo.deleteOne()  
  res.sendStatus(200);
});

/* GET todo. */
router.get('/:id', findByIdMiddleware, async (req, res) => {
  res.json(req.todo);
});

/* PUT todo. */
router.put('/:id', findByIdMiddleware, async (req, res) => {
  try{
    const text = req.body.text
    const done = req.body.done

    if (text !== undefined) {
      req.todo.text = text
    }

    if (done !== undefined) {
      req.todo.done = done
    }
      
    const updated = await req.todo.save();
    res.json(updated);
  } catch(err) {
    res.status(500).json({error: err.message})
  }
});

// router.use('/:id', findByIdMiddleware, singleRouter)


module.exports = router;
