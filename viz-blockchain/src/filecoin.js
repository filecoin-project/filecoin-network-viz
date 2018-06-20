const GetRandomInt = require('./utils').GetRandomInt
const Block = require('./block')

// how to use it:
// filecoin.blocks is a map cid->Block
// filecoin.miners is a list of miner ids
// filecoin.heads is a map of cid->miners
// filecoin.blocks[0].seen shows the miners count
module.exports = class Filecoin {
  constructor (obj = {blocks: {}, minersHeads: {}}) {
    this.latestHeight = 0
    this.heights = [] // [int]Block
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

  ReceivedBlock (obj = {}, rec = false) {
    // console.log('received', obj.block, rec)
    let {to, from, block} = obj

    const b = new Block(block)

    b.parents.forEach(p => {
      this.ReceivedBlock({
        from: from,
        to: to,
        block: {cid: p, height: b.height - 1}
      }, true)
    })

    // create block if does not exist
    console.log('adding', obj.block, b)
    if (!this.blocks[b.cid]) {
      this.blocks[b.cid] = b

      // create height if does not exist
      if (b.height > -1) {
        if (!this.heights[b.height]) {
          this.heights[b.height] = []
        }
        if (b.height > this.latestHeight) {
          this.latestHeight = b.height
        }
        // add block to height
        this.heights[b.height].push(b)
        console.log('adding', b.cid, 'in height', b.height)
      }
    } else {
      // console.log('already found!', b)
    }

    // sometimes we might receive a block as a parent of a node
    // and we don't really get its parents
    // so whenever we receive the actual block, we update its parents!
    if (this.blocks[b.cid].parents.length === 0 && b.parents.length > 0) {
      this.blocks[b.cid].parents = b.parents
    }

    // update seen
    if (to) {
      this.blocks[b.cid].seenBy[to] = true
      this.upsertMiner(to)
    }
    if (from) {
      this.upsertMiner(from)
      this.blocks[b.cid].seenBy[from] = true
    }

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
