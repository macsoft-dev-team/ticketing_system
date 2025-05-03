import { Howl } from 'howler';

// ...existing code...

const alertSound = new Howl({
  src: ['path/to/alert-sound.mp3'], // Replace with the path to your audio file
  loop: true, // Enable continuous playback
});

function checkUnrespondedMessages(messages, threshold) {
  messages.forEach((message) => {
    if (!message.responded && Date.now() - message.timestamp > threshold) {
      if (!alertSound.playing()) {
        alertSound.play();
      }
    }
  });
}

// Example usage
setInterval(() => {
  const messages = getMessages(); // Replace with your function to fetch messages
  const threshold = 5 * 60 * 1000; // 5 minutes in milliseconds
  checkUnrespondedMessages(messages, threshold);
}, 60000); // Check every minute

// ...existing code...