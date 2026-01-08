import * as THREE from 'three';
import { getTrackWidth } from './map.js';

let scene = null;
let spectators = [];

/**
 * 관중 모듈 초기화
 * @param {THREE.Scene} sceneRef - Three.js Scene 참조
 */
export function initSpectators(sceneRef) {
  scene = sceneRef;
}

// --- 관중 텍스처 생성 ---
function createSpectatorTexture(color, armUp, hairStyle) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  // 투명 배경
  ctx.clearRect(0, 0, 64, 96);

  const centerX = 32;
  const hairColors = ['#4a3728', '#1a1a1a', '#8b4513', '#daa520', '#a0522d'];
  const hairColor = hairColors[hairStyle % hairColors.length];

  // 머리
  ctx.fillStyle = '#ffdbac'; // 피부색
  ctx.beginPath();
  ctx.arc(centerX, 18, 12, 0, Math.PI * 2);
  ctx.fill();

  // 헤어스타일
  ctx.fillStyle = hairColor;
  switch (hairStyle) {
    case 0: // 짧은 머리
      ctx.beginPath();
      ctx.arc(centerX, 14, 11, Math.PI, Math.PI * 2);
      ctx.fill();
      break;
    case 1: // 긴 머리 (여성)
      ctx.beginPath();
      ctx.arc(centerX, 14, 11, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(centerX - 12, 12, 6, 20);
      ctx.fillRect(centerX + 6, 12, 6, 20);
      break;
    case 2: // 대머리 + 수염
      ctx.fillStyle = '#ffdbac';
      ctx.beginPath();
      ctx.arc(centerX, 16, 11, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hairColor;
      ctx.fillRect(centerX - 6, 24, 12, 4);
      break;
    case 3: // 모자
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(centerX - 14, 4, 28, 8);
      ctx.fillRect(centerX - 8, 0, 16, 8);
      break;
    case 4: // 뾰족 머리
      ctx.beginPath();
      ctx.moveTo(centerX - 10, 18);
      ctx.lineTo(centerX - 6, 2);
      ctx.lineTo(centerX, 10);
      ctx.lineTo(centerX + 6, 0);
      ctx.lineTo(centerX + 10, 18);
      ctx.closePath();
      ctx.fill();
      break;
    case 5: // 모히칸 - 핫핑크
    case 6: // 모히칸 - 초록
    case 7: // 모히칸 - 파랑
    case 8: // 모히칸 - 노랑
    case 9: // 모히칸 - 보라
      const mohawkColors = ['#ff1493', '#00ff00', '#00bfff', '#ffd700', '#9932cc'];
      ctx.fillStyle = mohawkColors[hairStyle - 5];
      ctx.beginPath();
      ctx.moveTo(centerX - 3, 18);
      ctx.lineTo(centerX - 4, -2);
      ctx.lineTo(centerX, 4);
      ctx.lineTo(centerX + 4, -2);
      ctx.lineTo(centerX + 3, 18);
      ctx.closePath();
      ctx.fill();
      break;
  }

  // 눈
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(centerX - 4, 18, 2, 0, Math.PI * 2);
  ctx.arc(centerX + 4, 18, 2, 0, Math.PI * 2);
  ctx.fill();

  // 입 (웃는 표정)
  ctx.strokeStyle = '#c44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, 22, 4, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // 몸통 (옷 색상)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(centerX - 12, 30);
  ctx.lineTo(centerX + 12, 30);
  ctx.lineTo(centerX + 10, 58);
  ctx.lineTo(centerX - 10, 58);
  ctx.closePath();
  ctx.fill();

  // 팔 (응원 동작)
  ctx.fillStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';

  if (armUp) {
    // 팔 위로 (만세)
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX - 12, 34);
    ctx.lineTo(centerX - 20, 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 12, 34);
    ctx.lineTo(centerX + 20, 18);
    ctx.stroke();

    // 손
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(centerX - 20, 14, 5, 0, Math.PI * 2);
    ctx.arc(centerX + 20, 14, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 팔 아래
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(centerX - 12, 34);
    ctx.lineTo(centerX - 18, 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 12, 34);
    ctx.lineTo(centerX + 18, 50);
    ctx.stroke();

    // 손
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(centerX - 18, 52, 5, 0, Math.PI * 2);
    ctx.arc(centerX + 18, 52, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 다리
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(centerX - 8, 58, 6, 24);
  ctx.fillRect(centerX + 2, 58, 6, 24);

  // 신발
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(centerX - 9, 80, 8, 6);
  ctx.fillRect(centerX + 1, 80, 8, 6);

  return new THREE.CanvasTexture(canvas);
}

export function createSpectators() {
  const currentTrackWidth = getTrackWidth();

  // 기존 관중 정리
  spectators.forEach(s => {
    scene.remove(s);
    if (s.geometry) s.geometry.dispose();
    if (s.material.map) s.material.map.dispose();
    s.material.dispose();
  });
  spectators = [];

  // 다양한 색상
  const shirtColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3', '#a8d8ea', '#ff9f43', '#6a89cc'];
  const hairStyles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // 10가지 헤어스타일 (모히칸 5색)

  // 텍스처 캐시 (성능용)
  const textureCache = {};
  shirtColors.forEach(color => {
    hairStyles.forEach(hair => {
      textureCache[`${color}_up_${hair}`] = createSpectatorTexture(color, true, hair);
      textureCache[`${color}_down_${hair}`] = createSpectatorTexture(color, false, hair);
    });
  });

  const spectatorOffset = 70; // 광고판에서 떨어진 거리
  const rows = 3; // 줄 수
  const spacing = 35; // 관중 간격
  const startZ = 200; // 시작 위치
  const endZ = -4200; // 끝 위치

  // 양쪽에 관중석 생성
  for (let side = -1; side <= 1; side += 2) {
    const baseX = side * (currentTrackWidth / 2 + 30 + spectatorOffset);

    for (let row = 0; row < rows; row++) {
      const rowX = baseX + side * (row * 12);
      const rowY = 8; // 모든 관중 바닥에 배치

      for (let z = startZ; z > endZ; z -= spacing) {
        // 30% 확률로 빈 공간
        if (Math.random() < 0.3) continue;

        // 약간의 랜덤 오프셋
        const offsetX = (Math.random() - 0.5) * 5;
        const offsetZ = (Math.random() - 0.5) * 5;

        const color = shirtColors[Math.floor(Math.random() * shirtColors.length)];
        const armUp = Math.random() > 0.5;
        const hair = hairStyles[Math.floor(Math.random() * hairStyles.length)];
        const texture = textureCache[`${color}_${armUp ? 'up' : 'down'}_${hair}`];

        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          alphaTest: 0.5,
        });
        const geo = new THREE.PlaneGeometry(28, 42);
        const sprite = new THREE.Mesh(geo, mat);
        sprite.position.set(rowX + offsetX, rowY + 20, z + offsetZ);
        // 트랙을 바라보도록 회전 (왼쪽 관중은 오른쪽, 오른쪽 관중은 왼쪽)
        sprite.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;

        // 응원 애니메이션용 데이터
        sprite.userData.baseY = rowY + 8;
        sprite.userData.phase = Math.random() * Math.PI * 2;
        sprite.userData.speed = 2 + Math.random() * 2;
        sprite.userData.amplitude = 1 + Math.random() * 1.5;
        sprite.userData.color = color;
        sprite.userData.hair = hair;
        sprite.userData.textureCache = textureCache;
        sprite.userData.armUp = armUp;

        scene.add(sprite);
        spectators.push(sprite);
      }
    }
  }
}

export function updateSpectators(isRacing, frameCount) {
  if (!isRacing || spectators.length === 0) return;

  const time = Date.now() * 0.001;

  // 성능: 일부만 업데이트 (프레임당 100개씩)
  const updateCount = Math.min(100, spectators.length);
  const startIdx = (frameCount * updateCount) % spectators.length;

  for (let i = 0; i < updateCount; i++) {
    const idx = (startIdx + i) % spectators.length;
    const s = spectators[idx];

    // 위아래 움직임 (응원)
    const bounce = Math.sin(time * s.userData.speed + s.userData.phase) * s.userData.amplitude;
    s.position.y = s.userData.baseY + Math.max(0, bounce);

    // 가끔 팔 상태 변경 (1% 확률)
    if (Math.random() < 0.01) {
      const newArmUp = !s.userData.armUp;
      s.userData.armUp = newArmUp;
      const texture = s.userData.textureCache[`${s.userData.color}_${newArmUp ? 'up' : 'down'}_${s.userData.hair}`];
      s.material.map = texture;
    }
  }
}
