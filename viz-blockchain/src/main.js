// const request = require('request')
// const ndjson = require('ndjson')
const Filecoin = require('./filecoin')
const ChainGraph = require('./graph-chain')
const GetRandomInt = require('./utils').GetRandomInt

const chain = new ChainGraph()

runFake(chain)
// runLive(chain, market, network)

function runFake () {
  let minersCount = 10
  let blockNumber = -1
  let epoch = -1

  // Fake parts: start
  let filecoin = new Filecoin()

  // network.DrawNodes(filecoin)

  setInterval(() => {
    epoch++

    const blocks = GetRandomInt(0, 4)
    for (let i = 0; i < blocks; i++) {
      blockNumber++

      const obj = {
        to: 'miner' + GetRandomInt(0, minersCount),
        block: {
          cid: 'block' + blockNumber,
          epoch: epoch
        }
      }

      obj.parents = filecoin.epochs[epoch - 1]

      filecoin.ReceivedBlock(obj)
    }
    console.log('sol', filecoin.heads, filecoin.miners)
  }, 1000)

  setInterval(() => {
    if (blockNumber === -1) {
      return
    }
    const miner = 'miner' + GetRandomInt(0, minersCount)
    const block = 'block' + GetRandomInt(Math.max(0, blockNumber - 5), blockNumber)

    const obj = {
      node: miner,
      block: filecoin.GetBlock(block)
    }
    filecoin.PickedChain(obj)
    console.log('sol', filecoin.heads, filecoin.miners)
  }, 500)
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
