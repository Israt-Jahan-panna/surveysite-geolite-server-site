const express = require('express');
var cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 4200
// midelwire
app.use(cors(

    {
        origin: ['https://geolite-client-site.web.app'],
        credentials:true
      }
));
app.use(express.json());

// mongodb connections 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j0yhois.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
    //   await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
    }
  }


  const userCollection = client.db('geoliteDB').collection('users')

  // user api
  app.get('/users' , async(req , res ) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.post('/users', async (req , res) =>{
      const users = req.body ;
    // insert email if user dosenot exists 
    const query ={email:users.email}
    const existingUser = await  userCollection.findOne(query);
    if(existingUser){
      return res. send({message: 'user alreaady exixt,', insertedId:null})
    }
      console.log(users);
      const result = await userCollection.insertOne(users);
      res.send(result)
    })
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exists: 
      // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

// --------

app.post('/create-payment-intent', async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price * 100);
  console.log(amount, 'amount inside the intent')

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card']
  });

  res.send({
    clientSecret: paymentIntent.client_secret
  })
});


app.get('/payments/:email', async (req, res) => {
  const query = { email: req.params.email }
  if (req.params.email !== req.decoded.email) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  const result = await paymentCollection.find(query).toArray();
  res.send(result);
})

app.post('/payments', async (req, res) => {
  const payment = req.body;
  const paymentResult = await paymentCollection.insertOne(payment);

  //  carefully delete each item from the cart
  console.log('payment info', payment);
  const query = {
    _id: {
      $in: payment.cartIds.map(id => new ObjectId(id))
    }
  };

  const deleteResult = await cartCollection.deleteMany(query);

  // send user email about payment confirmation
  mg.messages
    .create(process.env.MAIL_SENDING_DOMAIN, {
      from: "Geolite",
      to: ["isratjahanpanna87@gmail.com"],
      subject: "Geolite pro User Confirmation",
      
      html: `
        <div>
          <h2>Thank you for your order</h2>
          <h4>Your Transaction Id: <strong>${payment.transactionId}</strong></h4>
          <p>We would like to get your feedback about the food</p>
        </div>
      `
    })
    .then(msg => console.log(msg)) // logs response data
    .catch(err => console.log(err)); // logs any error`;

  res.send({ paymentResult, deleteResult });
})

    
  // added new seurvey 
const surveyCollection = client.db("geoliteDB").collection("addSurvey");

// 

app.get('/survey' , async(req , res ) => {
    const cursor = surveyCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  })
  
  // add new survey
  app.post('/survey', async (req , res) =>{
      const surveyData = req.body ;
      console.log(surveyData);
      const result = await surveyCollection.insertOne(surveyData);
      res.send(result)
  })
// Fetch survey by id
app.get('/survey/:id', async (req, res) => {
    const surveyId = req.params.id;
    console.log(surveyId)
    const query = { _id: new ObjectId(surveyId) };
    const survey = await surveyCollection.findOne(query);
    res.json(survey);
  });

  run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('geolitesite')
  })
  
  app.listen(port, () => {
    console.log(`geolite app listening on port ${port}`)
  })