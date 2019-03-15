var _io;

function listen(socket) {
  const io = _io;
  const rooms = io.nsps['/'].adapter.rooms;

  socket.on('join', (room) => {
    socket.on('ready', () => {
      socket.broadcast.to(room).emit('ready', socket.id);
    });
    socket.on('offer', (id, message) => {
      socket.to(id).emit('offer', socket.id, message);
    });
    socket.on('answer', function (id, message) {
      socket.to(id).emit('answer', socket.id, message);
    });
    socket.on('candidate', function (id, message) {
      socket.to(id).emit('candidate', socket.id, message);
    });
    socket.on('disconnect', function() {
      socket.broadcast.to(room).emit('bye', socket.id);
    });
    socket.join(room);
  });
}

module.exports = (io) => {
  _io = io;
  return {listen}
};
