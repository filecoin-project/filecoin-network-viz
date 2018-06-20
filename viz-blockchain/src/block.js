module.exports = class Block {
  constructor (obj = {}) {
    this.cid = obj.cid || 'testblock'
    this.parents = obj.parents || []
    this.seenBy = obj.seenBy || {}
    this.latestEpoch = 0
    this.epoch = obj.epoch
  }
  get seen () {
    return Object.keys(this.seenBy).length
  }
}
