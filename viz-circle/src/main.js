const request = require('request')
const ndjson = require('ndjson')
const Filecoin = require('./filecoin')
const ChainGraph = require('./graph-chain')
const MarketGraph = require('./graph-market')
const OrderbookGraph = require('./graph-orderbook')
const DealsGraph = require('./graph-deals')
const NetworkGraph = require('./graph-network')
const HeartbeatGraph = require('./graph-heartbeat')
const GetRandomInt = require('./utils').GetRandomInt

const chain = new ChainGraph()
const market = new MarketGraph()
const network = new NetworkGraph()
const orderbook = new OrderbookGraph()
const deals = new DealsGraph()
const heartbeats = new HeartbeatGraph()

//runFake(chain, market, network)
runLive(chain, market, network, orderbook, deals, heartbeats)

function runFake (chain, market, network) {
  let minersCount = 10
  let clientsCount = 10

  // Fake parts: start
  let miners = d3.range(minersCount)
    .map(d => { return {id: 'miner' + d} })
  let clients = d3.range(clientsCount)
    .map(d => { return {id: 'client' + d} })
  let filecoin = new Filecoin(miners, clients)

  network.DrawNodes(filecoin)

  setInterval(() => {
    const blockMiner = filecoin.RandomMiner()
    network.DrawEvent(filecoin.NewBlockMined({from: blockMiner.id }))
    network.DrawEvent(filecoin.BroadcastBlock({from: blockMiner.id}))

    chain.Draw(filecoin.chain)
    network.DrawNodes(filecoin)
  }, 3000)

  setInterval(() => {
    let event = filecoin.RandomEvent()
    if (event) {
      network.DrawEvent(event)
      network.DrawNodes(filecoin)
      market.Draw(filecoin.orderbook)
    }
  }, 500)

  setInterval(() => {
    minersCount += GetRandomInt(0, 6) - 3
    clientsCount += GetRandomInt(0, 6) - 3
    miners = d3.range(minersCount || 10).map(d => { return {id: 'miner' + d} })
    clients = d3.range(clientsCount || 10).map(d => { return {id: 'client' + d} })

    // TODO: do this using minerJoins, MinerLeaves instead
    filecoin = new Filecoin(miners, clients, filecoin.chain, filecoin.orderbook)

    network.DrawNodes(filecoin)
  }, 1500)
}

function runLive (chain, market, network, orderbook, deals, heartbeats) {
  let filecoin = new Filecoin()
  window.onload = function () {
    GetLiveFeed((res) => {
      const entry = res
      sanitizeInts(entry)
      if (filecoin[entry.type]) {
        //console.log(`[${entry.type}]`, entry)
        const event = filecoin[entry.type](entry)
        if (event) {
          network.DrawEvent(event)
        }
        network.DrawNodes(filecoin)
        market.Draw(filecoin.orderbook)
        chain.Draw(filecoin.chain)
        orderbook.Draw(filecoin.orderbook)
        deals.Draw(filecoin.deals)
        heartbeats.Draw(filecoin.heartbeats)
      }
    })
  }
}

function GetLiveFeed (cb) {
  request.get('http://127.0.0.1:7002/logs')
    .pipe(ndjson.parse())
    .on('data', function (obj) {
      cb(obj)
    })
}

function sanitizeInts(order) {
  var fix = ['price', 'total', 'size', 'reward', 'value']
  fix.map(f => {
    if (order[f]) {
      order[f] = parseInt(order[f], 10)
    }
  })
}
