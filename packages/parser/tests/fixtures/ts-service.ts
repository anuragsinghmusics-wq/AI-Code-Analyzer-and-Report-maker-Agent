import { Injectable } from '@nestjs/common';
import { Database } from './db';

@Injectable()
export class UserService {
  constructor(private db: Database) {}
  
  async findAll() {
    const users = await this.db.query('SELECT * FROM users');
    return users.map(u => u.name);
  }
}
