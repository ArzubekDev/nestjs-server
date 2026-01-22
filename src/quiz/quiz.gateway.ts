// quiz.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';

interface Player {
  id: string;
  username: string;
  score: number;
}

interface QuizSession {
  code: string;
  hostId: string;
  players: Player[];
  state: 'WAITING' | 'STARTED' | 'QUESTION' | 'FINISHED';
  currentQuestionIndex: number;
}

const sessions: Record<string, QuizSession> = {};

@WebSocketGateway({ cors: true })
export class QuizGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Optional: remove from sessions
  }

  @SubscribeMessage('createLobby')
  createLobby(
    @MessageBody() data: { hostId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const code = nanoid(6).toUpperCase();
    sessions[code] = {
      code,
      hostId: client.id,
      players: [],
      state: 'WAITING',
      currentQuestionIndex: 0,
    };
    client.join(code);
    return { code };
  }

  @SubscribeMessage('joinLobby')
  joinLobby(
    @MessageBody() data: { code: string; username: string },
    @ConnectedSocket() client: Socket,
  ) {
    const session = sessions[data.code];
    if (!session) return { error: 'Session not found' };

    const player: Player = { id: client.id, username: data.username, score: 0 };
    session.players.push(player);
    client.join(data.code);

    // Notify all players
    this.server.to(data.code).emit('playerList', session.players);
    return { success: true };
  }

  @SubscribeMessage('startGame')
  startGame(@MessageBody() data: { code: string }) {
    const session = sessions[data.code];
    if (!session) return { error: 'Session not found' };

    session.state = 'STARTED';
    this.server.to(data.code).emit('gameStarted');
  }
}
