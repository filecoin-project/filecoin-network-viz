// Events missing
// 'NewBlockMined',
// 'BroadcastTxn',
// 'Connected',
// 'MinerJoins',
// 'MinerLeaves',
// 'ClientJoins',
// 'ClientLeaves'

// This object has the list of miners, clients and possible actions
class Filecoin {
  constructor (miners, clients) {
    this.miners = miners.map(d => {
      d.type = 'miner'
      return d
    })
    this.clients = clients.map(d => {
      d.type = 'client'
      return d
    })
    this.events = [
      'BroadcastBlock',
      'AddAsk',
      'AddBid',
      'MakeDeal',
      'SendFile',
      'SendPayment'
    ]
  }

  RandomEvent () {
    const event = this.events[1 + Math.floor(Math.random() * (this.events.length - 1))]
    return this[event]()
  }

  BroadcastBlock (from) {
    return {
      name: 'BroadcastBlock',
      data: {
        links: this.GenerateBroadcast(from || this.RandomMiner())
      },
      actions: [{
        type: 'send',
        color: 'gray',
        marker: 'block'
      }]
    }
  }

  AddAsk (actor) {
    return {
      name: 'AddAsk',
      data: {
        actors: [actor || this.RandomMiner()]
      },
      actions: [{
        type: 'icon',
        name: 'ask'
      }]
    }
  }

  AddBid (actor) {
    return {
      name: 'AddBid',
      data: {
        actors: [actor || this.RandomClient()]
      },
      actions: [{
        type: 'icon',
        name: 'bid'
      }]
    }
  }

  MakeDeal (from, to) {
    from = from || this.RandomClient()
    to = to || this.RandomMiner()
    return {
      name: 'MakeDeal',
      data: {
        actors: [from, to],
        links: [this.GenerateLink(from, to)]
      },
      actions: [{
        type: 'icon',
        name: 'deal'
      }, {
        type: 'line',
        color: 'black'
      }]
    }
  }

  SendFile (from, to) {
    return {
      name: 'SendFile',
      data: {
        links: [this.GenerateLink(from || this.RandomClient(), to || this.RandomMiner())]
      },
      actions: [{
        type: 'send',
        color: 'red',
        marker: 'file'
      }]
    }
  }

  SendPayment (from, to) {
    return {
      name: 'SendPayment',
      data: {
        links: [this.GenerateLink(from || this.RandomClient(), to || this.RandomClient())]
      },
      actions: [{
        type: 'send',
        color: 'magenta',
        marker: 'filecoin'
      }]
    }
  }

  GenerateLink (from, to) {
    return {source: from, target: to}
  }

  GenerateBroadcast (from) {
    const miners = this.miners.map(d => {
      return {source: from, target: d}
    })
    const clients = this.clients.map(d => {
      return {source: from, target: d}
    })
    return miners.concat(clients)
  }

  RandomMiner () {
    return this.miners[Math.floor(Math.random() * this.miners.length)]
  }

  RandomClient () {
    return this.clients[Math.floor(Math.random() * this.clients.length)]
  }

  get nodes () {
    return this.miners.concat(this.clients)
  }
}

// -----------------------------------------------------------------------------

// D3 -- Canvas
var width = 700
var height = 700

var svg = d3.select('body').append('svg')
    .attr('id', 'network')
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

const translateAlong = (path) => {
  var l = path.getTotalLength()
  return (i) => {
    return (t) => {
      var p = path.getPointAtLength(t * l)
      return 'translate(' + p.x + ',' + p.y + ')'
    }
  }
}

// D3 -- Drawing the graph
function DrawNodes (graph) {
  // Data
  const nodes = graph.nodes.map((node, i) => {
    var coord = circleCoord(circle, node, i, graph.nodes.length)
    node.x = coord.x
    node.y = coord.y
    return node
  })

  // Nodes
  var gnodesD = svg.selectAll('g.gnode')
    .data(nodes)

  // on creation
  var gnodes = gnodesD
    .enter()
    .append('g')
    .attr('transform', d => {
      return 'translate(' + d.x + ',' + d.y + ')'
    })
    .attr('class', d => {
      return 'gnode' + ' type-' + d.type
    })

  gnodes.append('image')
  gnodes.append('text').attr('class', 'name')
  gnodes.append('text').attr('class', 'balance')

  // on removal
  gnodesD
    .exit()
    .remove()

  // on upsert
  gnodesD
    .transition()
    .attr('transform', d => {
      return 'translate(' + d.x + ',' + d.y + ')'
    })
    .attr('class', d => {
      return 'gnode' + ' type-' + d.type
    })

  gnodesD.select('image')
      .attr('href', d => 'img/' + d.type + '.png')
      .attr('width', 30)
      .attr('x', -15)
      .attr('y', -15)
      .attr('class', (d) => {
        return 'node'
      })

  gnodesD.select('text.name')
      .attr('dy', 25)
      .attr('dx', -15)
      .text(d => { return d.id })

  gnodesD.select('text.balance')
      .attr('dy', -20)
      .attr('dx', -15)
      // .text(d => { return d.id })
}

// -----------------------------------------------------------------------------

// Running actions

function runIconAction (event, action) {
  svg.selectAll('g.gnode g image.new')
    .data(event.data.actors).enter()
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

function runLineAction (event, action, data) {
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

function runLinesAction (event, action) {
  // TODO: little hack, without this we only have one marker per path
  if (event.data.links.length > 1) {
    event.data.links.forEach(d => {
      runLineAction(event, action, {links: [d]})
    })
  } else {
    runLineAction(event, action, event.data)
  }
}

function runEvent (event) {
  event.actions.forEach(action => {
    if (action.type === 'send' || action.type === 'line') {
      runLinesAction(event, action)
    }
    if (action.type === 'icon') {
      runIconAction(event, action)
    }
  })
}

// -----------------------------------------------------------------------------

// Main

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

let minersCount = 10
let clientsCount = 10

let miners = d3.range(minersCount).map(d => { return {id: 'miner' + d} })
let clients = d3.range(clientsCount).map(d => { return {id: 'client' + d} })
let filecoin = new Filecoin(miners, clients)

DrawNodes(filecoin)

// setInterval(() => {
//   minersCount += getRandomInt(0, 6) - 3
//   clientsCount += getRandomInt(0, 6) - 3
//   miners = d3.range(minersCount || 10).map(d => { return {id: 'miner' + d} })
//   clients = d3.range(clientsCount || 10).map(d => { return {id: 'client' + d} })
//   filecoin = new Filecoin(miners, clients)

//   DrawNodes(filecoin)
// }, 6000)

const chain = []

setInterval(() => {
  chain.push({id: chain.length + 1})
  runEvent(filecoin.BroadcastBlock())
  DrawBlockchain(chain)
}, 1000)

setInterval(() => {
  runEvent(filecoin.RandomEvent())
}, 500)

// D3 -- Canvas
var width = 300
var height = 700

var svg2 = d3.select('body').append('svg')
    .attr('id', 'blockchain')
    .attr('width', width)
    .attr('height', height)

function DrawBlockchain (data) {
  // const sliced = data.slice(-3)
  // console.log(sliced)
  lis = svg2.selectAll('g.block')
    .data(data)

  let block = lis.enter().append('g')
    .attr('class', d => 'block b-' + d.id)

  lis.exit().remove()

  lis
    .transition()
    .attr('transform', (d, i) => {
      return 'translate(0,' + (data.length - i) * 50 + ')'
    })

  block.append('image')
    .attr('href', 'img/block.png')
    .attr('width', 50)

  block.append('text')
    .attr('x', 60)
    .attr('y', 50)

  lis.selectAll('text')
    .transition()
    .text(d => 'Block ' + d.id)
}
