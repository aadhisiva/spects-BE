import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity()
  export class redirection_data {
    constructor(data) {
      Object.assign(this, data);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({default: null})
    mail_url: string;

    @Column({default: null})
    ekyc_url: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  