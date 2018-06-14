const GetRandomInt = require('./utils').GetRandomInt

class Block {
  constructor (obj = {}) {
    this.cid = obj.cid || 'testblock'
    this.parents = obj.parents || []
    this.seenBy = obj.seenBy || {}
  }
  get seen () {
    return Object.keys(this.seenBy).length
  }
}

module.exports = class Filecoin {
  constructor (obj = {blocks: {}, minersHeads: {}}) {
    this.epochs = [] // [int]blockCid
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
    console.log('getting block', blockCid, this.blocks[blockCid])
    return this.blocks[blockCid]
  }

  ReceivedBlock (obj = {}) {
    let {to, from, block} = obj
    if (!from) {
      from = to
    }

    this.upsertMiner(to)
    this.upsertMiner(from)

    // create block if does not exist
    if (!this.blocks[block.cid]) {
      this.blocks[block.cid] = new Block(block)

      // create epoch if does not exist
      if (!this.epochs[block.epoch]) {
        this.epochs[block.epoch] = []
      }
      // add block to epoch
      this.epochs[block.epoch].push(block.cid)
    }

    this.blocks[block.cid].seenBy[to] = true
    this.blocks[block.cid].seenBy[from] = true

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
