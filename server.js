const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;
const mongodb = require("mongodb");
const mongoclient = mongodb.MongoClient;
const { ObjectID } = require("bson");
const bcryptjs = require('bcryptjs');
const jwt = require("jsonwebtoken")

//const URL = "mongodb://localhost:27017"
const URL = "mongodb+srv://akanksha:ak1804@cluster0.uaav0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"

app.use(express.json())
app.use(cors({
    origin : "*"
}))


function authenticate(req,res,next){
    if(req.headers.authorization){
        let valid = jwt.verify(req.headers.authorization,"JpxK4m<.<9_]+Q)d");
        if(valid){
            req.userid = valid.id
            next()
        }
        else{
            res.status(401).json({
                message : "Unauthorised"
            })
        }
    }
    else{
        res.status(401).json({
            message : "Unauthorised"
        })
    }
}

app.post("/storefoundrecipes", authenticate , async function(req,res){
    try {
        let connection = await mongoclient.connect(URL)
        let db = connection.db("food_recipes")

        await db.collection("searched_recipe").deleteMany({})
        await db.collection("searched_recipe").insertOne(req.body)
        await connection.close()
        res.json({
            message : "searched recipe stored"
        })
    } catch (error) {
        res.status(500).json({
            message : "Error in posting searched recipe"
        })
    }
})

app.get("/getfoundrecipes", authenticate , async function(req,res){
    try {
        let connection = await mongoclient.connect(URL)
        let db = connection.db("food_recipes")
        let recipelist = await db.collection("searched_recipe").find().toArray();
        await connection.close()

        res.json(recipelist)

    } catch (error) {
        res.status(500).json({
            message : "Error in getting searched recipe list"
        })
    }
})


app.post("/storeuploadedrecipe", authenticate, async function(req,res){
    try {
        let connection = await mongoclient.connect(URL)
        let db = connection.db("food_recipes")
        req.body.userid = req.userid
        await db.collection("uploaded_recipes").insertOne(req.body)
        await connection.close()
        res.json({
            message : "uploaded recipe stored"
        })
    } catch (error) {
        res.status(500).json({
            message : "Error in posting uploaded recipe"
        })
    }
})


app.get("/getuploadedrecipes", authenticate , async function(req,res){
    try {
        let connection = await mongoclient.connect(URL)
        let db = connection.db("food_recipes")
        let recipelist = await db.collection("uploaded_recipes").find({userid : req.userid}).toArray();
        await connection.close()

        res.json(recipelist)

    } catch (error) {
        res.status(500).json({
            message : "Error in getting uploaded recipe list"
        })
    }
})

app.get("/getalluploadedrecipes", authenticate , async function(req,res){
    try {
        let connection = await mongoclient.connect(URL)
        let db = connection.db("food_recipes")
        let recipelist = await db.collection("uploaded_recipes").find().toArray();
        await connection.close()

        res.json(recipelist)

    } catch (error) {
        res.status(500).json({
            message : "Error in getting uploaded recipe list"
        })
    }
})


app.get("/getuploadedrecipebyid/:id", authenticate , async function(req,res){
    try {   
        const id = req.params.id;   
        let connection = await mongoclient.connect(URL)  
        let db = connection.db("food_recipes")
   
        let matchrecipe = await db.collection("uploaded_recipes").findOne({ "_id" : ObjectID(id)})
        
        console.log(matchrecipe)    
        res.json(matchrecipe)

    } catch (error) {
        res.status(500).json({
            message : "Error in getting uploaded recipe by id"
        })
    }
})


app.post("/registeruser", async function(req,res){

    try {
        let connection = await mongoclient.connect(URL)
        let db = connection.db("food_recipes")
        let salt = await bcryptjs.genSalt(10);
        let hash = await bcryptjs.hash(req.body.rpw,salt);
        console.log(hash);
        req.body.rpw = hash;
        req.body.rcpw = hash;
        await db.collection("user_details").insertOne(req.body)
        await connection.close()

        res.json({
            message : "user registered"
        })
    } catch (error) {
        res.status(500).json({
            message : "error in registering user"
        })
    }
})

app.post("/loginuser", async function(req,res){
    try {
        let connection = await mongoclient.connect(URL)
        let db = connection.db("food_recipes")

        let user = await db.collection("user_details").findOne({remail : req.body.lemail})
        await connection.close()

        if(user){
            let result = await bcryptjs.compare(req.body.lpw,user.rpw)
            if(result){
                //Generate token
                let token = jwt.sign({
                    id:user._id,
                    exp: Math.floor(Date.now() / 1000) + (60 * 60),
                },"JpxK4m<.<9_]+Q)d")
                res
                //.cookie("access_token",token,{
                //    httpOnly : true
                //})
                .status(200)
                .json({
                    message : "Successfully logged in",
                    userid : req.body.lemail,
                    token
                })
            }else{
                res.json({
                    message : "password incorrect"
                })
            }
        }else{
            res.json({
                message : "User not found"
            })
        }

    } catch (error) {
        res.status(500).json({
            message : "error in logging user"
        })
    }
})

app.put("/updaterecipebyid/:id",authenticate , async function(req,res){
    try {
        const id = req.params.id;
        let connection = await mongoclient.connect(URL)
        let db = connection.db("food_recipes")

        req.body._id = ObjectID(id)

        await db.collection("uploaded_recipes").updateOne({"_id" : ObjectID(id)},{$set : req.body })
        await connection.close()
        res.json({
            msg : "updated uploaded recipe"
        })
    } catch (error) {
        res.status(500).json({
            message : "Error in updating uploaded recipe"
        })
    }
})

app.delete("/deleterecipebyid/:id", authenticate , async function(req,res){
    try {
        const id = req.params.id;
        let connection = await mongoclient.connect(URL)
        let db = connection.db("food_recipes")
        await db.collection("uploaded_recipes").deleteOne({"_id" : ObjectID(id)})
        await connection.close()

        res.json({
            msg : "deleted uploaded recipe"
        })
    } catch (error) {
        res.status(500).json({
            message : "Error in deletion of uploaded recipe"
        })
    }
})

app.listen(port,function(){
    console.log("Server is running in port 3000");
})