/**
 * CodePen Compatible Single File Gesture Control Particle System
 * Automatically loads Three.js and MediaPipe
 */

(async function() {
    // --- Configuration ---
    const CONFIG = {
        particleCount: 3000,
        particleSize: 0.15,
        balloonCount: 30,
        colors: {
            text: 0xffffff,
            heart: 0xff0000,
            balloons: [0xff5e57, 0xffdd59, 0x05c46b, 0x0fbcf9, 0xd2a8ff]
        }
    };

    // --- Library Loader ---
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    console.log("Loading libraries...");
    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        console.log("Libraries loaded.");
    } catch (e) {
        console.error("Failed to load libraries", e);
        return;
    }

    // --- UI Setup ---
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) loadingScreen.remove();

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#000';

    const container = document.createElement('div');
    container.id = 'canvas-container';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    document.body.appendChild(container);

    const videoElement = document.createElement('video');
    videoElement.style.display = 'none'; // Process in background
    document.body.appendChild(videoElement);

    const fsBtn = document.createElement('button');
    fsBtn.innerText = '⛶';
    fsBtn.style.position = 'absolute';
    fsBtn.style.top = '20px';
    fsBtn.style.right = '20px';
    fsBtn.style.background = 'rgba(255,255,255,0.2)';
    fsBtn.style.border = 'none';
    fsBtn.style.color = 'white';
    fsBtn.style.fontSize = '24px';
    fsBtn.style.padding = '10px';
    fsBtn.style.cursor = 'pointer';
    fsBtn.style.borderRadius = '5px';
    fsBtn.onclick = () => {
        if (!document.fullscreenElement) {
            document.body.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };
    document.body.appendChild(fsBtn);

    // --- Three.js Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // --- Particle System ---
    class ParticleText {
        constructor(scene) {
            this.scene = scene;
            this.particles = [];
            this.geometry = new THREE.BufferGeometry();
            this.material = new THREE.PointsMaterial({
                color: CONFIG.colors.text,
                size: CONFIG.particleSize,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            // Initial random positions
            const positions = [];
            for (let i = 0; i < CONFIG.particleCount; i++) {
                positions.push((Math.random() - 0.5) * 50); // x
                positions.push((Math.random() - 0.5) * 30); // y
                positions.push((Math.random() - 0.5) * 20); // z
                
                this.particles.push({
                    x: positions[i*3],
                    y: positions[i*3+1],
                    z: positions[i*3+2],
                    tx: positions[i*3], // target x
                    ty: positions[i*3+1],
                    tz: positions[i*3+2],
                    vx: 0, vy: 0, vz: 0 // velocity
                });
            }
            
            this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            this.mesh = new THREE.Points(this.geometry, this.material);
            this.scene.add(this.mesh);
            
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = 400;
            this.canvas.height = 200;
            // document.body.appendChild(this.canvas); // Debug
            // this.canvas.style.position = 'absolute';
            // this.canvas.style.top = '0';
            // this.canvas.style.zIndex = '100';
        }

        updateTargetsFromText(text, isHeart = false) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            if (isHeart) {
                // Special handling for I <3 U to add color or heart shape logic if needed
                // For simplicity, we draw text "I ❤️ U"
                this.ctx.font = 'bold 80px Arial';
                this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
            } else {
                this.ctx.font = 'bold 150px Arial';
                this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
            }

            const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = imgData.data;
            const validPixels = [];

            for (let y = 0; y < this.canvas.height; y += 4) { // stride for density
                for (let x = 0; x < this.canvas.width; x += 4) {
                    const alpha = data[(y * this.canvas.width + x) * 4 + 3];
                    if (alpha > 128) {
                        validPixels.push({
                            x: (x - this.canvas.width / 2) * 0.1,
                            y: -(y - this.canvas.height / 2) * 0.1,
                            z: 0
                        });
                    }
                }
            }

            // Assign targets
            // If more particles than pixels, rest fly around or hide
            // If more pixels than particles, tough luck (or we could respawn)
            
            this.particles.forEach((p, i) => {
                if (i < validPixels.length) {
                    p.tx = validPixels[i].x;
                    p.ty = validPixels[i].y;
                    p.tz = validPixels[i].z;
                    p.active = true;
                } else {
                    // Fly to random background
                    p.tx = (Math.random() - 0.5) * 60;
                    p.ty = (Math.random() - 0.5) * 40;
                    p.tz = (Math.random() - 0.5) * 20 - 10;
                    p.active = false;
                }
            });
            
            // Change color based on mode
            if (isHeart) {
                this.material.color.setHex(CONFIG.colors.heart);
            } else {
                this.material.color.setHex(CONFIG.colors.text);
            }
        }

        reset() {
            this.particles.forEach(p => {
                p.tx = (Math.random() - 0.5) * 50;
                p.ty = (Math.random() - 0.5) * 30;
                p.tz = (Math.random() - 0.5) * 20;
                p.active = false;
            });
            this.material.color.setHex(CONFIG.colors.text);
        }

        update() {
            const positions = this.geometry.attributes.position.array;
            const damping = 0.1;
            const force = 0.6; // Increased speed

            this.particles.forEach((p, i) => {
                // Seek target
                const dx = p.tx - p.x;
                const dy = p.ty - p.y;
                const dz = p.tz - p.z;

                p.vx += dx * force * 0.1;
                p.vy += dy * force * 0.1;
                p.vz += dz * force * 0.1;

                p.vx *= (1 - damping);
                p.vy *= (1 - damping);
                p.vz *= (1 - damping);

                // Add some noise if not active (floating dust)
                if (!p.active) {
                     p.vx += (Math.random() - 0.5) * 0.05;
                     p.vy += (Math.random() - 0.5) * 0.05;
                }

                p.x += p.vx * 0.2; // Increased speed multiplier
                p.y += p.vy * 0.2;
                p.z += p.vz * 0.2;

                positions[i * 3] = p.x;
                positions[i * 3 + 1] = p.y;
                positions[i * 3 + 2] = p.z;
            });
            this.geometry.attributes.position.needsUpdate = true;
        }
    }

    // --- Balloon & Flower System ---
    class BalloonSystem {
        constructor(scene) {
            this.scene = scene;
            this.objects = [];
            this.active = false;
        }

        createFlower(color) {
            const group = new THREE.Group();
            
            // Center
            const centerGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const centerMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
            const center = new THREE.Mesh(centerGeo, centerMat);
            group.add(center);
            
            // Petals
            const petalGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const petalMat = new THREE.MeshPhongMaterial({ color: color });
            
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const petal = new THREE.Mesh(petalGeo, petalMat);
                petal.position.set(Math.cos(angle)*0.4, Math.sin(angle)*0.4, 0);
                group.add(petal);
            }
            return group;
        }

        spawn() {
            if (this.active) return;
            this.active = true;
            
            // Spawn Balloons
            for (let i = 0; i < CONFIG.balloonCount; i++) {
                // ... (Balloon creation code same as before, essentially) ...
                const geometry = new THREE.SphereGeometry(1, 32, 32);
                const color = CONFIG.colors.balloons[Math.floor(Math.random() * CONFIG.colors.balloons.length)];
                const material = new THREE.MeshPhongMaterial({ 
                    color: color, 
                    specular: 0xffffff,
                    shininess: 100
                });
                const balloon = new THREE.Mesh(geometry, material);
                
                balloon.position.set(
                    (Math.random() - 0.5) * 40,
                    -20 - Math.random() * 20,
                    (Math.random() - 0.5) * 20
                );
                
                const lineGeo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, -3, 0)
                ]);
                const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
                const line = new THREE.Line(lineGeo, lineMat);
                balloon.add(line);

                this.scene.add(balloon);
                this.objects.push({
                    mesh: balloon,
                    speed: 0.1 + Math.random() * 0.2,
                    wobble: Math.random() * Math.PI * 2,
                    type: 'balloon'
                });
            }

            // Spawn Flowers (Floating up mixed with balloons)
            for (let i = 0; i < 15; i++) {
                const color = CONFIG.colors.balloons[Math.floor(Math.random() * CONFIG.colors.balloons.length)];
                const flower = this.createFlower(color);
                
                flower.position.set(
                    (Math.random() - 0.5) * 40,
                    -20 - Math.random() * 20,
                    (Math.random() - 0.5) * 10
                );
                
                this.scene.add(flower);
                this.objects.push({
                    mesh: flower,
                    speed: 0.05 + Math.random() * 0.1, // Slower than balloons
                    wobble: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.1,
                    type: 'flower'
                });
            }
        }

        reset() {
            this.active = false;
            this.objects.forEach(o => this.scene.remove(o.mesh));
            this.objects = [];
        }

        update() {
            if (!this.active) return;
            this.objects.forEach(o => {
                o.mesh.position.y += o.speed;
                o.wobble += 0.05;
                o.mesh.position.x += Math.sin(o.wobble) * 0.05;
                
                if (o.type === 'flower') {
                    o.mesh.rotation.z += o.rotSpeed;
                    o.mesh.rotation.y += o.rotSpeed;
                }

                if (o.mesh.position.y > 30) {
                     o.mesh.position.y = -20;
                }
            });
        }
    }

    // --- Main Logic ---
    const particleSystem = new ParticleText(scene);
    const balloonSystem = new BalloonSystem(scene);

    let lastState = '';

    function handleGesture(fingers, isFist) {
        let newState = '';
        
        if (isFist) {
            newState = 'RESET';
        } else if (fingers === 5) {
            newState = 'LOVE';
        } else if (fingers >= 1 && fingers <= 3) {
            newState = fingers.toString();
        } else {
            // Keep previous state or drift?
            // Requirement says "Directly display", implies holding the gesture.
            // If hand lost or other gesture, maybe idle?
            // "Reset logic: detect fist ... clear screen"
            // So if just 4 fingers or no hand, maybe do nothing (sustain) or idle?
            // Let's assume sustain last known relevant state unless Reset.
            // But if user switches 1->2, we must update.
            return; 
        }

        if (newState !== lastState) {
            lastState = newState;
            console.log("State:", newState);
            
            if (newState === 'RESET') {
                particleSystem.reset();
                balloonSystem.reset();
            } else if (newState === 'LOVE') {
                particleSystem.updateTargetsFromText('I ❤️ U', true);
                balloonSystem.spawn();
            } else {
                // Numbers
                particleSystem.updateTargetsFromText(newState);
                balloonSystem.reset(); // Hide balloons if switching back to numbers
            }
        }
    }

    // --- Hand Tracking ---
    function countFingers(landmarks) {
        // Tips: 4, 8, 12, 16, 20
        // PIPs: 2, 6, 10, 14, 18
        // Wrist: 0
        
        const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
        const pips = [6, 10, 14, 18];
        
        let count = 0;
        
        // Thumb (check x distance relative to wrist/IP)
        // For simplicity on 2D: Check if Tip x is further from palm center than IP x?
        // Or simple: thumb tip x < thumb ip x (right hand)
        // Let's use y-axis for main fingers and assume upright hand.
        
        // Check fingers (upright hand: tip.y < pip.y)
        tips.forEach((tipIdx, i) => {
            if (landmarks[tipIdx].y < landmarks[pips[i]].y) {
                count++;
            }
        });

        // Thumb: Compare x with MCP (joint 2)
        // Depends on hand side (Left/Right).
        // Let's deduce handedness or use geometry independent of side (distance from pinky mcp?)
        // Simple trick: thumb tip distance to index mcp > thumb ip distance to index mcp
        const thumbTip = landmarks[4];
        const thumbIp = landmarks[3];
        const indexMcp = landmarks[5]; // stable point
        
        const distTip = Math.hypot(thumbTip.x - indexMcp.x, thumbTip.y - indexMcp.y);
        const distIp = Math.hypot(thumbIp.x - indexMcp.x, thumbIp.y - indexMcp.y);
        
        if (distTip > distIp * 1.1) { // Extended
             count++;
        }

        return count;
    }

    function isFistGesture(landmarks) {
        // All fingers curled.
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];
        let curled = 0;
        
        tips.forEach((tipIdx, i) => {
             if (landmarks[tipIdx].y > landmarks[pips[i]].y) { // Below PIP (curled down)
                 curled++;
             }
        });
        
        // Thumb curled?
        // Check thumb tip close to index MCP
        const thumbTip = landmarks[4];
        const indexMcp = landmarks[5];
        const dist = Math.hypot(thumbTip.x - indexMcp.x, thumbTip.y - indexMcp.y);
        
        // If 4 fingers curled and thumb close, it's a fist.
        // Or if count == 0.
        // Let's use the count logic mostly, but explicit 0 fingers might be "no hand". 
        // Fist implies hand is present but fingers closed.
        
        // Let's verify hand presence is handled by "onResults".
        // If count == 0 and hand is confident -> Fist.
        return curled >= 4; 
    }

    const hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const fingerCount = countFingers(landmarks);
            const fist = isFistGesture(landmarks); // OR fingerCount === 0
            
            // Priority: Fist > 5 > 1/2/3
            if (fist || fingerCount === 0) {
                 handleGesture(0, true);
            } else {
                 handleGesture(fingerCount, false);
            }
        }
    });

    const cameraUtils = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
        },
        width: 1280,
        height: 720
    });
    cameraUtils.start();

    // --- Render Loop ---
    function animate() {
        requestAnimationFrame(animate);
        particleSystem.update();
        balloonSystem.update();
        renderer.render(scene, camera);
    }
    
    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();

})();
