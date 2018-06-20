const dagre = require('dagre')

module.exports = (filecoin) => {
  var g = new dagre.graphlib.Graph()
  g.setGraph({})
  g.setDefaultEdgeLabel(function () { return {} })
    // add nodes
  for (let blockCid in filecoin.blocks) {
    g.setNode(blockCid, { label: 'b: ' + blockCid, width: 100, height: 100 })
  }
    // add parents
  for (let blockCid in filecoin.blocks) {
    const block = filecoin.blocks[blockCid]
    block.parents.forEach(p => {
      g.setEdge(blockCid, p.cid)
    })
  }
  dagre.layout(g)
  return g
}
