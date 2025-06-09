// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Game extends Phaser.Scene {
  constructor() {
    super("game");
  }

  init() {
    this.score = 0;
  }

  preload() {
    this.load.tilemapTiledJSON("map", "public/assets/tilemap/map.json");
    this.load.image("tileset", "public/assets/texture.png");
    this.load.image("star", "public/assets/star.png");
    this.load.image("salida", "public/assets/salida.png");

    this.load.spritesheet("dude", "public/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    const map =this.make.tilemap({ key: "map" });

    const tileLayerNames = map.layers.map(l => l.name);
    const objectLayerNames = map.objects.map(o => o.name);

    const belowLayer = map.createLayer(tileLayerNames[0], map.addTilesetImage("tileset", "tileset"), 0, 0);
    this.platformLayer = map.createLayer(tileLayerNames[1], map.addTilesetImage("tileset", "tileset"), 0, 0);
    const objectsLayer = map.getObjectLayer(objectLayerNames[0]);

    const spawnPoint = objectsLayer.objects.find(obj => obj.name === "player" || obj.name ==="dude" || obj.type === "player");
    console.log("spawnPoint", spawnPoint);

    const salida = objectsLayer.objects.find(obj => obj.name === "salida" || obj.name ==="salida" || obj.type === "salida");
    console.log("salida", salida);

    //Posible borrado
    const playerX = spawnPoint ? spawnPoint.x : 0;
    const playerY = spawnPoint ? spawnPoint.y : 0;

    this.player = this.physics.add.sprite(playerX, playerY, "dude");
    this.player.setGravityY(0);
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.anims.create({
      key: "left",
      frames: [{ key: "dude", frame:0}],
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 0 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: [{ key: "dude", frame: 0 }],
      frameRate: 10,
      repeat: -1,
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.stars = this.physics.add.group();

objectsLayer.objects.forEach((objData) => {
  const { x = 0, y = 0, type } = objData;
  if (type === "star") {
    const star = this.stars.create(x, y, "star");
    star.setGravityY(0);
    star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    star.setCollideWorldBounds(true);
  }
});

if (this.platformLayer) {
  this.platformLayer.setCollisionByExclusion([-1]);
  this.physics.add.collider(this.player, this.platformLayer);
  this.physics.add.collider(this.stars, this.platformLayer);
}

    this.physics.add.collider(this.player, this.stars, this.collectStar, null, this);

    this.scoreText = this.add.text(8, 0,`Score: ${this.score}`, {
      fontFamily: "Bitstream Vera Sans Mono, monospace",
      fontbold: true,
      fontSize: "32px",
      fill: "#fff",
    });

    this.starsLeftText = this.add.text(8, 40, `Almas restantes: ${this.stars.countActive(true)}`, {
      fontFamily: "Bitstream Vera Sans Mono, monospace",
      fontSize: "28px",
      fill: "#ff0",
    });

    const salidaObj = objectsLayer.objects.find(obj => obj.name === "salida" || obj.type === "salida");
    if (salidaObj) {
      this.salida = this.physics.add.sprite(salidaObj.x, salidaObj.y, "salida");
      this.salida.setImmovable(true);
      this.salida.body.allowGravity = false;
      this.salida.setDepth(1); // Profundidad baja
    }

    this.player.setDepth(2); // Profundidad mayor, siempre encima de la salida

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player);
}

update() {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("turn");
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-160);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(160);
    } else {
      this.player.setVelocityY(0);
    }
    // Reiniciar solo cuando se presiona R una vez
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
    }

    this.starsLeftText.setText(`Almas restantes: ${this.stars.countActive(true)}`);
    this.starsLeftText.x = this.cameras.main.scrollX + 8;
    this.starsLeftText.y = this.cameras.main.scrollY + 40;
}

collectStar(player, star) {
    star.disableBody(true, true);

    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    // Si ya no quedan estrellas, ahora sí permite pasar por la salida
    if (this.stars.countActive(true) === 0) {
      this.physics.add.overlap(this.player, this.salida, this.llegarASalida, null, this);
      // Opcional: muestra un mensaje o animación indicando que la salida está activa
    }
  }

  llegarASalida(player, salida) {
  this.registry.set('score', this.score); // Guarda el score globalmente
  this.scene.start("game2");
}
}