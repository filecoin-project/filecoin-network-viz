module.exports = class Block {
  constructor (obj = {}) {
    this.cid = obj.cid || 'testblock'
    this.parents = obj.parents || []
    this.seenBy = obj.seenBy || {}
    this.height = obj.height !== undefined ? obj.height : -1
  }
  get seen () {
    return Object.keys(this.seenBy).length
  }
}
