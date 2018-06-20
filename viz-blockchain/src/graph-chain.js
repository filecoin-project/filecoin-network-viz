const dagre = require('dagre')

const dagLayout = require('./dag-layout')

const blockSizes = {
  width: 50,
  height: 70
}

module.exports = class ChainGraph {
  constructor (target = '#viz-chain .viz') {
    const svg = d3.select(target).append('svg')
    .attr('id', 'blockchain')
    .attr('width', 1200)
    .attr('height', 1200)
    .append('g')

    const rect = svg.append('rect')
      .attr('width', 1200)
      .attr('height', 1200)
      .style('fill', 'none')
      .style('pointer-events', 'all')

    const container = svg.append('g')

    this.arrows = container
      .append('g')
      .attr('class', 'arrows')

    this.blocks = container
      .append('g')
      .attr('class', 'blocks')

    var zoom = d3.behavior.zoom()
      // .scaleExtent([1, 10])
      .on('zoom', () => {
        container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')')
      })
    svg.call(zoom)
  }

  DrawBlocks (filecoin, dag) {
    const block = this.blocks.selectAll('g.block')
      .data(dag.nodes())

    const newBlock = block.enter()
      .append('g')
      .attr('class', d => 'block')

    newBlock.append('foreignObject')
      .attr('class', 'fo-blockname')
      .append('xhtml:body')
        .html('<div class="minerId">yo</div>')

    newBlock.append('foreignObject')
      .attr('class', 'fo-counters')
      .attr('transform', d => {
        const node = dag.node(d)
        return 'translate(' + blockSizes.width + ',' + 0 + ')'
      })
      .append('xhtml:body')
        .html('<div class="counters"><div class="counter counterPicked">1</div><div class="counter counterSeen">1</div></div>')

    newBlock.append('image')
      .attr('href', 'img/block.png')
      .attr('width', 50)

    block
      .attr('class', d => 'block b-' + d)
      .transition()
      .attr('transform', d => {
        const node = dag.node(d)
        return 'translate(' + node.x + ',' + node.y + ')'
      })

    block.select('.minerId')
        .text(d => filecoin.blocks[d].cid)
    block.select('.counterSeen')
        .text(d => filecoin.blocks[d].seen)
    block.select('.counterPicked')
        .text(d => filecoin.heads[d] || 0)
  }

  DrawArrows (filecoin, dag) {
    const data = dag.edges().map(e => [dag.node(e.v), dag.node(e.w)])

    const arrow = this.arrows.selectAll('g.arrow')
      .data(data)

    const newArrow = arrow.enter()
      .append('g')
      .attr('class', 'arrow')

    newArrow
      .append('line')
        .attr('class', 'arrow1')

    arrow
      .transition()
      .select('line.arrow1')
        .attr('x1', d => d[0].x + blockSizes.width / 2)
        .attr('y1', d => d[0].y + blockSizes.height + 2)
        .attr('x2', d => d[1].x + blockSizes.width / 2)
        .attr('y2', d => d[1].y + 16)
  }

  DrawHighlight (event, action) {
    const block = this.blocks.select('.b-' + action.cid + ' .' + action.counter)
    console.log('soon to highlight', action.cid, action.counter)

    block
      .transition()
        .duration(100)
        .style('background', '#fdc433')
      .transition()
        .delay(300)
        .duration(100)
        .style('background', action.counter == 'counterPicked' ? '#1E90FB' : '#555555')
  }

  Draw (filecoin, event) {
    const dag = dagLayout(filecoin, blockSizes)
    this.DrawBlocks(filecoin, dag)
    this.DrawArrows(filecoin, dag)

    if (event) {
      event.actions.forEach(action => {
        if (action.type === 'highlight') {
          this.DrawHighlight(event, action)
        }
      })
    }
  }
}
