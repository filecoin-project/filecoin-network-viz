const events = {
  'NewBlockMined': [],
  'BroadcastBlock': [],
  'AddAsk': [],
  'AddBid': [],
  'MakeDeal': [],
  'SendFile': [],
  'BroadcastTxn': [],
  'SendPayment': []
  // 'Connected': [],
  // 'MinerJoins': [],
  // 'MinerLeaves': [],
  // 'ClientJoins': [],
  // 'ClientLeaves': []
}

// creates the link
function send (from, to) {}
// creates the link with everyone
function broadcast (icon, from) {}
// sends something that moves from place to place
function flight (icon, from, to) {}
// creates a popup
function popup (from) {}

// returns random int between 0 and num
function getRandomInt () {
  return Math.floor(Math.random() * (num))
}

class Graph {
  constructor (miners, clients) {
    this.miners = miners.map(d => {
      d.type = 'miner'
      return d
    })
    this.clients = clients.map(d => {
      d.type = 'client'
      return d
    })
  }

  RandomMiner () {
    return this.miners[Math.floor(Math.random() * this.miners.length)]
  }

  RandomClient () {
    return this.clients[Math.floor(Math.random() * this.clients.length)]
  }

  RandomSend () {
    return {source: graph.RandomMiner(), target: graph.RandomClient()}
  }

  RandomBroadcastToMiners () {
    const from = graph.RandomClient()
    return this.miners.map(d => {
      return {source: from, target: d}
    })
  }

  RandomBroadcastMinerToAll () {
    const from = graph.RandomMiner()
    const miners = this.miners.map(d => {
      return {source: from, target: d}
    })
    const clients = this.clients.map(d => {
      return {source: from, target: d}
    })
    return miners.concat(clients)
  }

  RandomLinks () {
    return d3.range(graph.nodes.length)
      .map(d => {
        return {source: graph.RandomMiner(), target: graph.RandomClient()}
      })
  }

  get nodes () {
    return this.miners.concat(this.clients)
  }
}

// D3 -- Canvas
var width = 500
var height = 500

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height)

// Draw two arcs, nodes will be around this
var dim = width - 80
var circle = svg.append('path')
    .attr('d', 'M 40, ' + (dim / 2 + 40) + ' a ' + dim / 2 + ',' + dim / 2 + ' 0 1,0 ' + dim + ',0 a ' + dim / 2 + ',' + dim / 2 + ' 0 1,0 ' + dim * -1 + ',0')
    .style('fill', '#f5f5f5')

// evenly spaces nodes along arc
const circleCoord = (circle, node, index, num_nodes) => {
  var circumference = circle.node().getTotalLength()
  var sectionLength = (circumference) / num_nodes
  var position = sectionLength * index + sectionLength / 2
  return circle.node().getPointAtLength(circumference - position)
}

// D3 -- Position nodes around circle

// set up a graph
const miners = d3.range(10).map(d => { return {id: 'miner' + d} })
const clients = d3.range(10).map(d => { return {id: 'client' + d} })
const graph = new Graph(miners, clients)

// Data
const nodes = graph.nodes.map((node, i) => {
  var coord = circleCoord(circle, node, i, graph.nodes.length)
  node.x = coord.x
  node.y = coord.y
  return node
})
const links = graph.RandomLinks()

// Lines

var lines = svg.selectAll('path.node-link')
  .data(links).enter()
  .append('path')
  .attr('class', 'node-link')
  .attr('d', d => {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = Math.sqrt(dx * dx + dy * dy)
    return 'M' +
          d.source.x + ',' +
          d.source.y + 'A' +
          dr + ',' + dr + ' 0 0,1 ' +
          d.target.x + ',' +
          d.target.y
  })

const actionLink = graph.RandomBroadcastToMiners()
var reds = svg.selectAll('path.node-action')
  .data(actionLink)
  .enter()
  .append('path')
  .attr('class', 'node-action red')
  .attr('d', d => {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = Math.sqrt(dx * dx + dy * dy)
    return 'M' +
          d.source.x + ',' +
          d.source.y + 'A' +
          dr + ',' + dr + ' 0 0,1 ' +
          d.target.x + ',' +
          d.target.y
  })
 .attr('stroke-dasharray', function () {
   var totalLength = this.getTotalLength()
   return totalLength + ' ' + totalLength
 })
  .attr('stroke-dashoffset', function () {
    var totalLength = this.getTotalLength()
    return totalLength
  })
  .transition()
    .duration(600)
    .ease('linear')
    .attr('stroke-dashoffset', function () {
      return 0
    })
  .transition()
    .duration(300)
    .style('opacity', 0)
    .remove()

// Nodes

var gnodes = svg.selectAll('g.gnode')
  .data(nodes).enter()
  .append('g')
  .attr('transform', d => {
    return 'translate(' + d.x + ',' + d.y + ')'
  })
  .attr('class', d => {
    return 'gnode' + ' type-' + d.type
  })

// fades out lines that aren't connected to node d
const is_connected = (lines, d, opacity) => {
  lines.transition().style('stroke-opacity', o => {
    return o.source === d || o.target === d ? 1 : opacity
  })
}

var node = gnodes.append('circle')
    .attr('r', 25)
    .attr('class', (d) => {
      return 'node'
    })
    .on('mouseenter', function (d) {
      is_connected(lines, d, 0.1)
      node.transition().duration(100).attr('r', 25)
      d3.select(this).transition().duration(100).attr('r', 30)
    })
    .on('mouseleave', (d) => {
      node.transition().duration(100).attr('r', 25)
      is_connected(lines, d, 1)
    })

var labels = gnodes.append('text')
    .attr('dy', 4)
    .text(d => { return d.id })
