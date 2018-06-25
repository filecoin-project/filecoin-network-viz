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

const feedUrl = 'http://127.0.0.1:7002/logs'

window.document.addEventListener('DOMContentLoaded', main)

function main() {
  const sim = {
    chain: new ChainGraph(),
    market: new MarketGraph(),
    network: new NetworkGraph(),
    orderbook: new OrderbookGraph(),
    deals: new DealsGraph(),
    heartbeats: new HeartbeatGraph(),
    eventQueue: [], // use this to slow down render
    drawSpeed: 25, // ms
  }

  //runFake(sim)
  runLive(sim, feedUrl)
  window.sim = sim
}

function runFake (sim) {
  var chain = sim.chain
  var market = sim.market
  var network = sim.network

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

  didCatchUp()
}

function processSimEvent (sim, entry) {
  if (sim.filecoin[entry.type]) {
    //console.log(`[${entry.type}]`, entry)
    const event = sim.filecoin[entry.type](entry)
    if (event) {
      sim.network.DrawEvent(event)
    }
    sim.network.DrawNodes(sim.filecoin)
    sim.market.Draw(sim.filecoin.orderbook)
    sim.chain.Draw(sim.filecoin.chain)
    sim.orderbook.Draw(sim.filecoin.orderbook)
    sim.deals.Draw(sim.filecoin.deals)
    sim.heartbeats.Draw(sim.filecoin.heartbeats)
  }
}

function didCatchUp() {
  document.querySelector('#catching-up-msg').style.display = 'none'
  console.log('caught up')
}

function runEventFeed (sim) {
  var caughtUp = false
  // cancel it by cancelling the interval
  sim.periodicDraw = setInterval(() => {
    var e = sim.eventQueue.shift()
    if (!e) return
    processSimEvent(sim, e)

    // length going from 1 -> 0
    if (!caughtUp && sim.eventQueue.length == 0) {
      caughtUp = true
      return didCatchUp()
    }
  }, sim.drawSpeed)
}

function runLive (sim, feedUrl) {
  sim.filecoin = new Filecoin()
  runEventFeed(sim) // kick off the process.
  window.onload = function () {
    GetLiveFeed(feedUrl, (res) => {
      const entry = res
      sanitizeInts(entry)
      sim.eventQueue.push(entry)
    })
  }
}

function GetLiveFeed (feedUrl, cb) {
  request.get(feedUrl)
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
