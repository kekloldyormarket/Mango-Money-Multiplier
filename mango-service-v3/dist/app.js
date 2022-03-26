"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const utils_1 = require("./utils");
const positionsController_1 = __importDefault(require("./positionsController"));
const coin_controller_1 = __importDefault(require("./coin.controller"));
const mango_simple_client_1 = __importDefault(require("./mango.simple.client"));
const markets_controller_1 = __importDefault(require("./markets.controller"));
const orders_controller_1 = __importDefault(require("./orders.controller"));
const wallet_controller_1 = __importDefault(require("./wallet.controller"));
const account_controller_1 = require("./account.controller");
const fills_1 = require("./fills");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        mango_simple_client_1.default.create().then((mangoSimpleClient) => {
            this.mangoSimpleClient = mangoSimpleClient;
            this.app.use(body_parser_1.default.json({ limit: "50mb" }));
            this.initializeControllers([
                new coin_controller_1.default(this.mangoSimpleClient),
                new wallet_controller_1.default(this.mangoSimpleClient),
                new orders_controller_1.default(this.mangoSimpleClient),
                new markets_controller_1.default(this.mangoSimpleClient),
                new positionsController_1.default(this.mangoSimpleClient),
                new account_controller_1.AccountController(this.mangoSimpleClient),
                new fills_1.FillsController(this.mangoSimpleClient),
            ]);
        });
    }
    initializeControllers(controllers) {
        controllers.forEach((controller) => {
            this.app.use("/", controller.router);
        });
    }
    listen() {
        const port = process.env.PORT || 3000;
        this.app.listen(port);
        utils_1.logger.info(`App listening on port ${port}`);
    }
    getServer() {
        return this.app;
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map