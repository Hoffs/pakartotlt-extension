// Patches requests to stream1.pakartot.lt to have required referer header.
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    details.requestHeaders.push({ name: 'Referer', value:'https://www.pakartot.lt' });
    return { requestHeaders: details.requestHeaders };
  },
  { urls: [ "https://stream1.pakartot.lt/mp3.php*" ] },
  [ "blocking", "requestHeaders", "extraHeaders" ]
);

function handleRequest(message, sender, sendResponse) {
  const { songId, extraData } = message;
  if (songId === undefined) {
    return;
  }

  const url = "https://stream1.pakartot.lt/mp3.php?file=" + songId;
  fetch(url)
    .then((response) => {
      return response.arrayBuffer();
    })
    .then((buffer) => {
      const blob = new Blob([ buffer ], { type: "audio/mpeg" });
      const blobUrl = URL.createObjectURL(blob);
      sendResponse({ blobUrl, ...extraData });
    });

  return true;
}

chrome.runtime.onMessage.addListener(handleRequest);
