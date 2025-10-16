import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// Configure the gateway to listen on port 3000 (same as our HTTP server)
// and allow cross-origin requests from our frontend app.
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173', // Your frontend URL
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // Create a logger instance for this gateway
  private readonly logger = new Logger(WebsocketGateway.name);

  // Get a reference to the underlying Socket.IO server instance
  @WebSocketServer()
  server: Server;

  // Lifecycle Hooks
  afterInit() {
    this.logger.log('🚀 WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔗 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
  }

  /**
   * Broadcasts an event with a payload to all connected clients.
   * @param event The name of the event to emit.
   * @param payload The data to send with the event.
   */
  broadcast(event: string, payload: any) {
    this.server.emit(event, payload);
    this.logger.log(`📢 Broadcasting event "${event}"`);
  }
}