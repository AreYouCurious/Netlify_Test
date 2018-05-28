/*
var appColor = 0xaaaaaa;
var app = new PIXI.Application(800, 800, { backgroundColor: appColor });
document.getElementById("allo").appendChild(app.view);
//document.body.appendChild(app.view);

var grid = new Grid();
grid.Initiate();
app.ticker.add(Update);
*/


function CheckForEdgeCollisionBis(edge) {
    var rpx = edge.firstNode.x;
    var rpy = edge.firstNode.y;
    var rdx = Math.cos(edge.firstNode.angle + Math.PI * 2 / 3);
    var rdy = -Math.sin(edge.firstNode.angle + Math.PI * 2 / 3);

    var spx = player.x;
    var spy = player.y;
    var sdx = Math.cos(player.angle);
    var sdy = -Math.sin(player.angle);

    var T2 = (rdy * (rpx - spx) + rdx * (spy - rpy)) / (rdy * sdx - rdx * sdy);
    var T1 = (spx + sdx * T2 - rpx) / rdx;

    console.log();

    if (T1 > 0 && T2 > 0 && T2 < 1)
        console.log("YAY !");
    else
        console.log(rdx / rdy);
};

var canvasArea = {

    width: 600,
    height: 600,
    canvas: document.createElement("canvas"),
    interval: 20,

    Initiate: function () {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        document.getElementById("allo").appendChild(this.canvas);
        this.context = this.canvas.getContext("2d");

        setInterval(Update, this.interval);
    },

    Update: function () {
        this.context = this.canvas.getContext("2d");
    }
};

canvasArea.Initiate();
var grid = new Grid();


// ################################################################################################################

// node
function Node() {
    this.spd = 1;
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.restDuration = 60;
    this.restTimer = 20;
    this.deathDuration = 120;
    this.deathTimer = -1;
    this.color = 0xff0000;
    this.currentGraphics = null;
    this.radius = 16;

    this.Place = function (newX, newY, newAngle) {
        this.x = newX;
        this.y = newY;
        this.angle = newAngle;
    };

    this.DrawBis = function () {
        ctx = canvasArea.context;

        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(this.x, this.y, this.radius, 0, 360);
        ctx.fill();
    };
    this.Draw = function () {
        var graphics = new PIXI.Graphics();

        graphics.lineStyle(0);
        graphics.beginFill(this.color);
        graphics.drawCircle(this.x, this.y, 16);
        graphics.endFill();

        app.stage.addChild(graphics);
        this.currentGraphics = graphics;
    };
    this.Clear = function () {
        app.stage.removeChild(this.currentGraphics);
    };

    this.MoveTowardGridCenter = function (delta) {
        this.x -= this.spd * Math.cos(this.angle) * delta;
        this.y += this.spd * Math.sin(this.angle) * delta;
    };
    this.Update = function (delta) {
        if (this.restTimer > 0)
            this.restTimer--;
        else {
            this.MoveTowardGridCenter(delta);
        }
    };

    this.isTouchedEffect = function () {
        if (deathTimer > 0) {
            this.restTimer = this.restDuration;
            this.deathTimer = this.deathDuration;
        }
    };
}

// edge
function Edge(node1, node2) {
    this.firstNode = node1;
    this.secondNode = node2;
    this.color = 0xff00ff;
    this.currentGraphics = null;

    this.DrawBis = function () {
        var ctx = canvasArea.context;

        ctx.beginPath();
        ctx.moveTo(this.firstNode.x, this.firstNode.y);
        ctx.lineTo(this.secondNode.x, this.secondNode.y);
        ctx.stroke();
    },
        this.Draw = function () {
            var graphics = new PIXI.Graphics();

            graphics.lineStyle(2, this.color);
            graphics.beginFill(this.color);
            graphics.moveTo(this.secondNode.x, this.secondNode.y);
            graphics.lineTo(this.firstNode.x, this.firstNode.y);
            graphics.endFill();

            app.stage.addChild(graphics);
            this.currentGraphics = graphics;
        };
    this.Clear = function () {
        app.stage.removeChild(this.currentGraphics);
    };
}

// player's cursor
var player = {
    spd: 1,
    x: grid.centerX,
    y: grid.centerY,
    inputs: [false, false, false, false],
    currentGraphics: null,
    color: 0x000000,
    radius: 16,

    Initiate: function () {
        window.addEventListener("keydown", function (e) { if (true || e.keyCode <= 40 && e.keyCode >= 37) player.inputs[e.keyCode - 37] = true; });
        window.addEventListener("keyup", function (e) { if (e.keyCode <= 40 && e.keyCode >= 37) player.inputs[e.keyCode - 37] = false; });
    },

    ResetInputs: function () {
        for (var i = 0; i < 4; i++)
            player.inputs[i] = false;
    },

    Update: function (delta) {
        player.KeysMotion(delta);
    },

    Move: function (dx, dy) {
        player.x += dx;
        player.y += dy;
    },
    KeysMotion: function (delta) {
        if (player.inputs[0]) // 37 is left
            player.Move(-player.spd * delta, 0);
        if (player.inputs[1]) // 38 is up
            player.Move(0, -player.spd * delta);
        if (player.inputs[2]) // 39 is right
            player.Move(player.spd * delta, 0);
        if (player.inputs[3]) // 40 is down
            player.Move(0, +player.spd * delta);
    },

    DrawBis: function () {
        ctx = canvasArea.context;

        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(this.x, this.y, this.radius, 0, 360);
        ctx.fill();
    },
    Draw: function () {
        var graphics = new PIXI.Graphics();

        graphics.lineStyle(0);
        graphics.beginFill(player.color);
        graphics.drawCircle(player.x, player.y, 16);
        graphics.endFill();

        app.stage.addChild(graphics);
        player.currentGraphics = graphics;
    },
    Clear: function () {
        app.stage.removeChild(player.currentGraphics);
    }
};

// grid
function Grid() {
    this.centerX = canvasArea.width / 2;//app.view.width / 2;
    this.centerY = canvasArea.height / 2;//app.view.height / 2;
    this.nodes = [];
    this.edges = [];
    this.radius = 160;
    this.initialNodeNumber = 6;
    this.nodeBackgroundGraphics = [];

    this.Initiate = function () {

        // initiate the nodes
        var angleBetweenEachNode = 2 * Math.PI / this.initialNodeNumber;

        for (var i = 0; i < this.initialNodeNumber; i++) {
            var angle = angleBetweenEachNode * i + Math.PI / 6;
            var x = this.centerX + this.radius * Math.cos(angle);
            var y = this.centerY + this.radius * -Math.sin(angle);

            var node = new Node();
            node.x = x;
            node.y = y;
            node.angle = angle;
            this.nodes.push(node);
        }

        // initiate the edges
        for (i = 0; i < this.initialNodeNumber - 1; i++) {
            this.edges.push(new Edge(this.nodes[i], this.nodes[i + 1]));
        }
        this.edges.push(new Edge(this.nodes[this.initialNodeNumber - 1], this.nodes[0]));
    };

    this.DrawNodesBackground = function () {
        for (var i = 0; i < this.edges.length; i++) {
            var edge = this.edges[i];

            var graphics = new PIXI.Graphics();

            graphics.beginFill(0x00ffff);
            graphics.moveTo(this.centerX, this.centerY);
            graphics.lineTo(edge.firstNode.x, edge.firstNode.y);
            graphics.lineTo(edge.secondNode.x, edge.secondNode.y);
            graphics.endFill();

            app.stage.addChild(graphics);
            this.nodeBackgroundGraphics.push(graphics);
        }
    };
    this.ClearNodesBackground = function () {
        for (var i = 0; i < this.edges.length; i++) {
            var graphics = this.nodeBackgroundGraphics.pop();
            app.stage.removeChild(graphics);
        }
    };

    this.DrawBis = function () {

        for (i = 0; i < this.edges.length; i++) {
            this.edges[i].DrawBis();
        }

        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].DrawBis();
        }

        player.DrawBis();
    };
    this.ClearBis = function () {
        canvasArea.canvas.getContext("2d").clearRect(0, 0, canvasArea.width, canvasArea.height);
    };
    this.Draw = function () {
        this.DrawNodesBackground();

        for (i = 0; i < this.edges.length; i++) {
            this.edges[i].Draw();
        }

        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].Draw();
        }

        player.Draw();
    };
    this.ClearScreen = function () {
        this.ClearNodesBackground();

        for (i = 0; i < this.edges.length; i++) {
            this.edges[i].Clear();
        }

        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].Clear();
        }

        player.Clear();
    };

    this.Update = function (delta) {
        canvasArea.Update();

        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].Update(delta);
        }

        player.Update(delta);
    };
}

// game
function Update(delta) {
    /*
    grid.ClearScreen();
    grid.Update(delta);
    grid.Draw();
    */
    grid.ClearBis();
    grid.Update(1);
    grid.DrawBis();
}


player.Initiate();
grid.Initiate();