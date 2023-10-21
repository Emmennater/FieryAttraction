// Add random events
// - gravity storm (sucking in)
// - meteor shower
// - spin storm

function preload() {
  // Sprites
  futureFont = loadFont("Assets/future-font.ttf");
  rocketSprite = loadImage("Assets/fighterjet2.png");
  enemySprite = loadImage("Assets/enemyjet.png");
  homingEnemySprite = loadImage("Assets/homing-enemy-jet.png");
  speedEnemySprite = loadImage("Assets/speed-enemy-jet.png");
  megaEnemySprite = loadImage("Assets/mega-enemy-jet.png");
  sunSprite = loadImage("Assets/hotsun.png");
  asteroidSprite = loadImage("Assets/asteroid-sprite.png");
  speedAsteroidSprite = loadImage("Assets/speed-asteroid.png");
  blueAsteroidSprite = loadImage("Assets/blue-asteroid-2.gif");
  fuelAsteroidSprite = loadImage("Assets/fuel-asteroid-sprite.png");
  healthAsteroidSprite = loadImage("Assets/health-asteroid-sprite.png");
  ammoAsteroidSprite = loadImage("Assets/ammo-asteroid-sprite.png");
  explosionSprite = loadImage("Assets/explosion.gif");
  // spacebg = loadImage("Assets/redsky.jpg");
  
  // Sounds
  alarmSound = loadSound("Assets/alarm-loop.wav");
  // rocketSound = loadSound("Assets/rocket-sound-2.wav");
  // collisionSound = loadSound("Assets/collision.wav");
  // burningSound = loadSound("Assets/burning.mp3");
  // shootSound = loadSound("Assets/laser.wav");
  // hitSound = loadSound("Assets/laser-hit.wav");
}

function setup() {
  // Sounds
  soundTrack = document.getElementById("sound-track");
  titleScreenTrack = document.getElementById("title-screen-sound-track");
  rocketSound = document.getElementById("rocket-sound");
  collisionSound = document.getElementById("collision-sound");
  burningSound = document.getElementById("burning-sound");
  shootSound = document.getElementById("shoot-sound");
  hitSound = document.getElementById("hit-sound");
  explodeSound = document.getElementById("explode-sound");
  sirenSound = document.getElementById("siren-sound");
  explosionSprite.pause();
  initSounds();

  CANVAS = createCanvas(windowWidth, windowHeight);
  CTX = createGraphics(width, height);
  CTX2 = createGraphics(width, height);

  // Disable right click drop-down
  document.addEventListener('contextmenu', event => event.preventDefault());

  // Globals
  documentClicked = false;

  // Namespaces
  panzoom = new PanZoom();
  sun = new Sun();
  ship = new Ship(600, 600);
  stars = new Stars();
  hud = new HUD();
  scenes = new Scenes();
  sounds = new Sounds();
  htmlSounds = new HTMLSounds();
  
  // Objects
  asteroids = [];
  initAsteroids();
  
  // Scenes
  scenes.setup();
}

function draw() {
  background(0);
  const dt = min(deltaTime / 1000, 1);
  scenes.runCurrentScene(dt, CTX);
  htmlSounds.runSounds(dt);
  clearPressed();
}

/*






















*/
