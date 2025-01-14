const express = require('express')
const jwt = require('jsonwebtoken'); 
const app = express()
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 5000
const morgan = require("morgan");

app.use(cors())
app.use(express.json()) 
app.use(morgan("dev"));




const { MongoClient, ServerApiVersion } = require('mongodb');
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


    const userCollection = client.db('focusPlace').collection('users') 
    const taskCollection = client.db('focusPlace').collection('task') 

    


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
      const token = jwt.sign(user, process.env.SECRET_JWT_KEY, {expiresIn: '5h'})
      
      res.send({token}) 
    })










    // users
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






    // task
    app.post('/task',verifyToken, async(req, res)=>{
      const task = req.body
      const result = await taskCollection.insertOne(task)
      res.send(result)
    })
 
  

    // Send a ping to confirm a successful connection
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