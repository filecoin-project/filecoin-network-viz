var test = require('tape')

const Simulation = require('./simulation')
const Block = require('./block')

test('block', function (t) {
  t.plan(1)

  const p1 = new Block()
  const p2 = new Block()
  const b = new Block({epoch: 1, parents: [p1, p2]})
  t.equal(b.parents.length, 2, 'block parents constructor works')
})

test('simulation', function (t) {
  t.plan(8)

  const sim = new Simulation()
  sim.runEpoch(4)
  t.equal(sim.epoch, 0, 'epoch 0 exists')
  t.equal(sim.filecoin.epochs[sim.epoch].length, 4, 'epoch 0 has 4 elements')

  sim.runEpoch(4)
  t.equal(sim.epoch, 1, 'epoch 1 exists')
  t.equal(sim.filecoin.epochs[sim.epoch].length, 4, 'epoch 1 has 4 elements')

  const blocks = sim.filecoin.epochs[sim.epoch]
  blocks.forEach((b, i) => {
    t.equal(b.parents.length, 4, 'block ' + b.cid + ' has 4 parents')
  })

  sim.filecoin.epoch
})
