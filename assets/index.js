const canvas = document.getElementById("maingame");
const ctx = canvas.getContext("2d");

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
        this.name = name;
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

    update(time, scale)
    {
        this.x += this.vx;
        this.y += this.vy
    }

    draw(time, scale) 
    {
        ctx.drawImage(this.image, this.x*scale, this.y*scale, this.width*scale, this.height*scale);
        //ctx.beginPath();
        //ctx.rect(this.x, this.y, this.width, this.height);
        //ctx.stroke();
    }

    collides(obj, scale)
    {
        return !(obj.x*scale + obj.width - obj.tolerance < this.x*scale + this.tolerance || this.x*scale + this.width - this.tolerance < obj.x*scale + obj.tolerance) && 
        !(obj.y*scale + obj.height - obj.tolerance < this.y*scale  + this.tolerance || this.y*scale + this.height -this.tolerance < obj.y*scale + obj.tolerance);
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
        this.speed = 4;
        this.sources = [
            craft_img("assets/plane1.png", 64, 18),
            craft_img("assets/plane2.png", 64, 18)
        ];
        this.currentImage = 0;
        this.deltaAnime = 200;
        this.lastChange = 0;
        this.deathSound = new Audio("assets/explosion.mp3");
    }

    draw(time, scale) 
    {
        try
        {
            ctx.drawImage(this.image, this.x*scale, this.y*scale, this.width*scale, this.height*scale);
        }
        catch{}
    }

    update(time, scale)
    {
        //this.gnd = canvas.height - (canvas.height/100)* this.groundline;
        this.x += this.speed;
        if (this.x*scale >= canvas.width)
        {
            this.y += 10;
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
                this.first_resize();
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
            window.onresize = (e)=> {
                clearTimeout(this.doit);
                this.doit = setTimeout((e)=> {
                    this.resize_canvas(e);
                }, 500);
            };            
            this.scale = 1;
            this.doit = "";
            this.buildings = new ListFactory();
            //new Building(canvas.width/2, canvas.height/2);
            this.player = new Player(-30, 10, 21, 6, 10);
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

        first_resize(e)
        {
            this.oldsize = canvas.width;
            this.resize_canvas(e);
        }

        resize_canvas(e)
        {
            canvas.width = window.innerWidth*0.49;
            canvas.height =  (canvas.width/16) * 9;
            if (canvas.height > window.innerHeight)
            {
                canvas.height = window.innerHeight*0.49;
                canvas.width = (canvas.height/9)*16;
            }
            if (this.oldsize > canvas.width)
            {
                this.scale = this.oldsize/canvas.width;
            }
            else 
            {
                this.scale = canvas.width/this.oldsize;
            }
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
            this.player = new Player(-30, 40, 21, 6, 10);
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
            if (this.buildings.empty() && !this.tped && this.player.x*this.scale >= canvas.width-this.player.width*this.scale)
            {
                this.tped = true;
                this.player.x = -10;
                this.player.y = (canvas.height - this.player.height*this.scale*2)/this.scale;
            }
            this.player.update(time, this.scale);
            if (this.bomb){
                this.bomb.update();
                this.buildings = this.buildings.reduce(
                    (b, a) => {
                        if (this.bomb && b.collides(this.bomb, this.scale*0.4))
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
                if (this.bomb && this.bomb.y*this.scale >= canvas.height)
                {
                    this.bomb = undefined;
                }
            }
            this.buildings.visit(b => {
                if (b.planeCollides(this.player, this.scale*0.4))
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
                b.update(time, this.scale*0.4);
            });
            if ((this.player.y*this.scale) >= (canvas.height-(this.player.height*this.scale*2)) && (this.player.x*this.scale >= canvas.width-(this.player.width*this.scale*2)))
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
            this.player.draw(time, this.scale);
            if (this.bomb)
            { 
                this.bomb.draw(time, this.scale); 
            }
            this.buildings.visit(b => {
                b.draw(time, this.scale*0.4);
            });
            ctx.textBaseline = "bottom";
            ctx.font = "35px VT323";
            ctx.fillStyle = "#901ccc";
            ctx.drawImage(this.scoreImg, 30, 30, this.scoreImg.width*this.scale*0.3, this.scoreImg.height*this.scale*0.3);
            ctx.fillText(this.points, 40+this.scoreImg.width*this.scale*0.3, 53);
            ctx.drawImage(this.bestImg, canvas.width-(this.bestImg.width*(this.scale*0.7)), 28, this.bestImg.width*this.scale*0.3, this.bestImg.height*this.scale*0.3);
            ctx.textBaseline = "bottom";
            ctx.font =  "35px VT323";
            ctx.fillStyle = "#901ccc";
            ctx.fillText(this.highScore, canvas.width-40*this.scale, 50);
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
        super("assets/bomb.png", x, y, 16, 16, 0, 10);
        this.sound = new Audio("assets/bomb.mp3");
        this.sound.cloneNode().play();
    }

    draw(time, scale) 
    {
        ctx.drawImage(this.image, this.x*scale, this.y*scale, this.width*scale/3, this.height*scale/3);
    }
}

class Building
{
    constructor (x)
    {
        let aviableBuildings = [
            {src: "assets/building1.png", w: 28, h: 48, p: 2},
            {src: "assets/building2.png", w: 28, h: 176, p: 7},
            {src: "assets/building3.png", w: 28, h: 96, p: 3},
            {src: "assets/building4.png", w: 28, h: 112, p: 6},
            {src: "assets/building5.png", w: 28, h: 64, p: 3},
            {src: "assets/building6.png", w: 28, h: 128, p: 5},
        ]
        let randomBuilding = aviableBuildings[Math.floor(Math.random() * aviableBuildings.length)];
        this.x = x;
        this.y = canvas.height*0.2;
        this.w = randomBuilding.w;
        this.h = randomBuilding.h;
        this.p = randomBuilding.p;
        this.s = this.h/this.p;
        this.pieces = randomBuilding.p;
        this.image = craft_img(randomBuilding.src, randomBuilding.w, randomBuilding.h);
        this.tolerance = 3;
    }

    draw(time, scale) 
    {
        ctx.drawImage(this.image, 
            0, 
            this.s*(this.p - this.pieces),
            this.w,
            this.s*this.pieces,
            this.x*scale,
            this.y,
             this.w*scale, 
             (this.s * this.pieces)*scale);
    }
    
    update(time, scale)
    {
        this.y = canvas.height - (((this.s * this.pieces) + 12)*scale); 
        this.h = this.s * this.pieces;
    }

    collides(obj, scale)
    {
        let nScale = (scale/0.4);
        return !(((obj.x*nScale) + (obj.width*(nScale/3))) < this.x*scale || this.x*scale + this.w*scale < (obj.x*nScale)) && 
        !((obj.y*nScale) + (obj.height * (nScale/3)) < this.y || this.y + this.h*scale < (obj.y*nScale));
    }

    planeCollides(obj, scale)
    {
        let nScale = (scale/0.4);
        return !( (obj.x + obj.width) * nScale < this.x*scale || this.x*scale + this.w*scale < (obj.x*nScale)) && 
        !((obj.y + obj.height) * nScale < this.y || this.y + this.h*scale < (obj.y*nScale));
    }
}

var lastTimestamp = 0;
const game = new Game();

function run(time) {
    game.step(time);
    if (!game.died)
    {
        setTimeout(() => { requestAnimationFrame(run)}, 50);
    }
    else 
    {
        game.stop();
    }
}

function start()
{
    game.start();
    requestAnimationFrame(run);
}