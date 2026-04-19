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

const singleRouter = express.Router();

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
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete()  
  res.sendStatus(200);
});

/* GET todo. */
router.get('/:id', async (req, res) => {
  try{
    const { id } = req.params
    const todo = await Todo.findById(id)
  
    if (todo) {
      res.json(todo);  
    } else {
      res.status(404).json({ message: `No element found with id ${id}`})
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
});

/* PUT todo. */
router.put('/:id', async (req, res) => {
  try{
    const { id } = req.params
    const text = req.body.text
    const done = req.body.done
    const update = {}

    if (text !== undefined) {
      update.text = text
    }

    if (done !== undefined) {
      update.done = done
    }
      
    const todo = await Todo.findByIdAndUpdate(
      id, 
      update, 
      {new: true})
    
    if (todo) {
      res.status(200).json(todo);  
    } else {
      res.status(404).json({ message: `No element found with id ${id}`})
    }
  } catch(err) {
    res.status(500).json({error: err.message})
  }
});

router.use('/:id', findByIdMiddleware, singleRouter)


module.exports = router;
