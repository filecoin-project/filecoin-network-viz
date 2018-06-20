const Filecoin = require('./filecoin')
const GetRandomInt = require('./utils').GetRandomInt
module.exports = class Simulation {
  constructor (minersCount = 10) {
    this.blockNumber = -1
    this.height = -1
    this.filecoin = new Filecoin()
    this.minersCount = minersCount
  }

  runEpoch (blocks) {
    this.height++
    console.log('new epoch ----')
    for (let i = 0; i < blocks; i++) {
      this.blockNumber++

      const obj = {
        to: 'miner' + GetRandomInt(1, this.minersCount - 1),
        block: {
          cid: 'block' + this.blockNumber,
          height: this.height
        }
      }

      let parents = []
      if (this.height > 0) {
        parents = this.filecoin.heights[this.height - 1] || []
        console.log('all the heights', this.filecoin.heights, this.height)
      }
      obj.block.parents = parents.map(d => d.cid)
      console.log('adding node', obj.block.cid, obj.block.height, obj.block.parents)
      this.filecoin.ReceivedBlock(obj)
      console.log('node added', this.filecoin)
    }
  }
}
