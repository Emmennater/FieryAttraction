// Add random events
// - gravity storm (sucking in)
// - meteor shower
// - spin storm
// Fix collision algorithm for asteroids (done)

function preload() {
  // Sprites
  arialBlack = "Arial Black" // loadFont("Assets/Fonts/Arial Black.ttf");
  futureFont = loadFont("Assets/Fonts/future-font.ttf");
  rocketSprite = loadImage("Assets/fighterjet2.png");
  enemySprite = loadImage("Assets/enemyjet.png");
  blackEnemySprite = loadImage("Assets/black-enemy-jet.png");
  homingEnemySprite = loadImage("Assets/homing-enemy-jet.png");
  speedEnemySprite = loadImage("Assets/speed-enemy-jet.png");
  megaEnemySprite = loadImage("Assets/mega-enemy-jet.png");
  asteroidSprite = loadImage("Assets/asteroid-sprite.png");
  speedAsteroidSprite = loadImage("Assets/speed-asteroid.png");
  blueAsteroidSprite = loadImage("Assets/speed-asteroid.png");
  fuelAsteroidSprite = loadImage("Assets/fuel-asteroid-sprite.png");
  healthAsteroidSprite = loadImage("Assets/health-asteroid-sprite.png");
  antiHealthAsteroidSprite = loadImage("Assets/anti-health-asteroid-sprite.png");
  ammoAsteroidSprite = loadImage("Assets/ammo-asteroid-sprite.png");
  explosiveAsteroidSprite = loadImage("Assets/explosive-asteroid.png");``
  explosionSprite = loadImage("Assets/explosion.gif");
  aimArcSprite = loadImage("Assets/aim-arc.png");
  jetEnchantmentSprite = loadImage("Assets/jet-enchantment.png");
  solarFlairSprite = loadImage("Assets/solar-flair3.png");
  // spacebg = loadImage("Assets/redsky.jpg");
  
  // Festive
  festive = getItem("fiery-attraction-festive-state") ?? true;
  if (festive) {
    festive = !festive;
    document.getElementById("festive-button").click();
  } else loadTheme("default");

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
  resurrectionSound = document.getElementById("resurrection-sound");
  explosionSprite.pause();
  initSounds();

  CANVAS = createCanvas(windowWidth, windowHeight);
  CTX = createGraphics(width, height);
  CTX2 = createGraphics(width, height);
  updateCanvasSize();

  // Disable right click drop-down
  document.addEventListener('contextmenu', event => event.preventDefault());

  // Globals
  documentClicked = false;
  noSpawns = false;

  // Namespaces
  mobile = new MobileControls();
  panzoom = new PanZoom();
  system = new StarSystem();
  sun = system.stars[0];
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
  const dt = min(deltaTime / 1000, 32 / 1000);
  scenes.runCurrentScene(dt, CTX);
  htmlSounds.runSounds(dt);
  clearPressed();
}

function loadSprite(path, file) {
  return loadImage(path + file);
}

function getTheme() {
  return "thanksgiving";
}

function loadTheme(name) {
  const occasian = getTheme();
  const theme = name == "festive" ? occasian : "default";
  switch (theme) {
    case "christmas":
      sunSprite = loadImage("Assets/Festive/Christmas/hotsun.png");
      starSprite = loadImage("Assets/Festive/Christmas/star.webp");
      rocketSprite = loadImage("Assets/Festive/Christmas/rocket.png");
      bgCol = color(0);
      // bgCol = color(50, 110, 205);
      break;
    case "halloween":
      sunSprite = loadImage("Assets/Festive/Halloween/hotsun.png");
      enemySprite = loadImage("Assets/Festive/Halloween/enemyjet.png");
      homingEnemySprite = loadImage("Assets/Festive/Halloween/homing-enemy-jet.png");
      speedEnemySprite = loadImage("Assets/Festive/Halloween/speed-enemy-jet.png");
      megaEnemySprite = loadImage("Assets/Festive/Halloween/mega-enemy-jet.png");
      starSprite = null;
      bgCol = color(0);
      break;
    case "thanksgiving":
      sunSprite = loadImage("Assets/Festive/Halloween/hotsun.png");
      rocketSprite = loadImage("Assets/Festive/Christmas/rocket.png");
      starSprite = loadImage("Assets/Festive/Christmas/star.webp");
      bgCol = color(0);
      break;
    default:
      sunSprite = loadImage("Assets/hotsun.png");
      starSprite = null;
      bgCol = color(0);
      break;
  }
}

function toggleTheme() {
  festive = !festive;
  loadTheme(festive ? "festive" : "default");
  storeItem("fiery-attraction-festive-state", festive);
}

/*






















*/
