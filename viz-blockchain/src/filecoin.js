const GetRandomInt = require('./utils').GetRandomInt
const Block = require('./block')

// how to use it:
// filecoin.blocks is a map cid->Block
// filecoin.miners is a list of miner ids
// filecoin.heads is a map of cid->miners
// filecoin.blocks[0].seen shows the miners count
module.exports = class Filecoin {
  constructor (obj = {blocks: {}, minersHeads: {}}) {
    this.latestEpoch = 0
    this.epochs = [] // [int]Block
    this.blocks = {} // block-cid => [Block]
    this.minersHeads = {} // miner-id => block-cid

    this.events = [
      'ReceivedBlock',
      'PickedChain'
    ]
  }

  // return a list of miners
  get miners () {
    return Object.keys(this.minersHeads)
  }

  // return a map of cids to how many miners count it as heads
  get heads () {
    const heads = {}
    this.miners.forEach(m => {
      const head = this.minersHeads[m]
      if (!heads[head]) {
        heads[head] = 0
      }
      heads[head]++
    })
    return heads
  }

  upsertMiner (minerCid) {
    if (this.minersHeads[minerCid] === undefined) {
      this.minersHeads[minerCid] = null
    }
  }

  GetBlock (blockCid) {
    return this.blocks[blockCid]
  }

  ReceivedBlock (obj = {}) {
    let {to, from, block} = obj
    if (!from) {
      from = to
    }

    this.upsertMiner(to)
    this.upsertMiner(from)

    const b = new Block(block)
    // create block if does not exist
    if (!this.blocks[b.cid]) {
      this.blocks[b.cid] = b

      // create epoch if does not exist
      if (!this.epochs[b.epoch]) {
        this.epochs[b.epoch] = []
      }
      if (b.epoch > this.latestEpoch) {
        this.latestEpoch = b.epoch
      }
      // add block to epoch
      this.epochs[b.epoch].push(b)
    }

    this.blocks[b.cid].seenBy[to] = true
    this.blocks[b.cid].seenBy[from] = true

    return {
      name: 'ReceivedBlock',
      data: {},
      actions: [{
        type: 'highlight',
        cid: b.cid,
        counter: 'counterSeen'
      }]
    }
  }

  PickedChain (obj = {}) {
    const {node, block} = obj

    this.ReceivedBlock({to: node, block})
    this.minersHeads[node] = block.cid

    return {
      name: 'PickedChain',
      data: {},
      actions: [{
        type: 'highlight',
        cid: block.cid,
        counter: 'counterPicked'
      }]
    }
  }
}
