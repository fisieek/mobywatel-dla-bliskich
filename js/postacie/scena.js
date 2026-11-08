// Scena 3D z postaciami Microsoft Rocketbox (licencja MIT): wczytanie, animacje ciała, mruganie, ruch ust,
// spojrzenie w stronę osoby, która mówi, i kamera, która dopasowuje kadr do ekranu.
// Postacie to pliki FBX z Rocketbox wczytywane bez konwersji. Tekstury i animacje są przygotowane
// skryptami z narzedzia/postacie/ (mniejsze pliki, siwe włosy Krystyny, bluzka Zosi).
import * as THREE from 'three';
import { FBXLoader } from '../../vendor/three/examples/jsm/loaders/FBXLoader.js';
import { visemeTimeline, readingTime } from './mowa.js';

const BASE = 'assets/postacie/';
const ANIMATIONS = ['idle', 'wave', 'talk', 'listen'];
const VISEMES = ['aa', 'E', 'I', 'O', 'U', 'PP', 'FF', 'DD', 'nn', 'kk', 'SS', 'CH', 'RR', 'TH'];

// Pliki FBX wskazują oryginalne tekstury TGA z dysku autorów. Nie wczytujemy ich (materiały podmieniamy po wczytaniu).
const manager = new THREE.LoadingManager();
manager.addHandler(/\.(tga|tif|png|jpg)$/i, { setPath: () => {}, load: () => new THREE.Texture() });
const fbxLoader = new FBXLoader(manager);
const textureLoader = new THREE.TextureLoader();

// Animacje są wspólne dla wszystkich postaci (ten sam szkielet Bip01)
let clipsPromise = null;
function loadClips() {
  clipsPromise ??= Promise.all(
    ANIMATIONS.map((name) =>
      fetch(`${BASE}animacje/${name}.json`)
        .then((r) => r.json())
        .then((json) => {
          // Pliki nie mają identyfikatora, a mikser rozróżnia animacje właśnie po nim
          const clip = THREE.AnimationClip.parse(json);
          clip.uuid = THREE.MathUtils.generateUUID();
          return clip;
        }),
    ),
  );
  return clipsPromise;
}

function texture(url, color = true) {
  const tex = textureLoader.load(BASE + url);
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function morphIndex(mesh) {
  // Nazwy w plikach Rocketbox: „blendShape1.AA_VI_10_aa” (wizemy) i „blendShape1.AK_09_EyeBlinkLeft” (ARKit)
  const index = {};
  for (const [name, i] of Object.entries(mesh.morphTargetDictionary ?? {})) {
    const viseme = name.match(/AA_VI_\d+_(\w+)$/);
    const arkit = name.match(/AK_\d+_(\w+)$/);
    if (viseme) index[`v_${viseme[1]}`] = i;
    if (arkit) index[arkit[1]] = i;
  }
  return index;
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const tmpQ = new THREE.Quaternion();
const tmpQ2 = new THREE.Quaternion();
const yawQ = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

export class Character {
  // materials: { końcówka nazwy materiału w FBX: { map, normal, cutout, transparent, roughness } }
  constructor({ id, folder, materials, x = 0 }) {
    this.id = id;
    this.folder = folder;
    this.materials = materials;
    this.x = x;
    this.group = new THREE.Group();
    this.group.position.x = x;
    this.actions = {};
    this.current = null;
    this.speech = null;
    this.nextBlink = 1000 + Math.random() * 3000;
    this.blinkAt = -1;
    this.smile = 0;
    this.smileTarget = 0.12;
    this.yaw = 0;
    this.yawTarget = 0;
    this.height = 170;
  }

  async load(onProgress) {
    const [fbx, clips] = await Promise.all([
      new Promise((resolve, reject) => fbxLoader.load(`${BASE}${this.folder}/postac.fbx`, resolve, onProgress, reject)),
      loadClips(),
    ]);
    this.group.add(fbx);
    this.root = fbx;
    fbx.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        this.mesh = o;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        o.material = mats.map((m) => this.makeMaterial(m.name));
      }
      if (o.name === 'Bip01_Head') this.head = o;
      if (o.name === 'Bip01_Neck') this.neck = o;
    });
    this.morph = morphIndex(this.mesh);
    this.height = new THREE.Box3().setFromObject(fbx).max.y;

    // Niewidoczna bryła do wskazywania postaci myszą (szybciej niż sprawdzanie siatki z kośćmi)
    this.hitBox = new THREE.Mesh(new THREE.BoxGeometry(70, this.height, 50), new THREE.MeshBasicMaterial({ visible: false }));
    this.hitBox.position.y = this.height / 2;
    this.hitBox.userData.character = this;
    this.group.add(this.hitBox);

    this.mixer = new THREE.AnimationMixer(fbx);
    for (const clip of clips) this.actions[clip.name] = this.mixer.clipAction(clip);
    this.actions.wave.setLoop(THREE.LoopOnce, 1);
    this.actions.wave.clampWhenFinished = true;
    this.play('idle', 0);
    return this;
  }

  makeMaterial(name) {
    const spec = Object.entries(this.materials).find(([key]) => name.endsWith(key))?.[1];
    if (!spec) return new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const mat = new THREE.MeshStandardMaterial({
      map: texture(`${this.folder}/${spec.map}`),
      normalMap: spec.normal ? texture(`${this.folder}/${spec.normal}`, false) : null,
      roughness: spec.roughness ?? 0.75,
      metalness: 0,
    });
    if (spec.cutout) {
      // Włosy: pasma z kanałem przezroczystości, widoczne z obu stron
      mat.alphaTest = spec.cutout;
      mat.side = THREE.DoubleSide;
    }
    if (spec.transparent) {
      mat.transparent = true;
      mat.depthWrite = false;
    }
    return mat;
  }

  // Długie animacje (stanie ~15 s, mówienie ~27 s) zaczynamy w losowym miejscu: postacie nie ruszają się synchronicznie,
  // a gesty przy mówieniu widać od razu
  play(name, fade = 0.45) {
    const next = this.actions[name];
    if (!next || this.current === next) return;
    next.reset().setEffectiveWeight(1).fadeIn(fade).play();
    if (name === 'talk' || name === 'idle') next.time = Math.random() * next.getClip().duration;
    if (this.current) this.current.fadeOut(fade);
    this.current = next;
  }

  // Krótkie machanie na powitanie. Opuszczenie ręki to płynne przejście do stania.
  wave() {
    this.smileTarget = 0.55;
    this.play('wave', 0.35);
    return new Promise((resolve) => {
      const done = (e) => {
        if (e.action !== this.actions.wave) return;
        this.mixer.removeEventListener('finished', done);
        if (this.current === this.actions.wave) this.play('idle', 0.8);
        this.smileTarget = 0.25;
        resolve();
      };
      this.mixer.addEventListener('finished', done);
    });
  }

  listen() {
    this.stopSpeaking();
    this.smileTarget = 0.18;
    this.play('listen', 0.6);
  }

  idle() {
    this.stopSpeaking();
    this.smileTarget = 0.12;
    this.play('idle', 0.6);
  }

  // Mówienie: gestykulacja + kształty ust z tekstu. Kończy się po czasie czytania napisu.
  say(text) {
    this.stopSpeaking();
    const duration = readingTime(text);
    this.smileTarget = 0.15;
    this.play('talk', 0.5);
    return new Promise((resolve) => {
      this.speech = { timeline: visemeTimeline(text, duration), t: 0, duration, resolve };
    });
  }

  stopSpeaking() {
    if (!this.speech) return;
    const { resolve } = this.speech;
    this.speech = null;
    resolve?.(false);
  }

  // Miejsce na scenie (oś X, cm)
  setX(x) {
    this.x = x;
    this.group.position.x = x;
  }

  // Głowa (i trochę szyja) odwraca się w stronę punktu na osi X sceny; null — patrzy przed siebie
  lookAt(x) {
    this.yawTarget = x === null || x === undefined ? 0 : THREE.MathUtils.clamp(Math.atan2(x - this.x, 110), -0.6, 0.6);
  }

  update(dt) {
    if (!this.mixer) return;
    // Mikser nie nadpisuje kości, której wartość się nie zmieniła, więc przed klatką przywracamy pozę z animacji,
    // inaczej obrót głowy dodawałby się klatka po klatce
    if (this.turned) {
      this.neck.quaternion.copy(this.baseNeck);
      this.head.quaternion.copy(this.baseHead);
    }
    this.mixer.update(dt / 1000);
    const k = (speed) => Math.min(1, (dt / 1000) * speed);

    // Spojrzenie: obrót wokół pionowej osi świata, dodany do animacji
    this.yaw += (this.yawTarget - this.yaw) * k(4);
    this.turned = Math.abs(this.yaw) > 0.002 && this.neck && this.head;
    if (this.turned) {
      this.baseNeck = (this.baseNeck ?? new THREE.Quaternion()).copy(this.neck.quaternion);
      this.baseHead = (this.baseHead ?? new THREE.Quaternion()).copy(this.head.quaternion);
      this.root.updateMatrixWorld(true);
      this.turn(this.neck, this.yaw * 0.35);
      this.turn(this.head, this.yaw * 0.65);
    }

    const inf = this.mesh.morphTargetInfluences;
    const set = (key, value, speed) => {
      const i = this.morph[key];
      if (i !== undefined) inf[i] += (value - inf[i]) * k(speed);
    };

    // Ruch ust
    let active = null;
    let strength = 0;
    if (this.speech) {
      const s = this.speech;
      s.t += dt;
      const cue = s.timeline.find((c) => s.t >= c.start && s.t < c.end);
      if (cue?.viseme) {
        active = cue.viseme;
        strength = cue.strength;
      }
      if (s.t >= s.duration) {
        this.speech = null;
        this.play('idle', 0.6);
        s.resolve?.(true);
      }
    }
    for (const v of VISEMES) set(`v_${v}`, v === active ? strength : 0, 22);

    // Mruganie co 2–5 s
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) {
      this.blinkAt = 0;
      this.nextBlink = 2000 + Math.random() * 3000;
    }
    let blink = 0;
    if (this.blinkAt >= 0) {
      this.blinkAt += dt;
      blink = this.blinkAt < 80 ? this.blinkAt / 80 : this.blinkAt < 160 ? 1 - (this.blinkAt - 80) / 80 : 0;
      if (this.blinkAt >= 160) this.blinkAt = -1;
    }
    for (const key of ['EyeBlinkLeft', 'EyeBlinkRight']) {
      const i = this.morph[key];
      if (i !== undefined) inf[i] = blink;
    }

    // Uśmiech
    this.smile += (this.smileTarget - this.smile) * k(3);
    for (const key of ['MouthSmileLeft', 'MouthSmileRight']) {
      const i = this.morph[key];
      if (i !== undefined) inf[i] = this.smile;
    }
  }

  turn(bone, angle) {
    if (!bone) return;
    bone.parent.getWorldQuaternion(tmpQ);
    tmpQ2.copy(tmpQ).multiply(bone.quaternion);
    tmpQ2.premultiply(yawQ.setFromAxisAngle(UP, angle));
    bone.quaternion.copy(tmpQ.invert().multiply(tmpQ2));
  }

  // Punkt w pikselach kontenera: 'head' — tuż nad głową (dymek), 'feet' — pod stopami (podpis)
  screenPoint(camera, width, height, where = 'head') {
    const p = new THREE.Vector3(this.x, -4, 0);
    if (where === 'head' && this.head) {
      this.head.getWorldPosition(p);
      p.y += 26;
    }
    p.project(camera);
    return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height };
  }
}

export class Stage {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(26, 1, 10, 6000);
    this.view = { pos: new THREE.Vector3(0, 110, 700), target: new THREE.Vector3(0, 110, 0) };
    this.tween = null;

    // Światło jak w studiu: miękkie z góry, główne z przodu z boku, kontra z tyłu
    this.scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x8a7f74, 1.6));
    const key = new THREE.DirectionalLight(0xfff4e8, 2.4);
    key.position.set(180, 300, 400);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe8ff, 1.4);
    rim.position.set(-250, 250, -300);
    this.scene.add(rim);

    // Jasna plama na podłodze pod osobą, która mówi
    this.spot = floorDisc('rgba(26,92,245,0.45)', 'rgba(26,92,245,0)', 170, 80);
    this.spot.material.opacity = 0;
    this.scene.add(this.spot);
    this.spotTarget = { x: 0, opacity: 0 };

    this.characters = [];
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.framing = { centerX: 0, halfWidth: 190 };
    this.resize();
    new ResizeObserver(() => this.resize()).observe(container);
    this.renderer.setAnimationLoop(() => this.tick());
  }

  add(character) {
    character.group.add(floorDisc('rgba(20,25,45,0.35)', 'rgba(20,25,45,0)', 110, 60));
    this.scene.add(character.group);
    this.characters.push(character);
  }

  // Kadr: środek i połowa szerokości (cm), którą trzeba zmieścić. Pionowo zawsze od stóp z zapasem na podpisy
  // do miejsca na dymek nad głową. Kamera dojeżdża płynnie.
  frame({ centerX = 0, halfWidth = 190, bottom = -45, top = 255 } = {}, ms = 900) {
    this.framing = { centerX, halfWidth, bottom, top };
    const fov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const aspect = this.camera.aspect || 1;
    const centerY = (top + bottom) / 2;
    const dist = Math.max((top - bottom) / 2 / Math.tan(fov), halfWidth / (Math.tan(fov) * aspect));
    const to = { pos: new THREE.Vector3(centerX, centerY + 12, dist), target: new THREE.Vector3(centerX, centerY, 0) };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!ms || reduced || !this.width) {
      this.view = { pos: to.pos.clone(), target: to.target.clone() };
      this.tween = null;
    } else {
      this.tween = { from: { pos: this.view.pos.clone(), target: this.view.target.clone() }, to, t: 0, ms };
    }
  }

  highlight(character) {
    this.spotTarget = character ? { x: character.x, opacity: 0.85 } : { ...this.spotTarget, opacity: 0 };
  }

  // Postać pod kursorem (zdarzenie myszy albo dotyku)
  pick(event) {
    const box = this.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1);
    this.raycaster.setFromCamera(pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.characters.map((c) => c.hitBox))[0];
    return hit?.object.userData.character ?? null;
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.frame(this.framing, 0);
  }

  tick() {
    const dt = Math.min(this.clock.getDelta() * 1000, 100);
    if (this.tween) {
      const tw = this.tween;
      tw.t += dt;
      const e = easeInOut(Math.min(1, tw.t / tw.ms));
      this.view.pos.lerpVectors(tw.from.pos, tw.to.pos, e);
      this.view.target.lerpVectors(tw.from.target, tw.to.target, e);
      if (tw.t >= tw.ms) this.tween = null;
    }
    this.camera.position.copy(this.view.pos);
    this.camera.lookAt(this.view.target);

    const s = this.spotTarget;
    const k = Math.min(1, (dt / 1000) * 5);
    this.spot.position.x += (s.x - this.spot.position.x) * Math.min(1, (dt / 1000) * 8);
    this.spot.material.opacity += (s.opacity - this.spot.material.opacity) * k;

    for (const c of this.characters) c.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.onFrame?.();
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
  }
}

// Miękka plama na podłodze: cień pod stopami albo jasne światło pod osobą, która mówi
function floorDisc(inner, outer, w, d) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.5;
  return mesh;
}
