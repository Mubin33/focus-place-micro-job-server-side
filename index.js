const express = require('express')
const jwt = require('jsonwebtoken'); 
const app = express()
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 5000
const morgan = require("morgan");
const Stripe = require("stripe");

const stripe = new Stripe(`${process.env.PAYMENT_SECRET_KEY}`);


app.use(cors())
app.use(express.json()) 
app.use(morgan("dev"));




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.nqyrr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();


    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
    
      try {
        // Ensure the price is converted to cents
        const amount = Math.round(price * 100);
    
        const paymentIntent = await stripe.paymentIntents.create({
          amount, // Correct parameter name
          currency: "usd",
        });
    
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Error creating payment intent:", error.message);
        res.status(500).json({ error: error.message });
      }
    });
    










    const userCollection = client.db('focusPlace').collection('users') 
    const taskCollection = client.db('focusPlace').collection('task') 
    const taskApplyCollection = client.db('focusPlace').collection('task-apply') 

    


    const verifyToken = (req, res, next)=>{
      // console.log(req.headers.authorization)
      const isToken = req.headers.authorization
      if(!isToken){
        return res.status(401).send({massage:"UnAuthorize"})
      } 
      const onlyToken = req.headers.authorization.split(' ')[1] 
      jwt.verify(onlyToken, process.env.SECRET_JWT_KEY, (err, decoded)=>{
        if(err){
          return res.status(401).send({massage:"UnAuthorize"})
        }
        req.decoded=decoded
        next()
      })
    }


    // json web token
    app.post('/jwt',  async(req, res)=>{
      const user = req.body
      const token = jwt.sign(user, process.env.SECRET_JWT_KEY, {expiresIn: '100d'})
      
      res.send({token}) 
    })










    // users
    app.get('/users', verifyToken, async(req, res)=>{ //verifyAdmin
      const result = await userCollection.find().toArray()
      res.send(result)
    })
    app.delete('/user/delete/:id', verifyToken, async(req, res)=>{ //verifyAdmin
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })
    app.patch('/user/role/update/:id',verifyToken, async(req, res)=>{ //verifyAdmin
      const id = req.params.id
      const role = req.body
      const filter = {_id: new ObjectId(id)}
      const updated = {
        $set:{role: role.role},
      }
      const result = await userCollection.updateOne(filter, updated)
      res.send(result)
    })
    app.get('/user/:email',verifyToken, async(req, res)=>{
      const email = req.params.email
      const query = {email}
      const result = await userCollection.findOne(query)
      res.send(result)
    })
    app.post('/users/add', async(req, res)=>{
      const user = req.body
      // checking user isExist?
      const query = {email: user.email}
      const isExist = await userCollection.findOne(query)
      if(isExist){
        return res.send(isExist)
      }  
      const result = await userCollection.insertOne(user)
      res.send(result)
    }) 
    app.patch('/users/amount/update/:email', verifyToken, async (req, res) => { //verifyBuyer
      const email = req.params.email; 
      const { amount } = req.body; 
      console.log(amount)
      const filter = { email: email };  
      const updateDoc = {
        $set: {
          amount: amount,  
        },
      };
     
        const result = await userCollection.updateOne(filter, updateDoc); 
        res.send(result)
    });
    


 //emni after delete



    // task
    app.get('/task', verifyToken, async(req, res)=>{ 
      const result = await taskCollection.find().toArray()
      res.send(result)
    })
    app.get('/per/task/:id',   async(req, res)=>{ 
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await taskCollection.findOne(query) 
      res.send(result)
    })
    app.get('/my-task/:email', verifyToken, async(req, res)=>{ //verifyBuyer
      const email = req.params.email
      const query = {buyerEmail:email}
      const result = await taskCollection.find(query).toArray()
      res.send(result)
    })
    app.post('/task',verifyToken, async(req, res)=>{  //ekhane {verifyBuyer} middelware boshbe
      const task = req.body
      const result = await taskCollection.insertOne(task)
      res.send(result)
    })
    app.delete('/task/delete/:id', verifyToken, async(req, res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await taskCollection.deleteOne(query)
      res.send(result)
    }) 

  app.patch("/task/update/:id", verifyToken, async (req, res) => { //buyerVerify
    const id = req.params.id;
    const updateInfo = req.body; 
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: updateInfo, // Dynamically update only the fields sent in the request
    };
   
      const result = await taskCollection.updateOne(filter, updateDoc);
      res.send(result); 
  });
  // app.patch('/task/worker/update/:id', verifyToken, async (req, res) => { 
  //   const id = req.params.id; 
  //   const query = { _id: new ObjectId(id) };  
  //   const   {after_required_workers}  = req.body; 
  //   console.log(after_required_workers)

  //   const updateDoc = {
  //     $set: { required_workers: after_required_workers },
  //   };
   
  //     const result = await taskCollection.updateOne(query, updateDoc); 
  //     res.send(result)
  // });
  
  app.patch('/task/worker/update/:id', verifyToken, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const { after_required_workers } = req.body;

    if (after_required_workers < 0) {
        return res.status(400).send({ error: "Invalid workers count. Cannot be less than 0." });
    }

    try {
        const task = await taskCollection.findOne(query);
        if (!task) {
            return res.status(404).send({ error: "Task not found." });
        }

        const updateDoc = { $set: { required_workers: after_required_workers } };
        const result = await taskCollection.updateOne(query, updateDoc);

        if (result.modifiedCount === 0) {
            return res.status(500).send({ error: "Failed to update task." });
        }

        res.send({ success: true, message: "Task updated successfully.", result });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "An error occurred while updating the task." });
    }
});

 
















  // worker task apply
  app.get('/apply/task/:email', verifyToken, async(req, res)=>{
    const email = req.params.email
    const query = {worker_email: email}
    const result = await taskApplyCollection.find(query).toArray()
    res.send(result)
  })
  app.get('/buyer/apply/task/:email', verifyToken, async(req, res)=>{ //verify buyer
    const email = req.params.email
    const query = {buyerEmail: email}
    const result = await taskApplyCollection.find(query).toArray()
    res.send(result)
  })
  app.post('/worker/apply/task',verifyToken, async(req, res)=>{   
      const task = req.body
      const result = await taskApplyCollection.insertOne(task)
      res.send(result)
    }) 
    app.patch('/apply/task/status/update/:id',verifyToken, async(req, res)=>{ //verifyBuyer
      const id = req.params.id
      const status = req.body 
      const filter = {_id: new ObjectId(id)}
      const updated = {
        $set:{status: status.status},
      }
      const result = await taskApplyCollection.updateOne(filter, updated)
      res.send(result)
    })









 
  

    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})