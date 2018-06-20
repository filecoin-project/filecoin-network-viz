const dagre = require('dagre')

module.exports = (filecoin, blockStyle) => {
  var g = new dagre.graphlib.Graph()
  g.setGraph({nodesep: 80})
  g.setDefaultEdgeLabel(function () { return {} })
  g.setDefaultNodeLabel(function () { return {} })
    // add nodes
  for (let blockCid in filecoin.blocks) {
    g.setNode(blockCid, { width: blockStyle.width, height: blockStyle.height })
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
