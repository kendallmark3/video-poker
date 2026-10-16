import { describe, it, expect } from 'vitest'
import { createSound, SOUNDS } from './sound.js'

function fakeContext() {
  const param = () => ({ setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} })
  const ctx = {
    started: 0,
    resumed: 0,
    currentTime: 0,
    destination: {},
    resume() { ctx.resumed++; return Promise.resolve() },
    createOscillator: () => ({ type: 'sine', frequency: param(), connect() {}, start() { ctx.started++ }, stop() {} }),
    createGain: () => ({ gain: param(), connect() {} }),
  }
  return ctx
}

describe('sound', () => {
  it('is muted by default and plays nothing while muted', () => {
    let created = 0
    const sound = createSound({ createContext: () => { created++; return fakeContext() } })
    expect(sound.enabled).toBe(false)
    for (const name of SOUNDS) sound.play(name)
    expect(created).toBe(0)
  })

  it('creates the context when enabled and plays every effect', () => {
    const ctx = fakeContext()
    const sound = createSound({ createContext: () => ctx })
    sound.setEnabled(true)
    expect(ctx.resumed).toBe(1)
    for (const name of SOUNDS) {
      const before = ctx.started
      sound.play(name)
      expect(ctx.started, name).toBeGreaterThan(before)
    }
  })

  it('goes quiet again when disabled', () => {
    const ctx = fakeContext()
    const sound = createSound({ createContext: () => ctx })
    sound.setEnabled(true)
    sound.setEnabled(false)
    const before = ctx.started
    sound.play('win')
    expect(ctx.started).toBe(before)
  })

  it('never throws without Web Audio', () => {
    const sound = createSound({ createContext: () => { throw new Error('no audio') } })
    expect(() => { sound.setEnabled(true); sound.play('win') }).not.toThrow()
    const missing = createSound({ createContext: () => null })
    expect(() => { missing.setEnabled(true); missing.play('deal') }).not.toThrow()
  })

  it('ignores unknown effects', () => {
    const ctx = fakeContext()
    const sound = createSound({ createContext: () => ctx })
    sound.setEnabled(true)
    expect(() => sound.play('nope')).not.toThrow()
    expect(ctx.started).toBe(0)
  })
})
