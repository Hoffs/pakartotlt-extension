$(document).ready(function () {
  $('#blocker_downl').remove();
  updatePage();
});

const getTags = async (json) => {
  let artists = [];
  $('div.greytitle > a').each((index, el) => { artists.push($(el).html()) });
  const url = ($('.item-cover > img').attr('src') !== undefined) 
    ? $('.item-cover > img').attr('src') 
    : "https://www.pakartot.lt/app/templates/default4/assets/images/frontend/default/default-big.png"; 
  const image = await fetch(url);
  const imageArrBuff = await image.arrayBuffer();
  return { 
    TIT2: json['info']['title'],
    TPE1: artists,
    TLEN: (json['info']['length'].split(':')[0] * 60) + (json['info']['length'].split(':')[1]) * 1000,
    TYER: $('div.left_column_c').children().last().text().trim(),
    TALB: $('div.main-title').children().first().text().trim(),
    WCOP: 'Lietuvos gretutinių teisių asociacija AGATA',
    WOAS: window.location.href,
    TRCK: $(`a[data-id=${uid}]`).parent().prev().html(),
    APIC: {
      type: 3,
      data: imageArrBuff,
      description: 'album cover',
    },
  }
}

//Functions for funciontality (thats sounds good)
function getSongInfo(uid) {
  $.post("https://www.pakartot.lt/api/backend/frontend/player/play.php", { type: "tid", id: uid })
    .done((data) => {
      json = JSON.parse(data);
      let fileUrl = json['info']['filename'];
      let songName = json['info']['artist'].substr(1, json['info']['artist'].length) + " - " + json['info']['title'] + ".mp3";
      getTags(json)
        .then((tags) => {
          downloadStartNotification(songName);
          downloadSong(fileUrl, songName, tags);
        })
    })
}

async function downloadSong(url, name, tags) {
  totalDownloads = totalDownloads + 1;
  updateDownloadToast();
  fetch(url)
    .then((response) => {
      return response.arrayBuffer(); 
    })
    .then((buffer) => {
      const writer = new ID3Writer(buffer);
      Object.keys(tags).forEach((tag) => {
        writer.setFrame(tag, tags[tag]);
      });
      writer.addTag();
      return writer.getBlob();
    })
    .then((myBlob) => {
      saveAs(myBlob, name);
      currentDownloaded = currentDownloaded + 1;
      updateDownloadToast();
    });
}

// Notifications toast
function downloadStartNotification(song) {
  $.toast({
    text: "Pradeta siųsti daina " + song + ".",
    showHideTransition: "slide",
    bgColor: "#2f2e2e",
    loader: false,
    textColor: "white",
    hideAfter: 3000,
    stack: 5,
    textAlign: "center",
    position: "bottom-right"
  });
}

// Downloading toast
var totalDownloads = 0;
var currentDownloaded = 0;
var downloadToast = undefined;

function updateDownloadToast() {
  if (typeof downloadToast == 'undefined') {
    downloadToast = $.toast({
      text: "<div class='loading' style='display: inline-flex;'></div><p style='font-size: 15px; padding-top: 5px;'>Atsiųstos " + currentDownloaded + "/" + totalDownloads + " dainos.</p>",
      showHideTransition: "slide",
      loader: false,
      bgColor: "#2f2e2e",
      textColor: "white",
      hideAfter: "false",
      textAlign: "center",
      position: "bottom-left"
    });
  } else if (totalDownloads != currentDownloaded) {
    downloadToast.update({
      text: "<div class='loading' style='display: inline-flex;'></div><p style='font-size: 15px; padding-top: 5px;'>Atsiųstos " + currentDownloaded + "/" + totalDownloads + " dainos.</p>"
    });
  } else if (totalDownloads == currentDownloaded) {
    downloadToast.update({
      text: "<div class='loading' style='display: inline-flex;'></div><p style='font-size: 15px; padding-top: 5px;'>Atsiųstos " + currentDownloaded + "/" + totalDownloads + " dainos.</p>",
      hideAfter: 5000
    });
    downloadToast = undefined;
    totalDownloads = 0;
    currentDownloaded = 0;
  }
}

// Listening for URL changes to update page.
function updatePage() {
  $(".play").each(function (data) {
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
var oldURL = ""
var urlChangeHandler = window.setInterval(checkURLChange, 200)
function checkURLChange() {
  newURL = document.URL;
  if (newURL !== oldURL) {
    updatePage();
    oldURL = newURL;
  }
}
