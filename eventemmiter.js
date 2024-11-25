const EventEmitter = require("events");

// Create and export the event emitter
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(0); // No limit on listeners

module.exports = eventEmitter;
