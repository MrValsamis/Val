// game Object ********************************************************
//*********************************************************************
const game = {
  loop() {
    game.cycle++; //tracks game cycles
    mech.cycle++; //tracks player cycles  //used to alow time to stop for everything, but the player
    if (game.clearNow) {
      game.clearNow = false;
      game.clearMap();
      level.start();
    }
    game.gravity();
    Engine.update(engine, game.delta);
    game.wipe();
    game.textLog();
    mech.keyMove();
    level.checkZones();
    level.checkQuery();
    mech.move();
    mech.look();
    game.fallChecks();
    ctx.save();
    game.camera();
    if (game.testing) {
      mech.draw();
      game.draw.wireFrame();
      game.draw.cons();
      game.draw.testing();
      game.drawCircle();
      ctx.restore();
      game.getCoords.out();
      game.testingOutput();
    } else {
      level.drawFillBGs();
      level.exit.draw();
      level.enter.draw();
      game.draw.powerUp();
      mobs.draw();
      game.draw.cons();
      game.draw.body();
      mobs.loop();
      mech.draw();
      mech.hold();
      level.drawFills();
      game.draw.drawMapPath();
      b.fire();
      b.bulletActions();
      mobs.healthBar();
      game.drawCircle();
      ctx.restore();
    }
    game.drawCursor();
  },
  mouse: {
    x: canvas.width / 2,
    y: canvas.height / 2
  },
  mouseInGame: {
    x: 0,
    y: 0
  },
  levelsCleared: 0,
  g: 0.001,
  dmgScale: null, //set in levels.setDifficulty
  accelScale: null, //set in levels.setDifficulty
  CDScale: null, //set in levels.setDifficulty
  lookFreqScale: null, //set in levels.setDifficulty
  onTitlePage: true,
  paused: false,
  testing: false, //testing mode: shows wireframe and some variables
  cycle: 0, //total cycles, 60 per second
  fpsCap: null, //limits frames per second to 144/2=72,  on most monitors the fps is capped at 60fps by the hardware
  fpsCapDefault: 72, //use to change fpsCap back to normal after a hit from a mob
  cyclePaused: 0,
  fallHeight: 3000, //below this y position the player dies
  lastTimeStamp: 0, //tracks time stamps for measuring delta
  delta: 1000 / 60, //speed of game engine //looks like it has to be 16 to match player input
  buttonCD: 0,
  isBodyDamage: true,
  isEasyMode: false,
  difficulty: null,
  // dropFPS(cap = 40, time = 15) {
  //   game.fpsCap = cap
  //   game.fpsInterval = 1000 / game.fpsCap;
  //   game.defaultFPSCycle = game.cycle + time
  //   const normalFPS = function () {
  //     if (game.defaultFPSCycle < game.cycle) {
  //       game.fpsCap = 72
  //       game.fpsInterval = 1000 / game.fpsCap;
  //     } else {
  //       requestAnimationFrame(normalFPS);
  //     }
  //   };
  //   requestAnimationFrame(normalFPS);
  // },
  drawCursor() {
    const size = 10;
    ctx.beginPath();
    ctx.moveTo(game.mouse.x - size, game.mouse.y);
    ctx.lineTo(game.mouse.x + size, game.mouse.y);
    ctx.moveTo(game.mouse.x, game.mouse.y - size);
    ctx.lineTo(game.mouse.x, game.mouse.y + size);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000"; //'rgba(0,0,0,0.4)'
    ctx.stroke(); // Draw it
  },
  drawList: [], //so you can draw a first frame of explosions.. I know this is bad
  drawTime: 8, //how long circles are drawn.  use to push into drawlist.time
  mobDmgColor: "rgba(255,0,0,0.7)", //used top push into drawList.color
  playerDmgColor: "rgba(0,0,0,0.7)", //used top push into drawList.color
  drawCircle() {
    //draws a circle for two cycles, used for showing damage mostly
    let i = this.drawList.length;
    while (i--) {
      ctx.beginPath(); //draw circle
      ctx.arc(this.drawList[i].x, this.drawList[i].y, this.drawList[i].radius, 0, 2 * Math.PI);
      ctx.fillStyle = this.drawList[i].color;
      ctx.fill();
      if (this.drawList[i].time) {
        //remove when timer runs out
        this.drawList[i].time--;
      } else {
        this.drawList.splice(i, 1);
      }
    }
  },
  lastLogTime: 0,
  lastLogTimeBig: 0,
  boldActiveGunHUD() {
    if (b.inventory.length > 0) {
      for (let i = 0, len = b.inventory.length; i < len; ++i) {
        // document.getElementById(b.inventory[i]).style.fontSize = "25px";
        document.getElementById(b.inventory[i]).style.opacity = "0.3";
      }
      // document.getElementById(b.activeGun).style.fontSize = "30px";
      if (document.getElementById(b.activeGun)) document.getElementById(b.activeGun).style.opacity = "1";
    }
  },
  updateGunHUD() {
    for (let i = 0, len = b.inventory.length; i < len; ++i) {
      document.getElementById(b.inventory[i]).innerHTML = b.guns[b.inventory[i]].name + " - " + b.guns[b.inventory[i]].ammo;
    }
  },
  makeGunHUD() {
    //remove all nodes
    const myNode = document.getElementById("guns");
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }
    //add nodes
    for (let i = 0, len = b.inventory.length; i < len; ++i) {
      const node = document.createElement("div");
      node.setAttribute("id", b.inventory[i]);
      let textnode = document.createTextNode(b.guns[b.inventory[i]].name + " - " + b.guns[b.inventory[i]].ammo);
      node.appendChild(textnode);
      document.getElementById("guns").appendChild(node);
    }
    game.boldActiveGunHUD();
  },
  updateModHUD() {
    let text = ""
    for (let i = 0, len = b.mods.length; i < len; i++) { //add mods
      if (b.mods[i].have) {
        if (text) text += "<br>" //add a new line, but not on the first line
        text += b.mods[i].name
      }
    }
    document.getElementById("mods").innerHTML = text
  },
  replaceTextLog: true,
  // <!-- <path d="M832.41,106.64 V323.55 H651.57 V256.64 c0-82.5,67.5-150,150-150 Z" fill="#789" stroke="none" />
  // <path d="M827,112 h30 a140,140,0,0,1,140,140 v68 h-167 z" fill="#7ce" stroke="none" /> -->
  SVGleftMouse: '<svg viewBox="750 0 200 765" class="mouse-icon" width="40px" height = "60px" stroke-linecap="round" stroke-linejoin="round" stroke-width="25px" stroke="#000" fill="none">  <path fill="#fff" stroke="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M832.41,106.64 V323.55 H651.57 V256.64 c0-82.5,67.5-150,150-150 Z" fill="#456" stroke="none" />  <path fill="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M657 317 h 340 h-170 v-207" />  <ellipse fill="#fff" cx="827.57" cy="218.64" rx="29" ry="68" />  </svg>',
  SVGrightMouse: '<svg viewBox="750 0 200 765" class="mouse-icon" width="40px" height = "60px" stroke-linecap="round" stroke-linejoin="round" stroke-width="25px" stroke="#000" fill="none">  <path fill="#fff" stroke="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M827,112 h30 a140,140,0,0,1,140,140 v68 h-167 z" fill="#0cf" stroke="none" />  <path fill="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M657 317 h 340 h-170 v-207" />  <ellipse fill="#fff" cx="827.57" cy="218.64" rx="29" ry="68" />  </svg>',
  makeTextLog(text, time = 180) {
    if (game.replaceTextLog) {
      document.getElementById("text-log").innerHTML = text;
      document.getElementById("text-log").style.opacity = 1;
      game.lastLogTime = mech.cycle + time;
    }
  },
  textLog() {
    if (game.lastLogTime && game.lastLogTime < mech.cycle) {
      game.lastLogTime = 0;
      game.replaceTextLog = true
      // document.getElementById("text-log").innerHTML = " ";
      document.getElementById("text-log").style.opacity = 0;
    }
  },
  nextGun() {
    if (b.inventory.length > 0) {
      b.inventoryGun++;
      if (b.inventoryGun > b.inventory.length - 1) b.inventoryGun = 0;
      game.switchGun();
    }
  },
  previousGun() {
    if (b.inventory.length > 0) {
      b.inventoryGun--;
      if (b.inventoryGun < 0) b.inventoryGun = b.inventory.length - 1;
      game.switchGun();
    }
  },
  switchGun() {
    if (b.modNoAmmo) b.modNoAmmo = 1 //this prevents hacking the mod by switching guns
    b.activeGun = b.inventory[b.inventoryGun];
    game.updateGunHUD();
    game.boldActiveGunHUD();
    // mech.drop();
  },
  // tips = [
  //   "You can throw blocks at dangerous speeds by holding the right mouse or spacebar.",
  //   "You can use your field to block damage. (right mouse or spacebar)",
  //   "Explosive weapons, like the grenade are good at clearing groups.",
  //   "Larger and faster bullets do more damage.",
  //   "You take more damage from colliding with larger baddies",
  //   "Holding large blocks slows down the player.",
  //   "holding blocks prevents the field energy from regenerating.",
  //   `There are ${mech.fieldUpgrades.length-1} possible field upgrades.`,
  //   `There are ${b.guns.length} different guns.`,
  //   "You keep field upgrades after you die.",
  //   "Unique level bosses always drop a field upgrade if you don't have one.",
  //   "You jump higher if you hold down the jump button.",
  //   "Crouching while firing makes bullets go faster, but slows the rate of fire.",
  // ]
  keyPress() {
    if (keys[189]) {
      // - key
      game.zoomScale /= 0.9;
      game.setZoom();
    } else if (keys[187]) {
      // = key
      game.zoomScale *= 0.9;
      game.setZoom();
    }

    //full screen toggle
    // if (keys[13]) {
    //   //enter key
    //   var doc = window.document;
    //   var docEl = doc.documentElement;

    //   var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    //   var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    //   if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    //     requestFullScreen.call(docEl);
    //   } else {
    //     cancelFullScreen.call(doc);
    //   }
    //   setupCanvas();
    // }


    if (keys[69]) {
      // e    swap to next active gun
      game.nextGun();
    } else if (keys[81]) {
      //q    swap to previous active gun
      game.previousGun();
    }

    if (keys[80]) {
      //p  for pause
      if (game.paused) {
        game.paused = false;
        requestAnimationFrame(cycle);
      } else {
        game.paused = true;
        game.replaceTextLog = true;
        game.makeTextLog("<h1>PAUSED</h1>", 1);
        // let text = "<h1>PAUSED</h1><br><div style='font-size: 85%;'>"
        // //output current mod, field, and gun info when paused
        // if (mech.fieldMode !== 0) text += "<br><p><strong style='font-size:130%;'>" + mech.fieldUpgrades[mech.fieldMode].name + "</strong><br>" + mech.fieldUpgrades[mech.fieldMode].description + "</p>"
        // if (b.mod !== null) text += "<br><p><strong style='font-size:130%;'>" + b.mods[b.mod].name + "</strong><br>" + b.mods[b.mod].description + "</p>"
        // if (b.activeGun !== null) text += "<br><p><strong style='font-size:130%;'>" + b.guns[b.activeGun].name + "</strong><br>" + b.guns[b.activeGun].description + "</p>"
        // text += "</div>"
        // game.makeTextLog(text, 1);
      }
    }

    //toggle testing mode
    if (keys[84]) {
      // 84 = t
      if (this.testing) {
        this.testing = false;
      } else {
        this.testing = true;
      }
    } else if (this.testing) {
      //only in testing mode

      if (keys[70]) { //cycle fields with F
        if (mech.fieldMode === mech.fieldUpgrades.length - 1) {
          mech.fieldUpgrades[0].effect()
        } else {
          mech.fieldUpgrades[mech.fieldMode + 1].effect()
        }
      }
      if (keys[71]) { // give all guns with G
        // b.giveGuns("all", 1000)
        powerUps.gun.effect()
      }
      if (keys[72]) { // power ups with H
        powerUps.spawn(game.mouseInGame.x, game.mouseInGame.y, "gun");
        powerUps.spawn(game.mouseInGame.x, game.mouseInGame.y, "ammo");
        powerUps.spawn(game.mouseInGame.x, game.mouseInGame.y, "field");
        powerUps.spawn(game.mouseInGame.x, game.mouseInGame.y, "heal");
        powerUps.spawn(game.mouseInGame.x, game.mouseInGame.y, "mod");
      }
      if (keys[89]) { //add all mods with y
        powerUps.mod.effect()
      }
      if (keys[82]) { // teleport to mouse with R
        Matter.Body.setPosition(player, this.mouseInGame);
        Matter.Body.setVelocity(player, {
          x: 0,
          y: 0
        });
      }
    }
  },
  zoom: null,
  zoomScale: 1000,
  setZoom(zoomScale = game.zoomScale) { //use in window resize in index.js
    game.zoomScale = zoomScale
    game.zoom = canvas.height / zoomScale; //sets starting zoom scale
  },
  zoomTransition(newZoomScale, step = 2) {
    const isBigger = (newZoomScale - game.zoomScale > 0) ? true : false;
    requestAnimationFrame(zLoop);
    const currentLevel = level.onLevel

    function zLoop() {
      if (currentLevel != level.onLevel) return //stop the zoom if player goes to a new level

      if (isBigger) {
        game.zoomScale += step
        if (game.zoomScale >= newZoomScale) {
          game.setZoom(newZoomScale);
          return
        }
      } else {
        game.zoomScale -= step
        if (game.zoomScale <= newZoomScale) {
          game.setZoom(newZoomScale);
          return
        }
      }

      game.setZoom();
      requestAnimationFrame(zLoop);
    }
  },
  camera() {
    ctx.translate(canvas.width2, canvas.height2); //center
    ctx.scale(game.zoom, game.zoom); //zoom in once centered
    ctx.translate(-canvas.width2 + mech.transX, -canvas.height2 + mech.transY); //translate
    //calculate in game mouse position by undoing the zoom and translations
    game.mouseInGame.x = (game.mouse.x - canvas.width2) / game.zoom + canvas.width2 - mech.transX;
    game.mouseInGame.y = (game.mouse.y - canvas.height2) / game.zoom + canvas.height2 - mech.transY;
  },
  zoomInFactor: 0,
  startZoomIn(time = 180) {
    game.zoom = 0;
    let count = 0;
    requestAnimationFrame(zLoop);

    function zLoop() {
      game.zoom += canvas.height / game.zoomScale / time;
      count++;
      if (count < time) {
        requestAnimationFrame(zLoop);
      } else {
        game.setZoom();
      }
    }
  },
  wipe() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ctx.fillStyle = "rgba(255,255,255,1)";
    // ctx.globalCompositeOperation = "difference";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ctx.globalCompositeOperation = "source-over";

    // ctx.globalAlpha = (mech.health < 0.7) ? (mech.health+0.3)*(mech.health+0.3) : 1
    // if (mech.health < 0.7) {
    // 	ctx.globalAlpha= 0.3 + mech.health
    // 	ctx.fillStyle = document.body.style.backgroundColor
    // 	ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 	ctx.globalAlpha=1;
    // } else {
    //     ctx.clearRect(0, 0, canvas.width, canvas.height);
    // }
    //ctx.fillStyle = "rgba(255,255,255," + (1 - Math.sqrt(player.speed)*0.1) + ")";
    //ctx.fillStyle = "rgba(255,255,255,0.4)";
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
  },
  gravity() {
    function addGravity(bodies, magnitude) {
      for (var i = 0; i < bodies.length; i++) {
        bodies[i].force.y += bodies[i].mass * magnitude;
      }
    }
    addGravity(powerUp, game.g);
    addGravity(body, game.g);
    player.force.y += player.mass * mech.gravity;
  },
  reset() { //run on first run, and each later run after you die
    b.inventory = []; //removes guns and ammo  
    for (let i = 0, len = b.guns.length; i < len; ++i) {
      b.guns[i].have = false;
      if (b.guns[i].ammo != Infinity) b.guns[i].ammo = 0;
    }
    b.activeGun = null;
    b.setModDefaults(); //remove mods
    game.updateModHUD();
    mech.fieldEnergyMax = 1
    mech.maxHealth = 1
    mech.fieldUpgrades[0].effect(); //set to default field
    game.paused = false;
    build.isShowingBuilds = false
    engine.timing.timeScale = 1;
    game.fpsCap = game.fpsCapDefault;
    game.makeGunHUD();
    mech.drop();
    mech.addHealth(1);
    mech.alive = true;
    level.onLevel = 0;
    level.levelsCleared = 0;

    //resetting difficulty
    game.dmgScale = 1;
    b.dmgScale = 0.7;
    game.accelScale = 1;
    game.lookFreqScale = 1;
    game.CDScale = 1;
    if (document.getElementById("difficulty-select").value === 'easy') {
      game.difficulty = 0;
      game.isEasyMode = true;
      level.difficultyDecrease(6);
    } else {
      game.difficulty = parseInt(document.getElementById("difficulty-select").value)
      level.difficultyIncrease(game.difficulty)
    }

    game.clearNow = true;
    document.getElementById("text-log").style.opacity = 0;
    document.getElementById("fade-out").style.opacity = 0;
    document.title = "n-gon";
    if (!mech.fieldMode) mech.fieldUpgrades[0].effect(); //reset to starting field?   or let them keep the field
  },
  firstRun: true,
  splashReturn() {
    game.onTitlePage = true;
    // document.getElementById('splash').onclick = 'run(this)';
    document.getElementById("splash").onclick = function () {
      game.startGame();
    };
    document.getElementById("controls").style.display = "inline";
    document.getElementById("build-button").style.display = "inline"
    isShowingBuilds = false
    document.getElementById("settings").style.display = "inline";
    document.getElementById("splash").style.display = "inline";
    document.getElementById("dmg").style.display = "none";
    document.getElementById("health-bg").style.display = "none";
    document.body.style.cursor = "auto";
  },
  fpsInterval: 0, //set in startGame
  then: null,
  startGame() {
    level.isBuildRun = false; //can get set back to true in buld.startBuildRun()
    game.onTitlePage = false;
    document.body.style.overflow = "hidden"
    document.getElementById("build-grid").style.display = "none"
    document.getElementById("controls").style.display = "none";
    document.getElementById("settings").style.display = "none";
    document.getElementById("build-button").style.display = "none";
    document.getElementById("splash").onclick = null; //removes the onclick effect so the function only runs once
    document.getElementById("splash").style.display = "none"; //hides the element that spawned the function
    document.getElementById("dmg").style.display = "inline";
    document.getElementById("health-bg").style.display = "inline";

    // window.onmousedown = function (e) {
    //   //mouse up event in set in index.js

    //   // game.mouseDown = true;
    //   if (e.which === 3) {
    //     game.mouseDownRight = true;
    //   } else {
    //     game.mouseDown = true;
    //   }
    //   // keep this disabled unless building maps
    //   // if (!game.mouseDown){
    //   // 	game.getCoords.pos1.x = Math.round(game.mouseInGame.x / 25) * 25;
    //   // 	game.getCoords.pos1.y = Math.round(game.mouseInGame.y / 25) * 25;
    //   // }

    //   // mech.throw();
    // };

    document.body.style.cursor = "none";
    if (this.firstRun) {
      mech.spawn(); //spawns the player
      b.setModDefaults(); //doesn't run on reset so that gun mods carry over to new runs
      level.levels = shuffle(level.levels); //shuffles order of maps
      level.levels.unshift("bosses"); //add bosses level to the end of the randomized levels list
    }
    game.reset();
    game.firstRun = false;


    //setup FPS cap
    game.fpsInterval = 1000 / game.fpsCap;
    game.then = Date.now();
    requestAnimationFrame(cycle); //starts game loop
  },
  clearNow: false,
  clearMap() {
    //if player is holding something this remembers it before it gets deleted
    let holdTarget;
    if (mech.holdingTarget) {
      holdTarget = mech.holdingTarget;
    }
    mech.fireCDcycle = 0
    mech.drop();
    level.fill = [];
    level.fillBG = [];
    level.zones = [];
    level.queryList = [];
    this.drawList = [];

    function removeAll(array) {
      for (let i = 0; i < array.length; ++i) Matter.World.remove(engine.world, array[i]);
    }
    removeAll(map);
    map = [];
    removeAll(body);
    body = [];
    removeAll(mob);
    mob = [];
    removeAll(powerUp);
    powerUp = [];
    removeAll(cons);
    cons = [];
    removeAll(consBB);
    consBB = [];
    removeAll(bullet);
    bullet = [];
    // if player was holding something this makes a new copy to hold
    if (holdTarget) {
      len = body.length;
      body[len] = Matter.Bodies.fromVertices(0, 0, holdTarget.vertices, {
        friction: holdTarget.friction,
        frictionAir: holdTarget.frictionAir,
        frictionStatic: holdTarget.frictionStatic
      });
      mech.holdingTarget = body[len];
    }
  },
  getCoords: {
    //used when building maps, outputs a draw rect command to console, only works in testing mode
    pos1: {
      x: 0,
      y: 0
    },
    pos2: {
      x: 0,
      y: 0
    },
    out() {
      if (keys[49]) {
        this.pos1.x = Math.round(game.mouseInGame.x / 25) * 25;
        this.pos1.y = Math.round(game.mouseInGame.y / 25) * 25;
      }
      if (keys[50]) {
        //press 1 in the top left; press 2 in the bottom right;copy command from console
        this.pos2.x = Math.round(game.mouseInGame.x / 25) * 25;
        this.pos2.y = Math.round(game.mouseInGame.y / 25) * 25;
        window.getSelection().removeAllRanges();
        var range = document.createRange();
        range.selectNode(document.getElementById("test"));
        window.getSelection().addRange(range);
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
        console.log(`spawn.mapRect(${this.pos1.x}, ${this.pos1.y}, ${this.pos2.x - this.pos1.x}, ${this.pos2.y - this.pos1.y}); //`);
      }
    }
  },
  fallChecks() {
    // if 4000px deep
    if (mech.pos.y > game.fallHeight) {
      mech.death();
      // if (b.modNonEuclidean) {
      //   Matter.Body.setPosition(player, {
      //     x: player.position.x,
      //     y: player.position.y - 12000
      //   });
      //   Matter.Body.setVelocity(player, {
      //     x: player.velocity.x,
      //     y: player.velocity.y * 0
      //   });

      //   mech.pos.x = player.position.x;
      //   mech.pos.y = playerBody.position.y - mech.yOff;

      //   //smoothed mouse look translations
      //   const scale = 10;
      //   mech.transSmoothX = canvas.width2 - mech.pos.x - (game.mouse.x - canvas.width2) * scale;
      //   mech.transSmoothY = canvas.height2 - mech.pos.y - (game.mouse.y - canvas.height2) * scale;

      //   mech.transX = mech.transSmoothX
      //   mech.transY = mech.transSmoothY

      // } else {
      // mech.death();
      // }
    }

    if (!(mech.cycle % 420)) {
      fallCheck = function (who) {
        let i = who.length;
        while (i--) {
          if (who[i].position.y > game.fallHeight) {
            Matter.World.remove(engine.world, who[i]);
            who.splice(i, 1);
          }
        }
      };
      fallCheck(mob);
      fallCheck(body);
      fallCheck(powerUp);
    }
  },
  testingOutput() {
    ctx.textAlign = "right";
    ctx.fillStyle = "#000";
    let line = 140;
    const x = canvas.width - 5;
    ctx.fillText("T: exit testing mode", x, line);
    line += 20;
    ctx.fillText("Y: give all mods", x, line);
    line += 20;
    ctx.fillText("R: teleport to mouse", x, line);
    line += 20;
    ctx.fillText("F: cycle field", x, line);
    line += 20;
    ctx.fillText("G: give all guns", x, line);
    line += 20;
    ctx.fillText("H: spawn power ups", x, line);
    line += 30;

    ctx.fillText("cycle: " + game.cycle, x, line);
    line += 20;
    ctx.fillText("player cycle: " + mech.cycle, x, line);
    line += 20;
    ctx.fillText("x: " + player.position.x.toFixed(0), x, line);
    line += 20;
    ctx.fillText("y: " + player.position.y.toFixed(0), x, line);
    line += 20;
    ctx.fillText("Vx: " + mech.Vx.toFixed(2), x, line);
    line += 20;
    ctx.fillText("Vy: " + mech.Vy.toFixed(2), x, line);
    line += 20;
    ctx.fillText("Fx: " + player.force.x.toFixed(3), x, line);
    line += 20;
    ctx.fillText("Fy: " + player.force.y.toFixed(3), x, line);
    line += 20;
    ctx.fillText("yOff: " + mech.yOff.toFixed(1), x, line);
    line += 20;
    ctx.fillText("mass: " + player.mass.toFixed(1), x, line);
    line += 20;
    ctx.fillText("onGround: " + mech.onGround, x, line);
    line += 20;
    ctx.fillText("crouch: " + mech.crouch, x, line);
    line += 20;
    ctx.fillText("isHeadClear: " + mech.isHeadClear, x, line);
    line += 20;
    ctx.fillText("frictionAir: " + player.frictionAir.toFixed(3), x, line);
    line += 20;
    ctx.fillText("stepSize: " + mech.stepSize.toFixed(2), x, line);
    line += 20;
    ctx.fillText("zoom: " + this.zoom.toFixed(4), x, line);
    line += 20;
    ctx.textAlign = "center";
    ctx.fillText(`(${this.mouseInGame.x.toFixed(1)}, ${this.mouseInGame.y.toFixed(1)})`, this.mouse.x, this.mouse.y - 20);
  },
  draw: {
    powerUp() {
      // draw power up
      // ctx.globalAlpha = 0.4 * Math.sin(mech.cycle * 0.15) + 0.6;
      // for (let i = 0, len = powerUp.length; i < len; ++i) {
      //   let vertices = powerUp[i].vertices;
      //   ctx.beginPath();
      //   ctx.moveTo(vertices[0].x, vertices[0].y);
      //   for (let j = 1; j < vertices.length; j += 1) {
      //     ctx.lineTo(vertices[j].x, vertices[j].y);
      //   }
      //   ctx.lineTo(vertices[0].x, vertices[0].y);
      //   ctx.fillStyle = powerUp[i].color;
      //   ctx.fill();
      // }
      // ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.4 * Math.sin(mech.cycle * 0.15) + 0.6;
      for (let i = 0, len = powerUp.length; i < len; ++i) {
        ctx.beginPath();
        ctx.arc(powerUp[i].position.x, powerUp[i].position.y, powerUp[i].size, 0, 2 * Math.PI);
        ctx.fillStyle = powerUp[i].color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    // map: function() {
    //     ctx.beginPath();
    //     for (let i = 0, len = map.length; i < len; ++i) {
    //         let vertices = map[i].vertices;
    //         ctx.moveTo(vertices[0].x, vertices[0].y);
    //         for (let j = 1; j < vertices.length; j += 1) {
    //             ctx.lineTo(vertices[j].x, vertices[j].y);
    //         }
    //         ctx.lineTo(vertices[0].x, vertices[0].y);
    //     }
    //     ctx.fillStyle = "#444";
    //     ctx.fill();
    // },
    mapPath: null, //holds the path for the map to speed up drawing
    setPaths() {
      //runs at each new level to store the path for the map since the map doesn't change
      this.mapPath = new Path2D();
      for (let i = 0, len = map.length; i < len; ++i) {
        let vertices = map[i].vertices;
        this.mapPath.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j += 1) {
          this.mapPath.lineTo(vertices[j].x, vertices[j].y);
        }
        this.mapPath.lineTo(vertices[0].x, vertices[0].y);
      }
    },
    mapFill: "#444",
    bodyFill: "rgba(140,140,140,0.85)", //"#999",
    bodyStroke: "#222",
    drawMapPath() {
      ctx.fillStyle = this.mapFill;
      ctx.fill(this.mapPath);
    },
    // seeEdges() {
    //   const eye = {
    //     x: mech.pos.x + 20 * Math.cos(mech.angle),
    //     y: mech.pos.y + 20 * Math.sin(mech.angle)
    //   };
    //   //find all vertex nodes in range and in LOS
    //   findNodes = function (domain, center) {
    //     let nodes = [];
    //     for (let i = 0; i < domain.length; ++i) {
    //       let vertices = domain[i].vertices;

    //       for (let j = 0, len = vertices.length; j < len; j++) {
    //         //calculate distance to player
    //         const dx = vertices[j].x - center.x;
    //         const dy = vertices[j].y - center.y;
    //         if (dx * dx + dy * dy < 800 * 800 && Matter.Query.ray(domain, center, vertices[j]).length === 0) {
    //           nodes.push(vertices[j]);
    //         }
    //       }
    //     }
    //     return nodes;
    //   };
    //   let nodes = findNodes(map, eye);
    //   //sort node list by angle to player
    //   nodes.sort(function (a, b) {
    //     //sub artan2 from player loc
    //     const dx = a.x - eye.x;
    //     const dy = a.y - eye.y;
    //     return Math.atan2(dy, dx) - Math.atan2(dy, dx);
    //   });
    //   //draw nodes
    //   ctx.lineWidth = 2;
    //   ctx.strokeStyle = "#000";
    //   ctx.beginPath();
    //   for (let i = 0; i < nodes.length; ++i) {
    //     ctx.lineTo(nodes[i].x, nodes[i].y);
    //   }
    //   ctx.stroke();
    // },
    // see() {
    //   const vertexCollision = function (
    //     v1,
    //     v1End,
    //     domain,
    //     best = {
    //       x: null,
    //       y: null,
    //       dist2: Infinity,
    //       who: null,
    //       v1: null,
    //       v2: null
    //     }
    //   ) {
    //     for (let i = 0; i < domain.length; ++i) {
    //       let vertices = domain[i].vertices;
    //       const len = vertices.length - 1;
    //       for (let j = 0; j < len; j++) {
    //         results = game.checkLineIntersection(v1, v1End, vertices[j], vertices[j + 1]);
    //         if (results.onLine1 && results.onLine2) {
    //           const dx = v1.x - results.x;
    //           const dy = v1.y - results.y;
    //           const dist2 = dx * dx + dy * dy;
    //           if (dist2 < best.dist2 && (!domain[i].mob || domain[i].alive)) {
    //             best = {
    //               x: results.x,
    //               y: results.y,
    //               dist2: dist2,
    //               who: domain[i],
    //               v1: vertices[j],
    //               v2: vertices[j + 1]
    //             };
    //           }
    //         }
    //       }
    //       results = game.checkLineIntersection(v1, v1End, vertices[0], vertices[len]);
    //       if (results.onLine1 && results.onLine2) {
    //         const dx = v1.x - results.x;
    //         const dy = v1.y - results.y;
    //         const dist2 = dx * dx + dy * dy;
    //         if (dist2 < best.dist2 && (!domain[i].mob || domain[i].alive)) {
    //           best = {
    //             x: results.x,
    //             y: results.y,
    //             dist2: dist2,
    //             who: domain[i],
    //             v1: vertices[0],
    //             v2: vertices[len]
    //           };
    //         }
    //       }
    //     }
    //     return best;
    //   };
    //   const range = 3000;
    //   ctx.beginPath();
    //   for (let i = 0; i < Math.PI * 2; i += Math.PI / 2 / 100) {
    //     const cosAngle = Math.cos(mech.angle + i);
    //     const sinAngle = Math.sin(mech.angle + i);

    //     const start = {
    //       x: mech.pos.x + 20 * cosAngle,
    //       y: mech.pos.y + 20 * sinAngle
    //     };
    //     const end = {
    //       x: mech.pos.x + range * cosAngle,
    //       y: mech.pos.y + range * sinAngle
    //     };
    //     let result = vertexCollision(start, end, map);
    //     result = vertexCollision(start, end, body, result);
    //     result = vertexCollision(start, end, mob, result);

    //     if (result.dist2 < range * range) {
    //       // ctx.arc(result.x, result.y, 2, 0, 2 * Math.PI);
    //       ctx.lineTo(result.x, result.y);
    //     } else {
    //       // ctx.arc(end.x, end.y, 2, 0, 2 * Math.PI);
    //       ctx.lineTo(end.x, end.y);
    //     }
    //   }
    //   // ctx.lineWidth = 1;
    //   // ctx.strokeStyle = "#000";
    //   // ctx.stroke();
    //   ctx.fillStyle = "rgba(0,0,0,0.3)";
    //   ctx.fillStyle = "#fff";
    //   ctx.fill();
    //   ctx.clip();
    // },
    body() {
      ctx.beginPath();
      for (let i = 0, len = body.length; i < len; ++i) {
        let vertices = body[i].vertices;
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j++) {
          ctx.lineTo(vertices[j].x, vertices[j].y);
        }
        ctx.lineTo(vertices[0].x, vertices[0].y);
      }
      ctx.lineWidth = 2;
      ctx.fillStyle = this.bodyFill;
      ctx.fill();
      ctx.strokeStyle = this.bodyStroke;
      ctx.stroke();
    },
    cons() {
      ctx.beginPath();
      for (let i = 0, len = cons.length; i < len; ++i) {
        ctx.moveTo(cons[i].pointA.x, cons[i].pointA.y);
        ctx.lineTo(cons[i].bodyB.position.x, cons[i].bodyB.position.y);
      }
      for (let i = 0, len = consBB.length; i < len; ++i) {
        ctx.moveTo(consBB[i].bodyA.position.x, consBB[i].bodyA.position.y);
        ctx.lineTo(consBB[i].bodyB.position.x, consBB[i].bodyB.position.y);
      }
      ctx.lineWidth = 2;
      // ctx.strokeStyle = "#999";
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.stroke();
    },
    wireFrame() {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#999";
      const bodies = Composite.allBodies(engine.world);
      ctx.beginPath();
      for (let i = 0; i < bodies.length; ++i) {
        //ctx.fillText(bodies[i].id,bodies[i].position.x,bodies[i].position.y);  //shows the id of every body
        let vertices = bodies[i].vertices;
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j += 1) {
          ctx.lineTo(vertices[j].x, vertices[j].y);
        }
        ctx.lineTo(vertices[0].x, vertices[0].y);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#000";
      ctx.stroke();
    },
    testing() {
      //zones
      ctx.beginPath();
      for (let i = 0, len = level.zones.length; i < len; ++i) {
        ctx.rect(level.zones[i].x1, level.zones[i].y1 + 70, level.zones[i].x2 - level.zones[i].x1, level.zones[i].y2 - level.zones[i].y1);
      }
      ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
      ctx.fill();
      //query zones
      ctx.beginPath();
      for (let i = 0, len = level.queryList.length; i < len; ++i) {
        ctx.rect(
          level.queryList[i].bounds.max.x,
          level.queryList[i].bounds.max.y,
          level.queryList[i].bounds.min.x - level.queryList[i].bounds.max.x,
          level.queryList[i].bounds.min.y - level.queryList[i].bounds.max.y
        );
      }
      ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
      ctx.fill();
      //jump
      ctx.beginPath();
      let bodyDraw = jumpSensor.vertices;
      ctx.moveTo(bodyDraw[0].x, bodyDraw[0].y);
      for (let j = 1; j < bodyDraw.length; ++j) {
        ctx.lineTo(bodyDraw[j].x, bodyDraw[j].y);
      }
      ctx.lineTo(bodyDraw[0].x, bodyDraw[0].y);
      ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.stroke();
      //main body
      ctx.beginPath();
      bodyDraw = playerBody.vertices;
      ctx.moveTo(bodyDraw[0].x, bodyDraw[0].y);
      for (let j = 1; j < bodyDraw.length; ++j) {
        ctx.lineTo(bodyDraw[j].x, bodyDraw[j].y);
      }
      ctx.lineTo(bodyDraw[0].x, bodyDraw[0].y);
      ctx.fillStyle = "rgba(0, 255, 255, 0.3)";
      ctx.fill();
      ctx.stroke();
      //head
      ctx.beginPath();
      bodyDraw = playerHead.vertices;
      ctx.moveTo(bodyDraw[0].x, bodyDraw[0].y);
      for (let j = 1; j < bodyDraw.length; ++j) {
        ctx.lineTo(bodyDraw[j].x, bodyDraw[j].y);
      }
      ctx.lineTo(bodyDraw[0].x, bodyDraw[0].y);
      ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
      ctx.fill();
      ctx.stroke();
      //head sensor
      ctx.beginPath();
      bodyDraw = headSensor.vertices;
      ctx.moveTo(bodyDraw[0].x, bodyDraw[0].y);
      for (let j = 1; j < bodyDraw.length; ++j) {
        ctx.lineTo(bodyDraw[j].x, bodyDraw[j].y);
      }
      ctx.lineTo(bodyDraw[0].x, bodyDraw[0].y);
      ctx.fillStyle = "rgba(0, 0, 255, 0.3)";
      ctx.fill();
      ctx.stroke();
    }
  },
  checkLineIntersection(v1, v1End, v2, v2End) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    let denominator, a, b, numerator1, numerator2;
    let result = {
      x: null,
      y: null,
      onLine1: false,
      onLine2: false
    };
    denominator = (v2End.y - v2.y) * (v1End.x - v1.x) - (v2End.x - v2.x) * (v1End.y - v1.y);
    if (denominator == 0) {
      return result;
    }
    a = v1.y - v2.y;
    b = v1.x - v2.x;
    numerator1 = (v2End.x - v2.x) * a - (v2End.y - v2.y) * b;
    numerator2 = (v1End.x - v1.x) * a - (v1End.y - v1.y) * b;
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = v1.x + a * (v1End.x - v1.x);
    result.y = v1.y + a * (v1End.y - v1.y);
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) result.onLine1 = true;
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) result.onLine2 = true;
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
  },
  //was used in level design
  buildingUp(e) {
    if (game.mouseDown) {
      game.getCoords.pos2.x = Math.round(game.mouseInGame.x / 25) * 25;
      game.getCoords.pos2.y = Math.round(game.mouseInGame.y / 25) * 25;
      let out;

      //body rect mode
      out = `spawn.mapRect(${game.getCoords.pos1.x}, ${game.getCoords.pos1.y}, ${game.getCoords.pos2.x - game.getCoords.pos1.x}, ${game.getCoords.pos2.y -
        game.getCoords.pos1.y});`;

      //mob spawn
      //out = `spawn.randomMob(${game.getCoords.pos1.x}, ${game.getCoords.pos1.y}, 0.3);`

      //draw foreground
      //out = `level.fill.push({ x: ${game.getCoords.pos1.x}, y: ${game.getCoords.pos1.y}, width: ${game.getCoords.pos2.x-game.getCoords.pos1.x}, height: ${game.getCoords.pos2.y-game.getCoords.pos1.y}, color: "rgba(0,0,0,0.1)"});`;

      //draw background fill
      //out = `level.fillBG.push({ x: ${game.getCoords.pos1.x}, y: ${game.getCoords.pos1.y}, width: ${game.getCoords.pos2.x-game.getCoords.pos1.x}, height: ${game.getCoords.pos2.y-game.getCoords.pos1.y}, color: "#ccc"});`;

      //svg mode
      //out = 'rect x="'+game.getCoords.pos1.x+'" y="'+ game.getCoords.pos1.y+'" width="'+(game.getCoords.pos2.x-game.getCoords.pos1.x)+'" height="'+(game.getCoords.pos2.y-game.getCoords.pos1.y)+'"';

      console.log(out);
      // document.getElementById("copy-this").innerHTML = out
      //
      // window.getSelection().removeAllRanges();
      // var range = document.createRange();
      // range.selectNode(document.getElementById('copy-this'));
      // window.getSelection().addRange(range);
      // document.execCommand('copy')
      // window.getSelection().removeAllRanges();
    }
  }
};