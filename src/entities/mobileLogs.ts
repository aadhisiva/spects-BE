import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn
  } from "typeorm";
  
  
  @Entity()
  export class MobileLogs {
  
    @PrimaryGeneratedColumn()
    id!: string;

    @Column({ type: "varchar", length: 255, default: null})
    Method!: string;

    @Column({ type: "varchar", length: 255, default: null})
    Code!: string;

    @Column({ type: "varchar", length: 255, default: null})
    UserId!: string;

    @Column({ type: "varchar", length: 255, default: null})
    Endpoint!: string;

    @Column({ type: "text", nullable: true })
    RequestBody!: string;

    @Column({ type: 'text', nullable: true })
    ResponseBody!: string;

    @CreateDateColumn()
    CreatedDate!: Date;
  };
  