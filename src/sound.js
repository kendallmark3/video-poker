// Synthesized sound effects with the Web Audio API: no audio files.
// Muted by default. The audio context is created on the first enable, which happens
// inside a user gesture (the Sound toggle), as browsers require.

// Each effect is a list of notes: [frequency Hz, start s, length s, waveform].
const EFFECTS = {
  deal: [[520, 0, 0.05, 'triangle']],
  hold: [[880, 0, 0.06, 'square']],
  win: [
    [523, 0, 0.12, 'triangle'],
    [659, 0.1, 0.12, 'triangle'],
    [784, 0.2, 0.12, 'triangle'],
    [1047, 0.3, 0.3, 'triangle'],
  ],
  lose: [
    [220, 0, 0.16, 'sawtooth'],
    [165, 0.14, 0.26, 'sawtooth'],
  ],
  push: [
    [660, 0, 0.1, 'sine'],
    [660, 0.12, 0.1, 'sine'],
  ],
  double: [
    [392, 0, 0.08, 'square'],
    [494, 0.08, 0.08, 'square'],
    [587, 0.16, 0.14, 'square'],
  ],
}

export const SOUNDS = Object.keys(EFFECTS)

const defaultContext = () => {
  const Ctx = window.AudioContext || window.webkitAudioContext
  return Ctx ? new Ctx() : null
}

export function createSound({ createContext = defaultContext } = {}) {
  let enabled = false
  let ctx = null

  function tone(freq, at, length, type) {
    const t = ctx.currentTime + at
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + length + 0.02)
  }

  return {
    get enabled() {
      return enabled
    },
    setEnabled(on) {
      enabled = Boolean(on)
      if (!enabled) return
      try {
        ctx = ctx ?? createContext()
        ctx?.resume?.()
      } catch {
        ctx = null
      }
    },
    play(name) {
      const notes = EFFECTS[name]
      if (!enabled || !ctx || !notes) return
      try {
        for (const note of notes) tone(...note)
      } catch {
        // Sound is decoration; never let it break the game.
      }
    },
  }
}
