
var canvasArea = {

    width: 600,
    height: 600,
    canvas: document.createElement("canvas"),
    interval: 20,
    context: null,

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

var events;
var ui;

// ################################################################################################################

// game
var gameManager = {

    state: 10,
    level: 0,
    winTimer: -1,
    winDuration: 60,
    resetButton: null,
    tryAgainButton: null,
    levelProperties: [[80, 160, 280], [50, 160, 200], [80, 120, 200], [80, 160, 280]],
    pauseInput: false,
    eventList: [],

    Initiate: function () {
        this.resetButton = document.getElementById("resetButton");
        this.tryAgainButton = document.getElementById("tryAgainButton");
    },

    DrawGrid: function () {
        grid.Clear();
        grid.Draw();
    },
    UpdateGrid: function () {
        grid.Update(1);
        this.DrawGrid();
        this.state = grid.GetVictoryStatus();
    },
    ReduceGrid: function () {
        if (grid.reduceTimer > 0) {
            grid.reduceTimer--;
            grid.Reduce();
            return false;
        }
        else if (grid.reduceTimer < 0) {
            grid.reduceTimer = grid.reduceDuration;
            return false;
        }
        else {
            grid.reduceTimer--;
            return true;
        }
    },

    ResetForNextLevel: function () {
        for (let i = 0; i < grid.nodes.length; i++) {
            let node = grid.nodes[i];

            node.isSafe = false;
            node.restTimer = 60;
            node.deathTimer = node.deathDuration;
        }
    },
    Reposition: function () {
        if (grid.repositionTimer > 1) {
            grid.repositionTimer--;
            grid.RepositionNodes(this.levelProperties[this.level][1]);
            grid.RepositionPlayer();
            grid.RepositionMaxPoints(this.levelProperties[this.level][2]);
            grid.RepositionMinPoints(this.levelProperties[this.level][0]);
            return false;
        }
        else if (grid.repositionTimer === 1) {
            grid.repositionTimer--;
            return true;
        }
        else {
            grid.repositionTimer = grid.repositionDuration;
            return false;
        }
    },
    
    OnButtonPressReset: function () {
        this.state = -2;
        this.level = 1;
    },
    OnButtonPressTryAgain: function () {
        this.state = -2;
    },

    UpdateEvents: function () {
        for (let i = 0; i < this.eventList.length; i++) {
            this.eventList[i].Update();
        }
    },
    UpdateGame: function () {
        /*
         * notes :
         * etat de freeze
         * etat de win
         * etat de transition entre niveau
         * etat de lose
         * etat de reset
         * etat normal
        */

        // normal
        if (this.state === 0)
            this.UpdateGrid();
        // win freeze
        else if (this.state === 1) {
            this.state++;
            this.winTimer = this.winDuration;
        }
        else if (this.state === 2) {
            if (this.winTimer >= 0)
                this.winTimer--;
            else {
                this.state++;
                this.level = this.level + 1 === this.levelProperties.length ? 1 : this.level + 1;
            }
        }
        // reduce grid
        else if (this.state === 3) {
            this.state = this.ReduceGrid() ? this.state + 1 : this.state;
            this.DrawGrid();
        }
        // reposition elements
        else if (this.state === 4) {
            this.state = this.Reposition() ? this.state + 1 : this.state;
            this.DrawGrid();
        }
        // go to next level
        else if (this.state === 5) {
            this.ResetForNextLevel();
            this.state = 0;
        }
        // reset / restart
        else if (this.state === -2) {
            this.state = this.Reposition() ? this.state - 1 : this.state;
            this.DrawGrid();
        }
        else if (this.state === -3) {
            this.ResetForNextLevel();
            this.state = 0;
        }
        // lose possibility
        else if (this.state === -1) {
            
            ui.DrawEndMessage();
            this.state = -5;
        }
        // launch event to move the player up
        else if (this.state === 10) {
            var event = new MyEvent(60, events.DoNothing, null, events.LaunchExemple, null);
            this.eventList.push(event);
            this.state = 0;
        }
    },

    DrawPauseText: function () {
        let ctx = canvasArea.context;
        ctx.fillStyle = "white";
        ctx.font = "32px Arial";
        ctx.fillText("PAUSE", grid.centerX - 52, grid.centerY);
    },
    DrawAlphaRectangle: function () {
        let ctx = canvasArea.context;
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.rect(0, 0, canvasArea.width, canvasArea.height);
        ctx.fill();
    },
    DrawPausedGame: function () {
        this.DrawGrid();
        this.DrawAlphaRectangle();
        this.DrawPauseText();
    },
    UpdatePausedGame: function () {
        this.DrawPausedGame();
    }
};

// UI
ui = {
    Draw: function () {
        this.DrawLevel();
    },
    DrawLevel: function () {
        let ctx = canvasArea.context;
        ctx.fillStyle = "black";
        ctx.font = "32px Arial";
        ctx.fillText("Lvl : " + gameManager.level, 10, 32);
    },
    DrawEndMessage: function (isVictory) {

        let str;
        str = isVictory ? "You won !" : "You lost";
        let ctx = canvasArea.context;
        ctx.font = "64px Arial";
        ctx.fillText(str, grid.centerX - 128, grid.centerY + 128);
    }
};

// node
function Node(minNode, maxNode) {
    this.spd = 0.3;
    this.x = 0;
    this.y = 0;
    this.minNode = minNode;
    this.maxNode = maxNode;
    this.angle = 0;
    this.restDuration = 120;
    this.restTimer = 120;
    this.deathDuration = 120;
    this.deathTimer = this.deathDuration;
    this.radius = 16;
    this.isSafe = false;
    this.justMoved = false; 

    this.Place = function (newX, newY, newAngle) {
        this.x = newX;
        this.y = newY;
        this.angle = newAngle;
    };

    this.DrawSafe = function() {
        ctx = canvasArea.context;
        ctx.beginPath();
        ctx.fillStyle = grid.nodesSafeColor;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    };
    this.DrawNormalFade = function () {
        ctx = canvasArea.context;
        ctx.beginPath();

        let scale = this.deathTimer / this.deathDuration;
        let r = grid.nodesColorRGB[0] * scale + grid.nodesDeathColorRGB[0] * (1 - scale);
        let g = grid.nodesColorRGB[1] * scale + grid.nodesDeathColorRGB[1] * (1 - scale);
        let b = grid.nodesColorRGB[2] * scale + grid.nodesDeathColorRGB[2] * (1 - scale);

        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    };
    this.DrawNormalTimer = function () {
        ctx = canvasArea.context;

        ctx.beginPath();

        let scale = this.deathTimer / this.deathDuration;
        let r = grid.nodesColorRGB[0];
        let g = grid.nodesColorRGB[1];
        let b = grid.nodesColorRGB[2];

        //var s = grid.reduceTimer / grid.reduceDuration;
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.arc(this.x, this.y, this.radius/* / grid.reduceScale + this.radius / grid.reduceScale * s*/, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();

        r = grid.nodesDeathColorRGB[0];
        g = grid.nodesDeathColorRGB[1];
        b = grid.nodesDeathColorRGB[2];

        ctx.moveTo(this.x, this.y);
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.arc(this.x, this.y, this.radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - scale));
        ctx.fill();
    };
    this.DrawNormal = function () {
        this.DrawNormalTimer();
    };
    this.DrawDead = function () {
        var ctx = canvasArea.context;
        ctx.beginPath();

        ctx.fillStyle = grid.nodesDeathColor;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.moveTo(this.x - this.radius / 2, this.y - this.radius / 2);
        ctx.lineTo(this.x + this.radius / 2, this.y + this.radius / 2);
        ctx.moveTo(this.x - this.radius / 2, this.y + this.radius / 2);
        ctx.lineTo(this.x + this.radius / 2, this.y - this.radius / 2);
        ctx.stroke();
        ctx.strokeStyle = "black";
    };
    this.DrawReduced = function () {

    };
    this.Draw = function () {
        if (this.deathTimer < 0)
            this.DrawDead();
        else if (!this.isSafe)
            this.DrawNormal();
        else
            this.DrawSafe();
    };

    this.IsInDeathZone = function () {
        var distNodeGridCenter = player.GetDistBetweenPoints(this.x, this.y, grid.centerX, grid.centerY);
        var distDeathPointGridCenter = player.GetDistBetweenPoints(this.minNode.x, this.minNode.y, grid.centerX, grid.centerY);

        return distNodeGridCenter <= distDeathPointGridCenter;
    };
    this.IsFartherThanMaxPoint = function () {
        var distNodeGridCenter = player.GetDistBetweenPoints(this.x, this.y, grid.centerX, grid.centerY);
        var distMaxNodeGridCenter = player.GetDistBetweenPoints(this.maxNode.x, this.maxNode.y, grid.centerX, grid.centerY);

        return distNodeGridCenter > distMaxNodeGridCenter;
    };
    this.IsNearMaxPoint = function () {
        return player.GetDistBetweenPoints(this.x, this.y, this.maxNode.x, this.maxNode.y) < this.radius;
    };
    this.CanMove = function () {

        if (player.GetDistBetweenPoints(player.x, player.y, this.x, this.y) < this.radius * (3 / 2))
            return false;
        if (this.restTimer > 0)
            return false;
        if (this.deathTimer < 0)
            return false;

        return true;
    };

    this.TouchedByPlayerEffect = function () {
        if (this.deathTimer > 0) {
            this.restTimer = this.restDuration;
            this.deathTimer = this.deathDuration;
        }
    };
    this.TouchedByDeathPointEffect = function () {
        if (this.deathTimer > 0)
            this.deathTimer--;
    };
    
    this.PushAwayPlayer = function () {
        var adj = this.x - player.x;
        var hyp = player.GetDistBetweenPoints(player.x, player.y, this.x, this.y);

        var angle = Math.acos(adj / hyp) * Math.sign(player.y - this.y);
        
        while (player.GetDistBetweenPoints(player.x, player.y, this.x, this.y) < this.radius + this.radius / 2) {
            player.x -= Math.cos(angle);
            player.y += Math.sin(angle);
        }
    };
    this.MoveTowardGridCenter = function () {
        // if in the death zone
        if (this.IsInDeathZone())
            this.TouchedByDeathPointEffect();
        // else if is not yet safe, move
        else if (!this.isSafe) { 
            var hsp = this.spd * -Math.cos(this.angle);
            var vsp = this.spd * Math.sin(this.angle);

            this.x += hsp;
            this.y += vsp;
        }
    };
    this.MovedByPlayer = function () {
        if (player.GetDistBetweenPoints(this.x, this.y, player.x, player.y) < this.radius + this.radius / 2) {
            
            while (player.GetDistBetweenPoints(this.x, this.y, player.x, player.y) < this.radius + this.radius / 2) {
                this.x -= this.spd * Math.cos(this.angle + Math.PI);
                this.y += this.spd * Math.sin(this.angle + Math.PI);
            }

            this.TouchedByPlayerEffect();

            // if the node reaches the max point, make it golden !
            if (this.IsNearMaxPoint()) {
                if (!this.isSage)
                    grid.deathPointsSpdBonus++;

                this.isSafe = true;
            }
            // make sure it is not pushing the node too far
            if (this.IsFartherThanMaxPoint()) {
                this.x = this.maxNode.x;
                this.y = this.maxNode.y;

                this.PushAwayPlayer();
            }
        }
    };
    
    this.GetLiveStatus = function () {
        if (this.deathTimer < 0)
            return -1;
        else if (this.isSafe)
            return 1;
        else
            return 0;
    };

    this.FirstUpdate = function () {
        let canMove = this.CanMove();
        if (canMove) {
            this.MoveTowardGridCenter();
        }

        this.justMoved = canMove;
    };
    this.SecondUpdate = function () {
        if (this.deathTimer > 0) {
            this.MovedByPlayer();

            if (this.restTimer > 0)
                this.restTimer--;
        }
        else {
            this.deathTimer--;
        }
    };

    this.GetDistBetweenNodes = function (node1, node2) {
        return Math.sqrt(Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2));
    };
}

// deathPoint
function DeathPoint() {
    this.x = 0;
    this.y = 0;
    this.spd = 0.01;
    this.angle = 0;

    this.Place = function (newX, newY, newAngle) {
        this.x = newX;
        this.y = newY;
        this.angle = newAngle;
    };
    this.Expend = function () {
        //this.x += this.spd * Math.cos(this.angle);
        //this.y -= this.spd * Math.sin(this.angle);
    };

    this.Update = function () {

    };
}

// maxPoint
function MaxPoint() {
    this.x = 0;
    this.y = 0;
    this.angle = 0;

    this.Place = function (newX, newY, newAngle) {
        this.x = newX;
        this.y = newY;
        this.angle = newAngle;
    };

    this.Draw = function () {
        ctx = canvasArea.context;

        ctx.beginPath();
        ctx.fillStyle = grid.maxPointsColor;
        ctx.arc(this.x, this.y, 16, 0, Math.PI * 2);
        ctx.fill();
    };
}

// edge
function Edge(node1, node2, color) {
    this.firstNode = node1;
    this.secondNode = node2;

    this.Update = function () {
    };
    this.CheckForPlayerCollision = function () {
        if (!this.firstNode.justMoved && !this.secondNode.justMoved)
            return false;

        let L = [];

        if (this.firstNode.justMoved) {
            let hsp = this.firstNode.spd * -Math.cos(this.firstNode.angle);
            let vsp = this.firstNode.spd * Math.sin(this.firstNode.angle);

            L.push(this.firstNode.x - hsp, this.firstNode.y - vsp);
        }

        if (this.secondNode.justMoved) {
            let hsp = this.secondNode.spd * -Math.cos(this.secondNode.angle);
            let vsp = this.secondNode.spd * Math.sin(this.secondNode.angle);

            L.push(this.secondNode.x - hsp, this.secondNode.y - vsp);
        }
        
        L.push(this.secondNode.x, this.secondNode.y);
        L.push(this.firstNode.x, this.firstNode.y);

        if (player.IsCollidingWithConvexShape(L, L.length === 6)) {
            this.PushAwayPlayer();
            return true;
        }

        return false;
    };
    this.PushAwayPlayer = function () {
        // on utilise pas le bonne angle !
        var angle = this.GetAngle();

        var coord = player.GetIntersectionPointBetweenLines(player.x, player.y,
            player.x + Math.cos(angle - Math.PI / 2), player.y - Math.sin(angle - Math.PI / 2),
            this.firstNode.x, this.firstNode.y, this.secondNode.x, this.secondNode.y);

        if (coord.length === 0) {
            console.log("erreur");
            return;
        }

        var dist = player.GetDistBetweenPoints(coord[0], coord[1], player.x, player.y) + 0.001;
        
        player.x += Math.sign(coord[0] - player.x) * dist;
        player.y += Math.sign(coord[1] - player.y) * dist; 
    };

    this.Draw = function () {
        var ctx = canvasArea.context;

        ctx.beginPath();
        ctx.moveTo(this.firstNode.x, this.firstNode.y);
        ctx.lineTo(this.secondNode.x, this.secondNode.y);
        ctx.stroke();
    };

    this.GetAngle = function () {

        var hyp = this.firstNode.GetDistBetweenNodes(this.firstNode, this.secondNode);
        var adj = this.secondNode.x - this.firstNode.x;

        return Math.acos(adj / hyp) * Math.sign(this.firstNode.y - this.secondNode.y);
    };
}

// grid
var grid = {
    // grid
    centerX: canvasArea.width / 2,
    centerY: canvasArea.height / 2,
    // nodes
    nodes: [],
    radius: gameManager.levelProperties[0][1],
    initialNodeNumber: 6,
    nodesColorRGB: [0, 150, 0],
    nodesDeathColor: "black", nodesDeathColorRGB: [0, 0, 0],
    nodesSafeColor: "rgb(255, 230, 50)", // yellow en mieux
    nodesBackgroundColor: "rgb(0, 210, 0)", // lightgreen en mieux
    // edges and walls
    deathPointsEdges: [],
    walls: [],
    //death points
    deathPointsSpdBonus: 0,
    deathPoints: [],
    deathRadius: gameManager.levelProperties[0][0],
    deathPointsBackgroundColor: "red",
    // maxPoints
    maxPoints: [],
    maxRadius: gameManager.levelProperties[0][2],
    maxPointsColor: "grey",
    maxPointsColorBackground: "darkgrey",
    // reduce 
    reduceTimer: -1,
    reduceDuration: 2 * 60,
    reduceScale: 2,
    reduceSpd: null,//this.maxRadius / this.reduceScale / this.reduceDuration,
    // reposition
    repositionTimer: -1,
    repositionDuration: 60,
    // test 
    toDraw: [],

    Initiate: function () {

        // init var
        this.reduceSpd = this.maxRadius / this.reduceScale / this.reduceDuration;

        // initiate the nodes, death points, and max points
        var angleBetweenEachNode = 2 * Math.PI / this.initialNodeNumber;

        for (var i = 0; i < this.initialNodeNumber; i++) {

            var angle = angleBetweenEachNode * i + Math.PI / 6;

            var x = this.centerX + this.deathRadius * Math.cos(angle);
            var y = this.centerY + this.deathRadius * -Math.sin(angle);

            var deathPoint = new DeathPoint(this.deathPointsColor);
            deathPoint.Place(x, y, angle);
            this.deathPoints.push(deathPoint);

            x = this.centerX + this.maxRadius * Math.cos(angle);
            y = this.centerY + this.maxRadius * -Math.sin(angle);

            var maxPoint = new MaxPoint();
            maxPoint.Place(x, y, angle);
            this.maxPoints.push(maxPoint);

            //x = this.centerX + this.radius * Math.cos(angle);
            //y = this.centerY + this.radius * -Math.sin(angle);

            var node = new Node(deathPoint, maxPoint);
            if (/*false && /**/i !== 1) {
                node.isSafe = true;
                node.Place(x, y, angle);
            }
            else
                node.Place(this.centerX + this.radius * Math.cos(angle), this.centerY + this.radius * -Math.sin(angle), angle);
            this.nodes.push(node);
        }

        // initiate the walls
        for (i = 0; i < this.initialNodeNumber - 1; i++) {
            this.walls.push(new Edge(this.nodes[i], this.nodes[i + 1], ));
        }
        this.walls.push(new Edge(this.nodes[this.initialNodeNumber - 1], this.nodes[0]));

        // initiate the edges
        for (i = 0; i < this.initialNodeNumber - 1; i++) {
            this.deathPointsEdges.push(new Edge(this.deathPoints[i], this.deathPoints[i + 1], ));
        }
        this.deathPointsEdges.push(new Edge(this.deathPoints[this.initialNodeNumber - 1], this.deathPoints[0]));


    },

    GetVictoryStatus: function () {
        let score = 0;
        for (let i = 0; i < this.nodes.length; i++) {
            var status = this.nodes[i].GetLiveStatus();
            if (status === -1)
                return -1;
            score += status;
        }

        if (score === 6)
            return 1;
        return 0;
    },

    DrawMaxPointsBackground: function () {
        var ctx = canvasArea.context;
        ctx.fillStyle = this.maxPointsColorBackground;

        for (var i = 0; i < this.maxPoints.length; i++) {
            ctx.beginPath();
            ctx.moveTo(grid.centerX, grid.centerY);
            ctx.lineTo(this.maxPoints[i].x, this.maxPoints[i].y);
            ctx.lineTo(this.maxPoints[(i + 1) % this.maxPoints.length].x,
                this.maxPoints[(i + 1) % this.maxPoints.length].y);
            ctx.fill();
        }
    },
    DrawDeathPointsBackground: function () {
        var ctx = canvasArea.context;
        ctx.fillStyle = grid.deathPointsBackgroundColor;

        for (var i = 0; i < this.deathPoints.length; i++) {
            ctx.beginPath();
            ctx.moveTo(grid.centerX, grid.centerY);
            ctx.lineTo(this.deathPoints[i].x, this.deathPoints[i].y);
            ctx.lineTo(this.deathPoints[(i + 1) % this.deathPoints.length].x,
                this.deathPoints[(i + 1) % this.deathPoints.length].y);
            ctx.fill();
        }
    },
    DrawNodesBackground: function () {
        var ctx = canvasArea.context;
        ctx.fillStyle = this.nodesBackgroundColor;

        for (var i = 0; i < this.walls.length; i++) {
            var wall = this.walls[i];

            ctx.beginPath();
            ctx.moveTo(grid.centerX, grid.centerY);
            ctx.lineTo(wall.firstNode.x, wall.firstNode.y);
            ctx.lineTo(wall.secondNode.x, wall.secondNode.y);
            ctx.fill();
        }
    },
    Draw: function () {

        this.DrawMaxPointsBackground();

        this.DrawNodesBackground();

        this.DrawDeathPointsBackground();

        for (var i = 0; i < this.walls.length; i++)
            this.walls[i].Draw();

        for (i = 0; i < this.deathPointsEdges.length; i++)
            this.deathPointsEdges[i].Draw();

        for (i = 0; i < this.maxPoints.length; i++)
            this.maxPoints[i].Draw();

        for (i = 0; i < this.nodes.length; i++)
            this.nodes[i].Draw();

        player.Draw();

        var test = new Test();
        test.DrawPoints(this.toDraw);
    },
    Clear: function () {
        canvasArea.canvas.getContext("2d").clearRect(0, 0, canvasArea.width, canvasArea.height);
    },

    Reduce: function () {
        for (let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i];

            // reduce node
            var scale = player.GetDistBetweenPoints(grid.centerX, grid.centerY, node.x, node.y)
                / player.GetDistBetweenPoints(grid.centerX, grid.centerY, node.maxNode.x, node.maxNode.y);

            node.x += grid.reduceSpd * Math.cos(node.angle + Math.PI) * scale;
            node.y -= grid.reduceSpd * Math.sin(node.angle + Math.PI) * scale;

            // reduce deathPoint
            scale = player.GetDistBetweenPoints(grid.centerX, grid.centerY, node.minNode.x, node.minNode.y)
                / player.GetDistBetweenPoints(grid.centerX, grid.centerY, node.maxNode.x, node.maxNode.y);

            node.minNode.x += grid.reduceSpd * Math.cos(node.angle + Math.PI) * scale;
            node.minNode.y -= grid.reduceSpd * Math.sin(node.angle + Math.PI) * scale;

            // reduce maxPoint
            node.maxNode.x += grid.reduceSpd * Math.cos(node.angle + Math.PI);
            node.maxNode.y -= grid.reduceSpd * Math.sin(node.angle + Math.PI);
        }

        // reduce player
        let coord = [];
        let minVal = Infinity;
        for (let i = 0; i < grid.walls.length; i++) {
            let wall = grid.walls[i];
            let curCoord = player.GetIntersectionPointBetweenLines(player.x, player.y, grid.centerX, grid.centerY,
                wall.firstNode.x, wall.firstNode.y, wall.secondNode.x, wall.secondNode.y);

            if (curCoord === [])
                continue;

            var dist = player.GetDistBetweenPoints(curCoord[0], curCoord[1], player.x, player.y);
            if (dist < minVal) {
                minVal = dist;
                coord = curCoord;
            }
        }

        scale = player.GetDistBetweenPoints(grid.centerX, grid.centerY, player.x, player.y)
            / player.GetDistBetweenPoints(grid.centerX, grid.centerY, coord[0], coord[1]);

        var hyp = minVal;
        var adj = coord[0] - player.x;
        var angle = Math.acos(adj / hyp) * Math.sign(player.y - coord[1]);

        player.x += grid.reduceSpd * Math.cos(angle + Math.PI) * scale;
        player.y -= grid.reduceSpd * Math.sin(angle + Math.PI) * scale;
    },
    RepositionPlayer: function () {
        player.x -= (player.x - this.centerX) / this.repositionTimer;
        player.y -= (player.y - this.centerY) / this.repositionTimer;
    },
    RepositionNodes: function (newRadius) {

        for (let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i];

            var dist = player.GetDistBetweenPoints(this.centerX, this.centerY, node.x, node.y);
            var spd = (newRadius - dist) / this.repositionTimer;

            node.x += Math.cos(node.angle) * spd;
            node.y -= Math.sin(node.angle) * spd;
        }
    },
    RepositionMaxPoints: function (newRadius) {
        for (let i = 0; i < this.maxPoints.length; i++) {
            let maxPoint = this.maxPoints[i];

            var dist = player.GetDistBetweenPoints(this.centerX, this.centerY, maxPoint.x, maxPoint.y);
            var spd = (newRadius - dist) / this.repositionTimer;

            maxPoint.x += Math.cos(maxPoint.angle) * spd;
            maxPoint.y -= Math.sin(maxPoint.angle) * spd;
        }
    },
    RepositionMinPoints: function (newRadius) {

        for (let i = 0; i < this.deathPoints.length; i++) {
            let minPoint = this.deathPoints[i];

            var dist = player.GetDistBetweenPoints(this.centerX, this.centerY, minPoint.x, minPoint.y);
            var spd = (newRadius - dist) / this.repositionTimer;

            minPoint.x += Math.cos(minPoint.angle) * spd;
            minPoint.y -= Math.sin(minPoint.angle) * spd;
        }
    },

    Update: function (delta) {
        canvasArea.Update();
        this.toDraw = [];

        for (let i = 0; i < this.deathPoints.length; i++)
            this.deathPoints[i].Expend();

        for (let i = 0; i < this.nodes.length; i++)
            this.nodes[i].FirstUpdate();

        // check for triangle collision and react accordingly
        for (let i = 0; i < this.walls.length; i++) {
            if (this.walls[i].CheckForPlayerCollision())
                continue;
        }

        player.Update(delta);

        for (let i = 0; i < this.nodes.length; i++)
            this.nodes[i].SecondUpdate();
    }
};

// player's cursor
var player = {
    spd: 3,
    x: grid.centerX,
    y: grid.centerY,
    inputs: [false, false, false, false],
    color: "black",
    radius: 16,
    angle: 0,
    canMove: false,

    Initiate: function () {
        window.addEventListener("keydown",
            function (e) {
                if (e.keyCode <= 40 && e.keyCode >= 37)
                    player.inputs[e.keyCode - 37] = true;
                if (e.keyCode === 13)
                    gameManager.pauseInput = !gameManager.pauseInput;
            });
        window.addEventListener("keyup",
            function (e) {
                if (e.keyCode <= 40 && e.keyCode >= 37)
                    player.inputs[e.keyCode - 37] = false;
            });
    },

    ResetInputs: function () {
        for (var i = 0; i < 4; i++)
            player.inputs[i] = false;
    },

    Update: function (delta) {
        if (this.canMove)
            player.KeysMotion();
    },
    
    Move: function (dx, dy) {

        // check if is going through a wall
        var isOk = true;
        for (var i = 0; i < grid.walls.length; i++) {
            if (!this.CheckForEdgeCollision(grid.walls[i], dx, dy)) {
                isOk = false;

                break;
            }
        }

        // move
        if (isOk) {
            player.x += dx;
            player.y += dy;
        }
    },
    KeysMotion: function () {
        var dx = 0;
        var dy = 0;

        if (player.inputs[0]) // 37 is left 
            dx = -1;
        if (player.inputs[1]) // 38 is up
            dy = -1;
        if (player.inputs[2]) // 39 is right
            dx = 1;
        if (player.inputs[3]) // 40 is down
            dy = 1;

        if (dx === dy && dx === 0)
            return;

        var angle = 0;
        if (dy === 0)
            angle = Math.PI / 2 - dx * Math.PI / 2;
        else if (dx === 0)
            angle = -dy * Math.PI / 2;
        else {
            angle = -dy * (Math.PI / 2 - dx * Math.PI / 4);
        }

        dx = Math.cos(angle) * this.spd;
        dy = -Math.sin(angle) * this.spd;

        dx = Math.abs(dx) < 0.001 ? 0 : dx;
        dy = Math.abs(dy) < 0.001 ? 0 : dy;

        player.Move(dx, dy);
    },

    CheckForEdgeCollision: function (edge, dx, dy) {
        if (dx === 0 && dy === 0)
            return true;

        let coord = this.GetIntersectionPointBetweenLines(player.x, player.y,
            player.x + dx, player.y + dy,
            edge.firstNode.x, edge.firstNode.y,
            edge.secondNode.x, edge.secondNode.y);

        if (coord.length === 0)
            return true;

        let x = coord[0];
        let y = coord[1];

        var distCenterEdgePoint = this.GetDistBetweenPoints(x, y, grid.centerX, grid.centerY);
        var distCenterPlayerFuture = this.GetDistBetweenPoints(player.x + dx, player.y + dy, grid.centerX, grid.centerY);

        var distPlayerEdgePoint = this.GetDistBetweenPoints(player.x, player.y, x, y);
        var distPlayerPlayerFuture = Math.sqrt(dx * dx + dy * dy);

        if (distPlayerEdgePoint < distPlayerPlayerFuture
            && (Math.sign(player.x - x) === Math.sign(-dx) && Math.sign(player.y - y) === Math.sign(-dy))
            && coord[0] <= Math.max(edge.firstNode.x, edge.secondNode.x)
            && coord[0] >= Math.min(edge.firstNode.x, edge.secondNode.x)
            && coord[1] <= Math.max(edge.firstNode.y, edge.secondNode.y)
            && coord[1] >= Math.min(edge.firstNode.y, edge.secondNode.y)) {

            var angle = edge.GetAngle() + Math.PI / 2;

            let nextDest = this.GetIntersectionPointBetweenLines(player.x + dx, player.y + dy,
                player.x + dx + Math.cos(angle), player.y + dy - Math.sin(angle),
                edge.firstNode.x, edge.firstNode.y,
                edge.secondNode.x, edge.secondNode.y);

            player.x = nextDest[0] - 0.001 * dx;
            player.y = nextDest[1] - 0.001 * dy;

            return false;
        }

        return true;
    },

    Draw: function () {
        ctx = canvasArea.context;

        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        //for (var i = 0; i < grid.walls.length; i++)
        //    this.CheckForEdgeCollision(grid.walls[i]);
    },

    GetIntersectionPointBetweenLines: function (xa, ya, xb, yb, xc, yc, xd, yd) {
        // line passing through playerPos and it's angle
        // y = ax + b
        var a = xb - xa !== 0 ? (yb - ya) / (xb - xa) : 1000000000;
        var b = ya - a * xa;

        // line passing through each node of the edge
        // y = cx + d
        var c = xd - xc !== 0 ? (yd - yc) / (xd - xc) : 1000000000;
        var d = yc - c * xc;

        if (a !== c) { // if they are not parallel lines
            // let's calculate the point of intersection
            var x = (b - d) / (c - a);
            var y = a * x + b;
            x = a === 1000000000 ? xa : x;

            return [x, y];
        }

        return [];
    },
    GetDistBetweenPoints: function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    },

    IsLeft: function (xa, ya, xb, yb, xp, yp) {
        return (xb - xa) * (yp - ya) - (yb - ya) * (xp - xa) >= 0;
    },
    IsCollidingWithConvexShape: function (vertexList, isTriangle) {
        let count = 0;

        if (isTriangle) {
            if (this.IsLeft(vertexList[0], vertexList[1], vertexList[2], vertexList[3],
                player.x, player.y))
                count++;
            if (this.IsLeft(vertexList[2], vertexList[3], vertexList[4], vertexList[5],
                player.x, player.y))
                count++;
            if (this.IsLeft(vertexList[4], vertexList[5], vertexList[0], vertexList[1],
                player.x, player.y))
                count++;
        }
        else {
            if (this.IsLeft(vertexList[0], vertexList[1], vertexList[2], vertexList[3],
                player.x, player.y))
                count++;
            if (this.IsLeft(vertexList[2], vertexList[3], vertexList[4], vertexList[5],
                player.x, player.y))
                count++;
            if (this.IsLeft(vertexList[4], vertexList[5], vertexList[6], vertexList[7],
                player.x, player.y))
                count++;
            if (this.IsLeft(vertexList[6], vertexList[7], vertexList[0], vertexList[1],
                player.x, player.y))
                count++;
        }

        return count === 0;//isTriangle ? 3 : 4;
    }
};

// test
function Test() {
    this.DrawPoints = function (L) {
        for (let i = 0; i < L.length; i++) {
            var elm = L[i];

            ctx = canvasArea.context;
            ctx.beginPath();

            ctx.fillStyle = "black";
            ctx.arc(elm.x, elm.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    };
}

// events 
function MyEvent(duration, action, target, endAction, endTarget) {
    this.action = action;
    this.target = target;
    this.endAction = endAction;
    this.endTarget = endTarget;

    this.timer = duration;
    this.duration = duration;

    this.Update = function () {
        if (this.timer > 0) {
            this.timer--;
            this.action(this.target);
        }
        else {
            gameManager.eventList.pop();
            if (this.endAction !== 'undefined')
                this.endAction(this.endTarget);
        }
    };
}

events = {
    MovePlayerUp: function (p) {
        p.y -= p.spd;
    },
    EnablePlayerMovements: function (p) {
        p.canMove = true;
    },
    GoToState: function (newState) {
        gameManager.state = newState;
    },
    LaunchExemple: function (arg) {
        let event = new MyEvent(80, events.MovePlayerUp, player, events.EnablePlayerMovements, player);
        gameManager.eventList.push(event);
    },
    DoNothing: function (arg) {

    }
};

function Update() {
    if (!gameManager.pauseInput) {
        gameManager.UpdateGame();
        gameManager.UpdateEvents();
    }
    else
        gameManager.UpdatePausedGame();

    ui.Draw(); 
}

canvasArea.Initiate();
player.Initiate();
grid.Initiate();
gameManager.Initiate();