const Benchmark = require('benchmark')
const suite = new Benchmark.Suite

const buffer = new Buffer('abcdefghigklmn')

suite
.add('Buffer#slice()', () => {
  const newBuffer = buffer.slice(3)
  const byte = newBuffer.readUInt8(0)
})
.add('Optimized', () => {
  const byte = buffer.readUInt8(3)
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run()
