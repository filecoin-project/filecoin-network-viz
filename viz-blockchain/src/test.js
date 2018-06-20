var test = require('tape')

const Simulation = require('./simulation')
const Filecoin = require('./filecoin')
const Block = require('./block')

test('block', function (t) {
  t.plan(1)

  const p1 = new Block()
  const p2 = new Block()
  const b = new Block({heights: 1, parents: [p1.cid, p2.cid]})
  t.equal(b.parents.length, 2, 'block parents constructor works')
})

test.only('received block', function (t) {
  t.plan(9)

  // adding parent and then current
  const f1 = new Filecoin()
  f1.ReceivedBlock({from: 'm1', block: {cid: 'b1'}})
  f1.ReceivedBlock({from: 'm1', block: {cid: 'b2a', parents: ['b1']}})
  f1.ReceivedBlock({from: 'm1', block: {cid: 'b2b', parents: ['b1']}})
  f1.ReceivedBlock({from: 'm1', block: {cid: 'b3', parents: ['b2a', 'b2b']}})
  t.deepEqual(Object.keys(f1.blocks), ['b1', 'b2a', 'b2b', 'b3'], 'total of two blocks')
  t.equal(f1.blocks['b1'].parents.length, 0, 'initial node added with no parents')
  t.equal(f1.blocks['b2a'].parents.length, 1, 'second node added with one parent')
  t.equal(f1.blocks['b2b'].parents.length, 1, 'third node added with one parent')
  t.equal(f1.blocks['b3'].parents.length, 2, 'fourth node added with two parents')

  // directly add current block with unknown parent
  const f2 = new Filecoin()
  f2.ReceivedBlock({from: 'm1', block: {cid: 'b4', parents: ['b3']}})
  t.deepEqual(Object.keys(f2.blocks), ['b3', 'b4'], 'total of two blocks')
  t.equal(f2.blocks['b4'].parents.length, 1, 'parent is correctly added')
  t.equal(f2.blocks['b3'].parents.length, 0, 'node added as a parent does not have parents on record')

  f2.ReceivedBlock({from: 'm1', block: {cid: 'b3', parents: ['b2']}})
  t.equal(f2.blocks['b3'].parents.length, 1, 'node added as a parent has a parent on update')
})

test('simulation', function (t) {
  t.plan(8)

  const sim = new Simulation()
  sim.runEpoch(4)
  t.equal(sim.height, 0, 'height 0 exists')
  t.equal(sim.filecoin.heights[sim.height].length, 4, 'height 0 has 4 elements')

  sim.runEpoch(4)
  t.equal(sim.height, 1, 'height 1 exists')
  t.equal(sim.filecoin.heights[sim.height].length, 4, 'height 1 has 4 elements')

  const blocks = sim.filecoin.heights[sim.height]
  blocks.forEach((b, i) => {
    t.equal(b.parents.length, 4, 'block ' + b.cid + ' has 4 parents')
  })

  sim.filecoin.height
})
