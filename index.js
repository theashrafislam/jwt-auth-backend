const express = require('express')
const app = express();
require('dotenv').config()
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;


app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));
app.use(express.json())
app.use(cookieParser())



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gphdl2n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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


        // verifyToken
        const verifyToken = (req, res, next) => {
            const token = req?.cookies?.token;
            if (!token) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            jwt.verify(token, process.env.SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                // console.log(decoded);
                req.info = decoded;
                next();
            })
        }


        const userCollection = client.db('jwt-auth').collection('userData');

        app.post('/jwt', async (req, res) => {
            const info = req.body;
            // console.log(info);
            const token = jwt.sign({
                info
            }, process.env.SECRET, { expiresIn: '1h' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none'
                })
                .send({ success: true })
        });

        app.post('/logout', async (req, res) => {
            // console.log(req.email);
            res
                .clearCookie('token', {
                    maxAge: 0
                })
                .send({ success: true, message: 'hello' })
        })


        app.get('/secret-data', verifyToken, async (req, res) => {
            // console.log(req?.info?.info?.email);
            if(req?.query?.email !== req?.info?.info?.email){
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const result = await userCollection.find().toArray();
            res.send({ messages: "Data get successfully", data: result })
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