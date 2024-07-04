require('dotenv').config();
const { MongoClient } = require('mongodb');
const urlparser = require('url')
const express = require('express');
const cors = require('cors');
const app = express();

const path = require('path');
const dns = require('dns');
const { URL } = require('url');

const port = process.env.PORT || 3000;

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("freecodecamp_db_1");
const urls = db.collection("urls");

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    setTimeout(connectDB, 5000); 
  }
}

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


app.post('/api/shorturl', (req, res) => {
  const url = req.body.url;
  const hostname = new URL(url).hostname;

  dns.lookup(hostname, async (err, address) => {
    if (err || !address) {
      res.json({ error: 'invalid url' });
    } else {
      const urlCount = await urls.countDocuments({});
      const urlDoc = { url, short_url: urlCount };
      await urls.insertOne(urlDoc);
      res.json({ original_url: url, short_url: urlCount });
    }
  });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shorturl = parseInt(req.params.short_url);
  const urlDoc = await urls.findOne({ short_url: shorturl });
  if (urlDoc) {
    res.redirect(urlDoc.url);
  } else {
    res.status(404).json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, () => {
  console.log('Your app is listening on port ' + port);
});

module.exports = app;
