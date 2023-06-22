import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
  } from "typeorm";
  
  @Entity()
  export class external_logs {
    constructor(data) {
      Object.assign(this, data);
    }
  
    @PrimaryGeneratedColumn()
    id: number;

    @Column({default: null})
    table: string;

    @Column({default: null})
    user: string;

    @Column({default: null})
    type: string;

    @Column({default: null})
    hitting_time: string;
  
    @Column({default: null})
    method: string;
    
    @Column({default: null, type: 'text'})
    body: string

    @Column({default: null, type: 'text'})
    response: string

    @CreateDateColumn()
    created_at: Date;
  }
  