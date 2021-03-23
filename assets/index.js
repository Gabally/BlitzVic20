const canvas = document.getElementById("maingame");
const ctx = canvas.getContext("2d");

canvas.width = 1280;
canvas.height = 739;

function craft_img(src, w=null,h=null)
{
    let tmp = new Image();
    tmp.src = src;
    if (w !== null)
    {
        tmp.width = w;
    }
    if (h !== null)
    {
        tmp.height = h;
    }
    return tmp;
}

class AnimationSPRT
{
    constructor(imgsrc, w, h, frameInterval, flip=false)
    {
        this.frameInterval = frameInterval;
        this.frames = [];
        let img = new Image();
        img.src = imgsrc;
        img.onload = () => {
            let tmpcanvas = document.createElement("canvas");
            let context = tmpcanvas.getContext("2d");
            let nframes = img.width/w;
            let xSrc = 0;
            tmpcanvas.width = w;
            tmpcanvas.height = h;
            if (flip)
            {
                context.translate(tmpcanvas.width, 0);
                context.scale(-1, 1);
            }
            for(let i = 0;i < nframes;i++)
            {
                context.clearRect(0, 0, tmpcanvas.width, tmpcanvas.height);
                context.webkitImageSmoothingEnabled = false;
                context.mozImageSmoothingEnabled = false;
                context.msImageSmoothingEnabled = false;
                context.imageSmoothingEnabled = false;
                context.drawImage(img, xSrc, 0, w, h, 0, 0, w, h);
                let tmp = new Image();
                tmp.src = tmpcanvas.toDataURL();
                tmp.onload = e => {
                    this.frames.push(tmp);
                };
                xSrc += w;
            }
        }
    }
}

class Sprite
{
    constructor(src, x=0, y=0, w=0, h=0, vx=0, vy=0)
    {
        this.image = craft_img(src, w, h);
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = vx;
        this.vy = vy;
        this.alive = true;
        this.tolerance = 20;
    }

    update(time)
    {
        this.x += this.vx;
        this.y += this.vy
    }

    draw(time) 
    {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    collides(obj)
    {
        return !(obj.x + obj.width - obj.tolerance < this.x + this.tolerance || this.x + this.width - this.tolerance < obj.x + obj.tolerance) && 
        !(obj.y + obj.height - obj.tolerance < this.y  + this.tolerance || this.y + this.height -this.tolerance < obj.y + obj.tolerance);
    }
}

class Player
{
    constructor(x=0, y=0, w=0, h=0, groundline = 0)
    {
        this.x = x;
        this.y = y;
        this.groundline = groundline;
        this.gnd = canvas.height - (canvas.height/100)* groundline;
        this.width = w;
        this.height = h;
        this.image = craft_img("assets/plane1.png", 64, 18);
        this.alive = true;
        this.tolerance = 1;
        this.speed = 15;
        this.sources = [
            craft_img("assets/plane1.png", 64, 18),
            craft_img("assets/plane2.png", 64, 18)
        ];
        this.currentImage = 0;
        this.deltaAnime = 200;
        this.lastChange = 0;
        this.deathSound = new Audio("assets/explosion.mp3");
    }

    draw(time) 
    {
        try
        {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
        catch{}
    }

    update(time)
    {
        //this.gnd = canvas.height - (canvas.height/100)* this.groundline;
        this.x += this.speed;
        if (this.x >= canvas.width)
        {
            this.y += 60;
            this.x = -10;
        }
        if ((time - this.lastChange) > this.deltaAnime)
        {
            this.currentImage = ++this.currentImage % this.sources.length;
            this.lastChange = time;
            this.image = this.sources[this.currentImage];
        }
    }

    collides(obj)
    {
        return !(obj.x + obj.width - obj.tolerance < this.x + this.tolerance || this.x + this.width - this.tolerance < obj.x + obj.tolerance) && 
        !(obj.y + obj.height - obj.tolerance < this.y  + this.tolerance || this.y + this.height -this.tolerance < obj.y + obj.tolerance);
    }
}

class Game
{
    constructor()
        {
            window.addEventListener("DOMContentLoaded", ()=> {
                if(!window.localStorage.getItem("highscore"))
                {
                    this.highScore = 0;
                    window.localStorage.setItem("highscore", 0);
                }
                else
                {
                    this.highScore = window.localStorage.getItem("highscore");
                }
            });         
            this.doit = "";
            this.buildings = new ListFactory();
            //new Building(canvas.width/2, canvas.height/2);
            this.player = new Player(-30, 80, 80, 30, 600);
            this.bomb = undefined;
            window.addEventListener("keydown", (e)=>{
                if (e.code == "Space")
                {
                    e.preventDefault();
                    if (!e.repeat && !this.bomb)
                    {
                        this.dropBomb();
                    }
                }
            });
            canvas.addEventListener("touchstart", (e)=>{
                if (!this.bomb)
                {
                    this.dropBomb();
                }
            });
            document.addEventListener("keyup", (e)=>{
                if(e.code === "Space")
                {
                    e.preventDefault();
                }
            });
            this.points = 0;
            this.died = false;
            this.planeSound = new Audio("assets/plane.mp3");
            this.planeSound.loop = true;
            this.windSound = new Audio("assets/cleared.mp3");
            this.scoreImg = craft_img("assets/score.png", 148, 14);
            this.bestImg = craft_img("assets/best.png", 116, 14);
            this.tped = false;
        }

        dropBomb()
        {
            this.bomb = new Bomb(this.player.x, this.player.y);
        }

        start()
        {
            this.tped = false;
            this.died = false;
            this.points = 0;
            this.player = new Player(-30, 80, 100, 40, 600);
            this.bomb = undefined;
            this.buildings = new ListFactory();
            this.currentTime = 0;
            this.startTime = null;
            let x = 150;
            let cnt = x;
            
            for (let i = 0; i < 16; i++) {
                let xd = new Building(cnt);
                this.buildings.push(xd);
                cnt += xd.w+3;
            }
            this.planeSound.play();
        }

        update(time)
        {
            if (this.buildings.empty() && !this.tped && this.player.x >= canvas.width-this.player.width)
            {
                this.tped = true;
                this.player.x = -10;
                this.player.y = canvas.height - this.player.height;
            }
            this.player.update(time);
            if (this.bomb){
                this.bomb.update();
                this.buildings = this.buildings.reduce(
                    (b, a) => {
                        if (this.bomb && b.collides(this.bomb))
                        {
                            b.pieces -= 1;
                            this.points += 300;
                            this.bomb = undefined;
                            if (b.pieces !== 0)
                            {
                                a.push(b);
                            }
                        }
                        else
                        {
                            a.push(b);
                        }
                        return a;
                        },
                    new ListFactory()
                );
                if (this.bomb && this.bomb.y >= (canvas.height+70))
                {
                    this.bomb = undefined;
                }
            }
            this.buildings.visit(b => {
                if (b.planeCollides(this.player))
                {
                    this.player.deathSound.play();
                    this.died = true;
                    if (this.points > parseInt(window.localStorage.getItem("highscore")))
                    {
                        this.highScore = this.points;
                        window.localStorage.setItem("highscore", this.highScore);
                    }
                    setTimeout(()=>{
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }, 3000);
                }
                b.update(time);
            });
            if ((this.player.y) >= (canvas.height-(this.player.height)) && (this.player.x >= canvas.width-(this.player.width)))
            {
                this.died = true;
                this.windSound.play();
                document.getElementById("notify").textContent = "Level cleared !";
                setTimeout(()=>{
                    document.getElementById("notify").textContent = "";
                }, 3000);
            }
        }

        draw(time)
        {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.webkitImageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;
            this.player.draw(time);
            if (this.bomb)
            { 
                this.bomb.draw(time); 
            }
            this.buildings.visit(b => {
                b.draw(time);
            });
            ctx.textBaseline = "bottom";
            ctx.font = "45px VT323";
            ctx.fillStyle = "#901ccc";
            ctx.drawImage(this.scoreImg, 30, 30, this.scoreImg.width, this.scoreImg.height+10);
            ctx.fillText(this.points, 40+this.scoreImg.width, 64);
            ctx.drawImage(this.bestImg, 970, 30, this.bestImg.width, this.bestImg.height+10);
            ctx.textBaseline = "bottom";
            ctx.font =  "45px VT323";
            ctx.fillStyle = "#901ccc";
            ctx.fillText(this.highScore, 1100, 64);
        }

        step(time)
        {
            if (!this.startTime)
            {
                this.startTime = time;
            }
            this.currentTime = time - this.startTime;
            if (!((time - lastTimestamp) < 16.6))
            {
                this.update(time);
                lastTimestamp = time;
            }
            this.draw(time);
        }

        stop()
        {
            this.planeSound.pause();
        }
}

class Bomb extends Sprite
{
    constructor(x, y)
    {
        super("assets/bomb.png", x, y, 24, 24, 0, 40);
        this.sound = new Audio("assets/bomb.mp3");
        this.sound.cloneNode().play();
    }

    draw(time) 
    {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Building
{
    constructor (x)
    {
        let aviableBuildings = [
            {src: "assets/building1.png", w: 56, h: 96, p: 2},
            {src: "assets/building2.png", w: 56, h: 352, p: 7},
            {src: "assets/building3.png", w: 56, h: 192, p: 3},
            {src: "assets/building4.png", w: 56, h: 224, p: 6},
            {src: "assets/building5.png", w: 56, h: 128, p: 3},
            {src: "assets/building6.png", w: 56, h: 256, p: 5},
        ]
        let randomBuilding = aviableBuildings[Math.floor(Math.random() * aviableBuildings.length)];
        this.x = x;
        this.y = 710 - randomBuilding.h;
        this.w = randomBuilding.w;
        this.h = randomBuilding.h;
        this.p = randomBuilding.p;
        this.s = this.h/this.p;
        this.pieces = randomBuilding.p;
        this.image = craft_img(randomBuilding.src, randomBuilding.w, randomBuilding.h);
        this.tolerance = 3;
        console.log(this.h);
        console.log(this.s * this.pieces);
    }

    draw(time) 
    {
        ctx.drawImage(this.image, // Image
            0, // Source X
            this.s*(this.p - this.pieces), // Source Y
            this.w, // Source width
            this.s*this.pieces, // Source heigth
            this.x, // Dest X
            this.y, // Dest Y
             this.w, // Dest width 
             (this.s * this.pieces)); // Dest heigth
    }
    
    update(time)
    {
        this.y = 710 - (this.s * this.pieces); 
        this.h = this.s * this.pieces;
    }

    collides(obj)
    {
        return !((obj.x + obj.width) < this.x || this.x + this.w < obj.x) && 
        !(obj.y + obj.height < this.y || this.y + this.h < obj.y);
    }

    planeCollides(obj)
    {
        return !( (obj.x + obj.width) < this.x || this.x + this.w < obj.x) && 
        !((obj.y + obj.height) < this.y || this.y + this.h < obj.y);
    }
}

var lastTimestamp = 0;
const game = new Game();

var xd = null;

function run(time) {
    game.step(time);
    if (!game.died)
    {
        xd = setTimeout(() => { requestAnimationFrame(run)}, 140);
    }
    else 
    {
        game.stop();
    }
}

function start()
{
    clearInterval(xd);
    game.start();
    requestAnimationFrame(run);
}