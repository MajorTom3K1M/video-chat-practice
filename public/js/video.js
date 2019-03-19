var socket = io();

const localVideo = document.querySelector('.localVideo');
const remoteVideos = document.querySelector('.remoteVideos');
const peerConnections = {};

let room = !location.pathname.substring(1) ? 'home' : location.pathname.substring(1);
let getUserMediaAttempts = 5;
let gettingUserMedia = false;

const configuration = {
  // Uses Google's STUN server
  iceServers: [{url:'stun:stun01.sipphone.com'},
                {url:'stun:stun.ekiga.net'},
                {url:'stun:stun.fwdnet.net'},
                {url:'stun:stun.ideasip.com'},
                {url:'stun:stun.iptel.org'},
                {url:'stun:stun.rixtelecom.se'},
                {url:'stun:stun.schlund.de'},
                {url:'stun:stun.l.google.com:19302'},
                {url:'stun:stun1.l.google.com:19302'},
                {url:'stun:stun2.l.google.com:19302'},
                {url:'stun:stun3.l.google.com:19302'},
                {url:'stun:stun4.l.google.com:19302'},
                {url:'stun:stunserver.org'},
                {url:'stun:stun.softjoys.com'},
                {url:'stun:stun.voiparound.com'},
                {url:'stun:stun.voipbuster.com'},
                {url:'stun:stun.voipstunt.com'},
                {url:'stun:stun.voxgratia.org'},
                {url:'stun:stun.xten.com'},
                {
                	url: 'turn:numb.viagenie.ca',
                	credential: 'muazkh',
                	username: 'webrtc@live.com'
                },
                {
                	url: 'turn:192.158.29.39:3478?transport=udp',
                	credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                	username: '28224511:1379330808'
                },
                {
                	url: 'turn:192.158.29.39:3478?transport=tcp',
                	credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                	username: '28224511:1379330808'
                }]
};

const constraints = {
  video: {facingMode: "user"}
}

if (room && !!room) {
  socket.emit('join', room);
}

socket.on('bye', function(id) {
  handleRemoteHangup(id);
});

window.onunload = window.onbeforeunload = function() {
  socket.close();
};

socket.on('ready', function(id) {
  if (!(localVideo instanceof HTMLVideoElement) || !localVideo.srcObject) {
    return;
  }
  const peerConnection = new RTCPeerConnection(configuration);
  peerConnections[id] = peerConnection;
  if (localVideo instanceof HTMLVideoElement) {
    //localVideo.srcObject.getTracks().forEach(track => peerConnection.addTrack(track, localVideo.srcObject));
    peerConnection.addStream(localVideo.srcObject);
  }
  peerConnection.createOffer()
  .then(sdp => peerConnection.setLocalDescription(sdp))
  .then(function () {
    socket.emit('offer', id, peerConnection.localDescription);
  });
  //peerConnection.ontrack = event => handleRemoteStreamAdded(event.stream, id)
  peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id);;
  peerConnection.onicecandidate = function(event) {
    if (event.candidate) {
      socket.emit('candidate', id, event.candidate);
    }
  };
});

socket.on('offer', function(id, description) {
  const peerConnection = new RTCPeerConnection(configuration);
  peerConnections[id] = peerConnection;
  if (localVideo instanceof HTMLVideoElement) {
    //localVideo.srcObject.getTracks().forEach(track => peerConnection.addTrack(track, localVideo.srcObject))
    peerConnection.addStream(localVideo.srcObject);
  }
  peerConnection.setRemoteDescription(description)
  .then(() => peerConnection.createAnswer())
  .then(sdp => peerConnection.setLocalDescription(sdp))
  .then(function() {
    socket.emit('answer', id, peerConnection.localDescription);
  });
  //peerConnection.ontrack = event => handleRemoteStreamAdded(event.stream, id);
  peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id);
  peerConnection.onicecandidate = function(event) {
    if (event.candidate) {
      socket.emit('candidate', id, event.candidate);
    }
  }
});

socket.on('candidate', function(id, candidate) {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate))
  .catch(e => console.error(e));
});

socket.on('answer', function(id, description) {
  peerConnections[id].setRemoteDescription(description);
});

function getUserMediaSuccess(stream) {
  gettingUserMedia = false;
  if (localVideo instanceof HTMLVideoElement) {
    !localVideo.srcObject && (localVideo.srcObject = stream);
  }
  socket.emit('ready');
}

  function handleRemoteStreamAdded(stream, id) {
    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = stream;
    remoteVideo.setAttribute("id", id.replace(/[^a-zA-Z]+/g, "").toLowerCase());
    remoteVideo.setAttribute("playsinline", "true");
    remoteVideo.setAttribute("autoplay", "true");
    remoteVideos.appendChild(remoteVideo);
    if (remoteVideos.querySelectorAll("video").length === 1) {
      remoteVideos.setAttribute("class", "one remoteVideos");
    } else {
      remoteVideos.setAttribute("class", "remoteVideos");
    }
  }

  function getUserMediaError(error) {
    console.error(error);
    gettingUserMedia = false;
    (--getUserMediaAttempts > 0) && setTimeout(getUserMediaDevices, 1000);
  }

  function getUserMediaDevices() {
    if (localVideo instanceof HTMLVideoElement) {
      if (localVideo.srcObject) {
        getUserMediaSuccess(localVideo.srcObject);
      } else if (!gettingUserMedia && !localVideo.srcObject) {
        gettingUserMedia = true;
        navigator.mediaDevices.getUserMedia(constraints)
        .then(getUserMediaSuccess)
        .catch(getUserMediaError);
      }
    }
  }

  function handleRemoteHangup(id) {
    peerConnections[id] && peerConnections[id].close();
    delete peerConnections[id];
    document.querySelector("#" + id.replace(/[^a-zA-Z]+/g, "").toLowerCase()).remove();
    if (remoteVideos.querySelectorAll("video").length === 1) {
      remoteVideos.setAttribute("class", "one remoteVideos");
    } else {
      remoteVideos.setAttribute("class", "remoteVideos");
    }
  }

getUserMediaDevices();
