const app = require('express')()
const fs=require('fs')
const firebase=require('firebase');

porthttp=process.env.PORT || 3000;

function render(filename, params={}) {
    var data = fs.readFileSync(filename, 'binary');
    for (var key in params) {
      data = data.replace('{' + key + '}', params[key]);
    }
    return data;
}

var config = {
    databaseURL: "https://game-62ae8-default-rtdb.firebaseio.com/",
};

var range=600;
var psize=40;
var bsize=16;
var tfps=25;
var pspeed=0.15*tfps;
var bspeed=0.6*tfps;
var players={};
var status={};
var bdirsofp={};
var serverid=Math.floor((Math.random()*10000)).toString();
firebase.initializeApp(config);
var database = firebase.database();
serverroot=database.ref('/'+serverid);

app.get('/', (req, res) => {
    res.send(render('index.html'));
})
app.get('/play',(req,res)=>{
    res.send(render('play.html'))
})

app.get('/id',(req,res)=>{
    var name=req.query.name
    if(name in players){
        res.send('fail');
        return; 
    }
    players[name]={
        "x":Math.floor(Math.random()*(range-psize)),
        "y":Math.floor(Math.random()*(range-psize)),
        "bullets":[]
    }
    status[name]={
        "left":false,
        "right":false,
        "top":false,
        "bottom":false,
        "click":{
            "check":false,
            "x":0,
            "y":0
        }
    }
    bdirsofp[name]=[]
    player={};
    player['/players/'+name]=players[name];
    serverroot.update(player);
    res.send(serverid);
})

app.get('/players',(req,res)=>{
    var clientid=req.query.id;
    if(clientid!=serverid){
        res.send('fail');
        return;
    }
    res.send(players);
})
/** key down */

app.get('/left', (req, res) => {
    var name=req.query.name;
    var clientid=req.query.id;
    if(clientid!=serverid){
        res.send('fail');
        return;
    }
    if(!status[name]){
        res.send('died');
        return;
    }
    merge(status[name],{
        "left":true,
        "right":false
    })
    res.send("");
})
app.get('/right', (req, res) => {
    var name=req.query.name;
    var clientid=req.query.id;
    if(clientid!=serverid){
        res.send('fail');
        return;
    }
    if(!status[name]){
        res.send('died');
        return;
    }
    merge(status[name],{
        "left":false,
        "right":true
    })
    res.send("");
})
app.get('/top', (req, res) => {
    var name=req.query.name;
    var clientid=req.query.id;
    if(clientid!=serverid){
        res.send('fail');
        return;
    }
    if(!status[name]){
        res.send('died');
        return;
    }
    merge(status[name],{
        "top":true,
        "bottom":false
    })
    res.send("");
})
app.get('/bottom', (req, res) => {
    var name=req.query.name;
    var clientid=req.query.id;
    if(clientid!=serverid){
        res.send('fail');
        return;
    }
    if(!status[name]){
        res.send('died');
        return;
    }
    merge(status[name],{
        "bottom":true,
        "top":false
    })
    res.send("");
})

/** key up */

app.get('/leftUp', (req, res) => {
    var name=req.query.name;
    var clientid=req.query.id;
    if(clientid!=serverid){
        res.send('fail');
        return;
    }
    if(!status[name]){
        res.send('died');
        return;
    }
    merge(status[name],{
        "left":false
    })
    res.send("");
})
app.get('/rightUp', (req, res) => {
    var name=req.query.name;
    var clientid=req.query.id;
    if(clientid!=serverid){
        res.send('fail');
        return;
    }
    if(!status[name]){
        res.send('died');
        return;
    }
    merge(status[name],{
        "right":false
    })
    res.send("");
})
app.get('/topUp', (req, res) => {
    var name=req.query.name;
    var clientid=req.query.id;
    if(clientid!=serverid){
        res.send('fail');
        return;
    }
    if(!status[name]){
        res.send('died');
        return;
    }
    merge(status[name],{
        "top":false
    })
    res.send("");
})
app.get('/bottomUp', (req, res) => {
    var name=req.query.name;
    var clientid=req.query.id;
    if(clientid!=serverid){
        res.send('fail');
        return;
    }
    if(!status[name]){
        res.send('died');
        return;
    }
    merge(status[name],{
        "bottom":false
    })
    res.send("");
})

/** click */

app.get('/click', (req, res) => {
    var name=req.query.name;
    var clientid=req.query.id;
    if(clientid!=serverid){
        res.send('fail');
        return;
    }
    if(!status[name]){
        res.send('died');
        return;
    }
    var click=status[name].click
    var x=parseInt(req.query.x);
    var y=parseInt(req.query.y);
    click.check=true;
    click.x=x;
    click.y=y;
    res.send("");
})

app.listen(porthttp,() => {
    console.log('http://127.0.0.1:3000/')
    console.log(serverid);
    update();
})

function movecheck(){
    var list=[];
    for(var name in status){
        var st=status[name];
        if(st.left)list.push(name)
        else if(st.right)list.push(name);
        else if(st.top)list.push(name);
        else if(st.bottom)list.push(name);
    }
    return list;
}
function clickcheck(){
    var list=[];
    for(var name in status){
        var st=status[name];
        if(!st)continue;
        if(!st.click)continue;
        if(st.click.check)list.push(name);
    }
    return list;
}
function moveapply(changeset,namelist){
    for(var i in namelist){
        var name=namelist[i];
        var st=status[name];
        var player=players[name];
        if(st.left==true){
            player.x-=pspeed;
            if(player.x<0)player.x=0;
        }
        if(st.right==true){
            player.x+=pspeed;
            if(player.x>range-psize)player.x=range-psize;
        }
        if(st.top==true){
            player.y-=pspeed;
            if(player.y<0)player.y=0;
        }
        if(st.bottom==true){
            player.y+=pspeed;
            if(player.y>range-psize)player.y=range-psize;
        }
        insertJson(changeset,'players/'+name,player);
    }
}
function clickapply(changeset,namelist){
    for(var i in namelist){
        var name=namelist[i];
        let player=players[name];
        let st=status[name];
        let p0=[player.x+psize/2-bsize/2,player.y+psize/2-bsize/2]
        let p1=[st.click.x-bsize/2,st.click.y-bsize/2]
        let x=(p1[0]-p0[0])
        let y=(p1[1]-p0[1])
        let dis=Math.sqrt(x*x+y*y)
        if(!player.bullets)player.bullets=[]
        player.bullets.push({
            "x":p0[0],
            "y":p0[1]
        })
        if(!bdirsofp[name])bdirsofp[name]=[]
        bdirsofp[name].push({
            "x":x/dis*bspeed,
            "y":y/dis*bspeed
        })
        st.click.check=false;
        insertJson(changeset,'players/'+name+'/bullets',player.bullets)
    }
}
function bapply(changeset){
    for(var name in bdirsofp){
        let player=players[name];
        var bullets=player.bullets;
        var bdirs =bdirsofp[name]
        if(bullets.length){
            for(var i=0;i<bullets.length;i++){
                bullets[i].x+=bdirs[i].x
                bullets[i].y+=bdirs[i].y
                if(bullets[i].x<-bsize||bullets[i].y<-bsize||bullets[i].x>range||bullets[i].y>range){
                    bullets.splice(i,1);
                    bdirs.splice(i,1);
                    i--;
                }
            }
            if(bullets.length)insertJson(changeset,'players/'+name+'/bullets',bullets)
            else insertJson(changeset,'players/'+name+'/bullets',false)
        }
    }
}

function removeapply(changeset){
    for(var name in bdirsofp){
        let player=players[name];
        var bullets=player.bullets;
        if(bullets.length){
            for(var i=0;i<bullets.length;i++){
                for(var n2 in players){
                    if(n2==name)continue;
                    let p2=players[n2];
                    if(bullets[i].x>p2.x-bsize&&bullets[i].x<p2.x+psize)
                        if(bullets[i].y>p2.y-bsize&&bullets[i].y<p2.y+psize){
                            delete players[n2];
                            delete status[n2];
                            delete bdirsofp[n2];
                            insertJson(changeset,'players/'+n2,false);
                        }
                }
            }
        }
    }
}
function merge(a,b){
    for(var i in b){
        a[i]=b[i];
    }
}

function update(){
    var movelist=movecheck();
    var clicklist=clickcheck();
    var changeset={};
    var flag=false
    if(movelist.length)flag=true;
    else if(clicklist.length)flag=true;
    else flag=bck();
    if(flag){
        moveapply(changeset,movelist);
        clickapply(changeset,clicklist);
        bapply(changeset);
        removeapply(changeset);
        serverroot.child('players').set(changeset['players']);
    }
    setTimeout(update,tfps);
}

function bck(){
    for(var bn in bdirsofp){
        if(bdirsofp[bn].length){
            return true;
        }
    }
    return false;
}

function insertJson(set,path,value){
    var arr=path.split('/');
    now=set;
    for(var i in arr){
        console.log(arr[i]);
        if(i==arr.length-1){
            now[arr[i]]=value;
            break;
        }
        if(now[arr[i]])now=now[arr[i]];
        else{
            now[arr[i]]={};
            now=now[arr[i]];
        }
    }
}