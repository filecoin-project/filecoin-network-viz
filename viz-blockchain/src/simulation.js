const Filecoin = require('./filecoin')
const GetRandomInt = require('./utils').GetRandomInt
module.exports = class Simulation {
  constructor (minersCount = 10) {
    this.blockNumber = -1
    this.epoch = -1
    this.filecoin = new Filecoin()
    this.minersCount = minersCount
  }

  runEpoch (blocks) {
    this.epoch++
    for (let i = 0; i < blocks; i++) {
      this.blockNumber++

      const obj = {
        to: 'miner' + GetRandomInt(1, this.minersCount - 1),
        block: {
          cid: 'block' + this.blockNumber,
          epoch: this.epoch
        }
      }

      obj.block.parents = this.filecoin.epochs[this.epoch - 1] || []

      this.filecoin.ReceivedBlock(obj)
    }
  }
}
