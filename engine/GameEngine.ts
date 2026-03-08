import * as THREE from 'three';
import { LevelData, GameCallbacks, WallSegment, ItemDef, HorrorTrigger } from '../types';
import {
  PLAYER_HEIGHT, PLAYER_RADIUS, PLAYER_SPEED, PLAYER_SPRINT_SPEED,
  MOUSE_SENSITIVITY, INTERACT_DISTANCE, WALL_THICKNESS, CEILING_HEIGHT,
} from '../constants';
import { AudioSystem } from './AudioSystem';

interface CollisionBox {
  minX: number; maxX: number;
  minZ: number; maxZ: number;
  wallRef?: WallSegment;
}

interface RuntimeItem {
  def: ItemDef;
  mesh: THREE.Mesh;
  collected: boolean;
}

interface RuntimeTrigger {
  def: HorrorTrigger;
  fired: boolean;
}

export class GameEngine {
  // Three.js core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  // State
  private running = false;
  private animFrameId = 0;
  private clock = new THREE.Clock();
  private canvas: HTMLCanvasElement;
  private callbacks: GameCallbacks;

  // Player
  private yaw = 0;
  private pitch = 0;
  private playerX = 0;
  private playerZ = 0;
  private health = 100;
  private inventory: string[] = [];
  private bobPhase = 0;

  // Input
  private keys: Record<string, boolean> = {};
  private pointerLocked = false;

  // Level data
  private collisionBoxes: CollisionBox[] = [];
  private items: RuntimeItem[] = [];
  private triggers: RuntimeTrigger[] = [];
  private flickerLights: { light: THREE.PointLight; baseIntensity: number; phase: number }[] = [];
  private doorMeshes: Map<string, { mesh: THREE.Mesh; box: CollisionBox }> = new Map();

  // Interaction
  private currentInteractable: { type: 'item' | 'door'; id: string; prompt: string } | null = null;

  // Visual effects
  private damageOverlayAlpha = 0;
  private screenShake = 0;
  private horrorDistort = 0;

  // Audio
  private audio: AudioSystem;

  // Escape point
  private escapePoint = { x: 0, z: -39 };
  private escapeRadius = 2;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.audio = new AudioSystem();
  }

  init(level: LevelData) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.6;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.06);

    // Camera
    this.camera = new THREE.PerspectiveCamera(70, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 100);

    // Ambient light (very dim)
    const ambient = new THREE.AmbientLight(0x111122, 0.15);
    this.scene.add(ambient);

    // Build level
    this.buildLevel(level);

    // Player spawn
    this.playerX = level.spawnX;
    this.playerZ = level.spawnZ;
    this.yaw = level.spawnAngle;
    this.pitch = 0;
    this.health = 100;
    this.inventory = [];

    // Input
    this.setupInput();

    // Audio
    this.audio.init();

    // Resize handler
    window.addEventListener('resize', this.onResize);
  }

  private buildLevel(level: LevelData) {
    const wallMat = this.createStoneMaterial(0x2a2520, 0x1a1510);
    const floorMat = this.createStoneMaterial(0x1a1815, 0x0a0805);
    const ceilMat = this.createStoneMaterial(0x151210, 0x0a0805);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x4a3020,
      roughness: 0.9,
      metalness: 0.1,
    });

    // Floors and ceilings
    for (const f of level.floors) {
      // Floor
      const floorGeo = new THREE.PlaneGeometry(f.w, f.d);
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(f.x, 0, f.z);
      floor.receiveShadow = true;
      this.scene.add(floor);

      // Ceiling
      const ceilGeo = new THREE.PlaneGeometry(f.w, f.d);
      const ceil = new THREE.Mesh(ceilGeo, ceilMat);
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(f.x, f.ceilingY, f.z);
      this.scene.add(ceil);
    }

    // Walls
    for (const wall of level.walls) {
      const dx = wall.x2 - wall.x1;
      const dz = wall.z2 - wall.z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      if (length < 0.01) continue;

      const h = wall.height || CEILING_HEIGHT;
      const mat = wall.isDoor ? doorMat : wallMat;

      const geo = new THREE.BoxGeometry(
        dz === 0 ? length : WALL_THICKNESS,
        h,
        dx === 0 ? length : WALL_THICKNESS
      );

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (wall.x1 + wall.x2) / 2,
        h / 2,
        (wall.z1 + wall.z2) / 2
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Collision box
      const ht = WALL_THICKNESS / 2 + PLAYER_RADIUS * 0.5;
      let box: CollisionBox;
      if (dz === 0) {
        // Horizontal wall
        box = {
          minX: Math.min(wall.x1, wall.x2),
          maxX: Math.max(wall.x1, wall.x2),
          minZ: wall.z1 - ht,
          maxZ: wall.z1 + ht,
          wallRef: wall,
        };
      } else {
        // Vertical wall
        box = {
          minX: wall.x1 - ht,
          maxX: wall.x1 + ht,
          minZ: Math.min(wall.z1, wall.z2),
          maxZ: Math.max(wall.z1, wall.z2),
          wallRef: wall,
        };
      }

      this.collisionBoxes.push(box);

      if (wall.isDoor && wall.doorId) {
        this.doorMeshes.set(wall.doorId, { mesh, box });
      }
    }

    // Items
    for (const itemDef of level.items) {
      const color = itemDef.type === 'key' ? 0xffcc00 :
                    itemDef.type === 'health' ? 0xff2222 : 0xccccff;
      const geo = itemDef.type === 'key'
        ? new THREE.BoxGeometry(0.3, 0.15, 0.1)
        : itemDef.type === 'health'
        ? new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8)
        : new THREE.PlaneGeometry(0.3, 0.4);

      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.3,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(itemDef.x, itemDef.y, itemDef.z);
      mesh.castShadow = true;
      this.scene.add(mesh);

      // Small point light to make items visible
      const glow = new THREE.PointLight(color, 0.5, 4);
      glow.position.set(itemDef.x, itemDef.y + 0.3, itemDef.z);
      this.scene.add(glow);
      (mesh as any).__glow = glow;

      this.items.push({ def: itemDef, mesh, collected: false });
    }

    // Lights
    for (const ld of level.lights) {
      const light = new THREE.PointLight(ld.color, ld.intensity, ld.distance);
      light.position.set(ld.x, ld.y, ld.z);
      light.castShadow = true;
      light.shadow.mapSize.set(256, 256);
      light.shadow.bias = -0.005;
      this.scene.add(light);

      if (ld.flicker) {
        this.flickerLights.push({
          light,
          baseIntensity: ld.intensity,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // Horror triggers
    for (const t of level.triggers) {
      this.triggers.push({ def: t, fired: false });
    }
  }

  private createStoneMaterial(color: number, darkColor: number): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, 128, 128);

    // Noise
    for (let i = 0; i < 3000; i++) {
      const px = Math.random() * 128;
      const py = Math.random() * 128;
      const shade = Math.floor(Math.random() * 20 - 10);
      ctx.fillStyle = `rgba(${Math.max(0, r + shade)},${Math.max(0, g + shade)},${Math.max(0, b + shade)},0.5)`;
      ctx.fillRect(px, py, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }

    // Mortar lines
    const dr = (darkColor >> 16) & 0xff, dg = (darkColor >> 8) & 0xff, db = darkColor & 0xff;
    ctx.strokeStyle = `rgb(${dr},${dg},${db})`;
    ctx.lineWidth = 1;
    for (let y = 0; y <= 128; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke();
    }
    for (let row = 0; row < 4; row++) {
      const offset = row % 2 === 0 ? 0 : 21;
      for (let x = offset; x <= 128; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, row * 32);
        ctx.lineTo(x, (row + 1) * 32);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0.0,
    });
  }

  private setupInput() {
    this.canvas.addEventListener('click', () => {
      if (!this.pointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked || !this.running) return;
      this.yaw -= e.movementX * MOUSE_SENSITIVITY;
      this.pitch -= e.movementY * MOUSE_SENSITIVITY;
      this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));
    });

    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyE') this.handleInteract();
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  private handleInteract() {
    if (!this.currentInteractable) return;

    const { type, id } = this.currentInteractable;

    if (type === 'item') {
      const item = this.items.find(i => i.def.id === id);
      if (!item || item.collected) return;

      item.collected = true;
      this.scene.remove(item.mesh);
      const glow = (item.mesh as any).__glow;
      if (glow) this.scene.remove(glow);

      if (item.def.type === 'key' && item.def.keyId) {
        this.inventory.push(item.def.keyId);
        this.callbacks.onItemPickup(item.def.name);
        this.callbacks.onMessage(`Picked up: ${item.def.name}`, 'pickup', 3000);
        if (item.def.description) {
          setTimeout(() => this.callbacks.onMessage(item.def.description, 'story', 4000), 1500);
        }
      } else if (item.def.type === 'health') {
        const heal = item.def.value || 25;
        this.health = Math.min(100, this.health + heal);
        this.callbacks.onHealthChange(this.health);
        this.callbacks.onMessage(`Used: ${item.def.name} (+${heal} HP)`, 'pickup', 3000);
      } else if (item.def.type === 'note') {
        this.callbacks.onMessage(item.def.description, 'story', 6000);
      }
      this.audio.playPickup();

    } else if (type === 'door') {
      const doorData = this.doorMeshes.get(id);
      if (!doorData) return;

      const wall = doorData.box.wallRef;
      if (wall?.requiredKey && !this.inventory.includes(wall.requiredKey)) {
        this.callbacks.onMessage('The door is locked. You need a key.', 'warning', 3000);
        return;
      }

      // Remove door
      this.scene.remove(doorData.mesh);
      const idx = this.collisionBoxes.indexOf(doorData.box);
      if (idx !== -1) this.collisionBoxes.splice(idx, 1);
      this.doorMeshes.delete(id);

      if (wall?.requiredKey) {
        const keyIdx = this.inventory.indexOf(wall.requiredKey);
        if (keyIdx !== -1) this.inventory.splice(keyIdx, 1);
      }

      this.callbacks.onMessage('The door creaks open...', 'info', 3000);
      this.audio.playDoorOpen();
    }

    this.currentInteractable = null;
    this.callbacks.onInteractableChange(null);
  }

  start() {
    this.running = true;
    this.clock.start();
    this.audio.resume();
    this.audio.startAmbient();
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.audio.stopAmbient();
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.scene.clear();
    this.audio.destroy();
  }

  private loop = () => {
    if (!this.running) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number) {
    this.updateMovement(dt);
    this.updateCamera(dt);
    this.updateLights(dt);
    this.updateItems(dt);
    this.updateInteraction();
    this.updateTriggers();
    this.updateEffects(dt);
    this.checkEscape();
  }

  private updateMovement(dt: number) {
    const sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const speed = sprint ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;

    let moveX = 0, moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const walking = moveX !== 0 || moveZ !== 0;

    if (walking) {
      // Normalize
      const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= len;
      moveZ /= len;

      // Rotate by yaw
      const sinY = Math.sin(this.yaw);
      const cosY = Math.cos(this.yaw);
      const worldX = moveX * cosY - moveZ * sinY;
      const worldZ = moveX * sinY + moveZ * cosY;

      // Apply movement with collision
      let newX = this.playerX + worldX * speed * dt;
      let newZ = this.playerZ + worldZ * speed * dt;

      // Collision resolution
      for (const box of this.collisionBoxes) {
        const closestX = Math.max(box.minX, Math.min(newX, box.maxX));
        const closestZ = Math.max(box.minZ, Math.min(newZ, box.maxZ));
        const dx = newX - closestX;
        const dz = newZ - closestZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < PLAYER_RADIUS) {
          if (dist < 0.001) {
            // Inside the box, push out on nearest axis
            const pushLeft = newX - box.minX;
            const pushRight = box.maxX - newX;
            const pushTop = newZ - box.minZ;
            const pushBottom = box.maxZ - newZ;
            const minPush = Math.min(pushLeft, pushRight, pushTop, pushBottom);
            if (minPush === pushLeft) newX = box.minX - PLAYER_RADIUS;
            else if (minPush === pushRight) newX = box.maxX + PLAYER_RADIUS;
            else if (minPush === pushTop) newZ = box.minZ - PLAYER_RADIUS;
            else newZ = box.maxZ + PLAYER_RADIUS;
          } else {
            const overlap = PLAYER_RADIUS - dist;
            newX += (dx / dist) * overlap;
            newZ += (dz / dist) * overlap;
          }
        }
      }

      this.playerX = newX;
      this.playerZ = newZ;
    }

    this.audio.updateFootsteps(walking && this.pointerLocked, dt);
  }

  private updateCamera(dt: number) {
    // Head bob
    const walking = this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD']
                  || this.keys['ArrowUp'] || this.keys['ArrowDown'] || this.keys['ArrowLeft'] || this.keys['ArrowRight'];
    if (walking) {
      const sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
      this.bobPhase += dt * (sprint ? 12 : 8);
    } else {
      // Settle bob
      this.bobPhase += dt * 2;
    }
    const bobY = walking ? Math.sin(this.bobPhase) * 0.04 : 0;

    // Screen shake
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 0.1 : 0;
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 0.1 : 0;

    this.camera.position.set(
      this.playerX + shakeX,
      PLAYER_HEIGHT + bobY + shakeY,
      this.playerZ
    );
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  private updateLights(dt: number) {
    const time = this.clock.elapsedTime;
    for (const fl of this.flickerLights) {
      const flicker = Math.sin(time * 8 + fl.phase) * 0.15
                    + Math.sin(time * 13 + fl.phase * 2.3) * 0.1
                    + Math.sin(time * 23 + fl.phase * 0.7) * 0.05;
      fl.light.intensity = fl.baseIntensity * (1 + flicker);

      // Occasional dramatic flicker
      if (Math.random() < 0.002) {
        fl.light.intensity *= 0.1;
      }
    }
  }

  private updateItems(dt: number) {
    const time = this.clock.elapsedTime;
    for (const item of this.items) {
      if (item.collected) continue;
      // Float and rotate
      item.mesh.position.y = item.def.y + Math.sin(time * 2 + item.def.x) * 0.1;
      item.mesh.rotation.y = time * 1.5;
    }
  }

  private updateInteraction() {
    // Raycast forward from camera
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    let closest: { type: 'item' | 'door'; id: string; prompt: string; dist: number } | null = null;

    // Check items
    for (const item of this.items) {
      if (item.collected) continue;
      const dx = item.def.x - this.playerX;
      const dz = item.def.z - this.playerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > INTERACT_DISTANCE) continue;

      // Check if roughly looking at it
      const toItem = new THREE.Vector3(dx, item.def.y - PLAYER_HEIGHT, dz).normalize();
      const dot = dir.dot(toItem);
      if (dot > 0.7) {
        const prompt = `[E] Pick up ${item.def.name}`;
        if (!closest || dist < closest.dist) {
          closest = { type: 'item', id: item.def.id, prompt, dist };
        }
      }
    }

    // Check doors
    for (const [doorId, doorData] of this.doorMeshes) {
      const doorPos = doorData.mesh.position;
      const dx = doorPos.x - this.playerX;
      const dz = doorPos.z - this.playerZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > INTERACT_DISTANCE) continue;

      const toDoor = new THREE.Vector3(dx, 0, dz).normalize();
      const dot = dir.dot(toDoor);
      if (dot > 0.5) {
        const wall = doorData.box.wallRef;
        const locked = wall?.requiredKey && !this.inventory.includes(wall.requiredKey);
        const prompt = locked ? '[E] Door (Locked)' : '[E] Open Door';
        if (!closest || dist < closest.dist) {
          closest = { type: 'door', id: doorId, prompt, dist };
        }
      }
    }

    const prev = this.currentInteractable;
    this.currentInteractable = closest;

    if (closest?.prompt !== prev?.prompt) {
      this.callbacks.onInteractableChange(closest?.prompt || null);
    }
  }

  private updateTriggers() {
    for (const trigger of this.triggers) {
      if (trigger.fired && trigger.def.oneShot) continue;

      const dx = this.playerX - trigger.def.x;
      const dz = this.playerZ - trigger.def.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < trigger.def.radius) {
        if (trigger.fired) continue;
        trigger.fired = true;

        const delay = trigger.def.delay || 0;

        setTimeout(() => {
          switch (trigger.def.type) {
            case 'message':
              this.callbacks.onMessage(trigger.def.message!, 'horror', 5000);
              break;
            case 'sound':
              if (trigger.def.soundType) {
                this.audio.playSound(trigger.def.soundType);
              }
              if (trigger.def.message) {
                this.callbacks.onMessage(trigger.def.message, 'horror', 4000);
              }
              break;
            case 'damage':
              this.takeDamage(trigger.def.damage || 10);
              if (trigger.def.message) {
                this.callbacks.onMessage(trigger.def.message, 'warning', 3000);
              }
              break;
            case 'visual':
              this.horrorDistort = 1.0;
              this.screenShake = 1.0;
              if (trigger.def.message) {
                this.callbacks.onMessage(trigger.def.message, 'horror', 5000);
              }
              break;
          }
        }, delay);
      }
    }
  }

  private takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.damageOverlayAlpha = 1.0;
    this.screenShake = 1.0;
    this.audio.playDamage();
    this.callbacks.onHealthChange(this.health);

    if (this.health <= 0) {
      this.running = false;
      this.callbacks.onDeath();
    }
  }

  private checkEscape() {
    const dx = this.playerX - this.escapePoint.x;
    const dz = this.playerZ - this.escapePoint.z;
    if (Math.sqrt(dx * dx + dz * dz) < this.escapeRadius) {
      this.running = false;
      this.callbacks.onEscape();
    }
  }

  private updateEffects(dt: number) {
    if (this.damageOverlayAlpha > 0) {
      this.damageOverlayAlpha = Math.max(0, this.damageOverlayAlpha - dt * 2);
    }
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 3);
    }
    if (this.horrorDistort > 0) {
      this.horrorDistort = Math.max(0, this.horrorDistort - dt * 0.5);
      // Warp FOV
      this.camera.fov = 70 + Math.sin(this.clock.elapsedTime * 5) * this.horrorDistort * 15;
      this.camera.updateProjectionMatrix();
    }
  }

  getDamageOverlayAlpha(): number {
    return this.damageOverlayAlpha;
  }

  getHorrorDistort(): number {
    return this.horrorDistort;
  }

  getHealth(): number {
    return this.health;
  }

  isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  private onResize = () => {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
