#!/usr/bin/env node

const yargs = require('yargs')
const isDocker = require('is-docker')
const pkg = require('../package.json')

const DEFAULT_PORT = 8010
const DEFAULT_NODE_ENDPOINT = 'https://solana-api.projectserum.com'

const argv = yargs
  .scriptName('mango-bowl')
  .env('MB_')
  .strict()

  .option('port', {
    type: 'number',
    describe: 'Port to bind server on',
    default: DEFAULT_PORT
  })

  .option('endpoint', {
    type: 'string',
    describe: 'Solana RPC node endpoint that mango-bowl uses as a data source',
    default: DEFAULT_NODE_ENDPOINT
  })

  .option('ws-endpoint-port', {
    type: 'number',
    describe:
      'Optional Solana RPC WS node endpoint port that mango-bowl uses as a data source (if different than REST endpoint port)',
    default: undefined
  })

  .option('log-level', {
    type: 'string',
    describe: 'Log level',
    choices: ['debug', 'info', 'warn', 'error'],
    default: 'info'
  })
  .option('minions-count', {
    type: 'number',
    describe:
      'Minions worker threads count that are responsible for broadcasting normalized WS messages to connected clients',
    default: 1
  })

  .option('commitment', {
    type: 'string',
    describe: 'Solana commitment level to use when communicating with RPC node',
    choices: ['processed', 'confirmed'],
    default: 'confirmed'
  })

  .option('group-name', {
    type: 'string',
    describe: 'Config group name to load Mango perp markets from',
    default: 'mainnet.1'
  })

  .help()
  .version()
  .usage('$0 [options]')
  .example(`$0 --endpoint ${DEFAULT_NODE_ENDPOINT}`)
  .epilogue('See https://github.com/tardis-dev/mango-bowl for more information.')
  .detectLocale(false).argv

// if port ENV is defined use it otherwise use provided options
const port = process.env.PORT ? +process.env.PORT : argv['port']
process.env.LOG_LEVEL = argv['log-level']

const { bootServer, logger, getPerpMarkets } = require('../dist')

async function start() {
  let markets = getPerpMarkets(argv['group-name'])

  const options = {
    port,
    nodeEndpoint: argv['endpoint'],
    wsEndpointPort: argv['ws-endpoint-port'],
    minionsCount: argv['minions-count'],
    commitment: argv['commitment']
  }

  logger.log('info', 'Starting mango-bowl server with options', options)

  const startTimestamp = new Date().valueOf()

  await bootServer({
    ...options,
    markets
  })
  const bootTimeSeconds = Math.ceil((new Date().valueOf() - startTimestamp) / 1000)

  if (isDocker()) {
    logger.log('info', `Mango-bowl v${pkg.version} is running inside Docker container.`, { bootTimeSeconds })
  } else {
    logger.log('info', `Mango-bowl server v${pkg.version} is running on port ${port}.`, { bootTimeSeconds })
  }

  logger.log('info', `See https://github.com/tardis-dev/mango-bowl for more information.`)
}

start()

process
  .on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at Promise', reason, p)
    process.exit(1)
  })
  .on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown', err)
    process.exit(1)
  })
