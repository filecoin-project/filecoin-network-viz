module.exports = class ChainGraph {
  constructor (target = '#viz-chain .viz') {
    this.svg = d3.select(target).append('svg')
    .attr('id', 'blockchain')
    .attr('width', 200)
    .attr('height', 1000)
  }

  Draw (data) {
    data = data.slice(-15)

    const blockchain = this.svg.selectAll('g.block')
      .data(data, d => d.id)

    // on blocks being added
    let block = blockchain.enter()
      .append('g')
      .attr('class', d => 'block b-' + d.id)

    block.append('image')
      .attr('href', 'img/block-crop.png')
      .attr('width', 50)

    block.append('text')
      .attr('class', 'block-number')
      .attr('x', 60)
      .attr('y', 30)
      .text(d => 'Block ' + d.id.slice(0, 10))

    block.append('text')
      .attr('class', 'block-miner')
      .attr('x', 60)
      .attr('y', 45)
      .text(d => 'miner: ' + d.miner.id.slice(0, 10))

    // on blocks being removed
    blockchain.exit()
      .remove()

    // on blocks being updated
    blockchain
      .transition()
      .attr('transform', (d, i) => {
        return 'translate(0,' + (data.length - i) * 50 + ')'
      })
  }
}
