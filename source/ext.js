$(document).ready(function () {
    updatePage();
});

//Functions for funciontality (thats sounds good)
function getSongInfo(uid) {
  $.post( "https://www.pakartot.lt/api/backend/frontend/player/play.php", { type: "tid", id: uid})
    .done(function(data) {
      json = JSON.parse(data);
      var fileUrl = json['info']['filename'];
      var songName = json['info']['artist'].substr(1, json['info']['artist'].length) + " - " + json['info']['title'] + ".mp3";
      downloadStartNotification(songName);
      console.log(songName);
      downloadSong(fileUrl, songName);
    });
}

function downloadSong(url, name) {
  totalDownloads = totalDownloads + 1;
  updateDownloadToast();
  fetch(url)
  .then(function(response) {
    console.log(name);
    return response.blob();
  })
  .then(function(myBlob) {
    console.log(name);
    saveAs(myBlob, name);
    currentDownloaded = currentDownloaded + 1;
    updateDownloadToast();
  });
}

// Notifications toast
function downloadStartNotification(song) {
  $.toast({
    text : "Pradeta siųsti daina " + song + ".",
    showHideTransition : "slide",
    bgColor : "#2f2e2e",
    loader : false,
    textColor : "white",
    hideAfter : 3000,
    stack : 5,
    textAlign : "center",
    position : "bottom-right"
  });
}

// Downloading toast
var totalDownloads = 0;
var currentDownloaded = 0;
var downloadToast = undefined;

function updateDownloadToast() {
  if (typeof downloadToast == 'undefined') {
    downloadToast = $.toast({
      text : "<div class='loading' style='display: inline-flex;'></div><p style='font-size: 15px; padding-top: 5px;'>Atsiųstos " + currentDownloaded + "/" + totalDownloads + " dainos.</p>",
      showHideTransition : "slide",
      loader : false,
      bgColor : "#2f2e2e",
      textColor : "white",
      hideAfter : "false",
      textAlign : "center",
      position : "bottom-left"
    });
  } else if (totalDownloads != currentDownloaded) {
    downloadToast.update({
      text : "<div class='loading' style='display: inline-flex;'></div><p style='font-size: 15px; padding-top: 5px;'>Atsiųstos " + currentDownloaded + "/" + totalDownloads + " dainos.</p>"
    });
  } else if (totalDownloads == currentDownloaded) {
    downloadToast.update({
      text : "<div class='loading' style='display: inline-flex;'></div><p style='font-size: 15px; padding-top: 5px;'>Atsiųstos " + currentDownloaded + "/" + totalDownloads + " dainos.</p>",
      hideAfter : 5000
    });
    downloadToast = undefined;
    totalDownloads = 0;
    currentDownloaded = 0;
  }
}

// Listening for URL changes to update page.
function updatePage() {
  $(".play").each(function(data) {
    if ($(this).find("button.d_button").length == 0) {
      trackid = $(this).children("a").data("id");
      if (trackid) {
        var button = $('<button data-id="' + trackid + '" type="button" title="Atsisiųsti" class="d_button"><i class="fa fa-download" style="font-size: 1.6em; margin-left: -0.5px;" aria-hidden="true"></i></button>');
        $(this).append(button);
      }
    }
  });

  //Make sure that only one event fires after the click.
  $(".d_button").unbind('click', clickHandler);
  $(".d_button").bind('click', clickHandler);
}

// Handler for clicks
var clickHandler = function () {
  uid = $(this).data("id");
  getSongInfo(uid);
}

// Monitoring URL changes.
var oldURL= ""
var urlChangeHandler = window.setInterval(checkURLChange, 200)
function checkURLChange(){
  newURL = document.URL;
  if(newURL !== oldURL){
   updatePage();
   oldURL = newURL;
  }
}
