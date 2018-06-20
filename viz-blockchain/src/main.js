// const request = require('request')
// const ndjson = require('ndjson')
const ChainGraph = require('./graph-chain')
const Simulation = require('./Simulation')

const chain = new ChainGraph()

runFake(chain)
// runLive(chain, market, network)

function runFake () {
  const minersCount = 10
  const sim = new Simulation(minersCount)
  sim.runEpoch(4)
  chain.Draw(sim.filecoin)

  setTimeout(() => {
    sim.runEpoch(4)
    chain.Draw(sim.filecoin)
  }, 2000)

  // setInterval(() => {
  //   if (blockNumber === -1) {
  //     return
  //   }
  //   const miner = 'miner' + GetRandomInt(0, minersCount)
  //   const block = 'block' + GetRandomInt(Math.max(0, blockNumber - 5), blockNumber)

  //   const obj = {
  //     node: miner,
  //     block: filecoin.GetBlock(block)
  //   }
  //   filecoin.PickedChain(obj)
  //   // chain.Draw(filecoin)
  // }, 500)
}

// function runLive (chain, market, network) {
//   let filecoin = new Filecoin()
//   window.onload = function () {
//     GetLiveFeed((res) => {
//       const entry = res
//       sanitizeInts(entry)
//       if (filecoin[entry.type]) {
//         const event = filecoin[entry.type](entry)
//         if (event) {
//           network.DrawEvent(event)
//         }
//         network.DrawNodes(filecoin)
//         market.Draw(filecoin.orderbook)
//         chain.Draw(filecoin.chain)
//       }
//     })
//   }
// }

// function GetLiveFeed (cb) {
//   request.get('http://127.0.0.1:7002/logs')
//     .pipe(ndjson.parse())
//     .on('data', function (obj) {
//       console.log('ndjson got')
//       console.log(obj)
//       cb(obj)
//     })
// }

// function sanitizeInts (order) {
//   var fix = ['price', 'total', 'size']
//   fix.map(f => {
//     if (order[f]) {
//       order[f] = parseInt(order[f], 10)
//     }
//   })
// }
