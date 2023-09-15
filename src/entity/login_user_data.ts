import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity()
  export class login_user_data {
    constructor(data) {
      Object.assign(this, data);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    user_unique_id: string;

    @Column({default: null})
    refractionist_id: string;

    @Column()
    user_mobile_number: string;

    @Column({default: null})
    type: string;
  
    @Column({default: null})
    password: string;
  
    @Column({default: null})
    otp: string;
  
    // @Column({ default: 0 })
    // status: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  