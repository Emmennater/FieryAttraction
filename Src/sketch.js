// Add random events
// - gravity storm (sucking in)
// - meteor shower

function preload() {
  // Sprites
  rocketSprite = loadImage("Assets/fighterjet2.png");
  enemySprite = loadImage("Assets/enemyjet.png");
  sunSprite = loadImage("Assets/hotsun.jpg");
  asteroidSprite = loadImage("Assets/asteroid-sprite.png");
  fuelAsteroidSprite = loadImage("Assets/fuel-asteroid-sprite.png");
  healthAsteroidSprite = loadImage("Assets/health-asteroid-sprite.png");
  ammoAsteroidSprite = loadImage("Assets/ammo-asteroid-sprite.png");
  explosionSprite = loadImage("Assets/explosion.gif");
  futureFont = loadFont("Assets/future-font.ttf");
  
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
  
  // Sprites
  explosionSprite.pause();
  // explosionSprite.play();
  // sunSprite = createImg("https://pbs.twimg.com/media/FCzptPDX0AM_XAb.jpg", "sunsprite");
  // spaceSprite = createImg("https://images.pexels.com/photos/957061/milky-way-starry-sky-night-sky-star-957061.jpeg?cs=srgb&dl=pexels-felix-mittermeier-957061.jpg&fm=jpg", "spacesprite");
  // scanLineSprite = createImg("https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/1f1d3db0-bb51-4da7-874b-fc4bda5f2395/dclwg5d-3249b800-65b3-4ad5-9a42-d0519ba70d4c.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzFmMWQzZGIwLWJiNTEtNGRhNy04NzRiLWZjNGJkYTVmMjM5NVwvZGNsd2c1ZC0zMjQ5YjgwMC02NWIzLTRhZDUtOWE0Mi1kMDUxOWJhNzBkNGMuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.YV3WyK5Vbd7sQRvEr2N7ufHdC9eH5fyMha45pOxNd80", "scansprite");
  
  
  // Sounds
  // initSounds();

  CANVAS = createCanvas(windowWidth, windowHeight);
  CTX = createGraphics(width, height);
  
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
  const dt = min(deltaTime / 1000, 1);
  scenes.runCurrentScene(dt, CTX);
  htmlSounds.runSounds(dt);
  clearPressed();
}

/*






















*/
