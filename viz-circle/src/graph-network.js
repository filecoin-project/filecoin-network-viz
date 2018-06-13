module.exports = class NetworkGraph {
  constructor (target = '#viz-network .viz') {
    var width = d3.select(target).node().clientWidth * .75
    var height = width

    this.svg = d3.select(target).append('svg')
        .attr('id', 'network')
        .attr('width', width)
        .attr('height', height)
        .style('margin', '0 auto')
        .style('display', 'block')

    // Draw two arcs, nodes will be around this
    var dim = width - 80
    this.circle = this.svg.append('path')
        .attr('d', 'M 40, ' + (dim / 2 + 40) + ' a ' + dim / 2 + ',' + dim / 2 + ' 0 1,0 ' + dim + ',0 a ' + dim / 2 + ',' + dim / 2 + ' 0 1,0 ' + dim * -1 + ',0')
        .style('fill', '#f5f5f5')

    this.linesGroup = this.svg.append('g')
      .attr('id', 'paths')

    this.tooltip = d3.select(target).append('div')
      .attr('class', 'network-visualisation-tooltip')
      .style('opacity', 0)
      .html('')
  }

  DrawNodes (graph) {
    // Data
    const data = graph.nodes.map((node, i) => {
      var coord = circleCoord(this.circle, node, i, graph.nodes.length)
      node.x = coord.x
      node.y = coord.y
      return node
    })

    // Nodes
    var network = this.svg.selectAll('g.gnode')
      .data(data, function (d) { return d.id })

    // on creation
    var node = network
      .enter()
      .append('g')
      .attr('transform', d => {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
      .attr('class', d => {
        return 'gnode' + ' type-' + d.type
      })

    node.append('image').attr('class', 'node')
      .attr('width', 30)
      .attr('x', -15)
      .attr('y', -15)
      .transition()
        .duration(300)
        .attr('width', 60)
        .attr('x', -30)
        .attr('y', -30)
      .transition()
        .duration(300)
        .attr('width', 30)
        .attr('x', -15)
        .attr('y', -15)

    node.append('text').attr('class', 'name')
    node.append('text').attr('class', 'balance')
      .attr('dy', -20)
      .attr('dx', 0)
    node.append('image').attr('class', 'balanceIcon')
      .attr('href', 'img/filecoin.png')
      .attr('width', 15)
      .attr('y', -31)
      .attr('x', -20)
    node.on('mouseover', (d) => {
        this.tooltip.transition()
          .duration(500)
          .style('opacity', 1)
          .style("left", (d3.event.pageX) + 'px')
          .style("top", (d3.event.pageY) + 'px')

        let html = '<table>'

        const keys =  ['id', 'type', 'balance', 'storage']
        keys.forEach((key) => {
          html += `<tr><td><b>${key}</b></td><td>${d[key]}</td></tr>`
        })

        html += `<tr><td><b>explorer</b></td><td><a href="http://127.0.0.1:7003/#${d.cmdAddr}" target="_blank">explorer</a></td></tr>`

        html += '</table>'

        this.tooltip.html(html)
      })
      .on('mouseout', () =>
        this.tooltip.transition().duration(500).style('opacity', 0)
      )

    // on removal
    network
      .exit()
      .remove()

    // on upsert
    let transition = network
      .transition()
      .attr('transform', d => {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
      .attr('class', d => {
        return 'gnode' + ' type-' + d.type
      })

    network.select('image')
        .attr('href', d => 'img/' + d.type + '.png')

    network.selectAll('text.name')
        .attr('dy', 25)
        .attr('dx', -15)
        .text(d => { return d.id.slice(0, 10) })

    network.selectAll('text.balance')
      .text(d => { return d.balance })
  }

  DrawEvent (event) {
    event.actions.forEach(action => {
      if (action.type === 'send' || action.type === 'line') {
        this.runLinesAction(event, action)
      }
      if (action.type === 'icon') {
        this.runIconAction(event, action)
      }
    })
  }

  runIconAction (event, action) {
    this.svg.selectAll('g.gnode g image.new')
      .data(event.data.actors).enter()
      .append('image')
      .attr('class', action.name)
      .attr('width', 30)
      .attr('x', 20)
      .attr('y', -10)
      .attr('href', d => 'img/' + action.name + '.png')
      .attr('transform', d => {
        if (d) {
          return 'translate(' + d.x + ',' + d.y + ')'
        }
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

  runLineAction (event, action, data) {
    let lineAction = this.linesGroup
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
          .duration(1500)
          .ease('linear')
          .attrTween('transform', translateAlong(linePath.node()))
          .remove()
      }
    }

    linePath
      .transition()
        .duration(1500)
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

  runLinesAction (event, action) {
    // TODO: little hack, without this we only have one marker per path
    if (event.data.links.length > 1) {
      event.data.links.forEach(d => {
        this.runLineAction(event, action, {links: [d]})
      })
    } else if (event.data.links.length == 1) {
      this.runLineAction(event, action, event.data)
    }
  }
}

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
