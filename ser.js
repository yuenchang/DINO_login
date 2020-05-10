const express = require('express')
const app = express()
const port = 6554

const http = require('http').createServer(app)
const io = require('socket.io')(http)

var exist=false
var firebaseConfig = {
  apiKey: "AIzaSyCFZm71gA1VwC3gRLwgcuDPeZI-06GLxj4",
  authDomain:"test1-20b63.firebaseapp.com",
  databaseURL: "https://test1-20b63.firebaseio.com/",
  projectId: "test1-20b63",
  storageBucket: "test1-20b63.appspot.com",
  messagingSenderId: "115050522172",
  appId: "1:115050522172:web:2a21552bce3355b3df0539",
  measurementId: "G-2FSBV0C1TM"
}
var firebase = require('firebase');
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

http.listen(port, () => {
  console.log(`port: ${port}`)
  
})





app.use(express.static(`${__dirname}/dist`))

app.get('/register', (req, res) => {
  
  var search2 = 'user_num/';
  database.ref(search2).once('value',v=>{
    var user_num = v.val();
    user_num++;
    var input = {
      //處理register傳來的資料
      password:req.query.password,
      parent_password: req.query.parent_password,
      birthday: req.query.birthday,
      nickname: req.query.nickname,
      letter: '', 
      score: 0
    }      
    // 將register資料寫入資料庫
    var reff = database.ref('account/'+req.query.id);
    reff.set(input);

    database.ref(search2).set(user_num++);
  });
})

app.get('/login',(req, res) =>{
  database.ref('account/'+req.query.name+'/password/').once('value',v=>{
    if(v.val()==req.query.password){
	  database.ref('account/'+req.query.name+'/').once('value',data=>{
		if(data.val()!=null){
			var pwd = data.val().parent_password
			var nickname = data.val().nickname
			var birthday = data.val().birthday
			console.log(typeof(nickname))
			console.log(nickname)
      res.send(`
        {
            "text": "<h1> choose your identity </h1>",
            "pwd": "${pwd}",
            "nickname": "${nickname}",
            "birthday": "${birthday}",
            "exist": true
        }
      `)
		}
	});
    }
    else{
      res.send(`
        {
          "text": "wrong password or name!",
          "exist": false
        }
      `)
    }
  });
})


io.on('connection', function(socket) {
    /*是否是新用户标识*/
    var isNewPerson = true;
    /*当前登录用户*/
    var username = null;
    /*监听登录*/
    socket.on('login', function(data) {
          for (var i = 0; i < users.length; i++) {
                  if (users[i].username === data.username) {
                            isNewPerson = false
                            break;
                          } else {
                                    isNewPerson = true
                                  }
                }
          if (isNewPerson) {
                  username = data.username
                  users.push({
                            username: data.username
                          })
                  /*登录成功*/
                  socket.emit('loginSuccess', data)
                  /*向所有连接的客户端广播add事件*/
                  io.sockets.emit('add', data)
                } else {
                        /*登录失败*/
                        socket.emit('loginFail', '')
                      }
        })

    /* SHAKE以下是廢物 */ 
    socket.on('shake', function(data) {
          console.log('搖呀'+data.username);
          var e = true;
          for (var i = 0; i < shakers.length; i++) {
                  if (shakers[i].username === data.username) {
                            e = false
                            break;
                          }
                }
          if(e){
                  shakers.push({
                            username: data.username
                          })
                  s++;
                }
          if(s==2){
                  io.sockets.emit('receiveMessage', { username: 'SERVER', message: 'EGG' });
                  s=0
                  shakers=[]
                }
      })


    socket.on('sendMessage', function(data) {
      console.log('target is '+data.target);
      io.sockets.emit('receiveMessage', data);
        })
    /* 廢物結束 */
    
    /* 當故事講完，顯示出蛋蛋 */
    socket.on('end_story', function(data){
      console.log("story end");
      io.sockets.emit('appear_egg', data);
    })  

    /********************************** 這邊以後是信件的code *************************************/
    socket.on('send_letter', function(data){
      console.log(data);


      //database.ref('account/'+data.ID+'/').once('value',data=>{
      var reff = database.ref('account/'+data.ID);
      database.ref('account/'+data.ID).once('value',db=>{
        var letters;
        if(db.val().letter){
          letters = db.val().letter;
        }else{
          letters = [];
        }
        
        var d = new Date();
        var n = d.getMonth();
        n = n+1;
        var date = n + "/" + d.getDate();
        console.log(date);

        letters.push({
          content:data.Letter,
          date: date,
          read:false,
          letter_id: db.val().letter.length
        })

        var input = {
          password:db.val().password,
          parent_password: db.val().parent_password,
          birthday: db.val().birthday,
          nickname: db.val().nickname,
          letter: letters
        }
        reff.set(input);
        console.log(letters)
      });
    })

  // check database 有沒有未讀信件
    socket.on('check_letter', function(data){  
      database.ref('account/'+data.ID).once('value',db=>{
        for(var i=0; i< db.val().letter.length; i++)
        {
          if(db.val().letter[i].read == false)
          {
            socket.emit('letter_unread', data);
            break;
          }
        }
      });
    })

    // 傳給client沒有讀過得信件內容
    socket.on('give_me_letter', function(data){
      var letters = [];
      database.ref('account/'+data.ID).once('value',db=>{
        var j = 0;
        for(var i=0; i< db.val().letter.length; i++)
        {
          if(db.val().letter[i].read == false)
          {
            letters.push({
              content:db.val().letter[i].content,
              date: db.val().letter[i].date,
              letter_id: db.val().letter[i].letter_id
            });

            //socket.emit('letter_unread', data);
            //break;
          }
        }
        console.log(letters);
        socket.emit('give_you_letter', {ID:data.ID, Letters:letters});
      });
    })

    socket.on('score_letter', function(data){
      //console.log(data.score);
      database.ref('account/'+data.ID+'/letter/'+data.letter_id+'/read').set(true);

      database.ref('account/'+data.ID+'/score').once('value',db=>{
        var s = db.val();
        s+=data.score;
        database.ref('account/'+data.ID+'/score').set(s);
      });
    })

    /* 信件結束 */
    
}) //connection
