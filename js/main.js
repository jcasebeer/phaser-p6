window.onload = function() 
{
    "use strict";
    
    var game = new Phaser.Game( 640, 480, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update } );
    game.antialias = false;

    // create a list to store our game entities
    var ents = [];


    var colors = [0xff0000,0x00ff00,0x0000ff];

    var screen_shake = 0;

    var CAMX = 0;
    var CAMY = 0;

    // variables used to store keypresses
    var upKey, downKey, leftKey, rightKey, shootKey, rKey;


    var snd_splat,snd_ping,snd_no;

    //Define some useful functions

    function array2d(xsize,ysize,val)
    {
        var array = [];
        for(var i = 0; i<xsize; i++)
        {
            array[i] = [];
        }

        for (var x=0; x<xsize; x++)
            for(var y=0; y<ysize; y++)
                array[x][y] = val;

        return array;
    }

    function clamp(val,min,max)
    {
        if (val<min)
            return min;
        if (val>max)
            return max;
        return val;
    }

    function randomInt(max)
    {
        var i = Math.random()*(max+1)
        return ~~(i);
    }

    function choose(choices)
    {
        var index = ~~(Math.random()*choices.length);
        return choices[index];
    }

    function degstorads(degs) 
    //Given Degrees, Return Radians
    {
        return degs * (Math.PI/180);
    }

    function lengthdir_x(len,dir)
    //given a length and an angle (in Degrees), return the horizontal (x) component of 
    //the vector of the angle and direction
    {
        return len * Math.cos(degstorads(dir));
    }

    function lengthdir_y(len,dir)
    // Performs the same function as lengthdir_x, but returns the vertical component
    {
        return len * Math.sin(degstorads(dir));
    }

    function point_distance(x1,y1,x2,y2) 
    // Returns the distance between two points
    // will be used to perform circle collisions
    {
        var xdif = x1-x2;
        var ydif = y1-y2;
        return Math.sqrt(xdif*xdif+ydif*ydif);
    }

    function point_direction(x1,y1,x2,y2)
    // return as a degree the angle between two points
    {
        var xdif = x2 - x1;
        var ydif = y2 - y1;

        return Math.atan2(ydif,xdif)*180 / Math.PI;
    }

    var SEED;
    function rand()
    // random number generator for javascript that I found on stackoverflow,
    // because you apparently can't seed javascripts built in rng
    // found here: http://stackoverflow.com/questions/521295/javascript-random-seeds
    {
        var rand = Math.sin(++SEED)*10000;
        return rand - Math.floor(rand);
    }

    function szudzkik(x,y)
    // pairing function
    {
        if (x<y)
            return y*y+x;
        else
            return x*x+x+y;
    }

    function createImage(x,y,spr)
    {
        var i = game.add.image(x,y,spr);
        i.anchor.setTo(0.5,0.5);
        //i.scale.setTo(2,2);

        return i;
    }

    function entityCreate(ent)
    //adds an entity to the entity list 
    {
        var i = ents.push(ent);
        ent.id = i-1;
    }

    function entityDestroy(i)
    // destroys the entities Phaser image and removes it from the entity list
    {
        ents[i].destroy();
        ents[i].ph.destroy();
        ents.splice(i,1);
    }

    function entityDestroyId(id)
    {
        ents[id].destroy();
        ents[id].ph.destroy();
        ents.splice(id,1);
    }

    function entity(x,y,sprite)
    {
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.radius = 8;
        this.alive = true;
        this.visible = true;
        this.id = 0;

        this.ph = game.add.image(this.x,this.y,this.sprite);
        this.ph.anchor.setTo(0.5);
        //this.ph.scale.setTo(2,2);

        this.step = function(){}

        this.destroy = function(){}

        this.draw = function()
        {
            this.ph.x = this.x;
            this.ph.y = this.y;
        }
    }

    

    function guy(x,y)
    {
        var parent = new entity(x,y,'face');
        for (var i in parent)
            this[i] = parent[i];

        this.frame = 0;
        this.lastx = this.x;
        this.lasty = this.y;

        this.xdif = 0;
        this.ydif = 0;
        this.speed = 3;

        this.parts = [
            createImage(this.x,this.y,'hat'),
            createImage(this.x,this.y+16,'shirt'),
            createImage(this.x,this.y+32,'pants'),
        ];

        this.c = [choose([0,1,2]),choose([0,1,2]),choose([0,1,2])];

        this.parts[0].tint = colors[this.c[0]];
        this.parts[1].tint = colors[this.c[1]];
        this.parts[2].tint = colors[this.c[2]];

        this.step = function()
        {

            this.lastx = this.x;
            this.lasty = this.y;

            this.x+=2;

            

            if (this.x>1640)
            {
                this.alive = false;
            }
            

            this.xdif = this.x - this.lastx;
            this.ydif = this.y - this.lasty;
           
        }

        this.draw = function()
        {
            this.ph.x = this.x;
            this.ph.y = this.y;

            for (var i=0; i<3;i++)
            {
                this.parts[i].x+=this.xdif;
                this.parts[i].y+=this.ydif;
            }
        }

        this.destroy = function()
        {
            for (var i =0; i<3; i++)
            {
                this.parts[i].destroy();
            }
        }

    }

    function preload() 
    {
        game.load.image('face','assets/face.png');
        game.load.image('hat','assets/hat.png');
        game.load.image('shirt','assets/shirt.png');
        game.load.image('pants','assets/pants.png');
        game.load.image('phone','assets/phone.png');
        game.load.image('tile','assets/background.png');
        game.load.image('crosshair','assets/crosshair.png');

        game.load.spritesheet('nurses','assets/nurses.png',32,32);
        game.load.spritesheet('organs','assets/organs.png',32,32);

        game.load.audio('snd_splat','assets/splat.ogg',true);
        game.load.audio('snd_no','assets/no.ogg',true);
        game.load.audio('snd_ping','assets/ping.ogg',true);

    }

    function randomColorCombo()
    {
        return [choose([0,1,2]),choose([0,1,2]),choose([0,1,2])];
    }

    var text;
    var colorTarget = randomColorCombo();
    var colorText = ["RED","GREEN","BLUE"];
    var floor;
    var crosshair;
    var phone;
    function create() 
    {
        game.stage.backgroundColor = '#008888';
        floor = game.add.bitmapData(640,480);
        floor.smoothed = false;
        floor.addToWorld();
        game.world.setBounds(0,0,2000,2000);
        game.camera.x = 0;
        game.camera.y = 0;

        game.add.tileSprite(0,0,1640,2000,'tile');
    
         // assign keys to our input variables
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        shootKey = game.input.keyboard.addKey(Phaser.Keyboard.X);
        rKey = game.input.keyboard.addKey(Phaser.Keyboard.R)

        game.input.keyboard.addKeyCapture(Phaser.Keyboard.UP);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.DOWN);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.LEFT);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.RIGHT);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.X);

        //sounds
        snd_splat  = game.add.audio('snd_splat');
        snd_splat.allowMultiple = true;

        snd_ping  = game.add.audio('snd_ping');
        snd_ping.allowMultiple = true;

        snd_no  = game.add.audio('snd_no');
        snd_no.allowMultiple = true;

        
        crosshair = game.add.image(0,0,'crosshair');
        phone = game.add.image(0,480,'phone');
        phone.anchor.setTo(0,1);
        phone.scale.setTo(2,2);

        //text
        text = game.add.text(16,470,"", {
            font: "16px Courier New",
            fill: "#ffffff",
            align: "left"
        });
        text.anchor.setTo(0,1);

    
        text.setText("HAT: "+colorText[colorTarget[0]]+"\tSHIRT: "+colorText[colorTarget[1]]+"\tPANTS: "+colorText[colorTarget[2]]);
    }
    
    var time = 0;
    var can_shoot = true;
    function update() 
    {   

        if (upKey.isDown)
            CAMY-=4;

        if (downKey.isDown)
            CAMY+=4;

        if (leftKey.isDown)
            CAMX-=4;

        if (rightKey.isDown)
            CAMX+=4;

        if (rKey.isDown)
            location.reload();

        if (shootKey.isDown)
        {
            if (can_shoot)
            {
                screen_shake +=32;
                var i = ents.length
                while(i--)
                {
                    if (ents[i].alive)
                        if ( point_distance(game.camera.x+320,game.camera.y+240,ents[i].x,ents[i].y+32) < 36 )
                        {
                            ents[i].alive = false;


                            if (JSON.stringify(ents[i].c) === JSON.stringify(colorTarget))
                            {
                                text.setText("GOOD JOB!");
                            }
                            else
                            {
                                text.setText("WRONG DUDE! PRESS R TO RESTART");
                            }

                            break;
                        }
                }
                can_shoot = false;
            }
        }
        else
        {
            can_shoot = true;
        }

        if (CAMX<0)
            CAMX = 0;
        if (CAMY<0)
            CAMY = 0;
        if (CAMX>2000)
            CAMX = 2000;
        if (CAMY>2000)
            CAMY = 2000;
        
        var i = ents.length;
        while (i--)
        {
            ents[i].step();

            if (ents[i].alive === false)
                entityDestroy(i);
        }

        if (Math.random()<0.1)
            entityCreate(new guy(-100,200+Math.random()*1400) );

        if (screen_shake>64)
            screen_shake = 64;

        game.camera.x = CAMX+Math.random()*screen_shake - screen_shake/2;
        game.camera.y = CAMY+Math.random()*screen_shake - screen_shake/2;

        crosshair.x = game.camera.x;
        crosshair.y = game.camera.y;
        crosshair.bringToTop();

        phone.x = game.camera.x;
        phone.y = game.camera.y+480;
        phone.bringToTop();

        text.x = game.camera.x+32;
        text.y = game.camera.y+480;
        game.world.bringToTop(text);

        if (screen_shake>0)
            screen_shake--;
        else
            screen_shake = 0;

        i = ents.length;
        while (i--)
        {
            if (ents[i].visible)
                ents[i].draw();
        }

    }
}