import "./App.css";
import { useEffect, useState } from "react";
import { Scale, Midi } from "@tonaljs/tonal";

let midiIn = [];
let midiOut = [];

function scaleIterator(scaleDescriptor) {
  const range = Scale.rangeOf(scaleDescriptor)("C3", "C7");
  let index = 0;

  return {
    next: (inc = 1)=>{
      index += inc;
      return range[index];
    },
    prev: (inc = 1)=>{
      index -= inc
      return range[index];
    },
    current: ()=>{
      return range[index];
    },
    hasNext: (inc = 1)=>{
      return (index + inc) >= range.length;
    },
    hasPrev: (inc = 1)=>{
      return index < inc;
    }
  };
}

const scale = scaleIterator("C minor");

function App() {
  const [centerNote, setCenterNote] = useState(scale.current());

  useEffect(connect, []);

  const handleClick = (note) => {
    setCenterNote(note);
    sendMidiMessage(midiOut[0], Midi.toMidi(note), 1, 1);
  };

  return (
    <div>
      <button disabled={scale.hasPrev(2)} onClick={() => handleClick(scale.prev(2))}>{"- 3rd"}</button>
      <button disabled={scale.hasPrev()} onClick={() => handleClick(scale.prev())}>{"- 2nd"}</button>
      <button onClick={() => handleClick(scale.current())}>{centerNote}</button>
      <button disabled={scale.hasNext()} onClick={() => handleClick(scale.next())}>{"+ 2nd"}</button>
      <button disabled={scale.hasNext(2)} onClick={() => handleClick(scale.next(2))}>{"+ 3rd"}</button>
    </div>
  );
}

export default App;

function connect() {
  navigator.requestMIDIAccess().then(
    (midi) => midiReady(midi),
    (err) => console.log("Something went wrong", err)
  );
}

function midiReady(midi) {
  // Also react to device changes.
  midi.addEventListener("statechange", (event) => initDevices(event.target));
  initDevices(midi); // see the next section!
}

function initDevices(midi) {
  // Reset.
  midiIn = [];
  midiOut = [];

  // MIDI devices that send you data.
  const inputs = midi.inputs.values();
  for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
    midiIn.push(input.value);
  }

  // MIDI devices that you send data to.
  const outputs = midi.outputs.values();
  for (
    let output = outputs.next();
    output && !output.done;
    output = outputs.next()
  ) {
    midiOut.push(output.value);
  }

  console.log(midiIn, midiOut);
  startListening();
}

// Start listening to MIDI messages.
function startListening() {
  for (const input of midiIn) {
    input.addEventListener("midimessage", midiMessageReceived);
  }
}

function sendMidiMessage(device, pitch, velocity, duration) {
  const NOTE_ON = 0x90;
  const NOTE_OFF = 0x80;

  const msgOn = [NOTE_ON, pitch, velocity];
  const msgOff = [NOTE_ON, pitch, velocity];

  // First send the note on;
  device.send(msgOn);

  // Then send the note off. You can send this separately if you want
  // (i.e. when the button is released)
  device.send(msgOff, Date.now() + duration);
}

function midiMessageReceived(event) {
  // MIDI commands we care about. See
  // http://webaudio.github.io/web-midi-api/#a-simple-monophonic-sine-wave-midi-synthesizer.
  const NOTE_ON = 9;
  const NOTE_OFF = 8;

  const cmd = event.data[0] >> 4;
  const pitch = event.data[1];
  const velocity = event.data.length > 2 ? event.data[2] : 1;

  // You can use the timestamp to figure out the duration of each note.
  const timestamp = Date.now();

  // Note that not all MIDI controllers send a separate NOTE_OFF command for every NOTE_ON.
  if (cmd === NOTE_OFF || (cmd === NOTE_ON && velocity === 0)) {
    console.log(
      `🎧 from ${event.srcElement.name} note off: pitch:${pitch}, velocity: ${velocity}`
    );

    // Complete the note!
    const note = notesOn.get(pitch);
    if (note) {
      console.log(`🎵 pitch:${pitch}, duration:${timestamp - note} ms.`);
    }
  } else if (cmd === NOTE_ON) {
    console.log(
      `🎧 from ${event.srcElement.name} note off: pitch:${pitch}, velocity: {velocity}`
    );
  }
}
