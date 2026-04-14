const express = require('express');
const { Todo } = require('../mongo')
const router = express.Router();

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos);
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
  const todo = await Todo.create({
    text: req.body.text,
    done: false
  })
  res.send(todo);
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  req.todo = await Todo.findById(id)
  if (!req.todo) return res.sendStatus(404)

  next()
}

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
    res.status(500).json({error: err.message})
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
