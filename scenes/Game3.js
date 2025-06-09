export default class Game3 extends Phaser.Scene {
  constructor() {
    super("game3");
  }

  init() {
    this.score = this.registry.get('score') || 0;
  }

  preload() {
    this.load.tilemapTiledJSON("map3", "public/assets/tilemap/map3.json");
    this.load.image("tileset", "public/assets/texture.png");
    this.load.image("star", "public/assets/star.png");
    this.load.image("salida", "public/assets/salida.png");
    this.load.spritesheet("dude", "public/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    const map = this.make.tilemap({ key: "map3" });
    console.log("map3 cargado:", map);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const tileset = map.addTilesetImage("tileset", "tileset");

    const tileLayerNames = map.layers.map((l) => l.name);
    const objectLayerNames = map.objects.map((o) => o.name);

    const belowLayer = map.createLayer(tileLayerNames[0], tileset, 0, 0);
    this.platformLayer = map.createLayer(tileLayerNames[1], tileset, 0, 0);
    const objectsLayer = map.getObjectLayer(objectLayerNames[0]);

    // Spawn del jugador
    const spawnPoint = objectsLayer.objects.find(
      (obj) => obj.name === "player" || obj.type === "player"
    );
    const playerX = spawnPoint ? spawnPoint.x : 0;
    const playerY = spawnPoint ? spawnPoint.y : 0;

    this.player = this.physics.add.sprite(playerX, playerY, "dude");
    this.player.setGravityY(0);
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // Animaciones
    this.anims.create({
      key: "left",
      frames: [{ key: "dude", frame: 0 }],
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

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Colisiones
    this.platformLayer.setCollisionByExclusion([-1]);
    this.physics.add.collider(this.player, this.platformLayer);

    // Estrellas
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
    this.physics.add.collider(this.stars, this.platformLayer);
    this.physics.add.collider(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );

    // Texto de score
    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
      fontFamily: "Bitstream Vera Sans Mono, monospace",
      fontbold: true,
      fontSize: "32px",
      fill: "#fff",
    })
    .setScrollFactor(0)
    .setDepth(1000); // <-- Esto asegura que el texto esté encima de todo

    // Texto de estrellas restantes
    this.starsLeftText = this.add.text(16, 56, `Almas restantes: ${this.stars.countActive(true)}`, {
      fontFamily: "Bitstream Vera Sans Mono, monospace",
      fontSize: "28px",
      fill: "#ff0",
    })
    .setScrollFactor(0)
    .setDepth(1000);

    // Salida
    const salidaObj = objectsLayer.objects.find(
      (obj) => obj.name === "salida" || obj.type === "salida"
    );
    if (salidaObj) {
      this.salida = this.physics.add.sprite(salidaObj.x, salidaObj.y, "salida");
      this.salida.setImmovable(true);
      this.salida.body.allowGravity = false;
      this.salida.setDepth(1);
    }
    this.player.setDepth(2);

    // Ajusta los límites de la cámara al tamaño del mapa
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(3); // Ajusta el zoom según sea necesario

    // Opcional: limita el zoom si quieres
    // this.cameras.main.setZoom(1); // Puedes ajustar el valor si lo necesitas

    // Cámara UI
this.UICam = this.cameras.add(0, 0, this.sys.game.config.width, this.sys.game.config.height, false, true);
this.UICam.ignore([belowLayer, this.platformLayer, this.player, this.stars, this.salida]);

    console.log("Capas de tiles en map3:", map.layers.map((l) => l.name));
  }
  

  update() {
    if (this.scenePaused) {
      if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER))) {
        this.registry.set('score', 0); // Reinicia el score global
        this.scene.start("game"); // Vuelve al nivel 1 (ajusta el nombre si tu escena 1 es diferente)
      }
      return;
    }

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

    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
    }

    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey("N"))) {
  this.scene.start("game3");
  }
}

  collectStar(player, star) {
    star.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);
    this.starsLeftText.setText(`Almas restantes: ${this.stars.countActive(true)}`);
    if (this.stars.countActive(true) === 0) {
      this.physics.add.overlap(
        this.player,
        this.salida,
        this.llegarASalida,
        null,
        this
      );
    }
  }

  llegarASalida(player, salida) {
    // Muestra el puntaje total centrado en la cámara
    const cam = this.cameras.main;
    const centerX = cam.scrollX + cam.width / 2;
    const centerY = cam.scrollY + cam.height / 2;
    this.add
      .text(
        centerX,
        centerY,
        `¡Juego completado!\nPuntaje total: ${this.score}\nPresiona ENTER para reiniciar`,
        { fontSize: "12px", fill: "#0f0", align: "center" }
      )
      .setOrigin(0.5, 0.5)
      .setDepth(2000);

    this.scenePaused = true;
    this.physics.pause();
  }
}