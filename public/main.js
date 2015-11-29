socket = io();


$('#acceptRequestButton').click(function(){

    $("#privateChatModal").modal('hide');

    acceptPrivateChat(acceptUser);

});


$("#newRoomSubmit").submit(function(){
  var roomId = $("#newRoom").val();
  if(roomId)
  {
    $('#addRooms').collapse('hide');
    $("#newRoom").css('border-color','none');
    socket.emit('addRoom',roomId);
  }
  else
  {
      $("#newRoom").css('border-color','red');
  }
  return false;
});


$('#sendMessageForm').submit(function(){
  socket.emit('chatMessage', $('#messageByUser').val());
  $('#messageByUser').val('');
  return false;
});

$('#idChatRoomButton').click(function(){
  socket.emit('getRooms', '/rooms');
  return false;
  });


$("#loginName").focus(function(){
  $("#loginName").css('border-color','');
});

$('#enterLoginNameForm').submit(function(){
  userName = $('#loginName').val();
  if(userName)
  {
    socket.emit('newUser', userName);
    $('#loginName').val('');
    $("#userLoggedIn").html("Logged in as: " + userName);
    return false;
  }
  else
  {
    $("#loginName").css('border-color','red');
    return false;
  }
});

// Incoming data
socket.on('httpConnection', function(msg){

  if(msg.indexOf("=>")!= -1)
  {
    msg = msg.substring(0,msg.indexOf("=>"));
  }

  $('#messages').append(msg + "\n");
  messsagesArea = document.getElementById('messages');
  messsagesArea.scrollTop = messsagesArea.scrollHeight;


  if(msg.indexOf("<= Sorry, name taken") != -1)
  {
    $("#userLoggedIn").html("");
    $("#loginName").css('border-color','red');
    $("#nameExistsId").removeClass('hidden');
  }
  else
  {
    $('#myModal').modal('hide');
  }
  
  if(msg.indexOf("<= Entering room") != -1)
  {
    msg = msg.replace("end of list.","");
    var msgSplit = msg.split("<=");

    var items = [];

    $.each(msgSplit, function(i, item) {

            item = item.trim();
            if(item && item.length != 0)
            {
              if(item.indexOf('Entering room') == -1)
              {
                if(item.indexOf('(') == -1)
                {
                  var val = item.replace("*" , "");
                  items.push('<li>Request Private Chat <a style="margin:10px" class="btn btn-success btn-xs" href="#" role="button" onclick="requestPrivateChat(this.text)">' + val + '</a></li>');
                }
              }
            }
     });  

     $('#idUserList').html( items.join('') ); 
     $('#collapseUsers').collapse('show');

  }

  if(/.*<= .* is requesting a private chat.*/.test(msg) == true) 
  {
        msgSplit = msg.split(" ");
        acceptUser = msgSplit[1].trim();
        $("#privateChatRequest").html('<b>' + acceptUser + "</b> is requesting a private chat...");
        $("#privateChatModal").modal('show');
  }

  if(/.*<= .* accepted your private chat request.*/.test(msg) == true) 
  {
        msgSplit = msg.split(" ");
        acceptUser = msgSplit[1].trim();
        updatePrivateChat();
  }

  if(/.*<= .* private chat ended..*/.test(msg) == true) 
  {
        $("#userPrivateChat").html('');
  }

  if(/.*<= .*new user joined room.*/.test(msg) == true) 
  {
        newUser = msg.split(":")[1].trim();
        item = '<li>Request Private Chat <a style="margin:10px" class="btn btn-success btn-xs" href="#" role="button" onclick="requestPrivateChat(this.text)">' + newUser + '</a></li>';  

        $('#idUserList').html( $('#idUserList').html() + item );
        
  }

  if(msg.indexOf("<= Active chat")!= -1)
  {
    
    msg = msg.replace("end of list.","");
    
    var msgSplit = msg.split("<=");
    var items = [];

    $.each(msgSplit, function(i, item) {

            if(item && item.length != 0)
            {
              if(item.indexOf('Active chat rooms') == -1)
              {
                if(item.indexOf('(') != -1)
                {
                  var val = item.replace("*" , "");
                  items.push('<li>Join <a style="margin:10px" class="btn btn-success btn-sm" href="#" role="button" onclick="joinRoom(this.text)">' + val + '</a></li>');
                }
              }
            }


     });  

     $('#idChatRoomList').html( items.join('') ); 
     $('#collapseRooms').collapse('show');
  }


  if(msg.indexOf("<= Welcome") != -1)
  {
    var msgSplit = msg.split('<=');
    $("#totalUsersOnline").html(msgSplit[2].replace("=>",""));
  }

  var loggedIn = $("#userLoggedIn").html();
  if(!loggedIn || loggedIn == null || loggedIn.length == 0 )
  {
    $('#myModal').modal('show');
    $("#loginName").focus();
  }

});

function leave()
{
    socket.emit('leave' , '/leave');
    var up = $("#userPrivateChat").html();
    if(up)
    {
        $("#userPrivateChat").html('');
    }
    else
    {
      $("#userRoom").html('');
      $('#collapseUsers').collapse('hide');
    }
}

function joinRoom(room)
{
    room = room.substring(0,room.indexOf('('));
    var roomVal = $("#userRoom").html();      
    if(!roomVal)
    {
       roomVal = roomVal + '<a style="margin:10px" class="btn btn-success btn-xs" href="#" role="button" onclick="leave()">Leave</a>';

       $("#userRoom").html('In Room :' +room + roomVal);
       $("#usersDiv").removeClass('hidden');
    }
    socket.emit('joinRoom' , '/join '+room.trim());
}

function requestPrivateChat(user)
{
    user = user.trim();
    if(user)
    {
        socket.emit('requestPrivate' , user);
    }
}

function acceptPrivateChat(user)
{
    user = user.trim();
    if(user)
    {
        updatePrivateChat();
        socket.emit('acceptPrivate' , user);
    }
}

function updatePrivateChat()
{
   var userPrChat = $("#userPrivateChat").html();      
      if(!userPrChat)
      {
        userPrChat = userPrChat + '<a style="margin:10px" class="btn btn-success btn-xs" href="#" role="button" onclick="leave()">Leave</a>';

          $("#userPrivateChat").html('In Private chat with :' +acceptUser + userPrChat);
      }
}