import './style.css'
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LatheBufferGeometry } from 'three';

const scene = new THREE.Scene();

const vehicleColors = [0xa52523, 0xbdb638, 0xff88ff, 0x4444ff];
const treeColors = [0xFFC500, 0x2CFF00, 0xFF7E00, 0xF84235]

//Set up lights and grid
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(100, -300, 400);
scene.add(dirLight);

//Set up camera

const aspectRatio = window.innerWidth / window.innerHeight;
const cameraWidth = 960;
const cameraHeight = cameraWidth / aspectRatio;

const camera = new THREE.OrthographicCamera(
  cameraWidth / -2, // left
  cameraWidth / 2, // right
  cameraHeight / 2, // top
  cameraHeight / -2, // bottom
  0, //near plane
  1000 //far plane
);

camera.position.set(0, -210, 300);
camera.lookAt(0, 0, 0);


const trackRadius = 225;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;

const arcAngle1 = (1 / 3) * Math.PI; //60 degrees

const deltaY = Math.sin(arcAngle1) * innerTrackRadius;
const arcAngle2 = Math.asin(deltaY / outerTrackRadius);

const arcCenterX =
  (
    Math.cos(arcAngle1) * innerTrackRadius +
    Math.cos(arcAngle2) * outerTrackRadius
  ) / 2;
const arcAngle3 = Math.acos(arcCenterX / innerTrackRadius)

const arcAngle4 = Math.acos(arcCenterX / outerTrackRadius)

renderMap(cameraWidth, cameraHeight * 2);


function renderMap(mapWidth, mapHeight) {
  // Plane with line markings
  const lineMarkingsTexture = getLineMarkings(mapWidth, mapHeight);

  const planeGeometry = new THREE.PlaneBufferGeometry(mapWidth, mapHeight);
  const planeMaterial = new THREE.MeshLambertMaterial({
    // color: 0x546e90,
    map: lineMarkingsTexture,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  scene.add(plane);

  // Extruded Geometry
  const islandLeft = getLeftIsland();
  const islandRight = getRightIsland();
  const islandMiddle = getMiddleIsland();
  const outerField = getOuterField(mapWidth, mapHeight);

  const fieldGeometry = new THREE.ExtrudeBufferGeometry(
    [islandLeft, islandRight, islandMiddle, outerField],
    {depth: 6, bevelEnabled: false }
  );

  const fieldMesh = new THREE.Mesh(fieldGeometry, [
    new THREE.MeshLambertMaterial({ color: 0x67c240 }),
    new THREE.MeshLambertMaterial({ color: 0x23311c }),
  ]);
  scene.add(fieldMesh);

};

function getLeftIsland() {
  const islandLeft = new THREE.Shape();

  islandLeft.absarc(
    -arcCenterX,
    0,
    innerTrackRadius,
    arcAngle1,
    -arcAngle1,
    false
  );

  islandLeft.absarc(
    arcCenterX,
    0,
    outerTrackRadius,
    Math.PI + arcAngle2,
    Math.PI - arcAngle2,
    true
  );

  return islandLeft;
};

function getRightIsland() {
  const islandRight = new THREE.Shape();

  islandRight.absarc(
    arcCenterX,
    0,
    innerTrackRadius,
    Math.PI - arcAngle1,
    Math.PI + arcAngle1,
    true
  );

  islandRight.absarc(
    -arcCenterX,
    0,
    outerTrackRadius,
    -arcAngle2,
    arcAngle2,
    false
  );

  return islandRight;
};

function getMiddleIsland() {
  const islandMiddle = new THREE.Shape();

  islandMiddle.absarc(
    -arcCenterX,
    0,
    innerTrackRadius,
    arcAngle3,
    -arcAngle3,
    true
  );

  islandMiddle.absarc(
    arcCenterX,
    0,
    innerTrackRadius,
    Math.PI + arcAngle3,
    Math.PI - arcAngle3,
    true
  );

  return islandMiddle;
};

function getOuterField(mapWidth, mapHeight) {
  const field = new THREE.Shape();

  field.moveTo(-mapWidth / 2, -mapHeight / 2);
  field.lineTo(0,-mapHeight /2);

  field.absarc(
    -arcCenterX,
    0,
    outerTrackRadius,
    -arcAngle4,
    arcAngle4,
    true
  );

  field.absarc(
    arcCenterX,
    0,
    outerTrackRadius,
    Math.PI - arcAngle4,
    Math.PI + arcAngle4,
    true
  );

  field.lineTo(0, -mapHeight / 2);
  field.lineTo(mapWidth / 2, -mapHeight / 2);
  field.lineTo(mapWidth / 2, mapHeight / 2);
  field.lineTo(-mapWidth / 2, mapHeight / 2);

  return field;
}

// Set up renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

document.body.appendChild(renderer.domElement);

renderer.render(scene, camera);
// Camera Controls
// const controls = new OrbitControls(camera, renderer.domElement);
// function animate() {
//   requestAnimationFrame(animate);

//   controls.update();

//   renderer.render(scene, camera);
// }
// animate();


// Function to create Car
function Car() {
  const car = new THREE.Group();

  const backWheel = Wheel();
  backWheel.position.x = -18;
  car.add(backWheel);

  const frontWheel = Wheel();
  frontWheel.position.x = 18;
  car.add(frontWheel);

  const main = new THREE.Mesh(
      new THREE.BoxBufferGeometry(60, 30, 15),
      new THREE.MeshLambertMaterial({ color: pickRandom(vehicleColors) })
  );
  main.position.z = 12;
  car.add(main);

  const carFrontTexture = getCarFrontTexture();
  carFrontTexture.center = new THREE.Vector2(0.5, 0.5);
  carFrontTexture.rotation = Math.PI / 2;

  const carBackTexture = getCarFrontTexture();
  carBackTexture.center = new THREE.Vector2(0.5, 0.5);
  carBackTexture.rotation = -Math.PI / 2;

  const carLeftSideTexture = getCarSideTexture();
  carLeftSideTexture.flipY = false;
  const carRightSideTexture = getCarSideTexture();


  const cabin = new THREE.Mesh(new THREE.BoxBufferGeometry(33, 24, 12), [
    new THREE.MeshLambertMaterial({ map: carFrontTexture }),
    new THREE.MeshLambertMaterial({ map: carBackTexture }),
    new THREE.MeshLambertMaterial({ map: carLeftSideTexture }),
    new THREE.MeshLambertMaterial({ map: carRightSideTexture }),
    new THREE.MeshLambertMaterial({ color: 0xffffff }), //top
    new THREE.MeshLambertMaterial({ color: 0xffffff }), //bottom
  ]
  );
  cabin.position.x = -6
  cabin.position.z = 25.5
  car.add(cabin);

  return car;
}

function Wheel() {
  const wheel = new THREE.Mesh(
    new THREE.BoxBufferGeometry(12, 33, 12),
    new THREE.MeshLambertMaterial({color: 0x333333})
  );
  wheel.position.z = 6;
  return wheel;
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getCarFrontTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 64, 32);

  context.fillStyle = "#666666";
  context.fillRect(8, 8, 48, 24);

  return new THREE.CanvasTexture(canvas);
}

function getCarSideTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 128, 32);

  context.fillStyle = "#666666";
  context.fillRect(10, 8, 38, 24);
  context.fillRect(58, 8, 60, 24);

  return new THREE.CanvasTexture(canvas);
}



function Tree() {
  const tree = new THREE.Group();

  const posOrNeg = Math.random() < 0.5 ? -1 : 1;
  const x = (Math.random() * (500 - 0)) * (Math.random() < 0.5 ? -1 : 1);
  var y = (Math.random() * (500 - 300) + 300) * (Math.random() < 0.5 ? -1 : 1);
  if(x > 435 ||  x < -435) {
    y = (Math.random() * (300)) * (Math.random() < 0.5 ? -1 : 1);
  }

  const stump = new THREE.Mesh(
    new THREE.BoxBufferGeometry(15, 15, 45),
    new THREE.MeshLambertMaterial({ color: 0x744700})
  );
  stump.position.set(x, y, 20);
  tree.add(stump);

  const leaves = new THREE.Mesh(
    new THREE.SphereBufferGeometry(25, 10, 10),
    new THREE.MeshLambertMaterial({ color: pickRandom(treeColors)})
  );
  leaves.position.set(x, y, 50);
  tree.add(leaves);
  leaves.position.set(x, y, 50);
  //450, 300
  scene.add(tree);
}
Array(200).fill().forEach(Tree);




function Truck() {
  const truck = new THREE.Group();

  const trailer = new THREE.Mesh(
    new THREE.BoxBufferGeometry(100, 35, 30),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  trailer.position.z = 25;
  truck.add(trailer);

  const connector = new THREE.Mesh(
    new THREE.BoxBufferGeometry(15, 20, 5),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  connector.position.x = 57;
  connector.position.z = 11;
  truck.add(connector);

  const cabinColor = pickRandom(vehicleColors);
  const frontTexture = getTruckFrontTexture(cabinColor.toString(16));
  const leftTexture = getTruckSideTexture(cabinColor.toString(16));
  leftTexture.flipY = false;
  const rightTexture = getTruckSideTexture(cabinColor.toString(16));
  
  const cabin = new THREE.Mesh(
    new THREE.BoxBufferGeometry(30, 30, 25), [
      new THREE.MeshLambertMaterial({ map: frontTexture}), //Front
      new THREE.MeshLambertMaterial({ color: cabinColor }), //Back
      new THREE.MeshLambertMaterial({ map: leftTexture }), //Left
      new THREE.MeshLambertMaterial({ map: rightTexture }), //Right
      new THREE.MeshLambertMaterial({ color: cabinColor }), //Top
      new THREE.MeshLambertMaterial({ color: cabinColor }), //Bottom
    ]
  );
  cabin.position.x = 70;
  cabin.position.z = 20;
  truck.add(cabin);

  const frontWheel = Wheel();
  frontWheel.position.x = 70;
  const midWheel = Wheel();
  midWheel.position.x = 30;
  const backWheel = Wheel();
  backWheel.position.x = -25;
  truck.add(frontWheel, midWheel, backWheel);

  return truck;
}

function getTruckFrontTexture(cabinColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#" + cabinColor;
  context.fillRect(0, 0, 64, 32);

  context.fillStyle = "#444444";
  context.fillRect(10, -10, 20, 60);

  return new THREE.CanvasTexture(canvas);
}

function getTruckSideTexture(cabinColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#" + cabinColor;
  context.fillRect(0, 0, 64, 32);

  context.fillStyle = "#444444";
  context.fillRect(45, 5, 20, 10);

  return new THREE.CanvasTexture(canvas);
}

//Create Track

function getLineMarkings(mapWidth, mapHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const context = canvas.getContext("2d");

  context.fillStyle = "#546E90";
  context.fillRect(0, 0, mapWidth, mapHeight);

  context.linewidth = 2;
  context.strokeStyle = "#E0FFFF";
  context.setLineDash([10, 14]);

  // Left circle
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    trackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  // Right Circle
  context.beginPath();
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    trackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  return new THREE.CanvasTexture(canvas);
}

// Game Code

let ready;
let playerAngleMoved;
let score;
const scoreElement = document.getElementById("score");
let otherVehicles = [];
let lastTimestamp;
const playerCar = Car();
const playerAngleInitial = Math.PI;
const speed = 0.0017;
let accelerate = false;
let decelerate = false;
scene.add(playerCar);

reset();

function reset () {
  // Reset position and score
  playerAngleMoved = 0;
  movePlayerCar(0);
  score = 0;
  scoreElement.innerText = score;
  lastTimestamp = undefined;

  //Remove other vehicles
  otherVehicles.forEach((vehicle) => {
    scene.remove(vehicle.mesh);
  });
  otherVehicles = [];

  renderer.render(scene, camera);
  ready = true;
}

function startGame() {
  if (ready) {
    ready = false;
    renderer.setAnimationLoop(animation);
  }
}

window.addEventListener("keydown", function (event) {
  if (event.key == "ArrowUp") {
    startGame();
    accelerate = true;
    return;
  }

  if (event.key == "ArrowDown") {
    decelerate = true;
    return;
  }

  if (event.key == "R" || event.key == "r") {
    reset();
    return;
  }
});

window.addEventListener("keyup", function (event) {
  if (event.key == "ArrowUp") {
    accelerate = false;
    return;
  }

  if (event.key == "ArrowDown") {
    decelerate = false;
    return;
  }
});

function animation(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    return;
  }

  const timeDelta = timestamp - lastTimestamp;

  movePlayerCar(timeDelta);

  const laps = Math.floor(Math.abs(playerAngleMoved) / (Math.PI / 2));

  //Update score if it has changed
  if (laps != score) {
    score = laps;
    scoreElement.innerText = score;
  }

  //Add a new vehicle at start and with every 5th lap
  if (otherVehicles.length < (laps + 1) / 5) addVehicle();

  moveOtherVehicles(timeDelta);

  hitDetection();

  renderer.render(scene, camera);
  lastTimestamp = timestamp;
}

function movePlayerCar(timeDelta) {
  const playerSpeed = getPlayerSpeed();
  playerAngleMoved -= playerSpeed * timeDelta;

  const totalPlayerAngle = playerAngleInitial + playerAngleMoved;

  const playerX = Math.cos(totalPlayerAngle) * trackRadius - arcCenterX;
  const playerY = Math.sin(totalPlayerAngle) * trackRadius;

  playerCar.position.x = playerX;
  playerCar.position.y = playerY;

  playerCar.rotation.z = totalPlayerAngle - Math.PI / 2;
}

function getPlayerSpeed() {
  if (accelerate) return speed * 2;
  if (decelerate) return speed * 0.5;
  return speed;
}

function addVehicle() {
  const vehicleTypes = ["car", "truck"];

  const type = pickRandom(vehicleTypes);
  const mesh = type == "car" ? Car() : Truck();
  scene.add(mesh);

  const clockwise = Math.random() > 0.5;
  const angle = clockwise ? Math.PI / 2: -Math.PI / 2;

  const speed = getVehicleSpeed(type);

  otherVehicles.push({ mesh, type, clockwise, angle, speed});
}

function getVehicleSpeed(type) {
  if (type == "car") {
    const minimumSpeed = 1;
    const maximumSpeed = 2;
    return minimumSpeed + Math.random() * (maximumSpeed  -minimumSpeed);
  }
  if (type == "truck") {
    const minimumSpeed = 0.6;
    const maximumSpeed = 1.5;
    return minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);
  }
}

function moveOtherVehicles(timeDelta) {
  otherVehicles.forEach((vehicle) => {
    if (vehicle.clockwise) {
      vehicle.angle -= speed * timeDelta * vehicle.speed;
    } else {
      vehicle.angle += speed * timeDelta * vehicle.speed;
    }

    const vehicleX = Math.cos(vehicle.angle) * trackRadius + arcCenterX;
    const vehicleY = Math.sin(vehicle.angle) * trackRadius;
    const rotation = 
      vehicle.angle + (vehicle.clockwise ? -Math.PI / 2 : Math.PI / 2);
    
    vehicle.mesh.position.x = vehicleX;
    vehicle.mesh.position.y = vehicleY;
    vehicle.mesh.rotation.z = rotation;
  });
}

function getHitZonePosition(center, angle, clockwise, distance) {
  const directionAngle = angle + clockwise ? -Math.PI / 2 : Math.PI / 2;
  return {
    x: center.x + Math.cos(directionAngle) * distance,
    y: center.y + Math.sin(directionAngle) * distance,
  };
}

function hitDetection() {
  const playerHitZone1 = getHitZonePosition(
    playerCar.position,
    playerAngleInitial + playerAngleMoved,
    true,
    15
  );

  const playerHitZone2 = getHitZonePosition(
    playerCar.position,
    playerAngleInitial + playerAngleMoved,
    true,
    -15
  );

  const hit = otherVehicles.some((vehicle) => {
    if (vehicle.type == "car") {
      const vehicleHitZone1 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        15
      );

      const vehicleHitZone2 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        15
      );

      // The player hits another vehicle
      if (getDistance(playerHitZone1, vehicleHitZone1) < 40) return true;
      if (getDistance(playerHitZone1, vehicleHitZone2) < 40) return true;

      // Another vehicle hits the player
      if (getDistance(playerHitZone2, vehicleHitZone1) < 40) return true;
    }

    // if (vehicle.type == "truck") {
    //   //Change this to make proper hitboxes for the truck
    //   const vehicleHitZone1 = getHitZonePosition(
    //     vehicle.mesh.position,
    //     vehicle.angle,
    //     vehicle.clockwise,
    //     15
    //   );

    //   const vehicleHitZone2 = getHitZonePosition(
    //     vehicle.mesh.position,
    //     vehicle.angle,
    //     vehicle.clockwise,
    //     15
    //   );

    //   // The player hits another vehicle
    //   if (getDistance(playerHitZone1, vehicleHitZone1) < 40) return true;
    //   if (getDistance(playerHitZone1, vehicleHitZone2) < 40) return true;

    //   // Another vehicle hits the player
    //   if (getDistance(playerHitZone2, vehicleHitZone1) < 40) return tru
    // }

  });
  if (hit) renderer.setAnimationLoop(null); // Stop animation loop
}

function getDistance(coordinate1, coordinate2) {
  return Math.sqrt(
    (coordinate2.x - coordinate1.x) ** 2 + (coordinate2.y - coordinate1.y) ** 2
  );
}
