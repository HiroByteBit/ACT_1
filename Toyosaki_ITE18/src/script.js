// Scene, camera, and renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('canvas.webgl') });
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 10;

// Create a 5-point star shape
function createStarShape() {
    const shape = new THREE.Shape();
    const outerRadius = 1;
    const innerRadius = 0.5;
    const points = 5;

    for (let i = 0; i <= points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    return shape;
}

// Create 3D star geometry
const starShape = createStarShape();
const starGeometry = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 2
});
const starMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.5, roughness: 0.5 });
const star = new THREE.Mesh(starGeometry, starMaterial);
scene.add(star);

// Lights
scene.add(new THREE.AmbientLight(0x404040));
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Raycasting for interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let dragOffset = new THREE.Vector3();
let intersectedObject = null;
let isClick = false; // To detect click
let clickStartTime = 0;
const CLICK_THRESHOLD = 150; // Time in milliseconds to differentiate click vs drag

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (!isDragging) {
        star.rotation.x += 0.01;
        star.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}
animate();

// Event Handlers
function onMouseDown(event) {
    isClick = true;
    clickStartTime = performance.now();

    // Update mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(star);

    if (intersects.length > 0) {
        intersectedObject = intersects[0].object;
        isDragging = true;

        // Calculate the drag offset
        const intersectionPoint = intersects[0].point;
        dragOffset.copy(intersectionPoint).sub(intersectedObject.position);
    }
}

function onMouseUp(event) {
    const clickDuration = performance.now() - clickStartTime;
    isDragging = false;

    // If mouse is released quickly, it is a click, not a drag
    if (isClick && clickDuration < CLICK_THRESHOLD && intersectedObject) {
        intersectedObject.material.color.setHex(Math.random() * 0xffffff);
    }

    isClick = false;
    intersectedObject = null;
}

function onMouseMove(event) {
    if (isDragging && intersectedObject) {
        isClick = false; // If moving, it's not a click
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const planeNormal = new THREE.Vector3(0, 0, 1); // Drag along the XY plane
        const plane = new THREE.Plane(planeNormal);
        const intersectionPoint = new THREE.Vector3();

        raycaster.ray.intersectPlane(plane, intersectionPoint);
        intersectedObject.position.copy(intersectionPoint.sub(dragOffset));
    }
}

// Event listeners
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('mousemove', onMouseMove);
