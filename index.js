import express from "express";
import bodyParser from "body-parser";
import JOKE from "./JOKE.json" assert { type: "json" };
import dotenv from "dotenv";
import fs from "fs";
import rateLimit from "express-rate-limit";

const app = express();

dotenv.config();
const PORT = process.env.PORT;
app.use(bodyParser.urlencoded({ exntended: true }));
app.use(bodyParser.json());

const limiter=rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
})

app.use(limiter);
//routess
//This is get routee...
app.get("/api/jokes", (req, res) => {
  const type = req.query.type;
  const content = req.query.content;
  const { page = 1, limit = 10 } = req.query;

  const fetchedJoke = JOKE.filter((joke) => {
    if (type && content) {
      return type === joke.type && content === joke.content;
    } else if (type) {
      return type === joke.type;
    } else if (content) {
      return content === joke.content;
    } else {
      return true;
    }
  });
  if (fetchedJoke === -1) {
    res.status(400).json({ error: "No joke found" });
  }

  var startIndex = (page - 1) * limit;
  var paginatedJoke = fetchedJoke.slice(startIndex, startIndex + Number(limit));

  res.json({
    status: 200,
    page: Number(page),
    limit: Number(limit),
    body: paginatedJoke,
  });
});

app.get("/api/jokes/:id",(req,res)=>{
    const id=Number(req.params.id);
  const joke=JOKE.find((item)=>{
        return item.id===id;
    })
    if(!joke){
        return res.status(400).json({message:"ID not matched"});
    }

    
    res.status(200).json(joke);
})
//middleware for api key to post,patch,delete..
function middleware(req,res,next){
    const key=req.query.api;
    const apikey=process.env.api;

    if(!key){
        res.status(400).json({error:"you need to enter a apikey"});
    }
    if(key!==apikey){
        res.status(400).json({error:"Wrong api key entered"});
    }
    next();

}
//This is post route
app.post("/api/jokes",middleware,(req,res)=>{
    const data=req.body;
    if(!data.title && !data.content){
       return res.status(400).json({error:"no body to post data"});
    }
    JOKE.push({id:JOKE.length+1,...data});
    fs.writeFile("./JOKE.json",JSON.stringify(JOKE),(err,data)=>{
        if(err){
            throw err;
        }
        res.status(200).json({message:"Joke inserted successfully"});
    })
})
//this is patch route

app.patch("/api/jokes/:id",middleware,(req,res)=>{
    const id=Number(req.params.id);
    const body=req.body;

    const patchedIndex=JOKE.findIndex((data)=>{
        return data.id===id;
    })
    if(patchedIndex===-1){
       return res.status(400).json({error:"Id not matched to be updated"});
    }

    const updatedJoke={...JOKE[patchedIndex],...body}
    JOKE[patchedIndex]=updatedJoke;
    fs.writeFile("./JOKE.json",JSON.stringify(JOKE),(err,data)=>{
        if(err){
            throw err;
        }
        res.status(200).json({message:"Patched joke successfully",updatedJoke});
    })
})


//delete routee...

app.delete("/api/jokes/:id",middleware,(req,res)=>{
   const id=Number(req.params.id);

  const delIndex= JOKE.findIndex((user)=>{
    return user.id===id;
   })
   if(delIndex===-1){
    return res.status(400).json({error:"Index not found to be deleted"});
   }

   for (let i = delIndex; i < JOKE.length; i++) {
    JOKE[i].id -= 1;
  }
   JOKE.splice(delIndex,1,0);
   fs.writeFile("./JOKE.json",JSON.stringify(JOKE),(err,data)=>{
    if(err){
        throw err;
    }
    res.status(200).json({message:"Joke deleted successfully"});
   })
   
})
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
})
