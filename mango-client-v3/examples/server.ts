import App from "./app";

process.on("SIGTERM", function () {
  console.log("SIGTERM received");
  // todo add cleanup logic
  process.exit();
});

process.on("SIGINT", function () {
  console.log("SIGINT received");
  // todo add cleanup logic
  process.exit();
});

const app = new App();
setInterval(async function(){
    try {
     await app.fc.checkRates();
    }
    catch(err){
      console.log(err)
    }}, 15000)
    setInterval(async function(){
        try {
          app.fc.doing = false;
        }
        catch(err){
          console.log(err)
        }}, 60000)
app.listen();
