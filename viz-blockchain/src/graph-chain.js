const dagre = require('dagre')

const dagLayout = require('./dag-layout')

module.exports = class ChainGraph {
  constructor (target = '#viz-chain .viz') {
    this.svg = d3.select(target).append('svg')
    .attr('id', 'blockchain')
    .attr('width', 200)
    .attr('height', 700)
  }

  Draw (filecoin) {
    const g = dagLayout(filecoin)
    // g.nodes().forEach(function (v) {
    //   console.log('Node ' + v + ': ' + JSON.stringify(g.node(v)))
    // })
    // g.edges().forEach(function (e) {
    //   console.log('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(g.edge(e)))
    // })

    // console.log(filecoin.GetEpochs())

  //   // Blockchain --
  //   const epoch = this.svg.selectAll('g.epoch')
  //     .data(filecoin.GetEpochs(), (d, i) => i)

  //   // Epochs ---

  //   // on blocks being added
  //   epoch.enter()
  //     .append('g')
  //     .attr('class', (d, i) => 'epoch e-' + i)

  //   // on blocks being removed
  //   epoch.exit()
  //     .remove()

  //   // on blocks being updated
  //   epoch
  //     .transition()
  //     .attr('transform', (d, i) => {
  //       return 'translate(0,' + (filecoin.GetEpochs().length - i) * 50 + ')'
  //     })

  //   // Blocks --
  //   const block = epoch
  //     .selectAll('g.epoch')
  //     .data(d => {
  //       console.log(d)
  //       return d
  //     })

  //   // on blocks being added

  //   const newBlock = block.enter()
  //     .append('g')
  //     .attr('class', (d, i) => 'block b-' + d)

  //   newBlock.append('image')
  //     .attr('href', 'img/block.png')
  //     .attr('width', 50)

  //   newBlock.append('text')
  //     .attr('class', 'epoch-number')
  //     .attr('x', 60)
  //     .attr('y', 50)

  //   // on blocks being deleted
  //   block.exit()
  //     .remove()

  //   // on blocks being updated
  //   block.select('text')
  //     .text((d, i) => 'Block ' + d)
  }
}
