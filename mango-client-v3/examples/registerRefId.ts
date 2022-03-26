import fs from 'fs';
import os from 'os';
import { Cluster, Config, GroupConfig, IDS, MangoClient } from '../src';
import { Account, Commitment, Connection, PublicKey } from '@solana/web3.js';

async function main() {
  const payer = new Account(
    JSON.parse(
      fs.readFileSync(
        process.env.KEYPAIR || os.homedir() + '/.config/solana/id.json',
        'utf-8',
      ),
    ),
  );

  const config = new Config(IDS);

  const groupIds = config.getGroupWithName('mainnet.1') as GroupConfig;
  if (!groupIds) {
    throw new Error(`Group ${'mainnet.1'} not found`);
  }
  const cluster = groupIds.cluster as Cluster;
  const mangoProgramId = groupIds.mangoProgramId;
  const mangoGroupKey = groupIds.publicKey;
  const connection = new Connection(
    process.env.ENDPOINT_URL || config.cluster_urls[cluster],
    'processed' as Commitment,
  );
  const client = new MangoClient(connection, mangoProgramId);
  const mangoGroup = await client.getMangoGroup(mangoGroupKey);

  const mangoAccount = await client.getMangoAccount(
    new PublicKey('FG99s25HS1UKcP1jMx72Gezg6KZCC7DuKXhNW51XC1qi'),
    mangoGroup.dexProgramId,
  );
  const t0 = await client.setReferrerMemory(
    mangoGroup,
    mangoAccount,
    payer,
    mangoAccount.publicKey,
  );
  console.log(t0.toString());
  const txid = await client.registerReferrerId(
    mangoGroup,
    mangoAccount,
    payer,
    'daffy',
  );
  console.log(txid.toString());
}

main();
