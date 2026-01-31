import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QuizService } from './quiz.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from 'src/config/jwt.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class QuizGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly quizService: QuizService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verifyToken(token);
      client.data.user = payload;

      console.log('WS connected:', client.id);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('joinSession')
  async joinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() sessionId: string,
  ) {
    const user = client.data.user;
    if (!user) return;

    client.join(sessionId);

    // 🔹 TEST EMIT
    this.server.to(sessionId).emit('question:started', {
      test: true,
      sessionId,
    });

    setTimeout(() => {
      this.server.to(sessionId).emit('question:ended');
    }, 5000);
  }
}
