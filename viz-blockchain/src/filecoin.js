const GetRandomInt = require('./utils').GetRandomInt
const Block = require('./block')

module.exports = class Filecoin {
  constructor (obj = {blocks: {}, minersHeads: {}}) {
    this.epochs = [] // [int]Block
    this.blocks = {} // block-cid => [Block]
    this.minersHeads = {} // miner-id => block-cid

    this.events = [
      'ReceivedBlock',
      'PickedChain'
    ]
  }

  get miners () {
    return Object.keys(this.minersHeads)
  }

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
      actions: []
    }
  }

  PickedChain (obj = {}) {
    const {node, block} = obj

    this.ReceivedBlock({to: node, block})
    this.minersHeads[node] = block.cid

    return {
      name: 'PickedChain',
      data: {},
      actions: []
    }
  }

  RandomEvent () {
    let event
    // while (event !== false) {
    event = this.events[1 + Math.floor(Math.random() * (this.events.length - 1))]
    // }
    return this[event]()
  }
}
