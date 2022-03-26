#!/usr/bin/env node
import { Config } from '../config';
import initGroup from './initGroup';
import addPerpMarket from './addPerpMarket';
import addSpotMarket from './addSpotMarket';
import addStubOracle from './addStubOracle';
import addPythOracle from './addPythOracle';
import addSwitchboardOracle from './addSwitchboardOracle';
import setStubOracle from './setStubOracle';
import listMarket from './listMarket';
import sanityCheck from './sanityCheck';
export { addPerpMarket, addSpotMarket, addStubOracle, addPythOracle, addSwitchboardOracle, initGroup, setStubOracle, listMarket, sanityCheck, };
export declare function readConfig(configPath: string): Config;
export declare function writeConfig(configPath: string, config: Config): void;
//# sourceMappingURL=index.d.ts.map