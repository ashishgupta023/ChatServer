//TCP Server
var maps = require('hashmap')
var net = require('net');
var HOST = 'localhost';
var PORT = 9399;
var SERVER_IN = "<= "
var USER_IN = "=> "
var server = net.createServer();

var sockets = []; // Store user sockets
var userNames = []; // store user names
var userStates = []; // 0 -> new user 1-> User added with name 2-> User in a chat room 3-> User in room, in private chat
var userChatRoom = new maps.HashMap(); // user to chatRoom mapping
var chatRoomsMap = new maps.HashMap(); // chatRoom to users mapping
var privateChatDialogue = new maps.HashMap(); // HashMap to store private chat between two users

//Adding some chat rooms
chatRoomsMap.set("chat",null);
chatRoomsMap.set("hottub",null);
chatRoomsMap.set("minastirith",null);
chatRoomsMap.set("theHikingGroup",null);
chatRoomsMap.set("huntingForJob",null);

server.listen(PORT, HOST);

// TCP server connection
server.on('connection', function(socket) {
    sockets.push(socket);
    userStates[sockets.indexOf(socket)] = 0 ; // Initial user state is  0 -> new user
    console.log('CONNECTED: ' + socket.remoteAddress +':'+ socket.remotePort);
    socket.write(SERVER_IN + "Welcome to Chat-O \n");
    socket.write(SERVER_IN + "Login Name?\n"+USER_IN);

    socket.on('data', function(data) {
    receiveData(socket, data);
    
    });

    socket.on('end', function() {
      console.log("---- in server");
      closeSocket(socket);
    });

}).listen(PORT, HOST);

// Close the socket
function closeSocket(socket) {
  try
  {

    var i = sockets.indexOf(socket);
    if (i != -1) {

      if(userStates[i] == 3)
      {
        console.log("---- in close socket for user in private chat ");
        leavePrivateChat(socket);
        leaveRoom(socket);
        userNames.splice(i,1);
      }
      else if(userStates[i] == 2) // If user was in a room , clear all states
      {
        console.log("---- in close socket for user in chat room");
        leaveRoom(socket);
        userNames.splice(i,1);
      }
      else if(userStates[i] == 1) // if user was registered with name
      {
       userNames.splice(i,1);
      }
      userStates.splice(i,1); // remove user state
      sockets.splice(i, 1);

    }
  }
  catch(e)
  {
    console.log("Exception in close socket");
    console.log(e);
  }

}
 
// Leave Private Chat
function leavePrivateChat(socket) {
  try
  {
    var i = sockets.indexOf(socket);
    if (i != -1) {
      if(privateChatDialogue.has(userNames[i]))
      {
        var another = privateChatDialogue.get(userNames[i]);
        privateChatDialogue.remove(userNames[i]);
        userStates[i] = 2;
        if(privateChatDialogue.has(another))
        {
          privateChatDialogue.remove(userNames[i]); 
        }
        userStates[userNames.indexOf(another)] = 2;
        sockets[i].write(USER_IN);
        sockets[userNames.indexOf(another)].write("\n" + SERVER_IN + " * private chat ended.\n" + USER_IN );
      }
    }
  }
  catch(e)
  {
    console.log("Exception in leave private chat");
    console.log(e);
  } 
}

// Leave Room
function leaveRoom(socket) {

  try
  {
    var i = sockets.indexOf(socket);
    if (i != -1) {

      if(userStates[i] == 2)  // If user was in a room
      {
        console.log("---- in leaveRoom");
        var removeUserFromRoom = userChatRoom.get(userNames[i]);

        var usersInRoom = chatRoomsMap.get(removeUserFromRoom);


        if(usersInRoom.indexOf(userNames[i]) != -1)
        {
          usersInRoom.splice(usersInRoom.indexOf(userNames[i]) , 1);
        }

        usersInRoom.forEach(function(user)
        {
          console.log(user);
          sockets[userNames.indexOf(user)].write("\n" + SERVER_IN + " * user has left chat : " + userNames[i] + "\n" + USER_IN );
        });
    
        chatRoomsMap.set(removeUserFromRoom , usersInRoom );
        userChatRoom.remove(userNames[i]);
        userStates[i] = 1;

      }
      else
      {
        sockets[i].write(SERVER_IN + "Invalid command! \n" + USER_IN );
      }
    }
  }
  catch(e)
  {
    console.log("Exception in leave room");
    console.log(e);
  }
}

function timeOutCallBack(socket)
{
    try
    {
      var i = sockets.indexOf(socket);
      if(i != -1)
      {
        console.log("--Timed OUT--");
        sockets[i].write(SERVER_IN + "Your private chat request has been ignored\n" + USER_IN);
        sockets[i].setTimeout(0);
        userStates[i] = 2;
        privateChatDialogue.remove(userNames[i]);
      }
    }
    catch(e)
    {
      console.log(e);
      console.log("Time Out callback ");
    }
}

// Function called when some data is recived on a socket
function receiveData(socket, data) 
{
  tempData = cleanInput(data).split(" ");

  if(tempData[0] === "/quit") {
    socket.end('Goodbye!\n');
  }
  else if(tempData[0] === "/leave")  // Command /leave
  {
    try 
    {
      var i = sockets.indexOf(socket);
      if(i != -1)
      {
        if(userStates[i] == 3)
        {
          leavePrivateChat(sockets[i]);
        }
        else
        {
          leaveRoom(sockets[i]);
          sockets[i].write(SERVER_IN + " ** You are out of the chat room. \n " + USER_IN);
        }
      }
    }
    catch(e)
    {
      console.log("/leave Exception");
      console.log(e);
    }
  }
  else if(tempData[0] === "/rooms") // Command /rooms
  {
    try
    {
        var i = sockets.indexOf(socket);
        if(i != -1)
        {
          sockets[i].write(SERVER_IN + "Active chat rooms are:\n" );
          // Show available chat rooms
          chatRoomsMap.forEach(function(value, key) {
            var numInGroup = 0;
            if(value!= null)
              numInGroup = value.length;
           
             sockets[i].write(SERVER_IN + "*"+key+ " (" + numInGroup +")\n");
            
          });
        }
        sockets[i].write(SERVER_IN + "end of list.\n"+ USER_IN );
    }
    catch(e)
    {
      console.log("/rooms Exception");
      console.log(e);
    }
  }
  else if(tempData[0] === "/private") // Command /private
  {
    try
    {
      var i = sockets.indexOf(socket);
      if(i != -1)
      {
        if(userStates[i] == 2)
        {
          if(tempData.length == 1)
          {
            sockets[i].write(SERVER_IN + "Invalid Usage\n"+ USER_IN );
          }
          else
          {
            if(!privateChatDialogue.has(userNames[i]))
            {
              var privateChatWith = tempData[1];
              sockets[i].write("\n" + SERVER_IN +" Requesting " + privateChatWith + "... \n" + USER_IN);
              sockets[i].setTimeout(20000);
              sockets[i].on('timeout', function(data){
                  timeOutCallBack(sockets[i]);
              });
              userStates[i] = 3;
              privateChatDialogue.set(userNames[i] , privateChatWith);
              sockets[userNames.indexOf(privateChatWith)].write("\n"+SERVER_IN + userNames[i] + " is requesting a private chat\n" + USER_IN);
            }
            else
            {
              sockets[i].write(SERVER_IN + "You are already in a private chat request. Have patience !!\n"+ USER_IN );
            }
          }
        }
      }
    }
    catch(e)
    {
      console.log("/private exception");
      console.log(e);
    }
  }
  else if(tempData[0] === "/accept") // Command /accept
  {

    try
    {
      var i = sockets.indexOf(socket);
      if(i != -1)
      {
        if(userStates[i] == 2)
        {
          if(tempData.length == 1)
          {
            sockets[i].write(SERVER_IN + "Invalid Usage\n"+ USER_IN );
          }
          else
          {
              var privateChatWith = tempData[1];
              if(userStates[userNames.indexOf(privateChatWith)] == 3)
              {
                userStates[i] = 3;
                sockets[i].write("\n" + SERVER_IN + "Accepting...\n" + USER_IN);
                sockets[userNames.indexOf(privateChatWith)].setTimeout(0);
                privateChatDialogue.set(userNames[i] , privateChatWith);
                sockets[userNames.indexOf(privateChatWith)].write("\n"+SERVER_IN + userNames[i] + " accepted your private chat request\n" + USER_IN);
              }
              else
              {
                  sockets[i].write("\n" + SERVER_IN +" Invalid Usage\n" + USER_IN );
              }
            }
        }
      }
    }
    catch(e)
    {
      console.log("/accept exception");
      console.log(e);
    }
  }
  else if(tempData[0] === "/join")  // Command /join
  {

    try
    {
     var toJoin = tempData[1];
     var i = sockets.indexOf(socket);
     if(i != -1)
     {
        if(userStates[i] == 1) // Join a chat room only is user is registered with a name
        {
          if(!chatRoomsMap.has(toJoin))
          {
              sockets[i].write(SERVER_IN + "Invalid chat room!" + "\n" + USER_IN);
          }
          else
          {
              userStates[i] = 2;
              userChatRoom.set(userNames[i],toJoin);
              sockets[i].write(SERVER_IN + "Entering room :" + toJoin + "\n");
              var usersInRoom = chatRoomsMap.get(toJoin);
              if(usersInRoom)
              {
                usersInRoom.push(userNames[i]);
                chatRoomsMap.set(toJoin , usersInRoom);
                usersInRoom.forEach(function(user)
                {
                    if(user === userNames[i])
                      sockets[i].write(SERVER_IN + "*" + user + " (** This is you)\n");
                    else 
                    {
                      sockets[i].write(SERVER_IN + "*" + user + "\n");
                      sockets[userNames.indexOf(user)].write("\n" + SERVER_IN + " * new user joined room: " + userNames[i] + "\n" + USER_IN );
                    }
                });
              }
              else
              {
                  usersInRoom = [];
                  usersInRoom.push(userNames[i]);
                  chatRoomsMap.set(toJoin , usersInRoom);

                  sockets[i].write(SERVER_IN + "*" + userNames[i] + " (** this is you)\n"); 
              }
              sockets[i].write(SERVER_IN + "end of list.\n" + USER_IN );
          }
        }
        else
        {
          sockets[i].write(SERVER_IN + "You need to be out of this room to connect to another chat room\n"+USER_IN)
        }
     }
   }
   catch(e)
   {
    console.log("/join exception");
    console.log(e);
   }
  }
  else if(tempData[0] === "/addroom") // Command /addroom
  {
      try
      {
        if(tempData.length == 1)
        {
          sockets[i].write(SERVER_IN + "Invalid Usage\n"+ USER_IN );
        }
        else
        {
                if(!chatRoomsMap.has(tempData[1]))
                {
                  chatRoomsMap.set(tempData[1],null);
                }
        }
      }
      catch(e)
      {
        console.log("/addroom exception");
        console.log(e);
      }
  }
  else  // Receive all other data
  {

    try
    {
    var i = sockets.indexOf(socket);

    if (i != -1) 
    {

      if(tempData[0][0] == '/')
      {
        sockets[i].write(SERVER_IN + "Unrecognized command! \n" + USER_IN);
        return;
      }


      if(userStates[i] == 3) // In a private chat, send message to only private people
      {
          console.log("privateChatDialogue");
          var sendTo = privateChatDialogue.get(userNames[i]);
          if(userStates[userNames.indexOf(sendTo)] == 3)
          {
            if(tempData && tempData[0].length != 0)
            {
              sockets[i].write("\n" + SERVER_IN + userNames[i]+ ":" + tempData.join(" ") + "\n" + USER_IN);
              sockets[userNames.indexOf(sendTo)].write("\n" + SERVER_IN +  userNames[i] +" : " + tempData.join(" ") + "\n" + USER_IN);   
            }
            else
            {
                sockets[i].write(USER_IN);
            }
          }
          else
          {
              sockets[i].write(SERVER_IN + " PLEASE WAIT...!!");
          }
      }
      else if(userStates[i] == 2) // In a chat room, send message to everyone in chat room
      {
         console.log("message in a chat room");

         if(tempData && tempData[0].length != 0)
         {
          inMyRoom = chatRoomsMap.get(userChatRoom.get(userNames[i]));
          console.log(i + " " + userNames[i] + " " + userChatRoom.get(userNames[i]));
          inMyRoom.forEach(function(user)
          {
            if(user != userNames[i])
            {
              if(userStates[userNames.indexOf(user)] == 2 )
                sockets[userNames.indexOf(user)].write("\n" + SERVER_IN +  userNames[i] +" : " + tempData.join(" ") + "\n" + USER_IN);   
            }
            else
            {
              if(userStates[userNames.indexOf(user)] == 2 )
                sockets[userNames.indexOf(user)].write(SERVER_IN +  userNames[i] +" : " + tempData.join(" ") + "\n" + USER_IN);   
            }
          });
        }
        else
        {
            sockets[i].write(USER_IN);
        }
      }
      else
      {
        if(tempData && tempData[0].length != 0)
        {
          if(userStates[i] == 0)
          {
            if(userNames.indexOf(tempData[0]) == -1)
            {
                userNames[i] = tempData[0];
                userStates[i] = 1;
                sockets[i].write(SERVER_IN + "Welcome " + tempData[0]+ "!\n"+ SERVER_IN + "Total Users Online: " + userNames.length + "\n"+ USER_IN);
                tempData = null;
            }
            else
            {
                sockets[i].write(SERVER_IN + "Sorry, name taken.\n"+ SERVER_IN + "Login Name?\n"+ USER_IN);
                tempData= null;
            }
          }
          else if(userStates[i] == 1 ) // Inside Chat-O , message to all
          {
            for(j = 0 ; j < sockets.length ; j++)
            {
              console.log("message to all");
              if(j == i)
              {
                sockets[j].write(SERVER_IN +  userNames[i] +" : " + tempData.join(" ") + "\n" + USER_IN);   
              } 
              else
              {
                sockets[j].write("\n" + SERVER_IN +  userNames[i] +" : " + tempData.join(" ") + "\n" + USER_IN);   
              }
            }
          }
          else
          {
            sockets[i].write(USER_IN);
          }
        }
        else
        {
            sockets[i].write(USER_IN);
        }
      }
    }
  }
  catch(e)
  {
    console.log("Receiving data exception");
    console.log(e);
  }
  }
}

// function to clean incoming data
function cleanInput(data) {
  return data.toString().replace(/(\r\n|\n|\r)/gm,"");
}
/* --------------------------------------------HTTP Server------------------------------------------------------ */
// HTTP server serving a web client

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var HTTP_PORT = 3000;

app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
   res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('Somebody is connecting...');

  var tcpClient = new net.Socket();
  tcpClient.setEncoding("ascii");
  tcpClient.setKeepAlive(true);

  //Conect to TCP Server
  // HTTP Tunneling
  tcpClient.connect(PORT, HOST, function() 
  {
        tcpClient.on('data', function(data) {
            socket.emit("httpConnection", data);
        });

        tcpClient.on('end', function(data) {
            console.log('ended session');
        });
    });

 socket.on('newUser', function(userName){
    tcpClient.write(userName);
  });

 socket.on('getRooms', function(cmd){
    console.log(cmd);
    tcpClient.write(cmd);
  });

 socket.on('leave', function(cmd){
    console.log(cmd);
    tcpClient.write(cmd);
  });

 socket.on('joinRoom', function(room){
    console.log(room);
    tcpClient.write(room);
  });

  socket.on('chatMessage', function(msg){
    console.log('user sending msg');
    tcpClient.write(msg);
  });

  socket.on('requestPrivate', function(user){
    console.log('requesting private chat');
    tcpClient.write('/private '+user);
  });

  socket.on('acceptPrivate', function(user){
    console.log('accepting private chat');
    tcpClient.write('/accept '+user);
  });

  socket.on('addRoom', function(room){
    console.log('adding chat room');
    tcpClient.write('/addroom '+room);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
    tcpClient.end();
  });
 
});

http.listen(HTTP_PORT, function(){
  console.log('HTTP server listening on ' + HTTP_PORT + '...');
});

