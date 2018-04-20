// const events = {
//   'NewBlockMined',
//   'BroadcastBlock', xx
//   'AddAsk', xx
//   'AddBid', xx
//   'MakeDeal', xx
//   'SendFile', xx
//   'BroadcastTxn',
//   'SendPayment' xx
//   // 'Connected',
//   // 'MinerJoins',
//   // 'MinerLeaves',
//   // 'ClientJoins',
//   // 'ClientLeaves'
// }

const actions = [
  {
    name: 'BroadcastBlock',
    data (g) {
      return {
        links: g.RandomBroadcastMinerToAll()
      }
    },
    actions: [{
      type: 'send',
      color: 'gray',
      marker: 'block'
    }]
  },
  {
    name: 'AddAsk',
    data (g) {
      return {
        actors: [g.RandomMiner()]
      }
    },
    actions: [{
      type: 'icon',
      name: 'ask'
    }]
  },
  {
    name: 'AddBid',
    data (g) {
      return {
        actors: [g.RandomClient()]
      }
    },
    actions: [{
      type: 'icon',
      name: 'bid'
    }]
  },
  {
    name: 'MakeDeal',
    data (g) {
      const from = g.RandomClient()
      const to = g.RandomMiner()
      return {
        actors: [from, to],
        links: [g.Send(from, to)]
      }
    },
    actions: [{
      type: 'icon',
      name: 'deal'
    },
    {
      type: 'line',
      color: 'black'
    }
    ]
  },
  {
    name: 'SendFile',
    data (g) {
      return {
        links: [g.Send(g.RandomClient(), g.RandomMiner())]
      }
    },
    actions: [{
      type: 'send',
      color: 'red',
      marker: 'file'
    }]
  },
  {
    name: 'SendPayment',
    data (g) {
      return {
        links: [g.Send(g.RandomClient(), g.RandomClient())]
      }
    },
    actions: [{
      type: 'send',
      color: 'magenta',
      marker: 'filecoin'
    }]
  }
]
function getRandomAction () {
  return actions[1 + Math.floor(Math.random() * (actions.length - 1))]
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

  Send (from, to) {
    return {source: from, target: to}
  }

  RandomBroadcastToMiners () {
    const from = this.RandomClient()
    return this.miners.map(d => {
      return {source: from, target: d}
    })
  }

  RandomBroadcastMinerToAll () {
    const from = this.RandomMiner()
    return this.BroadcastToAll(from)
  }

  BroadcastToAll (from) {
    const miners = this.miners.map(d => {
      return {source: from, target: d}
    })
    const clients = this.clients.map(d => {
      return {source: from, target: d}
    })
    return miners.concat(clients)
  }

  RandomLinks () {
    return d3.range(this.nodes.length)
      .map(d => {
        return {source: graph.RandomMiner(), target: graph.RandomClient()}
      })
  }

  get nodes () {
    return this.miners.concat(this.clients)
  }
}

// D3 -- Canvas
var width = 700
var height = 700

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height)

// Draw two arcs, nodes will be around this
var dim = width - 80
var circle = svg.append('path')
    .attr('d', 'M 40, ' + (dim / 2 + 40) + ' a ' + dim / 2 + ',' + dim / 2 + ' 0 1,0 ' + dim + ',0 a ' + dim / 2 + ',' + dim / 2 + ' 0 1,0 ' + dim * -1 + ',0')
    .style('fill', '#f5f5f5')

var linesGroup = svg.append('g')
  .attr('id', 'paths')

// evenly spaces nodes along arc
const circleCoord = (circle, node, index, num_nodes) => {
  var circumference = circle.node().getTotalLength()
  var sectionLength = (circumference) / num_nodes
  var position = sectionLength * index + sectionLength / 2
  return circle.node().getPointAtLength(circumference - position)
}

// D3 -- Drawing the graph

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

// var lines = svg.selectAll('path.node-link')
//   .data(links).enter()
//   .append('path')
//   .attr('class', 'node-link')
//   .attr('d', d => {
//     var dx = d.target.x - d.source.x,
//       dy = d.target.y - d.source.y,
//       dr = Math.sqrt(dx * dx + dy * dy)
//     return 'M' +
//           d.source.x + ',' +
//           d.source.y + 'A' +
//           dr + ',' + dr + ' 0 0,1 ' +
//           d.target.x + ',' +
//           d.target.y
//   })

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

var node = gnodes.append('image')
    .attr('href', d => 'img/' + d.type + '.png')
    .attr('width', 30)
    .attr('x', -15)
    .attr('y', -15)
    .attr('class', (d) => {
      return 'node'
    })

var labels = gnodes.append('text')
    .attr('dy', 25)
    .attr('dx', -15)
    .text(d => { return d.id })

function runIconAction (data, event, action) {
  svg.selectAll('g.gnode g image.new')
    .data(data.actors).enter()
    .append('image')
    .attr('class', action.name)
    .attr('width', 30)
    .attr('x', 20)
    .attr('y', -10)
    .attr('href', d => 'img/' + action.name + '.png')
    .attr('transform', d => {
      return 'translate(' + d.x + ',' + d.y + ')'
    })
    .transition()
      .duration(800)
      .ease('linear')
      .style('opacity', 1)
    .transition()
      .duration(300)
      .ease('linear')
      .style('opacity', 0)
      .remove()
}

function translateAlong (path) {
  var l = path.getTotalLength()
  return function (i) {
    return function (t) {
      var p = path.getPointAtLength(t * l)
      return 'translate(' + p.x + ',' + p.y + ')'
    }
  }
}

function runLineAction (data, event, action) {
  let lineAction = linesGroup
    .attr('class', 'action')
    .selectAll('path.node-action.new')
    .data(data.links)
    .enter()

  let linePath = lineAction
    .append('path')
    .attr('class', 'node-action action-' + event.name)
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
    .attr('stroke', function (d) {
      return action.color
    })

  if (action.type === 'send') {
    linePath = linePath
      .attr('stroke-dasharray', function () {
        var totalLength = this.getTotalLength()
        return totalLength + ' ' + totalLength
      })
      .attr('stroke-dashoffset', function () {
        var totalLength = this.getTotalLength()
        return totalLength
      })

    if (action.marker) {
      let lineMarker = lineAction
      .append('image')
      .attr('class', 'marker')
      .attr('href', 'img/' + action.marker + '.png')
      .attr('width', 20)
      .attr('x', -10)
      .attr('y', -10)
      .transition()
        .duration(800)
        .ease('linear')
        .attrTween('transform', translateAlong(linePath.node()))
        .remove()
    }
  }

  linePath
    .transition()
      .duration(800)
      .ease('linear')
      .attr('stroke-dashoffset', function () {
        return 0
      })
    .transition()
      .duration(300)
      .ease('linear')
      .style('opacity', 0)
      .remove()
}

function runAction (g, event) {
  const data = event.data(g)
  event.actions.forEach(action => {
    if (action.type === 'send' || action.type === 'line') {
      // TODO: little hack, without this we only have one marker per path
      if (data.links.length > 1) {
        data.links.forEach(d => {
          runLineAction({links: [d]}, event, action)
        })
      } else {
        runLineAction(data, event, action)
      }
    }
    if (action.type === 'icon') {
      runIconAction(data, event, action)
    }
  })
}

// for (var i = 0; i < graph.miners.length; i++) {
//   runLineAction(graph.BroadcastToAll(graph.miners[i]), actions[0], actions[0].actions[0])
// }

// runAction(graph, actions[0])

setInterval(() => {
  const action = actions[0]
  runAction(graph, action)
}, 5000)

setInterval(() => {
  const action = getRandomAction()
  runAction(graph, action)
}, 310)
