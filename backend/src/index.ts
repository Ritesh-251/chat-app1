import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import app from "./app.js"
import {connectDb} from "./db/index.js";

connectDb().then(
    ()=>{
        console.log("Database successfully conected");
        app.listen(8000,()=>{
            console.log('Server is running at port 8000');
        });
    }).catch((errors)=>{
        console.log("Failed while connecting to dB",errors);
        process.exit(1);
    })