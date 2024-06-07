const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: String
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// POST /api/users to create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  const user = new User({ username });
  await user.save();
  res.json({ username: user.username, _id: user._id });
});

// GET /api/users to get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// POST /api/users/:_id/exercises to add exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params._id;
  const user = await User.findById(userId);

  if (!user) {
    return res.json({ error: 'User not found' });
  }

  const exercise = new Exercise({
    userId,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString()
  });

  await exercise.save();

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: user._id
  });
});

// GET /api/users/:_id/logs to get exercise logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = await User.findById(userId);

  if (!user) {
    return res.json({ error: 'User not found' });
  }

  let exercises = await Exercise.find({ userId });

  if (from) {
    const fromDate = new Date(from);
    exercises = exercises.filter(ex => new Date(ex.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    exercises = exercises.filter(ex => new Date(ex.date) <= toDate);
  }

  if (limit) {
    exercises = exercises.slice(0, parseInt(limit));
  }

  const log = exercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date
  }));

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
