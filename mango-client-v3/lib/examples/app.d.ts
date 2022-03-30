import express from "express";
import FundingController from "./example";
declare class App {
    app: express.Application;
    fc: FundingController;
    constructor();
    listen(): void;
    getServer(): express.Application;
}
export default App;
//# sourceMappingURL=app.d.ts.map