$(document).ready(function () {
  $('#blocker_downl').remove();
  updatePage();
});

const defaultAlbumIcon = "https://www.pakartot.lt/app/templates/default8/assets//images/default/album_90.jpg";
const toastBg = "#13131f";

const getTags = async (json) => {
  const artists = [];
  $('div.m-greytitle > a').each((index, el) => { artists.push($(el).html()) });
  const url = json['info']['photo_path'] || defaultAlbumIcon;

  // SVG's dont work well with ID3/tags
  if (url.endsWith('svg')) {
    url = defaultAlbumIcon;
  }

  const image = await fetch(url);
  const imageArrBuff = await image.arrayBuffer();
  return {
    TIT2: json['info']['title'],
    TPE1: artists,
    TLEN: (json['info']['length'].split(':')[0] * 60) + (json['info']['length'].split(':')[1]) * 1000,
    // TYER: $('div.left_column_c').children().last().text().trim(),
    TALB: $('div.m-album-title').text().trim(),
    WCOP: 'Lietuvos gretutinių teisių asociacija AGATA',
    WOAS: window.location.href,
    TRCK: $(`a[data-id=${uid}]`).parent().parent().index() + 1,
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
      console.log(json)
      const fileUrl = json['info']['filename'];
      const songName = json['info']['artist'].substr(1, json['info']['artist'].length) + " - " + json['info']['title'] + ".mp3";
      downloadStartNotification(songName);
      downloadSong(fileUrl, songName, json);
    })
}

function downloadSong(url, name, json) {
  totalDownloads = totalDownloads + 1;
  updateDownloadToast();
  chrome.runtime.sendMessage({ songId: url.split("?file=")[1], extraData: { name, json } }, {}, handleSongDownload);
}

async function handleSongDownload(response) {
  const { blobUrl, json, name } = response;
  const tags = await getTags(json);

  fetch(blobUrl)
    .then((response) => {
      return response.arrayBuffer();
    })
    .then((buffer) => {
      URL.revokeObjectURL(blobUrl); // After getting buffer, revoke stored blob.

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
    bgColor: toastBg,
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
var toastPos = { left: 20, bottom: 80 }

function updateDownloadToast() {
  if (typeof downloadToast == 'undefined') {
    downloadToast = $.toast({
      text: "<div class='loading' style='display: inline-flex;'></div><p style='font-size: 15px; padding-top: 5px;'>Atsiųstos " + currentDownloaded + "/" + totalDownloads + " dainos.</p>",
      showHideTransition: "slide",
      loader: false,
      bgColor: toastBg,
      textColor: "white",
      hideAfter: "false",
      textAlign: "center",
      position: toastPos
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
    if ($(this).find("button").length == 0) {
      trackid = $(this).children("a").data("id");
      if (trackid) {
        const title = $("#playernode").length == 0 ? "Neprisijungta" : "Atsisiųsti";
        const disabled = $("#playernode").length == 0 ? "disabled" : "";
        const button = $('<button data-id="' + trackid + '" type="button" title="'+title+'" '+disabled+'><i class="fa fa-download" style="font-size: 1.6em; margin-left: -0.5px;" aria-hidden="true"></i></button>');
        $(this).append(button);

        button.unbind('click', clickHandler);
        button.bind('click', clickHandler);
      }
    }
  });

  //Make sure that only one event fires after the click.
}

// Handler for clicks
const clickHandler = function () {
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
