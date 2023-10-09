import * as THREE from 'three';
import './style.css'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const canvas = document.querySelector('.canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
const loader = new GLTFLoader();

let earthSphere, marsSphere, moonSphere;
let isEarthHovered = false;
let isMarsHovered = false;
let isMoonHovered = false;

loader.load('/models/sci-fi_spaceship_bridge.glb', function (gltf) {
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});

const earthDayTexture = new THREE.TextureLoader().load('/images/earth_day_texture.jpg');
const earthNightTexture = new THREE.TextureLoader().load('/images/earth_night_texture.jpg');
const earthRadius = 0.8;
const earthSegments = 32;
const earthGeometry = new THREE.SphereGeometry(earthRadius, earthSegments, earthSegments);
const earthMaterial = new THREE.MeshBasicMaterial({ map: earthDayTexture });
earthSphere = new THREE.Mesh(earthGeometry, earthMaterial);
earthSphere.position.x = 0;
earthSphere.position.y = 1;
scene.add(earthSphere);

const marsTexture = new THREE.TextureLoader().load('/images/mars_texture.jpg');
const marsRadius = 0.5;
const marsSegments = 32;
const marsGeometry = new THREE.SphereGeometry(marsRadius, marsSegments, marsSegments);
const marsMaterial = new THREE.MeshBasicMaterial({ map: marsTexture });
marsSphere = new THREE.Mesh(marsGeometry, marsMaterial);
marsSphere.position.x = -3;
scene.add(marsSphere);

const moonTexture = new THREE.TextureLoader().load('/images/moon_texture.jpg');
const moonRadius = 0.5;
const moonSegments = 32;
const moonGeometry = new THREE.SphereGeometry(moonRadius, moonSegments, moonSegments);
const moonMaterial = new THREE.MeshBasicMaterial({ map: moonTexture });
moonSphere = new THREE.Mesh(moonGeometry, moonMaterial);
moonSphere.position.x = 3;
scene.add(moonSphere);

renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enableDamping = true;

camera.position.z = 5;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('mousemove', function (event) {
    if(!motionlock){
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersectsEarth = raycaster.intersectObject(earthSphere);
    const intersectsMars = raycaster.intersectObject(marsSphere);
    const intersectsMoon = raycaster.intersectObject(moonSphere);

    isEarthHovered = intersectsEarth.length > 0;
    isMarsHovered = intersectsMars.length > 0;
    isMoonHovered = intersectsMoon.length > 0;}
});
let motionlock=0;
document.addEventListener('click', function (event) {
    if (isEarthHovered&&!motionlock) {
        window.open('/pages/iss_experience.html', '_blank');
    } else if (isMarsHovered&&!motionlock) {
        window.open('/pages/mars_experience.html', '_blank');
    } else if (isMoonHovered&&!motionlock) {
        window.open('/pages/moon_experience.html', '_blank');
    }
});

function scaleAndRotatePlanet(planetSphere, isHovered) {
    const scaleFactor = isHovered ? 1.2 : 1; 
    planetSphere.scale.set(scaleFactor, scaleFactor, scaleFactor);
    planetSphere.rotation.y += 0.05;
    if(!isHovered)
    planetSphere.rotation.y -= 0.05;
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    scaleAndRotatePlanet(earthSphere, isEarthHovered);
    scaleAndRotatePlanet(marsSphere, isMarsHovered);
    scaleAndRotatePlanet(moonSphere, isMoonHovered);
    renderer.render(scene, camera);
}

animate();
let previousX=0;
let selectedPlanet="earth";
//handtracking
async function setupCamera() {
    try {
        const video = document.getElementById('video');
        const stream = await navigator.mediaDevices.getUserMedia({ 'video': true });
        video.srcObject = stream;
        video.style.display='none';
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } catch (error) {
        console.error('Error accessing webcam:', error);
    }
  }
  
  async function loadHandposeModel() {
      return await handpose.load();
  }
  let lastTabOpenTime = 0;
//   let isEarthHovered1=1;
//   let isMarsHovered1=0;
//   let isMoonHovered1=0;

  async function detectHands(video, model) {
    const canvas1=document.querySelector("#canvas1");
      const context = canvas1.getContext('2d');
      const fingerJoints = {
          thumb: [0, 1, 2, 3, 4],
          indexFinger: [0, 5, 6, 7, 8],
          middleFinger: [0, 9, 10, 11, 12],
          ringFinger: [0, 13, 14, 15, 16],
          pinky: [0, 17, 18, 19, 20],
        };
  
      video.width = window.innerWidth;
      video.height = window.innerHeight;
      canvas1.width=video.width;
      canvas1.height=video.height;
        let isFist;
      const predictions = await model.estimateHands(video);
        
      context.clearRect(0, 0, canvas1.width, canvas1.height);
  
      if (predictions.length > 0) {
          for (const hand of predictions) {
              const landmarks = hand.landmarks;

              
              context.fillStyle = 'white';
              context.strokeStyle = 'white';
              context.lineWidth = 2;
              for (let j = 0; j < Object.keys(fingerJoints).length; j++) {
                  let finger = Object.keys(fingerJoints)[j];
                  for (let k = 0; k < fingerJoints[finger].length - 1; k++) {
  
                    const firstJointIndex = fingerJoints[finger][k];
                    const secondJointIndex = fingerJoints[finger][k + 1];
  
                    context.beginPath();
                    context.moveTo(
                      landmarks[firstJointIndex][0],
                      landmarks[firstJointIndex][1]
                    );
                    context.lineTo(
                      landmarks[secondJointIndex][0],
                      landmarks[secondJointIndex][1]
                    );
                    context.stroke();
                    
                  }
                }
                for (let i = 0; i < landmarks.length; i++) {
                  const x = landmarks[i][0];
                  const y = landmarks[i][1];
                  context.beginPath();
                  context.arc(x, y, 3, 0, 3 * Math.PI);
                  context.fill();
                }
                
                    isFist = isFistGesture(landmarks);

                
              
          }
      }
      if (predictions.length > 0) {
        const hand = predictions[0]; 
        const indexFingerTip = hand.landmarks[8]; 
        const [x, y] = indexFingerTip;

        if (x+100 < previousX) {
            motionlock=1;
            if (selectedPlanet === 'mars') {
                selectedPlanet = 'earth';
                isEarthHovered=1;
                isMarsHovered=0;
                isMoonHovered=0;
                scaleAndRotatePlanet(earthSphere,isEarthHovered)
            } else if (selectedPlanet === 'earth') {
                selectedPlanet = 'moon';
                isEarthHovered=0;
                isMarsHovered=0;
                isMoonHovered=1;
                scaleAndRotatePlanet(moonSphere,isMoonHovered)
            }
            else{
                selectedPlanet = 'mars';
                isEarthHovered=0;
                isMarsHovered=1;
                isMoonHovered=0;
                scaleAndRotatePlanet(marsSphere,isMarsHovered)
            }

            setTimeout(() => {
                previousX = x;
            }, 2000);
        }
        previousX = x;
    }
    

        if (isFist) {
            const currentTime = Date.now();

            if (currentTime - lastTabOpenTime > 5000) { 
                console.log('Fist detected - Proceeding');

                if (selectedPlanet === 'earth') {
                    window.open('/pages/iss_experience.html', '_blank');
                } else if (selectedPlanet === 'moon') {
                    window.open('/pages/moon_experience.html', '_blank');
                } else if (selectedPlanet === 'mars') {
                    window.open('/pages/mars_experience.html', '_blank');
                }

                lastTabOpenTime = currentTime;
            }
        }
    
  
      requestAnimationFrame(() => detectHands(video, model));
  }

  function isFistGesture(landmarks) {
  
    const palmCenter = landmarks[0];
    const fingertipDistances = landmarks
        .slice(1)
        .map(fingertip => calculateDistance(fingertip, palmCenter));
   
    const averageDistance = fingertipDistances.reduce((a, b) => a + b, 0) / fingertipDistances.length;

    const fistThreshold = 50;
    if(averageDistance < fistThreshold && landmarks[0][2]<5)
    return true
    else
    return false;
}

function calculateDistance(point1, point2) {
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
}


  
  async function run() {
    try {
        const video = await setupCamera();
        const handposeModel = await loadHandposeModel();
        await detectHands(video, handposeModel);
    } catch (error) {
        console.error('Error loading camera or handpose model:', error);
    }
  }
  
  run();
