import express from 'express';
const port = 65431;

// Set up server
const app = express();
const webRoot = './';
app.use(express.static(webRoot));
app.listen(port);

app.get("/getPort", (req, res) =>{
    res.json(port)});

app.post("/decisionRecv", express.json(), (req, res) =>{
    const payload = req.body;
    console.log(payload);
    respondToDecision(payload);
    res.json("Hello! from vendor-server");
});

async function respondToDecision(payload){
    setTimeout(async function(){ 
        console.log(`Responding to ${payload.sourceURL}'s decision`);
        const response = await fetch(`http://${payload.sourceURL}/decisionResponse/${payload.decision}.${payload.data_id}`);
        if (response.ok){
            console.log("Decision response sent");
        } else {
            console.log("Error sending decision response");
        }
    }, 30000);
}



