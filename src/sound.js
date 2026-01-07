/**
 * 오디오 컨텍스트 (싱글톤)
 */
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * 기본 톤 재생
 * @param {number} freq - 주파수
 * @param {string} type - 파형 타입 ('sine', 'square', 'sawtooth', 'triangle')
 * @param {number} dur - 지속 시간 (초)
 * @param {number} vol - 볼륨 (0~1)
 */
export function playTone(freq, type, dur, vol = 0.1) {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = vol;

  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + dur);
  osc.stop(ctx.currentTime + dur);
}

/**
 * 천둥 소리 재생
 */
export function playThunder() {
  playTone(100, 'sawtooth', 0.5, 0.5);
  playTone(50, 'square', 0.8, 0.5);
}

/**
 * 폭죽 소리 재생
 */
export function playFirework() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  // 발사 소리 (휘이이잉)
  const launchOsc = ctx.createOscillator();
  const launchGain = ctx.createGain();

  launchOsc.type = 'sawtooth';
  launchOsc.frequency.setValueAtTime(200, ctx.currentTime);
  launchOsc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
  launchOsc.connect(launchGain);
  launchGain.connect(ctx.destination);
  launchGain.gain.setValueAtTime(0.2, ctx.currentTime);
  launchGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  launchOsc.start();
  launchOsc.stop(ctx.currentTime + 0.3);

  // 폭발 소리 (빵!)
  setTimeout(() => {
    // 노이즈 생성
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();

    // 반짝이 소리 (찌지직)
    for (let j = 0; j < 5; j++) {
      setTimeout(() => {
        playTone(1000 + Math.random() * 2000, 'sine', 0.1, 0.1);
      }, j * 50);
    }
  }, 300);
}

/**
 * 카운트다운 소리 재생
 * @param {boolean} isGo - GO! 인지 여부
 */
export function playCountSound(isGo = false) {
  if (isGo) {
    playTone(800, 'square', 0.4, 0.4);
  } else {
    playTone(400, 'square', 0.2, 0.3);
  }
}

/**
 * 스퍼트(부스트) 불꽃 소리
 */
export function playBoostSound() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  // 불꽃 소리 (쉬익~ 웅)
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // 노이즈 + 저주파 혼합
    const t = i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * 0.3 * (1 - t) +
              Math.sin(i * 0.01) * 0.2 * (1 - t);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // 필터로 불꽃 느낌
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

/**
 * 바위 착지 소리 (쿵!)
 */
export function playRockLandSound() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  // 묵직한 착지음
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.25);

  // 먼지/충격 노이즈
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.5;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start();
}

/**
 * 바위 부서지는 소리
 */
export function playRockBreakSound() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  // 충격음 (쿵)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);

  // 부서지는 소리 (쩌적)
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / bufferSize;
    // 거친 노이즈
    data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  // 하이패스로 날카로운 느낌
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 500;

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start();
}

/**
 * 발굽 소리 재생 (최적화됨)
 * @param {number} volume - 볼륨 (0~1), 기본값 0.03 (매우 작게)
 */
let lastHoofTime = 0;
const HOOF_COOLDOWN = 80; // 최소 80ms 간격

export function playHoofSound(volume = 0.03) {
  const now = Date.now();
  if (now - lastHoofTime < HOOF_COOLDOWN) return; // 쿨다운 체크
  lastHoofTime = now;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  // 짧은 클릭음으로 발굽 소리 표현
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // 랜덤 피치로 자연스러움 추가
  const pitch = 80 + Math.random() * 40;
  osc.type = 'triangle';
  osc.frequency.value = pitch;

  osc.connect(gain);
  gain.connect(ctx.destination);

  // 아주 짧고 빠르게 감쇠
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}
