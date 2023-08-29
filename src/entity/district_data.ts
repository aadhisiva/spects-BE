import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
  } from "typeorm";
import { master_data } from "./master_data";
  
  @Entity()
  export class district_data {
    constructor(data) {
      Object.assign(this, data);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({default: null})
    unique_id: string;
  
    @Column()
    code: string;

    @Column({default: null})
    mobile_number: string;

    @Column({default: null})
    name: string;

    @Column({default: null})
    unique_name: string;

    @Column({default: null})
    otp: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  