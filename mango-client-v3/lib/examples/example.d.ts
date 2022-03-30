import { Router } from "express";
interface Controller {
    path: string;
    router: Router;
}
export default class FundingController implements Controller {
    path: string;
    router: import("express-serve-static-core").Router;
    doing: boolean;
    rates: {
        arr: any[];
        t: number;
        avg: number;
        wants: {};
        mids: {};
    };
    constructor();
    checkRates(): Promise<void>;
    private initializeRoutes;
    private examplePerp;
}
export {};
//# sourceMappingURL=example.d.ts.map