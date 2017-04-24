const EventEmitter = require('events')

//(async function hello() {
  //await new Promise((resolve) => {
    //setTimeout(resolve, 1000);
  //})
  //console.log(1);
//})()
//

console.log(1, Date.now());
const emitter = new EventEmitter

emitter.on('hello', async function() {
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  })
  console.log(2, Date.now());
})
emitter.on('hello', async function() {
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  })
  console.log(3, Date.now());
})

emitter.on('hello', async function() {
  await (async function() {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    })
    console.log(4, Date.now());
  })()
  console.log(5, Date.now());
})

emitter.on('hello', async function() {
  await (_ => _)()
  console.log(6, Date.now());
})

emitter.emit('hello')
