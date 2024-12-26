import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn
  } from "typeorm";
  
  @Entity()
  export class OtpLogs {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column({type: 'nvarchar', nullable:true, default: ''})
    otp!: string;
  
    @Column({type: 'nvarchar', nullable:true, default: ''})
    Mobile!: string;
  
    @Column({type: 'nvarchar', nullable:true, default: ''})
    Message!: string;
  
    @Column({type: 'nvarchar', nullable:true, default: ''})
    Response!: string;
  
    @Column({type: 'nvarchar', nullable:true, default: ''})
    UserId!: string;
  
    @CreateDateColumn()
    CreatedDate!: Date;
  }
  