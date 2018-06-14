module.exports = class ChainGraph {
  constructor (target = '#viz-chain .viz') {
    this.svg = d3.select(target).append('svg')
    .attr('id', 'blockchain')
    .attr('width', 200)
    .attr('height', 700)
  }

  Draw (data) {
    const blockchain = this.svg.selectAll('g.block')
      .data(data, d => d.cid)

    // on blocks being added
    let block = blockchain.enter()
      .append('g')
      .attr('class', d => 'block b-' + d.cid)

    block.append('image')
      .attr('href', 'img/block.png')
      .attr('width', 50)

    block.append('text')
      .attr('class', 'block-number')
      .attr('x', 60)
      .attr('y', 50)
      .text(d => 'Block ' + d.cid.slice(0, 10))

    // block.append('text')
    //   .attr('class', 'block-miner')
    //   .attr('x', 60)
    //   .attr('y', 65)
    //   .text(d => 'miner: ' + d.miner.id.slice(0, 10))

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
