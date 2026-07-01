// Web Audio API 合成答题反馈音效（零音频文件依赖）
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    // 浏览器自动播放策略：首次需在用户手势内 resume
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, startAt: number, duration: number, gainValue = 0.15) {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, c.currentTime + startAt)
  gain.gain.linearRampToValueAtTime(gainValue, c.currentTime + startAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startAt + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(c.currentTime + startAt)
  osc.stop(c.currentTime + startAt + duration)
}

export function playCorrect() {
  try {
    tone(660, 0, 0.09)
    tone(880, 0.08, 0.12)
  } catch {
    /* 静默失败 */
  }
}

export function playWrong() {
  try {
    tone(440, 0, 0.12)
    tone(220, 0.1, 0.18, 0.12)
  } catch {
    /* 静默失败 */
  }
}

export function playSound(type: 'correct' | 'wrong') {
  if (type === 'correct') playCorrect()
  else playWrong()
}
