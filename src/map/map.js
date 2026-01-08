import * as THREE from 'three';

// --- 맵 설정 ---
const LANE_WIDTH = 30;
const MIN_LANES = 8;
const MAX_LANES = 20;
const ORIGINAL_FINISH_Z = -3500;

let scene = null;
let currentTrackWidth = LANE_WIDTH * MIN_LANES;
let finishLineZ = ORIGINAL_FINISH_Z;

let clouds = [];
let trackObjects = [];
let finishLineObjects = [];
let startLineObjects = [];
let billboardObjects = [];

/**
 * 맵 모듈 초기화
 * @param {THREE.Scene} sceneRef - Three.js Scene 참조
 */
export function initMap(sceneRef) {
  scene = sceneRef;
}

/**
 * 현재 트랙 폭 반환
 */
export function getTrackWidth() {
  return currentTrackWidth;
}

/**
 * 결승선 Z 좌표 반환
 */
export function getFinishLineZ() {
  return finishLineZ;
}

/**
 * 결승선 Z 좌표 설정
 */
export function setFinishLineZ(z) {
  finishLineZ = z;
}

/**
 * 원래 결승선 Z 좌표 반환
 */
export function getOriginalFinishZ() {
  return ORIGINAL_FINISH_Z;
}

/**
 * 레인 설정 반환
 */
export function getLaneConfig() {
  return { LANE_WIDTH, MIN_LANES, MAX_LANES };
}

// --- 하늘 ---
export function createSky() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#1e3c72');
  gradient.addColorStop(0.3, '#2a5298');
  gradient.addColorStop(0.6, '#87ceeb');
  gradient.addColorStop(1, '#b0e0e6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const skyTexture = new THREE.CanvasTexture(canvas);
  scene.background = skyTexture;
}

// --- 구름 ---
export function createClouds() {
  const cloudGroup = new THREE.Group();

  for (let i = 0; i < 30; i++) {
    const cloud = new THREE.Group();
    const puffCount = 3 + Math.floor(Math.random() * 4);

    for (let j = 0; j < puffCount; j++) {
      const puffGeo = new THREE.SphereGeometry(20 + Math.random() * 30, 8, 6);
      const puffMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
      });
      const puff = new THREE.Mesh(puffGeo, puffMat);
      puff.position.set(j * 25 - puffCount * 12, Math.random() * 10 - 5, Math.random() * 15 - 7);
      puff.scale.y = 0.6;
      cloud.add(puff);
    }

    cloud.position.set(Math.random() * 2000 - 1000, 150 + Math.random() * 200, Math.random() * -4500);
    cloud.userData.speed = 0.1 + Math.random() * 0.2;

    cloudGroup.add(cloud);
    clouds.push(cloud);
  }

  scene.add(cloudGroup);
}

export function updateClouds() {
  clouds.forEach((cloud) => {
    cloud.position.x += cloud.userData.speed;
    if (cloud.position.x > 1200) {
      cloud.position.x = -1200;
    }
  });
}

// --- 잔디 ---
export function createGround() {
  const grassGeo = new THREE.PlaneGeometry(2000, 10000);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.5, -2000);
  grass.receiveShadow = true;
  scene.add(grass);
}

// --- 트랙 ---
export function createTrack(laneCount) {
  trackObjects.forEach((obj) => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
  trackObjects = [];

  const lanes = Math.max(MIN_LANES, Math.min(MAX_LANES, laneCount));
  currentTrackWidth = LANE_WIDTH * lanes;

  const trackGeo = new THREE.PlaneGeometry(currentTrackWidth, 10000);
  const trackMat = new THREE.MeshStandardMaterial({ color: 0xc2956e });
  const track = new THREE.Mesh(trackGeo, trackMat);
  track.rotation.x = -Math.PI / 2;
  track.position.set(0, 0, -2000);
  track.receiveShadow = true;
  scene.add(track);
  trackObjects.push(track);

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lineGeo = new THREE.PlaneGeometry(2, 10000);

  for (let i = 1; i < lanes; i++) {
    const line = new THREE.Mesh(lineGeo.clone(), lineMat.clone());
    line.rotation.x = -Math.PI / 2;
    line.position.set(-currentTrackWidth / 2 + i * LANE_WIDTH, 0.5, -2000);
    scene.add(line);
    trackObjects.push(line);
  }

  const borderGeo = new THREE.PlaneGeometry(5, 10000);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  const leftBorder = new THREE.Mesh(borderGeo.clone(), borderMat.clone());
  leftBorder.rotation.x = -Math.PI / 2;
  leftBorder.position.set(-currentTrackWidth / 2, 0.5, -2000);
  scene.add(leftBorder);
  trackObjects.push(leftBorder);

  const rightBorder = new THREE.Mesh(borderGeo.clone(), borderMat.clone());
  rightBorder.rotation.x = -Math.PI / 2;
  rightBorder.position.set(currentTrackWidth / 2, 0.5, -2000);
  scene.add(rightBorder);
  trackObjects.push(rightBorder);

  // 레이싱 경기장 스타일 광고판 (트랙 양쪽)
  const adBoardHeight = 25;
  const adBoardLength = 100;
  const adBoardGap = 10;
  const adBoardThickness = 2;
  const adBoardY = adBoardHeight / 2;
  const adBoardOffset = 30;
  const totalBoardLength = 4500;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.1 });

  // 왼쪽 연속 프레임
  const frameGeoL = new THREE.BoxGeometry(adBoardThickness + 2, adBoardHeight + 4, totalBoardLength);
  const frameL = new THREE.Mesh(frameGeoL, frameMat.clone());
  frameL.position.set(-currentTrackWidth / 2 - adBoardOffset, adBoardY, -totalBoardLength / 2);
  scene.add(frameL);
  trackObjects.push(frameL);

  // 오른쪽 연속 프레임
  const frameGeoR = new THREE.BoxGeometry(adBoardThickness + 2, adBoardHeight + 4, totalBoardLength);
  const frameR = new THREE.Mesh(frameGeoR, frameMat.clone());
  frameR.position.set(currentTrackWidth / 2 + adBoardOffset, adBoardY, -totalBoardLength / 2);
  scene.add(frameR);
  trackObjects.push(frameR);

  // 흰색 스크린 패널들 (간격으로 분리)
  for (let z = 0; z > -4500; z -= (adBoardLength + adBoardGap)) {
    const screenGeoL = new THREE.BoxGeometry(adBoardThickness, adBoardHeight, adBoardLength);
    const screenL = new THREE.Mesh(screenGeoL, screenMat.clone());
    screenL.position.set(-currentTrackWidth / 2 - adBoardOffset + 3, adBoardY, z - adBoardLength / 2);
    scene.add(screenL);
    trackObjects.push(screenL);

    const screenGeoR = new THREE.BoxGeometry(adBoardThickness, adBoardHeight, adBoardLength);
    const screenR = new THREE.Mesh(screenGeoR, screenMat.clone());
    screenR.position.set(currentTrackWidth / 2 + adBoardOffset - 3, adBoardY, z - adBoardLength / 2);
    scene.add(screenR);
    trackObjects.push(screenR);
  }

  // 거리 표시
  for (let dist = 500; dist <= 3500; dist += 500) {
    const markerCanvas = document.createElement('canvas');
    markerCanvas.width = 128;
    markerCanvas.height = 64;
    const mctx = markerCanvas.getContext('2d');
    mctx.fillStyle = '#ffffff';
    mctx.fillRect(0, 0, 128, 64);
    mctx.fillStyle = '#000000';
    mctx.font = 'bold 40px Arial';
    mctx.textAlign = 'center';
    mctx.fillText(`${dist}m`, 64, 48);

    const markerTexture = new THREE.CanvasTexture(markerCanvas);
    const markerMat = new THREE.MeshBasicMaterial({ map: markerTexture });
    const markerGeo = new THREE.PlaneGeometry(20, 10);

    const markerL = new THREE.Mesh(markerGeo.clone(), markerMat.clone());
    markerL.position.set(-currentTrackWidth / 2 - 50, 30, -dist);
    markerL.rotation.y = Math.PI / 4;
    scene.add(markerL);
    trackObjects.push(markerL);

    const markerR = new THREE.Mesh(markerGeo.clone(), markerMat.clone());
    markerR.position.set(currentTrackWidth / 2 + 50, 30, -dist);
    markerR.rotation.y = -Math.PI / 4;
    scene.add(markerR);
    trackObjects.push(markerR);
  }
}

// --- 출발선 ---
export function createStartLine() {
  startLineObjects.forEach((obj) => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
  startLineObjects = [];

  const startLineZ = 0;

  // 체크 무늬 텍스처 생성
  const checkCanvas = document.createElement('canvas');
  checkCanvas.width = 128;
  checkCanvas.height = 32;
  const ctx = checkCanvas.getContext('2d');
  const squareSize = 16;

  for (let x = 0; x < checkCanvas.width; x += squareSize) {
    for (let y = 0; y < checkCanvas.height; y += squareSize) {
      const isWhite = ((x / squareSize) + (y / squareSize)) % 2 === 0;
      ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
      ctx.fillRect(x, y, squareSize, squareSize);
    }
  }

  const checkTexture = new THREE.CanvasTexture(checkCanvas);
  checkTexture.wrapS = THREE.RepeatWrapping;
  checkTexture.wrapT = THREE.RepeatWrapping;
  checkTexture.repeat.set(currentTrackWidth / 30, 1);

  // 출발선 바닥 (체크 무늬)
  const startLineGeo = new THREE.PlaneGeometry(currentTrackWidth + 20, 10);
  const startLineMat = new THREE.MeshBasicMaterial({ map: checkTexture });
  const startLine = new THREE.Mesh(startLineGeo, startLineMat);
  startLine.rotation.x = -Math.PI / 2;
  startLine.position.set(0, 1, startLineZ);
  scene.add(startLine);
  startLineObjects.push(startLine);
}

// --- 결승선 ---
export function createFinishLine() {
  finishLineObjects.forEach((obj) => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
  finishLineObjects = [];

  const finishLineGeo = new THREE.BoxGeometry(currentTrackWidth + 20, 10, 15);
  const finishLineMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const finishLine = new THREE.Mesh(finishLineGeo, finishLineMat);
  finishLine.position.set(0, 5, finishLineZ);
  scene.add(finishLine);
  finishLineObjects.push(finishLine);

  const gatePostGeo = new THREE.BoxGeometry(10, 80, 10);
  const gatePostMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const gateL = new THREE.Mesh(gatePostGeo.clone(), gatePostMat.clone());
  gateL.position.set(-currentTrackWidth / 2 - 15, 40, finishLineZ);
  gateL.castShadow = true;
  scene.add(gateL);
  finishLineObjects.push(gateL);

  const gateR = new THREE.Mesh(gatePostGeo.clone(), gatePostMat.clone());
  gateR.position.set(currentTrackWidth / 2 + 15, 40, finishLineZ);
  gateR.castShadow = true;
  scene.add(gateR);
  finishLineObjects.push(gateR);

  const gateTopGeo = new THREE.BoxGeometry(currentTrackWidth + 50, 15, 15);
  const gateTop = new THREE.Mesh(gateTopGeo, gatePostMat.clone());
  gateTop.position.set(0, 85, finishLineZ);
  scene.add(gateTop);
  finishLineObjects.push(gateTop);

  const finishCanvas = document.createElement('canvas');
  finishCanvas.width = 512;
  finishCanvas.height = 128;
  const fctx = finishCanvas.getContext('2d');
  fctx.fillStyle = '#ff0000';
  fctx.fillRect(0, 0, 512, 128);
  fctx.fillStyle = '#ffffff';
  fctx.font = 'bold 80px Arial';
  fctx.textAlign = 'center';
  fctx.fillText('FINISH', 256, 95);

  const finishTexture = new THREE.CanvasTexture(finishCanvas);
  const finishSignMat = new THREE.MeshBasicMaterial({ map: finishTexture });
  const finishSign = new THREE.Mesh(new THREE.PlaneGeometry(100, 25), finishSignMat);
  finishSign.position.set(0, 110, finishLineZ + 1);
  scene.add(finishSign);
  finishLineObjects.push(finishSign);
}

// 결승선 이동 (반전 이벤트용)
export function moveFinishLine(newZ) {
  finishLineZ = newZ;

  // 기존 결승선 객체 제거
  finishLineObjects.forEach((obj) => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
  finishLineObjects = [];

  // 새 위치에 결승선 생성
  const finishLineGeo = new THREE.BoxGeometry(currentTrackWidth + 20, 10, 15);
  const finishLineMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // 초록색으로 변경
  const finishLine = new THREE.Mesh(finishLineGeo, finishLineMat);
  finishLine.position.set(0, 5, newZ);
  scene.add(finishLine);
  finishLineObjects.push(finishLine);

  const gatePostGeo = new THREE.BoxGeometry(10, 80, 10);
  const gatePostMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

  const gateL = new THREE.Mesh(gatePostGeo.clone(), gatePostMat.clone());
  gateL.position.set(-currentTrackWidth / 2 - 15, 40, newZ);
  gateL.castShadow = true;
  scene.add(gateL);
  finishLineObjects.push(gateL);

  const gateR = new THREE.Mesh(gatePostGeo.clone(), gatePostMat.clone());
  gateR.position.set(currentTrackWidth / 2 + 15, 40, newZ);
  gateR.castShadow = true;
  scene.add(gateR);
  finishLineObjects.push(gateR);

  const gateTopGeo = new THREE.BoxGeometry(currentTrackWidth + 50, 15, 15);
  const gateTop = new THREE.Mesh(gateTopGeo, gatePostMat.clone());
  gateTop.position.set(0, 85, newZ);
  scene.add(gateTop);
  finishLineObjects.push(gateTop);

  // REVERSE 사인
  const finishCanvas = document.createElement('canvas');
  finishCanvas.width = 512;
  finishCanvas.height = 128;
  const fctx = finishCanvas.getContext('2d');
  fctx.fillStyle = '#00ff00';
  fctx.fillRect(0, 0, 512, 128);
  fctx.fillStyle = '#000000';
  fctx.font = 'bold 70px Arial';
  fctx.textAlign = 'center';
  fctx.fillText('REVERSE!', 256, 95);

  const finishTexture = new THREE.CanvasTexture(finishCanvas);
  const finishSignMat = new THREE.MeshBasicMaterial({ map: finishTexture });
  const finishSign = new THREE.Mesh(new THREE.PlaneGeometry(100, 25), finishSignMat);
  finishSign.position.set(0, 110, newZ + 1);
  scene.add(finishSign);
  finishLineObjects.push(finishSign);
}

// --- 전광판 ---
export function createBillboard() {
  // 기존 전광판 정리
  billboardObjects.forEach((obj) => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  });
  billboardObjects = [];

  const billboardZ = ORIGINAL_FINISH_Z / 2;
  const billboardX = -(currentTrackWidth / 2 + 80);

  // 기둥 2개 (Z축 방향으로 배치)
  const postGeo = new THREE.BoxGeometry(12, 180, 12);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x444444 });

  const postL = new THREE.Mesh(postGeo, postMat);
  postL.position.set(billboardX, 90, billboardZ - 90);
  postL.castShadow = true;
  scene.add(postL);
  billboardObjects.push(postL);

  const postR = new THREE.Mesh(postGeo, postMat);
  postR.position.set(billboardX, 90, billboardZ + 90);
  postR.castShadow = true;
  scene.add(postR);
  billboardObjects.push(postR);

  // 전광판 프레임 (트랙 방향으로 회전)
  const frameGeo = new THREE.BoxGeometry(8, 105, 210);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(billboardX, 150, billboardZ);
  scene.add(frame);
  billboardObjects.push(frame);

  // 전광판 스크린 (캔버스 텍스처)
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  // 배경 (어두운 전광판 느낌)
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, 768, 384);

  // 테두리 발광 효과
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 12;
  ctx.strokeRect(15, 15, 738, 354);

  // 텍스트
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 108px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 30;
  ctx.fillText('Play Mcp', 384, 192);

  const texture = new THREE.CanvasTexture(canvas);
  const screenMat = new THREE.MeshBasicMaterial({ map: texture });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(195, 90), screenMat);
  screen.position.set(billboardX + 5, 150, billboardZ);
  screen.rotation.y = Math.PI / 2;
  scene.add(screen);
  billboardObjects.push(screen);

  // 뒷면도 추가 (반대편에서도 보이도록)
  const screenBack = new THREE.Mesh(new THREE.PlaneGeometry(195, 90), screenMat);
  screenBack.position.set(billboardX - 5, 150, billboardZ);
  screenBack.rotation.y = -Math.PI / 2;
  scene.add(screenBack);
  billboardObjects.push(screenBack);
}

// --- 맵 리셋 ---
export function resetMap() {
  finishLineZ = ORIGINAL_FINISH_Z;
}
