var stream    = require('stream')
var readable  = stream.Readable()
var passThrough = stream.PassThrough()

var data = [1, 2, 3, 4, 5]
readable._read = function() {
  setTimeout(() => {
    if (!data.length) {
      this.push(null)
      return
    }
    this.push(data.shift().toString())
  }, 1000);
}
readable.pipe(passThrough)

readable.on('data', function onData(chunk) {
  console.log(passThrough._readableState.buffer);
  chunk = passThrough.read()
  if (null === chunk) {
    return
  }
  console.log(`length: ${chunk.length}`);
  if (data.length) {
    passThrough.unshift(chunk)
    return
  }
  console.log(`result: ${chunk}`)
})
