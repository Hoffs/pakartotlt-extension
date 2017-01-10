$(document).ready(function () {
    if ($(".d_button").length == 0) {
      addButtons();
    }
});

//Functions for funciontality (thats sounds good)
function downloadSong(uid) {
  $.post( "https://www.pakartot.lt/api/backend/frontend/player/play.php", { type: "tid", id: uid})
    .done(function(data) {
      json = JSON.parse(data);
      fileUrl = json['info']['filename'];
      songName = json['info']['artist'].substr(1, json['info']['artist'].length) + " - " + json['info']['title'] + ".mp3";
      snackbar(songName);
      fetch(fileUrl)
      .then(function(response) {
        return response.blob();
      })
      .then(function(myBlob) {
        saveAs(myBlob, songName);
      });
    });
}

// Snackbar Function

function snackbar(text) {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar")
    x.innerText = "Palaukite kol siunčiama daina " + text + ".";
    // Add the "show" class to DIV
    x.className = "show";

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}



// Listening for URL changes to add download buttons.
function addButtons() {
  $(".play").each(function(data) {
    trackid = $(this).children("a").data("id");
    if (trackid) {
      var button = $('<button data-id="' + trackid + '" type="button" title="Atsisiųsti" class="d_button"><i class="fa fa-download" style="font-size: 1.6em; margin-left: -0.5px;" aria-hidden="true"></i></button>');
      $(this).append(button);
    }
  });
  $(".d_button").click(function () {
    uid = $(this).data("id");
    downloadSong(uid);
  });
  if ($("#snackbar").length == 0) {
    var el = document.createElement("div");
    el.id = "snackbar";
    el.innerText = "";
    document.body.appendChild(el);
  }
}

var oldURL= ""
var urlChangeHandler = window.setInterval(checkURLChange, 200)
function checkURLChange(){
  newURL = document.URL;
  if(newURL !== oldURL){
   addButtons();
   oldURL = newURL;
  }
}
