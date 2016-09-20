function* a() {
  yield Promise.resolve(1)
  yield new Promise((resolve) => {
    setTimeout(_ => resolve(2), 1000)
  })
  generator.next()
  return Promise.resolve(3)
}

var generator = a()

function runGenerator(returnValue) {
  var iterator = generator.next(returnValue)
  iterator.value
  .then((value) => {
    console.log(`value: ${value}`);
    if (iterator.done) {
      return
    }
    iterator = null
    runGenerator(value)
  })
  .catch((e) => {
    console.error(e.stack);
    generator.throw(e)
  })
}

runGenerator()
