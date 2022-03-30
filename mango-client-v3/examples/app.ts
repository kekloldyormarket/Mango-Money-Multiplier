import bodyParser from "body-parser";
import express from "express";
import FundingController from "./example";

class App {
  public app: express.Application;
public fc: FundingController;
  constructor() {
    this.app = express();
    
      this.app.use(bodyParser.json({ limit: "50mb" }));
      this.fc = new FundingController()
      this.app.use("/",  this.fc.router);

  }


  public listen() {
    const port = 3138;
    this.app.listen(port);
  }

  public getServer() {
    return this.app;
  }
}

export default App;