var midi = require("midi");

var input = new midi.input();
input.openVirtualPort("Node Test Inst");

input.on("message", function (deltaTime, message) {
  console.log("m:" + message + " d:" + deltaTime);
});
