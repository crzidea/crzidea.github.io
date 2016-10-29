#!/usr/bin/env node
var store = []
const STEP_SIZE = 1024 * 1024           // 1 MB
const HIGHWATER = 4 * 1024 * STEP_SIZE  // 4 GB

function more() {
  var data = String.fromCharCode(store.length).repeat(STEP_SIZE)
  store.push(data)
  //console.log(`Round: ${store.length}`);


  var usage = process.memoryUsage()
  if (HIGHWATER < usage.rss) {
    console.log(usage)
    return
  }

  setImmediate(more)
}

more()
