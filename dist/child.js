var wip = "ws://" + window.location.host;
var socket = io(wip);


$(document).ready(function (){
    //這邊加上判斷stage的code
    console.log(document.cookie);
    $('#text').html("請聽" + getCookie('nickname') +  "講故事");
  });

socket.on('appear_egg', function(data){
    if (data.ID == getCookie('ID'))
    {
        //alert('appear egggg!!!!');
		$('#text').html("");
		$('#egg').html("<img src=\"./res/pic3.png\"/>");
				
    }
})
function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}