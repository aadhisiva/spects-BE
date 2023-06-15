import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
  } from "typeorm";
  
  @Entity()
  export class tracker_data {
    constructor(data) {
      Object.assign(this, data);
    }
  
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: string;
  
    @Column()
    resposne_time: string;
  
    @Column()
    hitting_time: string;
  }
  