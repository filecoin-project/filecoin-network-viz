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
const _ = require('underscore')

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
    eventStats: {
      parsed: 0,
      processed: 0,
      drawn: 0,
    },
    drawSpeed: 15, // ms
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

class SimDrawer {
  constructor(sim) {
    this.sim = sim
    this.drawChain = _.throttle(_.bind(this.drawChain, this), 500)
    this.drawMarket = _.throttle(_.bind(this.drawMarket, this), 150)
    this.drawNetwork = _.throttle(_.bind(this.drawNetwork, this), 200)
    this.drawHeartbeats = _.throttle(_.bind(this.drawHeartbeats, this), 500)
    this.eqel = document.querySelector('#event-queue-stats')
  }

  drawMarket() {
    this.sim.market.Draw(this.sim.filecoin.orderbook)
    this.sim.orderbook.Draw(this.sim.filecoin.orderbook)
    this.sim.deals.Draw(this.sim.filecoin.deals)
  }

  drawHeartbeats() {
    this.sim.heartbeats.Draw(this.sim.filecoin.heartbeats)
  }

  drawChain() {
    this.sim.chain.Draw(this.sim.filecoin.chain)
  }

  drawNetwork() {
    this.sim.network.DrawNodes(this.sim.filecoin)
  }

  drawEventStats() {
    this.sim.eventStats.drawn++

    var stats = this.sim.eventStats
    this.eqel.innerText = `events: ${stats.processed} / ${stats.parsed}`
  }

  DrawEvent(entry, event) {
    if (event) {
      this.sim.network.DrawEvent(event)
    }

    this.drawEventStats()

    switch (entry.type) {
    case "BroadcastBlock":
      this.drawChain()
      this.drawNetwork() // payments
      break

    case "ClientJoins":
    case "MinerJoins":
      this.drawNetwork()
      break

    case "HeartBeat":
      this.drawHeartbeats()
      break

    case "AddAsk":
    case "AddBid":
    case "MakeDeal":
      this.drawMarket()
      break

    default:
      this.drawChain()
      break
    }
  }
}

function processSimEvent (sim, entry) {
  if (sim.filecoin[entry.type]) {
    //console.log(`[${entry.type}]`, entry)
    const event = sim.filecoin[entry.type](entry)
    sim.drawer.DrawEvent(entry, event)
  }
}

function didCatchUp() {
  document.querySelector('#catching-up-msg').style.display = 'none'

  didCatchUp = () => {} // do nothing from now on (faster)
}

// function runEventFeed (sim) {
//   var caughtUp = false
//   // cancel it by cancelling the interval
//   sim.periodicDraw = setInterval(() => {
//     processEvents(sim)
//   }, sim.drawSpeed)
// }

function processEvents (sim) {
  sim.isProcessing = true

  while (sim.eventQueue.length > 0) {
    sim.eventStats.processed++ // log it here to count failed events
    var e = sim.eventQueue.shift()
    if (!e) continue
    processSimEvent(sim, e)
  }

  didCatchUp()
  sim.isProcessing = false
}

function runLive (sim, feedUrl) {
  sim.filecoin = new Filecoin()
  sim.drawer = new SimDrawer(sim)

  var procEvent = _.throttle(processEvents, 25)

  // runEventFeed(sim) // kick off the process.
  window.onload = function () {
    GetLiveFeed(feedUrl, (res) => {
      const entry = res
      sanitizeInts(entry)
      sim.eventQueue.push(entry)
      sim.eventStats.parsed++

      if (!sim.isProcessing) {
        _.defer(() => processEvents(sim) )
      }
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
