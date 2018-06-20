const request = require('request')
const ndjson = require('ndjson')
const ChainGraph = require('./graph-chain')
const Simulation = require('./simulation')
const Filecoin = require('./filecoin')
const GetRandomInt = require('./utils').GetRandomInt

const chain = new ChainGraph()

runFake(chain)
// runLive(chain)

function runFake () {
  const minersCount = 10
  const sim = new Simulation(minersCount)
  sim.runEpoch(4)
  chain.Draw(sim.filecoin)

  setTimeout(() => {
    sim.runEpoch(4)
    chain.Draw(sim.filecoin)
    console.log(sim.filecoin)
  }, 1000)

  setTimeout(() => {
    const miner = 'miner' + GetRandomInt(0, minersCount)
    const block = sim.filecoin.heights[sim.filecoin.latestHeight][0]

    const obj = {
      node: miner,
      block: block
    }
    const event = sim.filecoin.PickedChain(obj)
    chain.Draw(sim.filecoin, event)
  }, 2000)
}

function runLive (chain, market, network) {
  let filecoin = new Filecoin()
  window.onload = function () {
    GetLiveFeed((res) => {
      const entry = res
      // sanitizeInts(entry)
      if (filecoin[entry.type]) {
        const event = filecoin[entry.type](entry)
        // if (event) {
        //   chain.Draw(sim.filecoin, event)
        // }
        chain.Draw(filecoin)
      }
    })
  }
}

function GetLiveFeed (cb) {
  request.get('http://127.0.0.1:7002/logs')
    .pipe(ndjson.parse())
    .on('data', function (obj) {
      console.log('ndjson got')
      console.log(obj)
      cb(obj)
    })
}

// function sanitizeInts (order) {
//   var fix = ['price', 'total', 'size']
//   fix.map(f => {
//     if (order[f]) {
//       order[f] = parseInt(order[f], 10)
//     }
//   })
// }
